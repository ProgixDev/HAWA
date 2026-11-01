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
  da: {
    shareMessage: 'Glemt pille: hvad gør du? — AWA',
    badge: 'GLEMT PILLE',
    title: 'Glemt pille:\nhvad gør du?',
    metaDuration: '7 min læsning',
    metaType: 'Spørgsmål og svar',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemgået indhold',
    intro: 'Enhver kvinde kan glemme en pille. Hvad du skal gøre afhænger primært af, hvor lang tid siden det skete, typen af pille, og på hvilket tidspunkt i pakken det skete.',
    importantTitle: 'Vigtigt',
    importantText: 'Gå ikke i panik. Tjek først præcis hvilken type pille du tager, og læs indlægssedlen for at vide, hvad du skal gøre.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Mindre end 12 timers forsinkelse',
      'Mere end 12 timers forsinkelse',
      'Situationer der kræver ekstra opmærksomhed',
      'Indlægssedlen er din pålidelige kilde',
      'Hvornår du skal søge råd',
      'Vigtige pointer',
    ],
    body1: 'For visse piller kompromitterer en forsinkelse på under 12 timer generelt ikke den kontraceptive beskyttelse. Det generelle råd i dette tilfælde er at tage den glemte pille så hurtigt som muligt og derefter fortsætte resten af pakken til normal tid.',
    step1Title: 'Tag pillen',
    step1Text: 'Tag den, så snart du indser, at du har glemt den.',
    step2Title: 'Fortsæt som normalt',
    step2Text: 'Vend derefter tilbage til din normale plan for de næste piller.',
    tip1Title: 'Godt at vide',
    tip1Text: 'At tage den glemte pille og derefter den sædvanlige kan betyde, at du tager to piller på samme dag.',
    body2: 'Hvis den godkendte tid for din pille er overskredet, kan beskyttelsen reduceres. Hvad du skal gøre afhænger af pilletypen, antallet af glemte piller og på hvilket tidspunkt i pakken det skete.',
    alertTitle: 'Advarsel',
    alertText: 'Stol ikke udelukkende på antallet af timer angivet her: nogle pilleanvisninger er forskellige. Tjek altid din pillens indlægsseddel.',
    reflexesTitle: 'Hvad du skal gøre først',
    checkPoints: [
      {
        title: 'Reagér hurtigt',
        text: 'Jo hurtigere du reagerer efter at have opdaget, at du glemte pillen, jo nemmere er det at følge de rette råd.',
      },
      {
        title: 'Tjek indlægssedlen',
        text: 'Rådene kan variere afhængigt af præcis pilletype og antallet af glemte piller.',
      },
      {
        title: 'Planlæg ekstra beskyttelse',
        text: 'I visse situationer kan brug af kondom i en bestemt periode anbefales.',
      },
    ],
    body3: 'Ikke alle situationer er ens. I visse tilfælde af glemte piller er det nødvendigt at tjekke rådene mere specifikt.',
    situations: [
      {
        title: 'Kun én pille glemt',
        text: 'Hvad du skal gøre afhænger primært af, hvor lang tid der er gået siden det normale tidspunkt.',
      },
      {
        title: 'Flere piller glemt',
        text: 'Denne situation kræver særlig opmærksomhed, og det er bedre at tjekke indlægssedlen specifikt.',
      },
      {
        title: 'Usikker på hvad du skal gøre',
        text: 'En farmaceut eller sundhedsprofessionel kan hjælpe dig med hurtigt at identificere det rigtige skridt.',
      },
    ],
    body4: 'Din pillens indlægsseddel indeholder specifikke anvisninger for netop det lægemiddel, du tager. Rådene kan variere, alt efter om det er en kombinationspille eller en mini-pille.',
    referenceTitle: 'Nyttigt at have ved hånden',
    referenceTips: [
      'Opbevar indlægssedlen ved hånden (f.eks. et foto på din telefon)',
      'Kontakt en farmaceut ved hurtige spørgsmål',
      'Gå til lægen, hvis det sker hyppigt',
    ],
    guideTitle: 'Hvorfor er tidspunktet for den glemte pille vigtigt?',
    guideText: 'På hvilket tidspunkt i pakken pillen glemmes, kan ændre, hvad du skal gøre. Det er derfor indlægssedlen ofte giver forskellige råd afhængigt af pakkens uge.',
    body5: 'Det er bedre at søge råd end at forblive i tvivl om, hvad man skal gøre. En farmaceut, jordemoder eller læge kan hjælpe dig med at verificere det råd, der passer til din situation.',
    questionTitle: 'Information, du bør have ved hånden',
    questions: [
      'Præcis hvilken type pille er det?',
      'Hvor lang tid er der gået siden det normale tidspunkt?',
      'Hvor mange piller er glemt?',
      'På hvilket stadium af pakken skete det?',
      'Har der nylig været ubeskyttet sex?',
    ],
    proTipTitle: 'Godt at vide',
    proTipText: 'Søg hurtigt professionel rådgivning for at kende dine muligheder, hvis der var ubeskyttet sex tæt på tidspunktet for den glemte pille.',
    repeatTitle: 'Hvis piller glemmes gentagne gange',
    body6: 'Hyppigt glemte piller kan være et tegn på, at den daglige rutine ikke passer helt til din livsstil. Tøv ikke med at tale med en sundhedsprofessionel om at undersøge andre præventionsmetoder.',
    methodTipTitle: 'En anden metode?',
    methodTipText: 'Hvis det er svært at huske at tage en pille dagligt, findes der andre metoder med et andet brugsforhold.',
    summaryTitle: 'Sammenfatning',
    summaryItems: [
      'Reagér, så snart du opdager, at du har glemt en pille.',
      'Tjek præcis hvilken type pille du tager.',
      'Læs indlægssedlen for specifik vejledning.',
      'Brug ekstra beskyttelse, hvis indlægssedlen anbefaler det.',
      'Søg råd ved tvivl eller efter ubeskyttet sex.',
    ],
    finalTipTitle: 'Vigtigste pointer',
    finalTipText: 'En glemt pille betyder ikke nødvendigvis, at din prævention har holdt op med at virke. Det rigtige at gøre afhænger af pilletypen og omstændighederne ved forsømmelsen. Tjek indlægssedlen ved tvivl og søg råd hurtigt.',
    disclaimerText: 'Denne artikel er udelukkende til informationsformål og erstatter ikke din pillens indlægsseddel eller personlig medicinsk rådgivning. Rådene kan variere afhængigt af pilletypen.',
  },
  sv: {
    shareMessage: 'Glemt pille: hvad gör du? — AWA',
    badge: 'GLEMT PILLE',
    title: 'Glemt pille:\nhvad gör du?',
    metaDuration: '7 min läsning',
    metaType: 'Spörgsmål och svar',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemgået indhold',
    intro: 'Enhver kvinna kan glemme en pille. Hvad du skal göre afhänger primärt av, hvor lang tid siden det skete, typen av pille, och på hvilket tidspunkt i pakken det skete.',
    importantTitle: 'Vigtigt',
    importantText: 'Gå inte i panik. Tjek först präcis hvilken type pille du tager, och läs indlägssedlen for att vide, hvad du skal göre.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Mindre end 12 timers forsinkelse',
      'Mere end 12 timers forsinkelse',
      'Situationer der kräver ekstra opmärksomhed',
      'Indlägssedlen ar din pålidelige kilde',
      'Hvornår du skal söge råd',
      'Vigtige pointer',
    ],
    body1: 'For visse piller kompromitterer en forsinkelse på under 12 timer generelt inte den kontraceptive beskyttelse. Det generelle råd i dette tilfälde ar at tage den glemte pille så hurtigt som muligt och derefter fortsätte resten av pakken till normal tid.',
    step1Title: 'Tag pillen',
    step1Text: 'Tag den, så snart du indser, at du har glemt den.',
    step2Title: 'Fortsät som normalt',
    step2Text: 'Vend derefter tilbage till din normale plan for de näste piller.',
    tip1Title: 'Godt at vide',
    tip1Text: 'At tage den glemte pille och derefter den sädvanlige kan betyde, at du tager to piller på samme dag.',
    body2: 'Hvis den godkendte tid for din pille ar overskredet, kan beskyttelsen reduceres. Hvad du skal göre afhänger av pilletypen, antallet av glemte piller och på hvilket tidspunkt i pakken det skete.',
    alertTitle: 'Advarsel',
    alertText: 'Stol inte udelukkende på antallet av timer angivet her: nogle pilleanvisninger ar forskellige. Tjek alltid din pillens indlägsseddel.',
    reflexesTitle: 'Hvad du skal göre först',
    checkPoints: [
      {
        title: 'Reagér hurtigt',
        text: 'Jo hurtigere du reagerer efter at have opdaget, at du glemte pillen, jo nemmere ar det at fölge de rette råd.',
      },
      {
        title: 'Tjek indlägssedlen',
        text: 'Rådene kan variere afhängigt av präcis pilletype och antallet av glemte piller.',
      },
      {
        title: 'Planläg ekstra beskyttelse',
        text: 'I visse situationer kan brug av kondom i en bestemt periode anbefales.',
      },
    ],
    body3: 'Ikke alla situationer ar ens. I visse tilfälde av glemte piller ar det nödvendigt at tjekke rådene mere specifikt.',
    situations: [
      {
        title: 'Kun én pille glemt',
        text: 'Hvad du skal göre afhänger primärt av, hvor lang tid der ar gået siden det normale tidspunkt.',
      },
      {
        title: 'Flere piller glemt',
        text: 'Denne situation kräver särlig opmärksomhed, och det ar bedre at tjekke indlägssedlen specifikt.',
      },
      {
        title: 'Usikker på hvad du skal göre',
        text: 'En farmaceut eller halsasprofessionel kan hjälpe dig med hurtigt at identificere det rigtige skridt.',
      },
    ],
    body4: 'Din pillens indlägsseddel indeholder specifikke anvisninger for netop det lägemiddel, du tager. Rådene kan variere, alt efter om det ar en kombinationspille eller en mini-pille.',
    referenceTitle: 'Nyttigt at have ved hånden',
    referenceTips: [
      'Opbevar indlägssedlen ved hånden (f.eks. et foto på din telefon)',
      'Kontakt en farmaceut ved hurtige spörgsmål',
      'Gå till lägen, hvis det sker hyppigt',
    ],
    guideTitle: 'Hvorfor ar tidspunktet for den glemte pille vigtigt?',
    guideText: 'På hvilket tidspunkt i pakken pillen glemmes, kan ändre, hvad du skal göre. Det ar derfor indlägssedlen ofta giver forskellige råd afhängigt av pakkens vecka.',
    body5: 'Det ar bedre at söge råd end at forblive i tvivl om, hvad man skal göre. En farmaceut, jordemoder eller läge kan hjälpe dig med at verificere det råd, der passer till din situation.',
    questionTitle: 'Information, du bör have ved hånden',
    questions: [
      'Präcis hvilken type pille ar det?',
      'Hvor lang tid ar der gået siden det normale tidspunkt?',
      'Hvor mange piller ar glemt?',
      'På hvilket stadium av pakken skete det?',
      'Har der nylig väret ubeskyttet sex?',
    ],
    proTipTitle: 'Godt at vide',
    proTipText: 'Sög hurtigt professionel rådgivning for att kende dina muligheder, hvis der var ubeskyttet sex tät på tidspunktet for den glemte pille.',
    repeatTitle: 'Hvis piller glemmes gentagne gange',
    body6: 'Hyppigt glemte piller kan väre et tegn på, at den daglige rutine inte passer helt till din livsstil. Töv inte med at tale med en halsasprofessionel om at undersöge andre präventionsmetoder.',
    methodTipTitle: 'En anden metode?',
    methodTipText: 'Hvis det ar svärt at huske at tage en pille dagligt, findes der andre metoder med et andet brugsforhold.',
    summaryTitle: 'Sammenfatning',
    summaryItems: [
      'Reagér, så snart du opdager, at du har glemt en pille.',
      'Tjek präcis hvilken type pille du tager.',
      'Läs indlägssedlen for specifik vejledning.',
      'Brug ekstra beskyttelse, hvis indlägssedlen anbefaler det.',
      'Sög råd ved tvivl eller efter ubeskyttet sex.',
    ],
    finalTipTitle: 'Vigtigste pointer',
    finalTipText: 'En glemt pille betyder inte nödvendigvis, at din prävention har holdt op med at virke. Det rigtige at göre afhänger av pilletypen och omständighederne ved forsömmelsen. Tjek indlägssedlen ved tvivl och sög råd hurtigt.',
    disclaimerText: 'Denne artikel ar udelukkende till informationsformål och erstatter inte din pillens indlägsseddel eller personlig medicinsk rådgivning. Rådene kan variere afhängigt av pilletypen.',
  },
  nb: {
    shareMessage: 'Glemt pille: hva bør du gjøre? – AWA',
    badge: 'GLEMT PILLE',
    title: 'Glemt pille:\nhva bør du gjøre?',
    metaDuration: '7 min lesing',
    metaType: 'Vanlige spørsmål',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro: 'En glemt pille kan skje hvem som helst. Hva du bør gjøre, avhenger i hovedsak av hvor lenge siden du glemte den, hvilken type pille det er, og når i pakken det skjer.',
    importantTitle: 'Det viktigste',
    importantText: 'Ikke få panikk. Kontroller først nøyaktig hvilken type pille du bruker, og les pakningsvedlegget for å se hva som anbefales.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Mindre enn 12 timer forsinket',
      'Mer enn 12 timer forsinket',
      'Situasjoner som krever ekstra oppmerksomhet',
      'Pakningsvedlegget er din referanse',
      'Når du bør be om råd',
      'Det viktigste å huske',
    ],
    body1: 'For noen piller svekker en forsinkelse på mindre enn 12 timer vanligvis ikke den prevensjonsbeskyttelsen. I så fall er den vanlige anbefalingen å ta den glemte pillen så snart som mulig og deretter fortsette pakken til vanlig tid.',
    step1Title: 'Ta pillen',
    step1Text: 'Ta pillen så snart du merker at du er forsinket.',
    step2Title: 'Fortsett som vanlig',
    step2Text: 'Gå deretter tilbake til vanlig timeplan for de neste pillene.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Hvis du tar den glemte pillen og deretter den som er planlagt til vanlig tid, kan det hende at to piller tas samme dag.',
    body2: 'Når forsinkelsen overstiger tiden som er tillatt for pillen din, kan beskyttelsen være redusert. Hva du da bør gjøre, avhenger av type pille, antall glemte piller og hvor i pakken den glemte pillen ligger.',
    alertTitle: 'Advarsel',
    alertText: 'Ikke stol bare på antall timer som er oppgitt her: noen piller har andre anvisninger. Les alltid pakningsvedlegget til legemidlet ditt.',
    reflexesTitle: 'Første ting å gjøre',
    checkPoints: [
      {title: 'Reager raskt', text: 'Jo raskere du reagerer etter at du oppdager den glemte pillen, desto lettere er det å følge de riktige anbefalingene.'},
      {title: 'Les pakningsvedlegget', text: 'Anvisningene kan variere avhengig av nøyaktig type pille og antall glemte piller.'},
      {title: 'Planlegg ekstra beskyttelse', text: 'I noen situasjoner kan kondom anbefales i en bestemt periode.'},
    ],
    body3: 'Ikke alle situasjoner er like. Noen glemte piller krever en mer presis kontroll av anbefalingene.',
    situations: [
      {title: 'Bare én pille glemt', text: 'Hva du bør gjøre, avhenger i hovedsak av tiden som har gått siden vanlig inntakstidspunkt.'},
      {title: 'Mer enn én pille glemt', text: 'Denne situasjonen krever særlig oppmerksomhet, og det er best å lese pakningsvedlegget nøye.'},
      {title: 'Usikker på hva du bør gjøre', text: 'Et apotek eller helsepersonell kan raskt hjelpe deg å finne riktig fremgangsmåte.'},
    ],
    body4: 'Pakningsvedlegget til pillen din gir de presise anvisningene for legemidlet du bruker. Anbefalingene kan være forskjellige avhengig av om det er en kombinasjonspille eller en minipille med bare gestagen.',
    referenceTitle: 'Nyttige ting å sjekke',
    referenceTips: [
      'Ha pakningsvedlegget lett tilgjengelig (for eksempel et bilde på telefonen)',
      'Kontakt et apotek hvis du har et raskt spørsmål',
      'Gå til lege hvis det skjer ofte',
    ],
    guideTitle: 'Hvorfor spiller tidspunktet for den glemte pillen en rolle?',
    guideText: 'Når i pakken den glemte pillen ligger, kan endre hva du bør gjøre. Det er derfor pakningsvedlegget ofte gir ulike anbefalinger avhengig av uken i pakken.',
    body5: 'Hvis du ikke vet hva du bør gjøre, er det bedre å be om råd enn å forbli i tvil. Et apotek, en jordmor eller en lege kan hjelpe deg å kontrollere anbefalingene som passer din situasjon.',
    questionTitle: 'Informasjon å ha klar',
    questions: [
      'Hvilken nøyaktig type pille er det?',
      'Hvor lang tid har gått siden vanlig tidspunkt?',
      'Hvor mange piller ble glemt?',
      'På hvilket tidspunkt i pakken skjedde den glemte pillen?',
      'Har det vært ubeskyttet sex nylig?',
    ],
    proTipTitle: 'Godt å vite',
    proTipText: 'Hvis det har vært ubeskyttet sex rundt tidspunktet for den glemte pillen, spør en fagperson om råd raskt for å finne ut hvilke muligheter som finnes.',
    repeatTitle: 'Hvis du stadig glemmer piller',
    body6: 'Hyppige glemte piller kan være et tegn på at den daglige rutinen ikke helt passer livsstilen din. Ikke nøl med å snakke med helsepersonell for å utforske andre prevensjonsalternativer.',
    methodTipTitle: 'En annen metode?',
    methodTipText: 'Hvis det er vanskelig å holde på med en pille hver dag, finnes det andre metoder med en annen bruksfrekvens.',
    summaryTitle: 'Det viktigste',
    summaryItems: [
      'Reager så snart du oppdager den glemte pillen.',
      'Kontroller nøyaktig hvilken type pille du bruker.',
      'Les pakningsvedlegget for å finne den presise fremgangsmåten.',
      'Bruk ekstra beskyttelse hvis pakningsvedlegget anbefaler det.',
      'Be om råd ved tvil eller etter et risikofylt samleie.',
    ],
    finalTipTitle: 'Det viktigste å huske',
    finalTipText: 'En glemt pille betyr ikke automatisk at prevensjonen din har sluttet å virke. Riktig fremgangsmåte avhenger av type pille og omstendighetene rundt den glemte dosen. Ved tvil bør du lese pakningsvedlegget og raskt be om råd.',
    disclaimerText: 'Denne artikkelen er kun til informasjon og erstatter ikke pakningsvedlegget til legemidlet ditt eller personlig medisinsk rådgivning. Anbefalingene kan variere avhengig av type pille.',
  },
  pl: {
    shareMessage: 'Pominięta tabletka: co robić? — AWA',
    badge: 'POMINIĘTA TABLETKA',
    title: 'Pominięta tabletka:\nco robić?',
    metaDuration: '7 min czytania',
    metaType: 'FAQ',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Pominięta tabletka może się zdarzyć każdemu. To, co robić, zależy głównie od tego, jak dawno ją pominięto, od rodzaju tabletki i od momentu w opakowaniu.',
    importantTitle: 'Najważniejsze',
    importantText: 'Bez paniki. Najpierw sprawdź dokładny rodzaj swojej tabletki i zajrzyj do ulotki, aby poznać zalecane postępowanie.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Spóźnienie krótsze niż 12 godzin',
      'Spóźnienie dłuższe niż 12 godzin',
      'Sytuacje wymagające dodatkowej uwagi',
      'Ulotka jest Twoim punktem odniesienia',
      'Kiedy zasięgnąć porady',
      'Najważniejsze wnioski',
    ],
    body1: 'W przypadku niektórych tabletek spóźnienie krótsze niż 12 godzin zasadniczo nie narusza ochrony antykoncepcyjnej. W takim przypadku zwykle zaleca się przyjęcie pominiętej tabletki jak najszybciej, a następnie kontynuowanie opakowania o zwykłej porze.',
    step1Title: 'Przyjmij tabletkę',
    step1Text: 'Przyjmij tabletkę, gdy tylko zauważysz spóźnienie.',
    step2Title: 'Kontynuuj jak zwykle',
    step2Text: 'Następnie wróć do zwykłego harmonogramu dla kolejnych tabletek.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Jeśli przyjmiesz pominiętą tabletkę, a potem tę zaplanowaną na zwykłą porę, może się zdarzyć, że w jednym dniu przyjmiesz dwie tabletki.',
    body2: 'Gdy spóźnienie przekracza czas dopuszczalny dla Twojej tabletki, ochrona może być zmniejszona. To, co robić wtedy, zależy od rodzaju tabletki, liczby pominiętych tabletek i miejsca pominiętej tabletki w opakowaniu.',
    alertTitle: 'Uwaga',
    alertText: 'Nie opieraj się wyłącznie na podanej tu liczbie godzin: niektóre tabletki mają inne zalecenia. Zawsze sprawdź ulotkę swojego leku.',
    reflexesTitle: 'Pierwsze kroki',
    checkPoints: [
      {title: 'Reaguj szybko', text: 'Im szybciej zareagujesz po zauważeniu pominiętej tabletki, tym łatwiej zastosować odpowiednie zalecenia.'},
      {title: 'Sprawdź ulotkę', text: 'Zalecenia mogą się różnić w zależności od dokładnego rodzaju tabletki i liczby pominiętych tabletek.'},
      {title: 'Zaplanuj dodatkową ochronę', text: 'W niektórych sytuacjach przez określony czas może być zalecana prezerwatywa.'},
    ],
    body3: 'Nie wszystkie sytuacje są takie same. Niektóre pominięte tabletki wymagają dokładniejszego sprawdzenia zaleceń.',
    situations: [
      {title: 'Pominięta tylko jedna tabletka', text: 'To, co robić, zależy głównie od czasu, który upłynął od zwykłej pory przyjęcia.'},
      {title: 'Pominięta więcej niż jedna tabletka', text: 'Ta sytuacja wymaga szczególnej uwagi i najlepiej dokładnie sprawdzić ulotkę.'},
      {title: 'Nie wiesz, co zrobić', text: 'Farmaceuta lub inny specjalista może szybko pomóc ustalić właściwe postępowanie.'},
    ],
    body4: 'Ulotka Twojej tabletki zawiera dokładne instrukcje dotyczące stosowanego leku. Zalecenia mogą się różnić w zależności od tego, czy jest to tabletka złożona, czy zawierająca wyłącznie progestagen.',
    referenceTitle: 'Warto sprawdzić',
    referenceTips: [
      'Miej ulotkę pod ręką (na przykład zdjęcie w telefonie)',
      'Skontaktuj się z farmaceutą, jeśli masz szybkie pytanie',
      'Zgłoś się do lekarza, jeśli zdarza się to często',
    ],
    guideTitle: 'Dlaczego moment pominięcia tabletki ma znaczenie?',
    guideText: 'Miejsce pominiętej tabletki w opakowaniu może zmieniać to, co należy zrobić. Dlatego ulotka często podaje różne zalecenia w zależności od tygodnia opakowania.',
    body5: 'Jeśli nie wiesz, co robić, lepiej poprosić o poradę, niż pozostawać w niepewności. Farmaceuta, położna lub lekarz może pomóc sprawdzić zalecenia odpowiednie dla Twojej sytuacji.',
    questionTitle: 'Informacje, które warto mieć pod ręką',
    questions: [
      'Jaki dokładnie to rodzaj tabletki?',
      'Ile czasu minęło od zwykłej pory przyjęcia?',
      'Ile tabletek pominięto?',
      'W którym momencie opakowania doszło do pominięcia?',
      'Czy niedawno odbył się stosunek bez zabezpieczenia?',
    ],
    proTipTitle: 'Warto wiedzieć',
    proTipText: 'Jeśli w czasie pominięcia tabletki odbył się stosunek bez zabezpieczenia, szybko poproś specjalistę o poradę, aby dowiedzieć się, jakie są dostępne opcje.',
    repeatTitle: 'Jeśli często pomijasz tabletki',
    body6: 'Częste pomijanie tabletek może świadczyć o tym, że codzienna rutyna nie do końca pasuje do Twojego stylu życia. Nie wahaj się porozmawiać ze specjalistą, aby poznać inne opcje antykoncepcji.',
    methodTipTitle: 'Inna metoda?',
    methodTipText: 'Jeśli trudno utrzymać codzienne przyjmowanie tabletki, istnieją inne metody o innej częstotliwości stosowania.',
    summaryTitle: 'Najważniejsze',
    summaryItems: [
      'Reaguj, gdy tylko zauważysz pominiętą tabletkę.',
      'Sprawdź dokładny rodzaj swojej tabletki.',
      'Sprawdź ulotkę, aby poznać dokładne postępowanie.',
      'Zastosuj dodatkową ochronę, jeśli zaleca ją ulotka.',
      'Poproś o poradę w razie wątpliwości lub po ryzykownym kontakcie.',
    ],
    finalTipTitle: 'Najważniejsze wnioski',
    finalTipText: 'Pominięta tabletka nie oznacza automatycznie, że antykoncepcja przestała działać. Właściwe postępowanie zależy od rodzaju tabletki i okoliczności pominięcia. W razie wątpliwości sprawdź ulotkę i szybko poproś o poradę.',
    disclaimerText: 'Ten artykuł ma charakter wyłącznie informacyjny i nie zastępuje ulotki leku ani spersonalizowanej porady medycznej. Zalecenia mogą się różnić w zależności od rodzaju tabletki.',
  },
  uk: {
    shareMessage: 'Пропущена таблетка: що робити? — AWA',
    badge: 'ПРОПУЩЕНА ТАБЛЕТКА',
    title: 'Пропущена таблетка:\nщо робити?',
    metaDuration: '7 хв читання',
    metaType: 'Запитання',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro: 'Пропущена таблетка може трапитися з будь-ким. Що робити, залежить головним чином від того, як давно ви її пропустили, від типу таблетки та моменту в блістері.',
    importantTitle: 'Головне',
    importantText: 'Без паніки. Спершу перевірте точний тип вашої таблетки та зверніться до інструкції, щоб дізнатися рекомендовані дії.',
    contentsTitle: 'У цій статті',
    topics: [
      'Запізнення менш ніж на 12 годин',
      'Запізнення більш ніж на 12 годин',
      'Ситуації, що потребують додаткової уваги',
      'Інструкція — ваш орієнтир',
      'Коли звертатися за порадою',
      'Головні висновки',
    ],
    body1: 'Для деяких таблеток запізнення менш ніж на 12 годин зазвичай не порушує контрацептивного захисту. У такому разі зазвичай рекомендують прийняти пропущену таблетку якомога швидше, а потім продовжити блістер у звичний час.',
    step1Title: 'Прийміть таблетку',
    step1Text: 'Прийміть таблетку, щойно помітите запізнення.',
    step2Title: 'Продовжуйте як зазвичай',
    step2Text: 'Потім поверніться до звичного графіка для наступних таблеток.',
    tip1Title: 'Варто знати',
    tip1Text: 'Якщо ви приймете пропущену таблетку, а потім ту, що призначена на звичний час, може трапитися, що в один день буде прийнято дві таблетки.',
    body2: 'Коли запізнення перевищує допустимий для вашої таблетки час, захист може бути знижений. Що робити тоді, залежить від типу таблетки, кількості пропущених таблеток та місця пропущеної таблетки в блістері.',
    alertTitle: 'Увага',
    alertText: 'Не спирайтеся лише на наведену тут кількість годин: деякі таблетки мають інші вказівки. Завжди перевіряйте інструкцію до вашого препарату.',
    reflexesTitle: 'Перші кроки',
    checkPoints: [
      {title: 'Реагуйте швидко', text: 'Чим швидше ви зреагуєте після виявлення пропущеної таблетки, тим легше дотримуватися відповідних рекомендацій.'},
      {title: 'Перевірте інструкцію', text: 'Вказівки можуть різнитися залежно від точного типу таблетки та кількості пропущених таблеток.'},
      {title: 'Заплануйте додатковий захист', text: 'У деяких ситуаціях протягом певного часу може бути рекомендований презерватив.'},
    ],
    body3: 'Не всі ситуації однакові. Деякі пропущені таблетки потребують точнішої перевірки рекомендацій.',
    situations: [
      {title: 'Пропущено лише одну таблетку', text: 'Що робити, залежить головним чином від часу, що минув від звичного часу прийому.'},
      {title: 'Пропущено більше однієї таблетки', text: 'Ця ситуація потребує особливої уваги, і найкраще точно перевірити інструкцію.'},
      {title: 'Не знаєте, що робити', text: 'Фармацевт або медичний фахівець може швидко допомогти визначити правильні дії.'},
    ],
    body4: 'Інструкція до вашої таблетки містить точні вказівки для препарату, який ви приймаєте. Рекомендації можуть відрізнятися залежно від того, чи це комбінована таблетка, чи таблетка лише з прогестагеном.',
    referenceTitle: 'Що варто перевірити',
    referenceTips: [
      'Тримайте інструкцію під рукою (наприклад, фото на телефоні)',
      'Зверніться до фармацевта, якщо є швидке запитання',
      'Зверніться до лікаря, якщо таке трапляється часто',
    ],
    guideTitle: 'Чому важливий момент пропуску таблетки?',
    guideText: 'Місце пропущеної таблетки в блістері може змінювати те, що слід робити. Тому інструкція часто дає різні рекомендації залежно від тижня блістера.',
    body5: 'Якщо ви не знаєте, що робити, краще попросити поради, ніж залишатися в сумнівах. Фармацевт, акушерка чи лікар можуть допомогти перевірити рекомендації, що відповідають вашій ситуації.',
    questionTitle: 'Інформація, яку варто мати під рукою',
    questions: [
      'Який саме це тип таблетки?',
      'Скільки часу минуло від звичного часу прийому?',
      'Скільки таблеток пропущено?',
      'У який момент блістера трапився пропуск?',
      'Чи був нещодавно незахищений статевий акт?',
    ],
    proTipTitle: 'Варто знати',
    proTipText: 'Якщо незахищений статевий акт відбувся приблизно в час пропуску таблетки, швидко попросіть поради в спеціаліста, щоб дізнатися про доступні варіанти.',
    repeatTitle: 'Якщо ви часто пропускаєте таблетки',
    body6: 'Часті пропуски таблеток можуть свідчити, що щоденна рутина не зовсім відповідає вашому способу життя. Не вагайтеся поговорити з медичним фахівцем, щоб розглянути інші варіанти контрацепції.',
    methodTipTitle: 'Інший метод?',
    methodTipText: 'Якщо важко щодня приймати таблетку, існують інші методи з іншою частотою застосування.',
    summaryTitle: 'Головне',
    summaryItems: [
      'Реагуйте, щойно помітите пропущену таблетку.',
      'Перевірте точний тип вашої таблетки.',
      'Перевірте інструкцію, щоб дізнатися точні дії.',
      'Застосуйте додатковий захист, якщо його рекомендує інструкція.',
      'Попросіть поради в разі сумнівів або після ризикованого контакту.',
    ],
    finalTipTitle: 'Головні висновки',
    finalTipText: 'Пропущена таблетка автоматично не означає, що ваша контрацепція перестала діяти. Правильні дії залежать від типу таблетки та обставин пропуску. У разі сумнівів перевірте інструкцію й швидко попросіть поради.',
    disclaimerText: 'Ця стаття надається виключно в інформаційних цілях і не замінює інструкції до вашого препарату чи персоналізованої медичної поради. Рекомендації можуть відрізнятися залежно від типу таблетки.',
  },
  cs: {
    shareMessage: 'Vynechaná pilulka: co dělat? — AWA',
    badge: 'VYNECHANÁ PILULKA',
    title: 'Vynechaná pilulka:\nco dělat?',
    metaDuration: '7 min čtení',
    metaType: 'Časté dotazy',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro: 'Vynechaná pilulka se může stát komukoli. Co dělat, závisí hlavně na tom, jak dávno jste ji vynechala, na typu pilulky a na tom, ve které části balení se to stane.',
    importantTitle: 'Hlavní bod',
    importantText: 'Nepanikařte. Nejprve zkontrolujte přesný typ své pilulky a přečtěte si příbalový leták, abyste zjistila doporučený postup.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Zpoždění méně než 12 hodin',
      'Zpoždění více než 12 hodin',
      'Situace, které vyžadují zvláštní pozornost',
      'Příbalový leták je vaší referencí',
      'Kdy požádat o radu',
      'Hlavní poznatky',
    ],
    body1: 'U některých pilulek zpoždění kratší než 12 hodin obecně neohrozí antikoncepční ochranu. V tomto případě je obvyklým doporučením vzít vynechanou pilulku co nejdříve a poté pokračovat v balení v obvyklou dobu.',
    step1Title: 'Vezměte pilulku',
    step1Text: 'Vezměte pilulku, jakmile si všimnete, že máte zpoždění.',
    step2Title: 'Pokračujte jako obvykle',
    step2Text: 'Poté se vraťte ke svému obvyklému rozvrhu u následujících pilulek.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Pokud vezmete vynechanou pilulku a poté tu, která je naplánovaná na obvyklou dobu, může se stát, že se v jednom dni užijí dvě pilulky.',
    body2: 'Když zpoždění přesáhne dobu povolenou pro vaši pilulku, může být ochrana snížena. Co dělat, závisí na typu pilulky, počtu vynechaných pilulek a na tom, kam v balení vynechaná pilulka spadá.',
    alertTitle: 'Upozornění',
    alertText: 'Nespoléhejte jen na zde uvedený počet hodin: některé pilulky mají odlišné pokyny. Vždy zkontrolujte příbalový leták svého léku.',
    reflexesTitle: 'První kroky',
    checkPoints: [
      {title: 'Reagujte rychle', text: 'Čím rychleji zareagujete po zjištění vynechané pilulky, tím snáze lze dodržet vhodná doporučení.'},
      {title: 'Zkontrolujte příbalový leták', text: 'Pokyny se mohou lišit podle přesného typu pilulky a počtu vynechaných pilulek.'},
      {title: 'Počítejte se záložní ochranou', text: 'V některých situacích může být po určitou dobu doporučen kondom.'},
    ],
    body3: 'Ne všechny situace jsou stejné. Některé vynechané pilulky vyžadují přesnější kontrolu doporučení.',
    situations: [
      {title: 'Vynechána pouze jedna pilulka', text: 'Co dělat, závisí hlavně na čase, který uplynul od obvyklé doby užití.'},
      {title: 'Vynecháno více než jedna pilulka', text: 'Tato situace vyžaduje zvláštní pozornost a je nejlepší přesně zkontrolovat příbalový leták.'},
      {title: 'Nevíte, co dělat', text: 'Lékárník nebo zdravotnický pracovník vám může rychle pomoci určit správný postup.'},
    ],
    body4: 'Příbalový leták vaší pilulky obsahuje přesné pokyny pro lék, který užíváte. Doporučení se mohou lišit podle toho, zda jde o kombinovanou pilulku, nebo pilulku obsahující pouze gestagen.',
    referenceTitle: 'Užitečné věci ke kontrole',
    referenceTips: [
      'Mějte příbalový leták po ruce (například fotografii v telefonu)',
      'Obraťte se na lékárníka, pokud máte rychlou otázku',
      'Navštivte lékaře, pokud se to stává často',
    ],
    guideTitle: 'Proč záleží na načasování vynechané pilulky?',
    guideText: 'Kdy v balení k vynechání dojde, může změnit, co dělat. Proto příbalový leták často uvádí odlišná doporučení podle týdne balení.',
    body5: 'Pokud nevíte, co dělat, je lepší požádat o radu, než zůstat v nejistotě. Lékárník, porodní asistentka nebo lékař vám může pomoci ověřit doporučení vhodná pro vaši situaci.',
    questionTitle: 'Informace, které mít připravené',
    questions: [
      'O jaký přesný typ pilulky jde?',
      'Kolik času uplynulo od obvyklé doby?',
      'Kolik pilulek bylo vynecháno?',
      'V jakém okamžiku balení k vynechání došlo?',
      'Došlo v poslední době k nechráněnému styku?',
    ],
    proTipTitle: 'Stojí za to vědět',
    proTipText: 'Pokud došlo k nechráněnému styku v době vynechané pilulky, požádejte rychle odborníka o radu, abyste zjistila, jaké možnosti jsou k dispozici.',
    repeatTitle: 'Pokud pilulky vynecháváte opakovaně',
    body6: 'Časté vynechávání pilulek může být známkou toho, že denní rutina k vašemu životnímu stylu úplně nesedí. Neváhejte si promluvit se zdravotnickým pracovníkem a prozkoumat jiné antikoncepční možnosti.',
    methodTipTitle: 'Jiná metoda?',
    methodTipText: 'Pokud je užívání pilulky každý den obtížné udržet, existují jiné metody s odlišnou frekvencí používání.',
    summaryTitle: 'To nejdůležitější',
    summaryItems: [
      'Reagujte, jakmile si vynechané pilulky všimnete.',
      'Zkontrolujte přesný typ své pilulky.',
      'Přečtěte si příbalový leták a zjistěte přesný postup.',
      'Použijte záložní ochranu, pokud ji příbalový leták doporučuje.',
      'Požádejte o radu v případě pochybností nebo po rizikovém styku.',
    ],
    finalTipTitle: 'Hlavní poznatky',
    finalTipText: 'Vynechaná pilulka automaticky neznamená, že vaše antikoncepce přestala fungovat. Správný postup závisí na typu pilulky a okolnostech vynechané dávky. V případě pochybností zkontrolujte příbalový leták a rychle požádejte o radu.',
    disclaimerText: 'Tento článek je poskytován pouze pro informaci a nenahrazuje příbalový leták vašeho léku ani individuální lékařskou radu. Doporučení se mohou lišit podle typu pilulky.',
  },
  sk: {
    shareMessage: 'Vynechaná tableta: čo robiť? — AWA',
    badge: 'VYNECHANÁ TABLETA',
    title: 'Vynechaná tableta:\nčo robiť?',
    metaDuration: '7 min čítania',
    metaType: 'Často kladené otázky',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro: 'Vynechaná tableta sa môže stať každej. Čo robiť, závisí najmä od toho, ako dávno ste ju vynechali, od typu tablety a od toho, kedy v balení sa to stane.',
    importantTitle: 'Kľúčový bod',
    importantText: 'Nepanikárte. Najprv skontrolujte presný typ svojej tablety a pozrite si písomnú informáciu pre používateľa, aby ste zistili odporúčaný postup.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Oneskorenie menej než 12 hodín',
      'Oneskorenie viac než 12 hodín',
      'Situácie, ktoré vyžadujú osobitnú pozornosť',
      'Písomná informácia je vaša referencia',
      'Kedy sa poradiť',
      'Hlavné body',
    ],
    body1: 'Pri niektorých tabletách oneskorenie menej než 12 hodín vo všeobecnosti neohrozí antikoncepčnú ochranu. V tomto prípade je obvyklým odporúčaním užiť vynechanú tabletu čo najskôr a potom pokračovať v balení v obvyklom čase.',
    step1Title: 'Užite tabletu',
    step1Text: 'Užite tabletu hneď, ako si všimnete oneskorenie.',
    step2Title: 'Pokračujte ako zvyčajne',
    step2Text: 'Potom sa vráťte k obvyklému rozvrhu pri nasledujúcich tabletách.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Ak užijete vynechanú tabletu a potom tú, ktorá je naplánovaná na obvyklý čas, môže sa stať, že sa v ten istý deň užijú dve tablety.',
    body2: 'Keď oneskorenie presiahne čas povolený pre vašu tabletu, ochrana môže byť znížená. Čo robiť potom, závisí od typu tablety, počtu vynechaných tabliet a od toho, kde v balení vynechaná tableta pripadá.',
    alertTitle: 'Upozornenie',
    alertText: 'Nespoliehajte sa iba na tu uvedený počet hodín: niektoré tablety majú iné pokyny. Vždy si pozrite písomnú informáciu pre používateľa vášho lieku.',
    reflexesTitle: 'Prvé kroky',
    checkPoints: [
      {title: 'Reagujte rýchlo', text: 'Čím rýchlejšie zareagujete po zistení vynechanej tablety, tým ľahšie je dodržať vhodné odporúčania.'},
      {title: 'Skontrolujte písomnú informáciu', text: 'Pokyny sa môžu líšiť podľa presného typu tablety a počtu vynechaných tabliet.'},
      {title: 'Zabezpečte záložnú ochranu', text: 'V niektorých situáciách sa môže na určité obdobie odporučiť kondóm.'},
    ],
    body3: 'Nie všetky situácie sú rovnaké. Niektoré vynechané tablety vyžadujú presnejšiu kontrolu odporúčaní.',
    situations: [
      {title: 'Vynechaná len jedna tableta', text: 'Čo robiť, závisí najmä od času, ktorý uplynul od obvyklého času užitia.'},
      {title: 'Vynechaných viac tabliet', text: 'Táto situácia vyžaduje osobitnú pozornosť a najlepšie je presne skontrolovať písomnú informáciu.'},
      {title: 'Neviete, čo robiť', text: 'Lekárnik alebo zdravotnícky pracovník vám môže rýchlo pomôcť určiť správny postup.'},
    ],
    body4: 'Písomná informácia o vašej tablete uvádza presné pokyny pre liek, ktorý užívate. Odporúčania sa môžu líšiť podľa toho, či ide o kombinovanú alebo čisto gestagénovú tabletu.',
    referenceTitle: 'Užitočné veci na kontrolu',
    referenceTips: [
      'Majte písomnú informáciu po ruke (napríklad fotku v telefóne)',
      'Ak máte rýchlu otázku, obráťte sa na lekárnika',
      'Ak sa to stáva často, navštívte lekára',
    ],
    guideTitle: 'Prečo záleží na čase vynechania tablety?',
    guideText: 'To, kde v balení vynechaná tableta pripadá, môže zmeniť, čo treba robiť. Preto písomná informácia často uvádza odlišné odporúčania podľa týždňa balenia.',
    body5: 'Ak neviete, čo robiť, je lepšie požiadať o radu, než zostať v pochybnostiach. Lekárnik, pôrodná asistentka alebo lekár vám môže pomôcť overiť odporúčania vhodné pre vašu situáciu.',
    questionTitle: 'Informácie, ktoré majte pripravené',
    questions: [
      'O aký presný typ tablety ide?',
      'Koľko času uplynulo od obvyklého času?',
      'Koľko tabliet bolo vynechaných?',
      'V ktorom bode balenia k vynechaniu došlo?',
      'Bol nedávno nechránený styk?',
    ],
    proTipTitle: 'Stojí za to vedieť',
    proTipText: 'Ak došlo k nechránenému styku v čase vynechanej tablety, rýchlo požiadajte odborníka o radu, aby ste zistili, aké možnosti sú k dispozícii.',
    repeatTitle: 'Ak tablety vynechávate opakovane',
    body6: 'Časté vynechávanie tabliet môže byť znakom, že každodenná rutina celkom nezodpovedá vášmu spôsobu života. Neváhajte sa porozprávať so zdravotníckym pracovníkom a preskúmať iné antikoncepčné možnosti.',
    methodTipTitle: 'Iná metóda?',
    methodTipText: 'Ak je ťažké užívať tabletu každý deň, existujú iné metódy s odlišnou frekvenciou používania.',
    summaryTitle: 'To najdôležitejšie',
    summaryItems: [
      'Reagujte hneď, ako si vynechanú tabletu všimnete.',
      'Skontrolujte presný typ svojej tablety.',
      'Pozrite si písomnú informáciu, aby ste zistili presný postup.',
      'Použite záložnú ochranu, ak ju písomná informácia odporúča.',
      'Požiadajte o radu pri pochybnostiach alebo po rizikovom styku.',
    ],
    finalTipTitle: 'Hlavné body',
    finalTipText: 'Vynechaná tableta automaticky neznamená, že vaša antikoncepcia prestala účinkovať. Správny postup závisí od typu tablety a okolností vynechania dávky. V prípade pochybností si pozrite písomnú informáciu a rýchlo požiadajte o radu.',
    disclaimerText: 'Tento článok je poskytnutý iba na informačné účely a nenahrádza písomnú informáciu o vašom lieku ani individuálnu lekársku radu. Odporúčania sa môžu líšiť podľa typu tablety.',
  },
  hu: {
    shareMessage: 'Kihagyott tabletta: mit tegyél? — AWA',
    badge: 'KIHAGYOTT TABLETTA',
    title: 'Kihagyott tabletta:\nmit tegyél?',
    metaDuration: '7 perc olvasás',
    metaType: 'GYIK',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Egy kihagyott tabletta bárkivel megtörténhet. Hogy mit kell tenni, főként attól függ, mennyi ideje hagytad ki, milyen a tabletta típusa, és a levél melyik pontján történik.',
    importantTitle: 'A kulcspont',
    importantText: 'Ne ess pánikba. Először ellenőrizd a tablettád pontos típusát, és nézd meg a betegtájékoztatót, hogy megtudd a javasolt eljárást.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      '12 óránál kisebb késés',
      '12 óránál nagyobb késés',
      'Fokozott odafigyelést igénylő helyzetek',
      'A betegtájékoztató az irányadó',
      'Mikor kérj tanácsot',
      'Legfontosabb tudnivalók',
    ],
    body1: 'Egyes tablettáknál a 12 óránál kisebb késés általában nem veszélyezteti a fogamzásgátló védelmet. Ebben az esetben a szokásos javaslat, hogy a kihagyott tablettát minél hamarabb vedd be, majd a levelet a megszokott időben folytasd.',
    step1Title: 'Vedd be a tablettát',
    step1Text: 'Vedd be a tablettát, amint észreveszed a késést.',
    step2Title: 'Folytasd a szokásos módon',
    step2Text: 'Majd térj vissza a szokásos ütemezéshez a következő tablettáknál.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Ha beveszed a kihagyott tablettát, majd a megszokott időre ütemezettet is, előfordulhat, hogy ugyanazon a napon két tablettát veszel be.',
    body2: 'Ha a késés meghaladja a tablettád esetében megengedett időt, a védelem csökkenhet. Hogy ilyenkor mit kell tenni, a tabletta típusától, a kihagyott tabletták számától és attól függ, hogy a levél melyik pontján esik a kihagyott tabletta.',
    alertTitle: 'Figyelmeztetés',
    alertText: 'Ne csak az itt megadott óraszámra hagyatkozz: egyes tablettáknak eltérő utasításaik vannak. Mindig ellenőrizd a gyógyszered betegtájékoztatóját.',
    reflexesTitle: 'Az első teendők',
    checkPoints: [
      {title: 'Reagálj gyorsan', text: 'Minél gyorsabban reagálsz a kihagyott tabletta észlelése után, annál könnyebb követni a megfelelő javaslatokat.'},
      {title: 'Ellenőrizd a betegtájékoztatót', text: 'Az utasítások a tabletta pontos típusától és a kihagyott tabletták számától függően eltérhetnek.'},
      {title: 'Gondoskodj kiegészítő védelemről', text: 'Egyes helyzetekben egy adott időszakra óvszer használata is javasolt lehet.'},
    ],
    body3: 'Nem minden helyzet egyforma. Egyes kihagyott tabletták a javaslatok pontosabb ellenőrzését igénylik.',
    situations: [
      {title: 'Csak egy tabletta maradt ki', text: 'Hogy mit kell tenni, főként a szokásos bevételi időponttól eltelt időtől függ.'},
      {title: 'Egynél több tabletta maradt ki', text: 'Ez a helyzet különös figyelmet igényel, és a legjobb a betegtájékoztatót pontosan ellenőrizni.'},
      {title: 'Nem tudod, mit tegyél', text: 'Egy gyógyszerész vagy egészségügyi szakember gyorsan segíthet megtalálni a helyes eljárást.'},
    ],
    body4: 'A tablettád betegtájékoztatója megadja a szedett gyógyszerre vonatkozó pontos utasításokat. A javaslatok eltérhetnek aszerint, hogy kombinált vagy csak gesztagént tartalmazó tablettáról van-e szó.',
    referenceTitle: 'Hasznos ellenőrizendők',
    referenceTips: [
      'Tartsd kéznél a betegtájékoztatót (például fényképpel a telefonodon)',
      'Gyors kérdéssel fordulj gyógyszerészhez',
      'Fordulj orvoshoz, ha ez gyakran előfordul',
    ],
    guideTitle: 'Miért számít a kihagyott tabletta időpontja?',
    guideText: 'Az, hogy a kihagyott tabletta a levél melyik pontján esik, megváltoztathatja a teendőket. Ezért a betegtájékoztató gyakran a levél hete szerint eltérő javaslatokat ad.',
    body5: 'Ha nem tudod, mit tegyél, jobb tanácsot kérni, mint kétségben maradni. Egy gyógyszerész, szülésznő vagy orvos segíthet ellenőrizni a helyzetedre vonatkozó javaslatokat.',
    questionTitle: 'Információk, amelyeket tarts készenlétben',
    questions: [
      'Pontosan milyen típusú tablettáról van szó?',
      'Mennyi idő telt el a szokásos időponttól?',
      'Hány tabletta maradt ki?',
      'A levél melyik pontján történt a kihagyás?',
      'Volt nemrég védekezés nélküli nemi élet?',
    ],
    proTipTitle: 'Érdemes tudni',
    proTipText: 'Ha a tabletta kihagyásának idején védekezés nélküli nemi élet történt, kérj gyorsan szakmai tanácsot, hogy megtudd, milyen lehetőségek állnak rendelkezésre.',
    repeatTitle: 'Ha folyamatosan kihagyod a tablettákat',
    body6: 'A gyakori kihagyott tabletták arra utalhatnak, hogy a napi rutin nem egészen illik az életmódodhoz. Ne habozz beszélni egészségügyi szakemberrel, hogy más fogamzásgátló lehetőségeket tárjatok fel.',
    methodTipTitle: 'Másik módszer?',
    methodTipText: 'Ha nehéz minden nap tablettát szedni, léteznek más, eltérő használati gyakoriságú módszerek.',
    summaryTitle: 'A lényeg',
    summaryItems: [
      'Reagálj, amint észreveszed a kihagyott tablettát.',
      'Ellenőrizd a tablettád pontos típusát.',
      'Nézd meg a betegtájékoztatót, hogy megtudd a pontos eljárást.',
      'Használj kiegészítő védelmet, ha a betegtájékoztató ezt javasolja.',
      'Kérj tanácsot kétség esetén vagy kockázatos együttlét után.',
    ],
    finalTipTitle: 'Legfontosabb tudnivalók',
    finalTipText: 'Egy kihagyott tabletta automatikusan nem jelenti azt, hogy a fogamzásgátlásod megszűnt működni. A helyes eljárás a tabletta típusától és az adag kihagyásának körülményeitől függ. Kétség esetén nézd meg a betegtájékoztatót, és gyorsan kérj tanácsot.',
    disclaimerText: 'Ez a cikk kizárólag tájékoztató jellegű, és nem helyettesíti a gyógyszered betegtájékoztatóját vagy a személyre szabott orvosi tanácsot. A javaslatok a tabletta típusától függően eltérhetnek.',
  },
  ro: {
    shareMessage: 'Pilulă uitată: ce faci? — AWA',
    badge: 'PILULĂ UITATĂ',
    title: 'Pilulă uitată:\nce faci?',
    metaDuration: '7 min de citit',
    metaType: 'Întrebări frecvente',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro: 'O pilulă uitată se poate întâmpla oricui. Ce ai de făcut depinde în principal de cât timp a trecut de când ai uitat-o, de tipul pilulei și de momentul din blister în care se întâmplă.',
    importantTitle: 'Ideea esențială',
    importantText: 'Nu intra în panică. Verifică mai întâi tipul exact al pilulei tale și consultă prospectul ei pentru a afla ce este recomandat.',
    contentsTitle: 'În acest articol',
    topics: [
      'Întârziere de mai puțin de 12 ore',
      'Întârziere de mai mult de 12 ore',
      'Situații care necesită o atenție suplimentară',
      'Prospectul este referința ta',
      'Când să ceri un sfat',
      'Ce să reții',
    ],
    body1: 'Pentru unele pilule, o întârziere de mai puțin de 12 ore nu compromite în general protecția contraceptivă. În acest caz, recomandarea obișnuită este să iei pilula uitată cât mai repede posibil și apoi să continui blisterul la ora obișnuită.',
    step1Title: 'Ia pilula',
    step1Text: 'Ia pilula de îndată ce observi că ești în întârziere.',
    step2Title: 'Continuă ca de obicei',
    step2Text: 'Apoi revino la programul tău obișnuit pentru pilulele următoare.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Dacă iei pilula uitată și apoi pe cea programată la ora obișnuită, se poate întâmpla să iei două pilule în aceeași zi.',
    body2: 'Când întârzierea depășește timpul permis pentru pilula ta, protecția poate fi redusă. Ce ai de făcut atunci depinde de tipul pilulei, de numărul de pilule uitate și de locul din blister în care se află pilula uitată.',
    alertTitle: 'Avertisment',
    alertText: 'Nu te baza doar pe numărul de ore indicat aici: unele pilule au instrucțiuni diferite. Verifică întotdeauna prospectul medicamentului tău.',
    reflexesTitle: 'Primele lucruri de făcut',
    checkPoints: [
      {title: 'Reacționează rapid', text: 'Cu cât reacționezi mai repede după ce observi pilula uitată, cu atât este mai ușor să urmezi recomandările potrivite.'},
      {title: 'Verifică prospectul', text: 'Instrucțiunile pot varia în funcție de tipul exact al pilulei și de numărul de pilule uitate.'},
      {title: 'Prevede o protecție suplimentară', text: 'În unele situații, poate fi recomandat un prezervativ pentru o anumită perioadă.'},
    ],
    body3: 'Nu toate situațiile sunt la fel. Unele pilule uitate cer o verificare mai precisă a recomandărilor.',
    situations: [
      {title: 'O singură pilulă uitată', text: 'Ce ai de făcut depinde în principal de timpul scurs de la ora obișnuită a administrării.'},
      {title: 'Mai mult de o pilulă uitată', text: 'Această situație necesită o atenție deosebită și este mai bine să verifici precis prospectul.'},
      {title: 'Nu ești sigură ce să faci', text: 'Un farmacist sau un profesionist din domeniul sănătății te poate ajuta rapid să identifici conduita potrivită.'},
    ],
    body4: 'Prospectul pilulei tale oferă instrucțiunile precise pentru medicamentul pe care îl iei. Recomandările pot diferi după cum este vorba de o pilulă combinată sau de o pilulă doar cu progestativ.',
    referenceTitle: 'Lucruri utile de verificat',
    referenceTips: [
      'Păstrează prospectul la îndemână (o fotografie pe telefon, de exemplu)',
      'Contactează un farmacist dacă ai o întrebare rapidă',
      'Mergi la medic dacă se întâmplă des',
    ],
    guideTitle: 'De ce contează momentul pilulei uitate?',
    guideText: 'Locul din blister în care se află pilula uitată poate schimba ce ai de făcut. De aceea prospectul oferă adesea recomandări diferite în funcție de săptămâna din blister.',
    body5: 'Dacă nu știi ce să faci, este mai bine să ceri un sfat decât să rămâi în îndoială. Un farmacist, o moașă sau un medic te poate ajuta să verifici recomandările potrivite situației tale.',
    questionTitle: 'Informații de avut pregătite',
    questions: [
      'Ce tip exact de pilulă este?',
      'Cât timp a trecut de la ora obișnuită?',
      'Câte pilule au fost uitate?',
      'În ce moment din blister s-a petrecut uitarea?',
      'A avut loc recent un raport neprotejat?',
    ],
    proTipTitle: 'Bine de știut',
    proTipText: 'Dacă a avut loc un raport neprotejat în jurul momentului pilulei uitate, cere rapid sfatul unui profesionist pentru a afla ce opțiuni sunt disponibile.',
    repeatTitle: 'Dacă uiți pilule în mod repetat',
    body6: 'Pilulele uitate frecvent pot fi un semn că rutina zilnică nu se potrivește prea bine stilului tău de viață. Nu ezita să vorbești cu un profesionist din domeniul sănătății pentru a explora alte opțiuni contraceptive.',
    methodTipTitle: 'O altă metodă?',
    methodTipText: 'Dacă luarea unei pilule în fiecare zi este greu de menținut, există alte metode cu o frecvență de folosire diferită.',
    summaryTitle: 'Esențialul',
    summaryItems: [
      'Reacționează de îndată ce observi pilula uitată.',
      'Verifică tipul exact al pilulei tale.',
      'Consultă prospectul pentru a afla conduita precisă.',
      'Folosește o protecție suplimentară dacă prospectul o recomandă.',
      'Cere un sfat dacă ai îndoieli sau după un raport riscant.',
    ],
    finalTipTitle: 'Ce să reții',
    finalTipText: 'O pilulă uitată nu înseamnă automat că contracepția ta a încetat să funcționeze. Conduita potrivită depinde de tipul pilulei și de circumstanțele dozei uitate. Dacă ai îndoieli, verifică prospectul și cere rapid un sfat.',
    disclaimerText: 'Acest articol este oferit doar cu titlu informativ și nu înlocuiește prospectul medicamentului tău sau sfatul medical personalizat. Recomandările pot varia în funcție de tipul de pilulă.',
  },
  bg: {
    shareMessage: 'Пропуснато хапче: какво да направя? — AWA',
    badge: 'ПРОПУСНАТО ХАПЧЕ',
    title: 'Пропуснато хапче:\nкакво да направя?',
    metaDuration: '7 мин четене',
    metaType: 'Чести въпроси',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro: 'Пропуснато хапче може да се случи на всеки. Какво да направиш, зависи най-вече от това колко време е минало, от вида на хапчето и от момента в опаковката.',
    importantTitle: 'Основното',
    importantText: 'Не се паникьосвай. Първо провери точния вид на хапчето си и прочети листовката, за да разбереш препоръчаните действия.',
    contentsTitle: 'В тази статия',
    topics: [
      'Закъснение под 12 часа',
      'Закъснение над 12 часа',
      'Ситуации, изискващи повече внимание',
      'Листовката е твоята референция',
      'Кога да потърсиш съвет',
      'Какво да запомниш',
    ],
    body1: 'При някои хапчета закъснение под 12 часа обикновено не нарушава контрацептивната защита. В този случай обичайната препоръка е да вземеш пропуснатото хапче колкото се може по-скоро и после да продължиш опаковката в обичайния час.',
    step1Title: 'Вземи хапчето',
    step1Text: 'Вземи хапчето веднага щом забележиш закъснението.',
    step2Title: 'Продължи както обикновено',
    step2Text: 'След това се върни към обичайния си график за следващите хапчета.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Ако вземеш пропуснатото хапче и после това за обичайния час, може да се случи да вземеш две хапчета в един и същи ден.',
    body2: 'Когато закъснението надвишава времето, допустимо за хапчето ти, защитата може да е намалена. Какво да направиш тогава, зависи от вида хапче, броя пропуснати хапчета и мястото на пропуснатото хапче в опаковката.',
    alertTitle: 'Внимание',
    alertText: 'Не се осланяй само на броя часове, посочен тук: някои хапчета имат различни указания. Винаги проверявай листовката на лекарството си.',
    reflexesTitle: 'Първи стъпки',
    checkPoints: [
      {title: 'Реагирай бързо', text: 'Колкото по-бързо реагираш, след като забележиш пропуснатото хапче, толкова по-лесно е да следваш подходящите препоръки.'},
      {title: 'Провери листовката', text: 'Указанията могат да варират според точния вид хапче и броя пропуснати хапчета.'},
      {title: 'Предвиди допълнителна защита', text: 'В някои ситуации може да се препоръча презерватив за определен период.'},
    ],
    body3: 'Не всички ситуации са еднакви. Някои пропуснати хапчета изискват по-точна проверка на препоръките.',
    situations: [
      {title: 'Пропуснато само едно хапче', text: 'Какво да направиш, зависи най-вече от изминалото време от обичайния час на приема.'},
      {title: 'Пропуснато повече от едно хапче', text: 'Тази ситуация изисква особено внимание и е най-добре да провериш листовката внимателно.'},
      {title: 'Не си сигурна какво да направиш', text: 'Фармацевт или здравен специалист може бързо да ти помогне да определиш правилните действия.'},
    ],
    body4: 'Листовката на хапчето ти дава точните указания за лекарството, което приемаш. Препоръките могат да се различават според това дали е комбинирано хапче или хапче само с прогестаген.',
    referenceTitle: 'Полезни неща за проверка',
    referenceTips: [
      'Дръж листовката под ръка (например снимка в телефона)',
      'Свържи се с фармацевт при бърз въпрос',
      'Посети лекар, ако това се случва често',
    ],
    guideTitle: 'Защо моментът на пропуснатото хапче има значение?',
    guideText: 'Мястото на пропуснатото хапче в опаковката може да промени какво да направиш. Затова листовката често дава различни препоръки според седмицата от опаковката.',
    body5: 'Ако не знаеш какво да направиш, по-добре е да поискаш съвет, отколкото да останеш в съмнение. Фармацевт, акушерка или лекар може да ти помогне да провериш препоръките, подходящи за ситуацията ти.',
    questionTitle: 'Информация, която да имаш подготвена',
    questions: [
      'Какво точно хапче е?',
      'Колко време е минало от обичайния час?',
      'Колко хапчета са пропуснати?',
      'В кой момент от опаковката е пропуснато хапчето?',
      'Имало ли е скоро незащитен полов контакт?',
    ],
    proTipTitle: 'Добре е да знаеш',
    proTipText: 'Ако е имало незащитен полов контакт около момента на пропуснатото хапче, бързо поискай съвет от специалист, за да научиш какви възможности съществуват.',
    repeatTitle: 'Ако продължаваш да пропускаш хапчета',
    body6: 'Честите пропуснати хапчета могат да са знак, че ежедневната рутина не пасва съвсем на начина ти на живот. Не се колебай да поговориш със здравен специалист, за да разгледаш други контрацептивни възможности.',
    methodTipTitle: 'Друг метод?',
    methodTipText: 'Ако е трудно да приемаш хапче всеки ден, съществуват други методи с различна честота на употреба.',
    summaryTitle: 'Същественото',
    summaryItems: [
      'Реагирай веднага щом забележиш пропуснатото хапче.',
      'Провери точния вид на хапчето си.',
      'Провери листовката, за да научиш точните действия.',
      'Използвай допълнителна защита, ако листовката го препоръчва.',
      'Поискай съвет при съмнение или след рисков контакт.',
    ],
    finalTipTitle: 'Какво да запомниш',
    finalTipText: 'Пропуснатото хапче не означава автоматично, че контрацепцията ти е спряла да действа. Правилните действия зависят от вида хапче и обстоятелствата около пропуснатата доза. При съмнение провери листовката и бързо поискай съвет.',
    disclaimerText: 'Тази статия е предоставена само с информационна цел и не замества листовката на лекарството ти или персонализирания медицински съвет. Препоръките могат да варират според вида хапче.',
  },
  sr: {
    shareMessage: 'Пропуштена пилула: шта да урадим? — AWA',
    badge: 'ПРОПУШТЕНА ПИЛУЛА',
    title: 'Пропуштена пилула:\nшта да урадим?',
    metaDuration: '7 мин читања',
    metaType: 'Честа питања',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro: 'Пропуштена пилула може се догодити свакоме. Шта да урадиш углавном зависи од тога колико је времена прошло, од врсте пилуле и од тога у ком се тренутку у паковању дешава.',
    importantTitle: 'Кључна ствар',
    importantText: 'Не паничи. Прво провери тачну врсту своје пилуле и прочитај листић да сазнаш препоручене кораке.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Закашњење краће од 12 сати',
      'Закашњење дуже од 12 сати',
      'Ситуације које захтевају додатну пажњу',
      'Листић је твоја референца',
      'Када потражити савет',
      'Шта да запамтиш',
    ],
    body1: 'Код неких пилула закашњење краће од 12 сати обично не нарушава контрацептивну заштиту. У том случају уобичајена препорука је да узмеш пропуштену пилулу што пре, а затим наставиш паковање у уобичајено време.',
    step1Title: 'Узми пилулу',
    step1Text: 'Узми пилулу чим приметиш да касниш.',
    step2Title: 'Настави као обично',
    step2Text: 'Затим се врати свом уобичајеном распореду за наредне пилуле.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Ако узмеш пропуштену пилулу, а затим ону предвиђену за уобичајено време, може се десити да се узму две пилуле истог дана.',
    body2: 'Када закашњење премаши време дозвољено за твоју пилулу, заштита може бити смањена. Шта тада урадити зависи од врсте пилуле, броја пропуштених пилула и места пропуштене пилуле у паковању.',
    alertTitle: 'Упозорење',
    alertText: 'Не ослањај се само на број сати наведен овде: неке пилуле имају другачија упутства. Увек проверавај листић свог лека.',
    reflexesTitle: 'Прве ствари које треба урадити',
    checkPoints: [
      {title: 'Реагуј брзо', text: 'Што брже реагујеш пошто приметиш пропуштену пилулу, лакше је следити одговарајуће препоруке.'},
      {title: 'Провери листић', text: 'Упутства могу варирати зависно од тачне врсте пилуле и броја пропуштених пилула.'},
      {title: 'Предвиди допунску заштиту', text: 'У неким ситуацијама може се препоручити презерватив током одређеног периода.'},
    ],
    body3: 'Нису све ситуације исте. Неке пропуштене пилуле захтевају прецизнију проверу препорука.',
    situations: [
      {title: 'Пропуштена само једна пилула', text: 'Шта урадити углавном зависи од времена протеклог од уобичајеног времена узимања.'},
      {title: 'Пропуштена више од једне пилуле', text: 'Ова ситуација захтева посебну пажњу и најбоље је прецизно проверити листић.'},
      {title: 'Не знаш шта да урадиш', text: 'Фармацеут или здравствени радник може ти брзо помоћи да утврдиш прави начин поступања.'},
    ],
    body4: 'Листић твоје пилуле даје прецизна упутства за лек који узимаш. Препоруке се могу разликовати зависно од тога да ли је реч о комбинованој пилули или пилули само са прогестагеном.',
    referenceTitle: 'Корисне ствари за проверу',
    referenceTips: [
      'Држи листић при руци (на пример, као фотографију у телефону)',
      'Обрати се фармацеуту ако имаш брзо питање',
      'Посети лекара ако се то дешава често',
    ],
    guideTitle: 'Зашто је тренутак пропуштене пилуле важан?',
    guideText: 'Место на којем се пропуштена пилула налази у паковању може променити шта треба урадити. Зато листић често даје различите препоруке зависно од недеље паковања.',
    body5: 'Ако не знаш шта да урадиш, боље је затражити савет него остати у сумњи. Фармацеут, бабица или лекар може ти помоћи да провериш препоруке прилагођене твојој ситуацији.',
    questionTitle: 'Информације које треба да имаш спремне',
    questions: [
      'Која је тачно то врста пилуле?',
      'Колико је времена прошло од уобичајеног времена?',
      'Колико је пилула пропуштено?',
      'У ком тренутку паковања је пилула пропуштена?',
      'Да ли је недавно било незаштићеног односа?',
    ],
    proTipTitle: 'Добро је знати',
    proTipText: 'Ако је у време пропуштене пилуле дошло до незаштићеног односа, брзо затражи савет од стручњака да сазнаш које су опције доступне.',
    repeatTitle: 'Ако стално пропушташ пилуле',
    body6: 'Честе пропуштене пилуле могу бити знак да свакодневна рутина не одговара сасвим твом начину живота. Не оклевај да разговараш са здравственим радником да размотриш друге контрацептивне опције.',
    methodTipTitle: 'Други метод?',
    methodTipText: 'Ако је тешко одржавати узимање пилуле сваког дана, постоје други методи са другачијом учесталошћу употребе.',
    summaryTitle: 'Основно',
    summaryItems: [
      'Реагуј чим приметиш пропуштену пилулу.',
      'Провери тачну врсту своје пилуле.',
      'Провери листић да сазнаш прецизне кораке.',
      'Користи допунску заштиту ако листић то препоручује.',
      'Затражи савет при сумњи или после ризичног односа.',
    ],
    finalTipTitle: 'Шта да запамтиш',
    finalTipText: 'Пропуштена пилула не значи аутоматски да је твоја контрацепција престала да делује. Прави поступак зависи од врсте пилуле и околности пропуштене дозе. При сумњи провери листић и брзо затражи савет.',
    disclaimerText: 'Овај чланак је само у информативне сврхе и не замењује листић твог лека нити персонализовани медицински савет. Препоруке могу варирати зависно од врсте пилуле.',
  },
  hr: {
    shareMessage: 'Propuštena tableta: što učiniti? — AWA',
    badge: 'PROPUŠTENA TABLETA',
    title: 'Propuštena tableta:\nšto učiniti?',
    metaDuration: '7 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Propuštena tableta može se dogoditi svakome. Što učiniti ovisi uglavnom o tome koliko je prošlo, vrsti tablete i trenutku u pakiranju kad se dogodi.',
    importantTitle: 'Ključna točka',
    importantText: 'Ne paniči. Najprije provjeri točnu vrstu svoje tablete i pročitaj uputu o lijeku kako bi saznala preporučeni postupak.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kašnjenje manje od 12 sati',
      'Kašnjenje više od 12 sati',
      'Situacije koje traže dodatnu pozornost',
      'Uputa o lijeku je tvoja referenca',
      'Kada zatražiti savjet',
      'Ključne poruke',
    ],
    body1: 'Kod nekih tableta kašnjenje manje od 12 sati općenito ne ugrožava kontracepcijsku zaštitu. U tom je slučaju uobičajena preporuka uzeti propuštenu tabletu što prije, a zatim nastaviti pakiranje u uobičajeno vrijeme.',
    step1Title: 'Uzmi tabletu',
    step1Text: 'Uzmi tabletu čim primijetiš da kasniš.',
    step2Title: 'Nastavi kao i obično',
    step2Text: 'Zatim se vrati svom uobičajenom rasporedu za sljedeće tablete.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ako uzmeš propuštenu tabletu, a zatim i onu predviđenu za uobičajeno vrijeme, može se dogoditi da se dvije tablete uzmu istog dana.',
    body2: 'Kad kašnjenje premaši vrijeme dopušteno za tvoju tabletu, zaštita može biti smanjena. Što tada učiniti ovisi o vrsti tablete, broju propuštenih tableta i mjestu propuštene tablete u pakiranju.',
    alertTitle: 'Upozorenje',
    alertText: 'Ne oslanjaj se samo na ovdje navedeni broj sati: neke tablete imaju drugačije upute. Uvijek pročitaj uputu o svom lijeku.',
    reflexesTitle: 'Prvi koraci',
    checkPoints: [
      {title: 'Reagiraj brzo', text: 'Što brže reagiraš nakon što primijetiš propuštenu tabletu, to je lakše slijediti odgovarajuće preporuke.'},
      {title: 'Pročitaj uputu', text: 'Upute se mogu razlikovati ovisno o točnoj vrsti tablete i broju propuštenih tableta.'},
      {title: 'Predvidi dodatnu zaštitu', text: 'U nekim situacijama može se preporučiti kondom tijekom određenog razdoblja.'},
    ],
    body3: 'Sve situacije nisu iste. Neke propuštene tablete zahtijevaju precizniju provjeru preporuka.',
    situations: [
      {title: 'Propuštena samo jedna tableta', text: 'Što učiniti ovisi uglavnom o vremenu proteklom od uobičajenog vremena uzimanja.'},
      {title: 'Propuštena više od jedne tablete', text: 'Ta situacija traži posebnu pozornost i najbolje je precizno pročitati uputu.'},
      {title: 'Nisi sigurna što učiniti', text: 'Ljekarnik ili zdravstveni djelatnik može ti brzo pomoći utvrditi pravi postupak.'},
    ],
    body4: 'Uputa o tvojoj tableti daje točne upute za lijek koji uzimaš. Preporuke se mogu razlikovati ovisno o tome je li riječ o kombiniranoj tableti ili tableti samo s progestinom.',
    referenceTitle: 'Korisne stvari za provjeriti',
    referenceTips: [
      'Drži uputu pri ruci (na primjer fotografiju na telefonu)',
      'Obrati se ljekarniku ako imaš kratko pitanje',
      'Posjeti liječnika ako se to često događa',
    ],
    guideTitle: 'Zašto je važno kad je tableta propuštena?',
    guideText: 'Mjesto propuštene tablete u pakiranju može promijeniti što treba učiniti. Zato uputa često daje različite preporuke ovisno o tjednu pakiranja.',
    body5: 'Ako ne znaš što učiniti, bolje je zatražiti savjet nego ostati u nedoumici. Ljekarnik, babica ili liječnik može ti pomoći provjeriti preporuke prilagođene tvojoj situaciji.',
    questionTitle: 'Informacije koje treba imati spremne',
    questions: [
      'Koja je točna vrsta tablete?',
      'Koliko je vremena prošlo od uobičajenog vremena?',
      'Koliko je tableta propušteno?',
      'U kojem je trenutku pakiranja tableta propuštena?',
      'Je li nedavno bilo nezaštićenog spolnog odnosa?',
    ],
    proTipTitle: 'Dobro je znati',
    proTipText: 'Ako je nezaštićeni spolni odnos bio u vrijeme propuštene tablete, brzo zatraži savjet stručne osobe kako bi saznala koje su mogućnosti dostupne.',
    repeatTitle: 'Ako stalno propuštaš tablete',
    body6: 'Česte propuštene tablete mogu biti znak da svakodnevna rutina ne odgovara u potpunosti tvom načinu života. Ne oklijevaj razgovarati sa zdravstvenim djelatnikom o drugim kontracepcijskim mogućnostima.',
    methodTipTitle: 'Drugačija metoda?',
    methodTipText: 'Ako ti je teško svaki dan uzimati tabletu, postoje druge metode s drugačijom učestalošću primjene.',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'Reagiraj čim primijetiš propuštenu tabletu.',
      'Provjeri točnu vrstu svoje tablete.',
      'Pročitaj uputu kako bi saznala točan postupak.',
      'Koristi dodatnu zaštitu ako je uputa preporučuje.',
      'Zatraži savjet u slučaju nedoumice ili nakon rizičnog odnosa.',
    ],
    finalTipTitle: 'Ključne poruke',
    finalTipText: 'Propuštena tableta automatski ne znači da je tvoja kontracepcija prestala djelovati. Pravi postupak ovisi o vrsti tablete i okolnostima propuštene doze. U slučaju nedoumice pročitaj uputu i brzo zatraži savjet.',
    disclaimerText: 'Ovaj je članak samo informativne naravi i ne zamjenjuje uputu o tvom lijeku ni individualni medicinski savjet. Preporuke se mogu razlikovati ovisno o vrsti tablete.',
  },
  bs: {
    shareMessage: 'Propuštena tableta: što učiniti? — AWA',
    badge: 'PROPUŠTENA TABLETA',
    title: 'Propuštena tableta:\nšta učiniti?',
    metaDuration: '7 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Propuštena tableta može se dogoditi svakome. Što učiniti ovisi uglavnom o tome koliko je prošlo, vrsti tablete i trenutku u pakiranju kad se dogodi.',
    importantTitle: 'Ključna tačka',
    importantText: 'Ne paniči. Najprije provjeri tačnu vrstu svoje tablete i pročitaj uputu o lijeku kako bi saznala preporučeni postupak.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kašnjenje manje od 12 sati',
      'Kašnjenje više od 12 sati',
      'Situacije koje traže dodatnu pozornost',
      'Uputa o lijeku je tvoja referenca',
      'Kada zatražiti savjet',
      'Ključne poruke',
    ],
    body1: 'Kod nekih tableta kašnjenje manje od 12 sati općenito ne ugrožava kontracepcijsku zaštitu. U tom je slučaju uobičajena preporuka uzeti propuštenu tabletu što prije, a zatim nastaviti pakiranje u uobičajeno vrijeme.',
    step1Title: 'Uzmi tabletu',
    step1Text: 'Uzmi tabletu čim primijetiš da kasniš.',
    step2Title: 'Nastavi kao i obično',
    step2Text: 'Zatim se vrati svom uobičajenom rasporedu za sljedeće tablete.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ako uzmeš propuštenu tabletu, a zatim i onu predviđenu za uobičajeno vrijeme, može se dogoditi da se dvije tablete uzmu istog dana.',
    body2: 'Kad kašnjenje premaši vrijeme dopušteno za tvoju tabletu, zaštita može biti smanjena. Što tada učiniti ovisi o vrsti tablete, broju propuštenih tableta i mjestu propuštene tablete u pakiranju.',
    alertTitle: 'Upozorenje',
    alertText: 'Ne oslanjaj se samo na ovdje navedeni broj sati: neke tablete imaju drugačije upute. Uvijek pročitaj uputu o svom lijeku.',
    reflexesTitle: 'Prvi koraci',
    checkPoints: [
      {title: 'Reagiraj brzo', text: 'Što brže reagiraš nakon što primijetiš propuštenu tabletu, to je lakše slijediti odgovarajuće preporuke.'},
      {title: 'Pročitaj uputu', text: 'Upute se mogu razlikovati ovisno o tačnoj vrsti tablete i broju propuštenih tableta.'},
      {title: 'Predvidi dodatnu zaštitu', text: 'U nekim situacijama može se preporučiti kondom tokom određenog razdoblja.'},
    ],
    body3: 'Sve situacije nisu iste. Neke propuštene tablete zahtijevaju precizniju provjeru preporuka.',
    situations: [
      {title: 'Propuštena samo jedna tableta', text: 'Što učiniti ovisi uglavnom o vremenu proteklom od uobičajenog vremena uzimanja.'},
      {title: 'Propuštena više od jedne tablete', text: 'Ta situacija traži posebnu pozornost i najbolje je precizno pročitati uputu.'},
      {title: 'Nisi sigurna što učiniti', text: 'Ljekarnik ili zdravstveni radnik može ti brzo pomoći utvrditi pravi postupak.'},
    ],
    body4: 'Uputa o tvojoj tableti daje tačne upute za lijek koji uzimaš. Preporuke se mogu razlikovati ovisno o tome je li riječ o kombiniranoj tableti ili tableti samo s progestinom.',
    referenceTitle: 'Korisne stvari za provjeriti',
    referenceTips: [
      'Drži uputu pri ruci (na primjer fotografiju na telefonu)',
      'Obrati se ljekarniku ako imaš kratko pitanje',
      'Posjeti ljekara ako se to često događa',
    ],
    guideTitle: 'Zašta je važno kad je tableta propuštena?',
    guideText: 'Mjesto propuštene tablete u pakiranju može promijeniti što treba učiniti. Zato uputa često daje različite preporuke ovisno o sedmici pakiranja.',
    body5: 'Ako ne znaš što učiniti, bolje je zatražiti savjet nego ostati u nedoumici. Ljekarnik, babica ili ljekar može ti pomoći provjeriti preporuke prilagođene tvojoj situaciji.',
    questionTitle: 'Informacije koje treba imati spremne',
    questions: [
      'Koja je tačna vrsta tablete?',
      'Koliko je vremena prošlo od uobičajenog vremena?',
      'Koliko je tableta propušteno?',
      'U kojem je trenutku pakiranja tableta propuštena?',
      'Je li nedavno bilo nezaštićenog spolnog odnosa?',
    ],
    proTipTitle: 'Dobro je znati',
    proTipText: 'Ako je nezaštićeni spolni odnos bio u vrijeme propuštene tablete, brzo zatraži savjet stručne osobe kako bi saznala koje su mogućnosti dostupne.',
    repeatTitle: 'Ako stalno propuštaš tablete',
    body6: 'Česte propuštene tablete mogu biti znak da svakodnevna rutina ne odgovara u potpunosti tvom načinu života. Ne oklijevaj razgovarati sa zdravstvenim radnikom o drugim kontracepcijskim mogućnostima.',
    methodTipTitle: 'Drugačija metoda?',
    methodTipText: 'Ako ti je teško svaki dan uzimati tabletu, postoje druge metode s drugačijom učestalošću primjene.',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'Reagiraj čim primijetiš propuštenu tabletu.',
      'Provjeri tačnu vrstu svoje tablete.',
      'Pročitaj uputu kako bi saznala točan postupak.',
      'Koristi dodatnu zaštitu ako je uputa preporučuje.',
      'Zatraži savjet u slučaju nedoumice ili nakon rizičnog odnosa.',
    ],
    finalTipTitle: 'Ključne poruke',
    finalTipText: 'Propuštena tableta automatski ne znači da je tvoja kontracepcija prestala djelovati. Pravi postupak ovisi o vrsti tablete i okolnostima propuštene doze. U slučaju nedoumice pročitaj uputu i brzo zatraži savjet.',
    disclaimerText: 'Ovaj je članak samo informativne naravi i ne zamjenjuje uputu o tvom lijeku ni individualni medicinski savjet. Preporuke se mogu razlikovati ovisno o vrsti tablete.',
  },
  sl: {
    shareMessage: 'Pozabljena tableta: kaj storiti? — AWA',
    badge: 'POZABLJENA TABLETA',
    title: 'Pozabljena tableta:\nkaj storiti?',
    metaDuration: '7 min branja',
    metaType: 'Pogosta vprašanja',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro: 'Pozabljena tableta se lahko zgodi vsakomur. Kaj storiti, je odvisno predvsem od tega, koliko časa je minilo, vrste tablete in trenutka v pakiranju, ko se zgodi.',
    importantTitle: 'Ključna točka',
    importantText: 'Ne paniči. Najprej preveri točno vrsto svoje tablete in preberi navodila za uporabo zdravila, da izveš priporočen postopek.',
    contentsTitle: 'V tem članku',
    topics: [
      'Zamuda manj kot 12 ur',
      'Zamuda več kot 12 ur',
      'Situacije, ki zahtevajo dodatno pozornost',
      'Navodila za uporabo so tvoja referenca',
      'Kdaj poiskati nasvet',
      'Ključna sporočila',
    ],
    body1: 'Pri nekaterih tabletah zamuda manj kot 12 ur na splošno ne ogroža kontracepcijske zaščite. V tem primeru je običajno priporočilo vzeti pozabljeno tableto čim prej, nato pa nadaljevati pakiranje ob običajnem času.',
    step1Title: 'Vzemi tableto',
    step1Text: 'Vzemi tableto, takoj ko opaziš, da zamujaš.',
    step2Title: 'Nadaljuj kot običajno',
    step2Text: 'Nato se vrni k običajnemu urniku za naslednje tablete.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Če vzameš pozabljeno tableto, nato pa še tisto, predvideno za običajen čas, se lahko zgodi, da se dve tableti vzameta isti dan.',
    body2: 'Ko zamuda preseže čas, dovoljen za tvojo tableto, je zaščita lahko zmanjšana. Kaj storiti takrat, je odvisno od vrste tablete, števila pozabljenih tablet in mesta pozabljene tablete v pakiranju.',
    alertTitle: 'Opozorilo',
    alertText: 'Ne zanašaj se samo na tukaj navedeno število ur: nekatere tablete imajo drugačna navodila. Vedno preberi navodila za uporabo svojega zdravila.',
    reflexesTitle: 'Prvi koraki',
    checkPoints: [
      {title: 'Odzovi se hitro', text: 'Hitreje ko se odzoveš po tem, ko opaziš pozabljeno tableto, lažje je slediti ustreznim priporočilom.'},
      {title: 'Preberi navodila', text: 'Navodila se lahko razlikujejo glede na točno vrsto tablete in število pozabljenih tablet.'},
      {title: 'Predvidi dodatno zaščito', text: 'V nekaterih situacijah se lahko za določeno obdobje priporoči kondom.'},
    ],
    body3: 'Vse situacije niso enake. Nekatere pozabljene tablete zahtevajo natančnejše preverjanje priporočil.',
    situations: [
      {title: 'Pozabljena samo ena tableta', text: 'Kaj storiti, je odvisno predvsem od časa, ki je minil od običajnega časa jemanja.'},
      {title: 'Pozabljena več kot ena tableta', text: 'Ta situacija zahteva posebno pozornost in najbolje je natančno prebrati navodila.'},
      {title: 'Nisi prepričana, kaj storiti', text: 'Lekarnar ali zdravstveni delavec ti lahko hitro pomaga ugotoviti pravi postopek.'},
    ],
    body4: 'Navodila za tvojo tableto podajajo natančna navodila za zdravilo, ki ga jemlješ. Priporočila se lahko razlikujejo glede na to, ali gre za kombinirano tableto ali tableto samo s progestinom.',
    referenceTitle: 'Koristne stvari za preveriti',
    referenceTips: [
      'Navodila imej pri roki (na primer fotografijo na telefonu)',
      'Obrni se na lekarnarja, če imaš kratko vprašanje',
      'Obišči zdravnika, če se to pogosto dogaja',
    ],
    guideTitle: 'Zakaj je pomembno, kdaj je tableta pozabljena?',
    guideText: 'Mesto pozabljene tablete v pakiranju lahko spremeni, kaj je treba storiti. Zato navodila pogosto podajajo različna priporočila glede na teden pakiranja.',
    body5: 'Če ne veš, kaj storiti, je bolje poiskati nasvet, kot ostati v dvomu. Lekarnar, babica ali zdravnik ti lahko pomaga preveriti priporočila, prilagojena tvoji situaciji.',
    questionTitle: 'Podatki, ki jih je treba imeti pripravljene',
    questions: [
      'Katera je točna vrsta tablete?',
      'Koliko časa je minilo od običajnega časa?',
      'Koliko tablet je bilo pozabljenih?',
      'V kateri točki pakiranja je bila tableta pozabljena?',
      'Ali je bilo nedavno nezaščitenega spolnega odnosa?',
    ],
    proTipTitle: 'Vredno vedeti',
    proTipText: 'Če je bil nezaščiten spolni odnos v času pozabljene tablete, hitro poišči nasvet strokovnjaka, da izveš, katere možnosti so na voljo.',
    repeatTitle: 'Če nenehno pozabljaš tablete',
    body6: 'Pogosto pozabljene tablete so lahko znak, da vsakodnevna rutina ne ustreza povsem tvojemu načinu življenja. Ne oklevaj govoriti z zdravstvenim delavcem o drugih kontracepcijskih možnostih.',
    methodTipTitle: 'Drugačna metoda?',
    methodTipText: 'Če ti je težko vsak dan jemati tableto, obstajajo druge metode z drugačno pogostostjo uporabe.',
    summaryTitle: 'Najpomembnejše',
    summaryItems: [
      'Odzovi se, takoj ko opaziš pozabljeno tableto.',
      'Preveri točno vrsto svoje tablete.',
      'Preberi navodila, da izveš natančen postopek.',
      'Uporabi dodatno zaščito, če jo navodila priporočajo.',
      'Poišči nasvet v primeru dvoma ali po tveganem odnosu.',
    ],
    finalTipTitle: 'Ključna sporočila',
    finalTipText: 'Pozabljena tableta samodejno ne pomeni, da je tvoja kontracepcija prenehala delovati. Pravi postopek je odvisen od vrste tablete in okoliščin pozabljenega odmerka. V primeru dvoma preberi navodila in hitro poišči nasvet.',
    disclaimerText: 'Ta članek je samo informativne narave in ne nadomešča navodil za tvoje zdravilo niti osebnega zdravniškega nasveta. Priporočila se lahko razlikujejo glede na vrsto tablete.',
  },
  ne: {
    shareMessage: 'चक्की छुट्यो: के गर्ने? — AWA',
    badge: 'छुटेको चक्की',
    title: 'चक्की छुट्यो:\nके गर्ने?',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'बारम्बार सोधिने प्रश्न',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'चक्की छुट्नु जसलाई पनि हुन सक्छ। के गर्ने भन्ने कुरा मुख्यतया कति समयअघि छुटेको हो, चक्कीको प्रकार, र प्याकको कुन बिन्दुमा भएको हो भन्नेमा निर्भर गर्छ।',
    importantTitle: 'मुख्य कुरा',
    importantText: 'नआत्तिनुहोस्। पहिले आफ्नो चक्कीको सही प्रकार जाँच्नुहोस् र सिफारिस गरिएको कदम जान्न यसको प्याकेज इन्सर्ट हेर्नुहोस्।',
    contentsTitle: 'यो लेखमा',
    topics: [
      '12 घण्टाभन्दा कम ढिलो',
      '12 घण्टाभन्दा बढी ढिलो',
      'थप ध्यान चाहिने अवस्थाहरू',
      'प्याकेज इन्सर्ट नै तपाईंको सन्दर्भ हो',
      'सल्लाह कहिले लिने',
      'मुख्य कुराहरू',
    ],
    body1: 'केही चक्कीका लागि, 12 घण्टाभन्दा कमको ढिलाइले सामान्यतया गर्भनिरोधक सुरक्षालाई असर गर्दैन। यस अवस्थामा, सामान्य सिफारिस छुटेको चक्की सकेसम्म चाँडो लिनु र त्यसपछि प्याक सामान्य समयमै जारी राख्नु हो।',
    step1Title: 'चक्की लिनुहोस्',
    step1Text: 'ढिलो भएको थाहा पाउनेबित्तिकै चक्की लिनुहोस्।',
    step2Title: 'सामान्य रूपमा जारी राख्नुहोस्',
    step2Text: 'त्यसपछि आगामी चक्कीहरूका लागि आफ्नो सामान्य तालिकामा फर्कनुहोस्।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'छुटेको चक्की लिएर त्यसपछि सामान्य समयमा तोकिएको चक्की पनि लिँदा, एकै दिनमा दुईवटा चक्की लिइने हुन सक्छ।',
    body2: 'ढिलाइ तपाईंको चक्कीका लागि अनुमति दिइएको समयभन्दा बढी हुँदा, सुरक्षा घटेको हुन सक्छ। त्यसपछि के गर्ने भन्ने चक्कीको प्रकार, छुटेका चक्कीको सङ्ख्या, र छुटेको चक्की प्याकको कहाँ पर्छ भन्नेमा निर्भर गर्छ।',
    alertTitle: 'चेतावनी',
    alertText: 'यहाँ दिइएका घण्टाको सङ्ख्यामा मात्र भर नपर्नुहोस्: केही चक्कीको निर्देशन फरक हुन्छ। सधैँ आफ्नो औषधिको प्याकेज इन्सर्ट जाँच्नुहोस्।',
    reflexesTitle: 'पहिले गर्नुपर्ने कुराहरू',
    checkPoints: [
      {title: 'छिटो प्रतिक्रिया दिनुहोस्', text: 'छुटेको चक्की थाहा पाएपछि जति छिटो प्रतिक्रिया दिनुहुन्छ, उपयुक्त सिफारिसहरू पछ्याउन त्यति सजिलो हुन्छ।'},
      {title: 'प्याकेज इन्सर्ट जाँच्नुहोस्', text: 'निर्देशनहरू चक्कीको सही प्रकार र छुटेका चक्कीको सङ्ख्याअनुसार फरक हुन सक्छन्।'},
      {title: 'ब्याकअप सुरक्षाको योजना बनाउनुहोस्', text: 'केही अवस्थामा, निश्चित अवधिका लागि कन्डम सिफारिस गर्न सकिन्छ।'},
    ],
    body3: 'सबै अवस्थाहरू उस्तै हुँदैनन्। केही छुटेका चक्कीहरूले सिफारिसहरूको अझ सही जाँच चाहिन्छ।',
    situations: [
      {title: 'एउटा मात्र चक्की छुट्यो', text: 'के गर्ने भन्ने कुरा मुख्यतया लिने सामान्य समयदेखि कति समय बित्यो भन्नेमा निर्भर गर्छ।'},
      {title: 'एकभन्दा बढी चक्की छुट्यो', text: 'यो अवस्थाले विशेष ध्यान चाहिन्छ, र प्याकेज इन्सर्ट सही रूपमा जाँच्नु राम्रो हुन्छ।'},
      {title: 'के गर्ने पक्का छैन', text: 'फार्मासिस्ट वा स्वास्थ्यकर्मीले सही कदम पहिचान गर्न तपाईंलाई छिटो मद्दत गर्न सक्छन्।'},
    ],
    body4: 'तपाईंको चक्कीको प्याकेज इन्सर्टले तपाईंले लिइरहेको औषधिको सही निर्देशन दिन्छ। सिफारिसहरू संयुक्त चक्की हो कि केवल प्रोजेस्टिन भएको चक्की हो भन्नेअनुसार फरक हुन सक्छन्।',
    referenceTitle: 'जाँच्न उपयोगी कुराहरू',
    referenceTips: [
      'प्याकेज इन्सर्ट हातमा राख्नुहोस् (उदाहरणका लागि, फोनमा एउटा फोटो)',
      'छिटो प्रश्न भए फार्मासिस्टसँग सम्पर्क गर्नुहोस्',
      'प्रायः हुन्छ भने चिकित्सकलाई देखाउनुहोस्',
    ],
    guideTitle: 'छुटेको चक्कीको समय किन महत्त्वपूर्ण छ?',
    guideText: 'छुटेको चक्की प्याकको कहाँ पर्छ भन्नेले के गर्ने बदल्न सक्छ। त्यसैले प्याकेज इन्सर्टले प्रायः प्याकको हप्ताअनुसार फरक सिफारिस दिन्छ।',
    body5: 'के गर्ने थाहा छैन भने, शङ्कामा बस्नुभन्दा सल्लाह माग्नु राम्रो हुन्छ। फार्मासिस्ट, सुँडेनी वा चिकित्सकले तपाईंको अवस्थाअनुकूल सिफारिसहरू जाँच्न मद्दत गर्न सक्छन्।',
    questionTitle: 'तयार राख्नुपर्ने जानकारी',
    questions: [
      'यो ठ्याक्कै कुन प्रकारको चक्की हो?',
      'सामान्य समयदेखि कति समय बित्यो?',
      'कतिवटा चक्की छुट्यो?',
      'प्याकको कुन बिन्दुमा चक्की छुट्यो?',
      'हालै असुरक्षित सम्भोग भएको थियो?',
    ],
    proTipTitle: 'जान्न लायक',
    proTipText: 'चक्की छुटेको समयको वरिपरि असुरक्षित सम्भोग भएको थियो भने, कुन विकल्पहरू उपलब्ध छन् जान्न व्यावसायिकसँग छिटो सल्लाह लिनुहोस्।',
    repeatTitle: 'चक्की बारम्बार छुट्छ भने',
    body6: 'बारम्बार छुटेका चक्कीहरू दैनिक दिनचर्या तपाईंको जीवनशैलीसँग राम्ररी नमिलेको संकेत हुन सक्छ। अन्य गर्भनिरोधक विकल्पहरू खोज्न स्वास्थ्यकर्मीसँग कुरा गर्न नहिच्किचाउनुहोस्।',
    methodTipTitle: 'फरक विधि?',
    methodTipText: 'हरेक दिन चक्की लिनु कायम राख्न गाह्रो भए, फरक प्रयोग आवृत्तिका अन्य विधिहरू छन्।',
    summaryTitle: 'आवश्यक कुराहरू',
    summaryItems: [
      'चक्की छुटेको थाहा पाउनेबित्तिकै प्रतिक्रिया दिनुहोस्।',
      'आफ्नो चक्कीको सही प्रकार जाँच्नुहोस्।',
      'सही कदम जान्न प्याकेज इन्सर्ट जाँच्नुहोस्।',
      'प्याकेज इन्सर्टले सिफारिस गरेमा ब्याकअप सुरक्षा प्रयोग गर्नुहोस्।',
      'शङ्का भए वा जोखिमपूर्ण भेटपछि सल्लाह लिनुहोस्।',
    ],
    finalTipTitle: 'मुख्य कुराहरू',
    finalTipText: 'छुटेको चक्कीको अर्थ तपाईंको गर्भनिरोधनले काम गर्न छाडेको स्वतः होइन। सही कदम चक्कीको प्रकार र छुटेको मात्राको परिस्थितिमा निर्भर गर्छ। शङ्का भए, प्याकेज इन्सर्ट जाँच्नुहोस् र छिटो सल्लाह लिनुहोस्।',
    disclaimerText: 'यो लेख केवल जानकारीका लागि प्रदान गरिएको हो र तपाईंको औषधिको प्याकेज इन्सर्ट वा व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन। सिफारिसहरू चक्कीको प्रकारअनुसार फरक हुन सक्छन्।',
  },
  si: {
    shareMessage: 'මග හැරුණු පෙත්ත: කළ යුත්තේ කුමක්ද? — AWA',
    badge: 'මග හැරුණු පෙත්ත',
    title: 'මග හැරුණු පෙත්ත:\nකළ යුත්තේ කුමක්ද?',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'නිති අසන ප්‍රශ්න',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'මග හැරුණු පෙත්තක් ඕනෑම කෙනෙකුට සිදුවිය හැක. කළ යුත්ත ප්‍රධාන වශයෙන් රඳා පවතින්නේ ඔබ එය මග හැරුණේ කොපමණ කාලයකට පෙරද, පෙත්තේ වර්ගය සහ ඇසුරුමේ කුමන අවස්ථාවේදීද යන්න මතය.',
    importantTitle: 'ප්‍රධාන කරුණ',
    importantText: 'කලබල නොවන්න. මුලින්ම ඔබේ පෙත්තේ නිශ්චිත වර්ගය පරීක්ෂා කර නිර්දේශිත ක්‍රියා මාර්ගය දැනගැනීමට එහි ඇසුරුම් පත්‍රිකාව පරීක්ෂා කරන්න.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'පැය 12කට අඩුවෙන් ප්‍රමාද',
      'පැය 12කට වැඩියෙන් ප්‍රමාද',
      'අමතර අවධානය අවශ්‍ය තත්ත්වයන්',
      'ඇසුරුම් පත්‍රිකාව ඔබේ යොමුවයි',
      'උපදෙස් ඉල්ලිය යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    body1: 'සමහර පෙති සඳහා, පැය 12කට අඩු ප්‍රමාදයක් සාමාන්‍යයෙන් ගර්භනිරෝධන ආරක්ෂාවට බාධා නොකරයි. මෙම අවස්ථාවේදී, සුපුරුදු නිර්දේශය නම් මග හැරුණු පෙත්ත හැකි ඉක්මනින් ගෙන, පසුව ඇසුරුම සුපුරුදු වේලාවට දිගටම කරගෙන යාමයි.',
    step1Title: 'පෙත්ත ගන්න',
    step1Text: 'ඔබ ප්‍රමාද වූ බව දුටු විගස පෙත්ත ගන්න.',
    step2Title: 'සුපුරුදු පරිදි දිගටම කරන්න',
    step2Text: 'පසුව ඉදිරි පෙති සඳහා ඔබේ සුපුරුදු කාලසටහනට ආපසු යන්න.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'ඔබ මග හැරුණු පෙත්ත ගෙන, පසුව සුපුරුදු වේලාවට නියමිත එක ගන්නේ නම්, එකම දිනයේ පෙති දෙකක් ගැනීමට සිදුවිය හැක.',
    body2: 'ප්‍රමාදය ඔබේ පෙත්ත සඳහා අවසර ලත් කාලය ඉක්මවන විට, ආරක්ෂාව අඩු විය හැක. එවිට කළ යුත්ත රඳා පවතින්නේ පෙත්තේ වර්ගය, මග හැරුණු පෙති ගණන සහ මග හැරුණු පෙත්ත ඇසුරුමේ කුමන ස්ථානයට වැටේද යන්න මතය.',
    alertTitle: 'අවවාදය',
    alertText: 'මෙහි දක්වා ඇති පැය ගණන මත පමණක් විශ්වාසය නොතබන්න: සමහර පෙති සඳහා වෙනස් උපදෙස් ඇත. සැමවිටම ඔබේ ඖෂධයේ ඇසුරුම් පත්‍රිකාව පරීක්ෂා කරන්න.',
    reflexesTitle: 'කළ යුතු පළමු දේ',
    checkPoints: [
      {title: 'ඉක්මනින් ප්‍රතිචාර දක්වන්න', text: 'ඔබ මග හැරුණු පෙත්ත දුටු පසු ඔබ ඉක්මනින් ප්‍රතිචාර දක්වන තරමට, සුදුසු නිර්දේශ අනුගමනය කිරීම පහසුයි.'},
      {title: 'ඇසුරුම් පත්‍රිකාව පරීක්ෂා කරන්න', text: 'උපදෙස් පෙත්තේ නිශ්චිත වර්ගය සහ මග හැරුණු පෙති ගණන අනුව වෙනස් විය හැක.'},
      {title: 'අතිරේක ආරක්ෂාවක් සැලසුම් කරන්න', text: 'සමහර අවස්ථාවලදී, නිශ්චිත කාලයක් සඳහා කොන්ඩෝමයක් නිර්දේශ කළ හැක.'},
    ],
    body3: 'සියලුම තත්ත්වයන් එක සමාන නොවේ. සමහර මග හැරුණු පෙති සඳහා නිර්දේශ වඩාත් නිවැරදිව පරීක්ෂා කිරීම අවශ්‍ය වේ.',
    situations: [
      {title: 'එක් පෙත්තක් පමණක් මග හැරුණා', text: 'කළ යුත්ත ප්‍රධාන වශයෙන් රඳා පවතින්නේ ගන්නා සුපුරුදු වේලාවේ සිට ගත වූ කාලය මතය.'},
      {title: 'එක් පෙත්තකට වඩා මග හැරුණා', text: 'මෙම තත්ත්වයට විශේෂ අවධානයක් අවශ්‍ය වන අතර, ඇසුරුම් පත්‍රිකාව නිවැරදිව පරීක්ෂා කිරීම වඩා හොඳයි.'},
      {title: 'කුමක් කළ යුතුදැයි විශ්වාස නැත', text: 'ඖෂධවේදියෙකුට හෝ සෞඛ්‍ය වෘත්තිකයෙකුට නිවැරදි ක්‍රියා මාර්ගය ඉක්මනින් හඳුනාගැනීමට ඔබට උදව් කළ හැක.'},
    ],
    body4: 'ඔබේ පෙත්තේ ඇසුරුම් පත්‍රිකාව ඔබ ගන්නා ඖෂධය සඳහා නිශ්චිත උපදෙස් ලබා දෙයි. එය ඒකාබද්ධ පෙත්තක්ද නැතහොත් ප්‍රොජෙස්ටින් පමණක් අඩංගු පෙත්තක්ද යන්න අනුව නිර්දේශ වෙනස් විය හැක.',
    referenceTitle: 'පරීක්ෂා කිරීමට ප්‍රයෝජනවත් දේ',
    referenceTips: [
      'ඇසුරුම් පත්‍රිකාව අතේ තබාගන්න (උදාහරණයක් ලෙස, ඔබේ දුරකථනයේ ඡායාරූපයක්)',
      'ඔබට ඉක්මන් ප්‍රශ්නයක් ඇත්නම් ඖෂධවේදියෙකු අමතන්න',
      'එය නිතර සිදුවන්නේ නම් වෛද්‍යවරයෙකු හමුවන්න',
    ],
    guideTitle: 'මග හැරුණු පෙත්තේ කාලය වැදගත් වන්නේ ඇයි?',
    guideText: 'මග හැරුණු පෙත්ත ඇසුරුමේ වැටෙන ස්ථානය කළ යුත්ත වෙනස් කළ හැක. ඒ නිසා ඇසුරුම් පත්‍රිකාව බොහෝ විට ඇසුරුමේ සතිය අනුව වෙනස් නිර්දේශ ලබා දෙයි.',
    body5: 'ඔබ කුමක් කළ යුතුදැයි නොදන්නේ නම්, සැකයෙන් සිටීමට වඩා උපදෙස් ඉල්ලීම වඩා හොඳයි. ඖෂධවේදියෙකුට, ප්‍රසව හෙදියකට හෝ වෛද්‍යවරයෙකුට ඔබේ තත්ත්වයට ගැළපෙන නිර්දේශ පරීක්ෂා කිරීමට ඔබට උදව් කළ හැක.',
    questionTitle: 'සූදානමින් තිබිය යුතු තොරතුරු',
    questions: [
      'එය නිශ්චිත කුමන වර්ගයේ පෙත්තක්ද?',
      'සුපුරුදු වේලාවේ සිට කොපමණ කාලයක් ගතවී තිබේද?',
      'පෙති කීයක් මග හැරුණාද?',
      'ඇසුරුමේ කුමන අවස්ථාවේදී මග හැරීම සිදු වුණාද?',
      'මෑතකදී ආරක්ෂාවකින් තොරව සංසර්ගයක් සිදු වුණාද?',
    ],
    proTipTitle: 'දැනගත යුතු දේ',
    proTipText: 'මග හැරුණු පෙත්තේ කාලය වටා ආරක්ෂාවකින් තොරව සංසර්ගයක් සිදු වූයේ නම්, ලබාගත හැකි විකල්ප මොනවාදැයි දැනගැනීමට ඉක්මනින් වෘත්තිකයෙකුගෙන් උපදෙස් ඉල්ලන්න.',
    repeatTitle: 'ඔබ නිතර පෙති මග හරින්නේ නම්',
    body6: 'නිතර මග හැරුණු පෙති දෛනික පුරුද්ද ඔබේ ජීවන රටාවට හරියටම නොගැළපෙන බවට සලකුණක් විය හැක. වෙනත් ගර්භනිරෝධන විකල්ප ගවේෂණය කිරීමට සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කිරීමට මැළි නොවන්න.',
    methodTipTitle: 'වෙනස් ක්‍රමයක්ද?',
    methodTipText: 'සෑම දිනකම පෙත්තක් ගැනීම පවත්වා ගැනීමට අපහසු නම්, වෙනස් භාවිත සංඛ්‍යාතයක් සහිත වෙනත් ක්‍රම පවතී.',
    summaryTitle: 'අත්‍යවශ්‍ය දේ',
    summaryItems: [
      'ඔබ මග හැරුණු පෙත්ත දුටු විගස ප්‍රතිචාර දක්වන්න.',
      'ඔබේ පෙත්තේ නිශ්චිත වර්ගය පරීක්ෂා කරන්න.',
      'නිශ්චිත ක්‍රියා මාර්ගය දැනගැනීමට ඇසුරුම් පත්‍රිකාව පරීක්ෂා කරන්න.',
      'ඇසුරුම් පත්‍රිකාව නිර්දේශ කරන්නේ නම් අතිරේක ආරක්ෂාව භාවිතා කරන්න.',
      'සැකයක් ඇත්නම් හෝ අවදානම් සහිත හමුවීමකින් පසු උපදෙස් ඉල්ලන්න.',
    ],
    finalTipTitle: 'ප්‍රධාන කරුණු',
    finalTipText: 'මග හැරුණු පෙත්තක් යනු ඔබේ ගර්භනිරෝධනය ක්‍රියා කිරීම නතර වී ඇති බව ස්වයංක්‍රීයව අදහස් නොවේ. නිවැරදි ක්‍රියා මාර්ගය රඳා පවතින්නේ පෙත්තේ වර්ගය සහ මග හැරුණු මාත්‍රාවේ තත්ත්වයන් මතය. සැකයක් ඇත්නම්, ඇසුරුම් පත්‍රිකාව පරීක්ෂා කර ඉක්මනින් උපදෙස් ඉල්ලන්න.',
    disclaimerText: 'මෙම ලිපිය ඉදිරිපත් කර ඇත්තේ තොරතුරු සඳහා පමණි, එය ඔබේ ඖෂධයේ ඇසුරුම් පත්‍රිකාව හෝ පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී. නිර්දේශ පෙත්තේ වර්ගය අනුව වෙනස් විය හැක.',
  },
  th: {
    shareMessage: 'ลืมทานยาเม็ด: ควรทำอย่างไร? — AWA',
    badge: 'ลืมทานยาเม็ด',
    title: 'ลืมทานยาเม็ด:\nควรทำอย่างไร?',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คำถามที่พบบ่อย',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'การลืมทานยาเม็ดเกิดขึ้นได้กับทุกคน สิ่งที่ควรทำส่วนใหญ่ขึ้นอยู่กับว่าลืมมานานเท่าไร ชนิดของยาเม็ด และลืมในช่วงใดของแผงยา',
    importantTitle: 'ประเด็นสำคัญ',
    importantText: 'อย่าตื่นตระหนก ก่อนอื่นให้ตรวจสอบชนิดที่แน่ชัดของยาเม็ดของคุณ และตรวจเอกสารกำกับยาเพื่อดูแนวทางที่แนะนำ',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ล่าช้าน้อยกว่า 12 ชั่วโมง',
      'ล่าช้ามากกว่า 12 ชั่วโมง',
      'สถานการณ์ที่ต้องใส่ใจเป็นพิเศษ',
      'เอกสารกำกับยาคือแหล่งอ้างอิงของคุณ',
      'เมื่อไรควรขอคำแนะนำ',
      'ประเด็นสำคัญ',
    ],
    body1: 'สำหรับยาเม็ดบางชนิด การล่าช้าน้อยกว่า 12 ชั่วโมงโดยทั่วไปไม่กระทบการป้องกันการตั้งครรภ์ ในกรณีนี้ คำแนะนำตามปกติคือทานยาเม็ดที่ลืมโดยเร็วที่สุด แล้วทานแผงต่อในเวลาปกติ',
    step1Title: 'ทานยาเม็ด',
    step1Text: 'ทานยาเม็ดทันทีที่คุณรู้ว่าล่าช้า',
    step2Title: 'ทำต่อตามปกติ',
    step2Text: 'จากนั้นกลับไปใช้ตารางปกติสำหรับยาเม็ดเม็ดถัดไป',
    tip1Title: 'ควรรู้',
    tip1Text: 'หากคุณทานยาเม็ดที่ลืมแล้วทานเม็ดที่ถึงเวลาตามปกติด้วย อาจทานสองเม็ดในวันเดียวกัน',
    body2: 'เมื่อความล่าช้าเกินเวลาที่ยาเม็ดของคุณอนุญาต การป้องกันอาจลดลง สิ่งที่ควรทำขึ้นอยู่กับชนิดของยาเม็ด จำนวนเม็ดที่ลืม และตำแหน่งของเม็ดที่ลืมในแผงยา',
    alertTitle: 'คำเตือน',
    alertText: 'อย่าอาศัยเพียงจำนวนชั่วโมงที่ให้ไว้ที่นี่: ยาเม็ดบางชนิดมีคำแนะนำต่างกัน ตรวจสอบเอกสารกำกับยาของคุณเสมอ',
    reflexesTitle: 'สิ่งแรกที่ควรทำ',
    checkPoints: [
      {title: 'ตอบสนองอย่างรวดเร็ว', text: 'ยิ่งคุณตอบสนองเร็วหลังสังเกตว่าลืมทานยา ก็ยิ่งปฏิบัติตามคำแนะนำที่เหมาะสมได้ง่ายขึ้น'},
      {title: 'ตรวจเอกสารกำกับยา', text: 'คำแนะนำอาจแตกต่างกันตามชนิดที่แน่ชัดของยาเม็ดและจำนวนเม็ดที่ลืม'},
      {title: 'วางแผนการป้องกันสำรอง', text: 'ในบางสถานการณ์ อาจแนะนำให้ใช้ถุงยางอนามัยเป็นระยะเวลาหนึ่ง'},
    ],
    body3: 'ไม่ใช่ทุกสถานการณ์เหมือนกัน การลืมทานยาเม็ดบางกรณีต้องตรวจคำแนะนำให้แม่นยำยิ่งขึ้น',
    situations: [
      {title: 'ลืมทานเพียงหนึ่งเม็ด', text: 'สิ่งที่ควรทำส่วนใหญ่ขึ้นอยู่กับเวลาที่ผ่านไปนับจากเวลาทานตามปกติ'},
      {title: 'ลืมทานมากกว่าหนึ่งเม็ด', text: 'สถานการณ์นี้ต้องใส่ใจเป็นพิเศษ และควรตรวจเอกสารกำกับยาให้แม่นยำ'},
      {title: 'ไม่แน่ใจว่าควรทำอย่างไร', text: 'เภสัชกรหรือบุคลากรทางการแพทย์ช่วยคุณระบุแนวทางที่ถูกต้องได้อย่างรวดเร็ว'},
    ],
    body4: 'เอกสารกำกับยาเม็ดของคุณให้คำแนะนำที่แม่นยำสำหรับยาที่คุณทาน คำแนะนำอาจต่างกันระหว่างยาเม็ดแบบฮอร์โมนรวมและยาเม็ดแบบโปรเจสตินอย่างเดียว',
    referenceTitle: 'สิ่งที่เป็นประโยชน์ที่ควรตรวจสอบ',
    referenceTips: [
      'เก็บเอกสารกำกับยาไว้ใกล้มือ (เช่น รูปถ่ายในโทรศัพท์ของคุณ)',
      'ติดต่อเภสัชกรหากมีคำถามด่วน',
      'พบแพทย์หากเกิดขึ้นบ่อย',
    ],
    guideTitle: 'ทำไมช่วงเวลาที่ลืมทานยาจึงสำคัญ?',
    guideText: 'ตำแหน่งของเม็ดที่ลืมในแผงอาจเปลี่ยนสิ่งที่ควรทำ นั่นคือเหตุผลที่เอกสารกำกับยามักให้คำแนะนำต่างกันตามสัปดาห์ของแผงยา',
    body5: 'หากคุณไม่รู้ว่าควรทำอย่างไร ควรขอคำแนะนำดีกว่าสงสัยอยู่เฉย ๆ เภสัชกร ผดุงครรภ์ หรือแพทย์ช่วยคุณตรวจคำแนะนำที่เหมาะกับสถานการณ์ของคุณได้',
    questionTitle: 'ข้อมูลที่ควรเตรียมไว้',
    questions: [
      'ยาเม็ดชนิดใดที่แน่ชัด?',
      'เวลาผ่านไปนานเท่าไรนับจากเวลาปกติ?',
      'ลืมทานกี่เม็ด?',
      'ลืมทานในช่วงใดของแผงยา?',
      'เพิ่งมีเพศสัมพันธ์โดยไม่ป้องกันหรือไม่?',
    ],
    proTipTitle: 'ควรรู้',
    proTipText: 'หากมีเพศสัมพันธ์โดยไม่ป้องกันใกล้เวลาที่ลืมทานยา ให้ขอคำแนะนำจากผู้เชี่ยวชาญโดยเร็วเพื่อทราบว่ามีทางเลือกอะไรบ้าง',
    repeatTitle: 'หากคุณลืมทานยาบ่อย',
    body6: 'การลืมทานยาเม็ดบ่อยอาจเป็นสัญญาณว่ากิจวัตรรายวันไม่เหมาะกับวิถีชีวิตของคุณนัก อย่าลังเลที่จะพูดคุยกับบุคลากรทางการแพทย์เพื่อสำรวจทางเลือกการคุมกำเนิดอื่น',
    methodTipTitle: 'วิธีอื่นหรือไม่?',
    methodTipText: 'หากการทานยาเม็ดทุกวันรักษาไว้ได้ยาก มีวิธีอื่นที่ใช้ด้วยความถี่ต่างกัน',
    summaryTitle: 'สาระสำคัญ',
    summaryItems: [
      'ตอบสนองทันทีที่คุณสังเกตว่าลืมทานยา',
      'ตรวจสอบชนิดที่แน่ชัดของยาเม็ดของคุณ',
      'ตรวจเอกสารกำกับยาเพื่อดูแนวทางที่แน่ชัด',
      'ใช้การป้องกันสำรองหากเอกสารกำกับยาแนะนำ',
      'ขอคำแนะนำหากสงสัยหรือหลังมีเพศสัมพันธ์ที่เสี่ยง',
    ],
    finalTipTitle: 'ประเด็นสำคัญ',
    finalTipText: 'การลืมทานยาเม็ดไม่ได้หมายความโดยอัตโนมัติว่าการคุมกำเนิดของคุณหยุดทำงาน แนวทางที่ถูกต้องขึ้นอยู่กับชนิดของยาเม็ดและสถานการณ์ของการลืมทาน หากสงสัย ให้ตรวจเอกสารกำกับยาและขอคำแนะนำอย่างรวดเร็ว',
    disclaimerText: 'บทความนี้ให้ไว้เพื่อให้ข้อมูลเท่านั้น และไม่ได้ทดแทนเอกสารกำกับยาของคุณหรือคำแนะนำทางการแพทย์เฉพาะบุคคล คำแนะนำอาจแตกต่างกันตามชนิดของยาเม็ด',
  },
  vi: {
    shareMessage: 'Quên uống thuốc: nên làm gì? — AWA',
    badge: 'QUÊN UỐNG THUỐC',
    title: 'Quên uống thuốc:\nnên làm gì?',
    metaDuration: '7 phút đọc',
    metaType: 'Câu hỏi thường gặp',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Quên uống một viên thuốc có thể xảy ra với bất kỳ ai. Cách xử lý chủ yếu phụ thuộc vào việc bạn đã quên cách đây bao lâu, loại thuốc và thời điểm trong vỉ thuốc mà việc đó xảy ra.',
    importantTitle: 'Điểm quan trọng',
    importantText: 'Đừng hoảng sợ. Trước hết hãy kiểm tra chính xác loại thuốc của bạn và xem tờ hướng dẫn sử dụng để biết cách xử lý được khuyến nghị.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Muộn dưới 12 giờ',
      'Muộn hơn 12 giờ',
      'Những tình huống cần đặc biệt chú ý',
      'Tờ hướng dẫn sử dụng là tham chiếu của bạn',
      'Khi nào nên tìm lời khuyên',
      'Những điểm chính cần nhớ',
    ],
    body1: 'Với một số loại thuốc, việc muộn dưới 12 giờ nhìn chung không ảnh hưởng đến khả năng bảo vệ tránh thai. Trong trường hợp này, khuyến nghị thông thường là uống viên đã quên càng sớm càng tốt rồi tiếp tục vỉ thuốc vào giờ thường lệ.',
    step1Title: 'Uống thuốc',
    step1Text: 'Uống thuốc ngay khi bạn nhận ra mình đã muộn.',
    step2Title: 'Tiếp tục như bình thường',
    step2Text: 'Sau đó quay lại lịch thông thường cho các viên tiếp theo.',
    tip1Title: 'Nên biết',
    tip1Text: 'Nếu bạn uống viên đã quên rồi uống viên theo lịch vào giờ thường lệ, có thể xảy ra việc uống hai viên trong cùng một ngày.',
    body2: 'Khi độ trễ vượt quá thời gian cho phép của loại thuốc bạn dùng, khả năng bảo vệ có thể giảm. Cách xử lý khi đó phụ thuộc vào loại thuốc, số viên đã quên và vị trí của viên quên trong vỉ.',
    alertTitle: 'Cảnh báo',
    alertText: 'Đừng chỉ dựa vào số giờ được nêu ở đây: một số loại thuốc có hướng dẫn khác. Hãy luôn xem tờ hướng dẫn sử dụng của thuốc.',
    reflexesTitle: 'Những việc cần làm trước tiên',
    checkPoints: [
      {title: 'Phản ứng nhanh', text: 'Bạn phản ứng càng nhanh sau khi nhận ra đã quên thuốc, càng dễ làm theo các khuyến nghị phù hợp.'},
      {title: 'Xem tờ hướng dẫn sử dụng', text: 'Hướng dẫn có thể khác nhau tùy theo loại thuốc chính xác và số viên đã quên.'},
      {title: 'Dự phòng biện pháp bảo vệ bổ sung', text: 'Trong một số tình huống, có thể được khuyên dùng bao cao su trong một khoảng thời gian nhất định.'},
    ],
    body3: 'Không phải tình huống nào cũng giống nhau. Một số trường hợp quên thuốc cần kiểm tra các khuyến nghị chính xác hơn.',
    situations: [
      {title: 'Chỉ quên một viên', text: 'Cách xử lý chủ yếu phụ thuộc vào thời gian đã trôi qua kể từ giờ uống thông thường.'},
      {title: 'Quên nhiều hơn một viên', text: 'Tình huống này cần được đặc biệt chú ý, và tốt nhất nên xem tờ hướng dẫn sử dụng một cách chính xác.'},
      {title: 'Không chắc nên làm gì', text: 'Dược sĩ hoặc nhân viên y tế có thể nhanh chóng giúp bạn xác định cách xử lý đúng.'},
    ],
    body4: 'Tờ hướng dẫn sử dụng của thuốc đưa ra các chỉ dẫn cụ thể cho loại thuốc bạn đang dùng. Các khuyến nghị có thể khác nhau tùy theo đó là thuốc kết hợp hay thuốc chỉ chứa progestin.',
    referenceTitle: 'Những điều hữu ích cần kiểm tra',
    referenceTips: [
      'Để tờ hướng dẫn sử dụng trong tầm tay (ví dụ một bức ảnh trên điện thoại)',
      'Liên hệ dược sĩ nếu bạn có câu hỏi nhanh',
      'Đi khám bác sĩ nếu việc này xảy ra thường xuyên',
    ],
    guideTitle: 'Tại sao thời điểm quên thuốc lại quan trọng?',
    guideText: 'Thời điểm viên thuốc bị quên trong vỉ có thể thay đổi cách xử lý. Đó là lý do tờ hướng dẫn sử dụng thường đưa ra các khuyến nghị khác nhau tùy theo tuần của vỉ thuốc.',
    body5: 'Nếu bạn không biết phải làm gì, tốt hơn là hỏi lời khuyên thay vì cứ nghi ngờ. Dược sĩ, nữ hộ sinh hoặc bác sĩ có thể giúp bạn kiểm tra các khuyến nghị phù hợp với tình huống của mình.',
    questionTitle: 'Thông tin cần chuẩn bị sẵn',
    questions: [
      'Chính xác đó là loại thuốc nào?',
      'Đã trôi qua bao lâu kể từ giờ thường lệ?',
      'Đã quên bao nhiêu viên?',
      'Viên thuốc bị quên xảy ra ở thời điểm nào trong vỉ?',
      'Gần đây có quan hệ không bảo vệ không?',
    ],
    proTipTitle: 'Nên biết',
    proTipText: 'Nếu có quan hệ không bảo vệ vào khoảng thời điểm quên thuốc, hãy nhanh chóng hỏi chuyên gia để biết có những lựa chọn nào.',
    repeatTitle: 'Nếu bạn liên tục quên thuốc',
    body6: 'Việc thường xuyên quên thuốc có thể là dấu hiệu cho thấy thói quen hằng ngày không thực sự phù hợp với lối sống của bạn. Đừng ngần ngại nói chuyện với nhân viên y tế để tìm hiểu các lựa chọn tránh thai khác.',
    methodTipTitle: 'Một phương pháp khác?',
    methodTipText: 'Nếu việc uống thuốc mỗi ngày khó duy trì, có những phương pháp khác với tần suất sử dụng khác.',
    summaryTitle: 'Điều thiết yếu',
    summaryItems: [
      'Hãy xử lý ngay khi nhận ra đã quên thuốc.',
      'Kiểm tra chính xác loại thuốc của bạn.',
      'Xem tờ hướng dẫn sử dụng để biết cách xử lý cụ thể.',
      'Dùng biện pháp bảo vệ bổ sung nếu tờ hướng dẫn sử dụng khuyến nghị.',
      'Hỏi lời khuyên nếu nghi ngờ hoặc sau một lần quan hệ có rủi ro.',
    ],
    finalTipTitle: 'Những điểm chính cần nhớ',
    finalTipText: 'Quên một viên thuốc không tự động có nghĩa là biện pháp tránh thai của bạn đã ngừng hiệu quả. Cách xử lý đúng phụ thuộc vào loại thuốc và hoàn cảnh của liều bị quên. Nếu nghi ngờ, hãy xem tờ hướng dẫn sử dụng và nhanh chóng hỏi lời khuyên.',
    disclaimerText: 'Bài viết này chỉ được cung cấp với mục đích thông tin và không thay thế tờ hướng dẫn sử dụng thuốc của bạn hay lời khuyên y khoa cá nhân hóa. Các khuyến nghị có thể khác nhau tùy theo loại thuốc.',
  },
  uz: {
    shareMessage: 'Tabletka unutildi: nima qilish kerak? — AWA',
    badge: 'UNUTILGAN TABLETKA',
    title: 'Tabletka unutildi:\nnima qilish kerak?',
    metaDuration: '7 daq oʻqish',
    metaType: 'Savol-javob',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Tabletkani unutish har kimda boʻlishi mumkin. Nima qilish kerakligi asosan qancha vaqt oldin unutganingizga, tabletka turiga va bu qutining qaysi qismida sodir boʻlganiga bogʻliq.',
    importantTitle: 'Asosiy nuqta',
    importantText: 'Vahimaga tushmang. Avval tabletkangizning aniq turini tekshiring va tavsiya etilgan harakatni bilish uchun qoʻllanma varaqasini koʻring.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      '12 soatdan kam kechikish',
      '12 soatdan ortiq kechikish',
      'Qoʻshimcha eʼtibor talab qiladigan vaziyatlar',
      'Qoʻllanma varaqasi — sizning manbangiz',
      'Qachon maslahat soʻrash kerak',
      'Asosiy xulosalar',
    ],
    body1: 'Baʼzi tabletkalar uchun 12 soatdan kam kechikish odatda kontratseptiv himoyaga zarar yetkazmaydi. Bunday holda odatiy tavsiya — unutilgan tabletkani imkon qadar tezroq ichish, keyin qutini odatdagi vaqtda davom ettirish.',
    step1Title: 'Tabletkani iching',
    step1Text: 'Kechikkaningizni sezishingiz bilan tabletkani iching.',
    step2Title: 'Odatdagidek davom eting',
    step2Text: 'Keyin keyingi tabletkalar uchun odatiy jadvalingizga qayting.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Agar unutilgan tabletkani va odatiy vaqtga belgilangan tabletkani ichsangiz, bir kunda ikkita tabletka ichilishi mumkin.',
    body2: 'Kechikish tabletkangiz uchun ruxsat etilgan vaqtdan oshganda, himoya kamayishi mumkin. U holda nima qilish tabletka turiga, unutilgan tabletkalar soniga va unutilgan tabletka qutining qaysi qismiga toʻgʻri kelishiga bogʻliq.',
    alertTitle: 'Ogohlantirish',
    alertText: 'Faqat bu yerda keltirilgan soatlar soniga tayanmang: baʼzi tabletkalarning koʻrsatmalari boshqacha. Doim dorining qoʻllanma varaqasini tekshiring.',
    reflexesTitle: 'Birinchi qadamlar',
    checkPoints: [
      {title: 'Tez harakat qiling', text: 'Unutilgan tabletkani sezganingizdan keyin qanchalik tez harakat qilsangiz, mos tavsiyalarga amal qilish shunchalik oson.'},
      {title: 'Qoʻllanma varaqasini tekshiring', text: 'Koʻrsatmalar tabletkaning aniq turiga va unutilgan tabletkalar soniga qarab farq qilishi mumkin.'},
      {title: 'Qoʻshimcha himoyani rejalashtiring', text: 'Baʼzi vaziyatlarda maʼlum muddat prezervativ tavsiya etilishi mumkin.'},
    ],
    body3: 'Barcha vaziyatlar bir xil emas. Baʼzi unutilgan tabletkalar tavsiyalarni aniqroq tekshirishni talab qiladi.',
    situations: [
      {title: 'Faqat bitta tabletka unutilgan', text: 'Nima qilish asosan ichishning odatiy vaqtidan beri oʻtgan vaqtga bogʻliq.'},
      {title: 'Bir nechta tabletka unutilgan', text: 'Bu vaziyat alohida eʼtiborni talab qiladi va qoʻllanma varaqasini aniq tekshirgan maʼqul.'},
      {title: 'Nima qilishni bilmaysiz', text: 'Farmatsevt yoki sogʻliqni saqlash mutaxassisi toʻgʻri harakatni tezda aniqlashga yordam beradi.'},
    ],
    body4: 'Tabletkangizning qoʻllanma varaqasi siz qabul qilayotgan dori uchun aniq koʻrsatmalarni beradi. Tavsiyalar kombinatsiyalangan tabletka yoki faqat progestinli tabletka ekaniga qarab farq qilishi mumkin.',
    referenceTitle: 'Tekshirish foydali narsalar',
    referenceTips: [
      'Qoʻllanma varaqasini qoʻl ostida saqlang (masalan, telefondagi surati)',
      'Tezkor savolingiz boʻlsa, farmatsevtga murojaat qiling',
      'Bu koʻp takrorlansa, shifokorga boring',
    ],
    guideTitle: 'Unutilgan tabletka vaqti nima uchun muhim?',
    guideText: 'Unutilgan tabletka qutining qaysi qismiga toʻgʻri kelishi nima qilish kerakligini oʻzgartirishi mumkin. Shuning uchun qoʻllanma varaqasida koʻpincha qutining haftasiga qarab turli tavsiyalar beriladi.',
    body5: 'Agar nima qilishni bilmasangiz, shubhada qolgandan koʻra maslahat soʻragan yaxshi. Farmatsevt, doya yoki shifokor vaziyatingizga mos tavsiyalarni tekshirishga yordam beradi.',
    questionTitle: 'Tayyor boʻlishi kerak boʻlgan maʼlumotlar',
    questions: [
      'Aniq qanday turdagi tabletka?',
      'Odatiy vaqtdan beri qancha vaqt oʻtdi?',
      'Nechta tabletka unutildi?',
      'Tabletka qutining qaysi qismida unutildi?',
      'Yaqinda himoyasiz jinsiy aloqa boʻldimi?',
    ],
    proTipTitle: 'Bilish foydali',
    proTipText: 'Agar himoyasiz jinsiy aloqa tabletka unutilgan vaqtga yaqin boʻlsa, qanday imkoniyatlar borligini bilish uchun mutaxassisdan tezda maslahat soʻrang.',
    repeatTitle: 'Tabletkani tez-tez unutsangiz',
    body6: 'Tez-tez unutilgan tabletkalar kundalik tartib turmush tarzingizga unchalik mos kelmasligining belgisi boʻlishi mumkin. Boshqa kontratseptiv variantlarni oʻrganish uchun sogʻliqni saqlash mutaxassisi bilan gaplashishdan tortinmang.',
    methodTipTitle: 'Boshqa usul?',
    methodTipText: 'Agar har kuni tabletka ichish qiyin boʻlsa, boshqa foydalanish chastotasiga ega boshqa usullar mavjud.',
    summaryTitle: 'Asosiy jihatlar',
    summaryItems: [
      'Unutilgan tabletkani sezishingiz bilan harakat qiling.',
      'Tabletkangizning aniq turini tekshiring.',
      'Aniq harakatni bilish uchun qoʻllanma varaqasini tekshiring.',
      'Qoʻllanma varaqasi tavsiya qilsa, qoʻshimcha himoyadan foydalaning.',
      'Shubha boʻlsa yoki xavfli aloqadan keyin maslahat soʻrang.',
    ],
    finalTipTitle: 'Asosiy xulosalar',
    finalTipText: 'Unutilgan tabletka kontratseptsiyangiz ishlamay qolganini avtomatik anglatmaydi. Toʻgʻri harakat tabletka turiga va dozani unutish holatlariga bogʻliq. Shubha boʻlsa, qoʻllanma varaqasini tekshiring va tezda maslahat soʻrang.',
    disclaimerText: 'Bu maqola faqat maʼlumot uchun berilgan va dorining qoʻllanma varaqasi yoki shaxsiy tibbiy maslahatni almashtirmaydi. Tavsiyalar tabletka turiga qarab farq qilishi mumkin.',
  },
  az: {
    shareMessage: 'Buraxılmış hap: nə etmək lazımdır? — AWA',
    badge: 'BURAXILMIŞ HAP',
    title: 'Buraxılmış hap:\nnə etmək lazımdır?',
    metaDuration: '7 dəq oxu',
    metaType: 'FAQ',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Hapı buraxmaq hər kəsin başına gələ bilər. Nə etmək lazım olduğu əsasən onu nə qədər əvvəl buraxdığınızdan, hapın növündən və blisterin hansı mərhələsində baş verdiyindən asılıdır.',
    importantTitle: 'Əsas məqam',
    importantText: 'Panikaya düşməyin. Əvvəlcə hapınızın dəqiq növünü yoxlayın və tövsiyə olunan addımları öyrənmək üçün təlimatına baxın.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      '12 saatdan az gecikmə',
      '12 saatdan çox gecikmə',
      'Əlavə diqqət tələb edən vəziyyətlər',
      'Təlimat sizin istinad mənbənizdir',
      'Nə vaxt məsləhət almaq lazımdır',
      'Əsas nəticələr',
    ],
    body1: 'Bəzi hablar üçün 12 saatdan az gecikmə adətən kontraseptiv qorumanı pozmur. Bu halda adi tövsiyə buraxılmış hapı mümkün qədər tez qəbul etmək, sonra blisteri adi vaxtda davam etməkdir.',
    step1Title: 'Hapı qəbul edin',
    step1Text: 'Gecikdiyinizi görən kimi hapı qəbul edin.',
    step2Title: 'Adi qaydada davam edin',
    step2Text: 'Sonra sonrakı hablar üçün adi cədvələ qayıdın.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Buraxılmış hapı, sonra isə adi vaxtda nəzərdə tutulmuş hapı qəbul etsəniz, eyni gündə iki hap qəbul edilə bilər.',
    body2: 'Gecikmə hapınız üçün icazə verilən vaxtı keçdikdə qoruma azala bilər. Bu zaman nə etmək lazım olduğu hapın növündən, buraxılmış hapların sayından və buraxılmış hapın blisterin harasına düşdüyündən asılıdır.',
    alertTitle: 'Xəbərdarlıq',
    alertText: 'Yalnız burada verilən saatların sayına arxalanmayın: bəzi hapların təlimatları fərqlidir. Həmişə dərmanınızın təlimatına baxın.',
    reflexesTitle: 'İlk görüləcək işlər',
    checkPoints: [
      {title: 'Tez reaksiya verin', text: 'Buraxılmış hapı fərq etdikdən sonra nə qədər tez reaksiya versəniz, müvafiq tövsiyələrə əməl etmək bir o qədər asan olar.'},
      {title: 'Təlimatı yoxlayın', text: 'Göstərişlər hapın dəqiq növündən və buraxılmış hapların sayından asılı olaraq dəyişə bilər.'},
      {title: 'Ehtiyat qorumanı planlaşdırın', text: 'Bəzi vəziyyətlərdə müəyyən müddət üçün prezervativ tövsiyə oluna bilər.'},
    ],
    body3: 'Bütün vəziyyətlər eyni deyil. Bəzi buraxılmış hablar tövsiyələrin daha dəqiq yoxlanılmasını tələb edir.',
    situations: [
      {title: 'Yalnız bir hap buraxılıb', text: 'Nə etmək lazım olduğu əsasən adi qəbul vaxtından keçən müddətdən asılıdır.'},
      {title: 'Birdən çox hap buraxılıb', text: 'Bu vəziyyət xüsusi diqqət tələb edir və təlimatı dəqiq yoxlamaq yaxşıdır.'},
      {title: 'Nə etməyi bilmirsiniz', text: 'Əczaçı və ya tibb işçisi düzgün addımı tez müəyyən etməyə kömək edə bilər.'},
    ],
    body4: 'Hapınızın təlimatı qəbul etdiyiniz dərman üçün dəqiq göstərişlər verir. Tövsiyələr kombinə edilmiş hap və ya yalnız progestinli hap olmasından asılı olaraq fərqlənə bilər.',
    referenceTitle: 'Yoxlamağa dəyər faydalı məqamlar',
    referenceTips: [
      'Təlimatı əlinizin altında saxlayın (məsələn, telefonda şəkil)',
      'Qısa sualınız varsa, əczaçı ilə əlaqə saxlayın',
      'Tez-tez baş verərsə, həkimə müraciət edin',
    ],
    guideTitle: 'Buraxılmış hapın vaxtı nə üçün vacibdir?',
    guideText: 'Buraxılmış hapın blisterin harasına düşməsi nə etməli olduğunuzu dəyişə bilər. Buna görə də təlimat çox vaxt blisterin həftəsindən asılı olaraq fərqli tövsiyələr verir.',
    body5: 'Nə edəcəyinizi bilmirsinizsə, şübhədə qalmaqdansa, məsləhət istəmək daha yaxşıdır. Əczaçı, mama və ya həkim vəziyyətinizə uyğun tövsiyələri yoxlamağa kömək edə bilər.',
    questionTitle: 'Hazır olmalı məlumatlar',
    questions: [
      'Bu, dəqiq hansı növ hapdır?',
      'Adi vaxtdan nə qədər vaxt keçib?',
      'Neçə hap buraxılıb?',
      'Hap blisterin hansı mərhələsində buraxılıb?',
      'Yaxınlarda qorunmasız cinsi əlaqə olubmu?',
    ],
    proTipTitle: 'Bilmək faydalıdır',
    proTipText: 'Hapın buraxıldığı vaxt ətrafında qorunmasız cinsi əlaqə olubsa, hansı variantların mövcud olduğunu öyrənmək üçün tez mütəxəssisdən məsləhət alın.',
    repeatTitle: 'Hapı tez-tez buraxırsınızsa',
    body6: 'Tez-tez buraxılmış hablar gündəlik rutinin həyat tərzinizə tam uyğun gəlmədiyinin əlaməti ola bilər. Digər kontraseptiv variantları araşdırmaq üçün tibb işçisi ilə danışmaqdan çəkinməyin.',
    methodTipTitle: 'Fərqli üsul?',
    methodTipText: 'Hər gün hap qəbul etmək çətindirsə, fərqli istifadə tezliyinə malik digər üsullar mövcuddur.',
    summaryTitle: 'Əsas məsələlər',
    summaryItems: [
      'Buraxılmış hapı fərq etdiyiniz anda reaksiya verin.',
      'Hapınızın dəqiq növünü yoxlayın.',
      'Dəqiq addımı öyrənmək üçün təlimatı yoxlayın.',
      'Təlimat tövsiyə edirsə, ehtiyat qorumadan istifadə edin.',
      'Şübhə olarsa və ya riskli əlaqədən sonra məsləhət alın.',
    ],
    finalTipTitle: 'Əsas nəticələr',
    finalTipText: 'Buraxılmış hap kontrasepsiyanızın avtomatik olaraq dayandığı demək deyil. Düzgün addım hapın növündən və buraxılma şəraitindən asılıdır. Şübhə olarsa, təlimatı yoxlayın və tez məsləhət alın.',
    disclaimerText: 'Bu məqalə yalnız məlumat məqsədilə təqdim olunur və dərmanınızın təlimatını və ya fərdi tibbi məsləhəti əvəz etmir. Tövsiyələr hapın növündən asılı olaraq dəyişə bilər.',
  },
  ka: {
    shareMessage: 'გამოტოვებული აბი: რა გავაკეთოთ? — AWA',
    badge: 'გამოტოვებული აბი',
    title: 'გამოტოვებული აბი:\nრა გავაკეთოთ?',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'ხშირი კითხვები',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'აბის გამოტოვება ნებისმიერს შეიძლება დაემართოს. რა უნდა გააკეთოთ, ძირითადად დამოკიდებულია იმაზე, რამდენი ხნის წინ გამოტოვეთ, აბის ტიპზე და შეფუთვის რომელ მომენტში მოხდა ეს.',
    importantTitle: 'მთავარი საკითხი',
    importantText: 'ნუ დაიბნევით. ჯერ შეამოწმეთ თქვენი აბის ზუსტი ტიპი და გადაამოწმეთ მისი ინსტრუქცია, რეკომენდებული მოქმედების გასაგებად.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      '12 საათზე ნაკლებით დაგვიანება',
      '12 საათზე მეტით დაგვიანება',
      'სიტუაციები, რომლებიც დამატებით ყურადღებას საჭიროებს',
      'ინსტრუქცია თქვენი საორიენტაციო წყაროა',
      'როდის ვითხოვოთ რჩევა',
      'მთავარი დასკვნები',
    ],
    body1: 'ზოგი აბისთვის 12 საათზე ნაკლები დაგვიანება, როგორც წესი, კონტრაცეპტიულ დაცვას არ არღვევს. ამ შემთხვევაში ჩვეულებრივი რეკომენდაციაა, გამოტოვებული აბი რაც შეიძლება მალე მიიღოთ და შემდეგ შეფუთვა ჩვეულებრივ დროს გააგრძელოთ.',
    step1Title: 'მიიღეთ აბი',
    step1Text: 'მიიღეთ აბი, როგორც კი შეამჩნევთ, რომ დააგვიანეთ.',
    step2Title: 'გააგრძელეთ ჩვეულებრივად',
    step2Text: 'შემდეგ დაუბრუნდით თქვენს ჩვეულებრივ გრაფიკს მომდევნო აბებისთვის.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'თუ გამოტოვებულ აბს და შემდეგ ჩვეულებრივ დროს დაგეგმილ აბს მიიღებთ, შეიძლება ერთსა და იმავე დღეს ორი აბი მიიღოთ.',
    body2: 'როცა დაგვიანება თქვენი აბისთვის დაშვებულ დროს აღემატება, დაცვა შეიძლება შემცირდეს. რა უნდა გააკეთოთ მაშინ, დამოკიდებულია აბის ტიპზე, გამოტოვებული აბების რაოდენობაზე და იმაზე, შეფუთვის რომელ ნაწილში მოდის გამოტოვებული აბი.',
    alertTitle: 'გაფრთხილება',
    alertText: 'ნუ დაეყრდნობით მხოლოდ აქ მოცემულ საათების რაოდენობას: ზოგ აბს განსხვავებული ინსტრუქცია აქვს. ყოველთვის გადაამოწმეთ თქვენი მედიკამენტის ინსტრუქცია.',
    reflexesTitle: 'პირველი, რაც უნდა გააკეთოთ',
    checkPoints: [
      {title: 'სწრაფად იმოქმედეთ', text: 'რაც უფრო სწრაფად იმოქმედებთ გამოტოვებული აბის შემჩნევის შემდეგ, მით უფრო ადვილია სათანადო რეკომენდაციების შესრულება.'},
      {title: 'გადაამოწმეთ ინსტრუქცია', text: 'მითითებები შეიძლება განსხვავდებოდეს აბის ზუსტი ტიპისა და გამოტოვებული აბების რაოდენობის მიხედვით.'},
      {title: 'დაგეგმეთ სათადარიგო დაცვა', text: 'ზოგ სიტუაციაში გარკვეული პერიოდის განმავლობაში შეიძლება პრეზერვატივი ჩაითვალოს რეკომენდებულად.'},
    ],
    body3: 'ყველა სიტუაცია ერთნაირი არ არის. ზოგი გამოტოვებული აბი რეკომენდაციების უფრო ზუსტ შემოწმებას მოითხოვს.',
    situations: [
      {title: 'გამოტოვებულია მხოლოდ ერთი აბი', text: 'რა უნდა გააკეთოთ, ძირითადად დამოკიდებულია მიღების ჩვეულებრივი დროიდან გასულ დროზე.'},
      {title: 'გამოტოვებულია ერთზე მეტი აბი', text: 'ეს სიტუაცია განსაკუთრებულ ყურადღებას საჭიროებს და უმჯობესია ინსტრუქცია ზუსტად გადაამოწმოთ.'},
      {title: 'არ იცით, რა გააკეთოთ', text: 'ფარმაცევტს ან ჯანდაცვის სპეციალისტს შეუძლია სწრაფად დაგეხმაროთ სწორი მოქმედების დადგენაში.'},
    ],
    body4: 'თქვენი აბის ინსტრუქცია იძლევა ზუსტ მითითებებს იმ მედიკამენტისთვის, რომელსაც იღებთ. რეკომენდაციები შეიძლება განსხვავდებოდეს იმის მიხედვით, კომბინირებული აბია თუ მხოლოდ პროგესტინის შემცველი აბი.',
    referenceTitle: 'სასარგებლო გადასამოწმებელი საკითხები',
    referenceTips: [
      'ინსტრუქცია ხელთ გქონდეთ (მაგალითად, ფოტო ტელეფონში)',
      'სწრაფი კითხვის შემთხვევაში დაუკავშირდით ფარმაცევტს',
      'მიმართეთ ექიმს, თუ ეს ხშირად ხდება',
    ],
    guideTitle: 'რატომ არის მნიშვნელოვანი გამოტოვებული აბის დრო?',
    guideText: 'შეფუთვის რომელ ნაწილში მოდის გამოტოვებული აბი, შეიძლება შეცვალოს, რა უნდა გააკეთოთ. ამიტომ ინსტრუქცია ხშირად შეფუთვის კვირის მიხედვით განსხვავებულ რეკომენდაციებს იძლევა.',
    body5: 'თუ არ იცით, რა გააკეთოთ, უმჯობესია რჩევა ითხოვოთ, ვიდრე ეჭვში დარჩეთ. ფარმაცევტს, ბებიაქალს ან ექიმს შეუძლია დაგეხმაროთ თქვენს სიტუაციაზე მორგებული რეკომენდაციების შემოწმებაში.',
    questionTitle: 'ინფორმაცია, რომელიც მზად უნდა გქონდეთ',
    questions: [
      'რა ზუსტი ტიპის აბია ეს?',
      'რამდენი დრო გავიდა ჩვეულებრივი დროიდან?',
      'რამდენი აბი გამოტოვდა?',
      'შეფუთვის რომელ მომენტში მოხდა აბის გამოტოვება?',
      'ახლახან იყო თუ არა დაუცველი სქესობრივი კავშირი?',
    ],
    proTipTitle: 'კარგია ვიცოდეთ',
    proTipText: 'თუ დაუცველი სქესობრივი კავშირი აბის გამოტოვების დროს ან მის გარშემო მოხდა, სწრაფად ჰკითხეთ რჩევა სპეციალისტს, რომ გაიგოთ, რა ვარიანტებია ხელმისაწვდომი.',
    repeatTitle: 'თუ აბებს განმეორებით გამოტოვებთ',
    body6: 'ხშირი გამოტოვებული აბები შეიძლება იმის ნიშანი იყოს, რომ ყოველდღიური რუტინა თქვენს ცხოვრების წესს ზუსტად არ ერგება. ნუ დააყოვნებთ ჯანდაცვის სპეციალისტთან საუბარს, სხვა კონტრაცეპტიული ვარიანტების შესასწავლად.',
    methodTipTitle: 'სხვა მეთოდი?',
    methodTipText: 'თუ ყოველდღიურად აბის მიღების შენარჩუნება რთულია, არსებობს სხვა მეთოდები, გამოყენების განსხვავებული სიხშირით.',
    summaryTitle: 'მთავარი',
    summaryItems: [
      'იმოქმედეთ, როგორც კი გამოტოვებულ აბს შეამჩნევთ.',
      'შეამოწმეთ თქვენი აბის ზუსტი ტიპი.',
      'გადაამოწმეთ ინსტრუქცია ზუსტი მოქმედების გასაგებად.',
      'გამოიყენეთ სათადარიგო დაცვა, თუ ინსტრუქცია ამას გირჩევთ.',
      'ეჭვის შემთხვევაში ან სარისკო კონტაქტის შემდეგ ჰკითხეთ რჩევა.',
    ],
    finalTipTitle: 'მთავარი დასკვნები',
    finalTipText: 'გამოტოვებული აბი ავტომატურად არ ნიშნავს, რომ თქვენმა კონტრაცეფციამ მუშაობა შეწყვიტა. სწორი მოქმედება დამოკიდებულია აბის ტიპზე და გამოტოვების გარემოებებზე. ეჭვის შემთხვევაში გადაამოწმეთ ინსტრუქცია და სწრაფად ითხოვეთ რჩევა.',
    disclaimerText: 'ეს სტატია მხოლოდ საინფორმაციოა და თქვენი მედიკამენტის ინსტრუქციას ან პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს. რეკომენდაციები აბის ტიპის მიხედვით შეიძლება განსხვავდებოდეს.',
  },
  hy: {
    shareMessage: 'Հաբը բաց է թողնվել. ինչ անել — AWA',
    badge: 'ԲԱՑ ԹՈՂՆՎԱԾ ՀԱԲ',
    title: 'Հաբը բաց է թողնվել.\nինչ անել',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'ՀՏՀ',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Բաց թողնված հաբը կարող է պատահել ցանկացածի հետ: Ինչ անելը հիմնականում կախված է նրանից, թե որքան ժամանակ առաջ եք բաց թողել այն, հաբի տեսակից և փաթեթի որ հատվածում է դա պատահել:',
    importantTitle: 'Հիմնական կետը',
    importantText: 'Խուճապի մի մատնվեք: Նախ ստուգեք ձեր հաբի ճշգրիտ տեսակը և կարդացեք դրա օգտագործման հրահանգը՝ խորհուրդ տրվող գործողությունները իմանալու համար:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ուշացում 12 ժամից պակաս',
      'Ուշացում 12 ժամից ավելի',
      'Իրավիճակներ, որոնք լրացուցիչ ուշադրություն են պահանջում',
      'Օգտագործման հրահանգը ձեր հիմնական հղումն է',
      'Երբ խորհուրդ հարցնել',
      'Հիմնական եզրակացություններ',
    ],
    body1: 'Որոշ հաբերի դեպքում 12 ժամից պակաս ուշացումը սովորաբար չի վտանգում հակաբեղմնավորիչ պաշտպանությունը: Այս դեպքում սովորական խորհուրդն է՝ հնարավորինս շուտ ընդունել բաց թողնված հաբը, ապա շարունակել փաթեթը սովորական ժամին:',
    step1Title: 'Ընդունեք հաբը',
    step1Text: 'Ընդունեք հաբը հենց նկատեք, որ ուշացել եք:',
    step2Title: 'Շարունակեք սովորականի պես',
    step2Text: 'Այնուհետև վերադարձեք ձեր սովորական ժամանակացույցին հաջորդ հաբերի համար:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Եթե ընդունում եք բաց թողնված հաբը, ապա նաև սովորական ժամին նախատեսվածը, կարող է պատահել, որ նույն օրը երկու հաբ ընդունվի:',
    body2: 'Երբ ուշացումը գերազանցում է ձեր հաբի համար թույլատրելի ժամանակը, պաշտպանությունը կարող է նվազել: Այդ դեպքում ինչ անելը կախված է հաբի տեսակից, բաց թողնված հաբերի քանակից և այն բանից, թե փաթեթի որ հատվածում է բաց թողնված հաբը:',
    alertTitle: 'Զգուշացում',
    alertText: 'Մի հիմնվեք միայն այստեղ նշված ժամերի քանակի վրա. որոշ հաբեր ունեն տարբեր հրահանգներ: Միշտ ստուգեք ձեր դեղամիջոցի օգտագործման հրահանգը:',
    reflexesTitle: 'Առաջին անելիքներ',
    checkPoints: [
      {title: 'Արագ արձագանքեք', text: 'Որքան արագ եք արձագանքում բաց թողնված հաբը նկատելուց հետո, այնքան ավելի հեշտ է հետևել համապատասխան խորհուրդներին:'},
      {title: 'Ստուգեք օգտագործման հրահանգը', text: 'Հրահանգները կարող են տարբերվել՝ կախված հաբի ճշգրիտ տեսակից և բաց թողնված հաբերի քանակից:'},
      {title: 'Նախատեսեք պահուստային պաշտպանություն', text: 'Որոշ իրավիճակներում որոշակի ժամանակահատվածի համար կարող է խորհուրդ տրվել պահպանակ:'},
    ],
    body3: 'Բոլոր իրավիճակները նման չեն: Որոշ բաց թողնված հաբեր պահանջում են խորհուրդների ավելի ճշգրիտ ստուգում:',
    situations: [
      {title: 'Բաց թողնված է միայն մեկ հաբ', text: 'Ինչ անելը հիմնականում կախված է ընդունման սովորական ժամից անցած ժամանակից:'},
      {title: 'Բաց թողնված է մեկից ավելի հաբ', text: 'Այս իրավիճակը հատուկ ուշադրություն է պահանջում, և լավագույնն է ճշգրիտ ստուգել օգտագործման հրահանգը:'},
      {title: 'Վստահ չեք, թե ինչ անել', text: 'Դեղագործը կամ առողջապահության մասնագետը կարող է արագ օգնել բացահայտել ճիշտ գործողությունը:'},
    ],
    body4: 'Ձեր հաբի օգտագործման հրահանգը տալիս է ճշգրիտ ցուցումներ այն դեղամիջոցի համար, որը ընդունում եք: Խորհուրդները կարող են տարբերվել՝ կախված նրանից, թե դա համակցված հաբ է, թե միայն պրոգեստին պարունակող:',
    referenceTitle: 'Օգտակար բաներ ստուգելու համար',
    referenceTips: [
      'Օգտագործման հրահանգը պահեք ձեռքի տակ (օրինակ՝ լուսանկար հեռախոսում)',
      'Արագ հարցի դեպքում դիմեք դեղագործի',
      'Դիմեք բժշկի, եթե դա հաճախ է պատահում',
    ],
    guideTitle: 'Ինչու է կարևոր բաց թողնված հաբի ժամանակը',
    guideText: 'Այն, թե փաթեթի որ հատվածում է բաց թողնված հաբը, կարող է փոխել անելիքը: Ահա թե ինչու օգտագործման հրահանգը հաճախ տալիս է տարբեր խորհուրդներ՝ կախված փաթեթի շաբաթից:',
    body5: 'Եթե չգիտեք, թե ինչ անել, ավելի լավ է խորհուրդ հարցնել, քան կասկածի մեջ մնալ: Դեղագործը, մանկաբարձուհին կամ բժիշկը կարող է օգնել ստուգել ձեր իրավիճակին համապատասխան խորհուրդները:',
    questionTitle: 'Տեղեկություն, որը պետք է պատրաստ լինի',
    questions: [
      'Ինչպիսի՞ ճշգրիտ տեսակի հաբ է դա:',
      'Որքա՞ն ժամանակ է անցել սովորական ժամից:',
      'Քանի՞ հաբ է բաց թողնվել:',
      'Փաթեթի ո՞ր պահին է տեղի ունեցել բաց թողնումը:',
      'Վերջերս եղե՞լ է պաշտպանված չլինող սեռական հարաբերություն:',
    ],
    proTipTitle: 'Լավ է իմանալ',
    proTipText: 'Եթե պաշտպանված չլինող սեռական հարաբերություն է եղել բաց թողնված հաբի շուրջ, արագ խորհուրդ հարցրեք մասնագետից՝ իմանալու համար, թե ինչ տարբերակներ կան:',
    repeatTitle: 'Եթե հաճախ եք բաց թողնում հաբեր',
    body6: 'Հաճախակի բաց թողնված հաբերը կարող են նշան լինել, որ ամենօրյա ռեժիմը լիովին չի համապատասխանում ձեր ապրելակերպին: Մի տատանվեք խոսել առողջապահության մասնագետի հետ՝ հակաբեղմնավորման այլ տարբերակներ ուսումնասիրելու համար:',
    methodTipTitle: 'Այլ մեթոդ՞',
    methodTipText: 'Եթե ամեն օր հաբ ընդունելը դժվար է պահպանել, գոյություն ունեն այլ մեթոդներ՝ օգտագործման տարբեր հաճախականությամբ:',
    summaryTitle: 'Էականը',
    summaryItems: [
      'Արձագանքեք հենց նկատեք բաց թողնված հաբը:',
      'Ստուգեք ձեր հաբի ճշգրիտ տեսակը:',
      'Ստուգեք օգտագործման հրահանգը՝ ճշգրիտ գործողությունն իմանալու համար:',
      'Օգտագործեք պահուստային պաշտպանություն, եթե հրահանգը դա խորհուրդ է տալիս:',
      'Կասկածի դեպքում կամ վտանգավոր հարաբերությունից հետո խորհուրդ հարցրեք:',
    ],
    finalTipTitle: 'Հիմնական եզրակացություններ',
    finalTipText: 'Բաց թողնված հաբը ինքնաբերաբար չի նշանակում, որ ձեր հակաբեղմնավորումը դադարել է աշխատել: Ճիշտ գործողությունը կախված է հաբի տեսակից և բաց թողնված դեղաչափի հանգամանքներից: Կասկածի դեպքում ստուգեք օգտագործման հրահանգը և արագ խորհուրդ հարցրեք:',
    disclaimerText: 'Այս հոդվածը տրվում է միայն տեղեկատվական նպատակով և չի փոխարինում ձեր դեղամիջոցի օգտագործման հրահանգին կամ անհատականացված բժշկական խորհրդատվությանը: Խորհուրդները կարող են տարբերվել՝ կախված հաբի տեսակից:',
  },
  tg: {
    shareMessage: 'Ҳаби фаромӯшшуда: чӣ кор кардан лозим аст? — AWA',
    badge: 'ҲАБИ ФАРОМӮШШУДА',
    title: 'Ҳаби фаромӯшшуда:\nчӣ кор кардан лозим аст?',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Саволу ҷавоб',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Ҳаби фаромӯшшуда бо ҳар кас рух дода метавонад. Чӣ кор кардан лозим аст, асосан ба он вобаста аст, ки чанд вақт пеш онро фаромӯш кардед, навъи ҳаб ва он ки дар кадом лаҳзаи бастабандӣ рух медиҳад.',
    importantTitle: 'Нуктаи асосӣ',
    importantText: 'Ҳарос накунед. Аввал навъи дақиқи ҳаби худро санҷед ва дастурамали онро бубинед, то аз ҳаракати тавсияшуда огоҳ шавед.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Камтар аз 12 соат дер',
      'Зиёда аз 12 соат дер',
      'Вазъиятҳое, ки диққати иловагӣ талаб мекунанд',
      'Дастурамал манбаи асосии шумост',
      'Кай маслиҳат пурсидан лозим аст',
      'Хулосаҳои асосӣ',
    ],
    body1: 'Барои баъзе ҳабҳо, дер шудан камтар аз 12 соат одатан муҳофизати пешгириро халалдор намекунад. Дар ин ҳолат тавсияи маъмул ин аст, ки ҳаби фаромӯшшударо ҳарчи зудтар қабул кунед ва сипас бастаро дар вақти муқаррарӣ идома диҳед.',
    step1Title: 'Ҳабро қабул кунед',
    step1Text: 'Ҳабро ҳамин ки дер шуданатонро пай бурдед, қабул кунед.',
    step2Title: 'Мисли пештара идома диҳед',
    step2Text: 'Сипас ба ҷадвали одатии худ барои ҳабҳои минбаъда баргардед.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Агар ҳаби фаромӯшшударо ва сипас ҳабро дар вақти муқаррарӣ қабул кунед, метавонад рух диҳад, ки ду ҳаб дар як рӯз қабул шаванд.',
    body2: 'Вақте ки дер шудан аз вақти барои ҳаби шумо иҷозатдодашуда зиёд мешавад, муҳофизат метавонад кам шавад. Он гоҳ чӣ кор кардан ба навъи ҳаб, шумораи ҳабҳои фаромӯшшуда ва ҷойгиршавии ҳаби фаромӯшшуда дар баста вобаста аст.',
    alertTitle: 'Огоҳӣ',
    alertText: 'Танҳо ба шумораи соатҳои дар ин ҷо овардашуда такя накунед: баъзе ҳабҳо дастурамалҳои гуногун доранд. Ҳамеша дастурамали доруи худро санҷед.',
    reflexesTitle: 'Аввалин корҳо',
    checkPoints: [
      {title: 'Зуд вокуниш нишон диҳед', text: 'Ҳар қадар пас аз пай бурдани ҳаби фаромӯшшуда зудтар вокуниш нишон диҳед, пайравии тавсияҳои мувофиқ осонтар аст.'},
      {title: 'Дастурамалро санҷед', text: 'Дастурҳо вобаста ба навъи дақиқи ҳаб ва шумораи ҳабҳои фаромӯшшуда метавонанд гуногун бошанд.'},
      {title: 'Муҳофизати иловагиро пешбинӣ кунед', text: 'Дар баъзе вазъиятҳо истифодаи презерватив дар давоми мӯҳлати муайян метавонад тавсия дода шавад.'},
    ],
    body3: 'На ҳамаи вазъиятҳо якхеланд. Баъзе ҳабҳои фаромӯшшуда санҷиши дақиқтари тавсияҳоро талаб мекунанд.',
    situations: [
      {title: 'Танҳо як ҳаб фаромӯш шудааст', text: 'Чӣ кор кардан лозим аст, асосан ба вақти гузашта аз соати муқаррарии қабул вобаста аст.'},
      {title: 'Зиёда аз як ҳаб фаромӯш шудааст', text: 'Ин вазъият диққати махсусро талаб мекунад ва беҳтар аст дастурамалро дақиқ санҷед.'},
      {title: 'Намедонед чӣ кор кунед', text: 'Доруҳона ё мутахассиси соҳаи тиб метавонад зуд ба шумо кумак кунад роҳи дурустро муайян кунед.'},
    ],
    body4: 'Дастурамали ҳаби шумо дастурҳои дақиқро барои доруи қабулкардаатон медиҳад. Тавсияҳо вобаста ба он ки ҳаби омехта ё ҳаби танҳо бо прогестин аст, метавонанд гуногун бошанд.',
    referenceTitle: 'Чизҳои муфид барои санҷиш',
    referenceTips: [
      'Дастурамалро дар дастрас нигоҳ доред (масалан, акс дар телефон)',
      'Агар саволи зуд дошта бошед, бо доруфурӯш тамос гиред',
      'Агар зуд-зуд рух диҳад, ба табиб муроҷиат кунед',
    ],
    guideTitle: 'Чаро вақти ҳаби фаромӯшшуда муҳим аст?',
    guideText: 'Лаҳзае, ки ҳаби фаромӯшшуда дар баста рост меояд, метавонад чӣ кор кардани шуморо тағйир диҳад. Аз ин рӯ дастурамал аксар вақт вобаста ба ҳафтаи баста тавсияҳои гуногун медиҳад.',
    body5: 'Агар намедонед чӣ кор кунед, беҳтар аст маслиҳат пурсед, на дар шубҳа мондан. Доруфурӯш, доя ё табиб метавонад ба шумо кумак кунад тавсияҳои мувофиқ ба вазъияти шуморо санҷед.',
    questionTitle: 'Маълумоте, ки бояд омода дошта бошед',
    questions: [
      'Навъи дақиқи ҳаб чист?',
      'Аз соати муқаррарӣ чӣ қадар вақт гузаштааст?',
      'Чанд ҳаб фаромӯш шудааст?',
      'Ҳаби фаромӯшшуда дар кадом лаҳзаи баста рух дод?',
      'Оё ба қарибӣ наздикии бе муҳофизат рух додааст?',
    ],
    proTipTitle: 'Донистан хуб аст',
    proTipText: 'Агар наздикии бе муҳофизат наздики вақти ҳаби фаромӯшшуда рух дода бошад, аз мутахассис зуд маслиҳат пурсед, то бидонед кадом имкониятҳо мавҷуданд.',
    repeatTitle: 'Агар доимо ҳабҳоро фаромӯш кунед',
    body6: 'Ҳабҳои зуд-зуд фаромӯшшуда метавонанд нишон диҳанд, ки тартиби рӯзона комилан ба тарзи зиндагии шумо мувофиқ нест. Бо мутахассиси соҳаи тиб гап задан шарм надоред, то имкониятҳои дигари пешгириро баррасӣ кунед.',
    methodTipTitle: 'Усули дигар?',
    methodTipText: 'Агар қабули ҳаб ҳар рӯз душвор аст, усулҳои дигар бо басомади гуногуни истифода вуҷуд доранд.',
    summaryTitle: 'Муҳимтарин чизҳо',
    summaryItems: [
      'Ҳамин ки ҳаби фаромӯшшударо пай бурдед, вокуниш нишон диҳед.',
      'Навъи дақиқи ҳаби худро санҷед.',
      'Дастурамалро санҷед, то ҳаракати дақиқро бидонед.',
      'Агар дастурамал тавсия диҳад, муҳофизати иловагӣ истифода баред.',
      'Дар сурати шубҳа ё пас аз наздикии хатарнок маслиҳат пурсед.',
    ],
    finalTipTitle: 'Хулосаҳои асосӣ',
    finalTipText: 'Ҳаби фаромӯшшуда худ ба худ маънои қатъи амали пешгирии шуморо надорад. Ҳаракати дуруст ба навъи ҳаб ва шароити қабул нашудани миқдор вобаста аст. Дар сурати шубҳа, дастурамалро санҷед ва зуд маслиҳат пурсед.',
    disclaimerText: 'Ин мақола танҳо барои иттилоъ пешниҳод шудааст ва дастурамали доруи шумо ё маслиҳати шахсии тиббиро иваз намекунад. Тавсияҳо вобаста ба навъи ҳаб метавонанд гуногун бошанд.',
  },
  ky: {
    shareMessage: 'Таблетка унутулду: эмне кылуу керек? — AWA',
    badge: 'УНУТУЛГАН ТАБЛЕТКА',
    title: 'Таблетка унутулду:\nэмне кылуу керек?',
    metaDuration: '7 мүн окуу',
    metaType: 'КБС',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Таблетканы унутуп коюу кимдир бирөө менен болушу мүмкүн. Эмне кылуу негизинен таблетка канча убакыт мурун унутулганына, таблетканын түрүнө жана таңгактын кайсы мезгилинде болгонуна көз каранды.',
    importantTitle: 'Негизги учур',
    importantText: 'Дүрбөбөңүз. Адегенде таблеткаңыздын так түрүн текшерип, сунушталган аракетти билүү үчүн анын көрсөтмөсүн караңыз.',
    contentsTitle: 'Бул макалада',
    topics: [
      '12 сааттан аз кечиккенде',
      '12 сааттан көп кечиккенде',
      'Кошумча көңүл бурууну талап кылган абалдар',
      'Көрсөтмө — сиздин шилтемеңиз',
      'Кеңешти качан сурап кайрылуу керек',
      'Негизги жыйынтыктар',
    ],
    body1: 'Айрым таблеткалар үчүн 12 сааттан аз кечигүү жалпысынан контрацептивдик коргоону бузбайт. Мындай учурда адатта унутулган таблетканы мүмкүн болушунча тезирээк ичип, андан кийин таңгакты адаттагы убакта улантуу сунушталат.',
    step1Title: 'Таблетканы ичиңиз',
    step1Text: 'Кечиккениңизди байкаган замат таблетканы ичиңиз.',
    step2Title: 'Адаттагыдай улантыңыз',
    step2Text: 'Андан кийин кийинки таблеткалар үчүн адаттагы графигиңизге кайтыңыз.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Унутулган таблетканы ичип, андан кийин адаттагы убакта пландалганын ичсеңиз, бир күндө эки таблетка ичилиши мүмкүн.',
    body2: 'Кечигүү таблетка үчүн уруксат берилген убакыттан ашканда, коргоо азайышы мүмкүн. Андан кийин эмне кылуу керектиги таблетканын түрүнө, унутулган таблеткалардын санына жана унутулган таблетка таңгактын кайсы жеринде экенине көз каранды.',
    alertTitle: 'Эскертүү',
    alertText: 'Бул жерде берилген саат санына гана таянбаңыз: айрым таблеткалардын көрсөтмөлөрү башка. Дарыңыздын көрсөтмөсүн ар дайым текшериңиз.',
    reflexesTitle: 'Биринчи кылуучу иштер',
    checkPoints: [
      {title: 'Тез аракет кылыңыз', text: 'Унутулган таблетканы байкагандан кийин канчалык тез аракет кылсаңыз, ылайыктуу сунуштарды аткаруу ошончолук оңой.'},
      {title: 'Көрсөтмөнү текшериңиз', text: 'Көрсөтмөлөр таблетканын так түрүнө жана унутулган таблеткалардын санына жараша айырмаланышы мүмкүн.'},
      {title: 'Кошумча коргонууну пландаңыз', text: 'Айрым абалдарда белгилүү мөөнөткө презерватив сунушталышы мүмкүн.'},
    ],
    body3: 'Бардык абалдар бирдей эмес. Айрым унутулган таблеткалар сунуштарды так текшерүүнү талап кылат.',
    situations: [
      {title: 'Бир гана таблетка унутулду', text: 'Эмне кылуу негизинен ичүүнүн адаттагы убактысынан бери өткөн убакытка көз каранды.'},
      {title: 'Бир таблеткадан көп унутулду', text: 'Бул абал өзгөчө көңүл бурууну талап кылат жана көрсөтмөнү так текшерген жакшы.'},
      {title: 'Эмне кылууну билбейсиз', text: 'Фармацевт же ден соолук сактоо адиси туура аракетти тез аныктоого жардам бере алат.'},
    ],
    body4: 'Таблеткаңыздын көрсөтмөсү сиз кабыл алып жаткан дары үчүн так нускамаларды берет. Сунуштар айкалышкан таблеткабы же жалгыз прогестиндүү таблеткабы экенине жараша айырмаланышы мүмкүн.',
    referenceTitle: 'Текшерүүгө пайдалуу нерселер',
    referenceTips: [
      'Көрсөтмөнү колдо кармаңыз (мисалы, телефондогу сүрөт)',
      'Тез суроо болсо, фармацевтке кайрылыңыз',
      'Көп болсо, дарыгерге барыңыз',
    ],
    guideTitle: 'Унутулган таблетканын убактысы эмне үчүн маанилүү?',
    guideText: 'Унутулган таблетка таңгактын кайсы мезгилине туш келгени эмне кылуу керектигин өзгөртүшү мүмкүн. Ошондуктан көрсөтмө көбүнчө таңгактын жумасына жараша ар башка сунуштарды берет.',
    body5: 'Эмне кылууну билбесеңиз, күмөндө калгандан көрө кеңеш сураган жакшы. Фармацевт, акушерка же дарыгер абалыңызга ылайыктуу сунуштарды текшерүүгө жардам бере алат.',
    questionTitle: 'Даяр болушу керек маалымат',
    questions: [
      'Таблетканын так түрү кандай?',
      'Адаттагы убакыттан бери канча убакыт өттү?',
      'Канча таблетка унутулду?',
      'Унутулган таблетка таңгактын кайсы учурунда болду?',
      'Жакында коргонбой жыныстык катнаш болдубу?',
    ],
    proTipTitle: 'Билүү пайдалуу',
    proTipText: 'Эгер унутулган таблетка мезгилинде коргонбой жыныстык катнаш болгон болсо, кандай варианттар бар экенин билүү үчүн адистен тез кеңеш сураңыз.',
    repeatTitle: 'Таблеткаларды дайыма унутуп жатсаңыз',
    body6: 'Тез-тез унутулган таблеткалар күнүмдүк тартип жашоо образыңызга анча туура келбей турганынын белгиси болушу мүмкүн. Башка контрацепция варианттарын изилдөө үчүн ден соолук сактоо адиси менен сүйлөшүүдөн тартынбаңыз.',
    methodTipTitle: 'Башка ыкмабы?',
    methodTipText: 'Күн сайын таблетка ичүү кыйын болсо, башка колдонуу жыштыгына ээ башка ыкмалар бар.',
    summaryTitle: 'Эң негизгиси',
    summaryItems: [
      'Унутулган таблетканы байкаган замат аракет кылыңыз.',
      'Таблеткаңыздын так түрүн текшериңиз.',
      'Так аракетти билүү үчүн көрсөтмөнү текшериңиз.',
      'Көрсөтмө сунуштаса, кошумча коргонууну колдонуңуз.',
      'Күмөн болсо же коркунучтуу катнаштан кийин кеңеш сураңыз.',
    ],
    finalTipTitle: 'Негизги жыйынтыктар',
    finalTipText: 'Унутулган таблетка контрацепцияңыз иштебей калды дегенди автоматтык түрдө билдирбейт. Туура аракет таблетканын түрүнө жана дозаны өткөрүп жиберүүнүн шарттарына көз каранды. Күмөн болсо, көрсөтмөнү текшерип, тез кеңеш сураңыз.',
    disclaimerText: 'Бул макала маалымат берүү максатында гана берилген жана дарыңыздын көрсөтмөсүн же жекелештирилген медициналык кеңешти алмаштырбайт. Сунуштар таблетканын түрүнө жараша айырмаланышы мүмкүн.',
  },
  tk: {
    shareMessage: 'Unudylan tabletka: näme etmeli? — AWA',
    badge: 'UNUDYLAN TABLETKA',
    title: 'Unudylan tabletka:\nnäme etmeli?',
    metaDuration: '7 min okamak',
    metaType: 'KBS',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro: 'Unudylan tabletka islendik adamda bolup biler. Näme etmelidigi esasan tabletkany näçe wagt öň unudandygyňyza, tabletkanyň görnüşine we paketiň haýsy pursatynda bolandygyna bagly.',
    importantTitle: 'Esasy nokat',
    importantText: 'Howsala düşmäň. Ilki bilen tabletkaňyzyň takyk görnüşini barlaň we maslahat berilýän hereketi bilmek üçin onuň ulanyş görkezmesini barlaň.',
    contentsTitle: 'Bu makalada',
    topics: [
      '12 sagatdan az gijikdirilen',
      '12 sagatdan köp gijikdirilen',
      'Goşmaça üns talap edýän ýagdaýlar',
      'Ulanyş görkezmesi siziň esasy çeşmäňiz',
      'Maslahaty haçan soramaly',
      'Esasy netijeler',
    ],
    body1: 'Käbir tabletkalar üçin 12 sagatdan az gijikdirmek adatça göwrelilikden goranyşa zeper ýetirmeýär. Bu ýagdaýda adaty maslahat — unudylan tabletkany mümkin boldugyça çalt kabul etmek we soňra paketi adaty wagtynda dowam etdirmek.',
    step1Title: 'Tabletkany alyň',
    step1Text: 'Gijikýändigiňizi görenden derrew tabletkany alyň.',
    step2Title: 'Adaty tertipde dowam ediň',
    step2Text: 'Soňra indiki tabletkalar üçin adaty tertibiňize gaýdyp geliň.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Unudylan tabletkany we adaty wagta bellenen tabletkany alsaňyz, şol bir günde iki tabletkanyň alynmagy mümkin.',
    body2: 'Gijikdirme tabletkaňyz üçin rugsat berlen wagtdan geçende, goranyş azalyp biler. Şonda näme etmelidigi tabletkanyň görnüşine, unudylan tabletkalaryň sanyna we unudylan tabletkanyň paketdäki ýerine bagly.',
    alertTitle: 'Duýduryş',
    alertText: 'Diňe bu ýerde berlen sagat sanyna daýanmaň: käbir tabletkalaryň dürli görkezmeleri bar. Hemişe dermanyňyzyň ulanyş görkezmesini barlaň.',
    reflexesTitle: 'Ilkinji etmeli zatlar',
    checkPoints: [
      {title: 'Çalt hereket ediň', text: 'Unudylan tabletkany görenden soň näçe çalt hereket etseňiz, degişli maslahatlara eýermek şonça-da aňsat.'},
      {title: 'Ulanyş görkezmesini barlaň', text: 'Görkezmeler tabletkanyň takyk görnüşine we unudylan tabletkalaryň sanyna görä tapawutlanyp biler.'},
      {title: 'Goşmaça goranyşy meýilleşdiriň', text: 'Käbir ýagdaýlarda belli bir döwür üçin prezerwatiw maslahat berilip bilner.'},
    ],
    body3: 'Ähli ýagdaýlar deň däl. Käbir unudylan tabletkalar maslahatlary has takyk barlamagy talap edýär.',
    situations: [
      {title: 'Diňe bir tabletka unudyldy', text: 'Näme etmelidigi esasan kabul etmegiň adaty wagtyndan bäri geçen wagta bagly.'},
      {title: 'Bir tabletkadan köp unudyldy', text: 'Bu ýagdaý aýratyn üns talap edýär we ulanyş görkezmesini takyk barlamak has gowy.'},
      {title: 'Näme etmelidigine ynamsyz', text: 'Derman satyjy ýa-da saglyk hünärmeni dogry hereketi çalt kesgitlemäge kömek edip biler.'},
    ],
    body4: 'Tabletkaňyzyň ulanyş görkezmesi kabul edýän dermanyňyz üçin takyk görkezmeleri berýär. Maslahatlar utgaşdyrylan tabletka ýa-da ýeke progestinli tabletka bolmagyna görä tapawutlanyp biler.',
    referenceTitle: 'Barlamaga peýdaly zatlar',
    referenceTips: [
      'Ulanyş görkezmesini el ýetimde saklaň (meselem, telefonyňyzda surat)',
      'Çalt sorag bolsa, derman satyjy bilen habarlaşyň',
      'Ýygy bolýan bolsa, lukmana ýüz tutuň',
    ],
    guideTitle: 'Unudylan tabletkanyň wagty näme üçin möhüm?',
    guideText: 'Unudylan tabletkanyň paketdäki ýeri näme etmelidigini üýtgedip biler. Şonuň üçin ulanyş görkezmesi köplenç paketiň hepdesine görä dürli maslahatlary berýär.',
    body5: 'Näme etmelidigini bilmeseňiz, şübhede galmakdan maslahat soramak has gowy. Derman satyjy, akuşerka ýa-da lukman ýagdaýyňyza laýyk maslahatlary barlamaga kömek edip biler.',
    questionTitle: 'Taýýar bolmaly maglumat',
    questions: [
      'Takyk haýsy görnüşli tabletka?',
      'Adaty wagtdan bäri näçe wagt geçdi?',
      'Näçe tabletka unudyldy?',
      'Unudylan tabletka paketiň haýsy pursatynda boldy?',
      'Ýaňy-ýakynda goranyşsyz jynsy gatnaşyk boldumy?',
    ],
    proTipTitle: 'Bilmek peýdaly',
    proTipText: 'Unudylan tabletka wagtynda goranyşsyz jynsy gatnaşyk bolan bolsa, haýsy wariantlaryň barlygyny bilmek üçin hünärmenden çalt maslahat soraň.',
    repeatTitle: 'Tabletkany yzygiderli unudýan bolsaňyz',
    body6: 'Ýygy unudylan tabletkalar gündelik tertibiň durmuş ýörelgäňize doly laýyk gelmeýändiginiň alamaty bolup biler. Beýleki göwrelilikden goranyş wariantlaryny öwrenmek üçin saglyk hünärmeni bilen gürleşmekden çekinmäň.',
    methodTipTitle: 'Başga usulmy?',
    methodTipText: 'Her gün tabletka içmegi dowam etdirmek kyn bolsa, ulanyş ýygylygy başga bolan beýleki usullar bar.',
    summaryTitle: 'Esasy zatlar',
    summaryItems: [
      'Unudylan tabletkany görenden derrew hereket ediň.',
      'Tabletkaňyzyň takyk görnüşini barlaň.',
      'Takyk hereketi bilmek üçin ulanyş görkezmesini barlaň.',
      'Ulanyş görkezmesi maslahat berýän bolsa, goşmaça goranyşy ulanyň.',
      'Şübhe bolsa ýa-da howply gatnaşykdan soň maslahat soraň.',
    ],
    finalTipTitle: 'Esasy netijeler',
    finalTipText: 'Unudylan tabletka göwrelilikden goranyşyňyzyň işlemegini togtadandygyny awtomatiki aňlatmaýar. Dogry hereket tabletkanyň görnüşine we unudylan dozanyň ýagdaýlaryna bagly. Şübhe bolsa, ulanyş görkezmesini barlaň we çalt maslahat soraň.',
    disclaimerText: 'Bu makala diňe maglumat maksatly berilýär we dermanyňyzyň ulanyş görkezmesini ýa-da şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar. Maslahatlar tabletkanyň görnüşine görä tapawutlanyp biler.',
  },
  ms: {
    shareMessage: 'Terlupa mengambil pil: apa yang perlu dilakukan? — AWA',
    badge: 'PIL TERLUPA',
    title: 'Terlupa mengambil pil:\napa yang perlu dilakukan?',
    metaDuration: '7 min bacaan',
    metaType: 'Soalan Lazim',
    metaLevel: 'Pertengahan',
    metaValidated: 'Kandungan disemak',
    intro: 'Terlupa mengambil pil boleh berlaku kepada sesiapa sahaja. Apa yang perlu dilakukan terutamanya bergantung pada berapa lama dahulu anda terlupa, jenis pil dan bila dalam pek ia berlaku.',
    importantTitle: 'Perkara utama',
    importantText: 'Jangan panik. Pertama, semak jenis tepat pil anda dan semak risalah dalam kotaknya untuk mengetahui tindakan yang disyorkan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Lewat kurang daripada 12 jam',
      'Lewat lebih daripada 12 jam',
      'Keadaan yang memerlukan perhatian tambahan',
      'Risalah dalam kotak ialah rujukan anda',
      'Bila untuk meminta nasihat',
      'Perkara penting untuk diingat',
    ],
    body1: 'Bagi sesetengah pil, kelewatan kurang daripada 12 jam biasanya tidak menjejaskan perlindungan kontraseptif. Dalam kes ini, syor yang lazim ialah mengambil pil yang terlupa secepat mungkin dan kemudian meneruskan pek pada waktu biasa.',
    step1Title: 'Ambil pil',
    step1Text: 'Ambil pil sebaik sahaja anda perasan anda terlewat.',
    step2Title: 'Teruskan seperti biasa',
    step2Text: 'Kemudian kembali kepada jadual biasa anda untuk pil-pil seterusnya.',
    tip1Title: 'Elok diketahui',
    tip1Text: 'Jika anda mengambil pil yang terlupa dan kemudian yang dijadualkan pada waktu biasa, mungkin dua pil diambil pada hari yang sama.',
    body2: 'Apabila kelewatan melebihi masa yang dibenarkan untuk pil anda, perlindungan mungkin berkurangan. Apa yang perlu dilakukan kemudiannya bergantung pada jenis pil, bilangan pil yang terlupa dan di mana dalam pek pil yang terlupa itu berada.',
    alertTitle: 'Amaran',
    alertText: 'Jangan bergantung hanya pada bilangan jam yang diberikan di sini: sesetengah pil mempunyai arahan yang berbeza. Sentiasa semak risalah dalam kotak ubat anda.',
    reflexesTitle: 'Perkara pertama yang perlu dilakukan',
    checkPoints: [
      {title: 'Bertindak dengan cepat', text: 'Semakin cepat anda bertindak selepas perasan pil yang terlupa, semakin mudah untuk mengikuti syor yang sesuai.'},
      {title: 'Semak risalah dalam kotak', text: 'Arahan boleh berbeza bergantung pada jenis tepat pil dan bilangan pil yang terlupa.'},
      {title: 'Rancang perlindungan sandaran', text: 'Dalam sesetengah keadaan, kondom mungkin disyorkan untuk tempoh tertentu.'},
    ],
    body3: 'Tidak semua keadaan serupa. Sesetengah pil yang terlupa memerlukan semakan syor yang lebih tepat.',
    situations: [
      {title: 'Hanya satu pil terlupa', text: 'Apa yang perlu dilakukan terutamanya bergantung pada masa yang telah berlalu sejak waktu biasa mengambilnya.'},
      {title: 'Lebih daripada satu pil terlupa', text: 'Keadaan ini memerlukan perhatian khusus, dan lebih baik menyemak risalah dalam kotak dengan teliti.'},
      {title: 'Tidak pasti apa yang perlu dilakukan', text: 'Ahli farmasi atau pengamal penjagaan kesihatan boleh membantu anda dengan cepat mengenal pasti tindakan yang betul.'},
    ],
    body4: 'Risalah dalam kotak pil anda memberikan arahan yang tepat untuk ubat yang anda ambil. Syor boleh berbeza bergantung pada sama ada ia pil kombinasi atau pil progestin sahaja.',
    referenceTitle: 'Perkara berguna untuk disemak',
    referenceTips: [
      'Simpan risalah dalam kotak dengan mudah dicapai (contohnya foto pada telefon anda)',
      'Hubungi ahli farmasi jika anda mempunyai soalan ringkas',
      'Berjumpa doktor jika ia kerap berlaku',
    ],
    guideTitle: 'Mengapa masa pil yang terlupa itu penting?',
    guideText: 'Bila pil yang terlupa itu jatuh dalam pek boleh mengubah apa yang perlu dilakukan. Itulah sebabnya risalah dalam kotak selalunya memberikan syor yang berbeza bergantung pada minggu dalam pek.',
    body5: 'Jika anda tidak tahu apa yang perlu dilakukan, lebih baik meminta nasihat daripada terus ragu-ragu. Ahli farmasi, bidan atau doktor boleh membantu anda menyemak syor yang sesuai dengan keadaan anda.',
    questionTitle: 'Maklumat untuk disediakan',
    questions: [
      'Apakah jenis tepat pil itu?',
      'Berapa lama masa telah berlalu sejak waktu biasa?',
      'Berapa banyak pil yang terlupa?',
      'Pada bahagian mana dalam pek pil yang terlupa itu berlaku?',
      'Adakah terdapat hubungan intim tanpa perlindungan baru-baru ini?',
    ],
    proTipTitle: 'Elok diketahui',
    proTipText: 'Jika hubungan intim tanpa perlindungan berlaku sekitar masa pil terlupa, mintalah nasihat pengamal profesional dengan segera untuk mengetahui pilihan yang ada.',
    repeatTitle: 'Jika anda terus terlupa mengambil pil',
    body6: 'Pil yang kerap terlupa boleh menjadi tanda bahawa rutin harian tidak begitu sesuai dengan gaya hidup anda. Jangan teragak-agak berbincang dengan pengamal penjagaan kesihatan untuk meneroka pilihan kontraseptif yang lain.',
    methodTipTitle: 'Kaedah yang berbeza?',
    methodTipText: 'Jika mengambil pil setiap hari sukar dikekalkan, kaedah lain wujud dengan kekerapan penggunaan yang berbeza.',
    summaryTitle: 'Perkara penting',
    summaryItems: [
      'Bertindak sebaik sahaja anda perasan pil yang terlupa.',
      'Semak jenis tepat pil anda.',
      'Semak risalah dalam kotak untuk mengetahui tindakan yang tepat.',
      'Gunakan perlindungan sandaran jika risalah dalam kotak mengesyorkannya.',
      'Mintalah nasihat jika ragu-ragu atau selepas pertemuan yang berisiko.',
    ],
    finalTipTitle: 'Perkara penting untuk diingat',
    finalTipText: 'Pil yang terlupa tidak semestinya bermakna kontraseptif anda telah berhenti berfungsi. Tindakan yang betul bergantung pada jenis pil dan keadaan dos yang terlupa itu. Jika ragu-ragu, semak risalah dalam kotak dan minta nasihat dengan segera.',
    disclaimerText: 'Artikel ini disediakan untuk tujuan maklumat sahaja dan tidak menggantikan risalah dalam kotak ubat anda atau nasihat perubatan yang diperibadikan. Syor mungkin berbeza bergantung pada jenis pil.',
  },
  so: {
    shareMessage: 'Kiniin la iloobay: maxaa la sameeyaa? — AWA',
    badge: 'KINIIN LA ILOOBAY',
    title: 'Kiniin la iloobay:\nmaxaa la sameeyaa?',
    metaDuration: '7 daq akhris',
    metaType: 'FAQ',
    metaLevel: 'Dhexdhexaad',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Kiniin la iloobay wuxuu dhici karaa qof walba. Waxa la sameeyo inta badan wuxuu ku xiran yahay intee in le’eg ka hor ayaad iloowday, nooca kiniinka, iyo goorta xirmada ka mid ah ay dhacdo.',
    importantTitle: 'Qodobka muhiimka ah',
    importantText: 'Ha argagaxin. Marka hore hubi nooca saxda ah ee kiniinkaaga oo hubi warqadda macluumaadkiisa si aad u ogaato tallaabada lagula taliyo.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Wax ka yar 12 saac daahay',
      'Wax ka badan 12 saac daahay',
      'Xaalado u baahan feejignaan dheeraad ah',
      'Warqadda macluumaadku waa tixraacaaga',
      'Goorta talo la weydiisto',
      'Qodobbada muhiimka ah',
    ],
    body1: 'Kiniimo qaar, daahitaan wax ka yar 12 saac guud ahaan ma dhibo ilaalinta ka hortagga uurka. Xaaladdan, talada caadiga ah waa in la qaato kiniinka la iloobay sida ugu dhakhsaha badan ka dibna lagu sii wado xirmada waqtiga caadiga ah.',
    step1Title: 'Qaado kiniinka',
    step1Text: 'Qaado kiniinka isla marka aad ogaato inaad daahday.',
    step2Title: 'Sii wad sidii caadiga ahayd',
    step2Text: 'Kadibna ku laabo jadwalkaaga caadiga ah ee kiniinnada xiga.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text: 'Haddii aad qaadato kiniinka la iloobay ka dibna kan loo qorsheeyey waqtiga caadiga ah, waxaa dhici kara in laba kiniin la qaato isla maalinta.',
    body2: 'Marka daahitaanku dhaafo wakhtiga loo ogolaaday kiniinkaaga, ilaalinta way yaraan kartaa. Waxa la sameeyo markaas wuxuu ku xiran yahay nooca kiniinka, tirada kiniinnada la iloobay, iyo halka xirmada ay ku jirto kiniinka la iloobay.',
    alertTitle: 'Digniin',
    alertText: 'Ha ku tiirsanaanin oo keliya tirada saacadaha halkan lagu bixiyey: kiniimo qaar waxay leeyihiin tilmaamo kala duwan. Mar walba hubi warqadda macluumaadka daawadaada.',
    reflexesTitle: 'Waxyaabaha ugu horreeya ee la sameeyo',
    checkPoints: [
      {title: 'Si dhakhso ah u falceli', text: 'Marka aad si dhakhso ah u falceliso ka dib ogaanshaha kiniinka la iloobay, waa ka fudud in la raaco talooyinka ku habboon.'},
      {title: 'Hubi warqadda macluumaadka', text: 'Tilmaamuhu way kala duwanaan karaan iyadoo ku xiran nooca saxda ah ee kiniinka iyo tirada kiniinnada la iloobay.'},
      {title: 'Qorshee ilaalin kaabe', text: 'Xaalado qaar, kondom ayaa lagula talin karaa muddo gaar ah.'},
    ],
    body3: 'Xaalad kastaa ma isku mid aha. Kiniin la iloobay qaar waxay u baahan yihiin hubin sax ah oo talooyinka ah.',
    situations: [
      {title: 'Hal kiniin oo keliya ayaa la iloobay', text: 'Waxa la sameeyo inta badan wuxuu ku xiran yahay waqtiga ka soo wareegay waqtiga caadiga ah ee qaadashada.'},
      {title: 'In ka badan hal kiniin ayaa la iloobay', text: 'Xaaladdani waxay u baahan tahay feejignaan gaar ah, waxaana ugu wanaagsan in si sax ah loo hubiyo warqadda macluumaadka.'},
      {title: 'Ma hubto waxa la sameeyo', text: 'Farmasiiste ama xirfadle caafimaad ayaa si dhakhso ah kaa caawin kara aqoonsiga tallaabada saxda ah.'},
    ],
    body4: 'Warqadda macluumaadka kiniinkaagu waxay bixisaa tilmaamaha saxda ah ee daawada aad qaadanayso. Talooyinku way kala duwanaan karaan iyadoo ku xiran in uu yahay kiniin isku-dhaf ah ama kiniin progestin oo keliya ah.',
    referenceTitle: 'Waxyaabo faa’iido leh oo la hubiyo',
    referenceTips: [
      'Hay warqadda macluumaadka meel gacanta ku dhow (sawir taleefankaaga, tusaale ahaan)',
      'La xiriir farmasiiste haddii aad leedahay su’aal degdeg ah',
      'Arag dhakhtar haddii ay inta badan dhacdo',
    ],
    guideTitle: 'Maxay waqtiga kiniinka la iloobay muhiim u yahay?',
    guideText: 'Goorta kiniinka la iloobay uu ku dhaco xirmada waxay beddeli kartaa waxa la sameeyo. Sidaa darteed warqadda macluumaadku inta badan waxay bixisaa talooyin kala duwan iyadoo ku xiran toddobaadka xirmada.',
    body5: 'Haddii aadan aqoon waxa la sameeyo, waxaa ka wanaagsan in talo la weydiiyo halkii aad shaki ku joogi lahayd. Farmasiiste, umulis, ama dhakhtar ayaa kaa caawin kara hubinta talooyinka ku habboon xaaladdaada.',
    questionTitle: 'Macluumaad diyaar ah',
    questions: [
      'Waa kuwee nooca saxda ah ee kiniinka?',
      'Intee in le’eg waqti ayaa ka soo wareegay waqtiga caadiga ah?',
      'Imisa kiniin ayaa la iloobay?',
      'Goorma xirmada ayaa kiniinka la iloobay dhacay?',
      'Galmo aan ilaalin lahayn dhawaan ma dhacday?',
    ],
    proTipTitle: 'Waxtar leh in la ogaado',
    proTipText: 'Haddii galmo aan ilaalin lahayn ay dhacday xilligii kiniinka la iloobay, si dhakhso ah talo ka weydiiso xirfadle si aad u ogaato doorashooyinka jira.',
    repeatTitle: 'Haddii aad sii wadato inaad illowdo kiniin',
    body6: 'Kiniin la iloobay oo soo noqnoqda wuxuu noqon karaa calaamad ah in nidaamka maalinlaha ahi aanu si buuxda ugu habboonayn hab-nololeedkaaga. Ha ka waaban inaad la hadasho xirfadle caafimaad si aad u sahamiso doorashooyin kale oo ka hortag uur ah.',
    methodTipTitle: 'Hab ka duwan?',
    methodTipText: 'Haddii qaadashada kiniin maalin kasta ay adag tahay in la sii wado, hababka kale waxay jiraan oo leh soo noqnoqosho isticmaal oo ka duwan.',
    summaryTitle: 'Waxa muhiimka ah',
    summaryItems: [
      'Falceli isla marka aad ogaato kiniinka la iloobay.',
      'Hubi nooca saxda ah ee kiniinkaaga.',
      'Hubi warqadda macluumaadka si aad u ogaato tallaabada saxda ah.',
      'Isticmaal ilaalin kaabe haddii warqadda macluumaadku ay lagula talisay.',
      'Weydiiso talo haddii shaki jiro ama ka dib kulan khatar ah.',
    ],
    finalTipTitle: 'Qodobbada muhiimka ah',
    finalTipText: 'Kiniin la iloobay ma muujiyo si toos ah in ka hortagga uurkaagu joogsaday. Tallaabada saxda ahi waxay ku xiran tahay nooca kiniinka iyo duruufaha qiyaaska la iloobay. Haddii shaki jiro, hubi warqadda macluumaadka oo si dhakhso ah talo weydiiso.',
    disclaimerText: 'Maqaalkan waxaa la bixiyey macluumaad oo keliya mana bedelo warqadda macluumaadka daawadaada ama talo caafimaad oo shakhsi ah. Talooyinku way ku kala duwanaan karaan iyadoo ku xiran nooca kiniinka.',
  },
  sw: {
    shareMessage: 'Kidonge kilichosahaulika: nini cha kufanya? — AWA',
    badge: 'KIDONGE KILICHOSAHAULIKA',
    title: 'Kidonge kilichosahaulika:\nnini cha kufanya?',
    metaDuration: 'Dakika 7 za kusoma',
    metaType: 'Maswali na majibu',
    metaLevel: 'Wastani',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Kusahau kidonge kunaweza kumtokea yeyote. Cha kufanya kinategemea hasa ni muda gani uliopita tangu ukisahau, aina ya kidonge, na wakati gani kwenye kifurushi hilo linatokea.',
    importantTitle: 'Jambo kuu',
    importantText: 'Usiogope. Kwanza angalia aina kamili ya kidonge chako na soma maelezo yaliyomo kwenye kifurushi chake ili kujua hatua inayopendekezwa.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Umechelewa chini ya saa 12',
      'Umechelewa zaidi ya saa 12',
      'Hali zinazohitaji uangalizi wa ziada',
      'Maelezo ya kifurushi ndiyo rejeo lako',
      'Wakati wa kuomba ushauri',
      'Mambo muhimu ya kukumbuka',
    ],
    body1: 'Kwa baadhi ya vidonge, kuchelewa kwa chini ya saa 12 kwa kawaida hakuathiri ulinzi wa uzazi wa mpango. Katika hali hii, pendekezo la kawaida ni kumeza kidonge kilichosahaulika haraka iwezekanavyo kisha kuendelea na kifurushi kwa wakati wa kawaida.',
    step1Title: 'Meza kidonge',
    step1Text: 'Meza kidonge mara tu unapogundua umechelewa.',
    step2Title: 'Endelea kama kawaida',
    step2Text: 'Kisha rudi kwenye ratiba yako ya kawaida kwa vidonge vinavyofuata.',
    tip1Title: 'Vyema kujua',
    tip1Text: 'Ukimeza kidonge kilichosahaulika kisha kile kilichopangwa kwa wakati wa kawaida, inaweza kutokea vidonge viwili vimemezwa siku moja.',
    body2: 'Ucheleweshaji unapozidi muda unaoruhusiwa kwa kidonge chako, ulinzi unaweza kupungua. Cha kufanya basi kinategemea aina ya kidonge, idadi ya vidonge vilivyosahaulika, na mahali kidonge kilichosahaulika kilipo kwenye kifurushi.',
    alertTitle: 'Onyo',
    alertText: 'Usitegemee tu idadi ya saa iliyotolewa hapa: baadhi ya vidonge vina maelekezo tofauti. Daima soma maelezo yaliyomo kwenye kifurushi cha dawa yako.',
    reflexesTitle: 'Mambo ya kwanza ya kufanya',
    checkPoints: [
      {title: 'Chukua hatua haraka', text: 'Kadiri unavyochukua hatua haraka baada ya kugundua kidonge kilichosahaulika, ndivyo inavyokuwa rahisi kufuata mapendekezo yanayofaa.'},
      {title: 'Soma maelezo ya kifurushi', text: 'Maelekezo yanaweza kutofautiana kulingana na aina kamili ya kidonge na idadi ya vidonge vilivyosahaulika.'},
      {title: 'Panga ulinzi wa ziada', text: 'Katika hali fulani, kondomu inaweza kupendekezwa kwa kipindi fulani.'},
    ],
    body3: 'Si hali zote zinafanana. Baadhi ya vidonge vilivyosahaulika vinahitaji ukaguzi sahihi zaidi wa mapendekezo.',
    situations: [
      {title: 'Kidonge kimoja tu kimesahaulika', text: 'Cha kufanya kinategemea hasa muda uliopita tangu wakati wa kawaida wa kukimeza.'},
      {title: 'Zaidi ya kidonge kimoja kimesahaulika', text: 'Hali hii inahitaji uangalizi maalum, na ni bora kusoma maelezo ya kifurushi kwa usahihi.'},
      {title: 'Huna uhakika wa kufanya nini', text: 'Mfamasia au mtaalamu wa afya anaweza kukusaidia haraka kutambua hatua sahihi.'},
    ],
    body4: 'Maelezo ya kifurushi cha kidonge chako yanatoa maelekezo sahihi kwa dawa unayotumia. Mapendekezo yanaweza kutofautiana kulingana na kama ni kidonge kilichochanganywa au kidonge cha projestini pekee.',
    referenceTitle: 'Mambo yenye manufaa ya kuangalia',
    referenceTips: [
      'Weka maelezo ya kifurushi karibu (picha kwenye simu yako, kwa mfano)',
      'Wasiliana na mfamasia ikiwa una swali la haraka',
      'Mwone daktari ikiwa hutokea mara nyingi',
    ],
    guideTitle: 'Kwa nini wakati wa kidonge kilichosahaulika ni muhimu?',
    guideText: 'Mahali kidonge kilichosahaulika kilipo kwenye kifurushi kinaweza kubadilisha cha kufanya. Ndiyo maana maelezo ya kifurushi mara nyingi hutoa mapendekezo tofauti kulingana na wiki ya kifurushi.',
    body5: 'Ikiwa hujui cha kufanya, ni bora kuomba ushauri kuliko kubaki na shaka. Mfamasia, mkunga, au daktari anaweza kukusaidia kukagua mapendekezo yanayofaa hali yako.',
    questionTitle: 'Taarifa za kuwa nazo tayari',
    questions: [
      'Ni aina gani kamili ya kidonge?',
      'Muda gani umepita tangu wakati wa kawaida?',
      'Vidonge vingapi vimesahaulika?',
      'Kidonge kilichosahaulika kilitokea wakati gani kwenye kifurushi?',
      'Je, kumekuwa na tendo la ndoa lisilo na kinga hivi karibuni?',
    ],
    proTipTitle: 'Vyema kujua',
    proTipText: 'Ikiwa tendo la ndoa lisilo na kinga lilitokea karibu na wakati wa kidonge kilichosahaulika, muulize mtaalamu ushauri haraka ili kujua ni chaguo gani zinapatikana.',
    repeatTitle: 'Ikiwa unaendelea kusahau vidonge',
    body6: 'Kusahau vidonge mara kwa mara kunaweza kuwa dalili kwamba utaratibu wa kila siku haulingani kabisa na mtindo wako wa maisha. Usisite kuzungumza na mtaalamu wa afya kuchunguza chaguo nyingine za uzazi wa mpango.',
    methodTipTitle: 'Njia tofauti?',
    methodTipText: 'Ikiwa kumeza kidonge kila siku ni vigumu kudumisha, njia nyingine zipo zenye mara tofauti za matumizi.',
    summaryTitle: 'Mambo ya msingi',
    summaryItems: [
      'Chukua hatua mara tu unapogundua kidonge kilichosahaulika.',
      'Angalia aina kamili ya kidonge chako.',
      'Soma maelezo ya kifurushi kujua hatua sahihi.',
      'Tumia ulinzi wa ziada ikiwa maelezo ya kifurushi yanapendekeza.',
      'Omba ushauri ukiwa na shaka au baada ya tendo la ndoa lenye hatari.',
    ],
    finalTipTitle: 'Mambo muhimu ya kukumbuka',
    finalTipText: 'Kidonge kilichosahaulika hakimaanishi moja kwa moja kwamba uzazi wa mpango wako umeacha kufanya kazi. Hatua sahihi inategemea aina ya kidonge na mazingira ya dozi iliyosahaulika. Ukiwa na shaka, soma maelezo ya kifurushi na uombe ushauri haraka.',
    disclaimerText: 'Makala hii imetolewa kwa madhumuni ya taarifa tu na haichukui nafasi ya maelezo ya kifurushi cha dawa yako wala ushauri wa kitabibu uliobinafsishwa. Mapendekezo yanaweza kutofautiana kulingana na aina ya kidonge.',
  },
  kk: {
    shareMessage: 'Ұмытылған таблетка: не істеу керек? — AWA',
    badge: 'ҰМЫТЫЛҒАН ТАБЛЕТКА',
    title: 'Ұмытылған таблетка:\nне істеу керек?',
    metaDuration: '7 мин оқу',
    metaType: 'ЖҚС',
    metaLevel: 'Орташа',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Таблетканы ұмыту кез келген адамда болуы мүмкін. Не істеу керектігі негізінен оны ұмытқаныңызға қанша уақыт болғанына, таблетканың түріне және қаптаманың қай кезеңінде болатынына байланысты.',
    importantTitle: 'Негізгі нүкте',
    importantText: 'Үрейленбеңіз. Алдымен таблеткаңыздың нақты түрін тексеріңіз және ұсынылатын әрекетті білу үшін оның қаптамасындағы нұсқаулықты қараңыз.',
    contentsTitle: 'Осы мақалада',
    topics: [
      '12 сағаттан аз кешігу',
      '12 сағаттан көп кешігу',
      'Қосымша назар аударуды қажет ететін жағдайлар',
      'Қаптамадағы нұсқаулық — сіздің анықтамаңыз',
      'Кеңесті қашан сұрау керек',
      'Негізгі қорытындылар',
    ],
    body1: 'Кейбір таблеткалар үшін 12 сағаттан аз кешігу әдетте контрацептивтік қорғанысты бұзбайды. Бұл жағдайда әдеттегі ұсыныс — ұмытылған таблетканы мүмкіндігінше тезірек ішіп, содан кейін қаптаманы әдеттегі уақытта жалғастыру.',
    step1Title: 'Таблетканы ішіңіз',
    step1Text: 'Кешіккеніңізді байқаған бойда таблетканы ішіңіз.',
    step2Title: 'Әдеттегідей жалғастырыңыз',
    step2Text: 'Содан кейін келесі таблеткалар үшін әдеттегі кестеңізге оралыңыз.',
    tip1Title: 'Білуге тиісті',
    tip1Text: 'Ұмытылған таблетканы, содан кейін әдеттегі уақытқа жоспарланғанын ішсеңіз, бір күнде екі таблетка ішілуі мүмкін.',
    body2: 'Кешігу таблеткаңызға рұқсат етілген уақыттан асқанда, қорғаныс азаюы мүмкін. Сонда не істеу керектігі таблетканың түріне, ұмытылған таблеткалар санына және ұмытылған таблетканың қаптамада қай жерде тұрғанына байланысты.',
    alertTitle: 'Ескерту',
    alertText: 'Тек мұнда берілген сағаттар санына сүйенбеңіз: кейбір таблеткаларда басқа нұсқаулар бар. Әрқашан дәрі қаптамасындағы нұсқаулықты қараңыз.',
    reflexesTitle: 'Алғашқы істейтін нәрселер',
    checkPoints: [
      {title: 'Тез әрекет етіңіз', text: 'Таблетканың ұмытылғанын байқағаннан кейін неғұрлым тез әрекет етсеңіз, тиісті ұсыныстарды орындау соғұрлым оңай.'},
      {title: 'Қаптамадағы нұсқаулықты қараңыз', text: 'Нұсқаулар таблетканың нақты түріне және ұмытылған таблеткалар санына қарай өзгеруі мүмкін.'},
      {title: 'Қосымша қорғанысты жоспарлаңыз', text: 'Кейбір жағдайларда белгілі бір кезеңге презерватив ұсынылуы мүмкін.'},
    ],
    body3: 'Барлық жағдайлар бірдей емес. Кейбір ұмытылған таблеткалар ұсыныстарды дәлірек тексеруді қажет етеді.',
    situations: [
      {title: 'Тек бір таблетка ұмытылған', text: 'Не істеу керектігі негізінен оны қабылдаудың әдеттегі уақытынан бері өткен уақытқа байланысты.'},
      {title: 'Бірден көп таблетка ұмытылған', text: 'Бұл жағдай ерекше назарды қажет етеді және қаптамадағы нұсқаулықты дәл қарағанымыз жөн.'},
      {title: 'Не істеу керектігін білмейсіз', text: 'Дәріхана маманы немесе медицина маманы дұрыс әрекетті тез анықтауға көмектесе алады.'},
    ],
    body4: 'Таблеткаңыздың қаптамасындағы нұсқаулық сіз қабылдап жүрген дәріге арналған нақты нұсқауларды береді. Ұсыныстар біріктірілген таблетка немесе тек прогестинді таблетка болуына қарай әртүрлі болуы мүмкін.',
    referenceTitle: 'Тексеруге пайдалы нәрселер',
    referenceTips: [
      'Қаптамадағы нұсқаулықты қолда ұстаңыз (мысалы, телефондағы фото)',
      'Жылдам сұрағыңыз болса, дәріхана маманымен байланысыңыз',
      'Жиі болса, дәрігерге барыңыз',
    ],
    guideTitle: 'Ұмытылған таблетканың уақыты неге маңызды?',
    guideText: 'Ұмытылған таблетканың қаптамада қай жерде тұрғаны не істеу керектігін өзгерте алады. Сондықтан қаптамадағы нұсқаулық көбіне қаптама аптасына қарай әртүрлі ұсыныстар береді.',
    body5: 'Не істеу керектігін білмесеңіз, күмәнда қалғаннан гөрі кеңес сұраған жақсы. Дәріхана маманы, акушер немесе дәрігер жағдайыңызға сай ұсыныстарды тексеруге көмектесе алады.',
    questionTitle: 'Дайын болуы тиіс ақпарат',
    questions: [
      'Бұл таблетканың нақты түрі қандай?',
      'Әдеттегі уақыттан бері қанша уақыт өтті?',
      'Қанша таблетка ұмытылды?',
      'Ұмытылған таблетка қаптаманың қай кезеңінде болды?',
      'Жақында қорғансыз жыныстық қатынас болды ма?',
    ],
    proTipTitle: 'Білуге тиісті',
    proTipText: 'Қорғансыз жыныстық қатынас таблетка ұмытылған уақытқа жақын болса, қандай нұсқалар бар екенін білу үшін маманнан тез кеңес сұраңыз.',
    repeatTitle: 'Таблеткаларды ұмытуды жалғастырсаңыз',
    body6: 'Таблеткаларды жиі ұмыту күнделікті тәртіптің өмір салтыңызға толық сай келмейтінінің белгісі болуы мүмкін. Басқа контрацепция нұсқаларын қарастыру үшін медицина маманымен сөйлесуден тартынбаңыз.',
    methodTipTitle: 'Басқа әдіс пе?',
    methodTipText: 'Күн сайын таблетка ішуді сақтау қиын болса, қолдану жиілігі басқа әдістер бар.',
    summaryTitle: 'Негізгі нәрселер',
    summaryItems: [
      'Таблетканың ұмытылғанын байқаған бойда әрекет етіңіз.',
      'Таблеткаңыздың нақты түрін тексеріңіз.',
      'Дәл әрекетті білу үшін қаптамадағы нұсқаулықты қараңыз.',
      'Қаптамадағы нұсқаулық ұсынса, қосымша қорғанысты пайдаланыңыз.',
      'Күмән туындаса немесе қауіпті жыныстық қатынастан кейін кеңес сұраңыз.',
    ],
    finalTipTitle: 'Негізгі қорытындылар',
    finalTipText: 'Ұмытылған таблетка контрацепцияңыздың жұмысын тоқтатқанын автоматты түрде білдірмейді. Дұрыс әрекет таблетканың түріне және доза ұмытылған жағдайға байланысты. Күмән туындаса, қаптамадағы нұсқаулықты қараңыз және тез кеңес сұраңыз.',
    disclaimerText: 'Бұл мақала тек ақпараттық мақсатқа арналған және дәрі қаптамасындағы нұсқаулықтың немесе жекелендірілген медициналық кеңестің орнын баспайды. Ұсыныстар таблетканың түріне қарай өзгеруі мүмкін.',
  },
  wo: {
    shareMessage: 'Pilul bu ñu fàtte: lan laa war a def? — AWA',
    badge: 'PILUL BU ÑU FÀTTE',
    title: 'Pilul bu ñu fàtte:\nlan laa war a def?',
    metaDuration: '7 simili jàng',
    metaType: 'Laaj',
    metaLevel: 'Digg-dóomu',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Fàtte benn pilul mën na am ci kenn. Li ñuy def dafay sukkandiku lool ci diir bi mu yàgg ginnaaw bi nga ko fàtte, xeetu pilul bi ak kañ ci bwat bi.',
    importantTitle: 'Li am solo',
    importantText: 'Bu tiit. Njëkk seetlu xeetu sa pilul bu leer te seet nduumu garab bi ngir xam li ñuy digal.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Yeex ci suuf 12 waxtu',
      'Yeex ci kaw 12 waxtu',
      'Mbir yu soxla teg bu gëna bari',
      'Nduumu garab bi mooy sa jëm',
      'Kañ ngay laaj ndigal',
      'Li am solo',
    ],
    body1: 'Ngir yenn pilul, yeex ci suuf 12 waxtu daa wóorul ne aar bi mu am ci ëmb dafa ñaaw. Ci mbir bii, ndigal bi ñuy joxe mooy naan pilul bi nga fàtte ci gaaw ba mu mën a am te kontine bwat bi ci waxtu bu cosaan.',
    step1Title: 'Naan pilul bi',
    step1Text: 'Naan pilul bi bu nga gisee ne yeex nga.',
    step2Title: 'Kontine ni cosaan',
    step2Text: 'Gannaaw loolu, dellu ci sa tëralin bu cosaan ngir pilul yi toftal.',
    tip1Title: 'Lu baax a xam',
    tip1Text: 'Bu nga naan pilul bi nga fàtte te naan pilul bi ñu tëral ci waxtu bu cosaan, mën na am ñaari pilul ñu naan ko ci benn bés.',
    body2: 'Bu yeex bi weesu diir bi may na sa pilul, aar bi mën na wàññiku. Li ñuy def ci jamono boobu dafay sukkandiku ci xeetu pilul bi, limu pilul yi ñu fàtte ak fan bi ci bwat bi.',
    alertTitle: 'Artu',
    alertText: 'Bu sukkandiku rekk ci limu waxtu yi ñu joxe fii: yenn pilul am nañu ndigal yu wuute. Seetal saa su ne nduumu sa garab.',
    reflexesTitle: 'Li njëkk a def',
    checkPoints: [
      {title: 'Tontu ci gaaw', text: 'Bu nga gën a tontu ci gaaw ginnaaw bi nga gisee pilul bi nga fàtte, la gën a yomb topp ndigal yu méngoo.'},
      {title: 'Seet nduumu garab bi', text: 'Ndigal yi mën nañu wuute ci xeet bu leer bu pilul bi ak limu pilul yi ñu fàtte.'},
      {title: 'Waajal aar bu yokk', text: 'Ci yenn mbir, kondom mën na ñu ko digal ci benn diir.'},
    ],
    body3: 'Mbir yépp duñu mel ni. Yenn pilul yu ñu fàtte soxla seetlu bu gëna leer ci ndigal yi.',
    situations: [
      {title: 'Benn pilul rekk bu ñu fàtte', text: 'Li ñuy def dafay sukkandiku ci jamono bi weesu ginnaaw waxtu bu cosaan bu naan.'},
      {title: 'Lu ëpp benn pilul bu ñu fàtte', text: 'Mbir bii soxla teg bu gëna bari, te gën na ñu seet nduumu garab bi bu jub.'},
      {title: 'Xamuma lan laa war a def', text: 'Benn farmasiyen walla benn liggéeykatu wér mën na la dimbli ci gaaw nga xam li war a def.'},
    ],
    body4: 'Nduumu sa pilul dafay joxe ndigal yu leer ngir garab bi nga naan. Ndigal yi mën nañu wuute ci pilul bu ñu boole walla bu progestin rekk.',
    referenceTitle: 'Li baax a seet',
    referenceTips: [
      'Denc nduumu garab bi ci sa wet (benn nataal ci telefon, misaal)',
      'Jokkoo ak benn farmasiyen bu am benn laaj bu gaaw',
      'Seet benn doktoor bu mu di am bu bari',
    ],
    guideTitle: 'Lu tax waxtu bi pilul bi ñu fàtte am solo?',
    guideText: 'Kañ pilul bi ñu fàtte dikkee ci bwat bi mën na soppi li ñuy def. Loolu mooy tax nduumu garab bi di joxe yenn saa ndigal yu wuute ci ayu-bésu bwat bi.',
    body5: 'Bu nga xamul lan nga war a def, gën na ñaan ndigal ba des ci xel-ñaar. Benn farmasiyen, ndey-jur walla doktoor mën na la dimbli nga seet ndigal yu méngoo sa mbir.',
    questionTitle: 'Xibaar yu war a waajal',
    questions: [
      'Ban xeetu pilul la bu leer?',
      'Ñaata jamono la weesu ginnaaw waxtu bu cosaan?',
      'Ñaata pilul lañu fàtte?',
      'Ci ban jamono ci bwat bi la pilul bi ñu fàtte dikkee?',
      'Am na jaam bu amul aar ci gaaw?',
    ],
    proTipTitle: 'Lu baax a xam',
    proTipText: 'Bu jaam bu amul aar am ci wetu pilul bi ñu fàtte, ñaanal benn liggéeykat ndigal ci gaaw ngir xam tànneef yi am.',
    repeatTitle: 'Bu nga di fàtte pilul yi',
    body6: 'Pilul yu ñu fàtte yu bari mën nañu wone ne benn jëf bu bés du méngoo sa dund. Bu ñaaw a wax ak benn liggéeykatu wér ngir seet yeneen anam yu ŋàbbal ëmb.',
    methodTipTitle: 'Benn anam bu wuute?',
    methodTipText: 'Bu naan benn pilul bés bu nekk jafe a sax, yeneen anam am nañu ak yoon bu wuute.',
    summaryTitle: 'Li am solo',
    summaryItems: [
      'Tontu ci gaaw bu nga gisee pilul bi nga fàtte.',
      'Seet xeetu sa pilul bu leer.',
      'Seet nduumu garab bi ngir xam li ñuy def bu leer.',
      'Jëfandikoo aar bu yokk bu nduumu garab bi digal ko.',
      'Ñaan ndigal bu am xel-ñaar walla ginnaaw jaam bu am ndiggal.',
    ],
    finalTipTitle: 'Li am solo',
    finalTipText: 'Benn pilul bu ñu fàtte du wone ne sa ŋàbbal ëmb taxaw na. Li ñuy def dafay sukkandiku ci xeetu pilul bi ak mbir bi pilul bi ñu fàtte am. Bu am xel-ñaar, seet nduumu garab bi te ñaan ndigal ci gaaw.',
    disclaimerText: 'Bind bii ngir xibaar rekk la te du wuutu nduumu sa garab walla ndigalu doktoor bu sa bopp. Ndigal yi mën nañu wuute ci xeetu pilul bi.',
  },
  ha: {
    shareMessage: 'Kwayar da aka manta: me za a yi? — AWA',
    badge: 'KWAYAR DA AKA MANTA',
    title: 'Kwayar da aka manta:\nme za a yi?',
    metaDuration: 'karatun minti 7',
    metaType: 'Tambayoyi',
    metaLevel: 'Matsakaici',
    metaValidated: 'Abun da aka duba',
    intro: 'Mantawa da kwaya na iya faruwa ga kowa. Abin da za a yi galibi ya dogara ga tsawon lokacin da ya wuce, nau’in kwayar, da lokacin da abin ya faru a cikin fakitin.',
    importantTitle: 'Muhimmin abu',
    importantText: 'Kada ki firgita. Da farko duba ainihin nau’in kwayarki kuma duba takardar bayanin maganin don sanin hanyar da aka ba da shawarar.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Latti da ƙasa da sa’o’i 12',
      'Latti da fiye da sa’o’i 12',
      'Yanayin da ke bukatar ƙarin kulawa',
      'Takardar bayanin magani ita ce mafi dogaro',
      'Lokacin neman shawara',
      'Muhimman abubuwa',
    ],
    body1: 'Ga wasu kwayoyi, jinkiri na ƙasa da sa’o’i 12 yawanci ba ya rage kariyar hana haihuwa. A wannan yanayi, shawarar da aka saba ita ce a sha kwayar da aka manta da wuri-wuri sannan a ci gaba da fakitin a lokacin da aka saba.',
    step1Title: 'Sha kwayar',
    step1Text: 'Sha kwayar da zarar kin lura kin yi latti.',
    step2Title: 'Ci gaba kamar yadda aka saba',
    step2Text: 'Sannan koma ga jadawalinki na yau da kullum ga kwayoyin da suka biyo baya.',
    tip1Title: 'Abin da ya dace a sani',
    tip1Text: 'Idan kika sha kwayar da aka manta sannan ta lokacin da aka saba, ana iya samun kwayoyi biyu a rana ɗaya.',
    body2: 'Idan jinkirin ya wuce lokacin da aka yarda da shi ga kwayarki, kariya na iya raguwa. Abin da za a yi sai ya dogara ga nau’in kwayar, adadin kwayoyin da aka manta, da inda a cikin fakitin kwayar da aka manta ta faɗi.',
    alertTitle: 'Gargaɗi',
    alertText: 'Kada ki dogara ga adadin sa’o’in da aka bayar a nan kaɗai: wasu kwayoyi suna da umarni daban-daban. Koyaushe duba takardar bayanin maganinki.',
    reflexesTitle: 'Abubuwan farko da za a yi',
    checkPoints: [
      {title: 'Amsa da sauri', text: 'Yadda kika amsa da sauri bayan lura da kwayar da aka manta, haka yake da sauƙi a bi shawarwarin da suka dace.'},
      {title: 'Duba takardar bayanin magani', text: 'Umarni na iya bambanta bisa ainihin nau’in kwayar da adadin kwayoyin da aka manta.'},
      {title: 'Shirya kariyar ajiya', text: 'A wasu yanayi, ana iya ba da shawarar kwaroron roba na wani lokaci.'},
    ],
    body3: 'Ba duk yanayi iri ɗaya ba ne. Wasu kwayoyin da aka manta suna bukatar duba shawarwari da kyau.',
    situations: [
      {title: 'Kwaya ɗaya kawai aka manta', text: 'Abin da za a yi galibi ya dogara ga lokacin da ya wuce tun lokacin shan da aka saba.'},
      {title: 'Fiye da kwaya ɗaya aka manta', text: 'Wannan yanayin yana bukatar kulawa ta musamman, kuma ya fi kyau a duba takardar bayanin magani da kyau.'},
      {title: 'Ba ki da tabbas me za ki yi', text: 'Mai magani ko ma’aikacin lafiya zai iya taimaka miki da sauri ki gano hanyar da ta dace.'},
    ],
    body4: 'Takardar bayanin kwayarki tana ba da takamaiman umarni ga maganin da kike sha. Shawarwari na iya bambanta bisa ko kwayar ta haɗaka ce ko ta progestin kaɗai.',
    referenceTitle: 'Abubuwa masu amfani da za a duba',
    referenceTips: [
      'Ajiye takardar bayanin magani a hannu (hoto a wayarki, misali)',
      'Tuntuɓi mai magani idan kina da tambaya mai sauri',
      'Ga likita idan yana faruwa akai-akai',
    ],
    guideTitle: 'Me ya sa lokacin kwayar da aka manta yake da muhimmanci?',
    guideText: 'Lokacin da kwayar da aka manta ta faɗi a cikin fakitin na iya canza abin da za a yi. Shi ya sa takardar bayanin magani galibi tana ba da shawarwari daban-daban bisa makon fakitin.',
    body5: 'Idan ba ki san abin da za ki yi ba, ya fi kyau ki nemi shawara maimakon ki zauna cikin shakka. Mai magani, ungozoma, ko likita na iya taimaka miki ki duba shawarwarin da suka dace da yanayinki.',
    questionTitle: 'Bayanin da za a shirya',
    questions: [
      'Wane ainihin nau’in kwaya ce?',
      'Nawa lokaci ya wuce tun lokacin da aka saba?',
      'Kwayoyi nawa aka manta?',
      'A wane lokaci a cikin fakitin kwayar da aka manta ta faru?',
      'An yi kusanci ba tare da kariya ba kwanan nan?',
    ],
    proTipTitle: 'Abin da ya dace a sani',
    proTipText: 'Idan an yi kusanci ba tare da kariya ba kusa da lokacin kwayar da aka manta, nemi shawarar ƙwararre da sauri don sanin zaɓuɓɓukan da ke akwai.',
    repeatTitle: 'Idan kina ci gaba da mantawa da kwayoyi',
    body6: 'Mantawa da kwayoyi akai-akai na iya zama alamar cewa tsarin yau da kullum bai dace sosai da salon rayuwarki ba. Kada ki yi jinkirin magana da ma’aikacin lafiya don bincika wasu zaɓuɓɓukan hana haihuwa.',
    methodTipTitle: 'Wata hanya daban?',
    methodTipText: 'Idan shan kwaya kowace rana yana da wahalar kiyayewa, akwai wasu hanyoyi masu bambancin yawan amfani.',
    summaryTitle: 'Muhimman abubuwa',
    summaryItems: [
      'Amsa da zarar kin lura da kwayar da aka manta.',
      'Duba ainihin nau’in kwayarki.',
      'Duba takardar bayanin magani don sanin takamaiman hanyar da za a bi.',
      'Yi amfani da kariyar ajiya idan takardar bayanin magani ta ba da shawara.',
      'Nemi shawara idan akwai shakka ko bayan ganawa mai haɗari.',
    ],
    finalTipTitle: 'Muhimman abubuwa',
    finalTipText: 'Kwayar da aka manta ba ta nufin hana haihuwarki ta daina aiki kai tsaye ba. Hanyar da ta dace ta dogara ga nau’in kwayar da yanayin mantawar. Idan akwai shakka, duba takardar bayanin magani kuma ki nemi shawara da sauri.',
    disclaimerText: 'An bayar da wannan labari don bayani ne kawai kuma ba ya maye gurbin takardar bayanin maganinki ko shawarar likita ta keɓaɓɓiya. Shawarwari na iya bambanta bisa nau’in kwayar.',
  },
  am: {
    shareMessage: 'የተረሳ ኪኒን፦ ምን ማድረግ? — AWA',
    badge: 'የተረሳ ኪኒን',
    title: 'የተረሳ ኪኒን፦\nምን ማድረግ?',
    metaDuration: '7 ደቂቃ ንባብ',
    metaType: 'ተደጋጋሚ ጥያቄዎች',
    metaLevel: 'መካከለኛ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'የተረሳ ኪኒን ለማንም ሊከሰት ይችላል። ምን ማድረግ እንዳለብሽ በዋናነት የተረሳው ከስንት ጊዜ በፊት እንደሆነ፣ በኪኒኑ ዓይነትና በፓኬቱ ውስጥ መቼ እንደተከሰተ ላይ ይወሰናል።',
    importantTitle: 'ዋናው ነጥብ',
    importantText: 'አትደንግጪ። መጀመሪያ የኪኒንሽን ትክክለኛ ዓይነት አረጋግጪ እና የሚመከረውን እርምጃ ለማወቅ የመመሪያ ወረቀቱን ተመልከቺ።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'ከ12 ሰዓት ባነሰ ጊዜ ዘግይቷል',
      'ከ12 ሰዓት በላይ ዘግይቷል',
      'ተጨማሪ ትኩረት የሚያስፈልጋቸው ሁኔታዎች',
      'የመመሪያ ወረቀቱ ማመሳከሪያሽ ነው',
      'ምክር መቼ መጠየቅ',
      'ዋና ዋና ነጥቦች',
    ],
    body1: 'ለአንዳንድ ኪኒኖች ከ12 ሰዓት ባነሰ ጊዜ መዘግየት በአጠቃላይ የእርግዝና መከላከያ ጥበቃን አያበላሽም። በዚህ ሁኔታ የተለመደው ምክር የተረሳውን ኪኒን በተቻለ ፍጥነት መውሰድ እና ከዚያ ፓኬቱን በተለመደው ሰዓት መቀጠል ነው።',
    step1Title: 'ኪኒኑን ውሰጂ',
    step1Text: 'እንደዘገየሽ እንዳስተዋልሽ ኪኒኑን ውሰጂ።',
    step2Title: 'እንደተለመደው ቀጥዪ',
    step2Text: 'ከዚያ ለሚቀጥሉት ኪኒኖች ወደ ተለመደው ሰሌዳሽ ተመለሺ።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text: 'የተረሳውን ኪኒን ከወሰድሽ በኋላ በተለመደው ሰዓት የተያዘውን ከወሰድሽ፣ በአንድ ቀን ሁለት ኪኒን መወሰድ ሊከሰት ይችላል።',
    body2: 'መዘግየቱ ለኪኒንሽ ከተፈቀደው ጊዜ ሲበልጥ ጥበቃው ሊቀንስ ይችላል። ከዚያ ምን ማድረግ እንዳለብሽ በኪኒኑ ዓይነት፣ በተረሱት ኪኒኖች ብዛት እና የተረሳው ኪኒን በፓኬቱ ውስጥ በየት እንደሚወድቅ ላይ ይወሰናል።',
    alertTitle: 'ማስጠንቀቂያ',
    alertText: 'እዚህ በተሰጠው የሰዓት ብዛት ብቻ አትደገፊ፦ አንዳንድ ኪኒኖች የተለያዩ መመሪያዎች አሏቸው። ሁልጊዜ የመድኃኒትሽን መመሪያ ወረቀት ተመልከቺ።',
    reflexesTitle: 'መጀመሪያ ማድረግ ያለብሽ',
    checkPoints: [
      {title: 'በፍጥነት ምላሽ ስጪ', text: 'የተረሳውን ኪኒን ካስተዋልሽ በኋላ ባለ ፍጥነት ምላሽ በሰጠሽ መጠን፣ ተገቢዎቹን ምክሮች ለመከተል ቀላል ይሆናል።'},
      {title: 'የመመሪያ ወረቀቱን ተመልከቺ', text: 'መመሪያዎቹ እንደ ኪኒኑ ትክክለኛ ዓይነትና እንደ ተረሱት ኪኒኖች ብዛት ሊለያዩ ይችላሉ።'},
      {title: 'ለተጨማሪ ጥበቃ አቅጂ', text: 'በአንዳንድ ሁኔታዎች ለተወሰነ ጊዜ ኮንዶም ሊመከር ይችላል።'},
    ],
    body3: 'ሁሉም ሁኔታዎች አንድ አይደሉም። አንዳንድ የተረሱ ኪኒኖች ምክሮቹን የበለጠ በትክክል መፈተሽ ይጠይቃሉ።',
    situations: [
      {title: 'አንድ ኪኒን ብቻ ተረስቷል', text: 'ምን ማድረግ እንዳለብሽ በዋናነት ከተለመደው የመውሰጃ ሰዓት ጀምሮ ባለፈው ጊዜ ላይ ይወሰናል።'},
      {title: 'ከአንድ በላይ ኪኒን ተረስቷል', text: 'ይህ ሁኔታ ልዩ ትኩረት ይፈልጋል፣ እና የመመሪያ ወረቀቱን በትክክል መመልከት ይሻላል።'},
      {title: 'ምን ማድረግ እንዳለብሽ እርግጠኛ አይደለሽም', text: 'ፋርማሲስት ወይም የጤና ባለሙያ ትክክለኛውን እርምጃ በፍጥነት ለመለየት ሊረዳሽ ይችላል።'},
    ],
    body4: 'የኪኒንሽ የመመሪያ ወረቀት ለምትወስጂው መድኃኒት ትክክለኛ መመሪያዎችን ይሰጣል። ምክሮች የተደባለቀ ኪኒን ወይም ፕሮጄስቲን ብቻ ያለው ኪኒን እንደሆነ ሊለያዩ ይችላሉ።',
    referenceTitle: 'ሊፈተሹ የሚገቡ ጠቃሚ ነገሮች',
    referenceTips: [
      'የመመሪያ ወረቀቱን በእጅሽ ይኑር (ለምሳሌ በስልክሽ ላይ ፎቶ)',
      'ፈጣን ጥያቄ ካለሽ ፋርማሲስት አነጋግሪ',
      'ብዙ ጊዜ ከተከሰተ ሐኪም ተመልከቺ',
    ],
    guideTitle: 'የተረሳው ኪኒን ጊዜ ለምን አስፈላጊ ነው?',
    guideText: 'የተረሳው ኪኒን በፓኬቱ ውስጥ የሚወድቅበት ቦታ ምን ማድረግ እንዳለብሽ ሊለውጥ ይችላል። ለዚህ ነው የመመሪያ ወረቀቱ ብዙ ጊዜ እንደ ፓኬቱ ሳምንት የተለያዩ ምክሮችን የሚሰጠው።',
    body5: 'ምን ማድረግ እንዳለብሽ ካላወቅሽ፣ በጥርጣሬ ከመቆየት ምክር መጠየቅ ይሻላል። ፋርማሲስት፣ ሚድዋይፍ ወይም ሐኪም ከሁኔታሽ ጋር የሚስማሙ ምክሮችን እንድትፈትሺ ሊረዱሽ ይችላሉ።',
    questionTitle: 'ዝግጁ ሊሆን የሚገባ መረጃ',
    questions: [
      'ትክክለኛው የኪኒን ዓይነት ምንድን ነው?',
      'ከተለመደው ሰዓት ጀምሮ ምን ያህል ጊዜ አልፏል?',
      'ስንት ኪኒኖች ተረስተዋል?',
      'የተረሳው ኪኒን በፓኬቱ ውስጥ በየትኛው ነጥብ ላይ ተከሰተ?',
      'በቅርቡ ያለ መከላከያ ግንኙነት ተደርጓል?',
    ],
    proTipTitle: 'ማወቅ ጠቃሚ ነው',
    proTipText: 'ያለ መከላከያ ግንኙነት ከተረሳው ኪኒን ጊዜ አካባቢ ከተደረገ፣ ምን አማራጮች እንዳሉ ለማወቅ በፍጥነት የባለሙያ ምክር ጠይቂ።',
    repeatTitle: 'ኪኒን መርሳትሽን ከቀጠልሽ',
    body6: 'ተደጋጋሚ የተረሱ ኪኒኖች የዕለት ሥርዓቱ ከአኗኗር ዘይቤሽ ጋር በትክክል እንደማይስማማ ምልክት ሊሆኑ ይችላሉ። ሌሎች የእርግዝና መከላከያ አማራጮችን ለማሰስ ከጤና ባለሙያ ጋር ለመነጋገር አትዘገዪ።',
    methodTipTitle: 'የተለየ ዘዴ?',
    methodTipText: 'በየቀኑ ኪኒን መውሰድ ለመቀጠል ከከበደ፣ የተለየ የአጠቃቀም ድግግሞሽ ያላቸው ሌሎች ዘዴዎች አሉ።',
    summaryTitle: 'አስፈላጊዎቹ',
    summaryItems: [
      'የተረሳውን ኪኒን እንዳስተዋልሽ ምላሽ ስጪ።',
      'የኪኒንሽን ትክክለኛ ዓይነት አረጋግጪ።',
      'ትክክለኛውን እርምጃ ለማወቅ የመመሪያ ወረቀቱን ተመልከቺ።',
      'የመመሪያ ወረቀቱ ከመከረ ተጨማሪ ጥበቃ ተጠቀሚ።',
      'ጥርጣሬ ካለሽ ወይም አደገኛ ግንኙነት ከተደረገ በኋላ ምክር ጠይቂ።',
    ],
    finalTipTitle: 'ዋና ዋና ነጥቦች',
    finalTipText: 'የተረሳ ኪኒን የእርግዝና መከላከያሽ መሥራት አቁሟል ማለት አይደለም። ትክክለኛው እርምጃ በኪኒኑ ዓይነትና በተረሳው መጠን ሁኔታዎች ላይ ይወሰናል። ጥርጣሬ ካለሽ የመመሪያ ወረቀቱን ተመልከቺ እና በፍጥነት ምክር ጠይቂ።',
    disclaimerText: 'ይህ ጽሑፍ ለመረጃ ብቻ የቀረበ ሲሆን የመድኃኒትሽን የመመሪያ ወረቀት ወይም የግል የሕክምና ምክርን አይተካም። ምክሮች እንደ ኪኒኑ ዓይነት ሊለያዩ ይችላሉ።',
  },
  nl: {
    shareMessage: 'Pil vergeten: wat te doen? — AWA',
    badge: 'VERGETEN PIL',
    title: 'Pil vergeten:\nwat te doen?',
    metaDuration: '7 min lezen',
    metaType: 'Veelgestelde vragen',
    metaLevel: 'Gevorderd',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Een vergeten pil kan iedereen overkomen. Wat je moet doen hangt vooral af van hoelang geleden je de pil vergat, het type pil en wanneer in de strip het gebeurt.',
    importantTitle: 'Het belangrijkste punt',
    importantText: 'Raak niet in paniek. Controleer eerst het exacte type van je pil en lees de bijsluiter om te weten wat de aanbevolen handelwijze is.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Minder dan 12 uur te laat',
      'Meer dan 12 uur te laat',
      'Situaties die extra aandacht vragen',
      'De bijsluiter is je referentie',
      'Wanneer advies vragen',
      'Belangrijkste punten',
    ],
    body1: 'Bij sommige pillen brengt een vertraging van minder dan 12 uur de anticonceptieve bescherming over het algemeen niet in gevaar. In dat geval is de gebruikelijke aanbeveling de vergeten pil zo snel mogelijk in te nemen en daarna de strip op het gebruikelijke tijdstip voort te zetten.',
    step1Title: 'Neem de pil',
    step1Text: 'Neem de pil zodra je merkt dat je te laat bent.',
    step2Title: 'Ga door zoals gewoonlijk',
    step2Text: 'Ga daarna voor de volgende pillen terug naar je gebruikelijke schema.',
    tip1Title: 'Goed om te weten',
    tip1Text: 'Als je de vergeten pil inneemt en daarna de pil die voor het gebruikelijke tijdstip gepland staat, kan het gebeuren dat er op dezelfde dag twee pillen worden ingenomen.',
    body2: 'Wanneer de vertraging de voor je pil toegestane tijd overschrijdt, kan de bescherming verminderd zijn. Wat je dan moet doen hangt af van het type pil, het aantal vergeten pillen en op welk punt in de strip de vergeten pil valt.',
    alertTitle: 'Waarschuwing',
    alertText: 'Vertrouw niet alleen op het hier genoemde aantal uren: sommige pillen hebben andere instructies. Raadpleeg altijd de bijsluiter van je medicijn.',
    reflexesTitle: 'Eerste dingen om te doen',
    checkPoints: [
      {title: 'Reageer snel', text: 'Hoe sneller je reageert nadat je de vergeten pil hebt opgemerkt, hoe makkelijker het is de passende aanbevelingen te volgen.'},
      {title: 'Raadpleeg de bijsluiter', text: 'De instructies kunnen verschillen afhankelijk van het exacte type pil en het aantal vergeten pillen.'},
      {title: 'Denk aan extra bescherming', text: 'In sommige situaties kan gedurende een bepaalde periode een condoom worden aanbevolen.'},
    ],
    body3: 'Niet alle situaties zijn gelijk. Bij sommige vergeten pillen is een nauwkeurigere controle van de aanbevelingen nodig.',
    situations: [
      {title: 'Slechts één pil vergeten', text: 'Wat je moet doen hangt vooral af van de tijd die is verstreken sinds het gebruikelijke tijdstip van inname.'},
      {title: 'Meer dan één pil vergeten', text: 'Deze situatie vraagt bijzondere aandacht en het is het best de bijsluiter nauwkeurig te raadplegen.'},
      {title: 'Je weet niet zeker wat je moet doen', text: 'Een apotheker of zorgverlener kan je snel helpen de juiste handelwijze te bepalen.'},
    ],
    body4: 'De bijsluiter van je pil geeft de precieze instructies voor het medicijn dat je gebruikt. Aanbevelingen kunnen verschillen naargelang het een gecombineerde pil of een pil met alleen progestageen is.',
    referenceTitle: 'Nuttige dingen om te controleren',
    referenceTips: [
      'Houd de bijsluiter bij de hand (bijvoorbeeld een foto op je telefoon)',
      'Neem contact op met een apotheker als je een snelle vraag hebt',
      'Ga naar een arts als het vaak gebeurt',
    ],
    guideTitle: 'Waarom is het tijdstip van de vergeten pil belangrijk?',
    guideText: 'Op welk punt in de strip de vergeten pil valt, kan veranderen wat je moet doen. Daarom geeft de bijsluiter vaak verschillende aanbevelingen afhankelijk van de week van de strip.',
    body5: 'Als je niet weet wat je moet doen, is het beter om advies te vragen dan in twijfel te blijven. Een apotheker, verloskundige of huisarts kan je helpen de aanbevelingen te controleren die bij je situatie passen.',
    questionTitle: 'Informatie om klaar te hebben',
    questions: [
      'Welk precies type pil is het?',
      'Hoeveel tijd is er verstreken sinds het gebruikelijke tijdstip?',
      'Hoeveel pillen zijn er vergeten?',
      'Op welk punt in de strip gebeurde de vergeten pil?',
      'Is er recent onbeschermde seks geweest?',
    ],
    proTipTitle: 'Goed om te weten',
    proTipText: 'Als er rond het moment van de vergeten pil onbeschermde seks heeft plaatsgevonden, vraag dan snel een professional om advies om te weten welke opties er zijn.',
    repeatTitle: 'Als je pillen blijft vergeten',
    body6: 'Vaak vergeten pillen kunnen een teken zijn dat de dagelijkse routine niet helemaal bij je leefstijl past. Aarzel niet om met een zorgverlener te praten om andere anticonceptieopties te verkennen.',
    methodTipTitle: 'Een andere methode?',
    methodTipText: 'Als het moeilijk is elke dag een pil in te nemen, bestaan er andere methoden met een andere gebruiksfrequentie.',
    summaryTitle: 'De essentie',
    summaryItems: [
      'Reageer zodra je de vergeten pil opmerkt.',
      'Controleer het exacte type van je pil.',
      'Raadpleeg de bijsluiter om de precieze handelwijze te kennen.',
      'Gebruik extra bescherming als de bijsluiter dat aanbeveelt.',
      'Vraag advies bij twijfel of na een risicovolle ontmoeting.',
    ],
    finalTipTitle: 'Belangrijkste punten',
    finalTipText: 'Een vergeten pil betekent niet automatisch dat je anticonceptie niet meer werkt. De juiste handelwijze hangt af van het type pil en de omstandigheden van de vergeten dosis. Raadpleeg bij twijfel de bijsluiter en vraag snel advies.',
    disclaimerText: 'Dit artikel wordt alleen ter informatie aangeboden en vervangt niet de bijsluiter van je medicijn of persoonlijk medisch advies. Aanbevelingen kunnen verschillen afhankelijk van het type pil.',
  },
  fi: {
    shareMessage: 'Unohtunut pilleri: mitä tehdä? — AWA',
    badge: 'UNOHTUNUT PILLERI',
    title: 'Unohtunut pilleri:\nmitä tehdä?',
    metaDuration: '7 min lukuaika',
    metaType: 'UKK',
    metaLevel: 'Keskitaso',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Unohtunut pilleri voi tapahtua kenelle tahansa. Toimintatapa riippuu pääasiassa siitä, kuinka kauan sitten unohdit sen, pillerin tyypistä ja siitä, missä kohtaa pakkausta se tapahtuu.',
    importantTitle: 'Tärkein asia',
    importantText: 'Älä paniikkiin. Tarkista ensin pillerisi tarkka tyyppi ja lue sen pakkausseloste suositellun toimintatavan selvittämiseksi.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Alle 12 tuntia myöhässä',
      'Yli 12 tuntia myöhässä',
      'Tilanteet, jotka vaativat erityistä huomiota',
      'Pakkausseloste on ohjeesi',
      'Milloin pyytää neuvoa',
      'Tärkeimmät asiat',
    ],
    body1: 'Joillakin pillereillä alle 12 tunnin viive ei yleensä vaaranna ehkäisysuojaa. Tässä tapauksessa tavallinen suositus on ottaa unohtunut pilleri mahdollisimman pian ja jatkaa pakkausta sitten tavalliseen aikaan.',
    step1Title: 'Ota pilleri',
    step1Text: 'Ota pilleri heti, kun huomaat olevasi myöhässä.',
    step2Title: 'Jatka tavalliseen tapaan',
    step2Text: 'Palaa sitten tavalliseen aikatauluusi seuraavien pillerien osalta.',
    tip1Title: 'Hyvä tietää',
    tip1Text: 'Jos otat unohtuneen pillerin ja sen jälkeen tavalliseen aikaan määrätyn, voi käydä niin, että kaksi pilleriä otetaan samana päivänä.',
    body2: 'Kun viive ylittää pillerillesi sallitun ajan, suoja voi heikentyä. Mitä silloin tehdään, riippuu pillerin tyypistä, unohtuneiden pillerien määrästä ja siitä, missä kohtaa pakkausta unohtunut pilleri on.',
    alertTitle: 'Varoitus',
    alertText: 'Älä luota pelkästään tässä annettuun tuntimäärään: joillakin pillereillä on erilaiset ohjeet. Tarkista aina lääkkeesi pakkausseloste.',
    reflexesTitle: 'Ensimmäiset toimet',
    checkPoints: [
      {title: 'Reagoi nopeasti', text: 'Mitä nopeammin reagoit unohtuneen pillerin huomattuasi, sitä helpompi on noudattaa asianmukaisia suosituksia.'},
      {title: 'Tarkista pakkausseloste', text: 'Ohjeet voivat vaihdella pillerin tarkan tyypin ja unohtuneiden pillerien määrän mukaan.'},
      {title: 'Varaudu varasuojaan', text: 'Joissakin tilanteissa kondomia voidaan suositella tietyn ajan.'},
    ],
    body3: 'Kaikki tilanteet eivät ole samanlaisia. Jotkin unohtuneet pillerit vaativat suositusten tarkempaa tarkistamista.',
    situations: [
      {title: 'Vain yksi pilleri unohtunut', text: 'Mitä tehdään, riippuu pääasiassa tavallisesta ottoajasta kuluneesta ajasta.'},
      {title: 'Useampi kuin yksi pilleri unohtunut', text: 'Tämä tilanne vaatii erityistä huomiota, ja pakkausseloste kannattaa tarkistaa täsmällisesti.'},
      {title: 'Et ole varma, mitä tehdä', text: 'Apteekkari tai terveydenhuollon ammattilainen voi nopeasti auttaa tunnistamaan oikean toimintatavan.'},
    ],
    body4: 'Pillerisi pakkausseloste antaa tarkat ohjeet käyttämällesi lääkkeelle. Suositukset voivat vaihdella sen mukaan, onko kyseessä yhdistelmäpilleri vai pelkkää progestiinia sisältävä pilleri.',
    referenceTitle: 'Hyödyllisiä tarkistettavia asioita',
    referenceTips: [
      'Pidä pakkausseloste käden ulottuvilla (esimerkiksi valokuva puhelimessa)',
      'Ota yhteyttä apteekkariin, jos sinulla on nopea kysymys',
      'Mene lääkäriin, jos näin käy usein',
    ],
    guideTitle: 'Miksi unohtuneen pillerin ajankohta on tärkeä?',
    guideText: 'Se, missä kohtaa pakkausta unohtunut pilleri on, voi muuttaa toimintatapaa. Siksi pakkausselosteessa annetaan usein eri suosituksia pakkauksen viikon mukaan.',
    body5: 'Jos et tiedä, mitä tehdä, on parempi pyytää neuvoa kuin jäädä epävarmaksi. Apteekkari, kätilö tai lääkäri voi auttaa tarkistamaan tilanteeseesi sopivat suositukset.',
    questionTitle: 'Valmiina pidettävät tiedot',
    questions: [
      'Mikä on pillerisi tarkka tyyppi?',
      'Kuinka paljon aikaa on kulunut tavallisesta ottoajasta?',
      'Kuinka monta pilleriä on unohtunut?',
      'Missä kohtaa pakkausta unohtuminen tapahtui?',
      'Onko viime aikoina ollut suojaamatonta seksiä?',
    ],
    proTipTitle: 'Hyvä tietää',
    proTipText: 'Jos suojaamaton seksi tapahtui unohtuneen pillerin tienoilla, pyydä pikaisesti neuvoa ammattilaiselta selvittääksesi, mitä vaihtoehtoja on tarjolla.',
    repeatTitle: 'Jos unohdat pillerin toistuvasti',
    body6: 'Toistuvat unohtuneet pillerit voivat olla merkki siitä, ettei päivittäinen rutiini aivan sovi elämäntapaasi. Älä epäröi puhua terveydenhuollon ammattilaisen kanssa tutkiaksesi muita ehkäisyvaihtoehtoja.',
    methodTipTitle: 'Toinen menetelmä?',
    methodTipText: 'Jos pillerin ottamista joka päivä on vaikea ylläpitää, on olemassa muita menetelmiä, joiden käyttötiheys on erilainen.',
    summaryTitle: 'Olennaiset asiat',
    summaryItems: [
      'Reagoi heti, kun huomaat unohtuneen pillerin.',
      'Tarkista pillerisi tarkka tyyppi.',
      'Tarkista pakkausseloste selvittääksesi tarkan toimintatavan.',
      'Käytä varasuojaa, jos pakkausseloste sitä suosittelee.',
      'Pyydä neuvoa epäselvässä tilanteessa tai riskialttiin yhdynnän jälkeen.',
    ],
    finalTipTitle: 'Tärkeimmät asiat',
    finalTipText: 'Unohtunut pilleri ei automaattisesti tarkoita, että ehkäisysi olisi lakannut toimimasta. Oikea toimintatapa riippuu pillerin tyypistä ja unohtumisen olosuhteista. Epäselvässä tilanteessa tarkista pakkausseloste ja pyydä pikaisesti neuvoa.',
    disclaimerText: 'Tämä artikkeli on tarkoitettu vain tiedoksi eikä korvaa lääkkeesi pakkausselostetta tai henkilökohtaista lääketieteellistä neuvontaa. Suositukset voivat vaihdella pillerin tyypin mukaan.',
  },
  el: {
    shareMessage: 'Ξέχασες ένα χάπι: τι να κάνεις; — AWA',
    badge: 'ΧΑΠΙ ΠΟΥ ΠΑΡΑΛΕΙΦΘΗΚΕ',
    title: 'Ξέχασες ένα χάπι:\nτι να κάνεις;',
    metaDuration: '7 λεπτά ανάγνωσης',
    metaType: 'Συχνές ερωτήσεις',
    metaLevel: 'Μεσαίο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Ένα χάπι που ξεχάστηκε μπορεί να συμβεί σε οποιαδήποτε. Το τι θα κάνεις εξαρτάται κυρίως από το πόσο καιρό πριν το ξέχασες, τον τύπο του χαπιού και το σημείο του κουτιού στο οποίο συμβαίνει.',
    importantTitle: 'Το βασικό σημείο',
    importantText: 'Μην πανικοβάλλεσαι. Έλεγξε πρώτα τον ακριβή τύπο του χαπιού σου και διάβασε το φύλλο οδηγιών του για να μάθεις τι συνιστάται να κάνεις.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Καθυστέρηση μικρότερη από 12 ώρες',
      'Καθυστέρηση μεγαλύτερη από 12 ώρες',
      'Περιπτώσεις που χρειάζονται επιπλέον προσοχή',
      'Το φύλλο οδηγιών είναι η αναφορά σου',
      'Πότε να ζητήσεις συμβουλή',
      'Βασικά συμπεράσματα',
    ],
    body1: 'Για ορισμένα χάπια, μια καθυστέρηση μικρότερη από 12 ώρες γενικά δεν διακυβεύει την αντισυλληπτική προστασία. Σε αυτή την περίπτωση, η συνηθισμένη σύσταση είναι να πάρεις το χάπι που ξέχασες το συντομότερο δυνατό και στη συνέχεια να συνεχίσεις το κουτί στη συνηθισμένη ώρα.',
    step1Title: 'Πάρε το χάπι',
    step1Text: 'Πάρε το χάπι μόλις καταλάβεις ότι καθυστέρησες.',
    step2Title: 'Συνέχισε όπως συνήθως',
    step2Text: 'Έπειτα επανέλθε στο συνηθισμένο πρόγραμμά σου για τα επόμενα χάπια.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text: 'Αν πάρεις το χάπι που ξέχασες και μετά αυτό που είναι προγραμματισμένο για τη συνηθισμένη ώρα, μπορεί να συμβεί να πάρεις δύο χάπια την ίδια ημέρα.',
    body2: 'Όταν η καθυστέρηση ξεπερνά το χρονικό περιθώριο που επιτρέπεται για το χάπι σου, η προστασία μπορεί να μειωθεί. Το τι πρέπει να κάνεις τότε εξαρτάται από τον τύπο του χαπιού, τον αριθμό των χαπιών που ξεχάστηκαν και το σημείο του κουτιού στο οποίο πέφτει το χάπι που ξεχάστηκε.',
    alertTitle: 'Προσοχή',
    alertText: 'Μην βασίζεσαι μόνο στον αριθμό των ωρών που δίνεται εδώ: ορισμένα χάπια έχουν διαφορετικές οδηγίες. Έλεγχε πάντα το φύλλο οδηγιών του φαρμάκου σου.',
    reflexesTitle: 'Τα πρώτα πράγματα που πρέπει να κάνεις',
    checkPoints: [
      {title: 'Αντίδρασε γρήγορα', text: 'Όσο πιο γρήγορα αντιδράς αφού καταλάβεις ότι ξέχασες το χάπι, τόσο πιο εύκολο είναι να ακολουθήσεις τις κατάλληλες συστάσεις.'},
      {title: 'Έλεγξε το φύλλο οδηγιών', text: 'Οι οδηγίες μπορεί να διαφέρουν ανάλογα με τον ακριβή τύπο του χαπιού και τον αριθμό των χαπιών που ξεχάστηκαν.'},
      {title: 'Σκέψου εφεδρική προστασία', text: 'Σε ορισμένες περιπτώσεις, μπορεί να συνιστάται προφυλακτικό για ένα συγκεκριμένο διάστημα.'},
    ],
    body3: 'Δεν μοιάζουν όλες οι περιπτώσεις. Ορισμένα χάπια που ξεχάστηκαν απαιτούν πιο ακριβή έλεγχο των συστάσεων.',
    situations: [
      {title: 'Ξεχάστηκε μόνο ένα χάπι', text: 'Το τι θα κάνεις εξαρτάται κυρίως από τον χρόνο που πέρασε από τη συνηθισμένη ώρα λήψης.'},
      {title: 'Ξεχάστηκαν περισσότερα από ένα χάπια', text: 'Αυτή η περίπτωση απαιτεί ιδιαίτερη προσοχή και είναι καλύτερα να ελέγξεις με ακρίβεια το φύλλο οδηγιών.'},
      {title: 'Δεν είσαι σίγουρη τι να κάνεις', text: 'Ένας φαρμακοποιός ή ένας επαγγελματίας υγείας μπορεί να σε βοηθήσει γρήγορα να εντοπίσεις τον σωστό τρόπο ενέργειας.'},
    ],
    body4: 'Το φύλλο οδηγιών του χαπιού σου δίνει τις ακριβείς οδηγίες για το φάρμακο που παίρνεις. Οι συστάσεις μπορεί να διαφέρουν ανάλογα με το αν πρόκειται για συνδυασμένο χάπι ή χάπι μόνο με προγεσταγόνο.',
    referenceTitle: 'Χρήσιμα πράγματα που πρέπει να ελέγξεις',
    referenceTips: [
      'Κράτα το φύλλο οδηγιών πρόχειρο (για παράδειγμα μια φωτογραφία στο κινητό σου)',
      'Επικοινώνησε με έναν φαρμακοποιό αν έχεις μια γρήγορη ερώτηση',
      'Επισκέψου γιατρό αν συμβαίνει συχνά',
    ],
    guideTitle: 'Γιατί έχει σημασία η χρονική στιγμή του χαπιού που ξεχάστηκε;',
    guideText: 'Το σημείο του κουτιού στο οποίο πέφτει το χάπι που ξεχάστηκε μπορεί να αλλάξει το τι πρέπει να κάνεις. Γι’ αυτό το φύλλο οδηγιών δίνει συχνά διαφορετικές συστάσεις ανάλογα με την εβδομάδα του κουτιού.',
    body5: 'Αν δεν ξέρεις τι να κάνεις, είναι καλύτερα να ζητήσεις συμβουλή παρά να μείνεις στην αμφιβολία. Ένας φαρμακοποιός, μια μαία ή ένας γιατρός μπορεί να σε βοηθήσει να ελέγξεις τις συστάσεις που ταιριάζουν στην περίπτωσή σου.',
    questionTitle: 'Πληροφορίες που πρέπει να έχεις έτοιμες',
    questions: [
      'Ποιος ακριβώς τύπος χαπιού είναι;',
      'Πόσος χρόνος πέρασε από τη συνηθισμένη ώρα;',
      'Πόσα χάπια ξεχάστηκαν;',
      'Σε ποιο σημείο του κουτιού συνέβη το χάπι που ξεχάστηκε;',
      'Υπήρξε πρόσφατα ανυπολόγιστη σεξουαλική επαφή;',
    ],
    proTipTitle: 'Καλό είναι να γνωρίζεις',
    proTipText: 'Αν υπήρξε σεξουαλική επαφή χωρίς προστασία γύρω από τη χρονική στιγμή του χαπιού που ξεχάστηκε, ζήτησε γρήγορα συμβουλή από έναν επαγγελματία για να μάθεις ποιες επιλογές υπάρχουν.',
    repeatTitle: 'Αν ξεχνάς συνεχώς χάπια',
    body6: 'Τα συχνά χάπια που ξεχνιούνται μπορεί να είναι σημάδι ότι η καθημερινή ρουτίνα δεν ταιριάζει ακριβώς στον τρόπο ζωής σου. Μην διστάσεις να μιλήσεις με έναν επαγγελματία υγείας για να εξετάσεις άλλες αντισυλληπτικές επιλογές.',
    methodTipTitle: 'Μια διαφορετική μέθοδος;',
    methodTipText: 'Αν η καθημερινή λήψη ενός χαπιού είναι δύσκολο να διατηρηθεί, υπάρχουν άλλες μέθοδοι με διαφορετική συχνότητα χρήσης.',
    summaryTitle: 'Τα βασικά',
    summaryItems: [
      'Αντίδρασε μόλις καταλάβεις ότι ξέχασες το χάπι.',
      'Έλεγξε τον ακριβή τύπο του χαπιού σου.',
      'Έλεγξε το φύλλο οδηγιών για να μάθεις τον ακριβή τρόπο ενέργειας.',
      'Χρησιμοποίησε εφεδρική προστασία αν τη συνιστά το φύλλο οδηγιών.',
      'Ζήτησε συμβουλή αν έχεις αμφιβολίες ή μετά από επικίνδυνη επαφή.',
    ],
    finalTipTitle: 'Βασικά συμπεράσματα',
    finalTipText: 'Ένα χάπι που ξεχάστηκε δεν σημαίνει αυτόματα ότι η αντισύλληψή σου έπαψε να λειτουργεί. Ο σωστός τρόπος ενέργειας εξαρτάται από τον τύπο του χαπιού και τις συνθήκες της δόσης που ξεχάστηκε. Αν έχεις αμφιβολίες, έλεγξε το φύλλο οδηγιών και ζήτησε γρήγορα συμβουλή.',
    disclaimerText: 'Αυτό το άρθρο παρέχεται μόνο για ενημερωτικούς σκοπούς και δεν αντικαθιστά το φύλλο οδηγιών του φαρμάκου σου ούτε την εξατομικευμένη ιατρική συμβουλή. Οι συστάσεις μπορεί να διαφέρουν ανάλογα με τον τύπο του χαπιού.',
  },
  fil: {
    shareMessage: 'Nakalimutang pill: ano ang gagawin? — AWA',
    badge: 'NAKALIMUTANG PILL',
    title: 'Nakalimutang pill:\nano ang gagawin?',
    metaDuration: '7 min na babasahin',
    metaType: 'FAQ',
    metaLevel: 'Katamtaman',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Maaaring mangyari sa kahit sino ang nakalimutang pill. Ang gagawin ay pangunahing nakadepende sa kung gaano na katagal mula nang makalimutan mo ito, sa uri ng pill, at sa kung nasaang bahagi ng pakete ito nangyari.',
    importantTitle: 'Ang pangunahing punto',
    importantText: 'Huwag mataranta. Una, tingnan ang eksaktong uri ng iyong pill at basahin ang leaflet sa loob ng pakete upang malaman ang inirerekomendang gawin.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Wala pang 12 oras ang huli',
      'Higit sa 12 oras ang huli',
      'Mga sitwasyong nangangailangan ng dagdag na atensyon',
      'Ang leaflet sa pakete ang iyong sanggunian',
      'Kailan hihingi ng payo',
      'Mahahalagang tandaan',
    ],
    body1: 'Para sa ilang pill, karaniwang hindi nakokompromiso ang proteksyon laban sa pagbubuntis kapag wala pang 12 oras ang pagkaantala. Sa kasong ito, ang karaniwang rekomendasyon ay inumin ang nakalimutang pill sa lalong madaling panahon at ipagpatuloy ang pakete sa karaniwang oras.',
    step1Title: 'Inumin ang pill',
    step1Text: 'Inumin ang pill sa sandaling mapansin mong huli ka na.',
    step2Title: 'Ipagpatuloy gaya ng dati',
    step2Text: 'Pagkatapos ay bumalik sa karaniwang iskedyul para sa mga susunod na pill.',
    tip1Title: 'Mabuting malaman',
    tip1Text: 'Kung iinumin mo ang nakalimutang pill at pagkatapos ang pill na nakaiskedyul sa karaniwang oras, maaaring mangyaring dalawang pill ang maiinom sa parehong araw.',
    body2: 'Kapag lumampas ang pagkaantala sa pinapayagang oras para sa iyong pill, maaaring mabawasan ang proteksyon. Ang gagawin noon ay nakadepende sa uri ng pill, sa bilang ng mga nakalimutang pill, at sa kung nasaan sa pakete ang nakalimutang pill.',
    alertTitle: 'Babala',
    alertText: 'Huwag umasa lamang sa bilang ng oras na nakasaad dito: may ilang pill na may magkakaibang tagubilin. Palaging basahin ang leaflet ng iyong gamot.',
    reflexesTitle: 'Mga unang dapat gawin',
    checkPoints: [
      {title: 'Kumilos nang mabilis', text: 'Kapag mas mabilis kang kumilos matapos mapansin ang nakalimutang pill, mas madaling sundin ang angkop na mga rekomendasyon.'},
      {title: 'Basahin ang leaflet', text: 'Maaaring mag-iba ang mga tagubilin depende sa eksaktong uri ng pill at sa bilang ng mga nakalimutang pill.'},
      {title: 'Magplano ng karagdagang proteksyon', text: 'Sa ilang sitwasyon, maaaring irekomenda ang condom sa loob ng takdang panahon.'},
    ],
    body3: 'Hindi magkakapareho ang lahat ng sitwasyon. Ang ilang nakalimutang pill ay nangangailangan ng mas tumpak na pagsusuri ng mga rekomendasyon.',
    situations: [
      {title: 'Isang pill lang ang nakalimutan', text: 'Ang gagawin ay pangunahing nakadepende sa lumipas na oras mula sa karaniwang oras ng pag-inom.'},
      {title: 'Higit sa isang pill ang nakalimutan', text: 'Nangangailangan ang sitwasyong ito ng partikular na atensyon, at pinakamainam na tingnan nang tumpak ang leaflet.'},
      {title: 'Hindi sigurado kung ano ang gagawin', text: 'Matutulungan ka nang mabilis ng parmasyutiko o propesyonal sa kalusugan na matukoy ang tamang gawin.'},
    ],
    body4: 'Ibinibigay ng leaflet ng iyong pill ang tumpak na tagubilin para sa gamot na iniinom mo. Maaaring magkaiba ang mga rekomendasyon depende kung combined pill o progestin-only pill ito.',
    referenceTitle: 'Mga kapaki-pakinabang na susuriin',
    referenceTips: [
      'Panatilihing madaling abutin ang leaflet (halimbawa, larawan sa iyong telepono)',
      'Makipag-ugnayan sa parmasyutiko kung may mabilis na tanong ka',
      'Magpatingin sa doktor kung madalas itong mangyari',
    ],
    guideTitle: 'Bakit mahalaga ang tiyempo ng nakalimutang pill?',
    guideText: 'Ang kung nasaan sa pakete ang nakalimutang pill ay maaaring magpabago sa gagawin. Kaya madalas na nagbibigay ang leaflet ng magkakaibang rekomendasyon depende sa linggo ng pakete.',
    body5: 'Kung hindi mo alam ang gagawin, mas mabuting humingi ng payo kaysa manatiling nag-aalinlangan. Matutulungan ka ng parmasyutiko, midwife, o doktor na suriin ang mga rekomendasyong angkop sa iyong sitwasyon.',
    questionTitle: 'Impormasyong dapat nakahanda',
    questions: [
      'Ano ang eksaktong uri ng pill?',
      'Gaano katagal na ang lumipas mula sa karaniwang oras?',
      'Ilang pill ang nakalimutan?',
      'Sa anong bahagi ng pakete nangyari ang nakalimutang pill?',
      'Nagkaroon ba ng pakikipagtalik na walang proteksyon kamakailan?',
    ],
    proTipTitle: 'Mabuting malaman',
    proTipText: 'Kung nagkaroon ng pakikipagtalik na walang proteksyon sa paligid ng oras ng nakalimutang pill, humingi agad ng payo sa propesyonal upang malaman kung anong mga opsyon ang available.',
    repeatTitle: 'Kung paulit-ulit kang nakakalimot ng pill',
    body6: 'Ang madalas na pagkalimot ng pill ay maaaring senyales na hindi gaanong akma sa iyong pamumuhay ang pang-araw-araw na gawain. Huwag mag-atubiling makipag-usap sa propesyonal sa kalusugan upang tuklasin ang iba pang opsyon sa kontrasepsyon.',
    methodTipTitle: 'Ibang paraan?',
    methodTipText: 'Kung mahirap ipagpatuloy ang pag-inom ng pill araw-araw, may iba pang paraan na may ibang dalas ng paggamit.',
    summaryTitle: 'Ang mahalaga',
    summaryItems: [
      'Kumilos sa sandaling mapansin mo ang nakalimutang pill.',
      'Tingnan ang eksaktong uri ng iyong pill.',
      'Basahin ang leaflet upang malaman ang tumpak na dapat gawin.',
      'Gumamit ng karagdagang proteksyon kung inirerekomenda ng leaflet.',
      'Humingi ng payo kung nag-aalinlangan o pagkatapos ng mapanganib na pakikipagtalik.',
    ],
    finalTipTitle: 'Mahahalagang tandaan',
    finalTipText: 'Hindi awtomatikong nangangahulugan ang nakalimutang pill na tumigil na ang bisa ng iyong kontrasepsyon. Nakadepende ang tamang gawin sa uri ng pill at sa mga pangyayari ng nakalimutang dosis. Kung nag-aalinlangan, basahin ang leaflet at humingi agad ng payo.',
    disclaimerText: 'Para sa impormasyon lamang ang artikulong ito at hindi pumapalit sa leaflet ng iyong gamot o sa personalisadong payong medikal. Maaaring mag-iba ang mga rekomendasyon depende sa uri ng pill.',
  },
  ta: {
    shareMessage: 'தவறிய மாத்திரை: என்ன செய்வது? — AWA',
    badge: 'தவறிய மாத்திரை',
    title: 'தவறிய மாத்திரை:\nஎன்ன செய்வது?',
    metaDuration: '7 நிமிடம் படிக்க',
    metaType: 'கேள்வி-பதில்',
    metaLevel: 'இடைநிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'தவறிய மாத்திரை யாருக்கும் நிகழலாம். என்ன செய்வது என்பது முக்கியமாக நீங்கள் எவ்வளவு நேரம் முன்பு அதைத் தவறவிட்டீர்கள், மாத்திரையின் வகை, அட்டையில் அது எங்கே நிகழ்கிறது என்பதைப் பொறுத்தது.',
    importantTitle: 'முக்கியப் புள்ளி',
    importantText: 'பதற்றப்படாதீர்கள். முதலில் உங்கள் மாத்திரையின் சரியான வகையைச் சரிபார்த்து, பரிந்துரைக்கப்பட்ட நடவடிக்கையை அறிய அதன் பெட்டியில் உள்ள துண்டுச் சீட்டைப் பாருங்கள்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      '12 மணிநேரத்துக்கும் குறைவான தாமதம்',
      '12 மணிநேரத்துக்கு மேலான தாமதம்',
      'கூடுதல் கவனம் தேவைப்படும் சூழ்நிலைகள்',
      'துண்டுச் சீட்டே உங்கள் குறிப்பு',
      'ஆலோசனையை எப்போது கேட்பது',
      'முக்கியக் குறிப்புகள்',
    ],
    body1: 'சில மாத்திரைகளுக்கு, 12 மணிநேரத்துக்கும் குறைவான தாமதம் பொதுவாகக் கருத்தடைப் பாதுகாப்பைக் குறைப்பதில்லை. இந்த வழக்கில், வழக்கமான பரிந்துரை தவறிய மாத்திரையை முடிந்தவரை விரைவில் எடுத்துவிட்டு, அட்டையை வழக்கமான நேரத்தில் தொடர்வதாகும்.',
    step1Title: 'மாத்திரையை எடுங்கள்',
    step1Text: 'நீங்கள் தாமதமாகிவிட்டதைக் கவனித்தவுடன் மாத்திரையை எடுங்கள்.',
    step2Title: 'வழக்கம்போலத் தொடருங்கள்',
    step2Text: 'பிறகு அடுத்த மாத்திரைகளுக்கு உங்கள் வழக்கமான அட்டவணைக்குத் திரும்புங்கள்.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text: 'தவறிய மாத்திரையை எடுத்துவிட்டு, பின்னர் வழக்கமான நேரத்துக்கான மாத்திரையையும் எடுத்தால், ஒரே நாளில் இரண்டு மாத்திரைகள் எடுக்கப்படலாம்.',
    body2: 'தாமதம் உங்கள் மாத்திரைக்கு அனுமதிக்கப்பட்ட நேரத்தை மீறும்போது, பாதுகாப்பு குறையலாம். அப்போது என்ன செய்வது என்பது மாத்திரையின் வகை, தவறிய மாத்திரைகளின் எண்ணிக்கை, தவறிய மாத்திரை அட்டையில் எங்கு வருகிறது என்பதைப் பொறுத்தது.',
    alertTitle: 'எச்சரிக்கை',
    alertText: 'இங்கே கொடுக்கப்பட்ட மணிநேர எண்ணிக்கையை மட்டும் நம்பாதீர்கள்: சில மாத்திரைகளுக்கு வெவ்வேறு வழிமுறைகள் உள்ளன. எப்போதும் உங்கள் மருந்தின் துண்டுச் சீட்டைச் சரிபாருங்கள்.',
    reflexesTitle: 'முதலில் செய்ய வேண்டியவை',
    checkPoints: [
      {title: 'விரைவாகச் செயல்படுங்கள்', text: 'தவறிய மாத்திரையைக் கவனித்த பின் நீங்கள் எவ்வளவு விரைவாகச் செயல்படுகிறீர்களோ, பொருத்தமான பரிந்துரைகளைப் பின்பற்றுவது அவ்வளவு எளிதாகும்.'},
      {title: 'துண்டுச் சீட்டைச் சரிபாருங்கள்', text: 'மாத்திரையின் சரியான வகை மற்றும் தவறிய மாத்திரைகளின் எண்ணிக்கையைப் பொறுத்து வழிமுறைகள் மாறுபடலாம்.'},
      {title: 'கூடுதல் பாதுகாப்புக்குத் திட்டமிடுங்கள்', text: 'சில சூழ்நிலைகளில், ஒரு குறிப்பிட்ட காலத்துக்கு ஆணுறை பரிந்துரைக்கப்படலாம்.'},
    ],
    body3: 'எல்லாச் சூழ்நிலைகளும் ஒன்றல்ல. சில தவறிய மாத்திரைகளுக்குப் பரிந்துரைகளை இன்னும் துல்லியமாகச் சரிபார்க்க வேண்டும்.',
    situations: [
      {title: 'ஒரே ஒரு மாத்திரை மட்டும் தவறியது', text: 'என்ன செய்வது என்பது முக்கியமாக அதை எடுக்க வேண்டிய வழக்கமான நேரத்திலிருந்து கடந்த நேரத்தைப் பொறுத்தது.'},
      {title: 'ஒன்றுக்கு மேற்பட்ட மாத்திரைகள் தவறியது', text: 'இந்தச் சூழ்நிலைக்குத் தனிக் கவனம் தேவை, துண்டுச் சீட்டைத் துல்லியமாகச் சரிபார்ப்பது நல்லது.'},
      {title: 'என்ன செய்வது என்று உறுதியில்லை', text: 'ஒரு மருந்தாளுநர் அல்லது சுகாதார நிபுணர் சரியான நடவடிக்கையை அடையாளம் காண உங்களுக்கு விரைவாக உதவலாம்.'},
    ],
    body4: 'உங்கள் மாத்திரையின் துண்டுச் சீட்டு நீங்கள் எடுத்துக்கொள்ளும் மருந்துக்கான துல்லியமான வழிமுறைகளைத் தருகிறது. கூட்டு மாத்திரையா அல்லது புரோஜெஸ்டின் மட்டும் கொண்ட மாத்திரையா என்பதைப் பொறுத்துப் பரிந்துரைகள் வேறுபடலாம்.',
    referenceTitle: 'சரிபார்க்க வேண்டிய பயனுள்ள விஷயங்கள்',
    referenceTips: [
      'துண்டுச் சீட்டைக் கைவசம் வைத்திருங்கள் (எடுத்துக்காட்டாக, உங்கள் தொலைபேசியில் ஒரு புகைப்படம்)',
      'விரைவான கேள்வி இருந்தால் ஒரு மருந்தாளுநரைத் தொடர்புகொள்ளுங்கள்',
      'இது அடிக்கடி நடந்தால் ஒரு மருத்துவரைப் பாருங்கள்',
    ],
    guideTitle: 'தவறிய மாத்திரையின் நேரம் ஏன் முக்கியம்?',
    guideText: 'தவறிய மாத்திரை அட்டையில் எங்கு வருகிறது என்பது என்ன செய்வது என்பதை மாற்றலாம். அதனால்தான் துண்டுச் சீட்டு பெரும்பாலும் அட்டையின் வாரத்தைப் பொறுத்து வெவ்வேறு பரிந்துரைகளைத் தருகிறது.',
    body5: 'என்ன செய்வது என்று உங்களுக்குத் தெரியாவிட்டால், சந்தேகத்துடன் இருப்பதை விட ஆலோசனை கேட்பது நல்லது. ஒரு மருந்தாளுநர், மருத்துவச்சி அல்லது மருத்துவர் உங்கள் சூழ்நிலைக்குப் பொருத்தமான பரிந்துரைகளைச் சரிபார்க்க உதவலாம்.',
    questionTitle: 'தயாராக வைத்திருக்க வேண்டிய தகவல்',
    questions: [
      'இது சரியாக எந்த வகை மாத்திரை?',
      'வழக்கமான நேரத்திலிருந்து எவ்வளவு நேரம் கடந்துவிட்டது?',
      'எத்தனை மாத்திரைகள் தவறின?',
      'அட்டையின் எந்தப் புள்ளியில் மாத்திரை தவறியது?',
      'சமீபத்தில் பாதுகாப்பற்ற உடலுறவு நிகழ்ந்ததா?',
    ],
    proTipTitle: 'தெரிந்துகொள்ளுங்கள்',
    proTipText: 'தவறிய மாத்திரையின் நேரத்தை ஒட்டிப் பாதுகாப்பற்ற உடலுறவு நிகழ்ந்திருந்தால், என்ன விருப்பங்கள் உள்ளன என்பதை அறிய ஒரு நிபுணரிடம் உடனே ஆலோசனை கேளுங்கள்.',
    repeatTitle: 'நீங்கள் தொடர்ந்து மாத்திரைகளைத் தவறவிட்டால்',
    body6: 'அடிக்கடி தவறும் மாத்திரைகள், தினசரி வழக்கம் உங்கள் வாழ்க்கை முறைக்கு முழுமையாகப் பொருந்தவில்லை என்பதற்கான அறிகுறியாக இருக்கலாம். பிற கருத்தடை விருப்பங்களை ஆராய ஒரு சுகாதார நிபுணரிடம் பேசத் தயங்காதீர்கள்.',
    methodTipTitle: 'வேறொரு முறையா?',
    methodTipText: 'தினமும் மாத்திரை எடுத்துக்கொள்வதைத் தொடர்வது கடினமாக இருந்தால், வேறுபட்ட பயன்பாட்டு அதிர்வெண்ணுடன் பிற முறைகள் உள்ளன.',
    summaryTitle: 'அத்தியாவசியங்கள்',
    summaryItems: [
      'தவறிய மாத்திரையைக் கவனித்தவுடன் செயல்படுங்கள்.',
      'உங்கள் மாத்திரையின் சரியான வகையைச் சரிபாருங்கள்.',
      'துல்லியமான நடவடிக்கையை அறிய துண்டுச் சீட்டைச் சரிபாருங்கள்.',
      'துண்டுச் சீட்டு பரிந்துரைத்தால் கூடுதல் பாதுகாப்பைப் பயன்படுத்துங்கள்.',
      'சந்தேகம் இருந்தால் அல்லது ஆபத்தான உறவுக்குப் பின் ஆலோசனை கேளுங்கள்.',
    ],
    finalTipTitle: 'முக்கியக் குறிப்புகள்',
    finalTipText: 'தவறிய மாத்திரை உங்கள் கருத்தடை செயல்படுவதை நிறுத்திவிட்டது என்று தானாகப் பொருளல்ல. சரியான நடவடிக்கை மாத்திரையின் வகையையும் தவறிய அளவின் சூழ்நிலைகளையும் பொறுத்தது. சந்தேகம் இருந்தால், துண்டுச் சீட்டைச் சரிபார்த்து விரைவாக ஆலோசனை கேளுங்கள்.',
    disclaimerText: 'இந்தக் கட்டுரை தகவலுக்கு மட்டுமே வழங்கப்படுகிறது, உங்கள் மருந்தின் துண்டுச் சீட்டுக்கோ தனிப்பயன் மருத்துவ ஆலோசனைக்கோ மாற்றல்ல. மாத்திரையின் வகையைப் பொறுத்துப் பரிந்துரைகள் மாறுபடலாம்.',
  },
  te: {
    shareMessage: 'మర్చిపోయిన మాత్ర: ఏం చేయాలి? — AWA',
    badge: 'మర్చిపోయిన మాత్ర',
    title: 'మర్చిపోయిన మాత్ర:\nఏం చేయాలి?',
    metaDuration: '7 నిమిషాల పఠనం',
    metaType: 'తరచుగా అడిగే ప్రశ్నలు',
    metaLevel: 'మధ్యస్థ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'మాత్ర మర్చిపోవడం ఎవరికైనా జరగవచ్చు. ఏం చేయాలనేది ప్రధానంగా మీరు ఎంత కాలం క్రితం మర్చిపోయారు, మాత్ర రకం, ప్యాక్‌లో అది ఏ సమయంలో జరిగింది అనే వాటిపై ఆధారపడి ఉంటుంది.',
    importantTitle: 'కీలక విషయం',
    importantText: 'కంగారు పడకండి. ముందుగా మీ మాత్ర యొక్క ఖచ్చితమైన రకాన్ని సరిచూసుకోండి, సిఫార్సు చేసిన చర్య ఏమిటో తెలుసుకోవడానికి దాని ప్యాకేజీ కరపత్రాన్ని చూడండి.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      '12 గంటల కంటే తక్కువ ఆలస్యం',
      '12 గంటల కంటే ఎక్కువ ఆలస్యం',
      'అదనపు శ్రద్ధ అవసరమయ్యే పరిస్థితులు',
      'ప్యాకేజీ కరపత్రమే మీ ప్రమాణం',
      'సలహాను ఎప్పుడు కోరాలి',
      'ముఖ్యాంశాలు',
    ],
    body1: 'కొన్ని మాత్రల విషయంలో, 12 గంటల కంటే తక్కువ ఆలస్యం సాధారణంగా గర్భనిరోధక రక్షణను దెబ్బతీయదు. ఈ సందర్భంలో, సాధారణ సిఫార్సు మర్చిపోయిన మాత్రను వీలైనంత త్వరగా వేసుకుని, ఆపై ప్యాక్‌ను సాధారణ సమయంలో కొనసాగించడం.',
    step1Title: 'మాత్ర వేసుకోండి',
    step1Text: 'మీరు ఆలస్యమైందని గమనించిన వెంటనే మాత్ర వేసుకోండి.',
    step2Title: 'ఎప్పటిలాగే కొనసాగించండి',
    step2Text: 'తర్వాతి మాత్రలకు మీ సాధారణ షెడ్యూల్‌కు తిరిగి వెళ్లండి.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text: 'మీరు మర్చిపోయిన మాత్రను, ఆపై సాధారణ సమయానికి నిర్ణయించిన మాత్రను వేసుకుంటే, ఒకే రోజు రెండు మాత్రలు వేసుకోవడం జరగవచ్చు.',
    body2: 'ఆలస్యం మీ మాత్రకు అనుమతించిన సమయాన్ని మించినప్పుడు, రక్షణ తగ్గవచ్చు. అప్పుడు ఏం చేయాలనేది మాత్ర రకం, మర్చిపోయిన మాత్రల సంఖ్య, ప్యాక్‌లో మర్చిపోయిన మాత్ర ఎక్కడ పడుతుందనే దానిపై ఆధారపడి ఉంటుంది.',
    alertTitle: 'హెచ్చరిక',
    alertText: 'ఇక్కడ ఇచ్చిన గంటల సంఖ్యపై మాత్రమే ఆధారపడకండి: కొన్ని మాత్రలకు భిన్న సూచనలు ఉంటాయి. ఎల్లప్పుడూ మీ మందు ప్యాకేజీ కరపత్రాన్ని సరిచూసుకోండి.',
    reflexesTitle: 'మొదట చేయాల్సినవి',
    checkPoints: [
      {title: 'వేగంగా స్పందించండి', text: 'మర్చిపోయిన మాత్రను గమనించిన తర్వాత మీరు ఎంత వేగంగా స్పందిస్తే, తగిన సిఫార్సులను పాటించడం అంత సులభం.'},
      {title: 'కరపత్రాన్ని సరిచూసుకోండి', text: 'సూచనలు మాత్ర యొక్క ఖచ్చితమైన రకాన్ని, మర్చిపోయిన మాత్రల సంఖ్యను బట్టి మారవచ్చు.'},
      {title: 'అదనపు రక్షణ గురించి ఆలోచించండి', text: 'కొన్ని పరిస్థితుల్లో, ఒక నిర్ణీత కాలానికి కండోమ్ సిఫార్సు చేయబడవచ్చు.'},
    ],
    body3: 'అన్ని పరిస్థితులు ఒకేలా ఉండవు. కొన్ని మర్చిపోయిన మాత్రలకు సిఫార్సులను మరింత ఖచ్చితంగా సరిచూడటం అవసరం.',
    situations: [
      {title: 'ఒక్క మాత్ర మాత్రమే మర్చిపోయారు', text: 'ఏం చేయాలనేది ప్రధానంగా వేసుకోవాల్సిన సాధారణ సమయం నుండి గడిచిన సమయంపై ఆధారపడి ఉంటుంది.'},
      {title: 'ఒకటి కంటే ఎక్కువ మాత్రలు మర్చిపోయారు', text: 'ఈ పరిస్థితికి ప్రత్యేక శ్రద్ధ అవసరం, కరపత్రాన్ని ఖచ్చితంగా సరిచూసుకోవడం ఉత్తమం.'},
      {title: 'ఏం చేయాలో ఖచ్చితంగా తెలియదు', text: 'ఒక ఫార్మసిస్ట్ లేదా ఆరోగ్య నిపుణుడు సరైన చర్యను త్వరగా గుర్తించడానికి మీకు సహాయపడగలరు.'},
    ],
    body4: 'మీ మాత్ర యొక్క ప్యాకేజీ కరపత్రం మీరు వేసుకుంటున్న మందుకు ఖచ్చితమైన సూచనలను ఇస్తుంది. సిఫార్సులు అది కలిపి ఉండే మాత్రనా లేక ప్రొజెస్టిన్ మాత్రమే ఉండే మాత్రనా అనేదాన్ని బట్టి భిన్నంగా ఉండవచ్చు.',
    referenceTitle: 'సరిచూడదగిన ఉపయోగకరమైన అంశాలు',
    referenceTips: [
      'కరపత్రాన్ని అందుబాటులో ఉంచుకోండి (ఉదాహరణకు మీ ఫోన్‌లో ఒక ఫోటో)',
      'మీకు త్వరిత ప్రశ్న ఉంటే ఒక ఫార్మసిస్ట్‌ను సంప్రదించండి',
      'తరచుగా జరిగితే ఒక వైద్యుడిని కలవండి',
    ],
    guideTitle: 'మర్చిపోయిన మాత్ర సమయం ఎందుకు ముఖ్యం?',
    guideText: 'ప్యాక్‌లో మర్చిపోయిన మాత్ర ఎక్కడ పడుతుందనేది ఏం చేయాలనేదాన్ని మార్చవచ్చు. అందుకే కరపత్రం తరచుగా ప్యాక్‌లోని వారాన్ని బట్టి భిన్న సిఫార్సులను ఇస్తుంది.',
    body5: 'ఏం చేయాలో మీకు తెలియకపోతే, సందేహంలో ఉండిపోవడం కంటే సలహా అడగడం మంచిది. ఒక ఫార్మసిస్ట్, మంత్రసాని లేదా వైద్యులు మీ పరిస్థితికి తగిన సిఫార్సులను సరిచూసుకోవడానికి మీకు సహాయపడగలరు.',
    questionTitle: 'సిద్ధంగా ఉంచుకోవాల్సిన సమాచారం',
    questions: [
      'ఇది ఖచ్చితంగా ఏ రకమైన మాత్ర?',
      'సాధారణ సమయం నుండి ఎంత సమయం గడిచింది?',
      'ఎన్ని మాత్రలు మర్చిపోయారు?',
      'ప్యాక్‌లో ఏ సమయంలో మర్చిపోయిన మాత్ర జరిగింది?',
      'ఇటీవల రక్షణ లేకుండా సంభోగం జరిగిందా?',
    ],
    proTipTitle: 'తెలుసుకోవాల్సినవి',
    proTipText: 'మర్చిపోయిన మాత్ర సమయంలో రక్షణ లేకుండా సంభోగం జరిగితే, ఏ ఎంపికలు అందుబాటులో ఉన్నాయో తెలుసుకోవడానికి వెంటనే ఒక నిపుణుడిని సలహా అడగండి.',
    repeatTitle: 'మీరు పదేపదే మాత్రలు మర్చిపోతుంటే',
    body6: 'తరచు మర్చిపోయిన మాత్రలు రోజువారీ దినచర్య మీ జీవనశైలికి సరిగ్గా సరిపోవడం లేదనే సంకేతం కావచ్చు. ఇతర గర్భనిరోధక ఎంపికలను అన్వేషించడానికి ఒక ఆరోగ్య నిపుణుడితో మాట్లాడటానికి వెనుకాడకండి.',
    methodTipTitle: 'ఒక భిన్న పద్ధతి?',
    methodTipText: 'ప్రతి రోజూ మాత్ర వేసుకోవడం కొనసాగించడం కష్టమైతే, వేరే వాడక తరచుదనంతో ఇతర పద్ధతులు ఉన్నాయి.',
    summaryTitle: 'ముఖ్యమైనవి',
    summaryItems: [
      'మర్చిపోయిన మాత్రను గమనించిన వెంటనే స్పందించండి.',
      'మీ మాత్ర యొక్క ఖచ్చితమైన రకాన్ని సరిచూసుకోండి.',
      'ఖచ్చితమైన చర్యను తెలుసుకోవడానికి ప్యాకేజీ కరపత్రాన్ని చూడండి.',
      'కరపత్రం సిఫార్సు చేస్తే అదనపు రక్షణను ఉపయోగించండి.',
      'సందేహం ఉంటే లేదా ప్రమాదకర సంభోగం తర్వాత సలహా అడగండి.',
    ],
    finalTipTitle: 'ముఖ్యాంశాలు',
    finalTipText: 'మర్చిపోయిన మాత్ర అంటే మీ గర్భనిరోధకం ఆటోమేటిక్‌గా పనిచేయడం ఆగిపోయిందని కాదు. సరైన చర్య మాత్ర రకంపై, మర్చిపోయిన మోతాదు పరిస్థితులపై ఆధారపడి ఉంటుంది. సందేహం ఉంటే, కరపత్రాన్ని సరిచూసుకుని వెంటనే సలహా అడగండి.',
    disclaimerText: 'ఈ వ్యాసం సమాచారం కోసం మాత్రమే ఇవ్వబడింది, మీ మందు ప్యాకేజీ కరపత్రానికి లేదా వ్యక్తిగత వైద్య సలహాకు ప్రత్యామ్నాయం కాదు. సిఫార్సులు మాత్ర రకాన్ని బట్టి మారవచ్చు.',
  },
  mr: {
    shareMessage: 'गोळी चुकली: काय करावे? — AWA',
    badge: 'चुकलेली गोळी',
    title: 'गोळी चुकली:\nकाय करावे?',
    metaDuration: '7 मिनिटे वाचन',
    metaType: 'वारंवार विचारले जाणारे प्रश्न',
    metaLevel: 'मध्यम स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'गोळी चुकणे कोणालाही होऊ शकते. काय करावे हे मुख्यतः ती चुकून किती वेळ झाला, गोळीचा प्रकार आणि पाकिटाच्या कोणत्या टप्प्यावर ती चुकते यावर अवलंबून असते.',
    importantTitle: 'मुख्य मुद्दा',
    importantText: 'घाबरू नका. आधी तुमच्या गोळीचा नेमका प्रकार तपासा आणि शिफारस केलेली कृती जाणून घेण्यासाठी तिचे माहितीपत्रक पाहा.',
    contentsTitle: 'या लेखात',
    topics: [
      '12 तासांपेक्षा कमी उशीर',
      '12 तासांपेक्षा जास्त उशीर',
      'अतिरिक्त लक्ष लागणाऱ्या परिस्थिती',
      'माहितीपत्रक हाच तुमचा संदर्भ',
      'सल्ला केव्हा घ्यावा',
      'मुख्य मुद्दे',
    ],
    body1: 'काही गोळ्यांसाठी, 12 तासांपेक्षा कमी उशीर साधारणपणे गर्भनिरोधक संरक्षणाला धक्का लावत नाही. या प्रसंगी नेहमीची शिफारस अशी आहे की चुकलेली गोळी शक्य तितक्या लवकर घ्या आणि मग नेहमीच्या वेळी पाकीट सुरू ठेवा.',
    step1Title: 'गोळी घ्या',
    step1Text: 'तुम्हाला उशीर झाल्याचे लक्षात येताच गोळी घ्या.',
    step2Title: 'नेहमीप्रमाणे सुरू ठेवा',
    step2Text: 'मग पुढील गोळ्यांसाठी तुमच्या नेहमीच्या वेळापत्रकावर परत या.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text: 'तुम्ही चुकलेली गोळी घेतली आणि मग नेहमीच्या वेळेची गोळी घेतली, तर एकाच दिवशी दोन गोळ्या घेतल्या जाऊ शकतात.',
    body2: 'तुमच्या गोळीसाठी परवानगी असलेल्या वेळेपेक्षा उशीर झाल्यास, संरक्षण कमी होऊ शकते. तेव्हा काय करावे हे गोळीचा प्रकार, चुकलेल्या गोळ्यांची संख्या आणि चुकलेली गोळी पाकिटात कुठे येते यावर अवलंबून असते.',
    alertTitle: 'इशारा',
    alertText: 'इथे दिलेल्या तासांच्या संख्येवरच अवलंबून राहू नका: काही गोळ्यांसाठी वेगळ्या सूचना असतात. नेहमी तुमच्या औषधाचे माहितीपत्रक तपासा.',
    reflexesTitle: 'आधी काय करावे',
    checkPoints: [
      {title: 'लवकर प्रतिसाद द्या', text: 'गोळी चुकल्याचे लक्षात आल्यावर तुम्ही जितक्या लवकर प्रतिसाद द्याल, तितक्या योग्य शिफारसींचे पालन करणे सोपे होते.'},
      {title: 'माहितीपत्रक तपासा', text: 'गोळीच्या नेमक्या प्रकारानुसार आणि चुकलेल्या गोळ्यांच्या संख्येनुसार सूचना वेगळ्या असू शकतात.'},
      {title: 'पर्यायी संरक्षणाची योजना करा', text: 'काही परिस्थितींत, ठरावीक कालावधीसाठी कंडोम वापरण्याची शिफारस केली जाऊ शकते.'},
    ],
    body3: 'सर्व परिस्थिती सारख्या नसतात. काही चुकलेल्या गोळ्यांसाठी शिफारशींची अधिक अचूक तपासणी आवश्यक असते.',
    situations: [
      {title: 'फक्त एक गोळी चुकली', text: 'काय करावे हे मुख्यतः नेहमीच्या वेळेपासून किती वेळ गेला यावर अवलंबून असते.'},
      {title: 'एकापेक्षा जास्त गोळ्या चुकल्या', text: 'या परिस्थितीकडे विशेष लक्ष देणे गरजेचे आहे आणि माहितीपत्रक अचूकपणे तपासणे चांगले.'},
      {title: 'काय करावे हे निश्चित नाही', text: 'औषधविक्रेते किंवा आरोग्य व्यावसायिक तुम्हाला योग्य कृती पटकन ओळखण्यास मदत करू शकतात.'},
    ],
    body4: 'तुमच्या गोळीचे माहितीपत्रक तुम्ही घेत असलेल्या औषधासाठी अचूक सूचना देते. संयुक्त गोळी आहे की फक्त प्रोजेस्टिनची गोळी यानुसार शिफारशी वेगळ्या असू शकतात.',
    referenceTitle: 'तपासण्यासाठी उपयुक्त गोष्टी',
    referenceTips: [
      'माहितीपत्रक हाताशी ठेवा (उदाहरणार्थ, तुमच्या फोनवर फोटो)',
      'झटपट प्रश्न असल्यास औषधविक्रेत्याशी संपर्क साधा',
      'हे वारंवार होत असल्यास डॉक्टरांना भेटा',
    ],
    guideTitle: 'चुकलेल्या गोळीची वेळ महत्त्वाची का आहे?',
    guideText: 'चुकलेली गोळी पाकिटात कुठे येते त्यानुसार काय करावे ते बदलू शकते. म्हणूनच माहितीपत्रक अनेकदा पाकिटाच्या आठवड्यानुसार वेगळ्या शिफारशी देते.',
    body5: 'काय करावे हे माहीत नसल्यास, शंकेत राहण्यापेक्षा सल्ला विचारणे चांगले. औषधविक्रेते, दाई किंवा डॉक्टर तुम्हाला तुमच्या परिस्थितीला जुळणाऱ्या शिफारशी तपासण्यास मदत करू शकतात.',
    questionTitle: 'तयार ठेवायची माहिती',
    questions: [
      'गोळीचा नेमका प्रकार कोणता आहे?',
      'नेहमीच्या वेळेपासून किती वेळ गेला आहे?',
      'किती गोळ्या चुकल्या?',
      'पाकिटाच्या कोणत्या टप्प्यावर गोळी चुकली?',
      'अलीकडे असंरक्षित संबंध झाला आहे का?',
    ],
    proTipTitle: 'हे जाणून घ्या',
    proTipText: 'गोळी चुकण्याच्या सुमारास असंरक्षित संबंध झाला असल्यास, कोणते पर्याय उपलब्ध आहेत हे जाणून घेण्यासाठी तज्ज्ञाचा सल्ला लवकर घ्या.',
    repeatTitle: 'तुमच्या गोळ्या वारंवार चुकत असतील तर',
    body6: 'वारंवार गोळ्या चुकणे हे रोजची दिनचर्या तुमच्या जीवनशैलीशी नीट जुळत नसल्याचे लक्षण असू शकते. इतर गर्भनिरोधक पर्याय शोधण्यासाठी आरोग्य व्यावसायिकाशी बोलायला संकोच करू नका.',
    methodTipTitle: 'वेगळी पद्धत?',
    methodTipText: 'रोज गोळी घेणे सांभाळणे कठीण असल्यास, वेगळ्या वापराच्या वारंवारतेच्या इतर पद्धती अस्तित्वात आहेत.',
    summaryTitle: 'मुख्य मुद्दे',
    summaryItems: [
      'गोळी चुकल्याचे लक्षात येताच प्रतिसाद द्या.',
      'तुमच्या गोळीचा नेमका प्रकार तपासा.',
      'अचूक कृती जाणून घेण्यासाठी माहितीपत्रक तपासा.',
      'माहितीपत्रक शिफारस करत असल्यास पर्यायी संरक्षण वापरा.',
      'शंका असल्यास किंवा धोकादायक संबंधानंतर सल्ला घ्या.',
    ],
    finalTipTitle: 'मुख्य मुद्दे',
    finalTipText: 'गोळी चुकली म्हणजे तुमचे गर्भनिरोधन आपोआप काम करणे थांबले असे नाही. योग्य कृती गोळीच्या प्रकारावर आणि चुकलेल्या मात्रेच्या परिस्थितीवर अवलंबून असते. शंका असल्यास, माहितीपत्रक तपासा आणि लवकर सल्ला घ्या.',
    disclaimerText: 'हा लेख फक्त माहितीसाठी दिला आहे आणि तुमच्या औषधाच्या माहितीपत्रकाची किंवा वैयक्तिक वैद्यकीय सल्ल्याची जागा घेत नाही. गोळीच्या प्रकारानुसार शिफारशी बदलू शकतात.',
  },
  gu: {
    shareMessage: 'ચૂકેલી ગોળી: શું કરવું? — AWA',
    badge: 'ચૂકેલી ગોળી',
    title: 'ચૂકેલી ગોળી:\nશું કરવું?',
    metaDuration: '7 મિનિટ વાંચન',
    metaType: 'વારંવાર પૂછાતા પ્રશ્નો',
    metaLevel: 'મધ્યમ સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'ગોળી ચૂકી જવી કોઈની સાથે પણ થઈ શકે છે. શું કરવું તે મુખ્યત્વે તમે કેટલા સમય પહેલાં ગોળી ચૂકી, ગોળીનો પ્રકાર અને પેકમાં ક્યારે થયું તેના પર આધાર રાખે છે.',
    importantTitle: 'મુખ્ય મુદ્દો',
    importantText: 'ગભરાશો નહીં. પહેલા તમારી ગોળીનો ચોક્કસ પ્રકાર તપાસો અને ભલામણ કરેલ પગલું જાણવા માટે તેની સાથેની માહિતી પત્રિકા જુઓ.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      '12 કલાકથી ઓછું મોડું',
      '12 કલાકથી વધુ મોડું',
      'વધારાનું ધ્યાન માગતી પરિસ્થિતિઓ',
      'માહિતી પત્રિકા તમારો આધાર છે',
      'સલાહ ક્યારે લેવી',
      'મુખ્ય મુદ્દા',
    ],
    body1: 'કેટલીક ગોળીઓ માટે 12 કલાકથી ઓછું મોડું થાય તો સામાન્ય રીતે ગર્ભનિરોધક રક્ષણ ઘટતું નથી. આ કિસ્સામાં સામાન્ય ભલામણ એ છે કે ચૂકેલી ગોળી બને તેટલી વહેલી લઈ લો અને પછી પેક રોજના સમયે ચાલુ રાખો.',
    step1Title: 'ગોળી લો',
    step1Text: 'મોડું થયું છે એવું ધ્યાનમાં આવે કે તરત ગોળી લો.',
    step2Title: 'રાબેતા મુજબ ચાલુ રાખો',
    step2Text: 'પછી આગળની ગોળીઓ માટે તમારા સામાન્ય સમયપત્રક પર પાછા ફરો.',
    tip1Title: 'જાણવા જેવું',
    tip1Text: 'જો તમે ચૂકેલી ગોળી લો અને પછી નિયત સમયે બીજી ગોળી લો, તો એક જ દિવસે બે ગોળી લેવાઈ શકે છે.',
    body2: 'જ્યારે મોડું તમારી ગોળી માટે માન્ય સમય કરતાં વધી જાય, ત્યારે રક્ષણ ઘટી શકે છે. ત્યારે શું કરવું તે ગોળીના પ્રકાર, ચૂકેલી ગોળીઓની સંખ્યા અને પેકમાં ચૂકેલી ગોળી ક્યાં આવે છે તેના પર આધાર રાખે છે.',
    alertTitle: 'ચેતવણી',
    alertText: 'અહીં આપેલા કલાકોની સંખ્યા પર જ આધાર ન રાખો: કેટલીક ગોળીઓની સૂચનાઓ અલગ હોય છે. હંમેશાં તમારી દવાની માહિતી પત્રિકા તપાસો.',
    reflexesTitle: 'સૌથી પહેલા શું કરવું',
    checkPoints: [
      {title: 'ઝડપથી પગલાં લો', text: 'ગોળી ચૂકી ગયાનું ધ્યાનમાં આવ્યા પછી તમે જેટલી ઝડપથી પગલાં લો, તેટલી યોગ્ય ભલામણોનું પાલન કરવું સરળ બને છે.'},
      {title: 'માહિતી પત્રિકા તપાસો', text: 'ગોળીના ચોક્કસ પ્રકાર અને ચૂકેલી ગોળીઓની સંખ્યા પ્રમાણે સૂચનાઓ અલગ હોઈ શકે છે.'},
      {title: 'વધારાના રક્ષણનું આયોજન કરો', text: 'કેટલીક પરિસ્થિતિઓમાં ચોક્કસ સમય માટે કોન્ડોમની ભલામણ થઈ શકે છે.'},
    ],
    body3: 'બધી પરિસ્થિતિઓ સરખી હોતી નથી. કેટલીક ચૂકેલી ગોળીઓમાં ભલામણોને વધુ ચોકસાઈથી તપાસવાની જરૂર પડે છે.',
    situations: [
      {title: 'માત્ર એક ગોળી ચૂકી', text: 'શું કરવું તે મુખ્યત્વે ગોળી લેવાના નિયત સમય પછી કેટલો સમય વીત્યો છે તેના પર આધાર રાખે છે.'},
      {title: 'એક કરતાં વધુ ગોળી ચૂકી', text: 'આ પરિસ્થિતિમાં ખાસ ધ્યાનની જરૂર છે, અને માહિતી પત્રિકા ચોકસાઈથી તપાસવી સારી.'},
      {title: 'શું કરવું તેની ખબર નથી', text: 'ફાર્માસિસ્ટ અથવા આરોગ્ય વ્યાવસાયિક તમને યોગ્ય પગલું ઝડપથી ઓળખવામાં મદદ કરી શકે છે.'},
    ],
    body4: 'તમારી ગોળીની માહિતી પત્રિકામાં તમે લો છો તે દવા માટેની ચોક્કસ સૂચનાઓ હોય છે. સંયુક્ત ગોળી છે કે માત્ર પ્રોજેસ્ટિનવાળી ગોળી, તે પ્રમાણે ભલામણો અલગ હોઈ શકે છે.',
    referenceTitle: 'તપાસવા જેવી ઉપયોગી બાબતો',
    referenceTips: [
      'માહિતી પત્રિકા હાથવગી રાખો (દાખલા તરીકે ફોનમાં ફોટો)',
      'કોઈ ઝડપી પ્રશ્ન હોય તો ફાર્માસિસ્ટનો સંપર્ક કરો',
      'જો આવું વારંવાર થતું હોય તો ડૉક્ટરને મળો',
    ],
    guideTitle: 'ચૂકેલી ગોળીનો સમય કેમ મહત્ત્વનો છે?',
    guideText: 'ગોળી પેકમાં ક્યારે ચૂકાઈ છે તે શું કરવું તે બદલી શકે છે. એટલે જ માહિતી પત્રિકા ઘણી વાર પેકના અઠવાડિયા પ્રમાણે અલગ ભલામણો આપે છે.',
    body5: 'જો શું કરવું તે ખબર ન હોય, તો શંકામાં રહેવા કરતાં સલાહ લેવી વધુ સારી. ફાર્માસિસ્ટ, મિડવાઇફ અથવા ડૉક્ટર તમારી પરિસ્થિતિને અનુરૂપ ભલામણો તપાસવામાં મદદ કરી શકે છે.',
    questionTitle: 'તૈયાર રાખવાની માહિતી',
    questions: [
      'ગોળીનો ચોક્કસ પ્રકાર કયો છે?',
      'નિયત સમય પછી કેટલો સમય વીત્યો છે?',
      'કેટલી ગોળીઓ ચૂકાઈ છે?',
      'પેકના કયા તબક્કે ગોળી ચૂકાઈ?',
      'તાજેતરમાં અસુરક્ષિત સમાગમ થયો છે?',
    ],
    proTipTitle: 'જાણવા જેવું',
    proTipText: 'જો ગોળી ચૂકાઈ તે સમયની આસપાસ અસુરક્ષિત સમાગમ થયો હોય, તો કયા વિકલ્પો ઉપલબ્ધ છે તે જાણવા માટે નિષ્ણાતની સલાહ ઝડપથી લો.',
    repeatTitle: 'જો તમે વારંવાર ગોળી ચૂકતા હો',
    body6: 'વારંવાર ગોળી ચૂકી જવી એ સંકેત હોઈ શકે કે રોજિંદી ટેવ તમારી જીવનશૈલી સાથે બરાબર બંધબેસતી નથી. અન્ય ગર્ભનિરોધક વિકલ્પો જાણવા માટે આરોગ્ય વ્યાવસાયિક સાથે વાત કરતાં અચકાશો નહીં.',
    methodTipTitle: 'અલગ પદ્ધતિ?',
    methodTipText: 'જો રોજ ગોળી લેવાનું જાળવવું મુશ્કેલ લાગે, તો ઉપયોગની અલગ આવૃત્તિવાળી બીજી પદ્ધતિઓ ઉપલબ્ધ છે.',
    summaryTitle: 'મુખ્ય સારાંશ',
    summaryItems: [
      'ગોળી ચૂકી ગયાનું ધ્યાનમાં આવે કે તરત પગલાં લો.',
      'તમારી ગોળીનો ચોક્કસ પ્રકાર તપાસો.',
      'ચોક્કસ પગલું જાણવા માટે માહિતી પત્રિકા તપાસો.',
      'જો માહિતી પત્રિકા ભલામણ કરે તો વધારાનું રક્ષણ વાપરો.',
      'શંકા હોય અથવા જોખમી સમાગમ પછી સલાહ લો.',
    ],
    finalTipTitle: 'મુખ્ય મુદ્દા',
    finalTipText: 'ચૂકેલી ગોળીનો અર્થ આપોઆપ એવો નથી કે તમારું ગર્ભનિરોધન કામ કરતું બંધ થઈ ગયું છે. યોગ્ય પગલું ગોળીના પ્રકાર અને ગોળી ચૂકાયાના સંજોગો પર આધાર રાખે છે. શંકા હોય તો માહિતી પત્રિકા તપાસો અને ઝડપથી સલાહ લો.',
    disclaimerText: 'આ લેખ માત્ર માહિતી માટે આપેલ છે અને તમારી દવાની માહિતી પત્રિકા અથવા વ્યક્તિગત તબીબી સલાહનું સ્થાન લેતો નથી. ગોળીના પ્રકાર પ્રમાણે ભલામણો અલગ હોઈ શકે છે.',
  },
  pa: {
    shareMessage: 'ਛੁੱਟੀ ਹੋਈ ਗੋਲੀ: ਕੀ ਕਰੀਏ? — AWA',
    badge: 'ਛੁੱਟੀ ਹੋਈ ਗੋਲੀ',
    title: 'ਛੁੱਟੀ ਹੋਈ ਗੋਲੀ:\nਕੀ ਕਰੀਏ?',
    metaDuration: '7 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ',
    metaLevel: 'ਦਰਮਿਆਨਾ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਗੋਲੀ ਲੈਣੀ ਭੁੱਲ ਜਾਣਾ ਕਿਸੇ ਨਾਲ ਵੀ ਹੋ ਸਕਦਾ ਹੈ। ਕੀ ਕਰਨਾ ਹੈ, ਇਹ ਮੁੱਖ ਤੌਰ \'ਤੇ ਇਸ ਗੱਲ \'ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ ਕਿ ਗੋਲੀ ਕਿੰਨੀ ਦੇਰ ਪਹਿਲਾਂ ਛੁੱਟੀ, ਗੋਲੀ ਦੀ ਕਿਸਮ ਕੀ ਹੈ, ਅਤੇ ਇਹ ਪੱਤੇ ਦੇ ਕਿਹੜੇ ਸਮੇਂ ਵਿੱਚ ਹੋਇਆ।',
    importantTitle: 'ਮੁੱਖ ਗੱਲ',
    importantText: 'ਘਬਰਾਓ ਨਾ। ਪਹਿਲਾਂ ਆਪਣੀ ਗੋਲੀ ਦੀ ਸਹੀ ਕਿਸਮ ਦੇਖੋ ਅਤੇ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੇ ਕਦਮ ਜਾਣਨ ਲਈ ਉਸ ਦੇ ਪੈਕੇਜ ਵਿੱਚ ਦਿੱਤੀ ਜਾਣਕਾਰੀ-ਪਰਚੀ ਪੜ੍ਹੋ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      '12 ਘੰਟਿਆਂ ਤੋਂ ਘੱਟ ਦੇਰੀ',
      '12 ਘੰਟਿਆਂ ਤੋਂ ਵੱਧ ਦੇਰੀ',
      'ਵਾਧੂ ਧਿਆਨ ਮੰਗਣ ਵਾਲੀਆਂ ਸਥਿਤੀਆਂ',
      'ਜਾਣਕਾਰੀ-ਪਰਚੀ ਤੁਹਾਡਾ ਆਧਾਰ ਹੈ',
      'ਸਲਾਹ ਕਦੋਂ ਲੈਣੀ ਹੈ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    body1: 'ਕੁਝ ਗੋਲੀਆਂ ਲਈ, 12 ਘੰਟਿਆਂ ਤੋਂ ਘੱਟ ਦੀ ਦੇਰੀ ਆਮ ਤੌਰ \'ਤੇ ਗਰਭ ਨਿਰੋਧਕ ਸੁਰੱਖਿਆ ਨੂੰ ਪ੍ਰਭਾਵਿਤ ਨਹੀਂ ਕਰਦੀ। ਇਸ ਸਥਿਤੀ ਵਿੱਚ ਆਮ ਸਿਫ਼ਾਰਸ਼ ਇਹ ਹੁੰਦੀ ਹੈ ਕਿ ਛੁੱਟੀ ਹੋਈ ਗੋਲੀ ਜਲਦੀ ਤੋਂ ਜਲਦੀ ਲੈ ਲਓ ਅਤੇ ਫਿਰ ਪੱਤਾ ਆਮ ਸਮੇਂ \'ਤੇ ਜਾਰੀ ਰੱਖੋ।',
    step1Title: 'ਗੋਲੀ ਲਓ',
    step1Text: 'ਜਿਵੇਂ ਹੀ ਤੁਹਾਨੂੰ ਪਤਾ ਲੱਗੇ ਕਿ ਦੇਰ ਹੋ ਗਈ ਹੈ, ਗੋਲੀ ਲੈ ਲਓ।',
    step2Title: 'ਆਮ ਵਾਂਗ ਜਾਰੀ ਰੱਖੋ',
    step2Text: 'ਫਿਰ ਅਗਲੀਆਂ ਗੋਲੀਆਂ ਲਈ ਆਪਣੇ ਆਮ ਸਮੇਂ \'ਤੇ ਵਾਪਸ ਆ ਜਾਓ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text: 'ਜੇ ਤੁਸੀਂ ਛੁੱਟੀ ਹੋਈ ਗੋਲੀ ਲੈਂਦੇ ਹੋ ਅਤੇ ਫਿਰ ਆਮ ਸਮੇਂ ਵਾਲੀ ਗੋਲੀ ਵੀ ਲੈਂਦੇ ਹੋ, ਤਾਂ ਹੋ ਸਕਦਾ ਹੈ ਕਿ ਇੱਕੋ ਦਿਨ ਦੋ ਗੋਲੀਆਂ ਲਈਆਂ ਜਾਣ।',
    body2: 'ਜਦੋਂ ਦੇਰੀ ਤੁਹਾਡੀ ਗੋਲੀ ਲਈ ਮਨਜ਼ੂਰ ਸਮੇਂ ਤੋਂ ਵੱਧ ਹੋ ਜਾਵੇ, ਤਾਂ ਸੁਰੱਖਿਆ ਘੱਟ ਹੋ ਸਕਦੀ ਹੈ। ਫਿਰ ਕੀ ਕਰਨਾ ਹੈ, ਇਹ ਗੋਲੀ ਦੀ ਕਿਸਮ, ਛੁੱਟੀਆਂ ਗੋਲੀਆਂ ਦੀ ਗਿਣਤੀ ਅਤੇ ਪੱਤੇ ਵਿੱਚ ਛੁੱਟੀ ਹੋਈ ਗੋਲੀ ਦੀ ਥਾਂ \'ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ।',
    alertTitle: 'ਚੇਤਾਵਨੀ',
    alertText: 'ਇੱਥੇ ਦੱਸੇ ਘੰਟਿਆਂ ਦੀ ਗਿਣਤੀ \'ਤੇ ਹੀ ਨਿਰਭਰ ਨਾ ਰਹੋ: ਕੁਝ ਗੋਲੀਆਂ ਦੀਆਂ ਹਦਾਇਤਾਂ ਵੱਖਰੀਆਂ ਹੁੰਦੀਆਂ ਹਨ। ਹਮੇਸ਼ਾ ਆਪਣੀ ਦਵਾਈ ਦੀ ਜਾਣਕਾਰੀ-ਪਰਚੀ ਦੇਖੋ।',
    reflexesTitle: 'ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਕੀ ਕਰਨਾ ਹੈ',
    checkPoints: [
      {title: 'ਜਲਦੀ ਕਦਮ ਚੁੱਕੋ', text: 'ਗੋਲੀ ਛੁੱਟਣ ਦਾ ਪਤਾ ਲੱਗਣ ਤੋਂ ਬਾਅਦ ਜਿੰਨੀ ਜਲਦੀ ਤੁਸੀਂ ਕਦਮ ਚੁੱਕਦੇ ਹੋ, ਢੁਕਵੀਆਂ ਸਿਫ਼ਾਰਸ਼ਾਂ \'ਤੇ ਅਮਲ ਕਰਨਾ ਓਨਾ ਹੀ ਸੌਖਾ ਹੁੰਦਾ ਹੈ।'},
      {title: 'ਜਾਣਕਾਰੀ-ਪਰਚੀ ਦੇਖੋ', text: 'ਗੋਲੀ ਦੀ ਸਹੀ ਕਿਸਮ ਅਤੇ ਛੁੱਟੀਆਂ ਗੋਲੀਆਂ ਦੀ ਗਿਣਤੀ ਮੁਤਾਬਕ ਹਦਾਇਤਾਂ ਵੱਖ-ਵੱਖ ਹੋ ਸਕਦੀਆਂ ਹਨ।'},
      {title: 'ਵਾਧੂ ਸੁਰੱਖਿਆ ਬਾਰੇ ਸੋਚੋ', text: 'ਕੁਝ ਸਥਿਤੀਆਂ ਵਿੱਚ, ਕੁਝ ਸਮੇਂ ਲਈ ਕੰਡੋਮ ਵਰਤਣ ਦੀ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ।'},
    ],
    body3: 'ਸਾਰੀਆਂ ਸਥਿਤੀਆਂ ਇੱਕੋ ਜਿਹੀਆਂ ਨਹੀਂ ਹੁੰਦੀਆਂ। ਕੁਝ ਛੁੱਟੀਆਂ ਗੋਲੀਆਂ ਵਿੱਚ ਸਿਫ਼ਾਰਸ਼ਾਂ ਨੂੰ ਵਧੇਰੇ ਬਾਰੀਕੀ ਨਾਲ ਦੇਖਣ ਦੀ ਲੋੜ ਹੁੰਦੀ ਹੈ।',
    situations: [
      {title: 'ਸਿਰਫ਼ ਇੱਕ ਗੋਲੀ ਛੁੱਟੀ', text: 'ਕੀ ਕਰਨਾ ਹੈ, ਇਹ ਮੁੱਖ ਤੌਰ \'ਤੇ ਇਸ ਗੱਲ \'ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ ਕਿ ਗੋਲੀ ਲੈਣ ਦੇ ਆਮ ਸਮੇਂ ਤੋਂ ਕਿੰਨਾ ਸਮਾਂ ਲੰਘ ਚੁੱਕਾ ਹੈ।'},
      {title: 'ਇੱਕ ਤੋਂ ਵੱਧ ਗੋਲੀਆਂ ਛੁੱਟੀਆਂ', text: 'ਇਸ ਸਥਿਤੀ ਵਿੱਚ ਖ਼ਾਸ ਧਿਆਨ ਦੀ ਲੋੜ ਹੈ, ਅਤੇ ਜਾਣਕਾਰੀ-ਪਰਚੀ ਨੂੰ ਧਿਆਨ ਨਾਲ ਦੇਖਣਾ ਬਿਹਤਰ ਹੈ।'},
      {title: 'ਪਤਾ ਨਹੀਂ ਕੀ ਕਰਨਾ ਹੈ', text: 'ਕੋਈ ਫਾਰਮਾਸਿਸਟ ਜਾਂ ਸਿਹਤ ਮਾਹਿਰ ਸਹੀ ਕਦਮ ਪਛਾਣਨ ਵਿੱਚ ਤੁਹਾਡੀ ਜਲਦੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ।'},
    ],
    body4: 'ਤੁਹਾਡੀ ਗੋਲੀ ਦੀ ਜਾਣਕਾਰੀ-ਪਰਚੀ ਵਿੱਚ ਤੁਹਾਡੇ ਵੱਲੋਂ ਲਈ ਜਾ ਰਹੀ ਦਵਾਈ ਲਈ ਸਹੀ ਹਦਾਇਤਾਂ ਦਿੱਤੀਆਂ ਹੁੰਦੀਆਂ ਹਨ। ਸਿਫ਼ਾਰਸ਼ਾਂ ਇਸ ਮੁਤਾਬਕ ਵੱਖ ਹੋ ਸਕਦੀਆਂ ਹਨ ਕਿ ਇਹ ਸੰਯੁਕਤ ਗੋਲੀ ਹੈ ਜਾਂ ਸਿਰਫ਼ ਪ੍ਰੋਜੈਸਟੀਨ ਵਾਲੀ ਗੋਲੀ।',
    referenceTitle: 'ਦੇਖਣ ਯੋਗ ਲਾਭਦਾਇਕ ਗੱਲਾਂ',
    referenceTips: [
      'ਜਾਣਕਾਰੀ-ਪਰਚੀ ਹੱਥ ਦੇ ਨੇੜੇ ਰੱਖੋ (ਜਿਵੇਂ ਫ਼ੋਨ ਵਿੱਚ ਇਸ ਦੀ ਫ਼ੋਟੋ)',
      'ਜੇ ਕੋਈ ਛੋਟਾ ਸਵਾਲ ਹੈ ਤਾਂ ਫਾਰਮਾਸਿਸਟ ਨਾਲ ਸੰਪਰਕ ਕਰੋ',
      'ਜੇ ਇਹ ਅਕਸਰ ਹੁੰਦਾ ਹੈ ਤਾਂ ਡਾਕਟਰ ਨੂੰ ਮਿਲੋ',
    ],
    guideTitle: 'ਗੋਲੀ ਛੁੱਟਣ ਦਾ ਸਮਾਂ ਕਿਉਂ ਮਾਇਨੇ ਰੱਖਦਾ ਹੈ?',
    guideText: 'ਪੱਤੇ ਦੇ ਕਿਸ ਸਮੇਂ ਗੋਲੀ ਛੁੱਟਦੀ ਹੈ, ਇਹ ਕਰਨ ਵਾਲੀ ਗੱਲ ਨੂੰ ਬਦਲ ਸਕਦਾ ਹੈ। ਇਸੇ ਲਈ ਜਾਣਕਾਰੀ-ਪਰਚੀ ਵਿੱਚ ਅਕਸਰ ਪੱਤੇ ਦੇ ਹਫ਼ਤੇ ਮੁਤਾਬਕ ਵੱਖ-ਵੱਖ ਸਿਫ਼ਾਰਸ਼ਾਂ ਦਿੱਤੀਆਂ ਹੁੰਦੀਆਂ ਹਨ।',
    body5: 'ਜੇ ਤੁਹਾਨੂੰ ਪਤਾ ਨਹੀਂ ਕਿ ਕੀ ਕਰਨਾ ਹੈ, ਤਾਂ ਸ਼ੱਕ ਵਿੱਚ ਰਹਿਣ ਨਾਲੋਂ ਸਲਾਹ ਲੈਣੀ ਬਿਹਤਰ ਹੈ। ਫਾਰਮਾਸਿਸਟ, ਮਿਡਵਾਈਫ਼ ਜਾਂ ਡਾਕਟਰ ਤੁਹਾਡੀ ਸਥਿਤੀ ਮੁਤਾਬਕ ਢੁਕਵੀਆਂ ਸਿਫ਼ਾਰਸ਼ਾਂ ਦੇਖਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੇ ਹਨ।',
    questionTitle: 'ਤਿਆਰ ਰੱਖਣ ਵਾਲੀ ਜਾਣਕਾਰੀ',
    questions: [
      'ਇਹ ਸਹੀ ਕਿਸ ਕਿਸਮ ਦੀ ਗੋਲੀ ਹੈ?',
      'ਆਮ ਸਮੇਂ ਤੋਂ ਕਿੰਨਾ ਸਮਾਂ ਲੰਘ ਚੁੱਕਾ ਹੈ?',
      'ਕਿੰਨੀਆਂ ਗੋਲੀਆਂ ਛੁੱਟੀਆਂ ਹਨ?',
      'ਪੱਤੇ ਦੇ ਕਿਸ ਸਮੇਂ ਗੋਲੀ ਛੁੱਟੀ?',
      'ਕੀ ਹਾਲ ਹੀ ਵਿੱਚ ਬਿਨਾਂ ਸੁਰੱਖਿਆ ਦੇ ਸਰੀਰਕ ਸਬੰਧ ਬਣੇ ਹਨ?',
    ],
    proTipTitle: 'ਜਾਣਨ ਯੋਗ',
    proTipText: 'ਜੇ ਗੋਲੀ ਛੁੱਟਣ ਦੇ ਆਸ-ਪਾਸ ਬਿਨਾਂ ਸੁਰੱਖਿਆ ਦੇ ਸਰੀਰਕ ਸਬੰਧ ਬਣੇ ਹੋਣ, ਤਾਂ ਕਿਹੜੇ ਵਿਕਲਪ ਉਪਲਬਧ ਹਨ ਇਹ ਜਾਣਨ ਲਈ ਕਿਸੇ ਮਾਹਿਰ ਤੋਂ ਜਲਦੀ ਸਲਾਹ ਲਓ।',
    repeatTitle: 'ਜੇ ਗੋਲੀਆਂ ਵਾਰ-ਵਾਰ ਛੁੱਟਦੀਆਂ ਹਨ',
    body6: 'ਵਾਰ-ਵਾਰ ਗੋਲੀਆਂ ਛੁੱਟਣਾ ਇਸ ਗੱਲ ਦਾ ਸੰਕੇਤ ਹੋ ਸਕਦਾ ਹੈ ਕਿ ਰੋਜ਼ਾਨਾ ਦੀ ਇਹ ਆਦਤ ਤੁਹਾਡੀ ਜੀਵਨ-ਸ਼ੈਲੀ ਨਾਲ ਪੂਰੀ ਤਰ੍ਹਾਂ ਮੇਲ ਨਹੀਂ ਖਾਂਦੀ। ਹੋਰ ਗਰਭ ਨਿਰੋਧਕ ਵਿਕਲਪਾਂ ਬਾਰੇ ਜਾਣਨ ਲਈ ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰਨ ਤੋਂ ਨਾ ਝਿਜਕੋ।',
    methodTipTitle: 'ਕੋਈ ਹੋਰ ਤਰੀਕਾ?',
    methodTipText: 'ਜੇ ਹਰ ਰੋਜ਼ ਗੋਲੀ ਲੈਣਾ ਨਿਭਾਉਣਾ ਔਖਾ ਹੈ, ਤਾਂ ਵੱਖਰੀ ਵਰਤੋਂ-ਵਾਰਵਾਰਤਾ ਵਾਲੇ ਹੋਰ ਤਰੀਕੇ ਵੀ ਮੌਜੂਦ ਹਨ।',
    summaryTitle: 'ਮੁੱਖ ਗੱਲਾਂ',
    summaryItems: [
      'ਗੋਲੀ ਛੁੱਟਣ ਦਾ ਪਤਾ ਲੱਗਦੇ ਹੀ ਕਦਮ ਚੁੱਕੋ।',
      'ਆਪਣੀ ਗੋਲੀ ਦੀ ਸਹੀ ਕਿਸਮ ਦੇਖੋ।',
      'ਸਹੀ ਕਦਮ ਜਾਣਨ ਲਈ ਜਾਣਕਾਰੀ-ਪਰਚੀ ਦੇਖੋ।',
      'ਜੇ ਜਾਣਕਾਰੀ-ਪਰਚੀ ਸਿਫ਼ਾਰਸ਼ ਕਰਦੀ ਹੈ ਤਾਂ ਵਾਧੂ ਸੁਰੱਖਿਆ ਵਰਤੋ।',
      'ਸ਼ੱਕ ਹੋਵੇ ਜਾਂ ਜੋਖ਼ਮ ਵਾਲੇ ਸਬੰਧ ਤੋਂ ਬਾਅਦ ਸਲਾਹ ਲਓ।',
    ],
    finalTipTitle: 'ਮੁੱਖ ਨੁਕਤੇ',
    finalTipText: 'ਗੋਲੀ ਛੁੱਟ ਜਾਣ ਦਾ ਮਤਲਬ ਆਪਣੇ-ਆਪ ਇਹ ਨਹੀਂ ਕਿ ਤੁਹਾਡਾ ਗਰਭ ਨਿਰੋਧ ਕੰਮ ਕਰਨਾ ਬੰਦ ਕਰ ਗਿਆ ਹੈ। ਸਹੀ ਕਦਮ ਗੋਲੀ ਦੀ ਕਿਸਮ ਅਤੇ ਖ਼ੁਰਾਕ ਛੁੱਟਣ ਦੇ ਹਾਲਾਤ \'ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ। ਸ਼ੱਕ ਹੋਵੇ ਤਾਂ ਜਾਣਕਾਰੀ-ਪਰਚੀ ਦੇਖੋ ਅਤੇ ਜਲਦੀ ਸਲਾਹ ਲਓ।',
    disclaimerText: 'ਇਹ ਲੇਖ ਸਿਰਫ਼ ਜਾਣਕਾਰੀ ਲਈ ਹੈ ਅਤੇ ਤੁਹਾਡੀ ਦਵਾਈ ਦੀ ਜਾਣਕਾਰੀ-ਪਰਚੀ ਜਾਂ ਨਿੱਜੀ ਡਾਕਟਰੀ ਸਲਾਹ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦਾ। ਸਿਫ਼ਾਰਸ਼ਾਂ ਗੋਲੀ ਦੀ ਕਿਸਮ ਮੁਤਾਬਕ ਵੱਖ ਹੋ ਸਕਦੀਆਂ ਹਨ।',
  },
  my: {
    shareMessage: 'မေ့သွားသော ဆေးပြား- ဘာလုပ်ရမလဲ။ — AWA',
    badge: 'မေ့သွားသော ဆေးပြား',
    title: 'မေ့သွားသော ဆေးပြား-\nဘာလုပ်ရမလဲ။',
    metaDuration: 'ဖတ်ချိန် 7 မိနစ်',
    metaType: 'မကြာခဏမေးလေ့ရှိသော မေးခွန်းများ',
    metaLevel: 'အလယ်အလတ်အဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'ဆေးပြားမေ့သွားခြင်းသည် မည်သူ့တွင်မဆို ဖြစ်နိုင်သည်။ ဘာလုပ်ရမည်ကို အဓိကအားဖြင့် မေ့သွားသည်မှ ဘယ်လောက်ကြာပြီလဲ၊ ဆေးပြားအမျိုးအစား၊ ဆေးပြားထုပ်၏ မည်သည့်နေရာတွင် ဖြစ်သည်ဆိုသည့်အချက်များပေါ် မူတည်သည်။',
    importantTitle: 'အဓိကအချက်',
    importantText: 'မထိတ်လန့်ပါနှင့်။ ဦးစွာ သင့်ဆေးပြား၏ အမျိုးအစားအတိအကျကို စစ်ဆေးပြီး အကြံပြုထားသော လုပ်ဆောင်ရမည့်အချက်ကို သိရှိရန် ဆေးအထုပ်ထဲရှိ လမ်းညွှန်စာရွက်ကို ကြည့်ပါ။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      '12 နာရီထက် နည်း နောက်ကျခြင်း',
      '12 နာရီထက် ပို၍ နောက်ကျခြင်း',
      'အထူးဂရုစိုက်ရန် လိုအပ်သော အခြေအနေများ',
      'ဆေးအထုပ်ထဲရှိ လမ်းညွှန်စာရွက်သည် သင့်ကိုးကားချက်ဖြစ်သည်',
      'အကြံဉာဏ်မည်သည့်အခါ တောင်းသင့်သလဲ',
      'အဓိကအချက်များ',
    ],
    body1: 'ဆေးပြားအချို့အတွက် 12 နာရီထက်နည်းသော နောက်ကျမှုသည် ယေဘုယျအားဖြင့် ကိုယ်ဝန်တားဆီးမှုကို မထိခိုက်ပါ။ ဤအခြေအနေတွင် ပုံမှန်အကြံပြုချက်မှာ မေ့သွားသော ဆေးပြားကို တတ်နိုင်သမျှ အမြန်သောက်ပြီး ဆေးပြားထုပ်ကို ပုံမှန်အချိန်တွင် ဆက်သောက်ရန်ဖြစ်သည်။',
    step1Title: 'ဆေးပြားကို သောက်ပါ',
    step1Text: 'နောက်ကျနေကြောင်း သတိထားမိသည်နှင့် ဆေးပြားကို သောက်ပါ။',
    step2Title: 'ပုံမှန်အတိုင်း ဆက်လုပ်ပါ',
    step2Text: 'ထို့နောက် နောက်ဆက်တွဲ ဆေးပြားများအတွက် သင့်ပုံမှန်အချိန်ဇယားသို့ ပြန်သွားပါ။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text: 'မေ့သွားသော ဆေးပြားကို သောက်ပြီးနောက် ပုံမှန်အချိန်သတ်မှတ်ထားသော ဆေးပြားကိုပါ သောက်လျှင် တစ်နေ့တည်းတွင် ဆေးပြားနှစ်လုံး သောက်မိနိုင်သည်။',
    body2: 'နောက်ကျမှုသည် သင့်ဆေးပြားအတွက် ခွင့်ပြုထားသော အချိန်ထက် ကျော်လွန်သောအခါ ကာကွယ်မှု လျော့နည်းနိုင်သည်။ ထိုအခါ ဘာလုပ်ရမည်ဆိုသည်မှာ ဆေးပြားအမျိုးအစား၊ မေ့သွားသော ဆေးပြားအရေအတွက်နှင့် ဆေးပြားထုပ်၏ မည်သည့်နေရာတွင် မေ့သွားသည်ဆိုသည့်အချက်များပေါ် မူတည်သည်။',
    alertTitle: 'သတိပေးချက်',
    alertText: 'ဤနေရာတွင် ပေးထားသော နာရီအရေအတွက်ကိုသာ အားမကိုးပါနှင့်- ဆေးပြားအချို့တွင် ညွှန်ကြားချက်များ ကွဲပြားသည်။ သင့်ဆေး၏ လမ်းညွှန်စာရွက်ကို အမြဲစစ်ဆေးပါ။',
    reflexesTitle: 'ပထမဆုံး လုပ်ဆောင်ရန်များ',
    checkPoints: [
      {title: 'အမြန်တုံ့ပြန်ပါ', text: 'ဆေးပြားမေ့သွားသည်ကို သတိထားမိပြီးနောက် ပိုမြန်မြန်တုံ့ပြန်လေ သင့်လျော်သော အကြံပြုချက်များကို လိုက်နာရန် ပိုလွယ်လေဖြစ်သည်။'},
      {title: 'လမ်းညွှန်စာရွက်ကို စစ်ဆေးပါ', text: 'ညွှန်ကြားချက်များသည် ဆေးပြား၏ အမျိုးအစားအတိအကျနှင့် မေ့သွားသော ဆေးပြားအရေအတွက်ပေါ် မူတည်၍ ကွဲပြားနိုင်သည်။'},
      {title: 'အရန်ကာကွယ်မှုကို စီစဉ်ပါ', text: 'အခြေအနေအချို့တွင် သတ်မှတ်ကာလတစ်ခုအတွက် ကွန်ဒုံးသုံးရန် အကြံပြုနိုင်သည်။'},
    ],
    body3: 'အခြေအနေအားလုံး မတူပါ။ ဆေးပြားမေ့သွားမှုအချို့သည် အကြံပြုချက်များကို ပိုမိုတိကျစွာ စစ်ဆေးရန် လိုအပ်သည်။',
    situations: [
      {title: 'ဆေးပြားတစ်လုံးသာ မေ့သွားသည်', text: 'ဘာလုပ်ရမည်ဆိုသည်မှာ ပုံမှန်သောက်ရမည့်အချိန်မှ ကုန်ဆုံးသွားသော အချိန်ပေါ် အဓိကမူတည်သည်။'},
      {title: 'ဆေးပြားတစ်လုံးထက်ပို၍ မေ့သွားသည်', text: 'ဤအခြေအနေသည် အထူးဂရုစိုက်ရန် လိုအပ်ပြီး လမ်းညွှန်စာရွက်ကို တိကျစွာ စစ်ဆေးခြင်းက ကောင်းသည်။'},
      {title: 'ဘာလုပ်ရမည်မသေချာပါ', text: 'ဆေးဝါးကျွမ်းကျင်သူ သို့မဟုတ် ကျန်းမာရေးပညာရှင်က မှန်ကန်သော လုပ်ဆောင်ချက်ကို အမြန်ဖော်ထုတ်ရန် ကူညီနိုင်သည်။'},
    ],
    body4: 'သင့်ဆေးပြား၏ လမ်းညွှန်စာရွက်တွင် သင်သောက်နေသော ဆေးအတွက် တိကျသော ညွှန်ကြားချက်များ ပါရှိသည်။ ပေါင်းစပ်ဆေးပြားလား၊ ပရိုဂျက်စတင်သာပါသော ဆေးပြားလားဆိုသည့်အပေါ် မူတည်၍ အကြံပြုချက်များ ကွဲပြားနိုင်သည်။',
    referenceTitle: 'စစ်ဆေးသင့်သော အသုံးဝင်သည့်အချက်များ',
    referenceTips: [
      'လမ်းညွှန်စာရွက်ကို လက်လှမ်းမီရာတွင် ထားပါ (ဥပမာ ဖုန်းထဲတွင် ဓာတ်ပုံရိုက်ထားပါ)',
      'မေးလိုသည်များရှိလျှင် ဆေးဝါးကျွမ်းကျင်သူကို ဆက်သွယ်ပါ',
      'မကြာခဏဖြစ်လျှင် ဆရာဝန်နှင့် ပြသပါ',
    ],
    guideTitle: 'မေ့သွားသော ဆေးပြား၏ အချိန်သည် အဘယ်ကြောင့် အရေးကြီးသလဲ။',
    guideText: 'မေ့သွားသော ဆေးပြားသည် ဆေးပြားထုပ်၏ မည်သည့်နေရာတွင်ရှိသည်က လုပ်ဆောင်ရမည့်အရာကို ပြောင်းလဲစေနိုင်သည်။ ထို့ကြောင့် လမ်းညွှန်စာရွက်တွင် ဆေးပြားထုပ်၏ သီတင်းပတ်အလိုက် မတူညီသော အကြံပြုချက်များ မကြာခဏ ပေးထားသည်။',
    body5: 'ဘာလုပ်ရမည်မသိလျှင် သံသယဖြင့် နေခြင်းထက် အကြံဉာဏ်တောင်းခြင်းက ပိုကောင်းသည်။ ဆေးဝါးကျွမ်းကျင်သူ၊ သားဖွားဆရာမ သို့မဟုတ် ဆရာဝန်က သင့်အခြေအနေနှင့် ကိုက်ညီသော အကြံပြုချက်များကို စစ်ဆေးရန် ကူညီနိုင်သည်။',
    questionTitle: 'ကြိုတင်ပြင်ဆင်ထားသင့်သော အချက်အလက်',
    questions: [
      'ဆေးပြားသည် မည်သည့်အမျိုးအစားအတိအကျ ဖြစ်သနည်း။',
      'ပုံမှန်အချိန်မှ ဘယ်လောက်ကြာပြီလဲ။',
      'ဆေးပြား ဘယ်နှစ်လုံး မေ့သွားသလဲ။',
      'ဆေးပြားထုပ်၏ မည်သည့်အချိန်တွင် မေ့သွားသလဲ။',
      'မကြာသေးမီက ကာကွယ်မှုမပါသော လိင်ဆက်ဆံမှု ရှိခဲ့သလား။',
    ],
    proTipTitle: 'သိထားသင့်သည်',
    proTipText: 'ဆေးပြားမေ့သွားသည့်အချိန်ခန့်တွင် ကာကွယ်မှုမပါသော လိင်ဆက်ဆံမှု ဖြစ်ခဲ့လျှင် မည်သည့်ရွေးချယ်စရာများရှိကြောင်း သိရန် ပညာရှင်ထံ အကြံဉာဏ်ကို အမြန်တောင်းပါ။',
    repeatTitle: 'ဆေးပြားကို ထပ်ခါထပ်ခါ မေ့နေလျှင်',
    body6: 'ဆေးပြားကို မကြာခဏမေ့ခြင်းသည် နေ့စဉ်အလေ့အထသည် သင့်လူနေမှုပုံစံနှင့် မကိုက်ညီကြောင်း ပြနိုင်သည်။ အခြားကိုယ်ဝန်တားဆီးနည်းလမ်းများကို ရှာဖွေရန် ကျန်းမာရေးပညာရှင်နှင့် ပြောဆိုရန် မတွန့်ဆိုင်းပါနှင့်။',
    methodTipTitle: 'မတူသော နည်းလမ်းတစ်ခုလား။',
    methodTipText: 'နေ့တိုင်း ဆေးပြားသောက်ရန် ခက်ခဲလျှင် အသုံးပြုရသည့် အကြိမ်ရေ ကွဲပြားသော အခြားနည်းလမ်းများ ရှိသည်။',
    summaryTitle: 'အဓိကအချက်များ',
    summaryItems: [
      'ဆေးပြားမေ့သွားသည်ကို သတိထားမိသည်နှင့် တုံ့ပြန်ပါ။',
      'သင့်ဆေးပြား၏ အမျိုးအစားအတိအကျကို စစ်ဆေးပါ။',
      'တိကျသော လုပ်ဆောင်ရမည့်အချက်ကို သိရန် လမ်းညွှန်စာရွက်ကို စစ်ဆေးပါ။',
      'လမ်းညွှန်စာရွက်တွင် အကြံပြုထားလျှင် အရန်ကာကွယ်မှု သုံးပါ။',
      'သံသယရှိလျှင် သို့မဟုတ် စွန့်စားရသော ဆက်ဆံမှုတစ်ခုပြီးနောက် အကြံဉာဏ်တောင်းပါ။',
    ],
    finalTipTitle: 'အဓိကအချက်များ',
    finalTipText: 'ဆေးပြားတစ်လုံး မေ့သွားခြင်းသည် သင့်ကိုယ်ဝန်တားဆီးမှု အလုပ်မလုပ်တော့ဟု အလိုအလျောက် မဆိုလိုပါ။ မှန်ကန်သော လုပ်ဆောင်ချက်သည် ဆေးပြားအမျိုးအစားနှင့် မေ့သွားသည့် အခြေအနေများပေါ် မူတည်သည်။ သံသယရှိလျှင် လမ်းညွှန်စာရွက်ကို စစ်ဆေးပြီး အကြံဉာဏ်ကို အမြန်တောင်းပါ။',
    disclaimerText: 'ဤဆောင်းပါးသည် အချက်အလက်ပေးရန်သာ ဖြစ်ပြီး သင့်ဆေး၏ လမ်းညွှန်စာရွက်ကို သို့မဟုတ် ကိုယ်ပိုင်ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်ကို အစားထိုးခြင်းမရှိပါ။ ဆေးပြားအမျိုးအစားပေါ် မူတည်၍ အကြံပြုချက်များ ကွဲပြားနိုင်သည်။',
  },
  km: {
    shareMessage: 'ភ្លេចលេបថ្នាំ៖ ត្រូវធ្វើយ៉ាងណា? — AWA',
    badge: 'ភ្លេចលេបថ្នាំ',
    title: 'ភ្លេចលេបថ្នាំ៖\nត្រូវធ្វើយ៉ាងណា?',
    metaDuration: 'អាន 7 នាទី',
    metaType: 'សំណួរដែលសួរញឹកញាប់',
    metaLevel: 'កម្រិតមធ្យម',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'ការភ្លេចលេបថ្នាំអាចកើតឡើងចំពោះនរណាក៏បាន។ អ្វីដែលត្រូវធ្វើភាគច្រើនអាស្រ័យលើរយៈពេលដែលអ្នកភ្លេច ប្រភេទថ្នាំ និងពេលវេលាក្នុងកញ្ចប់ថ្នាំដែលវាកើតឡើង។',
    importantTitle: 'ចំណុចសំខាន់',
    importantText: 'កុំភ័យ។ ដំបូងត្រូវពិនិត្យប្រភេទថ្នាំរបស់អ្នកឲ្យច្បាស់ ហើយអានខិត្តប័ណ្ណណែនាំក្នុងកញ្ចប់ ដើម្បីដឹងពីវិធីដែលត្រូវធ្វើ។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'យឺតតិចជាង 12 ម៉ោង',
      'យឺតលើសពី 12 ម៉ោង',
      'ស្ថានភាពដែលត្រូវការយកចិត្តទុកដាក់បន្ថែម',
      'ខិត្តប័ណ្ណណែនាំគឺជាឯកសារយោងរបស់អ្នក',
      'ពេលណាត្រូវសុំដំបូន្មាន',
      'ចំណុចសំខាន់ៗ',
    ],
    body1: 'សម្រាប់ថ្នាំមួយចំនួន ការយឺតតិចជាង 12 ម៉ោង ជាទូទៅមិនប៉ះពាល់ដល់ការការពារការមានផ្ទៃពោះឡើយ។ ក្នុងករណីនេះ ការណែនាំទូទៅគឺលេបថ្នាំដែលភ្លេចឲ្យបានលឿនបំផុត ហើយបន្តលេបកញ្ចប់ថ្នាំតាមម៉ោងធម្មតា។',
    step1Title: 'លេបថ្នាំ',
    step1Text: 'លេបថ្នាំភ្លាមៗនៅពេលអ្នកកត់សម្គាល់ថាអ្នកយឺត។',
    step2Title: 'បន្តតាមធម្មតា',
    step2Text: 'បន្ទាប់មកត្រឡប់ទៅកាលវិភាគធម្មតារបស់អ្នកសម្រាប់ថ្នាំគ្រាប់បន្ទាប់។',
    tip1Title: 'គួរដឹង',
    tip1Text: 'ប្រសិនបើអ្នកលេបថ្នាំដែលភ្លេច ហើយបន្ទាប់មកលេបគ្រាប់ដែលកំណត់តាមម៉ោងធម្មតា អាចមានថ្នាំពីរគ្រាប់ត្រូវបានលេបក្នុងថ្ងៃតែមួយ។',
    body2: 'នៅពេលដែលការយឺតលើសពីរយៈពេលដែលអនុញ្ញាតសម្រាប់ថ្នាំរបស់អ្នក ការការពារអាចថយចុះ។ អ្វីដែលត្រូវធ្វើបន្ទាប់អាស្រ័យលើប្រភេទថ្នាំ ចំនួនគ្រាប់ដែលភ្លេច និងទីតាំងនៃគ្រាប់ដែលភ្លេចក្នុងកញ្ចប់។',
    alertTitle: 'ការព្រមាន',
    alertText: 'កុំពឹងផ្អែកតែលើចំនួនម៉ោងដែលបានផ្តល់នៅទីនេះ៖ ថ្នាំមួយចំនួនមានការណែនាំខុសគ្នា។ សូមពិនិត្យខិត្តប័ណ្ណណែនាំរបស់ថ្នាំអ្នកជានិច្ច។',
    reflexesTitle: 'អ្វីដែលត្រូវធ្វើមុនគេ',
    checkPoints: [
      {title: 'ឆ្លើយតបឲ្យបានលឿន', text: 'កាលណាអ្នកឆ្លើយតបលឿនបន្ទាប់ពីកត់សម្គាល់ថាភ្លេចលេបថ្នាំ កាន់តែងាយស្រួលក្នុងការអនុវត្តតាមការណែនាំសមស្រប។'},
      {title: 'ពិនិត្យខិត្តប័ណ្ណណែនាំ', text: 'ការណែនាំអាចខុសគ្នាអាស្រ័យលើប្រភេទថ្នាំពិតប្រាកដ និងចំនួនគ្រាប់ដែលភ្លេច។'},
      {title: 'រៀបចំការការពារបម្រុង', text: 'ក្នុងស្ថានភាពខ្លះ អាចណែនាំឲ្យប្រើស្រោមអនាម័យក្នុងរយៈពេលជាក់លាក់មួយ។'},
    ],
    body3: 'ស្ថានភាពទាំងអស់មិនដូចគ្នាទេ។ ការភ្លេចលេបថ្នាំខ្លះតម្រូវឲ្យពិនិត្យការណែនាំឲ្យបានច្បាស់លាស់ជាងមុន។',
    situations: [
      {title: 'ភ្លេចលេបថ្នាំតែមួយគ្រាប់', text: 'អ្វីដែលត្រូវធ្វើភាគច្រើនអាស្រ័យលើរយៈពេលដែលកន្លងផុតចាប់តាំងពីម៉ោងលេបធម្មតា។'},
      {title: 'ភ្លេចលេបថ្នាំលើសពីមួយគ្រាប់', text: 'ស្ថានភាពនេះត្រូវការការយកចិត្តទុកដាក់ជាពិសេស ហើយគួរពិនិត្យខិត្តប័ណ្ណណែនាំឲ្យបានច្បាស់លាស់។'},
      {title: 'មិនប្រាកដថាត្រូវធ្វើអ្វី', text: 'ឱសថការី ឬអ្នកជំនាញសុខាភិបាលអាចជួយអ្នកកំណត់វិធីត្រឹមត្រូវបានយ៉ាងឆាប់រហ័ស។'},
    ],
    body4: 'ខិត្តប័ណ្ណណែនាំរបស់ថ្នាំអ្នកផ្តល់ការណែនាំច្បាស់លាស់សម្រាប់ថ្នាំដែលអ្នកកំពុងប្រើ។ ការណែនាំអាចខុសគ្នា អាស្រ័យលើថាតើជាថ្នាំចម្រុះ ឬថ្នាំដែលមានតែប្រូសេស្តេរ៉ូនសំយោគ។',
    referenceTitle: 'អ្វីដែលគួរពិនិត្យ',
    referenceTips: [
      'រក្សាខិត្តប័ណ្ណណែនាំឲ្យងាយរកឃើញ (ឧទាហរណ៍ រូបថតក្នុងទូរស័ព្ទរបស់អ្នក)',
      'ទាក់ទងឱសថការី ប្រសិនបើអ្នកមានសំណួរបន្ទាន់',
      'ជួបវេជ្ជបណ្ឌិត ប្រសិនបើវាកើតឡើងញឹកញាប់',
    ],
    guideTitle: 'ហេតុអ្វីបានជាពេលវេលានៃការភ្លេចលេបថ្នាំមានសារៈសំខាន់?',
    guideText: 'ពេលដែលថ្នាំដែលភ្លេចស្ថិតក្នុងកញ្ចប់អាចផ្លាស់ប្តូរអ្វីដែលត្រូវធ្វើ។ នោះហើយជាមូលហេតុដែលខិត្តប័ណ្ណណែនាំជារឿយៗផ្តល់ការណែនាំខុសគ្នា អាស្រ័យលើសប្តាហ៍នៃកញ្ចប់។',
    body5: 'ប្រសិនបើអ្នកមិនដឹងថាត្រូវធ្វើអ្វី ការសុំដំបូន្មានប្រសើរជាងការនៅតែសង្ស័យ។ ឱសថការី ឆ្មប ឬវេជ្ជបណ្ឌិតអាចជួយអ្នកពិនិត្យការណែនាំដែលសមស្របនឹងស្ថានភាពរបស់អ្នក។',
    questionTitle: 'ព័ត៌មានដែលគួរត្រៀមទុក',
    questions: [
      'តើជាថ្នាំប្រភេទអ្វីពិតប្រាកដ?',
      'តើរយៈពេលប៉ុន្មានបានកន្លងផុតចាប់តាំងពីម៉ោងធម្មតា?',
      'តើភ្លេចលេបថ្នាំប៉ុន្មានគ្រាប់?',
      'តើថ្នាំដែលភ្លេចនោះស្ថិតនៅចំណុចណាក្នុងកញ្ចប់?',
      'តើមានការរួមភេទដោយគ្មានការការពារថ្មីៗនេះឬទេ?',
    ],
    proTipTitle: 'គួរដឹង',
    proTipText: 'ប្រសិនបើមានការរួមភេទដោយគ្មានការការពារក្នុងអំឡុងពេលដែលភ្លេចលេបថ្នាំ សូមសុំដំបូន្មានពីអ្នកជំនាញឲ្យបានឆាប់ ដើម្បីដឹងថាមានជម្រើសអ្វីខ្លះ។',
    repeatTitle: 'ប្រសិនបើអ្នកនៅតែភ្លេចលេបថ្នាំ',
    body6: 'ការភ្លេចលេបថ្នាំញឹកញាប់អាចជាសញ្ញាបង្ហាញថាទម្លាប់ប្រចាំថ្ងៃមិនសូវសមស្របនឹងរបៀបរស់នៅរបស់អ្នក។ កុំស្ទាក់ស្ទើរក្នុងការនិយាយជាមួយអ្នកជំនាញសុខាភិបាល ដើម្បីស្វែងរកវិធីពន្យារកំណើតផ្សេងទៀត។',
    methodTipTitle: 'វិធីផ្សេង?',
    methodTipText: 'ប្រសិនបើការលេបថ្នាំជារៀងរាល់ថ្ងៃពិបាកធ្វើបាន មានវិធីផ្សេងទៀតដែលមានភាពញឹកញាប់នៃការប្រើប្រាស់ខុសគ្នា។',
    summaryTitle: 'ចំណុចសំខាន់ៗ',
    summaryItems: [
      'ឆ្លើយតបភ្លាមៗនៅពេលអ្នកកត់សម្គាល់ថាភ្លេចលេបថ្នាំ។',
      'ពិនិត្យប្រភេទថ្នាំរបស់អ្នកឲ្យច្បាស់។',
      'ពិនិត្យខិត្តប័ណ្ណណែនាំ ដើម្បីដឹងពីវិធីដែលត្រូវធ្វើឲ្យច្បាស់លាស់។',
      'ប្រើការការពារបម្រុង ប្រសិនបើខិត្តប័ណ្ណណែនាំណែនាំឲ្យធ្វើ។',
      'សុំដំបូន្មាន ប្រសិនបើសង្ស័យ ឬក្រោយការរួមភេទដែលមានហានិភ័យ។',
    ],
    finalTipTitle: 'ចំណុចសំខាន់ៗ',
    finalTipText: 'ការភ្លេចលេបថ្នាំមិនមានន័យថាការពន្យារកំណើតរបស់អ្នកឈប់ដំណើរការដោយស្វ័យប្រវត្តិទេ។ វិធីត្រឹមត្រូវអាស្រ័យលើប្រភេទថ្នាំ និងកាលៈទេសៈនៃការភ្លេចលេប។ ប្រសិនបើសង្ស័យ សូមពិនិត្យខិត្តប័ណ្ណណែនាំ ហើយសុំដំបូន្មានឲ្យបានឆាប់។',
    disclaimerText: 'អត្ថបទនេះផ្តល់ជាព័ត៌មានទូទៅប៉ុណ្ណោះ ហើយមិនជំនួសខិត្តប័ណ្ណណែនាំរបស់ថ្នាំអ្នក ឬដំបូន្មានវេជ្ជសាស្ត្រផ្ទាល់ខ្លួនឡើយ។ ការណែនាំអាចខុសគ្នាអាស្រ័យលើប្រភេទថ្នាំ។',
  },
  lo: {
    shareMessage: 'ລືມກິນຢາຄຸມ: ຕ້ອງເຮັດແນວໃດ? — AWA',
    badge: 'ລືມກິນຢາຄຸມ',
    title: 'ລືມກິນຢາຄຸມ:\nຕ້ອງເຮັດແນວໃດ?',
    metaDuration: 'ອ່ານ 7 ນາທີ',
    metaType: 'ຄຳຖາມທີ່ພົບເລື້ອຍ',
    metaLevel: 'ລະດັບກາງ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ການລືມກິນຢາຄຸມສາມາດເກີດຂຶ້ນກັບໃຜກໍໄດ້. ສິ່ງທີ່ຕ້ອງເຮັດສ່ວນໃຫຍ່ຂຶ້ນກັບວ່າທ່ານລືມມາດົນເທົ່າໃດ, ປະເພດຂອງຢາຄຸມ ແລະ ເກີດຂຶ້ນໃນຊ່ວງໃດຂອງແຜງຢາ.',
    importantTitle: 'ຈຸດສຳຄັນ',
    importantText: 'ຢ່າຕື່ນຕົກໃຈ. ກ່ອນອື່ນໃຫ້ກວດເບິ່ງປະເພດຢາຄຸມຂອງທ່ານໃຫ້ແນ່ນອນ ແລະ ອ່ານໃບແຜ່ນຂໍ້ມູນໃນກ່ອງຢາ ເພື່ອຮູ້ວິທີປະຕິບັດທີ່ແນະນຳ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ກິນຊ້າກວ່າກຳນົດບໍ່ເຖິງ 12 ຊົ່ວໂມງ',
      'ກິນຊ້າກວ່າກຳນົດເກີນ 12 ຊົ່ວໂມງ',
      'ສະຖານະການທີ່ຕ້ອງເອົາໃຈໃສ່ເປັນພິເສດ',
      'ໃບແຜ່ນຂໍ້ມູນຢາແມ່ນແຫຼ່ງອ້າງອີງຂອງທ່ານ',
      'ເມື່ອໃດຄວນຂໍຄຳແນະນຳ',
      'ຈຸດສຳຄັນ',
    ],
    body1: 'ສຳລັບຢາຄຸມບາງຊະນິດ, ການກິນຊ້າບໍ່ເຖິງ 12 ຊົ່ວໂມງໂດຍທົ່ວໄປບໍ່ມີຜົນຕໍ່ການປ້ອງກັນການຕັ້ງຄັນ. ໃນກໍລະນີນີ້, ຄຳແນະນຳທົ່ວໄປແມ່ນໃຫ້ກິນເມັດທີ່ລືມທັນທີທີ່ເປັນໄປໄດ້ ແລ້ວກິນແຜງຕໍ່ໄປຕາມເວລາປົກກະຕິ.',
    step1Title: 'ກິນຢາເມັດນັ້ນ',
    step1Text: 'ກິນຢາທັນທີທີ່ທ່ານສັງເກດເຫັນວ່າຊ້າ.',
    step2Title: 'ກິນຕໍ່ຕາມປົກກະຕິ',
    step2Text: 'ຈາກນັ້ນກັບໄປກິນຕາມເວລາປົກກະຕິສຳລັບເມັດຕໍ່ໆໄປ.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text: 'ຖ້າທ່ານກິນເມັດທີ່ລືມ ແລ້ວກິນເມັດທີ່ກຳນົດໄວ້ຕາມເວລາປົກກະຕິ, ອາດເກີດກໍລະນີທີ່ກິນສອງເມັດໃນມື້ດຽວກັນ.',
    body2: 'ເມື່ອການກິນຊ້າເກີນເວລາທີ່ອະນຸຍາດສຳລັບຢາຄຸມຂອງທ່ານ, ການປ້ອງກັນອາດຫຼຸດລົງ. ສິ່ງທີ່ຕ້ອງເຮັດໃນຕອນນັ້ນຂຶ້ນກັບປະເພດຢາຄຸມ, ຈຳນວນເມັດທີ່ລືມ ແລະ ຕຳແໜ່ງຂອງເມັດທີ່ລືມໃນແຜງ.',
    alertTitle: 'ຄຳເຕືອນ',
    alertText: 'ຢ່າອີງໃສ່ພຽງຈຳນວນຊົ່ວໂມງທີ່ໃຫ້ໄວ້ທີ່ນີ້: ຢາຄຸມບາງຊະນິດມີຄຳແນະນຳແຕກຕ່າງກັນ. ໃຫ້ກວດເບິ່ງໃບແຜ່ນຂໍ້ມູນຂອງຢາຂອງທ່ານສະເໝີ.',
    reflexesTitle: 'ສິ່ງທຳອິດທີ່ຄວນເຮັດ',
    checkPoints: [
      {title: 'ຕອບສະໜອງໃຫ້ໄວ', text: 'ຍິ່ງທ່ານຕອບສະໜອງໄວຫຼັງຈາກສັງເກດເຫັນວ່າລືມກິນຢາ, ກໍຍິ່ງງ່າຍທີ່ຈະເຮັດຕາມຄຳແນະນຳທີ່ເໝາະສົມ.'},
      {title: 'ກວດໃບແຜ່ນຂໍ້ມູນຢາ', text: 'ຄຳແນະນຳອາດແຕກຕ່າງກັນຕາມປະເພດຢາຄຸມທີ່ແນ່ນອນ ແລະ ຈຳນວນເມັດທີ່ລືມ.'},
      {title: 'ວາງແຜນການປ້ອງກັນສຳຮອງ', text: 'ໃນບາງສະຖານະການ, ອາດມີການແນະນຳໃຫ້ໃຊ້ຖົງຢາງອະນາໄມໃນໄລຍະໜຶ່ງ.'},
    ],
    body3: 'ບໍ່ແມ່ນທຸກສະຖານະການຈະຄືກັນ. ການລືມກິນຢາບາງກໍລະນີຕ້ອງກວດສອບຄຳແນະນຳຢ່າງລະອຽດກວ່າ.',
    situations: [
      {title: 'ລືມພຽງໜຶ່ງເມັດ', text: 'ສິ່ງທີ່ຕ້ອງເຮັດສ່ວນໃຫຍ່ຂຶ້ນກັບເວລາທີ່ຜ່ານໄປນັບແຕ່ເວລາກິນປົກກະຕິ.'},
      {title: 'ລືມຫຼາຍກວ່າໜຶ່ງເມັດ', text: 'ສະຖານະການນີ້ຕ້ອງເອົາໃຈໃສ່ເປັນພິເສດ ແລະ ດີທີ່ສຸດຄວນກວດເບິ່ງໃບແຜ່ນຂໍ້ມູນຢ່າງລະອຽດ.'},
      {title: 'ບໍ່ແນ່ໃຈວ່າຄວນເຮັດແນວໃດ', text: 'ເພສັດຊະກອນ ຫຼື ຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບສາມາດຊ່ວຍທ່ານລະບຸວິທີປະຕິບັດທີ່ຖືກຕ້ອງໄດ້ຢ່າງວ່ອງໄວ.'},
    ],
    body4: 'ໃບແຜ່ນຂໍ້ມູນຂອງຢາຄຸມໃຫ້ຄຳແນະນຳທີ່ແນ່ນອນສຳລັບຢາທີ່ທ່ານກິນຢູ່. ຄຳແນະນຳອາດແຕກຕ່າງກັນຕາມວ່າເປັນຢາຄຸມຊະນິດຮໍໂມນລວມ ຫຼື ຢາຄຸມທີ່ມີສະເພາະໂປຣເຈສຕິນ.',
    referenceTitle: 'ສິ່ງທີ່ເປັນປະໂຫຍດຄວນກວດເບິ່ງ',
    referenceTips: [
      'ເກັບໃບແຜ່ນຂໍ້ມູນຢາໄວ້ໃຫ້ຫຍິບມື (ຕົວຢ່າງ ຖ່າຍຮູບໄວ້ໃນໂທລະສັບ)',
      'ຕິດຕໍ່ເພສັດຊະກອນຖ້າທ່ານມີຄຳຖາມດ່ວນ',
      'ພົບແພດຖ້າເກີດຂຶ້ນເລື້ອຍໆ',
    ],
    guideTitle: 'ເປັນຫຍັງເວລາທີ່ລືມກິນຢາຈຶ່ງສຳຄັນ?',
    guideText: 'ຕຳແໜ່ງຂອງເມັດທີ່ລືມໃນແຜງສາມາດປ່ຽນສິ່ງທີ່ຕ້ອງເຮັດໄດ້. ດ້ວຍເຫດນີ້ ໃບແຜ່ນຂໍ້ມູນຈຶ່ງມັກໃຫ້ຄຳແນະນຳທີ່ແຕກຕ່າງກັນຕາມອາທິດຂອງແຜງ.',
    body5: 'ຖ້າທ່ານບໍ່ຮູ້ວ່າຕ້ອງເຮັດແນວໃດ, ການຂໍຄຳແນະນຳດີກວ່າການຢູ່ໃນຄວາມສົງໄສ. ເພສັດຊະກອນ, ໝໍຕຳແຍ ຫຼື ແພດສາມາດຊ່ວຍທ່ານກວດສອບຄຳແນະນຳທີ່ເໝາະກັບສະຖານະການຂອງທ່ານ.',
    questionTitle: 'ຂໍ້ມູນທີ່ຄວນກຽມໄວ້',
    questions: [
      'ເປັນຢາຄຸມປະເພດໃດແທ້?',
      'ເວລາຜ່ານໄປເທົ່າໃດນັບແຕ່ເວລາກິນປົກກະຕິ?',
      'ລືມກິນຈຳນວນຈັກເມັດ?',
      'ການລືມເກີດຂຶ້ນໃນຊ່ວງໃດຂອງແຜງ?',
      'ມີເພດສຳພັນໂດຍບໍ່ປ້ອງກັນເມື່ອບໍ່ດົນມານີ້ບໍ?',
    ],
    proTipTitle: 'ຄວນຮູ້',
    proTipText: 'ຖ້າມີເພດສຳພັນໂດຍບໍ່ປ້ອງກັນໃນຊ່ວງທີ່ລືມກິນຢາ, ໃຫ້ຂໍຄຳແນະນຳຈາກຜູ້ຊ່ຽວຊານຢ່າງວ່ອງໄວ ເພື່ອຮູ້ວ່າມີທາງເລືອກໃດແດ່.',
    repeatTitle: 'ຖ້າທ່ານລືມກິນຢາເລື້ອຍໆ',
    body6: 'ການລືມກິນຢາເລື້ອຍໆອາດເປັນສັນຍານວ່າການກິນທຸກມື້ບໍ່ຄ່ອຍເໝາະກັບວິຖີຊີວິດຂອງທ່ານ. ຢ່າລັງເລທີ່ຈະລົມກັບຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ ເພື່ອສຶກສາວິທີຄຸມກຳເນີດອື່ນ.',
    methodTipTitle: 'ວິທີອື່ນບໍ?',
    methodTipText: 'ຖ້າການກິນຢາທຸກມື້ເປັນເລື່ອງຍາກທີ່ຈະເຮັດຕໍ່ເນື່ອງ, ມີວິທີອື່ນທີ່ໃຊ້ຕາມຄວາມຖີ່ທີ່ແຕກຕ່າງກັນ.',
    summaryTitle: 'ສິ່ງຈຳເປັນ',
    summaryItems: [
      'ຕອບສະໜອງທັນທີທີ່ທ່ານສັງເກດເຫັນວ່າລືມກິນຢາ.',
      'ກວດເບິ່ງປະເພດຢາຄຸມຂອງທ່ານໃຫ້ແນ່ນອນ.',
      'ກວດໃບແຜ່ນຂໍ້ມູນເພື່ອຮູ້ວິທີປະຕິບັດທີ່ແນ່ນອນ.',
      'ໃຊ້ການປ້ອງກັນສຳຮອງຖ້າໃບແຜ່ນຂໍ້ມູນແນະນຳ.',
      'ຂໍຄຳແນະນຳຖ້າສົງໄສ ຫຼື ຫຼັງຈາກມີເພດສຳພັນທີ່ມີຄວາມສ່ຽງ.',
    ],
    finalTipTitle: 'ຈຸດສຳຄັນ',
    finalTipText: 'ການລືມກິນຢາບໍ່ໄດ້ໝາຍຄວາມວ່າການຄຸມກຳເນີດຂອງທ່ານຢຸດໃຊ້ໄດ້ໂດຍອັດຕະໂນມັດ. ວິທີປະຕິບັດທີ່ຖືກຕ້ອງຂຶ້ນກັບປະເພດຢາຄຸມ ແລະ ສະຖານະການຂອງການລືມ. ຖ້າສົງໄສ, ໃຫ້ກວດໃບແຜ່ນຂໍ້ມູນ ແລະ ຂໍຄຳແນະນຳຢ່າງວ່ອງໄວ.',
    disclaimerText: 'ບົດຄວາມນີ້ໃຫ້ໄວ້ເພື່ອເປັນຂໍ້ມູນເທົ່ານັ້ນ ແລະ ບໍ່ແທນໃບແຜ່ນຂໍ້ມູນຂອງຢາຂອງທ່ານ ຫຼື ຄຳແນະນຳທາງການແພດສະເພາະບຸກຄົນ. ຄຳແນະນຳອາດແຕກຕ່າງກັນຕາມປະເພດຂອງຢາຄຸມ.',
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
