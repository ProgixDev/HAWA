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
