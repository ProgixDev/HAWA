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
  da: {
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
