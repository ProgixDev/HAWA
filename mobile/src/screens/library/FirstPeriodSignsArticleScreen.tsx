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
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';

const ID = 'firstperiod-premiers-signes';

const HERO = require('../../assets/images/library/spm-hero.png');

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these illustrations.
const SIGNS_IMAGES = [
  require('../../assets/images/library/spm-yoga.png'),
  require('../../assets/images/library/flow-texture-mucus.png'),
  require('../../assets/images/library/pain-massage.png'),
  require('../../assets/images/library/spm-woman.png'),
  require('../../assets/images/library/regular-cycle-heartbeat.png'),
] as const;

const RELATED_IMAGES = [
  {
    image: require('../../assets/images/library/popular-flower.png'),
    articleId: 'firstperiod-premieres-regles',
  },
  {
    image: require('../../assets/images/library/flow-colors-hero.png'),
    articleId: 'firstperiod-comment-savoir',
  },
  {
    image: CYCLE_PHASES_HERO,
    articleId: 'cycle-phases-expliquees',
  },
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'PREMIÈRES RÈGLES',
    title: 'Les premiers signes\navant les règles',
    metaDuration: '5 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Ton corps envoie souvent des indices avant l’arrivée des toutes premières règles. Les reconnaître aide à ne pas être surprise.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Des changements progressifs',
      'Les signes à observer',
      'Ce que cela signifie',
    ],
    body1: 'Dans les mois qui précèdent les premières règles, le corps change doucement : la silhouette évolue, la pilosité apparaît par endroits, la transpiration change. Ce sont les effets normaux de la puberté, qui prépare le corps en douceur.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Ces changements n’arrivent pas tous en même temps ni au même rythme d’une personne à l’autre : c’est normal.',
    signs: [
      {title: 'Changements corporels', text: 'Le corps évolue progressivement : silhouette, pilosité, transpiration.'},
      {title: 'Pertes vaginales', text: 'De légères pertes blanchâtres apparaissent souvent quelques mois avant.'},
      {title: 'Douleurs ou tiraillements', text: 'De petites tensions dans le bas-ventre peuvent se faire sentir.'},
      {title: 'Changements d’humeur', text: 'Il est courant de se sentir plus sensible ou irritable que d’habitude.'},
      {title: 'Sensibilité des seins', text: 'Une légère sensibilité ou un gonflement peuvent apparaître.'},
    ],
    body2: 'Ces signes annoncent généralement l’arrivée des premières règles dans les mois qui suivent, sans qu’on puisse prédire une date exacte. Garder une protection à portée de main devient alors une bonne habitude.',
    alertTitle: 'À noter',
    alertText: 'Ces signes restent des repères généraux, jamais une prédiction précise. Chaque corps suit son propre rythme.',
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {title: 'Tes premières règles : à quoi t’attendre', meta: '5 min  ·  Guide'},
      {title: 'Comment savoir si mes premières règles arrivent ?', meta: '5 min  ·  Guide'},
      {title: 'Les différentes phases du cycle', meta: '5 min  ·  Article'},
    ],
    shareMessage: 'Les premiers signes avant les règles — AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'Early signs\nof your first period',
    metaDuration: '5 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Your body often gives hints before your very first period arrives. Recognizing them can help you feel less surprised.',
    contentsTitle: 'In this article',
    topics: [
      'Gradual changes',
      'Signs to watch for',
      'What it means',
    ],
    body1: 'In the months before your first period, your body changes gently: your shape evolves, body hair starts appearing in new places, and sweating changes too. These are normal effects of puberty, gently preparing your body.',
    tip1Title: 'Good to know',
    tip1Text: 'These changes don’t all happen at the same time, or at the same pace, for everyone — that’s completely normal.',
    signs: [
      {title: 'Body changes', text: 'Your body changes gradually: your shape, body hair, and sweating can all shift.'},
      {title: 'Vaginal discharge', text: 'Light, whitish discharge often appears a few months before your first period.'},
      {title: 'Aches or twinges', text: 'You may feel slight tension or twinges in your lower belly.'},
      {title: 'Mood changes', text: 'It’s common to feel more sensitive or irritable than usual.'},
      {title: 'Breast tenderness', text: 'You may notice slight tenderness or swelling.'},
    ],
    body2: 'These signs usually mean your first period will arrive in the following months, though it’s impossible to predict an exact date. Keeping protection close at hand becomes a good habit at this point.',
    alertTitle: 'Please note',
    alertText: 'These signs are general guides, never a precise prediction. Every body follows its own pace.',
    relatedTitle: '♥  You might also like',
    related: [
      {title: 'Your first period: what to expect', meta: '5 min  ·  Guide'},
      {title: 'How do I know if my first period is coming?', meta: '5 min  ·  Guide'},
      {title: 'The different phases of the cycle', meta: '5 min  ·  Article'},
    ],
    shareMessage: 'Early signs before your first period — AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: 'Las primeras señales\nantes de la menstruación',
    metaDuration: '5 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Tu cuerpo suele enviar señales antes de la llegada de tu primera menstruación. Reconocerlas te ayuda a no sentirte sorprendida.',
    contentsTitle: 'En este artículo',
    topics: [
      'Cambios progresivos',
      'Las señales que debes observar',
      'Qué significa todo esto',
    ],
    body1: 'En los meses previos a la primera menstruación, el cuerpo cambia poco a poco: la silueta evoluciona, aparece vello en algunas zonas y la transpiración cambia. Son los efectos normales de la pubertad, que prepara el cuerpo con suavidad.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Estos cambios no ocurren todos al mismo tiempo ni al mismo ritmo en cada persona: es normal.',
    signs: [
      {title: 'Cambios corporales', text: 'El cuerpo evoluciona poco a poco: silueta, vello, transpiración.'},
      {title: 'Secreción vaginal', text: 'Suele aparecer una ligera secreción blanquecina unos meses antes.'},
      {title: 'Dolores o tirones', text: 'Pueden sentirse pequeñas tensiones en la parte baja del vientre.'},
      {title: 'Cambios de humor', text: 'Es habitual sentirse más sensible o irritable de lo normal.'},
      {title: 'Sensibilidad en el pecho', text: 'Puede aparecer una ligera sensibilidad o hinchazón.'},
    ],
    body2: 'Estas señales suelen anunciar la llegada de la primera menstruación en los meses siguientes, aunque no se pueda predecir una fecha exacta. Tener protección a mano se convierte entonces en un buen hábito.',
    alertTitle: 'Ten en cuenta',
    alertText: 'Estas señales son solo indicios generales, nunca una predicción exacta. Cada cuerpo sigue su propio ritmo.',
    relatedTitle: '♥  También te podría gustar',
    related: [
      {title: 'Tu primera menstruación: qué esperar', meta: '5 min  ·  Guía'},
      {title: '¿Cómo saber si se acerca mi primera menstruación?', meta: '5 min  ·  Guía'},
      {title: 'Las distintas fases del ciclo', meta: '5 min  ·  Artículo'},
    ],
    shareMessage: 'Las primeras señales antes de la menstruación — AWA',
  },
  it: {
    badge: 'PRIMO CICLO',
    title: 'I primi segnali\ndel tuo primo ciclo',
    metaDuration: '5 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Il tuo corpo dà spesso dei segnali prima che arrivi il primissimo ciclo. Riconoscerli può aiutarti a sentirti meno sorpresa.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Cambiamenti graduali',
      'Segnali a cui fare attenzione',
      'Cosa significano',
    ],
    body1: 'Nei mesi che precedono il primo ciclo, il tuo corpo cambia dolcemente: la tua figura si modifica, i peli compaiono in nuove zone e cambia anche la sudorazione. Sono effetti normali della pubertà, che prepara con delicatezza il tuo corpo.',
    tip1Title: 'Da sapere',
    tip1Text: 'Questi cambiamenti non avvengono per tutte nello stesso momento né con lo stesso ritmo: è del tutto normale.',
    signs: [
      {
        title: 'Cambiamenti del corpo',
        text: 'Il tuo corpo cambia gradualmente: la figura, i peli e la sudorazione possono modificarsi.',
      },
      {
        title: 'Perdite vaginali',
        text: 'Perdite leggere e biancastre compaiono spesso qualche mese prima del primo ciclo.',
      },
      {
        title: 'Fastidi o fitte',
        text: 'Puoi avvertire una leggera tensione o delle fitte nella parte bassa del ventre.',
      },
      {
        title: 'Cambiamenti d’umore',
        text: 'È comune sentirsi più sensibili o irritabili del solito.',
      },
      {
        title: 'Tensione al seno',
        text: 'Puoi notare una lieve sensibilità o un gonfiore.',
      },
    ],
    body2: 'Questi segnali indicano di solito che il primo ciclo arriverà nei mesi successivi, anche se è impossibile prevedere una data esatta. Tenere a portata di mano una protezione diventa a questo punto una buona abitudine.',
    alertTitle: 'Attenzione',
    alertText: 'Questi segnali sono indicazioni generali, mai una previsione precisa. Ogni corpo segue il proprio ritmo.',
    relatedTitle: '♥  Potrebbe interessarti anche',
    related: [
      {
        title: 'Il tuo primo ciclo: cosa aspettarti',
        meta: '5 min  ·  Guida',
      },
      {
        title: 'Come capisco se sta per arrivare il primo ciclo?',
        meta: '5 min  ·  Guida',
      },
      {
        title: 'Le diverse fasi del ciclo',
        meta: '5 min  ·  Articolo',
      },
    ],
    shareMessage: 'I primi segnali prima del primo ciclo — AWA',
  },
  tr: {
    badge: 'İLK ADET',
    title: 'İlk adetinin\nerken belirtileri',
    metaDuration: '5 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Bedenin, ilk adetin gelmeden önce çoğu zaman bazı ipuçları verir. Bunları tanımak, daha az şaşırmana yardımcı olabilir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Kademeli değişimler',
      'Dikkat edilecek belirtiler',
      'Ne anlama gelir?',
    ],
    body1: 'İlk adetinden önceki aylarda bedenin yavaş yavaş değişir: vücut şeklin gelişir, vücut kıllarının yeni bölgelerde çıkmaya başlar ve terleme de farklılaşır. Bunlar ergenliğin normal etkileridir ve bedenini nazikçe hazırlar.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Bu değişimlerin hepsi herkeste aynı anda ya da aynı hızda olmaz; bu tamamen normaldir.',
    signs: [
      {
        title: 'Vücut değişimleri',
        text: 'Bedenin kademeli olarak değişir: vücut şeklin, vücut kılların ve terlemen farklılaşabilir.',
      },
      {
        title: 'Vajinal akıntı',
        text: 'Hafif, beyazımsı bir akıntı çoğu zaman ilk adetten birkaç ay önce ortaya çıkar.',
      },
      {
        title: 'Sızı ya da kasılmalar',
        text: 'Alt karnında hafif bir gerginlik ya da kasılma hissedebilirsin.',
      },
      {
        title: 'Ruh hali değişimleri',
        text: 'Her zamankinden daha hassas ya da daha alıngan hissetmek yaygındır.',
      },
      {
        title: 'Göğüslerde hassasiyet',
        text: 'Hafif bir hassasiyet ya da şişlik fark edebilirsin.',
      },
    ],
    body2: 'Bu belirtiler genellikle ilk adetinin önümüzdeki aylarda geleceğini gösterir; ancak kesin bir tarih öngörmek mümkün değildir. Bu dönemde yanında koruyucu ped bulundurmak iyi bir alışkanlık olur.',
    alertTitle: 'Lütfen unutma',
    alertText: 'Bu belirtiler genel bir rehberdir, asla kesin bir tahmin değildir. Her beden kendi temposunda ilerler.',
    relatedTitle: '♥  Bunlar da ilgini çekebilir',
    related: [
      {
        title: 'İlk adetin: neler beklemeli?',
        meta: '5 dk  ·  Rehber',
      },
      {
        title: 'İlk adetimin gelmek üzere olduğunu nasıl anlarım?',
        meta: '5 dk  ·  Rehber',
      },
      {
        title: 'Döngünün farklı evreleri',
        meta: '5 dk  ·  Makale',
      },
    ],
    shareMessage: 'İlk adetten önceki erken belirtiler — AWA',
  },
  ru: {
    badge: 'ПЕРВЫЕ МЕСЯЧНЫЕ',
    title: 'Ранние признаки\nпервых месячных',
    metaDuration: '5 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Тело часто подаёт знаки ещё до прихода самых первых месячных. Если их распознать, вы будете меньше удивляться.',
    contentsTitle: 'В этой статье',
    topics: [
      'Постепенные изменения',
      'На какие признаки обратить внимание',
      'Что это значит',
    ],
    body1: 'За несколько месяцев до первых месячных тело мягко меняется: меняются очертания фигуры, волосы на теле начинают появляться в новых местах, меняется и потоотделение. Это нормальные проявления полового созревания, которые постепенно готовят ваше тело.',
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text: 'Эти изменения происходят не у всех одновременно и не в одном и том же темпе — это совершенно нормально.',
    signs: [
      {title: 'Изменения тела', text: 'Тело меняется постепенно: могут меняться фигура, волосы на теле и потоотделение.'},
      {title: 'Влагалищные выделения', text: 'Скудные беловатые выделения часто появляются за несколько месяцев до первых месячных.'},
      {title: 'Ноющие или тянущие ощущения', text: 'Вы можете чувствовать лёгкое напряжение или покалывания внизу живота.'},
      {title: 'Перемены настроения', text: 'Нередко бывает, что вы чувствуете себя более чувствительной или раздражительной, чем обычно.'},
      {title: 'Болезненность груди', text: 'Вы можете заметить лёгкую болезненность или нагрубание.'},
    ],
    body2: 'Эти признаки обычно означают, что первые месячные придут в ближайшие месяцы, хотя точную дату предсказать невозможно. Держать средства гигиены под рукой в этот период — хорошая привычка.',
    alertTitle: 'Обратите внимание',
    alertText: 'Эти признаки — общие ориентиры, а не точный прогноз. У каждого организма свой темп.',
    relatedTitle: '♥  Вам также может понравиться',
    related: [
      {title: 'Ваши первые месячные: чего ожидать', meta: '5 мин  ·  Руководство'},
      {title: 'Как понять, что скоро начнутся первые месячные?', meta: '5 мин  ·  Руководство'},
      {title: 'Разные фазы цикла', meta: '5 мин  ·  Статья'},
    ],
    shareMessage: 'Ранние признаки перед первыми месячными — AWA',
  },
  de: {
    badge: 'ERSTE PERIODE',
    title: 'Frühe Anzeichen\ndeiner ersten Periode',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Dein Körper gibt oft schon Hinweise, bevor deine allererste Periode kommt. Wenn du sie erkennst, bist du weniger überrascht.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Allmähliche Veränderungen',
      'Worauf du achten kannst',
      'Was das bedeutet',
    ],
    body1: 'In den Monaten vor deiner ersten Periode verändert sich dein Körper sanft: Deine Figur wird weiblicher, Körperhaare wachsen an neuen Stellen, und auch das Schwitzen verändert sich. Das sind normale Auswirkungen der Pubertät, die deinen Körper behutsam vorbereiten.',
    tip1Title: 'GUT ZU WISSEN',
    tip1Text: 'Diese Veränderungen passieren nicht bei allen gleichzeitig oder im gleichen Tempo – das ist ganz normal.',
    signs: [
      {title: 'Körperliche Veränderungen', text: 'Dein Körper verändert sich nach und nach: Figur, Körperbehaarung und Schwitzen können sich verändern.'},
      {title: 'Weißfluss', text: 'Leichter, weißlicher Ausfluss tritt oft einige Monate vor der ersten Periode auf.'},
      {title: 'Ziehen oder Unterleibsschmerzen', text: 'Du kannst ein leichtes Spannungsgefühl oder Ziehen im Unterbauch spüren.'},
      {title: 'Stimmungsschwankungen', text: 'Es ist häufig, dass du dich empfindlicher oder gereizter fühlst als sonst.'},
      {title: 'Spannen in der Brust', text: 'Du bemerkst vielleicht ein leichtes Spannen oder eine Schwellung.'},
    ],
    body2: 'Diese Anzeichen bedeuten meist, dass deine erste Periode in den folgenden Monaten kommt – ein genauer Termin lässt sich aber nicht vorhersagen. Schutz griffbereit zu haben, wird jetzt zu einer guten Gewohnheit.',
    alertTitle: 'Bitte beachte',
    alertText: 'Diese Anzeichen sind allgemeine Orientierungshilfen und nie eine genaue Vorhersage. Jeder Körper hat sein eigenes Tempo.',
    relatedTitle: '♥  Das könnte dir auch gefallen',
    related: [
      {title: 'Deine erste Periode: Was dich erwartet', meta: '5 Min.  ·  Ratgeber'},
      {title: 'Woran erkenne ich, dass meine erste Periode bald kommt?', meta: '5 Min.  ·  Ratgeber'},
      {title: 'Die verschiedenen Phasen des Zyklus', meta: '5 Min.  ·  Artikel'},
    ],
    shareMessage: 'Frühe Anzeichen vor deiner ersten Periode – AWA',
  },
  zh: {
      badge: '初潮',
      title: '初潮来临前的\n早期信号',
      metaDuration: '阅读约 5 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '在第一次月经到来之前，身体往往会先给出一些提示。认识这些信号，可以让你不那么意外。',
      contentsTitle: '本文内容',
      topics: [
        '逐渐出现的变化',
        '需要留意的信号',
        '这意味着什么',
      ],
      body1: '在初潮到来前的几个月里，你的身体会温和地发生变化：体型在改变，身体上新的部位开始长出毛发，出汗的情况也有所不同。这些都是青春期的正常表现，是身体在悄悄做准备。',
      tip1Title: '小贴士',
      tip1Text: '这些变化并不会在每个人身上同时出现，节奏也不一样，这完全正常。',
      signs: [
        {
          title: '身体变化',
          text: '你的身体在逐渐变化：体型、体毛和出汗情况都可能有所不同。',
        },
        {
          title: '阴道分泌物',
          text: '初潮前几个月，常会出现少量偏白的分泌物。',
        },
        {
          title: '隐隐作痛或刺痛',
          text: '你可能会感到下腹轻微的紧绷感或刺痛。',
        },
        {
          title: '情绪变化',
          text: '比平时更敏感或更易烦躁，是很常见的。',
        },
        {
          title: '乳房胀痛',
          text: '你可能会注意到乳房有轻微的触痛或胀感。',
        },
      ],
      body2: '这些信号通常意味着初潮会在接下来的几个月内到来，但无法预测确切的日期。这时，随身备好卫生用品会是个好习惯。',
      alertTitle: '请注意',
      alertText: '这些信号只是一般性的参考，绝不是精确的预测。每个人的身体都有自己的节奏。',
      relatedTitle: '♥  你可能还想看',
      related: [
        {
          title: '你的初潮：会有什么变化',
          meta: '5 分钟  ·  指南',
        },
        {
          title: '怎么知道初潮快来了？',
          meta: '5 分钟  ·  指南',
        },
        {
          title: '月经周期的不同阶段',
          meta: '5 分钟  ·  文章',
        },
      ],
      shareMessage: '初潮来临前的早期信号 — AWA',
    },
  id: {
    badge: 'HAID PERTAMA',
    title: 'Tanda-tanda awal\nhaid pertamamu',
    metaDuration: '5 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Tubuhmu sering memberi petunjuk sebelum haid pertamamu tiba. Mengenalinya bisa membantumu tidak terlalu terkejut.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Perubahan bertahap',
      'Tanda yang perlu diperhatikan',
      'Apa artinya',
    ],
    body1: 'Pada bulan-bulan sebelum haid pertamamu, tubuhmu berubah dengan lembut: bentuk tubuhmu berkembang, rambut tubuh mulai tumbuh di tempat-tempat baru, dan cara berkeringatmu pun berubah. Semua ini adalah efek normal masa pubertas yang dengan lembut mempersiapkan tubuhmu.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Perubahan-perubahan ini tidak terjadi bersamaan, atau dengan kecepatan yang sama, pada setiap orang — itu sepenuhnya normal.',
    signs: [
      {
        title: 'Perubahan tubuh',
        text: 'Tubuhmu berubah secara bertahap: bentuk tubuh, rambut tubuh, dan keringat bisa ikut berubah.',
      },
      {
        title: 'Keputihan',
        text: 'Keputihan yang ringan dan berwarna putih sering muncul beberapa bulan sebelum haid pertamamu.',
      },
      {
        title: 'Rasa nyeri atau berdenyut',
        text: 'Kamu mungkin merasakan sedikit tegang atau berdenyut di perut bagian bawah.',
      },
      {
        title: 'Perubahan suasana hati',
        text: 'Wajar jika kamu merasa lebih sensitif atau lebih mudah kesal dari biasanya.',
      },
      {
        title: 'Payudara terasa nyeri',
        text: 'Kamu mungkin merasakan sedikit nyeri atau pembengkakan.',
      },
    ],
    body2: 'Tanda-tanda ini biasanya berarti haid pertamamu akan datang dalam beberapa bulan ke depan, meski tanggal pastinya mustahil diprediksi. Menyiapkan pelindung di dekatmu menjadi kebiasaan yang baik pada tahap ini.',
    alertTitle: 'Harap diperhatikan',
    alertText: 'Tanda-tanda ini hanyalah panduan umum, bukan prediksi yang pasti. Setiap tubuh punya kecepatannya sendiri.',
    relatedTitle: '♥  Kamu mungkin juga suka',
    related: [
      {
        title: 'Haid pertamamu: apa yang bisa diharapkan',
        meta: '5 mnt  ·  Panduan',
      },
      {
        title: 'Bagaimana aku tahu kalau haid pertamaku akan datang?',
        meta: '5 mnt  ·  Panduan',
      },
      {
        title: 'Berbagai fase siklus',
        meta: '5 mnt  ·  Artikel',
      },
    ],
    shareMessage: 'Tanda-tanda awal sebelum haid pertamamu — AWA',
  },
  hi: {
    badge: 'पहला पीरियड',
    title: 'पहले पीरियड\nके शुरुआती संकेत',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'लेख',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'आपका पहला पीरियड आने से पहले अक्सर आपका शरीर कुछ इशारे देता है। इन्हें पहचानने से आप कम हैरान होंगी।',
    contentsTitle: 'इस लेख में',
    topics: [
      'धीरे-धीरे होने वाले बदलाव',
      'किन संकेतों पर ध्यान दें',
      'इसका क्या मतलब है',
    ],
    body1: 'पहले पीरियड से कुछ महीने पहले आपका शरीर धीरे-धीरे बदलता है: शरीर की बनावट बदलती है, नई जगहों पर बाल उगने लगते हैं और पसीना भी अलग तरह से आता है। ये किशोरावस्था के सामान्य असर हैं, जो आपके शरीर को धीरे-धीरे तैयार करते हैं।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'ये सारे बदलाव हर किसी में एक ही समय पर या एक ही रफ़्तार से नहीं होते — यह बिल्कुल सामान्य है।',
    signs: [
      {
        title: 'शरीर में बदलाव',
        text: 'आपका शरीर धीरे-धीरे बदलता है: बनावट, शरीर के बाल और पसीना, सब कुछ बदल सकता है।',
      },
      {
        title: 'योनि से सफ़ेद स्राव',
        text: 'पहले पीरियड से कुछ महीने पहले अक्सर हल्का, सफ़ेदी लिए स्राव आने लगता है।',
      },
      {
        title: 'हल्का दर्द या खिंचाव',
        text: 'आपको पेट के निचले हिस्से में हल्का तनाव या खिंचाव महसूस हो सकता है।',
      },
      {
        title: 'मूड में बदलाव',
        text: 'सामान्य से ज़्यादा संवेदनशील या चिड़चिड़ा महसूस करना आम बात है।',
      },
      {
        title: 'स्तनों में कोमलता',
        text: 'आपको हल्का दर्द या सूजन महसूस हो सकती है।',
      },
    ],
    body2: 'इन संकेतों का आमतौर पर मतलब होता है कि आपका पहला पीरियड अगले कुछ महीनों में आएगा, हालाँकि सटीक तारीख़ बताना संभव नहीं है। इस समय अपने पास सैनिटरी प्रोटेक्शन रखना एक अच्छी आदत है।',
    alertTitle: 'ध्यान दें',
    alertText: 'ये संकेत केवल सामान्य मार्गदर्शन हैं, सटीक अनुमान नहीं। हर शरीर अपनी रफ़्तार से चलता है।',
    relatedTitle: '♥  ये भी आपको पसंद आ सकता है',
    related: [
      {
        title: 'आपका पहला पीरियड: क्या उम्मीद रखें',
        meta: '5 मिनट  ·  गाइड',
      },
      {
        title: 'मुझे कैसे पता चलेगा कि मेरा पहला पीरियड आने वाला है?',
        meta: '5 मिनट  ·  गाइड',
      },
      {
        title: 'मासिक चक्र के अलग-अलग चरण',
        meta: '5 मिनट  ·  लेख',
      },
    ],
    shareMessage: 'पहले पीरियड से पहले के शुरुआती संकेत — AWA',
  },
  sq: {
    badge: 'MENSTRUACIONI I PARË',
    title: 'Shenjat e hershme\ntë menstruacionit të parë',
    metaDuration: '5 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Trupi yt shpesh jep sinjale para se të vijë menstruacioni yt i parë. Njohja e tyre mund të të ndihmojë të ndihesh më pak e befasuar.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Ndryshimet graduale',
      'Shenjat që duhen vëzhguar',
      'Çfarë do të thotë kjo',
    ],
    body1: 'Në muajt para menstruacionit të parë, trupi yt ndryshon butësisht: forma e trupit evoluon, qimet e trupit fillojnë të shfaqen në vende të reja dhe edhe djersitja ndryshon. Këto janë efekte normale të pubertetit, që e përgatisin trupin tënd me qetësi.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Këto ndryshime nuk ndodhin të gjitha në të njëjtën kohë, as me të njëjtin ritëm te të gjitha vajzat — kjo është plotësisht normale.',
    signs: [
      {
        title: 'Ndryshime në trup',
        text: 'Trupi yt ndryshon gradualisht: forma e trupit, qimet e trupit dhe djersitja mund të ndryshojnë.',
      },
      {
        title: 'Sekrecione vaginale',
        text: 'Sekrecione të lehta, të bardhuha shfaqen shpesh disa muaj para menstruacionit të parë.',
      },
      {
        title: 'Dhimbje ose shtrëngime',
        text: 'Mund të ndjesh pak tension ose shtrëngime në pjesën e poshtme të barkut.',
      },
      {
        title: 'Ndryshime të gjendjes shpirtërore',
        text: 'Është e zakonshme të ndihesh më e ndjeshme ose më nervoze se zakonisht.',
      },
      {
        title: 'Ndjeshmëri e gjinjve',
        text: 'Mund të vërejsh një ndjeshmëri ose ënjtje të lehtë.',
      },
    ],
    body2: 'Këto shenja zakonisht tregojnë se menstruacioni yt i parë do të vijë në muajt në vijim, megjithëse është e pamundur të parashikohet një datë e saktë. Të kesh mbrojtje afër bëhet një zakon i mirë në këtë moment.',
    alertTitle: 'Kujdes',
    alertText: 'Këto shenja janë orientime të përgjithshme, kurrë një parashikim i saktë. Çdo trup ndjek ritmin e vet.',
    relatedTitle: '♥  Mund të të pëlqejnë edhe',
    related: [
      {
        title: 'Menstruacioni yt i parë: çfarë të presësh',
        meta: '5 min  ·  Udhëzues',
      },
      {
        title: 'Si e di nëse menstruacioni im i parë po vjen?',
        meta: '5 min  ·  Udhëzues',
      },
      {
        title: 'Fazat e ndryshme të ciklit',
        meta: '5 min  ·  Artikull',
      },
    ],
    shareMessage: 'Shenjat e hershme para menstruacionit të parë — AWA',
  },
  ja: {
    badge: '初経',
    title: '初経の\n前ぶれとなるサイン',
    metaDuration: '読了5分',
    metaType: '記事',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: '初めての生理が来る前に、体がサインを出すことはよくあります。知っておくと、驚きがやわらぎます。',
    contentsTitle: 'この記事の内容',
    topics: [
      '少しずつ起こる変化',
      '気をつけて見たいサイン',
      'サインの意味',
    ],
    body1: '初めての生理の数か月前から、体はゆるやかに変わっていきます。体つきが変化し、これまでなかった場所に体毛が生え始め、汗のかき方も変わります。これらは思春期に見られる自然な変化で、体が少しずつ準備を進めている証拠です。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'こうした変化は、すべてが同時に、同じペースで起こるわけではありません。人それぞれで、まったく自然なことです。',
    signs: [
      {
        title: '体の変化',
        text: '体は少しずつ変わっていきます。体つき、体毛、汗のかき方が変化することがあります。',
      },
      {
        title: 'おりもの',
        text: '初めての生理の数か月前から、白っぽくさらっとしたおりものが出ることがよくあります。',
      },
      {
        title: '下腹部の違和感やチクチクした痛み',
        text: '下腹部に軽いはりやチクチクした痛みを感じることがあります。',
      },
      {
        title: '気分の変化',
        text: 'いつもより敏感になったり、イライラしやすくなったりするのはよくあることです。',
      },
      {
        title: '胸の張り',
        text: '胸に軽い痛みやふくらみを感じることがあります。',
      },
    ],
    body2: 'これらのサインは、たいてい数か月以内に初めての生理が来ることを示していますが、正確な日を予測することはできません。この時期から、ナプキンなどを手元に用意しておく習慣をつけると安心です。',
    alertTitle: 'ご注意',
    alertText: 'これらのサインはあくまでおおよその目安で、正確な予測ではありません。体のペースは人それぞれです。',
    relatedTitle: '♥  こちらもおすすめ',
    related: [
      {
        title: '初めての生理：知っておきたいこと',
        meta: '5分  ·  ガイド',
      },
      {
        title: '初めての生理が近いかどうか、どうすればわかる？',
        meta: '5分  ·  ガイド',
      },
      {
        title: '生理周期のさまざまなフェーズ',
        meta: '5分  ·  記事',
      },
    ],
    shareMessage: '初めての生理の前ぶれとなるサイン — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodSignsArticleScreen({
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

          <AwaText variant="bodyMedium" style={styles.body}>{content.body1}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tip1Text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          {content.signs.map((item, index) => (
            <AwaCard variant="filled" padding="none" key={item.title} style={styles.visualCard}>
              <Image source={SIGNS_IMAGES[index]} resizeMode="cover" style={styles.visualImage} />

              <View style={styles.visualCopy}>
                <AwaText variant="titleSmall" emphasized>{item.title}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>{item.text}</AwaText>
              </View>
            </AwaCard>
          ))}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.alertText}</AwaText>
            </View>
          </AwaCard>
        </View>

        <View style={styles.relatedHeader}>
          <AwaText variant="titleMedium" emphasized>{content.relatedTitle}</AwaText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedRow}>
          {content.related.map((item, index) => (
            <AwaCard variant="filled" padding="none"
              key={item.title}
              onPress={() =>
                navigation.push('ArticleReader', {articleId: RELATED_IMAGES[index].articleId})
              }
              style={styles.relatedCard}>
              <Image
                source={resolveEditorialImage(RELATED_IMAGES[index].image, lang)}
                resizeMode="cover"
                style={styles.relatedImage}
              />

              <View style={styles.relatedCopy}>
                <AwaText variant="labelSmall" emphasized>
                  {item.title}
                </AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.relatedMeta}>{item.meta}</AwaText>
              </View>
            </AwaCard>
          ))}
        </ScrollView>
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
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 3},
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
  relatedHeader: {
    marginTop: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relatedRow: {gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4},
  relatedCard: {
    width: 230,
    minHeight: 105,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  relatedImage: {width: 80, alignSelf: 'stretch'},
  relatedCopy: {flex: 1, padding: 12},
  relatedMeta: {marginTop: 8},
  });
}
