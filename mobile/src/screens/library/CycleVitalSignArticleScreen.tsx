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
const CONTENT = {
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
} as const;

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
