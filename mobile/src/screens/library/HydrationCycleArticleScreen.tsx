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

const CONTENT = {
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
} as const;

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
