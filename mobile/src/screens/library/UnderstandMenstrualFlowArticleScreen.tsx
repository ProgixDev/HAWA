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
import {getBottomPadding, getTopPadding, READING_CONTROLS_SPACE} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'flow-comprendre-flux';

const HERO = require('../../assets/images/library/rules-hero.png');
const PROCESS = require('../../assets/images/library/rules-process.png');

// Images/icons stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these entries.
const TIPS = [
  {image: require('../../assets/images/library/tip-water.png')},
  {image: require('../../assets/images/library/tip-heat.png')},
  {image: require('../../assets/images/library/tip-movement.png')},
  {image: require('../../assets/images/library/tip-sleep.png')},
] as const;

const FLOW_STEPS = [
  {number: '01', icon: 'water'},
  {number: '02', icon: 'calendar-clock-outline'},
  {number: '03', icon: 'weather-sunset-down'},
] as const;

const NORMAL_SIGNS = [
  {icon: 'calendar-range'},
  {icon: 'water-outline'},
  {icon: 'palette-outline'},
  {icon: 'heart-pulse'},
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('UnderstandMenstrualFlow', {
  fr: {
    badge: 'CYCLE MENSTRUEL',
    title: 'Comprendre les règles :\nce qui se passe vraiment',
    metaDuration: '5 min de lecture',
    metaValidated: 'Contenu validé',
    intro:
      'Les règles font partie d’un processus naturel essentiel à la santé hormonale et reproductive féminine. Comprendre ce qui se passe dans ton corps peut t’aider à mieux vivre chaque cycle.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que les règles ?',
      'Le déroulement des règles',
      'Ce qui est normal (et ce qui ne l’est pas)',
      'Soulager les douleurs naturellement',
    ],
    body1:
      'Les règles correspondent à l’élimination de la muqueuse utérine lorsqu’il n’y a pas de fécondation. Ce phénomène se produit en moyenne une fois par mois.',
    knowTitle: 'Bon à savoir',
    knowText:
      'Chaque femme est unique : la durée, l’intensité et les sensations peuvent varier d’un cycle à l’autre.',
    body2:
      'Le flux n’est pas identique pendant toute la période. Il évolue généralement au fil des jours et peut changer en intensité, en couleur et en texture.',
    flowSteps: [
      {title: 'Début des règles', text: 'Le flux est souvent plus important pendant les premiers jours.'},
      {title: 'Milieu des règles', text: 'Le flux commence généralement à diminuer progressivement.'},
      {title: 'Fin des règles', text: 'Le flux devient plus léger et peut prendre une couleur plus foncée.'},
    ],
    softInfoTitle: 'À retenir',
    softInfoText:
      'Le déroulement peut varier d’un cycle à l’autre. Ce qui compte surtout est de connaître ton propre rythme habituel.',
    body3:
      'Certaines variations sont fréquentes pendant les règles. D’autres signes méritent davantage d’attention, surtout lorsqu’ils sont nouveaux ou très intenses.',
    normalSigns: [
      {title: 'Durée', text: 'Des règles qui durent généralement quelques jours.'},
      {title: 'Flux variable', text: 'Un flux plus abondant au début puis plus léger.'},
      {title: 'Couleur', text: 'Du rouge vif au rouge foncé ou brun en fin de règles.'},
      {title: 'Sensations', text: 'Des crampes légères à modérées peuvent être ressenties.'},
    ],
    warningTitle: 'Quand demander un avis médical ?',
    warningSigns: [
      'Douleurs très intenses ou inhabituelles',
      'Saignements qui imbibent une protection très rapidement',
      'Fatigue importante, malaise ou vertiges',
      'Changement brutal et persistant par rapport à tes habitudes',
    ],
    body4:
      'Des gestes simples peuvent aider à réduire l’inconfort et à mieux vivre les premiers jours des règles.',
    tipsTitle: 'Conseils pratiques',
    tips: [
      'Bois suffisamment\nd’eau pour limiter\nla fatigue.',
      'Applique de la\nchaleur sur le bas-\nventre si besoin.',
      'Pratique une activité\ndouce : marche,\nyoga, étirements.',
      'Accorde-toi du\nrepos et un sommeil\nde qualité.',
    ],
    reliefTitle: 'Écoute ton corps',
    reliefText:
      'Le repos, la chaleur et une activité douce peuvent être utiles. Si la douleur reste très forte ou inhabituelle, demande un avis médical.',
    shareMessage: 'Comprendre les règles : ce qui se passe vraiment — AWA',
  },
  en: {
    badge: 'MENSTRUAL CYCLE',
    title: 'Understanding your period:\nwhat’s really happening',
    metaDuration: '5 min read',
    metaValidated: 'Reviewed content',
    intro:
      'Your period is part of a natural process that’s essential to hormonal and reproductive health. Understanding what’s happening in your body can help you feel more at ease with each cycle.',
    contentsTitle: 'In this article',
    topics: [
      'What is a period?',
      'How your period unfolds',
      'What’s normal (and what isn’t)',
      'Relieving pain naturally',
    ],
    body1:
      'A period is the shedding of the uterine lining when no fertilization has occurred. This happens on average once a month.',
    knowTitle: 'Good to know',
    knowText:
      'Every woman is unique: duration, intensity, and sensations can vary from one cycle to the next.',
    body2:
      'Flow isn’t the same throughout your period. It usually changes from day to day, in intensity, color, and texture.',
    flowSteps: [
      {title: 'Start of your period', text: 'Flow is often heavier during the first few days.'},
      {title: 'Middle of your period', text: 'Flow generally starts to gradually decrease.'},
      {title: 'End of your period', text: 'Flow becomes lighter and may take on a darker color.'},
    ],
    softInfoTitle: 'Keep in mind',
    softInfoText:
      'This can vary from one cycle to another. What matters most is knowing your own usual rhythm.',
    body3:
      'Some variations are common during your period. Other signs deserve more attention, especially when they’re new or very intense.',
    normalSigns: [
      {title: 'Duration', text: 'A period that usually lasts a few days.'},
      {title: 'Varying flow', text: 'Heavier flow at first, then lighter.'},
      {title: 'Color', text: 'From bright red to dark red or brown toward the end of your period.'},
      {title: 'Sensations', text: 'Mild to moderate cramps may be felt.'},
    ],
    warningTitle: 'When to seek medical advice?',
    warningSigns: [
      'Very intense or unusual pain',
      'Bleeding that soaks through a pad or tampon very quickly',
      'Significant fatigue, feeling faint, or dizziness',
      'A sudden and persistent change from your usual pattern',
    ],
    body4:
      'Simple habits can help ease discomfort and make the first days of your period more comfortable.',
    tipsTitle: 'Practical tips',
    tips: [
      'Drink enough\nwater to help\nlimit fatigue.',
      'Apply heat\nto your lower\nabdomen if needed.',
      'Try a gentle\nactivity: walking,\nyoga, stretching.',
      'Give yourself\nrest and good-\nquality sleep.',
    ],
    reliefTitle: 'Listen to your body',
    reliefText:
      'Rest, heat, and gentle activity can help. If the pain remains very intense or unusual, seek medical advice.',
    shareMessage: 'Understanding your period: what’s really happening — AWA',
  },
  es: {
    badge: 'CICLO MENSTRUAL',
    title: 'Entender el período:\nqué es lo que realmente pasa',
    metaDuration: '5 min de lectura',
    metaValidated: 'Contenido validado',
    intro:
      'El período forma parte de un proceso natural esencial para la salud hormonal y reproductiva femenina. Entender lo que ocurre en tu cuerpo puede ayudarte a vivir mejor cada ciclo.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es el período?',
      'Cómo transcurre el período',
      'Qué es normal (y qué no lo es)',
      'Aliviar los dolores de forma natural',
    ],
    body1:
      'El período corresponde a la eliminación del revestimiento uterino cuando no se ha producido una fecundación. Este fenómeno ocurre, en promedio, una vez al mes.',
    knowTitle: 'Dato útil',
    knowText:
      'Cada mujer es única: la duración, la intensidad y las sensaciones pueden variar de un ciclo a otro.',
    body2:
      'El flujo no es igual durante todo el período. Suele cambiar día a día, tanto en intensidad como en color y textura.',
    flowSteps: [
      {title: 'Inicio del período', text: 'El flujo suele ser más abundante durante los primeros días.'},
      {title: 'Mitad del período', text: 'El flujo generalmente comienza a disminuir poco a poco.'},
      {title: 'Final del período', text: 'El flujo se vuelve más ligero y puede adquirir un color más oscuro.'},
    ],
    softInfoTitle: 'Para recordar',
    softInfoText:
      'El desarrollo puede variar de un ciclo a otro. Lo más importante es conocer tu propio ritmo habitual.',
    body3:
      'Algunas variaciones son frecuentes durante el período. Otros signos merecen más atención, sobre todo cuando son nuevos o muy intensos.',
    normalSigns: [
      {title: 'Duración', text: 'Un período que suele durar unos días.'},
      {title: 'Flujo variable', text: 'Un flujo más abundante al principio y luego más ligero.'},
      {title: 'Color', text: 'Del rojo vivo al rojo oscuro o marrón hacia el final del período.'},
      {title: 'Sensaciones', text: 'Pueden sentirse cólicos leves a moderados.'},
    ],
    warningTitle: '¿Cuándo pedir una opinión médica?',
    warningSigns: [
      'Dolores muy intensos o inusuales',
      'Sangrado que empapa una protección muy rápidamente',
      'Fatiga importante, malestar o mareos',
      'Un cambio brusco y persistente respecto a tus hábitos',
    ],
    body4:
      'Algunos gestos sencillos pueden ayudar a reducir la incomodidad y a vivir mejor los primeros días del período.',
    tipsTitle: 'Consejos prácticos',
    tips: [
      'Bebe suficiente\nagua para limitar\nla fatiga.',
      'Aplica calor\nen la parte baja\ndel abdomen si lo necesitas.',
      'Practica una actividad\nsuave: caminar,\nyoga, estiramientos.',
      'Date tiempo para\ndescansar y dormir\nbien.',
    ],
    reliefTitle: 'Escucha a tu cuerpo',
    reliefText:
      'El descanso, el calor y una actividad suave pueden ser útiles. Si el dolor sigue siendo muy fuerte o inusual, pide una opinión médica.',
    shareMessage: 'Entender el período: qué es lo que realmente pasa — AWA',
  },
  it: {
    badge: 'CICLO MESTRUALE',
    title: 'Capire il tuo periodo mestruale:\ncosa succede davvero',
    metaDuration: '5 min di lettura',
    metaValidated: 'Contenuto validato',
    intro: 'Il tuo periodo mestruale fa parte di un processo naturale essenziale per la salute ormonale e riproduttiva. Capire cosa succede nel tuo corpo può aiutarti a sentirti più serena a ogni ciclo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Cos’è il periodo mestruale?',
      'Come si svolge il periodo mestruale',
      'Cosa è normale (e cosa no)',
      'Alleviare il dolore in modo naturale',
    ],
    body1: 'Il periodo mestruale è l’eliminazione del rivestimento dell’utero quando non c’è stato il concepimento. Avviene in media una volta al mese.',
    knowTitle: 'Da sapere',
    knowText: 'Ogni donna è unica: durata, intensità e sensazioni possono variare da un ciclo all’altro.',
    body2: 'Il flusso non è lo stesso per tutto il periodo mestruale. Di solito cambia di giorno in giorno, per intensità, colore e consistenza.',
    flowSteps: [
      {
        title: 'Inizio del periodo mestruale',
        text: 'Il flusso è spesso più abbondante nei primi giorni.',
      },
      {
        title: 'Metà del periodo mestruale',
        text: 'Il flusso in genere comincia a diminuire gradualmente.',
      },
      {
        title: 'Fine del periodo mestruale',
        text: 'Il flusso diventa più leggero e può assumere un colore più scuro.',
      },
    ],
    softInfoTitle: 'Tieni presente',
    softInfoText: 'Questo può variare da un ciclo all’altro. Ciò che conta di più è conoscere il tuo ritmo abituale.',
    body3: 'Durante il periodo mestruale alcune variazioni sono comuni. Altri segnali meritano maggiore attenzione, soprattutto se sono nuovi o molto intensi.',
    normalSigns: [
      {
        title: 'Durata',
        text: 'Un periodo mestruale che di solito dura qualche giorno.',
      },
      {
        title: 'Flusso variabile',
        text: 'Flusso più abbondante all’inizio, poi più leggero.',
      },
      {
        title: 'Colore',
        text: 'Dal rosso vivo al rosso scuro o al marrone verso la fine del periodo mestruale.',
      },
      {
        title: 'Sensazioni',
        text: 'Si possono avvertire crampi da lievi a moderati.',
      },
    ],
    warningTitle: 'Quando chiedere un parere medico?',
    warningSigns: [
      'Dolore molto intenso o insolito',
      'Sanguinamento che inzuppa un assorbente o un tampone molto rapidamente',
      'Forte stanchezza, sensazione di svenimento o capogiri',
      'Un cambiamento improvviso e persistente rispetto al tuo andamento abituale',
    ],
    body4: 'Semplici abitudini possono aiutare ad alleviare il disagio e a rendere più confortevoli i primi giorni del periodo mestruale.',
    tipsTitle: 'Consigli pratici',
    tips: [
      'Bevi abbastanza\nacqua per aiutare\na limitare la stanchezza.',
      'Applica calore\nsul basso ventre\nse necessario.',
      'Prova un’attività\ndolce: camminare,\nyoga, stretching.',
      'Concediti riposo\ne un sonno\ndi buona qualità.',
    ],
    reliefTitle: 'Ascolta il tuo corpo',
    reliefText: 'Riposo, calore e attività dolce possono aiutare. Se il dolore resta molto intenso o insolito, chiedi un parere medico.',
    shareMessage: 'Capire il tuo periodo mestruale: cosa succede davvero — AWA',
  },
  tr: {
    badge: 'ADET DÖNGÜSÜ',
    title: 'Adetini anlamak:\nasıl bir süreç yaşanıyor?',
    metaDuration: '5 dk okuma',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Adetin, hormonal ve üreme sağlığı için gerekli doğal bir sürecin parçasıdır. Vücudunda neler olduğunu anlamak, her döngüde kendini daha rahat hissetmene yardımcı olabilir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Adet nedir?',
      'Adetin seyri',
      'Neler normal (ve neler değil)?',
      'Ağrıyı doğal yollarla hafifletmek',
    ],
    body1: 'Adet, döllenme gerçekleşmediğinde rahim iç tabakasının dökülmesidir. Bu ortalama ayda bir kez olur.',
    knowTitle: 'Bilmekte fayda var',
    knowText: 'Her kadın benzersizdir: süre, yoğunluk ve hissedilenler bir döngüden diğerine değişebilir.',
    body2: 'Akış adetin boyunca aynı değildir. Genellikle yoğunluk, renk ve kıvam bakımından günden güne değişir.',
    flowSteps: [
      {
        title: 'Adetin başlangıcı',
        text: 'Akış çoğu zaman ilk günlerde daha yoğundur.',
      },
      {
        title: 'Adetin ortası',
        text: 'Akış genellikle yavaş yavaş azalmaya başlar.',
      },
      {
        title: 'Adetin sonu',
        text: 'Akış hafifler ve daha koyu bir renk alabilir.',
      },
    ],
    softInfoTitle: 'Aklında bulunsun',
    softInfoText: 'Bu, bir döngüden diğerine değişebilir. En önemlisi, kendi olağan ritmini bilmendir.',
    body3: 'Adet sırasında bazı değişiklikler yaygındır. Diğer işaretler ise, özellikle yeni ya da çok şiddetli olduklarında daha fazla dikkat gerektirir.',
    normalSigns: [
      {
        title: 'Süre',
        text: 'Genellikle birkaç gün süren bir adet.',
      },
      {
        title: 'Değişen akış',
        text: 'Başta daha yoğun, sonra daha hafif akış.',
      },
      {
        title: 'Renk',
        text: 'Adetin sonuna doğru parlak kırmızıdan koyu kırmızıya veya kahverengiye.',
      },
      {
        title: 'Hissedilenler',
        text: 'Hafif ile orta şiddette kramplar hissedilebilir.',
      },
    ],
    warningTitle: 'Ne zaman tıbbi görüş almalı?',
    warningSigns: [
      'Çok şiddetli veya olağandışı ağrı',
      'Bir ped ya da tamponu çok hızlı ıslatan kanama',
      'Belirgin yorgunluk, bayılacak gibi olma veya baş dönmesi',
      'Alışkın olduğun düzenden ani ve süregelen bir sapma',
    ],
    body4: 'Basit alışkanlıklar rahatsızlığı hafifletmeye ve adetin ilk günlerini daha konforlu hale getirmeye yardımcı olabilir.',
    tipsTitle: 'Pratik ipuçları',
    tips: [
      'Yorgunluğu azaltmaya\nyardımcı olmak için\nyeterince su iç.',
      'Gerekirse alt\nkarnına\nsıcak uygula.',
      'Hafif bir\naktivite dene:\nyürüyüş, yoga, esneme.',
      'Kendine dinlenme\nve kaliteli\nuyku fırsatı ver.',
    ],
    reliefTitle: 'Vücudunu dinle',
    reliefText: 'Dinlenme, sıcak uygulama ve hafif aktivite yardımcı olabilir. Ağrı çok şiddetli veya olağandışı kalırsa tıbbi görüş al.',
    shareMessage: 'Adetini anlamak: asıl neler oluyor? — AWA',
  },
  ru: {
    badge: 'МЕНСТРУАЛЬНЫЙ ЦИКЛ',
    title: 'Понимаем месячные:\nчто происходит на самом деле',
    metaDuration: '5 мин чтения',
    metaValidated: 'Проверенный материал',
    intro: 'Месячные — часть естественного процесса, важного для гормонального и репродуктивного здоровья. Понимание того, что происходит в организме, помогает спокойнее относиться к каждому циклу.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое месячные?',
      'Как проходят месячные',
      'Что считается нормой (а что нет)',
      'Как естественно облегчить боль',
    ],
    body1: 'Месячные — это отторжение слизистой оболочки матки, когда оплодотворение не произошло. В среднем это случается раз в месяц.',
    knowTitle: 'Полезно знать',
    knowText: 'Каждая женщина уникальна: продолжительность, интенсивность и ощущения могут меняться от цикла к циклу.',
    body2: 'Выделения не одинаковы на протяжении всех месячных. Обычно они меняются изо дня в день: по интенсивности, цвету и консистенции.',
    flowSteps: [
      {title: 'Начало месячных', text: 'В первые дни выделения часто более обильные.'},
      {title: 'Середина месячных', text: 'Выделения, как правило, постепенно уменьшаются.'},
      {title: 'Конец месячных', text: 'Выделения становятся скуднее и могут приобретать более тёмный цвет.'},
    ],
    softInfoTitle: 'Важно помнить',
    softInfoText: 'Это может отличаться от цикла к циклу. Самое главное — знать свой обычный ритм.',
    body3: 'Некоторые изменения во время месячных встречаются часто. Другие признаки заслуживают большего внимания, особенно если они появились впервые или очень выражены.',
    normalSigns: [
      {title: 'Продолжительность', text: 'Месячные, которые обычно длятся несколько дней.'},
      {title: 'Меняющиеся выделения', text: 'Сначала более обильные, затем более скудные.'},
      {title: 'Цвет', text: 'От ярко-красного до тёмно-красного или коричневого к концу месячных.'},
      {title: 'Ощущения', text: 'Могут ощущаться спазмы от слабых до умеренных.'},
    ],
    warningTitle: 'Когда обратиться к врачу?',
    warningSigns: [
      'Очень сильная или необычная боль',
      'Кровотечение, при котором прокладка или тампон пропитываются очень быстро',
      'Выраженная усталость, предобморочное состояние или головокружение',
      'Внезапное и стойкое отклонение от вашего обычного течения месячных',
    ],
    body4: 'Простые привычки помогают облегчить дискомфорт и сделать первые дни месячных более комфортными.',
    tipsTitle: 'Практические советы',
    tips: [
      'Пейте достаточно\nводы, чтобы\nснизить усталость.',
      'При необходимости\nприложите тепло\nк низу живота.',
      'Попробуйте лёгкую\nактивность: прогулку,\nйогу, растяжку.',
      'Позвольте себе\nотдых и\nполноценный сон.',
    ],
    reliefTitle: 'Прислушайтесь к своему телу',
    reliefText: 'Отдых, тепло и лёгкая активность могут помочь. Если боль остаётся очень сильной или необычной, обратитесь к врачу.',
    shareMessage: 'Понимаем месячные: что происходит на самом деле — AWA',
  },
  de: {
    badge: 'MENSTRUATIONSZYKLUS',
    title: 'Deine Periode verstehen:\nwas wirklich passiert',
    metaDuration: '5 Min. Lesezeit',
    metaValidated: 'Geprüfter Inhalt',
    intro:
      'Deine Periode gehört zu einem natürlichen Vorgang, der für die hormonelle und reproduktive Gesundheit wichtig ist. Wenn du verstehst, was in deinem Körper passiert, kannst du dich mit jedem Zyklus wohler fühlen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist die Periode?',
      'Wie die Periode verläuft',
      'Was normal ist (und was nicht)',
      'Schmerzen auf natürliche Weise lindern',
    ],
    body1:
      'Bei der Periode wird die Gebärmutterschleimhaut abgestoßen, wenn keine Befruchtung stattgefunden hat. Das geschieht im Durchschnitt einmal im Monat.',
    knowTitle: 'Gut zu wissen',
    knowText:
      'Jede Frau ist einzigartig: Dauer, Stärke und Empfindungen können von einem Zyklus zum nächsten variieren.',
    body2:
      'Die Blutung ist während der Periode nicht immer gleich. Sie verändert sich meist von Tag zu Tag, in Stärke, Farbe und Beschaffenheit.',
    flowSteps: [
      {title: 'Beginn der Periode', text: 'Die Blutung ist in den ersten Tagen oft stärker.'},
      {title: 'Mitte der Periode', text: 'Die Blutung lässt in der Regel allmählich nach.'},
      {title: 'Ende der Periode', text: 'Die Blutung wird schwächer und kann eine dunklere Farbe annehmen.'},
    ],
    softInfoTitle: 'Bedenke',
    softInfoText:
      'Das kann von Zyklus zu Zyklus unterschiedlich sein. Am wichtigsten ist, deinen eigenen gewohnten Rhythmus zu kennen.',
    body3:
      'Manche Schwankungen sind während der Periode häufig. Andere Anzeichen verdienen mehr Aufmerksamkeit, besonders wenn sie neu oder sehr stark sind.',
    normalSigns: [
      {title: 'Dauer', text: 'Eine Periode, die meist einige Tage dauert.'},
      {title: 'Wechselnde Blutung', text: 'Zuerst stärkere, dann schwächere Blutung.'},
      {title: 'Farbe', text: 'Von hellrot bis dunkelrot oder braun gegen Ende der Periode.'},
      {title: 'Empfindungen', text: 'Leichte bis mäßige Krämpfe können auftreten.'},
    ],
    warningTitle: 'Wann solltest du ärztlichen Rat einholen?',
    warningSigns: [
      'Sehr starke oder ungewöhnliche Schmerzen',
      'Eine Blutung, die eine Binde oder einen Tampon sehr schnell durchtränkt',
      'Starke Müdigkeit, Ohnmachtsgefühl oder Schwindel',
      'Eine plötzliche und anhaltende Veränderung gegenüber deinem gewohnten Muster',
    ],
    body4:
      'Einfache Gewohnheiten können helfen, Beschwerden zu lindern und die ersten Tage deiner Periode angenehmer zu gestalten.',
    tipsTitle: 'Praktische Tipps',
    tips: [
      'Trinke genug Wasser,\num Müdigkeit\nzu verringern.',
      'Lege dir bei Bedarf\nWärme auf\nden Unterbauch.',
      'Probiere sanfte Bewegung:\nSpazieren,\nYoga, Dehnen.',
      'Gönne dir Ruhe\nund guten\nSchlaf.',
    ],
    reliefTitle: 'Hör auf deinen Körper',
    reliefText:
      'Ruhe, Wärme und sanfte Bewegung können helfen. Wenn der Schmerz sehr stark oder ungewöhnlich bleibt, hol dir ärztlichen Rat.',
    shareMessage: 'Deine Periode verstehen: was wirklich passiert — AWA',
  },
  zh: {
      badge: '月经周期',
      title: '了解你的月经：\n身体里究竟发生了什么',
      metaDuration: '阅读约 5 分钟',
      metaValidated: '已审核内容',
      intro: '月经是一个自然过程的一部分，对激素和生殖健康至关重要。了解身体里发生了什么，可以让你在每个周期里更加安心。',
      contentsTitle: '本文内容',
      topics: [
        '什么是月经？',
        '月经是如何进行的',
        '什么是正常的（什么不是）',
        '自然缓解疼痛',
      ],
      body1: '月经是在没有受精的情况下，子宫内膜脱落的过程。平均每月发生一次。',
      knowTitle: '小贴士',
      knowText: '每个女性都是独特的：持续时间、经量和感受，在不同周期之间都可能有所不同。',
      body2: '整个经期的经量并不是一成不变的。它通常每天都在变化，包括量的多少、颜色和质地。',
      flowSteps: [
        {
          title: '经期开始',
          text: '最初几天的经量通常较多。',
        },
        {
          title: '经期中段',
          text: '经量一般会开始逐渐减少。',
        },
        {
          title: '经期结束',
          text: '经量变少，颜色可能变深。',
        },
      ],
      softInfoTitle: '请记住',
      softInfoText: '这在不同周期之间可能有所不同。最重要的是了解自己平时的节律。',
      body3: '经期中出现一些变化很常见。另一些信号则更值得留意，尤其是当它们是新出现的或非常强烈时。',
      normalSigns: [
        {
          title: '持续时间',
          text: '月经通常持续几天。',
        },
        {
          title: '经量变化',
          text: '一开始较多，之后逐渐减少。',
        },
        {
          title: '颜色',
          text: '从鲜红色到暗红色，临近经期结束时可能呈棕色。',
        },
        {
          title: '感觉',
          text: '可能会有轻度到中度的痉挛感。',
        },
      ],
      warningTitle: '什么时候应该就医咨询？',
      warningSigns: [
        '非常剧烈或异常的疼痛',
        '出血很快浸透卫生巾或卫生棉条',
        '明显疲倦、感觉快要昏厥或头晕',
        '与你平时的情况相比，突然出现并持续的变化',
      ],
      body4: '一些简单的习惯可以帮助缓解不适，让经期最初几天更舒服。',
      tipsTitle: '实用小建议',
      tips: [
        '多喝水，\n有助于减轻\n疲倦。',
        '需要时，\n用热敷\n温暖小腹。',
        '试试轻柔的\n活动：散步、\n瑜伽、拉伸。',
        '让自己多休息，\n保证优质\n睡眠。',
      ],
      reliefTitle: '倾听身体的声音',
      reliefText: '休息、热敷和轻柔的活动会有帮助。如果疼痛仍然非常剧烈或异常，请就医咨询。',
      shareMessage: '了解你的月经：身体里究竟发生了什么 — AWA',
    },
  id: {
    badge: 'SIKLUS MENSTRUASI',
    title: 'Memahami haidmu:\napa yang sebenarnya terjadi',
    metaDuration: '5 menit baca',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Haid adalah bagian dari proses alami yang penting bagi kesehatan hormonal dan reproduksi. Memahami apa yang terjadi di tubuhmu dapat membantumu merasa lebih tenang pada setiap siklus.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu haid?',
      'Bagaimana haid berlangsung',
      'Apa yang normal (dan apa yang tidak)',
      'Meredakan nyeri secara alami',
    ],
    body1: 'Haid adalah luruhnya lapisan rahim ketika tidak terjadi pembuahan. Hal ini terjadi rata-rata sekali sebulan.',
    knowTitle: 'Perlu diketahui',
    knowText: 'Setiap perempuan itu unik: lama, intensitas, dan sensasinya bisa berbeda dari satu siklus ke siklus berikutnya.',
    body2: 'Aliran darah tidak sama sepanjang haid. Biasanya berubah dari hari ke hari, dalam intensitas, warna, dan teksturnya.',
    flowSteps: [
      {
        title: 'Awal haid',
        text: 'Aliran darah sering lebih deras pada beberapa hari pertama.',
      },
      {
        title: 'Pertengahan haid',
        text: 'Aliran darah umumnya mulai berkurang secara bertahap.',
      },
      {
        title: 'Akhir haid',
        text: 'Aliran darah menjadi lebih ringan dan warnanya bisa lebih gelap.',
      },
    ],
    softInfoTitle: 'Ingatlah',
    softInfoText: 'Hal ini bisa berbeda dari satu siklus ke siklus lainnya. Yang terpenting adalah mengenali ritme biasamu sendiri.',
    body3: 'Beberapa variasi umum terjadi selama haid. Tanda lainnya layak mendapat perhatian lebih, terutama jika baru muncul atau sangat intens.',
    normalSigns: [
      {
        title: 'Lama',
        text: 'Haid yang biasanya berlangsung beberapa hari.',
      },
      {
        title: 'Aliran yang berubah-ubah',
        text: 'Aliran lebih deras di awal, lalu lebih ringan.',
      },
      {
        title: 'Warna',
        text: 'Dari merah terang hingga merah tua atau cokelat menjelang akhir haid.',
      },
      {
        title: 'Sensasi',
        text: 'Kram ringan hingga sedang mungkin terasa.',
      },
    ],
    warningTitle: 'Kapan harus mencari saran medis?',
    warningSigns: [
      'Nyeri yang sangat intens atau tidak biasa',
      'Perdarahan yang membuat pembalut atau tampon basah kuyup dengan sangat cepat',
      'Kelelahan yang berat, rasa akan pingsan, atau pusing',
      'Perubahan mendadak dan menetap dari pola biasamu',
    ],
    body4: 'Kebiasaan sederhana dapat membantu meredakan rasa tidak nyaman dan membuat hari-hari pertama haid lebih nyaman.',
    tipsTitle: 'Tips praktis',
    tips: [
      'Minum air yang\ncukup untuk membantu\nmengurangi kelelahan.',
      'Kompres hangat\npada perut bagian\nbawah jika perlu.',
      'Coba aktivitas\nringan: jalan kaki,\nyoga, peregangan.',
      'Beri dirimu\nistirahat dan tidur\nyang berkualitas.',
    ],
    reliefTitle: 'Dengarkan tubuhmu',
    reliefText: 'Istirahat, kehangatan, dan aktivitas ringan dapat membantu. Jika nyeri tetap sangat intens atau tidak biasa, carilah saran medis.',
    shareMessage: 'Memahami haidmu: apa yang sebenarnya terjadi — AWA',
  },
  hi: {
    badge: 'मासिक चक्र',
    title: 'अपने पीरियड को समझें:\nअसल में क्या हो रहा है',
    metaDuration: '5 मिनट का पाठ',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'आपका पीरियड एक प्राकृतिक प्रक्रिया का हिस्सा है, जो हार्मोनल और प्रजनन स्वास्थ्य के लिए ज़रूरी है। आपके शरीर में क्या हो रहा है, यह समझने से आप हर चक्र में ज़्यादा सहज महसूस कर सकती हैं।',
    contentsTitle: 'इस लेख में',
    topics: [
      'पीरियड क्या है?',
      'आपका पीरियड कैसे आगे बढ़ता है',
      'क्या सामान्य है (और क्या नहीं)',
      'दर्द को प्राकृतिक तरीकों से कम करें',
    ],
    body1: 'पीरियड गर्भाशय की अंदरूनी परत का झड़ना है, जो तब होता है जब गर्भधारण नहीं हुआ हो। यह औसतन महीने में एक बार होता है।',
    knowTitle: 'जानना अच्छा रहेगा',
    knowText: 'हर महिला अलग होती है: अवधि, फ़्लो की मात्रा और एहसास एक चक्र से दूसरे चक्र में बदल सकते हैं।',
    body2: 'आपके पूरे पीरियड में फ़्लो एक जैसा नहीं रहता। यह आमतौर पर दिन-ब-दिन मात्रा, रंग और बनावट में बदलता है।',
    flowSteps: [
      {
        title: 'पीरियड की शुरुआत',
        text: 'पहले कुछ दिनों में फ़्लो अक्सर ज़्यादा होता है।',
      },
      {
        title: 'पीरियड के बीच में',
        text: 'फ़्लो आमतौर पर धीरे-धीरे कम होने लगता है।',
      },
      {
        title: 'पीरियड के अंत में',
        text: 'फ़्लो हल्का हो जाता है और उसका रंग गहरा हो सकता है।',
      },
    ],
    softInfoTitle: 'याद रखें',
    softInfoText: 'यह एक चक्र से दूसरे चक्र में बदल सकता है। सबसे ज़रूरी बात है अपनी सामान्य लय को जानना।',
    body3: 'पीरियड के दौरान कुछ बदलाव आम हैं। दूसरे संकेतों पर ज़्यादा ध्यान देना चाहिए, खासकर जब वे नए हों या बहुत तेज़ हों।',
    normalSigns: [
      {
        title: 'अवधि',
        text: 'ऐसा पीरियड जो आमतौर पर कुछ दिन चलता है।',
      },
      {
        title: 'बदलता फ़्लो',
        text: 'शुरुआत में ज़्यादा फ़्लो, फिर हल्का।',
      },
      {
        title: 'रंग',
        text: 'चमकीले लाल से गहरे लाल या पीरियड के अंत की ओर भूरे रंग तक।',
      },
      {
        title: 'एहसास',
        text: 'हल्की से मध्यम ऐंठन महसूस हो सकती है।',
      },
    ],
    warningTitle: 'डॉक्टर की सलाह कब लें?',
    warningSigns: [
      'बहुत तेज़ या असामान्य दर्द',
      'ऐसा रक्तस्राव जो पैड या टैम्पोन को बहुत जल्दी भिगो दे',
      'काफ़ी थकान, बेहोशी जैसा महसूस होना या चक्कर आना',
      'आपके सामान्य पैटर्न में अचानक आया और बना रहने वाला बदलाव',
    ],
    body4: 'कुछ आसान आदतें बेचैनी कम करने और पीरियड के शुरुआती दिनों को ज़्यादा आरामदायक बनाने में मदद कर सकती हैं।',
    tipsTitle: 'काम की टिप्स',
    tips: [
      'भरपूर पानी\nपिएँ ताकि\nथकान कम रहे।',
      'ज़रूरत हो तो\nपेट के निचले\nहिस्से पर सेंक लें।',
      'कोई हल्की गतिविधि\nआज़माएँ: टहलना,\nयोग, स्ट्रेचिंग।',
      'ख़ुद को आराम\nऔर अच्छी\nनींद दें।',
    ],
    reliefTitle: 'अपने शरीर की सुनें',
    reliefText: 'आराम, सेंक और हल्की गतिविधि से मदद मिल सकती है। अगर दर्द बहुत तेज़ या असामान्य बना रहे, तो डॉक्टर की सलाह लें।',
    shareMessage: 'अपने पीरियड को समझें: असल में क्या हो रहा है — AWA',
  },
  sq: {
    badge: 'CIKLI MENSTRUAL',
    title: 'Të kuptosh menstruacionet e tua:\nçfarë ndodh në të vërtetë',
    metaDuration: '5 min lexim',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Menstruacionet janë pjesë e një procesi natyror thelbësor për shëndetin hormonal dhe riprodhues. Të kuptosh çfarë ndodh në trupin tënd mund të të ndihmojë të ndihesh më rehat me çdo cikël.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë janë menstruacionet?',
      'Si zhvillohen menstruacionet',
      'Çfarë është normale (dhe çfarë jo)',
      'Lehtësimi natyral i dhimbjes',
    ],
    body1: 'Menstruacionet janë heqja e shtresës së mitrës kur nuk ka ndodhur pllenim. Kjo ndodh mesatarisht një herë në muaj.',
    knowTitle: 'Mirë është ta dish',
    knowText: 'Çdo grua është unike: kohëzgjatja, intensiteti dhe ndjesitë mund të ndryshojnë nga një cikël te tjetri.',
    body2: 'Rrjedhja nuk është e njëjtë gjatë gjithë menstruacioneve. Zakonisht ndryshon nga dita në ditë, në intensitet, ngjyrë dhe strukturë.',
    flowSteps: [
      {
        title: 'Fillimi i menstruacioneve',
        text: 'Rrjedhja është shpesh më e bollshme gjatë ditëve të para.',
      },
      {
        title: 'Mesi i menstruacioneve',
        text: 'Rrjedhja zakonisht fillon të ulet pak e nga pak.',
      },
      {
        title: 'Fundi i menstruacioneve',
        text: 'Rrjedhja bëhet më e lehtë dhe mund të marrë një ngjyrë më të errët.',
      },
    ],
    softInfoTitle: 'Mbaje në mendje',
    softInfoText: 'Kjo mund të ndryshojë nga një cikël te tjetri. Ajo që ka më shumë rëndësi është ta njohësh ritmin tënd të zakonshëm.',
    body3: 'Disa variacione janë të zakonshme gjatë menstruacioneve. Shenja të tjera meritojnë më shumë vëmendje, sidomos kur janë të reja ose shumë intensive.',
    normalSigns: [
      {
        title: 'Kohëzgjatja',
        text: 'Menstruacione që zakonisht zgjasin disa ditë.',
      },
      {
        title: 'Rrjedhje e ndryshueshme',
        text: 'Rrjedhje më e bollshme në fillim, pastaj më e lehtë.',
      },
      {
        title: 'Ngjyra',
        text: 'Nga e kuqe e ndezur te e kuqe e errët ose kafe nga fundi i menstruacioneve.',
      },
      {
        title: 'Ndjesitë',
        text: 'Mund të ndihen kramba të buta deri të moderuara.',
      },
    ],
    warningTitle: 'Kur duhet të kërkosh këshillë mjekësore?',
    warningSigns: [
      'Dhimbje shumë intensive ose e pazakontë',
      'Gjakderdhje që e lag shumë shpejt një pecetë higjienike ose një tampon',
      'Lodhje e madhe, ndjesi e të fikëtit ose marramendje',
      'Një ndryshim i papritur dhe i vazhdueshëm nga modeli yt i zakonshëm',
    ],
    body4: 'Zakone të thjeshta mund të ndihmojnë të lehtësosh siklletin dhe t’i bëjnë ditët e para të menstruacioneve më të rehatshme.',
    tipsTitle: 'Këshilla praktike',
    tips: [
      'Pi mjaftueshëm\nujë për të ndihmuar\nnë kufizimin e lodhjes.',
      'Vendos të nxehtë\nnë pjesën e poshtme\ntë barkut nëse ka nevojë.',
      'Provo aktivitete\ntë buta: ecje,\nyoga dhe shtrirje.',
      'Jepi vetes pushim\ndhe një gjumë\nme cilësi të mirë.',
    ],
    reliefTitle: 'Dëgjo trupin tënd',
    reliefText: 'Pushimi, e nxehta dhe aktiviteti i butë mund të ndihmojnë. Nëse dhimbja mbetet shumë intensive ose e pazakontë, kërko këshillë mjekësore.',
    shareMessage: 'Të kuptosh menstruacionet e tua: çfarë ndodh në të vërtetë — AWA',
  },
  ja: {
    badge: '生理周期',
    title: '生理を理解する：\n体の中で何が起きているのか',
    metaDuration: '読了時間5分',
    metaValidated: '確認済みの内容',
    intro: '生理は、ホルモンと生殖の健康に欠かせない自然なしくみの一部です。体の中で何が起きているかを知ると、周期のたびに安心して過ごしやすくなります。',
    contentsTitle: 'この記事の内容',
    topics: [
      '生理とは？',
      '生理の経過',
      'ふつうの状態とそうでない状態',
      '自然な方法で痛みをやわらげる',
    ],
    body1: '生理とは、受精が起こらなかったときに子宮内膜がはがれ落ちることです。平均して、およそ月に1回起こります。',
    knowTitle: '知っておきたいこと',
    knowText: '女性は一人ひとり違います。期間、量、感じ方は、周期ごとに変わることがあります。',
    body2: '生理中の経血は、ずっと同じではありません。たいてい、量、色、質感が日ごとに変わります。',
    flowSteps: [
      {
        title: '生理の始まり',
        text: '最初の数日は、経血量が多いことがよくあります。',
      },
      {
        title: '生理の中ごろ',
        text: '一般に、経血量が少しずつ減り始めます。',
      },
      {
        title: '生理の終わり',
        text: '経血量が少なくなり、色が濃くなることがあります。',
      },
    ],
    softInfoTitle: '心に留めておきたいこと',
    softInfoText: 'これは周期ごとに変わることがあります。いちばん大切なのは、ご自身のいつものリズムを知ることです。',
    body3: '生理中は、よくある変化がいくつかあります。一方で、とくに初めてのときや非常に強いときは、より注意が必要なサインもあります。',
    normalSigns: [
      {
        title: '期間',
        text: 'ふだん、数日間続く生理です。',
      },
      {
        title: '経血量の変化',
        text: '最初は多く、そのあと少なくなります。',
      },
      {
        title: '色',
        text: '鮮やかな赤から、生理の終わりに向けて暗い赤や茶色に変わります。',
      },
      {
        title: '感覚',
        text: '軽い〜中程度の痛みを感じることがあります。',
      },
    ],
    warningTitle: '医師に相談するタイミングは？',
    warningSigns: [
      '非常に強い、またはいつもと違う痛み',
      'ナプキンやタンポンがすぐにいっぱいになるほどの出血',
      '強い疲れ、気が遠くなる感じ、めまい',
      'いつもの状態から突然変わり、それが続く',
    ],
    body4: '簡単な習慣で不快感をやわらげ、生理の最初の数日を少し楽に過ごせます。',
    tipsTitle: '実用的なヒント',
    tips: [
      '水分を十分に\nとって、疲れを\nやわらげましょう。',
      '必要に応じて、\n下腹部を\n温めましょう。',
      'ウォーキング、\nヨガ、ストレッチなど\n軽い運動を試しましょう。',
      'しっかり休んで、\n質のよい睡眠を\nとりましょう。',
    ],
    reliefTitle: '体の声に耳を傾けましょう',
    reliefText: '休息、温めること、軽い運動が助けになります。痛みが非常に強いままだったり、いつもと違ったりする場合は、医師に相談してください。',
    shareMessage: '生理を理解する：体の中で何が起きているのか — AWA',
  },
  ko: {
    badge: '생리 주기',
    title: '생리 이해하기,\n몸에서 실제로 일어나는 일',
    metaDuration: '읽는 데 5분',
    metaValidated: '검토된 콘텐츠',
    intro: '생리는 호르몬 건강과 생식 건강에 꼭 필요한 자연스러운 과정의 일부예요. 몸에서 어떤 일이 일어나는지 이해하면 매 주기를 더 편안하게 보낼 수 있어요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '생리란 무엇일까요?',
      '생리는 어떻게 진행될까요',
      '정상인 경우와 아닌 경우',
      '통증을 자연스럽게 덜기',
    ],
    body1: '생리는 수정이 일어나지 않았을 때 자궁 내막이 떨어져 나오는 것이에요. 평균적으로 한 달에 한 번 일어나요.',
    knowTitle: '알아두면 좋아요',
    knowText: '사람마다 모두 달라요. 기간, 강도, 느낌은 주기마다 다를 수 있어요.',
    body2: '출혈량은 생리 기간 내내 똑같지 않아요. 보통 날마다 양, 색, 질감이 달라져요.',
    flowSteps: [
      {
        title: '생리 시작',
        text: '처음 며칠 동안은 출혈량이 더 많은 경우가 많아요.',
      },
      {
        title: '생리 중반',
        text: '출혈량이 보통 서서히 줄기 시작해요.',
      },
      {
        title: '생리 끝 무렵',
        text: '출혈량이 적어지고 색이 더 어두워질 수 있어요.',
      },
    ],
    softInfoTitle: '기억해 두세요',
    softInfoText: '주기마다 다를 수 있어요. 가장 중요한 것은 나의 평소 리듬을 아는 거예요.',
    body3: '생리 중에는 흔히 나타나는 변화가 있어요. 특히 처음 겪거나 매우 심한 경우에는 더 주의 깊게 살펴봐야 하는 신호도 있어요.',
    normalSigns: [
      {
        title: '기간',
        text: '보통 며칠 동안 이어지는 생리예요.',
      },
      {
        title: '달라지는 출혈량',
        text: '처음에는 많고 점차 적어져요.',
      },
      {
        title: '색',
        text: '선홍색에서 짙은 붉은색, 생리가 끝날 무렵에는 갈색까지 다양해요.',
      },
      {
        title: '느낌',
        text: '가볍거나 중간 정도의 생리통이 느껴질 수 있어요.',
      },
    ],
    warningTitle: '언제 진료를 받아야 할까요?',
    warningSigns: [
      '매우 심하거나 평소와 다른 통증',
      '패드나 탐폰이 아주 빨리 젖을 만큼의 출혈',
      '심한 피로, 쓰러질 것 같은 느낌, 어지러움',
      '평소 패턴이 갑자기 바뀌고 계속되는 경우',
    ],
    body4: '간단한 습관이 불편함을 덜어 주고 생리 첫날들을 더 편안하게 보내는 데 도움이 될 수 있어요.',
    tipsTitle: '실용적인 팁',
    tips: [
      '물을 충분히\n마셔서 피로를\n덜어요.',
      '필요하면 아랫배에\n따뜻하게\n찜질해요.',
      '걷기, 요가,\n스트레칭 같은\n가벼운 활동을 해요.',
      '충분히 쉬고\n질 좋은 잠을\n자요.',
    ],
    reliefTitle: '몸의 소리에 귀 기울이기',
    reliefText: '휴식, 온기, 가벼운 활동이 도움이 될 수 있어요. 통증이 계속 매우 심하거나 평소와 다르다면 진료를 받으세요.',
    shareMessage: '생리 이해하기, 몸에서 실제로 일어나는 일 — AWA',
  },
  'pt-PT': {
    badge: 'CICLO MENSTRUAL',
    title: 'Compreender o seu período:\no que acontece realmente',
    metaDuration: '5 min de leitura',
    metaValidated: 'Conteúdo revisto',
    intro: 'O seu período faz parte de um processo natural essencial para a saúde hormonal e reprodutiva. Compreender o que se passa no seu corpo pode ajudá-la a sentir-se mais à vontade em cada ciclo.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que é o período?',
      'Como decorre o período',
      'O que é normal (e o que não é)',
      'Aliviar a dor de forma natural',
    ],
    body1: 'O período é a eliminação do revestimento do útero quando não ocorreu fecundação. Acontece, em média, uma vez por mês.',
    knowTitle: 'Bom saber',
    knowText: 'Cada mulher é única: a duração, a intensidade e as sensações podem variar de um ciclo para o seguinte.',
    body2: 'O fluxo não é igual durante todo o período. Costuma mudar de dia para dia, em intensidade, cor e textura.',
    flowSteps: [
      {
        title: 'Início do período',
        text: 'O fluxo é muitas vezes mais abundante nos primeiros dias.',
      },
      {
        title: 'Meio do período',
        text: 'O fluxo começa geralmente a diminuir gradualmente.',
      },
      {
        title: 'Fim do período',
        text: 'O fluxo torna-se mais leve e pode assumir uma cor mais escura.',
      },
    ],
    softInfoTitle: 'A ter presente',
    softInfoText: 'Isto pode variar de um ciclo para outro. O mais importante é conhecer o seu ritmo habitual.',
    body3: 'Algumas variações são frequentes durante o período. Outros sinais merecem mais atenção, sobretudo quando são novos ou muito intensos.',
    normalSigns: [
      {
        title: 'Duração',
        text: 'Um período que costuma durar alguns dias.',
      },
      {
        title: 'Fluxo variável',
        text: 'Fluxo mais abundante no início e depois mais leve.',
      },
      {
        title: 'Cor',
        text: 'De vermelho vivo a vermelho escuro ou castanho no final do período.',
      },
      {
        title: 'Sensações',
        text: 'Podem sentir-se cólicas ligeiras a moderadas.',
      },
    ],
    warningTitle: 'Quando procurar aconselhamento médico?',
    warningSigns: [
      'Dor muito intensa ou invulgar',
      'Hemorragia que encharca um penso ou um tampão muito depressa',
      'Cansaço acentuado, sensação de desmaio ou tonturas',
      'Uma alteração súbita e persistente em relação ao seu padrão habitual',
    ],
    body4: 'Hábitos simples podem ajudar a aliviar o desconforto e a tornar os primeiros dias do período mais confortáveis.',
    tipsTitle: 'Dicas práticas',
    tips: [
      'Beba água suficiente\npara ajudar a\nlimitar o cansaço.',
      'Aplique calor na parte\ninferior do\nabdómen, se necessário.',
      'Experimente uma atividade\nsuave: caminhada,\nioga, alongamentos.',
      'Dê-se descanso\ne um sono\nde boa qualidade.',
    ],
    reliefTitle: 'Ouça o seu corpo',
    reliefText: 'O descanso, o calor e a atividade suave podem ajudar. Se a dor se mantiver muito intensa ou invulgar, procure aconselhamento médico.',
    shareMessage: 'Compreender o seu período: o que acontece realmente — AWA',
  },
  bn: {
    badge: 'মাসিক চক্র',
    title: 'আপনার মাসিক বুঝুন:\nআসলে কী ঘটছে',
    metaDuration: '5 মিনিটের পাঠ',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'আপনার মাসিক একটি স্বাভাবিক প্রক্রিয়ার অংশ, যা হরমোন ও প্রজননস্বাস্থ্যের জন্য অপরিহার্য। আপনার শরীরে কী ঘটছে তা বুঝলে প্রতিটি চক্রে আপনি আরও স্বচ্ছন্দ বোধ করতে পারেন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'মাসিক কী?',
      'মাসিক কীভাবে এগোয়',
      'কোনটি স্বাভাবিক (এবং কোনটি নয়)',
      'প্রাকৃতিক উপায়ে ব্যথা কমানো',
    ],
    body1: 'গর্ভধারণ না হলে জরায়ুর আস্তরণ ঝরে যাওয়াই মাসিক। এটি গড়ে মাসে একবার ঘটে।',
    knowTitle: 'জেনে রাখা ভালো',
    knowText: 'প্রতিটি নারী অনন্য: স্থায়িত্ব, তীব্রতা ও অনুভূতি এক চক্র থেকে আরেক চক্রে আলাদা হতে পারে।',
    body2: 'পুরো মাসিক জুড়ে রক্তক্ষরণ একই রকম থাকে না। সাধারণত তীব্রতা, রঙ ও ঘনত্বে প্রতিদিন পরিবর্তন হয়।',
    flowSteps: [
      {
        title: 'মাসিকের শুরু',
        text: 'প্রথম কয়েক দিনে রক্তক্ষরণ প্রায়ই বেশি হয়।',
      },
      {
        title: 'মাসিকের মাঝামাঝি',
        text: 'রক্তক্ষরণ সাধারণত ধীরে ধীরে কমতে শুরু করে।',
      },
      {
        title: 'মাসিকের শেষ',
        text: 'রক্তক্ষরণ হালকা হয়ে আসে এবং রঙ গাঢ় হতে পারে।',
      },
    ],
    softInfoTitle: 'মনে রাখবেন',
    softInfoText: 'এক চক্র থেকে আরেক চক্রে এটি বদলাতে পারে। সবচেয়ে গুরুত্বপূর্ণ হলো নিজের স্বাভাবিক ছন্দ জানা।',
    body3: 'মাসিকের সময় কিছু ভিন্নতা সাধারণ। অন্য কিছু লক্ষণে বেশি মনোযোগ দেওয়া উচিত, বিশেষ করে যখন সেগুলো নতুন বা খুব তীব্র।',
    normalSigns: [
      {
        title: 'স্থায়িত্ব',
        text: 'মাসিক সাধারণত কয়েক দিন স্থায়ী হয়।',
      },
      {
        title: 'পরিবর্তনশীল রক্তক্ষরণ',
        text: 'শুরুতে বেশি, তারপর হালকা।',
      },
      {
        title: 'রঙ',
        text: 'উজ্জ্বল লাল থেকে গাঢ় লাল বা মাসিকের শেষের দিকে বাদামি।',
      },
      {
        title: 'অনুভূতি',
        text: 'হালকা থেকে মাঝারি তলপেটে ব্যথা অনুভব হতে পারে।',
      },
    ],
    warningTitle: 'কখন চিকিৎসকের পরামর্শ নেবেন?',
    warningSigns: [
      'খুব তীব্র বা অস্বাভাবিক ব্যথা',
      'প্যাড বা ট্যাম্পন খুব দ্রুত ভিজে যায় এমন রক্তক্ষরণ',
      'উল্লেখযোগ্য ক্লান্তি, অজ্ঞান হয়ে যাওয়ার মতো অনুভূতি বা মাথা ঘোরা',
      'আপনার স্বাভাবিক ধরন থেকে হঠাৎ ও স্থায়ী পরিবর্তন',
    ],
    body4: 'সহজ কিছু অভ্যাস অস্বস্তি কমাতে এবং মাসিকের প্রথম দিনগুলো আরও আরামদায়ক করতে সাহায্য করতে পারে।',
    tipsTitle: 'ব্যবহারিক পরামর্শ',
    tips: [
      'পর্যাপ্ত পানি\nপান করুন, ক্লান্তি\nকমাতে সাহায্য করবে।',
      'প্রয়োজনে তলপেটে\nগরম সেঁক\nদিন।',
      'হালকা কিছু করুন:\nহাঁটা, যোগব্যায়াম,\nস্ট্রেচিং।',
      'নিজেকে বিশ্রাম\nও ভালো মানের\nঘুম দিন।',
    ],
    reliefTitle: 'নিজের শরীরের কথা শুনুন',
    reliefText: 'বিশ্রাম, গরম সেঁক এবং হালকা কার্যকলাপ সাহায্য করতে পারে। ব্যথা খুব তীব্র বা অস্বাভাবিক থাকলে চিকিৎসকের পরামর্শ নিন।',
    shareMessage: 'আপনার মাসিক বুঝুন: আসলে কী ঘটছে — AWA',
  },
  da: {
    badge: 'MENSTRUATIONSCYKLUS',
    title: 'Forstå din menstruation:\nhvad der egentlig sker',
    metaDuration: '5 min læsning',
    metaValidated: 'Gennemgået indhold',
    intro: 'Din menstruation er en del af en naturlig proces, der er afgørende for hormoner og reproduktivt helbred. At forstå, hvad der sker i din krop, kan hjælpe dig med at føle dig mere tryg i løbet af hver cyklus.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er menstruation?',
      'Hvordan forløbet foregår',
      'Hvad er normalt (og hvad er det ikke)',
      'Naturlig lindring af smerter',
    ],
    body1: 'Menstruation er afstødningen af livmoderslimhinden, når graviditet ikke har fundet sted. Det sker i gennemsnit én gang om måneden.',
    knowTitle: 'Godt at vide',
    knowText: 'Alle er unikke: varighed, intensitet og fornemmelse kan variere fra cyklus til cyklus.',
    body2: 'Blødningen er ikke ens hele menstruationen igennem. Intensitet, farve og konsistens ændrer sig normalt fra dag til dag.',
    flowSteps: [
      {
        title: 'Starten af menstruationen',
        text: 'Blødningen er ofte kraftigst de første dage.',
      },
      {
        title: 'Midt i menstruationen',
        text: 'Blødningen begynder normalt gradvist at aftage.',
      },
      {
        title: 'Slutningen af menstruationen',
        text: 'Blødningen bliver lettere og kan blive mørkere i farven.',
      },
    ],
    softInfoTitle: 'Husk',
    softInfoText: 'Det kan variere fra cyklus til cyklus. Det vigtigste er at kende sin egen normale rytme.',
    body3: 'Visse variationer under menstruationen er normale. Andre tegn fortjener mere opmærksomhed, særligt når de er nye eller meget intense.',
    normalSigns: [
      {
        title: 'Varighed',
        text: 'Menstruationen varer normalt et par dage.',
      },
      {
        title: 'Varierende blødning',
        text: 'Kraftigere i starten, derefter lettere.',
      },
      {
        title: 'Farve',
        text: 'Fra klar rød til mørk rød eller brun mod slutningen.',
      },
      {
        title: 'Fornemmelse',
        text: 'Lette til moderate smerter i underlivet er mulige.',
      },
    ],
    warningTitle: 'Hvornår bør du søge medicinsk rådgivning?',
    warningSigns: [
      'Meget stærke eller atypiske smerter',
      'Blødning der gennemvæder bind/tampon meget hurtigt',
      'Markant træthed, besvimelseslignende fornemmelse eller svimmelhed',
      'Pludselig og vedvarende ændring fra dit normale mønster',
    ],
    body4: 'Visse enkle vaner kan hjælpe med at reducere ubehag og gøre de første dage af din menstruation mere komfortable.',
    tipsTitle: 'Praktiske råd',
    tips: [
      'Drik nok\nvand for at\nmodvirke træthed.',
      'Brug om nødvendigt\nen varmepude\npå underlivet.',
      'Lav noget blidt:\ngåture, yoga,\nudstrækning.',
      'Giv dig selv\nhvile og\ngod søvn.',
    ],
    reliefTitle: 'Lyt til din krop',
    reliefText: 'Hvile, varme og blid aktivitet kan hjælpe. Søg læge, hvis smerterne er meget stærke eller atypiske.',
    shareMessage: 'Forstå din menstruation: hvad der egentlig sker — AWA',
  },
  sv: {
    badge: 'MENSTRUATIONSCYKLUS',
    title: 'Forstå din menstruation:\nhvad der egentlig sker',
    metaDuration: '5 min läsning',
    metaValidated: 'Gennemgået indhold',
    intro: 'Din menstruation ar en del av en naturlig proces, der ar afgörende for hormoner och reproduktivt helbred. At forstå, hvad der sker i din krop, kan hjälpe dig med at föle dig mere tryg i löbet av hver cyklus.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar menstruation?',
      'Hvordan forlöbet foregår',
      'Hvad ar normalt (og hvad ar det ikke)',
      'Naturlig lindring av smerter',
    ],
    body1: 'Menstruation ar afstödningen av livmoderslimhinden, når graviditet inte har fundet sted. Det sker i gennemsnit én gang om måneden.',
    knowTitle: 'Godt at vide',
    knowText: 'Alla ar unikke: varighed, intensitet och fornemmelse kan variere fran cyklus till cyklus.',
    body2: 'Blödningen ar inte ens hele menstruationen igennem. Intensitet, farve och konsistens ändrer sig normalt fran dag till dag.',
    flowSteps: [
      {
        title: 'Starten av menstruationen',
        text: 'Blödningen ar ofta kraftigst de förste dagar.',
      },
      {
        title: 'Midt i menstruationen',
        text: 'Blödningen begynder normalt gradvist at aftage.',
      },
      {
        title: 'Slutningen av menstruationen',
        text: 'Blödningen bliver lettere och kan blive mörkere i farven.',
      },
    ],
    softInfoTitle: 'Husk',
    softInfoText: 'Det kan variere fran cyklus till cyklus. Det vigtigste ar at kende sin egen normale rytme.',
    body3: 'Visse variationer under menstruationen ar normale. Andre tegn fortjener mere opmärksomhed, särligt når de ar nye eller mycket intense.',
    normalSigns: [
      {
        title: 'Varighed',
        text: 'Menstruationen varer normalt et par dagar.',
      },
      {
        title: 'Varierende blödning',
        text: 'Kraftigere i starten, derefter lettere.',
      },
      {
        title: 'Farve',
        text: 'Fra klar röd till mörk röd eller brun mod slutningen.',
      },
      {
        title: 'Fornemmelse',
        text: 'Lette till moderate smartor i underlivet ar mulige.',
      },
    ],
    warningTitle: 'Hvornår bör du söge medicinsk rådgivning?',
    warningSigns: [
      'Meget stärke eller atypiske smerter',
      'Blödning der gennemväder bind/tampon mycket hurtigt',
      'Markant träthed, besvimelseslignende fornemmelse eller svimmelhed',
      'Pludselig och vedvarende ändring fran ditt normale mönster',
    ],
    body4: 'Visse enkle vaner kan hjälpe med at reducere ubehag och göre de förste dagar av din menstruation mere komfortable.',
    tipsTitle: 'Praktiske råd',
    tips: [
      'Drik nok\nvand for at\nmodvirke träthed.',
      'Brug om nödvendigt\nen varmepude\npå underlivet.',
      'Lav noget blidt:\ngåture, yoga,\nudsträkning.',
      'Giv dig selv\nhvile og\ngod sövn.',
    ],
    reliefTitle: 'Lyt till din krop',
    reliefText: 'Hvile, varme och blid aktivitet kan hjälpe. Sög läge, hvis smerterne ar mycket stärke eller atypiske.',
    shareMessage: 'Forstå din menstruation: hvad der egentlig sker — AWA',
  },
  nb: {
    badge: 'MENSTRUASJONSSYKLUS',
    title: 'Forstå mensen din:\nhva som egentlig skjer',
    metaDuration: '5 min lesing',
    metaValidated: 'Gjennomgått innhold',
    intro:
      'Mensen din er en del av en naturlig prosess som er avgjørende for hormonell og reproduktiv helse. Å forstå hva som skjer i kroppen din kan hjelpe deg å føle deg tryggere i hver syklus.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er mens?',
      'Hvordan mensen forløper',
      'Hva som er normalt (og hva som ikke er det)',
      'Lindre smerter naturlig',
    ],
    body1:
      'Mens er utstøtingen av livmorslimhinnen når det ikke har skjedd noen befruktning. Dette skjer i gjennomsnitt én gang i måneden.',
    knowTitle: 'Godt å vite',
    knowText:
      'Hver kvinne er unik: varighet, styrke og fornemmelser kan variere fra en syklus til den neste.',
    body2:
      'Blødningen er ikke den samme gjennom hele mensen. Den endrer seg vanligvis fra dag til dag, i styrke, farge og konsistens.',
    flowSteps: [
      {title: 'Starten på mensen', text: 'Blødningen er ofte kraftigere de første dagene.'},
      {title: 'Midt i mensen', text: 'Blødningen begynner vanligvis å avta gradvis.'},
      {title: 'Slutten på mensen', text: 'Blødningen blir lettere og kan få en mørkere farge.'},
    ],
    softInfoTitle: 'Husk',
    softInfoText:
      'Dette kan variere fra en syklus til en annen. Det som betyr mest, er å kjenne din egen vanlige rytme.',
    body3:
      'Noen variasjoner er vanlige under mensen. Andre tegn fortjener mer oppmerksomhet, særlig når de er nye eller svært intense.',
    normalSigns: [
      {title: 'Varighet', text: 'En mens som vanligvis varer noen dager.'},
      {title: 'Varierende blødning', text: 'Kraftigere blødning først, deretter lettere.'},
      {title: 'Farge', text: 'Fra knallrød til mørkerød eller brun mot slutten av mensen.'},
      {title: 'Fornemmelser', text: 'Milde til moderate kramper kan kjennes.'},
    ],
    warningTitle: 'Når bør du søke medisinsk råd?',
    warningSigns: [
      'Svært intense eller uvanlige smerter',
      'Blødning som gjennomvåter et bind eller en tampong svært raskt',
      'Betydelig tretthet, følelse av å besvime eller svimmelhet',
      'En plutselig og vedvarende endring fra ditt vanlige mønster',
    ],
    body4:
      'Enkle vaner kan hjelpe med å lindre ubehag og gjøre de første dagene av mensen mer behagelige.',
    tipsTitle: 'Praktiske tips',
    tips: [
      'Drikk nok\nvann for å bidra til\nå begrense trettheten.',
      'Legg varme\npå nedre del av\nmagen ved behov.',
      'Prøv en mild\naktivitet: gåing,\nyoga, tøyning.',
      'Gi deg selv\nhvile og søvn\nav god kvalitet.',
    ],
    reliefTitle: 'Lytt til kroppen din',
    reliefText:
      'Hvile, varme og mild aktivitet kan hjelpe. Hvis smerten fortsatt er svært intens eller uvanlig, bør du søke medisinsk råd.',
    shareMessage: 'Forstå mensen din: hva som egentlig skjer – AWA',
  },
  pl: {
    badge: 'CYKL MIESIĄCZKOWY',
    title: 'Zrozumieć swoją miesiączkę:\nco naprawdę się dzieje',
    metaDuration: '5 min czytania',
    metaValidated: 'Treść zweryfikowana',
    intro:
      'Miesiączka jest częścią naturalnego procesu, niezbędnego dla zdrowia hormonalnego i rozrodczego. Zrozumienie, co dzieje się w Twoim ciele, może pomóc Ci czuć się swobodniej w każdym cyklu.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym jest miesiączka?',
      'Jak przebiega miesiączka',
      'Co jest normalne (a co nie)',
      'Naturalne łagodzenie bólu',
    ],
    body1:
      'Miesiączka to złuszczenie błony śluzowej macicy, gdy nie doszło do zapłodnienia. Zdarza się to średnio raz w miesiącu.',
    knowTitle: 'Warto wiedzieć',
    knowText:
      'Każda kobieta jest wyjątkowa: czas trwania, intensywność i odczucia mogą się różnić w kolejnych cyklach.',
    body2:
      'Krwawienie nie jest takie samo przez całą miesiączkę. Zwykle zmienia się z dnia na dzień pod względem obfitości, koloru i konsystencji.',
    flowSteps: [
      {title: 'Początek miesiączki', text: 'Krwawienie jest często obfitsze w pierwszych dniach.'},
      {title: 'Środek miesiączki', text: 'Krwawienie zazwyczaj zaczyna stopniowo słabnąć.'},
      {title: 'Koniec miesiączki', text: 'Krwawienie staje się słabsze i może mieć ciemniejszy kolor.'},
    ],
    softInfoTitle: 'Pamiętaj',
    softInfoText:
      'Może się to różnić w kolejnych cyklach. Najważniejsza jest znajomość własnego zwykłego rytmu.',
    body3:
      'Niektóre różnice podczas miesiączki są częste. Inne oznaki zasługują na większą uwagę, zwłaszcza gdy są nowe lub bardzo nasilone.',
    normalSigns: [
      {title: 'Czas trwania', text: 'Miesiączka, która zwykle trwa kilka dni.'},
      {title: 'Zmienna obfitość', text: 'Obfitsze krwawienie na początku, potem słabsze.'},
      {title: 'Kolor', text: 'Od jasnoczerwonego do ciemnoczerwonego lub brązowego pod koniec miesiączki.'},
      {title: 'Odczucia', text: 'Można odczuwać łagodne lub umiarkowane skurcze.'},
    ],
    warningTitle: 'Kiedy zasięgnąć porady lekarskiej?',
    warningSigns: [
      'Bardzo silny lub nietypowy ból',
      'Krwawienie, które bardzo szybko przesiąka przez podpaskę lub tampon',
      'Znaczne zmęczenie, uczucie osłabienia lub zawroty głowy',
      'Nagła i trwała zmiana w stosunku do Twojego zwykłego wzorca',
    ],
    body4:
      'Proste nawyki mogą pomóc złagodzić dyskomfort i sprawić, że pierwsze dni miesiączki będą wygodniejsze.',
    tipsTitle: 'Praktyczne wskazówki',
    tips: [
      'Pij dużo\nwody, aby\nograniczyć\nzmęczenie.',
      'W razie\npotrzeby przyłóż\nciepło do\npodbrzusza.',
      'Spróbuj łagodnej\naktywności: spacer,\njoga, rozciąganie.',
      'Daj sobie\nodpoczynek i\ndobry sen.',
    ],
    reliefTitle: 'Słuchaj swojego ciała',
    reliefText:
      'Odpoczynek, ciepło i łagodna aktywność mogą pomóc. Jeśli ból pozostaje bardzo silny lub nietypowy, zasięgnij porady lekarskiej.',
    shareMessage: 'Zrozumieć swoją miesiączkę: co naprawdę się dzieje — AWA',
  },
  uk: {
    badge: 'МЕНСТРУАЛЬНИЙ ЦИКЛ',
    title: 'Розуміння вашої менструації:\nщо насправді відбувається',
    metaDuration: '5 хв читання',
    metaValidated: 'Перевірений вміст',
    intro:
      'Менструація — частина природного процесу, необхідного для гормонального та репродуктивного здоров’я. Розуміння того, що відбувається у вашому тілі, може допомогти вам почуватися спокійніше в кожному циклі.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке менструація?',
      'Як перебігає менструація',
      'Що нормально (а що ні)',
      'Природне полегшення болю',
    ],
    body1:
      'Менструація — це відшарування слизової оболонки матки, коли запліднення не відбулося. Це трапляється в середньому раз на місяць.',
    knowTitle: 'Варто знати',
    knowText:
      'Кожна жінка унікальна: тривалість, інтенсивність і відчуття можуть змінюватися від циклу до циклу.',
    body2:
      'Виділення не однакові протягом усієї менструації. Зазвичай вони змінюються з дня на день за інтенсивністю, кольором і текстурою.',
    flowSteps: [
      {title: 'Початок менструації', text: 'Виділення часто рясніші в перші дні.'},
      {title: 'Середина менструації', text: 'Виділення зазвичай починають поступово зменшуватися.'},
      {title: 'Кінець менструації', text: 'Виділення стають слабшими й можуть набувати темнішого кольору.'},
    ],
    softInfoTitle: 'Пам’ятайте',
    softInfoText:
      'Це може відрізнятися від циклу до циклу. Найважливіше — знати власний звичайний ритм.',
    body3:
      'Деякі відмінності під час менструації поширені. Інші ознаки заслуговують на більшу увагу, особливо коли вони нові або дуже інтенсивні.',
    normalSigns: [
      {title: 'Тривалість', text: 'Менструація, що зазвичай триває кілька днів.'},
      {title: 'Змінні виділення', text: 'Спочатку рясніші, потім слабші.'},
      {title: 'Колір', text: 'Від яскраво-червоного до темно-червоного чи коричневого наприкінці менструації.'},
      {title: 'Відчуття', text: 'Можуть відчуватися слабкі або помірні спазми.'},
    ],
    warningTitle: 'Коли звертатися за медичною порадою?',
    warningSigns: [
      'Дуже сильний або нетиповий біль',
      'Кровотеча, що дуже швидко просочує прокладку чи тампон',
      'Значна втома, відчуття слабкості або запаморочення',
      'Раптова й стійка зміна порівняно з вашим звичним характером',
    ],
    body4:
      'Прості звички можуть допомогти полегшити дискомфорт і зробити перші дні менструації зручнішими.',
    tipsTitle: 'Практичні поради',
    tips: [
      'Пийте достатньо\nводи, щоб\nобмежити втому.',
      'За потреби прикладіть\nтепло до\nнизу живота.',
      'Спробуйте м’яку\nактивність: ходьба,\nйога, розтяжка.',
      'Дайте собі\nвідпочинок і\nякісний сон.',
    ],
    reliefTitle: 'Прислухайтеся до свого тіла',
    reliefText:
      'Відпочинок, тепло та м’яка активність можуть допомогти. Якщо біль залишається дуже сильним або нетиповим, зверніться за медичною порадою.',
    shareMessage: 'Розуміння вашої менструації: що насправді відбувається — AWA',
  },
  cs: {
    badge: 'MENSTRUAČNÍ CYKLUS',
    title: 'Pochopení menstruace:\nco se skutečně děje',
    metaDuration: '5 min čtení',
    metaValidated: 'Ověřený obsah',
    intro:
      'Vaše menstruace je součástí přirozeného procesu, který je zásadní pro hormonální a reprodukční zdraví. Pochopení toho, co se ve vašem těle děje, vám může pomoci cítit se s každým cyklem klidněji.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co je menstruace?',
      'Jak menstruace probíhá',
      'Co je normální (a co ne)',
      'Přirozená úleva od bolesti',
    ],
    body1:
      'Menstruace je odloučení děložní sliznice, pokud nedošlo k oplodnění. Děje se to průměrně jednou měsíčně.',
    knowTitle: 'Stojí za to vědět',
    knowText:
      'Každá žena je jedinečná: délka, intenzita a pocity se mohou cyklus od cyklu lišit.',
    body2:
      'Krvácení není během celé menstruace stejné. Obvykle se den ode dne mění v intenzitě, barvě i konzistenci.',
    flowSteps: [
      {title: 'Začátek menstruace', text: 'Krvácení bývá v prvních dnech silnější.'},
      {title: 'Střed menstruace', text: 'Krvácení obecně začíná postupně slábnout.'},
      {title: 'Konec menstruace', text: 'Krvácení je slabší a může mít tmavší barvu.'},
    ],
    softInfoTitle: 'Mějte na paměti',
    softInfoText:
      'To se může cyklus od cyklu lišit. Nejdůležitější je znát vlastní obvyklý rytmus.',
    body3:
      'Některé odchylky jsou během menstruace běžné. Jiným příznakům stojí za to věnovat větší pozornost, zejména když jsou nové nebo velmi intenzivní.',
    normalSigns: [
      {title: 'Délka', text: 'Menstruace, která obvykle trvá několik dní.'},
      {title: 'Proměnlivé krvácení', text: 'Nejprve silnější krvácení, poté slabší.'},
      {title: 'Barva', text: 'Od jasně červené po tmavě červenou nebo hnědou ke konci menstruace.'},
      {title: 'Pocity', text: 'Mohou se objevit mírné až střední křeče.'},
    ],
    warningTitle: 'Kdy vyhledat lékařskou radu?',
    warningSigns: [
      'Velmi intenzivní nebo neobvyklá bolest',
      'Krvácení, které velmi rychle prosákne vložku nebo tampon',
      'Výrazná únava, pocit na omdlení nebo závrať',
      'Náhlá a přetrvávající změna oproti vašemu obvyklému průběhu',
    ],
    body4:
      'Jednoduché návyky mohou pomoci zmírnit nepohodlí a učinit první dny menstruace příjemnějšími.',
    tipsTitle: 'Praktické tipy',
    tips: [
      'Pijte dostatek\nvody, abyste\nomezila únavu.',
      'V případě potřeby\npřiložte teplo\nna podbřišek.',
      'Zkuste jemnou\naktivitu: chůzi,\njógu, protahování.',
      'Dopřejte si\nodpočinek a\nkvalitní spánek.',
    ],
    reliefTitle: 'Naslouchejte svému tělu',
    reliefText:
      'Pomoci může odpočinek, teplo a jemná aktivita. Pokud bolest zůstává velmi intenzivní nebo neobvyklá, vyhledejte lékařskou radu.',
    shareMessage: 'Pochopení menstruace: co se skutečně děje — AWA',
  },
  sk: {
    badge: 'MENŠTRUAČNÝ CYKLUS',
    title: 'Pochopenie menštruácie:\nčo sa skutočne deje',
    metaDuration: '5 min čítania',
    metaValidated: 'Overený obsah',
    intro:
      'Vaša menštruácia je súčasťou prirodzeného procesu, ktorý je nevyhnutný pre hormonálne a reprodukčné zdravie. Pochopenie toho, čo sa deje vo vašom tele, vám môže pomôcť cítiť sa pri každom cykle pokojnejšie.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo je menštruácia?',
      'Ako menštruácia prebieha',
      'Čo je normálne (a čo nie)',
      'Prirodzené zmiernenie bolesti',
    ],
    body1:
      'Menštruácia je odlúčenie sliznice maternice, keď nedošlo k oplodneniu. Deje sa to priemerne raz za mesiac.',
    knowTitle: 'Stojí za to vedieť',
    knowText:
      'Každá žena je jedinečná: trvanie, intenzita a pocity sa môžu z cyklu na cyklus líšiť.',
    body2:
      'Krvácanie nie je počas celej menštruácie rovnaké. Zvyčajne sa z dňa na deň mení v intenzite, farbe a štruktúre.',
    flowSteps: [
      {title: 'Začiatok menštruácie', text: 'Krvácanie je počas prvých dní často silnejšie.'},
      {title: 'Stred menštruácie', text: 'Krvácanie sa vo všeobecnosti začína postupne zmenšovať.'},
      {title: 'Koniec menštruácie', text: 'Krvácanie slabne a môže mať tmavšiu farbu.'},
    ],
    softInfoTitle: 'Pamätajte',
    softInfoText:
      'Môže sa to z cyklu na cyklus líšiť. Najdôležitejšie je poznať svoj vlastný obvyklý rytmus.',
    body3:
      'Niektoré odchýlky sú počas menštruácie bežné. Iné znaky si zaslúžia väčšiu pozornosť, najmä keď sú nové alebo veľmi intenzívne.',
    normalSigns: [
      {title: 'Trvanie', text: 'Menštruácia, ktorá zvyčajne trvá niekoľko dní.'},
      {title: 'Meniace sa krvácanie', text: 'Spočiatku silnejšie krvácanie, potom slabšie.'},
      {title: 'Farba', text: 'Od jasne červenej po tmavočervenú alebo hnedú ku koncu menštruácie.'},
      {title: 'Pocity', text: 'Môžu sa pociťovať mierne až stredné kŕče.'},
    ],
    warningTitle: 'Kedy vyhľadať lekársku radu?',
    warningSigns: [
      'Veľmi intenzívna alebo nezvyčajná bolesť',
      'Krvácanie, ktoré veľmi rýchlo presiakne vložku alebo tampón',
      'Výrazná únava, pocit na odpadnutie alebo závraty',
      'Náhla a pretrvávajúca zmena oproti vášmu obvyklému priebehu',
    ],
    body4:
      'Jednoduché návyky môžu pomôcť zmierniť nepohodlie a urobiť prvé dni menštruácie pohodlnejšími.',
    tipsTitle: 'Praktické tipy',
    tips: [
      'Pite dostatok\nvody, aby ste\npomohli obmedziť únavu.',
      'V prípade potreby\nprikladajte teplo\nna podbruško.',
      'Skúste jemnú\naktivitu: chôdzu,\njogu, strečing.',
      'Doprajte si\nodpočinok a\nkvalitný spánok.',
    ],
    reliefTitle: 'Počúvajte svoje telo',
    reliefText:
      'Odpočinok, teplo a jemná aktivita môžu pomôcť. Ak bolesť zostáva veľmi intenzívna alebo nezvyčajná, vyhľadajte lekársku radu.',
    shareMessage: 'Pochopenie menštruácie: čo sa skutočne deje — AWA',
  },
  hu: {
    badge: 'MENSTRUÁCIÓS CIKLUS',
    title: 'A menstruációd megértése:\nmi történik valójában',
    metaDuration: '5 perc olvasás',
    metaValidated: 'Ellenőrzött tartalom',
    intro:
      'A menstruációd egy természetes folyamat része, amely elengedhetetlen a hormonális és reproduktív egészséghez. Ha megérted, mi történik a testedben, nyugodtabbnak érezheted magad minden ciklusnál.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi a menstruáció?',
      'Hogyan zajlik a menstruációd',
      'Mi a normális (és mi nem)',
      'A fájdalom természetes enyhítése',
    ],
    body1:
      'A menstruáció a méhnyálkahártya leválása, amikor nem történt megtermékenyítés. Ez átlagosan havonta egyszer történik.',
    knowTitle: 'Érdemes tudni',
    knowText:
      'Minden nő egyedi: az időtartam, az erősség és az érzetek ciklusról ciklusra eltérhetnek.',
    body2:
      'A vérzés nem azonos a menstruáció egész ideje alatt. Általában napról napra változik az erősségében, színében és állagában.',
    flowSteps: [
      {title: 'A menstruáció eleje', text: 'A vérzés az első napokban gyakran erősebb.'},
      {title: 'A menstruáció közepe', text: 'A vérzés általában fokozatosan csökkenni kezd.'},
      {title: 'A menstruáció vége', text: 'A vérzés gyengül, és sötétebb színt ölthet.'},
    ],
    softInfoTitle: 'Tartsd észben',
    softInfoText:
      'Ez ciklusról ciklusra eltérhet. A legfontosabb, hogy ismerd a saját szokásos ritmusodat.',
    body3:
      'Egyes eltérések gyakoriak a menstruáció alatt. Más jelek nagyobb figyelmet érdemelnek, különösen ha újak vagy nagyon intenzívek.',
    normalSigns: [
      {title: 'Időtartam', text: 'Menstruáció, amely általában néhány napig tart.'},
      {title: 'Változó vérzés', text: 'Eleinte erősebb, majd gyengébb vérzés.'},
      {title: 'Szín', text: 'Az élénkvöröstől a sötétvörösig vagy barnáig a menstruáció vége felé.'},
      {title: 'Érzetek', text: 'Enyhe vagy mérsékelt görcsök érezhetők.'},
    ],
    warningTitle: 'Mikor kérj orvosi tanácsot?',
    warningSigns: [
      'Nagyon intenzív vagy szokatlan fájdalom',
      'Vérzés, amely nagyon gyorsan átitatja a betétet vagy tampont',
      'Jelentős fáradtság, ájulásérzés vagy szédülés',
      'Hirtelen és tartós eltérés a szokásos mintádtól',
    ],
    body4:
      'Egyszerű szokások segíthetnek enyhíteni a kellemetlenséget, és kényelmesebbé tehetik a menstruáció első napjait.',
    tipsTitle: 'Praktikus tippek',
    tips: [
      'Igyál eleget,\nhogy segíts\nkorlátozni a fáradtságot.',
      'Szükség esetén\ntegyél meleget\naz alhasadra.',
      'Próbálj ki egy\nkíméletes aktivitást:\ngyaloglás, jóga, nyújtás.',
      'Engedj meg magadnak\npihenést és jó\nminőségű alvást.',
    ],
    reliefTitle: 'Figyelj a testedre',
    reliefText:
      'A pihenés, a meleg és a kíméletes aktivitás segíthet. Ha a fájdalom nagyon intenzív vagy szokatlan marad, kérj orvosi tanácsot.',
    shareMessage: 'A menstruációd megértése: mi történik valójában — AWA',
  },
  ro: {
    badge: 'CICLUL MENSTRUAL',
    title: 'Înțelegerea menstruației:\nce se întâmplă cu adevărat',
    metaDuration: '5 min de citit',
    metaValidated: 'Conținut revizuit',
    intro:
      'Menstruația ta face parte dintr-un proces natural esențial pentru sănătatea hormonală și reproductivă. Înțelegerea a ceea ce se întâmplă în corpul tău te poate ajuta să te simți mai liniștită la fiecare ciclu.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce este menstruația?',
      'Cum se desfășoară menstruația',
      'Ce este normal (și ce nu)',
      'Alinarea naturală a durerii',
    ],
    body1:
      'Menstruația este eliminarea mucoasei uterine atunci când nu a avut loc nicio fecundare. Aceasta se întâmplă în medie o dată pe lună.',
    knowTitle: 'Bine de știut',
    knowText:
      'Fiecare femeie este unică: durata, intensitatea și senzațiile pot varia de la un ciclu la altul.',
    body2:
      'Fluxul nu este același pe tot parcursul menstruației. De obicei se schimbă de la o zi la alta, ca intensitate, culoare și textură.',
    flowSteps: [
      {title: 'Începutul menstruației', text: 'Fluxul este adesea mai abundent în primele zile.'},
      {title: 'Mijlocul menstruației', text: 'Fluxul începe în general să scadă treptat.'},
      {title: 'Sfârșitul menstruației', text: 'Fluxul devine mai ușor și poate căpăta o culoare mai închisă.'},
    ],
    softInfoTitle: 'De ținut minte',
    softInfoText:
      'Aceasta poate varia de la un ciclu la altul. Ceea ce contează cel mai mult este să-ți cunoști propriul ritm obișnuit.',
    body3:
      'Unele variații sunt frecvente în timpul menstruației. Alte semne merită mai multă atenție, mai ales când sunt noi sau foarte intense.',
    normalSigns: [
      {title: 'Durata', text: 'O menstruație care durează de obicei câteva zile.'},
      {title: 'Flux variabil', text: 'Flux mai abundent la început, apoi mai ușor.'},
      {title: 'Culoarea', text: 'De la roșu aprins la roșu închis sau maro spre sfârșitul menstruației.'},
      {title: 'Senzații', text: 'Pot fi simțite crampe ușoare până la moderate.'},
    ],
    warningTitle: 'Când să ceri un sfat medical?',
    warningSigns: [
      'Durere foarte intensă sau neobișnuită',
      'Sângerare care îmbibă foarte repede un absorbant sau un tampon',
      'Oboseală importantă, senzație de leșin sau amețeală',
      'O schimbare bruscă și persistentă față de tiparul tău obișnuit',
    ],
    body4:
      'Obiceiurile simple pot ajuta la ameliorarea disconfortului și pot face primele zile ale menstruației mai confortabile.',
    tipsTitle: 'Sfaturi practice',
    tips: [
      'Bea suficientă\napă pentru a ajuta\nla limitarea oboselii.',
      'Aplică căldură\npe abdomenul\ninferior, la nevoie.',
      'Încearcă o\nactivitate blândă:\nmers, yoga, stretching.',
      'Acordă-ți odihnă\nși un somn\nde calitate.',
    ],
    reliefTitle: 'Ascultă-ți corpul',
    reliefText:
      'Odihna, căldura și activitatea blândă pot ajuta. Dacă durerea rămâne foarte intensă sau neobișnuită, cere un sfat medical.',
    shareMessage: 'Înțelegerea menstruației: ce se întâmplă cu adevărat — AWA',
  },
  bg: {
    badge: 'МЕНСТРУАЛЕН ЦИКЪЛ',
    title: 'Разбиране на менструацията:\nкакво наистина се случва',
    metaDuration: '5 мин четене',
    metaValidated: 'Проверено съдържание',
    intro:
      'Менструацията ти е част от естествен процес, съществен за хормоналното и репродуктивното здраве. Разбирането на онова, което се случва в тялото ти, може да ти помогне да се чувстваш по-спокойно във всеки цикъл.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво е менструация?',
      'Как протича менструацията ти',
      'Какво е нормално (и какво не е)',
      'Естествено облекчаване на болката',
    ],
    body1:
      'Менструацията е отделянето на маточната лигавица, когато не е настъпило оплождане. Това се случва средно веднъж месечно.',
    knowTitle: 'Добре е да знаеш',
    knowText:
      'Всяка жена е уникална: продължителността, интензивността и усещанията могат да варират от цикъл на цикъл.',
    body2:
      'Потокът не е един и същ през цялата менструация. Обикновено се променя от ден на ден по интензивност, цвят и консистенция.',
    flowSteps: [
      {title: 'Началото на менструацията', text: 'Потокът често е по-обилен през първите няколко дни.'},
      {title: 'Средата на менструацията', text: 'Потокът обикновено започва постепенно да намалява.'},
      {title: 'Краят на менструацията', text: 'Потокът става по-лек и може да придобие по-тъмен цвят.'},
    ],
    softInfoTitle: 'Помни',
    softInfoText:
      'Това може да варира от един цикъл на друг. Най-важно е да познаваш собствения си обичаен ритъм.',
    body3:
      'Някои вариации са чести по време на менструация. Други признаци заслужават повече внимание, особено когато са нови или много интензивни.',
    normalSigns: [
      {title: 'Продължителност', text: 'Менструация, която обикновено продължава няколко дни.'},
      {title: 'Променлив поток', text: 'По-обилен поток в началото, после по-лек.'},
      {title: 'Цвят', text: 'От ярко червено до тъмно червено или кафяво към края на менструацията.'},
      {title: 'Усещания', text: 'Могат да се усещат леки до умерени крампи.'},
    ],
    warningTitle: 'Кога да потърсиш медицински съвет?',
    warningSigns: [
      'Много силна или необичайна болка',
      'Кървене, което много бързо напоява превръзка или тампон',
      'Значителна умора, прималяване или световъртеж',
      'Внезапна и упорита промяна спрямо обичайния ти модел',
    ],
    body4:
      'Прости навици могат да помогнат да се облекчи дискомфортът и да направят първите дни на менструацията по-удобни.',
    tipsTitle: 'Практически съвети',
    tips: [
      'Пий достатъчно\nвода, за да\nограничиш умората.',
      'Постави топлина\nвърху долната част\nна корема при нужда.',
      'Опитай нежна\nактивност: ходене,\nйога, разтягане.',
      'Дай си почивка\nи качествен\nсън.',
    ],
    reliefTitle: 'Вслушвай се в тялото си',
    reliefText:
      'Почивката, топлината и нежната активност могат да помогнат. Ако болката остава много силна или необичайна, потърси медицински съвет.',
    shareMessage: 'Разбиране на менструацията: какво наистина се случва — AWA',
  },
  sr: {
    badge: 'МЕНСТРУАЛНИ ЦИКЛУС',
    title: 'Разумевање менструације:\nшта се заиста дешава',
    metaDuration: '5 мин читања',
    metaValidated: 'Проверен садржај',
    intro:
      'Твоја менструација је део природног процеса који је суштински за хормонско и репродуктивно здравље. Разумевање онога што се дешава у твом телу може ти помоћи да се осећаш мирније у сваком циклусу.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта је менструација?',
      'Како протиче твоја менструација',
      'Шта је нормално (а шта није)',
      'Природно ублажавање бола',
    ],
    body1:
      'Менструација је одбацивање слузокоже материце када није настало оплођење. Дешава се у просеку једном месечно.',
    knowTitle: 'Добро је знати',
    knowText:
      'Свака жена је јединствена: трајање, интензитет и осећаји могу варирати од циклуса до циклуса.',
    body2:
      'Проток није исти током целе менструације. Обично се мења из дана у дан по интензитету, боји и текстури.',
    flowSteps: [
      {title: 'Почетак менструације', text: 'Проток је често обилнији током првих неколико дана.'},
      {title: 'Средина менструације', text: 'Проток обично почиње постепено да се смањује.'},
      {title: 'Крај менструације', text: 'Проток постаје лакши и може попримити тамнију боју.'},
    ],
    softInfoTitle: 'Имај на уму',
    softInfoText:
      'Ово може варирати од једног циклуса до другог. Најважније је познавати сопствени уобичајени ритам.',
    body3:
      'Неке варијације су честе током менструације. Други знаци заслужују више пажње, нарочито када су нови или веома интензивни.',
    normalSigns: [
      {title: 'Трајање', text: 'Менструација која обично траје неколико дана.'},
      {title: 'Променљив проток', text: 'Обилнији проток на почетку, затим лакши.'},
      {title: 'Боја', text: 'Од јарко црвене до тамно црвене или смеђе ка крају менструације.'},
      {title: 'Осећаји', text: 'Могу се осећати благи до умерени грчеви.'},
    ],
    warningTitle: 'Када потражити медицински савет?',
    warningSigns: [
      'Веома јак или необичан бол',
      'Крварење које веома брзо натопи улошак или тампон',
      'Значајан умор, малаксалост или вртоглавица',
      'Изненадна и упорна промена у односу на твој уобичајени образац',
    ],
    body4:
      'Једноставне навике могу помоћи да се ублажи нелагодност и да први дани менструације буду удобнији.',
    tipsTitle: 'Практични савети',
    tips: [
      'Пиј довољно\nводе да ограничиш\nумор.',
      'Стави топлоту\nна доњи део\nстомака по потреби.',
      'Пробај нежну\nактивност: ходање,\nјога, истезање.',
      'Дај себи одмор\nи квалитетан\nсан.',
    ],
    reliefTitle: 'Слушај своје тело',
    reliefText:
      'Одмор, топлота и нежна активност могу помоћи. Ако бол остаје веома јак или необичан, потражи медицински савет.',
    shareMessage: 'Разумевање менструације: шта се заиста дешава — AWA',
  },
  hr: {
    badge: 'MENSTRUALNI CIKLUS',
    title: 'Razumijevanje tvoje menstruacije:\nšto se zapravo događa',
    metaDuration: '5 min čitanja',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Tvoja menstruacija dio je prirodnog procesa koji je ključan za hormonsko i reproduktivno zdravlje. Razumijevanje onoga što se događa u tvom tijelu može ti pomoći da se u svakom ciklusu osjećaš ugodnije.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je menstruacija?',
      'Kako teče menstruacija',
      'Što je normalno (a što nije)',
      'Prirodno ublažavanje boli',
    ],
    body1:
      'Menstruacija je odbacivanje sluznice maternice kad nije došlo do oplodnje. To se događa u prosjeku jednom mjesečno.',
    knowTitle: 'Dobro je znati',
    knowText:
      'Svaka je žena jedinstvena: trajanje, intenzitet i osjećaji mogu se razlikovati od ciklusa do ciklusa.',
    body2:
      'Protok nije isti tijekom cijele menstruacije. Obično se mijenja iz dana u dan, po intenzitetu, boji i teksturi.',
    flowSteps: [
      {title: 'Početak menstruacije', text: 'Protok je često obilniji prvih nekoliko dana.'},
      {title: 'Sredina menstruacije', text: 'Protok se općenito počinje postupno smanjivati.'},
      {title: 'Kraj menstruacije', text: 'Protok postaje blaži i može poprimiti tamniju boju.'},
    ],
    softInfoTitle: 'Imaj na umu',
    softInfoText:
      'To se može razlikovati od ciklusa do ciklusa. Najvažnije je poznavati vlastiti uobičajeni ritam.',
    body3:
      'Neka su odstupanja česta tijekom menstruacije. Drugi znakovi zaslužuju više pozornosti, osobito kad su novi ili vrlo intenzivni.',
    normalSigns: [
      {title: 'Trajanje', text: 'Menstruacija koja obično traje nekoliko dana.'},
      {title: 'Promjenjiv protok', text: 'Obilniji protok na početku, a zatim blaži.'},
      {title: 'Boja', text: 'Od svijetlocrvene do tamnocrvene ili smeđe pred kraj menstruacije.'},
      {title: 'Osjećaji', text: 'Mogu se osjećati blagi do umjereni grčevi.'},
    ],
    warningTitle: 'Kada zatražiti liječnički savjet?',
    warningSigns: [
      'Vrlo jaka ili neobična bol',
      'Krvarenje koje vrlo brzo natopi uložak ili tampon',
      'Izražen umor, osjećaj nesvjestice ili vrtoglavica',
      'Iznenadna i dugotrajna promjena u odnosu na uobičajeni obrazac',
    ],
    body4:
      'Jednostavne navike mogu pomoći ublažiti nelagodu i učiniti prve dane menstruacije ugodnijima.',
    tipsTitle: 'Praktični savjeti',
    tips: [
      'Pij dovoljno\nvode kako bi\nograničila umor.',
      'Po potrebi stavi\ntoplinu na donji\ndio trbuha.',
      'Isprobaj blagu\naktivnost: hodanje,\njogu, istezanje.',
      'Priušti si odmor\ni kvalitetan\nsan.',
    ],
    reliefTitle: 'Slušaj svoje tijelo',
    reliefText:
      'Odmor, toplina i blaga aktivnost mogu pomoći. Ako bol ostane vrlo jaka ili neobična, zatraži liječnički savjet.',
    shareMessage: 'Razumijevanje tvoje menstruacije: što se zapravo događa — AWA',
  },
  bs: {
    badge: 'MENSTRUALNI CIKLUS',
    title: 'Razumijevanje tvoje menstruacije:\nšta se zapravo događa',
    metaDuration: '5 min čitanja',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Tvoja menstruacija dio je prirodnog procesa koji je ključan za hormonsko i reproduktivno zdravlje. Razumijevanje onoga što se događa u tvom tijelu može ti pomoći da se u svakom ciklusu osjećaš ugodnije.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je menstruacija?',
      'Kako teče menstruacija',
      'Što je normalno (a što nije)',
      'Prirodno ublažavanje boli',
    ],
    body1:
      'Menstruacija je odbacivanje sluznice maternice kad nije došlo do oplodnje. To se događa u prosjeku jednom mjesečno.',
    knowTitle: 'Dobro je znati',
    knowText:
      'Svaka je žena jedinstvena: trajanje, intenzitet i osjećaji mogu se razlikovati od ciklusa do ciklusa.',
    body2:
      'Protok nije isti tokom cijele menstruacije. Obično se mijenja iz dana u dan, po intenzitetu, boji i teksturi.',
    flowSteps: [
      {title: 'Početak menstruacije', text: 'Protok je često obilniji prvih nekoliko dana.'},
      {title: 'Sredina menstruacije', text: 'Protok se općenito počinje postupno smanjivati.'},
      {title: 'Kraj menstruacije', text: 'Protok postaje blaži i može poprimiti tamniju boju.'},
    ],
    softInfoTitle: 'Imaj na umu',
    softInfoText:
      'To se može razlikovati od ciklusa do ciklusa. Najvažnije je poznavati vlastiti uobičajeni ritam.',
    body3:
      'Neka su odstupanja česta tokom menstruacije. Drugi znakovi zaslužuju više pozornosti, osobito kad su novi ili vrlo intenzivni.',
    normalSigns: [
      {title: 'Trajanje', text: 'Menstruacija koja obično traje nekoliko dana.'},
      {title: 'Promjenjiv protok', text: 'Obilniji protok na početku, a zatim blaži.'},
      {title: 'Boja', text: 'Od svijetlocrvene do tamnocrvene ili smeđe pred kraj menstruacije.'},
      {title: 'Osjećaji', text: 'Mogu se osjećati blagi do umjereni grčevi.'},
    ],
    warningTitle: 'Kada zatražiti ljekarski savjet?',
    warningSigns: [
      'Vrlo jaka ili neobična bol',
      'Krvarenje koje vrlo brzo natopi uložak ili tampon',
      'Izražen umor, osjećaj nesvjestice ili vrtoglavica',
      'Iznenadna i dugotrajna promjena u odnosu na uobičajeni obrazac',
    ],
    body4:
      'Jednostavne navike mogu pomoći ublažiti nelagodu i učiniti prve dane menstruacije ugodnijima.',
    tipsTitle: 'Praktični savjeti',
    tips: [
      'Pij dovoljno\nvode kako bi\nograničila umor.',
      'Po potrebi stavi\ntoplinu na donji\ndio trbuha.',
      'Isprobaj blagu\naktivnost: hodanje,\njogu, istezanje.',
      'Priušti si odmor\ni kvalitetan\nsan.',
    ],
    reliefTitle: 'Slušaj svoje tijelo',
    reliefText:
      'Odmor, toplina i blaga aktivnost mogu pomoći. Ako bol ostane vrlo jaka ili neobična, zatraži ljekarski savjet.',
    shareMessage: 'Razumijevanje tvoje menstruacije: što se zapravo događa — AWA',
  },
  sl: {
    badge: 'MENSTRUALNI CIKEL',
    title: 'Razumevanje tvoje menstruacije:\nkaj se zares dogaja',
    metaDuration: '5 min branja',
    metaValidated: 'Preverjena vsebina',
    intro:
      'Tvoja menstruacija je del naravnega procesa, ki je ključen za hormonsko in reproduktivno zdravje. Razumevanje tega, kar se dogaja v tvojem telesu, ti lahko pomaga, da se v vsakem ciklu počutiš udobneje.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj je menstruacija?',
      'Kako poteka menstruacija',
      'Kaj je normalno (in kaj ne)',
      'Naravno lajšanje bolečine',
    ],
    body1:
      'Menstruacija je odvrženje sluznice maternice, kadar ni prišlo do oploditve. To se zgodi v povprečju enkrat mesečno.',
    knowTitle: 'Vredno vedeti',
    knowText:
      'Vsaka ženska je edinstvena: trajanje, intenzivnost in občutki se lahko razlikujejo od cikla do cikla.',
    body2:
      'Tok ni enak skozi celotno menstruacijo. Običajno se spreminja iz dneva v dan, po intenzivnosti, barvi in teksturi.',
    flowSteps: [
      {title: 'Začetek menstruacije', text: 'Tok je pogosto obilnejši prvih nekaj dni.'},
      {title: 'Sredina menstruacije', text: 'Tok se na splošno začne postopoma zmanjševati.'},
      {title: 'Konec menstruacije', text: 'Tok postane blažji in lahko poprime temnejšo barvo.'},
    ],
    softInfoTitle: 'Imej v mislih',
    softInfoText:
      'To se lahko razlikuje od cikla do cikla. Najpomembneje je poznati lasten običajen ritem.',
    body3:
      'Nekatera odstopanja so med menstruacijo pogosta. Drugi znaki zaslužijo več pozornosti, zlasti kadar so novi ali zelo intenzivni.',
    normalSigns: [
      {title: 'Trajanje', text: 'Menstruacija, ki običajno traja nekaj dni.'},
      {title: 'Spremenljiv tok', text: 'Obilnejši tok na začetku, nato blažji.'},
      {title: 'Barva', text: 'Od svetlo rdeče do temno rdeče ali rjave proti koncu menstruacije.'},
      {title: 'Občutki', text: 'Lahko se čutijo blagi do zmerni krči.'},
    ],
    warningTitle: 'Kdaj poiskati zdravniški nasvet?',
    warningSigns: [
      'Zelo huda ali nenavadna bolečina',
      'Krvavitev, ki zelo hitro prepoji vložek ali tampon',
      'Izrazita utrujenost, občutek omedlevice ali omotica',
      'Nenadna in dolgotrajna sprememba glede na običajni vzorec',
    ],
    body4:
      'Preproste navade lahko pomagajo omiliti nelagodje in prve dni menstruacije narediti udobnejše.',
    tipsTitle: 'Praktični nasveti',
    tips: [
      'Pij dovolj\nvode, da omejiš\nutrujenost.',
      'Po potrebi daj\ntoploto na spodnji\ndel trebuha.',
      'Preizkusi nežno\ndejavnost: hojo,\njogo, raztezanje.',
      'Privošči si počitek\nin kakovosten\nspanec.',
    ],
    reliefTitle: 'Prisluhni svojemu telesu',
    reliefText:
      'Počitek, toplota in nežna dejavnost lahko pomagajo. Če bolečina ostane zelo huda ali nenavadna, poišči zdravniški nasvet.',
    shareMessage: 'Razumevanje tvoje menstruacije: kaj se zares dogaja — AWA',
  },
  ne: {
    badge: 'मासिक चक्र',
    title: 'आफ्नो महिनावारी बुझ्नुहोस्:\nवास्तवमा के भइरहेको छ',
    metaDuration: '5 मिनेट पढाइ',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro:
      'तपाईंको महिनावारी हर्मोनल र प्रजनन स्वास्थ्यका लागि आवश्यक स्वाभाविक प्रक्रियाको हिस्सा हो। तपाईंको शरीरमा के भइरहेको छ बुझ्नाले हरेक चक्रमा तपाईंलाई थप सहज महसुस गराउन सक्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'महिनावारी के हो?',
      'तपाईंको महिनावारी कसरी चल्छ',
      'के सामान्य छ (र के होइन)',
      'दुखाइ प्राकृतिक रूपमा कम गर्ने',
    ],
    body1:
      'महिनावारी निषेचन नभएको अवस्थामा गर्भाशयको अस्तर झर्नु हो। यो औसतमा महिनामा एक पटक हुन्छ।',
    knowTitle: 'जान्न लायक',
    knowText:
      'हरेक महिला अनौठी हुन्छिन्: अवधि, तीव्रता र अनुभूतिहरू एक चक्रदेखि अर्कोमा फरक हुन सक्छन्।',
    body2:
      'तपाईंको महिनावारीभरि बहाव उस्तै हुँदैन। यो प्रायः दिनैपिच्छे, तीव्रता, रङ र बनावटमा बदलिन्छ।',
    flowSteps: [
      {title: 'महिनावारीको सुरुवात', text: 'बहाव प्रायः पहिला केही दिन बढी हुन्छ।'},
      {title: 'महिनावारीको बीच', text: 'बहाव सामान्यतया बिस्तारै घट्न थाल्छ।'},
      {title: 'महिनावारीको अन्त्य', text: 'बहाव हल्का हुन्छ र गाढा रङ लिन सक्छ।'},
    ],
    softInfoTitle: 'मनमा राख्नुहोस्',
    softInfoText:
      'यो एक चक्रदेखि अर्कोमा फरक हुन सक्छ। सबैभन्दा महत्त्वपूर्ण कुरा आफ्नै सामान्य लय जान्नु हो।',
    body3:
      'महिनावारीको समयमा केही भिन्नताहरू सामान्य छन्। अन्य संकेतहरूले बढी ध्यान पाउनुपर्छ, विशेष गरी जब ती नयाँ वा निकै तीव्र हुन्छन्।',
    normalSigns: [
      {title: 'अवधि', text: 'सामान्यतया केही दिन चल्ने महिनावारी।'},
      {title: 'फरक पर्ने बहाव', text: 'सुरुमा बढी बहाव, त्यसपछि हल्का।'},
      {title: 'रङ', text: 'चटक रातोबाट गाढा रातो वा महिनावारीको अन्त्यतिर खैरो।'},
      {title: 'अनुभूतिहरू', text: 'हल्कादेखि मध्यम ऐंठन महसुस हुन सक्छ।'},
    ],
    warningTitle: 'चिकित्सकीय सल्लाह कहिले लिने?',
    warningSigns: [
      'निकै तीव्र वा असामान्य दुखाइ',
      'प्याड वा ट्याम्पोन निकै छिटो भिज्ने रक्तस्राव',
      'ठूलो थकान, बेहोस हुन लागेको अनुभूति, वा चक्कर',
      'तपाईंको सामान्य ढाँचाबाट अचानक र लगातार परिवर्तन',
    ],
    body4:
      'सरल बानीहरूले असहजता कम गर्न र तपाईंको महिनावारीका पहिला दिनहरू बढी सहज बनाउन मद्दत गर्न सक्छन्।',
    tipsTitle: 'व्यावहारिक सुझावहरू',
    tips: [
      'थकान सीमित गर्न\nपर्याप्त पानी\nपिउनुहोस्।',
      'आवश्यक परे तल्लो\nपेटमा तातो\nलगाउनुहोस्।',
      'कोमल गतिविधि\nप्रयास गर्नुहोस्: हिँडाइ,\nयोग, स्ट्रेचिङ।',
      'आफूलाई आराम र\nगुणस्तरीय निद्रा\nदिनुहोस्।',
    ],
    reliefTitle: 'आफ्नो शरीरको कुरा सुन्नुहोस्',
    reliefText:
      'आराम, तातो र कोमल गतिविधिले मद्दत गर्न सक्छन्। दुखाइ निकै तीव्र वा असामान्य रहिरहे चिकित्सकीय सल्लाह लिनुहोस्।',
    shareMessage: 'आफ्नो महिनावारी बुझ्नुहोस्: वास्तवमा के भइरहेको छ — AWA',
  },
  si: {
    badge: 'ඔසප් චක්‍රය',
    title: 'ඔබේ ඔසප් තේරුම් ගැනීම:\nසැබවින්ම සිදුවන්නේ කුමක්ද',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro:
      'ඔබේ ඔසප් හෝමෝන සහ ප්‍රජනන සෞඛ්‍යයට අත්‍යවශ්‍ය ස්වාභාවික ක්‍රියාවලියක කොටසකි. ඔබේ ශරීරයේ සිදුවන්නේ කුමක්දැයි තේරුම් ගැනීම සෑම චක්‍රයක්ම සමඟ ඔබට වඩා සුවපහසුවක් දැනීමට උපකාරී විය හැක.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඔසප් යනු කුමක්ද?',
      'ඔබේ ඔසප් ඉදිරියට යන ආකාරය',
      'සාමාන්‍ය දේ (සහ නොවන දේ)',
      'වේදනාව ස්වාභාවිකව සමනය කිරීම',
    ],
    body1:
      'ඔසප් යනු සංසේචනයක් සිදු නොවූ විට ගර්භාෂ අස්තරය ඉවත් වීමයි. මෙය සාමාන්‍යයෙන් මසකට වරක් සිදුවේ.',
    knowTitle: 'දැනගත යුතු දේ',
    knowText:
      'සෑම කාන්තාවක්ම අද්විතීයයි: කාලය, තීව්‍රතාව සහ සංවේදනයන් එක් චක්‍රයක සිට ඊළඟ චක්‍රයට වෙනස් විය හැක.',
    body2:
      'ගලනය ඔබේ ඔසප් පුරා එක සමාන නොවේ. එය සාමාන්‍යයෙන් දිනෙන් දිනට, තීව්‍රතාවයෙන්, වර්ණයෙන් සහ සැකැස්මෙන් වෙනස් වේ.',
    flowSteps: [
      {title: 'ඔබේ ඔසප් ආරම්භය', text: 'ගලනය බොහෝ විට පළමු දින කිහිපය තුළ වැඩි වේ.'},
      {title: 'ඔබේ ඔසප් මැද', text: 'ගලනය සාමාන්‍යයෙන් ක්‍රමයෙන් අඩු වීමට පටන් ගනී.'},
      {title: 'ඔබේ ඔසප් අවසානය', text: 'ගලනය ලා වන අතර තද වර්ණයක් ගත හැක.'},
    ],
    softInfoTitle: 'මතක තබාගන්න',
    softInfoText:
      'මෙය එක් චක්‍රයක සිට තවත් චක්‍රයකට වෙනස් විය හැක. වඩාත්ම වැදගත් වන්නේ ඔබේම සුපුරුදු රිද්මය දැනගැනීමයි.',
    body3:
      'ඔබේ ඔසප් කාලයේදී සමහර විචලනයන් පොදුයි. අනෙක් සලකුණුවලට වැඩි අවධානයක් ලැබිය යුතුයි, විශේෂයෙන් ඒවා අලුත් හෝ ඉතා දැඩි වන විට.',
    normalSigns: [
      {title: 'කාලය', text: 'සාමාන්‍යයෙන් දින කිහිපයක් පවතින ඔසප්.'},
      {title: 'වෙනස් වන ගලනය', text: 'මුලින් වැඩි ගලනයක්, පසුව ලා.'},
      {title: 'වර්ණය', text: 'ඔබේ ඔසප් අවසානය දෙසට ලා රතු සිට තද රතු හෝ දුඹුරු දක්වා.'},
      {title: 'සංවේදනයන්', text: 'සැහැල්ලු සිට මධ්‍යස්ථ මාංශ පේශි සංකෝචන දැනිය හැක.'},
    ],
    warningTitle: 'වෛද්‍ය උපදෙස් ලබාගත යුත්තේ කවදාද?',
    warningSigns: [
      'ඉතා දැඩි හෝ අසාමාන්‍ය වේදනාව',
      'පෑඩ් එකක් හෝ ටැම්පන් එකක් ඉතා ඉක්මනින් තෙත් කරන ලේ ගැලීම',
      'සැලකිය යුතු වෙහෙස, ක්ලාන්ත බවක් දැනීම, හෝ හිස කැරකීම',
      'ඔබේ සුපුරුදු රටාවෙන් හදිසි සහ දිගටම පවතින වෙනසක්',
    ],
    body4:
      'සරල පුරුදු අපහසුතාව සමනය කිරීමට සහ ඔබේ ඔසප්වල පළමු දින වඩා සුවපහසු කිරීමට උපකාරී විය හැක.',
    tipsTitle: 'ප්‍රායෝගික ඉඟි',
    tips: [
      'වෙහෙස සීමා\nකිරීමට ප්‍රමාණවත්\nජලය පානය කරන්න.',
      'අවශ්‍ය නම් ඔබේ\nපහළ උදරයට\nතාපය යොදන්න.',
      'මෘදු ක්‍රියාකාරකමක්\nඋත්සාහ කරන්න: ඇවිදීම,\nයෝග, දිගු කිරීම.',
      'ඔබටම විවේකය සහ\nගුණාත්මක නින්ද\nලබා දෙන්න.',
    ],
    reliefTitle: 'ඔබේ ශරීරයට සවන් දෙන්න',
    reliefText:
      'විවේකය, තාපය සහ මෘදු ක්‍රියාකාරකම උපකාරී විය හැක. වේදනාව ඉතා දැඩිව හෝ අසාමාන්‍යව පවතී නම්, වෛද්‍ය උපදෙස් ලබාගන්න.',
    shareMessage: 'ඔබේ ඔසප් තේරුම් ගැනීම: සැබවින්ම සිදුවන්නේ කුමක්ද — AWA',
  },
  th: {
    badge: 'รอบเดือน',
    title: 'ทำความเข้าใจประจำเดือนของคุณ:\nสิ่งที่เกิดขึ้นจริง',
    metaDuration: 'อ่าน 5 นาที',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro:
      'ประจำเดือนของคุณเป็นส่วนหนึ่งของกระบวนการตามธรรมชาติที่จำเป็นต่อสุขภาพทางฮอร์โมนและระบบสืบพันธุ์ การเข้าใจสิ่งที่เกิดขึ้นในร่างกายช่วยให้คุณรู้สึกสบายใจขึ้นในแต่ละรอบเดือน',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ประจำเดือนคืออะไร?',
      'ประจำเดือนดำเนินไปอย่างไร',
      'อะไรที่เป็นปกติ (และอะไรที่ไม่ปกติ)',
      'บรรเทาอาการปวดตามธรรมชาติ',
    ],
    body1:
      'ประจำเดือนคือการผลัดเยื่อบุโพรงมดลูกเมื่อไม่มีการปฏิสนธิเกิดขึ้น เกิดขึ้นโดยเฉลี่ยเดือนละครั้ง',
    knowTitle: 'ควรรู้',
    knowText:
      'ผู้หญิงแต่ละคนมีเอกลักษณ์: ระยะเวลา ปริมาณ และความรู้สึกอาจต่างกันในแต่ละรอบเดือน',
    body2:
      'ปริมาณไม่เท่ากันตลอดประจำเดือน มักเปลี่ยนไปในแต่ละวัน ทั้งปริมาณ สี และลักษณะเนื้อ',
    flowSteps: [
      {title: 'ช่วงต้นของประจำเดือน', text: 'ปริมาณมักมากกว่าในสองสามวันแรก'},
      {title: 'ช่วงกลางของประจำเดือน', text: 'ปริมาณโดยทั่วไปเริ่มค่อย ๆ ลดลง'},
      {title: 'ช่วงท้ายของประจำเดือน', text: 'ปริมาณน้อยลงและอาจมีสีเข้มขึ้น'},
    ],
    softInfoTitle: 'โปรดจำไว้',
    softInfoText:
      'อาจต่างกันจากรอบเดือนหนึ่งไปอีกรอบหนึ่ง สิ่งสำคัญที่สุดคือรู้จักจังหวะปกติของตัวเอง',
    body3:
      'ความแปรผันบางอย่างพบบ่อยระหว่างมีประจำเดือน สัญญาณอื่นสมควรได้รับความใส่ใจมากกว่า โดยเฉพาะเมื่อเป็นเรื่องใหม่หรือรุนแรงมาก',
    normalSigns: [
      {title: 'ระยะเวลา', text: 'ประจำเดือนที่มักมาไม่กี่วัน'},
      {title: 'ปริมาณที่แปรผัน', text: 'ปริมาณมากในตอนแรก แล้วเบาลง'},
      {title: 'สี', text: 'ตั้งแต่แดงสดไปจนถึงแดงเข้มหรือน้ำตาลช่วงท้ายของประจำเดือน'},
      {title: 'ความรู้สึก', text: 'อาจรู้สึกปวดเกร็งเล็กน้อยถึงปานกลาง'},
    ],
    warningTitle: 'เมื่อไรควรขอคำแนะนำทางการแพทย์?',
    warningSigns: [
      'ปวดรุนแรงมากหรือผิดปกติ',
      'เลือดออกจนชุ่มผ้าอนามัยแบบแผ่นหรือแบบสอดอย่างรวดเร็วมาก',
      'เหนื่อยล้ามาก รู้สึกจะเป็นลม หรือเวียนศีรษะ',
      'การเปลี่ยนแปลงอย่างกะทันหันและต่อเนื่องจากรูปแบบปกติของคุณ',
    ],
    body4:
      'นิสัยง่าย ๆ ช่วยบรรเทาความไม่สบายและทำให้วันแรก ๆ ของประจำเดือนสบายขึ้นได้',
    tipsTitle: 'เคล็ดลับเชิงปฏิบัติ',
    tips: [
      'ดื่มน้ำให้\nเพียงพอเพื่อ\nช่วยลดความเหนื่อยล้า',
      'ประคบร้อน\nที่ท้องน้อย\nหากจำเป็น',
      'ลองกิจกรรมเบา ๆ:\nเดิน โยคะ\nยืดเหยียด',
      'ให้เวลาพักผ่อน\nและนอนหลับ\nที่มีคุณภาพ',
    ],
    reliefTitle: 'ฟังเสียงร่างกายของคุณ',
    reliefText:
      'การพักผ่อน ความร้อน และกิจกรรมเบา ๆ ช่วยได้ หากอาการปวดยังรุนแรงมากหรือผิดปกติ ให้ขอคำแนะนำทางการแพทย์',
    shareMessage: 'ทำความเข้าใจประจำเดือนของคุณ: สิ่งที่เกิดขึ้นจริง — AWA',
  },
  vi: {
    badge: 'CHU KỲ KINH NGUYỆT',
    title: 'Hiểu về kỳ kinh của bạn:\nđiều gì thực sự đang xảy ra',
    metaDuration: '5 phút đọc',
    metaValidated: 'Nội dung đã được thẩm định',
    intro:
      'Kỳ kinh của bạn là một phần của quá trình tự nhiên thiết yếu đối với sức khỏe nội tiết và sinh sản. Hiểu điều gì đang xảy ra trong cơ thể có thể giúp bạn cảm thấy thoải mái hơn với mỗi chu kỳ.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Kỳ kinh là gì?',
      'Kỳ kinh của bạn diễn ra thế nào',
      'Điều gì là bình thường (và điều gì không)',
      'Làm dịu cơn đau một cách tự nhiên',
    ],
    body1:
      'Kỳ kinh là việc bong lớp niêm mạc tử cung khi không có sự thụ tinh nào xảy ra. Điều này xảy ra trung bình mỗi tháng một lần.',
    knowTitle: 'Nên biết',
    knowText:
      'Mỗi phụ nữ là duy nhất: thời gian, cường độ và cảm giác có thể khác nhau từ chu kỳ này sang chu kỳ khác.',
    body2:
      'Lượng kinh không giống nhau trong suốt kỳ kinh. Nó thường thay đổi từ ngày này sang ngày khác, về cường độ, màu sắc và kết cấu.',
    flowSteps: [
      {title: 'Đầu kỳ kinh', text: 'Lượng kinh thường nhiều hơn trong vài ngày đầu.'},
      {title: 'Giữa kỳ kinh', text: 'Lượng kinh nhìn chung bắt đầu giảm dần.'},
      {title: 'Cuối kỳ kinh', text: 'Lượng kinh nhẹ hơn và có thể có màu sẫm hơn.'},
    ],
    softInfoTitle: 'Hãy ghi nhớ',
    softInfoText:
      'Điều này có thể khác nhau từ chu kỳ này sang chu kỳ khác. Điều quan trọng nhất là biết nhịp điệu thông thường của riêng bạn.',
    body3:
      'Một số biến đổi là phổ biến trong kỳ kinh. Những dấu hiệu khác đáng được chú ý hơn, đặc biệt khi chúng mới xuất hiện hoặc rất dữ dội.',
    normalSigns: [
      {title: 'Thời gian', text: 'Kỳ kinh thường kéo dài vài ngày.'},
      {title: 'Lượng kinh thay đổi', text: 'Lượng nhiều hơn lúc đầu, rồi nhẹ dần.'},
      {title: 'Màu sắc', text: 'Từ đỏ tươi đến đỏ sẫm hoặc nâu về cuối kỳ kinh.'},
      {title: 'Cảm giác', text: 'Có thể cảm thấy đau quặn nhẹ đến vừa.'},
    ],
    warningTitle: 'Khi nào nên tìm lời khuyên y khoa?',
    warningSigns: [
      'Đau rất dữ dội hoặc bất thường',
      'Ra máu thấm đẫm băng vệ sinh hoặc tampon rất nhanh',
      'Mệt mỏi đáng kể, cảm giác choáng váng hoặc chóng mặt',
      'Một thay đổi đột ngột và kéo dài so với quy luật thông thường của bạn',
    ],
    body4:
      'Những thói quen đơn giản có thể giúp giảm khó chịu và làm những ngày đầu của kỳ kinh dễ chịu hơn.',
    tipsTitle: 'Mẹo thực tế',
    tips: [
      'Uống đủ\nnước để giúp\nhạn chế mệt mỏi.',
      'Chườm ấm\nlên bụng dưới\nnếu cần.',
      'Thử một hoạt động\nnhẹ nhàng: đi bộ,\nyoga, giãn cơ.',
      'Cho bản thân\nnghỉ ngơi và\ngiấc ngủ chất lượng.',
    ],
    reliefTitle: 'Hãy lắng nghe cơ thể bạn',
    reliefText:
      'Nghỉ ngơi, chườm ấm và hoạt động nhẹ nhàng có thể giúp ích. Nếu cơn đau vẫn rất dữ dội hoặc bất thường, hãy tìm lời khuyên y khoa.',
    shareMessage: 'Hiểu về kỳ kinh của bạn: điều gì thực sự đang xảy ra — AWA',
  },
  uz: {
    badge: 'HAYZ SIKLI',
    title: 'Hayzingizni tushunish:\naslida nima sodir boʻlmoqda',
    metaDuration: '5 daq oʻqish',
    metaValidated: 'Tasdiqlangan kontent',
    intro:
      'Hayzingiz gormonal va reproduktiv salomatlik uchun muhim tabiiy jarayonning bir qismi. Tanangizda nima sodir boʻlayotganini tushunish har bir sikl bilan oʻzingizni xotirjamroq his qilishga yordam beradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Hayz nima?',
      'Hayz qanday kechadi',
      'Nima normal (va nima emas)',
      'Ogʻriqni tabiiy yoʻl bilan yengillashtirish',
    ],
    body1:
      'Hayz — urugʻlanish sodir boʻlmaganda bachadon qavatining toʻkilishi. Bu oʻrtacha oyda bir marta sodir boʻladi.',
    knowTitle: 'Bilish foydali',
    knowText:
      'Har bir ayol noyob: davomiyligi, kuchi va sezgilar sikldan sikliga farq qilishi mumkin.',
    body2:
      'Oqim hayzning butun davomida bir xil emas. U odatda kundan kunga kuchi, rangi va quyuqligi boʻyicha oʻzgaradi.',
    flowSteps: [
      {title: 'Hayzning boshi', text: 'Oqim dastlabki bir necha kun koʻpincha koʻproq boʻladi.'},
      {title: 'Hayzning oʻrtasi', text: 'Oqim odatda asta-sekin kamaya boshlaydi.'},
      {title: 'Hayzning oxiri', text: 'Oqim yengillashadi va toʻqroq rang olishi mumkin.'},
    ],
    softInfoTitle: 'Esda tuting',
    softInfoText:
      'Bu sikldan sikliga farq qilishi mumkin. Eng muhimi — oʻz odatiy ritmingizni bilish.',
    body3:
      'Hayz paytida baʼzi oʻzgarishlar keng tarqalgan. Boshqa belgilar esa, ayniqsa yangi yoki juda kuchli boʻlsa, koʻproq eʼtiborga loyiq.',
    normalSigns: [
      {title: 'Davomiyligi', text: 'Odatda bir necha kun davom etadigan hayz.'},
      {title: 'Oʻzgaruvchan oqim', text: 'Avval koʻproq, keyin yengilroq oqim.'},
      {title: 'Rang', text: 'Yorqin qizildan toʻq qizilgacha yoki hayzning oxiriga yaqin jigarranggacha.'},
      {title: 'Sezgilar', text: 'Yengildan oʻrtachagacha qisqarishlar sezilishi mumkin.'},
    ],
    warningTitle: 'Qachon tibbiy maslahat olish kerak?',
    warningSigns: [
      'Juda kuchli yoki odatdan tashqari ogʻriq',
      'Prokladka yoki tamponni juda tez shimdiradigan qon ketishi',
      'Sezilarli charchoq, hushdan ketayotgandek his qilish yoki bosh aylanishi',
      'Odatiy holatdan ketma-ket va doimiy keskin oʻzgarish',
    ],
    body4:
      'Oddiy odatlar noqulaylikni yengillashtirishga va hayzning dastlabki kunlarini qulayroq qilishga yordam beradi.',
    tipsTitle: 'Amaliy maslahatlar',
    tips: [
      'Charchoqni\ncheklashga yordam\nberish uchun yetarli\nsuv iching.',
      'Kerak boʻlsa,\nqorin pastki\nqismiga issiqlik\nqoʻying.',
      'Yengil faollikni\nsinab koʻring: yurish,\nyoga, choʻzilish.',
      'Oʻzingizga dam\nva sifatli uyqu\nbering.',
    ],
    reliefTitle: 'Tanangizni tinglang',
    reliefText:
      'Dam, issiqlik va yengil faollik yordam berishi mumkin. Agar ogʻriq juda kuchli yoki odatdan tashqari boʻlib qolsa, tibbiy maslahat oling.',
    shareMessage: 'Hayzingizni tushunish: aslida nima sodir boʻlmoqda — AWA',
  },
  az: {
    badge: 'MENSTRUAL DÖVR',
    title: 'Aybaşınızı anlamaq:\nhəqiqətən nə baş verir',
    metaDuration: '5 dəq oxu',
    metaValidated: 'Yoxlanılmış məzmun',
    intro:
      'Aybaşınız hormonal və reproduktiv sağlamlıq üçün vacib olan təbii prosesin bir hissəsidir. Bədəninizdə nələrin baş verdiyini anlamaq hər dövrdə özünüzü daha rahat hiss etməyə kömək edə bilər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Aybaşı nədir?',
      'Aybaşınız necə keçir',
      'Nə normaldır (və nə normal deyil)',
      'Ağrını təbii yolla yüngülləşdirmək',
    ],
    body1:
      'Aybaşı mayalanma baş vermədikdə uşaqlıq selikli qişasının atılmasıdır. Bu, orta hesabla ayda bir dəfə baş verir.',
    knowTitle: 'Bilmək faydalıdır',
    knowText:
      'Hər qadın özünəməxsusdur: müddət, intensivlik və hisslər bir dövrdən digərinə dəyişə bilər.',
    body2:
      'Axın aybaşı boyu eyni deyil. O, adətən gündən-günə intensivliyi, rəngi və teksturası ilə dəyişir.',
    flowSteps: [
      {title: 'Aybaşının əvvəli', text: 'Axın ilk bir neçə gündə çox vaxt daha bol olur.'},
      {title: 'Aybaşının ortası', text: 'Axın ümumiyyətlə tədricən azalmağa başlayır.'},
      {title: 'Aybaşının sonu', text: 'Axın daha yüngül olur və daha tünd rəng ala bilər.'},
    ],
    softInfoTitle: 'Yadda saxlayın',
    softInfoText:
      'Bu, bir dövrdən digərinə dəyişə bilər. Ən vacibi öz adi ritminizi bilməkdir.',
    body3:
      'Aybaşı zamanı bəzi dəyişkənliklər geniş yayılıb. Digər əlamətlər, xüsusilə yeni və ya çox şiddətli olduqda daha çox diqqətə layiqdir.',
    normalSigns: [
      {title: 'Müddət', text: 'Adətən bir neçə gün davam edən aybaşı.'},
      {title: 'Dəyişən axın', text: 'Əvvəlcə daha bol, sonra daha yüngül axın.'},
      {title: 'Rəng', text: 'Aybaşının sonuna doğru parlaq qırmızıdan tünd qırmızıya və ya qəhvəyiyə qədər.'},
      {title: 'Hisslər', text: 'Yüngül və orta qıcolmalar hiss oluna bilər.'},
    ],
    warningTitle: 'Nə vaxt tibbi məsləhət almaq lazımdır?',
    warningSigns: [
      'Çox şiddətli və ya qeyri-adi ağrı',
      'Gigiyenik bezi və ya tamponu çox tez isladan qanaxma',
      'Əhəmiyyətli yorğunluq, hövsələsizlik hissi və ya başgicəllənmə',
      'Adi qanunauyğunluğunuzdan qəfil və davamlı dəyişiklik',
    ],
    body4:
      'Sadə vərdişlər narahatlığı yüngülləşdirməyə və aybaşının ilk günlərini daha rahat etməyə kömək edə bilər.',
    tipsTitle: 'Praktik məsləhətlər',
    tips: [
      'Yorğunluğu\nməhdudlaşdırmaq üçün\nkifayət qədər su için.',
      'Lazım gələrsə,\nqarının aşağı\nhissəsinə istilik qoyun.',
      'Mülayim fəaliyyəti\nsınayın: gəzinti,\nyoqa, dartılma.',
      'Özünüzə istirahət və\nkeyfiyyətli yuxu\nverin.',
    ],
    reliefTitle: 'Bədəninizi dinləyin',
    reliefText:
      'İstirahət, istilik və mülayim fəaliyyət kömək edə bilər. Ağrı çox şiddətli və ya qeyri-adi qalarsa, tibbi məsləhət alın.',
    shareMessage: 'Aybaşınızı anlamaq: həqiqətən nə baş verir — AWA',
  },
  ka: {
    badge: 'მენსტრუაციული ციკლი',
    title: 'თქვენი მენსტრუაციის გაგება:\nრა ხდება სინამდვილეში',
    metaDuration: '5 წთ საკითხავი',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro:
      'თქვენი მენსტრუაცია ბუნებრივი პროცესის ნაწილია, რომელიც ჰორმონული და რეპროდუქციული ჯანმრთელობისთვის არსებითია. იმის გაგებამ, რა ხდება თქვენს სხეულში, შეიძლება დაგეხმაროთ უფრო მშვიდად იგრძნოთ თავი ყოველ ციკლში.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის მენსტრუაცია?',
      'როგორ მიმდინარეობს თქვენი მენსტრუაცია',
      'რა არის ნორმალური (და რა არა)',
      'ტკივილის ბუნებრივად შემსუბუქება',
    ],
    body1:
      'მენსტრუაცია საშვილოსნოს გარსის გამოყოფაა, როცა განაყოფიერება არ მომხდარა. ეს საშუალოდ თვეში ერთხელ ხდება.',
    knowTitle: 'კარგია ვიცოდეთ',
    knowText:
      'ყველა ქალი უნიკალურია: ხანგრძლივობა, ინტენსივობა და შეგრძნებები ერთი ციკლიდან მეორეზე შეიძლება განსხვავდებოდეს.',
    body2:
      'ნაკადი მენსტრუაციის განმავლობაში ერთნაირი არ არის. ის, როგორც წესი, დღითი დღე იცვლება ინტენსივობით, ფერითა და ტექსტურით.',
    flowSteps: [
      {title: 'მენსტრუაციის დასაწყისი', text: 'ნაკადი პირველ დღეებში ხშირად უფრო უხვია.'},
      {title: 'მენსტრუაციის შუა', text: 'ნაკადი ზოგადად ეტაპობრივად მცირდება.'},
      {title: 'მენსტრუაციის დასასრული', text: 'ნაკადი უფრო მსუბუქი ხდება და შეიძლება უფრო მუქი ფერი მიიღოს.'},
    ],
    softInfoTitle: 'გაითვალისწინეთ',
    softInfoText:
      'ეს ერთი ციკლიდან მეორეზე შეიძლება განსხვავდებოდეს. ყველაზე მნიშვნელოვანია საკუთარი ჩვეული რიტმის ცოდნა.',
    body3:
      'ზოგი ვარიაცია მენსტრუაციის დროს ხშირია. სხვა ნიშნები მეტ ყურადღებას იმსახურებს, განსაკუთრებით როცა ისინი ახალია ან ძალიან ინტენსიური.',
    normalSigns: [
      {title: 'ხანგრძლივობა', text: 'მენსტრუაცია, რომელიც ჩვეულებრივ რამდენიმე დღე გრძელდება.'},
      {title: 'ცვალებადი ნაკადი', text: 'ჯერ უფრო უხვი ნაკადი, შემდეგ უფრო მსუბუქი.'},
      {title: 'ფერი', text: 'ნათელი წითელიდან მუქ წითლამდე ან მურა ფერამდე მენსტრუაციის ბოლოსკენ.'},
      {title: 'შეგრძნებები', text: 'შეიძლება იგრძნოთ მსუბუქი ან ზომიერი სპაზმები.'},
    ],
    warningTitle: 'როდის მივმართოთ სამედიცინო რჩევას?',
    warningSigns: [
      'ძალიან ინტენსიური ან უჩვეულო ტკივილი',
      'სისხლდენა, რომელიც საფენს ან ტამპონს ძალიან სწრაფად ასველებს',
      'მნიშვნელოვანი დაღლილობა, გულის წასვლის შეგრძნება ან თავბრუსხვევა',
      'უეცარი და გაგრძელებული ცვლილება თქვენი ჩვეული სურათიდან',
    ],
    body4:
      'მარტივ ჩვევებს შეუძლია დისკომფორტის შემსუბუქება და მენსტრუაციის პირველი დღეების უფრო კომფორტულად ქცევა.',
    tipsTitle: 'პრაქტიკული რჩევები',
    tips: [
      'დალიეთ საკმარისი\nწყალი, რომ\nდაღლილობა შეიზღუდოს.',
      'საჭიროების შემთხვევაში\nქვედა მუცელზე\nსითბო დაიდეთ.',
      'სცადეთ რბილი\nაქტივობა: სიარული,\nიოგა, გაჭიმვა.',
      'მიეცით თავს\nდასვენება და\nხარისხიანი ძილი.',
    ],
    reliefTitle: 'მოუსმინეთ თქვენს სხეულს',
    reliefText:
      'დასვენებას, სითბოსა და რბილ აქტივობას შეუძლია დახმარება. თუ ტკივილი ძალიან ინტენსიური ან უჩვეულო რჩება, მიმართეთ სამედიცინო რჩევას.',
    shareMessage: 'თქვენი მენსტრუაციის გაგება: რა ხდება სინამდვილეში — AWA',
  },
  hy: {
    badge: 'ԴԱՇՏԱՆԱՅԻՆ ՑԻԿԼ',
    title: 'Հասկանալ ձեր դաշտանը.\nինչ է իրականում կատարվում',
    metaDuration: '5 ր կարդալու համար',
    metaValidated: 'Վերանայված բովանդակություն',
    intro:
      'Ձեր դաշտանը բնական գործընթացի մաս է, որը էական է հորմոնալ և վերարտադրողական առողջության համար: Հասկանալը, թե ինչ է կատարվում ձեր մարմնում, կարող է օգնել ավելի հանգիստ զգալ յուրաքանչյուր ցիկլի հետ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է դաշտանը',
      'Ինչպես է ընթանում ձեր դաշտանը',
      'Ինչն է նորմալ (և ինչը՝ ոչ)',
      'Ցավը թեթևացնել բնական եղանակով',
    ],
    body1:
      'Դաշտանը արգանդի լորձաթաղանթի հեռացումն է, երբ բեղմնավորում տեղի չի ունեցել: Սա տեղի է ունենում միջինում ամիսը մեկ անգամ:',
    knowTitle: 'Լավ է իմանալ',
    knowText:
      'Յուրաքանչյուր կին եզակի է. տևողությունը, ինտենսիվությունը և զգացողությունները կարող են տարբերվել մի ցիկլից մյուսը:',
    body2:
      'Արտահոսքը ողջ դաշտանի ընթացքում նույնը չէ: Այն սովորաբար փոխվում է օրեցօր՝ ինտենսիվությամբ, գույնով և խտությամբ:',
    flowSteps: [
      {title: 'Դաշտանի սկիզբ', text: 'Արտահոսքը հաճախ ավելի առատ է առաջին օրերին:'},
      {title: 'Դաշտանի կես', text: 'Արտահոսքը սովորաբար սկսում է աստիճանաբար նվազել:'},
      {title: 'Դաշտանի վերջ', text: 'Արտահոսքը դառնում է ավելի թեթև և կարող է ավելի մուգ գույն ստանալ:'},
    ],
    softInfoTitle: 'Հիշեք',
    softInfoText:
      'Սա կարող է տարբերվել մի ցիկլից մյուսը: Կարևորը ձեր սեփական սովորական ռիթմը իմանալն է:',
    body3:
      'Որոշ տատանումներ տարածված են դաշտանի ընթացքում: Այլ նշաններ ավելի շատ ուշադրության են արժանի, հատկապես երբ դրանք նոր են կամ շատ ինտենսիվ:',
    normalSigns: [
      {title: 'Տևողություն', text: 'Դաշտան, որը սովորաբար տևում է մի քանի օր:'},
      {title: 'Փոփոխվող արտահոսք', text: 'Սկզբում ավելի առատ արտահոսք, ապա՝ ավելի թեթև:'},
      {title: 'Գույն', text: 'Վառ կարմիրից մինչև մուգ կարմիր կամ շագանակագույն՝ դաշտանի վերջին:'},
      {title: 'Զգացողություններ', text: 'Կարող են զգացվել թեթև կամ չափավոր ջղաձգումներ:'},
    ],
    warningTitle: 'Ե՞րբ դիմել բժշկական խորհրդատվության',
    warningSigns: [
      'Շատ ուժեղ կամ անսովոր ցավ',
      'Արյունահոսություն, որը շատ արագ թրջում է միջադիրը կամ տամպոնը',
      'Զգալի հոգնածություն, ուշագնացության զգացում կամ գլխապտույտ',
      'Հանկարծակի և շարունակական փոփոխություն ձեր սովորական օրինաչափությունից',
    ],
    body4:
      'Պարզ սովորությունները կարող են օգնել թեթևացնել անհարմարությունը և դաշտանի առաջին օրերը դարձնել ավելի հարմարավետ:',
    tipsTitle: 'Գործնական խորհուրդներ',
    tips: [
      'Բավարար ջուր խմեք՝\nհոգնածությունը\nսահմանափակելու համար:',
      'Անհրաժեշտության դեպքում\nջերմություն կիրառեք\nորովայնի ստորին հատվածին:',
      'Փորձեք մեղմ\nգործունեություն. քայլք,\nյոգա, ձգումներ:',
      'Թույլ տվեք ինքներդ ձեզ\nհանգիստ և որակյալ\nքուն:',
    ],
    reliefTitle: 'Լսեք ձեր մարմինը',
    reliefText:
      'Հանգիստը, ջերմությունը և մեղմ ակտիվությունը կարող են օգնել: Եթե ցավը մնում է շատ ուժեղ կամ անսովոր, դիմեք բժշկական խորհրդատվության:',
    shareMessage: 'Հասկանալ ձեր դաշտանը. ինչ է իրականում կատարվում — AWA',
  },
  tg: {
    badge: 'ДАВРАИ ҲАЙЗ',
    title: 'Фаҳмидани ҳайзи шумо:\nвоқеан чӣ рух дода истодааст',
    metaDuration: '5 дақ барои хондан',
    metaValidated: 'Мазмуни баррасишуда',
    intro:
      'Ҳайзи шумо қисми раванди табиист, ки барои саломатии гормонӣ ва таносулӣ муҳим аст. Фаҳмидани он ки дар бадани шумо чӣ рух дода истодааст, метавонад ба шумо кумак кунад бо ҳар давра худро роҳатар ҳис кунед.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Ҳайз чист?',
      'Ҳайзи шумо чӣ тавр мегузарад',
      'Чӣ муқаррарӣ аст (ва чӣ нест)',
      'Сабук кардани дард ба таври табиӣ',
    ],
    body1:
      'Ҳайз рехтани қабати бачадон аст, вақте ки бордоршавӣ рух надодааст. Ин ба ҳисоби миёна як маротиба дар як моҳ рух медиҳад.',
    knowTitle: 'Донистан хуб аст',
    knowText:
      'Ҳар зан беназир аст: давомнокӣ, шиддат ва эҳсосот аз як давра то давраи дигар метавонанд гуногун бошанд.',
    body2:
      'Ҷараён дар тамоми ҳайз якхела нест. Он одатан аз рӯз то рӯз, дар шиддат, ранг ва сохтор тағйир меёбад.',
    flowSteps: [
      {title: 'Оғози ҳайз', text: 'Ҷараён дар чанд рӯзи аввал аксар вақт зиёдтар аст.'},
      {title: 'Миёнаи ҳайз', text: 'Ҷараён одатан оғоз мекунад тадриҷан кам шавад.'},
      {title: 'Охири ҳайз', text: 'Ҷараён сабуктар мешавад ва метавонад ранги торикро гирад.'},
    ],
    softInfoTitle: 'Дар хотир доред',
    softInfoText:
      'Ин аз як давра то давраи дигар метавонад гуногун бошад. Муҳимтарин чиз донистани суръати одатии худи шумост.',
    body3:
      'Баъзе тағйирот ҳангоми ҳайз маъмуланд. Нишонаҳои дигар диққати бештарро сазоворанд, хусусан вақте ки нав ё хеле шадиданд.',
    normalSigns: [
      {title: 'Давомнокӣ', text: 'Ҳайзе, ки одатан чанд рӯз давом мекунад.'},
      {title: 'Ҷараёни тағйирёбанда', text: 'Дар аввал ҷараёни зиёдтар, сипас сабуктар.'},
      {title: 'Ранг', text: 'Аз сурхи равшан то сурхи тира ё қаҳваранг дар охири ҳайз.'},
      {title: 'Эҳсосот', text: 'Кашишхӯрии сабук то мӯътадил метавонад эҳсос шавад.'},
    ],
    warningTitle: 'Кай бояд маслиҳати тиббӣ пурсид?',
    warningSigns: [
      'Дарди хеле шадид ё ғайриоддӣ',
      'Хунравие, ки пайвандро ё тампонро хеле зуд тар мекунад',
      'Хастагии назаррас, эҳсоси беҳушӣ ё чарх задани сар',
      'Тағйироти ногаҳонӣ ва доимӣ аз намунаи одатии шумо',
    ],
    body4:
      'Одатҳои оддӣ метавонанд ба сабук кардани нороҳатӣ ва роҳаттар кардани рӯзҳои аввали ҳайз кумак кунанд.',
    tipsTitle: 'Маслиҳатҳои амалӣ',
    tips: [
      'Ба қадри кофӣ\nоб нӯшед, то ба\nкам кардани хастагӣ\nкумак кунед.',
      'Дар поёни\nшикам гармӣ\nгузоред, агар лозим\nбошад.',
      'Фаъолияти нармро\nбисанҷед: пиёдагардӣ,\nйога, кашиш.',
      'Ба худ истироҳат\nва хоби босифат\nдиҳед.',
    ],
    reliefTitle: 'Ба бадани худ гӯш диҳед',
    reliefText:
      'Истироҳат, гармӣ ва фаъолияти нарм метавонад кумак кунад. Агар дард хеле шадид ё ғайриоддӣ боқӣ монад, маслиҳати тиббӣ пурсед.',
    shareMessage: 'Фаҳмидани ҳайзи шумо: воқеан чӣ рух дода истодааст — AWA',
  },
  ky: {
    badge: 'ЕТЕК КИРИМ ЦИКЛИ',
    title: 'Етек киримиңизди түшүнүү:\nчындыгында эмне болуп жатат',
    metaDuration: '5 мүн окуу',
    metaValidated: 'Текшерилген мазмун',
    intro:
      'Етек кирим — гормондук жана көбөйүү ден соолугу үчүн маанилүү табигый процесстин бир бөлүгү. Денеңизде эмне болуп жатканын түшүнүү ар бир циклде өзүңүздү эркин сезүүгө жардам бериши мүмкүн.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Етек кирим деген эмне?',
      'Етек кирим кантип өтөт',
      'Эмне кадимки (жана эмне эмес)',
      'Ооруну табигый жол менен жеңилдетүү',
    ],
    body1:
      'Етек кирим — уруктануу болбогондо жатындын ички катмарынын чыгышы. Бул орточо айына бир жолу болот.',
    knowTitle: 'Билүү пайдалуу',
    knowText:
      'Ар бир аял уникалдуу: узактык, курчтук жана сезимдер циклден циклге айырмаланышы мүмкүн.',
    body2:
      'Агым етек кирим бою бирдей эмес. Ал адатта күндөн күнгө курчтугу, түсү жана текстурасы боюнча өзгөрөт.',
    flowSteps: [
      {title: 'Етек киримдин башталышы', text: 'Агым көбүнчө алгачкы күндөрдө көбүрөөк болот.'},
      {title: 'Етек киримдин ортосу', text: 'Агым жалпысынан акырындап азая баштайт.'},
      {title: 'Етек киримдин аякташы', text: 'Агым жеңилдеп, кара түскө ээ болушу мүмкүн.'},
    ],
    softInfoTitle: 'Эстен чыгарбаңыз',
    softInfoText:
      'Бул циклден циклге айырмаланышы мүмкүн. Эң маанилүүсү — өзүңүздүн адаттагы ритмиңизди билүү.',
    body3:
      'Етек кирим учурунда айрым өзгөрүүлөр кеңири таралган. Башка белгилер көбүрөөк көңүл бурууга татыйт, айрыкча алар жаңы же абдан күчтүү болгондо.',
    normalSigns: [
      {title: 'Узактык', text: 'Адатта бир нече күн созулган етек кирим.'},
      {title: 'Өзгөрүлмө агым', text: 'Башында көбүрөөк агым, андан кийин жеңилирээк.'},
      {title: 'Түсү', text: 'Жаркын кызылдан кара кызылга же етек кирим аягында күрөңгө чейин.'},
      {title: 'Сезимдер', text: 'Жеңилден орточого чейинки спазмдар сезилиши мүмкүн.'},
    ],
    warningTitle: 'Медициналык кеңешти качан сурап кайрылуу керек?',
    warningSigns: [
      'Абдан күчтүү же адаттан тыш оору',
      'Прокладканы же тампонду өтө тез сиңирген кан кетүү',
      'Олуттуу чарчоо, эсин жоготуп жаткандай сезим же баш айлануу',
      'Адаттагы мыйзам ченемдүүлүктөн капыстан жана улана берген өзгөрүү',
    ],
    body4:
      'Жөнөкөй адаттар ыңгайсыздыкты жеңилдетип, етек киримдин алгачкы күндөрүн ыңгайлуураак кылууга жардам бериши мүмкүн.',
    tipsTitle: 'Практикалык кеңештер',
    tips: [
      'Чарчоону чектөөгө\nжардам берүү үчүн\nжетиштүү суу\nичиңиз.',
      'Керек болсо курсактын\nылдый жагына\nжылуулук\nкойуңуз.',
      'Жумшак активдүүлүктү\nбайкап көрүңүз: басуу,\nйога, чоюлуу.',
      'Өзүңүзгө эс алууга\nжана сапаттуу\nуйкуга убакыт\nбериңиз.',
    ],
    reliefTitle: 'Денеңизди угуңуз',
    reliefText:
      'Эс алуу, жылуулук жана жумшак активдүүлүк жардам бере алат. Эгер оору абдан күчтүү же адаттан тыш бойдон калса, медициналык кеңеш сураңыз.',
    shareMessage: 'Етек киримиңизди түшүнүү: чындыгында эмне болуп жатат — AWA',
  },
  tk: {
    badge: 'AÝBAŞY SIKLI',
    title: 'Aýbaşyňyzy düşünmek:\nhakykatdan näme bolýar',
    metaDuration: '5 min okamak',
    metaValidated: 'Barlanan mazmun',
    intro:
      'Aýbaşyňyz gormonal we köpelýiş saglygy üçin zerur tebigy prosesiň bir bölegi. Bedeniňizde nämäniň bolýandygyny düşünmek her sikl bilen özüňizi has rahat duýmaga kömek edip biler.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Aýbaşy näme?',
      'Aýbaşyňyz nähili geçýär',
      'Nämäniň adaty (we nämäniň däl)',
      'Agyry tebigy ýagdaýda ýeňilleşdirmek',
    ],
    body1:
      'Aýbaşy tohumlanma bolmadyk ýagdaýynda ýatgy içki gatlagynyň taşlanmagy. Bu ortaça aýda bir gezek bolýar.',
    knowTitle: 'Bilmek peýdaly',
    knowText:
      'Her aýal ýeke-täk: dowamlylyk, güýçlülik we duýgular sikldan sika üýtgäp biler.',
    body2:
      'Gan akma aýbaşyňyzyň dowamynda şol bir däl. Ol adatça günden güne güýçlüligi, reňki we konsistensiýasy boýunça üýtgeýär.',
    flowSteps: [
      {title: 'Aýbaşynyň başy', text: 'Gan akma köplenç ilkinji günlerde has köp.'},
      {title: 'Aýbaşynyň ortasy', text: 'Gan akma adatça ýuwaş-ýuwaşdan azalyp başlaýar.'},
      {title: 'Aýbaşynyň ahyry', text: 'Gan akma ýeňilleşýär we has goýy reňke eýe bolup biler.'},
    ],
    softInfoTitle: 'Ýatda saklaň',
    softInfoText:
      'Bu sikldan sika üýtgäp biler. Iň möhümi öz adaty ritmiňizi bilmek.',
    body3:
      'Aýbaşy wagtynda käbir üýtgeşmeler umumy. Beýleki alamatlar, aýratyn-da täze ýa-da gaty güýçli bolanda, has köp üns talap edýär.',
    normalSigns: [
      {title: 'Dowamlylyk', text: 'Adatça birnäçe gün dowam edýän aýbaşy.'},
      {title: 'Üýtgeýän gan akma', text: 'Başda has köp, soňra has ýeňil gan akma.'},
      {title: 'Reňk', text: 'Açyk gyzyldan goýy gyzyla ýa-da aýbaşynyň ahyryna golaý goňur reňke çenli.'},
      {title: 'Duýgular', text: 'Ýeňilden ortaça çekişmeler duýulyp biler.'},
    ],
    warningTitle: 'Lukmançylyk maslahatyny haçan soramaly?',
    warningSigns: [
      'Gaty güýçli ýa-da adaty däl agyry',
      'Prokladkany ýa-da tamponyny gaty çalt siňdirýän gan akma',
      'Möhüm ýadawlyk, huşdan gitmek duýgusy ýa-da kelle aýlanmasy',
      'Adaty nusgaňyzdan ýiti we dowamly üýtgeşme',
    ],
    body4:
      'Ýönekeý endikler biynjalygy ýeňilleşdirmäge we aýbaşyňyzyň ilkinji günlerini has rahat etmäge kömek edip biler.',
    tipsTitle: 'Amaly maslahatlar',
    tips: [
      'Ýadawlygy\nçäklemek üçin\nýeterlik suw\niçiň.',
      'Zerur bolsa\ngarnyň aşagyna\nýylylyk goýuň.',
      'Ýumşak işjeňligi\nsynap görüň: ýöremek,\nýoga, uzaltmak.',
      'Özüňize dynç we\nhilli uky\nberiň.',
    ],
    reliefTitle: 'Bedeniňize gulak asyň',
    reliefText:
      'Dynç, ýylylyk we ýumşak işjeňlik kömek edip biler. Agyry gaty güýçli ýa-da adaty däl bolup galsa, lukmançylyk maslahatyny soraň.',
    shareMessage: 'Aýbaşyňyzy düşünmek: hakykatdan näme bolýar — AWA',
  },
} as const);

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function UnderstandMenstrualFlowArticleScreen({
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
    const next = toggleBookmark(ID);
    setSaved(next);
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
            paddingBottom:
              getBottomPadding(insets.bottom, READING_CONTROLS_SPACE),
          },
        ]}>
        <View style={styles.heroWrap}>
          <Image
            source={HERO}
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop:
                  getTopPadding(insets.top, true),
              },
            ]}>
            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={23}
              onPress={navigation.goBack}
              variant="tonal"
            />

            <View style={styles.actions}>
              <AwaIconButton
                accessibilityLabel={t('library.screen.addBookmark')}
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

        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>{content.title}</AwaText>

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              ['shield-check-outline', content.metaValidated],
            ].map(([icon, text]) => (
              <View
                key={icon}
                style={styles.meta}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.textMuted}
                  size={14}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                  {text}
                </AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="bodyMedium" style={styles.intro}>{content.intro}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleSmall" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>
                  {index + 1}.
                </AwaText>

                <AwaText variant="bodySmall" style={styles.contentText}>
                  {item}
                </AwaText>

                <MaterialDesignIcons
                  name="chevron-right"
                  color={theme.colors.primary}
                  size={17}
                />
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.body1}</AwaText>

          <View style={styles.processCard}>
            <Image
              source={PROCESS}
              resizeMode="cover"
              style={styles.process}
            />
          </View>

          <AwaCard variant="filled" padding="none" style={styles.know}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              color={theme.colors.primary}
              size={23}
            />

            <View style={styles.knowCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.knowTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.knowText}>
                {content.knowText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.timelineCard}>
            {FLOW_STEPS.map((step, index) => {
              const stepContent = content.flowSteps[index];

              return (
                <View
                  key={step.number}
                  style={[
                    styles.timelineRow,
                    index < FLOW_STEPS.length - 1 &&
                      styles.timelineDivider,
                  ]}>
                  <View style={styles.timelineNumber}>
                    <AwaText variant="labelSmall" emphasized colorRole="onSurfaceVariant">
                      {step.number}
                    </AwaText>
                  </View>

                  <View style={styles.timelineIcon}>
                    <MaterialDesignIcons
                      name={step.icon as never}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.timelineCopy}>
                    <AwaText variant="titleSmall" emphasized>
                      {stepContent.title}
                    </AwaText>
                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.timelineText}>
                      {stepContent.text}
                    </AwaText>
                  </View>
                </View>
              );
            })}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.softInfo}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.primary}
            />

            <View style={styles.softInfoCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.softInfoTitle}
              </AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.softInfoText}>
                {content.softInfoText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.body3}</AwaText>

          <View style={styles.normalGrid}>
            {NORMAL_SIGNS.map((item, index) => {
              const signContent = content.normalSigns[index];

              return (
                <View
                  key={item.icon}
                  style={styles.normalCard}>
                  <View style={styles.normalIcon}>
                    <MaterialDesignIcons
                      name={item.icon as never}
                      size={22}
                      color={theme.colors.primary}
                    />
                  </View>

                  <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>
                    {signContent.title}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>
                    {signContent.text}
                  </AwaText>
                </View>
              );
            })}
          </View>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <View style={styles.warningIcon}>
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={22}
                  color={theme.colors.warning}
                />
              </View>

              <AwaText variant="titleSmall" emphasized style={styles.warningTitle}>
                {content.warningTitle}
              </AwaText>
            </View>

            <View style={styles.warningList}>
              {content.warningSigns.map(item => (
                <View
                  key={item}
                  style={styles.warningRow}>
                  <View style={styles.warningBullet} />
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>
                    {item}
                  </AwaText>
                </View>
              ))}
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.body4}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tipsCard}>
            <View style={styles.tipsTitleRow}>
              <MaterialDesignIcons
                name="heart-outline"
                color={theme.colors.primary}
                size={21}
              />

              <AwaText variant="titleMedium">
                {content.tipsTitle}
              </AwaText>
            </View>

            <View style={styles.tipsRow}>
              {TIPS.map((tip, index) => (
                <View
                  key={index}
                  style={[
                    styles.tip,
                    index > 0 &&
                      styles.tipBorder,
                  ]}>
                  <Image
                    source={tip.image}
                    style={styles.tipImage}
                  />

                  <AwaText variant="bodySmall" style={styles.tipText}>
                    {content.tips[index]}
                  </AwaText>
                </View>
              ))}
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.reliefTip}>
            <MaterialDesignIcons
              name="spa-outline"
              size={22}
              color={theme.colors.primary}
            />

            <View style={styles.reliefCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.reliefTitle}
              </AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.reliefText}>
                {content.reliefText}
              </AwaText>
            </View>
          </AwaCard>

        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    scroll: {
      paddingBottom: 28,
    },

    heroWrap: {
      height: 250,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    hero: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
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



    article: {
      marginTop: -16,
      paddingHorizontal: 20,
      paddingTop: 24,
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
      gap: 12,
    },

    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },


    intro: {
      marginTop: 16,
    },

    contents: {
      marginTop: 20,
      padding: 16,
    },

    contentsTitle: {
      marginBottom: 8,
    },

    contentRow: {
      minHeight: 35,
      flexDirection: 'row',
      alignItems: 'center',
    },

    contentNumber: {
      width: 23,
    },

    contentText: {
      flex: 1,
    },

    sectionTitle: {
      marginTop: 24,
    },

    body: {
      marginTop: 12,
    },

    processCard: {
      marginTop: 16,
      height: 116,
      overflow: 'hidden',
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    process: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },

    know: {
      marginTop: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },

    knowCopy: {
      flex: 1,
      marginLeft: 12,
    },


    knowText: {
      marginTop: 4,
    },

    timelineCard: {
      marginTop: 16,
      paddingHorizontal: 12,
    },

    timelineRow: {
      minHeight: 84,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },

    timelineDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },

    timelineNumber: {
      width: 30,
    },

    // Kept as textMuted (not the dominant accent): the numbering column was
    // already a distinct muted gray-purple in the original design, not the
    // PURPLE accent used for the icon circles.

    timelineIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    timelineCopy: {
      flex: 1,
      marginLeft: 12,
    },


    timelineText: {
      marginTop: 4,
    },

    softInfo: {
      marginTop: 16,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },

    softInfoCopy: {
      flex: 1,
      marginLeft: 12,
    },


    softInfoText: {
      marginTop: 3,
    },

    normalGrid: {
      marginTop: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    normalCard: {
      width: '48.7%',
      minHeight: 122,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    normalIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
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

    warningCard: {
      marginTop: 16,
      padding: 12,
      backgroundColor: withAlpha(theme.colors.warning, 0.12),
    },

    warningHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    warningIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(theme.colors.warning, 0.18),
    },

    warningTitle: {
      flex: 1,
      marginLeft: 12,
    },

    warningList: {
      marginTop: 12,
      gap: 8,
    },

    warningRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    warningBullet: {
      width: 5,
      height: 5,
      marginTop: 8,
      marginRight: 8,
      borderRadius: 3,
      backgroundColor: theme.colors.warning,
    },

    warningText: {
      flex: 1,
    },

    tipsCard: {
      marginTop: 16,
      padding: 16,
    },

    tipsTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },


    tipsRow: {
      marginTop: 16,
      flexDirection: 'row',
    },

    tip: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 4,
    },

    tipBorder: {
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
    },

    tipImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },

    tipText: {
      marginTop: 8,
      textAlign: 'center',
    },

    reliefTip: {
      marginTop: 16,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },

    reliefCopy: {
      flex: 1,
      marginLeft: 12,
    },


    reliefText: {
      marginTop: 3,
    },

  });
}
