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

const CONTENT = {
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
} as const;

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
