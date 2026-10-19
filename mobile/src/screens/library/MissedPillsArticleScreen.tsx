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
const CONTENT = {
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
} as const;

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
