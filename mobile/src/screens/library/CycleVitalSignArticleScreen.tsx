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

const ID = 'cycle-signe-vital';

const HERO = require('../../assets/images/library/regular-cycle-heartbeat.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
// Section 1 — what to observe day to day.
const OBSERVE_ICONS = [
  'calendar-range',
  'calendar-clock',
  'water-outline',
  'heart-pulse',
  'opacity',
  'emoticon-outline',
  'flash-outline',
  'clipboard-pulse-outline',
] as const;

// Section 4 — factors that can influence the cycle. Same icon vocabulary as
// the reference "Cycle régulier ou irrégulier" article's own CAUSES list,
// for visual/editorial consistency across the family.
const FACTOR_ICONS = [
  'head-heart-outline',
  'weather-night',
  'scale-bathroom',
  'shoe-sneaker',
  'molecule',
  'pill',
  'hospital-box-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('CycleVitalSign', {
  fr: {
    badge: 'CYCLE & RÈGLES',
    title: 'Ton cycle, un excellent\nindicateur de santé',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi le cycle est parfois appelé le « cinquième signe vital ».',
    contentsTitle: 'Dans cet article',
    topics: [
      'Ton cycle : un reflet de ton corps',
      'Qu’est-ce qu’un cycle « normal » ?',
      'Les changements à surveiller',
      'Que peuvent révéler ces changements ?',
      'Suivre son cycle pour mieux se connaître',
      'Quand demander conseil ?',
      'Bon à savoir',
    ],
    observeLabels: [
      'Durée du cycle',
      'Durée des règles',
      'Flux menstruel',
      'Douleurs',
      'Pertes vaginales',
      'Humeur',
      'Énergie / fatigue',
      'Autres symptômes récurrents',
    ],
    factorLabels: [
      'Stress',
      'Manque de sommeil',
      'Changements de poids importants',
      'Activité physique très intense',
      'Changements hormonaux',
      'Contraception',
      'Certaines conditions médicales',
    ],
    s1Body1:
      'Le cycle menstruel est influencé par l’activité hormonale du corps tout au long du mois. Apprendre à l’observer peut t’aider à mieux comprendre ton propre fonctionnement, sans qu’il soit nécessaire de tout analyser en détail.',
    s1Body2: 'Voici les éléments les plus utiles à remarquer :',
    s2Body1:
      'Il n’existe pas un seul cycle parfait : chaque corps a son propre rythme, et ce rythme peut aussi varier légèrement d’un mois à l’autre. Un cycle est généralement considéré comme régulier lorsque sa durée se situe entre 21 et 35 jours, et les règles durent le plus souvent de 3 à 7 jours.',
    s2Body2:
      'Ces repères restent des moyennes : de légères variations restent tout à fait normales, surtout après la puberté, un accouchement ou à l’approche de la ménopause.',
    s3Body1:
      'Certains changements méritent d’être observés avec un peu plus d’attention, notamment :',
    changesToWatch: [
      'Un changement marqué dans la régularité du cycle',
      'Des règles nettement plus abondantes qu’à l’habitude',
      'Des douleurs inhabituellement fortes ou persistantes',
      'Une absence prolongée de règles',
      'Des saignements entre les règles',
      'Un changement important qui se répète sur plusieurs cycles',
    ],
    s3Body2:
      'Un cycle inhabituel, isolé, ne signifie pas automatiquement un problème de santé : le corps peut réagir ponctuellement à de nombreux facteurs.',
    s4Body1:
      'Ces changements peuvent parfois être liés à plusieurs facteurs, sans qu’il s’agisse forcément d’un problème :',
    s4Body2:
      'Ce ne sont que des pistes possibles parmi d’autres : elles ne remplacent jamais l’avis d’un professionnel de santé.',
    s5VisualTitle: 'Observer ton propre rythme',
    s5VisualText:
      'Noter tes dates, ton flux ou ton ressenti t’aide à mieux connaître tes habitudes, mois après mois.',
    s5Body:
      'Le premier jour des règles, leur durée, le flux, les douleurs, l’humeur, l’énergie ou encore les pertes vaginales sont autant d’éléments que tu peux noter au fil du temps. L’objectif n’est pas de comparer ton cycle à celui d’une autre personne, mais de mieux repérer ce qui est habituel pour toi, et ce qui s’en écarte.',
    s6Body1:
      'Il est tout à fait normal de se poser des questions sur son cycle. Demander un avis médical peut être utile dans certaines situations, par exemple :',
    whenToAsk: [
      'Des changements importants qui persistent sur plusieurs cycles',
      'Des douleurs qui empêchent de suivre tes activités habituelles',
      'Des règles très abondantes',
      'Une absence prolongée de règles',
      'Des saignements inhabituels',
      'Tout symptôme persistant qui t’inquiète',
    ],
    s6Body2:
      'En parler à un professionnel de santé permet d’être rassurée ou, si besoin, d’être accompagnée — ce n’est jamais un motif d’inquiétude en soi.',
    tipText:
      'Un cycle n’a pas besoin d’être parfaitement régulier pour être normal. Connaître ton propre rythme habituel est souvent plus utile que de chercher une durée idéale.',
    finalBody:
      'Ton cycle menstruel est l’un des nombreux indicateurs de ta santé. Le suivre régulièrement peut t’aider à mieux comprendre ton corps et à repérer, avec le temps, les changements qui méritent une attention particulière.',
    shareMessage: 'Ton cycle, un excellent indicateur de santé — AWA',
  },
  en: {
    badge: 'CYCLE & PERIODS',
    title: 'Your cycle, an excellent\nhealth indicator',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Why the cycle is sometimes called the “fifth vital sign.”',
    contentsTitle: 'In this article',
    topics: [
      'Your cycle: a reflection of your body',
      'What is a “normal” cycle?',
      'Changes to watch for',
      'What can these changes reveal?',
      'Tracking your cycle to know yourself better',
      'When to seek advice?',
      'Good to know',
    ],
    observeLabels: [
      'Cycle length',
      'Period length',
      'Menstrual flow',
      'Pain',
      'Vaginal discharge',
      'Mood',
      'Energy / fatigue',
      'Other recurring symptoms',
    ],
    factorLabels: [
      'Stress',
      'Lack of sleep',
      'Significant weight changes',
      'Very intense physical activity',
      'Hormonal changes',
      'Contraception',
      'Certain medical conditions',
    ],
    s1Body1:
      'The menstrual cycle is influenced by the body’s hormonal activity throughout the month. Learning to observe it can help you better understand how your body works, without needing to analyze everything in detail.',
    s1Body2: 'Here are the most useful things to notice:',
    s2Body1:
      'There’s no single perfect cycle: every body has its own rhythm, and that rhythm can also vary slightly from month to month. A cycle is generally considered regular when it lasts between 21 and 35 days, and periods most often last 3 to 7 days.',
    s2Body2:
      'These figures are averages: slight variations remain completely normal, especially after puberty, after giving birth, or as menopause approaches.',
    s3Body1:
      'Some changes are worth watching a little more closely, such as:',
    changesToWatch: [
      'A marked change in cycle regularity',
      'Periods noticeably heavier than usual',
      'Unusually strong or persistent pain',
      'A prolonged absence of periods',
      'Bleeding between periods',
      'A significant change that repeats over several cycles',
    ],
    s3Body2:
      'A single, isolated unusual cycle doesn’t automatically mean a health problem: the body can react temporarily to many different factors.',
    s4Body1:
      'These changes can sometimes be linked to several factors, without necessarily being a problem:',
    s4Body2:
      'These are just some possible explanations among others: they never replace the advice of a healthcare professional.',
    s5VisualTitle: 'Observing your own rhythm',
    s5VisualText:
      'Noting your dates, flow, or how you feel helps you get to know your habits, month after month.',
    s5Body:
      'The first day of your period, its length, the flow, pain, mood, energy, or vaginal discharge are all things you can note over time. The goal isn’t to compare your cycle to someone else’s, but to better recognize what’s usual for you, and what differs from it.',
    s6Body1:
      'It’s completely normal to have questions about your cycle. Seeking medical advice can be helpful in certain situations, for example:',
    whenToAsk: [
      'Significant changes that persist over several cycles',
      'Pain that keeps you from your usual activities',
      'Very heavy periods',
      'A prolonged absence of periods',
      'Unusual bleeding',
      'Any persistent symptom that worries you',
    ],
    s6Body2:
      'Talking to a healthcare professional can help put your mind at ease or, if needed, get you the right support — it’s never a reason for concern in itself.',
    tipText:
      'A cycle doesn’t need to be perfectly regular to be normal. Knowing your own usual rhythm is often more useful than looking for an ideal length.',
    finalBody:
      'Your menstrual cycle is one of many indicators of your health. Tracking it regularly can help you better understand your body and, over time, notice changes that deserve particular attention.',
    shareMessage: 'Your cycle, an excellent health indicator — AWA',
  },
  es: {
    badge: 'CICLO Y PERÍODO',
    title: 'Tu ciclo, un excelente\nindicador de salud',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Por qué al ciclo a veces se le llama el «quinto signo vital».',
    contentsTitle: 'En este artículo',
    topics: [
      'Tu ciclo: un reflejo de tu cuerpo',
      '¿Qué es un ciclo «normal»?',
      'Los cambios que hay que vigilar',
      '¿Qué pueden revelar estos cambios?',
      'Hacer seguimiento de tu ciclo para conocerte mejor',
      '¿Cuándo pedir consejo?',
      'Dato útil',
    ],
    observeLabels: [
      'Duración del ciclo',
      'Duración del período',
      'Flujo menstrual',
      'Dolores',
      'Flujo vaginal',
      'Estado de ánimo',
      'Energía / fatiga',
      'Otros síntomas recurrentes',
    ],
    factorLabels: [
      'Estrés',
      'Falta de sueño',
      'Cambios de peso importantes',
      'Actividad física muy intensa',
      'Cambios hormonales',
      'Anticoncepción',
      'Ciertas condiciones médicas',
    ],
    s1Body1:
      'El ciclo menstrual está influenciado por la actividad hormonal del cuerpo a lo largo del mes. Aprender a observarlo puede ayudarte a entender mejor tu propio funcionamiento, sin necesidad de analizarlo todo en detalle.',
    s1Body2: 'Estos son los elementos más útiles para observar:',
    s2Body1:
      'No existe un único ciclo perfecto: cada cuerpo tiene su propio ritmo, y ese ritmo también puede variar ligeramente de un mes a otro. Por lo general, se considera que un ciclo es regular cuando su duración está entre 21 y 35 días, y el período suele durar de 3 a 7 días.',
    s2Body2:
      'Estas cifras son solo promedios: las variaciones leves siguen siendo totalmente normales, sobre todo después de la pubertad, de un parto o al acercarse la menopausia.',
    s3Body1:
      'Algunos cambios merecen observarse con un poco más de atención, en particular:',
    changesToWatch: [
      'Un cambio marcado en la regularidad del ciclo',
      'Un período notablemente más abundante de lo habitual',
      'Dolores inusualmente fuertes o persistentes',
      'Una ausencia prolongada del período',
      'Sangrado entre períodos',
      'Un cambio importante que se repite durante varios ciclos',
    ],
    s3Body2:
      'Un ciclo inusual y aislado no significa automáticamente un problema de salud: el cuerpo puede reaccionar puntualmente a numerosos factores.',
    s4Body1:
      'Estos cambios a veces pueden estar relacionados con varios factores, sin que se trate necesariamente de un problema:',
    s4Body2:
      'Estas son solo algunas posibles explicaciones entre otras: nunca sustituyen la opinión de un profesional de la salud.',
    s5VisualTitle: 'Observar tu propio ritmo',
    s5VisualText:
      'Anotar tus fechas, tu flujo o cómo te sientes te ayuda a conocer mejor tus hábitos, mes tras mes.',
    s5Body:
      'El primer día del período, su duración, el flujo, los dolores, el estado de ánimo, la energía o el flujo vaginal son otros tantos elementos que puedes anotar con el tiempo. El objetivo no es comparar tu ciclo con el de otra persona, sino identificar mejor lo que es habitual para ti y lo que se aparta de ello.',
    s6Body1:
      'Es completamente normal tener preguntas sobre tu ciclo. Pedir una opinión médica puede ser útil en ciertas situaciones, por ejemplo:',
    whenToAsk: [
      'Cambios importantes que persisten durante varios ciclos',
      'Dolores que te impiden seguir con tus actividades habituales',
      'Un período muy abundante',
      'Una ausencia prolongada del período',
      'Sangrado inusual',
      'Cualquier síntoma persistente que te preocupe',
    ],
    s6Body2:
      'Hablar de ello con un profesional de la salud te permite quedarte tranquila o, si es necesario, recibir el acompañamiento adecuado; nunca es, en sí mismo, un motivo de preocupación.',
    tipText:
      'Un ciclo no necesita ser perfectamente regular para ser normal. Conocer tu propio ritmo habitual suele ser más útil que buscar una duración ideal.',
    finalBody:
      'Tu ciclo menstrual es uno de los muchos indicadores de tu salud. Hacerle seguimiento con regularidad puede ayudarte a entender mejor tu cuerpo y a identificar, con el tiempo, los cambios que merecen una atención especial.',
    shareMessage: 'Tu ciclo, un excelente indicador de salud — AWA',
  },
  it: {
    badge: 'CICLO E MESTRUAZIONI',
    title: 'Il tuo ciclo, un ottimo\nindicatore di salute',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Perché il ciclo è talvolta chiamato «quinto segno vitale».',
    contentsTitle: 'In questo articolo',
    topics: [
      'Il tuo ciclo: il riflesso del tuo corpo',
      'Cos’è un ciclo «normale»?',
      'Cambiamenti da tenere d’occhio',
      'Cosa possono rivelare questi cambiamenti?',
      'Monitorare il ciclo per conoscerti meglio',
      'Quando chiedere consiglio?',
      'Da sapere',
    ],
    observeLabels: [
      'Durata del ciclo',
      'Durata delle mestruazioni',
      'Flusso mestruale',
      'Dolore',
      'Perdite vaginali',
      'Umore',
      'Energia / stanchezza',
      'Altri sintomi ricorrenti',
    ],
    factorLabels: [
      'Stress',
      'Mancanza di sonno',
      'Variazioni di peso importanti',
      'Attività fisica molto intensa',
      'Cambiamenti ormonali',
      'Contraccezione',
      'Alcune condizioni mediche',
    ],
    s1Body1: 'Il ciclo mestruale è influenzato dall’attività ormonale del corpo nel corso del mese. Imparare a osservarlo può aiutarti a capire meglio come funziona il tuo corpo, senza dover analizzare ogni dettaglio.',
    s1Body2: 'Ecco gli elementi più utili da osservare:',
    s2Body1: 'Non esiste un ciclo perfetto unico: ogni corpo ha il suo ritmo, e questo ritmo può variare leggermente anche da un mese all’altro. Un ciclo è generalmente considerato regolare quando dura tra 21 e 35 giorni, e le mestruazioni durano più spesso da 3 a 7 giorni.',
    s2Body2: 'Queste cifre sono medie: lievi variazioni restano del tutto normali, soprattutto dopo la pubertà, dopo il parto o con l’avvicinarsi della menopausa.',
    s3Body1: 'Alcuni cambiamenti meritano di essere osservati con un po’ più di attenzione, ad esempio:',
    changesToWatch: [
      'Un netto cambiamento nella regolarità del ciclo',
      'Mestruazioni nettamente più abbondanti del solito',
      'Dolore insolitamente forte o persistente',
      'Un’assenza prolungata delle mestruazioni',
      'Sanguinamento tra una mestruazione e l’altra',
      'Un cambiamento significativo che si ripete per più cicli',
    ],
    s3Body2: 'Un solo ciclo insolito, isolato, non significa automaticamente un problema di salute: il corpo può reagire temporaneamente a molti fattori diversi.',
    s4Body1: 'Questi cambiamenti possono talvolta essere legati a diversi fattori, senza essere necessariamente un problema:',
    s4Body2: 'Queste sono solo alcune possibili spiegazioni tra le altre: non sostituiscono mai il parere di un professionista sanitario.',
    s5VisualTitle: 'Osservare il tuo ritmo',
    s5VisualText: 'Annotare le date, il flusso o come ti senti ti aiuta a conoscere le tue abitudini, mese dopo mese.',
    s5Body: 'Il primo giorno delle mestruazioni, la loro durata, il flusso, il dolore, l’umore, l’energia o le perdite vaginali sono tutti elementi che puoi annotare nel tempo. L’obiettivo non è confrontare il tuo ciclo con quello di un’altra persona, ma riconoscere meglio ciò che è abituale per te e ciò che se ne discosta.',
    s6Body1: 'È del tutto normale avere dubbi sul proprio ciclo. Chiedere un parere medico può essere utile in alcune situazioni, ad esempio:',
    whenToAsk: [
      'Cambiamenti significativi che persistono per più cicli',
      'Dolore che ti impedisce di svolgere le tue attività abituali',
      'Mestruazioni molto abbondanti',
      'Un’assenza prolungata delle mestruazioni',
      'Sanguinamenti insoliti',
      'Qualsiasi sintomo persistente che ti preoccupa',
    ],
    s6Body2: 'Parlare con un professionista sanitario può aiutarti a stare più tranquilla o, se necessario, a ricevere il sostegno giusto: di per sé non è mai un motivo di preoccupazione.',
    tipText: 'Un ciclo non deve essere perfettamente regolare per essere normale. Conoscere il tuo ritmo abituale è spesso più utile che cercare una durata ideale.',
    finalBody: 'Il tuo ciclo mestruale è uno dei tanti indicatori della tua salute. Monitorarlo con regolarità può aiutarti a capire meglio il tuo corpo e, nel tempo, a notare cambiamenti che meritano particolare attenzione.',
    shareMessage: 'Il tuo ciclo, un ottimo indicatore di salute — AWA',
  },
  tr: {
    badge: 'DÖNGÜ VE ADET',
    title: 'Döngün, sağlığının\nçok iyi bir göstergesi',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Döngü neden bazen “beşinci yaşam belirtisi” olarak adlandırılır?',
    contentsTitle: 'Bu makalede',
    topics: [
      'Döngün: vücudunun bir yansıması',
      '“Normal” bir döngü nedir?',
      'Dikkat edilmesi gereken değişimler',
      'Bu değişimler neyi gösterebilir?',
      'Kendini tanımak için döngünü takip etmek',
      'Ne zaman tavsiye almalı?',
      'Bilmekte fayda var',
    ],
    observeLabels: [
      'Döngü uzunluğu',
      'Adet süresi',
      'Adet kanaması miktarı',
      'Ağrı',
      'Vajinal akıntı',
      'Ruh hali',
      'Enerji / yorgunluk',
      'Tekrarlayan diğer belirtiler',
    ],
    factorLabels: [
      'Stres',
      'Uykusuzluk',
      'Belirgin kilo değişimleri',
      'Çok yoğun fiziksel aktivite',
      'Hormonal değişimler',
      'Doğum kontrolü',
      'Bazı tıbbi durumlar',
    ],
    s1Body1: 'Adet döngüsü, vücudun ay boyunca süren hormonal etkinliğinden etkilenir. Döngüyü gözlemlemeyi öğrenmek, her şeyi ayrıntılı biçimde analiz etmene gerek kalmadan vücudunun nasıl çalıştığını daha iyi anlamana yardımcı olabilir.',
    s1Body2: 'İşte fark etmeye değer en yararlı şeyler:',
    s2Body1: 'Tek bir mükemmel döngü yoktur: her vücudun kendine özgü bir ritmi vardır ve bu ritim aydan aya hafifçe de değişebilir. Bir döngü genellikle 21 ila 35 gün sürdüğünde düzenli kabul edilir; adetler çoğunlukla 3 ila 7 gün sürer.',
    s2Body2: 'Bu rakamlar ortalamalardır: özellikle ergenlikten sonra, doğum yaptıktan sonra veya menopoza yaklaşırken hafif değişimler tamamen normaldir.',
    s3Body1: 'Bazı değişimlere biraz daha yakından dikkat etmekte fayda var, örneğin:',
    changesToWatch: [
      'Döngü düzeninde belirgin bir değişim',
      'Her zamankinden belirgin biçimde daha yoğun adetler',
      'Alışılmadık ölçüde şiddetli veya süregelen ağrı',
      'Adetin uzun süre görülmemesi',
      'Adetler arasında kanama',
      'Birkaç döngü boyunca tekrarlayan belirgin bir değişim',
    ],
    s3Body2: 'Tek seferlik, olağandışı bir döngü kendiliğinden bir sağlık sorunu anlamına gelmez: vücut birçok farklı etkene geçici olarak tepki verebilir.',
    s4Body1: 'Bu değişimler bazen, mutlaka bir sorun olmaksızın, çeşitli etkenlerle ilişkili olabilir:',
    s4Body2: 'Bunlar yalnızca olası açıklamalardan bazılarıdır: hiçbir zaman bir sağlık profesyonelinin tavsiyesinin yerini tutmaz.',
    s5VisualTitle: 'Kendi ritmini gözlemle',
    s5VisualText: 'Tarihlerini, kanama miktarını veya nasıl hissettiğini not etmek, ay be ay alışkanlıklarını tanımana yardımcı olur.',
    s5Body: 'Adetinin ilk günü, süresi, kanama miktarı, ağrı, ruh hali, enerji veya vajinal akıntı zaman içinde not edebileceğin şeylerdir. Amaç döngünü bir başkasının döngüsüyle kıyaslamak değil, senin için nelerin olağan olduğunu ve nelerin bundan farklı olduğunu daha iyi fark etmektir.',
    s6Body1: 'Döngün hakkında sorular sorman tamamen normaldir. Tıbbi tavsiye almak bazı durumlarda yararlı olabilir, örneğin:',
    whenToAsk: [
      'Birkaç döngü boyunca süren belirgin değişimler',
      'Olağan etkinliklerini yapmanı engelleyen ağrı',
      'Çok yoğun adetler',
      'Adetin uzun süre görülmemesi',
      'Alışılmadık kanama',
      'Seni endişelendiren, süregelen herhangi bir belirti',
    ],
    s6Body2: 'Bir sağlık profesyoneliyle konuşmak, içini rahatlatmana veya gerekirse doğru desteği almana yardımcı olabilir; bu, kendi başına bir endişe nedeni değildir.',
    tipText: 'Bir döngünün normal olması için mükemmel biçimde düzenli olması gerekmez. Kendi olağan ritmini bilmek, çoğu zaman ideal bir uzunluk aramaktan daha yararlıdır.',
    finalBody: 'Adet döngün, sağlığının birçok göstergesinden yalnızca biridir. Onu düzenli olarak takip etmek, vücudunu daha iyi anlamana ve zamanla özel dikkat gerektiren değişimleri fark etmene yardımcı olabilir.',
    shareMessage: 'Döngün, sağlığının çok iyi bir göstergesi — AWA',
  },
  ru: {
    badge: 'ЦИКЛ И МЕСЯЧНЫЕ',
    title: 'Ваш цикл — отличный\nпоказатель здоровья',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Почему цикл иногда называют «пятым жизненно важным показателем».',
    contentsTitle: 'В этой статье',
    topics: [
      'Ваш цикл — отражение состояния организма',
      'Что такое «нормальный» цикл?',
      'За какими изменениями стоит следить',
      'О чём могут говорить эти изменения?',
      'Отслеживание цикла, чтобы лучше узнать себя',
      'Когда обращаться за советом?',
      'Полезно знать',
    ],
    observeLabels: [
      'Длительность цикла',
      'Длительность месячных',
      'Обильность менструальных выделений',
      'Боль',
      'Влагалищные выделения',
      'Настроение',
      'Энергия / усталость',
      'Другие повторяющиеся симптомы',
    ],
    factorLabels: [
      'Стресс',
      'Недосып',
      'Значительные колебания веса',
      'Очень интенсивная физическая нагрузка',
      'Гормональные изменения',
      'Контрацепция',
      'Некоторые медицинские состояния',
    ],
    s1Body1:
      'На менструальный цикл влияет гормональная активность организма в течение месяца. Если научиться наблюдать за ним, можно лучше понимать, как работает ваше тело, не анализируя всё до мелочей.',
    s1Body2: 'Вот на что полезнее всего обращать внимание:',
    s2Body1:
      'Единого идеального цикла не существует: у каждого организма свой ритм, и этот ритм может немного меняться от месяца к месяцу. Цикл обычно считается регулярным, если он длится от 21 до 35 дней, а месячные чаще всего продолжаются от 3 до 7 дней.',
    s2Body2:
      'Эти цифры — средние значения: небольшие отклонения остаются совершенно нормальными, особенно после полового созревания, после родов или при приближении менопаузы.',
    s3Body1:
      'За некоторыми изменениями стоит наблюдать внимательнее, например:',
    changesToWatch: [
      'Заметное нарушение регулярности цикла',
      'Месячные заметно обильнее обычного',
      'Необычно сильная или стойкая боль',
      'Длительное отсутствие месячных',
      'Кровянистые выделения между месячными',
      'Значительное изменение, которое повторяется в течение нескольких циклов',
    ],
    s3Body2:
      'Один необычный цикл сам по себе не означает проблем со здоровьем: организм может временно реагировать на множество разных факторов.',
    s4Body1:
      'Эти изменения иногда могут быть связаны с разными факторами и не обязательно говорят о проблеме:',
    s4Body2:
      'Это лишь некоторые из возможных объяснений: они никогда не заменяют совет медицинского специалиста.',
    s5VisualTitle: 'Наблюдайте за своим ритмом',
    s5VisualText:
      'Если отмечать даты, обильность выделений или самочувствие, вы будете лучше узнавать свои особенности месяц за месяцем.',
    s5Body:
      'Первый день месячных, их длительность, обильность выделений, боль, настроение, энергию и влагалищные выделения можно отмечать со временем. Цель — не сравнивать свой цикл с чужим, а лучше понимать, что для вас привычно, а что отличается от привычного.',
    s6Body1:
      'Совершенно нормально, что у вас возникают вопросы о своём цикле. Обратиться за медицинской консультацией может быть полезно в некоторых ситуациях, например:',
    whenToAsk: [
      'Значительные изменения, которые сохраняются в течение нескольких циклов',
      'Боль, которая мешает привычным занятиям',
      'Очень обильные месячные',
      'Длительное отсутствие месячных',
      'Необычные кровянистые выделения',
      'Любой стойкий симптом, который вас беспокоит',
    ],
    s6Body2:
      'Разговор со медицинским специалистом может помочь успокоиться или, при необходимости, получить нужную поддержку — сам по себе он никогда не является поводом для тревоги.',
    tipText:
      'Чтобы цикл был нормальным, он не обязан быть идеально регулярным. Знать свой привычный ритм зачастую полезнее, чем искать идеальную длительность.',
    finalBody:
      'Менструальный цикл — один из многих показателей вашего здоровья. Регулярное наблюдение за ним может помочь лучше понимать своё тело и со временем замечать изменения, заслуживающие особого внимания.',
    shareMessage: 'Ваш цикл — отличный показатель здоровья — AWA',
  },
  de: {
    badge: 'ZYKLUS & PERIODE',
    title: 'Dein Zyklus, ein hervorragender\nGesundheitsindikator',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Warum der Zyklus manchmal als „fünftes Vitalzeichen“ bezeichnet wird.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Dein Zyklus: ein Spiegel deines Körpers',
      'Was ist ein „normaler“ Zyklus?',
      'Veränderungen, auf die du achten kannst',
      'Was können diese Veränderungen zeigen?',
      'Den Zyklus verfolgen, um dich besser kennenzulernen',
      'Wann solltest du dir Rat holen?',
      'Gut zu wissen',
    ],
    observeLabels: [
      'Zykluslänge',
      'Dauer der Periode',
      'Stärke der Blutung',
      'Schmerzen',
      'Ausfluss',
      'Stimmung',
      'Energie / Müdigkeit',
      'Andere wiederkehrende Symptome',
    ],
    factorLabels: [
      'Stress',
      'Schlafmangel',
      'Deutliche Gewichtsveränderungen',
      'Sehr intensive körperliche Aktivität',
      'Hormonelle Veränderungen',
      'Verhütung',
      'Bestimmte Erkrankungen',
    ],
    s1Body1:
      'Der Menstruationszyklus wird von der hormonellen Aktivität deines Körpers im Verlauf des Monats beeinflusst. Wenn du lernst, ihn zu beobachten, verstehst du besser, wie dein Körper funktioniert – ohne dass du alles im Detail analysieren musst.',
    s1Body2: 'Das sind die nützlichsten Dinge, auf die du achten kannst:',
    s2Body1:
      'Den einen perfekten Zyklus gibt es nicht: Jeder Körper hat seinen eigenen Rhythmus, der von Monat zu Monat auch leicht schwanken kann. Ein Zyklus gilt im Allgemeinen als regelmäßig, wenn er zwischen 21 und 35 Tagen dauert; die Periode dauert meist 3 bis 7 Tage.',
    s2Body2:
      'Diese Zahlen sind Durchschnittswerte: Leichte Abweichungen sind völlig normal, besonders nach der Pubertät, nach einer Geburt oder wenn die Wechseljahre näher rücken.',
    s3Body1:
      'Manche Veränderungen verdienen etwas mehr Aufmerksamkeit, zum Beispiel:',
    changesToWatch: [
      'Eine deutliche Veränderung der Zyklusregelmäßigkeit',
      'Periodenblutungen, die spürbar stärker sind als sonst',
      'Ungewöhnlich starke oder anhaltende Schmerzen',
      'Ein längeres Ausbleiben der Periode',
      'Blutungen zwischen den Perioden',
      'Eine deutliche Veränderung, die sich über mehrere Zyklen wiederholt',
    ],
    s3Body2:
      'Ein einzelner, ungewöhnlicher Zyklus bedeutet nicht automatisch ein gesundheitliches Problem: Der Körper kann vorübergehend auf viele verschiedene Faktoren reagieren.',
    s4Body1:
      'Diese Veränderungen können manchmal mit mehreren Faktoren zusammenhängen, ohne dass es zwangsläufig ein Problem ist:',
    s4Body2:
      'Das sind nur einige mögliche Erklärungen unter vielen: Sie ersetzen nie den Rat von medizinischem Fachpersonal.',
    s5VisualTitle: 'Deinen eigenen Rhythmus beobachten',
    s5VisualText:
      'Wenn du deine Daten, die Stärke der Blutung oder dein Befinden notierst, lernst du deine Gewohnheiten Monat für Monat besser kennen.',
    s5Body:
      'Den ersten Tag deiner Periode, ihre Dauer, die Stärke der Blutung, Schmerzen, Stimmung, Energie oder Ausfluss kannst du über die Zeit festhalten. Es geht nicht darum, deinen Zyklus mit dem einer anderen zu vergleichen, sondern besser zu erkennen, was für dich üblich ist und was davon abweicht.',
    s6Body1:
      'Es ist völlig normal, Fragen zu deinem Zyklus zu haben. In bestimmten Situationen kann ärztlicher Rat hilfreich sein, zum Beispiel bei:',
    whenToAsk: [
      'Deutlichen Veränderungen, die über mehrere Zyklen bestehen bleiben',
      'Schmerzen, die dich an deinen gewohnten Aktivitäten hindern',
      'Sehr starken Perioden',
      'Einem längeren Ausbleiben der Periode',
      'Ungewöhnlichen Blutungen',
      'Jedem anhaltenden Symptom, das dich beunruhigt',
    ],
    s6Body2:
      'Ein Gespräch mit medizinischem Fachpersonal kann dich beruhigen oder dir bei Bedarf die passende Unterstützung verschaffen – an sich ist es nie ein Grund zur Sorge.',
    tipText:
      'Ein Zyklus muss nicht perfekt regelmäßig sein, um normal zu sein. Deinen eigenen gewohnten Rhythmus zu kennen, ist oft nützlicher, als nach einer idealen Länge zu suchen.',
    finalBody:
      'Dein Menstruationszyklus ist einer von vielen Indikatoren für deine Gesundheit. Wenn du ihn regelmäßig verfolgst, kannst du deinen Körper besser verstehen und mit der Zeit Veränderungen bemerken, die besondere Aufmerksamkeit verdienen.',
    shareMessage: 'Dein Zyklus, ein hervorragender Gesundheitsindikator – AWA',
  },
  zh: {
      badge: '周期与月经',
      title: '你的周期，\n一项很好的健康指标',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '为什么周期有时被称为“第五生命体征”。',
      contentsTitle: '本文内容',
      topics: [
        '你的周期：身体的一面镜子',
        '什么是“正常”的周期？',
        '需要留意的变化',
        '这些变化可能说明什么？',
        '记录周期，更了解自己',
        '何时寻求建议？',
        '小贴士',
      ],
      observeLabels: [
        '周期长度',
        '经期长度',
        '经量',
        '疼痛',
        '阴道分泌物',
        '情绪',
        '精力 / 疲劳',
        '其他反复出现的症状',
      ],
      factorLabels: [
        '压力',
        '睡眠不足',
        '体重明显变化',
        '高强度的身体活动',
        '激素变化',
        '避孕',
        '某些健康问题',
      ],
      s1Body1: '月经周期会受到身体一个月中激素活动的影响。学着观察它，可以帮助你更好地了解身体是如何运作的，而不需要事无巨细地分析一切。',
      s1Body2: '以下是最值得留意的几个方面：',
      s2Body1: '不存在唯一完美的周期：每个人的身体都有自己的节奏，这种节奏每个月也可能略有不同。周期一般在 21 到 35 天之间时被认为是规律的，经期通常持续 3 到 7 天。',
      s2Body2: '这些数字只是平均值：轻微的差异完全正常，尤其是在青春期之后、分娩之后，或临近绝经时。',
      s3Body1: '有些变化值得多留意一些，例如：',
      changesToWatch: [
        '周期规律性明显改变',
        '经量明显比平时多',
        '异常强烈或持续的疼痛',
        '长时间不来月经',
        '两次月经之间出血',
        '在连续几个周期中反复出现的明显变化',
      ],
      s3Body2: '偶尔一次的周期异常，并不一定意味着健康出了问题：身体可能会因为许多不同的因素而暂时出现反应。',
      s4Body1: '这些变化有时可能与以下几个因素有关，但不一定是问题：',
      s4Body2: '这些只是众多可能原因中的一部分：它们永远不能替代医疗专业人员的建议。',
      s5VisualTitle: '观察属于你自己的节奏',
      s5VisualText: '记下日期、经量或你的感受，可以帮助你一个月一个月地了解自己的规律。',
      s5Body: '月经的第一天、持续时间、经量、疼痛、情绪、精力或阴道分泌物，都是可以长期记录的内容。目的不是拿你的周期和别人比较，而是更好地认识什么对你来说是平常的，什么是有所不同的。',
      s6Body1: '对自己的周期有疑问是再正常不过的。在某些情况下，寻求医疗建议会有帮助，例如：',
      whenToAsk: [
        '连续几个周期持续出现明显变化',
        '疼痛影响了你的日常活动',
        '经量非常多',
        '长时间不来月经',
        '不寻常的出血',
        '任何让你担心的持续症状',
      ],
      s6Body2: '与医疗专业人员聊一聊，可以让你更安心，或在需要时获得合适的支持，这本身并不是值得担忧的事。',
      tipText: '周期不需要完美规律才算正常。了解自己平时的节奏，往往比追求某个理想的长度更有用。',
      finalBody: '你的月经周期是反映健康状况的众多指标之一。规律地记录它，可以帮助你更好地了解自己的身体，并随着时间推移，注意到值得特别关注的变化。',
      shareMessage: '你的周期，一项很好的健康指标 — AWA',
    },
  id: {
    badge: 'SIKLUS & HAID',
    title: 'Siklusmu, indikator\nkesehatan yang sangat baik',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Mengapa siklus kadang disebut “tanda vital kelima.”',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Siklusmu: cerminan tubuhmu',
      'Apa itu siklus “normal”?',
      'Perubahan yang perlu diperhatikan',
      'Apa yang bisa diungkapkan perubahan ini?',
      'Mencatat siklusmu untuk lebih mengenal diri',
      'Kapan harus meminta saran?',
      'Perlu diketahui',
    ],
    observeLabels: [
      'Panjang siklus',
      'Lama haid',
      'Aliran darah haid',
      'Nyeri',
      'Keputihan',
      'Suasana hati',
      'Energi / kelelahan',
      'Gejala berulang lainnya',
    ],
    factorLabels: [
      'Stres',
      'Kurang tidur',
      'Perubahan berat badan yang signifikan',
      'Aktivitas fisik yang sangat intens',
      'Perubahan hormon',
      'Kontrasepsi',
      'Kondisi medis tertentu',
    ],
    s1Body1: 'Siklus menstruasi dipengaruhi oleh aktivitas hormon tubuh sepanjang bulan. Belajar mengamatinya dapat membantumu lebih memahami cara kerja tubuhmu, tanpa perlu menganalisis semuanya secara mendetail.',
    s1Body2: 'Berikut hal-hal yang paling berguna untuk diperhatikan:',
    s2Body1: 'Tidak ada satu siklus yang sempurna: setiap tubuh punya ritmenya sendiri, dan ritme itu juga bisa sedikit berubah dari bulan ke bulan. Siklus umumnya dianggap teratur jika berlangsung antara 21 dan 35 hari, dan haid paling sering berlangsung 3 sampai 7 hari.',
    s2Body2: 'Angka-angka ini adalah rata-rata: variasi kecil tetap sepenuhnya normal, terutama setelah pubertas, setelah melahirkan, atau menjelang menopause.',
    s3Body1: 'Beberapa perubahan layak diperhatikan lebih saksama, misalnya:',
    changesToWatch: [
      'Perubahan nyata pada keteraturan siklus',
      'Haid yang jelas lebih deras dari biasanya',
      'Nyeri yang tidak biasa kuat atau terus-menerus',
      'Haid yang tidak datang dalam waktu lama',
      'Perdarahan di antara dua haid',
      'Perubahan signifikan yang berulang selama beberapa siklus',
    ],
    s3Body2: 'Satu siklus yang tidak biasa dan terjadi sekali saja tidak otomatis berarti masalah kesehatan: tubuh bisa bereaksi sementara terhadap berbagai faktor.',
    s4Body1: 'Perubahan ini kadang dapat berkaitan dengan beberapa faktor, tanpa harus menjadi masalah:',
    s4Body2: 'Ini hanyalah beberapa kemungkinan penjelasan di antara yang lain: semuanya tidak pernah menggantikan saran dari tenaga kesehatan.',
    s5VisualTitle: 'Mengamati ritmemu sendiri',
    s5VisualText: 'Mencatat tanggal, aliran, atau perasaanmu membantumu mengenali kebiasaanmu, bulan demi bulan.',
    s5Body: 'Hari pertama haid, lamanya, aliran, nyeri, suasana hati, energi, atau keputihan adalah hal-hal yang bisa kamu catat dari waktu ke waktu. Tujuannya bukan membandingkan siklusmu dengan siklus orang lain, tetapi lebih mengenali apa yang biasa bagimu, dan apa yang berbeda darinya.',
    s6Body1: 'Sangat wajar jika kamu punya pertanyaan tentang siklusmu. Mencari saran medis dapat membantu dalam situasi tertentu, misalnya:',
    whenToAsk: [
      'Perubahan signifikan yang bertahan selama beberapa siklus',
      'Nyeri yang menghalangi aktivitas harianmu',
      'Haid yang sangat deras',
      'Haid yang tidak datang dalam waktu lama',
      'Perdarahan yang tidak biasa',
      'Gejala apa pun yang menetap dan membuatmu khawatir',
    ],
    s6Body2: 'Berbicara dengan tenaga kesehatan dapat menenangkan pikiranmu atau, bila perlu, mengarahkanmu pada pendampingan yang tepat — hal itu tidak pernah menjadi alasan untuk khawatir dengan sendirinya.',
    tipText: 'Siklus tidak harus sempurna teratur agar dianggap normal. Mengenali ritme biasamu sendiri sering kali lebih berguna daripada mencari panjang siklus yang ideal.',
    finalBody: 'Siklus menstruasimu hanyalah salah satu dari banyak indikator kesehatanmu. Mencatatnya secara teratur dapat membantumu lebih memahami tubuhmu dan, seiring waktu, menyadari perubahan yang patut diperhatikan secara khusus.',
    shareMessage: 'Siklusmu, indikator kesehatan yang sangat baik — AWA',
  },
  hi: {
    badge: 'चक्र और पीरियड',
    title: 'आपका चक्र, सेहत का\nएक बेहतरीन संकेतक',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'चक्र को कभी-कभी “पाँचवाँ जीवन-संकेत” क्यों कहा जाता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'आपका चक्र: आपके शरीर का आईना',
      '“सामान्य” चक्र क्या होता है?',
      'किन बदलावों पर नज़र रखें',
      'ये बदलाव क्या बता सकते हैं?',
      'ख़ुद को बेहतर जानने के लिए चक्र को ट्रैक करना',
      'सलाह कब लें?',
      'जानना अच्छा रहेगा',
    ],
    observeLabels: [
      'चक्र की लंबाई',
      'पीरियड की अवधि',
      'पीरियड का फ़्लो',
      'दर्द',
      'योनि से स्राव',
      'मूड',
      'ऊर्जा / थकान',
      'बार-बार होने वाले अन्य लक्षण',
    ],
    factorLabels: [
      'तनाव',
      'नींद की कमी',
      'वज़न में बड़े बदलाव',
      'बहुत ज़्यादा शारीरिक मेहनत',
      'हॉर्मोनल बदलाव',
      'गर्भनिरोध',
      'कुछ चिकित्सकीय स्थितियाँ',
    ],
    s1Body1: 'मासिक चक्र पूरे महीने शरीर में चलने वाली हॉर्मोन की गतिविधि से प्रभावित होता है। इसे देखना सीखने से आप समझ पाती हैं कि आपका शरीर कैसे काम करता है, और इसके लिए हर चीज़ का बारीकी से विश्लेषण करना ज़रूरी नहीं है।',
    s1Body2: 'ये हैं ध्यान देने लायक सबसे उपयोगी बातें:',
    s2Body1: 'कोई एक आदर्श चक्र नहीं होता। हर शरीर की अपनी लय होती है, और यह लय महीने-दर-महीने थोड़ी बदल भी सकती है। चक्र को आम तौर पर तब नियमित माना जाता है जब वह 21 से 35 दिनों का हो, और पीरियड ज़्यादातर 3 से 7 दिनों तक चलते हैं।',
    s2Body2: 'ये आँकड़े औसत हैं। थोड़े-बहुत अंतर बिल्कुल सामान्य हैं, ख़ासकर यौवनारंभ के बाद, प्रसव के बाद, या मेनोपॉज़ (रजोनिवृत्ति) के क़रीब आने पर।',
    s3Body1: 'कुछ बदलावों पर थोड़ा ज़्यादा ध्यान देना चाहिए, जैसे:',
    changesToWatch: [
      'चक्र की नियमितता में साफ़ बदलाव',
      'पीरियड का आम से काफ़ी ज़्यादा भारी होना',
      'असामान्य रूप से तेज़ या लगातार बना रहने वाला दर्द',
      'पीरियड का लंबे समय तक न आना',
      'दो पीरियड के बीच रक्तस्राव',
      'कई चक्रों में दोहराया जाने वाला कोई बड़ा बदलाव',
    ],
    s3Body2: 'एक अकेला असामान्य चक्र अपने आप में सेहत की समस्या नहीं होता। शरीर कई अलग-अलग कारणों से कुछ समय के लिए प्रतिक्रिया दे सकता है।',
    s4Body1: 'ये बदलाव कभी-कभी कई कारणों से जुड़े हो सकते हैं, और ज़रूरी नहीं कि यह कोई समस्या हो:',
    s4Body2: 'ये अनेक संभावित कारणों में से सिर्फ़ कुछ हैं। ये किसी स्वास्थ्य विशेषज्ञ की सलाह की जगह कभी नहीं ले सकते।',
    s5VisualTitle: 'अपनी लय को देखना',
    s5VisualText: 'अपनी तारीख़ें, फ़्लो या अपना एहसास नोट करने से आप महीने-दर-महीने अपनी आदतों को जान पाती हैं।',
    s5Body: 'आपके पीरियड का पहला दिन, उसकी अवधि, फ़्लो, दर्द, मूड, ऊर्जा या योनि से स्राव, ये सब ऐसी बातें हैं जिन्हें आप समय के साथ नोट कर सकती हैं। मक़सद अपने चक्र की तुलना किसी और से करना नहीं है, बल्कि यह बेहतर पहचानना है कि आपके लिए क्या सामान्य है और क्या उससे अलग है।',
    s6Body1: 'अपने चक्र के बारे में सवाल होना बिल्कुल सामान्य है। कुछ स्थितियों में चिकित्सकीय सलाह लेना मददगार हो सकता है, उदाहरण के लिए:',
    whenToAsk: [
      'कई चक्रों तक बने रहने वाले बड़े बदलाव',
      'ऐसा दर्द जो आपको रोज़ के कामों से रोक दे',
      'बहुत भारी पीरियड',
      'पीरियड का लंबे समय तक न आना',
      'असामान्य रक्तस्राव',
      'कोई भी लगातार बना रहने वाला लक्षण जो आपको चिंतित करे',
    ],
    s6Body2: 'किसी स्वास्थ्य विशेषज्ञ से बात करने से आपकी चिंता दूर हो सकती है या, ज़रूरत पड़ने पर, आपको सही मदद मिल सकती है। यह अपने आप में कभी चिंता की वजह नहीं है।',
    tipText: 'सामान्य होने के लिए चक्र का पूरी तरह नियमित होना ज़रूरी नहीं है। अपनी सामान्य लय को जानना अक्सर किसी आदर्श लंबाई की तलाश से ज़्यादा उपयोगी होता है।',
    finalBody: 'आपका मासिक चक्र आपकी सेहत के कई संकेतकों में से एक है। इसे नियमित रूप से ट्रैक करने से आप अपने शरीर को बेहतर समझ सकती हैं और समय के साथ उन बदलावों को पहचान सकती हैं जिन पर ख़ास ध्यान देना ज़रूरी है।',
    shareMessage: 'आपका चक्र, सेहत का एक बेहतरीन संकेतक — AWA',
  },
  sq: {
    badge: 'CIKLI & MENSTRUACIONET',
    title: 'Cikli yt, një tregues i\nshkëlqyer i shëndetit',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Pse cikli quhet ndonjëherë “shenja e pestë jetësore”.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Cikli yt: pasqyrë e trupit tënd',
      'Çfarë është një cikël “normal”?',
      'Ndryshimet që duhen vërejtur',
      'Çfarë mund të zbulojnë këto ndryshime?',
      'Ndjekja e ciklit për të njohur më mirë veten',
      'Kur duhet kërkuar këshillë?',
      'Mirë është ta dish',
    ],
    observeLabels: [
      'Gjatësia e ciklit',
      'Gjatësia e menstruacioneve',
      'Rrjedhja menstruale',
      'Dhimbja',
      'Sekrecionet vaginale',
      'Gjendja shpirtërore',
      'Energjia / lodhja',
      'Simptoma të tjera që përsëriten',
    ],
    factorLabels: [
      'Stresi',
      'Mungesa e gjumit',
      'Ndryshime të mëdha në peshë',
      'Aktivitet fizik shumë intensiv',
      'Ndryshime hormonale',
      'Kontracepsioni',
      'Disa gjendje mjekësore',
    ],
    s1Body1: 'Cikli menstrual ndikohet nga aktiviteti hormonal i trupit gjatë muajit. Të mësuarit për ta vëzhguar mund të të ndihmojë ta kuptosh më mirë si funksionon trupi yt, pa pasur nevojë të analizosh gjithçka në detaje.',
    s1Body2: 'Ja gjërat më të dobishme për t’u vënë re:',
    s2Body1: 'Nuk ekziston një cikël i vetëm i përsosur: çdo trup ka ritmin e vet dhe ai ritëm mund të ndryshojë paksa edhe nga një muaj në tjetrin. Një cikël konsiderohet përgjithësisht i rregullt kur zgjat midis 21 dhe 35 ditësh dhe menstruacionet zgjasin më shpesh 3 deri në 7 ditë.',
    s2Body2: 'Këto shifra janë mesatare: ndryshimet e vogla mbeten krejtësisht normale, sidomos pas pubertetit, pas lindjes ose kur afron menopauza.',
    s3Body1: 'Disa ndryshime meritojnë të ndiqen pak më nga afër, si për shembull:',
    changesToWatch: [
      'Një ndryshim i dukshëm në rregullsinë e ciklit',
      'Menstruacione dukshëm më të bollshme se zakonisht te ti',
      'Dhimbje e pazakontë e fortë ose e vazhdueshme',
      'Mungesë e zgjatur e menstruacioneve',
      'Gjakderdhje midis menstruacioneve',
      'Një ndryshim i rëndësishëm që përsëritet gjatë disa cikleve',
    ],
    s3Body2: 'Një cikël i vetëm i pazakontë, i izoluar, nuk do të thotë automatikisht një problem shëndetësor: trupi mund të reagojë përkohësisht ndaj shumë faktorëve të ndryshëm.',
    s4Body1: 'Këto ndryshime mund të lidhen ndonjëherë me disa faktorë, pa qenë domosdoshmërisht një problem:',
    s4Body2: 'Këto janë vetëm disa shpjegime të mundshme mes të tjerave: ato nuk zëvendësojnë kurrë këshillën e një profesionisti të shëndetësisë.',
    s5VisualTitle: 'Vëzhgimi i ritmit tënd',
    s5VisualText: 'Të shënosh datat, rrjedhjen ose si ndihesh të ndihmon të njohësh zakonet e tua, muaj pas muaji.',
    s5Body: 'Dita e parë e menstruacioneve, kohëzgjatja e tyre, rrjedhja, dhimbja, gjendja shpirtërore, energjia ose sekrecionet vaginale janë të gjitha gjëra që mund t’i shënosh me kalimin e kohës. Qëllimi nuk është ta krahasosh ciklin tënd me atë të një tjetre, por të njohësh më mirë çfarë është e zakonshme për ty dhe çfarë ndryshon nga ajo.',
    s6Body1: 'Është krejtësisht normale të kesh pyetje për ciklin tënd. Kërkimi i këshillës mjekësore mund të jetë i dobishëm në disa situata, për shembull:',
    whenToAsk: [
      'Ndryshime të rëndësishme që vazhdojnë gjatë disa cikleve',
      'Dhimbje që të pengon në aktivitetet e tua të zakonshme',
      'Menstruacione shumë të bollshme',
      'Mungesë e zgjatur e menstruacioneve',
      'Gjakderdhje e pazakontë',
      'Çdo simptomë e vazhdueshme që të shqetëson',
    ],
    s6Body2: 'Të flasësh me një profesionist të shëndetësisë mund të të qetësojë ose, nëse është e nevojshme, të të sigurojë mbështetjen e duhur — kjo nuk është kurrë vetvetiu një arsye shqetësimi.',
    tipText: 'Një cikël nuk ka pse të jetë krejtësisht i rregullt për të qenë normal. Të njohësh ritmin tënd të zakonshëm është shpesh më e dobishme sesa të kërkosh një gjatësi ideale.',
    finalBody: 'Cikli yt menstrual është një nga shumë treguesit e shëndetit tënd. Ndjekja e tij rregullisht mund të të ndihmojë ta kuptosh më mirë trupin tënd dhe, me kalimin e kohës, të vërejsh ndryshime që meritojnë vëmendje të veçantë.',
    shareMessage: 'Cikli yt, një tregues i shkëlqyer i shëndetit — AWA',
  },
  ja: {
    badge: '周期と生理',
    title: '周期は、健康を知る\nすぐれた指標',
    metaDuration: '読了目安7分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '周期が「5番目のバイタルサイン」と呼ばれることがある理由を紹介します。',
    contentsTitle: 'この記事の内容',
    topics: [
      '周期は体を映す鏡',
      '「普通」の周期とは？',
      '注意したい変化',
      'こうした変化から何がわかる？',
      '周期を記録して自分を知る',
      '相談したほうがよいのはどんなとき？',
      '知っておきたいこと',
    ],
    observeLabels: [
      '周期の長さ',
      '生理の長さ',
      '経血量',
      '痛み',
      'おりもの',
      '気分',
      '元気・疲れ',
      'その他、繰り返し現れる症状',
    ],
    factorLabels: [
      'ストレス',
      '睡眠不足',
      '体重の大きな変化',
      '非常に激しい運動',
      'ホルモンの変化',
      '避妊',
      '特定の病気',
    ],
    s1Body1: '生理周期は、ひと月の間の体内のホルモンの働きに影響されます。周期を観察できるようになると、すべてを細かく分析しなくても、体の仕組みを理解しやすくなります。',
    s1Body2: '気づいておくと特に役立つのは、次のようなことです。',
    s2Body1: '完璧な周期というものはひとつではありません。体にはそれぞれのリズムがあり、そのリズムも月ごとに少し変わることがあります。周期は一般的に21〜35日の間であれば規則的とされ、生理は3〜7日続くことが最も多いです。',
    s2Body2: 'これらの数字は平均です。特に思春期のあと、出産のあと、閉経が近づく時期には、多少のばらつきがあっても全く普通のことです。',
    s3Body1: '次のような変化は、少し気をつけて見ておくとよいでしょう。',
    changesToWatch: [
      '周期の規則性がはっきり変わる',
      '生理の量がいつもよりかなり多い',
      'いつになく強い痛み、または続く痛み',
      '生理が長期間ない',
      '生理と生理の間の出血',
      '複数の周期にわたって繰り返される大きな変化',
    ],
    s3Body2: 'いつもと違う周期が1回だけあっても、それが自動的に健康上の問題を意味するわけではありません。体はさまざまな要因に一時的に反応することがあります。',
    s4Body1: 'こうした変化は、問題とは限らず、いくつかの要因に関係していることがあります。',
    s4Body2: 'これらは考えられる説明のほんの一部であり、医療従事者のアドバイスに代わるものでは決してありません。',
    s5VisualTitle: '自分のリズムを観察する',
    s5VisualText: '日付や経血量、そのときの体調を記録しておくと、月を重ねるごとに自分のパターンがわかってきます。',
    s5Body: '生理の初日、その長さ、経血量、痛み、気分、元気、おりものなどは、すべて時間をかけて記録できることです。目的は、他の人の周期と比べることではなく、自分にとっての普通を知り、それとの違いに気づきやすくなることです。',
    s6Body1: '周期について疑問を持つのは、ごく自然なことです。たとえば次のような場合は、医師に相談すると役立つことがあります。',
    whenToAsk: [
      '複数の周期にわたって続く大きな変化',
      '普段の活動ができなくなるほどの痛み',
      '非常に多い生理',
      '生理が長期間ない',
      'いつもと違う出血',
      '気になる症状が続いている',
    ],
    s6Body2: '医療従事者に相談することで、安心できたり、必要に応じて適切なサポートにつながったりします。相談すること自体が、心配すべきことを意味するわけではありません。',
    tipText: '周期は、完璧に規則的でなくても普通です。理想の長さを探すよりも、自分のいつものリズムを知っているほうが役立つことが多いです。',
    finalBody: '生理周期は、健康を知る数多くの指標のひとつです。定期的に記録することで、体への理解が深まり、時間がたつにつれて、特に注意が必要な変化にも気づきやすくなります。',
    shareMessage: '周期は、健康を知るすぐれた指標 — AWA',
  },
  ko: {
    badge: '주기 & 생리',
    title: '주기는 건강을\n알려 주는 훌륭한 지표예요',
    metaDuration: '읽는 데 7분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '주기를 ‘다섯 번째 활력 징후’라고 부르기도 하는 이유를 알아봐요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '주기, 몸을 비추는 거울',
      '‘정상’ 주기란?',
      '살펴봐야 할 변화',
      '이런 변화는 무엇을 의미할 수 있나요?',
      '주기를 기록하며 나를 더 알아가기',
      '언제 조언을 구해야 할까요?',
      '알아 두면 좋아요',
    ],
    observeLabels: [
      '주기 길이',
      '생리 기간',
      '생리 출혈량',
      '통증',
      '질 분비물',
      '기분',
      '에너지 / 피로',
      '그 밖에 반복되는 증상',
    ],
    factorLabels: [
      '스트레스',
      '수면 부족',
      '큰 체중 변화',
      '매우 강도 높은 신체 활동',
      '호르몬 변화',
      '피임',
      '특정 질환',
    ],
    s1Body1: '생리 주기는 한 달 동안 이어지는 몸의 호르몬 활동에 영향을 받아요. 주기를 살펴보는 법을 익히면, 모든 것을 자세히 분석하지 않아도 내 몸이 어떻게 움직이는지 더 잘 이해할 수 있어요.',
    s1Body2: '특히 눈여겨보면 좋은 것은 다음과 같아요.',
    s2Body1: '완벽한 주기는 하나로 정해져 있지 않아요. 몸마다 고유한 리듬이 있고, 그 리듬도 달마다 조금씩 달라질 수 있어요. 주기가 21~35일 사이이면 일반적으로 규칙적이라고 보고, 생리는 대개 3~7일 동안 이어져요.',
    s2Body2: '이 수치는 평균이에요. 특히 사춘기 이후, 출산 후, 폐경이 가까워질 때에는 약간의 차이가 있어도 전혀 이상하지 않아요.',
    s3Body1: '다음과 같은 변화는 조금 더 주의 깊게 살펴볼 만해요.',
    changesToWatch: [
      '주기의 규칙성이 뚜렷하게 달라짐',
      '평소보다 눈에 띄게 많은 생리 출혈',
      '평소와 달리 강하거나 계속되는 통증',
      '생리가 오랫동안 없음',
      '생리와 생리 사이의 출혈',
      '여러 주기에 걸쳐 반복되는 큰 변화',
    ],
    s3Body2: '평소와 다른 주기가 한 번 있었다고 해서 자동으로 건강에 문제가 있다는 뜻은 아니에요. 몸은 여러 가지 요인에 일시적으로 반응할 수 있어요.',
    s4Body1: '이런 변화는 때로 여러 요인과 관련이 있을 수 있고, 반드시 문제가 있다는 뜻은 아니에요.',
    s4Body2: '이는 가능한 여러 이유 중 일부일 뿐이며, 의료 전문가의 조언을 대신하지 않아요.',
    s5VisualTitle: '나만의 리듬 살펴보기',
    s5VisualText: '날짜, 출혈량, 몸 상태를 기록해 두면 달이 지날수록 나의 습관을 알아가는 데 도움이 돼요.',
    s5Body: '생리 첫째 날, 기간, 출혈량, 통증, 기분, 에너지, 질 분비물은 시간을 두고 기록해 볼 수 있는 것들이에요. 목표는 내 주기를 다른 사람과 비교하는 것이 아니라, 나에게 평소 어떤 상태가 보통이고 무엇이 다른지 더 잘 알아차리는 거예요.',
    s6Body1: '주기에 대해 궁금한 점이 생기는 것은 지극히 자연스러운 일이에요. 다음과 같은 경우에는 의료 전문가의 조언이 도움이 될 수 있어요.',
    whenToAsk: [
      '여러 주기에 걸쳐 큰 변화가 계속될 때',
      '통증 때문에 평소 활동을 하기 어려울 때',
      '생리 출혈량이 매우 많을 때',
      '생리가 오랫동안 없을 때',
      '평소와 다른 출혈이 있을 때',
      '걱정되는 증상이 계속될 때',
    ],
    s6Body2: '의료 전문가와 이야기하면 마음을 놓거나, 필요할 때 알맞은 도움을 받을 수 있어요. 상담을 받는다는 것 자체가 걱정할 일은 아니에요.',
    tipText: '정상이려면 주기가 완벽하게 규칙적이어야 하는 것은 아니에요. 이상적인 길이를 찾기보다 내게 평소 어떤 리듬이 보통인지 아는 것이 더 도움이 될 때가 많아요.',
    finalBody: '생리 주기는 건강을 보여 주는 여러 지표 중 하나예요. 꾸준히 기록하면 내 몸을 더 잘 이해하고, 시간이 지나면서 특별히 주의가 필요한 변화를 알아차리는 데 도움이 될 수 있어요.',
    shareMessage: '주기는 건강을 알려 주는 훌륭한 지표예요 — AWA',
  },
  'pt-PT': {
    badge: 'CICLO E PERÍODOS',
    title: 'O seu ciclo, um excelente\nindicador de saúde',
    metaDuration: '7 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Porque é que o ciclo é por vezes chamado o “quinto sinal vital”.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O seu ciclo: um reflexo do seu corpo',
      'O que é um ciclo “normal”?',
      'Alterações a vigiar',
      'O que podem revelar estas alterações?',
      'Acompanhar o ciclo para se conhecer melhor',
      'Quando procurar aconselhamento?',
      'Bom saber',
    ],
    observeLabels: [
      'Duração do ciclo',
      'Duração do período',
      'Fluxo menstrual',
      'Dor',
      'Corrimento vaginal',
      'Humor',
      'Energia / cansaço',
      'Outros sintomas recorrentes',
    ],
    factorLabels: [
      'Stress',
      'Falta de sono',
      'Alterações importantes de peso',
      'Atividade física muito intensa',
      'Alterações hormonais',
      'Contraceção',
      'Certas condições médicas',
    ],
    s1Body1: 'O ciclo menstrual é influenciado pela atividade hormonal do corpo ao longo do mês. Aprender a observá-lo pode ajudá-la a compreender melhor o funcionamento do seu corpo, sem necessidade de analisar tudo ao pormenor.',
    s1Body2: 'Eis o que é mais útil notar:',
    s2Body1: 'Não existe um ciclo perfeito único: cada corpo tem o seu próprio ritmo, que também pode variar ligeiramente de mês para mês. Um ciclo é geralmente considerado regular quando dura entre 21 e 35 dias, e os períodos duram na maioria das vezes 3 a 7 dias.',
    s2Body2: 'Estes valores são médias: pequenas variações continuam a ser perfeitamente normais, sobretudo depois da puberdade, após o parto ou à aproximação da menopausa.',
    s3Body1: 'Algumas alterações merecem ser vigiadas com um pouco mais de atenção, como:',
    changesToWatch: [
      'Uma alteração marcada da regularidade do ciclo',
      'Períodos nitidamente mais abundantes do que o habitual',
      'Dor invulgarmente forte ou persistente',
      'Uma ausência prolongada de períodos',
      'Hemorragias entre períodos',
      'Uma alteração importante que se repete ao longo de vários ciclos',
    ],
    s3Body2: 'Um único ciclo invulgar e isolado não significa automaticamente um problema de saúde: o corpo pode reagir temporariamente a muitos fatores diferentes.',
    s4Body1: 'Estas alterações podem, por vezes, estar ligadas a vários fatores, sem serem necessariamente um problema:',
    s4Body2: 'São apenas algumas explicações possíveis entre outras: nunca substituem o aconselhamento de um profissional de saúde.',
    s5VisualTitle: 'Observar o seu próprio ritmo',
    s5VisualText: 'Anotar as suas datas, o fluxo ou o que sente ajuda a conhecer os seus hábitos, mês após mês.',
    s5Body: 'O primeiro dia do período, a sua duração, o fluxo, a dor, o humor, a energia ou o corrimento vaginal são aspetos que pode anotar ao longo do tempo. O objetivo não é comparar o seu ciclo com o de outra pessoa, mas reconhecer melhor o que é habitual para si e o que difere disso.',
    s6Body1: 'É perfeitamente normal ter dúvidas sobre o seu ciclo. Procurar aconselhamento médico pode ser útil em certas situações, por exemplo:',
    whenToAsk: [
      'Alterações importantes que persistem ao longo de vários ciclos',
      'Dor que a impede de realizar as suas atividades habituais',
      'Períodos muito abundantes',
      'Uma ausência prolongada de períodos',
      'Hemorragias invulgares',
      'Qualquer sintoma persistente que a preocupe',
    ],
    s6Body2: 'Falar com um profissional de saúde pode ajudar a tranquilizá-la ou, se necessário, a obter o acompanhamento adequado — nunca é, por si só, motivo de preocupação.',
    tipText: 'Um ciclo não precisa de ser perfeitamente regular para ser normal. Conhecer o seu ritmo habitual é muitas vezes mais útil do que procurar uma duração ideal.',
    finalBody: 'O seu ciclo menstrual é um de muitos indicadores da sua saúde. Acompanhá-lo com regularidade pode ajudá-la a compreender melhor o seu corpo e, com o tempo, a detetar alterações que merecem uma atenção particular.',
    shareMessage: 'O seu ciclo, um excelente indicador de saúde — AWA',
  },
  bn: {
    badge: 'চক্র ও মাসিক',
    title: 'আপনার চক্র, স্বাস্থ্যের\nএকটি চমৎকার সূচক',
    metaDuration: 'পড়তে 7 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'নতুনদের জন্য',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'চক্রকে কেন কখনো কখনো “পঞ্চম জীবনচিহ্ন” বলা হয়।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'আপনার চক্র: আপনার শরীরের প্রতিফলন',
      '“স্বাভাবিক” চক্র কী?',
      'যেসব পরিবর্তন খেয়াল রাখবেন',
      'এই পরিবর্তনগুলো কী ইঙ্গিত দিতে পারে?',
      'নিজেকে আরও ভালো চিনতে চক্র ট্র্যাক করা',
      'কখন পরামর্শ নেবেন?',
      'জেনে রাখা ভালো',
    ],
    observeLabels: [
      'চক্রের দৈর্ঘ্য',
      'মাসিকের সময়কাল',
      'মাসিকের রক্তক্ষরণের পরিমাণ',
      'ব্যথা',
      'যোনিপথের স্রাব',
      'মেজাজ',
      'শক্তি / ক্লান্তি',
      'অন্যান্য বারবার দেখা দেওয়া উপসর্গ',
    ],
    factorLabels: [
      'মানসিক চাপ',
      'ঘুমের অভাব',
      'ওজনের উল্লেখযোগ্য পরিবর্তন',
      'অত্যন্ত তীব্র শারীরিক কার্যকলাপ',
      'হরমোনের পরিবর্তন',
      'জন্মনিয়ন্ত্রণ',
      'কিছু চিকিৎসাগত অবস্থা',
    ],
    s1Body1: 'মাসিক চক্র মাস জুড়ে শরীরের হরমোনজনিত কার্যকলাপ দ্বারা প্রভাবিত হয়। এটি লক্ষ করতে শিখলে সবকিছু খুঁটিয়ে বিশ্লেষণ না করেও আপনার শরীর কীভাবে কাজ করে তা আরও ভালোভাবে বুঝতে পারবেন।',
    s1Body2: 'সবচেয়ে কাজের যে বিষয়গুলো লক্ষ করবেন তা হলো:',
    s2Body1: 'একটিমাত্র নিখুঁত চক্র বলে কিছু নেই: প্রতিটি শরীরের নিজস্ব ছন্দ আছে এবং সেই ছন্দ মাসে মাসে সামান্য বদলাতেও পারে। চক্র সাধারণত নিয়মিত ধরা হয় যখন তা 21 থেকে 35 দিনের মধ্যে হয়, আর মাসিক বেশিরভাগ ক্ষেত্রে 3 থেকে 7 দিন স্থায়ী হয়।',
    s2Body2: 'এই সংখ্যাগুলো গড়: সামান্য তারতম্য সম্পূর্ণ স্বাভাবিক, বিশেষ করে বয়ঃসন্ধির পর, সন্তান জন্ম দেওয়ার পর বা মেনোপজ ঘনিয়ে এলে।',
    s3Body1: 'কিছু পরিবর্তন একটু বেশি নজরে রাখা উচিত, যেমন:',
    changesToWatch: [
      'চক্রের নিয়মিততায় স্পষ্ট পরিবর্তন',
      'স্বাভাবিকের চেয়ে উল্লেখযোগ্যভাবে বেশি রক্তক্ষরণসহ মাসিক',
      'অস্বাভাবিক তীব্র বা দীর্ঘস্থায়ী ব্যথা',
      'দীর্ঘ সময় মাসিক না হওয়া',
      'দুই মাসিকের মাঝে রক্তপাত',
      'একাধিক চক্র জুড়ে পুনরাবৃত্ত হওয়া উল্লেখযোগ্য পরিবর্তন',
    ],
    s3Body2: 'একটিমাত্র বিচ্ছিন্ন অস্বাভাবিক চক্র মানেই স্বাস্থ্য সমস্যা নয়: শরীর বিভিন্ন কারণে সাময়িকভাবে প্রতিক্রিয়া দেখাতে পারে।',
    s4Body1: 'এই পরিবর্তনগুলো কখনো কখনো কয়েকটি কারণের সঙ্গে যুক্ত হতে পারে, এবং তা সবসময় সমস্যা হয় না:',
    s4Body2: 'এগুলো অন্যান্য সম্ভাব্য ব্যাখ্যার মধ্যে কয়েকটি মাত্র: এগুলো কখনোই স্বাস্থ্যসেবা পেশাজীবীর পরামর্শের বিকল্প নয়।',
    s5VisualTitle: 'নিজের ছন্দ লক্ষ করা',
    s5VisualText: 'আপনার তারিখ, রক্তক্ষরণ বা আপনি কেমন বোধ করছেন তা লিখে রাখলে মাসের পর মাস নিজের অভ্যাস চিনতে সাহায্য হয়।',
    s5Body: 'মাসিকের প্রথম দিন, এর সময়কাল, রক্তক্ষরণের পরিমাণ, ব্যথা, মেজাজ, শক্তি বা যোনিপথের স্রাব, এসবই আপনি সময়ের সঙ্গে লিখে রাখতে পারেন। লক্ষ্য আপনার চক্রকে অন্য কারও চক্রের সঙ্গে তুলনা করা নয়, বরং আপনার জন্য কোনটি স্বাভাবিক এবং কোনটি তার থেকে আলাদা, তা ভালোভাবে চেনা।',
    s6Body1: 'আপনার চক্র নিয়ে প্রশ্ন থাকা সম্পূর্ণ স্বাভাবিক। কিছু পরিস্থিতিতে চিকিৎসা পরামর্শ নেওয়া সহায়ক হতে পারে, উদাহরণস্বরূপ:',
    whenToAsk: [
      'একাধিক চক্র জুড়ে থেকে যাওয়া উল্লেখযোগ্য পরিবর্তন',
      'ব্যথা যা আপনাকে স্বাভাবিক কাজকর্ম থেকে বিরত রাখে',
      'অত্যন্ত বেশি রক্তক্ষরণসহ মাসিক',
      'দীর্ঘ সময় মাসিক না হওয়া',
      'অস্বাভাবিক রক্তপাত',
      'যেকোনো দীর্ঘস্থায়ী উপসর্গ যা আপনাকে চিন্তিত করে',
    ],
    s6Body2: 'স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বললে আপনি নিশ্চিন্ত হতে পারেন অথবা প্রয়োজনে সঠিক সহায়তা পেতে পারেন, এটি নিজে কখনোই উদ্বেগের কারণ নয়।',
    tipText: 'স্বাভাবিক হতে একটি চক্রকে নিখুঁতভাবে নিয়মিত হতে হয় না। আদর্শ দৈর্ঘ্য খোঁজার চেয়ে নিজের স্বাভাবিক ছন্দ জানা প্রায়ই বেশি কাজে আসে।',
    finalBody: 'আপনার মাসিক চক্র আপনার স্বাস্থ্যের অনেক সূচকের একটি। নিয়মিত এটি ট্র্যাক করলে আপনি নিজের শরীরকে আরও ভালোভাবে বুঝতে পারবেন এবং সময়ের সঙ্গে এমন পরিবর্তন লক্ষ করতে পারবেন যা বিশেষ মনোযোগের দাবি রাখে।',
    shareMessage: 'আপনার চক্র, স্বাস্থ্যের একটি চমৎকার সূচক — AWA',
  },
  da: {
    badge: 'CYKLUS OG MENSTRUATION',
    title: 'Din cyklus: et\nværdifuldt sundhedstegn',
    metaDuration: '7 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvorfor din menstruationscyklus nogle gange kaldes det "femte vitale tegn".',
    contentsTitle: 'I denne artikel',
    topics: [
      'Din cyklus: et spejl af din krop',
      'Hvad er en "normal" cyklus?',
      'Forandringer du bør følge med i',
      'Hvad disse forandringer kan indikere',
      'Registrer din cyklus for at lære dig selv bedre at kende',
      'Hvornår bør du søge rådgivning?',
      'Godt at vide',
    ],
    observeLabels: [
      'Cykluslængde',
      'Menstruationens varighed',
      'Menstruationsblødningens mængde',
      'Smerter',
      'Vaginal udflåd',
      'Humør',
      'Energi / træthed',
      'Andre tilbagevendende symptomer',
    ],
    factorLabels: [
      'Stress',
      'Søvnmangel',
      'Betydelig vægtsændring',
      'Meget intens fysisk aktivitet',
      'Hormonelle forandringer',
      'Prævention',
      'Visse medicinske tilstande',
    ],
    s1Body1: 'Din menstruationscyklus er påvirket af kroppens hormonelle aktivitet i løbet af måneden. At lære at observere den hjælper dig med at forstå, hvordan din krop fungerer, uden at du behøver at analysere alt ned til mindste detalje.',
    s1Body2: 'Det mest nyttige at observere er:',
    s2Body1: 'Der er ikke én perfekt cyklus: enhver krop har sin egen rytme, og den kan variere lidt fra måned til måned. En cyklus anses normalt for regelmæssig, når den varer 21 til 35 dage, og menstruationen varer oftest 3 til 7 dage.',
    s2Body2: 'Disse tal er gennemsnit: mindre variationer er helt normale, særligt efter puberteten, efter en fødsel eller når menopausen nærmer sig.',
    s3Body1: 'Visse forandringer fortjener lidt ekstra opmærksomhed, såsom:',
    changesToWatch: [
      'Tydelig ændring i cyklussens regelmæssighed',
      'Menstruation med markant kraftigere blødning end normalt',
      'Usædvanligt stærke eller langvarige smerter',
      'Udeblivende menstruation over lang tid',
      'Blødning mellem menstruationer',
      'Markante forandringer der gentager sig over flere cyklusser',
    ],
    s3Body2: 'En enkelt atypisk cyklus er ikke nødvendigvis et tegn på et sundhedsproblem: kroppen kan reagere midlertidigt på forskellige årsager.',
    s4Body1: 'Disse forandringer er sommetider forbundet med visse faktorer, og det er ikke altid et problem:',
    s4Body2: 'Dette er blot nogle af de mulige forklaringer: de erstatter aldrig råd fra en sundhedsfaglig person.',
    s5VisualTitle: 'Observer din egen rytme',
    s5VisualText: 'At notere dine datoer, din blødning eller hvordan du har det hjælper dig med at genkende dine egne mønstre over månederne.',
    s5Body: 'Du kan med tiden notere den første dag af din menstruation, dens varighed, blødningsmængde, smerter, humør, energi eller vaginal udflåd. Målet er ikke at sammenligne din cyklus med andres, men bedre at kende, hvad der er normalt for dig og hvad der afviger fra det.',
    s6Body1: 'Det er helt normalt at have spørgsmål om sin cyklus. I visse situationer kan det være nyttigt at søge medicinsk rådgivning, for eksempel:',
    whenToAsk: [
      'Markante forandringer der vedvarer over flere cyklusser',
      'Smerter der hindrer dig i at fungere normalt',
      'Menstruation med meget kraftig blødning',
      'Udeblivende menstruation over lang tid',
      'Atypisk blødning',
      'Ethvert vedvarende symptom der bekymrer dig',
    ],
    s6Body2: 'At tale med en sundhedsfaglig person kan enten berolige dig eller hjælpe dig med at få den rette støtte om nødvendigt — det er aldrig en grund til bekymring i sig selv.',
    tipText: 'En cyklus behøver ikke at være perfekt regelmæssig for at være normal. At kende sin egen normale rytme er ofte mere nyttigt end at lede efter en ideel længde.',
    finalBody: 'Din menstruationscyklus er én af mange indikatorer for dit helbred. At registrere den regelmæssigt hjælper dig med at forstå din krop bedre og over tid bemærke forandringer, der fortjener særlig opmærksomhed.',
    shareMessage: 'Din cyklus: et værdifuldt sundhedstegn — AWA',
  },
  sv: {
    badge: 'CYKLUS OG MENSTRUATION',
    title: 'Din cyklus: et\nvärdifuldt halsastegn',
    metaDuration: '7 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvorfor din menstruationscyklus nogle gange kaldes det "femte vitale tegn".',
    contentsTitle: 'I denne artikel',
    topics: [
      'Din cyklus: et spejl av din krop',
      'Hvad ar en "normal" cyklus?',
      'Forandringer du bör fölge med i',
      'Hvad disse forandringer kan indikere',
      'Registrer din cyklus for att läre dig selv bedre at kende',
      'Hvornår bör du söge rådgivning?',
      'Godt at vide',
    ],
    observeLabels: [
      'Cykluslängde',
      'Menstruationens varighed',
      'Menstruationsblödningens mängde',
      'Smerter',
      'Vaginal udflåd',
      'Humör',
      'Energi / träthed',
      'Andre tilbagevendende symtom',
    ],
    factorLabels: [
      'Stress',
      'Sövnmangel',
      'Betydelig vägtsändring',
      'Meget intens fysisk aktivitet',
      'Hormonelle forandringer',
      'Prävention',
      'Visse medicinske tilstande',
    ],
    s1Body1: 'Din menstruationscyklus ar påvirket av kroppens hormonelle aktivitet i löbet av måneden. At läre at observere den hjälper dig med at forstå, hvordan din krop fungerer, uden at du behöver at analysere alt ned till mindste detalje.',
    s1Body2: 'Det mest nyttige at observere er:',
    s2Body1: 'Der ar inte én perfekt cyklus: enhver krop har sin egen rytme, och den kan variere lite fran måned till måned. En cyklus anses normalt for regelmässig, når den varer 21 till 35 dagar, och menstruationen varer oftest 3 till 7 dagar.',
    s2Body2: 'Disse tal ar gennemsnit: mindre variationer ar helt normale, särligt efter puberteten, efter en födsel eller når menopausen närmer sig.',
    s3Body1: 'Visse forandringer fortjener lite ekstra opmärksomhed, såsom:',
    changesToWatch: [
      'Tydelig ändring i cyklussens regelmässighed',
      'Menstruation med markant kraftigere blödning end normalt',
      'Usädvanligt stärke eller langvarige smerter',
      'Udeblivende menstruation over lang tid',
      'Blödning mellem menstruationer',
      'Markante forandringer der gentager sig over flere cyklusser',
    ],
    s3Body2: 'En enkelt atypisk cyklus ar inte nödvendigvis et tegn på et halsasproblem: kroppen kan reagere midlertidigt på forskellige årsager.',
    s4Body1: 'Disse forandringer ar sommetider forbundet med visse faktorer, och det ar inte alltid et problem:',
    s4Body2: 'Dette ar blot nogle av de mulige forklaringer: de erstatter aldrig råd fran en halsasfaglig person.',
    s5VisualTitle: 'Observer din egen rytme',
    s5VisualText: 'At notere dina datoer, din blödning eller hvordan du har det hjälper dig med at genkende dina egne mönstre over månederne.',
    s5Body: 'Du kan med tiden notere den förste dag av din menstruation, dens varighed, blödningsmängde, smerter, humör, energi eller vaginal udflåd. Målet ar inte at sammenligne din cyklus med andres, men bedre at kende, hvad der ar normalt for dig och hvad der afviger fran det.',
    s6Body1: 'Det ar helt normalt at have spörgsmål om sin cyklus. I visse situationer kan det väre nyttigt at söge medicinsk rådgivning, for eksempel:',
    whenToAsk: [
      'Markante forandringer der vedvarer over flere cyklusser',
      'Smerter der hindrer dig i at fungere normalt',
      'Menstruation med mycket kraftig blödning',
      'Udeblivende menstruation over lang tid',
      'Atypisk blödning',
      'Ethvert vedvarende symptom der bekymrer dig',
    ],
    s6Body2: 'At tale med en halsasfaglig person kan enten berolige dig eller hjälpe dig med at få den rette stötte om nödvendigt — det ar aldrig en grund till bekymring i sig selv.',
    tipText: 'En cyklus behöver inte at väre perfekt regelmässig for att väre normal. At kende sin egen normale rytme ar ofta mere nyttigt end at lede efter en ideel längde.',
    finalBody: 'Din menstruationscyklus ar én av mange indikatorer for ditt helbred. At registrere den regelmässigt hjälper dig med at forstå din krop bedre och over tid bemärke forandringer, der fortjener särlig opmärksomhed.',
    shareMessage: 'Din cyklus: et värdifuldt halsastegn — AWA',
  },
  nb: {
    badge: 'SYKLUS OG MENS',
    title: 'Syklusen din, en utmerket\nhelseindikator',
    metaDuration: '7 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvorfor syklusen noen ganger kalles det «femte vitale tegn».',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Syklusen din: et speilbilde av kroppen din',
      'Hva er en «normal» syklus?',
      'Endringer å være oppmerksom på',
      'Hva kan disse endringene avsløre?',
      'Følge syklusen din for å kjenne deg selv bedre',
      'Når bør du søke råd?',
      'Godt å vite',
    ],
    observeLabels: [
      'Sykluslengde',
      'Menstruasjonens varighet',
      'Menstruasjonsblødning',
      'Smerte',
      'Vaginal utflod',
      'Humør',
      'Energi / tretthet',
      'Andre tilbakevendende symptomer',
    ],
    factorLabels: [
      'Stress',
      'Søvnmangel',
      'Betydelige vektendringer',
      'Svært intens fysisk aktivitet',
      'Hormonelle endringer',
      'Prevensjon',
      'Visse medisinske tilstander',
    ],
    s1Body1:
      'Menstruasjonssyklusen påvirkes av kroppens hormonelle aktivitet gjennom måneden. Å lære seg å observere den kan hjelpe deg å forstå bedre hvordan kroppen din fungerer, uten at du trenger å analysere alt i detalj.',
    s1Body2: 'Her er det som er mest nyttig å legge merke til:',
    s2Body1:
      'Det finnes ingen enkelt perfekt syklus: hver kropp har sin egen rytme, og den rytmen kan også variere litt fra måned til måned. En syklus regnes vanligvis som regelmessig når den varer mellom 21 og 35 dager, og menstruasjonen varer oftest 3 til 7 dager.',
    s2Body2:
      'Disse tallene er gjennomsnitt: små variasjoner er helt normale, særlig etter puberteten, etter fødsel eller når menopausen nærmer seg.',
    s3Body1:
      'Noen endringer er verdt å følge litt nøyere med på, for eksempel:',
    changesToWatch: [
      'En tydelig endring i syklusens regelmessighet',
      'Mens som er merkbart kraftigere enn vanlig',
      'Uvanlig sterke eller vedvarende smerter',
      'Lengre fravær av mens',
      'Blødning mellom menstruasjonene',
      'En betydelig endring som gjentar seg over flere sykluser',
    ],
    s3Body2:
      'En enkelt, isolert uvanlig syklus betyr ikke automatisk et helseproblem: kroppen kan reagere midlertidig på mange ulike faktorer.',
    s4Body1:
      'Disse endringene kan noen ganger henge sammen med flere faktorer, uten nødvendigvis å være et problem:',
    s4Body2:
      'Dette er bare noen mulige forklaringer blant andre: de erstatter aldri rådene fra helsepersonell.',
    s5VisualTitle: 'Observere din egen rytme',
    s5VisualText:
      'Å notere datoer, blødning eller hvordan du har det, hjelper deg å bli kjent med vanene dine, måned etter måned.',
    s5Body:
      'Første dag av mensen, varigheten, blødningen, smerten, humøret, energien eller den vaginale utfloden er alt du kan notere over tid. Målet er ikke å sammenligne syklusen din med en annens, men å bedre kjenne igjen hva som er vanlig for deg, og hva som avviker fra det.',
    s6Body1:
      'Det er helt normalt å ha spørsmål om syklusen sin. Å søke medisinsk råd kan være nyttig i visse situasjoner, for eksempel:',
    whenToAsk: [
      'Betydelige endringer som vedvarer over flere sykluser',
      'Smerter som hindrer deg i vanlige aktiviteter',
      'Svært kraftig mens',
      'Lengre fravær av mens',
      'Uvanlig blødning',
      'Ethvert vedvarende symptom som bekymrer deg',
    ],
    s6Body2:
      'Å snakke med helsepersonell kan hjelpe deg å føle deg trygg eller, om nødvendig, å få riktig støtte – det er aldri i seg selv en grunn til bekymring.',
    tipText:
      'En syklus trenger ikke være perfekt regelmessig for å være normal. Å kjenne din egen vanlige rytme er ofte mer nyttig enn å lete etter en ideell lengde.',
    finalBody:
      'Menstruasjonssyklusen din er en av mange indikatorer på helsen din. Å følge den jevnlig kan hjelpe deg å forstå kroppen din bedre og, over tid, legge merke til endringer som fortjener særlig oppmerksomhet.',
    shareMessage: 'Syklusen din, en utmerket helseindikator – AWA',
  },
  pl: {
    badge: 'CYKL I MIESIĄCZKI',
    title: 'Twój cykl, doskonały\nwskaźnik zdrowia',
    metaDuration: '7 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Dlaczego cykl bywa nazywany „piątym parametrem życiowym”.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Twój cykl: odbicie Twojego ciała',
      'Czym jest „normalny” cykl?',
      'Zmiany, na które warto zwracać uwagę',
      'Co mogą oznaczać te zmiany?',
      'Śledzenie cyklu, by lepiej poznać siebie',
      'Kiedy zasięgnąć porady?',
      'Warto wiedzieć',
    ],
    observeLabels: [
      'Długość cyklu',
      'Długość miesiączki',
      'Obfitość krwawienia',
      'Ból',
      'Upławy',
      'Nastrój',
      'Energia / zmęczenie',
      'Inne nawracające objawy',
    ],
    factorLabels: [
      'Stres',
      'Brak snu',
      'Znaczne zmiany wagi',
      'Bardzo intensywna aktywność fizyczna',
      'Zmiany hormonalne',
      'Antykoncepcja',
      'Niektóre schorzenia',
    ],
    s1Body1:
      'Na cykl menstruacyjny wpływa aktywność hormonalna organizmu w ciągu całego miesiąca. Nauka jego obserwowania może pomóc lepiej zrozumieć, jak działa Twoje ciało, bez potrzeby analizowania wszystkiego w szczegółach.',
    s1Body2: 'Oto najbardziej przydatne rzeczy, na które warto zwracać uwagę:',
    s2Body1:
      'Nie ma jednego idealnego cyklu: każde ciało ma własny rytm, który może się też nieznacznie zmieniać z miesiąca na miesiąc. Cykl uznaje się zwykle za regularny, gdy trwa od 21 do 35 dni, a miesiączki najczęściej trwają od 3 do 7 dni.',
    s2Body2:
      'Te liczby to średnie: niewielkie różnice pozostają zupełnie normalne, zwłaszcza po okresie dojrzewania, po porodzie lub w miarę zbliżania się menopauzy.',
    s3Body1:
      'Niektóre zmiany warto obserwować nieco uważniej, takie jak:',
    changesToWatch: [
      'Wyraźna zmiana regularności cyklu',
      'Miesiączki wyraźnie obfitsze niż zwykle',
      'Nietypowo silny lub uporczywy ból',
      'Długotrwały brak miesiączek',
      'Krwawienie między miesiączkami',
      'Znacząca zmiana, która powtarza się przez kilka cykli',
    ],
    s3Body2:
      'Pojedynczy, odosobniony nietypowy cykl nie oznacza automatycznie problemu zdrowotnego: organizm może przejściowo reagować na wiele różnych czynników.',
    s4Body1:
      'Te zmiany mogą być czasem powiązane z kilkoma czynnikami, niekoniecznie będąc problemem:',
    s4Body2:
      'To tylko niektóre możliwe wyjaśnienia spośród innych: nigdy nie zastępują porady specjalisty.',
    s5VisualTitle: 'Obserwowanie własnego rytmu',
    s5VisualText:
      'Zapisywanie dat, obfitości krwawienia lub samopoczucia pomaga poznać swoje przyzwyczajenia, miesiąc po miesiącu.',
    s5Body:
      'Pierwszy dzień miesiączki, jej długość, obfitość, ból, nastrój, energia czy upławy to rzeczy, które możesz zapisywać w czasie. Celem nie jest porównywanie swojego cyklu z cyklem innej osoby, lecz lepsze rozpoznawanie tego, co jest dla Ciebie zwykłe, a co się od tego różni.',
    s6Body1:
      'To zupełnie normalne, że masz pytania dotyczące swojego cyklu. Porada medyczna może być pomocna w niektórych sytuacjach, na przykład:',
    whenToAsk: [
      'Znaczące zmiany utrzymujące się przez kilka cykli',
      'Ból, który uniemożliwia Ci zwykłe zajęcia',
      'Bardzo obfite miesiączki',
      'Długotrwały brak miesiączek',
      'Nietypowe krwawienie',
      'Każdy uporczywy objaw, który Cię niepokoi',
    ],
    s6Body2:
      'Rozmowa ze specjalistą może pomóc uspokoić Twoje obawy lub, w razie potrzeby, zapewnić odpowiednie wsparcie — samo w sobie nigdy nie jest powodem do niepokoju.',
    tipText:
      'Cykl nie musi być idealnie regularny, by był prawidłowy. Znajomość własnego zwykłego rytmu jest często bardziej pomocna niż szukanie idealnej długości.',
    finalBody:
      'Twój cykl menstruacyjny to jeden z wielu wskaźników Twojego zdrowia. Regularne jego śledzenie może pomóc lepiej zrozumieć własne ciało i z czasem zauważać zmiany, które zasługują na szczególną uwagę.',
    shareMessage: 'Twój cykl, doskonały wskaźnik zdrowia — AWA',
  },
  uk: {
    badge: 'ЦИКЛ І МЕНСТРУАЦІЇ',
    title: 'Ваш цикл — чудовий\nпоказник здоров’я',
    metaDuration: '7 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Чому цикл іноді називають «п’ятим життєвим показником».',
    contentsTitle: 'У цій статті',
    topics: [
      'Ваш цикл: відображення вашого тіла',
      'Що таке «нормальний» цикл?',
      'Зміни, на які варто звертати увагу',
      'Про що можуть свідчити ці зміни?',
      'Відстеження циклу, щоб краще пізнати себе',
      'Коли звертатися за порадою?',
      'Варто знати',
    ],
    observeLabels: [
      'Тривалість циклу',
      'Тривалість менструації',
      'Менструальні виділення',
      'Біль',
      'Вагінальні виділення',
      'Настрій',
      'Енергія / втома',
      'Інші повторювані симптоми',
    ],
    factorLabels: [
      'Стрес',
      'Брак сну',
      'Значні зміни ваги',
      'Дуже інтенсивна фізична активність',
      'Гормональні зміни',
      'Контрацепція',
      'Певні захворювання',
    ],
    s1Body1:
      'На менструальний цикл впливає гормональна активність організму протягом місяця. Навчившись його спостерігати, ви можете краще зрозуміти, як працює ваше тіло, без потреби аналізувати все в подробицях.',
    s1Body2: 'Ось найкорисніше, на що варто звертати увагу:',
    s2Body1:
      'Ідеального циклу не існує: кожне тіло має власний ритм, який також може трохи змінюватися від місяця до місяця. Цикл зазвичай вважають регулярним, коли він триває від 21 до 35 днів, а менструації найчастіше тривають 3–7 днів.',
    s2Body2:
      'Ці цифри — середні значення: незначні відхилення залишаються цілком нормальними, особливо після статевого дозрівання, після пологів чи з наближенням менопаузи.',
    s3Body1:
      'За деякими змінами варто спостерігати уважніше, наприклад:',
    changesToWatch: [
      'Виразна зміна регулярності циклу',
      'Менструації помітно рясніші, ніж зазвичай',
      'Незвично сильний або стійкий біль',
      'Тривала відсутність менструацій',
      'Кровотеча між менструаціями',
      'Значна зміна, що повторюється протягом кількох циклів',
    ],
    s3Body2:
      'Один окремий нетиповий цикл автоматично не означає проблеми зі здоров’ям: організм може тимчасово реагувати на багато різних чинників.',
    s4Body1:
      'Ці зміни іноді можуть бути пов’язані з кількома чинниками, не обов’язково будучи проблемою:',
    s4Body2:
      'Це лише деякі з можливих пояснень серед інших: вони ніколи не замінюють поради медичного фахівця.',
    s5VisualTitle: 'Спостереження за власним ритмом',
    s5VisualText:
      'Запис дат, виділень чи самопочуття допомагає пізнати свої звички місяць за місяцем.',
    s5Body:
      'Перший день менструації, її тривалість, виділення, біль, настрій, енергія чи вагінальні виділення — усе це ви можете записувати з часом. Мета не в порівнянні свого циклу з чужим, а в кращому розпізнаванні того, що є звичним для вас, а що від цього відрізняється.',
    s6Body1:
      'Цілком нормально мати запитання щодо свого циклу. Медична порада може бути корисною в певних ситуаціях, наприклад:',
    whenToAsk: [
      'Значні зміни, що зберігаються протягом кількох циклів',
      'Біль, що заважає вашим звичним справам',
      'Дуже рясні менструації',
      'Тривала відсутність менструацій',
      'Незвична кровотеча',
      'Будь-який стійкий симптом, що вас турбує',
    ],
    s6Body2:
      'Розмова з медичним фахівцем може допомогти заспокоїтися або, за потреби, отримати належну підтримку — вона сама по собі ніколи не є приводом для занепокоєння.',
    tipText:
      'Цикл не обов’язково має бути ідеально регулярним, щоб бути нормальним. Знання власного звичного ритму часто корисніше, ніж пошук ідеальної тривалості.',
    finalBody:
      'Ваш менструальний цикл — один із багатьох показників вашого здоров’я. Його регулярне відстеження може допомогти краще зрозуміти своє тіло й з часом помічати зміни, що заслуговують на особливу увагу.',
    shareMessage: 'Ваш цикл — чудовий показник здоров’я — AWA',
  },
  cs: {
    badge: 'CYKLUS A MENSTRUACE',
    title: 'Váš cyklus, vynikající\nukazatel zdraví',
    metaDuration: '7 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Proč se cyklu někdy říká „pátá životní funkce“.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Váš cyklus: odraz vašeho těla',
      'Co je „normální“ cyklus?',
      'Změny, kterých si všímat',
      'Co mohou tyto změny odhalit?',
      'Sledování cyklu pro lepší poznání sebe sama',
      'Kdy vyhledat radu?',
      'Stojí za to vědět',
    ],
    observeLabels: [
      'Délka cyklu',
      'Délka menstruace',
      'Menstruační krvácení',
      'Bolest',
      'Poševní výtok',
      'Nálada',
      'Energie / únava',
      'Další opakující se příznaky',
    ],
    factorLabels: [
      'Stres',
      'Nedostatek spánku',
      'Výrazné změny váhy',
      'Velmi intenzivní fyzická aktivita',
      'Hormonální změny',
      'Antikoncepce',
      'Některá zdravotní onemocnění',
    ],
    s1Body1:
      'Menstruační cyklus je ovlivňován hormonální aktivitou těla v průběhu celého měsíce. Naučit se ho pozorovat vám může pomoci lépe pochopit, jak vaše tělo funguje, aniž byste museli vše podrobně analyzovat.',
    s1Body2: 'Zde jsou nejužitečnější věci, kterých si všímat:',
    s2Body1:
      'Neexistuje jediný dokonalý cyklus: každé tělo má svůj vlastní rytmus a ten se může z měsíce na měsíc mírně lišit. Cyklus se obvykle považuje za pravidelný, pokud trvá 21 až 35 dní, a menstruace nejčastěji trvá 3 až 7 dní.',
    s2Body2:
      'Tyto hodnoty jsou průměry: mírné odchylky zůstávají zcela normální, zejména po pubertě, po porodu nebo s blížící se menopauzou.',
    s3Body1:
      'Na některé změny stojí za to dávat o něco větší pozor, například:',
    changesToWatch: [
      'Výrazná změna pravidelnosti cyklu',
      'Menstruace znatelně silnější než obvykle',
      'Neobvykle silná nebo přetrvávající bolest',
      'Dlouhodobá nepřítomnost menstruace',
      'Krvácení mezi menstruacemi',
      'Výrazná změna, která se opakuje během několika cyklů',
    ],
    s3Body2:
      'Jediný, ojedinělý neobvyklý cyklus automaticky neznamená zdravotní problém: tělo může dočasně reagovat na mnoho různých faktorů.',
    s4Body1:
      'Tyto změny mohou být někdy spojeny s několika faktory, aniž by nutně šlo o problém:',
    s4Body2:
      'Jde jen o některá možná vysvětlení mezi jinými: nikdy nenahrazují radu zdravotnického pracovníka.',
    s5VisualTitle: 'Pozorování vlastního rytmu',
    s5VisualText:
      'Zapisování dat, krvácení nebo toho, jak se cítíte, vám pomáhá poznávat vaše návyky, měsíc po měsíci.',
    s5Body:
      'První den menstruace, její délku, množství krvácení, bolest, náladu, energii nebo poševní výtok si můžete zapisovat v průběhu času. Cílem není porovnávat svůj cyklus s cyklem jiné ženy, ale lépe rozpoznat, co je pro vás obvyklé a co se od toho liší.',
    s6Body1:
      'Je zcela normální mít ohledně cyklu otázky. Vyhledat lékařskou radu může být užitečné v určitých situacích, například:',
    whenToAsk: [
      'Výrazné změny, které přetrvávají během několika cyklů',
      'Bolest, která vám brání v obvyklých činnostech',
      'Velmi silná menstruace',
      'Dlouhodobá nepřítomnost menstruace',
      'Neobvyklé krvácení',
      'Jakýkoli přetrvávající příznak, který vás znepokojuje',
    ],
    s6Body2:
      'Rozhovor se zdravotnickým pracovníkem vám může pomoci uklidnit se, nebo v případě potřeby získat správnou podporu — sám o sobě nikdy není důvodem k obavám.',
    tipText:
      'Cyklus nemusí být dokonale pravidelný, aby byl normální. Znát vlastní obvyklý rytmus je často užitečnější než hledat ideální délku.',
    finalBody:
      'Váš menstruační cyklus je jedním z mnoha ukazatelů vašeho zdraví. Jeho pravidelné sledování vám může pomoci lépe porozumět svému tělu a s časem si všimnout změn, které si zaslouží zvláštní pozornost.',
    shareMessage: 'Váš cyklus, vynikající ukazatel zdraví — AWA',
  },
  sk: {
    badge: 'CYKLUS A MENŠTRUÁCIA',
    title: 'Váš cyklus, výborný\nukazovateľ zdravia',
    metaDuration: '7 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Prečo sa cyklus niekedy nazýva „piatou vitálnou funkciou“.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Váš cyklus: odraz vášho tela',
      'Čo je „normálny“ cyklus?',
      'Zmeny, ktoré treba sledovať',
      'Čo môžu tieto zmeny odhaliť?',
      'Sledovanie cyklu, aby ste sa lepšie poznali',
      'Kedy hľadať radu?',
      'Stojí za to vedieť',
    ],
    observeLabels: [
      'Dĺžka cyklu',
      'Dĺžka menštruácie',
      'Menštruačné krvácanie',
      'Bolesť',
      'Vaginálny výtok',
      'Nálada',
      'Energia / únava',
      'Iné opakujúce sa príznaky',
    ],
    factorLabels: [
      'Stres',
      'Nedostatok spánku',
      'Výrazné zmeny hmotnosti',
      'Veľmi intenzívna fyzická aktivita',
      'Hormonálne zmeny',
      'Antikoncepcia',
      'Niektoré zdravotné stavy',
    ],
    s1Body1:
      'Menštruačný cyklus je ovplyvnený hormonálnou aktivitou tela počas celého mesiaca. Naučiť sa ho sledovať vám môže pomôcť lepšie pochopiť, ako vaše telo funguje, bez potreby analyzovať všetko do detailov.',
    s1Body2: 'Tu sú najužitočnejšie veci, ktoré si všímať:',
    s2Body1:
      'Neexistuje jediný dokonalý cyklus: každé telo má svoj rytmus, ktorý sa môže mierne meniť aj z mesiaca na mesiac. Cyklus sa vo všeobecnosti považuje za pravidelný, ak trvá 21 až 35 dní, a menštruácia najčastejšie trvá 3 až 7 dní.',
    s2Body2:
      'Tieto čísla sú priemery: mierne odchýlky zostávajú úplne normálne, najmä po puberte, po pôrode alebo s blížiacou sa menopauzou.',
    s3Body1:
      'Niektoré zmeny stojí za to sledovať o niečo pozornejšie, napríklad:',
    changesToWatch: [
      'Výrazná zmena pravidelnosti cyklu',
      'Menštruácia citeľne silnejšia ako zvyčajne',
      'Nezvyčajne silná alebo pretrvávajúca bolesť',
      'Dlhodobé vynechanie menštruácie',
      'Krvácanie medzi menštruáciami',
      'Výrazná zmena, ktorá sa opakuje počas niekoľkých cyklov',
    ],
    s3Body2:
      'Jediný ojedinelý nezvyčajný cyklus automaticky neznamená zdravotný problém: telo môže dočasne reagovať na mnohé rôzne faktory.',
    s4Body1:
      'Tieto zmeny môžu byť niekedy spojené s viacerými faktormi, bez toho, aby to nutne bol problém:',
    s4Body2:
      'Ide len o niektoré z možných vysvetlení: nikdy nenahrádzajú radu zdravotníckeho pracovníka.',
    s5VisualTitle: 'Sledovanie vlastného rytmu',
    s5VisualText:
      'Zapisovanie dátumov, intenzity krvácania alebo pocitov vám pomáha spoznať svoje zvyky, mesiac po mesiaci.',
    s5Body:
      'Prvý deň menštruácie, jej dĺžku, intenzitu krvácania, bolesť, náladu, energiu či vaginálny výtok si môžete zaznamenávať v priebehu času. Cieľom nie je porovnávať svoj cyklus s cyklom niekoho iného, ale lepšie rozpoznať, čo je pre vás obvyklé a čo sa od toho odlišuje.',
    s6Body1:
      'Je úplne normálne mať otázky o svojom cykle. V niektorých situáciách môže byť užitočné vyhľadať lekársku radu, napríklad:',
    whenToAsk: [
      'Výrazné zmeny, ktoré pretrvávajú počas niekoľkých cyklov',
      'Bolesť, ktorá vám bráni v bežných aktivitách',
      'Veľmi silná menštruácia',
      'Dlhodobé vynechanie menštruácie',
      'Nezvyčajné krvácanie',
      'Akýkoľvek pretrvávajúci príznak, ktorý vás znepokojuje',
    ],
    s6Body2:
      'Rozhovor so zdravotníckym pracovníkom vám môže pomôcť upokojiť sa alebo v prípade potreby získať správnu podporu — samo o sebe to nikdy nie je dôvod na obavy.',
    tipText:
      'Cyklus nemusí byť dokonale pravidelný, aby bol normálny. Poznať svoj vlastný obvyklý rytmus je často užitočnejšie než hľadať ideálnu dĺžku.',
    finalBody:
      'Váš menštruačný cyklus je jedným z mnohých ukazovateľov vášho zdravia. Jeho pravidelné sledovanie vám môže pomôcť lepšie pochopiť svoje telo a časom si všimnúť zmeny, ktoré si zaslúžia osobitnú pozornosť.',
    shareMessage: 'Váš cyklus, výborný ukazovateľ zdravia — AWA',
  },
  hu: {
    badge: 'CIKLUS ÉS MENSTRUÁCIÓ',
    title: 'A ciklusod, az egészséged\nkiváló mutatója',
    metaDuration: '7 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Miért nevezik a ciklust néha „ötödik létfontosságú jelnek”.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A ciklusod: a tested tükre',
      'Mi az a „normális” ciklus?',
      'Figyelendő változások',
      'Mit árulhatnak el ezek a változások?',
      'A ciklus követése a jobb önismeretért',
      'Mikor kérj tanácsot?',
      'Érdemes tudni',
    ],
    observeLabels: [
      'A ciklus hossza',
      'A menstruáció hossza',
      'Menstruációs vérzés',
      'Fájdalom',
      'Hüvelyi folyás',
      'Hangulat',
      'Energia / fáradtság',
      'Egyéb visszatérő tünetek',
    ],
    factorLabels: [
      'Stressz',
      'Alváshiány',
      'Jelentős testsúlyváltozások',
      'Nagyon intenzív testmozgás',
      'Hormonális változások',
      'Fogamzásgátlás',
      'Bizonyos egészségügyi állapotok',
    ],
    s1Body1:
      'A menstruációs ciklust a test hormonális működése befolyásolja a hónap során. Ha megtanulod megfigyelni, jobban megértheted, hogyan működik a tested, anélkül, hogy mindent részletesen elemezned kellene.',
    s1Body2: 'Íme a leghasznosabb megfigyelnivalók:',
    s2Body1:
      'Nincs egyetlen tökéletes ciklus: minden testnek megvan a saját ritmusa, amely hónapról hónapra kissé változhat is. A ciklust általában rendszeresnek tekintik, ha 21 és 35 nap közötti, a menstruáció pedig leggyakrabban 3–7 napig tart.',
    s2Body2:
      'Ezek a számok átlagok: a kisebb eltérések teljesen normálisak maradnak, különösen a pubertás után, szülés után vagy a menopauza közeledtével.',
    s3Body1:
      'Egyes változásokat érdemes egy kicsit figyelmesebben követni, például:',
    changesToWatch: [
      'A ciklus rendszerességének kifejezett megváltozása',
      'A szokásosnál érezhetően erősebb menstruáció',
      'Szokatlanul erős vagy tartós fájdalom',
      'A menstruáció hosszan tartó elmaradása',
      'Vérzés a menstruációk között',
      'Jelentős változás, amely több cikluson át ismétlődik',
    ],
    s3Body2:
      'Egyetlen, elszigetelt szokatlan ciklus automatikusan nem jelent egészségügyi problémát: a test átmenetileg számos különböző tényezőre reagálhat.',
    s4Body1:
      'Ezek a változások néha több tényezőhöz kapcsolódhatnak, anélkül, hogy feltétlenül problémát jelentenének:',
    s4Body2:
      'Ezek csupán a lehetséges magyarázatok közül néhány: soha nem helyettesítik az egészségügyi szakember tanácsát.',
    s5VisualTitle: 'A saját ritmusod megfigyelése',
    s5VisualText:
      'A dátumaid, a vérzésed vagy az érzéseid feljegyzése segít megismerni a szokásaidat, hónapról hónapra.',
    s5Body:
      'A menstruáció első napját, hosszát, a vérzést, a fájdalmat, a hangulatot, az energiát vagy a hüvelyi folyást idővel feljegyezheted. A cél nem az, hogy a ciklusodat másokéhoz hasonlítsd, hanem hogy jobban felismerd, mi a szokásos számodra, és mi tér el attól.',
    s6Body1:
      'Teljesen természetes, hogy kérdéseid vannak a ciklusoddal kapcsolatban. Bizonyos helyzetekben hasznos lehet orvosi tanácsot kérni, például:',
    whenToAsk: [
      'Jelentős változások, amelyek több cikluson át fennmaradnak',
      'Fájdalom, amely megakadályoz a szokásos tevékenységekben',
      'Nagyon erős menstruáció',
      'A menstruáció hosszan tartó elmaradása',
      'Szokatlan vérzés',
      'Bármilyen tartós tünet, amely aggaszt',
    ],
    s6Body2:
      'Egy egészségügyi szakemberrel való beszélgetés segíthet megnyugodni, vagy szükség esetén megfelelő támogatáshoz jutni — önmagában soha nem ok az aggodalomra.',
    tipText:
      'A ciklusnak nem kell tökéletesen rendszeresnek lennie ahhoz, hogy normális legyen. A saját szokásos ritmusod ismerete gyakran hasznosabb, mint az ideális hosszúság keresése.',
    finalBody:
      'A menstruációs ciklusod az egészséged számos mutatójának egyike. Rendszeres követése segíthet jobban megérteni a testedet, és idővel észrevenni a különös figyelmet érdemlő változásokat.',
    shareMessage: 'A ciklusod, az egészséged kiváló mutatója — AWA',
  },
  ro: {
    badge: 'CICLU ȘI MENSTRUAȚII',
    title: 'Ciclul tău, un excelent\nindicator al sănătății',
    metaDuration: '7 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'De ce ciclul este uneori numit „al cincilea semn vital”.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ciclul tău: o oglindă a corpului tău',
      'Ce este un ciclu „normal”?',
      'Schimbări de urmărit',
      'Ce pot dezvălui aceste schimbări?',
      'Urmărirea ciclului pentru a te cunoaște mai bine',
      'Când să ceri un sfat?',
      'Bine de știut',
    ],
    observeLabels: [
      'Durata ciclului',
      'Durata menstruației',
      'Fluxul menstrual',
      'Durerea',
      'Secrețiile vaginale',
      'Starea de spirit',
      'Energia / oboseala',
      'Alte simptome recurente',
    ],
    factorLabels: [
      'Stresul',
      'Lipsa somnului',
      'Variații importante de greutate',
      'Activitatea fizică foarte intensă',
      'Schimbările hormonale',
      'Contracepția',
      'Anumite afecțiuni medicale',
    ],
    s1Body1:
      'Ciclul menstrual este influențat de activitatea hormonală a corpului pe parcursul lunii. A învăța să-l observi te poate ajuta să înțelegi mai bine cum funcționează corpul tău, fără a fi nevoie să analizezi totul în detaliu.',
    s1Body2: 'Iată lucrurile cele mai utile de observat:',
    s2Body1:
      'Nu există un singur ciclu perfect: fiecare corp are propriul ritm, iar acest ritm poate varia ușor și de la o lună la alta. Un ciclu este considerat în general regulat atunci când durează între 21 și 35 de zile, iar menstruația durează cel mai adesea între 3 și 7 zile.',
    s2Body2:
      'Aceste cifre sunt medii: ușoarele variații rămân complet normale, mai ales după pubertate, după naștere sau când menopauza se apropie.',
    s3Body1:
      'Unele schimbări merită urmărite ceva mai atent, cum ar fi:',
    changesToWatch: [
      'O schimbare marcată a regularității ciclului',
      'Menstruații vizibil mai abundente decât de obicei',
      'Durere neobișnuit de puternică sau persistentă',
      'Absența prelungită a menstruației',
      'Sângerări între menstruații',
      'O schimbare importantă care se repetă pe parcursul mai multor cicluri',
    ],
    s3Body2:
      'Un singur ciclu neobișnuit, izolat, nu înseamnă automat o problemă de sănătate: corpul poate reacționa temporar la mulți factori diferiți.',
    s4Body1:
      'Aceste schimbări pot fi uneori legate de mai mulți factori, fără a fi neapărat o problemă:',
    s4Body2:
      'Acestea sunt doar câteva explicații posibile printre altele: ele nu înlocuiesc niciodată sfatul unui profesionist din domeniul sănătății.',
    s5VisualTitle: 'Observarea propriului tău ritm',
    s5VisualText:
      'Notarea datelor, a fluxului sau a modului în care te simți te ajută să-ți cunoști obiceiurile, lună după lună.',
    s5Body:
      'Prima zi a menstruației, durata ei, fluxul, durerea, starea de spirit, energia sau secrețiile vaginale sunt toate lucruri pe care le poți nota în timp. Scopul nu este să-ți compari ciclul cu al altcuiva, ci să recunoști mai bine ce este obișnuit pentru tine și ce se abate de la acest lucru.',
    s6Body1:
      'Este complet normal să ai întrebări despre ciclul tău. Un sfat medical poate fi util în anumite situații, de exemplu:',
    whenToAsk: [
      'Schimbări importante care persistă pe parcursul mai multor cicluri',
      'Durere care te împiedică să-ți faci activitățile obișnuite',
      'Menstruații foarte abundente',
      'Absența prelungită a menstruației',
      'Sângerări neobișnuite',
      'Orice simptom persistent care te îngrijorează',
    ],
    s6Body2:
      'Discuția cu un profesionist din domeniul sănătății te poate liniști sau, la nevoie, îți poate aduce sprijinul potrivit — nu este niciodată în sine un motiv de îngrijorare.',
    tipText:
      'Un ciclu nu trebuie să fie perfect regulat pentru a fi normal. Cunoașterea propriului tău ritm obișnuit este adesea mai utilă decât căutarea unei durate ideale.',
    finalBody:
      'Ciclul tău menstrual este unul dintre numeroșii indicatori ai sănătății tale. Urmărirea lui regulată te poate ajuta să-ți înțelegi mai bine corpul și, în timp, să observi schimbări care merită o atenție deosebită.',
    shareMessage: 'Ciclul tău, un excelent indicator al sănătății — AWA',
  },
  bg: {
    badge: 'ЦИКЪЛ И МЕНСТРУАЦИИ',
    title: 'Цикълът ти, отличен\nпоказател за здравето',
    metaDuration: '7 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Защо цикълът понякога се нарича „петият жизнен показател“.',
    contentsTitle: 'В тази статия',
    topics: [
      'Цикълът ти: отражение на тялото ти',
      'Какво е „нормален“ цикъл?',
      'Промени, които да следиш',
      'Какво могат да разкрият тези промени?',
      'Проследяване на цикъла, за да се познаваш по-добре',
      'Кога да потърсиш съвет?',
      'Добре е да знаеш',
    ],
    observeLabels: [
      'Продължителност на цикъла',
      'Продължителност на менструацията',
      'Менструален поток',
      'Болка',
      'Вагинални секрети',
      'Настроение',
      'Енергия / умора',
      'Други повтарящи се симптоми',
    ],
    factorLabels: [
      'Стрес',
      'Липса на сън',
      'Значителни промени в теглото',
      'Много интензивна физическа активност',
      'Хормонални промени',
      'Контрацепция',
      'Някои медицински състояния',
    ],
    s1Body1:
      'Менструалният цикъл се влияе от хормоналната дейност на тялото през месеца. Да се научиш да го наблюдаваш може да ти помогне да разбираш по-добре как работи тялото ти, без да е нужно да анализираш всичко в детайли.',
    s1Body2: 'Ето най-полезните неща, които да забелязваш:',
    s2Body1:
      'Няма един съвършен цикъл: всяко тяло има свой ритъм, а този ритъм може да варира леко и от месец на месец. Цикълът обикновено се смята за редовен, когато продължава между 21 и 35 дни, а менструациите най-често траят от 3 до 7 дни.',
    s2Body2:
      'Тези цифри са средни стойности: леките отклонения остават напълно нормални, особено след пубертета, след раждане или когато менопаузата наближава.',
    s3Body1:
      'Някои промени заслужават малко по-внимателно наблюдение, като например:',
    changesToWatch: [
      'Изразена промяна в редовността на цикъла',
      'Менструации, значително по-обилни от обичайното',
      'Необичайно силна или упорита болка',
      'Продължително отсъствие на менструация',
      'Кървене между менструациите',
      'Значителна промяна, която се повтаря в няколко цикъла',
    ],
    s3Body2:
      'Един-единствен необичаен цикъл не означава автоматично здравословен проблем: тялото може временно да реагира на много различни фактори.',
    s4Body1:
      'Тези промени понякога могат да бъдат свързани с няколко фактора, без непременно да са проблем:',
    s4Body2:
      'Това са само някои възможни обяснения наред с други: те никога не заместват съвета на здравен специалист.',
    s5VisualTitle: 'Наблюдение на собствения ти ритъм',
    s5VisualText:
      'Отбелязването на датите, потока или как се чувстваш ти помага да опознаеш навиците си, месец след месец.',
    s5Body:
      'Първият ден на менструацията, продължителността ѝ, потокът, болката, настроението, енергията или вагиналните секрети са все неща, които можеш да отбелязваш във времето. Целта не е да сравняваш цикъла си с чужд, а да разпознаваш по-добре кое е обичайно за теб и кое се отклонява от него.',
    s6Body1:
      'Напълно нормално е да имаш въпроси за цикъла си. Медицинският съвет може да е полезен в определени ситуации, например:',
    whenToAsk: [
      'Значителни промени, които продължават в няколко цикъла',
      'Болка, която те възпрепятства в обичайните ти дейности',
      'Много обилни менструации',
      'Продължително отсъствие на менструация',
      'Необичайно кървене',
      'Всеки упорит симптом, който те тревожи',
    ],
    s6Body2:
      'Разговорът със здравен специалист може да те успокои или, при нужда, да ти осигури подходяща подкрепа — той никога сам по себе си не е повод за тревога.',
    tipText:
      'Цикълът не е необходимо да е съвършено редовен, за да е нормален. Познаването на собствения ти обичаен ритъм често е по-полезно от търсенето на идеална продължителност.',
    finalBody:
      'Менструалният ти цикъл е един от многото показатели за здравето ти. Редовното му проследяване може да ти помогне да разбираш по-добре тялото си и с времето да забелязваш промени, които заслужават особено внимание.',
    shareMessage: 'Цикълът ти, отличен показател за здравето — AWA',
  },
  sr: {
    badge: 'ЦИКЛУС И МЕНСТРУАЦИЈА',
    title: 'Твој циклус, одличан\nпоказатељ здравља',
    metaDuration: '7 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Зашто се циклус понекад назива „петим витаним знаком“.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Твој циклус: одраз твог тела',
      'Шта је „нормалан“ циклус?',
      'Промене на које треба обратити пажњу',
      'Шта ове промене могу открити?',
      'Праћење циклуса ради бољег упознавања себе',
      'Када потражити савет?',
      'Добро је знати',
    ],
    observeLabels: [
      'Трајање циклуса',
      'Трајање менструације',
      'Менструални проток',
      'Бол',
      'Вагинални исцедак',
      'Расположење',
      'Енергија / умор',
      'Остали понављајући симптоми',
    ],
    factorLabels: [
      'Стрес',
      'Недостатак сна',
      'Значајне промене тежине',
      'Веома интензивна физичка активност',
      'Хормонске промене',
      'Контрацепција',
      'Одређена медицинска стања',
    ],
    s1Body1:
      'На менструални циклус утиче хормонска активност тела током месеца. Учење да га посматраш може ти помоћи да боље разумеш како твоје тело функционише, без потребе да анализираш све до детаља.',
    s1Body2: 'Ево најкориснијих ствари које вреди приметити:',
    s2Body1:
      'Не постоји један савршен циклус: свако тело има свој ритам, а тај ритам може и благо варирати из месеца у месец. Циклус се обично сматра редовним када траје између 21 и 35 дана, а менструација најчешће траје 3 до 7 дана.',
    s2Body2:
      'Ове цифре су просеци: благе варијације остају потпуно нормалне, нарочито после пубертета, после порођаја или како се менопауза приближава.',
    s3Body1:
      'Неке промене вреди пажљивије пратити, као што су:',
    changesToWatch: [
      'Изражена промена редовности циклуса',
      'Менструација приметно обилнија него обично',
      'Необично јак или упоран бол',
      'Продужено одсуство менструације',
      'Крварење између менструација',
      'Значајна промена која се понавља током неколико циклуса',
    ],
    s3Body2:
      'Један изоловани необичан циклус не значи аутоматски здравствени проблем: тело може привремено реаговати на многе различите факторе.',
    s4Body1:
      'Ове промене понекад могу бити повезане са неколико фактора, а да нису нужно проблем:',
    s4Body2:
      'Ово су само нека могућа објашњења међу другима: она никада не замењују савет здравственог радника.',
    s5VisualTitle: 'Посматрање сопственог ритма',
    s5VisualText:
      'Бележење датума, протока или тога како се осећаш помаже ти да упознаш своје навике, месец за месецом.',
    s5Body:
      'Први дан менструације, њено трајање, проток, бол, расположење, енергија или вагинални исцедак све су ствари које можеш бележити током времена. Циљ није да упоређујеш свој циклус са туђим, већ да боље препознаш шта је уобичајено за тебе и шта се од тога разликује.',
    s6Body1:
      'Потпуно је нормално имати питања о свом циклусу. Тражење медицинског савета може бити корисно у одређеним ситуацијама, на пример:',
    whenToAsk: [
      'Значајне промене које трају током неколико циклуса',
      'Бол који те спречава у уобичајеним активностима',
      'Веома обилна менструација',
      'Продужено одсуство менструације',
      'Необично крварење',
      'Сваки упоран симптом који те брине',
    ],
    s6Body2:
      'Разговор са здравственим радником може ти помоћи да се умириш или, по потреби, да добијеш праву подршку — то сам по себи никада није разлог за забринутост.',
    tipText:
      'Циклус не мора бити савршено редован да би био нормалан. Познавање сопственог уобичајеног ритма често је корисније него тражење идеалног трајања.',
    finalBody:
      'Твој менструални циклус је један од многих показатеља твог здравља. Редовно праћење може ти помоћи да боље разумеш своје тело и, током времена, приметиш промене које заслужују посебну пажњу.',
    shareMessage: 'Твој циклус, одличан показатељ здравља — AWA',
  },
  hr: {
    badge: 'CIKLUS I MENSTRUACIJA',
    title: 'Tvoj ciklus, izvrstan\npokazatelj zdravlja',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašto se ciklus ponekad naziva „petim vitalnim znakom“.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Tvoj ciklus: odraz tvog tijela',
      'Što je „normalan“ ciklus?',
      'Promjene na koje treba paziti',
      'Što te promjene mogu otkriti?',
      'Praćenje ciklusa radi boljeg poznavanja sebe',
      'Kada zatražiti savjet?',
      'Dobro je znati',
    ],
    observeLabels: [
      'Duljina ciklusa',
      'Duljina menstruacije',
      'Menstrualni protok',
      'Bol',
      'Vaginalni iscjedak',
      'Raspoloženje',
      'Energija / umor',
      'Ostali ponavljajući simptomi',
    ],
    factorLabels: [
      'Stres',
      'Nedostatak sna',
      'Značajne promjene težine',
      'Vrlo intenzivna tjelesna aktivnost',
      'Hormonske promjene',
      'Kontracepcija',
      'Određena zdravstvena stanja',
    ],
    s1Body1:
      'Na menstrualni ciklus tijekom mjeseca utječe hormonska aktivnost tijela. Učenje promatranja ciklusa može ti pomoći bolje razumjeti kako tvoje tijelo funkcionira, bez potrebe da sve analiziraš do pojedinosti.',
    s1Body2: 'Evo što je najkorisnije primijetiti:',
    s2Body1:
      'Ne postoji jedan savršen ciklus: svako tijelo ima svoj ritam, a taj se ritam može i neznatno razlikovati iz mjeseca u mjesec. Ciklus se općenito smatra pravilnim kad traje između 21 i 35 dana, a menstruacija najčešće traje 3 do 7 dana.',
    s2Body2:
      'Ove su brojke prosjeci: neznatna odstupanja ostaju posve normalna, osobito nakon puberteta, nakon poroda ili u približavanju menopauzi.',
    s3Body1:
      'Neke promjene vrijedi pomnije pratiti, primjerice:',
    changesToWatch: [
      'Izrazita promjena pravilnosti ciklusa',
      'Menstruacija osjetno obilnija nego obično',
      'Neobično jaka ili dugotrajna bol',
      'Dulji izostanak menstruacije',
      'Krvarenje između menstruacija',
      'Znatna promjena koja se ponavlja tijekom nekoliko ciklusa',
    ],
    s3Body2:
      'Jedan izoliran neobičan ciklus automatski ne znači zdravstveni problem: tijelo može privremeno reagirati na mnoge različite čimbenike.',
    s4Body1:
      'Te promjene ponekad mogu biti povezane s nekoliko čimbenika, bez da nužno predstavljaju problem:',
    s4Body2:
      'To su samo neka moguća objašnjenja među ostalima: nikad ne zamjenjuju savjet zdravstvenog djelatnika.',
    s5VisualTitle: 'Promatranje vlastitog ritma',
    s5VisualText:
      'Bilježenje datuma, protoka ili osjećaja pomaže ti upoznati svoje navike, mjesec za mjesecom.',
    s5Body:
      'Prvi dan menstruacije, njezino trajanje, protok, bol, raspoloženje, energija ili vaginalni iscjedak sve su stvari koje možeš bilježiti tijekom vremena. Cilj nije usporediti svoj ciklus s tuđim, nego bolje prepoznati što je uobičajeno za tebe i što se od toga razlikuje.',
    s6Body1:
      'Potpuno je normalno imati pitanja o svom ciklusu. Traženje liječničkog savjeta može biti korisno u određenim situacijama, na primjer:',
    whenToAsk: [
      'Značajne promjene koje traju tijekom nekoliko ciklusa',
      'Bol koja te sprječava u uobičajenim aktivnostima',
      'Vrlo obilne menstruacije',
      'Dulji izostanak menstruacije',
      'Neuobičajeno krvarenje',
      'Svaki dugotrajan simptom koji te brine',
    ],
    s6Body2:
      'Razgovor sa zdravstvenim djelatnikom može ti pomoći smiriti brige ili, ako je potrebno, dobiti pravu podršku — sam po sebi nikad nije razlog za zabrinutost.',
    tipText:
      'Ciklus ne mora biti savršeno pravilan da bi bio normalan. Poznavanje vlastitog uobičajenog ritma često je korisnije od traženja idealne duljine.',
    finalBody:
      'Tvoj menstrualni ciklus jedan je od mnogih pokazatelja tvog zdravlja. Redovito praćenje može ti pomoći bolje razumjeti svoje tijelo i, s vremenom, primijetiti promjene koje zaslužuju posebnu pozornost.',
    shareMessage: 'Tvoj ciklus, izvrstan pokazatelj zdravlja — AWA',
  },
  bs: {
    badge: 'CIKLUS I MENSTRUACIJA',
    title: 'Tvoj ciklus, izvrstan\npokazatelj zdravlja',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašta se ciklus ponekad naziva „petim vitalnim znakom“.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Tvoj ciklus: odraz tvog tijela',
      'Što je „normalan“ ciklus?',
      'Promjene na koje treba paziti',
      'Što te promjene mogu otkriti?',
      'Praćenje ciklusa radi boljeg poznavanja sebe',
      'Kada zatražiti savjet?',
      'Dobro je znati',
    ],
    observeLabels: [
      'Duljina ciklusa',
      'Duljina menstruacije',
      'Menstrualni protok',
      'Bol',
      'Vaginalni iscjedak',
      'Raspoloženje',
      'Energija / umor',
      'Ostali ponavljajući simptomi',
    ],
    factorLabels: [
      'Stres',
      'Nedostatak sna',
      'Značajne promjene težine',
      'Vrlo intenzivna tjelesna aktivnost',
      'Hormonske promjene',
      'Kontracepcija',
      'Određena zdravstvena stanja',
    ],
    s1Body1:
      'Na menstrualni ciklus tokom mjeseca utječe hormonska aktivnost tijela. Učenje promatranja ciklusa može ti pomoći bolje razumjeti kako tvoje tijelo funkcionira, bez potrebe da sve analiziraš do pojedinosti.',
    s1Body2: 'Evo što je najkorisnije primijetiti:',
    s2Body1:
      'Ne postoji jedan savršen ciklus: svako tijelo ima svoj ritam, a taj se ritam može i neznatno razlikovati iz mjeseca u mjesec. Ciklus se općenito smatra pravilnim kad traje između 21 i 35 dana, a menstruacija najčešće traje 3 do 7 dana.',
    s2Body2:
      'Ove su brojke prosjeci: neznatna odstupanja ostaju posve normalna, osobito nakon puberteta, nakon porođaja ili u približavanju menopauzi.',
    s3Body1:
      'Neke promjene vrijedi pomnije pratiti, primjerice:',
    changesToWatch: [
      'Izrazita promjena pravilnosti ciklusa',
      'Menstruacija osjetno obilnija nego obično',
      'Neobično jaka ili dugotrajna bol',
      'Dulji izostanak menstruacije',
      'Krvarenje između menstruacija',
      'Znatna promjena koja se ponavlja tokom nekoliko ciklusa',
    ],
    s3Body2:
      'Jedan izoliran neobičan ciklus automatski ne znači zdravstveni problem: tijelo može privremeno reagirati na mnoge različite čimbenike.',
    s4Body1:
      'Te promjene ponekad mogu biti povezane s nekoliko čimbenika, bez da nužno predstavljaju problem:',
    s4Body2:
      'To su samo neka moguća objašnjenja među ostalima: nikad ne zamjenjuju savjet zdravstvenog radnika.',
    s5VisualTitle: 'Promatranje vlastitog ritma',
    s5VisualText:
      'Bilježenje datuma, protoka ili osjećaja pomaže ti upoznati svoje navike, mjesec za mjesecom.',
    s5Body:
      'Prvi dan menstruacije, njezino trajanje, protok, bol, raspoloženje, energija ili vaginalni iscjedak sve su stvari koje možeš bilježiti tokom vremena. Cilj nije usporediti svoj ciklus s tuđim, nego bolje prepoznati što je uobičajeno za tebe i što se od toga razlikuje.',
    s6Body1:
      'Potpuno je normalno imati pitanja o svom ciklusu. Traženje ljekarskog savjeta može biti korisno u određenim situacijama, na primjer:',
    whenToAsk: [
      'Značajne promjene koje traju tokom nekoliko ciklusa',
      'Bol koja te sprječava u uobičajenim aktivnostima',
      'Vrlo obilne menstruacije',
      'Dulji izostanak menstruacije',
      'Neuobičajeno krvarenje',
      'Svaki dugotrajan simptom koji te brine',
    ],
    s6Body2:
      'Razgovor sa zdravstvenim radnikom može ti pomoći smiriti brige ili, ako je potrebno, dobiti pravu podršku — sam po sebi nikad nije razlog za zabrinutost.',
    tipText:
      'Ciklus ne mora biti savršeno pravilan da bi bio normalan. Poznavanje vlastitog uobičajenog ritma često je korisnije od traženja idealne duljine.',
    finalBody:
      'Tvoj menstrualni ciklus jedan je od mnogih pokazatelja tvog zdravlja. Redovito praćenje može ti pomoći bolje razumjeti svoje tijelo i, s vremenom, primijetiti promjene koje zaslužuju posebnu pozornost.',
    shareMessage: 'Tvoj ciklus, izvrstan pokazatelj zdravlja — AWA',
  },
  sl: {
    badge: 'CIKEL IN MENSTRUACIJA',
    title: 'Tvoj cikel, odličen\nkazalnik zdravja',
    metaDuration: '7 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Zakaj se cikel včasih imenuje „peti vitalni znak“.',
    contentsTitle: 'V tem članku',
    topics: [
      'Tvoj cikel: odraz tvojega telesa',
      'Kaj je „normalen“ cikel?',
      'Spremembe, na katere je treba paziti',
      'Kaj lahko te spremembe razkrijejo?',
      'Spremljanje cikla za boljše poznavanje sebe',
      'Kdaj poiskati nasvet?',
      'Vredno vedeti',
    ],
    observeLabels: [
      'Dolžina cikla',
      'Dolžina menstruacije',
      'Menstrualni tok',
      'Bolečina',
      'Nožnični izcedek',
      'Razpoloženje',
      'Energija / utrujenost',
      'Drugi ponavljajoči se simptomi',
    ],
    factorLabels: [
      'Stres',
      'Pomanjkanje spanja',
      'Pomembne spremembe teže',
      'Zelo intenzivna telesna dejavnost',
      'Hormonske spremembe',
      'Kontracepcija',
      'Določena zdravstvena stanja',
    ],
    s1Body1:
      'Na menstrualni cikel skozi mesec vpliva hormonska dejavnost telesa. Učenje opazovanja cikla ti lahko pomaga bolje razumeti, kako tvoje telo deluje, ne da bi morala vse podrobno analizirati.',
    s1Body2: 'Tu je, kar je najkoristneje opaziti:',
    s2Body1:
      'Ne obstaja en popoln cikel: vsako telo ima svoj ritem, ta ritem pa se lahko tudi rahlo spreminja iz meseca v mesec. Cikel se na splošno šteje za reden, kadar traja med 21 in 35 dni, menstruacija pa najpogosteje traja 3 do 7 dni.',
    s2Body2:
      'Te številke so povprečja: rahla odstopanja ostajajo povsem normalna, zlasti po pubertetu, po porodu ali ob približevanju menopavze.',
    s3Body1:
      'Nekatere spremembe je vredno pozorneje spremljati, na primer:',
    changesToWatch: [
      'Izrazita sprememba pravilnosti cikla',
      'Menstruacija občutno obilnejša kot običajno',
      'Nenavadno huda ali dolgotrajna bolečina',
      'Dolgotrajna odsotnost menstruacije',
      'Krvavitev med menstruacijama',
      'Pomembna sprememba, ki se ponavlja skozi več ciklov',
    ],
    s3Body2:
      'En sam izoliran nenavaden cikel samodejno ne pomeni zdravstvene težave: telo se lahko začasno odzove na številne različne dejavnike.',
    s4Body1:
      'Te spremembe so lahko včasih povezane z več dejavniki, ne da bi nujno pomenile težavo:',
    s4Body2:
      'To so le nekatere možne razlage med drugimi: nikoli ne nadomeščajo nasveta zdravstvenega delavca.',
    s5VisualTitle: 'Opazovanje lastnega ritma',
    s5VisualText:
      'Beleženje datumov, toka ali počutja ti pomaga spoznati svoje navade, mesec za mesecem.',
    s5Body:
      'Prvi dan menstruacije, njeno trajanje, tok, bolečino, razpoloženje, energijo ali nožnični izcedek lahko beležiš skozi čas. Cilj ni primerjati svojega cikla s tujim, ampak bolje prepoznati, kaj je običajno zate in kaj se od tega razlikuje.',
    s6Body1:
      'Povsem normalno je imeti vprašanja o svojem ciklu. Iskanje zdravniškega nasveta je lahko koristno v določenih situacijah, na primer:',
    whenToAsk: [
      'Pomembne spremembe, ki trajajo več ciklov',
      'Bolečina, ki te ovira pri običajnih dejavnostih',
      'Zelo obilne menstruacije',
      'Dolgotrajna odsotnost menstruacije',
      'Nenavadna krvavitev',
      'Vsak dolgotrajen simptom, ki te skrbi',
    ],
    s6Body2:
      'Pogovor z zdravstvenim delavcem ti lahko pomaga pomiriti skrbi ali, če je treba, dobiti pravo podporo — sam po sebi nikoli ni razlog za zaskrbljenost.',
    tipText:
      'Cikel ne mora biti popolnoma reden, da bi bil normalen. Poznavanje lastnega običajnega ritma je pogosto koristnejše od iskanja idealne dolžine.',
    finalBody:
      'Tvoj menstrualni cikel je eden od mnogih kazalnikov tvojega zdravja. Redno spremljanje ti lahko pomaga bolje razumeti svoje telo in sčasoma opaziti spremembe, ki si zaslužijo posebno pozornost.',
    shareMessage: 'Tvoj cikel, odličen kazalnik zdravja — AWA',
  },
  ne: {
    badge: 'चक्र र महिनावारी',
    title: 'तपाईंको चक्र, स्वास्थ्यको\nएक उत्कृष्ट सूचक',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'चक्रलाई कहिलेकाहीँ “पाँचौँ जीवन सङ्केत” किन भनिन्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'तपाईंको चक्र: तपाईंको शरीरको प्रतिबिम्ब',
      '“सामान्य” चक्र के हो?',
      'ध्यान दिनुपर्ने परिवर्तनहरू',
      'यी परिवर्तनहरूले के देखाउन सक्छन्?',
      'आफूलाई राम्ररी चिन्न चक्र अनुगमन गर्ने',
      'सल्लाह कहिले लिने?',
      'जान्न लायक',
    ],
    observeLabels: [
      'चक्रको अवधि',
      'महिनावारीको अवधि',
      'महिनावारीको बहाव',
      'दुखाइ',
      'योनिको स्राव',
      'मनोदशा',
      'ऊर्जा / थकान',
      'अन्य बारम्बार देखिने लक्षणहरू',
    ],
    factorLabels: [
      'तनाव',
      'निद्राको कमी',
      'तौलमा ठूलो परिवर्तन',
      'निकै तीव्र शारीरिक गतिविधि',
      'हर्मोनल परिवर्तन',
      'गर्भनिरोधन',
      'केही चिकित्सकीय अवस्थाहरू',
    ],
    s1Body1:
      'मासिक चक्र महिनाभरि शरीरको हर्मोनल गतिविधिद्वारा प्रभावित हुन्छ। यसलाई अवलोकन गर्न सिक्नाले सबै कुरा विस्तृत रूपमा विश्लेषण नगरी तपाईंको शरीरले कसरी काम गर्छ राम्ररी बुझ्न मद्दत गर्न सक्छ।',
    s1Body2: 'ध्यान दिन सबैभन्दा उपयोगी कुराहरू यी हुन्:',
    s2Body1:
      'कुनै एउटा पूर्ण चक्र हुँदैन: हरेक शरीरको आफ्नै लय हुन्छ, र त्यो लय महिनैपिच्छे अलिकति फरक पनि हुन सक्छ। चक्र 21 देखि 35 दिनबीच रहँदा सामान्यतया नियमित मानिन्छ, र महिनावारी प्रायः 3 देखि 7 दिन रहन्छ।',
    s2Body2:
      'यी आँकडाहरू औसत हुन्: साना भिन्नताहरू पूर्ण रूपमा सामान्य रहन्छन्, विशेष गरी किशोरावस्थापछि, प्रसवपछि, वा रजोनिवृत्ति नजिकिँदा।',
    s3Body1:
      'केही परिवर्तनहरूलाई अलिक नजिकबाट हेर्न लायक हुन्छ, जस्तै:',
    changesToWatch: [
      'चक्रको नियमिततामा स्पष्ट परिवर्तन',
      'सामान्यभन्दा उल्लेखनीय रूपमा धेरै बहावसहितको महिनावारी',
      'असामान्य रूपमा तीव्र वा लगातार दुखाइ',
      'लामो समयसम्म महिनावारी नहुनु',
      'महिनावारीहरूबीच रक्तस्राव',
      'धेरै चक्रमा दोहोरिने उल्लेखनीय परिवर्तन',
    ],
    s3Body2:
      'एउटा मात्र, एक्लो असामान्य चक्रले स्वतः स्वास्थ्य समस्या जनाउँदैन: शरीरले धेरै फरक कारकप्रति अस्थायी रूपमा प्रतिक्रिया दिन सक्छ।',
    s4Body1:
      'यी परिवर्तनहरू कहिलेकाहीँ धेरै कारकहरूसँग जोडिएका हुन सक्छन्, अनिवार्य रूपमा समस्या नभई:',
    s4Body2:
      'यी अन्य सम्भावनाहरूमध्ये केही सम्भावित व्याख्या मात्र हुन्: तिनले स्वास्थ्यकर्मीको सल्लाहको स्थान कहिल्यै लिँदैनन्।',
    s5VisualTitle: 'आफ्नै लय अवलोकन गर्ने',
    s5VisualText:
      'आफ्ना मिति, बहाव वा तपाईंलाई कस्तो लाग्छ टिप्नाले महिनैपिच्छे आफ्ना बानीहरू चिन्न मद्दत गर्छ।',
    s5Body:
      'तपाईंको महिनावारीको पहिलो दिन, यसको अवधि, बहाव, दुखाइ, मनोदशा, ऊर्जा वा योनिको स्राव सबै समयसँगै टिप्न सकिने कुराहरू हुन्। लक्ष्य आफ्नो चक्रलाई अरूको चक्रसँग तुलना गर्नु होइन, तपाईंका लागि के सामान्य छ र के फरक छ राम्ररी चिन्नु हो।',
    s6Body1:
      'आफ्नो चक्रबारे प्रश्नहरू हुनु पूर्ण रूपमा सामान्य हो। केही अवस्थामा चिकित्सकीय सल्लाह लिनु मद्दतकारी हुन सक्छ, उदाहरणका लागि:',
    whenToAsk: [
      'धेरै चक्रसम्म रहिरहने उल्लेखनीय परिवर्तनहरू',
      'तपाईंलाई सामान्य गतिविधिबाट रोक्ने दुखाइ',
      'निकै धेरै बहावसहितको महिनावारी',
      'लामो समयसम्म महिनावारी नहुनु',
      'असामान्य रक्तस्राव',
      'तपाईंलाई चिन्तित बनाउने कुनै पनि लगातार लक्षण',
    ],
    s6Body2:
      'स्वास्थ्यकर्मीसँग कुरा गर्दा तपाईंको मन शान्त हुन सक्छ वा, आवश्यक परे, सही साथ पाउन सकिन्छ — यो आफैँ कहिल्यै चिन्ताको कारण होइन।',
    tipText:
      'चक्र सामान्य हुन पूर्ण रूपमा नियमित हुनु आवश्यक छैन। आदर्श अवधि खोज्नुभन्दा आफ्नै सामान्य लय जान्नु प्रायः बढी उपयोगी हुन्छ।',
    finalBody:
      'तपाईंको मासिक चक्र तपाईंको स्वास्थ्यका धेरै सूचकहरूमध्ये एक हो। यसलाई नियमित रूपमा अनुगमन गर्नाले तपाईंलाई आफ्नो शरीर राम्ररी बुझ्न र, समयसँगै, विशेष ध्यान दिन लायक परिवर्तनहरू देख्न मद्दत गर्न सक्छ।',
    shareMessage: 'तपाईंको चक्र, स्वास्थ्यको एक उत्कृष्ट सूचक — AWA',
  },
  si: {
    badge: 'චක්‍රය සහ ඔසප්',
    title: 'ඔබේ චක්‍රය, විශිෂ්ට\nසෞඛ්‍ය දර්ශකයක්',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'චක්‍රය සමහර විට “පස්වන ජීවන ලක්ෂණය” ලෙස හැඳින්වෙන්නේ ඇයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඔබේ චක්‍රය: ඔබේ ශරීරයේ පිළිබිඹුවක්',
      '“සාමාන්‍ය” චක්‍රයක් යනු කුමක්ද?',
      'අවධානයට ලක් කළ යුතු වෙනස්කම්',
      'මෙම වෙනස්කම් හෙළි කළ හැක්කේ කුමක්ද?',
      'ඔබ ගැන වඩා හොඳින් දැනගැනීමට ඔබේ චක්‍රය නිරීක්ෂණය කිරීම',
      'උපදෙස් ඉල්ලිය යුත්තේ කවදාද?',
      'දැනගත යුතු දේ',
    ],
    observeLabels: [
      'චක්‍රයේ දිග',
      'ඔසප් කාලයේ දිග',
      'ඔසප් ගලනය',
      'වේදනාව',
      'යෝනි ස්‍රාවය',
      'මනෝභාවය',
      'ශක්තිය / වෙහෙස',
      'වෙනත් පුනරාවර්තන රෝග ලක්ෂණ',
    ],
    factorLabels: [
      'ආතතිය',
      'නින්ද නොමැතිකම',
      'සැලකිය යුතු බර වෙනස්වීම්',
      'ඉතා දැඩි ශාරීරික ක්‍රියාකාරකම',
      'හෝමෝන වෙනස්කම්',
      'ගර්භනිරෝධනය',
      'සමහර වෛද්‍ය තත්ත්වයන්',
    ],
    s1Body1:
      'ඔසප් චක්‍රයට මාසය පුරා ශරීරයේ හෝමෝන ක්‍රියාකාරිත්වය බලපායි. එය නිරීක්ෂණය කිරීමට ඉගෙනීම, සෑම දෙයක්ම විස්තරාත්මකව විශ්ලේෂණය කිරීමට අවශ්‍ය නොවී, ඔබේ ශරීරය ක්‍රියා කරන ආකාරය වඩා හොඳින් තේරුම් ගැනීමට ඔබට උපකාරී විය හැක.',
    s1Body2: 'සටහන් කිරීමට වඩාත්ම ප්‍රයෝජනවත් දේ මෙන්න:',
    s2Body1:
      'එක් පරිපූර්ණ චක්‍රයක් නැත: සෑම ශරීරයකටම තමන්ගේම රිද්මයක් ඇති අතර, එම රිද්මය මාසයෙන් මාසයට සුළු වශයෙන් වෙනස් විය හැක. චක්‍රයක් දින 21 සහ 35 අතර පවතින විට සාමාන්‍යයෙන් නිතිපතා යැයි සැලකෙන අතර, ඔසප් බොහෝ විට දින 3 සිට 7 දක්වා පවතී.',
    s2Body2:
      'මෙම සංඛ්‍යා සාමාන්‍යයන්ය: සුළු වෙනස්කම් සම්පූර්ණයෙන්ම සාමාන්‍ය ලෙස පවතී, විශේෂයෙන් වැඩිවිය පැමිණීමෙන් පසු, ප්‍රසූතියෙන් පසු, හෝ ඔසප් නැවතීම ළං වන විට.',
    s3Body1:
      'සමහර වෙනස්කම් තව ටිකක් සමීපව නිරීක්ෂණය කිරීම වටී, උදාහරණයක් ලෙස:',
    changesToWatch: [
      'චක්‍රයේ නිතිපතා බවේ කැපී පෙනෙන වෙනසක්',
      'සුපුරුදුට වඩා බොහෝ සේ වැඩි ඔසප්',
      'අසාමාන්‍ය ලෙස දැඩි හෝ දිගටම පවතින වේදනාව',
      'ඔසප් දිගු කාලයක් නොපැමිණීම',
      'ඔසප් අතර ලේ ගැලීම',
      'චක්‍ර කිහිපයක් පුරා පුනරාවර්තනය වන සැලකිය යුතු වෙනසක්',
    ],
    s3Body2:
      'තනි, හුදකලා අසාමාන්‍ය චක්‍රයක් ස්වයංක්‍රීයව සෞඛ්‍ය ගැටලුවක් බව අදහස් නොවේ: ශරීරයට විවිධ සාධකවලට තාවකාලිකව ප්‍රතිචාර දැක්විය හැක.',
    s4Body1:
      'මෙම වෙනස්කම් සමහර විට සාධක කිහිපයකට සම්බන්ධ විය හැකි අතර, අනිවාර්යයෙන්ම ගැටලුවක් නොවේ:',
    s4Body2:
      'මේවා අනෙක් ඒවා අතර ඇතිවිය හැකි පැහැදිලි කිරීම් කිහිපයක් පමණි: ඒවා කිසිවිටෙකත් සෞඛ්‍ය වෘත්තිකයෙකුගේ උපදෙස් වෙනුවට නොපවතී.',
    s5VisualTitle: 'ඔබේම රිද්මය නිරීක්ෂණය කිරීම',
    s5VisualText:
      'ඔබේ දින, ගලනය, හෝ ඔබට දැනෙන ආකාරය සටහන් කිරීම, මාසයෙන් මාසය ඔබේ පුරුදු දැනගැනීමට උපකාරී වේ.',
    s5Body:
      'ඔබේ ඔසප්වල පළමු දිනය, එහි දිග, ගලනය, වේදනාව, මනෝභාවය, ශක්තිය, හෝ යෝනි ස්‍රාවය යන සියල්ල කාලයත් සමඟ ඔබට සටහන් කළ හැකි දේවල්ය. අරමුණ ඔබේ චක්‍රය වෙනත් කෙනෙකුගේ චක්‍රය සමඟ සංසන්දනය කිරීම නොව, ඔබට සුපුරුදු දේ සහ එයින් වෙනස් වන දේ වඩා හොඳින් හඳුනාගැනීමයි.',
    s6Body1:
      'ඔබේ චක්‍රය ගැන ප්‍රශ්න තිබීම සම්පූර්ණයෙන්ම සාමාන්‍යයි. සමහර අවස්ථාවලදී වෛද්‍ය උපදෙස් ලබා ගැනීම ප්‍රයෝජනවත් විය හැක, උදාහරණයක් ලෙස:',
    whenToAsk: [
      'චක්‍ර කිහිපයක් පුරා පවතින සැලකිය යුතු වෙනස්කම්',
      'ඔබේ සුපුරුදු ක්‍රියාකාරකම්වලින් ඔබව වළක්වන වේදනාව',
      'ඉතා වැඩි ඔසප්',
      'ඔසප් දිගු කාලයක් නොපැමිණීම',
      'අසාමාන්‍ය ලේ ගැලීම',
      'ඔබව කනස්සල්ලට පත් කරන ඕනෑම දිගටම පවතින රෝග ලක්ෂණයක්',
    ],
    s6Body2:
      'සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කිරීම ඔබේ සිත සැනසීමට හෝ, අවශ්‍ය නම්, නිවැරදි සහාය ලබා ගැනීමට උපකාරී විය හැක — එය කිසිවිටෙකත් තනිවම කනස්සල්ලට හේතුවක් නොවේ.',
    tipText:
      'චක්‍රයක් සාමාන්‍ය වීමට පරිපූර්ණ ලෙස නිතිපතා විය යුතු නැත. ඔබේම සුපුරුදු රිද්මය දැනගැනීම බොහෝ විට පරමාදර්ශී දිගක් සෙවීමට වඩා ප්‍රයෝජනවත්.',
    finalBody:
      'ඔබේ ඔසප් චක්‍රය ඔබේ සෞඛ්‍යයේ බොහෝ දර්ශකවලින් එකකි. එය නිතිපතා නිරීක්ෂණය කිරීම ඔබේ ශරීරය වඩා හොඳින් තේරුම් ගැනීමට සහ, කාලයත් සමඟ, විශේෂ අවධානයට සුදුසු වෙනස්කම් දැකීමට ඔබට උපකාරී විය හැක.',
    shareMessage: 'ඔබේ චක්‍රය, විශිෂ්ට සෞඛ්‍ය දර්ශකයක් — AWA',
  },
  th: {
    badge: 'รอบเดือนและประจำเดือน',
    title: 'รอบเดือนของคุณ ตัวบ่งชี้\nสุขภาพที่ยอดเยี่ยม',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ทำไมบางครั้งจึงเรียกรอบเดือนว่า “สัญญาณชีพที่ห้า”',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'รอบเดือนของคุณ: ภาพสะท้อนของร่างกาย',
      'รอบเดือน “ปกติ” คืออะไร?',
      'การเปลี่ยนแปลงที่ควรสังเกต',
      'การเปลี่ยนแปลงเหล่านี้อาจบ่งบอกอะไร?',
      'ติดตามรอบเดือนเพื่อรู้จักตัวเองมากขึ้น',
      'เมื่อไรควรขอคำแนะนำ?',
      'ควรรู้',
    ],
    observeLabels: [
      'ความยาวรอบเดือน',
      'ระยะเวลาประจำเดือน',
      'ปริมาณประจำเดือน',
      'อาการปวด',
      'ตกขาว',
      'อารมณ์',
      'พลังงาน / ความเหนื่อยล้า',
      'อาการอื่นที่เกิดซ้ำ',
    ],
    factorLabels: [
      'ความเครียด',
      'การนอนไม่พอ',
      'น้ำหนักเปลี่ยนแปลงมาก',
      'กิจกรรมทางกายที่หนักมาก',
      'การเปลี่ยนแปลงของฮอร์โมน',
      'การคุมกำเนิด',
      'ภาวะทางการแพทย์บางอย่าง',
    ],
    s1Body1:
      'รอบเดือนได้รับอิทธิพลจากการทำงานของฮอร์โมนในร่างกายตลอดเดือน การเรียนรู้ที่จะสังเกตช่วยให้คุณเข้าใจการทำงานของร่างกายดียิ่งขึ้น โดยไม่ต้องวิเคราะห์ทุกอย่างอย่างละเอียด',
    s1Body2: 'นี่คือสิ่งที่มีประโยชน์ที่สุดที่ควรสังเกต:',
    s2Body1:
      'ไม่มีรอบเดือนที่สมบูรณ์แบบเพียงแบบเดียว: ร่างกายแต่ละคนมีจังหวะของตัวเอง และจังหวะนั้นอาจต่างกันเล็กน้อยในแต่ละเดือนด้วย โดยทั่วไปรอบเดือนถือว่าสม่ำเสมอเมื่อยาวระหว่าง 21 ถึง 35 วัน และประจำเดือนมักมา 3 ถึง 7 วัน',
    s2Body2:
      'ตัวเลขเหล่านี้เป็นค่าเฉลี่ย: ความแตกต่างเล็กน้อยยังคงเป็นเรื่องปกติอย่างสมบูรณ์ โดยเฉพาะหลังวัยแรกรุ่น หลังคลอด หรือเมื่อใกล้วัยหมดประจำเดือน',
    s3Body1:
      'การเปลี่ยนแปลงบางอย่างควรสังเกตอย่างใกล้ชิดขึ้นเล็กน้อย เช่น:',
    changesToWatch: [
      'ความสม่ำเสมอของรอบเดือนเปลี่ยนไปอย่างชัดเจน',
      'ประจำเดือนมากกว่าปกติอย่างเห็นได้ชัด',
      'อาการปวดที่รุนแรงหรือต่อเนื่องผิดปกติ',
      'ประจำเดือนขาดหายไปนาน',
      'เลือดออกระหว่างรอบเดือน',
      'การเปลี่ยนแปลงสำคัญที่เกิดซ้ำหลายรอบเดือน',
    ],
    s3Body2:
      'รอบเดือนที่ผิดปกติเพียงรอบเดียวไม่ได้หมายถึงปัญหาสุขภาพโดยอัตโนมัติ: ร่างกายอาจตอบสนองชั่วคราวต่อปัจจัยมากมาย',
    s4Body1:
      'การเปลี่ยนแปลงเหล่านี้บางครั้งอาจเกี่ยวข้องกับหลายปัจจัย โดยไม่จำเป็นต้องเป็นปัญหา:',
    s4Body2:
      'นี่เป็นเพียงคำอธิบายที่เป็นไปได้บางส่วนในหลายคำอธิบาย: ไม่เคยแทนที่คำแนะนำของบุคลากรทางการแพทย์',
    s5VisualTitle: 'สังเกตจังหวะของคุณเอง',
    s5VisualText:
      'การจดวันที่ ปริมาณ หรือความรู้สึกของคุณ ช่วยให้คุณรู้จักนิสัยของตัวเองในแต่ละเดือน',
    s5Body:
      'วันแรกของประจำเดือน ระยะเวลา ปริมาณ อาการปวด อารมณ์ พลังงาน หรือตกขาว ล้วนเป็นสิ่งที่คุณจดไว้ตามเวลา เป้าหมายไม่ใช่การเปรียบเทียบรอบเดือนของคุณกับคนอื่น แต่เพื่อจดจำสิ่งที่เป็นปกติสำหรับคุณได้ดีขึ้น และสิ่งที่แตกต่างไปจากนั้น',
    s6Body1:
      'เป็นเรื่องปกติอย่างยิ่งที่จะมีคำถามเกี่ยวกับรอบเดือนของคุณ การขอคำแนะนำทางการแพทย์มีประโยชน์ในบางสถานการณ์ เช่น:',
    whenToAsk: [
      'การเปลี่ยนแปลงสำคัญที่คงอยู่หลายรอบเดือน',
      'อาการปวดที่ทำให้คุณทำกิจกรรมตามปกติไม่ได้',
      'ประจำเดือนมามากผิดปกติ',
      'ประจำเดือนขาดหายไปนาน',
      'เลือดออกผิดปกติ',
      'อาการใดก็ตามที่คงอยู่และทำให้คุณกังวล',
    ],
    s6Body2:
      'การพูดคุยกับบุคลากรทางการแพทย์ช่วยให้คุณสบายใจ หรือหากจำเป็น ช่วยให้คุณได้รับการสนับสนุนที่เหมาะสม — ตัวมันเองไม่เคยเป็นเหตุให้กังวล',
    tipText:
      'รอบเดือนไม่จำเป็นต้องสม่ำเสมอสมบูรณ์แบบจึงจะปกติ การรู้จังหวะปกติของตัวเองมักมีประโยชน์กว่าการมองหาความยาวในอุดมคติ',
    finalBody:
      'รอบเดือนของคุณเป็นหนึ่งในตัวบ่งชี้มากมายของสุขภาพของคุณ การติดตามอย่างสม่ำเสมอช่วยให้คุณเข้าใจร่างกายดียิ่งขึ้น และเมื่อเวลาผ่านไปสังเกตการเปลี่ยนแปลงที่ควรให้ความสนใจเป็นพิเศษ',
    shareMessage: 'รอบเดือนของคุณ ตัวบ่งชี้สุขภาพที่ยอดเยี่ยม — AWA',
  },
  vi: {
    badge: 'CHU KỲ & KỲ KINH',
    title: 'Chu kỳ của bạn, một chỉ báo\nsức khỏe tuyệt vời',
    metaDuration: '7 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Tại sao chu kỳ đôi khi được gọi là “dấu hiệu sinh tồn thứ năm”.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Chu kỳ của bạn: tấm gương phản chiếu cơ thể',
      'Thế nào là một chu kỳ “bình thường”?',
      'Những thay đổi cần để ý',
      'Những thay đổi này có thể cho biết điều gì?',
      'Theo dõi chu kỳ để hiểu mình hơn',
      'Khi nào nên tìm lời khuyên?',
      'Nên biết',
    ],
    observeLabels: [
      'Độ dài chu kỳ',
      'Số ngày hành kinh',
      'Lượng kinh nguyệt',
      'Đau',
      'Khí hư',
      'Tâm trạng',
      'Năng lượng / mệt mỏi',
      'Các triệu chứng lặp lại khác',
    ],
    factorLabels: [
      'Căng thẳng',
      'Thiếu ngủ',
      'Thay đổi cân nặng đáng kể',
      'Hoạt động thể chất rất cường độ cao',
      'Thay đổi nội tiết',
      'Biện pháp tránh thai',
      'Một số bệnh lý',
    ],
    s1Body1:
      'Chu kỳ kinh nguyệt chịu ảnh hưởng của hoạt động nội tiết trong cơ thể suốt cả tháng. Học cách quan sát nó có thể giúp bạn hiểu rõ hơn cơ thể mình hoạt động ra sao, mà không cần phân tích mọi thứ thật chi tiết.',
    s1Body2: 'Sau đây là những điều hữu ích nhất cần để ý:',
    s2Body1:
      'Không có một chu kỳ hoàn hảo duy nhất: mỗi cơ thể có nhịp điệu riêng, và nhịp điệu đó cũng có thể hơi thay đổi từ tháng này sang tháng khác. Một chu kỳ thường được coi là đều khi kéo dài từ 21 đến 35 ngày, và kỳ kinh thường kéo dài 3 đến 7 ngày.',
    s2Body2:
      'Những con số này là giá trị trung bình: những khác biệt nhỏ vẫn hoàn toàn bình thường, đặc biệt sau tuổi dậy thì, sau khi sinh hoặc khi sắp mãn kinh.',
    s3Body1:
      'Một số thay đổi đáng được theo dõi kỹ hơn một chút, chẳng hạn như:',
    changesToWatch: [
      'Độ đều của chu kỳ thay đổi rõ rệt',
      'Kỳ kinh nhiều hơn hẳn bình thường',
      'Cơn đau mạnh hoặc kéo dài bất thường',
      'Mất kinh kéo dài',
      'Ra máu giữa các kỳ kinh',
      'Một thay đổi đáng kể lặp lại qua nhiều chu kỳ',
    ],
    s3Body2:
      'Một chu kỳ bất thường đơn lẻ không tự động có nghĩa là có vấn đề sức khỏe: cơ thể có thể phản ứng tạm thời với rất nhiều yếu tố khác nhau.',
    s4Body1:
      'Những thay đổi này đôi khi có thể liên quan đến nhiều yếu tố, mà không nhất thiết là một vấn đề:',
    s4Body2:
      'Đây chỉ là một số lời giải thích có thể có trong nhiều khả năng khác: chúng không bao giờ thay thế lời khuyên của nhân viên y tế.',
    s5VisualTitle: 'Quan sát nhịp điệu của riêng bạn',
    s5VisualText:
      'Ghi lại ngày, lượng kinh hoặc cảm nhận của bạn giúp bạn hiểu thói quen của mình, tháng này qua tháng khác.',
    s5Body:
      'Ngày đầu tiên của kỳ kinh, số ngày hành kinh, lượng kinh, cơn đau, tâm trạng, năng lượng hoặc khí hư đều là những điều bạn có thể ghi lại theo thời gian. Mục đích không phải để so sánh chu kỳ của bạn với người khác, mà để nhận ra rõ hơn điều gì là bình thường với bạn và điều gì khác đi.',
    s6Body1:
      'Có thắc mắc về chu kỳ của mình là hoàn toàn bình thường. Tìm lời khuyên y khoa có thể hữu ích trong một số tình huống, ví dụ:',
    whenToAsk: [
      'Những thay đổi đáng kể kéo dài qua nhiều chu kỳ',
      'Cơn đau khiến bạn không thể sinh hoạt như thường',
      'Kỳ kinh rất nhiều',
      'Mất kinh kéo dài',
      'Ra máu bất thường',
      'Bất kỳ triệu chứng kéo dài nào khiến bạn lo lắng',
    ],
    s6Body2:
      'Nói chuyện với nhân viên y tế có thể giúp bạn yên tâm hơn hoặc, nếu cần, giúp bạn nhận được sự hỗ trợ phù hợp — tự nó không bao giờ là lý do để lo lắng.',
    tipText:
      'Một chu kỳ không cần phải đều tuyệt đối mới được coi là bình thường. Hiểu nhịp điệu thông thường của riêng bạn thường hữu ích hơn việc tìm kiếm một độ dài lý tưởng.',
    finalBody:
      'Chu kỳ kinh nguyệt của bạn là một trong nhiều chỉ báo về sức khỏe của bạn. Theo dõi nó đều đặn có thể giúp bạn hiểu rõ hơn cơ thể mình và, theo thời gian, nhận ra những thay đổi đáng được đặc biệt chú ý.',
    shareMessage: 'Chu kỳ của bạn, một chỉ báo sức khỏe tuyệt vời — AWA',
  },
  uz: {
    badge: 'SIKL VA HAYZ',
    title: 'Siklingiz — salomatlikning\nyaxshi koʻrsatkichi',
    metaDuration: '7 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Nima uchun sikl baʼzan “beshinchi hayotiy belgi” deb ataladi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Siklingiz: tanangiz aksi',
      '“Normal” sikl nima?',
      'Eʼtibor berish kerak boʻlgan oʻzgarishlar',
      'Bu oʻzgarishlar nimani koʻrsatishi mumkin?',
      'Oʻzingizni yaxshiroq tanish uchun siklni kuzatish',
      'Qachon maslahat olish kerak?',
      'Bilish foydali',
    ],
    observeLabels: [
      'Sikl uzunligi',
      'Hayz uzunligi',
      'Hayz oqimi',
      'Ogʻriq',
      'Qin ajralmalari',
      'Kayfiyat',
      'Energiya / charchoq',
      'Boshqa takrorlanuvchi alomatlar',
    ],
    factorLabels: [
      'Stress',
      'Uyqu yetishmasligi',
      'Sezilarli vazn oʻzgarishlari',
      'Juda kuchli jismoniy faollik',
      'Gormonal oʻzgarishlar',
      'Kontratseptsiya',
      'Baʼzi tibbiy holatlar',
    ],
    s1Body1:
      'Hayz sikliga tananing oy davomidagi gormonal faolligi taʼsir qiladi. Uni kuzatishni oʻrganish, hamma narsani batafsil tahlil qilish shart boʻlmasdan, tanangiz qanday ishlashini yaxshiroq tushunishga yordam beradi.',
    s1Body2: 'Eng foydali eʼtibor beriladigan jihatlar:',
    s2Body1:
      'Yagona mukammal sikl yoʻq: har bir tananing oʻz ritmi bor va bu ritm oydan oyga ozgina oʻzgarishi ham mumkin. Sikl 21 kundan 35 kungacha davom etsa, odatda muntazam hisoblanadi, hayz esa koʻpincha 3 kundan 7 kungacha davom etadi.',
    s2Body2:
      'Bu raqamlar oʻrtacha koʻrsatkichlar: ozgina farqlar mutlaqo normal, ayniqsa balogʻatga yetgandan keyin, tugʻruqdan keyin yoki menopauza yaqinlashganda.',
    s3Body1:
      'Baʼzi oʻzgarishlarni biroz diqqat bilan kuzatish kerak, masalan:',
    changesToWatch: [
      'Sikl muntazamligining sezilarli oʻzgarishi',
      'Hayz odatdagidan sezilarli koʻproq boʻlishi',
      'Odatdan tashqari kuchli yoki doimiy ogʻriq',
      'Hayzning uzoq vaqt boʻlmasligi',
      'Hayzlar oraligʻida qon ketishi',
      'Bir necha sikl davomida takrorlanadigan sezilarli oʻzgarish',
    ],
    s3Body2:
      'Yakka, alohida gʻayrioddiy sikl avtomatik ravishda salomatlik muammosini anglatmaydi: tana koʻplab turli omillarga vaqtincha javob berishi mumkin.',
    s4Body1:
      'Bu oʻzgarishlar baʼzan bir nechta omil bilan bogʻliq boʻlishi mumkin, albatta muammo boʻlishi shart emas:',
    s4Body2:
      'Bu boshqalar qatori faqat baʼzi mumkin boʻlgan tushuntirishlar: ular hech qachon sogʻliqni saqlash mutaxassisi maslahatini almashtirmaydi.',
    s5VisualTitle: 'Oʻz ritmingizni kuzatish',
    s5VisualText:
      'Sanalaringiz, oqim yoki oʻzingizni qanday his qilishingizni yozib borish oyma-oy odatlaringizni bilishga yordam beradi.',
    s5Body:
      'Hayzingizning birinchi kuni, uning uzunligi, oqim, ogʻriq, kayfiyat, energiya yoki qin ajralmalari — bularning barchasini vaqt davomida yozib borishingiz mumkin. Maqsad siklingizni boshqasinikiga solishtirish emas, balki siz uchun nima odatiy ekanini va undan nima farq qilishini yaxshiroq tanish.',
    s6Body1:
      'Siklingiz haqida savollar tugʻilishi mutlaqo normal. Baʼzi hollarda tibbiy maslahat olish foydali boʻlishi mumkin, masalan:',
    whenToAsk: [
      'Bir necha sikl davomida saqlanib qoladigan sezilarli oʻzgarishlar',
      'Odatiy mashgʻulotlaringizga xalaqit beradigan ogʻriq',
      'Juda koʻp hayz qoni',
      'Hayzning uzoq vaqt boʻlmasligi',
      'Gʻayrioddiy qon ketishi',
      'Sizni xavotirga soladigan har qanday doimiy alomat',
    ],
    s6Body2:
      'Sogʻliqni saqlash mutaxassisi bilan gaplashish xotirjamlik topishga yoki zarur boʻlsa, kerakli yordamni olishga imkon beradi — bu oʻzi hech qachon xavotirga sabab emas.',
    tipText:
      'Sikl normal boʻlishi uchun mukammal muntazam boʻlishi shart emas. Oʻz odatiy ritmingizni bilish koʻpincha ideal uzunlikni qidirishdan foydaliroq.',
    finalBody:
      'Hayz siklingiz salomatligingizning koʻplab koʻrsatkichlaridan biri. Uni muntazam kuzatish tanangizni yaxshiroq tushunishga va vaqt oʻtishi bilan alohida eʼtibor talab qiladigan oʻzgarishlarni payqashga yordam beradi.',
    shareMessage: 'Siklingiz — salomatlikning yaxshi koʻrsatkichi — AWA',
  },
  az: {
    badge: 'DÖVR VƏ AYBAŞI',
    title: 'Sizin dövrünüz — sağlamlığın\nəla göstəricisi',
    metaDuration: '7 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Dövr nə üçün bəzən “beşinci həyati əlamət” adlanır.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Sizin dövrünüz: bədəninizin əksi',
      '“Normal” dövr nədir?',
      'Diqqət ediləcək dəyişikliklər',
      'Bu dəyişikliklər nəyi göstərə bilər?',
      'Özünüzü daha yaxşı tanımaq üçün dövrünüzü izləmək',
      'Nə vaxt məsləhət almaq lazımdır?',
      'Bilmək faydalıdır',
    ],
    observeLabels: [
      'Dövrün uzunluğu',
      'Aybaşının müddəti',
      'Aybaşı axını',
      'Ağrı',
      'Vaginal ifrazat',
      'Əhval',
      'Enerji / yorğunluq',
      'Digər təkrarlanan simptomlar',
    ],
    factorLabels: [
      'Stress',
      'Yuxusuzluq',
      'Əhəmiyyətli çəki dəyişiklikləri',
      'Çox intensiv fiziki fəaliyyət',
      'Hormonal dəyişikliklər',
      'Kontrasepsiya',
      'Bəzi tibbi vəziyyətlər',
    ],
    s1Body1:
      'Menstrual dövrə bədənin ay boyu hormonal fəaliyyəti təsir edir. Onu müşahidə etməyi öyrənmək, hər şeyi təfərrüatı ilə təhlil etməyə ehtiyac olmadan bədəninizin necə işlədiyini daha yaxşı anlamağa kömək edə bilər.',
    s1Body2: 'Qeyd etmək üçün ən faydalı şeylər bunlardır:',
    s2Body1:
      'Yeganə mükəmməl dövr yoxdur: hər bədənin öz ritmi var və bu ritm aydan aya bir qədər də dəyişə bilər. Dövr 21 ilə 35 gün arasında davam edirsə, adətən müntəzəm sayılır, aybaşı isə çox vaxt 3–7 gün çəkir.',
    s2Body2:
      'Bu rəqəmlər ortalamadır: yüngül dəyişikliklər, xüsusilə yetkinləşmədən sonra, doğuşdan sonra və ya menopauza yaxınlaşanda tamamilə normal qalır.',
    s3Body1:
      'Bəzi dəyişikliklərə bir qədər daha diqqətlə baxmağa dəyər, məsələn:',
    changesToWatch: [
      'Dövrün müntəzəmliyində nəzərəçarpan dəyişiklik',
      'Aybaşının adi haldan nəzərəçarpacaq dərəcədə bol olması',
      'Qeyri-adi dərəcədə güclü və ya davamlı ağrı',
      'Aybaşının uzun müddət olmaması',
      'Aybaşılar arasında qanaxma',
      'Bir neçə dövr ərzində təkrarlanan əhəmiyyətli dəyişiklik',
    ],
    s3Body2:
      'Tək, təcrid olunmuş qeyri-adi dövr avtomatik olaraq sağlamlıq problemi demək deyil: bədən müxtəlif amillərə müvəqqəti reaksiya verə bilər.',
    s4Body1:
      'Bu dəyişikliklər bəzən mütləq problem olmadan bir neçə amillə əlaqəli ola bilər:',
    s4Body2:
      'Bunlar digərləri arasında yalnız bəzi mümkün izahlardır: onlar heç vaxt tibb işçisinin məsləhətini əvəz etmir.',
    s5VisualTitle: 'Öz ritminizi müşahidə etmək',
    s5VisualText:
      'Tarixlərinizi, axınınızı və ya özünüzü necə hiss etdiyinizi qeyd etmək aydan aya vərdişlərinizi tanımağa kömək edir.',
    s5Body:
      'Aybaşınızın ilk günü, müddəti, axın, ağrı, əhval, enerji və ya vaginal ifrazat zamanla qeyd edə biləcəyiniz şeylərdir. Məqsəd dövrünüzü başqasının dövrü ilə müqayisə etmək deyil, sizin üçün nəyin adi olduğunu və ondan nəyin fərqləndiyini daha yaxşı tanımaqdır.',
    s6Body1:
      'Dövrünüz barədə suallarınızın olması tamamilə normaldır. Tibbi məsləhət almaq müəyyən vəziyyətlərdə faydalı ola bilər, məsələn:',
    whenToAsk: [
      'Bir neçə dövr ərzində davam edən əhəmiyyətli dəyişikliklər',
      'Adi fəaliyyətlərinizə mane olan ağrı',
      'Çox bol aybaşı',
      'Aybaşının uzun müddət olmaması',
      'Qeyri-adi qanaxma',
      'Sizi narahat edən istənilən davamlı simptom',
    ],
    s6Body2:
      'Tibb işçisi ilə danışmaq sizi sakitləşdirməyə və ya lazım gələrsə, düzgün dəstək almağa kömək edə bilər — bu, özlüyündə heç vaxt narahatlıq səbəbi deyil.',
    tipText:
      'Dövrün normal olması üçün mükəmməl müntəzəm olması lazım deyil. Öz adi ritminizi bilmək, çox vaxt ideal uzunluq axtarmaqdan daha faydalıdır.',
    finalBody:
      'Menstrual dövrünüz sağlamlığınızın çoxsaylı göstəricilərindən biridir. Onu müntəzəm izləmək bədəninizi daha yaxşı anlamağa və zamanla xüsusi diqqətə layiq dəyişiklikləri görməyə kömək edə bilər.',
    shareMessage: 'Sizin dövrünüz — sağlamlığın əla göstəricisi — AWA',
  },
  ka: {
    badge: 'ციკლი და მენსტრუაცია',
    title: 'თქვენი ციკლი — ჯანმრთელობის\nშესანიშნავი ინდიკატორი',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'რატომ ეძახიან ციკლს ზოგჯერ „მეხუთე სასიცოცხლო ნიშანს“.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'თქვენი ციკლი: თქვენი სხეულის ანარეკლი',
      'რა არის „ნორმალური“ ციკლი?',
      'ცვლილებები, რომლებსაც უნდა დააკვირდეთ',
      'რის გამოვლენა შეუძლია ამ ცვლილებებს?',
      'ციკლის კონტროლი საკუთარი თავის უკეთ გასაცნობად',
      'როდის მივმართოთ რჩევისთვის?',
      'კარგია ვიცოდეთ',
    ],
    observeLabels: [
      'ციკლის ხანგრძლივობა',
      'მენსტრუაციის ხანგრძლივობა',
      'მენსტრუაციული ნაკადი',
      'ტკივილი',
      'ვაგინალური გამონადენი',
      'ხასიათი',
      'ენერგია / დაღლილობა',
      'სხვა განმეორებადი სიმპტომები',
    ],
    factorLabels: [
      'სტრესი',
      'ძილის ნაკლებობა',
      'წონის მნიშვნელოვანი ცვლილებები',
      'ძალიან ინტენსიური ფიზიკური აქტივობა',
      'ჰორმონული ცვლილებები',
      'კონტრაცეფცია',
      'ზოგიერთი სამედიცინო მდგომარეობა',
    ],
    s1Body1:
      'მენსტრუაციულ ციკლზე გავლენას ახდენს სხეულის ჰორმონული აქტივობა მთელი თვის განმავლობაში. მასზე დაკვირვების სწავლას შეუძლია დაგეხმაროთ უკეთ გაიგოთ, როგორ მუშაობს თქვენი სხეული, ყველაფრის დეტალურად გაანალიზების გარეშე.',
    s1Body2: 'აი რა არის შესამჩნევად ყველაზე სასარგებლო:',
    s2Body1:
      'ერთი იდეალური ციკლი არ არსებობს: ყველა სხეულს საკუთარი რიტმი აქვს და ეს რიტმი თვიდან თვემდეც მცირედ შეიძლება იცვლებოდეს. ციკლი ზოგადად რეგულარულად ითვლება, როცა 21-დან 35 დღემდე გრძელდება, მენსტრუაცია კი ყველაზე ხშირად 3-დან 7 დღემდე გრძელდება.',
    s2Body2:
      'ეს რიცხვები საშუალო მაჩვენებლებია: მცირე ვარიაციები სრულიად ნორმალურია, განსაკუთრებით მოზარდობის ასაკის შემდეგ, მშობიარობის შემდეგ ან მენოპაუზის მოახლოებისას.',
    s3Body1:
      'ზოგიერთ ცვლილებას უფრო ყურადღებით უნდა მივაქციოთ ყურადღება, მაგალითად:',
    changesToWatch: [
      'ციკლის რეგულარულობის შესამჩნევი ცვლილება',
      'ჩვეულებრივზე შესამჩნევად უფრო უხვი მენსტრუაცია',
      'უჩვეულოდ ძლიერი ან გაგრძელებული ტკივილი',
      'მენსტრუაციის ხანგრძლივი არარსებობა',
      'სისხლდენა მენსტრუაციებს შორის',
      'მნიშვნელოვანი ცვლილება, რომელიც რამდენიმე ციკლში მეორდება',
    ],
    s3Body2:
      'ერთი, იზოლირებული უჩვეულო ციკლი ავტომატურად არ ნიშნავს ჯანმრთელობის პრობლემას: სხეულს შეუძლია დროებით რეაგირება მრავალ სხვადასხვა ფაქტორზე.',
    s4Body1:
      'ეს ცვლილებები ზოგჯერ შეიძლება რამდენიმე ფაქტორს უკავშირდებოდეს, აუცილებლად პრობლემის არსებობის გარეშე:',
    s4Body2:
      'ეს მხოლოდ რამდენიმეა შესაძლო ახსნათა შორის: ისინი არასდროს ანაცვლებს ჯანდაცვის სპეციალისტის რჩევას.',
    s5VisualTitle: 'თქვენი საკუთარი რიტმის დაკვირვება',
    s5VisualText:
      'თქვენი თარიღების, ნაკადისა და თვითგრძნობის აღნიშვნა გეხმარებათ თვიდან თვემდე თქვენი ჩვევების გაცნობაში.',
    s5Body:
      'მენსტრუაციის პირველი დღე, მისი ხანგრძლივობა, ნაკადი, ტკივილი, ხასიათი, ენერგია ან ვაგინალური გამონადენი ყველაფერია, რის აღნიშვნაც დროთა განმავლობაში შეგიძლიათ. მიზანი არ არის თქვენი ციკლის სხვისას შედარება, არამედ იმის უკეთ ამოცნობა, რა არის თქვენთვის ჩვეული და რა განსხვავდება მისგან.',
    s6Body1:
      'სრულიად ნორმალურია, რომ თქვენი ციკლის შესახებ კითხვები გაქვთ. სამედიცინო რჩევის მიღება გარკვეულ სიტუაციებში შეიძლება სასარგებლო იყოს, მაგალითად:',
    whenToAsk: [
      'მნიშვნელოვანი ცვლილებები, რომლებიც რამდენიმე ციკლის განმავლობაში გრძელდება',
      'ტკივილი, რომელიც ჩვეულებრივ საქმიანობას გიშლით',
      'ძალიან უხვი მენსტრუაცია',
      'მენსტრუაციის ხანგრძლივი არარსებობა',
      'უჩვეულო სისხლდენა',
      'ნებისმიერი გაგრძელებული სიმპტომი, რომელიც გაწუხებთ',
    ],
    s6Body2:
      'ჯანდაცვის სპეციალისტთან საუბარმა შეიძლება დაგამშვიდოთ ან, საჭიროების შემთხვევაში, სათანადო მხარდაჭერა მოგცეთ — თავისთავად ეს არასდროს არის შეშფოთების მიზეზი.',
    tipText:
      'ციკლი სრულიად რეგულარული არ უნდა იყოს, რომ ნორმალური იყოს. თქვენი საკუთარი ჩვეული რიტმის ცოდნა ხშირად უფრო სასარგებლოა, ვიდრე იდეალური ხანგრძლივობის ძიება.',
    finalBody:
      'თქვენი მენსტრუაციული ციკლი თქვენი ჯანმრთელობის მრავალი ინდიკატორიდან ერთ-ერთია. მისმა რეგულარულმა კონტროლმა შეიძლება დაგეხმაროთ უკეთ გაიგოთ თქვენი სხეული და დროთა განმავლობაში შეამჩნიოთ ცვლილებები, რომლებიც განსაკუთრებულ ყურადღებას იმსახურებს.',
    shareMessage: 'თქვენი ციკლი — ჯანმრთელობის შესანიშნავი ინდიკატორი — AWA',
  },
  hy: {
    badge: 'ՑԻԿԼ ԵՎ ԴԱՇՏԱՆ',
    title: 'Ձեր ցիկլը՝ գերազանց\nառողջական ցուցանիշ',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչու է ցիկլը երբեմն անվանում «հինգերորդ կենսական ցուցանիշ»:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ձեր ցիկլը՝ ձեր մարմնի արտացոլանքը',
      'Ի՞նչ է «նորմալ» ցիկլը:',
      'Փոփոխություններ, որոնց պետք է ուշադրություն դարձնել',
      'Ինչ կարող են բացահայտել այս փոփոխությունները:',
      'Հետևել ցիկլին՝ ինքներդ ձեզ ավելի լավ ճանաչելու համար',
      'Ե՞րբ խորհուրդ հարցնել:',
      'Լավ է իմանալ',
    ],
    observeLabels: [
      'Ցիկլի տևողություն',
      'Դաշտանի տևողություն',
      'Դաշտանային արտահոսք',
      'Ցավ',
      'Հեշտոցային արտազատուկ',
      'Տրամադրություն',
      'Էներգիա / հոգնածություն',
      'Այլ կրկնվող ախտանիշներ',
    ],
    factorLabels: [
      'Սթրես',
      'Քնի պակաս',
      'Քաշի զգալի փոփոխություններ',
      'Շատ ինտենսիվ ֆիզիկական ակտիվություն',
      'Հորմոնալ փոփոխություններ',
      'Հակաբեղմնավորում',
      'Որոշ բժշկական վիճակներ',
    ],
    s1Body1:
      'Դաշտանային ցիկլի վրա ազդում է մարմնի հորմոնալ ակտիվությունը ամբողջ ամսվա ընթացքում: Այն դիտարկել սովորելը կարող է օգնել ավելի լավ հասկանալ, թե ինչպես է աշխատում ձեր մարմինը՝ առանց ամեն ինչ մանրամասնորեն վերլուծելու կարիքի:',
    s1Body2: 'Ահա ամենաօգտակար բաները, որոնք արժե նկատել.',
    s2Body1:
      'Չկա մեկ կատարյալ ցիկլ. յուրաքանչյուր մարմին ունի իր ռիթմը, և այդ ռիթմը կարող է նաև թեթևակի փոխվել ամսից ամիս: Ցիկլը սովորաբար համարվում է կանոնավոր, երբ տևում է 21-ից 35 օր, իսկ դաշտանները ամենից հաճախ տևում են 3–7 օր:',
    s2Body2:
      'Այս թվերը միջինային են. թեթև տատանումները լիովին նորմալ են մնում, մասնավորապես՝ սեռական հասունացումից հետո, ծննդաբերությունից հետո կամ դաշտանադադարին մոտենալիս:',
    s3Body1:
      'Որոշ փոփոխություններ արժե ավելի ուշադիր հետևել, օրինակ.',
    changesToWatch: [
      'Ցիկլի կանոնավորության արտահայտված փոփոխություն',
      'Սովորականից նկատելիորեն առատ դաշտաններ',
      'Անսովոր ուժեղ կամ շարունակական ցավ',
      'Դաշտանների երկարատև բացակայություն',
      'Արյունահոսություն դաշտանների միջև',
      'Զգալի փոփոխություն, որը կրկնվում է մի քանի ցիկլի ընթացքում',
    ],
    s3Body2:
      'Մեկ, մեկուսացված անսովոր ցիկլը ինքնաբերաբար չի նշանակում առողջական խնդիր. մարմինը կարող է ժամանակավորապես արձագանքել բազմաթիվ տարբեր գործոնների:',
    s4Body1:
      'Այս փոփոխությունները երբեմն կարող են կապված լինել մի քանի գործոնների հետ՝ առանց պարտադիր խնդիր լինելու.',
    s4Body2:
      'Սրանք հնարավոր բացատրություններից միայն մի քանիսն են. դրանք երբեք չեն փոխարինում առողջապահության մասնագետի խորհրդին:',
    s5VisualTitle: 'Դիտարկել ձեր սեփական ռիթմը',
    s5VisualText:
      'Ձեր ամսաթվերը, արտահոսքը կամ ինքնազգացողությունը գրանցելը օգնում է ճանաչել ձեր սովորությունները՝ ամիս առ ամիս:',
    s5Body:
      'Ձեր դաշտանի առաջին օրը, դրա տևողությունը, արտահոսքը, ցավը, տրամադրությունը, էներգիան կամ հեշտոցային արտազատուկը այն բաներն են, որոնք կարող եք գրանցել ժամանակի ընթացքում: Նպատակը ձեր ցիկլը ուրիշի ցիկլի հետ համեմատելը չէ, այլ ավելի լավ ճանաչելը, թե ինչն է սովորական ձեզ համար և ինչն է դրանից տարբերվում:',
    s6Body1:
      'Լիովին նորմալ է ձեր ցիկլի մասին հարցեր ունենալը: Բժշկական խորհուրդ հարցնելը կարող է օգտակար լինել որոշ իրավիճակներում, օրինակ.',
    whenToAsk: [
      'Զգալի փոփոխություններ, որոնք շարունակվում են մի քանի ցիկլի ընթացքում',
      'Ցավ, որը խանգարում է ձեր սովորական գործունեությանը',
      'Շատ առատ դաշտաններ',
      'Դաշտանների երկարատև բացակայություն',
      'Անսովոր արյունահոսություն',
      'Ցանկացած շարունակական ախտանիշ, որն անհանգստացնում է ձեզ',
    ],
    s6Body2:
      'Առողջապահության մասնագետի հետ խոսելը կարող է հանգստացնել ձեզ կամ, անհրաժեշտության դեպքում, ապահովել ճիշտ աջակցություն. դա երբեք ինքնին անհանգստության պատճառ չէ:',
    tipText:
      'Ցիկլը պարտադիր չէ կատարյալ կանոնավոր լինել՝ նորմալ համարվելու համար: Ձեր սեփական սովորական ռիթմը իմանալը հաճախ ավելի օգտակար է, քան իդեալական տևողություն փնտրելը:',
    finalBody:
      'Ձեր դաշտանային ցիկլը ձեր առողջության բազմաթիվ ցուցանիշներից մեկն է: Այն կանոնավոր հետևելը կարող է օգնել ավելի լավ հասկանալ ձեր մարմինը և, ժամանակի ընթացքում, նկատել փոփոխություններ, որոնք հատուկ ուշադրության են արժանի:',
    shareMessage: 'Ձեր ցիկլը՝ գերազանց առողջական ցուցանիշ — AWA',
  },
  tg: {
    badge: 'ДАВРА ВА ҲАЙЗ',
    title: 'Давраи шумо, нишондиҳандаи\nаъломи саломатӣ',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Чаро давра баъзан «нишони ҳаётии панҷум» номида мешавад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Давраи шумо: инъикоси бадани шумо',
      'Давраи «муқаррарӣ» чист?',
      'Тағйироте, ки бояд пайгирӣ кард',
      'Ин тағйирот чиро метавонанд нишон диҳанд?',
      'Пайгирии давра барои беҳтар шинохтани худ',
      'Кай бояд маслиҳат пурсид?',
      'Донистан хуб аст',
    ],
    observeLabels: [
      'Дарозии давра',
      'Давомнокии ҳайз',
      'Ҷараёни ҳайз',
      'Дард',
      'Тарашшуҳи маҳбал',
      'Кайфият',
      'Қувват / хастагӣ',
      'Нишонаҳои такроршавандаи дигар',
    ],
    factorLabels: [
      'Стресс',
      'Камхобӣ',
      'Тағйироти назарраси вазн',
      'Фаъолияти ҷисмонии хеле шадид',
      'Тағйироти гормонӣ',
      'Пешгирӣ аз ҳомиладорӣ',
      'Баъзе ҳолатҳои тиббӣ',
    ],
    s1Body1:
      'Давраи ҳайз зери таъсири фаъолияти гормонии бадан дар давоми моҳ қарор дорад. Омӯхтани мушоҳидаи он метавонад ба шумо кумак кунад беҳтар бифаҳмед, ки бадани шумо чӣ тавр кор мекунад, бе он ки ҳама чизро ба таври муфассал таҳлил кунед.',
    s1Body2: 'Инҳо муфидтарин чизҳое мебошанд, ки бояд мушоҳида кард:',
    s2Body1:
      'Як давраи комил вуҷуд надорад: ҳар бадан суръати худро дорад ва ин суръат аз моҳ ба моҳ низ андаке фарқ карда метавонад. Давра одатан мунтазам ҳисобида мешавад, вақте ки он байни 21 ва 35 рӯз давом кунад ва ҳайз аксар вақт 3 то 7 рӯз давом мекунад.',
    s2Body2:
      'Ин рақамҳо миёна мебошанд: тағйироти андак комилан муқаррарӣ боқӣ мемонад, хусусан пас аз балоғат, пас аз таваллуд ё ҳангоми наздик шудани менопауза.',
    s3Body1:
      'Баъзе тағйирот сазовори мушоҳидаи бодиққаттаранд, масалан:',
    changesToWatch: [
      'Тағйироти равшани мунтазамии давра',
      'Ҳайзи ба таври назаррас бештар аз муқаррарӣ',
      'Дарди ғайриоддӣ қавӣ ё доимӣ',
      'Набудани дарозмуддати ҳайз',
      'Хунравӣ байни ҳайзҳо',
      'Тағйироти назарраси дар чанд давра такроршаванда',
    ],
    s3Body2:
      'Як давраи ғайриоддии ягона худ ба худ маънои мушкили саломатиро надорад: бадан метавонад ба омилҳои гуногун муваққатан вокуниш нишон диҳад.',
    s4Body1:
      'Ин тағйирот баъзан метавонад бо якчанд омил алоқаманд бошад, бидуни он ки ҳатман мушкил бошад:',
    s4Body2:
      'Инҳо танҳо баъзе тавзеҳоти имконпазир дар қатори дигарон мебошанд: онҳо ҳеҷ гоҳ маслиҳати мутахассиси соҳаи тибро иваз намекунанд.',
    s5VisualTitle: 'Мушоҳидаи суръати худ',
    s5VisualText:
      'Қайд кардани санаҳо, ҷараён ё эҳсосоти худ ба шумо кумак мекунад одатҳои худро моҳ ба моҳ бишносед.',
    s5Body:
      'Рӯзи аввали ҳайз, давомнокӣ, ҷараён, дард, кайфият, қувват ё тарашшуҳи маҳбал ҳама чизҳое мебошанд, ки бо мурури замон қайд карда метавонед. Мақсад муқоисаи давраи шумо бо давраи каси дигар нест, балки беҳтар шинохтани он аст, ки барои шумо одатӣ аст ва чӣ аз он фарқ мекунад.',
    s6Body1:
      'Комилан муқаррарӣ аст, ки дар бораи давраи худ савол дошта бошед. Машварати тиббӣ метавонад дар баъзе вазъиятҳо муфид бошад, масалан:',
    whenToAsk: [
      'Тағйироти назарраси дар чанд давра идомаёфта',
      'Дарде, ки шуморо аз фаъолияти одатӣ бозмедорад',
      'Ҳайзи хеле зиёд',
      'Набудани дарозмуддати ҳайз',
      'Хунравии ғайриоддӣ',
      'Ҳар нишонаи доимие, ки шуморо нигарон мекунад',
    ],
    s6Body2:
      'Гап задан бо мутахассиси соҳаи тиб метавонад ба шумо кумак кунад оромӣ ёбед ё, агар лозим бошад, дастгирии мувофиқ гиред — ин худ ба худ ҳеҷ гоҳ сабаби нигаронӣ нест.',
    tipText:
      'Давра набояд комилан мунтазам бошад, то муқаррарӣ бошад. Донистани суръати одатии худ аксар вақт аз ҷустуҷӯи дарозии идеалӣ муфидтар аст.',
    finalBody:
      'Давраи ҳайзии шумо яке аз нишондиҳандаҳои бисёри саломатии шумост. Мунтазам пайгирӣ кардани он метавонад ба шумо кумак кунад бадани худро беҳтар бифаҳмед ва бо мурури замон тағйиротеро, ки диққати махсус мегиранд, мушоҳида кунед.',
    shareMessage: 'Давраи шумо, нишондиҳандаи аъломи саломатӣ — AWA',
  },
  ky: {
    badge: 'ЦИКЛ ЖАНА ЕТЕК КИРИМДЕР',
    title: 'Циклиңиз — ден соолуктун\nэң сонун көрсөткүчү',
    metaDuration: '7 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Цикл эмне үчүн кээде «бешинчи маанилүү көрсөткүч» деп аталат.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Циклиңиз: денеңиздин чагылышы',
      '«Нормалдуу» цикл деген эмне?',
      'Байкалууга тийиш болгон өзгөрүүлөр',
      'Бул өзгөрүүлөр эмнени көрсөтүшү мүмкүн?',
      'Өзүңүздү жакшыраак таануу үчүн циклиңизди көзөмөлдөө',
      'Кеңешти качан сурап кайрылуу керек?',
      'Билүү пайдалуу',
    ],
    observeLabels: [
      'Циклдин узактыгы',
      'Етек киримдин узактыгы',
      'Етек кирим агымы',
      'Оору',
      'Кынаптан бөлүнүп чыгуу',
      'Маанай',
      'Энергия / чарчоо',
      'Башка кайталанган белгилер',
    ],
    factorLabels: [
      'Стресс',
      'Уйкунун жетишсиздиги',
      'Салмактын олуттуу өзгөрүшү',
      'Өтө интенсивдүү физикалык активдүүлүк',
      'Гормондук өзгөрүүлөр',
      'Контрацепция',
      'Айрым медициналык абалдар',
    ],
    s1Body1:
      'Етек кирим цикли айдын ичинде организмдин гормондук активдүүлүгүнүн таасири астында болот. Аны байкоону үйрөнүү баарын майда-чүйдөсүнө чейин талдабастан, денеңиздин кантип иштээрин жакшыраак түшүнүүгө жардам бериши мүмкүн.',
    s1Body2: 'Байкоого эң пайдалуу нерселер мына булар:',
    s2Body1:
      'Бирден-бир кемчиликсиз цикл жок: ар бир дененин өз ритми бар жана бул ритм айдан айга бир аз айырмаланышы мүмкүн. Цикл узактыгы 21 менен 35 күндүн ортосунда болгондо, адатта, туруктуу деп эсептелет, ал эми етек кирим көбүнчө 3–7 күн созулат.',
    s2Body2:
      'Бул сандар орточо маанилер: бир аз айырмачылыктар таптакыр кадимки бойдон калат, айрыкча балагатка жеткенден кийин, төрөттөн кийин же менопауза жакындаганда.',
    s3Body1:
      'Айрым өзгөрүүлөрдү бир аз кылдаттыраак байкоого татыйт, мисалы:',
    changesToWatch: [
      'Циклдин үзгүлтүксүздүгүнүн айкын өзгөрүшү',
      'Адаттагыга караганда байкалаарлык көп етек кирим',
      'Адаттан тыш күчтүү же улана берген оору',
      'Етек кирим узак убакыт болбой калуу',
      'Етек киримдердин ортосунда кан кетүү',
      'Бир нече цикл бою кайталанган олуттуу өзгөрүү',
    ],
    s3Body2:
      'Бир жолку адаттан тыш цикл автоматтык түрдө ден соолук көйгөйүн билдирбейт: организм ар кандай факторлорго убактылуу реакция бере алат.',
    s4Body1:
      'Бул өзгөрүүлөр кээде бир нече факторлор менен байланышкан болушу мүмкүн, сөзсүз көйгөй болбостон:',
    s4Body2:
      'Булар башкалардын арасындагы мүмкүн болгон түшүндүрмөлөрдүн айрымдары гана: алар эч качан ден соолук сактоо адисинин кеңешин алмаштырбайт.',
    s5VisualTitle: 'Өз ритмиңизди байкоо',
    s5VisualText:
      'Күндөрүңүздү, агымды же өзүңүздү кандай сезгениңизди жазып туруу айдан айга адаттарыңызды таанууга жардам берет.',
    s5Body:
      'Етек киримиңиздин биринчи күнү, анын узактыгы, агым, оору, маанай, энергия же кынаптан бөлүнүп чыгуу — буларды убакыттын өтүшү менен жазып турсаңыз болот. Максат — циклиңизди башка бирөөнүкү менен салыштыруу эмес, өзүңүз үчүн эмне адаттагыдай экенин жана эмне андан айырмаланарын жакшыраак таануу.',
    s6Body1:
      'Циклиңиз боюнча суроолордун болушу таптакыр кадимки көрүнүш. Айрым учурларда медициналык кеңеш сурап кайрылуу пайдалуу болушу мүмкүн, мисалы:',
    whenToAsk: [
      'Бир нече цикл бою уланган олуттуу өзгөрүүлөр',
      'Адаттагы иштериңизге тоскоол болгон оору',
      'Өтө көп етек кирим',
      'Етек кирим узак убакыт болбой калуу',
      'Адаттан тыш кан кетүү',
      'Тынчсыздандырган ар кандай улана берген белги',
    ],
    s6Body2:
      'Ден соолук сактоо адиси менен сүйлөшүү көңүлүңүздү тынчтандырууга же керек болсо туура колдоо алууга жардам бериши мүмкүн — бул өзү эч качан санааркоого себеп эмес.',
    tipText:
      'Цикл нормалдуу болуш үчүн кемчиликсиз туруктуу болушу шарт эмес. Өзүңүздүн адаттагы ритмиңизди билүү идеалдуу узактыкты издегенден көбүнчө пайдалуураак.',
    finalBody:
      'Етек кирим циклиңиз ден соолугуңуздун көптөгөн көрсөткүчтөрүнүн бири. Аны үзгүлтүксүз көзөмөлдөө денеңизди жакшыраак түшүнүүгө жана убакыттын өтүшү менен өзгөчө көңүл бурууга татыктуу өзгөрүүлөрдү байкоого жардам бериши мүмкүн.',
    shareMessage: 'Циклиңиз — ден соолуктун эң сонун көрсөткүчү — AWA',
  },
  tk: {
    badge: 'SIKL WE AÝBAŞY',
    title: 'Sikliňiz, saglygyň\nbeýik görkezijisi',
    metaDuration: '7 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Sikliň käwagt näme üçin «bäşinji möhüm alamat» diýip atlandyrylýandygy.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Sikliňiz: bedeniňiziň aňlatmasy',
      '«Adaty» sikl näme?',
      'Üns bermeli üýtgeşmeler',
      'Bu üýtgeşmeler nämäni görkezip biler?',
      'Özüňizi has gowy tanamak üçin sikliňizi yzarlamak',
      'Maslahat haçan soramaly?',
      'Bilmek peýdaly',
    ],
    observeLabels: [
      'Sikliň uzynlygy',
      'Aýbaşynyň uzynlygy',
      'Aýbaşy gan akmasy',
      'Agyry',
      'Jynsy ýoldan bölünip çykýan suwuklyk',
      'Keýp',
      'Energiýa / ýadawlyk',
      'Beýleki gaýtalanýan alamatlar',
    ],
    factorLabels: [
      'Stres',
      'Uky ýetmezçiligi',
      'Agramyň ep-esli üýtgemegi',
      'Gaty güýçli fiziki işjeňlik',
      'Gormonal üýtgeşmeler',
      'Göwrelilikden goranyş',
      'Käbir lukmançylyk ýagdaýlary',
    ],
    s1Body1:
      'Aýbaşy sikli bedeniň aý dowamyndaky gormonal işjeňliginiň täsiri astynda bolýar. Ony synlamagy öwrenmek hemme zady jikme-jik seljermek zerurlygy bolmazdan, bedeniňiziň nähili işleýändigini has gowy düşünmäge kömek edip biler.',
    s1Body2: 'Bellemäge iň peýdaly zatlar:',
    s2Body1:
      'Ýeke-täk kämil sikl ýok: her bedeniň öz ritmi bar we bu ritm aýdan aýa-da az-kem üýtgäp biler. Sikl adatça 21–35 gün aralygynda dowam edende yzygiderli hasaplanýar, aýbaşy bolsa köplenç 3–7 gün dowam edýär.',
    s2Body2:
      'Bu sanlar ortaça bahalar: az-kem tapawutlar, aýratyn-da ýetginjeklikden soň, dograndan soň ýa-da menopauza ýakynlaşanda, doly adaty bolup galýar.',
    s3Body1:
      'Käbir üýtgeşmelere has ýakyndan üns bermäge mynasyp, meselem:',
    changesToWatch: [
      'Sikl yzygiderliliginiň aýdyň üýtgemegi',
      'Adatdakydan aýdyň has köp aýbaşy',
      'Adaty däl güýçli ýa-da dowamly agyry',
      'Aýbaşynyň uzak wagt bolmazlygy',
      'Aýbaşylaryň arasynda gan akmasy',
      'Birnäçe sikl dowamynda gaýtalanýan möhüm üýtgeşme',
    ],
    s3Body2:
      'Ýeke-täk, aýry-aýry adaty däl sikl saglyk meselesini awtomatiki aňlatmaýar: bedeniň köp dürli faktora wagtlaýyn reaksiýa bermegi mümkin.',
    s4Body1:
      'Bu üýtgeşmeler käwagt hökman kynçylyk bolmazdan, birnäçe faktora baglanyşykly bolup biler:',
    s4Body2:
      'Bu diňe mümkin düşündirişleriň käbiri: olar saglyk hünärmeniniň maslahatyny hiç haçan çalyşmaýar.',
    s5VisualTitle: 'Öz ritmiňizi synlamak',
    s5VisualText:
      'Seneleriňizi, gan akmasyny ýa-da özüňizi nähili duýýandygyňyzy bellemek aý-aýdan endikleriňizi tanamaga kömek edýär.',
    s5Body:
      'Aýbaşyňyzyň ilkinji güni, uzynlygy, gan akmasy, agyry, keýp, energiýa ýa-da jynsy ýoldan bölünip çykýan suwuklyk wagtyň geçmegi bilen bellemäge bolýan zatlar. Maksat sikliňizi başga birinikiň bilen deňeşdirmek däl-de, özüňiz üçin nämäniň adatydygyny we nämäniň tapawutlanýandygyny has gowy tanamak.',
    s6Body1:
      'Sikliňiz barada soraglaryňyzyň bolmagy doly adaty zat. Käbir ýagdaýlarda lukmançylyk maslahatyny almak peýdaly bolup biler, meselem:',
    whenToAsk: [
      'Birnäçe sikl dowamynda saklanýan möhüm üýtgeşmeler',
      'Adaty işjeňligiňize päsgel berýän agyry',
      'Gaty köp aýbaşy',
      'Aýbaşynyň uzak wagt bolmazlygy',
      'Adaty däl gan akma',
      'Sizi alada goýýan islendik dowamly alamat',
    ],
    s6Body2:
      'Saglyk hünärmeni bilen gürleşmek köňlüňizi rahatlandyryp ýa-da zerur bolsa, size dogry goldaw almaga kömek edip biler — ol özi hiç haçan alada üçin sebäp däl.',
    tipText:
      'Sikl adaty bolmak üçin doly yzygiderli bolmaly däl. Öz adaty ritmiňizi bilmek köplenç ideal uzynlygy gözlemekden has peýdaly.',
    finalBody:
      'Aýbaşy sikliňiz saglygyňyzyň köp görkezijileriniň biri. Ony yzygiderli yzarlamak bedeniňizi has gowy düşünmäge we wagtyň geçmegi bilen aýratyn üns talap edýän üýtgeşmeleri görmäge kömek edip biler.',
    shareMessage: 'Sikliňiz, saglygyň beýik görkezijisi — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function CycleVitalSignArticleScreen({
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

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>{content.title}</AwaText>

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

          <AwaText variant="bodyMedium" style={styles.intro}>{content.intro}</AwaText>

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.s1Body1}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.s1Body2}</AwaText>

          <View style={styles.daily}>
            {OBSERVE_ICONS.map((icon, index) => (
              <View key={content.observeLabels[index]} style={styles.dailyItem}>
                <MaterialDesignIcons name={icon as never} color={theme.colors.primary} size={25} />
                <AwaText variant="bodySmall" style={styles.dailyText}>{content.observeLabels[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.s2Body1}</AwaText>

          <Image
            source={require('../../assets/images/library/regular-cycle-balance.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <AwaText variant="bodyMedium" style={styles.body}>{content.s2Body2}</AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.s3Body1}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alertList}>
            {content.changesToWatch.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="bodyMedium" style={styles.body}>{content.s3Body2}</AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.s4Body1}</AwaText>

          <View style={styles.daily}>
            {FACTOR_ICONS.map((icon, index) => (
              <View key={content.factorLabels[index]} style={styles.dailyItem}>
                <MaterialDesignIcons name={icon as never} color={theme.colors.primary} size={25} />
                <AwaText variant="bodySmall" style={styles.dailyText}>{content.factorLabels[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="bodyMedium" style={styles.body}>{content.s4Body2}</AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={require('../../assets/images/library/regular-cycle-calendar.png')}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>{content.s5VisualTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>{content.s5VisualText}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="bodyMedium" style={styles.body}>{content.s5Body}</AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.s6Body1}</AwaText>

          <Image
            source={require('../../assets/images/library/regular-cycle-consult.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.whenToAsk.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="bodyMedium" style={styles.body}>{content.s6Body2}</AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>7. {content.topics[6]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.topics[6]}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tipText}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="bodyMedium" style={styles.body}>{content.finalBody}</AwaText>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
    </View>
  );
}

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
    contentNumber: {width: 24},
    contentText: {flex: 1},
    h2: {
      marginTop: 24,
    },
    body: {marginTop: 8},
    wideImage: {width: '100%', height: 120, marginTop: 16, borderRadius: 12},
    visualCard: {
      marginTop: 16,
      minHeight: 98,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    visualImage: {width: 72, height: 72, borderRadius: 12},
    visualCopy: {flex: 1, marginLeft: 12},
    visualText: {marginTop: 4},
    daily: {marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
    dailyItem: {
      width: '48.7%',
      minHeight: 108,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },
    dailyText: {
      marginTop: 8,
      textAlign: 'center',
    },
    checkList: {
      marginTop: 12,
      padding: 12,
    },
    alertList: {
      marginTop: 12,
      padding: 12,
      backgroundColor: withAlpha(theme.colors.warning, 0.12),
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 8,
    },
    checkText: {flex: 1},
    tip: {
      marginTop: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tipCopy: {flex: 1, marginLeft: 12},
    tipText: {marginTop: 3},
  });
}
