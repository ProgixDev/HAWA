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

const ID = 'conceptiontips-essayer-de-concevoir';

const HERO = require('../../assets/images/library/featured-tracker.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
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
} as const;

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
