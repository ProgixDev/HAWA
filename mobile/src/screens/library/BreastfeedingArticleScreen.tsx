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
  nb: {
    shareMessage: 'Begynne å amme med trygghet – AWA',
    badge: 'BARSELTID • AMMING',
    title: 'Begynne å amme\nmed trygghet',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'De første dagene med amming er en læringsperiode for både baby og mor. Tak, rytme, stilling og observasjon hjelper deg gradvis å finne det som føles komfortabelt.',
    contentsTitle: 'I denne artikkelen',
    contentsSubtitle: 'Det viktigste for å komme i gang',
    tocItems: [
      'De første skrittene',
      'Tegn å være oppmerksom på',
      'Et godt tak',
      'Når du bør be om hjelp',
      'Det viktigste å huske',
    ],
    h2Step1: '1. De første skrittene',
    body1: 'Ammingen kommer gradvis i gang. De første timene og deretter de første dagene gir baby og mor tid til å lære sammen.',
    timelineTitle: 'Komme i gang, steg for steg',
    timelineSubtitle: 'En enkel veiledning, uten press',
    startingSteps: [
      {title: 'Etter fødselen', text: 'Hud mot hud og et tidlig tak kan hjelpe ammingen i gang på en god måte.'},
      {title: 'De første timene', text: 'Babyen kan die ofte. Det er normalt at rytmen varierer.'},
      {title: 'De første dagene', text: 'Måltidene blir gradvis en felles rytme for baby og mor.'},
      {title: 'Finne en rytme', text: 'Melkeproduksjonen tilpasser seg gradvis babyens behov.'},
    ],
    h2Step2: '2. Tegn å være oppmerksom på',
    body2: 'I stedet for bare å se på klokken kan det hjelpe å følge med på babyens våkentegn, måltider og bleiemønster.',
    signals: [
      {title: 'En hyppig rytme', text: 'En nyfødt kan be om å die ofte, noen ganger 8 til 12 ganger i løpet av 24 timer.'},
      {title: 'Våkentegn', text: 'Babyen kan bevege seg, åpne munnen eller lete etter brystet når den begynner å bli sulten.'},
      {title: 'Bleier', text: 'Antall våte og skitne bleier er noe av det du bør følge med på fra dag til dag.'},
    ],
    h2Step3: '3. Et godt tak',
    body3: 'En komfortabel stilling og et effektivt tak kan gjøre måltidene lettere. Hvis smerten er sterk eller vedvarer, kan helsepersonell kontrollere stillingen og taket.',
    latchTitle: 'De 4 komfortmarkørene',
    latchSubtitle: 'En enkel kontroll under måltidene',
    latchCenterTitle: 'Baby + bryst',
    latchCenterSubtitle: 'Komfortabel stilling',
    latchPoints: [
      {title: 'Babyen ligger godt', text: 'Babyen holdes tett inntil kroppen, med hodet i en behagelig linje.'},
      {title: 'Munnen vidåpen', text: 'Vent på at munnen åpner seg bredt nok før du tilbyr brystet.'},
      {title: 'Komfortabelt tak', text: 'Et effektivt tak bør ikke gi sterk eller vedvarende smerte.'},
      {title: 'Jevn suging', text: 'Sug- og svelgebevegelser kan observeres under måltidet.'},
    ],
    h2Step4: '4. Når bør du be om hjelp?',
    body4: 'Du trenger ikke vente til vanskelighetene blir alvorlige. En kvalifisert fagperson kan hjelpe med å kontrollere stilling, tak eller babyens behov.',
    supportOptions: [
      {title: 'Jordmor', text: 'Kan støtte deg gjennom de første takene.'},
      {title: 'Helsepersonell', text: 'Kan kontrollere helsen til baby og mor.'},
      {title: 'Ammehjelper', text: 'Kan hjelpe når det er vanskelig å få godt tak.'},
    ],
    infoTitle: 'Hver ammereise er forskjellig',
    infoText: 'De første dagene kan variere mye. Rytmen på måltidene og mengden melk kan endre seg gradvis over tid. Hvis noe bekymrer deg, spør helsepersonell om råd.',
    h2Summary: 'Det viktigste å huske',
    summaryItems: [
      'De første måltidene er en læringsperiode for baby og mor.',
      'En nyfødt kan be om å die hyppig.',
      'En komfortabel stilling og et godt tak er viktig.',
      'Å følge med på babyens signaler er mer nyttig enn å sikte mot en helt fast timeplan.',
      'En jordmor eller ammehjelper kan hjelpe deg gjennom de første vanskelighetene.',
    ],
    disclaimerText: 'Informasjonsinnhold. Denne artikkelen erstatter ikke personlig veiledning fra helsepersonell.',
  },
  pl: {
    shareMessage: 'Pewny start w karmieniu piersią — AWA',
    badge: 'POŁÓG • KARMIENIE PIERSIĄ',
    title: 'Pewny start\nw karmieniu piersią',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Pierwsze dni karmienia piersią to czas nauki zarówno dla dziecka, jak i dla mamy. Przystawianie, rytm, pozycja i obserwacja stopniowo pomagają znaleźć to, co jest wygodne.',
    contentsTitle: 'W tym artykule',
    contentsSubtitle: 'Najważniejsze, by zacząć',
    tocItems: [
      'Pierwsze kroki',
      'Sygnały, na które warto zwracać uwagę',
      'Prawidłowe przystawienie',
      'Kiedy poprosić o pomoc',
      'Najważniejsze wnioski',
    ],
    h2Step1: '1. Pierwsze kroki',
    body1: 'Karmienie piersią ustala się stopniowo. Pierwsze godziny, a potem pierwsze dni dają dziecku i mamie czas, by uczyć się razem.',
    timelineTitle: 'Początki, krok po kroku',
    timelineSubtitle: 'Prosty przewodnik, bez presji',
    startingSteps: [
      {title: 'Po porodzie', text: 'Kontakt skóra do skóry i wczesne przystawienie mogą pomóc w dobrym starcie karmienia piersią.'},
      {title: 'Pierwsze godziny', text: 'Dziecko może jeść często. To normalne, że rytm jest zmienny.'},
      {title: 'Pierwsze dni', text: 'Karmienia stopniowo stają się wspólnym rytmem dziecka i mamy.'},
      {title: 'Ustalanie się rytmu', text: 'Ilość mleka stopniowo dostosowuje się do potrzeb dziecka.'},
    ],
    h2Step2: '2. Sygnały, na które warto zwracać uwagę',
    body2: 'Zamiast skupiać się tylko na zegarze, warto obserwować sygnały wybudzania się dziecka, karmienia i wzorzec pieluszek.',
    signals: [
      {title: 'Częsty rytm', text: 'Noworodek może domagać się karmienia często, czasem 8 do 12 razy w ciągu doby.'},
      {title: 'Sygnały wybudzania', text: 'Gdy dziecko zaczyna czuć głód, może się poruszać, otwierać buzię lub szukać piersi.'},
      {title: 'Pieluszki', text: 'Liczba mokrych i brudnych pieluszek to jedna z rzeczy, które warto obserwować na co dzień.'},
    ],
    h2Step3: '3. Prawidłowe przystawienie',
    body3: 'Wygodna pozycja i skuteczne przystawienie mogą ułatwić karmienie. Jeśli ból jest silny lub uporczywy, specjalista może sprawdzić pozycję i przystawienie.',
    latchTitle: '4 wyznaczniki komfortu',
    latchSubtitle: 'Prosta kontrola podczas karmienia',
    latchCenterTitle: 'Dziecko + pierś',
    latchCenterSubtitle: 'Wygodna pozycja',
    latchPoints: [
      {title: 'Dobrze ułożone dziecko', text: 'Dziecko jest trzymane blisko ciała, z główką w wygodnym ułożeniu.'},
      {title: 'Szeroko otwarta buzia', text: 'Zaczekaj na dostatecznie szerokie otwarcie buzi, zanim podasz pierś.'},
      {title: 'Wygodne przystawienie', text: 'Skuteczne przystawienie nie powinno powodować silnego ani uporczywego bólu.'},
      {title: 'Regularne ssanie', text: 'Podczas karmienia można zaobserwować ruchy ssania i połykania.'},
    ],
    h2Step4: '4. Kiedy poprosić o pomoc?',
    body4: 'Nie trzeba czekać, aż trudności staną się poważne. Przeszkolony specjalista może pomóc sprawdzić pozycję, przystawienie lub potrzeby dziecka.',
    supportOptions: [
      {title: 'Położna', text: 'Może wesprzeć Cię przy pierwszych przystawieniach.'},
      {title: 'Specjalista medyczny', text: 'Może sprawdzić stan zdrowia dziecka i mamy.'},
      {title: 'Doradca laktacyjny', text: 'Może pomóc, gdy przystawienie okazuje się trudne.'},
    ],
    infoTitle: 'Każda droga karmienia piersią jest inna',
    infoText: 'Pierwsze dni mogą się bardzo różnić. Rytm karmień i ilość mleka mogą stopniowo zmieniać się w czasie. Jeśli coś Cię niepokoi, poproś o poradę specjalistę.',
    h2Summary: 'Najważniejsze wnioski',
    summaryItems: [
      'Pierwsze karmienia to czas nauki dla dziecka i mamy.',
      'Noworodek może domagać się karmienia często.',
      'Liczy się wygodna pozycja i dobre przystawienie.',
      'Obserwowanie sygnałów dziecka jest bardziej pomocne niż dążenie do idealnie stałego harmonogramu.',
      'Położna lub doradca laktacyjny może pomóc przejść przez początkowe trudności.',
    ],
    disclaimerText: 'Treść informacyjna. Ten artykuł nie zastępuje spersonalizowanych wskazówek specjalisty.',
  },
  uk: {
    shareMessage: 'Впевнений початок грудного вигодовування — AWA',
    badge: 'ПІСЛЯ ПОЛОГІВ • ГРУДНЕ ВИГОДОВУВАННЯ',
    title: 'Впевнений початок\nгрудного вигодовування',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Перші дні грудного вигодовування — час навчання і для дитини, і для мами. Прикладання, ритм, положення та спостереження поступово допомагають знайти те, що зручно.',
    contentsTitle: 'У цій статті',
    contentsSubtitle: 'Найважливіше для початку',
    tocItems: [
      'Перші кроки',
      'Ознаки, на які варто звертати увагу',
      'Правильне прикладання',
      'Коли просити допомоги',
      'Головні висновки',
    ],
    h2Step1: '1. Перші кроки',
    body1: 'Грудне вигодовування налагоджується поступово. Перші години, а потім перші дні дають дитині та мамі час навчатися разом.',
    timelineTitle: 'Початок, крок за кроком',
    timelineSubtitle: 'Простий посібник, без тиску',
    startingSteps: [
      {title: 'Після пологів', text: 'Контакт «шкіра до шкіри» та раннє прикладання можуть допомогти грудному вигодовуванню розпочатися вдало.'},
      {title: 'Перші години', text: 'Дитина може їсти часто. Нормально, що ритм змінюється.'},
      {title: 'Перші дні', text: 'Годування поступово стають спільним ритмом дитини та мами.'},
      {title: 'Налагодження ритму', text: 'Кількість молока поступово підлаштовується під потреби дитини.'},
    ],
    h2Step2: '2. Ознаки, на які варто звертати увагу',
    body2: 'Замість того, щоб зосереджуватися лише на годиннику, корисно стежити за сигналами пробудження дитини, годуваннями та характером підгузків.',
    signals: [
      {title: 'Частий ритм', text: 'Новонароджений може просити їсти часто, іноді 8–12 разів на добу.'},
      {title: 'Сигнали пробудження', text: 'Дитина може рухатися, відкривати рот або шукати груди, коли починає відчувати голод.'},
      {title: 'Підгузки', text: 'Кількість мокрих і брудних підгузків — одне з того, за чим варто стежити щодня.'},
    ],
    h2Step3: '3. Правильне прикладання',
    body3: 'Зручне положення та ефективне прикладання можуть полегшити годування. Якщо біль сильний або стійкий, медичний фахівець може перевірити положення й прикладання.',
    latchTitle: '4 показники комфорту',
    latchSubtitle: 'Проста перевірка під час годування',
    latchCenterTitle: 'Дитина + груди',
    latchCenterSubtitle: 'Зручне положення',
    latchPoints: [
      {title: 'Дитина добре розташована', text: 'Дитину тримають близько до тіла, з головою у зручному положенні.'},
      {title: 'Рот широко відкритий', text: 'Зачекайте на достатньо широке розкриття рота, перш ніж запропонувати груди.'},
      {title: 'Зручне прикладання', text: 'Ефективне прикладання не повинно спричиняти сильного чи стійкого болю.'},
      {title: 'Регулярне смоктання', text: 'Під час годування можна спостерігати рухи смоктання та ковтання.'},
    ],
    h2Step4: '4. Коли просити допомоги?',
    body4: 'Не потрібно чекати, поки труднощі стануть серйозними. Підготовлений фахівець може допомогти перевірити положення, прикладання або потреби дитини.',
    supportOptions: [
      {title: 'Акушерка', text: 'Може підтримати вас під час перших прикладань.'},
      {title: 'Медичний фахівець', text: 'Може перевірити стан здоров’я дитини та мами.'},
      {title: 'Консультант з лактації', text: 'Може допомогти, коли прикладання виявляється складним.'},
    ],
    infoTitle: 'Кожен шлях грудного вигодовування різний',
    infoText: 'Перші дні можуть дуже відрізнятися. Ритм годувань і кількість молока можуть поступово змінюватися з часом. Якщо щось вас турбує, попросіть поради в медичного фахівця.',
    h2Summary: 'Головні висновки',
    summaryItems: [
      'Перші годування — час навчання для дитини та мами.',
      'Новонароджений може просити їсти часто.',
      'Важливі зручне положення та гарне прикладання.',
      'Спостереження за сигналами дитини корисніше, ніж прагнення до ідеально сталого графіка.',
      'Акушерка чи консультант з лактації можуть допомогти подолати початкові труднощі.',
    ],
    disclaimerText: 'Інформаційний вміст. Ця стаття не замінює персоналізованих вказівок медичного фахівця.',
  },
  cs: {
    shareMessage: 'Sebevědomý začátek kojení — AWA',
    badge: 'PO PORODU • KOJENÍ',
    title: 'Sebevědomý\nzačátek kojení',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'První dny kojení jsou obdobím učení pro miminko i maminku. Přisátí, rytmus, poloha a pozorování vám postupně pomohou najít to, co je příjemné.',
    contentsTitle: 'V tomto článku',
    contentsSubtitle: 'Základy pro začátek',
    tocItems: [
      'První kroky',
      'Signály, kterých si všímat',
      'Správné přisátí',
      'Kdy požádat o pomoc',
      'Hlavní poznatky',
    ],
    h2Step1: '1. První kroky',
    body1: 'Kojení se ustaluje postupně. První hodiny a poté první dny dávají miminku i mamince čas učit se společně.',
    timelineTitle: 'Začátky krok za krokem',
    timelineSubtitle: 'Jednoduchý průvodce, bez tlaku',
    startingSteps: [
      {title: 'Po porodu', text: 'Kontakt kůže na kůži a časné přisátí mohou pomoci kojení dobře odstartovat.'},
      {title: 'První hodiny', text: 'Miminko může pít často. Je normální, že se rytmus liší.'},
      {title: 'První dny', text: 'Kojení se postupně stává společným rytmem miminka a maminky.'},
      {title: 'Ustálení rytmu', text: 'Množství mléka se postupně přizpůsobuje potřebám miminka.'},
    ],
    h2Step2: '2. Signály, kterých si všímat',
    body2: 'Místo zaměření pouze na hodiny může pomoci všímat si signálů probouzení miminka, kojení a plenek.',
    signals: [
      {title: 'Častý rytmus', text: 'Novorozenec může žádat o kojení často, někdy 8 až 12krát za 24 hodin.'},
      {title: 'Signály probouzení', text: 'Miminko se může pohybovat, otevírat ústa nebo hledat prsa, když začíná mít hlad.'},
      {title: 'Plenky', text: 'Počet mokrých a znečištěných plenek je jednou z věcí, které je dobré každý den sledovat.'},
    ],
    h2Step3: '3. Správné přisátí',
    body3: 'Pohodlná poloha a účinné přisátí mohou kojení usnadnit. Pokud je bolest výrazná nebo přetrvává, může polohu a přisátí zkontrolovat zdravotnický pracovník.',
    latchTitle: '4 ukazatele pohodlí',
    latchSubtitle: 'Jednoduchá kontrola při kojení',
    latchCenterTitle: 'Miminko + prs',
    latchCenterSubtitle: 'Pohodlná poloha',
    latchPoints: [
      {title: 'Miminko je správně položeno', text: 'Miminko je drženo blízko těla, s hlavičkou v pohodlném souladu.'},
      {title: 'Ústa dokořán', text: 'Počkejte na dostatečně široké otevření úst, než nabídnete prs.'},
      {title: 'Pohodlné přisátí', text: 'Účinné přisátí by nemělo způsobovat výraznou ani přetrvávající bolest.'},
      {title: 'Pravidelné sání', text: 'Při kojení lze pozorovat pohyby sání a polykání.'},
    ],
    h2Step4: '4. Kdy požádat o pomoc?',
    body4: 'Není třeba čekat, až budou potíže vážné. Vyškolený odborník může pomoci zkontrolovat polohu, přisátí nebo potřeby miminka.',
    supportOptions: [
      {title: 'Porodní asistentka', text: 'Může vás provázet prvními přisátími.'},
      {title: 'Zdravotnický pracovník', text: 'Může zkontrolovat zdraví miminka i maminky.'},
      {title: 'Laktační poradkyně', text: 'Může pomoci, když se přisátí ukazuje jako obtížné.'},
    ],
    infoTitle: 'Každá cesta kojením je jiná',
    infoText: 'První dny se mohou velmi lišit. Rytmus kojení i množství mléka se mohou v čase postupně měnit. Pokud vás něco znepokojuje, požádejte o radu zdravotnického pracovníka.',
    h2Summary: 'Hlavní poznatky',
    summaryItems: [
      'První kojení je obdobím učení pro miminko i maminku.',
      'Novorozenec může žádat o kojení často.',
      'Záleží na pohodlné poloze a dobrém přisátí.',
      'Sledování signálů miminka je užitečnější než snaha o dokonale pevný rozvrh.',
      'Porodní asistentka nebo laktační poradkyně vám může pomoci přes počáteční potíže.',
    ],
    disclaimerText: 'Informativní obsah. Tento článek nenahrazuje individuální radu zdravotnického pracovníka.',
  },
  sk: {
    shareMessage: 'Začíname s dojčením s dôverou — AWA',
    badge: 'PO PÔRODE • DOJČENIE',
    title: 'Začíname s dojčením\ns dôverou',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Prvé dni dojčenia sú obdobím učenia pre bábätko aj mamu. Prisatie, rytmus, poloha a pozorovanie vám postupne pomáhajú nájsť to, čo je pohodlné.',
    contentsTitle: 'V tomto článku',
    contentsSubtitle: 'Základy na začiatok',
    tocItems: [
      'Prvé kroky',
      'Znaky, ktoré treba sledovať',
      'Správne prisatie',
      'Kedy požiadať o pomoc',
      'Hlavné body',
    ],
    h2Step1: '1. Prvé kroky',
    body1: 'Dojčenie sa ustaľuje postupne. Prvé hodiny a potom prvé dni dávajú bábätku aj mame čas učiť sa spolu.',
    timelineTitle: 'Začiatky krok za krokom',
    timelineSubtitle: 'Jednoduchý sprievodca, bez tlaku',
    startingSteps: [
      {title: 'Po pôrode', text: 'Kontakt koža na kožu a skoré prisatie môžu pomôcť dobrému začiatku dojčenia.'},
      {title: 'Prvé hodiny', text: 'Bábätko sa môže dojčiť často. Je normálne, že rytmus kolíše.'},
      {title: 'Prvé dni', text: 'Kŕmenia sa postupne stávajú spoločným rytmom bábätka a mamy.'},
      {title: 'Ustálenie rytmu', text: 'Tvorba mlieka sa postupne prispôsobuje potrebám bábätka.'},
    ],
    h2Step2: '2. Znaky, ktoré treba sledovať',
    body2: 'Namiesto sledovania len hodín môže pomôcť všímať si znaky prebúdzania bábätka, kŕmenia a plienok.',
    signals: [
      {title: 'Častý rytmus', text: 'Novorodenec môže chcieť piť často, niekedy 8 až 12-krát za 24 hodín.'},
      {title: 'Znaky prebúdzania', text: 'Keď bábätko začne pociťovať hlad, môže sa hýbať, otvárať ústa alebo hľadať prsník.'},
      {title: 'Plienky', text: 'Počet mokrých a znečistených plienok je jednou z vecí, ktoré treba každý deň sledovať.'},
    ],
    h2Step3: '3. Správne prisatie',
    body3: 'Pohodlná poloha a účinné prisatie môžu kŕmenie uľahčiť. Ak je bolesť výrazná alebo pretrváva, zdravotnícky pracovník môže skontrolovať polohu a prisatie.',
    latchTitle: '4 znaky pohodlia',
    latchSubtitle: 'Jednoduchá kontrola počas kŕmenia',
    latchCenterTitle: 'Bábätko + prsník',
    latchCenterSubtitle: 'Pohodlná poloha',
    latchPoints: [
      {title: 'Dobre uložené bábätko', text: 'Bábätko je pritisnuté k telu a hlavu má v pohodlnom zarovnaní.'},
      {title: 'Široko otvorené ústa', text: 'Počkajte na dostatočne široké otvorenie úst, kým ponúknete prsník.'},
      {title: 'Pohodlné prisatie', text: 'Účinné prisatie by nemalo spôsobovať výraznú ani pretrvávajúcu bolesť.'},
      {title: 'Pravidelné cicanie', text: 'Počas kŕmenia možno pozorovať cicacie a prehĺtacie pohyby.'},
    ],
    h2Step4: '4. Kedy požiadať o pomoc?',
    body4: 'Nie je potrebné čakať, kým sa ťažkosti stanú vážnymi. Vyškolený odborník môže pomôcť skontrolovať polohu, prisatie alebo potreby bábätka.',
    supportOptions: [
      {title: 'Pôrodná asistentka', text: 'Môže vás sprevádzať pri prvých prisatiach.'},
      {title: 'Zdravotnícky pracovník', text: 'Môže skontrolovať zdravie bábätka aj mamy.'},
      {title: 'Laktačná poradkyňa', text: 'Môže pomôcť, keď je prisatie náročné.'},
    ],
    infoTitle: 'Každá cesta dojčenia je iná',
    infoText: 'Prvé dni sa môžu veľmi líšiť. Rytmus kŕmenia a množstvo mlieka sa môžu postupne meniť. Ak vás niečo znepokojuje, poraďte sa so zdravotníckym pracovníkom.',
    h2Summary: 'Hlavné body',
    summaryItems: [
      'Prvé kŕmenia sú obdobím učenia pre bábätko aj mamu.',
      'Novorodenec môže chcieť piť často.',
      'Dôležitá je pohodlná poloha a dobré prisatie.',
      'Sledovanie signálov bábätka je užitočnejšie než snaha o dokonale pevný rozvrh.',
      'Pôrodná asistentka alebo laktačná poradkyňa vám môže pomôcť s ranými ťažkosťami.',
    ],
    disclaimerText: 'Informatívny obsah. Tento článok nenahrádza individuálne usmernenie zdravotníckeho pracovníka.',
  },
  hu: {
    shareMessage: 'A szoptatás magabiztos elkezdése — AWA',
    badge: 'SZÜLÉS UTÁN • SZOPTATÁS',
    title: 'A szoptatás\nmagabiztos elkezdése',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A szoptatás első napjai tanulási időszakot jelentenek a babának és az anyának egyaránt. A rátapadás, a ritmus, a testhelyzet és a megfigyelés fokozatosan segít megtalálni, mi a kényelmes.',
    contentsTitle: 'Ebben a cikkben',
    contentsSubtitle: 'Az induláshoz szükséges alapok',
    tocItems: [
      'Az első lépések',
      'Figyelendő jelek',
      'A helyes rátapadás',
      'Mikor kérj segítséget',
      'Legfontosabb tudnivalók',
    ],
    h2Step1: '1. Az első lépések',
    body1: 'A szoptatás fokozatosan áll be. Az első órák, majd az első napok időt adnak a babának és az anyának, hogy együtt tanuljanak.',
    timelineTitle: 'Az indulás lépésről lépésre',
    timelineSubtitle: 'Egyszerű útmutató, nyomás nélkül',
    startingSteps: [
      {title: 'A szülés után', text: 'A bőrkontaktus és a korai rátapadás segíthet a szoptatás jó indításában.'},
      {title: 'Az első órák', text: 'A baba gyakran szopizhat. Természetes, hogy a ritmus változó.'},
      {title: 'Az első napok', text: 'A szoptatások fokozatosan a baba és az anya közös ritmusává válnak.'},
      {title: 'A ritmus kialakulása', text: 'A tejtermelés fokozatosan alkalmazkodik a baba igényeihez.'},
    ],
    h2Step2: '2. Figyelendő jelek',
    body2: 'Ahelyett, hogy csak az órát néznéd, segíthet figyelni a baba ébredési jeleit, a szoptatásokat és a pelenkák alakulását.',
    signals: [
      {title: 'Gyakori ritmus', text: 'Az újszülött gyakran kérhet enni, néha 24 óra alatt 8–12 alkalommal.'},
      {title: 'Ébredési jelek', text: 'Amikor a baba éhezni kezd, mozoghat, kinyithatja a száját, vagy keresheti a mellet.'},
      {title: 'Pelenkák', text: 'A nedves és szennyezett pelenkák száma az egyik dolog, amit érdemes naponta figyelni.'},
    ],
    h2Step3: '3. A helyes rátapadás',
    body3: 'A kényelmes testhelyzet és a hatékony rátapadás megkönnyítheti a szoptatásokat. Ha a fájdalom jelentős vagy tartós, egészségügyi szakember ellenőrizheti a testhelyzetet és a rátapadást.',
    latchTitle: 'A kényelem 4 jele',
    latchSubtitle: 'Egyszerű ellenőrzés a szoptatás közben',
    latchCenterTitle: 'Baba + mell',
    latchCenterSubtitle: 'Kényelmes testhelyzet',
    latchPoints: [
      {title: 'Jól elhelyezett baba', text: 'A babát testhez simulva tartod, a feje kényelmes vonalban van.'},
      {title: 'Szélesre nyitott száj', text: 'Várj a kellően széles szájnyitásra, mielőtt felkínálod a mellet.'},
      {title: 'Kényelmes rátapadás', text: 'A hatékony rátapadás nem okozhat jelentős vagy tartós fájdalmat.'},
      {title: 'Egyenletes szopás', text: 'A szopó és nyelő mozdulatok megfigyelhetők a szoptatás során.'},
    ],
    h2Step4: '4. Mikor kérj segítséget?',
    body4: 'Nem kell megvárni, hogy a nehézségek súlyossá váljanak. Képzett szakember segíthet ellenőrizni a testhelyzetet, a rátapadást vagy a baba igényeit.',
    supportOptions: [
      {title: 'Szülésznő', text: 'Végigkísérhet az első rátapadásokon.'},
      {title: 'Egészségügyi szakember', text: 'Ellenőrizheti a baba és az anya egészségét.'},
      {title: 'Laktációs tanácsadó', text: 'Segíthet, ha a rátapadás nehéznek bizonyul.'},
    ],
    infoTitle: 'Minden szoptatási út más',
    infoText: 'Az első napok nagyon különbözőek lehetnek. A szoptatások ritmusa és a tej mennyisége fokozatosan változhat. Ha valami aggaszt, kérj tanácsot egészségügyi szakembertől.',
    h2Summary: 'Legfontosabb tudnivalók',
    summaryItems: [
      'Az első szoptatások tanulási időszakot jelentenek a babának és az anyának.',
      'Az újszülött gyakran kérhet enni.',
      'A kényelmes testhelyzet és a jó rátapadás fontos.',
      'A baba jelzéseinek figyelése hasznosabb, mint egy tökéletesen rögzített napirendre törekedni.',
      'Egy szülésznő vagy laktációs tanácsadó segíthet a kezdeti nehézségekben.',
    ],
    disclaimerText: 'Tájékoztató jellegű tartalom. Ez a cikk nem helyettesíti egészségügyi szakember személyre szabott útmutatását.',
  },
  ro: {
    shareMessage: 'Începerea alăptării cu încredere — AWA',
    badge: 'POSTNATAL • ALĂPTARE',
    title: 'Începerea alăptării\ncu încredere',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Primele zile de alăptare sunt o perioadă de învățare atât pentru bebeluș, cât și pentru mamă. Prinderea la sân, ritmul, poziția și observarea te ajută treptat să găsești ce ți se potrivește.',
    contentsTitle: 'În acest articol',
    contentsSubtitle: 'Esențialul pentru a începe',
    tocItems: [
      'Primii pași',
      'Semne de urmărit',
      'O prindere bună la sân',
      'Când să ceri ajutor',
      'Ce să reții',
    ],
    h2Step1: '1. Primii pași',
    body1: 'Alăptarea se instalează treptat. Primele ore, apoi primele zile le oferă bebelușului și mamei timp să învețe împreună.',
    timelineTitle: 'Începutul, pas cu pas',
    timelineSubtitle: 'Un ghid simplu, fără presiune',
    startingSteps: [
      {title: 'După naștere', text: 'Contactul piele pe piele și o prindere timpurie la sân pot ajuta alăptarea să înceapă bine.'},
      {title: 'Primele ore', text: 'Bebelușul poate mânca des. Este normal ca ritmul să varieze.'},
      {title: 'Primele zile', text: 'Mesele devin treptat un ritm comun pentru bebeluș și mamă.'},
      {title: 'Stabilirea unui ritm', text: 'Producția de lapte se adaptează treptat la nevoile bebelușului.'},
    ],
    h2Step2: '2. Semne de urmărit',
    body2: 'În loc să te concentrezi doar pe ceas, te poate ajuta să urmărești semnele de trezire ale bebelușului, mesele și scutecele.',
    signals: [
      {title: 'Un ritm frecvent', text: 'Un nou-născut poate cere să mănânce des, uneori de 8 până la 12 ori în 24 de ore.'},
      {title: 'Semne de trezire', text: 'Bebelușul se poate mișca, poate deschide gura sau poate căuta sânul când începe să-i fie foame.'},
      {title: 'Scutecele', text: 'Numărul de scutece ude și murdare este unul dintre lucrurile de urmărit zi de zi.'},
    ],
    h2Step3: '3. O prindere bună la sân',
    body3: 'O poziție confortabilă și o prindere eficientă pot ușura mesele. Dacă durerea este importantă sau persistentă, un profesionist din domeniul sănătății poate verifica poziția și prinderea.',
    latchTitle: 'Cele 4 repere de confort',
    latchSubtitle: 'O verificare simplă în timpul meselor',
    latchCenterTitle: 'Bebeluș + sân',
    latchCenterSubtitle: 'Poziție confortabilă',
    latchPoints: [
      {title: 'Bebeluș bine poziționat', text: 'Bebelușul este ținut aproape de corp, cu capul într-o aliniere confortabilă.'},
      {title: 'Gura larg deschisă', text: 'Așteaptă ca gura să fie suficient de larg deschisă înainte de a oferi sânul.'},
      {title: 'Prindere confortabilă', text: 'O prindere eficientă nu ar trebui să provoace durere importantă sau persistentă.'},
      {title: 'Supt regulat', text: 'Mișcările de supt și de înghițit pot fi observate în timpul mesei.'},
    ],
    h2Step4: '4. Când să ceri ajutor?',
    body4: 'Nu e nevoie să aștepți ca dificultățile să devină serioase. Un profesionist format te poate ajuta să verifici poziția, prinderea sau nevoile bebelușului.',
    supportOptions: [
      {title: 'Moașă', text: 'Te poate sprijini în primele prinderi la sân.'},
      {title: 'Profesionist din domeniul sănătății', text: 'Poate verifica starea de sănătate a bebelușului și a mamei.'},
      {title: 'Consultant în alăptare', text: 'Te poate ajuta când prinderea la sân se dovedește dificilă.'},
    ],
    infoTitle: 'Fiecare parcurs de alăptare este diferit',
    infoText: 'Primele zile pot varia foarte mult. Ritmul meselor și cantitatea de lapte se pot schimba treptat în timp. Dacă ceva te îngrijorează, cere sfatul unui profesionist din domeniul sănătății.',
    h2Summary: 'Ce să reții',
    summaryItems: [
      'Primele mese sunt o perioadă de învățare pentru bebeluș și mamă.',
      'Un nou-născut poate cere să mănânce frecvent.',
      'O poziție confortabilă și o prindere bună la sân contează.',
      'Urmărirea semnalelor bebelușului este mai utilă decât țintirea unui program perfect fix.',
      'O moașă sau un consultant în alăptare te poate ajuta să depășești dificultățile de la început.',
    ],
    disclaimerText: 'Conținut cu caracter informativ. Acest articol nu înlocuiește îndrumarea personalizată a unui profesionist din domeniul sănătății.',
  },
  bg: {
    shareMessage: 'Започване на кърменето с увереност — AWA',
    badge: 'СЛЕД РАЖДАНЕ • КЪРМЕНЕ',
    title: 'Започване на кърменето\nс увереност',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Първите дни на кърмене са период на учене както за бебето, така и за майката. Захващането, ритъмът, позицията и наблюдението постепенно ти помагат да откриеш какво е удобно.',
    contentsTitle: 'В тази статия',
    contentsSubtitle: 'Основното, за да започнеш',
    tocItems: [
      'Първите стъпки',
      'Признаци, които да следиш',
      'Добро захващане',
      'Кога да потърсиш помощ',
      'Какво да запомниш',
    ],
    h2Step1: '1. Първите стъпки',
    body1: 'Кърменето се установява постепенно. Първите часове, а после първите дни дават на бебето и майката време да се научат заедно.',
    timelineTitle: 'Началото, стъпка по стъпка',
    timelineSubtitle: 'Просто ръководство, без натиск',
    startingSteps: [
      {title: 'След раждането', text: 'Контактът кожа до кожа и ранното захващане могат да помогнат кърменето да започне добре.'},
      {title: 'Първите часове', text: 'Бебето може да се храни често. Нормално е ритъмът да варира.'},
      {title: 'Първите дни', text: 'Храненията постепенно се превръщат в общ ритъм за бебето и майката.'},
      {title: 'Установяване на ритъм', text: 'Количеството мляко постепенно се приспособява към нуждите на бебето.'},
    ],
    h2Step2: '2. Признаци, които да следиш',
    body2: 'Вместо да се съсредоточаваш само върху часовника, може да ти помогне да следиш признаците на събуждане на бебето, храненията и пелените.',
    signals: [
      {title: 'Чест ритъм', text: 'Новороденото може да иска да се храни често, понякога 8 до 12 пъти в рамките на 24 часа.'},
      {title: 'Признаци на събуждане', text: 'Бебето може да се движи, да отваря устата си или да търси гърдата, когато започне да огладнява.'},
      {title: 'Пелени', text: 'Броят на мокрите и изцапаните пелени е едно от нещата, които да следиш ден за ден.'},
    ],
    h2Step3: '3. Добро захващане',
    body3: 'Удобна позиция и ефективно захващане могат да улеснят храненията. Ако болката е значителна или упорита, здравен специалист може да провери позицията и захващането.',
    latchTitle: 'Четирите ориентира за комфорт',
    latchSubtitle: 'Просто наблюдение по време на храненията',
    latchCenterTitle: 'Бебе + гърда',
    latchCenterSubtitle: 'Удобна позиция',
    latchPoints: [
      {title: 'Бебето е добре позиционирано', text: 'Бебето е държано близо до тялото, с глава в удобно изравняване.'},
      {title: 'Устата широко отворена', text: 'Изчакай устата да се отвори достатъчно широко, преди да предложиш гърдата.'},
      {title: 'Удобно захващане', text: 'Ефективното захващане не бива да причинява значителна или упорита болка.'},
      {title: 'Редовно сучене', text: 'Движенията на сучене и преглъщане могат да се наблюдават по време на храненето.'},
    ],
    h2Step4: '4. Кога да потърсиш помощ?',
    body4: 'Не е нужно да чакаш затрудненията да станат сериозни. Обучен специалист може да ти помогне да провериш позицията, захващането или нуждите на бебето.',
    supportOptions: [
      {title: 'Акушерка', text: 'Може да те подкрепи при първите захващания.'},
      {title: 'Здравен специалист', text: 'Може да провери здравето на бебето и майката.'},
      {title: 'Консултант по кърмене', text: 'Може да помогне, когато захващането се окаже трудно.'},
    ],
    infoTitle: 'Всеки път на кърмене е различен',
    infoText: 'Първите дни могат да варират много. Ритъмът на храненията и количеството мляко могат да се променят постепенно във времето. Ако нещо те тревожи, поискай съвет от здравен специалист.',
    h2Summary: 'Какво да запомниш',
    summaryItems: [
      'Първите хранения са период на учене за бебето и майката.',
      'Новороденото може да иска да се храни често.',
      'Удобната позиция и доброто захващане са важни.',
      'Следенето на сигналите на бебето е по-полезно от стремежа към съвършено фиксиран график.',
      'Акушерка или консултант по кърмене може да ти помогне да преодолееш първоначалните затруднения.',
    ],
    disclaimerText: 'Информационно съдържание. Тази статия не замества персонализираните насоки на здравен специалист.',
  },
  sr: {
    shareMessage: 'Започињање дојења са самопоуздањем — AWA',
    badge: 'ПОСЛЕ ПОРОЂАЈА • ДОЈЕЊЕ',
    title: 'Започињање дојења\nса самопоуздањем',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Први дани дојења су период учења и за бебу и за мајку. Прихватање дојке, ритам, положај и посматрање постепено ти помажу да пронађеш оно што ти одговара.',
    contentsTitle: 'У овом чланку',
    contentsSubtitle: 'Основно да почнеш',
    tocItems: [
      'Први кораци',
      'Знаци на које треба обратити пажњу',
      'Добро прихватање дојке',
      'Када затражити помоћ',
      'Шта да запамтиш',
    ],
    h2Step1: '1. Први кораци',
    body1: 'Дојење се успоставља постепено. Први сати, а затим први дани дају беби и мајци времена да уче заједно.',
    timelineTitle: 'Почетак, корак по корак',
    timelineSubtitle: 'Једноставан водич, без притиска',
    startingSteps: [
      {title: 'После порођаја', text: 'Контакт кожа на кожу и рано прихватање дојке могу помоћи да дојење добро почне.'},
      {title: 'Први сати', text: 'Беба може често сисати. Нормално је да ритам варира.'},
      {title: 'Први дани', text: 'Подојавања постепено постају заједнички ритам бебе и мајке.'},
      {title: 'Успостављање ритма', text: 'Количина млека се постепено прилагођава потребама бебе.'},
    ],
    h2Step2: '2. Знаци на које треба обратити пажњу',
    body2: 'Уместо да се фокусираш само на сат, може бити корисно пратити знаке буђења бебе, подојавања и обрасце пелена.',
    signals: [
      {title: 'Чест ритам', text: 'Новорођенче може тражити да сиса често, понекад 8 до 12 пута у 24 сата.'},
      {title: 'Знаци буђења', text: 'Беба се може кретати, отварати уста или тражити дојку када почне да осећа глад.'},
      {title: 'Пелене', text: 'Број мокрих и прљавих пелена је једна од ствари на које треба пазити из дана у дан.'},
    ],
    h2Step3: '3. Добро прихватање дојке',
    body3: 'Удобан положај и ефикасно прихватање дојке могу олакшати подојавања. Ако је бол значајан или упоран, здравствени радник може проверити положај и прихватање.',
    latchTitle: 'Четири показатеља удобности',
    latchSubtitle: 'Једноставна провера током подојавања',
    latchCenterTitle: 'Беба + дојка',
    latchCenterSubtitle: 'Удобан положај',
    latchPoints: [
      {title: 'Беба је добро постављена', text: 'Беба је држана близу тела, са главом у удобном положају.'},
      {title: 'Широко отворена уста', text: 'Сачекај довољно широко отварање уста пре него што понудиш дојку.'},
      {title: 'Удобно прихватање', text: 'Ефикасно прихватање не би требало да изазива значајан или упоран бол.'},
      {title: 'Редовно сисање', text: 'Покрети сисања и гутања могу се уочити током подојавања.'},
    ],
    h2Step4: '4. Када затражити помоћ?',
    body4: 'Не мораш чекати да тешкоће постану озбиљне. Обучен стручњак може помоћи да се провере положај, прихватање дојке или потребе бебе.',
    supportOptions: [
      {title: 'Бабица', text: 'Може те подржати током првих подојавања.'},
      {title: 'Здравствени радник', text: 'Може проверити здравље бебе и мајке.'},
      {title: 'Саветница за дојење', text: 'Може помоћи када се прихватање дојке показује тешким.'},
    ],
    infoTitle: 'Свако дојење је другачије',
    infoText: 'Први дани могу се веома разликовати. Ритам подојавања и количина млека могу се постепено мењати током времена. Ако те нешто брине, затражи савет од здравственог радника.',
    h2Summary: 'Шта да запамтиш',
    summaryItems: [
      'Прва подојавања су период учења за бебу и мајку.',
      'Новорођенче може тражити да сиса често.',
      'Удобан положај и добро прихватање дојке су важни.',
      'Праћење знакова бебе је корисније од тежње ка савршено утврђеном распореду.',
      'Бабица или саветница за дојење може ти помоћи кроз почетне тешкоће.',
    ],
    disclaimerText: 'Информативни садржај. Овај чланак не замењује персонализоване савете здравственог радника.',
  },
  hr: {
    shareMessage: 'Započni dojenje s povjerenjem — AWA',
    badge: 'NAKON PORODA • DOJENJE',
    title: 'Započni dojenje\ns povjerenjem',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Prvi dani dojenja razdoblje su učenja za bebu i za majku. Hvatanje dojke, ritam, položaj i promatranje postupno ti pomažu pronaći ono što ti odgovara.',
    contentsTitle: 'U ovom članku',
    contentsSubtitle: 'Osnove za početak',
    tocItems: [
      'Prvi koraci',
      'Znakovi na koje treba paziti',
      'Dobar zahvat dojke',
      'Kada zatražiti pomoć',
      'Ključne poruke',
    ],
    h2Step1: '1. Prvi koraci',
    body1: 'Dojenje se uspostavlja postupno. Prvi sati, a zatim prvi dani daju bebi i majci vremena da zajedno uče.',
    timelineTitle: 'Početak, korak po korak',
    timelineSubtitle: 'Jednostavan vodič, bez pritiska',
    startingSteps: [
      {title: 'Nakon poroda', text: 'Kontakt koža na kožu i rani zahvat dojke mogu pomoći da dojenje dobro započne.'},
      {title: 'Prvi sati', text: 'Beba može sisati često. Normalno je da se ritam mijenja.'},
      {title: 'Prvi dani', text: 'Podoji postupno postaju zajednički ritam bebe i majke.'},
      {title: 'Uspostavljanje ritma', text: 'Količina mlijeka postupno se prilagođava bebinim potrebama.'},
    ],
    h2Step2: '2. Znakovi na koje treba paziti',
    body2: 'Umjesto da se usredotočiš samo na sat, može pomoći promatrati bebine znakove buđenja, podoje i broj pelena.',
    signals: [
      {title: 'Čest ritam', text: 'Novorođenče može tražiti dojku često, ponekad 8 do 12 puta u 24 sata.'},
      {title: 'Znakovi buđenja', text: 'Beba se može pomicati, otvarati usta ili tražiti dojku kad počne osjećati glad.'},
      {title: 'Pelene', text: 'Broj mokrih i prljavih pelena jedna je od stvari koje vrijedi svakodnevno pratiti.'},
    ],
    h2Step3: '3. Dobar zahvat dojke',
    body3: 'Udoban položaj i učinkovit zahvat dojke mogu olakšati podoje. Ako je bol jaka ili stalna, zdravstveni djelatnik može provjeriti položaj i zahvat.',
    latchTitle: '4 pokazatelja ugode',
    latchSubtitle: 'Jednostavna provjera tijekom podoja',
    latchCenterTitle: 'Beba + dojka',
    latchCenterSubtitle: 'Udoban položaj',
    latchPoints: [
      {title: 'Beba dobro položena', text: 'Beba je prislonjena uz tijelo, a glava joj je u udobnom poravnanju.'},
      {title: 'Usta širom otvorena', text: 'Pričekaj dovoljno široko otvaranje usta prije nego ponudiš dojku.'},
      {title: 'Udoban zahvat', text: 'Učinkovit zahvat ne bi smio uzrokovati jaku ni stalnu bol.'},
      {title: 'Ritmično sisanje', text: 'Pokrete sisanja i gutanja moguće je primijetiti tijekom podoja.'},
    ],
    h2Step4: '4. Kada zatražiti pomoć?',
    body4: 'Nema potrebe čekati da poteškoće postanu ozbiljne. Educirana stručna osoba može pomoći provjeriti položaj, zahvat dojke ili bebine potrebe.',
    supportOptions: [
      {title: 'Babica', text: 'Može te pratiti kroz prve zahvate dojke.'},
      {title: 'Zdravstveni djelatnik', text: 'Može provjeriti zdravlje bebe i majke.'},
      {title: 'Savjetnica za dojenje', text: 'Može pomoći kad se zahvat dojke pokaže teškim.'},
    ],
    infoTitle: 'Svako je iskustvo dojenja drugačije',
    infoText: 'Prvi dani mogu se jako razlikovati. Ritam podoja i količina mlijeka mogu se s vremenom postupno mijenjati. Ako te nešto brine, zatraži savjet zdravstvenog djelatnika.',
    h2Summary: 'Ključne poruke',
    summaryItems: [
      'Prvi podoji razdoblje su učenja za bebu i majku.',
      'Novorođenče može često tražiti dojku.',
      'Važni su udoban položaj i dobar zahvat dojke.',
      'Promatranje bebinih znakova korisnije je od težnje za savršeno čvrstim rasporedom.',
      'Babica ili savjetnica za dojenje može ti pomoći kroz početne poteškoće.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje individualne smjernice zdravstvenog djelatnika.',
  },
  bs: {
    shareMessage: 'Započni dojenje s povjerenjem — AWA',
    badge: 'NAKON PORODA • DOJENJE',
    title: 'Započni dojenje\ns povjerenjem',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Prvi dani dojenja razdoblje su učenja za bebu i za majku. Hvatanje dojke, ritam, položaj i promatranje postupno ti pomažu pronaći ono što ti odgovara.',
    contentsTitle: 'U ovom članku',
    contentsSubtitle: 'Osnove za početak',
    tocItems: [
      'Prvi koraci',
      'Znakovi na koje treba paziti',
      'Dobar zahvat dojke',
      'Kada zatražiti pomoć',
      'Ključne poruke',
    ],
    h2Step1: '1. Prvi koraci',
    body1: 'Dojenje se uspostavlja postupno. Prvi sati, a zatim prvi dani daju bebi i majci vremena da zajedno uče.',
    timelineTitle: 'Početak, korak po korak',
    timelineSubtitle: 'Jednostavan vodič, bez pritiska',
    startingSteps: [
      {title: 'Nakon porođaja', text: 'Kontakt koža na kožu i rani zahvat dojke mogu pomoći da dojenje dobro započne.'},
      {title: 'Prvi sati', text: 'Beba može sisati često. Normalno je da se ritam mijenja.'},
      {title: 'Prvi dani', text: 'Podoji postupno postaju zajednički ritam bebe i majke.'},
      {title: 'Uspostavljanje ritma', text: 'Količina mlijeka postupno se prilagođava bebinim potrebama.'},
    ],
    h2Step2: '2. Znakovi na koje treba paziti',
    body2: 'Umjesto da se usredotočiš samo na sat, može pomoći promatrati bebine znakove buđenja, podoje i broj pelena.',
    signals: [
      {title: 'Čest ritam', text: 'Novorođenče može tražiti dojku često, ponekad 8 do 12 puta u 24 sata.'},
      {title: 'Znakovi buđenja', text: 'Beba se može pomicati, otvarati usta ili tražiti dojku kad počne osjećati glad.'},
      {title: 'Pelene', text: 'Broj mokrih i prljavih pelena jedna je od stvari koje vrijedi svakodnevno pratiti.'},
    ],
    h2Step3: '3. Dobar zahvat dojke',
    body3: 'Udoban položaj i učinkovit zahvat dojke mogu olakšati podoje. Ako je bol jaka ili stalna, zdravstveni radnik može provjeriti položaj i zahvat.',
    latchTitle: '4 pokazatelja ugode',
    latchSubtitle: 'Jednostavna provjera tokom podoja',
    latchCenterTitle: 'Beba + dojka',
    latchCenterSubtitle: 'Udoban položaj',
    latchPoints: [
      {title: 'Beba dobro položena', text: 'Beba je prislonjena uz tijelo, a glava joj je u udobnom poravnanju.'},
      {title: 'Usta širom otvorena', text: 'Pričekaj dovoljno široko otvaranje usta prije nego ponudiš dojku.'},
      {title: 'Udoban zahvat', text: 'Učinkovit zahvat ne bi smio uzrokovati jaku ni stalnu bol.'},
      {title: 'Ritmično sisanje', text: 'Pokrete sisanja i gutanja moguće je primijetiti tokom podoja.'},
    ],
    h2Step4: '4. Kada zatražiti pomoć?',
    body4: 'Nema potrebe čekati da poteškoće postanu ozbiljne. Educirana stručna osoba može pomoći provjeriti položaj, zahvat dojke ili bebine potrebe.',
    supportOptions: [
      {title: 'Babica', text: 'Može te pratiti kroz prve zahvate dojke.'},
      {title: 'Zdravstveni radnik', text: 'Može provjeriti zdravlje bebe i majke.'},
      {title: 'Savjetnica za dojenje', text: 'Može pomoći kad se zahvat dojke pokaže teškim.'},
    ],
    infoTitle: 'Svako je iskustvo dojenja drugačije',
    infoText: 'Prvi dani mogu se jako razlikovati. Ritam podoja i količina mlijeka mogu se s vremenom postupno mijenjati. Ako te nešta brine, zatraži savjet zdravstvenog radnika.',
    h2Summary: 'Ključne poruke',
    summaryItems: [
      'Prvi podoji razdoblje su učenja za bebu i majku.',
      'Novorođenče može često tražiti dojku.',
      'Važni su udoban položaj i dobar zahvat dojke.',
      'Promatranje bebinih znakova korisnije je od težnje za savršeno čvrstim rasporedom.',
      'Babica ili savjetnica za dojenje može ti pomoći kroz početne poteškoće.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje individualne smjernice zdravstvenog radnika.',
  },
  sl: {
    shareMessage: 'Z zaupanjem začni dojiti — AWA',
    badge: 'PO PORODU • DOJENJE',
    title: 'Z zaupanjem\nzačni dojiti',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Prvi dnevi dojenja so obdobje učenja za dojenčka in za mamo. Prijem dojke, ritem, položaj in opazovanje ti postopoma pomagajo najti, kar ti ustreza.',
    contentsTitle: 'V tem članku',
    contentsSubtitle: 'Osnove za začetek',
    tocItems: [
      'Prvi koraki',
      'Znaki, na katere je treba paziti',
      'Dober prijem dojke',
      'Kdaj poiskati pomoč',
      'Ključna sporočila',
    ],
    h2Step1: '1. Prvi koraki',
    body1: 'Dojenje se vzpostavlja postopoma. Prve ure, nato prvi dnevi dajo dojenčku in mami čas, da se skupaj učita.',
    timelineTitle: 'Začetek, korak za korakom',
    timelineSubtitle: 'Preprost vodnik, brez pritiska',
    startingSteps: [
      {title: 'Po porodu', text: 'Stik koža na kožo in zgodnji prijem dojke lahko pomagata, da dojenje dobro steče.'},
      {title: 'Prve ure', text: 'Dojenček lahko doji pogosto. Normalno je, da se ritem spreminja.'},
      {title: 'Prvi dnevi', text: 'Podoji postopoma postanejo skupen ritem dojenčka in mame.'},
      {title: 'Vzpostavljanje ritma', text: 'Količina mleka se postopoma prilagaja dojenčkovim potrebam.'},
    ],
    h2Step2: '2. Znaki, na katere je treba paziti',
    body2: 'Namesto da se osredotočaš samo na uro, ti lahko pomaga opazovanje dojenčkovih znakov budnosti, podojev in števila plenic.',
    signals: [
      {title: 'Pogost ritem', text: 'Novorojenček lahko zahteva dojenje pogosto, včasih 8- do 12-krat v 24 urah.'},
      {title: 'Znaki budnosti', text: 'Dojenček se lahko premika, odpira usta ali išče dojko, ko začne čutiti lakoto.'},
      {title: 'Plenice', text: 'Število mokrih in umazanih plenic je ena od stvari, ki jih je vredno spremljati iz dneva v dan.'},
    ],
    h2Step3: '3. Dober prijem dojke',
    body3: 'Udoben položaj in učinkovit prijem dojke lahko olajšata podoje. Če je bolečina huda ali stalna, lahko zdravstveni delavec preveri položaj in prijem.',
    latchTitle: '4 kazalniki udobja',
    latchSubtitle: 'Preprosto preverjanje med podojem',
    latchCenterTitle: 'Dojenček + dojka',
    latchCenterSubtitle: 'Udoben položaj',
    latchPoints: [
      {title: 'Dojenček dobro nameščen', text: 'Dojenček je prislonjen ob telo, glava pa je v udobni poravnavi.'},
      {title: 'Usta široko odprta', text: 'Počakaj na dovolj široko odprtje ust, preden ponudiš dojko.'},
      {title: 'Udoben prijem', text: 'Učinkovit prijem ne bi smel povzročati hude ali stalne bolečine.'},
      {title: 'Ritmično sesanje', text: 'Gibe sesanja in požiranja je mogoče opaziti med podojem.'},
    ],
    h2Step4: '4. Kdaj poiskati pomoč?',
    body4: 'Ni treba čakati, da težave postanejo resne. Usposobljen strokovnjak ti lahko pomaga preveriti položaj, prijem dojke ali dojenčkove potrebe.',
    supportOptions: [
      {title: 'Babica', text: 'Te lahko podpira pri prvih prijemih dojke.'},
      {title: 'Zdravstveni delavec', text: 'Lahko preveri zdravje dojenčka in mame.'},
      {title: 'Svetovalka za dojenje', text: 'Lahko pomaga, kadar se prijem dojke izkaže za težkega.'},
    ],
    infoTitle: 'Vsaka izkušnja dojenja je drugačna',
    infoText: 'Prvi dnevi so lahko zelo različni. Ritem podojev in količina mleka se lahko s časom postopoma spreminjata. Če te kaj skrbi, poišči nasvet zdravstvenega delavca.',
    h2Summary: 'Ključna sporočila',
    summaryItems: [
      'Prvi podoji so obdobje učenja za dojenčka in mamo.',
      'Novorojenček lahko pogosto zahteva dojenje.',
      'Pomembna sta udoben položaj in dober prijem dojke.',
      'Opazovanje dojenčkovih znakov je koristnejše od teženja k popolnoma togemu urniku.',
      'Babica ali svetovalka za dojenje ti lahko pomaga skozi začetne težave.',
    ],
    disclaimerText: 'Informativna vsebina. Ta članek ne nadomešča osebnih smernic zdravstvenega delavca.',
  },
  ne: {
    shareMessage: 'आत्मविश्वासका साथ स्तनपान सुरु गर्दै — AWA',
    badge: 'सुत्केरीपछि • स्तनपान',
    title: 'आत्मविश्वासका साथ\nस्तनपान सुरु गर्दै',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'स्तनपानका पहिलो दिनहरू शिशु र आमा दुवैका लागि सिक्ने अवधि हुन्। मुखमा समात्ने तरिका, लय, आसन र अवलोकनले बिस्तारै तपाईंलाई के सहज लाग्छ भेट्टाउन मद्दत गर्छ।',
    contentsTitle: 'यो लेखमा',
    contentsSubtitle: 'सुरु गर्न आवश्यक कुराहरू',
    tocItems: [
      'पहिला पाइलाहरू',
      'ध्यान दिनुपर्ने संकेतहरू',
      'राम्रो ल्याच (मुखमा समात्ने तरिका)',
      'कहिले मद्दत माग्ने',
      'मुख्य कुराहरू',
    ],
    h2Step1: '1. पहिला पाइलाहरू',
    body1: 'स्तनपान बिस्तारै स्थापित हुन्छ। पहिलो घण्टा, त्यसपछि पहिलो दिनहरूले शिशु र आमालाई सँगै सिक्ने समय दिन्छन्।',
    timelineTitle: 'सुरुवात, चरणबद्ध रूपमा',
    timelineSubtitle: 'एउटा सरल मार्गदर्शन, कुनै दबाबबिना',
    startingSteps: [
      {title: 'प्रसवपछि', text: 'छालाले छालामा सम्पर्क र चाँडो मुखमा समात्न दिनाले स्तनपानलाई राम्रो सुरुवात दिन मद्दत गर्न सक्छ।'},
      {title: 'पहिला घण्टाहरू', text: 'शिशुले बारम्बार दूध पिउन सक्छ। लय फरक-फरक हुनु सामान्य हो।'},
      {title: 'पहिला दिनहरू', text: 'दूध खुवाउने क्रम बिस्तारै शिशु र आमाको साझा लय बन्छ।'},
      {title: 'लयमा बस्दै', text: 'दूधको मात्रा बिस्तारै शिशुको आवश्यकताअनुसार मिल्छ।'},
    ],
    h2Step2: '2. ध्यान दिनुपर्ने संकेतहरू',
    body2: 'केवल घडीमा ध्यान दिनुको सट्टा, शिशुका ब्युँझिने संकेत, दूध खुवाइ र डाइपरको ढाँचा हेर्नु मद्दतकारी हुन सक्छ।',
    signals: [
      {title: 'बारम्बार लय', text: 'नवजात शिशुले प्रायः दूध खान माग्न सक्छ, कहिलेकाहीँ 24 घण्टामा 8 देखि 12 पटकसम्म।'},
      {title: 'ब्युँझिने संकेतहरू', text: 'भोक लाग्न थाल्दा शिशुले चलमल गर्न, मुख खोल्न वा स्तन खोज्न सक्छ।'},
      {title: 'डाइपरहरू', text: 'ओभानो र फोहर डाइपरको सङ्ख्या दिनदिनै नजर राख्नुपर्ने कुराहरूमध्ये एक हो।'},
    ],
    h2Step3: '3. राम्रो ल्याच (मुखमा समात्ने तरिका)',
    body3: 'सहज आसन र प्रभावकारी ल्याचले दूध खुवाउने काम सजिलो बनाउन सक्छ। दुखाइ ठूलो वा लगातार भए, स्वास्थ्यकर्मीले आसन र ल्याच जाँच्न सक्छन्।',
    latchTitle: '4 सहजताका सूचकहरू',
    latchSubtitle: 'दूध खुवाउँदा एउटा सरल जाँच',
    latchCenterTitle: 'शिशु + स्तन',
    latchCenterSubtitle: 'सहज आसन',
    latchPoints: [
      {title: 'शिशु राम्ररी राखिएको', text: 'शिशुलाई शरीरको नजिक, टाउको सहज रेखामा रहने गरी समातिन्छ।'},
      {title: 'मुख पूरै खुला', text: 'स्तन दिनुअघि मुख पर्याप्त चौडा खुल्न पर्खनुहोस्।'},
      {title: 'सहज ल्याच', text: 'प्रभावकारी ल्याचले ठूलो वा लगातार दुखाइ गराउनु हुँदैन।'},
      {title: 'नियमित चुस्ने', text: 'दूध खुवाउँदा चुस्ने र निल्ने चालहरू देख्न सकिन्छ।'},
    ],
    h2Step4: '4. कहिले मद्दत माग्ने?',
    body4: 'कठिनाइहरू गम्भीर नभएसम्म पर्खनु पर्दैन। प्रशिक्षित व्यावसायिकले आसन, ल्याच वा शिशुका आवश्यकताहरू जाँच्न मद्दत गर्न सक्छन्।',
    supportOptions: [
      {title: 'सुँडेनी', text: 'पहिला पटक मुखमा समात्न दिने क्रममा तपाईंलाई साथ दिन सक्छिन्।'},
      {title: 'स्वास्थ्यकर्मी', text: 'शिशु र आमाको स्वास्थ्य जाँच्न सक्छन्।'},
      {title: 'स्तनपान परामर्शदाता', text: 'ल्याच गाह्रो हुँदा मद्दत गर्न सक्छन्।'},
    ],
    infoTitle: 'हरेक स्तनपानको यात्रा फरक हुन्छ',
    infoText: 'पहिलो दिनहरू धेरै फरक हुन सक्छन्। दूध खुवाउने लय र दूधको मात्रा समयसँगै बिस्तारै बदलिन सक्छ। केही कुराले चिन्तित बनाए, स्वास्थ्यकर्मीसँग सल्लाह लिनुहोस्।',
    h2Summary: 'मुख्य कुराहरू',
    summaryItems: [
      'पहिलो दूध खुवाइहरू शिशु र आमाका लागि सिक्ने अवधि हुन्।',
      'नवजात शिशुले बारम्बार दूध खान माग्न सक्छ।',
      'सहज आसन र राम्रो ल्याच महत्त्वपूर्ण छन्।',
      'पूर्ण रूपमा निश्चित तालिकाको लक्ष्य राख्नुभन्दा शिशुका संकेतहरू हेर्नु बढी उपयोगी हुन्छ।',
      'सुँडेनी वा स्तनपान परामर्शदाताले सुरुका कठिनाइहरूमा तपाईंलाई मद्दत गर्न सक्छन्।',
    ],
    disclaimerText: 'जानकारीमूलक सामग्री। यो लेखले स्वास्थ्यकर्मीको व्यक्तिगत मार्गदर्शनको स्थान लिँदैन।',
  },
  si: {
    shareMessage: 'විශ්වාසයෙන් මව්කිරි පෙවීම ආරම්භ කිරීම — AWA',
    badge: 'ප්‍රසූතියෙන් පසු • මව්කිරි පෙවීම',
    title: 'විශ්වාසයෙන් මව්කිරි පෙවීම\nආරම්භ කිරීම',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'මව්කිරි පෙවීමේ පළමු දින දරුවාටත් මවටත් ඉගෙනීමේ කාලයකි. කිරි උරා බොන ඇල්ලීම, රිද්මය, ඉරියව්ව සහ නිරීක්ෂණය ඔබට සුවපහසු දේ ක්‍රමයෙන් සොයාගැනීමට උපකාරී වේ.',
    contentsTitle: 'මෙම ලිපියේ',
    contentsSubtitle: 'ආරම්භ කිරීමට අත්‍යවශ්‍ය දේ',
    tocItems: [
      'පළමු පියවර',
      'අවධානයට ලක් කළ යුතු සලකුණු',
      'හොඳ ඇල්ලීමක්',
      'උදව් ඉල්ලිය යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    h2Step1: '1. පළමු පියවර',
    body1: 'මව්කිරි පෙවීම ක්‍රමයෙන් ස්ථාපිත වේ. පළමු පැය, පසුව පළමු දින, දරුවාටත් මවටත් එක්ව ඉගෙනීමට කාලය ලබා දෙයි.',
    timelineTitle: 'පියවරෙන් පියවර ආරම්භ කිරීම',
    timelineSubtitle: 'පීඩනයකින් තොර සරල මාර්ගෝපදේශයක්',
    startingSteps: [
      {title: 'ප්‍රසූතියෙන් පසු', text: 'සමෙන්-සමට ස්පර්ශය සහ කල් ඇතිව ඇල්ලීම මව්කිරි පෙවීම හොඳින් ආරම්භ කිරීමට උපකාරී වේ.'},
      {title: 'පළමු පැය', text: 'දරුවා නිතර කිරි බොන්නට පුළුවන්. රිද්මය වෙනස් වීම සාමාන්‍යයි.'},
      {title: 'පළමු දින', text: 'කිරි පෙවීම් ක්‍රමයෙන් දරුවාටත් මවටත් බෙදාගත් රිද්මයක් බවට පත් වේ.'},
      {title: 'රිද්මයකට හැඩගැසීම', text: 'කිරි සැපයුම ක්‍රමයෙන් දරුවාගේ අවශ්‍යතාවලට සකස් වේ.'},
    ],
    h2Step2: '2. අවධානයට ලක් කළ යුතු සලකුණු',
    body2: 'ඔරලෝසුව ගැන පමණක් අවධානය යොමු කරනවාට වඩා, දරුවාගේ අවදි වීමේ සලකුණු, කිරි පෙවීම් සහ ඩයපර රටාව නිරීක්ෂණය කිරීම උපකාරී විය හැක.',
    signals: [
      {title: 'නිතර රිද්මයක්', text: 'අලුත උපන් දරුවෙකු පැය 24ක් තුළ සමහර විට 8 සිට 12 වතාවක් දක්වා නිතර කිරි බොන්නට ඉල්ලන්නට පුළුවන්.'},
      {title: 'අවදි වීමේ සලකුණු', text: 'බඩගිනි වීමට පටන් ගන්නා විට දරුවා චලනය වීමට, මුඛය විවෘත කිරීමට හෝ පියයුර සොයා යාමට පුළුවන්.'},
      {title: 'ඩයපර', text: 'තෙත් සහ අපවිත්‍ර ඩයපර ගණන දිනෙන් දින අවධානයෙන් සිටිය යුතු දේවලින් එකකි.'},
    ],
    h2Step3: '3. හොඳ ඇල්ලීමක්',
    body3: 'සුවපහසු ඉරියව්වක් සහ සඵල ඇල්ලීමක් කිරි පෙවීම් පහසු කළ හැක. වේදනාව සැලකිය යුතු හෝ දිගටම පවතී නම්, සෞඛ්‍ය වෘත්තිකයෙකුට ඉරියව්ව සහ ඇල්ලීම පරීක්ෂා කළ හැක.',
    latchTitle: 'සුවපහසු බවේ සලකුණු 4',
    latchSubtitle: 'කිරි පෙවීම් අතරතුර සරල පරීක්ෂාවක්',
    latchCenterTitle: 'දරුවා + පියයුර',
    latchCenterSubtitle: 'සුවපහසු ඉරියව්ව',
    latchPoints: [
      {title: 'දරුවා හොඳින් ඉරියව්වේ', text: 'දරුවා ශරීරයට ළං කර, හිස සුවපහසු පෙළගැස්මකින් අල්ලාගෙන සිටී.'},
      {title: 'මුඛය පුළුල් ලෙස විවෘතයි', text: 'පියයුර ලබා දීමට පෙර ප්‍රමාණවත් පුළුල් මුඛ විවෘත කිරීමක් සඳහා රැඳී සිටින්න.'},
      {title: 'සුවපහසු ඇල්ලීමක්', text: 'සඵල ඇල්ලීමක් සැලකිය යුතු හෝ දිගටම පවතින වේදනාවක් ඇති නොකළ යුතුයි.'},
      {title: 'නිතිපතා උරා බීම', text: 'කිරි පෙවීම අතරතුර උරා බීමේ සහ ගිලීමේ චලනයන් නිරීක්ෂණය කළ හැක.'},
    ],
    h2Step4: '4. උදව් ඉල්ලිය යුත්තේ කවදාද?',
    body4: 'දුෂ්කරතා බරපතළ වන තුරු බලා සිටීමට අවශ්‍ය නැත. පුහුණු වෘත්තිකයෙකුට ඉරියව්ව, ඇල්ලීම හෝ දරුවාගේ අවශ්‍යතා පරීක්ෂා කිරීමට උපකාර කළ හැක.',
    supportOptions: [
      {title: 'ප්‍රසව හෙදිය', text: 'පළමු ඇල්ලීම් හරහා ඔබට සහාය විය හැක.'},
      {title: 'සෞඛ්‍ය වෘත්තිකයා', text: 'දරුවාගේ සහ මවගේ සෞඛ්‍යය පරීක්ෂා කළ හැක.'},
      {title: 'මව්කිරි පෙවීම පිළිබඳ උපදේශිකාව', text: 'ඇල්ලීම අපහසු වන විට උදව් කළ හැක.'},
    ],
    infoTitle: 'සෑම මව්කිරි පෙවීමේ ගමනක්ම වෙනස්',
    infoText: 'පළමු දින බොහෝ සේ වෙනස් විය හැක. කිරි පෙවීම්වල රිද්මය සහ කිරි ප්‍රමාණය කාලයත් සමඟ ක්‍රමයෙන් වෙනස් විය හැක. යමක් ඔබව කනස්සල්ලට පත් කරන්නේ නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් උපදෙස් විමසන්න.',
    h2Summary: 'ප්‍රධාන කරුණු',
    summaryItems: [
      'පළමු කිරි පෙවීම් දරුවාටත් මවටත් ඉගෙනීමේ කාලයකි.',
      'අලුත උපන් දරුවෙකු නිතර කිරි බොන්නට ඉල්ලන්නට පුළුවන්.',
      'සුවපහසු ඉරියව්වක් සහ හොඳ ඇල්ලීමක් වැදගත්.',
      'පරිපූර්ණ ලෙස ස්ථාවර කාලසටහනක් අරමුණු කරනවාට වඩා දරුවාගේ සංඥා නිරීක්ෂණය කිරීම වඩා ප්‍රයෝජනවත්.',
      'ප්‍රසව හෙදියකට හෝ මව්කිරි පෙවීම පිළිබඳ උපදේශිකාවකට මුල් දුෂ්කරතා හරහා ඔබට උදව් කළ හැක.',
    ],
    disclaimerText: 'තොරතුරු අන්තර්ගතයකි. මෙම ලිපිය සෞඛ්‍ය වෘත්තිකයෙකුගේ පුද්ගලීකරණය කළ මඟපෙන්වීම වෙනුවට නොපවතී.',
  },
  th: {
    shareMessage: 'เริ่มให้นมแม่อย่างมั่นใจ — AWA',
    badge: 'หลังคลอด • การให้นมแม่',
    title: 'เริ่มให้นมแม่\nอย่างมั่นใจ',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'วันแรก ๆ ของการให้นมแม่เป็นช่วงเรียนรู้ของทั้งทารกและคุณแม่ การอมหัวนม จังหวะ ท่าทาง และการสังเกต จะค่อย ๆ ช่วยให้คุณพบสิ่งที่รู้สึกสบาย',
    contentsTitle: 'ในบทความนี้',
    contentsSubtitle: 'สิ่งจำเป็นสำหรับการเริ่มต้น',
    tocItems: [
      'ก้าวแรก',
      'สัญญาณที่ควรสังเกต',
      'การอมหัวนมที่ดี',
      'เมื่อไรควรขอความช่วยเหลือ',
      'ประเด็นสำคัญ',
    ],
    h2Step1: '1. ก้าวแรก',
    body1: 'การให้นมแม่ค่อย ๆ เข้าที่ ชั่วโมงแรก ๆ แล้วต่อด้วยวันแรก ๆ ให้เวลาทารกและคุณแม่เรียนรู้ไปด้วยกัน',
    timelineTitle: 'เริ่มต้นทีละขั้น',
    timelineSubtitle: 'คู่มือง่าย ๆ ที่ไม่มีแรงกดดัน',
    startingSteps: [
      {title: 'หลังคลอด', text: 'การสัมผัสเนื้อแนบเนื้อและการอมหัวนมแต่เนิ่น ๆ ช่วยให้การให้นมแม่เริ่มต้นได้ดี'},
      {title: 'ชั่วโมงแรก ๆ', text: 'ทารกอาจกินบ่อย เป็นเรื่องปกติที่จังหวะจะไม่คงที่'},
      {title: 'วันแรก ๆ', text: 'การให้นมค่อย ๆ กลายเป็นจังหวะร่วมกันของทารกและคุณแม่'},
      {title: 'เข้าสู่จังหวะ', text: 'ปริมาณน้ำนมค่อย ๆ ปรับตามความต้องการของทารก'},
    ],
    h2Step2: '2. สัญญาณที่ควรสังเกต',
    body2: 'แทนที่จะดูแต่นาฬิกา การสังเกตสัญญาณตื่นของทารก การกินนม และรูปแบบผ้าอ้อมจะช่วยได้',
    signals: [
      {title: 'จังหวะที่ถี่', text: 'ทารกแรกเกิดอาจขอกินบ่อย บางครั้ง 8 ถึง 12 ครั้งใน 24 ชั่วโมง'},
      {title: 'สัญญาณตื่น', text: 'ทารกอาจขยับตัว อ้าปาก หรือหันหาเต้านมเมื่อเริ่มหิว'},
      {title: 'ผ้าอ้อม', text: 'จำนวนผ้าอ้อมที่เปียกและที่เปื้อนเป็นหนึ่งในสิ่งที่ควรสังเกตในแต่ละวัน'},
    ],
    h2Step3: '3. การอมหัวนมที่ดี',
    body3: 'ท่าที่สบายและการอมหัวนมที่มีประสิทธิภาพช่วยให้การให้นมง่ายขึ้น หากเจ็บมากหรือเจ็บต่อเนื่อง บุคลากรทางการแพทย์ตรวจท่าและการอมหัวนมให้ได้',
    latchTitle: 'เครื่องหมายความสบาย 4 ข้อ',
    latchSubtitle: 'การตรวจง่าย ๆ ระหว่างให้นม',
    latchCenterTitle: 'ทารก + เต้านม',
    latchCenterSubtitle: 'ท่าที่สบาย',
    latchPoints: [
      {title: 'ทารกอยู่ในท่าที่ดี', text: 'อุ้มทารกแนบตัว ศีรษะอยู่ในแนวที่สบาย'},
      {title: 'อ้าปากกว้าง', text: 'รอให้ทารกอ้าปากกว้างพอก่อนให้เต้านม'},
      {title: 'อมหัวนมสบาย', text: 'การอมหัวนมที่มีประสิทธิภาพไม่ควรทำให้เจ็บมากหรือเจ็บต่อเนื่อง'},
      {title: 'ดูดสม่ำเสมอ', text: 'สังเกตเห็นการดูดและการกลืนระหว่างให้นม'},
    ],
    h2Step4: '4. เมื่อไรควรขอความช่วยเหลือ?',
    body4: 'ไม่จำเป็นต้องรอจนความยากลำบากรุนแรง ผู้เชี่ยวชาญที่ผ่านการฝึกอบรมช่วยตรวจท่า การอมหัวนม หรือความต้องการของทารกได้',
    supportOptions: [
      {title: 'ผดุงครรภ์', text: 'ช่วยดูแลคุณในการอมหัวนมครั้งแรก ๆ'},
      {title: 'บุคลากรทางการแพทย์', text: 'ตรวจสุขภาพของทารกและคุณแม่ได้'},
      {title: 'ที่ปรึกษาด้านการให้นม', text: 'ช่วยเมื่อการอมหัวนมเป็นเรื่องยาก'},
    ],
    infoTitle: 'การให้นมแม่ของแต่ละคนไม่เหมือนกัน',
    infoText: 'วันแรก ๆ อาจต่างกันมาก จังหวะการให้นมและปริมาณน้ำนมอาจค่อย ๆ เปลี่ยนไปตามเวลา หากมีสิ่งที่กังวล ให้ขอคำแนะนำจากบุคลากรทางการแพทย์',
    h2Summary: 'ประเด็นสำคัญ',
    summaryItems: [
      'การให้นมครั้งแรก ๆ เป็นช่วงเรียนรู้ของทารกและคุณแม่',
      'ทารกแรกเกิดอาจขอกินบ่อย',
      'ท่าที่สบายและการอมหัวนมที่ดีมีความสำคัญ',
      'การสังเกตสัญญาณของทารกมีประโยชน์กว่าการตั้งเป้าตารางเวลาที่ตายตัวสมบูรณ์แบบ',
      'ผดุงครรภ์หรือที่ปรึกษาด้านการให้นมช่วยคุณผ่านความยากลำบากในช่วงแรกได้',
    ],
    disclaimerText: 'เนื้อหาเพื่อให้ข้อมูล บทความนี้ไม่ได้ทดแทนคำแนะนำเฉพาะบุคคลจากบุคลากรทางการแพทย์',
  },
  vi: {
    shareMessage: 'Bắt đầu cho con bú một cách tự tin — AWA',
    badge: 'SAU SINH • CHO CON BÚ',
    title: 'Bắt đầu cho con bú\nmột cách tự tin',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Những ngày đầu cho con bú là giai đoạn học hỏi của cả em bé và người mẹ. Việc ngậm bắt vú, nhịp bú, tư thế và quan sát dần giúp bạn tìm ra điều thấy thoải mái.',
    contentsTitle: 'Trong bài viết này',
    contentsSubtitle: 'Những điều thiết yếu để bắt đầu',
    tocItems: [
      'Những bước đầu tiên',
      'Dấu hiệu cần chú ý',
      'Ngậm bắt vú đúng cách',
      'Khi nào nên nhờ giúp đỡ',
      'Những điểm chính cần nhớ',
    ],
    h2Step1: '1. Những bước đầu tiên',
    body1: 'Việc cho con bú được thiết lập dần dần. Những giờ đầu, rồi những ngày đầu, cho em bé và người mẹ thời gian để cùng học hỏi.',
    timelineTitle: 'Bắt đầu, từng bước một',
    timelineSubtitle: 'Một hướng dẫn đơn giản, không áp lực',
    startingSteps: [
      {title: 'Sau khi sinh', text: 'Tiếp xúc da kề da và cho bé ngậm vú sớm có thể giúp việc cho con bú khởi đầu tốt đẹp.'},
      {title: 'Những giờ đầu tiên', text: 'Em bé có thể bú thường xuyên. Nhịp bú thay đổi là điều bình thường.'},
      {title: 'Những ngày đầu tiên', text: 'Các cữ bú dần trở thành một nhịp chung của em bé và người mẹ.'},
      {title: 'Ổn định nhịp bú', text: 'Lượng sữa dần điều chỉnh theo nhu cầu của em bé.'},
    ],
    h2Step2: '2. Dấu hiệu cần chú ý',
    body2: 'Thay vì chỉ nhìn đồng hồ, bạn có thể quan sát các dấu hiệu thức giấc, các cữ bú và số lượng tã của em bé.',
    signals: [
      {title: 'Nhịp bú dày', text: 'Trẻ sơ sinh có thể đòi bú thường xuyên, đôi khi từ 8 đến 12 lần trong 24 giờ.'},
      {title: 'Dấu hiệu thức giấc', text: 'Em bé có thể cử động, mở miệng hoặc tìm vú khi bắt đầu thấy đói.'},
      {title: 'Tã', text: 'Số lượng tã ướt và tã bẩn là một trong những điều cần theo dõi mỗi ngày.'},
    ],
    h2Step3: '3. Ngậm bắt vú đúng cách',
    body3: 'Một tư thế thoải mái và cách ngậm bắt vú hiệu quả có thể giúp các cữ bú dễ dàng hơn. Nếu đau nhiều hoặc đau kéo dài, nhân viên y tế có thể kiểm tra tư thế và cách ngậm bắt vú.',
    latchTitle: '4 dấu hiệu của sự thoải mái',
    latchSubtitle: 'Một cách kiểm tra đơn giản trong các cữ bú',
    latchCenterTitle: 'Em bé + bầu vú',
    latchCenterSubtitle: 'Tư thế thoải mái',
    latchPoints: [
      {title: 'Em bé ở tư thế tốt', text: 'Em bé được ôm sát cơ thể, đầu ở tư thế thẳng hàng thoải mái.'},
      {title: 'Miệng mở rộng', text: 'Hãy chờ bé mở miệng đủ rộng rồi mới đưa bầu vú vào.'},
      {title: 'Ngậm bắt vú thoải mái', text: 'Một cách ngậm bắt vú hiệu quả không nên gây đau nhiều hoặc kéo dài.'},
      {title: 'Bú đều đặn', text: 'Có thể quan sát các động tác mút và nuốt trong suốt cữ bú.'},
    ],
    h2Step4: '4. Khi nào nên nhờ giúp đỡ?',
    body4: 'Không cần chờ đến khi khó khăn trở nên nghiêm trọng. Một chuyên gia được đào tạo có thể giúp kiểm tra tư thế, cách ngậm bắt vú hoặc nhu cầu của em bé.',
    supportOptions: [
      {title: 'Nữ hộ sinh', text: 'Có thể hỗ trợ bạn trong những lần ngậm bắt vú đầu tiên.'},
      {title: 'Nhân viên y tế', text: 'Có thể kiểm tra sức khỏe của em bé và người mẹ.'},
      {title: 'Chuyên gia tư vấn nuôi con bằng sữa mẹ', text: 'Có thể giúp khi việc ngậm bắt vú gặp khó khăn.'},
    ],
    infoTitle: 'Mỗi hành trình cho con bú đều khác nhau',
    infoText: 'Những ngày đầu có thể rất khác nhau. Nhịp bú và lượng sữa có thể thay đổi dần theo thời gian. Nếu có điều gì khiến bạn lo lắng, hãy hỏi ý kiến nhân viên y tế.',
    h2Summary: 'Những điểm chính cần nhớ',
    summaryItems: [
      'Những cữ bú đầu tiên là giai đoạn học hỏi của em bé và người mẹ.',
      'Trẻ sơ sinh có thể đòi bú thường xuyên.',
      'Tư thế thoải mái và cách ngậm bắt vú đúng là rất quan trọng.',
      'Quan sát tín hiệu của em bé hữu ích hơn việc cố gắng theo một lịch cố định hoàn hảo.',
      'Nữ hộ sinh hoặc chuyên gia tư vấn nuôi con bằng sữa mẹ có thể giúp bạn vượt qua những khó khăn ban đầu.',
    ],
    disclaimerText: 'Nội dung mang tính thông tin. Bài viết này không thay thế hướng dẫn cá nhân hóa của nhân viên y tế.',
  },
  uz: {
    shareMessage: 'Emizishni ishonch bilan boshlash — AWA',
    badge: 'TUGʻRUQDAN KEYIN • EMIZISH',
    title: 'Emizishni\nishonch bilan boshlash',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Emizishning dastlabki kunlari chaqaloq ham, ona ham uchun oʻrganish davri. Emizishga oʻrnashish, ritm, holat va kuzatuv sizga qulay narsani asta-sekin topishga yordam beradi.',
    contentsTitle: 'Ushbu maqolada',
    contentsSubtitle: 'Boshlash uchun eng muhim narsalar',
    tocItems: [
      'Dastlabki qadamlar',
      'Eʼtibor berish kerak boʻlgan belgilar',
      'Toʻgʻri oʻrnashish',
      'Qachon yordam soʻrash kerak',
      'Asosiy xulosalar',
    ],
    h2Step1: '1. Dastlabki qadamlar',
    body1: 'Emizish asta-sekin yoʻlga qoʻyiladi. Dastlabki soatlar, keyin dastlabki kunlar chaqaloq va onaga birga oʻrganish uchun vaqt beradi.',
    timelineTitle: 'Boshlash, bosqichma-bosqich',
    timelineSubtitle: 'Oddiy qoʻllanma, bosimsiz',
    startingSteps: [
      {title: 'Tugʻruqdan keyin', text: 'Teri-teriga aloqa va erta emish emizishning yaxshi boshlanishiga yordam berishi mumkin.'},
      {title: 'Dastlabki soatlar', text: 'Chaqaloq tez-tez emishi mumkin. Ritmning oʻzgarishi normal.'},
      {title: 'Dastlabki kunlar', text: 'Emizishlar asta-sekin chaqaloq va ona uchun umumiy ritmga aylanadi.'},
      {title: 'Ritmga tushish', text: 'Sut miqdori asta-sekin chaqaloqning ehtiyojlariga moslashadi.'},
    ],
    h2Step2: '2. Eʼtibor berish kerak boʻlgan belgilar',
    body2: 'Faqat soatga eʼtibor qaratish oʻrniga, chaqaloqning uygʻonish belgilari, emizishlari va taglik namunalarini kuzatish foydali boʻlishi mumkin.',
    signals: [
      {title: 'Tez-tez ritm', text: 'Yangi tugʻilgan chaqaloq 24 soat ichida tez-tez, baʼzan 8 martadan 12 martagacha emishni soʻrashi mumkin.'},
      {title: 'Uygʻonish belgilari', text: 'Chaqaloq och qola boshlaganda harakatlanishi, ogʻzini ochishi yoki koʻkrakni izlashi mumkin.'},
      {title: 'Tagliklar', text: 'Hoʻl va ifloslangan tagliklar soni kundalik kuzatib borish kerak boʻlgan narsalardan biri.'},
    ],
    h2Step3: '3. Toʻgʻri oʻrnashish',
    body3: 'Qulay holat va samarali oʻrnashish emizishni osonlashtirishi mumkin. Agar ogʻriq sezilarli yoki doimiy boʻlsa, sogʻliqni saqlash mutaxassisi holat va oʻrnashishni tekshirishi mumkin.',
    latchTitle: '4 ta qulaylik belgisi',
    latchSubtitle: 'Emizish paytida oddiy tekshiruv',
    latchCenterTitle: 'Chaqaloq + koʻkrak',
    latchCenterSubtitle: 'Qulay holat',
    latchPoints: [
      {title: 'Chaqaloq yaxshi joylashgan', text: 'Chaqaloq tanaga yaqin ushlanadi, boshi qulay holatda.'},
      {title: 'Ogʻiz keng ochiq', text: 'Koʻkrakni taklif qilishdan oldin ogʻiz yetarlicha keng ochilishini kuting.'},
      {title: 'Qulay oʻrnashish', text: 'Samarali oʻrnashish sezilarli yoki doimiy ogʻriq keltirib chiqarmasligi kerak.'},
      {title: 'Muntazam emish', text: 'Emizish paytida emish va yutish harakatlarini kuzatish mumkin.'},
    ],
    h2Step4: '4. Qachon yordam soʻrash kerak?',
    body4: 'Qiyinchiliklar jiddiy boʻlguncha kutish shart emas. Tayyorgarlikdan oʻtgan mutaxassis holat, oʻrnashish yoki chaqaloq ehtiyojlarini tekshirishga yordam beradi.',
    supportOptions: [
      {title: 'Doya', text: 'Dastlabki oʻrnashishlarda sizni qoʻllab-quvvatlashi mumkin.'},
      {title: 'Sogʻliqni saqlash mutaxassisi', text: 'Chaqaloq va ona salomatligini tekshirishi mumkin.'},
      {title: 'Laktatsiya boʻyicha maslahatchi', text: 'Oʻrnashish qiyin boʻlganda yordam berishi mumkin.'},
    ],
    infoTitle: 'Har bir emizish yoʻli boshqacha',
    infoText: 'Dastlabki kunlar juda farq qilishi mumkin. Emizish ritmi va sut miqdori vaqt oʻtishi bilan asta-sekin oʻzgarishi mumkin. Agar nimadir xavotirga solsa, sogʻliqni saqlash mutaxassisidan maslahat soʻrang.',
    h2Summary: 'Asosiy xulosalar',
    summaryItems: [
      'Dastlabki emizishlar chaqaloq va ona uchun oʻrganish davri.',
      'Yangi tugʻilgan chaqaloq tez-tez emishni soʻrashi mumkin.',
      'Qulay holat va toʻgʻri oʻrnashish muhim.',
      'Chaqaloq signallarini kuzatish mukammal qatʼiy jadvalga intilishdan foydaliroq.',
      'Doya yoki laktatsiya boʻyicha maslahatchi dastlabki qiyinchiliklarda yordam berishi mumkin.',
    ],
    disclaimerText: 'Maʼlumot uchun kontent. Bu maqola sogʻliqni saqlash mutaxassisining shaxsiy yoʻl-yoʻrigʻini almashtirmaydi.',
  },
  az: {
    shareMessage: 'Əmizdirməyə əminliklə başlamaq — AWA',
    badge: 'DOĞUŞDAN SONRA • ƏMİZDİRMƏ',
    title: 'Əmizdirməyə\nəminliklə başlamaq',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Əmizdirmənin ilk günləri həm körpə, həm də ana üçün öyrənmə dövrüdür. Tutma, ritm, vəziyyət və müşahidə sizə nəyin rahat olduğunu tədricən tapmağa kömək edir.',
    contentsTitle: 'Bu məqalədə',
    contentsSubtitle: 'Başlamaq üçün əsaslar',
    tocItems: [
      'İlk addımlar',
      'Diqqət ediləcək əlamətlər',
      'Düzgün tutma',
      'Nə vaxt kömək istəmək lazımdır',
      'Əsas nəticələr',
    ],
    h2Step1: '1. İlk addımlar',
    body1: 'Əmizdirmə tədricən qurulur. İlk saatlar, sonra ilk günlər körpəyə və anaya birlikdə öyrənmək üçün vaxt verir.',
    timelineTitle: 'Addım-addım başlamaq',
    timelineSubtitle: 'Təzyiqsiz sadə bələdçi',
    startingSteps: [
      {title: 'Doğuşdan sonra', text: 'Dəri-dəriyə təmas və erkən tutma əmizdirmənin yaxşı başlamasına kömək edə bilər.'},
      {title: 'İlk saatlar', text: 'Körpə tez-tez əmə bilər. Ritmin dəyişməsi normaldır.'},
      {title: 'İlk günlər', text: 'Əmizdirmələr tədricən körpə və ana üçün ortaq ritmə çevrilir.'},
      {title: 'Ritmin oturuşması', text: 'Süd miqdarı tədricən körpənin ehtiyaclarına uyğunlaşır.'},
    ],
    h2Step2: '2. Diqqət ediləcək əlamətlər',
    body2: 'Yalnız saata diqqət yetirmək əvəzinə körpənin oyanma əlamətlərini, əmizdirmələri və uşaq bezi nümunələrini izləmək faydalı ola bilər.',
    signals: [
      {title: 'Tez-tez ritm', text: 'Yeni doğulmuş körpə tez-tez, bəzən 24 saat ərzində 8–12 dəfə əmmək istəyə bilər.'},
      {title: 'Oyanma əlamətləri', text: 'Körpə acmağa başlayanda tərpənə, ağzını aça və ya sinəni axtara bilər.'},
      {title: 'Uşaq bezləri', text: 'Islaq və çirkli uşaq bezlərinin sayı gündəlik izləməyə dəyər şeylərdən biridir.'},
    ],
    h2Step3: '3. Düzgün tutma',
    body3: 'Rahat vəziyyət və təsirli tutma əmizdirmələri asanlaşdıra bilər. Ağrı əhəmiyyətli və ya davamlıdırsa, tibb işçisi vəziyyəti və tutmanı yoxlaya bilər.',
    latchTitle: '4 rahatlıq göstəricisi',
    latchSubtitle: 'Əmizdirmə zamanı sadə yoxlama',
    latchCenterTitle: 'Körpə + sinə',
    latchCenterSubtitle: 'Rahat vəziyyət',
    latchPoints: [
      {title: 'Körpə düzgün yerləşdirilib', text: 'Körpə bədənə yaxın, başı rahat düzülüşdə tutulur.'},
      {title: 'Ağız tam açıq', text: 'Sinəni təklif etməzdən əvvəl ağzın kifayət qədər geniş açılmasını gözləyin.'},
      {title: 'Rahat tutma', text: 'Təsirli tutma əhəmiyyətli və ya davamlı ağrıya səbəb olmamalıdır.'},
      {title: 'Müntəzəm əmmə', text: 'Əmizdirmə zamanı əmmə və uddunma hərəkətləri müşahidə oluna bilər.'},
    ],
    h2Step4: '4. Nə vaxt kömək istəmək lazımdır?',
    body4: 'Çətinliklərin ciddi olmasını gözləməyə ehtiyac yoxdur. Təlim keçmiş mütəxəssis vəziyyəti, tutmanı və ya körpənin ehtiyaclarını yoxlamağa kömək edə bilər.',
    supportOptions: [
      {title: 'Mama', text: 'İlk tutmalarda sizə dəstək ola bilər.'},
      {title: 'Tibb işçisi', text: 'Körpənin və ananın sağlamlığını yoxlaya bilər.'},
      {title: 'Laktasiya məsləhətçisi', text: 'Tutma çətin olduqda kömək edə bilər.'},
    ],
    infoTitle: 'Hər əmizdirmə yolu fərqlidir',
    infoText: 'İlk günlər çox dəyişə bilər. Əmizdirmələrin ritmi və süd miqdarı zamanla tədricən dəyişə bilər. Nəsə sizi narahat edirsə, tibb işçisindən məsləhət alın.',
    h2Summary: 'Əsas nəticələr',
    summaryItems: [
      'İlk əmizdirmələr körpə və ana üçün öyrənmə dövrüdür.',
      'Yeni doğulmuş körpə tez-tez əmmək istəyə bilər.',
      'Rahat vəziyyət və düzgün tutma vacibdir.',
      'Körpənin siqnallarını izləmək mükəmməl sabit cədvəl hədəfləməkdən daha faydalıdır.',
      'Mama və ya laktasiya məsləhətçisi ilk çətinliklərdə sizə kömək edə bilər.',
    ],
    disclaimerText: 'Məlumat xarakterli məzmun. Bu məqalə tibb işçisinin fərdi istiqamətləndirməsini əvəz etmir.',
  },
  ka: {
    shareMessage: 'ძუძუთი კვების თავდაჯერებით დაწყება — AWA',
    badge: 'მშობიარობის შემდგომი პერიოდი • ძუძუთი კვება',
    title: 'ძუძუთი კვების\nთავდაჯერებით დაწყება',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ძუძუთი კვების პირველი დღეები სწავლის პერიოდია როგორც ბავშვისთვის, ისე დედისთვის. ძუძუს მოჭიდება, რიტმი, პოზა და დაკვირვება ეტაპობრივად გეხმარებათ იპოვოთ ის, რაც კომფორტულია.',
    contentsTitle: 'ამ სტატიაში',
    contentsSubtitle: 'არსებითი საკითხები დასაწყებად',
    tocItems: [
      'პირველი ნაბიჯები',
      'ნიშნები, რომლებსაც უნდა დააკვირდეთ',
      'სწორი მოჭიდება',
      'როდის უნდა ითხოვოთ დახმარება',
      'მთავარი დასკვნები',
    ],
    h2Step1: '1. პირველი ნაბიჯები',
    body1: 'ძუძუთი კვება ეტაპობრივად მკვიდრდება. პირველი საათები, შემდეგ პირველი დღეები ბავშვს და დედას დროს აძლევს, ერთად ისწავლონ.',
    timelineTitle: 'დაწყება, ნაბიჯ-ნაბიჯ',
    timelineSubtitle: 'მარტივი გზამკვლევი, ზეწოლის გარეშე',
    startingSteps: [
      {title: 'მშობიარობის შემდეგ', text: 'კანით კანთან კონტაქტმა და ადრეულმა მოჭიდებამ შეიძლება ძუძუთი კვების კარგად დაწყებას შეუწყოს ხელი.'},
      {title: 'პირველი საათები', text: 'ბავშვმა შეიძლება ხშირად ჭამოს. ნორმალურია, რომ რიტმი იცვლებოდეს.'},
      {title: 'პირველი დღეები', text: 'კვება ეტაპობრივად ბავშვისა და დედის საერთო რიტმად იქცევა.'},
      {title: 'რიტმის დამკვიდრება', text: 'რძის რაოდენობა ეტაპობრივად ერგება ბავშვის საჭიროებებს.'},
    ],
    h2Step2: '2. ნიშნები, რომლებსაც უნდა დააკვირდეთ',
    body2: 'მხოლოდ საათზე ორიენტირების ნაცვლად, შეიძლება სასარგებლო იყოს ბავშვის გაღვიძების ნიშნებზე, კვებებსა და საფენების რაოდენობაზე დაკვირვება.',
    signals: [
      {title: 'ხშირი რიტმი', text: 'ახალშობილმა შეიძლება ხშირად მოითხოვოს კვება, ზოგჯერ 24 საათში 8-დან 12-ჯერ.'},
      {title: 'გაღვიძების ნიშნები', text: 'ბავშვმა შეიძლება იმოძრაოს, პირი გააღოს ან ძუძუს ეძებოს, როცა მშია.'},
      {title: 'საფენები', text: 'სველი და ჭუჭყიანი საფენების რაოდენობა ერთ-ერთია იმ საკითხებიდან, რომლებსაც ყოველდღიურად უნდა დააკვირდეთ.'},
    ],
    h2Step3: '3. სწორი მოჭიდება',
    body3: 'კომფორტულმა პოზამ და ეფექტიანმა მოჭიდებამ შეიძლება კვება გაამარტივოს. თუ ტკივილი ძლიერია ან გრძელდება, ჯანდაცვის სპეციალისტს შეუძლია პოზა და მოჭიდება შეამოწმოს.',
    latchTitle: '4 კომფორტის ნიშანი',
    latchSubtitle: 'მარტივი შემოწმება კვების დროს',
    latchCenterTitle: 'ბავშვი + ძუძუ',
    latchCenterSubtitle: 'კომფორტული პოზა',
    latchPoints: [
      {title: 'ბავშვი კარგად არის მოთავსებული', text: 'ბავშვი სხეულთან ახლოს გიჭირავთ, თავი კომფორტულ მდგომარეობაშია.'},
      {title: 'პირი ფართოდ ღიაა', text: 'დაელოდეთ პირის საკმარისად ფართოდ გაღებას, სანამ ძუძუს შესთავაზებთ.'},
      {title: 'კომფორტული მოჭიდება', text: 'ეფექტიანმა მოჭიდებამ ძლიერი ან გაგრძელებული ტკივილი არ უნდა გამოიწვიოს.'},
      {title: 'რეგულარული წოვა', text: 'კვების დროს შეიძლება დაფიქსირდეს წოვისა და ყლაპვის მოძრაობები.'},
    ],
    h2Step4: '4. როდის უნდა ითხოვოთ დახმარება?',
    body4: 'არ არის საჭირო დაელოდოთ, სანამ სირთულეები სერიოზული გახდება. გამოცდილ სპეციალისტს შეუძლია პოზის, მოჭიდების ან ბავშვის საჭიროებების შემოწმებაში დაგეხმაროთ.',
    supportOptions: [
      {title: 'ბებიაქალი', text: 'შეუძლია პირველ მოჭიდებებში დაგიჭიროთ მხარი.'},
      {title: 'ჯანდაცვის სპეციალისტი', text: 'შეუძლია ბავშვისა და დედის ჯანმრთელობა შეამოწმოს.'},
      {title: 'ლაქტაციის კონსულტანტი', text: 'შეუძლია დაგეხმაროთ, როცა მოჭიდება რთულია.'},
    ],
    infoTitle: 'ძუძუთი კვების ყოველი გზა განსხვავებულია',
    infoText: 'პირველი დღეები შეიძლება ძლიერ განსხვავდებოდეს. კვების რიტმი და რძის რაოდენობა დროთა განმავლობაში ეტაპობრივად შეიძლება შეიცვალოს. თუ რამე გაწუხებთ, ჯანდაცვის სპეციალისტს ჰკითხეთ.',
    h2Summary: 'მთავარი დასკვნები',
    summaryItems: [
      'პირველი კვებები სწავლის პერიოდია ბავშვისა და დედისთვის.',
      'ახალშობილმა შეიძლება ხშირად მოითხოვოს კვება.',
      'მნიშვნელოვანია კომფორტული პოზა და კარგი მოჭიდება.',
      'ბავშვის სიგნალებზე დაკვირვება უფრო სასარგებლოა, ვიდრე იდეალურად ფიქსირებული განრიგის მიყოლა.',
      'ბებიაქალს ან ლაქტაციის კონსულტანტს შეუძლია ადრეულ სირთულეებში დაგეხმაროთ.',
    ],
    disclaimerText: 'საინფორმაციო შინაარსი. ეს სტატია ჯანდაცვის სპეციალისტის პერსონალიზებულ რჩევას არ ანაცვლებს.',
  },
  hy: {
    shareMessage: 'Կրծքով կերակրումը վստահությամբ սկսել — AWA',
    badge: 'ՀԵՏԾՆՆԴՅԱՆ ՇՐՋԱՆ • ԿՐԾՔՈՎ ԿԵՐԱԿՐՈՒՄ',
    title: 'Կրծքով կերակրումը\nվստահությամբ սկսել',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Կրծքով կերակրման առաջին օրերը ուսուցման շրջան են և՛ երեխայի, և՛ մոր համար: Կպումը, ռիթմը, դիրքը և դիտարկումը աստիճանաբար օգնում են գտնել այն, ինչ հարմար է:',
    contentsTitle: 'Այս հոդվածում',
    contentsSubtitle: 'Էականը՝ սկսելու համար',
    tocItems: [
      'Առաջին քայլերը',
      'Նշաններ, որոնց պետք է ուշադրություն դարձնել',
      'Ճիշտ կպում',
      'Երբ օգնություն խնդրել',
      'Հիմնական եզրակացություններ',
    ],
    h2Step1: '1. Առաջին քայլերը',
    body1: 'Կրծքով կերակրումը հաստատվում է աստիճանաբար: Առաջին ժամերը, ապա առաջին օրերը ժամանակ են տալիս երեխային և մորը՝ միասին սովորելու համար:',
    timelineTitle: 'Սկսել քայլ առ քայլ',
    timelineSubtitle: 'Պարզ ուղեցույց՝ առանց ճնշման',
    startingSteps: [
      {title: 'Ծննդաբերությունից հետո', text: 'Մաշկ-մաշկ շփումը և վաղ կպումը կարող են օգնել կրծքով կերակրմանը լավ սկսվել:'},
      {title: 'Առաջին ժամերը', text: 'Երեխան կարող է հաճախ ուտել: Նորմալ է, որ ռիթմը տարբերվում է:'},
      {title: 'Առաջին օրերը', text: 'Կերակրումները աստիճանաբար դառնում են երեխայի և մոր համար ընդհանուր ռիթմ:'},
      {title: 'Ռիթմի հաստատում', text: 'Կաթի քանակը աստիճանաբար հարմարվում է երեխայի կարիքներին:'},
    ],
    h2Step2: '2. Նշաններ, որոնց պետք է ուշադրություն դարձնել',
    body2: 'Միայն ժամացույցի վրա կենտրոնանալու փոխարեն կարող է օգտակար լինել հետևել երեխայի արթնանալու նշաններին, կերակրումներին և տակդիրների օրինաչափությանը:',
    signals: [
      {title: 'Հաճախակի ռիթմ', text: 'Նորածինը կարող է հաճախ պահանջել կերակրում, երբեմն՝ 24 ժամվա ընթացքում 8-ից 12 անգամ:'},
      {title: 'Արթնանալու նշաններ', text: 'Երբ սկսում է քաղցածություն զգալ, երեխան կարող է շարժվել, բերանը բացել կամ կուրծք փնտրել:'},
      {title: 'Տակդիրներ', text: 'Թաց և կեղտոտ տակդիրների քանակը այն բաներից է, որոնց պետք է հետևել օրեցօր:'},
    ],
    h2Step3: '3. Ճիշտ կպում',
    body3: 'Հարմարավետ դիրքը և արդյունավետ կպումը կարող են հեշտացնել կերակրումները: Եթե ցավը զգալի է կամ շարունակական, առողջապահության մասնագետը կարող է ստուգել դիրքն ու կպումը:',
    latchTitle: 'Հարմարավետության 4 նշանները',
    latchSubtitle: 'Պարզ ստուգում կերակրումների ժամանակ',
    latchCenterTitle: 'Երեխա + կուրծք',
    latchCenterSubtitle: 'Հարմարավետ դիրք',
    latchPoints: [
      {title: 'Երեխան լավ տեղավորված է', text: 'Երեխան պահվում է մարմնին մոտ՝ գլխի հարմարավետ դասավորությամբ:'},
      {title: 'Բերանը լայն բաց է', text: 'Սպասեք բերանի բավարար լայն բացվելուն՝ նախքան կուրծք առաջարկելը:'},
      {title: 'Հարմարավետ կպում', text: 'Արդյունավետ կպումը չպետք է առաջացնի զգալի կամ շարունակական ցավ:'},
      {title: 'Կանոնավոր ծծում', text: 'Կերակրման ընթացքում կարելի է նկատել ծծելու և կուլ տալու շարժումներ:'},
    ],
    h2Step4: '4. Ե՞րբ օգնություն խնդրել:',
    body4: 'Պետք չէ սպասել, մինչև դժվարությունները դառնան լուրջ: Պատրաստված մասնագետը կարող է օգնել ստուգել դիրքը, կպումը կամ երեխայի կարիքները:',
    supportOptions: [
      {title: 'Մանկաբարձուհի', text: 'Կարող է աջակցել ձեզ առաջին կպումների ժամանակ:'},
      {title: 'Առողջապահության մասնագետ', text: 'Կարող է ստուգել երեխայի և մոր առողջությունը:'},
      {title: 'Լակտացիայի խորհրդատու', text: 'Կարող է օգնել, երբ կպումը դժվար է ստացվում:'},
    ],
    infoTitle: 'Կրծքով կերակրման յուրաքանչյուր ճանապարհ տարբեր է',
    infoText: 'Առաջին օրերը կարող են խիստ տարբերվել: Կերակրումների ռիթմը և կաթի քանակը կարող են աստիճանաբար փոխվել ժամանակի ընթացքում: Եթե ինչ-որ բան անհանգստացնում է ձեզ, խորհուրդ հարցրեք առողջապահության մասնագետից:',
    h2Summary: 'Հիմնական եզրակացություններ',
    summaryItems: [
      'Առաջին կերակրումները ուսուցման շրջան են երեխայի և մոր համար:',
      'Նորածինը կարող է հաճախակի կերակրում պահանջել:',
      'Հարմարավետ դիրքը և լավ կպումը կարևոր են:',
      'Երեխայի ազդանշաններին հետևելը ավելի օգտակար է, քան կատարյալ ֆիքսված գրաֆիկի ձգտելը:',
      'Մանկաբարձուհին կամ լակտացիայի խորհրդատուն կարող է օգնել ձեզ վաղ դժվարություններում:',
    ],
    disclaimerText: 'Տեղեկատվական բովանդակություն: Այս հոդվածը չի փոխարինում առողջապահության մասնագետի անհատականացված ուղեցույցին:',
  },
  tg: {
    shareMessage: 'Оғози шири додан бо боварӣ — AWA',
    badge: 'ДАВРАИ БАЪДИЗОӢ • ШИРИ ДОДАН',
    title: 'Оғози шири додан\nбо боварӣ',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Рӯзҳои аввали шири додан барои тифл ва модар давраи омӯзиш аст. Гирифтани пистон, суръат, вазъият ва мушоҳида тадриҷан ба шумо кумак мекунанд он чиро, ки роҳат аст, ёбед.',
    contentsTitle: 'Дар ин мақола',
    contentsSubtitle: 'Муҳимтарин чизҳо барои оғоз',
    tocItems: [
      'Қадамҳои аввал',
      'Нишонаҳое, ки бояд пайгирӣ кард',
      'Гирифтани дурусти пистон',
      'Кай кумак пурсидан лозим аст',
      'Хулосаҳои асосӣ',
    ],
    h2Step1: '1. Қадамҳои аввал',
    body1: 'Шири додан тадриҷан ҷорӣ мешавад. Соатҳои аввал, сипас рӯзҳои аввал ба тифл ва модар вақт медиҳанд, ки якҷоя биомӯзанд.',
    timelineTitle: 'Оғоз, қадам ба қадам',
    timelineSubtitle: 'Роҳнамои оддӣ, бе фишор',
    startingSteps: [
      {title: 'Пас аз таваллуд', text: 'Тамоси пӯст ба пӯст ва гирифтани барвақти пистон метавонад ба оғози хуби шири додан кумак кунад.'},
      {title: 'Соатҳои аввал', text: 'Тифл метавонад зуд-зуд хӯрад. Муқаррарӣ аст, ки суръат гуногун бошад.'},
      {title: 'Рӯзҳои аввал', text: 'Хӯрдани шир тадриҷан ба суръати муштараки тифл ва модар табдил меёбад.'},
      {title: 'Ба суръат расидан', text: 'Миқдори шир тадриҷан ба эҳтиёҷоти тифл мутобиқ мешавад.'},
    ],
    h2Step2: '2. Нишонаҳое, ки бояд пайгирӣ кард',
    body2: 'Ба ҷои таваҷҷӯҳи танҳо ба соат, метавонад муфид бошад, ки нишонаҳои бедории тифл, хӯрдан ва нақши таги тифлро пайгирӣ кунед.',
    signals: [
      {title: 'Суръати зуд-зуд', text: 'Навзод метавонад зуд-зуд хӯрдан хоҳад, баъзан 8 то 12 маротиба дар 24 соат.'},
      {title: 'Нишонаҳои бедорӣ', text: 'Тифл ҳангоми гуруснагӣ метавонад ҳаракат кунад, даҳонашро кушояд ё пистонро ҷӯяд.'},
      {title: 'Таги тифл', text: 'Шумораи тагҳои нам ва ифлос яке аз чизҳоест, ки бояд ҳар рӯз назорат кард.'},
    ],
    h2Step3: '3. Гирифтани дурусти пистон',
    body3: 'Вазъияти роҳат ва гирифтани самараноки пистон метавонад хӯрдани тифлро осонтар кунад. Агар дард назаррас ё доимӣ бошад, мутахассиси соҳаи тиб метавонад вазъият ва гирифтани пистонро санҷад.',
    latchTitle: '4 нишони роҳатӣ',
    latchSubtitle: 'Санҷиши оддӣ ҳангоми хӯрдан',
    latchCenterTitle: 'Тифл + пистон',
    latchCenterSubtitle: 'Вазъияти роҳат',
    latchPoints: [
      {title: 'Тифл дуруст ҷойгир аст', text: 'Тифл ба бадан наздик нигоҳ дошта мешавад ва сараш дар ҳолати роҳат аст.'},
      {title: 'Даҳон васеъ кушода', text: 'Интизор шавед, ки даҳон ба қадри кофӣ васеъ кушода шавад, пеш аз он ки пистон диҳед.'},
      {title: 'Гирифтани роҳат', text: 'Гирифтани самаранок набояд дарди назаррас ё доимӣ ба вуҷуд орад.'},
      {title: 'Мукидани мунтазам', text: 'Ҳаракатҳои мукидан ва фурӯ бурдан ҳангоми хӯрдан мушоҳида мешаванд.'},
    ],
    h2Step4: '4. Кай кумак пурсидан лозим аст?',
    body4: 'Интизор шудан лозим нест, ки душворӣ ҷиддӣ шавад. Мутахассиси омӯзонидашуда метавонад кумак кунад, ки вазъият, гирифтани пистон ё эҳтиёҷоти тифл санҷида шавад.',
    supportOptions: [
      {title: 'Доя', text: 'Метавонад дар аввалин гирифтани пистон ба шумо кумак кунад.'},
      {title: 'Мутахассиси соҳаи тиб', text: 'Метавонад саломатии тифл ва модарро санҷад.'},
      {title: 'Мушовири лактатсия', text: 'Метавонад вақте ки гирифтани пистон душвор аст, кумак кунад.'},
    ],
    infoTitle: 'Роҳи шири додани ҳар кас гуногун аст',
    infoText: 'Рӯзҳои аввал метавонанд хеле гуногун бошанд. Суръати хӯрдан ва миқдори шир метавонад бо мурури замон тадриҷан тағйир ёбад. Агар чизе шуморо нигарон кунад, аз мутахассиси соҳаи тиб маслиҳат пурсед.',
    h2Summary: 'Хулосаҳои асосӣ',
    summaryItems: [
      'Хӯрдани аввалин давраи омӯзиш барои тифл ва модар аст.',
      'Навзод метавонад зуд-зуд хӯрдан хоҳад.',
      'Вазъияти роҳат ва гирифтани дурусти пистон муҳим аст.',
      'Пайгирии нишонаҳои тифл аз кӯшиши ба ҷадвали комилан собит риоя кардан муфидтар аст.',
      'Доя ё мушовири лактатсия метавонад ба шумо дар душвориҳои аввал кумак кунад.',
    ],
    disclaimerText: 'Мазмуни иттилоотӣ. Ин мақола роҳнамоии шахсии мутахассиси соҳаи тибро иваз намекунад.',
  },
  ky: {
    shareMessage: 'Эмчек эмизүүнү ишеним менен баштоо — AWA',
    badge: 'ТӨРӨТТӨН КИЙИН • ЭМЧЕК ЭМИЗҮҮ',
    title: 'Эмчек эмизүүнү\nишеним менен баштоо',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Эмчек эмизүүнүн алгачкы күндөрү ымыркай үчүн да, эне үчүн да үйрөнүү мезгили. Эмчекти туура алуу, ритм, абал жана байкоо өзүңүзгө ыңгайлууну акырындап табууга жардам берет.',
    contentsTitle: 'Бул макалада',
    contentsSubtitle: 'Баштоо үчүн эң негизгиси',
    tocItems: [
      'Алгачкы кадамдар',
      'Көңүл бура турган белгилер',
      'Эмчекти туура алуу',
      'Жардамды качан сурап кайрылуу керек',
      'Негизги жыйынтыктар',
    ],
    h2Step1: '1. Алгачкы кадамдар',
    body1: 'Эмчек эмизүү акырындап жолго коюлат. Алгачкы сааттар, андан кийин алгачкы күндөр ымыркайга жана энеге чогуу үйрөнүүгө убакыт берет.',
    timelineTitle: 'Баштоо, кадам сайын',
    timelineSubtitle: 'Кысымсыз жөнөкөй колдонмо',
    startingSteps: [
      {title: 'Төрөттөн кийин', text: 'Тери менен тери байланышы жана эмчекти эрте алуу эмчек эмизүүнүн жакшы башталышына жардам бериши мүмкүн.'},
      {title: 'Алгачкы сааттар', text: 'Ымыркай тез-тез эмиши мүмкүн. Ритмдин өзгөрүп туруусу кадимки көрүнүш.'},
      {title: 'Алгачкы күндөр', text: 'Эмизүүлөр акырындап ымыркай менен эне үчүн жалпы ритмге айланат.'},
      {title: 'Ритмге отуруу', text: 'Сүт көлөмү ымыркайдын муктаждыгына акырындап ыңгайлашат.'},
    ],
    h2Step2: '2. Көңүл бура турган белгилер',
    body2: 'Жалаң саатка көңүл бургандын ордуна, ымыркайдын ойгонуу белгилерин, эмизүүлөрдү жана жалаяктардын санын байкаганыңыз пайдалуу болушу мүмкүн.',
    signals: [
      {title: 'Тез-тез ритм', text: 'Жаңы төрөлгөн ымыркай көп эмгиси келиши мүмкүн, кээде 24 саатта 8–12 жолу.'},
      {title: 'Ойгонуу белгилери', text: 'Ымыркай ачка боло баштаганда кыймылдап, оозун ачып же эмчекти издеши мүмкүн.'},
      {title: 'Жалаяктар', text: 'Нымдуу жана булганган жалаяктардын саны күнүмдүк байкай турган нерселердин бири.'},
    ],
    h2Step3: '3. Эмчекти туура алуу',
    body3: 'Ыңгайлуу абал жана натыйжалуу алуу эмизүүнү жеңилдетиши мүмкүн. Эгер оору олуттуу же уланып жатса, ден соолук сактоо адиси абалды жана эмчекти алууну текшере алат.',
    latchTitle: '4 ыңгайлуулук белгиси',
    latchSubtitle: 'Эмизүү учурундагы жөнөкөй текшерүү',
    latchCenterTitle: 'Ымыркай + эмчек',
    latchCenterSubtitle: 'Ыңгайлуу абал',
    latchPoints: [
      {title: 'Ымыркай туура жайгашкан', text: 'Ымыркай денеге жакын кармалат, башы ыңгайлуу түз сызыкта.'},
      {title: 'Ооз кең ачылган', text: 'Эмчекти сунуштоодон мурун оозу жетишерлик кең ачылышын күтүңүз.'},
      {title: 'Ыңгайлуу алуу', text: 'Натыйжалуу алуу олуттуу же улана берген оору жаратпашы керек.'},
      {title: 'Үзгүлтүксүз эмүү', text: 'Эмизүү учурунда эмүү жана жутуу кыймылдарын байкоого болот.'},
    ],
    h2Step4: '4. Жардамды качан сурап кайрылуу керек?',
    body4: 'Кыйынчылыктар олуттуу болгонго чейин күтүүнүн кереги жок. Окутулган адис абалды, эмчекти алууну же ымыркайдын муктаждыгын текшерүүгө жардам бере алат.',
    supportOptions: [
      {title: 'Акушерка', text: 'Алгачкы эмизүүлөрдө колдоо көрсөтө алат.'},
      {title: 'Ден соолук сактоо адиси', text: 'Ымыркайдын жана эненин ден соолугун текшере алат.'},
      {title: 'Лактация боюнча кеңешчи', text: 'Эмчекти алуу кыйынга турганда жардам бере алат.'},
    ],
    infoTitle: 'Ар бир эмчек эмизүү жолу башкача',
    infoText: 'Алгачкы күндөр бир кыйла айырмаланышы мүмкүн. Эмизүү ритми жана сүттүн көлөмү убакыттын өтүшү менен акырындап өзгөрүшү мүмкүн. Бир нерсе тынчсыздандырса, ден соолук сактоо адисинен кеңеш сураңыз.',
    h2Summary: 'Негизги жыйынтыктар',
    summaryItems: [
      'Алгачкы эмизүүлөр ымыркай менен эне үчүн үйрөнүү мезгили.',
      'Жаңы төрөлгөн ымыркай тез-тез эмгиси келиши мүмкүн.',
      'Ыңгайлуу абал жана эмчекти туура алуу маанилүү.',
      'Ымыркайдын белгилерин байкоо так бекитилген график менен жашоодон пайдалуураак.',
      'Акушерка же лактация боюнча кеңешчи алгачкы кыйынчылыктарда жардам бере алат.',
    ],
    disclaimerText: 'Маалымат берүүчү мазмун. Бул макала ден соолук сактоо адисинин жекелештирилген көрсөтмөсүн алмаштырбайт.',
  },
  tk: {
    shareMessage: 'Emdirmäni ynam bilen başlamak — AWA',
    badge: 'DOGRANDAN SOŇ • EMDIRMEK',
    title: 'Emdirmäni\nynam bilen başlamak',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Emdirmegiň ilkinji günleri bäbek bilen ene üçin öwreniş döwri. Dodak bilen emjegi tutmak, ritm, ýagdaý we synlamak sizi ýuwaş-ýuwaşdan rahat bolan zada eltýär.',
    contentsTitle: 'Bu makalada',
    contentsSubtitle: 'Başlamak üçin esasy zatlar',
    tocItems: [
      'Ilkinji ädimler',
      'Üns bermeli alamatlar',
      'Dogry tutmak',
      'Haçan kömek soramaly',
      'Esasy netijeler',
    ],
    h2Step1: '1. Ilkinji ädimler',
    body1: 'Emdirme ýuwaş-ýuwaşdan ýola goýulýar. Ilkinji sagatlar, soňra ilkinji günler bäbege we enä bilelikde öwrenmäge wagt berýär.',
    timelineTitle: 'Ädimme-ädim başlamak',
    timelineSubtitle: 'Basyşsyz ýönekeý gollanma',
    startingSteps: [
      {title: 'Dograndan soň', text: 'Deri bilen deri ýakynlygy we ir emmek emdirmäniň gowy başlamagyna kömek edip biler.'},
      {title: 'Ilkinji sagatlar', text: 'Bäbek ýygy-ýygydan emip biler. Ritmiň üýtgemegi adaty.'},
      {title: 'Ilkinji günler', text: 'Emdirmeler ýuwaş-ýuwaşdan bäbek bilen eneň umumy ritmine öwrülýär.'},
      {title: 'Ritme girmek', text: 'Süýt mukdary ýuwaş-ýuwaşdan bäbegiň zerurlyklaryna uýgunlaşýar.'},
    ],
    h2Step2: '2. Üns bermeli alamatlar',
    body2: 'Diňe sagada seretmegiň ýerine, bäbegiň oýanyş alamatlaryna, emişlerine we ýapgyçlaryna üns bermek peýdaly bolup biler.',
    signals: [
      {title: 'Ýygy ritm', text: 'Täze doglan bäbek ýygy-ýygydan emmegi islän bolup biler, käwagt 24 sagadyň dowamynda 8-den 12 sapar.'},
      {title: 'Oýanyş alamatlary', text: 'Bäbek açlyk duýup başlanda gymyldap, agzyny açyp ýa-da döşi gözläp biler.'},
      {title: 'Ýapgyçlar', text: 'Çyg we hapa bezleriň sany her gün gözegçilikde saklamaly zatlaryň biri.'},
    ],
    h2Step3: '3. Dogry tutmak',
    body3: 'Rahat ýagdaý we täsirli tutmak emdirmeleri ýeňilleşdirip biler. Agyry güýçli ýa-da dowamly bolsa, saglyk hünärmeni ýagdaýy we tutmagy barlap biler.',
    latchTitle: '4 rahatlyk alamaty',
    latchSubtitle: 'Emdirme wagtynda ýönekeý barlag',
    latchCenterTitle: 'Bäbek + döş',
    latchCenterSubtitle: 'Rahat ýagdaý',
    latchPoints: [
      {title: 'Bäbek dogry ýerleşdirilen', text: 'Bäbek bedene ýakyn tutulýar, kellesi rahat ugurda.'},
      {title: 'Agzy giň açyk', text: 'Döşi hödürlemezden öň agzyň ýeterlik giň açylmagyna garaşyň.'},
      {title: 'Rahat tutmak', text: 'Täsirli tutmak güýçli ýa-da dowamly agyry döretmeli däl.'},
      {title: 'Yzygiderli emmek', text: 'Emdirme wagtynda emmek we ýuwtmak hereketlerini synlap bolýar.'},
    ],
    h2Step4: '4. Haçan kömek soramaly?',
    body4: 'Kynçylyklaryň agyrlaşmagyna garaşmak hökman däl. Taýýarlykly hünärmen ýagdaýy, tutmagy ýa-da bäbegiň zerurlyklaryny barlamaga kömek edip biler.',
    supportOptions: [
      {title: 'Akuşerka', text: 'Ilkinji emdirmeler wagtynda size goldaw berip biler.'},
      {title: 'Saglyk hünärmeni', text: 'Bäbegiň we eneň saglygyny barlap biler.'},
      {title: 'Laktasiýa boýunça maslahatçy', text: 'Tutmak kyn bolanda kömek edip biler.'},
    ],
    infoTitle: 'Her emdirme ýoly dürli',
    infoText: 'Ilkinji günler gaty tapawutlanyp biler. Emdirmeleriň ritmi we süýt mukdary wagtyň geçmegi bilen ýuwaş-ýuwaşdan üýtgäp biler. Bir zat sizi alada goýsa, saglyk hünärmeninden maslahat soraň.',
    h2Summary: 'Esasy netijeler',
    summaryItems: [
      'Ilkinji emdirmeler bäbek bilen ene üçin öwreniş döwri.',
      'Täze doglan bäbek ýygy-ýygydan emmegi islän bolup biler.',
      'Rahat ýagdaý we dogry tutmak möhüm.',
    'Bäbegiň alamatlaryna üns bermek, berk kesgitlenen tertip gözlemekden has peýdaly.',
      'Akuşerka ýa-da laktasiýa boýunça maslahatçy ilkinji kynçylyklarda size kömek edip biler.',
    ],
    disclaimerText: 'Maglumat berýän mazmun. Bu makala saglyk hünärmeniniň şahsylaşdyrylan maslahatyny çalyşmaýar.',
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
