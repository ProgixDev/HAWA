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

const ID = 'conceptiontips-essayer-de-concevoir';

const HERO = require('../../assets/images/library/featured-tracker.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('ConceptionStart', {
  fr: {
    badge: 'ESSAYER DE CONCEVOIR',
    title: 'Essayer de concevoir :\npar où commencer',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les repères essentiels pour démarrer sereinement ton parcours de conception.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Identifier sa fenêtre fertile',
      'Le rythme des rapports',
      'Combien de temps cela peut prendre',
      'À retenir',
    ],
    body1: 'La première étape la plus utile consiste à identifier ta fenêtre fertile grâce à ton cycle : durée du cycle, signes physiques et, si tu le souhaites, des outils de suivi comme les tests d’ovulation ou la température basale.',
    body2: 'Des rapports réguliers, tous les 2 à 3 jours, couvrent naturellement la période la plus fertile, sans nécessiter une planification trop rigide.',
    rhythmPoints: [
      'Pas besoin de te limiter au seul jour de l’ovulation',
      'Un rythme régulier reste plus simple à maintenir qu’une planification stricte',
      'Le bien-être du couple compte aussi pendant cette période',
    ],
    body3: 'La majorité des couples conçoivent dans les 12 mois suivant l’arrêt de la contraception. Ce délai varie selon de nombreux facteurs propres à chaque situation.',
    alertTitle: 'À noter',
    alertText: 'Au-delà de 12 mois (ou 6 mois après 35 ans), il est conseillé de consulter un professionnel de santé pour un bilan, sans que cela signifie nécessairement un problème.',
    tipTitle: 'Bon à savoir',
    tipText: 'Connaître son cycle, garder un rythme naturel et rester patiente sont les trois piliers d’un début de parcours serein.',
    shareMessage: 'Essayer de concevoir : par où commencer — AWA',
  },
  en: {
    badge: 'TRYING TO CONCEIVE',
    title: 'Trying to conceive:\nwhere to start',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The essential pointers to start your conception journey with confidence.',
    contentsTitle: 'In this article',
    topics: [
      'Identifying your fertile window',
      'The rhythm of intercourse',
      'How long it can take',
      'Key takeaways',
    ],
    body1: 'The most useful first step is identifying your fertile window using your cycle: cycle length, physical signs, and, if you’d like, tracking tools such as ovulation tests or basal body temperature.',
    body2: 'Having intercourse regularly, every 2 to 3 days, naturally covers your most fertile period without requiring overly rigid planning.',
    rhythmPoints: [
      'No need to limit yourself to the day of ovulation alone',
      'A regular rhythm is easier to keep up than strict planning',
      'The couple’s well-being matters too during this time',
    ],
    body3: 'Most couples conceive within 12 months of stopping contraception. This timeframe varies depending on many factors specific to each situation.',
    alertTitle: 'Please note',
    alertText: 'Beyond 12 months (or 6 months after age 35), it’s advisable to see a healthcare professional for a check-up, though this doesn’t necessarily mean there’s a problem.',
    tipTitle: 'Good to know',
    tipText: 'Knowing your cycle, keeping a natural rhythm, and staying patient are the three pillars of a calm start to this journey.',
    shareMessage: 'Trying to conceive: where to start — AWA',
  },
  es: {
    badge: 'INTENTAR CONCEBIR',
    title: 'Intentar concebir:\npor dónde empezar',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Las claves esenciales para comenzar tu camino hacia la concepción con tranquilidad.',
    contentsTitle: 'En este artículo',
    topics: [
      'Identificar tu ventana fértil',
      'El ritmo de las relaciones',
      'Cuánto tiempo puede llevar',
      'Para recordar',
    ],
    body1: 'El primer paso más útil consiste en identificar tu ventana fértil a partir de tu ciclo: duración del ciclo, signos físicos y, si lo deseas, herramientas de seguimiento como los test de ovulación o la temperatura basal.',
    body2: 'Tener relaciones con regularidad, cada 2 o 3 días, cubre de forma natural el período más fértil, sin necesidad de una planificación demasiado rígida.',
    rhythmPoints: [
      'No hace falta limitarte únicamente al día de la ovulación',
      'Un ritmo regular es más fácil de mantener que una planificación estricta',
      'El bienestar de la pareja también cuenta durante este período',
    ],
    body3: 'La mayoría de las parejas conciben dentro de los 12 meses posteriores a dejar la anticoncepción. Este plazo varía según numerosos factores propios de cada situación.',
    alertTitle: 'Ten en cuenta',
    alertText: 'Pasados los 12 meses (o 6 meses después de los 35 años), se recomienda consultar a un profesional de la salud para un chequeo, sin que eso signifique necesariamente que haya un problema.',
    tipTitle: 'DATO ÚTIL',
    tipText: 'Conocer tu ciclo, mantener un ritmo natural y tener paciencia son los tres pilares de un comienzo de camino tranquilo.',
    shareMessage: 'Intentar concebir: por dónde empezar — AWA',
  },
  it: {
    badge: 'CERCARE UNA GRAVIDANZA',
    title: 'Cercare una gravidanza:\nda dove iniziare',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'I punti essenziali per iniziare con serenità il tuo percorso verso il concepimento.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Individuare la tua finestra fertile',
      'Il ritmo dei rapporti',
      'Quanto tempo può servire',
      'I punti chiave',
    ],
    body1: 'Il primo passo più utile è individuare la tua finestra fertile a partire dal ciclo: durata del ciclo, segni fisici e, se vuoi, strumenti di monitoraggio come i test di ovulazione o la temperatura basale.',
    body2: 'Avere rapporti con regolarità, ogni 2-3 giorni, copre naturalmente il tuo periodo più fertile senza richiedere una pianificazione troppo rigida.',
    rhythmPoints: [
      'Non serve limitarsi al solo giorno dell’ovulazione',
      'Un ritmo regolare è più facile da mantenere di una pianificazione rigida',
      'In questo periodo conta anche il benessere della coppia',
    ],
    body3: 'La maggior parte delle coppie concepisce entro 12 mesi dall’interruzione della contraccezione. Questi tempi variano in base a numerosi fattori propri di ogni situazione.',
    alertTitle: 'Attenzione',
    alertText: 'Dopo 12 mesi (o 6 mesi dopo i 35 anni) è consigliabile rivolgersi a un professionista sanitario per un controllo, anche se questo non significa necessariamente che ci sia un problema.',
    tipTitle: 'Da sapere',
    tipText: 'Conoscere il tuo ciclo, mantenere un ritmo naturale e avere pazienza sono i tre pilastri per iniziare questo percorso con calma.',
    shareMessage: 'Cercare una gravidanza: da dove iniziare — AWA',
  },
  tr: {
    badge: 'HAMİLE KALMAYA ÇALIŞMA',
    title: 'Hamile kalmaya çalışmak:\nnereden başlamalı',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Hamile kalma yolculuğuna güvenle başlamak için temel ipuçları.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Doğurganlık dönemini belirlemek',
      'İlişki sıklığı',
      'Ne kadar sürebilir',
      'Önemli noktalar',
    ],
    body1: 'En faydalı ilk adım, döngünden yola çıkarak doğurganlık dönemini belirlemektir: döngü uzunluğu, bedensel belirtiler ve istersen ovülasyon testleri ya da bazal vücut sıcaklığı gibi takip araçları.',
    body2: '2 ila 3 günde bir düzenli olarak cinsel ilişkide bulunmak, aşırı katı bir planlama gerektirmeden en doğurgan dönemini doğal olarak kapsar.',
    rhythmPoints: [
      'Yalnızca yumurtlama gününe sıkışıp kalmana gerek yok',
      'Düzenli bir ritmi sürdürmek, katı bir planlamaya göre daha kolaydır',
      'Bu süreçte çiftin iyi oluşu da önemlidir',
    ],
    body3: 'Çiftlerin çoğu doğum kontrolünü bıraktıktan sonraki 12 ay içinde hamile kalır. Bu süre, her duruma özgü birçok etkene göre değişir.',
    alertTitle: 'Dikkat',
    alertText: '12 ayı aştığında (35 yaşından sonra ise 6 ayı aştığında) bir sağlık profesyoneline görünerek kontrolden geçmek önerilir; bu, mutlaka bir sorun olduğu anlamına gelmez.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Döngünü tanımak, doğal bir ritmi korumak ve sabırlı olmak, bu yolculuğa sakin bir başlangıcın üç temel taşıdır.',
    shareMessage: 'Hamile kalmaya çalışmak: nereden başlamalı — AWA',
  },
  ru: {
    badge: 'ПЛАНИРОВАНИЕ БЕРЕМЕННОСТИ',
    title: 'Планирование беременности:\nс чего начать',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Главные ориентиры, чтобы уверенно начать путь к зачатию.',
    contentsTitle: 'В этой статье',
    topics: [
      'Определение фертильного окна',
      'Ритм половых контактов',
      'Сколько времени это может занять',
      'Главное',
    ],
    body1: 'Самый полезный первый шаг — определить своё фертильное окно с помощью цикла: его длительности, физических признаков и, по желанию, инструментов отслеживания, таких как тесты на овуляцию или базальная температура.',
    body2: 'Регулярные половые контакты каждые 2–3 дня естественным образом охватывают наиболее фертильный период, не требуя слишком жёсткого планирования.',
    rhythmPoints: [
      'Не нужно ограничиваться только днём овуляции',
      'Регулярный ритм поддерживать проще, чем строгий график',
      'Благополучие пары в этот период тоже важно',
    ],
    body3: 'Большинство пар зачинают в течение 12 месяцев после прекращения контрацепции. Этот срок зависит от многих факторов, свойственных каждой конкретной ситуации.',
    alertTitle: 'Обратите внимание',
    alertText: 'Если прошло больше 12 месяцев (или 6 месяцев после 35 лет), рекомендуется обратиться к медицинскому специалисту для обследования, хотя это не обязательно означает наличие проблемы.',
    tipTitle: 'Полезно знать',
    tipText: 'Знание своего цикла, естественный ритм и терпение — три основы спокойного начала этого пути.',
    shareMessage: 'Планирование беременности: с чего начать — AWA',
  },
  de: {
    badge: 'KINDERWUNSCH',
    title: 'Kinderwunsch:\nwo du anfangen kannst',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Die wichtigsten Anhaltspunkte, um deinen Weg zur Schwangerschaft gelassen zu beginnen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Dein fruchtbares Fenster erkennen',
      'Der Rhythmus beim Sex',
      'Wie lange es dauern kann',
      'Das Wichtigste in Kürze',
    ],
    body1: 'Der hilfreichste erste Schritt ist, anhand deines Zyklus dein fruchtbares Fenster zu erkennen: Zykluslänge, körperliche Anzeichen und – wenn du möchtest – Hilfsmittel wie Ovulationstests oder die Basaltemperatur.',
    body2: 'Regelmäßiger Sex alle 2 bis 3 Tage deckt ganz natürlich die fruchtbarste Zeit ab, ohne dass du zu starr planen musst.',
    rhythmPoints: [
      'Du musst dich nicht allein auf den Tag des Eisprungs beschränken',
      'Ein regelmäßiger Rhythmus lässt sich leichter durchhalten als eine strenge Planung',
      'Auch das Wohlbefinden als Paar ist in dieser Zeit wichtig',
    ],
    body3: 'Die meisten Paare werden innerhalb von 12 Monaten nach dem Absetzen der Verhütung schwanger. Diese Zeitspanne hängt von vielen Faktoren ab, die in jeder Situation anders sind.',
    alertTitle: 'Bitte beachten',
    alertText: 'Nach mehr als 12 Monaten (oder 6 Monaten ab einem Alter von 35 Jahren) ist es ratsam, zur Abklärung medizinisches Fachpersonal aufzusuchen – das bedeutet nicht zwangsläufig, dass ein Problem vorliegt.',
    tipTitle: 'Gut zu wissen',
    tipText: 'Deinen Zyklus zu kennen, einen natürlichen Rhythmus zu halten und geduldig zu bleiben sind die drei Säulen eines gelassenen Starts.',
    shareMessage: 'Kinderwunsch: wo du anfangen kannst – AWA',
  },
  zh: {
      badge: '备孕',
      title: '备孕：\n从哪里开始',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '几个关键提示，帮助你充满信心地开启备孕之路。',
      contentsTitle: '本文内容',
      topics: [
        '找出你的易孕期',
        '同房的节奏',
        '可能需要多长时间',
        '要点回顾',
      ],
      body1: '最有用的第一步，是根据你的周期找出易孕期：周期长度、身体信号，以及如果你愿意，也可以借助排卵试纸或基础体温等记录工具。',
      body2: '规律地每隔 2 到 3 天同房一次，自然就能覆盖你最容易受孕的时段，不需要过于刻板的安排。',
      rhythmPoints: [
        '不必只局限在排卵日当天',
        '规律的节奏比严格的计划更容易坚持',
        '这段时间里，两个人的状态同样重要',
      ],
      body3: '大多数夫妻会在停止避孕后的 12 个月内怀孕。这个时间长短会因每个人的具体情况而有许多不同。',
      alertTitle: '请注意',
      alertText: '超过 12 个月（35 岁以后则是 6 个月）仍未怀孕时，建议去看医疗专业人员做个检查，但这并不一定意味着存在问题。',
      tipTitle: '小贴士',
      tipText: '了解自己的周期、保持自然的节奏、保持耐心，是平静开启这段旅程的三大支柱。',
      shareMessage: '备孕：从哪里开始 — AWA',
    },
  id: {
    badge: 'PROGRAM HAMIL',
    title: 'Program hamil:\nmulai dari mana',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Petunjuk penting untuk memulai perjalanan program hamilmu dengan percaya diri.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengenali masa suburmu',
      'Ritme hubungan intim',
      'Berapa lama bisa memakan waktu',
      'Poin penting',
    ],
    body1: 'Langkah pertama yang paling berguna adalah mengenali masa suburmu berdasarkan siklusmu: panjang siklus, tanda-tanda fisik, dan, jika kamu mau, alat bantu pencatatan seperti tes ovulasi atau suhu tubuh basal.',
    body2: 'Berhubungan intim secara teratur, setiap 2 sampai 3 hari, secara alami mencakup periode tersuburmu tanpa perlu perencanaan yang terlalu kaku.',
    rhythmPoints: [
      'Tidak perlu membatasi diri hanya pada hari ovulasi',
      'Ritme yang teratur lebih mudah dijaga daripada jadwal yang ketat',
      'Kesejahteraan pasangan juga penting selama masa ini',
    ],
    body3: 'Sebagian besar pasangan hamil dalam 12 bulan setelah berhenti menggunakan kontrasepsi. Jangka waktu ini bervariasi tergantung banyak faktor yang khas pada setiap situasi.',
    alertTitle: 'Harap diperhatikan',
    alertText: 'Lewat dari 12 bulan (atau 6 bulan setelah usia 35 tahun), sebaiknya kamu menemui tenaga kesehatan untuk pemeriksaan, meski hal ini belum tentu berarti ada masalah.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Mengenali siklusmu, menjaga ritme yang alami, dan tetap bersabar adalah tiga pilar untuk memulai perjalanan ini dengan tenang.',
    shareMessage: 'Program hamil: mulai dari mana — AWA',
  },
  hi: {
    badge: 'गर्भधारण की कोशिश',
    title: 'गर्भधारण की कोशिश:\nशुरुआत कहाँ से करें',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'गर्भधारण का सफ़र आत्मविश्वास से शुरू करने के ज़रूरी बिंदु।',
    contentsTitle: 'इस लेख में',
    topics: [
      'अपनी फ़र्टाइल विंडो पहचानना',
      'शारीरिक संबंध की लय',
      'कितना समय लग सकता है',
      'मुख्य बातें',
    ],
    body1: 'सबसे उपयोगी पहला क़दम है अपने चक्र की मदद से अपनी फ़र्टाइल विंडो (उपजाऊ दिन) पहचानना: चक्र की लंबाई, शरीर के संकेत और, अगर आप चाहें, ओव्यूलेशन टेस्ट या बेसल तापमान जैसे ट्रैकिंग के साधन।',
    body2: 'हर 2 से 3 दिन में नियमित रूप से शारीरिक संबंध बनाने से बहुत सख़्त योजना बनाए बिना ही आपके सबसे उपजाऊ दिन अपने आप शामिल हो जाते हैं।',
    rhythmPoints: [
      'खुद को सिर्फ़ ओव्यूलेशन वाले दिन तक सीमित रखने की ज़रूरत नहीं है',
      'सख़्त योजना की तुलना में नियमित लय निभाना आसान होता है',
      'इस दौर में पति-पत्नी की आपसी सुकून और भलाई भी मायने रखती है',
    ],
    body3: 'ज़्यादातर जोड़े गर्भनिरोध बंद करने के 12 महीनों के भीतर गर्भधारण कर लेते हैं। यह अवधि हर स्थिति की अपनी अलग बातों के अनुसार बदलती है।',
    alertTitle: 'ध्यान दें',
    alertText: '12 महीने के बाद (या 35 साल की उम्र के बाद 6 महीने के बाद) किसी स्वास्थ्य विशेषज्ञ से जाँच करवाना उचित है, हालाँकि इसका मतलब यह नहीं कि कोई समस्या है।',
    tipTitle: 'जानना अच्छा है',
    tipText: 'अपने चक्र को जानना, एक स्वाभाविक लय रखना और धैर्य बनाए रखना: इस सफ़र की शांत शुरुआत के यही तीन आधार हैं।',
    shareMessage: 'गर्भधारण की कोशिश: शुरुआत कहाँ से करें — AWA',
  },
  sq: {
    badge: 'PËRPJEKJE PËR SHTATZËNI',
    title: 'Përpjekje për shtatzëni:\nsi të fillosh',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Pikat thelbësore për ta nisur me besim rrugëtimin drejt shtatzënisë.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Të gjesh dritaren tënde pjellore',
      'Ritmi i marrëdhënieve intime',
      'Sa kohë mund të duhet',
      'Çfarë të mbash mend',
    ],
    body1: 'Hapi i parë më i dobishëm është të gjesh dritaren tënde pjellore duke u mbështetur te cikli: gjatësia e ciklit, shenjat fizike dhe, nëse dëshiron, mjete ndjekjeje si testet e ovulacionit ose temperatura bazale e trupit.',
    body2: 'Marrëdhëniet intime të rregullta, çdo 2 deri në 3 ditë, e mbulojnë natyrshëm periudhën tënde më pjellore, pa kërkuar një planifikim shumë të ngurtë.',
    rhythmPoints: [
      'Nuk ka nevojë të kufizohesh vetëm në ditën e ovulacionit',
      'Një ritëm i rregullt është më i lehtë për t’u mbajtur sesa një planifikim i rreptë',
      'Edhe mirëqenia e çiftit ka rëndësi gjatë kësaj kohe',
    ],
    body3: 'Shumica e çifteve mbeten shtatzënë brenda 12 muajve nga ndalimi i kontracepsionit. Kjo kohë ndryshon sipas shumë faktorëve që janë të veçantë për çdo situatë.',
    alertTitle: 'Kujdes',
    alertText: 'Pas 12 muajsh (ose 6 muajsh pas moshës 35 vjeç), këshillohet të konsultohesh me një profesionist të shëndetësisë për një kontroll, por kjo nuk do të thotë domosdoshmërisht se ka një problem.',
    tipTitle: 'Mirë është të dish',
    tipText: 'Të njohësh ciklin tënd, të mbash një ritëm natyral dhe të qëndrosh e durueshme janë tre shtyllat e një fillimi të qetë të këtij rrugëtimi.',
    shareMessage: 'Përpjekje për shtatzëni: si të fillosh — AWA',
  },
  ja: {
    badge: '妊活',
    title: '妊活：\nまず何から始める？',
    metaDuration: '読了時間6分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '安心して妊活を始めるための基本のポイント。',
    contentsTitle: 'この記事の内容',
    topics: [
      '妊娠しやすい期間を知る',
      '性交のリズム',
      '妊娠までにかかる期間',
      'ポイントのまとめ',
    ],
    body1: '最初に役立つのは、周期をもとに妊娠しやすい期間を知ることです。周期の長さや体のサインのほか、必要に応じて排卵検査薬や基礎体温などの記録方法も使えます。',
    body2: '2〜3日ごとに定期的に性交をすると、無理にきっちり計画しなくても、最も妊娠しやすい時期を自然にカバーできます。',
    rhythmPoints: [
      '排卵日だけに絞る必要はありません',
      '厳密な計画よりも、定期的なリズムのほうが続けやすいです',
      'この時期は、夫婦の心の健やかさも大切です',
    ],
    body3: 'ほとんどのカップルは、避妊をやめてから12か月以内に妊娠します。この期間は、それぞれの状況に応じてさまざまな要因で変わります。',
    alertTitle: 'ご注意',
    alertText: '12か月を過ぎた場合（35歳を過ぎている場合は6か月）は、医療従事者に相談して検査を受けることをおすすめします。ただし、必ずしも問題があるという意味ではありません。',
    tipTitle: '知っておきたいこと',
    tipText: 'ご自身の周期を知ること、自然なリズムを保つこと、そして焦らず待つこと。この3つが、穏やかに妊活を始めるための柱です。',
    shareMessage: '妊活：まず何から始める？ — AWA',
  },
  ko: {
    badge: '임신 준비',
    title: '임신 준비,\n어디서부터 시작할까요',
    metaDuration: '6분 읽기',
    metaType: '가이드',
    metaLevel: '초급',
    metaValidated: '검토된 콘텐츠',
    intro: '자신 있게 임신 준비를 시작하기 위한 핵심 포인트예요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '가임기 파악하기',
      '관계의 리듬',
      '얼마나 걸릴 수 있을까요',
      '핵심 정리',
    ],
    body1: '가장 도움이 되는 첫걸음은 주기를 바탕으로 가임기를 파악하는 거예요. 주기 길이, 몸의 신호를 살펴보고, 원한다면 배란 테스트나 기초체온 같은 기록 도구도 활용할 수 있어요.',
    body2: '2~3일에 한 번씩 규칙적으로 관계를 가지면 지나치게 엄격하게 계획하지 않아도 임신 가능성이 가장 높은 시기를 자연스럽게 포함할 수 있어요.',
    rhythmPoints: [
      '배란일 하루에만 맞추려고 하지 않아도 돼요',
      '엄격한 계획보다 규칙적인 리듬이 더 오래 지키기 쉬워요',
      '이 시기에는 부부의 마음 편안함도 중요해요',
    ],
    body3: '대부분의 부부는 피임을 중단한 뒤 12개월 안에 임신해요. 이 기간은 각자의 상황에 따른 여러 요인에 따라 달라져요.',
    alertTitle: '참고',
    alertText: '12개월이 지나면(35세 이후에는 6개월 후) 의료 전문가에게 검진을 받는 것이 좋아요. 반드시 문제가 있다는 뜻은 아니에요.',
    tipTitle: '알아 두세요',
    tipText: '내 주기를 알고, 자연스러운 리듬을 지키고, 느긋한 마음을 갖는 것. 이 세 가지가 차분한 시작의 세 기둥이에요.',
    shareMessage: '임신 준비, 어디서부터 시작할까요 — AWA',
  },
  'pt-PT': {
    badge: 'TENTAR ENGRAVIDAR',
    title: 'Tentar engravidar:\npor onde começar',
    metaDuration: 'Leitura de 6 min',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Os pontos essenciais para começar com confiança o seu percurso rumo à conceção.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Identificar a sua janela fértil',
      'O ritmo das relações sexuais',
      'Quanto tempo pode demorar',
      'O essencial a reter',
    ],
    body1: 'O primeiro passo mais útil é identificar a sua janela fértil a partir do ciclo: duração do ciclo, sinais físicos e, se quiser, ferramentas de acompanhamento como os testes de ovulação ou a temperatura corporal basal.',
    body2: 'Ter relações sexuais com regularidade, a cada 2 a 3 dias, cobre naturalmente o seu período mais fértil, sem exigir um planeamento demasiado rígido.',
    rhythmPoints: [
      'Não é preciso limitar-se apenas ao dia da ovulação',
      'É mais fácil manter um ritmo regular do que um planeamento estrito',
      'O bem-estar do casal também conta durante este período',
    ],
    body3: 'A maioria dos casais concebe nos 12 meses seguintes à interrupção da contraceção. Este prazo varia consoante muitos fatores próprios de cada situação.',
    alertTitle: 'Atenção',
    alertText: 'Passados 12 meses (ou 6 meses depois dos 35 anos), é aconselhável consultar um profissional de saúde para uma avaliação, embora isso não signifique necessariamente que haja um problema.',
    tipTitle: 'Bom saber',
    tipText: 'Conhecer o seu ciclo, manter um ritmo natural e ter paciência são os três pilares de um início sereno deste percurso.',
    shareMessage: 'Tentar engravidar: por onde começar — AWA',
  },
  bn: {
    badge: 'গর্ভধারণের চেষ্টা',
    title: 'গর্ভধারণের চেষ্টা:\nকোথা থেকে শুরু করবেন',
    metaDuration: '6 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'নতুনদের জন্য',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'আত্মবিশ্বাসের সঙ্গে গর্ভধারণের যাত্রা শুরু করার জন্য প্রয়োজনীয় দিকনির্দেশ।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'আপনার উর্বর সময় চেনা',
      'মিলনের ছন্দ',
      'কত সময় লাগতে পারে',
      'মূল কথা',
    ],
    body1: 'সবচেয়ে কার্যকর প্রথম ধাপ হলো আপনার চক্র থেকে উর্বর সময় চিহ্নিত করা: চক্রের দৈর্ঘ্য, শারীরিক লক্ষণ এবং আপনি চাইলে ডিম্বস্ফোটন পরীক্ষা বা বেসাল শরীরের তাপমাত্রার মতো ট্র্যাকিং উপায়।',
    body2: 'নিয়মিতভাবে, প্রতি 2 থেকে 3 দিন অন্তর মিলিত হলে খুব বেশি কড়াকড়ি পরিকল্পনা ছাড়াই স্বাভাবিকভাবে আপনার সবচেয়ে উর্বর সময় ধরা পড়ে।',
    rhythmPoints: [
      'শুধু ডিম্বস্ফোটনের দিনটিতে নিজেকে সীমাবদ্ধ রাখার প্রয়োজন নেই',
      'কঠোর পরিকল্পনার চেয়ে নিয়মিত একটি ছন্দ বজায় রাখা সহজ',
      'এই সময়ে দম্পতির মানসিক স্বাচ্ছন্দ্যও গুরুত্বপূর্ণ',
    ],
    body3: 'বেশিরভাগ দম্পতি জন্মনিয়ন্ত্রণ বন্ধ করার 12 মাসের মধ্যে গর্ভধারণ করেন। প্রতিটি পরিস্থিতির নিজস্ব অনেক কারণের ওপর নির্ভর করে এই সময়সীমা বদলে যায়।',
    alertTitle: 'লক্ষ্য করুন',
    alertText: '12 মাসের বেশি সময় পেরিয়ে গেলে (অথবা 35 বছর বয়সের পরে 6 মাস পেরোলে) একজন স্বাস্থ্যসেবা পেশাজীবীকে দেখিয়ে পরীক্ষা করানো ভালো, যদিও এর মানে অবশ্যই কোনো সমস্যা আছে তা নয়।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'নিজের চক্র জানা, স্বাভাবিক ছন্দ বজায় রাখা এবং ধৈর্য ধরা: এই তিনটিই এই যাত্রার শান্ত সূচনার স্তম্ভ।',
    shareMessage: 'গর্ভধারণের চেষ্টা: কোথা থেকে শুরু করবেন — AWA',
  },
  da: {
    badge: 'PRØVER AT BLIVE GRAVID',
    title: 'Forsøger at blive gravid:\nhvor skal du starte',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynderniveau',
    metaValidated: 'Gennemgået indhold',
    intro: 'Alt, hvad du behøver at vide for at starte din graviditetsrejse med selvtillid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Kend dit fertile vindue',
      'Seksuel rytme',
      'Hvor lang tid kan det tage',
      'Vigtige pointer',
    ],
    body1: 'Det mest effektive første skridt er at identificere dit fertile vindue ud fra din cyklus: cykluslængde, fysiske tegn, og eventuelt ægløsningstest eller basal kropstemperatur.',
    body2: 'At have sex regelmæssigt, hvert 2. til 3. dag, dækker naturligt dit mest fertile vindue uden for megen stram planlægning.',
    rhythmPoints: [
      'Det er ikke nødvendigt at begrænse sig til selve ægløsningsdagen',
      'En regelmæssig rytme er nemmere end stram planlægning',
      'Parrets velvære er også vigtigt i denne periode',
    ],
    body3: 'De fleste par bliver gravide inden for 12 måneder efter at have stoppet prævention. Denne tidsramme varierer afhængigt af mange faktorer i hver enkelt situation.',
    alertTitle: 'Bemærk',
    alertText: 'Hvis der er gået mere end 12 måneder (eller 6 måneder efter 35-årsalderen), er det en god idé at konsultere en sundhedsprofessionel for en undersøgelse, selvom det ikke nødvendigvis betyder, at der er et problem.',
    tipTitle: 'Godt at vide',
    tipText: 'At kende sin cyklus, opretholde en naturlig rytme og have tålmodighed: disse tre ting er grundstenene for en rolig start på denne rejse.',
    shareMessage: 'Forsøger at blive gravid: hvor skal du starte — AWA',
  },
  sv: {
    badge: 'PRÖVER AT BLIVE GRAVID',
    title: 'Forsöger at blive gravid:\nhvor skal du starte',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynderniveau',
    metaValidated: 'Gennemgået indhold',
    intro: 'Alt, hvad du behöver at vide for att starte din graviditetsrejse med selvtillid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Kend ditt fertile vindue',
      'Seksuel rytme',
      'Hvor lang tid kan det tage',
      'Vigtige pointer',
    ],
    body1: 'Det mest effektive förste skridt ar at identificere ditt fertile vindue ud fran din cyklus: cykluslängde, fysiske tegn, och eventuelt äglösningstest eller basal kropstemperatur.',
    body2: 'At have sex regelmässigt, hvert 2. till 3. dag, däkker naturligt ditt mest fertile vindue uden for megen stram planlägning.',
    rhythmPoints: [
      'Det ar inte nödvendigt at begränse sig till selve äglösningsdagen',
      'En regelmässig rytme ar nemmere end stram planlägning',
      'Parrets velväre ar også vigtigt i denne periode',
    ],
    body3: 'De fleste par bliver gravide inden for 12 måneder efter at have stoppet prävention. Denne tidsramme varierer afhängigt av mange faktorer i hver enkelt situation.',
    alertTitle: 'Bemärk',
    alertText: 'Hvis der ar gået mere end 12 måneder (eller 6 måneder efter 35-årsalderen), ar det en god idé at konsultere en halsasprofessionel for en undersögelse, selvom det inte nödvendigvis betyder, at der ar et problem.',
    tipTitle: 'Godt at vide',
    tipText: 'At kende sin cyklus, opretholde en naturlig rytme och have tålmodighed: disse tre ting ar grundstenene for en rolig start på denne rejse.',
    shareMessage: 'Forsöger at blive gravid: hvor skal du starte — AWA',
  },
  nb: {
    badge: 'PRØVER Å BLI GRAVID',
    title: 'Prøver å bli gravid:\nhvor du bør begynne',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'De viktigste holdepunktene for å starte reisen mot å bli gravid med trygghet.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Finne ditt fruktbare vindu',
      'Hvor ofte du bør ha samleie',
      'Hvor lang tid det kan ta',
      'Det viktigste å huske',
    ],
    body1: 'Det mest nyttige første steget er å finne det fruktbare vinduet ditt ut fra syklusen: sykluslengde, kroppslige tegn og, hvis du ønsker, sporingsverktøy som eggløsningstester eller basaltemperatur.',
    body2: 'Å ha samleie regelmessig, hver 2. til 3. dag, dekker naturlig den mest fruktbare perioden din uten at det krever altfor stiv planlegging.',
    rhythmPoints: [
      'Du trenger ikke begrense deg til selve eggløsningsdagen',
      'En jevn rytme er lettere å holde enn streng planlegging',
      'Parets velvære er også viktig i denne tiden',
    ],
    body3: 'De fleste par blir gravide innen 12 måneder etter at de har sluttet med prevensjon. Dette tidsrommet varierer ut fra mange faktorer som er spesifikke for hver situasjon.',
    alertTitle: 'Merk',
    alertText: 'Etter 12 måneder (eller 6 måneder etter fylte 35 år) er det lurt å oppsøke helsepersonell for en sjekk, selv om det ikke nødvendigvis betyr at det er noe galt.',
    tipTitle: 'Godt å vite',
    tipText: 'Å kjenne syklusen din, holde en naturlig rytme og være tålmodig er de tre pilarene for en rolig start på denne reisen.',
    shareMessage: 'Prøver å bli gravid: hvor du bør begynne – AWA',
  },
  pl: {
    badge: 'STARANIA O DZIECKO',
    title: 'Starania o dziecko:\nod czego zacząć',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Najważniejsze wskazówki, by z pewnością rozpocząć drogę do poczęcia.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Rozpoznawanie okna płodności',
      'Rytm współżycia',
      'Ile to może potrwać',
      'Najważniejsze wnioski',
    ],
    body1: 'Najbardziej pomocnym pierwszym krokiem jest rozpoznanie okna płodności na podstawie cyklu: jego długości, objawów fizycznych oraz, jeśli chcesz, narzędzi takich jak testy owulacyjne czy pomiar podstawowej temperatury ciała.',
    body2: 'Regularne współżycie, co 2–3 dni, w naturalny sposób obejmuje Twój najbardziej płodny okres, bez potrzeby zbyt sztywnego planowania.',
    rhythmPoints: [
      'Nie trzeba ograniczać się tylko do dnia owulacji',
      'Regularny rytm łatwiej utrzymać niż ścisłe planowanie',
      'Dobre samopoczucie pary też ma w tym czasie znaczenie',
    ],
    body3: 'Większość par poczyna w ciągu 12 miesięcy od odstawienia antykoncepcji. Ten czas zależy od wielu czynników właściwych dla każdej sytuacji.',
    alertTitle: 'Zwróć uwagę',
    alertText: 'Po 12 miesiącach (lub 6 miesiącach po 35. roku życia) warto zgłosić się do specjalisty na badania kontrolne, choć niekoniecznie oznacza to, że coś jest nie tak.',
    tipTitle: 'Warto wiedzieć',
    tipText: 'Znajomość własnego cyklu, naturalny rytm i cierpliwość to trzy filary spokojnego początku tej drogi.',
    shareMessage: 'Starania o dziecko: od czego zacząć — AWA',
  },
  uk: {
    badge: 'ПЛАНУВАННЯ ВАГІТНОСТІ',
    title: 'Планування вагітності:\nз чого почати',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Основні орієнтири, щоб упевнено розпочати шлях до зачаття.',
    contentsTitle: 'У цій статті',
    topics: [
      'Визначення фертильного вікна',
      'Ритм статевого життя',
      'Скільки це може тривати',
      'Головні висновки',
    ],
    body1: 'Найкорисніший перший крок — визначити фертильне вікно за вашим циклом: його тривалістю, фізичними ознаками та, за бажання, інструментами відстеження, як-от овуляційні тести чи базальна температура тіла.',
    body2: 'Регулярне статеве життя, кожні 2–3 дні, природно охоплює ваш найфертильніший період без потреби надто жорсткого планування.',
    rhythmPoints: [
      'Не потрібно обмежуватися лише днем овуляції',
      'Регулярний ритм легше підтримувати, ніж суворе планування',
      'Комфорт пари в цей час також важливий',
    ],
    body3: 'Більшість пар зачинають протягом 12 місяців після припинення контрацепції. Цей строк залежить від багатьох чинників, властивих кожній ситуації.',
    alertTitle: 'Зверніть увагу',
    alertText: 'Після 12 місяців (або 6 місяців після 35 років) варто звернутися до лікаря для обстеження, хоча це не обов’язково означає, що є проблема.',
    tipTitle: 'Варто знати',
    tipText: 'Знання свого циклу, природний ритм і терпіння — три опори спокійного початку цього шляху.',
    shareMessage: 'Планування вагітності: з чого почати — AWA',
  },
  cs: {
    badge: 'SNAHA O POČETÍ',
    title: 'Snaha o početí:\nkde začít',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Základní orientační body pro sebevědomý začátek vaší cesty k početí.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Určení plodného období',
      'Rytmus pohlavního styku',
      'Jak dlouho to může trvat',
      'Hlavní poznatky',
    ],
    body1: 'Nejužitečnějším prvním krokem je určit své plodné období pomocí cyklu: délky cyklu, tělesných příznaků a, pokud chcete, nástrojů ke sledování, jako jsou ovulační testy nebo bazální tělesná teplota.',
    body2: 'Pravidelný pohlavní styk, každé 2 až 3 dny, přirozeně pokrývá vaše nejplodnější období, aniž by vyžadoval příliš pevné plánování.',
    rhythmPoints: [
      'Není třeba se omezovat jen na den ovulace',
      'Pravidelný rytmus je snazší udržet než přísné plánování',
      'Pohoda páru je v tomto období také důležitá',
    ],
    body3: 'Většina párů otěhotní do 12 měsíců od ukončení antikoncepce. Tato doba se liší podle mnoha faktorů specifických pro každou situaci.',
    alertTitle: 'Upozornění',
    alertText: 'Po 12 měsících (nebo po 6 měsících po 35. roce věku) je vhodné navštívit zdravotnického pracovníka kvůli vyšetření, i když to nutně neznamená, že je něco v nepořádku.',
    tipTitle: 'Stojí za to vědět',
    tipText: 'Znát svůj cyklus, dodržovat přirozený rytmus a zachovat trpělivost jsou tři pilíře klidného začátku této cesty.',
    shareMessage: 'Snaha o početí: kde začít — AWA',
  },
  sk: {
    badge: 'SNAHA O POČATIE',
    title: 'Snaha o počatie:\nkde začať',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Základné orientačné body, vďaka ktorým začnete cestu k počatiu s dôverou.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Určenie vášho plodného okna',
      'Rytmus pohlavných stykov',
      'Ako dlho to môže trvať',
      'Hlavné body',
    ],
    body1: 'Najužitočnejším prvým krokom je určiť svoje plodné okno podľa cyklu: dĺžka cyklu, fyzické znaky a, ak chcete, nástroje na sledovanie, ako sú ovulačné testy alebo bazálna telesná teplota.',
    body2: 'Pravidelné pohlavné styky každé 2 až 3 dni prirodzene pokrývajú vaše najplodnejšie obdobie bez potreby príliš prísneho plánovania.',
    rhythmPoints: [
      'Netreba sa obmedzovať iba na deň ovulácie',
      'Pravidelný rytmus sa dodržiava ľahšie než prísne plánovanie',
      'Počas tohto obdobia je dôležitá aj pohoda páru',
    ],
    body3: 'Väčšina párov počne do 12 mesiacov po ukončení antikoncepcie. Toto obdobie sa líši podľa mnohých faktorov špecifických pre každú situáciu.',
    alertTitle: 'Upozornenie',
    alertText: 'Po 12 mesiacoch (alebo po 6 mesiacoch po 35. roku veku) je vhodné navštíviť zdravotníckeho pracovníka na vyšetrenie, hoci to nemusí znamenať, že existuje problém.',
    tipTitle: 'Stojí za to vedieť',
    tipText: 'Poznať svoj cyklus, udržať prirodzený rytmus a zostať trpezlivá sú tri piliere pokojného začiatku tejto cesty.',
    shareMessage: 'Snaha o počatie: kde začať — AWA',
  },
  hu: {
    badge: 'BABAVÁRÁS',
    title: 'Babavárás:\nhol kezdjük',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A legfontosabb tudnivalók ahhoz, hogy magabiztosan kezdd el a babavárás útját.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A termékeny időszak meghatározása',
      'A nemi élet ritmusa',
      'Mennyi ideig tarthat',
      'Legfontosabb tudnivalók',
    ],
    body1: 'A leghasznosabb első lépés a termékeny időszak meghatározása a ciklusod alapján: a ciklus hossza, a testi jelek és — ha szeretnéd — követési eszközök, például peteérési tesztek vagy az alapvető testhőmérséklet.',
    body2: 'A rendszeres, 2–3 naponta történő nemi élet természetesen lefedi a legtermékenyebb időszakodat, anélkül, hogy túl merev tervezésre lenne szükség.',
    rhythmPoints: [
      'Nem kell csak a peteérés napjára korlátozódni',
      'A rendszeres ritmust könnyebb fenntartani, mint a szigorú tervezést',
      'A pár jóléte is fontos ebben az időszakban',
    ],
    body3: 'A legtöbb pár a fogamzásgátlás abbahagyását követő 12 hónapon belül fogan. Ez az időtartam számos, az adott helyzetre jellemző tényezőtől függően változik.',
    alertTitle: 'Figyelem',
    alertText: '12 hónap után (vagy 35 éves kor felett 6 hónap után) tanácsos egészségügyi szakembert felkeresni kivizsgálásra, bár ez nem feltétlenül jelent problémát.',
    tipTitle: 'Érdemes tudni',
    tipText: 'A ciklusod ismerete, a természetes ritmus megtartása és a türelem a három pillére ennek az útnak a nyugodt kezdéséhez.',
    shareMessage: 'Babavárás: hol kezdjük — AWA',
  },
  ro: {
    badge: 'ÎNCERC SĂ RĂMÂN ÎNSĂRCINATĂ',
    title: 'Încercarea de a rămâne însărcinată:\nde unde să începi',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Reperele esențiale pentru a începe cu încredere drumul spre concepție.',
    contentsTitle: 'În acest articol',
    topics: [
      'Identificarea ferestrei tale fertile',
      'Ritmul raporturilor intime',
      'Cât poate dura',
      'Ce să reții',
    ],
    body1: 'Cel mai util prim pas este identificarea ferestrei fertile pe baza ciclului tău: durata ciclului, semnele fizice și, dacă dorești, instrumente de urmărire precum testele de ovulație sau temperatura bazală.',
    body2: 'Raporturile intime regulate, la fiecare 2-3 zile, acoperă în mod natural perioada ta cea mai fertilă, fără a necesita o planificare prea rigidă.',
    rhythmPoints: [
      'Nu e nevoie să te limitezi doar la ziua ovulației',
      'Un ritm regulat este mai ușor de menținut decât o planificare strictă',
      'Starea de bine a cuplului contează și ea în această perioadă',
    ],
    body3: 'Majoritatea cuplurilor concep în 12 luni de la oprirea contracepției. Acest interval variază în funcție de numeroși factori specifici fiecărei situații.',
    alertTitle: 'Atenție',
    alertText: 'După 12 luni (sau 6 luni după vârsta de 35 de ani), este recomandat să consulți un profesionist din domeniul sănătății pentru un bilanț, deși aceasta nu înseamnă neapărat că există o problemă.',
    tipTitle: 'Bine de știut',
    tipText: 'Cunoașterea ciclului tău, menținerea unui ritm natural și răbdarea sunt cei trei piloni ai unui început liniștit pe acest drum.',
    shareMessage: 'Încercarea de a rămâne însărcinată: de unde să începi — AWA',
  },
  bg: {
    badge: 'ОПИТВАМ СЕ ДА ЗАБРЕМЕНЕЯ',
    title: 'Опит за зачеване:\nоткъде да започнеш',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Основните ориентири, за да започнеш уверено пътя си към зачеването.',
    contentsTitle: 'В тази статия',
    topics: [
      'Определяне на плодовития ти прозорец',
      'Ритъмът на половите контакти',
      'Колко време може да отнеме',
      'Какво да запомниш',
    ],
    body1: 'Най-полезната първа стъпка е да определиш плодовития си прозорец въз основа на цикъла си: продължителност на цикъла, физически признаци и, ако желаеш, инструменти за проследяване като тестове за овулация или базална температура.',
    body2: 'Редовните полови контакти, на всеки 2 до 3 дни, естествено покриват най-плодовития ти период, без да изискват прекалено строго планиране.',
    rhythmPoints: [
      'Не е нужно да се ограничаваш само до деня на овулацията',
      'Редовният ритъм е по-лесен за поддържане от строгото планиране',
      'Доброто състояние на двойката също има значение през този период',
    ],
    body3: 'Повечето двойки зачеват в рамките на 12 месеца след спиране на контрацепцията. Този срок варира в зависимост от многобройни фактори, специфични за всяка ситуация.',
    alertTitle: 'Обърни внимание',
    alertText: 'След 12 месеца (или 6 месеца след 35-годишна възраст) е препоръчително да се консултираш със здравен специалист за преглед, макар това да не означава непременно, че има проблем.',
    tipTitle: 'Добре е да знаеш',
    tipText: 'Познаването на цикъла ти, поддържането на естествен ритъм и търпението са трите стълба на спокойното начало на този път.',
    shareMessage: 'Опит за зачеване: откъде да започнеш — AWA',
  },
  sr: {
    badge: 'ПОКУШАВАМ ДА ЗАТРУДНИМ',
    title: 'Покушај зачећа:\nод чега да почнеш',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Основне смернице да са самопоуздањем започнеш свој пут ка зачећу.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Препознавање твог плодног прозора',
      'Ритам односа',
      'Колико то може трајати',
      'Шта да запамтиш',
    ],
    body1: 'Најкорисније прво правило је препознавање свог плодног прозора на основу циклуса: трајање циклуса, физички знаци и, ако желиш, алати за праћење као што су тестови овулације или базална телесна температура.',
    body2: 'Редовни односи, сваких 2 до 3 дана, природно покривају твој најплоднији период без потребе за претерано крутим планирањем.',
    rhythmPoints: [
      'Нема потребе да се ограничаваш само на дан овулације',
      'Редован ритам је лакше одржати него строго планирање',
      'Благостање пара је такође важно током овог времена',
    ],
    body3: 'Већина парова зачне у року од 12 месеци од престанка контрацепције. Овај рок варира зависно од многих фактора специфичних за сваку ситуацију.',
    alertTitle: 'Обрати пажњу',
    alertText: 'После 12 месеци (или 6 месеци после 35. године) препоручљиво је да посетиш здравственог радника ради прегледа, мада то не значи нужно да постоји проблем.',
    tipTitle: 'Добро је знати',
    tipText: 'Познавање свог циклуса, природан ритам и стрпљење су три стуба мирног почетка овог пута.',
    shareMessage: 'Покушај зачећа: од чега да почнеш — AWA',
  },
  hr: {
    badge: 'POKUŠAVAM ZATRUDNJETI',
    title: 'Pokušaj začeća:\nodakle krenuti',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Osnovne smjernice za početak puta do začeća s povjerenjem.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Prepoznavanje plodnog prozora',
      'Ritam spolnih odnosa',
      'Koliko to može potrajati',
      'Ključne poruke',
    ],
    body1: 'Najkorisniji prvi korak je prepoznavanje plodnog prozora na temelju ciklusa: duljine ciklusa, tjelesnih znakova te, ako želiš, alata za praćenje poput testova ovulacije ili bazalne temperature.',
    body2: 'Redoviti spolni odnosi, svaka 2 do 3 dana, prirodno pokrivaju tvoje najplodnije razdoblje bez potrebe za pretjerano krutim planiranjem.',
    rhythmPoints: [
      'Nema potrebe ograničavati se samo na dan ovulacije',
      'Redovit ritam lakše je održati nego strogo planiranje',
      'U tom je razdoblju važna i dobrobit para',
    ],
    body3: 'Većina parova zatrudni unutar 12 mjeseci od prestanka kontracepcije. To se razdoblje razlikuje ovisno o brojnim čimbenicima specifičnima za svaku situaciju.',
    alertTitle: 'Napomena',
    alertText: 'Nakon 12 mjeseci (ili 6 mjeseci nakon 35. godine) preporučljivo je posjetiti zdravstvenog djelatnika radi provjere, iako to ne znači nužno da postoji problem.',
    tipTitle: 'Dobro je znati',
    tipText: 'Poznavanje ciklusa, održavanje prirodnog ritma i strpljenje tri su stupa mirnog početka ovog puta.',
    shareMessage: 'Pokušaj začeća: odakle krenuti — AWA',
  },
  bs: {
    badge: 'POKUŠAVAM ZATRUDNJETI',
    title: 'Pokušaj začeća:\nodakle krenuti',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Osnovne smjernice za početak puta do začeća s povjerenjem.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Prepoznavanje plodnog prozora',
      'Ritam spolnih odnosa',
      'Koliko to može potrajati',
      'Ključne poruke',
    ],
    body1: 'Najkorisniji prvi korak je prepoznavanje plodnog prozora na temelju ciklusa: duljine ciklusa, tjelesnih znakova te, ako želiš, alata za praćenje poput testova ovulacije ili bazalne temperature.',
    body2: 'Redoviti spolni odnosi, svaka 2 do 3 dana, prirodno pokrivaju tvoje najplodnije razdoblje bez potrebe za pretjerano krutim planiranjem.',
    rhythmPoints: [
      'Nema potrebe ograničavati se samo na dan ovulacije',
      'Redovit ritam lakše je održati nego strogo planiranje',
      'U tom je razdoblju važna i dobrobit para',
    ],
    body3: 'Većina parova zatrudni unutar 12 mjeseci od prestanka kontracepcije. To se razdoblje razlikuje ovisno o brojnim čimbenicima specifičnima za svaku situaciju.',
    alertTitle: 'Napomena',
    alertText: 'Nakon 12 mjeseci (ili 6 mjeseci nakon 35. godine) preporučljivo je posjetiti zdravstvenog radnika radi provjere, iako to ne znači nužno da postoji problem.',
    tipTitle: 'Dobro je znati',
    tipText: 'Poznavanje ciklusa, održavanje prirodnog ritma i strpljenje tri su stupa mirnog početka ovog puta.',
    shareMessage: 'Pokušaj začeća: odakle krenuti — AWA',
  },
  sl: {
    badge: 'POSKUŠAM ZANOSITI',
    title: 'Poskus zanositve:\nkje začeti',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Osnovne smernice za začetek poti do zanositve z zaupanjem.',
    contentsTitle: 'V tem članku',
    topics: [
      'Prepoznavanje plodnega obdobja',
      'Ritem spolnih odnosov',
      'Koliko lahko traja',
      'Ključna sporočila',
    ],
    body1: 'Najkoristnejši prvi korak je prepoznavanje plodnega obdobja na podlagi cikla: dolžine cikla, telesnih znakov in, če želiš, orodij za spremljanje, kot so testi ovulacije ali bazalna temperatura.',
    body2: 'Redni spolni odnosi, vsake 2 do 3 dni, naravno pokrijejo tvoje najplodnejše obdobje brez potrebe po pretirano togem načrtovanju.',
    rhythmPoints: [
      'Ni se treba omejiti samo na dan ovulacije',
      'Reden ritem je lažje ohranjati kot strogo načrtovanje',
      'V tem obdobju je pomembno tudi dobro počutje para',
    ],
    body3: 'Večina parov zanosi v 12 mesecih po prenehanju kontracepcije. To obdobje se razlikuje glede na številne dejavnike, specifične za vsako situacijo.',
    alertTitle: 'Opomba',
    alertText: 'Po 12 mesecih (ali 6 mesecih po 35. letu) je priporočljivo obiskati zdravstvenega delavca zaradi pregleda, čeprav to nujno ne pomeni, da obstaja težava.',
    tipTitle: 'Vredno vedeti',
    tipText: 'Poznavanje cikla, ohranjanje naravnega ritma in potrpežljivost so trije stebri mirnega začetka te poti.',
    shareMessage: 'Poskus zanositve: kje začeti — AWA',
  },
  ne: {
    badge: 'गर्भधारणको प्रयास',
    title: 'गर्भधारणको प्रयास:\nकहाँबाट सुरु गर्ने',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'आत्मविश्वासका साथ आफ्नो गर्भधारणको यात्रा सुरु गर्न आवश्यक मुख्य सङ्केतहरू।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'आफ्नो उर्वर अवधि पहिचान गर्ने',
      'सम्भोगको लय',
      'कति समय लाग्न सक्छ',
      'मुख्य कुराहरू',
    ],
    body1: 'सबैभन्दा उपयोगी पहिलो पाइला आफ्नो चक्र प्रयोग गरेर उर्वर अवधि पहिचान गर्नु हो: चक्रको अवधि, शारीरिक संकेतहरू, र चाहनुहुन्छ भने अण्डोत्सर्ग परीक्षण वा आधारभूत शारीरिक तापक्रम जस्ता अनुगमन साधनहरू।',
    body2: 'हरेक 2 देखि 3 दिनमा नियमित सम्भोग गर्नाले अति कठोर योजनाबिना स्वाभाविक रूपमा तपाईंको सबैभन्दा उर्वर अवधि समेट्छ।',
    rhythmPoints: [
      'केवल अण्डोत्सर्गको दिनमै सीमित हुनुपर्दैन',
      'कडा योजनाभन्दा नियमित लय कायम राख्न सजिलो हुन्छ',
      'यस समयमा दम्पतीको भलाइ पनि महत्त्वपूर्ण हुन्छ',
    ],
    body3: 'धेरैजसो दम्पतीले गर्भनिरोधन रोकेको 12 महिनाभित्र गर्भधारण गर्छन्। यो समयावधि हरेक अवस्था-विशेषका धेरै कारकअनुसार फरक हुन्छ।',
    alertTitle: 'कृपया ध्यान दिनुहोस्',
    alertText: '12 महिनाभन्दा बढी (वा 35 वर्षपछि 6 महिना) भएमा, जाँचका लागि स्वास्थ्यकर्मीलाई देखाउनु उचित हुन्छ, तर यसको अर्थ समस्या छ भन्ने अनिवार्य होइन।',
    tipTitle: 'जान्न लायक',
    tipText: 'आफ्नो चक्र जान्नु, स्वाभाविक लय कायम राख्नु र धैर्य राख्नु यो यात्राको शान्त सुरुवातका तीन आधारस्तम्भ हुन्।',
    shareMessage: 'गर्भधारणको प्रयास: कहाँबाट सुरु गर्ने — AWA',
  },
  si: {
    badge: 'ගැබ්ගැනීමට උත්සාහ කිරීම',
    title: 'ගැබ්ගැනීමට උත්සාහ කිරීම:\nආරම්භ කළ යුත්තේ කොතැනින්ද',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ ගැබ්ගැනීමේ ගමන විශ්වාසයෙන් ආරම්භ කිරීමට අත්‍යවශ්‍ය යොමු ලක්ෂ්‍ය.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඔබේ සාරවත් කාලය හඳුනාගැනීම',
      'සංසර්ගයේ රිද්මය',
      'එයට ගත විය හැකි කාලය',
      'ප්‍රධාන කරුණු',
    ],
    body1: 'වඩාත්ම ප්‍රයෝජනවත් පළමු පියවර නම් ඔබේ චක්‍රය භාවිතයෙන් ඔබේ සාරවත් කාලය හඳුනාගැනීමයි: චක්‍රයේ දිග, ශාරීරික සලකුණු, සහ ඔබට කැමති නම්, ඩිම්බ මෝචන පරීක්ෂණ හෝ මූලික ශරීර උෂ්ණත්වය වැනි නිරීක්ෂණ මෙවලම්.',
    body2: 'සෑම දින 2 සිට 3 දක්වා නිතිපතා සංසර්ගයේ යෙදීම, අධික දැඩි සැලසුම්කරණයක් අවශ්‍ය නොවී ඔබේ වඩාත්ම සාරවත් කාලය ස්වභාවිකවම ආවරණය කරයි.',
    rhythmPoints: [
      'ඩිම්බ මෝචන දිනයට පමණක් සීමා වීමට අවශ්‍ය නැත',
      'දැඩි සැලසුම්කරණයට වඩා නිතිපතා රිද්මයක් පවත්වා ගැනීම පහසුයි',
      'මෙම කාලය තුළ යුවළගේ යහපැවැත්මද වැදගත්',
    ],
    body3: 'බොහෝ යුවළන් ගර්භනිරෝධනය නැවැත්වීමෙන් මාස 12ක් ඇතුළත ගැබ්ගනී. මෙම කාල රාමුව සෑම තත්ත්වයකටම විශේෂිත බොහෝ සාධක අනුව වෙනස් වේ.',
    alertTitle: 'කරුණාකර සටහන් කරන්න',
    alertText: 'මාස 12කට පසු (හෝ වයස 35න් පසු මාස 6කට පසු), පරීක්ෂාවක් සඳහා සෞඛ්‍ය වෘත්තිකයෙකු හමුවීම යෝග්‍ය වුවද, එයින් අනිවාර්යයෙන්ම ගැටලුවක් ඇති බව අදහස් නොවේ.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText: 'ඔබේ චක්‍රය දැනගැනීම, ස්වාභාවික රිද්මයක් පවත්වා ගැනීම, සහ ඉවසීමෙන් සිටීම මෙම ගමන සන්සුන්ව ආරම්භ කිරීමේ ආධාරක තුනයි.',
    shareMessage: 'ගැබ්ගැනීමට උත්සාහ කිරීම: ආරම්භ කළ යුත්තේ කොතැනින්ද — AWA',
  },
  th: {
    badge: 'วางแผนมีบุตร',
    title: 'การพยายามมีบุตร:\nเริ่มต้นจากตรงไหน',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'หลักสำคัญสำหรับการเริ่มต้นเส้นทางการมีบุตรอย่างมั่นใจ',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'การระบุช่วงเจริญพันธุ์ของคุณ',
      'จังหวะของการมีเพศสัมพันธ์',
      'อาจใช้เวลานานเท่าไร',
      'ประเด็นสำคัญ',
    ],
    body1: 'ก้าวแรกที่มีประโยชน์ที่สุดคือการระบุช่วงเจริญพันธุ์จากรอบเดือนของคุณ: ความยาวรอบเดือน สัญญาณทางกาย และหากต้องการ เครื่องมือติดตาม เช่น การตรวจการตกไข่หรืออุณหภูมิร่างกายขณะพัก',
    body2: 'การมีเพศสัมพันธ์สม่ำเสมอ ทุก 2 ถึง 3 วัน ครอบคลุมช่วงที่เจริญพันธุ์ที่สุดของคุณโดยธรรมชาติ โดยไม่ต้องวางแผนเข้มงวดเกินไป',
    rhythmPoints: [
      'ไม่จำเป็นต้องจำกัดอยู่แค่วันตกไข่วันเดียว',
      'จังหวะที่สม่ำเสมอรักษาไว้ได้ง่ายกว่าการวางแผนอย่างเข้มงวด',
      'ความเป็นอยู่ที่ดีของคู่ก็สำคัญในช่วงเวลานี้เช่นกัน',
    ],
    body3: 'คู่ส่วนใหญ่ตั้งครรภ์ภายใน 12 เดือนหลังหยุดคุมกำเนิด กรอบเวลานี้แตกต่างกันไปตามปัจจัยมากมายเฉพาะของแต่ละสถานการณ์',
    alertTitle: 'โปรดทราบ',
    alertText: 'เกิน 12 เดือน (หรือ 6 เดือนหลังอายุ 35 ปี) ควรพบบุคลากรทางการแพทย์เพื่อตรวจ แม้ไม่ได้หมายความว่าจะมีปัญหาเสมอไป',
    tipTitle: 'ควรรู้',
    tipText: 'การรู้จักรอบเดือนของตัวเอง การรักษาจังหวะตามธรรมชาติ และความอดทน เป็นสามเสาหลักของการเริ่มต้นเส้นทางนี้อย่างสงบ',
    shareMessage: 'การพยายามมีบุตร: เริ่มต้นจากตรงไหน — AWA',
  },
  vi: {
    badge: 'CỐ GẮNG THỤ THAI',
    title: 'Cố gắng thụ thai:\nbắt đầu từ đâu',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Những mốc thiết yếu để bắt đầu hành trình thụ thai một cách tự tin.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Xác định giai đoạn dễ thụ thai của bạn',
      'Nhịp độ quan hệ tình dục',
      'Có thể mất bao lâu',
      'Những điểm chính cần nhớ',
    ],
    body1: 'Bước đầu tiên hữu ích nhất là xác định giai đoạn dễ thụ thai dựa trên chu kỳ của bạn: độ dài chu kỳ, các dấu hiệu cơ thể và, nếu bạn muốn, các công cụ theo dõi như que thử rụng trứng hoặc thân nhiệt cơ bản.',
    body2: 'Quan hệ tình dục đều đặn, cách 2 đến 3 ngày một lần, tự nhiên bao phủ giai đoạn dễ thụ thai nhất của bạn mà không cần lên kế hoạch quá cứng nhắc.',
    rhythmPoints: [
      'Không cần giới hạn ở riêng ngày rụng trứng',
      'Một nhịp độ đều đặn dễ duy trì hơn là kế hoạch nghiêm ngặt',
      'Sức khỏe tinh thần của cặp đôi cũng quan trọng trong giai đoạn này',
    ],
    body3: 'Hầu hết các cặp đôi thụ thai trong vòng 12 tháng sau khi ngừng tránh thai. Khoảng thời gian này thay đổi tùy theo nhiều yếu tố riêng của từng trường hợp.',
    alertTitle: 'Xin lưu ý',
    alertText: 'Sau 12 tháng (hoặc 6 tháng nếu trên 35 tuổi), nên đến gặp nhân viên y tế để kiểm tra, dù điều đó không nhất thiết có nghĩa là có vấn đề.',
    tipTitle: 'Nên biết',
    tipText: 'Hiểu rõ chu kỳ của mình, giữ nhịp độ tự nhiên và kiên nhẫn là ba trụ cột của một khởi đầu bình tĩnh cho hành trình này.',
    shareMessage: 'Cố gắng thụ thai: bắt đầu từ đâu — AWA',
  },
  uz: {
    badge: 'HOMILADOR BOʻLISHGA URINISH',
    title: 'Homilador boʻlishga urinish:\nqayerdan boshlash kerak',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Homilador boʻlish yoʻlingizni ishonch bilan boshlash uchun asosiy tayanch nuqtalar.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Unumdorlik davrini aniqlash',
      'Jinsiy aloqa ritmi',
      'Bu qancha vaqt olishi mumkin',
      'Asosiy xulosalar',
    ],
    body1: 'Eng foydali birinchi qadam — siklingiz yordamida unumdorlik davringizni aniqlash: sikl uzunligi, jismoniy belgilar va xohlasangiz, ovulyatsiya testlari yoki bazal tana harorati kabi kuzatuv vositalari.',
    body2: 'Muntazam, har 2 kundan 3 kungacha jinsiy aloqa qilish haddan tashqari qatʼiy rejalashtirishni talab qilmasdan, eng unumdor davringizni tabiiy ravishda qamrab oladi.',
    rhythmPoints: [
      'Faqat ovulyatsiya kuni bilan cheklanish shart emas',
      'Muntazam ritmni qatʼiy rejalashtirishdan koʻra saqlash osonroq',
      'Bu davrda juftlikning farovonligi ham muhim',
    ],
    body3: 'Aksariyat juftliklar kontratseptsiyani toʻxtatgandan keyin 12 oy ichida homilador boʻladi. Bu muddat har bir vaziyatga xos koʻplab omillarga qarab oʻzgaradi.',
    alertTitle: 'Eʼtibor bering',
    alertText: '12 oydan keyin (yoki 35 yoshdan keyin 6 oydan keyin) tekshiruv uchun sogʻliqni saqlash mutaxassisiga murojaat qilish tavsiya etiladi, ammo bu albatta muammo borligini anglatmaydi.',
    tipTitle: 'Bilish foydali',
    tipText: 'Siklingizni bilish, tabiiy ritmni saqlash va sabrli boʻlish — bu yoʻlni xotirjam boshlashning uch tayanchi.',
    shareMessage: 'Homilador boʻlishga urinish: qayerdan boshlash kerak — AWA',
  },
  az: {
    badge: 'HAMİLƏ QALMAĞA CƏHD',
    title: 'Hamilə qalmağa cəhd:\nnədən başlamaq lazımdır',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Hamilə qalma yolunuza əminliklə başlamaq üçün əsas istiqamətlər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Münbit dövrünüzü müəyyən etmək',
      'Cinsi əlaqənin ritmi',
      'Bunun nə qədər çəkə biləcəyi',
      'Əsas nəticələr',
    ],
    body1: 'Ən faydalı ilk addım dövrünüzdən istifadə edərək münbit dövrünüzü müəyyən etməkdir: dövrün uzunluğu, fiziki əlamətlər və istəsəniz, ovulyasiya testləri və ya bazal bədən temperaturu kimi izləmə vasitələri.',
    body2: 'Müntəzəm, hər 2–3 gündən bir cinsi əlaqədə olmaq həddindən artıq sərt planlaşdırma tələb etmədən ən münbit dövrünüzü təbii şəkildə əhatə edir.',
    rhythmPoints: [
      'Yalnız ovulyasiya günü ilə məhdudlaşmağa ehtiyac yoxdur',
      'Müntəzəm ritmi saxlamaq sərt planlaşdırmadan daha asandır',
      'Bu dövrdə cütlüyün rifahı da vacibdir',
    ],
    body3: 'Cütlüklərin əksəriyyəti kontrasepsiyanı dayandırdıqdan sonra 12 ay ərzində hamilə qalır. Bu müddət hər vəziyyətə xas çoxlu amillərdən asılı olaraq dəyişir.',
    alertTitle: 'Nəzərə alın',
    alertText: '12 aydan sonra (və ya 35 yaşdan sonra 6 aydan sonra) yoxlama üçün tibb işçisinə müraciət etmək tövsiyə olunur, baxmayaraq ki, bu mütləq problem olduğunu bildirmir.',
    tipTitle: 'Bilmək faydalıdır',
    tipText: 'Dövrünüzü tanımaq, təbii ritmi saxlamaq və səbirli qalmaq bu yola sakit başlamağın üç dayağıdır.',
    shareMessage: 'Hamilə qalmağa cəhd: nədən başlamaq lazımdır — AWA',
  },
  ka: {
    badge: 'ჩასახვის მცდელობა',
    title: 'ჩასახვის მცდელობა:\nსაიდან დავიწყოთ',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'არსებითი მინიშნებები, რომ ჩასახვის გზა თავდაჯერებულად დაიწყოთ.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'თქვენი ფერტილური ფანჯრის დადგენა',
      'სქესობრივი კავშირის რიტმი',
      'რამდენი დრო შეიძლება დასჭირდეს',
      'მთავარი დასკვნები',
    ],
    body1: 'ყველაზე სასარგებლო პირველი ნაბიჯი თქვენი ფერტილური ფანჯრის დადგენაა თქვენი ციკლის მიხედვით: ციკლის ხანგრძლივობით, ფიზიკური ნიშნებით და, სურვილის შემთხვევაში, საკონტროლო საშუალებებით, როგორიცაა ოვულაციის ტესტები ან ბაზალური ტემპერატურა.',
    body2: 'რეგულარული სქესობრივი კავშირი, ყოველ 2-3 დღეში ერთხელ, ბუნებრივად ფარავს თქვენს ყველაზე ფერტილურ პერიოდს და ზედმეტად მკაცრ დაგეგმვას არ მოითხოვს.',
    rhythmPoints: [
      'არ არის საჭირო მხოლოდ ოვულაციის დღით შემოიფარგლოთ',
      'რეგულარული რიტმი უფრო ადვილი შესანარჩუნებელია, ვიდრე მკაცრი დაგეგმვა',
      'ამ პერიოდში წყვილის კეთილდღეობაც მნიშვნელოვანია',
    ],
    body3: 'წყვილების უმრავლესობა ორსულდება კონტრაცეფციის შეწყვეტიდან 12 თვის განმავლობაში. ეს ვადა დამოკიდებულია ბევრ ფაქტორზე, რომლებიც თითოეულ სიტუაციას ახასიათებს.',
    alertTitle: 'გაითვალისწინეთ',
    alertText: '12 თვის შემდეგ (ან 35 წლის ასაკის შემდეგ 6 თვის შემდეგ) მიზანშეწონილია ჯანდაცვის სპეციალისტთან გასინჯვა, თუმცა ეს აუცილებლად პრობლემის არსებობას არ ნიშნავს.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText: 'თქვენი ციკლის ცოდნა, ბუნებრივი რიტმის შენარჩუნება და მოთმინება ამ გზის მშვიდად დაწყების სამი საყრდენია.',
    shareMessage: 'ჩასახვის მცდელობა: საიდან დავიწყოთ — AWA',
  },
  hy: {
    badge: 'ՓՈՐՁՈՒՄ ԵՄ ՀՂԻԱՆԱԼ',
    title: 'Փորձում եմ հղիանալ.\nորտեղից սկսել',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Էական ուղենիշներ՝ հղիանալու ճանապարհը վստահությամբ սկսելու համար:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ձեր պտղաբեր պատուհանի որոշումը',
      'Սեռական հարաբերությունների ռիթմը',
      'Որքան ժամանակ կարող է տևել',
      'Հիմնական եզրակացություններ',
    ],
    body1: 'Ամենաօգտակար առաջին քայլը ձեր պտղաբեր պատուհանի որոշումն է՝ ձեր ցիկլի հիման վրա. ցիկլի տևողություն, ֆիզիկական նշաններ և, եթե ցանկանում եք, հետևման գործիքներ, ինչպիսիք են ձվազատման թեստերը կամ բազալ ջերմաստիճանը:',
    body2: 'Կանոնավոր սեռական հարաբերությունը՝ յուրաքանչյուր 2–3 օրը մեկ, բնականորեն ընդգրկում է ձեր ամենապտղաբեր շրջանը՝ առանց չափազանց կոշտ պլանավորման անհրաժեշտության:',
    rhythmPoints: [
      'Պետք չէ սահմանափակվել միայն ձվազատման օրով',
      'Կանոնավոր ռիթմը ավելի հեշտ է պահպանել, քան խիստ պլանավորումը',
      'Այս ընթացքում զույգի բարեկեցությունը նույնպես կարևոր է',
    ],
    body3: 'Զույգերի մեծ մասը հղիանում է հակաբեղմնավորումը դադարեցնելուց հետո 12 ամսվա ընթացքում: Այս ժամկետը տարբերվում է՝ կախված յուրաքանչյուր իրավիճակին հատուկ բազմաթիվ գործոններից:',
    alertTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    alertText: '12 ամսից հետո (կամ 35 տարեկանից հետո՝ 6 ամսից) խորհուրդ է տրվում դիմել առողջապահության մասնագետի՝ հետազոտության համար, թեև դա պարտադիր չէ, որ նշանակի խնդրի առկայություն:',
    tipTitle: 'Լավ է իմանալ',
    tipText: 'Ձեր ցիկլը իմանալը, բնական ռիթմը պահպանելը և համբերատար մնալը այս ճանապարհը հանգիստ սկսելու երեք հիմնասյուներն են:',
    shareMessage: 'Փորձում եմ հղիանալ. որտեղից սկսել — AWA',
  },
  tg: {
    badge: 'КӮШИШ БАРОИ ҲОМИЛАДОР ШУДАН',
    title: 'Кӯшиш барои ҳомиладор шудан:\nаз куҷо оғоз кардан',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Нуктаҳои асосӣ барои бо боварӣ оғоз кардани роҳи ҳомиладоршавии шумо.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Муайян кардани равзанаи ҳосилхезӣ',
      'Суръати наздикӣ',
      'Чанд вақт метавонад бигирад',
      'Хулосаҳои асосӣ',
    ],
    body1: 'Муфидтарин қадами аввал муайян кардани равзанаи ҳосилхезӣ аз рӯи давраи шумост: дарозии давра, нишонаҳои ҷисмонӣ ва, агар хоҳед, воситаҳои пайгирӣ, ба монанди санҷишҳои овуляция ё ҳарорати базалии бадан.',
    body2: 'Мунтазам наздикӣ кардан, ҳар 2 то 3 рӯз, ба таври табиӣ давраи ҳосилхезтаринро фаро мегирад, бе он ки банақшагирии аз ҳад сахтро талаб кунад.',
    rhythmPoints: [
      'Маҳдуд кардани худ ба танҳо рӯзи овуляция лозим нест',
      'Суръати мунтазамро нигоҳ доштан аз банақшагирии сахт осонтар аст',
      'Некӯаҳволии зану шавҳар низ дар ин давра муҳим аст',
    ],
    body3: 'Аксари ҷуфтҳо дар давоми 12 моҳ пас аз қатъи пешгирӣ ҳомиладор мешаванд. Ин мӯҳлат вобаста ба омилҳои зиёди хоси ҳар вазъият фарқ мекунад.',
    alertTitle: 'Таваҷҷӯҳ кунед',
    alertText: 'Пас аз 12 моҳ (ё 6 моҳ пас аз 35-солагӣ) тавсия дода мешавад ба мутахассиси соҳаи тиб барои санҷиш муроҷиат кунед, гарчанде ки ин ҳатман маънои мушкилро надорад.',
    tipTitle: 'Донистан хуб аст',
    tipText: 'Донистани давраи худ, нигоҳ доштани суръати табиӣ ва сабр — се сутуни оғози оромонаи ин роҳ мебошанд.',
    shareMessage: 'Кӯшиш барои ҳомиладор шудан: аз куҷо оғоз кардан — AWA',
  },
  ky: {
    badge: 'БОЮНА БҮТҮҮГӨ АРАКЕТ КЫЛУУ',
    title: 'Боюна бүтүүгө аракет кылуу:\nкайдан баштоо керек',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Боюна бүтүү жолун ишеним менен баштоо үчүн негизги таяныч чекиттер.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Бойго бүтүү терезеңизди аныктоо',
      'Жыныстык катнаш ритми',
      'Канча убакыт талап кылынышы мүмкүн',
      'Негизги жыйынтыктар',
    ],
    body1: 'Эң пайдалуу биринчи кадам — циклиңиздин негизинде бойго бүтүү терезеңизди аныктоо: цикл узактыгы, физикалык белгилер жана кааласаңыз, овуляция тесттери же базалдык дене температурасы сыяктуу көзөмөл куралдары.',
    body2: 'Үзгүлтүксүз, ар 2–3 күн сайын жыныстык катнашта болуу өтө катуу пландоону талап кылбастан, эң жемиштүү мезгилиңизди табигый түрдө камтыйт.',
    rhythmPoints: [
      'Жалаң овуляция күнү менен чектелүүнүн кереги жок',
      'Үзгүлтүксүз ритмди катуу пландоого караганда сактоо оңой',
      'Бул мезгилде жубайлардын жыргалчылыгы да маанилүү',
    ],
    body3: 'Көпчүлүк жубайлар контрацепцияны токтоткондон кийин 12 ай ичинде боюна бүтөт. Бул мөөнөт ар бир абалга мүнөздүү көптөгөн факторлорго жараша айырмаланат.',
    alertTitle: 'Көңүл буруңуз',
    alertText: '12 айдан кийин (же 35 жаштан кийин 6 айдан кийин) текшерүү үчүн ден соолук сактоо адисине кайрылуу сунушталат, бирок бул сөзсүз көйгөй бар дегенди билдирбейт.',
    tipTitle: 'Билүү пайдалуу',
    tipText: 'Циклиңизди билүү, табигый ритмди сактоо жана сабырдуу болуу — бул жолдун тынч башталышынын үч тирөөчү.',
    shareMessage: 'Боюна бүтүүгө аракет кылуу: кайдан баштоо керек — AWA',
  },
  tk: {
    badge: 'GÖWRELI BOLMAGA AKYL ETMEK',
    title: 'Göwreli bolmaga synanyşmak:\nnireden başlamaly',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Göwreli bolmak ýoluňyzy ynam bilen başlamak üçin esasy görkezmeler.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Göwreli bolmaga ýeterlik döwrüňizi kesgitlemek',
      'Jynsy gatnaşygyň ritmi',
      'Näçe wagt gidip biler',
      'Esasy netijeler',
    ],
    body1: 'Iň peýdaly ilkinji ädim sikliňizi ulanyp göwreli bolmaga ýeterlik döwrüňizi kesgitlemek: sikliň uzynlygy, fiziki alamatlar we islese, ovulýasiýa synaglary ýa-da bazal beden temperaturasy ýaly yzarlama gurallary.',
    body2: 'Yzygiderli, her 2–3 günden jynsy gatnaşykda bolmak aşa berk meýilnamany talap etmän, iň köp göwreli bolmaga ýeterlik döwrüňizi tebigy ýagdaýda gurşap alýar.',
    rhythmPoints: [
      'Diňe ovulýasiýa gününe çäklenmek hökman däl',
      'Yzygiderli ritmi berk meýilnamadan saklamak has aňsat',
      'Bu döwürde jübütiň abadançylygy hem möhüm',
    ],
    body3: 'Köp jübütler göwrelilikden goranyşy bes edeninden soň 12 aýyň içinde göwreli bolýar. Bu möhlet her ýagdaýa mahsus köp faktora görä tapawutlanýar.',
    alertTitle: 'Üns beriň',
    alertText: '12 aýdan soň (ýa-da 35 ýaşdan soň 6 aýdan soň) barlag üçin saglyk hünärmenine ýüz tutmak maslahat berilýär, emma bu hökmany derejede kynçylygyň barlygyny aňlatmaýar.',
    tipTitle: 'Bilmek peýdaly',
    tipText: 'Sikliňizi bilmek, tebigy ritmi saklamak we sabyr etmek bu ýoluň asuda başlanmagynyň üç sütünidir.',
    shareMessage: 'Göwreli bolmaga synanyşmak: nireden başlamaly — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ConceptionStartArticleScreen({
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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.rhythmPoints.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
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
              <AwaText variant="titleSmall" emphasized>{content.tipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tipText}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
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
