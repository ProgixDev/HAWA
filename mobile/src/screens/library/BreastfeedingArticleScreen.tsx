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

const ID = 'breastfeeding-debuter-allaitement';

const HERO = require('../../assets/images/library/featured-tracking-hero.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons/numbers stay language-neutral; only TEXT moves into the       */
/* bilingual CONTENT object below, keyed by index to stay aligned with these. */
/* -------------------------------------------------------------------------- */

const STARTING_STEPS_META = [
  {icon: 'baby-face-outline', number: '01'},
  {icon: 'clock-outline', number: '02'},
  {icon: 'repeat', number: '03'},
  {icon: 'chart-line', number: '04'},
] as const;

const SIGNALS_META = [
  {icon: 'clock-outline'},
  {icon: 'baby-face-outline'},
  {icon: 'water-outline'},
] as const;

const LATCH_POINTS_META = [
  {icon: 'account-child-outline'},
  {icon: 'gesture-tap'},
  {icon: 'heart-outline'},
  {icon: 'check-circle-outline'},
] as const;

const SUPPORT_OPTIONS_META = [
  {icon: 'account-heart-outline'},
  {icon: 'doctor'},
  {icon: 'human-male-board-poll'},
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('Breastfeeding', {
  fr: {
    shareMessage: 'Débuter l’allaitement en confiance — AWA',
    badge: 'POST-PARTUM • ALLAITEMENT',
    title: 'Débuter l’allaitement\nen confiance',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les premiers jours d’allaitement sont une période d’apprentissage pour le bébé comme pour la mère. Mise au sein, rythme, position et observation permettent progressivement de trouver un fonctionnement confortable.',
    contentsTitle: 'Dans cet article',
    contentsSubtitle: 'Les essentiels pour commencer',
    tocItems: [
      'Les premières étapes',
      'Les signaux à observer',
      'Une bonne prise du sein',
      'Quand demander de l’aide',
      'À retenir',
    ],
    h2Step1: '1. Les premières étapes',
    body1: 'Le démarrage de l’allaitement se construit progressivement. Les premières heures puis les premiers jours permettent au bébé et à sa mère d’apprendre ensemble.',
    timelineTitle: 'Le démarrage, étape par étape',
    timelineSubtitle: 'Un repère simple, sans pression',
    startingSteps: [
      {title: 'Après la naissance', text: 'Le contact peau à peau et une première mise au sein peuvent favoriser le démarrage.'},
      {title: 'Les premières heures', text: 'Le bébé peut téter fréquemment. Il est normal que le rythme varie.'},
      {title: 'Les premiers jours', text: 'Les tétées deviennent progressivement un repère pour le bébé et la mère.'},
      {title: 'Installation progressive', text: 'La lactation s’adapte progressivement aux besoins du bébé.'},
    ],
    h2Step2: '2. Les signaux à observer',
    body2: 'Plutôt que de se concentrer uniquement sur l’horloge, il peut être utile d’observer les signes d’éveil, les tétées et l’évolution des couches.',
    signals: [
      {title: 'Un rythme fréquent', text: 'Un nouveau-né peut demander souvent le sein, parfois 8 à 12 fois par 24 heures.'},
      {title: 'Les signes d’éveil', text: 'Le bébé peut bouger, ouvrir la bouche ou chercher le sein lorsqu’il commence à avoir faim.'},
      {title: 'Les couches', text: 'L’évolution des couches mouillées et des selles fait partie des éléments observés au quotidien.'},
    ],
    h2Step3: '3. Une bonne prise du sein',
    body3: 'Une position confortable et une prise efficace peuvent faciliter la tétée. Si la douleur est importante ou persistante, un professionnel peut vérifier la position et la prise du sein.',
    latchTitle: 'Les 4 repères de confort',
    latchSubtitle: 'Une vérification simple pendant la tétée',
    latchCenterTitle: 'Bébé + sein',
    latchCenterSubtitle: 'Position confortable',
    latchPoints: [
      {title: 'Bébé bien positionné', text: 'Le bébé est proche du corps et sa tête reste dans un axe confortable.'},
      {title: 'Bouche grande ouverte', text: 'Attendre une ouverture suffisante avant de proposer le sein.'},
      {title: 'Prise confortable', text: 'Une prise efficace ne devrait pas provoquer une douleur importante ou persistante.'},
      {title: 'Succion régulière', text: 'Des mouvements de succion et de déglutition peuvent être observés pendant la tétée.'},
    ],
    h2Step4: '4. Quand demander de l’aide ?',
    body4: 'Il n’est pas nécessaire d’attendre que les difficultés deviennent importantes. Une personne formée peut aider à vérifier la position, la prise du sein ou les besoins du bébé.',
    supportOptions: [
      {title: 'Sage-femme', text: 'Peut accompagner les premières mises au sein.'},
      {title: 'Professionnel de santé', text: 'Peut vérifier la santé du bébé et de la mère.'},
      {title: 'Consultante en lactation', text: 'Peut aider lorsque la mise au sein ou la prise du sein pose difficulté.'},
    ],
    infoTitle: 'Chaque allaitement est différent',
    infoText: 'Les premières journées peuvent être très variables. Le rythme des tétées et la quantité de lait peuvent évoluer progressivement. Si quelque chose t’inquiète, demande conseil à un professionnel de santé.',
    h2Summary: 'À retenir',
    summaryItems: [
      'Les premières tétées sont une période d’apprentissage pour le bébé et la mère.',
      'Un nouveau-né peut demander fréquemment le sein.',
      'Une position confortable et une bonne prise du sein sont importantes.',
      'L’observation des signes du bébé est plus utile qu’une recherche de rythme parfaitement fixe.',
      'Une sage-femme ou une consultante en lactation peut accompagner les premières difficultés.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas l’accompagnement personnalisé d’un professionnel de santé.',
  },
  en: {
    shareMessage: 'Starting breastfeeding with confidence — AWA',
    badge: 'POSTPARTUM • BREASTFEEDING',
    title: 'Starting breastfeeding\nwith confidence',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The first days of breastfeeding are a learning period for both baby and mother. Latching, rhythm, positioning, and observation gradually help you find what feels comfortable.',
    contentsTitle: 'In this article',
    contentsSubtitle: 'The essentials to get started',
    tocItems: [
      'The first steps',
      'Signs to watch for',
      'A good latch',
      'When to ask for help',
      'Key takeaways',
    ],
    h2Step1: '1. The first steps',
    body1: 'Breastfeeding gets established gradually. The first hours, then the first days, give baby and mother time to learn together.',
    timelineTitle: 'Getting started, step by step',
    timelineSubtitle: 'A simple guide, with no pressure',
    startingSteps: [
      {title: 'After birth', text: 'Skin-to-skin contact and an early latch can help breastfeeding get off to a good start.'},
      {title: 'The first hours', text: 'Baby may feed frequently. It’s normal for the rhythm to vary.'},
      {title: 'The first days', text: 'Feeds gradually become a shared rhythm for baby and mother.'},
      {title: 'Settling into a rhythm', text: 'Milk supply gradually adjusts to baby’s needs.'},
    ],
    h2Step2: '2. Signs to watch for',
    body2: 'Rather than focusing only on the clock, it can help to watch baby’s waking signs, feeds, and diaper patterns.',
    signals: [
      {title: 'A frequent rhythm', text: 'A newborn may ask to feed often, sometimes 8 to 12 times over 24 hours.'},
      {title: 'Waking signs', text: 'Baby may move, open their mouth, or root for the breast when starting to feel hungry.'},
      {title: 'Diapers', text: 'The number of wet and dirty diapers is one of the things to keep an eye on day to day.'},
    ],
    h2Step3: '3. A good latch',
    body3: 'A comfortable position and an effective latch can make feeds easier. If pain is significant or persistent, a healthcare professional can check positioning and latch.',
    latchTitle: 'The 4 comfort markers',
    latchSubtitle: 'A simple check during feeds',
    latchCenterTitle: 'Baby + breast',
    latchCenterSubtitle: 'Comfortable position',
    latchPoints: [
      {title: 'Baby well positioned', text: 'Baby is held close to the body, with their head in a comfortable alignment.'},
      {title: 'Mouth wide open', text: 'Wait for a wide-enough mouth opening before offering the breast.'},
      {title: 'Comfortable latch', text: 'An effective latch shouldn’t cause significant or persistent pain.'},
      {title: 'Regular suckling', text: 'Suckling and swallowing movements can be observed during the feed.'},
    ],
    h2Step4: '4. When to ask for help?',
    body4: 'There’s no need to wait until difficulties become serious. A trained professional can help check positioning, latch, or baby’s needs.',
    supportOptions: [
      {title: 'Midwife', text: 'Can support you through the first latches.'},
      {title: 'Healthcare professional', text: 'Can check on the health of baby and mother.'},
      {title: 'Lactation consultant', text: 'Can help when latching proves difficult.'},
    ],
    infoTitle: 'Every breastfeeding journey is different',
    infoText: 'The first days can vary a great deal. The rhythm of feeds and the amount of milk may change gradually over time. If something worries you, ask a healthcare professional for advice.',
    h2Summary: 'Key takeaways',
    summaryItems: [
      'The first feeds are a learning period for baby and mother.',
      'A newborn may ask to feed frequently.',
      'A comfortable position and a good latch matter.',
      'Watching baby’s cues is more useful than aiming for a perfectly fixed schedule.',
      'A midwife or lactation consultant can help you through early difficulties.',
    ],
    disclaimerText: 'Informational content. This article does not replace personalized guidance from a healthcare professional.',
  },
  es: {
    shareMessage: 'Empezar la lactancia con confianza — AWA',
    badge: 'POSPARTO • LACTANCIA',
    title: 'Empezar la lactancia\ncon confianza',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Los primeros días de lactancia son un periodo de aprendizaje tanto para el bebé como para la madre. El agarre al pecho, el ritmo, la posición y la observación permiten encontrar progresivamente una forma de funcionar cómoda.',
    contentsTitle: 'En este artículo',
    contentsSubtitle: 'Lo esencial para empezar',
    tocItems: [
      'Las primeras etapas',
      'Las señales a observar',
      'Un buen agarre al pecho',
      'Cuándo pedir ayuda',
      'Para recordar',
    ],
    h2Step1: '1. Las primeras etapas',
    body1: 'El inicio de la lactancia se construye progresivamente. Las primeras horas y después los primeros días permiten al bebé y a su madre aprender juntos.',
    timelineTitle: 'El inicio, paso a paso',
    timelineSubtitle: 'Una referencia sencilla, sin presión',
    startingSteps: [
      {title: 'Después del nacimiento', text: 'El contacto piel con piel y un primer agarre al pecho pueden favorecer el inicio.'},
      {title: 'Las primeras horas', text: 'El bebé puede mamar con frecuencia. Es normal que el ritmo varíe.'},
      {title: 'Los primeros días', text: 'Las tomas se convierten progresivamente en una referencia para el bebé y la madre.'},
      {title: 'Instauración progresiva', text: 'La lactancia se adapta progresivamente a las necesidades del bebé.'},
    ],
    h2Step2: '2. Las señales a observar',
    body2: 'En lugar de centrarte únicamente en el reloj, puede ser útil observar las señales de que el bebé está despierto, las tomas y la evolución de los pañales.',
    signals: [
      {title: 'Un ritmo frecuente', text: 'Un recién nacido puede pedir el pecho a menudo, a veces de 8 a 12 veces en 24 horas.'},
      {title: 'Las señales de hambre', text: 'El bebé puede moverse, abrir la boca o buscar el pecho cuando empieza a tener hambre.'},
      {title: 'Los pañales', text: 'La evolución de los pañales mojados y las deposiciones forma parte de lo que se observa en el día a día.'},
    ],
    h2Step3: '3. Un buen agarre al pecho',
    body3: 'Una posición cómoda y un agarre eficaz pueden facilitar la toma. Si el dolor es importante o persistente, un profesional puede comprobar la posición y el agarre al pecho.',
    latchTitle: 'Los 4 indicadores de comodidad',
    latchSubtitle: 'Una comprobación sencilla durante la toma',
    latchCenterTitle: 'Bebé + pecho',
    latchCenterSubtitle: 'Posición cómoda',
    latchPoints: [
      {title: 'Bebé bien colocado', text: 'El bebé está cerca del cuerpo y su cabeza se mantiene en un eje cómodo.'},
      {title: 'Boca bien abierta', text: 'Espera a que la boca esté lo bastante abierta antes de ofrecer el pecho.'},
      {title: 'Agarre cómodo', text: 'Un agarre eficaz no debería provocar un dolor importante o persistente.'},
      {title: 'Succión regular', text: 'Durante la toma pueden observarse movimientos de succión y deglución.'},
    ],
    h2Step4: '4. ¿Cuándo pedir ayuda?',
    body4: 'No es necesario esperar a que las dificultades se vuelvan importantes. Una persona formada puede ayudar a comprobar la posición, el agarre al pecho o las necesidades del bebé.',
    supportOptions: [
      {title: 'Partera', text: 'Puede acompañarte en los primeros agarres al pecho.'},
      {title: 'Profesional de la salud', text: 'Puede comprobar la salud del bebé y de la madre.'},
      {title: 'Consultora de lactancia', text: 'Puede ayudar cuando el agarre al pecho resulta difícil.'},
    ],
    infoTitle: 'Cada lactancia es diferente',
    infoText: 'Los primeros días pueden ser muy variables. El ritmo de las tomas y la cantidad de leche pueden evolucionar progresivamente. Si algo te preocupa, pide consejo a un profesional de la salud.',
    h2Summary: 'Para recordar',
    summaryItems: [
      'Las primeras tomas son un periodo de aprendizaje para el bebé y la madre.',
      'Un recién nacido puede pedir el pecho con frecuencia.',
      'Una posición cómoda y un buen agarre al pecho son importantes.',
      'Observar las señales del bebé es más útil que buscar un ritmo perfectamente fijo.',
      'Una partera o una consultora de lactancia puede acompañarte en las primeras dificultades.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye el acompañamiento personalizado de un profesional de la salud.',
  },
  it: {
    shareMessage: 'Iniziare l’allattamento con fiducia — AWA',
    badge: 'POST-PARTUM • ALLATTAMENTO',
    title: 'Iniziare l’allattamento\ncon fiducia',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'I primi giorni di allattamento sono un periodo di apprendimento sia per il neonato che per la mamma. Attacco, ritmo, posizione e osservazione ti aiutano a poco a poco a capire che cosa ti fa sentire più a tuo agio.',
    contentsTitle: 'In questo articolo',
    contentsSubtitle: 'L’essenziale per iniziare',
    tocItems: [
      'I primi passi',
      'Segnali da osservare',
      'Un buon attacco',
      'Quando chiedere aiuto',
      'Punti chiave',
    ],
    h2Step1: '1. I primi passi',
    body1: 'L’allattamento si avvia gradualmente. Le prime ore, poi i primi giorni, danno al neonato e alla mamma il tempo di imparare insieme.',
    timelineTitle: 'Iniziare, passo dopo passo',
    timelineSubtitle: 'Una guida semplice, senza pressioni',
    startingSteps: [
      {
        title: 'Dopo il parto',
        text: 'Il contatto pelle a pelle e un attacco precoce possono aiutare l’allattamento a partire bene.',
      },
      {
        title: 'Le prime ore',
        text: 'Il neonato può mangiare spesso. È normale che il ritmo cambi.',
      },
      {
        title: 'I primi giorni',
        text: 'Le poppate diventano a poco a poco un ritmo condiviso tra neonato e mamma.',
      },
      {
        title: 'Trovare un ritmo',
        text: 'La produzione di latte si adatta gradualmente ai bisogni del neonato.',
      },
    ],
    h2Step2: '2. Segnali da osservare',
    body2: 'Più che guardare solo l’orologio, può essere utile osservare i segnali di risveglio del neonato, le poppate e i pannolini.',
    signals: [
      {
        title: 'Un ritmo frequente',
        text: 'Un neonato può chiedere di mangiare spesso, a volte da 8 a 12 volte nell’arco di 24 ore.',
      },
      {
        title: 'Segnali di risveglio',
        text: 'Il neonato può muoversi, aprire la bocca o cercare il seno quando inizia ad avere fame.',
      },
      {
        title: 'Pannolini',
        text: 'Il numero di pannolini bagnati e sporchi è una delle cose da tenere d’occhio giorno per giorno.',
      },
    ],
    h2Step3: '3. Un buon attacco',
    body3: 'Una posizione comoda e un attacco efficace possono rendere le poppate più facili. Se il dolore è forte o persistente, un professionista sanitario può controllare la posizione e l’attacco.',
    latchTitle: 'I 4 punti di comfort',
    latchSubtitle: 'Un semplice controllo durante le poppate',
    latchCenterTitle: 'Neonato + seno',
    latchCenterSubtitle: 'Posizione comoda',
    latchPoints: [
      {
        title: 'Neonato ben posizionato',
        text: 'Il neonato è tenuto vicino al corpo, con la testa in un allineamento comodo.',
      },
      {
        title: 'Bocca ben aperta',
        text: 'Aspetta che la bocca sia abbastanza aperta prima di offrire il seno.',
      },
      {
        title: 'Attacco confortevole',
        text: 'Un attacco efficace non dovrebbe causare un dolore forte o persistente.',
      },
      {
        title: 'Suzione regolare',
        text: 'Durante la poppata si possono osservare i movimenti di suzione e di deglutizione.',
      },
    ],
    h2Step4: '4. Quando chiedere aiuto?',
    body4: 'Non occorre aspettare che le difficoltà diventino gravi. Un professionista formato può aiutare a controllare la posizione, l’attacco o i bisogni del neonato.',
    supportOptions: [
      {
        title: 'Ostetrica',
        text: 'Può accompagnarti nei primi attacchi.',
      },
      {
        title: 'Professionista sanitario',
        text: 'Può controllare la salute del neonato e della mamma.',
      },
      {
        title: 'Consulente per l’allattamento',
        text: 'Può aiutare quando l’attacco risulta difficile.',
      },
    ],
    infoTitle: 'Ogni percorso di allattamento è diverso',
    infoText: 'I primi giorni possono variare molto. Il ritmo delle poppate e la quantità di latte possono cambiare gradualmente nel tempo. Se qualcosa ti preoccupa, chiedi consiglio a un professionista sanitario.',
    h2Summary: 'Punti chiave',
    summaryItems: [
      'Le prime poppate sono un periodo di apprendimento per il neonato e per la mamma.',
      'Un neonato può chiedere di mangiare spesso.',
      'Una posizione comoda e un buon attacco sono importanti.',
      'Osservare i segnali del neonato è più utile che puntare a un orario perfettamente fisso.',
      'Un’ostetrica o una consulente per l’allattamento può aiutarti ad affrontare le difficoltà iniziali.',
    ],
    disclaimerText: 'Contenuto a scopo informativo. Questo articolo non sostituisce le indicazioni personalizzate di un professionista sanitario.',
  },
  tr: {
    shareMessage: 'Emzirmeye güvenle başlamak — AWA',
    badge: 'DOĞUM SONRASI • EMZİRME',
    title: 'Emzirmeye\ngüvenle başlamak',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Emzirmenin ilk günleri hem bebek hem de anne için bir öğrenme dönemidir. Doğru kavrama, ritim, pozisyon ve gözlem, seni rahat ettiren yolu zamanla bulmana yardımcı olur.',
    contentsTitle: 'Bu makalede',
    contentsSubtitle: 'Başlamak için temel bilgiler',
    tocItems: [
      'İlk adımlar',
      'Dikkat edilecek işaretler',
      'İyi bir kavrama',
      'Ne zaman yardım istemeli',
      'Akılda tutulacaklar',
    ],
    h2Step1: '1. İlk adımlar',
    body1: 'Emzirme zamanla oturur. İlk saatler, ardından ilk günler bebeğe ve anneye birlikte öğrenmek için zaman tanır.',
    timelineTitle: 'Adım adım başlangıç',
    timelineSubtitle: 'Baskı olmadan, basit bir rehber',
    startingSteps: [
      {
        title: 'Doğumdan sonra',
        text: 'Ten teması ve erken emzirme, emzirmenin iyi bir başlangıç yapmasına yardımcı olabilir.',
      },
      {
        title: 'İlk saatler',
        text: 'Bebek sık sık emebilir. Ritmin değişken olması normaldir.',
      },
      {
        title: 'İlk günler',
        text: 'Emzirmeler zamanla bebek ve anne için ortak bir ritme dönüşür.',
      },
      {
        title: 'Bir ritme oturmak',
        text: 'Süt miktarı zamanla bebeğin ihtiyaçlarına göre ayarlanır.',
      },
    ],
    h2Step2: '2. Dikkat edilecek işaretler',
    body2: 'Yalnızca saate bakmak yerine bebeğin uyanma işaretlerini, emzirmeleri ve bez düzenini izlemek yardımcı olabilir.',
    signals: [
      {
        title: 'Sık bir ritim',
        text: 'Yenidoğan sık sık emmek isteyebilir; bazen 24 saatte 8 ila 12 kez.',
      },
      {
        title: 'Uyanma işaretleri',
        text: 'Bebek acıkmaya başladığında kıpırdanabilir, ağzını açabilir veya göğsü arayabilir.',
      },
      {
        title: 'Bezler',
        text: 'Islak ve kirli bez sayısı, gün gün takip edilmesi gereken şeylerden biridir.',
      },
    ],
    h2Step3: '3. İyi bir kavrama',
    body3: 'Rahat bir pozisyon ve etkili bir kavrama, emzirmeleri kolaylaştırabilir. Ağrı belirgin veya kalıcıysa bir sağlık profesyoneli pozisyonu ve kavramayı kontrol edebilir.',
    latchTitle: '4 rahatlık işareti',
    latchSubtitle: 'Emzirme sırasında basit bir kontrol',
    latchCenterTitle: 'Bebek + göğüs',
    latchCenterSubtitle: 'Rahat pozisyon',
    latchPoints: [
      {
        title: 'Bebek iyi konumlanmış',
        text: 'Bebek vücuduna yakın tutulur, başı rahat bir hizadadır.',
      },
      {
        title: 'Ağız iyice açık',
        text: 'Göğsü sunmadan önce ağzın yeterince geniş açılmasını bekle.',
      },
      {
        title: 'Rahat bir kavrama',
        text: 'Etkili bir kavrama belirgin veya kalıcı bir ağrıya yol açmamalıdır.',
      },
      {
        title: 'Düzenli emme',
        text: 'Emzirme sırasında emme ve yutma hareketleri gözlemlenebilir.',
      },
    ],
    h2Step4: '4. Ne zaman yardım istemeli?',
    body4: 'Zorlukların ciddileşmesini beklemene gerek yok. Eğitimli bir profesyonel pozisyonu, kavramayı veya bebeğin ihtiyaçlarını kontrol etmene yardımcı olabilir.',
    supportOptions: [
      {
        title: 'Ebe',
        text: 'İlk emzirmelerde sana destek olabilir.',
      },
      {
        title: 'Sağlık profesyoneli',
        text: 'Bebeğin ve annenin sağlığını kontrol edebilir.',
      },
      {
        title: 'Emzirme danışmanı',
        text: 'Kavrama zor olduğunda yardımcı olabilir.',
      },
    ],
    infoTitle: 'Her emzirme yolculuğu farklıdır',
    infoText: 'İlk günler çok farklı geçebilir. Emzirme ritmi ve süt miktarı zamanla değişebilir. Seni endişelendiren bir şey varsa bir sağlık profesyoneline danış.',
    h2Summary: 'Akılda tutulacaklar',
    summaryItems: [
      'İlk emzirmeler bebek ve anne için bir öğrenme dönemidir.',
      'Yenidoğan sık sık emmek isteyebilir.',
      'Rahat bir pozisyon ve iyi bir kavrama önemlidir.',
      'Bebeğin işaretlerini izlemek, kusursuz bir saat düzenini hedeflemekten daha faydalıdır.',
      'Bir ebe veya emzirme danışmanı, ilk zorluklarda sana yardımcı olabilir.',
    ],
    disclaimerText: 'Bilgilendirici içerik. Bu makale, bir sağlık profesyonelinin kişiye özel yönlendirmesinin yerini tutmaz.',
  },
  ru: {
    shareMessage: 'Уверенное начало грудного вскармливания — AWA',
    badge: 'ПОСЛЕРОДОВОЙ ПЕРИОД • ГРУДНОЕ ВСКАРМЛИВАНИЕ',
    title: 'Уверенное начало\nгрудного вскармливания',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Первые дни грудного вскармливания — период обучения и для малыша, и для мамы. Прикладывание, ритм, положение и наблюдение постепенно помогают найти то, что вам комфортно.',
    contentsTitle: 'В этой статье',
    contentsSubtitle: 'Самое важное для начала',
    tocItems: [
      'Первые шаги',
      'На какие признаки обратить внимание',
      'Правильное прикладывание',
      'Когда обратиться за помощью',
      'Главное',
    ],
    h2Step1: '1. Первые шаги',
    body1: 'Грудное вскармливание налаживается постепенно. Первые часы, а затем первые дни дают малышу и маме время научиться вместе.',
    timelineTitle: 'Начало, шаг за шагом',
    timelineSubtitle: 'Простое руководство, без давления',
    startingSteps: [
      {title: 'После родов', text: 'Контакт «кожа к коже» и раннее прикладывание могут помочь грудному вскармливанию хорошо начаться.'},
      {title: 'Первые часы', text: 'Малыш может есть часто. Это нормально, если ритм меняется.'},
      {title: 'Первые дни', text: 'Кормления постепенно превращаются в общий ритм малыша и мамы.'},
      {title: 'Установление ритма', text: 'Количество молока постепенно подстраивается под потребности малыша.'},
    ],
    h2Step2: '2. На какие признаки обратить внимание',
    body2: 'Вместо того чтобы ориентироваться только на часы, полезно наблюдать за признаками пробуждения малыша, кормлениями и подгузниками.',
    signals: [
      {title: 'Частый ритм', text: 'Новорождённый может просить есть часто, иногда от 8 до 12 раз в сутки.'},
      {title: 'Признаки пробуждения', text: 'Когда малыш начинает испытывать голод, он может двигаться, открывать рот или искать грудь.'},
      {title: 'Подгузники', text: 'Количество мокрых и грязных подгузников — одно из того, за чем стоит следить изо дня в день.'},
    ],
    h2Step3: '3. Правильное прикладывание',
    body3: 'Удобное положение и эффективное прикладывание могут облегчить кормления. Если боль сильная или не проходит, медицинский специалист может проверить положение и прикладывание.',
    latchTitle: '4 ориентира комфорта',
    latchSubtitle: 'Простая проверка во время кормления',
    latchCenterTitle: 'Малыш + грудь',
    latchCenterSubtitle: 'Удобное положение',
    latchPoints: [
      {title: 'Малыш хорошо расположен', text: 'Малыш прижат к телу, его голова находится в удобном положении.'},
      {title: 'Рот широко раскрыт', text: 'Дождитесь, пока рот раскроется достаточно широко, прежде чем предлагать грудь.'},
      {title: 'Комфортное прикладывание', text: 'Эффективное прикладывание не должно вызывать сильной или стойкой боли.'},
      {title: 'Ритмичное сосание', text: 'Во время кормления можно наблюдать сосательные и глотательные движения.'},
    ],
    h2Step4: '4. Когда обратиться за помощью?',
    body4: 'Не нужно ждать, пока трудности станут серьёзными. Обученный специалист может помочь проверить положение, прикладывание или потребности малыша.',
    supportOptions: [
      {title: 'Акушерка', text: 'Может поддержать вас во время первых прикладываний.'},
      {title: 'Медицинский специалист', text: 'Может проверить здоровье малыша и мамы.'},
      {title: 'Консультант по грудному вскармливанию', text: 'Может помочь, если прикладывание даётся с трудом.'},
    ],
    infoTitle: 'Путь грудного вскармливания у каждой свой',
    infoText: 'Первые дни могут сильно отличаться. Ритм кормлений и количество молока могут постепенно меняться со временем. Если что-то вас беспокоит, обратитесь за советом к медицинскому специалисту.',
    h2Summary: 'Главное',
    summaryItems: [
      'Первые кормления — период обучения для малыша и мамы.',
      'Новорождённый может просить есть часто.',
      'Важны удобное положение и правильное прикладывание.',
      'Наблюдать за сигналами малыша полезнее, чем стремиться к идеально строгому расписанию.',
      'Акушерка или консультант по грудному вскармливанию может помочь вам справиться с первыми трудностями.',
    ],
    disclaimerText: 'Информационный материал. Эта статья не заменяет индивидуальных рекомендаций медицинского специалиста.',
  },
  de: {
    shareMessage: 'Mit Zuversicht ins Stillen starten — AWA',
    badge: 'WOCHENBETT • STILLEN',
    title: 'Mit Zuversicht\nins Stillen starten',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Die ersten Tage des Stillens sind eine Lernzeit für Baby und Mutter. Das Anlegen, der Rhythmus, die Position und das Beobachten helfen dir nach und nach, herauszufinden, was sich für euch gut anfühlt.',
    contentsTitle: 'In diesem Artikel',
    contentsSubtitle: 'Das Wichtigste für den Anfang',
    tocItems: [
      'Die ersten Schritte',
      'Anzeichen, auf die du achten kannst',
      'Gutes Anlegen',
      'Wann du dir Hilfe holen solltest',
      'Das Wichtigste in Kürze',
    ],
    h2Step1: '1. Die ersten Schritte',
    body1: 'Das Stillen entwickelt sich nach und nach. Die ersten Stunden und dann die ersten Tage geben Baby und Mutter Zeit, gemeinsam zu lernen.',
    timelineTitle: 'Der Start, Schritt für Schritt',
    timelineSubtitle: 'Eine einfache Orientierung, ganz ohne Druck',
    startingSteps: [
      {title: 'Nach der Geburt', text: 'Hautkontakt und ein frühes Anlegen können dem Stillen einen guten Start ermöglichen.'},
      {title: 'Die ersten Stunden', text: 'Das Baby möchte vielleicht häufig trinken. Es ist normal, dass der Rhythmus schwankt.'},
      {title: 'Die ersten Tage', text: 'Aus den Mahlzeiten wird nach und nach ein gemeinsamer Rhythmus für Baby und Mutter.'},
      {title: 'Den Rhythmus finden', text: 'Die Milchmenge passt sich allmählich an die Bedürfnisse des Babys an.'},
    ],
    h2Step2: '2. Anzeichen, auf die du achten kannst',
    body2: 'Statt nur auf die Uhr zu schauen, kann es helfen, auf die Aufwachsignale, die Mahlzeiten und die Windeln deines Babys zu achten.',
    signals: [
      {title: 'Ein häufiger Rhythmus', text: 'Ein Neugeborenes möchte oft trinken, manchmal 8- bis 12-mal innerhalb von 24 Stunden.'},
      {title: 'Aufwachsignale', text: 'Das Baby bewegt sich, öffnet den Mund oder sucht die Brust, wenn es Hunger bekommt.'},
      {title: 'Windeln', text: 'Die Anzahl der nassen und schmutzigen Windeln gehört zu den Dingen, die du im Alltag im Blick behalten kannst.'},
    ],
    h2Step3: '3. Gutes Anlegen',
    body3: 'Eine bequeme Position und ein wirksames Anlegen können das Stillen erleichtern. Wenn die Schmerzen stark sind oder anhalten, kann medizinisches Fachpersonal Position und Anlegen überprüfen.',
    latchTitle: 'Die 4 Anzeichen für Wohlbefinden',
    latchSubtitle: 'Ein einfacher Check während des Stillens',
    latchCenterTitle: 'Baby + Brust',
    latchCenterSubtitle: 'Bequeme Position',
    latchPoints: [
      {title: 'Baby gut positioniert', text: 'Das Baby liegt nah am Körper, der Kopf ist in bequemer Ausrichtung.'},
      {title: 'Mund weit geöffnet', text: 'Warte, bis der Mund weit genug geöffnet ist, bevor du die Brust anbietest.'},
      {title: 'Angenehmes Anlegen', text: 'Ein wirksames Anlegen sollte keine starken oder anhaltenden Schmerzen verursachen.'},
      {title: 'Regelmäßiges Saugen', text: 'Während des Stillens sind Saug- und Schluckbewegungen zu beobachten.'},
    ],
    h2Step4: '4. Wann solltest du dir Hilfe holen?',
    body4: 'Du musst nicht warten, bis die Schwierigkeiten groß werden. Geschultes Fachpersonal kann helfen, Position, Anlegen oder die Bedürfnisse des Babys zu überprüfen.',
    supportOptions: [
      {title: 'Hebamme', text: 'Kann dich bei den ersten Stillmahlzeiten begleiten.'},
      {title: 'Medizinisches Fachpersonal', text: 'Kann die Gesundheit von Baby und Mutter überprüfen.'},
      {title: 'Stillberaterin', text: 'Kann helfen, wenn das Anlegen schwierig ist.'},
    ],
    infoTitle: 'Jeder Stillweg ist anders',
    infoText: 'Die ersten Tage können sehr unterschiedlich verlaufen. Der Rhythmus der Mahlzeiten und die Milchmenge können sich mit der Zeit nach und nach verändern. Wenn dich etwas beunruhigt, lass dich von medizinischem Fachpersonal beraten.',
    h2Summary: 'Das Wichtigste in Kürze',
    summaryItems: [
      'Die ersten Mahlzeiten sind eine Lernzeit für Baby und Mutter.',
      'Ein Neugeborenes möchte vielleicht häufig trinken.',
      'Eine bequeme Position und ein gutes Anlegen sind wichtig.',
      'Auf die Signale deines Babys zu achten ist hilfreicher, als einen starren Zeitplan anzustreben.',
      'Eine Hebamme oder Stillberaterin kann dich bei den ersten Schwierigkeiten unterstützen.',
    ],
    disclaimerText: 'Informationsinhalt. Dieser Artikel ersetzt keine persönliche Beratung durch medizinisches Fachpersonal.',
  },
  zh: {
      shareMessage: '自信地开始母乳喂养 — AWA',
      badge: '产后 • 母乳喂养',
      title: '自信地开始\n母乳喂养',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '母乳喂养的最初几天，是宝宝和妈妈共同学习的阶段。含乳、节奏、姿势和观察，会慢慢帮你找到让自己舒适的方式。',
      contentsTitle: '本文内容',
      contentsSubtitle: '开始所需的基本知识',
      tocItems: [
        '最初的几步',
        '需要留意的信号',
        '良好的含乳',
        '何时寻求帮助',
        '要点回顾',
      ],
      h2Step1: '1. 最初的几步',
      body1: '母乳喂养是逐步建立起来的。最初的几个小时，再到最初的几天，让宝宝和妈妈有时间一起学习。',
      timelineTitle: '一步一步开始',
      timelineSubtitle: '一份简单的指引，没有压力',
      startingSteps: [
        {
          title: '分娩后',
          text: '肌肤接触和早期含乳，有助于母乳喂养顺利开始。',
        },
        {
          title: '最初的几个小时',
          text: '宝宝可能会频繁吃奶。节奏有所变化是正常的。',
        },
        {
          title: '最初的几天',
          text: '喂奶会逐渐成为宝宝和妈妈共同的节奏。',
        },
        {
          title: '节奏逐渐稳定',
          text: '奶量会逐渐与宝宝的需求相适应。',
        },
      ],
      h2Step2: '2. 需要留意的信号',
      body2: '与其只盯着时间，不如留意宝宝醒来的信号、吃奶情况和尿布的情况，这会有所帮助。',
      signals: [
        {
          title: '频繁的节奏',
          text: '新生儿可能会经常要求吃奶，有时 24 小时内会吃 8 到 12 次。',
        },
        {
          title: '醒来的信号',
          text: '宝宝开始感到饿时，可能会动一动、张开嘴，或朝乳房方向寻找。',
        },
        {
          title: '尿布',
          text: '每天湿尿布和脏尿布的数量，是需要留意的情况之一。',
        },
      ],
      h2Step3: '3. 良好的含乳',
      body3: '舒适的姿势和有效的含乳会让喂奶更轻松。如果疼痛明显或持续，医疗专业人员可以帮你检查姿势和含乳情况。',
      latchTitle: '4 个舒适标志',
      latchSubtitle: '喂奶时的简单检查',
      latchCenterTitle: '宝宝 + 乳房',
      latchCenterSubtitle: '舒适的姿势',
      latchPoints: [
        {
          title: '宝宝姿势到位',
          text: '宝宝贴近你的身体，头部处在舒适的对齐位置。',
        },
        {
          title: '嘴张得足够大',
          text: '等宝宝的嘴张得足够大，再让宝宝含住乳房。',
        },
        {
          title: '含乳舒适',
          text: '有效的含乳不应该带来明显或持续的疼痛。',
        },
        {
          title: '规律的吸吮',
          text: '喂奶过程中可以观察到吸吮和吞咽的动作。',
        },
      ],
      h2Step4: '4. 何时寻求帮助？',
      body4: '不必等到困难变得严重才求助。经过专业训练的人员可以帮你检查姿势、含乳或宝宝的需求。',
      supportOptions: [
        {
          title: '助产士',
          text: '可以在最初的几次含乳中给你支持。',
        },
        {
          title: '医疗专业人员',
          text: '可以检查宝宝和妈妈的健康状况。',
        },
        {
          title: '哺乳顾问',
          text: '在含乳遇到困难时可以提供帮助。',
        },
      ],
      infoTitle: '每段母乳喂养的经历都不一样',
      infoText: '最初几天的情况可能差别很大。喂奶的节奏和奶量可能会随时间逐渐变化。如果有什么让你担心，请向医疗专业人员咨询。',
      h2Summary: '要点回顾',
      summaryItems: [
        '最初的几次喂奶，是宝宝和妈妈共同学习的阶段。',
        '新生儿可能会频繁要求吃奶。',
        '舒适的姿势和良好的含乳很重要。',
        '观察宝宝的信号，比追求一成不变的时间表更有帮助。',
        '助产士或哺乳顾问可以帮你度过早期的困难。',
      ],
      disclaimerText: '仅供参考。本文不能替代医疗专业人员的个性化指导。',
    },
  id: {
    shareMessage: 'Memulai menyusui dengan percaya diri — AWA',
    badge: 'PASCAPERSALINAN • MENYUSUI',
    title: 'Memulai menyusui\ndengan percaya diri',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Hari-hari pertama menyusui adalah masa belajar bagi bayi dan ibu. Perlekatan, ritme, posisi, dan pengamatan secara bertahap membantumu menemukan apa yang terasa nyaman.',
    contentsTitle: 'Dalam artikel ini',
    contentsSubtitle: 'Hal-hal penting untuk memulai',
    tocItems: [
      'Langkah pertama',
      'Tanda yang perlu diperhatikan',
      'Perlekatan yang baik',
      'Kapan harus meminta bantuan',
      'Poin penting',
    ],
    h2Step1: '1. Langkah pertama',
    body1: 'Menyusui terbentuk secara bertahap. Jam-jam pertama, lalu hari-hari pertama, memberi waktu bagi bayi dan ibu untuk belajar bersama.',
    timelineTitle: 'Memulai, langkah demi langkah',
    timelineSubtitle: 'Panduan sederhana, tanpa tekanan',
    startingSteps: [
      {
        title: 'Setelah melahirkan',
        text: 'Kontak kulit ke kulit dan perlekatan sejak dini dapat membantu menyusui berjalan dengan baik.',
      },
      {
        title: 'Jam-jam pertama',
        text: 'Bayi mungkin menyusu dengan sering. Wajar jika ritmenya berubah-ubah.',
      },
      {
        title: 'Hari-hari pertama',
        text: 'Sesi menyusui perlahan menjadi ritme yang dijalani bersama oleh bayi dan ibu.',
      },
      {
        title: 'Menemukan ritme',
        text: 'Produksi ASI berangsur menyesuaikan diri dengan kebutuhan bayi.',
      },
    ],
    h2Step2: '2. Tanda yang perlu diperhatikan',
    body2: 'Daripada hanya terpaku pada jam, akan membantu jika kamu memperhatikan tanda bayi terbangun, sesi menyusu, dan pola popoknya.',
    signals: [
      {
        title: 'Ritme yang sering',
        text: 'Bayi baru lahir bisa meminta menyusu sering, kadang 8 sampai 12 kali dalam 24 jam.',
      },
      {
        title: 'Tanda terbangun',
        text: 'Bayi mungkin bergerak, membuka mulut, atau mencari payudara dengan mulutnya saat mulai merasa lapar.',
      },
      {
        title: 'Popok',
        text: 'Jumlah popok basah dan kotor adalah salah satu hal yang perlu dipantau dari hari ke hari.',
      },
    ],
    h2Step3: '3. Perlekatan yang baik',
    body3: 'Posisi yang nyaman dan perlekatan yang efektif dapat membuat sesi menyusui lebih mudah. Jika nyerinya hebat atau terus-menerus, tenaga kesehatan dapat memeriksa posisi dan perlekatan.',
    latchTitle: '4 penanda kenyamanan',
    latchSubtitle: 'Pemeriksaan sederhana saat menyusui',
    latchCenterTitle: 'Bayi + payudara',
    latchCenterSubtitle: 'Posisi yang nyaman',
    latchPoints: [
      {
        title: 'Bayi berposisi baik',
        text: 'Bayi digendong dekat dengan tubuh, dengan kepala sejajar secara nyaman.',
      },
      {
        title: 'Mulut terbuka lebar',
        text: 'Tunggu sampai mulut bayi terbuka cukup lebar sebelum menyodorkan payudara.',
      },
      {
        title: 'Perlekatan yang nyaman',
        text: 'Perlekatan yang efektif tidak seharusnya menimbulkan nyeri hebat atau terus-menerus.',
      },
      {
        title: 'Isapan teratur',
        text: 'Gerakan mengisap dan menelan dapat teramati selama sesi menyusui.',
      },
    ],
    h2Step4: '4. Kapan harus meminta bantuan?',
    body4: 'Tidak perlu menunggu sampai kesulitannya menjadi serius. Tenaga profesional terlatih dapat membantu memeriksa posisi, perlekatan, atau kebutuhan bayi.',
    supportOptions: [
      {
        title: 'Bidan',
        text: 'Dapat mendampingimu pada perlekatan-perlekatan pertama.',
      },
      {
        title: 'Tenaga kesehatan',
        text: 'Dapat memeriksa kesehatan bayi dan ibu.',
      },
      {
        title: 'Konselor laktasi',
        text: 'Dapat membantu saat perlekatan terasa sulit.',
      },
    ],
    infoTitle: 'Setiap perjalanan menyusui berbeda',
    infoText: 'Hari-hari pertama bisa sangat bervariasi. Ritme menyusui dan jumlah ASI dapat berubah secara bertahap seiring waktu. Jika ada yang mengkhawatirkanmu, mintalah saran dari tenaga kesehatan.',
    h2Summary: 'Poin penting',
    summaryItems: [
      'Sesi menyusui pertama adalah masa belajar bagi bayi dan ibu.',
      'Bayi baru lahir bisa meminta menyusu dengan sering.',
      'Posisi yang nyaman dan perlekatan yang baik itu penting.',
      'Memperhatikan isyarat bayi lebih bermanfaat daripada mengejar jadwal yang kaku.',
      'Bidan atau konselor laktasi dapat membantumu melewati kesulitan di awal.',
    ],
    disclaimerText: 'Konten informatif. Artikel ini tidak menggantikan panduan personal dari tenaga kesehatan.',
  },
  hi: {
    shareMessage: 'भरोसे के साथ स्तनपान की शुरुआत — AWA',
    badge: 'प्रसवोत्तर • स्तनपान',
    title: 'भरोसे के साथ\nस्तनपान की शुरुआत',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'स्तनपान के शुरुआती दिन शिशु और माँ, दोनों के लिए सीखने का समय होते हैं। लैच, लय, बैठने-लेटने की मुद्रा और ध्यान से देखते रहने से धीरे-धीरे आपको वह तरीक़ा मिल जाता है जिसमें आप सहज महसूस करती हैं।',
    contentsTitle: 'इस लेख में',
    contentsSubtitle: 'शुरू करने के लिए ज़रूरी बातें',
    tocItems: [
      'पहले कदम',
      'किन संकेतों पर ध्यान दें',
      'सही लैच',
      'मदद कब माँगें',
      'मुख्य बातें',
    ],
    h2Step1: '1. पहले कदम',
    body1: 'स्तनपान धीरे-धीरे स्थापित होता है। पहले कुछ घंटे और फिर पहले कुछ दिन शिशु और माँ को साथ मिलकर सीखने का समय देते हैं।',
    timelineTitle: 'शुरुआत, कदम-दर-कदम',
    timelineSubtitle: 'एक सरल गाइड, बिना किसी दबाव के',
    startingSteps: [
      {
        title: 'जन्म के बाद',
        text: 'त्वचा से त्वचा का संपर्क और जल्दी लैच कराना स्तनपान की अच्छी शुरुआत में मदद कर सकता है।',
      },
      {
        title: 'शुरुआती घंटे',
        text: 'शिशु बार-बार दूध पी सकता है। लय का बदलते रहना सामान्य है।',
      },
      {
        title: 'शुरुआती दिन',
        text: 'धीरे-धीरे दूध पिलाना शिशु और माँ की साझा लय बन जाता है।',
      },
      {
        title: 'लय का बैठ जाना',
        text: 'दूध की मात्रा धीरे-धीरे शिशु की ज़रूरत के हिसाब से ढल जाती है।',
      },
    ],
    h2Step2: '2. किन संकेतों पर ध्यान दें',
    body2: 'सिर्फ़ घड़ी देखने के बजाय शिशु के जागने के संकेतों, दूध पीने और डायपर के पैटर्न पर ध्यान देना मददगार हो सकता है।',
    signals: [
      {
        title: 'बार-बार दूध पीना',
        text: 'नवजात शिशु बार-बार दूध माँग सकता है, कभी-कभी 24 घंटे में 8 से 12 बार।',
      },
      {
        title: 'जागने के संकेत',
        text: 'भूख लगने पर शिशु हिल-डुल सकता है, मुँह खोल सकता है या स्तन की ओर मुँह घुमा सकता है।',
      },
      {
        title: 'डायपर',
        text: 'गीले और गंदे डायपर की गिनती उन बातों में से है जिन पर रोज़ नज़र रखनी चाहिए।',
      },
    ],
    h2Step3: '3. सही लैच',
    body3: 'आरामदायक मुद्रा और प्रभावी लैच से दूध पिलाना आसान हो सकता है। अगर दर्द ज़्यादा हो या बना रहे, तो कोई स्वास्थ्य विशेषज्ञ मुद्रा और लैच की जाँच कर सकता है।',
    latchTitle: 'आराम के 4 संकेत',
    latchSubtitle: 'दूध पिलाते समय एक सरल जाँच',
    latchCenterTitle: 'शिशु + स्तन',
    latchCenterSubtitle: 'आरामदायक मुद्रा',
    latchPoints: [
      {
        title: 'शिशु की सही स्थिति',
        text: 'शिशु को शरीर के पास रखा जाता है और उसका सिर आरामदायक सीध में होता है।',
      },
      {
        title: 'मुँह पूरा खुला हो',
        text: 'स्तन देने से पहले शिशु के मुँह के काफ़ी चौड़ा खुलने का इंतज़ार करें।',
      },
      {
        title: 'आरामदायक लैच',
        text: 'प्रभावी लैच से ज़्यादा या लगातार दर्द नहीं होना चाहिए।',
      },
      {
        title: 'नियमित चूसना',
        text: 'दूध पिलाते समय चूसने और निगलने की हरकतें दिखाई दे सकती हैं।',
      },
    ],
    h2Step4: '4. मदद कब माँगें?',
    body4: 'परेशानियों के गंभीर होने तक इंतज़ार करने की ज़रूरत नहीं है। प्रशिक्षित विशेषज्ञ मुद्रा, लैच या शिशु की ज़रूरतों की जाँच में मदद कर सकते हैं।',
    supportOptions: [
      {
        title: 'दाई-नर्स (मिडवाइफ़)',
        text: 'पहली बार लैच कराने में आपका साथ दे सकती हैं।',
      },
      {
        title: 'स्वास्थ्य विशेषज्ञ',
        text: 'शिशु और माँ की सेहत की जाँच कर सकते हैं।',
      },
      {
        title: 'लैक्टेशन कंसल्टेंट',
        text: 'लैच कराने में मुश्किल आने पर मदद कर सकती हैं।',
      },
    ],
    infoTitle: 'हर माँ का स्तनपान का सफ़र अलग होता है',
    infoText: 'शुरुआती दिन काफ़ी अलग-अलग हो सकते हैं। दूध पिलाने की लय और दूध की मात्रा समय के साथ धीरे-धीरे बदल सकती है। अगर कोई बात आपको चिंतित करे, तो किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    h2Summary: 'मुख्य बातें',
    summaryItems: [
      'शुरुआती बार दूध पिलाना शिशु और माँ, दोनों के लिए सीखने का समय है।',
      'नवजात शिशु बार-बार दूध माँग सकता है।',
      'आरामदायक मुद्रा और सही लैच मायने रखते हैं।',
      'बिल्कुल तय समय-सारणी के पीछे भागने से ज़्यादा उपयोगी है शिशु के संकेतों पर ध्यान देना।',
      'शुरुआती मुश्किलों में दाई-नर्स या लैक्टेशन कंसल्टेंट आपकी मदद कर सकती हैं।',
    ],
    disclaimerText: 'जानकारी के लिए सामग्री। यह लेख किसी स्वास्थ्य विशेषज्ञ के व्यक्तिगत मार्गदर्शन का विकल्प नहीं है।',
  },
  sq: {
    shareMessage: 'Fillimi i ushqyerjes me gji me siguri — AWA',
    badge: 'PAS LINDJES • USHQYERJA ME GJI',
    title: 'Fillimi i ushqyerjes me gji\nme siguri',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Ditët e para të ushqyerjes me gji janë një periudhë mësimi si për bebin, ashtu edhe për nënën. Kapja e gjirit, ritmi, pozicioni dhe vëzhgimi të ndihmojnë gradualisht të gjesh se çfarë të bën të ndihesh rehat.',
    contentsTitle: 'Në këtë artikull',
    contentsSubtitle: 'Gjërat thelbësore për të nisur',
    tocItems: [
      'Hapat e parë',
      'Shenjat që duhen vërejtur',
      'Një kapje e mirë e gjirit',
      'Kur duhet kërkuar ndihmë',
      'Çfarë të mbash mend',
    ],
    h2Step1: '1. Hapat e parë',
    body1: 'Ushqyerja me gji vendoset gradualisht. Orët e para, pastaj ditët e para, u japin kohë bebit dhe nënës të mësojnë së bashku.',
    timelineTitle: 'Të nisim, hap pas hapi',
    timelineSubtitle: 'Një udhëzues i thjeshtë, pa presion',
    startingSteps: [
      {
        title: 'Pas lindjes',
        text: 'Kontakti lëkurë me lëkurë dhe një kapje e hershme e gjirit mund ta ndihmojnë ushqyerjen me gji të nisë mirë.',
      },
      {
        title: 'Orët e para',
        text: 'Bebi mund të ushqehet shpesh. Është normale që ritmi të ndryshojë.',
      },
      {
        title: 'Ditët e para',
        text: 'Ushqyerjet bëhen gradualisht një ritëm i përbashkët për bebin dhe nënën.',
      },
      {
        title: 'Gjetja e një ritmi',
        text: 'Prodhimi i qumështit përshtatet gradualisht me nevojat e bebit.',
      },
    ],
    h2Step2: '2. Shenjat që duhen vërejtur',
    body2: 'Në vend që të përqendrohesh vetëm te ora, mund të ndihmojë të vëzhgosh shenjat e zgjimit të bebit, ushqyerjet dhe pelenat.',
    signals: [
      {
        title: 'Një ritëm i shpeshtë',
        text: 'Një i porsalindur mund të kërkojë të ushqehet shpesh, ndonjëherë 8 deri në 12 herë brenda 24 orëve.',
      },
      {
        title: 'Shenjat e zgjimit',
        text: 'Bebi mund të lëvizë, të hapë gojën ose të kërkojë gjirin kur fillon të ndiejë uri.',
      },
      {
        title: 'Pelenat',
        text: 'Numri i pelenave të lagura dhe të ndotura është një nga gjërat që duhen ndjekur nga dita në ditë.',
      },
    ],
    h2Step3: '3. Një kapje e mirë e gjirit',
    body3: 'Një pozicion rehat dhe një kapje efikase e gjirit mund t’i bëjnë ushqyerjet më të lehta. Nëse dhimbja është e fortë ose e vazhdueshme, një profesionist i shëndetësisë mund të kontrollojë pozicionin dhe kapjen.',
    latchTitle: '4 shenjat e rehatisë',
    latchSubtitle: 'Një kontroll i thjeshtë gjatë ushqyerjeve',
    latchCenterTitle: 'Bebi + gjiri',
    latchCenterSubtitle: 'Pozicion rehat',
    latchPoints: [
      {
        title: 'Bebi i pozicionuar mirë',
        text: 'Bebi mbahet pranë trupit, me kokën në një drejtim të rehatshëm.',
      },
      {
        title: 'Goja e hapur gjerë',
        text: 'Prit që goja të hapet mjaftueshëm gjerë përpara se t’i ofrosh gjirin.',
      },
      {
        title: 'Kapje e rehatshme',
        text: 'Një kapje efikase nuk duhet të shkaktojë dhimbje të fortë ose të vazhdueshme.',
      },
      {
        title: 'Thithje e rregullt',
        text: 'Lëvizjet e thithjes dhe të gëlltitjes mund të vërehen gjatë ushqyerjes.',
      },
    ],
    h2Step4: '4. Kur duhet kërkuar ndihmë?',
    body4: 'Nuk ka nevojë të presësh derisa vështirësitë të bëhen serioze. Një profesionist i trajnuar mund të ndihmojë të kontrollohen pozicioni, kapja e gjirit ose nevojat e bebit.',
    supportOptions: [
      {
        title: 'Mamia',
        text: 'Mund të të mbështesë gjatë kapjeve të para të gjirit.',
      },
      {
        title: 'Profesionisti i shëndetësisë',
        text: 'Mund të kontrollojë gjendjen shëndetësore të bebit dhe të nënës.',
      },
      {
        title: 'Këshilluesja e laktacionit',
        text: 'Mund të ndihmojë kur kapja e gjirit del e vështirë.',
      },
    ],
    infoTitle: 'Çdo përvojë ushqyerjeje me gji është ndryshe',
    infoText: 'Ditët e para mund të ndryshojnë shumë. Ritmi i ushqyerjeve dhe sasia e qumështit mund të ndryshojnë gradualisht me kalimin e kohës. Nëse diçka të shqetëson, kërko këshillë nga një profesionist i shëndetësisë.',
    h2Summary: 'Çfarë të mbash mend',
    summaryItems: [
      'Ushqyerjet e para janë një periudhë mësimi për bebin dhe nënën.',
      'Një i porsalindur mund të kërkojë të ushqehet shpesh.',
      'Një pozicion rehat dhe një kapje e mirë e gjirit kanë rëndësi.',
      'Vëzhgimi i sinjaleve të bebit është më i dobishëm sesa synimi për një orar krejt të fiksuar.',
      'Një mami ose një këshilluese e laktacionit mund të të ndihmojë gjatë vështirësive të para.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson udhëzimet e personalizuara të një profesionisti të shëndetësisë.',
  },
  ja: {
    shareMessage: '自信を持って授乳を始めるために — AWA',
    badge: '産後 • 授乳',
    title: '自信を持って\n授乳を始めるために',
    metaDuration: '読了目安6分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '授乳の最初の数日は、赤ちゃんにとってもお母さんにとっても学びの時期です。吸着、リズム、抱き方、様子の観察を重ねながら、楽に続けられる形を少しずつ見つけていきます。',
    contentsTitle: 'この記事の内容',
    contentsSubtitle: '始めるために大切なこと',
    tocItems: [
      '最初のステップ',
      '注目したいサイン',
      '上手な吸着',
      '助けを求めるタイミング',
      '重要なポイント',
    ],
    h2Step1: '1. 最初のステップ',
    body1: '授乳は少しずつ軌道に乗っていくものです。最初の数時間、そして最初の数日は、赤ちゃんとお母さんがいっしょに学ぶ時間になります。',
    timelineTitle: 'ステップごとに見る、授乳の始まり',
    timelineSubtitle: 'プレッシャーのない、シンプルな目安',
    startingSteps: [
      {
        title: '出産後',
        text: '肌と肌のふれあいと早めの吸着が、授乳の良いスタートにつながることがあります。',
      },
      {
        title: '最初の数時間',
        text: '赤ちゃんが頻繁に飲みたがることがあります。リズムにばらつきがあるのは普通のことです。',
      },
      {
        title: '最初の数日',
        text: '授乳は少しずつ、赤ちゃんとお母さんに合ったリズムになっていきます。',
      },
      {
        title: 'リズムが整う',
        text: '母乳の量は、赤ちゃんの必要に合わせて少しずつ調整されていきます。',
      },
    ],
    h2Step2: '2. 注目したいサイン',
    body2: '時計ばかりを気にするより、赤ちゃんの目覚めのサイン、授乳の様子、おむつの状態を見ていくと役立ちます。',
    signals: [
      {
        title: '頻繁なリズム',
        text: '新生児は頻繁に飲みたがることがあり、24時間で8〜12回になることもあります。',
      },
      {
        title: '目覚めのサイン',
        text: 'お腹がすきはじめると、赤ちゃんは体を動かしたり、口を開けたり、乳房を探したりすることがあります。',
      },
      {
        title: 'おむつ',
        text: 'おしっこやうんちで濡れたおむつの数は、毎日確認しておきたいことのひとつです。',
      },
    ],
    h2Step3: '3. 上手な吸着',
    body3: '楽な姿勢と効果的な吸着で、授乳がしやすくなります。強い痛みがある、または痛みが続く場合は、医療従事者が抱き方や吸着を確認できます。',
    latchTitle: '楽に飲める4つの目安',
    latchSubtitle: '授乳中にできる簡単なチェック',
    latchCenterTitle: '赤ちゃん + 乳房',
    latchCenterSubtitle: '楽な姿勢',
    latchPoints: [
      {
        title: '赤ちゃんの姿勢が整っている',
        text: '赤ちゃんを体に引き寄せて抱き、頭が楽な位置にそろうようにします。',
      },
      {
        title: '口が大きく開いている',
        text: '十分に口が大きく開くのを待ってから、乳房を含ませます。',
      },
      {
        title: '楽な吸着',
        text: '効果的な吸着であれば、強い痛みや続く痛みは起こらないはずです。',
      },
      {
        title: '規則的な吸う動き',
        text: '授乳中に、吸う動きと飲み込む動きが見られます。',
      },
    ],
    h2Step4: '4. 助けを求めるタイミングは？',
    body4: '困りごとが深刻になるまで待つ必要はありません。研修を受けた専門家が、抱き方や吸着、赤ちゃんの必要なことを確認する手助けをしてくれます。',
    supportOptions: [
      {
        title: '助産師',
        text: '最初の吸着を支えてくれます。',
      },
      {
        title: '医療従事者',
        text: '赤ちゃんとお母さんの健康状態を確認してくれます。',
      },
      {
        title: '母乳育児コンサルタント',
        text: 'うまく吸着できないときに力になってくれます。',
      },
    ],
    infoTitle: '授乳の道のりは人それぞれ',
    infoText: '最初の数日の様子は大きく異なることがあります。授乳のリズムや母乳の量は、時間とともに少しずつ変わっていくことがあります。気になることがあれば、医療従事者に相談してください。',
    h2Summary: '重要なポイント',
    summaryItems: [
      '最初の授乳は、赤ちゃんとお母さんにとって学びの時期です。',
      '新生児は頻繁に飲みたがることがあります。',
      '楽な姿勢と上手な吸着が大切です。',
      'きっちり決まった時間割を目指すより、赤ちゃんのサインを見るほうが役立ちます。',
      '助産師や母乳育児コンサルタントが、最初の困りごとを乗り越える助けになります。',
    ],
    disclaimerText: '情報提供を目的とした内容です。この記事は、医療従事者による個別の指導に代わるものではありません。',
  },
  ko: {
    shareMessage: '자신 있게 모유 수유 시작하기 — AWA',
    badge: '산후 • 모유 수유',
    title: '자신 있게\n모유 수유 시작하기',
    metaDuration: '읽는 데 6분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '모유 수유를 시작하는 첫 며칠은 아기와 엄마 모두 배우는 시간이에요. 물리기, 리듬, 자세, 관찰을 통해 편안한 방법을 조금씩 찾아갈 수 있어요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    contentsSubtitle: '시작하기 위한 핵심',
    tocItems: [
      '첫 단계',
      '살펴볼 신호',
      '좋은 물리기',
      '도움을 청해야 할 때',
      '핵심 정리',
    ],
    h2Step1: '1. 첫 단계',
    body1: '모유 수유는 조금씩 자리를 잡아가요. 첫 몇 시간, 그리고 첫 며칠 동안 아기와 엄마는 함께 배워갈 시간을 가져요.',
    timelineTitle: '단계별로 시작하기',
    timelineSubtitle: '부담 없이 따라 할 수 있는 간단한 가이드',
    startingSteps: [
      {
        title: '출산 직후',
        text: '피부 맞닿기와 이른 시기의 물리기가 모유 수유를 잘 시작하는 데 도움이 될 수 있어요.',
      },
      {
        title: '첫 몇 시간',
        text: '아기가 자주 먹으려고 할 수 있어요. 리듬이 일정하지 않은 것은 자연스러운 일이에요.',
      },
      {
        title: '첫 며칠',
        text: '수유가 점차 아기와 엄마가 함께 만드는 리듬이 되어가요.',
      },
      {
        title: '리듬이 자리 잡기',
        text: '모유량이 아기에게 필요한 만큼으로 조금씩 맞춰져요.',
      },
    ],
    h2Step2: '2. 살펴볼 신호',
    body2: '시계만 보기보다 아기가 깨어나는 신호, 수유, 기저귀 상태를 살펴보면 도움이 될 수 있어요.',
    signals: [
      {
        title: '잦은 수유 리듬',
        text: '신생아는 자주 먹으려고 할 수 있어요. 24시간 동안 8~12회까지도 먹을 수 있어요.',
      },
      {
        title: '깨어나는 신호',
        text: '아기가 배고파지기 시작하면 몸을 움직이거나, 입을 벌리거나, 가슴을 찾는 행동을 할 수 있어요.',
      },
      {
        title: '기저귀',
        text: '젖은 기저귀와 대변 기저귀의 수는 매일 지켜봐야 할 것 중 하나예요.',
      },
    ],
    h2Step3: '3. 좋은 물리기',
    body3: '편안한 자세와 효과적인 물리기는 수유를 더 수월하게 해줄 수 있어요. 통증이 심하거나 계속되면 의료 전문가가 자세와 물리기를 확인해 줄 수 있어요.',
    latchTitle: '편안함을 확인하는 4가지 기준',
    latchSubtitle: '수유하는 동안 간단히 확인하기',
    latchCenterTitle: '아기 + 가슴',
    latchCenterSubtitle: '편안한 자세',
    latchPoints: [
      {
        title: '아기의 자세가 좋아요',
        text: '아기를 몸 가까이 안고, 머리가 편안하게 정렬되도록 해요.',
      },
      {
        title: '입을 크게 벌려요',
        text: '가슴을 물리기 전에 입이 충분히 크게 벌어질 때까지 기다려요.',
      },
      {
        title: '편안하게 물어요',
        text: '효과적으로 물렸다면 심하거나 계속되는 통증이 없어야 해요.',
      },
      {
        title: '규칙적으로 빨아요',
        text: '수유하는 동안 빠는 움직임과 삼키는 움직임을 볼 수 있어요.',
      },
    ],
    h2Step4: '4. 언제 도움을 청해야 할까요?',
    body4: '어려움이 심해질 때까지 기다릴 필요는 없어요. 교육받은 전문가가 자세, 물리기, 아기에게 필요한 것을 확인해 줄 수 있어요.',
    supportOptions: [
      {
        title: '조산사',
        text: '처음 물리는 과정을 곁에서 도와줄 수 있어요.',
      },
      {
        title: '의료 전문가',
        text: '아기와 엄마의 건강 상태를 확인해 줄 수 있어요.',
      },
      {
        title: '모유 수유 전문가',
        text: '물리기가 어려울 때 도움을 줄 수 있어요.',
      },
    ],
    infoTitle: '모유 수유의 과정은 모두 달라요',
    infoText: '첫 며칠은 사람마다 많이 다를 수 있어요. 수유 리듬과 모유량은 시간이 지나면서 조금씩 달라질 수 있어요. 걱정되는 점이 있으면 의료 전문가에게 조언을 구하세요.',
    h2Summary: '핵심 정리',
    summaryItems: [
      '첫 수유는 아기와 엄마가 함께 배우는 시간이에요.',
      '신생아는 자주 먹으려고 할 수 있어요.',
      '편안한 자세와 좋은 물리기가 중요해요.',
      '완벽하게 정해진 시간표를 목표로 하기보다 아기의 신호를 살피는 것이 더 도움이 돼요.',
      '초기의 어려움은 조산사나 모유 수유 전문가가 도와줄 수 있어요.',
    ],
    disclaimerText: '정보 제공용 콘텐츠예요. 이 아티클은 의료 전문가의 맞춤 안내를 대신하지 않아요.',
  },
  'pt-PT': {
    shareMessage: 'Começar a amamentar com confiança — AWA',
    badge: 'PÓS-PARTO • AMAMENTAÇÃO',
    title: 'Começar a amamentar\ncom confiança',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Os primeiros dias de amamentação são um período de aprendizagem para o bebé e para a mãe. A pega, o ritmo, o posicionamento e a observação ajudam, aos poucos, a encontrar o que é confortável.',
    contentsTitle: 'Neste artigo',
    contentsSubtitle: 'O essencial para começar',
    tocItems: [
      'Os primeiros passos',
      'Sinais a observar',
      'Uma boa pega',
      'Quando pedir ajuda',
      'Pontos essenciais',
    ],
    h2Step1: '1. Os primeiros passos',
    body1: 'A amamentação estabelece-se gradualmente. As primeiras horas e, depois, os primeiros dias dão ao bebé e à mãe tempo para aprenderem em conjunto.',
    timelineTitle: 'Começar, passo a passo',
    timelineSubtitle: 'Um guia simples, sem pressão',
    startingSteps: [
      {
        title: 'Após o parto',
        text: 'O contacto pele com pele e uma pega precoce podem ajudar a amamentação a começar bem.',
      },
      {
        title: 'As primeiras horas',
        text: 'O bebé pode mamar com frequência. É normal que o ritmo varie.',
      },
      {
        title: 'Os primeiros dias',
        text: 'As mamadas tornam-se gradualmente um ritmo partilhado entre o bebé e a mãe.',
      },
      {
        title: 'Instalar um ritmo',
        text: 'A produção de leite ajusta-se progressivamente às necessidades do bebé.',
      },
    ],
    h2Step2: '2. Sinais a observar',
    body2: 'Em vez de olhar apenas para o relógio, pode ser útil observar os sinais de despertar do bebé, as mamadas e as fraldas.',
    signals: [
      {
        title: 'Um ritmo frequente',
        text: 'Um recém-nascido pode pedir para mamar muitas vezes, por vezes 8 a 12 vezes em 24 horas.',
      },
      {
        title: 'Sinais de despertar',
        text: 'O bebé pode mexer-se, abrir a boca ou procurar o peito quando começa a ter fome.',
      },
      {
        title: 'Fraldas',
        text: 'O número de fraldas molhadas e sujas é uma das coisas a acompanhar de dia para dia.',
      },
    ],
    h2Step3: '3. Uma boa pega',
    body3: 'Uma posição confortável e uma pega eficaz podem facilitar as mamadas. Se a dor for significativa ou persistente, um profissional de saúde pode verificar o posicionamento e a pega.',
    latchTitle: 'Os 4 marcadores de conforto',
    latchSubtitle: 'Uma verificação simples durante as mamadas',
    latchCenterTitle: 'Bebé + peito',
    latchCenterSubtitle: 'Posição confortável',
    latchPoints: [
      {
        title: 'Bebé bem posicionado',
        text: 'O bebé é segurado junto ao corpo, com a cabeça num alinhamento confortável.',
      },
      {
        title: 'Boca bem aberta',
        text: 'Aguarde por uma abertura da boca suficientemente ampla antes de oferecer o peito.',
      },
      {
        title: 'Pega confortável',
        text: 'Uma pega eficaz não deve causar dor significativa ou persistente.',
      },
      {
        title: 'Sucção regular',
        text: 'Podem observar-se movimentos de sucção e de deglutição durante a mamada.',
      },
    ],
    h2Step4: '4. Quando pedir ajuda?',
    body4: 'Não é preciso esperar que as dificuldades se tornem graves. Um profissional com formação pode ajudar a verificar o posicionamento, a pega ou as necessidades do bebé.',
    supportOptions: [
      {
        title: 'Parteira',
        text: 'Pode acompanhá-la nas primeiras pegas.',
      },
      {
        title: 'Profissional de saúde',
        text: 'Pode verificar a saúde do bebé e da mãe.',
      },
      {
        title: 'Consultora de amamentação',
        text: 'Pode ajudar quando a pega se revela difícil.',
      },
    ],
    infoTitle: 'Cada percurso de amamentação é diferente',
    infoText: 'Os primeiros dias podem variar muito. O ritmo das mamadas e a quantidade de leite podem mudar gradualmente ao longo do tempo. Se algo a preocupar, peça aconselhamento a um profissional de saúde.',
    h2Summary: 'Pontos essenciais',
    summaryItems: [
      'As primeiras mamadas são um período de aprendizagem para o bebé e para a mãe.',
      'Um recém-nascido pode pedir para mamar com frequência.',
      'Uma posição confortável e uma boa pega são importantes.',
      'Observar os sinais do bebé é mais útil do que procurar um horário perfeitamente fixo.',
      'Uma parteira ou uma consultora de amamentação pode ajudá-la nas dificuldades iniciais.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui o acompanhamento personalizado de um profissional de saúde.',
  },
  bn: {
    shareMessage: 'আত্মবিশ্বাসের সঙ্গে বুকের দুধ খাওয়ানো শুরু করা — AWA',
    badge: 'প্রসবোত্তর • বুকের দুধ খাওয়ানো',
    title: 'আত্মবিশ্বাসের সঙ্গে\nবুকের দুধ খাওয়ানো শুরু করা',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'বুকের দুধ খাওয়ানোর প্রথম দিনগুলো শিশু ও মা দুজনের জন্যই শেখার সময়। স্তনে মুখ লাগানো, ছন্দ, অবস্থান ও পর্যবেক্ষণ ধীরে ধীরে আপনাকে বুঝতে সাহায্য করে কোনটি আরামদায়ক।',
    contentsTitle: 'এই নিবন্ধে',
    contentsSubtitle: 'শুরু করার জন্য প্রয়োজনীয় বিষয়গুলো',
    tocItems: [
      'প্রথম ধাপগুলো',
      'যেসব লক্ষণ খেয়াল রাখবেন',
      'সঠিকভাবে মুখ লাগানো',
      'কখন সাহায্য চাইবেন',
      'মূল কথা',
    ],
    h2Step1: '1. প্রথম ধাপগুলো',
    body1: 'বুকের দুধ খাওয়ানো ধীরে ধীরে গড়ে ওঠে। প্রথম কয়েক ঘণ্টা, তারপর প্রথম কয়েক দিন শিশু ও মাকে একসঙ্গে শেখার সময় দেয়।',
    timelineTitle: 'ধাপে ধাপে শুরু করা',
    timelineSubtitle: 'কোনো চাপ ছাড়া একটি সহজ গাইড',
    startingSteps: [
      {
        title: 'প্রসবের পর',
        text: 'ত্বকে ত্বক স্পর্শ এবং তাড়াতাড়ি স্তনে মুখ লাগানো বুকের দুধ খাওয়ানোর ভালো সূচনায় সাহায্য করতে পারে।',
      },
      {
        title: 'প্রথম কয়েক ঘণ্টা',
        text: 'শিশু ঘন ঘন দুধ খেতে পারে। ছন্দ বদলাতে থাকা স্বাভাবিক।',
      },
      {
        title: 'প্রথম কয়েক দিন',
        text: 'দুধ খাওয়ানো ধীরে ধীরে শিশু ও মায়ের একটি যৌথ ছন্দে পরিণত হয়।',
      },
      {
        title: 'ছন্দ গড়ে ওঠা',
        text: 'দুধের সরবরাহ ধীরে ধীরে শিশুর প্রয়োজন অনুযায়ী মানিয়ে নেয়।',
      },
    ],
    h2Step2: '2. যেসব লক্ষণ খেয়াল রাখবেন',
    body2: 'শুধু ঘড়ির দিকে না তাকিয়ে শিশুর জেগে ওঠার লক্ষণ, দুধ খাওয়া এবং ডায়াপারের ধরন লক্ষ করা সহায়ক হতে পারে।',
    signals: [
      {
        title: 'ঘন ঘন ছন্দ',
        text: 'নবজাতক ঘন ঘন দুধ চাইতে পারে, কখনো কখনো 24 ঘণ্টায় 8 থেকে 12 বার।',
      },
      {
        title: 'জেগে ওঠার লক্ষণ',
        text: 'ক্ষুধা পেতে শুরু করলে শিশু নড়াচড়া করতে পারে, মুখ খুলতে পারে বা স্তনের দিকে মুখ ঘোরাতে পারে।',
      },
      {
        title: 'ডায়াপার',
        text: 'ভেজা ও নোংরা ডায়াপারের সংখ্যা প্রতিদিন নজর রাখার বিষয়গুলোর একটি।',
      },
    ],
    h2Step3: '3. সঠিকভাবে মুখ লাগানো',
    body3: 'আরামদায়ক অবস্থান এবং কার্যকর মুখ লাগানো দুধ খাওয়ানো সহজ করতে পারে। ব্যথা বেশি বা অব্যাহত থাকলে স্বাস্থ্যসেবা পেশাজীবী অবস্থান ও মুখ লাগানো পরীক্ষা করে দিতে পারেন।',
    latchTitle: 'আরামের 4টি চিহ্ন',
    latchSubtitle: 'দুধ খাওয়ানোর সময় একটি সহজ যাচাই',
    latchCenterTitle: 'শিশু + স্তন',
    latchCenterSubtitle: 'আরামদায়ক অবস্থান',
    latchPoints: [
      {
        title: 'শিশু ঠিকভাবে অবস্থান করছে',
        text: 'শিশুকে শরীরের কাছাকাছি ধরা হয়েছে এবং তার মাথা আরামদায়ক সোজা অবস্থানে আছে।',
      },
      {
        title: 'মুখ পুরোপুরি খোলা',
        text: 'স্তন দেওয়ার আগে মুখ যথেষ্ট বড় করে খোলা পর্যন্ত অপেক্ষা করুন।',
      },
      {
        title: 'আরামদায়ক মুখ লাগানো',
        text: 'কার্যকর মুখ লাগানোয় উল্লেখযোগ্য বা অব্যাহত ব্যথা হওয়া উচিত নয়।',
      },
      {
        title: 'নিয়মিত চোষা',
        text: 'দুধ খাওয়ানোর সময় চোষা ও গেলার নড়াচড়া দেখা যেতে পারে।',
      },
    ],
    h2Step4: '4. কখন সাহায্য চাইবেন?',
    body4: 'সমস্যা গুরুতর হওয়া পর্যন্ত অপেক্ষা করার প্রয়োজন নেই। একজন প্রশিক্ষিত পেশাজীবী অবস্থান, মুখ লাগানো বা শিশুর প্রয়োজন পরীক্ষা করতে সাহায্য করতে পারেন।',
    supportOptions: [
      {
        title: 'ধাত্রী',
        text: 'প্রথম দিকে মুখ লাগানোর সময় আপনাকে সহায়তা করতে পারেন।',
      },
      {
        title: 'স্বাস্থ্যসেবা পেশাজীবী',
        text: 'শিশু ও মায়ের স্বাস্থ্য পরীক্ষা করতে পারেন।',
      },
      {
        title: 'স্তন্যদান পরামর্শক',
        text: 'মুখ লাগানো কঠিন হলে সাহায্য করতে পারেন।',
      },
    ],
    infoTitle: 'প্রতিটি স্তন্যদানের যাত্রা আলাদা',
    infoText: 'প্রথম কয়েক দিন অনেক রকম হতে পারে। দুধ খাওয়ানোর ছন্দ ও দুধের পরিমাণ সময়ের সঙ্গে ধীরে ধীরে বদলাতে পারে। কোনো কিছু নিয়ে দুশ্চিন্তা হলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    h2Summary: 'মূল কথা',
    summaryItems: [
      'প্রথম কয়েকবার দুধ খাওয়ানো শিশু ও মায়ের জন্য শেখার সময়।',
      'নবজাতক ঘন ঘন দুধ চাইতে পারে।',
      'আরামদায়ক অবস্থান ও সঠিকভাবে মুখ লাগানো গুরুত্বপূর্ণ।',
      'পুরোপুরি নির্দিষ্ট সময়সূচির চেয়ে শিশুর ইঙ্গিত লক্ষ করা বেশি কার্যকর।',
      'একজন ধাত্রী বা স্তন্যদান পরামর্শক শুরুর দিকের অসুবিধায় আপনাকে সাহায্য করতে পারেন।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ স্বাস্থ্যসেবা পেশাজীবীর ব্যক্তিগত নির্দেশনার বিকল্প নয়।',
  },
  da: {
    shareMessage: 'At begynde at amme med selvtillid — AWA',
    badge: 'Efterfødsel • Amning',
    title: 'At begynde at amme\nmed selvtillid',
    metaDuration: '6 minutters læsning',
    metaType: 'Guide',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'De første dage med amning er en læringsperiode for både dig og dit barn. Tilknytning, rytme, stilling og observation hjælper dig gradvist med at finde frem til, hvad der er komfortabelt.',
    contentsTitle: 'I denne artikel',
    contentsSubtitle: 'Det du har brug for at komme i gang',
    tocItems: [
      'De første skridt',
      'Tegn du bør holde øje med',
      'Korrekt tilknytning',
      'Hvornår du bør søge hjælp',
      'Vigtigt at huske',
    ],
    h2Step1: '1. De første skridt',
    body1: 'Amning bygges gradvist op. De første timer og derefter de første dage giver tid til, at du og dit barn kan lære det sammen.',
    timelineTitle: 'At komme i gang trin for trin',
    timelineSubtitle: 'En enkel guide uden pres',
    startingSteps: [
      {
        title: 'Lige efter fødslen',
        text: 'Hud-mod-hud-kontakt og tidlig tilknytning til brystet kan bidrage til en god start på amningen.',
      },
      {
        title: 'De første timer',
        text: 'Barnet kan ønsker at die hyppigt. Det er normalt, at rytmen varierer.',
      },
      {
        title: 'De første dage',
        text: 'Amningen udvikler sig gradvist til en fælles rytme for dig og dit barn.',
      },
      {
        title: 'Rytmen etableres',
        text: 'Mælkeproduktionen tilpasser sig gradvist dit barns behov.',
      },
    ],
    h2Step2: '2. Tegn du bør holde øje med',
    body2: 'I stedet for udelukkende at kigge på uret kan det være nyttigt at bemærke dit barns vågentegn, amning og bleetilstand.',
    signals: [
      {
        title: 'Hyppig rytme',
        text: 'Et nyfødt barn kan ønske at die hyppigt, nogle gange 8 til 12 gange i løbet af 24 timer.',
      },
      {
        title: 'Vågentegn',
        text: 'Når barnet begynder at blive sultent, kan det røre sig, åbne munden eller vende sig mod brystet.',
      },
      {
        title: 'Bleer',
        text: 'Antallet af våde og snavsede bleer er et af de daglige tegn, der er værd at bemærke.',
      },
    ],
    h2Step3: '3. Korrekt tilknytning',
    body3: 'En komfortabel stilling og effektiv tilknytning kan gøre amningen lettere. Hvis smerten er intens eller vedvarende, kan en sundhedsprofessionel undersøge stilling og tilknytning.',
    latchTitle: '4 tegn på komfort',
    latchSubtitle: 'En enkel tjekliste under amningen',
    latchCenterTitle: 'Barn + bryst',
    latchCenterSubtitle: 'Komfortabel stilling',
    latchPoints: [
      {
        title: 'Barnet er godt placeret',
        text: 'Barnet holdes tæt op ad kroppen med hovedet i en komfortabel, rank position.',
      },
      {
        title: 'Munden er åben tilstrækkeligt',
        text: 'Vent til munden er åben tilstrækkeligt bredt, inden du tilbyder brystet.',
      },
      {
        title: 'Komfortabel tilknytning',
        text: 'En effektiv tilknytning bør ikke medføre væsentlig eller vedvarende smerte.',
      },
      {
        title: 'Regelmæssig sutning',
        text: 'Under amningen kan man se suge- og synkebevægelser.',
      },
    ],
    h2Step4: '4. Hvornår bør du søge hjælp?',
    body4: 'Du behøver ikke vente, til problemerne bliver alvorlige. En uddannet professionel kan hjælpe dig med at undersøge stilling, tilknytning eller dit barns behov.',
    supportOptions: [
      {
        title: 'Jordemoder',
        text: 'Kan støtte dig med tilknytningen i de første dage.',
      },
      {
        title: 'Sundhedsprofessionel',
        text: 'Kan undersøge barnets og din sundhed.',
      },
      {
        title: 'Ammekonsulent',
        text: 'Kan hjælpe, hvis tilknytningen er vanskelig.',
      },
    ],
    infoTitle: 'Hvert ammeforløb er unikt',
    infoText: 'De første dage kan se meget forskellige ud. Ammerytmen og mælkemængden kan gradvist ændre sig over tid. Søg råd hos en sundhedsprofessionel, hvis noget bekymrer dig.',
    h2Summary: 'Vigtigt at huske',
    summaryItems: [
      'De første amninger er en læringsperiode for både barn og mor.',
      'Et nyfødt barn kan ønske at die hyppigt.',
      'Komfortabel stilling og korrekt tilknytning er vigtigt.',
      'At følge barnets signaler er mere effektivt end en streng tidsplan.',
      'En jordemoder eller ammekonsulent kan hjælpe dig med de første udfordringer.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter ikke individuel vejledning fra en sundhedsprofessionel.',
  },
  da: {
    shareMessage: 'At begynde at amme med selvtillid — AWA',
    badge: 'Efterfödsel • Amning',
    title: 'At begynde at amme\nmed selvtillid',
    metaDuration: '6 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'De förste dagar med amning ar en läringsperiode for både dig och ditt barn. Tilknytning, rytme, stilling och observation hjälper dig gradvist med at finde frem till, hvad der ar komfortabelt.',
    contentsTitle: 'I denne artikel',
    contentsSubtitle: 'Det du har brug for att komme i gang',
    tocItems: [
      'De förste skridt',
      'Tegn du bör holde öje med',
      'Korrekt tilknytning',
      'Hvornår du bör söge hjälp',
      'Vigtigt at huske',
    ],
    h2Step1: '1. De förste skridt',
    body1: 'Amning bygges gradvist op. De förste timer och derefter de förste dagar giver tid till, at du och ditt barn kan läre det sammen.',
    timelineTitle: 'At komme i gang trin for trin',
    timelineSubtitle: 'En enkel guide uden pres',
    startingSteps: [
      {
        title: 'Lige efter födslen',
        text: 'Hud-mod-hud-kontakt och tidlig tilknytning till brystet kan bidrage till en god start på amningen.',
      },
      {
        title: 'De förste timer',
        text: 'Barnet kan önsker at die hyppigt. Det ar normalt, at rytmen varierer.',
      },
      {
        title: 'De förste dage',
        text: 'Amningen udvikler sig gradvist till en fälles rytme for dig och ditt barn.',
      },
      {
        title: 'Rytmen etableres',
        text: 'Mälkeproduktionen tilpasser sig gradvist ditt barns behov.',
      },
    ],
    h2Step2: '2. Tegn du bör holde öje med',
    body2: 'I stedet for udelukkende at kigge på uret kan det väre nyttigt at bemärke ditt barns vågentegn, amning och bleetilstand.',
    signals: [
      {
        title: 'Hyppig rytme',
        text: 'Et nyfödt barn kan önske at die hyppigt, nogle gange 8 till 12 gange i löbet av 24 timer.',
      },
      {
        title: 'Vågentegn',
        text: 'Når barnet begynder at blive sultent, kan det röre sig, åbne munden eller vende sig mod brystet.',
      },
      {
        title: 'Bleer',
        text: 'Antallet av våde och snavsede bleer ar et av de daglige tegn, der ar värd at bemärke.',
      },
    ],
    h2Step3: '3. Korrekt tilknytning',
    body3: 'En komfortabel stilling och effektiv tilknytning kan göre amningen lettere. Hvis smerten ar intens eller vedvarende, kan en halsasprofessionel undersöge stilling och tilknytning.',
    latchTitle: '4 tegn på komfort',
    latchSubtitle: 'En enkel tjekliste under amningen',
    latchCenterTitle: 'Barn + bryst',
    latchCenterSubtitle: 'Komfortabel stilling',
    latchPoints: [
      {
        title: 'Barnet ar godt placeret',
        text: 'Barnet holdes tät op ad kroppen med hovedet i en komfortabel, rank position.',
      },
      {
        title: 'Munden ar åben tilsträkkeligt',
        text: 'Vent till munden ar åben tilsträkkeligt bredt, inden du tilbyder brystet.',
      },
      {
        title: 'Komfortabel tilknytning',
        text: 'En effektiv tilknytning bör inte medföre väsentlig eller vedvarende smerte.',
      },
      {
        title: 'Regelmässig sutning',
        text: 'Under amningen kan man se suge- och synkebevägelser.',
      },
    ],
    h2Step4: '4. Hvornår bör du söge hjälp?',
    body4: 'Du behöver inte vente, till problemerne bliver alvorlige. En uddannet professionel kan hjälpe dig med at undersöge stilling, tilknytning eller ditt barns behov.',
    supportOptions: [
      {
        title: 'Jordemoder',
        text: 'Kan stötte dig med tilknytningen i de förste dagar.',
      },
      {
        title: 'Halsasprofessionel',
        text: 'Kan undersöge barnets och din halsa.',
      },
      {
        title: 'Ammekonsulent',
        text: 'Kan hjälpe, hvis tilknytningen ar vanskelig.',
      },
    ],
    infoTitle: 'Hvert ammeforlöb ar unikt',
    infoText: 'De förste dagar kan se mycket forskellige ud. Ammerytmen och mälkemängden kan gradvist ändre sig over tid. Sög råd hos en halsasprofessionel, hvis noget bekymrer dig.',
    h2Summary: 'Vigtigt at huske',
    summaryItems: [
      'De förste amninger ar en läringsperiode for både barn och mor.',
      'Et nyfödt barn kan önske at die hyppigt.',
      'Komfortabel stilling och korrekt tilknytning ar vigtigt.',
      'At fölge barnets signaler ar mere effektivt end en streng tidsplan.',
      'En jordemoder eller ammekonsulent kan hjälpe dig med de förste udfordringer.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter inte individuel vejledning fran en halsasprofessionel.',
  },
  sv: {
    shareMessage: 'At begynde at amme med selvtillid — AWA',
    badge: 'Efterfödsel • Amning',
    title: 'At begynde at amme\nmed selvtillid',
    metaDuration: '6 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'De förste dagar med amning ar en läringsperiode for både dig och ditt barn. Tilknytning, rytme, stilling och observation hjälper dig gradvist med at finde frem till, hvad der ar komfortabelt.',
    contentsTitle: 'I denne artikel',
    contentsSubtitle: 'Det du har brug for att komme i gang',
    tocItems: [
      'De förste skridt',
      'Tegn du bör holde öje med',
      'Korrekt tilknytning',
      'Hvornår du bör söge hjälp',
      'Vigtigt at huske',
    ],
    h2Step1: '1. De förste skridt',
    body1: 'Amning bygges gradvist op. De förste timer och derefter de förste dagar giver tid till, at du och ditt barn kan läre det sammen.',
    timelineTitle: 'At komme i gang trin for trin',
    timelineSubtitle: 'En enkel guide uden pres',
    startingSteps: [
      {
        title: 'Lige efter födslen',
        text: 'Hud-mod-hud-kontakt och tidlig tilknytning till brystet kan bidrage till en god start på amningen.',
      },
      {
        title: 'De förste timer',
        text: 'Barnet kan önsker at die hyppigt. Det ar normalt, at rytmen varierer.',
      },
      {
        title: 'De förste dage',
        text: 'Amningen udvikler sig gradvist till en fälles rytme for dig och ditt barn.',
      },
      {
        title: 'Rytmen etableres',
        text: 'Mälkeproduktionen tilpasser sig gradvist ditt barns behov.',
      },
    ],
    h2Step2: '2. Tegn du bör holde öje med',
    body2: 'I stedet for udelukkende at kigge på uret kan det väre nyttigt at bemärke ditt barns vågentegn, amning och bleetilstand.',
    signals: [
      {
        title: 'Hyppig rytme',
        text: 'Et nyfödt barn kan önske at die hyppigt, nogle gange 8 till 12 gange i löbet av 24 timer.',
      },
      {
        title: 'Vågentegn',
        text: 'Når barnet begynder at blive sultent, kan det röre sig, åbne munden eller vende sig mod brystet.',
      },
      {
        title: 'Bleer',
        text: 'Antallet av våde och snavsede bleer ar et av de daglige tegn, der ar värd at bemärke.',
      },
    ],
    h2Step3: '3. Korrekt tilknytning',
    body3: 'En komfortabel stilling och effektiv tilknytning kan göre amningen lettere. Hvis smerten ar intens eller vedvarende, kan en halsasprofessionel undersöge stilling och tilknytning.',
    latchTitle: '4 tegn på komfort',
    latchSubtitle: 'En enkel tjekliste under amningen',
    latchCenterTitle: 'Barn + bryst',
    latchCenterSubtitle: 'Komfortabel stilling',
    latchPoints: [
      {
        title: 'Barnet ar godt placeret',
        text: 'Barnet holdes tät op ad kroppen med hovedet i en komfortabel, rank position.',
      },
      {
        title: 'Munden ar åben tilsträkkeligt',
        text: 'Vent till munden ar åben tilsträkkeligt bredt, inden du tilbyder brystet.',
      },
      {
        title: 'Komfortabel tilknytning',
        text: 'En effektiv tilknytning bör inte medföre väsentlig eller vedvarende smerte.',
      },
      {
        title: 'Regelmässig sutning',
        text: 'Under amningen kan man se suge- och synkebevägelser.',
      },
    ],
    h2Step4: '4. Hvornår bör du söge hjälp?',
    body4: 'Du behöver inte vente, till problemerne bliver alvorlige. En uddannet professionel kan hjälpe dig med at undersöge stilling, tilknytning eller ditt barns behov.',
    supportOptions: [
      {
        title: 'Jordemoder',
        text: 'Kan stötte dig med tilknytningen i de förste dagar.',
      },
      {
        title: 'Halsasprofessionel',
        text: 'Kan undersöge barnets och din halsa.',
      },
      {
        title: 'Ammekonsulent',
        text: 'Kan hjälpe, hvis tilknytningen ar vanskelig.',
      },
    ],
    infoTitle: 'Hvert ammeforlöb ar unikt',
    infoText: 'De förste dagar kan se mycket forskellige ud. Ammerytmen och mälkemängden kan gradvist ändre sig over tid. Sög råd hos en halsasprofessionel, hvis noget bekymrer dig.',
    h2Summary: 'Vigtigt at huske',
    summaryItems: [
      'De förste amninger ar en läringsperiode for både barn och mor.',
      'Et nyfödt barn kan önske at die hyppigt.',
      'Komfortabel stilling och korrekt tilknytning ar vigtigt.',
      'At fölge barnets signaler ar mere effektivt end en streng tidsplan.',
      'En jordemoder eller ammekonsulent kan hjälpe dig med de förste udfordringer.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter inte individuel vejledning fran en halsasprofessionel.',
  },
} as const);

/* -------------------------------------------------------------------------- */
/* TYPES                                                                       */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                      */
/* -------------------------------------------------------------------------- */

export default function BreastfeedingArticleScreen({
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
        onScroll={event => {
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          );
        }}
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
        {/* ---------------------------------------------------------------- */}
        {/* HERO                                                             */}
        {/* ---------------------------------------------------------------- */}

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

        {/* ---------------------------------------------------------------- */}
        {/* ARTICLE                                                          */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.article}>
          {/* Badge */}
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          {/* Title */}
          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          {/* Metadata */}
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

          {/* Introduction */}
          <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* ---------------------------------------------------------------- */}
          {/* CONTENTS                                                         */}
          {/* ---------------------------------------------------------------- */}

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <View style={styles.contentsHeader}>
              <View style={styles.contentsIcon}>
                <MaterialDesignIcons
                  name="format-list-bulleted"
                  size={19}
                  color={theme.colors.primary}
                />
              </View>

              <View>
                <AwaText variant="titleMedium" emphasized>
                  {content.contentsTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.contentsSubtitle}>
                  {content.contentsSubtitle}
                </AwaText>
              </View>
            </View>

            {content.tocItems.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <View style={styles.contentNumberCircle}>
                    <AwaText variant="labelSmall" emphasized colorRole="primary">
                      {index + 1}
                    </AwaText>
                  </View>

                  <AwaText variant="bodySmall" style={styles.contentText}>
                    {item}
                  </AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </AwaCard>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 1                                                        */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2Step1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1}
          </AwaText>

          {/* MODERN TIMELINE */}
          <AwaCard variant="filled" padding="none" style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <View style={styles.timelineHeaderIcon}>
                <MaterialDesignIcons
                  name="timeline-clock-outline"
                  size={23}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.timelineHeaderCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.timelineTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.timelineSubtitle}>
                  {content.timelineSubtitle}
                </AwaText>
              </View>
            </View>

            {content.startingSteps.map((step, index) => {
              const meta = STARTING_STEPS_META[index];

              return (
                <View
                  key={meta.number}
                  style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineNode}>
                      <AwaText variant="labelSmall" emphasized colorRole="primary">
                        {meta.number}
                      </AwaText>
                    </View>

                    {index < content.startingSteps.length - 1 ? (
                      <View style={styles.timelineLine} />
                    ) : null}
                  </View>

                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTitleRow}>
                      <AwaText variant="titleSmall" emphasized style={styles.timelineStepTitle}>
                        {step.title}
                      </AwaText>

                      <MaterialDesignIcons
                        name={meta.icon as never}
                        size={19}
                        color={theme.colors.primary}
                      />
                    </View>

                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.timelineText}>
                      {step.text}
                    </AwaText>
                  </View>
                </View>
              );
            })}
          </AwaCard>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 2                                                        */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2Step2}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
          </AwaText>

          <View style={styles.signalGrid}>
            {content.signals.map((item, index) => {
              const meta = SIGNALS_META[index];

              return (
                <AwaCard variant="filled" padding="none"
                  key={item.title}
                  style={[
                    styles.signalCard,
                    index === 0 && styles.signalCardLarge,
                  ]}>
                  <View style={styles.signalIcon}>
                    <MaterialDesignIcons
                      name={meta.icon as never}
                      size={21}
                      color={theme.colors.primary}
                    />
                  </View>

                  <AwaText variant="titleSmall" emphasized style={styles.signalTitle}>
                    {item.title}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.signalText}>
                    {item.text}
                  </AwaText>
                </AwaCard>
              );
            })}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 3                                                        */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2Step3}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3}
          </AwaText>

          {/* LATCH SCHEMA */}
          <AwaCard variant="filled" padding="none" style={styles.latchCard}>
            <View style={styles.latchHeader}>
              <View style={styles.latchBadge}>
                <MaterialDesignIcons
                  name="heart-pulse"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.latchHeaderCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.latchTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.latchSubtitle}>
                  {content.latchSubtitle}
                </AwaText>
              </View>
            </View>

            <View style={styles.latchCenter}>
              <View style={styles.latchCircleOuter}>
                <View style={styles.latchCircleInner}>
                  <MaterialDesignIcons
                    name="baby-face-outline"
                    size={35}
                    color={theme.colors.primary}
                  />
                </View>
              </View>

              <View style={styles.latchCenterText}>
                <AwaText variant="titleSmall" emphasized>
                  {content.latchCenterTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.latchCenterSubtitle}>
                  {content.latchCenterSubtitle}
                </AwaText>
              </View>
            </View>

            <View style={styles.latchPoints}>
              {content.latchPoints.map((item, index) => {
                const meta = LATCH_POINTS_META[index];

                return (
                  <View
                    key={item.title}
                    style={styles.latchPoint}>
                    <View style={styles.latchPointNumber}>
                      <AwaText variant="labelSmall" emphasized colorRole="primary">
                        {index + 1}
                      </AwaText>
                    </View>

                    <View style={styles.latchPointIcon}>
                      <MaterialDesignIcons
                        name={meta.icon as never}
                        size={19}
                        color={theme.colors.primary}
                      />
                    </View>

                    <View style={styles.latchPointCopy}>
                      <AwaText variant="labelSmall" emphasized>
                        {item.title}
                      </AwaText>

                      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.latchPointText}>
                        {item.text}
                      </AwaText>
                    </View>
                  </View>
                );
              })}
            </View>
          </AwaCard>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 4                                                        */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2Step4}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body4}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.supportCard}>
            {content.supportOptions.map((item, index) => {
              const meta = SUPPORT_OPTIONS_META[index];

              return (
                <React.Fragment key={item.title}>
                  <View style={styles.supportRow}>
                    <View style={styles.supportIcon}>
                      <MaterialDesignIcons
                        name={meta.icon as never}
                        size={21}
                        color={theme.colors.primary}
                      />
                    </View>

                    <View style={styles.supportCopy}>
                      <AwaText variant="titleSmall" emphasized>
                        {item.title}
                      </AwaText>

                      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.supportText}>
                        {item.text}
                      </AwaText>
                    </View>
                  </View>

                  {index < content.supportOptions.length - 1 ? (
                    <View style={styles.supportSeparator} />
                  ) : null}
                </React.Fragment>
              );
            })}
          </AwaCard>

          {/* ---------------------------------------------------------------- */}
          {/* IMPORTANT NOTE                                                    */}
          {/* ---------------------------------------------------------------- */}

          <AwaCard variant="filled" padding="none" style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <MaterialDesignIcons
                name="information-outline"
                size={21}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.infoTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                {content.infoText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ---------------------------------------------------------------- */}
          {/* SUMMARY                                                           */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2Summary}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            {content.summaryItems.map(item => (
              <View
                key={item}
                style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={19}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* DISCLAIMER */}
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

      {/* -------------------------------------------------------------------- */}
      {/* READING CONTROLS                                                     */}
      {/* -------------------------------------------------------------------- */}

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
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 32,
  },

  /* ---------------------------------------------------------------------- */
  /* HERO                                                                   */
  /* ---------------------------------------------------------------------- */

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



  /* ---------------------------------------------------------------------- */
  /* ARTICLE                                                                */
  /* ---------------------------------------------------------------------- */

  article: {
    marginTop: -16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
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

  /* ---------------------------------------------------------------------- */
  /* CONTENTS                                                               */
  /* ---------------------------------------------------------------------- */

  contents: {
    marginTop: 20,
    padding: 16,
  },

  contentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  contentsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginRight: 12,
  },


  contentsSubtitle: {
    marginTop: 2,
  },

  contentRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumberCircle: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginRight: 8,
  },


  contentText: {
    flex: 1,
  },

  /* ---------------------------------------------------------------------- */
  /* HEADINGS                                                               */
  /* ---------------------------------------------------------------------- */

  h2: {
    marginTop: 28,
  },

  body: {
    marginTop: 8,
  },

  /* ---------------------------------------------------------------------- */
  /* MODERN TIMELINE                                                        */
  /* ---------------------------------------------------------------------- */

  timelineCard: {
    marginTop: 16,
    padding: 16,
  },

  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  timelineHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  timelineHeaderCopy: {
    flex: 1,
    marginLeft: 12,
  },


  timelineSubtitle: {
    marginTop: 3,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 91,
  },

  timelineLeft: {
    width: 46,
    alignItems: 'center',
    position: 'relative',
  },

  timelineNode: {
    width: 35,
    height: 35,
    marginTop: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 2,
  },


  timelineLine: {
    position: 'absolute',
    top: 49,
    bottom: 0,
    width: 2,
    backgroundColor: theme.colors.border,
  },

  timelineContent: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 12,
    paddingLeft: 8,
  },

  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timelineStepTitle: {
    flex: 1,
  },

  timelineText: {
    marginTop: 4,
    paddingRight: 4,
  },

  /* ---------------------------------------------------------------------- */
  /* SIGNAL GRID                                                            */
  /* ---------------------------------------------------------------------- */

  signalGrid: {
    marginTop: 16,
    gap: 8,
  },

  signalCard: {
    padding: 12,
  },

  signalCardLarge: {
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderColor: theme.colors.border,
  },

  signalIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  signalTitle: {
    marginTop: 8,
  },

  signalText: {
    marginTop: 4,
  },

  /* ---------------------------------------------------------------------- */
  /* LATCH SCHEMA                                                           */
  /* ---------------------------------------------------------------------- */

  latchCard: {
    marginTop: 16,
    padding: 16,
  },

  latchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  latchBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  latchHeaderCopy: {
    flex: 1,
    marginLeft: 12,
  },


  latchSubtitle: {
    marginTop: 3,
  },

  latchCenter: {
    marginTop: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  latchCircleOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  latchCircleInner: {
    width: 59,
    height: 59,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },

  latchCenterText: {
    alignItems: 'center',
    marginTop: 8,
  },


  latchCenterSubtitle: {
    marginTop: 2,
  },

  latchPoints: {
    marginTop: 12,
  },

  latchPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  latchPointNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  latchPointIcon: {
    width: 32,
    height: 32,
    marginLeft: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  latchPointCopy: {
    flex: 1,
    marginLeft: 8,
  },


  latchPointText: {
    marginTop: 2,
  },

  /* ---------------------------------------------------------------------- */
  /* SUPPORT                                                                */
  /* ---------------------------------------------------------------------- */

  supportCard: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },

  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  supportIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  supportCopy: {
    flex: 1,
    marginLeft: 12,
  },


  supportText: {
    marginTop: 3,
  },

  supportSeparator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },

  /* ---------------------------------------------------------------------- */
  /* INFO BOX                                                               */
  /* ---------------------------------------------------------------------- */

  infoBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  infoCopy: {
    flex: 1,
    marginLeft: 12,
  },


  infoText: {
    marginTop: 4,
  },

  /* ---------------------------------------------------------------------- */
  /* SUMMARY                                                                */
  /* ---------------------------------------------------------------------- */

  summaryCard: {
    marginTop: 16,
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

  /* ---------------------------------------------------------------------- */
  /* DISCLAIMER                                                             */
  /* ---------------------------------------------------------------------- */

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
