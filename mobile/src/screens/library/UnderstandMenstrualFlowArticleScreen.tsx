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
const CONTENT = {
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
} as const;

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
