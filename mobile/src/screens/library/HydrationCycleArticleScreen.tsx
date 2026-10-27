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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'hydration-bien-shydrater';

const HERO = require('../../assets/images/library/spm-water.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons stay language-neutral — only TEXT moves into the bilingual   */
/* CONTENT object below, keyed by index to stay aligned with these icons.    */
/* -------------------------------------------------------------------------- */

const PHASE_NEEDS_ICONS = ['water-outline', 'egg-outline', 'weather-cloudy'] as const;

const DAILY_DRINKS_ICONS = ['cup-water', 'tea', 'cup-outline'] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — bilingual editorial content. Article identity (ID, images,      */
/* bookmark/progress keys, JSX structure) is untouched; only this object     */
/* changes per language. The French text below is byte-identical to the      */
/* original — never retyped, only moved into the `fr` key — so the app       */
/* remains fully bilingual rather than having French replaced by English.    */
/* -------------------------------------------------------------------------- */

const CONTENT = withBrazilianPortuguese('HydrationCycle', {
  fr: {
    badge: 'CYCLE MENSTRUEL • HYDRATATION',
    title: 'Bien s’hydrater\npendant le cycle',
    metaDuration: '6 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Contre-intuitif mais vrai : bien t’hydrater aide ton corps à moins retenir d’eau, tout au long de ton cycle.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi l’hydratation compte',
      'Les besoins selon les phases du cycle',
      'Que boire au quotidien ?',
      'Signes d’une hydratation insuffisante',
      'Conseils pratiques',
      'Idées reçues',
      'À retenir',
    ],
    section1Body: 'Contre-intuitif mais vrai : bien s’hydrater aide le corps à moins retenir d’eau et réduit les ballonnements, notamment en fin de cycle.',
    infoTitle: 'Bon à savoir',
    infoText: 'Quand le corps manque d’eau, il a tendance à en stocker davantage par précaution. Boire suffisamment lui indique au contraire qu’il peut en relâcher plus facilement.',
    section2Body: 'Tes besoins en eau restent globalement stables, avec quelques nuances selon la phase :',
    phaseNeeds: [
      {title: 'Pendant les règles', text: 'Un peu plus d’eau aide à compenser les pertes et à limiter les ballonnements.'},
      {title: 'Autour de l’ovulation', text: 'Les besoins restent stables ; une légère hausse de la température corporelle peut augmenter la soif.'},
      {title: 'Phase prémenstruelle', text: 'Une bonne hydratation aide à limiter la sensation de gonflement souvent ressentie à cette période.'},
    ],
    section3Body: 'Vise environ 1,5 à 2 litres par jour, un peu plus pendant les règles pour compenser les pertes.',
    dailyDrinks: [
      {title: 'De l’eau, en priorité', text: 'Environ 1,5 à 2 litres par jour, un peu plus pendant les règles.'},
      {title: 'Des tisanes apaisantes', text: 'Gingembre ou camomille apportent une hydratation douce en période de crampes.'},
      {title: 'Sucre et caféine, avec modération', text: 'Limiter les boissons très sucrées ou caféinées peut aider en fin de cycle.'},
    ],
    warningTitle: 'À surveiller doucement',
    lowHydrationSigns: [
      'Une soif intense ou inhabituelle',
      'Des urines plus foncées que d’habitude',
      'Des maux de tête fréquents',
      'Une fatigue qui ne s’explique pas autrement',
    ],
    section5Body: 'Quelques habitudes simples suffisent souvent à mieux s’hydrater sans y penser :',
    practicalTips: [
      'Garder une bouteille d’eau à portée de main tout au long de la journée',
      'Associer un verre d’eau à une habitude déjà installée (réveil, chaque repas)',
      'Varier avec des infusions si l’eau seule te lasse',
    ],
    section5Body2: 'Pendant une activité physique, pense aussi à boire avant, pendant et après l’effort pour compenser la transpiration.',
    compareTitle1: 'Idée reçue',
    compareText1: '« Boire beaucoup me fait plus gonfler. »',
    compareTitle2: 'Plutôt le contraire',
    compareText2: 'Une bonne hydratation aide le corps à moins retenir d’eau.',
    tipTitle: 'Bon à savoir',
    tipText: 'Les tisanes de gingembre ou de camomille apportent aussi une hydratation apaisante en période de crampes.',
    summaryPoints: [
      'Bien s’hydrater aide le corps à moins retenir d’eau et réduit les ballonnements.',
      'Vise environ 1,5 à 2 litres par jour, un peu plus pendant les règles.',
      'Les tisanes de gingembre ou de camomille apaisent aussi en période de crampes.',
      'Une soif intense et persistante mérite d’être signalée à un professionnel de santé.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas un avis médical personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Bien s’hydrater pendant le cycle — AWA',
  },
  en: {
    badge: 'MENSTRUAL CYCLE • HYDRATION',
    title: 'Staying hydrated\nthrough your cycle',
    metaDuration: '6 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Counterintuitive but true: staying well hydrated helps your body retain less water throughout your cycle.',
    contentsTitle: 'In this article',
    topics: [
      'Why hydration matters',
      'Needs across the phases of your cycle',
      'What to drink day to day',
      'Signs of insufficient hydration',
      'Practical tips',
      'Common misconceptions',
      'Key takeaways',
    ],
    section1Body: 'Counterintuitive but true: staying well hydrated helps the body retain less water and reduces bloating, especially toward the end of the cycle.',
    infoTitle: 'Good to know',
    infoText: 'When the body is short on water, it tends to store more of it as a precaution. Drinking enough tells it, on the contrary, that it can release water more easily.',
    section2Body: 'Your water needs stay fairly stable overall, with a few nuances depending on the phase:',
    phaseNeeds: [
      {title: 'During your period', text: 'A little extra water helps offset fluid loss and limit bloating.'},
      {title: 'Around ovulation', text: 'Needs stay stable; a slight rise in body temperature can increase thirst.'},
      {title: 'Premenstrual phase', text: 'Good hydration helps limit the feeling of puffiness often felt during this time.'},
    ],
    section3Body: 'Aim for about 1.5 to 2 liters a day, a little more during your period to offset fluid loss.',
    dailyDrinks: [
      {title: 'Water, first and foremost', text: 'About 1.5 to 2 liters a day, a little more during your period.'},
      {title: 'Soothing herbal teas', text: 'Ginger or chamomile offer gentle hydration during cramps.'},
      {title: 'Sugar and caffeine, in moderation', text: 'Limiting very sugary or caffeinated drinks can help toward the end of the cycle.'},
    ],
    warningTitle: 'Worth keeping an eye on',
    lowHydrationSigns: [
      'Intense or unusual thirst',
      'Urine darker than usual',
      'Frequent headaches',
      'Fatigue with no other obvious explanation',
    ],
    section5Body: 'A few simple habits are often enough to stay hydrated without even thinking about it:',
    practicalTips: [
      'Keep a water bottle within reach throughout the day',
      'Pair a glass of water with a habit you already have (waking up, each meal)',
      'Mix in herbal infusions if plain water gets dull',
    ],
    section5Body2: 'During physical activity, remember to drink before, during, and after exercise to make up for sweat loss.',
    compareTitle1: 'Common belief',
    compareText1: '"Drinking a lot makes me more bloated."',
    compareTitle2: 'Actually the opposite',
    compareText2: 'Good hydration helps the body retain less water.',
    tipTitle: 'Good to know',
    tipText: 'Ginger or chamomile teas also offer soothing hydration during cramps.',
    summaryPoints: [
      'Staying well hydrated helps the body retain less water and reduces bloating.',
      'Aim for about 1.5 to 2 liters a day, a little more during your period.',
      'Ginger or chamomile teas can also soothe during cramps.',
      'Intense, persistent thirst is worth mentioning to a healthcare professional.',
    ],
    disclaimerText: 'Informational content. This article does not replace personalized medical advice. If in doubt, seek guidance from a healthcare professional.',
    shareMessage: 'Staying hydrated through your cycle — AWA',
  },
  es: {
    badge: 'CICLO MENSTRUAL • HIDRATACIÓN',
    title: 'Hidratarte bien\ndurante el ciclo',
    metaDuration: '6 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Contraintuitivo pero cierto: hidratarte bien ayuda a tu cuerpo a retener menos agua a lo largo de todo tu ciclo.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué importa la hidratación',
      'Las necesidades según las fases del ciclo',
      '¿Qué beber cada día?',
      'Señales de hidratación insuficiente',
      'Consejos prácticos',
      'Ideas equivocadas',
      'Para recordar',
    ],
    section1Body: 'Contraintuitivo pero cierto: hidratarse bien ayuda al cuerpo a retener menos agua y reduce la hinchazón, sobre todo al final del ciclo.',
    infoTitle: 'Dato útil',
    infoText: 'Cuando al cuerpo le falta agua, tiende a almacenar más por precaución. Beber lo suficiente le indica, por el contrario, que puede liberarla con más facilidad.',
    section2Body: 'Tus necesidades de agua se mantienen bastante estables, con algunos matices según la fase:',
    phaseNeeds: [
      {title: 'Durante la regla', text: 'Un poco más de agua ayuda a compensar las pérdidas y a limitar la hinchazón.'},
      {title: 'Alrededor de la ovulación', text: 'Las necesidades se mantienen estables; una ligera subida de la temperatura corporal puede aumentar la sed.'},
      {title: 'Fase premenstrual', text: 'Una buena hidratación ayuda a limitar la sensación de hinchazón que suele sentirse en este momento.'},
    ],
    section3Body: 'Apunta a unos 1,5 a 2 litros al día, un poco más durante la regla para compensar las pérdidas.',
    dailyDrinks: [
      {title: 'Agua, en primer lugar', text: 'Unos 1,5 a 2 litros al día, un poco más durante la regla.'},
      {title: 'Infusiones calmantes', text: 'El jengibre o la manzanilla aportan una hidratación suave en los días de cólicos.'},
      {title: 'Azúcar y cafeína, con moderación', text: 'Limitar las bebidas muy azucaradas o con cafeína puede ayudar al final del ciclo.'},
    ],
    warningTitle: 'Para vigilar con calma',
    lowHydrationSigns: [
      'Una sed intensa o inusual',
      'Una orina más oscura de lo habitual',
      'Dolores de cabeza frecuentes',
      'Un cansancio que no se explica de otra forma',
    ],
    section5Body: 'Unos cuantos hábitos sencillos suelen bastar para hidratarte mejor sin pensarlo demasiado:',
    practicalTips: [
      'Tener una botella de agua a mano durante todo el día',
      'Asociar un vaso de agua a un hábito que ya tengas (al despertar, en cada comida)',
      'Variar con infusiones si el agua sola se te hace monótona',
    ],
    section5Body2: 'Durante la actividad física, recuerda también beber antes, durante y después del esfuerzo para compensar la transpiración.',
    compareTitle1: 'Idea equivocada',
    compareText1: '«Beber mucho me hincha más».',
    compareTitle2: 'Más bien lo contrario',
    compareText2: 'Una buena hidratación ayuda al cuerpo a retener menos agua.',
    tipTitle: 'Dato útil',
    tipText: 'Las infusiones de jengibre o manzanilla también aportan una hidratación calmante en los días de cólicos.',
    summaryPoints: [
      'Hidratarte bien ayuda al cuerpo a retener menos agua y reduce la hinchazón.',
      'Apunta a unos 1,5 a 2 litros al día, un poco más durante la regla.',
      'Las infusiones de jengibre o manzanilla también calman en los días de cólicos.',
      'Una sed intensa y persistente merece comentarse con un profesional de la salud.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye una opinión médica personalizada. Si tienes dudas, consulta a un profesional de la salud.',
    shareMessage: 'Hidratarte bien durante el ciclo — AWA',
  },
  it: {
    badge: 'CICLO MESTRUALE • IDRATAZIONE',
    title: 'Mantenersi idratate\ndurante il ciclo',
    metaDuration: '6 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Sembra controintuitivo, ma è vero: restare ben idratate aiuta il corpo a trattenere meno acqua durante tutto il ciclo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché l’idratazione è importante',
      'Il fabbisogno nelle fasi del ciclo',
      'Che cosa bere ogni giorno',
      'Segnali di idratazione insufficiente',
      'Consigli pratici',
      'Idee sbagliate comuni',
      'I punti chiave',
    ],
    section1Body: 'Sembra controintuitivo, ma è vero: restare ben idratate aiuta il corpo a trattenere meno acqua e riduce il gonfiore, soprattutto verso la fine del ciclo.',
    infoTitle: 'Da sapere',
    infoText: 'Quando al corpo manca l’acqua, tende a trattenerne di più per precauzione. Bere abbastanza gli indica, al contrario, che può eliminare l’acqua più facilmente.',
    section2Body: 'Il tuo fabbisogno di acqua resta nel complesso abbastanza stabile, con qualche sfumatura a seconda della fase:',
    phaseNeeds: [
      {
        title: 'Durante il periodo mestruale',
        text: 'Un po’ di acqua in più aiuta a compensare la perdita di liquidi e a limitare il gonfiore.',
      },
      {
        title: 'Intorno all’ovulazione',
        text: 'Il fabbisogno resta stabile; un leggero aumento della temperatura corporea può far crescere la sete.',
      },
      {
        title: 'Fase premestruale',
        text: 'Una buona idratazione aiuta a limitare la sensazione di gonfiore spesso avvertita in questo periodo.',
      },
    ],
    section3Body: 'Punta a circa 1,5-2 litri al giorno, un po’ di più durante il periodo mestruale per compensare la perdita di liquidi.',
    dailyDrinks: [
      {
        title: 'Prima di tutto l’acqua',
        text: 'Circa 1,5-2 litri al giorno, un po’ di più durante il periodo mestruale.',
      },
      {
        title: 'Tisane lenitive',
        text: 'Lo zenzero o la camomilla offrono un’idratazione delicata durante i crampi.',
      },
      {
        title: 'Zucchero e caffeina, con moderazione',
        text: 'Limitare le bevande molto zuccherate o ricche di caffeina può essere utile verso la fine del ciclo.',
      },
    ],
    warningTitle: 'Da tenere d’occhio',
    lowHydrationSigns: [
      'Sete intensa o insolita',
      'Urine più scure del solito',
      'Mal di testa frequenti',
      'Stanchezza senza altre spiegazioni evidenti',
    ],
    section5Body: 'Poche abitudini semplici spesso bastano per restare idratate senza nemmeno pensarci:',
    practicalTips: [
      'Tieni una bottiglia d’acqua a portata di mano durante tutta la giornata',
      'Abbina un bicchiere d’acqua a un’abitudine che hai già (al risveglio, a ogni pasto)',
      'Alterna con infusi di erbe se l’acqua naturale ti stanca',
    ],
    section5Body2: 'Durante l’attività fisica, ricordati di bere prima, durante e dopo l’esercizio per compensare la perdita di sudore.',
    compareTitle1: 'Credenza comune',
    compareText1: '“Se bevo tanto, mi gonfio di più.”',
    compareTitle2: 'In realtà è il contrario',
    compareText2: 'Una buona idratazione aiuta il corpo a trattenere meno acqua.',
    tipTitle: 'Da sapere',
    tipText: 'Anche le tisane allo zenzero o alla camomilla offrono un’idratazione lenitiva durante i crampi.',
    summaryPoints: [
      'Restare ben idratate aiuta il corpo a trattenere meno acqua e riduce il gonfiore.',
      'Punta a circa 1,5-2 litri al giorno, un po’ di più durante il periodo mestruale.',
      'Anche le tisane allo zenzero o alla camomilla possono dare sollievo durante i crampi.',
      'Una sete intensa e persistente merita di essere segnalata a un professionista sanitario.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico personalizzato. In caso di dubbi, rivolgiti a un professionista sanitario.',
    shareMessage: 'Mantenersi idratate durante il ciclo — AWA',
  },
  tr: {
    badge: 'ADET DÖNGÜSÜ • SU TÜKETİMİ',
    title: 'Döngün boyunca\nyeterince su iç',
    metaDuration: '6 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Ters gibi görünse de doğru: yeterince su içmek, bedenin döngü boyunca daha az su tutmasına yardımcı olur.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Su tüketimi neden önemli?',
      'Döngünün evrelerine göre ihtiyaçlar',
      'Gün boyunca ne içmeli?',
      'Yetersiz su tüketiminin belirtileri',
      'Pratik öneriler',
      'Yaygın yanlış inanışlar',
      'Akılda kalacaklar',
    ],
    section1Body: 'Ters gibi görünse de doğru: yeterince su içmek, bedenin daha az su tutmasına ve şişkinliğin azalmasına yardımcı olur; özellikle döngünün sonuna doğru.',
    infoTitle: 'Bilmekte fayda var',
    infoText: 'Vücutta su azaldığında, önlem olarak daha fazlasını depolama eğilimindedir. Yeterince su içmek ise ona, suyu daha kolay bırakabileceğini söyler.',
    section2Body: 'Su ihtiyacın genel olarak oldukça sabit kalır; evreye göre birkaç ince fark vardır:',
    phaseNeeds: [
      {
        title: 'Adetin sırasında',
        text: 'Biraz fazladan su, sıvı kaybını dengelemeye ve şişkinliği sınırlamaya yardımcı olur.',
      },
      {
        title: 'Yumurtlama çevresinde',
        text: 'İhtiyaç sabit kalır; vücut sıcaklığındaki hafif artış susuzluk hissini artırabilir.',
      },
      {
        title: 'Adet öncesi dönem',
        text: 'İyi bir su tüketimi, bu dönemde sık hissedilen şişkinlik hissini sınırlamaya yardımcı olur.',
      },
    ],
    section3Body: 'Günde yaklaşık 1,5 ila 2 litre hedefle; sıvı kaybını dengelemek için adetin sırasında biraz daha fazla.',
    dailyDrinks: [
      {
        title: 'Her şeyden önce su',
        text: 'Günde yaklaşık 1,5 ila 2 litre; adetin sırasında biraz daha fazla.',
      },
      {
        title: 'Rahatlatıcı bitki çayları',
        text: 'Zencefil ya da papatya, kramplar sırasında hafif bir nemlendirme sağlar.',
      },
      {
        title: 'Şeker ve kafein, ölçülü',
        text: 'Çok şekerli ya da kafeinli içecekleri sınırlamak, döngünün sonuna doğru yardımcı olabilir.',
      },
    ],
    warningTitle: 'Göz önünde bulundurmaya değer',
    lowHydrationSigns: [
      'Yoğun ya da alışılmadık susuzluk',
      'Normalden koyu idrar',
      'Sık baş ağrıları',
      'Başka belirgin bir nedeni olmayan yorgunluk',
    ],
    section5Body: 'Su tüketimini fark etmeden sürdürmek için çoğu zaman birkaç basit alışkanlık yeterlidir:',
    practicalTips: [
      'Gün boyunca elinin altında bir su şişesi bulundur',
      'Bir bardak suyu zaten sahip olduğun bir alışkanlıkla eşleştir (uyanınca, her öğünde)',
      'Sade su sıkıcı gelirse bitki çaylarını araya kat',
    ],
    section5Body2: 'Fiziksel aktivite sırasında, terle kaybedilenleri telafi etmek için egzersizden önce, egzersiz sırasında ve sonrasında su içmeyi unutma.',
    compareTitle1: 'Yaygın inanış',
    compareText1: '"Çok su içmek beni daha çok şişiriyor."',
    compareTitle2: 'Aslında tam tersi',
    compareText2: 'İyi bir su tüketimi, bedenin daha az su tutmasına yardımcı olur.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Zencefil ya da papatya çayları, kramplar sırasında da rahatlatıcı bir nemlendirme sağlar.',
    summaryPoints: [
      'Yeterince su içmek, bedenin daha az su tutmasına ve şişkinliğin azalmasına yardımcı olur.',
      'Günde yaklaşık 1,5 ila 2 litre hedefle; adetin sırasında biraz daha fazla.',
      'Zencefil ya da papatya çayları kramplar sırasında da rahatlatabilir.',
      'Yoğun ve geçmeyen susuzluğu bir sağlık uzmanıyla paylaşmaya değer.',
    ],
    disclaimerText: 'Bilgilendirme amaçlı içerik. Bu makale kişiye özel tıbbi tavsiyenin yerini tutmaz. Şüphe duyarsan bir sağlık uzmanından rehberlik al.',
    shareMessage: 'Döngün boyunca yeterince su iç — AWA',
  },
  ru: {
    badge: 'МЕНСТРУАЛЬНЫЙ ЦИКЛ • ВОДНЫЙ БАЛАНС',
    title: 'Достаточное количество воды\nв течение цикла',
    metaDuration: '6 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Это неочевидно, но факт: достаточное количество воды помогает организму меньше задерживать жидкость на протяжении всего цикла.',
    contentsTitle: 'В этой статье',
    topics: [
      'Почему важен водный баланс',
      'Потребность в воде в разные фазы цикла',
      'Что пить изо дня в день',
      'Признаки недостаточного потребления воды',
      'Практические советы',
      'Распространённые заблуждения',
      'Главное',
    ],
    section1Body: 'Это неочевидно, но факт: достаточное количество воды помогает организму меньше задерживать жидкость и уменьшает вздутие, особенно ближе к концу цикла.',
    infoTitle: 'Полезно знать',
    infoText: 'Когда организму не хватает воды, он склонен запасать её больше — на всякий случай. Достаточное питьё, напротив, сообщает ему, что он может легче отдавать воду.',
    section2Body: 'В целом потребность в воде остаётся довольно стабильной, с небольшими нюансами в зависимости от фазы:',
    phaseNeeds: [
      {title: 'Во время месячных', text: 'Немного больше воды помогает восполнить потерю жидкости и ограничить вздутие.'},
      {title: 'Около овуляции', text: 'Потребность остаётся стабильной; лёгкое повышение температуры тела может усиливать жажду.'},
      {title: 'Предменструальная фаза', text: 'Хороший водный баланс помогает уменьшить ощущение отёчности, которое часто возникает в этот период.'},
    ],
    section3Body: 'Ориентируйтесь на 1,5–2 литра в день, чуть больше — во время месячных, чтобы восполнить потерю жидкости.',
    dailyDrinks: [
      {title: 'Прежде всего — вода', text: 'Около 1,5–2 литров в день, чуть больше — во время месячных.'},
      {title: 'Успокаивающие травяные чаи', text: 'Имбирный чай или ромашка мягко увлажняют организм при спазмах.'},
      {title: 'Сахар и кофеин — в умеренных количествах', text: 'Ограничение очень сладких или содержащих кофеин напитков может помочь ближе к концу цикла.'},
    ],
    warningTitle: 'На что стоит обращать внимание',
    lowHydrationSigns: [
      'Сильная или необычная жажда',
      'Моча темнее обычного',
      'Частые головные боли',
      'Усталость без других очевидных причин',
    ],
    section5Body: 'Нескольких простых привычек зачастую достаточно, чтобы пить достаточно воды, даже не задумываясь об этом:',
    practicalTips: [
      'Держите бутылку с водой под рукой в течение дня',
      'Связывайте стакан воды с уже существующей привычкой (пробуждение, каждый приём пищи)',
      'Чередуйте с травяными настоями, если простая вода надоедает',
    ],
    section5Body2: 'Во время физической активности не забывайте пить до, во время и после тренировки, чтобы восполнить потерю жидкости с потом.',
    compareTitle1: 'Распространённое мнение',
    compareText1: '«Если я много пью, вздутие усиливается».',
    compareTitle2: 'На самом деле наоборот',
    compareText2: 'Хороший водный баланс помогает организму меньше задерживать жидкость.',
    tipTitle: 'Полезно знать',
    tipText: 'Имбирный чай или ромашка также мягко увлажняют и успокаивают при спазмах.',
    summaryPoints: [
      'Достаточное количество воды помогает организму меньше задерживать жидкость и уменьшает вздутие.',
      'Ориентируйтесь на 1,5–2 литра в день, чуть больше — во время месячных.',
      'Имбирный чай или ромашка также могут облегчать спазмы.',
      'О сильной и стойкой жажде стоит рассказать медицинскому специалисту.',
    ],
    disclaimerText: 'Информационный материал. Эта статья не заменяет персональную медицинскую консультацию. При сомнениях обратитесь за советом к медицинскому специалисту.',
    shareMessage: 'Достаточное количество воды в течение цикла — AWA',
  },
  de: {
    badge: 'MENSTRUATIONSZYKLUS • FLÜSSIGKEIT',
    title: 'Ausreichend trinken\nwährend deines Zyklus',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Klingt widersprüchlich, stimmt aber: Wer gut hydriert ist, hilft seinem Körper, im Laufe des Zyklus weniger Wasser einzulagern.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Warum Flüssigkeit wichtig ist',
      'Bedarf in den verschiedenen Zyklusphasen',
      'Was du im Alltag trinken kannst',
      'Anzeichen für zu wenig Flüssigkeit',
      'Praktische Tipps',
      'Verbreitete Irrtümer',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Klingt widersprüchlich, stimmt aber: Wer ausreichend trinkt, hilft dem Körper, weniger Wasser einzulagern, und verringert Blähungen und das Gefühl der Aufgedunsenheit, besonders gegen Ende des Zyklus.',
    infoTitle: 'Gut zu wissen',
    infoText: 'Wenn dem Körper Wasser fehlt, neigt er dazu, vorsorglich mehr davon zu speichern. Ausreichend zu trinken signalisiert ihm dagegen, dass er Wasser leichter abgeben kann.',
    section2Body: 'Dein Wasserbedarf bleibt insgesamt recht stabil, mit ein paar Nuancen je nach Phase:',
    phaseNeeds: [
      {title: 'Während deiner Periode', text: 'Etwas mehr Wasser hilft, den Flüssigkeitsverlust auszugleichen und Blähungen zu begrenzen.'},
      {title: 'Rund um den Eisprung', text: 'Der Bedarf bleibt stabil; ein leichter Anstieg der Körpertemperatur kann den Durst verstärken.'},
      {title: 'Prämenstruelle Phase', text: 'Eine gute Flüssigkeitszufuhr hilft, das häufig in dieser Zeit auftretende Gefühl von Aufgedunsenheit zu begrenzen.'},
    ],
    section3Body: 'Rechne mit etwa 1,5 bis 2 Litern pro Tag, während deiner Periode etwas mehr, um den Flüssigkeitsverlust auszugleichen.',
    dailyDrinks: [
      {title: 'Vor allem Wasser', text: 'Etwa 1,5 bis 2 Liter pro Tag, während deiner Periode etwas mehr.'},
      {title: 'Wohltuende Kräutertees', text: 'Ingwer oder Kamille versorgen dich sanft mit Flüssigkeit, wenn du Krämpfe hast.'},
      {title: 'Zucker und Koffein in Maßen', text: 'Stark gezuckerte oder koffeinhaltige Getränke zu begrenzen, kann gegen Ende des Zyklus helfen.'},
    ],
    warningTitle: 'Darauf lohnt sich ein Blick',
    lowHydrationSigns: [
      'Starker oder ungewöhnlicher Durst',
      'Dunklerer Urin als sonst',
      'Häufige Kopfschmerzen',
      'Müdigkeit ohne andere erkennbare Erklärung',
    ],
    section5Body: 'Ein paar einfache Gewohnheiten genügen oft, um ausreichend zu trinken, ohne groß darüber nachzudenken:',
    practicalTips: [
      'Hab den ganzen Tag über eine Wasserflasche in Reichweite',
      'Verbinde ein Glas Wasser mit einer Gewohnheit, die du schon hast (Aufstehen, jede Mahlzeit)',
      'Wechsle mit Kräutertees ab, wenn dir pures Wasser zu langweilig wird',
    ],
    section5Body2: 'Denk bei körperlicher Aktivität daran, vor, während und nach dem Sport zu trinken, um den Verlust durch Schwitzen auszugleichen.',
    compareTitle1: 'Verbreitete Annahme',
    compareText1: '„Wenn ich viel trinke, habe ich einen noch stärkeren Blähbauch.“',
    compareTitle2: 'Eigentlich genau umgekehrt',
    compareText2: 'Gute Hydrierung hilft dem Körper, weniger Wasser einzulagern.',
    tipTitle: 'Gut zu wissen',
    tipText: 'Ingwer- oder Kamillentee versorgt dich bei Krämpfen außerdem wohltuend mit Flüssigkeit.',
    summaryPoints: [
      'Ausreichend zu trinken hilft dem Körper, weniger Wasser einzulagern, und verringert Blähungen.',
      'Rechne mit etwa 1,5 bis 2 Litern pro Tag, während deiner Periode etwas mehr.',
      'Ingwer- oder Kamillentee kann bei Krämpfen außerdem lindernd wirken.',
      'Starken, anhaltenden Durst solltest du medizinischem Fachpersonal gegenüber ansprechen.',
    ],
    disclaimerText: 'Informationsinhalt. Dieser Artikel ersetzt keine persönliche ärztliche Beratung. Hol dir bei Zweifeln den Rat von medizinischem Fachpersonal.',
    shareMessage: 'Ausreichend trinken während deines Zyklus – AWA',
  },
  zh: {
      badge: '月经周期 • 补水',
      title: '整个周期\n都要保持水分',
      metaDuration: '阅读约 6 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '听起来有些反直觉，但确实如此：在整个周期中保持充足的水分，能让身体少留住一些水。',
      contentsTitle: '本文内容',
      topics: [
        '为什么补水很重要',
        '周期各阶段的需求',
        '日常喝什么',
        '水分不足的迹象',
        '实用小建议',
        '常见误解',
        '要点回顾',
      ],
      section1Body: '听起来有些反直觉，但确实如此：保持充足的水分，能让身体少留住一些水，减轻腹胀，尤其是在周期的后期。',
      infoTitle: '小贴士',
      infoText: '身体缺水时，往往会为了预防而多储存一些水分。相反，喝够水会让身体知道，它可以更放心地排出水分。',
      section2Body: '你的饮水需求整体上相当稳定，不同阶段略有差别：',
      phaseNeeds: [
        {
          title: '月经期间',
          text: '多喝一点水，有助于补充流失的水分并减轻腹胀。',
        },
        {
          title: '排卵前后',
          text: '需求保持稳定；体温略微升高可能会让口渴感增加。',
        },
        {
          title: '经前期',
          text: '充足的水分有助于缓解这段时间常有的浮肿感。',
        },
      ],
      section3Body: '每天喝约 1.5 到 2 升水，月经期间可以稍多一点，以补充流失的水分。',
      dailyDrinks: [
        {
          title: '首选是水',
          text: '每天约 1.5 到 2 升，月经期间可稍多一些。',
        },
        {
          title: '舒缓的花草茶',
          text: '姜茶或洋甘菊茶可在痛经时温和地补充水分。',
        },
        {
          title: '糖和咖啡因，适量即可',
          text: '减少含糖量很高或含咖啡因的饮品，对周期后期可能有帮助。',
        },
      ],
      warningTitle: '值得留意',
      lowHydrationSigns: [
        '强烈的或异常的口渴',
        '尿液比平时更深',
        '经常头痛',
        '没有其他明显原因的疲倦',
      ],
      section5Body: '几个简单的习惯，往往就足以让你不知不觉地保持水分：',
      practicalTips: [
        '全天把水杯放在伸手可及的地方',
        '把喝水和你已有的习惯结合起来（起床后、每餐时）',
        '如果觉得白水乏味，可以换成花草茶',
      ],
      section5Body2: '运动时，记得在运动前、运动中和运动后都要喝水，以补充出汗流失的水分。',
      compareTitle1: '常见的说法',
      compareText1: '“喝很多水会让我更胀。”',
      compareTitle2: '实际恰恰相反',
      compareText2: '充足的水分有助于身体少留住水。',
      tipTitle: '小贴士',
      tipText: '姜茶或洋甘菊茶也能在痛经时提供舒缓的水分补充。',
      summaryPoints: [
        '保持充足的水分，有助于身体少留住水，减轻腹胀。',
        '每天喝约 1.5 到 2 升水，月经期间可稍多一些。',
        '姜茶或洋甘菊茶也能在痛经时起到舒缓作用。',
        '强烈且持续的口渴，值得告诉医疗专业人员。',
      ],
      disclaimerText: '仅供参考。本文不能替代个性化的医生建议。如有疑虑，请咨询医疗专业人员。',
      shareMessage: '整个周期都要保持水分 — AWA',
    },
  id: {
    badge: 'SIKLUS MENSTRUASI • ASUPAN AIR',
    title: 'Tetap terhidrasi\nsepanjang siklusmu',
    metaDuration: '6 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Terdengar berlawanan, tetapi benar: cukup minum membantu tubuhmu menahan lebih sedikit air sepanjang siklus.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengapa hidrasi penting',
      'Kebutuhan di setiap fase siklus',
      'Apa yang diminum sehari-hari',
      'Tanda kurang cairan',
      'Tips praktis',
      'Anggapan keliru yang umum',
      'Poin penting',
    ],
    section1Body: 'Terdengar berlawanan, tetapi benar: cukup minum membantu tubuh menahan lebih sedikit air dan mengurangi perut kembung, terutama menjelang akhir siklus.',
    infoTitle: 'Perlu diketahui',
    infoText: 'Saat tubuh kekurangan air, ia cenderung menyimpan lebih banyak air sebagai langkah berjaga-jaga. Minum yang cukup justru memberi tahu tubuh bahwa ia bisa melepas air dengan lebih mudah.',
    section2Body: 'Kebutuhan airmu secara keseluruhan cukup stabil, dengan sedikit perbedaan tergantung fasenya:',
    phaseNeeds: [
      {
        title: 'Saat haid',
        text: 'Sedikit tambahan air membantu menggantikan cairan yang hilang dan membatasi kembung.',
      },
      {
        title: 'Sekitar ovulasi',
        text: 'Kebutuhan tetap stabil; kenaikan ringan suhu tubuh bisa membuatmu lebih sering haus.',
      },
      {
        title: 'Fase pramenstruasi',
        text: 'Hidrasi yang baik membantu mengurangi rasa bengkak yang sering muncul pada masa ini.',
      },
    ],
    section3Body: 'Usahakan sekitar 1,5 hingga 2 liter sehari, sedikit lebih banyak saat haid untuk menggantikan cairan yang hilang.',
    dailyDrinks: [
      {
        title: 'Air putih, yang utama',
        text: 'Sekitar 1,5 hingga 2 liter sehari, sedikit lebih banyak saat haid.',
      },
      {
        title: 'Teh herbal yang menenangkan',
        text: 'Jahe atau chamomile memberi hidrasi yang lembut saat kram.',
      },
      {
        title: 'Gula dan kafein, secukupnya',
        text: 'Membatasi minuman yang sangat manis atau berkafein bisa membantu menjelang akhir siklus.',
      },
    ],
    warningTitle: 'Perlu diperhatikan',
    lowHydrationSigns: [
      'Rasa haus yang kuat atau tidak biasa',
      'Urine lebih gelap dari biasanya',
      'Sakit kepala yang sering',
      'Kelelahan tanpa penyebab lain yang jelas',
    ],
    section5Body: 'Beberapa kebiasaan sederhana sering kali sudah cukup untuk tetap terhidrasi tanpa perlu memikirkannya:',
    practicalTips: [
      'Letakkan botol air dalam jangkauan sepanjang hari',
      'Padukan segelas air dengan kebiasaan yang sudah ada (saat bangun tidur, setiap makan)',
      'Selingi dengan seduhan herbal jika air putih terasa membosankan',
    ],
    section5Body2: 'Saat beraktivitas fisik, ingatlah untuk minum sebelum, selama, dan sesudah berolahraga untuk menggantikan cairan yang hilang lewat keringat.',
    compareTitle1: 'Anggapan umum',
    compareText1: '"Kalau banyak minum, perutku makin kembung."',
    compareTitle2: 'Sebenarnya justru sebaliknya',
    compareText2: 'Hidrasi yang baik membantu tubuh menahan lebih sedikit air.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Teh jahe atau chamomile juga memberi hidrasi yang menenangkan saat kram.',
    summaryPoints: [
      'Cukup minum membantu tubuh menahan lebih sedikit air dan mengurangi kembung.',
      'Usahakan sekitar 1,5 hingga 2 liter sehari, sedikit lebih banyak saat haid.',
      'Teh jahe atau chamomile juga dapat menenangkan saat kram.',
      'Rasa haus yang kuat dan berkepanjangan perlu disampaikan kepada tenaga kesehatan.',
    ],
    disclaimerText: 'Konten informatif. Artikel ini tidak menggantikan saran medis yang dipersonalisasi. Jika ragu, mintalah bimbingan dari tenaga kesehatan.',
    shareMessage: 'Tetap terhidrasi sepanjang siklusmu — AWA',
  },
  hi: {
    badge: 'मासिक चक्र • हाइड्रेशन',
    title: 'पूरे चक्र में\nशरीर में पानी की कमी न होने दें',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'लेख',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा की गई सामग्री',
    intro: 'सुनने में उलटा लगता है, पर सच है: अच्छी तरह हाइड्रेटेड रहने से पूरे चक्र में आपके शरीर में पानी कम रुकता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'हाइड्रेशन क्यों ज़रूरी है',
      'चक्र के चरणों में पानी की ज़रूरत',
      'रोज़ाना क्या पिएँ',
      'पानी की कमी के संकेत',
      'व्यावहारिक सुझाव',
      'आम गलतफ़हमियाँ',
      'मुख्य बातें',
    ],
    section1Body: 'सुनने में उलटा लगता है, पर सच है: अच्छी तरह हाइड्रेटेड रहने से शरीर में पानी कम रुकता है और पेट फूलना कम होता है, खासकर चक्र के अंत की ओर।',
    infoTitle: 'जानने लायक',
    infoText: 'जब शरीर में पानी की कमी होती है, तो वह एहतियात के तौर पर उसे ज़्यादा जमा करने लगता है। पर्याप्त पानी पीने से उसे उलटा संकेत मिलता है कि वह पानी आसानी से छोड़ सकता है।',
    section2Body: 'आपके शरीर को पानी की ज़रूरत कुल मिलाकर काफ़ी स्थिर रहती है, चरण के हिसाब से कुछ छोटे फ़र्क के साथ:',
    phaseNeeds: [
      {
        title: 'पीरियड के दौरान',
        text: 'थोड़ा ज़्यादा पानी शरीर से निकले तरल की भरपाई करने और पेट फूलने को सीमित रखने में मदद करता है।',
      },
      {
        title: 'ओव्यूलेशन (अंडोत्सर्ग) के आसपास',
        text: 'ज़रूरत स्थिर रहती है; शरीर के तापमान में हल्की बढ़त से प्यास बढ़ सकती है।',
      },
      {
        title: 'पीरियड से पहले का चरण',
        text: 'अच्छा हाइड्रेशन इस समय अक्सर महसूस होने वाली सूजन जैसे एहसास को सीमित करने में मदद करता है।',
      },
    ],
    section3Body: 'रोज़ाना करीब 1.5 से 2 लीटर पानी का लक्ष्य रखें, पीरियड के दौरान थोड़ा ज़्यादा, ताकि निकले तरल की भरपाई हो सके।',
    dailyDrinks: [
      {
        title: 'सबसे पहले पानी',
        text: 'रोज़ाना करीब 1.5 से 2 लीटर, पीरियड के दौरान थोड़ा ज़्यादा।',
      },
      {
        title: 'आराम देने वाली हर्बल चाय',
        text: 'अदरक या कैमोमाइल की चाय ऐंठन के दौरान हल्का हाइड्रेशन देती है।',
      },
      {
        title: 'चीनी और कैफ़ीन, कम मात्रा में',
        text: 'बहुत मीठे या कैफ़ीन वाले पेय सीमित रखने से चक्र के अंत में राहत मिल सकती है।',
      },
    ],
    warningTitle: 'ध्यान रखने लायक',
    lowHydrationSigns: [
      'तेज़ या असामान्य प्यास',
      'पेशाब का रंग सामान्य से गहरा होना',
      'बार-बार सिरदर्द',
      'बिना किसी और साफ़ वजह के थकान',
    ],
    section5Body: 'कुछ आसान आदतें अक्सर इतनी काफ़ी होती हैं कि बिना सोचे ही हाइड्रेटेड रहा जा सके:',
    practicalTips: [
      'पूरे दिन पानी की बोतल अपनी पहुँच में रखें',
      'एक गिलास पानी को किसी पुरानी आदत से जोड़ लें (उठते ही, हर भोजन के साथ)',
      'सादा पानी फीका लगे तो हर्बल काढ़े भी शामिल करें',
    ],
    section5Body2: 'शारीरिक गतिविधि के दौरान, पसीने से हुई कमी पूरी करने के लिए कसरत से पहले, उसके दौरान और बाद में पानी पीना याद रखें।',
    compareTitle1: 'आम धारणा',
    compareText1: '"ज़्यादा पानी पीने से मेरा पेट और फूलता है।"',
    compareTitle2: 'असल में उलटा है',
    compareText2: 'अच्छा हाइड्रेशन शरीर में पानी कम रुकने में मदद करता है।',
    tipTitle: 'जानने लायक',
    tipText: 'अदरक या कैमोमाइल की चाय ऐंठन के दौरान आराम देने वाला हाइड्रेशन भी देती है।',
    summaryPoints: [
      'अच्छी तरह हाइड्रेटेड रहने से शरीर में पानी कम रुकता है और पेट फूलना कम होता है।',
      'रोज़ाना करीब 1.5 से 2 लीटर पानी का लक्ष्य रखें, पीरियड के दौरान थोड़ा ज़्यादा।',
      'अदरक या कैमोमाइल की चाय ऐंठन के दौरान भी आराम दे सकती है।',
      'तेज़ और लगातार बनी रहने वाली प्यास के बारे में किसी स्वास्थ्य विशेषज्ञ को बताना चाहिए।',
    ],
    disclaimerText: 'जानकारी के लिए सामग्री। यह लेख व्यक्तिगत चिकित्सकीय सलाह का विकल्प नहीं है। संदेह होने पर किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'पूरे चक्र में हाइड्रेटेड रहना — AWA',
  },
  sq: {
    badge: 'CIKLI MENSTRUAL • HIDRATIMI',
    title: 'Hidratimi i mirë\ngjatë ciklit',
    metaDuration: '6 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Duket e kundërta, por është e vërtetë: hidratimi i mirë ndihmon trupin të mbajë më pak ujë gjatë ciklit tënd.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Pse ka rëndësi hidratimi',
      'Nevojat nëpër fazat e ciklit tënd',
      'Çfarë të pish çdo ditë',
      'Shenjat e hidratimit të pamjaftueshëm',
      'Këshilla praktike',
      'Besime të gabuara të zakonshme',
      'Pikat kryesore',
    ],
    section1Body: 'Duket e kundërta, por është e vërtetë: hidratimi i mirë ndihmon trupin të mbajë më pak ujë dhe zvogëlon fryrjen, sidomos nga fundi i ciklit.',
    infoTitle: 'Mirë është ta dish',
    infoText: 'Kur trupit i mungon uji, ai priret të ruajë më shumë prej tij si masë paraprake. Të pish sa duhet i tregon, përkundrazi, se mund ta lëshojë ujin më lehtë.',
    section2Body: 'Nevojat e tua për ujë mbeten mjaft të qëndrueshme në përgjithësi, me disa nuanca sipas fazës:',
    phaseNeeds: [
      {
        title: 'Gjatë menstruacioneve',
        text: 'Pak ujë më shumë ndihmon të kompensohet humbja e lëngjeve dhe të kufizohet fryrja.',
      },
      {
        title: 'Rreth ovulacionit',
        text: 'Nevojat mbeten të qëndrueshme; një rritje e lehtë e temperaturës së trupit mund ta shtojë etjen.',
      },
      {
        title: 'Faza para menstruacioneve',
        text: 'Hidratimi i mirë ndihmon të kufizohet ndjenja e ënjtjes që shpesh ndihet në këtë kohë.',
      },
    ],
    section3Body: 'Synoji afërsisht 1.5 deri në 2 litra në ditë, pak më shumë gjatë menstruacioneve për të kompensuar humbjen e lëngjeve.',
    dailyDrinks: [
      {
        title: 'Uji, para së gjithash',
        text: 'Afërsisht 1.5 deri në 2 litra në ditë, pak më shumë gjatë menstruacioneve.',
      },
      {
        title: 'Çajra bimorë qetësues',
        text: 'Xhinxhëri ose kamomili ofrojnë hidratim të butë gjatë krambave.',
      },
      {
        title: 'Sheqeri dhe kafeina, me moderim',
        text: 'Kufizimi i pijeve shumë të ëmbla ose me kafeinë mund të ndihmojë nga fundi i ciklit.',
      },
    ],
    warningTitle: 'Ia vlen t’i kushtosh vëmendje',
    lowHydrationSigns: [
      'Etje e fortë ose e pazakontë',
      'Urinë më e errët se zakonisht',
      'Dhimbje koke të shpeshta',
      'Lodhje pa asnjë shpjegim tjetër të dukshëm',
    ],
    section5Body: 'Disa zakone të thjeshta shpesh mjaftojnë për të qëndruar e hidratuar pa e menduar fare:',
    practicalTips: [
      'Mbaje një shishe uji afër gjatë gjithë ditës',
      'Lidhe një gotë ujë me një zakon që e ke tashmë (kur zgjohesh, në çdo vakt)',
      'Shtoji infuzione bimore nëse uji i thjeshtë të mërzit',
    ],
    section5Body2: 'Gjatë aktivitetit fizik, mos harro të pish para, gjatë dhe pas ushtrimit për të kompensuar humbjen nga djersa.',
    compareTitle1: 'Besim i zakonshëm',
    compareText1: '"Nëse pi shumë, fryhem më shumë."',
    compareTitle2: 'Në fakt, e kundërta',
    compareText2: 'Hidratimi i mirë ndihmon trupin të mbajë më pak ujë.',
    tipTitle: 'Mirë është ta dish',
    tipText: 'Çajrat e xhinxhërit ose të kamomilit ofrojnë gjithashtu hidratim qetësues gjatë krambave.',
    summaryPoints: [
      'Hidratimi i mirë ndihmon trupin të mbajë më pak ujë dhe zvogëlon fryrjen.',
      'Synoji afërsisht 1.5 deri në 2 litra në ditë, pak më shumë gjatë menstruacioneve.',
      'Çajrat e xhinxhërit ose të kamomilit mund të qetësojnë edhe gjatë krambave.',
      'Etja e fortë dhe e vazhdueshme ia vlen t’i përmendet një profesionisti të shëndetësisë.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson këshillën e personalizuar mjekësore. Nëse ke dyshime, kërko udhëzim nga një profesionist i shëndetësisë.',
    shareMessage: 'Hidratimi i mirë gjatë ciklit — AWA',
  },
  ja: {
    badge: '生理周期・水分補給',
    title: '周期を通して\n水分をしっかりとる',
    metaDuration: '読了時間6分',
    metaType: '記事',
    metaLevel: '初級',
    metaValidated: '確認済みコンテンツ',
    intro: '意外に思えるかもしれませんが、水分を十分にとると、周期を通して体がため込む水分が少なくなります。',
    contentsTitle: 'この記事の内容',
    topics: [
      '水分補給が大切な理由',
      '周期のフェーズごとの必要量',
      '毎日の飲み物',
      '水分不足のサイン',
      '実践のヒント',
      'よくある誤解',
      'ポイントのまとめ',
    ],
    section1Body: '意外に思えるかもしれませんが、水分を十分にとると、体がため込む水分が減り、特に周期の終わりごろのむくみをやわらげます。',
    infoTitle: '知っておきたいこと',
    infoText: '体は水分が足りないと、念のためにより多くの水分をため込もうとします。十分に飲むと、反対に水分を手放しやすくてよいと体に伝わります。',
    section2Body: '水分の必要量は全体としてほぼ一定ですが、フェーズによって少し違いがあります。',
    phaseNeeds: [
      {
        title: '生理中',
        text: '水分を少し多めにとると、失われた水分を補い、むくみを抑えやすくなります。',
      },
      {
        title: '排卵のころ',
        text: '必要量は安定していますが、体温がわずかに上がるため、のどが渇きやすくなることがあります。',
      },
      {
        title: '生理前のフェーズ',
        text: '水分をしっかりとると、この時期によく感じるむくみ感を抑えるのに役立ちます。',
      },
    ],
    section3Body: '1日に約1.5〜2リットルを目安にしましょう。生理中は、失われた水分を補うために少し多めにとります。',
    dailyDrinks: [
      {
        title: 'まずは水',
        text: '1日に約1.5〜2リットル、生理中は少し多めに。',
      },
      {
        title: '心地よいハーブティー',
        text: 'ショウガやカモミールは、生理痛のときにやさしく水分を補ってくれます。',
      },
      {
        title: '糖分とカフェインは控えめに',
        text: '糖分の多い飲み物やカフェインの多い飲み物を控えると、周期の終わりごろに助けになることがあります。',
      },
    ],
    warningTitle: '気にかけておきたいこと',
    lowHydrationSigns: [
      '強いのどの渇き、またはいつもと違うのどの渇き',
      '尿がいつもより濃い色をしている',
      '頭痛が頻繁に起こる',
      'ほかにはっきりした理由がない疲れ',
    ],
    section5Body: 'いくつかの簡単な習慣で、意識しなくても水分をとり続けられることがよくあります。',
    practicalTips: [
      '水筒やボトルを、1日中手の届くところに置いておく',
      'すでにある習慣（起床時、毎回の食事）と1杯の水を結びつける',
      '水だけでは飽きてしまうときは、ハーブティーを取り入れる',
    ],
    section5Body2: '運動するときは、汗で失われた分を補うために、運動の前、運動中、運動のあとに水分をとるようにしましょう。',
    compareTitle1: 'よくある思い込み',
    compareText1: '「たくさん飲むと、むくみがひどくなる。」',
    compareTitle2: '実は反対です',
    compareText2: '水分をしっかりとると、体がため込む水分が少なくなります。',
    tipTitle: '知っておきたいこと',
    tipText: 'ショウガやカモミールのお茶も、生理痛のときにやさしく水分を補ってくれます。',
    summaryPoints: [
      '水分を十分にとると、体がため込む水分が減り、むくみがやわらぎます。',
      '1日に約1.5〜2リットルを目安に、生理中は少し多めにとりましょう。',
      'ショウガやカモミールのお茶は、生理痛をやわらげる助けにもなります。',
      '強いのどの渇きが続くときは、医療従事者に伝えるとよいでしょう。',
    ],
    disclaimerText: '情報提供を目的としたコンテンツです。この記事は、個別の医学的なアドバイスに代わるものではありません。不安なときは、医療従事者に相談してください。',
    shareMessage: '周期を通して水分をしっかりとる — AWA',
  },
  ko: {
    badge: '생리 주기 • 수분 섭취',
    title: '주기 내내\n수분 채우기',
    metaDuration: '6분 읽기',
    metaType: '아티클',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '의외지만 사실이에요. 수분을 충분히 섭취하면 주기 내내 몸에 수분이 덜 쌓여요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '수분 섭취가 중요한 이유',
      '주기 단계별 필요량',
      '일상에서 마시면 좋은 것',
      '수분이 부족하다는 신호',
      '실천 팁',
      '흔한 오해',
      '핵심 정리',
    ],
    section1Body: '의외지만 사실이에요. 수분을 충분히 섭취하면 몸에 수분이 덜 쌓이고, 특히 주기 후반에 복부 팽만감이 줄어들어요.',
    infoTitle: '알아 두세요',
    infoText: '몸에 수분이 부족하면 대비하려고 수분을 더 많이 저장하는 경향이 있어요. 충분히 마시면 오히려 수분을 더 쉽게 내보내도 된다고 몸에 알려 주는 셈이에요.',
    section2Body: '물이 필요한 양은 전반적으로 꽤 일정하지만, 단계에 따라 조금씩 차이가 있어요.',
    phaseNeeds: [
      {
        title: '생리 중',
        text: '물을 조금 더 마시면 빠져나간 수분을 채우고 복부 팽만감을 줄이는 데 도움이 돼요.',
      },
      {
        title: '배란 즈음',
        text: '필요량은 비슷하게 유지돼요. 체온이 약간 오르면 갈증이 더 느껴질 수 있어요.',
      },
      {
        title: '생리 전 단계',
        text: '수분을 잘 섭취하면 이 시기에 자주 느끼는 붓는 느낌을 줄이는 데 도움이 돼요.',
      },
    ],
    section3Body: '하루에 약 1.5~2리터를 목표로 하고, 생리 중에는 빠져나간 수분을 채우기 위해 조금 더 마셔요.',
    dailyDrinks: [
      {
        title: '무엇보다 물',
        text: '하루에 약 1.5~2리터, 생리 중에는 조금 더 마셔요.',
      },
      {
        title: '마음을 편안하게 하는 허브차',
        text: '생강차나 카모마일차는 생리통이 있을 때 부드럽게 수분을 채워 줘요.',
      },
      {
        title: '설탕과 카페인은 적당히',
        text: '당이 많거나 카페인이 든 음료를 줄이면 주기 후반에 도움이 될 수 있어요.',
      },
    ],
    warningTitle: '눈여겨볼 점',
    lowHydrationSigns: [
      '강하거나 평소와 다른 갈증',
      '평소보다 진한 소변 색',
      '잦은 두통',
      '뚜렷한 다른 이유 없이 느껴지는 피로',
    ],
    section5Body: '간단한 습관 몇 가지만으로도 별로 신경 쓰지 않고 수분을 채울 수 있는 경우가 많아요.',
    practicalTips: [
      '하루 종일 손이 닿는 곳에 물병을 두어요',
      '이미 있는 습관(일어났을 때, 식사 때마다)에 물 한 잔을 함께해요',
      '맹물이 물리면 허브차를 섞어 마셔요',
    ],
    section5Body2: '신체 활동을 할 때는 땀으로 빠져나간 수분을 채우기 위해 운동 전, 운동 중, 운동 후에 물을 마시는 것을 잊지 마세요.',
    compareTitle1: '흔한 믿음',
    compareText1: '“물을 많이 마시면 더 붓는 것 같아요.”',
    compareTitle2: '사실은 반대예요',
    compareText2: '수분을 잘 섭취하면 몸에 수분이 덜 쌓여요.',
    tipTitle: '알아 두세요',
    tipText: '생강차나 카모마일차는 생리통이 있을 때 부드럽게 수분을 채워 주기도 해요.',
    summaryPoints: [
      '수분을 충분히 섭취하면 몸에 수분이 덜 쌓이고 복부 팽만감이 줄어들어요.',
      '하루에 약 1.5~2리터를 목표로 하고, 생리 중에는 조금 더 마셔요.',
      '생강차나 카모마일차는 생리통이 있을 때 편안함을 줄 수도 있어요.',
      '강하고 계속되는 갈증은 의료 전문가에게 이야기해 볼 만해요.',
    ],
    disclaimerText: '정보 제공 콘텐츠예요. 이 아티클은 개인에게 맞춘 의학적 조언을 대신하지 않아요. 걱정되는 점이 있다면 의료 전문가의 안내를 받아 보세요.',
    shareMessage: '주기 내내 수분 채우기 — AWA',
  },
  'pt-PT': {
    badge: 'CICLO MENSTRUAL • HIDRATAÇÃO',
    title: 'Manter-se hidratada\nao longo do ciclo',
    metaDuration: '6 min de leitura',
    metaType: 'Artigo',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Parece contraditório, mas é verdade: estar bem hidratada ajuda o corpo a reter menos água ao longo do ciclo.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Porque é que a hidratação é importante',
      'Necessidades ao longo das fases do ciclo',
      'O que beber no dia a dia',
      'Sinais de hidratação insuficiente',
      'Dicas práticas',
      'Ideias feitas',
      'Pontos-chave',
    ],
    section1Body: 'Parece contraditório, mas é verdade: estar bem hidratada ajuda o corpo a reter menos água e reduz o inchaço, sobretudo no final do ciclo.',
    infoTitle: 'Bom saber',
    infoText: 'Quando falta água ao corpo, ele tende a armazenar mais por precaução. Beber o suficiente indica-lhe, pelo contrário, que pode libertar água com mais facilidade.',
    section2Body: 'As suas necessidades de água mantêm-se globalmente bastante estáveis, com algumas nuances consoante a fase:',
    phaseNeeds: [
      {
        title: 'Durante o período',
        text: 'Um pouco mais de água ajuda a compensar a perda de líquidos e a limitar o inchaço.',
      },
      {
        title: 'Por volta da ovulação',
        text: 'As necessidades mantêm-se estáveis; uma ligeira subida da temperatura corporal pode aumentar a sede.',
      },
      {
        title: 'Fase pré-menstrual',
        text: 'Uma boa hidratação ajuda a limitar a sensação de inchaço frequentemente sentida nesta altura.',
      },
    ],
    section3Body: 'Procure beber cerca de 1,5 a 2 litros por dia, um pouco mais durante o período para compensar a perda de líquidos.',
    dailyDrinks: [
      {
        title: 'Água, antes de mais',
        text: 'Cerca de 1,5 a 2 litros por dia, um pouco mais durante o período.',
      },
      {
        title: 'Chás de ervas reconfortantes',
        text: 'O gengibre ou a camomila oferecem uma hidratação suave durante as cólicas.',
      },
      {
        title: 'Açúcar e cafeína, com moderação',
        text: 'Limitar as bebidas muito açucaradas ou com cafeína pode ajudar no final do ciclo.',
      },
    ],
    warningTitle: 'Convém estar atenta',
    lowHydrationSigns: [
      'Sede intensa ou fora do habitual',
      'Urina mais escura do que o habitual',
      'Dores de cabeça frequentes',
      'Cansaço sem outra explicação evidente',
    ],
    section5Body: 'Alguns hábitos simples costumam bastar para se manter hidratada sem sequer pensar nisso:',
    practicalTips: [
      'Tenha uma garrafa de água ao alcance durante todo o dia',
      'Associe um copo de água a um hábito que já tem (ao acordar, em cada refeição)',
      'Alterne com infusões de ervas se a água simples se tornar monótona',
    ],
    section5Body2: 'Durante a atividade física, lembre-se de beber antes, durante e depois do exercício para compensar a perda de suor.',
    compareTitle1: 'Ideia comum',
    compareText1: '“Beber muito faz-me ficar mais inchada.”',
    compareTitle2: 'Na verdade, é o contrário',
    compareText2: 'Uma boa hidratação ajuda o corpo a reter menos água.',
    tipTitle: 'Bom saber',
    tipText: 'Os chás de gengibre ou de camomila oferecem também uma hidratação reconfortante durante as cólicas.',
    summaryPoints: [
      'Estar bem hidratada ajuda o corpo a reter menos água e reduz o inchaço.',
      'Procure beber cerca de 1,5 a 2 litros por dia, um pouco mais durante o período.',
      'Os chás de gengibre ou de camomila podem também aliviar durante as cólicas.',
      'Uma sede intensa e persistente merece ser mencionada a um profissional de saúde.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui o aconselhamento médico personalizado. Em caso de dúvida, procure a orientação de um profissional de saúde.',
    shareMessage: 'Manter-se hidratada ao longo do ciclo — AWA',
  },
  bn: {
    badge: 'মাসিক চক্র • পানি পান',
    title: 'চক্র জুড়ে\nশরীরে পানির ভারসাম্য রাখা',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'নিবন্ধ',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'অদ্ভুত হলেও সত্য: ভালোভাবে পানি পান করলে পুরো চক্র জুড়ে আপনার শরীর কম পানি ধরে রাখে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'পানি পান কেন গুরুত্বপূর্ণ',
      'চক্রের বিভিন্ন পর্যায়ে প্রয়োজন',
      'প্রতিদিন কী পান করবেন',
      'অপর্যাপ্ত পানি পানের লক্ষণ',
      'ব্যবহারিক পরামর্শ',
      'প্রচলিত ভুল ধারণা',
      'মূল কথা',
    ],
    section1Body: 'অদ্ভুত হলেও সত্য: ভালোভাবে পানি পান করলে শরীর কম পানি ধরে রাখে এবং পেট ফাঁপা কমে, বিশেষ করে চক্রের শেষ দিকে।',
    infoTitle: 'জেনে রাখা ভালো',
    infoText: 'শরীরে পানির ঘাটতি হলে সতর্কতা হিসেবে সে বেশি পানি জমিয়ে রাখে। পর্যাপ্ত পানি পান করলে বরং শরীর বুঝতে পারে যে সে আরও সহজে পানি ছাড়তে পারে।',
    section2Body: 'আপনার পানির চাহিদা মোটামুটি স্থিতিশীল থাকে, পর্যায় অনুযায়ী কিছু সূক্ষ্ম পার্থক্য সহ:',
    phaseNeeds: [
      {
        title: 'মাসিকের সময়',
        text: 'একটু বেশি পানি তরল ক্ষয় পূরণ করতে এবং পেট ফাঁপা সীমিত রাখতে সাহায্য করে।',
      },
      {
        title: 'ডিম্বস্ফোটনের আশপাশে',
        text: 'চাহিদা স্থিতিশীল থাকে; শরীরের তাপমাত্রা সামান্য বাড়লে পিপাসা বাড়তে পারে।',
      },
      {
        title: 'মাসিকের আগের পর্যায়',
        text: 'ভালো পানি পান এই সময়ে প্রায়ই অনুভূত ফুলে ওঠার অনুভূতি সীমিত রাখতে সাহায্য করে।',
      },
    ],
    section3Body: 'প্রতিদিন প্রায় 1.5 থেকে 2 লিটার পানি পান করার লক্ষ্য রাখুন, মাসিকের সময় তরল ক্ষয় পূরণ করতে একটু বেশি।',
    dailyDrinks: [
      {
        title: 'সবার আগে পানি',
        text: 'প্রতিদিন প্রায় 1.5 থেকে 2 লিটার, মাসিকের সময় একটু বেশি।',
      },
      {
        title: 'আরামদায়ক ভেষজ চা',
        text: 'আদা বা ক্যামোমাইল চা তলপেটে ব্যথার সময় মৃদুভাবে শরীরে পানির জোগান দেয়।',
      },
      {
        title: 'চিনি ও ক্যাফেইন, পরিমিত পরিমাণে',
        text: 'খুব মিষ্টি বা ক্যাফেইনযুক্ত পানীয় সীমিত রাখলে চক্রের শেষ দিকে উপকার হতে পারে।',
      },
    ],
    warningTitle: 'যা নজরে রাখা ভালো',
    lowHydrationSigns: [
      'তীব্র বা অস্বাভাবিক পিপাসা',
      'স্বাভাবিকের চেয়ে গাঢ় রঙের প্রস্রাব',
      'ঘন ঘন মাথাব্যথা',
      'অন্য কোনো স্পষ্ট কারণ ছাড়া ক্লান্তি',
    ],
    section5Body: 'কিছু সহজ অভ্যাসই প্রায়ই যথেষ্ট, যাতে না ভেবেই শরীরে পানির ভারসাম্য বজায় থাকে:',
    practicalTips: [
      'সারাদিন হাতের নাগালে একটি পানির বোতল রাখুন',
      'আপনার আগে থেকে থাকা কোনো অভ্যাসের সঙ্গে এক গ্লাস পানি যুক্ত করুন (ঘুম থেকে ওঠা, প্রতিটি খাবার)',
      'সাধারণ পানি একঘেয়ে লাগলে ভেষজ ইনফিউশন মিশিয়ে নিন',
    ],
    section5Body2: 'শারীরিক কার্যকলাপের সময় ঘামে হারানো পানি পূরণ করতে ব্যায়ামের আগে, ব্যায়ামের সময় ও ব্যায়ামের পরে পানি পান করতে মনে রাখবেন।',
    compareTitle1: 'প্রচলিত বিশ্বাস',
    compareText1: '“বেশি পানি পান করলে আমার পেট আরও ফাঁপে।”',
    compareTitle2: 'আসলে ঠিক উল্টো',
    compareText2: 'ভালো পানি পান শরীরকে কম পানি ধরে রাখতে সাহায্য করে।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'আদা বা ক্যামোমাইল চা তলপেটে ব্যথার সময় আরামদায়কভাবে শরীরে পানির জোগানও দেয়।',
    summaryPoints: [
      'ভালোভাবে পানি পান করলে শরীর কম পানি ধরে রাখে এবং পেট ফাঁপা কমে।',
      'প্রতিদিন প্রায় 1.5 থেকে 2 লিটার পানি পান করার লক্ষ্য রাখুন, মাসিকের সময় একটু বেশি।',
      'আদা বা ক্যামোমাইল চা তলপেটে ব্যথার সময় আরামও দিতে পারে।',
      'তীব্র ও দীর্ঘস্থায়ী পিপাসার কথা স্বাস্থ্যসেবা পেশাজীবীকে জানানো ভালো।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। সন্দেহ থাকলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'চক্র জুড়ে শরীরে পানির ভারসাম্য রাখা — AWA',
  },
  da: {
    badge: 'MENSTRUATIONSCYKLUS • HYDRERING',
    title: 'Hold dig hydreret\nigennem hele cyklussen',
    metaDuration: '6 min læsning',
    metaType: 'Artikel',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Overraskende men sandt: at drikke rigeligt vand hjælper faktisk din krop med at tilbageholde mindre vand i løbet af cyklussen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor hydrering er vigtig',
      'Behov i de forskellige faser',
      'Hvad du drikker til hverdag',
      'Tegn på utilstrækkelig hydrering',
      'Praktiske råd',
      'Almindelige misforståelser',
      'Vigtige pointer',
    ],
    section1Body: 'Overraskende men sandt: at drikke rigeligt hjælper kroppen med at tilbageholde mindre vand og reducerer oppustethed, især mod slutningen af cyklussen.',
    infoTitle: 'Godt at vide',
    infoText: 'Når kroppen er dehydreret, tilbageholder den mere vand som en forholdsregel. At drikke nok signalerer til kroppen, at den trygt kan slippe mere væske.',
    section2Body: 'Dit vandindtag forbliver nogenlunde stabilt med visse subtile variationer afhængigt af fasen:',
    phaseNeeds: [
      {
        title: 'Under menstruationen',
        text: 'Lidt mere vand hjælper med at kompensere for væsketab og begrænse oppustethed.',
      },
      {
        title: 'Omkring ægløsningen',
        text: 'Behovet forbliver stabilt; en let stigning i kropstemperaturen kan øge tørsten.',
      },
      {
        title: 'Fasen inden menstruationen',
        text: 'God hydrering hjælper med at begrænse den oppustethedsfornemmelse, der ofte mærkes på dette tidspunkt.',
      },
    ],
    section3Body: 'Sigt efter ca. 1,5 til 2 liter vand om dagen, lidt mere under menstruationen for at kompensere for væsketab.',
    dailyDrinks: [
      {
        title: 'Vand frem for alt',
        text: 'Ca. 1,5 til 2 liter om dagen, lidt mere under menstruationen.',
      },
      {
        title: 'Beroligende urtete',
        text: 'Ingefær- eller kamillelte hydrerer mildt og kan lindre smerter i underlivet.',
      },
      {
        title: 'Sukker og koffein, med måde',
        text: 'At begrænse søde eller koffeinholdige drikke kan hjælpe mod slutningen af cyklussen.',
      },
    ],
    warningTitle: 'Tegn du bør holde øje med',
    lowHydrationSigns: [
      'Intens eller usædvanlig tørst',
      'Mørkere urin end normalt',
      'Hyppig hovedpine',
      'Træthed uden anden åbenlys årsag',
    ],
    section5Body: 'Nogle enkle vaner er ofte nok til at holde sig hydreret uden at tænke over det:',
    practicalTips: [
      'Hold en vandflaske inden for rækkevidde hele dagen',
      'Tilknyt et glas vand til en vane du allerede har (vågne op, hvert måltid)',
      'Bland urtete ind, hvis almindeligt vand virker kedeligt',
    ],
    section5Body2: 'Under fysisk aktivitet skal du huske at drikke vand før, under og efter træning for at kompensere for væsketab gennem sved.',
    compareTitle1: 'Almindelig opfattelse',
    compareText1: '"Hvis jeg drikker mere vand, bliver jeg endnu mere oppustet."',
    compareTitle2: 'Det modsatte er faktisk sandt',
    compareText2: 'God hydrering hjælper kroppen med at tilbageholde mindre vand.',
    tipTitle: 'Godt at vide',
    tipText: 'Ingefær- eller kamillelte hydrerer mildt og kan lindre smerter i underlivet.',
    summaryPoints: [
      'God hydrering hjælper kroppen med at tilbageholde mindre vand og reducerer oppustethed.',
      'Sigt efter ca. 1,5 til 2 liter vand om dagen, lidt mere under menstruationen.',
      'Ingefær- eller kamillelte kan også lindre smerter i underlivet.',
      'Intens og vedvarende tørst bør nævnes for en sundhedsfaglig person.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel er ikke en erstatning for personlig medicinsk rådgivning. Kontakt en sundhedsfaglig person, hvis du er i tvivl.',
    shareMessage: 'Hold dig hydreret gennem hele cyklussen — AWA',
  },
  sv: {
    badge: 'MENSTRUATIONSCYKLUS • HYDRERING',
    title: 'Hold dig hydreret\nigennem hele cyklussen',
    metaDuration: '6 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Overraskende men sandt: at drikke rigeligt vand hjälper faktisk din krop med at tilbageholde mindre vand i löbet av cyklussen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor hydrering ar vigtig',
      'Behov i de forskellige faser',
      'Hvad du drikker till hverdag',
      'Tegn på utilsträkkelig hydrering',
      'Praktiske råd',
      'Almindelige misforståelser',
      'Vigtige pointer',
    ],
    section1Body: 'Overraskende men sandt: at drikke rigeligt hjälper kroppen med at tilbageholde mindre vand och reducerer oppustethed, isär mod slutningen av cyklussen.',
    infoTitle: 'Godt at vide',
    infoText: 'Når kroppen ar dehydreret, tilbageholder den mere vand som en forholdsregel. At drikke nok signalerer till kroppen, at den trygt kan slippe mere väske.',
    section2Body: 'Dit vandindtag forbliver nogenlunde stabilt med visse subtile variationer afhängigt av fasen:',
    phaseNeeds: [
      {
        title: 'Under menstruationen',
        text: 'Lidt mere vand hjälper med at kompensere for väsketab och begränse oppustethed.',
      },
      {
        title: 'Omkring äglösningen',
        text: 'Behovet forbliver stabilt; en let stigning i kropstemperaturen kan öge törsten.',
      },
      {
        title: 'Fasen inden menstruationen',
        text: 'God hydrering hjälper med at begränse den oppustethedsfornemmelse, der ofta märkes på dette tidspunkt.',
      },
    ],
    section3Body: 'Sigt efter ca. 1,5 till 2 liter vand om dagen, lite mere under menstruationen for att kompensere for väsketab.',
    dailyDrinks: [
      {
        title: 'Vand frem for alt',
        text: 'Ca. 1,5 till 2 liter om dagen, lite mere under menstruationen.',
      },
      {
        title: 'Beroligende urtete',
        text: 'Ingefär- eller kamillelte hydrerer mildt och kan lindre smartor i underlivet.',
      },
      {
        title: 'Sukker och koffein, med måde',
        text: 'At begränse söde eller koffeinholdige drikke kan hjälpe mod slutningen av cyklussen.',
      },
    ],
    warningTitle: 'Tegn du bör holde öje med',
    lowHydrationSigns: [
      'Intens eller usädvanlig törst',
      'Mörkere urin end normalt',
      'Hyppig hovedpine',
      'Träthed uden anden åbenlys årsag',
    ],
    section5Body: 'Nogle enkle vaner ar ofta nok till at holde sig hydreret uden at tänke over det:',
    practicalTips: [
      'Hold en vandflaske inden for räkkevidde hele dagen',
      'Tilknyt et glas vand till en vane du redan har (vågne op, hvert måltid)',
      'Bland urtete ind, hvis almindeligt vand virker kedeligt',
    ],
    section5Body2: 'Under fysisk aktivitet skal du huske at drikke vand för, under och efter träning for att kompensere for väsketab gennem sved.',
    compareTitle1: 'Almindelig opfattelse',
    compareText1: '"Hvis jag drikker mere vand, bliver jag annu mere oppustet."',
    compareTitle2: 'Det modsatte ar faktisk sandt',
    compareText2: 'God hydrering hjälper kroppen med at tilbageholde mindre vand.',
    tipTitle: 'Godt at vide',
    tipText: 'Ingefär- eller kamillelte hydrerer mildt och kan lindre smartor i underlivet.',
    summaryPoints: [
      'God hydrering hjälper kroppen med at tilbageholde mindre vand och reducerer oppustethed.',
      'Sigt efter ca. 1,5 till 2 liter vand om dagen, lite mere under menstruationen.',
      'Ingefär- eller kamillelte kan også lindre smartor i underlivet.',
      'Intens och vedvarende törst bör nävnes for en halsasfaglig person.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel ar inte en erstatning for personlig medicinsk rådgivning. Kontakt en halsasfaglig person, hvis du ar i tvivl.',
    shareMessage: 'Hold dig hydreret gennem hele cyklussen — AWA',
  },
  nb: {
    badge: 'MENSTRUASJONSSYKLUS • VÆSKEINNTAK',
    title: 'Drikke nok\ngjennom syklusen',
    metaDuration: '6 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Det høres motsatt ut, men stemmer: å drikke nok hjelper kroppen å holde på mindre vann gjennom syklusen.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hvorfor væskeinntak er viktig',
      'Behov gjennom fasene i syklusen',
      'Hva du bør drikke i hverdagen',
      'Tegn på for lite væske',
      'Praktiske tips',
      'Vanlige misforståelser',
      'Det viktigste å huske',
    ],
    section1Body: 'Det høres motsatt ut, men stemmer: å drikke nok hjelper kroppen å holde på mindre vann og reduserer oppblåsthet, særlig mot slutten av syklusen.',
    infoTitle: 'Godt å vite',
    infoText: 'Når kroppen mangler vann, har den en tendens til å lagre mer av det som en forholdsregel. Å drikke nok forteller den tvert imot at den lettere kan slippe vann.',
    section2Body: 'Vannbehovet ditt er totalt sett ganske stabilt, med noen nyanser avhengig av fasen:',
    phaseNeeds: [
      {title: 'Under mensen', text: 'Litt ekstra vann hjelper å veie opp for væsketapet og begrense oppblåsthet.'},
      {title: 'Rundt eggløsningen', text: 'Behovet er stabilt; en liten økning i kroppstemperaturen kan øke tørsten.'},
      {title: 'Fasen før mensen', text: 'Godt væskeinntak bidrar til å begrense følelsen av oppsvulmethet som ofte kjennes i denne perioden.'},
    ],
    section3Body: 'Sikt mot omtrent 1,5 til 2 liter om dagen, litt mer under mensen for å veie opp for væsketapet.',
    dailyDrinks: [
      {title: 'Vann, først og fremst', text: 'Omtrent 1,5 til 2 liter om dagen, litt mer under mensen.'},
      {title: 'Beroligende urtete', text: 'Ingefær eller kamille gir mild hydrering ved kramper.'},
      {title: 'Sukker og koffein, med måte', text: 'Å begrense svært sukkerholdige eller koffeinholdige drikker kan hjelpe mot slutten av syklusen.'},
    ],
    warningTitle: 'Verdt å følge med på',
    lowHydrationSigns: [
      'Intens eller uvanlig tørste',
      'Mørkere urin enn vanlig',
      'Hyppig hodepine',
      'Tretthet uten noen annen tydelig forklaring',
    ],
    section5Body: 'Noen enkle vaner er ofte nok til å holde seg hydrert uten å tenke på det:',
    practicalTips: [
      'Ha en vannflaske innen rekkevidde gjennom dagen',
      'Knytt et glass vann til en vane du allerede har (når du våkner, hvert måltid)',
      'Bland inn urtete hvis rent vann blir kjedelig',
    ],
    section5Body2: 'Under fysisk aktivitet bør du huske å drikke før, under og etter treningen for å veie opp for svettetapet.',
    compareTitle1: 'Vanlig oppfatning',
    compareText1: '«Hvis jeg drikker mye, blir jeg mer oppblåst.»',
    compareTitle2: 'Faktisk det motsatte',
    compareText2: 'Godt væskeinntak hjelper kroppen å holde på mindre vann.',
    tipTitle: 'Godt å vite',
    tipText: 'Te av ingefær eller kamille gir også beroligende hydrering ved kramper.',
    summaryPoints: [
      'Å drikke nok hjelper kroppen å holde på mindre vann og reduserer oppblåsthet.',
      'Sikt mot omtrent 1,5 til 2 liter om dagen, litt mer under mensen.',
      'Te av ingefær eller kamille kan også lindre ved kramper.',
      'Intens, vedvarende tørste er verdt å nevne for helsepersonell.',
    ],
    disclaimerText: 'Informasjonsinnhold. Denne artikkelen erstatter ikke personlig medisinsk rådgivning. Ved tvil bør du søke veiledning hos helsepersonell.',
    shareMessage: 'Drikke nok gjennom syklusen – AWA',
  },
  pl: {
    badge: 'CYKL MIESIĄCZKOWY • NAWODNIENIE',
    title: 'Dbaj o nawodnienie\nprzez cały cykl',
    metaDuration: '6 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Wbrew intuicji, ale prawda: dobre nawodnienie pomaga Twojemu ciału zatrzymywać mniej wody przez cały cykl.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Dlaczego nawodnienie jest ważne',
      'Zapotrzebowanie w poszczególnych fazach cyklu',
      'Co pić na co dzień',
      'Oznaki niedostatecznego nawodnienia',
      'Praktyczne wskazówki',
      'Częste błędne przekonania',
      'Najważniejsze wnioski',
    ],
    section1Body: 'Wbrew intuicji, ale prawda: dobre nawodnienie pomaga ciału zatrzymywać mniej wody i zmniejsza wzdęcia, zwłaszcza pod koniec cyklu.',
    infoTitle: 'Warto wiedzieć',
    infoText: 'Gdy organizmowi brakuje wody, ma tendencję do gromadzenia jej więcej na wszelki wypadek. Picie odpowiedniej ilości mówi mu natomiast, że może łatwiej ją oddawać.',
    section2Body: 'Twoje zapotrzebowanie na wodę pozostaje w sumie dość stałe, z kilkoma niuansami w zależności od fazy:',
    phaseNeeds: [
      {title: 'Podczas miesiączki', text: 'Odrobina dodatkowej wody pomaga uzupełnić utratę płynów i ograniczyć wzdęcia.'},
      {title: 'Około owulacji', text: 'Zapotrzebowanie pozostaje stabilne; niewielki wzrost temperatury ciała może zwiększać pragnienie.'},
      {title: 'Faza przedmiesiączkowa', text: 'Dobre nawodnienie pomaga ograniczyć uczucie obrzmienia, często odczuwane w tym czasie.'},
    ],
    section3Body: 'Staraj się pić około 1,5 do 2 litrów dziennie, nieco więcej podczas miesiączki, by uzupełnić utratę płynów.',
    dailyDrinks: [
      {title: 'Przede wszystkim woda', text: 'Około 1,5 do 2 litrów dziennie, nieco więcej podczas miesiączki.'},
      {title: 'Kojące napary ziołowe', text: 'Imbir lub rumianek zapewniają łagodne nawodnienie podczas skurczów.'},
      {title: 'Cukier i kofeina z umiarem', text: 'Ograniczenie bardzo słodkich lub zawierających kofeinę napojów może pomóc pod koniec cyklu.'},
    ],
    warningTitle: 'Warto mieć na oku',
    lowHydrationSigns: [
      'Silne lub nietypowe pragnienie',
      'Ciemniejszy niż zwykle mocz',
      'Częste bóle głowy',
      'Zmęczenie bez innego oczywistego wyjaśnienia',
    ],
    section5Body: 'Kilka prostych nawyków często wystarcza, by pozostać nawodnioną, nawet o tym nie myśląc:',
    practicalTips: [
      'Miej butelkę wody w zasięgu ręki przez cały dzień',
      'Połącz szklankę wody z nawykiem, który już masz (poranne wstawanie, każdy posiłek)',
      'Dodawaj napary ziołowe, jeśli zwykła woda się nudzi',
    ],
    section5Body2: 'Podczas aktywności fizycznej pamiętaj, by pić przed, w trakcie i po ćwiczeniach, aby uzupełnić utratę wody z potem.',
    compareTitle1: 'Powszechne przekonanie',
    compareText1: '„Gdy dużo piję, mam więcej wzdęć.”',
    compareTitle2: 'W rzeczywistości jest odwrotnie',
    compareText2: 'Dobre nawodnienie pomaga ciału zatrzymywać mniej wody.',
    tipTitle: 'Warto wiedzieć',
    tipText: 'Napary z imbiru lub rumianku zapewniają też kojące nawodnienie podczas skurczów.',
    summaryPoints: [
      'Dobre nawodnienie pomaga ciału zatrzymywać mniej wody i zmniejsza wzdęcia.',
      'Staraj się pić około 1,5 do 2 litrów dziennie, nieco więcej podczas miesiączki.',
      'Napary z imbiru lub rumianku mogą też łagodzić skurcze.',
      'Silne, uporczywe pragnienie warto zgłosić specjaliście.',
    ],
    disclaimerText: 'Treść informacyjna. Ten artykuł nie zastępuje spersonalizowanej porady medycznej. W razie wątpliwości zasięgnij porady specjalisty.',
    shareMessage: 'Dbaj o nawodnienie przez cały cykl — AWA',
  },
  uk: {
    badge: 'МЕНСТРУАЛЬНИЙ ЦИКЛ • ПИТНИЙ РЕЖИМ',
    title: 'Підтримуйте питний режим\nпротягом циклу',
    metaDuration: '6 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Всупереч інтуїції, але це так: достатнє споживання води допомагає вашому тілу затримувати менше води протягом циклу.',
    contentsTitle: 'У цій статті',
    topics: [
      'Чому питний режим важливий',
      'Потреби в різних фазах циклу',
      'Що пити щодня',
      'Ознаки недостатнього зволоження',
      'Практичні поради',
      'Поширені хибні уявлення',
      'Головні висновки',
    ],
    section1Body: 'Всупереч інтуїції, але це так: достатнє споживання води допомагає тілу затримувати менше води та зменшує здуття, особливо наприкінці циклу.',
    infoTitle: 'Варто знати',
    infoText: 'Коли тілу бракує води, воно схильне запасати її більше про всяк випадок. Достатнє споживання, навпаки, повідомляє йому, що воно може легше її виводити.',
    section2Body: 'Ваша потреба у воді загалом залишається досить стабільною, з кількома нюансами залежно від фази:',
    phaseNeeds: [
      {title: 'Під час менструації', text: 'Трохи більше води допомагає компенсувати втрату рідини й обмежити здуття.'},
      {title: 'Близько овуляції', text: 'Потреби залишаються стабільними; невелике підвищення температури тіла може посилювати спрагу.'},
      {title: 'Передменструальна фаза', text: 'Достатнє споживання води допомагає обмежити відчуття набряклості, яке часто виникає в цей час.'},
    ],
    section3Body: 'Прагніть пити близько 1,5–2 літрів на день, трохи більше під час менструації, щоб компенсувати втрату рідини.',
    dailyDrinks: [
      {title: 'Насамперед вода', text: 'Близько 1,5–2 літрів на день, трохи більше під час менструації.'},
      {title: 'Заспокійливі трав’яні чаї', text: 'Імбир або ромашка забезпечують м’яке зволоження під час спазмів.'},
      {title: 'Цукор і кофеїн — помірно', text: 'Обмеження дуже солодких чи кофеїновмісних напоїв може допомогти наприкінці циклу.'},
    ],
    warningTitle: 'Варто стежити',
    lowHydrationSigns: [
      'Сильна або незвична спрага',
      'Темніша, ніж зазвичай, сеча',
      'Часті головні болі',
      'Втома без іншого очевидного пояснення',
    ],
    section5Body: 'Кількох простих звичок часто достатньо, щоб підтримувати питний режим, навіть не замислюючись:',
    practicalTips: [
      'Тримайте пляшку з водою під рукою протягом дня',
      'Поєднуйте склянку води зі звичкою, яка в вас уже є (пробудження, кожен прийом їжі)',
      'Додавайте трав’яні настої, якщо проста вода набридає',
    ],
    section5Body2: 'Під час фізичної активності пам’ятайте пити до, під час і після вправ, щоб компенсувати втрату води з потом.',
    compareTitle1: 'Поширена думка',
    compareText1: '«Коли я багато п’ю, у мене більше здуття.»',
    compareTitle2: 'Насправді навпаки',
    compareText2: 'Достатнє споживання води допомагає тілу затримувати менше води.',
    tipTitle: 'Варто знати',
    tipText: 'Чаї з імбиру чи ромашки також забезпечують заспокійливе зволоження під час спазмів.',
    summaryPoints: [
      'Достатнє споживання води допомагає тілу затримувати менше води та зменшує здуття.',
      'Прагніть пити близько 1,5–2 літрів на день, трохи більше під час менструації.',
      'Чаї з імбиру чи ромашки також можуть заспокоювати під час спазмів.',
      'Про сильну, стійку спрагу варто повідомити медичному фахівцю.',
    ],
    disclaimerText: 'Інформаційний вміст. Ця стаття не замінює персоналізованої медичної поради. У разі сумнівів зверніться до медичного фахівця.',
    shareMessage: 'Підтримуйте питний режим протягом циклу — AWA',
  },
  cs: {
    badge: 'MENSTRUAČNÍ CYKLUS • PITNÝ REŽIM',
    title: 'Dostatečný pitný režim\nv průběhu cyklu',
    metaDuration: '6 min čtení',
    metaType: 'Článek',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Zní to nelogicky, ale je to tak: dobrý pitný režim pomáhá vašemu tělu zadržovat v průběhu cyklu méně vody.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Proč je pitný režim důležitý',
      'Potřeby v jednotlivých fázích cyklu',
      'Co pít v každodenním životě',
      'Příznaky nedostatečného pitného režimu',
      'Praktické tipy',
      'Časté mylné představy',
      'Hlavní poznatky',
    ],
    section1Body: 'Zní to nelogicky, ale je to tak: dobrý pitný režim pomáhá tělu zadržovat méně vody a snižuje nadýmání, zejména ke konci cyklu.',
    infoTitle: 'Stojí za to vědět',
    infoText: 'Když tělu chybí voda, má tendenci ji preventivně ukládat. Dostatek pití mu naopak dává signál, že může vodu snáze uvolnit.',
    section2Body: 'Vaše potřeba vody zůstává celkově poměrně stabilní, s několika nuancemi podle fáze:',
    phaseNeeds: [
      {title: 'Během menstruace', text: 'Trocha vody navíc pomáhá nahradit ztrátu tekutin a omezit nadýmání.'},
      {title: 'Kolem ovulace', text: 'Potřeby zůstávají stabilní; mírný nárůst tělesné teploty může zvýšit žízeň.'},
      {title: 'Předmenstruační fáze', text: 'Dobrý pitný režim pomáhá omezit pocit oteklosti, který se v této době často objevuje.'},
    ],
    section3Body: 'Cílem je přibližně 1,5 až 2 litry denně, během menstruace o něco více, aby se nahradila ztráta tekutin.',
    dailyDrinks: [
      {title: 'Především voda', text: 'Asi 1,5 až 2 litry denně, během menstruace o něco více.'},
      {title: 'Uklidňující bylinné čaje', text: 'Zázvor nebo heřmánek nabízejí jemné hydratování při křečích.'},
      {title: 'Cukr a kofein s mírou', text: 'Omezení velmi sladkých nebo kofeinových nápojů může pomoci ke konci cyklu.'},
    ],
    warningTitle: 'Stojí za to sledovat',
    lowHydrationSigns: [
      'Intenzivní nebo neobvyklá žízeň',
      'Tmavší moč než obvykle',
      'Časté bolesti hlavy',
      'Únava bez jiného zjevného vysvětlení',
    ],
    section5Body: 'K udržení pitného režimu, aniž byste na to museli myslet, často stačí několik jednoduchých návyků:',
    practicalTips: [
      'Mějte po celý den láhev s vodou na dosah',
      'Spojte sklenici vody s návykem, který už máte (probuzení, každé jídlo)',
      'Střídejte vodu s bylinnými nálevy, pokud vás čistá voda omrzí',
    ],
    section5Body2: 'Při fyzické aktivitě nezapomínejte pít před cvičením, během něj i po něm, abyste nahradila ztrátu potem.',
    compareTitle1: 'Běžná představa',
    compareText1: '„Když hodně piju, mám větší nadýmání.“',
    compareTitle2: 'Ve skutečnosti naopak',
    compareText2: 'Dobrý pitný režim pomáhá tělu zadržovat méně vody.',
    tipTitle: 'Stojí za to vědět',
    tipText: 'Čaje ze zázvoru nebo heřmánku také nabízejí uklidňující hydrataci při křečích.',
    summaryPoints: [
      'Dobrý pitný režim pomáhá tělu zadržovat méně vody a snižuje nadýmání.',
      'Cílem je přibližně 1,5 až 2 litry denně, během menstruace o něco více.',
      'Čaje ze zázvoru nebo heřmánku mohou také zmírnit křeče.',
      'Intenzivní, přetrvávající žízeň stojí za zmínku zdravotnickému pracovníkovi.',
    ],
    disclaimerText: 'Informativní obsah. Tento článek nenahrazuje individuální lékařskou radu. V případě pochybností požádejte o radu zdravotnického pracovníka.',
    shareMessage: 'Dostatečný pitný režim v průběhu cyklu — AWA',
  },
  sk: {
    badge: 'MENŠTRUAČNÝ CYKLUS • HYDRATÁCIA',
    title: 'Dostatočný príjem tekutín\npočas cyklu',
    metaDuration: '6 min čítania',
    metaType: 'Článok',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Hoci to znie nelogicky, je to pravda: dobrá hydratácia pomáha vášmu telu zadržiavať počas cyklu menej vody.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Prečo je hydratácia dôležitá',
      'Potreby v jednotlivých fázach cyklu',
      'Čo piť každý deň',
      'Znaky nedostatočného príjmu tekutín',
      'Praktické tipy',
      'Bežné mylné predstavy',
      'Hlavné body',
    ],
    section1Body: 'Hoci to znie nelogicky, je to pravda: dobrá hydratácia pomáha telu zadržiavať menej vody a znižuje nadúvanie, najmä ku koncu cyklu.',
    infoTitle: 'Stojí za to vedieť',
    infoText: 'Keď telu chýba voda, má tendenciu ju z preventívnych dôvodov viac ukladať. Dostatočné pitie mu naopak signalizuje, že vodu môže ľahšie uvoľňovať.',
    section2Body: 'Vaše potreby vody zostávajú celkovo pomerne stabilné, s niekoľkými nuansami podľa fázy:',
    phaseNeeds: [
      {title: 'Počas menštruácie', text: 'Trochu viac vody pomáha vyrovnať stratu tekutín a obmedziť nadúvanie.'},
      {title: 'Okolo ovulácie', text: 'Potreby zostávajú stabilné; mierny nárast telesnej teploty môže zvýšiť smäd.'},
      {title: 'Premenštruačná fáza', text: 'Dobrá hydratácia pomáha obmedziť pocit opuchnutosti, ktorý sa v tomto období často vyskytuje.'},
    ],
    section3Body: 'Cieľom je približne 1,5 až 2 litre denne, počas menštruácie o trochu viac, na vyrovnanie straty tekutín.',
    dailyDrinks: [
      {title: 'Predovšetkým voda', text: 'Približne 1,5 až 2 litre denne, počas menštruácie o trochu viac.'},
      {title: 'Upokojujúce bylinkové čaje', text: 'Zázvor alebo harmanček ponúkajú jemnú hydratáciu pri kŕčoch.'},
      {title: 'Cukor a kofeín s mierou', text: 'Obmedzenie veľmi sladených alebo kofeínových nápojov môže pomôcť ku koncu cyklu.'},
    ],
    warningTitle: 'Stojí za to sledovať',
    lowHydrationSigns: [
      'Intenzívny alebo nezvyčajný smäd',
      'Tmavší moč než zvyčajne',
      'Časté bolesti hlavy',
      'Únava bez inej zjavnej príčiny',
    ],
    section5Body: 'Na udržanie hydratácie bez zvláštneho premýšľania často stačí niekoľko jednoduchých návykov:',
    practicalTips: [
      'Majte fľašu s vodou po celý deň na dosah',
      'Spojte pohár vody s návykom, ktorý už máte (zobudenie, každé jedlo)',
      'Zaraďte bylinkové nálevy, ak vás čistá voda omrzí',
    ],
    section5Body2: 'Pri fyzickej aktivite nezabudnite piť pred cvičením, počas neho aj po ňom, aby ste nahradili stratu potením.',
    compareTitle1: 'Bežná predstava',
    compareText1: '„Keď veľa pijem, viac sa nadúvam.“',
    compareTitle2: 'V skutočnosti opak',
    compareText2: 'Dobrá hydratácia pomáha telu zadržiavať menej vody.',
    tipTitle: 'Stojí za to vedieť',
    tipText: 'Zázvorový alebo harmančekový čaj ponúka aj upokojujúcu hydratáciu pri kŕčoch.',
    summaryPoints: [
      'Dobrá hydratácia pomáha telu zadržiavať menej vody a znižuje nadúvanie.',
      'Cieľom je približne 1,5 až 2 litre denne, počas menštruácie o trochu viac.',
      'Zázvorový alebo harmančekový čaj môže pri kŕčoch tiež upokojiť.',
      'Intenzívny, pretrvávajúci smäd stojí za to spomenúť zdravotníckemu pracovníkovi.',
    ],
    disclaimerText: 'Informatívny obsah. Tento článok nenahrádza individuálnu lekársku radu. V prípade pochybností sa poraďte so zdravotníckym pracovníkom.',
    shareMessage: 'Dostatočný príjem tekutín počas cyklu — AWA',
  },
  hu: {
    badge: 'MENSTRUÁCIÓS CIKLUS • FOLYADÉKBEVITEL',
    title: 'Megfelelő folyadékbevitel\na ciklusod során',
    metaDuration: '6 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Bár ellentmondásosnak hangzik, igaz: a megfelelő hidratálás segít, hogy a tested kevesebb vizet tartson vissza a ciklusod során.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Miért fontos a hidratálás',
      'Szükségletek a ciklus különböző szakaszaiban',
      'Mit igyál a mindennapokban',
      'A nem elegendő folyadékbevitel jelei',
      'Praktikus tippek',
      'Gyakori tévhitek',
      'Legfontosabb tudnivalók',
    ],
    section1Body: 'Bár ellentmondásosnak hangzik, igaz: a megfelelő hidratálás segít a szervezetnek kevesebb vizet visszatartani, és csökkenti a puffadást, különösen a ciklus vége felé.',
    infoTitle: 'Érdemes tudni',
    infoText: 'Amikor a szervezetnek kevés a vize, óvatosságból hajlamos többet raktározni belőle. A megfelelő ivás ezzel szemben azt jelzi neki, hogy könnyebben leadhatja a vizet.',
    section2Body: 'A vízszükségleted összességében meglehetősen stabil marad, a szakasztól függően néhány árnyalattal:',
    phaseNeeds: [
      {title: 'A menstruáció alatt', text: 'Egy kis plusz víz segít kiegyenlíteni a folyadékvesztést és korlátozni a puffadást.'},
      {title: 'A peteérés körül', text: 'A szükséglet stabil marad; a testhőmérséklet enyhe emelkedése fokozhatja a szomjúságot.'},
      {title: 'Premenstruációs szakasz', text: 'A jó hidratálás segít korlátozni az ebben az időszakban gyakran érzett puffadtságérzetet.'},
    ],
    section3Body: 'Célozz naponta körülbelül 1,5–2 litert, a menstruáció alatt kicsit többet, a folyadékvesztés pótlására.',
    dailyDrinks: [
      {title: 'Mindenekelőtt víz', text: 'Naponta körülbelül 1,5–2 liter, a menstruáció alatt kicsit több.'},
      {title: 'Megnyugtató gyógyteák', text: 'A gyömbér vagy a kamilla szelíd hidratálást nyújt görcsök esetén.'},
      {title: 'Cukor és koffein mértékkel', text: 'A nagyon cukros vagy koffeintartalmú italok korlátozása segíthet a ciklus vége felé.'},
    ],
    warningTitle: 'Érdemes figyelni',
    lowHydrationSigns: [
      'Intenzív vagy szokatlan szomjúság',
      'A szokásosnál sötétebb vizelet',
      'Gyakori fejfájás',
      'Fáradtság más nyilvánvaló magyarázat nélkül',
    ],
    section5Body: 'Néhány egyszerű szokás gyakran elég ahhoz, hogy hidratált maradj anélkül, hogy gondolnál rá:',
    practicalTips: [
      'Tarts egy vizespalackot a nap folyamán elérhető közelségben',
      'Kösd a pohár vizet egy már meglévő szokásodhoz (ébredés, minden étkezés)',
      'Iktass be gyógyteákat, ha a sima víz unalmassá válik',
    ],
    section5Body2: 'Fizikai aktivitás közben ne feledj inni az edzés előtt, alatt és után, hogy pótold a verejtékezéssel elvesztett folyadékot.',
    compareTitle1: 'Gyakori hiedelem',
    compareText1: '„Ha sokat iszom, jobban puffadok.”',
    compareTitle2: 'Valójában éppen ellenkezőleg',
    compareText2: 'A jó hidratálás segít a szervezetnek kevesebb vizet visszatartani.',
    tipTitle: 'Érdemes tudni',
    tipText: 'A gyömbér- vagy kamillatea görcsök esetén is megnyugtató hidratálást nyújt.',
    summaryPoints: [
      'A megfelelő hidratálás segít a szervezetnek kevesebb vizet visszatartani, és csökkenti a puffadást.',
      'Célozz naponta körülbelül 1,5–2 litert, a menstruáció alatt kicsit többet.',
      'A gyömbér- vagy kamillatea görcsök esetén is megnyugtathat.',
      'Az intenzív, tartós szomjúságot érdemes jelezni egészségügyi szakembernek.',
    ],
    disclaimerText: 'Tájékoztató jellegű tartalom. Ez a cikk nem helyettesíti a személyre szabott orvosi tanácsot. Kétség esetén kérj útmutatást egészségügyi szakembertől.',
    shareMessage: 'Megfelelő folyadékbevitel a ciklusod során — AWA',
  },
  ro: {
    badge: 'CICLUL MENSTRUAL • HIDRATARE',
    title: 'Hidratarea corectă\npe tot parcursul ciclului',
    metaDuration: '6 min de citit',
    metaType: 'Articol',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Pare contraintuitiv, dar este adevărat: o hidratare bună ajută corpul să rețină mai puțină apă pe tot parcursul ciclului.',
    contentsTitle: 'În acest articol',
    topics: [
      'De ce contează hidratarea',
      'Nevoile în fazele ciclului tău',
      'Ce să bei zi de zi',
      'Semne de hidratare insuficientă',
      'Sfaturi practice',
      'Idei preconcepute frecvente',
      'Ce să reții',
    ],
    section1Body: 'Pare contraintuitiv, dar este adevărat: o hidratare bună ajută corpul să rețină mai puțină apă și reduce balonarea, mai ales spre sfârșitul ciclului.',
    infoTitle: 'Bine de știut',
    infoText: 'Când corpului îi lipsește apa, tinde să stocheze mai multă, ca măsură de precauție. Un consum suficient îi spune, dimpotrivă, că poate elimina apa mai ușor.',
    section2Body: 'Nevoile tale de apă rămân în ansamblu destul de stabile, cu câteva nuanțe în funcție de fază:',
    phaseNeeds: [
      {title: 'În timpul menstruației', text: 'Puțină apă în plus ajută la compensarea pierderilor de lichide și la limitarea balonării.'},
      {title: 'În jurul ovulației', text: 'Nevoile rămân stabile; o ușoară creștere a temperaturii corpului poate mări senzația de sete.'},
      {title: 'Faza premenstruală', text: 'O hidratare bună ajută la limitarea senzației de umflare resimțite adesea în această perioadă.'},
    ],
    section3Body: 'Țintește aproximativ 1,5 până la 2 litri pe zi, ceva mai mult în timpul menstruației, pentru a compensa pierderea de lichide.',
    dailyDrinks: [
      {title: 'Apă, înainte de toate', text: 'Aproximativ 1,5 până la 2 litri pe zi, ceva mai mult în timpul menstruației.'},
      {title: 'Ceaiuri de plante liniștitoare', text: 'Ghimbirul sau mușețelul oferă o hidratare blândă în timpul crampelor.'},
      {title: 'Zahăr și cafeină, cu moderație', text: 'Limitarea băuturilor foarte îndulcite sau cu cafeină poate ajuta spre sfârșitul ciclului.'},
    ],
    warningTitle: 'De urmărit',
    lowHydrationSigns: [
      'Sete intensă sau neobișnuită',
      'Urină mai închisă la culoare decât de obicei',
      'Dureri de cap frecvente',
      'Oboseală fără altă explicație evidentă',
    ],
    section5Body: 'Câteva obiceiuri simple sunt adesea suficiente pentru a rămâne hidratată fără să te gândești la asta:',
    practicalTips: [
      'Ține o sticlă cu apă la îndemână pe tot parcursul zilei',
      'Asociază un pahar de apă cu un obicei pe care îl ai deja (trezirea, fiecare masă)',
      'Alternează cu infuzii de plante dacă apa simplă devine monotonă',
    ],
    section5Body2: 'În timpul activității fizice, nu uita să bei înainte, în timpul și după efort pentru a compensa pierderea prin transpirație.',
    compareTitle1: 'Credință frecventă',
    compareText1: '„Dacă beau mult, mă balonez mai tare.”',
    compareTitle2: 'De fapt, invers',
    compareText2: 'O hidratare bună ajută corpul să rețină mai puțină apă.',
    tipTitle: 'Bine de știut',
    tipText: 'Ceaiurile de ghimbir sau de mușețel oferă și o hidratare liniștitoare în timpul crampelor.',
    summaryPoints: [
      'O hidratare bună ajută corpul să rețină mai puțină apă și reduce balonarea.',
      'Țintește aproximativ 1,5 până la 2 litri pe zi, ceva mai mult în timpul menstruației.',
      'Ceaiurile de ghimbir sau de mușețel pot liniști și ele în timpul crampelor.',
      'Setea intensă și persistentă merită menționată unui profesionist din domeniul sănătății.',
    ],
    disclaimerText: 'Conținut cu caracter informativ. Acest articol nu înlocuiește sfatul medical personalizat. Dacă ai îndoieli, cere îndrumare unui profesionist din domeniul sănătății.',
    shareMessage: 'Hidratarea corectă pe tot parcursul ciclului — AWA',
  },
  bg: {
    badge: 'МЕНСТРУАЛЕН ЦИКЪЛ • ХИДРАТАЦИЯ',
    title: 'Добра хидратация\nпрез целия цикъл',
    metaDuration: '6 мин четене',
    metaType: 'Статия',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Звучи противоинтуитивно, но е вярно: добрата хидратация помага на тялото ти да задържа по-малко вода през целия цикъл.',
    contentsTitle: 'В тази статия',
    topics: [
      'Защо хидратацията е важна',
      'Нуждите във фазите на цикъла ти',
      'Какво да пиеш ежедневно',
      'Признаци на недостатъчна хидратация',
      'Практически съвети',
      'Чести погрешни представи',
      'Какво да запомниш',
    ],
    section1Body: 'Звучи противоинтуитивно, но е вярно: добрата хидратация помага на тялото да задържа по-малко вода и намалява подуването, особено към края на цикъла.',
    infoTitle: 'Добре е да знаеш',
    infoText: 'Когато на тялото му липсва вода, то има склонност да съхранява повече от нея за всеки случай. Достатъчният прием му казва, напротив, че може по-лесно да отделя вода.',
    section2Body: 'Нуждите ти от вода остават като цяло доста стабилни, с няколко нюанса според фазата:',
    phaseNeeds: [
      {title: 'По време на менструацията', text: 'Малко повече вода помага да се компенсира загубата на течности и да се ограничи подуването.'},
      {title: 'Около овулацията', text: 'Нуждите остават стабилни; леко повишаване на телесната температура може да увеличи жаждата.'},
      {title: 'Предменструална фаза', text: 'Добрата хидратация помага да се ограничи усещането за подпухналост, често усещано през този период.'},
    ],
    section3Body: 'Цели се приблизително към 1,5 до 2 литра на ден, малко повече по време на менструацията, за да компенсираш загубата на течности.',
    dailyDrinks: [
      {title: 'Вода, преди всичко', text: 'Приблизително 1,5 до 2 литра на ден, малко повече по време на менструацията.'},
      {title: 'Успокояващи билкови чайове', text: 'Джинджифилът или лайката предлагат нежна хидратация при крампи.'},
      {title: 'Захар и кофеин, умерено', text: 'Ограничаването на много подсладените или съдържащи кофеин напитки може да помогне към края на цикъла.'},
    ],
    warningTitle: 'Заслужава да се следи',
    lowHydrationSigns: [
      'Силна или необичайна жажда',
      'Урина, по-тъмна от обичайното',
      'Чести главоболия',
      'Умора без друго очевидно обяснение',
    ],
    section5Body: 'Няколко прости навика често са достатъчни, за да останеш хидратирана, без дори да се замисляш:',
    practicalTips: [
      'Дръж бутилка с вода под ръка през целия ден',
      'Свържи чаша вода с навик, който вече имаш (събуждане, всяко хранене)',
      'Редувай с билкови запарки, ако простата вода омръзне',
    ],
    section5Body2: 'По време на физическа активност не забравяй да пиеш преди, по време на и след тренировка, за да компенсираш загубата чрез потене.',
    compareTitle1: 'Често срещано убеждение',
    compareText1: '„Ако пия много, се подувам повече.“',
    compareTitle2: 'Всъщност обратното',
    compareText2: 'Добрата хидратация помага на тялото да задържа по-малко вода.',
    tipTitle: 'Добре е да знаеш',
    tipText: 'Чаят от джинджифил или лайка предлага и успокояваща хидратация при крампи.',
    summaryPoints: [
      'Добрата хидратация помага на тялото да задържа по-малко вода и намалява подуването.',
      'Цели се приблизително към 1,5 до 2 литра на ден, малко повече по време на менструацията.',
      'Чаят от джинджифил или лайка също може да успокои при крампи.',
      'Силната, упорита жажда заслужава да се спомене на здравен специалист.',
    ],
    disclaimerText: 'Информационно съдържание. Тази статия не замества персонализирания медицински съвет. При съмнение поискай насоки от здравен специалист.',
    shareMessage: 'Добра хидратация през целия цикъл — AWA',
  },
  sr: {
    badge: 'МЕНСТРУАЛНИ ЦИКЛУС • ХИДРАТАЦИЈА',
    title: 'Добра хидратација\nтоком циклуса',
    metaDuration: '6 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Супротно интуицији, али тачно: добра хидратација помаже твом телу да задржава мање воде током циклуса.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Зашто је хидратација важна',
      'Потребе кроз фазе циклуса',
      'Шта пити из дана у дан',
      'Знаци недовољне хидратације',
      'Практични савети',
      'Чести погрешни ставови',
      'Шта да запамтиш',
    ],
    section1Body: 'Супротно интуицији, али тачно: добра хидратација помаже телу да задржава мање воде и смањује надутост, нарочито ка крају циклуса.',
    infoTitle: 'Добро је знати',
    infoText: 'Када телу недостаје воде, оно је из предострожности складишти више. Довољно пијење му, напротив, говори да може лакше да ослободи воду.',
    section2Body: 'Твоје потребе за водом остају прилично стабилне, уз неколико нијанси зависно од фазе:',
    phaseNeeds: [
      {title: 'Током менструације', text: 'Мало више воде помаже да се надокнади губитак течности и ограничи надутост.'},
      {title: 'Око овулације', text: 'Потребе остају стабилне; благ пораст телесне температуре може појачати жеђ.'},
      {title: 'Предменструална фаза', text: 'Добра хидратација помаже да се ограничи осећај отечености који се у овом периоду често осећа.'},
    ],
    section3Body: 'Циљај на око 1,5 до 2 литра дневно, нешто више током менструације да надокнадиш губитак течности.',
    dailyDrinks: [
      {title: 'Пре свега вода', text: 'Око 1,5 до 2 литра дневно, нешто више током менструације.'},
      {title: 'Умирујући биљни чајеви', text: 'Ђумбир или камилица нуде нежну хидратацију током грчева.'},
      {title: 'Шећер и кофеин, умерено', text: 'Ограничавање веома слатких пића или пића са кофеином може помоћи ка крају циклуса.'},
    ],
    warningTitle: 'Вреди пазити',
    lowHydrationSigns: [
      'Интензивна или необична жеђ',
      'Урин тамнији него обично',
      'Честа главобоља',
      'Умор без другог очигледног објашњења',
    ],
    section5Body: 'Неколико једноставних навика често је довољно да останеш хидратисана а да о томе ни не размишљаш:',
    practicalTips: [
      'Држи флашу воде надохват руке током дана',
      'Повежи чашу воде са навиком коју већ имаш (буђење, сваки оброк)',
      'Мешај биљне чајеве ако ти обична вода досади',
    ],
    section5Body2: 'Током физичке активности не заборави да пијеш пре, током и после вежбања да надокнадиш губитак знојењем.',
    compareTitle1: 'Уобичајено веровање',
    compareText1: '„Када пијем много, више сам надута.“',
    compareTitle2: 'У ствари обрнуто',
    compareText2: 'Добра хидратација помаже телу да задржава мање воде.',
    tipTitle: 'Добро је знати',
    tipText: 'Чајеви од ђумбира или камилице такође нуде умирујућу хидратацију током грчева.',
    summaryPoints: [
      'Добра хидратација помаже телу да задржава мање воде и смањује надутост.',
      'Циљај на око 1,5 до 2 литра дневно, нешто више током менструације.',
      'Чајеви од ђумбира или камилице такође могу умирити током грчева.',
      'Интензивну, упорну жеђ вреди споменути здравственом раднику.',
    ],
    disclaimerText: 'Информативни садржај. Овај чланак не замењује персонализовани медицински савет. При сумњи потражи смернице од здравственог радника.',
    shareMessage: 'Добра хидратација током циклуса — AWA',
  },
  hr: {
    badge: 'MENSTRUALNI CIKLUS • HIDRATACIJA',
    title: 'Ostani hidrirana\ntijekom ciklusa',
    metaDuration: '6 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Neintuitivno, ali istinito: dobra hidratacija pomaže tvom tijelu da zadržava manje vode tijekom ciklusa.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašto je hidratacija važna',
      'Potrebe kroz faze ciklusa',
      'Što piti iz dana u dan',
      'Znakovi nedovoljne hidratacije',
      'Praktični savjeti',
      'Česta pogrešna uvjerenja',
      'Ključne poruke',
    ],
    section1Body: 'Neintuitivno, ali istinito: dobra hidratacija pomaže tijelu da zadržava manje vode i smanjuje nadutost, osobito pred kraj ciklusa.',
    infoTitle: 'Dobro je znati',
    infoText: 'Kad tijelu nedostaje vode, sklono je pohraniti više vode iz predostrožnosti. Dovoljno pijenje mu, naprotiv, poručuje da može lakše otpuštati vodu.',
    section2Body: 'Tvoje potrebe za vodom općenito ostaju prilično stabilne, uz nekoliko nijansi ovisno o fazi:',
    phaseNeeds: [
      {title: 'Tijekom menstruacije', text: 'Malo više vode pomaže nadoknaditi gubitak tekućine i ograničiti nadutost.'},
      {title: 'Oko ovulacije', text: 'Potrebe ostaju stabilne; blagi porast tjelesne temperature može pojačati žeđ.'},
      {title: 'Predmenstrualna faza', text: 'Dobra hidratacija pomaže ograničiti osjećaj podbulosti koji se često javlja u tom razdoblju.'},
    ],
    section3Body: 'Ciljaj na oko 1,5 do 2 litre dnevno, nešto više tijekom menstruacije radi nadoknade izgubljene tekućine.',
    dailyDrinks: [
      {title: 'Voda, prije svega', text: 'Oko 1,5 do 2 litre dnevno, nešto više tijekom menstruacije.'},
      {title: 'Umirujući biljni čajevi', text: 'Đumbir ili kamilica nude blagu hidrataciju tijekom grčeva.'},
      {title: 'Šećer i kofein, umjereno', text: 'Ograničavanje vrlo zaslađenih ili kofeinskih pića može pomoći pred kraj ciklusa.'},
    ],
    warningTitle: 'Vrijedi pratiti',
    lowHydrationSigns: [
      'Intenzivna ili neuobičajena žeđ',
      'Mokraća tamnija nego obično',
      'Česte glavobolje',
      'Umor bez drugog očitog objašnjenja',
    ],
    section5Body: 'Nekoliko jednostavnih navika često je dovoljno da ostaneš hidrirana a da ni ne razmišljaš o tome:',
    practicalTips: [
      'Drži bocu vode na dohvat ruke tijekom dana',
      'Poveži čašu vode s navikom koju već imaš (buđenje, svaki obrok)',
      'Dodaj biljne napitke ako ti obična voda dosadi',
    ],
    section5Body2: 'Tijekom tjelesne aktivnosti ne zaboravi piti prije, tijekom i nakon vježbanja kako bi nadoknadila izgubljeno znojenjem.',
    compareTitle1: 'Uvriježeno mišljenje',
    compareText1: '„Ako puno pijem, više sam napuhnuta.“',
    compareTitle2: 'Zapravo suprotno',
    compareText2: 'Dobra hidratacija pomaže tijelu da zadržava manje vode.',
    tipTitle: 'Dobro je znati',
    tipText: 'Čajevi od đumbira ili kamilice također nude umirujuću hidrataciju tijekom grčeva.',
    summaryPoints: [
      'Dobra hidratacija pomaže tijelu da zadržava manje vode i smanjuje nadutost.',
      'Ciljaj na oko 1,5 do 2 litre dnevno, nešto više tijekom menstruacije.',
      'Čajevi od đumbira ili kamilice mogu pomoći i kod grčeva.',
      'Intenzivnu, dugotrajnu žeđ vrijedi spomenuti zdravstvenom djelatniku.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice zatraži savjet zdravstvenog djelatnika.',
    shareMessage: 'Ostani hidrirana tijekom ciklusa — AWA',
  },
  bs: {
    badge: 'MENSTRUALNI CIKLUS • HIDRATACIJA',
    title: 'Ostani hidrirana\ntijekom ciklusa',
    metaDuration: '6 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Neintuitivno, ali istinito: dobra hidratacija pomaže tvom tijelu da zadržava manje vode tokom ciklusa.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašta je hidratacija važna',
      'Potrebe kroz faze ciklusa',
      'Što piti iz dana u dan',
      'Znakovi nedovoljne hidratacije',
      'Praktični savjeti',
      'Česta pogrešna uvjerenja',
      'Ključne poruke',
    ],
    section1Body: 'Neintuitivno, ali istinito: dobra hidratacija pomaže tijelu da zadržava manje vode i smanjuje nadutost, osobito pred kraj ciklusa.',
    infoTitle: 'Dobro je znati',
    infoText: 'Kad tijelu nedostaje vode, sklono je pohraniti više vode iz predostrožnosti. Dovoljno pijenje mu, naprotiv, poručuje da može lakše otpuštati vodu.',
    section2Body: 'Tvoje potrebe za vodom općenito ostaju prilično stabilne, uz nekoliko nijansi ovisno o fazi:',
    phaseNeeds: [
      {title: 'Tokom menstruacije', text: 'Malo više vode pomaže nadoknaditi gubitak tekućine i ograničiti nadutost.'},
      {title: 'Oko ovulacije', text: 'Potrebe ostaju stabilne; blagi porast tjelesne temperature može pojačati žeđ.'},
      {title: 'Predmenstrualna faza', text: 'Dobra hidratacija pomaže ograničiti osjećaj podbulosti koji se često javlja u tom razdoblju.'},
    ],
    section3Body: 'Ciljaj na oko 1,5 do 2 litre dnevno, nešta više tokom menstruacije radi nadoknade izgubljene tekućine.',
    dailyDrinks: [
      {title: 'Voda, prije svega', text: 'Oko 1,5 do 2 litre dnevno, nešta više tokom menstruacije.'},
      {title: 'Umirujući biljni čajevi', text: 'Đumbir ili kamilica nude blagu hidrataciju tokom grčeva.'},
      {title: 'Šećer i kofein, umjereno', text: 'Ograničavanje vrlo zaslađenih ili kofeinskih pića može pomoći pred kraj ciklusa.'},
    ],
    warningTitle: 'Vrijedi pratiti',
    lowHydrationSigns: [
      'Intenzivna ili neuobičajena žeđ',
      'Mokraća tamnija nego obično',
      'Česte glavobolje',
      'Umor bez drugog očitog objašnjenja',
    ],
    section5Body: 'Nekoliko jednostavnih navika često je dovoljno da ostaneš hidrirana a da ni ne razmišljaš o tome:',
    practicalTips: [
      'Drži bocu vode na dohvat ruke tokom dana',
      'Poveži čašu vode s navikom koju već imaš (buđenje, svaki obrok)',
      'Dodaj biljne napitke ako ti obična voda dosadi',
    ],
    section5Body2: 'Tokom tjelesne aktivnosti ne zaboravi piti prije, tokom i nakon vježbanja kako bi nadoknadila izgubljeno znojenjem.',
    compareTitle1: 'Uvriježeno mišljenje',
    compareText1: '„Ako puno pijem, više sam napuhnuta.“',
    compareTitle2: 'Zapravo suprotno',
    compareText2: 'Dobra hidratacija pomaže tijelu da zadržava manje vode.',
    tipTitle: 'Dobro je znati',
    tipText: 'Čajevi od đumbira ili kamilice također nude umirujuću hidrataciju tokom grčeva.',
    summaryPoints: [
      'Dobra hidratacija pomaže tijelu da zadržava manje vode i smanjuje nadutost.',
      'Ciljaj na oko 1,5 do 2 litre dnevno, nešta više tokom menstruacije.',
      'Čajevi od đumbira ili kamilice mogu pomoći i kod grčeva.',
      'Intenzivnu, dugotrajnu žeđ vrijedi spomenuti zdravstvenom radniku.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice zatraži savjet zdravstvenog radnika.',
    shareMessage: 'Ostani hidrirana tokom ciklusa — AWA',
  },
  sl: {
    badge: 'MENSTRUALNI CIKEL • HIDRACIJA',
    title: 'Ostani hidrirana\nskozi cikel',
    metaDuration: '6 min branja',
    metaType: 'Članek',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Neintuitivno, a resnično: dobra hidracija pomaga tvojemu telesu, da skozi cikel zadržuje manj vode.',
    contentsTitle: 'V tem članku',
    topics: [
      'Zakaj je hidracija pomembna',
      'Potrebe skozi faze cikla',
      'Kaj piti iz dneva v dan',
      'Znaki nezadostne hidracije',
      'Praktični nasveti',
      'Pogosta napačna prepričanja',
      'Ključna sporočila',
    ],
    section1Body: 'Neintuitivno, a resnično: dobra hidracija pomaga telesu zadrževati manj vode in zmanjšuje napihnjenost, zlasti pred koncem cikla.',
    infoTitle: 'Vredno vedeti',
    infoText: 'Kadar telesu primanjkuje vode, jo je nagnjeno shranjevati več iz previdnosti. Dovolj pitja mu nasprotno sporoča, da lahko lažje sprošča vodo.',
    section2Body: 'Tvoje potrebe po vodi na splošno ostajajo kar stabilne, z nekaj niansami glede na fazo:',
    phaseNeeds: [
      {title: 'Med menstruacijo', text: 'Malo več vode pomaga nadomestiti izgubo tekočine in omejiti napihnjenost.'},
      {title: 'Okoli ovulacije', text: 'Potrebe ostajajo stabilne; rahel dvig telesne temperature lahko poveča žejo.'},
      {title: 'Predmenstrualna faza', text: 'Dobra hidracija pomaga omejiti občutek oteklosti, ki se pogosto pojavlja v tem obdobju.'},
    ],
    section3Body: 'Ciljaj na približno 1,5 do 2 litra na dan, nekoliko več med menstruacijo za nadomestitev izgubljene tekočine.',
    dailyDrinks: [
      {title: 'Voda, predvsem', text: 'Približno 1,5 do 2 litra na dan, nekoliko več med menstruacijo.'},
      {title: 'Pomirjujoči zeliščni čaji', text: 'Ingver ali kamilica nudita nežno hidracijo med krči.'},
      {title: 'Sladkor in kofein zmerno', text: 'Omejevanje zelo sladkanih ali kofeinskih pijač lahko pomaga pred koncem cikla.'},
    ],
    warningTitle: 'Vredno spremljati',
    lowHydrationSigns: [
      'Huda ali nenavadna žeja',
      'Seč temnejša kot običajno',
      'Pogoste glavobolje',
      'Utrujenost brez druge očitne razlage',
    ],
    section5Body: 'Nekaj preprostih navad je pogosto dovolj, da ostaneš hidrirana, ne da bi sploh razmišljala o tem:',
    practicalTips: [
      'Imej steklenico vode na dosegu roke čez dan',
      'Poveži kozarec vode z navado, ki jo že imaš (prebujanje, vsak obrok)',
      'Dodaj zeliščne napitke, če ti navadna voda postane dolgočasna',
    ],
    section5Body2: 'Med telesno dejavnostjo ne pozabi piti pred vadbo, med njo in po njej, da nadomestiš izgubo z znojenjem.',
    compareTitle1: 'Uveljavljeno prepričanje',
    compareText1: '„Če veliko pijem, sem bolj napihnjena.“',
    compareTitle2: 'V resnici nasprotno',
    compareText2: 'Dobra hidracija pomaga telesu zadrževati manj vode.',
    tipTitle: 'Vredno vedeti',
    tipText: 'Čaji iz ingverja ali kamilice nudijo tudi pomirjujočo hidracijo med krči.',
    summaryPoints: [
      'Dobra hidracija pomaga telesu zadrževati manj vode in zmanjšuje napihnjenost.',
      'Ciljaj na približno 1,5 do 2 litra na dan, nekoliko več med menstruacijo.',
      'Čaji iz ingverja ali kamilice lahko pomagajo tudi pri krčih.',
      'Hudo, dolgotrajno žejo je vredno omeniti zdravstvenemu delavcu.',
    ],
    disclaimerText: 'Informativna vsebina. Ta članek ne nadomešča osebnega zdravniškega nasveta. V primeru dvoma poišči nasvet zdravstvenega delavca.',
    shareMessage: 'Ostani hidrirana skozi cikel — AWA',
  },
  ne: {
    badge: 'मासिक चक्र • पानीको सेवन',
    title: 'आफ्नो चक्रभरि पर्याप्त\nपानी पिउँदै',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'अनौठो तर सत्य: राम्ररी पानी पिउँदा चक्रभरि तपाईंको शरीरले कम पानी रोक्न मद्दत गर्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'पानीको सेवन किन महत्त्वपूर्ण छ',
      'तपाईंको चक्रका चरणहरूमा आवश्यकता',
      'दैनिक के पिउने',
      'अपर्याप्त पानीको सेवनका संकेतहरू',
      'व्यावहारिक सुझावहरू',
      'सामान्य भ्रमहरू',
      'मुख्य कुराहरू',
    ],
    section1Body: 'अनौठो तर सत्य: राम्ररी पानी पिउँदा शरीरले कम पानी रोक्न मद्दत गर्छ र पेट फुल्ने कम हुन्छ, विशेष गरी चक्रको अन्त्यतिर।',
    infoTitle: 'जान्न लायक',
    infoText: 'शरीरमा पानीको कमी हुँदा, सावधानीका रूपमा यसले बढी पानी जम्मा गर्ने प्रवृत्ति राख्छ। पर्याप्त पिउँदा, उल्टो, पानी बढी सजिलै निकाल्न सकिन्छ भन्ने संकेत दिन्छ।',
    section2Body: 'तपाईंको पानीको आवश्यकता समग्रमा निकै स्थिर रहन्छ, चरणअनुसार केही सूक्ष्म भिन्नताहरूसहित:',
    phaseNeeds: [
      {title: 'महिनावारीको समयमा', text: 'अलिकति थप पानीले तरल पदार्थको क्षतिलाई सन्तुलन गर्न र पेट फुल्ने सीमित गर्न मद्दत गर्छ।'},
      {title: 'अण्डोत्सर्गको वरिपरि', text: 'आवश्यकता स्थिर रहन्छ; शरीरको तापक्रममा सानो वृद्धिले तिर्खा बढाउन सक्छ।'},
      {title: 'महिनावारीपूर्वको चरण', text: 'राम्रो पानीको सेवनले यस समयमा प्रायः महसुस हुने फुल्ने अनुभूति सीमित गर्न मद्दत गर्छ।'},
    ],
    section3Body: 'दिनमा करिब 1.5 देखि 2 लिटरको लक्ष्य राख्नुहोस्, तरल पदार्थको क्षति सन्तुलन गर्न महिनावारीमा अलिक बढी।',
    dailyDrinks: [
      {title: 'पहिले पानी, सबैभन्दा पहिले', text: 'दिनमा करिब 1.5 देखि 2 लिटर, महिनावारीमा अलिक बढी।'},
      {title: 'शान्त पार्ने जडीबुटीको चिया', text: 'अदुवा वा क्यामोमाइलले ऐंठनको समयमा कोमल पानीको आपूर्ति दिन्छ।'},
      {title: 'चिनी र क्याफिन, मध्यम मात्रामा', text: 'निकै गुलियो वा क्याफिनयुक्त पेय सीमित गर्नाले चक्रको अन्त्यतिर मद्दत गर्न सक्छ।'},
    ],
    warningTitle: 'नजर राख्न लायक',
    lowHydrationSigns: [
      'तीव्र वा असामान्य तिर्खा',
      'सामान्यभन्दा गाढा पिसाब',
      'बारम्बार टाउको दुखाइ',
      'अरू कुनै स्पष्ट व्याख्याबिनाको थकान',
    ],
    section5Body: 'सोचेर नै नसोची पानी पिइराख्न केही सरल बानीहरू प्रायः पर्याप्त हुन्छन्:',
    practicalTips: [
      'दिनभर पानीको बोतल हातको पहुँचमा राख्नुहोस्',
      'एक गिलास पानीलाई तपाईंको पहिलेकै बानी (ब्युँझँदा, हरेक खाना) सँग जोड्नुहोस्',
      'सादा पानी निरस भए जडीबुटीको झोल मिसाउनुहोस्',
    ],
    section5Body2: 'शारीरिक गतिविधिको समयमा, पसिनाको क्षति पूर्ति गर्न व्यायामअघि, बेला र पछि पिउन सम्झनुहोस्।',
    compareTitle1: 'सामान्य विश्वास',
    compareText1: '"धेरै पिउँदा म बढी फुल्छु।"',
    compareTitle2: 'वास्तवमा उल्टो',
    compareText2: 'राम्रो पानीको सेवनले शरीरलाई कम पानी रोक्न मद्दत गर्छ।',
    tipTitle: 'जान्न लायक',
    tipText: 'अदुवा वा क्यामोमाइलको चियाले ऐंठनको समयमा शान्त पार्ने पानीको आपूर्ति पनि दिन्छ।',
    summaryPoints: [
      'राम्ररी पानी पिउँदा शरीरले कम पानी रोक्न मद्दत गर्छ र पेट फुल्ने कम हुन्छ।',
      'दिनमा करिब 1.5 देखि 2 लिटरको लक्ष्य राख्नुहोस्, महिनावारीमा अलिक बढी।',
      'अदुवा वा क्यामोमाइलको चियाले ऐंठनको समयमा शान्त पार्न पनि सक्छ।',
      'तीव्र, लगातार तिर्खा स्वास्थ्यकर्मीलाई बताउन लायक हुन्छ।',
    ],
    disclaimerText: 'जानकारीमूलक सामग्री। यो लेखले व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन। शङ्का भए स्वास्थ्यकर्मीसँग मार्गदर्शन लिनुहोस्।',
    shareMessage: 'आफ्नो चक्रभरि पर्याप्त पानी पिउँदै — AWA',
  },
  si: {
    badge: 'ඔසප් චක්‍රය • ජල සමතුලිතතාව',
    title: 'ඔබේ චක්‍රය පුරා\nජලය පානය කර සිටීම',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'ලිපිය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ප්‍රතිසහජාත නමුත් සත්‍ය: හොඳින් ජලය පානය කර සිටීම ඔබේ චක්‍රය පුරා ඔබේ ශරීරය අඩුවෙන් ජලය රඳවා ගැනීමට උපකාරී වේ.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ජලය පානය වැදගත් වන්නේ ඇයි',
      'ඔබේ චක්‍රයේ අවධි හරහා අවශ්‍යතා',
      'දිනපතා පානය කළ යුත්තේ කුමක්ද',
      'ප්‍රමාණවත් නොවන ජල සමතුලිතතාවයේ සලකුණු',
      'ප්‍රායෝගික ඉඟි',
      'පොදු වැරදි වැටහීම්',
      'ප්‍රධාන කරුණු',
    ],
    section1Body: 'ප්‍රතිසහජාත නමුත් සත්‍ය: හොඳින් ජලය පානය කර සිටීම ශරීරය අඩුවෙන් ජලය රඳවා ගැනීමට සහ, විශේෂයෙන් චක්‍රයේ අවසානය දෙසට, බඩ ඉදිමීම අඩු කිරීමට උපකාරී වේ.',
    infoTitle: 'දැනගත යුතු දේ',
    infoText: 'ශරීරයට ජලය ඌනතාවයක් ඇති විට, එය ආරක්ෂිත පියවරක් ලෙස වැඩිපුර ගබඩා කිරීමට නැඹුරු වේ. ප්‍රමාණවත් ලෙස පානය කිරීම, ඊට ප්‍රතිවිරුද්ධව, ජලය පහසුවෙන් මුදා හැරිය හැකි බව ශරීරයට කියයි.',
    section2Body: 'ඔබේ ජල අවශ්‍යතා සමස්තයක් ලෙස තරමක් ස්ථාවරව පවතින අතර, අවධිය අනුව සුළු විචලනයන් කිහිපයක් ඇත:',
    phaseNeeds: [
      {title: 'ඔබේ ඔසප් කාලයේ', text: 'ටිකක් අමතර ජලය තරල අහිමි වීම පියවා ගැනීමට සහ බඩ ඉදිමීම සීමා කිරීමට උපකාරී වේ.'},
      {title: 'ඩිම්බ මෝචනය වටා', text: 'අවශ්‍යතා ස්ථාවරව පවතී; ශරීර උෂ්ණත්වයේ සුළු ඉහළ යාමක් පිපාසය වැඩි කළ හැක.'},
      {title: 'ඔසප්වලට පෙර අවධිය', text: 'හොඳ ජල සමතුලිතතාව මෙම කාලයේ බොහෝ විට දැනෙන ඉදිමුණු බව සීමා කිරීමට උපකාරී වේ.'},
    ],
    section3Body: 'දිනකට ලීටර් 1.5 සිට 2 දක්වා ඉලක්ක කරන්න, තරල අහිමි වීම පියවා ගැනීමට ඔබේ ඔසප් කාලයේදී ටිකක් වැඩියෙන්.',
    dailyDrinks: [
      {title: 'පළමුවෙන්ම ජලය', text: 'දිනකට ලීටර් 1.5 සිට 2 දක්වා, ඔබේ ඔසප් කාලයේදී ටිකක් වැඩියෙන්.'},
      {title: 'සැනසිලිදායක ඖෂධීය තේ', text: 'ඉඟුරු හෝ චමෝමයිල් මාංශ පේශි සංකෝචන අතරතුර මෘදු ජලය සපයයි.'},
      {title: 'සීනි සහ කැෆේන්, මධ්‍යස්ථව', text: 'ඉතා සීනි සහිත හෝ කැෆේන් සහිත පාන සීමා කිරීම චක්‍රයේ අවසානය දෙසට උපකාරී විය හැක.'},
    ],
    warningTitle: 'අවධානයෙන් සිටීම වටී',
    lowHydrationSigns: [
      'දැඩි හෝ අසාමාන්‍ය පිපාසය',
      'සුපුරුදුට වඩා තද මුත්‍රා',
      'නිතර හිසරදය',
      'වෙනත් පැහැදිලි පැහැදිලි කිරීමක් නොමැති වෙහෙස',
    ],
    section5Body: 'ඒ ගැන සිතීමටවත් අවශ්‍ය නොවී ජලය පානය කර සිටීමට සරල පුරුදු කිහිපයක් බොහෝ විට ප්‍රමාණවත්:',
    practicalTips: [
      'දවස පුරා ජල බෝතලයක් ළඟ තබාගන්න',
      'ජල වීදුරුවක් ඔබට දැනටමත් ඇති පුරුද්දක් සමඟ ඒකාබද්ධ කරන්න (අවදි වීම, සෑම ආහාර වේලකම)',
      'සාමාන්‍ය ජලය හිරිහැර වන්නේ නම් ඖෂධීය පානයන් මිශ්‍ර කරන්න',
    ],
    section5Body2: 'ශාරීරික ක්‍රියාකාරකම් අතරතුර, දහඩිය අහිමි වීම පියවා ගැනීමට ව්‍යායාමයට පෙර, අතරතුර සහ පසු පානය කිරීමට මතක තබාගන්න.',
    compareTitle1: 'පොදු විශ්වාසය',
    compareText1: '"වැඩියෙන් පානය කිරීමෙන් මට වඩා බඩ ඉදිමෙනවා."',
    compareTitle2: 'ඇත්තටම ප්‍රතිවිරුද්ධයි',
    compareText2: 'හොඳ ජල සමතුලිතතාව ශරීරය අඩුවෙන් ජලය රඳවා ගැනීමට උපකාරී වේ.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText: 'ඉඟුරු හෝ චමෝමයිල් තේ මාංශ පේශි සංකෝචන අතරතුර සැනසිලිදායක ජලයද සපයයි.',
    summaryPoints: [
      'හොඳින් ජලය පානය කර සිටීම ශරීරය අඩුවෙන් ජලය රඳවා ගැනීමට සහ බඩ ඉදිමීම අඩු කිරීමට උපකාරී වේ.',
      'දිනකට ලීටර් 1.5 සිට 2 දක්වා ඉලක්ක කරන්න, ඔබේ ඔසප් කාලයේදී ටිකක් වැඩියෙන්.',
      'ඉඟුරු හෝ චමෝමයිල් තේ මාංශ පේශි සංකෝචන අතරතුරද සැනසිල්ලක් ලබා දිය හැක.',
      'දැඩි, දිගටම පවතින පිපාසය සෞඛ්‍ය වෘත්තිකයෙකුට සඳහන් කිරීම වටී.',
    ],
    disclaimerText: 'තොරතුරු අන්තර්ගතයකි. මෙම ලිපිය පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී. සැකයක් ඇත්නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් මඟපෙන්වීමක් ලබා ගන්න.',
    shareMessage: 'ඔබේ චක්‍රය පුරා ජලය පානය කර සිටීම — AWA',
  },
  th: {
    badge: 'รอบเดือน • การดื่มน้ำ',
    title: 'ดื่มน้ำให้เพียงพอ\nตลอดรอบเดือนของคุณ',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'บทความ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ฟังดูขัดความรู้สึกแต่เป็นจริง: การดื่มน้ำให้เพียงพอช่วยให้ร่างกายกักเก็บน้ำน้อยลงตลอดรอบเดือน',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำไมการดื่มน้ำจึงสำคัญ',
      'ความต้องการในแต่ละระยะของรอบเดือน',
      'ควรดื่มอะไรในแต่ละวัน',
      'สัญญาณของการดื่มน้ำไม่เพียงพอ',
      'เคล็ดลับเชิงปฏิบัติ',
      'ความเข้าใจผิดที่พบบ่อย',
      'ประเด็นสำคัญ',
    ],
    section1Body: 'ฟังดูขัดความรู้สึกแต่เป็นจริง: การดื่มน้ำให้เพียงพอช่วยให้ร่างกายกักเก็บน้ำน้อยลงและลดอาการท้องอืด โดยเฉพาะในช่วงปลายรอบเดือน',
    infoTitle: 'ควรรู้',
    infoText: 'เมื่อร่างกายขาดน้ำ มักจะเก็บน้ำไว้มากขึ้นเพื่อป้องกันไว้ก่อน การดื่มน้ำให้เพียงพอจะบอกร่างกายในทางตรงข้ามว่าปล่อยน้ำออกได้ง่ายขึ้น',
    section2Body: 'ความต้องการน้ำของคุณค่อนข้างคงที่โดยรวม โดยมีความแตกต่างเล็กน้อยตามระยะ:',
    phaseNeeds: [
      {title: 'ระหว่างมีประจำเดือน', text: 'น้ำเพิ่มเล็กน้อยช่วยชดเชยการสูญเสียของเหลวและจำกัดอาการท้องอืด'},
      {title: 'ช่วงใกล้ตกไข่', text: 'ความต้องการคงที่ อุณหภูมิร่างกายที่สูงขึ้นเล็กน้อยอาจทำให้กระหายน้ำมากขึ้น'},
      {title: 'ระยะก่อนมีประจำเดือน', text: 'การดื่มน้ำที่ดีช่วยจำกัดความรู้สึกบวมที่มักเกิดในช่วงนี้'},
    ],
    section3Body: 'ตั้งเป้าประมาณ 1.5 ถึง 2 ลิตรต่อวัน และมากขึ้นเล็กน้อยระหว่างมีประจำเดือนเพื่อชดเชยการสูญเสียของเหลว',
    dailyDrinks: [
      {title: 'น้ำเป็นอันดับแรก', text: 'ประมาณ 1.5 ถึง 2 ลิตรต่อวัน และมากขึ้นเล็กน้อยระหว่างมีประจำเดือน'},
      {title: 'ชาสมุนไพรที่ช่วยผ่อนคลาย', text: 'ขิงหรือคาโมมายล์ให้ความชุ่มชื้นอย่างอ่อนโยนเมื่อมีอาการปวดเกร็ง'},
      {title: 'น้ำตาลและคาเฟอีน ในปริมาณพอเหมาะ', text: 'การจำกัดเครื่องดื่มที่หวานมากหรือมีคาเฟอีนช่วยได้ในช่วงปลายรอบเดือน'},
    ],
    warningTitle: 'ควรเฝ้าสังเกต',
    lowHydrationSigns: [
      'กระหายน้ำรุนแรงหรือผิดปกติ',
      'ปัสสาวะสีเข้มกว่าปกติ',
      'ปวดหัวบ่อย',
      'เหนื่อยล้าโดยไม่มีคำอธิบายอื่นที่ชัดเจน',
    ],
    section5Body: 'นิสัยง่าย ๆ ไม่กี่อย่างมักเพียงพอที่จะดื่มน้ำได้เพียงพอโดยไม่ต้องคิด:',
    practicalTips: [
      'วางขวดน้ำไว้ใกล้มือตลอดทั้งวัน',
      'จับคู่การดื่มน้ำหนึ่งแก้วกับนิสัยที่คุณมีอยู่แล้ว (ตื่นนอน ทุกมื้ออาหาร)',
      'ผสมชาสมุนไพรหากน้ำเปล่าน่าเบื่อ',
    ],
    section5Body2: 'ระหว่างทำกิจกรรมทางกาย อย่าลืมดื่มก่อน ระหว่าง และหลังออกกำลังกายเพื่อชดเชยเหงื่อที่เสียไป',
    compareTitle1: 'ความเชื่อทั่วไป',
    compareText1: '"ดื่มน้ำมากทำให้ฉันท้องอืดมากขึ้น"',
    compareTitle2: 'ความจริงกลับตรงกันข้าม',
    compareText2: 'การดื่มน้ำที่ดีช่วยให้ร่างกายกักเก็บน้ำน้อยลง',
    tipTitle: 'ควรรู้',
    tipText: 'ชาขิงหรือชาคาโมมายล์ยังให้ความชุ่มชื้นที่ผ่อนคลายเมื่อมีอาการปวดเกร็ง',
    summaryPoints: [
      'การดื่มน้ำให้เพียงพอช่วยให้ร่างกายกักเก็บน้ำน้อยลงและลดอาการท้องอืด',
      'ตั้งเป้าประมาณ 1.5 ถึง 2 ลิตรต่อวัน และมากขึ้นเล็กน้อยระหว่างมีประจำเดือน',
      'ชาขิงหรือชาคาโมมายล์ยังช่วยผ่อนคลายเมื่อมีอาการปวดเกร็ง',
      'อาการกระหายน้ำรุนแรงและต่อเนื่องควรแจ้งบุคลากรทางการแพทย์',
    ],
    disclaimerText: 'เนื้อหาเพื่อให้ข้อมูล บทความนี้ไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล หากมีข้อสงสัย โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
    shareMessage: 'ดื่มน้ำให้เพียงพอตลอดรอบเดือนของคุณ — AWA',
  },
  vi: {
    badge: 'CHU KỲ KINH NGUYỆT • UỐNG NƯỚC',
    title: 'Uống đủ nước\ntrong suốt chu kỳ',
    metaDuration: '6 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Nghe có vẻ ngược đời nhưng đúng: uống đủ nước giúp cơ thể giữ lại ít nước hơn trong suốt chu kỳ.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Tại sao uống nước quan trọng',
      'Nhu cầu qua các giai đoạn của chu kỳ',
      'Nên uống gì mỗi ngày',
      'Dấu hiệu thiếu nước',
      'Mẹo thực tế',
      'Những quan niệm sai thường gặp',
      'Những điểm chính cần nhớ',
    ],
    section1Body: 'Nghe có vẻ ngược đời nhưng đúng: uống đủ nước giúp cơ thể giữ lại ít nước hơn và giảm đầy hơi, đặc biệt về cuối chu kỳ.',
    infoTitle: 'Nên biết',
    infoText: 'Khi cơ thể thiếu nước, nó có xu hướng tích trữ nhiều nước hơn để phòng ngừa. Ngược lại, uống đủ nước báo cho cơ thể biết rằng nó có thể thải nước dễ dàng hơn.',
    section2Body: 'Nhu cầu nước của bạn nhìn chung khá ổn định, với một vài sắc thái tùy theo giai đoạn:',
    phaseNeeds: [
      {title: 'Trong kỳ kinh', text: 'Uống thêm một chút nước giúp bù lượng dịch mất đi và hạn chế đầy hơi.'},
      {title: 'Quanh thời điểm rụng trứng', text: 'Nhu cầu ổn định; thân nhiệt tăng nhẹ có thể làm bạn khát hơn.'},
      {title: 'Giai đoạn tiền kinh nguyệt', text: 'Uống đủ nước giúp hạn chế cảm giác phù nề thường gặp trong thời gian này.'},
    ],
    section3Body: 'Hãy hướng đến khoảng 1,5 đến 2 lít mỗi ngày, nhiều hơn một chút trong kỳ kinh để bù lượng dịch mất đi.',
    dailyDrinks: [
      {title: 'Trước hết là nước lọc', text: 'Khoảng 1,5 đến 2 lít mỗi ngày, nhiều hơn một chút trong kỳ kinh.'},
      {title: 'Trà thảo mộc dịu nhẹ', text: 'Gừng hoặc hoa cúc La Mã cung cấp nước nhẹ nhàng khi đau bụng kinh.'},
      {title: 'Đường và caffeine, ở mức vừa phải', text: 'Hạn chế đồ uống rất ngọt hoặc có nhiều caffeine có thể hữu ích về cuối chu kỳ.'},
    ],
    warningTitle: 'Điều đáng để ý',
    lowHydrationSigns: [
      'Khát dữ dội hoặc bất thường',
      'Nước tiểu sẫm màu hơn bình thường',
      'Đau đầu thường xuyên',
      'Mệt mỏi không có lời giải thích rõ ràng nào khác',
    ],
    section5Body: 'Một vài thói quen đơn giản thường đã đủ để giữ đủ nước mà không cần nghĩ đến:',
    practicalTips: [
      'Để chai nước trong tầm tay suốt cả ngày',
      'Kết hợp một ly nước với thói quen bạn đã có (khi thức dậy, mỗi bữa ăn)',
      'Thêm các loại trà thảo mộc nếu nước lọc trở nên nhàm chán',
    ],
    section5Body2: 'Khi hoạt động thể chất, hãy nhớ uống trước, trong và sau khi tập để bù lượng mồ hôi đã mất.',
    compareTitle1: 'Quan niệm phổ biến',
    compareText1: '"Uống nhiều nước làm tôi đầy hơi hơn."',
    compareTitle2: 'Thực ra thì ngược lại',
    compareText2: 'Uống đủ nước giúp cơ thể giữ lại ít nước hơn.',
    tipTitle: 'Nên biết',
    tipText: 'Trà gừng hoặc hoa cúc La Mã cũng cung cấp nước dịu nhẹ khi đau bụng kinh.',
    summaryPoints: [
      'Uống đủ nước giúp cơ thể giữ lại ít nước hơn và giảm đầy hơi.',
      'Hãy hướng đến khoảng 1,5 đến 2 lít mỗi ngày, nhiều hơn một chút trong kỳ kinh.',
      'Trà gừng hoặc hoa cúc La Mã cũng có thể làm dịu khi đau bụng kinh.',
      'Cơn khát dữ dội, kéo dài đáng để trao đổi với nhân viên y tế.',
    ],
    disclaimerText: 'Nội dung mang tính thông tin. Bài viết này không thay thế lời khuyên y khoa cá nhân hóa. Nếu có nghi ngờ, hãy tìm hướng dẫn từ nhân viên y tế.',
    shareMessage: 'Uống đủ nước trong suốt chu kỳ — AWA',
  },
  uz: {
    badge: 'HAYZ SIKLI • SUV BALANSI',
    title: 'Sikl davomida\nsuv balansini saqlash',
    metaDuration: '6 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Kutilmagan, ammo haqiqat: suv balansini yaxshi saqlash tanangizning sikl davomida kamroq suv ushlab turishiga yordam beradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Suv balansi nima uchun muhim',
      'Sikl bosqichlari boʻyicha ehtiyoj',
      'Kundalik nimalar ichish kerak',
      'Suv yetishmasligi belgilari',
      'Amaliy maslahatlar',
      'Keng tarqalgan yanglish tushunchalar',
      'Asosiy xulosalar',
    ],
    section1Body: 'Kutilmagan, ammo haqiqat: suv balansini yaxshi saqlash tananing kamroq suv ushlab turishiga va shishishni kamaytirishga yordam beradi, ayniqsa sikl oxirida.',
    infoTitle: 'Bilish foydali',
    infoText: 'Tana suv yetishmaganda, ehtiyot chorasi sifatida uni koʻproq toʻplashga moyil boʻladi. Yetarli ichish esa, aksincha, suvni osonroq chiqarib yuborish mumkinligini bildiradi.',
    section2Body: 'Suvga ehtiyojingiz umuman ancha barqaror, bosqichga qarab ozgina nozikliklar bilan:',
    phaseNeeds: [
      {title: 'Hayz paytida', text: 'Biroz koʻproq suv suyuqlik yoʻqotilishini qoplashga va shishishni cheklashga yordam beradi.'},
      {title: 'Ovulyatsiya atrofida', text: 'Ehtiyoj barqaror qoladi; tana haroratining ozgina koʻtarilishi chanqoqni oshirishi mumkin.'},
      {title: 'Hayz oldi bosqichi', text: 'Yaxshi suv balansi bu davrda koʻp sezilgan shishinqirash hissini cheklashga yordam beradi.'},
    ],
    section3Body: 'Kuniga taxminan 1,5 litrdan 2 litrgacha ichishga intiling, hayz paytida suyuqlik yoʻqotilishini qoplash uchun biroz koʻproq.',
    dailyDrinks: [
      {title: 'Avvalo suv', text: 'Kuniga taxminan 1,5 litrdan 2 litrgacha, hayz paytida biroz koʻproq.'},
      {title: 'Tinchlantiruvchi oʻsimlik choylari', text: 'Zanjabil yoki romashka choyi qisqarishlar paytida muloyim suv balansini taʼminlaydi.'},
      {title: 'Shakar va kofein — meʼyorida', text: 'Juda shirin yoki kofeinli ichimliklarni cheklash sikl oxirida yordam berishi mumkin.'},
    ],
    warningTitle: 'Kuzatib turishga arziydi',
    lowHydrationSigns: [
      'Kuchli yoki odatdan tashqari chanqoq',
      'Odatdagidan toʻqroq siydik',
      'Tez-tez bosh ogʻrigʻi',
      'Boshqa aniq izohsiz charchoq',
    ],
    section5Body: 'Suv balansini oʻylamasdan saqlash uchun koʻpincha bir nechta oddiy odat yetarli:',
    practicalTips: [
      'Kun davomida suv shishasini qoʻl ostida saqlang',
      'Bir stakan suvni allaqachon mavjud odatingiz (uygʻonish, har bir ovqat) bilan bogʻlang',
      'Oddiy suv zerikarli boʻlsa, oʻsimlik damlamalarini qoʻshing',
    ],
    section5Body2: 'Jismoniy faollik paytida terlash yoʻqotilishini qoplash uchun mashqdan oldin, mashq paytida va undan keyin ichishni unutmang.',
    compareTitle1: 'Keng tarqalgan fikr',
    compareText1: '“Koʻp ichsam, koʻproq shishaman.”',
    compareTitle2: 'Aslida aksincha',
    compareText2: 'Yaxshi suv balansi tananing kamroq suv ushlab turishiga yordam beradi.',
    tipTitle: 'Bilish foydali',
    tipText: 'Zanjabil yoki romashka choylari qisqarishlar paytida ham tinchlantiruvchi suv balansini taʼminlaydi.',
    summaryPoints: [
      'Suv balansini yaxshi saqlash tananing kamroq suv ushlab turishiga va shishishni kamaytirishga yordam beradi.',
      'Kuniga taxminan 1,5 litrdan 2 litrgacha ichishga intiling, hayz paytida biroz koʻproq.',
      'Zanjabil yoki romashka choylari qisqarishlar paytida ham yengillik berishi mumkin.',
      'Kuchli, doimiy chanqoq haqida sogʻliqni saqlash mutaxassisiga aytib qoʻyishga arziydi.',
    ],
    disclaimerText: 'Maʼlumot uchun kontent. Bu maqola shaxsiy tibbiy maslahatni almashtirmaydi. Shubha boʻlsa, sogʻliqni saqlash mutaxassisidan yoʻl-yoʻriq soʻrang.',
    shareMessage: 'Sikl davomida suv balansini saqlash — AWA',
  },
  az: {
    badge: 'MENSTRUAL DÖVR • HİDRATASİYA',
    title: 'Dövrünüz boyu\nhidratasiyanı qoruyun',
    metaDuration: '6 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Qeyri-adi, lakin doğrudur: yaxşı hidratasiya bədənin dövr boyu daha az su saxlamasına kömək edir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Hidratasiya nə üçün vacibdir',
      'Dövrünüzün fazaları üzrə ehtiyaclar',
      'Gündəlik nə içmək lazımdır',
      'Kifayət qədər hidratasiya olmamasının əlamətləri',
      'Praktik məsləhətlər',
      'Yanlış təsəvvürlər',
      'Əsas nəticələr',
    ],
    section1Body: 'Qeyri-adi, lakin doğrudur: yaxşı hidratasiya bədənin daha az su saxlamasına və şişkinliyi azaltmağa kömək edir, xüsusilə dövrün sonuna doğru.',
    infoTitle: 'Bilmək faydalıdır',
    infoText: 'Bədəndə su çatışmayanda o, ehtiyat tədbiri olaraq onu daha çox saxlamağa meyl edir. Kifayət qədər içmək isə ona əksinə, suyu daha asan ifraz edə biləcəyini bildirir.',
    section2Body: 'Su ehtiyacınız ümumilikdə kifayət qədər sabit qalır, fazadan asılı olaraq bəzi nüanslarla:',
    phaseNeeds: [
      {title: 'Aybaşı zamanı', text: 'Bir az əlavə su maye itkisini kompensasiya etməyə və şişkinliyi məhdudlaşdırmağa kömək edir.'},
      {title: 'Ovulyasiya ətrafında', text: 'Ehtiyaclar sabit qalır; bədən temperaturunun yüngül yüksəlməsi susuzluğu artıra bilər.'},
      {title: 'Premenstrual faza', text: 'Yaxşı hidratasiya bu dövrdə tez-tez hiss olunan şişmə hissini məhdudlaşdırmağa kömək edir.'},
    ],
    section3Body: 'Gündə təxminən 1,5–2 litr hədəfləyin, itirilən mayeni kompensasiya etmək üçün aybaşı zamanı bir az daha çox.',
    dailyDrinks: [
      {title: 'Əvvəlcə su', text: 'Gündə təxminən 1,5–2 litr, aybaşı zamanı bir az daha çox.'},
      {title: 'Sakitləşdirici bitki çayları', text: 'Zəncəfil və ya çobanyastığı qıcolmalar zamanı mülayim hidratasiya təmin edir.'},
      {title: 'Şəkər və kofeyn — ölçülü şəkildə', text: 'Çox şirin və ya kofeinli içkiləri məhdudlaşdırmaq dövrün sonuna doğru kömək edə bilər.'},
    ],
    warningTitle: 'Diqqət etməyə dəyər',
    lowHydrationSigns: [
      'Güclü və ya qeyri-adi susuzluq',
      'Adidən daha tünd sidik',
      'Tez-tez baş ağrıları',
      'Başqa aşkar izahı olmayan yorğunluq',
    ],
    section5Body: 'Bir neçə sadə vərdiş çox vaxt bu barədə düşünmədən hidratasiyanı qorumaq üçün kifayətdir:',
    practicalTips: [
      'Gün boyu əlinizin altında su şüşəsi saxlayın',
      'Bir stəkan suyu artıq olan vərdişlə (oyanma, hər yemək) birləşdirin',
      'Adi su darıxdırıcı olarsa, bitki dəmlənmələri ilə növbələşdirin',
    ],
    section5Body2: 'Fiziki fəaliyyət zamanı tər itkisini kompensasiya etmək üçün məşqdən əvvəl, məşq zamanı və məşqdən sonra içməyi unutmayın.',
    compareTitle1: 'Geniş yayılmış inanc',
    compareText1: '"Çox içmək məni daha çox şişirdir."',
    compareTitle2: 'Əslində tam əksinə',
    compareText2: 'Yaxşı hidratasiya bədənin daha az su saxlamasına kömək edir.',
    tipTitle: 'Bilmək faydalıdır',
    tipText: 'Zəncəfil və ya çobanyastığı çayları qıcolmalar zamanı da sakitləşdirici hidratasiya təmin edir.',
    summaryPoints: [
      'Yaxşı hidratasiya bədənin daha az su saxlamasına və şişkinliyi azaltmağa kömək edir.',
      'Gündə təxminən 1,5–2 litr hədəfləyin, aybaşı zamanı bir az daha çox.',
      'Zəncəfil və ya çobanyastığı çayları qıcolmalar zamanı da sakitləşdirə bilər.',
      'Güclü, davamlı susuzluq barədə tibb işçisinə demək lazımdır.',
    ],
    disclaimerText: 'Məlumat xarakterli məzmun. Bu məqalə fərdi tibbi məsləhəti əvəz etmir. Şübhə olarsa, tibb işçisindən məsləhət alın.',
    shareMessage: 'Dövrünüz boyu hidratasiyanı qoruyun — AWA',
  },
  ka: {
    badge: 'მენსტრუაციული ციკლი • ჰიდრატაცია',
    title: 'კარგი ჰიდრატაცია\nციკლის განმავლობაში',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ლოგიკის საწინააღმდეგოა, მაგრამ მართალია: კარგი ჰიდრატაცია გეხმარებათ, რომ თქვენმა სხეულმა ციკლის განმავლობაში ნაკლები წყალი შეინარჩუნოს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რატომ არის ჰიდრატაცია მნიშვნელოვანი',
      'საჭიროებები ციკლის ფაზების მიხედვით',
      'რა დავლიოთ ყოველდღიურად',
      'არასაკმარისი ჰიდრატაციის ნიშნები',
      'პრაქტიკული რჩევები',
      'გავრცელებული მცდარი წარმოდგენები',
      'მთავარი დასკვნები',
    ],
    section1Body: 'ლოგიკის საწინააღმდეგოა, მაგრამ მართალია: კარგი ჰიდრატაცია სხეულს ეხმარება ნაკლები წყლის შენარჩუნებაში და ამცირებს შებერვას, განსაკუთრებით ციკლის ბოლოს.',
    infoTitle: 'კარგია ვიცოდეთ',
    infoText: 'როცა სხეულს წყალი აკლია, ის სიფრთხილის მიზნით უფრო მეტს ინახავს. საკმარისი წყლის დალევა, პირიქით, ეუბნება, რომ წყლის გამოყოფა უფრო ადვილად შეუძლია.',
    section2Body: 'თქვენი წყლის საჭიროება საერთო ჯამში საკმაოდ სტაბილური რჩება, ფაზის მიხედვით რამდენიმე ნიუანსით:',
    phaseNeeds: [
      {title: 'მენსტრუაციის დროს', text: 'ცოტა დამატებითი წყალი სითხის დანაკარგის კომპენსაციასა და შებერვის შეზღუდვაში გეხმარებათ.'},
      {title: 'ოვულაციის გარშემო', text: 'საჭიროებები სტაბილური რჩება; სხეულის ტემპერატურის მცირე მატებამ წყურვილი შეიძლება გაზარდოს.'},
      {title: 'მენსტრუაციამდელი ფაზა', text: 'კარგი ჰიდრატაცია ამ დროს ხშირად შეგრძნებული შებერილობის შეგრძნების შემცირებაში გეხმარებათ.'},
    ],
    section3Body: 'ეცადეთ დღეში დაახლოებით 1,5-დან 2 ლიტრამდე დალიოთ, მენსტრუაციის დროს ცოტა მეტი, სითხის დანაკარგის კომპენსაციისთვის.',
    dailyDrinks: [
      {title: 'წყალი, პირველ რიგში', text: 'დღეში დაახლოებით 1,5-დან 2 ლიტრამდე, მენსტრუაციის დროს ცოტა მეტი.'},
      {title: 'დამამშვიდებელი ბალახის ჩაები', text: 'ჯანჯაფილი ან გვირილა სპაზმების დროს რბილ ჰიდრატაციას გვთავაზობს.'},
      {title: 'შაქარი და კოფეინი, ზომიერად', text: 'ძალიან ტკბილი ან კოფეინიანი სასმელების შეზღუდვამ შეიძლება ციკლის ბოლოს უშველოს.'},
    ],
    warningTitle: 'ყურადღება მიაქციეთ',
    lowHydrationSigns: [
      'ინტენსიური ან უჩვეულო წყურვილი',
      'ჩვეულებრივზე მუქი შარდი',
      'ხშირი თავის ტკივილი',
      'დაღლილობა სხვა აშკარა ახსნის გარეშე',
    ],
    section5Body: 'რამდენიმე მარტივი ჩვევა ხშირად საკმარისია იმისთვის, რომ ჰიდრატაცია ფიქრის გარეშე შეინარჩუნოთ:',
    practicalTips: [
      'წყლის ბოთლი მთელი დღის განმავლობაში ხელმისაწვდომ ადგილას გქონდეთ',
      'ჭიქა წყალი უკვე არსებულ ჩვევას დააკავშირეთ (გაღვიძება, თითოეული კვება)',
      'თუ უბრალო წყალი მოგბეზრდათ, ბალახის ნაყენები დაამატეთ',
    ],
    section5Body2: 'ფიზიკური აქტივობის დროს გახსოვდეთ, რომ ვარჯიშამდე, ვარჯიშის დროს და მის შემდეგ დალიოთ, ოფლით დაკარგული სითხის შესავსებად.',
    compareTitle1: 'გავრცელებული რწმენა',
    compareText1: '„ბევრის დალევა უფრო მაბერავს.“',
    compareTitle2: 'სინამდვილეში პირიქითაა',
    compareText2: 'კარგი ჰიდრატაცია სხეულს ეხმარება ნაკლები წყლის შენარჩუნებაში.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText: 'ჯანჯაფილის ან გვირილის ჩაები სპაზმების დროს ასევე დამამშვიდებელ ჰიდრატაციას გვთავაზობს.',
    summaryPoints: [
      'კარგი ჰიდრატაცია სხეულს ეხმარება ნაკლები წყლის შენარჩუნებაში და ამცირებს შებერვას.',
      'ეცადეთ დღეში დაახლოებით 1,5-დან 2 ლიტრამდე დალიოთ, მენსტრუაციის დროს ცოტა მეტი.',
      'ჯანჯაფილის ან გვირილის ჩაებს სპაზმების დროს დამშვიდებაც შეუძლია.',
      'ინტენსიური, გაგრძელებული წყურვილი ჯანდაცვის სპეციალისტთან ნახსენებად ღირს.',
    ],
    disclaimerText: 'საინფორმაციო შინაარსი. ეს სტატია პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს. ეჭვის შემთხვევაში მიმართეთ ჯანდაცვის სპეციალისტს.',
    shareMessage: 'კარგი ჰიდრატაცია ციკლის განმავლობაში — AWA',
  },
  hy: {
    badge: 'ԴԱՇՏԱՆԱՅԻՆ ՑԻԿԼ • ՀԻԴՐԱՏԱՑԻԱ',
    title: 'Հիդրատացված մնալ\nձեր ցիկլի ընթացքում',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Հակասական, բայց ճիշտ. լավ հիդրատացված մնալը օգնում է, որ ձեր մարմինը ցիկլի ընթացքում քիչ ջուր պահի:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչու է կարևոր հիդրատացիան',
      'Կարիքները ցիկլի փուլերի ընթացքում',
      'Ինչ խմել օրեցօր',
      'Անբավարար հիդրատացիայի նշաններ',
      'Գործնական խորհուրդներ',
      'Տարածված թյուր պատկերացումներ',
      'Հիմնական եզրակացություններ',
    ],
    section1Body: 'Հակասական, բայց ճիշտ. լավ հիդրատացված մնալը օգնում է մարմնին քիչ ջուր պահել և նվազեցնում է ուռածությունը, մասնավորապես ցիկլի վերջում:',
    infoTitle: 'Լավ է իմանալ',
    infoText: 'Երբ մարմնում ջրի պակաս է, այն հակված է ավելի շատ պահել այն՝ նախազգուշության համար: Բավարար խմելը, ընդհակառակը, նրան ասում է, որ կարող է ջուրն ավելի հեշտ ազատել:',
    section2Body: 'Ձեր ջրի կարիքը ընդհանուր առմամբ մնում է բավական կայուն, փուլից կախված մի քանի նրբերանգներով.',
    phaseNeeds: [
      {title: 'Դաշտանի ընթացքում', text: 'Մի փոքր լրացուցիչ ջուրը օգնում է փոխհատուցել հեղուկի կորուստը և սահմանափակել ուռածությունը:'},
      {title: 'Ձվազատման շուրջ', text: 'Կարիքները մնում են կայուն. մարմնի ջերմաստիճանի թեթև բարձրացումը կարող է ավելացնել ծարավը:'},
      {title: 'Նախադաշտանային փուլ', text: 'Լավ հիդրատացիան օգնում է սահմանափակել այս ընթացքում հաճախ զգացվող այտուցվածության զգացումը:'},
    ],
    section3Body: 'Նպատակ դրեք օրական մոտ 1,5–2 լիտր, դաշտանի ընթացքում մի փոքր ավելի՝ հեղուկի կորուստը փոխհատուցելու համար:',
    dailyDrinks: [
      {title: 'Առաջին հերթին՝ ջուր', text: 'Օրական մոտ 1,5–2 լիտր, դաշտանի ընթացքում մի փոքր ավելի:'},
      {title: 'Հանգստացնող խոտաբույսերի թեյեր', text: 'Կոճապղպեղը կամ երիցուկը մեղմ հիդրատացիա են առաջարկում ջղաձգումների ժամանակ:'},
      {title: 'Շաքար և կոֆեին՝ չափավոր', text: 'Շատ քաղցր կամ կոֆեին պարունակող ըմպելիքները սահմանափակելը կարող է օգնել ցիկլի վերջում:'},
    ],
    warningTitle: 'Արժե հետևել',
    lowHydrationSigns: [
      'Ինտենսիվ կամ անսովոր ծարավ',
      'Սովորականից ավելի մուգ մեզ',
      'Հաճախակի գլխացավեր',
      'Հոգնածություն՝ առանց այլ ակնհայտ բացատրության',
    ],
    section5Body: 'Մի քանի պարզ սովորություն հաճախ բավական է՝ հիդրատացված մնալու համար՝ նույնիսկ առանց այդ մասին մտածելու.',
    practicalTips: [
      'Օրվա ընթացքում ջրի շիշը պահեք ձեռքի տակ',
      'Մի բաժակ ջուրը կապեք արդեն ունեցած սովորության հետ (արթնանալ, յուրաքանչյուր ճաշ)',
      'Խոտաբույսերի թուրմեր խառնեք, եթե պարզ ջուրը ձանձրանում է',
    ],
    section5Body2: 'Ֆիզիկական ակտիվության ժամանակ հիշեք խմել մարզումից առաջ, ընթացքում և հետո՝ քրտինքով կորցրածը փոխհատուցելու համար:',
    compareTitle1: 'Տարածված համոզմունք',
    compareText1: '«Շատ խմելը ինձ ավելի ուռած է դարձնում»:',
    compareTitle2: 'Իրականում հակառակը',
    compareText2: 'Լավ հիդրատացիան օգնում է մարմնին քիչ ջուր պահել:',
    tipTitle: 'Լավ է իմանալ',
    tipText: 'Կոճապղպեղի կամ երիցուկի թեյերը նաև հանգստացնող հիդրատացիա են առաջարկում ջղաձգումների ժամանակ:',
    summaryPoints: [
      'Լավ հիդրատացված մնալը օգնում է մարմնին քիչ ջուր պահել և նվազեցնում է ուռածությունը:',
      'Նպատակ դրեք օրական մոտ 1,5–2 լիտր, դաշտանի ընթացքում մի փոքր ավելի:',
      'Կոճապղպեղի կամ երիցուկի թեյերը կարող են նաև հանգստացնել ջղաձգումների ժամանակ:',
      'Ինտենսիվ, շարունակական ծարավը արժե նշել առողջապահության մասնագետին:',
    ],
    disclaimerText: 'Տեղեկատվական բովանդակություն: Այս հոդվածը չի փոխարինում անհատականացված բժշկական խորհրդատվությանը: Կասկածի դեպքում խորհուրդ հարցրեք առողջապահության մասնագետից:',
    shareMessage: 'Հիդրատացված մնալ ձեր ցիկլի ընթացքում — AWA',
  },
  tg: {
    badge: 'ДАВРАИ ҲАЙЗ • ОБНӮШӢ',
    title: 'Обнӯшии кофӣ\nдар давоми давра',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Ғайриинтизор, вале ҳақиқат: обнӯшии хуб ба бадани шумо кумак мекунад дар давоми давра камтар об нигоҳ дорад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Чаро обнӯшӣ муҳим аст',
      'Эҳтиёҷот дар марҳилаҳои давра',
      'Чӣ нӯшидан дар ҳаёти ҳаррӯза',
      'Нишонаҳои обнӯшии нокофӣ',
      'Маслиҳатҳои амалӣ',
      'Тасаввуроти нодурусти маъмул',
      'Хулосаҳои асосӣ',
    ],
    section1Body: 'Ғайриинтизор, вале ҳақиқат: обнӯшии хуб ба бадан кумак мекунад камтар об нигоҳ дорад ва дамидани шикамро кам мекунад, хусусан дар охири давра.',
    infoTitle: 'Донистан хуб аст',
    infoText: 'Вақте ки ба бадан об намерасад, он майл дорад барои эҳтиёт бештар онро захира кунад. Нӯшидани оби кофӣ, баръакс, ба он мегӯяд, ки метавонад обро осонтар озод кунад.',
    section2Body: 'Эҳтиёҷи шумо ба об умуман нисбатан собит мемонад, бо чанд нозукӣ вобаста ба марҳила:',
    phaseNeeds: [
      {title: 'Ҳангоми ҳайз', text: 'Андаке оби иловагӣ ба ҷуброни талафоти моеъ ва маҳдуд кардани дамидани шикам кумак мекунад.'},
      {title: 'Дар атрофи овуляция', text: 'Эҳтиёҷот собит мемонад; болоравии андаки ҳарорати бадан метавонад ташнагиро зиёд кунад.'},
      {title: 'Марҳилаи пеш аз ҳайз', text: 'Обнӯшии хуб ба маҳдуд кардани эҳсоси варам, ки дар ин вақт аксар вақт ҳис мешавад, кумак мекунад.'},
    ],
    section3Body: 'Ба тақрибан 1,5 то 2 литр дар як рӯз ҳадаф гиред, ҳангоми ҳайз андаке бештар барои ҷуброни талафоти моеъ.',
    dailyDrinks: [
      {title: 'Аввал аз ҳама об', text: 'Тақрибан 1,5 то 2 литр дар як рӯз, ҳангоми ҳайз андаке бештар.'},
      {title: 'Чойи гиёҳии оромбахш', text: 'Занҷабил ё бобуна ҳангоми кашишхӯрӣ обнӯшии нарм пешниҳод мекунанд.'},
      {title: 'Қанд ва кофеин, бо меъёр', text: 'Маҳдуд кардани нӯшокиҳои хеле ширин ё кофеиндор метавонад дар охири давра кумак кунад.'},
    ],
    warningTitle: 'Сазовори пайгирӣ',
    lowHydrationSigns: [
      'Ташнагии шадид ё ғайриоддӣ',
      'Пешоби торитар аз муқаррарӣ',
      'Дарди сари зуд-зуд',
      'Хастагӣ бе ягон тавзеҳи дигари возеҳ',
    ],
    section5Body: 'Чанд одати оддӣ аксар вақт барои обнӯшии кофӣ бидуни фикр кардан кифоя аст:',
    practicalTips: [
      'Шишаи обро дар давоми рӯз дар дастрас нигоҳ доред',
      'Стакани обро бо одате, ки аллакай доред, пайваст кунед (бедор шудан, ҳар хӯрок)',
      'Агар оби оддӣ дилгиркунанда шавад, дамкардаҳои гиёҳиро омехта кунед',
    ],
    section5Body2: 'Ҳангоми фаъолияти ҷисмонӣ фаромӯш накунед, ки пеш, ҳангоми ва пас аз машқ нӯшед, то талафоти арақро ҷуброн кунед.',
    compareTitle1: 'Боварии маъмул',
    compareText1: '«Бисёр нӯшидан маро дамидатар мекунад.»',
    compareTitle2: 'Дар асл баръакс',
    compareText2: 'Обнӯшии хуб ба бадан кумак мекунад камтар об нигоҳ дорад.',
    tipTitle: 'Донистан хуб аст',
    tipText: 'Чойи занҷабил ё бобуна инчунин ҳангоми кашишхӯрӣ обнӯшии оромбахш пешниҳод мекунад.',
    summaryPoints: [
      'Обнӯшии хуб ба бадан кумак мекунад камтар об нигоҳ дорад ва дамидани шикамро кам мекунад.',
      'Ба тақрибан 1,5 то 2 литр дар як рӯз ҳадаф гиред, ҳангоми ҳайз андаке бештар.',
      'Чойи занҷабил ё бобуна инчунин метавонад ҳангоми кашишхӯрӣ ором кунад.',
      'Ташнагии шадид ва доимӣ сазовор аст, ки ба мутахассиси соҳаи тиб гуфта шавад.',
    ],
    disclaimerText: 'Мазмуни иттилоотӣ. Ин мақола маслиҳати шахсии тиббиро иваз намекунад. Дар сурати шубҳа аз мутахассиси соҳаи тиб роҳнамоӣ пурсед.',
    shareMessage: 'Обнӯшии кофӣ дар давоми давра — AWA',
  },
  ky: {
    badge: 'ЕТЕК КИРИМ ЦИКЛИ • СУЮКТУК ИЧҮҮ',
    title: 'Цикл бою жакшы\nсуюктук ичүү',
    metaDuration: '6 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Күтүлбөгөндөй, бирок чын: жакшы суюктук ичүү цикл бою денеңиздин азыраак суу сактоосуна жардам берет.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Суюктук ичүү эмне үчүн маанилүү',
      'Циклиңиздин фазалары боюнча муктаждыктар',
      'Күн сайын эмне ичүү керек',
      'Суюктуктун жетишсиздигинин белгилери',
      'Практикалык кеңештер',
      'Кеңири таралган жаңылыш түшүнүктөр',
      'Негизги жыйынтыктар',
    ],
    section1Body: 'Күтүлбөгөндөй, бирок чын: жакшы суюктук ичүү денеге азыраак суу сактоого жардам берет жана ич көбүшүн азайтат, айрыкча цикл аякташында.',
    infoTitle: 'Билүү пайдалуу',
    infoText: 'Организмде суу жетишсиз болгондо, ал сактык үчүн көбүрөөк сактоого умтулат. Жетиштүү ичүү, тескерисинче, сууну оңой чыгарса болорун билдирет.',
    section2Body: 'Суу муктаждыгыңыз жалпысынан бир кыйла туруктуу бойдон калат, фазага жараша бир нече нюанс менен:',
    phaseNeeds: [
      {title: 'Етек кирим учурунда', text: 'Бир аз кошумча суу суюктук жоготууну толуктоого жана ич көбүшүн чектөөгө жардам берет.'},
      {title: 'Овуляциянын тегерегинде', text: 'Муктаждык туруктуу бойдон калат; дене температурасынын бир аз көтөрүлүшү суусоону күчөтүшү мүмкүн.'},
      {title: 'Етек киримге чейинки фаза', text: 'Жакшы суюктук ичүү бул мезгилде көп сезилген шишик сезимин чектөөгө жардам берет.'},
    ],
    section3Body: 'Күнүнө болжол менен 1,5–2 литрди көздөңүз, етек кирим учурунда суюктук жоготууну толуктоо үчүн бир аз көбүрөөк.',
    dailyDrinks: [
      {title: 'Адегенде суу', text: 'Күнүнө болжол менен 1,5–2 литр, етек кирим учурунда бир аз көбүрөөк.'},
      {title: 'Тынчтандыруучу чөп чайлары', text: 'Имбирь же ромашка спазмдар убагында жумшак суюктук берет.'},
      {title: 'Кант жана кофеин, орточо өлчөмдө', text: 'Өтө таттуу же кофеиндүү суусундуктарды чектөө цикл аякташында жардам бериши мүмкүн.'},
    ],
    warningTitle: 'Көз салып турууга татыктуу',
    lowHydrationSigns: [
      'Күчтүү же адаттан тыш суусоо',
      'Адаттагыдан кара заара',
      'Тез-тез баш оору',
      'Башка даана себепсиз чарчоо',
    ],
    section5Body: 'Суюктукту ойлонбой эле сактоо үчүн бир нече жөнөкөй адат көбүнчө жетиштүү:',
    practicalTips: [
      'Күн бою суу бөтөлкөсүн колуңуздун астында кармаңыз',
      'Бир стакан сууну буга чейинки адатыңыз менен айкалыштырыңыз (ойгонуу, ар бир тамак)',
      'Жөнөкөй суу жадатма болсо, чөп демдемелерин аралаштырыңыз',
    ],
    section5Body2: 'Физикалык активдүүлүк учурунда тердин жоготуусун толуктоо үчүн машыгуудан мурун, учурунда жана андан кийин ичүүнү унутпаңыз.',
    compareTitle1: 'Кеңири таралган ишеним',
    compareText1: '«Көп ичсем, ич көбүшү күчөйт.»',
    compareTitle2: 'Чындыгында тескерисинче',
    compareText2: 'Жакшы суюктук ичүү денеге азыраак суу сактоого жардам берет.',
    tipTitle: 'Билүү пайдалуу',
    tipText: 'Имбирь же ромашка чайлары спазмдар убагында да тынчтандыруучу суюктук берет.',
    summaryPoints: [
      'Жакшы суюктук ичүү денеге азыраак суу сактоого жардам берет жана ич көбүшүн азайтат.',
      'Күнүнө болжол менен 1,5–2 литрди көздөңүз, етек кирим учурунда бир аз көбүрөөк.',
      'Имбирь же ромашка чайлары спазмдар убагында да тынчтандыра алат.',
      'Күчтүү, улана берген суусоо ден соолук сактоо адисине айтууга татыйт.',
    ],
    disclaimerText: 'Маалымат берүүчү мазмун. Бул макала жекелештирилген медициналык кеңешти алмаштырбайт. Күмөн болсо, ден соолук сактоо адисинен кеңеш сураңыз.',
    shareMessage: 'Цикл бою жакшы суюктук ичүү — AWA',
  },
  tk: {
    badge: 'AÝBAŞY SIKLI • SUWLANDYRMAK',
    title: 'Sikl dowamynda bedeniňizi\nsuwly saklamak',
    metaDuration: '6 min okamak',
    metaType: 'Makala',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Garaşylmadyk, ýöne dogry: bedeniňizi gowy suwly saklamak sikl dowamynda bedeniňiziň az suw saklamagyna kömek edýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Suwlandyrmak näme üçin möhüm',
      'Sikliňiz tapgyrlaryndaky zerurlyklar',
      'Gündelik näme içmeli',
      'Ýeterlik suwlanmazlygyň alamatlary',
      'Amaly maslahatlar',
      'Giňden ýaýran ýalňyş düşünjeler',
      'Esasy netijeler',
    ],
    section1Body: 'Garaşylmadyk, ýöne dogry: bedeniňizi gowy suwly saklamak bedeniň az suw saklamagyna we garnyň çişmegini azaltmaga, aýratyn-da sikliň ahyryna golaý, kömek edýär.',
    infoTitle: 'Bilmek peýdaly',
    infoText: 'Bedende suw ýetmezçilik edende, ol seresaplylyk üçin ony has köp saklamaga ýykgyn edýär. Ýeterlik içmek, tersine, onuň suwy has aňsat boşadyp biljekdigini habar berýär.',
    section2Body: 'Suw zerurlyklaryňyz umuman birneme durnukly galýar, tapgyra görä käbir nuanslar bilen:',
    phaseNeeds: [
      {title: 'Aýbaşy wagtynda', text: 'Birneme goşmaça suw suwuklyk ýitgisini deňlemäge we çişmegi çäklemäge kömek edýär.'},
      {title: 'Ovulýasiýa töwereginde', text: 'Zerurlyklar durnukly galýar; beden temperaturasynyň ýeňil ýokarlanmagy suwsuzlygy artdyryp biler.'},
      {title: 'Aýbaşydan öňki tapgyr', text: 'Gowy suwlandyrmak bu döwürde köplenç duýulýan çişkinlik duýgusyny çäklemäge kömek edýär.'},
    ],
    section3Body: 'Günde takmynan 1,5–2 litr maksat ediniň, ýitgini deňlemek üçin aýbaşy wagtynda birneme köp.',
    dailyDrinks: [
      {title: 'Ilki bilen suw', text: 'Günde takmynan 1,5–2 litr, aýbaşy wagtynda birneme köp.'},
      {title: 'Köňül rahatlandyryjy ösümlik çaýlary', text: 'Zinzibir ýa-da romaşka çekişme wagtynda ýumşak suwlandyrmak berýär.'},
      {title: 'Şeker we kofein, ölçegde', text: 'Gaty süýji ýa-da kofeinli içgileri çäklemek sikliň ahyrynda kömek edip biler.'},
    ],
    warningTitle: 'Gözegçilikde saklamaga mynasyp',
    lowHydrationSigns: [
      'Güýçli ýa-da adaty däl suwsuzlyk',
      'Adatdakydan goýy reňkli peşew',
      'Ýygy kelle agyrylary',
      'Başga aýdyň düşündirişsiz ýadawlyk',
    ],
    section5Body: 'Suwly galmak üçin hatda hakynda pikir etmän, birnäçe ýönekeý endik köplenç ýeterlik:',
    practicalTips: [
      'Gün boýy suw çüýşesini el ýetimde saklaň',
      'Bir stakan suwy eýýäm bar bolan endik bilen utgaşdyryň (oýanmak, her tagam)',
      'Ýönekeý suw ýadadanda ösümlik damjalaryny goşuň',
    ],
    section5Body2: 'Fiziki işjeňlik wagtynda derlemek bilen ýitirilenini deňlemek üçin maşkdan öň, maşk wagtynda we maşkdan soň içmegi ýatdan çykarmaň.',
    compareTitle1: 'Ýaýran ynanç',
    compareText1: '«Köp içmek meni has çişirýär.»',
    compareTitle2: 'Aslynda tersine',
    compareText2: 'Gowy suwlandyrmak bedeniň az suw saklamagyna kömek edýär.',
    tipTitle: 'Bilmek peýdaly',
    tipText: 'Zinzibir ýa-da romaşka çaýlary çekişme wagtynda köňül rahatlandyryjy suwlandyrmak hem berýär.',
    summaryPoints: [
      'Gowy suwly bolmak bedeniň az suw saklamagyna we çişmegi azaltmaga kömek edýär.',
      'Günde takmynan 1,5–2 litr maksat ediniň, aýbaşy wagtynda birneme köp.',
      'Zinzibir ýa-da romaşka çaýlary çekişme wagtynda hem rahatlandyryp biler.',
      'Güýçli, dowamly suwsuzlyk saglyk hünärmenine aýtmaga mynasyp.',
    ],
    disclaimerText: 'Maglumat berýän mazmun. Bu makala şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar. Şübhe bolsa, saglyk hünärmeninden ugrukdyrma soraň.',
    shareMessage: 'Sikl dowamynda bedeniňizi suwly saklamak — AWA',
  },
} as const);

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function HydrationCycleArticleScreen({
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Partage annulé ou indisponible.
    }
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
        {/* ==================================================================== */}
        {/* HERO                                                                 */}
        {/* ==================================================================== */}

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
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

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

          <AwaText variant="titleSmall" style={styles.intro}>{content.intro}</AwaText>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section1Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{content.infoText}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section2Body}</AwaText>

          <View style={styles.normalGrid}>
            {content.phaseNeeds.map((item, index) => (
              <AwaCard variant="filled" padding="none" key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={PHASE_NEEDS_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>{item.title}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>{item.text}</AwaText>
              </AwaCard>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section3Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comfortCard}>
            {content.dailyDrinks.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < content.dailyDrinks.length - 1 && styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={DAILY_DRINKS_ICONS[index] as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comfortCopy}>
                  <AwaText variant="titleSmall" emphasized>{item.title}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.comfortText}>{item.text}</AwaText>
                </View>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <AwaText variant="titleSmall" emphasized style={styles.warningTitle}>{content.warningTitle}</AwaText>
            </View>

            {content.lowHydrationSigns.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={16}
                    color={theme.colors.warning}
                  />
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section5Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.practicalTips.map(item => (
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

          <AwaText variant="bodyMedium" style={styles.body}>{content.section5Body2}</AwaText>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.compareCard}>
            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <AwaText variant="titleSmall" emphasized style={styles.compareTitle}>{content.compareTitle1}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.compareText}>{content.compareText1}</AwaText>
            </View>

            <View style={styles.compareDivider} />

            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={21}
                  color={theme.colors.success}
                />
              </View>

              <AwaText variant="titleSmall" emphasized style={styles.compareTitle}>{content.compareTitle2}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.compareText}>{content.compareText2}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* TIP                                                               */}
          {/* ================================================================= */}

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tipText}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.topics[6]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" style={styles.summaryText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>{content.disclaimerText}</AwaText>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

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
  contentNumber: {width: 25},
  contentText: {flex: 1},

  h2: {
    marginTop: 28,
  },
  body: {marginTop: 8},

  infoCard: {
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCopy: {flex: 1, marginLeft: 8},
  infoText: {marginTop: 3},

  normalGrid: {marginTop: 12, gap: 8},
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
  normalTitle: {marginTop: 8},
  normalText: {marginTop: 4},

  comfortCard: {
    marginTop: 12,
    paddingHorizontal: 12,
  },
  comfortRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12},
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  comfortCopy: {flex: 1, marginLeft: 12},
  comfortText: {marginTop: 3},

  warningCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 4},

  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12},
  checkText: {flex: 1},

  compareCard: {
    marginTop: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  compareColumn: {flex: 1},
  compareIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  compareTitle: {marginTop: 8},
  compareText: {marginTop: 4},
  compareDivider: {width: 1, marginHorizontal: 12, backgroundColor: theme.colors.border},

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},

  summaryCard: {
    marginTop: 12,
    padding: 16,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12},
  summaryText: {flex: 1},

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  disclaimerText: {flex: 1},
  });
}
