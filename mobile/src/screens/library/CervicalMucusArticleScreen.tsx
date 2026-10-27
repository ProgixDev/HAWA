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
  nb: {
    badge: 'FRUKTBARHET • LIVMORHALSSLIM',
    title: 'Observere\nlivmorhalsslimet ditt',
    metaDuration: '5 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Et naturlig, gratis signal for å oppdage det fruktbare vinduet ditt.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er livmorhalsslim?',
      'Hvordan det endrer seg gjennom syklusen',
      'Kjenne igjen fruktbart slim',
      'Hvordan du observerer det daglig',
      'Hva som kan påvirke observasjonene dine',
      'Metodens begrensninger',
      'Det viktigste å huske',
    ],
    section1Body:
      'Det er en naturlig utskillelse som produseres av livmorhalsen. Livmorhalsslimet endrer konsistens gjennom syklusen under påvirkning av østrogen og progesteron.',
    cycleEvolution: [
      {
        title: 'Etter mensen',
        text: 'Lite slim, ofte en følelse av tørrhet.',
      },
      {
        title: 'Før eggløsningen',
        text: 'Mer rikelig, uklart og klebrig.',
      },
      {
        title: 'Når eggløsningen nærmer seg',
        text: 'Klart, strekkbart og elastisk, likt rå eggehvite.',
      },
      {
        title: 'Etter eggløsningen',
        text: 'Tykkere, ugjennomsiktig eller mye mindre til stede.',
      },
    ],
    section3Intro: 'Når eggløsningen nærmer seg, blir det:',
    fertileSigns: [
      'Klart eller gjennomsiktig',
      'Strekkbart – det strekker seg mellom to fingre',
      'Elastisk, likt rå eggehvite',
      'Mer rikelig enn andre dager',
    ],
    infoTitle: 'En enkel vane, hver dag',
    infoText:
      'Observer utseendet og konsistensen med toalettpapir eller rene fingre, omtrent til samme tid på dagen, og noter det du merker.',
    modifyingFactors: [
      'Nylig samleie',
      'Produkter for intim hygiene',
      'Hormonell prevensjon eller visse behandlinger',
      'En infeksjon eller lokal ubalanse',
    ],
    section6Body:
      'Alle har sin egen profil, og å kjenne igjen din egen krever øvelse over flere sykluser. Å observere denne endringen hver dag, sammen med andre tegn, hjelper deg å fastslå det fruktbare vinduet bedre – men det erstatter aldri medisinsk rådgivning hvis du er bekymret.',
    tipTitle: 'Godt å vite',
    tipText:
      'Å kombinere livmorhalsslim med basaltemperaturen eller eggløsningstester gir et mer fullstendig bilde av syklusen din.',
    summaryPoints: [
      'Livmorhalsslimet endrer konsistens gjennom syklusen under påvirkning av østrogen og progesteron.',
      'Når eggløsningen nærmer seg, blir det klart, strekkbart og elastisk, likt rå eggehvite.',
      'Å observere denne endringen hver dag, sammen med andre tegn, hjelper deg å fastslå det fruktbare vinduet bedre.',
      'Å kjenne igjen ditt eget mønster krever øvelse og flere sykluser med observasjon.',
    ],
    disclaimerText:
      'Informasjonsinnhold. Denne artikkelen erstatter ikke personlig medisinsk rådgivning. Ved tvil bør du be helsepersonell om veiledning.',
    shareMessage: 'Observere livmorhalsslimet ditt – AWA',
  },
  pl: {
    badge: 'PŁODNOŚĆ • ŚLUZ SZYJKOWY',
    title: 'Obserwacja\nśluzu szyjkowego',
    metaDuration: '5 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Naturalny, darmowy sygnał, który pomaga rozpoznać okno płodności.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym jest śluz szyjkowy?',
      'Jak zmienia się w trakcie cyklu',
      'Rozpoznawanie śluzu płodnego',
      'Jak obserwować go codziennie',
      'Co może wpływać na obserwacje',
      'Ograniczenia tej metody',
      'Najważniejsze wnioski',
    ],
    section1Body:
      'To naturalna wydzielina produkowana przez szyjkę macicy. Śluz szyjkowy zmienia konsystencję w trakcie cyklu pod wpływem estrogenu i progesteronu.',
    cycleEvolution: [
      {
        title: 'Po miesiączce',
        text: 'Mało śluzu, często uczucie suchości.',
      },
      {
        title: 'Przed owulacją',
        text: 'Obfitszy, mętny i lepki.',
      },
      {
        title: 'W miarę zbliżania się owulacji',
        text: 'Przejrzysty, rozciągliwy i elastyczny, podobny do surowego białka jaja.',
      },
      {
        title: 'Po owulacji',
        text: 'Gęstszy, nieprzezroczysty lub znacznie mniej obecny.',
      },
    ],
    section3Intro: 'W miarę zbliżania się owulacji staje się:',
    fertileSigns: [
      'Przejrzysty lub przezroczysty',
      'Rozciągliwy — ciągnie się między dwoma palcami',
      'Elastyczny, podobny do surowego białka jaja',
      'Obfitszy niż w pozostałe dni',
    ],
    infoTitle: 'Prosty nawyk, codziennie',
    infoText:
      'Obserwuj wygląd i konsystencję za pomocą papieru toaletowego lub czystych palców, mniej więcej o tej samej porze dnia, i zapisuj swoje spostrzeżenia.',
    modifyingFactors: [
      'Niedawne współżycie',
      'Produkty do higieny intymnej',
      'Antykoncepcja hormonalna lub niektóre leki',
      'Infekcja lub miejscowe zaburzenie równowagi',
    ],
    section6Body:
      'Każda kobieta ma inny profil, a rozpoznanie własnego wymaga praktyki przez kilka cykli. Codzienna obserwacja tej zmiany, razem z innymi objawami, pomaga dokładniej wskazać okno płodności — ale nigdy nie zastępuje porady lekarskiej, jeśli masz obawy.',
    tipTitle: 'Warto wiedzieć',
    tipText:
      'Łączenie śluzu szyjkowego z podstawową temperaturą ciała lub testami owulacyjnymi daje pełniejszy obraz Twojego cyklu.',
    summaryPoints: [
      'Śluz szyjkowy zmienia konsystencję w trakcie cyklu pod wpływem estrogenu i progesteronu.',
      'W miarę zbliżania się owulacji staje się przejrzysty, rozciągliwy i elastyczny, podobny do surowego białka jaja.',
      'Codzienna obserwacja tej zmiany, razem z innymi objawami, pomaga dokładniej wskazać okno płodności.',
      'Rozpoznanie własnego wzorca wymaga praktyki i obserwacji przez kilka cykli.',
    ],
    disclaimerText:
      'Treść informacyjna. Ten artykuł nie zastępuje spersonalizowanej porady medycznej. W razie wątpliwości zasięgnij porady specjalisty.',
    shareMessage: 'Obserwacja śluzu szyjkowego — AWA',
  },
  uk: {
    badge: 'ФЕРТИЛЬНІСТЬ • ЦЕРВІКАЛЬНИЙ СЛИЗ',
    title: 'Спостереження за\nцервікальним слизом',
    metaDuration: '5 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro: 'Природний безкоштовний сигнал, що допомагає розпізнати фертильне вікно.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке цервікальний слиз?',
      'Як він змінюється протягом циклу',
      'Розпізнавання фертильного слизу',
      'Як спостерігати щодня',
      'Що може впливати на спостереження',
      'Обмеження цього методу',
      'Головні висновки',
    ],
    section1Body:
      'Це природний секрет, що виробляється шийкою матки. Цервікальний слиз змінює текстуру протягом циклу під дією естрогену та прогестерону.',
    cycleEvolution: [
      {
        title: 'Після менструації',
        text: 'Мало слизу, часто відчуття сухості.',
      },
      {
        title: 'До овуляції',
        text: 'Рясніший, каламутний і липкий.',
      },
      {
        title: 'У міру наближення овуляції',
        text: 'Прозорий, тягучий і еластичний, схожий на сирий яєчний білок.',
      },
      {
        title: 'Після овуляції',
        text: 'Густіший, непрозорий або набагато менше його.',
      },
    ],
    section3Intro: 'У міру наближення овуляції він стає:',
    fertileSigns: [
      'Прозорим або прозорішим',
      'Тягучим — розтягується між двома пальцями',
      'Еластичним, схожим на сирий яєчний білок',
      'Ряснішим, ніж в інші дні',
    ],
    infoTitle: 'Проста звичка, щодня',
    infoText:
      'Спостерігайте вигляд і текстуру за допомогою туалетного паперу або чистих пальців, приблизно в один і той самий час доби, і занотовуйте побачене.',
    modifyingFactors: [
      'Нещодавній статевий акт',
      'Засоби інтимної гігієни',
      'Гормональна контрацепція або певні ліки',
      'Інфекція чи місцевий дисбаланс',
    ],
    section6Body:
      'Кожна жінка має власний профіль, і розпізнавання свого потребує практики протягом кількох циклів. Щоденне спостереження за цією зміною разом з іншими ознаками допомагає точніше визначити фертильне вікно — але ніколи не замінює медичної поради, якщо у вас є побоювання.',
    tipTitle: 'Варто знати',
    tipText:
      'Поєднання цервікального слизу з базальною температурою тіла або овуляційними тестами дає повнішу картину вашого циклу.',
    summaryPoints: [
      'Цервікальний слиз змінює текстуру протягом циклу під дією естрогену та прогестерону.',
      'У міру наближення овуляції він стає прозорим, тягучим і еластичним, схожим на сирий яєчний білок.',
      'Щоденне спостереження за цією зміною разом з іншими ознаками допомагає точніше визначити фертильне вікно.',
      'Розпізнавання власного характеру потребує практики й спостережень протягом кількох циклів.',
    ],
    disclaimerText:
      'Інформаційний вміст. Ця стаття не замінює персоналізованої медичної поради. У разі сумнівів зверніться до медичного фахівця.',
    shareMessage: 'Спостереження за цервікальним слизом — AWA',
  },
  cs: {
    badge: 'PLODNOST • CERVIKÁLNÍ HLEN',
    title: 'Pozorování\ncervikálního hlenu',
    metaDuration: '5 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro: 'Přirozený a bezplatný signál k rozpoznání plodného období.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co je cervikální hlen?',
      'Jak se mění v průběhu cyklu',
      'Rozpoznání plodného hlenu',
      'Jak ho denně pozorovat',
      'Co může vaše pozorování ovlivnit',
      'Limity této metody',
      'Hlavní poznatky',
    ],
    section1Body:
      'Je to přirozená sekrece produkovaná děložním hrdlem. Cervikální hlen mění v průběhu cyklu konzistenci vlivem estrogenu a progesteronu.',
    cycleEvolution: [
      {
        title: 'Po menstruaci',
        text: 'Málo hlenu, často pocit sucha.',
      },
      {
        title: 'Před ovulací',
        text: 'Hojnější, zakalený a lepkavý.',
      },
      {
        title: 'Když se ovulace blíží',
        text: 'Čirý, tažný a pružný, podobný syrovému bílku.',
      },
      {
        title: 'Po ovulaci',
        text: 'Hustší, neprůhledný, nebo mnohem méně přítomný.',
      },
    ],
    section3Intro: 'Když se ovulace blíží, stává se:',
    fertileSigns: [
      'Čirý nebo průhledný',
      'Tažný — táhne se mezi dvěma prsty',
      'Pružný, podobný syrovému bílku',
      'Hojnější než v ostatní dny',
    ],
    infoTitle: 'Jednoduchý návyk každý den',
    infoText:
      'Pozorujte vzhled a konzistenci pomocí toaletního papíru nebo čistých prstů, přibližně ve stejnou denní dobu, a zapište si, co jste zaznamenala.',
    modifyingFactors: [
      'Nedávný pohlavní styk',
      'Prostředky intimní hygieny',
      'Hormonální antikoncepce nebo některé léky',
      'Infekce nebo místní nerovnováha',
    ],
    section6Body:
      'Každá žena má jiný profil a rozpoznání vlastního vyžaduje cvik během několika cyklů. Denní pozorování této změny spolu s dalšími příznaky vám pomůže lépe určit plodné období — ale nikdy nenahrazuje lékařskou radu, pokud máte obavy.',
    tipTitle: 'Stojí za to vědět',
    tipText:
      'Spojení cervikálního hlenu s bazální tělesnou teplotou nebo ovulačními testy poskytuje úplnější obraz o vašem cyklu.',
    summaryPoints: [
      'Cervikální hlen mění v průběhu cyklu konzistenci vlivem estrogenu a progesteronu.',
      'Když se ovulace blíží, stává se čirým, tažným a pružným, podobným syrovému bílku.',
      'Denní pozorování této změny spolu s dalšími příznaky vám pomůže lépe určit plodné období.',
      'Rozpoznání vlastního vzorce vyžaduje cvik a pozorování během několika cyklů.',
    ],
    disclaimerText:
      'Informativní obsah. Tento článek nenahrazuje individuální lékařskou radu. V případě pochybností požádejte o radu zdravotnického pracovníka.',
    shareMessage: 'Pozorování cervikálního hlenu — AWA',
  },
  sk: {
    badge: 'PLODNOSŤ • CERVIKÁLNY HLIEN',
    title: 'Sledovanie\nvášho cervikálneho hlienu',
    metaDuration: '5 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro: 'Prirodzený a bezplatný signál na rozpoznanie vášho plodného okna.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo je cervikálny hlien?',
      'Ako sa mení počas cyklu',
      'Rozpoznanie plodného hlienu',
      'Ako ho sledovať každý deň',
      'Čo môže ovplyvniť vaše pozorovania',
      'Limity tejto metódy',
      'Hlavné body',
    ],
    section1Body:
      'Je to prirodzený sekrét produkovaný krčkom maternice. Cervikálny hlien mení štruktúru počas cyklu pod vplyvom estrogénu a progesterónu.',
    cycleEvolution: [
      {
        title: 'Po menštruácii',
        text: 'Málo hlienu, často pocit suchosti.',
      },
      {
        title: 'Pred ovuláciou',
        text: 'Hojnejší, zakalený a lepkavý.',
      },
      {
        title: 'Pri blížiacej sa ovulácii',
        text: 'Číry, ťahavý a elastický, podobný surovému vaječnému bielku.',
      },
      {
        title: 'Po ovulácii',
        text: 'Hustejší, nepriehľadný alebo oveľa menej prítomný.',
      },
    ],
    section3Intro: 'Keď sa blíži ovulácia, stáva sa:',
    fertileSigns: [
      'Číry alebo priehľadný',
      'Ťahavý — natiahne sa medzi dvoma prstami',
      'Elastický, podobný surovému vaječnému bielku',
      'Hojnejší než v ostatné dni',
    ],
    infoTitle: 'Jednoduchý návyk, každý deň',
    infoText:
      'Sledujte vzhľad a štruktúru pomocou toaletného papiera alebo čistých prstov, približne v rovnakom čase počas dňa, a zaznamenajte si, čo ste si všimli.',
    modifyingFactors: [
      'Nedávny pohlavný styk',
      'Prípravky na intímnu hygienu',
      'Hormonálna antikoncepcia alebo niektoré liečby',
      'Infekcia alebo lokálna nerovnováha',
    ],
    section6Body:
      'Každá žena má iný profil a rozpoznať svoj vlastný vyžaduje prax počas niekoľkých cyklov. Každodenné sledovanie tejto zmeny spolu s ďalšími znakmi vám pomáha presnejšie určiť plodné okno — ale nikdy nenahrádza lekársku radu, ak máte obavy.',
    tipTitle: 'Stojí za to vedieť',
    tipText:
      'Kombinácia cervikálneho hlienu s bazálnou telesnou teplotou alebo ovulačnými testami poskytuje úplnejší obraz o vašom cykle.',
    summaryPoints: [
      'Cervikálny hlien mení štruktúru počas cyklu pod vplyvom estrogénu a progesterónu.',
      'Pri blížiacej sa ovulácii sa stáva čírym, ťahavým a elastickým, podobným surovému vaječnému bielku.',
      'Každodenné sledovanie tejto zmeny spolu s ďalšími znakmi vám pomáha presnejšie určiť plodné okno.',
      'Rozpoznanie vlastného vzoru vyžaduje prax a niekoľko cyklov sledovania.',
    ],
    disclaimerText:
      'Informatívny obsah. Tento článok nenahrádza individuálnu lekársku radu. V prípade pochybností sa poraďte so zdravotníckym pracovníkom.',
    shareMessage: 'Sledovanie vášho cervikálneho hlienu — AWA',
  },
  hu: {
    badge: 'TERMÉKENYSÉG • MÉHNYAKNYÁLKA',
    title: 'A méhnyaknyálkád\nmegfigyelése',
    metaDuration: '5 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Természetes, ingyenes jelzés a termékeny időszakod felismeréséhez.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi a méhnyaknyálka?',
      'Hogyan változik a ciklus során',
      'A termékeny nyálka felismerése',
      'Hogyan figyeld meg naponta',
      'Mi befolyásolhatja a megfigyeléseidet',
      'A módszer korlátai',
      'Legfontosabb tudnivalók',
    ],
    section1Body:
      'Természetes váladék, amelyet a méhnyak termel. A méhnyaknyálka állaga az ösztrogén és a progeszteron hatására változik a ciklus során.',
    cycleEvolution: [
      {
        title: 'A menstruáció után',
        text: 'Kevés nyálka, gyakran szárazságérzettel.',
      },
      {
        title: 'A peteérés előtt',
        text: 'Bőségesebb, zavaros és ragacsos.',
      },
      {
        title: 'A peteérés közeledtével',
        text: 'Átlátszó, nyúlós és rugalmas, mint a nyers tojásfehérje.',
      },
      {
        title: 'A peteérés után',
        text: 'Sűrűbb, átlátszatlan, vagy sokkal kevésbé van jelen.',
      },
    ],
    section3Intro: 'A peteérés közeledtével a következővé válik:',
    fertileSigns: [
      'Tiszta vagy átlátszó',
      'Nyúlós — két ujj között megnyúlik',
      'Rugalmas, mint a nyers tojásfehérje',
      'Bőségesebb, mint a többi napon',
    ],
    infoTitle: 'Egyszerű szokás, minden nap',
    infoText:
      'Figyeld meg a megjelenését és állagát vécépapír vagy tiszta ujjak segítségével, nagyjából a nap azonos időpontjában, és jegyezd fel, amit észlelsz.',
    modifyingFactors: [
      'Közelmúltbeli nemi élet',
      'Intim higiéniai termékek',
      'Hormonális fogamzásgátlás vagy bizonyos kezelések',
      'Fertőzés vagy helyi egyensúlyzavar',
    ],
    section6Body:
      'Mindenkinek más a profilja, és a sajátod felismerése több cikluson át tartó gyakorlást igényel. Ennek a változásnak a napi megfigyelése más jelekkel együtt segít pontosabban meghatározni a termékeny időszakodat — de soha nem helyettesíti az orvosi tanácsot, ha aggódsz.',
    tipTitle: 'Érdemes tudni',
    tipText:
      'A méhnyaknyálka kombinálása az alapvető testhőmérséklettel vagy a peteérési tesztekkel teljesebb képet ad a ciklusodról.',
    summaryPoints: [
      'A méhnyaknyálka állaga az ösztrogén és a progeszteron hatására változik a ciklus során.',
      'A peteérés közeledtével átlátszóvá, nyúlóssá és rugalmassá válik, mint a nyers tojásfehérje.',
      'Ennek a változásnak a napi megfigyelése más jelekkel együtt segít pontosabban meghatározni a termékeny időszakodat.',
      'A saját mintád felismerése gyakorlatot és több cikluson át tartó megfigyelést igényel.',
    ],
    disclaimerText:
      'Tájékoztató jellegű tartalom. Ez a cikk nem helyettesíti a személyre szabott orvosi tanácsot. Kétség esetén kérj útmutatást egészségügyi szakembertől.',
    shareMessage: 'A méhnyaknyálkád megfigyelése — AWA',
  },
  ro: {
    badge: 'FERTILITATE • MUCUS CERVICAL',
    title: 'Observarea\nmucusului cervical',
    metaDuration: '5 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro: 'Un semnal natural și gratuit pentru a-ți recunoaște fereastra fertilă.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce este mucusul cervical?',
      'Cum se schimbă pe parcursul ciclului',
      'Recunoașterea mucusului fertil',
      'Cum îl observi zilnic',
      'Ce poate influența observațiile tale',
      'Limitele acestei metode',
      'Ce să reții',
    ],
    section1Body:
      'Este o secreție naturală produsă de colul uterin. Mucusul cervical își schimbă textura pe parcursul ciclului, sub efectul estrogenului și al progesteronului.',
    cycleEvolution: [
      {
        title: 'După menstruație',
        text: 'Puțin mucus, adesea o senzație de uscăciune.',
      },
      {
        title: 'Înainte de ovulație',
        text: 'Mai abundent, tulbure și lipicios.',
      },
      {
        title: 'Când ovulația se apropie',
        text: 'Transparent, filant și elastic, asemănător cu albușul crud de ou.',
      },
      {
        title: 'După ovulație',
        text: 'Mai gros, opac sau mult mai puțin prezent.',
      },
    ],
    section3Intro: 'Când ovulația se apropie, devine:',
    fertileSigns: [
      'Limpede sau transparent',
      'Filant — se întinde între două degete',
      'Elastic, asemănător cu albușul crud de ou',
      'Mai abundent decât în alte zile',
    ],
    infoTitle: 'Un obicei simplu, în fiecare zi',
    infoText:
      'Observă aspectul și textura folosind hârtie igienică sau degete curate, aproximativ la aceeași oră a zilei, și notează ce observi.',
    modifyingFactors: [
      'Un raport intim recent',
      'Produse de igienă intimă',
      'Contracepția hormonală sau anumite tratamente',
      'O infecție sau un dezechilibru local',
    ],
    section6Body:
      'Fiecare femeie are un profil diferit, iar recunoașterea propriului profil necesită exercițiu pe parcursul mai multor cicluri. Observarea zilnică a acestei schimbări, alături de alte semne, te ajută să-ți identifici mai bine fereastra fertilă — dar nu înlocuiește niciodată sfatul medical dacă ești îngrijorată.',
    tipTitle: 'Bine de știut',
    tipText:
      'Combinarea mucusului cervical cu temperatura bazală sau cu testele de ovulație oferă o imagine mai completă a ciclului tău.',
    summaryPoints: [
      'Mucusul cervical își schimbă textura pe parcursul ciclului, sub efectul estrogenului și al progesteronului.',
      'Când ovulația se apropie, devine limpede, filant și elastic, asemănător cu albușul crud de ou.',
      'Observarea zilnică a acestei schimbări, alături de alte semne, te ajută să-ți identifici mai bine fereastra fertilă.',
      'Recunoașterea propriului tipar necesită exercițiu și mai multe cicluri de observare.',
    ],
    disclaimerText:
      'Conținut cu caracter informativ. Acest articol nu înlocuiește sfatul medical personalizat. Dacă ai îndoieli, cere îndrumare unui profesionist din domeniul sănătății.',
    shareMessage: 'Observarea mucusului cervical — AWA',
  },
  bg: {
    badge: 'ПЛОДОВИТОСТ • ЦЕРВИКАЛНА СЛУЗ',
    title: 'Наблюдение на\nцервикалната слуз',
    metaDuration: '5 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro: 'Естествен и безплатен сигнал, за да разпознаеш плодовития си прозорец.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво е цервикалната слуз?',
      'Как се променя през цикъла',
      'Разпознаване на плодовитата слуз',
      'Как да я наблюдаваш ежедневно',
      'Какво може да повлияе на наблюденията ти',
      'Границите на този метод',
      'Какво да запомниш',
    ],
    section1Body:
      'Това е естествен секрет, произвеждан от шийката на матката. Цервикалната слуз променя консистенцията си през цикъла под действието на естрогена и прогестерона.',
    cycleEvolution: [
      {
        title: 'След менструацията',
        text: 'Малко слуз, често усещане за сухота.',
      },
      {
        title: 'Преди овулацията',
        text: 'По-обилна, мътна и лепкава.',
      },
      {
        title: 'Когато овулацията наближава',
        text: 'Прозрачна, разтеглива и еластична, подобна на суров яйчен белтък.',
      },
      {
        title: 'След овулацията',
        text: 'По-гъста, непрозрачна или много по-малко налична.',
      },
    ],
    section3Intro: 'Когато овулацията наближава, става:',
    fertileSigns: [
      'Бистра или прозрачна',
      'Разтеглива — разтяга се между два пръста',
      'Еластична, подобна на суров яйчен белтък',
      'По-обилна, отколкото в останалите дни',
    ],
    infoTitle: 'Прост навик, всеки ден',
    infoText:
      'Наблюдавай вида и консистенцията с тоалетна хартия или чисти пръсти, приблизително по едно и също време на деня, и отбелязвай какво забелязваш.',
    modifyingFactors: [
      'Скорошен полов контакт',
      'Продукти за интимна хигиена',
      'Хормонална контрацепция или някои лечения',
      'Инфекция или локален дисбаланс',
    ],
    section6Body:
      'Всяка жена има различен профил, а разпознаването на собствения изисква упражнение през няколко цикъла. Ежедневното наблюдение на тази промяна, заедно с други признаци, ти помага да определиш по-добре плодовития си прозорец — но никога не замества медицинския съвет, ако си загрижена.',
    tipTitle: 'Добре е да знаеш',
    tipText:
      'Комбинирането на цервикалната слуз с базалната температура или с тестове за овулация дава по-пълна картина на цикъла ти.',
    summaryPoints: [
      'Цервикалната слуз променя консистенцията си през цикъла под действието на естрогена и прогестерона.',
      'Когато овулацията наближава, става бистра, разтеглива и еластична, подобна на суров яйчен белтък.',
      'Ежедневното наблюдение на тази промяна, заедно с други признаци, ти помага да определиш по-добре плодовития си прозорец.',
      'Разпознаването на собствения ти модел изисква упражнение и няколко цикъла на наблюдение.',
    ],
    disclaimerText:
      'Информационно съдържание. Тази статия не замества персонализирания медицински съвет. При съмнение поискай насоки от здравен специалист.',
    shareMessage: 'Наблюдение на цервикалната слуз — AWA',
  },
  sr: {
    badge: 'ПЛОДНОСТ • ЦЕРВИКАЛНА СЛУЗ',
    title: 'Посматрање твоје\nцервикалне слузи',
    metaDuration: '5 мин читања',
    metaType: 'Водич',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro: 'Природан, бесплатан знак за препознавање плодног прозора.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта је цервикална слуз?',
      'Како се мења током циклуса',
      'Препознавање плодне слузи',
      'Како је посматрати свакодневно',
      'Шта може утицати на твоја запажања',
      'Ограничења овог метода',
      'Шта да запамтиш',
    ],
    section1Body:
      'То је природни секрет који ствара грлић материце. Цервикална слуз мења текстуру током циклуса под дејством естрогена и прогестерона.',
    cycleEvolution: [
      {
        title: 'После менструације',
        text: 'Мало слузи, често осећај сувоће.',
      },
      {
        title: 'Пре овулације',
        text: 'Обилнија, замућена и лепљива.',
      },
      {
        title: 'Како се овулација приближава',
        text: 'Бистра, развлачива и еластична, налик сировом белансету.',
      },
      {
        title: 'После овулације',
        text: 'Гушћа, непровидна или много мање присутна.',
      },
    ],
    section3Intro: 'Како се овулација приближава, постаје:',
    fertileSigns: [
      'Бистра или провидна',
      'Развлачива — развлачи се између два прста',
      'Еластична, налик сировом белансету',
      'Обилнија него других дана',
    ],
    infoTitle: 'Једноставна навика, сваког дана',
    infoText:
      'Посматрај изглед и текстуру помоћу тоалет папира или чистих прстију, отприлике у исто доба дана, и забележи шта примећујеш.',
    modifyingFactors: [
      'Недавни полни однос',
      'Производи за интимну хигијену',
      'Хормонска контрацепција или одређене терапије',
      'Инфекција или локална неравнотежа',
    ],
    section6Body:
      'Свака жена има другачији профил, а препознавање сопственог захтева вежбу током неколико циклуса. Свакодневно посматрање ове промене, заједно са другим знацима, помаже ти да прецизније одредиш свој плодни прозор — али никада не замењује медицински савет ако си забринута.',
    tipTitle: 'Добро је знати',
    tipText:
      'Комбиновање цервикалне слузи са базалном телесном температуром или тестовима овулације даје потпунију слику твог циклуса.',
    summaryPoints: [
      'Цервикална слуз мења текстуру током циклуса под дејством естрогена и прогестерона.',
      'Како се овулација приближава, постаје бистра, развлачива и еластична, налик сировом белансету.',
      'Свакодневно посматрање ове промене, заједно са другим знацима, помаже ти да прецизније одредиш свој плодни прозор.',
      'Препознавање сопственог обрасца захтева вежбу и неколико циклуса посматрања.',
    ],
    disclaimerText:
      'Информативни садржај. Овај чланак не замењује персонализовани медицински савет. При сумњи затражи савет од здравственог радника.',
    shareMessage: 'Посматрање цервикалне слузи — AWA',
  },
  hr: {
    badge: 'PLODNOST • CERVIKALNA SLUZ',
    title: 'Promatranje tvoje\ncervikalne sluzi',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Prirodan, besplatan signal za prepoznavanje plodnog prozora.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je cervikalna sluz?',
      'Kako se mijenja tijekom ciklusa',
      'Prepoznavanje plodne sluzi',
      'Kako je promatrati svaki dan',
      'Što može utjecati na tvoja opažanja',
      'Ograničenja ove metode',
      'Ključne poruke',
    ],
    section1Body:
      'To je prirodni sekret koji stvara vrat maternice. Cervikalna sluz mijenja teksturu tijekom ciklusa pod utjecajem estrogena i progesterona.',
    cycleEvolution: [
      {
        title: 'Nakon menstruacije',
        text: 'Malo sluzi, često osjećaj suhoće.',
      },
      {
        title: 'Prije ovulacije',
        text: 'Obilnija, mutna i ljepljiva.',
      },
      {
        title: 'Kako se ovulacija približava',
        text: 'Bistra, rastezljiva i elastična, slična sirovom bjelanjku.',
      },
      {
        title: 'Nakon ovulacije',
        text: 'Gušća, neprozirna ili znatno manje prisutna.',
      },
    ],
    section3Intro: 'Kako se ovulacija približava, postaje:',
    fertileSigns: [
      'Bistra ili prozirna',
      'Rastezljiva — razvlači se između dva prsta',
      'Elastična, slična sirovom bjelanjku',
      'Obilnija nego ostalim danima',
    ],
    infoTitle: 'Jednostavna navika, svaki dan',
    infoText:
      'Promatraj izgled i teksturu pomoću toaletnog papira ili čistih prstiju, otprilike u isto doba dana, i zabilježi što primjećuješ.',
    modifyingFactors: [
      'Nedavni spolni odnos',
      'Proizvodi za intimnu higijenu',
      'Hormonska kontracepcija ili određene terapije',
      'Infekcija ili lokalna neravnoteža',
    ],
    section6Body:
      'Svaka žena ima drugačiji profil, a prepoznavanje vlastitog zahtijeva vježbu kroz nekoliko ciklusa. Svakodnevno promatranje ove promjene, uz druge znakove, pomaže ti preciznije odrediti plodni prozor — ali nikad ne zamjenjuje liječnički savjet ako si zabrinuta.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Kombiniranjem cervikalne sluzi s bazalnom temperaturom ili testovima ovulacije dobiva se potpunija slika tvog ciklusa.',
    summaryPoints: [
      'Cervikalna sluz mijenja teksturu tijekom ciklusa pod utjecajem estrogena i progesterona.',
      'Kako se ovulacija približava, postaje bistra, rastezljiva i elastična, slična sirovom bjelanjku.',
      'Svakodnevno promatranje ove promjene, uz druge znakove, pomaže ti preciznije odrediti plodni prozor.',
      'Prepoznavanje vlastitog obrasca zahtijeva vježbu i nekoliko ciklusa promatranja.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice zatraži savjet zdravstvenog djelatnika.',
    shareMessage: 'Promatranje cervikalne sluzi — AWA',
  },
  bs: {
    badge: 'PLODNOST • CERVIKALNA SLUZ',
    title: 'Promatranje tvoje\ncervikalne sluzi',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Prirodan, besplatan signal za prepoznavanje plodnog prozora.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je cervikalna sluz?',
      'Kako se mijenja tokom ciklusa',
      'Prepoznavanje plodne sluzi',
      'Kako je promatrati svaki dan',
      'Što može utjecati na tvoja opažanja',
      'Ograničenja ove metode',
      'Ključne poruke',
    ],
    section1Body:
      'To je prirodni sekret koji stvara vrat maternice. Cervikalna sluz mijenja teksturu tokom ciklusa pod utjecajem estrogena i progesterona.',
    cycleEvolution: [
      {
        title: 'Nakon menstruacije',
        text: 'Malo sluzi, često osjećaj suhoće.',
      },
      {
        title: 'Prije ovulacije',
        text: 'Obilnija, mutna i ljepljiva.',
      },
      {
        title: 'Kako se ovulacija približava',
        text: 'Bistra, rastezljiva i elastična, slična sirovom bjelanjku.',
      },
      {
        title: 'Nakon ovulacije',
        text: 'Gušća, neprozirna ili znatno manje prisutna.',
      },
    ],
    section3Intro: 'Kako se ovulacija približava, postaje:',
    fertileSigns: [
      'Bistra ili prozirna',
      'Rastezljiva — razvlači se između dva prsta',
      'Elastična, slična sirovom bjelanjku',
      'Obilnija nego ostalim danima',
    ],
    infoTitle: 'Jednostavna navika, svaki dan',
    infoText:
      'Promatraj izgled i teksturu pomoću toaletnog papira ili čistih prstiju, otprilike u isto doba dana, i zabilježi što primjećuješ.',
    modifyingFactors: [
      'Nedavni spolni odnos',
      'Proizvodi za intimnu higijenu',
      'Hormonska kontracepcija ili određene terapije',
      'Infekcija ili lokalna neravnoteža',
    ],
    section6Body:
      'Svaka žena ima drugačiji profil, a prepoznavanje vlastitog zahtijeva vježbu kroz nekoliko ciklusa. Svakodnevno promatranje ove promjene, uz druge znakove, pomaže ti preciznije odrediti plodni prozor — ali nikad ne zamjenjuje ljekarski savjet ako si zabrinuta.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Kombiniranjem cervikalne sluzi s bazalnom temperaturom ili testovima ovulacije dobiva se potpunija slika tvog ciklusa.',
    summaryPoints: [
      'Cervikalna sluz mijenja teksturu tokom ciklusa pod utjecajem estrogena i progesterona.',
      'Kako se ovulacija približava, postaje bistra, rastezljiva i elastična, slična sirovom bjelanjku.',
      'Svakodnevno promatranje ove promjene, uz druge znakove, pomaže ti preciznije odrediti plodni prozor.',
      'Prepoznavanje vlastitog obrasca zahtijeva vježbu i nekoliko ciklusa promatranja.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice zatraži savjet zdravstvenog radnika.',
    shareMessage: 'Promatranje cervikalne sluzi — AWA',
  },
  sl: {
    badge: 'PLODNOST • MATERNIČNOVRATNA SLUZ',
    title: 'Opazovanje tvoje\nmaterničnovratne sluzi',
    metaDuration: '5 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro: 'Naraven, brezplačen signal za prepoznavanje plodnega obdobja.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj je materničnovratna sluz?',
      'Kako se spreminja skozi cikel',
      'Prepoznavanje plodne sluzi',
      'Kako jo opazovati vsak dan',
      'Kaj lahko vpliva na tvoja opažanja',
      'Omejitve te metode',
      'Ključna sporočila',
    ],
    section1Body:
      'To je naravni izloček, ki ga proizvaja maternični vrat. Materničnovratna sluz spreminja teksturo skozi cikel pod vplivom estrogena in progesterona.',
    cycleEvolution: [
      {
        title: 'Po menstruaciji',
        text: 'Malo sluzi, pogosto občutek suhosti.',
      },
      {
        title: 'Pred ovulacijo',
        text: 'Obilnejša, motna in lepljiva.',
      },
      {
        title: 'Ko se ovulacija bliža',
        text: 'Bistra, raztegljiva in elastična, podobna surovemu jajčnemu beljaku.',
      },
      {
        title: 'Po ovulaciji',
        text: 'Gostejša, neprosojna ali precej manj prisotna.',
      },
    ],
    section3Intro: 'Ko se ovulacija bliža, postane:',
    fertileSigns: [
      'Bistra ali prozorna',
      'Raztegljiva — razteguje se med dvema prstoma',
      'Elastična, podobna surovemu jajčnemu beljaku',
      'Obilnejša kot ob drugih dneh',
    ],
    infoTitle: 'Preprosta navada, vsak dan',
    infoText:
      'Opazuj videz in teksturo s pomočjo toaletnega papirja ali čistih prstov, približno ob istem času dneva, in zapiši, kaj opaziš.',
    modifyingFactors: [
      'Nedavni spolni odnos',
      'Izdelki za intimno higieno',
      'Hormonska kontracepcija ali določena zdravljenja',
      'Okužba ali lokalno neravnovesje',
    ],
    section6Body:
      'Vsaka ženska ima drugačen profil, prepoznavanje lastnega pa zahteva vajo skozi več ciklov. Vsakodnevno opazovanje te spremembe skupaj z drugimi znaki ti pomaga natančneje določiti plodno obdobje — a nikoli ne nadomešča zdravniškega nasveta, če si zaskrbljena.',
    tipTitle: 'Vredno vedeti',
    tipText:
      'S kombinacijo materničnovratne sluzi z bazalno temperaturo ali testi ovulacije dobiš popolnejšo sliko svojega cikla.',
    summaryPoints: [
      'Materničnovratna sluz spreminja teksturo skozi cikel pod vplivom estrogena in progesterona.',
      'Ko se ovulacija bliža, postane bistra, raztegljiva in elastična, podobna surovemu jajčnemu beljaku.',
      'Vsakodnevno opazovanje te spremembe skupaj z drugimi znaki ti pomaga natančneje določiti plodno obdobje.',
      'Prepoznavanje lastnega vzorca zahteva vajo in več ciklov opazovanja.',
    ],
    disclaimerText:
      'Informativna vsebina. Ta članek ne nadomešča osebnega zdravniškega nasveta. V primeru dvoma poišči nasvet zdravstvenega delavca.',
    shareMessage: 'Opazovanje materničnovratne sluzi — AWA',
  },
  ne: {
    badge: 'उर्वरता • गर्भाशयको मुखको तरल पदार्थ',
    title: 'आफ्नो गर्भाशयको मुखको\nतरल पदार्थ अवलोकन',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'आफ्नो उर्वर अवधि चिन्ने प्राकृतिक, निःशुल्क संकेत।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'गर्भाशयको मुखको तरल पदार्थ के हो?',
      'चक्रभरि यो कसरी बदलिन्छ',
      'उर्वर तरल पदार्थ चिन्ने',
      'दैनिक यसलाई कसरी अवलोकन गर्ने',
      'तपाईंका अवलोकनलाई के ले असर गर्न सक्छ',
      'यो विधिका सीमाहरू',
      'मुख्य कुराहरू',
    ],
    section1Body:
      'यो गर्भाशयको मुखले उत्पादन गर्ने प्राकृतिक स्राव हो। एस्ट्रोजेन र प्रोजेस्टेरोनको प्रभावमा चक्रभरि गर्भाशयको मुखको तरल पदार्थको बनावट बदलिन्छ।',
    cycleEvolution: [
      {
        title: 'महिनावारीपछि',
        text: 'थोरै तरल पदार्थ, प्रायः सुक्खापनको अनुभूति।',
      },
      {
        title: 'अण्डोत्सर्गअघि',
        text: 'बढी मात्रामा, धमिलो र चिप्लो-टाँसिने।',
      },
      {
        title: 'अण्डोत्सर्ग नजिकिँदा',
        text: 'स्पष्ट, तानिने र लचिलो, काँचो अण्डाको सेतोजस्तो।',
      },
      {
        title: 'अण्डोत्सर्गपछि',
        text: 'बाक्लो, अपारदर्शी, वा निकै कम उपस्थित।',
      },
    ],
    section3Intro: 'अण्डोत्सर्ग नजिकिँदा यो यस्तो हुन्छ:',
    fertileSigns: [
      'स्पष्ट वा पारदर्शी',
      'तानिने — दुई औँलाबीच तानिन्छ',
      'लचिलो, काँचो अण्डाको सेतोजस्तो',
      'अन्य दिनहरूभन्दा बढी मात्रामा',
    ],
    infoTitle: 'एउटा सरल बानी, हरेक दिन',
    infoText:
      'दिनको लगभग एउटै समयमा, शौचालयको कागज वा सफा औँलाहरू प्रयोग गरी रूप र बनावट अवलोकन गर्नुहोस्, र जे देख्नुहुन्छ त्यो टिप्नुहोस्।',
    modifyingFactors: [
      'हालैको सम्भोग',
      'निजी सरसफाइका उत्पादनहरू',
      'हर्मोनल गर्भनिरोधन वा केही उपचार',
      'सङ्क्रमण वा स्थानीय असन्तुलन',
    ],
    section6Body:
      'हरेकको प्रोफाइल फरक हुन्छ, र आफ्नै पहिचान गर्न धेरै चक्रसम्म अभ्यास चाहिन्छ। अन्य संकेतहरूसँगै हरेक दिन यो परिवर्तन अवलोकन गर्दा तपाईंको उर्वर अवधि राम्ररी पहिचान गर्न मद्दत गर्छ — तर चिन्ता लागेमा यसले चिकित्सकीय सल्लाहको स्थान कहिल्यै लिँदैन।',
    tipTitle: 'जान्न लायक',
    tipText:
      'गर्भाशयको मुखको तरल पदार्थलाई आधारभूत शारीरिक तापक्रम वा अण्डोत्सर्ग परीक्षणसँग जोड्दा तपाईंको चक्रको अझ पूर्ण चित्र पाइन्छ।',
    summaryPoints: [
      'एस्ट्रोजेन र प्रोजेस्टेरोनको प्रभावमा चक्रभरि गर्भाशयको मुखको तरल पदार्थको बनावट बदलिन्छ।',
      'अण्डोत्सर्ग नजिकिँदा यो स्पष्ट, तानिने र लचिलो, काँचो अण्डाको सेतोजस्तो हुन्छ।',
      'अन्य संकेतहरूसँगै हरेक दिन यो परिवर्तन अवलोकन गर्दा तपाईंको उर्वर अवधि राम्ररी पहिचान गर्न मद्दत गर्छ।',
      'आफ्नै ढाँचा चिन्न अभ्यास र धेरै चक्रको अवलोकन चाहिन्छ।',
    ],
    disclaimerText:
      'जानकारीमूलक सामग्री। यो लेखले व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन। शङ्का भए स्वास्थ्यकर्मीसँग मार्गदर्शन लिनुहोस्।',
    shareMessage: 'आफ्नो गर्भाशयको मुखको तरल पदार्थ अवलोकन — AWA',
  },
  si: {
    badge: 'සාරවත් බව • ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල',
    title: 'ඔබේ ගර්භාෂ ග්‍රීවා\nශ්ලේෂ්මල නිරීක්ෂණය කිරීම',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ සාරවත් කාලය හඳුනාගැනීමට නොමිලේ, ස්වාභාවික සංඥාවක්.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල යනු කුමක්ද?',
      'චක්‍රය පුරා එය වෙනස් වන ආකාරය',
      'සාරවත් ශ්ලේෂ්මල හඳුනාගැනීම',
      'එය දිනපතා නිරීක්ෂණය කරන්නේ කෙසේද',
      'ඔබේ නිරීක්ෂණවලට බලපෑ හැකි දේ',
      'මෙම ක්‍රමයේ සීමාවන්',
      'ප්‍රධාන කරුණු',
    ],
    section1Body:
      'එය ගර්භාෂ ග්‍රීවාව විසින් නිපදවන ස්වාභාවික ස්‍රාවයකි. එස්ට්‍රජන් සහ ප්‍රොජෙස්ටරෝන්වල බලපෑම යටතේ ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මලයේ සැකැස්ම චක්‍රය පුරා වෙනස් වේ.',
    cycleEvolution: [
      {
        title: 'ඔබේ ඔසප්වලින් පසු',
        text: 'ශ්ලේෂ්මල අඩුයි, බොහෝ විට වියළි බවක් දැනේ.',
      },
      {
        title: 'ඩිම්බ මෝචනයට පෙර',
        text: 'වැඩියෙන් ඇති, බොර සහ ඇලෙන සුළුයි.',
      },
      {
        title: 'ඩිම්බ මෝචනය ළං වන විට',
        text: 'පැහැදිලි, දිගු විය හැකි සහ ප්‍රත්‍යාස්ථයි, අමු බිත්තර සුදු මදය වැනි.',
      },
      {
        title: 'ඩිම්බ මෝචනයෙන් පසු',
        text: 'ඝන, අපාරදෘශ්‍ය, හෝ බොහෝ සේ අඩුවෙන් ඇත.',
      },
    ],
    section3Intro: 'ඩිම්බ මෝචනය ළං වන විට, එය මෙසේ වේ:',
    fertileSigns: [
      'පැහැදිලි හෝ පාරදෘශ්‍ය',
      'දිගු විය හැකි — ඇඟිලි දෙකක් අතර දිගු වේ',
      'ප්‍රත්‍යාස්ථ, අමු බිත්තර සුදු මදය වැනි',
      'අනෙක් දිනවලට වඩා වැඩියෙන්',
    ],
    infoTitle: 'සරල පුරුද්දක්, සෑම දිනකම',
    infoText:
      'දවසේ ආසන්න වශයෙන් එකම වේලාවේ, වැසිකිළි කඩදාසි හෝ පිරිසිදු ඇඟිලි භාවිතයෙන් පෙනුම සහ සැකැස්ම නිරීක්ෂණය කර, ඔබ දකින දේ සටහන් කරන්න.',
    modifyingFactors: [
      'මෑතකදී සංසර්ගය',
      'සමීප සනීපාරක්ෂක නිෂ්පාදන',
      'හෝමෝන ගර්භනිරෝධනය හෝ සමහර ප්‍රතිකාර',
      'ආසාදනයක් හෝ ස්ථානීය අසමතුලිතතාවක්',
    ],
    section6Body:
      'සෑම කෙනෙකුටම වෙනස් පැතිකඩක් ඇති අතර, ඔබේම එක හඳුනාගැනීමට චක්‍ර කිහිපයක පුරුද්දක් අවශ්‍යයි. අනෙක් සලකුණු සමඟ සම්බන්ධව, මෙම වෙනස සෑම දිනකම නිරීක්ෂණය කිරීම ඔබේ සාරවත් කාලය වඩා හොඳින් හඳුනාගැනීමට උපකාරී වේ — නමුත් ඔබ කනස්සල්ලට පත්වන්නේ නම් එය කිසිවිටෙකත් වෛද්‍ය උපදෙස් වෙනුවට නොපවතී.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText:
      'ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල ඔබේ මූලික ශරීර උෂ්ණත්වය හෝ ඩිම්බ මෝචන පරීක්ෂණ සමඟ ඒකාබද්ධ කිරීම ඔබේ චක්‍රයේ වඩා සම්පූර්ණ චිත්‍රයක් ලබා දෙයි.',
    summaryPoints: [
      'එස්ට්‍රජන් සහ ප්‍රොජෙස්ටරෝන්වල බලපෑම යටතේ ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මලයේ සැකැස්ම චක්‍රය පුරා වෙනස් වේ.',
      'ඩිම්බ මෝචනය ළං වන විට, එය පැහැදිලි, දිගු විය හැකි සහ ප්‍රත්‍යාස්ථ, අමු බිත්තර සුදු මදය වැනි වේ.',
      'අනෙක් සලකුණු සමඟ සම්බන්ධව, මෙම වෙනස සෑම දිනකම නිරීක්ෂණය කිරීම ඔබේ සාරවත් කාලය වඩා හොඳින් හඳුනාගැනීමට උපකාරී වේ.',
      'ඔබේම රටාව හඳුනාගැනීමට පුරුද්දක් සහ නිරීක්ෂණ චක්‍ර කිහිපයක් අවශ්‍යයි.',
    ],
    disclaimerText:
      'තොරතුරු අන්තර්ගතයකි. මෙම ලිපිය පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී. සැකයක් ඇත්නම්, මඟපෙන්වීමක් සඳහා සෞඛ්‍ය වෘත්තිකයෙකුගෙන් විමසන්න.',
    shareMessage: 'ඔබේ ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල නිරීක්ෂණය කිරීම — AWA',
  },
  th: {
    badge: 'ภาวะเจริญพันธุ์ • เมือกปากมดลูก',
    title: 'การสังเกต\nเมือกปากมดลูก',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'สัญญาณธรรมชาติที่ไม่เสียค่าใช้จ่ายสำหรับสังเกตช่วงเจริญพันธุ์ของคุณ',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'เมือกปากมดลูกคืออะไร?',
      'เปลี่ยนแปลงอย่างไรตลอดรอบเดือน',
      'การสังเกตเมือกช่วงเจริญพันธุ์',
      'วิธีสังเกตทุกวัน',
      'สิ่งที่มีผลต่อการสังเกตของคุณ',
      'ข้อจำกัดของวิธีนี้',
      'ประเด็นสำคัญ',
    ],
    section1Body:
      'เป็นสารคัดหลั่งตามธรรมชาติที่ผลิตจากปากมดลูก เมือกปากมดลูกเปลี่ยนลักษณะตลอดรอบเดือนตามผลของเอสโตรเจนและโปรเจสเตอโรน',
    cycleEvolution: [
      {
        title: 'หลังประจำเดือน',
        text: 'มีเมือกน้อย มักรู้สึกแห้ง',
      },
      {
        title: 'ก่อนการตกไข่',
        text: 'มากขึ้น ขุ่น และเหนียว',
      },
      {
        title: 'เมื่อใกล้ตกไข่',
        text: 'ใส ยืดได้ และยืดหยุ่น คล้ายไข่ขาวดิบ',
      },
      {
        title: 'หลังการตกไข่',
        text: 'ข้นขึ้น ทึบ หรือมีน้อยลงมาก',
      },
    ],
    section3Intro: 'เมื่อใกล้ตกไข่ เมือกจะ:',
    fertileSigns: [
      'ใสหรือโปร่งแสง',
      'ยืดได้ — ยืดระหว่างนิ้วสองนิ้ว',
      'ยืดหยุ่น คล้ายไข่ขาวดิบ',
      'มากกว่าในวันอื่น ๆ',
    ],
    infoTitle: 'นิสัยง่าย ๆ ทุกวัน',
    infoText:
      'สังเกตลักษณะและเนื้อสัมผัสด้วยกระดาษชำระหรือนิ้วที่สะอาด ในเวลาใกล้เคียงกันของวัน และจดสิ่งที่คุณสังเกตเห็น',
    modifyingFactors: [
      'การมีเพศสัมพันธ์ที่เพิ่งผ่านมา',
      'ผลิตภัณฑ์ทำความสะอาดจุดซ่อนเร้น',
      'การคุมกำเนิดด้วยฮอร์โมนหรือการรักษาบางอย่าง',
      'การติดเชื้อหรือความไม่สมดุลเฉพาะที่',
    ],
    section6Body:
      'แต่ละคนมีลักษณะต่างกัน และการเรียนรู้ลักษณะของตัวเองต้องฝึกหลายรอบเดือน การสังเกตการเปลี่ยนแปลงนี้ทุกวันร่วมกับสัญญาณอื่น ช่วยให้ระบุช่วงเจริญพันธุ์ของคุณได้แม่นยำขึ้น — แต่ไม่เคยแทนที่คำแนะนำทางการแพทย์หากคุณกังวล',
    tipTitle: 'ควรรู้',
    tipText:
      'การใช้เมือกปากมดลูกร่วมกับอุณหภูมิร่างกายขณะพักหรือการตรวจการตกไข่ ให้ภาพรวมของรอบเดือนที่สมบูรณ์ยิ่งขึ้น',
    summaryPoints: [
      'เมือกปากมดลูกเปลี่ยนลักษณะตลอดรอบเดือนตามผลของเอสโตรเจนและโปรเจสเตอโรน',
      'เมื่อใกล้ตกไข่ เมือกจะใส ยืดได้ และยืดหยุ่น คล้ายไข่ขาวดิบ',
      'การสังเกตการเปลี่ยนแปลงนี้ทุกวันร่วมกับสัญญาณอื่น ช่วยให้ระบุช่วงเจริญพันธุ์ของคุณได้แม่นยำขึ้น',
      'การเรียนรู้รูปแบบของตัวเองต้องฝึกและสังเกตหลายรอบเดือน',
    ],
    disclaimerText:
      'เนื้อหาเพื่อให้ข้อมูล บทความนี้ไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล หากมีข้อสงสัย โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
    shareMessage: 'การสังเกตเมือกปากมดลูก — AWA',
  },
  vi: {
    badge: 'KHẢ NĂNG THỤ THAI • DỊCH NHẦY CỔ TỬ CUNG',
    title: 'Quan sát\ndịch nhầy cổ tử cung của bạn',
    metaDuration: '5 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Một tín hiệu tự nhiên, miễn phí để nhận biết giai đoạn dễ thụ thai của bạn.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Dịch nhầy cổ tử cung là gì?',
      'Nó thay đổi thế nào trong suốt chu kỳ',
      'Nhận biết dịch nhầy dễ thụ thai',
      'Cách quan sát hằng ngày',
      'Điều gì có thể ảnh hưởng đến quan sát của bạn',
      'Những hạn chế của phương pháp này',
      'Những điểm chính cần nhớ',
    ],
    section1Body:
      'Đây là dịch tiết tự nhiên do cổ tử cung tạo ra. Dịch nhầy cổ tử cung thay đổi kết cấu trong suốt chu kỳ dưới tác dụng của estrogen và progesterone.',
    cycleEvolution: [
      {
        title: 'Sau kỳ kinh',
        text: 'Ít dịch nhầy, thường có cảm giác khô.',
      },
      {
        title: 'Trước khi rụng trứng',
        text: 'Nhiều hơn, đục và dính.',
      },
      {
        title: 'Khi sắp rụng trứng',
        text: 'Trong, kéo sợi và đàn hồi, giống lòng trắng trứng sống.',
      },
      {
        title: 'Sau khi rụng trứng',
        text: 'Đặc hơn, đục hoặc ít hơn nhiều.',
      },
    ],
    section3Intro: 'Khi sắp rụng trứng, dịch nhầy trở nên:',
    fertileSigns: [
      'Trong hoặc trong suốt',
      'Kéo sợi — có thể kéo giãn giữa hai ngón tay',
      'Đàn hồi, giống lòng trắng trứng sống',
      'Nhiều hơn so với những ngày khác',
    ],
    infoTitle: 'Một thói quen đơn giản, mỗi ngày',
    infoText:
      'Hãy quan sát hình dạng và kết cấu bằng giấy vệ sinh hoặc ngón tay sạch, vào khoảng cùng một giờ trong ngày, và ghi lại những gì bạn nhận thấy.',
    modifyingFactors: [
      'Mới quan hệ tình dục',
      'Sản phẩm vệ sinh vùng kín',
      'Biện pháp tránh thai nội tiết hoặc một số loại thuốc điều trị',
      'Nhiễm trùng hoặc mất cân bằng tại chỗ',
    ],
    section6Body:
      'Mỗi người có một đặc điểm khác nhau và việc nhận ra đặc điểm của riêng bạn cần luyện tập qua nhiều chu kỳ. Quan sát sự thay đổi này mỗi ngày, cùng với các dấu hiệu khác, giúp bạn xác định giai đoạn dễ thụ thai chính xác hơn — nhưng nó không bao giờ thay thế lời khuyên y khoa nếu bạn lo lắng.',
    tipTitle: 'Nên biết',
    tipText:
      'Kết hợp dịch nhầy cổ tử cung với thân nhiệt cơ bản hoặc que thử rụng trứng sẽ cho bức tranh đầy đủ hơn về chu kỳ của bạn.',
    summaryPoints: [
      'Dịch nhầy cổ tử cung thay đổi kết cấu trong suốt chu kỳ dưới tác dụng của estrogen và progesterone.',
      'Khi sắp rụng trứng, nó trở nên trong, kéo sợi và đàn hồi, giống lòng trắng trứng sống.',
      'Quan sát sự thay đổi này mỗi ngày, cùng với các dấu hiệu khác, giúp bạn xác định giai đoạn dễ thụ thai chính xác hơn.',
      'Nhận ra quy luật của riêng bạn cần luyện tập và quan sát qua nhiều chu kỳ.',
    ],
    disclaimerText:
      'Nội dung mang tính thông tin. Bài viết này không thay thế lời khuyên y khoa cá nhân hóa. Nếu có nghi ngờ, hãy hỏi nhân viên y tế để được hướng dẫn.',
    shareMessage: 'Quan sát dịch nhầy cổ tử cung — AWA',
  },
  uz: {
    badge: 'UNUMDORLIK • BACHADON BOʻYNI SHILLIGI',
    title: 'Bachadon boʻyni shilligini\nkuzatish',
    metaDuration: '5 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Unumdorlik davrini aniqlash uchun tabiiy, bepul signal.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Bachadon boʻyni shilligi nima?',
      'U sikl davomida qanday oʻzgaradi',
      'Unumdor shilliqni tanish',
      'Uni har kuni qanday kuzatish kerak',
      'Kuzatuvlaringizga nima taʼsir qilishi mumkin',
      'Bu usulning cheklovlari',
      'Asosiy xulosalar',
    ],
    section1Body:
      'Bu bachadon boʻyni ishlab chiqaradigan tabiiy sekretsiya. Bachadon boʻyni shilligi sikl davomida estrogen va progesteron taʼsirida quyuqligini oʻzgartiradi.',
    cycleEvolution: [
      {
        title: 'Hayzdan keyin',
        text: 'Shilliq kam, koʻpincha quruqlik hissi.',
      },
      {
        title: 'Ovulyatsiyadan oldin',
        text: 'Koʻproq, xira va yopishqoq.',
      },
      {
        title: 'Ovulyatsiya yaqinlashganda',
        text: 'Shaffof, choʻziluvchan va elastik, xom tuxum oqiga oʻxshash.',
      },
      {
        title: 'Ovulyatsiyadan keyin',
        text: 'Quyuqroq, xira yoki ancha kam.',
      },
    ],
    section3Intro: 'Ovulyatsiya yaqinlashganda u quyidagicha boʻladi:',
    fertileSigns: [
      'Shaffof yoki tiniq',
      'Choʻziluvchan — ikki barmoq orasida choʻziladi',
      'Elastik, xom tuxum oqiga oʻxshash',
      'Boshqa kunlarga qaraganda koʻproq',
    ],
    infoTitle: 'Oddiy odat, har kuni',
    infoText:
      'Koʻrinishi va quyuqligini hojatxona qogʻozi yoki toza barmoqlar bilan, kunning taxminan bir xil vaqtida kuzating va sezganingizni yozib qoʻying.',
    modifyingFactors: [
      'Yaqinda boʻlgan jinsiy aloqa',
      'Intim gigiyena vositalari',
      'Gormonal kontratseptsiya yoki baʼzi davolanishlar',
      'Infeksiya yoki mahalliy muvozanat buzilishi',
    ],
    section6Body:
      'Har kimning profili boshqacha va oʻzinikini tanish bir necha sikl davomida mashq qilishni talab qiladi. Bu oʻzgarishni boshqa belgilar bilan birga har kuni kuzatish unumdorlik davringizni aniqroq belgilashga yordam beradi — lekin xavotir boʻlsa, tibbiy maslahat oʻrnini hech qachon bosmaydi.',
    tipTitle: 'Bilish foydali',
    tipText:
      'Bachadon boʻyni shilligini bazal tana harorati yoki ovulyatsiya testlari bilan birlashtirish siklingiz haqida toʻliqroq tasavvur beradi.',
    summaryPoints: [
      'Bachadon boʻyni shilligi sikl davomida estrogen va progesteron taʼsirida quyuqligini oʻzgartiradi.',
      'Ovulyatsiya yaqinlashganda u shaffof, choʻziluvchan va elastik, xom tuxum oqiga oʻxshash boʻladi.',
      'Bu oʻzgarishni boshqa belgilar bilan birga har kuni kuzatish unumdorlik davringizni aniqroq belgilashga yordam beradi.',
      'Oʻz qonuniyatingizni tanish mashq va bir necha sikl kuzatuvini talab qiladi.',
    ],
    disclaimerText:
      'Maʼlumot uchun kontent. Bu maqola shaxsiy tibbiy maslahatni almashtirmaydi. Shubha boʻlsa, sogʻliqni saqlash mutaxassisidan yoʻl-yoʻriq soʻrang.',
    shareMessage: 'Bachadon boʻyni shilligini kuzatish — AWA',
  },
  az: {
    badge: 'MÜNBİTLİK • UŞAQLIQ BOYNU MUKUSU',
    title: 'Uşaqlıq boynu mukusunu\nmüşahidə etmək',
    metaDuration: '5 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Münbit dövrünüzü müəyyən etmək üçün təbii, pulsuz siqnal.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Uşaqlıq boynu mukusu nədir?',
      'O, dövr boyu necə dəyişir',
      'Münbit mukusu tanımaq',
      'Onu hər gün necə müşahidə etmək olar',
      'Müşahidələrinizə nə təsir edə bilər',
      'Bu üsulun məhdudiyyətləri',
      'Əsas nəticələr',
    ],
    section1Body:
      'Bu, uşaqlıq boynu tərəfindən istehsal olunan təbii ifrazatdır. Uşaqlıq boynu mukusunun teksturası östrogen və progesteronun təsiri ilə dövr boyu dəyişir.',
    cycleEvolution: [
      {
        title: 'Aybaşınızdan sonra',
        text: 'Az mukus, çox vaxt quruluq hissi.',
      },
      {
        title: 'Ovulyasiyadan əvvəl',
        text: 'Daha bol, bulanıq və yapışqan.',
      },
      {
        title: 'Ovulyasiya yaxınlaşanda',
        text: 'Şəffaf, dartılan və elastik, çiy yumurta ağına bənzər.',
      },
      {
        title: 'Ovulyasiyadan sonra',
        text: 'Daha qatı, qeyri-şəffaf və ya xeyli az.',
      },
    ],
    section3Intro: 'Ovulyasiya yaxınlaşdıqca o, belə olur:',
    fertileSigns: [
      'Şəffaf və ya aydın',
      'Dartılan — iki barmaq arasında uzanır',
      'Elastik, çiy yumurta ağına bənzər',
      'Digər günlərdən daha bol',
    ],
    infoTitle: 'Hər gün sadə vərdiş',
    infoText:
      'Görünüşünü və teksturasını tualet kağızı və ya təmiz barmaqlarla, günün təxminən eyni vaxtında müşahidə edin və gördüklərinizi qeyd edin.',
    modifyingFactors: [
      'Yaxınlarda cinsi əlaqə',
      'İntim gigiyena vasitələri',
      'Hormonal kontrasepsiya və ya bəzi müalicələr',
      'İnfeksiya və ya yerli disbalans',
    ],
    section6Body:
      'Hər kəsin profili fərqlidir və öz profilinizi tanımaq bir neçə dövr ərzində təcrübə tələb edir. Bu dəyişikliyi digər əlamətlərlə birlikdə hər gün müşahidə etmək münbit dövrünüzü daha dəqiq müəyyən etməyə kömək edir — lakin narahatlığınız varsa, o heç vaxt tibbi məsləhəti əvəz etmir.',
    tipTitle: 'Bilmək faydalıdır',
    tipText:
      'Uşaqlıq boynu mukusunu bazal bədən temperaturu və ya ovulyasiya testləri ilə birləşdirmək dövrünüz haqqında daha tam təsəvvür verir.',
    summaryPoints: [
      'Uşaqlıq boynu mukusunun teksturası östrogen və progesteronun təsiri ilə dövr boyu dəyişir.',
      'Ovulyasiya yaxınlaşdıqca o, şəffaf, dartılan və çiy yumurta ağına bənzər elastik olur.',
      'Bu dəyişikliyi digər əlamətlərlə birlikdə hər gün müşahidə etmək münbit dövrünüzü daha dəqiq müəyyən etməyə kömək edir.',
      'Öz qanunauyğunluğunuzu tanımaq təcrübə və bir neçə dövrlük müşahidə tələb edir.',
    ],
    disclaimerText:
      'Məlumat xarakterli məzmun. Bu məqalə fərdi tibbi məsləhəti əvəz etmir. Şübhə olarsa, tibb işçisindən məsləhət alın.',
    shareMessage: 'Uşaqlıq boynu mukusunu müşahidə etmək — AWA',
  },
  ka: {
    badge: 'ფერტილობა • საშვილოსნოს ყელის ლორწო',
    title: 'თქვენი საშვილოსნოს ყელის\nლორწოზე დაკვირვება',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ბუნებრივი, უფასო სიგნალი თქვენი ფერტილური ფანჯრის დასადგენად.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის საშვილოსნოს ყელის ლორწო?',
      'როგორ იცვლება ის ციკლის განმავლობაში',
      'ფერტილური ლორწოს ამოცნობა',
      'როგორ დავაკვირდეთ მას ყოველდღიურად',
      'რამ შეიძლება დაკვირვებებზე იმოქმედოს',
      'ამ მეთოდის შეზღუდვები',
      'მთავარი დასკვნები',
    ],
    section1Body:
      'ეს საშვილოსნოს ყელის მიერ გამომუშავებული ბუნებრივი სეკრეტია. საშვილოსნოს ყელის ლორწოს ტექსტურა ციკლის განმავლობაში ესტროგენისა და პროგესტერონის ზემოქმედებით იცვლება.',
    cycleEvolution: [
      {
        title: 'მენსტრუაციის შემდეგ',
        text: 'ცოტა ლორწო, ხშირად სიმშრალის შეგრძნება.',
      },
      {
        title: 'ოვულაციამდე',
        text: 'უფრო მეტი, მოღრუბლული და წებოვანი.',
      },
      {
        title: 'ოვულაციის მოახლოებისას',
        text: 'გამჭვირვალე, გაჭიმვადი და ელასტიური, უმი კვერცხის ცილის მსგავსი.',
      },
      {
        title: 'ოვულაციის შემდეგ',
        text: 'უფრო სქელი, გაუმჭვირვალე ან ბევრად ნაკლები.',
      },
    ],
    section3Intro: 'ოვულაციის მოახლოებისას ის ხდება:',
    fertileSigns: [
      'ნათელი ან გამჭვირვალე',
      'გაჭიმვადი — ორ თითს შორის იჭიმება',
      'ელასტიური, უმი კვერცხის ცილის მსგავსი',
      'სხვა დღეებზე უფრო მეტი',
    ],
    infoTitle: 'მარტივი ჩვევა, ყოველდღე',
    infoText:
      'დააკვირდით გარეგნობას და ტექსტურას ტუალეტის ქაღალდით ან სუფთა თითებით, დღის დაახლოებით ერთსა და იმავე დროს და ჩაიწერეთ, რასაც შეამჩნევთ.',
    modifyingFactors: [
      'ახლახან სქესობრივი კავშირი',
      'ინტიმური ჰიგიენის საშუალებები',
      'ჰორმონული კონტრაცეფცია ან ზოგიერთი მკურნალობა',
      'ინფექცია ან ადგილობრივი დისბალანსი',
    ],
    section6Body:
      'ყველას განსხვავებული პროფილი აქვს და საკუთარის ამოცნობა რამდენიმე ციკლის განმავლობაში პრაქტიკას მოითხოვს. ამ ცვლილებაზე ყოველდღიური დაკვირვება სხვა ნიშნებთან ერთად გეხმარებათ ფერტილური ფანჯრის უფრო ზუსტად დადგენაში — მაგრამ თუ შეშფოთებული ხართ, ის არასდროს ანაცვლებს სამედიცინო რჩევას.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText:
      'საშვილოსნოს ყელის ლორწოს შერწყმა ბაზალურ ტემპერატურასთან ან ოვულაციის ტესტებთან თქვენი ციკლის უფრო სრულ სურათს გვაძლევს.',
    summaryPoints: [
      'საშვილოსნოს ყელის ლორწოს ტექსტურა ციკლის განმავლობაში ესტროგენისა და პროგესტერონის ზემოქმედებით იცვლება.',
      'ოვულაციის მოახლოებისას ის ხდება გამჭვირვალე, გაჭიმვადი და ელასტიური, უმი კვერცხის ცილის მსგავსი.',
      'ამ ცვლილებაზე ყოველდღიური დაკვირვება სხვა ნიშნებთან ერთად გეხმარებათ ფერტილური ფანჯრის უფრო ზუსტად დადგენაში.',
      'საკუთარი სურათის ამოცნობა პრაქტიკას და რამდენიმე ციკლის დაკვირვებას მოითხოვს.',
    ],
    disclaimerText:
      'საინფორმაციო შინაარსი. ეს სტატია პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს. ეჭვის შემთხვევაში მიმართეთ ჯანდაცვის სპეციალისტს.',
    shareMessage: 'საშვილოსნოს ყელის ლორწოზე დაკვირვება — AWA',
  },
  hy: {
    badge: 'ՊՏՂԱԲԵՐՈՒԹՅՈՒՆ • ԱՐԳԱՆԴԻ ՎԶԻԿԻ ԼՈՐՁ',
    title: 'Արգանդի վզիկի\nլորձի դիտարկում',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Բնական, անվճար ազդանշան՝ ձեր պտղաբեր պատուհանը նկատելու համար:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է արգանդի վզիկի լորձը:',
      'Ինչպես է այն փոխվում ցիկլի ընթացքում',
      'Պտղաբեր լորձի ճանաչումը',
      'Ինչպես դիտարկել այն ամեն օր',
      'Ինչը կարող է ազդել ձեր դիտարկումների վրա',
      'Այս մեթոդի սահմանափակումները',
      'Հիմնական եզրակացություններ',
    ],
    section1Body:
      'Սա բնական սեկրեցիա է, որն արտադրվում է արգանդի վզիկի կողմից: Արգանդի վզիկի լորձը փոխում է իր խտությունը ցիկլի ընթացքում՝ էստրոգենի և պրոգեստերոնի ազդեցությամբ:',
    cycleEvolution: [
      {
        title: 'Դաշտանից հետո',
        text: 'Քիչ լորձ, հաճախ՝ չորության զգացում:',
      },
      {
        title: 'Ձվազատումից առաջ',
        text: 'Ավելի առատ, պղտոր և կպչուն:',
      },
      {
        title: 'Երբ ձվազատումը մոտենում է',
        text: 'Թափանցիկ, ձգվող և առաձգական, հում ձվի սպիտակուցի նման:',
      },
      {
        title: 'Ձվազատումից հետո',
        text: 'Ավելի թանձր, անթափանց կամ շատ ավելի քիչ առկա:',
      },
    ],
    section3Intro: 'Երբ ձվազատումը մոտենում է, այն դառնում է.',
    fertileSigns: [
      'Թափանցիկ կամ պարզ',
      'Ձգվող. այն ձգվում է երկու մատի արանքում',
      'Առաձգական, հում ձվի սպիտակուցի նման',
      'Ավելի առատ, քան մյուս օրերին',
    ],
    infoTitle: 'Պարզ սովորություն՝ ամեն օր',
    infoText:
      'Դիտարկեք տեսքը և խտությունը զուգարանի թղթով կամ մաքուր մատներով, օրվա մոտավորապես նույն ժամին, և գրանցեք նկատածը:',
    modifyingFactors: [
      'Վերջերս տեղի ունեցած սեռական հարաբերություն',
      'Ինտիմ հիգիենայի միջոցներ',
      'Հորմոնալ հակաբեղմնավորում կամ որոշ բուժումներ',
      'Վարակ կամ տեղային անհավասարակշռություն',
    ],
    section6Body:
      'Յուրաքանչյուր մարդ ունի տարբեր պրոֆիլ, և ձեր սեփականը ճանաչելը պահանջում է պրակտիկա մի քանի ցիկլերի ընթացքում: Այս փոփոխության ամենօրյա դիտարկումը, այլ նշանների հետ միասին, օգնում է ավելի ճշգրիտ որոշել ձեր պտղաբեր պատուհանը, սակայն երբեք չի փոխարինում բժշկական խորհրդատվությանը, եթե անհանգստանում եք:',
    tipTitle: 'Լավ է իմանալ',
    tipText:
      'Արգանդի վզիկի լորձը բազալ ջերմաստիճանի կամ ձվազատման թեստերի հետ համադրելը տալիս է ձեր ցիկլի ավելի ամբողջական պատկերը:',
    summaryPoints: [
      'Արգանդի վզիկի լորձը փոխում է իր խտությունը ցիկլի ընթացքում՝ էստրոգենի և պրոգեստերոնի ազդեցությամբ:',
      'Երբ ձվազատումը մոտենում է, այն դառնում է թափանցիկ, ձգվող և առաձգական, հում ձվի սպիտակուցի նման:',
      'Այս փոփոխության ամենօրյա դիտարկումը, այլ նշանների հետ միասին, օգնում է ավելի ճշգրիտ որոշել ձեր պտղաբեր պատուհանը:',
      'Ձեր սեփական օրինաչափությունը ճանաչելը պահանջում է պրակտիկա և դիտարկման մի քանի ցիկլ:',
    ],
    disclaimerText:
      'Տեղեկատվական բովանդակություն: Այս հոդվածը չի փոխարինում անհատականացված բժշկական խորհրդատվությանը: Կասկածի դեպքում դիմեք առողջապահության մասնագետի:',
    shareMessage: 'Արգանդի վզիկի լորձի դիտարկում — AWA',
  },
  tg: {
    badge: 'ҲОСИЛХЕЗӢ • ШИЛИМШИҚИ ГАРДАНИ БАЧАДОН',
    title: 'Мушоҳидаи шилимшиқи\nгардани бачадони худ',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Нишонаи табиӣ ва ройгон барои ёфтани равзанаи ҳосилхезии шумо.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Шилимшиқи гардани бачадон чист?',
      'Чӣ тавр он дар давоми давра тағйир меёбад',
      'Шинохтани шилимшиқи ҳосилхез',
      'Чӣ тавр ҳар рӯз мушоҳида кардан',
      'Чӣ метавонад ба мушоҳидаҳои шумо таъсир расонад',
      'Маҳдудиятҳои ин усул',
      'Хулосаҳои асосӣ',
    ],
    section1Body:
      'Ин тарашшуҳи табиист, ки гардани бачадон тавлид мекунад. Шилимшиқи гардани бачадон дар давоми давра зери таъсири эстроген ва прогестерон сохтори худро тағйир медиҳад.',
    cycleEvolution: [
      {
        title: 'Пас аз ҳайз',
        text: 'Шилимшиқи кам, аксар вақт эҳсоси хушкӣ.',
      },
      {
        title: 'Пеш аз овуляция',
        text: 'Бештар, тира ва часпак.',
      },
      {
        title: 'Ҳангоми наздик шудани овуляция',
        text: 'Шаффоф, кашиш ва чандир, ба сафедаи тухми хом монанд.',
      },
      {
        title: 'Пас аз овуляция',
        text: 'Ғализтар, ношаффоф ё хеле камтар.',
      },
    ],
    section3Intro: 'Ҳангоми наздик шудани овуляция он чунин мешавад:',
    fertileSigns: [
      'Шаффоф ё равшан',
      'Кашишшаванда — байни ду ангушт кашида мешавад',
      'Чандир, ба сафедаи тухми хом монанд',
      'Нисбат ба дигар рӯзҳо бештар',
    ],
    infoTitle: 'Одати оддӣ, ҳар рӯз',
    infoText:
      'Намуд ва сохтори онро бо коғази даст ё ангуштони тоза тақрибан дар як вақти рӯз мушоҳида кунед ва он чиро, ки диққат додед, қайд намоед.',
    modifyingFactors: [
      'Наздикии ба наздикӣ',
      'Воситаҳои гигиенаи наздикӣ',
      'Пешгирии гормонӣ ё баъзе табобатҳо',
      'Сироят ё номутавозунии маҳаллӣ',
    ],
    section6Body:
      'Профили ҳар кас гуногун аст ва шинохтани профили худ чанд давра машқро талаб мекунад. Ҳар рӯз мушоҳида кардани ин тағйирот дар баробари нишонаҳои дигар ба шумо кумак мекунад равзанаи ҳосилхезии худро дақиқтар муайян кунед — вале он ҳеҷ гоҳ маслиҳати тиббиро, агар нигарон бошед, иваз намекунад.',
    tipTitle: 'Донистан хуб аст',
    tipText:
      'Якҷоя кардани шилимшиқи гардани бачадон бо ҳарорати базалии бадан ё санҷишҳои овуляция тасвири пурратари давраи шуморо медиҳад.',
    summaryPoints: [
      'Шилимшиқи гардани бачадон дар давоми давра зери таъсири эстроген ва прогестерон сохтори худро тағйир медиҳад.',
      'Ҳангоми наздик шудани овуляция он шаффоф, кашишшаванда ва чандир, ба сафедаи тухми хом монанд мешавад.',
      'Ҳар рӯз мушоҳида кардани ин тағйирот дар баробари нишонаҳои дигар ба шумо кумак мекунад равзанаи ҳосилхезии худро беҳтар муайян кунед.',
      'Шинохтани намунаи худ машқ ва чанд давраи мушоҳидаро талаб мекунад.',
    ],
    disclaimerText:
      'Мазмуни иттилоотӣ. Ин мақола маслиҳати шахсии тиббиро иваз намекунад. Дар сурати шубҳа аз мутахассиси соҳаи тиб роҳнамоӣ пурсед.',
    shareMessage: 'Мушоҳидаи шилимшиқи гардани бачадон — AWA',
  },
  ky: {
    badge: 'БОЙГО БҮТҮҮ • ЖАТЫН МОЮНЧАСЫНЫН БЫЛЖЫРЫ',
    title: 'Жатын моюнчасынын\nбылжырын байкоо',
    metaDuration: '5 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Бойго бүтүү терезеңизди байкоо үчүн табигый, акысыз белги.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Жатын моюнчасынын былжыры деген эмне?',
      'Ал цикл бою кандай өзгөрөт',
      'Бойго бүтүүгө ыңгайлуу былжырды таануу',
      'Аны күн сайын кантип байкоо керек',
      'Байкоолоруңузга эмне таасир этиши мүмкүн',
      'Бул ыкманын чектөөлөрү',
      'Негизги жыйынтыктар',
    ],
    section1Body:
      'Бул жатын моюнчасы чыгарган табигый бөлүнмө. Жатын моюнчасынын былжыры эстроген менен прогестерондун таасири астында цикл бою текстурасын өзгөртөт.',
    cycleEvolution: [
      {
        title: 'Етек киримден кийин',
        text: 'Былжыр аз, көбүнчө кургактык сезими.',
      },
      {
        title: 'Овуляциядан мурун',
        text: 'Көбүрөөк, бүдөмүк жана жабышкак.',
      },
      {
        title: 'Овуляция жакындаганда',
        text: 'Тунук, созулуучу жана ийкемдүү, чийки жумуртканын агына окшош.',
      },
      {
        title: 'Овуляциядан кийин',
        text: 'Коюураак, тунук эмес же бир кыйла аз.',
      },
    ],
    section3Intro: 'Овуляция жакындаганда ал мындай болот:',
    fertileSigns: [
      'Тунук же тунуктугу бар',
      'Созулуучу — эки манжанын ортосунда созулат',
      'Ийкемдүү, чийки жумуртканын агына окшош',
      'Башка күндөргө караганда көбүрөөк',
    ],
    infoTitle: 'Жөнөкөй адат, күн сайын',
    infoText:
      'Көрүнүшүн жана текстурасын даараткана кагазы же таза манжалар менен, болжол менен күндүн бир эле убагында байкап, байкаганыңызды жазып коюңуз.',
    modifyingFactors: [
      'Жакында болгон жыныстык катнаш',
      'Жакын гигиена каражаттары',
      'Гормондук контрацепция же айрым дарылоолор',
      'Инфекция же жергиликтүү тең салмактуулуктун бузулушу',
    ],
    section6Body:
      'Ар бир адамдын профили ар башка жана өзүңүздүкүн таануу бир нече цикл бою көнүгүүнү талап кылат. Бул өзгөрүүнү башка белгилер менен бирге күн сайын байкоо бойго бүтүү терезеңизди так аныктоого жардам берет — бирок тынчсызданып жатсаңыз, ал эч качан медициналык кеңешти алмаштырбайт.',
    tipTitle: 'Билүү пайдалуу',
    tipText:
      'Жатын моюнчасынын былжырын базалдык дене температураңыз же овуляция тесттери менен айкалыштыруу циклиңиздин толугураак сүрөтүн берет.',
    summaryPoints: [
      'Жатын моюнчасынын былжыры эстроген менен прогестерондун таасири астында цикл бою текстурасын өзгөртөт.',
      'Овуляция жакындаганда ал тунук, созулуучу жана ийкемдүү, чийки жумуртканын агына окшош болот.',
      'Бул өзгөрүүнү башка белгилер менен бирге күн сайын байкоо бойго бүтүү терезеңизди так аныктоого жардам берет.',
      'Өз мыйзам ченемдүүлүгүңүздү таануу көнүгүүнү жана бир нече цикл бою байкоону талап кылат.',
    ],
    disclaimerText:
      'Маалымат берүүчү мазмун. Бул макала жекелештирилген медициналык кеңешти алмаштырбайт. Күмөн болсо, ден соолук сактоо адисинен кеңеш сураңыз.',
    shareMessage: 'Жатын моюнчасынын былжырын байкоо — AWA',
  },
  tk: {
    badge: 'GÖWRELI BOLMAK UKYBY • ÝATGY BOÝNUNYŇ ÝAŇSY',
    title: 'Ýatgy boýnunyň ýaňsyny\nsynlamak',
    metaDuration: '5 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro: 'Göwreli bolmaga ýeterlik döwrüňizi anyklamak üçin tebigy, mugt alamat.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Ýatgy boýnunyň ýaňsy näme?',
      'Sikl dowamynda nähili üýtgeýär',
      'Göwreli bolmaga ýeterlik ýaňsy tanamak',
      'Ony her gün nähili synlamaly',
      'Synlamalaryňyza näme täsir edip biler',
      'Bu usulyň çäkleri',
      'Esasy netijeler',
    ],
    section1Body:
      'Bu ýatgy boýnunyň öndürýän tebigy bölünip çykýan suwuklygy. Ýatgy boýnunyň ýaňsy estrogeniň we progesteronyň täsiri astynda sikl dowamynda konsistensiýasyny üýtgedýär.',
    cycleEvolution: [
      {
        title: 'Aýbaşydan soň',
        text: 'Az ýaňs, köplenç gurakçylyk duýgusy.',
      },
      {
        title: 'Ovulýasiýadan öň',
        text: 'Has köp, bulaşyk we ýelmeşýän.',
      },
      {
        title: 'Ovulýasiýa ýakynlaşanda',
        text: 'Arassa, çozulýan we çeýe, çig ýumurtganyň ak böleğine meňzeş.',
      },
      {
        title: 'Ovulýasiýadan soň',
        text: 'Galyňrak, ýagty geçirmeýän ýa-da has az bolýar.',
      },
    ],
    section3Intro: 'Ovulýasiýa ýakynlaşanda ol şeýle bolýar:',
    fertileSigns: [
      'Arassa ýa-da aýdyň',
      'Çozulýan — iki barmagyň arasynda uzalýar',
      'Çeýe, çig ýumurtganyň ak böleğine meňzeş',
      'Beýleki günlerdäkiden has köp',
    ],
    infoTitle: 'Her gün ýönekeý endik',
    infoText:
      'Görnüşini we konsistensiýasyny hajathana kagyzy ýa-da arassa barmaklar bilen, günüň takmynan şol bir wagtynda synlaň we bellän zatlaryňyzy ýazyp goýuň.',
    modifyingFactors: [
      'Ýaňy bolan jynsy gatnaşyk',
      'Ýakyn ýerleriň arassaçylyk önümleri',
      'Gormonal göwrelilikden goranyş ýa-da käbir bejergiler',
      'Ýokançlyk ýa-da ýerli deňagramlylygyň bozulmagy',
    ],
    section6Body:
      'Her kimiň profili dürli we öz profiliňizi tanamak birnäçe sikl dowamynda tejribe talap edýär. Bu üýtgeşmäni her gün beýleki alamatlar bilen bilelikde synlamak göwreli bolmaga ýeterlik döwrüňizi has takyk anyklamaga kömek edýär — ýöne alada galsaňyz, ol hiç haçan lukmançylyk maslahatyny çalyşmaýar.',
    tipTitle: 'Bilmek peýdaly',
    tipText:
      'Ýatgy boýnunyň ýaňsyny bazal beden temperaturasy ýa-da ovulýasiýa synaglary bilen utgaşdyrmak sikliňiziň has doly suratyny berýär.',
    summaryPoints: [
      'Ýatgy boýnunyň ýaňsy estrogeniň we progesteronyň täsiri astynda sikl dowamynda konsistensiýasyny üýtgedýär.',
      'Ovulýasiýa ýakynlaşanda ol arassa, çozulýan we çeýe, çig ýumurtganyň ak böleğine meňzeş bolýar.',
      'Bu üýtgeşmäni her gün beýleki alamatlar bilen bilelikde synlamak göwreli bolmaga ýeterlik döwrüňizi has takyk anyklamaga kömek edýär.',
      'Öz nusgaňyzy tanamak tejribe we birnäçe sikl dowamynda synlamagy talap edýär.',
    ],
    disclaimerText:
      'Maglumat berýän mazmun. Bu makala şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar. Şübhe bolsa, saglyk hünärmeninden maslahat soraň.',
    shareMessage: 'Ýatgy boýnunyň ýaňsyny synlamak — AWA',
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
