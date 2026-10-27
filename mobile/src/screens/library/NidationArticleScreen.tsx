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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'conceptiontips-comprendre-nidation';

const HERO = require('../../assets/images/library/featured-cycle.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('Nidation', {
  fr: {
    badge: 'NIDATION',
    title: 'Comprendre\nla nidation',
    metaDuration: '5 min de lecture',
    metaType: 'Article',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro:
      'Ce qui se passe entre la fécondation et le test de grossesse positif.',
    contentsTitle: 'Dans cet article',
    topics: [
      'De la fécondation à la nidation',
      'Les signes possibles, sans certitude',
      'Quand un test devient fiable',
      'À retenir',
    ],
    body1:
      'Après la fécondation, l’œuf met généralement 6 à 10 jours pour atteindre l’utérus et s’y implanter : c’est la nidation. Cette étape marque le véritable point de départ de la grossesse.',
    body2:
      'De légers saignements ou tiraillements peuvent parfois accompagner la nidation, sans que ce soit systématique ni un signe fiable à lui seul.',
    possibleSigns: [
      'De très légers saignements, parfois appelés « spotting »',
      'De légères tensions dans le bas-ventre',
      'Aucun signe particulier, pour beaucoup de femmes',
    ],
    tip1Title: 'Bon à savoir',
    tip1Text:
      'L’absence de signe ne veut rien dire : de nombreuses grossesses débutent sans aucun symptôme perceptible à ce stade.',
    body3:
      'C’est seulement après l’implantation que l’hormone hCG commence à être produite, et devient détectable par un test de grossesse. Faire un test trop tôt peut donner un résultat faussement négatif.',
    alertTitle: 'À noter',
    alertText:
      'Attendre le jour présumé des règles avant de tester donne un résultat plus fiable qu’un test réalisé trop précocement.',
    tip2Title: 'Bon à savoir',
    tip2Text:
      'La nidation se déroule discrètement, avec ou sans signe visible. Un peu de patience avant de tester t’évite un résultat peu fiable.',
    shareMessage: 'Comprendre la nidation — AWA',
  },
  en: {
    badge: 'IMPLANTATION',
    title: 'Understanding\nimplantation',
    metaDuration: '5 min read',
    metaType: 'Article',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro:
      'What happens between fertilization and a positive pregnancy test.',
    contentsTitle: 'In this article',
    topics: [
      'From fertilization to implantation',
      'Possible signs, without certainty',
      'When a test becomes reliable',
      'Key takeaways',
    ],
    body1:
      'After fertilization, the egg usually takes 6 to 10 days to reach the uterus and implant there: this is implantation. This step marks the true starting point of pregnancy.',
    body2:
      'Light bleeding or cramping can sometimes accompany implantation, though this isn’t systematic, nor a reliable sign on its own.',
    possibleSigns: [
      'Very light bleeding, sometimes called "spotting"',
      'Mild cramping in the lower abdomen',
      'No particular sign at all, for many women',
    ],
    tip1Title: 'Good to know',
    tip1Text:
      'The absence of a sign doesn’t mean anything: many pregnancies begin without any noticeable symptom at this stage.',
    body3:
      'It’s only after implantation that the hCG hormone starts being produced and becomes detectable by a pregnancy test. Testing too early can give a falsely negative result.',
    alertTitle: 'Note',
    alertText:
      'Waiting until the presumed day of your period before testing gives a more reliable result than testing too early.',
    tip2Title: 'Good to know',
    tip2Text:
      'Implantation happens discreetly, with or without a visible sign. A little patience before testing saves you from an unreliable result.',
    shareMessage: 'Understanding implantation — AWA',
  },
  es: {
    badge: 'NIDACIÓN',
    title: 'Comprende\nla nidación',
    metaDuration: '5 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro:
      'Lo que ocurre entre la fecundación y una prueba de embarazo positiva.',
    contentsTitle: 'En este artículo',
    topics: [
      'De la fecundación a la nidación',
      'Posibles señales, sin certeza',
      'Cuándo una prueba se vuelve fiable',
      'Para recordar',
    ],
    body1:
      'Después de la fecundación, el óvulo fecundado suele tardar de 6 a 10 días en llegar al útero e implantarse en él: esto es la nidación. Esta etapa marca el verdadero punto de partida del embarazo.',
    body2:
      'Un ligero sangrado o algunos tirones pueden a veces acompañar la nidación, sin que esto sea sistemático ni una señal fiable por sí sola.',
    possibleSigns: [
      'Un sangrado muy ligero, a veces llamado "spotting"',
      'Ligeras tensiones en la parte baja del vientre',
      'Ninguna señal en particular, para muchas mujeres',
    ],
    tip1Title: 'DATO ÚTIL',
    tip1Text:
      'La ausencia de señales no significa nada: muchos embarazos comienzan sin ningún síntoma perceptible en esta etapa.',
    body3:
      'Solo después de la implantación comienza a producirse la hormona hCG, que se vuelve detectable mediante una prueba de embarazo. Hacerte la prueba demasiado pronto puede dar un resultado falsamente negativo.',
    alertTitle: 'Nota',
    alertText:
      'Esperar hasta el día presunto de tu período antes de hacerte la prueba da un resultado más fiable que una prueba realizada demasiado pronto.',
    tip2Title: 'DATO ÚTIL',
    tip2Text:
      'La nidación ocurre de forma discreta, con o sin señales visibles. Un poco de paciencia antes de hacerte la prueba te evita un resultado poco fiable.',
    shareMessage: 'Comprende la nidación — AWA',
  },
  it: {
    badge: 'IMPIANTO',
    title: 'Capire\nl’impianto',
    metaDuration: '5 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Che cosa succede tra la fecondazione e un test di gravidanza positivo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Dalla fecondazione all’impianto',
      'Possibili segni, senza certezze',
      'Quando un test diventa affidabile',
      'Punti chiave',
    ],
    body1: 'Dopo la fecondazione, l’ovulo impiega di solito da 6 a 10 giorni per raggiungere l’utero e impiantarsi: è l’impianto. Questa tappa segna il vero punto di partenza della gravidanza.',
    body2: 'Un lieve sanguinamento o dei crampi possono talvolta accompagnare l’impianto, ma non è sistematico e non è un segno affidabile da solo.',
    possibleSigns: [
      'Un sanguinamento molto lieve, a volte chiamato «spotting»',
      'Lievi crampi nel basso ventre',
      'Nessun segno particolare, per molte donne',
    ],
    tip1Title: 'Da sapere',
    tip1Text: 'L’assenza di segni non significa nulla: molte gravidanze iniziano senza alcun sintomo percepibile in questa fase.',
    body3: 'È solo dopo l’impianto che l’ormone hCG inizia a essere prodotto e diventa rilevabile da un test di gravidanza. Fare il test troppo presto può dare un risultato falsamente negativo.',
    alertTitle: 'Nota',
    alertText: 'Aspettare il giorno presunto del periodo mestruale prima di fare il test dà un risultato più affidabile rispetto a farlo troppo presto.',
    tip2Title: 'Da sapere',
    tip2Text: 'L’impianto avviene in modo discreto, con o senza un segno visibile. Un po’ di pazienza prima del test ti evita un risultato poco affidabile.',
    shareMessage: 'Capire l’impianto — AWA',
  },
  tr: {
    badge: 'İMPLANTASYON',
    title: 'İmplantasyonu\nanlamak',
    metaDuration: '5 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Döllenme ile pozitif gebelik testi arasında neler olur.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Döllenmeden implantasyona',
      'Olası belirtiler, kesinlik olmadan',
      'Test ne zaman güvenilir olur',
      'Öne çıkanlar',
    ],
    body1: 'Döllenmeden sonra yumurta genellikle rahme ulaşıp orada yerleşmesi için 6 ila 10 gün alır: buna implantasyon denir. Bu adım, gebeliğin gerçek başlangıç noktasını oluşturur.',
    body2: 'Hafif bir kanama ya da kramp bazen implantasyona eşlik edebilir; ancak bu her zaman olmaz ve tek başına güvenilir bir belirti değildir.',
    possibleSigns: [
      'Bazen “lekelenme” olarak adlandırılan çok hafif kanama',
      'Alt karında hafif kramplar',
      'Birçok kadında hiçbir belirti olmaması',
    ],
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Belirti olmaması hiçbir şey ifade etmez: birçok gebelik bu aşamada fark edilir bir belirti olmadan başlar.',
    body3: 'hCG hormonu ancak implantasyondan sonra üretilmeye başlar ve gebelik testiyle saptanabilir hale gelir. Çok erken test yapmak yanlış negatif sonuç verebilir.',
    alertTitle: 'Not',
    alertText: 'Test yapmadan önce adetinin beklenen gününe kadar beklemek, çok erken test yapmaya göre daha güvenilir bir sonuç verir.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'İmplantasyon, görünür bir belirti olsun ya da olmasın sessizce gerçekleşir. Test yapmadan önce biraz sabretmek, güvenilmez bir sonuçtan seni korur.',
    shareMessage: 'İmplantasyonu anlamak — AWA',
  },
  ru: {
    badge: 'ИМПЛАНТАЦИЯ',
    title: 'Что такое\nимплантация',
    metaDuration: '5 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Что происходит между оплодотворением и положительным тестом на беременность.',
    contentsTitle: 'В этой статье',
    topics: [
      'От оплодотворения до имплантации',
      'Возможные признаки, без уверенности',
      'Когда тест становится надёжным',
      'Главное',
    ],
    body1: 'После оплодотворения яйцеклетке обычно требуется от 6 до 10 дней, чтобы достичь матки и закрепиться в ней: это и есть имплантация. Этот этап знаменует собой настоящее начало беременности.',
    body2: 'Имплантацию иногда могут сопровождать лёгкое кровотечение или спазмы, однако это бывает не всегда и само по себе не является надёжным признаком.',
    possibleSigns: [
      'Очень скудное кровотечение, иногда его называют «мажущими выделениями»',
      'Лёгкие спазмы внизу живота',
      'У многих женщин — никаких особых признаков',
    ],
    tip1Title: 'Полезно знать',
    tip1Text: 'Отсутствие признаков ничего не значит: многие беременности начинаются без каких-либо заметных симптомов на этом этапе.',
    body3: 'Гормон хорионический гонадотропин (hCG) начинает вырабатываться только после имплантации и становится определяемым тестом на беременность. Слишком раннее тестирование может дать ложноотрицательный результат.',
    alertTitle: 'Примечание',
    alertText: 'Если подождать с тестом до предполагаемого дня начала месячных, результат будет надёжнее, чем при слишком раннем тестировании.',
    tip2Title: 'Полезно знать',
    tip2Text: 'Имплантация проходит незаметно, с видимым признаком или без него. Немного терпения перед тестом убережёт вас от ненадёжного результата.',
    shareMessage: 'Что такое имплантация — AWA',
  },
  de: {
    badge: 'EINNISTUNG',
    title: 'Die Einnistung\nverstehen',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro:
      'Was zwischen der Befruchtung und einem positiven Schwangerschaftstest passiert.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Von der Befruchtung zur Einnistung',
      'Mögliche Anzeichen, ohne Gewissheit',
      'Wann ein Test verlässlich wird',
      'Das Wichtigste in Kürze',
    ],
    body1:
      'Nach der Befruchtung braucht die Eizelle in der Regel 6 bis 10 Tage, um die Gebärmutter zu erreichen und sich dort einzunisten: Das ist die Einnistung. Dieser Schritt markiert den eigentlichen Beginn der Schwangerschaft.',
    body2:
      'Eine leichte Blutung oder ein Ziehen im Unterleib kann die Einnistung manchmal begleiten, ist aber weder immer vorhanden noch für sich allein ein verlässliches Anzeichen.',
    possibleSigns: [
      'Eine sehr leichte Blutung, manchmal „Schmierblutung“ genannt',
      'Leichtes Ziehen im Unterbauch',
      'Bei vielen Frauen gar kein besonderes Anzeichen',
    ],
    tip1Title: 'Gut zu wissen',
    tip1Text:
      'Das Fehlen von Anzeichen sagt nichts aus: Viele Schwangerschaften beginnen in diesem Stadium ohne spürbare Symptome.',
    body3:
      'Erst nach der Einnistung beginnt die Produktion des Hormons hCG, das dann mit einem Schwangerschaftstest nachweisbar wird. Ein zu früher Test kann ein falsch negatives Ergebnis liefern.',
    alertTitle: 'Hinweis',
    alertText:
      'Wenn du bis zum vermuteten Tag deiner Periode wartest, bevor du testest, ist das Ergebnis verlässlicher als bei einem zu frühen Test.',
    tip2Title: 'Gut zu wissen',
    tip2Text:
      'Die Einnistung geschieht unauffällig, mit oder ohne sichtbares Anzeichen. Ein wenig Geduld vor dem Test erspart dir ein unzuverlässiges Ergebnis.',
    shareMessage: 'Die Einnistung verstehen — AWA',
  },
  zh: {
      badge: '着床',
      title: '了解\n着床',
      metaDuration: '阅读约 5 分钟',
      metaType: '文章',
      metaLevel: '进阶',
      metaValidated: '已审阅内容',
      intro: '从受精到验孕呈阳性之间，究竟发生了什么。',
      contentsTitle: '本文内容',
      topics: [
        '从受精到着床',
        '可能的迹象，但无法确定',
        '何时验孕才可靠',
        '要点回顾',
      ],
      body1: '受精后，受精卵通常需要 6 到 10 天到达子宫并在那里着床：这就是着床。这一步标志着怀孕真正的起点。',
      body2: '着床时有时会伴随少量出血或痉挛感，但这并不是必然的，单凭这一点也不是可靠的迹象。',
      possibleSigns: [
        '非常少量的出血，有时被称为“点滴出血”',
        '下腹部轻微的痉挛感',
        '对许多女性来说，没有任何特别的迹象',
      ],
      tip1Title: '小贴士',
      tip1Text: '没有迹象并不说明什么：许多妊娠在这个阶段没有任何明显的症状。',
      body3: '只有在着床之后，hCG 激素才会开始产生，并能被验孕试纸检测到。验孕太早可能出现假阴性的结果。',
      alertTitle: '注意',
      alertText: '等到预计月经来潮的日子再验孕，比过早验孕得到的结果更可靠。',
      tip2Title: '小贴士',
      tip2Text: '着床是悄悄发生的，无论有没有可见的迹象。验孕前多一点耐心，可以让你避免得到不可靠的结果。',
      shareMessage: '了解着床 — AWA',
    },
  id: {
    badge: 'IMPLANTASI',
    title: 'Memahami\nimplantasi',
    metaDuration: '5 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Apa yang terjadi antara pembuahan dan tes kehamilan yang positif.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Dari pembuahan hingga implantasi',
      'Kemungkinan tanda, tanpa kepastian',
      'Kapan tes menjadi andal',
      'Poin penting',
    ],
    body1: 'Setelah pembuahan, sel telur biasanya membutuhkan 6 sampai 10 hari untuk mencapai rahim dan menempel di sana: inilah implantasi. Tahap ini menandai titik awal kehamilan yang sesungguhnya.',
    body2: 'Perdarahan ringan atau kram terkadang menyertai implantasi, meski hal ini tidak selalu terjadi, dan bukan tanda yang andal jika berdiri sendiri.',
    possibleSigns: [
      'Perdarahan yang sangat ringan, kadang disebut "bercak darah" (spotting)',
      'Kram ringan di perut bagian bawah',
      'Tidak ada tanda khusus sama sekali, pada banyak perempuan',
    ],
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Tidak adanya tanda bukan berarti apa-apa: banyak kehamilan dimulai tanpa gejala yang terasa pada tahap ini.',
    body3: 'Baru setelah implantasi, hormon hCG mulai diproduksi dan bisa terdeteksi oleh tes kehamilan. Melakukan tes terlalu dini bisa memberi hasil negatif palsu.',
    alertTitle: 'Catatan',
    alertText: 'Menunggu hingga perkiraan hari haidmu sebelum melakukan tes memberi hasil yang lebih andal daripada tes yang terlalu dini.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Implantasi terjadi secara diam-diam, dengan atau tanpa tanda yang terlihat. Sedikit kesabaran sebelum melakukan tes menghindarkanmu dari hasil yang tidak andal.',
    shareMessage: 'Memahami implantasi — AWA',
  },
  hi: {
    badge: 'इम्प्लांटेशन',
    title: 'इम्प्लांटेशन को\nसमझें',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'लेख',
    metaLevel: 'मध्यम स्तर',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'निषेचन और पॉज़िटिव प्रेगनेंसी टेस्ट के बीच क्या होता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'निषेचन से इम्प्लांटेशन तक',
      'संभावित संकेत, बिना किसी निश्चितता के',
      'टेस्ट कब भरोसेमंद होता है',
      'मुख्य बातें',
    ],
    body1: 'निषेचन के बाद अंडे को गर्भाशय तक पहुँचने और वहाँ जुड़ने में आमतौर पर 6 से 10 दिन लगते हैं: इसे इम्प्लांटेशन कहते हैं। यही चरण गर्भावस्था की असली शुरुआत माना जाता है।',
    body2: 'इम्प्लांटेशन के साथ कभी-कभी हल्का रक्तस्राव या ऐंठन हो सकती है, लेकिन यह हर बार नहीं होता और अकेले कोई भरोसेमंद संकेत भी नहीं है।',
    possibleSigns: [
      'बहुत हल्का रक्तस्राव, जिसे कभी-कभी "स्पॉटिंग" कहा जाता है',
      'पेट के निचले हिस्से में हल्की ऐंठन',
      'कई महिलाओं में कोई खास संकेत नहीं होता',
    ],
    tip1Title: 'जानना अच्छा है',
    tip1Text: 'किसी संकेत का न होना कुछ नहीं बताता: कई गर्भावस्थाएँ इस चरण में बिना किसी दिखने वाले लक्षण के शुरू होती हैं।',
    body3: 'इम्प्लांटेशन के बाद ही hCG हार्मोन बनना शुरू होता है और प्रेगनेंसी टेस्ट में पकड़ में आता है। बहुत जल्दी टेस्ट करने पर नतीजा ग़लत तरीके से नेगेटिव आ सकता है।',
    alertTitle: 'ध्यान दें',
    alertText: 'टेस्ट करने से पहले आपके पीरियड की अनुमानित तारीख़ तक इंतज़ार करने पर नतीजा बहुत जल्दी टेस्ट करने की तुलना में ज़्यादा भरोसेमंद मिलता है।',
    tip2Title: 'जानना अच्छा है',
    tip2Text: 'इम्प्लांटेशन चुपचाप होता है, चाहे कोई संकेत दिखे या नहीं। टेस्ट से पहले थोड़ा धैर्य रखने से आप भरोसे के लायक़ न होने वाले नतीजे से बच जाती हैं।',
    shareMessage: 'इम्प्लांटेशन को समझें — AWA',
  },
  sq: {
    badge: 'IMPLANTIMI',
    title: 'Të kuptojmë\nimplantimin',
    metaDuration: '5 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Çfarë ndodh mes pllenimit dhe një testi pozitiv shtatzënie.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Nga pllenimi te implantimi',
      'Shenja të mundshme, pa siguri',
      'Kur një test bëhet i besueshëm',
      'Çfarë të mbash mend',
    ],
    body1: 'Pas pllenimit, veza zakonisht i duhen 6 deri në 10 ditë për të arritur në mitër dhe për t’u implantuar aty: ky është implantimi. Ky hap shënon pikënisjen e vërtetë të shtatzënisë.',
    body2: 'Ndonjëherë implantimin mund ta shoqërojë një gjakderdhje e lehtë ose kramba, por kjo nuk ndodh çdoherë dhe as nuk është vetë një shenjë e besueshme.',
    possibleSigns: [
      'Gjakderdhje shumë e lehtë, që ndonjëherë quhet "njolla gjaku"',
      'Kramba të lehta në pjesën e poshtme të barkut',
      'Asnjë shenjë të veçantë, te shumë gra',
    ],
    tip1Title: 'Mirë është të dish',
    tip1Text: 'Mungesa e një shenje nuk do të thotë asgjë: shumë shtatzëni fillojnë pa asnjë simptomë të dukshme në këtë fazë.',
    body3: 'Vetëm pas implantimit fillon të prodhohet hormoni hCG dhe bëhet i zbulueshëm nga një test shtatzënie. Nëse teston shumë herët, rezultati mund të dalë gabimisht negativ.',
    alertTitle: 'Shënim',
    alertText: 'Nëse pret deri në ditën e pritur të menstruacioneve para se të testosh, rezultati është më i besueshëm sesa kur teston shumë herët.',
    tip2Title: 'Mirë është të dish',
    tip2Text: 'Implantimi ndodh në mënyrë të pavërejtur, me ose pa shenjë të dukshme. Pak durim para testit të kursen nga një rezultat i pabesueshëm.',
    shareMessage: 'Të kuptojmë implantimin — AWA',
  },
  ja: {
    badge: '着床',
    title: '着床について\n知る',
    metaDuration: '読了時間5分',
    metaType: '記事',
    metaLevel: '中級',
    metaValidated: '確認済みの内容',
    intro: '受精から妊娠検査薬が陽性になるまでの間に起こること。',
    contentsTitle: 'この記事の内容',
    topics: [
      '受精から着床まで',
      '考えられるサイン（確実ではありません）',
      '検査が信頼できるようになる時期',
      'ポイントのまとめ',
    ],
    body1: '受精したあと、卵子は通常6〜10日かけて子宮に到達し、そこに着床します。これが着床です。この段階が、妊娠の本当の始まりとなります。',
    body2: '着床に伴って、少量の出血や軽い下腹部の痛みが出ることもありますが、必ず起こるわけではなく、それだけで確かなサインとはいえません。',
    possibleSigns: [
      '「スポッティング」と呼ばれることもある、ごく少量の出血',
      '下腹部の軽い痛み',
      '多くの女性では、とくにサインはありません',
    ],
    tip1Title: '知っておきたいこと',
    tip1Text: 'サインがないことに意味はありません。この時期は、はっきりした症状がないまま始まる妊娠も多くあります。',
    body3: 'hCGホルモンが作られ、妊娠検査薬で検出できるようになるのは、着床のあとです。早すぎる時期に検査すると、実際には妊娠していても陰性と出ることがあります。',
    alertTitle: 'ご注意',
    alertText: '早すぎる時期に検査するよりも、生理予定日まで待ってから検査するほうが、信頼できる結果が得られます。',
    tip2Title: '知っておきたいこと',
    tip2Text: '着床は、目に見えるサインの有無にかかわらず、静かに起こります。検査の前に少し待つことで、信頼できない結果を避けられます。',
    shareMessage: '着床について知る — AWA',
  },
  ko: {
    badge: '착상',
    title: '착상\n이해하기',
    metaDuration: '5분 읽기',
    metaType: '아티클',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '수정부터 임신 테스트 양성이 나오기까지 어떤 일이 일어나는지 알아봐요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '수정에서 착상까지',
      '나타날 수 있는 신호, 확실하지는 않아요',
      '테스트를 믿을 수 있는 시기',
      '핵심 정리',
    ],
    body1: '수정 후 난자는 보통 6~10일에 걸쳐 자궁에 도달해 그곳에 자리를 잡아요. 이것이 착상이에요. 이 단계가 임신의 진짜 시작점이에요.',
    body2: '착상할 때 가벼운 출혈이나 복통이 나타나기도 하지만, 항상 그런 것은 아니고 그것만으로는 믿을 만한 신호도 아니에요.',
    possibleSigns: [
      '아주 가벼운 출혈, 흔히 “소량 출혈”이라고 해요',
      '아랫배의 가벼운 통증',
      '많은 여성에게는 아무런 신호도 없어요',
    ],
    tip1Title: '알아 두세요',
    tip1Text: '신호가 없다고 해서 의미가 있는 것은 아니에요. 많은 임신이 이 단계에서 눈에 띄는 증상 없이 시작돼요.',
    body3: '착상이 이루어진 뒤에야 hCG 호르몬이 만들어지기 시작하고, 임신 테스트로 검출할 수 있게 돼요. 너무 일찍 테스트하면 실제로는 임신인데 음성으로 나올 수 있어요.',
    alertTitle: '참고',
    alertText: '생리 예정일까지 기다린 뒤에 테스트하면 너무 일찍 테스트할 때보다 더 믿을 만한 결과를 얻을 수 있어요.',
    tip2Title: '알아 두세요',
    tip2Text: '착상은 눈에 보이는 신호가 있든 없든 조용히 일어나요. 테스트 전에 조금만 기다리면 믿을 수 없는 결과를 피할 수 있어요.',
    shareMessage: '착상 이해하기 — AWA',
  },
  'pt-PT': {
    badge: 'IMPLANTAÇÃO',
    title: 'Compreender\na implantação',
    metaDuration: 'Leitura de 5 min',
    metaType: 'Artigo',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'O que acontece entre a fecundação e um teste de gravidez positivo.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Da fecundação à implantação',
      'Possíveis sinais, sem certeza',
      'Quando um teste se torna fiável',
      'O essencial a reter',
    ],
    body1: 'Após a fecundação, o óvulo demora normalmente entre 6 e 10 dias a chegar ao útero e a fixar-se nele: é a implantação. Esta etapa marca o verdadeiro ponto de partida da gravidez.',
    body2: 'Uma ligeira perda de sangue ou algumas cólicas podem por vezes acompanhar a implantação, mas isso não é sistemático, nem um sinal fiável por si só.',
    possibleSigns: [
      'Uma perda de sangue muito ligeira, por vezes chamada “spotting”',
      'Cólicas leves na parte inferior do abdómen',
      'Nenhum sinal em particular, para muitas mulheres',
    ],
    tip1Title: 'Bom saber',
    tip1Text: 'A ausência de sinais não significa nada: muitas gravidezes começam sem qualquer sintoma percetível nesta fase.',
    body3: 'Só depois da implantação é que a hormona hCG começa a ser produzida e se torna detetável por um teste de gravidez. Fazer o teste demasiado cedo pode dar um resultado falsamente negativo.',
    alertTitle: 'Nota',
    alertText: 'Esperar pelo dia previsto do período antes de fazer o teste dá um resultado mais fiável do que testar demasiado cedo.',
    tip2Title: 'Bom saber',
    tip2Text: 'A implantação decorre de forma discreta, com ou sem sinal visível. Um pouco de paciência antes de fazer o teste evita um resultado pouco fiável.',
    shareMessage: 'Compreender a implantação — AWA',
  },
  bn: {
    badge: 'ইমপ্ল্যান্টেশন',
    title: 'ইমপ্ল্যান্টেশন\nবোঝা',
    metaDuration: '5 মিনিটের পাঠ',
    metaType: 'নিবন্ধ',
    metaLevel: 'মাঝারি',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'নিষেকের পর থেকে গর্ভাবস্থার পরীক্ষায় পজিটিভ ফল আসা পর্যন্ত কী ঘটে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'নিষেক থেকে ইমপ্ল্যান্টেশন',
      'সম্ভাব্য লক্ষণ, নিশ্চয়তা ছাড়া',
      'কখন পরীক্ষা নির্ভরযোগ্য হয়',
      'মূল কথা',
    ],
    body1: 'নিষেকের পর ডিম্বাণুটি সাধারণত জরায়ুতে পৌঁছে সেখানে স্থিত হতে 6 থেকে 10 দিন সময় নেয়: একেই বলে ইমপ্ল্যান্টেশন। এই ধাপটি গর্ভাবস্থার প্রকৃত সূচনাবিন্দু।',
    body2: 'ইমপ্ল্যান্টেশনের সময় কখনো কখনো হালকা রক্তপাত বা তলপেটে ব্যথা হতে পারে, তবে এটি সবসময় হয় না এবং এটি এককভাবে নির্ভরযোগ্য লক্ষণও নয়।',
    possibleSigns: [
      'খুব হালকা রক্তপাত, যাকে কখনো কখনো “স্পটিং” বলা হয়',
      'তলপেটে মৃদু ব্যথা',
      'অনেক নারীর ক্ষেত্রে কোনো বিশেষ লক্ষণই থাকে না',
    ],
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'কোনো লক্ষণ না থাকার মানে কিছুই নয়: এই পর্যায়ে অনেক গর্ভাবস্থা কোনো টের পাওয়ার মতো উপসর্গ ছাড়াই শুরু হয়।',
    body3: 'ইমপ্ল্যান্টেশনের পরই এইচসিজি হরমোন তৈরি হতে শুরু করে এবং গর্ভাবস্থার পরীক্ষায় ধরা পড়ার মতো হয়। খুব আগে পরীক্ষা করলে ভুলভাবে নেগেটিভ ফল আসতে পারে।',
    alertTitle: 'লক্ষ্য করুন',
    alertText: 'পরীক্ষা করার আগে আপনার মাসিক হওয়ার সম্ভাব্য দিন পর্যন্ত অপেক্ষা করলে খুব আগে পরীক্ষা করার চেয়ে বেশি নির্ভরযোগ্য ফল পাওয়া যায়।',
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'ইমপ্ল্যান্টেশন নীরবে ঘটে, দৃশ্যমান লক্ষণ থাকুক বা না থাকুক। পরীক্ষা করার আগে একটু ধৈর্য ধরলে অনির্ভরযোগ্য ফল এড়ানো যায়।',
    shareMessage: 'ইমপ্ল্যান্টেশন বোঝা — AWA',
  },
  da: {
    badge: 'IMPLANTATION',
    title: 'Forstå\nimplantation',
    metaDuration: '5 min læsning',
    metaType: 'Artikel',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvad der sker mellem befrugtning og en positiv graviditetstest.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Fra befrugtning til implantation',
      'Mulige tegn, uden sikkerhed',
      'Hvornår en test bliver pålidelig',
      'Vigtige pointer',
    ],
    body1: 'Efter befrugtningen tager det typisk 6 til 10 dage for ægget at nå frem til livmoderen og sætte sig fast der: det er implantationen. Dette trin markerer det egentlige startpunkt for graviditeten.',
    body2: 'Let blødning eller kramper kan sommetider ledsage implantationen, men det er ikke altid tilfældet og er ikke et pålideligt tegn i sig selv.',
    possibleSigns: [
      'Meget let blødning, som sommetider kaldes "pletblødning"',
      'Lette kramper i den nedre del af maven',
      'Ingen særlige tegn overhovedet, for mange kvinder',
    ],
    tip1Title: 'Godt at vide',
    tip1Text: 'Fraværet af tegn betyder ingenting: mange graviditeter starter uden mærkbare symptomer på dette tidspunkt.',
    body3: 'Det er først efter implantationen, at hCG-hormonet begynder at blive produceret og kan påvises med en graviditetstest. At teste for tidligt kan give et falskt negativt resultat.',
    alertTitle: 'Bemærk',
    alertText: 'Hvis du venter til den forventede dag for din menstruation, inden du tester, får du et mere pålideligt resultat end ved at teste for tidligt.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Implantationen sker diskret, med eller uden synlige tegn. Lidt tålmodighed inden testning sparer dig for et upålideligt resultat.',
    shareMessage: 'Forstå implantation — AWA',
  },
  sv: {
    badge: 'IMPLANTATION',
    title: 'Forstå\nimplantation',
    metaDuration: '5 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvad der sker mellem befrugtning och en positiv graviditetstest.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Fra befrugtning till implantation',
      'Mulige tegn, uden sikkerhed',
      'Hvornår en test bliver pålidelig',
      'Vigtige pointer',
    ],
    body1: 'Efter befrugtningen tager det typisk 6 till 10 dagar for ägget at nå frem till livmoderen och sätte sig fast der: det ar implantationen. Dette trin markerer det egentlige startpunkt for graviditeten.',
    body2: 'Let blödning eller kramper kan sommetider ledsage implantationen, men det ar inte alltid tilfäldet och ar inte et pålideligt tegn i sig selv.',
    possibleSigns: [
      'Meget let blödning, som sommetider kaldes "pletblödning"',
      'Lette kramper i den nedre del av maven',
      'Ingen särlige tegn overhovedet, for mange kvinder',
    ],
    tip1Title: 'Godt at vide',
    tip1Text: 'Fraväret av tegn betyder ingenting: mange graviditeter starter uden märkbare symtom på dette tidspunkt.',
    body3: 'Det ar först efter implantationen, at hCG-hormonet begynder at blive produceret och kan påvises med en graviditetstest. At teste for tidligt kan give et falskt negativt resultat.',
    alertTitle: 'Bemärk',
    alertText: 'Hvis du venter till den forventede dag for din menstruation, inden du tester, får du et mere pålideligt resultat end ved at teste for tidligt.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Implantationen sker diskret, med eller uden synlige tegn. Lidt tålmodighed inden testning sparer dig for et upålideligt resultat.',
    shareMessage: 'Forstå implantation — AWA',
  },
  nb: {
    badge: 'IMPLANTASJON',
    title: 'Forstå\nimplantasjonen',
    metaDuration: '5 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro:
      'Hva som skjer mellom befruktning og en positiv graviditetstest.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Fra befruktning til implantasjon',
      'Mulige tegn, uten sikkerhet',
      'Når en test blir pålitelig',
      'Det viktigste å huske',
    ],
    body1:
      'Etter befruktningen bruker egget vanligvis 6 til 10 dager på å nå livmoren og feste seg der: dette er implantasjonen. Dette trinnet markerer det virkelige utgangspunktet for graviditeten.',
    body2:
      'Lett blødning eller kramper kan noen ganger følge implantasjonen, selv om dette ikke er systematisk og heller ikke et pålitelig tegn alene.',
    possibleSigns: [
      'Svært lett blødning, noen ganger kalt «sporblødning»',
      'Milde kramper i nedre del av magen',
      'Ingen spesielle tegn i det hele tatt, for mange kvinner',
    ],
    tip1Title: 'Godt å vite',
    tip1Text:
      'Fravær av tegn betyr ingenting: mange svangerskap begynner uten noe merkbart symptom på dette stadiet.',
    body3:
      'Det er først etter implantasjonen at hormonet hCG begynner å produseres og kan påvises av en graviditetstest. Å teste for tidlig kan gi et falskt negativt resultat.',
    alertTitle: 'Merk',
    alertText:
      'Å vente til den antatte mensdagen før du tester, gir et mer pålitelig resultat enn å teste for tidlig.',
    tip2Title: 'Godt å vite',
    tip2Text:
      'Implantasjonen skjer diskret, med eller uten synlig tegn. Litt tålmodighet før du tester sparer deg for et upålitelig resultat.',
    shareMessage: 'Forstå implantasjonen – AWA',
  },
  pl: {
    badge: 'IMPLANTACJA',
    title: 'Zrozumieć\nimplantację',
    metaDuration: '5 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro:
      'Co dzieje się między zapłodnieniem a pozytywnym testem ciążowym.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Od zapłodnienia do implantacji',
      'Możliwe objawy, bez pewności',
      'Kiedy test staje się wiarygodny',
      'Najważniejsze wnioski',
    ],
    body1:
      'Po zapłodnieniu komórka jajowa potrzebuje zwykle od 6 do 10 dni, by dotrzeć do macicy i zagnieździć się w niej: to właśnie implantacja. Ten etap jest prawdziwym początkiem ciąży.',
    body2:
      'Implantacji może czasem towarzyszyć lekkie krwawienie lub skurcze, choć nie zdarza się to zawsze i nie jest to samo w sobie wiarygodny objaw.',
    possibleSigns: [
      'Bardzo lekkie krwawienie, czasem nazywane „plamieniem”',
      'Lekkie skurcze w podbrzuszu',
      'Brak jakiegokolwiek szczególnego objawu, u wielu kobiet',
    ],
    tip1Title: 'Warto wiedzieć',
    tip1Text:
      'Brak objawów nic nie znaczy: wiele ciąż zaczyna się bez żadnych zauważalnych objawów na tym etapie.',
    body3:
      'Dopiero po implantacji zaczyna być produkowany hormon hCG, który można wykryć testem ciążowym. Zbyt wczesny test może dać fałszywie ujemny wynik.',
    alertTitle: 'Uwaga',
    alertText:
      'Odczekanie do przewidywanego dnia miesiączki przed wykonaniem testu daje bardziej wiarygodny wynik niż zbyt wczesny test.',
    tip2Title: 'Warto wiedzieć',
    tip2Text:
      'Implantacja przebiega dyskretnie, z widocznym objawem lub bez. Odrobina cierpliwości przed testem oszczędza Ci niewiarygodnego wyniku.',
    shareMessage: 'Zrozumieć implantację — AWA',
  },
  uk: {
    badge: 'ІМПЛАНТАЦІЯ',
    title: 'Розуміння\nімплантації',
    metaDuration: '5 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro:
      'Що відбувається між заплідненням і позитивним тестом на вагітність.',
    contentsTitle: 'У цій статті',
    topics: [
      'Від запліднення до імплантації',
      'Можливі ознаки, без певності',
      'Коли тест стає надійним',
      'Головні висновки',
    ],
    body1:
      'Після запліднення яйцеклітина зазвичай долає шлях до матки й імплантується в ній за 6–10 днів: це імплантація. Цей етап є справжнім початком вагітності.',
    body2:
      'Імплантацію іноді можуть супроводжувати легка кровотеча або спазми, проте це трапляється не завжди й саме по собі не є надійною ознакою.',
    possibleSigns: [
      'Дуже легка кровотеча, яку іноді називають «мажучими виділеннями»',
      'Легкі спазми внизу живота',
      'Відсутність будь-яких особливих ознак — у багатьох жінок',
    ],
    tip1Title: 'Варто знати',
    tip1Text:
      'Відсутність ознак нічого не означає: багато вагітностей починаються без жодних помітних симптомів на цьому етапі.',
    body3:
      'Лише після імплантації починає вироблятися гормон ХГЛ, який можна виявити тестом на вагітність. Надто ранній тест може дати хибнонегативний результат.',
    alertTitle: 'Зверніть увагу',
    alertText:
      'Очікування передбачуваного дня менструації перед тестуванням дає надійніший результат, ніж надто ранній тест.',
    tip2Title: 'Варто знати',
    tip2Text:
      'Імплантація відбувається непомітно, з видимою ознакою або без неї. Трохи терпіння перед тестуванням убереже від ненадійного результату.',
    shareMessage: 'Розуміння імплантації — AWA',
  },
  cs: {
    badge: 'UHNÍZDĚNÍ',
    title: 'Pochopení\nuhnízdění',
    metaDuration: '5 min čtení',
    metaType: 'Článek',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro:
      'Co se děje mezi oplodněním a pozitivním těhotenským testem.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Od oplodnění k uhnízdění',
      'Možné příznaky, bez jistoty',
      'Kdy je test spolehlivý',
      'Hlavní poznatky',
    ],
    body1:
      'Po oplodnění trvá vajíčku obvykle 6 až 10 dní, než se dostane do dělohy a uhnízdí se v ní: to je uhnízdění. Tento krok označuje skutečný začátek těhotenství.',
    body2:
      'Slabé krvácení nebo křeče mohou uhnízdění někdy provázet, i když to není pravidlem ani spolehlivým příznakem samo o sobě.',
    possibleSigns: [
      'Velmi slabé krvácení, někdy nazývané „špinění“',
      'Mírné křeče v podbřišku',
      'U mnoha žen žádný zvláštní příznak',
    ],
    tip1Title: 'Stojí za to vědět',
    tip1Text:
      'Nepřítomnost příznaku nic neznamená: mnoho těhotenství začíná bez jakéhokoli znatelného příznaku v této fázi.',
    body3:
      'Teprve po uhnízdění se začíná tvořit hormon hCG, který lze těhotenským testem zachytit. Příliš časný test může dát falešně negativní výsledek.',
    alertTitle: 'Poznámka',
    alertText:
      'Počkat s testem do předpokládaného dne menstruace dává spolehlivější výsledek než testovat příliš brzy.',
    tip2Title: 'Stojí za to vědět',
    tip2Text:
      'Uhnízdění probíhá nenápadně, s viditelným příznakem či bez něj. Trocha trpělivosti před testem vás ušetří nespolehlivého výsledku.',
    shareMessage: 'Pochopení uhnízdění — AWA',
  },
  sk: {
    badge: 'IMPLANTÁCIA',
    title: 'Pochopenie\nimplantácie',
    metaDuration: '5 min čítania',
    metaType: 'Článok',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro:
      'Čo sa deje medzi oplodnením a pozitívnym tehotenským testom.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Od oplodnenia k implantácii',
      'Možné znaky, bez istoty',
      'Kedy je test spoľahlivý',
      'Hlavné body',
    ],
    body1:
      'Po oplodnení vajíčku zvyčajne trvá 6 až 10 dní, kým sa dostane do maternice a uhniezdi sa v nej: to je implantácia. Tento krok označuje skutočný začiatok tehotenstva.',
    body2:
      'Implantáciu môže niekedy sprevádzať slabé krvácanie alebo kŕče, hoci to nie je systematické ani spoľahlivý znak samo o sebe.',
    possibleSigns: [
      'Veľmi slabé krvácanie, niekedy nazývané „špinenie“',
      'Mierne kŕče v podbrušku',
      'U mnohých žien vôbec žiadny osobitný znak',
    ],
    tip1Title: 'Stojí za to vedieť',
    tip1Text:
      'Absencia znaku nič neznamená: mnohé tehotenstvá sa v tejto fáze začínajú bez akéhokoľvek viditeľného príznaku.',
    body3:
      'Až po implantácii sa začne tvoriť hormón hCG a stane sa zistiteľným tehotenským testom. Príliš skoré testovanie môže dať falošne negatívny výsledok.',
    alertTitle: 'Poznámka',
    alertText:
      'Počkať do predpokladaného dňa menštruácie pred testovaním dáva spoľahlivejší výsledok než testovať príliš skoro.',
    tip2Title: 'Stojí za to vedieť',
    tip2Text:
      'Implantácia prebieha nenápadne, s viditeľným znakom alebo bez neho. Trochu trpezlivosti pred testovaním vás ušetrí nespoľahlivého výsledku.',
    shareMessage: 'Pochopenie implantácie — AWA',
  },
  hu: {
    badge: 'BEÁGYAZÓDÁS',
    title: 'A beágyazódás\nmegértése',
    metaDuration: '5 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro:
      'Mi történik a megtermékenyítés és a pozitív terhességi teszt között.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A megtermékenyítéstől a beágyazódásig',
      'Lehetséges jelek, bizonyosság nélkül',
      'Mikor megbízható a teszt',
      'Legfontosabb tudnivalók',
    ],
    body1:
      'A megtermékenyítés után a petesejtnek általában 6–10 napra van szüksége, hogy elérje a méhet és beágyazódjon: ez a beágyazódás. Ez a lépés jelzi a terhesség valódi kezdőpontját.',
    body2:
      'A beágyazódást néha enyhe vérzés vagy görcsök kísérhetik, bár ez nem rendszeres, és önmagában nem megbízható jel.',
    possibleSigns: [
      'Nagyon enyhe vérzés, amelyet néha „pecsételésnek” neveznek',
      'Enyhe görcsök az alhasban',
      'Sok nőnél egyáltalán nincs különös jel',
    ],
    tip1Title: 'Érdemes tudni',
    tip1Text:
      'A jel hiánya nem jelent semmit: sok terhesség ebben a szakaszban semmilyen észrevehető tünet nélkül kezdődik.',
    body3:
      'Csak a beágyazódás után kezd termelődni a hCG hormon, és válik kimutathatóvá terhességi teszttel. A túl korai tesztelés álnegatív eredményt adhat.',
    alertTitle: 'Megjegyzés',
    alertText:
      'Ha megvárod a menstruációd feltételezett napját a tesztelés előtt, az megbízhatóbb eredményt ad, mint a túl korai tesztelés.',
    tip2Title: 'Érdemes tudni',
    tip2Text:
      'A beágyazódás diszkréten zajlik, látható jellel vagy anélkül. Egy kis türelem a tesztelés előtt megkíméli a megbízhatatlan eredménytől.',
    shareMessage: 'A beágyazódás megértése — AWA',
  },
  ro: {
    badge: 'NIDAȚIE',
    title: 'Înțelegerea\nnidației',
    metaDuration: '5 min de citit',
    metaType: 'Articol',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro:
      'Ce se întâmplă între fecundare și un test de sarcină pozitiv.',
    contentsTitle: 'În acest articol',
    topics: [
      'De la fecundare la nidație',
      'Semne posibile, fără certitudine',
      'Când un test devine fiabil',
      'Ce să reții',
    ],
    body1:
      'După fecundare, ovulului îi ia de obicei între 6 și 10 zile pentru a ajunge în uter și a se implanta acolo: aceasta este nidația. Această etapă marchează adevăratul punct de pornire al sarcinii.',
    body2:
      'O sângerare ușoară sau crampe pot însoți uneori nidația, deși acest lucru nu este sistematic și nici un semn fiabil de sine stătător.',
    possibleSigns: [
      'Sângerare foarte ușoară, numită uneori „spotting”',
      'Crampe ușoare în abdomenul inferior',
      'Niciun semn deosebit, la multe femei',
    ],
    tip1Title: 'Bine de știut',
    tip1Text:
      'Absența unui semn nu înseamnă nimic: multe sarcini încep fără niciun simptom vizibil în această etapă.',
    body3:
      'Abia după nidație începe să fie produs hormonul hCG, care devine detectabil printr-un test de sarcină. A testa prea devreme poate da un rezultat fals negativ.',
    alertTitle: 'Notă',
    alertText:
      'Așteptarea zilei presupuse a menstruației înainte de a testa oferă un rezultat mai fiabil decât testarea prea devreme.',
    tip2Title: 'Bine de știut',
    tip2Text:
      'Nidația are loc discret, cu sau fără semn vizibil. Puțină răbdare înainte de a testa te scutește de un rezultat nefiabil.',
    shareMessage: 'Înțelegerea nidației — AWA',
  },
  bg: {
    badge: 'ИМПЛАНТАЦИЯ',
    title: 'Разбиране на\nимплантацията',
    metaDuration: '5 мин четене',
    metaType: 'Статия',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro:
      'Какво се случва между оплождането и положителния тест за бременност.',
    contentsTitle: 'В тази статия',
    topics: [
      'От оплождането до имплантацията',
      'Възможни признаци, без сигурност',
      'Кога тестът става надежден',
      'Какво да запомниш',
    ],
    body1:
      'След оплождането на яйцеклетката ѝ трябват обикновено 6 до 10 дни, за да стигне до матката и да се имплантира там: това е имплантацията. Този етап бележи истинското начало на бременността.',
    body2:
      'Леко кървене или крампи понякога могат да съпътстват имплантацията, макар това да не е системно, нито да е надежден признак сам по себе си.',
    possibleSigns: [
      'Много леко кървене, понякога наричано „спотинг“',
      'Леки крампи в долната част на корема',
      'Никакъв особен признак изобщо, при много жени',
    ],
    tip1Title: 'Добре е да знаеш',
    tip1Text:
      'Липсата на признак не означава нищо: много бременности започват без забележим симптом на този етап.',
    body3:
      'Едва след имплантацията хормонът hCG започва да се произвежда и става откриваем от теста за бременност. Прекалено ранният тест може да даде фалшиво отрицателен резултат.',
    alertTitle: 'Забележка',
    alertText:
      'Изчакването до предполагаемия ден на менструацията, преди да тестваш, дава по-надежден резултат, отколкото прекалено ранното тестване.',
    tip2Title: 'Добре е да знаеш',
    tip2Text:
      'Имплантацията протича дискретно, със или без видим признак. Малко търпение преди теста те спасява от ненадежден резултат.',
    shareMessage: 'Разбиране на имплантацията — AWA',
  },
  sr: {
    badge: 'ИМПЛАНТАЦИЈА',
    title: 'Разумевање\nимплантације',
    metaDuration: '5 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro:
      'Шта се дешава између оплођења и позитивног теста за трудноћу.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Од оплођења до имплантације',
      'Могући знаци, без сигурности',
      'Када тест постаје поуздан',
      'Шта да запамтиш',
    ],
    body1:
      'После оплођења јајној ћелији је обично потребно 6 до 10 дана да стигне до материце и имплантира се у њу: то је имплантација. Овај корак означава прави почетак трудноће.',
    body2:
      'Лагано крварење или грчеви понекад могу пратити имплантацију, мада то није системски нити је сам по себи поуздан знак.',
    possibleSigns: [
      'Веома лагано крварење, понекад названо „спотинг“',
      'Благи грчеви у доњем делу стомака',
      'Никакав посебан знак уопште, код многих жена',
    ],
    tip1Title: 'Добро је знати',
    tip1Text:
      'Одсуство знака не значи ништа: многе трудноће почињу без видљивог симптома у овој фази.',
    body3:
      'Тек после имплантације хормон hCG почиње да се ствара и постаје откривен тестом за трудноћу. Превише рано тестирање може дати лажно негативан резултат.',
    alertTitle: 'Напомена',
    alertText:
      'Чекање до претпостављеног дана менструације пре тестирања даје поузданији резултат него превише рано тестирање.',
    tip2Title: 'Добро је знати',
    tip2Text:
      'Имплантација се одвија дискретно, са видљивим знаком или без њега. Мало стрпљења пре тестирања штеди те од непоузданог резултата.',
    shareMessage: 'Разумевање имплантације — AWA',
  },
  hr: {
    badge: 'IMPLANTACIJA',
    title: 'Razumijevanje\nimplantacije',
    metaDuration: '5 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Što se događa između oplodnje i pozitivnog testa na trudnoću.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Od oplodnje do implantacije',
      'Mogući znakovi, bez sigurnosti',
      'Kada test postaje pouzdan',
      'Ključne poruke',
    ],
    body1:
      'Nakon oplodnje jajnoj stanici obično treba 6 do 10 dana da stigne do maternice i ondje se ugnijezdi: to je implantacija. Taj korak označava pravu početnu točku trudnoće.',
    body2:
      'Lagano krvarenje ili grčevi ponekad mogu pratiti implantaciju, iako to nije sustavno niti je sam po sebi pouzdan znak.',
    possibleSigns: [
      'Vrlo slabo krvarenje, ponekad nazvano „točkasto krvarenje“',
      'Blagi grčevi u donjem dijelu trbuha',
      'Nikakav poseban znak, kod mnogih žena',
    ],
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Izostanak znaka ne znači ništa: mnoge trudnoće počinju bez ikakvog primjetnog simptoma u ovoj fazi.',
    body3:
      'Tek nakon implantacije počinje se stvarati hormon hCG koji postaje vidljiv testom na trudnoću. Prerano testiranje može dati lažno negativan rezultat.',
    alertTitle: 'Napomena',
    alertText:
      'Čekanje do pretpostavljenog dana menstruacije prije testiranja daje pouzdaniji rezultat nego prerano testiranje.',
    tip2Title: 'Dobro je znati',
    tip2Text:
      'Implantacija se događa diskretno, s vidljivim znakom ili bez njega. Malo strpljenja prije testiranja štedi te nepouzdanog rezultata.',
    shareMessage: 'Razumijevanje implantacije — AWA',
  },
  bs: {
    badge: 'IMPLANTACIJA',
    title: 'Razumijevanje\nimplantacije',
    metaDuration: '5 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Što se događa između oplodnje i pozitivnog testa na trudnoću.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Od oplodnje do implantacije',
      'Mogući znakovi, bez sigurnosti',
      'Kada test postaje pouzdan',
      'Ključne poruke',
    ],
    body1:
      'Nakon oplodnje jajnoj stanici obično treba 6 do 10 dana da stigne do maternice i ondje se ugnijezdi: to je implantacija. Taj korak označava pravu početnu tačku trudnoće.',
    body2:
      'Lagano krvarenje ili grčevi ponekad mogu pratiti implantaciju, iako to nije sistemno niti je sam po sebi pouzdan znak.',
    possibleSigns: [
      'Vrlo slabo krvarenje, ponekad nazvano „tačkasto krvarenje“',
      'Blagi grčevi u donjem dijelu trbuha',
      'Nikakav poseban znak, kod mnogih žena',
    ],
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Izostanak znaka ne znači ništa: mnoge trudnoće počinju bez ikakvog primjetnog simptoma u ovoj fazi.',
    body3:
      'Tek nakon implantacije počinje se stvarati hormon hCG koji postaje vidljiv testom na trudnoću. Prerano testiranje može dati lažno negativan rezultat.',
    alertTitle: 'Napomena',
    alertText:
      'Čekanje do pretpostavljenog dana menstruacije prije testiranja daje pouzdaniji rezultat nego prerano testiranje.',
    tip2Title: 'Dobro je znati',
    tip2Text:
      'Implantacija se događa diskretno, s vidljivim znakom ili bez njega. Malo strpljenja prije testiranja štedi te nepouzdanog rezultata.',
    shareMessage: 'Razumijevanje implantacije — AWA',
  },
  sl: {
    badge: 'IMPLANTACIJA',
    title: 'Razumevanje\nimplantacije',
    metaDuration: '5 min branja',
    metaType: 'Članek',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro:
      'Kaj se dogaja med oploditvijo in pozitivnim testom nosečnosti.',
    contentsTitle: 'V tem članku',
    topics: [
      'Od oploditve do implantacije',
      'Možni znaki, brez gotovosti',
      'Kdaj test postane zanesljiv',
      'Ključna sporočila',
    ],
    body1:
      'Po oploditvi jajčni celici običajno traja 6 do 10 dni, da doseže maternico in se tam ugnezdi: to je implantacija. Ta korak označuje pravo izhodiščno točko nosečnosti.',
    body2:
      'Rahla krvavitev ali krči lahko včasih spremljajo implantacijo, čeprav to ni sistematično niti sam po sebi zanesljiv znak.',
    possibleSigns: [
      'Zelo šibka krvavitev, včasih imenovana „pikasta krvavitev“',
      'Blagi krči v spodnjem delu trebuha',
      'Noben poseben znak, pri mnogih ženskah',
    ],
    tip1Title: 'Vredno vedeti',
    tip1Text:
      'Odsotnost znaka ne pomeni nič: mnoge nosečnosti se začnejo brez kakršnega koli opaznega simptoma v tej fazi.',
    body3:
      'Šele po implantaciji se začne proizvajati hormon hCG, ki ga lahko zazna test nosečnosti. Prezgodnje testiranje lahko da lažno negativen rezultat.',
    alertTitle: 'Opomba',
    alertText:
      'Čakanje do domnevnega dne menstruacije pred testiranjem da zanesljivejši rezultat kot prezgodnje testiranje.',
    tip2Title: 'Vredno vedeti',
    tip2Text:
      'Implantacija poteka diskretno, z vidnim znakom ali brez njega. Malo potrpežljivosti pred testiranjem te obvaruje nezanesljivega rezultata.',
    shareMessage: 'Razumevanje implantacije — AWA',
  },
  ne: {
    badge: 'गर्भस्थापना (इम्प्लान्टेसन)',
    title: 'गर्भस्थापना\nबुझ्नुहोस्',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro:
      'निषेचन र सकारात्मक गर्भावस्था परीक्षणबीच के हुन्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'निषेचनदेखि गर्भस्थापनासम्म',
      'सम्भावित संकेतहरू, निश्चितताबिना',
      'परीक्षण कहिले भरपर्दो हुन्छ',
      'मुख्य कुराहरू',
    ],
    body1:
      'निषेचनपछि, अण्डाले गर्भाशयसम्म पुग्न र त्यहाँ बस्न सामान्यतया 6 देखि 10 दिन लिन्छ: यही गर्भस्थापना हो। यो चरणले गर्भावस्थाको वास्तविक सुरुवात बिन्दु चिह्नित गर्छ।',
    body2:
      'हल्का रक्तस्राव वा ऐंठन कहिलेकाहीँ गर्भस्थापनासँगै आउन सक्छ, यद्यपि यो व्यवस्थित होइन, न त आफैँमा भरपर्दो संकेत।',
    possibleSigns: [
      'निकै हल्का रक्तस्राव, कहिलेकाहीँ "स्पटिङ" भनिन्छ',
      'तल्लो पेटमा हल्का ऐंठन',
      'धेरै महिलाहरूका लागि कुनै विशेष संकेत नै नहुनु',
    ],
    tip1Title: 'जान्न लायक',
    tip1Text:
      'संकेत नहुनुले केही पनि जनाउँदैन: धेरै गर्भावस्थाहरू यस चरणमा कुनै देखिने लक्षणबिना सुरु हुन्छन्।',
    body3:
      'गर्भस्थापनापछि मात्र hCG हर्मोन उत्पादन हुन थाल्छ र गर्भावस्था परीक्षणद्वारा पत्ता लगाउन सकिन्छ। निकै चाँडो परीक्षण गर्दा गलत नकारात्मक नतिजा आउन सक्छ।',
    alertTitle: 'टिप्पणी',
    alertText:
      'परीक्षण गर्नुअघि महिनावारी आउने अनुमानित दिनसम्म पर्खँदा निकै चाँडो परीक्षण गर्नुभन्दा बढी भरपर्दो नतिजा आउँछ।',
    tip2Title: 'जान्न लायक',
    tip2Text:
      'गर्भस्थापना देखिने संकेतसहित वा बिना, गोप्य रूपमा हुन्छ। परीक्षणअघि अलिकति धैर्यले तपाईंलाई अभरपर्दो नतिजाबाट जोगाउँछ।',
    shareMessage: 'गर्भस्थापना बुझ्नुहोस् — AWA',
  },
  si: {
    badge: 'ගර්භාෂයේ තැන්පත් වීම',
    title: 'ගර්භාෂයේ තැන්පත් වීම\nතේරුම් ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'ලිපිය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro:
      'සංසේචනය සහ ධනාත්මක ගර්භණී පරීක්ෂණයක් අතර සිදුවන්නේ කුමක්ද.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'සංසේචනයේ සිට තැන්පත් වීම දක්වා',
      'ඇතිවිය හැකි සලකුණු, සහතිකයකින් තොරව',
      'පරීක්ෂණයක් විශ්වාසදායක වන්නේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    body1:
      'සංසේචනයෙන් පසු, ඩිම්බයට ගර්භාෂයට ළඟා වී එහි තැන්පත් වීමට සාමාන්‍යයෙන් දින 6 සිට 10 දක්වා ගතවේ: මෙය ගර්භාෂයේ තැන්පත් වීමයි. මෙම පියවර ගර්භණී කාලයේ සැබෑ ආරම්භක ලක්ෂ්‍යය සලකුණු කරයි.',
    body2:
      'සැහැල්ලු ලේ ගැලීම හෝ මාංශ පේශි සංකෝචන සමහර විට තැන්පත් වීම සමඟ පැමිණිය හැක, නමුත් මෙය ක්‍රමානුකූල නොවන අතර, තනිවම විශ්වාසදායක සලකුණක්ද නොවේ.',
    possibleSigns: [
      'ඉතා සැහැල්ලු ලේ ගැලීම, සමහර විට "බිංදු ප්‍රමාණයක්" ලෙස හැඳින්වේ',
      'පහළ උදරයේ සැහැල්ලු මාංශ පේශි සංකෝචන',
      'බොහෝ කාන්තාවන්ට කිසිදු විශේෂ සලකුණක් නැත',
    ],
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text:
      'සලකුණක් නොමැති වීමෙන් කිසිවක් අදහස් නොවේ: බොහෝ ගර්භණී කාල මෙම අවස්ථාවේ කිසිදු කැපී පෙනෙන රෝග ලක්ෂණයක් නොමැතිව ආරම්භ වේ.',
    body3:
      'hCG හෝමෝනය නිපදවීමට පටන් ගෙන ගර්භණී පරීක්ෂණයකින් හඳුනාගත හැකි වන්නේ තැන්පත් වීමෙන් පසු පමණි. ඉතා කලින් පරීක්ෂා කිරීම වැරදි ලෙස ඍණාත්මක ප්‍රතිඵලයක් දිය හැක.',
    alertTitle: 'සටහන',
    alertText:
      'පරීක්ෂා කිරීමට පෙර ඔබේ ඔසප්වල උපකල්පිත දිනය දක්වා බලා සිටීම, ඉතා කලින් පරීක්ෂා කිරීමට වඩා වඩා විශ්වාසදායක ප්‍රතිඵලයක් ලබා දෙයි.',
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text:
      'ගර්භාෂයේ තැන්පත් වීම දෘශ්‍යමාන සලකුණක් සහිතව හෝ රහිතව රහසිගතව සිදුවේ. පරීක්ෂා කිරීමට පෙර සුළු ඉවසීමක් අවිශ්වාසදායක ප්‍රතිඵලයකින් ඔබව බේරා ගනී.',
    shareMessage: 'ගර්භාෂයේ තැන්පත් වීම තේරුම් ගැනීම — AWA',
  },
  th: {
    badge: 'การฝังตัวของตัวอ่อน',
    title: 'ทำความเข้าใจ\nการฝังตัวของตัวอ่อน',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'บทความ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro:
      'สิ่งที่เกิดขึ้นระหว่างการปฏิสนธิกับผลตรวจการตั้งครรภ์ที่เป็นบวก',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'จากการปฏิสนธิสู่การฝังตัว',
      'สัญญาณที่เป็นไปได้ โดยไม่แน่นอน',
      'เมื่อไรที่การตรวจเชื่อถือได้',
      'ประเด็นสำคัญ',
    ],
    body1:
      'หลังการปฏิสนธิ ไข่มักใช้เวลา 6 ถึง 10 วันเพื่อไปถึงมดลูกและฝังตัวที่นั่น: นี่คือการฝังตัว ขั้นตอนนี้เป็นจุดเริ่มต้นที่แท้จริงของการตั้งครรภ์',
    body2:
      'เลือดออกเล็กน้อยหรืออาการเกร็งอาจเกิดร่วมกับการฝังตัวได้บางครั้ง แม้ไม่ได้เกิดทุกครั้ง และไม่ใช่สัญญาณที่เชื่อถือได้ด้วยตัวเอง',
    possibleSigns: [
      'เลือดออกเล็กน้อยมาก บางครั้งเรียกว่า "สปอตติ้ง"',
      'อาการเกร็งเบา ๆ ที่ท้องน้อย',
      'ไม่มีสัญญาณพิเศษเลย ในผู้หญิงหลายคน',
    ],
    tip1Title: 'ควรรู้',
    tip1Text:
      'การไม่มีสัญญาณไม่ได้หมายความอะไร: การตั้งครรภ์หลายครั้งเริ่มต้นโดยไม่มีอาการที่สังเกตได้ในระยะนี้',
    body3:
      'หลังการฝังตัวเท่านั้นที่ฮอร์โมน hCG จะเริ่มถูกผลิตและตรวจพบได้ด้วยชุดตรวจการตั้งครรภ์ การตรวจเร็วเกินไปอาจให้ผลลบลวง',
    alertTitle: 'หมายเหตุ',
    alertText:
      'การรอจนถึงวันที่คาดว่าประจำเดือนจะมาก่อนตรวจ ให้ผลที่เชื่อถือได้มากกว่าการตรวจเร็วเกินไป',
    tip2Title: 'ควรรู้',
    tip2Text:
      'การฝังตัวเกิดขึ้นอย่างเงียบ ๆ ไม่ว่าจะมีสัญญาณที่เห็นหรือไม่ ความอดทนเล็กน้อยก่อนตรวจช่วยให้คุณไม่ได้ผลที่ไม่น่าเชื่อถือ',
    shareMessage: 'ทำความเข้าใจการฝังตัวของตัวอ่อน — AWA',
  },
  vi: {
    badge: 'SỰ LÀM TỔ',
    title: 'Hiểu về\nsự làm tổ',
    metaDuration: '5 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro:
      'Điều gì xảy ra giữa lúc thụ tinh và khi que thử thai dương tính.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Từ thụ tinh đến làm tổ',
      'Những dấu hiệu có thể có, nhưng không chắc chắn',
      'Khi nào que thử trở nên đáng tin cậy',
      'Những điểm chính cần nhớ',
    ],
    body1:
      'Sau khi thụ tinh, trứng thường mất 6 đến 10 ngày để đến tử cung và làm tổ ở đó: đây là sự làm tổ. Bước này đánh dấu điểm khởi đầu thực sự của thai kỳ.',
    body2:
      'Ra máu nhẹ hoặc đau quặn đôi khi có thể đi kèm sự làm tổ, dù điều này không phải lúc nào cũng xảy ra, cũng không phải là dấu hiệu đáng tin cậy khi đứng một mình.',
    possibleSigns: [
      'Ra máu rất nhẹ, đôi khi gọi là "ra máu lấm tấm"',
      'Đau quặn nhẹ ở bụng dưới',
      'Hoàn toàn không có dấu hiệu đặc biệt nào, ở nhiều phụ nữ',
    ],
    tip1Title: 'Nên biết',
    tip1Text:
      'Việc không có dấu hiệu nào không có ý nghĩa gì: nhiều thai kỳ bắt đầu mà không có triệu chứng đáng chú ý nào ở giai đoạn này.',
    body3:
      'Chỉ sau khi làm tổ, hormone hCG mới bắt đầu được sản xuất và có thể phát hiện bằng que thử thai. Thử quá sớm có thể cho kết quả âm tính giả.',
    alertTitle: 'Lưu ý',
    alertText:
      'Chờ đến ngày dự kiến có kinh rồi mới thử sẽ cho kết quả đáng tin cậy hơn so với thử quá sớm.',
    tip2Title: 'Nên biết',
    tip2Text:
      'Sự làm tổ diễn ra âm thầm, dù có hay không có dấu hiệu nhìn thấy được. Kiên nhẫn một chút trước khi thử giúp bạn tránh một kết quả không đáng tin cậy.',
    shareMessage: 'Hiểu về sự làm tổ — AWA',
  },
  uz: {
    badge: 'IMPLANTATSIYA',
    title: 'Implantatsiyani\ntushunish',
    metaDuration: '5 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro:
      'Urugʻlanish va ijobiy homiladorlik testi oraligʻida nima sodir boʻladi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Urugʻlanishdan implantatsiyagacha',
      'Mumkin boʻlgan belgilar, aniqlik yoʻq',
      'Test qachon ishonchli boʻladi',
      'Asosiy xulosalar',
    ],
    body1:
      'Urugʻlanishdan keyin tuxum hujayra odatda bachadonga yetib borib, u yerga oʻrnashishi uchun 6 kundan 10 kungacha vaqt oladi: bu implantatsiya. Bu bosqich homiladorlikning haqiqiy boshlanish nuqtasi hisoblanadi.',
    body2:
      'Yengil qon ketishi yoki qisqarishlar baʼzan implantatsiyaga hamroh boʻlishi mumkin, ammo bu har doim ham emas va yakka oʻzi ishonchli belgi emas.',
    possibleSigns: [
      'Juda yengil qon ketishi, baʼzan “spotting” deb ataladi',
      'Qorin pastki qismida yengil qisqarishlar',
      'Koʻp ayollarda hech qanday alohida belgi boʻlmasligi',
    ],
    tip1Title: 'Bilish foydali',
    tip1Text:
      'Belgining yoʻqligi hech narsani anglatmaydi: koʻp homiladorliklar bu bosqichda sezilarli alomatlarsiz boshlanadi.',
    body3:
      'Faqat implantatsiyadan keyin hCG gormoni ishlab chiqarila boshlaydi va homiladorlik testi bilan aniqlanadigan boʻladi. Juda erta test qilish yolgʻon salbiy natija berishi mumkin.',
    alertTitle: 'Eslatma',
    alertText:
      'Test qilishdan oldin taxmin qilingan hayz kunigacha kutish juda erta test qilishdan koʻra ishonchliroq natija beradi.',
    tip2Title: 'Bilish foydali',
    tip2Text:
      'Implantatsiya koʻrinadigan belgi bilan yoki belgisiz, sezdirmasdan sodir boʻladi. Test qilishdan oldin biroz sabr ishonchsiz natijadan saqlaydi.',
    shareMessage: 'Implantatsiyani tushunish — AWA',
  },
  az: {
    badge: 'İMPLANTASİYA',
    title: 'İmplantasiyanı\nanlamaq',
    metaDuration: '5 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro:
      'Mayalanma ilə müsbət hamiləlik testi arasında nələr baş verir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Mayalanmadan implantasiyaya qədər',
      'Mümkün əlamətlər, qəti olmadan',
      'Test nə vaxt etibarlı olur',
      'Əsas nəticələr',
    ],
    body1:
      'Mayalanmadan sonra mayalanmış yumurtahüceyrənin uşaqlığa çatıb orada yerləşməsi adətən 6–10 gün çəkir: bu, implantasiyadır. Bu mərhələ hamiləliyin həqiqi başlanğıc nöqtəsidir.',
    body2:
      'Yüngül qanaxma və ya sancı bəzən implantasiyanı müşayiət edə bilər, lakin bu, sistematik deyil və tək başına etibarlı əlamət də deyil.',
    possibleSigns: [
      'Bəzən "spotting" adlandırılan çox yüngül qanaxma',
      'Qarının aşağı hissəsində yüngül sancı',
      'Bir çox qadında heç bir xüsusi əlamətin olmaması',
    ],
    tip1Title: 'Bilmək faydalıdır',
    tip1Text:
      'Əlamətin olmaması heç nə demək deyil: bir çox hamiləlik bu mərhələdə hiss olunan heç bir simptom olmadan başlayır.',
    body3:
      'hCG hormonu yalnız implantasiyadan sonra istehsal olunmağa başlayır və hamiləlik testi ilə aşkar edilə bilir. Çox tez test etmək yalançı mənfi nəticə verə bilər.',
    alertTitle: 'Qeyd',
    alertText:
      'Test etməzdən əvvəl aybaşınızın gözlənilən gününü gözləmək çox tez test etməkdən daha etibarlı nəticə verir.',
    tip2Title: 'Bilmək faydalıdır',
    tip2Text:
      'İmplantasiya gözə çarpan əlamətlə və ya əlamətsiz, səssiz baş verir. Test etməzdən əvvəl bir az səbir sizi etibarsız nəticədən qoruyur.',
    shareMessage: 'İmplantasiyanı anlamaq — AWA',
  },
  ka: {
    badge: 'იმპლანტაცია',
    title: 'იმპლანტაციის\nგაგება',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro:
      'რა ხდება განაყოფიერებასა და ორსულობის დადებით ტესტს შორის.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'განაყოფიერებიდან იმპლანტაციამდე',
      'შესაძლო ნიშნები, სიზუსტის გარეშე',
      'როდის ხდება ტესტი სანდო',
      'მთავარი დასკვნები',
    ],
    body1:
      'განაყოფიერების შემდეგ კვერცხუჯრედს, როგორც წესი, საშვილოსნომდე მისასვლელად და იქ დასამაგრებლად 6-დან 10 დღემდე სჭირდება: ეს არის იმპლანტაცია. ეს ეტაპი ორსულობის ნამდვილ საწყის წერტილს აღნიშნავს.',
    body2:
      'მსუბუქი სისხლდენა ან სპაზმი ზოგჯერ შეიძლება იმპლანტაციას ახლდეს, თუმცა ეს სისტემატური არ არის და არც თავისთავად სანდო ნიშანია.',
    possibleSigns: [
      'ძალიან მსუბუქი სისხლდენა, ზოგჯერ „სპოტინგს“ უწოდებენ',
      'მსუბუქი სპაზმი ქვედა მუცელში',
      'ბევრი ქალისთვის რაიმე განსაკუთრებული ნიშნის სრული არარსებობა',
    ],
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text:
      'ნიშნის არარსებობა არაფერს ნიშნავს: ბევრი ორსულობა ამ ეტაპზე შესამჩნევი სიმპტომის გარეშე იწყება.',
    body3:
      'მხოლოდ იმპლანტაციის შემდეგ იწყება hCG ჰორმონის გამომუშავება და ხდება ორსულობის ტესტით აღმოჩენადი. ძალიან ადრე ტესტირებამ შეიძლება ცრუ უარყოფითი შედეგი მოგცეთ.',
    alertTitle: 'შენიშვნა',
    alertText:
      'ტესტირებამდე მენსტრუაციის სავარაუდო დღემდე ლოდინი უფრო სანდო შედეგს იძლევა, ვიდრე ძალიან ადრე ტესტირება.',
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text:
      'იმპლანტაცია დისკრეტულად ხდება, თვალსაჩინო ნიშნით ან მის გარეშე. ტესტირებამდე ცოტა მოთმინება გარიდებთ არასანდო შედეგს.',
    shareMessage: 'იმპლანტაციის გაგება — AWA',
  },
  hy: {
    badge: 'ԻՄՊԼԱՆՏԱՑԻԱ',
    title: 'Հասկանալ\nիմպլանտացիան',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro:
      'Ինչ է տեղի ունենում բեղմնավորման և դրական հղիության թեստի միջև:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Բեղմնավորումից մինչև իմպլանտացիա',
      'Հնարավոր նշաններ՝ առանց վստահության',
      'Երբ է թեստը դառնում հուսալի',
      'Հիմնական եզրակացություններ',
    ],
    body1:
      'Բեղմնավորումից հետո ձվաբջիջը սովորաբար 6–10 օր է պահանջում՝ արգանդ հասնելու և այնտեղ ամրանալու համար. սա իմպլանտացիան է: Այս քայլը նշում է հղիության իրական մեկնարկային կետը:',
    body2:
      'Թեթև արյունահոսությունը կամ ջղաձգումները երբեմն կարող են ուղեկցել իմպլանտացիային, թեև դա համակարգային չէ և միայնակ հուսալի նշան չէ:',
    possibleSigns: [
      'Շատ թեթև արյունահոսություն, երբեմն կոչվող «արյունաշաղախ արտազատուկ»',
      'Թեթև ջղաձգումներ որովայնի ստորին հատվածում',
      'Շատ կանանց մոտ՝ ընդհանրապես որևէ հատուկ նշան չկա',
    ],
    tip1Title: 'Լավ է իմանալ',
    tip1Text:
      'Նշանի բացակայությունը ոչինչ չի նշանակում. շատ հղիություններ սկսվում են առանց այս փուլում որևէ նկատելի ախտանիշի:',
    body3:
      'Միայն իմպլանտացիայից հետո է սկսվում hCG հորմոնի արտադրությունը, և այն դառնում է հայտնաբերելի հղիության թեստով: Շատ վաղ թեստավորումը կարող է տալ կեղծ բացասական արդյունք:',
    alertTitle: 'Նշում',
    alertText:
      'Թեստավորումից առաջ ձեր դաշտանի ենթադրյալ օրվան սպասելը տալիս է ավելի հուսալի արդյունք, քան շատ շուտ թեստավորելը:',
    tip2Title: 'Լավ է իմանալ',
    tip2Text:
      'Իմպլանտացիան տեղի է ունենում զգուշորեն՝ տեսանելի նշանով կամ առանց դրա: Թեստավորումից առաջ մի փոքր համբերությունը խնայում է ձեզ անհուսալի արդյունքից:',
    shareMessage: 'Հասկանալ իմպլանտացիան — AWA',
  },
  tg: {
    badge: 'ИМПЛАНТАТСИЯ',
    title: 'Фаҳмидани\nимплантатсия',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro:
      'Байни бордоршавӣ ва санҷиши мусбати ҳомиладорӣ чӣ рух медиҳад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Аз бордоршавӣ то имплантатсия',
      'Нишонаҳои имконпазир, бе қатъият',
      'Санҷиш кай боэътимод мешавад',
      'Хулосаҳои асосӣ',
    ],
    body1:
      'Пас аз бордоршавӣ тухмсел одатан 6 то 10 рӯз вақт мегирад, то ба бачадон расад ва дар он ҷойгир шавад: ин имплантатсия аст. Ин марҳила нуқтаи ҳақиқии оғози ҳомиладориро нишон медиҳад.',
    body2:
      'Хунравии сабук ё кашишхӯрӣ баъзан метавонад имплантатсияро ҳамроҳӣ кунад, гарчанде ки ин мунтазам нест ва худ ба худ нишонаи боэътимод низ нест.',
    possibleSigns: [
      'Хунравии хеле сабук, ки баъзан «спотинг» номида мешавад',
      'Кашишхӯрии сабук дар поёни шикам',
      'Ягон нишонаи махсус нест, барои бисёр занон',
    ],
    tip1Title: 'Донистан хуб аст',
    tip1Text:
      'Набудани нишона ҳеҷ чизро надорад: бисёр ҳомиладорӣ бе ягон нишонаи намоён дар ин марҳила оғоз мешавад.',
    body3:
      'Танҳо пас аз имплантатсия гормони hCG тавлид шудан мегирад ва аз ҷониби санҷиши ҳомиладорӣ ошкор шуданӣ мешавад. Хеле барвақт санҷидан метавонад натиҷаи нодурусти манфӣ диҳад.',
    alertTitle: 'Қайд',
    alertText:
      'Интизор шудан то рӯзи эҳтимолии ҳайз пеш аз санҷиш натиҷаи боэътимодтар аз хеле барвақт санҷиданро медиҳад.',
    tip2Title: 'Донистан хуб аст',
    tip2Text:
      'Имплантатсия оромона рух медиҳад, бо нишонаи намоён ё бе он. Андаке сабр пеш аз санҷиш шуморо аз натиҷаи беэътимод наҷот медиҳад.',
    shareMessage: 'Фаҳмидани имплантатсия — AWA',
  },
  ky: {
    badge: 'ИМПЛАНТАЦИЯ',
    title: 'Имплантацияны\nтүшүнүү',
    metaDuration: '5 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro:
      'Уруктануу менен курсактуулуктун оң тестинин ортосунда эмне болот.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Уруктанудан имплантацияга чейин',
      'Мүмкүн болгон белгилер, ишенимсиз',
      'Тест качан ишенимдүү болот',
      'Негизги жыйынтыктар',
    ],
    body1:
      'Уруктангандан кийин жумурткалуу клетка жатынга жетип, ага орнотулуу үчүн адатта 6–10 күн талап кылынат: бул имплантация. Бул кадам курсактуулуктун чыныгы башталышын белгилейт.',
    body2:
      'Жеңил кан кетүү же спазмдар кээде имплантацияга кошо жүрүшү мүмкүн, бирок бул системалуу эмес жана өзү ишенимдүү белги да эмес.',
    possibleSigns: [
      'Өтө жеңил кан кетүү, кээде «спотинг» деп аталат',
      'Курсактын ылдый жагында жеңил спазмдар',
      'Көптөгөн аялдарда эч кандай өзгөчө белги жок',
    ],
    tip1Title: 'Билүү пайдалуу',
    tip1Text:
      'Белгинин жоктугу эч нерсени билдирбейт: көптөгөн курсактуулуктар бул этапта эч кандай байкалаарлык белгисиз башталат.',
    body3:
      'Имплантациядан кийин гана hCG гормону өндүрүлө баштайт жана курсактуулук тести аркылуу аныкталат. Өтө эрте тестиңиз жалган терс жыйынтык бериши мүмкүн.',
    alertTitle: 'Эскертүү',
    alertText:
      'Тестти жасоодон мурун етек киримиңиз болушу керек деп болжолдонгон күнгө чейин күтүү өтө эрте жасалган тестке караганда ишенимдүүрөөк жыйынтык берет.',
    tip2Title: 'Билүү пайдалуу',
    tip2Text:
      'Имплантация көрүнүүчү белгиси менен же жок эле купуя өтөт. Тестиңизден мурун бир аз сабыр ишенимсиз жыйынтыктан сактайт.',
    shareMessage: 'Имплантацияны түшүнүү — AWA',
  },
  tk: {
    badge: 'IMPLANTASIÝA',
    title: 'Implantasiýany\ndüşünmek',
    metaDuration: '5 min okamak',
    metaType: 'Makala',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro:
      'Tohumlanma bilen oňyn göwrelilik synagynyň arasynda nämeler bolýar.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Tohumlanmadan implantasiýa çenli',
      'Mümkin alamatlar, kepilsiz',
      'Synag haçan ygtybarly bolýar',
      'Esasy netijeler',
    ],
    body1:
      'Tohumlanmadan soň ýumurtga adatça ýatga ýetmek we şol ýerde ornaşmak üçin 6–10 gün alýar: bu implantasiýa. Bu ädim göwreliligiň hakyky başlangyç nokadyny belleýär.',
    body2:
      'Ýeňil gan akma ýa-da çekişme käwagt implantasiýa hemrah bolup biler, ýöne bu yzygiderli däl, ýeke özi ygtybarly alamat hem däl.',
    possibleSigns: [
      'Gaty ýeňil gan akma, käwagt «spotting» diýlip atlandyrylýar',
      'Garnyň aşagynda ýeňil çekişme',
      'Köp aýal üçin hiç hili aýratyn alamat ýok',
    ],
    tip1Title: 'Bilmek peýdaly',
    tip1Text:
      'Alamatyň ýoklugy hiç zat aňlatmaýar: köp göwrelilik bu tapgyrda duýulýan hiç hili alamatsyz başlanýar.',
    body3:
      'Diňe implantasiýadan soň hCG gormony öndürilip başlaýar we göwrelilik synagy bilen anyklanyp bilner. Aşa ir synag etmek ýalňyş otrisatel netije berip biler.',
    alertTitle: 'Bellik',
    alertText:
      'Synag etmezden öň aýbaşyňyzyň çaklanylýan gününe çenli garaşmak aşa ir synag etmekden has ygtybarly netije berýär.',
    tip2Title: 'Bilmek peýdaly',
    tip2Text:
      'Implantasiýa görünýän alamat bilen ýa-da alamatsyz, ýaşyryn bolýar. Synagdan öň az-kem sabyr ygtybarsyz netijeden halas edýär.',
    shareMessage: 'Implantasiýany düşünmek — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function NidationArticleScreen({
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

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>{content.title}</AwaText>

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

          <AwaText variant="bodyMedium" style={styles.intro}>{content.intro}</AwaText>

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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body1}</AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.possibleSigns.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body3}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.alertText}</AwaText>
            </View>
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
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tip2Text}</AwaText>
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
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
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
