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

const ID = 'firstperiod-comment-savoir';

const HERO = require('../../assets/images/library/flow-colors-hero.png');

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these illustrations.
const OBSERVE_IMAGES = [
  require('../../assets/images/library/flow-texture-mucus.png'),
  require('../../assets/images/library/spm-woman.png'),
  require('../../assets/images/library/pain-massage.png'),
] as const;

const RELATED_IMAGES = [
  {
    image: require('../../assets/images/library/spm-hero.png'),
    articleId: 'firstperiod-premiers-signes',
  },
  {
    image: require('../../assets/images/library/featured-flow.png'),
    articleId: 'firstperiod-choisir-protection',
  },
  {
    image: CYCLE_PHASES_HERO,
    articleId: 'firstperiod-premieres-regles',
  },
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('FirstPeriodComing', {
  fr: {
    badge: 'PREMIÈRES RÈGLES',
    title: 'Comment savoir si mes\npremières règles arrivent ?',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Quelques signes concrets t’aident à repérer que tes premières règles approchent vraiment.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les signes à observer',
      'Premières pertes : à quoi ressemblent-elles ?',
      'Pertes vaginales ou sang menstruel ?',
      'Quand en parler à un adulte ?',
    ],
    observe: [
      {title: 'Pertes blanchâtres', text: 'De légères pertes claires apparaissent souvent quelques mois avant.'},
      {title: 'Poitrine qui se développe', text: 'Un signe fréquent, apparu généralement bien avant les règles.'},
      {title: 'Tiraillements au ventre', text: 'De petites sensations peuvent annoncer l’arrivée prochaine des règles.'},
    ],
    body2: 'Avant l’arrivée des toutes premières règles, il est fréquent de remarquer de légères pertes blanchâtres ou légèrement jaunâtres dans les sous-vêtements. C’est un phénomène normal, lié à l’activité hormonale qui se met en place.',
    body3: 'Les pertes vaginales sont claires ou blanchâtres, sans odeur marquée. Le sang menstruel, lui, a une couleur rouge à brunâtre et marque le vrai début des règles. Si un doute persiste, ce n’est jamais grave d’en parler.',
    tipTitle: 'Bon à savoir',
    tipText: 'Il n’existe pas de moyen de prédire le jour exact. Garder une protection avec toi dès les premiers signes reste la meilleure habitude.',
    body4: 'Dès que tu observes ces signes, ou dès que tu as une question ou une inquiétude, tu peux en parler à ta mère, une sœur, une proche ou un professionnel de santé de confiance. Il n’y a jamais de mauvais moment pour demander de l’aide.',
    relatedTitle: '♥  Tu pourrais aussi aimer',
    related: [
      {title: 'Les premiers signes avant les règles', meta: '5 min  ·  Article'},
      {title: 'Quelle protection choisir pour mes premières règles ?', meta: '6 min  ·  Guide'},
      {title: 'Tes premières règles : à quoi t’attendre', meta: '5 min  ·  Guide'},
    ],
    shareMessage: 'Comment savoir si mes premières règles arrivent ? — AWA',
  },
  en: {
    badge: 'FIRST PERIOD',
    title: 'How can I tell if my\nfirst period is coming?',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'A few concrete signs can help you recognize that your first period is really on its way.',
    contentsTitle: 'In this article',
    topics: [
      'Signs to watch for',
      'First discharge: what does it look like?',
      'Vaginal discharge or menstrual blood?',
      'When should you talk to an adult?',
    ],
    observe: [
      {title: 'Whitish discharge', text: 'Light, clear discharge often appears a few months beforehand.'},
      {title: 'Breast development', text: 'A common sign that usually appears well before your period.'},
      {title: 'Mild tummy twinges', text: 'Small sensations like these can signal that your period is coming soon.'},
    ],
    body2: 'Before your very first period arrives, it’s common to notice light whitish or slightly yellowish discharge in your underwear. This is a normal phenomenon, linked to the hormonal activity getting underway in your body.',
    body3: 'Vaginal discharge is clear or whitish, without a strong smell. Menstrual blood, on the other hand, is red to brownish in color and marks the true start of your period. If you’re ever unsure, it’s never a big deal to talk about it.',
    tipTitle: 'Good to know',
    tipText: 'There’s no way to predict the exact day. Keeping protection with you from the very first signs is the best habit to have.',
    body4: 'As soon as you notice these signs, or whenever you have a question or a worry, you can talk to your mother, a sister, someone close to you, or a healthcare professional you trust. There’s never a wrong time to ask for help.',
    relatedTitle: '♥  You might also like',
    related: [
      {title: 'The first signs before your period', meta: '5 min  ·  Article'},
      {title: 'Which protection should I choose for my first period?', meta: '6 min  ·  Guide'},
      {title: 'Your first period: what to expect', meta: '5 min  ·  Guide'},
    ],
    shareMessage: 'How can I tell if my first period is coming? — AWA',
  },
  es: {
    badge: 'PRIMERA MENSTRUACIÓN',
    title: '¿Cómo saber si se acerca\nmi primera menstruación?',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Algunas señales concretas te ayudan a reconocer que tu primera menstruación realmente se acerca.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las señales que debes observar',
      'Primeras secreciones: ¿cómo son?',
      '¿Secreción vaginal o sangre menstrual?',
      '¿Cuándo hablar de ello con una persona adulta?',
    ],
    observe: [
      {title: 'Secreción blanquecina', text: 'Suele aparecer una secreción clara y ligera unos meses antes.'},
      {title: 'Desarrollo del pecho', text: 'Una señal frecuente, que suele aparecer mucho antes de la menstruación.'},
      {title: 'Tirones en el vientre', text: 'Pequeñas sensaciones que pueden anunciar la llegada próxima de la menstruación.'},
    ],
    body2: 'Antes de la llegada de la primera menstruación, es frecuente notar una ligera secreción blanquecina o algo amarillenta en la ropa interior. Es un fenómeno normal, relacionado con la actividad hormonal que se está poniendo en marcha.',
    body3: 'La secreción vaginal es clara o blanquecina, sin un olor marcado. La sangre menstrual, en cambio, tiene un color rojo a marrón y marca el verdadero comienzo de la menstruación. Si persiste alguna duda, nunca está de más hablar de ello.',
    tipTitle: 'DATO ÚTIL',
    tipText: 'No existe ninguna forma de predecir el día exacto. Llevar protección contigo desde las primeras señales sigue siendo el mejor hábito.',
    body4: 'En cuanto observes estas señales, o en cuanto tengas una pregunta o una preocupación, puedes hablar de ello con tu madre, una hermana, alguien cercano o un profesional de la salud de confianza. Nunca hay un mal momento para pedir ayuda.',
    relatedTitle: '♥  También te podría gustar',
    related: [
      {title: 'Las primeras señales antes de la menstruación', meta: '5 min  ·  Artículo'},
      {title: '¿Qué protección elegir para mi primera menstruación?', meta: '6 min  ·  Guía'},
      {title: 'Tu primera menstruación: qué esperar', meta: '5 min  ·  Guía'},
    ],
    shareMessage: '¿Cómo saber si se acerca mi primera menstruación? — AWA',
  },
  it: {
    badge: 'PRIMO CICLO',
    title: 'Come capire se sta per\narrivare il mio primo ciclo?',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Alcuni segnali concreti possono aiutarti a riconoscere che il tuo primo ciclo sta davvero per arrivare.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Segnali da osservare',
      'Prime perdite: che aspetto hanno?',
      'Perdite vaginali o sangue mestruale?',
      'Quando parlarne con un adulto?',
    ],
    observe: [
      {
        title: 'Perdite biancastre',
        text: 'Perdite leggere e trasparenti compaiono spesso qualche mese prima.',
      },
      {
        title: 'Sviluppo del seno',
        text: 'Un segnale comune che di solito compare ben prima del ciclo.',
      },
      {
        title: 'Lievi fitte alla pancia',
        text: 'Piccole sensazioni come queste possono indicare che il ciclo sta per arrivare.',
      },
    ],
    body2: 'Prima che arrivi il tuo primissimo ciclo, è comune notare nelle mutandine perdite leggere biancastre o leggermente giallastre. È un fenomeno normale, legato all’attività ormonale che si sta avviando nel tuo corpo.',
    body3: 'Le perdite vaginali sono trasparenti o biancastre, senza odore forte. Il sangue mestruale, invece, è di colore da rosso a brunastro e segna il vero inizio del tuo ciclo. Se hai dei dubbi, parlarne non è mai un problema.',
    tipTitle: 'Da sapere',
    tipText: 'Non c’è modo di prevedere il giorno esatto. Tenere con te un assorbente fin dai primi segnali è la migliore abitudine da avere.',
    body4: 'Non appena noti questi segnali, o ogni volta che hai una domanda o una preoccupazione, puoi parlarne con tua madre, una sorella, una persona a te vicina o un professionista sanitario di cui ti fidi. Non c’è mai un momento sbagliato per chiedere aiuto.',
    relatedTitle: '♥  Potrebbe interessarti anche',
    related: [
      {
        title: 'I primi segnali prima del ciclo',
        meta: '5 min  ·  Articolo',
      },
      {
        title: 'Quale protezione scegliere per il mio primo ciclo?',
        meta: '6 min  ·  Guida',
      },
      {
        title: 'Il tuo primo ciclo: cosa aspettarti',
        meta: '5 min  ·  Guida',
      },
    ],
    shareMessage: 'Come capire se sta per arrivare il mio primo ciclo? — AWA',
  },
  tr: {
    badge: 'İLK ADET',
    title: 'İlk adetimin geldiğini\nnasıl anlarım?',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Birkaç somut işaret, ilk adetinin gerçekten yaklaştığını fark etmene yardımcı olabilir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Dikkat edilecek işaretler',
      'İlk akıntı: nasıl görünür?',
      'Vajinal akıntı mı, adet kanı mı?',
      'Ne zaman bir yetişkinle konuşmalı?',
    ],
    observe: [
      {
        title: 'Beyazımsı akıntı',
        text: 'Hafif, berrak akıntı çoğu zaman birkaç ay önceden görülmeye başlar.',
      },
      {
        title: 'Göğüs gelişimi',
        text: 'Genellikle adetinden epey önce ortaya çıkan yaygın bir işarettir.',
      },
      {
        title: 'Hafif karın sızıları',
        text: 'Bunun gibi küçük hisler, adetinin yakında geleceğinin işareti olabilir.',
      },
    ],
    body2: 'İlk adetin gelmeden önce iç çamaşırında hafif beyazımsı ya da hafif sarımsı bir akıntı fark etmen yaygındır. Bu, vücudunda başlayan hormonal etkinliğe bağlı normal bir durumdur.',
    body3: 'Vajinal akıntı berrak ya da beyazımsıdır ve keskin kokusu yoktur. Adet kanı ise kırmızıdan kahverengiye doğru bir renktedir ve adetinin gerçek başlangıcını işaret eder. Emin olamadığın bir şey olursa bunu konuşmak hiçbir zaman sorun olmaz.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Tam günü önceden tahmin etmenin bir yolu yoktur. İlk işaretlerden itibaren yanında koruma bulundurmak, edinebileceğin en iyi alışkanlıktır.',
    body4: 'Bu işaretleri fark ettiğin anda ya da aklına bir soru veya endişe geldiğinde annenle, bir kız kardeşinle, yakınındaki biriyle veya güvendiğin bir sağlık profesyoneliyle konuşabilirsin. Yardım istemek için yanlış bir zaman yoktur.',
    relatedTitle: '♥  Bunlar da ilgini çekebilir',
    related: [
      {
        title: 'Adetinden önceki ilk işaretler',
        meta: '5 dk  ·  Makale',
      },
      {
        title: 'İlk adetim için hangi korumayı seçmeliyim?',
        meta: '6 dk  ·  Rehber',
      },
      {
        title: 'İlk adetin: neler beklemeli',
        meta: '5 dk  ·  Rehber',
      },
    ],
    shareMessage: 'İlk adetimin geldiğini nasıl anlarım? — AWA',
  },
  ru: {
    badge: 'ПЕРВЫЕ МЕСЯЧНЫЕ',
    title: 'Как понять, что скоро\nначнутся первые месячные?',
    metaDuration: '5 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Несколько конкретных признаков помогут понять, что первые месячные действительно скоро начнутся.',
    contentsTitle: 'В этой статье',
    topics: [
      'На какие признаки обратить внимание',
      'Первые выделения: как они выглядят?',
      'Влагалищные выделения или менструальная кровь?',
      'Когда стоит поговорить со взрослым?',
    ],
    observe: [
      {title: 'Беловатые выделения', text: 'Скудные прозрачные выделения часто появляются за несколько месяцев до месячных.'},
      {title: 'Развитие груди', text: 'Распространённый признак, который обычно появляется задолго до месячных.'},
      {title: 'Лёгкое покалывание в животе', text: 'Такие небольшие ощущения могут говорить о том, что месячные скоро начнутся.'},
    ],
    body2: 'Перед самыми первыми месячными часто можно заметить на белье скудные беловатые или слегка желтоватые выделения. Это нормальное явление, связанное с гормональной активностью, которая начинает проявляться в организме.',
    body3: 'Влагалищные выделения прозрачные или беловатые, без резкого запаха. Менструальная кровь, напротив, имеет цвет от красного до коричневатого и означает настоящее начало месячных. Если вы в чём-то не уверены, поговорить об этом — совершенно нормально.',
    tipTitle: 'Полезно знать',
    tipText: 'Предсказать точный день невозможно. Лучшая привычка — носить с собой средство гигиены с самых первых признаков.',
    body4: 'Как только вы заметите эти признаки или у вас появится вопрос или беспокойство, вы можете поговорить с мамой, сестрой, близким человеком или врачом, которому доверяете. Просить о помощи никогда не бывает неуместно.',
    relatedTitle: '♥  Вам также может понравиться',
    related: [
      {title: 'Первые признаки перед месячными', meta: '5 мин  ·  Статья'},
      {title: 'Какое средство гигиены выбрать для первых месячных?', meta: '6 мин  ·  Руководство'},
      {title: 'Ваши первые месячные: чего ожидать', meta: '5 мин  ·  Руководство'},
    ],
    shareMessage: 'Как понять, что скоро начнутся первые месячные? — AWA',
  },
  de: {
    badge: 'ERSTE PERIODE',
    title: 'Woran erkenne ich, dass\nmeine erste Periode kommt?',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Ein paar konkrete Anzeichen können dir helfen zu erkennen, dass deine erste Periode wirklich bald kommt.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Anzeichen, auf die du achten kannst',
      'Der erste Ausfluss: Wie sieht er aus?',
      'Scheidenausfluss oder Menstruationsblut?',
      'Wann solltest du mit einer erwachsenen Person sprechen?',
    ],
    observe: [
      {title: 'Weißlicher Ausfluss', text: 'Leichter, klarer Ausfluss tritt oft schon einige Monate vorher auf.'},
      {title: 'Brustentwicklung', text: 'Ein häufiges Anzeichen, das meist lange vor der Periode auftritt.'},
      {title: 'Leichtes Ziehen im Bauch', text: 'Kleine Empfindungen wie diese können darauf hindeuten, dass deine Periode bald kommt.'},
    ],
    body2: 'Bevor deine allererste Periode kommt, bemerkst du häufig leichten weißlichen oder leicht gelblichen Ausfluss in deiner Unterwäsche. Das ist ein normaler Vorgang, der mit der hormonellen Aktivität zusammenhängt, die in deinem Körper in Gang kommt.',
    body3: 'Scheidenausfluss ist klar oder weißlich und hat keinen starken Geruch. Menstruationsblut dagegen ist rot bis bräunlich und markiert den eigentlichen Beginn deiner Periode. Wenn du dir einmal unsicher bist, ist es nie ein Problem, darüber zu sprechen.',
    tipTitle: 'Gut zu wissen',
    tipText: 'Der genaue Tag lässt sich nicht vorhersagen. Es ist am besten, schon ab den ersten Anzeichen Schutz dabeizuhaben.',
    body4: 'Sobald du diese Anzeichen bemerkst oder immer dann, wenn du eine Frage oder eine Sorge hast, kannst du mit deiner Mutter, einer Schwester, einer dir nahestehenden Person oder medizinischem Fachpersonal sprechen, dem du vertraust. Es gibt nie einen falschen Zeitpunkt, um Hilfe zu holen.',
    relatedTitle: '♥  Das könnte dir auch gefallen',
    related: [
      {title: 'Die ersten Anzeichen vor der Periode', meta: '5 Min.  ·  Artikel'},
      {title: 'Welchen Schutz soll ich für meine erste Periode wählen?', meta: '6 Min.  ·  Ratgeber'},
      {title: 'Deine erste Periode: Was dich erwartet', meta: '5 Min.  ·  Ratgeber'},
    ],
    shareMessage: 'Woran erkenne ich, dass meine erste Periode kommt? — AWA',
  },
  zh: {
      badge: '初潮',
      title: '怎么知道我的\n初潮快要来了？',
      metaDuration: '阅读约 5 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '有一些具体的迹象，可以帮你认出初潮真的快要来了。',
      contentsTitle: '本文内容',
      topics: [
        '需要留意的迹象',
        '最初的分泌物：是什么样的？',
        '是阴道分泌物还是经血？',
        '什么时候应该和大人聊聊？',
      ],
      observe: [
        {
          title: '乳白色分泌物',
          text: '清淡、透明的分泌物，通常会在初潮前几个月出现。',
        },
        {
          title: '乳房发育',
          text: '这是一个常见的迹象，通常会在月经来潮前很早就出现。',
        },
        {
          title: '小腹轻微的牵拉感',
          text: '像这样的轻微感觉，可能是月经快要来的信号。',
        },
      ],
      body2: '在初潮到来之前，内裤上出现少量乳白色或略带黄色的分泌物很常见。这是正常现象，与你体内开始活跃的激素有关。',
      body3: '阴道分泌物是透明或乳白色的，没有明显气味。而经血呈红色到棕色，标志着月经真正开始。如果你拿不准，把它说出来从来都不是什么大不了的事。',
      tipTitle: '小贴士',
      tipText: '没有办法预测确切的日期。从最初出现迹象时起就随身带好防护用品，是最好的习惯。',
      body4: '一旦你注意到这些迹象，或者有任何疑问和担心，都可以和妈妈、姐姐、身边亲近的人，或你信任的医疗专业人员聊聊。任何时候寻求帮助都不算晚。',
      relatedTitle: '♥  你可能还喜欢',
      related: [
        {
          title: '月经来潮前的最初迹象',
          meta: '5 分钟  ·  文章',
        },
        {
          title: '初潮时该选择哪种防护用品？',
          meta: '6 分钟  ·  指南',
        },
        {
          title: '你的初潮：会发生什么',
          meta: '5 分钟  ·  指南',
        },
      ],
      shareMessage: '怎么知道我的初潮快要来了？ — AWA',
    },
  id: {
    badge: 'HAID PERTAMA',
    title: 'Bagaimana aku tahu kalau\nhaid pertamaku akan datang?',
    metaDuration: '5 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Beberapa tanda nyata bisa membantumu mengenali bahwa haid pertamamu benar-benar sudah dekat.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Tanda yang perlu diperhatikan',
      'Cairan pertama: seperti apa tampilannya?',
      'Keputihan atau darah haid?',
      'Kapan sebaiknya bicara dengan orang dewasa?',
    ],
    observe: [
      {
        title: 'Keputihan',
        text: 'Cairan yang ringan dan bening sering muncul beberapa bulan sebelumnya.',
      },
      {
        title: 'Payudara mulai tumbuh',
        text: 'Tanda umum yang biasanya muncul jauh sebelum haidmu datang.',
      },
      {
        title: 'Rasa nyeri ringan di perut',
        text: 'Sensasi kecil seperti ini bisa menandakan haidmu akan segera datang.',
      },
    ],
    body2: 'Sebelum haid pertamamu datang, lazim kalau kamu melihat cairan keputihan yang putih atau agak kekuningan di celana dalammu. Ini hal yang normal, berkaitan dengan aktivitas hormon yang mulai bekerja di tubuhmu.',
    body3: 'Keputihan berwarna bening atau putih, tanpa bau menyengat. Sementara itu, darah haid berwarna merah hingga kecokelatan dan menandai awal haid yang sesungguhnya. Kalau kamu ragu, membicarakannya bukanlah hal yang memalukan.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Tidak ada cara untuk memprediksi hari yang pasti. Membawa pelindung sejak tanda-tanda pertama adalah kebiasaan terbaik.',
    body4: 'Begitu kamu melihat tanda-tanda ini, atau kapan pun kamu punya pertanyaan atau kekhawatiran, kamu bisa bicara dengan ibumu, kakak perempuanmu, orang terdekat, atau tenaga kesehatan yang kamu percaya. Tidak pernah ada waktu yang salah untuk meminta bantuan.',
    relatedTitle: '♥  Kamu mungkin juga suka',
    related: [
      {
        title: 'Tanda-tanda pertama sebelum haidmu',
        meta: '5 mnt  ·  Artikel',
      },
      {
        title: 'Pelindung apa yang sebaiknya kupilih untuk haid pertama?',
        meta: '6 mnt  ·  Panduan',
      },
      {
        title: 'Haid pertamamu: apa yang bisa diharapkan',
        meta: '5 mnt  ·  Panduan',
      },
    ],
    shareMessage: 'Bagaimana aku tahu kalau haid pertamaku akan datang? — AWA',
  },
  hi: {
    badge: 'पहला पीरियड',
    title: 'मुझे कैसे पता चलेगा कि\nमेरा पहला पीरियड आने वाला है?',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'कुछ ठोस संकेत आपको यह पहचानने में मदद कर सकते हैं कि आपका पहला पीरियड सचमुच आने वाला है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'किन संकेतों पर ध्यान दें',
      'पहला स्राव: यह कैसा दिखता है?',
      'योनि का स्राव या मासिक धर्म का रक्त?',
      'बड़ों से बात कब करनी चाहिए?',
    ],
    observe: [
      {
        title: 'सफ़ेद स्राव',
        text: 'हल्का, साफ़ स्राव अक्सर कुछ महीने पहले दिखने लगता है।',
      },
      {
        title: 'स्तनों का विकास',
        text: 'एक आम संकेत जो आमतौर पर पीरियड से काफ़ी पहले दिखता है।',
      },
      {
        title: 'पेट में हल्की चुभन',
        text: 'ऐसे छोटे एहसास संकेत दे सकते हैं कि आपका पीरियड जल्द आने वाला है।',
      },
    ],
    body2: 'आपका पहला पीरियड आने से पहले, अंडरवियर में हल्का सफ़ेद या थोड़ा पीलापन लिए स्राव दिखना आम बात है। यह एक सामान्य प्रक्रिया है, जो आपके शरीर में शुरू हो रही हार्मोनल गतिविधि से जुड़ी है।',
    body3: 'योनि का स्राव साफ़ या सफ़ेद होता है, बिना तेज़ गंध के। वहीं मासिक धर्म का रक्त लाल से भूरे रंग का होता है और पीरियड की असली शुरुआत का संकेत देता है। अगर कभी आपको शक हो, तो इसके बारे में बात करना कोई बड़ी बात नहीं है।',
    tipTitle: 'जानने लायक बात',
    tipText: 'सही दिन का अनुमान लगाने का कोई तरीक़ा नहीं है। पहले संकेतों से ही प्रोटेक्शन अपने साथ रखना सबसे अच्छी आदत है।',
    body4: 'जैसे ही आपको ये संकेत दिखें, या जब भी कोई सवाल या चिंता हो, आप अपनी माँ, बहन, किसी करीबी या अपने भरोसे के स्वास्थ्य विशेषज्ञ से बात कर सकती हैं। मदद माँगने का कभी कोई ग़लत समय नहीं होता।',
    relatedTitle: '♥  आपको ये भी पसंद आ सकते हैं',
    related: [
      {
        title: 'पीरियड से पहले के पहले संकेत',
        meta: '5 मिनट  ·  लेख',
      },
      {
        title: 'पहले पीरियड के लिए कौन सा प्रोटेक्शन चुनें?',
        meta: '6 मिनट  ·  गाइड',
      },
      {
        title: 'आपका पहला पीरियड: क्या उम्मीद रखें',
        meta: '5 मिनट  ·  गाइड',
      },
    ],
    shareMessage: 'मुझे कैसे पता चलेगा कि मेरा पहला पीरियड आने वाला है? — AWA',
  },
  sq: {
    badge: 'MENSTRUACIONI I PARË',
    title: 'Si e di nëse po vjen\nmenstruacioni im i parë?',
    metaDuration: '5 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Disa shenja konkrete mund të të ndihmojnë të kuptosh se menstruacioni yt i parë po vjen vërtet.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Shenjat për t’u vënë re',
      'Rrjedhja e parë: si duket?',
      'Sekrecione vaginale apo gjak menstrual?',
      'Kur duhet të flasësh me një të rritur?',
    ],
    observe: [
      {
        title: 'Sekrecione të bardha',
        text: 'Sekrecione të lehta e të tejdukshme shfaqen shpesh disa muaj më parë.',
      },
      {
        title: 'Zhvillimi i gjirit',
        text: 'Një shenjë e zakonshme që zakonisht shfaqet shumë përpara menstruacioneve.',
      },
      {
        title: 'Shpime të lehta në bark',
        text: 'Ndjesi të vogla si këto mund të tregojnë se menstruacioni po vjen së shpejti.',
      },
    ],
    body2: 'Përpara se të vijë menstruacioni yt i parë, është e zakonshme të vësh re në të brendshmet sekrecione të lehta të bardha ose paksa të verdha. Ky është një fenomen normal, i lidhur me aktivitetin hormonal që po fillon në trupin tënd.',
    body3: 'Sekrecionet vaginale janë të tejdukshme ose të bardha, pa erë të fortë. Gjaku menstrual, nga ana tjetër, është i kuq deri në kafe dhe shënon fillimin e vërtetë të menstruacioneve. Nëse ke ndonjë dyshim, nuk është kurrë problem të flasësh për të.',
    tipTitle: 'Mirë është ta dish',
    tipText: 'Nuk ka asnjë mënyrë për ta parashikuar ditën e saktë. Të mbash mbrojtëse me vete që nga shenjat e para është zakoni më i mirë që mund të kesh.',
    body4: 'Sapo t’i vësh re këto shenja, ose sa herë që ke një pyetje apo një shqetësim, mund të flasësh me nënën tënde, me një motër, me dikë të afërt ose me një profesionist të shëndetësisë që i beson. Nuk është kurrë koha e gabuar për të kërkuar ndihmë.',
    relatedTitle: '♥  Mund të të pëlqejë edhe',
    related: [
      {
        title: 'Shenjat e para përpara menstruacioneve',
        meta: '5 min  ·  Artikull',
      },
      {
        title: 'Cilën mbrojtëse të zgjedh për menstruacionin tim të parë?',
        meta: '6 min  ·  Udhëzues',
      },
      {
        title: 'Menstruacioni yt i parë: çfarë të presësh',
        meta: '5 min  ·  Udhëzues',
      },
    ],
    shareMessage: 'Si e di nëse po vjen menstruacioni im i parë? — AWA',
  },
  ja: {
    badge: '初めての生理',
    title: '初めての生理が近いか、\nどうすればわかる？',
    metaDuration: '読了5分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: 'いくつかの具体的なサインから、初めての生理が本当に近づいているかどうかに気づくことができます。',
    contentsTitle: 'この記事の内容',
    topics: [
      '気をつけて見たいサイン',
      '初めてのおりもの：どんな様子？',
      'おりものか、経血か？',
      '大人に相談するのはいつ？',
    ],
    observe: [
      {
        title: '白っぽいおりもの',
        text: '透明でさらさらしたおりものが、数か月前から出始めることがよくあります。',
      },
      {
        title: '胸のふくらみ',
        text: 'よく見られるサインで、通常は生理のかなり前から現れます。',
      },
      {
        title: '軽いおなかのつっぱり感',
        text: 'このような小さな感覚が、もうすぐ生理が来るサインのこともあります。',
      },
    ],
    body2: 'ごく初めての生理が来る前に、下着に白っぽい、または少し黄色みがかったおりものが少量つくことはよくあります。これは自然な現象で、体の中で始まったホルモンの働きによるものです。',
    body3: 'おりものは透明か白っぽく、強いにおいはありません。一方、経血は赤色から茶色がかった色で、本当の生理の始まりを示します。わからないときは、話してみるのは決して大げさなことではありません。',
    tipTitle: '知っておきたいこと',
    tipText: '正確な日を予測する方法はありません。最初のサインが出たころから生理用品を持ち歩いておくのが、いちばんよい習慣です。',
    body4: 'これらのサインに気づいたときや、疑問や心配があるときはいつでも、お母さん、姉妹、身近な人、または信頼できる医療従事者に話してみましょう。助けを求めるのに遅すぎるときはありません。',
    relatedTitle: '♥  こちらもおすすめ',
    related: [
      {
        title: '生理の前に現れる最初のサイン',
        meta: '5分  ·  記事',
      },
      {
        title: '初めての生理には、どの生理用品を選べばいい？',
        meta: '6分  ·  ガイド',
      },
      {
        title: '初めての生理：何が起こる？',
        meta: '5分  ·  ガイド',
      },
    ],
    shareMessage: '初めての生理が近いか、どうすればわかる？ — AWA',
  },
  ko: {
    badge: '첫 생리',
    title: '첫 생리가 다가오는지\n어떻게 알 수 있을까요?',
    metaDuration: '읽는 데 5분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '몇 가지 구체적인 신호를 알면 첫 생리가 정말 다가오고 있는지 알아차리는 데 도움이 돼요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '살펴볼 신호',
      '처음 보이는 분비물은 어떤 모습일까요?',
      '질 분비물일까요, 생리혈일까요?',
      '언제 어른에게 이야기해야 할까요?',
    ],
    observe: [
      {
        title: '하얀 분비물',
        text: '연하고 투명한 분비물이 몇 달 전부터 나타나는 경우가 많아요.',
      },
      {
        title: '가슴 발달',
        text: '생리보다 훨씬 앞서 나타나는 흔한 신호예요.',
      },
      {
        title: '가벼운 아랫배의 찌릿함',
        text: '이런 작은 느낌은 곧 생리가 시작된다는 신호일 수 있어요.',
      },
    ],
    body2: '아주 첫 생리가 오기 전에는 속옷에 연한 흰색 또는 약간 노르스름한 분비물이 묻어나는 일이 흔해요. 몸에서 호르몬 활동이 시작되면서 나타나는 정상적인 현상이에요.',
    body3: '질 분비물은 투명하거나 흰색이고 강한 냄새가 없어요. 반면 생리혈은 붉은색에서 갈색을 띠고 진짜 생리가 시작됐다는 표시예요. 헷갈릴 때는 이야기해 보는 것이 전혀 부끄러운 일이 아니에요.',
    tipTitle: '알아 두면 좋아요',
    tipText: '정확한 날짜를 예측할 방법은 없어요. 첫 신호가 보이는 때부터 생리용품을 갖고 다니는 것이 가장 좋은 습관이에요.',
    body4: '이런 신호가 보이거나 궁금한 점, 걱정되는 점이 생기면 언제든 엄마, 언니나 여동생, 가까운 사람, 또는 믿을 수 있는 의료 전문가에게 이야기해도 좋아요. 도움을 청하기에 잘못된 때는 없어요.',
    relatedTitle: '♥  이런 글도 좋아할 거예요',
    related: [
      {
        title: '생리 전에 나타나는 첫 신호',
        meta: '5분  ·  아티클',
      },
      {
        title: '첫 생리에는 어떤 생리용품을 골라야 할까요?',
        meta: '6분  ·  가이드',
      },
      {
        title: '첫 생리: 어떤 일이 있을까요',
        meta: '5분  ·  가이드',
      },
    ],
    shareMessage: '첫 생리가 다가오는지 어떻게 알 수 있을까요? — AWA',
  },
  'pt-PT': {
    badge: 'PRIMEIRO PERÍODO',
    title: 'Como saber se o meu\nprimeiro período está a chegar?',
    metaDuration: '5 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Alguns sinais concretos podem ajudá-la a reconhecer que o seu primeiro período está mesmo a chegar.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Sinais a observar',
      'Primeiro corrimento: como é?',
      'Corrimento vaginal ou sangue menstrual?',
      'Quando falar com um adulto?',
    ],
    observe: [
      {
        title: 'Corrimento esbranquiçado',
        text: 'Um corrimento ligeiro e transparente surge muitas vezes alguns meses antes.',
      },
      {
        title: 'Desenvolvimento dos seios',
        text: 'Um sinal frequente, que costuma surgir bastante antes do período.',
      },
      {
        title: 'Ligeiras pontadas na barriga',
        text: 'Pequenas sensações como estas podem indicar que o período vem a caminho.',
      },
    ],
    body2: 'Antes de chegar o seu primeiro período, é frequente notar um corrimento ligeiro, esbranquiçado ou ligeiramente amarelado, na roupa interior. É um fenómeno normal, associado à atividade hormonal que começa no seu corpo.',
    body3: 'O corrimento vaginal é transparente ou esbranquiçado, sem cheiro forte. O sangue menstrual, por sua vez, é de cor vermelha a acastanhada e marca o verdadeiro início do período. Se alguma vez tiver dúvidas, falar sobre isso nunca é um problema.',
    tipTitle: 'Bom saber',
    tipText: 'Não há maneira de prever o dia exato. Ter sempre proteção consigo desde os primeiros sinais é o melhor hábito a adotar.',
    body4: 'Assim que notar estes sinais, ou sempre que tiver uma dúvida ou uma preocupação, pode falar com a sua mãe, uma irmã, alguém próximo ou um profissional de saúde da sua confiança. Nunca há uma má altura para pedir ajuda.',
    relatedTitle: '♥  Também pode gostar',
    related: [
      {
        title: 'Os primeiros sinais antes do período',
        meta: '5 min  ·  Artigo',
      },
      {
        title: 'Que proteção escolher para o primeiro período?',
        meta: '6 min  ·  Guia',
      },
      {
        title: 'O seu primeiro período: o que esperar',
        meta: '5 min  ·  Guia',
      },
    ],
    shareMessage: 'Como saber se o meu primeiro período está a chegar? — AWA',
  },
  bn: {
    badge: 'প্রথম মাসিক',
    title: 'আমার প্রথম মাসিক আসছে কি না\nকীভাবে বুঝব?',
    metaDuration: 'পড়তে 5 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'কয়েকটি সুনির্দিষ্ট লক্ষণ বুঝতে সাহায্য করতে পারে যে আপনার প্রথম মাসিক সত্যিই আসার পথে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'যেসব লক্ষণে নজর রাখবেন',
      'প্রথম স্রাব: দেখতে কেমন?',
      'যোনিপথের স্রাব না মাসিকের রক্ত?',
      'কখন বড় কারও সঙ্গে কথা বলবেন?',
    ],
    observe: [
      {
        title: 'সাদাটে স্রাব',
        text: 'হালকা, স্বচ্ছ স্রাব প্রায়ই কয়েক মাস আগে থেকে দেখা দেয়।',
      },
      {
        title: 'স্তনের বিকাশ',
        text: 'একটি সাধারণ লক্ষণ যা সাধারণত মাসিকের অনেক আগেই দেখা যায়।',
      },
      {
        title: 'পেটে হালকা খোঁচা খোঁচা অনুভূতি',
        text: 'এমন ছোট অনুভূতি ইঙ্গিত দিতে পারে যে মাসিক শীঘ্রই আসছে।',
      },
    ],
    body2: 'আপনার একেবারে প্রথম মাসিক আসার আগে অন্তর্বাসে হালকা সাদাটে বা সামান্য হলদেটে স্রাব লক্ষ্য করা সাধারণ। এটি একটি স্বাভাবিক ঘটনা, যা আপনার শরীরে শুরু হতে থাকা হরমোনের কার্যকলাপের সঙ্গে সম্পর্কিত।',
    body3: 'যোনিপথের স্রাব স্বচ্ছ বা সাদাটে হয়, তীব্র গন্ধ থাকে না। অন্যদিকে মাসিকের রক্ত লাল থেকে বাদামি রঙের হয় এবং এটি আপনার মাসিকের প্রকৃত শুরু বোঝায়। কখনো নিশ্চিত না হলে এ নিয়ে কথা বলা মোটেও বড় কিছু নয়।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'সঠিক দিনটি আগে থেকে বলে দেওয়ার কোনো উপায় নেই। একেবারে প্রথম লক্ষণ থেকেই সঙ্গে সুরক্ষা রাখা সবচেয়ে ভালো অভ্যাস।',
    body4: 'এই লক্ষণগুলো টের পেলেই, অথবা যখনই কোনো প্রশ্ন বা দুশ্চিন্তা থাকে, আপনি আপনার মা, বোন, কাছের কারও বা আপনার বিশ্বাসী একজন স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলতে পারেন। সাহায্য চাওয়ার জন্য কখনোই ভুল সময় বলে কিছু নেই।',
    relatedTitle: '♥  আপনার আরও ভালো লাগতে পারে',
    related: [
      {
        title: 'মাসিকের আগের প্রথম লক্ষণগুলো',
        meta: '5 মিনিট  ·  নিবন্ধ',
      },
      {
        title: 'প্রথম মাসিকের জন্য কোন সুরক্ষা বেছে নেব?',
        meta: '6 মিনিট  ·  গাইড',
      },
      {
        title: 'আপনার প্রথম মাসিক: কী আশা করবেন',
        meta: '5 মিনিট  ·  গাইড',
      },
    ],
    shareMessage: 'আমার প্রথম মাসিক আসছে কি না কীভাবে বুঝব? — AWA',
  },
  da: {
    badge: 'FØRSTE MENSTRUATION',
    title: 'Hvordan ved jeg, om min\nførste menstruation er på vej?',
    metaDuration: '5 min læsning',
    metaType: 'Guide',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Visse specifikke tegn kan hjælpe dig med at forstå, om din første menstruation virkelig er på vej.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Tegn du bør holde øje med',
      'Den første blødning: hvordan ser den ud?',
      'Vaginal udflåd eller menstruationsblod?',
      'Hvornår du skal tale med en voksen?',
    ],
    observe: [
      {
        title: 'Hvidlig udflåd',
        text: 'Let, klar udflåd opstår ofte et par måneder i forvejen.',
      },
      {
        title: 'Brystudvikling',
        text: 'Et almindeligt tegn, der normalt ses lang tid inden menstruationen.',
      },
      {
        title: 'Let stikken i maven',
        text: 'Sådanne små fornemmelser kan indikere, at menstruationen snart kommer.',
      },
    ],
    body2: 'Inden din allerførste menstruation er det almindeligt at bemærke let hvidlig eller let gullig udflåd i undertøjet. Det er en normal hændelse, der er forbundet med den hormonelle aktivitet, der begynder i din krop.',
    body3: 'Vaginal udflåd er klar eller hvidlig og har ingen stærk lugt. Menstruationsblod er derimod rødligt til brunt og markerer den egentlige start på din menstruation. Det er aldrig noget at bekymre sig om, hvis du er usikker.',
    tipTitle: 'Godt at vide',
    tipText: 'Der er ingen måde at forudsige den præcise dato på forhånd. Den bedste vane er at have beskyttelse med sig fra de allerførste tegn.',
    body4: 'Når du mærker disse tegn, eller når du har spørgsmål eller bekymringer, kan du tale med din mor, søster, en nær person eller en betroet sundhedsprofessionel. Det er aldrig det forkerte tidspunkt at søge hjælp.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'Tidlige tegn inden menstruationen',
        meta: '5 min  ·  Artikel',
      },
      {
        title: 'Hvilken beskyttelse skal jeg vælge til min første menstruation?',
        meta: '6 min  ·  Guide',
      },
      {
        title: 'Din første menstruation: hvad du kan forvente',
        meta: '5 min  ·  Guide',
      },
    ],
    shareMessage: 'Hvordan ved jeg, om min første menstruation er på vej? — AWA',
  },
  sv: {
    badge: 'FÖRSTE MENSTRUATION',
    title: 'Hvordan ved jeg, om min\nförste menstruation ar på vej?',
    metaDuration: '5 min läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Visse specifikke tegn kan hjälpe dig med at forstå, om din förste menstruation virkelig ar på vej.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Tegn du bör holde öje med',
      'Den förste blödning: hvordan ser den ud?',
      'Vaginal udflåd eller menstruationsblod?',
      'Hvornår du skal tale med en voksen?',
    ],
    observe: [
      {
        title: 'Hvidlig udflåd',
        text: 'Let, klar udflåd opstår ofta et par måneder i forvejen.',
      },
      {
        title: 'Brystudvikling',
        text: 'Et almindeligt tegn, der normalt ses lang tid inden menstruationen.',
      },
      {
        title: 'Let stikken i maven',
        text: 'Sådanne små fornemmelser kan indikere, at menstruationen snart kommer.',
      },
    ],
    body2: 'Inden din allerförste menstruation ar det almindeligt at bemärke let hvidlig eller let gullig udflåd i undertöjet. Det ar en normal händelse, der ar forbundet med den hormonelle aktivitet, der begynder i din krop.',
    body3: 'Vaginal udflåd ar klar eller hvidlig och har ingen stärk lugt. Menstruationsblod ar derimod rödligt till brunt och markerer den egentlige start på din menstruation. Det ar aldrig noget at bekymre sig om, hvis du ar usikker.',
    tipTitle: 'Godt at vide',
    tipText: 'Der ar ingen måde at forudsige den präcise dato på forhånd. Den bedste vane ar at have beskyttelse med sig fran de allerförste tegn.',
    body4: 'Når du märker disse tegn, eller når du har spörgsmål eller bekymringer, kan du tale med din mor, söster, en när person eller en betroet halsasprofessionel. Det ar aldrig det forkerte tidspunkt at söge hjälp.',
    relatedTitle: '♥  Du vil måske også synes om',
    related: [
      {
        title: 'Tidlige tegn inden menstruationen',
        meta: '5 min  ·  Artikel',
      },
      {
        title: 'Hvilken beskyttelse skal jag välge till min förste menstruation?',
        meta: '6 min  ·  Guide',
      },
      {
        title: 'Din förste menstruation: hvad du kan forvente',
        meta: '5 min  ·  Guide',
      },
    ],
    shareMessage: 'Hvordan ved jeg, om min förste menstruation ar på vej? — AWA',
  },
  nb: {
    badge: 'FØRSTE MENS',
    title: 'Hvordan vet jeg at den første\nmensen er på vei?',
    metaDuration: '5 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Noen konkrete tegn kan hjelpe deg å kjenne igjen at den første mensen virkelig er på vei.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Tegn å være oppmerksom på',
      'Første utflod: hvordan ser den ut?',
      'Vaginal utflod eller menstruasjonsblod?',
      'Når bør du snakke med en voksen?',
    ],
    observe: [
      {title: 'Hvitaktig utflod', text: 'Lett, klar utflod dukker ofte opp noen måneder i forveien.'},
      {title: 'Brystutvikling', text: 'Et vanlig tegn som vanligvis kommer lenge før mensen.'},
      {title: 'Lette napp i magen', text: 'Små fornemmelser som disse kan tyde på at mensen kommer snart.'},
    ],
    body2: 'Før den aller første mensen kommer, er det vanlig å legge merke til lett hvitaktig eller svakt gulaktig utflod i trusen. Dette er et normalt fenomen, knyttet til den hormonelle aktiviteten som er i gang i kroppen din.',
    body3: 'Vaginal utflod er klar eller hvitaktig, uten sterk lukt. Menstruasjonsblod derimot er rødt til brunlig og markerer den egentlige starten på mensen. Hvis du noen gang er usikker, er det aldri noe problem å snakke om det.',
    tipTitle: 'Godt å vite',
    tipText: 'Det er ikke mulig å forutsi nøyaktig dag. Å ha beskyttelse med seg fra de aller første tegnene er den beste vanen å ha.',
    body4: 'Så snart du legger merke til disse tegnene, eller når du har et spørsmål eller en bekymring, kan du snakke med moren din, en søster, noen du står nær eller helsepersonell du stoler på. Det er aldri feil tidspunkt å be om hjelp.',
    relatedTitle: '♥  Dette liker du kanskje også',
    related: [
      {title: 'De første tegnene før mensen', meta: '5 min  ·  Artikkel'},
      {title: 'Hvilken beskyttelse bør jeg velge til den første mensen?', meta: '6 min  ·  Veiledning'},
      {title: 'Din første mens: hva du kan forvente', meta: '5 min  ·  Veiledning'},
    ],
    shareMessage: 'Hvordan vet jeg at den første mensen er på vei? – AWA',
  },
  pl: {
    badge: 'PIERWSZA MIESIĄCZKA',
    title: 'Jak rozpoznać, że zbliża się\nmoja pierwsza miesiączka?',
    metaDuration: '5 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Kilka konkretnych oznak może pomóc Ci rozpoznać, że pierwsza miesiączka naprawdę się zbliża.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Oznaki, na które warto zwracać uwagę',
      'Pierwsze upławy: jak wyglądają?',
      'Upławy czy krew menstruacyjna?',
      'Kiedy porozmawiać z dorosłą osobą?',
    ],
    observe: [
      {title: 'Białawe upławy', text: 'Lekkie, przejrzyste upławy często pojawiają się kilka miesięcy wcześniej.'},
      {title: 'Rozwój piersi', text: 'Częsta oznaka, która zwykle pojawia się na długo przed miesiączką.'},
      {title: 'Lekkie ukłucia w brzuchu', text: 'Takie drobne odczucia mogą sygnalizować, że miesiączka wkrótce się pojawi.'},
    ],
    body2: 'Zanim pojawi się Twoja pierwsza miesiączka, często zauważa się na bieliźnie lekkie białawe lub lekko żółtawe upławy. To normalne zjawisko, związane z uruchamiającą się w Twoim ciele aktywnością hormonalną.',
    body3: 'Upławy są przejrzyste lub białawe, bez silnego zapachu. Krew menstruacyjna jest natomiast czerwona do brązowawej i oznacza prawdziwy początek miesiączki. Jeśli kiedykolwiek masz wątpliwości, rozmowa o tym nigdy nie jest problemem.',
    tipTitle: 'Warto wiedzieć',
    tipText: 'Nie da się przewidzieć dokładnego dnia. Noszenie przy sobie środka ochrony od pierwszych oznak to najlepszy nawyk.',
    body4: 'Gdy tylko zauważysz te oznaki albo gdy masz pytanie lub obawy, możesz porozmawiać z mamą, siostrą, bliską osobą lub specjalistą, któremu ufasz. Nigdy nie jest zły moment, by poprosić o pomoc.',
    relatedTitle: '♥  Może Cię też zainteresować',
    related: [
      {title: 'Pierwsze oznaki przed miesiączką', meta: '5 min  ·  Artykuł'},
      {title: 'Jaki środek ochrony wybrać na pierwszą miesiączkę?', meta: '6 min  ·  Poradnik'},
      {title: 'Twoja pierwsza miesiączka: czego się spodziewać', meta: '5 min  ·  Poradnik'},
    ],
    shareMessage: 'Jak rozpoznać, że zbliża się moja pierwsza miesiączka? — AWA',
  },
  uk: {
    badge: 'ПЕРША МЕНСТРУАЦІЯ',
    title: 'Як зрозуміти, що наближається\nмоя перша менструація?',
    metaDuration: '5 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Кілька конкретних ознак можуть допомогти зрозуміти, що перша менструація справді вже близько.',
    contentsTitle: 'У цій статті',
    topics: [
      'Ознаки, на які варто звертати увагу',
      'Перші виділення: як вони виглядають?',
      'Вагінальні виділення чи менструальна кров?',
      'Коли поговорити з дорослою людиною?',
    ],
    observe: [
      {title: 'Білуваті виділення', text: 'Легкі прозорі виділення часто з’являються за кілька місяців до того.'},
      {title: 'Розвиток грудей', text: 'Поширена ознака, що зазвичай з’являється задовго до менструації.'},
      {title: 'Легке поколювання в животі', text: 'Такі невеликі відчуття можуть сигналізувати, що менструація скоро почнеться.'},
    ],
    body2: 'Перед першою менструацією часто можна помітити на білизні легкі білуваті або злегка жовтуваті виділення. Це нормальне явище, пов’язане з гормональною активністю, що розпочинається у вашому тілі.',
    body3: 'Вагінальні виділення прозорі або білуваті, без різкого запаху. Менструальна кров натомість червона або коричнювата й означає справжній початок менструації. Якщо ви не певні, поговорити про це ніколи не буде проблемою.',
    tipTitle: 'Варто знати',
    tipText: 'Передбачити точний день неможливо. Тримати засіб гігієни при собі від перших ознак — найкраща звичка.',
    body4: 'Щойно ви помітили ці ознаки або коли у вас є запитання чи тривога, ви можете поговорити з мамою, сестрою, близькою людиною або лікарем, якому довіряєте. Нема поганого моменту, щоб попросити допомоги.',
    relatedTitle: '♥  Вас також може зацікавити',
    related: [
      {title: 'Перші ознаки перед менструацією', meta: '5 хв  ·  Стаття'},
      {title: 'Який засіб гігієни обрати для першої менструації?', meta: '6 хв  ·  Посібник'},
      {title: 'Ваша перша менструація: чого очікувати', meta: '5 хв  ·  Посібник'},
    ],
    shareMessage: 'Як зрозуміти, що наближається моя перша менструація? — AWA',
  },
  cs: {
    badge: 'PRVNÍ MENSTRUACE',
    title: 'Jak poznám, že se blíží\nmoje první menstruace?',
    metaDuration: '5 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Několik konkrétních příznaků vám může pomoci poznat, že vaše první menstruace opravdu přichází.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Příznaky, kterých si všímat',
      'První výtok: jak vypadá?',
      'Poševní výtok, nebo menstruační krev?',
      'Kdy si promluvit s dospělým?',
    ],
    observe: [
      {title: 'Bělavý výtok', text: 'Slabý, čirý výtok se často objevuje několik měsíců předem.'},
      {title: 'Vývoj prsou', text: 'Častý příznak, který se obvykle objevuje dlouho před menstruací.'},
      {title: 'Lehké pobolívání v bříšku', text: 'Takové drobné pocity mohou signalizovat, že menstruace brzy přijde.'},
    ],
    body2: 'Než přijde vaše vůbec první menstruace, je běžné si všimnout slabého bělavého nebo lehce nažloutlého výtoku ve spodním prádle. Je to normální jev související s hormonální aktivitou, která se ve vašem těle rozjíždí.',
    body3: 'Poševní výtok je čirý nebo bělavý, bez silného zápachu. Menstruační krev je naopak červená až nahnědlá a označuje skutečný začátek menstruace. Pokud si někdy nejste jistá, není nikdy problém o tom mluvit.',
    tipTitle: 'Stojí za to vědět',
    tipText: 'Přesný den nelze předpovědět. Nosit u sebe ochranu už od prvních příznaků je nejlepší návyk.',
    body4: 'Jakmile si těchto příznaků všimnete, nebo kdykoli máte otázku či obavu, můžete si promluvit s maminkou, sestrou, někým blízkým nebo zdravotnickým pracovníkem, kterému důvěřujete. Nikdy není špatná chvíle požádat o pomoc.',
    relatedTitle: '♥  Mohlo by se vám líbit',
    related: [
      {title: 'První příznaky před menstruací', meta: '5 min  ·  Článek'},
      {title: 'Jakou ochranu zvolit při první menstruaci?', meta: '6 min  ·  Průvodce'},
      {title: 'Vaše první menstruace: co očekávat', meta: '5 min  ·  Průvodce'},
    ],
    shareMessage: 'Jak poznám, že se blíží moje první menstruace? — AWA',
  },
  sk: {
    badge: 'PRVÁ MENŠTRUÁCIA',
    title: 'Ako zistím, či sa blíži\nmoja prvá menštruácia?',
    metaDuration: '5 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Niekoľko konkrétnych znakov vám môže pomôcť rozpoznať, že vaša prvá menštruácia sa skutočne blíži.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Znaky, ktoré treba sledovať',
      'Prvý výtok: ako vyzerá?',
      'Vaginálny výtok alebo menštruačná krv?',
      'Kedy sa porozprávať s dospelou osobou?',
    ],
    observe: [
      {title: 'Belavý výtok', text: 'Svetlý, číry výtok sa často objaví niekoľko mesiacov vopred.'},
      {title: 'Vývoj prsníkov', text: 'Bežný znak, ktorý sa zvyčajne objaví dlho pred menštruáciou.'},
      {title: 'Mierne pichanie v bruchu', text: 'Takéto drobné pocity môžu signalizovať, že menštruácia sa čoskoro objaví.'},
    ],
    body2: 'Skôr než príde vaša úplne prvá menštruácia, je bežné všimnúť si na bielizni svetlý belavý alebo mierne žltkastý výtok. Je to normálny jav spojený s hormonálnou aktivitou, ktorá sa v tele rozbieha.',
    body3: 'Vaginálny výtok je číry alebo belavý, bez silného zápachu. Menštruačná krv je naopak červená až hnedastá a označuje skutočný začiatok menštruácie. Ak si niekedy nie ste istá, nikdy nie je problém sa o tom porozprávať.',
    tipTitle: 'Stojí za to vedieť',
    tipText: 'Presný deň sa predpovedať nedá. Najlepším návykom je mať pri sebe hygienické pomôcky už od prvých znakov.',
    body4: 'Hneď ako si tieto znaky všimnete, alebo kedykoľvek máte otázku či obavu, môžete sa porozprávať s mamou, sestrou, blízkou osobou alebo zdravotníckym pracovníkom, ktorému dôverujete. Nikdy nie je zlý čas požiadať o pomoc.',
    relatedTitle: '♥  Mohlo by sa vám páčiť',
    related: [
      {title: 'Prvé znaky pred menštruáciou', meta: '5 min  ·  Článok'},
      {title: 'Ktorú hygienickú pomôcku si vybrať na prvú menštruáciu?', meta: '6 min  ·  Sprievodca'},
      {title: 'Vaša prvá menštruácia: čo očakávať', meta: '5 min  ·  Sprievodca'},
    ],
    shareMessage: 'Ako zistím, či sa blíži moja prvá menštruácia? — AWA',
  },
  hu: {
    badge: 'AZ ELSŐ MENSTRUÁCIÓ',
    title: 'Honnan tudom, hogy közeleg\naz első menstruációm?',
    metaDuration: '5 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Néhány konkrét jel segíthet felismerni, hogy az első menstruációd valóban közeleg.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Figyelendő jelek',
      'Az első folyás: hogyan néz ki?',
      'Hüvelyi folyás vagy menstruációs vér?',
      'Mikor beszélj egy felnőttel?',
    ],
    observe: [
      {title: 'Fehéres folyás', text: 'A világos, átlátszó folyás gyakran néhány hónappal korábban jelenik meg.'},
      {title: 'A mellek fejlődése', text: 'Gyakori jel, amely általában jóval a menstruáció előtt megjelenik.'},
      {title: 'Enyhe szúrás a hasban', text: 'Az ilyen apró érzetek jelezhetik, hogy a menstruáció hamarosan megjön.'},
    ],
    body2: 'Mielőtt megjön az első menstruációd, gyakori, hogy a bugyidban világos fehéres vagy enyhén sárgás folyást veszel észre. Ez normális jelenség, amely a testedben elinduló hormonális aktivitással függ össze.',
    body3: 'A hüvelyi folyás átlátszó vagy fehéres, erős szag nélkül. A menstruációs vér ezzel szemben vörös és barnás közötti színű, és a menstruáció valódi kezdetét jelzi. Ha valaha bizonytalan vagy, soha nem baj beszélni róla.',
    tipTitle: 'Érdemes tudni',
    tipText: 'A pontos napot nem lehet megjósolni. A legjobb szokás, ha már az első jelektől kezdve magadnál tartod a higiéniai terméket.',
    body4: 'Amint észreveszed ezeket a jeleket, vagy bármikor, amikor kérdésed vagy aggodalmad van, beszélhetsz az anyáddal, egy testvéreddel, egy közeli személlyel vagy egy egészségügyi szakemberrel, akiben bízol. Soha nincs rossz pillanat segítséget kérni.',
    relatedTitle: '♥  Ez is tetszhet',
    related: [
      {title: 'Az első jelek a menstruáció előtt', meta: '5 perc  ·  Cikk'},
      {title: 'Melyik higiéniai terméket válasszam az első menstruációmra?', meta: '6 perc  ·  Útmutató'},
      {title: 'Az első menstruációd: mire számíts', meta: '5 perc  ·  Útmutató'},
    ],
    shareMessage: 'Honnan tudom, hogy közeleg az első menstruációm? — AWA',
  },
  ro: {
    badge: 'PRIMA MENSTRUAȚIE',
    title: 'Cum îmi dau seama că\nprima menstruație se apropie?',
    metaDuration: '5 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Câteva semne concrete te pot ajuta să recunoști că prima ta menstruație chiar se apropie.',
    contentsTitle: 'În acest articol',
    topics: [
      'Semne de urmărit',
      'Primele secreții: cum arată?',
      'Secreții vaginale sau sânge menstrual?',
      'Când să vorbești cu un adult?',
    ],
    observe: [
      {title: 'Secreții albicioase', text: 'Secrețiile ușoare, limpezi apar adesea cu câteva luni înainte.'},
      {title: 'Dezvoltarea sânilor', text: 'Un semn frecvent, care apare de obicei cu mult înaintea menstruației.'},
      {title: 'Mici junghiuri în burtă', text: 'Senzațiile mici de acest fel pot semnala că menstruația se apropie.'},
    ],
    body2: 'Înainte de sosirea primei menstruații, este frecvent să observi în lenjerie secreții ușoare, albicioase sau ușor gălbui. Este un fenomen normal, legat de activitatea hormonală care se pune în mișcare în corpul tău.',
    body3: 'Secrețiile vaginale sunt limpezi sau albicioase, fără miros puternic. Sângele menstrual, în schimb, are culoarea roșie până la brună și marchează adevăratul început al menstruației. Dacă ai vreodată îndoieli, nu este niciodată o problemă să vorbești despre asta.',
    tipTitle: 'Bine de știut',
    tipText: 'Nu există nicio modalitate de a prezice ziua exactă. Obiceiul cel mai bun este să ai la tine o protecție încă de la primele semne.',
    body4: 'De îndată ce observi aceste semne, sau oricând ai o întrebare ori o îngrijorare, poți vorbi cu mama ta, cu o soră, cu o persoană apropiată sau cu un profesionist din domeniul sănătății în care ai încredere. Nu există niciodată un moment nepotrivit pentru a cere ajutor.',
    relatedTitle: '♥  Ți-ar putea plăcea și',
    related: [
      {title: 'Primele semne dinaintea menstruației', meta: '5 min  ·  Articol'},
      {title: 'Ce protecție să aleg pentru prima menstruație?', meta: '6 min  ·  Ghid'},
      {title: 'Prima ta menstruație: la ce să te aștepți', meta: '5 min  ·  Ghid'},
    ],
    shareMessage: 'Cum îmi dau seama că prima menstruație se apropie? — AWA',
  },
  bg: {
    badge: 'ПЪРВА МЕНСТРУАЦИЯ',
    title: 'Как да разбера, че първата ми\nменструация идва?',
    metaDuration: '5 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Няколко конкретни признака могат да ти помогнат да разпознаеш, че първата ти менструация наистина идва.',
    contentsTitle: 'В тази статия',
    topics: [
      'Признаци, които да следиш',
      'Първите секрети: как изглеждат?',
      'Вагинални секрети или менструална кръв?',
      'Кога да поговориш с възрастен?',
    ],
    observe: [
      {title: 'Белезникави секрети', text: 'Леките, бистри секрети често се появяват няколко месеца по-рано.'},
      {title: 'Развитие на гърдите', text: 'Често срещан признак, който обикновено се появява много преди менструацията.'},
      {title: 'Леки убождания в корема', text: 'Малки усещания като тези могат да сигнализират, че менструацията идва скоро.'},
    ],
    body2: 'Преди да дойде първата ти менструация, е често да забележиш леки белезникави или леко жълтеникави секрети по бельото си. Това е нормален феномен, свързан с хормоналната активност, която се задейства в тялото ти.',
    body3: 'Вагиналните секрети са бистри или белезникави, без силна миризма. Менструалната кръв, от друга страна, е с цвят от червен до кафеникав и бележи истинското начало на менструацията ти. Ако някога се съмняваш, никога не е проблем да говориш за това.',
    tipTitle: 'Добре е да знаеш',
    tipText: 'Няма начин да се предвиди точният ден. Да имаш защита подръка още от първите признаци е най-добрият навик.',
    body4: 'Щом забележиш тези признаци или когато имаш въпрос или притеснение, можеш да поговориш с майка си, сестра, близък човек или здравен специалист, на когото имаш доверие. Никога не е неподходящ момент да поискаш помощ.',
    relatedTitle: '♥  Може да ти хареса и',
    related: [
      {title: 'Първите признаци преди менструацията', meta: '5 мин  ·  Статия'},
      {title: 'Каква защита да избера за първата си менструация?', meta: '6 мин  ·  Ръководство'},
      {title: 'Първата ти менструация: какво да очакваш', meta: '5 мин  ·  Ръководство'},
    ],
    shareMessage: 'Как да разбера, че първата ми менструация идва? — AWA',
  },
  sr: {
    badge: 'ПРВА МЕНСТРУАЦИЈА',
    title: 'Како да знам да ми\nдолази прва менструација?',
    metaDuration: '5 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Неколико конкретних знакова може ти помоћи да препознаш да твоја прва менструација заиста стиже.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Знаци на које треба обратити пажњу',
      'Први исцедак: како изгледа?',
      'Вагинални исцедак или менструална крв?',
      'Када да разговараш са одраслом особом?',
    ],
    observe: [
      {title: 'Беличасти исцедак', text: 'Лаган, бистар исцедак често се појављује неколико месеци раније.'},
      {title: 'Развој дојки', text: 'Чест знак који се обично јавља знатно пре менструације.'},
      {title: 'Блага убадања у стомаку', text: 'Мале сензације као ове могу сигнализирати да менструација ускоро стиже.'},
    ],
    body2: 'Пре него што стигне твоја прва менструација, уобичајено је приметити лаган беличаст или благо жућкаст исцедак на доњем вешу. То је нормална појава, везана за хормонску активност која се покреће у твом телу.',
    body3: 'Вагинални исцедак је бистар или беличаст, без јаког мириса. Менструална крв је, с друге стране, црвене до смеђкасте боје и означава прави почетак менструације. Ако си икада у недоумици, никада није велика ствар разговарати о томе.',
    tipTitle: 'Добро је знати',
    tipText: 'Не постоји начин да се предвиди тачан дан. Носити заштиту са собом од првих знакова најбоља је навика.',
    body4: 'Чим приметиш ове знакове, или кад год имаш питање или бригу, можеш разговарати са мајком, сестром, блиском особом или здравственим радником коме верујеш. Никада није погрешно време да се затражи помоћ.',
    relatedTitle: '♥  Можда ће ти се свидети и',
    related: [
      {title: 'Први знаци пре менструације', meta: '5 мин  ·  Чланак'},
      {title: 'Коју заштиту да изаберем за прву менструацију?', meta: '6 мин  ·  Водич'},
      {title: 'Твоја прва менструација: шта да очекујеш', meta: '5 мин  ·  Водич'},
    ],
    shareMessage: 'Како да знам да ми долази прва менструација? — AWA',
  },
  hr: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Kako mogu znati da\nmi stiže prva menstruacija?',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Nekoliko konkretnih znakova može ti pomoći prepoznati da ti prva menstruacija doista stiže.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Znakovi na koje treba paziti',
      'Prvi iscjedak: kako izgleda?',
      'Vaginalni iscjedak ili menstrualna krv?',
      'Kada razgovarati s odraslom osobom?',
    ],
    observe: [
      {title: 'Bjelkast iscjedak', text: 'Lagan, bistar iscjedak često se pojavljuje nekoliko mjeseci prije.'},
      {title: 'Razvoj grudi', text: 'Čest znak koji se obično pojavljuje znatno prije menstruacije.'},
      {title: 'Blago grčenje u trbuhu', text: 'Takvi mali osjećaji mogu biti znak da menstruacija uskoro stiže.'},
    ],
    body2: 'Prije nego što stigne tvoja prva menstruacija, uobičajeno je primijetiti lagan bjelkast ili blago žućkast iscjedak na donjem rublju. To je normalna pojava, povezana s hormonskom aktivnošću koja se pokreće u tvom tijelu.',
    body3: 'Vaginalni iscjedak je bistar ili bjelkast, bez jakog mirisa. Menstrualna krv je, naprotiv, crvene do smećkaste boje i označava pravi početak menstruacije. Ako si ikad nesigurna, razgovor o tome nikad nije problem.',
    tipTitle: 'Dobro je znati',
    tipText: 'Nemoguće je predvidjeti točan dan. Nositi zaštitu sa sobom od prvih znakova najbolja je navika.',
    body4: 'Čim primijetiš te znakove, ili kad god imaš pitanje ili brigu, možeš razgovarati s majkom, sestrom, bliskom osobom ili zdravstvenim djelatnikom kojem vjeruješ. Nikad nije pogrešno vrijeme za traženje pomoći.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Prvi znakovi prije menstruacije', meta: '5 min  ·  Članak'},
      {title: 'Koju zaštitu odabrati za prvu menstruaciju?', meta: '6 min  ·  Vodič'},
      {title: 'Tvoja prva menstruacija: što očekivati', meta: '5 min  ·  Vodič'},
    ],
    shareMessage: 'Kako mogu znati da mi stiže prva menstruacija? — AWA',
  },
  bs: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Kako mogu znati da\nmi stiže prva menstruacija?',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Nekoliko konkretnih znakova može ti pomoći prepoznati da ti prva menstruacija doista stiže.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Znakovi na koje treba paziti',
      'Prvi iscjedak: kako izgleda?',
      'Vaginalni iscjedak ili menstrualna krv?',
      'Kada razgovarati s odraslom osobom?',
    ],
    observe: [
      {title: 'Bjelkast iscjedak', text: 'Lagan, bistar iscjedak često se pojavljuje nekoliko mjeseci prije.'},
      {title: 'Razvoj grudi', text: 'Čest znak koji se obično pojavljuje znatno prije menstruacije.'},
      {title: 'Blago grčenje u trbuhu', text: 'Takvi mali osjećaji mogu biti znak da menstruacija uskoro stiže.'},
    ],
    body2: 'Prije nego što stigne tvoja prva menstruacija, uobičajeno je primijetiti lagan bjelkast ili blago žućkast iscjedak na donjem rublju. To je normalna pojava, povezana s hormonskom aktivnošću koja se pokreće u tvom tijelu.',
    body3: 'Vaginalni iscjedak je bistar ili bjelkast, bez jakog mirisa. Menstrualna krv je, naprotiv, crvene do smećkaste boje i označava pravi početak menstruacije. Ako si ikad nesigurna, razgovor o tome nikad nije problem.',
    tipTitle: 'Dobro je znati',
    tipText: 'Nemoguće je predvidjeti točan dan. Nositi zaštitu sa sobom od prvih znakova najbolja je navika.',
    body4: 'Čim primijetiš te znakove, ili kad god imaš pitanje ili brigu, možeš razgovarati s majkom, sestrom, bliskom osobom ili zdravstvenim radnikom kojem vjeruješ. Nikad nije pogrešno vrijeme za traženje pomoći.',
    relatedTitle: '♥  Moglo bi ti se svidjeti',
    related: [
      {title: 'Prvi znakovi prije menstruacije', meta: '5 min  ·  Članak'},
      {title: 'Koju zaštitu odabrati za prvu menstruaciju?', meta: '6 min  ·  Vodič'},
      {title: 'Tvoja prva menstruacija: što očekivati', meta: '5 min  ·  Vodič'},
    ],
    shareMessage: 'Kako mogu znati da mi stiže prva menstruacija? — AWA',
  },
  sl: {
    badge: 'PRVA MENSTRUACIJA',
    title: 'Kako lahko vem, da prihaja\nmoja prva menstruacija?',
    metaDuration: '5 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Nekaj konkretnih znakov ti lahko pomaga prepoznati, da tvoja prva menstruacija res prihaja.',
    contentsTitle: 'V tem članku',
    topics: [
      'Znaki, na katere je treba paziti',
      'Prvi izcedek: kako izgleda?',
      'Nožnični izcedek ali menstrualna kri?',
      'Kdaj govoriti z odraslo osebo?',
    ],
    observe: [
      {title: 'Beličast izcedek', text: 'Lahek, bister izcedek se pogosto pojavi nekaj mesecev prej.'},
      {title: 'Razvoj prsi', text: 'Pogost znak, ki se običajno pojavi precej pred menstruacijo.'},
      {title: 'Blago zbadanje v trebuhu', text: 'Takšni majhni občutki so lahko znak, da menstruacija kmalu prihaja.'},
    ],
    body2: 'Preden pride tvoja prva menstruacija, je običajno opaziti lahek beličast ali rahlo rumenkast izcedek na spodnjem perilu. To je normalen pojav, povezan s hormonsko dejavnostjo, ki se zažene v tvojem telesu.',
    body3: 'Nožnični izcedek je bister ali beličast, brez močnega vonja. Menstrualna kri pa je rdeče do rjavkaste barve in označuje pravi začetek menstruacije. Če si kdaj negotova, pogovor o tem nikoli ni težava.',
    tipTitle: 'Vredno vedeti',
    tipText: 'Natančnega dne ni mogoče napovedati. Nositi zaščito s seboj že od prvih znakov je najboljša navada.',
    body4: 'Takoj ko opaziš te znake ali kadar koli imaš vprašanje ali skrb, se lahko pogovoriš z mamo, sestro, bližnjo osebo ali zdravstvenim delavcem, ki mu zaupaš. Nikoli ni napačen čas za prošnjo za pomoč.',
    relatedTitle: '♥  Morda ti bo všeč tudi',
    related: [
      {title: 'Prvi znaki pred menstruacijo', meta: '5 min  ·  Članek'},
      {title: 'Katero zaščito izbrati za prvo menstruacijo?', meta: '6 min  ·  Vodnik'},
      {title: 'Tvoja prva menstruacija: kaj pričakovati', meta: '5 min  ·  Vodnik'},
    ],
    shareMessage: 'Kako lahko vem, da prihaja moja prva menstruacija? — AWA',
  },
  ne: {
    badge: 'पहिलो महिनावारी',
    title: 'मेरो पहिलो महिनावारी आउँदै\nछ भनेर कसरी थाहा पाउने?',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'केही ठोस संकेतहरूले तपाईंको पहिलो महिनावारी साँच्चै आउँदै छ भनेर चिन्न मद्दत गर्न सक्छन्।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'ध्यान दिनुपर्ने संकेतहरू',
      'पहिलो स्राव: यो कस्तो देखिन्छ?',
      'योनिको स्राव कि महिनावारीको रगत?',
      'वयस्कसँग कहिले कुरा गर्ने?',
    ],
    observe: [
      {title: 'सेतोजस्तो स्राव', text: 'हल्का, स्पष्ट स्राव प्रायः केही महिनाअघि देखिन थाल्छ।'},
      {title: 'स्तनको विकास', text: 'एउटा सामान्य संकेत जुन सामान्यतया महिनावारी आउनुभन्दा धेरै अघि देखिन्छ।'},
      {title: 'पेटमा हल्का चिमोटाइ', text: 'यस्ता साना अनुभूतिहरूले तपाईंको महिनावारी चाँडै आउँदै छ भन्ने जनाउन सक्छन्।'},
    ],
    body2: 'तपाईंको पहिलो महिनावारी आउनुअघि, अन्तर्वस्त्रमा हल्का सेतोजस्तो वा अलिकति पहेँलो स्राव देख्नु सामान्य हो। यो एउटा सामान्य घटना हो, जुन तपाईंको शरीरमा सुरु हुँदै गरेको हर्मोनल गतिविधिसँग जोडिएको हुन्छ।',
    body3: 'योनिको स्राव स्पष्ट वा सेतोजस्तो हुन्छ, कडा गन्धबिना। महिनावारीको रगत भने रातोदेखि खैरो रङको हुन्छ र तपाईंको महिनावारीको वास्तविक सुरुवात चिह्नित गर्छ। कहिल्यै शङ्का लागे, यसबारे कुरा गर्नु ठूलो कुरा होइन।',
    tipTitle: 'जान्न लायक',
    tipText: 'सही दिनको पूर्वानुमान गर्ने कुनै उपाय छैन। पहिला संकेतहरूदेखि नै आफूसँग सुरक्षा राख्नु सबैभन्दा राम्रो बानी हो।',
    body4: 'यी संकेतहरू देख्नेबित्तिकै, वा कुनै प्रश्न वा चिन्ता हुँदा, तपाईं आफ्नी आमा, दिदीबहिनी, नजिकको कोही वा आफूले विश्वास गर्ने स्वास्थ्यकर्मीसँग कुरा गर्न सक्नुहुन्छ। मद्दत माग्ने कुनै गलत समय हुँदैन।',
    relatedTitle: '♥  तपाईंलाई यी पनि मन पर्न सक्छन्',
    related: [
      {title: 'महिनावारीअघिका पहिला संकेतहरू', meta: '5 मिनेट  ·  लेख'},
      {title: 'पहिलो महिनावारीका लागि कुन सुरक्षा छान्ने?', meta: '6 मिनेट  ·  मार्गदर्शन'},
      {title: 'तपाईंको पहिलो महिनावारी: के अपेक्षा गर्ने', meta: '5 मिनेट  ·  मार्गदर्शन'},
    ],
    shareMessage: 'मेरो पहिलो महिनावारी आउँदै छ भनेर कसरी थाहा पाउने? — AWA',
  },
  si: {
    badge: 'පළමු ඔසප්',
    title: 'මගේ පළමු ඔසප් පැමිණෙන බව\nදැනගන්නේ කෙසේද?',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ පළමු ඔසප් සැබවින්ම පැමිණෙමින් සිටින බව හඳුනාගැනීමට සැබෑ සලකුණු කිහිපයක් ඔබට උපකාරී විය හැක.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'අවධානයට ලක් කළ යුතු සලකුණු',
      'පළමු ස්‍රාවය: එය පෙනෙන්නේ කෙසේද?',
      'යෝනි ස්‍රාවයද, ඔසප් ලේද?',
      'වැඩිහිටියෙකු සමඟ කතා කළ යුත්තේ කවදාද?',
    ],
    observe: [
      {title: 'සුදුපැහැති ස්‍රාවය', text: 'සැහැල්ලු, පැහැදිලි ස්‍රාවය බොහෝ විට මාස කිහිපයකට පෙර දිස් වේ.'},
      {title: 'පියයුරු වර්ධනය', text: 'සාමාන්‍යයෙන් ඔබේ ඔසප්වලට බොහෝ කලකට පෙර දිස්වන පොදු සලකුණකි.'},
      {title: 'සැහැල්ලු බඩ පිරිමැදීම්', text: 'මෙවැනි කුඩා සංවේදනයන්ට ඔබේ ඔසප් ඉක්මනින් පැමිණෙන බව සංඥා කළ හැක.'},
    ],
    body2: 'ඔබේ පළමු ඔසප් පැමිණීමට පෙර, ඔබේ යට ඇඳුමේ සැහැල්ලු සුදුපැහැති හෝ තරමක් කහපැහැති ස්‍රාවයක් දැකීම සාමාන්‍යයි. මෙය ඔබේ ශරීරයේ ආරම්භ වන හෝමෝන ක්‍රියාකාරිත්වයට සම්බන්ධ සාමාන්‍ය සංසිද්ධියකි.',
    body3: 'යෝනි ස්‍රාවය පැහැදිලි හෝ සුදුපැහැති වන අතර, දැඩි ගඳක් නොමැත. ඔසප් ලේ, අනෙක් අතට, රතු සිට දුඹුරු පැහැයක් ඇති අතර ඔබේ ඔසප්වල සැබෑ ආරම්භය සලකුණු කරයි. ඔබට කිසිවිටක සැකයක් ඇත්නම්, ඒ ගැන කතා කිරීම කිසිවිටෙකත් විශාල දෙයක් නොවේ.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText: 'නිවැරදි දිනය පුරෝකථනය කිරීමට ක්‍රමයක් නැත. පළමු සලකුණුවල සිටම ඔබ සමඟ ආරක්ෂාව තබාගැනීම ඇති හොඳම පුරුද්දයි.',
    body4: 'ඔබ මෙම සලකුණු දුටු විගස, හෝ ඔබට ප්‍රශ්නයක් හෝ කනස්සල්ලක් ඇති ඕනෑම වේලාවක, ඔබට ඔබේ අම්මා, සහෝදරියක්, ඔබට සමීප කෙනෙක්, හෝ ඔබ විශ්වාස කරන සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කළ හැක. උදව් ඉල්ලීමට වැරදි වේලාවක් කිසිවිටෙක නැත.',
    relatedTitle: '♥  ඔබට මෙයද වුවමනා විය හැක',
    related: [
      {title: 'ඔබේ ඔසප්වලට පෙර පළමු සලකුණු', meta: 'මිනි. 5  ·  ලිපිය'},
      {title: 'මගේ පළමු ඔසප් සඳහා කුමන ආරක්ෂාව තෝරා ගත යුතුද?', meta: 'මිනි. 6  ·  මාර්ගෝපදේශය'},
      {title: 'ඔබේ පළමු ඔසප්: අපේක්ෂා කළ යුත්තේ කුමක්ද', meta: 'මිනි. 5  ·  මාර්ගෝපදේශය'},
    ],
    shareMessage: 'මගේ පළමු ඔසප් පැමිණෙන බව දැනගන්නේ කෙසේද? — AWA',
  },
  th: {
    badge: 'ประจำเดือนครั้งแรก',
    title: 'ฉันรู้ได้อย่างไรว่า\nประจำเดือนครั้งแรกใกล้มา?',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'สัญญาณที่เป็นรูปธรรมไม่กี่อย่างช่วยให้คุณรู้ว่าประจำเดือนครั้งแรกใกล้มาถึงจริง ๆ',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'สัญญาณที่ควรสังเกต',
      'ตกขาวครั้งแรก: มีลักษณะอย่างไร?',
      'ตกขาวหรือเลือดประจำเดือน?',
      'เมื่อไรควรคุยกับผู้ใหญ่?',
    ],
    observe: [
      {title: 'ตกขาวสีขาวขุ่น', text: 'ตกขาวใสบาง ๆ มักปรากฏก่อนหน้าหลายเดือน'},
      {title: 'การพัฒนาของเต้านม', text: 'สัญญาณที่พบบ่อยซึ่งมักปรากฏนานก่อนประจำเดือน'},
      {title: 'ปวดท้องเบา ๆ', text: 'ความรู้สึกเล็ก ๆ เช่นนี้อาจบอกว่าประจำเดือนใกล้มา'},
    ],
    body2: 'ก่อนประจำเดือนครั้งแรกจะมา เป็นเรื่องปกติที่จะสังเกตเห็นตกขาวสีขาวขุ่นหรือเหลืองอ่อนบาง ๆ ในกางเกงใน นี่เป็นปรากฏการณ์ปกติ ซึ่งเกี่ยวข้องกับการทำงานของฮอร์โมนที่เริ่มขึ้นในร่างกาย',
    body3: 'ตกขาวเป็นสีใสหรือขาว ไม่มีกลิ่นแรง ส่วนเลือดประจำเดือนมีสีแดงถึงน้ำตาล และเป็นจุดเริ่มต้นที่แท้จริงของประจำเดือน หากไม่แน่ใจ การพูดคุยเรื่องนี้ไม่ใช่เรื่องใหญ่เลย',
    tipTitle: 'ควรรู้',
    tipText: 'ไม่มีวิธีทำนายวันที่แน่นอน การพกอุปกรณ์ติดตัวตั้งแต่สัญญาณแรกเป็นนิสัยที่ดีที่สุด',
    body4: 'ทันทีที่คุณสังเกตเห็นสัญญาณเหล่านี้ หรือเมื่อใดก็ตามที่มีคำถามหรือความกังวล คุณพูดคุยกับแม่ พี่สาว คนใกล้ชิด หรือบุคลากรทางการแพทย์ที่คุณไว้ใจได้ ไม่มีเวลาที่ไม่เหมาะสมในการขอความช่วยเหลือ',
    relatedTitle: '♥  คุณอาจสนใจ',
    related: [
      {title: 'สัญญาณแรกก่อนประจำเดือนจะมา', meta: '5 นาที  ·  บทความ'},
      {title: 'ฉันควรเลือกอุปกรณ์แบบไหนสำหรับประจำเดือนครั้งแรก?', meta: '6 นาที  ·  คู่มือ'},
      {title: 'ประจำเดือนครั้งแรกของคุณ: สิ่งที่คาดหวังได้', meta: '5 นาที  ·  คู่มือ'},
    ],
    shareMessage: 'ฉันรู้ได้อย่างไรว่าประจำเดือนครั้งแรกใกล้มา? — AWA',
  },
  vi: {
    badge: 'KỲ KINH ĐẦU TIÊN',
    title: 'Làm sao biết kỳ kinh\nđầu tiên của tôi sắp đến?',
    metaDuration: '5 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Một vài dấu hiệu cụ thể có thể giúp bạn nhận ra rằng kỳ kinh đầu tiên thực sự sắp đến.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Những dấu hiệu cần chú ý',
      'Dịch tiết đầu tiên: trông như thế nào?',
      'Khí hư hay máu kinh?',
      'Khi nào nên nói chuyện với người lớn?',
    ],
    observe: [
      {title: 'Khí hư màu trắng đục', text: 'Dịch tiết nhẹ, trong thường xuất hiện vài tháng trước đó.'},
      {title: 'Ngực phát triển', text: 'Một dấu hiệu phổ biến thường xuất hiện từ rất sớm trước kỳ kinh.'},
      {title: 'Đau bụng nhẹ', text: 'Những cảm giác nhỏ như vậy có thể báo hiệu kỳ kinh sắp đến.'},
    ],
    body2: 'Trước khi kỳ kinh đầu tiên đến, bạn thường nhận thấy dịch tiết nhẹ màu trắng đục hoặc hơi vàng trên quần lót. Đây là hiện tượng bình thường, liên quan đến hoạt động nội tiết đang bắt đầu trong cơ thể bạn.',
    body3: 'Khí hư trong hoặc trắng đục, không có mùi nồng. Còn máu kinh có màu từ đỏ đến nâu và đánh dấu sự bắt đầu thực sự của kỳ kinh. Nếu bạn không chắc chắn, việc nói chuyện về điều đó không bao giờ là chuyện lớn.',
    tipTitle: 'Nên biết',
    tipText: 'Không có cách nào dự đoán chính xác ngày. Mang theo sản phẩm vệ sinh từ những dấu hiệu đầu tiên là thói quen tốt nhất.',
    body4: 'Ngay khi bạn nhận thấy những dấu hiệu này, hoặc bất cứ khi nào bạn có thắc mắc hay lo lắng, bạn có thể nói chuyện với mẹ, chị em gái, một người thân thiết hoặc một nhân viên y tế mà bạn tin tưởng. Không bao giờ có thời điểm sai để nhờ giúp đỡ.',
    relatedTitle: '♥  Có thể bạn cũng thích',
    related: [
      {title: 'Những dấu hiệu đầu tiên trước kỳ kinh', meta: '5 phút  ·  Bài viết'},
      {title: 'Nên chọn sản phẩm vệ sinh nào cho kỳ kinh đầu tiên?', meta: '6 phút  ·  Hướng dẫn'},
      {title: 'Kỳ kinh đầu tiên của bạn: điều cần biết', meta: '5 phút  ·  Hướng dẫn'},
    ],
    shareMessage: 'Làm sao biết kỳ kinh đầu tiên của tôi sắp đến? — AWA',
  },
  uz: {
    badge: 'BIRINCHI HAYZ',
    title: 'Birinchi hayzim yaqinlashayotganini\nqanday bilaman?',
    metaDuration: '5 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Bir nechta aniq belgi birinchi hayzingiz haqiqatan yaqinlashayotganini tanishga yordam beradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Eʼtibor berish kerak boʻlgan belgilar',
      'Birinchi ajralmalar: qanday koʻrinadi?',
      'Qin ajralmasi yoki hayz qoni?',
      'Qachon kattalar bilan gaplashish kerak?',
    ],
    observe: [
      {title: 'Oqish ajralmalar', text: 'Yengil, shaffof ajralmalar koʻpincha bir necha oy oldin paydo boʻladi.'},
      {title: 'Koʻkrakning rivojlanishi', text: 'Odatda hayzdan ancha oldin paydo boʻladigan keng tarqalgan belgi.'},
      {title: 'Qorinda yengil sanchiqlar', text: 'Shunday kichik sezgilar hayz yaqinlashayotganini bildirishi mumkin.'},
    ],
    body2: 'Birinchi hayzingiz boshlanishidan oldin ichki kiyimingizda yengil oqish yoki biroz sargʻish ajralmalarni sezishingiz odatiy hol. Bu tanangizda boshlangan gormonal faollik bilan bogʻliq meʼyoriy hodisa.',
    body3: 'Qin ajralmasi shaffof yoki oqish boʻladi va kuchli hidga ega emas. Hayz qoni esa qizildan jigarranggacha rangda boʻladi va hayzning haqiqiy boshlanishini bildiradi. Agar shubhangiz boʻlsa, bu haqda gaplashish hech qachon xijolatli emas.',
    tipTitle: 'Bilish foydali',
    tipText: 'Aniq kunni oldindan aytib boʻlmaydi. Dastlabki belgilardanoq yoningizda himoya vositasini olib yurish eng yaxshi odat.',
    body4: 'Bu belgilarni sezishingiz bilan yoki savol yoki xavotiringiz boʻlganda onangiz, opangiz, yaqin kishingiz yoki ishongan shifokoringiz bilan gaplashishingiz mumkin. Yordam soʻrash uchun hech qachon notoʻgʻri vaqt boʻlmaydi.',
    relatedTitle: '♥  Sizga yoqishi mumkin',
    related: [
      {title: 'Hayzdan oldingi dastlabki belgilar', meta: '5 daq  ·  Maqola'},
      {title: 'Birinchi hayzim uchun qaysi vositani tanlashim kerak?', meta: '6 daq  ·  Qoʻllanma'},
      {title: 'Birinchi hayzingiz: nimalarni kutish kerak', meta: '5 daq  ·  Qoʻllanma'},
    ],
    shareMessage: 'Birinchi hayzim yaqinlashayotganini qanday bilaman? — AWA',
  },
  az: {
    badge: 'İLK AYBAŞI',
    title: 'İlk aybaşımın yaxınlaşdığını\nnecə anlaya bilərəm?',
    metaDuration: '5 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Bir neçə konkret əlamət ilk aybaşınızın həqiqətən yolda olduğunu tanımağa kömək edə bilər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Nəyə diqqət etmək lazımdır',
      'İlk ifrazat: necə görünür?',
      'Vaginal ifrazat, yoxsa aybaşı qanı?',
      'Nə vaxt böyüklə danışmaq lazımdır?',
    ],
    observe: [
      {title: 'Ağımtıl ifrazat', text: 'Yüngül, şəffaf ifrazat çox vaxt bir neçə ay əvvəl görünür.'},
      {title: 'Döşün inkişafı', text: 'Aybaşından xeyli əvvəl görünən geniş yayılmış əlamət.'},
      {title: 'Qarında yüngül sancılar', text: 'Belə kiçik hisslər aybaşının tezliklə başlayacağının siqnalı ola bilər.'},
    ],
    body2: 'İlk aybaşınız başlamazdan əvvəl alt paltarınızda yüngül ağımtıl və ya bir qədər sarımtıl ifrazat görmək adi haldır. Bu, bədəninizdə başlayan hormonal fəaliyyətlə bağlı normal bir hadisədir.',
    body3: 'Vaginal ifrazat şəffaf və ya ağımtıl olur, kəskin qoxusu olmur. Aybaşı qanı isə qırmızıdan qəhvəyiyə qədər rəngdə olur və aybaşınızın həqiqi başlanğıcını bildirir. Əmin deyilsinizsə, bu barədə danışmaq heç vaxt böyük məsələ deyil.',
    tipTitle: 'Bilmək faydalıdır',
    tipText: 'Dəqiq günü əvvəlcədən bilmək mümkün deyil. İlk əlamətlərdən etibarən qoruyucu vasitəni özünüzlə gəzdirmək ən yaxşı vərdişdir.',
    body4: 'Bu əlamətləri görən kimi və ya sualınız, narahatlığınız olanda ananızla, bacınızla, yaxın biri ilə və ya etibar etdiyiniz tibb işçisi ilə danışa bilərsiniz. Kömək istəmək üçün heç vaxt yanlış vaxt yoxdur.',
    relatedTitle: '♥  Bunlar da xoşunuza gələ bilər',
    related: [
      {title: 'Aybaşından əvvəlki ilk əlamətlər', meta: '5 dəq  ·  Məqalə'},
      {title: 'İlk aybaşım üçün hansı qoruyucu vasitəni seçməliyəm?', meta: '6 dəq  ·  Bələdçi'},
      {title: 'İlk aybaşınız: nələri gözləmək olar', meta: '5 dəq  ·  Bələdçi'},
    ],
    shareMessage: 'İlk aybaşımın yaxınlaşdığını necə anlaya bilərəm? — AWA',
  },
  ka: {
    badge: 'პირველი მენსტრუაცია',
    title: 'როგორ გავიგო, რომ ჩემი\nპირველი მენსტრუაცია მოდის?',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'რამდენიმე კონკრეტულმა ნიშანმა შეიძლება დაგეხმაროთ იმის ამოცნობაში, რომ თქვენი პირველი მენსტრუაცია ნამდვილად მოდის.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'ნიშნები, რომლებსაც უნდა დააკვირდეთ',
      'პირველი გამონადენი: როგორ გამოიყურება?',
      'ვაგინალური გამონადენი თუ მენსტრუაციული სისხლი?',
      'როდის უნდა ესაუბროთ უფროსს?',
    ],
    observe: [
      {title: 'მოთეთრო გამონადენი', text: 'მსუბუქი, გამჭვირვალე გამონადენი ხშირად რამდენიმე თვით ადრე ჩნდება.'},
      {title: 'მკერდის განვითარება', text: 'გავრცელებული ნიშანი, რომელიც ჩვეულებრივ მენსტრუაციამდე დიდი ხნით ადრე ჩნდება.'},
      {title: 'მუცელში მსუბუქი ჩხვლეტა', text: 'ასეთმა მცირე შეგრძნებებმა შეიძლება მიანიშნოს, რომ მენსტრუაცია მალე მოდის.'},
    ],
    body2: 'თქვენი პირველი მენსტრუაციის დაწყებამდე ხშირია საცვალზე მსუბუქი მოთეთრო ან ოდნავ მოყვითალო გამონადენის შემჩნევა. ეს ნორმალური მოვლენაა, რომელიც თქვენს სხეულში დაწყებულ ჰორმონულ აქტივობას უკავშირდება.',
    body3: 'ვაგინალური გამონადენი გამჭვირვალეა ან მოთეთრო, ძლიერი სუნის გარეშე. მენსტრუაციული სისხლი კი წითელი ან მურა ფერისაა და თქვენი მენსტრუაციის ნამდვილ დაწყებას აღნიშნავს. თუ ოდესმე დარწმუნებული არ ხართ, ამის შესახებ საუბარი არასდროს არის დიდი საქმე.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText: 'ზუსტი დღის განჭვრეტა შეუძლებელია. პირველივე ნიშნებიდან დამცავი საშუალების თან ქონა საუკეთესო ჩვევაა.',
    body4: 'როგორც კი ამ ნიშნებს შეამჩნევთ, ან როცა გაქვთ შეკითხვა ან შეშფოთება, შეგიძლიათ ესაუბროთ დედას, დას, ახლობელ ადამიანს ან ჯანდაცვის სპეციალისტს, რომელსაც ენდობით. დახმარების თხოვნისთვის არასწორი დრო არასდროს არის.',
    relatedTitle: '♥  შეიძლება მოგეწონოთ',
    related: [
      {title: 'პირველი ნიშნები მენსტრუაციამდე', meta: '5 წთ  ·  სტატია'},
      {title: 'რომელი დამცავი საშუალება ავირჩიო პირველი მენსტრუაციისთვის?', meta: '6 წთ  ·  გზამკვლევი'},
      {title: 'თქვენი პირველი მენსტრუაცია: რას უნდა ელოდეთ', meta: '5 წთ  ·  გზამკვლევი'},
    ],
    shareMessage: 'როგორ გავიგო, რომ ჩემი პირველი მენსტრუაცია მოდის? — AWA',
  },
  hy: {
    badge: 'ԱՌԱՋԻՆ ԴԱՇՏԱՆ',
    title: 'Ինչպե՞ս իմանալ, որ իմ\nառաջին դաշտանը մոտենում է:',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Մի քանի կոնկրետ նշաններ կարող են օգնել ճանաչել, որ ձեր առաջին դաշտանն իսկապես մոտենում է:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Նշաններ, որոնց պետք է ուշադրություն դարձնել',
      'Առաջին արտազատուկ. ինչպիսի՞ն է այն',
      'Հեշտոցային արտազատուկ, թե՞ դաշտանային արյուն',
      'Ե՞րբ խոսել մեծահասակի հետ',
    ],
    observe: [
      {title: 'Սպիտակավուն արտազատուկ', text: 'Թեթև, թափանցիկ արտազատուկը հաճախ հայտնվում է մի քանի ամիս առաջ:'},
      {title: 'Կրծքի զարգացում', text: 'Տարածված նշան, որը սովորաբար հայտնվում է դաշտանից շատ առաջ:'},
      {title: 'Թեթև ծակոցներ որովայնում', text: 'Նման փոքր զգացողությունները կարող են ազդանշան լինել, որ դաշտանը շուտով կսկսվի:'},
    ],
    body2: 'Ձեր առաջին դաշտանի գալուց առաջ տարածված է ներքնազգեստի վրա նկատել թեթև սպիտակավուն կամ թեթևակի դեղնավուն արտազատուկ: Սա նորմալ երևույթ է, որը կապված է ձեր մարմնում սկսվող հորմոնալ ակտիվության հետ:',
    body3: 'Հեշտոցային արտազատուկը թափանցիկ է կամ սպիտակավուն, առանց սուր հոտի: Դաշտանային արյունը, ընդհակառակը, կարմիրից շագանակագույն գույնի է և նշում է ձեր դաշտանի իրական սկիզբը: Եթե երբևէ վստահ չեք, այդ մասին խոսելը երբեք մեծ խնդիր չէ:',
    tipTitle: 'Լավ է իմանալ',
    tipText: 'Ճշգրիտ օրը կանխատեսել հնարավոր չէ: Առաջին նշաններից սկսած պաշտպանության միջոց ձեզ հետ պահելը լավագույն սովորությունն է:',
    body4: 'Հենց նկատեք այս նշանները, կամ երբ հարց կամ անհանգստություն ունեք, կարող եք խոսել մոր, քրոջ, ձեզ մոտ մարդու կամ ձեր վստահած առողջապահության մասնագետի հետ: Օգնություն խնդրելու համար երբեք սխալ ժամանակ չկա:',
    relatedTitle: '♥  Ձեզ կարող է նաև հետաքրքրել',
    related: [
      {title: 'Առաջին նշանները դաշտանից առաջ', meta: '5 ր  ·  Հոդված'},
      {title: 'Ի՞նչ պաշտպանություն ընտրել առաջին դաշտանիս համար', meta: '6 ր  ·  Ուղեցույց'},
      {title: 'Ձեր առաջին դաշտանը. ինչ սպասել', meta: '5 ր  ·  Ուղեցույց'},
    ],
    shareMessage: 'Ինչպե՞ս իմանալ, որ իմ առաջին դաշտանը մոտենում է: — AWA',
  },
  tg: {
    badge: 'ҲАЙЗИ АВВАЛ',
    title: 'Чӣ тавр бифаҳмам, ки\nҳайзи аввалам меояд?',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Чанд нишонаи мушаххас метавонанд ба шумо кумак кунанд бифаҳмед, ки ҳайзи аввали шумо воқеан наздик аст.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Нишонаҳое, ки бояд пайгирӣ кард',
      'Тарашшуҳи аввал: чӣ гуна менамояд?',
      'Тарашшуҳи маҳбал ё хуни ҳайз?',
      'Кай бояд бо калонсол гап зад?',
    ],
    observe: [
      {title: 'Тарашшуҳи сафедтоб', text: 'Тарашшуҳи сабук ва шаффоф аксар вақт чанд моҳ пеш пайдо мешавад.'},
      {title: 'Инкишофи пистон', text: 'Нишонаи маъмуле, ки одатан хеле пеш аз ҳайз пайдо мешавад.'},
      {title: 'Дарди сабуки шикам', text: 'Эҳсосоти хурд мисли ин метавонанд нишон диҳанд, ки ҳайз ба зудӣ меояд.'},
    ],
    body2: 'Пеш аз омадани ҳайзи аввали шумо маъмул аст, ки дар либоси таг тарашшуҳи сабуки сафедтоб ё андаке зардтобро мушоҳида кунед. Ин падидаи муқаррарӣ аст, ки бо фаъолияти гормонӣ дар бадани шумо алоқаманд аст.',
    body3: 'Тарашшуҳи маҳбал шаффоф ё сафедтоб аст, бидуни бӯи тез. Хуни ҳайз бошад, сурх то қаҳваранг аст ва оғози ҳақиқии ҳайзи шуморо нишон медиҳад. Агар ягон вақт шубҳа кунед, дар ин бора гап задан ҳеҷ гоҳ мушкил нест.',
    tipTitle: 'Донистан хуб аст',
    tipText: 'Рӯзи дақиқро пешгӯӣ кардан имконнопазир аст. Аз аввалин нишонаҳо воситаи муҳофизатро бо худ доштан беҳтарин одат аст.',
    body4: 'Ҳамин ки ин нишонаҳоро мушоҳида кунед ё ҳар вақт савол ё нигаронӣ дошта бошед, метавонед бо модар, хоҳар, шахси наздик ё мутахассиси соҳаи тибе, ки ба ӯ боварӣ доред, гап занед. Ҳеҷ гоҳ вақти нодуруст барои кумак пурсидан нест.',
    relatedTitle: '♥  Шояд ба шумо ҳам маъқул шавад',
    related: [
      {title: 'Нишонаҳои аввал пеш аз ҳайз', meta: '5 дақ  ·  Мақола'},
      {title: 'Барои ҳайзи аввалам кадом воситаи муҳофизатро интихоб кунам?', meta: '6 дақ  ·  Роҳнамо'},
      {title: 'Ҳайзи аввали шумо: чӣ интизор шудан лозим аст', meta: '5 дақ  ·  Роҳнамо'},
    ],
    shareMessage: 'Чӣ тавр бифаҳмам, ки ҳайзи аввалам меояд? — AWA',
  },
  ky: {
    badge: 'БИРИНЧИ ЕТЕК КИРИМ',
    title: 'Биринчи етек кирим келе\nжатканын кантип билем?',
    metaDuration: '5 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Бир нече так белги биринчи етек киримиңиз чындап жакындап келе жатканын таанууга жардам бериши мүмкүн.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Көңүл бура турган белгилер',
      'Алгачкы бөлүнүп чыгуу: ал кандай көрүнөт?',
      'Кынаптан бөлүнүп чыгуубу же етек кирим канбы?',
      'Чоң киши менен качан сүйлөшүү керек?',
    ],
    observe: [
      {title: 'Агыш бөлүнүп чыгуу', text: 'Жеңил, тунук бөлүнүп чыгуу көбүнчө бир нече ай мурун пайда болот.'},
      {title: 'Көкүрөктүн өнүгүшү', text: 'Көбүнчө етек киримден бир кыйла мурун пайда болгон кеңири таралган белги.'},
      {title: 'Курсактын жеңил тартылышы', text: 'Мындай кичинекей сезимдер етек кирим жакында келерин билдириши мүмкүн.'},
    ],
    body2: 'Эң биринчи етек кирим келгенге чейин ич кийимде жеңил агыш же бир аз сарыгыраак бөлүнүп чыгууну байкоо кеңири таралган. Бул денеңизде башталып жаткан гормондук активдүүлүк менен байланышкан кадимки кубулуш.',
    body3: 'Кынаптан бөлүнүп чыгуу тунук же агыш, күчтүү жытсыз. Етек кирим каны болсо кызылдан күрөңгө чейинки түстө жана етек киримдин чыныгы башталышын белгилейт. Күмөн болсоңуз, бул жөнүндө сүйлөшүү эч качан чоң маселе эмес.',
    tipTitle: 'Билүү пайдалуу',
    tipText: 'Так күндү алдын ала айтуунун жолу жок. Эң алгачкы белгилерден баштап коргонуу каражатын жаныңызда алып жүрүү — эң жакшы адат.',
    body4: 'Бул белгилерди байкаган замат, же суроо же тынчсыздануу пайда болгондо, апаңыз, эжеңиз, жакын адамыңыз же ишенген ден соолук сактоо адиси менен сүйлөшө аласыз. Жардам сурап кайрылуу үчүн эч качан туура эмес убакыт жок.',
    relatedTitle: '♥  Сизге дагы жагышы мүмкүн',
    related: [
      {title: 'Етек кирим башталардан мурунку алгачкы белгилер', meta: '5 мүн  ·  Макала'},
      {title: 'Биринчи етек кирим үчүн кайсы коргонууну тандоо керек?', meta: '6 мүн  ·  Колдонмо'},
      {title: 'Биринчи етек кирим: эмне күтүү керек', meta: '5 мүн  ·  Колдонмо'},
    ],
    shareMessage: 'Биринчи етек кирим келе жатканын кантип билем? — AWA',
  },
  tk: {
    badge: 'ILKINJI AÝBAŞY',
    title: 'Ilkinji aýbaşymyň\ngelýändigini nädip bilmeli?',
    metaDuration: '5 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Birnäçe anyk alamat ilkinji aýbaşyňyzyň hakykatdan hem ýolda ekenligini tanamaga kömek edip biler.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Üns bermeli alamatlar',
      'Ilkinji bölünip çykyş: ol nähili görünýär?',
      'Jynsy ýoldan akýan suwuklyk ýa-da aýbaşy gany?',
      'Ulular bilen haçan gürleşmeli?',
    ],
    observe: [
      {title: 'Ak reňkli bölünip çykyş', text: 'Ýeňil, arassa bölünip çykyş köplenç birnäçe aý öň peýda bolýar.'},
      {title: 'Döşüň ösüşi', text: 'Aýbaşydan has öň peýda bolýan umumy alamat.'},
      {title: 'Garynda ýeňil çekişme', text: 'Şeýle kiçijik duýgular aýbaşynyň ýakynda gelýändigini habar berip biler.'},
    ],
    body2: 'Ilkinji aýbaşyňyz gelmezden öň içki eşigiňizde ýeňil ak ýa-da az-kem sarymtyl bölünip çykyşy görmek adaty zat. Bu bedeniňizde başlanýan gormonal işjeňlik bilen baglanyşykly adaty hadysa.',
    body3: 'Jynsy ýoldan akýan suwuklyk arassa ýa-da ak, güýçli ysy ýok. Aýbaşy gany bolsa gyzyldan goňur reňke çenli, aýbaşyňyzyň hakyky başlanýandygyny görkezýär. Şübhe bolsa, bu barada gürleşmek hiç haçan uly mesele däl.',
    tipTitle: 'Bilmek peýdaly',
    tipText: 'Takyk güni öňünden aýtmagyň ýoly ýok. Ilkinji alamatlardan başlap goranyş serişdesini ýanyňyzda saklamak iň gowy endik.',
    body4: 'Bu alamatlary görenden ýa-da soragyňyz ýa-da alada bolan wagtyňyz, eneňiz, uýaňyz, ýakyn adamyňyz ýa-da ynanýan saglyk hünärmeniňiz bilen gürleşip bilersiňiz. Kömek soramak üçin hiç haçan nädogry wagt ýok.',
    relatedTitle: '♥  Size ýarap biler',
    related: [
      {title: 'Aýbaşydan öňki ilkinji alamatlar', meta: '5 min  ·  Makala'},
      {title: 'Ilkinji aýbaşym üçin haýsy goranyş serişdesini saýlamaly?', meta: '6 min  ·  Gollanma'},
      {title: 'Ilkinji aýbaşyňyz: nämä garaşmaly', meta: '5 min  ·  Gollanma'},
    ],
    shareMessage: 'Ilkinji aýbaşymyň gelýändigini nädip bilmeli? — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodComingArticleScreen({
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

          {OBSERVE_IMAGES.map((image, index) => (
            <AwaCard variant="filled" padding="none" key={content.observe[index].title} style={styles.visualCard}>
              <Image source={image} resizeMode="cover" style={styles.visualImage} />

              <View style={styles.visualCopy}>
                <AwaText variant="titleSmall" emphasized>{content.observe[index].title}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>{content.observe[index].text}</AwaText>
              </View>
            </AwaCard>
          ))}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body3}
          </AwaText>

          <Image
            source={require('../../assets/images/library/rules-process.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tipText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body4}
          </AwaText>
        </View>

        <View style={styles.relatedHeader}>
          <AwaText variant="titleMedium" emphasized>{content.relatedTitle}</AwaText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedRow}>
          {RELATED_IMAGES.map((item, index) => (
            <AwaCard variant="filled" padding="none"
              key={item.articleId + index}
              onPress={() =>
                navigation.push('ArticleReader', {articleId: item.articleId})
              }
              style={styles.relatedCard}>
              <Image
                source={resolveEditorialImage(item.image, lang)}
                resizeMode="cover"
                style={styles.relatedImage}
              />

              <View style={styles.relatedCopy}>
                <AwaText variant="labelSmall" emphasized>
                  {content.related[index].title}
                </AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.relatedMeta}>{content.related[index].meta}</AwaText>
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
  wideImage: {width: '100%', height: 120, marginTop: 16, borderRadius: 12},
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
