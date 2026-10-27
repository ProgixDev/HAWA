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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'conceptiontips-hygiene-de-vie';

const HERO = require('../../assets/images/library/spm-yoga.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const SUPPORTIVE_HABITS_ICONS = [
  'bowl-mix-outline',
  'shoe-sneaker',
  'weather-night',
  'meditation',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('ConceptionLifestyle', {
  fr: {
    badge: 'MODE DE VIE',
    title: 'Mode de vie et\nparcours de conception',
    metaDuration: '5 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Des habitudes simples qui peuvent accompagner ton parcours, sans pression.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Ce qui peut soutenir la fertilité',
      'Le stress, un facteur à ne pas négliger',
      'Ce qu’il vaut mieux limiter',
      'À retenir',
    ],
    body1: 'Certaines habitudes de vie simples peuvent accompagner un parcours de conception, sans garantir de résultat à elles seules.',
    supportiveHabits: [
      'Une alimentation équilibrée',
      'Une activité physique modérée',
      'Un sommeil de qualité',
      'Des moments de détente',
    ],
    body2: 'Le stress chronique peut influencer l’équilibre hormonal et, chez certaines femmes, la régularité du cycle. Se préserver des moments de calme fait pleinement partie du parcours.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Vouloir « tout bien faire » peut lui-même devenir une source de stress : viser des habitudes globalement saines suffit, sans perfectionnisme.',
    toLimit: [
      'Le tabac, qui peut affecter la fertilité des deux partenaires',
      'Une consommation excessive d’alcool',
      'Un entraînement sportif intense et prolongé, qui peut à l’inverse freiner la fertilité',
      'Le sucre raffiné en excès, qui peut perturber l’équilibre hormonal',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Des habitudes globalement équilibrées, sans excès ni perfectionnisme, sont le meilleur accompagnement au quotidien.',
    shareMessage: 'Mode de vie et parcours de conception — AWA',
  },
  en: {
    badge: 'LIFESTYLE',
    title: 'Lifestyle habits and\nyour conception journey',
    metaDuration: '5 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Simple habits that can support your journey — no pressure.',
    contentsTitle: 'In this article',
    topics: [
      'What can support fertility',
      'Stress, a factor not to overlook',
      'What’s best to limit',
      'Key takeaway',
    ],
    body1: 'Some simple lifestyle habits can support a conception journey, though they can’t guarantee a result on their own.',
    supportiveHabits: [
      'A balanced diet',
      'Moderate physical activity',
      'Quality sleep',
      'Moments of relaxation',
    ],
    body2: 'Chronic stress can affect hormonal balance and, in some women, cycle regularity. Giving yourself moments of calm is fully part of the journey.',
    tip1Title: 'Good to know',
    tip1Text: 'Wanting to “do everything right” can itself become a source of stress: aiming for generally healthy habits is enough, without perfectionism.',
    toLimit: [
      'Smoking, which may affect fertility in both partners',
      'Excessive alcohol consumption',
      'Intense, prolonged athletic training, which may conversely slow fertility',
      'Excess refined sugar, which may disrupt hormonal balance',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Generally balanced habits, without excess or perfectionism, are the best everyday support.',
    shareMessage: 'Lifestyle habits and conception journey — AWA',
  },
  es: {
    badge: 'ESTILO DE VIDA',
    title: 'Estilo de vida y\ntu camino hacia la concepción',
    metaDuration: '5 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Hábitos sencillos que pueden acompañar tu camino, sin presión.',
    contentsTitle: 'En este artículo',
    topics: [
      'Lo que puede favorecer la fertilidad',
      'El estrés, un factor que no hay que descuidar',
      'Lo que es mejor limitar',
      'Para recordar',
    ],
    body1: 'Algunos hábitos de vida sencillos pueden acompañar un camino hacia la concepción, aunque no garantizan un resultado por sí solos.',
    supportiveHabits: [
      'Una alimentación equilibrada',
      'Una actividad física moderada',
      'Un sueño de calidad',
      'Momentos de relajación',
    ],
    body2: 'El estrés crónico puede influir en el equilibrio hormonal y, en algunas mujeres, en la regularidad del ciclo. Reservarte momentos de calma forma plenamente parte del camino.',
    tip1Title: 'Dato útil',
    tip1Text: 'Querer «hacerlo todo bien» puede convertirse en sí mismo en una fuente de estrés: basta con apuntar a hábitos globalmente saludables, sin perfeccionismo.',
    toLimit: [
      'El tabaco, que puede afectar la fertilidad de ambos miembros de la pareja',
      'Un consumo excesivo de alcohol',
      'Un entrenamiento deportivo intenso y prolongado, que por el contrario puede frenar la fertilidad',
      'El azúcar refinado en exceso, que puede alterar el equilibrio hormonal',
    ],
    tip2Title: 'Dato útil',
    tip2Text: 'Unos hábitos globalmente equilibrados, sin excesos ni perfeccionismo, son el mejor acompañamiento en el día a día.',
    shareMessage: 'Estilo de vida y camino hacia la concepción — AWA',
  },
  it: {
    badge: 'STILE DI VITA',
    title: 'Abitudini di vita e\nil tuo percorso verso il concepimento',
    metaDuration: '5 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Semplici abitudini che possono sostenere il tuo percorso, senza alcuna pressione.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Cosa può sostenere la fertilità',
      'Lo stress, un fattore da non trascurare',
      'Cosa è meglio limitare',
      'Il punto chiave',
    ],
    body1: 'Alcune semplici abitudini di vita possono sostenere un percorso verso il concepimento, anche se da sole non possono garantire un risultato.',
    supportiveHabits: [
      'Un’alimentazione equilibrata',
      'Un’attività fisica moderata',
      'Un sonno di qualità',
      'Momenti di relax',
    ],
    body2: 'Lo stress cronico può influire sull’equilibrio ormonale e, in alcune donne, sulla regolarità del ciclo. Concederti momenti di calma fa pienamente parte del percorso.',
    tip1Title: 'Da sapere',
    tip1Text: 'Voler «fare tutto bene» può diventare a sua volta una fonte di stress: basta puntare ad abitudini sane in generale, senza perfezionismo.',
    toLimit: [
      'Il fumo, che può influire sulla fertilità di entrambi i partner',
      'Il consumo eccessivo di alcol',
      'Un allenamento sportivo intenso e prolungato, che al contrario può rallentare la fertilità',
      'L’eccesso di zuccheri raffinati, che può alterare l’equilibrio ormonale',
    ],
    tip2Title: 'Da sapere',
    tip2Text: 'Abitudini nel complesso equilibrate, senza eccessi né perfezionismo, sono il miglior sostegno quotidiano.',
    shareMessage: 'Abitudini di vita e percorso verso il concepimento — AWA',
  },
  tr: {
    badge: 'YAŞAM TARZI',
    title: 'Yaşam alışkanlıkları ve\nhamile kalma yolculuğun',
    metaDuration: '5 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Yolculuğuna destek olabilecek basit alışkanlıklar — hiçbir baskı olmadan.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Doğurganlığı neler destekleyebilir',
      'Stres, göz ardı edilmemesi gereken bir etken',
      'Neleri sınırlamak daha iyi',
      'Önemli nokta',
    ],
    body1: 'Bazı basit yaşam alışkanlıkları hamile kalma yolculuğuna destek olabilir, ancak tek başlarına bir sonucu garanti edemez.',
    supportiveHabits: [
      'Dengeli beslenme',
      'Ölçülü fiziksel aktivite',
      'Kaliteli uyku',
      'Rahatlama anları',
    ],
    body2: 'Kronik stres hormonal dengeyi ve bazı kadınlarda döngü düzenini etkileyebilir. Kendine sakin anlar tanımak yolculuğun tam da bir parçasıdır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: '“Her şeyi doğru yapmak” istemek de başlı başına bir stres kaynağı olabilir: genel olarak sağlıklı alışkanlıkları hedeflemek yeterlidir, mükemmeliyetçiliğe gerek yok.',
    toLimit: [
      'Her iki partnerde de doğurganlığı etkileyebilen sigara',
      'Aşırı alkol tüketimi',
      'Doğurganlığı tam tersine yavaşlatabilen yoğun ve uzun süreli sporcu antrenmanı',
      'Hormonal dengeyi bozabilen aşırı rafine şeker',
    ],
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Aşırıya kaçmayan ve mükemmeliyetçilikten uzak, genel olarak dengeli alışkanlıklar günlük hayatta en iyi destektir.',
    shareMessage: 'Yaşam alışkanlıkları ve hamile kalma yolculuğu — AWA',
  },
  ru: {
    badge: 'ОБРАЗ ЖИЗНИ',
    title: 'Привычки образа жизни и\nпуть к зачатию',
    metaDuration: '5 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Простые привычки, которые могут поддержать вас на этом пути, — без давления.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что может поддерживать фертильность',
      'Стресс — фактор, который нельзя упускать из виду',
      'Что лучше ограничить',
      'Главное',
    ],
    body1: 'Некоторые простые привычки образа жизни могут поддерживать путь к зачатию, хотя сами по себе не могут гарантировать результат.',
    supportiveHabits: [
      'Сбалансированное питание',
      'Умеренная физическая активность',
      'Качественный сон',
      'Моменты расслабления',
    ],
    body2: 'Хронический стресс может влиять на гормональный баланс и у некоторых женщин — на регулярность цикла. Позволять себе моменты спокойствия — полноценная часть этого пути.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Желание «сделать всё правильно» само по себе может стать источником стресса: достаточно стремиться к здоровым в целом привычкам, без перфекционизма.',
    toLimit: [
      'Курение, которое может влиять на фертильность обоих партнёров',
      'Чрезмерное употребление алкоголя',
      'Интенсивные и длительные спортивные тренировки, которые, напротив, могут снижать фертильность',
      'Избыток рафинированного сахара, который может нарушать гормональный баланс',
    ],
    tip2Title: 'Полезно знать',
    tip2Text: 'Привычки, в целом сбалансированные, без излишеств и перфекционизма, — лучшая повседневная поддержка.',
    shareMessage: 'Привычки образа жизни и путь к зачатию — AWA',
  },
  de: {
    badge: 'LEBENSSTIL',
    title: 'Lebensstil und\ndein Weg zum Wunschkind',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Einfache Gewohnheiten, die dich auf deinem Weg unterstützen können – ganz ohne Druck.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was die Fruchtbarkeit unterstützen kann',
      'Stress – ein Faktor, den man nicht übersehen sollte',
      'Was du besser einschränken solltest',
      'Das Wichtigste in Kürze',
    ],
    body1: 'Einige einfache Lebensgewohnheiten können deinen Weg zur Schwangerschaft unterstützen, ein Ergebnis garantieren sie für sich allein jedoch nicht.',
    supportiveHabits: [
      'Eine ausgewogene Ernährung',
      'Moderate körperliche Aktivität',
      'Erholsamer Schlaf',
      'Momente der Entspannung',
    ],
    body2: 'Chronischer Stress kann das hormonelle Gleichgewicht und bei manchen Frauen die Regelmäßigkeit des Zyklus beeinflussen. Dir Momente der Ruhe zu gönnen, gehört ganz selbstverständlich zu diesem Weg.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Alles „richtig machen“ zu wollen, kann selbst zur Stressquelle werden: Es genügt, auf insgesamt gesunde Gewohnheiten zu achten – ohne Perfektionismus.',
    toLimit: [
      'Rauchen, das die Fruchtbarkeit beider Partner beeinträchtigen kann',
      'Übermäßiger Alkoholkonsum',
      'Intensives, langanhaltendes sportliches Training, das die Fruchtbarkeit umgekehrt sogar bremsen kann',
      'Zu viel raffinierter Zucker, der das hormonelle Gleichgewicht stören kann',
    ],
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Insgesamt ausgewogene Gewohnheiten, ohne Übertreibung und Perfektionismus, sind die beste Unterstützung im Alltag.',
    shareMessage: 'Lebensstil und dein Weg zum Wunschkind – AWA',
  },
  zh: {
      badge: '生活方式',
      title: '生活习惯与\n你的备孕之路',
      metaDuration: '阅读约 5 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '一些简单的习惯，可以为你的备孕之路提供支持，不必有任何压力。',
      contentsTitle: '本文内容',
      topics: [
        '哪些习惯有助于生育力',
        '压力，不容忽视的因素',
        '最好少碰的东西',
        '核心要点',
      ],
      body1: '一些简单的生活习惯可以为备孕提供支持，不过仅凭它们并不能保证结果。',
      supportiveHabits: [
        '均衡饮食',
        '适度的运动',
        '高质量的睡眠',
        '放松的时刻',
      ],
      body2: '长期的压力可能影响激素平衡，在一些女性身上还可能影响周期的规律性。给自己一些平静的时刻，本身就是备孕之路的一部分。',
      tip1Title: '小贴士',
      tip1Text: '想要“样样都做到最好”，本身也可能成为压力的来源：保持总体健康的习惯就足够了，不必追求完美。',
      toLimit: [
        '吸烟，可能影响双方的生育力',
        '过量饮酒',
        '强度大、持续时间长的运动训练，反而可能让生育力下降',
        '过多的精制糖，可能扰乱激素平衡',
      ],
      tip2Title: '小贴士',
      tip2Text: '总体均衡、不过度也不追求完美的习惯，是日常里最好的支持。',
      shareMessage: '生活习惯与备孕之路 — AWA',
    },
  id: {
    badge: 'GAYA HIDUP',
    title: 'Kebiasaan gaya hidup dan\nperjalanan program hamilmu',
    metaDuration: '5 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Kebiasaan sederhana yang dapat mendukung perjalananmu — tanpa tekanan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Yang dapat mendukung kesuburan',
      'Stres, faktor yang tidak boleh diabaikan',
      'Yang sebaiknya dibatasi',
      'Poin penting',
    ],
    body1: 'Beberapa kebiasaan gaya hidup yang sederhana dapat mendukung perjalanan program hamil, meski tidak bisa menjamin hasil dengan sendirinya.',
    supportiveHabits: [
      'Pola makan seimbang',
      'Aktivitas fisik yang sedang',
      'Tidur berkualitas',
      'Momen relaksasi',
    ],
    body2: 'Stres kronis dapat memengaruhi keseimbangan hormon dan, pada sebagian perempuan, keteraturan siklus. Memberi dirimu momen tenang adalah bagian penting dari perjalanan ini.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Keinginan untuk “melakukan segalanya dengan benar” bisa menjadi sumber stres tersendiri: cukup upayakan kebiasaan yang secara umum sehat, tanpa perfeksionisme.',
    toLimit: [
      'Merokok, yang dapat memengaruhi kesuburan pada kedua pasangan',
      'Konsumsi alkohol berlebihan',
      'Latihan atletik yang intens dan berkepanjangan, yang justru dapat memperlambat kesuburan',
      'Gula rafinasi berlebihan, yang dapat mengganggu keseimbangan hormon',
    ],
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Kebiasaan yang secara umum seimbang, tanpa berlebihan atau perfeksionisme, adalah dukungan terbaik sehari-hari.',
    shareMessage: 'Kebiasaan gaya hidup dan perjalanan program hamil — AWA',
  },
  hi: {
    badge: 'जीवनशैली',
    title: 'जीवनशैली की आदतें और\nआपका गर्भधारण का सफ़र',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'लेख',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'सरल आदतें जो आपके सफ़र में मददगार हो सकती हैं — बिना किसी दबाव के।',
    contentsTitle: 'इस लेख में',
    topics: [
      'प्रजनन क्षमता में क्या मदद कर सकता है',
      'तनाव, जिसे अनदेखा नहीं करना चाहिए',
      'किन चीज़ों को कम करना बेहतर है',
      'मुख्य बात',
    ],
    body1: 'जीवनशैली की कुछ सरल आदतें गर्भधारण के सफ़र में मदद कर सकती हैं, हालाँकि वे अकेले किसी नतीजे की गारंटी नहीं दे सकतीं।',
    supportiveHabits: [
      'संतुलित आहार',
      'मध्यम शारीरिक गतिविधि',
      'अच्छी नींद',
      'आराम और सुकून के पल',
    ],
    body2: 'लंबे समय का तनाव हार्मोन के संतुलन को और कुछ महिलाओं में चक्र की नियमितता को प्रभावित कर सकता है। खुद को सुकून के पल देना भी इस सफ़र का पूरा हिस्सा है।',
    tip1Title: 'जानना अच्छा है',
    tip1Text: '"सब कुछ सही करने" की चाह खुद एक तनाव बन सकती है: आम तौर पर सेहतमंद आदतें अपनाना काफ़ी है, बिना हर बात में परफ़ेक्ट होने की कोशिश के।',
    toLimit: [
      'धूम्रपान, जो दोनों साथियों की प्रजनन क्षमता को प्रभावित कर सकता है',
      'ज़रूरत से ज़्यादा शराब का सेवन',
      'तीव्र और लंबी खेल-ट्रेनिंग, जो उलटे प्रजनन क्षमता को धीमा कर सकती है',
      'ज़्यादा रिफ़ाइंड चीनी, जो हार्मोन के संतुलन को बिगाड़ सकती है',
    ],
    tip2Title: 'जानना अच्छा है',
    tip2Text: 'बिना अति और बिना परफ़ेक्शनिज़्म के, आम तौर पर संतुलित आदतें रोज़मर्रा का सबसे अच्छा सहारा हैं।',
    shareMessage: 'जीवनशैली की आदतें और गर्भधारण का सफ़र — AWA',
  },
  sq: {
    badge: 'MËNYRA E JETESËS',
    title: 'Zakonet e jetesës dhe\nrrugëtimi yt drejt shtatzënisë',
    metaDuration: '5 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Zakone të thjeshta që mund ta mbështesin rrugëtimin tënd, pa asnjë presion.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë mund ta mbështesë pjellorinë',
      'Stresi, një faktor që nuk duhet nënvlerësuar',
      'Çfarë është më mirë të kufizosh',
      'Çfarë të mbash mend',
    ],
    body1: 'Disa zakone të thjeshta të jetesës mund ta mbështesin rrugëtimin drejt shtatzënisë, por nuk mund ta garantojnë vetë një rezultat.',
    supportiveHabits: [
      'Një ushqim i ekuilibruar',
      'Aktivitet fizik i moderuar',
      'Gjumë cilësor',
      'Çaste çlodhjeje',
    ],
    body2: 'Stresi kronik mund të ndikojë në ekuilibrin hormonal dhe, te disa gra, në rregullsinë e ciklit. Të japësh vetes çaste qetësie është plotësisht pjesë e rrugëtimit.',
    tip1Title: 'Mirë është të dish',
    tip1Text: 'Dëshira për të “bërë gjithçka siç duhet” mund të bëhet vetë burim stresi: mjafton të synosh zakone përgjithësisht të shëndetshme, pa perfeksionizëm.',
    toLimit: [
      'Duhani, që mund ta ndikojë pjellorinë te të dy partnerët',
      'Konsumi i tepërt i alkoolit',
      'Stërvitja sportive intensive dhe e zgjatur, që përkundrazi mund ta ngadalësojë pjellorinë',
      'Sheqeri i rafinuar i tepërt, që mund ta çrregullojë ekuilibrin hormonal',
    ],
    tip2Title: 'Mirë është të dish',
    tip2Text: 'Zakonet përgjithësisht të ekuilibruara, pa teprime e pa perfeksionizëm, janë mbështetja më e mirë e përditshme.',
    shareMessage: 'Zakonet e jetesës dhe rrugëtimi drejt shtatzënisë — AWA',
  },
  ja: {
    badge: '生活習慣',
    title: '生活習慣と\n妊活の歩み',
    metaDuration: '読了時間5分',
    metaType: '記事',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '歩みを支えてくれる、シンプルな習慣。プレッシャーは不要です。',
    contentsTitle: 'この記事の内容',
    topics: [
      '妊娠しやすさを支えるもの',
      '見過ごせない要因、ストレス',
      '控えたほうがよいこと',
      '大切なポイント',
    ],
    body1: 'シンプルな生活習慣は妊活を支えてくれますが、それだけで結果を保証できるわけではありません。',
    supportiveHabits: [
      'バランスのよい食事',
      '適度な運動',
      '質のよい睡眠',
      'リラックスする時間',
    ],
    body2: '慢性的なストレスは、ホルモンバランスに影響することがあり、人によっては周期の規則性にも影響します。穏やかな時間を持つことも、妊活の大切な一部です。',
    tip1Title: '知っておきたいこと',
    tip1Text: '「すべてを完璧に」と思うこと自体が、ストレスの原因になることがあります。完璧を目指さず、全体として健やかな習慣を心がければ十分です。',
    toLimit: [
      '喫煙：パートナー双方の妊娠しやすさに影響するおそれがあります',
      '過度の飲酒',
      '激しく長時間にわたる運動トレーニング：かえって妊娠しにくくなるおそれがあります',
      '精製された糖分のとりすぎ：ホルモンバランスを乱すおそれがあります',
    ],
    tip2Title: '知っておきたいこと',
    tip2Text: 'やりすぎず、完璧を求めず、全体としてバランスのよい習慣を続けることが、日々の最良の支えになります。',
    shareMessage: '生活習慣と妊活の歩み — AWA',
  },
  ko: {
    badge: '생활 습관',
    title: '생활 습관과\n임신 준비 여정',
    metaDuration: '5분 읽기',
    metaType: '아티클',
    metaLevel: '초급',
    metaValidated: '검토된 콘텐츠',
    intro: '부담 없이 여정에 도움이 될 수 있는 간단한 습관이에요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '임신 가능성에 도움이 될 수 있는 것',
      '스트레스, 간과하면 안 되는 요인',
      '줄이는 것이 좋은 것',
      '핵심 정리',
    ],
    body1: '간단한 생활 습관은 임신 준비 여정에 도움이 될 수 있어요. 다만 그것만으로 결과를 보장할 수는 없어요.',
    supportiveHabits: [
      '균형 잡힌 식사',
      '적당한 신체 활동',
      '질 좋은 수면',
      '휴식하는 시간',
    ],
    body2: '만성 스트레스는 호르몬 균형에 영향을 줄 수 있고, 일부 여성에게는 주기의 규칙성에도 영향을 줄 수 있어요. 마음을 편안히 하는 시간을 갖는 것도 여정의 소중한 일부예요.',
    tip1Title: '알아 두세요',
    tip1Text: '“모든 것을 완벽하게 해야 한다”는 마음이 오히려 스트레스의 원인이 될 수 있어요. 전반적으로 건강한 습관을 목표로 하면 충분하고, 완벽할 필요는 없어요.',
    toLimit: [
      '흡연: 부부 모두의 임신 가능성에 영향을 줄 수 있어요',
      '지나친 음주',
      '강도 높은 운동을 오래 하는 것: 오히려 임신 가능성을 낮출 수 있어요',
      '정제당 과다 섭취: 호르몬 균형을 흐트러뜨릴 수 있어요',
    ],
    tip2Title: '알아 두세요',
    tip2Text: '지나침도 완벽주의도 없는, 전반적으로 균형 잡힌 습관이 일상에서 가장 좋은 도움이 돼요.',
    shareMessage: '생활 습관과 임신 준비 여정 — AWA',
  },
  'pt-PT': {
    badge: 'ESTILO DE VIDA',
    title: 'Hábitos de vida e\no seu percurso rumo à conceção',
    metaDuration: 'Leitura de 5 min',
    metaType: 'Artigo',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Hábitos simples que podem apoiar o seu percurso, sem pressão.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que pode apoiar a fertilidade',
      'O stress, um fator a não negligenciar',
      'O que é melhor limitar',
      'A reter',
    ],
    body1: 'Alguns hábitos de vida simples podem apoiar um percurso rumo à conceção, embora não possam garantir um resultado por si só.',
    supportiveHabits: [
      'Uma alimentação equilibrada',
      'Atividade física moderada',
      'Sono de qualidade',
      'Momentos de relaxamento',
    ],
    body2: 'O stress crónico pode afetar o equilíbrio hormonal e, em algumas mulheres, a regularidade do ciclo. Reservar momentos de calma faz inteiramente parte do percurso.',
    tip1Title: 'Bom saber',
    tip1Text: 'Querer “fazer tudo bem” pode tornar-se, por si só, uma fonte de stress: basta procurar hábitos globalmente saudáveis, sem perfeccionismo.',
    toLimit: [
      'O tabaco, que pode afetar a fertilidade em ambos os parceiros',
      'O consumo excessivo de álcool',
      'O treino desportivo intenso e prolongado, que pode, pelo contrário, reduzir a fertilidade',
      'O excesso de açúcar refinado, que pode perturbar o equilíbrio hormonal',
    ],
    tip2Title: 'Bom saber',
    tip2Text: 'Hábitos globalmente equilibrados, sem excessos nem perfeccionismo, são o melhor apoio no dia a dia.',
    shareMessage: 'Hábitos de vida e percurso rumo à conceção — AWA',
  },
  bn: {
    badge: 'জীবনযাপন',
    title: 'জীবনযাপনের অভ্যাস ও\nআপনার গর্ভধারণের যাত্রা',
    metaDuration: 'পড়তে 5 মিনিট',
    metaType: 'নিবন্ধ',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'সহজ কিছু অভ্যাস যা আপনার যাত্রায় সহায়ক হতে পারে, কোনো চাপ ছাড়াই।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'যা প্রজনন ক্ষমতাকে সহায়তা করতে পারে',
      'মানসিক চাপ, উপেক্ষা না করার মতো একটি কারণ',
      'যা সীমিত রাখাই ভালো',
      'মূল কথা',
    ],
    body1: 'জীবনযাপনের কিছু সহজ অভ্যাস গর্ভধারণের যাত্রায় সহায়ক হতে পারে, তবে এককভাবে ফলের নিশ্চয়তা দিতে পারে না।',
    supportiveHabits: [
      'সুষম খাদ্যাভ্যাস',
      'পরিমিত শারীরিক কার্যকলাপ',
      'মানসম্মত ঘুম',
      'শিথিল হওয়ার মুহূর্ত',
    ],
    body2: 'দীর্ঘস্থায়ী মানসিক চাপ হরমোনের ভারসাম্য এবং কিছু নারীর ক্ষেত্রে চক্রের নিয়মিততাকে প্রভাবিত করতে পারে। নিজেকে শান্ত থাকার সময় দেওয়া এই যাত্রারই একটি অংশ।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: '“সবকিছু ঠিকঠাক করার” ইচ্ছাই নিজে মানসিক চাপের উৎস হয়ে উঠতে পারে: সাধারণভাবে স্বাস্থ্যকর অভ্যাস রাখাই যথেষ্ট, নিখুঁত হওয়ার চেষ্টা ছাড়াই।',
    toLimit: [
      'ধূমপান, যা উভয় সঙ্গীর প্রজনন ক্ষমতাকে প্রভাবিত করতে পারে',
      'অতিরিক্ত অ্যালকোহল পান',
      'তীব্র ও দীর্ঘ সময়ের ক্রীড়া প্রশিক্ষণ, যা উল্টোভাবে প্রজনন ক্ষমতা কমিয়ে দিতে পারে',
      'অতিরিক্ত পরিশোধিত চিনি, যা হরমোনের ভারসাম্য বিঘ্নিত করতে পারে',
    ],
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'বাড়াবাড়ি বা নিখুঁত হওয়ার চেষ্টা ছাড়া সাধারণভাবে সুষম অভ্যাসই প্রতিদিনের সবচেয়ে ভালো সহায়তা।',
    shareMessage: 'জীবনযাপনের অভ্যাস ও গর্ভধারণের যাত্রা — AWA',
  },
  da: {
    badge: 'LIVSSTIL',
    title: 'Livsstilsvaner og\ndin graviditetsrejse',
    metaDuration: '5 min læsning',
    metaType: 'Artikel',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Simple vaner, der kan støtte din rejse, uden pres.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad der kan støtte fertiliteten',
      'Stress, en faktor man ikke bør ignorere',
      'Hvad det er godt at begrænse',
      'Vigtige pointer',
    ],
    body1: 'Nogle enkle livsstilsvaner kan støtte din graviditetsrejse, men kan ikke garantere et resultat på egen hånd.',
    supportiveHabits: [
      'Afbalanceret kost',
      'Moderat fysisk aktivitet',
      'God søvnkvalitet',
      'Øjeblikke til at slappe af',
    ],
    body2: 'Vedvarende stress kan påvirke hormonbalancen og hos nogle kvinder cyklussens regelmæssighed. At give dig selv tid til ro er en del af denne rejse.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Ønsket om at "gøre alt rigtigt" kan i sig selv blive en stressende faktor: det er nok at have generelt sunde vaner, uden at stræbe efter perfektion.',
    toLimit: [
      'Rygning, som kan påvirke begge partners fertilitet',
      'Overdrevent alkoholforbrug',
      'Intense og langvarige sportsaktiviteter, der modsat kan reducere fertiliteten',
      'Overdrevent raffineret sukker, der kan forstyrre hormonbalancen',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'En generelt balanceret livsstil, uden overdrivelse eller stræben efter perfektion, er den bedste daglige støtte.',
    shareMessage: 'Livsstilsvaner og graviditetsrejsen — AWA',
  },
  sv: {
    badge: 'LIVSSTIL',
    title: 'Livsstilsvaner og\ndin graviditetsrejse',
    metaDuration: '5 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Simple vaner, der kan stötte din rejse, uden pres.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad der kan stötte fertiliteten',
      'Stress, en faktor man inte bör ignorere',
      'Hvad det ar godt at begränse',
      'Vigtige pointer',
    ],
    body1: 'Nogle enkle livsstilsvaner kan stötte din graviditetsrejse, men kan inte garantere et resultat på egen hånd.',
    supportiveHabits: [
      'Afbalanceret kost',
      'Moderat fysisk aktivitet',
      'God sövnkvalitet',
      'Öjeblikke till at slappe af',
    ],
    body2: 'Vedvarende stress kan påvirke hormonbalancen och hos nogle kvinnor cyklussens regelmässighed. At give dig selv tid till ro ar en del av denne rejse.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Önsket om at "göre alt rigtigt" kan i sig selv blive en stressende faktor: det ar nok at have generelt sunde vaner, uden at sträbe efter perfektion.',
    toLimit: [
      'Rygning, som kan påvirke begge partners fertilitet',
      'Overdrevent alkoholforbrug',
      'Intense och langvarige sportsaktiviteter, der modsat kan reducere fertiliteten',
      'Overdrevent raffineret sukker, der kan forstyrre hormonbalancen',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'En generelt balanceret livsstil, uden overdrivelse eller sträben efter perfektion, ar den bedste daglige stötte.',
    shareMessage: 'Livsstilsvaner och graviditetsrejsen — AWA',
  },
  nb: {
    badge: 'LIVSSTIL',
    title: 'Livsstilsvaner og\nreisen mot å bli gravid',
    metaDuration: '5 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Enkle vaner som kan støtte reisen din – uten press.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva som kan støtte fruktbarheten',
      'Stress, en faktor som ikke bør overses',
      'Det som er best å begrense',
      'Det viktigste å huske',
    ],
    body1: 'Noen enkle livsstilsvaner kan støtte reisen mot å bli gravid, selv om de ikke alene kan garantere et resultat.',
    supportiveHabits: [
      'Et variert og balansert kosthold',
      'Moderat fysisk aktivitet',
      'God søvn',
      'Øyeblikk med avslapning',
    ],
    body2: 'Kronisk stress kan påvirke den hormonelle balansen og, hos noen kvinner, syklusens regelmessighet. Å gi seg selv øyeblikk med ro er en helt naturlig del av reisen.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Å ville «gjøre alt riktig» kan i seg selv bli en kilde til stress: det er nok å sikte mot generelt sunne vaner, uten perfeksjonisme.',
    toLimit: [
      'Røyking, som kan påvirke fruktbarheten hos begge parter',
      'For høyt alkoholforbruk',
      'Intens, langvarig idrettstrening, som tvert imot kan senke fruktbarheten',
      'For mye raffinert sukker, som kan forstyrre den hormonelle balansen',
    ],
    tip2Title: 'Godt å vite',
    tip2Text: 'Generelt balanserte vaner, uten overdrivelser eller perfeksjonisme, er den beste støtten i hverdagen.',
    shareMessage: 'Livsstilsvaner og reisen mot å bli gravid – AWA',
  },
  pl: {
    badge: 'STYL ŻYCIA',
    title: 'Nawyki stylu życia\na Twoja droga do poczęcia',
    metaDuration: '5 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Proste nawyki, które mogą wesprzeć Twoją drogę — bez presji.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Co może wspierać płodność',
      'Stres, czynnik, którego nie warto pomijać',
      'Czego lepiej unikać',
      'Najważniejsze do zapamiętania',
    ],
    body1: 'Niektóre proste nawyki mogą wspierać starania o dziecko, choć same nie gwarantują rezultatu.',
    supportiveHabits: [
      'Zbilansowana dieta',
      'Umiarkowana aktywność fizyczna',
      'Dobry sen',
      'Chwile relaksu',
    ],
    body2: 'Przewlekły stres może wpływać na równowagę hormonalną, a u niektórych kobiet na regularność cyklu. Dawanie sobie chwil spokoju jest pełnoprawną częścią tej drogi.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Chęć, by „zrobić wszystko dobrze”, sama może stać się źródłem stresu: wystarczy dążyć do ogólnie zdrowych nawyków, bez perfekcjonizmu.',
    toLimit: [
      'Palenie, które może wpływać na płodność obojga partnerów',
      'Nadmierne spożywanie alkoholu',
      'Intensywny, długotrwały trening sportowy, który może wręcz osłabiać płodność',
      'Nadmiar rafinowanego cukru, który może zaburzać równowagę hormonalną',
    ],
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Ogólnie zrównoważone nawyki, bez nadmiaru i perfekcjonizmu, to najlepsze codzienne wsparcie.',
    shareMessage: 'Nawyki stylu życia a droga do poczęcia — AWA',
  },
  uk: {
    badge: 'СПОСІБ ЖИТТЯ',
    title: 'Звички способу життя\nі ваш шлях до зачаття',
    metaDuration: '5 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Прості звички, що можуть підтримати ваш шлях, — без тиску.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що може підтримувати фертильність',
      'Стрес — чинник, який не варто ігнорувати',
      'Чого краще обмежити',
      'Головне',
    ],
    body1: 'Деякі прості звички способу життя можуть підтримувати шлях до зачаття, хоча самі по собі не гарантують результату.',
    supportiveHabits: [
      'Збалансоване харчування',
      'Помірна фізична активність',
      'Якісний сон',
      'Моменти розслаблення',
    ],
    body2: 'Хронічний стрес може впливати на гормональний баланс і, у деяких жінок, на регулярність циклу. Дозволити собі моменти спокою — повноцінна частина цього шляху.',
    tip1Title: 'Варто знати',
    tip1Text: 'Бажання «робити все правильно» саме може стати джерелом стресу: достатньо прагнути до загалом здорових звичок, без перфекціонізму.',
    toLimit: [
      'Паління, яке може впливати на фертильність обох партнерів',
      'Надмірне вживання алкоголю',
      'Інтенсивні тривалі спортивні тренування, які, навпаки, можуть знижувати фертильність',
      'Надлишок рафінованого цукру, який може порушувати гормональний баланс',
    ],
    tip2Title: 'Варто знати',
    tip2Text: 'Загалом збалансовані звички, без надмірностей і перфекціонізму, — найкраща щоденна підтримка.',
    shareMessage: 'Звички способу життя та шлях до зачаття — AWA',
  },
  cs: {
    badge: 'ŽIVOTNÍ STYL',
    title: 'Životní návyky a\nvaše cesta k početí',
    metaDuration: '5 min čtení',
    metaType: 'Článek',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Jednoduché návyky, které mohou vaši cestu podpořit — bez tlaku.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co může plodnost podpořit',
      'Stres, faktor, který nelze přehlížet',
      'Co je nejlepší omezit',
      'Hlavní poznatek',
    ],
    body1: 'Některé jednoduché životní návyky mohou cestu k početí podpořit, i když samy o sobě výsledek zaručit nemohou.',
    supportiveHabits: [
      'Vyvážená strava',
      'Mírná fyzická aktivita',
      'Kvalitní spánek',
      'Chvíle relaxace',
    ],
    body2: 'Chronický stres může ovlivnit hormonální rovnováhu a u některých žen i pravidelnost cyklu. Dopřát si chvíle klidu je plnohodnotnou součástí této cesty.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Touha dělat „všechno správně“ se sama může stát zdrojem stresu: stačí usilovat o obecně zdravé návyky, bez perfekcionismu.',
    toLimit: [
      'Kouření, které může ovlivnit plodnost obou partnerů',
      'Nadměrná konzumace alkoholu',
      'Intenzivní, dlouhodobý sportovní trénink, který může naopak plodnost zpomalit',
      'Nadbytek rafinovaného cukru, který může narušit hormonální rovnováhu',
    ],
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Obecně vyvážené návyky, bez excesů a perfekcionismu, jsou nejlepší každodenní podporou.',
    shareMessage: 'Životní návyky a cesta k početí — AWA',
  },
  sk: {
    badge: 'ŽIVOTNÝ ŠTÝL',
    title: 'Životný štýl a\nvaša cesta k počatiu',
    metaDuration: '5 min čítania',
    metaType: 'Článok',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Jednoduché návyky, ktoré môžu vašu cestu podporiť — bez tlaku.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo môže podporiť plodnosť',
      'Stres, faktor, ktorý netreba prehliadať',
      'Čo je najlepšie obmedziť',
      'Hlavný bod',
    ],
    body1: 'Niektoré jednoduché návyky životného štýlu môžu cestu k počatiu podporiť, hoci samy nemôžu zaručiť výsledok.',
    supportiveHabits: [
      'Vyvážená strava',
      'Mierna fyzická aktivita',
      'Kvalitný spánok',
      'Chvíle relaxácie',
    ],
    body2: 'Chronický stres môže ovplyvniť hormonálnu rovnováhu a u niektorých žien aj pravidelnosť cyklu. Doprajte si chvíle pokoja — patrí to k tejto ceste.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Túžba robiť „všetko správne“ sa môže sama stať zdrojom stresu: stačí sa zamerať na celkovo zdravé návyky, bez dokonalosti.',
    toLimit: [
      'Fajčenie, ktoré môže ovplyvniť plodnosť oboch partnerov',
      'Nadmerná konzumácia alkoholu',
      'Intenzívny, dlhodobý športový tréning, ktorý môže naopak plodnosť spomaliť',
      'Nadbytok rafinovaného cukru, ktorý môže narušiť hormonálnu rovnováhu',
    ],
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Celkovo vyvážené návyky, bez excesov a dokonalosti, sú najlepšou každodennou podporou.',
    shareMessage: 'Životný štýl a cesta k počatiu — AWA',
  },
  hu: {
    badge: 'ÉLETMÓD',
    title: 'Életmódbeli szokások és\na babavárás útja',
    metaDuration: '5 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Egyszerű szokások, amelyek támogathatják az utadat — nyomás nélkül.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Ami támogathatja a termékenységet',
      'A stressz, egy figyelmen kívül nem hagyható tényező',
      'Amit érdemes korlátozni',
      'Legfontosabb tudnivaló',
    ],
    body1: 'Néhány egyszerű életmódbeli szokás támogathatja a babavárás útját, bár önmagában nem garantálhat eredményt.',
    supportiveHabits: [
      'Kiegyensúlyozott étrend',
      'Mérsékelt testmozgás',
      'Minőségi alvás',
      'A kikapcsolódás pillanatai',
    ],
    body2: 'A krónikus stressz befolyásolhatja a hormonális egyensúlyt, és egyes nőknél a ciklus rendszerességét is. A nyugalom pillanatainak megadása az út teljes értékű része.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Az a vágy, hogy „mindent jól csináljak”, maga is stresszforrássá válhat: elég az általában egészséges szokásokra törekedni, tökéletességre való törekvés nélkül.',
    toLimit: [
      'Dohányzás, amely mindkét partner termékenységét befolyásolhatja',
      'Túlzott alkoholfogyasztás',
      'Intenzív, hosszan tartó sportedzés, amely ellenkezőleg lassíthatja a termékenységet',
      'A túlzott finomított cukor, amely megzavarhatja a hormonális egyensúlyt',
    ],
    tip2Title: 'Érdemes tudni',
    tip2Text: 'Az általában kiegyensúlyozott szokások — túlzások és tökéletességre törekvés nélkül — a legjobb mindennapi támogatás.',
    shareMessage: 'Életmódbeli szokások és a babavárás útja — AWA',
  },
  ro: {
    badge: 'STIL DE VIAȚĂ',
    title: 'Obiceiurile de viață și\ndrumul tău spre concepție',
    metaDuration: '5 min de citit',
    metaType: 'Articol',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Obiceiuri simple care îți pot susține drumul — fără presiune.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce poate susține fertilitatea',
      'Stresul, un factor de nelăsat deoparte',
      'Ce este mai bine să limitezi',
      'Ideea principală',
    ],
    body1: 'Unele obiceiuri simple de viață pot susține drumul spre concepție, deși nu pot garanta singure un rezultat.',
    supportiveHabits: [
      'O alimentație echilibrată',
      'Activitate fizică moderată',
      'Somn de calitate',
      'Momente de relaxare',
    ],
    body2: 'Stresul cronic poate afecta echilibrul hormonal și, la unele femei, regularitatea ciclului. Să-ți oferi momente de liniște face pe deplin parte din acest drum.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Dorința de a „face totul corect” poate deveni ea însăși o sursă de stres: este suficient să urmărești obiceiuri în general sănătoase, fără perfecționism.',
    toLimit: [
      'Fumatul, care poate afecta fertilitatea ambilor parteneri',
      'Consumul excesiv de alcool',
      'Antrenamentul sportiv intens și prelungit, care poate, dimpotrivă, încetini fertilitatea',
      'Excesul de zahăr rafinat, care poate dereglă echilibrul hormonal',
    ],
    tip2Title: 'Bine de știut',
    tip2Text: 'Obiceiurile în general echilibrate, fără exces sau perfecționism, sunt cel mai bun sprijin de zi cu zi.',
    shareMessage: 'Obiceiurile de viață și drumul spre concepție — AWA',
  },
  bg: {
    badge: 'НАЧИН НА ЖИВОТ',
    title: 'Навиците в начина на живот и\nпътят ти към зачеването',
    metaDuration: '5 мин четене',
    metaType: 'Статия',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Прости навици, които могат да подкрепят пътя ти — без натиск.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво може да подкрепи плодовитостта',
      'Стресът, фактор, който не бива да се пренебрегва',
      'Какво е най-добре да ограничиш',
      'Основната идея',
    ],
    body1: 'Някои прости навици в начина на живот могат да подкрепят пътя към зачеването, макар сами да не могат да гарантират резултат.',
    supportiveHabits: [
      'Балансирано хранене',
      'Умерена физическа активност',
      'Качествен сън',
      'Моменти на релаксация',
    ],
    body2: 'Хроничният стрес може да повлияе на хормоналния баланс и, при някои жени, на редовността на цикъла. Да си дадеш мигове на спокойствие е напълно част от пътя.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Желанието да „направиш всичко правилно“ може само по себе си да стане източник на стрес: достатъчно е да се стремиш към като цяло здравословни навици, без перфекционизъм.',
    toLimit: [
      'Пушенето, което може да засегне плодовитостта и при двамата партньори',
      'Прекомерната консумация на алкохол',
      'Интензивните и продължителни спортни тренировки, които могат, обратно, да забавят плодовитостта',
      'Излишъкът от рафинирана захар, който може да наруши хормоналния баланс',
    ],
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Като цяло балансираните навици, без излишества или перфекционизъм, са най-добрата ежедневна подкрепа.',
    shareMessage: 'Навиците в начина на живот и пътят към зачеването — AWA',
  },
  sr: {
    badge: 'НАЧИН ЖИВОТА',
    title: 'Животне навике и\nпут ка зачећу',
    metaDuration: '5 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Једноставне навике које могу подржати твој пут — без притиска.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта може подржати плодност',
      'Стрес, фактор који не треба занемарити',
      'Шта је најбоље ограничити',
      'Основно',
    ],
    body1: 'Неке једноставне животне навике могу подржати пут ка зачећу, мада саме не могу гарантовати резултат.',
    supportiveHabits: [
      'Уравнотежена исхрана',
      'Умерена физичка активност',
      'Квалитетан сан',
      'Тренуци опуштања',
    ],
    body2: 'Хронични стрес може утицати на хормонску равнотежу и, код неких жена, на редовност циклуса. Давање себи тренутака мира потпуно је део пута.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Жеља да „све урадиш како треба“ може и сама постати извор стреса: довољно је тежити опште здравим навикама, без перфекционизма.',
    toLimit: [
      'Пушење, које може утицати на плодност оба партнера',
      'Прекомерна конзумација алкохола',
      'Интензиван, продужен спортски тренинг, који супротно може успорити плодност',
      'Вишак рафинисаног шећера, који може пореметити хормонску равнотежу',
    ],
    tip2Title: 'Добро је знати',
    tip2Text: 'Опште уравнотежене навике, без претеривања и перфекционизма, најбоља су свакодневна подршка.',
    shareMessage: 'Животне навике и пут ка зачећу — AWA',
  },
  hr: {
    badge: 'NAČIN ŽIVOTA',
    title: 'Životne navike i\ntvoj put do začeća',
    metaDuration: '5 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Jednostavne navike koje mogu podržati tvoj put — bez pritiska.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što može podržati plodnost',
      'Stres, čimbenik koji ne treba zanemariti',
      'Što je najbolje ograničiti',
      'Ključna poruka',
    ],
    body1: 'Neke jednostavne životne navike mogu podržati put do začeća, iako same ne mogu jamčiti rezultat.',
    supportiveHabits: [
      'Uravnotežena prehrana',
      'Umjerena tjelesna aktivnost',
      'Kvalitetan san',
      'Trenuci opuštanja',
    ],
    body2: 'Kronični stres može utjecati na hormonsku ravnotežu i, kod nekih žena, na pravilnost ciklusa. Priuštiti si trenutke mira potpuno je dio tog puta.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Želja da „sve učiniš kako treba“ i sama može postati izvor stresa: dovoljno je težiti općenito zdravim navikama, bez perfekcionizma.',
    toLimit: [
      'Pušenje, koje može utjecati na plodnost oba partnera',
      'Prekomjerna konzumacija alkohola',
      'Intenzivan, dugotrajan sportski trening, koji naprotiv može usporiti plodnost',
      'Višak rafiniranog šećera, koji može poremetiti hormonsku ravnotežu',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Općenito uravnotežene navike, bez pretjerivanja i perfekcionizma, najbolja su svakodnevna podrška.',
    shareMessage: 'Životne navike i put do začeća — AWA',
  },
  bs: {
    badge: 'NAČIN ŽIVOTA',
    title: 'Životne navike i\ntvoj put do začeća',
    metaDuration: '5 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Jednostavne navike koje mogu podržati tvoj put — bez pritiska.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što može podržati plodnost',
      'Stres, čimbenik koji ne treba zanemariti',
      'Što je najbolje ograničiti',
      'Ključna poruka',
    ],
    body1: 'Neke jednostavne životne navike mogu podržati put do začeća, iako same ne mogu jamčiti rezultat.',
    supportiveHabits: [
      'Uravnotežena ishrana',
      'Umjerena tjelesna aktivnost',
      'Kvalitetan san',
      'Trenuci opuštanja',
    ],
    body2: 'Kronični stres može utjecati na hormonsku ravnotežu i, kod nekih žena, na pravilnost ciklusa. Priuštiti si trenutke mira potpuno je dio tog puta.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Želja da „sve učiniš kako treba“ i sama može postati izvor stresa: dovoljno je težiti općenito zdravim navikama, bez perfekcionizma.',
    toLimit: [
      'Pušenje, koje može utjecati na plodnost oba partnera',
      'Prekomjerna konzumacija alkohola',
      'Intenzivan, dugotrajan sportski trening, koji naprotiv može usporiti plodnost',
      'Višak rafiniranog šećera, koji može poremetiti hormonsku ravnotežu',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Općenito uravnotežene navike, bez pretjerivanja i perfekcionizma, najbolja su svakodnevna podrška.',
    shareMessage: 'Životne navike i put do začeća — AWA',
  },
  sl: {
    badge: 'ŽIVLJENJSKI SLOG',
    title: 'Življenjske navade in\ntvoja pot do zanositve',
    metaDuration: '5 min branja',
    metaType: 'Članek',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Preproste navade, ki lahko podprejo tvojo pot — brez pritiska.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj lahko podpre plodnost',
      'Stres, dejavnik, ki ga ne smemo zanemariti',
      'Kaj je najbolje omejiti',
      'Ključno sporočilo',
    ],
    body1: 'Nekatere preproste življenjske navade lahko podprejo pot do zanositve, čeprav same ne morejo zagotoviti rezultata.',
    supportiveHabits: [
      'Uravnotežena prehrana',
      'Zmerna telesna dejavnost',
      'Kakovosten spanec',
      'Trenutki sproščanja',
    ],
    body2: 'Kronični stres lahko vpliva na hormonsko ravnovesje in pri nekaterih ženskah na pravilnost cikla. Privoščiti si trenutke miru je povsem del te poti.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Želja, da bi „vse naredila prav“, lahko sama postane vir stresa: dovolj je stremeti k na splošno zdravim navadam, brez perfekcionizma.',
    toLimit: [
      'Kajenje, ki lahko vpliva na plodnost obeh partnerjev',
      'Prekomerno uživanje alkohola',
      'Intenziven, dolgotrajen športni trening, ki lahko nasprotno upočasni plodnost',
      'Presežek rafiniranega sladkorja, ki lahko moti hormonsko ravnovesje',
    ],
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Na splošno uravnotežene navade, brez pretiravanja in perfekcionizma, so najboljša vsakodnevna podpora.',
    shareMessage: 'Življenjske navade in pot do zanositve — AWA',
  },
  ne: {
    badge: 'जीवनशैली',
    title: 'जीवनशैलीका बानी र\nतपाईंको गर्भधारणको यात्रा',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'तपाईंको यात्रालाई साथ दिन सक्ने सरल बानीहरू — कुनै दबाबबिना।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'उर्वरतालाई के ले साथ दिन सक्छ',
      'तनाव, बेवास्ता नगर्नुपर्ने कारक',
      'के सीमित गर्नु राम्रो',
      'मुख्य कुरा',
    ],
    body1: 'जीवनशैलीका केही सरल बानीहरूले गर्भधारणको यात्रालाई साथ दिन सक्छन्, तर तिनले आफैँ नतिजाको ग्यारेन्टी दिन सक्दैनन्।',
    supportiveHabits: [
      'सन्तुलित खानपान',
      'मध्यम शारीरिक गतिविधि',
      'गुणस्तरीय निद्रा',
      'आरामका क्षणहरू',
    ],
    body2: 'लामो समयको तनावले हर्मोनल सन्तुलनलाई र केही महिलामा चक्रको नियमिततालाई असर गर्न सक्छ। आफूलाई शान्तिका क्षणहरू दिनु यात्राकै पूर्ण हिस्सा हो।',
    tip1Title: 'जान्न लायक',
    tip1Text: '“सबै कुरा सही गर्न” चाहनु आफैँ तनावको स्रोत बन्न सक्छ: पूर्णतावादबिना सामान्यतया स्वस्थ बानीहरूको लक्ष्य राख्नु पर्याप्त छ।',
    toLimit: [
      'धूम्रपान, जसले दुवै साझेदारको उर्वरतालाई असर गर्न सक्छ',
      'अत्यधिक मदिरा सेवन',
      'तीव्र, लामो समयको खेलकुद प्रशिक्षण, जसले उल्टो उर्वरता सुस्त बनाउन सक्छ',
      'अत्यधिक परिष्कृत चिनी, जसले हर्मोनल सन्तुलन बिगार्न सक्छ',
    ],
    tip2Title: 'जान्न लायक',
    tip2Text: 'अति वा पूर्णतावादबिना सामान्यतया सन्तुलित बानीहरू नै सबैभन्दा राम्रो दैनिक साथ हुन्।',
    shareMessage: 'जीवनशैलीका बानी र गर्भधारणको यात्रा — AWA',
  },
  si: {
    badge: 'ජීවන රටාව',
    title: 'ජීවන රටා පුරුදු සහ\nඔබේ ගැබ්ගැනීමේ ගමන',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'ලිපිය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ ගමනට සහාය විය හැකි සරල පුරුදු — පීඩනයක් නැත.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'සාරවත් බවට සහාය විය හැකි දේ',
      'ආතතිය, නොසලකා හැරිය නොහැකි සාධකයක්',
      'සීමා කිරීම වඩාත් හොඳ දේ',
      'ප්‍රධාන කරුණ',
    ],
    body1: 'සමහර සරල ජීවන රටා පුරුදු ගැබ්ගැනීමේ ගමනකට සහාය විය හැකි නමුත්, ඒවාට තනිවම ප්‍රතිඵලයක් සහතික කළ නොහැක.',
    supportiveHabits: [
      'සමතුලිත ආහාර වේලක්',
      'මධ්‍යස්ථ ශාරීරික ක්‍රියාකාරකම',
      'ගුණාත්මක නින්ද',
      'ලිහිල් වීමේ මොහොතවල්',
    ],
    body2: 'නිදන්ගත ආතතිය හෝමෝන සමතුලිතතාවට සහ සමහර කාන්තාවන්ගේ චක්‍රයේ නිතිපතා බවට බලපෑ හැක. ඔබටම සන්සුන් මොහොතවල් ලබා දීම ගමනේ සම්පූර්ණ කොටසකි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: '“සියල්ල නිවැරදිව කිරීමට” අවශ්‍ය වීම ම ආතතියේ මූලාශ්‍රයක් විය හැක: පරිපූර්ණවාදයකින් තොරව, සාමාන්‍යයෙන් සෞඛ්‍ය සම්පන්න පුරුදු අරමුණු කිරීම ප්‍රමාණවත්.',
    toLimit: [
      'දුම්පානය, එය සහකරුවන් දෙදෙනාගේම සාරවත් බවට බලපෑ හැක',
      'අධික මත්පැන් පරිභෝජනය',
      'දැඩි, දිගුකාලීන ක්‍රීඩා පුහුණුව, එය ප්‍රතිවිරුද්ධව සාරවත් බව මන්දගාමී කළ හැක',
      'අධික පිරිසිදු කළ සීනි, එය හෝමෝන සමතුලිතතාව කඩාකප්පල් කළ හැක',
    ],
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'අධික බවකින් හෝ පරිපූර්ණවාදයකින් තොරව, සාමාන්‍යයෙන් සමතුලිත පුරුදු හොඳම එදිනෙදා සහාය වේ.',
    shareMessage: 'ජීවන රටා පුරුදු සහ ගැබ්ගැනීමේ ගමන — AWA',
  },
  th: {
    badge: 'วิถีชีวิต',
    title: 'นิสัยในวิถีชีวิตกับ\nเส้นทางการมีบุตรของคุณ',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'บทความ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'นิสัยง่าย ๆ ที่สนับสนุนเส้นทางของคุณได้ — โดยไม่มีแรงกดดัน',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'สิ่งที่สนับสนุนภาวะเจริญพันธุ์',
      'ความเครียด ปัจจัยที่ไม่ควรมองข้าม',
      'สิ่งที่ควรจำกัด',
      'ประเด็นสำคัญ',
    ],
    body1: 'นิสัยในวิถีชีวิตง่าย ๆ บางอย่างสนับสนุนเส้นทางการมีบุตรได้ แต่ไม่สามารถรับประกันผลลัพธ์ด้วยตัวมันเอง',
    supportiveHabits: [
      'อาหารที่สมดุล',
      'กิจกรรมทางกายระดับปานกลาง',
      'การนอนหลับที่มีคุณภาพ',
      'ช่วงเวลาแห่งการผ่อนคลาย',
    ],
    body2: 'ความเครียดเรื้อรังอาจส่งผลต่อสมดุลของฮอร์โมนและความสม่ำเสมอของรอบเดือนในผู้หญิงบางคน การให้ช่วงเวลาสงบแก่ตัวเองเป็นส่วนหนึ่งของเส้นทางนี้',
    tip1Title: 'ควรรู้',
    tip1Text: 'การอยากทำ “ทุกอย่างให้ถูกต้อง” อาจกลายเป็นแหล่งของความเครียดเอง: การตั้งเป้านิสัยที่ดีต่อสุขภาพโดยทั่วไปก็เพียงพอ โดยไม่ต้องสมบูรณ์แบบ',
    toLimit: [
      'การสูบบุหรี่ ซึ่งอาจส่งผลต่อภาวะเจริญพันธุ์ของทั้งสองฝ่าย',
      'การดื่มแอลกอฮอล์มากเกินไป',
      'การฝึกกีฬาที่หนักและยาวนาน ซึ่งอาจชะลอภาวะเจริญพันธุ์ในทางกลับกัน',
      'น้ำตาลขัดสีมากเกินไป ซึ่งอาจรบกวนสมดุลของฮอร์โมน',
    ],
    tip2Title: 'ควรรู้',
    tip2Text: 'นิสัยที่สมดุลโดยทั่วไป โดยไม่เกินเลยหรือสมบูรณ์แบบ คือการสนับสนุนประจำวันที่ดีที่สุด',
    shareMessage: 'นิสัยในวิถีชีวิตและเส้นทางการมีบุตร — AWA',
  },
  vi: {
    badge: 'LỐI SỐNG',
    title: 'Thói quen sinh hoạt và\nhành trình thụ thai của bạn',
    metaDuration: '5 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Những thói quen đơn giản có thể hỗ trợ hành trình của bạn — không áp lực.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Điều gì có thể hỗ trợ khả năng thụ thai',
      'Căng thẳng, một yếu tố không nên bỏ qua',
      'Điều nên hạn chế',
      'Điểm chính cần nhớ',
    ],
    body1: 'Một số thói quen sinh hoạt đơn giản có thể hỗ trợ hành trình thụ thai, dù chúng không thể tự đảm bảo kết quả.',
    supportiveHabits: [
      'Chế độ ăn cân bằng',
      'Hoạt động thể chất vừa phải',
      'Giấc ngủ chất lượng',
      'Những khoảnh khắc thư giãn',
    ],
    body2: 'Căng thẳng kéo dài có thể ảnh hưởng đến sự cân bằng nội tiết và, ở một số phụ nữ, ảnh hưởng đến độ đều của chu kỳ. Dành cho mình những khoảnh khắc yên bình là một phần trọn vẹn của hành trình.',
    tip1Title: 'Nên biết',
    tip1Text: 'Muốn “làm mọi thứ thật đúng” có thể tự nó trở thành nguồn căng thẳng: chỉ cần hướng đến những thói quen lành mạnh nói chung, không cần cầu toàn.',
    toLimit: [
      'Hút thuốc, có thể ảnh hưởng đến khả năng sinh sản của cả hai người',
      'Uống quá nhiều rượu bia',
      'Tập luyện thể thao cường độ cao, kéo dài, ngược lại có thể làm chậm khả năng thụ thai',
      'Ăn quá nhiều đường tinh luyện, có thể làm rối loạn cân bằng nội tiết',
    ],
    tip2Title: 'Nên biết',
    tip2Text: 'Những thói quen cân bằng nói chung, không thái quá hay cầu toàn, là sự hỗ trợ tốt nhất mỗi ngày.',
    shareMessage: 'Thói quen sinh hoạt và hành trình thụ thai — AWA',
  },
  uz: {
    badge: 'TURMUSH TARZI',
    title: 'Turmush tarzi odatlari va\nhomilador boʻlish yoʻlingiz',
    metaDuration: '5 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Yoʻlingizni qoʻllab-quvvatlashi mumkin boʻlgan oddiy odatlar — hech qanday bosimsiz.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Unumdorlikni nima qoʻllab-quvvatlashi mumkin',
      'Stress — eʼtibordan chetda qoldirmaslik kerak boʻlgan omil',
      'Nimani cheklagan maʼqul',
      'Asosiy xulosa',
    ],
    body1: 'Baʼzi oddiy turmush tarzi odatlari homilador boʻlish yoʻlini qoʻllab-quvvatlashi mumkin, ammo ular yakka oʻzi natijani kafolatlay olmaydi.',
    supportiveHabits: [
      'Muvozanatli ovqatlanish',
      'Muʼtadil jismoniy faollik',
      'Sifatli uyqu',
      'Dam olish lahzalari',
    ],
    body2: 'Surunkali stress gormonal muvozanatga va baʼzi ayollarda sikl muntazamligiga taʼsir qilishi mumkin. Oʻzingizga xotirjamlik lahzalarini berish yoʻlning ajralmas qismi.',
    tip1Title: 'Bilish foydali',
    tip1Text: '“Hamma narsani toʻgʻri qilish” istagi oʻzi stress manbaiga aylanishi mumkin: mukammallikka intilmasdan, umuman sogʻlom odatlarga intilish yetarli.',
    toLimit: [
      'Chekish — u ikkala hamrohning unumdorligiga taʼsir qilishi mumkin',
      'Spirtli ichimliklarni haddan tashqari isteʼmol qilish',
      'Intensiv, uzoq davom etadigan sport mashgʻulotlari — ular, aksincha, unumdorlikni sekinlashtirishi mumkin',
      'Haddan tashqari rafinadlangan shakar — u gormonal muvozanatni buzishi mumkin',
    ],
    tip2Title: 'Bilish foydali',
    tip2Text: 'Haddan tashqari va mukammallikka intilishsiz, umuman muvozanatli odatlar eng yaxshi kundalik yordam.',
    shareMessage: 'Turmush tarzi odatlari va homilador boʻlish yoʻli — AWA',
  },
  az: {
    badge: 'HƏYAT TƏRZİ',
    title: 'Həyat tərzi vərdişləri və\nhamilə qalma yolunuz',
    metaDuration: '5 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Yolunuzu dəstəkləyə bilən sadə vərdişlər — heç bir təzyiq olmadan.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Münbitliyi nə dəstəkləyə bilər',
      'Stress, nəzərdən qaçırılmamalı amil',
      'Nəyi məhdudlaşdırmaq daha yaxşıdır',
      'Əsas nəticə',
    ],
    body1: 'Bəzi sadə həyat tərzi vərdişləri hamilə qalma yolunu dəstəkləyə bilər, lakin tək başına nəticəyə zəmanət verə bilməz.',
    supportiveHabits: [
      'Balanslı qidalanma',
      'Orta səviyyəli fiziki fəaliyyət',
      'Keyfiyyətli yuxu',
      'İstirahət anları',
    ],
    body2: 'Xroniki stress hormonal tarazlığa və bəzi qadınlarda dövrün müntəzəmliyinə təsir edə bilər. Özünüzə sakitlik anları vermək yolun tam bir hissəsidir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: '“Hər şeyi düzgün etmək” istəyi özü stress mənbəyinə çevrilə bilər: mükəmməlliyə can atmadan, ümumilikdə sağlam vərdişlər kifayətdir.',
    toLimit: [
      'Hər iki həyat yoldaşının münbitliyinə təsir edə bilən siqaret çəkmə',
      'Həddindən artıq alkoqol istehlakı',
      'Əksinə, münbitliyi azalda bilən intensiv və uzunmüddətli idman məşqləri',
      'Hormonal tarazlığı pozan həddindən artıq rafinə olunmuş şəkər',
    ],
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Həddindən artıqlığa və mükəmməlliyə can atmadan ümumilikdə balanslı vərdişlər ən yaxşı gündəlik dəstəkdir.',
    shareMessage: 'Həyat tərzi vərdişləri və hamilə qalma yolu — AWA',
  },
  ka: {
    badge: 'ცხოვრების წესი',
    title: 'ცხოვრების წესის ჩვევები და\nთქვენი ჩასახვის გზა',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'მარტივი ჩვევები, რომლებმაც შეიძლება თქვენს გზას მხარი დაუჭიროს — ზეწოლის გარეშე.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა შეიძლება ფერტილობას უწყობდეს ხელს',
      'სტრესი — ფაქტორი, რომელიც არ უნდა უგულებელვყოთ',
      'რისი შეზღუდვაა უმჯობესი',
      'მთავარი დასკვნა',
    ],
    body1: 'ცხოვრების წესის ზოგიერთ მარტივ ჩვევას შეუძლია ჩასახვის გზას მხარი დაუჭიროს, თუმცა მხოლოდ მათ შედეგის გარანტიის მოცემა არ შეუძლიათ.',
    supportiveHabits: [
      'დაბალანსებული კვება',
      'ზომიერი ფიზიკური აქტივობა',
      'ხარისხიანი ძილი',
      'მოდუნების მომენტები',
    ],
    body2: 'ქრონიკულმა სტრესმა შეიძლება ჰორმონულ ბალანსზე და ზოგ ქალში ციკლის რეგულარულობაზე იმოქმედოს. სიმშვიდის მომენტების მიცემა გზის სრულფასოვანი ნაწილია.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'სურვილმა, „ყველაფერი სწორად გააკეთოთ“, თავად შეიძლება სტრესის წყარო გახდეს: საკმარისია ზოგადად ჯანსაღი ჩვევების დაცვა, პერფექციონიზმის გარეშე.',
    toLimit: [
      'მოწევა, რომელმაც შეიძლება ორივე პარტნიორის ფერტილობაზე იმოქმედოს',
      'ალკოჰოლის ჭარბი მოხმარება',
      'ინტენსიური, ხანგრძლივი სპორტული ვარჯიში, რომელმაც შეიძლება, პირიქით, ფერტილობა შეანელოს',
      'გაწმენდილი შაქრის სიჭარბე, რომელმაც შეიძლება ჰორმონული ბალანსი დაარღვიოს',
    ],
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'ზოგადად დაბალანსებული ჩვევები, სიჭარბისა და პერფექციონიზმის გარეშე, საუკეთესო ყოველდღიური მხარდაჭერაა.',
    shareMessage: 'ცხოვრების წესის ჩვევები და ჩასახვის გზა — AWA',
  },
  hy: {
    badge: 'ԱՊՐԵԼԱԿԵՐՊ',
    title: 'Ապրելակերպի սովորությունները և\nձեր հղիանալու ճանապարհը',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Պարզ սովորություններ, որոնք կարող են աջակցել ձեր ճանապարհին՝ առանց ճնշման:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչը կարող է աջակցել պտղաբերությանը',
      'Սթրեսը՝ չանտեսվող գործոն',
      'Ինչն ավելի լավ է սահմանափակել',
      'Հիմնական եզրակացություն',
    ],
    body1: 'Ապրելակերպի որոշ պարզ սովորություններ կարող են աջակցել հղիանալու ճանապարհին, թեև չեն կարող միայնակ երաշխավորել արդյունք:',
    supportiveHabits: [
      'Հավասարակշռված սննդակարգ',
      'Չափավոր ֆիզիկական ակտիվություն',
      'Որակյալ քուն',
      'Թուլացման պահեր',
    ],
    body2: 'Քրոնիկ սթրեսը կարող է ազդել հորմոնալ հավասարակշռության և, որոշ կանանց մոտ, ցիկլի կանոնավորության վրա: Ինքներդ ձեզ հանդարտության պահեր տալը լիովին ճանապարհի մաս է:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Ամեն ինչ «ճիշտ անելու» ցանկությունը ինքնին կարող է դառնալ սթրեսի աղբյուր. բավական է ձգտել ընդհանուր առմամբ առողջ սովորությունների՝ առանց կատարելապաշտության:',
    toLimit: [
      'Ծխելը, որը կարող է ազդել երկու զուգընկերների պտղաբերության վրա',
      'Ալկոհոլի չափից ավելի օգտագործումը',
      'Ինտենսիվ, երկարատև մարզական պարապմունքները, որոնք, ընդհակառակը, կարող են դանդաղեցնել պտղաբերությունը',
      'Ավելցուկ զտված շաքարը, որը կարող է խաթարել հորմոնալ հավասարակշռությունը',
    ],
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Ընդհանուր առմամբ հավասարակշռված սովորությունները՝ առանց ավելցուկի կամ կատարելապաշտության, լավագույն առօրյա աջակցությունն են:',
    shareMessage: 'Ապրելակերպի սովորությունները և հղիանալու ճանապարհը — AWA',
  },
  tg: {
    badge: 'ТАРЗИ ЗИНДАГӢ',
    title: 'Одатҳои зиндагӣ ва\nроҳи ҳомиладоршавии шумо',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Одатҳои оддие, ки метавонанд роҳи шуморо дастгирӣ кунанд — бе фишор.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Чӣ метавонад ҳосилхезиро дастгирӣ кунад',
      'Стресс, омиле, ки набояд нодида гирифт',
      'Чиро беҳтараш маҳдуд кардан лозим аст',
      'Хулосаи асосӣ',
    ],
    body1: 'Баъзе одатҳои оддии зиндагӣ метавонанд роҳи ҳомиладоршавиро дастгирӣ кунанд, гарчанде ки онҳо худ ба худ натиҷаро кафолат дода наметавонанд.',
    supportiveHabits: [
      'Ғизои мутавозин',
      'Фаъолияти ҷисмонии мӯътадил',
      'Хоби босифат',
      'Лаҳзаҳои ором шудан',
    ],
    body2: 'Стресси музмин метавонад ба тавозуни гормонӣ ва дар баъзе занон ба мунтазамии давра таъсир расонад. Ба худ лаҳзаҳои оромӣ додан қисми пурраи ин роҳ аст.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Хоҳиши «ҳама чизро дуруст кардан» худ метавонад сарчашмаи стресс шавад: кифоя аст, ки ба одатҳои умумӣ солим ҳадаф гиред, бе мукаммалпарастӣ.',
    toLimit: [
      'Тамокукашӣ, ки метавонад ба ҳосилхезии ҳарду шарик таъсир расонад',
      'Истеъмоли аз ҳад зиёди машруботи спиртӣ',
      'Машқҳои варзишии шадид ва дарозмуддат, ки баръакс метавонанд ҳосилхезиро суст кунанд',
      'Қанди тозашудаи зиёд, ки метавонад тавозуни гормониро вайрон кунад',
    ],
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Одатҳои умумӣ мутавозин, бе ифрот ва мукаммалпарастӣ, беҳтарин дастгирии ҳаррӯза мебошанд.',
    shareMessage: 'Одатҳои зиндагӣ ва роҳи ҳомиладоршавӣ — AWA',
  },
  ky: {
    badge: 'ЖАШОО ОБРАЗЫ',
    title: 'Жашоо образынын адаттары жана\nбойго бүтүү жолуңуз',
    metaDuration: '5 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Жолуңузду кысымсыз колдой турган жөнөкөй адаттар.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Бойго бүтүү жөндөмдүүлүгүн эмне колдой алат',
      'Стресс — көз жаздымда калтырбоого тийиш фактор',
      'Эмнени чектөө жакшы',
      'Негизги жыйынтык',
    ],
    body1: 'Айрым жөнөкөй жашоо образынын адаттары бойго бүтүү жолун колдой алат, бирок алар жалгыз натыйжага кепилдик бере албайт.',
    supportiveHabits: [
      'Тең салмактуу тамактануу',
      'Орточо физикалык активдүүлүк',
      'Сапаттуу уйку',
      'Бошоңдоо учурлары',
    ],
    body2: 'Өнөкөт стресс гормондук тең салмактуулукка жана кээ бир аялдарда циклдин үзгүлтүксүздүгүнө таасир этиши мүмкүн. Өзүңүзгө тынчтык учурларын берүү жолдун толук бир бөлүгү.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: '«Баарын туура кылууну» каалоонун өзү стресстин булагына айланышы мүмкүн: кемчиликсиздикке жетпей, жалпысынан ден соолукка пайдалуу адаттарга умтулуу жетиштүү.',
    toLimit: [
      'Тамеки тартуу — ал эки жолдоштун тең бойго бүтүү жөндөмдүүлүгүнө таасир этиши мүмкүн',
      'Алкоголду ашыкча колдонуу',
      'Интенсивдүү, узак спорттук машыгуу — ал, тескерисинче, бойго бүтүү жөндөмдүүлүгүн жайлатышы мүмкүн',
      'Ашыкча тазаланган кант — ал гормондук тең салмактуулукту бузушу мүмкүн',
    ],
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Ашыкча жана кемчиликсиздикке умтулбай, жалпысынан тең салмактуу адаттар эң жакшы күнүмдүк колдоо.',
    shareMessage: 'Жашоо образынын адаттары жана бойго бүтүү жолу — AWA',
  },
  tk: {
    badge: 'DURMUŞ ÝÖRELGESI',
    title: 'Durmuş ýörelgesi endikleri we\nbaşlangyç ýoluňyz',
    metaDuration: '5 min okamak',
    metaType: 'Makala',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Basyşsyz, ýoluňyza goldaw berip biljek ýönekeý endikler.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Göwreli bolmak ukybyna näme goldaw berip biler',
      'Stres, üns bermeli faktor',
      'Näme çäklemek has gowy',
      'Esasy netije',
    ],
    body1: 'Käbir ýönekeý durmuş ýörelgesi endikleri göwreli bolmak ýoluna goldaw berip biler, emma olar ýeke özi netijäni kepillendirip bilmeýär.',
    supportiveHabits: [
      'Deňagramly iýmitlenmek',
      'Ortaça fiziki işjeňlik',
      'Hil taýdan gowy uky',
      'Dynç alyş pursatlary',
    ],
    body2: 'Müzmin stres gormonal deňagramlylyga we käbir aýallarda sikl yzygiderliligine täsir edip biler. Özüňize asudalyk pursatlaryny bermek ýoluň doly bir bölegi.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: '«Hemme zady dogry etmek» islegi özi hem stres çeşmesine öwrülip biler: kämillik gözlemän, umuman saglam endikleri ýörelge etmek ýeterlik.',
    toLimit: [
      'Çilim çekmek, ol iki ýarymyň hem göwreli bolmak ukybyna täsir edip biler',
      'Alkogoly aşa köp içmek',
      'Güýçli, uzak dowam edýän sport maşklary, olar tersine göwreli bolmak ukybyny haýalladyp biler',
      'Aşa köp arassalanan şeker, ol gormonal deňagramlylygy bozup biler',
    ],
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Aşa-kemlik we kämillik gözlemän, umuman deňagramly endikler iň gowy gündelik goldawdyr.',
    shareMessage: 'Durmuş ýörelgesi endikleri we göwreli bolmak ýoly — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ConceptionLifestyleArticleScreen({
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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1}
          </AwaText>

          <View style={styles.daily}>
            {content.supportiveHabits.map((label, index) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={SUPPORTIVE_HABITS_ICONS[index] as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{label}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.toLimit.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
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

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
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
