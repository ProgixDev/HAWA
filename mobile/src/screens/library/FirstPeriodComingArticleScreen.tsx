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
  da: {
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
