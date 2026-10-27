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
  da: {
    badge: 'ÆGLØSNING',
    title: 'Forstå\nægløsning',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Det afgørende øjeblik i din cyklus – og hvordan du genkender det.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er ægløsning?',
      'De tegn, der kan følge med',
      'Lær din egen rytme at kende',
      'Vigtige pointer',
    ],
    body1:
      'Ægløsning er frigivelsen af et æg fra et af æggestokkene. Det sker normalt cirka 14 dage før din næste menstruation – uanset din cyklus\' samlede længde.',
    tip1Title: 'Godt at vide',
    tip1Text:
      'Det er datoen for din næste menstruation, der varierer fra kvinde til kvinde – langt mere end tiden mellem ægløsning og dens ankomst.',
    body2:
      'Visse fysiske tegn kan ledsage ægløsningens tilnærmelse, i varierende grad afhængigt af kvinden.',
    visualTitle: 'Mere flydende livmoderhalssekret',
    visualText:
      'Når ægløsningen nærmer sig, bliver livmoderhalssekret mere klart, mere strækbart og elastisk.',
    otherSigns: [
      'Let smerte på den ene side af underlivet ("mittelschmerz")',
      'Ømhed i brysterne',
      'En lille stigning i basaltemperaturen efter ægløsning',
      'Et energiboost hos nogle kvinder',
    ],
    body3:
      'At observere disse tegn over flere cyklusser hjælper dig med at lære din egen rytme at kende – den kan afvige fra generelle gennemsnit.',
    alertTitle: 'Bemærk',
    alertText:
      'En cyklus uden ægløsning kan lejlighedsvis forekomme, uden at det nødvendigvis er grund til bekymring. Hvis din menstruation udebliver i lang tid, eller du er usikker, anbefales det at søge læge.',
    tip2Title: 'Godt at vide',
    tip2Text:
      'Intet enkelt tegn er fuldstændig pålideligt alene: ved at kombinere dem får du et bedre billede af dit mest frugtbare tidspunkt.',
    shareMessage: 'Forstå ægløsning — AWA',
  },
  sv: {
    badge: 'ÄGLÖSNING',
    title: 'Forstå\näglösning',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Det afgörende öjeblik i din cyklus – och hvordan du genkender det.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar äglösning?',
      'De tegn, der kan fölge med',
      'Lär din egen rytme at kende',
      'Vigtige pointer',
    ],
    body1:
      'Äglösning ar frigivelsen av et äg fran et av äggestokkene. Det sker normalt cirka 14 dagar för din näste menstruation – uanset din cyklus\' samlede längde.',
    tip1Title: 'Godt at vide',
    tip1Text:
      'Det ar datoen for din näste menstruation, der varierer fran kvinna till kvinna – langt mere end tiden mellem äglösning och dens ankomst.',
    body2:
      'Visse fysiske tegn kan ledsage äglösningens tilnärmelse, i varierende grad afhängigt av kvinden.',
    visualTitle: 'Mere flydende livmoderhalssekret',
    visualText:
      'Når äglösningen närmer sig, bliver livmoderhalssekret mere klart, mere sträkbart och elastisk.',
    otherSigns: [
      'Let smarta på den ene side av underlivet ("mittelschmerz")',
      'Ömhed i brysterne',
      'En lille stigning i basaltemperaturen efter äglösning',
      'Et energiboost hos nogle kvinder',
    ],
    body3:
      'At observere disse tegn over flere cyklusser hjälper dig med at läre din egen rytme at kende – den kan afvige fran generelle gennemsnit.',
    alertTitle: 'Bemärk',
    alertText:
      'En cyklus uden äglösning kan lejlighedsvis forekomme, uden at det nödvendigvis ar grund till bekymring. Hvis din menstruation udebliver i lang tid, eller du ar usikker, anbefales det at söge läge.',
    tip2Title: 'Godt at vide',
    tip2Text:
      'Intet enkelt tegn ar fuldständig pålideligt alene: ved at kombinere dem får du et bedre billede av ditt mest frugtbare tidspunkt.',
    shareMessage: 'Forstå äglösning — AWA',
  },
  nb: {
    badge: 'EGGLØSNING',
    title: 'Forstå\neggløsningen',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Det viktigste øyeblikket i syklusen din, og hvordan du kjenner det igjen.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er eggløsning?',
      'Tegnene som kan følge med',
      'Kjenne din egen rytme',
      'Det viktigste å huske',
    ],
    body1:
      'Eggløsning er at et egg frigjøres fra en av eggstokkene. Den skjer vanligvis omtrent 14 dager før neste mens, uansett hvor lang syklusen din er totalt.',
    tip1Title: 'Godt å vite',
    tip1Text:
      'Det er datoen for neste mens som varierer fra kvinne til kvinne, langt mer enn tiden mellom eggløsningen og at mensen kommer.',
    body2:
      'Visse kroppslige tegn kan følge med når eggløsningen nærmer seg, i varierende grad avhengig av kvinnen.',
    visualTitle: 'Mer flytende livmorhalsslim',
    visualText:
      'Når eggløsningen nærmer seg, blir livmorhalsslimet klarere, mer strekkbart og mer elastisk.',
    otherSigns: [
      'Svak smerte på den ene siden av nedre del av magen («mittelschmerz»)',
      'Ømme bryster',
      'En liten stigning i basaltemperaturen etter eggløsningen',
      'Et energiskudd hos noen kvinner',
    ],
    body3:
      'Å observere disse tegnene over flere sykluser hjelper deg å bli kjent med din egen rytme, som kan avvike fra generelle gjennomsnitt.',
    alertTitle: 'Merk',
    alertText:
      'En syklus uten eggløsning kan av og til forekomme, uten at det nødvendigvis er grunn til bekymring. Hvis mensen uteblir lenge eller du er usikker, anbefales medisinsk råd.',
    tip2Title: 'Godt å vite',
    tip2Text:
      'Ingen enkelt tegn er helt pålitelig alene: å kombinere dem gir et bedre bilde av din mest fruktbare tid.',
    shareMessage: 'Forstå eggløsningen – AWA',
  },
  pl: {
    badge: 'OWULACJA',
    title: 'Zrozumieć\nowulację',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Kluczowy moment Twojego cyklu i jak go rozpoznać.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym jest owulacja?',
      'Objawy, które mogą jej towarzyszyć',
      'Rozpoznawanie własnego rytmu',
      'Najważniejsze wnioski',
    ],
    body1:
      'Owulacja to uwolnienie komórki jajowej przez jeden z jajników. Zwykle następuje około 14 dni przed kolejną miesiączką, niezależnie od całkowitej długości cyklu.',
    tip1Title: 'Warto wiedzieć',
    tip1Text:
      'To data następnej miesiączki różni się u poszczególnych kobiet, znacznie bardziej niż czas między owulacją a jej nadejściem.',
    body2:
      'Pewne objawy fizyczne mogą towarzyszyć zbliżającej się owulacji, w różnym stopniu u różnych kobiet.',
    visualTitle: 'Bardziej płynny śluz szyjkowy',
    visualText:
      'W miarę zbliżania się owulacji śluz szyjkowy staje się bardziej przejrzysty, rozciągliwy i elastyczny.',
    otherSigns: [
      'Lekki ból po jednej stronie podbrzusza („mittelschmerz”)',
      'Tkliwość piersi',
      'Niewielki wzrost podstawowej temperatury ciała po owulacji',
      'Przypływ energii u niektórych kobiet',
    ],
    body3:
      'Obserwowanie tych objawów przez kilka cykli pomaga poznać własny rytm, który może różnić się od ogólnych średnich.',
    alertTitle: 'Zwróć uwagę',
    alertText:
      'Cykl bez owulacji może się czasem zdarzyć, niekoniecznie będąc powodem do niepokoju. Jeśli miesiączki nie ma przez długi czas lub masz wątpliwości, zalecana jest porada lekarska.',
    tip2Title: 'Warto wiedzieć',
    tip2Text:
      'Żaden pojedynczy objaw nie jest w pełni wiarygodny: łączenie ich daje lepsze wyobrażenie o Twoim najbardziej płodnym czasie.',
    shareMessage: 'Zrozumieć owulację — AWA',
  },
  uk: {
    badge: 'ОВУЛЯЦІЯ',
    title: 'Розуміння\nовуляції',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Ключовий момент вашого циклу та як його розпізнати.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке овуляція?',
      'Ознаки, що можуть її супроводжувати',
      'Розпізнавання власного ритму',
      'Головні висновки',
    ],
    body1:
      'Овуляція — це вихід яйцеклітини з одного з яєчників. Вона зазвичай відбувається приблизно за 14 днів до наступної менструації, незалежно від загальної тривалості циклу.',
    tip1Title: 'Варто знати',
    tip1Text:
      'Саме дата наступної менструації різниться в різних жінок, значно більше, ніж проміжок між овуляцією та її настанням.',
    body2:
      'Деякі фізичні ознаки можуть супроводжувати наближення овуляції, у різній мірі залежно від жінки.',
    visualTitle: 'Більш рідкий цервікальний слиз',
    visualText:
      'У міру наближення овуляції цервікальний слиз стає прозорішим, тягучішим і більш еластичним.',
    otherSigns: [
      'Легкий біль з одного боку внизу живота («міттельшмерц»)',
      'Болючість грудей',
      'Незначне підвищення базальної температури тіла після овуляції',
      'Прилив енергії в деяких жінок',
    ],
    body3:
      'Спостереження за цими ознаками протягом кількох циклів допомагає пізнати власний ритм, який може відрізнятися від загальних середніх значень.',
    alertTitle: 'Зверніть увагу',
    alertText:
      'Цикл без овуляції іноді може траплятися, що не обов’язково є приводом для занепокоєння. Якщо менструації немає довго або ви не впевнені, рекомендовано звернутися за медичною порадою.',
    tip2Title: 'Варто знати',
    tip2Text:
      'Жодна окрема ознака сама по собі не є абсолютно надійною: їх поєднання краще показує ваш найфертильніший час.',
    shareMessage: 'Розуміння овуляції — AWA',
  },
  cs: {
    badge: 'OVULACE',
    title: 'Pochopení\novulace',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Klíčový okamžik vašeho cyklu a jak ho rozpoznat.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co je ovulace?',
      'Příznaky, které ji mohou provázet',
      'Rozpoznání vlastního rytmu',
      'Hlavní poznatky',
    ],
    body1:
      'Ovulace je uvolnění vajíčka z jednoho z vaječníků. Obvykle nastává asi 14 dní před další menstruací, bez ohledu na celkovou délku cyklu.',
    tip1Title: 'Stojí za to vědět',
    tip1Text:
      'Od ženy k ženě se mnohem víc než doba mezi ovulací a menstruací liší datum příchodu další menstruace.',
    body2:
      'Blížící se ovulaci mohou provázet určité tělesné příznaky, v různé míře podle ženy.',
    visualTitle: 'Tekutější cervikální hlen',
    visualText:
      'S blížící se ovulací se cervikální hlen stává čirším, tažnějším a pružnějším.',
    otherSigns: [
      'Mírná bolest na jedné straně podbřišku („mittelschmerz“)',
      'Citlivost prsou',
      'Mírný vzestup bazální tělesné teploty po ovulaci',
      'U některých žen příliv energie',
    ],
    body3:
      'Pozorování těchto příznaků během několika cyklů vám pomůže poznat vlastní rytmus, který se může od obecných průměrů lišit.',
    alertTitle: 'Upozornění',
    alertText:
      'Cyklus bez ovulace se občas může vyskytnout, aniž by to nutně bylo důvodem k obavám. Pokud menstruace dlouho chybí nebo si nejste jistá, doporučuje se lékařská rada.',
    tip2Title: 'Stojí za to vědět',
    tip2Text:
      'Žádný příznak sám o sobě není dokonale spolehlivý: jejich spojení dává lepší představu o vašem nejplodnějším období.',
    shareMessage: 'Pochopení ovulace — AWA',
  },
  sk: {
    badge: 'OVULÁCIA',
    title: 'Pochopenie\novulácie',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Kľúčový okamih vášho cyklu a ako ho rozpoznať.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo je ovulácia?',
      'Znaky, ktoré ju môžu sprevádzať',
      'Rozpoznanie vlastného rytmu',
      'Hlavné body',
    ],
    body1:
      'Ovulácia je uvoľnenie vajíčka z jedného z vaječníkov. Zvyčajne nastáva približne 14 dní pred ďalšou menštruáciou, bez ohľadu na celkovú dĺžku cyklu.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text:
      'Od ženy k žene sa líši najmä dátum ďalšej menštruácie, oveľa viac než čas medzi ovuláciou a jej príchodom.',
    body2:
      'Blížiacu sa ovuláciu môžu sprevádzať určité telesné znaky, u každej ženy v rôznej miere.',
    visualTitle: 'Tekutejší cervikálny hlien',
    visualText:
      'S blížiacou sa ovuláciou sa cervikálny hlien stáva čírejším, ťahavejším a elastickejším.',
    otherSigns: [
      'Mierna bolesť na jednej strane podbruška („mittelschmerz“)',
      'Citlivosť prsníkov',
      'Mierny nárast bazálnej telesnej teploty po ovulácii',
      'U niektorých žien nával energie',
    ],
    body3:
      'Sledovanie týchto znakov počas niekoľkých cyklov vám pomáha spoznať vlastný rytmus, ktorý sa môže líšiť od všeobecných priemerov.',
    alertTitle: 'Upozornenie',
    alertText:
      'Cyklus bez ovulácie sa môže občas vyskytnúť, bez toho, aby to nutne bolo dôvodom na obavy. Ak menštruácia dlho chýba alebo si nie ste istá, odporúča sa lekárska rada.',
    tip2Title: 'Stojí za to vedieť',
    tip2Text:
      'Žiadny jednotlivý znak nie je sám osebe dokonale spoľahlivý: ich kombinovanie poskytuje lepšiu predstavu o vašom najplodnejšom období.',
    shareMessage: 'Pochopenie ovulácie — AWA',
  },
  hu: {
    badge: 'PETEÉRÉS',
    title: 'A peteérés\nmegértése',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A ciklusod kulcsfontosságú pillanata, és hogyan ismerd fel.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi a peteérés?',
      'A kísérő jelek',
      'A saját ritmusod felismerése',
      'Legfontosabb tudnivalók',
    ],
    body1:
      'A peteérés a petesejt kiszabadulása az egyik petefészekből. Általában a következő menstruáció előtt körülbelül 14 nappal következik be, a ciklus teljes hosszától függetlenül.',
    tip1Title: 'Érdemes tudni',
    tip1Text:
      'Nőnként a következő menstruáció dátuma változik, sokkal inkább, mint a peteérés és a megérkezése közötti idő.',
    body2:
      'A peteérés közeledtét bizonyos testi jelek kísérhetik, nőtől függően különböző mértékben.',
    visualTitle: 'Folyékonyabb méhnyaknyálka',
    visualText:
      'A peteérés közeledtével a méhnyaknyálka átlátszóbbá, nyúlósabbá és rugalmasabbá válik.',
    otherSigns: [
      'Enyhe fájdalom az alhas egyik oldalán („mittelschmerz”)',
      'Mellfeszülés',
      'Az alapvető testhőmérséklet enyhe emelkedése a peteérés után',
      'Egyes nőknél energialöket',
    ],
    body3:
      'Ezeknek a jeleknek több cikluson át tartó megfigyelése segít megismerni a saját ritmusodat, amely eltérhet az általános átlagoktól.',
    alertTitle: 'Figyelem',
    alertText:
      'Előfordulhat peteérés nélküli ciklus, anélkül, hogy ez feltétlenül aggodalomra adna okot. Ha a menstruációd hosszan elmarad, vagy bizonytalan vagy, orvosi tanács javasolt.',
    tip2Title: 'Érdemes tudni',
    tip2Text:
      'Egyetlen jel sem tökéletesen megbízható önmagában: a kombinálásuk jobb képet ad a legtermékenyebb időszakodról.',
    shareMessage: 'A peteérés megértése — AWA',
  },
  ro: {
    badge: 'OVULAȚIE',
    title: 'Înțelegerea\novulației',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Momentul-cheie al ciclului tău și cum îl poți recunoaște.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce este ovulația?',
      'Semnele care o pot însoți',
      'Recunoașterea propriului ritm',
      'Ce să reții',
    ],
    body1:
      'Ovulația este eliberarea unui ovul de către unul dintre ovare. Are loc de obicei cu aproximativ 14 zile înainte de următoarea menstruație, indiferent de durata totală a ciclului tău.',
    tip1Title: 'Bine de știut',
    tip1Text:
      'Data următoarei menstruații este cea care variază de la o femeie la alta, mult mai mult decât timpul dintre ovulație și sosirea ei.',
    body2:
      'Anumite semne fizice pot însoți apropierea ovulației, în grade diferite în funcție de femeie.',
    visualTitle: 'Mucus cervical mai fluid',
    visualText:
      'Pe măsură ce ovulația se apropie, mucusul cervical devine mai limpede, mai filant și mai elastic.',
    otherSigns: [
      'O durere ușoară pe o parte a abdomenului inferior („mittelschmerz”)',
      'Sensibilitatea sânilor',
      'O ușoară creștere a temperaturii bazale după ovulație',
      'Un plus de energie la unele femei',
    ],
    body3:
      'Observarea acestor semne pe parcursul mai multor cicluri te ajută să-ți cunoști propriul ritm, care poate diferi de mediile generale.',
    alertTitle: 'Atenție',
    alertText:
      'Un ciclu fără ovulație se poate întâmpla ocazional, fără ca aceasta să fie neapărat un motiv de îngrijorare. Dacă menstruația lipsește mult timp sau ai îndoieli, se recomandă un sfat medical.',
    tip2Title: 'Bine de știut',
    tip2Text:
      'Niciun semn nu este perfect fiabil de sine stătător: combinarea lor oferă o idee mai bună despre momentul tău cel mai fertil.',
    shareMessage: 'Înțelegerea ovulației — AWA',
  },
  bg: {
    badge: 'ОВУЛАЦИЯ',
    title: 'Разбиране на\nовулацията',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Ключовият момент от цикъла ти и как да го разпознаеш.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво е овулация?',
      'Признаците, които могат да я съпътстват',
      'Разпознаване на собствения ти ритъм',
      'Какво да запомниш',
    ],
    body1:
      'Овулацията е освобождаването на яйцеклетка от един от яйчниците. Обикновено настъпва около 14 дни преди следващата ти менструация, независимо от общата продължителност на цикъла ти.',
    tip1Title: 'Добре е да знаеш',
    tip1Text:
      'Датата на следващата менструация е това, което варира от жена на жена, много повече от времето между овулацията и нейното идване.',
    body2:
      'Някои физически признаци могат да съпътстват наближаването на овулацията, в различна степен според жената.',
    visualTitle: 'По-течна цервикална слуз',
    visualText:
      'С наближаването на овулацията цервикалната слуз става по-бистра, по-разтеглива и по-еластична.',
    otherSigns: [
      'Лека болка от едната страна на долната част на корема („миттелшмерц“)',
      'Чувствителност на гърдите',
      'Леко повишаване на базалната температура след овулацията',
      'Прилив на енергия при някои жени',
    ],
    body3:
      'Наблюдението на тези признаци в продължение на няколко цикъла ти помага да опознаеш собствения си ритъм, който може да се различава от общите средни стойности.',
    alertTitle: 'Обърни внимание',
    alertText:
      'Цикъл без овулация понякога може да се случи, без това непременно да е повод за тревога. Ако менструацията ти отсъства дълго или не си сигурна, препоръчва се медицински съвет.',
    tip2Title: 'Добре е да знаеш',
    tip2Text:
      'Никой признак сам по себе си не е напълно надежден: комбинирането им дава по-добра представа за най-плодовития ти период.',
    shareMessage: 'Разбиране на овулацията — AWA',
  },
  sr: {
    badge: 'ОВУЛАЦИЈА',
    title: 'Разумевање\nовулације',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Кључни тренутак твог циклуса и како да га препознаш.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта је овулација?',
      'Знаци који је могу пратити',
      'Препознавање сопственог ритма',
      'Шта да запамтиш',
    ],
    body1:
      'Овулација је ослобађање јајне ћелије из једног од јајника. Обично се дешава око 14 дана пре твоје следеће менструације, без обзира на укупно трајање твог циклуса.',
    tip1Title: 'Добро је знати',
    tip1Text:
      'Датум следеће менструације варира од жене до жене, много више од времена између овулације и њеног доласка.',
    body2:
      'Одређени физички знаци могу пратити приближавање овулације, у различитој мери зависно од жене.',
    visualTitle: 'Течнија цервикална слуз',
    visualText:
      'Како се овулација приближава, цервикална слуз постаје бистрија, развлачивија и еластичнија.',
    otherSigns: [
      'Благи бол са једне стране доњег дела стомака („миттелшмерц“)',
      'Осетљивост дојки',
      'Благ пораст базалне телесне температуре после овулације',
      'Пораст енергије код неких жена',
    ],
    body3:
      'Посматрање ових знакова током неколико циклуса помаже ти да упознаш сопствени ритам, који се може разликовати од општих просека.',
    alertTitle: 'Обрати пажњу',
    alertText:
      'Циклус без овулације повремено се може догодити, а да то нужно није разлог за забринутост. Ако ти менструација дуго изостаје или ниси сигурна, препоручује се медицински савет.',
    tip2Title: 'Добро је знати',
    tip2Text:
      'Ниједан знак сам по себи није савршено поуздан: комбиновање њих даје бољу представу о твом најплоднијем периоду.',
    shareMessage: 'Разумевање овулације — AWA',
  },
  hr: {
    badge: 'OVULACIJA',
    title: 'Razumijevanje\novulacije',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Ključni trenutak tvog ciklusa i kako ga prepoznati.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je ovulacija?',
      'Znakovi koji je mogu pratiti',
      'Prepoznavanje vlastitog ritma',
      'Ključne poruke',
    ],
    body1:
      'Ovulacija je oslobađanje jajne stanice iz jednog od jajnika. Obično nastupa oko 14 dana prije sljedeće menstruacije, neovisno o ukupnoj duljini ciklusa.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Datum sljedeće menstruacije mijenja se od žene do žene, mnogo više nego vrijeme između ovulacije i njezina dolaska.',
    body2:
      'Određeni tjelesni znakovi mogu pratiti približavanje ovulacije, u različitoj mjeri ovisno o ženi.',
    visualTitle: 'Tekuća cervikalna sluz',
    visualText:
      'Kako se ovulacija približava, cervikalna sluz postaje bistrija, rastezljivija i elastičnija.',
    otherSigns: [
      'Blaga bol s jedne strane donjeg dijela trbuha („mittelschmerz“)',
      'Osjetljivost grudi',
      'Blagi porast bazalne temperature nakon ovulacije',
      'Nalet energije kod nekih žena',
    ],
    body3:
      'Promatranje ovih znakova tijekom nekoliko ciklusa pomaže ti upoznati vlastiti ritam, koji se može razlikovati od općih prosjeka.',
    alertTitle: 'Napomena',
    alertText:
      'Ciklus bez ovulacije povremeno se može dogoditi, a da to nužno nije razlog za zabrinutost. Ako menstruacije dugo nema ili si nesigurna, preporučuje se liječnički savjet.',
    tip2Title: 'Dobro je znati',
    tip2Text:
      'Nijedan znak sam po sebi nije savršeno pouzdan: njihova kombinacija daje bolju predodžbu o tvom najplodnijem razdoblju.',
    shareMessage: 'Razumijevanje ovulacije — AWA',
  },
  bs: {
    badge: 'OVULACIJA',
    title: 'Razumijevanje\novulacije',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Ključni trenutak tvog ciklusa i kako ga prepoznati.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je ovulacija?',
      'Znakovi koji je mogu pratiti',
      'Prepoznavanje vlastitog ritma',
      'Ključne poruke',
    ],
    body1:
      'Ovulacija je oslobađanje jajne stanice iz jednog od jajnika. Obično nastupa oko 14 dana prije sljedeće menstruacije, neovisno o ukupnoj duljini ciklusa.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Datum sljedeće menstruacije mijenja se od žene do žene, mnogo više nego vrijeme između ovulacije i njezina dolaska.',
    body2:
      'Određeni tjelesni znakovi mogu pratiti približavanje ovulacije, u različitoj mjeri ovisno o ženi.',
    visualTitle: 'Tekuća cervikalna sluz',
    visualText:
      'Kako se ovulacija približava, cervikalna sluz postaje bistrija, rastezljivija i elastičnija.',
    otherSigns: [
      'Blaga bol s jedne strane donjeg dijela trbuha („mittelschmerz“)',
      'Osjetljivost grudi',
      'Blagi porast bazalne temperature nakon ovulacije',
      'Nalet energije kod nekih žena',
    ],
    body3:
      'Promatranje ovih znakova tokom nekoliko ciklusa pomaže ti upoznati vlastiti ritam, koji se može razlikovati od općih prosjeka.',
    alertTitle: 'Napomena',
    alertText:
      'Ciklus bez ovulacije povremeno se može dogoditi, a da to nužno nije razlog za zabrinutost. Ako menstruacije dugo nema ili si nesigurna, preporučuje se ljekarski savjet.',
    tip2Title: 'Dobro je znati',
    tip2Text:
      'Nijedan znak sam po sebi nije savršeno pouzdan: njihova kombinacija daje bolju predodžbu o tvom najplodnijem razdoblju.',
    shareMessage: 'Razumijevanje ovulacije — AWA',
  },
  sl: {
    badge: 'OVULACIJA',
    title: 'Razumevanje\novulacije',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Ključni trenutek tvojega cikla in kako ga prepoznati.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj je ovulacija?',
      'Znaki, ki jo lahko spremljajo',
      'Prepoznavanje lastnega ritma',
      'Ključna sporočila',
    ],
    body1:
      'Ovulacija je sprostitev jajčne celice iz enega od jajčnikov. Običajno nastopi približno 14 dni pred naslednjo menstruacijo, ne glede na skupno dolžino cikla.',
    tip1Title: 'Vredno vedeti',
    tip1Text:
      'Datum naslednje menstruacije se razlikuje od ženske do ženske, veliko bolj kot čas med ovulacijo in njenim prihodom.',
    body2:
      'Določeni telesni znaki lahko spremljajo približevanje ovulacije, v različni meri glede na žensko.',
    visualTitle: 'Tekoča materničnovratna sluz',
    visualText:
      'Ko se ovulacija bliža, materničnovratna sluz postane bistrejša, raztegljivejša in elastičnejša.',
    otherSigns: [
      'Blaga bolečina na eni strani spodnjega dela trebuha („mittelschmerz“)',
      'Občutljivost prsi',
      'Rahel dvig bazalne temperature po ovulaciji',
      'Naval energije pri nekaterih ženskah',
    ],
    body3:
      'Opazovanje teh znakov skozi več ciklov ti pomaga spoznati lasten ritem, ki se lahko razlikuje od splošnih povprečij.',
    alertTitle: 'Opomba',
    alertText:
      'Cikel brez ovulacije se občasno lahko zgodi, ne da bi to nujno bilo razlog za zaskrbljenost. Če menstruacije dolgo ni ali nisi prepričana, se priporoča zdravniški nasvet.',
    tip2Title: 'Vredno vedeti',
    tip2Text:
      'Noben znak sam po sebi ni popolnoma zanesljiv: njihova kombinacija daje boljšo predstavo o tvojem najplodnejšem obdobju.',
    shareMessage: 'Razumevanje ovulacije — AWA',
  },
  ne: {
    badge: 'अण्डोत्सर्ग',
    title: 'अण्डोत्सर्ग\nबुझ्नुहोस्',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'तपाईंको चक्रको मुख्य क्षण, र यसलाई कसरी चिन्ने।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'अण्डोत्सर्ग के हो?',
      'यसका साथ आउन सक्ने संकेतहरू',
      'आफ्नै लय चिन्ने',
      'मुख्य कुराहरू',
    ],
    body1:
      'अण्डोत्सर्ग भनेको एउटा अण्डाशयले अण्डा निकाल्नु हो। यो तपाईंको चक्रको कुल अवधि जे भए पनि, सामान्यतया तपाईंको अर्को महिनावारीभन्दा करिब 14 दिनअघि हुन्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text:
      'महिलैपिच्छे फरक पर्ने कुरा अर्को महिनावारीको मिति हो, अण्डोत्सर्ग र त्यसको आगमनबीचको समयभन्दा धेरै।',
    body2:
      'केही शारीरिक संकेतहरू अण्डोत्सर्ग नजिकिँदा साथमा आउन सक्छन्, महिलाअनुसार फरक मात्रामा।',
    visualTitle: 'बढी तरल गर्भाशयको मुखको तरल पदार्थ',
    visualText:
      'अण्डोत्सर्ग नजिकिँदा, गर्भाशयको मुखको तरल पदार्थ बढी स्पष्ट, तानिने र लचिलो हुन्छ।',
    otherSigns: [
      'तल्लो पेटको एक छेउमा हल्का दुखाइ ("मिट्टेलश्मर्ज")',
      'स्तनमा दुखाइ',
      'अण्डोत्सर्गपछि आधारभूत शारीरिक तापक्रममा थोरै वृद्धि',
      'केही महिलामा ऊर्जामा वृद्धि',
    ],
    body3:
      'धेरै चक्रमा यी संकेतहरू अवलोकन गर्नाले तपाईंलाई आफ्नै लय चिन्न मद्दत गर्छ, जुन सामान्य औसतभन्दा फरक हुन सक्छ।',
    alertTitle: 'कृपया ध्यान दिनुहोस्',
    alertText:
      'अण्डोत्सर्गबिनाको चक्र कहिलेकाहीँ हुन सक्छ, यो अनिवार्य रूपमा चिन्ताको कारण नभई। तपाईंको महिनावारी लामो समय नआएमा वा तपाईं पक्का हुनुहुन्न भने, चिकित्सकीय सल्लाहको सिफारिस गरिन्छ।',
    tip2Title: 'जान्न लायक',
    tip2Text:
      'कुनै एउटा संकेत एक्लै पूर्ण रूपमा भरपर्दो हुँदैन: तिनलाई जोड्दा तपाईंको सबैभन्दा उर्वर समयको राम्रो अनुमान पाइन्छ।',
    shareMessage: 'अण्डोत्सर्ग बुझ्नुहोस् — AWA',
  },
  si: {
    badge: 'ඩිම්බ මෝචනය',
    title: 'ඩිම්බ මෝචනය\nතේරුම් ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ චක්‍රයේ ප්‍රධාන මොහොත, සහ එය හඳුනාගන්නේ කෙසේද.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඩිම්බ මෝචනය යනු කුමක්ද?',
      'එය සමඟ පැමිණිය හැකි සලකුණු',
      'ඔබේම රිද්මය හඳුනාගැනීම',
      'ප්‍රධාන කරුණු',
    ],
    body1:
      'ඩිම්බ මෝචනය යනු ඩිම්බකෝෂ වලින් එකක් විසින් ඩිම්බයක් නිකුත් කිරීමයි. ඔබේ චක්‍රයේ මුළු දිග කුමක් වුවත්, එය සාමාන්‍යයෙන් ඔබේ ඊළඟ ඔසප්වලට දින 14කට පමණ පෙර සිදුවේ.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text:
      'කාන්තාවෙන් කාන්තාවට වෙනස් වන්නේ ඔබේ ඊළඟ ඔසප් දිනයයි, ඩිම්බ මෝචනය සහ එහි පැමිණීම අතර කාලයට වඩා බොහෝ සේ.',
    body2:
      'සමහර ශාරීරික සලකුණු ඩිම්බ මෝචනය ළං වීමත් සමඟ පැමිණිය හැක, කාන්තාව අනුව විවිධ මට්ටමට.',
    visualTitle: 'වඩා ද්‍රව ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල',
    visualText:
      'ඩිම්බ මෝචනය ළං වන විට, ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල වඩා පැහැදිලි, වඩා දිගු විය හැකි සහ වඩා ප්‍රත්‍යාස්ථ වේ.',
    otherSigns: [
      'පහළ උදරයේ එක් පැත්තක සුළු වේදනාව ("ඩිම්බ මෝචන වේදනාව")',
      'පියයුරු වේදනාව',
      'ඩිම්බ මෝචනයෙන් පසු මූලික ශරීර උෂ්ණත්වයේ සුළු ඉහළ යාමක්',
      'සමහර කාන්තාවන්ට ශක්තියේ වැඩි වීමක්',
    ],
    body3:
      'චක්‍ර කිහිපයක් පුරා මෙම සලකුණු නිරීක්ෂණය කිරීම ඔබේම රිද්මය දැනගැනීමට උපකාරී වේ, එය සාමාන්‍ය සාමාන්‍යයන්ගෙන් වෙනස් විය හැක.',
    alertTitle: 'කරුණාකර සටහන් කරන්න',
    alertText:
      'ඩිම්බ මෝචනයකින් තොර චක්‍රයක් ඉඳහිට සිදුවිය හැක, එය අනිවාර්යයෙන්ම කනස්සල්ලට හේතුවක් නොවේ. ඔබේ ඔසප් දිගු කලක් නොපැමිණෙන්නේ නම් හෝ ඔබට විශ්වාස නැත්නම්, වෛද්‍ය උපදෙස් නිර්දේශ කෙරේ.',
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text:
      'කිසිදු තනි සලකුණක් තනිවම පරිපූර්ණ ලෙස විශ්වාසදායක නොවේ: ඒවා ඒකාබද්ධ කිරීම ඔබේ වඩාත්ම සාරවත් කාලය පිළිබඳ වඩා හොඳ අදහසක් ලබා දෙයි.',
    shareMessage: 'ඩිම්බ මෝචනය තේරුම් ගැනීම — AWA',
  },
  th: {
    badge: 'การตกไข่',
    title: 'ทำความเข้าใจ\nการตกไข่',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ช่วงเวลาสำคัญของรอบเดือนของคุณ และวิธีสังเกต',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'การตกไข่คืออะไร?',
      'สัญญาณที่อาจมาพร้อมกัน',
      'การรู้จักจังหวะของคุณเอง',
      'ประเด็นสำคัญ',
    ],
    body1:
      'การตกไข่คือการปล่อยไข่จากรังไข่ข้างใดข้างหนึ่ง มักเกิดขึ้นประมาณ 14 วันก่อนประจำเดือนครั้งถัดไป ไม่ว่ารอบเดือนของคุณจะยาวเท่าไรก็ตาม',
    tip1Title: 'ควรรู้',
    tip1Text:
      'วันที่ประจำเดือนครั้งถัดไปจะมาต่างหากที่แตกต่างกันในผู้หญิงแต่ละคน มากกว่าช่วงเวลาระหว่างการตกไข่กับการมาของประจำเดือน',
    body2:
      'สัญญาณทางกายบางอย่างอาจมาพร้อมกับการใกล้ตกไข่ ในระดับที่ต่างกันตามผู้หญิงแต่ละคน',
    visualTitle: 'เมือกปากมดลูกที่ลื่นขึ้น',
    visualText:
      'เมื่อใกล้ตกไข่ เมือกปากมดลูกจะใสขึ้น ยืดได้มากขึ้น และยืดหยุ่นมากขึ้น',
    otherSigns: [
      'อาการปวดเบา ๆ ที่ท้องน้อยข้างใดข้างหนึ่ง ("มิตเทลชเมิร์ซ")',
      'เต้านมคัด',
      'อุณหภูมิร่างกายขณะพักสูงขึ้นเล็กน้อยหลังการตกไข่',
      'พลังงานเพิ่มขึ้นในผู้หญิงบางคน',
    ],
    body3:
      'การสังเกตสัญญาณเหล่านี้ตลอดหลายรอบเดือนช่วยให้คุณรู้จักจังหวะของตัวเอง ซึ่งอาจต่างจากค่าเฉลี่ยทั่วไป',
    alertTitle: 'โปรดทราบ',
    alertText:
      'รอบเดือนที่ไม่มีการตกไข่เกิดขึ้นได้เป็นครั้งคราว โดยไม่จำเป็นต้องเป็นเหตุให้กังวล หากประจำเดือนขาดหายไปนานหรือคุณไม่แน่ใจ แนะนำให้ขอคำแนะนำทางการแพทย์',
    tip2Title: 'ควรรู้',
    tip2Text:
      'ไม่มีสัญญาณใดที่เชื่อถือได้อย่างสมบูรณ์ด้วยตัวเอง: การรวมสัญญาณหลายอย่างให้ความเข้าใจที่ดีขึ้นเกี่ยวกับช่วงเวลาที่เจริญพันธุ์ที่สุดของคุณ',
    shareMessage: 'ทำความเข้าใจการตกไข่ — AWA',
  },
  vi: {
    badge: 'RỤNG TRỨNG',
    title: 'Hiểu về\nrụng trứng',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Thời điểm then chốt của chu kỳ và cách nhận biết nó.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Rụng trứng là gì?',
      'Những dấu hiệu có thể đi kèm',
      'Nhận ra nhịp điệu của riêng bạn',
      'Những điểm chính cần nhớ',
    ],
    body1:
      'Rụng trứng là việc một trong hai buồng trứng phóng thích một quả trứng. Nó thường xảy ra khoảng 14 ngày trước kỳ kinh tiếp theo của bạn, bất kể tổng độ dài chu kỳ.',
    tip1Title: 'Nên biết',
    tip1Text:
      'Ngày của kỳ kinh tiếp theo mới là điều khác nhau giữa từng phụ nữ, nhiều hơn rất nhiều so với khoảng thời gian từ lúc rụng trứng đến khi kỳ kinh đến.',
    body2:
      'Một số dấu hiệu thể chất có thể đi kèm khi rụng trứng đến gần, ở mức độ khác nhau tùy từng phụ nữ.',
    visualTitle: 'Dịch nhầy cổ tử cung loãng hơn',
    visualText:
      'Khi sắp rụng trứng, dịch nhầy cổ tử cung trở nên trong hơn, kéo sợi hơn và đàn hồi hơn.',
    otherSigns: [
      'Đau nhẹ ở một bên bụng dưới ("mittelschmerz")',
      'Căng tức ngực',
      'Thân nhiệt cơ bản tăng nhẹ sau khi rụng trứng',
      'Năng lượng tăng vọt ở một số phụ nữ',
    ],
    body3:
      'Quan sát những dấu hiệu này qua nhiều chu kỳ giúp bạn hiểu nhịp điệu của riêng mình, vốn có thể khác với mức trung bình chung.',
    alertTitle: 'Xin lưu ý',
    alertText:
      'Thỉnh thoảng có thể xảy ra một chu kỳ không rụng trứng, mà không nhất thiết là lý do đáng lo. Nếu kỳ kinh vắng mặt lâu hoặc bạn không chắc chắn, nên tìm lời khuyên y khoa.',
    tip2Title: 'Nên biết',
    tip2Text:
      'Không có dấu hiệu đơn lẻ nào hoàn toàn đáng tin cậy: kết hợp chúng cho bạn ý niệm tốt hơn về thời điểm dễ thụ thai nhất.',
    shareMessage: 'Hiểu về rụng trứng — AWA',
  },
  uz: {
    badge: 'OVULYATSIYA',
    title: 'Ovulyatsiyani\ntushunish',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Siklingizning asosiy lahzasi va uni qanday tanish mumkin.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Ovulyatsiya nima?',
      'Unga hamroh boʻlishi mumkin boʻlgan belgilar',
      'Oʻz ritmingizni tanish',
      'Asosiy xulosalar',
    ],
    body1:
      'Ovulyatsiya — tuxumdonlardan birining tuxum hujayra chiqarishi. U siklingizning umumiy uzunligidan qatʼi nazar, odatda keyingi hayzingizdan taxminan 14 kun oldin sodir boʻladi.',
    tip1Title: 'Bilish foydali',
    tip1Text:
      'Ayoldan ayolga farq qiladigani — keyingi hayz sanasi, ovulyatsiya va uning kelishi oraligʻidagi vaqtdan ancha koʻproq.',
    body2:
      'Baʼzi jismoniy belgilar ovulyatsiya yaqinlashishiga ayolga qarab turli darajada hamroh boʻlishi mumkin.',
    visualTitle: 'Suyuqroq bachadon boʻyni shilligi',
    visualText:
      'Ovulyatsiya yaqinlashganda bachadon boʻyni shilligi shaffofroq, choʻziluvchanroq va elastikroq boʻladi.',
    otherSigns: [
      'Qorin pastki qismining bir tomonida yengil ogʻriq (“mittelschmerz”)',
      'Koʻkrakning sezgirligi',
      'Ovulyatsiyadan keyin bazal tana haroratining biroz koʻtarilishi',
      'Baʼzi ayollarda energiyaning ortishi',
    ],
    body3:
      'Bu belgilarni bir necha sikl davomida kuzatish umumiy oʻrtacha koʻrsatkichlardan farq qilishi mumkin boʻlgan oʻz ritmingizni bilishga yordam beradi.',
    alertTitle: 'Eʼtibor bering',
    alertText:
      'Ovulyatsiyasiz sikl vaqti-vaqti bilan boʻlishi mumkin, bu albatta xavotirga sabab emas. Agar hayz uzoq vaqt boʻlmasa yoki shubhangiz boʻlsa, tibbiy maslahat tavsiya etiladi.',
    tip2Title: 'Bilish foydali',
    tip2Text:
      'Birorta belgi yakka oʻzi mutlaqo ishonchli emas: ularni birlashtirish eng unumdor vaqtingiz haqida yaxshiroq tasavvur beradi.',
    shareMessage: 'Ovulyatsiyani tushunish — AWA',
  },
  az: {
    badge: 'OVULYASİYA',
    title: 'Ovulyasiyanı\nanlamaq',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Dövrünüzün əsas anı və onu necə tanımaq olar.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Ovulyasiya nədir?',
      'Ona qoşulan ola biləcək əlamətlər',
      'Öz ritminizi tanımaq',
      'Əsas nəticələr',
    ],
    body1:
      'Ovulyasiya yumurtalıqlardan birindən yumurtahüceyrənin ayrılmasıdır. O, dövrün ümumi uzunluğundan asılı olmayaraq, adətən növbəti aybaşınızdan təxminən 14 gün əvvəl baş verir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text:
      'Qadından qadına dəyişən, ovulyasiya ilə aybaşının gəlişi arasındakı vaxtdan daha çox, növbəti aybaşınızın tarixidir.',
    body2:
      'Bəzi fiziki əlamətlər qadından asılı olaraq müxtəlif dərəcədə ovulyasiyanın yaxınlaşmasını müşayiət edə bilər.',
    visualTitle: 'Daha maye uşaqlıq boynu mukusu',
    visualText:
      'Ovulyasiya yaxınlaşdıqca uşaqlıq boynu mukusu daha şəffaf, daha dartılan və daha elastik olur.',
    otherSigns: [
      'Qarının aşağı hissəsinin bir tərəfində yüngül ağrı ("mittelschmerz")',
      'Döşün həssaslığı',
      'Ovulyasiyadan sonra bazal bədən temperaturunun yüngül yüksəlməsi',
      'Bəzi qadınlarda enerji artımı',
    ],
    body3:
      'Bu əlamətləri bir neçə dövr ərzində müşahidə etmək ümumi ortalamalardan fərqlənə bilən öz ritminizi tanımağa kömək edir.',
    alertTitle: 'Nəzərə alın',
    alertText:
      'Ovulyasiyasız dövr bəzən baş verə bilər və bu mütləq narahatlıq səbəbi deyil. Aybaşı uzun müddət yoxdursa və ya əmin deyilsinizsə, tibbi məsləhət tövsiyə olunur.',
    tip2Title: 'Bilmək faydalıdır',
    tip2Text:
      'Heç bir tək əlamət özlüyündə tam etibarlı deyil: onları birləşdirmək ən münbit vaxtınız haqqında daha yaxşı təsəvvür verir.',
    shareMessage: 'Ovulyasiyanı anlamaq — AWA',
  },
  ka: {
    badge: 'ოვულაცია',
    title: 'ოვულაციის\nგაგება',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'თქვენი ციკლის მთავარი მომენტი და როგორ ამოვიცნოთ იგი.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის ოვულაცია?',
      'ნიშნები, რომლებიც შეიძლება თან ახლდეს',
      'თქვენი საკუთარი რიტმის ამოცნობა',
      'მთავარი დასკვნები',
    ],
    body1:
      'ოვულაცია ერთ-ერთი საკვერცხის მიერ კვერცხუჯრედის გამოთავისუფლებაა. ის, როგორც წესი, თქვენი შემდეგი მენსტრუაციიდან დაახლოებით 14 დღით ადრე ხდება, თქვენი ციკლის საერთო ხანგრძლივობის მიუხედავად.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text:
      'ქალიდან ქალამდე უფრო თქვენი შემდეგი მენსტრუაციის თარიღი განსხვავდება და არა ოვულაციასა და მის დადგომას შორის დრო.',
    body2:
      'გარკვეული ფიზიკური ნიშნები შეიძლება თან ახლდეს ოვულაციის მოახლოებას, ქალის მიხედვით განსხვავებული ხარისხით.',
    visualTitle: 'უფრო თხევადი საშვილოსნოს ყელის ლორწო',
    visualText:
      'ოვულაციის მოახლოებისას საშვილოსნოს ყელის ლორწო უფრო გამჭვირვალე, გაჭიმვადი და ელასტიური ხდება.',
    otherSigns: [
      'მსუბუქი ტკივილი ქვედა მუცლის ერთ მხარეს („მიტელშმერცი“)',
      'მკერდის სიმტკივნე',
      'ბაზალური ტემპერატურის მცირედი მატება ოვულაციის შემდეგ',
      'ენერგიის მატება ზოგ ქალში',
    ],
    body3:
      'ამ ნიშნებზე რამდენიმე ციკლის განმავლობაში დაკვირვება გეხმარებათ საკუთარი რიტმის გაცნობაში, რომელიც ზოგად საშუალო მაჩვენებლებისგან შეიძლება განსხვავდებოდეს.',
    alertTitle: 'გაითვალისწინეთ',
    alertText:
      'ციკლი ოვულაციის გარეშე ზოგჯერ შეიძლება მოხდეს, ეს აუცილებლად შეშფოთების მიზეზი არ არის. თუ მენსტრუაცია დიდხანს არ მოდის ან დარწმუნებული არ ხართ, რეკომენდებულია სამედიცინო რჩევა.',
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text:
      'არცერთი ნიშანი თავისთავად სრულიად სანდო არ არის: მათი შერწყმა თქვენი ყველაზე ფერტილური დროის შესახებ უკეთეს წარმოდგენას გვაძლევს.',
    shareMessage: 'ოვულაციის გაგება — AWA',
  },
  hy: {
    badge: 'ՁՎԱԶԱՏՈՒՄ',
    title: 'Հասկանալ\nձվազատումը',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ձեր ցիկլի առանցքային պահը և ինչպես ճանաչել այն:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է ձվազատումը',
      'Նշաններ, որոնք կարող են ուղեկցել դրան',
      'Ճանաչել ձեր սեփական ռիթմը',
      'Հիմնական եզրակացություններ',
    ],
    body1:
      'Ձվազատումը ձվաբջջի ազատումն է ձվարաններից մեկի կողմից: Այն սովորաբար տեղի է ունենում ձեր հաջորդ դաշտանից մոտ 14 օր առաջ՝ անկախ ձեր ցիկլի ընդհանուր տևողությունից:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text:
      'Կնոջից կին տարբերվում է ձեր հաջորդ դաշտանի ամսաթիվը, շատ ավելին, քան ձվազատման և դրա գալու միջև ընկած ժամանակը:',
    body2:
      'Որոշ ֆիզիկական նշաններ կարող են ուղեկցել ձվազատման մոտենալուն՝ տարբեր չափով՝ կախված կնոջից:',
    visualTitle: 'Ավելի հեղուկ արգանդի վզիկի լորձ',
    visualText:
      'Ձվազատմանը մոտենալիս՝ արգանդի վզիկի լորձը դառնում է ավելի թափանցիկ, ավելի ձգվող և ավելի առաձգական:',
    otherSigns: [
      'Թեթև ցավ որովայնի ստորին հատվածի մի կողմում («Mittelschmerz»)',
      'Կրծքի ցավոտություն',
      'Բազալ ջերմաստիճանի թեթև բարձրացում ձվազատումից հետո',
      'Որոշ կանանց մոտ՝ էներգիայի աճ',
    ],
    body3:
      'Այս նշանները մի քանի ցիկլի ընթացքում դիտարկելը օգնում է ճանաչել ձեր սեփական ռիթմը, որը կարող է տարբերվել ընդհանուր միջինային ցուցանիշներից:',
    alertTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    alertText:
      'Ձվազատում չունեցող ցիկլը երբեմն կարող է պատահել՝ առանց պարտադիր անհանգստության պատճառ լինելու: Եթե ձեր դաշտանը երկար ժամանակ բացակայում է կամ վստահ չեք, խորհուրդ է տրվում բժշկական խորհրդատվություն:',
    tip2Title: 'Լավ է իմանալ',
    tip2Text:
      'Ոչ մի նշան միայնակ կատարյալ հուսալի չէ. դրանց համադրումը տալիս է ձեր ամենապտղաբեր ժամանակի ավելի լավ պատկերացում:',
    shareMessage: 'Հասկանալ ձվազատումը — AWA',
  },
  tg: {
    badge: 'ОВУЛЯЦИЯ',
    title: 'Фаҳмидани\nовуляция',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Лаҳзаи калидии давраи шумо ва чӣ тавр шинохтани он.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Овуляция чист?',
      'Нишонаҳое, ки метавонанд бо он ҳамроҳ шаванд',
      'Шинохтани суръати худ',
      'Хулосаҳои асосӣ',
    ],
    body1:
      'Овуляция озод шудани тухмсел аз яке аз тухмдонҳост. Он одатан тақрибан 14 рӯз пеш аз ҳайзи навбатии шумо рух медиҳад, новобаста аз дарозии умумии давраи шумо.',
    tip1Title: 'Донистан хуб аст',
    tip1Text:
      'Санаи ҳайзи навбатии шумо аз зан ба зан фарқ мекунад, хеле бештар аз вақти байни овуляция ва омадани он.',
    body2:
      'Баъзе нишонаҳои ҷисмонӣ метавонанд наздик шудани овуляцияро ҳамроҳӣ кунанд, бо дараҷаҳои гуногун вобаста ба зан.',
    visualTitle: 'Шилимшиқи гардани бачадони моеътар',
    visualText:
      'Ҳангоми наздик шудани овуляция шилимшиқи гардани бачадон шаффофтар, кашишшавандатар ва чандиртар мешавад.',
    otherSigns: [
      'Дарди сабук дар як тарафи поёни шикам («миттельшмерц»)',
      'Ҳассосияти пистон',
      'Болоравии андаки ҳарорати базалии бадан пас аз овуляция',
      'Афзоиши қувват дар баъзе занон',
    ],
    body3:
      'Мушоҳидаи ин нишонаҳо дар давоми якчанд давра ба шумо кумак мекунад суръати худро бишносед, ки метавонад аз миёнаҳои умумӣ фарқ кунад.',
    alertTitle: 'Таваҷҷӯҳ кунед',
    alertText:
      'Давра бе овуляция баъзан метавонад рух диҳад, бидуни он ки ҳатман сабаби нигаронӣ бошад. Агар ҳайзи шумо муддати дароз набошад ё мутмаин набошед, маслиҳати тиббӣ тавсия дода мешавад.',
    tip2Title: 'Донистан хуб аст',
    tip2Text:
      'Ягон нишона худ ба худ комилан боэътимод нест: якҷоя кардани онҳо тасаввури беҳтар дар бораи вақти ҳосилхезтарини шумо медиҳад.',
    shareMessage: 'Фаҳмидани овуляция — AWA',
  },
  ky: {
    badge: 'ОВУЛЯЦИЯ',
    title: 'Овуляцияны\nтүшүнүү',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Циклиңиздин негизги учуру жана аны кантип таануу керек.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Овуляция деген эмне?',
      'Ага кошо жүрүшү мүмкүн болгон белгилер',
      'Өз ритмиңизди таануу',
      'Негизги жыйынтыктар',
    ],
    body1:
      'Овуляция — жумурткалыктардын биринен жумурткалуу клетканын чыгышы. Ал адатта цикл узактыгына карабастан, кийинки етек киримден болжол менен 14 күн мурун болот.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text:
      'Аялдан аялга көбүрөөк өзгөргөн нерсе — кийинки етек киримдин күнү, овуляция менен анын келишинин ортосундагы убакыттан көрө.',
    body2:
      'Айрым физикалык белгилер овуляция жакындаганда, аялга жараша ар кандай даражада кошо жүрүшү мүмкүн.',
    visualTitle: 'Суюгураак жатын моюнчасынын былжыры',
    visualText:
      'Овуляция жакындаган сайын жатын моюнчасынын былжыры тунуктап, созулуучу жана ийкемдүү болот.',
    otherSigns: [
      'Курсактын ылдый жагынын бир тарабында жеңил оору («миттельшмерц»)',
      'Көкүрөктүн сезгичтиги',
      'Овуляциядан кийин базалдык дене температурасынын бир аз көтөрүлүшү',
      'Айрым аялдарда энергиянын көбөйүшү',
    ],
    body3:
      'Бул белгилерди бир нече цикл бою байкоо жалпы орточо маанилерден айырмаланышы мүмкүн болгон өз ритмиңизди таанууга жардам берет.',
    alertTitle: 'Көңүл буруңуз',
    alertText:
      'Овуляциясыз цикл кээде болушу мүмкүн, бул сөзсүз тынчсыздануунун себеби эмес. Етек кирим узак убакыт болбосо же күмөн болсо, медициналык кеңеш сунушталат.',
    tip2Title: 'Билүү пайдалуу',
    tip2Text:
      'Бир да белги өзү кемчиликсиз ишенимдүү эмес: аларды айкалыштыруу эң бойго бүтүүгө ыңгайлуу убактыңыз жөнүндө жакшыраак түшүнүк берет.',
    shareMessage: 'Овуляцияны түшүнүү — AWA',
  },
  tk: {
    badge: 'OVULÝASIÝA',
    title: 'Ovulýasiýany\ndüşünmek',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Sikliňiziň esasy pursaty we ony nähili tanamaly.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Ovulýasiýa näme?',
      'Oňa hemrah bolup biljek alamatlar',
      'Öz ritmiňizi tanamak',
      'Esasy netijeler',
    ],
    body1:
      'Ovulýasiýa ýumurtgalyklaryň birinden ýumurtganyň çykmagy. Ol sikliňiziň umumy uzynlygyna garamazdan, adatça indiki aýbaşyňyzdan takmynan 14 gün öň bolýar.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text:
      'Aýaldan aýala tapawutlanýan indiki aýbaşyňyzyň senesi, ovulýasiýa bilen onuň gelişiniň arasyndaky wagtdan has köp.',
    body2:
      'Käbir fiziki alamatlar ovulýasiýanyň ýakynlaşmagyna hemrah bolup biler, aýala görä dürli derejede.',
    visualTitle: 'Has suwuk ýatgy boýnunyň ýaňsy',
    visualText:
      'Ovulýasiýa ýakynlaşanda, ýatgy boýnunyň ýaňsy has arassa, has çozulýan we has çeýe bolýar.',
    otherSigns: [
      'Garnyň aşagynyň bir tarapynda ýeňil agyry («mittelschmerz»)',
      'Döşüň duýgurlygy',
      'Ovulýasiýadan soň bazal beden temperaturasynyň az-kem ýokarlanmagy',
      'Käbir aýallarda energiýanyň artmagy',
    ],
    body3:
      'Bu alamatlary birnäçe sikl dowamynda synlamak umumy ortaça bahalardan tapawutlanyp biljek öz ritmiňizi tanamaga kömek edýär.',
    alertTitle: 'Üns beriň',
    alertText:
      'Ovulýasiýasyz sikl wagtal-wagtal bolup biler, bu hökmany derejede alada üçin sebäp däl. Aýbaşyňyz uzak wagt bolmasa ýa-da ynamsyz bolsaňyz, lukmançylyk maslahaty maslahat berilýär.',
    tip2Title: 'Bilmek peýdaly',
    tip2Text:
      'Hiç bir ýeke alamat ýeke özi doly ygtybarly däl: olary utgaşdyrmak göwreli bolmaga iň amatly wagtyňyz barada has gowy düşünje berýär.',
    shareMessage: 'Ovulýasiýany düşünmek — AWA',
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
