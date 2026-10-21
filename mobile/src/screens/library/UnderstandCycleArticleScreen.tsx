import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ReadingControls from '../../components/articles/ReadingControls';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {RootStackParamList} from '../../navigation/AppNavigator';
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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ARTICLE_ID = 'cycle-comprendre-ton-cycle';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

// Editorial copy per language. French is the original text (identical to the previous hard-coded JSX) and is
// still what every language without its own block (en/es/it/tr) shows, exactly as before; Russian and German are
// the translations so far. Icons and colors are language-neutral and shared.
const STAT_ICONS = ['water', 'calendar-range', 'circle-slice-4', 'heart-pulse'] as const;
const PHASE_STYLE = [
  {number: '01', icon: 'water', color: '#B95C73'},
  {number: '02', icon: 'leaf', color: '#6B8D6B'},
  {number: '03', icon: 'white-balance-sunny', color: '#A87A32'},
  {number: '04', icon: 'flower-tulip-outline', color: '#71569A'},
] as const;
const REASON_ICONS = [
  'emoticon-happy-outline',
  'lightning-bolt',
  'heart-outline',
  'shield-outline',
  'calendar-month-outline',
] as const;

const CONTENT = withBrazilianPortuguese('UnderstandCycle', {
  fr: {
    shareTitle: 'Comprendre ton cycle menstruel',
    shareMessage: 'Comprendre ton cycle menstruel · AWA',
    pill: 'Comprendre son cycle',
    title: 'Comprendre ton cycle menstruel',
    duration: '6 min de lecture',
    type: 'Guide',
    level: 'Débutant',
    validated: 'Contenu validé',
    summary: 'Les grandes étapes de ton cycle, expliquées simplement.',
    stats: [
      {title: 'Durée moyenne', text: '28 jours'},
      {title: 'Durée normale', text: '21 à 35 jours'},
      {title: '4 grandes phases', text: 'dans ton cycle'},
      {title: 'Chaque cycle', text: 'est unique'},
    ],
    phasesEyebrow: 'PHASES DU CYCLE',
    phasesTitle: 'Les 4 grandes phases',
    phasesIntro: 'Chaque phase a un rôle important dans ton corps et peut influencer ton énergie, ton humeur et tes symptômes.',
    phases: [
      {title: 'Les règles', days: 'Jours 1 à 5', text: 'Ton corps se libère de la muqueuse utérine.'},
      {title: 'Phase folliculaire', days: 'Jours 6 à 13', text: 'Ton corps se prépare à l’ovulation.'},
      {title: 'Ovulation', days: 'Jour 14 environ', text: 'L’ovule est libéré. C’est la période la plus fertile.'},
      {title: 'Phase lutéale', days: 'Jours 15 à 28', text: 'Ton corps se prépare à une éventuelle grossesse.'},
    ],
    knowTitle: 'À savoir',
    knowText: 'Ton cycle peut varier d’un mois à l’autre. Stress, sommeil, alimentation ou maladie peuvent influencer sa durée et son rythme.',
    reasonsEyebrow: 'POURQUOI LE SUIVRE',
    reasonsTitle: 'Mieux comprendre ton cycle',
    reasons: [
      'Mieux comprendre ton corps',
      'Adapter ton énergie',
      'Anticiper ton humeur',
      'Prendre soin de ta santé',
      'Suivre ton cycle facilement',
    ],
    wellTitle: 'Conseil bien-être',
    wellText: 'Écoute ton corps, reste attentive à tes ressentis et note ce qui change au fil des jours.',
  },
  ru: {
    shareTitle: 'Как устроен менструальный цикл',
    shareMessage: 'Как устроен менструальный цикл · AWA',
    pill: 'Понять свой цикл',
    title: 'Как устроен менструальный цикл',
    duration: '6 мин чтения',
    type: 'Руководство',
    level: 'Для начинающих',
    validated: 'Проверенный материал',
    summary: 'Основные этапы вашего цикла — простыми словами.',
    stats: [
      {title: 'Средняя длительность', text: '28 дней'},
      {title: 'Обычная длительность', text: 'от 21 до 35 дней'},
      {title: '4 основные фазы', text: 'в вашем цикле'},
      {title: 'Каждый цикл', text: 'уникален'},
    ],
    phasesEyebrow: 'ФАЗЫ ЦИКЛА',
    phasesTitle: '4 основные фазы',
    phasesIntro: 'У каждой фазы своя роль в организме, и она может влиять на энергию, настроение и самочувствие.',
    phases: [
      {title: 'Месячные', days: 'Дни 1–5', text: 'Организм освобождается от слизистой оболочки матки.'},
      {title: 'Фолликулярная фаза', days: 'Дни 6–13', text: 'Организм готовится к овуляции.'},
      {title: 'Овуляция', days: 'Около 14-го дня', text: 'Яйцеклетка выходит из яичника. Это самый фертильный период.'},
      {title: 'Лютеиновая фаза', days: 'Дни 15–28', text: 'Организм готовится к возможной беременности.'},
    ],
    knowTitle: 'Полезно знать',
    knowText: 'Цикл может меняться от месяца к месяцу. Стресс, сон, питание или болезнь способны влиять на его длительность и ритм.',
    reasonsEyebrow: 'ЗАЧЕМ ВЕСТИ УЧЁТ',
    reasonsTitle: 'Лучше понимать свой цикл',
    reasons: [
      'Лучше понимать своё тело',
      'Распределять свою энергию',
      'Предугадывать настроение',
      'Заботиться о здоровье',
      'Просто отслеживать цикл',
    ],
    wellTitle: 'Совет для самочувствия',
    wellText: 'Прислушивайтесь к своему телу, обращайте внимание на ощущения и отмечайте, что меняется со временем.',
  },
  de: {
    shareTitle: 'So funktioniert dein Menstruationszyklus',
    shareMessage: 'So funktioniert dein Menstruationszyklus · AWA',
    pill: 'Den Zyklus verstehen',
    title: 'So funktioniert dein Menstruationszyklus',
    duration: '6 Min. Lesezeit',
    type: 'Ratgeber',
    level: 'Einsteiger',
    validated: 'Geprüfter Inhalt',
    summary: 'Die wichtigsten Phasen deines Zyklus – einfach erklärt.',
    stats: [
      {title: 'Durchschnittliche Dauer', text: '28 Tage'},
      {title: 'Normale Dauer', text: '21 bis 35 Tage'},
      {title: '4 Hauptphasen', text: 'in deinem Zyklus'},
      {title: 'Jeder Zyklus', text: 'ist einzigartig'},
    ],
    phasesEyebrow: 'ZYKLUSPHASEN',
    phasesTitle: 'Die 4 Hauptphasen',
    phasesIntro: 'Jede Phase hat eine wichtige Aufgabe im Körper und kann Energie, Stimmung und Beschwerden beeinflussen.',
    phases: [
      {title: 'Periode', days: 'Tag 1–5', text: 'Dein Körper stößt die Gebärmutterschleimhaut ab.'},
      {title: 'Follikelphase', days: 'Tag 6–13', text: 'Dein Körper bereitet sich auf den Eisprung vor.'},
      {title: 'Eisprung', days: 'Etwa Tag 14', text: 'Die Eizelle wird freigesetzt. Das ist die fruchtbarste Zeit.'},
      {title: 'Lutealphase', days: 'Tag 15–28', text: 'Dein Körper bereitet sich auf eine mögliche Schwangerschaft vor.'},
    ],
    knowTitle: 'Gut zu wissen',
    knowText: 'Dein Zyklus kann von Monat zu Monat schwanken. Stress, Schlaf, Ernährung oder Krankheit können seine Länge und seinen Rhythmus beeinflussen.',
    reasonsEyebrow: 'WARUM TRACKEN',
    reasonsTitle: 'Deinen Zyklus besser verstehen',
    reasons: [
      'Deinen Körper besser verstehen',
      'Deine Energie gezielt einsetzen',
      'Stimmungen früher erkennen',
      'Gut für deine Gesundheit sorgen',
      'Deinen Zyklus einfach verfolgen',
    ],
    wellTitle: 'Tipp fürs Wohlbefinden',
    wellText: 'Höre auf deinen Körper, achte auf deine Empfindungen und halte fest, was sich im Lauf der Tage verändert.',
  },
  zh: {
    shareTitle: '了解你的月经周期',
    shareMessage: '了解你的月经周期 · AWA',
    pill: '了解周期',
    title: '了解你的月经周期',
    duration: '阅读约 6 分钟',
    type: '指南',
    level: '入门',
    validated: '已审核内容',
    summary: '用简单的方式，讲清你月经周期的几个主要阶段。',
    stats: [
      {title: '平均时长', text: '28 天'},
      {title: '正常范围', text: '21 至 35 天'},
      {title: '4 个主要阶段', text: '贯穿你的周期'},
      {title: '每个周期', text: '都是独一无二的'},
    ],
    phasesEyebrow: '周期阶段',
    phasesTitle: '4 个主要阶段',
    phasesIntro: '每个阶段在你的身体里都有重要作用，也可能影响你的精力、情绪和症状。',
    phases: [
      {title: '月经期', days: '第 1 至 5 天', text: '身体排出子宫内膜。'},
      {title: '卵泡期', days: '第 6 至 13 天', text: '身体为排卵做准备。'},
      {title: '排卵期', days: '约第 14 天', text: '卵子被释放，这是最易孕的时期。'},
      {title: '黄体期', days: '第 15 至 28 天', text: '身体为可能的怀孕做准备。'},
    ],
    knowTitle: '小贴士',
    knowText: '你的周期每个月都可能不同。压力、睡眠、饮食或疾病都可能影响它的长短和节律。',
    reasonsEyebrow: '为什么要记录',
    reasonsTitle: '更好地了解你的周期',
    reasons: [
      '更了解自己的身体',
      '合理安排精力',
      '提前留意情绪变化',
      '照顾好自己的健康',
      '轻松记录你的周期',
    ],
    wellTitle: '健康小建议',
    wellText: '倾听身体的声音，留意自己的感受，并记下日常的变化。',
  },
  id: {
    shareTitle: 'Memahami siklus menstruasimu',
    shareMessage: 'Memahami siklus menstruasimu · AWA',
    pill: 'Memahami siklus',
    title: 'Memahami siklus menstruasimu',
    duration: 'Baca 6 menit',
    type: 'Panduan',
    level: 'Pemula',
    validated: 'Konten tervalidasi',
    summary: 'Tahapan utama siklusmu, dijelaskan dengan sederhana.',
    stats: [
      {title: 'Durasi rata-rata', text: '28 hari'},
      {title: 'Durasi normal', text: '21 sampai 35 hari'},
      {title: '4 fase utama', text: 'dalam siklusmu'},
      {title: 'Setiap siklus', text: 'itu unik'},
    ],
    phasesEyebrow: 'FASE SIKLUS',
    phasesTitle: '4 fase utama',
    phasesIntro: 'Setiap fase punya peran penting di tubuhmu dan bisa memengaruhi energi, suasana hati, serta gejala yang kamu rasakan.',
    phases: [
      {title: 'Haid', days: 'Hari 1 sampai 5', text: 'Tubuhmu meluruhkan lapisan dinding rahim.'},
      {title: 'Fase folikuler', days: 'Hari 6 sampai 13', text: 'Tubuhmu bersiap untuk ovulasi.'},
      {title: 'Ovulasi', days: 'Sekitar hari ke-14', text: 'Sel telur dilepaskan. Ini adalah masa paling subur.'},
      {title: 'Fase luteal', days: 'Hari 15 sampai 28', text: 'Tubuhmu bersiap untuk kemungkinan kehamilan.'},
    ],
    knowTitle: 'Perlu diketahui',
    knowText: 'Siklusmu bisa berbeda dari bulan ke bulan. Stres, tidur, pola makan, atau penyakit dapat memengaruhi lama dan ritmenya.',
    reasonsEyebrow: 'MENGAPA PERLU DICATAT',
    reasonsTitle: 'Memahami siklusmu lebih baik',
    reasons: [
      'Lebih memahami tubuhmu',
      'Menyesuaikan energimu',
      'Mengantisipasi suasana hatimu',
      'Menjaga kesehatanmu',
      'Mencatat siklusmu dengan mudah',
    ],
    wellTitle: 'Saran kesehatan',
    wellText: 'Dengarkan tubuhmu, perhatikan apa yang kamu rasakan, dan catat perubahan dari hari ke hari.',
  },
  hi: {
    shareTitle: 'अपने मासिक चक्र को समझें',
    shareMessage: 'अपने मासिक चक्र को समझें · AWA',
    pill: 'चक्र को समझें',
    title: 'अपने मासिक चक्र को समझें',
    duration: '6 मिनट में पढ़ें',
    type: 'गाइड',
    level: 'शुरुआती',
    validated: 'सत्यापित सामग्री',
    summary: 'आपके चक्र के मुख्य चरण, आसान भाषा में।',
    stats: [
      {title: 'औसत अवधि', text: '28 दिन'},
      {title: 'सामान्य अवधि', text: '21 से 35 दिन'},
      {title: '4 मुख्य चरण', text: 'आपके चक्र में'},
      {title: 'हर चक्र', text: 'अलग होता है'},
    ],
    phasesEyebrow: 'चक्र के चरण',
    phasesTitle: '4 मुख्य चरण',
    phasesIntro: 'हर चरण आपके शरीर में एक अहम भूमिका निभाता है और आपकी ऊर्जा, मूड और लक्षणों पर असर डाल सकता है।',
    phases: [
      {title: 'पीरियड', days: 'दिन 1 से 5', text: 'आपका शरीर गर्भाशय की परत को बाहर निकालता है।'},
      {title: 'फॉलिकुलर चरण', days: 'दिन 6 से 13', text: 'आपका शरीर ओव्यूलेशन की तैयारी करता है।'},
      {title: 'ओव्यूलेशन', days: 'लगभग दिन 14', text: 'अंडाणु बाहर निकलता है। यह सबसे उपजाऊ समय है।'},
      {title: 'ल्यूटियल चरण', days: 'दिन 15 से 28', text: 'आपका शरीर संभावित गर्भावस्था की तैयारी करता है।'},
    ],
    knowTitle: 'जानना ज़रूरी है',
    knowText: 'आपका चक्र हर महीने अलग हो सकता है। तनाव, नींद, खान-पान या बीमारी इसकी अवधि और लय को प्रभावित कर सकते हैं।',
    reasonsEyebrow: 'दर्ज करना क्यों ज़रूरी है',
    reasonsTitle: 'अपने चक्र को बेहतर समझें',
    reasons: [
      'अपने शरीर को बेहतर समझें',
      'अपनी ऊर्जा के हिसाब से चलें',
      'अपने मूड का पहले से अंदाज़ा लगाएँ',
      'अपनी सेहत का ध्यान रखें',
      'अपना चक्र आसानी से दर्ज करें',
    ],
    wellTitle: 'सेहत की सलाह',
    wellText: 'अपने शरीर की सुनें, जो महसूस हो उस पर ध्यान दें और रोज़ के बदलाव दर्ज करें।',
  },
  sq: {
    shareTitle: 'Kupto ciklin tënd menstrual',
    shareMessage: 'Kupto ciklin tënd menstrual · AWA',
    pill: 'Kupto ciklin',
    title: 'Kupto ciklin tënd menstrual',
    duration: '6 min lexim',
    type: 'Udhëzues',
    level: 'Fillestar',
    validated: 'Përmbajtje e verifikuar',
    summary: 'Fazat kryesore të ciklit tënd, të shpjeguara thjesht.',
    stats: [
      {title: 'Kohëzgjatja mesatare', text: '28 ditë'},
      {title: 'Kohëzgjatja normale', text: '21 deri në 35 ditë'},
      {title: '4 faza kryesore', text: 'në ciklin tënd'},
      {title: 'Çdo cikël', text: 'është unik'},
    ],
    phasesEyebrow: 'FAZAT E CIKLIT',
    phasesTitle: '4 faza kryesore',
    phasesIntro: 'Çdo fazë ka një rol të rëndësishëm në trupin tënd dhe mund të ndikojë te energjia, gjendja shpirtërore dhe simptomat që ndien.',
    phases: [
      {title: 'Menstruacionet', days: 'Dita 1 deri në 5', text: 'Trupi yt largon shtresën e mitrës.'},
      {title: 'Faza follikulare', days: 'Dita 6 deri në 13', text: 'Trupi yt përgatitet për ovulacionin.'},
      {title: 'Ovulacioni', days: 'Rreth ditës 14', text: 'Çlirohet veza. Ky është momenti më pjellor.'},
      {title: 'Faza luteale', days: 'Dita 15 deri në 28', text: 'Trupi yt përgatitet për një shtatzëni të mundshme.'},
    ],
    knowTitle: 'Mirë është ta dish',
    knowText: 'Cikli yt mund të ndryshojë nga muaji në muaj. Stresi, gjumi, ushqimi ose sëmundja mund të ndikojnë te kohëzgjatja dhe ritmi i tij.',
    reasonsEyebrow: 'PSE ËSHTË E RËNDËSISHME TA REGJISTROSH',
    reasonsTitle: 'Ta kuptosh më mirë ciklin tënd',
    reasons: [
      'Ta kuptosh më mirë trupin tënd',
      'Ta përshtatësh energjinë',
      'Të parashikosh gjendjen shpirtërore',
      'Të kujdesesh për shëndetin tënd',
      'Ta regjistrosh ciklin lehtë',
    ],
    wellTitle: 'Këshillë për mirëqenien',
    wellText: 'Dëgjo trupin tënd, kushtoji vëmendje asaj që ndien dhe regjistro ndryshimet nga dita në ditë.',
  },
  ja: {
    shareTitle: '生理周期を知ろう',
    shareMessage: '生理周期を知ろう · AWA',
    pill: '周期を知る',
    title: '生理周期を知ろう',
    duration: '6分で読めます',
    type: 'ガイド',
    level: '初級',
    validated: '内容確認済み',
    summary: '生理周期の主な流れを、やさしく解説します。',
    stats: [
      {title: '平均の長さ', text: '28日'},
      {title: '標準的な長さ', text: '21〜35日'},
      {title: '4つの主なフェーズ', text: '周期の流れ'},
      {title: 'どの周期も', text: 'それぞれ異なります'},
    ],
    phasesEyebrow: '周期のフェーズ',
    phasesTitle: '4つの主なフェーズ',
    phasesIntro: 'それぞれのフェーズには体の中で大切な役割があり、エネルギーや気分、症状に影響することがあります。',
    phases: [
      {title: '生理', days: '1〜5日目', text: '体が子宮内膜をはがして排出します。'},
      {title: '卵胞期', days: '6〜13日目', text: '体が排卵に向けて準備をします。'},
      {title: '排卵', days: '14日目ごろ', text: '卵子が放出されます。妊娠しやすい時期です。'},
      {title: '黄体期', days: '15〜28日目', text: '体が妊娠の可能性に備えます。'},
    ],
    knowTitle: '知っておきたいこと',
    knowText: '周期は月によって変わることがあります。ストレス、睡眠、食事、病気などが、周期の長さやリズムに影響することがあります。',
    reasonsEyebrow: '記録する理由',
    reasonsTitle: '周期をもっとよく知る',
    reasons: [
      '自分の体をよく知る',
      'エネルギーの使い方を調整する',
      '気分の変化を予測する',
      '健康を大切にする',
      '周期をかんたんに記録する',
    ],
    wellTitle: 'ウェルネスのヒント',
    wellText: '体の声に耳を傾け、感じたことに気を配り、日々の変化を記録しましょう。',
  },
  ko: {
    shareTitle: '내 생리 주기 이해하기',
    shareMessage: '내 생리 주기 이해하기 · AWA',
    pill: '주기 이해하기',
    title: '내 생리 주기 이해하기',
    duration: '읽는 데 6분',
    type: '가이드',
    level: '입문',
    validated: '검토된 콘텐츠',
    summary: '생리 주기의 주요 단계를 쉽게 설명해요.',
    stats: [
      {title: '평균 길이', text: '28일'},
      {title: '정상 범위', text: '21~35일'},
      {title: '4가지 주요 단계', text: '주기의 흐름'},
      {title: '모든 주기는', text: '저마다 달라요'},
    ],
    phasesEyebrow: '주기의 단계',
    phasesTitle: '4가지 주요 단계',
    phasesIntro: '각 단계는 몸에서 중요한 역할을 하며, 에너지와 기분, 증상에 영향을 줄 수 있어요.',
    phases: [
      {title: '생리', days: '1~5일째', text: '몸이 자궁내막을 배출해요.'},
      {title: '난포기', days: '6~13일째', text: '몸이 배란을 준비해요.'},
      {title: '배란', days: '14일째 무렵', text: '난자가 배출돼요. 임신 가능성이 가장 높은 시기예요.'},
      {title: '황체기', days: '15~28일째', text: '몸이 임신 가능성에 대비해요.'},
    ],
    knowTitle: '알아 두세요',
    knowText: '주기는 달마다 달라질 수 있어요. 스트레스, 수면, 식사, 질병 등이 주기의 길이와 리듬에 영향을 줄 수 있어요.',
    reasonsEyebrow: '기록하는 이유',
    reasonsTitle: '내 주기를 더 잘 이해하기',
    reasons: [
      '내 몸을 더 잘 이해하기',
      '에너지를 알맞게 조절하기',
      '기분 변화를 미리 알아보기',
      '건강 챙기기',
      '주기를 쉽게 기록하기',
    ],
    wellTitle: '웰니스 팁',
    wellText: '몸의 신호에 귀 기울이고, 느끼는 것에 주의를 기울이며, 하루하루의 변화를 기록해 보세요.',
  },
  'pt-PT': {
    shareTitle: 'Compreender o seu ciclo menstrual',
    shareMessage: 'Compreender o seu ciclo menstrual · AWA',
    pill: 'Compreender o ciclo',
    title: 'Compreender o seu ciclo menstrual',
    duration: '6 min de leitura',
    type: 'Guia',
    level: 'Iniciante',
    validated: 'Conteúdo validado',
    summary: 'As grandes etapas do seu ciclo, explicadas de forma simples.',
    stats: [
      {title: 'Duração média', text: '28 dias'},
      {title: 'Duração normal', text: '21 a 35 dias'},
      {title: '4 grandes fases', text: 'no seu ciclo'},
      {title: 'Cada ciclo', text: 'é único'},
    ],
    phasesEyebrow: 'FASES DO CICLO',
    phasesTitle: 'As 4 grandes fases',
    phasesIntro: 'Cada fase tem um papel importante no seu corpo e pode influenciar a sua energia, o seu humor e os seus sintomas.',
    phases: [
      {title: 'A menstruação', days: 'Dias 1 a 5', text: 'O seu corpo liberta o revestimento do útero.'},
      {title: 'Fase folicular', days: 'Dias 6 a 13', text: 'O seu corpo prepara-se para a ovulação.'},
      {title: 'Ovulação', days: 'Cerca do dia 14', text: 'O óvulo é libertado. É o período mais fértil.'},
      {title: 'Fase lútea', days: 'Dias 15 a 28', text: 'O seu corpo prepara-se para uma eventual gravidez.'},
    ],
    knowTitle: 'Bom saber',
    knowText: 'O seu ciclo pode variar de um mês para o outro. O stress, o sono, a alimentação ou uma doença podem influenciar a sua duração e o seu ritmo.',
    reasonsEyebrow: 'PORQUÊ ACOMPANHÁ-LO',
    reasonsTitle: 'Compreender melhor o seu ciclo',
    reasons: [
      'Compreender melhor o seu corpo',
      'Adaptar a sua energia',
      'Antecipar o seu humor',
      'Cuidar da sua saúde',
      'Acompanhar o seu ciclo com facilidade',
    ],
    wellTitle: 'Dica de bem-estar',
    wellText: 'Ouça o seu corpo, esteja atenta ao que sente e anote o que muda ao longo dos dias.',
  },
  bn: {
    shareTitle: 'আপনার মাসিক চক্র বুঝুন',
    shareMessage: 'আপনার মাসিক চক্র বুঝুন · AWA',
    pill: 'চক্র বুঝুন',
    title: 'আপনার মাসিক চক্র বুঝুন',
    duration: '6 মিনিটের পাঠ',
    type: 'গাইড',
    level: 'শুরুর স্তর',
    validated: 'যাচাইকৃত কনটেন্ট',
    summary: 'আপনার চক্রের প্রধান ধাপগুলো সহজ ভাষায় ব্যাখ্যা করা হয়েছে।',
    stats: [
      {title: 'গড় সময়', text: '28 দিন'},
      {title: 'স্বাভাবিক সময়', text: '21 থেকে 35 দিন'},
      {title: '4টি প্রধান পর্যায়', text: 'আপনার চক্রে'},
      {title: 'প্রতিটি চক্র', text: 'আলাদা'},
    ],
    phasesEyebrow: 'চক্রের পর্যায়',
    phasesTitle: '4টি প্রধান পর্যায়',
    phasesIntro: 'প্রতিটি পর্যায় আপনার শরীরে গুরুত্বপূর্ণ ভূমিকা রাখে এবং আপনার শক্তি, মেজাজ ও উপসর্গকে প্রভাবিত করতে পারে।',
    phases: [
      {title: 'মাসিক', days: '1 থেকে 5 দিন', text: 'আপনার শরীর জরায়ুর আস্তরণ ঝরিয়ে দেয়।'},
      {title: 'ফলিকুলার পর্যায়', days: '6 থেকে 13 দিন', text: 'আপনার শরীর ডিম্বস্ফোটনের জন্য প্রস্তুত হয়।'},
      {title: 'ডিম্বস্ফোটন', days: 'প্রায় 14তম দিন', text: 'ডিম্বাণু নির্গত হয়। এটি সবচেয়ে উর্বর সময়।'},
      {title: 'লিউটিয়াল পর্যায়', days: '15 থেকে 28 দিন', text: 'আপনার শরীর সম্ভাব্য গর্ভাবস্থার জন্য প্রস্তুত হয়।'},
    ],
    knowTitle: 'জেনে রাখুন',
    knowText: 'আপনার চক্র এক মাস থেকে আরেক মাসে বদলাতে পারে। মানসিক চাপ, ঘুম, খাদ্যাভ্যাস বা অসুস্থতা চক্রের দৈর্ঘ্য ও ছন্দকে প্রভাবিত করতে পারে।',
    reasonsEyebrow: 'কেন ট্র্যাক করবেন',
    reasonsTitle: 'আপনার চক্র আরও ভালোভাবে বুঝুন',
    reasons: [
      'আপনার শরীরকে আরও ভালোভাবে বোঝা',
      'আপনার শক্তি অনুযায়ী পরিকল্পনা করা',
      'মেজাজের পরিবর্তন আগে থেকে আঁচ করা',
      'নিজের স্বাস্থ্যের যত্ন নেওয়া',
      'সহজে চক্র ট্র্যাক করা',
    ],
    wellTitle: 'সুস্থতার পরামর্শ',
    wellText: 'আপনার শরীরের কথা শুনুন, যা অনুভব করছেন সেদিকে মনোযোগ দিন এবং দিনে দিনে কী বদলাচ্ছে তা লিখে রাখুন।',
  },
} as const);

function UnderstandCycleArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const content = CONTENT[i18n.language === 'ru' ? 'ru' : i18n.language === 'de' ? 'de' : i18n.language === 'zh' ? 'zh' : i18n.language === 'id' ? 'id' : i18n.language === 'hi' ? 'hi' : i18n.language === 'sq' ? 'sq' : i18n.language === 'ja' ? 'ja' : i18n.language === 'ko' ? 'ko' : i18n.language === 'pt-PT' ? 'pt-PT' : i18n.language === 'pt-BR' ? 'pt-BR' : i18n.language === 'bn' ? 'bn' : 'fr'];
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadLibraryState().then(() => {
      if (!mounted) {
        return;
      }

      setBookmarked(isArticleBookmarked(ARTICLE_ID));
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    saveScrollPosition(ARTICLE_ID, event.nativeEvent.contentOffset.y);
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
        onScroll={handleScroll}
        scrollEventThrottle={80}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: getTopPadding(insets.top, true),
            paddingBottom: getBottomPadding(
              insets.bottom,
              READING_CONTROLS_SPACE,
            ),
          },
        ]}>
        <View style={styles.header}>
          <AwaIconButton
            accessibilityLabel={t('library.reader.back')}
            icon="chevron-left"
            iconSize={25}
            onPress={navigation.goBack}
            variant="tonal"
          />

          <View style={styles.actions}>
            <AwaIconButton
              accessibilityLabel={t('libraryArticle.bookmarkA11y')}
              icon={
                  bookmarked
                    ? 'bookmark'
                    : 'bookmark-outline'
                }
              iconSize={19}
              onPress={() =>
                setBookmarked(
                  toggleBookmark(ARTICLE_ID),
                )
              }
              variant="tonal"
            />

            <AwaIconButton
              accessibilityLabel={t('libraryArticle.shareA11y')}
              icon="share-variant-outline"
              iconSize={19}
              onPress={() =>
                Share.share({
                  title: content.shareTitle,
                  message: content.shareMessage,
                })
              }
              variant="tonal"
            />
          </View>
        </View>

        <AwaCard variant="filled" padding="none" style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.pill}>
              <MaterialDesignIcons
                name="feather"
                size={12}
                color={theme.colors.primary}
              />
              <AwaText variant="labelSmall" colorRole="primary">
                {content.pill}
              </AwaText>
            </View>

            <AwaText variant="titleMedium" style={styles.title}>
              {content.title}
            </AwaText>

            <View style={styles.metaContainer}>
              <View style={styles.metaTopRow}>
                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name="clock-outline"
                    size={14}
                    color={theme.colors.textMuted}
                  />
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                    {content.duration}
                  </AwaText>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name="book-open-page-variant-outline"
                    size={14}
                    color={theme.colors.textMuted}
                  />
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                    {content.type}
                  </AwaText>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name="chart-bar"
                    size={14}
                    color={theme.colors.textMuted}
                  />
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                    {content.level}
                  </AwaText>
                </View>
              </View>

              <View style={styles.metaValidatedRow}>
                <MaterialDesignIcons
                  name="shield-check-outline"
                  size={14}
                  color={theme.colors.textMuted}
                />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                  {content.validated}
                </AwaText>
              </View>
            </View>

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summary}>
              {content.summary}
            </AwaText>
          </View>

          <View style={styles.heroImageWrap}>
            <Image
              source={require('../../assets/images/understand-cycle-hero.png')}
              resizeMode="cover"
              style={styles.heroImage}
            />
          </View>
        </AwaCard>

        <AwaCard variant="filled" padding="none" style={styles.statsCard}>
          {content.stats.map((item, index) => (
            <View
              key={STAT_ICONS[index]}
              style={[
                styles.stat,
                index < content.stats.length - 1 &&
                  styles.statBorder,
              ]}>
              <MaterialDesignIcons
                name={STAT_ICONS[index]}
                size={20}
                color={theme.colors.primary}
              />
              <AwaText variant="labelSmall" style={styles.statTitle}>
                {item.title}
              </AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.statText}>
                {item.text}
              </AwaText>
            </View>
          ))}
        </AwaCard>

        <AwaCard variant="filled" padding="none" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <AwaText variant="labelSmall" colorRole="onSurfaceVariant">
              {content.phasesEyebrow}
            </AwaText>
            <AwaText variant="titleMedium" emphasized style={styles.sectionTitle}>
              {content.phasesTitle}
            </AwaText>
          </View>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
            {content.phasesIntro}
          </AwaText>

          <View style={styles.phaseList}>
            {content.phases.map((phaseCopy, index) => {
              const phase = {...PHASE_STYLE[index], ...phaseCopy};
              return (
              <View
                key={PHASE_STYLE[index].number}
                style={[
                  styles.phaseRow,
                  index < content.phases.length - 1 &&
                    styles.phaseDivider,
                ]}>
                <View style={styles.phaseNumberBox}>
                  <AwaText variant="labelSmall" emphasized colorRole="onSurfaceVariant">
                    {phase.number}
                  </AwaText>
                </View>

                <View style={styles.phaseCopy}>
                  <View style={styles.phaseTitleRow}>
                    <MaterialDesignIcons
                      name={phase.icon}
                      size={17}
                      color={phase.color}
                    />
                    <AwaText variant="titleSmall" emphasized
                      style={[
                        styles.phaseTitle,
                        {color: phase.color},
                      ]}>
                      {phase.title}
                    </AwaText>
                  </View>

                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.phaseDays}>
                    {phase.days}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.phaseText}>
                    {phase.text}
                  </AwaText>
                </View>
              </View>
              );
            })}
          </View>
        </AwaCard>

        <AwaCard variant="filled" padding="none" style={styles.knowCard}>
          <View style={styles.knowIcon}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={19}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.knowCopy}>
            <AwaText variant="titleSmall" emphasized>
              {content.knowTitle}
            </AwaText>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.knowText}>
              {content.knowText}
            </AwaText>
          </View>

          <Image
            source={require('../../assets/images/understand-cycle-journal.png')}
            resizeMode="cover"
            style={styles.journalImage}
          />
        </AwaCard>

        <AwaCard variant="filled" padding="none" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <AwaText variant="labelSmall" colorRole="onSurfaceVariant">
              {content.reasonsEyebrow}
            </AwaText>
            <AwaText variant="titleMedium" emphasized style={styles.sectionTitle}>
              {content.reasonsTitle}
            </AwaText>
          </View>

          <View style={styles.reasonsList}>
            {content.reasons.map((label, index) => (
              <View
                key={REASON_ICONS[index]}
                style={[
                  styles.reasonRow,
                  index < content.reasons.length - 1 &&
                    styles.reasonDivider,
                ]}>
                <MaterialDesignIcons
                  name={REASON_ICONS[index]}
                  size={18}
                  color={theme.colors.primary}
                />
                <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.reasonText}>
                  {label}
                </AwaText>
              </View>
            ))}
          </View>
        </AwaCard>

        <AwaCard variant="filled" padding="none" style={styles.wellbeing}>
          <View style={styles.wellIcon}>
            <MaterialDesignIcons
              name="heart-outline"
              size={19}
              color={theme.colors.secondary}
            />
          </View>

          <View style={styles.wellCopy}>
            <AwaText variant="titleSmall" emphasized>
              {content.wellTitle}
            </AwaText>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.wellText}>
              {content.wellText}
            </AwaText>
          </View>
        </AwaCard>
      </ScrollView>

      <ReadingControls
        articleId={ARTICLE_ID}
        durationMinutes={6}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },



  hero: {
    minHeight: 232,
    marginTop: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingLeft: 16,
    paddingVertical: 16,
  },

  heroCopy: {
    width: '65%',
    zIndex: 2,
    paddingTop: 0,
    paddingRight: 8,
  },

  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },


  title: {
    marginTop: 12,
    maxWidth: '100%',
  },

  metaContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },

  metaTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 8,
    backgroundColor: theme.colors.border,
  },

  metaValidatedRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },


  summary: {
    marginTop: 12,
  },

  heroImageWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '38%',
    overflow: 'hidden',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 12,
    backgroundColor: 'transparent',
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  statsCard: {
    flexDirection: 'row',
    paddingVertical: 12,
  },

  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  statBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: theme.colors.border,
  },

  statTitle: {
    marginTop: 8,
    textAlign: 'center',
  },

  statText: {
    marginTop: 3,
    textAlign: 'center',
  },

  sectionCard: {
    marginTop: 16,
    padding: 16,
  },

  sectionHeader: {
    marginBottom: 8,
  },


  sectionTitle: {
    marginTop: 4,
  },


  phaseList: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },

  phaseRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
  },

  phaseDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },

  phaseNumberBox: {
    width: 38,
    paddingTop: 1,
  },


  phaseCopy: {
    flex: 1,
    minWidth: 0,
  },

  phaseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  phaseTitle: {
    flex: 1,
  },

  phaseDays: {
    marginTop: 4,
  },

  phaseText: {
    marginTop: 4,
  },

  knowCard: {
    marginTop: 16,
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    overflow: 'hidden',
    padding: 16,
  },

  knowIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  knowCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 72,
  },


  knowText: {
    marginTop: 4,
  },

  journalImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 78,
    height: 82,
    opacity: 0.9,
    borderRadius: 12,
  },

  reasonsList: {
    marginTop: 8,
  },

  reasonRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },

  reasonDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },

  reasonText: {
    flex: 1,
  },

  wellbeing: {
    marginTop: 16,
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },

  wellIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  wellCopy: {
    flex: 1,
    minWidth: 0,
  },


  wellText: {
    marginTop: 4,
  },

});
}

export default UnderstandCycleArticleScreen;
