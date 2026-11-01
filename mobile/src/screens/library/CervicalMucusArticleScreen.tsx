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
  ms: {
    badge: 'KESUBURAN • LENDIR SERVIKS',
    title: 'Memerhati\nlendir serviks anda',
    metaDuration: '5 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Pertengahan',
    metaValidated: 'Kandungan disemak',
    intro: 'Isyarat semula jadi yang percuma untuk mengenali tempoh subur anda.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apakah lendir serviks?',
      'Bagaimana ia berubah sepanjang kitaran',
      'Mengenali lendir subur',
      'Bagaimana memerhatinya setiap hari',
      'Apa yang boleh menjejaskan pemerhatian anda',
      'Had kaedah ini',
      'Perkara penting untuk diingat',
    ],
    section1Body:
      'Ia ialah rembesan semula jadi yang dihasilkan oleh serviks. Lendir serviks berubah tekstur sepanjang kitaran di bawah pengaruh estrogen dan progesteron.',
    cycleEvolution: [
      {
        title: 'Selepas haid anda',
        text: 'Sedikit lendir, selalunya rasa kering.',
      },
      {
        title: 'Sebelum ovulasi',
        text: 'Lebih banyak, keruh dan melekit.',
      },
      {
        title: 'Apabila ovulasi menghampiri',
        text: 'Jernih, kenyal dan elastik, serupa dengan putih telur mentah.',
      },
      {
        title: 'Selepas ovulasi',
        text: 'Lebih pekat, legap atau jauh kurang kelihatan.',
      },
    ],
    section3Intro: 'Apabila ovulasi menghampiri, ia menjadi:',
    fertileSigns: [
      'Jernih atau lut sinar',
      'Kenyal — ia boleh ditarik di antara dua jari',
      'Elastik, serupa dengan putih telur mentah',
      'Lebih banyak berbanding hari-hari lain',
    ],
    infoTitle: 'Tabiat mudah, setiap hari',
    infoText:
      'Perhatikan rupa dan tekstur menggunakan kertas tandas atau jari yang bersih, pada waktu yang lebih kurang sama setiap hari, dan catat apa yang anda perasan.',
    modifyingFactors: [
      'Hubungan intim baru-baru ini',
      'Produk kebersihan intim',
      'Kontraseptif hormon atau rawatan tertentu',
      'Jangkitan atau ketidakseimbangan setempat',
    ],
    section6Body:
      'Setiap orang mempunyai profil yang berbeza, dan mengenali profil anda sendiri memerlukan latihan sepanjang beberapa kitaran. Memerhati perubahan ini setiap hari, bersama tanda lain, membantu anda menentukan tempoh subur anda dengan lebih tepat — tetapi ia tidak pernah menggantikan nasihat perubatan jika anda bimbang.',
    tipTitle: 'Elok diketahui',
    tipText:
      'Menggabungkan lendir serviks dengan suhu badan basal atau ujian ovulasi anda memberikan gambaran kitaran anda yang lebih lengkap.',
    summaryPoints: [
      'Lendir serviks berubah tekstur sepanjang kitaran di bawah pengaruh estrogen dan progesteron.',
      'Apabila ovulasi menghampiri, ia menjadi jernih, kenyal dan elastik, serupa dengan putih telur mentah.',
      'Memerhati perubahan ini setiap hari, bersama tanda lain, membantu anda menentukan tempoh subur anda dengan lebih tepat.',
      'Mengenali corak anda sendiri memerlukan latihan dan pemerhatian sepanjang beberapa kitaran.',
    ],
    disclaimerText:
      'Kandungan bersifat maklumat. Artikel ini tidak menggantikan nasihat perubatan yang diperibadikan. Jika ragu-ragu, mintalah panduan daripada pengamal penjagaan kesihatan.',
    shareMessage: 'Memerhati lendir serviks anda — AWA',
  },
  so: {
    badge: 'BACRIMIN • DHEECAANKA AFKA ILMO-GALEENKA',
    title: 'Indho-indheynta\ndheecaanka afka ilmo-galeenkaaga',
    metaDuration: '5 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Dhexdhexaad',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Calaamad dabiici ah oo bilaash ah oo lagu ogaado muddada bacriminta.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Waa maxay dheecaanka afka ilmo-galeenka?',
      'Sida uu u isbeddelo wareegga oo dhan',
      'Aqoonsiga dheecaanka bacriminta',
      'Sida maalin kasta loo indho-indheeyo',
      'Waxa saameyn kara indho-indheyntaada',
      'Xaddidaadda habkan',
      'Qodobbada muhiimka ah',
    ],
    section1Body:
      'Waa dheecaan dabiici ah oo afka ilmo-galeenku soo saaro. Dheecaanka afka ilmo-galeenku wuxuu beddelaa dhumucdiisa wareegga oo dhan, saameynta estrogen iyo progesterone awgeed.',
    cycleEvolution: [
      {
        title: 'Caadada ka dib',
        text: 'Dheecaan yar, inta badan dareen engegnaan.',
      },
      {
        title: 'Ukun-sii-deynta ka hor',
        text: 'Ka badan, cirro leh, oo dhegdheg.',
      },
      {
        title: 'Marka ukun-sii-deyntu soo dhowaato',
        text: 'Cad, is-dheeraada, oo jilicsan, la mid ah caddaanka ukunta ceeriin.',
      },
      {
        title: 'Ukun-sii-deynta ka dib',
        text: 'Ka dhumuc weyn, aan iftiin dhaafin, ama aad uga yar.',
      },
    ],
    section3Intro: 'Marka ukun-sii-deyntu soo dhowaato, wuxuu noqdaa:',
    fertileSigns: [
      'Cad ama hufan',
      'Is-dheeraada — wuxuu u dheeraadaa laba far dhexdooda',
      'Jilicsan, la mid ah caddaanka ukunta ceeriin',
      'Ka badan maalmaha kale',
    ],
    infoTitle: 'Caado fudud, maalin kasta',
    infoText:
      'Indho-indheeyo muuqaalka iyo dhumucda adigoo isticmaalaya warqad suuli ama far nadiif ah, qiyaastii isla waqti maalinta ah, oo qor waxa aad aragto.',
    modifyingFactors: [
      'Galmo dhawaan ah',
      'Alaabta nadaafadda gaarka ah',
      'Ka hortagga uurka hormoonka ama daaweynno qaar',
      'Caabuq ama dheelitir la’aan maxalli ah',
    ],
    section6Body:
      'Qof walba wuxuu leeyahay qaab ka duwan, aqoonsiga kaaga gaarkana wuxuu u baahan yahay ku dhaqmid dhowr wareeg. Indho-indheynta isbeddelkan maalin kasta, oo ay la socdaan calaamado kale, waxay kaa caawisaa inaad si wanaagsan u go’aamiso muddada bacrimintaada — laakiin marnaba ma beddelo talo caafimaad haddii aad walwalsan tahay.',
    tipTitle: 'Waxtar leh in la ogaado',
    tipText:
      'Isku-darka dheecaanka afka ilmo-galeenka iyo heerkulkaaga aasaasiga ah ee jidhka ama baaritaannada ukun-sii-deynta wuxuu bixiyaa sawir buuxa oo wareeggaaga ah.',
    summaryPoints: [
      'Dheecaanka afka ilmo-galeenku wuxuu beddelaa dhumucdiisa wareegga oo dhan, saameynta estrogen iyo progesterone awgeed.',
      'Marka ukun-sii-deyntu soo dhowaato, wuxuu noqdaa cad, is-dheeraada, oo jilicsan, la mid ah caddaanka ukunta ceeriin.',
      'Indho-indheynta isbeddelkan maalin kasta, oo ay la socdaan calaamado kale, waxay kaa caawisaa inaad si wanaagsan u go’aamiso muddada bacrimintaada.',
      'Aqoonsiga qaabkaaga gaarka ah wuxuu u baahan yahay ku dhaqmid iyo dhowr wareeg oo indho-indheyn ah.',
    ],
    disclaimerText:
      'Macluumaad. Maqaalkan ma beddelo talo caafimaad oo shakhsi ah. Haddii aad shaki qabto, weydii xirfadle caafimaad tilmaan.',
    shareMessage: 'Indho-indheynta dheecaanka afka ilmo-galeenkaaga — AWA',
  },
  sw: {
    badge: 'RUTUBA • UTE WA SHINGO YA KIZAZI',
    title: 'Kuchunguza\nute wako wa shingo ya kizazi',
    metaDuration: 'Dakika 5 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Wastani',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Ishara ya asili na ya bure ya kutambua kipindi chako cha rutuba.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Ute wa shingo ya kizazi ni nini?',
      'Jinsi unavyobadilika katika mzunguko',
      'Kutambua ute wa rutuba',
      'Jinsi ya kuuchunguza kila siku',
      'Kinachoweza kuathiri uchunguzi wako',
      'Mipaka ya njia hii',
      'Mambo muhimu ya kukumbuka',
    ],
    section1Body:
      'Ni majimaji ya asili yanayotolewa na shingo ya kizazi. Ute wa shingo ya kizazi hubadilika umbile katika mzunguko kwa athari ya estrojeni na projesteroni.',
    cycleEvolution: [
      {
        title: 'Baada ya hedhi yako',
        text: 'Ute mdogo, mara nyingi hisia ya ukavu.',
      },
      {
        title: 'Kabla ya utoaji wa yai',
        text: 'Mwingi zaidi, wenye mawingu, na unaonata.',
      },
      {
        title: 'Utoaji wa yai unapokaribia',
        text: 'Safi, wenye kunyooka, na wa kunyumbulika, unaofanana na ute wa yai mbichi.',
      },
      {
        title: 'Baada ya utoaji wa yai',
        text: 'Mzito zaidi, usioonekana ndani, au mdogo zaidi.',
      },
    ],
    section3Intro: 'Utoaji wa yai unapokaribia, unakuwa:',
    fertileSigns: [
      'Safi au unaoonekana ndani',
      'Wenye kunyooka — unanyooka kati ya vidole viwili',
      'Wa kunyumbulika, unaofanana na ute wa yai mbichi',
      'Mwingi zaidi kuliko siku nyingine',
    ],
    infoTitle: 'Tabia rahisi, kila siku',
    infoText:
      'Chunguza mwonekano na umbile kwa kutumia karatasi ya chooni au vidole safi, karibu na wakati ule ule wa siku, na andika unachoona.',
    modifyingFactors: [
      'Tendo la ndoa la hivi karibuni',
      'Bidhaa za usafi wa sehemu za siri',
      'Uzazi wa mpango wa homoni au matibabu fulani',
      'Maambukizi au kutokuwa na usawa wa eneo hilo',
    ],
    section6Body:
      'Kila mtu ana mtindo tofauti, na kutambua wako kunahitaji mazoezi ya mizunguko kadhaa. Kuchunguza mabadiliko haya kila siku, pamoja na dalili nyingine, kunakusaidia kubaini vizuri zaidi kipindi chako cha rutuba — lakini hakuchukui nafasi ya ushauri wa kitabibu ikiwa una wasiwasi.',
    tipTitle: 'Vyema kujua',
    tipText:
      'Kuchanganya ute wa shingo ya kizazi na joto lako la msingi la mwili au vipimo vya utoaji wa yai kunatoa picha kamili zaidi ya mzunguko wako.',
    summaryPoints: [
      'Ute wa shingo ya kizazi hubadilika umbile katika mzunguko kwa athari ya estrojeni na projesteroni.',
      'Utoaji wa yai unapokaribia, unakuwa safi, wenye kunyooka, na wa kunyumbulika, unaofanana na ute wa yai mbichi.',
      'Kuchunguza mabadiliko haya kila siku, pamoja na dalili nyingine, kunakusaidia kubaini vizuri zaidi kipindi chako cha rutuba.',
      'Kutambua mtindo wako mwenyewe kunahitaji mazoezi na mizunguko kadhaa ya uchunguzi.',
    ],
    disclaimerText:
      'Maudhui ya taarifa. Makala hii haichukui nafasi ya ushauri wa kitabibu uliobinafsishwa. Ukiwa na shaka, muulize mtaalamu wa afya akuongoze.',
    shareMessage: 'Kuchunguza ute wako wa shingo ya kizazi — AWA',
  },
  kk: {
    badge: 'ҚҰНАРЛЫЛЫҚ • ЖАТЫР МОЙНЫ ШЫРЫШЫ',
    title: 'Жатыр мойны\nшырышын бақылау',
    metaDuration: '5 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Орташа',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Құнарлы кезеңіңізді анықтауға арналған табиғи, тегін белгі.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Жатыр мойны шырышы дегеніміз не?',
      'Ол цикл барысында қалай өзгереді',
      'Құнарлы шырышты тану',
      'Оны күн сайын қалай бақылау керек',
      'Бақылауларыңызға не әсер етуі мүмкін',
      'Бұл әдістің шектеулері',
      'Негізгі қорытындылар',
    ],
    section1Body:
      'Бұл жатыр мойнында түзілетін табиғи бөлінді. Жатыр мойны шырышы эстроген мен прогестеронның әсерінен цикл бойы құрылымын өзгертеді.',
    cycleEvolution: [
      {
        title: 'Етеккірден кейін',
        text: 'Шырыш аз, жиі құрғақтық сезімі.',
      },
      {
        title: 'Овуляцияға дейін',
        text: 'Көбірек, бұлыңғыр және жабысқақ.',
      },
      {
        title: 'Овуляция жақындаған кезде',
        text: 'Мөлдір, созылғыш және серпімді, шикі жұмыртқа ағына ұқсас.',
      },
      {
        title: 'Овуляциядан кейін',
        text: 'Қоюырақ, мөлдір емес немесе әлдеқайда аз.',
      },
    ],
    section3Intro: 'Овуляция жақындаған кезде ол мынадай болады:',
    fertileSigns: [
      'Мөлдір немесе ашық',
      'Созылғыш — екі саусақ арасында созылады',
      'Серпімді, шикі жұмыртқа ағына ұқсас',
      'Басқа күндерге қарағанда көбірек',
    ],
    infoTitle: 'Қарапайым әдет, күн сайын',
    infoText:
      'Сыртқы түрі мен құрылымын дәретхана қағазының немесе таза саусақтардың көмегімен, күннің шамамен бір уақытында бақылаңыз және байқағаныңызды жазып қойыңыз.',
    modifyingFactors: [
      'Жақында болған жыныстық қатынас',
      'Жеке гигиена өнімдері',
      'Гормондық контрацепция немесе кейбір емдеу',
      'Инфекция немесе жергілікті тепе-теңдіктің бұзылуы',
    ],
    section6Body:
      'Әркімнің өз үлгісі бар, ал өзіңізді тану бірнеше цикл бойы жаттығуды қажет етеді. Бұл өзгерісті күн сайын басқа белгілермен бірге бақылау құнарлы кезеңіңізді жақсырақ анықтауға көмектеседі — бірақ алаңдасаңыз, ол медициналық кеңестің орнын баспайды.',
    tipTitle: 'Білуге тиісті',
    tipText:
      'Жатыр мойны шырышын базальды дене температурасымен немесе овуляция тесттерімен біріктіру циклыңыздың толығырақ суретін береді.',
    summaryPoints: [
      'Жатыр мойны шырышы эстроген мен прогестеронның әсерінен цикл бойы құрылымын өзгертеді.',
      'Овуляция жақындаған кезде ол мөлдір, созылғыш және серпімді, шикі жұмыртқа ағына ұқсас болады.',
      'Бұл өзгерісті күн сайын басқа белгілермен бірге бақылау құнарлы кезеңіңізді жақсырақ анықтауға көмектеседі.',
      'Өз үлгіңізді тану жаттығуды және бірнеше цикл бақылауды қажет етеді.',
    ],
    disclaimerText:
      'Ақпараттық мазмұн. Бұл мақала жекелендірілген медициналық кеңестің орнын баспайды. Күмән туындаса, медицина маманынан бағыт сұраңыз.',
    shareMessage: 'Жатыр мойны шырышын бақылау — AWA',
  },
  wo: {
    badge: 'BINDEEF • NDOX MU BËRËB JËMM',
    title: 'Seetlu sa\nndox mu bërëb jëmm',
    metaDuration: '5 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Digg-dóomu',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Benn màndarga bu natural te amul njëg ngir xam sa jamono ju bind.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Lan mooy ndox mu bërëb jëmm?',
      'Naka mu di soppiku ci wërsëg bi',
      'Xam ndox mu bind',
      'Naka ngay seetlu ko bés bu nekk',
      'Li mën a jëm ci say seetlu',
      'Dayo yu anam bii',
      'Li am solo',
    ],
    section1Body:
      'Benn ndox la bu natural bu bërëb jëmm di def. Ndox mu bërëb jëmm dafay soppi anam ci wërsëg bi, ci kaw estrojen ak progesteron.',
    cycleEvolution: [
      {
        title: 'Ginnaaw sa règle',
        text: 'Ndox bu ndaw, bu bari dégg wow.',
      },
      {
        title: 'Balaa ovilasiyoŋ',
        text: 'Gën a bari, lëndëm ak dëgmal.',
      },
      {
        title: 'Ba ovilasiyoŋ di jege',
        text: 'Leer, delloo ak ni weñu nen bu ñuul.',
      },
      {
        title: 'Ginnaaw ovilasiyoŋ',
        text: 'Gën a dëgër, bu lëndëm walla bu ndaw lool.',
      },
    ],
    section3Intro: 'Ba ovilasiyoŋ di jege, dafay nekk:',
    fertileSigns: [
      'Leer walla jaar-jaar',
      'Delloo — dafay xëtt ci diggante ñaari baaraam',
      'Delloo ni weñu nen bu ñuul',
      'Gën a bari ci yeneen fan',
    ],
    infoTitle: 'Benn yoon bu yomb, bés bu nekk',
    infoText:
      'Seetlu anam ak dëgmal ak papiye tualet walla baaraam yu set, ci waxtu bu bokk ci bés bi, te bind li nga gis.',
    modifyingFactors: [
      'Jaam bu mujj',
      'Jumtukaay yu set bu nëbbu',
      'Ŋàbbal ëmb bu hormon walla yenn garab',
      'Benn feebar walla benn jubluñ bu bérëb',
    ],
    section6Body:
      'Ku nekk am na anamam, te xam sa bopp soxla jëfandikoo ay wërsëg. Seetlu soppi bii bés bu nekk, ak yeneen màndarga, dafay dimbli nga gën a gis sa jamono ju bind — waaye du wuutu ndigalu doktoor bu am nga xel-ñaar.',
    tipTitle: 'Lu baax a xam',
    tipText:
      'Boole ndox mu bërëb jëmm ak sa tàngoor yaram bu njëkk walla tèsu ovilasiyoŋ dafay joxe benn gis bu gën a mat ci sa wërsëg.',
    summaryPoints: [
      'Ndox mu bërëb jëmm dafay soppi anam ci wërsëg bi, ci kaw estrojen ak progesteron.',
      'Ba ovilasiyoŋ di jege, dafay nekk leer, delloo ni weñu nen bu ñuul.',
      'Seetlu soppi bii bés bu nekk, ak yeneen màndarga, dafay dimbli nga gën a gis sa jamono ju bind.',
      'Xam sa anam soxla jëfandikoo ak ay wërsëg yu seetlu.',
    ],
    disclaimerText:
      'Mbind ngir xibaar. Bind bii du wuutu ndigalu doktoor bu sa bopp. Bu am nga xel-ñaar, laajal benn liggéeykatu wér.',
    shareMessage: 'Seetlu sa ndox mu bërëb jëmm — AWA',
  },
  ha: {
    badge: 'HAIHUWA • MAJINAR MAHAIFA',
    title: 'Lura da\nmajinar mahaifarki',
    metaDuration: 'karatun minti 5',
    metaType: 'Jagora',
    metaLevel: 'Matsakaici',
    metaValidated: 'Abun da aka duba',
    intro: 'Alama ta halitta kuma kyauta don gane lokacin haihuwarki.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Menene majinar mahaifa?',
      'Yadda take sauyawa a zagaye',
      'Gane majinar haihuwa',
      'Yadda ake lura da ita kullum',
      'Abin da zai iya shafar lurarki',
      'Iyakar wannan hanya',
      'Muhimman abubuwa',
    ],
    section1Body:
      'Ruwa ne na halitta da mahaifa ke samarwa. Majinar mahaifa tana sauya yanayi a duk zagaye saboda estrogen da progesterone.',
    cycleEvolution: [
      {
        title: 'Bayan hailarki',
        text: 'Majina kaɗan, galibi jin bushewa.',
      },
      {
        title: 'Kafin fitar ƙwai',
        text: 'Ta fi yawa, gizagizai, kuma mai mannewa.',
      },
      {
        title: 'Yayin da fitar ƙwai ke gabatowa',
        text: 'Mai haske, mai mikewa, kamar farin ƙwai ɗanye.',
      },
      {
        title: 'Bayan fitar ƙwai',
        text: 'Ta fi kauri, mara haske, ko ƙasa da yawa.',
      },
    ],
    section3Intro: 'Yayin da fitar ƙwai ke gabatowa, tana zama:',
    fertileSigns: [
      'Mai haske ko mai gani ta cikinta',
      'Mai mikewa — tana mikewa tsakanin yatsu biyu',
      'Mai laushi, kamar farin ƙwai ɗanye',
      'Ta fi yawa fiye da sauran kwanaki',
    ],
    infoTitle: 'Al’ada mai sauƙi, kowace rana',
    infoText:
      'Lura da kamanni da yanayi ta amfani da takarda ta bayan gida ko yatsu masu tsabta, a lokaci ɗaya kowace rana, ki rubuta abin da kika lura.',
    modifyingFactors: [
      'Kusanci kwanan nan',
      'Samfuran tsabtar al’aura',
      'Hana haihuwa na hormone ko wasu magunguna',
      'Kamuwa da cuta ko rashin daidaito a gida',
    ],
    section6Body:
      'Kowa yana da tsarinsa, kuma gane naki yana bukatar aiki a zagaye da dama. Lura da wannan sauyi kowace rana, tare da sauran alamomi, yana taimaka miki ki fi gano lokacin haihuwarki — amma ba ya maye gurbin shawarar likita idan kina da damuwa.',
    tipTitle: 'Abin da ya kamata ki sani',
    tipText:
      'Haɗa majinar mahaifa da zafin jikinki na asali ko gwajin fitar ƙwai yana ba da cikakken hoto na zagayenki.',
    summaryPoints: [
      'Majinar mahaifa tana sauya yanayi a duk zagaye saboda estrogen da progesterone.',
      'Yayin da fitar ƙwai ke gabatowa, tana zama mai haske, mai mikewa, kamar farin ƙwai ɗanye.',
      'Lura da wannan sauyi kowace rana, tare da sauran alamomi, yana taimaka miki ki fi gano lokacin haihuwarki.',
      'Gane tsarinki yana bukatar aiki da zagaye da dama na lura.',
    ],
    disclaimerText:
      'Abun bayani. Wannan labari ba ya maye gurbin shawarar likita ta keɓaɓɓiya. Idan kina cikin shakka, tambayi ma’aikacin lafiya.',
    shareMessage: 'Lura da majinar mahaifarki — AWA',
  },
  am: {
    badge: 'የመውለድ ችሎታ • የማህፀን በር ንፋጭ',
    title: 'የማህፀን በር\nንፋጭሽን መታዘብ',
    metaDuration: '5 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'መካከለኛ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'ለም ጊዜሽን ለመለየት ተፈጥሯዊ፣ ነፃ ምልክት።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'የማህፀን በር ንፋጭ ምንድን ነው?',
      'በዑደቱ ሁሉ እንዴት እንደሚለወጥ',
      'ለም ንፋጭን መለየት',
      'በየቀኑ እንዴት መታዘብ',
      'ምልከታዎችሽን ሊነካ የሚችለው',
      'የዚህ ዘዴ ገደቦች',
      'ዋና ዋና ነጥቦች',
    ],
    section1Body:
      'የማህፀን በር የሚያመነጨው ተፈጥሯዊ ፈሳሽ ነው። የማህፀን በር ንፋጭ በኢስትሮጅንና በፕሮጄስትሮን ተጽእኖ በዑደቱ ሁሉ ይዘቱን ይለውጣል።',
    cycleEvolution: [
      {
        title: 'ከወር አበባሽ በኋላ',
        text: 'ጥቂት ንፋጭ፣ ብዙውን ጊዜ የመድረቅ ስሜት።',
      },
      {
        title: 'ከእንቁላል መልቀቅ በፊት',
        text: 'ይበልጥ ብዙ፣ ደመናማ እና ተለጣፊ።',
      },
      {
        title: 'እንቁላል መልቀቅ ሲቃረብ',
        text: 'ጥርት ያለ፣ ተለጣጭ እና የሚሰፋ፣ ከጥሬ የእንቁላል ነጭ ጋር ተመሳሳይ።',
      },
      {
        title: 'ከእንቁላል መልቀቅ በኋላ',
        text: 'ወፍራም፣ ደብዛዛ፣ ወይም በጣም ያነሰ።',
      },
    ],
    section3Intro: 'እንቁላል መልቀቅ ሲቃረብ እንዲህ ይሆናል፦',
    fertileSigns: [
      'ጥርት ያለ ወይም ግልጽ',
      'ተለጣጭ — በሁለት ጣቶች መካከል ይለጠጣል',
      'የሚሰፋ፣ ከጥሬ የእንቁላል ነጭ ጋር ተመሳሳይ',
      'ከሌሎች ቀናት ይበልጥ ብዙ',
    ],
    infoTitle: 'ቀላል ልማድ፣ በየቀኑ',
    infoText:
      'መልኩንና ይዘቱን በመጸዳጃ ወረቀት ወይም በንጹሕ ጣቶች፣ በየቀኑ በተመሳሳይ ሰዓት አካባቢ ታዘቢ፣ እና ያስተዋልሽውን ጻፊ።',
    modifyingFactors: [
      'በቅርቡ የተደረገ ግንኙነት',
      'የግል ንጽሕና ምርቶች',
      'የሆርሞን የእርግዝና መከላከያ ወይም አንዳንድ ሕክምናዎች',
      'ኢንፌክሽን ወይም የአካባቢ ሚዛን መዛባት',
    ],
    section6Body:
      'እያንዳንዷ የራሷ ዘይቤ አላት፣ የራስሽን መለየትም በብዙ ዑደቶች ልምምድ ይጠይቃል። ይህን ለውጥ ከሌሎች ምልክቶች ጋር በየቀኑ መታዘብ ለም ጊዜሽን በተሻለ ለመለየት ይረዳል — ግን ስጋት ካለሽ የሕክምና ምክርን ፈጽሞ አይተካም።',
    tipTitle: 'ማወቅ ጠቃሚ ነው',
    tipText:
      'የማህፀን በር ንፋጭን ከመሠረታዊ የሰውነት ሙቀትሽ ወይም ከእንቁላል መልቀቅ ምርመራዎች ጋር ማጣመር የዑደትሽን የተሟላ ምስል ይሰጣል።',
    summaryPoints: [
      'የማህፀን በር ንፋጭ በኢስትሮጅንና በፕሮጄስትሮን ተጽእኖ በዑደቱ ሁሉ ይዘቱን ይለውጣል።',
      'እንቁላል መልቀቅ ሲቃረብ ጥርት ያለ፣ ተለጣጭ እና የሚሰፋ፣ ከጥሬ የእንቁላል ነጭ ጋር ተመሳሳይ ይሆናል።',
      'ይህን ለውጥ ከሌሎች ምልክቶች ጋር በየቀኑ መታዘብ ለም ጊዜሽን በተሻለ ለመለየት ይረዳል።',
      'የራስሽን ዘይቤ መለየት ልምምድ እና በብዙ ዑደቶች መታዘብ ይጠይቃል።',
    ],
    disclaimerText:
      'የመረጃ ይዘት። ይህ ጽሑፍ የግል የሕክምና ምክርን አይተካም። ጥርጣሬ ካለሽ የጤና ባለሙያን መመሪያ ጠይቂ።',
    shareMessage: 'የማህፀን በር ንፋጭሽን መታዘብ — AWA',
  },
  nl: {
    badge: 'VRUCHTBAARHEID • BAARMOEDERHALSSLIJM',
    title: 'Je baarmoederhalsslijm\nobserveren',
    metaDuration: '5 min lezen',
    metaType: 'Gids',
    metaLevel: 'Gevorderd',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Een natuurlijk, gratis signaal om je vruchtbare periode te herkennen.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Wat is baarmoederhalsslijm?',
      'Hoe het verandert tijdens de cyclus',
      'Vruchtbaar slijm herkennen',
      'Hoe je het dagelijks observeert',
      'Wat je observaties kan beïnvloeden',
      'De grenzen van deze methode',
      'Belangrijkste punten',
    ],
    section1Body:
      'Het is een natuurlijke afscheiding die door de baarmoederhals wordt geproduceerd. Baarmoederhalsslijm verandert in de loop van de cyclus van textuur onder invloed van oestrogeen en progesteron.',
    cycleEvolution: [
      {
        title: 'Na je menstruatie',
        text: 'Weinig slijm, vaak een droog gevoel.',
      },
      {
        title: 'Vóór de eisprong',
        text: 'Overvloediger, troebel en kleverig.',
      },
      {
        title: 'Als de eisprong nadert',
        text: 'Helder, rekbaar en elastisch, vergelijkbaar met rauw eiwit.',
      },
      {
        title: 'Na de eisprong',
        text: 'Dikker, ondoorzichtig of veel minder aanwezig.',
      },
    ],
    section3Intro: 'Als de eisprong nadert, wordt het:',
    fertileSigns: [
      'Helder of doorzichtig',
      'Rekbaar — het rekt uit tussen twee vingers',
      'Elastisch, vergelijkbaar met rauw eiwit',
      'Overvloediger dan op andere dagen',
    ],
    infoTitle: 'Een eenvoudige gewoonte, elke dag',
    infoText:
      'Observeer het uiterlijk en de textuur met toiletpapier of schone vingers, ongeveer op hetzelfde tijdstip van de dag, en noteer wat je opmerkt.',
    modifyingFactors: [
      'Recente gemeenschap',
      'Producten voor intieme hygiëne',
      'Hormonale anticonceptie of bepaalde behandelingen',
      'Een infectie of lokale verstoring',
    ],
    section6Body:
      'Ieder heeft een ander profiel en het herkennen van je eigen patroon vergt oefening over meerdere cycli. Deze verandering elke dag observeren, samen met andere tekenen, helpt je je vruchtbare periode beter te bepalen — maar het vervangt nooit medisch advies als je je zorgen maakt.',
    tipTitle: 'Goed om te weten',
    tipText:
      'Het combineren van baarmoederhalsslijm met je basale lichaamstemperatuur of ovulatietests geeft een completer beeld van je cyclus.',
    summaryPoints: [
      'Baarmoederhalsslijm verandert in de loop van de cyclus van textuur onder invloed van oestrogeen en progesteron.',
      'Als de eisprong nadert, wordt het helder, rekbaar en elastisch, vergelijkbaar met rauw eiwit.',
      'Deze verandering elke dag observeren, samen met andere tekenen, helpt je je vruchtbare periode beter te bepalen.',
      'Je eigen patroon herkennen vergt oefening en meerdere cycli van observatie.',
    ],
    disclaimerText:
      'Informatieve inhoud. Dit artikel vervangt geen persoonlijk medisch advies. Vraag bij twijfel een zorgverlener om advies.',
    shareMessage: 'Je baarmoederhalsslijm observeren — AWA',
  },
  fi: {
    badge: 'HEDELMÄLLISYYS • KOHDUNKAULAN LIMA',
    title: 'Kohdunkaulan liman\nhavainnointi',
    metaDuration: '5 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Keskitaso',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Luonnollinen, ilmainen merkki hedelmällisen ajanjakson tunnistamiseen.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Mitä kohdunkaulan lima on?',
      'Miten se muuttuu kierron aikana',
      'Hedelmällisen liman tunnistaminen',
      'Miten havainnoida sitä päivittäin',
      'Mikä voi vaikuttaa havaintoihisi',
      'Menetelmän rajoitukset',
      'Tärkeimmät asiat',
    ],
    section1Body:
      'Se on kohdunkaulan tuottamaa luonnollista eritettä. Kohdunkaulan liman rakenne muuttuu kierron aikana estrogeenin ja progesteronin vaikutuksesta.',
    cycleEvolution: [
      {
        title: 'Kuukautisten jälkeen',
        text: 'Vähän limaa, usein kuivuuden tunne.',
      },
      {
        title: 'Ennen ovulaatiota',
        text: 'Runsaampaa, sameaa ja tahmeaa.',
      },
      {
        title: 'Ovulaation lähestyessä',
        text: 'Kirkasta, venyvää ja joustavaa, kuin raaka munanvalkuainen.',
      },
      {
        title: 'Ovulaation jälkeen',
        text: 'Paksumpaa, läpikuultamatonta tai paljon vähemmän läsnä.',
      },
    ],
    section3Intro: 'Ovulaation lähestyessä siitä tulee:',
    fertileSigns: [
      'Kirkasta tai läpinäkyvää',
      'Venyvää — se venyy kahden sormen välissä',
      'Joustavaa, kuin raaka munanvalkuainen',
      'Runsaampaa kuin muina päivinä',
    ],
    infoTitle: 'Yksinkertainen päivittäinen tapa',
    infoText:
      'Havainnoi ulkonäköä ja rakennetta vessapaperin tai puhtaiden sormien avulla suunnilleen samaan aikaan päivästä ja kirjaa huomaamasi.',
    modifyingFactors: [
      'Äskettäinen yhdyntä',
      'Intiimihygieniatuotteet',
      'Hormonaalinen ehkäisy tai tietyt hoidot',
      'Infektio tai paikallinen epätasapaino',
    ],
    section6Body:
      'Jokaisella on erilainen profiili, ja omaan profiiliin tutustuminen vaatii harjoittelua usean kierron ajan. Tämän muutoksen havainnointi joka päivä muiden merkkien rinnalla auttaa määrittämään hedelmällisen ajanjaksosi tarkemmin — mutta se ei koskaan korvaa lääketieteellistä neuvontaa, jos olet huolissasi.',
    tipTitle: 'Hyvä tietää',
    tipText:
      'Kohdunkaulan liman yhdistäminen perusruumiinlämpöön tai ovulaatiotesteihin antaa täydellisemmän kuvan kierrostasi.',
    summaryPoints: [
      'Kohdunkaulan liman rakenne muuttuu kierron aikana estrogeenin ja progesteronin vaikutuksesta.',
      'Ovulaation lähestyessä siitä tulee kirkasta, venyvää ja joustavaa, kuin raaka munanvalkuainen.',
      'Tämän muutoksen havainnointi joka päivä muiden merkkien rinnalla auttaa määrittämään hedelmällisen ajanjaksosi tarkemmin.',
      'Oman kaavan tunnistaminen vaatii harjoittelua ja usean kierron havainnointia.',
    ],
    disclaimerText:
      'Tiedoksi tarkoitettua sisältöä. Tämä artikkeli ei korvaa henkilökohtaista lääketieteellistä neuvontaa. Epäselvässä tilanteessa pyydä ohjausta terveydenhuollon ammattilaiselta.',
    shareMessage: 'Kohdunkaulan liman havainnointi — AWA',
  },
  el: {
    badge: 'ΓΟΝΙΜΟΤΗΤΑ • ΤΡΑΧΗΛΙΚΗ ΒΛΕΝΝΑ',
    title: 'Παρατηρώντας την\nτραχηλική βλέννα σου',
    metaDuration: '5 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Μεσαίο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Ένα φυσικό, δωρεάν σήμα για να εντοπίσεις το γόνιμο παράθυρό σου.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Τι είναι η τραχηλική βλέννα;',
      'Πώς αλλάζει σε όλη τη διάρκεια του κύκλου',
      'Αναγνωρίζοντας τη γόνιμη βλέννα',
      'Πώς να την παρατηρείς καθημερινά',
      'Τι μπορεί να επηρεάσει τις παρατηρήσεις σου',
      'Τα όρια αυτής της μεθόδου',
      'Βασικά συμπεράσματα',
    ],
    section1Body:
      'Είναι μια φυσική έκκριση που παράγεται από τον τράχηλο. Η τραχηλική βλέννα αλλάζει υφή σε όλη τη διάρκεια του κύκλου υπό την επίδραση του οιστρογόνου και της προγεστερόνης.',
    cycleEvolution: [
      {
        title: 'Μετά την περίοδό σου',
        text: 'Λίγη βλέννα, συχνά αίσθηση ξηρότητας.',
      },
      {
        title: 'Πριν την ωορρηξία',
        text: 'Πιο άφθονη, θολή και κολλώδης.',
      },
      {
        title: 'Καθώς πλησιάζει η ωορρηξία',
        text: 'Διαυγής, ελαστική και τεντώνεται, παρόμοια με ωμό ασπράδι αβγού.',
      },
      {
        title: 'Μετά την ωορρηξία',
        text: 'Πιο πηχτή, αδιαφανής ή πολύ λιγότερο παρούσα.',
      },
    ],
    section3Intro: 'Καθώς πλησιάζει η ωορρηξία, γίνεται:',
    fertileSigns: [
      'Διαυγής ή διάφανη',
      'Ελαστική — τεντώνεται ανάμεσα σε δύο δάχτυλα',
      'Ελαστική, παρόμοια με ωμό ασπράδι αβγού',
      'Πιο άφθονη από τις άλλες ημέρες',
    ],
    infoTitle: 'Μια απλή συνήθεια, κάθε μέρα',
    infoText:
      'Παρατήρησε την εμφάνιση και την υφή χρησιμοποιώντας χαρτί υγείας ή καθαρά δάχτυλα, περίπου την ίδια ώρα της ημέρας, και σημείωσε όσα προσέχεις.',
    modifyingFactors: [
      'Πρόσφατη σεξουαλική επαφή',
      'Προϊόντα ευαίσθητης υγιεινής',
      'Ορμονική αντισύλληψη ή ορισμένες θεραπείες',
      'Λοίμωξη ή τοπική ανισορροπία',
    ],
    section6Body:
      'Κάθε γυναίκα έχει διαφορετικό προφίλ και η αναγνώριση του δικού σου χρειάζεται εξάσκηση σε αρκετούς κύκλους. Η καθημερινή παρατήρηση αυτής της αλλαγής, μαζί με άλλα σημάδια, σε βοηθά να εντοπίσεις καλύτερα το γόνιμο παράθυρό σου — αλλά δεν αντικαθιστά ποτέ την ιατρική συμβουλή αν ανησυχείς.',
    tipTitle: 'Καλό είναι να γνωρίζεις',
    tipText:
      'Ο συνδυασμός της τραχηλικής βλέννας με τη βασική θερμοκρασία σώματος ή με τεστ ωορρηξίας δίνει μια πληρέστερη εικόνα του κύκλου σου.',
    summaryPoints: [
      'Η τραχηλική βλέννα αλλάζει υφή σε όλη τη διάρκεια του κύκλου υπό την επίδραση του οιστρογόνου και της προγεστερόνης.',
      'Καθώς πλησιάζει η ωορρηξία, γίνεται διαυγής, ελαστική και τεντώνεται, παρόμοια με ωμό ασπράδι αβγού.',
      'Η καθημερινή παρατήρηση αυτής της αλλαγής, μαζί με άλλα σημάδια, σε βοηθά να εντοπίσεις καλύτερα το γόνιμο παράθυρό σου.',
      'Η αναγνώριση του δικού σου μοτίβου χρειάζεται εξάσκηση και αρκετούς κύκλους παρατήρησης.',
    ],
    disclaimerText:
      'Ενημερωτικό περιεχόμενο. Αυτό το άρθρο δεν αντικαθιστά εξατομικευμένη ιατρική συμβουλή. Αν έχεις αμφιβολίες, ζήτησε καθοδήγηση από έναν επαγγελματία υγείας.',
    shareMessage: 'Παρατηρώντας την τραχηλική βλέννα σου — AWA',
  },
  fil: {
    badge: 'PAGKAMAYABONG • CERVICAL MUCUS',
    title: 'Pagmamasid sa iyong\ncervical mucus',
    metaDuration: '5 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Katamtaman',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Isang natural at libreng senyales para matukoy ang iyong panahon ng pagkamayabong.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Ano ang cervical mucus?',
      'Paano ito nagbabago sa buong siklo',
      'Pagkilala sa mayabong na mucus',
      'Paano ito oobserbahan araw-araw',
      'Ang maaaring makaapekto sa iyong mga obserbasyon',
      'Ang mga limitasyon ng paraang ito',
      'Mahahalagang tandaan',
    ],
    section1Body:
      'Isa itong natural na likidong nagagawa ng cervix. Nagbabago ang tekstura ng cervical mucus sa buong siklo sa impluwensya ng estrogen at progesterone.',
    cycleEvolution: [
      {
        title: 'Pagkatapos ng iyong regla',
        text: 'Kaunting mucus, madalas may pakiramdam ng pagkatuyo.',
      },
      {
        title: 'Bago ang obulasyon',
        text: 'Mas marami, malabo, at malagkit.',
      },
      {
        title: 'Habang papalapit ang obulasyon',
        text: 'Malinaw, hilahin, at elastiko, kahawig ng hilaw na puti ng itlog.',
      },
      {
        title: 'Pagkatapos ng obulasyon',
        text: 'Mas makapal, malabo, o mas kaunti na.',
      },
    ],
    section3Intro: 'Habang papalapit ang obulasyon, nagiging:',
    fertileSigns: [
      'Malinaw o transparent',
      'Hilahin — umaabot ito sa pagitan ng dalawang daliri',
      'Elastiko, kahawig ng hilaw na puti ng itlog',
      'Mas marami kaysa sa ibang araw',
    ],
    infoTitle: 'Isang simpleng gawi, araw-araw',
    infoText:
      'Obserbahan ang itsura at tekstura gamit ang toilet paper o malinis na mga daliri, sa halos parehong oras ng araw, at itala ang napansin mo.',
    modifyingFactors: [
      'Kamakailang pakikipagtalik',
      'Mga produkto sa intimate hygiene',
      'Hormonal na contraception o ilang gamutan',
      'Impeksyon o lokal na hindi pagkakabalanse',
    ],
    section6Body:
      'Magkakaiba ang profile ng bawat babae, at nangangailangan ng pagsasanay sa loob ng ilang siklo ang pagkilala sa sarili mo. Nakakatulong ang araw-araw na pagmamasid sa pagbabagong ito, kasama ng ibang senyales, para mas matukoy ang iyong panahon ng pagkamayabong — ngunit hindi nito kailanman pinapalitan ang medikal na payo kung nag-aalala ka.',
    tipTitle: 'Mabuting malaman',
    tipText:
      'Ang pagsasama ng cervical mucus sa iyong basal body temperature o mga ovulation test ay nagbibigay ng mas kumpletong larawan ng iyong siklo.',
    summaryPoints: [
      'Nagbabago ang tekstura ng cervical mucus sa buong siklo sa impluwensya ng estrogen at progesterone.',
      'Habang papalapit ang obulasyon, nagiging malinaw, hilahin, at elastiko ito, kahawig ng hilaw na puti ng itlog.',
      'Nakakatulong ang araw-araw na pagmamasid sa pagbabagong ito, kasama ng ibang senyales, para mas matukoy ang iyong panahon ng pagkamayabong.',
      'Nangangailangan ng pagsasanay at ilang siklo ng pagmamasid ang pagkilala sa sarili mong padron.',
    ],
    disclaimerText:
      'Impormasyon lamang. Hindi pinapalitan ng artikulong ito ang personalisadong medikal na payo. Kung may alinlangan, humingi ng gabay sa propesyonal sa kalusugan.',
    shareMessage: 'Pagmamasid sa iyong cervical mucus — AWA',
  },
  ta: {
    badge: 'கருவுறுதிறன் • கருப்பைவாய் சளி',
    title: 'உங்கள் கருப்பைவாய்\nசளியைக் கவனித்தல்',
    metaDuration: '5 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'இடைநிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'உங்கள் கருவுறும் காலத்தைக் கண்டறிய ஓர் இயற்கையான, இலவச சமிக்ஞை.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'கருப்பைவாய் சளி என்றால் என்ன?',
      'சுழற்சி முழுவதும் அது எப்படி மாறுகிறது',
      'கருவுறும் சளியை அடையாளம் காணுதல்',
      'தினமும் அதை எப்படிக் கவனிப்பது',
      'உங்கள் கவனிப்புகளைப் பாதிக்கக்கூடியவை',
      'இந்த முறையின் வரம்புகள்',
      'முக்கியக் குறிப்புகள்',
    ],
    section1Body:
      'இது கருப்பைவாயால் உற்பத்தி செய்யப்படும் ஓர் இயற்கையான சுரப்பு. ஈஸ்ட்ரோஜன் மற்றும் புரோஜெஸ்டிரோனின் தாக்கத்தால், கருப்பைவாய் சளி சுழற்சி முழுவதும் தன்மையை மாற்றுகிறது.',
    cycleEvolution: [
      {
        title: 'உங்கள் மாதவிடாய்க்குப் பின்',
        text: 'சளி குறைவு, பெரும்பாலும் வறட்சி உணர்வு.',
      },
      {
        title: 'அண்டவிடுப்புக்கு முன்',
        text: 'அதிகமாக, கலங்கலாக, ஒட்டும் தன்மையுடன்.',
      },
      {
        title: 'அண்டவிடுப்பு நெருங்கும்போது',
        text: 'தெளிவாக, இழுபடும், நெகிழ்வாக, பச்சை முட்டை வெள்ளையைப் போல.',
      },
      {
        title: 'அண்டவிடுப்புக்குப் பின்',
        text: 'அடர்த்தியாக, ஒளிபுகாததாக, அல்லது மிகக் குறைவாக.',
      },
    ],
    section3Intro: 'அண்டவிடுப்பு நெருங்கும்போது, அது இப்படி ஆகிறது:',
    fertileSigns: [
      'தெளிவானது அல்லது ஒளிபுகும்',
      'இழுபடும் — இரண்டு விரல்களுக்கு இடையே நீள்கிறது',
      'நெகிழ்வானது, பச்சை முட்டை வெள்ளையைப் போல',
      'மற்ற நாட்களை விட அதிகம்',
    ],
    infoTitle: 'ஒரு எளிய பழக்கம், தினமும்',
    infoText:
      'கழிப்பறைத் தாளையோ சுத்தமான விரல்களையோ பயன்படுத்தி, ஏறக்குறைய நாளின் ஒரே நேரத்தில் தோற்றத்தையும் தன்மையையும் கவனித்து, நீங்கள் கவனிப்பதைக் குறித்துக்கொள்ளுங்கள்.',
    modifyingFactors: [
      'சமீபத்திய உடலுறவு',
      'அந்தரங்கச் சுகாதாரப் பொருட்கள்',
      'ஹார்மோன் கருத்தடை அல்லது சில சிகிச்சைகள்',
      'ஒரு தொற்று அல்லது உள்ளூர் சமநிலையின்மை',
    ],
    section6Body:
      'ஒவ்வொருவருக்கும் வேறுபட்ட தன்மை உண்டு, உங்களுடையதை அடையாளம் காண பல சுழற்சிகளில் பயிற்சி தேவை. மற்ற அறிகுறிகளுடன், இந்த மாற்றத்தைத் தினமும் கவனிப்பது உங்கள் கருவுறும் காலத்தைத் துல்லியமாகக் கண்டறிய உதவுகிறது — ஆனால் நீங்கள் கவலைப்பட்டால் அது மருத்துவ ஆலோசனைக்கு ஒருபோதும் மாற்றாகாது.',
    tipTitle: 'தெரிந்துகொள்ளுங்கள்',
    tipText:
      'கருப்பைவாய் சளியை உங்கள் அடிப்படை உடல் வெப்பநிலையுடன் அல்லது அண்டவிடுப்புப் பரிசோதனைகளுடன் இணைப்பது உங்கள் சுழற்சியின் முழுமையான படத்தைத் தருகிறது.',
    summaryPoints: [
      'ஈஸ்ட்ரோஜன் மற்றும் புரோஜெஸ்டிரோனின் தாக்கத்தால் கருப்பைவாய் சளி சுழற்சி முழுவதும் தன்மையை மாற்றுகிறது.',
      'அண்டவிடுப்பு நெருங்கும்போது, அது தெளிவாக, இழுபடுவதாக, நெகிழ்வாக, பச்சை முட்டை வெள்ளையைப் போல ஆகிறது.',
      'மற்ற அறிகுறிகளுடன், இந்த மாற்றத்தைத் தினமும் கவனிப்பது உங்கள் கருவுறும் காலத்தைத் துல்லியமாகக் கண்டறிய உதவுகிறது.',
      'உங்களுக்கே உரிய முறையை அடையாளம் காண பயிற்சியும் பல சுழற்சிகளின் கவனிப்பும் தேவை.',
    ],
    disclaimerText:
      'தகவல் உள்ளடக்கம். இந்தக் கட்டுரை தனிப்பயன் மருத்துவ ஆலோசனைக்கு மாற்றல்ல. சந்தேகம் இருந்தால், ஒரு சுகாதார நிபுணரிடம் வழிகாட்டுதல் கேளுங்கள்.',
    shareMessage: 'உங்கள் கருப்பைவாய் சளியைக் கவனித்தல் — AWA',
  },
  te: {
    badge: 'సారవంతత • గర్భాశయ ముఖద్వార స్రావం',
    title: 'మీ గర్భాశయ ముఖద్వార\nస్రావాన్ని గమనించడం',
    metaDuration: '5 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'మధ్యస్థ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'మీ సారవంతమైన కాలాన్ని గుర్తించడానికి ఒక సహజమైన, ఉచితమైన సంకేతం.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'గర్భాశయ ముఖద్వార స్రావం అంటే ఏమిటి?',
      'చక్రం అంతటా ఇది ఎలా మారుతుంది',
      'సారవంతమైన స్రావాన్ని గుర్తించడం',
      'దాన్ని రోజూ ఎలా గమనించాలి',
      'మీ పరిశీలనలను ప్రభావితం చేయగలవి',
      'ఈ పద్ధతి పరిమితులు',
      'ముఖ్యాంశాలు',
    ],
    section1Body:
      'ఇది గర్భాశయ ముఖద్వారం ఉత్పత్తి చేసే సహజ స్రావం. ఈస్ట్రోజెన్, ప్రొజెస్టిరోన్ ప్రభావంతో చక్రం అంతటా గర్భాశయ ముఖద్వార స్రావం స్వభావం మారుతుంది.',
    cycleEvolution: [
      {
        title: 'మీ నెలసరి తర్వాత',
        text: 'తక్కువ స్రావం, తరచుగా పొడిగా ఉన్న భావన.',
      },
      {
        title: 'అండోత్సర్గానికి ముందు',
        text: 'ఎక్కువగా, మబ్బుగా, జిగటగా.',
      },
      {
        title: 'అండోత్సర్గం దగ్గరపడుతున్నప్పుడు',
        text: 'స్పష్టంగా, సాగేలా, పచ్చి గుడ్డు తెల్లసొన లాగా స్థితిస్థాపకంగా.',
      },
      {
        title: 'అండోత్సర్గం తర్వాత',
        text: 'చిక్కగా, అపారదర్శకంగా, లేదా చాలా తక్కువగా.',
      },
    ],
    section3Intro: 'అండోత్సర్గం దగ్గరపడుతున్నప్పుడు అది ఇలా మారుతుంది:',
    fertileSigns: [
      'స్పష్టంగా లేదా పారదర్శకంగా',
      'సాగేలా — రెండు వేళ్ల మధ్య సాగుతుంది',
      'పచ్చి గుడ్డు తెల్లసొన లాగా స్థితిస్థాపకంగా',
      'ఇతర రోజుల కంటే ఎక్కువగా',
    ],
    infoTitle: 'ఒక సరళమైన అలవాటు, ప్రతి రోజూ',
    infoText:
      'టాయిలెట్ పేపర్‌తో లేదా శుభ్రమైన వేళ్లతో, రోజులో దాదాపు ఒకే సమయంలో రూపాన్ని, స్వభావాన్ని గమనించి, మీరు గమనించినదాన్ని రాసుకోండి.',
    modifyingFactors: [
      'ఇటీవలి సంభోగం',
      'సన్నిహిత పరిశుభ్రత ఉత్పత్తులు',
      'హార్మోన్ గర్భనిరోధకం లేదా కొన్ని చికిత్సలు',
      'ఇన్ఫెక్షన్ లేదా స్థానిక అసమతుల్యత',
    ],
    section6Body:
      'ప్రతి ఒక్కరికీ భిన్నమైన తీరు ఉంటుంది, మీ సొంత తీరును గుర్తించడానికి అనేక చక్రాల సాధన అవసరం. ఈ మార్పును ప్రతి రోజూ, ఇతర సంకేతాలతో పాటు, గమనించడం మీ సారవంతమైన కాలాన్ని మరింత ఖచ్చితంగా గుర్తించడానికి సహాయపడుతుంది — కానీ మీకు ఆందోళన ఉంటే ఇది వైద్య సలహాకు ఎప్పుడూ ప్రత్యామ్నాయం కాదు.',
    tipTitle: 'తెలుసుకోవాల్సినవి',
    tipText:
      'గర్భాశయ ముఖద్వార స్రావాన్ని మీ బేసల్ శరీర ఉష్ణోగ్రతతో లేదా అండోత్సర్గ పరీక్షలతో కలపడం మీ చక్రం గురించి మరింత పూర్తి చిత్రాన్ని ఇస్తుంది.',
    summaryPoints: [
      'ఈస్ట్రోజెన్, ప్రొజెస్టిరోన్ ప్రభావంతో చక్రం అంతటా గర్భాశయ ముఖద్వార స్రావం స్వభావం మారుతుంది.',
      'అండోత్సర్గం దగ్గరపడుతున్నప్పుడు అది స్పష్టంగా, సాగేలా, పచ్చి గుడ్డు తెల్లసొన లాగా స్థితిస్థాపకంగా మారుతుంది.',
      'ఈ మార్పును ప్రతి రోజూ, ఇతర సంకేతాలతో పాటు, గమనించడం మీ సారవంతమైన కాలాన్ని మరింత ఖచ్చితంగా గుర్తించడానికి సహాయపడుతుంది.',
      'మీ సొంత తీరును గుర్తించడానికి సాధన, అనేక చక్రాల పరిశీలన అవసరం.',
    ],
    disclaimerText:
      'సమాచార కంటెంట్. ఈ వ్యాసం వ్యక్తిగత వైద్య సలహాకు ప్రత్యామ్నాయం కాదు. సందేహం ఉంటే, ఒక ఆరోగ్య నిపుణుడిని మార్గదర్శకం కోసం అడగండి.',
    shareMessage: 'మీ గర్భాశయ ముఖద్వార స్రావాన్ని గమనించడం — AWA',
  },
  mr: {
    badge: 'सुपीकता • गर्भाशयमुखाचा स्राव',
    title: 'तुमच्या गर्भाशयमुखाच्या\nस्रावाचे निरीक्षण',
    metaDuration: '5 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'मध्यम स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'तुमचा सुपीक कालावधी ओळखण्यासाठी एक नैसर्गिक, मोफत संकेत.',
    contentsTitle: 'या लेखात',
    topics: [
      'गर्भाशयमुखाचा स्राव म्हणजे काय?',
      'पाळीचक्रात तो कसा बदलतो',
      'सुपीक स्राव ओळखणे',
      'रोज त्याचे निरीक्षण कसे करावे',
      'तुमच्या निरीक्षणांवर परिणाम करू शकणाऱ्या गोष्टी',
      'या पद्धतीच्या मर्यादा',
      'मुख्य मुद्दे',
    ],
    section1Body:
      'हा गर्भाशयमुखाद्वारे तयार होणारा नैसर्गिक स्राव आहे. इस्ट्रोजेन आणि प्रोजेस्टेरॉनच्या प्रभावाने गर्भाशयमुखाच्या स्रावाचा पोत पाळीचक्रात बदलतो.',
    cycleEvolution: [
      {
        title: 'तुमच्या पाळीनंतर',
        text: 'कमी स्राव, बहुतेकदा कोरडेपणाची भावना.',
      },
      {
        title: 'बीजोत्सर्जनापूर्वी',
        text: 'अधिक प्रमाणात, गढूळ आणि चिकट.',
      },
      {
        title: 'बीजोत्सर्जन जवळ येताना',
        text: 'स्वच्छ, ताणला जाणारा आणि लवचिक, कच्च्या अंड्याच्या पांढऱ्या भागासारखा.',
      },
      {
        title: 'बीजोत्सर्जनानंतर',
        text: 'अधिक घट्ट, अपारदर्शक किंवा खूपच कमी प्रमाणात.',
      },
    ],
    section3Intro: 'बीजोत्सर्जन जवळ येताना तो असा होतो:',
    fertileSigns: [
      'स्वच्छ किंवा पारदर्शक',
      'ताणला जाणारा — दोन बोटांमध्ये ताणला जातो',
      'लवचिक, कच्च्या अंड्याच्या पांढऱ्या भागासारखा',
      'इतर दिवसांपेक्षा अधिक प्रमाणात',
    ],
    infoTitle: 'एक साधी सवय, रोज',
    infoText:
      'साधारण दिवसाच्या एकाच वेळी, टॉयलेट पेपर किंवा स्वच्छ बोटांनी त्याचे स्वरूप आणि पोत पाहा आणि जे दिसेल ते नोंदवा.',
    modifyingFactors: [
      'अलीकडील शारीरिक संबंध',
      'खाजगी भागाच्या स्वच्छतेची उत्पादने',
      'हार्मोनल गर्भनिरोधन किंवा काही उपचार',
      'संसर्ग किंवा स्थानिक असंतुलन',
    ],
    section6Body:
      'प्रत्येकाचे प्रोफाइल वेगळे असते आणि तुमचे स्वतःचे ओळखण्यासाठी अनेक पाळीचक्रांचा सराव लागतो. इतर चिन्हांसोबत हा बदल रोज पाहिल्याने तुम्हाला तुमचा सुपीक कालावधी अधिक चांगला निश्चित करता येतो — पण तुम्हाला चिंता असल्यास तो वैद्यकीय सल्ल्याची जागा कधीच घेत नाही.',
    tipTitle: 'हे जाणून घ्या',
    tipText:
      'गर्भाशयमुखाचा स्राव तुमच्या बेसल शरीराच्या तापमानाशी किंवा बीजोत्सर्जन चाचण्यांशी जोडल्याने तुमच्या पाळीचे अधिक पूर्ण चित्र मिळते.',
    summaryPoints: [
      'इस्ट्रोजेन आणि प्रोजेस्टेरॉनच्या प्रभावाने गर्भाशयमुखाच्या स्रावाचा पोत पाळीचक्रात बदलतो.',
      'बीजोत्सर्जन जवळ येताना तो स्वच्छ, ताणला जाणारा आणि लवचिक, कच्च्या अंड्याच्या पांढऱ्या भागासारखा होतो.',
      'इतर चिन्हांसोबत हा बदल रोज पाहिल्याने तुम्हाला तुमचा सुपीक कालावधी अधिक चांगला निश्चित करता येतो.',
      'तुमचा स्वतःचा नमुना ओळखण्यासाठी सराव आणि अनेक पाळीचक्रांचे निरीक्षण लागते.',
    ],
    disclaimerText:
      'माहितीपर मजकूर. हा लेख वैयक्तिक वैद्यकीय सल्ल्याची जागा घेत नाही. शंका असल्यास, मार्गदर्शनासाठी आरोग्य व्यावसायिकाला विचारा.',
    shareMessage: 'तुमच्या गर्भाशयमुखाच्या स्रावाचे निरीक्षण — AWA',
  },
  gu: {
    badge: 'ફળદ્રુપતા • ગર્ભાશયમુખનો સ્રાવ',
    title: 'તમારા ગર્ભાશયમુખના\nસ્રાવનું નિરીક્ષણ',
    metaDuration: '5 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'મધ્યમ સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'તમારો ફળદ્રુપ સમયગાળો ઓળખવા માટેનો કુદરતી, મફત સંકેત.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'ગર્ભાશયમુખનો સ્રાવ એટલે શું?',
      'માસિક ચક્ર દરમિયાન તે કેવી રીતે બદલાય છે',
      'ફળદ્રુપ સ્રાવ ઓળખવો',
      'તેનું રોજ નિરીક્ષણ કેવી રીતે કરવું',
      'તમારા નિરીક્ષણને શું અસર કરી શકે',
      'આ પદ્ધતિની મર્યાદાઓ',
      'મુખ્ય મુદ્દા',
    ],
    section1Body:
      'તે ગર્ભાશયમુખ દ્વારા બનતો કુદરતી સ્રાવ છે. એસ્ટ્રોજન અને પ્રોજેસ્ટેરોનની અસરથી માસિક ચક્ર દરમિયાન ગર્ભાશયમુખના સ્રાવની રચના બદલાય છે.',
    cycleEvolution: [
      {
        title: 'માસિક પછી',
        text: 'સ્રાવ ઓછો, ઘણી વાર સૂકાપણાની લાગણી.',
      },
      {
        title: 'અંડોત્સર્જન પહેલાં',
        text: 'વધુ પ્રમાણમાં, ડહોળો અને ચીકણો.',
      },
      {
        title: 'અંડોત્સર્જન નજીક આવે ત્યારે',
        text: 'સ્વચ્છ, ખેંચાય તેવો અને લવચીક, કાચા ઈંડાની સફેદીના જેવો.',
      },
      {
        title: 'અંડોત્સર્જન પછી',
        text: 'વધુ ઘટ્ટ, અપારદર્શક, અથવા ઘણો ઓછો.',
      },
    ],
    section3Intro: 'અંડોત્સર્જન નજીક આવે ત્યારે તે આવો બને છે:',
    fertileSigns: [
      'સ્વચ્છ અથવા પારદર્શક',
      'ખેંચાય તેવો — બે આંગળી વચ્ચે ખેંચાય છે',
      'લવચીક, કાચા ઈંડાની સફેદીના જેવો',
      'બીજા દિવસો કરતાં વધુ પ્રમાણમાં',
    ],
    infoTitle: 'એક સરળ ટેવ, રોજ',
    infoText:
      'ટોઇલેટ પેપર કે સ્વચ્છ આંગળીઓથી દેખાવ અને રચના જુઓ, દિવસના લગભગ એક જ સમયે, અને જે દેખાય તે નોંધી લો.',
    modifyingFactors: [
      'તાજેતરનો શારીરિક સંબંધ',
      'ખાનગી ભાગની સ્વચ્છતાના ઉત્પાદનો',
      'હોર્મોનલ ગર્ભનિરોધન અથવા કેટલીક સારવાર',
      'ચેપ અથવા સ્થાનિક અસંતુલન',
    ],
    section6Body:
      'દરેક સ્ત્રીની પ્રોફાઇલ અલગ હોય છે, અને તમારી પોતાની ઓળખવા માટે ઘણાં માસિક ચક્રો સુધી અભ્યાસ જોઈએ. અન્ય સંકેતોની સાથે આ ફેરફારનું રોજ નિરીક્ષણ કરવાથી તમારો ફળદ્રુપ સમયગાળો વધુ સારી રીતે ઓળખવામાં મદદ મળે છે — પરંતુ તમને ચિંતા હોય તો તે ક્યારેય તબીબી સલાહનું સ્થાન લેતું નથી.',
    tipTitle: 'જાણવા જેવું',
    tipText:
      'ગર્ભાશયમુખના સ્રાવને તમારા બેઝલ શરીરના તાપમાન કે અંડોત્સર્જન પરીક્ષણો સાથે જોડવાથી તમારા માસિક ચક્રનું વધુ સંપૂર્ણ ચિત્ર મળે છે.',
    summaryPoints: [
      'એસ્ટ્રોજન અને પ્રોજેસ્ટેરોનની અસરથી માસિક ચક્ર દરમિયાન ગર્ભાશયમુખના સ્રાવની રચના બદલાય છે.',
      'અંડોત્સર્જન નજીક આવે ત્યારે તે સ્વચ્છ, ખેંચાય તેવો અને લવચીક, કાચા ઈંડાની સફેદીના જેવો બને છે.',
      'અન્ય સંકેતોની સાથે આ ફેરફારનું રોજ નિરીક્ષણ કરવાથી તમારો ફળદ્રુપ સમયગાળો વધુ સારી રીતે ઓળખવામાં મદદ મળે છે.',
      'તમારી પોતાની પેટર્ન ઓળખવા માટે અભ્યાસ અને ઘણાં માસિક ચક્રોના નિરીક્ષણની જરૂર પડે છે.',
    ],
    disclaimerText:
      'માહિતી માટેની સામગ્રી. આ લેખ વ્યક્તિગત તબીબી સલાહનું સ્થાન લેતો નથી. શંકા હોય તો આરોગ્ય વ્યાવસાયિક પાસેથી માર્ગદર્શન લો.',
    shareMessage: 'તમારા ગર્ભાશયમુખના સ્રાવનું નિરીક્ષણ — AWA',
  },
  pa: {
    badge: 'ਉਪਜਾਊ ਸ਼ਕਤੀ • ਬੱਚੇਦਾਨੀ ਦੇ ਮੂੰਹ ਦਾ ਰਿਸਾਅ',
    title: 'ਆਪਣੇ ਬੱਚੇਦਾਨੀ ਦੇ ਮੂੰਹ\nਦੇ ਰਿਸਾਅ ਨੂੰ ਦੇਖਣਾ',
    metaDuration: '5 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਦਰਮਿਆਨਾ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਆਪਣੇ ਉਪਜਾਊ ਸਮੇਂ ਨੂੰ ਪਛਾਣਨ ਦਾ ਇੱਕ ਕੁਦਰਤੀ, ਮੁਫ਼ਤ ਸੰਕੇਤ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਬੱਚੇਦਾਨੀ ਦੇ ਮੂੰਹ ਦਾ ਰਿਸਾਅ ਕੀ ਹੈ?',
      'ਇਹ ਚੱਕਰ ਦੌਰਾਨ ਕਿਵੇਂ ਬਦਲਦਾ ਹੈ',
      'ਉਪਜਾਊ ਰਿਸਾਅ ਨੂੰ ਪਛਾਣਨਾ',
      'ਇਸ ਨੂੰ ਰੋਜ਼ ਕਿਵੇਂ ਦੇਖਣਾ ਹੈ',
      'ਕਿਹੜੀਆਂ ਗੱਲਾਂ ਤੁਹਾਡੇ ਨਿਰੀਖਣ ’ਤੇ ਅਸਰ ਪਾ ਸਕਦੀਆਂ ਹਨ',
      'ਇਸ ਤਰੀਕੇ ਦੀਆਂ ਹੱਦਾਂ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    section1Body:
      'ਇਹ ਬੱਚੇਦਾਨੀ ਦੇ ਮੂੰਹ ਤੋਂ ਬਣਨ ਵਾਲਾ ਇੱਕ ਕੁਦਰਤੀ ਰਿਸਾਅ ਹੈ। ਐਸਟ੍ਰੋਜਨ ਅਤੇ ਪ੍ਰੋਜੈਸਟ੍ਰੋਨ ਦੇ ਪ੍ਰਭਾਵ ਨਾਲ ਚੱਕਰ ਦੌਰਾਨ ਇਸ ਦੀ ਬਣਤਰ ਬਦਲਦੀ ਰਹਿੰਦੀ ਹੈ।',
    cycleEvolution: [
      {
        title: 'ਮਾਹਵਾਰੀ ਤੋਂ ਬਾਅਦ',
        text: 'ਰਿਸਾਅ ਥੋੜ੍ਹਾ, ਅਕਸਰ ਖ਼ੁਸ਼ਕੀ ਦਾ ਅਹਿਸਾਸ।',
      },
      {
        title: 'ਓਵੂਲੇਸ਼ਨ ਤੋਂ ਪਹਿਲਾਂ',
        text: 'ਵਧੇਰੇ ਮਾਤਰਾ ਵਿੱਚ, ਘੁਲਿਆ-ਮਿਲਿਆ ਅਤੇ ਚਿਪਚਿਪਾ।',
      },
      {
        title: 'ਓਵੂਲੇਸ਼ਨ ਨੇੜੇ ਆਉਣ ’ਤੇ',
        text: 'ਸਾਫ਼, ਖਿੱਚਿਆ ਜਾਣ ਵਾਲਾ ਅਤੇ ਲਚਕੀਲਾ, ਕੱਚੇ ਆਂਡੇ ਦੀ ਸਫ਼ੈਦੀ ਵਰਗਾ।',
      },
      {
        title: 'ਓਵੂਲੇਸ਼ਨ ਤੋਂ ਬਾਅਦ',
        text: 'ਗਾੜ੍ਹਾ, ਧੁੰਦਲਾ, ਜਾਂ ਬਹੁਤ ਘੱਟ ਮੌਜੂਦ।',
      },
    ],
    section3Intro: 'ਓਵੂਲੇਸ਼ਨ ਨੇੜੇ ਆਉਣ ’ਤੇ ਇਹ ਅਜਿਹਾ ਹੋ ਜਾਂਦਾ ਹੈ:',
    fertileSigns: [
      'ਸਾਫ਼ ਜਾਂ ਪਾਰਦਰਸ਼ੀ',
      'ਖਿੱਚਿਆ ਜਾਣ ਵਾਲਾ — ਦੋ ਉਂਗਲਾਂ ਵਿਚਕਾਰ ਤਾਰ ਵਾਂਗ ਖਿੱਚਦਾ ਹੈ',
      'ਲਚਕੀਲਾ, ਕੱਚੇ ਆਂਡੇ ਦੀ ਸਫ਼ੈਦੀ ਵਰਗਾ',
      'ਦੂਜੇ ਦਿਨਾਂ ਨਾਲੋਂ ਵੱਧ ਮਾਤਰਾ ਵਿੱਚ',
    ],
    infoTitle: 'ਇੱਕ ਸੌਖੀ ਆਦਤ, ਹਰ ਰੋਜ਼',
    infoText:
      'ਟਾਇਲਟ ਪੇਪਰ ਜਾਂ ਸਾਫ਼ ਉਂਗਲਾਂ ਨਾਲ, ਦਿਨ ਦੇ ਲਗਭਗ ਇੱਕੋ ਸਮੇਂ ’ਤੇ, ਇਸ ਦੀ ਦਿੱਖ ਅਤੇ ਬਣਤਰ ਨੂੰ ਦੇਖੋ ਅਤੇ ਜੋ ਨਜ਼ਰ ਆਵੇ ਉਸ ਨੂੰ ਲਿਖ ਲਓ।',
    modifyingFactors: [
      'ਹਾਲ ਹੀ ਵਿੱਚ ਹੋਇਆ ਸਰੀਰਕ ਸੰਬੰਧ',
      'ਨਿੱਜੀ ਸਫ਼ਾਈ ਦੇ ਉਤਪਾਦ',
      'ਹਾਰਮੋਨਲ ਗਰਭ ਨਿਰੋਧ ਜਾਂ ਕੁਝ ਇਲਾਜ',
      'ਲਾਗ ਜਾਂ ਸਥਾਨਕ ਅਸੰਤੁਲਨ',
    ],
    section6Body:
      'ਹਰ ਔਰਤ ਦਾ ਪ੍ਰੋਫ਼ਾਈਲ ਵੱਖਰਾ ਹੁੰਦਾ ਹੈ, ਅਤੇ ਆਪਣੇ ਪ੍ਰੋਫ਼ਾਈਲ ਨੂੰ ਪਛਾਣਨ ਲਈ ਕਈ ਚੱਕਰਾਂ ਤੱਕ ਅਭਿਆਸ ਕਰਨਾ ਪੈਂਦਾ ਹੈ। ਹੋਰ ਸੰਕੇਤਾਂ ਦੇ ਨਾਲ ਹਰ ਰੋਜ਼ ਇਸ ਤਬਦੀਲੀ ਨੂੰ ਦੇਖਣਾ ਤੁਹਾਨੂੰ ਆਪਣੇ ਉਪਜਾਊ ਸਮੇਂ ਨੂੰ ਬਿਹਤਰ ਪਛਾਣਨ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ — ਪਰ ਜੇ ਤੁਹਾਨੂੰ ਚਿੰਤਾ ਹੋਵੇ ਤਾਂ ਇਹ ਡਾਕਟਰੀ ਸਲਾਹ ਦੀ ਥਾਂ ਕਦੇ ਨਹੀਂ ਲੈਂਦਾ।',
    tipTitle: 'ਜਾਣਨ ਯੋਗ',
    tipText:
      'ਬੱਚੇਦਾਨੀ ਦੇ ਮੂੰਹ ਦੇ ਰਿਸਾਅ ਨੂੰ ਆਪਣੇ ਆਰਾਮ ਵੇਲੇ ਦੇ ਸਰੀਰਕ ਤਾਪਮਾਨ ਜਾਂ ਓਵੂਲੇਸ਼ਨ ਟੈਸਟਾਂ ਨਾਲ ਜੋੜਨ ਨਾਲ ਤੁਹਾਡੇ ਚੱਕਰ ਦੀ ਵਧੇਰੇ ਪੂਰੀ ਤਸਵੀਰ ਮਿਲਦੀ ਹੈ।',
    summaryPoints: [
      'ਐਸਟ੍ਰੋਜਨ ਅਤੇ ਪ੍ਰੋਜੈਸਟ੍ਰੋਨ ਦੇ ਪ੍ਰਭਾਵ ਨਾਲ ਬੱਚੇਦਾਨੀ ਦੇ ਮੂੰਹ ਦੇ ਰਿਸਾਅ ਦੀ ਬਣਤਰ ਚੱਕਰ ਦੌਰਾਨ ਬਦਲਦੀ ਰਹਿੰਦੀ ਹੈ।',
      'ਓਵੂਲੇਸ਼ਨ ਨੇੜੇ ਆਉਣ ’ਤੇ ਇਹ ਸਾਫ਼, ਖਿੱਚਿਆ ਜਾਣ ਵਾਲਾ ਅਤੇ ਲਚਕੀਲਾ ਹੋ ਜਾਂਦਾ ਹੈ, ਕੱਚੇ ਆਂਡੇ ਦੀ ਸਫ਼ੈਦੀ ਵਰਗਾ।',
      'ਹੋਰ ਸੰਕੇਤਾਂ ਦੇ ਨਾਲ ਹਰ ਰੋਜ਼ ਇਸ ਤਬਦੀਲੀ ਨੂੰ ਦੇਖਣਾ ਤੁਹਾਨੂੰ ਆਪਣੇ ਉਪਜਾਊ ਸਮੇਂ ਨੂੰ ਬਿਹਤਰ ਪਛਾਣਨ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
      'ਆਪਣੇ ਪੈਟਰਨ ਨੂੰ ਪਛਾਣਨ ਲਈ ਅਭਿਆਸ ਅਤੇ ਕਈ ਚੱਕਰਾਂ ਦੇ ਨਿਰੀਖਣ ਦੀ ਲੋੜ ਹੁੰਦੀ ਹੈ।',
    ],
    disclaimerText:
      'ਇਹ ਜਾਣਕਾਰੀ ਲਈ ਹੈ। ਇਹ ਲੇਖ ਨਿੱਜੀ ਡਾਕਟਰੀ ਸਲਾਹ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦਾ। ਸ਼ੱਕ ਹੋਣ ’ਤੇ ਕਿਸੇ ਸਿਹਤ ਮਾਹਿਰ ਤੋਂ ਸਲਾਹ ਲਓ।',
    shareMessage: 'ਆਪਣੇ ਬੱਚੇਦਾਨੀ ਦੇ ਮੂੰਹ ਦੇ ਰਿਸਾਅ ਨੂੰ ਦੇਖਣਾ — AWA',
  },
  my: {
    badge: 'သန္ဓေတည်နိုင်စွမ်း • သားအိမ်ခေါင်းအချွဲ',
    title: 'သင်၏ သားအိမ်ခေါင်းအချွဲကို\nလေ့လာခြင်း',
    metaDuration: 'ဖတ်ချိန် 5 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အလယ်အလတ်အဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'သင့်သန္ဓေတည်လွယ်သည့်ကာလကို ရှာဖွေရန် သဘာဝကျပြီး အခမဲ့ ဖြစ်သော အချက်ပြမှုတစ်ခု။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'သားအိမ်ခေါင်းအချွဲဆိုသည်မှာ အဘယ်နည်း။',
      'ရာသီစက်ဝန်းတစ်လျှောက် ပြောင်းလဲပုံ',
      'သန္ဓေတည်လွယ်သော အချွဲကို မှတ်သားခြင်း',
      'နေ့စဉ် လေ့လာပုံ',
      'သင့်လေ့လာမှုကို သက်ရောက်စေနိုင်သည့်အရာများ',
      'ဤနည်းလမ်း၏ ကန့်သတ်ချက်များ',
      'အဓိကအချက်များ',
    ],
    section1Body:
      'ဤသည်မှာ သားအိမ်ခေါင်းမှ ထုတ်လုပ်သော သဘာဝအရည်ဖြစ်သည်။ သားအိမ်ခေါင်းအချွဲသည် အက်စ်ထရိုဂျင်နှင့် ပရိုဂျက်စတီရုန်း၏ သက်ရောက်မှုကြောင့် ရာသီစက်ဝန်းတစ်လျှောက် အရည်အသွေး ပြောင်းလဲသည်။',
    cycleEvolution: [
      {
        title: 'ရာသီလာပြီးနောက်',
        text: 'အချွဲ အနည်းငယ်၊ မကြာခဏ ခြောက်သွေ့သလို ခံစားရသည်။',
      },
      {
        title: 'မျိုးဥမကြွေမီ',
        text: 'ပိုများပြီး ဖြူဖွေးကာ ကပ်ညိသည်။',
      },
      {
        title: 'မျိုးဥကြွေချိန် နီးလာသောအခါ',
        text: 'ကြည်လင်ပြီး ဆန့်လို့ရကာ ပျော့ပြောင်းသည်။ ကြက်ဥအကြည်ကဲ့သို့ ဖြစ်သည်။',
      },
      {
        title: 'မျိုးဥကြွေပြီးနောက်',
        text: 'ပိုထူ၊ ပိုမှုန်ပြီး သို့မဟုတ် အလွန်နည်းသွားသည်။',
      },
    ],
    section3Intro: 'မျိုးဥကြွေချိန် နီးလာသောအခါ ၎င်းသည် အောက်ပါအတိုင်း ဖြစ်လာသည်။',
    fertileSigns: [
      'ကြည်လင်သော သို့မဟုတ် အလင်းဖောက်ဝင်သော',
      'ဆန့်လို့ရသော၊ လက်ချောင်းနှစ်ချောင်းကြားတွင် ဆန့်ထွက်သည်',
      'ကြက်ဥအကြည်ကဲ့သို့ ပျော့ပြောင်းသော',
      'အခြားရက်များထက် ပိုများသော',
    ],
    infoTitle: 'နေ့စဉ် ရိုးရှင်းသော အလေ့အထ',
    infoText:
      'အိမ်သာစက္ကူ သို့မဟုတ် သန့်ရှင်းသော လက်ချောင်းများဖြင့် နေ့စဉ် အကြမ်းဖျင်း အချိန်တူတွင် အသွင်အပြင်နှင့် အရည်အသွေးကို လေ့လာပြီး သတိထားမိသည့်အရာကို မှတ်ထားပါ။',
    modifyingFactors: [
      'မကြာသေးမီက လိင်ဆက်ဆံခြင်း',
      'ကိုယ်ရေးကိုယ်တာ သန့်ရှင်းရေးပစ္စည်းများ',
      'ဟော်မုန်းကိုယ်ဝန်တားနည်း သို့မဟုတ် အချို့သော ကုထုံးများ',
      'ရောဂါပိုးဝင်ခြင်း သို့မဟုတ် ဒေသဆိုင်ရာ မညီမျှမှု',
    ],
    section6Body:
      'လူတိုင်းတွင် မတူညီသော ပုံစံရှိပြီး ကိုယ်ပိုင်ပုံစံကို မှတ်သားနိုင်ရန် ရာသီစက်ဝန်းအတော်များများ လေ့ကျင့်ရသည်။ ဤပြောင်းလဲမှုကို အခြားလက္ခဏာများနှင့်အတူ နေ့စဉ်လေ့လာခြင်းက သင့်သန္ဓေတည်လွယ်သည့်ကာလကို ပိုတိကျစွာ သိရှိရန် ကူညီသော်လည်း စိုးရိမ်ပူပန်စရာရှိပါက ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်ကို ဘယ်တော့မှ အစားမထိုးနိုင်ပါ။',
    tipTitle: 'သိထားသင့်သည်',
    tipText:
      'သားအိမ်ခေါင်းအချွဲကို သင့်အခြေခံ ကိုယ်အပူချိန် သို့မဟုတ် မျိုးဥကြွေခြင်း စစ်ဆေးမှုများနှင့် ပေါင်းစပ်ခြင်းဖြင့် သင့်ရာသီစက်ဝန်း၏ ပိုမိုပြည့်စုံသော ပုံရိပ်ကို ရနိုင်သည်။',
    summaryPoints: [
      'သားအိမ်ခေါင်းအချွဲသည် အက်စ်ထရိုဂျင်နှင့် ပရိုဂျက်စတီရုန်း၏ သက်ရောက်မှုကြောင့် ရာသီစက်ဝန်းတစ်လျှောက် အရည်အသွေး ပြောင်းလဲသည်။',
      'မျိုးဥကြွေချိန် နီးလာသောအခါ ကြည်လင်ပြီး ဆန့်လို့ရကာ ကြက်ဥအကြည်ကဲ့သို့ ပျော့ပြောင်းလာသည်။',
      'ဤပြောင်းလဲမှုကို အခြားလက္ခဏာများနှင့်အတူ နေ့စဉ်လေ့လာခြင်းက သင့်သန္ဓေတည်လွယ်သည့်ကာလကို ပိုတိကျစွာ သိရှိရန် ကူညီသည်။',
      'သင့်ကိုယ်ပိုင်ပုံစံကို မှတ်သားရန် လေ့ကျင့်မှုနှင့် ရာသီစက်ဝန်းအတော်များများ လေ့လာမှု လိုအပ်သည်။',
    ],
    disclaimerText:
      '၎င်းသည် အချက်အလက်ပေးရန်ဖြစ်ပြီး ကိုယ်ပိုင်ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်ကို အစားထိုးခြင်းမရှိပါ။ သံသယရှိပါက ကျန်းမာရေးပညာရှင်ထံ လမ်းညွှန်ချက် တောင်းခံပါ။',
    shareMessage: 'သင်၏ သားအိမ်ခေါင်းအချွဲကို လေ့လာခြင်း — AWA',
  },
  km: {
    badge: 'ភាពមានកូន • ទឹករំអិលមាត់ស្បូន',
    title: 'ការសង្កេត\nទឹករំអិលមាត់ស្បូនរបស់អ្នក',
    metaDuration: 'អាន 5 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតមធ្យម',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'សញ្ញាធម្មជាតិ និងឥតគិតថ្លៃសម្រាប់កំណត់រយៈពេលមានកូនងាយរបស់អ្នក។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'តើទឹករំអិលមាត់ស្បូនជាអ្វី?',
      'របៀបដែលវាប្រែប្រួលពេញមួយវដ្តរដូវ',
      'ការស្គាល់ទឹករំអិលនៃរយៈពេលមានកូនងាយ',
      'របៀបសង្កេតវាជារៀងរាល់ថ្ងៃ',
      'អ្វីដែលអាចប៉ះពាល់ដល់ការសង្កេតរបស់អ្នក',
      'ដែនកំណត់នៃវិធីសាស្ត្រនេះ',
      'ចំណុចសំខាន់ៗ',
    ],
    section1Body:
      'វាជាសារធាតុរាវធម្មជាតិដែលផលិតដោយមាត់ស្បូន។ ទឹករំអិលមាត់ស្បូនប្តូរវាយនភាពពេញមួយវដ្តរដូវ ក្រោមឥទ្ធិពលនៃអ៊ែស្ត្រូសែន និងប្រូសេស្តេរ៉ូន។',
    cycleEvolution: [
      {
        title: 'ក្រោយរដូវរបស់អ្នក',
        text: 'ទឹករំអិលតិច ជាញឹកញាប់មានអារម្មណ៍ស្ងួត។',
      },
      {
        title: 'មុនការបញ្ចេញពងអូវុល',
        text: 'កាន់តែច្រើន ស្រអាប់ និងស្អិត។',
      },
      {
        title: 'នៅពេលជិតបញ្ចេញពងអូវុល',
        text: 'ថ្លា ដែលអាចទាញបាន និងយឺត ស្រដៀងនឹងសជុំពងមាន់ឆៅ។',
      },
      {
        title: 'ក្រោយការបញ្ចេញពងអូវុល',
        text: 'ខាប់ជាង អាប់ ឬមានតិចជាងមុនខ្លាំង។',
      },
    ],
    section3Intro: 'នៅពេលជិតបញ្ចេញពងអូវុល វាក្លាយជា៖',
    fertileSigns: [
      'ថ្លា ឬច្បាស់',
      'អាចទាញបាន — វាលាតចេញរវាងម្រាមដៃពីរ',
      'យឺត ស្រដៀងនឹងសជុំពងមាន់ឆៅ',
      'កាន់តែច្រើនជាងថ្ងៃដទៃទៀត',
    ],
    infoTitle: 'ទម្លាប់សាមញ្ញមួយ រាល់ថ្ងៃ',
    infoText:
      'សង្កេតមើលរូបរាង និងវាយនភាព ដោយប្រើក្រដាសអនាម័យ ឬម្រាមដៃស្អាត នៅម៉ោងប្រហាក់ប្រហែលគ្នាក្នុងមួយថ្ងៃ ហើយកត់ត្រាអ្វីដែលអ្នកសង្កេតឃើញ។',
    modifyingFactors: [
      'ការរួមភេទថ្មីៗ',
      'ផលិតផលអនាម័យផ្នែកស្ត្រី',
      'ការពន្យារកំណើតដោយអរម៉ូន ឬការព្យាបាលមួយចំនួន',
      'ការឆ្លងមេរោគ ឬភាពមិនស្មើគ្នានៅតំបន់ក្នុង',
    ],
    section6Body:
      'មនុស្សគ្រប់គ្នាមានលក្ខណៈខុសគ្នា ហើយការស្គាល់លក្ខណៈផ្ទាល់ខ្លួនត្រូវការការអនុវត្តជាច្រើនវដ្តរដូវ។ ការសង្កេតការផ្លាស់ប្តូរនេះរាល់ថ្ងៃ រួមជាមួយសញ្ញាផ្សេងទៀត ជួយអ្នកកំណត់រយៈពេលមានកូនងាយបានកាន់តែច្បាស់ — ប៉ុន្តែវាមិនដែលជំនួសដំបូន្មានពេទ្យឡើយ ប្រសិនបើអ្នកមានការព្រួយបារម្ភ។',
    tipTitle: 'គួរដឹង',
    tipText:
      'ការរួមបញ្ចូលទឹករំអិលមាត់ស្បូនជាមួយសីតុណ្ហភាពរាងកាយមូលដ្ឋាន ឬតេស្តការបញ្ចេញពងអូវុលរបស់អ្នក ផ្តល់រូបភាពពេញលេញជាងអំពីវដ្តរដូវរបស់អ្នក។',
    summaryPoints: [
      'ទឹករំអិលមាត់ស្បូនប្តូរវាយនភាពពេញមួយវដ្តរដូវ ក្រោមឥទ្ធិពលនៃអ៊ែស្ត្រូសែន និងប្រូសេស្តេរ៉ូន។',
      'នៅពេលជិតបញ្ចេញពងអូវុល វាក្លាយជាថ្លា ទាញបាន និងយឺត ស្រដៀងនឹងសជុំពងមាន់ឆៅ។',
      'ការសង្កេតការផ្លាស់ប្តូរនេះរាល់ថ្ងៃ រួមជាមួយសញ្ញាផ្សេងទៀត ជួយអ្នកកំណត់រយៈពេលមានកូនងាយបានកាន់តែច្បាស់។',
      'ការស្គាល់គំរូផ្ទាល់ខ្លួនរបស់អ្នកត្រូវការការអនុវត្ត និងការសង្កេតជាច្រើនវដ្តរដូវ។',
    ],
    disclaimerText:
      'នេះជាព័ត៌មានទូទៅ ហើយមិនជំនួសដំបូន្មានពីវេជ្ជបណ្ឌិតទេ។ អត្ថបទនេះមិនជំនួសដំបូន្មានពេទ្យផ្ទាល់ខ្លួនទេ។ ប្រសិនបើមានការសង្ស័យ សូមសុំការណែនាំពីអ្នកជំនាញសុខាភិបាល។',
    shareMessage: 'ការសង្កេតទឹករំអិលមាត់ស្បូនរបស់អ្នក — AWA',
  },
  lo: {
    badge: 'ຄວາມສາມາດໃນການຕັ້ງຄັນ • ເມືອກປາກມົດລູກ',
    title: 'ການສັງເກດ\nເມືອກປາກມົດລູກຂອງທ່ານ',
    metaDuration: 'ອ່ານ 5 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບກາງ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ສັນຍານຕາມທຳມະຊາດທີ່ບໍ່ເສຍຄ່າ ເພື່ອສັງເກດໄລຍະມີໂອກາດຕັ້ງຄັນສູງຂອງທ່ານ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ເມືອກປາກມົດລູກແມ່ນຫຍັງ?',
      'ມັນປ່ຽນແປງຕະຫຼອດຮອບເດືອນແນວໃດ',
      'ການຮັບຮູ້ເມືອກໃນໄລຍະມີໂອກາດຕັ້ງຄັນສູງ',
      'ວິທີສັງເກດທຸກມື້',
      'ສິ່ງທີ່ອາດມີຜົນຕໍ່ການສັງເກດຂອງທ່ານ',
      'ຂໍ້ຈຳກັດຂອງວິທີນີ້',
      'ຈຸດສຳຄັນ',
    ],
    section1Body:
      'ມັນແມ່ນສິ່ງຫຼັ່ງຕາມທຳມະຊາດທີ່ຜະລິດຈາກປາກມົດລູກ. ເມືອກປາກມົດລູກປ່ຽນລັກສະນະຕະຫຼອດຮອບເດືອນ ພາຍໃຕ້ຜົນຂອງເອສໂຕຣເຈັນ ແລະ ໂປຣເຈສເຕໂຣນ.',
    cycleEvolution: [
      {
        title: 'ຫຼັງປະຈຳເດືອນ',
        text: 'ມີເມືອກໜ້ອຍ ມັກຮູ້ສຶກແຫ້ງ.',
      },
      {
        title: 'ກ່ອນການຕົກໄຂ່',
        text: 'ມີຫຼາຍຂຶ້ນ, ຂຸ່ນ ແລະ ເໜຽວ.',
      },
      {
        title: 'ເມື່ອໃກ້ການຕົກໄຂ່',
        text: 'ໃສ, ຍືດໄດ້ ແລະ ຢືດຢຸ່ນ ຄືກັບໄຂ່ຂາວດິບ.',
      },
      {
        title: 'ຫຼັງການຕົກໄຂ່',
        text: 'ຂຸ້ນຂຶ້ນ, ທຶບ ຫຼື ມີໜ້ອຍລົງຫຼາຍ.',
      },
    ],
    section3Intro: 'ເມື່ອໃກ້ການຕົກໄຂ່ ມັນຈະກາຍເປັນ:',
    fertileSigns: [
      'ໃສ ຫຼື ໂປ່ງແສງ',
      'ຍືດໄດ້ — ຍືດອອກລະຫວ່າງນິ້ວມືສອງນິ້ວ',
      'ຢືດຢຸ່ນ ຄືກັບໄຂ່ຂາວດິບ',
      'ມີຫຼາຍກວ່າມື້ອື່ນໆ',
    ],
    infoTitle: 'ນິໄສງ່າຍໆ ທຸກມື້',
    infoText:
      'ສັງເກດລັກສະນະ ແລະ ເນື້ອສຳຜັດ ໂດຍໃຊ້ເຈ້ຍອະນາໄມ ຫຼື ນິ້ວມືທີ່ສະອາດ ໃນເວລາປະມານດຽວກັນຂອງມື້ ແລະ ຈົດສິ່ງທີ່ທ່ານສັງເກດເຫັນ.',
    modifyingFactors: [
      'ການມີເພດສຳພັນເມື່ອບໍ່ດົນມານີ້',
      'ຜະລິດຕະພັນອະນາໄມສ່ວນຕົວ',
      'ການຄຸມກຳເນີດດ້ວຍຮໍໂມນ ຫຼື ການຮັກສາບາງຢ່າງ',
      'ການຕິດເຊື້ອ ຫຼື ຄວາມບໍ່ສົມດຸນໃນບ່ອນນັ້ນ',
    ],
    section6Body:
      'ແຕ່ລະຄົນມີຮູບແບບແຕກຕ່າງກັນ ແລະ ການຮັບຮູ້ຮູບແບບຂອງຕົນເອງຕ້ອງໃຊ້ການຝຶກຫຼາຍຮອບເດືອນ. ການສັງເກດການປ່ຽນແປງນີ້ທຸກມື້ ຄຽງຄູ່ກັບສັນຍານອື່ນໆ ຊ່ວຍໃຫ້ທ່ານກຳນົດໄລຍະມີໂອກາດຕັ້ງຄັນສູງໄດ້ດີຂຶ້ນ — ແຕ່ບໍ່ເຄີຍແທນຄຳແນະນຳທາງການແພດ ຖ້າທ່ານກັງວົນ.',
    tipTitle: 'ຄວນຮູ້',
    tipText:
      'ການລວມເມືອກປາກມົດລູກກັບອຸນຫະພູມຮ່າງກາຍພື້ນຖານ ຫຼື ການທົດສອບການຕົກໄຂ່ ໃຫ້ພາບຮອບເດືອນຂອງທ່ານຄົບຖ້ວນຂຶ້ນ.',
    summaryPoints: [
      'ເມືອກປາກມົດລູກປ່ຽນລັກສະນະຕະຫຼອດຮອບເດືອນ ພາຍໃຕ້ຜົນຂອງເອສໂຕຣເຈັນ ແລະ ໂປຣເຈສເຕໂຣນ.',
      'ເມື່ອໃກ້ການຕົກໄຂ່ ມັນຈະໃສ, ຍືດໄດ້ ແລະ ຢືດຢຸ່ນ ຄືກັບໄຂ່ຂາວດິບ.',
      'ການສັງເກດການປ່ຽນແປງນີ້ທຸກມື້ ຄຽງຄູ່ກັບສັນຍານອື່ນໆ ຊ່ວຍໃຫ້ທ່ານກຳນົດໄລຍະມີໂອກາດຕັ້ງຄັນສູງໄດ້ດີຂຶ້ນ.',
      'ການຮັບຮູ້ຮູບແບບຂອງຕົນເອງຕ້ອງໃຊ້ການຝຶກ ແລະ ການສັງເກດຫຼາຍຮອບເດືອນ.',
    ],
    disclaimerText:
      'ນີ້ແມ່ນຂໍ້ມູນທົ່ວໄປ ແລະ ບໍ່ແທນຄຳແນະນຳຂອງແພດ. ບົດຄວາມນີ້ບໍ່ແທນຄຳແນະນຳທາງການແພດສະເພາະບຸກຄົນ. ຖ້າມີຂໍ້ສົງໄສ ກະລຸນາຂໍຄຳແນະນຳຈາກຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
    shareMessage: 'ການສັງເກດເມືອກປາກມົດລູກຂອງທ່ານ — AWA',
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
