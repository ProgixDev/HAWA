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
  'zh-Hant': {
      badge: '排卵',
      title: '瞭解\n排卵',
      metaDuration: '閱讀約 6 分鐘',
      metaType: '指南',
      metaLevel: '入門',
      metaValidated: '已稽核內容',
      intro: '週期中的關鍵時刻，以及如何識別它。',
      contentsTitle: '本文內容',
      topics: [
        '什麼是排卵？',
        '可能伴隨出現的跡象',
        '認識你自己的節奏',
        '要點回顧',
      ],
      body1: '排卵是指其中一側卵巢釋放出一枚卵子。無論週期總長度如何，排卵通常發生在下次月經來潮前約 14 天。',
      tip1Title: '小提醒',
      tip1Text: '因人而異的是下次月經來潮的日期，而排卵到月經來潮之間的間隔，變化要小得多。',
      body2: '臨近排卵時，身體可能會出現某些跡象，程度因人而異。',
      visualTitle: '宮頸黏液變得更潤滑',
      visualText: '臨近排卵時，宮頸黏液會變得更清澈、更能拉絲，也更有彈性。',
      otherSigns: [
        '下腹一側輕微的疼痛（「mittelschmerz」，即排卵痛）',
        '乳房脹痛',
        '排卵後基礎體溫輕微上升',
        '部分女性會感到精力充沛',
      ],
      body3: '連續幾個週期觀察這些跡象，可以幫助你瞭解自己的節奏，它可能與一般的平均情況有所不同。',
      alertTitle: '請注意',
      alertText: '偶爾出現沒有排卵的週期是可能的，這不一定值得擔心。如果月經長時間沒有來，或你不確定，建議諮詢醫生。',
      tip2Title: '小提醒',
      tip2Text: '單靠任何一種跡象都不是完全可靠的：把它們結合起來，能更好地判斷你最易孕的時間。',
      shareMessage: '瞭解排卵 — AWA',
    },
  ar: {
    badge: 'الإباضة',
    title: 'فهم\nالإباضة',
    metaDuration: 'قراءة 6 دقائق',
    metaType: 'دليل',
    metaLevel: 'مبتدئ',
    metaValidated: 'محتوى مراجَع',
    intro: 'اللحظة المحورية في دورتك، وكيف تتعرّفين عليها.',
    contentsTitle: 'في هذا المقال',
    topics: [
      'ما هي الإباضة؟',
      'العلامات التي قد ترافقها',
      'التعرف على إيقاعك الخاص',
      'أهم النقاط',
    ],
    body1:
      'الإباضة هي إطلاق بويضة من أحد المبيضين. وتحدث عادةً قبل حوالي 14 يومًا من حيضك القادم، بغض النظر عن طول دورتك الإجمالي.',
    tip1Title: 'من المفيد أن تعرفي',
    tip1Text:
      'موعد حيضك القادم هو الذي يختلف من امرأة إلى أخرى، وبدرجة أكبر بكثير من المدة بين الإباضة وقدومه.',
    body2:
      'قد ترافق بعض العلامات الجسدية اقتراب الإباضة، بدرجات متفاوتة بحسب المرأة.',
    visualTitle: 'مخاط عنق الرحم أكثر سيولة',
    visualText:
      'مع اقتراب الإباضة، يصبح مخاط عنق الرحم أكثر صفاءً وأكثر مطاطية وقابلية للامتداد.',
    otherSigns: [
      'ألم خفيف في جانب واحد من أسفل البطن («ميتلشميرتس»)',
      'ألم في الثديين',
      'ارتفاع طفيف في درجة حرارة الجسم القاعدية بعد الإباضة',
      'دفعة من الطاقة لدى بعض النساء',
    ],
    body3:
      'ملاحظة هذه العلامات على مدى عدة دورات تساعدك على التعرف على إيقاعك الخاص، الذي قد يختلف عن المتوسطات العامة.',
    alertTitle: 'تنبيه',
    alertText:
      'قد تحدث دورة بلا إباضة أحيانًا، دون أن يكون ذلك مدعاة للقلق بالضرورة. وإذا غاب حيضك لفترة طويلة أو كنتِ غير متأكدة، يُنصح بطلب مشورة طبية.',
    tip2Title: 'من المفيد أن تعرفي',
    tip2Text:
      'لا توجد علامة واحدة موثوقة تمامًا بمفردها: والجمع بينها يعطي فكرة أفضل عن فترة خصوبتك القصوى.',
    shareMessage: 'فهم الإباضة — AWA',
  },
  kab: {
    badge: 'OVULATION',
    title: 'Fhem\novulation',
    metaDuration: '6 n tesdatin n tɣuri',
    metaType: 'Amnir',
    metaLevel: 'Anabdu',
    metaValidated: 'Agbur yettwasenqed',
    intro: 'Akud agejdan n cycle-ik, d amek ara t-tessneḍ.',
    contentsTitle: 'Deg umagrad-a',
    topics: [
      'D acu i d ovulation?',
      'Ticraḍ i izemren ad tt-ilin',
      'Sen amiḍan-ik',
      'Tiɣawsiwin tigejdanin',
    ],
    body1:
      'Ovulation d tuffɣa n tamellalt seg yiwen seg yiseksawen. S waṭas teḍra ɣer 14 n wussan send lḥiḍ-ik i d-iteddun, war ma yeḥseb ɣef talemmast n cycle-ik.',
    tip1Title: 'Ilaq ad teẓṛeḍ',
    tip1Text:
      'D asmekti n lḥiḍ-ik i d-iteddun i yettbeddil seg yiwet ɣer tayeḍ, s waṭas ugar n wakud gar ovulation d ukken-is.',
    body2:
      'Kra n ticraḍ n ugraw zemren ad d-ilin ɣer ovulation, s waṭas wala drus almend n tilawin.',
    visualTitle: 'Tidimt n ɛenq n tebburt tettɣaṛ',
    visualText:
      'Mi ara tqeṛṛeb ovulation, tidimt n ɛenq n tebburt tettuɣal d tafessast, tezzulut d tabaɛlalt.',
    otherSigns: [
      'Aḍṛar yeḥfifen deg yiwen n uḍar n teɣmert ("mittelschmerz")',
      'Aḍṛar deg uɣerrus',
      'Asenti n wuḥemmum n ugraw n usawen seld ovulation',
      'Tazmert tameqqrant deg kra n tilawin',
    ],
    body3:
      'Asenqed n ticraḍ-a deg waṭas n cycle ittɛawan ad teẓṛeḍ amiḍan-ik, i izemren ad yemgarad seg umatu.',
    alertTitle: 'Ɣur-k',
    alertText:
      'Cycle war ovulation yezmer ad d-yeḍru kra n tikkal, war ma yili d acraḍ n tuggdi. Ma ur d-yeqqim ara lḥiḍ-ik aṭas n wakud neɣ ur tessineḍ ara, tanṣiḥt n ṭṭbib tettwanṣeḥ.',
    tip2Title: 'Ilaq ad teẓṛeḍ',
    tip2Text:
      'Ulac acraḍ yelhan s wudem uččuran ula d yiwen: asdukkel-nsen yefk-ak tamuɣli yelhan ɣef wakud ideg tesɛuḍ tannumi.',
    shareMessage: 'Fhem ovulation — AWA',
  },
  om: {
    badge: 'OVULATION',
    title: 'Ovulation\nhubachuu',
    metaDuration: 'Daqiiqaa 6 dubbisuuf',
    metaType: 'Qajeelfama',
    metaLevel: 'Jalqabaa',
    metaValidated: 'Qabiyyee sakatta\'ame',
    intro: 'Yeroo ijoo marsaa kee, fi akkamitti adda baasuu akka dandeessu.',
    contentsTitle: 'Barruu kana keessatti',
    topics: [
      'Ovulation maali?',
      'Mallattoowwan wajjin dhufuu danda\'an',
      'Akkaataa ofii kee beekuu',
      'Ka\'umsa gurguddoo',
    ],
    body1:
      'Ovulation gadaa tokko gadaa irraa gadi dhiisuu dha. Baay\'inaan guyyaa 14 laguu kee itti aanu dura ta\'a, dheerina marsaa kee guutuu osoo hin ilaalin.',
    tip1Title: 'Beekuun gaarii dha',
    tip1Text:
      'Guyyaan laguu kee itti aanu dubartii irraa gara dubartiitti garaagarummaa qaba, yeroo ovulation fi dhufuu isaa gidduu jiru caalaa.',
    body2:
      'Mallattoowwan qaamaa tokko tokko ovulation dhiyaachuu wajjin dhufuu danda\'u, dubartii irratti hundaa\'ee hammi garaagarummaa qabaachuu danda\'a.',
    visualTitle: 'Dhangala\'aan garaa garaa caalaatti dhangala\'aa',
    visualText:
      'Ovulation yeroo dhiyaatu, dhangala\'aan garaa garaa ifaa, harkifataa, fi laafaa ta\'a.',
    otherSigns: [
      'Dhukkubbii salphaa gama tokko garaa gadii ("mittelschmerz")',
      'Harmi dhukkubbii',
      'Ovulation booda ho\'ina qaamaa bu\'uuraa waan xiqqoo ol ba\'uu',
      'Dubartoota tokko tokkoof humna dabalataa',
    ],
    body3:
      'Mallattoowwan kana marsaa hedduu keessatti ilaaluun akkaataa ofii kee beekuuf si gargaara; kun giddugaleessa waliigalaa irraa garaagarummaa qabaachuu danda\'a.',
    alertTitle: 'Hubadhu',
    alertText:
      'Marsaan ovulation hin qabne yeroo tokko tokko ta\'uu danda\'a, kun yaaddessaa ta\'uu isaa dirqama miti. Yoo laguun kee yeroo dheeraaf hin jiraanne ykn yoo shakkite, gorsi fayyaa gorfama.',
    tip2Title: 'Beekuun gaarii dha',
    tip2Text:
      'Mallattoon tokkollee ofii isaatiin guutummaatti amanamaa miti: walitti makuun yeroo ulfaaf mijataa kee caalaatti akka beekamu si gargaara.',
    shareMessage: 'Ovulation hubachuu — AWA',
  },
  ti: {
    badge: 'ኦቭዩሌሽን',
    title: 'ኦቭዩሌሽን\nምርዳእ',
    metaDuration: '6 ደቒቕ ንባብ',
    metaType: 'መምርሒ',
    metaLevel: 'መእተዊ',
    metaValidated: 'ዝተገምገመ ትሕዝቶ',
    intro: 'ዝለዓለ ግዜ ዑደትኪ፣ ከመይ ከም እትፈልጥዮ።',
    contentsTitle: 'ኣብዚ ዓንቀጽ',
    topics: [
      'ኦቭዩሌሽን እንታይ እዩ?',
      'ክስዕቡ ዝኽእሉ ምልክታት',
      'ናይ ባዕልኪ ሪትም ምልላይ',
      'ቀንዲ ነጥብታት',
    ],
    body1:
      'ኦቭዩሌሽን ብሓደ ካብ እንቋቕሖ ማህጸን ሓደ እንቋቕሖ ምስቓል እዩ። ብዙሕ ግዜ ሓፈሻዊ ርዝመት ዑደትኪ ዘየገድስ፣ ቅድሚ ዝቕጽል ወርሓዊ ደምኪ ኣስታት 14 መዓልቲ ይፍጸም።',
    tip1Title: 'ምፍላጥ ጽቡቕ እዩ',
    tip1Text:
      'ካብ ሰበይቲ ናብ ሰበይቲ ዝፈላለ ዝቕጽል ወርሓዊ ደምኪ መዓልቲ እዩ፣ ካብቲ ኣብ መንጎ ኦቭዩሌሽንን ምጽዋዕን ዘሎ ግዜ ብዙሕ ዝበዝሐ።',
    body2:
      'ገለ ኣካላዊ ምልክታት ንቅርበት ኦቭዩሌሽን ክስዕብ ይኽእል፣ ከከም ሰበይቲ ብዝተፈላለየ ደረጃ።',
    visualTitle: 'ዝያዳ ፈሳሲ ናይ ማህጸን ሙከስ',
    visualText:
      'ኦቭዩሌሽን ምስ ዝቐርብ፣ ናይ ማህጸን ሙከስ ዝተረጋገአ፣ ዝተሰሓበን ዝያዳ ዝተዘርግሐን ይኸውን።',
    otherSigns: [
      'ኣብ ሓደ ወገን ታሕተዋይ ከብዲ ፈኲስ ቃንዛ ("ሚተልሽመርዝ")',
      'ናይ ጡብ ተነኳኢነት',
      'ድሕሪ ኦቭዩሌሽን ኣብ መሰረታዊ ናይ ኣካል ጽሕቶ ቁሩብ ምዕባይ',
      'ንገለ ደቂ ኣንስትዮ ዝያዳ ጉልበት',
    ],
    body3:
      'ነዚ ምልክታት ኣብ ብዙሓት ዑደታት ምጥማት ካብ ሓፈሻዊ ማእከላይ ዝፈላለ ናይ ባዕልኪ ሪትም ንምፍላጥ ይሕግዝ።',
    alertTitle: 'ጥንቃቐ',
    alertText:
      'ብዘይ ኦቭዩሌሽን ዑደት ሓደ ሓደ ግዜ ክኸውን ይኽእል፣ እዚ ግን ኩሉ ግዜ ዘተሓሳስብ ኣይኮነን። ወርሓዊ ደምኪ ንነዊሕ ግዜ እንተ ዘይመጽአ ወይ እንተ ዘይርግጸኛ ኮንኪ፣ ሓኪማዊ ምኽሪ ይመከር።',
    tip2Title: 'ምፍላጥ ጽቡቕ እዩ',
    tip2Text:
      'ሓደ ምልክት ባዕሉ ምሉእ እምነት ዘለዎ ኣይኮነን፦ ምጥምራቶም ብዛዕባ እቲ ብጣዕሚ ዝፈርየሉ ግዜኺ ዝበለጸ ሓሳብ ይህብ።',
    shareMessage: 'ኦቭዩሌሽን ምርዳእ — AWA',
  },
  rw: {
    badge: 'OVULATION',
    title: 'Gusobanukirwa\novulation',
    metaDuration: 'Iminota 6 yo gusoma',
    metaType: 'Igitabo cy\'inama',
    metaLevel: 'Intangiriro',
    metaValidated: 'Ibisobanuro byasuzumwe',
    intro: 'Igihe cy\'ingenzi cy\'ukwezi kwawe k\'imihango, n\'uko wakimenya.',
    contentsTitle: 'Muri iyi nyandiko',
    topics: [
      'Ovulation ni iki?',
      'Ibimenyetso bishobora kuyigaragaza',
      'Kumenya uko ukwezi kwawe kugenda',
      'Ingingo z\'ingenzi',
    ],
    body1:
      'Ovulation ni irekurwa ry\'igi n\'imwe mu runini rw\'intanga ngore. Akenshi iba hafi iminsi 14 mbere y\'imihango yawe ikurikira, hatitawe ku burebure bwose bw\'ukwezi kwawe.',
    tip1Title: 'Byiza kumenya',
    tip1Text:
      'Itariki y\'imihango yawe ikurikira ni yo itandukana hagati y\'umugore n\'undi, cyane kuruta igihe kiri hagati ya ovulation n\'iza ry\'imihango.',
    body2:
      'Ibimenyetso bimwe by\'umubiri bishobora kujyana no kwegereza ovulation, bitandukanye ku rugero bitewe n\'umugore.',
    visualTitle: 'Ururenda rwo mu nkondo y\'umura rworoshye kurushaho',
    visualText:
      'Uko ovulation yegereza, ururenda rwo mu nkondo y\'umura ruba rusobanutse, rurambuka kandi rworoshye kurushaho.',
    otherSigns: [
      'Ububabare buke ku ruhande rumwe rw\'inda yo hasi ("mittelschmerz")',
      'Kuribwa amabere',
      'Kwiyongera guke kw\'ubushyuhe bw\'umubiri mu gitondo nyuma ya ovulation',
      'Kwiyongera kw\'imbaraga ku bagore bamwe',
    ],
    body3:
      'Kwitegereza ibi bimenyetso mu mezi menshi y\'imihango bigufasha kumenya uko ukwezi kwawe kugenda, gushobora gutandukana n\'impuzandengo rusange.',
    alertTitle: 'Icyitonderwa',
    alertText:
      'Ukwezi kutarimo ovulation gushobora rimwe na rimwe kubaho, bitari ngombwa ko biba impamvu yo guhangayika. Niba imihango yawe imaze igihe kirekire itaza cyangwa ushidikanya, inama z\'abaganga ziragirwa.',
    tip2Title: 'Byiza kumenya',
    tip2Text:
      'Nta kimenyetso na kimwe cyizewe neza ubwacyo: kubihuza bitanga igitekerezo cyiza cy\'igihe ushobora gusama cyane.',
    shareMessage: 'Gusobanukirwa ovulation — AWA',
  },
  rn: {
    badge: 'OVULATION',
    title: 'Gusobanukirwa\novulation',
    metaDuration: 'Iminota 6 yo gusoma',
    metaType: 'Ubuyobozi',
    metaLevel: 'Intangiriro',
    metaValidated: 'Amakuru yasuzumwe',
    intro: 'Akanya k\'ingenzi ka cycle yawe, n\'uko wakamenya.',
    contentsTitle: 'Muri iyi nyandiko',
    topics: [
      'Ovulation ni iki?',
      'Ibimenyetso bishobora kuza na yo',
      'Kumenya injyana yawe bwite',
      'Ingenzi zo kwibuka',
    ],
    body1:
      'Ovulation ni ugusohoka kw\'igi riva muri rumwe mu ngingo z\'intanga ngore (ovaires). Kenshi iba hafi y\'iminsi 14 mbere y\'imihango yawe itaha, uko cycle yawe yaba ingana kose.',
    tip1Title: 'Ni byiza kumenya',
    tip1Text:
      'Ni itariki y\'imihango yawe itaha ihinduka ku mugore umwe n\'undi, cane kuruta igihe kiri hagati ya ovulation no kuza kw\'imihango.',
    body2:
      'Ibimenyetso bimwe by\'umubiri bishobora kuza hafi ya ovulation, mu rugero rutandukanye bitewe n\'umugore.',
    visualTitle: 'Umusemburo wo mu muhogo w\'inda ushonga kurushaho',
    visualText:
      'Uko ovulation yegereje, umusemburo wo mu muhogo w\'inda urushaho kuba usobanutse, urambuka kandi urakomera.',
    otherSigns: [
      'Ububabare bworoheje ku ruhande rumwe rw\'inda yo hasi ("mittelschmerz")',
      'Amabere ababara',
      'Kwiyongera gake k\'ubushyuhe bw\'umubiri (température basale) nyuma ya ovulation',
      'Kwiyongera kw\'imbaraga ku bagore bamwe',
    ],
    body3:
      'Kwitegereza ibi bimenyetso mu ma cycle menshi bigufasha kumenya injyana yawe bwite, ishobora gutandukana n\'impuzandengo rusangi.',
    alertTitle: 'Icitonderwa',
    alertText:
      'Cycle idafite ovulation rimwe na rimwe ishobora kubaho, bitaba ngombwa ko biteye impungenge. Niba imihango yawe imaze igihe kirekire itaza canke ukaba ushidikanya, inama y\'abaganga iratanzwe.',
    tip2Title: 'Ni byiza kumenya',
    tip2Text:
      'Nta kimenyetso kimwe cyizewe rwose ku bwacyo: kubihuza bitanga igitekerezo cyiza cy\'igihe wumva uruhimbi cyane.',
    shareMessage: 'Gusobanukirwa ovulation — AWA',
  },
  ig: {
    badge: 'OVULATION',
    title: 'Ịghọta\novulation',
    metaDuration: 'Nkeji 6 ka ị gụọ',
    metaType: 'Ntụziaka',
    metaLevel: 'Mmalite',
    metaValidated: 'Ọdịnaya a nyochara',
    intro: 'Oge kachasị mkpa nke usoro ọnwa gị, na otú esi amata ya.',
    contentsTitle: 'Na isiokwu a',
    topics: [
      'Gịnị bụ ovulation?',
      'Ihe ngosi nwere ike ịbịa na ya',
      'Ịmata usoro nke gị',
      'Isi ihe ndị dị mkpa',
    ],
    body1:
      'Ovulation bụ ịhapụ akwa site n\'otu n\'ime ovary. Ọ na-eme n\'ihe dị ka ụbọchị 14 tupu nsọ ọnwa gị na-esote, n\'agbanyeghị ogologo usoro ọnwa gị n\'ozuzu.',
    tip1Title: 'Ọ dị mma ịmara',
    tip1Text:
      'Ụbọchị nsọ ọnwa gị na-esote bụ ya na-adịgasị iche site n\'onye nwanyị ruo n\'onye nwanyị, karịa oge dị n\'etiti ovulation na ọbịbịa ya.',
    body2:
      'Ihe ngosi ahụ ụfọdụ nwere ike ịbịa mgbe ovulation na-abịaru nso, n\'ọkwa dị iche dabere n\'onye nwanyị.',
    visualTitle: 'Mmiri ọnụ afọ ime dị ọkụ karị',
    visualText:
      'Ka ovulation na-abịaru nso, mmiri ọnụ afọ ime na-adị ọcha, na-eto, ma dịkwa ọkụ ọkụ.',
    otherSigns: [
      'Mgbu dị nro n\'otu akụkụ n\'okpuru afọ ("mittelschmerz")',
      'Mmetụta mgbu n\'ara',
      'Ntakịrị ịrị elu nke okpomọkụ ahụ basal mgbe ovulation gasịrị',
      'Ike na-abawanye n\'ụfọdụ ụmụ nwanyị',
    ],
    body3:
      'Ilebara ihe ngosi ndị a anya n\'usoro ọnwa ole na ole na-enyere gị aka ịmata usoro nke gị, nke nwere ike ịdị iche na nkezi n\'ozuzu.',
    alertTitle: 'Biko rịba ama',
    alertText:
      'Usoro ọnwa na-enweghị ovulation nwere ike ime mgbe ụfọdụ, na-abụghị mgbe niile ihe na-echegbu. Ọ bụrụ na nsọ ọnwa gị anọghị ogologo oge ma ọ bụ ị nweghị n\'aka, a na-atụ aro ndụmọdụ dọkịta.',
    tip2Title: 'Ọ dị mma ịmara',
    tip2Text:
      'Ọ dịghị otu ihe ngosi a pụrụ ịtụkwasị obi kpam kpam naanị ya: ijikọta ha na-enye echicheka mma gbasara oge gị kachasị mma maka ịmụta nwa.',
    shareMessage: 'Ịghọta ovulation — AWA',
  },
  yo: {
    badge: 'OVULATION',
    title: 'Lílóye\novulation',
    metaDuration: 'Kíkà ìṣẹ́jú 6',
    metaType: 'Ìtọ́sọ́nà',
    metaLevel: 'Ìbẹ̀rẹ̀',
    metaValidated: 'Àkóónú tí a ti yẹ̀wò',
    intro: 'Àkókò pàtàkì àyípo nǹkan oṣù rẹ, àti bí o ṣe lè dá a mọ̀.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    topics: [
      'Kí ni ovulation?',
      'Àwọn àmì tó lè bá a rìn',
      'Mímọ ìlù ara rẹ',
      'Àwọn kókó pàtàkì',
    ],
    body1:
      'Ovulation ni jíjáde ẹyin láti ọ̀kan nínú àwọn ovary. Ó sábà máa ń ṣẹlẹ̀ ní nǹkan bí ọjọ́ 14 ṣáájú nǹkan oṣù rẹ tó kàn, láìka gígùn àyípo rẹ gbogbo sí.',
    tip1Title: 'Ó dára láti mọ̀',
    tip1Text:
      'Ọjọ́ tí nǹkan oṣù rẹ tó kàn yóò dé ni ó ń yàtọ̀ láti obìnrin kan sí òmíràn, ju àkókò láàrin ovulation àti dídé rẹ̀ lọ.',
    body2:
      'Àwọn àmì ara kan lè máa bá ìsúnmọ́ ovulation rìn, ní ìwọ̀n tó yàtọ̀ gẹ́gẹ́ bí obìnrin náà.',
    visualTitle: 'Ìsàn inú obo tó tún rọ̀ jù',
    visualText:
      'Bí ovulation ṣe ń súnmọ́, ìsàn inú obo ń mọ́ sí i, ń nà sí i, ó sì ń rọ̀ sí i.',
    otherSigns: [
      'Ìrora díẹ̀ ní ẹ̀gbẹ́ kan ní ìsàlẹ̀ ikùn ("mittelschmerz")',
      'Ìrora ọmú',
      'Ìgbóná ara ìsinmi tó ga díẹ̀ lẹ́yìn ovulation',
      'Agbára tó ń pọ̀ sí i fún àwọn obìnrin kan',
    ],
    body3:
      'Wíwo àwọn àmì wọ̀nyí fún àyípo púpọ̀ ń ràn ọ́ lọ́wọ́ láti mọ ìlù ara rẹ, èyí tó lè yàtọ̀ sí àwọn ìpíndọ́gba gbogbogbò.',
    alertTitle: 'Jọ̀wọ́ ṣàkíyèsí',
    alertText:
      'Àyípo láìsí ovulation lè ṣẹlẹ̀ nígbà míràn, láìjẹ́ pé èyí jẹ́ ohun tó yẹ kí ó kó ìdààmú báni. Bí nǹkan oṣù rẹ bá kò sí fún ìgbà pípẹ́ tàbí tí kò dá ọ lójú, a gba ìmọ̀ràn ìṣègùn.',
    tip2Title: 'Ó dára láti mọ̀',
    tip2Text:
      'Kò sí àmì kan ṣoṣo tó ṣeé gbẹ́kẹ̀lé pátápátá fúnra rẹ̀: pípa wọ́n pọ̀ ń fúnni ní èrò tó dára jù nípa àkókò tí o lè lóyún jù.',
    shareMessage: 'Lílóye ovulation — AWA',
  },
  zu: {
    badge: 'UKUKHIPHA IQANDA',
    title: 'Ukuqonda\nukukhipha iqanda',
    metaDuration: 'Imizuzu eyi-6 yokufunda',
    metaType: 'Umhlahlandlela',
    metaLevel: 'Isiqalo',
    metaValidated: 'Okubuyekeziwe',
    intro: 'Isikhathi esiyisihluthulelo somjikelezo wakho, nendlela yokusibona.',
    contentsTitle: 'Kulesi sihloko',
    topics: [
      'Kuyini ukukhipha iqanda?',
      'Izimpawu ezingahambisana nakho',
      'Ukubona isigqi sakho siqu',
      'Amaphuzu abalulekile',
    ],
    body1:
      'Ukukhipha iqanda ukukhululwa kweqanda yinye yamaqanda esibeletho. Ngokuvamile kwenzeka cishe izinsuku ezingu-14 ngaphambi kokuya kwakho esikhathini okulandelayo, kungakhathaliseki ubude bonke bomjikelezo wakho.',
    tip1Title: 'Kuhle ukwazi',
    tip1Text:
      'Usuku lokuya kwakho esikhathini okulandelayo lulona oluhluka kwesinye isifazane nakwesinye, kakhulu kunesikhathi esiphakathi kokukhipha iqanda nokufika kwalo.',
    body2:
      'Ezinye izimpawu zomzimba zingahambisana nokusondela kokukhipha iqanda, ngezinga elihlukile kuye ngesifazane.',
    visualTitle: 'Ubumanzi bomlomo wesibeletho obuthambile kakhulu',
    visualText:
      'Njengoba ukukhipha iqanda kusondela, ubumanzi bomlomo wesibeletho buba bucacile, buyalulama futhi buyaqina.',
    otherSigns: [
      'Ubuhlungu obuncane ohlangothini olulodwa lwesisu esingezansi ("mittelschmerz")',
      'Ubuhlungu ebeleni',
      'Ukwenyuka okuncane kwezinga lokushisa komzimba ngesikhathi sokuphumula ngemva kokukhipha iqanda',
      'Amandla amaningi kwabanye besifazane',
    ],
    body3:
      'Ukubuka lezi zimpawu emijikelezweni eminingana kukusiza ukuthi uzazi isigqi sakho siqu, esingahluka kumaphesenti avamile.',
    alertTitle: 'Qaphela',
    alertText:
      'Umjikelezo ongenakho ukukhipha iqanda ungenzeka ngezikhathi ezithile, ngaphandle kokuthi lokhu kuthathwe njengesizathu sokukhathazeka. Uma ukuya kwakho esikhathini kungabikho isikhathi eside noma ungaqiniseki, kunconywa iseluleko sezokwelapha.',
    tip2Title: 'Kuhle ukwazi',
    tip2Text:
      'Akukho uphawu olulodwa oluthembekile ngokuphelele ngokwalo: ukuluhlanganisa kunikeza umbono ongcono wesikhathi sakho sokuzala kakhulu.',
    shareMessage: 'Ukuqonda ukukhipha iqanda — AWA',
  },
  xh: {
    badge: 'I-OVULATION',
    title: 'Ukuqonda\ni-ovulation',
    metaDuration: 'Imizuzu emi-6 yokufunda',
    metaType: 'Isikhokelo',
    metaLevel: 'Umqali',
    metaValidated: 'Umxholo ohlaziyiweyo',
    intro: 'Ixesha elibalulekileyo lomjikelo wakho, nendlela yokuliqonda.',
    contentsTitle: 'Kweli nqaku',
    topics: [
      'Yintoni i-ovulation?',
      'Iimpawu ezinokuhamba nayo',
      'Ukuqonda ixesha lakho',
      'Eyona nto ibalulekileyo',
    ],
    body1:
      'I-Ovulation kukukhululwa kweyiji yenye yemiqolo. Ngokuqhelekileyo yenzeka malunga neentsuku ezi-14 phambi kokuya kwakho exesheni olandelayo, nokuba umjikelo wakho unde kangakanani.',
    tip1Title: 'Kulungile ukwazi',
    tip1Text:
      'Lusuku lokuya kwakho exesheni olandelayo oluhluka komfazi nomfazi, ngaphezulu kakhulu kunexesha eliphakathi kwe-ovulation nokufika kwalo.',
    body2:
      'Iimpawu ezithile zomzimba zinokuhamba nokusondela kwe-ovulation, ngokwamanqanaba ahlukeneyo ngokwabafazi.',
    visualTitle: 'Ubumanzi obuthe thaxa bomlomo wesibeleko',
    visualText:
      'Njengoko i-ovulation isondela, ubumanzi bomlomo wesibeleko buba buhlaza, buthe bula, bubonakale buthe nkqo.',
    otherSigns: [
      'Intlungu encinci ecaleni elinye lesisu esiphantsi ("mittelschmerz")',
      'Ukuvakala kweebele',
      'Ukunyuka okuncinci kobushushu bomzimba obuyisiseko emva kwe-ovulation',
      'Umandla owongezelelekileyo kwabanye abafazi',
    ],
    body3:
      'Ukujonga ezi mpawu kwimijikelo emininzi kunceda ukuba wazi ixesha lakho, elinokwahluka kwiimpuma eziqhelekileyo.',
    alertTitle: 'Qaphela',
    alertText:
      'Umjikelo ongenayo i-ovulation unokwenzeka ngamanye amaxesha, ngaphandle kokuba lisizathu senkxalabo ngokuqinisekileyo. Ukuba ixesha lakho alikho ixesha elide okanye awuqinisekanga, kucetyiswa ingcebiso yezonyango.',
    tip2Title: 'Kulungile ukwazi',
    tip2Text:
      'Akukho phawu lunye luthenjwa ngokupheleleyo lodwa: ukudibanisa ezi mpawu kunika umbono ongcono wexesha lakho eliveza kakhulu.',
    shareMessage: 'Ukuqonda i-ovulation — AWA',
  },
  sn: {
    badge: 'OVULATION',
    title: 'Kunzwisisa\novulation',
    metaDuration: 'Maminitsi matanhatu ekuverenga',
    metaType: 'Nhungamiro',
    metaLevel: 'Vanotanga',
    metaValidated: 'Ruzivo rwakaongororwa',
    intro: 'Nguva yakakosha yekutenderera kwako, uye madiro ekuizivisa.',
    contentsTitle: 'Muchinyorwa ichi',
    topics: [
      'Ovulation chii?',
      'Zviratidzo zvinogona kuuya nayo',
      'Kuziva maitiro ako pachako',
      'Zvinokosha zvekuyeuka',
    ],
    body1:
      'Ovulation kuburitswa kwezai neimwe ye ovaries. Kazhinji inoitika mazuva anenge 14 usati waenda kumwedzi unotevera, pasinei nehurefu hwese hwekutenderera kwako.',
    tip1Title: 'Zvakanaka kuziva',
    tip1Text:
      'Ndiro zuva rekuenda kwako kumwedzi unotevera rinosiyana kubva kumukadzi kuenda kumukadzi, zvakanyanya kupfuura nguva iri pakati pe ovulation nekusvika kwaro.',
    body2:
      'Zviratidzo zvimwe zvemuviri zvinogona kuuya nekusvika kwe ovulation, zvakasiyana zvichienderana nemukadzi.',
    visualTitle: 'Cervical mucus yakanyorova zvakanyanya',
    visualText:
      'Sezvo ovulation ichisvika padyo, cervical mucus inova yakajeka, yakatambanuka, uye ine kutambanuka.',
    otherSigns: [
      'Kurwadziwa kushoma kurutivi rumwe rwepazasi pedumbu ("mittelschmerz")',
      'Kurwadziwa kwemazamu',
      'Kukwira kushoma kwe basal body temperature mushure me ovulation',
      'Simba rakawedzerwa kune vamwe vakadzi',
    ],
    body3:
      'Kutarisa zviratidzo izvi mukati mekutenderera kwakawanda kunokubatsira kuziva maitiro ako pachako, anogona kusiyana nezvizhinji zvakazara.',
    alertTitle: 'Cherechedza',
    alertText:
      'Kutenderera kusina ovulation kunogona kuitika dzimwe nguva, pasina kuti izvi zvive zvikonzero zvekuvhunduka. Kana kuenda kwako kumwedzi kusipo kwenguva refu kana usina chokwadi, zano rechiremba rinokurudzirwa.',
    tip2Title: 'Zvakanaka kuziva',
    tip2Text:
      'Hapana chiratidzo chimwe chinovimbika zvakakwana chega: kuzvibatanidza kunopa fungidziro yakanaka yenguva yako yakanyanya kubereka.',
    shareMessage: 'Kunzwisisa ovulation — AWA',
  },
  ln: {
    badge: 'OVULATION',
    title: 'Kososola\novulation',
    metaDuration: 'Mpe ya kotánga: min 6',
    metaType: 'Mokanda ya litambwisi',
    metaLevel: 'Mobandi',
    metaValidated: 'Maloba oyo ekomi na bokeba',
    intro: 'Ntango ya motuya ya sanza na yo, mpe ndenge ya koyeba yango.',
    contentsTitle: 'Na lisolo oyo',
    topics: [
      'Ovulation ezali nini?',
      'Bilembo oyo ekoki kozala elongo na yango',
      'Koyeba ndenge na yo moko',
      'Makambo ya motuya',
    ],
    body1:
      'Ovulation ezali kobima ya liki na moko ya baovaire. Esalemaka mbala mingi penepene na mikolo 14 liboso ya sanza na yo oyo ekoya, ata boumeli mobimba ya sanza na yo ezali boni.',
    tip1Title: 'Ezali malamu koyeba',
    tip1Text:
      'Ezali mokolo ya sanza na yo oyo ekoya oyo ekesanaka na mwasi na mwasi, mingi koleka ntango na kati ya ovulation mpe koya na yango.',
    body2:
      'Bilembo mosusu ya nzoto ekoki kozala elongo na kopusana ya ovulation, na bonene ekesani engebene na mwasi.',
    visualTitle: 'Mukus ya kingo ya libumu oyo ezali mai mingi',
    visualText:
      'Ntango ovulation ezali kopusana, mukus ya kingo ya libumu ekómaka pɛtɛɛ, ekoki kolonga mpe ekómi na nzela mingi.',
    otherSigns: [
      'Mpasi moke na ngámbo moko ya libumu na nse ("mittelschmerz")',
      'Mpasi ya mabele',
      'Kopusa moke ya molunge ya nzoto ya kokoma sima ya ovulation',
      'Ngolu mingi na basi mosusu',
    ],
    body3:
      'Kotala bilembo oyo na boumeli ya basanza mingi esungaka yo koyeba ndenge na yo moko, oyo ekoki kokesana na nsima ya motango ya mbala mingi.',
    alertTitle: 'Bokebi',
    alertText:
      'Sanza oyo ovulation ezali te ekoki mbala mosusu kosalema, kozanga ete ezala na ntembe ya kobanga. Soki sanza na yo ezali te mpo na ntango molai to ozali na ntembe, toli ya monganga ebongi.',
    tip2Title: 'Ezali malamu koyeba',
    tip2Text:
      'Elembo moko te ezali ya kotyela motema mpenza na yango moko: kosangisa yango epesi likanisi malamu ya ntango na yo ya kobota mingi.',
    shareMessage: 'Kososola ovulation — AWA',
  },
  ff: {
    badge: 'OVULATION',
    title: 'Faamugol\novulation',
    metaDuration: 'Janngugol minit 6',
    metaType: 'Ɗaɓɓitaaji',
    metaLevel: 'Fuɗɗoode',
    metaValidated: 'Habaru ɗum ƴeewtaama',
    intro: 'Wakkati ɓesngu ciklu maaɗa, e no ɗum ɗon anndaa.',
    contentsTitle: 'E winndannde ndee',
    topics: [
      'Ɗume woni ovulation?',
      'Alamaaji ɗi foti hawtude e ɗum',
      'Anndugo laawol maaɗa',
      'Ko ɗum ɗon ɗum ɓesngu',
    ],
    body1:
      'Ovulation ko yaltugol ɓiɗɗo ndu ovaire gooto. Ɗum ɗon waɗa nyalaaji 14 caggal menstruation maaɗa ndu arata, bannjo juutugol ciklu maaɗa fuu.',
    tip1Title: 'Ɗum ɗon ɗum ɓesngu',
    tip1Text:
      'Ko nyalaande menstruation maaɗa ndu arata ɗum ɗon wooɗa e rewbe, ɓurii wakkati hakkunde ovulation e arugol maako.',
    body2:
      'Alamaaji ɓanndu feere foti hawtude e ovulation, ko ɗuuɗi e rewbe.',
    visualTitle: 'Cervical mucus ɗum ɗon wontii ɗiɗi',
    visualText:
      'Nde ovulation ɗum ɗon aroo, cervical mucus ɗum ɗon wontii laaɓɗum, e juutɗum, e ɗum ɗon.',
    otherSigns: [
      'Naawgol seɗɗa e nder reedu e geɗal gooto ("mittelschmerz")',
      'Naawgol e ɓoggol',
      'Wooɗugol seɗɗa e kaaldi ɓanndu caggal ovulation',
      'Semmbe ɗum ɗon wontii e rewbe feere',
    ],
    body3:
      'Yi’ugo alamaaji ɗii e nder ciklu ɗuuɗi walliidi ma anndugo laawol maaɗa, ɗum ɗon wooɗa e hiisa ɗum ɗon.',
    alertTitle: 'Hoolnu',
    alertText:
      'Ciklu alaa ovulation foti waɗude, bannjo ɗum ɗon ko hiisa. So menstruation maaɗa ɗum ɗon alaa ko ɗuuɗi walla a anndaa, ɗaɓɓitaa jamaa doktoor.',
    tip2Title: 'Ɗum ɗon ɗum ɓesngu',
    tip2Text:
      'Alamaa gooto ɗum ɗon hoolnoowo tan: hawtugol ɗum ɗon hokka ma anndugo wakkati maaɗa ɓurii yiɗaaɗum.',
    shareMessage: 'Faamugol ovulation — AWA',
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
  ms: {
    badge: 'OVULASI',
    title: 'Memahami\novulasi',
    metaDuration: '6 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Detik utama kitaran anda, dan bagaimana mengenalinya.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apakah ovulasi?',
      'Tanda yang mungkin menyertainya',
      'Mengenali rentak anda sendiri',
      'Perkara penting untuk diingat',
    ],
    body1:
      'Ovulasi ialah pelepasan sel telur oleh salah satu ovari. Ia biasanya berlaku kira-kira 14 hari sebelum haid anda yang seterusnya, tanpa mengira jumlah tempoh kitaran anda.',
    tip1Title: 'Elok diketahui',
    tip1Text:
      'Tarikh haid anda yang seterusnya yang berbeza dari seorang wanita ke seorang wanita, jauh lebih daripada masa antara ovulasi dan kedatangannya.',
    body2:
      'Tanda fizikal tertentu boleh menyertai menghampirnya ovulasi, pada tahap yang berbeza bergantung pada wanita itu.',
    visualTitle: 'Lendir serviks yang lebih cair',
    visualText:
      'Apabila ovulasi menghampiri, lendir serviks menjadi lebih jernih, lebih kenyal dan lebih elastik.',
    otherSigns: [
      'Sakit ringan pada satu sisi perut bawah ("mittelschmerz")',
      'Payudara sakit',
      'Kenaikan sedikit suhu badan basal selepas ovulasi',
      'Lonjakan tenaga pada sesetengah wanita',
    ],
    body3:
      'Memerhati tanda-tanda ini sepanjang beberapa kitaran membantu anda mengenali rentak anda sendiri, yang boleh berbeza daripada purata umum.',
    alertTitle: 'Sila ambil perhatian',
    alertText:
      'Kitaran tanpa ovulasi kadangkala boleh berlaku, tanpa ini semestinya menjadi punca kebimbangan. Jika haid anda tiada untuk tempoh yang lama atau anda tidak pasti, nasihat perubatan disyorkan.',
    tip2Title: 'Elok diketahui',
    tip2Text:
      'Tiada satu tanda pun yang sepenuhnya boleh dipercayai dengan sendirinya: menggabungkannya memberikan gambaran yang lebih baik tentang waktu paling subur anda.',
    shareMessage: 'Memahami ovulasi — AWA',
  },
  so: {
    badge: 'UKUN-SII-DEYN',
    title: 'Fahamka\nukun-sii-deynta',
    metaDuration: '6 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Daqiiqadda ugu muhiimsan ee wareeggaaga, iyo sida loo aqoonsado.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Waa maxay ukun-sii-deyn?',
      'Calaamadaha ku iman kara',
      'Aqoonsiga xawaarahaaga gaarka ah',
      'Qodobbada muhiimka ah',
    ],
    body1:
      'Ukun-sii-deyn waa sii deynta ukun ay sameyso mid ka mid ah ukun-sidayaasha. Inta badan waxay dhacdaa qiyaastii 14 maalmood ka hor caadadaada xigta, dhererka guud ee wareeggaaga wuu kasta ha ahaadee.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text:
      'Waa taariikhda caadadaada xigta ee ku kala duwan naag ilaa naag, wax badan ka badan waqtiga u dhexeeya ukun-sii-deynta iyo imaatinkeeda.',
    body2:
      'Calaamado jidheed qaar ayaa la socon kara soo dhowaanshaha ukun-sii-deynta, heerar kala duwan iyadoo ku xiran naagta.',
    visualTitle: 'Dheecaan afka ilmo-galeenka oo ka dareere ah',
    visualText:
      'Marka ukun-sii-deyntu soo dhowaato, dheecaanka afka ilmo-galeenku wuxuu noqdaa mid ka cad, ka is-dheeraada, oo ka jilicsan.',
    otherSigns: [
      'Xanuun khafiif ah oo hal dhinac ah oo calooshaada hoose ah (“mittelschmerz”)',
      'Xanuunka naasaha',
      'Kor u kac yar oo heerkulka aasaasiga ah ee jidhka ukun-sii-deynta ka dib',
      'Kor u kac tamar oo dumarka qaar ah',
    ],
    body3:
      'Indho-indheynta calaamadahan dhowr wareeg waxay kaa caawinaysaa inaad barato xawaarahaaga gaarka ah, kaasoo ka duwan kara celcelisyada guud.',
    alertTitle: 'Fadlan ogow',
    alertText:
      'Wareeg ukun-sii-deyn la’aan ah ayaa mararka qaarkood dhici kara, iyadoo aan lagama maarmaan ahayn inay sabab walaac tahay. Haddii caadadaadu waqti dheer maqan tahay ama aadan hubin, talo caafimaad ayaa lagula talinayaa.',
    tip2Title: 'Waxtar leh in la ogaado',
    tip2Text:
      'Calaamad midna keligeed si buuxda uma la isku halleyn karo: isku-darkoodu wuxuu bixiyaa fikrad ka wanaagsan wakhtigaaga ugu bacrimsan.',
    shareMessage: 'Fahamka ukun-sii-deynta — AWA',
  },
  sw: {
    badge: 'UTOAJI WA YAI',
    title: 'Kuelewa\nutoaji wa yai',
    metaDuration: 'Dakika 6 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Wakati muhimu wa mzunguko wako, na jinsi ya kuutambua.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Utoaji wa yai ni nini?',
      'Dalili zinazoweza kuambatana nao',
      'Kutambua mdundo wako mwenyewe',
      'Mambo muhimu ya kukumbuka',
    ],
    body1:
      'Utoaji wa yai ni kutolewa kwa yai na mojawapo ya ovari. Kwa kawaida hutokea takriban siku 14 kabla ya hedhi yako ijayo, bila kujali urefu wa jumla wa mzunguko wako.',
    tip1Title: 'Vyema kujua',
    tip1Text:
      'Ni tarehe ya hedhi yako ijayo inayotofautiana kati ya mwanamke na mwanamke, zaidi sana kuliko muda kati ya utoaji wa yai na kufika kwake.',
    body2:
      'Dalili fulani za mwili zinaweza kuambatana na kukaribia kwa utoaji wa yai, kwa viwango tofauti kulingana na mwanamke.',
    visualTitle: 'Ute wa shingo ya kizazi wenye majimaji zaidi',
    visualText:
      'Utoaji wa yai unapokaribia, ute wa shingo ya kizazi unakuwa safi zaidi, wenye kunyooka zaidi, na wa kunyumbulika zaidi.',
    otherSigns: [
      'Maumivu hafifu upande mmoja wa tumbo la chini ("mittelschmerz")',
      'Maumivu ya matiti',
      'Ongezeko dogo la joto la msingi la mwili baada ya utoaji wa yai',
      'Msukumo wa nguvu kwa baadhi ya wanawake',
    ],
    body3:
      'Kuchunguza dalili hizi katika mizunguko kadhaa kunakusaidia kujua mdundo wako mwenyewe, unaoweza kutofautiana na wastani wa jumla.',
    alertTitle: 'Tafadhali zingatia',
    alertText:
      'Mzunguko usio na utoaji wa yai unaweza kutokea mara kwa mara, bila hili kuwa lazima sababu ya wasiwasi. Ikiwa hedhi yako haipo kwa muda mrefu au huna uhakika, ushauri wa kitabibu unapendekezwa.',
    tip2Title: 'Vyema kujua',
    tip2Text:
      'Hakuna dalili moja inayoaminika kikamilifu peke yake: kuziunganisha kunatoa wazo bora la wakati wako wenye rutuba zaidi.',
    shareMessage: 'Kuelewa utoaji wa yai — AWA',
  },
  kk: {
    badge: 'ОВУЛЯЦИЯ',
    title: 'Овуляцияны\nтүсіну',
    metaDuration: '6 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Циклыңыздың негізгі сәті және оны қалай тануға болады.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Овуляция дегеніміз не?',
      'Онымен бірге жүруі мүмкін белгілер',
      'Өз ырғағыңызды тану',
      'Негізгі қорытындылар',
    ],
    body1:
      'Овуляция — аналық бездердің бірінен жұмыртқа жасушасының шығуы. Ол әдетте циклыңыздың жалпы ұзақтығына қарамастан, келесі етеккіріңізден шамамен 14 күн бұрын болады.',
    tip1Title: 'Білуге тиісті',
    tip1Text:
      'Овуляция мен етеккірдің келуі арасындағы уақытқа қарағанда, әйелден әйелге айтарлықтай өзгеретіні — келесі етеккіріңіздің күні.',
    body2:
      'Кейбір дене белгілері овуляцияның жақындауымен бірге жүруі мүмкін, әйелге байланысты әртүрлі деңгейде.',
    visualTitle: 'Сұйығырақ жатыр мойны шырышы',
    visualText:
      'Овуляция жақындаған кезде жатыр мойны шырышы мөлдірірек, созылғышырақ және серпімдірек болады.',
    otherSigns: [
      'Іштің төменгі жағының бір жағындағы жеңіл ауыру ("миттельшмерц")',
      'Емшектің ауыруы',
      'Овуляциядан кейін базальды дене температурасының шамалы көтерілуі',
      'Кейбір әйелдерде қуаттың артуы',
    ],
    body3:
      'Бұл белгілерді бірнеше цикл бойы бақылау жалпы орташа мәндерден өзгеше болуы мүмкін өз ырғағыңызды білуге көмектеседі.',
    alertTitle: 'Назар аударыңыз',
    alertText:
      'Овуляциясыз цикл анда-санда болуы мүмкін, бұл міндетті түрде алаңдауға себеп емес. Етеккіріңіз ұзақ уақыт болмаса немесе сенімсіз болсаңыз, медициналық кеңес ұсынылады.',
    tip2Title: 'Білуге тиісті',
    tip2Text:
      'Ешбір белгі жалғыз өзі мінсіз сенімді емес: оларды біріктіру ең құнарлы уақытыңыз туралы жақсырақ түсінік береді.',
    shareMessage: 'Овуляцияны түсіну — AWA',
  },
  wo: {
    badge: 'OVILASIYOŊ',
    title: 'Xam\novilasiyoŋ',
    metaDuration: '6 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Jamono bi gëna am solo ci sa wërsëg, ak naka ngay xam ko.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Lan mooy ovilasiyoŋ?',
      'Màndarga yi mën a ànd ak ko',
      'Xam sa ritm',
      'Li am solo',
    ],
    body1:
      'Ovilasiyoŋ mooy génnee nen bi bu benn ci ovèr yi. Daa am ci wetu 14 fan balaa sa règle bu toftal, lu mu mën a doon diiru sa wërsëg bu mat.',
    tip1Title: 'Lu baax a xam',
    tip1Text:
      'Bésu sa règle bu toftal moo wuute ci jigéen ak jigéen, bu gën a bari ci diir bi diggante ovilasiyoŋ ak ayyuwaam.',
    body2:
      'Yenn màndargay yaram mën nañu ànd ak jegewaayu ovilasiyoŋ, ci dayo yu wuute ci jigéen ak jigéen.',
    visualTitle: 'Ndox mu bërëb jëmm bu gën a daw',
    visualText:
      'Ba ovilasiyoŋ di jege, ndox mu bërëb jëmm dafay gën a leer, gën a xëtt te gën a delloo.',
    otherSigns: [
      'Metit bu neex ci benn wet ci suufu biir ("mittelschmerz")',
      'Nàmm yu metti',
      'Yokkute bu tuuti ci tàngoor yaram bu njëkk ginnaaw ovilasiyoŋ',
      'Benn yokkute doole ci yenn jigéen',
    ],
    body3:
      'Seetlu màndarga yii ci ay wërsëg dafay dimbli nga xam sa ritm, mu mën a wuute ak digg-dóomu yu yaatu.',
    alertTitle: 'Teg',
    alertText:
      'Benn wërsëg bu amul ovilasiyoŋ mën na am yenn saa, te loolu du saa su ne lu tiital. Bu amul sa règle lu yàgg walla bu nga am xel-ñaar, ndigalu doktoor des na.',
    tip2Title: 'Lu baax a xam',
    tip2Text:
      'Amul benn màndarga bu wóor lu mat ci boppam: boole leen dafay joxe benn gis bu gën a baax ci sa jamono ju gëna bind.',
    shareMessage: 'Xam ovilasiyoŋ — AWA',
  },
  ha: {
    badge: 'FITAR ƘWAI',
    title: 'Fahimtar\nfitar ƙwai',
    metaDuration: 'karatun minti 6',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Mafi muhimmin lokaci na zagayenki, da yadda za a gane shi.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Menene fitar ƙwai?',
      'Alamomin da za su iya biyo bayanta',
      'Gane tsarinki na kanki',
      'Muhimman abubuwa',
    ],
    body1:
      'Fitar ƙwai ita ce sakin ƙwai ta ɗaya daga cikin ovaries. Yawanci tana faruwa kusan kwanaki 14 kafin hailarki ta gaba, ko da menene jimillar tsawon zagayenki.',
    tip1Title: 'Abin da ya dace a sani',
    tip1Text:
      'Ranar hailarki ta gaba ce ke bambanta daga mace zuwa mace, fiye da lokacin tsakanin fitar ƙwai da zuwanta.',
    body2:
      'Wasu alamomin jiki na iya biyo bayan kusantowar fitar ƙwai, da bambancin matakai bisa mace.',
    visualTitle: 'Majinar mahaifa mai ruwa-ruwa',
    visualText:
      'Yayin da fitar ƙwai ke gabatowa, majinar mahaifa tana zama mai haske, mai mikewa, kuma mai ɗaurewa.',
    otherSigns: [
      'Ƙaramin ciwo a gefe ɗaya na ƙasan ciki ("mittelschmerz")',
      'Ciwon nono',
      'Ɗan hawan zafin jiki na asali bayan fitar ƙwai',
      'Ƙarin kuzari a wasu mata',
    ],
    body3:
      'Lura da waɗannan alamomi a zagaye da dama yana taimaka miki ki san tsarinki na kanki, wanda zai iya bambanta da matsakaicin gama gari.',
    alertTitle: 'Ki lura',
    alertText:
      'Zagaye ba tare da fitar ƙwai ba na iya faruwa wani lokaci, ba tare da wannan lallai ya zama dalilin damuwa ba. Idan hailarki ba ta zo na dogon lokaci ba ko kina cikin shakka, ana ba da shawarar shawarar likita.',
    tip2Title: 'Abin da ya dace a sani',
    tip2Text:
      'Babu alama guda ɗaya da ta dogara gaba ɗaya ita kaɗai: haɗa su yana ba da ingantaccen ra’ayi na lokacinki mafi haihuwa.',
    shareMessage: 'Fahimtar fitar ƙwai — AWA',
  },
  am: {
    badge: 'እንቁላል መልቀቅ',
    title: 'እንቁላል መልቀቅን\nመረዳት',
    metaDuration: '6 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'የዑደትሽ ቁልፍ ጊዜ፣ እና እንዴት እንደምትለዪው።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'እንቁላል መልቀቅ ምንድን ነው?',
      'ሊያጅቡት የሚችሉ ምልክቶች',
      'የራስሽን ሪትም መለየት',
      'ዋና ዋና ነጥቦች',
    ],
    body1:
      'እንቁላል መልቀቅ ከአንዱ ኦቫሪ እንቁላል መልቀቅ ነው። የዑደትሽ ጠቅላላ ርዝመት ምንም ይሁን ብዙውን ጊዜ ከሚቀጥለው የወር አበባሽ በ14 ቀናት አካባቢ በፊት ይከሰታል።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text:
      'ከሴት ወደ ሴት የሚለያየው በእንቁላል መልቀቅና በወር አበባ መምጣት መካከል ካለው ጊዜ ይልቅ የሚቀጥለው የወር አበባሽ ቀን ነው።',
    body2:
      'አንዳንድ የአካል ምልክቶች የእንቁላል መልቀቅን መቃረብ ሊያጅቡ ይችላሉ፣ እንደ ሴቲቱ በተለያየ መጠን።',
    visualTitle: 'ይበልጥ ፈሳሽ የሆነ የማህፀን በር ንፋጭ',
    visualText:
      'እንቁላል መልቀቅ ሲቃረብ የማህፀን በር ንፋጭ ይበልጥ ጥርት ያለ፣ ተለጣጭና የሚሰፋ ይሆናል።',
    otherSigns: [
      'በታችኛው ሆድ በአንድ ጎን ቀላል ህመም (“ሚተልሽመርዝ”)',
      'የጡት ህመም',
      'ከእንቁላል መልቀቅ በኋላ የመሠረታዊ የሰውነት ሙቀት ትንሽ ጭማሪ',
      'በአንዳንድ ሴቶች የጉልበት መጨመር',
    ],
    body3:
      'እነዚህን ምልክቶች በበርካታ ዑደቶች መታዘብ ከአጠቃላይ አማካዮች ሊለይ የሚችለውን የራስሽን ሪትም እንድታውቂ ይረዳሻል።',
    alertTitle: 'ልብ በይ',
    alertText:
      'እንቁላል መልቀቅ የሌለበት ዑደት አልፎ አልፎ ሊከሰት ይችላል፣ ይህ የግድ የመጨነቂያ ምክንያት ሳይሆን። የወር አበባሽ ለረዥም ጊዜ ከቀረ ወይም እርግጠኛ ካልሆንሽ የሕክምና ምክር ይመከራል።',
    tip2Title: 'ማወቅ ጠቃሚ ነው',
    tip2Text:
      'ምንም አንድ ምልክት ብቻውን ፍጹም አስተማማኝ አይደለም፦ ማጣመር የበለጠ ለም ጊዜሽን የተሻለ ሐሳብ ይሰጣል።',
    shareMessage: 'እንቁላል መልቀቅን መረዳት — AWA',
  },
  nl: {
    badge: 'EISPRONG',
    title: 'De eisprong\nbegrijpen',
    metaDuration: '6 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Het sleutelmoment van je cyclus en hoe je het herkent.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Wat is de eisprong?',
      'De tekenen die erbij kunnen horen',
      'Je eigen ritme herkennen',
      'Belangrijkste punten',
    ],
    body1:
      'De eisprong is het vrijkomen van een eicel uit een van de eierstokken. Ze vindt meestal ongeveer 14 dagen vóór je volgende menstruatie plaats, ongeacht de totale duur van je cyclus.',
    tip1Title: 'Goed om te weten',
    tip1Text:
      'Het is de datum van je volgende menstruatie die van vrouw tot vrouw verschilt, veel meer dan de tijd tussen de eisprong en het begin ervan.',
    body2:
      'Bepaalde lichamelijke tekenen kunnen het naderen van de eisprong vergezellen, in verschillende mate afhankelijk van de vrouw.',
    visualTitle: 'Vloeibaarder baarmoederhalsslijm',
    visualText:
      'Als de eisprong nadert, wordt het baarmoederhalsslijm helderder, rekbaarder en elastischer.',
    otherSigns: [
      'Lichte pijn aan één kant van de onderbuik ("mittelschmerz")',
      'Gevoelige borsten',
      'Een lichte stijging van de basale lichaamstemperatuur na de eisprong',
      'Een energieboost bij sommige vrouwen',
    ],
    body3:
      'Deze tekenen over meerdere cycli observeren helpt je je eigen ritme te leren kennen, dat kan verschillen van de algemene gemiddelden.',
    alertTitle: 'Let op',
    alertText:
      'Een cyclus zonder eisprong kan af en toe voorkomen, zonder dat dit per se een reden tot bezorgdheid is. Als je menstruatie lang uitblijft of je het niet zeker weet, wordt medisch advies aanbevolen.',
    tip2Title: 'Goed om te weten',
    tip2Text:
      'Geen enkel teken is op zichzelf volkomen betrouwbaar: ze combineren geeft een beter beeld van je meest vruchtbare tijd.',
    shareMessage: 'De eisprong begrijpen — AWA',
  },
  fi: {
    badge: 'OVULAATIO',
    title: 'Ovulaation\nymmärtäminen',
    metaDuration: '6 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Kiertosi ratkaiseva hetki ja miten sen tunnistaa.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Mikä on ovulaatio?',
      'Merkit, jotka voivat liittyä siihen',
      'Oman rytmisi tunnistaminen',
      'Tärkeimmät asiat',
    ],
    body1:
      'Ovulaatio on munasolun vapautuminen toisesta munasarjasta. Se tapahtuu yleensä noin 14 päivää ennen seuraavia kuukautisia riippumatta kiertosi kokonaispituudesta.',
    tip1Title: 'Hyvä tietää',
    tip1Text:
      'Juuri seuraavien kuukautisten ajankohta vaihtelee naisesta toiseen, paljon enemmän kuin ovulaation ja niiden alkamisen välinen aika.',
    body2:
      'Tietyt fyysiset merkit voivat liittyä ovulaation lähestymiseen vaihtelevassa määrin naisesta riippuen.',
    visualTitle: 'Juoksevampi kohdunkaulan lima',
    visualText:
      'Ovulaation lähestyessä kohdunkaulan lima muuttuu kirkkaammaksi, venyvämmäksi ja joustavammaksi.',
    otherSigns: [
      'Lievä kipu alavatsan toisella puolella (ovulaatiokipu)',
      'Rintojen arkuus',
      'Perusruumiinlämmön lievä nousu ovulaation jälkeen',
      'Energian lisääntyminen joillakin naisilla',
    ],
    body3:
      'Näiden merkkien havainnointi usean kierron ajan auttaa tuntemaan oman rytmisi, joka voi poiketa yleisistä keskiarvoista.',
    alertTitle: 'Huomaa',
    alertText:
      'Kierto ilman ovulaatiota voi satunnaisesti tapahtua ilman, että se välttämättä on syy huoleen. Jos kuukautisesi puuttuvat pitkään tai olet epävarma, lääketieteellistä neuvontaa suositellaan.',
    tip2Title: 'Hyvä tietää',
    tip2Text:
      'Mikään yksittäinen merkki ei ole täysin luotettava yksinään: niiden yhdistäminen antaa paremman kuvan hedelmällisimmästä ajastasi.',
    shareMessage: 'Ovulaation ymmärtäminen — AWA',
  },
  el: {
    badge: 'ΩΟΡΡΗΞΙΑ',
    title: 'Κατανοώντας\nτην ωορρηξία',
    metaDuration: '6 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Η καθοριστική στιγμή του κύκλου σου και πώς να την αναγνωρίσεις.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Τι είναι η ωορρηξία;',
      'Τα σημάδια που μπορεί να τη συνοδεύουν',
      'Αναγνωρίζοντας τον δικό σου ρυθμό',
      'Βασικά συμπεράσματα',
    ],
    body1:
      'Η ωορρηξία είναι η απελευθέρωση ενός ωαρίου από μία από τις ωοθήκες. Συμβαίνει συνήθως περίπου 14 ημέρες πριν την επόμενη περίοδό σου, ανεξάρτητα από τη συνολική διάρκεια του κύκλου σου.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text:
      'Είναι η ημερομηνία της επόμενης περιόδου σου που διαφέρει από γυναίκα σε γυναίκα, πολύ περισσότερο από τον χρόνο ανάμεσα στην ωορρηξία και την άφιξή της.',
    body2:
      'Ορισμένα σωματικά σημάδια μπορεί να συνοδεύουν την προσέγγιση της ωορρηξίας, σε διαφορετικό βαθμό ανάλογα με τη γυναίκα.',
    visualTitle: 'Πιο ρευστή τραχηλική βλέννα',
    visualText:
      'Καθώς πλησιάζει η ωορρηξία, η τραχηλική βλέννα γίνεται πιο διαυγής, πιο ελαστική και τεντώνεται περισσότερο.',
    otherSigns: [
      'Ήπιος πόνος στη μία πλευρά της κάτω κοιλιάς («mittelschmerz»)',
      'Ευαισθησία στο στήθος',
      'Ελαφριά άνοδος της βασικής θερμοκρασίας σώματος μετά την ωορρηξία',
      'Έξαρση ενέργειας σε ορισμένες γυναίκες',
    ],
    body3:
      'Η παρατήρηση αυτών των σημαδιών σε αρκετούς κύκλους σε βοηθά να γνωρίσεις τον δικό σου ρυθμό, που μπορεί να διαφέρει από τους γενικούς μέσους όρους.',
    alertTitle: 'Σημείωση',
    alertText:
      'Ένας κύκλος χωρίς ωορρηξία μπορεί περιστασιακά να συμβεί, χωρίς αυτό να αποτελεί αναγκαστικά λόγο ανησυχίας. Αν η περίοδός σου απουσιάζει για πολύ καιρό ή δεν είσαι σίγουρη, συνιστάται ιατρική συμβουλή.',
    tip2Title: 'Καλό είναι να γνωρίζεις',
    tip2Text:
      'Κανένα μεμονωμένο σημάδι δεν είναι απόλυτα αξιόπιστο από μόνο του: ο συνδυασμός τους δίνει καλύτερη εικόνα της πιο γόνιμης περιόδου σου.',
    shareMessage: 'Κατανοώντας την ωορρηξία — AWA',
  },
  fil: {
    badge: 'OBULASYON',
    title: 'Pag-unawa sa\nobulasyon',
    metaDuration: '6 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Ang pinakamahalagang sandali ng iyong siklo, at kung paano ito makilala.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Ano ang obulasyon?',
      'Ang mga senyales na maaaring kasama nito',
      'Pagkilala sa sarili mong ritmo',
      'Mahahalagang tandaan',
    ],
    body1:
      'Ang obulasyon ay ang paglabas ng itlog mula sa isa sa mga obaryo. Karaniwan itong nangyayari humigit-kumulang 14 na araw bago ang susunod mong regla, anuman ang kabuuang haba ng iyong siklo.',
    tip1Title: 'Mabuting malaman',
    tip1Text:
      'Ang petsa ng susunod mong regla ang nag-iiba sa bawat babae, higit na mas marami kaysa sa pagitan ng obulasyon at ng pagdating nito.',
    body2:
      'Ang ilang pisikal na senyales ay maaaring kasama ng paglapit ng obulasyon, sa iba’t ibang antas depende sa babae.',
    visualTitle: 'Mas malikot na cervical mucus',
    visualText:
      'Habang papalapit ang obulasyon, nagiging mas malinaw, mas nababanat, at mas elastiko ang cervical mucus.',
    otherSigns: [
      'Banayad na sakit sa isang panig ng ibabang tiyan ("mittelschmerz")',
      'Pananakit ng dibdib',
      'Bahagyang pagtaas ng basal body temperature pagkatapos ng obulasyon',
      'Pagdami ng enerhiya sa ilang babae',
    ],
    body3:
      'Ang pagmamasid sa mga senyales na ito sa loob ng ilang siklo ay tumutulong na makilala ang sarili mong ritmo, na maaaring magkaiba sa mga pangkalahatang average.',
    alertTitle: 'Pakitandaan',
    alertText:
      'Paminsan-minsan ay maaaring mangyari ang siklong walang obulasyon, nang hindi kinakailangang ikabahala. Kung matagal na walang regla o kung hindi ka sigurado, inirerekomenda ang payong medikal.',
    tip2Title: 'Mabuting malaman',
    tip2Text:
      'Walang iisang senyales na ganap na maaasahan sa sarili nito: ang pagsasama-sama ng mga ito ay nagbibigay ng mas magandang ideya ng iyong pinakamayabong na panahon.',
    shareMessage: 'Pag-unawa sa obulasyon — AWA',
  },
  ta: {
    badge: 'அண்டவிடுப்பு',
    title: 'அண்டவிடுப்பைப்\nபுரிந்துகொள்ளுதல்',
    metaDuration: '6 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'உங்கள் சுழற்சியின் முக்கியத் தருணம், அதை எப்படி அடையாளம் காண்பது.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'அண்டவிடுப்பு என்றால் என்ன?',
      'அதனுடன் சேர்ந்து வரக்கூடிய அறிகுறிகள்',
      'உங்கள் சொந்தத் தாளத்தை அடையாளம் காணுதல்',
      'முக்கியக் குறிப்புகள்',
    ],
    body1:
      'அண்டவிடுப்பு என்பது அண்டகங்களில் ஒன்றால் ஒரு முட்டை வெளியிடப்படுவது. உங்கள் சுழற்சியின் மொத்த நீளத்தைப் பொருட்படுத்தாமல், இது பொதுவாக உங்கள் அடுத்த மாதவிடாய்க்கு ஏறக்குறைய 14 நாட்களுக்கு முன் நிகழ்கிறது.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text:
      'அண்டவிடுப்புக்கும் அதன் வருகைக்கும் இடையிலான நேரத்தை விட, ஒரு பெண்ணுக்கு மற்றொரு பெண்ணிடமிருந்து மாறுபடுவது உங்கள் அடுத்த மாதவிடாயின் தேதியே.',
    body2:
      'சில உடல் அறிகுறிகள் அண்டவிடுப்பு நெருங்குவதுடன் சேர்ந்து வரலாம், பெண்ணைப் பொறுத்து வெவ்வேறு அளவுகளில்.',
    visualTitle: 'மேலும் திரவமான கருப்பைவாய் சளி',
    visualText:
      'அண்டவிடுப்பு நெருங்கும்போது, கருப்பைவாய் சளி தெளிவாக, இழுபடுவதாக, நெகிழ்வாக மாறுகிறது.',
    otherSigns: [
      'அடிவயிற்றின் ஒரு பக்கத்தில் லேசான வலி ("மிட்டல்ஷ்மெர்ஸ்")',
      'மார்பக வலி',
      'அண்டவிடுப்புக்குப் பின் அடிப்படை உடல் வெப்பநிலையில் சிறிது உயர்வு',
      'சில பெண்களில் ஆற்றல் அதிகரிப்பு',
    ],
    body3:
      'பல சுழற்சிகளில் இந்த அறிகுறிகளைக் கவனிப்பது, பொதுவான சராசரிகளிலிருந்து வேறுபடக்கூடிய உங்கள் சொந்தத் தாளத்தை அறிய உதவுகிறது.',
    alertTitle: 'கவனத்தில் கொள்ளவும்',
    alertText:
      'அண்டவிடுப்பு இல்லாத சுழற்சி எப்போதாவது நிகழலாம், இது கட்டாயம் கவலைக்கான காரணம் அல்ல. உங்கள் மாதவிடாய் நீண்ட காலம் இல்லாவிட்டால் அல்லது உங்களுக்கு உறுதியில்லாவிட்டால், மருத்துவ ஆலோசனை பரிந்துரைக்கப்படுகிறது.',
    tip2Title: 'தெரிந்துகொள்ளுங்கள்',
    tip2Text:
      'எந்த ஒரு அறிகுறியும் தனியாக முழுமையாக நம்பகமானதல்ல: அவற்றை இணைப்பது உங்கள் மிகக் கருவுறும் நேரத்தைப் பற்றிய சிறந்த கருத்தைத் தருகிறது.',
    shareMessage: 'அண்டவிடுப்பைப் புரிந்துகொள்ளுதல் — AWA',
  },
  te: {
    badge: 'అండోత్సర్గం',
    title: 'అండోత్సర్గాన్ని\nఅర్థం చేసుకోవడం',
    metaDuration: '6 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'మీ చక్రంలో కీలక క్షణం, దాన్ని ఎలా గుర్తించాలి.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'అండోత్సర్గం అంటే ఏమిటి?',
      'దానితో కలిసి రాగల సంకేతాలు',
      'మీ సొంత లయను గుర్తించడం',
      'ముఖ్యాంశాలు',
    ],
    body1:
      'అండోత్సర్గం అంటే రెండు అండాశయాల్లో ఒకటి అండాన్ని విడుదల చేయడం. మీ చక్రం మొత్తం నిడివి ఎంతైనా, ఇది సాధారణంగా మీ తర్వాతి నెలసరికి సుమారు 14 రోజుల ముందు జరుగుతుంది.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text:
      'అండోత్సర్గానికి, నెలసరి రాకకు మధ్య సమయం కంటే, ఒక మహిళ నుండి మరొకరికి మారేది మీ తర్వాతి నెలసరి తేదీ.',
    body2:
      'కొన్ని శారీరక సంకేతాలు అండోత్సర్గం దగ్గరపడటంతో కలిసి రావచ్చు, మహిళను బట్టి వివిధ స్థాయిల్లో.',
    visualTitle: 'మరింత ద్రవంగా ఉండే గర్భాశయ ముఖద్వార స్రావం',
    visualText:
      'అండోత్సర్గం దగ్గరపడుతున్నప్పుడు, గర్భాశయ ముఖద్వార స్రావం మరింత స్పష్టంగా, సాగేలా, స్థితిస్థాపకంగా మారుతుంది.',
    otherSigns: [
      'కింది పొట్టలో ఒక వైపు స్వల్ప నొప్పి ("మిట్టెల్‌ష్మెర్జ్")',
      'రొమ్ము నొప్పి',
      'అండోత్సర్గం తర్వాత బేసల్ శరీర ఉష్ణోగ్రతలో స్వల్ప పెరుగుదల',
      'కొందరు మహిళల్లో శక్తి ఉత్సాహం',
    ],
    body3:
      'అనేక చక్రాలలో ఈ సంకేతాలను గమనించడం మీ సొంత లయను తెలుసుకోవడానికి సహాయపడుతుంది, ఇది సాధారణ సగటులకు భిన్నంగా ఉండవచ్చు.',
    alertTitle: 'గమనించండి',
    alertText:
      'అండోత్సర్గం లేని చక్రం అప్పుడప్పుడూ జరగవచ్చు, ఇది తప్పనిసరిగా ఆందోళనకు కారణం కాకుండా. మీ నెలసరి చాలా కాలం లేకపోతే లేదా మీకు ఖచ్చితంగా తెలియకపోతే, వైద్య సలహా సిఫార్సు చేయబడుతుంది.',
    tip2Title: 'తెలుసుకోవాల్సినవి',
    tip2Text:
      'ఏ ఒక్క సంకేతమూ స్వయంగా పూర్తిగా నమ్మదగినది కాదు: వాటిని కలపడం మీ అత్యంత సారవంతమైన సమయం గురించి మంచి ఆలోచన ఇస్తుంది.',
    shareMessage: 'అండోత్సర్గాన్ని అర్థం చేసుకోవడం — AWA',
  },
  mr: {
    badge: 'बीजोत्सर्जन',
    title: 'बीजोत्सर्जन\nसमजून घेणे',
    metaDuration: '6 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'तुमच्या पाळीचा महत्त्वाचा क्षण आणि तो कसा ओळखावा.',
    contentsTitle: 'या लेखात',
    topics: [
      'बीजोत्सर्जन म्हणजे काय?',
      'त्यासोबत येऊ शकणारी चिन्हे',
      'तुमची स्वतःची लय ओळखणे',
      'मुख्य मुद्दे',
    ],
    body1:
      'बीजोत्सर्जन म्हणजे अंडाशयांपैकी एकाकडून बीजांड सोडले जाणे. तुमच्या पाळीचक्राच्या एकूण कालावधीची पर्वा न करता, ते साधारणपणे तुमच्या पुढील पाळीच्या सुमारे 14 दिवस आधी होते.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text:
      'एका स्त्रीपासून दुसऱ्या स्त्रीपर्यंत तुमच्या पुढील पाळीची तारीख बदलते, बीजोत्सर्जन आणि तिचे आगमन यामधील वेळेपेक्षा खूपच जास्त.',
    body2:
      'काही शारीरिक चिन्हे बीजोत्सर्जन जवळ येण्यासोबत असू शकतात, स्त्रीनुसार कमी-अधिक प्रमाणात.',
    visualTitle: 'अधिक पातळ गर्भाशयमुखाचा स्राव',
    visualText:
      'बीजोत्सर्जन जवळ येताना गर्भाशयमुखाचा स्राव अधिक स्वच्छ, अधिक ताणला जाणारा आणि अधिक लवचिक होतो.',
    otherSigns: [
      'पोटाच्या खालच्या भागात एका बाजूला सौम्य वेदना ("मिटेलश्मर्ट्झ")',
      'स्तनांची संवेदनशीलता',
      'बीजोत्सर्जनानंतर बेसल शरीराच्या तापमानात थोडी वाढ',
      'काही स्त्रियांमध्ये ऊर्जेची वाढ',
    ],
    body3:
      'अनेक पाळीचक्रांमध्ये ही चिन्हे पाहिल्याने तुम्हाला तुमची स्वतःची लय जाणून घेण्यास मदत होते, जी सर्वसाधारण सरासरीपेक्षा वेगळी असू शकते.',
    alertTitle: 'कृपया लक्षात घ्या',
    alertText:
      'बीजोत्सर्जनाशिवाय पाळी कधी कधी येऊ शकते, आणि ते चिंतेचे कारण असतेच असे नाही. तुमची पाळी बराच काळ न आल्यास किंवा तुम्हाला खात्री नसल्यास, वैद्यकीय सल्ला घेण्याची शिफारस केली जाते.',
    tip2Title: 'हे जाणून घ्या',
    tip2Text:
      'कोणतेही एक चिन्ह एकट्याने पूर्णपणे विश्वासार्ह नसते: त्यांना एकत्र केल्याने तुमच्या सर्वात सुपीक काळाची चांगली कल्पना येते.',
    shareMessage: 'बीजोत्सर्जन समजून घेणे — AWA',
  },
  gu: {
    badge: 'અંડોત્સર્જન',
    title: 'અંડોત્સર્જનને\nસમજવું',
    metaDuration: '6 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'તમારા ચક્રનો મુખ્ય ક્ષણ, અને તેને કેવી રીતે ઓળખવી.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'અંડોત્સર્જન શું છે?',
      'તેની સાથે આવી શકે તેવા સંકેતો',
      'તમારી પોતાની લય ઓળખવી',
      'મુખ્ય મુદ્દા',
    ],
    body1:
      'અંડોત્સર્જન એટલે એક અંડાશયમાંથી અંડકોષનું મુક્ત થવું. તમારા ચક્રની કુલ લંબાઈ ગમે તેટલી હોય, તે સામાન્ય રીતે તમારા આગામી માસિકના લગભગ 14 દિવસ પહેલાં થાય છે.',
    tip1Title: 'જાણવા જેવું',
    tip1Text:
      'અંડોત્સર્જન અને માસિક આવવા વચ્ચેના સમય કરતાં, આગામી માસિકની તારીખ સ્ત્રીએ સ્ત્રીએ વધુ બદલાય છે.',
    body2:
      'કેટલાક શારીરિક સંકેતો અંડોત્સર્જન નજીક આવતાં સાથે જોવા મળી શકે છે, સ્ત્રી પ્રમાણે ઓછા-વત્તા અંશે.',
    visualTitle: 'વધુ પ્રવાહી ગર્ભાશયમુખનો સ્રાવ',
    visualText:
      'અંડોત્સર્જન નજીક આવતાં ગર્ભાશયમુખનો સ્રાવ વધુ સ્વચ્છ, ખેંચાય તેવો અને સ્થિતિસ્થાપક બને છે.',
    otherSigns: [
      'નીચલા પેટની એક બાજુ હળવો દુખાવો ("મિટલશ્મર્ત્સ")',
      'સ્તનમાં સંવેદનશીલતા',
      'અંડોત્સર્જન પછી બેઝલ શરીરના તાપમાનમાં હળવો વધારો',
      'કેટલીક સ્ત્રીઓમાં ઊર્જામાં વધારો',
    ],
    body3:
      'આ સંકેતોનું ઘણા ચક્રો સુધી અવલોકન કરવાથી તમે તમારી પોતાની લય ઓળખી શકો છો, જે સામાન્ય સરેરાશ કરતાં અલગ હોઈ શકે છે.',
    alertTitle: 'કૃપા કરીને નોંધો',
    alertText:
      'ક્યારેક અંડોત્સર્જન વિનાનું ચક્ર થઈ શકે છે, અને તે જરૂરી નથી કે ચિંતાનું કારણ હોય. જો તમારું માસિક લાંબા સમય સુધી ન આવે અથવા તમને ખાતરી ન હોય, તો તબીબી સલાહની ભલામણ છે.',
    tip2Title: 'જાણવા જેવું',
    tip2Text:
      'કોઈ એક સંકેત એકલો પૂર્ણપણે વિશ્વસનીય નથી: તેમને ભેગા કરવાથી તમારા સૌથી ફળદ્રુપ સમયનો વધુ સારો અંદાજ મળે છે.',
    shareMessage: 'અંડોત્સર્જનને સમજવું — AWA',
  },
  pa: {
    badge: 'ਓਵੂਲੇਸ਼ਨ',
    title: 'ਓਵੂਲੇਸ਼ਨ ਨੂੰ\nਸਮਝੋ',
    metaDuration: '6 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਤੁਹਾਡੇ ਚੱਕਰ ਦਾ ਅਹਿਮ ਪਲ, ਅਤੇ ਇਸ ਨੂੰ ਕਿਵੇਂ ਪਛਾਣਨਾ ਹੈ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਓਵੂਲੇਸ਼ਨ ਕੀ ਹੈ?',
      'ਇਸ ਦੇ ਨਾਲ ਆ ਸਕਣ ਵਾਲੇ ਸੰਕੇਤ',
      'ਆਪਣੀ ਲੈਅ ਨੂੰ ਪਛਾਣਨਾ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    body1:
      'ਓਵੂਲੇਸ਼ਨ (ਅੰਡਾ ਨਿਕਲਣਾ) ਦਾ ਮਤਲਬ ਹੈ ਕਿਸੇ ਇੱਕ ਅੰਡਕੋਸ਼ ਵੱਲੋਂ ਅੰਡੇ ਦਾ ਛੱਡਿਆ ਜਾਣਾ। ਇਹ ਆਮ ਤੌਰ \'ਤੇ ਤੁਹਾਡੀ ਅਗਲੀ ਮਾਹਵਾਰੀ ਤੋਂ ਲਗਭਗ 14 ਦਿਨ ਪਹਿਲਾਂ ਹੁੰਦਾ ਹੈ, ਭਾਵੇਂ ਤੁਹਾਡੇ ਚੱਕਰ ਦੀ ਕੁੱਲ ਲੰਬਾਈ ਕੁਝ ਵੀ ਹੋਵੇ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text:
      'ਹਰ ਔਰਤ ਵਿੱਚ ਅਗਲੀ ਮਾਹਵਾਰੀ ਦੀ ਤਾਰੀਖ਼ ਹੀ ਬਦਲਦੀ ਹੈ, ਓਵੂਲੇਸ਼ਨ ਅਤੇ ਇਸ ਦੇ ਆਉਣ ਵਿਚਕਾਰ ਦੇ ਸਮੇਂ ਨਾਲੋਂ ਕਿਤੇ ਵੱਧ।',
    body2:
      'ਕੁਝ ਸਰੀਰਕ ਸੰਕੇਤ ਓਵੂਲੇਸ਼ਨ ਦੇ ਨੇੜੇ ਆਉਣ ਦੇ ਨਾਲ ਹੋ ਸਕਦੇ ਹਨ, ਜੋ ਔਰਤ ਮੁਤਾਬਕ ਵੱਧ-ਘੱਟ ਹੁੰਦੇ ਹਨ।',
    visualTitle: 'ਵਧੇਰੇ ਤਰਲ ਰਿਸਾਅ',
    visualText:
      'ਜਿਵੇਂ-ਜਿਵੇਂ ਓਵੂਲੇਸ਼ਨ ਨੇੜੇ ਆਉਂਦਾ ਹੈ, ਬੱਚੇਦਾਨੀ ਦੇ ਮੂੰਹ ਦਾ ਰਿਸਾਅ ਵਧੇਰੇ ਸਾਫ਼, ਲਚਕੀਲਾ ਅਤੇ ਖਿੱਚਣ ਯੋਗ ਹੋ ਜਾਂਦਾ ਹੈ।',
    otherSigns: [
      'ਹੇਠਲੇ ਪੇਟ ਦੇ ਇੱਕ ਪਾਸੇ ਹਲਕਾ ਦਰਦ ("ਮਿਟੇਲਸ਼ਮਰਟਸ")',
      'ਛਾਤੀਆਂ ਵਿੱਚ ਨਰਮੀ ਜਾਂ ਦਰਦ',
      'ਓਵੂਲੇਸ਼ਨ ਤੋਂ ਬਾਅਦ ਆਰਾਮ ਵੇਲੇ ਦੇ ਸਰੀਰਕ ਤਾਪਮਾਨ ਵਿੱਚ ਹਲਕਾ ਵਾਧਾ',
      'ਕੁਝ ਔਰਤਾਂ ਵਿੱਚ ਊਰਜਾ ਦਾ ਵਧਣਾ',
    ],
    body3:
      'ਕਈ ਚੱਕਰਾਂ ਦੌਰਾਨ ਇਨ੍ਹਾਂ ਸੰਕੇਤਾਂ ਨੂੰ ਦੇਖਣ ਨਾਲ ਤੁਸੀਂ ਆਪਣੀ ਲੈਅ ਨੂੰ ਜਾਣ ਸਕਦੇ ਹੋ, ਜੋ ਆਮ ਔਸਤਾਂ ਤੋਂ ਵੱਖ ਹੋ ਸਕਦੀ ਹੈ।',
    alertTitle: 'ਕਿਰਪਾ ਕਰਕੇ ਧਿਆਨ ਦਿਓ',
    alertText:
      'ਓਵੂਲੇਸ਼ਨ ਤੋਂ ਬਿਨਾਂ ਚੱਕਰ ਕਦੇ-ਕਦੇ ਹੋ ਸਕਦਾ ਹੈ, ਅਤੇ ਇਹ ਜ਼ਰੂਰੀ ਨਹੀਂ ਕਿ ਚਿੰਤਾ ਦਾ ਕਾਰਨ ਹੋਵੇ। ਜੇ ਤੁਹਾਡੀ ਮਾਹਵਾਰੀ ਲੰਮੇ ਸਮੇਂ ਤੱਕ ਨਾ ਆਵੇ ਜਾਂ ਤੁਹਾਨੂੰ ਯਕੀਨ ਨਾ ਹੋਵੇ, ਤਾਂ ਡਾਕਟਰੀ ਸਲਾਹ ਲੈਣ ਦੀ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।',
    tip2Title: 'ਜਾਣਨ ਯੋਗ',
    tip2Text:
      'ਕੋਈ ਇੱਕ ਸੰਕੇਤ ਇਕੱਲਾ ਪੂਰੀ ਤਰ੍ਹਾਂ ਭਰੋਸੇਯੋਗ ਨਹੀਂ ਹੁੰਦਾ: ਉਨ੍ਹਾਂ ਨੂੰ ਮਿਲਾ ਕੇ ਦੇਖਣ ਨਾਲ ਤੁਹਾਡੇ ਸਭ ਤੋਂ ਉਪਜਾਊ ਸਮੇਂ ਦਾ ਬਿਹਤਰ ਅੰਦਾਜ਼ਾ ਮਿਲਦਾ ਹੈ।',
    shareMessage: 'ਓਵੂਲੇਸ਼ਨ ਨੂੰ ਸਮਝੋ — AWA',
  },
  my: {
    badge: 'မျိုးဥကြွေခြင်း',
    title: 'မျိုးဥကြွေခြင်းကို\nနားလည်ခြင်း',
    metaDuration: 'ဖတ်ချိန် 6 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'သင့်ရာသီစက်ဝန်း၏ အဓိကအချိန်နှင့် ၎င်းကို မည်သို့ သိရှိနိုင်သနည်း။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'မျိုးဥကြွေခြင်းဆိုသည်မှာ အဘယ်နည်း။',
      'အတူတကွ ဖြစ်ပေါ်နိုင်သော လက္ခဏာများ',
      'သင့်ကိုယ်ပိုင်စည်းချက်ကို သိရှိခြင်း',
      'အဓိကအချက်များ',
    ],
    body1:
      'မျိုးဥကြွေခြင်းဆိုသည်မှာ သားဥအိမ်တစ်ခုမှ မျိုးဥ ထွက်လာခြင်းဖြစ်သည်။ သင့်ရာသီစက်ဝန်း၏ စုစုပေါင်းအရှည်မည်သို့ပင်ရှိစေ၊ ၎င်းသည် များသောအားဖြင့် သင့်နောက်ရာသီမလာမီ 14 ရက်ခန့်တွင် ဖြစ်ပေါ်သည်။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text:
      'မျိုးဥကြွေခြင်းနှင့် ရာသီရောက်ရှိခြင်းကြား အချိန်ထက် သင့်နောက်ရာသီလာမည့်ရက်စွဲသည် အမျိုးသမီးတစ်ဦးနှင့်တစ်ဦး အများကြီး ကွဲပြားသည်။',
    body2:
      'အချို့သော ခန္ဓာကိုယ်လက္ခဏာများသည် အမျိုးသမီးအလိုက် ကွဲပြားသော အတိုင်းအတာဖြင့် မျိုးဥကြွေချိန် နီးကပ်လာသည်နှင့်အတူ ဖြစ်ပေါ်နိုင်သည်။',
    visualTitle: 'ပိုပျော့ပျောင်းသော သားအိမ်ခေါင်းအချွဲ',
    visualText:
      'မျိုးဥကြွေချိန် နီးကပ်လာသည်နှင့်အမျှ သားအိမ်ခေါင်းအချွဲသည် ပိုကြည်လင်လာပြီး ပိုဆန့်လာကာ ပိုပျော့ပျောင်းလာသည်။',
    otherSigns: [
      'အောက်ဗိုက်တစ်ဖက်တွင် ပေါ့ပါးသော နာကျင်မှု ("mittelschmerz")',
      'ရင်သားနာကျင်ခြင်း',
      'မျိုးဥကြွေပြီးနောက် အခြေခံ ကိုယ်အပူချိန် အနည်းငယ်တက်ခြင်း',
      'အမျိုးသမီးအချို့တွင် စွမ်းအင် တက်ကြွလာခြင်း',
    ],
    body3:
      'ဤလက္ခဏာများကို ရာသီစက်ဝန်းများစွာတွင် လေ့လာခြင်းက ယေဘုယျပျမ်းမျှတန်ဖိုးများနှင့် ကွဲပြားနိုင်သော သင့်ကိုယ်ပိုင်စည်းချက်ကို သိရှိစေသည်။',
    alertTitle: 'ကျေးဇူးပြု၍ သတိပြုပါ',
    alertText:
      'မျိုးဥမကြွေသော ရာသီစက်ဝန်းသည် တခါတရံ ဖြစ်နိုင်ပြီး ၎င်းသည် စိုးရိမ်ရန် အကြောင်းရင်းဖြစ်ရန် မလိုပါ။ သင့်ရာသီ ကြာရှည်စွာ မလာလျှင် သို့မဟုတ် မသေချာလျှင် ဆေးဘက်ဆိုင်ရာ အကြံဉာဏ်ကို အကြံပြုသည်။',
    tip2Title: 'သိထားသင့်သည်',
    tip2Text:
      'မည်သည့်လက္ခဏာတစ်ခုမျှ သူ့ဘာသာ လုံးဝယုံကြည်စိတ်ချရခြင်းမရှိပါ- ၎င်းတို့ကို ပေါင်းစပ်ခြင်းက သင့်သန္ဓေတည်လွယ်ဆုံးအချိန်ကို ပိုကောင်းစွာ သိစေသည်။',
    shareMessage: 'မျိုးဥကြွေခြင်းကို နားလည်ခြင်း — AWA',
  },
  km: {
    badge: 'ការបញ្ចេញពងអូវុល',
    title: 'ការយល់ដឹងអំពី\nការបញ្ចេញពងអូវុល',
    metaDuration: 'អាន 6 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'ពេលវេលាសំខាន់នៃវដ្តរដូវរបស់អ្នក និងរបៀបស្គាល់វា។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ការបញ្ចេញពងអូវុលជាអ្វី?',
      'សញ្ញាដែលអាចកើតមានជាមួយ',
      'ការស្គាល់ចង្វាក់ផ្ទាល់ខ្លួនរបស់អ្នក',
      'ចំណុចសំខាន់ៗ',
    ],
    body1:
      'ការបញ្ចេញពងអូវុលគឺជាការបញ្ចេញពងមួយដោយពងអូវែមួយ។ ជាធម្មតាវាកើតឡើងប្រហែល 14 ថ្ងៃមុនរដូវបន្ទាប់របស់អ្នក ដោយមិនគិតពីរយៈពេលសរុបនៃវដ្តរដូវរបស់អ្នកឡើយ។',
    tip1Title: 'គួរដឹង',
    tip1Text:
      'កាលបរិច្ឆេទនៃរដូវបន្ទាប់របស់អ្នកទេដែលខុសគ្នាពីស្ត្រីម្នាក់ទៅម្នាក់ ច្រើនជាងរយៈពេលរវាងការបញ្ចេញពងអូវុល និងការមកដល់នៃរដូវ។',
    body2:
      'សញ្ញារាងកាយមួយចំនួនអាចកើតមានជាមួយនឹងការខិតជិតនៃការបញ្ចេញពងអូវុល ក្នុងកម្រិតខុសៗគ្នាអាស្រ័យលើស្ត្រីម្នាក់ៗ។',
    visualTitle: 'ទឹករំអិលមាត់ស្បូនកាន់តែរាវ',
    visualText:
      'នៅពេលការបញ្ចេញពងអូវុលខិតជិត ទឹករំអិលមាត់ស្បូនកាន់តែថ្លា កាន់តែលាតបាន និងកាន់តែយឺត។',
    otherSigns: [
      'ការឈឺស្រាលៗនៅម្ខាងនៃផ្នែកខាងក្រោមពោះ ("mittelschmerz")',
      'ការឈឺដោះ',
      'សីតុណ្ហភាពរាងកាយមូលដ្ឋានកើនឡើងបន្តិចក្រោយការបញ្ចេញពងអូវុល',
      'ថាមពលកើនឡើងចំពោះស្ត្រីមួយចំនួន',
    ],
    body3:
      'ការសង្កេតសញ្ញាទាំងនេះក្នុងរយៈពេលជាច្រើនវដ្តរដូវ ជួយឲ្យអ្នកស្គាល់ចង្វាក់ផ្ទាល់ខ្លួន ដែលអាចខុសពីមធ្យមភាគទូទៅ។',
    alertTitle: 'សូមកត់សម្គាល់',
    alertText:
      'វដ្តរដូវដែលគ្មានការបញ្ចេញពងអូវុលអាចកើតឡើងម្តងម្កាល ដោយមិនចាំបាច់ជាមូលហេតុដែលគួរព្រួយបារម្ភទេ។ ប្រសិនបើអ្នកអត់មានរដូវយូរ ឬមិនប្រាកដ ត្រូវបានណែនាំឲ្យសុំដំបូន្មានវេជ្ជសាស្ត្រ។',
    tip2Title: 'គួរដឹង',
    tip2Text:
      'គ្មានសញ្ញាតែមួយណាអាចទុកចិត្តបានទាំងស្រុងដោយខ្លួនឯងឡើយ៖ ការផ្សំសញ្ញាទាំងនេះផ្តល់គំនិតកាន់តែប្រសើរអំពីពេលដែលអ្នកមានកូនងាយបំផុត។',
    shareMessage: 'ការយល់ដឹងអំពីការបញ្ចេញពងអូវុល — AWA',
  },
  lo: {
    badge: 'ການຕົກໄຂ່',
    title: 'ເຂົ້າໃຈ\nການຕົກໄຂ່',
    metaDuration: 'ອ່ານ 6 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ຊ່ວງເວລາສຳຄັນຂອງຮອບເດືອນ ແລະ ວິທີຮັບຮູ້ມັນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ການຕົກໄຂ່ແມ່ນຫຍັງ?',
      'ສັນຍານທີ່ອາດເກີດຂຶ້ນພ້ອມກັນ',
      'ການຮັບຮູ້ຈັງຫວະຂອງຕົນເອງ',
      'ຈຸດສຳຄັນ',
    ],
    body1:
      'ການຕົກໄຂ່ແມ່ນການປ່ອຍໄຂ່ຈາກຮັງໄຂ່ຂ້າງໃດຂ້າງໜຶ່ງ. ໂດຍປົກກະຕິເກີດຂຶ້ນປະມານ 14 ວັນກ່ອນມີປະຈຳເດືອນຄັ້ງຕໍ່ໄປ, ບໍ່ວ່າຮອບເດືອນຂອງທ່ານຈະຍາວເທົ່າໃດ.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text:
      'ວັນທີ່ປະຈຳເດືອນຄັ້ງຕໍ່ໄປມາແມ່ນສິ່ງທີ່ແຕກຕ່າງກັນໃນແຕ່ລະຄົນ, ຫຼາຍກວ່າເວລາລະຫວ່າງການຕົກໄຂ່ກັບການມາຂອງປະຈຳເດືອນ.',
    body2:
      'ສັນຍານທາງຮ່າງກາຍບາງຢ່າງອາດເກີດຂຶ້ນພ້ອມກັບການໃກ້ຕົກໄຂ່, ໃນລະດັບທີ່ແຕກຕ່າງກັນຕາມແຕ່ລະຄົນ.',
    visualTitle: 'ເມືອກປາກມົດລູກທີ່ໄຫຼລື່ນຂຶ້ນ',
    visualText:
      'ເມື່ອໃກ້ການຕົກໄຂ່, ເມືອກປາກມົດລູກຈະໃສຂຶ້ນ, ຍືດໄດ້ຫຼາຍຂຶ້ນ ແລະ ມີຄວາມຢືດຢຸ່ນ.',
    otherSigns: [
      'ອາການເຈັບເບົາໆຂ້າງໃດຂ້າງໜຶ່ງຂອງທ້ອງນ້ອຍ ("mittelschmerz")',
      'ອາການເຈັບເຕົ້ານົມເວລາຖືກສຳຜັດ',
      'ອຸນຫະພູມຮ່າງກາຍພື້ນຖານສູງຂຶ້ນເລັກນ້ອຍຫຼັງການຕົກໄຂ່',
      'ມີພະລັງງານເພີ່ມຂຶ້ນໃນຜູ້ຍິງບາງຄົນ',
    ],
    body3:
      'ການສັງເກດສັນຍານເຫຼົ່ານີ້ຕະຫຼອດຫຼາຍຮອບເດືອນຊ່ວຍໃຫ້ທ່ານຮູ້ຈັກຈັງຫວະຂອງຕົນເອງ, ເຊິ່ງອາດແຕກຕ່າງຈາກຄ່າສະເລ່ຍທົ່ວໄປ.',
    alertTitle: 'ກະລຸນາສັງເກດ',
    alertText:
      'ບາງຄັ້ງຮອບເດືອນທີ່ບໍ່ມີການຕົກໄຂ່ກໍອາດເກີດຂຶ້ນ, ໂດຍບໍ່ຈຳເປັນຕ້ອງເປັນສາເຫດຂອງຄວາມກັງວົນ. ຖ້າປະຈຳເດືອນຂາດໄປດົນ ຫຼື ທ່ານບໍ່ແນ່ໃຈ, ແນະນຳໃຫ້ຂໍຄຳແນະນຳທາງການແພດ.',
    tip2Title: 'ຄວນຮູ້',
    tip2Text:
      'ບໍ່ມີສັນຍານດຽວທີ່ເຊື່ອຖືໄດ້ຢ່າງສົມບູນດ້ວຍຕົວມັນເອງ: ການລວມສັນຍານເຂົ້າກັນໃຫ້ພາບທີ່ດີກວ່າກ່ຽວກັບຊ່ວງເວລາທີ່ມີໂອກາດຕັ້ງຄັນສູງສຸດຂອງທ່ານ.',
    shareMessage: 'ເຂົ້າໃຈການຕົກໄຂ່ — AWA',
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
