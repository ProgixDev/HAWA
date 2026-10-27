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

const ID = 'lochia-comprendre-lochies';

const HERO = require('../../assets/images/library/featured-pain.png');

/* -------------------------------------------------------------------------- */
/* DATA — language-neutral (icons/numbers only; text lives in CONTENT below) */
/* -------------------------------------------------------------------------- */

const EVOLUTION_META = [
  {number: '01', icon: 'numeric-1-circle-outline'},
  {number: '02', icon: 'numeric-2-circle-outline'},
  {number: '03', icon: 'numeric-3-circle-outline'},
] as const;

const NORMAL_META = [
  {icon: 'water-outline'},
  {icon: 'palette-outline'},
  {icon: 'clock-outline'},
] as const;

const COMFORT_META = [
  {icon: 'hand-wash-outline'},
  {icon: 'calendar-check-outline'},
  {icon: 'sleep-outline'},
] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L bilingual editorial content. Article identity (ID,     */
/* images, bookmark/progress keys, JSX structure) is untouched; only this    */
/* object changes per language. The French text below is byte-identical to  */
/* the original — never retyped, only moved into the `fr` key — so the app  */
/* remains fully bilingual rather than having French replaced by English.   */
/* -------------------------------------------------------------------------- */

const CONTENT = withBrazilianPortuguese('Lochia', {
  fr: {
    badgeText: 'POST-PARTUM • LOCHIES',
    title: 'Comprendre les lochies après \nla naissance',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu informatif',
    intro:
      'Après l’accouchement, les lochies correspondent aux pertes vaginales liées au processus naturel de récupération de l’utérus. Leur couleur et leur quantité évoluent progressivement au fil des jours et des semaines.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Que sont les lochies ?',
      'Comment évoluent-elles ?',
      'Ce qui peut être normal',
      'Conseils de confort',
      'Quand consulter ?',
      'À retenir',
    ],
    section1Heading: '1. Que sont les lochies ?',
    section1Body1:
      'Les lochies sont des pertes vaginales qui apparaissent après l’accouchement. Elles correspondent notamment à l’élimination progressive de sang, de sécrétions et de tissus provenant de l’utérus pendant sa récupération.',
    section1Body2:
      'Elles sont différentes des règles habituelles. Leur présence est attendue pendant la période post-partum et elles diminuent généralement progressivement.',
    infoTitle: 'À retenir',
    infoText:
      'Les lochies ne signifient pas que les règles ont déjà repris. Le retour des règles est un phénomène différent qui survient plus tard.',
    section2Heading: '2. Comment évoluent les lochies ?',
    section2Body:
      'Leur aspect change généralement au cours des premières semaines. La couleur devient progressivement plus claire et la quantité tend à diminuer.',
    evolutionTitle: 'Une évolution progressive',
    evolutionSubtitle: 'Les étapes peuvent varier selon chaque personne',
    evolution: [
      {
        label: 'Rouge vif',
        period: 'Les premiers jours',
        text: 'Les pertes sont généralement rouges et peuvent être plus abondantes au début.',
      },
      {
        label: 'Rosé / brunâtre',
        period: 'Après quelques jours',
        text: 'La couleur devient progressivement plus claire et peut tirer vers le rose ou le brun.',
      },
      {
        label: 'Blanc-jaunâtre',
        period: 'Au fil des semaines',
        text: 'Les pertes deviennent généralement plus claires, jaunâtres ou blanchâtres avant de diminuer.',
      },
    ],
    section3Heading: '3. Ce qui peut être normal',
    section3Body:
      'L’évolution des lochies n’est pas exactement identique pour tout le monde. Certains changements peuvent accompagner naturellement la récupération après la naissance.',
    normalPoints: [
      {
        title: 'Une quantité variable',
        text: 'L’abondance peut changer au cours des premiers jours puis diminuer progressivement.',
      },
      {
        title: 'Une couleur qui évolue',
        text: 'Les lochies passent généralement du rouge vers des teintes plus claires au fil du temps.',
      },
      {
        title: 'Une durée variable',
        text: 'Elles peuvent persister plusieurs semaines et leur évolution diffère selon chaque personne.',
      },
    ],
    section4Heading: '4. Conseils de confort et de suivi',
    section4Body:
      'Pendant cette période, un suivi simple peut t’aider à observer l’évolution de ton corps sans chercher à comparer ton expérience à celle d’une autre personne.',
    comfortTips: [
      {
        title: 'Hygiène douce',
        text: 'Privilégie une toilette douce et régulière sans produits irritants.',
      },
      {
        title: 'Observe l’évolution',
        text: 'Tu peux noter la couleur, la quantité et l’évolution des pertes si cela t’aide à suivre ton rétablissement.',
      },
      {
        title: 'Accorde-toi du repos',
        text: 'La période post-partum demande du temps. Écoute ton corps et respecte tes besoins de récupération.',
      },
    ],
    section5Heading: '5. Lochies ou retour des règles ?',
    section5Body:
      'Les lochies apparaissent dans les suites de l’accouchement et diminuent progressivement. Le retour des règles correspond, lui, à la reprise du cycle menstruel après cette période.',
    compareLochiaTitle: 'Lochies',
    compareLochiaText:
      'Pertes liées à la récupération de l’utérus après la naissance.',
    compareReturnTitle: 'Retour des règles',
    compareReturnText:
      'Reprise du cycle menstruel, à un moment variable selon chaque personne.',
    section6Heading: '6. Quand consulter ?',
    section6Body:
      'Si l’évolution te semble inhabituelle ou si ton état général se dégrade, il est important de demander conseil à un professionnel de santé.',
    warningTitle: 'Signes qui méritent un avis médical',
    warningSigns: [
      'Une odeur forte ou inhabituelle',
      'De la fièvre ou un état général qui se dégrade',
      'Un flux qui devient soudainement beaucoup plus abondant',
      'Des douleurs importantes, persistantes ou inhabituelles',
      'Un symptôme nouveau qui t’inquiète',
    ],
    tipTitle: 'Bon à savoir',
    tipText:
      'Les lochies évoluent généralement progressivement : elles peuvent être rouges au début, puis devenir plus claires avant de diminuer. Chaque récupération est cependant individuelle.',
    summaryHeading: 'À retenir',
    summaryPoints: [
      'Les lochies sont des pertes normales après l’accouchement.',
      'Elles évoluent généralement en couleur et en quantité au fil des semaines.',
      'Leur durée et leur évolution peuvent varier selon chaque personne.',
      'Une odeur inhabituelle, de la fièvre, des douleurs importantes ou un saignement soudainement très abondant nécessitent un avis médical.',
    ],
    disclaimerText:
      'Contenu informatif. Cet article ne remplace pas un avis ou un examen médical. En cas de doute ou de symptôme préoccupant, demande conseil à un professionnel de santé.',
    shareMessage: 'Comprendre les lochies après la naissance — AWA',
  },
  en: {
    badgeText: 'POSTPARTUM • LOCHIA',
    title: 'Understanding lochia\nafter birth',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Informational content',
    intro:
      'After giving birth, lochia refers to the vaginal discharge linked to the natural process of uterine recovery. Its color and amount gradually change over the days and weeks that follow.',
    contentsTitle: 'In this article',
    topics: [
      'What is lochia?',
      'How does it change over time?',
      'What can be normal',
      'Comfort tips',
      'When to seek medical advice?',
      'Key takeaways',
    ],
    section1Heading: '1. What is lochia?',
    section1Body1:
      'Lochia is vaginal discharge that appears after giving birth. It mainly consists of the gradual elimination of blood, secretions, and tissue from the uterus as it recovers.',
    section1Body2:
      'It’s different from a regular period. It’s expected during the postpartum period and generally decreases progressively.',
    infoTitle: 'Key takeaways',
    infoText:
      'Lochia doesn’t mean your period has already returned. The return of your period is a separate event that happens later.',
    section2Heading: '2. How does lochia change over time?',
    section2Body:
      'Its appearance usually changes over the first few weeks. The color gradually becomes lighter and the amount tends to decrease.',
    evolutionTitle: 'A gradual progression',
    evolutionSubtitle: 'The stages can vary from person to person',
    evolution: [
      {
        label: 'Bright red',
        period: 'The first days',
        text: 'Discharge is usually red and can be heavier at the start.',
      },
      {
        label: 'Pink / brownish',
        period: 'After a few days',
        text: 'The color gradually becomes lighter and may shift toward pink or brown.',
      },
      {
        label: 'Whitish-yellow',
        period: 'Over the following weeks',
        text: 'Discharge usually becomes lighter, yellowish or whitish, before tapering off.',
      },
    ],
    section3Heading: '3. What can be normal',
    section3Body:
      'How lochia evolves isn’t exactly the same for everyone. Certain changes can naturally accompany recovery after birth.',
    normalPoints: [
      {
        title: 'A varying amount',
        text: 'The amount can change over the first few days and then gradually decrease.',
      },
      {
        title: 'A color that changes',
        text: 'Lochia usually moves from red toward lighter shades over time.',
      },
      {
        title: 'A varying duration',
        text: 'It can persist for several weeks, and how it evolves differs from person to person.',
      },
    ],
    section4Heading: '4. Comfort and tracking tips',
    section4Body:
      'During this period, simple tracking can help you observe how your body is changing without comparing your experience to someone else’s.',
    comfortTips: [
      {
        title: 'Gentle hygiene',
        text: 'Favor gentle, regular washing without irritating products.',
      },
      {
        title: 'Watch how it evolves',
        text: 'You can note the color, amount, and progression of the discharge if that helps you track your recovery.',
      },
      {
        title: 'Allow yourself rest',
        text: 'The postpartum period takes time. Listen to your body and respect your need to recover.',
      },
    ],
    section5Heading: '5. Lochia or the return of your period?',
    section5Body:
      'Lochia appears in the days following birth and gradually decreases. The return of your period, on the other hand, corresponds to the resumption of your menstrual cycle after this period.',
    compareLochiaTitle: 'Lochia',
    compareLochiaText: 'Discharge linked to uterine recovery after birth.',
    compareReturnTitle: 'Return of your period',
    compareReturnText:
      'Resumption of the menstrual cycle, at a time that varies from person to person.',
    section6Heading: '6. When to seek medical advice?',
    section6Body:
      'If the progression seems unusual to you, or if your overall condition is getting worse, it’s important to seek advice from a healthcare professional.',
    warningTitle: 'Signs that call for medical advice',
    warningSigns: [
      'A strong or unusual odor',
      'Fever or a worsening general condition',
      'A flow that suddenly becomes much heavier',
      'Significant, persistent, or unusual pain',
      'A new symptom that worries you',
    ],
    tipTitle: 'Good to know',
    tipText:
      'Lochia usually evolves gradually: it can be red at first, then become lighter before tapering off. However, every recovery is individual.',
    summaryHeading: 'Key takeaways',
    summaryPoints: [
      'Lochia is normal discharge after childbirth.',
      'It usually changes in color and amount over the weeks.',
      'Its duration and progression can vary from person to person.',
      'An unusual odor, fever, significant pain, or a sudden, very heavy bleed require medical advice.',
    ],
    disclaimerText:
      'Informational content. This article does not replace medical advice or an examination. If in doubt or if you notice a concerning symptom, seek advice from a healthcare professional.',
    shareMessage: 'Understanding lochia after birth — AWA',
  },
  es: {
    badgeText: 'POSPARTO • LOQUIOS',
    title: 'Entender los loquios después \ndel parto',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido informativo',
    intro:
      'Después del parto, los loquios son las pérdidas vaginales relacionadas con el proceso natural de recuperación del útero. Su color y su cantidad evolucionan progresivamente a lo largo de los días y las semanas.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué son los loquios?',
      '¿Cómo evolucionan?',
      'Lo que puede ser normal',
      'Consejos de confort',
      '¿Cuándo consultar?',
      'Para recordar',
    ],
    section1Heading: '1. ¿Qué son los loquios?',
    section1Body1:
      'Los loquios son pérdidas vaginales que aparecen después del parto. Corresponden principalmente a la eliminación progresiva de sangre, secreciones y tejidos procedentes del útero durante su recuperación.',
    section1Body2:
      'Son diferentes de las reglas habituales. Su presencia es esperada durante el periodo posparto y generalmente disminuyen progresivamente.',
    infoTitle: 'Para recordar',
    infoText:
      'Los loquios no significan que la regla ya haya vuelto. El regreso de la regla es un fenómeno diferente que ocurre más tarde.',
    section2Heading: '2. ¿Cómo evolucionan los loquios?',
    section2Body:
      'Su aspecto suele cambiar durante las primeras semanas. El color se vuelve progresivamente más claro y la cantidad tiende a disminuir.',
    evolutionTitle: 'Una evolución progresiva',
    evolutionSubtitle: 'Las etapas pueden variar según cada persona',
    evolution: [
      {
        label: 'Rojo vivo',
        period: 'Los primeros días',
        text: 'Las pérdidas suelen ser rojas y pueden ser más abundantes al principio.',
      },
      {
        label: 'Rosado / parduzco',
        period: 'Después de unos días',
        text: 'El color se vuelve progresivamente más claro y puede tender hacia el rosa o el marrón.',
      },
      {
        label: 'Blanco amarillento',
        period: 'A lo largo de las semanas',
        text: 'Las pérdidas suelen volverse más claras, amarillentas o blanquecinas antes de disminuir.',
      },
    ],
    section3Heading: '3. Lo que puede ser normal',
    section3Body:
      'La evolución de los loquios no es exactamente igual para todo el mundo. Algunos cambios pueden acompañar naturalmente la recuperación después del parto.',
    normalPoints: [
      {
        title: 'Una cantidad variable',
        text: 'La abundancia puede cambiar durante los primeros días y luego disminuir progresivamente.',
      },
      {
        title: 'Un color que evoluciona',
        text: 'Los loquios suelen pasar del rojo a tonos más claros con el paso del tiempo.',
      },
      {
        title: 'Una duración variable',
        text: 'Pueden persistir varias semanas y su evolución difiere según cada persona.',
      },
    ],
    section4Heading: '4. Consejos de confort y de seguimiento',
    section4Body:
      'Durante este periodo, un seguimiento sencillo puede ayudarte a observar la evolución de tu cuerpo sin buscar comparar tu experiencia con la de otra persona.',
    comfortTips: [
      {
        title: 'Higiene suave',
        text: 'Prioriza un aseo suave y regular sin productos irritantes.',
      },
      {
        title: 'Observa la evolución',
        text: 'Puedes anotar el color, la cantidad y la evolución de las pérdidas si eso te ayuda a hacer un seguimiento de tu recuperación.',
      },
      {
        title: 'Concédete descanso',
        text: 'El periodo posparto requiere tiempo. Escucha tu cuerpo y respeta tus necesidades de recuperación.',
      },
    ],
    section5Heading: '5. ¿Loquios o regreso de la regla?',
    section5Body:
      'Los loquios aparecen tras el parto y disminuyen progresivamente. El regreso de la regla, por su parte, corresponde a la reanudación del ciclo menstrual después de este periodo.',
    compareLochiaTitle: 'Loquios',
    compareLochiaText:
      'Pérdidas relacionadas con la recuperación del útero después del parto.',
    compareReturnTitle: 'Regreso de la regla',
    compareReturnText:
      'Reanudación del ciclo menstrual, en un momento variable según cada persona.',
    section6Heading: '6. ¿Cuándo consultar?',
    section6Body:
      'Si la evolución te parece inusual o si tu estado general empeora, es importante pedir consejo a un profesional de la salud.',
    warningTitle: 'Señales que merecen un aviso médico',
    warningSigns: [
      'Un olor fuerte o inusual',
      'Fiebre o un estado general que empeora',
      'Un flujo que de repente se vuelve mucho más abundante',
      'Dolores importantes, persistentes o inusuales',
      'Un síntoma nuevo que te preocupa',
    ],
    tipTitle: 'DATO ÚTIL',
    tipText:
      'Los loquios suelen evolucionar progresivamente: pueden ser rojos al principio, y luego volverse más claros antes de disminuir. Sin embargo, cada recuperación es individual.',
    summaryHeading: 'Para recordar',
    summaryPoints: [
      'Los loquios son pérdidas normales después del parto.',
      'Suelen evolucionar en color y en cantidad a lo largo de las semanas.',
      'Su duración y su evolución pueden variar según cada persona.',
      'Un olor inusual, fiebre, dolores importantes o un sangrado repentinamente muy abundante requieren un aviso médico.',
    ],
    disclaimerText:
      'Contenido informativo. Este artículo no sustituye un aviso o un examen médico. En caso de duda o de síntoma preocupante, pide consejo a un profesional de la salud.',
    shareMessage: 'Entender los loquios después del parto — AWA',
  },
  it: {
    badgeText: 'POST-PARTUM • LOCHIAZIONI',
    title: 'Capire le lochiazioni\ndopo il parto',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto informativo',
    intro: 'Dopo il parto, le lochiazioni sono le perdite vaginali legate al naturale processo di recupero dell’utero. Il loro colore e la loro quantità cambiano gradualmente nei giorni e nelle settimane successive.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cosa sono le lochiazioni?',
      'Come cambiano nel tempo?',
      'Cosa può essere normale',
      'Consigli per stare meglio',
      'Quando chiedere un parere medico?',
      'Punti chiave',
    ],
    section1Heading: '1. Che cosa sono le lochiazioni?',
    section1Body1: 'Le lochiazioni sono perdite vaginali che compaiono dopo il parto. Consistono principalmente nella graduale eliminazione di sangue, secrezioni e tessuto dall’utero mentre si riprende.',
    section1Body2: 'Sono diverse dalle normali mestruazioni. Sono previste durante il post-partum e in genere diminuiscono progressivamente.',
    infoTitle: 'Punti chiave',
    infoText: 'Le lochiazioni non significano che le mestruazioni siano già tornate. Il ritorno delle mestruazioni è un evento distinto, che avviene più tardi.',
    section2Heading: '2. Come cambiano le lochiazioni nel tempo?',
    section2Body: 'Il loro aspetto cambia di solito nelle prime settimane. Il colore diventa gradualmente più chiaro e la quantità tende a diminuire.',
    evolutionTitle: 'Una progressione graduale',
    evolutionSubtitle: 'Le fasi possono variare da donna a donna',
    evolution: [
      {
        label: 'Rosso vivo',
        period: 'I primi giorni',
        text: 'Le perdite sono di solito rosse e possono essere più abbondanti all’inizio.',
      },
      {
        label: 'Rosa / brunastro',
        period: 'Dopo qualche giorno',
        text: 'Il colore diventa gradualmente più chiaro e può virare verso il rosa o il marrone.',
      },
      {
        label: 'Bianco-giallastro',
        period: 'Nelle settimane successive',
        text: 'Le perdite di solito diventano più leggere, giallastre o biancastre, prima di esaurirsi.',
      },
    ],
    section3Heading: '3. Cosa può essere normale',
    section3Body: 'L’evoluzione delle lochiazioni non è esattamente la stessa per tutte. Alcuni cambiamenti possono accompagnare naturalmente il recupero dopo il parto.',
    normalPoints: [
      {
        title: 'Una quantità variabile',
        text: 'La quantità può cambiare nei primi giorni e poi diminuire gradualmente.',
      },
      {
        title: 'Un colore che cambia',
        text: 'Le lochiazioni passano di solito dal rosso a sfumature più chiare con il passare del tempo.',
      },
      {
        title: 'Una durata variabile',
        text: 'Possono persistere per diverse settimane, e la loro evoluzione differisce da donna a donna.',
      },
    ],
    section4Heading: '4. Consigli per il comfort e il monitoraggio',
    section4Body: 'In questo periodo, un semplice monitoraggio può aiutarti a osservare come sta cambiando il tuo corpo, senza confrontare la tua esperienza con quella di un’altra donna.',
    comfortTips: [
      {
        title: 'Igiene delicata',
        text: 'Privilegia un lavaggio delicato e regolare, senza prodotti irritanti.',
      },
      {
        title: 'Osserva l’evoluzione',
        text: 'Puoi annotare il colore, la quantità e la progressione delle perdite se ti aiuta a seguire il tuo recupero.',
      },
      {
        title: 'Concediti del riposo',
        text: 'Il post-partum richiede tempo. Ascolta il tuo corpo e rispetta il tuo bisogno di recuperare.',
      },
    ],
    section5Heading: '5. Lochiazioni o ritorno delle mestruazioni?',
    section5Body: 'Le lochiazioni compaiono nei giorni successivi al parto e diminuiscono gradualmente. Il ritorno delle mestruazioni, invece, corrisponde alla ripresa del ciclo mestruale dopo questo periodo.',
    compareLochiaTitle: 'Lochiazioni',
    compareLochiaText: 'Perdite legate al recupero dell’utero dopo il parto.',
    compareReturnTitle: 'Ritorno delle mestruazioni',
    compareReturnText: 'Ripresa del ciclo mestruale, in un momento che varia da donna a donna.',
    section6Heading: '6. Quando chiedere un parere medico?',
    section6Body: 'Se l’evoluzione ti sembra insolita, o se le tue condizioni generali peggiorano, è importante chiedere il parere di un professionista sanitario.',
    warningTitle: 'Segnali che richiedono un parere medico',
    warningSigns: [
      'Un odore forte o insolito',
      'Febbre o un peggioramento delle condizioni generali',
      'Un flusso che diventa improvvisamente molto più abbondante',
      'Dolore intenso, persistente o insolito',
      'Un nuovo sintomo che ti preoccupa',
    ],
    tipTitle: 'Da sapere',
    tipText: 'Le lochiazioni di solito evolvono gradualmente: possono essere rosse all’inizio, poi diventare più chiare prima di esaurirsi. Tuttavia, ogni recupero è individuale.',
    summaryHeading: 'Punti chiave',
    summaryPoints: [
      'Le lochiazioni sono perdite normali dopo il parto.',
      'Di solito cambiano di colore e di quantità nel corso delle settimane.',
      'La loro durata e la loro progressione possono variare da donna a donna.',
      'Un odore insolito, febbre, dolore intenso o un sanguinamento improvviso e molto abbondante richiedono un parere medico.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico né una visita. In caso di dubbio o se noti un sintomo preoccupante, chiedi il parere di un professionista sanitario.',
    shareMessage: 'Capire le lochiazioni dopo il parto — AWA',
  },
  tr: {
    badgeText: 'DOĞUM SONRASI • LOŞYA',
    title: 'Doğum sonrası loşyayı\nanlamak',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Bilgilendirici içerik',
    intro: 'Doğumdan sonra loşya, rahmin kendini toparlamasının doğal sürecine bağlı vajinal akıntıyı ifade eder. Rengi ve miktarı, sonraki günlerde ve haftalarda zamanla değişir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Loşya nedir?',
      'Zamanla nasıl değişir?',
      'Nelerin normal olabileceği',
      'Rahatlık önerileri',
      'Ne zaman tıbbi tavsiye alınmalı?',
      'Akılda tutulacaklar',
    ],
    section1Heading: '1. Loşya nedir?',
    section1Body1: 'Loşya, doğumdan sonra ortaya çıkan vajinal akıntıdır. Esas olarak rahmin toparlanırken kanı, salgıları ve dokuyu giderek dışarı atmasından oluşur.',
    section1Body2: 'Normal bir adetten farklıdır. Doğum sonrası dönemde beklenen bir durumdur ve genellikle giderek azalır.',
    infoTitle: 'Akılda tutulacaklar',
    infoText: 'Loşya, adetinin geri geldiği anlamına gelmez. Adetin geri dönmesi, daha sonra gerçekleşen ayrı bir olaydır.',
    section2Heading: '2. Loşya zamanla nasıl değişir?',
    section2Body: 'Görünümü genellikle ilk birkaç hafta içinde değişir. Renk giderek açılır ve miktar azalma eğilimindedir.',
    evolutionTitle: 'Kademeli bir ilerleme',
    evolutionSubtitle: 'Evreler kişiden kişiye değişebilir',
    evolution: [
      {
        label: 'Parlak kırmızı',
        period: 'İlk günler',
        text: 'Akıntı genellikle kırmızıdır ve başlangıçta daha yoğun olabilir.',
      },
      {
        label: 'Pembe / kahverengimsi',
        period: 'Birkaç gün sonra',
        text: 'Renk giderek açılır ve pembeye ya da kahverengiye kayabilir.',
      },
      {
        label: 'Beyazımsı sarı',
        period: 'Sonraki haftalarda',
        text: 'Akıntı genellikle hafifler, sarımsı ya da beyazımsı hâle gelir ve ardından azalarak sona erer.',
      },
    ],
    section3Heading: '3. Nelerin normal olabileceği',
    section3Body: 'Loşyanın seyri herkes için tam olarak aynı değildir. Bazı değişiklikler doğum sonrası toparlanmaya doğal olarak eşlik edebilir.',
    normalPoints: [
      {
        title: 'Değişken bir miktar',
        text: 'Miktar ilk günlerde değişebilir, ardından giderek azalır.',
      },
      {
        title: 'Değişen bir renk',
        text: 'Loşya genellikle zamanla kırmızıdan daha açık tonlara doğru ilerler.',
      },
      {
        title: 'Değişken bir süre',
        text: 'Birkaç hafta sürebilir ve seyri kişiden kişiye farklılık gösterir.',
      },
    ],
    section4Heading: '4. Rahatlık ve takip önerileri',
    section4Body: 'Bu dönemde basit bir takip, deneyimini bir başkasınınkiyle kıyaslamadan vücudunun nasıl değiştiğini gözlemlemene yardımcı olabilir.',
    comfortTips: [
      {
        title: 'Nazik hijyen',
        text: 'Tahriş edici ürünler kullanmadan, nazik ve düzenli yıkanmayı tercih et.',
      },
      {
        title: 'Seyrini izle',
        text: 'Toparlanmanı takip etmene yardımcı oluyorsa akıntının rengini, miktarını ve seyrini not edebilirsin.',
      },
      {
        title: 'Kendine dinlenme izni ver',
        text: 'Doğum sonrası dönem zaman alır. Vücudunu dinle ve toparlanma ihtiyacına saygı göster.',
      },
    ],
    section5Heading: '5. Loşya mı, adetin geri dönüşü mü?',
    section5Body: 'Loşya doğumu izleyen günlerde ortaya çıkar ve giderek azalır. Adetin geri dönmesi ise bu dönemden sonra adet döngüsünün yeniden başlamasına karşılık gelir.',
    compareLochiaTitle: 'Loşya',
    compareLochiaText: 'Doğum sonrası rahmin toparlanmasına bağlı akıntı.',
    compareReturnTitle: 'Adetin geri dönüşü',
    compareReturnText: 'Adet döngüsünün yeniden başlaması; zamanı kişiden kişiye değişir.',
    section6Heading: '6. Ne zaman tıbbi tavsiye alınmalı?',
    section6Body: 'Seyri sana alışılmadık geliyorsa ya da genel durumun kötüleşiyorsa bir sağlık profesyonelinden tavsiye alman önemlidir.',
    warningTitle: 'Tıbbi tavsiye gerektiren işaretler',
    warningSigns: [
      'Keskin veya alışılmadık bir koku',
      'Ateş veya kötüleşen genel durum',
      'Ani şekilde çok daha yoğunlaşan bir akış',
      'Belirgin, kalıcı veya alışılmadık ağrı',
      'Seni endişelendiren yeni bir belirti',
    ],
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Loşya genellikle kademeli olarak değişir: başlangıçta kırmızı olabilir, sonra açılır ve ardından azalarak sona erer. Yine de her toparlanma kişiye özeldir.',
    summaryHeading: 'Akılda tutulacaklar',
    summaryPoints: [
      'Loşya, doğumdan sonra görülen normal bir akıntıdır.',
      'Genellikle haftalar içinde rengi ve miktarı değişir.',
      'Süresi ve seyri kişiden kişiye farklılık gösterebilir.',
      'Alışılmadık bir koku, ateş, belirgin ağrı veya ani ve çok yoğun bir kanama tıbbi tavsiye gerektirir.',
    ],
    disclaimerText: 'Bilgilendirici içerik. Bu makale tıbbi tavsiyenin veya muayenenin yerini tutmaz. Şüphen varsa ya da endişe verici bir belirti fark edersen bir sağlık profesyonelinden tavsiye al.',
    shareMessage: 'Doğum sonrası loşyayı anlamak — AWA',
  },
  ru: {
    badgeText: 'ПОСЛЕРОДОВОЙ ПЕРИОД • ЛОХИИ',
    title: 'Что такое лохии\nпосле родов',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Информационный материал',
    intro:
      'После родов лохиями называют влагалищные выделения, связанные с естественным процессом восстановления матки. Их цвет и количество постепенно меняются в течение следующих дней и недель.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое лохии?',
      'Как они меняются со временем?',
      'Что может быть нормой',
      'Советы для комфорта',
      'Когда обращаться за медицинской консультацией?',
      'Главное',
    ],
    section1Heading: '1. Что такое лохии?',
    section1Body1:
      'Лохии — это влагалищные выделения, которые появляются после родов. Они в основном состоят из крови, секретов и тканей, постепенно выводимых из матки по мере её восстановления.',
    section1Body2:
      'Они отличаются от обычных месячных. Лохии ожидаемы в послеродовой период и, как правило, постепенно уменьшаются.',
    infoTitle: 'Главное',
    infoText:
      'Лохии не означают, что месячные уже вернулись. Возвращение месячных — отдельное событие, которое происходит позже.',
    section2Heading: '2. Как лохии меняются со временем?',
    section2Body:
      'Обычно их вид меняется в течение первых нескольких недель. Цвет постепенно светлеет, а количество, как правило, уменьшается.',
    evolutionTitle: 'Постепенные изменения',
    evolutionSubtitle: 'Этапы могут отличаться у разных женщин',
    evolution: [
      {
        label: 'Ярко-красные',
        period: 'Первые дни',
        text: 'Выделения обычно красного цвета и в начале могут быть обильнее.',
      },
      {
        label: 'Розоватые / коричневатые',
        period: 'Через несколько дней',
        text: 'Цвет постепенно светлеет и может смещаться к розоватому или коричневатому.',
      },
      {
        label: 'Беловато-жёлтые',
        period: 'В течение следующих недель',
        text: 'Выделения обычно становятся более скудными, желтоватыми или беловатыми, а затем прекращаются.',
      },
    ],
    section3Heading: '3. Что может быть нормой',
    section3Body:
      'Течение лохий не совсем одинаково у всех. Некоторые изменения могут естественно сопровождать восстановление после родов.',
    normalPoints: [
      {
        title: 'Количество меняется',
        text: 'В первые дни количество выделений может меняться, а затем постепенно уменьшается.',
      },
      {
        title: 'Цвет меняется',
        text: 'Со временем лохии обычно переходят от красного к более светлым оттенкам.',
      },
      {
        title: 'Разная длительность',
        text: 'Они могут сохраняться несколько недель, и их течение отличается у разных женщин.',
      },
    ],
    section4Heading: '4. Советы по комфорту и наблюдению',
    section4Body:
      'В этот период простое наблюдение поможет отслеживать, как меняется ваше тело, не сравнивая свой опыт с чужим.',
    comfortTips: [
      {
        title: 'Бережная гигиена',
        text: 'Отдавайте предпочтение мягкому регулярному подмыванию без раздражающих средств.',
      },
      {
        title: 'Следите за изменениями',
        text: 'Вы можете отмечать цвет, количество и динамику выделений, если это помогает вам следить за восстановлением.',
      },
      {
        title: 'Разрешите себе отдых',
        text: 'Послеродовой период требует времени. Прислушивайтесь к своему телу и уважайте потребность восстанавливаться.',
      },
    ],
    section5Heading: '5. Лохии или возвращение месячных?',
    section5Body:
      'Лохии появляются в первые дни после родов и постепенно уменьшаются. Возвращение месячных, напротив, означает возобновление менструального цикла после этого периода.',
    compareLochiaTitle: 'Лохии',
    compareLochiaText: 'Выделения, связанные с восстановлением матки после родов.',
    compareReturnTitle: 'Возвращение месячных',
    compareReturnText:
      'Возобновление менструального цикла в срок, который различается у разных женщин.',
    section6Heading: '6. Когда обращаться за медицинской консультацией?',
    section6Body:
      'Если течение кажется вам необычным или ваше общее состояние ухудшается, важно обратиться за советом к медицинскому специалисту.',
    warningTitle: 'Признаки, при которых нужна медицинская консультация',
    warningSigns: [
      'Сильный или необычный запах',
      'Повышенная температура или ухудшение общего состояния',
      'Выделения, которые внезапно становятся гораздо обильнее',
      'Сильная, стойкая или необычная боль',
      'Новый симптом, который вас беспокоит',
    ],
    tipTitle: 'ПОЛЕЗНО ЗНАТЬ',
    tipText:
      'Лохии обычно меняются постепенно: сначала они могут быть красными, затем светлеют и прекращаются. Однако восстановление у каждой женщины индивидуально.',
    summaryHeading: 'Главное',
    summaryPoints: [
      'Лохии — нормальные выделения после родов.',
      'Обычно в течение нескольких недель их цвет и количество меняются.',
      'Их длительность и течение могут отличаться у разных женщин.',
      'Необычный запах, повышенная температура, сильная боль или внезапное очень обильное кровотечение требуют медицинской консультации.',
    ],
    disclaimerText:
      'Информационный материал. Эта статья не заменяет медицинскую консультацию или осмотр. При сомнениях или если вы заметили тревожный симптом, обратитесь за советом к медицинскому специалисту.',
    shareMessage: 'Что такое лохии после родов — AWA',
  },
  de: {
    badgeText: 'WOCHENBETT • WOCHENFLUSS',
    title: 'Den Wochenfluss\nnach der Geburt verstehen',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Informationsinhalt',
    intro:
      'Nach der Geburt bezeichnet der Wochenfluss (Lochien) den Ausfluss aus der Scheide, der zum natürlichen Rückbildungsprozess der Gebärmutter gehört. Farbe und Menge verändern sich in den folgenden Tagen und Wochen nach und nach.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist der Wochenfluss?',
      'Wie verändert er sich im Lauf der Zeit?',
      'Was normal sein kann',
      'Tipps für mehr Wohlbefinden',
      'Wann solltest du ärztlichen Rat einholen?',
      'Das Wichtigste in Kürze',
    ],
    section1Heading: '1. Was ist der Wochenfluss?',
    section1Body1:
      'Der Wochenfluss ist ein Ausfluss aus der Scheide, der nach der Geburt auftritt. Er besteht vor allem aus Blut, Sekreten und Gewebe, die die Gebärmutter während ihrer Rückbildung nach und nach ausscheidet.',
    section1Body2:
      'Er unterscheidet sich von einer normalen Periode. Im Wochenbett ist er zu erwarten und lässt in der Regel schrittweise nach.',
    infoTitle: 'Das Wichtigste in Kürze',
    infoText:
      'Der Wochenfluss bedeutet nicht, dass deine Periode schon zurückgekehrt ist. Die Rückkehr der Periode ist ein eigenes Ereignis, das später eintritt.',
    section2Heading: '2. Wie verändert sich der Wochenfluss im Lauf der Zeit?',
    section2Body:
      'Sein Aussehen verändert sich in der Regel in den ersten Wochen. Die Farbe wird nach und nach heller, und die Menge nimmt tendenziell ab.',
    evolutionTitle: 'Ein schrittweiser Verlauf',
    evolutionSubtitle: 'Die Phasen können von Frau zu Frau unterschiedlich sein',
    evolution: [
      {
        label: 'Hellrot',
        period: 'Die ersten Tage',
        text: 'Der Ausfluss ist meist rot und kann zu Beginn stärker sein.',
      },
      {
        label: 'Rosa / bräunlich',
        period: 'Nach einigen Tagen',
        text: 'Die Farbe wird nach und nach heller und kann ins Rosa oder Bräunliche übergehen.',
      },
      {
        label: 'Weißlich-gelb',
        period: 'In den folgenden Wochen',
        text: 'Der Ausfluss wird meist heller, gelblich oder weißlich, bevor er ausläuft.',
      },
    ],
    section3Heading: '3. Was normal sein kann',
    section3Body:
      'Der Wochenfluss verläuft nicht bei allen genau gleich. Bestimmte Veränderungen können die Erholung nach der Geburt ganz natürlich begleiten.',
    normalPoints: [
      {
        title: 'Eine wechselnde Menge',
        text: 'Die Menge kann sich in den ersten Tagen verändern und dann nach und nach abnehmen.',
      },
      {
        title: 'Eine sich verändernde Farbe',
        text: 'Der Wochenfluss geht im Lauf der Zeit meist von Rot zu helleren Tönen über.',
      },
      {
        title: 'Eine unterschiedliche Dauer',
        text: 'Er kann mehrere Wochen anhalten, und sein Verlauf ist von Frau zu Frau verschieden.',
      },
    ],
    section4Heading: '4. Tipps für mehr Wohlbefinden und Beobachtung',
    section4Body:
      'In dieser Zeit kann einfaches Festhalten dir helfen zu beobachten, wie sich dein Körper verändert, ohne deine Erfahrung mit der einer anderen zu vergleichen.',
    comfortTips: [
      {
        title: 'Sanfte Hygiene',
        text: 'Bevorzuge sanftes, regelmäßiges Waschen ohne reizende Produkte.',
      },
      {
        title: 'Den Verlauf beobachten',
        text: 'Du kannst Farbe, Menge und Verlauf des Ausflusses notieren, wenn dir das hilft, deine Erholung zu verfolgen.',
      },
      {
        title: 'Gönne dir Ruhe',
        text: 'Das Wochenbett braucht Zeit. Höre auf deinen Körper und achte dein Bedürfnis nach Erholung.',
      },
    ],
    section5Heading: '5. Wochenfluss oder Rückkehr deiner Periode?',
    section5Body:
      'Der Wochenfluss tritt in den Tagen nach der Geburt auf und lässt nach und nach nach. Die Rückkehr deiner Periode dagegen bedeutet, dass dein Menstruationszyklus nach dieser Zeit wieder einsetzt.',
    compareLochiaTitle: 'Wochenfluss',
    compareLochiaText: 'Ausfluss im Zusammenhang mit der Rückbildung der Gebärmutter nach der Geburt.',
    compareReturnTitle: 'Rückkehr deiner Periode',
    compareReturnText:
      'Wiedereinsetzen des Menstruationszyklus, zu einem Zeitpunkt, der von Frau zu Frau unterschiedlich ist.',
    section6Heading: '6. Wann solltest du ärztlichen Rat einholen?',
    section6Body:
      'Wenn dir der Verlauf ungewöhnlich erscheint oder sich dein Allgemeinzustand verschlechtert, ist es wichtig, dir Rat bei medizinischem Fachpersonal zu holen.',
    warningTitle: 'Anzeichen, die ärztlichen Rat erfordern',
    warningSigns: [
      'Ein starker oder ungewöhnlicher Geruch',
      'Fieber oder ein sich verschlechternder Allgemeinzustand',
      'Eine Blutung, die plötzlich deutlich stärker wird',
      'Starke, anhaltende oder ungewöhnliche Schmerzen',
      'Ein neues Symptom, das dich beunruhigt',
    ],
    tipTitle: 'Gut zu wissen',
    tipText:
      'Der Wochenfluss verändert sich in der Regel schrittweise: Er kann zunächst rot sein, dann heller werden und schließlich auslaufen. Jede Erholung verläuft jedoch individuell.',
    summaryHeading: 'Das Wichtigste in Kürze',
    summaryPoints: [
      'Der Wochenfluss ist ein normaler Ausfluss nach der Geburt.',
      'Farbe und Menge verändern sich in der Regel im Lauf der Wochen.',
      'Dauer und Verlauf können von Frau zu Frau unterschiedlich sein.',
      'Ein ungewöhnlicher Geruch, Fieber, starke Schmerzen oder eine plötzliche, sehr starke Blutung erfordern ärztlichen Rat.',
    ],
    disclaimerText:
      'Informationsinhalt. Dieser Artikel ersetzt weder ärztliche Beratung noch eine Untersuchung. Bei Zweifeln oder wenn dir ein besorgniserregendes Symptom auffällt, wende dich an medizinisches Fachpersonal.',
    shareMessage: 'Den Wochenfluss nach der Geburt verstehen – AWA',
  },
  zh: {
      badgeText: '产后 • 恶露',
      title: '了解产后\n恶露',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '科普内容',
      intro: '分娩后，恶露是指与子宫自然恢复过程相关的阴道分泌物。它的颜色和量会在随后的几天和几周里逐渐变化。',
      contentsTitle: '本文内容',
      topics: [
        '什么是恶露？',
        '它会如何随时间变化？',
        '哪些情况可能是正常的',
        '舒适小贴士',
        '何时该就医咨询？',
        '要点回顾',
      ],
      section1Heading: '1. 什么是恶露？',
      section1Body1: '恶露是分娩后出现的阴道分泌物，主要是子宫在恢复过程中逐渐排出的血液、分泌物和组织。',
      section1Body2: '它与普通月经不同。恶露在产后属于预期中的现象，通常会逐渐减少。',
      infoTitle: '要点回顾',
      infoText: '恶露并不表示月经已经恢复。月经的恢复是另一件事，会在稍后发生。',
      section2Heading: '2. 恶露会如何随时间变化？',
      section2Body: '它的外观通常会在最初几周里发生变化。颜色会逐渐变浅，量也往往会减少。',
      evolutionTitle: '循序渐进的变化',
      evolutionSubtitle: '各个阶段因人而异',
      evolution: [
        {
          label: '鲜红色',
          period: '最初几天',
          text: '分泌物通常为红色，一开始量可能较多。',
        },
        {
          label: '粉色 / 褐色',
          period: '几天之后',
          text: '颜色会逐渐变浅，可能转为粉色或褐色。',
        },
        {
          label: '淡黄白色',
          period: '接下来的几周',
          text: '分泌物通常会变得更少，呈淡黄色或白色，然后逐渐消失。',
        },
      ],
      section3Heading: '3. 哪些情况可能是正常的',
      section3Body: '恶露的变化过程并不是人人完全一样。产后恢复期间，出现某些变化可能是自然的。',
      normalPoints: [
        {
          title: '量有变化',
          text: '量可能在最初几天有所变化，随后逐渐减少。',
        },
        {
          title: '颜色会变化',
          text: '恶露通常会随时间从红色逐渐变为较浅的颜色。',
        },
        {
          title: '持续时间不一',
          text: '它可能持续数周，具体变化过程因人而异。',
        },
      ],
      section4Heading: '4. 舒适与记录小贴士',
      section4Body: '这段时间里，简单的记录可以帮助你观察身体的变化，而不必拿自己的经历与别人比较。',
      comfortTips: [
        {
          title: '温和清洁',
          text: '建议温和、规律地清洗，避免使用有刺激性的产品。',
        },
        {
          title: '留意变化',
          text: '如果对追踪恢复情况有帮助，你可以记录分泌物的颜色、量和变化过程。',
        },
        {
          title: '允许自己休息',
          text: '产后恢复需要时间。倾听身体的声音，尊重自己恢复的需要。',
        },
      ],
      section5Heading: '5. 是恶露，还是月经恢复？',
      section5Body: '恶露出现在分娩后的几天里，并会逐渐减少。而月经恢复，则是指在这段时期之后月经周期重新开始。',
      compareLochiaTitle: '恶露',
      compareLochiaText: '与产后子宫恢复相关的分泌物。',
      compareReturnTitle: '月经恢复',
      compareReturnText: '月经周期重新开始，时间因人而异。',
      section6Heading: '6. 何时该就医咨询？',
      section6Body: '如果你觉得恶露的变化过程不太寻常，或者整体状况在变差，请务必向医疗专业人员咨询。',
      warningTitle: '需要就医咨询的信号',
      warningSigns: [
        '有强烈或异常的气味',
        '发热或整体状况变差',
        '出血量突然明显增多',
        '明显、持续或异常的疼痛',
        '出现让你担心的新症状',
      ],
      tipTitle: '小贴士',
      tipText: '恶露通常会逐渐变化：一开始可能是红色，之后变浅，再逐渐消失。不过，每个人的恢复过程都是个体化的。',
      summaryHeading: '要点回顾',
      summaryPoints: [
        '恶露是分娩后正常的分泌物。',
        '它的颜色和量通常会在几周内发生变化。',
        '持续时间和变化过程因人而异。',
        '异常气味、发热、明显疼痛，或突然大量出血，都需要就医咨询。',
      ],
      disclaimerText: '科普内容。本文不能替代医疗建议或检查。如有疑虑，或出现令你担心的症状，请咨询医疗专业人员。',
      shareMessage: '了解产后恶露 — AWA',
    },
  id: {
    badgeText: 'PASCAPERSALINAN • LOKIA',
    title: 'Memahami lokia\nsetelah melahirkan',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten informatif',
    intro: 'Setelah melahirkan, lokia adalah keluarnya cairan dari vagina yang berkaitan dengan proses alami pemulihan rahim. Warna dan jumlahnya berubah secara bertahap selama hari dan minggu berikutnya.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu lokia?',
      'Bagaimana perubahannya seiring waktu?',
      'Apa yang bisa dianggap normal',
      'Tips kenyamanan',
      'Kapan perlu berkonsultasi ke tenaga medis?',
      'Poin-poin penting',
    ],
    section1Heading: '1. Apa itu lokia?',
    section1Body1: 'Lokia adalah cairan dari vagina yang muncul setelah melahirkan. Cairan ini terutama terdiri dari darah, sekret, dan jaringan yang secara bertahap dikeluarkan dari rahim selama proses pemulihannya.',
    section1Body2: 'Lokia berbeda dari haid biasa. Lokia memang diharapkan terjadi pada masa pascapersalinan dan umumnya berkurang secara bertahap.',
    infoTitle: 'Poin-poin penting',
    infoText: 'Lokia tidak berarti haidmu sudah kembali. Kembalinya haid adalah peristiwa yang terpisah dan terjadi lebih lambat.',
    section2Heading: '2. Bagaimana lokia berubah seiring waktu?',
    section2Body: 'Tampilannya biasanya berubah selama beberapa minggu pertama. Warnanya berangsur-angsur menjadi lebih terang dan jumlahnya cenderung berkurang.',
    evolutionTitle: 'Perkembangan yang bertahap',
    evolutionSubtitle: 'Tahapannya bisa berbeda dari satu orang ke orang lain',
    evolution: [
      {
        label: 'Merah terang',
        period: 'Beberapa hari pertama',
        text: 'Cairan biasanya berwarna merah dan bisa lebih banyak pada awalnya.',
      },
      {
        label: 'Merah muda / kecokelatan',
        period: 'Setelah beberapa hari',
        text: 'Warnanya berangsur-angsur menjadi lebih terang dan bisa bergeser ke merah muda atau cokelat.',
      },
      {
        label: 'Putih kekuningan',
        period: 'Selama minggu-minggu berikutnya',
        text: 'Cairan biasanya menjadi lebih ringan, kekuningan atau keputihan, sebelum akhirnya berhenti.',
      },
    ],
    section3Heading: '3. Apa yang bisa dianggap normal',
    section3Body: 'Perkembangan lokia tidak persis sama pada setiap orang. Beberapa perubahan bisa menyertai pemulihan setelah melahirkan secara alami.',
    normalPoints: [
      {
        title: 'Jumlah yang bervariasi',
        text: 'Jumlahnya bisa berubah selama beberapa hari pertama lalu berkurang secara bertahap.',
      },
      {
        title: 'Warna yang berubah',
        text: 'Lokia biasanya bergeser dari merah ke warna yang lebih terang seiring waktu.',
      },
      {
        title: 'Durasi yang bervariasi',
        text: 'Lokia bisa berlangsung selama beberapa minggu, dan perkembangannya berbeda dari satu orang ke orang lain.',
      },
    ],
    section4Heading: '4. Tips kenyamanan dan pemantauan',
    section4Body: 'Pada masa ini, pemantauan sederhana bisa membantumu mengamati perubahan tubuhmu tanpa membandingkan pengalamanmu dengan orang lain.',
    comfortTips: [
      {
        title: 'Kebersihan yang lembut',
        text: 'Utamakan membasuh dengan lembut dan teratur tanpa produk yang mengiritasi.',
      },
      {
        title: 'Amati perkembangannya',
        text: 'Kamu bisa mencatat warna, jumlah, dan perkembangan cairan jika itu membantumu memantau pemulihan.',
      },
      {
        title: 'Beri dirimu waktu istirahat',
        text: 'Masa pascapersalinan membutuhkan waktu. Dengarkan tubuhmu dan hargai kebutuhanmu untuk pulih.',
      },
    ],
    section5Heading: '5. Lokia atau haid yang kembali?',
    section5Body: 'Lokia muncul pada hari-hari setelah melahirkan dan berkurang secara bertahap. Sebaliknya, kembalinya haid menandakan siklus menstruasimu dimulai lagi setelah masa ini.',
    compareLochiaTitle: 'Lokia',
    compareLochiaText: 'Cairan yang berkaitan dengan pemulihan rahim setelah melahirkan.',
    compareReturnTitle: 'Haid kembali',
    compareReturnText: 'Siklus menstruasi dimulai lagi, pada waktu yang berbeda-beda dari satu orang ke orang lain.',
    section6Heading: '6. Kapan perlu berkonsultasi ke tenaga medis?',
    section6Body: 'Jika perkembangannya terasa tidak biasa bagimu, atau kondisi umummu memburuk, penting untuk meminta saran dari tenaga kesehatan.',
    warningTitle: 'Tanda yang memerlukan saran medis',
    warningSigns: [
      'Bau yang kuat atau tidak biasa',
      'Demam atau kondisi umum yang memburuk',
      'Aliran darah yang tiba-tiba menjadi jauh lebih banyak',
      'Nyeri yang hebat, menetap, atau tidak biasa',
      'Gejala baru yang membuatmu khawatir',
    ],
    tipTitle: 'Perlu diketahui',
    tipText: 'Lokia biasanya berkembang secara bertahap: bisa berwarna merah pada awalnya, lalu menjadi lebih terang sebelum akhirnya berhenti. Namun, setiap pemulihan bersifat individual.',
    summaryHeading: 'Poin-poin penting',
    summaryPoints: [
      'Lokia adalah cairan normal setelah persalinan.',
      'Warna dan jumlahnya biasanya berubah selama beberapa minggu.',
      'Durasi dan perkembangannya bisa berbeda dari satu orang ke orang lain.',
      'Bau yang tidak biasa, demam, nyeri hebat, atau perdarahan yang tiba-tiba sangat banyak memerlukan saran medis.',
    ],
    disclaimerText: 'Konten informatif. Artikel ini tidak menggantikan saran atau pemeriksaan medis. Jika ragu atau kamu menemukan gejala yang mengkhawatirkan, mintalah saran dari tenaga kesehatan.',
    shareMessage: 'Memahami lokia setelah melahirkan — AWA',
  },
  hi: {
    badgeText: 'प्रसवोत्तर • लोकिया',
    title: 'प्रसव के बाद लोकिया\nको समझना',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जानकारी देने वाली सामग्री',
    intro: 'बच्चे के जन्म के बाद लोकिया वह योनि स्राव है, जो गर्भाशय के प्राकृतिक रूप से ठीक होने की प्रक्रिया से जुड़ा होता है। आने वाले दिनों और सप्ताहों में इसका रंग और मात्रा धीरे-धीरे बदलती जाती है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'लोकिया क्या है?',
      'समय के साथ यह कैसे बदलता है?',
      'क्या सामान्य हो सकता है',
      'आराम के सुझाव',
      'डॉक्टर की सलाह कब लें?',
      'मुख्य बातें',
    ],
    section1Heading: '1. लोकिया क्या है?',
    section1Body1: 'लोकिया बच्चे के जन्म के बाद होने वाला योनि स्राव है। गर्भाशय जब ठीक हो रहा होता है, तो उससे रक्त, स्राव और ऊतक धीरे-धीरे बाहर निकलते हैं, यही मुख्य रूप से लोकिया है।',
    section1Body2: 'यह सामान्य पीरियड से अलग है। प्रसव के बाद के समय में इसका होना अपेक्षित है और यह आमतौर पर धीरे-धीरे कम होता जाता है।',
    infoTitle: 'मुख्य बातें',
    infoText: 'लोकिया का मतलब यह नहीं कि आपके पीरियड वापस आ गए हैं। पीरियड का लौटना एक अलग घटना है, जो बाद में होती है।',
    section2Heading: '2. समय के साथ लोकिया कैसे बदलता है?',
    section2Body: 'शुरुआती कुछ सप्ताहों में इसका रूप आमतौर पर बदलता रहता है। रंग धीरे-धीरे हल्का होता जाता है और मात्रा कम होने लगती है।',
    evolutionTitle: 'धीरे-धीरे होने वाला बदलाव',
    evolutionSubtitle: 'चरण हर महिला में अलग हो सकते हैं',
    evolution: [
      {
        label: 'गहरा लाल',
        period: 'शुरुआती दिन',
        text: 'स्राव आमतौर पर लाल होता है और शुरुआत में ज़्यादा हो सकता है।',
      },
      {
        label: 'गुलाबी / भूरा-सा',
        period: 'कुछ दिनों के बाद',
        text: 'रंग धीरे-धीरे हल्का होता जाता है और गुलाबी या भूरे की ओर बदल सकता है।',
      },
      {
        label: 'सफ़ेद-पीला',
        period: 'आने वाले सप्ताहों में',
        text: 'स्राव आमतौर पर हल्का, पीला या सफ़ेद-सा हो जाता है और फिर धीरे-धीरे बंद हो जाता है।',
      },
    ],
    section3Heading: '3. क्या सामान्य हो सकता है',
    section3Body: 'लोकिया का बदलाव सभी में बिल्कुल एक जैसा नहीं होता। प्रसव के बाद ठीक होने के दौरान कुछ बदलाव स्वाभाविक रूप से हो सकते हैं।',
    normalPoints: [
      {
        title: 'मात्रा में फ़र्क़',
        text: 'शुरुआती कुछ दिनों में मात्रा बदल सकती है और फिर धीरे-धीरे कम होती जाती है।',
      },
      {
        title: 'बदलता रंग',
        text: 'लोकिया आमतौर पर समय के साथ लाल से हल्के रंगों की ओर बढ़ता है।',
      },
      {
        title: 'अलग-अलग अवधि',
        text: 'यह कई सप्ताहों तक बना रह सकता है, और इसका बदलाव हर महिला में अलग होता है।',
      },
    ],
    section4Heading: '4. आराम और ट्रैकिंग के सुझाव',
    section4Body: 'इस दौरान आसान-सी ट्रैकिंग से आप देख सकती हैं कि आपका शरीर कैसे बदल रहा है, और अपने अनुभव की तुलना किसी और से करने की ज़रूरत नहीं पड़ती।',
    comfortTips: [
      {
        title: 'नरम सफ़ाई',
        text: 'जलन पैदा करने वाले प्रोडक्ट के बिना, हल्की और नियमित सफ़ाई को चुनें।',
      },
      {
        title: 'बदलाव पर नज़र रखें',
        text: 'अगर इससे आपको ठीक होने की प्रगति समझने में मदद मिलती है, तो आप स्राव का रंग, मात्रा और बदलाव नोट कर सकती हैं।',
      },
      {
        title: 'खुद को आराम करने दें',
        text: 'प्रसव के बाद का समय लगता है। अपने शरीर की सुनें और ठीक होने की ज़रूरत का सम्मान करें।',
      },
    ],
    section5Heading: '5. लोकिया या पीरियड की वापसी?',
    section5Body: 'लोकिया प्रसव के बाद के दिनों में शुरू होता है और धीरे-धीरे कम होता जाता है। वहीं पीरियड की वापसी का मतलब है इस दौर के बाद आपके मासिक चक्र का फिर से शुरू होना।',
    compareLochiaTitle: 'लोकिया',
    compareLochiaText: 'प्रसव के बाद गर्भाशय के ठीक होने से जुड़ा स्राव।',
    compareReturnTitle: 'पीरियड की वापसी',
    compareReturnText: 'मासिक चक्र का फिर से शुरू होना, जिसका समय हर महिला में अलग होता है।',
    section6Heading: '6. डॉक्टर की सलाह कब लें?',
    section6Body: 'अगर आपको बदलाव असामान्य लगे, या आपकी सेहत बिगड़ रही हो, तो किसी स्वास्थ्य विशेषज्ञ से सलाह लेना ज़रूरी है।',
    warningTitle: 'ऐसे संकेत जिनमें डॉक्टरी सलाह चाहिए',
    warningSigns: [
      'तेज़ या असामान्य गंध',
      'बुखार या सामान्य हालत का बिगड़ना',
      'बहाव का अचानक बहुत ज़्यादा हो जाना',
      'तेज़, लगातार या असामान्य दर्द',
      'कोई नया लक्षण जो आपको चिंतित करे',
    ],
    tipTitle: 'जानना ज़रूरी है',
    tipText: 'लोकिया आमतौर पर धीरे-धीरे बदलता है: शुरुआत में यह लाल हो सकता है, फिर हल्का होता जाता है और धीरे-धीरे बंद हो जाता है। फिर भी, ठीक होने का तरीका हर महिला का अपना होता है।',
    summaryHeading: 'मुख्य बातें',
    summaryPoints: [
      'लोकिया प्रसव के बाद होने वाला सामान्य स्राव है।',
      'सप्ताहों के दौरान इसका रंग और मात्रा आमतौर पर बदलती है।',
      'इसकी अवधि और बदलाव हर महिला में अलग हो सकते हैं।',
      'असामान्य गंध, बुखार, तेज़ दर्द या अचानक बहुत ज़्यादा रक्तस्राव होने पर डॉक्टरी सलाह ज़रूरी है।',
    ],
    disclaimerText: 'जानकारी देने वाली सामग्री। यह लेख डॉक्टरी सलाह या जाँच का विकल्प नहीं है। शंका होने पर या कोई चिंताजनक लक्षण दिखने पर किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'प्रसव के बाद लोकिया को समझना — AWA',
  },
  sq: {
    badgeText: 'PAS LINDJES • LOHIA',
    title: 'Të kuptosh lohinë\npas lindjes',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje informuese',
    intro: 'Pas lindjes, lohia është shkarkimi vaginal që lidhet me procesin natyror të rikuperimit të mitrës. Ngjyra dhe sasia e saj ndryshojnë gradualisht gjatë ditëve dhe javëve në vijim.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë është lohia?',
      'Si ndryshon me kalimin e kohës?',
      'Çfarë mund të jetë normale',
      'Këshilla për rehati',
      'Kur të kërkosh këshillë mjekësore?',
      'Pikat kryesore',
    ],
    section1Heading: '1. Çfarë është lohia?',
    section1Body1: 'Lohia është shkarkim vaginal që shfaqet pas lindjes. Ajo përbëhet kryesisht nga largimi gradual i gjakut, i sekrecioneve dhe i indit nga mitra, ndërsa ajo rikuperohet.',
    section1Body2: 'Ajo është e ndryshme nga menstruacionet e zakonshme. Pritet gjatë periudhës pas lindjes dhe në përgjithësi pakësohet gradualisht.',
    infoTitle: 'Pikat kryesore',
    infoText: 'Lohia nuk do të thotë se menstruacionet e tua janë kthyer tashmë. Kthimi i menstruacioneve është një ngjarje e veçantë që ndodh më vonë.',
    section2Heading: '2. Si ndryshon lohia me kalimin e kohës?',
    section2Body: 'Pamja e saj zakonisht ndryshon gjatë javëve të para. Ngjyra bëhet gradualisht më e çelët dhe sasia priret të pakësohet.',
    evolutionTitle: 'Një zhvillim gradual',
    evolutionSubtitle: 'Fazat mund të ndryshojnë nga një grua te tjetra',
    evolution: [
      {
        label: 'E kuqe e ndezur',
        period: 'Ditët e para',
        text: 'Shkarkimi zakonisht është i kuq dhe mund të jetë më i bollshëm në fillim.',
      },
      {
        label: 'Rozë / kafeje',
        period: 'Pas disa ditësh',
        text: 'Ngjyra bëhet gradualisht më e çelët dhe mund të kalojë drejt rozës ose kafesë.',
      },
      {
        label: 'E bardhë-e verdhë',
        period: 'Gjatë javëve në vijim',
        text: 'Shkarkimi zakonisht bëhet më i lehtë, i verdhë ose i bardhë, para se të shuhet.',
      },
    ],
    section3Heading: '3. Çfarë mund të jetë normale',
    section3Body: 'Mënyra se si zhvillohet lohia nuk është saktësisht e njëjtë për të gjitha. Disa ndryshime mund ta shoqërojnë natyrshëm rikuperimin pas lindjes.',
    normalPoints: [
      {
        title: 'Një sasi që ndryshon',
        text: 'Sasia mund të ndryshojë gjatë ditëve të para dhe pastaj të pakësohet gradualisht.',
      },
      {
        title: 'Një ngjyrë që ndryshon',
        text: 'Lohia zakonisht kalon nga e kuqja drejt nuancave më të çelëta me kalimin e kohës.',
      },
      {
        title: 'Një kohëzgjatje që ndryshon',
        text: 'Mund të vazhdojë për disa javë dhe zhvillimi i saj ndryshon nga një grua te tjetra.',
      },
    ],
    section4Heading: '4. Këshilla për rehati dhe ndjekje',
    section4Body: 'Në këtë periudhë, një ndjekje e thjeshtë mund të të ndihmojë të vëzhgosh si po ndryshon trupi yt, pa e krahasuar përvojën tënde me atë të dikujt tjetër.',
    comfortTips: [
      {
        title: 'Higjienë e butë',
        text: 'Zgjidh larje të butë dhe të rregullt, pa produkte që irritojnë.',
      },
      {
        title: 'Vëzhgo zhvillimin',
        text: 'Mund të shënosh ngjyrën, sasinë dhe ecurinë e shkarkimit nëse të ndihmon të ndjekësh rikuperimin.',
      },
      {
        title: 'Lejo veten të pushosh',
        text: 'Periudha pas lindjes kërkon kohë. Dëgjo trupin tënd dhe respekto nevojën për t’u rikuperuar.',
      },
    ],
    section5Heading: '5. Lohia apo kthimi i menstruacioneve?',
    section5Body: 'Lohia shfaqet në ditët pas lindjes dhe pakësohet gradualisht. Kthimi i menstruacioneve, nga ana tjetër, i përgjigjet rifillimit të ciklit tënd menstrual pas kësaj periudhe.',
    compareLochiaTitle: 'Lohia',
    compareLochiaText: 'Shkarkim që lidhet me rikuperimin e mitrës pas lindjes.',
    compareReturnTitle: 'Kthimi i menstruacioneve',
    compareReturnText: 'Rifillimi i ciklit menstrual, në një kohë që ndryshon nga një grua te tjetra.',
    section6Heading: '6. Kur të kërkosh këshillë mjekësore?',
    section6Body: 'Nëse ecuria të duket e pazakontë, ose nëse gjendja jote e përgjithshme po përkeqësohet, është e rëndësishme të kërkosh këshillë nga një profesionist i shëndetësisë.',
    warningTitle: 'Shenja që kërkojnë këshillë mjekësore',
    warningSigns: [
      'Një erë e fortë ose e pazakontë',
      'Ethe ose një gjendje e përgjithshme që përkeqësohet',
      'Një rrjedhje që befas bëhet shumë më e bollshme',
      'Dhimbje e fortë, e vazhdueshme ose e pazakontë',
      'Një simptomë e re që të shqetëson',
    ],
    tipTitle: 'Mirë është ta dish',
    tipText: 'Lohia zakonisht zhvillohet gradualisht: mund të jetë e kuqe në fillim, pastaj bëhet më e çelët para se të shuhet. Megjithatë, çdo rikuperim është individual.',
    summaryHeading: 'Pikat kryesore',
    summaryPoints: [
      'Lohia është shkarkim normal pas lindjes.',
      'Zakonisht ndryshon në ngjyrë dhe sasi gjatë javëve.',
      'Kohëzgjatja dhe ecuria e saj mund të ndryshojnë nga një grua te tjetra.',
      'Një erë e pazakontë, ethet, dhimbja e fortë ose një gjakderdhje e befasishme shumë e bollshme kërkojnë këshillë mjekësore.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson këshillën mjekësore ose një ekzaminim. Në rast dyshimi ose nëse vëren një simptomë shqetësuese, kërko këshillë nga një profesionist i shëndetësisë.',
    shareMessage: 'Të kuptosh lohinë pas lindjes — AWA',
  },
  ja: {
    badgeText: '産後 • 悪露',
    title: '出産後の悪露を\n理解する',
    metaDuration: '読了時間6分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '情報提供のための内容',
    intro: '出産後の悪露（おろ）とは、子宮が回復していく自然な過程にともなう腟からの分泌物のことです。色や量は、その後の数日から数週間でゆるやかに変化していきます。',
    contentsTitle: 'この記事の内容',
    topics: [
      '悪露とは？',
      '時間とともにどう変わる？',
      '正常な範囲で見られること',
      '快適に過ごすヒント',
      'どんなときに医師に相談する？',
      'ポイントのまとめ',
    ],
    section1Heading: '1. 悪露とは？',
    section1Body1: '悪露は、出産後に見られる腟からの分泌物です。子宮が回復していくなかで、血液、分泌物、組織が少しずつ排出されたものが主な成分です。',
    section1Body2: '通常の生理とは異なります。産後には自然に見られるもので、一般的に少しずつ減っていきます。',
    infoTitle: 'ポイントのまとめ',
    infoText: '悪露があるからといって、すでに生理が戻ったわけではありません。生理の再開は、もっとあとに起こる別の出来事です。',
    section2Heading: '2. 悪露は時間とともにどう変わる？',
    section2Body: '見た目は、最初の数週間で通常変化していきます。色は少しずつ薄くなり、量は減っていく傾向があります。',
    evolutionTitle: '少しずつ進む変化',
    evolutionSubtitle: '変化の段階には個人差があります',
    evolution: [
      {
        label: '鮮やかな赤',
        period: '最初の数日',
        text: '分泌物は通常赤く、始めのうちは量が多いことがあります。',
      },
      {
        label: 'ピンク色・茶色っぽい色',
        period: '数日後',
        text: '色は少しずつ薄くなり、ピンク色や茶色に変わることがあります。',
      },
      {
        label: '黄白色',
        period: 'その後の数週間',
        text: '分泌物は通常さらに薄くなり、黄色っぽいか白っぽくなってから、次第に終わっていきます。',
      },
    ],
    section3Heading: '3. 正常な範囲で見られること',
    section3Body: '悪露の経過は、すべての人がまったく同じというわけではありません。出産後の回復にともなって、自然に起こる変化もあります。',
    normalPoints: [
      {
        title: '量の変化',
        text: '量は最初の数日で変わることがあり、その後少しずつ減っていきます。',
      },
      {
        title: '色の変化',
        text: '悪露は通常、赤からだんだん薄い色へと変わっていきます。',
      },
      {
        title: '期間の違い',
        text: '数週間続くこともあり、経過の仕方には個人差があります。',
      },
    ],
    section4Heading: '4. 快適に過ごすためのヒントと記録のコツ',
    section4Body: 'この時期は、簡単な記録をつけることで、他の人の経験と比べることなく、ご自身の体の変化を見守ることができます。',
    comfortTips: [
      {
        title: 'やさしい清潔ケア',
        text: '刺激の強い製品は使わず、やさしく定期的に洗いましょう。',
      },
      {
        title: '経過を見守る',
        text: '回復の様子を確かめるのに役立つなら、分泌物の色、量、経過をメモしておくとよいでしょう。',
      },
      {
        title: '自分に休息を許す',
        text: '産後には時間が必要です。体の声に耳を傾け、回復したいという気持ちを大切にしてください。',
      },
    ],
    section5Heading: '5. 悪露か、生理の再開か？',
    section5Body: '悪露は出産後の数日間に現れ、少しずつ減っていきます。一方、生理の再開とは、この時期を過ぎてから生理周期が戻ることを指します。',
    compareLochiaTitle: '悪露',
    compareLochiaText: '出産後の子宮の回復にともなう分泌物です。',
    compareReturnTitle: '生理の再開',
    compareReturnText: '生理周期が再開することで、その時期には個人差があります。',
    section6Heading: '6. どんなときに医師に相談する？',
    section6Body: '経過がいつもと違うと感じるときや、全身の状態が悪くなっているときは、医療従事者に相談することが大切です。',
    warningTitle: '医師への相談が必要なサイン',
    warningSigns: [
      '強いにおい、またはいつもと違うにおい',
      '発熱、または全身の状態の悪化',
      '出血量が急にとても多くなる',
      '強い痛み、続く痛み、またはいつもと違う痛み',
      '気になる新しい症状',
    ],
    tipTitle: '知っておきたいこと',
    tipText: '悪露は通常少しずつ変化します。最初は赤く、やがて薄い色になり、次第に終わっていきます。ただし、回復の仕方は人それぞれです。',
    summaryHeading: 'ポイントのまとめ',
    summaryPoints: [
      '悪露は出産後に見られる正常な分泌物です。',
      '通常、数週間のうちに色と量が変化します。',
      '期間や経過には個人差があります。',
      'いつもと違うにおい、発熱、強い痛み、急に非常に多くなる出血があるときは、医師に相談してください。',
    ],
    disclaimerText: '情報提供のための内容です。この記事は、医師のアドバイスや診察に代わるものではありません。不安がある場合や気になる症状がある場合は、医療従事者にご相談ください。',
    shareMessage: '出産後の悪露を理解する — AWA',
  },
  ko: {
    badgeText: '산후 • 오로',
    title: '출산 후 오로\n이해하기',
    metaDuration: '읽는 데 6분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '정보 제공용 콘텐츠',
    intro: '출산 후 오로는 자궁이 회복되는 자연스러운 과정과 관련된 질 분비물을 말해요. 색과 양은 이후 며칠, 몇 주에 걸쳐 서서히 달라져요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '오로란 무엇일까요?',
      '시간이 지나면서 어떻게 달라질까요?',
      '정상일 수 있는 것',
      '편안하게 지내는 팁',
      '언제 진료를 받아야 할까요?',
      '핵심 정리',
    ],
    section1Heading: '1. 오로란 무엇일까요?',
    section1Body1: '오로는 출산 후에 나오는 질 분비물이에요. 자궁이 회복되면서 혈액, 분비물, 조직이 서서히 배출되는 것이 주된 내용이에요.',
    section1Body2: '일반적인 생리와는 달라요. 산후 기간에 나타나는 것이 자연스러우며, 보통 점차 줄어들어요.',
    infoTitle: '핵심 정리',
    infoText: '오로가 있다고 해서 생리가 이미 돌아왔다는 뜻은 아니에요. 생리의 재개는 나중에 일어나는 별개의 일이에요.',
    section2Heading: '2. 오로는 시간이 지나면서 어떻게 달라질까요?',
    section2Body: '겉모습은 보통 처음 몇 주 동안 달라져요. 색은 서서히 옅어지고 양은 줄어드는 경향이 있어요.',
    evolutionTitle: '서서히 변해 가요',
    evolutionSubtitle: '단계는 사람마다 다를 수 있어요',
    evolution: [
      {
        label: '선홍색',
        period: '처음 며칠',
        text: '분비물은 대개 붉고, 처음에는 양이 더 많을 수 있어요.',
      },
      {
        label: '분홍색 / 갈색빛',
        period: '며칠 후',
        text: '색이 서서히 옅어지면서 분홍색이나 갈색빛으로 바뀔 수 있어요.',
      },
      {
        label: '흰색 섞인 노란색',
        period: '이후 몇 주 동안',
        text: '분비물은 대개 더 옅은 노란색이나 흰색이 되었다가 점차 줄어들어요.',
      },
    ],
    section3Heading: '3. 정상일 수 있는 것',
    section3Body: '오로가 달라지는 모습은 모두 똑같지 않아요. 출산 후 회복 과정에서 자연스럽게 나타날 수 있는 변화가 있어요.',
    normalPoints: [
      {
        title: '달라지는 양',
        text: '양은 처음 며칠 동안 달라질 수 있고, 이후 서서히 줄어들어요.',
      },
      {
        title: '변하는 색',
        text: '오로는 보통 시간이 지나면서 붉은색에서 더 옅은 색으로 바뀌어요.',
      },
      {
        title: '다양한 기간',
        text: '몇 주 동안 이어질 수 있고, 진행되는 모습은 사람마다 달라요.',
      },
    ],
    section4Heading: '4. 편안하게 지내는 팁과 기록하기',
    section4Body: '이 시기에는 간단히 기록해 두면 몸이 어떻게 달라지는지 살펴보는 데 도움이 돼요. 다른 사람의 경험과 비교하지 않아도 괜찮아요.',
    comfortTips: [
      {
        title: '부드러운 위생 관리',
        text: '자극적인 제품 없이 부드럽게, 규칙적으로 씻어요.',
      },
      {
        title: '변화 지켜보기',
        text: '회복 과정을 파악하는 데 도움이 된다면 분비물의 색, 양, 진행 상황을 기록해 둘 수 있어요.',
      },
      {
        title: '충분히 쉬기',
        text: '산후에는 시간이 필요해요. 몸의 소리에 귀 기울이고, 회복하고 싶은 마음을 존중해 주세요.',
      },
    ],
    section5Heading: '5. 오로일까요, 생리가 돌아온 걸까요?',
    section5Body: '오로는 출산 후 며칠 동안 나타나고 점차 줄어들어요. 반면 생리의 재개는 이 시기가 지난 뒤 생리 주기가 다시 시작되는 것을 말해요.',
    compareLochiaTitle: '오로',
    compareLochiaText: '출산 후 자궁이 회복되는 과정과 관련된 분비물이에요.',
    compareReturnTitle: '생리의 재개',
    compareReturnText: '생리 주기가 다시 시작되는 것으로, 시기는 사람마다 달라요.',
    section6Heading: '6. 언제 진료를 받아야 할까요?',
    section6Body: '진행 상황이 평소와 다르게 느껴지거나 전반적인 상태가 나빠지고 있다면 의료 전문가의 조언을 받는 것이 중요해요.',
    warningTitle: '진료가 필요한 신호',
    warningSigns: [
      '강하거나 평소와 다른 냄새',
      '열이 나거나 전반적인 상태가 나빠짐',
      '출혈량이 갑자기 훨씬 많아짐',
      '심하거나, 계속되거나, 평소와 다른 통증',
      '걱정되는 새로운 증상',
    ],
    tipTitle: '알아 두면 좋아요',
    tipText: '오로는 보통 서서히 달라져요. 처음에는 붉다가 점차 옅어지고 나서 줄어들 수 있어요. 다만 회복 과정은 사람마다 달라요.',
    summaryHeading: '핵심 정리',
    summaryPoints: [
      '오로는 출산 후에 나타나는 정상적인 분비물이에요.',
      '보통 몇 주에 걸쳐 색과 양이 달라져요.',
      '기간과 진행 모습은 사람마다 다를 수 있어요.',
      '평소와 다른 냄새, 열, 심한 통증, 갑작스럽게 많아진 출혈이 있다면 진료를 받아야 해요.',
    ],
    disclaimerText: '정보 제공용 콘텐츠예요. 이 아티클은 의학적 조언이나 진찰을 대신하지 않아요. 걱정되거나 신경 쓰이는 증상이 있다면 의료 전문가의 조언을 받으세요.',
    shareMessage: '출산 후 오로 이해하기 — AWA',
  },
  'pt-PT': {
    badgeText: 'PÓS-PARTO • LÓQUIOS',
    title: 'Perceber os lóquios\ndepois do parto',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo informativo',
    intro: 'Depois do parto, os lóquios são o corrimento vaginal ligado ao processo natural de recuperação do útero. A sua cor e a sua quantidade vão mudando gradualmente ao longo dos dias e das semanas seguintes.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que são os lóquios?',
      'Como evoluem ao longo do tempo?',
      'O que pode ser normal',
      'Dicas de conforto',
      'Quando procurar aconselhamento médico?',
      'Pontos-chave',
    ],
    section1Heading: '1. O que são os lóquios?',
    section1Body1: 'Os lóquios são um corrimento vaginal que surge depois do parto. Consistem sobretudo na eliminação gradual de sangue, secreções e tecido do útero à medida que este recupera.',
    section1Body2: 'É diferente de um período normal. É esperado durante o pós-parto e, em geral, diminui progressivamente.',
    infoTitle: 'Pontos-chave',
    infoText: 'Os lóquios não significam que o seu período já regressou. O regresso do período é um acontecimento distinto, que surge mais tarde.',
    section2Heading: '2. Como evoluem os lóquios ao longo do tempo?',
    section2Body: 'O seu aspeto muda, em regra, ao longo das primeiras semanas. A cor torna-se gradualmente mais clara e a quantidade tende a diminuir.',
    evolutionTitle: 'Uma evolução gradual',
    evolutionSubtitle: 'As fases podem variar de mulher para mulher',
    evolution: [
      {
        label: 'Vermelho vivo',
        period: 'Os primeiros dias',
        text: 'O corrimento é geralmente vermelho e pode ser mais abundante no início.',
      },
      {
        label: 'Rosado / acastanhado',
        period: 'Passados alguns dias',
        text: 'A cor torna-se gradualmente mais clara e pode passar para rosado ou castanho.',
      },
      {
        label: 'Amarelado-esbranquiçado',
        period: 'Nas semanas seguintes',
        text: 'O corrimento torna-se geralmente mais ligeiro, amarelado ou esbranquiçado, antes de desaparecer.',
      },
    ],
    section3Heading: '3. O que pode ser normal',
    section3Body: 'A evolução dos lóquios não é exatamente igual para todas as mulheres. Certas alterações podem acompanhar naturalmente a recuperação depois do parto.',
    normalPoints: [
      {
        title: 'Uma quantidade variável',
        text: 'A quantidade pode mudar nos primeiros dias e depois diminuir gradualmente.',
      },
      {
        title: 'Uma cor que muda',
        text: 'Os lóquios passam geralmente do vermelho para tons mais claros com o tempo.',
      },
      {
        title: 'Uma duração variável',
        text: 'Podem persistir durante várias semanas, e a sua evolução difere de mulher para mulher.',
      },
    ],
    section4Heading: '4. Dicas de conforto e de acompanhamento',
    section4Body: 'Durante este período, um acompanhamento simples pode ajudá-la a observar como o seu corpo está a mudar, sem comparar a sua experiência com a de outra pessoa.',
    comfortTips: [
      {
        title: 'Higiene suave',
        text: 'Privilegie uma lavagem suave e regular, sem produtos irritantes.',
      },
      {
        title: 'Observar a evolução',
        text: 'Pode anotar a cor, a quantidade e a evolução do corrimento, se isso a ajudar a acompanhar a sua recuperação.',
      },
      {
        title: 'Permitir-se descansar',
        text: 'O pós-parto leva tempo. Escute o seu corpo e respeite a sua necessidade de recuperar.',
      },
    ],
    section5Heading: '5. Lóquios ou regresso do período?',
    section5Body: 'Os lóquios surgem nos dias que se seguem ao parto e diminuem gradualmente. O regresso do período, por sua vez, corresponde à retoma do seu ciclo menstrual depois deste período.',
    compareLochiaTitle: 'Lóquios',
    compareLochiaText: 'Corrimento ligado à recuperação do útero depois do parto.',
    compareReturnTitle: 'Regresso do período',
    compareReturnText: 'Retoma do ciclo menstrual, num momento que varia de mulher para mulher.',
    section6Heading: '6. Quando procurar aconselhamento médico?',
    section6Body: 'Se a evolução lhe parecer fora do comum, ou se o seu estado geral estiver a piorar, é importante procurar o conselho de um profissional de saúde.',
    warningTitle: 'Sinais que exigem aconselhamento médico',
    warningSigns: [
      'Um odor forte ou fora do comum',
      'Febre ou agravamento do estado geral',
      'Um fluxo que de repente se torna muito mais abundante',
      'Dor intensa, persistente ou fora do comum',
      'Um novo sintoma que a preocupe',
    ],
    tipTitle: 'Bom saber',
    tipText: 'Os lóquios evoluem geralmente de forma gradual: podem ser vermelhos no início e depois tornar-se mais claros antes de desaparecer. No entanto, cada recuperação é individual.',
    summaryHeading: 'Pontos-chave',
    summaryPoints: [
      'Os lóquios são um corrimento normal depois do parto.',
      'Mudam geralmente de cor e de quantidade ao longo das semanas.',
      'A sua duração e evolução podem variar de mulher para mulher.',
      'Um odor fora do comum, febre, dor intensa ou uma hemorragia súbita e muito abundante exigem aconselhamento médico.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui o aconselhamento médico nem uma consulta. Em caso de dúvida ou se notar um sintoma preocupante, procure o conselho de um profissional de saúde.',
    shareMessage: 'Perceber os lóquios depois do parto — AWA',
  },
  bn: {
    badgeText: 'প্রসবোত্তর • লোকিয়া',
    title: 'প্রসবের পর লোকিয়া\nবোঝা',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'তথ্যমূলক বিষয়বস্তু',
    intro: 'সন্তান জন্মের পর লোকিয়া বলতে জরায়ুর স্বাভাবিক সুস্থ হয়ে ওঠার প্রক্রিয়ার সঙ্গে সম্পর্কিত যোনিপথের স্রাবকে বোঝায়। পরবর্তী দিন ও সপ্তাহগুলোতে এর রং ও পরিমাণ ধীরে ধীরে বদলে যায়।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'লোকিয়া কী?',
      'সময়ের সঙ্গে এটি কীভাবে বদলায়?',
      'কোনটি স্বাভাবিক হতে পারে',
      'আরামের পরামর্শ',
      'কখন চিকিৎসকের পরামর্শ নেবেন?',
      'মূল কথা',
    ],
    section1Heading: '1. লোকিয়া কী?',
    section1Body1: 'লোকিয়া হলো সন্তান জন্মের পর দেখা দেওয়া যোনিপথের স্রাব। জরায়ু সুস্থ হয়ে ওঠার সময় রক্ত, নিঃসরণ ও কলা ধীরে ধীরে বেরিয়ে যাওয়াই এর প্রধান উপাদান।',
    section1Body2: 'এটি স্বাভাবিক মাসিক থেকে আলাদা। প্রসবোত্তর সময়ে এটি প্রত্যাশিত এবং সাধারণত ক্রমশ কমে আসে।',
    infoTitle: 'মূল কথা',
    infoText: 'লোকিয়ার অর্থ এই নয় যে আপনার মাসিক ইতিমধ্যে ফিরে এসেছে। মাসিক ফিরে আসা একটি আলাদা ঘটনা, যা পরে ঘটে।',
    section2Heading: '2. লোকিয়া সময়ের সঙ্গে কীভাবে বদলায়?',
    section2Body: 'প্রথম কয়েক সপ্তাহে এর চেহারা সাধারণত বদলে যায়। রং ধীরে ধীরে হালকা হয় এবং পরিমাণ কমে আসে।',
    evolutionTitle: 'ধীরে ধীরে পরিবর্তন',
    evolutionSubtitle: 'ধাপগুলো একেকজনের ক্ষেত্রে একেক রকম হতে পারে',
    evolution: [
      {
        label: 'টকটকে লাল',
        period: 'প্রথম কয়েক দিন',
        text: 'স্রাব সাধারণত লাল হয় এবং শুরুতে বেশি হতে পারে।',
      },
      {
        label: 'গোলাপি / বাদামি',
        period: 'কয়েক দিন পর',
        text: 'রং ধীরে ধীরে হালকা হয় এবং গোলাপি বা বাদামির দিকে যেতে পারে।',
      },
      {
        label: 'সাদাটে-হলুদ',
        period: 'পরবর্তী কয়েক সপ্তাহে',
        text: 'স্রাব সাধারণত আরও হালকা, হলদেটে বা সাদাটে হয়ে আসে, তারপর ধীরে ধীরে বন্ধ হয়ে যায়।',
      },
    ],
    section3Heading: '3. কোনটি স্বাভাবিক হতে পারে',
    section3Body: 'লোকিয়া কীভাবে এগোয় তা সবার ক্ষেত্রে হুবহু এক নয়। প্রসবের পর সুস্থ হয়ে ওঠার সময় কিছু পরিবর্তন স্বাভাবিকভাবেই দেখা দিতে পারে।',
    normalPoints: [
      {
        title: 'পরিমাণের তারতম্য',
        text: 'প্রথম কয়েক দিনে পরিমাণ বদলাতে পারে, তারপর ধীরে ধীরে কমে যায়।',
      },
      {
        title: 'রং বদলে যাওয়া',
        text: 'লোকিয়া সাধারণত সময়ের সঙ্গে লাল থেকে হালকা রঙের দিকে যায়।',
      },
      {
        title: 'স্থায়িত্বের তারতম্য',
        text: 'এটি কয়েক সপ্তাহ পর্যন্ত থাকতে পারে, এবং এর অগ্রগতি একেকজনের ক্ষেত্রে আলাদা।',
      },
    ],
    section4Heading: '4. আরাম ও পর্যবেক্ষণের পরামর্শ',
    section4Body: 'এই সময়ে সহজ পর্যবেক্ষণ আপনার শরীর কীভাবে বদলাচ্ছে তা বুঝতে সাহায্য করতে পারে, অন্য কারও অভিজ্ঞতার সঙ্গে নিজেরটা তুলনা না করেই।',
    comfortTips: [
      {
        title: 'কোমল পরিচ্ছন্নতা',
        text: 'ত্বকে জ্বালা সৃষ্টি করে এমন পণ্য ছাড়া নিয়মিত ও কোমলভাবে ধোয়াকে প্রাধান্য দিন।',
      },
      {
        title: 'পরিবর্তনের দিকে নজর রাখুন',
        text: 'সুস্থ হয়ে ওঠা অনুসরণ করতে সাহায্য করলে আপনি স্রাবের রং, পরিমাণ ও অগ্রগতি লিখে রাখতে পারেন।',
      },
      {
        title: 'নিজেকে বিশ্রাম নিতে দিন',
        text: 'প্রসবোত্তর সময়ে সময় লাগে। শরীরের কথা শুনুন এবং সুস্থ হয়ে ওঠার প্রয়োজনকে সম্মান করুন।',
      },
    ],
    section5Heading: '5. লোকিয়া নাকি মাসিক ফিরে আসা?',
    section5Body: 'লোকিয়া প্রসবের পরের দিনগুলোতে দেখা দেয় এবং ধীরে ধীরে কমে যায়। অন্যদিকে, মাসিক ফিরে আসা মানে এই সময়ের পর আপনার মাসিক চক্র আবার শুরু হওয়া।',
    compareLochiaTitle: 'লোকিয়া',
    compareLochiaText: 'প্রসবের পর জরায়ু সুস্থ হয়ে ওঠার সঙ্গে সম্পর্কিত স্রাব।',
    compareReturnTitle: 'মাসিক ফিরে আসা',
    compareReturnText: 'মাসিক চক্র আবার শুরু হওয়া, যার সময় একেকজনের ক্ষেত্রে একেক রকম।',
    section6Heading: '6. কখন চিকিৎসকের পরামর্শ নেবেন?',
    section6Body: 'অগ্রগতি আপনার কাছে অস্বাভাবিক মনে হলে, বা আপনার সার্বিক অবস্থা খারাপ হতে থাকলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নেওয়া জরুরি।',
    warningTitle: 'যেসব লক্ষণে চিকিৎসকের পরামর্শ প্রয়োজন',
    warningSigns: [
      'তীব্র বা অস্বাভাবিক গন্ধ',
      'জ্বর বা সার্বিক অবস্থার অবনতি',
      'রক্তক্ষরণ হঠাৎ অনেক বেড়ে যাওয়া',
      'তীব্র, দীর্ঘস্থায়ী বা অস্বাভাবিক ব্যথা',
      'নতুন কোনো উপসর্গ যা আপনাকে চিন্তায় ফেলে',
    ],
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'লোকিয়া সাধারণত ধীরে ধীরে বদলায়: প্রথমে লাল থাকতে পারে, তারপর হালকা হয়ে ধীরে ধীরে বন্ধ হয়ে যায়। তবে প্রতিটি সুস্থ হয়ে ওঠা ব্যক্তিভেদে আলাদা।',
    summaryHeading: 'মূল কথা',
    summaryPoints: [
      'লোকিয়া প্রসবের পর স্বাভাবিক স্রাব।',
      'সপ্তাহের পর সপ্তাহ ধরে এর রং ও পরিমাণ সাধারণত বদলায়।',
      'এর স্থায়িত্ব ও অগ্রগতি একেকজনের ক্ষেত্রে আলাদা হতে পারে।',
      'অস্বাভাবিক গন্ধ, জ্বর, তীব্র ব্যথা বা হঠাৎ অনেক বেশি রক্তক্ষরণে চিকিৎসকের পরামর্শ প্রয়োজন।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ চিকিৎসা পরামর্শ বা শারীরিক পরীক্ষার বিকল্প নয়। সন্দেহ থাকলে বা উদ্বেগজনক কোনো উপসর্গ দেখলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'প্রসবের পর লোকিয়া বোঝা — AWA',
  },
  da: {
    badgeText: 'Efterfødsel • Barselsblod',
    title: 'At forstå barselsblod\nefter fødslen',
    metaDuration: '6 minutters læsning',
    metaType: 'Guide',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Informativt indhold',
    intro: 'Lochia – barselsblod – er den vaginale udflåd, der er forbundet med livmoderens normale helingsproces efter fødslen. Farve og mængde ændrer sig gradvist i de efterfølgende dage og uger.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er lochia?',
      'Hvordan ændrer det sig over tid?',
      'Hvad der kan være normalt',
      'Råd til komfort',
      'Hvornår bør du søge lægehjælp?',
      'Vigtigt at huske',
    ],
    section1Heading: '1. Hvad er lochia?',
    section1Body1: 'Lochia er den vaginale udflåd, der opstår efter en fødsel. Det består primært af blod, sekret og væv, der gradvist udtømmes, mens livmoderen heler.',
    section1Body2: 'Det adskiller sig fra en normal menstruation. Det er forventeligt i efterfødselsperioden og aftager typisk gradvist.',
    infoTitle: 'Vigtigt at vide',
    infoText: 'Lochia betyder ikke, at din menstruation er vendt tilbage. Menstruationens tilbagevenden er en separat hændelse, der sker senere.',
    section2Heading: '2. Hvordan ændrer lochia sig over tid?',
    section2Body: 'Udseendet ændrer sig typisk i løbet af de første uger. Farven bliver gradvist lysere, og mængden aftager.',
    evolutionTitle: 'Gradvis forandring',
    evolutionSubtitle: 'Forløbet kan variere fra person til person',
    evolution: [
      {
        label: 'Klart rødt',
        period: 'De første dage',
        text: 'Udflåden er typisk rød og kan være mere rigeligt i starten.',
      },
      {
        label: 'Lyserød / brun',
        period: 'Efter nogle dage',
        text: 'Farven bliver gradvist lysere og kan gå mod lyserød eller brun.',
      },
      {
        label: 'Gulhvid',
        period: 'I de efterfølgende uger',
        text: 'Udflåden bliver typisk lysere, gullig eller hvidlig og ophører derefter gradvist.',
      },
    ],
    section3Heading: '3. Hvad der kan være normalt',
    section3Body: 'Hvordan lochia forløber, er ikke nøjagtigt det samme for alle. Visse forandringer kan naturligt opstå under heling efter fødslen.',
    normalPoints: [
      {
        title: 'Varierende mængde',
        text: 'Mængden kan variere i de første dage og aftager derefter gradvist.',
      },
      {
        title: 'Farveforandring',
        text: 'Lochia går typisk fra rød til lysere farver over tid.',
      },
      {
        title: 'Varierende varighed',
        text: 'Det kan vare i flere uger, og forløbet varierer fra person til person.',
      },
    ],
    section4Heading: '4. Råd til komfort og observation',
    section4Body: 'En enkel observation i denne periode kan hjælpe dig med at forstå, hvordan din krop ændrer sig, uden at sammenligne dig med andres oplevelse.',
    comfortTips: [
      {
        title: 'Skånsom hygiejne',
        text: 'Prioritér regelmæssig og skånsom vask uden produkter, der kan irritere huden.',
      },
      {
        title: 'Følg forandringer',
        text: 'Hvis det hjælper dig med at følge helingen, kan du notere farve, mængde og forløb af udflåden.',
      },
      {
        title: 'Giv dig selv hvile',
        text: 'Efterfødselsperioden tager tid. Lyt til din krop og respektér behovet for restitution.',
      },
    ],
    section5Heading: '5. Lochia eller menstruation der vender tilbage?',
    section5Body: 'Lochia opstår i dagene efter fødslen og aftager gradvist. Menstruationens tilbagevenden betyder derimod, at din menstruationscyklus starter igen efter denne periode.',
    compareLochiaTitle: 'Lochia',
    compareLochiaText: 'Udflåd forbundet med livmoderens heling efter fødslen.',
    compareReturnTitle: 'Menstruationens tilbagevenden',
    compareReturnText: 'Genopstart af menstruationscyklussen, hvis tidspunkt varierer fra person til person.',
    section6Heading: '6. Hvornår bør du søge lægehjælp?',
    section6Body: 'Søg råd hos en sundhedsprofessionel, hvis forløbet virker unormalt for dig, eller hvis din generelle tilstand forværres.',
    warningTitle: 'Tegn der kræver lægehjælp',
    warningSigns: [
      'Stærk eller usædvanlig lugt',
      'Feber eller forværring af almentilstanden',
      'Pludselig kraftig øgning af blødningen',
      'Stærke, vedvarende eller usædvanlige smerter',
      'Nye symptomer der bekymrer dig',
    ],
    tipTitle: 'Godt at vide',
    tipText: 'Lochia ændrer sig typisk gradvist: det kan starte rødt, derefter blive lysere og efterhånden ophøre. Men enhver heling er individuel.',
    summaryHeading: 'Vigtigt at huske',
    summaryPoints: [
      'Lochia er normal udflåd efter fødslen.',
      'Farve og mængde ændrer sig typisk over uger.',
      'Varighed og forløb varierer fra person til person.',
      'Søg lægehjælp ved usædvanlig lugt, feber, stærke smerter eller pludselig kraftig blødning.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter ikke medicinsk rådgivning eller fysisk undersøgelse. Søg råd hos en sundhedsprofessionel, hvis du er i tvivl eller oplever bekymrende symptomer.',
    shareMessage: 'At forstå barselsblod efter fødslen — AWA',
  },
  sv: {
    badgeText: 'Efterfödsel • Barselsblod',
    title: 'At forstå barselsblod\nefter födslen',
    metaDuration: '6 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Informativt indhold',
    intro: 'Lochia – barselsblod – ar den vaginale udflåd, der ar forbundet med livmoderens normale helingsproces efter födslen. Farve och mängde ändrer sig gradvist i de efterfölgende dagar och veckor.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar lochia?',
      'Hvordan ändrer det sig over tid?',
      'Hvad der kan väre normalt',
      'Råd till komfort',
      'Hvornår bör du söge lägehjälp?',
      'Vigtigt at huske',
    ],
    section1Heading: '1. Hvad ar lochia?',
    section1Body1: 'Lochia ar den vaginale udflåd, der opstår efter en födsel. Det består primärt av blod, sekret och väv, der gradvist udtömmes, mens livmoderen heler.',
    section1Body2: 'Det adskiller sig fran en normal menstruation. Det ar forventeligt i efterfödselsperioden och aftager typisk gradvist.',
    infoTitle: 'Vigtigt at vide',
    infoText: 'Lochia betyder inte, at din menstruation ar vendt tilbage. Menstruationens tilbagevenden ar en separat händelse, der sker senere.',
    section2Heading: '2. Hvordan ändrer lochia sig over tid?',
    section2Body: 'Udseendet ändrer sig typisk i löbet av de förste veckor. Farven bliver gradvist lysere, och mängden aftager.',
    evolutionTitle: 'Gradvis forandring',
    evolutionSubtitle: 'Forlöbet kan variere fran person till person',
    evolution: [
      {
        label: 'Klart rödt',
        period: 'De förste dage',
        text: 'Udflåden ar typisk röd och kan väre mere rigeligt i starten.',
      },
      {
        label: 'Lyseröd / brun',
        period: 'Efter nogle dage',
        text: 'Farven bliver gradvist lysere och kan gå mod lyseröd eller brun.',
      },
      {
        label: 'Gulhvid',
        period: 'I de efterfölgende veckor',
        text: 'Udflåden bliver typisk lysere, gullig eller hvidlig och ophörer derefter gradvist.',
      },
    ],
    section3Heading: '3. Hvad der kan väre normalt',
    section3Body: 'Hvordan lochia forlöber, ar inte nöjagtigt det samme for alle. Visse forandringer kan naturligt opstå under heling efter födslen.',
    normalPoints: [
      {
        title: 'Varierende mängde',
        text: 'Mängden kan variere i de förste dagar och aftager derefter gradvist.',
      },
      {
        title: 'Farveforandring',
        text: 'Lochia går typisk fran röd till lysere farver over tid.',
      },
      {
        title: 'Varierende varighed',
        text: 'Det kan vare i flere veckor, och forlöbet varierer fran person till person.',
      },
    ],
    section4Heading: '4. Råd till komfort och observation',
    section4Body: 'En enkel observation i denne periode kan hjälpe dig med at forstå, hvordan din krop ändrer sig, uden at sammenligne dig med andres oplevelse.',
    comfortTips: [
      {
        title: 'Skånsom hygiejne',
        text: 'Prioritér regelmässig och skånsom vask uden produkter, der kan irritere huden.',
      },
      {
        title: 'Fölg forandringer',
        text: 'Hvis det hjälper dig med at fölge helingen, kan du notere farve, mängde och forlöb av udflåden.',
      },
      {
        title: 'Giv dig selv hvile',
        text: 'Efterfödselsperioden tager tid. Lyt till din krop och respektér behovet for restitution.',
      },
    ],
    section5Heading: '5. Lochia eller menstruation der vender tilbage?',
    section5Body: 'Lochia opstår i dagene efter födslen och aftager gradvist. Menstruationens tilbagevenden betyder derimod, at din menstruationscyklus starter igen efter denne periode.',
    compareLochiaTitle: 'Lochia',
    compareLochiaText: 'Udflåd forbundet med livmoderens heling efter födslen.',
    compareReturnTitle: 'Menstruationens tilbagevenden',
    compareReturnText: 'Genopstart av menstruationscyklussen, hvis tidspunkt varierer fran person till person.',
    section6Heading: '6. Hvornår bör du söge lägehjälp?',
    section6Body: 'Sög råd hos en halsasprofessionel, hvis forlöbet virker unormalt for dig, eller hvis din generelle tilstand forvärres.',
    warningTitle: 'Tegn der kräver lägehjälp',
    warningSigns: [
      'Stärk eller usädvanlig lugt',
      'Feber eller forvärring av almentilstanden',
      'Pludselig kraftig ögning av blödningen',
      'Stärke, vedvarende eller usädvanlige smerter',
      'Nye symtom der bekymrer dig',
    ],
    tipTitle: 'Godt at vide',
    tipText: 'Lochia ändrer sig typisk gradvist: det kan starte rödt, derefter blive lysere och efterhånden ophöre. Men enhver heling ar individuel.',
    summaryHeading: 'Vigtigt at huske',
    summaryPoints: [
      'Lochia ar normal udflåd efter födslen.',
      'Farve och mängde ändrer sig typisk over veckor.',
      'Varighed och forlöb varierer fran person till person.',
      'Sög lägehjälp ved usädvanlig lugt, feber, stärke smartor eller pludselig kraftig blödning.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter inte medicinsk rådgivning eller fysisk undersögelse. Sög råd hos en halsasprofessionel, hvis du ar i tvivl eller oplever bekymrende symtom.',
    shareMessage: 'At forstå barselsblod efter födslen — AWA',
  },
  nb: {
    badgeText: 'BARSELTID • BARSELBLØDNING',
    title: 'Forstå barselblødning\netter fødselen',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Informasjonsinnhold',
    intro:
      'Etter fødselen betegner lochia (barselblødning) den vaginale utfloden som henger sammen med livmorens naturlige tilfriskning. Fargen og mengden endrer seg gradvis i løpet av dagene og ukene som følger.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er barselblødning?',
      'Hvordan endrer den seg over tid?',
      'Hva som kan være normalt',
      'Tips for komfort',
      'Når bør du søke medisinsk råd?',
      'Det viktigste å huske',
    ],
    section1Heading: '1. Hva er barselblødning?',
    section1Body1:
      'Barselblødning er vaginal utflod som kommer etter fødselen. Den består hovedsakelig av gradvis utskillelse av blod, sekret og vev fra livmoren mens den kommer seg.',
    section1Body2:
      'Den er forskjellig fra en vanlig mens. Den er forventet i barseltiden og avtar vanligvis gradvis.',
    infoTitle: 'Det viktigste å huske',
    infoText:
      'Barselblødning betyr ikke at mensen allerede er tilbake. Mensens tilbakekomst er en egen hendelse som skjer senere.',
    section2Heading: '2. Hvordan endrer barselblødningen seg over tid?',
    section2Body:
      'Utseendet endrer seg vanligvis i løpet av de første ukene. Fargen blir gradvis lysere, og mengden har en tendens til å avta.',
    evolutionTitle: 'En gradvis utvikling',
    evolutionSubtitle: 'Fasene kan variere fra person til person',
    evolution: [
      {
        label: 'Knallrød',
        period: 'De første dagene',
        text: 'Utfloden er vanligvis rød og kan være kraftigere i begynnelsen.',
      },
      {
        label: 'Rosa / brunaktig',
        period: 'Etter noen dager',
        text: 'Fargen blir gradvis lysere og kan gå over mot rosa eller brun.',
      },
      {
        label: 'Hvitgul',
        period: 'I løpet av de følgende ukene',
        text: 'Utfloden blir vanligvis lettere, gulaktig eller hvitaktig, før den avtar.',
      },
    ],
    section3Heading: '3. Hva som kan være normalt',
    section3Body:
      'Utviklingen av barselblødningen er ikke helt lik for alle. Visse endringer kan naturlig følge med tilfriskningen etter fødselen.',
    normalPoints: [
      {
        title: 'En varierende mengde',
        text: 'Mengden kan endre seg de første dagene og deretter gradvis avta.',
      },
      {
        title: 'En farge som endrer seg',
        text: 'Barselblødningen går vanligvis fra rødt mot lysere nyanser over tid.',
      },
      {
        title: 'En varierende varighet',
        text: 'Den kan vare i flere uker, og utviklingen er forskjellig fra person til person.',
      },
    ],
    section4Heading: '4. Tips for komfort og sporing',
    section4Body:
      'I denne perioden kan enkel sporing hjelpe deg å observere hvordan kroppen endrer seg, uten å sammenligne din opplevelse med en annens.',
    comfortTips: [
      {
        title: 'Mild hygiene',
        text: 'Foretrekk mild, regelmessig vask uten irriterende produkter.',
      },
      {
        title: 'Følg med på utviklingen',
        text: 'Du kan notere fargen, mengden og forløpet av utfloden hvis det hjelper deg å følge tilfriskningen din.',
      },
      {
        title: 'Gi deg selv hvile',
        text: 'Barseltiden tar tid. Lytt til kroppen din og respekter behovet ditt for å komme deg.',
      },
    ],
    section5Heading: '5. Barselblødning eller mensens tilbakekomst?',
    section5Body:
      'Barselblødning kommer i dagene etter fødselen og avtar gradvis. Mensens tilbakekomst derimot tilsvarer at menstruasjonssyklusen kommer i gang igjen etter denne perioden.',
    compareLochiaTitle: 'Barselblødning',
    compareLochiaText: 'Utflod knyttet til livmorens tilfriskning etter fødselen.',
    compareReturnTitle: 'Mensens tilbakekomst',
    compareReturnText:
      'Menstruasjonssyklusen kommer i gang igjen, på et tidspunkt som varierer fra person til person.',
    section6Heading: '6. Når bør du søke medisinsk råd?',
    section6Body:
      'Hvis utviklingen virker uvanlig for deg, eller hvis allmenntilstanden din forverres, er det viktig å søke råd hos helsepersonell.',
    warningTitle: 'Tegn som krever medisinsk råd',
    warningSigns: [
      'En sterk eller uvanlig lukt',
      'Feber eller forverret allmenntilstand',
      'Blødning som plutselig blir mye kraftigere',
      'Betydelig, vedvarende eller uvanlig smerte',
      'Et nytt symptom som bekymrer deg',
    ],
    tipTitle: 'Godt å vite',
    tipText:
      'Barselblødning utvikler seg vanligvis gradvis: den kan være rød i begynnelsen og deretter bli lysere før den avtar. Hver tilfriskning er likevel individuell.',
    summaryHeading: 'Det viktigste å huske',
    summaryPoints: [
      'Barselblødning er normal utflod etter fødselen.',
      'Den endrer vanligvis farge og mengde i løpet av ukene.',
      'Varigheten og forløpet kan variere fra person til person.',
      'Uvanlig lukt, feber, betydelig smerte eller en plutselig, svært kraftig blødning krever medisinsk råd.',
    ],
    disclaimerText:
      'Informasjonsinnhold. Denne artikkelen erstatter ikke medisinsk rådgivning eller en undersøkelse. Ved tvil eller hvis du merker et bekymringsfullt symptom, bør du søke råd hos helsepersonell.',
    shareMessage: 'Forstå barselblødning etter fødselen – AWA',
  },
  pl: {
    badgeText: 'POŁÓG • LOCHIA',
    title: 'Zrozumieć lochia\npo porodzie',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść informacyjna',
    intro:
      'Po porodzie lochia to wydzielina z pochwy związana z naturalnym procesem regeneracji macicy. Jej kolor i ilość stopniowo zmieniają się w kolejnych dniach i tygodniach.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym są lochia?',
      'Jak zmieniają się w czasie?',
      'Co może być normalne',
      'Wskazówki dla komfortu',
      'Kiedy zasięgnąć porady medycznej?',
      'Najważniejsze wnioski',
    ],
    section1Heading: '1. Czym są lochia?',
    section1Body1:
      'Lochia to wydzielina z pochwy, która pojawia się po porodzie. Składa się głównie ze stopniowo usuwanej krwi, wydzielin i tkanek z macicy podczas jej regeneracji.',
    section1Body2:
      'Różnią się od zwykłej miesiączki. Są oczekiwane w okresie poporodowym i zazwyczaj stopniowo słabną.',
    infoTitle: 'Najważniejsze wnioski',
    infoText:
      'Lochia nie oznaczają, że miesiączka już wróciła. Powrót miesiączki to osobne zdarzenie, które następuje później.',
    section2Heading: '2. Jak zmieniają się lochia w czasie?',
    section2Body:
      'Ich wygląd zwykle zmienia się w ciągu pierwszych tygodni. Kolor stopniowo jaśnieje, a ilość zwykle maleje.',
    evolutionTitle: 'Stopniowy przebieg',
    evolutionSubtitle: 'Etapy mogą się różnić u poszczególnych osób',
    evolution: [
      {
        label: 'Jasnoczerwone',
        period: 'Pierwsze dni',
        text: 'Wydzielina jest zwykle czerwona i na początku może być obfitsza.',
      },
      {
        label: 'Różowe / brązowawe',
        period: 'Po kilku dniach',
        text: 'Kolor stopniowo jaśnieje i może przechodzić w różowy lub brązowy.',
      },
      {
        label: 'Białawo-żółtawe',
        period: 'W kolejnych tygodniach',
        text: 'Wydzielina zwykle staje się jaśniejsza, żółtawa lub biaława, zanim ustanie.',
      },
    ],
    section3Heading: '3. Co może być normalne',
    section3Body:
      'Przebieg lochiów nie jest dokładnie taki sam u wszystkich. Niektóre zmiany mogą w naturalny sposób towarzyszyć regeneracji po porodzie.',
    normalPoints: [
      {
        title: 'Zmienna ilość',
        text: 'Ilość może się zmieniać w pierwszych dniach, a następnie stopniowo maleć.',
      },
      {
        title: 'Zmieniający się kolor',
        text: 'Lochia zwykle przechodzą z czerwieni w jaśniejsze odcienie.',
      },
      {
        title: 'Zmienny czas trwania',
        text: 'Mogą utrzymywać się przez kilka tygodni, a ich przebieg różni się u poszczególnych osób.',
      },
    ],
    section4Heading: '4. Wskazówki dla komfortu i śledzenia',
    section4Body:
      'W tym okresie proste śledzenie może pomóc obserwować, jak zmienia się Twoje ciało, bez porównywania swojego doświadczenia z doświadczeniem innej osoby.',
    comfortTips: [
      {
        title: 'Delikatna higiena',
        text: 'Wybieraj delikatne, regularne mycie bez drażniących produktów.',
      },
      {
        title: 'Obserwuj przebieg',
        text: 'Możesz zapisywać kolor, ilość i przebieg wydzieliny, jeśli pomaga Ci to śledzić regenerację.',
      },
      {
        title: 'Pozwól sobie na odpoczynek',
        text: 'Okres poporodowy wymaga czasu. Słuchaj swojego ciała i uszanuj potrzebę regeneracji.',
      },
    ],
    section5Heading: '5. Lochia czy powrót miesiączki?',
    section5Body:
      'Lochia pojawiają się w dniach po porodzie i stopniowo słabną. Powrót miesiączki natomiast oznacza wznowienie cyklu menstruacyjnego po tym okresie.',
    compareLochiaTitle: 'Lochia',
    compareLochiaText: 'Wydzielina związana z regeneracją macicy po porodzie.',
    compareReturnTitle: 'Powrót miesiączki',
    compareReturnText:
      'Wznowienie cyklu menstruacyjnego, w momencie różnym u poszczególnych osób.',
    section6Heading: '6. Kiedy zasięgnąć porady medycznej?',
    section6Body:
      'Jeśli przebieg wydaje Ci się nietypowy lub Twój ogólny stan się pogarsza, ważne jest, by zasięgnąć porady specjalisty.',
    warningTitle: 'Objawy wymagające porady medycznej',
    warningSigns: [
      'Silny lub nietypowy zapach',
      'Gorączka lub pogarszający się stan ogólny',
      'Krwawienie, które nagle staje się znacznie obfitsze',
      'Silny, uporczywy lub nietypowy ból',
      'Nowy objaw, który Cię niepokoi',
    ],
    tipTitle: 'Warto wiedzieć',
    tipText:
      'Lochia zwykle zmieniają się stopniowo: na początku mogą być czerwone, potem stają się jaśniejsze, zanim ustaną. Każda regeneracja jest jednak indywidualna.',
    summaryHeading: 'Najważniejsze wnioski',
    summaryPoints: [
      'Lochia to prawidłowa wydzielina po porodzie.',
      'Zwykle zmieniają kolor i ilość w ciągu tygodni.',
      'Ich czas trwania i przebieg mogą się różnić u poszczególnych osób.',
      'Nietypowy zapach, gorączka, silny ból lub nagłe, bardzo obfite krwawienie wymagają porady medycznej.',
    ],
    disclaimerText:
      'Treść informacyjna. Ten artykuł nie zastępuje porady ani badania lekarskiego. W razie wątpliwości lub zauważenia niepokojącego objawu zasięgnij porady specjalisty.',
    shareMessage: 'Zrozumieć lochia po porodzie — AWA',
  },
  uk: {
    badgeText: 'ПІСЛЯ ПОЛОГІВ • ЛОХІЇ',
    title: 'Розуміння лохій\nпісля пологів',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Інформаційний вміст',
    intro:
      'Після пологів лохії — це вагінальні виділення, пов’язані з природним процесом відновлення матки. Їхній колір і кількість поступово змінюються протягом наступних днів і тижнів.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке лохії?',
      'Як вони змінюються з часом?',
      'Що може бути нормальним',
      'Поради для комфорту',
      'Коли звертатися за медичною порадою?',
      'Головні висновки',
    ],
    section1Heading: '1. Що таке лохії?',
    section1Body1:
      'Лохії — це вагінальні виділення, що з’являються після пологів. Вони складаються головним чином із крові, секретів і тканин, які поступово виводяться з матки під час її відновлення.',
    section1Body2:
      'Вони відрізняються від звичайної менструації. Вони очікувані в післяпологовий період і зазвичай поступово слабшають.',
    infoTitle: 'Головні висновки',
    infoText:
      'Лохії не означають, що менструація вже повернулася. Повернення менструації — окрема подія, що відбувається пізніше.',
    section2Heading: '2. Як змінюються лохії з часом?',
    section2Body:
      'Їхній вигляд зазвичай змінюється протягом перших кількох тижнів. Колір поступово світлішає, а кількість має тенденцію зменшуватися.',
    evolutionTitle: 'Поступовий перебіг',
    evolutionSubtitle: 'Етапи можуть різнитися в різних людей',
    evolution: [
      {
        label: 'Яскраво-червоні',
        period: 'Перші дні',
        text: 'Виділення зазвичай червоні й на початку можуть бути рясніші.',
      },
      {
        label: 'Рожеві / коричнюваті',
        period: 'Через кілька днів',
        text: 'Колір поступово світлішає і може зміщуватися до рожевого чи коричневого.',
      },
      {
        label: 'Білувато-жовтуваті',
        period: 'Протягом наступних тижнів',
        text: 'Виділення зазвичай стають світлішими, жовтуватими чи білуватими, перш ніж припинитися.',
      },
    ],
    section3Heading: '3. Що може бути нормальним',
    section3Body:
      'Перебіг лохій не точно однаковий у всіх. Деякі зміни можуть природно супроводжувати відновлення після пологів.',
    normalPoints: [
      {
        title: 'Змінна кількість',
        text: 'Кількість може змінюватися протягом перших днів, а потім поступово зменшуватися.',
      },
      {
        title: 'Колір, що змінюється',
        text: 'Лохії зазвичай з часом переходять від червоного до світліших відтінків.',
      },
      {
        title: 'Змінна тривалість',
        text: 'Вони можуть зберігатися кілька тижнів, а їхній перебіг різниться в різних людей.',
      },
    ],
    section4Heading: '4. Поради для комфорту та відстеження',
    section4Body:
      'У цей період просте відстеження може допомогти спостерігати, як змінюється ваше тіло, не порівнюючи свій досвід із чужим.',
    comfortTips: [
      {
        title: 'Ніжна гігієна',
        text: 'Віддавайте перевагу ніжному, регулярному митю без подразнювальних засобів.',
      },
      {
        title: 'Спостерігайте за перебігом',
        text: 'Ви можете занотовувати колір, кількість і перебіг виділень, якщо це допомагає стежити за відновленням.',
      },
      {
        title: 'Дозвольте собі відпочити',
        text: 'Післяпологовий період потребує часу. Прислухайтеся до свого тіла й поважайте потребу у відновленні.',
      },
    ],
    section5Heading: '5. Лохії чи повернення менструації?',
    section5Body:
      'Лохії з’являються в дні після пологів і поступово слабшають. Повернення менструації ж відповідає відновленню вашого менструального циклу після цього періоду.',
    compareLochiaTitle: 'Лохії',
    compareLochiaText: 'Виділення, пов’язані з відновленням матки після пологів.',
    compareReturnTitle: 'Повернення менструації',
    compareReturnText:
      'Відновлення менструального циклу, у час, що різниться в різних людей.',
    section6Heading: '6. Коли звертатися за медичною порадою?',
    section6Body:
      'Якщо перебіг здається вам нетиповим або ваш загальний стан погіршується, важливо звернутися за порадою до медичного фахівця.',
    warningTitle: 'Ознаки, що потребують медичної поради',
    warningSigns: [
      'Сильний або нетиповий запах',
      'Гарячка або погіршення загального стану',
      'Виділення, що раптово стають значно рясніші',
      'Сильний, стійкий або нетиповий біль',
      'Новий симптом, що вас турбує',
    ],
    tipTitle: 'Варто знати',
    tipText:
      'Лохії зазвичай змінюються поступово: спочатку вони можуть бути червоними, потім світлішають, перш ніж припинитися. Проте кожне відновлення індивідуальне.',
    summaryHeading: 'Головні висновки',
    summaryPoints: [
      'Лохії — нормальні виділення після пологів.',
      'Вони зазвичай змінюють колір і кількість протягом тижнів.',
      'Їхня тривалість і перебіг можуть різнитися в різних людей.',
      'Сильний запах, гарячка, значний біль чи раптова дуже рясна кровотеча потребують медичної поради.',
    ],
    disclaimerText:
      'Інформаційний вміст. Ця стаття не замінює медичної поради чи обстеження. У разі сумнівів або помітивши тривожний симптом, зверніться за порадою до медичного фахівця.',
    shareMessage: 'Розуміння лохій після пологів — AWA',
  },
  cs: {
    badgeText: 'PO PORODU • LOCHIE',
    title: 'Pochopení lochií\npo porodu',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Informativní obsah',
    intro:
      'Po porodu se lochiemi označuje poševní výtok spojený s přirozeným procesem zotavování dělohy. Jeho barva a množství se v následujících dnech a týdnech postupně mění.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co jsou lochie?',
      'Jak se mění v čase?',
      'Co může být normální',
      'Tipy pro pohodlí',
      'Kdy vyhledat lékařskou radu?',
      'Hlavní poznatky',
    ],
    section1Heading: '1. Co jsou lochie?',
    section1Body1:
      'Lochie jsou poševní výtok, který se objevuje po porodu. Skládá se hlavně z postupného odchodu krve, sekretů a tkáně z dělohy, jak se zotavuje.',
    section1Body2:
      'Liší se od běžné menstruace. V období po porodu jsou očekávané a obecně postupně ubývají.',
    infoTitle: 'Hlavní poznatky',
    infoText:
      'Lochie neznamenají, že se vám již vrátila menstruace. Návrat menstruace je samostatná událost, která nastává později.',
    section2Heading: '2. Jak se lochie mění v čase?',
    section2Body:
      'Jejich vzhled se obvykle mění v prvních týdnech. Barva se postupně zesvětluje a množství má tendenci klesat.',
    evolutionTitle: 'Postupný průběh',
    evolutionSubtitle: 'Jednotlivé fáze se mohou u každé ženy lišit',
    evolution: [
      {
        label: 'Jasně červené',
        period: 'První dny',
        text: 'Výtok je obvykle červený a na začátku může být silnější.',
      },
      {
        label: 'Růžové / nahnědlé',
        period: 'Po několika dnech',
        text: 'Barva se postupně zesvětluje a může přecházet do růžova nebo do hněda.',
      },
      {
        label: 'Bělavě žluté',
        period: 'V následujících týdnech',
        text: 'Výtok obvykle zesvětlí, nažloutne nebo zbělá, než postupně ustane.',
      },
    ],
    section3Heading: '3. Co může být normální',
    section3Body:
      'Vývoj lochií není u všech zcela stejný. Zotavení po porodu mohou přirozeně provázet určité změny.',
    normalPoints: [
      {
        title: 'Proměnlivé množství',
        text: 'Množství se může v prvních dnech měnit a poté postupně klesat.',
      },
      {
        title: 'Měnící se barva',
        text: 'Lochie obvykle časem přecházejí z červené do světlejších odstínů.',
      },
      {
        title: 'Proměnlivá doba trvání',
        text: 'Mohou přetrvávat několik týdnů a jejich vývoj se u každé ženy liší.',
      },
    ],
    section4Heading: '4. Tipy pro pohodlí a sledování',
    section4Body:
      'V tomto období vám může jednoduché sledování pomoci pozorovat, jak se vaše tělo mění, aniž byste srovnávala svou zkušenost s jinou ženou.',
    comfortTips: [
      {
        title: 'Jemná hygiena',
        text: 'Upřednostněte jemné, pravidelné mytí bez dráždivých přípravků.',
      },
      {
        title: 'Sledujte vývoj',
        text: 'Pokud vám to pomáhá sledovat zotavení, můžete si zapisovat barvu, množství a průběh výtoku.',
      },
      {
        title: 'Dopřejte si odpočinek',
        text: 'Období po porodu vyžaduje čas. Naslouchejte svému tělu a respektujte svou potřebu zotavit se.',
      },
    ],
    section5Heading: '5. Lochie, nebo návrat menstruace?',
    section5Body:
      'Lochie se objevují v prvních dnech po porodu a postupně ubývají. Návrat menstruace naproti tomu odpovídá obnovení menstruačního cyklu po tomto období.',
    compareLochiaTitle: 'Lochie',
    compareLochiaText: 'Výtok spojený se zotavením dělohy po porodu.',
    compareReturnTitle: 'Návrat menstruace',
    compareReturnText:
      'Obnovení menstruačního cyklu v době, která se u každé ženy liší.',
    section6Heading: '6. Kdy vyhledat lékařskou radu?',
    section6Body:
      'Pokud vám vývoj připadá neobvyklý, nebo pokud se váš celkový stav zhoršuje, je důležité požádat o radu zdravotnického pracovníka.',
    warningTitle: 'Příznaky, které vyžadují lékařskou radu',
    warningSigns: [
      'Silný nebo neobvyklý zápach',
      'Horečka nebo zhoršující se celkový stav',
      'Krvácení, které se náhle výrazně zesílí',
      'Výrazná, přetrvávající nebo neobvyklá bolest',
      'Nový příznak, který vás znepokojuje',
    ],
    tipTitle: 'Stojí za to vědět',
    tipText:
      'Lochie se obvykle vyvíjejí postupně: na začátku mohou být červené, poté zesvětlají, než postupně ustanou. Každé zotavení je však individuální.',
    summaryHeading: 'Hlavní poznatky',
    summaryPoints: [
      'Lochie jsou normální výtok po porodu.',
      'Barva a množství se obvykle během týdnů mění.',
      'Jejich doba trvání a vývoj se mohou u každé ženy lišit.',
      'Neobvyklý zápach, horečka, výrazná bolest nebo náhlé velmi silné krvácení vyžadují lékařskou radu.',
    ],
    disclaimerText:
      'Informativní obsah. Tento článek nenahrazuje lékařskou radu ani vyšetření. V případě pochybností nebo znepokojivého příznaku vyhledejte radu zdravotnického pracovníka.',
    shareMessage: 'Pochopení lochií po porodu — AWA',
  },
  sk: {
    badgeText: 'PO PÔRODE • LÓCHIE',
    title: 'Pochopenie lóchií\npo pôrode',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Informatívny obsah',
    intro:
      'Po pôrode lóchie označujú vaginálny výtok súvisiaci s prirodzeným procesom zotavovania maternice. Jeho farba a množstvo sa v nasledujúcich dňoch a týždňoch postupne menia.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo sú lóchie?',
      'Ako sa menia v čase?',
      'Čo môže byť normálne',
      'Tipy na pohodlie',
      'Kedy vyhľadať lekársku radu?',
      'Hlavné body',
    ],
    section1Heading: '1. Čo sú lóchie?',
    section1Body1:
      'Lóchie sú vaginálny výtok, ktorý sa objavuje po pôrode. Tvorí ho najmä postupné vylučovanie krvi, sekrétov a tkaniva z maternice počas jej zotavovania.',
    section1Body2:
      'Líši sa od bežnej menštruácie. V období po pôrode sa očakáva a zvyčajne sa postupne zmenšuje.',
    infoTitle: 'Hlavné body',
    infoText:
      'Lóchie neznamenajú, že sa vaša menštruácia už vrátila. Návrat menštruácie je samostatná udalosť, ktorá nastane neskôr.',
    section2Heading: '2. Ako sa lóchie menia v čase?',
    section2Body:
      'Ich vzhľad sa zvyčajne mení počas prvých týždňov. Farba sa postupne zosvetľuje a množstvo má tendenciu klesať.',
    evolutionTitle: 'Postupný vývoj',
    evolutionSubtitle: 'Fázy sa môžu líšiť od ženy k žene',
    evolution: [
      {
        label: 'Jasne červené',
        period: 'Prvé dni',
        text: 'Výtok je zvyčajne červený a na začiatku môže byť silnejší.',
      },
      {
        label: 'Ružovkasté / hnedastré',
        period: 'Po niekoľkých dňoch',
        text: 'Farba sa postupne zosvetľuje a môže sa meniť na ružovú alebo hnedú.',
      },
      {
        label: 'Belavo-žltkasté',
        period: 'V nasledujúcich týždňoch',
        text: 'Výtok sa zvyčajne stáva svetlejším, žltkastým alebo belavým, a potom ustáva.',
      },
    ],
    section3Heading: '3. Čo môže byť normálne',
    section3Body:
      'Vývoj lóchií nie je u každej ženy presne rovnaký. Niektoré zmeny môžu prirodzene sprevádzať zotavovanie po pôrode.',
    normalPoints: [
      {
        title: 'Rôzne množstvo',
        text: 'Množstvo sa môže počas prvých dní meniť a potom postupne klesať.',
      },
      {
        title: 'Farba, ktorá sa mení',
        text: 'Lóchie zvyčajne časom prechádzajú od červenej k svetlejším odtieňom.',
      },
      {
        title: 'Rôzne trvanie',
        text: 'Môžu pretrvávať niekoľko týždňov a ich vývoj sa líši od ženy k žene.',
      },
    ],
    section4Heading: '4. Tipy na pohodlie a sledovanie',
    section4Body:
      'V tomto období vám jednoduché sledovanie môže pomôcť všímať si, ako sa vaše telo mení, bez porovnávania vašej skúsenosti so skúsenosťou niekoho iného.',
    comfortTips: [
      {
        title: 'Jemná hygiena',
        text: 'Uprednostnite jemné, pravidelné umývanie bez dráždivých prípravkov.',
      },
      {
        title: 'Sledujte vývoj',
        text: 'Môžete si zaznamenať farbu, množstvo a vývoj výtoku, ak vám to pomáha sledovať zotavovanie.',
      },
      {
        title: 'Doprajte si odpočinok',
        text: 'Obdobie po pôrode si vyžaduje čas. Počúvajte svoje telo a rešpektujte svoju potrebu zotaviť sa.',
      },
    ],
    section5Heading: '5. Lóchie alebo návrat menštruácie?',
    section5Body:
      'Lóchie sa objavujú v dňoch po pôrode a postupne ustupujú. Návrat menštruácie naopak zodpovedá obnoveniu vášho menštruačného cyklu po tomto období.',
    compareLochiaTitle: 'Lóchie',
    compareLochiaText: 'Výtok súvisiaci so zotavovaním maternice po pôrode.',
    compareReturnTitle: 'Návrat menštruácie',
    compareReturnText:
      'Obnovenie menštruačného cyklu v čase, ktorý sa líši od ženy k žene.',
    section6Heading: '6. Kedy vyhľadať lekársku radu?',
    section6Body:
      'Ak sa vám vývoj zdá nezvyčajný alebo sa váš celkový stav zhoršuje, je dôležité poradiť sa so zdravotníckym pracovníkom.',
    warningTitle: 'Znaky, ktoré vyžadujú lekársku radu',
    warningSigns: [
      'Silný alebo nezvyčajný zápach',
      'Horúčka alebo zhoršujúci sa celkový stav',
      'Krvácanie, ktoré sa náhle výrazne zosilní',
      'Výrazná, pretrvávajúca alebo nezvyčajná bolesť',
      'Nový príznak, ktorý vás znepokojuje',
    ],
    tipTitle: 'Stojí za to vedieť',
    tipText:
      'Lóchie sa zvyčajne vyvíjajú postupne: najprv môžu byť červené, potom sa zosvetľujú a ustávajú. Každé zotavovanie je však individuálne.',
    summaryHeading: 'Hlavné body',
    summaryPoints: [
      'Lóchie sú normálny výtok po pôrode.',
      'Zvyčajne sa v priebehu týždňov mení ich farba a množstvo.',
      'Ich trvanie a vývoj sa môžu líšiť od ženy k žene.',
      'Nezvyčajný zápach, horúčka, výrazná bolesť alebo náhle veľmi silné krvácanie vyžadujú lekársku radu.',
    ],
    disclaimerText:
      'Informatívny obsah. Tento článok nenahrádza lekársku radu ani vyšetrenie. V prípade pochybností alebo pri znepokojujúcom príznaku sa poraďte so zdravotníckym pracovníkom.',
    shareMessage: 'Pochopenie lóchií po pôrode — AWA',
  },
  hu: {
    badgeText: 'SZÜLÉS UTÁN • GYERMEKÁGYI VÉRZÉS',
    title: 'A gyermekágyi vérzés\nmegértése szülés után',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Tájékoztató jellegű tartalom',
    intro:
      'Szülés után a gyermekágyi vérzés a méh természetes regenerálódásához kapcsolódó hüvelyi folyás. Színe és mennyisége a következő napokban és hetekben fokozatosan változik.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi a gyermekágyi vérzés?',
      'Hogyan változik az idő során?',
      'Ami normális lehet',
      'Tippek a kényelemhez',
      'Mikor kérj orvosi tanácsot?',
      'Legfontosabb tudnivalók',
    ],
    section1Heading: '1. Mi a gyermekágyi vérzés?',
    section1Body1:
      'A gyermekágyi vérzés a szülés után jelentkező hüvelyi folyás. Főként a vér, a váladékok és a szövetek fokozatos kiürülésből áll a méhből, miközben az regenerálódik.',
    section1Body2:
      'Különbözik a szokásos menstruációtól. A szülés utáni időszakban várható, és általában fokozatosan csökken.',
    infoTitle: 'Legfontosabb tudnivalók',
    infoText:
      'A gyermekágyi vérzés nem azt jelenti, hogy a menstruációd már visszatért. A menstruáció visszatérése különálló esemény, amely később következik be.',
    section2Heading: '2. Hogyan változik a gyermekágyi vérzés az idő során?',
    section2Body:
      'A megjelenése általában az első hetekben változik. A szín fokozatosan világosabbá válik, a mennyiség pedig csökkenni szokott.',
    evolutionTitle: 'Fokozatos fejlődés',
    evolutionSubtitle: 'A szakaszok nőnként eltérhetnek',
    evolution: [
      {
        label: 'Élénkvörös',
        period: 'Az első napok',
        text: 'A folyás általában vörös, és az elején erősebb lehet.',
      },
      {
        label: 'Rózsaszínes / barnás',
        period: 'Néhány nap után',
        text: 'A szín fokozatosan világosabbá válik, és rózsaszínbe vagy barnába hajolhat.',
      },
      {
        label: 'Fehéres-sárgás',
        period: 'A következő hetekben',
        text: 'A folyás általában világosabbá, sárgásabbá vagy fehéresebbé válik, mielőtt elapad.',
      },
    ],
    section3Heading: '3. Ami normális lehet',
    section3Body:
      'A gyermekágyi vérzés alakulása nem pontosan ugyanolyan mindenkinél. Bizonyos változások természetesen kísérhetik a szülés utáni regenerálódást.',
    normalPoints: [
      {
        title: 'Változó mennyiség',
        text: 'A mennyiség az első napokban változhat, majd fokozatosan csökken.',
      },
      {
        title: 'Változó szín',
        text: 'A gyermekágyi vérzés általában idővel a vöröstől a világosabb árnyalatok felé halad.',
      },
      {
        title: 'Változó időtartam',
        text: 'Több hétig is fennmaradhat, és az alakulása nőnként eltér.',
      },
    ],
    section4Heading: '4. Tippek a kényelemhez és a követéshez',
    section4Body:
      'Ebben az időszakban az egyszerű követés segíthet megfigyelni, hogyan változik a tested, anélkül, hogy a saját tapasztalatodat másokéhoz hasonlítanád.',
    comfortTips: [
      {
        title: 'Kíméletes higiénia',
        text: 'Részesítsd előnyben a kíméletes, rendszeres mosakodást irritáló termékek nélkül.',
      },
      {
        title: 'Figyeld az alakulást',
        text: 'Feljegyezheted a folyás színét, mennyiségét és alakulását, ha ez segít a felépülésed követésében.',
      },
      {
        title: 'Engedj meg magadnak pihenést',
        text: 'A szülés utáni időszak időt igényel. Figyelj a testedre, és tiszteld a regenerálódás iránti igényedet.',
      },
    ],
    section5Heading: '5. Gyermekágyi vérzés vagy a menstruáció visszatérése?',
    section5Body:
      'A gyermekágyi vérzés a szülés utáni napokban jelentkezik, és fokozatosan csökken. A menstruáció visszatérése ezzel szemben a menstruációs ciklusod ezt az időszakot követő újraindulásának felel meg.',
    compareLochiaTitle: 'Gyermekágyi vérzés',
    compareLochiaText: 'A szülés utáni méhregenerálódáshoz kapcsolódó folyás.',
    compareReturnTitle: 'A menstruáció visszatérése',
    compareReturnText:
      'A menstruációs ciklus újraindulása, nőnként eltérő időben.',
    section6Heading: '6. Mikor kérj orvosi tanácsot?',
    section6Body:
      'Ha az alakulás szokatlannak tűnik, vagy az általános állapotod romlik, fontos egészségügyi szakember tanácsát kérni.',
    warningTitle: 'Orvosi tanácsot igénylő jelek',
    warningSigns: [
      'Erős vagy szokatlan szag',
      'Láz vagy romló általános állapot',
      'Hirtelen jóval erősebbé váló vérzés',
      'Jelentős, tartós vagy szokatlan fájdalom',
      'Új tünet, amely aggaszt',
    ],
    tipTitle: 'Érdemes tudni',
    tipText:
      'A gyermekágyi vérzés általában fokozatosan alakul: eleinte vörös lehet, majd világosabbá válik, mielőtt elapad. Mindenesetre minden felépülés egyéni.',
    summaryHeading: 'Legfontosabb tudnivalók',
    summaryPoints: [
      'A gyermekágyi vérzés normális folyás szülés után.',
      'Színe és mennyisége általában változik a hetek során.',
      'Időtartama és alakulása nőnként eltérhet.',
      'A szokatlan szag, láz, jelentős fájdalom vagy hirtelen nagyon erős vérzés orvosi tanácsot igényel.',
    ],
    disclaimerText:
      'Tájékoztató jellegű tartalom. Ez a cikk nem helyettesíti az orvosi tanácsot vagy vizsgálatot. Kétség esetén vagy aggasztó tünet észlelésekor kérj tanácsot egészségügyi szakembertől.',
    shareMessage: 'A gyermekágyi vérzés megértése szülés után — AWA',
  },
  ro: {
    badgeText: 'POSTNATAL • LOHII',
    title: 'Înțelegerea lohiilor\nde după naștere',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut informativ',
    intro:
      'După naștere, lohiile desemnează secrețiile vaginale legate de procesul natural de refacere a uterului. Culoarea și cantitatea lor se schimbă treptat în zilele și săptămânile următoare.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce sunt lohiile?',
      'Cum se schimbă în timp?',
      'Ce poate fi normal',
      'Sfaturi de confort',
      'Când să ceri un sfat medical?',
      'Ce să reții',
    ],
    section1Heading: '1. Ce sunt lohiile?',
    section1Body1:
      'Lohiile sunt secreții vaginale care apar după naștere. Ele constau în principal în eliminarea treptată a sângelui, a secrețiilor și a țesutului din uter în timp ce acesta își revine.',
    section1Body2:
      'Sunt diferite de o menstruație obișnuită. Sunt așteptate în perioada postnatală și scad în general progresiv.',
    infoTitle: 'Ce să reții',
    infoText:
      'Lohiile nu înseamnă că menstruația ți-a revenit deja. Revenirea menstruației este un eveniment separat, care are loc mai târziu.',
    section2Heading: '2. Cum se schimbă lohiile în timp?',
    section2Body:
      'Aspectul lor se schimbă de obicei în primele săptămâni. Culoarea devine treptat mai deschisă, iar cantitatea tinde să scadă.',
    evolutionTitle: 'O evoluție treptată',
    evolutionSubtitle: 'Etapele pot varia de la o persoană la alta',
    evolution: [
      {
        label: 'Roșu aprins',
        period: 'Primele zile',
        text: 'Secrețiile sunt de obicei roșii și pot fi mai abundente la început.',
      },
      {
        label: 'Roz / maroniu',
        period: 'După câteva zile',
        text: 'Culoarea devine treptat mai deschisă și se poate îndrepta spre roz sau maro.',
      },
      {
        label: 'Alb-gălbui',
        period: 'În săptămânile următoare',
        text: 'Secrețiile devin de obicei mai ușoare, gălbui sau albicioase, înainte de a se reduce treptat.',
      },
    ],
    section3Heading: '3. Ce poate fi normal',
    section3Body:
      'Evoluția lohiilor nu este exact aceeași pentru toată lumea. Anumite schimbări pot însoți în mod natural recuperarea de după naștere.',
    normalPoints: [
      {
        title: 'O cantitate variabilă',
        text: 'Cantitatea se poate schimba în primele zile și apoi scade treptat.',
      },
      {
        title: 'O culoare care se schimbă',
        text: 'Lohiile trec de obicei de la roșu către nuanțe mai deschise în timp.',
      },
      {
        title: 'O durată variabilă',
        text: 'Pot persista câteva săptămâni, iar evoluția lor diferă de la o persoană la alta.',
      },
    ],
    section4Heading: '4. Sfaturi de confort și urmărire',
    section4Body:
      'În această perioadă, o urmărire simplă te poate ajuta să observi cum se schimbă corpul tău, fără a-ți compara experiența cu a altcuiva.',
    comfortTips: [
      {
        title: 'Igienă blândă',
        text: 'Alege o spălare blândă și regulată, fără produse iritante.',
      },
      {
        title: 'Urmărește evoluția',
        text: 'Poți nota culoarea, cantitatea și evoluția secrețiilor dacă te ajută să-ți urmărești recuperarea.',
      },
      {
        title: 'Permite-ți odihna',
        text: 'Perioada postnatală are nevoie de timp. Ascultă-ți corpul și respectă-ți nevoia de recuperare.',
      },
    ],
    section5Heading: '5. Lohii sau revenirea menstruației?',
    section5Body:
      'Lohiile apar în zilele de după naștere și scad treptat. Revenirea menstruației, în schimb, corespunde reluării ciclului tău menstrual după această perioadă.',
    compareLochiaTitle: 'Lohiile',
    compareLochiaText: 'Secreții legate de refacerea uterului după naștere.',
    compareReturnTitle: 'Revenirea menstruației',
    compareReturnText:
      'Reluarea ciclului menstrual, la un moment care variază de la o persoană la alta.',
    section6Heading: '6. Când să ceri un sfat medical?',
    section6Body:
      'Dacă evoluția ți se pare neobișnuită sau dacă starea ta generală se agravează, este important să ceri sfatul unui profesionist din domeniul sănătății.',
    warningTitle: 'Semne care cer un sfat medical',
    warningSigns: [
      'Un miros puternic sau neobișnuit',
      'Febră sau o stare generală care se agravează',
      'Un flux care devine brusc mult mai abundent',
      'Durere importantă, persistentă sau neobișnuită',
      'Un simptom nou care te îngrijorează',
    ],
    tipTitle: 'Bine de știut',
    tipText:
      'Lohiile evoluează de obicei treptat: pot fi roșii la început, apoi devin mai deschise înainte de a se reduce. Cu toate acestea, fiecare recuperare este individuală.',
    summaryHeading: 'Ce să reții',
    summaryPoints: [
      'Lohiile sunt secreții normale după naștere.',
      'Își schimbă de obicei culoarea și cantitatea pe parcursul săptămânilor.',
      'Durata și evoluția lor pot varia de la o persoană la alta.',
      'Un miros neobișnuit, febra, durerea importantă sau o sângerare bruscă, foarte abundentă necesită un sfat medical.',
    ],
    disclaimerText:
      'Conținut cu caracter informativ. Acest articol nu înlocuiește sfatul medical sau un examen. Dacă ai îndoieli sau observi un simptom îngrijorător, cere sfatul unui profesionist din domeniul sănătății.',
    shareMessage: 'Înțelegerea lohiilor de după naștere — AWA',
  },
  bg: {
    badgeText: 'СЛЕД РАЖДАНЕ • ЛОХИИ',
    title: 'Разбиране на лохиите\nслед раждане',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Информационно съдържание',
    intro:
      'След раждане лохиите означават вагиналните секрети, свързани с естествения процес на възстановяване на матката. Цветът и количеството им се променят постепенно през следващите дни и седмици.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво са лохиите?',
      'Как се променят във времето?',
      'Какво може да е нормално',
      'Съвети за комфорт',
      'Кога да потърсиш медицински съвет?',
      'Какво да запомниш',
    ],
    section1Heading: '1. Какво са лохиите?',
    section1Body1:
      'Лохиите са вагинални секрети, които се появяват след раждане. Те се състоят главно от постепенното отделяне на кръв, секрети и тъкан от матката, докато тя се възстановява.',
    section1Body2:
      'Различават се от обикновената менструация. Очакват се в периода след раждане и обикновено намаляват прогресивно.',
    infoTitle: 'Какво да запомниш',
    infoText:
      'Лохиите не означават, че менструацията ти вече се е върнала. Връщането на менструацията е отделно събитие, което настъпва по-късно.',
    section2Heading: '2. Как се променят лохиите във времето?',
    section2Body:
      'Видът им обикновено се променя през първите седмици. Цветът постепенно става по-светъл, а количеството има склонност да намалява.',
    evolutionTitle: 'Постепенно развитие',
    evolutionSubtitle: 'Етапите могат да варират от човек на човек',
    evolution: [
      {
        label: 'Ярко червено',
        period: 'Първите дни',
        text: 'Секретите обикновено са червени и в началото могат да бъдат по-обилни.',
      },
      {
        label: 'Розово / кафеникаво',
        period: 'След няколко дни',
        text: 'Цветът постепенно става по-светъл и може да премине към розов или кафяв.',
      },
      {
        label: 'Белезникаво-жълтеникаво',
        period: 'През следващите седмици',
        text: 'Секретите обикновено стават по-леки, жълтеникави или белезникави, преди да затихнат.',
      },
    ],
    section3Heading: '3. Какво може да е нормално',
    section3Body:
      'Развитието на лохиите не е съвсем същото за всички. Някои промени могат естествено да съпътстват възстановяването след раждане.',
    normalPoints: [
      {
        title: 'Променливо количество',
        text: 'Количеството може да се променя през първите няколко дни и после постепенно да намалява.',
      },
      {
        title: 'Цвят, който се променя',
        text: 'Лохиите обикновено преминават от червено към по-светли нюанси във времето.',
      },
      {
        title: 'Променлива продължителност',
        text: 'Могат да продължат няколко седмици, а развитието им се различава от човек на човек.',
      },
    ],
    section4Heading: '4. Съвети за комфорт и проследяване',
    section4Body:
      'През този период простото проследяване може да ти помогне да наблюдаваш как се променя тялото ти, без да сравняваш преживяването си с чуждото.',
    comfortTips: [
      {
        title: 'Нежна хигиена',
        text: 'Предпочитай нежно и редовно измиване без дразнещи продукти.',
      },
      {
        title: 'Следи как се развива',
        text: 'Можеш да отбелязваш цвета, количеството и развитието на секретите, ако това ти помага да следиш възстановяването си.',
      },
      {
        title: 'Позволи си почивка',
        text: 'Периодът след раждане изисква време. Вслушвай се в тялото си и уважавай нуждата си от възстановяване.',
      },
    ],
    section5Heading: '5. Лохии или връщане на менструацията?',
    section5Body:
      'Лохиите се появяват в дните след раждането и постепенно намаляват. Връщането на менструацията, от друга страна, съответства на възобновяването на менструалния ти цикъл след този период.',
    compareLochiaTitle: 'Лохии',
    compareLochiaText: 'Секрети, свързани с възстановяването на матката след раждане.',
    compareReturnTitle: 'Връщане на менструацията',
    compareReturnText:
      'Възобновяване на менструалния цикъл, в момент, който варира от човек на човек.',
    section6Heading: '6. Кога да потърсиш медицински съвет?',
    section6Body:
      'Ако развитието ти се струва необичайно или ако общото ти състояние се влошава, важно е да потърсиш съвет от здравен специалист.',
    warningTitle: 'Признаци, които изискват медицински съвет',
    warningSigns: [
      'Силна или необичайна миризма',
      'Температура или влошаване на общото състояние',
      'Поток, който внезапно става много по-обилен',
      'Значителна, упорита или необичайна болка',
      'Нов симптом, който те тревожи',
    ],
    tipTitle: 'Добре е да знаеш',
    tipText:
      'Лохиите обикновено се развиват постепенно: може да са червени в началото, после да станат по-светли, преди да затихнат. Въпреки това всяко възстановяване е индивидуално.',
    summaryHeading: 'Какво да запомниш',
    summaryPoints: [
      'Лохиите са нормални секрети след раждане.',
      'Обикновено променят цвета и количеството си през седмиците.',
      'Продължителността и развитието им могат да варират от човек на човек.',
      'Необичайна миризма, температура, значителна болка или внезапно много обилно кървене изискват медицински съвет.',
    ],
    disclaimerText:
      'Информационно съдържание. Тази статия не замества медицинския съвет или прегледа. При съмнение или ако забележиш тревожен симптом, потърси съвет от здравен специалист.',
    shareMessage: 'Разбиране на лохиите след раждане — AWA',
  },
  sr: {
    badgeText: 'ПОСЛЕ ПОРОЂАЈА • ЛОХИЈЕ',
    title: 'Разумевање лохија\nпосле порођаја',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Информативни садржај',
    intro:
      'После порођаја лохије означавају вагинални исцедак повезан са природним процесом опоравка материце. Њихова боја и количина постепено се мењају током наредних дана и недеља.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта су лохије?',
      'Како се мењају током времена?',
      'Шта може бити нормално',
      'Савети за удобност',
      'Када потражити медицински савет?',
      'Шта да запамтиш',
    ],
    section1Heading: '1. Шта су лохије?',
    section1Body1:
      'Лохије су вагинални исцедак који се појављује после порођаја. Састоје се углавном од постепеног излучивања крви, секрета и ткива из материце док се она опоравља.',
    section1Body2:
      'Разликују се од обичне менструације. Очекују се у периоду после порођаја и обично се прогресивно смањују.',
    infoTitle: 'Шта да запамтиш',
    infoText:
      'Лохије не значе да ти се менструација већ вратила. Повратак менструације је посебан догађај који се дешава касније.',
    section2Heading: '2. Како се лохије мењају током времена?',
    section2Body:
      'Њихов изглед се обично мења током првих неколико недеља. Боја постепено постаје светлија, а количина има тенденцију да се смањује.',
    evolutionTitle: 'Постепен развој',
    evolutionSubtitle: 'Фазе могу варирати од особе до особе',
    evolution: [
      {
        label: 'Јарко црвене',
        period: 'Први дани',
        text: 'Исцедак је обично црвен и на почетку може бити обилнији.',
      },
      {
        label: 'Розе / смеђкасте',
        period: 'После неколико дана',
        text: 'Боја постепено постаје светлија и може прећи у розе или смеђу.',
      },
      {
        label: 'Беличасто-жућкасте',
        period: 'Током наредних недеља',
        text: 'Исцедак обично постаје лакши, жућкаст или беличаст, пре него што нестане.',
      },
    ],
    section3Heading: '3. Шта може бити нормално',
    section3Body:
      'Развој лохија није потпуно исти за све. Одређене промене могу природно пратити опоравак после порођаја.',
    normalPoints: [
      {
        title: 'Променљива количина',
        text: 'Количина се може мењати током првих неколико дана, а затим постепено смањивати.',
      },
      {
        title: 'Боја која се мења',
        text: 'Лохије обично током времена прелазе из црвене у светлије нијансе.',
      },
      {
        title: 'Променљиво трајање',
        text: 'Могу трајати неколико недеља, а њихов развој се разликује од особе до особе.',
      },
    ],
    section4Heading: '4. Савети за удобност и праћење',
    section4Body:
      'У овом периоду једноставно праћење може ти помоћи да посматраш како се твоје тело мења, без упоређивања свог искуства са туђим.',
    comfortTips: [
      {
        title: 'Нежна хигијена',
        text: 'Предност дај нежном, редовном прању без иритирајућих производа.',
      },
      {
        title: 'Прати развој',
        text: 'Можеш бележити боју, количину и развој исцедка ако ти то помаже да пратиш свој опоравак.',
      },
      {
        title: 'Дозволи себи одмор',
        text: 'Период после порођаја захтева време. Слушај своје тело и поштуј своју потребу за опоравком.',
      },
    ],
    section5Heading: '5. Лохије или повратак менструације?',
    section5Body:
      'Лохије се јављају у данима после порођаја и постепено се смањују. Повратак менструације, с друге стране, одговара поновном успостављању менструалног циклуса после овог периода.',
    compareLochiaTitle: 'Лохије',
    compareLochiaText: 'Исцедак повезан са опоравком материце после порођаја.',
    compareReturnTitle: 'Повратак менструације',
    compareReturnText:
      'Поновно успостављање менструалног циклуса, у тренутку који варира од особе до особе.',
    section6Heading: '6. Када потражити медицински савет?',
    section6Body:
      'Ако ти се развој чини необичним или ако се твоје опште стање погоршава, важно је да потражиш савет од здравственог радника.',
    warningTitle: 'Знаци који захтевају медицински савет',
    warningSigns: [
      'Јак или необичан мирис',
      'Температура или погоршање општег стања',
      'Проток који изненада постаје много обилнији',
      'Значајан, упоран или необичан бол',
      'Нов симптом који те брине',
    ],
    tipTitle: 'Добро је знати',
    tipText:
      'Лохије се обично развијају постепено: могу бити црвене на почетку, а затим постати светлије пре него што нестану. Ипак, сваки опоравак је индивидуалан.',
    summaryHeading: 'Шта да запамтиш',
    summaryPoints: [
      'Лохије су нормалан исцедак после порођаја.',
      'Обично мењају боју и количину током недеља.',
      'Њихово трајање и развој могу варирати од особе до особе.',
      'Необичан мирис, температура, значајан бол или изненадно веома обилно крварење захтевају медицински савет.',
    ],
    disclaimerText:
      'Информативни садржај. Овај чланак не замењује медицински савет или преглед. При сумњи или ако приметиш забрињавајући симптом, потражи савет од здравственог радника.',
    shareMessage: 'Разумевање лохија после порођаја — AWA',
  },
  hr: {
    badgeText: 'NAKON PORODA • LOHIJE',
    title: 'Razumijevanje lohija\nnakon poroda',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Informativni sadržaj',
    intro:
      'Nakon poroda lohije označavaju vaginalni iscjedak povezan s prirodnim procesom oporavka maternice. Njegova boja i količina postupno se mijenjaju tijekom sljedećih dana i tjedana.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što su lohije?',
      'Kako se mijenjaju tijekom vremena?',
      'Što može biti normalno',
      'Savjeti za ugodu',
      'Kada zatražiti liječnički savjet?',
      'Ključne poruke',
    ],
    section1Heading: '1. Što su lohije?',
    section1Body1:
      'Lohije su vaginalni iscjedak koji se javlja nakon poroda. Uglavnom se sastoje od postupnog izlučivanja krvi, sekreta i tkiva iz maternice dok se ona oporavlja.',
    section1Body2:
      'Razlikuju se od uobičajene menstruacije. Očekivane su u razdoblju nakon poroda i općenito se postupno smanjuju.',
    infoTitle: 'Ključne poruke',
    infoText:
      'Lohije ne znače da ti se menstruacija već vratila. Povratak menstruacije zaseban je događaj koji nastupa kasnije.',
    section2Heading: '2. Kako se lohije mijenjaju tijekom vremena?',
    section2Body:
      'Njihov se izgled obično mijenja tijekom prvih nekoliko tjedana. Boja postupno postaje svjetlija, a količina se obično smanjuje.',
    evolutionTitle: 'Postupan tijek',
    evolutionSubtitle: 'Faze se mogu razlikovati od osobe do osobe',
    evolution: [
      {
        label: 'Svijetlocrvene',
        period: 'Prvi dani',
        text: 'Iscjedak je obično crven i na početku može biti obilniji.',
      },
      {
        label: 'Ružičaste / smećkaste',
        period: 'Nakon nekoliko dana',
        text: 'Boja postupno postaje svjetlija i može se pomaknuti prema ružičastoj ili smeđoj.',
      },
      {
        label: 'Bjelkasto-žute',
        period: 'Tijekom sljedećih tjedana',
        text: 'Iscjedak obično postaje blaži, žućkast ili bjelkast, prije nego što se postupno povuče.',
      },
    ],
    section3Heading: '3. Što može biti normalno',
    section3Body:
      'Tijek lohija nije jednak za svaku ženu. Određene promjene mogu prirodno pratiti oporavak nakon poroda.',
    normalPoints: [
      {
        title: 'Promjenjiva količina',
        text: 'Količina se može mijenjati tijekom prvih nekoliko dana, a zatim se postupno smanjivati.',
      },
      {
        title: 'Boja koja se mijenja',
        text: 'Lohije obično prelaze iz crvene u svjetlije nijanse tijekom vremena.',
      },
      {
        title: 'Promjenjivo trajanje',
        text: 'Mogu potrajati nekoliko tjedana, a njihov se tijek razlikuje od osobe do osobe.',
      },
    ],
    section4Heading: '4. Savjeti za ugodu i praćenje',
    section4Body:
      'Tijekom tog razdoblja jednostavno praćenje može ti pomoći promatrati kako se tvoje tijelo mijenja, bez uspoređivanja svog iskustva s tuđim.',
    comfortTips: [
      {
        title: 'Nježna higijena',
        text: 'Daj prednost nježnom, redovitom pranju bez proizvoda koji iritiraju.',
      },
      {
        title: 'Prati tijek',
        text: 'Možeš zabilježiti boju, količinu i tijek iscjetka ako ti to pomaže pratiti oporavak.',
      },
      {
        title: 'Dopusti si odmor',
        text: 'Razdoblje nakon poroda traži vremena. Slušaj svoje tijelo i poštuj svoju potrebu za oporavkom.',
      },
    ],
    section5Heading: '5. Lohije ili povratak menstruacije?',
    section5Body:
      'Lohije se javljaju u danima nakon poroda i postupno se smanjuju. Povratak menstruacije, s druge strane, odgovara ponovnom uspostavljanju tvog menstrualnog ciklusa nakon tog razdoblja.',
    compareLochiaTitle: 'Lohije',
    compareLochiaText: 'Iscjedak povezan s oporavkom maternice nakon poroda.',
    compareReturnTitle: 'Povratak menstruacije',
    compareReturnText:
      'Ponovno uspostavljanje menstrualnog ciklusa, u trenutku koji se razlikuje od osobe do osobe.',
    section6Heading: '6. Kada zatražiti liječnički savjet?',
    section6Body:
      'Ako ti se tijek čini neobičnim ili ti se opće stanje pogoršava, važno je zatražiti savjet zdravstvenog djelatnika.',
    warningTitle: 'Znakovi koji zahtijevaju liječnički savjet',
    warningSigns: [
      'Jak ili neobičan miris',
      'Vrućica ili pogoršanje općeg stanja',
      'Protok koji iznenada postaje znatno obilniji',
      'Jaka, dugotrajna ili neobična bol',
      'Novi simptom koji te brine',
    ],
    tipTitle: 'Dobro je znati',
    tipText:
      'Lohije se obično mijenjaju postupno: na početku mogu biti crvene, a zatim postati svjetlije prije nego što se povuku. Međutim, svaki je oporavak individualan.',
    summaryHeading: 'Ključne poruke',
    summaryPoints: [
      'Lohije su normalan iscjedak nakon poroda.',
      'Obično mijenjaju boju i količinu tijekom tjedana.',
      'Njihovo trajanje i tijek mogu se razlikovati od osobe do osobe.',
      'Neobičan miris, vrućica, jaka bol ili iznenadno vrlo obilno krvarenje zahtijevaju liječnički savjet.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovaj članak ne zamjenjuje liječnički savjet ni pregled. U slučaju nedoumice ili ako primijetiš simptom koji te brine, zatraži savjet zdravstvenog djelatnika.',
    shareMessage: 'Razumijevanje lohija nakon poroda — AWA',
  },
  bs: {
    badgeText: 'NAKON PORODA • LOHIJE',
    title: 'Razumijevanje lohija\nnakon porođaja',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Informativni sadržaj',
    intro:
      'Nakon porođaja lohije označavaju vaginalni iscjedak povezan s prirodnim procesom oporavka maternice. Njegova boja i količina postupno se mijenjaju tokom sljedećih dana i sedmica.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što su lohije?',
      'Kako se mijenjaju tokom vremena?',
      'Što može biti normalno',
      'Savjeti za ugodu',
      'Kada zatražiti ljekarski savjet?',
      'Ključne poruke',
    ],
    section1Heading: '1. Što su lohije?',
    section1Body1:
      'Lohije su vaginalni iscjedak koji se javlja nakon porođaja. Uglavnom se sastoje od postupnog izlučivanja krvi, sekreta i tkiva iz maternice dok se ona oporavlja.',
    section1Body2:
      'Razlikuju se od uobičajene menstruacije. Očekivane su u razdoblju nakon porođaja i općenito se postupno smanjuju.',
    infoTitle: 'Ključne poruke',
    infoText:
      'Lohije ne znače da ti se menstruacija već vratila. Povratak menstruacije zaseban je događaj koji nastupa kasnije.',
    section2Heading: '2. Kako se lohije mijenjaju tokom vremena?',
    section2Body:
      'Njihov se izgled obično mijenja tokom prvih nekoliko sedmica. Boja postupno postaje svjetlija, a količina se obično smanjuje.',
    evolutionTitle: 'Postupan tok',
    evolutionSubtitle: 'Faze se mogu razlikovati od osobe do osobe',
    evolution: [
      {
        label: 'Svijetlocrvene',
        period: 'Prvi dani',
        text: 'Iscjedak je obično crven i na početku može biti obilniji.',
      },
      {
        label: 'Ružičaste / smećkaste',
        period: 'Nakon nekoliko dana',
        text: 'Boja postupno postaje svjetlija i može se pomaknuti prema ružičastoj ili smeđoj.',
      },
      {
        label: 'Bjelkasto-žute',
        period: 'Tokom sljedećih sedmica',
        text: 'Iscjedak obično postaje blaži, žućkast ili bjelkast, prije nego što se postupno povuče.',
      },
    ],
    section3Heading: '3. Što može biti normalno',
    section3Body:
      'Tok lohija nije jednak za svaku ženu. Određene promjene mogu prirodno pratiti oporavak nakon porođaja.',
    normalPoints: [
      {
        title: 'Promjenjiva količina',
        text: 'Količina se može mijenjati tokom prvih nekoliko dana, a zatim se postupno smanjivati.',
      },
      {
        title: 'Boja koja se mijenja',
        text: 'Lohije obično prelaze iz crvene u svjetlije nijanse tokom vremena.',
      },
      {
        title: 'Promjenjivo trajanje',
        text: 'Mogu potrajati nekoliko sedmica, a njihov se tok razlikuje od osobe do osobe.',
      },
    ],
    section4Heading: '4. Savjeti za ugodu i praćenje',
    section4Body:
      'Tokom tog razdoblja jednostavno praćenje može ti pomoći promatrati kako se tvoje tijelo mijenja, bez uspoređivanja svog iskustva s tuđim.',
    comfortTips: [
      {
        title: 'Nježna higijena',
        text: 'Daj prednost nježnom, redovitom pranju bez proizvoda koji iritiraju.',
      },
      {
        title: 'Prati tok',
        text: 'Možeš zabilježiti boju, količinu i tok iscjetka ako ti to pomaže pratiti oporavak.',
      },
      {
        title: 'Dopusti si odmor',
        text: 'Razdoblje nakon porođaja traži vremena. Slušaj svoje tijelo i poštuj svoju potrebu za oporavkom.',
      },
    ],
    section5Heading: '5. Lohije ili povratak menstruacije?',
    section5Body:
      'Lohije se javljaju u danima nakon porođaja i postupno se smanjuju. Povratak menstruacije, s druge strane, odgovara ponovnom uspostavljanju tvog menstrualnog ciklusa nakon tog razdoblja.',
    compareLochiaTitle: 'Lohije',
    compareLochiaText: 'Iscjedak povezan s oporavkom maternice nakon porođaja.',
    compareReturnTitle: 'Povratak menstruacije',
    compareReturnText:
      'Ponovno uspostavljanje menstrualnog ciklusa, u trenutku koji se razlikuje od osobe do osobe.',
    section6Heading: '6. Kada zatražiti ljekarski savjet?',
    section6Body:
      'Ako ti se tok čini neobičnim ili ti se opće stanje pogoršava, važno je zatražiti savjet zdravstvenog radnika.',
    warningTitle: 'Znakovi koji zahtijevaju ljekarski savjet',
    warningSigns: [
      'Jak ili neobičan miris',
      'Vrućica ili pogoršanje općeg stanja',
      'Protok koji iznenada postaje znatno obilniji',
      'Jaka, dugotrajna ili neobična bol',
      'Novi simptom koji te brine',
    ],
    tipTitle: 'Dobro je znati',
    tipText:
      'Lohije se obično mijenjaju postupno: na početku mogu biti crvene, a zatim postati svjetlije prije nego što se povuku. Međutim, svaki je oporavak individualan.',
    summaryHeading: 'Ključne poruke',
    summaryPoints: [
      'Lohije su normalan iscjedak nakon porođaja.',
      'Obično mijenjaju boju i količinu tokom sedmica.',
      'Njihovo trajanje i tok mogu se razlikovati od osobe do osobe.',
      'Neobičan miris, vrućica, jaka bol ili iznenadno vrlo obilno krvarenje zahtijevaju ljekarski savjet.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovaj članak ne zamjenjuje ljekarski savjet ni pregled. U slučaju nedoumice ili ako primijetiš simptom koji te brine, zatraži savjet zdravstvenog radnika.',
    shareMessage: 'Razumijevanje lohija nakon porođaja — AWA',
  },
  sl: {
    badgeText: 'PO PORODU • LOHIJE',
    title: 'Razumevanje lohij\npo porodu',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Informativna vsebina',
    intro:
      'Po porodu lohije pomenijo nožnični izcedek, povezan z naravnim procesom okrevanja maternice. Njegova barva in količina se postopoma spreminjata v naslednjih dneh in tednih.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj so lohije?',
      'Kako se spreminjajo skozi čas?',
      'Kaj je lahko normalno',
      'Nasveti za udobje',
      'Kdaj poiskati zdravniški nasvet?',
      'Ključna sporočila',
    ],
    section1Heading: '1. Kaj so lohije?',
    section1Body1:
      'Lohije so nožnični izcedek, ki se pojavi po porodu. Večinoma jih sestavlja postopno izločanje krvi, izločkov in tkiva iz maternice, ko si ta opomore.',
    section1Body2:
      'Razlikujejo se od običajne menstruacije. Pričakovane so v obdobju po porodu in se na splošno postopoma zmanjšujejo.',
    infoTitle: 'Ključna sporočila',
    infoText:
      'Lohije ne pomenijo, da se ti je menstruacija že vrnila. Vrnitev menstruacije je ločen dogodek, ki nastopi pozneje.',
    section2Heading: '2. Kako se lohije spreminjajo skozi čas?',
    section2Body:
      'Njihov videz se običajno spreminja v prvih nekaj tednih. Barva postopoma postaja svetlejša, količina pa se običajno zmanjšuje.',
    evolutionTitle: 'Postopen potek',
    evolutionSubtitle: 'Faze se lahko razlikujejo od osebe do osebe',
    evolution: [
      {
        label: 'Svetlo rdeče',
        period: 'Prvi dnevi',
        text: 'Izcedek je običajno rdeč in je na začetku lahko obilnejši.',
      },
      {
        label: 'Rožnate / rjavkaste',
        period: 'Po nekaj dneh',
        text: 'Barva postopoma postaja svetlejša in se lahko premakne proti roza ali rjavi.',
      },
      {
        label: 'Beličasto-rumene',
        period: 'V naslednjih tednih',
        text: 'Izcedek običajno postane blažji, rumenkast ali beličast, preden se postopoma umakne.',
      },
    ],
    section3Heading: '3. Kaj je lahko normalno',
    section3Body:
      'Potek lohij ni enak pri vsaki ženski. Določene spremembe lahko naravno spremljajo okrevanje po porodu.',
    normalPoints: [
      {
        title: 'Spremenljiva količina',
        text: 'Količina se lahko spreminja v prvih nekaj dneh, nato pa se postopoma zmanjšuje.',
      },
      {
        title: 'Barva, ki se spreminja',
        text: 'Lohije običajno prehajajo iz rdeče v svetlejše odtenke skozi čas.',
      },
      {
        title: 'Spremenljivo trajanje',
        text: 'Lahko trajajo nekaj tednov, njihov potek pa se razlikuje od osebe do osebe.',
      },
    ],
    section4Heading: '4. Nasveti za udobje in spremljanje',
    section4Body:
      'V tem obdobju ti lahko preprosto spremljanje pomaga opazovati, kako se tvoje telo spreminja, brez primerjanja svoje izkušnje s tujo.',
    comfortTips: [
      {
        title: 'Nežna higiena',
        text: 'Daj prednost nežnemu, rednemu umivanju brez izdelkov, ki dražijo.',
      },
      {
        title: 'Spremljaj potek',
        text: 'Zabeležiš lahko barvo, količino in potek izcedka, če ti to pomaga spremljati okrevanje.',
      },
      {
        title: 'Dovoli si počitek',
        text: 'Obdobje po porodu zahteva čas. Prisluhni svojemu telesu in spoštuj svojo potrebo po okrevanju.',
      },
    ],
    section5Heading: '5. Lohije ali vrnitev menstruacije?',
    section5Body:
      'Lohije se pojavijo v dneh po porodu in se postopoma zmanjšujejo. Vrnitev menstruacije pa ustreza ponovni vzpostavitvi tvojega menstrualnega cikla po tem obdobju.',
    compareLochiaTitle: 'Lohije',
    compareLochiaText: 'Izcedek, povezan z okrevanjem maternice po porodu.',
    compareReturnTitle: 'Vrnitev menstruacije',
    compareReturnText:
      'Ponovna vzpostavitev menstrualnega cikla, v trenutku, ki se razlikuje od osebe do osebe.',
    section6Heading: '6. Kdaj poiskati zdravniški nasvet?',
    section6Body:
      'Če se ti zdi potek nenavaden ali se tvoje splošno stanje slabša, je pomembno poiskati nasvet zdravstvenega delavca.',
    warningTitle: 'Znaki, ki zahtevajo zdravniški nasvet',
    warningSigns: [
      'Močan ali nenavaden vonj',
      'Vročina ali poslabšanje splošnega stanja',
      'Tok, ki nenadoma postane precej obilnejši',
      'Huda, dolgotrajna ali nenavadna bolečina',
      'Nov simptom, ki te skrbi',
    ],
    tipTitle: 'Vredno vedeti',
    tipText:
      'Lohije se običajno spreminjajo postopoma: na začetku so lahko rdeče, nato postanejo svetlejše, preden se umaknejo. Vendar je vsako okrevanje individualno.',
    summaryHeading: 'Ključna sporočila',
    summaryPoints: [
      'Lohije so normalen izcedek po porodu.',
      'Običajno spreminjajo barvo in količino skozi tedne.',
      'Njihovo trajanje in potek se lahko razlikujeta od osebe do osebe.',
      'Nenavaden vonj, vročina, huda bolečina ali nenadna zelo obilna krvavitev zahtevajo zdravniški nasvet.',
    ],
    disclaimerText:
      'Informativna vsebina. Ta članek ne nadomešča zdravniškega nasveta ali pregleda. V primeru dvoma ali če opaziš zaskrbljujoč simptom, poišči nasvet zdravstvenega delavca.',
    shareMessage: 'Razumevanje lohij po porodu — AWA',
  },
  ne: {
    badgeText: 'सुत्केरीपछि • लोकिया',
    title: 'प्रसवपछिको लोकिया\nबुझ्नुहोस्',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'जानकारीमूलक सामग्री',
    intro:
      'प्रसवपछि, लोकियाले गर्भाशय निको हुने स्वाभाविक प्रक्रियासँग जोडिएको योनिको स्रावलाई जनाउँछ। यसको रङ र मात्रा आगामी दिन र हप्ताहरूमा बिस्तारै बदलिन्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'लोकिया के हो?',
      'समयसँगै यो कसरी बदलिन्छ?',
      'के सामान्य हुन सक्छ',
      'सहजताका सुझावहरू',
      'चिकित्सकीय सल्लाह कहिले लिने?',
      'मुख्य कुराहरू',
    ],
    section1Heading: '1. लोकिया के हो?',
    section1Body1:
      'लोकिया प्रसवपछि देखिने योनिको स्राव हो। यो मुख्यतया गर्भाशय निको हुँदा त्यसबाट रगत, स्राव र तन्तुहरू बिस्तारै निस्कनुले बनेको हुन्छ।',
    section1Body2:
      'यो सामान्य महिनावारीभन्दा फरक हो। सुत्केरीपछिको अवधिमा यो अपेक्षित हुन्छ र सामान्यतया क्रमशः घट्दै जान्छ।',
    infoTitle: 'मुख्य कुराहरू',
    infoText:
      'लोकियाको अर्थ तपाईंको महिनावारी फर्किसकेको भन्ने होइन। महिनावारी फर्कनु पछि हुने छुट्टै घटना हो।',
    section2Heading: '2. समयसँगै लोकिया कसरी बदलिन्छ?',
    section2Body:
      'यसको रूप प्रायः पहिलो केही हप्तामा बदलिन्छ। रङ बिस्तारै हल्का हुँदै जान्छ र मात्रा घट्ने प्रवृत्ति देखाउँछ।',
    evolutionTitle: 'क्रमिक प्रगति',
    evolutionSubtitle: 'चरणहरू व्यक्तिपिच्छे फरक हुन सक्छन्',
    evolution: [
      {
        label: 'चटक रातो',
        period: 'पहिला दिनहरू',
        text: 'स्राव सामान्यतया रातो हुन्छ र सुरुमा बढी हुन सक्छ।',
      },
      {
        label: 'गुलाबी / खैरोजस्तो',
        period: 'केही दिनपछि',
        text: 'रङ बिस्तारै हल्का हुँदै जान्छ र गुलाबी वा खैरोतिर सर्न सक्छ।',
      },
      {
        label: 'सेतो-पहेँलो',
        period: 'आगामी हप्ताहरूमा',
        text: 'स्राव सामान्यतया हल्का, पहेँलो वा सेतोजस्तो हुन्छ, घट्दै जानुअघि।',
      },
    ],
    section3Heading: '3. के सामान्य हुन सक्छ',
    section3Body:
      'लोकिया कसरी विकसित हुन्छ सबैका लागि ठ्याक्कै उस्तै हुँदैन। केही परिवर्तनहरू प्रसवपछिको स्वास्थ्यलाभसँगै स्वाभाविक रूपमा आउन सक्छन्।',
    normalPoints: [
      {
        title: 'फरक पर्ने मात्रा',
        text: 'पहिलो केही दिनमा मात्रा बदलिन सक्छ र त्यसपछि बिस्तारै घट्छ।',
      },
      {
        title: 'बदलिने रङ',
        text: 'लोकिया सामान्यतया समयसँगै रातोबाट हल्का छायातर्फ सर्छ।',
      },
      {
        title: 'फरक पर्ने अवधि',
        text: 'यो केही हप्तासम्म रहन सक्छ, र यसको विकास व्यक्तिपिच्छे फरक हुन्छ।',
      },
    ],
    section4Heading: '4. सहजता र अनुगमनका सुझावहरू',
    section4Body:
      'यो अवधिमा, सरल अनुगमनले तपाईंले आफ्नो अनुभवलाई अरू कसैसँग तुलना नगरी आफ्नो शरीर कसरी बदलिँदै छ अवलोकन गर्न मद्दत गर्न सक्छ।',
    comfortTips: [
      {
        title: 'कोमल सरसफाइ',
        text: 'जलन गराउने उत्पादनहरूबिना कोमल, नियमित धुनेलाई प्राथमिकता दिनुहोस्।',
      },
      {
        title: 'यो कसरी बदलिन्छ हेर्नुहोस्',
        text: 'तपाईंको स्वास्थ्यलाभ अनुगमन गर्न मद्दत गर्छ भने तपाईं स्रावको रङ, मात्रा र प्रगति टिप्न सक्नुहुन्छ।',
      },
      {
        title: 'आफूलाई आराम दिनुहोस्',
        text: 'सुत्केरीपछिको अवधिले समय लिन्छ। आफ्नो शरीरको कुरा सुन्नुहोस् र निको हुने आफ्नो आवश्यकताको सम्मान गर्नुहोस्।',
      },
    ],
    section5Heading: '5. लोकिया कि महिनावारी फर्केको?',
    section5Body:
      'लोकिया प्रसवपछिका दिनहरूमा देखिन्छ र बिस्तारै घट्छ। अर्कोतर्फ, महिनावारी फर्कनु यो अवधिपछि तपाईंको मासिक चक्र फेरि सुरु हुनुसँग मेल खान्छ।',
    compareLochiaTitle: 'लोकिया',
    compareLochiaText: 'प्रसवपछि गर्भाशय निको हुनेसँग जोडिएको स्राव।',
    compareReturnTitle: 'महिनावारी फर्कनु',
    compareReturnText:
      'मासिक चक्र फेरि सुरु हुनु, व्यक्तिपिच्छे फरक समयमा।',
    section6Heading: '6. चिकित्सकीय सल्लाह कहिले लिने?',
    section6Body:
      'प्रगति तपाईंलाई असामान्य लागे, वा तपाईंको समग्र अवस्था बिग्रँदै गएमा, स्वास्थ्यकर्मीसँग सल्लाह लिनु महत्त्वपूर्ण छ।',
    warningTitle: 'चिकित्सकीय सल्लाह चाहिने संकेतहरू',
    warningSigns: [
      'कडा वा असामान्य गन्ध',
      'ज्वरो वा बिग्रँदो समग्र अवस्था',
      'अचानक निकै धेरै हुने बहाव',
      'ठूलो, लगातार वा असामान्य दुखाइ',
      'तपाईंलाई चिन्तित बनाउने नयाँ लक्षण',
    ],
    tipTitle: 'जान्न लायक',
    tipText:
      'लोकिया सामान्यतया बिस्तारै विकसित हुन्छ: यो सुरुमा रातो हुन सक्छ, त्यसपछि घट्दै जानुअघि हल्का हुन्छ। यद्यपि, हरेक स्वास्थ्यलाभ व्यक्तिगत हुन्छ।',
    summaryHeading: 'मुख्य कुराहरू',
    summaryPoints: [
      'लोकिया प्रसवपछिको सामान्य स्राव हो।',
      'यो सामान्यतया हप्ताहरूमा रङ र मात्रामा बदलिन्छ।',
      'यसको अवधि र प्रगति व्यक्तिपिच्छे फरक हुन सक्छ।',
      'असामान्य गन्ध, ज्वरो, ठूलो दुखाइ, वा अचानक निकै धेरै रक्तस्रावले चिकित्सकीय सल्लाह चाहिन्छ।',
    ],
    disclaimerText:
      'जानकारीमूलक सामग्री। यो लेखले चिकित्सकीय सल्लाह वा जाँचको स्थान लिँदैन। शङ्का भए वा चिन्ताजनक लक्षण देखिए स्वास्थ्यकर्मीसँग सल्लाह लिनुहोस्।',
    shareMessage: 'प्रसवपछिको लोकिया बुझ्नुहोस् — AWA',
  },
  si: {
    badgeText: 'ප්‍රසූතියෙන් පසු • ප්‍රසූතියෙන් පසු ස්‍රාවය',
    title: 'ප්‍රසූතියෙන් පසු\nස්‍රාවය තේරුම් ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'තොරතුරු අන්තර්ගතය',
    intro:
      'ප්‍රසූතියෙන් පසු, ප්‍රසූතියෙන් පසු ස්‍රාවය යනු ගර්භාෂය යථා තත්ත්වයට පැමිණීමේ ස්වාභාවික ක්‍රියාවලියට සම්බන්ධ යෝනි ස්‍රාවයයි. එහි වර්ණය සහ ප්‍රමාණය ඉදිරි දින සහ සති තුළ ක්‍රමයෙන් වෙනස් වේ.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ප්‍රසූතියෙන් පසු ස්‍රාවය යනු කුමක්ද?',
      'එය කාලයත් සමඟ වෙනස් වන්නේ කෙසේද?',
      'සාමාන්‍ය විය හැක්කේ කුමක්ද',
      'සුවපහසු ඉඟි',
      'වෛද්‍ය උපදෙස් ලබාගත යුත්තේ කවදාද?',
      'ප්‍රධාන කරුණු',
    ],
    section1Heading: '1. ප්‍රසූතියෙන් පසු ස්‍රාවය යනු කුමක්ද?',
    section1Body1:
      'ප්‍රසූතියෙන් පසු ස්‍රාවය යනු ප්‍රසූත කිරීමෙන් පසු දිස්වන යෝනි ස්‍රාවයකි. එය ප්‍රධාන වශයෙන් ගර්භාෂය යථා තත්ත්වයට පැමිණෙන විට එහි ලේ, ස්‍රාව සහ පටක ක්‍රමයෙන් ඉවත් වීමෙන් සමන්විත වේ.',
    section1Body2:
      'එය සාමාන්‍ය ඔසප් වලින් වෙනස්ය. එය ප්‍රසූතියෙන් පසු කාලය තුළ අපේක්ෂා කෙරෙන අතර සාමාන්‍යයෙන් ක්‍රමයෙන් අඩු වේ.',
    infoTitle: 'ප්‍රධාන කරුණු',
    infoText:
      'ප්‍රසූතියෙන් පසු ස්‍රාවය යනු ඔබේ ඔසප් දැනටමත් නැවත පැමිණ ඇති බව අදහස් නොවේ. ඔබේ ඔසප් නැවත පැමිණීම පසුව සිදුවන වෙනම සිදුවීමකි.',
    section2Heading: '2. ප්‍රසූතියෙන් පසු ස්‍රාවය කාලයත් සමඟ වෙනස් වන්නේ කෙසේද?',
    section2Body:
      'එහි පෙනුම සාමාන්‍යයෙන් පළමු සති කිහිපය තුළ වෙනස් වේ. වර්ණය ක්‍රමයෙන් ලා පැහැයට හැරෙන අතර ප්‍රමාණය අඩු වීමට නැඹුරු වේ.',
    evolutionTitle: 'ක්‍රමානුකූල ප්‍රගතියක්',
    evolutionSubtitle: 'අවධි පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් විය හැක',
    evolution: [
      {
        label: 'ලා රතු',
        period: 'පළමු දින',
        text: 'ස්‍රාවය සාමාන්‍යයෙන් රතු වන අතර ආරම්භයේදී වැඩි විය හැක.',
      },
      {
        label: 'රෝස / දුඹුරු පැහැති',
        period: 'දින කිහිපයකට පසු',
        text: 'වර්ණය ක්‍රමයෙන් ලා පැහැයට හැරෙන අතර රෝස හෝ දුඹුරු දෙසට මාරු විය හැක.',
      },
      {
        label: 'සුදු-කහ පැහැති',
        period: 'ඉදිරි සති තුළ',
        text: 'ස්‍රාවය සාමාන්‍යයෙන් ලා වී, කහ හෝ සුදු පැහැයට හැරී, පසුව අඩු වේ.',
      },
    ],
    section3Heading: '3. සාමාන්‍ය විය හැක්කේ කුමක්ද',
    section3Body:
      'ප්‍රසූතියෙන් පසු ස්‍රාවය වෙනස් වන ආකාරය සෑම කෙනෙකුටම හරියටම එකම නොවේ. සමහර වෙනස්කම් ප්‍රසූතියෙන් පසු යථා තත්ත්වයට පැමිණීමත් සමඟ ස්වභාවිකවම පැමිණිය හැක.',
    normalPoints: [
      {
        title: 'වෙනස් වන ප්‍රමාණයක්',
        text: 'ප්‍රමාණය පළමු දින කිහිපය තුළ වෙනස් විය හැකි අතර පසුව ක්‍රමයෙන් අඩු වේ.',
      },
      {
        title: 'වෙනස් වන වර්ණයක්',
        text: 'ප්‍රසූතියෙන් පසු ස්‍රාවය සාමාන්‍යයෙන් කාලයත් සමඟ රතු සිට ලා වර්ණ වෙත මාරු වේ.',
      },
      {
        title: 'වෙනස් වන කාලයක්',
        text: 'එය සති කිහිපයක් පැවතිය හැකි අතර, එය වෙනස් වන ආකාරය පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් වේ.',
      },
    ],
    section4Heading: '4. සුවපහසුව සහ නිරීක්ෂණ ඉඟි',
    section4Body:
      'මෙම කාලය තුළ, ඔබේ අත්දැකීම වෙනත් කෙනෙකුගේ අත්දැකීම සමඟ සංසන්දනය නොකර ඔබේ ශරීරය වෙනස් වන ආකාරය නිරීක්ෂණය කිරීමට සරල නිරීක්ෂණයක් ඔබට උපකාරී විය හැක.',
    comfortTips: [
      {
        title: 'මෘදු සනීපාරක්ෂාව',
        text: 'කෝපනය කරන නිෂ්පාදන නොමැතිව මෘදු, නිතිපතා සේදීමට ප්‍රමුඛත්වය දෙන්න.',
      },
      {
        title: 'එය වෙනස් වන ආකාරය නිරීක්ෂණය කරන්න',
        text: 'එය ඔබේ යථා තත්ත්වයට පැමිණීම නිරීක්ෂණය කිරීමට උපකාරී වේ නම් ඔබට ස්‍රාවයේ වර්ණය, ප්‍රමාණය සහ ප්‍රගතිය සටහන් කළ හැක.',
      },
      {
        title: 'ඔබටම විවේකයට ඉඩ දෙන්න',
        text: 'ප්‍රසූතියෙන් පසු කාලයට කාලය ගතවේ. ඔබේ ශරීරයට සවන් දී යථා තත්ත්වයට පැමිණීමේ ඔබේ අවශ්‍යතාවට ගරු කරන්න.',
      },
    ],
    section5Heading: '5. ප්‍රසූතියෙන් පසු ස්‍රාවයද, ඔබේ ඔසප් නැවත පැමිණීමද?',
    section5Body:
      'ප්‍රසූතියෙන් පසු ස්‍රාවය ප්‍රසූතියෙන් පසු දිනවල දිස්වන අතර ක්‍රමයෙන් අඩු වේ. ඔබේ ඔසප් නැවත පැමිණීම, අනෙක් අතට, මෙම කාලයෙන් පසු ඔබේ ඔසප් චක්‍රය නැවත ආරම්භ වීමට අනුරූප වේ.',
    compareLochiaTitle: 'ප්‍රසූතියෙන් පසු ස්‍රාවය',
    compareLochiaText: 'ප්‍රසූතියෙන් පසු ගර්භාෂය යථා තත්ත්වයට පැමිණීමට සම්බන්ධ ස්‍රාවය.',
    compareReturnTitle: 'ඔබේ ඔසප් නැවත පැමිණීම',
    compareReturnText:
      'ඔසප් චක්‍රය නැවත ආරම්භ වීම, පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් වන වේලාවකට.',
    section6Heading: '6. වෛද්‍ය උපදෙස් ලබාගත යුත්තේ කවදාද?',
    section6Body:
      'ප්‍රගතිය ඔබට අසාමාන්‍ය ලෙස පෙනෙන්නේ නම්, හෝ ඔබේ සමස්ත තත්ත්වය නරක අතට හැරෙන්නේ නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් උපදෙස් ලබා ගැනීම වැදගත්.',
    warningTitle: 'වෛද්‍ය උපදෙස් අවශ්‍ය වන සලකුණු',
    warningSigns: [
      'දැඩි හෝ අසාමාන්‍ය ගඳක්',
      'උණ හෝ නරක අතට හැරෙන සමස්ත තත්ත්වයක්',
      'හදිසියේ බොහෝ සේ වැඩි වන ගලනයක්',
      'සැලකිය යුතු, දිගටම පවතින හෝ අසාමාන්‍ය වේදනාවක්',
      'ඔබව කනස්සල්ලට පත් කරන නව රෝග ලක්ෂණයක්',
    ],
    tipTitle: 'දැනගත යුතු දේ',
    tipText:
      'ප්‍රසූතියෙන් පසු ස්‍රාවය සාමාන්‍යයෙන් ක්‍රමයෙන් වෙනස් වේ: එය මුලදී රතු විය හැකි අතර, පසුව ලා වී අඩු වේ. කෙසේ වෙතත්, සෑම යථා තත්ත්වයට පැමිණීමක්ම පුද්ගලිකයි.',
    summaryHeading: 'ප්‍රධාන කරුණු',
    summaryPoints: [
      'ප්‍රසූතියෙන් පසු ස්‍රාවය යනු ප්‍රසූතියෙන් පසු සාමාන්‍ය ස්‍රාවයකි.',
      'එහි වර්ණය සහ ප්‍රමාණය සාමාන්‍යයෙන් සති පුරා වෙනස් වේ.',
      'එහි කාලය සහ ප්‍රගතිය පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් විය හැක.',
      'අසාමාන්‍ය ගඳක්, උණක්, සැලකිය යුතු වේදනාවක්, හෝ හදිසි, ඉතා වැඩි ලේ ගැලීමකට වෛද්‍ය උපදෙස් අවශ්‍යයි.',
    ],
    disclaimerText:
      'තොරතුරු අන්තර්ගතයකි. මෙම ලිපිය වෛද්‍ය උපදෙස් හෝ පරීක්ෂණයක් වෙනුවට නොපවතී. සැකයක් ඇත්නම් හෝ ඔබ කනස්සල්ලට කරුණක් වන රෝග ලක්ෂණයක් දුටුවහොත්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් උපදෙස් ලබා ගන්න.',
    shareMessage: 'ප්‍රසූතියෙන් පසු ස්‍රාවය තේරුම් ගැනීම — AWA',
  },
  th: {
    badgeText: 'หลังคลอด • น้ำคาวปลา',
    title: 'ทำความเข้าใจน้ำคาวปลา\nหลังคลอด',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาเพื่อให้ข้อมูล',
    intro:
      'หลังคลอด น้ำคาวปลาหมายถึงสิ่งที่ไหลออกจากช่องคลอดซึ่งเกี่ยวข้องกับกระบวนการฟื้นตัวของมดลูกตามธรรมชาติ สีและปริมาณจะค่อย ๆ เปลี่ยนไปในวันและสัปดาห์ถัดมา',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'น้ำคาวปลาคืออะไร?',
      'เปลี่ยนแปลงอย่างไรตามเวลา?',
      'อะไรที่อาจเป็นปกติ',
      'เคล็ดลับความสบายตัว',
      'เมื่อไรควรขอคำแนะนำทางการแพทย์?',
      'ประเด็นสำคัญ',
    ],
    section1Heading: '1. น้ำคาวปลาคืออะไร?',
    section1Body1:
      'น้ำคาวปลาคือสิ่งที่ไหลออกจากช่องคลอดซึ่งปรากฏหลังคลอด ประกอบด้วยการขับเลือด สารคัดหลั่ง และเนื้อเยื่อจากมดลูกออกทีละน้อยขณะที่มดลูกฟื้นตัวเป็นหลัก',
    section1Body2:
      'ต่างจากประจำเดือนปกติ เป็นสิ่งที่คาดว่าจะเกิดในช่วงหลังคลอดและโดยทั่วไปจะค่อย ๆ ลดลง',
    infoTitle: 'ประเด็นสำคัญ',
    infoText:
      'น้ำคาวปลาไม่ได้หมายความว่าประจำเดือนกลับมาแล้ว การกลับมาของประจำเดือนเป็นเหตุการณ์แยกต่างหากที่เกิดขึ้นภายหลัง',
    section2Heading: '2. น้ำคาวปลาเปลี่ยนแปลงอย่างไรตามเวลา?',
    section2Body:
      'ลักษณะของน้ำคาวปลามักเปลี่ยนไปในช่วงสองสามสัปดาห์แรก สีค่อย ๆ จางลงและปริมาณมักลดลง',
    evolutionTitle: 'ความก้าวหน้าทีละน้อย',
    evolutionSubtitle: 'ขั้นตอนอาจแตกต่างกันในแต่ละคน',
    evolution: [
      {
        label: 'แดงสด',
        period: 'วันแรก ๆ',
        text: 'สิ่งที่ไหลออกมักเป็นสีแดงและอาจมากกว่าในช่วงต้น',
      },
      {
        label: 'ชมพู / น้ำตาลอ่อน',
        period: 'หลังผ่านไปไม่กี่วัน',
        text: 'สีค่อย ๆ จางลงและอาจเปลี่ยนเป็นสีชมพูหรือน้ำตาล',
      },
      {
        label: 'ขาวอมเหลือง',
        period: 'ในสัปดาห์ถัดมา',
        text: 'สิ่งที่ไหลออกมักจางลง เป็นสีเหลืองหรือขาว ก่อนจะหมดไป',
      },
    ],
    section3Heading: '3. อะไรที่อาจเป็นปกติ',
    section3Body:
      'การเปลี่ยนแปลงของน้ำคาวปลาไม่เหมือนกันทุกคน การเปลี่ยนแปลงบางอย่างเกิดขึ้นได้ตามธรรมชาติพร้อมกับการฟื้นตัวหลังคลอด',
    normalPoints: [
      {
        title: 'ปริมาณที่แปรผัน',
        text: 'ปริมาณอาจเปลี่ยนไปในช่วงไม่กี่วันแรกแล้วค่อย ๆ ลดลง',
      },
      {
        title: 'สีที่เปลี่ยนไป',
        text: 'น้ำคาวปลามักเปลี่ยนจากสีแดงเป็นเฉดที่จางลงตามเวลา',
      },
      {
        title: 'ระยะเวลาที่แปรผัน',
        text: 'อาจคงอยู่หลายสัปดาห์ และการเปลี่ยนแปลงแตกต่างกันในแต่ละคน',
      },
    ],
    section4Heading: '4. เคล็ดลับความสบายตัวและการติดตาม',
    section4Body:
      'ในช่วงนี้ การติดตามง่าย ๆ ช่วยให้คุณสังเกตว่าร่างกายเปลี่ยนไปอย่างไรโดยไม่เปรียบเทียบประสบการณ์ของคุณกับของคนอื่น',
    comfortTips: [
      {
        title: 'สุขอนามัยอย่างอ่อนโยน',
        text: 'เลือกการล้างที่อ่อนโยนและสม่ำเสมอ โดยไม่ใช้ผลิตภัณฑ์ที่ระคายเคือง',
      },
      {
        title: 'สังเกตการเปลี่ยนแปลง',
        text: 'คุณจดสี ปริมาณ และความก้าวหน้าของสิ่งที่ไหลออกได้ หากช่วยในการติดตามการฟื้นตัวของคุณ',
      },
      {
        title: 'ให้ตัวเองได้พักผ่อน',
        text: 'ช่วงหลังคลอดต้องใช้เวลา ฟังร่างกายของคุณและเคารพความต้องการฟื้นตัว',
      },
    ],
    section5Heading: '5. น้ำคาวปลาหรือการกลับมาของประจำเดือน?',
    section5Body:
      'น้ำคาวปลาปรากฏในวันหลังคลอดและค่อย ๆ ลดลง ส่วนการกลับมาของประจำเดือนคือการกลับมาของรอบเดือนหลังช่วงนี้',
    compareLochiaTitle: 'น้ำคาวปลา',
    compareLochiaText: 'สิ่งที่ไหลออกซึ่งเกี่ยวข้องกับการฟื้นตัวของมดลูกหลังคลอด',
    compareReturnTitle: 'การกลับมาของประจำเดือน',
    compareReturnText:
      'การกลับมาของรอบเดือน ในเวลาที่แตกต่างกันในแต่ละคน',
    section6Heading: '6. เมื่อไรควรขอคำแนะนำทางการแพทย์?',
    section6Body:
      'หากการเปลี่ยนแปลงดูผิดปกติสำหรับคุณ หรือหากสภาพโดยรวมแย่ลง สิ่งสำคัญคือควรขอคำแนะนำจากบุคลากรทางการแพทย์',
    warningTitle: 'สัญญาณที่ควรขอคำแนะนำทางการแพทย์',
    warningSigns: [
      'กลิ่นแรงหรือผิดปกติ',
      'ไข้หรือสภาพโดยรวมที่แย่ลง',
      'ปริมาณที่มากขึ้นอย่างกะทันหัน',
      'อาการปวดมาก ต่อเนื่อง หรือผิดปกติ',
      'อาการใหม่ที่ทำให้คุณกังวล',
    ],
    tipTitle: 'ควรรู้',
    tipText:
      'น้ำคาวปลามักเปลี่ยนแปลงทีละน้อย: อาจเป็นสีแดงในตอนแรก แล้วจางลงก่อนจะหมดไป อย่างไรก็ตาม การฟื้นตัวของแต่ละคนแตกต่างกัน',
    summaryHeading: 'ประเด็นสำคัญ',
    summaryPoints: [
      'น้ำคาวปลาเป็นสิ่งที่ไหลออกตามปกติหลังคลอด',
      'โดยทั่วไปสีและปริมาณเปลี่ยนไปในช่วงสัปดาห์',
      'ระยะเวลาและการเปลี่ยนแปลงอาจแตกต่างกันในแต่ละคน',
      'กลิ่นผิดปกติ ไข้ อาการปวดมาก หรือเลือดออกมากอย่างกะทันหัน ต้องขอคำแนะนำทางการแพทย์',
    ],
    disclaimerText:
      'เนื้อหาเพื่อให้ข้อมูล บทความนี้ไม่ได้ทดแทนคำแนะนำทางการแพทย์หรือการตรวจ หากมีข้อสงสัยหรือพบอาการที่น่ากังวล โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
    shareMessage: 'ทำความเข้าใจน้ำคาวปลาหลังคลอด — AWA',
  },
  vi: {
    badgeText: 'SAU SINH • SẢN DỊCH',
    title: 'Hiểu về sản dịch\nsau sinh',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung mang tính thông tin',
    intro:
      'Sau khi sinh, sản dịch là dịch tiết ra từ âm đạo liên quan đến quá trình hồi phục tự nhiên của tử cung. Màu sắc và lượng của nó dần thay đổi trong những ngày và tuần tiếp theo.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Sản dịch là gì?',
      'Nó thay đổi thế nào theo thời gian?',
      'Điều gì có thể là bình thường',
      'Mẹo giúp thoải mái',
      'Khi nào nên tìm lời khuyên y khoa?',
      'Những điểm chính cần nhớ',
    ],
    section1Heading: '1. Sản dịch là gì?',
    section1Body1:
      'Sản dịch là dịch tiết ra từ âm đạo xuất hiện sau khi sinh. Nó chủ yếu gồm máu, dịch tiết và mô được đào thải dần khỏi tử cung khi tử cung hồi phục.',
    section1Body2:
      'Nó khác với một kỳ kinh thông thường. Nó là điều được mong đợi trong giai đoạn sau sinh và nhìn chung giảm dần.',
    infoTitle: 'Những điểm chính cần nhớ',
    infoText:
      'Sản dịch không có nghĩa là kỳ kinh của bạn đã trở lại. Kỳ kinh trở lại là một sự kiện riêng xảy ra muộn hơn.',
    section2Heading: '2. Sản dịch thay đổi thế nào theo thời gian?',
    section2Body:
      'Hình dạng của nó thường thay đổi trong vài tuần đầu. Màu sắc dần nhạt hơn và lượng có xu hướng giảm.',
    evolutionTitle: 'Một diễn tiến từ từ',
    evolutionSubtitle: 'Các giai đoạn có thể khác nhau giữa từng người',
    evolution: [
      {
        label: 'Đỏ tươi',
        period: 'Những ngày đầu',
        text: 'Dịch tiết thường có màu đỏ và có thể nhiều hơn lúc ban đầu.',
      },
      {
        label: 'Hồng / hơi nâu',
        period: 'Sau vài ngày',
        text: 'Màu sắc dần nhạt hơn và có thể chuyển sang hồng hoặc nâu.',
      },
      {
        label: 'Vàng nhạt-trắng',
        period: 'Trong những tuần tiếp theo',
        text: 'Dịch tiết thường nhạt hơn, hơi vàng hoặc trắng, trước khi ít dần và hết.',
      },
    ],
    section3Heading: '3. Điều gì có thể là bình thường',
    section3Body:
      'Diễn biến của sản dịch không hoàn toàn giống nhau ở mọi người. Một số thay đổi có thể đi kèm một cách tự nhiên với quá trình hồi phục sau sinh.',
    normalPoints: [
      {
        title: 'Lượng thay đổi',
        text: 'Lượng có thể thay đổi trong vài ngày đầu rồi giảm dần.',
      },
      {
        title: 'Màu sắc thay đổi',
        text: 'Sản dịch thường chuyển từ đỏ sang các sắc thái nhạt hơn theo thời gian.',
      },
      {
        title: 'Thời gian khác nhau',
        text: 'Nó có thể kéo dài vài tuần, và diễn biến khác nhau giữa từng người.',
      },
    ],
    section4Heading: '4. Mẹo giúp thoải mái và theo dõi',
    section4Body:
      'Trong giai đoạn này, việc theo dõi đơn giản có thể giúp bạn quan sát cơ thể thay đổi ra sao mà không so sánh trải nghiệm của mình với người khác.',
    comfortTips: [
      {
        title: 'Vệ sinh nhẹ nhàng',
        text: 'Ưu tiên rửa nhẹ nhàng, đều đặn, không dùng sản phẩm gây kích ứng.',
      },
      {
        title: 'Theo dõi diễn biến',
        text: 'Bạn có thể ghi lại màu sắc, lượng và diễn tiến của dịch tiết nếu điều đó giúp bạn theo dõi quá trình hồi phục.',
      },
      {
        title: 'Cho phép bản thân nghỉ ngơi',
        text: 'Giai đoạn sau sinh cần thời gian. Hãy lắng nghe cơ thể và tôn trọng nhu cầu hồi phục của bạn.',
      },
    ],
    section5Heading: '5. Sản dịch hay kỳ kinh trở lại?',
    section5Body:
      'Sản dịch xuất hiện trong những ngày sau sinh và dần giảm đi. Còn kỳ kinh trở lại tương ứng với việc chu kỳ kinh nguyệt của bạn hoạt động trở lại sau giai đoạn này.',
    compareLochiaTitle: 'Sản dịch',
    compareLochiaText: 'Dịch tiết liên quan đến quá trình hồi phục của tử cung sau sinh.',
    compareReturnTitle: 'Kỳ kinh trở lại',
    compareReturnText:
      'Chu kỳ kinh nguyệt hoạt động trở lại, vào thời điểm khác nhau giữa từng người.',
    section6Heading: '6. Khi nào nên tìm lời khuyên y khoa?',
    section6Body:
      'Nếu diễn tiến có vẻ bất thường với bạn, hoặc tình trạng chung ngày càng xấu đi, điều quan trọng là tìm lời khuyên từ nhân viên y tế.',
    warningTitle: 'Những dấu hiệu cần lời khuyên y khoa',
    warningSigns: [
      'Mùi nồng hoặc bất thường',
      'Sốt hoặc tình trạng chung xấu đi',
      'Lượng dịch đột ngột nhiều hơn hẳn',
      'Đau đáng kể, kéo dài hoặc bất thường',
      'Một triệu chứng mới khiến bạn lo lắng',
    ],
    tipTitle: 'Nên biết',
    tipText:
      'Sản dịch thường diễn tiến từ từ: lúc đầu có thể màu đỏ, rồi nhạt dần trước khi hết hẳn. Tuy nhiên, mỗi quá trình hồi phục đều mang tính cá nhân.',
    summaryHeading: 'Những điểm chính cần nhớ',
    summaryPoints: [
      'Sản dịch là dịch tiết bình thường sau khi sinh.',
      'Nó thường thay đổi về màu sắc và lượng trong vài tuần.',
      'Thời gian và diễn tiến của nó có thể khác nhau giữa từng người.',
      'Mùi bất thường, sốt, đau đáng kể hoặc ra máu đột ngột rất nhiều cần lời khuyên y khoa.',
    ],
    disclaimerText:
      'Nội dung mang tính thông tin. Bài viết này không thay thế lời khuyên y khoa hay việc thăm khám. Nếu có nghi ngờ hoặc nhận thấy một triệu chứng đáng lo, hãy tìm lời khuyên từ nhân viên y tế.',
    shareMessage: 'Hiểu về sản dịch sau sinh — AWA',
  },
  uz: {
    badgeText: 'TUGʻRUQDAN KEYIN • LOHIYA',
    title: 'Tugʻruqdan keyingi\nlohiyani tushunish',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Maʼlumot uchun kontent',
    intro:
      'Tugʻruqdan keyin lohiya bachadonning tabiiy tiklanish jarayoni bilan bogʻliq qin ajralmasini bildiradi. Uning rangi va miqdori keyingi kunlar va haftalar davomida asta-sekin oʻzgaradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Lohiya nima?',
      'U vaqt oʻtishi bilan qanday oʻzgaradi?',
      'Nima normal boʻlishi mumkin',
      'Qulaylik uchun maslahatlar',
      'Qachon tibbiy maslahat olish kerak?',
      'Asosiy xulosalar',
    ],
    section1Heading: '1. Lohiya nima?',
    section1Body1:
      'Lohiya — tugʻruqdan keyin paydo boʻladigan qin ajralmasi. U asosan bachadon tiklanayotganda qon, sekretsiyalar va toʻqimalarning asta-sekin chiqarilishidan iborat.',
    section1Body2:
      'U oddiy hayzdan farq qiladi. U tugʻruqdan keyingi davrda kutilgan hodisa va odatda bosqichma-bosqich kamayadi.',
    infoTitle: 'Asosiy xulosalar',
    infoText:
      'Lohiya hayzingiz allaqachon qaytganini anglatmaydi. Hayzning qaytishi keyinroq sodir boʻladigan alohida hodisa.',
    section2Heading: '2. Lohiya vaqt oʻtishi bilan qanday oʻzgaradi?',
    section2Body:
      'Uning koʻrinishi odatda dastlabki bir necha hafta davomida oʻzgaradi. Rang asta-sekin ochilashadi va miqdori kamayishga moyil.',
    evolutionTitle: 'Bosqichma-bosqich oʻzgarish',
    evolutionSubtitle: 'Bosqichlar odamdan odamga farq qilishi mumkin',
    evolution: [
      {
        label: 'Yorqin qizil',
        period: 'Dastlabki kunlar',
        text: 'Ajralma odatda qizil boʻladi va boshida koʻproq boʻlishi mumkin.',
      },
      {
        label: 'Pushti / jigarrangsimon',
        period: 'Bir necha kundan keyin',
        text: 'Rang asta-sekin ochilashadi va pushti yoki jigarrangga oʻtishi mumkin.',
      },
      {
        label: 'Oqish-sargʻish',
        period: 'Keyingi haftalarda',
        text: 'Ajralma odatda yengillashadi, sargʻish yoki oqish boʻladi va keyin tugaydi.',
      },
    ],
    section3Heading: '3. Nima normal boʻlishi mumkin',
    section3Body:
      'Lohiyaning oʻzgarishi hamma uchun aynan bir xil emas. Baʼzi oʻzgarishlar tugʻruqdan keyingi tiklanishga tabiiy ravishda hamroh boʻlishi mumkin.',
    normalPoints: [
      {
        title: 'Oʻzgaruvchan miqdor',
        text: 'Miqdor dastlabki bir necha kunda oʻzgarishi, keyin asta-sekin kamayishi mumkin.',
      },
      {
        title: 'Oʻzgaruvchan rang',
        text: 'Lohiya odatda vaqt oʻtishi bilan qizildan ochroq tuslarga oʻtadi.',
      },
      {
        title: 'Oʻzgaruvchan davomiylik',
        text: 'U bir necha hafta saqlanib qolishi mumkin va uning oʻzgarishi odamdan odamga farq qiladi.',
      },
    ],
    section4Heading: '4. Qulaylik va kuzatuv boʻyicha maslahatlar',
    section4Body:
      'Bu davrda oddiy kuzatuv tajribangizni boshqasinikiga solishtirmasdan, tanangiz qanday oʻzgarayotganini kuzatishga yordam beradi.',
    comfortTips: [
      {
        title: 'Muloyim gigiyena',
        text: 'Tirnashtiruvchi vositalarsiz muloyim, muntazam yuvinishni afzal koʻring.',
      },
      {
        title: 'Oʻzgarishni kuzating',
        text: 'Agar tiklanishingizni kuzatishga yordam bersa, ajralmaning rangi, miqdori va oʻzgarishini yozib borishingiz mumkin.',
      },
      {
        title: 'Oʻzingizga dam bering',
        text: 'Tugʻruqdan keyingi davr vaqt oladi. Tanangizni tinglang va tiklanishga boʻlgan ehtiyojingizni hurmat qiling.',
      },
    ],
    section5Heading: '5. Lohiya yoki hayzning qaytishi?',
    section5Body:
      'Lohiya tugʻruqdan keyingi kunlarda paydo boʻladi va asta-sekin kamayadi. Hayzning qaytishi esa bu davrdan keyin hayz siklingizning qayta boshlanishiga mos keladi.',
    compareLochiaTitle: 'Lohiya',
    compareLochiaText: 'Tugʻruqdan keyin bachadon tiklanishi bilan bogʻliq ajralma.',
    compareReturnTitle: 'Hayzning qaytishi',
    compareReturnText:
      'Hayz siklining qayta boshlanishi, odamdan odamga farq qiladigan vaqtda.',
    section6Heading: '6. Qachon tibbiy maslahat olish kerak?',
    section6Body:
      'Agar oʻzgarish sizga odatdan tashqari tuyulsa yoki umumiy holatingiz yomonlashsa, sogʻliqni saqlash mutaxassisidan maslahat olish muhim.',
    warningTitle: 'Tibbiy maslahatni talab qiladigan belgilar',
    warningSigns: [
      'Kuchli yoki odatdan tashqari hid',
      'Isitma yoki umumiy holatning yomonlashishi',
      'Birdan ancha koʻpayadigan oqim',
      'Sezilarli, doimiy yoki odatdan tashqari ogʻriq',
      'Sizni xavotirga soladigan yangi alomat',
    ],
    tipTitle: 'Bilish foydali',
    tipText:
      'Lohiya odatda asta-sekin oʻzgaradi: avval qizil boʻlishi, keyin ochilashib, tugashi mumkin. Biroq har bir tiklanish individual.',
    summaryHeading: 'Asosiy xulosalar',
    summaryPoints: [
      'Lohiya tugʻruqdan keyingi normal ajralma.',
      'U odatda haftalar davomida rangi va miqdori boʻyicha oʻzgaradi.',
      'Uning davomiyligi va oʻzgarishi odamdan odamga farq qilishi mumkin.',
      'Odatdan tashqari hid, isitma, sezilarli ogʻriq yoki birdan juda koʻp qon ketishi tibbiy maslahatni talab qiladi.',
    ],
    disclaimerText:
      'Maʼlumot uchun kontent. Bu maqola tibbiy maslahat yoki koʻrikni almashtirmaydi. Shubha boʻlsa yoki xavotirli alomat sezsangiz, sogʻliqni saqlash mutaxassisidan maslahat oling.',
    shareMessage: 'Tugʻruqdan keyingi lohiyani tushunish — AWA',
  },
  az: {
    badgeText: 'DOĞUŞDAN SONRA • LOXİYA',
    title: 'Doğuşdan sonra loxiyanı\nanlamaq',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Məlumat xarakterli məzmun',
    intro:
      'Doğuşdan sonra loxiya uşaqlığın təbii bərpa prosesi ilə bağlı vaginal ifrazata deyilir. Onun rəngi və miqdarı sonrakı günlər və həftələr ərzində tədricən dəyişir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Loxiya nədir?',
      'O zamanla necə dəyişir?',
      'Nə normal ola bilər',
      'Rahatlıq məsləhətləri',
      'Nə vaxt tibbi məsləhət almaq lazımdır?',
      'Əsas nəticələr',
    ],
    section1Heading: '1. Loxiya nədir?',
    section1Body1:
      'Loxiya doğuşdan sonra görünən vaginal ifrazatdır. O, əsasən uşaqlığın bərpası zamanı qanın, ifrazatların və toxumanın tədricən xaric edilməsindən ibarətdir.',
    section1Body2:
      'O, adi aybaşından fərqlənir. O, doğuşdan sonrakı dövrdə gözlənilən haldır və adətən tədricən azalır.',
    infoTitle: 'Əsas nəticələr',
    infoText:
      'Loxiya aybaşınızın artıq geri döndüyü demək deyil. Aybaşının qayıtması daha sonra baş verən ayrıca hadisədir.',
    section2Heading: '2. Loxiya zamanla necə dəyişir?',
    section2Body:
      'Onun görünüşü adətən ilk bir neçə həftə ərzində dəyişir. Rəng tədricən açıqlaşır və miqdar azalmağa meyllidir.',
    evolutionTitle: 'Tədricən inkişaf',
    evolutionSubtitle: 'Mərhələlər şəxsdən şəxsə dəyişə bilər',
    evolution: [
      {
        label: 'Parlaq qırmızı',
        period: 'İlk günlər',
        text: 'İfrazat adətən qırmızı olur və əvvəlində daha bol ola bilər.',
      },
      {
        label: 'Çəhrayı / qəhvəyimtıl',
        period: 'Bir neçə gündən sonra',
        text: 'Rəng tədricən açıqlaşır və çəhrayıya və ya qəhvəyiyə doğru dəyişə bilər.',
      },
      {
        label: 'Ağımtıl-sarımtıl',
        period: 'Sonrakı həftələr ərzində',
        text: 'İfrazat adətən daha açıq, sarımtıl və ya ağımtıl olur, sonra azalıb kəsilir.',
      },
    ],
    section3Heading: '3. Nə normal ola bilər',
    section3Body:
      'Loxiyanın inkişafı hamı üçün tam eyni deyil. Bəzi dəyişikliklər doğuşdan sonrakı bərpanı təbii şəkildə müşayiət edə bilər.',
    normalPoints: [
      {
        title: 'Dəyişən miqdar',
        text: 'Miqdar ilk bir neçə gündə dəyişə, sonra tədricən azala bilər.',
      },
      {
        title: 'Dəyişən rəng',
        text: 'Loxiya adətən zamanla qırmızıdan daha açıq çalarlara doğru keçir.',
      },
      {
        title: 'Dəyişən müddət',
        text: 'O, bir neçə həftə davam edə bilər və inkişafı şəxsdən şəxsə fərqlənir.',
      },
    ],
    section4Heading: '4. Rahatlıq və izləmə məsləhətləri',
    section4Body:
      'Bu dövrdə sadə izləmə təcrübənizi başqasınınkı ilə müqayisə etmədən bədəninizin necə dəyişdiyini müşahidə etməyə kömək edə bilər.',
    comfortTips: [
      {
        title: 'Mülayim gigiyena',
        text: 'Qıcıqlandırıcı vasitələr olmadan mülayim, müntəzəm yuyunmağa üstünlük verin.',
      },
      {
        title: 'İnkişafı izləyin',
        text: 'Bərpanızı izləməyə kömək edirsə, ifrazatın rəngini, miqdarını və gedişini qeyd edə bilərsiniz.',
      },
      {
        title: 'İstirahətə icazə verin',
        text: 'Doğuşdan sonrakı dövr vaxt tələb edir. Bədəninizi dinləyin və bərpa olunmaq ehtiyacınıza hörmət edin.',
      },
    ],
    section5Heading: '5. Loxiya, yoxsa aybaşının qayıtması?',
    section5Body:
      'Loxiya doğuşdan sonrakı günlərdə görünür və tədricən azalır. Aybaşının qayıtması isə bu dövrdən sonra menstrual dövrünüzün bərpa olunmasına uyğun gəlir.',
    compareLochiaTitle: 'Loxiya',
    compareLochiaText: 'Doğuşdan sonra uşaqlığın bərpası ilə bağlı ifrazat.',
    compareReturnTitle: 'Aybaşının qayıtması',
    compareReturnText:
      'Menstrual dövrün bərpası, vaxtı şəxsdən şəxsə dəyişir.',
    section6Heading: '6. Nə vaxt tibbi məsləhət almaq lazımdır?',
    section6Body:
      'İnkişaf sizə qeyri-adi görünürsə və ya ümumi vəziyyətiniz pisləşirsə, tibb işçisindən məsləhət almaq vacibdir.',
    warningTitle: 'Tibbi məsləhət tələb edən əlamətlər',
    warningSigns: [
      'Güclü və ya qeyri-adi qoxu',
      'Hərarət və ya pisləşən ümumi vəziyyət',
      'Qəfildən xeyli bollaşan axın',
      'Əhəmiyyətli, davamlı və ya qeyri-adi ağrı',
      'Sizi narahat edən yeni simptom',
    ],
    tipTitle: 'Bilmək faydalıdır',
    tipText:
      'Loxiya adətən tədricən inkişaf edir: əvvəlcə qırmızı ola, sonra açıqlaşıb azalıb kəsilə bilər. Lakin hər bərpa fərdidir.',
    summaryHeading: 'Əsas nəticələr',
    summaryPoints: [
      'Loxiya doğuşdan sonra normal ifrazatdır.',
      'O, adətən həftələr ərzində rəng və miqdarca dəyişir.',
      'Onun müddəti və inkişafı şəxsdən şəxsə dəyişə bilər.',
      'Qeyri-adi qoxu, hərarət, əhəmiyyətli ağrı və ya qəfil çox bol qanaxma tibbi məsləhət tələb edir.',
    ],
    disclaimerText:
      'Məlumat xarakterli məzmun. Bu məqalə tibbi məsləhəti və ya müayinəni əvəz etmir. Şübhə olarsa və ya narahatedici simptom görsəniz, tibb işçisindən məsləhət alın.',
    shareMessage: 'Doğuşdan sonra loxiyanı anlamaq — AWA',
  },
  ka: {
    badgeText: 'მშობიარობის შემდგომი პერიოდი • ლოხია',
    title: 'ლოხიის გაგება\nმშობიარობის შემდეგ',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'საინფორმაციო შინაარსი',
    intro:
      'მშობიარობის შემდეგ ლოხია ვაგინალურ გამონადენს ნიშნავს, რომელიც საშვილოსნოს გამოჯანმრთელების ბუნებრივ პროცესს უკავშირდება. მისი ფერი და რაოდენობა მომდევნო დღეებსა და კვირებში ეტაპობრივად იცვლება.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის ლოხია?',
      'როგორ იცვლება ის დროთა განმავლობაში?',
      'რა შეიძლება იყოს ნორმალური',
      'კომფორტის რჩევები',
      'როდის მივმართოთ სამედიცინო რჩევას?',
      'მთავარი დასკვნები',
    ],
    section1Heading: '1. რა არის ლოხია?',
    section1Body1:
      'ლოხია ვაგინალური გამონადენია, რომელიც მშობიარობის შემდეგ ჩნდება. ის ძირითადად შედგება სისხლის, სეკრეტების და ქსოვილის ეტაპობრივი გამოყოფისგან საშვილოსნოდან, მისი გამოჯანმრთელებისას.',
    section1Body2:
      'ის ჩვეულებრივი მენსტრუაციისგან განსხვავდება. ის მშობიარობის შემდგომ პერიოდში მოსალოდნელია და ზოგადად თანდათანობით მცირდება.',
    infoTitle: 'მთავარი დასკვნები',
    infoText:
      'ლოხია არ ნიშნავს, რომ თქვენი მენსტრუაცია უკვე დაბრუნდა. მენსტრუაციის დაბრუნება ცალკე მოვლენაა, რომელიც მოგვიანებით ხდება.',
    section2Heading: '2. როგორ იცვლება ლოხია დროთა განმავლობაში?',
    section2Body:
      'მისი გარეგნობა, როგორც წესი, პირველი რამდენიმე კვირის განმავლობაში იცვლება. ფერი ეტაპობრივად უფრო ღია ხდება და რაოდენობა მცირდება.',
    evolutionTitle: 'ეტაპობრივი პროგრესი',
    evolutionSubtitle: 'ეტაპები ადამიანიდან ადამიანამდე შეიძლება განსხვავდებოდეს',
    evolution: [
      {
        label: 'ნათელი წითელი',
        period: 'პირველი დღეები',
        text: 'გამონადენი, როგორც წესი, წითელია და დასაწყისში შეიძლება უფრო უხვი იყოს.',
      },
      {
        label: 'ვარდისფერი / მოყავისფრო',
        period: 'რამდენიმე დღის შემდეგ',
        text: 'ფერი ეტაპობრივად უფრო ღია ხდება და ვარდისფერისკენ ან ყავისფერისკენ შეიძლება გადაიხაროს.',
      },
      {
        label: 'მოთეთრო-მოყვითალო',
        period: 'მომდევნო კვირებში',
        text: 'გამონადენი, როგორც წესი, უფრო მსუბუქი, მოყვითალო ან მოთეთრო ხდება და შემდეგ წყდება.',
      },
    ],
    section3Heading: '3. რა შეიძლება იყოს ნორმალური',
    section3Body:
      'ლოხიის ცვლილება ყველასთვის ზუსტად ერთნაირი არ არის. გარკვეული ცვლილებები ბუნებრივად შეიძლება თან ახლდეს მშობიარობის შემდგომ გამოჯანმრთელებას.',
    normalPoints: [
      {
        title: 'ცვალებადი რაოდენობა',
        text: 'რაოდენობა პირველი რამდენიმე დღის განმავლობაში შეიძლება შეიცვალოს და შემდეგ ეტაპობრივად შემცირდეს.',
      },
      {
        title: 'ფერი, რომელიც იცვლება',
        text: 'ლოხია, როგორც წესი, დროთა განმავლობაში წითელიდან უფრო ღია ფერებისკენ გადადის.',
      },
      {
        title: 'ცვალებადი ხანგრძლივობა',
        text: 'ის შეიძლება რამდენიმე კვირას გაგრძელდეს და მისი ცვლილება ადამიანიდან ადამიანამდე განსხვავდება.',
      },
    ],
    section4Heading: '4. კომფორტისა და კონტროლის რჩევები',
    section4Body:
      'ამ პერიოდში მარტივმა კონტროლმა შეიძლება დაგეხმაროთ დააკვირდეთ, როგორ იცვლება თქვენი სხეული, თქვენი გამოცდილების სხვისას შედარების გარეშე.',
    comfortTips: [
      {
        title: 'რბილი ჰიგიენა',
        text: 'მიანიჭეთ უპირატესობა ნაზ, რეგულარულ დაბანას გამღიზიანებელი საშუალებების გარეშე.',
      },
      {
        title: 'დააკვირდით ცვლილებას',
        text: 'შეგიძლიათ გამონადენის ფერი, რაოდენობა და ცვლილება აღნიშნოთ, თუ ეს გამოჯანმრთელების კონტროლში გეხმარებათ.',
      },
      {
        title: 'მიეცით თავს დასვენების საშუალება',
        text: 'მშობიარობის შემდგომ პერიოდს დრო სჭირდება. მოუსმინეთ თქვენს სხეულს და პატივი ეცით გამოჯანმრთელების საჭიროებას.',
      },
    ],
    section5Heading: '5. ლოხია თუ მენსტრუაციის დაბრუნება?',
    section5Body:
      'ლოხია მშობიარობის შემდგომ დღეებში ჩნდება და თანდათან მცირდება. მენსტრუაციის დაბრუნება კი ამ პერიოდის შემდეგ თქვენი მენსტრუაციული ციკლის განახლებას შეესაბამება.',
    compareLochiaTitle: 'ლოხია',
    compareLochiaText: 'მშობიარობის შემდგომ საშვილოსნოს გამოჯანმრთელებასთან დაკავშირებული გამონადენი.',
    compareReturnTitle: 'მენსტრუაციის დაბრუნება',
    compareReturnText:
      'მენსტრუაციული ციკლის განახლება, დროს, რომელიც ადამიანიდან ადამიანამდე განსხვავდება.',
    section6Heading: '6. როდის მივმართოთ სამედიცინო რჩევას?',
    section6Body:
      'თუ ცვლილება თქვენთვის უჩვეულოა ან თქვენი საერთო მდგომარეობა უარესდება, მნიშვნელოვანია ჯანდაცვის სპეციალისტის რჩევის მიღება.',
    warningTitle: 'ნიშნები, რომლებიც სამედიცინო რჩევას მოითხოვს',
    warningSigns: [
      'ძლიერი ან უჩვეულო სუნი',
      'ცხელება ან საერთო მდგომარეობის გაუარესება',
      'ნაკადი, რომელიც მოულოდნელად გაცილებით უხვი ხდება',
      'მნიშვნელოვანი, გაგრძელებული ან უჩვეულო ტკივილი',
      'ახალი სიმპტომი, რომელიც გაწუხებთ',
    ],
    tipTitle: 'კარგია ვიცოდეთ',
    tipText:
      'ლოხია, როგორც წესი, ეტაპობრივად იცვლება: თავიდან შეიძლება წითელი იყოს, შემდეგ უფრო ღია გახდეს და შემდეგ შეწყდეს. ამასთან, ყოველი გამოჯანმრთელება ინდივიდუალურია.',
    summaryHeading: 'მთავარი დასკვნები',
    summaryPoints: [
      'ლოხია მშობიარობის შემდეგ ნორმალური გამონადენია.',
      'ის, როგორც წესი, კვირების განმავლობაში ფერსა და რაოდენობას იცვლის.',
      'მისი ხანგრძლივობა და ცვლილება ადამიანიდან ადამიანამდე შეიძლება განსხვავდებოდეს.',
      'უჩვეულო სუნი, ცხელება, მნიშვნელოვანი ტკივილი ან მოულოდნელი, ძალიან უხვი სისხლდენა სამედიცინო რჩევას მოითხოვს.',
    ],
    disclaimerText:
      'საინფორმაციო შინაარსი. ეს სტატია სამედიცინო რჩევას ან გასინჯვას არ ანაცვლებს. ეჭვის შემთხვევაში ან თუ შემაშფოთებელ სიმპტომს შეამჩნევთ, მიმართეთ ჯანდაცვის სპეციალისტს.',
    shareMessage: 'ლოხიის გაგება მშობიარობის შემდეგ — AWA',
  },
  hy: {
    badgeText: 'ՀԵՏԾՆՆԴՅԱՆ ՇՐՋԱՆ • ԼՈԽԻԱ',
    title: 'Հասկանալ լոխիան\nծննդաբերությունից հետո',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Տեղեկատվական բովանդակություն',
    intro:
      'Ծննդաբերությունից հետո լոխիան նշանակում է հեշտոցային արտազատուկ, որը կապված է արգանդի վերականգնման բնական գործընթացի հետ: Դրա գույնն ու քանակը աստիճանաբար փոխվում են հաջորդ օրերի և շաբաթների ընթացքում:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է լոխիան',
      'Ինչպես է այն փոխվում ժամանակի ընթացքում',
      'Ինչը կարող է նորմալ լինել',
      'Հարմարավետության խորհուրդներ',
      'Ե՞րբ դիմել բժշկական խորհրդատվության',
      'Հիմնական եզրակացություններ',
    ],
    section1Heading: '1. Ի՞նչ է լոխիան',
    section1Body1:
      'Լոխիան հեշտոցային արտազատուկ է, որը հայտնվում է ծննդաբերությունից հետո: Այն հիմնականում բաղկացած է արգանդից արյան, սեկրեցիաների և հյուսվածքի աստիճանական հեռացումից՝ նրա վերականգնման ընթացքում:',
    section1Body2:
      'Այն տարբերվում է սովորական դաշտանից: Այն սպասելի է հետծննդյան շրջանում և սովորաբար աստիճանաբար նվազում է:',
    infoTitle: 'Հիմնական եզրակացություններ',
    infoText:
      'Լոխիան չի նշանակում, որ ձեր դաշտանն արդեն վերադարձել է: Դաշտանի վերադարձը առանձին իրադարձություն է, որը տեղի է ունենում ավելի ուշ:',
    section2Heading: '2. Ինչպե՞ս է լոխիան փոխվում ժամանակի ընթացքում',
    section2Body:
      'Դրա տեսքը սովորաբար փոխվում է առաջին մի քանի շաբաթների ընթացքում: Գույնը աստիճանաբար դառնում է ավելի բաց, և քանակը հակված է նվազելու:',
    evolutionTitle: 'Աստիճանական զարգացում',
    evolutionSubtitle: 'Փուլերը կարող են տարբերվել մարդուց մարդ',
    evolution: [
      {
        label: 'Վառ կարմիր',
        period: 'Առաջին օրերը',
        text: 'Արտազատուկը սովորաբար կարմիր է և կարող է սկզբում ավելի առատ լինել:',
      },
      {
        label: 'Վարդագույն / շագանակագույնին տվող',
        period: 'Մի քանի օր անց',
        text: 'Գույնը աստիճանաբար դառնում է ավելի բաց և կարող է անցնել վարդագույնի կամ շագանակագույնի:',
      },
      {
        label: 'Սպիտակավուն-դեղնավուն',
        period: 'Հաջորդ շաբաթների ընթացքում',
        text: 'Արտազատուկը սովորաբար դառնում է ավելի թեթև, դեղնավուն կամ սպիտակավուն՝ նախքան դադարելը:',
      },
    ],
    section3Heading: '3. Ինչը կարող է նորմալ լինել',
    section3Body:
      'Լոխիայի զարգացումը ճիշտ նույնը չէ բոլորի համար: Որոշ փոփոխություններ կարող են բնականաբար ուղեկցել ծննդաբերությունից հետո վերականգնմանը:',
    normalPoints: [
      {
        title: 'Փոփոխվող քանակ',
        text: 'Քանակը կարող է փոխվել առաջին մի քանի օրվա ընթացքում, ապա աստիճանաբար նվազել:',
      },
      {
        title: 'Փոփոխվող գույն',
        text: 'Լոխիան ժամանակի ընթացքում սովորաբար անցնում է կարմիրից դեպի ավելի բաց երանգներ:',
      },
      {
        title: 'Փոփոխվող տևողություն',
        text: 'Այն կարող է պահպանվել մի քանի շաբաթ, և դրա զարգացումը տարբերվում է մարդուց մարդ:',
      },
    ],
    section4Heading: '4. Հարմարավետության և հետևման խորհուրդներ',
    section4Body:
      'Այս շրջանում պարզ հետևումը կարող է օգնել դիտարկել, թե ինչպես է փոխվում ձեր մարմինը՝ առանց ձեր փորձը ուրիշի հետ համեմատելու:',
    comfortTips: [
      {
        title: 'Մեղմ հիգիենա',
        text: 'Նախապատվություն տվեք մեղմ, կանոնավոր լվացմանը՝ առանց գրգռող միջոցների:',
      },
      {
        title: 'Հետևեք զարգացմանը',
        text: 'Կարող եք գրանցել արտազատուկի գույնը, քանակը և զարգացումը, եթե դա օգնում է հետևել ձեր վերականգնմանը:',
      },
      {
        title: 'Թույլ տվեք ինքներդ ձեզ հանգստանալ',
        text: 'Հետծննդյան շրջանը ժամանակ է պահանջում: Լսեք ձեր մարմինը և հարգեք վերականգնվելու ձեր կարիքը:',
      },
    ],
    section5Heading: '5. Լոխիա, թե դաշտանի վերադարձ',
    section5Body:
      'Լոխիան հայտնվում է ծննդաբերությունից հետո օրերին և աստիճանաբար նվազում է: Դաշտանի վերադարձը, ընդհակառակը, համապատասխանում է ձեր դաշտանային ցիկլի վերսկսմանը այս շրջանից հետո:',
    compareLochiaTitle: 'Լոխիա',
    compareLochiaText: 'Արտազատուկ՝ կապված ծննդաբերությունից հետո արգանդի վերականգնման հետ:',
    compareReturnTitle: 'Դաշտանի վերադարձ',
    compareReturnText:
      'Դաշտանային ցիկլի վերսկսում՝ մարդուց մարդ տարբերվող ժամանակ:',
    section6Heading: '6. Ե՞րբ դիմել բժշկական խորհրդատվության',
    section6Body:
      'Եթե զարգացումը ձեզ անսովոր է թվում կամ եթե ձեր ընդհանուր վիճակը վատանում է, կարևոր է խորհուրդ հարցնել առողջապահության մասնագետից:',
    warningTitle: 'Նշաններ, որոնք պահանջում են բժշկական խորհրդատվություն',
    warningSigns: [
      'Սուր կամ անսովոր հոտ',
      'Ջերմություն կամ ընդհանուր վիճակի վատացում',
      'Արտահոսք, որը հանկարծակի դառնում է շատ ավելի առատ',
      'Զգալի, շարունակական կամ անսովոր ցավ',
      'Նոր ախտանիշ, որն անհանգստացնում է ձեզ',
    ],
    tipTitle: 'Լավ է իմանալ',
    tipText:
      'Լոխիան սովորաբար զարգանում է աստիճանաբար. այն սկզբում կարող է կարմիր լինել, ապա դառնալ ավելի բաց՝ նախքան դադարելը: Այդուհանդերձ, յուրաքանչյուր վերականգնում անհատական է:',
    summaryHeading: 'Հիմնական եզրակացություններ',
    summaryPoints: [
      'Լոխիան նորմալ արտազատուկ է ծննդաբերությունից հետո:',
      'Այն սովորաբար փոխում է գույնը և քանակը շաբաթների ընթացքում:',
      'Դրա տևողությունն ու զարգացումը կարող են տարբերվել մարդուց մարդ:',
      'Անսովոր հոտը, ջերմությունը, զգալի ցավը կամ հանկարծակի շատ առատ արյունահոսությունը պահանջում են բժշկական խորհրդատվություն:',
    ],
    disclaimerText:
      'Տեղեկատվական բովանդակություն: Այս հոդվածը չի փոխարինում բժշկական խորհրդատվությանը կամ հետազոտությանը: Կասկածի դեպքում կամ անհանգստացնող ախտանիշ նկատելիս խորհուրդ հարցրեք առողջապահության մասնագետից:',
    shareMessage: 'Հասկանալ լոխիան ծննդաբերությունից հետո — AWA',
  },
  tg: {
    badgeText: 'ДАВРАИ БАЪДИЗОӢ • ЛОХИЯ',
    title: 'Фаҳмидани лохия\nпас аз таваллуд',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни иттилоотӣ',
    intro:
      'Пас аз таваллуд лохия тарашшуҳи маҳбалро мефаҳмонад, ки бо раванди табиии барқароршавии бачадон алоқаманд аст. Ранг ва миқдори он дар рӯзҳо ва ҳафтаҳои минбаъда тадриҷан тағйир меёбад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Лохия чист?',
      'Бо мурури замон чӣ тавр тағйир меёбад?',
      'Чӣ метавонад муқаррарӣ бошад',
      'Маслиҳатҳои роҳатӣ',
      'Кай бояд маслиҳати тиббӣ пурсид?',
      'Хулосаҳои асосӣ',
    ],
    section1Heading: '1. Лохия чист?',
    section1Body1:
      'Лохия тарашшуҳи маҳбал аст, ки пас аз таваллуд пайдо мешавад. Он асосан аз тадриҷан хориҷ шудани хун, тарашшуҳот ва бофта аз бачадон ҳангоми барқароршавии он иборат аст.',
    section1Body2:
      'Он аз ҳайзи муқаррарӣ фарқ мекунад. Он дар давраи баъдизоӣ интизор меравад ва одатан тадриҷан кам мешавад.',
    infoTitle: 'Хулосаҳои асосӣ',
    infoText:
      'Лохия маънои онро надорад, ки ҳайзи шумо аллакай баргашт. Баргашти ҳайз рӯйдоди алоҳида аст, ки баъдтар рух медиҳад.',
    section2Heading: '2. Лохия бо мурури замон чӣ тавр тағйир меёбад?',
    section2Body:
      'Намуди он одатан дар чанд ҳафтаи аввал тағйир меёбад. Ранг тадриҷан равшантар мешавад ва миқдор кам шуданӣ мешавад.',
    evolutionTitle: 'Пешрафти тадриҷӣ',
    evolutionSubtitle: 'Марҳилаҳо метавонанд аз шахс ба шахс фарқ кунанд',
    evolution: [
      {
        label: 'Сурхи равшан',
        period: 'Рӯзҳои аввал',
        text: 'Тарашшуҳ одатан сурх аст ва дар оғоз метавонад зиёдтар бошад.',
      },
      {
        label: 'Гулобӣ / қаҳваранг',
        period: 'Пас аз чанд рӯз',
        text: 'Ранг тадриҷан равшантар мешавад ва метавонад ба гулобӣ ё қаҳваранг моил шавад.',
      },
      {
        label: 'Сафед-зард',
        period: 'Дар ҳафтаҳои минбаъда',
        text: 'Тарашшуҳ одатан сабуктар, зардтоб ё сафедтоб мешавад, пеш аз он ки кам шавад.',
      },
    ],
    section3Heading: '3. Чӣ метавонад муқаррарӣ бошад',
    section3Body:
      'Тарзи тағйирёбии лохия барои ҳама комилан якхела нест. Баъзе тағйирот метавонад ба таври табиӣ барқароршавӣ пас аз таваллудро ҳамроҳӣ кунад.',
    normalPoints: [
      {
        title: 'Миқдори тағйирёбанда',
        text: 'Миқдор метавонад дар чанд рӯзи аввал тағйир ёбад ва сипас тадриҷан кам шавад.',
      },
      {
        title: 'Ранге, ки тағйир меёбад',
        text: 'Лохия одатан бо мурури замон аз сурх ба рангҳои равшантар мегузарад.',
      },
      {
        title: 'Давомнокии гуногун',
        text: 'Он метавонад чанд ҳафта идома ёбад ва тарзи тағйирёбии он аз шахс ба шахс фарқ мекунад.',
      },
    ],
    section4Heading: '4. Маслиҳатҳои роҳатӣ ва пайгирӣ',
    section4Body:
      'Дар ин давра пайгирии оддӣ метавонад ба шумо кумак кунад мушоҳида кунед, ки бадани шумо чӣ тавр тағйир меёбад, бидуни он ки таҷрибаи худро бо таҷрибаи каси дигар муқоиса кунед.',
    comfortTips: [
      {
        title: 'Гигиенаи нарм',
        text: 'Шустани нарм ва мунтазамро бе маҳсулоти асабонӣ афзал донед.',
      },
      {
        title: 'Тағйирёбиро пайгирӣ кунед',
        text: 'Метавонед ранг, миқдор ва пешрафти тарашшуҳро қайд кунед, агар ин ба пайгирии барқароршавии шумо кумак кунад.',
      },
      {
        title: 'Ба худ истироҳат диҳед',
        text: 'Давраи баъдизоӣ вақт мегирад. Ба бадани худ гӯш диҳед ва ниёзи худро ба барқароршавӣ эҳтиром кунед.',
      },
    ],
    section5Heading: '5. Лохия ё бозгашти ҳайз?',
    section5Body:
      'Лохия дар рӯзҳои баъд аз таваллуд пайдо мешавад ва тадриҷан кам мешавад. Бозгашти ҳайз бошад, ба аз сар гирифтани давраи ҳайзии шумо пас аз ин давра мувофиқ аст.',
    compareLochiaTitle: 'Лохия',
    compareLochiaText: 'Тарашшуҳе, ки бо барқароршавии бачадон пас аз таваллуд алоқаманд аст.',
    compareReturnTitle: 'Бозгашти ҳайз',
    compareReturnText:
      'Аз сар гирифтани давраи ҳайз, дар вақте ки аз шахс ба шахс фарқ мекунад.',
    section6Heading: '6. Кай бояд маслиҳати тиббӣ пурсид?',
    section6Body:
      'Агар пешрафт ба назари шумо ғайриоддӣ менамояд ё ҳолати умумии шумо бадтар мешавад, муҳим аст, ки аз мутахассиси соҳаи тиб маслиҳат пурсед.',
    warningTitle: 'Нишонаҳое, ки маслиҳати тиббиро талаб мекунанд',
    warningSigns: [
      'Бӯи қавӣ ё ғайриоддӣ',
      'Таб ё бадтар шудани ҳолати умумӣ',
      'Ҷараёне, ки ногаҳон хеле зиёд мешавад',
      'Дарди назаррас, доимӣ ё ғайриоддӣ',
      'Нишонаи нав, ки шуморо нигарон мекунад',
    ],
    tipTitle: 'Донистан хуб аст',
    tipText:
      'Лохия одатан тадриҷан тағйир меёбад: он дар аввал метавонад сурх бошад, сипас равшантар шавад, пеш аз он ки кам шавад. Бо вуҷуди ин, ҳар барқароршавӣ инфиродӣ аст.',
    summaryHeading: 'Хулосаҳои асосӣ',
    summaryPoints: [
      'Лохия тарашшуҳи муқаррарӣ пас аз таваллуд аст.',
      'Он одатан дар давоми ҳафтаҳо ранг ва миқдори худро тағйир медиҳад.',
      'Давомнокӣ ва пешрафти он аз шахс ба шахс фарқ карда метавонад.',
      'Бӯи ғайриоддӣ, таб, дарди назаррас ё хунравии ногаҳон хеле зиёд маслиҳати тиббиро талаб мекунад.',
    ],
    disclaimerText:
      'Мазмуни иттилоотӣ. Ин мақола маслиҳати тиббӣ ё муоинаро иваз намекунад. Дар сурати шубҳа ё мушоҳидаи нишонаи нигаронкунанда аз мутахассиси соҳаи тиб маслиҳат пурсед.',
    shareMessage: 'Фаҳмидани лохия пас аз таваллуд — AWA',
  },
  ky: {
    badgeText: 'ТӨРӨТТӨН КИЙИН • ЛОХИЯ',
    title: 'Төрөттөн кийинки\nлохияны түшүнүү',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Маалымат берүүчү мазмун',
    intro:
      'Төрөттөн кийин лохия — жатындын калыбына келүүсүнүн табигый процесси менен байланышкан кынаптан бөлүнүп чыгуу. Анын түсү жана көлөмү кийинки күндөрдө жана жумаларда акырындап өзгөрөт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Лохия деген эмне?',
      'Ал убакыттын өтүшү менен кандай өзгөрөт?',
      'Эмне кадимки болушу мүмкүн',
      'Ыңгайлуулук боюнча кеңештер',
      'Медициналык кеңешти качан сурап кайрылуу керек?',
      'Негизги жыйынтыктар',
    ],
    section1Heading: '1. Лохия деген эмне?',
    section1Body1:
      'Лохия — төрөттөн кийин пайда болгон кынаптан бөлүнүп чыгуу. Ал негизинен жатындын калыбына келүүсү учурунда андан кандын, бөлүнмөлөрдүн жана ткандын акырындап чыгарылышынан турат.',
    section1Body2:
      'Ал адаттагы етек киримден айырмаланат. Ал төрөттөн кийинки мезгилде күтүлөт жана жалпысынан акырындап азаят.',
    infoTitle: 'Негизги жыйынтыктар',
    infoText:
      'Лохия етек кирим кайтып келди дегенди билдирбейт. Етек киримдин кайтышы кийин болгон өзүнчө окуя.',
    section2Heading: '2. Лохия убакыттын өтүшү менен кандай өзгөрөт?',
    section2Body:
      'Анын көрүнүшү адатта алгачкы жумаларда өзгөрөт. Түсү акырындап ачыкташып, көлөмү азайууга умтулат.',
    evolutionTitle: 'Акырындык менен өнүгүү',
    evolutionSubtitle: 'Этаптар адамдан адамга айырмаланышы мүмкүн',
    evolution: [
      {
        label: 'Жаркын кызыл',
        period: 'Алгачкы күндөр',
        text: 'Бөлүнүп чыгуу адатта кызыл түстө болот жана башында көбүрөөк болушу мүмкүн.',
      },
      {
        label: 'Кызгылт / күрөңсүмөк',
        period: 'Бир нече күндөн кийин',
        text: 'Түсү акырындап ачыкташып, кызгылтка же күрөңгө жылышы мүмкүн.',
      },
      {
        label: 'Агыш-сары',
        period: 'Кийинки жумаларда',
        text: 'Бөлүнүп чыгуу адатта жеңилдеп, сарыгыраак же агыш болот да, акырындап токтойт.',
      },
    ],
    section3Heading: '3. Эмне кадимки болушу мүмкүн',
    section3Body:
      'Лохиянын өнүгүшү баарында так бирдей эмес. Айрым өзгөрүүлөр төрөттөн кийинки калыбына келүүгө табигый түрдө кошо жүрүшү мүмкүн.',
    normalPoints: [
      {
        title: 'Өзгөрүлмө көлөм',
        text: 'Көлөм алгачкы күндөрдө өзгөрүп, андан кийин акырындап азайышы мүмкүн.',
      },
      {
        title: 'Өзгөрүүчү түс',
        text: 'Лохия адатта убакыттын өтүшү менен кызылдан ачыкыраак түстөргө өтөт.',
      },
      {
        title: 'Өзгөрүлмө узактык',
        text: 'Ал бир нече жума бою сакталышы мүмкүн жана анын өнүгүшү адамдан адамга айырмаланат.',
      },
    ],
    section4Heading: '4. Ыңгайлуулук жана көзөмөл боюнча кеңештер',
    section4Body:
      'Бул мезгилде жөнөкөй көзөмөл тажрыйбаңызды башка бирөөнүкү менен салыштырбастан денеңиз кантип өзгөрүп жатканын байкоого жардам бериши мүмкүн.',
    comfortTips: [
      {
        title: 'Жумшак гигиена',
        text: 'Дүүлүктүрбөгөн каражатсыз жумшак, үзгүлтүксүз жуунууга артыкчылык бериңиз.',
      },
      {
        title: 'Өнүгүшүн байкаңыз',
        text: 'Калыбына келүүңүздү көзөмөлдөөгө жардам берсе, бөлүнүп чыгуунун түсүн, көлөмүн жана өнүгүшүн жазып койсоңуз болот.',
      },
      {
        title: 'Өзүңүзгө эс алууга уруксат бериңиз',
        text: 'Төрөттөн кийинки мезгил убакыт алат. Денеңизди угуп, калыбына келүү муктаждыгын сыйлаңыз.',
      },
    ],
    section5Heading: '5. Лохиябы же етек киримдин кайтышыбы?',
    section5Body:
      'Лохия төрөттөн кийинки күндөрдө пайда болуп, акырындап азаят. Етек киримдин кайтышы болсо, бул мезгилден кийин етек кирим циклинин улануусуна туура келет.',
    compareLochiaTitle: 'Лохия',
    compareLochiaText: 'Төрөттөн кийин жатындын калыбына келүүсү менен байланышкан бөлүнүп чыгуу.',
    compareReturnTitle: 'Етек киримдин кайтышы',
    compareReturnText:
      'Етек кирим циклинин улануусу, адамдан адамга айырмаланган убакта.',
    section6Heading: '6. Медициналык кеңешти качан сурап кайрылуу керек?',
    section6Body:
      'Эгер өнүгүү сизге адаттан тыш көрүнсө же жалпы абалыңыз начарлап жатса, ден соолук сактоо адисинен кеңеш сурап кайрылуу маанилүү.',
    warningTitle: 'Медициналык кеңешти талап кылган белгилер',
    warningSigns: [
      'Күчтүү же адаттан тыш жыт',
      'Ысытма же жалпы абалдын начарлашы',
      'Капыстан бир кыйла көбөйгөн агым',
      'Олуттуу, улана берген же адаттан тыш оору',
      'Тынчсыздандырган жаңы белги',
    ],
    tipTitle: 'Билүү пайдалуу',
    tipText:
      'Лохия адатта акырындап өзгөрөт: башында кызыл болуп, андан кийин ачыкташып, акырындап токтойт. Бирок ар бир калыбына келүү жеке мүнөздө.',
    summaryHeading: 'Негизги жыйынтыктар',
    summaryPoints: [
      'Лохия — төрөттөн кийинки кадимки бөлүнүп чыгуу.',
      'Ал адатта жумалар бою түсү жана көлөмү боюнча өзгөрөт.',
      'Анын узактыгы жана өнүгүшү адамдан адамга айырмаланышы мүмкүн.',
      'Адаттан тыш жыт, ысытма, олуттуу оору же капыстан өтө көп кан кетүү медициналык кеңешти талап кылат.',
    ],
    disclaimerText:
      'Маалымат берүүчү мазмун. Бул макала медициналык кеңешти же текшерүүнү алмаштырбайт. Күмөн болсо же тынчсыздандырган белги байкасаңыз, ден соолук сактоо адисинен кеңеш сураңыз.',
    shareMessage: 'Төрөттөн кийинки лохияны түшүнүү — AWA',
  },
  tk: {
    badgeText: 'DOGRANDAN SOŇ • LOHIÝA',
    title: 'Dograndan soňky lohiýany\ndüşünmek',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Maglumat berýän mazmun',
    intro:
      'Dograndan soň lohiýa ýatgynyň tebigy dikelişi bilen baglanyşykly jynsy ýoldan bölünip çykyşy aňladýar. Onuň reňki we mukdary indiki günlerde we hepdelerde ýuwaş-ýuwaşdan üýtgeýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Lohiýa näme?',
      'Ol wagtyň geçmegi bilen nähili üýtgeýär?',
      'Nämäniň adaty bolup biljekdigi',
      'Rahatlyk maslahatlary',
      'Lukmançylyk maslahatyny haçan soramaly?',
      'Esasy netijeler',
    ],
    section1Heading: '1. Lohiýa näme?',
    section1Body1:
      'Lohiýa dograndan soň peýda bolýan jynsy ýoldan bölünip çykyş. Ol esasan ýatgy dikelenden gan, bölünip çykýan suwuklyklar we dokumalaryň ýuwaş-ýuwaşdan aýrylmagyndan durýar.',
    section1Body2:
      'Ol adaty aýbaşydan tapawutly. Ol dograndan soňky döwürde garaşylýar we adatça ýuwaş-ýuwaşdan azalýar.',
    infoTitle: 'Esasy netijeler',
    infoText:
      'Lohiýa aýbaşyňyzyň eýýäm gaýdyp gelendigini aňlatmaýar. Aýbaşynyň gaýdyp gelmegi soňrak bolýan aýry wakalar.',
    section2Heading: '2. Lohiýa wagtyň geçmegi bilen nähili üýtgeýär?',
    section2Body:
      'Onuň görnüşi adatça ilkinji hepdelerde üýtgeýär. Reňk ýuwaş-ýuwaşdan açyklaşýar we mukdar azalmaga ýykgyn edýär.',
    evolutionTitle: 'Ýuwaş-ýuwaşdan ösüş',
    evolutionSubtitle: 'Tapgyrlar adamdan adama tapawutlanyp biler',
    evolution: [
      {
        label: 'Açyk gyzyl',
        period: 'Ilkinji günler',
        text: 'Bölünip çykyş adatça gyzyl we başda has köp bolup biler.',
      },
      {
        label: 'Gülgüne / goňurymtyl',
        period: 'Birnäçe günden soň',
        text: 'Reňk ýuwaş-ýuwaşdan açyklaşýar we gülgüne ýa-da goňur reňke geçip biler.',
      },
      {
        label: 'Akymtyl-sary',
        period: 'Indiki hepdelerde',
        text: 'Bölünip çykyş adatça ýeňilleşýär, sarymtyl ýa-da akymtyl bolýar we soňra kesilýär.',
      },
    ],
    section3Heading: '3. Nämäniň adaty bolup biljekdigi',
    section3Body:
      'Lohiýanyň ösüşi hemmeler üçin takyk şol bir däl. Käbir üýtgeşmeler dograndan soňky dikelişe tebigy ýagdaýda hemrah bolup biler.',
    normalPoints: [
      {
        title: 'Üýtgeýän mukdar',
        text: 'Mukdar ilkinji günlerde üýtgäp, soňra ýuwaş-ýuwaşdan azalyp biler.',
      },
      {
        title: 'Üýtgeýän reňk',
        text: 'Lohiýa wagtyň geçmegi bilen adatça gyzyldan has açyk öwüşginlere geçýär.',
      },
      {
        title: 'Üýtgeýän dowamlylyk',
        text: 'Ol birnäçe hepde dowam edip biler we ösüşi adamdan adama tapawutlanýar.',
      },
    ],
    section4Heading: '4. Rahatlyk we yzarlama maslahatlary',
    section4Body:
      'Bu döwürde ýönekeý yzarlama tejribäňizi başga biriniňki bilen deňeşdirmän, bedeniňiziň nähili üýtgeýändigini synlamaga kömek edip biler.',
    comfortTips: [
      {
        title: 'Ýumşak arassaçylyk',
        text: 'Gyjyndyryjy önümsiz ýumşak, yzygiderli ýuwunmaga artykmaçlyk beriň.',
      },
      {
        title: 'Onuň ösüşini synlaň',
        text: 'Dikeliş ýoluňyzy yzarlamaga kömek etse, bölünip çykyşyň reňkini, mukdaryny we ösüşini belläp bilersiňiz.',
      },
      {
        title: 'Özüňize dynç bermäge rugsat ediň',
        text: 'Dograndan soňky döwür wagt talap edýär. Bedeniňize gulak asyň we dikelmek zerurlygyňyza hormat goýuň.',
      },
    ],
    section5Heading: '5. Lohiýa ýa-da aýbaşynyň gaýdyp gelmegi?',
    section5Body:
      'Lohiýa dograndan soňky günlerde peýda bolýar we ýuwaş-ýuwaşdan azalýar. Aýbaşynyň gaýdyp gelmegi, tersine, şu döwürden soň aýbaşy sikliniň täzeden başlamagyna gabat gelýär.',
    compareLochiaTitle: 'Lohiýa',
    compareLochiaText: 'Dograndan soň ýatgynyň dikelişi bilen baglanyşykly bölünip çykyş.',
    compareReturnTitle: 'Aýbaşynyň gaýdyp gelmegi',
    compareReturnText:
      'Aýbaşy sikliniň täzeden başlamagy, wagty adamdan adama tapawutlanýar.',
    section6Heading: '6. Lukmançylyk maslahatyny haçan soramaly?',
    section6Body:
      'Ösüş size adaty däl bolup görünse ýa-da umumy ýagdaýyňyz erbetleşse, saglyk hünärmeninden maslahat almak möhüm.',
    warningTitle: 'Lukmançylyk maslahatyny talap edýän alamatlar',
    warningSigns: [
      'Güýçli ýa-da adaty däl ys',
      'Gyzgyn ýa-da erbetleşýän umumy ýagdaý',
      'Birden has köp bolýan gan akma',
      'Möhüm, dowamly ýa-da adaty däl agyry',
      'Sizi alada goýýan täze alamat',
    ],
    tipTitle: 'Bilmek peýdaly',
    tipText:
      'Lohiýa adatça ýuwaş-ýuwaşdan üýtgeýär: ol başda gyzyl bolup, soňra açyklaşyp we kesilip biler. Şeýle-de bolsa, her dikeliş şahsy.',
    summaryHeading: 'Esasy netijeler',
    summaryPoints: [
      'Lohiýa dograndan soňky adaty bölünip çykyş.',
      'Ol adatça hepdeler dowamynda reňkini we mukdaryny üýtgedýär.',
      'Onuň dowamlylygy we ösüşi adamdan adama tapawutlanyp biler.',
      'Adaty däl ys, gyzgyn, möhüm agyry ýa-da birden gaty köp gan akma lukmançylyk maslahatyny talap edýär.',
    ],
    disclaimerText:
      'Maglumat berýän mazmun. Bu makala lukmançylyk maslahatyny ýa-da barlagy çalyşmaýar. Şübhe bolsa ýa-da alada goýýan alamat görseňiz, saglyk hünärmeninden maslahat soraň.',
    shareMessage: 'Dograndan soňky lohiýany düşünmek — AWA',
  },
} as const);

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function LochiaArticleScreen({
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

  /* ------------------------------------------------------------------------ */
  /* BOOKMARK                                                                 */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* SHARE                                                                    */
  /* ------------------------------------------------------------------------ */

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Partage annulé ou indisponible.
    }
  };

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

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
        ]}
      >

        {/* ================================================================== */}
        {/* HERO                                                               */}
        {/* ================================================================== */}

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
            ]}
          >

            {/* BACK */}

            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={23}
              onPress={() => navigation.goBack()}
              variant="tonal"
            />

            {/* ACTIONS */}

            <View style={styles.actions}>
              <AwaIconButton
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
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

        {/* ================================================================== */}
        {/* ARTICLE                                                            */}
        {/* ================================================================== */}

        <View style={styles.article}>

          {/* ---------------------------------------------------------------- */}
          {/* BADGE                                                            */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badgeText}
            </AwaText>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* TITLE                                                            */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          {/* ---------------------------------------------------------------- */}
          {/* METADATA                                                         */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              ['book-open-page-variant-outline', content.metaType],
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

          {/* ---------------------------------------------------------------- */}
          {/* INTRO                                                            */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* ---------------------------------------------------------------- */}
          {/* CONTENTS                                                         */}
          {/* ---------------------------------------------------------------- */}

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}
              >
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>
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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.section1Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.infoTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                {content.infoText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.section2Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body}
          </AwaText>

          {/* EVOLUTION TIMELINE */}

          <AwaCard variant="filled" padding="none" style={styles.evolutionCard}>

            <View style={styles.evolutionHeader}>
              <View style={styles.evolutionHeaderIcon}>
                <MaterialDesignIcons
                  name="timeline-clock-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.evolutionHeaderCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.evolutionTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.evolutionSubtitle}>
                  {content.evolutionSubtitle}
                </AwaText>
              </View>
            </View>

            <View style={styles.timeline}>
              {content.evolution.map((item, index) => {
                const meta = EVOLUTION_META[index];
                const isLast =
                  index === content.evolution.length - 1;

                return (
                  <View
                    key={meta.number}
                    style={styles.timelineItem}
                  >

                    <View style={styles.timelineLeft}>
                      <View style={styles.timelineNode}>
                        <AwaText variant="labelSmall" emphasized colorRole="primary">
                          {meta.number}
                        </AwaText>
                      </View>

                      {!isLast ? (
                        <View style={styles.timelineLine} />
                      ) : null}
                    </View>

                    <View style={styles.timelineContent}>

                      <View style={styles.timelineTitleRow}>
                        <MaterialDesignIcons
                          name={meta.icon as never}
                          size={18}
                          color={theme.colors.primary}
                        />

                        <AwaText variant="titleSmall" emphasized style={styles.timelineTitle}>
                          {item.label}
                        </AwaText>
                      </View>

                      <AwaText variant="labelSmall" colorRole="primary" style={styles.timelinePeriod}>
                        {item.period}
                      </AwaText>

                      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.timelineText}>
                        {item.text}
                      </AwaText>

                    </View>
                  </View>
                );
              })}
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.section3Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body}
          </AwaText>

          <View style={styles.normalGrid}>
            {content.normalPoints.map((item, index) => {
              const meta = NORMAL_META[index];

              return (
                <AwaCard variant="filled" padding="none"
                  key={item.title}
                  style={styles.normalCard}
                >
                  <View style={styles.normalIcon}>
                    <MaterialDesignIcons
                      name={meta.icon as never}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>

                  <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>
                    {item.title}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>
                    {item.text}
                  </AwaText>
                </AwaCard>
              );
            })}
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.section4Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section4Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comfortCard}>
            {content.comfortTips.map((item, index) => {
              const meta = COMFORT_META[index];

              return (
                <View
                  key={item.title}
                  style={[
                    styles.comfortRow,
                    index < content.comfortTips.length - 1 &&
                      styles.comfortRowBorder,
                  ]}
                >
                  <View style={styles.comfortIcon}>
                    <MaterialDesignIcons
                      name={meta.icon as never}
                      size={19}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.comfortCopy}>
                    <AwaText variant="titleSmall" emphasized>
                      {item.title}
                    </AwaText>

                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.comfortText}>
                      {item.text}
                    </AwaText>
                  </View>
                </View>
              );
            })}
          </AwaCard>

          {/* ================================================================= */}
          {/* DIFFERENCE LOCHIES / RULES                                        */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.section5Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.compareCard}>

            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="water-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <AwaText variant="titleSmall" emphasized style={styles.compareTitle}>
                {content.compareLochiaTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.compareText}>
                {content.compareLochiaText}
              </AwaText>
            </View>

            <View style={styles.compareDivider} />

            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="calendar-month-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <AwaText variant="titleSmall" emphasized style={styles.compareTitle}>
                {content.compareReturnTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.compareText}>
                {content.compareReturnText}
              </AwaText>
            </View>

          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.section6Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section6Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>

            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <AwaText variant="titleSmall" emphasized style={styles.warningTitle}>
                {content.warningTitle}
              </AwaText>
            </View>

            {content.warningSigns.map(item => (
              <View
                key={item}
                style={styles.warningRow}
              >
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={16}
                    color={theme.colors.warning}
                  />
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* TIP                                                                 */}
          {/* ================================================================= */}

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tipTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SUMMARY                                                            */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.summaryHeading}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View
                key={item}
                style={styles.summaryRow}
              >
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                         */}
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

      {/* ==================================================================== */}
      {/* READING CONTROLS                                                     */}
      {/* ==================================================================== */}

      <ReadingControls
        articleId={ID}
        durationMinutes={6}
        scrollRef={scrollRef}
      />
    </View>
  );
}

/* ========================================================================== */
/* STYLES                                                                      */
/* ========================================================================== */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  /* ------------------------------------------------------------------------ */
  /* SCREEN                                                                   */
  /* ------------------------------------------------------------------------ */

  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 32,
  },

  /* ------------------------------------------------------------------------ */
  /* HERO                                                                     */
  /* ------------------------------------------------------------------------ */

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



  /* ------------------------------------------------------------------------ */
  /* ARTICLE                                                                  */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* METADATA                                                                 */
  /* ------------------------------------------------------------------------ */

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


  /* ------------------------------------------------------------------------ */
  /* INTRO                                                                    */
  /* ------------------------------------------------------------------------ */

  intro: {
    marginTop: 16,
  },

  /* ------------------------------------------------------------------------ */
  /* CONTENTS                                                                 */
  /* ------------------------------------------------------------------------ */

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
    width: 25,
  },

  contentText: {
    flex: 1,
  },

  /* ------------------------------------------------------------------------ */
  /* HEADINGS & theme.colors.textSecondary                                                          */
  /* ------------------------------------------------------------------------ */

  h2: {
    marginTop: 28,
  },

  body: {
    marginTop: 8,
  },

  /* ------------------------------------------------------------------------ */
  /* INFO CARD                                                                */
  /* ------------------------------------------------------------------------ */

  infoCard: {
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoCopy: {
    flex: 1,
    marginLeft: 8,
  },


  infoText: {
    marginTop: 3,
  },

  /* ------------------------------------------------------------------------ */
  /* EVOLUTION                                                                */
  /* ------------------------------------------------------------------------ */

  evolutionCard: {
    marginTop: 16,
    padding: 16,
  },

  evolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  evolutionHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  evolutionHeaderCopy: {
    flex: 1,
    marginLeft: 12,
  },


  evolutionSubtitle: {
    marginTop: 3,
  },

  timeline: {
    marginTop: 4,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 91,
  },

  timelineLeft: {
    width: 43,
    alignItems: 'center',
    position: 'relative',
  },

  timelineNode: {
    width: 32,
    height: 32,
    marginTop: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 2,
  },


  timelineLine: {
    position: 'absolute',
    top: 46,
    bottom: 0,
    width: 1.5,
    backgroundColor: theme.colors.border,
  },

  timelineContent: {
    flex: 1,
    paddingTop: 12,
    paddingLeft: 8,
    paddingBottom: 12,
  },

  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  timelineTitle: {
    flex: 1,
  },

  timelinePeriod: {
    marginTop: 2,
  },

  timelineText: {
    marginTop: 4,
  },

  /* ------------------------------------------------------------------------ */
  /* NORMAL GRID                                                              */
  /* ------------------------------------------------------------------------ */

  normalGrid: {
    marginTop: 12,
    gap: 8,
  },

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

  normalTitle: {
    marginTop: 8,
  },

  normalText: {
    marginTop: 4,
  },

  /* ------------------------------------------------------------------------ */
  /* COMFORT                                                                  */
  /* ------------------------------------------------------------------------ */

  comfortCard: {
    marginTop: 12,
    paddingHorizontal: 12,
  },

  comfortRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },

  comfortRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  comfortCopy: {
    flex: 1,
    marginLeft: 12,
  },


  comfortText: {
    marginTop: 3,
  },

  /* ------------------------------------------------------------------------ */
  /* COMPARISON                                                               */
  /* ------------------------------------------------------------------------ */

  compareCard: {
    marginTop: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  compareColumn: {
    flex: 1,
  },

  compareIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  compareTitle: {
    marginTop: 8,
  },

  compareText: {
    marginTop: 4,
  },

  compareDivider: {
    width: 1,
    marginHorizontal: 12,
    backgroundColor: theme.colors.border,
  },

  /* ------------------------------------------------------------------------ */
  /* WARNING                                                                  */
  /* ------------------------------------------------------------------------ */

  warningCard: {
    marginTop: 12,
    padding: 16,
  },

  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  warningTitle: {
    flex: 1,
    marginLeft: 8,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  warningBullet: {
    width: 20,
    alignItems: 'flex-start',
  },

  warningText: {
    flex: 1,
    marginLeft: 4,
  },

  /* ------------------------------------------------------------------------ */
  /* TIP                                                                      */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* SUMMARY                                                                  */
  /* ------------------------------------------------------------------------ */

  summaryCard: {
    marginTop: 12,
    padding: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },

  summaryText: {
    flex: 1,
  },

  /* ------------------------------------------------------------------------ */
  /* DISCLAIMER                                                               */
  /* ------------------------------------------------------------------------ */

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  disclaimerText: {
    flex: 1,
  },
  });
}
