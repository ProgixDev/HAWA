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
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'fertility-fenetre-fertile';

const HERO = CYCLE_PHASES_HERO;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const TRACKING_ICONS = [
  'calendar-month-outline',
  'water-outline',
  'thermometer',
  'test-tube',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('FertilityWindow', {
  fr: {
    badge: 'FENÊTRE FERTILE',
    title: 'La fenêtre fertile,\ncomment ça marche',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi les jours autour de l’ovulation comptent le plus pour concevoir.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que la fenêtre fertile ?',
      'Pourquoi ces jours comptent le plus',
      'Comment repérer sa fenêtre fertile',
      'À retenir',
    ],
    section1Body: 'La fenêtre fertile désigne la période du cycle pendant laquelle une grossesse est possible. Elle s’étend sur environ 6 jours : les 5 jours précédant l’ovulation, plus le jour de l’ovulation lui-même.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Chaque cycle est différent : la fenêtre fertile ne tombe pas forcément au même jour du calendrier d’un mois à l’autre.',
    section2Body1: 'Les spermatozoïdes peuvent survivre jusqu’à 5 jours dans les voies génitales, ce qui élargit la période de conception possible. L’ovule, lui, ne reste fécondable qu’environ 24 heures après sa libération.',
    section2Body2: 'Par exemple, un rapport survenu 3 jours avant l’ovulation peut aboutir à une conception, alors qu’un rapport le lendemain de l’ovulation arrive souvent trop tard.',
    section3Intro: 'Plusieurs signaux, observés ensemble, aident à mieux cerner cette période :',
    trackingSigns: [
      'Suivre la longueur de ton cycle',
      'Observer ta glaire cervicale',
      'Mesurer ta température basale',
      'Utiliser des tests d’ovulation (LH)',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Multiplier les repères (cycle, glaire, température) donne une vision plus fiable de ta fenêtre fertile qu’un seul indice isolé.',
    shareMessage: 'La fenêtre fertile, comment ça marche — AWA',
  },
  en: {
    badge: 'FERTILE WINDOW',
    title: 'The fertile window:\nhow it works',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Why the days around ovulation matter most for conceiving.',
    contentsTitle: 'In this article',
    topics: [
      'What is the fertile window?',
      'Why these days matter most',
      'How to identify your fertile window',
      'Key takeaways',
    ],
    section1Body: 'The fertile window refers to the period in your cycle during which pregnancy is possible. It spans about 6 days: the 5 days before ovulation, plus the day of ovulation itself.',
    tip1Title: 'Good to know',
    tip1Text: 'Every cycle is different: the fertile window doesn’t necessarily fall on the same calendar day from one month to the next.',
    section2Body1: 'Sperm can survive for up to 5 days in the reproductive tract, which widens the period during which conception is possible. The egg, meanwhile, remains fertilizable for only about 24 hours after it’s released.',
    section2Body2: 'For example, intercourse that happens 3 days before ovulation can lead to conception, while intercourse the day after ovulation often comes too late.',
    section3Intro: 'Several signs, observed together, help you better pinpoint this period:',
    trackingSigns: [
      'Tracking your cycle length',
      'Observing your cervical mucus',
      'Measuring your basal body temperature',
      'Using ovulation (LH) tests',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Combining several signs (cycle, mucus, temperature) gives a more reliable picture of your fertile window than any single sign on its own.',
    shareMessage: 'The fertile window: how it works — AWA',
  },
  es: {
    badge: 'VENTANA FÉRTIL',
    title: 'La ventana fértil,\ncómo funciona',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Por qué los días alrededor de la ovulación son los que más importan para concebir.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es la ventana fértil?',
      'Por qué estos días importan más',
      'Cómo identificar tu ventana fértil',
      'Para recordar',
    ],
    section1Body: 'La ventana fértil designa el periodo del ciclo durante el cual un embarazo es posible. Se extiende a lo largo de unos 6 días: los 5 días previos a la ovulación, más el día de la ovulación en sí.',
    tip1Title: 'Dato útil',
    tip1Text: 'Cada ciclo es diferente: la ventana fértil no cae necesariamente en el mismo día del calendario de un mes a otro.',
    section2Body1: 'Los espermatozoides pueden sobrevivir hasta 5 días en las vías genitales, lo que amplía el periodo de concepción posible. El óvulo, en cambio, solo permanece fecundable durante unas 24 horas tras su liberación.',
    section2Body2: 'Por ejemplo, una relación sexual 3 días antes de la ovulación puede derivar en una concepción, mientras que una relación al día siguiente de la ovulación suele llegar demasiado tarde.',
    section3Intro: 'Varias señales, observadas en conjunto, ayudan a identificar mejor este periodo:',
    trackingSigns: [
      'Seguir la duración de tu ciclo',
      'Observar tu moco cervical',
      'Medir tu temperatura basal',
      'Usar pruebas de ovulación (LH)',
    ],
    tip2Title: 'Dato útil',
    tip2Text: 'Combinar varios indicios (ciclo, moco, temperatura) da una visión más fiable de tu ventana fértil que una sola señal aislada.',
    shareMessage: 'La ventana fértil, cómo funciona — AWA',
  },
  it: {
    badge: 'FINESTRA FERTILE',
    title: 'La finestra fertile:\ncome funziona',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Perché i giorni intorno all’ovulazione sono i più importanti per concepire.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è la finestra fertile?',
      'Perché questi giorni contano di più',
      'Come individuare la tua finestra fertile',
      'Punti chiave',
    ],
    section1Body: 'La finestra fertile indica il periodo del tuo ciclo in cui una gravidanza è possibile. Dura circa 6 giorni: i 5 giorni prima dell’ovulazione, più il giorno stesso dell’ovulazione.',
    tip1Title: 'Da sapere',
    tip1Text: 'Ogni ciclo è diverso: la finestra fertile non cade necessariamente nello stesso giorno del calendario da un mese all’altro.',
    section2Body1: 'Gli spermatozoi possono sopravvivere fino a 5 giorni nelle vie genitali, il che amplia il periodo in cui il concepimento è possibile. L’ovulo, invece, rimane fecondabile solo per circa 24 ore dopo il rilascio.',
    section2Body2: 'Ad esempio, un rapporto che avviene 3 giorni prima dell’ovulazione può portare al concepimento, mentre un rapporto il giorno dopo l’ovulazione arriva spesso troppo tardi.',
    section3Intro: 'Diversi segnali, osservati insieme, ti aiutano a individuare meglio questo periodo:',
    trackingSigns: [
      'Tenere traccia della durata del tuo ciclo',
      'Osservare il tuo muco cervicale',
      'Misurare la tua temperatura basale',
      'Usare i test di ovulazione (LH)',
    ],
    tip2Title: 'Da sapere',
    tip2Text: 'Combinare più segnali (ciclo, muco, temperatura) offre un quadro più affidabile della tua finestra fertile rispetto a un singolo segnale preso da solo.',
    shareMessage: 'La finestra fertile: come funziona — AWA',
  },
  tr: {
    badge: 'DOĞURGANLIK DÖNEMİ',
    title: 'Doğurganlık dönemi:\nnasıl işler?',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Hamile kalmak için yumurtlama çevresindeki günlerin neden en önemli olduğu.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Doğurganlık dönemi nedir?',
      'Bu günler neden en önemli?',
      'Doğurganlık dönemini nasıl belirlersin?',
      'Akılda kalacaklar',
    ],
    section1Body: 'Doğurganlık dönemi, döngünde gebeliğin mümkün olduğu zaman aralığını ifade eder. Yaklaşık 6 gün sürer: yumurtlamadan önceki 5 gün ve yumurtlamanın gerçekleştiği gün.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Her döngü farklıdır: doğurganlık dönemi, bir aydan diğerine takvimde mutlaka aynı güne denk gelmez.',
    section2Body1: 'Sperm, üreme yolunda 5 güne kadar canlı kalabilir; bu da hamile kalmanın mümkün olduğu süreyi genişletir. Yumurta hücresi ise salındıktan sonra yalnızca yaklaşık 24 saat boyunca döllenebilir durumda kalır.',
    section2Body2: 'Örneğin, yumurtlamadan 3 gün önce gerçekleşen cinsel ilişki hamileliğe yol açabilirken, yumurtlamadan bir gün sonraki ilişki çoğu zaman çok geç kalmış olur.',
    section3Intro: 'Birlikte gözlemlenen birkaç belirti, bu dönemi daha iyi saptamana yardımcı olur:',
    trackingSigns: [
      'Döngü uzunluğunu takip etmek',
      'Servikal mukusunu gözlemlemek',
      'Bazal vücut sıcaklığını ölçmek',
      'Ovülasyon (LH) testleri kullanmak',
    ],
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Birkaç belirtiyi (döngü, mukus, sıcaklık) bir arada kullanmak, doğurganlık dönemin hakkında tek bir belirtiden daha güvenilir bir tablo sunar.',
    shareMessage: 'Doğurganlık dönemi: nasıl işler? — AWA',
  },
  ru: {
    badge: 'ФЕРТИЛЬНОЕ ОКНО',
    title: 'Фертильное окно:\nкак оно работает',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Почему дни вокруг овуляции важнее всего для зачатия.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое фертильное окно?',
      'Почему эти дни важнее всего',
      'Как определить своё фертильное окно',
      'Главное',
    ],
    section1Body: 'Фертильное окно — это период цикла, в который возможна беременность. Оно длится около 6 дней: 5 дней до овуляции и сам день овуляции.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Каждый цикл отличается: фертильное окно не обязательно приходится на одни и те же числа месяца от цикла к циклу.',
    section2Body1: 'Сперматозоиды могут сохранять жизнеспособность в половых путях до 5 дней, что расширяет период, в который возможно зачатие. Яйцеклетка же способна к оплодотворению лишь около 24 часов после выхода из яичника.',
    section2Body2: 'Например, половой акт за 3 дня до овуляции может привести к зачатию, а на следующий день после овуляции он чаще всего уже слишком поздний.',
    section3Intro: 'Определить этот период точнее помогают несколько признаков, которые наблюдают вместе:',
    trackingSigns: [
      'Отслеживание длительности цикла',
      'Наблюдение за цервикальной слизью',
      'Измерение базальной температуры',
      'Тесты на овуляцию (ЛГ)',
    ],
    tip2Title: 'Полезно знать',
    tip2Text: 'Сочетание нескольких признаков (цикл, слизь, температура) даёт более надёжное представление о вашем фертильном окне, чем любой отдельный признак.',
    shareMessage: 'Фертильное окно: как оно работает — AWA',
  },
  de: {
    badge: 'FRUCHTBARES FENSTER',
    title: 'Das fruchtbare Fenster:\nSo funktioniert es',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Warum die Tage rund um den Eisprung für eine Schwangerschaft am wichtigsten sind.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist das fruchtbare Fenster?',
      'Warum diese Tage am wichtigsten sind',
      'Wie du dein fruchtbares Fenster erkennst',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Das fruchtbare Fenster bezeichnet die Zeit in deinem Zyklus, in der eine Schwangerschaft möglich ist. Es umfasst etwa 6 Tage: die 5 Tage vor dem Eisprung sowie den Tag des Eisprungs selbst.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Jeder Zyklus ist anders: Das fruchtbare Fenster fällt nicht unbedingt jeden Monat auf denselben Kalendertag.',
    section2Body1: 'Spermien können bis zu 5 Tage in den Geschlechtsorganen überleben, wodurch sich der Zeitraum verlängert, in dem eine Empfängnis möglich ist. Die Eizelle hingegen bleibt nach ihrer Freisetzung nur etwa 24 Stunden befruchtungsfähig.',
    section2Body2: 'Geschlechtsverkehr 3 Tage vor dem Eisprung kann zum Beispiel zu einer Empfängnis führen, während er am Tag nach dem Eisprung oft zu spät kommt.',
    section3Intro: 'Mehrere Anzeichen, gemeinsam beobachtet, helfen dir, diesen Zeitraum besser einzugrenzen:',
    trackingSigns: [
      'Die Länge deines Zyklus verfolgen',
      'Deinen Zervixschleim beobachten',
      'Deine Basaltemperatur messen',
      'Ovulationstests (LH-Tests) verwenden',
    ],
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Wenn du mehrere Anzeichen (Zyklus, Schleim, Temperatur) kombinierst, erhältst du ein verlässlicheres Bild deines fruchtbaren Fensters als mit einem einzelnen Anzeichen.',
    shareMessage: 'Das fruchtbare Fenster: So funktioniert es – AWA',
  },
  zh: {
      badge: '易孕期',
      title: '易孕期：\n它是如何运作的',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '为什么排卵前后的几天，对受孕来说最为关键。',
      contentsTitle: '本文内容',
      topics: [
        '什么是易孕期？',
        '为什么这几天最关键',
        '如何判断你的易孕期',
        '要点回顾',
      ],
      section1Body: '易孕期是指你的周期中可能怀孕的那段时间，约持续 6 天：排卵前的 5 天，加上排卵当天。',
      tip1Title: '小贴士',
      tip1Text: '每个周期都不一样：易孕期不一定每个月都落在日历上的同一天。',
      section2Body1: '精子在生殖道内最多可存活 5 天，这使得可能受孕的时间范围变宽。而卵子排出后，只有大约 24 小时具备受精能力。',
      section2Body2: '例如，排卵前 3 天发生的性生活可能导致受孕，而排卵后一天的性生活往往已经太晚。',
      section3Intro: '结合观察几个迹象，可以帮助你更准确地判断这段时间：',
      trackingSigns: [
        '记录你的周期长度',
        '观察你的宫颈黏液',
        '测量你的基础体温',
        '使用排卵试纸（LH 检测）',
      ],
      tip2Title: '小贴士',
      tip2Text: '把几种迹象（周期、黏液、体温）结合起来，比单看某一个迹象，更能可靠地反映你的易孕期。',
      shareMessage: '易孕期：它是如何运作的 — AWA',
    },
  id: {
    badge: 'MASA SUBUR',
    title: 'Masa subur:\ncara kerjanya',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Mengapa hari-hari di sekitar ovulasi paling penting untuk program hamil.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu masa subur?',
      'Mengapa hari-hari ini paling penting',
      'Cara mengenali masa suburmu',
      'Poin penting',
    ],
    section1Body: 'Masa subur adalah periode dalam siklusmu ketika kehamilan mungkin terjadi. Rentangnya sekitar 6 hari: 5 hari sebelum ovulasi, ditambah hari ovulasi itu sendiri.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Setiap siklus berbeda: masa subur tidak selalu jatuh pada tanggal kalender yang sama dari satu bulan ke bulan berikutnya.',
    section2Body1: 'Sperma dapat bertahan hingga 5 hari di saluran reproduksi, sehingga memperluas periode ketika pembuahan mungkin terjadi. Sementara itu, sel telur hanya bisa dibuahi sekitar 24 jam setelah dilepaskan.',
    section2Body2: 'Misalnya, hubungan intim yang terjadi 3 hari sebelum ovulasi dapat menyebabkan pembuahan, sedangkan hubungan intim sehari setelah ovulasi sering kali sudah terlambat.',
    section3Intro: 'Beberapa tanda, jika diamati bersama, membantumu menentukan periode ini dengan lebih tepat:',
    trackingSigns: [
      'Mencatat panjang siklusmu',
      'Mengamati lendir serviksmu',
      'Mengukur suhu tubuh basalmu',
      'Menggunakan tes ovulasi (LH)',
    ],
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Menggabungkan beberapa tanda (siklus, lendir, suhu) memberi gambaran masa suburmu yang lebih andal daripada satu tanda saja.',
    shareMessage: 'Masa subur: cara kerjanya — AWA',
  },
  hi: {
    badge: 'फ़र्टाइल विंडो',
    title: 'फ़र्टाइल विंडो:\nयह कैसे काम करती है',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'गर्भधारण के लिए ओव्यूलेशन के आसपास के दिन सबसे ज़्यादा अहम क्यों होते हैं।',
    contentsTitle: 'इस लेख में',
    topics: [
      'फ़र्टाइल विंडो क्या है?',
      'ये दिन सबसे ज़्यादा अहम क्यों हैं',
      'अपनी फ़र्टाइल विंडो की पहचान कैसे करें',
      'मुख्य बातें',
    ],
    section1Body: 'फ़र्टाइल विंडो आपके चक्र का वह समय है जब गर्भधारण संभव होता है। यह लगभग 6 दिन की होती है: ओव्यूलेशन (अंडोत्सर्ग) से पहले के 5 दिन और ओव्यूलेशन का दिन।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'हर चक्र अलग होता है: फ़र्टाइल विंडो हर महीने कैलेंडर की उसी तारीख़ पर आए, यह ज़रूरी नहीं।',
    section2Body1: 'शुक्राणु प्रजनन मार्ग में 5 दिन तक जीवित रह सकते हैं, जिससे गर्भधारण संभव होने का समय बढ़ जाता है। वहीं अंडाणु निकलने के बाद केवल लगभग 24 घंटे तक ही निषेचन के योग्य रहता है।',
    section2Body2: 'उदाहरण के लिए, ओव्यूलेशन से 3 दिन पहले हुए संभोग से गर्भधारण हो सकता है, जबकि ओव्यूलेशन के अगले दिन हुआ संभोग अक्सर बहुत देर से होता है।',
    section3Intro: 'कई संकेतों को साथ मिलाकर देखने से आप इस समय को बेहतर पहचान पाती हैं:',
    trackingSigns: [
      'अपने चक्र की लंबाई पर नज़र रखना',
      'गर्भाशय ग्रीवा के म्यूकस को देखना',
      'बेसल तापमान नापना',
      'ओव्यूलेशन (LH) टेस्ट का इस्तेमाल करना',
    ],
    tip2Title: 'जानना अच्छा रहेगा',
    tip2Text: 'कई संकेतों (चक्र, म्यूकस, तापमान) को मिलाकर देखने से आपकी फ़र्टाइल विंडो की तस्वीर किसी एक संकेत के मुक़ाबले ज़्यादा भरोसेमंद बनती है।',
    shareMessage: 'फ़र्टाइल विंडो: यह कैसे काम करती है — AWA',
  },
  sq: {
    badge: 'DRITARJA PJELLORE',
    title: 'Dritarja pjellore:\nsi funksionon',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Pse ditët rreth ovulacionit kanë më shumë rëndësi për të ngelur shtatzënë.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë është dritarja pjellore?',
      'Pse këto ditë kanë më shumë rëndësi',
      'Si ta identifikosh dritaren tënde pjellore',
      'Pikat kryesore',
    ],
    section1Body: 'Dritarja pjellore i referohet periudhës së ciklit tënd gjatë së cilës shtatzënia është e mundur. Ajo përfshin rreth 6 ditë: 5 ditët para ovulacionit, plus ditën e vetë ovulacionit.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Çdo cikël është i ndryshëm: dritarja pjellore nuk bie domosdoshmërisht në të njëjtën ditë të kalendarit nga një muaj te tjetri.',
    section2Body1: 'Spermatozoidet mund të mbijetojnë deri në 5 ditë në traktin riprodhues, çka e zgjeron periudhën gjatë së cilës është i mundur konceptimi. Veza, nga ana tjetër, mbetet e aftë për t’u fekondur vetëm për rreth 24 orë pasi çlirohet.',
    section2Body2: 'Për shembull, marrëdhënia që ndodh 3 ditë para ovulacionit mund të çojë në konceptim, ndërsa marrëdhënia një ditë pas ovulacionit shpesh vjen shumë vonë.',
    section3Intro: 'Disa shenja, të vëzhguara së bashku, të ndihmojnë ta përcaktosh më mirë këtë periudhë:',
    trackingSigns: [
      'Ndjekja e gjatësisë së ciklit tënd',
      'Vëzhgimi i mukusit të qafës së mitrës',
      'Matja e temperaturës bazale',
      'Përdorimi i testeve të ovulacionit (LH)',
    ],
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Kombinimi i disa shenjave (cikli, mukusi, temperatura) jep një pamje më të besueshme të dritares sate pjellore sesa çdo shenjë e vetme më vete.',
    shareMessage: 'Dritarja pjellore: si funksionon — AWA',
  },
  ja: {
    badge: '妊娠しやすい期間',
    title: '妊娠しやすい期間：\nそのしくみ',
    metaDuration: '読了6分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: '妊娠を望むとき、排卵前後の数日がもっとも大切な理由です。',
    contentsTitle: 'この記事の内容',
    topics: [
      '妊娠しやすい期間とは？',
      'なぜこの数日が大切なのか',
      '妊娠しやすい期間の見つけ方',
      'ポイントのまとめ',
    ],
    section1Body: '妊娠しやすい期間とは、周期の中で妊娠が起こりうる期間のことです。約6日間で、排卵の前の5日間と排卵日当日にあたります。',
    tip1Title: '知っておきたいこと',
    tip1Text: '周期は毎回異なります。妊娠しやすい期間が、毎月カレンダー上の同じ日に来るとは限りません。',
    section2Body1: '精子は生殖器の中で最大5日間生きられるため、妊娠が起こりうる期間が広がります。一方、卵子は放出されてからおよそ24時間しか受精できる状態を保てません。',
    section2Body2: 'たとえば、排卵の3日前の性交渉で妊娠することはありますが、排卵の翌日の性交渉では遅すぎることが多いです。',
    section3Intro: 'いくつかのサインを組み合わせて観察すると、この期間をより正確につかめます。',
    trackingSigns: [
      '周期の長さを記録する',
      '頸管粘液を観察する',
      '基礎体温を測る',
      '排卵検査薬（LH検査）を使う',
    ],
    tip2Title: '知っておきたいこと',
    tip2Text: '周期、粘液、体温など複数のサインを組み合わせると、ひとつのサインだけに頼るより、妊娠しやすい期間をより確かにとらえられます。',
    shareMessage: '妊娠しやすい期間：そのしくみ — AWA',
  },
  ko: {
    badge: '가임기',
    title: '가임기:\n어떻게 작동할까요',
    metaDuration: '6분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '임신을 위해 배란 전후의 날들이 가장 중요한 이유를 알아봐요.',
    contentsTitle: '이 아티클에서는',
    topics: [
      '가임기란?',
      '이 시기가 가장 중요한 이유',
      '가임기를 알아내는 방법',
      '핵심 정리',
    ],
    section1Body: '가임기는 주기 중 임신이 가능한 기간을 말해요. 약 6일 동안 이어지며, 배란 전 5일과 배란일 당일이 포함돼요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '주기는 모두 달라서 가임기가 매달 달력상 같은 날에 오지는 않아요.',
    section2Body1: '정자는 생식기 안에서 최대 5일까지 살 수 있어서 임신이 가능한 기간이 넓어져요. 반면 난자는 배출된 뒤 약 24시간 동안만 수정될 수 있어요.',
    section2Body2: '예를 들어 배란 3일 전의 성관계는 임신으로 이어질 수 있지만, 배란 다음 날의 성관계는 너무 늦은 경우가 많아요.',
    section3Intro: '여러 신호를 함께 살펴보면 이 시기를 더 정확하게 알아내는 데 도움이 돼요.',
    trackingSigns: [
      '주기 길이 기록하기',
      '자궁 경부 점액 관찰하기',
      '기초체온 재기',
      '배란 테스트(LH 검사) 사용하기',
    ],
    tip2Title: '알아 두면 좋아요',
    tip2Text: '주기, 점액, 체온 같은 여러 신호를 함께 보면 하나만 볼 때보다 가임기를 더 믿을 만하게 파악할 수 있어요.',
    shareMessage: '가임기: 어떻게 작동할까요 — AWA',
  },
  'pt-PT': {
    badge: 'JANELA FÉRTIL',
    title: 'A janela fértil:\ncomo funciona',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Porque é que os dias em torno da ovulação são os mais importantes para engravidar.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que é a janela fértil?',
      'Porque é que estes dias são os mais importantes',
      'Como identificar a sua janela fértil',
      'Pontos essenciais',
    ],
    section1Body: 'A janela fértil designa o período do ciclo durante o qual a gravidez é possível. Estende-se por cerca de 6 dias: os 5 dias que antecedem a ovulação, mais o próprio dia da ovulação.',
    tip1Title: 'Bom saber',
    tip1Text: 'Cada ciclo é diferente: a janela fértil não calha necessariamente no mesmo dia do calendário de um mês para o outro.',
    section2Body1: 'Os espermatozoides podem sobreviver até 5 dias no trato reprodutivo, o que alarga o período em que a conceção é possível. O óvulo, por sua vez, só pode ser fecundado durante cerca de 24 horas depois de ser libertado.',
    section2Body2: 'Por exemplo, uma relação sexual 3 dias antes da ovulação pode levar à conceção, enquanto uma relação no dia a seguir à ovulação chega muitas vezes tarde demais.',
    section3Intro: 'Vários sinais, observados em conjunto, ajudam a identificar melhor este período:',
    trackingSigns: [
      'Acompanhar a duração do seu ciclo',
      'Observar o seu muco cervical',
      'Medir a sua temperatura corporal basal',
      'Usar testes de ovulação (LH)',
    ],
    tip2Title: 'Bom saber',
    tip2Text: 'Combinar vários sinais (ciclo, muco, temperatura) dá uma imagem mais fiável da sua janela fértil do que qualquer sinal isolado.',
    shareMessage: 'A janela fértil: como funciona — AWA',
  },
  bn: {
    badge: 'উর্বর সময়',
    title: 'উর্বর সময়:\nএটি কীভাবে কাজ করে',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'গর্ভধারণের জন্য ডিম্বস্ফোটনের আশপাশের দিনগুলো কেন সবচেয়ে গুরুত্বপূর্ণ।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'উর্বর সময় কী?',
      'এই দিনগুলো কেন সবচেয়ে গুরুত্বপূর্ণ',
      'আপনার উর্বর সময় কীভাবে চিনবেন',
      'মূল কথা',
    ],
    section1Body: 'উর্বর সময় বলতে আপনার চক্রের সেই সময়কে বোঝায়, যখন গর্ভধারণ সম্ভব। এটি প্রায় 6 দিন স্থায়ী হয়: ডিম্বস্ফোটনের আগের 5 দিন এবং ডিম্বস্ফোটনের দিনটি।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'প্রতিটি চক্র আলাদা: উর্বর সময় এক মাস থেকে আরেক মাসে ক্যালেন্ডারের একই দিনে পড়বে, এমন নয়।',
    section2Body1: 'শুক্রাণু প্রজননতন্ত্রে সর্বোচ্চ 5 দিন পর্যন্ত বেঁচে থাকতে পারে, ফলে গর্ভধারণ সম্ভব এমন সময় আরও বিস্তৃত হয়। অন্যদিকে ডিম্বাণু নির্গত হওয়ার পর মাত্র প্রায় 24 ঘণ্টা নিষিক্ত হওয়ার উপযুক্ত থাকে।',
    section2Body2: 'উদাহরণস্বরূপ, ডিম্বস্ফোটনের 3 দিন আগে মিলন হলে গর্ভধারণ হতে পারে, কিন্তু ডিম্বস্ফোটনের পরদিন মিলন হলে প্রায়ই তা অনেক দেরি হয়ে যায়।',
    section3Intro: 'একসঙ্গে পর্যবেক্ষণ করা বেশ কয়েকটি লক্ষণ এই সময়টিকে আরও ভালোভাবে চিহ্নিত করতে সাহায্য করে:',
    trackingSigns: [
      'আপনার চক্রের দৈর্ঘ্য ট্র্যাক করা',
      'জরায়ুমুখের শ্লেষ্মা পর্যবেক্ষণ করা',
      'বেসাল শরীরের তাপমাত্রা মাপা',
      'ডিম্বস্ফোটন (এলএইচ) পরীক্ষা ব্যবহার করা',
    ],
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'একাধিক লক্ষণ (চক্র, শ্লেষ্মা, তাপমাত্রা) একসঙ্গে মিলিয়ে দেখলে যেকোনো একটি লক্ষণের চেয়ে আপনার উর্বর সময় সম্পর্কে অনেক নির্ভরযোগ্য ধারণা পাওয়া যায়।',
    shareMessage: 'উর্বর সময়: এটি কীভাবে কাজ করে — AWA',
  },
  da: {
    badge: 'FERTILT VINDUE',
    title: 'Det fertile vindue:\nhvordan det fungerer',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvorfor dagene omkring ægløsning betyder mest for at blive gravid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er det fertile vindue?',
      'Hvorfor disse dage betyder mest',
      'Sådan finder du dit fertile vindue',
      'Vigtige pointer',
    ],
    section1Body: 'Det fertile vindue er den periode i din cyklus, hvor graviditet er mulig. Det strækker sig over ca. 6 dage: de 5 dage inden ægløsning plus selve ægløsningsdagen.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Alle cyklusser er forskellige: det fertile vindue falder ikke nødvendigvis på den samme kalenderdag fra måned til måned.',
    section2Body1: 'Sæd kan overleve op til 5 dage i kønsorganerne, hvilket udvider den periode, hvor befrugtning er mulig. Ægget forbliver omvendt kun befrugtningsegnet i ca. 24 timer efter frigivelsen.',
    section2Body2: 'For eksempel kan samleje 3 dage før ægløsning føre til befrugtning, mens samleje dagen efter ægløsning ofte er for sent.',
    section3Intro: 'Flere tegn, observeret samlet, hjælper dig bedre med at fastslå dette vindue:',
    trackingSigns: [
      'Registrer din cyklus\' længde',
      'Observer dit livmoderhalssekret',
      'Mål din basaltemperatur',
      'Brug ægløsningstests (LH)',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'At kombinere flere tegn (cyklus, sekret, temperatur) giver et mere pålideligt billede af dit fertile vindue end ét enkelt tegn alene.',
    shareMessage: 'Det fertile vindue: hvordan det fungerer — AWA',
  },
  sv: {
    badge: 'FERTILT VINDUE',
    title: 'Det fertile vindue:\nhvordan det fungerer',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvorfor dagene omkring äglösning betyder mest for att blive gravid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar det fertile vindue?',
      'Hvorfor disse dagar betyder mest',
      'Sådan finder du ditt fertile vindue',
      'Vigtige pointer',
    ],
    section1Body: 'Det fertile vindue ar den periode i din cyklus, hvor graviditet ar mulig. Det sträkker sig over ca. 6 dage: de 5 dagar inden äglösning plus selve äglösningsdagen.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Alla cyklusser ar forskellige: det fertile vindue falder inte nödvendigvis på den samme kalenderdag fran måned till måned.',
    section2Body1: 'Säd kan overleve op till 5 dagar i könsorganerne, hvilket udvider den periode, hvor befrugtning ar mulig. Ägget forbliver omvendt kun befrugtningsegnet i ca. 24 timer efter frigivelsen.',
    section2Body2: 'For eksempel kan samleje 3 dagar för äglösning före till befrugtning, mens samleje dagen efter äglösning ofta ar for sent.',
    section3Intro: 'Flere tegn, observeret samlet, hjälper dig bedre med at fastslå dette vindue:',
    trackingSigns: [
      'Registrer din cyklus\' längde',
      'Observer ditt livmoderhalssekret',
      'Mål din basaltemperatur',
      'Brug äglösningstests (LH)',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'At kombinere flere tegn (cyklus, sekret, temperatur) giver et mere pålideligt billede av ditt fertile vindue end ét enkelt tegn alene.',
    shareMessage: 'Det fertile vindue: hvordan det fungerer — AWA',
  },
  nb: {
    badge: 'FRUKTBART VINDU',
    title: 'Det fruktbare vinduet:\nslik fungerer det',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvorfor dagene rundt eggløsningen er viktigst for å bli gravid.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er det fruktbare vinduet?',
      'Hvorfor disse dagene er viktigst',
      'Hvordan du finner ditt fruktbare vindu',
      'Det viktigste å huske',
    ],
    section1Body: 'Det fruktbare vinduet er perioden i syklusen din da graviditet er mulig. Det strekker seg over omtrent 6 dager: de 5 dagene før eggløsningen, pluss selve eggløsningsdagen.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Hver syklus er forskjellig: det fruktbare vinduet faller ikke nødvendigvis på samme dato fra en måned til den neste.',
    section2Body1: 'Sædceller kan overleve i opptil 5 dager i kjønnsorganene, noe som utvider perioden da unnfangelse er mulig. Egget derimot kan bare befruktes i omtrent 24 timer etter at det er frigitt.',
    section2Body2: 'For eksempel kan samleie 3 dager før eggløsningen føre til unnfangelse, mens samleie dagen etter eggløsningen ofte kommer for sent.',
    section3Intro: 'Flere tegn, observert sammen, hjelper deg å avgrense denne perioden bedre:',
    trackingSigns: [
      'Følge sykluslengden din',
      'Observere livmorhalsslimet ditt',
      'Måle basaltemperaturen din',
      'Bruke eggløsningstester (LH)',
    ],
    tip2Title: 'Godt å vite',
    tip2Text: 'Å kombinere flere tegn (syklus, slim, temperatur) gir et mer pålitelig bilde av det fruktbare vinduet ditt enn noe enkeltstående tegn.',
    shareMessage: 'Det fruktbare vinduet: slik fungerer det – AWA',
  },
  pl: {
    badge: 'OKNO PŁODNOŚCI',
    title: 'Okno płodności:\njak to działa',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Dlaczego dni wokół owulacji są najważniejsze dla poczęcia.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym jest okno płodności?',
      'Dlaczego te dni są najważniejsze',
      'Jak rozpoznać swoje okno płodności',
      'Najważniejsze wnioski',
    ],
    section1Body: 'Okno płodności to okres w cyklu, w którym ciąża jest możliwa. Obejmuje około 6 dni: 5 dni przed owulacją oraz sam dzień owulacji.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Każdy cykl jest inny: okno płodności nie musi przypadać na ten sam dzień kalendarzowy w kolejnych miesiącach.',
    section2Body1: 'Plemniki mogą przeżyć w drogach rodnych do 5 dni, co wydłuża okres, w którym możliwe jest poczęcie. Komórka jajowa natomiast pozostaje zdolna do zapłodnienia tylko przez około 24 godziny po uwolnieniu.',
    section2Body2: 'Na przykład współżycie na 3 dni przed owulacją może doprowadzić do poczęcia, a współżycie dzień po owulacji często jest już za późno.',
    section3Intro: 'Kilka objawów, obserwowanych razem, pomaga dokładniej wskazać ten okres:',
    trackingSigns: [
      'Śledzenie długości cyklu',
      'Obserwacja śluzu szyjkowego',
      'Pomiar podstawowej temperatury ciała',
      'Testy owulacyjne (LH)',
    ],
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Połączenie kilku objawów (cykl, śluz, temperatura) daje pewniejszy obraz okna płodności niż pojedynczy objaw.',
    shareMessage: 'Okno płodności: jak to działa — AWA',
  },
  uk: {
    badge: 'ФЕРТИЛЬНЕ ВІКНО',
    title: 'Фертильне вікно:\nяк воно працює',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Чому дні навколо овуляції найважливіші для зачаття.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке фертильне вікно?',
      'Чому ці дні найважливіші',
      'Як визначити своє фертильне вікно',
      'Головні висновки',
    ],
    section1Body: 'Фертильне вікно — це період циклу, коли вагітність можлива. Воно охоплює близько 6 днів: 5 днів до овуляції та сам день овуляції.',
    tip1Title: 'Варто знати',
    tip1Text: 'Кожен цикл різний: фертильне вікно не обов’язково припадає на той самий календарний день щомісяця.',
    section2Body1: 'Сперматозоїди можуть виживати в статевих шляхах до 5 днів, що розширює період, коли можливе зачаття. Яйцеклітина ж залишається здатною до запліднення лише близько 24 годин після виходу.',
    section2Body2: 'Наприклад, статевий акт за 3 дні до овуляції може призвести до зачаття, а статевий акт наступного дня після овуляції часто буває вже запізно.',
    section3Intro: 'Кілька ознак, що спостерігаються разом, допомагають точніше визначити цей період:',
    trackingSigns: [
      'Відстеження тривалості циклу',
      'Спостереження за цервікальним слизом',
      'Вимірювання базальної температури тіла',
      'Використання овуляційних (ЛГ) тестів',
    ],
    tip2Title: 'Варто знати',
    tip2Text: 'Поєднання кількох ознак (цикл, слиз, температура) дає надійнішу картину фертильного вікна, ніж будь-яка одна ознака.',
    shareMessage: 'Фертильне вікно: як воно працює — AWA',
  },
  cs: {
    badge: 'PLODNÉ OBDOBÍ',
    title: 'Plodné období:\njak funguje',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Proč jsou dny kolem ovulace pro početí nejdůležitější.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co je plodné období?',
      'Proč jsou tyto dny nejdůležitější',
      'Jak určit své plodné období',
      'Hlavní poznatky',
    ],
    section1Body: 'Plodné období označuje část vašeho cyklu, ve které je otěhotnění možné. Trvá asi 6 dní: 5 dní před ovulací plus den samotné ovulace.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Každý cyklus je jiný: plodné období nemusí z měsíce na měsíc připadat na stejný den v kalendáři.',
    section2Body1: 'Spermie mohou v pohlavním ústrojí přežít až 5 dní, což prodlužuje období, ve kterém je početí možné. Vajíčko naopak zůstává oplodnitelné jen asi 24 hodin po uvolnění.',
    section2Body2: 'Například pohlavní styk 3 dny před ovulací může vést k početí, zatímco styk den po ovulaci bývá často příliš pozdě.',
    section3Intro: 'Několik příznaků pozorovaných společně vám pomůže toto období lépe určit:',
    trackingSigns: [
      'Sledování délky cyklu',
      'Pozorování cervikálního hlenu',
      'Měření bazální tělesné teploty',
      'Používání ovulačních (LH) testů',
    ],
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Spojení několika příznaků (cyklus, hlen, teplota) poskytuje spolehlivější obraz o vašem plodném období než kterýkoli příznak sám o sobě.',
    shareMessage: 'Plodné období: jak funguje — AWA',
  },
  sk: {
    badge: 'PLODNÉ OKNO',
    title: 'Plodné okno:\nako funguje',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Prečo sú dni okolo ovulácie pre počatie najdôležitejšie.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo je plodné okno?',
      'Prečo sú tieto dni najdôležitejšie',
      'Ako určiť svoje plodné okno',
      'Hlavné body',
    ],
    section1Body: 'Plodné okno označuje obdobie vášho cyklu, počas ktorého je tehotenstvo možné. Trvá približne 6 dní: 5 dní pred ovuláciou a samotný deň ovulácie.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Každý cyklus je iný: plodné okno nemusí pripadnúť na ten istý deň v kalendári z mesiaca na mesiac.',
    section2Body1: 'Spermie môžu v rozmnožovacích cestách prežiť až 5 dní, čo rozširuje obdobie, v ktorom je počatie možné. Vajíčko zostáva schopné oplodnenia iba približne 24 hodín po uvoľnení.',
    section2Body2: 'Napríklad pohlavný styk 3 dni pred ovuláciou môže viesť k počatiu, zatiaľ čo styk v deň po ovulácii býva často neskoro.',
    section3Intro: 'Niekoľko znakov, sledovaných spoločne, vám pomáha presnejšie určiť toto obdobie:',
    trackingSigns: [
      'Sledovanie dĺžky cyklu',
      'Pozorovanie cervikálneho hlienu',
      'Meranie bazálnej telesnej teploty',
      'Používanie ovulačných (LH) testov',
    ],
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Kombinácia viacerých znakov (cyklus, hlien, teplota) poskytuje spoľahlivejší obraz o vašom plodnom okne než ktorýkoľvek znak sám.',
    shareMessage: 'Plodné okno: ako funguje — AWA',
  },
  hu: {
    badge: 'TERMÉKENY IDŐSZAK',
    title: 'A termékeny időszak:\nhogyan működik',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Miért a peteérés körüli napok a legfontosabbak a fogantatás szempontjából.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi a termékeny időszak?',
      'Miért a legfontosabbak ezek a napok',
      'Hogyan határozd meg a termékeny időszakodat',
      'Legfontosabb tudnivalók',
    ],
    section1Body: 'A termékeny időszak a ciklusod azon szakasza, amikor a terhesség lehetséges. Körülbelül 6 napig tart: a peteérés előtti 5 nap, plusz maga a peteérés napja.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Minden ciklus más: a termékeny időszak nem feltétlenül esik ugyanarra a naptári napra hónapról hónapra.',
    section2Body1: 'A spermiumok akár 5 napig is életben maradhatnak a női nemi szervekben, ami kiszélesíti azt az időszakot, amikor a fogantatás lehetséges. A petesejt viszont a kiszabadulása után csak körülbelül 24 óráig termékenyíthető.',
    section2Body2: 'Például a peteérés előtt 3 nappal történt nemi élet fogantatáshoz vezethet, míg a peteérést követő napon történt gyakran már későn jön.',
    section3Intro: 'Több, együtt megfigyelt jel segít pontosabban meghatározni ezt az időszakot:',
    trackingSigns: [
      'A ciklus hosszának követése',
      'A méhnyaknyálka megfigyelése',
      'Az alapvető testhőmérséklet mérése',
      'Peteérési (LH) tesztek használata',
    ],
    tip2Title: 'Érdemes tudni',
    tip2Text: 'Több jel (ciklus, nyálka, hőmérséklet) kombinálása megbízhatóbb képet ad a termékeny időszakodról, mint bármelyik jel önmagában.',
    shareMessage: 'A termékeny időszak: hogyan működik — AWA',
  },
  ro: {
    badge: 'FEREASTRA FERTILĂ',
    title: 'Fereastra fertilă:\ncum funcționează',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'De ce zilele din jurul ovulației contează cel mai mult pentru concepție.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce este fereastra fertilă?',
      'De ce contează cel mai mult aceste zile',
      'Cum îți identifici fereastra fertilă',
      'Ce să reții',
    ],
    section1Body: 'Fereastra fertilă desemnează perioada din ciclul tău în care o sarcină este posibilă. Se întinde pe aproximativ 6 zile: cele 5 zile dinaintea ovulației, plus ziua ovulației însăși.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Fiecare ciclu este diferit: fereastra fertilă nu cade neapărat în aceeași zi din calendar de la o lună la alta.',
    section2Body1: 'Spermatozoizii pot supraviețui până la 5 zile în tractul genital, ceea ce lărgește perioada în care concepția este posibilă. Ovulul, în schimb, rămâne fecundabil doar aproximativ 24 de ore după eliberare.',
    section2Body2: 'De exemplu, un raport intim care are loc cu 3 zile înainte de ovulație poate duce la concepție, în timp ce un raport din ziua de după ovulație vine adesea prea târziu.',
    section3Intro: 'Mai multe semne, observate împreună, te ajută să identifici mai bine această perioadă:',
    trackingSigns: [
      'Urmărirea duratei ciclului',
      'Observarea mucusului cervical',
      'Măsurarea temperaturii bazale',
      'Folosirea testelor de ovulație (LH)',
    ],
    tip2Title: 'Bine de știut',
    tip2Text: 'Combinarea mai multor semne (ciclu, mucus, temperatură) oferă o imagine mai fiabilă a ferestrei tale fertile decât oricare semn luat separat.',
    shareMessage: 'Fereastra fertilă: cum funcționează — AWA',
  },
  bg: {
    badge: 'ПЛОДОВИТ ПРОЗОРЕЦ',
    title: 'Плодовитият прозорец:\nкак работи',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Защо дните около овулацията са най-важни за зачеването.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво е плодовитият прозорец?',
      'Защо тези дни са най-важни',
      'Как да определиш плодовития си прозорец',
      'Какво да запомниш',
    ],
    section1Body: 'Плодовитият прозорец означава периода от цикъла ти, в който бременност е възможна. Той обхваща около 6 дни: 5-те дни преди овулацията плюс самия ден на овулацията.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Всеки цикъл е различен: плодовитият прозорец не пада непременно на един и същ календарен ден от месец на месец.',
    section2Body1: 'Сперматозоидите могат да оцелеят до 5 дни в половия тракт, което разширява периода, в който зачеването е възможно. Яйцеклетката, от своя страна, остава годна за оплождане само около 24 часа след освобождаването ѝ.',
    section2Body2: 'Например полов контакт, който се случва 3 дни преди овулацията, може да доведе до зачеване, докато контакт в деня след овулацията често идва твърде късно.',
    section3Intro: 'Няколко признака, наблюдавани заедно, ти помагат да определиш по-добре този период:',
    trackingSigns: [
      'Проследяване на продължителността на цикъла',
      'Наблюдение на цервикалната слуз',
      'Измерване на базалната температура',
      'Използване на тестове за овулация (LH)',
    ],
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Комбинирането на няколко признака (цикъл, слуз, температура) дава по-надеждна картина на плодовития ти прозорец от всеки отделен признак.',
    shareMessage: 'Плодовитият прозорец: как работи — AWA',
  },
  sr: {
    badge: 'ПЛОДНИ ПРОЗОР',
    title: 'Плодни прозор:\nкако функционише',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Зашто су дани око овулације најважнији за зачеће.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта је плодни прозор?',
      'Зашто су ови дани најважнији',
      'Како препознати свој плодни прозор',
      'Шта да запамтиш',
    ],
    section1Body: 'Плодни прозор означава период у твом циклусу током којег је трудноћа могућа. Траје око 6 дана: 5 дана пре овулације и сам дан овулације.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Сваки циклус је другачији: плодни прозор не пада нужно на исти календарски дан из месеца у месец.',
    section2Body1: 'Сперматозоиди могу преживети до 5 дана у репродуктивном тракту, што проширује период у којем је зачеће могуће. Јајна ћелија, са своје стране, остаје способна за оплођење само око 24 сата након ослобађања.',
    section2Body2: 'На пример, однос 3 дана пре овулације може довести до зачећа, док однос дан после овулације често долази прекасно.',
    section3Intro: 'Неколико знакова, посматраних заједно, помаже ти да прецизније одредиш овај период:',
    trackingSigns: [
      'Праћење трајања циклуса',
      'Посматрање цервикалне слузи',
      'Мерење базалне телесне температуре',
      'Коришћење тестова овулације (LH)',
    ],
    tip2Title: 'Добро је знати',
    tip2Text: 'Комбиновање неколико знакова (циклус, слуз, температура) даје поузданију слику твог плодног прозора него било који појединачан знак.',
    shareMessage: 'Плодни прозор: како функционише — AWA',
  },
  hr: {
    badge: 'PLODNI PROZOR',
    title: 'Plodni prozor:\nkako funkcionira',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašto su dani oko ovulacije najvažniji za začeće.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je plodni prozor?',
      'Zašto su ti dani najvažniji',
      'Kako prepoznati svoj plodni prozor',
      'Ključne poruke',
    ],
    section1Body: 'Plodni prozor označava razdoblje u tvom ciklusu u kojem je trudnoća moguća. Traje oko 6 dana: 5 dana prije ovulacije plus sam dan ovulacije.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Svaki je ciklus drugačiji: plodni prozor ne pada nužno na isti kalendarski dan iz mjeseca u mjesec.',
    section2Body1: 'Spermiji mogu preživjeti do 5 dana u reproduktivnom traktu, što proširuje razdoblje u kojem je začeće moguće. Jajna stanica, s druge strane, ostaje sposobna za oplodnju samo oko 24 sata nakon otpuštanja.',
    section2Body2: 'Na primjer, spolni odnos 3 dana prije ovulacije može dovesti do začeća, dok je spolni odnos dan nakon ovulacije često prekasno.',
    section3Intro: 'Nekoliko znakova, promatranih zajedno, pomaže ti preciznije odrediti ovo razdoblje:',
    trackingSigns: [
      'Praćenje duljine ciklusa',
      'Promatranje cervikalne sluzi',
      'Mjerenje bazalne temperature',
      'Korištenje testova ovulacije (LH)',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Kombinacija više znakova (ciklus, sluz, temperatura) daje pouzdaniju sliku plodnog prozora od bilo kojeg pojedinačnog znaka.',
    shareMessage: 'Plodni prozor: kako funkcionira — AWA',
  },
  bs: {
    badge: 'PLODNI PROZOR',
    title: 'Plodni prozor:\nkako funkcionira',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašta su dani oko ovulacije najvažniji za začeće.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je plodni prozor?',
      'Zašta su ti dani najvažniji',
      'Kako prepoznati svoj plodni prozor',
      'Ključne poruke',
    ],
    section1Body: 'Plodni prozor označava razdoblje u tvom ciklusu u kojem je trudnoća moguća. Traje oko 6 dana: 5 dana prije ovulacije plus sam dan ovulacije.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Svaki je ciklus drugačiji: plodni prozor ne pada nužno na isti kalendarski dan iz mjeseca u mjesec.',
    section2Body1: 'Spermiji mogu preživjeti do 5 dana u reproduktivnom traktu, što proširuje razdoblje u kojem je začeće moguće. Jajna stanica, s druge strane, ostaje sposobna za oplodnju samo oko 24 sata nakon otpuštanja.',
    section2Body2: 'Na primjer, spolni odnos 3 dana prije ovulacije može dovesti do začeća, dok je spolni odnos dan nakon ovulacije često prekasno.',
    section3Intro: 'Nekoliko znakova, promatranih zajedno, pomaže ti preciznije odrediti ovo razdoblje:',
    trackingSigns: [
      'Praćenje duljine ciklusa',
      'Promatranje cervikalne sluzi',
      'Mjerenje bazalne temperature',
      'Korištenje testova ovulacije (LH)',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Kombinacija više znakova (ciklus, sluz, temperatura) daje pouzdaniju sliku plodnog prozora od bilo kojeg pojedinačnog znaka.',
    shareMessage: 'Plodni prozor: kako funkcionira — AWA',
  },
  sl: {
    badge: 'PLODNO OBDOBJE',
    title: 'Plodno obdobje:\nkako deluje',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Zakaj so dnevi okoli ovulacije najpomembnejši za zanositev.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj je plodno obdobje?',
      'Zakaj so ti dnevi najpomembnejši',
      'Kako prepoznati svoje plodno obdobje',
      'Ključna sporočila',
    ],
    section1Body: 'Plodno obdobje pomeni obdobje v tvojem ciklu, v katerem je nosečnost mogoča. Traja približno 6 dni: 5 dni pred ovulacijo plus sam dan ovulacije.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Vsak cikel je drugačen: plodno obdobje ne pade nujno na isti koledarski dan iz meseca v mesec.',
    section2Body1: 'Spermiji lahko v reproduktivnem traktu preživijo do 5 dni, kar podaljša obdobje, v katerem je zanositev mogoča. Jajčna celica pa ostane sposobna oploditve le približno 24 ur po sprostitvi.',
    section2Body2: 'Na primer, spolni odnos 3 dni pred ovulacijo lahko privede do zanositve, spolni odnos dan po ovulaciji pa je pogosto prepozen.',
    section3Intro: 'Več znakov, opazovanih skupaj, ti pomaga natančneje določiti to obdobje:',
    trackingSigns: [
      'Spremljanje dolžine cikla',
      'Opazovanje materničnovratne sluzi',
      'Merjenje bazalne temperature',
      'Uporaba testov ovulacije (LH)',
    ],
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Kombinacija več znakov (cikel, sluz, temperatura) daje zanesljivejšo sliko plodnega obdobja kot katerikoli posamezen znak.',
    shareMessage: 'Plodno obdobje: kako deluje — AWA',
  },
  ne: {
    badge: 'उर्वर अवधि',
    title: 'उर्वर अवधि:\nयो कसरी काम गर्छ',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'गर्भधारणका लागि अण्डोत्सर्गको वरिपरिका दिनहरू किन सबैभन्दा महत्त्वपूर्ण हुन्छन्।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'उर्वर अवधि के हो?',
      'यी दिनहरू किन सबैभन्दा महत्त्वपूर्ण छन्',
      'आफ्नो उर्वर अवधि कसरी पहिचान गर्ने',
      'मुख्य कुराहरू',
    ],
    section1Body: 'उर्वर अवधि तपाईंको चक्रमा गर्भधारण सम्भव हुने अवधि हो। यो करिब 6 दिन फैलिन्छ: अण्डोत्सर्गअघिका 5 दिन, र अण्डोत्सर्गको दिन आफैँ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'हरेक चक्र फरक हुन्छ: उर्वर अवधि एक महिनादेखि अर्को महिनामा पात्रोको उही दिनमा नै पर्छ भन्ने छैन।',
    section2Body1: 'शुक्रकीट प्रजनन मार्गमा 5 दिनसम्म बाँच्न सक्छ, जसले गर्भधारण सम्भव हुने अवधि फराकिलो बनाउँछ। अण्डा भने निस्केपछि करिब 24 घण्टा मात्र निषेचनयोग्य रहन्छ।',
    section2Body2: 'उदाहरणका लागि, अण्डोत्सर्गभन्दा 3 दिनअघि भएको सम्भोगले गर्भधारण गराउन सक्छ, जबकि अण्डोत्सर्गको अर्को दिनको सम्भोग प्रायः धेरै ढिलो हुन्छ।',
    section3Intro: 'सँगै अवलोकन गरिएका धेरै संकेतहरूले यो अवधि राम्ररी पहिचान गर्न मद्दत गर्छन्:',
    trackingSigns: [
      'आफ्नो चक्रको अवधि अनुगमन गर्ने',
      'आफ्नो गर्भाशयको मुखको तरल पदार्थ अवलोकन गर्ने',
      'आफ्नो आधारभूत शारीरिक तापक्रम नाप्ने',
      'अण्डोत्सर्ग (LH) परीक्षण प्रयोग गर्ने',
    ],
    tip2Title: 'जान्न लायक',
    tip2Text: 'धेरै संकेतहरू (चक्र, तरल पदार्थ, तापक्रम) जोड्दा कुनै एक संकेतले मात्र दिने भन्दा तपाईंको उर्वर अवधिको बढी भरपर्दो चित्र पाइन्छ।',
    shareMessage: 'उर्वर अवधि: यो कसरी काम गर्छ — AWA',
  },
  si: {
    badge: 'සාරවත් කාලය',
    title: 'සාරවත් කාලය:\nඑය ක්‍රියා කරන ආකාරය',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ගැබ්ගැනීමට ඩිම්බ මෝචනය වටා දින වඩාත්ම වැදගත් වන්නේ ඇයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'සාරවත් කාලය යනු කුමක්ද?',
      'මෙම දින වඩාත්ම වැදගත් වන්නේ ඇයි',
      'ඔබේ සාරවත් කාලය හඳුනාගන්නේ කෙසේද',
      'ප්‍රධාන කරුණු',
    ],
    section1Body: 'සාරවත් කාලය යනු ඔබේ චක්‍රයේ ගැබ්ගැනීම කළ හැකි කාලයයි. එය දින 6ක් පමණ පැතිරේ: ඩිම්බ මෝචනයට පෙර දින 5ක් සහ ඩිම්බ මෝචන දිනයම.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'සෑම චක්‍රයක්ම වෙනස්: සාරවත් කාලය මාසයෙන් මාසයට එකම දින දර්ශන දිනයට නොවැටිය හැක.',
    section2Body1: 'ශුක්‍රාණුවලට ප්‍රජනන පත්ලේ දින 5ක් දක්වා ජීවත් විය හැකි අතර, එය ගර්භ ගැනීම කළ හැකි කාලය පුළුල් කරයි. ඩිම්බය, මේ අතර, එය නිකුත් වූ පසු පැය 24ක් පමණක් සංසේචනය කළ හැකිව පවතී.',
    section2Body2: 'උදාහරණයක් ලෙස, ඩිම්බ මෝචනයට දින 3කට පෙර සිදුවන සංසර්ගය ගර්භ ගැනීමට හේතු විය හැකි අතර, ඩිම්බ මෝචනයෙන් පසු දිනයේ සංසර්ගය බොහෝ විට ප්‍රමාද වැඩියි.',
    section3Intro: 'එකට නිරීක්ෂණය කරන සලකුණු කිහිපයක්, මෙම කාලය වඩා හොඳින් හඳුනාගැනීමට උපකාරී වේ:',
    trackingSigns: [
      'ඔබේ චක්‍රයේ දිග නිරීක්ෂණය කිරීම',
      'ඔබේ ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල නිරීක්ෂණය කිරීම',
      'ඔබේ මූලික ශරීර උෂ්ණත්වය මැනීම',
      'ඩිම්බ මෝචන (LH) පරීක්ෂණ භාවිතා කිරීම',
    ],
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'සලකුණු කිහිපයක් (චක්‍රය, ශ්ලේෂ්මල, උෂ්ණත්වය) ඒකාබද්ධ කිරීම, තනි සලකුණක් පමණක් භාවිතා කිරීමට වඩා ඔබේ සාරවත් කාලයේ වඩාත් විශ්වාසදායක චිත්‍රයක් ලබා දෙයි.',
    shareMessage: 'සාරවත් කාලය: එය ක්‍රියා කරන ආකාරය — AWA',
  },
  th: {
    badge: 'ช่วงเจริญพันธุ์',
    title: 'ช่วงเจริญพันธุ์:\nทำงานอย่างไร',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ทำไมวันที่อยู่รอบการตกไข่จึงสำคัญที่สุดต่อการมีบุตร',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ช่วงเจริญพันธุ์คืออะไร?',
      'ทำไมวันเหล่านี้จึงสำคัญที่สุด',
      'วิธีระบุช่วงเจริญพันธุ์ของคุณ',
      'ประเด็นสำคัญ',
    ],
    section1Body: 'ช่วงเจริญพันธุ์หมายถึงช่วงในรอบเดือนที่สามารถตั้งครรภ์ได้ ครอบคลุมประมาณ 6 วัน: 5 วันก่อนการตกไข่ รวมกับวันตกไข่เอง',
    tip1Title: 'ควรรู้',
    tip1Text: 'รอบเดือนแต่ละรอบไม่เหมือนกัน: ช่วงเจริญพันธุ์ไม่จำเป็นต้องตรงกับวันเดิมในปฏิทินจากเดือนหนึ่งไปอีกเดือนหนึ่ง',
    section2Body1: 'อสุจิมีชีวิตอยู่ได้นานถึง 5 วันในระบบสืบพันธุ์ ซึ่งขยายช่วงเวลาที่การปฏิสนธิเป็นไปได้ ส่วนไข่ยังปฏิสนธิได้เพียงประมาณ 24 ชั่วโมงหลังถูกปล่อยออกมา',
    section2Body2: 'ตัวอย่างเช่น การมีเพศสัมพันธ์ก่อนการตกไข่ 3 วันอาจนำไปสู่การปฏิสนธิ ขณะที่การมีเพศสัมพันธ์ในวันหลังการตกไข่มักสายเกินไป',
    section3Intro: 'สัญญาณหลายอย่างที่สังเกตร่วมกันช่วยให้คุณระบุช่วงเวลานี้ได้แม่นยำขึ้น:',
    trackingSigns: [
      'ติดตามความยาวรอบเดือนของคุณ',
      'สังเกตเมือกปากมดลูกของคุณ',
      'วัดอุณหภูมิร่างกายขณะพักของคุณ',
      'ใช้การตรวจการตกไข่ (LH)',
    ],
    tip2Title: 'ควรรู้',
    tip2Text: 'การรวมสัญญาณหลายอย่าง (รอบเดือน เมือก อุณหภูมิ) ให้ภาพช่วงเจริญพันธุ์ที่เชื่อถือได้มากกว่าสัญญาณใดสัญญาณหนึ่งเพียงอย่างเดียว',
    shareMessage: 'ช่วงเจริญพันธุ์: ทำงานอย่างไร — AWA',
  },
  vi: {
    badge: 'GIAI ĐOẠN DỄ THỤ THAI',
    title: 'Giai đoạn dễ thụ thai:\nhoạt động như thế nào',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Tại sao những ngày quanh thời điểm rụng trứng lại quan trọng nhất để thụ thai.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Giai đoạn dễ thụ thai là gì?',
      'Tại sao những ngày này quan trọng nhất',
      'Cách xác định giai đoạn dễ thụ thai của bạn',
      'Những điểm chính cần nhớ',
    ],
    section1Body: 'Giai đoạn dễ thụ thai là khoảng thời gian trong chu kỳ của bạn mà việc mang thai có thể xảy ra. Nó kéo dài khoảng 6 ngày: 5 ngày trước khi rụng trứng, cộng với chính ngày rụng trứng.',
    tip1Title: 'Nên biết',
    tip1Text: 'Mỗi chu kỳ đều khác nhau: giai đoạn dễ thụ thai không nhất thiết rơi vào cùng một ngày dương lịch từ tháng này sang tháng khác.',
    section2Body1: 'Tinh trùng có thể sống tới 5 ngày trong đường sinh sản, điều này làm kéo dài khoảng thời gian có thể thụ thai. Trong khi đó, trứng chỉ có thể thụ tinh trong khoảng 24 giờ sau khi được phóng thích.',
    section2Body2: 'Ví dụ, quan hệ tình dục xảy ra 3 ngày trước khi rụng trứng có thể dẫn đến thụ thai, trong khi quan hệ vào ngày sau khi rụng trứng thường đã quá muộn.',
    section3Intro: 'Nhiều dấu hiệu, khi quan sát cùng nhau, giúp bạn xác định chính xác hơn giai đoạn này:',
    trackingSigns: [
      'Theo dõi độ dài chu kỳ của bạn',
      'Quan sát dịch nhầy cổ tử cung',
      'Đo thân nhiệt cơ bản',
      'Dùng que thử rụng trứng (LH)',
    ],
    tip2Title: 'Nên biết',
    tip2Text: 'Kết hợp nhiều dấu hiệu (chu kỳ, dịch nhầy, nhiệt độ) cho bức tranh đáng tin cậy hơn về giai đoạn dễ thụ thai so với chỉ một dấu hiệu đơn lẻ.',
    shareMessage: 'Giai đoạn dễ thụ thai: hoạt động như thế nào — AWA',
  },
  uz: {
    badge: 'UNUMDORLIK DAVRI',
    title: 'Unumdorlik davri:\nqanday ishlaydi',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Nima uchun ovulyatsiya atrofidagi kunlar homilador boʻlish uchun eng muhim.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Unumdorlik davri nima?',
      'Nima uchun bu kunlar eng muhim',
      'Unumdorlik davrini qanday aniqlash mumkin',
      'Asosiy xulosalar',
    ],
    section1Body: 'Unumdorlik davri — siklingizda homiladorlik mumkin boʻlgan davr. U taxminan 6 kunni qamrab oladi: ovulyatsiyadan oldingi 5 kun va ovulyatsiya kunining oʻzi.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Har bir sikl boshqacha: unumdorlik davri oydan oyga taqvimdagi bir xil kunga toʻgʻri kelavermaydi.',
    section2Body1: 'Spermatozoidlar jinsiy yoʻllarda 5 kungacha yashashi mumkin, bu esa homilador boʻlish mumkin boʻlgan davrni kengaytiradi. Tuxum hujayra esa chiqqanidan keyin atigi taxminan 24 soat urugʻlanish qobiliyatini saqlaydi.',
    section2Body2: 'Masalan, ovulyatsiyadan 3 kun oldingi jinsiy aloqa homiladorlikka olib kelishi mumkin, ovulyatsiyadan keyingi kundagi aloqa esa koʻpincha juda kech boʻladi.',
    section3Intro: 'Birgalikda kuzatilgan bir nechta belgi bu davrni aniqroq belgilashga yordam beradi:',
    trackingSigns: [
      'Sikl uzunligini kuzatish',
      'Bachadon boʻyni shilligini kuzatish',
      'Bazal tana haroratini oʻlchash',
      'Ovulyatsiya (LH) testlaridan foydalanish',
    ],
    tip2Title: 'Bilish foydali',
    tip2Text: 'Bir nechta belgini (sikl, shilliq, harorat) birlashtirish unumdorlik davringiz haqida har qanday yakka belgidan koʻra ishonchliroq tasavvur beradi.',
    shareMessage: 'Unumdorlik davri: qanday ishlaydi — AWA',
  },
  az: {
    badge: 'MÜNBİT DÖVR',
    title: 'Münbit dövr:\no necə işləyir',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Ovulyasiya ətrafındakı günlər hamilə qalmaq üçün nə üçün ən vacibdir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Münbit dövr nədir?',
      'Bu günlər nə üçün ən vacibdir',
      'Münbit dövrünüzü necə müəyyən etmək olar',
      'Əsas nəticələr',
    ],
    section1Body: 'Münbit dövr dövrünüzün hamiləliyin mümkün olduğu hissəsinə deyilir. O, təxminən 6 günü əhatə edir: ovulyasiyadan əvvəlki 5 gün və ovulyasiya günü.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Hər dövr fərqlidir: münbit dövr bir aydan digərinə eyni təqvim gününə düşməyə bilər.',
    section2Body1: 'Spermatozoidlər reproduktiv traktda 5 günə qədər yaşaya bilər, bu da mayalanmanın mümkün olduğu dövrü genişləndirir. Yumurtahüceyrə isə ayrıldıqdan sonra yalnız təxminən 24 saat mayalana bilir.',
    section2Body2: 'Məsələn, ovulyasiyadan 3 gün əvvəl baş verən cinsi əlaqə mayalanmaya gətirib çıxara bilər, ovulyasiyadan bir gün sonrakı əlaqə isə çox vaxt gec olur.',
    section3Intro: 'Birlikdə müşahidə olunan bir neçə əlamət bu dövrü daha dəqiq müəyyən etməyə kömək edir:',
    trackingSigns: [
      'Dövrün uzunluğunu izləmək',
      'Uşaqlıq boynu mukusunu müşahidə etmək',
      'Bazal bədən temperaturunu ölçmək',
      'Ovulyasiya (LH) testlərindən istifadə etmək',
    ],
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Bir neçə əlaməti (dövr, mukus, temperatur) birləşdirmək münbit dövrünüz haqqında hər hansı tək əlamətdən daha etibarlı təsəvvür verir.',
    shareMessage: 'Münbit dövr: o necə işləyir — AWA',
  },
  ka: {
    badge: 'ფერტილური ფანჯარა',
    title: 'ფერტილური ფანჯარა:\nროგორ მუშაობს',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'რატომ არის ოვულაციის გარშემო დღეები ყველაზე მნიშვნელოვანი ჩასახვისთვის.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის ფერტილური ფანჯარა?',
      'რატომ არის ეს დღეები ყველაზე მნიშვნელოვანი',
      'როგორ დავადგინოთ თქვენი ფერტილური ფანჯარა',
      'მთავარი დასკვნები',
    ],
    section1Body: 'ფერტილური ფანჯარა თქვენი ციკლის პერიოდია, როდესაც ორსულობა შესაძლებელია. ის დაახლოებით 6 დღეს მოიცავს: ოვულაციამდე 5 დღეს, პლუს თავად ოვულაციის დღეს.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ყოველი ციკლი განსხვავებულია: ფერტილური ფანჯარა აუცილებლად არ ემთხვევა კალენდრის იმავე დღეს თვიდან თვემდე.',
    section2Body1: 'სპერმატოზოიდებს შეუძლიათ გენიტალურ ტრაქტში 5 დღემდე გადარჩენა, რაც ჩასახვის შესაძლებლობის პერიოდს აფართოებს. კვერცხუჯრედი კი განაყოფიერებადი მხოლოდ გამოთავისუფლებიდან დაახლოებით 24 საათის განმავლობაში რჩება.',
    section2Body2: 'მაგალითად, ოვულაციამდე 3 დღით ადრე მომხდარ სქესობრივ კავშირს შეიძლება ჩასახვა მოჰყვეს, ოვულაციის მეორე დღეს მომხდარი კი ხშირად უკვე გვიანია.',
    section3Intro: 'რამდენიმე ნიშანი, ერთად დაკვირვებული, ამ პერიოდის უფრო ზუსტად დადგენაში გეხმარებათ:',
    trackingSigns: [
      'თქვენი ციკლის ხანგრძლივობის კონტროლი',
      'საშვილოსნოს ყელის ლორწოზე დაკვირვება',
      'თქვენი ბაზალური ტემპერატურის გაზომვა',
      'ოვულაციის (LH) ტესტების გამოყენება',
    ],
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'რამდენიმე ნიშნის (ციკლი, ლორწო, ტემპერატურა) შერწყმა თქვენი ფერტილური ფანჯრის უფრო სანდო სურათს გვაძლევს, ვიდრე ნებისმიერი ცალკე ნიშანი.',
    shareMessage: 'ფერტილური ფანჯარა: როგორ მუშაობს — AWA',
  },
  hy: {
    badge: 'ՊՏՂԱԲԵՐ ՊԱՏՈՒՀԱՆ',
    title: 'Պտղաբեր պատուհանը.\nինչպես է այն աշխատում',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչու են ձվազատման շուրջ օրերն ամենակարևորը հղիանալու համար:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է պտղաբեր պատուհանը:',
      'Ինչու են այս օրերն ամենակարևորը',
      'Ինչպես որոշել ձեր պտղաբեր պատուհանը',
      'Հիմնական եզրակացություններ',
    ],
    section1Body: 'Պտղաբեր պատուհանը ձեր ցիկլի այն ժամանակահատվածն է, երբ հղիությունը հնարավոր է: Այն ընդգրկում է մոտ 6 օր. ձվազատումից առաջ 5 օրը, գումարած հենց ձվազատման օրը:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Յուրաքանչյուր ցիկլ տարբեր է. պտղաբեր պատուհանը պարտադիր չէ, որ ընկնի օրացույցի նույն օրը մի ամսից մյուսը:',
    section2Body1: 'Սպերմատոզոիդները կարող են գոյատևել մինչև 5 օր վերարտադրողական ուղիներում, ինչը լայնացնում է այն ժամանակահատվածը, երբ հղիացումը հնարավոր է: Իսկ ձվաբջիջը մնում է բեղմնավորելի միայն մոտ 24 ժամ՝ ազատվելուց հետո:',
    section2Body2: 'Օրինակ՝ ձվազատումից 3 օր առաջ տեղի ունեցած սեռական հարաբերությունը կարող է հանգեցնել հղիացման, մինչդեռ ձվազատումից հաջորդ օրը տեղի ունեցածը հաճախ արդեն ուշ է:',
    section3Intro: 'Մի քանի նշաններ, դիտարկված միասին, օգնում են ավելի ճշգրիտ որոշել այս ժամանակահատվածը.',
    trackingSigns: [
      'Ձեր ցիկլի տևողության հետևում',
      'Արգանդի վզիկի լորձի դիտարկում',
      'Բազալ ջերմաստիճանի չափում',
      'Ձվազատման (LH) թեստերի օգտագործում',
    ],
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Մի քանի նշանների համադրումը (ցիկլ, լորձ, ջերմաստիճան) տալիս է ձեր պտղաբեր պատուհանի ավելի հուսալի պատկեր, քան որևէ մեկ նշանը առանձին:',
    shareMessage: 'Պտղաբեր պատուհանը. ինչպես է այն աշխատում — AWA',
  },
  tg: {
    badge: 'РАВЗАНАИ ҲОСИЛХЕЗӢ',
    title: 'Равзанаи ҳосилхезӣ:\nчӣ тавр кор мекунад',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Чаро рӯзҳои атрофи овуляция барои ҳомиладор шудан муҳимтаранд.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Равзанаи ҳосилхезӣ чист?',
      'Чаро ин рӯзҳо муҳимтаранд',
      'Чӣ тавр равзанаи ҳосилхезии худро муайян кардан',
      'Хулосаҳои асосӣ',
    ],
    section1Body: 'Равзанаи ҳосилхезӣ марҳилаест аз давраи шумо, ки дар он ҳомиладорӣ имконпазир аст. Он тақрибан 6 рӯзро фаро мегирад: 5 рӯзи пеш аз овуляция ва худи рӯзи овуляция.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Ҳар давра гуногун аст: равзанаи ҳосилхезӣ ҳатман аз як моҳ то моҳи дигар ба як рӯзи тақвимӣ рост намеояд.',
    section2Body1: 'Сперматозоидҳо метавонанд то 5 рӯз дар роҳҳои таносулӣ зинда бимонанд, ки давраи имконпазирии ҳомиладоршавиро васеъ мекунад. Тухмсел бошад, тақрибан 24 соат пас аз озод шудан бордоршаванда мемонад.',
    section2Body2: 'Масалан, наздикие, ки 3 рӯз пеш аз овуляция рух медиҳад, метавонад ба ҳомиладорӣ оварда расонад, дар ҳоле ки наздикии рӯзи баъд аз овуляция аксар вақт хеле дер аст.',
    section3Intro: 'Якчанд нишона, ки якҷоя мушоҳида мешаванд, ба шумо кумак мекунанд ин давраро дақиқтар муайян кунед:',
    trackingSigns: [
      'Пайгирии дарозии давра',
      'Мушоҳидаи шилимшиқи гардани бачадон',
      'Андозагирии ҳарорати базалии бадан',
      'Истифодаи санҷишҳои овуляция (LH)',
    ],
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Якҷоя кардани якчанд нишона (давра, шилимшиқ, ҳарорат) тасвири боътимодтари равзанаи ҳосилхезии шуморо аз ҳар нишонаи танҳо медиҳад.',
    shareMessage: 'Равзанаи ҳосилхезӣ: чӣ тавр кор мекунад — AWA',
  },
  ky: {
    badge: 'БОЙГО БҮТҮҮ ТЕРЕЗЕСИ',
    title: 'Бойго бүтүү терезеси:\nкантип иштейт',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Овуляциянын тегерегиндеги күндөр боюна бүтүү үчүн эмне үчүн эң маанилүү.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Бойго бүтүү терезеси деген эмне?',
      'Бул күндөр эмне үчүн эң маанилүү',
      'Бойго бүтүү терезеңизди кантип аныктоо керек',
      'Негизги жыйынтыктар',
    ],
    section1Body: 'Бойго бүтүү терезеси — циклиңиздеги курсактуулук мүмкүн болгон мезгил. Ал болжол менен 6 күнгө созулат: овуляциядан мурунку 5 күн жана овуляциянын өзү болгон күн.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Ар бир цикл ар башка: бойго бүтүү терезеси айдан айга календарда бир эле күнгө туш келе бербейт.',
    section2Body1: 'Сперма көбөйүү жолдорунда 5 күнгө чейин жашай алат, бул боюна бүтүү мүмкүн болгон мезгилди кеңейтет. Жумурткалуу клетка болсо чыккандан кийин болжол менен 24 саат гана уруктанууга жарамдуу бойдон калат.',
    section2Body2: 'Мисалы, овуляциядан 3 күн мурун болгон жыныстык катнаш боюна бүтүүгө алып келиши мүмкүн, ал эми овуляциядан кийинки күнү болгон катнаш көбүнчө өтө кеч болот.',
    section3Intro: 'Бир нече белги чогуу байкалганда бул мезгилди так аныктоого жардам берет:',
    trackingSigns: [
      'Цикл узактыгын көзөмөлдөө',
      'Жатын моюнчасынын былжырын байкоо',
      'Базалдык дене температурасын өлчөө',
      'Овуляция (ЛГ) тесттерин колдонуу',
    ],
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Бир нече белгини (цикл, былжыр, температура) айкалыштыруу бойго бүтүү терезеңиздин жалгыз белгиден көрө ишенимдүүрөөк сүрөтүн берет.',
    shareMessage: 'Бойго бүтүү терезеси: кантип иштейт — AWA',
  },
  tk: {
    badge: 'GÖWRELI BOLMAGA ÝETERLIK DÖWÜR',
    title: 'Göwreli bolmaga ýeterlik döwür:\nol nähili işleýär',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Ovulýasiýa töwereginiň günleriniň göwreli bolmak üçin näme üçin iň möhümdigi.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Göwreli bolmaga ýeterlik döwür näme?',
      'Bu günler näme üçin iň möhüm?',
      'Göwreli bolmaga ýeterlik döwrüňizi nähili kesgitlemeli',
      'Esasy netijeler',
    ],
    section1Body: 'Göwreli bolmaga ýeterlik döwür sikliňizde göwrelilik mümkin bolan döwri aňladýar. Ol takmynan 6 gün dowam edýär: ovulýasiýadan öňki 5 gün we ovulýasiýanyň özüniň güni.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Her sikl dürli: göwreli bolmaga ýeterlik döwür aýdan aýa şol bir senenama gününe düşmeýär.',
    section2Body1: 'Sperma köpelýiş ýollarynda 5 güne çenli ýaşap biler, bu bolsa göwreli bolmagyň mümkin döwrüni giňeldýär. Ýumurtga öz gezeginde çykandan soň diňe takmynan 24 sagat tohumlanyp bilner.',
    section2Body2: 'Meselem, ovulýasiýadan 3 gün öň bolan jynsy gatnaşyk göwrelilige eltip biler, ovulýasiýadan bir gün soňky gatnaşyk bolsa köplenç gijä galýar.',
    section3Intro: 'Bilelikde synlanylan birnäçe alamat bu döwri has takyk kesgitlemäge kömek edýär:',
    trackingSigns: [
      'Sikliň uzynlygyny yzarlamak',
      'Ýatgy boýnunyň ýaňsyny synlamak',
      'Bazal beden temperaturasyny ölçemek',
      'Ovulýasiýa (LH) synaglaryny ulanmak',
    ],
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Birnäçe alamaty (sikl, ýaňs, temperatura) utgaşdyrmak göwreli bolmaga ýeterlik döwrüňiziň islendik ýeke alamatdan has ygtybarly suratyny berýär.',
    shareMessage: 'Göwreli bolmaga ýeterlik döwür: ol nähili işleýär — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FertilityWindowArticleScreen({
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
          <Image source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

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

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

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

          <AwaText variant="bodyMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

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

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section1Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section2Body1}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section2Body2}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section3Intro}
          </AwaText>

          <View style={styles.daily}>
            {TRACKING_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.trackingSigns[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip2Text}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
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
  daily: {marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },
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
