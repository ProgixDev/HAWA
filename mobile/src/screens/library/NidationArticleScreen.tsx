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

const ID = 'conceptiontips-comprendre-nidation';

const HERO = require('../../assets/images/library/featured-cycle.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
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
} as const;

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
