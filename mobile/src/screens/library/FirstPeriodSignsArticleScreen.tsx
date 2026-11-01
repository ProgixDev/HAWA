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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

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
const CONTENT = withBrazilianPortuguese('FirstPeriodSigns', {
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
  ko: {
    badge: '첫 생리',
    title: '첫 생리의\n초기 신호',
    metaDuration: '5분 읽기',
    metaType: '아티클',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '첫 생리가 시작되기 전에 몸이 미리 신호를 보내는 경우가 많아요. 이런 신호를 알아 두면 덜 놀랄 수 있어요.',
    contentsTitle: '이 아티클에서는',
    topics: [
      '점진적인 변화',
      '살펴볼 신호',
      '신호의 의미',
    ],
    body1: '첫 생리 몇 달 전부터 몸은 서서히 변해요. 체형이 달라지고, 새로운 부위에 체모가 나기 시작하고, 땀 나는 방식도 바뀌어요. 모두 사춘기에 나타나는 자연스러운 변화로, 몸이 차근차근 준비하고 있다는 뜻이에요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '이런 변화는 사람마다 같은 때에, 같은 속도로 일어나지 않아요. 그건 아주 자연스러운 일이에요.',
    signs: [
      {
        title: '몸의 변화',
        text: '몸은 서서히 변해요. 체형, 체모, 땀 나는 방식이 모두 달라질 수 있어요.',
      },
      {
        title: '질 분비물',
        text: '첫 생리 몇 달 전부터 연한 흰색 분비물이 나타나는 경우가 많아요.',
      },
      {
        title: '뻐근함이나 콕콕 쑤시는 느낌',
        text: '아랫배가 살짝 당기거나 콕콕 쑤시는 느낌이 들 수 있어요.',
      },
      {
        title: '기분 변화',
        text: '평소보다 더 예민해지거나 짜증이 나는 일이 흔해요.',
      },
      {
        title: '가슴 통증',
        text: '가슴이 약간 아프거나 부은 느낌이 들 수 있어요.',
      },
    ],
    body2: '이런 신호가 보이면 보통 앞으로 몇 달 안에 첫 생리가 찾아와요. 다만 정확한 날짜를 예측하는 것은 불가능해요. 이 시기부터는 생리용품을 가까이에 두는 습관을 들이면 좋아요.',
    alertTitle: '참고하세요',
    alertText: '이런 신호는 일반적인 참고 사항일 뿐, 정확한 예측이 아니에요. 몸마다 각자의 속도가 있어요.',
    relatedTitle: '♥  함께 보면 좋은 글',
    related: [
      {
        title: '첫 생리, 무엇을 기대해야 할까요',
        meta: '5분  ·  가이드',
      },
      {
        title: '첫 생리가 다가오는지 어떻게 알 수 있나요?',
        meta: '5분  ·  가이드',
      },
      {
        title: '생리 주기의 여러 단계',
        meta: '5분  ·  아티클',
      },
    ],
    shareMessage: '첫 생리 전의 초기 신호 — AWA',
  },
  'pt-PT': {
    badge: 'PRIMEIRO PERÍODO',
    title: 'Primeiros sinais\ndo seu primeiro período',
    metaDuration: '5 min de leitura',
    metaType: 'Artigo',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'O seu corpo dá muitas vezes pistas antes de o primeiro período chegar. Reconhecê-las pode ajudar a sentir-se menos surpreendida.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Mudanças graduais',
      'Sinais a observar',
      'O que significam',
    ],
    body1: 'Nos meses que antecedem o primeiro período, o seu corpo muda com suavidade: a silhueta evolui, os pelos começam a surgir em novos locais e a transpiração também se altera. São efeitos normais da puberdade, que preparam o seu corpo com delicadeza.',
    tip1Title: 'Bom saber',
    tip1Text: 'Estas mudanças não acontecem todas ao mesmo tempo, nem ao mesmo ritmo, para todas as raparigas — isso é perfeitamente normal.',
    signs: [
      {
        title: 'Mudanças no corpo',
        text: 'O seu corpo muda gradualmente: a silhueta, os pelos e a transpiração podem alterar-se.',
      },
      {
        title: 'Corrimento vaginal',
        text: 'Um corrimento ligeiro e esbranquiçado surge muitas vezes alguns meses antes do primeiro período.',
      },
      {
        title: 'Dores ou picadas',
        text: 'Pode sentir uma ligeira tensão ou picadas na parte inferior da barriga.',
      },
      {
        title: 'Alterações de humor',
        text: 'É comum sentir-se mais sensível ou irritável do que o habitual.',
      },
      {
        title: 'Sensibilidade nos seios',
        text: 'Pode notar uma ligeira sensibilidade ou inchaço.',
      },
    ],
    body2: 'Estes sinais significam, normalmente, que o primeiro período chegará nos meses seguintes, embora seja impossível prever uma data exata. Ter proteção à mão passa a ser um bom hábito nesta fase.',
    alertTitle: 'Atenção',
    alertText: 'Estes sinais são orientações gerais, nunca uma previsão precisa. Cada corpo segue o seu próprio ritmo.',
    relatedTitle: '♥  Também pode gostar',
    related: [
      {
        title: 'O seu primeiro período: o que esperar',
        meta: '5 min  ·  Guia',
      },
      {
        title: 'Como saber se o meu primeiro período está a chegar?',
        meta: '5 min  ·  Guia',
      },
      {
        title: 'As diferentes fases do ciclo',
        meta: '5 min  ·  Artigo',
      },
    ],
    shareMessage: 'Primeiros sinais antes do primeiro período — AWA',
  },
  bn: {
    badge: 'প্রথম মাসিক',
    title: 'প্রথম মাসিকের\nআগাম লক্ষণ',
    metaDuration: 'পড়তে 5 মিনিট',
    metaType: 'নিবন্ধ',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'আপনার প্রথম মাসিক শুরু হওয়ার আগে শরীর প্রায়ই কিছু ইঙ্গিত দেয়। এগুলো চিনতে পারলে অবাক হওয়ার ভাবটা কমে আসতে পারে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'ধীরে ধীরে পরিবর্তন',
      'যেসব লক্ষণ লক্ষ রাখবেন',
      'এর অর্থ কী',
    ],
    body1: 'প্রথম মাসিকের কয়েক মাস আগে থেকে আপনার শরীর ধীরে ধীরে বদলাতে থাকে: শরীরের গড়ন পরিবর্তিত হয়, নতুন নতুন জায়গায় লোম গজাতে শুরু করে, ঘামের ধরনও বদলায়। এগুলো বয়ঃসন্ধির স্বাভাবিক প্রভাব, যা আলতোভাবে আপনার শরীরকে প্রস্তুত করে তোলে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'এই পরিবর্তনগুলো সবার ক্ষেত্রে একই সময়ে বা একই গতিতে ঘটে না: এটা সম্পূর্ণ স্বাভাবিক।',
    signs: [
      {
        title: 'শরীরের পরিবর্তন',
        text: 'আপনার শরীর ধীরে ধীরে বদলায়: শরীরের গড়ন, লোম ও ঘামের ধরন সবই পাল্টে যেতে পারে।',
      },
      {
        title: 'যোনিপথের স্রাব',
        text: 'প্রথম মাসিকের কয়েক মাস আগে প্রায়ই হালকা, সাদাটে স্রাব দেখা দেয়।',
      },
      {
        title: 'ব্যথা বা খোঁচা লাগা',
        text: 'তলপেটে হালকা টান বা খোঁচা অনুভব করতে পারেন।',
      },
      {
        title: 'মেজাজের পরিবর্তন',
        text: 'স্বাভাবিকের চেয়ে বেশি স্পর্শকাতর বা খিটখিটে লাগা খুবই সাধারণ।',
      },
      {
        title: 'স্তনে স্পর্শকাতরতা',
        text: 'স্তনে হালকা ব্যথা বা ফোলাভাব টের পেতে পারেন।',
      },
    ],
    body2: 'এই লক্ষণগুলো সাধারণত বোঝায় যে পরবর্তী কয়েক মাসের মধ্যে আপনার প্রথম মাসিক শুরু হবে, তবে সঠিক তারিখ আগে থেকে বলা সম্ভব নয়। এই সময়ে সুরক্ষা সামগ্রী হাতের কাছে রাখা একটি ভালো অভ্যাস।',
    alertTitle: 'লক্ষ্য করুন',
    alertText: 'এই লক্ষণগুলো সাধারণ ধারণা মাত্র, কখনোই নির্ভুল পূর্বাভাস নয়। প্রতিটি শরীর নিজের গতিতে চলে।',
    relatedTitle: '♥  আপনার আরও ভালো লাগতে পারে',
    related: [
      {
        title: 'আপনার প্রথম মাসিক: কী আশা করবেন',
        meta: '5 মিনিট  ·  গাইড',
      },
      {
        title: 'প্রথম মাসিক আসছে কি না, কীভাবে বুঝবেন?',
        meta: '5 মিনিট  ·  গাইড',
      },
      {
        title: 'মাসিক চক্রের বিভিন্ন পর্যায়',
        meta: '5 মিনিট  ·  নিবন্ধ',
      },
    ],
    shareMessage: 'প্রথম মাসিকের আগাম লক্ষণ — AWA',
  },
  da: {
    badge: 'FØRSTE MENSTRUATION',
    title: 'Tidlige tegn på\nden første menstruation',
    metaDuration: '5 min læsning',
    metaType: 'Artikel',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Inden din første menstruation begynder, giver kroppen ofte nogle signaler. At genkende dem kan mindske overraskelsen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Gradvise forandringer',
      'Tegn du bør holde øje med',
      'Hvad det betyder',
    ],
    body1: 'I de måneder, der går forud for den første menstruation, begynder din krop gradvist at ændre sig: kroppen former sig, nye steder begynder at få hår, og svedningsmønsteret ændres. Dette er normale pubertetstegn, der forsigtigt forbereder din krop.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Disse forandringer sker ikke på samme tidspunkt eller i samme tempo for alle: det er helt normalt.',
    signs: [
      {
        title: 'Kropsforandringer',
        text: 'Din krop forandrer sig gradvist: kropsform, hårvækst og svedningsmønster kan alle ændre sig.',
      },
      {
        title: 'Vaginal udflåd',
        text: 'Let, hvidlig udflåd opstår ofte et par måneder inden den første menstruation.',
      },
      {
        title: 'Smerter eller stikken',
        text: 'Du kan mærke let trækken eller stikken i den nedre del af maven.',
      },
      {
        title: 'Humørsvingninger',
        text: 'At føle sig mere følsom eller irritabel end normalt er meget almindeligt.',
      },
      {
        title: 'Ømhed i brysterne',
        text: 'Du kan opleve let ømhed eller hævelse i brysterne.',
      },
    ],
    body2: 'Disse tegn indikerer generelt, at din første menstruation sandsynligvis vil komme inden for de næste par måneder, men det er ikke muligt at forudsige den nøjagtige dato på forhånd. Det er en god vane at have beskyttelse ved hånden i denne periode.',
    alertTitle: 'Bemærk',
    alertText: 'Disse tegn er generelle vejledende informationer, aldrig præcise forudsigelser. Enhver krop bevæger sig i sit eget tempo.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'Din første menstruation: hvad du kan forvente',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Hvordan ved jeg, om min første menstruation er på vej?',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Menstruationscyklussens faser',
        meta: '5 min  ·  Artikel',
      },
    ],
    shareMessage: 'Tidlige tegn på den første menstruation — AWA',
  },
  sv: {
    badge: 'FÖRSTE MENSTRUATION',
    title: 'Tidlige tegn på\nden förste menstruation',
    metaDuration: '5 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Inden din förste menstruation begynder, giver kroppen ofta nogle signaler. At genkende dem kan mindske overraskelsen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Gradvise forandringer',
      'Tegn du bör holde öje med',
      'Hvad det betyder',
    ],
    body1: 'I de måneder, der går forud for den förste menstruation, begynder din krop gradvist at ändre sig: kroppen former sig, nye steder begynder at få hår, och svedningsmönsteret ändres. Dette ar normale pubertetstegn, der forsigtigt forbereder din krop.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Disse forandringer sker inte på samme tidspunkt eller i samme tempo for alle: det ar helt normalt.',
    signs: [
      {
        title: 'Kropsforandringer',
        text: 'Din krop forandrer sig gradvist: kropsform, hårväkst och svedningsmönster kan alla ändre sig.',
      },
      {
        title: 'Vaginal udflåd',
        text: 'Let, hvidlig udflåd opstår ofta et par måneder inden den förste menstruation.',
      },
      {
        title: 'Smerter eller stikken',
        text: 'Du kan märke let träkken eller stikken i den nedre del av maven.',
      },
      {
        title: 'Humörsvingninger',
        text: 'At föle sig mere fölsom eller irritabel end normalt ar mycket almindeligt.',
      },
      {
        title: 'Ömhed i brysterne',
        text: 'Du kan opleve let ömhed eller hävelse i brysterne.',
      },
    ],
    body2: 'Disse tegn indikerer generelt, at din förste menstruation sandsynligvis vil komme inden for de näste par måneder, men det ar inte muligt at forudsige den nöjagtige dato på forhånd. Det ar en god vane at have beskyttelse ved hånden i denne periode.',
    alertTitle: 'Bemärk',
    alertText: 'Disse tegn ar generelle vejledende informationer, aldrig präcise forudsigelser. Enhver krop beväger sig i sit eget tempo.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'Din förste menstruation: hvad du kan forvente',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Hvordan ved jeg, om min förste menstruation ar på vej?',
        meta: '5 min  ·  Guide',
      },
      {
        title: 'Menstruationscyklussens faser',
        meta: '5 min  ·  Artikel',
      },
    ],
    shareMessage: 'Tidlige tegn på den förste menstruation — AWA',
  },
  nb: {
    badge: 'FØRSTE MENS',
    title: 'Tidlige tegn\npå den første mensen',
    metaDuration: '5 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Kroppen din gir ofte hint før den aller første mensen kommer. Å kjenne dem igjen kan hjelpe deg å bli mindre overrasket.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Gradvise endringer',
      'Tegn å være oppmerksom på',
      'Hva det betyr',
    ],
    body1: 'I månedene før den første mensen endrer kroppen din seg forsiktig: formen din utvikler seg, kroppshår begynner å vise seg på nye steder, og svettingen endrer seg også. Dette er normale effekter av puberteten, som forsiktig forbereder kroppen din.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Disse endringene skjer ikke på samme tid eller i samme tempo hos alle – det er helt normalt.',
    signs: [
      {title: 'Kroppslige endringer', text: 'Kroppen din endrer seg gradvis: formen, kroppshåret og svettingen kan alle endre seg.'},
      {title: 'Vaginal utflod', text: 'Lett, hvitaktig utflod dukker ofte opp noen måneder før den første mensen.'},
      {title: 'Verking eller napp', text: 'Du kan kjenne lett spenning eller napp i nedre del av magen.'},
      {title: 'Humørsvingninger', text: 'Det er vanlig å føle seg mer følsom eller irritabel enn vanlig.'},
      {title: 'Ømme bryster', text: 'Du kan merke lett ømhet eller hevelse.'},
    ],
    body2: 'Disse tegnene betyr vanligvis at den første mensen kommer i løpet av de følgende månedene, selv om det er umulig å forutsi en nøyaktig dato. Å ha beskyttelse for hånden blir en god vane nå.',
    alertTitle: 'Merk',
    alertText: 'Disse tegnene er generelle pekepinner, aldri en presis prediksjon. Hver kropp følger sitt eget tempo.',
    relatedTitle: '♥  Dette liker du kanskje også',
    related: [
      {title: 'Din første mens: hva du kan forvente', meta: '5 min  ·  Veiledning'},
      {title: 'Hvordan vet jeg at den første mensen er på vei?', meta: '5 min  ·  Veiledning'},
      {title: 'De ulike fasene i syklusen', meta: '5 min  ·  Artikkel'},
    ],
    shareMessage: 'Tidlige tegn før den første mensen – AWA',
  },
  pl: {
    badge: 'PIERWSZA MIESIĄCZKA',
    title: 'Pierwsze oznaki\nnadchodzącej miesiączki',
    metaDuration: '5 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Twoje ciało często daje wskazówki, zanim pojawi się pierwsza miesiączka. Ich rozpoznanie może sprawić, że będziesz mniej zaskoczona.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Stopniowe zmiany',
      'Oznaki, na które warto zwracać uwagę',
      'Co to oznacza',
    ],
    body1: 'W miesiącach poprzedzających pierwszą miesiączkę Twoje ciało delikatnie się zmienia: zmienia się sylwetka, owłosienie pojawia się w nowych miejscach, a także zmienia się pocenie. To normalne skutki dojrzewania, które łagodnie przygotowują Twoje ciało.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Te zmiany nie zachodzą u wszystkich w tym samym czasie ani w tym samym tempie — to zupełnie normalne.',
    signs: [
      {title: 'Zmiany w ciele', text: 'Twoje ciało zmienia się stopniowo: sylwetka, owłosienie i pocenie mogą się zmieniać.'},
      {title: 'Upławy', text: 'Lekkie, białawe upławy często pojawiają się kilka miesięcy przed pierwszą miesiączką.'},
      {title: 'Bóle lub ukłucia', text: 'Możesz czuć lekkie napięcie lub ukłucia w dolnej części brzucha.'},
      {title: 'Zmiany nastroju', text: 'Często jesteś bardziej wrażliwa lub rozdrażniona niż zwykle.'},
      {title: 'Tkliwość piersi', text: 'Możesz zauważyć lekką tkliwość lub obrzęk.'},
    ],
    body2: 'Te oznaki zwykle oznaczają, że pierwsza miesiączka pojawi się w najbliższych miesiącach, choć nie da się przewidzieć dokładnej daty. Trzymanie środków ochrony pod ręką staje się teraz dobrym nawykiem.',
    alertTitle: 'Zwróć uwagę',
    alertText: 'Te oznaki są ogólnymi wskazówkami, nigdy dokładną prognozą. Każde ciało podąża własnym tempem.',
    relatedTitle: '♥  Może Cię też zainteresować',
    related: [
      {title: 'Twoja pierwsza miesiączka: czego się spodziewać', meta: '5 min  ·  Poradnik'},
      {title: 'Jak rozpoznać, że zbliża się moja pierwsza miesiączka?', meta: '5 min  ·  Poradnik'},
      {title: 'Różne fazy cyklu', meta: '5 min  ·  Artykuł'},
    ],
    shareMessage: 'Pierwsze oznaki przed pierwszą miesiączką — AWA',
  },
  uk: {
    badge: 'ПЕРША МЕНСТРУАЦІЯ',
    title: 'Перші ознаки\nпершої менструації',
    metaDuration: '5 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Ваше тіло часто дає підказки, перш ніж настане перша менструація. Їх розпізнавання допоможе вам менше дивуватися.',
    contentsTitle: 'У цій статті',
    topics: [
      'Поступові зміни',
      'Ознаки, на які варто звертати увагу',
      'Що це означає',
    ],
    body1: 'За місяці до першої менструації ваше тіло м’яко змінюється: змінюється фігура, волосся з’являється на нових місцях, змінюється і потовиділення. Це звичайні наслідки статевого дозрівання, що ніжно готують ваше тіло.',
    tip1Title: 'Варто знати',
    tip1Text: 'Ці зміни відбуваються не в усіх одночасно й не в одному темпі — це цілком нормально.',
    signs: [
      {title: 'Зміни тіла', text: 'Ваше тіло змінюється поступово: можуть змінюватися фігура, волосся та потовиділення.'},
      {title: 'Вагінальні виділення', text: 'Легкі білуваті виділення часто з’являються за кілька місяців до першої менструації.'},
      {title: 'Ниючий біль або поколювання', text: 'Ви можете відчувати легке напруження або поколювання внизу живота.'},
      {title: 'Зміни настрою', text: 'Часто ви стаєте чутливішою або дратівливішою, ніж зазвичай.'},
      {title: 'Болючість грудей', text: 'Ви можете помітити легку болючість або набряклість.'},
    ],
    body2: 'Ці ознаки зазвичай означають, що перша менструація настане в найближчі місяці, хоча точну дату передбачити неможливо. Тримати засоби гігієни під рукою тепер стає доброю звичкою.',
    alertTitle: 'Зверніть увагу',
    alertText: 'Ці ознаки — загальні орієнтири, ніколи не точний прогноз. Кожне тіло йде власним темпом.',
    relatedTitle: '♥  Вас також може зацікавити',
    related: [
      {title: 'Ваша перша менструація: чого очікувати', meta: '5 хв  ·  Посібник'},
      {title: 'Як зрозуміти, що наближається моя перша менструація?', meta: '5 хв  ·  Посібник'},
      {title: 'Різні фази циклу', meta: '5 хв  ·  Стаття'},
    ],
    shareMessage: 'Перші ознаки перед першою менструацією — AWA',
  },
  cs: {
    badge: 'PRVNÍ MENSTRUACE',
    title: 'První příznaky\nvaší první menstruace',
    metaDuration: '5 min čtení',
    metaType: 'Článek',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Vaše tělo často dává najevo náznaky, než přijde vaše vůbec první menstruace. Jejich rozpoznání vám může pomoci být méně překvapená.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Postupné změny',
      'Příznaky, kterých si všímat',
      'Co to znamená',
    ],
    body1: 'V měsících před první menstruací se vaše tělo jemně mění: vyvíjí se jeho tvar, ochlupení se začíná objevovat na nových místech a mění se i pocení. Jsou to normální účinky puberty, které vaše tělo jemně připravují.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Tyto změny se u každé dívky neděje všechny ve stejnou dobu ani stejným tempem — to je zcela normální.',
    signs: [
      {title: 'Tělesné změny', text: 'Vaše tělo se postupně mění: může se měnit tvar, ochlupení i pocení.'},
      {title: 'Poševní výtok', text: 'Slabý, bělavý výtok se často objevuje několik měsíců před první menstruací.'},
      {title: 'Bolesti nebo píchání', text: 'V podbřišku můžete cítit mírné napětí nebo píchání.'},
      {title: 'Změny nálady', text: 'Je běžné cítit se citlivější nebo podrážděnější než obvykle.'},
      {title: 'Citlivost prsou', text: 'Můžete si všimnout mírné citlivosti nebo zduření.'},
    ],
    body2: 'Tyto příznaky obvykle znamenají, že první menstruace přijde v následujících měsících, i když přesné datum nelze předpovědět. Mít ochranu poblíž se v této době stává dobrým návykem.',
    alertTitle: 'Upozornění',
    alertText: 'Tyto příznaky jsou obecnými vodítky, nikdy přesnou předpovědí. Každé tělo postupuje vlastním tempem.',
    relatedTitle: '♥  Mohlo by se vám líbit',
    related: [
      {title: 'Vaše první menstruace: co očekávat', meta: '5 min  ·  Průvodce'},
      {title: 'Jak poznám, že se blíží moje první menstruace?', meta: '5 min  ·  Průvodce'},
      {title: 'Jednotlivé fáze cyklu', meta: '5 min  ·  Článek'},
    ],
    shareMessage: 'První příznaky před první menstruací — AWA',
  },
  sk: {
    badge: 'PRVÁ MENŠTRUÁCIA',
    title: 'Prvé znaky\nvašej prvej menštruácie',
    metaDuration: '5 min čítania',
    metaType: 'Článok',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Vaše telo vám často dáva náznaky ešte pred príchodom úplne prvej menštruácie. Ich rozpoznanie vám môže pomôcť byť menej prekvapená.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Postupné zmeny',
      'Znaky, ktoré treba sledovať',
      'Čo to znamená',
    ],
    body1: 'V mesiacoch pred prvou menštruáciou sa vaše telo jemne mení: vyvíja sa vaša postava, ochlpenie sa začína objavovať na nových miestach a mení sa aj potenie. Sú to normálne účinky puberty, ktoré telo jemne pripravujú.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Tieto zmeny nenastávajú u každej súčasne ani rovnakým tempom — je to úplne normálne.',
    signs: [
      {title: 'Telesné zmeny', text: 'Vaše telo sa postupne mení: môže sa meniť postava, ochlpenie aj potenie.'},
      {title: 'Vaginálny výtok', text: 'Svetlý, belavý výtok sa často objaví niekoľko mesiacov pred prvou menštruáciou.'},
      {title: 'Bolesti alebo pichanie', text: 'V podbrušku môžete pociťovať mierne napätie alebo pichanie.'},
      {title: 'Zmeny nálady', text: 'Je bežné cítiť sa citlivejšia alebo podráždenejšia než zvyčajne.'},
      {title: 'Citlivosť prsníkov', text: 'Môžete si všimnúť miernu citlivosť alebo opuch.'},
    ],
    body2: 'Tieto znaky zvyčajne znamenajú, že prvá menštruácia príde v nasledujúcich mesiacoch, hoci presný dátum nemožno predpovedať. V tejto chvíli sa dobrým návykom stáva mať hygienické pomôcky po ruke.',
    alertTitle: 'Upozornenie',
    alertText: 'Tieto znaky sú všeobecné orientačné body, nikdy nie presná predpoveď. Každé telo sleduje svoje vlastné tempo.',
    relatedTitle: '♥  Mohlo by sa vám páčiť',
    related: [
      {title: 'Vaša prvá menštruácia: čo očakávať', meta: '5 min  ·  Sprievodca'},
      {title: 'Ako zistím, či sa blíži moja prvá menštruácia?', meta: '5 min  ·  Sprievodca'},
      {title: 'Jednotlivé fázy cyklu', meta: '5 min  ·  Článok'},
    ],
    shareMessage: 'Prvé znaky pred prvou menštruáciou — AWA',
  },
  hu: {
    badge: 'AZ ELSŐ MENSTRUÁCIÓ',
    title: 'Az első menstruáció\nkorai jelei',
    metaDuration: '5 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A tested gyakran jelez, mielőtt megjönne az első menstruációd. Ezek felismerése segíthet, hogy kevésbé lepődj meg.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Fokozatos változások',
      'Figyelendő jelek',
      'Mit jelent ez',
    ],
    body1: 'Az első menstruáció előtti hónapokban a tested szelíden változik: alakul az alakod, a testszőrzet új helyeken kezd megjelenni, és a verejtékezés is változik. Ezek a pubertás normális hatásai, amelyek szelíden előkészítik a tested.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Ezek a változások nem mindenkinél egyszerre vagy ugyanabban az ütemben jelentkeznek — ez teljesen normális.',
    signs: [
      {title: 'Testi változások', text: 'A tested fokozatosan változik: az alakod, a testszőrzeted és a verejtékezésed is változhat.'},
      {title: 'Hüvelyi folyás', text: 'Világos, fehéres folyás gyakran az első menstruáció előtt néhány hónappal jelenik meg.'},
      {title: 'Fájdalmak vagy szúrások', text: 'Enyhe feszülést vagy szúrást érezhetsz az alhasadban.'},
      {title: 'Hangulatváltozások', text: 'Gyakori, hogy a szokásosnál érzékenyebbnek vagy ingerlékenyebbnek érzed magad.'},
      {title: 'Mellfeszülés', text: 'Enyhe feszülést vagy duzzanatot vehetsz észre.'},
    ],
    body2: 'Ezek a jelek általában azt jelentik, hogy az első menstruációd a következő hónapokban megjön, bár pontos dátumot lehetetlen megjósolni. Ebben a szakaszban jó szokássá válik, hogy kéznél tartod a higiéniai terméket.',
    alertTitle: 'Figyelem',
    alertText: 'Ezek a jelek általános támpontok, soha nem pontos előrejelzések. Minden test a saját ütemében halad.',
    relatedTitle: '♥  Ez is tetszhet',
    related: [
      {title: 'Az első menstruációd: mire számíts', meta: '5 perc  ·  Útmutató'},
      {title: 'Honnan tudom, hogy közeleg az első menstruációm?', meta: '5 perc  ·  Útmutató'},
      {title: 'A ciklus különböző szakaszai', meta: '5 perc  ·  Cikk'},
    ],
    shareMessage: 'Az első jelek az első menstruáció előtt — AWA',
  },
  ro: {
    badge: 'PRIMA MENSTRUAȚIE',
    title: 'Primele semne\nale primei menstruații',
    metaDuration: '5 min de citit',
    metaType: 'Articol',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Corpul tău oferă adesea indicii înainte de sosirea primei menstruații. Recunoașterea lor te poate ajuta să te simți mai puțin surprinsă.',
    contentsTitle: 'În acest articol',
    topics: [
      'Schimbări treptate',
      'Semne de urmărit',
      'Ce înseamnă',
    ],
    body1: 'În lunile dinaintea primei menstruații, corpul tău se schimbă blând: silueta ți se modifică, pe corp încep să apară fire de păr în locuri noi, iar transpirația se schimbă și ea. Acestea sunt efecte normale ale pubertății, care îți pregătesc corpul cu blândețe.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Aceste schimbări nu se produc toate în același timp sau în același ritm la toată lumea — este complet normal.',
    signs: [
      {title: 'Schimbări ale corpului', text: 'Corpul tău se schimbă treptat: silueta, părul de pe corp și transpirația se pot modifica.'},
      {title: 'Secreții vaginale', text: 'Secrețiile ușoare, albicioase apar adesea cu câteva luni înainte de prima menstruație.'},
      {title: 'Dureri sau junghiuri', text: 'Poți simți o ușoară tensiune sau junghiuri în partea de jos a burții.'},
      {title: 'Schimbări de dispoziție', text: 'Este frecvent să te simți mai sensibilă sau mai irascibilă decât de obicei.'},
      {title: 'Sensibilitatea sânilor', text: 'Poți observa o ușoară sensibilitate sau o ușoară umflare.'},
    ],
    body2: 'Aceste semne înseamnă de obicei că prima menstruație va sosi în lunile următoare, deși este imposibil de prezis o dată exactă. A avea o protecție la îndemână devine acum un obicei bun.',
    alertTitle: 'Atenție',
    alertText: 'Aceste semne sunt repere generale, niciodată o previziune precisă. Fiecare corp își urmează propriul ritm.',
    relatedTitle: '♥  Ți-ar putea plăcea și',
    related: [
      {title: 'Prima ta menstruație: la ce să te aștepți', meta: '5 min  ·  Ghid'},
      {title: 'Cum îmi dau seama că prima menstruație se apropie?', meta: '5 min  ·  Ghid'},
      {title: 'Diferitele faze ale ciclului', meta: '5 min  ·  Articol'},
    ],
    shareMessage: 'Primele semne dinaintea primei menstruații — AWA',
  },
  bg: {
    badge: 'ПЪРВА МЕНСТРУАЦИЯ',
    title: 'Първите признаци\nна първата менструация',
    metaDuration: '5 мин четене',
    metaType: 'Статия',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Тялото ти често дава подсказки, преди да дойде най-първата ти менструация. Разпознаването им може да ти помогне да се чувстваш по-малко изненадана.',
    contentsTitle: 'В тази статия',
    topics: [
      'Постепенни промени',
      'Признаци, които да следиш',
      'Какво означава',
    ],
    body1: 'През месеците преди първата менструация тялото ти се променя нежно: формата ти се развива, по тялото започват да се появяват косми на нови места, а потенето също се променя. Това са нормални ефекти на пубертета, които нежно подготвят тялото ти.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Тези промени не настъпват всички по едно и също време или със същото темпо при всички — това е напълно нормално.',
    signs: [
      {title: 'Промени в тялото', text: 'Тялото ти се променя постепенно: формата, космите по тялото и потенето могат да се променят.'},
      {title: 'Вагинални секрети', text: 'Леки, белезникави секрети често се появяват няколко месеца преди първата менструация.'},
      {title: 'Болки или убождания', text: 'Можеш да усетиш лека тежест или убождания в долната част на корема.'},
      {title: 'Промени в настроението', text: 'Често е да се чувстваш по-чувствителна или по-раздразнителна от обичайното.'},
      {title: 'Болезненост на гърдите', text: 'Можеш да забележиш лека болезненост или подуване.'},
    ],
    body2: 'Тези признаци обикновено означават, че първата ти менструация ще дойде през следващите месеци, макар да е невъзможно да се предвиди точна дата. Да имаш защита подръка става добър навик в този момент.',
    alertTitle: 'Обърни внимание',
    alertText: 'Тези признаци са общи ориентири, никога точна прогноза. Всяко тяло следва своя ритъм.',
    relatedTitle: '♥  Може да ти хареса и',
    related: [
      {title: 'Първата ти менструация: какво да очакваш', meta: '5 мин  ·  Ръководство'},
      {title: 'Как да разбера, че първата ми менструация идва?', meta: '5 мин  ·  Ръководство'},
      {title: 'Различните фази на цикъла', meta: '5 мин  ·  Статия'},
    ],
    shareMessage: 'Първите признаци преди първата менструация — AWA',
  },
  sr: {
    badge: 'ПРВА МЕНСТРУАЦИЈА',
    title: 'Рани знаци\nтвоје прве менструације',
    metaDuration: '5 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Твоје тело често даје наговештаје пре него што стигне твоја прва менструација. Њихово препознавање може ти помоћи да будеш мање изненађена.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Постепене промене',
      'Знаци на које треба обратити пажњу',
      'Шта то значи',
    ],
    body1: 'У месецима пре прве менструације твоје тело се нежно мења: облик се развија, длаке почињу да се појављују на новим местима, а мења се и знојење. То су нормални ефекти пубертета, који нежно припрема твоје тело.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Све ове промене се не дешавају у исто време, нити истим темпом код свих — то је потпуно нормално.',
    signs: [
      {title: 'Промене у телу', text: 'Твоје тело се постепено мења: облик, длаке и знојење могу се променити.'},
      {title: 'Вагинални исцедак', text: 'Лаган, беличаст исцедак често се појављује неколико месеци пре прве менструације.'},
      {title: 'Болови или убадања', text: 'Можеш осетити благу напетост или убадања у доњем делу стомака.'},
      {title: 'Промене расположења', text: 'Уобичајено је да се осећаш осетљивије или раздражљивије него обично.'},
      {title: 'Осетљивост дојки', text: 'Можеш приметити благу осетљивост или оток.'},
    ],
    body2: 'Ови знаци обично значе да ће твоја прва менструација стићи у наредним месецима, мада је немогуће предвидети тачан датум. Држање заштите при руци у овом тренутку постаје добра навика.',
    alertTitle: 'Обрати пажњу',
    alertText: 'Ови знаци су општи оријентири, никада прецизно предвиђање. Свако тело прати свој темпо.',
    relatedTitle: '♥  Можда ће ти се свидети и',
    related: [
      {title: 'Твоја прва менструација: шта да очекујеш', meta: '5 мин  ·  Водич'},
      {title: 'Како да знам да ми долази прва менструација?', meta: '5 мин  ·  Водич'},
      {title: 'Различите фазе циклуса', meta: '5 мин  ·  Чланак'},
    ],
    shareMessage: 'Рани знаци пре прве менструације — AWA',
  },
  hr: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Rani znakovi\ntvoje prve menstruacije',
    metaDuration: '5 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Tvoje tijelo često daje naznake prije nego što stigne tvoja prva menstruacija. Njihovo prepoznavanje može ti pomoći da budeš manje iznenađena.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Postupne promjene',
      'Znakovi na koje treba paziti',
      'Što to znači',
    ],
    body1: 'U mjesecima prije prve menstruacije tvoje se tijelo nježno mijenja: oblik se razvija, dlačice se počinju pojavljivati na novim mjestima, a mijenja se i znojenje. To su normalni učinci puberteta koji nježno pripremaju tvoje tijelo.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Sve se te promjene ne događaju u isto vrijeme niti istim tempom kod svih — to je potpuno normalno.',
    signs: [
      {title: 'Promjene na tijelu', text: 'Tvoje se tijelo postupno mijenja: mogu se promijeniti oblik, dlačice i znojenje.'},
      {title: 'Vaginalni iscjedak', text: 'Lagan, bjelkast iscjedak često se pojavljuje nekoliko mjeseci prije prve menstruacije.'},
      {title: 'Bolovi ili grčenje', text: 'Možeš osjetiti blagu napetost ili grčenje u donjem dijelu trbuha.'},
      {title: 'Promjene raspoloženja', text: 'Uobičajeno je osjećati se osjetljivije ili razdražljivije nego inače.'},
      {title: 'Osjetljivost grudi', text: 'Možeš primijetiti blagu osjetljivost ili oticanje.'},
    ],
    body2: 'Ti znakovi obično znače da će prva menstruacija stići u sljedećim mjesecima, iako je nemoguće predvidjeti točan datum. Držati zaštitu pri ruci u ovom trenutku postaje dobra navika.',
    alertTitle: 'Napomena',
    alertText: 'Ti su znakovi opće smjernice, nikad precizno predviđanje. Svako tijelo slijedi vlastiti tempo.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Tvoja prva menstruacija: što očekivati', meta: '5 min  ·  Vodič'},
      {title: 'Kako mogu znati da mi stiže prva menstruacija?', meta: '5 min  ·  Vodič'},
      {title: 'Različite faze ciklusa', meta: '5 min  ·  Članak'},
    ],
    shareMessage: 'Rani znakovi prije prve menstruacije — AWA',
  },
  bs: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Rani znakovi\ntvoje prve menstruacije',
    metaDuration: '5 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Tvoje tijelo često daje naznake prije nego što stigne tvoja prva menstruacija. Njihovo prepoznavanje može ti pomoći da budeš manje iznenađena.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Postupne promjene',
      'Znakovi na koje treba paziti',
      'Što to znači',
    ],
    body1: 'U mjesecima prije prve menstruacije tvoje se tijelo nježno mijenja: oblik se razvija, dlačice se počinju pojavljivati na novim mjestima, a mijenja se i znojenje. To su normalni učinci puberteta koji nježno pripremaju tvoje tijelo.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Sve se te promjene ne događaju u isto vrijeme niti istim tempom kod svih — to je potpuno normalno.',
    signs: [
      {title: 'Promjene na tijelu', text: 'Tvoje se tijelo postupno mijenja: mogu se promijeniti oblik, dlačice i znojenje.'},
      {title: 'Vaginalni iscjedak', text: 'Lagan, bjelkast iscjedak često se pojavljuje nekoliko mjeseci prije prve menstruacije.'},
      {title: 'Bolovi ili grčenje', text: 'Možeš osjetiti blagu napetost ili grčenje u donjem dijelu trbuha.'},
      {title: 'Promjene raspoloženja', text: 'Uobičajeno je osjećati se osjetljivije ili razdražljivije nego inače.'},
      {title: 'Osjetljivost grudi', text: 'Možeš primijetiti blagu osjetljivost ili oticanje.'},
    ],
    body2: 'Ti znakovi obično znače da će prva menstruacija stići u sljedećim mjesecima, iako je nemoguće predvidjeti točan datum. Držati zaštitu pri ruci u ovom trenutku postaje dobra navika.',
    alertTitle: 'Napomena',
    alertText: 'Ti su znakovi opće smjernice, nikad precizno predviđanje. Svako tijelo slijedi vlastiti tempo.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Tvoja prva menstruacija: što očekivati', meta: '5 min  ·  Vodič'},
      {title: 'Kako mogu znati da mi stiže prva menstruacija?', meta: '5 min  ·  Vodič'},
      {title: 'Različite faze ciklusa', meta: '5 min  ·  Članak'},
    ],
    shareMessage: 'Rani znakovi prije prve menstruacije — AWA',
  },
  sl: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Zgodnji znaki\ntvoje prve menstruacije',
    metaDuration: '5 min branja',
    metaType: 'Članek',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Tvoje telo pogosto daje namige, preden pride tvoja prva menstruacija. Njihovo prepoznavanje ti lahko pomaga, da si manj presenečena.',
    contentsTitle: 'V tem članku',
    topics: [
      'Postopne spremembe',
      'Znaki, na katere je treba paziti',
      'Kaj to pomeni',
    ],
    body1: 'V mesecih pred prvo menstruacijo se tvoje telo nežno spreminja: oblika se razvija, dlake se začnejo pojavljati na novih mestih, spreminja se tudi potenje. To so normalni učinki pubertete, ki nežno pripravljajo tvoje telo.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Vse te spremembe se ne dogajajo ob istem času niti z istim tempom pri vseh — to je povsem normalno.',
    signs: [
      {title: 'Spremembe telesa', text: 'Tvoje telo se postopoma spreminja: lahko se spremenijo oblika, dlake in potenje.'},
      {title: 'Nožnični izcedek', text: 'Lahek, beličast izcedek se pogosto pojavi nekaj mesecev pred prvo menstruacijo.'},
      {title: 'Bolečine ali zbadanje', text: 'Lahko začutiš rahlo napetost ali zbadanje v spodnjem delu trebuha.'},
      {title: 'Spremembe razpoloženja', text: 'Običajno je, da si bolj občutljiva ali razdražljiva kot sicer.'},
      {title: 'Občutljivost prsi', text: 'Lahko opaziš rahlo občutljivost ali oteklino.'},
    ],
    body2: 'Ti znaki običajno pomenijo, da bo prva menstruacija prišla v naslednjih mesecih, čeprav je natančnega datuma nemogoče napovedati. Imeti zaščito pri roki v tem trenutku postane dobra navada.',
    alertTitle: 'Opomba',
    alertText: 'Ti znaki so splošne smernice, nikoli natančna napoved. Vsako telo sledi lastnemu tempu.',
    relatedTitle: '♥  Morda ti bo všeč tudi',
    related: [
      {title: 'Tvoja prva menstruacija: kaj pričakovati', meta: '5 min  ·  Vodnik'},
      {title: 'Kako lahko vem, da prihaja moja prva menstruacija?', meta: '5 min  ·  Vodnik'},
      {title: 'Različne faze cikla', meta: '5 min  ·  Članek'},
    ],
    shareMessage: 'Zgodnji znaki pred prvo menstruacijo — AWA',
  },
  ne: {
    badge: 'पहिलो महिनावारी',
    title: 'आफ्नो पहिलो महिनावारीका\nसुरुका संकेतहरू',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'तपाईंको एकदम पहिलो महिनावारी आउनुअघि तपाईंको शरीरले प्रायः सङ्केत दिन्छ। तिनलाई चिन्नाले तपाईंलाई कम आश्चर्य हुन मद्दत गर्न सक्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'क्रमिक परिवर्तनहरू',
      'ध्यान दिनुपर्ने संकेतहरू',
      'यसको अर्थ के हो',
    ],
    body1: 'पहिलो महिनावारी आउनुअघिका महिनाहरूमा, तपाईंको शरीर कोमलतापूर्वक बदलिन्छ: तपाईंको आकार विकसित हुन्छ, नयाँ ठाउँमा रौँ देखिन थाल्छ, र पसिना आउने तरिका पनि फेरिन्छ। यी यौवनका सामान्य असरहरू हुन्, जसले कोमलतापूर्वक तपाईंको शरीरलाई तयार पार्छन्।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'यी परिवर्तनहरू सबैमा एकै समयमा वा एउटै गतिमा हुँदैनन् — यो पूर्ण रूपमा सामान्य हो।',
    signs: [
      {title: 'शरीरमा परिवर्तन', text: 'तपाईंको शरीर बिस्तारै बदलिन्छ: तपाईंको आकार, रौँ र पसिना सबै फेरिन सक्छन्।'},
      {title: 'योनिको स्राव', text: 'हल्का, सेतोजस्तो स्राव प्रायः पहिलो महिनावारी आउनुभन्दा केही महिनाअघि देखिन्छ।'},
      {title: 'दुखाइ वा चिमोटाइ', text: 'तपाईंले तल्लो पेटमा हल्का तनाव वा चिमोटाइ महसुस गर्न सक्नुहुन्छ।'},
      {title: 'मनोदशामा परिवर्तन', text: 'सामान्यभन्दा बढी संवेदनशील वा चिडचिडो महसुस गर्नु सामान्य हो।'},
      {title: 'स्तनमा दुखाइ', text: 'तपाईंले हल्का दुखाइ वा सुन्निने महसुस गर्न सक्नुहुन्छ।'},
    ],
    body2: 'यी संकेतहरूले सामान्यतया तपाईंको पहिलो महिनावारी आगामी महिनाहरूमा आउनेछ भन्ने जनाउँछन्, यद्यपि सही मिति पूर्वानुमान गर्न असम्भव छ। यस बेला सुरक्षा हातमा राख्नु राम्रो बानी बन्छ।',
    alertTitle: 'कृपया ध्यान दिनुहोस्',
    alertText: 'यी संकेतहरू सामान्य मार्गदर्शक हुन्, कहिल्यै सही पूर्वानुमान होइनन्। हरेक शरीरले आफ्नै गति पछ्याउँछ।',
    relatedTitle: '♥  तपाईंलाई यी पनि मन पर्न सक्छन्',
    related: [
      {title: 'तपाईंको पहिलो महिनावारी: के अपेक्षा गर्ने', meta: '5 मिनेट  ·  मार्गदर्शन'},
      {title: 'मेरो पहिलो महिनावारी आउँदै छ भनेर कसरी थाहा पाउने?', meta: '5 मिनेट  ·  मार्गदर्शन'},
      {title: 'चक्रका विभिन्न चरणहरू', meta: '5 मिनेट  ·  लेख'},
    ],
    shareMessage: 'आफ्नो पहिलो महिनावारीअघिका सुरुका संकेतहरू — AWA',
  },
  si: {
    badge: 'පළමු ඔසප්',
    title: 'ඔබේ පළමු ඔසප්වල\nමුල් සලකුණු',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'ලිපිය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ ඉතා පළමු ඔසප් පැමිණීමට පෙර ඔබේ ශරීරය බොහෝ විට ඉඟි ලබා දෙයි. ඒවා හඳුනාගැනීම ඔබට අඩුවෙන් පුදුමයට පත්වීමට උපකාරී විය හැක.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ක්‍රමානුකූල වෙනස්කම්',
      'අවධානයට ලක් කළ යුතු සලකුණු',
      'එයින් අදහස් වන්නේ කුමක්ද',
    ],
    body1: 'ඔබේ පළමු ඔසප්වලට පෙර මාසවල, ඔබේ ශරීරය මෘදුවට වෙනස් වේ: ඔබේ හැඩය වෙනස් වේ, ශරීර රෝම නව ස්ථානවල දිස්වීමට පටන් ගනී, සහ දහඩිය දැමීමද වෙනස් වේ. මේවා ඔබේ ශරීරය මෘදුවට සූදානම් කරන වැඩිවිය පැමිණීමේ සාමාන්‍ය බලපෑම්ය.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'මෙම වෙනස්කම් සෑම කෙනෙකුටම එකම වේලාවේදී හෝ එකම වේගයෙන් සිදු නොවේ — එය සම්පූර්ණයෙන්ම සාමාන්‍යයි.',
    signs: [
      {title: 'ශරීර වෙනස්කම්', text: 'ඔබේ ශරීරය ක්‍රමයෙන් වෙනස් වේ: ඔබේ හැඩය, ශරීර රෝම සහ දහඩිය දැමීම සියල්ල වෙනස් විය හැක.'},
      {title: 'යෝනි ස්‍රාවය', text: 'සැහැල්ලු, සුදුපැහැති ස්‍රාවය බොහෝ විට ඔබේ පළමු ඔසප්වලට මාස කිහිපයකට පෙර දිස් වේ.'},
      {title: 'වේදනා හෝ පිරිමැදීම්', text: 'ඔබේ පහළ බඩේ සුළු ආතතියක් හෝ පිරිමැදීම් ඔබට දැනිය හැක.'},
      {title: 'මනෝභාව වෙනස්වීම්', text: 'සුපුරුදුට වඩා සංවේදී හෝ කෝපශීලී බවක් දැනීම සාමාන්‍යයි.'},
      {title: 'පියයුරු වේදනාව', text: 'ඔබට සුළු වේදනාවක් හෝ ඉදිමීමක් නිරීක්ෂණය කළ හැක.'},
    ],
    body2: 'මෙම සලකුණුවලින් සාමාන්‍යයෙන් අදහස් වන්නේ ඔබේ පළමු ඔසප් ඉදිරි මාසවලදී පැමිණෙන බවයි, නමුත් නිවැරදි දිනයක් පුරෝකථනය කළ නොහැක. ආරක්ෂාව ළඟින් තබාගැනීම මෙම අවස්ථාවේදී හොඳ පුරුද්දක් බවට පත් වේ.',
    alertTitle: 'කරුණාකර සටහන් කරන්න',
    alertText: 'මෙම සලකුණු සාමාන්‍ය මාර්ගෝපදේශ මිස කිසිවිටෙකත් නිවැරදි පුරෝකථනයක් නොවේ. සෑම ශරීරයක්ම තමන්ගේම වේගය අනුගමනය කරයි.',
    relatedTitle: '♥  ඔබට මෙයද වුවමනා විය හැක',
    related: [
      {title: 'ඔබේ පළමු ඔසප්: අපේක්ෂා කළ යුත්තේ කුමක්ද', meta: 'මිනි. 5  ·  මාර්ගෝපදේශය'},
      {title: 'මගේ පළමු ඔසප් පැමිණෙන බව දැනගන්නේ කෙසේද?', meta: 'මිනි. 5  ·  මාර්ගෝපදේශය'},
      {title: 'චක්‍රයේ විවිධ අවධි', meta: 'මිනි. 5  ·  ලිපිය'},
    ],
    shareMessage: 'ඔබේ පළමු ඔසප්වලට පෙර මුල් සලකුණු — AWA',
  },
  th: {
    badge: 'ประจำเดือนครั้งแรก',
    title: 'สัญญาณแรก\nของประจำเดือนครั้งแรก',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'บทความ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ร่างกายของคุณมักให้เบาะแสก่อนประจำเดือนครั้งแรกจะมา การรู้จักสัญญาณเหล่านี้ช่วยให้คุณตกใจน้อยลง',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'การเปลี่ยนแปลงทีละน้อย',
      'สัญญาณที่ควรสังเกต',
      'หมายความว่าอย่างไร',
    ],
    body1: 'ในช่วงหลายเดือนก่อนประจำเดือนครั้งแรก ร่างกายของคุณเปลี่ยนไปอย่างอ่อนโยน: รูปร่างเปลี่ยน ขนบนร่างกายเริ่มขึ้นในที่ใหม่ ๆ และการขับเหงื่อก็เปลี่ยนด้วย นี่เป็นผลปกติของวัยแรกรุ่น ที่ค่อย ๆ เตรียมร่างกายของคุณ',
    tip1Title: 'ควรรู้',
    tip1Text: 'การเปลี่ยนแปลงเหล่านี้ไม่ได้เกิดพร้อมกันหรือในจังหวะเดียวกันสำหรับทุกคน — เป็นเรื่องปกติอย่างสมบูรณ์',
    signs: [
      {title: 'การเปลี่ยนแปลงของร่างกาย', text: 'ร่างกายของคุณเปลี่ยนไปทีละน้อย: รูปร่าง ขนบนร่างกาย และการขับเหงื่ออาจเปลี่ยนไป'},
      {title: 'ตกขาว', text: 'ตกขาวสีขาวขุ่นบาง ๆ มักปรากฏหลายเดือนก่อนประจำเดือนครั้งแรก'},
      {title: 'อาการปวดหรือเสียดท้อง', text: 'คุณอาจรู้สึกตึงหรือเสียดเล็กน้อยที่ท้องน้อย'},
      {title: 'อารมณ์เปลี่ยนแปลง', text: 'เป็นเรื่องปกติที่จะรู้สึกอ่อนไหวหรือหงุดหงิดมากกว่าปกติ'},
      {title: 'เต้านมคัด', text: 'คุณอาจสังเกตเห็นอาการเจ็บหรือบวมเล็กน้อย'},
    ],
    body2: 'สัญญาณเหล่านี้มักหมายความว่าประจำเดือนครั้งแรกจะมาในเดือนถัดไป แม้ไม่สามารถทำนายวันที่แน่นอนได้ การเก็บอุปกรณ์ไว้ใกล้มือกลายเป็นนิสัยที่ดีในช่วงนี้',
    alertTitle: 'โปรดทราบ',
    alertText: 'สัญญาณเหล่านี้เป็นแนวทางทั่วไป ไม่ใช่การทำนายที่แม่นยำ ร่างกายแต่ละคนมีจังหวะของตัวเอง',
    relatedTitle: '♥  คุณอาจสนใจ',
    related: [
      {title: 'ประจำเดือนครั้งแรกของคุณ: สิ่งที่คาดหวังได้', meta: '5 นาที  ·  คู่มือ'},
      {title: 'ฉันรู้ได้อย่างไรว่าประจำเดือนครั้งแรกใกล้มา?', meta: '5 นาที  ·  คู่มือ'},
      {title: 'ระยะต่าง ๆ ของรอบเดือน', meta: '5 นาที  ·  บทความ'},
    ],
    shareMessage: 'สัญญาณแรกก่อนประจำเดือนครั้งแรก — AWA',
  },
  vi: {
    badge: 'KỲ KINH ĐẦU TIÊN',
    title: 'Những dấu hiệu sớm\ncủa kỳ kinh đầu tiên',
    metaDuration: '5 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Cơ thể bạn thường đưa ra những gợi ý trước khi kỳ kinh đầu tiên đến. Nhận ra chúng có thể giúp bạn bớt bất ngờ.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Những thay đổi dần dần',
      'Những dấu hiệu cần chú ý',
      'Điều này có nghĩa là gì',
    ],
    body1: 'Trong những tháng trước kỳ kinh đầu tiên, cơ thể bạn thay đổi nhẹ nhàng: dáng người thay đổi, lông mọc ở những vị trí mới và mồ hôi cũng thay đổi. Đây là những tác động bình thường của tuổi dậy thì, nhẹ nhàng chuẩn bị cho cơ thể bạn.',
    tip1Title: 'Nên biết',
    tip1Text: 'Những thay đổi này không xảy ra cùng lúc hay cùng nhịp độ ở mọi người — điều đó hoàn toàn bình thường.',
    signs: [
      {title: 'Thay đổi cơ thể', text: 'Cơ thể bạn thay đổi dần dần: dáng người, lông và mồ hôi đều có thể thay đổi.'},
      {title: 'Khí hư', text: 'Dịch tiết nhẹ, màu trắng đục thường xuất hiện vài tháng trước kỳ kinh đầu tiên.'},
      {title: 'Đau âm ỉ hoặc nhói', text: 'Bạn có thể cảm thấy hơi căng hoặc nhói ở bụng dưới.'},
      {title: 'Thay đổi tâm trạng', text: 'Cảm thấy nhạy cảm hoặc cáu gắt hơn bình thường là điều phổ biến.'},
      {title: 'Căng tức ngực', text: 'Bạn có thể nhận thấy ngực hơi đau nhức hoặc sưng lên.'},
    ],
    body2: 'Những dấu hiệu này thường có nghĩa là kỳ kinh đầu tiên sẽ đến trong những tháng tiếp theo, dù không thể dự đoán chính xác ngày. Để sản phẩm vệ sinh gần tầm tay trở thành một thói quen tốt vào lúc này.',
    alertTitle: 'Xin lưu ý',
    alertText: 'Những dấu hiệu này chỉ là hướng dẫn chung, không bao giờ là dự đoán chính xác. Mỗi cơ thể đi theo nhịp độ riêng.',
    relatedTitle: '♥  Có thể bạn cũng thích',
    related: [
      {title: 'Kỳ kinh đầu tiên của bạn: điều cần biết', meta: '5 phút  ·  Hướng dẫn'},
      {title: 'Làm sao biết kỳ kinh đầu tiên của tôi sắp đến?', meta: '5 phút  ·  Hướng dẫn'},
      {title: 'Các giai đoạn khác nhau của chu kỳ', meta: '5 phút  ·  Bài viết'},
    ],
    shareMessage: 'Những dấu hiệu sớm trước kỳ kinh đầu tiên — AWA',
  },
  uz: {
    badge: 'BIRINCHI HAYZ',
    title: 'Birinchi hayzning\ndastlabki belgilari',
    metaDuration: '5 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Tanangiz koʻpincha eng birinchi hayz boshlanishidan oldin ishora beradi. Ularni tanish sizni kamroq hayron qoldirishi mumkin.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Asta-sekin oʻzgarishlar',
      'Eʼtibor berish kerak boʻlgan belgilar',
      'Bu nimani anglatadi',
    ],
    body1: 'Birinchi hayzdan oldingi oylarda tanangiz muloyim oʻzgaradi: shaklingiz rivojlanadi, yangi joylarda tuklar chiqa boshlaydi va terlash ham oʻzgaradi. Bu tanangizni muloyim tayyorlayotgan balogʻatga yetishning meʼyoriy taʼsirlari.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Bu oʻzgarishlar hammada bir vaqtda yoki bir xil surʼatda sodir boʻlmaydi — bu mutlaqo normal.',
    signs: [
      {title: 'Tana oʻzgarishlari', text: 'Tanangiz asta-sekin oʻzgaradi: shakli, tuklari va terlashi oʻzgarishi mumkin.'},
      {title: 'Qin ajralmalari', text: 'Yengil, oqish ajralmalar koʻpincha birinchi hayzdan bir necha oy oldin paydo boʻladi.'},
      {title: 'Ogʻriq yoki sanchiqlar', text: 'Qorin pastki qismida yengil taranglik yoki sanchiqlarni sezishingiz mumkin.'},
      {title: 'Kayfiyat oʻzgarishlari', text: 'Odatdagidan sezgirroq yoki jizzakiroq boʻlish keng tarqalgan.'},
      {title: 'Koʻkrakning sezgirligi', text: 'Yengil sezgirlik yoki shishishni sezishingiz mumkin.'},
    ],
    body2: 'Bu belgilar odatda birinchi hayz keyingi oylarda boshlanishini bildiradi, ammo aniq sanani aytib boʻlmaydi. Himoya vositasini yaqin joyda saqlash shu paytda yaxshi odatga aylanadi.',
    alertTitle: 'Eʼtibor bering',
    alertText: 'Bu belgilar umumiy yoʻl-yoʻriq, hech qachon aniq bashorat emas. Har bir tana oʻz surʼatida harakat qiladi.',
    relatedTitle: '♥  Sizga yoqishi mumkin',
    related: [
      {title: 'Birinchi hayzingiz: nimalarni kutish kerak', meta: '5 daq  ·  Qoʻllanma'},
      {title: 'Birinchi hayz yaqinlashayotganini qanday bilaman?', meta: '5 daq  ·  Qoʻllanma'},
      {title: 'Sikl bosqichlari', meta: '5 daq  ·  Maqola'},
    ],
    shareMessage: 'Birinchi hayzdan oldingi dastlabki belgilar — AWA',
  },
  az: {
    badge: 'İLK AYBAŞI',
    title: 'İlk aybaşının\nerkən əlamətləri',
    metaDuration: '5 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Bədəniniz çox vaxt ilk aybaşınız başlamazdan əvvəl işarələr verir. Onları tanımaq daha az təəccüblənməyinizə kömək edə bilər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Tədrici dəyişikliklər',
      'Nəyə diqqət etmək lazımdır',
      'Bunun mənası nədir',
    ],
    body1: 'İlk aybaşıdan əvvəlki aylarda bədəniniz yumşaq şəkildə dəyişir: forma təkamül edir, bədən tükləri yeni yerlərdə görünməyə başlayır, tərləmə də dəyişir. Bunlar yetkinləşmənin normal təsirləridir və bədəninizi yavaş-yavaş hazırlayır.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Bu dəyişikliklərin hamısı hər kəsdə eyni vaxtda və ya eyni templə baş vermir — bu, tamamilə normaldır.',
    signs: [
      {title: 'Bədən dəyişiklikləri', text: 'Bədəniniz tədricən dəyişir: forma, bədən tükləri və tərləmə dəyişə bilər.'},
      {title: 'Vaginal ifrazat', text: 'Yüngül, ağımtıl ifrazat çox vaxt ilk aybaşıdan bir neçə ay əvvəl görünür.'},
      {title: 'Ağrılar və ya sancılar', text: 'Qarının aşağı hissəsində yüngül gərginlik və ya sancı hiss edə bilərsiniz.'},
      {title: 'Əhval dəyişiklikləri', text: 'Həmişəkindən daha həssas və ya əsəbi olmaq adi haldır.'},
      {title: 'Döşün həssaslığı', text: 'Yüngül həssaslıq və ya şişkinlik hiss edə bilərsiniz.'},
    ],
    body2: 'Bu əlamətlər adətən ilk aybaşınızın sonrakı aylarda başlayacağını göstərir, lakin dəqiq tarixi əvvəlcədən demək mümkün deyil. Bu mərhələdə qoruyucu vasitəni əlinizin altında saxlamaq yaxşı vərdişə çevrilir.',
    alertTitle: 'Nəzərə alın',
    alertText: 'Bu əlamətlər ümumi istiqamətlərdir, heç vaxt dəqiq proqnoz deyil. Hər bədən öz tempi ilə irəliləyir.',
    relatedTitle: '♥  Bunlar da xoşunuza gələ bilər',
    related: [
      {title: 'İlk aybaşınız: nələri gözləmək olar', meta: '5 dəq  ·  Bələdçi'},
      {title: 'İlk aybaşımın yaxınlaşdığını necə anlaya bilərəm?', meta: '5 dəq  ·  Bələdçi'},
      {title: 'Dövrün müxtəlif fazaları', meta: '5 dəq  ·  Məqalə'},
    ],
    shareMessage: 'İlk aybaşıdan əvvəlki erkən əlamətlər — AWA',
  },
  ka: {
    badge: 'პირველი მენსტრუაცია',
    title: 'თქვენი პირველი მენსტრუაციის\nადრეული ნიშნები',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'თქვენი სხეული ხშირად გაძლევთ მინიშნებებს ძალიან პირველი მენსტრუაციის მოსვლამდე. მათი ამოცნობა შეიძლება დაგეხმაროთ ნაკლებად გაგიკვირდეთ.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'ეტაპობრივი ცვლილებები',
      'ნიშნები, რომლებსაც უნდა დააკვირდეთ',
      'რას ნიშნავს ეს',
    ],
    body1: 'პირველი მენსტრუაციის წინა თვეებში თქვენი სხეული ნაზად იცვლება: თქვენი ფორმა ვითარდება, სხეულის თმა ახალ ადგილებზე ჩნდება და ოფლიანობაც იცვლება. ეს მოზარდობის ნორმალური ეფექტებია, რომლებიც თქვენს სხეულს ნაზად ამზადებს.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ეს ცვლილებები ყველასთან ერთდროულად ან ერთი და იმავე ტემპით არ ხდება — ეს სრულიად ნორმალურია.',
    signs: [
      {title: 'სხეულის ცვლილებები', text: 'თქვენი სხეული ეტაპობრივად იცვლება: შეიძლება შეიცვალოს თქვენი ფორმა, სხეულის თმა და ოფლიანობა.'},
      {title: 'ვაგინალური გამონადენი', text: 'მსუბუქი, მოთეთრო გამონადენი ხშირად პირველ მენსტრუაციამდე რამდენიმე თვით ადრე ჩნდება.'},
      {title: 'ტკივილები ან ჩხვლეტა', text: 'ქვედა მუცელში შეიძლება მცირედი დაძაბულობა ან ჩხვლეტა იგრძნოთ.'},
      {title: 'ხასიათის ცვლილებები', text: 'ხშირია, რომ ჩვეულებრივზე უფრო მგრძნობიარედ ან გაღიზიანებულად იგრძნოთ თავი.'},
      {title: 'მკერდის სიმტკივნე', text: 'შეიძლება მცირედი სიმტკივნე ან შეშუპება შეამჩნიოთ.'},
    ],
    body2: 'ეს ნიშნები, როგორც წესი, ნიშნავს, რომ თქვენი პირველი მენსტრუაცია მომდევნო თვეებში მოვა, თუმცა ზუსტი თარიღის განჭვრეტა შეუძლებელია. ამ დროს დამცავი საშუალების ხელთ ქონა კარგ ჩვევად იქცევა.',
    alertTitle: 'გაითვალისწინეთ',
    alertText: 'ეს ნიშნები ზოგადი მიმართულებებია და არასდროს ზუსტი პროგნოზი. ყველა სხეული საკუთარ ტემპს მისდევს.',
    relatedTitle: '♥  შეიძლება მოგეწონოთ',
    related: [
      {title: 'თქვენი პირველი მენსტრუაცია: რას უნდა ელოდეთ', meta: '5 წთ  ·  გზამკვლევი'},
      {title: 'როგორ გავიგო, რომ ჩემი პირველი მენსტრუაცია მოდის?', meta: '5 წთ  ·  გზამკვლევი'},
      {title: 'ციკლის სხვადასხვა ფაზა', meta: '5 წთ  ·  სტატია'},
    ],
    shareMessage: 'ადრეული ნიშნები პირველ მენსტრუაციამდე — AWA',
  },
  hy: {
    badge: 'ԱՌԱՋԻՆ ԴԱՇՏԱՆ',
    title: 'Ձեր առաջին դաշտանի\nվաղ նշանները',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ձեր մարմինը հաճախ ակնարկներ է տալիս նախքան ձեր առաջին դաշտանի գալը: Դրանք ճանաչելը կարող է օգնել ձեզ պակաս անակնկալի գալ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Աստիճանական փոփոխություններ',
      'Նշաններ, որոնց պետք է ուշադրություն դարձնել',
      'Ինչ է դա նշանակում',
    ],
    body1: 'Առաջին դաշտանից մի քանի ամիս առաջ ձեր մարմինը մեղմորեն փոխվում է. ձեր կազմվածքը զարգանում է, մարմնի մազերը սկսում են հայտնվել նոր վայրերում, և քրտնարտադրությունը նույնպես փոխվում է: Սրանք սեռական հասունացման նորմալ ազդեցություններ են, որոնք մեղմորեն նախապատրաստում են ձեր մարմինը:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Այս փոփոխությունները բոլորի մոտ չեն տեղի ունենում միաժամանակ կամ նույն տեմպով. դա լիովին նորմալ է:',
    signs: [
      {title: 'Մարմնի փոփոխություններ', text: 'Ձեր մարմինը փոխվում է աստիճանաբար. կազմվածքը, մարմնի մազերը և քրտնարտադրությունը կարող են տեղաշարժվել:'},
      {title: 'Հեշտոցային արտազատուկ', text: 'Թեթև, սպիտակավուն արտազատուկը հաճախ հայտնվում է առաջին դաշտանից մի քանի ամիս առաջ:'},
      {title: 'Ցավեր կամ ծակոցներ', text: 'Կարող եք զգալ թեթև լարվածություն կամ ծակոցներ որովայնի ստորին հատվածում:'},
      {title: 'Տրամադրության փոփոխություններ', text: 'Տարածված է սովորականից ավելի զգայուն կամ դյուրագրգիռ զգալը:'},
      {title: 'Կրծքի ցավոտություն', text: 'Կարող եք նկատել թեթև ցավոտություն կամ այտուցվածություն:'},
    ],
    body2: 'Այս նշանները սովորաբար նշանակում են, որ ձեր առաջին դաշտանը կգա հաջորդ ամիսների ընթացքում, թեև ճշգրիտ ամսաթիվը կանխատեսել անհնար է: Այս պահից պաշտպանության միջոց ձեռքի տակ պահելը դառնում է լավ սովորություն:',
    alertTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    alertText: 'Այս նշանները ընդհանուր ուղենիշներ են, երբեք ճշգրիտ կանխատեսում: Յուրաքանչյուր մարմին հետևում է իր տեմպին:',
    relatedTitle: '♥  Ձեզ կարող է նաև հետաքրքրել',
    related: [
      {title: 'Ձեր առաջին դաշտանը. ինչ սպասել', meta: '5 ր  ·  Ուղեցույց'},
      {title: 'Ինչպե՞ս իմանալ, որ առաջին դաշտանս մոտենում է', meta: '5 ր  ·  Ուղեցույց'},
      {title: 'Ցիկլի տարբեր փուլերը', meta: '5 ր  ·  Հոդված'},
    ],
    shareMessage: 'Վաղ նշաններ ձեր առաջին դաշտանից առաջ — AWA',
  },
  tg: {
    badge: 'ҲАЙЗИ АВВАЛ',
    title: 'Нишонаҳои барвақти\nҳайзи аввали шумо',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Бадани шумо аксар вақт пеш аз омадани ҳайзи аввал ишораҳо медиҳад. Шинохтани онҳо метавонад ба шумо кумак кунад камтар ҳайрон шавед.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Тағйироти тадриҷӣ',
      'Нишонаҳое, ки бояд пайгирӣ кард',
      'Ин чӣ маъно дорад',
    ],
    body1: 'Дар моҳҳои пеш аз ҳайзи аввал бадани шумо мулоимона тағйир меёбад: шакли шумо дигар мешавад, мӯйҳои бадан дар ҷойҳои нав пайдо мешаванд ва арақкунӣ низ тағйир мекунад. Инҳо таъсироти муқаррарии балоғатанд, ки бадани шуморо мулоимона омода мекунанд.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Ин тағйирот на барои ҳама дар як вақт ва бо як суръат рух медиҳад — ин комилан муқаррарӣ аст.',
    signs: [
      {title: 'Тағйироти бадан', text: 'Бадани шумо тадриҷан тағйир меёбад: шакл, мӯйҳои бадан ва арақкунӣ метавонанд дигар шаванд.'},
      {title: 'Тарашшуҳи маҳбал', text: 'Тарашшуҳи сабук ва сафедтоб аксар вақт чанд моҳ пеш аз ҳайзи аввал пайдо мешавад.'},
      {title: 'Дардҳо ё кашишҳо', text: 'Шумо метавонед шиддати сабук ё кашишро дар поёни шикам эҳсос кунед.'},
      {title: 'Тағйироти кайфият', text: 'Маъмул аст, ки назар ба муқаррарӣ ҳассостар ё асабонитар шавед.'},
      {title: 'Ҳассосияти пистон', text: 'Шумо метавонед ҳассосият ё варами сабукро мушоҳида кунед.'},
    ],
    body2: 'Ин нишонаҳо одатан маънои онро доранд, ки ҳайзи аввали шумо дар моҳҳои оянда меояд, гарчанде ки пешгӯии санаи дақиқ имконнопазир аст. Воситаи муҳофизатро дар дастрас доштан дар ин лаҳза одати хуб мешавад.',
    alertTitle: 'Таваҷҷӯҳ кунед',
    alertText: 'Ин нишонаҳо роҳнамоҳои умумӣ мебошанд, ҳеҷ гоҳ пешгӯии дақиқ нестанд. Ҳар бадан суръати худро пайравӣ мекунад.',
    relatedTitle: '♥  Шояд ба шумо ҳам маъқул шавад',
    related: [
      {title: 'Ҳайзи аввали шумо: чӣ интизор шудан лозим аст', meta: '5 дақ  ·  Роҳнамо'},
      {title: 'Чӣ тавр бифаҳмам, ки ҳайзи аввалам меояд?', meta: '5 дақ  ·  Роҳнамо'},
      {title: 'Марҳилаҳои гуногуни давра', meta: '5 дақ  ·  Мақола'},
    ],
    shareMessage: 'Нишонаҳои барвақт пеш аз ҳайзи аввал — AWA',
  },
  ky: {
    badge: 'БИРИНЧИ ЕТЕК КИРИМ',
    title: 'Биринчи етек киримдин\nалгачкы белгилери',
    metaDuration: '5 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Эң биринчи етек кирим келгенге чейин денеңиз көбүнчө ишараттарды берет. Аларды таануу азыраак таң калууга жардам бериши мүмкүн.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Акырындык менен болгон өзгөрүүлөр',
      'Көңүл бура турган белгилер',
      'Бул эмнени билдирет',
    ],
    body1: 'Биринчи етек киримден мурунку айларда денеңиз жумшак өзгөрөт: формаңыз өзгөрөт, денеде түк жаңы жерлерде пайда боло баштайт жана тердөө да өзгөрөт. Булар денеңизди акырын даярдаган балагатка жетүүнүн кадимки таасирлери.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Бул өзгөрүүлөр баарында бир эле убакта же бир эле темпте болбойт — бул толугу менен кадимки көрүнүш.',
    signs: [
      {title: 'Дененин өзгөрүүлөрү', text: 'Денеңиз акырындап өзгөрөт: формаңыз, денедеги түк жана тердөө өзгөрүшү мүмкүн.'},
      {title: 'Кынаптан бөлүнүп чыгуу', text: 'Жеңил, агыш бөлүнүп чыгуу көбүнчө биринчи етек киримден бир нече ай мурун пайда болот.'},
      {title: 'Оору же тартылуу', text: 'Курсактын ылдый жагында бир аз чыңалууну же тартылууну сезиш мүмкүн.'},
      {title: 'Маанайдын өзгөрүшү', text: 'Адаттагыдан сезгичирээк же ачуулуураак болуу кеңири таралган.'},
      {title: 'Көкүрөктүн сезгичтиги', text: 'Бир аз сезгичтикти же шишикти байкашыңыз мүмкүн.'},
    ],
    body2: 'Бул белгилер адатта биринчи етек кирим кийинки айларда келерин билдирет, бирок так күндү алдын ала айтуу мүмкүн эмес. Коргонуу каражатын жакын жерде сактоо бул учурда жакшы адатка айланат.',
    alertTitle: 'Көңүл буруңуз',
    alertText: 'Бул белгилер жалпы багыт, эч качан так болжолдоо эмес. Ар бир дене өз темпин ээрчийт.',
    relatedTitle: '♥  Сизге дагы жагышы мүмкүн',
    related: [
      {title: 'Биринчи етек кирим: эмне күтүү керек', meta: '5 мүн  ·  Колдонмо'},
      {title: 'Биринчи етек кирим келе жатканын кантип билем?', meta: '5 мүн  ·  Колдонмо'},
      {title: 'Циклдин ар кандай фазалары', meta: '5 мүн  ·  Макала'},
    ],
    shareMessage: 'Биринчи етек киримден мурунку алгачкы белгилер — AWA',
  },
  tk: {
    badge: 'ILKINJI AÝBAŞY',
    title: 'Ilkinji aýbaşyňyzyň\nir alamatlary',
    metaDuration: '5 min okamak',
    metaType: 'Makala',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Bedeniňiz iň ilkinji aýbaşyňyz gelmezden öň köplenç yşaratlar berýär. Olary tanamak has az geň galmaga kömek edip biler.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Ýuwaş-ýuwaşdan üýtgeşmeler',
      'Üns bermeli alamatlar',
      'Bu nämäni aňladýar',
    ],
    body1: 'Ilkinji aýbaşyňyzdan öňki aýlarda bedeniňiz ýuwaşlyk bilen üýtgeýär: görnüşiňiz üýtgeýär, bedeniň tüýleri täze ýerlerde peýda bolup başlaýar we derlemek hem üýtgeýär. Bu bedeniňizi ýuwaşlyk bilen taýýarlaýan ýetginjeklik döwrüniň adaty täsirleri.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Bu üýtgeşmeleriň hemmesi hemmeler üçin bir wagtda ýa-da şol bir çaltlykda bolmaýar — bu doly adaty zat.',
    signs: [
      {title: 'Beden üýtgeşmeleri', text: 'Bedeniňiz ýuwaş-ýuwaşdan üýtgeýär: görnüşiňiz, bedeniň tüýleri we derlemek üýtgäp biler.'},
      {title: 'Jynsy ýoldan bölünip çykyş', text: 'Ýeňil, ak reňkli bölünip çykyş köplenç ilkinji aýbaşydan birnäçe aý öň peýda bolýar.'},
      {title: 'Agyrylar ýa-da çekişmeler', text: 'Garnyň aşagynda ýeňil dartgynlygy ýa-da çekişmeleri duýup bilersiňiz.'},
      {title: 'Keýp üýtgeşmeleri', text: 'Adatdakydan has duýgur ýa-da gaharjaň bolmak adaty zat.'},
      {title: 'Döşüň duýgurlygy', text: 'Ýeňil duýgurlygy ýa-da çişmegi görüp bilersiňiz.'},
    ],
    body2: 'Bu alamatlar adatça ilkinji aýbaşyňyzyň indiki aýlarda geljekdigini aňladýar, ýöne takyk senäni öňünden aýtmak mümkin däl. Goranyş serişdesini el ýetimde saklamak bu wagt gowy endige öwrülýär.',
    alertTitle: 'Üns beriň',
    alertText: 'Bu alamatlar umumy ugrukdyrmalar, hiç haçan takyk çaklama däl. Her beden öz ritmine eýerýär.',
    relatedTitle: '♥  Size ýarap biler',
    related: [
      {title: 'Ilkinji aýbaşyňyz: nämä garaşmaly', meta: '5 min  ·  Gollanma'},
      {title: 'Ilkinji aýbaşymyň gelýändigini nädip bilmeli?', meta: '5 min  ·  Gollanma'},
      {title: 'Sikliň dürli tapgyrlary', meta: '5 min  ·  Makala'},
    ],
    shareMessage: 'Ilkinji aýbaşyňyzdan öňki ir alamatlar — AWA',
  },
  ms: {
    badge: 'HAID PERTAMA',
    title: 'Tanda awal\nhaid pertama anda',
    metaDuration: '5 min bacaan',
    metaType: 'Artikel',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Tubuh anda selalunya memberi petunjuk sebelum haid pertama anda tiba. Mengenalinya boleh membantu anda berasa kurang terkejut.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Perubahan beransur-ansur',
      'Tanda yang perlu diperhatikan',
      'Apa maksudnya',
    ],
    body1: 'Pada bulan-bulan sebelum haid pertama anda, tubuh anda berubah dengan lembut: bentuk badan berkembang, bulu badan mula tumbuh di tempat baharu dan peluh juga berubah. Ini ialah kesan normal akil baligh, yang menyediakan tubuh anda dengan perlahan.',
    tip1Title: 'Elok diketahui',
    tip1Text: 'Perubahan ini tidak berlaku serentak, atau dengan kadar yang sama, bagi semua orang — itu sepenuhnya normal.',
    signs: [
      {title: 'Perubahan tubuh', text: 'Tubuh anda berubah secara beransur-ansur: bentuk badan, bulu badan dan peluh semuanya boleh berubah.'},
      {title: 'Lelehan faraj', text: 'Lelehan keputihan yang ringan selalunya muncul beberapa bulan sebelum haid pertama anda.'},
      {title: 'Sakit atau rasa mencucuk', text: 'Anda mungkin berasa sedikit tegang atau rasa mencucuk di perut bawah.'},
      {title: 'Perubahan emosi', text: 'Adalah lazim untuk berasa lebih sensitif atau lebih mudah marah daripada biasa.'},
      {title: 'Payudara sakit', text: 'Anda mungkin perasan sedikit rasa sakit atau bengkak.'},
    ],
    body2: 'Tanda-tanda ini biasanya bermakna haid pertama anda akan tiba dalam beberapa bulan berikutnya, walaupun mustahil untuk meramal tarikh yang tepat. Menyimpan perlindungan berdekatan menjadi tabiat yang baik pada masa ini.',
    alertTitle: 'Sila ambil perhatian',
    alertText: 'Tanda-tanda ini ialah panduan umum, bukan ramalan yang tepat. Setiap tubuh mengikut rentaknya sendiri.',
    relatedTitle: '♥  Anda mungkin juga suka',
    related: [
      {title: 'Haid pertama anda: apa yang dijangka', meta: '5 min  ·  Panduan'},
      {title: 'Bagaimana saya tahu haid pertama saya akan datang?', meta: '5 min  ·  Panduan'},
      {title: 'Pelbagai fasa kitaran', meta: '5 min  ·  Artikel'},
    ],
    shareMessage: 'Tanda awal sebelum haid pertama anda — AWA',
  },
  so: {
    badge: 'CAADADA UGU HORREYSA',
    title: 'Calaamadaha hore\nee caadadaada ugu horreysa',
    metaDuration: '5 daq akhris',
    metaType: 'Maqaal',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Jidhkaagu inta badan wuxuu bixiyaa tilmaamo ka hor intaysan imaan caadadaadii ugu horreysay. Aqoonsigooda ayaa kaa caawin kara inaadan la yaabin.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Isbeddello tartiib ah',
      'Calaamadaha la eego',
      'Waxa ay macnaheedu yahay',
    ],
    body1: 'Bilaha ka horreeya caadadaada ugu horreysa, jidhkaagu si jilicsan ayuu isu beddelaa: qaabkaagu wuu kobcaa, timaha jidhka waxay ka bilaabmaan meelo cusub, dhididkuna sidoo kale wuu isbeddelaa. Kuwani waa saameynta caadiga ah ee qaangaarka, oo si jilicsan jidhkaaga u diyaarinaya.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text: 'Isbeddeladan dhammaantood isku mar ama isku xawaare kuma dhacaan qof kasta — tani waa gabi ahaanba caadi.',
    signs: [
      {title: 'Isbeddelada jidhka', text: 'Jidhkaagu tartiib ayuu isu beddelaa: qaabkaaga, timaha jidhka, iyo dhididku dhammaantood way isbeddeli karaan.'},
      {title: 'Dheecaanka xiniinyaha', text: 'Dheecaan fudud, cadcad inta badan wuxuu soo muuqdaa dhowr bilood ka hor caadadaada ugu horreysa.'},
      {title: 'Xanuun yar ama qallal', text: 'Waxaad dareemi kartaa xiisad yar ama qallal calooshaada hoose.'},
      {title: 'Isbeddelka niyadda', text: 'Waa caadi in aad dareento dareen-xanaaq ama cadho ka badan caadiga.'},
      {title: 'Xanuunka naasaha', text: 'Waxaad ogaan kartaa xanuun yar ama barar.'},
    ],
    body2: 'Calaamadahani inta badan waxay muujiyaan in caadadaada ugu horreysa ay imaanayso bilaha soo socda, in kasta oo aan suurtagal ahayn in la saadaaliyo taariikh sax ah. Haysashada ilaalin dhow waxay noqotaa caado wanaagsan heerkan.',
    alertTitle: 'Fadlan ogow',
    alertText: 'Calaamadahani waa tilmaamo guud, marnaba saadaal sax ah. Jidh kastaa wuxuu raacaa xawaarihiisa.',
    relatedTitle: '♥  Waxaad sidoo kale jeclaan kartaa',
    related: [
      {title: 'Caadadaada ugu horreysa: waxa la filayo', meta: '5 daq  ·  Hage'},
      {title: 'Sidee ayaan u ogaadaa in caadadaydii ugu horreysay imaanayso?', meta: '5 daq  ·  Hage'},
      {title: 'Marxaladaha kala duwan ee wareegga', meta: '5 daq  ·  Maqaal'},
    ],
    shareMessage: 'Calaamadaha hore ka hor caadadaada ugu horreysa — AWA',
  },
  sw: {
    badge: 'HEDHI YA KWANZA',
    title: 'Dalili za mapema\nza hedhi yako ya kwanza',
    metaDuration: 'Dakika 5 za kusoma',
    metaType: 'Makala',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Mwili wako mara nyingi hutoa vidokezo kabla ya hedhi yako ya kwanza kabisa kufika. Kuvitambua kunaweza kukusaidia kushangaa kidogo.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Mabadiliko ya polepole',
      'Dalili za kuzingatia',
      'Inamaanisha nini',
    ],
    body1: 'Katika miezi kabla ya hedhi yako ya kwanza, mwili wako hubadilika taratibu: umbo lako linabadilika, nywele za mwilini zinaanza kuonekana sehemu mpya, na jasho pia hubadilika. Haya ni athari za kawaida za balehe, zinazoandaa mwili wako taratibu.',
    tip1Title: 'Vyema kujua',
    tip1Text: 'Mabadiliko haya hayatokei yote kwa wakati mmoja, wala kwa mwendo ule ule, kwa kila mtu — hilo ni la kawaida kabisa.',
    signs: [
      {title: 'Mabadiliko ya mwili', text: 'Mwili wako hubadilika polepole: umbo lako, nywele za mwilini, na jasho vyote vinaweza kubadilika.'},
      {title: 'Ute ukeni', text: 'Ute mweupe mwepesi mara nyingi huonekana miezi michache kabla ya hedhi yako ya kwanza.'},
      {title: 'Maumivu madogo au mikakamao', text: 'Unaweza kuhisi mvutano mdogo au mikakamao kwenye tumbo la chini.'},
      {title: 'Mabadiliko ya hali ya moyo', text: 'Ni kawaida kujisikia mwenye hisia kali zaidi au mwenye hasira kuliko kawaida.'},
      {title: 'Maumivu ya matiti', text: 'Unaweza kuona maumivu kidogo au uvimbe.'},
    ],
    body2: 'Dalili hizi kwa kawaida humaanisha hedhi yako ya kwanza itafika katika miezi inayofuata, ingawa haiwezekani kutabiri tarehe kamili. Kuweka kinga karibu inakuwa tabia nzuri katika hatua hii.',
    alertTitle: 'Tafadhali zingatia',
    alertText: 'Dalili hizi ni miongozo ya jumla, kamwe si utabiri sahihi. Kila mwili hufuata mwendo wake.',
    relatedTitle: '♥  Huenda pia ukapenda',
    related: [
      {title: 'Hedhi yako ya kwanza: nini cha kutarajia', meta: 'Dakika 5  ·  Mwongozo'},
      {title: 'Nitajuaje kama hedhi yangu ya kwanza inakuja?', meta: 'Dakika 5  ·  Mwongozo'},
      {title: 'Awamu tofauti za mzunguko', meta: 'Dakika 5  ·  Makala'},
    ],
    shareMessage: 'Dalili za mapema kabla ya hedhi yako ya kwanza — AWA',
  },
  kk: {
    badge: 'АЛҒАШҚЫ ЕТЕККІР',
    title: 'Алғашқы етеккіріңіздің\nерте белгілері',
    metaDuration: '5 мин оқу',
    metaType: 'Мақала',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Денеңіз көбіне ең алғашқы етеккіріңіз келмес бұрын белгі береді. Оларды тану таң қалуыңызды азайтуға көмектесе алады.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Біртіндеп өзгерістер',
      'Назар аударатын белгілер',
      'Бұл нені білдіреді',
    ],
    body1: 'Алғашқы етеккірге дейінгі айларда денеңіз жұмсақ түрде өзгереді: пішініңіз дамиды, дене түктері жаңа жерлерде пайда бола бастайды, терлеу де өзгереді. Бұл — жыныстық жетілудің қалыпты әсерлері, олар денеңізді жұмсақ дайындайды.',
    tip1Title: 'Білуге тиісті',
    tip1Text: 'Бұл өзгерістердің бәрі бір уақытта немесе бәріне бірдей қарқында болмайды — бұл мүлдем қалыпты.',
    signs: [
      {title: 'Дене өзгерістері', text: 'Денеңіз біртіндеп өзгереді: пішініңіз, дене түктері және терлеу өзгеруі мүмкін.'},
      {title: 'Қынаптан бөлінді', text: 'Жеңіл, ақшыл бөлінділер көбіне алғашқы етеккірден бірнеше ай бұрын пайда болады.'},
      {title: 'Ауырсыну немесе құрысу', text: 'Іштің төменгі жағында жеңіл керілу немесе құрысуды сезуіңіз мүмкін.'},
      {title: 'Көңіл-күйдің өзгеруі', text: 'Әдеттегіден сезімталырақ немесе ашушаңырақ болу жиі кездеседі.'},
      {title: 'Емшектің ауыруы', text: 'Жеңіл сезімталдықты немесе ісінуді байқауыңыз мүмкін.'},
    ],
    body2: 'Бұл белгілер әдетте алғашқы етеккіріңіздің келесі айларда келетінін білдіреді, дегенмен нақты күнді болжау мүмкін емес. Қорғаныс құралын қолда ұстау бұл кезеңде жақсы әдетке айналады.',
    alertTitle: 'Назар аударыңыз',
    alertText: 'Бұл белгілер — жалпы бағдар, ешқашан нақты болжам емес. Әр дене өз қарқынымен жүреді.',
    relatedTitle: '♥  Сізге де ұнауы мүмкін',
    related: [
      {title: 'Алғашқы етеккіріңіз: нені күту керек', meta: '5 мин  ·  Нұсқаулық'},
      {title: 'Алғашқы етеккірімнің келетінін қалай білемін?', meta: '5 мин  ·  Нұсқаулық'},
      {title: 'Циклдің әртүрлі фазалары', meta: '5 мин  ·  Мақала'},
    ],
    shareMessage: 'Алғашқы етеккірге дейінгі ерте белгілер — AWA',
  },
  wo: {
    badge: 'RÈGLE BU NJËKK',
    title: 'Màndarga yu njëkk\nci sa règle bu njëkk',
    metaDuration: '5 simili jàng',
    metaType: 'Bind',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Sa yaram daa jox ay màndarga balaa sa règle bu njëkk dikk. Xam leen mën na dimbli nga gën a bañ a jaaxle.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Soppi yu tuuti-tuuti',
      'Màndarga yu war a teg',
      'Li ñu tekki',
    ],
    body1: 'Ci weer yi balaa sa règle bu njëkk, sa yaram dafay soppiku ak lewet: sa anam dafay soppiku, kawar di feeñ ci bérëb yu bees, te takkal di soppiku itam. Loolu ay njeexital yu natural la yu mag, yu di waajal sa yaram ak lewet.',
    tip1Title: 'Lu baax a xam',
    tip1Text: 'Soppi yii duñu am ci benn jamono, walla ci benn ritm, ci ñépp — loolu daa jub lu mat.',
    signs: [
      {title: 'Soppi ci yaram', text: 'Sa yaram dafay soppiku tuuti-tuuti: sa anam, sa kawar ak sa takkal mën nañu soppiku.'},
      {title: 'Ndox mu ndey', text: 'Ndox bu weex bu neex daa feeñ ay weer balaa sa règle bu njëkk.'},
      {title: 'Metit walla yëngu', text: 'Mën nga dégg tuuti dëgër walla yëngu ci suufu biir.'},
      {title: 'Soppi ci xol', text: 'Daa jub nga gën a nooy walla gën a mer lu cosaan.'},
      {title: 'Nàmm yu metti', text: 'Mën nga gis metit bu ndaw walla tuuru bu ndaw.'},
    ],
    body2: 'Màndarga yii dañuy wone ne sa règle bu njëkk dina dikk ci weer yi toftal, waaye mënul a xamni benn bés bu wóor. Denc sa aar ci sa wet nekk na léegi benn yoon bu baax.',
    alertTitle: 'Teg',
    alertText: 'Màndarga yii ay ndigal yu yaatu lañu, du xayma bu jub. Yaram bu nekk dafay topp ritmam.',
    relatedTitle: '♥  Mën nga bëgg itam',
    related: [
      {title: 'Sa règle bu njëkk: lu ñuy xaar', meta: '5 simili  ·  Ndigal'},
      {title: 'Naka laay xam ne sama règle bu njëkk dafay dikk?', meta: '5 simili  ·  Ndigal'},
      {title: 'Jamono yu wërsëg bi', meta: '5 simili  ·  Bind'},
    ],
    shareMessage: 'Màndarga yu njëkk balaa sa règle bu njëkk — AWA',
  },
  ha: {
    badge: 'HAILAR FARKO',
    title: 'Alamomin farko\nna hailarki ta farko',
    metaDuration: 'karatun minti 5',
    metaType: 'Labari',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Jikinki galibi yana ba da alamu kafin hailarki ta farko ta zo. Gane su na iya taimaka miki ki ji ƙarancin mamaki.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Sauye-sauye a hankali',
      'Alamomin da za a lura da su',
      'Abin da suke nufi',
    ],
    body1: 'A cikin watannin da suka gabaci hailarki ta farko, jikinki yana canzawa a hankali: siffarki tana sauyawa, gashin jiki yana fara bayyana a sabbin wurare, kuma gumi ma yana canzawa. Waɗannan tasirin balaga ne na al’ada, suna shirya jikinki a hankali.',
    tip1Title: 'Abin da ya dace a sani',
    tip1Text: 'Waɗannan sauye-sauye ba sa faruwa a lokaci ɗaya, ko da sauri ɗaya, ga kowa — wannan al’ada ce gaba ɗaya.',
    signs: [
      {title: 'Sauye-sauyen jiki', text: 'Jikinki yana canzawa a hankali: siffarki, gashin jiki, da gumi duk na iya sauyawa.'},
      {title: 'Ruwan al’aura', text: 'Ruwa mai sauƙi fari-fari galibi yana bayyana wasu watanni kafin hailarki ta farko.'},
      {title: 'Ciwo ko murɗawa', text: 'Za ki iya jin ɗan tashin hankali ko murɗawa a ƙasan cikinki.'},
      {title: 'Sauyin yanayi', text: 'Abu ne gama gari a ji ƙarin hankali ko fushi fiye da yadda aka saba.'},
      {title: 'Ciwon nono', text: 'Za ki iya lura da ɗan ciwo ko kumburi.'},
    ],
    body2: 'Waɗannan alamomi yawanci suna nufin hailarki ta farko za ta zo a cikin watanni masu zuwa, ko da yake ba shi yiwuwa a hasashen ainihin kwanan wata. Rike kariya kusa da ke ya zama kyakkyawar dabi’a a wannan lokaci.',
    alertTitle: 'Ki lura',
    alertText: 'Waɗannan alamomi jagorori ne gama gari, ba hasashe takamaimai ba. Kowane jiki yana bin saurinsa.',
    relatedTitle: '♥  Kila ma za ki so',
    related: [
      {title: 'Hailarki ta farko: abin da za ki tsammata', meta: 'minti 5  ·  Jagora'},
      {title: 'Ta yaya zan san hailata ta farko tana zuwa?', meta: 'minti 5  ·  Jagora'},
      {title: 'Matakan zagaye daban-daban', meta: 'minti 5  ·  Labari'},
    ],
    shareMessage: 'Alamomin farko kafin hailarki ta farko — AWA',
  },
  am: {
    badge: 'የመጀመሪያ የወር አበባ',
    title: 'የመጀመሪያ የወር አበባሽ\nየመጀመሪያ ምልክቶች',
    metaDuration: '5 ደቂቃ ንባብ',
    metaType: 'ጽሑፍ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'ሰውነትሽ የመጀመሪያ የወር አበባሽ ከመምጣቱ በፊት ብዙ ጊዜ ፍንጮችን ይሰጣል። እነሱን መለየት ያነሰ መገረም እንዲሰማሽ ሊረዳ ይችላል።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'ቀስ በቀስ ለውጦች',
      'ልብ ልትይባቸው የሚገቡ ምልክቶች',
      'ምን ማለት ነው',
    ],
    body1: 'የመጀመሪያ የወር አበባሽ ከመምጣቱ በፊት ባሉት ወራት ሰውነትሽ በቀስታ ይለወጣል፦ ቅርጽሽ ይለወጣል፣ የሰውነት ፀጉር በአዳዲስ ቦታዎች መታየት ይጀምራል፣ ላብም ይለወጣል። እነዚህ ሰውነትሽን በቀስታ የሚያዘጋጁ የጉርምስና መደበኛ ውጤቶች ናቸው።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text: 'እነዚህ ለውጦች ለሁሉም በአንድ ጊዜ፣ ወይም በተመሳሳይ ፍጥነት አይከሰቱም — ይህ ፍጹም የተለመደ ነው።',
    signs: [
      {title: 'የሰውነት ለውጦች', text: 'ሰውነትሽ ቀስ በቀስ ይለወጣል፦ ቅርጽሽ፣ የሰውነት ፀጉርሽና ላብሽ ሁሉም ሊለወጡ ይችላሉ።'},
      {title: 'የማህፀን ፈሳሽ', text: 'ቀላል፣ ነጭ-ነጭ ፈሳሽ ብዙውን ጊዜ ከመጀመሪያ የወር አበባሽ ጥቂት ወራት በፊት ይታያል።'},
      {title: 'ህመሞች ወይም ጉትጎታዎች', text: 'በታችኛው ሆድሽ ቀላል ውጥረት ወይም ጉትጎታ ሊሰማሽ ይችላል።'},
      {title: 'የስሜት ለውጦች', text: 'ከወትሮው ይበልጥ ስሜታዊ ወይም ቁጡ መሆን የተለመደ ነው።'},
      {title: 'የጡት ህመም', text: 'ቀላል ህመም ወይም እብጠት ልታስተውዪ ትችያለሽ።'},
    ],
    body2: 'እነዚህ ምልክቶች ብዙውን ጊዜ የመጀመሪያ የወር አበባሽ በሚቀጥሉት ወራት እንደሚመጣ ያመለክታሉ፣ ምንም እንኳን ትክክለኛ ቀንን መተንበይ የማይቻል ቢሆንም። መከላከያን በቅርበት መያዝ በዚህ ጊዜ ጥሩ ልማድ ይሆናል።',
    alertTitle: 'ልብ በይ',
    alertText: 'እነዚህ ምልክቶች አጠቃላይ መመሪያዎች ናቸው እንጂ ትክክለኛ ትንበያ አይደሉም። እያንዳንዱ አካል የራሱን ፍጥነት ይከተላል።',
    relatedTitle: '♥  ሊወዱትም ይችላሉ',
    related: [
      {title: 'የመጀመሪያ የወር አበባሽ፦ ምን መጠበቅ', meta: '5 ደቂቃ  ·  መመሪያ'},
      {title: 'የመጀመሪያ የወር አበባዬ እየመጣ መሆኑን እንዴት አውቃለሁ?', meta: '5 ደቂቃ  ·  መመሪያ'},
      {title: 'የዑደቱ የተለያዩ ደረጃዎች', meta: '5 ደቂቃ  ·  ጽሑፍ'},
    ],
    shareMessage: 'ከመጀመሪያ የወር አበባሽ በፊት የመጀመሪያ ምልክቶች — AWA',
  },
  nl: {
    badge: 'EERSTE MENSTRUATIE',
    title: 'Vroege tekenen\nvan je eerste menstruatie',
    metaDuration: '5 min lezen',
    metaType: 'Artikel',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Je lichaam geeft vaak hints voordat je allereerste menstruatie komt. Ze herkennen kan je helpen minder verrast te zijn.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Geleidelijke veranderingen',
      'Tekenen om op te letten',
      'Wat het betekent',
    ],
    body1: 'In de maanden vóór je eerste menstruatie verandert je lichaam geleidelijk: je figuur evolueert, er verschijnt lichaamsbeharing op nieuwe plekken en ook het zweten verandert. Dit zijn normale effecten van de puberteit, die je lichaam zachtjes voorbereiden.',
    tip1Title: 'Goed om te weten',
    tip1Text: 'Deze veranderingen gebeuren niet bij iedereen tegelijk of in hetzelfde tempo — dat is volkomen normaal.',
    signs: [
      {title: 'Lichaamsveranderingen', text: 'Je lichaam verandert geleidelijk: je figuur, lichaamsbeharing en zweten kunnen allemaal verschuiven.'},
      {title: 'Vaginale afscheiding', text: 'Lichte, witachtige afscheiding verschijnt vaak enkele maanden vóór je eerste menstruatie.'},
      {title: 'Pijntjes of steken', text: 'Je kunt een lichte spanning of steken in je onderbuik voelen.'},
      {title: 'Stemmingswisselingen', text: 'Het is gebruikelijk dat je je gevoeliger of prikkelbaarder voelt dan normaal.'},
      {title: 'Gevoelige borsten', text: 'Je kunt een lichte gevoeligheid of zwelling opmerken.'},
    ],
    body2: 'Deze tekenen betekenen meestal dat je eerste menstruatie in de volgende maanden komt, al is het onmogelijk een exacte datum te voorspellen. Bescherming binnen handbereik houden wordt op dit moment een goede gewoonte.',
    alertTitle: 'Let op',
    alertText: 'Deze tekenen zijn algemene richtlijnen, nooit een precieze voorspelling. Elk lichaam volgt zijn eigen tempo.',
    relatedTitle: '♥  Misschien vind je dit ook leuk',
    related: [
      {title: 'Je eerste menstruatie: wat je kunt verwachten', meta: '5 min  ·  Gids'},
      {title: 'Hoe weet ik of mijn eerste menstruatie eraan komt?', meta: '5 min  ·  Gids'},
      {title: 'De verschillende fasen van de cyclus', meta: '5 min  ·  Artikel'},
    ],
    shareMessage: 'Vroege tekenen vóór je eerste menstruatie — AWA',
  },
  fi: {
    badge: 'ENSIMMÄISET KUUKAUTISET',
    title: 'Ensimmäisten kuukautisten\nvarhaiset merkit',
    metaDuration: '5 min lukuaika',
    metaType: 'Artikkeli',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Kehosi antaa usein vihjeitä ennen aivan ensimmäisiä kuukautisiasi. Niiden tunnistaminen voi auttaa sinua tuntemaan olosi vähemmän yllättyneeksi.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Vähittäiset muutokset',
      'Huomioitavat merkit',
      'Mitä se tarkoittaa',
    ],
    body1: 'Kuukausina ennen ensimmäisiä kuukautisia kehosi muuttuu lempeästi: vartalosi muoto kehittyy, karvoitusta ilmestyy uusiin paikkoihin ja hikoilukin muuttuu. Nämä ovat murrosiän normaaleja vaikutuksia, jotka valmistavat kehoasi varovasti.',
    tip1Title: 'Hyvä tietää',
    tip1Text: 'Kaikki nämä muutokset eivät tapahdu kaikilla samaan aikaan tai samaa tahtia — se on täysin normaalia.',
    signs: [
      {title: 'Kehon muutokset', text: 'Kehosi muuttuu vähitellen: vartalon muoto, karvoitus ja hikoilu voivat kaikki muuttua.'},
      {title: 'Emätinerite', text: 'Kevyt, valkeahko erite ilmestyy usein muutamaa kuukautta ennen ensimmäisiä kuukautisia.'},
      {title: 'Särky tai nipistykset', text: 'Saatat tuntea lievää jännitystä tai nipistyksiä alavatsassa.'},
      {title: 'Mielialan muutokset', text: 'On tavallista tuntea itsensä tavallista herkemmäksi tai ärtyneemmäksi.'},
      {title: 'Rintojen arkuus', text: 'Saatat huomata lievää arkuutta tai turvotusta.'},
    ],
    body2: 'Nämä merkit tarkoittavat yleensä, että ensimmäiset kuukautisesi tulevat seuraavien kuukausien aikana, vaikka tarkkaa päivää on mahdoton ennustaa. Suojan pitäminen lähellä on tässä vaiheessa hyvä tapa.',
    alertTitle: 'Huomaa',
    alertText: 'Nämä merkit ovat yleisiä suuntaviivoja, eivät koskaan tarkka ennuste. Jokainen keho etenee omaa tahtiaan.',
    relatedTitle: '♥  Saatat pitää myös näistä',
    related: [
      {title: 'Ensimmäiset kuukautisesi: mitä odottaa', meta: '5 min  ·  Opas'},
      {title: 'Mistä tiedän, että ensimmäiset kuukautiseni ovat tulossa?', meta: '5 min  ·  Opas'},
      {title: 'Kierron eri vaiheet', meta: '5 min  ·  Artikkeli'},
    ],
    shareMessage: 'Varhaiset merkit ennen ensimmäisiä kuukautisia — AWA',
  },
  el: {
    badge: 'ΠΡΩΤΗ ΠΕΡΙΟΔΟΣ',
    title: 'Τα πρώτα σημάδια\nτης πρώτης σου περιόδου',
    metaDuration: '5 λεπτά ανάγνωσης',
    metaType: 'Άρθρο',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Το σώμα σου δίνει συχνά ενδείξεις πριν έρθει η πολύ πρώτη σου περίοδος. Το να τις αναγνωρίζεις μπορεί να σε βοηθήσει να εκπλαγείς λιγότερο.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Σταδιακές αλλαγές',
      'Σημάδια που πρέπει να προσέχεις',
      'Τι σημαίνει',
    ],
    body1: 'Στους μήνες πριν την πρώτη σου περίοδο, το σώμα σου αλλάζει απαλά: το σχήμα σου εξελίσσεται, εμφανίζονται τρίχες σε νέα σημεία και αλλάζει και η εφίδρωση. Αυτά είναι φυσιολογικά αποτελέσματα της εφηβείας, που προετοιμάζουν απαλά το σώμα σου.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text: 'Αυτές οι αλλαγές δεν συμβαίνουν όλες ταυτόχρονα ούτε με τον ίδιο ρυθμό σε όλες — είναι απόλυτα φυσιολογικό.',
    signs: [
      {title: 'Αλλαγές στο σώμα', text: 'Το σώμα σου αλλάζει σταδιακά: το σχήμα, οι τρίχες και η εφίδρωση μπορεί να μεταβληθούν.'},
      {title: 'Κολπικές εκκρίσεις', text: 'Ελαφριές, υπόλευκες εκκρίσεις εμφανίζονται συχνά λίγους μήνες πριν την πρώτη περίοδο.'},
      {title: 'Πόνοι ή τσιμπήματα', text: 'Μπορεί να νιώσεις ελαφρά ένταση ή τσιμπήματα στην κάτω κοιλιά.'},
      {title: 'Αλλαγές διάθεσης', text: 'Είναι συνηθισμένο να νιώθεις πιο ευαίσθητη ή ευερέθιστη από το συνηθισμένο.'},
      {title: 'Ευαισθησία στο στήθος', text: 'Μπορεί να παρατηρήσεις ελαφρά ευαισθησία ή πρήξιμο.'},
    ],
    body2: 'Αυτά τα σημάδια σημαίνουν συνήθως ότι η πρώτη σου περίοδος θα έρθει τους επόμενους μήνες, αν και είναι αδύνατο να προβλεφθεί μια ακριβής ημερομηνία. Το να έχεις προστασία πρόχειρη γίνεται καλή συνήθεια σε αυτό το σημείο.',
    alertTitle: 'Σημείωση',
    alertText: 'Αυτά τα σημάδια είναι γενικοί οδηγοί, ποτέ ακριβής πρόβλεψη. Κάθε σώμα ακολουθεί τον δικό του ρυθμό.',
    relatedTitle: '♥  Μπορεί επίσης να σου αρέσουν',
    related: [
      {title: 'Η πρώτη σου περίοδος: τι να περιμένεις', meta: '5 λεπτά  ·  Οδηγός'},
      {title: 'Πώς καταλαβαίνω ότι έρχεται η πρώτη μου περίοδος;', meta: '5 λεπτά  ·  Οδηγός'},
      {title: 'Οι διαφορετικές φάσεις του κύκλου', meta: '5 λεπτά  ·  Άρθρο'},
    ],
    shareMessage: 'Τα πρώτα σημάδια πριν την πρώτη σου περίοδο — AWA',
  },
  fil: {
    badge: 'UNANG REGLA',
    title: 'Mga unang senyales\nng iyong unang regla',
    metaDuration: '5 min na babasahin',
    metaType: 'Artikulo',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Madalas magbigay ng mga pahiwatig ang iyong katawan bago dumating ang pinakaunang regla mo. Makakatulong ang pagkilala sa mga ito para hindi ka masyadong magulat.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Unti-unting pagbabago',
      'Mga senyales na dapat bantayan',
      'Ano ang ibig sabihin nito',
    ],
    body1: 'Sa mga buwan bago ang iyong unang regla, banayad na nagbabago ang iyong katawan: nagbabago ang hugis mo, nagsisimulang tumubo ang balahibo sa mga bagong bahagi, at nagbabago rin ang pagpapawis. Normal na epekto ito ng pagdadalaga, na dahan-dahang naghahanda sa iyong katawan.',
    tip1Title: 'Mabuting malaman',
    tip1Text: 'Hindi sabay-sabay o magkakapareho ang bilis ng mga pagbabagong ito sa lahat — ganap na normal iyon.',
    signs: [
      {title: 'Pagbabago ng katawan', text: 'Unti-unting nagbabago ang iyong katawan: maaaring magbago ang hugis, ang balahibo sa katawan, at ang pagpapawis.'},
      {title: 'Pagtagas sa ari', text: 'Madalas lumilitaw ang magaan at maputing pagtagas ilang buwan bago ang unang regla.'},
      {title: 'Kirot o paghilab', text: 'Maaari kang makaramdam ng bahagyang paninigas o paghilab sa ibabang tiyan.'},
      {title: 'Pagbabago ng mood', text: 'Karaniwang mas maging sensitibo o mainitin ang ulo kaysa dati.'},
      {title: 'Pananakit ng dibdib', text: 'Maaari mong mapansin ang bahagyang pananakit o pamamaga.'},
    ],
    body2: 'Karaniwang ipinapahiwatig ng mga senyales na ito na darating ang iyong unang regla sa mga susunod na buwan, bagaman imposibleng hulaan ang eksaktong petsa. Magandang gawi na ngayon ang pagkakaroon ng proteksyon sa malapit.',
    alertTitle: 'Pakitandaan',
    alertText: 'Pangkalahatang gabay lamang ang mga senyales na ito, hindi kailanman eksaktong prediksyon. May sariling bilis ang bawat katawan.',
    relatedTitle: '♥  Maaaring magustuhan mo rin',
    related: [
      {title: 'Ang iyong unang regla: ano ang aasahan', meta: '5 min  ·  Gabay'},
      {title: 'Paano ko malalaman na parating na ang aking unang regla?', meta: '5 min  ·  Gabay'},
      {title: 'Ang iba’t ibang yugto ng siklo', meta: '5 min  ·  Artikulo'},
    ],
    shareMessage: 'Mga unang senyales bago ang iyong unang regla — AWA',
  },
  ta: {
    badge: 'முதல் மாதவிடாய்',
    title: 'உங்கள் முதல் மாதவிடாயின்\nஆரம்ப அறிகுறிகள்',
    metaDuration: '5 நிமிடம் படிக்க',
    metaType: 'கட்டுரை',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'உங்கள் மிக முதல் மாதவிடாய் வருவதற்கு முன் உங்கள் உடல் பெரும்பாலும் குறிப்புகளைத் தருகிறது. அவற்றை அடையாளம் காண்பது நீங்கள் குறைவாக ஆச்சரியப்பட உதவலாம்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'படிப்படியான மாற்றங்கள்',
      'கவனிக்க வேண்டிய அறிகுறிகள்',
      'அது எதைக் குறிக்கிறது',
    ],
    body1: 'உங்கள் முதல் மாதவிடாய்க்கு முந்தைய மாதங்களில், உங்கள் உடல் மென்மையாக மாறுகிறது: உங்கள் உடல் வடிவம் மாறுகிறது, புதிய இடங்களில் உடல் முடி தோன்றத் தொடங்குகிறது, வியர்வையும் மாறுகிறது. இவை பருவமடைதலின் இயல்பான விளைவுகள், உங்கள் உடலை மென்மையாகத் தயார்படுத்துகின்றன.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text: 'இந்த மாற்றங்கள் அனைவருக்கும் ஒரே நேரத்தில், ஒரே வேகத்தில் நிகழ்வதில்லை — அது முற்றிலும் இயல்பானது.',
    signs: [
      {title: 'உடல் மாற்றங்கள்', text: 'உங்கள் உடல் படிப்படியாக மாறுகிறது: உங்கள் உடல் வடிவம், உடல் முடி மற்றும் வியர்வை அனைத்தும் மாறலாம்.'},
      {title: 'யோனி வெளியேற்றம்', text: 'லேசான, வெண்மையான வெளியேற்றம் பெரும்பாலும் உங்கள் முதல் மாதவிடாய்க்குச் சில மாதங்களுக்கு முன் தோன்றும்.'},
      {title: 'வலி அல்லது சுருக்கங்கள்', text: 'உங்கள் அடிவயிற்றில் லேசான இறுக்கம் அல்லது சுருக்கங்களை நீங்கள் உணரலாம்.'},
      {title: 'மனநிலை மாற்றங்கள்', text: 'வழக்கத்தை விட அதிக உணர்திறன் அல்லது எரிச்சலை உணர்வது பொதுவானது.'},
      {title: 'மார்பக வலி', text: 'லேசான வலி அல்லது வீக்கத்தை நீங்கள் கவனிக்கலாம்.'},
    ],
    body2: 'இந்த அறிகுறிகள் பொதுவாக உங்கள் முதல் மாதவிடாய் அடுத்த மாதங்களில் வரும் என்பதைக் குறிக்கின்றன, இருப்பினும் சரியான தேதியைக் கணிக்க இயலாது. இந்தக் கட்டத்தில் பாதுகாப்பை அருகிலேயே வைத்திருப்பது ஒரு நல்ல பழக்கமாகிறது.',
    alertTitle: 'கவனத்தில் கொள்ளவும்',
    alertText: 'இந்த அறிகுறிகள் பொது வழிகாட்டிகள், துல்லியமான கணிப்பு ஒருபோதும் அல்ல. ஒவ்வொரு உடலும் தன் சொந்த வேகத்தைப் பின்பற்றுகிறது.',
    relatedTitle: '♥  உங்களுக்குப் பிடிக்கக்கூடியவை',
    related: [
      {title: 'உங்கள் முதல் மாதவிடாய்: என்ன எதிர்பார்ப்பது', meta: '5 நிமிடம்  ·  வழிகாட்டி'},
      {title: 'என் முதல் மாதவிடாய் வருகிறது என்பதை எப்படி அறிவது?', meta: '5 நிமிடம்  ·  வழிகாட்டி'},
      {title: 'சுழற்சியின் பல்வேறு கட்டங்கள்', meta: '5 நிமிடம்  ·  கட்டுரை'},
    ],
    shareMessage: 'உங்கள் முதல் மாதவிடாய்க்கு முந்தைய ஆரம்ப அறிகுறிகள் — AWA',
  },
  te: {
    badge: 'మొదటి నెలసరి',
    title: 'మీ మొదటి నెలసరి\nప్రారంభ సంకేతాలు',
    metaDuration: '5 నిమిషాల పఠనం',
    metaType: 'వ్యాసం',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'మీ మొదటి నెలసరి రావడానికి ముందే మీ శరీరం తరచుగా సూచనలు ఇస్తుంది. వాటిని గుర్తించడం మీకు తక్కువ ఆశ్చర్యం కలగడానికి సహాయపడుతుంది.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'క్రమంగా వచ్చే మార్పులు',
      'గమనించాల్సిన సంకేతాలు',
      'దాని అర్థం ఏమిటి',
    ],
    body1: 'మీ మొదటి నెలసరికి ముందు నెలల్లో, మీ శరీరం మృదువుగా మారుతుంది: మీ ఆకృతి మారుతుంది, శరీరంపై రోమాలు కొత్త చోట్ల కనిపించడం మొదలవుతుంది, చెమట పట్టడం కూడా మారుతుంది. ఇవి యుక్తవయస్సు యొక్క సహజ ప్రభావాలు, మీ శరీరాన్ని మృదువుగా సిద్ధం చేస్తాయి.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text: 'ఈ మార్పులన్నీ అందరికీ ఒకే సమయంలో లేదా ఒకే వేగంతో జరగవు — అది పూర్తిగా సహజం.',
    signs: [
      {title: 'శరీర మార్పులు', text: 'మీ శరీరం క్రమంగా మారుతుంది: మీ ఆకృతి, శరీర రోమాలు, చెమట అన్నీ మారవచ్చు.'},
      {title: 'యోని స్రావం', text: 'తేలికపాటి, తెల్లని స్రావం తరచుగా మీ మొదటి నెలసరికి కొన్ని నెలల ముందు కనిపిస్తుంది.'},
      {title: 'నొప్పులు లేదా పట్టేయడం', text: 'మీ కింది పొట్టలో స్వల్ప బిగుతు లేదా పట్టేయడం అనిపించవచ్చు.'},
      {title: 'మానసిక స్థితి మార్పులు', text: 'సాధారణం కంటే ఎక్కువ సున్నితంగా లేదా చిరాగ్గా అనిపించడం సాధారణం.'},
      {title: 'రొమ్ము నొప్పి', text: 'మీరు స్వల్ప నొప్పిని లేదా వాపును గమనించవచ్చు.'},
    ],
    body2: 'ఈ సంకేతాలు సాధారణంగా మీ మొదటి నెలసరి తర్వాతి నెలల్లో వస్తుందని అర్థం, అయితే ఖచ్చితమైన తేదీని అంచనా వేయడం అసాధ్యం. ఈ దశలో రక్షణను దగ్గర ఉంచుకోవడం మంచి అలవాటు అవుతుంది.',
    alertTitle: 'గమనించండి',
    alertText: 'ఈ సంకేతాలు సాధారణ మార్గదర్శకాలు, ఎప్పటికీ ఖచ్చితమైన అంచనా కాదు. ప్రతి శరీరం తన సొంత వేగాన్ని అనుసరిస్తుంది.',
    relatedTitle: '♥  మీకు ఇవి కూడా నచ్చవచ్చు',
    related: [
      {title: 'మీ మొదటి నెలసరి: ఏమి ఆశించాలి', meta: '5 ని  ·  గైడ్'},
      {title: 'నా మొదటి నెలసరి రాబోతోందని నాకు ఎలా తెలుస్తుంది?', meta: '5 ని  ·  గైడ్'},
      {title: 'చక్రం యొక్క వివిధ దశలు', meta: '5 ని  ·  వ్యాసం'},
    ],
    shareMessage: 'మీ మొదటి నెలసరికి ముందు ప్రారంభ సంకేతాలు — AWA',
  },
  mr: {
    badge: 'पहिली पाळी',
    title: 'तुमच्या पहिल्या पाळीची\nसुरुवातीची चिन्हे',
    metaDuration: '5 मिनिटे वाचन',
    metaType: 'लेख',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'तुमची अगदी पहिली पाळी येण्यापूर्वी तुमचे शरीर अनेकदा संकेत देते. ते ओळखल्याने तुम्हाला कमी आश्चर्य वाटू शकते.',
    contentsTitle: 'या लेखात',
    topics: [
      'हळूहळू होणारे बदल',
      'लक्ष ठेवायची चिन्हे',
      'याचा अर्थ काय',
    ],
    body1: 'तुमच्या पहिल्या पाळीच्या आधीच्या महिन्यांत तुमचे शरीर हळुवारपणे बदलते: तुमचा आकार बदलतो, शरीरावर नव्या ठिकाणी केस येऊ लागतात आणि घामही बदलतो. हे यौवनाचे सामान्य परिणाम आहेत, जे तुमच्या शरीराला हळुवारपणे तयार करतात.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text: 'हे सर्व बदल प्रत्येकासाठी एकाच वेळी किंवा एकाच गतीने होत नाहीत — हे पूर्णपणे सामान्य आहे.',
    signs: [
      {title: 'शरीरातील बदल', text: 'तुमचे शरीर हळूहळू बदलते: तुमचा आकार, शरीरावरचे केस आणि घाम हे सर्व बदलू शकतात.'},
      {title: 'योनीतील स्राव', text: 'हलका, पांढरट स्राव बहुतेकदा तुमच्या पहिल्या पाळीच्या काही महिने आधी दिसतो.'},
      {title: 'वेदना किंवा कळा', text: 'तुम्हाला पोटाच्या खालच्या भागात हलका ताण किंवा कळा जाणवू शकतात.'},
      {title: 'मनःस्थितीतील बदल', text: 'नेहमीपेक्षा अधिक संवेदनशील किंवा चिडचिडे वाटणे सामान्य आहे.'},
      {title: 'स्तनांची संवेदनशीलता', text: 'तुम्हाला हलकी संवेदनशीलता किंवा सूज जाणवू शकते.'},
    ],
    body2: 'ही चिन्हे सहसा दर्शवतात की तुमची पहिली पाळी पुढील काही महिन्यांत येईल, मात्र नेमकी तारीख सांगणे अशक्य आहे. या टप्प्यावर संरक्षण हाताशी ठेवणे ही एक चांगली सवय बनते.',
    alertTitle: 'कृपया लक्षात घ्या',
    alertText: 'ही चिन्हे सर्वसाधारण मार्गदर्शक आहेत, कधीही अचूक अंदाज नाहीत. प्रत्येक शरीर स्वतःच्या गतीने चालते.',
    relatedTitle: '♥  तुम्हाला हे देखील आवडेल',
    related: [
      {title: 'तुमची पहिली पाळी: काय अपेक्षित आहे', meta: '5 मिनिटे  ·  मार्गदर्शक'},
      {title: 'माझी पहिली पाळी येणार आहे हे मला कसे कळेल?', meta: '5 मिनिटे  ·  मार्गदर्शक'},
      {title: 'पाळीचे वेगवेगळे टप्पे', meta: '5 मिनिटे  ·  लेख'},
    ],
    shareMessage: 'तुमच्या पहिल्या पाळीपूर्वीची सुरुवातीची चिन्हे — AWA',
  },
  gu: {
    badge: 'પ્રથમ માસિક',
    title: 'તમારા પ્રથમ માસિકના\nશરૂઆતના સંકેતો',
    metaDuration: '5 મિનિટ વાંચન',
    metaType: 'લેખ',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'તમારું સાવ પ્રથમ માસિક આવે તે પહેલાં તમારું શરીર ઘણી વાર ઈશારા આપે છે. તેમને ઓળખવાથી તમને ઓછું આશ્ચર્ય થઈ શકે છે.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'ધીમે ધીમે થતા ફેરફારો',
      'ધ્યાન રાખવા જેવા સંકેતો',
      'તેનો અર્થ શું છે',
    ],
    body1: 'તમારા પ્રથમ માસિકના મહિનાઓ પહેલાં, તમારું શરીર હળવેથી બદલાય છે: તમારો આકાર વિકસે છે, શરીર પર નવી જગ્યાએ વાળ ઊગવા લાગે છે, અને પરસેવામાં પણ ફેરફાર થાય છે. આ તરુણાવસ્થાની સામાન્ય અસરો છે, જે તમારા શરીરને ધીમેથી તૈયાર કરે છે.',
    tip1Title: 'જાણવા જેવું',
    tip1Text: 'આ બધા ફેરફારો દરેક માટે એક જ સમયે કે એક જ ગતિએ થતા નથી — તે સંપૂર્ણ સામાન્ય છે.',
    signs: [
      {title: 'શરીરમાં ફેરફારો', text: 'તમારું શરીર ધીમે ધીમે બદલાય છે: તમારો આકાર, શરીર પરના વાળ અને પરસેવો બધું બદલાઈ શકે છે.'},
      {title: 'યોનિમાર્ગનો સ્રાવ', text: 'હળવો, સફેદ સ્રાવ ઘણી વાર તમારા પ્રથમ માસિકના થોડા મહિના પહેલાં દેખાય છે.'},
      {title: 'દુખાવો કે ચચરાટી', text: 'તમને નીચલા પેટમાં હળવો તણાવ કે ચચરાટી અનુભવાઈ શકે છે.'},
      {title: 'મૂડમાં ફેરફાર', text: 'સામાન્ય કરતાં વધુ સંવેદનશીલ કે ચીડિયું લાગવું સામાન્ય છે.'},
      {title: 'સ્તનમાં કોમળતા', text: 'તમને હળવી કોમળતા કે સોજો જણાઈ શકે છે.'},
    ],
    body2: 'આ સંકેતોનો સામાન્ય રીતે અર્થ થાય છે કે તમારું પ્રથમ માસિક પછીના મહિનાઓમાં આવશે, જોકે ચોક્કસ તારીખની આગાહી કરવી અશક્ય છે. આ તબક્કે સંરક્ષણ હાથવગું રાખવું એક સારી ટેવ બની જાય છે.',
    alertTitle: 'કૃપા કરીને નોંધો',
    alertText: 'આ સંકેતો સામાન્ય માર્ગદર્શક છે, ક્યારેય ચોક્કસ આગાહી નથી. દરેક શરીર પોતાની ગતિએ ચાલે છે.',
    relatedTitle: '♥  તમને આ પણ ગમી શકે',
    related: [
      {title: 'તમારું પ્રથમ માસિક: શું અપેક્ષા રાખવી', meta: '5 મિનિટ  ·  માર્ગદર્શિકા'},
      {title: 'મારું પ્રથમ માસિક આવી રહ્યું છે એ કેવી રીતે ખબર પડે?', meta: '5 મિનિટ  ·  માર્ગદર્શિકા'},
      {title: 'ચક્રના જુદા જુદા તબક્કાઓ', meta: '5 મિનિટ  ·  લેખ'},
    ],
    shareMessage: 'તમારા પ્રથમ માસિક પહેલાંના શરૂઆતના સંકેતો — AWA',
  },
  pa: {
    badge: 'ਪਹਿਲੀ ਮਾਹਵਾਰੀ',
    title: 'ਤੁਹਾਡੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਦੇ\nਸ਼ੁਰੂਆਤੀ ਸੰਕੇਤ',
    metaDuration: '5 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਲੇਖ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਤੁਹਾਡੀ ਬਿਲਕੁਲ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਆਉਣ ਤੋਂ ਪਹਿਲਾਂ ਤੁਹਾਡਾ ਸਰੀਰ ਅਕਸਰ ਇਸ਼ਾਰੇ ਦਿੰਦਾ ਹੈ। ਇਨ੍ਹਾਂ ਨੂੰ ਪਛਾਣਨ ਨਾਲ ਤੁਸੀਂ ਘੱਟ ਹੈਰਾਨ ਹੋਵੋਗੇ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਹੌਲੀ-ਹੌਲੀ ਆਉਣ ਵਾਲੇ ਬਦਲਾਅ',
      'ਧਿਆਨ ਦੇਣ ਯੋਗ ਸੰਕੇਤ',
      'ਇਸ ਦਾ ਮਤਲਬ ਕੀ ਹੈ',
    ],
    body1: 'ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਤੋਂ ਪਹਿਲਾਂ ਦੇ ਮਹੀਨਿਆਂ ਵਿੱਚ ਤੁਹਾਡਾ ਸਰੀਰ ਹੌਲੀ-ਹੌਲੀ ਬਦਲਦਾ ਹੈ: ਤੁਹਾਡੀ ਬਣਤਰ ਬਦਲਦੀ ਹੈ, ਸਰੀਰ ਦੇ ਨਵੇਂ ਹਿੱਸਿਆਂ ਵਿੱਚ ਵਾਲ ਉੱਗਣ ਲੱਗਦੇ ਹਨ, ਅਤੇ ਪਸੀਨਾ ਵੀ ਬਦਲ ਜਾਂਦਾ ਹੈ। ਇਹ ਜਵਾਨੀ ਦੇ ਆਮ ਅਸਰ ਹਨ, ਜੋ ਤੁਹਾਡੇ ਸਰੀਰ ਨੂੰ ਹੌਲੀ-ਹੌਲੀ ਤਿਆਰ ਕਰਦੇ ਹਨ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text: 'ਇਹ ਸਾਰੇ ਬਦਲਾਅ ਹਰ ਕਿਸੇ ਵਿੱਚ ਇੱਕੋ ਸਮੇਂ ਜਾਂ ਇੱਕੋ ਰਫ਼ਤਾਰ ਨਾਲ ਨਹੀਂ ਹੁੰਦੇ — ਇਹ ਬਿਲਕੁਲ ਆਮ ਹੈ।',
    signs: [
      {title: 'ਸਰੀਰਕ ਬਦਲਾਅ', text: 'ਤੁਹਾਡਾ ਸਰੀਰ ਹੌਲੀ-ਹੌਲੀ ਬਦਲਦਾ ਹੈ: ਤੁਹਾਡੀ ਬਣਤਰ, ਵਾਲ ਅਤੇ ਪਸੀਨਾ, ਸਭ ਬਦਲ ਸਕਦੇ ਹਨ।'},
      {title: 'ਯੋਨੀ ਦਾ ਰਿਸਾਅ', text: 'ਹਲਕਾ, ਚਿੱਟਾ ਰਿਸਾਅ ਅਕਸਰ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਤੋਂ ਕੁਝ ਮਹੀਨੇ ਪਹਿਲਾਂ ਦਿਸਣ ਲੱਗਦਾ ਹੈ।'},
      {title: 'ਦਰਦ ਜਾਂ ਚੁਭਨ', text: 'ਤੁਹਾਨੂੰ ਹੇਠਲੇ ਪੇਟ ਵਿੱਚ ਹਲਕਾ ਖਿੱਚ ਜਾਂ ਚੁਭਨ ਮਹਿਸੂਸ ਹੋ ਸਕਦੀ ਹੈ।'},
      {title: 'ਮੂਡ ਵਿੱਚ ਬਦਲਾਅ', text: 'ਆਮ ਨਾਲੋਂ ਵੱਧ ਸੰਵੇਦਨਸ਼ੀਲ ਜਾਂ ਚਿੜਚਿੜਾ ਮਹਿਸੂਸ ਕਰਨਾ ਆਮ ਗੱਲ ਹੈ।'},
      {title: 'ਛਾਤੀ ਵਿੱਚ ਨਰਮੀ', text: 'ਤੁਹਾਨੂੰ ਹਲਕੀ ਨਰਮੀ ਜਾਂ ਸੋਜ ਮਹਿਸੂਸ ਹੋ ਸਕਦੀ ਹੈ।'},
    ],
    body2: 'ਇਨ੍ਹਾਂ ਸੰਕੇਤਾਂ ਦਾ ਆਮ ਤੌਰ \'ਤੇ ਮਤਲਬ ਹੁੰਦਾ ਹੈ ਕਿ ਤੁਹਾਡੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਅਗਲੇ ਮਹੀਨਿਆਂ ਵਿੱਚ ਆਵੇਗੀ, ਹਾਲਾਂਕਿ ਸਹੀ ਤਾਰੀਖ਼ ਦਾ ਅੰਦਾਜ਼ਾ ਲਾਉਣਾ ਸੰਭਵ ਨਹੀਂ। ਇਸ ਸਮੇਂ ਬਚਾਅ ਵਾਲਾ ਸਾਮਾਨ ਹੱਥ ਦੇ ਨੇੜੇ ਰੱਖਣਾ ਇੱਕ ਚੰਗੀ ਆਦਤ ਬਣ ਜਾਂਦੀ ਹੈ।',
    alertTitle: 'ਕਿਰਪਾ ਕਰਕੇ ਧਿਆਨ ਦਿਓ',
    alertText: 'ਇਹ ਸੰਕੇਤ ਆਮ ਮਾਰਗ-ਦਰਸ਼ਕ ਹਨ, ਕਦੇ ਵੀ ਸਹੀ ਭਵਿੱਖਬਾਣੀ ਨਹੀਂ। ਹਰ ਸਰੀਰ ਆਪਣੀ ਰਫ਼ਤਾਰ ਨਾਲ ਚੱਲਦਾ ਹੈ।',
    relatedTitle: '♥  ਤੁਹਾਨੂੰ ਇਹ ਵੀ ਪਸੰਦ ਆ ਸਕਦਾ ਹੈ',
    related: [
      {title: 'ਤੁਹਾਡੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ: ਕੀ ਉਮੀਦ ਰੱਖੀਏ', meta: '5 ਮਿੰਟ  ·  ਗਾਈਡ'},
      {title: 'ਮੈਨੂੰ ਕਿਵੇਂ ਪਤਾ ਲੱਗੇ ਕਿ ਮੇਰੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਆਉਣ ਵਾਲੀ ਹੈ?', meta: '5 ਮਿੰਟ  ·  ਗਾਈਡ'},
      {title: 'ਚੱਕਰ ਦੇ ਵੱਖ-ਵੱਖ ਪੜਾਅ', meta: '5 ਮਿੰਟ  ·  ਲੇਖ'},
    ],
    shareMessage: 'ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਤੋਂ ਪਹਿਲਾਂ ਦੇ ਸ਼ੁਰੂਆਤੀ ਸੰਕੇਤ — AWA',
  },
  my: {
    badge: 'ပထမဆုံး ရာသီသွေး',
    title: 'ပထမဆုံး ရာသီလာခြင်း၏\nအစောပိုင်းလက္ခဏာများ',
    metaDuration: 'ဖတ်ချိန် 5 မိနစ်',
    metaType: 'ဆောင်းပါး',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'သင့်ပထမဆုံး ရာသီသွေး မလာမီ ခန္ဓာကိုယ်က အရိပ်အမြွက်များ မကြာခဏ ပေးတတ်သည်။ ၎င်းတို့ကို သိထားခြင်းဖြင့် အံ့အားသင့်မှု လျော့နည်းစေနိုင်သည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'ဖြည်းဖြည်းချင်း ပြောင်းလဲမှုများ',
      'သတိပြုရန် လက္ခဏာများ',
      'ဆိုလိုရင်းမှာ ဘာလဲ',
    ],
    body1: 'ပထမဆုံး ရာသီသွေး မလာမီ လများတွင် သင့်ခန္ဓာကိုယ်သည် ညင်ညင်သာသာ ပြောင်းလဲလာသည်။ ကိုယ်ရည်ကိုယ်သွေး ပြောင်းလဲလာပြီး ကိုယ်ပေါ်ရှိ အမွေးများ နေရာသစ်များတွင် စတင်ပေါက်လာကာ ချွေးထွက်ပုံလည်း ပြောင်းလဲလာသည်။ ဤအရာများသည် ဆယ်ကျော်သက်ဝင်ချိန်၏ ပုံမှန်သက်ရောက်မှုများဖြစ်ပြီး သင့်ခန္ဓာကိုယ်ကို ညင်သာစွာ ပြင်ဆင်ပေးခြင်းဖြစ်သည်။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text: 'ဤပြောင်းလဲမှုများသည် လူတိုင်းအတွက် တစ်ချိန်တည်း သို့မဟုတ် တူညီသောအရှိန်ဖြင့် မဖြစ်ပေါ်ပါ။ ၎င်းမှာ လုံးဝပုံမှန်ဖြစ်သည်။',
    signs: [
      {title: 'ခန္ဓာကိုယ် ပြောင်းလဲမှုများ', text: 'သင့်ခန္ဓာကိုယ်သည် ဖြည်းဖြည်းချင်း ပြောင်းလဲသည်။ ကိုယ်ရည်ကိုယ်သွေး၊ ကိုယ်ပေါ်ရှိအမွေးများနှင့် ချွေးထွက်ပုံတို့ အားလုံး ပြောင်းလဲနိုင်သည်။'},
      {title: 'မီးယပ်လမ်းကြောင်းမှ အရည်ထွက်ခြင်း', text: 'ပထမဆုံး ရာသီသွေး မလာမီ လအနည်းငယ်အလိုတွင် ဖျော့ဖျော့ အဖြူရောင်အရည် မကြာခဏ ထွက်လာတတ်သည်။'},
      {title: 'နာကျင်ခြင်း သို့မဟုတ် ထိုးသလိုခံစားရခြင်း', text: 'အောက်ပိုင်းဗိုက်တွင် အနည်းငယ်တင်းခြင်း သို့မဟုတ် ထိုးသလိုခံစားရနိုင်သည်။'},
      {title: 'စိတ်ခံစားမှု ပြောင်းလဲခြင်း', text: 'ပုံမှန်ထက် ပိုမိုအထိမခံခြင်း သို့မဟုတ် စိတ်တိုလွယ်ခြင်း အဖြစ်များသည်။'},
      {title: 'ရင်သားနာကျင်ခြင်း', text: 'အနည်းငယ်နာကျင်ခြင်း သို့မဟုတ် ရောင်ကိုင်းခြင်းကို သတိထားမိနိုင်သည်။'},
    ],
    body2: 'ဤလက္ခဏာများသည် များသောအားဖြင့် သင့်ပထမဆုံး ရာသီသွေး နောက်လများတွင် လာမည်ဟု ဆိုလိုသော်လည်း တိကျသောရက်စွဲကို ခန့်မှန်း၍ မရနိုင်ပါ။ ဤအချိန်တွင် ကာကွယ်ရေးပစ္စည်းကို လက်လှမ်းမီရာတွင် ထားခြင်းသည် အလေ့အကျင့်ကောင်းတစ်ခု ဖြစ်လာသည်။',
    alertTitle: 'ကျေးဇူးပြု၍ သတိပြုပါ',
    alertText: 'ဤလက္ခဏာများသည် ယေဘုယျလမ်းညွှန်ချက်များသာဖြစ်ပြီး တိကျသော ခန့်မှန်းချက် မဟုတ်ပါ။ ခန္ဓာကိုယ်တိုင်းသည် ကိုယ်ပိုင်အရှိန်အတိုင်း ဖြစ်ပေါ်သည်။',
    relatedTitle: '♥  သင်နှစ်သက်နိုင်သည့် အခြားဆောင်းပါးများ',
    related: [
      {title: 'သင့်ပထမဆုံး ရာသီသွေး၊ မျှော်လင့်ရမည့်အရာများ', meta: '5 မိနစ်  ·  လမ်းညွှန်'},
      {title: 'ပထမဆုံး ရာသီသွေး လာတော့မည်ကို ဘယ်လိုသိနိုင်မလဲ။', meta: '5 မိနစ်  ·  လမ်းညွှန်'},
      {title: 'ရာသီစက်ဝန်း၏ အဆင့်အမျိုးမျိုး', meta: '5 မိနစ်  ·  ဆောင်းပါး'},
    ],
    shareMessage: 'ပထမဆုံး ရာသီသွေး မလာမီ အစောပိုင်းလက္ခဏာများ — AWA',
  },
  km: {
    badge: 'រដូវដំបូង',
    title: 'សញ្ញាដំបូង\nនៃរដូវលើកដំបូងរបស់អ្នក',
    metaDuration: 'អាន 5 នាទី',
    metaType: 'អត្ថបទ',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'រាងកាយរបស់អ្នកជារឿយៗផ្តល់ការរំលឹកមុនពេលរដូវលើកដំបូងមកដល់។ ការស្គាល់សញ្ញាទាំងនោះអាចជួយឱ្យអ្នកមិនសូវភ្ញាក់ផ្អើល។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ការផ្លាស់ប្តូរបន្តិចម្តងៗ',
      'សញ្ញាដែលត្រូវសង្កេត',
      'អត្ថន័យរបស់វា',
    ],
    body1: 'ក្នុងរយៈពេលជាច្រើនខែមុនរដូវលើកដំបូង រាងកាយរបស់អ្នកផ្លាស់ប្តូរដោយទន់ភ្លន់៖ រូបរាងប្រែប្រួល រោមរាងកាយចាប់ផ្តើមដុះនៅកន្លែងថ្មី ហើយការបែកញើសក៏ប្រែប្រួលដែរ។ ទាំងនេះជាផលប៉ះពាល់ធម្មតានៃវ័យពេញវ័យ ដែលរៀបចំរាងកាយរបស់អ្នកដោយទន់ភ្លន់។',
    tip1Title: 'គួរដឹង',
    tip1Text: 'ការផ្លាស់ប្តូរទាំងនេះមិនកើតឡើងក្នុងពេលតែមួយ ឬក្នុងល្បឿនដូចគ្នាសម្រាប់គ្រប់គ្នាទេ ហើយនោះជារឿងធម្មតាទាំងស្រុង។',
    signs: [
      {title: 'ការផ្លាស់ប្តូររាងកាយ', text: 'រាងកាយរបស់អ្នកផ្លាស់ប្តូរបន្តិចម្តងៗ៖ រូបរាង រោមរាងកាយ និងការបែកញើសអាចប្រែប្រួលទាំងអស់។'},
      {title: 'ទឹករំអិលទ្វារមាស', text: 'ទឹករំអិលស្រាល ពណ៌សស្រាល ជារឿយៗចាប់ផ្តើមលេចឡើងពីរបីខែមុនរដូវលើកដំបូង។'},
      {title: 'ឈឺចុកចាប់ ឬឈឺចាប់ម្តងម្កាល', text: 'អ្នកអាចមានអារម្មណ៍តឹងស្រាល ឬឈឺចាប់ម្តងម្កាលនៅផ្នែកក្រោមពោះ។'},
      {title: 'ការប្រែប្រួលអារម្មណ៍', text: 'ជារឿងធម្មតាដែលមានអារម្មណ៍រសើប ឬឆាប់ខឹងជាងធម្មតា។'},
      {title: 'ឈឺដោះ', text: 'អ្នកអាចកត់សម្គាល់ឃើញការឈឺស្រាល ឬការហើមបន្តិច។'},
    ],
    body2: 'សញ្ញាទាំងនេះជាទូទៅមានន័យថារដូវលើកដំបូងរបស់អ្នកនឹងមកដល់ក្នុងប៉ុន្មានខែបន្ទាប់ ទោះបីមិនអាចទាយកាលបរិច្ឆេទជាក់លាក់បានក៏ដោយ។ ការមានគ្រឿងការពារនៅជិតខ្លួនក្លាយជាទម្លាប់ល្អនៅពេលនេះ។',
    alertTitle: 'សូមកត់សម្គាល់',
    alertText: 'សញ្ញាទាំងនេះជាការណែនាំទូទៅ មិនមែនជាការទស្សន៍ទាយច្បាស់លាស់ឡើយ។ រាងកាយនីមួយៗមានចង្វាក់ផ្ទាល់ខ្លួន។',
    relatedTitle: '♥  អ្នកក៏អាចចូលចិត្ត',
    related: [
      {title: 'រដូវលើកដំបូងរបស់អ្នក៖ អ្វីដែលត្រូវរំពឹងទុក', meta: '5 នាទី  ·  មគ្គុទ្ទេសក៍'},
      {title: 'តើខ្ញុំដឹងដោយរបៀបណាថារដូវលើកដំបូងជិតមកដល់?', meta: '5 នាទី  ·  មគ្គុទ្ទេសក៍'},
      {title: 'ដំណាក់កាលផ្សេងៗនៃវដ្តរដូវ', meta: '5 នាទី  ·  អត្ថបទ'},
    ],
    shareMessage: 'សញ្ញាដំបូងមុនរដូវលើកដំបូង — AWA',
  },
  lo: {
    badge: 'ປະຈຳເດືອນຄັ້ງທຳອິດ',
    title: 'ສັນຍານເບື້ອງຕົ້ນ\nຂອງປະຈຳເດືອນຄັ້ງທຳອິດ',
    metaDuration: 'ອ່ານ 5 ນາທີ',
    metaType: 'ບົດຄວາມ',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ຮ່າງກາຍຂອງທ່ານມັກໃຫ້ສັນຍານບາງຢ່າງກ່ອນທີ່ປະຈຳເດືອນຄັ້ງທຳອິດຈະມາ. ການຮັບຮູ້ສັນຍານເຫຼົ່ານີ້ສາມາດຊ່ວຍໃຫ້ທ່ານຮູ້ສຶກແປກໃຈໜ້ອຍລົງ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ການປ່ຽນແປງຄ່ອຍເປັນຄ່ອຍໄປ',
      'ສັນຍານທີ່ຄວນສັງເກດ',
      'ມັນໝາຍເຖິງຫຍັງ',
    ],
    body1: 'ໃນຫຼາຍເດືອນກ່ອນປະຈຳເດືອນຄັ້ງທຳອິດ ຮ່າງກາຍຂອງທ່ານປ່ຽນແປງຢ່າງນຸ່ມນວນ: ຮູບຮ່າງຂອງທ່ານເລີ່ມປ່ຽນໄປ, ຂົນເລີ່ມຂຶ້ນໃນຈຸດໃໝ່ ແລະ ການຂັບເຫື່ອກໍປ່ຽນແປງເຊັ່ນກັນ. ສິ່ງເຫຼົ່ານີ້ເປັນຜົນປົກກະຕິຂອງໄວໜຸ່ມສາວ ທີ່ກຳລັງກະກຽມຮ່າງກາຍຂອງທ່ານຢ່າງອ່ອນໂຍນ.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text: 'ການປ່ຽນແປງເຫຼົ່ານີ້ບໍ່ໄດ້ເກີດຂຶ້ນພ້ອມກັນ ຫຼື ໃນຈັງຫວະດຽວກັນສຳລັບທຸກຄົນ — ນັ້ນເປັນເລື່ອງປົກກະຕິຢ່າງສົມບູນ.',
    signs: [
      {title: 'ການປ່ຽນແປງຂອງຮ່າງກາຍ', text: 'ຮ່າງກາຍຂອງທ່ານປ່ຽນແປງຄ່ອຍເປັນຄ່ອຍໄປ: ຮູບຮ່າງ, ຂົນ ແລະ ການຂັບເຫື່ອອາດປ່ຽນໄປທັງໝົດ.'},
      {title: 'ຕົກຂາວ', text: 'ຕົກຂາວອ່ອນໆ ສີຂາວນວນ ມັກປາກົດຂຶ້ນກ່ອນປະຈຳເດືອນຄັ້ງທຳອິດຫຼາຍເດືອນ.'},
      {title: 'ອາການເຈັບໆ ຫຼື ຈຸກຈິກ', text: 'ທ່ານອາດຮູ້ສຶກຕຶງເລັກນ້ອຍ ຫຼື ຈຸກຈິກທີ່ທ້ອງນ້ອຍ.'},
      {title: 'ອາລົມປ່ຽນແປງ', text: 'ເປັນເລື່ອງທຳມະດາທີ່ຈະຮູ້ສຶກອ່ອນໄຫວ ຫຼື ໃຈຮ້ອນງ່າຍກວ່າປົກກະຕິ.'},
      {title: 'ເຕົ້ານົມເຈັບຕຶງ', text: 'ທ່ານອາດສັງເກດເຫັນອາການເຈັບຕຶງ ຫຼື ບວມເລັກນ້ອຍ.'},
    ],
    body2: 'ສັນຍານເຫຼົ່ານີ້ມັກໝາຍຄວາມວ່າປະຈຳເດືອນຄັ້ງທຳອິດຈະມາໃນຫຼາຍເດືອນຂ້າງໜ້າ ເຖິງແມ່ນວ່າຈະບໍ່ສາມາດຄາດເດົາວັນທີ່ແນ່ນອນໄດ້. ການມີອຸປະກອນປ້ອງກັນໄວ້ໃກ້ມືຈຶ່ງເປັນນິໄສທີ່ດີໃນຕອນນີ້.',
    alertTitle: 'ກະລຸນາສັງເກດ',
    alertText: 'ສັນຍານເຫຼົ່ານີ້ເປັນພຽງຄຳແນະນຳທົ່ວໄປ ບໍ່ແມ່ນການຄາດຄະເນທີ່ແນ່ນອນ. ແຕ່ລະຮ່າງກາຍມີຈັງຫວະຂອງຕົນເອງ.',
    relatedTitle: '♥  ທ່ານອາດຈະມັກ',
    related: [
      {title: 'ປະຈຳເດືອນຄັ້ງທຳອິດຂອງທ່ານ: ສິ່ງທີ່ຄາດໝາຍໄດ້', meta: '5 ນາທີ  ·  ຄູ່ມື'},
      {title: 'ຈະຮູ້ໄດ້ແນວໃດວ່າປະຈຳເດືອນຄັ້ງທຳອິດກຳລັງຈະມາ?', meta: '5 ນາທີ  ·  ຄູ່ມື'},
      {title: 'ໄລຍະຕ່າງໆ ຂອງຮອບເດືອນ', meta: '5 ນາທີ  ·  ບົດຄວາມ'},
    ],
    shareMessage: 'ສັນຍານເບື້ອງຕົ້ນກ່ອນປະຈຳເດືອນຄັ້ງທຳອິດ — AWA',
  },
} as const);

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
