import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'cervicalmucus-observer-glaire';

const HERO = require('../../assets/images/library/flow-texture-mucus.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const CYCLE_EVOLUTION_ICONS = [
  'circle-outline',
  'weather-cloudy',
  'egg-outline',
  'moon-waning-crescent',
] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT                                                                    */
/* -------------------------------------------------------------------------- */

// PHASE 7L.2 — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'FERTILITÉ • GLAIRE CERVICALE',
    title: 'Observer sa\nglaire cervicale',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Un signal naturel et gratuit pour repérer ta période fertile.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que la glaire cervicale ?',
      'Comment elle évolue au fil du cycle',
      'Reconnaître une glaire fertile',
      'Comment l’observer au quotidien',
      'Ce qui peut modifier tes observations',
      'Les limites de cette méthode',
      'À retenir',
    ],
    section1Body:
      'C’est une sécrétion naturelle produite par le col de l’utérus. La glaire cervicale change de texture au fil du cycle sous l’effet des œstrogènes et de la progestérone.',
    cycleEvolution: [
      {
        title: 'Après les règles',
        text: 'Peu de glaire, souvent une sensation de sécheresse.',
      },
      {
        title: 'Avant l’ovulation',
        text: 'Plus abondante, trouble et collante.',
      },
      {
        title: 'À l’approche de l’ovulation',
        text: 'Claire, filante et élastique, semblable à du blanc d’œuf.',
      },
      {
        title: 'Après l’ovulation',
        text: 'Plus épaisse, opaque, ou beaucoup moins présente.',
      },
    ],
    section3Intro: 'À l’approche de l’ovulation, elle devient :',
    fertileSigns: [
      'Claire ou transparente',
      'Filante, elle s’étire entre deux doigts',
      'Élastique, semblable à du blanc d’œuf cru',
      'Abondante par rapport aux autres jours',
    ],
    infoTitle: 'Un geste simple, chaque jour',
    infoText:
      'Observe l’aspect et la texture avec du papier toilette ou des doigts propres, à peu près au même moment de la journée, et note ce que tu remarques.',
    modifyingFactors: [
      'Des rapports récents',
      'Des produits d’hygiène intime',
      'Une contraception hormonale ou certains traitements',
      'Une infection ou un déséquilibre local',
    ],
    section6Body:
      'Chaque personne a un profil différent, et reconnaître le sien demande de la pratique sur plusieurs cycles. Observer ce changement chaque jour, en complément d’autres signes, aide à mieux cerner ta fenêtre fertile — sans jamais remplacer un avis médical en cas d’inquiétude.',
    tipTitle: 'Bon à savoir',
    tipText:
      'Associer la glaire cervicale à ta température basale ou à des tests d’ovulation donne une image plus complète de ton cycle.',
    summaryPoints: [
      'La glaire cervicale change de texture au fil du cycle sous l’effet des œstrogènes et de la progestérone.',
      'À l’approche de l’ovulation, elle devient claire, filante et élastique, semblable à du blanc d’œuf.',
      'Observer ce changement chaque jour, en complément d’autres signes, aide à mieux cerner ta fenêtre fertile.',
      'Reconnaître son propre profil demande de la pratique et plusieurs cycles d’observation.',
    ],
    disclaimerText:
      'Contenu informatif. Cet article ne remplace pas un avis médical personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Observer sa glaire cervicale — AWA',
  },
  en: {
    badge: 'FERTILITY • CERVICAL MUCUS',
    title: 'Observing your\ncervical mucus',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'A natural, free signal for spotting your fertile window.',
    contentsTitle: 'In this article',
    topics: [
      'What is cervical mucus?',
      'How it changes throughout the cycle',
      'Recognizing fertile mucus',
      'How to observe it daily',
      'What can affect your observations',
      'The limits of this method',
      'Key takeaways',
    ],
    section1Body:
      'It’s a natural secretion produced by the cervix. Cervical mucus changes texture throughout the cycle under the effect of estrogen and progesterone.',
    cycleEvolution: [
      {
        title: 'After your period',
        text: 'Little mucus, often a feeling of dryness.',
      },
      {
        title: 'Before ovulation',
        text: 'More abundant, cloudy, and sticky.',
      },
      {
        title: 'As ovulation approaches',
        text: 'Clear, stretchy, and elastic, similar to raw egg white.',
      },
      {
        title: 'After ovulation',
        text: 'Thicker, opaque, or much less present.',
      },
    ],
    section3Intro: 'As ovulation approaches, it becomes:',
    fertileSigns: [
      'Clear or transparent',
      'Stretchy — it stretches between two fingers',
      'Elastic, similar to raw egg white',
      'More abundant than on other days',
    ],
    infoTitle: 'A simple habit, every day',
    infoText:
      'Observe the appearance and texture using toilet paper or clean fingers, at roughly the same time of day, and note what you notice.',
    modifyingFactors: [
      'Recent intercourse',
      'Intimate hygiene products',
      'Hormonal contraception or certain treatments',
      'An infection or local imbalance',
    ],
    section6Body:
      'Everyone has a different profile, and recognizing your own takes practice over several cycles. Observing this change every day, alongside other signs, helps you better pinpoint your fertile window — but it never replaces medical advice if you’re concerned.',
    tipTitle: 'Good to know',
    tipText:
      'Combining cervical mucus with your basal body temperature or ovulation tests gives a fuller picture of your cycle.',
    summaryPoints: [
      'Cervical mucus changes texture throughout the cycle under the effect of estrogen and progesterone.',
      'As ovulation approaches, it becomes clear, stretchy, and elastic, similar to raw egg white.',
      'Observing this change every day, alongside other signs, helps you better pinpoint your fertile window.',
      'Recognizing your own pattern takes practice and several cycles of observation.',
    ],
    disclaimerText:
      'Informational content. This article does not replace personalized medical advice. If in doubt, ask a healthcare professional for guidance.',
    shareMessage: 'Observing your cervical mucus — AWA',
  },
  es: {
    badge: 'FERTILIDAD • MOCO CERVICAL',
    title: 'Observar tu\nmoco cervical',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Una señal natural y gratuita para detectar tu ventana fértil.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es el moco cervical?',
      'Cómo evoluciona a lo largo del ciclo',
      'Reconocer un moco fértil',
      'Cómo observarlo cada día',
      'Qué puede modificar tus observaciones',
      'Los límites de este método',
      'Para recordar',
    ],
    section1Body:
      'Es una secreción natural producida por el cuello del útero. El moco cervical cambia de textura a lo largo del ciclo por efecto de los estrógenos y la progesterona.',
    cycleEvolution: [
      {
        title: 'Después de la regla',
        text: 'Poco moco, a menudo con sensación de sequedad.',
      },
      {
        title: 'Antes de la ovulación',
        text: 'Más abundante, turbio y pegajoso.',
      },
      {
        title: 'Cerca de la ovulación',
        text: 'Claro, filante y elástico, parecido a la clara de huevo.',
      },
      {
        title: 'Después de la ovulación',
        text: 'Más espeso, opaco, o mucho menos presente.',
      },
    ],
    section3Intro: 'Cerca de la ovulación, se vuelve:',
    fertileSigns: [
      'Claro o transparente',
      'Filante: se estira entre dos dedos',
      'Elástico, parecido a la clara de huevo cruda',
      'Abundante en comparación con otros días',
    ],
    infoTitle: 'Un gesto sencillo, cada día',
    infoText:
      'Observa el aspecto y la textura con papel higiénico o con los dedos limpios, más o menos a la misma hora del día, y anota lo que notes.',
    modifyingFactors: [
      'Relaciones sexuales recientes',
      'Productos de higiene íntima',
      'Una anticoncepción hormonal o ciertos tratamientos',
      'Una infección o un desequilibrio local',
    ],
    section6Body:
      'Cada persona tiene un perfil diferente, y reconocer el tuyo requiere práctica a lo largo de varios ciclos. Observar este cambio cada día, junto con otras señales, te ayuda a identificar mejor tu ventana fértil, sin que esto reemplace nunca una opinión médica si tienes alguna inquietud.',
    tipTitle: 'Dato útil',
    tipText:
      'Combinar el moco cervical con tu temperatura basal o con pruebas de ovulación te da una imagen más completa de tu ciclo.',
    summaryPoints: [
      'El moco cervical cambia de textura a lo largo del ciclo por efecto de los estrógenos y la progesterona.',
      'Cerca de la ovulación, se vuelve claro, filante y elástico, parecido a la clara de huevo.',
      'Observar este cambio cada día, junto con otras señales, te ayuda a identificar mejor tu ventana fértil.',
      'Reconocer tu propio perfil requiere práctica y varios ciclos de observación.',
    ],
    disclaimerText:
      'Contenido informativo. Este artículo no sustituye una opinión médica personalizada. Si tienes dudas, consulta a un profesional de la salud.',
    shareMessage: 'Observar tu moco cervical — AWA',
  },
  it: {
    badge: 'FERTILITÀ • MUCO CERVICALE',
    title: 'Osservare il tuo\nmuco cervicale',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Un segnale naturale e gratuito per individuare la tua finestra fertile.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è il muco cervicale?',
      'Come cambia durante il ciclo',
      'Riconoscere il muco fertile',
      'Come osservarlo ogni giorno',
      'Che cosa può influire sulle tue osservazioni',
      'I limiti di questo metodo',
      'Punti chiave',
    ],
    section1Body: 'È una secrezione naturale prodotta dalla cervice. Il muco cervicale cambia consistenza durante il ciclo per effetto degli estrogeni e del progesterone.',
    cycleEvolution: [
      {
        title: 'Dopo il periodo mestruale',
        text: 'Poco muco, spesso una sensazione di secchezza.',
      },
      {
        title: 'Prima dell’ovulazione',
        text: 'Più abbondante, torbido e appiccicoso.',
      },
      {
        title: 'Con l’avvicinarsi dell’ovulazione',
        text: 'Trasparente, filante ed elastico, simile all’albume d’uovo crudo.',
      },
      {
        title: 'Dopo l’ovulazione',
        text: 'Più denso, opaco o molto meno presente.',
      },
    ],
    section3Intro: 'Con l’avvicinarsi dell’ovulazione diventa:',
    fertileSigns: [
      'Chiaro o trasparente',
      'Filante — si allunga tra due dita',
      'Elastico, simile all’albume d’uovo crudo',
      'Più abbondante rispetto agli altri giorni',
    ],
    infoTitle: 'Una semplice abitudine, ogni giorno',
    infoText: 'Osserva l’aspetto e la consistenza usando carta igienica o le dita pulite, più o meno alla stessa ora del giorno, e annota ciò che noti.',
    modifyingFactors: [
      'Rapporti sessuali recenti',
      'Prodotti per l’igiene intima',
      'Contraccezione ormonale o alcuni trattamenti',
      'Un’infezione o uno squilibrio locale',
    ],
    section6Body: 'Ognuna ha un profilo diverso, e riconoscere il tuo richiede pratica nel corso di più cicli. Osservare questo cambiamento ogni giorno, insieme ad altri segnali, ti aiuta a individuare meglio la tua finestra fertile — ma non sostituisce mai il parere medico se hai dei dubbi.',
    tipTitle: 'Da sapere',
    tipText: 'Combinare il muco cervicale con la tua temperatura basale o con i test di ovulazione offre un quadro più completo del tuo ciclo.',
    summaryPoints: [
      'Il muco cervicale cambia consistenza durante il ciclo per effetto degli estrogeni e del progesterone.',
      'Con l’avvicinarsi dell’ovulazione diventa trasparente, filante ed elastico, simile all’albume d’uovo crudo.',
      'Osservare questo cambiamento ogni giorno, insieme ad altri segnali, ti aiuta a individuare meglio la tua finestra fertile.',
      'Riconoscere il tuo schema personale richiede pratica e più cicli di osservazione.',
    ],
    disclaimerText: 'Contenuto a scopo informativo. Questo articolo non sostituisce un parere medico personalizzato. In caso di dubbi, chiedi consiglio a un professionista sanitario.',
    shareMessage: 'Osservare il tuo muco cervicale — AWA',
  },
  tr: {
    badge: 'DOĞURGANLIK • SERVİKAL MUKUS',
    title: 'Servikal mukusunu\ngözlemlemek',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Doğurganlık dönemini fark etmen için doğal ve ücretsiz bir işaret.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Servikal mukus nedir?',
      'Döngü boyunca nasıl değişir?',
      'Doğurgan mukusu tanımak',
      'Her gün nasıl gözlemlenir?',
      'Gözlemlerini neler etkileyebilir?',
      'Bu yöntemin sınırları',
      'Akılda kalacaklar',
    ],
    section1Body: 'Rahim ağzının (serviksin) ürettiği doğal bir salgıdır. Servikal mukusun kıvamı, östrojen ve progesteronun etkisiyle döngü boyunca değişir.',
    cycleEvolution: [
      {
        title: 'Adetinden sonra',
        text: 'Mukus azdır, çoğu zaman kuruluk hissi olur.',
      },
      {
        title: 'Yumurtlamadan önce',
        text: 'Daha bol, bulanık ve yapışkandır.',
      },
      {
        title: 'Yumurtlama yaklaşırken',
        text: 'Berrak, uzayan ve esnektir; çiğ yumurta akına benzer.',
      },
      {
        title: 'Yumurtlamadan sonra',
        text: 'Daha koyu, opak ya da çok daha az görülür.',
      },
    ],
    section3Intro: 'Yumurtlama yaklaştıkça mukus şöyle olur:',
    fertileSigns: [
      'Berrak ya da şeffaf',
      'Uzayan: iki parmağın arasında gerilir',
      'Esnek, çiğ yumurta akına benzer',
      'Diğer günlere göre daha bol',
    ],
    infoTitle: 'Basit bir alışkanlık, her gün',
    infoText: 'Görünümünü ve kıvamını tuvalet kâğıdıyla ya da temiz parmaklarınla, günün yaklaşık aynı saatinde gözlemle ve fark ettiklerini not al.',
    modifyingFactors: [
      'Yakın zamanda yaşanan cinsel ilişki',
      'İntim hijyen ürünleri',
      'Hormonal doğum kontrolü ya da bazı tedaviler',
      'Enfeksiyon ya da yerel bir dengesizlik',
    ],
    section6Body: 'Herkesin profili farklıdır; kendi profilini tanımak birkaç döngü boyunca pratik yapmayı gerektirir. Bu değişimi her gün, diğer belirtilerle birlikte gözlemlemek doğurganlık dönemini daha iyi belirlemene yardımcı olur; ancak endişelendiğinde tıbbi tavsiyenin yerini asla tutmaz.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Servikal mukusu bazal vücut sıcaklığın ya da ovülasyon testlerinle birlikte değerlendirmek, döngün hakkında daha eksiksiz bir tablo sunar.',
    summaryPoints: [
      'Servikal mukusun kıvamı, östrojen ve progesteronun etkisiyle döngü boyunca değişir.',
      'Yumurtlama yaklaşırken mukus berrak, uzayan ve esnek olur; çiğ yumurta akına benzer.',
      'Bu değişimi her gün, diğer belirtilerle birlikte gözlemlemek doğurganlık dönemini daha iyi belirlemene yardımcı olur.',
      'Kendi düzenini tanımak pratik ve birkaç döngülük gözlem gerektirir.',
    ],
    disclaimerText: 'Bilgilendirme amaçlı içerik. Bu makale kişiye özel tıbbi tavsiyenin yerini tutmaz. Tereddüt ettiğinde bir sağlık profesyoneline danış.',
    shareMessage: 'Servikal mukusunu gözlemlemek — AWA',
  },
  ru: {
    badge: 'ФЕРТИЛЬНОСТЬ • ЦЕРВИКАЛЬНАЯ СЛИЗЬ',
    title: 'Наблюдение\nза цервикальной слизью',
    metaDuration: '5 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Естественный и бесплатный сигнал, помогающий определить фертильное окно.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое цервикальная слизь?',
      'Как она меняется в течение цикла',
      'Как распознать фертильную слизь',
      'Как наблюдать за ней ежедневно',
      'Что может влиять на ваши наблюдения',
      'Ограничения этого метода',
      'Главное',
    ],
    section1Body:
      'Это естественный секрет, вырабатываемый шейкой матки. Под действием эстрогена и прогестерона консистенция цервикальной слизи меняется в течение цикла.',
    cycleEvolution: [
      {
        title: 'После месячных',
        text: 'Слизи мало, часто ощущается сухость.',
      },
      {
        title: 'Перед овуляцией',
        text: 'Её становится больше, она мутная и липкая.',
      },
      {
        title: 'Ближе к овуляции',
        text: 'Прозрачная, тягучая и эластичная, похожая на сырой яичный белок.',
      },
      {
        title: 'После овуляции',
        text: 'Более густая, непрозрачная или её становится заметно меньше.',
      },
    ],
    section3Intro: 'Ближе к овуляции она становится:',
    fertileSigns: [
      'Прозрачной',
      'Тягучей — растягивается между двумя пальцами',
      'Эластичной, похожей на сырой яичный белок',
      'Более обильной, чем в другие дни',
    ],
    infoTitle: 'Простая привычка на каждый день',
    infoText:
      'Оценивайте вид и консистенцию с помощью туалетной бумаги или чистых пальцев примерно в одно и то же время дня и записывайте, что вы заметили.',
    modifyingFactors: [
      'Недавний половой акт',
      'Средства для интимной гигиены',
      'Гормональная контрацепция или некоторые лекарства',
      'Инфекция или местное нарушение баланса',
    ],
    section6Body:
      'У каждой женщины свой профиль, и чтобы распознавать собственный, нужна практика на протяжении нескольких циклов. Ежедневное наблюдение за этими изменениями вместе с другими признаками помогает точнее определять фертильное окно, но оно никогда не заменяет консультацию врача, если у вас есть опасения.',
    tipTitle: 'Полезно знать',
    tipText:
      'Если сочетать наблюдение за цервикальной слизью с базальной температурой или тестами на овуляцию, картина вашего цикла будет полнее.',
    summaryPoints: [
      'Под действием эстрогена и прогестерона консистенция цервикальной слизи меняется в течение цикла.',
      'Ближе к овуляции она становится прозрачной, тягучей и эластичной, похожей на сырой яичный белок.',
      'Ежедневное наблюдение за этими изменениями вместе с другими признаками помогает точнее определять фертильное окно.',
      'Чтобы распознавать собственную картину, нужна практика и наблюдение на протяжении нескольких циклов.',
    ],
    disclaimerText:
      'Информационный материал. Эта статья не заменяет персональную медицинскую консультацию. При сомнениях обратитесь за советом к медицинскому специалисту.',
    shareMessage: 'Наблюдение за цервикальной слизью — AWA',
  },
  de: {
    badge: 'FRUCHTBARKEIT • ZERVIXSCHLEIM',
    title: 'Deinen Zervixschleim\nbeobachten',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Ein natürliches, kostenloses Signal, um dein fruchtbares Fenster zu erkennen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist Zervixschleim?',
      'Wie er sich im Zyklus verändert',
      'Fruchtbaren Schleim erkennen',
      'Wie du ihn täglich beobachtest',
      'Was deine Beobachtungen beeinflussen kann',
      'Die Grenzen dieser Methode',
      'Das Wichtigste in Kürze',
    ],
    section1Body:
      'Es handelt sich um ein natürliches Sekret, das vom Gebärmutterhals gebildet wird. Der Zervixschleim verändert seine Beschaffenheit im Laufe des Zyklus unter dem Einfluss von Östrogen und Progesteron.',
    cycleEvolution: [
      {
        title: 'Nach deiner Periode',
        text: 'Wenig Schleim, oft ein Gefühl von Trockenheit.',
      },
      {
        title: 'Vor dem Eisprung',
        text: 'Reichlicher, trüb und klebrig.',
      },
      {
        title: 'Kurz vor dem Eisprung',
        text: 'Klar, fadenziehend und elastisch, ähnlich wie rohes Eiweiß.',
      },
      {
        title: 'Nach dem Eisprung',
        text: 'Dicker, undurchsichtig oder deutlich weniger vorhanden.',
      },
    ],
    section3Intro: 'Kurz vor dem Eisprung wird er:',
    fertileSigns: [
      'Klar oder durchsichtig',
      'Fadenziehend – er lässt sich zwischen zwei Fingern ziehen',
      'Elastisch, ähnlich wie rohes Eiweiß',
      'Reichlicher als an anderen Tagen',
    ],
    infoTitle: 'Eine einfache Gewohnheit, jeden Tag',
    infoText:
      'Beobachte das Aussehen und die Beschaffenheit mit Toilettenpapier oder sauberen Fingern, etwa zur selben Tageszeit, und notiere, was dir auffällt.',
    modifyingFactors: [
      'Kürzlicher Geschlechtsverkehr',
      'Produkte für die Intimhygiene',
      'Hormonelle Verhütung oder bestimmte Behandlungen',
      'Eine Infektion oder ein lokales Ungleichgewicht',
    ],
    section6Body:
      'Jede Frau hat ein anderes Profil, und deines zu erkennen braucht Übung über mehrere Zyklen. Wenn du diese Veränderung jeden Tag zusammen mit anderen Zeichen beobachtest, kannst du dein fruchtbares Fenster besser eingrenzen – ärztlichen Rat ersetzt das aber nie, wenn du dir Sorgen machst.',
    tipTitle: 'Gut zu wissen',
    tipText:
      'Wenn du Zervixschleim mit deiner Basaltemperatur oder mit Ovulationstests kombinierst, erhältst du ein vollständigeres Bild deines Zyklus.',
    summaryPoints: [
      'Der Zervixschleim verändert seine Beschaffenheit im Laufe des Zyklus unter dem Einfluss von Östrogen und Progesteron.',
      'Kurz vor dem Eisprung wird er klar, fadenziehend und elastisch, ähnlich wie rohes Eiweiß.',
      'Wenn du diese Veränderung jeden Tag zusammen mit anderen Zeichen beobachtest, kannst du dein fruchtbares Fenster besser eingrenzen.',
      'Dein eigenes Muster zu erkennen braucht Übung und die Beobachtung über mehrere Zyklen.',
    ],
    disclaimerText:
      'Informationsinhalt. Dieser Artikel ersetzt keine persönliche ärztliche Beratung. Bei Zweifeln wende dich an medizinisches Fachpersonal.',
    shareMessage: 'Deinen Zervixschleim beobachten — AWA',
  },
  zh: {
      badge: '生育力 • 宫颈黏液',
      title: '观察你的\n宫颈黏液',
      metaDuration: '阅读约 5 分钟',
      metaType: '指南',
      metaLevel: '进阶',
      metaValidated: '已审核内容',
      intro: '一种自然、免费的信号，帮助你找到易孕期。',
      contentsTitle: '本文内容',
      topics: [
        '什么是宫颈黏液？',
        '它在周期中如何变化',
        '识别易孕期的黏液',
        '如何每天观察',
        '哪些因素会影响你的观察',
        '这种方法的局限',
        '要点回顾',
      ],
      section1Body: '它是由宫颈产生的一种自然分泌物。在雌激素和孕激素的作用下，宫颈黏液的质地会在整个周期中发生变化。',
      cycleEvolution: [
        {
          title: '月经结束后',
          text: '黏液很少，常常有干燥的感觉。',
        },
        {
          title: '排卵前',
          text: '量变多，浑浊且黏稠。',
        },
        {
          title: '临近排卵时',
          text: '清澈、可拉丝、有弹性，类似生鸡蛋清。',
        },
        {
          title: '排卵后',
          text: '变得更稠、不透明，或明显减少。',
        },
      ],
      section3Intro: '临近排卵时，它会变得：',
      fertileSigns: [
        '清澈或透明',
        '可拉丝，在两指之间可以拉开',
        '有弹性，类似生鸡蛋清',
        '比其他日子量更多',
      ],
      infoTitle: '每天一个简单的习惯',
      infoText: '在每天大致相同的时间，用卫生纸或干净的手指观察黏液的外观和质地，并记下你的发现。',
      modifyingFactors: [
        '近期有过性生活',
        '私处清洁产品',
        '激素类避孕或某些治疗',
        '感染或局部菌群失衡',
      ],
      section6Body: '每个人的情况都不一样，要认识自己的规律，需要经过数个周期的练习。每天观察这种变化，再结合其他迹象，可以帮助你更准确地判断易孕期，但如果你有顾虑，它永远不能替代医疗建议。',
      tipTitle: '小贴士',
      tipText: '把宫颈黏液与基础体温或排卵试纸结合起来，可以让你对自己的周期有更完整的了解。',
      summaryPoints: [
        '在雌激素和孕激素的作用下，宫颈黏液的质地会在整个周期中发生变化。',
        '临近排卵时，它会变得清澈、可拉丝、有弹性，类似生鸡蛋清。',
        '每天观察这种变化，再结合其他迹象，可以帮助你更准确地判断易孕期。',
        '认识自己的规律需要练习，也需要观察数个周期。',
      ],
      disclaimerText: '仅供参考的内容。本文不能替代个性化的医疗建议。如有疑问，请咨询医疗专业人员。',
      shareMessage: '观察你的宫颈黏液 — AWA',
    },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function CervicalMucusArticleScreen({
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Partage annulé ou indisponible.
    }
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
        {/* ==================================================================== */}
        {/* HERO                                                                 */}
        {/* ==================================================================== */}

        <View style={styles.heroWrap}>
          <Image source={HERO} resizeMode="cover" style={styles.hero} />

          <View
            style={[
              styles.top,
              {paddingTop: getTopPadding(insets.top, true)},
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
                hitSlop={8}
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('libraryArticle.shareA11y')}
                hitSlop={8}
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

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

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>{content.contentsTitle}</Text>

            {content.topics.map((topic, index) => (
              <View key={topic} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>
                  <Text style={styles.contentText}>{topic}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>
            {content.section1Body}
          </Text>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <View style={styles.normalGrid}>
            {content.cycleEvolution.map((item, index) => (
              <View key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={CYCLE_EVOLUTION_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>{item.title}</Text>
                <Text style={styles.normalText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.section3Intro}
          </Text>

          <View style={styles.checkList}>
            {content.fertileSigns.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={16}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="eye-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoTitle}</Text>
              <Text style={styles.infoText}>
                {content.infoText}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <View style={styles.checkList}>
            {content.modifyingFactors.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

          <Text style={styles.body}>
            {content.section6Body}
          </Text>

          {/* ================================================================= */}
          {/* TIP                                                               */}
          {/* ================================================================= */}

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tipTitle}</Text>
              <Text style={styles.tipText}>
                {content.tipText}
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <Text style={styles.h2}>{content.topics[6]}</Text>

          <View style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              {content.disclaimerText}
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  scroll: {paddingBottom: 30},

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
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {opacity: 0.74},

  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: theme.colors.background,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },
  badgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: theme.colors.text,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 9.5, color: theme.colors.textMuted},

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: '600',
  },

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contentsTitle: {marginBottom: 7, fontSize: 15, color: theme.colors.text, fontWeight: '800'},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 25, color: theme.colors.primary, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: theme.colors.text},

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.text},

  normalGrid: {marginTop: 13, gap: 9},
  normalCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  normalTitle: {marginTop: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  normalText: {marginTop: 4, fontSize: 11, lineHeight: 16, color: theme.colors.textSecondary},

  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  checkRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6},
  checkText: {flex: 1, color: theme.colors.text, fontSize: 12.5, lineHeight: 17},

  infoCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoCopy: {flex: 1, marginLeft: 9},
  infoTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  infoText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10},
  summaryText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.text},

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  disclaimerText: {flex: 1, fontSize: 10, lineHeight: 15, color: theme.colors.textMuted},
  });
}
