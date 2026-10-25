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
const CONTENT = withBrazilianPortuguese('CervicalMucus', {
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
  id: {
    badge: 'KESUBURAN • LENDIR SERVIKS',
    title: 'Mengamati\nlendir servikmu',
    metaDuration: '5 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Tanda alami dan gratis untuk mengenali masa suburmu.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu lendir serviks?',
      'Bagaimana lendir berubah sepanjang siklus',
      'Mengenali lendir subur',
      'Cara mengamatinya setiap hari',
      'Hal-hal yang bisa memengaruhi pengamatanmu',
      'Keterbatasan metode ini',
      'Poin penting',
    ],
    section1Body: 'Lendir serviks adalah cairan alami yang dihasilkan oleh leher rahim. Teksturnya berubah sepanjang siklus karena pengaruh estrogen dan progesteron.',
    cycleEvolution: [
      {
        title: 'Setelah haid',
        text: 'Lendir sedikit, sering kali terasa kering.',
      },
      {
        title: 'Sebelum ovulasi',
        text: 'Lebih banyak, keruh, dan lengket.',
      },
      {
        title: 'Menjelang ovulasi',
        text: 'Bening, kenyal, dan elastis, mirip putih telur mentah.',
      },
      {
        title: 'Setelah ovulasi',
        text: 'Lebih kental, buram, atau jauh lebih sedikit.',
      },
    ],
    section3Intro: 'Menjelang ovulasi, lendir menjadi:',
    fertileSigns: [
      'Bening atau transparan',
      'Kenyal — bisa ditarik memanjang di antara dua jari',
      'Elastis, mirip putih telur mentah',
      'Lebih banyak daripada hari-hari lainnya',
    ],
    infoTitle: 'Kebiasaan sederhana, setiap hari',
    infoText: 'Amati tampilan dan teksturnya menggunakan tisu toilet atau jari yang bersih, kurang lebih pada jam yang sama setiap hari, lalu catat apa yang kamu lihat.',
    modifyingFactors: [
      'Hubungan intim yang baru saja terjadi',
      'Produk kebersihan area kewanitaan',
      'Kontrasepsi hormonal atau pengobatan tertentu',
      'Infeksi atau ketidakseimbangan lokal',
    ],
    section6Body: 'Setiap perempuan punya pola yang berbeda, dan mengenali polamu sendiri butuh latihan selama beberapa siklus. Mengamati perubahan ini setiap hari, bersama tanda-tanda lain, membantumu menentukan masa suburmu dengan lebih tepat — tetapi tidak pernah menggantikan saran medis jika kamu merasa khawatir.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Menggabungkan pengamatan lendir serviks dengan suhu tubuh basal atau tes ovulasi memberikan gambaran siklusmu yang lebih lengkap.',
    summaryPoints: [
      'Lendir serviks berubah tekstur sepanjang siklus karena pengaruh estrogen dan progesteron.',
      'Menjelang ovulasi, lendir menjadi bening, kenyal, dan elastis, mirip putih telur mentah.',
      'Mengamati perubahan ini setiap hari, bersama tanda-tanda lain, membantumu menentukan masa suburmu dengan lebih tepat.',
      'Mengenali polamu sendiri butuh latihan dan pengamatan selama beberapa siklus.',
    ],
    disclaimerText: 'Konten informatif. Artikel ini tidak menggantikan saran medis yang dipersonalisasi. Jika ragu, mintalah arahan dari tenaga kesehatan.',
    shareMessage: 'Mengamati lendir servikmu — AWA',
  },
  hi: {
    badge: 'प्रजनन क्षमता • सर्वाइकल म्यूकस',
    title: 'अपने सर्वाइकल म्यूकस\nको देखना सीखें',
    metaDuration: '5 मिनट का पाठ',
    metaType: 'गाइड',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'अपनी फ़र्टाइल विंडो पहचानने का एक प्राकृतिक और मुफ़्त संकेत।',
    contentsTitle: 'इस लेख में',
    topics: [
      'सर्वाइकल म्यूकस क्या है?',
      'यह चक्र में कैसे बदलता है',
      'उपजाऊ म्यूकस को पहचानना',
      'इसे रोज़ कैसे देखें',
      'आपके अवलोकन को क्या प्रभावित कर सकता है',
      'इस तरीके की सीमाएँ',
      'मुख्य बातें',
    ],
    section1Body: 'यह गर्भाशय ग्रीवा (सर्विक्स) से बनने वाला एक प्राकृतिक स्राव है। एस्ट्रोजन और प्रोजेस्टेरोन के असर से सर्वाइकल म्यूकस की बनावट पूरे चक्र में बदलती रहती है।',
    cycleEvolution: [
      {
        title: 'आपके पीरियड के बाद',
        text: 'म्यूकस कम होता है, अक्सर सूखेपन का एहसास रहता है।',
      },
      {
        title: 'ओव्यूलेशन से पहले',
        text: 'ज़्यादा मात्रा में, धुंधला और चिपचिपा।',
      },
      {
        title: 'ओव्यूलेशन नज़दीक आने पर',
        text: 'साफ़, खिंचने वाला और लचीला, कच्चे अंडे की सफ़ेदी जैसा।',
      },
      {
        title: 'ओव्यूलेशन के बाद',
        text: 'ज़्यादा गाढ़ा, अपारदर्शी, या बहुत कम मात्रा में।',
      },
    ],
    section3Intro: 'ओव्यूलेशन (अंडोत्सर्ग) नज़दीक आने पर यह ऐसा हो जाता है:',
    fertileSigns: [
      'साफ़ या पारदर्शी',
      'खिंचने वाला — दो उँगलियों के बीच खिंचता है',
      'लचीला, कच्चे अंडे की सफ़ेदी जैसा',
      'बाकी दिनों से ज़्यादा मात्रा में',
    ],
    infoTitle: 'एक आसान आदत, रोज़ाना',
    infoText: 'टॉयलेट पेपर या साफ़ उँगलियों से इसका रूप और बनावट देखें, दिन के लगभग एक ही समय पर, और जो दिखे उसे नोट करें।',
    modifyingFactors: [
      'हाल ही में हुआ संभोग',
      'अंतरंग स्वच्छता के उत्पाद',
      'हार्मोनल गर्भनिरोध या कुछ इलाज',
      'कोई संक्रमण या स्थानीय असंतुलन',
    ],
    section6Body: 'हर महिला की प्रोफ़ाइल अलग होती है, और अपनी प्रोफ़ाइल पहचानने में कई चक्रों का अभ्यास लगता है। इस बदलाव को रोज़ देखना, दूसरे संकेतों के साथ, आपकी फ़र्टाइल विंडो को बेहतर पहचानने में मदद करता है — लेकिन अगर आपको चिंता हो तो यह कभी भी डॉक्टरी सलाह की जगह नहीं लेता।',
    tipTitle: 'जानना अच्छा रहेगा',
    tipText: 'सर्वाइकल म्यूकस को अपने बेसल तापमान या ओव्यूलेशन टेस्ट के साथ जोड़ने से आपके चक्र की ज़्यादा पूरी तस्वीर मिलती है।',
    summaryPoints: [
      'एस्ट्रोजन और प्रोजेस्टेरोन के असर से सर्वाइकल म्यूकस की बनावट पूरे चक्र में बदलती रहती है।',
      'ओव्यूलेशन नज़दीक आने पर यह साफ़, खिंचने वाला और लचीला हो जाता है, कच्चे अंडे की सफ़ेदी जैसा।',
      'इस बदलाव को रोज़ देखना, दूसरे संकेतों के साथ, आपकी फ़र्टाइल विंडो को बेहतर पहचानने में मदद करता है।',
      'अपना खुद का पैटर्न पहचानने में अभ्यास और कई चक्रों तक अवलोकन करना पड़ता है।',
    ],
    disclaimerText: 'यह जानकारी सिर्फ़ सामान्य जानकारी के लिए है। यह लेख व्यक्तिगत चिकित्सकीय सलाह का विकल्प नहीं है। संदेह होने पर किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'अपने सर्वाइकल म्यूकस को देखना सीखें — AWA',
  },
  sq: {
    badge: 'PJELLORIA • MUKUSI I QAFËS SË MITRËS',
    title: 'Vëzhgimi i mukusit\ntë qafës së mitrës',
    metaDuration: '5 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Një sinjal natyral dhe falas për të dalluar dritaren tënde pjellore.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë është mukusi i qafës së mitrës?',
      'Si ndryshon gjatë ciklit',
      'Njohja e mukusit pjellor',
      'Si ta vëzhgosh çdo ditë',
      'Çfarë mund t’i ndikojë vëzhgimet e tua',
      'Kufizimet e kësaj metode',
      'Pikat kryesore',
    ],
    section1Body: 'Është një sekrecion natyral i prodhuar nga qafa e mitrës. Mukusi i qafës së mitrës e ndryshon strukturën gjatë ciklit nën ndikimin e estrogjenit dhe të progesteronit.',
    cycleEvolution: [
      {
        title: 'Pas menstruacioneve',
        text: 'Pak mukus, shpesh një ndjesi thatësie.',
      },
      {
        title: 'Para ovulacionit',
        text: 'Më i bollshëm, i turbullt dhe ngjitës.',
      },
      {
        title: 'Kur afron ovulacioni',
        text: 'I pastër, i shtrirë dhe elastik, i ngjashëm me të bardhën e vezës së pagatuar.',
      },
      {
        title: 'Pas ovulacionit',
        text: 'Më i trashë, i errët ose shumë më pak i pranishëm.',
      },
    ],
    section3Intro: 'Kur afron ovulacioni, bëhet:',
    fertileSigns: [
      'I pastër ose transparent',
      'I shtrirë — shtrihet mes dy gishtave',
      'Elastik, i ngjashëm me të bardhën e vezës së pagatuar',
      'Më i bollshëm se ditët e tjera',
    ],
    infoTitle: 'Një zakon i thjeshtë, çdo ditë',
    infoText: 'Vëzhgo pamjen dhe strukturën me letër higjienike ose me gishta të pastër, afërsisht në të njëjtën orë të ditës, dhe shëno atë që vëren.',
    modifyingFactors: [
      'Marrëdhënie intime e fundit',
      'Produkte të higjienës intime',
      'Kontracepsioni hormonal ose disa trajtime',
      'Një infeksion ose çekuilibër lokal',
    ],
    section6Body: 'Çdo grua ka një profil të ndryshëm dhe njohja e profilit tënd kërkon praktikë gjatë disa cikleve. Ta vëzhgosh këtë ndryshim çdo ditë, së bashku me shenja të tjera, të ndihmon ta dallosh më mirë dritaren tënde pjellore — por nuk e zëvendëson kurrë këshillën mjekësore nëse ke shqetësime.',
    tipTitle: 'Mirë është ta dish',
    tipText: 'Kombinimi i mukusit të qafës së mitrës me temperaturën tënde bazale ose me testet e ovulacionit jep një pamje më të plotë të ciklit tënd.',
    summaryPoints: [
      'Mukusi i qafës së mitrës e ndryshon strukturën gjatë ciklit nën ndikimin e estrogjenit dhe të progesteronit.',
      'Kur afron ovulacioni, bëhet i pastër, i shtrirë dhe elastik, i ngjashëm me të bardhën e vezës së pagatuar.',
      'Ta vëzhgosh këtë ndryshim çdo ditë, së bashku me shenja të tjera, të ndihmon ta dallosh më mirë dritaren tënde pjellore.',
      'Njohja e modelit tënd kërkon praktikë dhe disa cikle vëzhgimi.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson këshillën mjekësore të personalizuar. Në rast dyshimi, kërko orientim nga një profesionist i shëndetësisë.',
    shareMessage: 'Vëzhgimi i mukusit të qafës së mitrës — AWA',
  },
  ja: {
    badge: '妊娠しやすさ • 子宮頸管粘液',
    title: '子宮頸管粘液を\n観察する',
    metaDuration: '読了時間5分',
    metaType: 'ガイド',
    metaLevel: '中級',
    metaValidated: '確認済みの内容',
    intro: '妊娠しやすい期間を見つけるための、自然で費用のかからないサインです。',
    contentsTitle: 'この記事の内容',
    topics: [
      '子宮頸管粘液とは？',
      '周期を通じた変化',
      '妊娠しやすい時期の粘液の見分け方',
      '毎日の観察のしかた',
      '観察に影響しうること',
      'この方法の限界',
      'ポイントのまとめ',
    ],
    section1Body: '子宮頸管から分泌される、自然な分泌物です。子宮頸管粘液は、エストロゲンとプロゲステロンの作用で、周期を通じて質感が変わります。',
    cycleEvolution: [
      {
        title: '生理のあと',
        text: '粘液は少なく、乾いた感じがすることが多くなります。',
      },
      {
        title: '排卵の前',
        text: '量が増え、白く濁って、ねばつきます。',
      },
      {
        title: '排卵が近づくとき',
        text: '透明でよく伸び、弾力があり、生卵の白身に似ています。',
      },
      {
        title: '排卵のあと',
        text: '粘りが強くなって不透明になるか、量がぐっと少なくなります。',
      },
    ],
    section3Intro: '排卵が近づくと、次のようになります。',
    fertileSigns: [
      '透明、または透き通っている',
      'よく伸びる — 2本の指の間で糸を引く',
      '弾力があり、生卵の白身に似ている',
      'ほかの日より量が多い',
    ],
    infoTitle: '毎日できる簡単な習慣',
    infoText: 'トイレットペーパーや清潔な指で、見た目と質感を観察します。毎日だいたい同じ時間に行い、気づいたことをメモしましょう。',
    modifyingFactors: [
      '最近の性交',
      'デリケートゾーン用の衛生用品',
      'ホルモン避妊や一部の治療',
      '感染症や、局所のバランスの乱れ',
    ],
    section6Body: '人によってパターンは異なり、自分のパターンを見分けるには、何周期かの練習が必要です。ほかのサインとあわせて、この変化を毎日観察すると、妊娠しやすい期間をより正確につかみやすくなります。ただし、気になることがある場合の医療上の助言に代わるものではありません。',
    tipTitle: '知っておきたいこと',
    tipText: '子宮頸管粘液を基礎体温や排卵検査薬と組み合わせると、周期の全体像がよりつかみやすくなります。',
    summaryPoints: [
      '子宮頸管粘液は、エストロゲンとプロゲステロンの作用で、周期を通じて質感が変わります。',
      '排卵が近づくと、透明でよく伸び、弾力があり、生卵の白身に似た状態になります。',
      'ほかのサインとあわせて、この変化を毎日観察すると、妊娠しやすい期間をより正確につかみやすくなります。',
      '自分のパターンを見分けるには、練習と、何周期かの観察が必要です。',
    ],
    disclaimerText: '情報提供を目的とした内容です。この記事は、個別の医療上の助言に代わるものではありません。不安がある場合は、医療従事者に相談してください。',
    shareMessage: '子宮頸管粘液を観察する — AWA',
  },
  ko: {
    badge: '임신 가능성 • 자궁 경부 점액',
    title: '자궁 경부 점액\n관찰하기',
    metaDuration: '읽는 데 5분',
    metaType: '가이드',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '가임기를 알아보는 자연스럽고 비용이 들지 않는 신호예요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '자궁 경부 점액이란?',
      '주기에 따라 어떻게 달라질까요',
      '가임기 점액 알아보기',
      '매일 관찰하는 방법',
      '관찰에 영향을 줄 수 있는 요인',
      '이 방법의 한계',
      '핵심 정리',
    ],
    section1Body: '자궁 경부에서 만들어지는 자연스러운 분비물이에요. 자궁 경부 점액은 에스트로겐과 프로게스테론의 영향으로 주기 내내 질감이 달라져요.',
    cycleEvolution: [
      {
        title: '생리 후',
        text: '점액이 적고 건조한 느낌이 드는 경우가 많아요.',
      },
      {
        title: '배란 전',
        text: '양이 더 많아지고 탁하며 끈적해요.',
      },
      {
        title: '배란이 가까워질 때',
        text: '맑고 늘어나며 탄력이 있어서 날달걀 흰자와 비슷해요.',
      },
      {
        title: '배란 후',
        text: '더 걸쭉하고 불투명해지거나 양이 훨씬 줄어요.',
      },
    ],
    section3Intro: '배란이 가까워지면 다음과 같아져요.',
    fertileSigns: [
      '맑거나 투명해요',
      '늘어나요. 두 손가락 사이에서 죽 늘어나요',
      '탄력이 있어서 날달걀 흰자와 비슷해요',
      '다른 날보다 양이 더 많아요',
    ],
    infoTitle: '매일 하는 간단한 습관',
    infoText: '화장지나 깨끗한 손가락으로 모양과 질감을 하루 중 비슷한 시간에 관찰하고, 느낀 점을 기록해요.',
    modifyingFactors: [
      '최근의 성관계',
      '질 세정제 같은 위생 제품',
      '호르몬 피임법 또는 일부 치료',
      '감염 또는 국소적인 불균형',
    ],
    section6Body: '사람마다 양상이 달라서, 나의 양상을 알아보려면 여러 주기에 걸친 연습이 필요해요. 이 변화를 다른 신호와 함께 매일 관찰하면 가임기를 더 정확히 짚어 보는 데 도움이 돼요. 하지만 걱정되는 점이 있다면 의학적 조언을 대신할 수는 없어요.',
    tipTitle: '알아두면 좋아요',
    tipText: '자궁 경부 점액을 기초체온이나 배란 테스트와 함께 활용하면 주기를 더 폭넓게 파악할 수 있어요.',
    summaryPoints: [
      '자궁 경부 점액은 에스트로겐과 프로게스테론의 영향으로 주기 내내 질감이 달라져요.',
      '배란이 가까워지면 맑고 늘어나며 탄력이 있어서 날달걀 흰자와 비슷해져요.',
      '이 변화를 다른 신호와 함께 매일 관찰하면 가임기를 더 정확히 짚어 보는 데 도움이 돼요.',
      '나의 양상을 알아보려면 연습과 여러 주기에 걸친 관찰이 필요해요.',
    ],
    disclaimerText: '정보 제공용 콘텐츠예요. 이 아티클은 개인별 맞춤 의학적 조언을 대신하지 않아요. 궁금한 점이 있다면 의료 전문가에게 안내를 받으세요.',
    shareMessage: '자궁 경부 점액 관찰하기 — AWA',
  },
  'pt-PT': {
    badge: 'FERTILIDADE • MUCO CERVICAL',
    title: 'Observar o seu\nmuco cervical',
    metaDuration: '5 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'Um sinal natural e gratuito para identificar a sua janela fértil.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que é o muco cervical?',
      'Como muda ao longo do ciclo',
      'Reconhecer o muco fértil',
      'Como o observar diariamente',
      'O que pode afetar as suas observações',
      'Os limites deste método',
      'Pontos a reter',
    ],
    section1Body: 'É uma secreção natural produzida pelo colo do útero. O muco cervical muda de textura ao longo do ciclo sob o efeito dos estrogénios e da progesterona.',
    cycleEvolution: [
      {
        title: 'Depois do período',
        text: 'Pouco muco, muitas vezes com sensação de secura.',
      },
      {
        title: 'Antes da ovulação',
        text: 'Mais abundante, turvo e pegajoso.',
      },
      {
        title: 'À medida que a ovulação se aproxima',
        text: 'Transparente, filante e elástico, semelhante à clara de ovo crua.',
      },
      {
        title: 'Depois da ovulação',
        text: 'Mais espesso, opaco ou muito menos presente.',
      },
    ],
    section3Intro: 'À medida que a ovulação se aproxima, torna-se:',
    fertileSigns: [
      'Claro ou transparente',
      'Filante — estica-se entre dois dedos',
      'Elástico, semelhante à clara de ovo crua',
      'Mais abundante do que nos outros dias',
    ],
    infoTitle: 'Um hábito simples, todos os dias',
    infoText: 'Observe o aspeto e a textura com papel higiénico ou com os dedos limpos, aproximadamente à mesma hora do dia, e anote o que notar.',
    modifyingFactors: [
      'Relações sexuais recentes',
      'Produtos de higiene íntima',
      'Contraceção hormonal ou certos tratamentos',
      'Uma infeção ou um desequilíbrio local',
    ],
    section6Body: 'Cada pessoa tem um perfil diferente e reconhecer o seu exige prática ao longo de vários ciclos. Observar esta mudança todos os dias, juntamente com outros sinais, ajuda a identificar melhor a sua janela fértil — mas nunca substitui o aconselhamento médico se estiver preocupada.',
    tipTitle: 'Bom saber',
    tipText: 'Combinar o muco cervical com a temperatura corporal basal ou com os testes de ovulação dá uma imagem mais completa do seu ciclo.',
    summaryPoints: [
      'O muco cervical muda de textura ao longo do ciclo sob o efeito dos estrogénios e da progesterona.',
      'À medida que a ovulação se aproxima, torna-se transparente, filante e elástico, semelhante à clara de ovo crua.',
      'Observar esta mudança todos os dias, juntamente com outros sinais, ajuda a identificar melhor a sua janela fértil.',
      'Reconhecer o seu próprio padrão exige prática e vários ciclos de observação.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui um aconselhamento médico personalizado. Em caso de dúvida, peça orientação a um profissional de saúde.',
    shareMessage: 'Observar o seu muco cervical — AWA',
  },
  bn: {
    badge: 'প্রজনন ক্ষমতা • জরায়ুমুখের শ্লেষ্মা',
    title: 'আপনার জরায়ুমুখের\nশ্লেষ্মা পর্যবেক্ষণ',
    metaDuration: '5 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'মাঝারি',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'আপনার উর্বর সময় চিনে নেওয়ার একটি প্রাকৃতিক ও বিনামূল্যের সংকেত।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'জরায়ুমুখের শ্লেষ্মা কী?',
      'চক্র জুড়ে এটি কীভাবে বদলায়',
      'উর্বর শ্লেষ্মা চেনা',
      'প্রতিদিন কীভাবে পর্যবেক্ষণ করবেন',
      'যা আপনার পর্যবেক্ষণকে প্রভাবিত করতে পারে',
      'এই পদ্ধতির সীমাবদ্ধতা',
      'মূল কথা',
    ],
    section1Body: 'এটি জরায়ুমুখ থেকে তৈরি একটি প্রাকৃতিক নিঃসরণ। ইস্ট্রোজেন ও প্রোজেস্টেরনের প্রভাবে চক্র জুড়ে জরায়ুমুখের শ্লেষ্মার ঘনত্ব বদলায়।',
    cycleEvolution: [
      {
        title: 'মাসিকের পর',
        text: 'শ্লেষ্মা কম, প্রায়ই শুষ্কতার অনুভূতি।',
      },
      {
        title: 'ডিম্বস্ফোটনের আগে',
        text: 'বেশি পরিমাণে, ঘোলাটে ও আঠালো।',
      },
      {
        title: 'ডিম্বস্ফোটন ঘনিয়ে এলে',
        text: 'স্বচ্ছ, টানলে লম্বা হয় ও স্থিতিস্থাপক, কাঁচা ডিমের সাদা অংশের মতো।',
      },
      {
        title: 'ডিম্বস্ফোটনের পর',
        text: 'আরও ঘন, অস্বচ্ছ, বা অনেক কম পরিমাণে।',
      },
    ],
    section3Intro: 'ডিম্বস্ফোটন ঘনিয়ে এলে এটি হয়ে ওঠে:',
    fertileSigns: [
      'স্বচ্ছ বা পরিষ্কার',
      'টানলে লম্বা হয় — দুই আঙুলের মাঝে প্রসারিত হয়',
      'স্থিতিস্থাপক, কাঁচা ডিমের সাদা অংশের মতো',
      'অন্য দিনগুলোর চেয়ে বেশি পরিমাণে',
    ],
    infoTitle: 'একটি সহজ অভ্যাস, প্রতিদিন',
    infoText: 'টয়লেট পেপার বা পরিষ্কার আঙুল দিয়ে প্রতিদিন মোটামুটি একই সময়ে চেহারা ও ঘনত্ব পর্যবেক্ষণ করুন এবং যা লক্ষ্য করেন তা লিখে রাখুন।',
    modifyingFactors: [
      'সাম্প্রতিক সহবাস',
      'ব্যক্তিগত স্বাস্থ্যবিধির পণ্য',
      'হরমোনাল জন্মনিয়ন্ত্রণ বা কিছু চিকিৎসা',
      'সংক্রমণ বা স্থানীয় ভারসাম্যহীনতা',
    ],
    section6Body: 'প্রত্যেকের ধরন আলাদা, এবং নিজের ধরন চিনতে বেশ কয়েকটি চক্র ধরে অনুশীলন লাগে। অন্যান্য লক্ষণের পাশাপাশি প্রতিদিন এই পরিবর্তন পর্যবেক্ষণ করলে আপনার উর্বর সময় আরও ভালোভাবে নির্ণয় করতে সাহায্য হয় — কিন্তু উদ্বেগ থাকলে এটি কখনোই চিকিৎসকের পরামর্শের বিকল্প নয়।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'জরায়ুমুখের শ্লেষ্মার সঙ্গে আপনার বেসাল শরীরের তাপমাত্রা বা ডিম্বস্ফোটন পরীক্ষা মিলিয়ে দেখলে আপনার চক্রের একটি পূর্ণতর চিত্র পাওয়া যায়।',
    summaryPoints: [
      'ইস্ট্রোজেন ও প্রোজেস্টেরনের প্রভাবে চক্র জুড়ে জরায়ুমুখের শ্লেষ্মার ঘনত্ব বদলায়।',
      'ডিম্বস্ফোটন ঘনিয়ে এলে এটি স্বচ্ছ, টানলে লম্বা হয় ও স্থিতিস্থাপক হয়ে ওঠে, কাঁচা ডিমের সাদা অংশের মতো।',
      'অন্যান্য লক্ষণের পাশাপাশি প্রতিদিন এই পরিবর্তন পর্যবেক্ষণ করলে আপনার উর্বর সময় আরও ভালোভাবে নির্ণয় করতে সাহায্য হয়।',
      'নিজের ধরন চিনতে অনুশীলন এবং বেশ কয়েকটি চক্র পর্যবেক্ষণ লাগে।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। সন্দেহ থাকলে কোনো স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'আপনার জরায়ুমুখের শ্লেষ্মা পর্যবেক্ষণ — AWA',
  },
  da: {
    badge: 'FERTILITET • LIVMODERHALSSEKRET',
    title: 'Observer dit\nlivmoderhalssekret',
    metaDuration: '5 min læsning',
    metaType: 'Guide',
    metaLevel: 'Øvet begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Et naturligt og gratis signal til at spotte dit fertile vindue.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er livmoderhalssekret?',
      'Hvordan det ændrer sig gennem cyklusen',
      'Genkend fertilt sekret',
      'Sådan observerer du det dagligt',
      'Hvad kan påvirke dine observationer',
      'Metodens begrænsninger',
      'Vigtige pointer',
    ],
    section1Body:
      'Det er en naturlig sekretion fra livmoderhalsen. Livmoderhalssekret ændrer konsistens gennem cyklusen under indflydelse af østrogen og progesteron.',
    cycleEvolution: [
      {
        title: 'Efter din menstruation',
        text: 'Lidt sekret, ofte en fornemmelse af tørhed.',
      },
      {
        title: 'Før ægløsning',
        text: 'Mere rigeligt, uklart og klæbrigt.',
      },
      {
        title: 'Når ægløsningen nærmer sig',
        text: 'Klart, strækbart og elastisk – som rå æggehvide.',
      },
      {
        title: 'Efter ægløsning',
        text: 'Tykkere, uigennemsigtigt eller meget lidt til stede.',
      },
    ],
    section3Intro: 'Når ægløsningen nærmer sig, bliver det:',
    fertileSigns: [
      'Klart eller gennemsigtigt',
      'Strækbart – det strækker sig mellem to fingre',
      'Elastisk som rå æggehvide',
      'Mere rigeligt end på andre dage',
    ],
    infoTitle: 'En simpel vane, hver dag',
    infoText:
      'Observer udseendet og konsistensen med toiletpapir eller rene fingre, omtrent på samme tidspunkt af dagen, og noter hvad du bemærker.',
    modifyingFactors: [
      'Nylig samleje',
      'Intime hygiejneprodukter',
      'Hormonel prævention eller visse behandlinger',
      'En infektion eller lokal ubalance',
    ],
    section6Body:
      'Alle har et forskelligt mønster, og det tager øvelse over flere cyklusser at genkende sit eget. At observere denne ændring hver dag, kombineret med andre tegn, hjælper dig med bedre at fastslå dit fertile vindue – men det erstatter aldrig lægeråd, hvis du er bekymret.',
    tipTitle: 'Godt at vide',
    tipText:
      'At kombinere livmoderhalssekret med din basaltemperatur eller ægløsningstests giver et mere fuldstændigt billede af din cyklus.',
    summaryPoints: [
      'Livmoderhalssekret ændrer konsistens gennem cyklusen under indflydelse af østrogen og progesteron.',
      'Når ægløsningen nærmer sig, bliver det klart, strækbart og elastisk – som rå æggehvide.',
      'At observere denne ændring dagligt, kombineret med andre tegn, hjælper dig bedre med at fastslå dit fertile vindue.',
      'Det tager øvelse og flere cyklusser at genkende dit eget mønster.',
    ],
    disclaimerText:
      'Informationsindhold. Denne artikel erstatter ikke personlig medicinsk rådgivning. Søg vejledning fra en sundhedsprofessionel, hvis du er i tvivl.',
    shareMessage: 'Observer dit livmoderhalssekret — AWA',
  },
  da: {
    badge: 'FERTILITET • LIVMODERHALSSEKRET',
    title: 'Observer dit\nlivmoderhalssekret',
    metaDuration: '5 min läsning',
    metaType: 'Guide',
    metaLevel: 'Övet begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Et naturligt och gratis signal till at spotte ditt fertile vindue.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar livmoderhalssekret?',
      'Hvordan det ändrer sig gennem cyklusen',
      'Genkend fertilt sekret',
      'Sådan observerer du det dagligt',
      'Hvad kan påvirke dina observationer',
      'Metodens begränsninger',
      'Vigtige pointer',
    ],
    section1Body:
      'Det ar en naturlig sekretion fran livmoderhalsen. Livmoderhalssekret ändrer konsistens gennem cyklusen under indflydelse av östrogen och progesteron.',
    cycleEvolution: [
      {
        title: 'Efter din menstruation',
        text: 'Lidt sekret, ofta en fornemmelse av törhed.',
      },
      {
        title: 'För äglösning',
        text: 'Mere rigeligt, uklart och kläbrigt.',
      },
      {
        title: 'Når äglösningen närmer sig',
        text: 'Klart, sträkbart och elastisk – som rå äggehvide.',
      },
      {
        title: 'Efter äglösning',
        text: 'Tykkere, uigennemsigtigt eller mycket lite till stede.',
      },
    ],
    section3Intro: 'Når äglösningen närmer sig, bliver det:',
    fertileSigns: [
      'Klart eller gennemsigtigt',
      'Sträkbart – det sträkker sig mellem to fingre',
      'Elastisk som rå äggehvide',
      'Mere rigeligt end på andre dage',
    ],
    infoTitle: 'En simpel vane, hver dag',
    infoText:
      'Observer udseendet och konsistensen med toiletpapir eller rene fingre, omtrent på samme tidspunkt av dagen, och noter hvad du bemärker.',
    modifyingFactors: [
      'Nylig samleje',
      'Intime hygiejneprodukter',
      'Hormonel prävention eller visse behandlinger',
      'En infektion eller lokal ubalance',
    ],
    section6Body:
      'Alla har et forskelligt mönster, och det tager övelse over flere cyklusser at genkende sit eget. At observere denne ändring hver dag, kombineret med andre tegn, hjälper dig med bedre at fastslå ditt fertile vindue – men det erstatter aldrig lägeråd, hvis du ar bekymret.',
    tipTitle: 'Godt at vide',
    tipText:
      'At kombinere livmoderhalssekret med din basaltemperatur eller äglösningstests giver et mere fuldständigt billede av din cyklus.',
    summaryPoints: [
      'Livmoderhalssekret ändrer konsistens gennem cyklusen under indflydelse av östrogen och progesteron.',
      'Når äglösningen närmer sig, bliver det klart, sträkbart och elastisk – som rå äggehvide.',
      'At observere denne ändring dagligt, kombineret med andre tegn, hjälper dig bedre med at fastslå ditt fertile vindue.',
      'Det tager övelse och flere cyklusser at genkende ditt eget mönster.',
    ],
    disclaimerText:
      'Informationsindhold. Denne artikel erstatter inte personlig medicinsk rådgivning. Sög vejledning fran en halsasprofessionel, hvis du ar i tvivl.',
    shareMessage: 'Observer ditt livmoderhalssekret — AWA',
  },
  sv: {
    badge: 'FERTILITET • LIVMODERHALSSEKRET',
    title: 'Observer dit\nlivmoderhalssekret',
    metaDuration: '5 min läsning',
    metaType: 'Guide',
    metaLevel: 'Övet begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Et naturligt och gratis signal till at spotte ditt fertile vindue.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar livmoderhalssekret?',
      'Hvordan det ändrer sig gennem cyklusen',
      'Genkend fertilt sekret',
      'Sådan observerer du det dagligt',
      'Hvad kan påvirke dina observationer',
      'Metodens begränsninger',
      'Vigtige pointer',
    ],
    section1Body:
      'Det ar en naturlig sekretion fran livmoderhalsen. Livmoderhalssekret ändrer konsistens gennem cyklusen under indflydelse av östrogen och progesteron.',
    cycleEvolution: [
      {
        title: 'Efter din menstruation',
        text: 'Lidt sekret, ofta en fornemmelse av törhed.',
      },
      {
        title: 'För äglösning',
        text: 'Mere rigeligt, uklart och kläbrigt.',
      },
      {
        title: 'Når äglösningen närmer sig',
        text: 'Klart, sträkbart och elastisk – som rå äggehvide.',
      },
      {
        title: 'Efter äglösning',
        text: 'Tykkere, uigennemsigtigt eller mycket lite till stede.',
      },
    ],
    section3Intro: 'Når äglösningen närmer sig, bliver det:',
    fertileSigns: [
      'Klart eller gennemsigtigt',
      'Sträkbart – det sträkker sig mellem to fingre',
      'Elastisk som rå äggehvide',
      'Mere rigeligt end på andre dage',
    ],
    infoTitle: 'En simpel vane, hver dag',
    infoText:
      'Observer udseendet och konsistensen med toiletpapir eller rene fingre, omtrent på samme tidspunkt av dagen, och noter hvad du bemärker.',
    modifyingFactors: [
      'Nylig samleje',
      'Intime hygiejneprodukter',
      'Hormonel prävention eller visse behandlinger',
      'En infektion eller lokal ubalance',
    ],
    section6Body:
      'Alla har et forskelligt mönster, och det tager övelse over flere cyklusser at genkende sit eget. At observere denne ändring hver dag, kombineret med andre tegn, hjälper dig med bedre at fastslå ditt fertile vindue – men det erstatter aldrig lägeråd, hvis du ar bekymret.',
    tipTitle: 'Godt at vide',
    tipText:
      'At kombinere livmoderhalssekret med din basaltemperatur eller äglösningstests giver et mere fuldständigt billede av din cyklus.',
    summaryPoints: [
      'Livmoderhalssekret ändrer konsistens gennem cyklusen under indflydelse av östrogen och progesteron.',
      'Når äglösningen närmer sig, bliver det klart, sträkbart och elastisk – som rå äggehvide.',
      'At observere denne ändring dagligt, kombineret med andre tegn, hjälper dig bedre med at fastslå ditt fertile vindue.',
      'Det tager övelse och flere cyklusser at genkende ditt eget mönster.',
    ],
    disclaimerText:
      'Informationsindhold. Denne artikel erstatter inte personlig medicinsk rådgivning. Sög vejledning fran en halsasprofessionel, hvis du ar i tvivl.',
    shareMessage: 'Observer ditt livmoderhalssekret — AWA',
  },
} as const);

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
            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={23}
              onPress={() => navigation.goBack()}
              variant="tonal"
            />

            <View style={styles.actions}>
              <AwaIconButton
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

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

          <AwaText variant="titleSmall" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((topic, index) => (
              <View key={topic} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
                  <AwaText variant="bodySmall" style={styles.contentText}>{topic}</AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section1Body}
          </AwaText>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <View style={styles.normalGrid}>
            {content.cycleEvolution.map((item, index) => (
              <AwaCard variant="filled" padding="none" key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={CYCLE_EVOLUTION_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>{item.title}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>{item.text}</AwaText>
              </AwaCard>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section3Intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.fertileSigns.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={16}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="eye-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                {content.infoText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.modifyingFactors.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section6Body}
          </AwaText>

          {/* ================================================================= */}
          {/* TIP                                                               */}
          {/* ================================================================= */}

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

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.topics[6]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" style={styles.summaryText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>
              {content.disclaimerText}
            </AwaText>
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
  contentNumber: {width: 25},
  contentText: {flex: 1},

  h2: {
    marginTop: 28,
  },
  body: {marginTop: 8},

  normalGrid: {marginTop: 12, gap: 8},
  normalCard: {
    padding: 12,
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  normalTitle: {marginTop: 8},
  normalText: {marginTop: 4},

  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8},
  checkText: {flex: 1},

  infoCard: {
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCopy: {flex: 1, marginLeft: 8},
  infoText: {marginTop: 3},

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},

  summaryCard: {
    marginTop: 12,
    padding: 16,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12},
  summaryText: {flex: 1},

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  disclaimerText: {flex: 1},
  });
}
