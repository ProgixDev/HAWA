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
const CONTENT = {
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
} as const;

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('libraryArticle.shareA11y')}
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

        {/* ---------------------------------------------------------------- */}
        {/* ARTICLE                                                          */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.article}>
          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {content.badge}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {content.title}
          </Text>

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

                  <Text style={styles.meta}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Introduction */}
          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* ---------------------------------------------------------------- */}
          {/* CONTENTS                                                         */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.contents}>
            <View style={styles.contentsHeader}>
              <View style={styles.contentsIcon}>
                <MaterialDesignIcons
                  name="format-list-bulleted"
                  size={19}
                  color={theme.colors.primary}
                />
              </View>

              <View>
                <Text style={styles.contentsTitle}>
                  {content.contentsTitle}
                </Text>

                <Text style={styles.contentsSubtitle}>
                  {content.contentsSubtitle}
                </Text>
              </View>
            </View>

            {content.tocItems.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <View style={styles.contentNumberCircle}>
                    <Text style={styles.contentNumber}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 1                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Step1}
          </Text>

          <Text style={styles.body}>
            {content.body1}
          </Text>

          {/* MODERN TIMELINE */}
          <View style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <View style={styles.timelineHeaderIcon}>
                <MaterialDesignIcons
                  name="timeline-clock-outline"
                  size={23}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.timelineHeaderCopy}>
                <Text style={styles.timelineTitle}>
                  {content.timelineTitle}
                </Text>

                <Text style={styles.timelineSubtitle}>
                  {content.timelineSubtitle}
                </Text>
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
                      <Text style={styles.timelineNumber}>
                        {meta.number}
                      </Text>
                    </View>

                    {index < content.startingSteps.length - 1 ? (
                      <View style={styles.timelineLine} />
                    ) : null}
                  </View>

                  <View style={styles.timelineContent}>
                    <View style={styles.timelineTitleRow}>
                      <Text style={styles.timelineStepTitle}>
                        {step.title}
                      </Text>

                      <MaterialDesignIcons
                        name={meta.icon as never}
                        size={19}
                        color={theme.colors.primary}
                      />
                    </View>

                    <Text style={styles.timelineText}>
                      {step.text}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 2                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Step2}
          </Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.signalGrid}>
            {content.signals.map((item, index) => {
              const meta = SIGNALS_META[index];

              return (
                <View
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

                  <Text style={styles.signalTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.signalText}>
                    {item.text}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 3                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Step3}
          </Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          {/* LATCH SCHEMA */}
          <View style={styles.latchCard}>
            <View style={styles.latchHeader}>
              <View style={styles.latchBadge}>
                <MaterialDesignIcons
                  name="heart-pulse"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.latchHeaderCopy}>
                <Text style={styles.latchTitle}>
                  {content.latchTitle}
                </Text>

                <Text style={styles.latchSubtitle}>
                  {content.latchSubtitle}
                </Text>
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
                <Text style={styles.latchCenterTitle}>
                  {content.latchCenterTitle}
                </Text>

                <Text style={styles.latchCenterSubtitle}>
                  {content.latchCenterSubtitle}
                </Text>
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
                      <Text style={styles.latchPointNumberText}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.latchPointIcon}>
                      <MaterialDesignIcons
                        name={meta.icon as never}
                        size={19}
                        color={theme.colors.primary}
                      />
                    </View>

                    <View style={styles.latchPointCopy}>
                      <Text style={styles.latchPointTitle}>
                        {item.title}
                      </Text>

                      <Text style={styles.latchPointText}>
                        {item.text}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 4                                                        */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Step4}
          </Text>

          <Text style={styles.body}>
            {content.body4}
          </Text>

          <View style={styles.supportCard}>
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
                      <Text style={styles.supportTitle}>
                        {item.title}
                      </Text>

                      <Text style={styles.supportText}>
                        {item.text}
                      </Text>
                    </View>
                  </View>

                  {index < content.supportOptions.length - 1 ? (
                    <View style={styles.supportSeparator} />
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* IMPORTANT NOTE                                                    */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <MaterialDesignIcons
                name="information-outline"
                size={21}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>
                {content.infoTitle}
              </Text>

              <Text style={styles.infoText}>
                {content.infoText}
              </Text>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SUMMARY                                                           */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Summary}
          </Text>

          <View style={styles.summaryCard}>
            {content.summaryItems.map(item => (
              <View
                key={item}
                style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={19}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* DISCLAIMER */}
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
    paddingBottom: 30,
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

  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  pressed: {
    opacity: 0.72,
  },

  /* ---------------------------------------------------------------------- */
  /* ARTICLE                                                                */
  /* ---------------------------------------------------------------------- */

  article: {
    marginTop: -15,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
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

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 9.5,
    color: theme.colors.textMuted,
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  /* ---------------------------------------------------------------------- */
  /* CONTENTS                                                               */
  /* ---------------------------------------------------------------------- */

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  contentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  contentsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginRight: 10,
  },

  contentsTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  contentsSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: theme.colors.textMuted,
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
    marginRight: 9,
  },

  contentNumber: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.3,
    lineHeight: 17,
    color: theme.colors.text,
  },

  /* ---------------------------------------------------------------------- */
  /* HEADINGS                                                               */
  /* ---------------------------------------------------------------------- */

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21.5,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* MODERN TIMELINE                                                        */
  /* ---------------------------------------------------------------------- */

  timelineCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
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
    marginLeft: 10,
  },

  timelineTitle: {
    fontSize: 13.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  timelineSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: theme.colors.textMuted,
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
    marginTop: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 2,
  },

  timelineNumber: {
    fontSize: 9.5,
    color: theme.colors.primary,
    fontWeight: '900',
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
    paddingTop: 15,
    paddingBottom: 10,
    paddingLeft: 7,
  },

  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timelineStepTitle: {
    flex: 1,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  timelineText: {
    marginTop: 4,
    paddingRight: 5,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* SIGNAL GRID                                                            */
  /* ---------------------------------------------------------------------- */

  signalGrid: {
    marginTop: 14,
    gap: 9,
  },

  signalCard: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    marginTop: 9,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  signalText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* LATCH SCHEMA                                                           */
  /* ---------------------------------------------------------------------- */

  latchCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    marginLeft: 10,
  },

  latchTitle: {
    fontSize: 13.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  latchSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  latchCenter: {
    marginTop: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
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
    marginTop: 9,
  },

  latchCenterTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  latchCenterSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  latchPoints: {
    marginTop: 13,
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

  latchPointNumberText: {
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: '900',
  },

  latchPointIcon: {
    width: 32,
    height: 32,
    marginLeft: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  latchPointCopy: {
    flex: 1,
    marginLeft: 9,
  },

  latchPointTitle: {
    fontSize: 11.8,
    color: theme.colors.text,
    fontWeight: '800',
  },

  latchPointText: {
    marginTop: 2,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* SUPPORT                                                                */
  /* ---------------------------------------------------------------------- */

  supportCard: {
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
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
    marginLeft: 10,
  },

  supportTitle: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '800',
  },

  supportText: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: theme.colors.textSecondary,
  },

  supportSeparator: {
    height: 1,
    backgroundColor: theme.colors.border,
  },

  /* ---------------------------------------------------------------------- */
  /* INFO BOX                                                               */
  /* ---------------------------------------------------------------------- */

  infoBox: {
    marginTop: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    marginLeft: 10,
  },

  infoTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 4,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* SUMMARY                                                                */
  /* ---------------------------------------------------------------------- */

  summaryCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },

  summaryText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* ---------------------------------------------------------------------- */
  /* DISCLAIMER                                                             */
  /* ---------------------------------------------------------------------- */

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: theme.colors.textMuted,
  },
  });
}
