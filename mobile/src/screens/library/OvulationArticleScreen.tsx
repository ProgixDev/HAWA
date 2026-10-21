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

const ID = 'ovulation-comprendre-ovulation';

const HERO = require('../../assets/images/library/spm-stress.png');

const ART = {
  mucus: require('../../assets/images/library/flow-texture-mucus.png'),
};

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('Ovulation', {
  fr: {
    badge: 'OVULATION',
    title: 'Comprendre\nl’ovulation',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Le moment clé de ton cycle, et comment le repérer.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que l’ovulation ?',
      'Les signes qui peuvent l’accompagner',
      'Repérer son propre rythme',
      'À retenir',
    ],
    body1:
      'L’ovulation correspond à la libération d’un ovule par l’un des ovaires. Elle survient généralement environ 14 jours avant les règles suivantes, quelle que soit la durée totale du cycle.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'C’est la date des prochaines règles qui varie d’une femme à l’autre, bien plus que le délai entre l’ovulation et leur arrivée.',
    body2:
      'Certains signes physiques peuvent accompagner l’approche de l’ovulation, à des degrés variables selon les femmes.',
    visualTitle: 'Une glaire plus fluide',
    visualText:
      'À l’approche de l’ovulation, la glaire cervicale devient plus claire, filante et élastique.',
    otherSigns: [
      'Une légère douleur d’un côté du bas-ventre (« mittelschmerz »)',
      'Une sensibilité des seins',
      'Une légère hausse de la température basale après l’ovulation',
      'Un regain d’énergie chez certaines femmes',
    ],
    body3:
      'Observer ces signes sur plusieurs cycles aide à mieux connaître ton propre rythme, qui peut différer des moyennes générales.',
    alertTitle: 'À noter',
    alertText:
      'Un cycle sans ovulation peut arriver occasionnellement, sans que cela soit systématiquement préoccupant. En cas d’absence prolongée de règles ou de doute, un avis médical est recommandé.',
    tip2Title: 'Bon à savoir',
    tip2Text:
      'Aucun signe isolé n’est parfaitement fiable à lui seul : les combiner donne une meilleure idée de ton moment le plus fertile.',
    shareMessage: 'Comprendre l’ovulation — AWA',
  },
  en: {
    badge: 'OVULATION',
    title: 'Understanding\novulation',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The key moment of your cycle, and how to recognize it.',
    contentsTitle: 'In this article',
    topics: [
      'What is ovulation?',
      'The signs that may come with it',
      'Recognizing your own rhythm',
      'Key takeaways',
    ],
    body1:
      'Ovulation is the release of an egg by one of the ovaries. It usually occurs about 14 days before your next period, regardless of your cycle’s total length.',
    tip1Title: 'Good to know',
    tip1Text:
      'It’s the date of your next period that varies from woman to woman, much more than the time between ovulation and its arrival.',
    body2:
      'Certain physical signs may accompany the approach of ovulation, to varying degrees depending on the woman.',
    visualTitle: 'More fluid cervical mucus',
    visualText:
      'As ovulation approaches, cervical mucus becomes clearer, stretchier, and more elastic.',
    otherSigns: [
      'Mild pain on one side of the lower abdomen ("mittelschmerz")',
      'Breast tenderness',
      'A slight rise in basal body temperature after ovulation',
      'A boost of energy in some women',
    ],
    body3:
      'Observing these signs over several cycles helps you get to know your own rhythm, which can differ from general averages.',
    alertTitle: 'Please note',
    alertText:
      'A cycle without ovulation can occasionally happen, without this necessarily being a cause for concern. If your period is absent for a long time or you’re unsure, medical advice is recommended.',
    tip2Title: 'Good to know',
    tip2Text:
      'No single sign is perfectly reliable on its own: combining them gives a better idea of your most fertile time.',
    shareMessage: 'Understanding ovulation — AWA',
  },
  es: {
    badge: 'OVULACIÓN',
    title: 'Comprender\nla ovulación',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'El momento clave de tu ciclo, y cómo detectarlo.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es la ovulación?',
      'Las señales que pueden acompañarla',
      'Identificar tu propio ritmo',
      'Para recordar',
    ],
    body1:
      'La ovulación corresponde a la liberación de un óvulo por uno de los ovarios. Suele ocurrir unos 14 días antes de la siguiente regla, sea cual sea la duración total del ciclo.',
    tip1Title: 'Dato útil',
    tip1Text:
      'Es la fecha de la siguiente regla la que varía de una mujer a otra, mucho más que el tiempo entre la ovulación y su llegada.',
    body2:
      'Algunas señales físicas pueden acompañar la proximidad de la ovulación, en grados variables según cada mujer.',
    visualTitle: 'Un moco más fluido',
    visualText:
      'Cerca de la ovulación, el moco cervical se vuelve más claro, filante y elástico.',
    otherSigns: [
      'Un ligero dolor en un lado del bajo vientre («mittelschmerz»)',
      'Sensibilidad en los senos',
      'Una ligera subida de la temperatura basal después de la ovulación',
      'Un aumento de energía en algunas mujeres',
    ],
    body3:
      'Observar estas señales durante varios ciclos ayuda a conocer mejor tu propio ritmo, que puede diferir de los promedios generales.',
    alertTitle: 'A tener en cuenta',
    alertText:
      'Un ciclo sin ovulación puede ocurrir ocasionalmente, sin que eso sea sistemáticamente preocupante. Si la regla falta durante mucho tiempo o tienes dudas, se recomienda una opinión médica.',
    tip2Title: 'Dato útil',
    tip2Text:
      'Ninguna señal aislada es perfectamente fiable por sí sola: combinarlas da una mejor idea de tu momento más fértil.',
    shareMessage: 'Comprender la ovulación — AWA',
  },
  it: {
    badge: 'OVULAZIONE',
    title: 'Capire\nl’ovulazione',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Il momento chiave del tuo ciclo e come riconoscerlo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è l’ovulazione?',
      'I segni che possono accompagnarla',
      'Riconoscere il tuo ritmo',
      'Punti chiave',
    ],
    body1: 'L’ovulazione è il rilascio di un ovulo da parte di una delle ovaie. Di solito avviene circa 14 giorni prima del tuo prossimo periodo mestruale, indipendentemente dalla durata totale del tuo ciclo.',
    tip1Title: 'Da sapere',
    tip1Text: 'È la data del prossimo periodo mestruale a variare da donna a donna, molto più del tempo che passa tra l’ovulazione e il suo arrivo.',
    body2: 'Alcuni segni fisici possono accompagnare l’avvicinarsi dell’ovulazione, in misura diversa a seconda della donna.',
    visualTitle: 'Muco cervicale più fluido',
    visualText: 'Con l’avvicinarsi dell’ovulazione, il muco cervicale diventa più trasparente, più filante e più elastico.',
    otherSigns: [
      'Lieve dolore su un lato del basso ventre («mittelschmerz»)',
      'Tensione al seno',
      'Un leggero aumento della temperatura basale dopo l’ovulazione',
      'Una spinta di energia in alcune donne',
    ],
    body3: 'Osservare questi segni nel corso di più cicli ti aiuta a conoscere il tuo ritmo, che può differire dalle medie generali.',
    alertTitle: 'Attenzione',
    alertText: 'Un ciclo senza ovulazione può verificarsi occasionalmente, senza che questo sia necessariamente motivo di preoccupazione. Se il periodo mestruale è assente per molto tempo o hai dei dubbi, è consigliato un parere medico.',
    tip2Title: 'Da sapere',
    tip2Text: 'Nessun segno è perfettamente affidabile da solo: combinarli permette di farsi un’idea migliore del tuo periodo più fertile.',
    shareMessage: 'Capire l’ovulazione — AWA',
  },
  tr: {
    badge: 'YUMURTLAMA',
    title: 'Yumurtlamayı\nanlamak',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Döngünün en önemli anı ve onu nasıl fark edebileceğin.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Yumurtlama nedir?',
      'Yumurtlamaya eşlik edebilecek belirtiler',
      'Kendi ritmini tanımak',
      'Akılda tutulacaklar',
    ],
    body1: 'Yumurtlama, yumurtalıklardan birinin bir yumurta hücresi salmasıdır. Döngünün toplam uzunluğundan bağımsız olarak genellikle bir sonraki adetinden yaklaşık 14 gün önce gerçekleşir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Kadından kadına değişen, yumurtlama ile adetin gelişi arasındaki süreden çok bir sonraki adet tarihidir.',
    body2: 'Bazı bedensel belirtiler, kadından kadına değişen ölçüde yumurtlamanın yaklaştığına eşlik edebilir.',
    visualTitle: 'Daha akışkan servikal mukus',
    visualText: 'Yumurtlama yaklaştıkça servikal mukus daha berrak, daha uzayabilen ve daha elastik hâle gelir.',
    otherSigns: [
      'Alt karnın bir tarafında hafif ağrı (“mittelschmerz”)',
      'Memelerde hassasiyet',
      'Yumurtlamadan sonra bazal vücut sıcaklığında hafif bir artış',
      'Bazı kadınlarda enerji artışı',
    ],
    body3: 'Bu belirtileri birkaç döngü boyunca gözlemlemek, genel ortalamalardan farklı olabilen kendi ritmini tanımana yardımcı olur.',
    alertTitle: 'Dikkat',
    alertText: 'Yumurtlamanın olmadığı bir döngü ara sıra yaşanabilir; bu mutlaka endişe verici olmak zorunda değildir. Adetin uzun süre gelmezse ya da emin değilsen tıbbi görüş almanı öneririz.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Hiçbir belirti tek başına tamamen güvenilir değildir: belirtileri bir arada değerlendirmek, en doğurgan zamanın hakkında daha iyi bir fikir verir.',
    shareMessage: 'Yumurtlamayı anlamak — AWA',
  },
  ru: {
    badge: 'ОВУЛЯЦИЯ',
    title: 'Понимаем\nовуляцию',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Ключевой момент вашего цикла и то, как его распознать.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое овуляция?',
      'Признаки, которые могут её сопровождать',
      'Как распознать свой собственный ритм',
      'Главное',
    ],
    body1:
      'Овуляция — это выход яйцеклетки из одного из яичников. Обычно она происходит примерно за 14 дней до следующих месячных, независимо от общей продолжительности вашего цикла.',
    tip1Title: 'Полезно знать',
    tip1Text:
      'От женщины к женщине различается именно дата следующих месячных, гораздо больше, чем время между овуляцией и их началом.',
    body2:
      'Некоторые физические признаки могут сопровождать приближение овуляции — в разной степени у разных женщин.',
    visualTitle: 'Более жидкая цервикальная слизь',
    visualText:
      'По мере приближения овуляции цервикальная слизь становится более прозрачной, тягучей и эластичной.',
    otherSigns: [
      'Лёгкая боль с одной стороны внизу живота («миттельшмерц»)',
      'Нагрубание и чувствительность груди',
      'Небольшое повышение базальной температуры после овуляции',
      'Прилив энергии у некоторых женщин',
    ],
    body3:
      'Наблюдение за этими признаками на протяжении нескольких циклов помогает лучше узнать свой собственный ритм, который может отличаться от общих средних значений.',
    alertTitle: 'Обратите внимание',
    alertText:
      'Цикл без овуляции может время от времени случаться, и это не всегда повод для беспокойства. Если месячных нет длительное время или у вас есть сомнения, рекомендуется обратиться к врачу.',
    tip2Title: 'Полезно знать',
    tip2Text:
      'Ни один признак сам по себе не бывает абсолютно надёжным: сочетая их, можно лучше понять, когда у вас наиболее фертильное время.',
    shareMessage: 'Понимаем овуляцию — AWA',
  },
  de: {
    badge: 'EISPRUNG',
    title: 'Den Eisprung\nverstehen',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Der Schlüsselmoment deines Zyklus und wie du ihn erkennst.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist der Eisprung?',
      'Die Anzeichen, die ihn begleiten können',
      'Deinen eigenen Rhythmus erkennen',
      'Das Wichtigste in Kürze',
    ],
    body1:
      'Beim Eisprung gibt einer der Eierstöcke eine Eizelle frei. Er findet in der Regel etwa 14 Tage vor deiner nächsten Periode statt – unabhängig von der Gesamtlänge deines Zyklus.',
    tip1Title: 'Gut zu wissen',
    tip1Text:
      'Es ist der Termin der nächsten Periode, der von Frau zu Frau schwankt, und zwar viel stärker als die Zeit zwischen Eisprung und Periode.',
    body2:
      'Bestimmte körperliche Anzeichen können das Näherrücken des Eisprungs begleiten, je nach Frau unterschiedlich stark.',
    visualTitle: 'Flüssigerer Zervixschleim',
    visualText:
      'Wenn der Eisprung näher rückt, wird der Zervixschleim klarer, dehnbarer und elastischer.',
    otherSigns: [
      'Leichter Schmerz auf einer Seite des Unterbauchs („Mittelschmerz“)',
      'Spannungsgefühl in den Brüsten',
      'Ein leichter Anstieg der Basaltemperatur nach dem Eisprung',
      'Ein Energieschub bei manchen Frauen',
    ],
    body3:
      'Wenn du diese Anzeichen über mehrere Zyklen beobachtest, lernst du deinen eigenen Rhythmus kennen, der von allgemeinen Durchschnittswerten abweichen kann.',
    alertTitle: 'Bitte beachten',
    alertText:
      'Ein Zyklus ohne Eisprung kann gelegentlich vorkommen, ohne dass dies unbedingt Anlass zur Sorge ist. Wenn deine Periode lange ausbleibt oder du dir unsicher bist, wird ärztlicher Rat empfohlen.',
    tip2Title: 'Gut zu wissen',
    tip2Text:
      'Kein einzelnes Anzeichen ist für sich allein völlig zuverlässig: Wenn du sie kombinierst, bekommst du eine bessere Vorstellung davon, wann deine fruchtbarste Zeit ist.',
    shareMessage: 'Den Eisprung verstehen – AWA',
  },
  zh: {
      badge: '排卵',
      title: '了解\n排卵',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '周期中的关键时刻，以及如何识别它。',
      contentsTitle: '本文内容',
      topics: [
        '什么是排卵？',
        '可能伴随出现的迹象',
        '认识你自己的节奏',
        '要点回顾',
      ],
      body1: '排卵是指其中一侧卵巢释放出一枚卵子。无论周期总长度如何，排卵通常发生在下次月经来潮前约 14 天。',
      tip1Title: '小贴士',
      tip1Text: '因人而异的是下次月经来潮的日期，而排卵到月经来潮之间的间隔，变化要小得多。',
      body2: '临近排卵时，身体可能会出现某些迹象，程度因人而异。',
      visualTitle: '宫颈黏液变得更润滑',
      visualText: '临近排卵时，宫颈黏液会变得更清澈、更能拉丝，也更有弹性。',
      otherSigns: [
        '下腹一侧轻微的疼痛（“mittelschmerz”，即排卵痛）',
        '乳房胀痛',
        '排卵后基础体温轻微上升',
        '部分女性会感到精力充沛',
      ],
      body3: '连续几个周期观察这些迹象，可以帮助你了解自己的节奏，它可能与一般的平均情况有所不同。',
      alertTitle: '请注意',
      alertText: '偶尔出现没有排卵的周期是可能的，这不一定值得担心。如果月经长时间没有来，或你不确定，建议咨询医生。',
      tip2Title: '小贴士',
      tip2Text: '单靠任何一种迹象都不是完全可靠的：把它们结合起来，能更好地判断你最易孕的时间。',
      shareMessage: '了解排卵 — AWA',
    },
  id: {
    badge: 'OVULASI',
    title: 'Memahami\novulasi',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Momen kunci dalam siklusmu, dan cara mengenalinya.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu ovulasi?',
      'Tanda-tanda yang mungkin menyertainya',
      'Mengenali iramamu sendiri',
      'Poin penting',
    ],
    body1: 'Ovulasi adalah pelepasan sel telur oleh salah satu ovarium. Ovulasi biasanya terjadi sekitar 14 hari sebelum haid berikutnya, terlepas dari total panjang siklusmu.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Tanggal haid berikutnyalah yang berbeda dari satu perempuan ke perempuan lain, jauh lebih besar daripada jarak antara ovulasi dan datangnya haid.',
    body2: 'Beberapa tanda fisik bisa menyertai mendekatnya ovulasi, dengan tingkat yang berbeda-beda pada setiap perempuan.',
    visualTitle: 'Lendir serviks lebih cair',
    visualText: 'Saat ovulasi mendekat, lendir serviks menjadi lebih bening, lebih licin, dan lebih elastis.',
    otherSigns: [
      'Nyeri ringan di satu sisi perut bagian bawah ("mittelschmerz")',
      'Payudara terasa nyeri',
      'Sedikit kenaikan suhu tubuh basal setelah ovulasi',
      'Dorongan energi pada sebagian perempuan',
    ],
    body3: 'Mengamati tanda-tanda ini selama beberapa siklus membantumu mengenal iramamu sendiri, yang bisa berbeda dari rata-rata umum.',
    alertTitle: 'Harap diperhatikan',
    alertText: 'Siklus tanpa ovulasi kadang bisa terjadi, tanpa harus menjadi alasan untuk khawatir. Jika haidmu tidak datang dalam waktu lama atau kamu merasa ragu, disarankan untuk mencari nasihat medis.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Tidak ada satu tanda pun yang sepenuhnya andal jika berdiri sendiri: menggabungkannya memberi gambaran yang lebih baik tentang masa tersuburmu.',
    shareMessage: 'Memahami ovulasi — AWA',
  },
  hi: {
    badge: 'ओव्यूलेशन',
    title: 'ओव्यूलेशन (अंडोत्सर्ग)\nको समझें',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'आपके चक्र का सबसे अहम पल, और उसे कैसे पहचानें।',
    contentsTitle: 'इस लेख में',
    topics: [
      'ओव्यूलेशन क्या है?',
      'इसके साथ दिखने वाले संकेत',
      'अपनी लय को पहचानना',
      'मुख्य बातें',
    ],
    body1: 'ओव्यूलेशन वह प्रक्रिया है जिसमें किसी एक अंडाशय से अंडाणु बाहर निकलता है। यह आमतौर पर आपके अगले पीरियड से लगभग 14 दिन पहले होता है, चाहे आपके चक्र की कुल लंबाई कुछ भी हो।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'अगले पीरियड की तारीख़ ही हर महिला में अलग-अलग होती है, ओव्यूलेशन से उसके आने तक के समय की तुलना में कहीं ज़्यादा।',
    body2: 'ओव्यूलेशन नज़दीक आने पर कुछ शारीरिक संकेत दिख सकते हैं, जो हर महिला में कम-ज़्यादा हो सकते हैं।',
    visualTitle: 'ज़्यादा तरल गर्भाशय ग्रीवा म्यूकस',
    visualText: 'ओव्यूलेशन नज़दीक आने पर गर्भाशय ग्रीवा का म्यूकस ज़्यादा साफ़, खिंचने वाला और लचीला हो जाता है।',
    otherSigns: [
      'पेट के निचले हिस्से के एक तरफ़ हल्का दर्द (“मिटलश्मेर्ज़”)',
      'स्तनों में कोमलता',
      'ओव्यूलेशन के बाद बेसल शारीरिक तापमान में हल्की बढ़ोतरी',
      'कुछ महिलाओं में ऊर्जा का बढ़ना',
    ],
    body3: 'कई चक्रों तक इन संकेतों पर नज़र रखने से आप अपनी लय पहचान पाती हैं, जो सामान्य औसत से अलग हो सकती है।',
    alertTitle: 'ध्यान दें',
    alertText: 'कभी-कभी बिना ओव्यूलेशन का चक्र भी हो सकता है, और यह ज़रूरी नहीं कि चिंता की बात हो। अगर आपका पीरियड लंबे समय तक नहीं आता या आप निश्चित नहीं हैं, तो चिकित्सकीय सलाह लेना अच्छा रहेगा।',
    tip2Title: 'जानना अच्छा रहेगा',
    tip2Text: 'कोई एक संकेत अकेले पूरी तरह भरोसेमंद नहीं होता: कई संकेतों को मिलाकर देखने से आपके सबसे उपजाऊ समय का बेहतर अंदाज़ा मिलता है।',
    shareMessage: 'ओव्यूलेशन (अंडोत्सर्ग) को समझें — AWA',
  },
  sq: {
    badge: 'OVULACIONI',
    title: 'Kuptimi i\novulacionit',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Momenti kyç i ciklit tënd dhe si ta njohësh.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë është ovulacioni?',
      'Shenjat që mund ta shoqërojnë',
      'Njohja e ritmit tënd',
      'Pikat kryesore',
    ],
    body1: 'Ovulacioni është çlirimi i një veze nga njëra prej vezoreve. Zakonisht ndodh rreth 14 ditë para menstruacionit tjetër, pavarësisht nga gjatësia totale e ciklit tënd.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Data e menstruacionit tjetër është ajo që ndryshon nga një grua te tjetra, shumë më tepër se koha midis ovulacionit dhe ardhjes së tij.',
    body2: 'Disa shenja fizike mund ta shoqërojnë afrimin e ovulacionit, në shkallë të ndryshme sipas çdo gruaje.',
    visualTitle: 'Mukus më i lëngshëm i qafës së mitrës',
    visualText: 'Ndërsa afrohet ovulacioni, mukusi i qafës së mitrës bëhet më i pastër, më i zgjatshëm dhe më elastik.',
    otherSigns: [
      'Dhimbje e lehtë në njërën anë të barkut të poshtëm ("mittelschmerz")',
      'Ndjeshmëri e gjinjve',
      'Një rritje e lehtë e temperaturës bazale pas ovulacionit',
      'Një shtim energjie te disa gra',
    ],
    body3: 'Vëzhgimi i këtyre shenjave gjatë disa cikleve të ndihmon të njohësh ritmin tënd, i cili mund të ndryshojë nga mesataret e përgjithshme.',
    alertTitle: 'Kujdes',
    alertText: 'Ndonjëherë mund të ndodhë një cikël pa ovulacion, pa qenë domosdoshmërisht arsye shqetësimi. Nëse menstruacioni mungon për një kohë të gjatë ose nuk je e sigurt, rekomandohet këshilla mjekësore.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Asnjë shenjë e vetme nuk është plotësisht e besueshme më vete: kombinimi i tyre jep një ide më të mirë për kohën tënde më pjellore.',
    shareMessage: 'Kuptimi i ovulacionit — AWA',
  },
  ja: {
    badge: '排卵',
    title: '排卵を\n理解する',
    metaDuration: '読了6分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: '周期の大切な瞬間と、その見つけ方です。',
    contentsTitle: 'この記事の内容',
    topics: [
      '排卵とは？',
      '排卵に伴うことがあるサイン',
      '自分のリズムを知る',
      'ポイントのまとめ',
    ],
    body1: '排卵とは、どちらかの卵巣から卵子が放出されることです。周期の長さに関わらず、通常は次の生理のおよそ14日前に起こります。',
    tip1Title: '知っておきたいこと',
    tip1Text: '女性によって大きく異なるのは、次の生理が来る日です。排卵から生理までの期間の違いは、それほど大きくありません。',
    body2: '排卵が近づくと、いくつかの体のサインが現れることがあります。現れ方は女性によって異なります。',
    visualTitle: '頸管粘液がさらさらしてくる',
    visualText: '排卵が近づくと、頸管粘液は透明になり、よく伸びて、弾力が出てきます。',
    otherSigns: [
      '下腹部の片側に軽い痛みを感じる（「ミッテルシュメルツ」）',
      '胸の張り',
      '排卵後に基礎体温がわずかに上がる',
      '元気がわいてくる女性もいる',
    ],
    body3: 'これらのサインを何周期か観察すると、自分のリズムがわかってきます。一般的な平均とは違うこともあります。',
    alertTitle: 'ご注意',
    alertText: '排卵のない周期がときどき起こることがありますが、必ずしも心配する必要はありません。生理が長いあいだ来ない場合や、不安なときは、医師に相談することをおすすめします。',
    tip2Title: '知っておきたいこと',
    tip2Text: 'ひとつのサインだけで完全に確かなものはありません。複数を組み合わせると、いちばん妊娠しやすい時期をよりつかみやすくなります。',
    shareMessage: '排卵を理解する — AWA',
  },
  ko: {
    badge: '배란',
    title: '배란\n이해하기',
    metaDuration: '6분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '주기에서 가장 중요한 순간과 이를 알아차리는 방법이에요.',
    contentsTitle: '이 아티클에서는',
    topics: [
      '배란이란?',
      '함께 나타날 수 있는 신호',
      '나만의 리듬 알아차리기',
      '핵심 정리',
    ],
    body1: '배란은 난소 중 한쪽에서 난자가 배출되는 것을 말해요. 주기의 전체 길이와 상관없이 보통 다음 생리 약 14일 전에 일어나요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '사람마다 크게 다른 것은 배란에서 다음 생리까지의 시간보다 다음 생리 날짜예요.',
    body2: '배란이 가까워지면 몇 가지 신체 신호가 나타날 수 있어요. 정도는 사람마다 달라요.',
    visualTitle: '더 묽어지는 자궁 경부 점액',
    visualText: '배란이 가까워지면 자궁 경부 점액이 더 맑고 늘어나며 탄력이 생겨요.',
    otherSigns: [
      '아랫배 한쪽의 가벼운 통증(“mittelschmerz”, 배란통)',
      '가슴 통증',
      '배란 후 기초체온이 약간 오르는 것',
      '일부 여성에게 나타나는 에너지 상승',
    ],
    body3: '여러 주기에 걸쳐 이런 신호를 관찰하면 나만의 리듬을 알게 되는 데 도움이 돼요. 내 리듬은 일반적인 평균과 다를 수 있어요.',
    alertTitle: '참고하세요',
    alertText: '배란이 없는 주기가 가끔 있을 수 있어요. 반드시 걱정해야 하는 일은 아니에요. 생리가 오랫동안 없거나 확실하지 않다면 의학적 조언을 받는 것이 좋아요.',
    tip2Title: '알아 두면 좋아요',
    tip2Text: '어떤 신호도 혼자서는 완벽하게 믿을 수 없어요. 여러 신호를 함께 살펴보면 가임기를 더 잘 가늠할 수 있어요.',
    shareMessage: '배란 이해하기 — AWA',
  },
  'pt-PT': {
    badge: 'OVULAÇÃO',
    title: 'Compreender\na ovulação',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'O momento-chave do seu ciclo e como reconhecê-lo.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que é a ovulação?',
      'Os sinais que a podem acompanhar',
      'Reconhecer o seu próprio ritmo',
      'Pontos essenciais',
    ],
    body1: 'A ovulação é a libertação de um óvulo por um dos ovários. Ocorre geralmente cerca de 14 dias antes do próximo período, independentemente da duração total do seu ciclo.',
    tip1Title: 'Bom saber',
    tip1Text: 'É a data do próximo período que varia de mulher para mulher, muito mais do que o intervalo entre a ovulação e a sua chegada.',
    body2: 'Certos sinais físicos podem acompanhar a aproximação da ovulação, em graus variáveis consoante a mulher.',
    visualTitle: 'Muco cervical mais fluido',
    visualText: 'À medida que a ovulação se aproxima, o muco cervical torna-se mais claro, mais filamentoso e mais elástico.',
    otherSigns: [
      'Dor ligeira num dos lados da parte inferior do abdómen (“mittelschmerz”)',
      'Sensibilidade nos seios',
      'Ligeiro aumento da temperatura corporal basal após a ovulação',
      'Um aumento de energia em algumas mulheres',
    ],
    body3: 'Observar estes sinais ao longo de vários ciclos ajuda a conhecer o seu próprio ritmo, que pode diferir das médias gerais.',
    alertTitle: 'Atenção',
    alertText: 'Pode ocorrer, ocasionalmente, um ciclo sem ovulação, sem que isso seja necessariamente motivo de preocupação. Se o período estiver ausente durante muito tempo ou se tiver dúvidas, recomenda-se aconselhamento médico.',
    tip2Title: 'Bom saber',
    tip2Text: 'Nenhum sinal é perfeitamente fiável por si só: combiná-los dá uma melhor ideia do seu período de maior fertilidade.',
    shareMessage: 'Compreender a ovulação — AWA',
  },
  bn: {
    badge: 'ডিম্বস্ফোটন',
    title: 'ডিম্বস্ফোটন\nবোঝা',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'আপনার চক্রের মূল মুহূর্ত এবং তা কীভাবে চিনবেন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'ডিম্বস্ফোটন কী?',
      'যেসব লক্ষণ দেখা দিতে পারে',
      'নিজের ছন্দ চেনা',
      'মূল কথা',
    ],
    body1: 'ডিম্বস্ফোটন হলো একটি ডিম্বাশয় থেকে ডিম্বাণু নির্গত হওয়া। এটি সাধারণত আপনার পরবর্তী মাসিকের প্রায় 14 দিন আগে ঘটে, চক্রের মোট দৈর্ঘ্য যা-ই হোক না কেন।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'নারীভেদে বেশি বদলায় পরবর্তী মাসিকের তারিখ; ডিম্বস্ফোটন থেকে মাসিক আসা পর্যন্ত সময়ের ব্যবধান তুলনায় অনেক কম বদলায়।',
    body2: 'ডিম্বস্ফোটন ঘনিয়ে এলে কিছু শারীরিক লক্ষণ দেখা দিতে পারে, যা নারীভেদে কমবেশি হয়।',
    visualTitle: 'আরও তরল জরায়ুমুখের শ্লেষ্মা',
    visualText: 'ডিম্বস্ফোটন ঘনিয়ে এলে জরায়ুমুখের শ্লেষ্মা আরও স্বচ্ছ, আরও টানা যায় এমন এবং স্থিতিস্থাপক হয়ে ওঠে।',
    otherSigns: [
      'তলপেটের এক পাশে হালকা ব্যথা ("mittelschmerz")',
      'স্তনে স্পর্শকাতরতা',
      'ডিম্বস্ফোটনের পর বেসাল শরীরের তাপমাত্রা সামান্য বেড়ে যাওয়া',
      'কিছু নারীর ক্ষেত্রে শক্তি বেড়ে যাওয়া',
    ],
    body3: 'কয়েকটি চক্র ধরে এই লক্ষণগুলো পর্যবেক্ষণ করলে আপনি নিজের ছন্দ চিনতে পারবেন, যা সাধারণ গড় হিসাব থেকে আলাদা হতে পারে।',
    alertTitle: 'লক্ষ্য করুন',
    alertText: 'মাঝে মাঝে ডিম্বস্ফোটন ছাড়াই চক্র হতে পারে, এবং এটি অবশ্যই দুশ্চিন্তার কারণ নয়। আপনার মাসিক অনেকদিন বন্ধ থাকলে বা আপনি নিশ্চিত না হলে চিকিৎসকের পরামর্শ নেওয়া ভালো।',
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'কোনো একটি লক্ষণ একা পুরোপুরি নির্ভরযোগ্য নয়: একাধিক লক্ষণ একসঙ্গে দেখলে আপনার সবচেয়ে উর্বর সময় সম্পর্কে ভালো ধারণা পাওয়া যায়।',
    shareMessage: 'ডিম্বস্ফোটন বোঝা — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function OvulationArticleScreen({
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
            {content.body1}
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={ART.mucus}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>{content.visualTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>
                {content.visualText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.otherSigns.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body3}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>

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
  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  checkText: {flex: 1},
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
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
