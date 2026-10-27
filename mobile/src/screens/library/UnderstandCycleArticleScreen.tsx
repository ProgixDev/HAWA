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
  bg: {
    shareTitle: 'Разбиране на менструалния ти цикъл',
    shareMessage: 'Разбиране на менструалния ти цикъл · AWA',
    pill: 'Разбиране на цикъла',
    title: 'Разбиране на менструалния ти цикъл',
    duration: '6 мин четене',
    type: 'Ръководство',
    level: 'Начинаещ',
    validated: 'Проверено съдържание',
    summary: 'Основните етапи на цикъла ти, обяснени просто.',
    stats: [
      {title: 'Средна продължителност', text: '28 дни'},
      {title: 'Нормална продължителност', text: '21 до 35 дни'},
      {title: '4 основни фази', text: 'в цикъла ти'},
      {title: 'Всеки цикъл', text: 'е уникален'},
    ],
    phasesEyebrow: 'ФАЗИ НА ЦИКЪЛА',
    phasesTitle: 'Четирите основни фази',
    phasesIntro: 'Всяка фаза има важна роля в тялото ти и може да влияе на енергията, настроението и симптомите ти.',
    phases: [
      {title: 'Менструация', days: 'Дни 1 до 5', text: 'Тялото ти се освобождава от маточната лигавица.'},
      {title: 'Фоликуларна фаза', days: 'Дни 6 до 13', text: 'Тялото ти се подготвя за овулация.'},
      {title: 'Овулация', days: 'Около 14-ия ден', text: 'Яйцеклетката се освобождава. Това е най-плодовитият период.'},
      {title: 'Лутеинова фаза', days: 'Дни 15 до 28', text: 'Тялото ти се подготвя за евентуална бременност.'},
    ],
    knowTitle: 'Добре е да знаеш',
    knowText: 'Цикълът ти може да варира от месец на месец. Стресът, сънят, храненето или болестта могат да повлияят на продължителността и ритъма му.',
    reasonsEyebrow: 'ЗАЩО ДА ГО ПРОСЛЕДЯВАШ',
    reasonsTitle: 'Разбирай по-добре цикъла си',
    reasons: [
      'Да разбираш по-добре тялото си',
      'Да нагаждаш енергията си',
      'Да предвиждаш настроението си',
      'Да се грижиш за здравето си',
      'Да проследяваш цикъла си лесно',
    ],
    wellTitle: 'Съвет за благополучие',
    wellText: 'Вслушвай се в тялото си, внимавай за усещанията си и отбелязвай какво се променя с течение на дните.',
  },
  sr: {
    shareTitle: 'Разумевање твог менструалног циклуса',
    shareMessage: 'Разумевање твог менструалног циклуса · AWA',
    pill: 'Разумевање циклуса',
    title: 'Разумевање твог менструалног циклуса',
    duration: '6 мин читања',
    type: 'Водич',
    level: 'Почетник',
    validated: 'Проверен садржај',
    summary: 'Главне фазе твог циклуса, једноставно објашњене.',
    stats: [
      {title: 'Просечно трајање', text: '28 дана'},
      {title: 'Нормално трајање', text: '21 до 35 дана'},
      {title: '4 основне фазе', text: 'у твом циклусу'},
      {title: 'Сваки циклус', text: 'је јединствен'},
    ],
    phasesEyebrow: 'ФАЗЕ ЦИКЛУСА',
    phasesTitle: 'Четири основне фазе',
    phasesIntro: 'Свака фаза има важну улогу у твом телу и може утицати на твоју енергију, расположење и симптоме.',
    phases: [
      {title: 'Менструација', days: 'Дани 1 до 5', text: 'Твоје тело се ослобађа слузокоже материце.'},
      {title: 'Фоликуларна фаза', days: 'Дани 6 до 13', text: 'Твоје тело се припрема за овулацију.'},
      {title: 'Овулација', days: 'Око 14. дана', text: 'Јајна ћелија се ослобађа. Ово је најплоднији период.'},
      {title: 'Лутеална фаза', days: 'Дани 15 до 28', text: 'Твоје тело се припрема за могућу трудноћу.'},
    ],
    knowTitle: 'Добро је знати',
    knowText: 'Твој циклус може варирати из месеца у месец. Стрес, сан, исхрана или болест могу утицати на његово трајање и ритам.',
    reasonsEyebrow: 'ЗАШТО ГА ПРАТИТИ',
    reasonsTitle: 'Боље разумеј свој циклус',
    reasons: [
      'Боље разумеј своје тело',
      'Прилагоди своју енергију',
      'Предвиди своје расположење',
      'Брини о свом здрављу',
      'Лако прати свој циклус',
    ],
    wellTitle: 'Савет за благостање',
    wellText: 'Слушај своје тело, пази на своја осећања и бележи шта се мења током дана.',
  },
  hr: {
    shareTitle: 'Razumijevanje tvog menstrualnog ciklusa',
    shareMessage: 'Razumijevanje tvog menstrualnog ciklusa · AWA',
    pill: 'Razumijevanje ciklusa',
    title: 'Razumijevanje tvog menstrualnog ciklusa',
    duration: '6 min čitanja',
    type: 'Vodič',
    level: 'Početnica',
    validated: 'Provjeren sadržaj',
    summary: 'Glavne faze tvog ciklusa, jednostavno objašnjene.',
    stats: [
      {title: 'Prosječno trajanje', text: '28 dana'},
      {title: 'Normalno trajanje', text: '21 do 35 dana'},
      {title: '4 osnovne faze', text: 'u tvom ciklusu'},
      {title: 'Svaki ciklus', text: 'je jedinstven'},
    ],
    phasesEyebrow: 'FAZE CIKLUSA',
    phasesTitle: 'Četiri osnovne faze',
    phasesIntro: 'Svaka faza ima važnu ulogu u tvom tijelu i može utjecati na tvoju energiju, raspoloženje i simptome.',
    phases: [
      {title: 'Menstruacija', days: '1. do 5. dan', text: 'Tvoje tijelo odbacuje sluznicu maternice.'},
      {title: 'Folikularna faza', days: '6. do 13. dan', text: 'Tvoje se tijelo priprema za ovulaciju.'},
      {title: 'Ovulacija', days: 'Oko 14. dana', text: 'Oslobađa se jajna stanica. To je najplodnije razdoblje.'},
      {title: 'Lutealna faza', days: '15. do 28. dan', text: 'Tvoje se tijelo priprema za moguću trudnoću.'},
    ],
    knowTitle: 'Dobro je znati',
    knowText: 'Tvoj ciklus može varirati iz mjeseca u mjesec. Stres, san, prehrana ili bolest mogu utjecati na njegovo trajanje i ritam.',
    reasonsEyebrow: 'ZAŠTO GA PRATITI',
    reasonsTitle: 'Bolje razumij svoj ciklus',
    reasons: [
      'Bolje razumij svoje tijelo',
      'Prilagodi svoju energiju',
      'Predvidi svoje raspoloženje',
      'Brini o svom zdravlju',
      'Lako prati svoj ciklus',
    ],
    wellTitle: 'Savjet za dobrobit',
    wellText: 'Slušaj svoje tijelo, pazi na svoje osjećaje i bilježi što se mijenja tijekom dana.',
  },
  bs: {
    shareTitle: 'Razumijevanje tvog menstrualnog ciklusa',
    shareMessage: 'Razumijevanje tvog menstrualnog ciklusa · AWA',
    pill: 'Razumijevanje ciklusa',
    title: 'Razumijevanje tvog menstrualnog ciklusa',
    duration: '6 min čitanja',
    type: 'Vodič',
    level: 'Početnica',
    validated: 'Provjeren sadržaj',
    summary: 'Glavne faze tvog ciklusa, jednostavno objašnjene.',
    stats: [
      {title: 'Prosječno trajanje', text: '28 dana'},
      {title: 'Normalno trajanje', text: '21 do 35 dana'},
      {title: '4 osnovne faze', text: 'u tvom ciklusu'},
      {title: 'Svaki ciklus', text: 'je jedinstven'},
    ],
    phasesEyebrow: 'FAZE CIKLUSA',
    phasesTitle: 'Četiri osnovne faze',
    phasesIntro: 'Svaka faza ima važnu ulogu u tvom tijelu i može utjecati na tvoju energiju, raspoloženje i simptome.',
    phases: [
      {title: 'Menstruacija', days: '1. do 5. dan', text: 'Tvoje tijelo odbacuje sluznicu maternice.'},
      {title: 'Folikularna faza', days: '6. do 13. dan', text: 'Tvoje se tijelo priprema za ovulaciju.'},
      {title: 'Ovulacija', days: 'Oko 14. dana', text: 'Oslobađa se jajna stanica. To je najplodnije razdoblje.'},
      {title: 'Lutealna faza', days: '15. do 28. dan', text: 'Tvoje se tijelo priprema za moguću trudnoću.'},
    ],
    knowTitle: 'Dobro je znati',
    knowText: 'Tvoj ciklus može varirati iz mjeseca u mjesec. Stres, san, ishrana ili bolest mogu utjecati na njegovo trajanje i ritam.',
    reasonsEyebrow: 'ZAŠTO GA PRATITI',
    reasonsTitle: 'Bolje razumij svoj ciklus',
    reasons: [
      'Bolje razumij svoje tijelo',
      'Prilagodi svoju energiju',
      'Predvidi svoje raspoloženje',
      'Brini o svom zdravlju',
      'Lako prati svoj ciklus',
    ],
    wellTitle: 'Savjet za dobrobit',
    wellText: 'Slušaj svoje tijelo, pazi na svoje osjećaje i bilježi što se mijenja tokom dana.',
  },
  sl: {
    shareTitle: 'Razumevanje tvojega menstrualnega cikla',
    shareMessage: 'Razumevanje tvojega menstrualnega cikla · AWA',
    pill: 'Razumevanje cikla',
    title: 'Razumevanje tvojega menstrualnega cikla',
    duration: '6 min branja',
    type: 'Vodnik',
    level: 'Začetnica',
    validated: 'Preverjena vsebina',
    summary: 'Glavne faze tvojega cikla, preprosto razložene.',
    stats: [
      {title: 'Povprečno trajanje', text: '28 dni'},
      {title: 'Normalno trajanje', text: '21 do 35 dni'},
      {title: '4 osnovne faze', text: 'v tvojem ciklu'},
      {title: 'Vsak cikel', text: 'je edinstven'},
    ],
    phasesEyebrow: 'FAZE CIKLA',
    phasesTitle: 'Štiri osnovne faze',
    phasesIntro: 'Vsaka faza ima pomembno vlogo v tvojem telesu in lahko vpliva na tvojo energijo, razpoloženje in simptome.',
    phases: [
      {title: 'Menstruacija', days: '1. do 5. dan', text: 'Tvoje telo odmetava sluznico maternice.'},
      {title: 'Folikularna faza', days: '6. do 13. dan', text: 'Tvoje telo se pripravlja na ovulacijo.'},
      {title: 'Ovulacija', days: 'Okoli 14. dne', text: 'Sprosti se jajčna celica. To je najplodnejše obdobje.'},
      {title: 'Lutealna faza', days: '15. do 28. dan', text: 'Tvoje telo se pripravlja na možno nosečnost.'},
    ],
    knowTitle: 'Vredno vedeti',
    knowText: 'Tvoj cikel se lahko iz meseca v mesec spreminja. Stres, spanje, prehrana ali bolezen lahko vplivajo na njegovo trajanje in ritem.',
    reasonsEyebrow: 'ZAKAJ GA SPREMLJATI',
    reasonsTitle: 'Bolje razumi svoj cikel',
    reasons: [
      'Bolje razumi svoje telo',
      'Prilagodi svojo energijo',
      'Predvidi svoje razpoloženje',
      'Skrbi za svoje zdravje',
      'Enostavno spremljaj svoj cikel',
    ],
    wellTitle: 'Nasvet za dobro počutje',
    wellText: 'Prisluhni svojemu telesu, pazi na svoja čustva in beleži, kaj se spreminja čez dan.',
  },
  ne: {
    shareTitle: 'आफ्नो मासिक चक्र बुझ्नुहोस्',
    shareMessage: 'आफ्नो मासिक चक्र बुझ्नुहोस् · AWA',
    pill: 'चक्र बुझ्नुहोस्',
    title: 'आफ्नो मासिक चक्र बुझ्नुहोस्',
    duration: '6 मिनेट पढाइ',
    type: 'मार्गदर्शन',
    level: 'सुरुवाती',
    validated: 'समीक्षा गरिएको सामग्री',
    summary: 'तपाईंको चक्रका मुख्य चरणहरू, सरल भाषामा।',
    stats: [
      {title: 'औसत अवधि', text: '28 दिन'},
      {title: 'सामान्य अवधि', text: '21 देखि 35 दिन'},
      {title: '4 आधारभूत चरण', text: 'तपाईंको चक्रमा'},
      {title: 'हरेक चक्र', text: 'अनौठो हुन्छ'},
    ],
    phasesEyebrow: 'चक्रका चरणहरू',
    phasesTitle: 'चार आधारभूत चरणहरू',
    phasesIntro: 'हरेक चरणले तपाईंको शरीरमा महत्त्वपूर्ण भूमिका खेल्छ र तपाईंको ऊर्जा, मनोदशा र लक्षणहरूलाई प्रभाव पार्न सक्छ।',
    phases: [
      {title: 'महिनावारी', days: 'दिन 1 देखि 5', text: 'तपाईंको शरीरले गर्भाशयको अस्तर झार्छ।'},
      {title: 'फोलिकुलर चरण', days: 'दिन 6 देखि 13', text: 'तपाईंको शरीर अण्डोत्सर्गको तयारी गर्छ।'},
      {title: 'अण्डोत्सर्ग', days: 'दिन 14 को वरिपरि', text: 'अण्डा निस्कन्छ। यो सबैभन्दा उर्वर अवधि हो।'},
      {title: 'ल्युटियल चरण', days: 'दिन 15 देखि 28', text: 'तपाईंको शरीर सम्भावित गर्भावस्थाको तयारी गर्छ।'},
    ],
    knowTitle: 'जान्न लायक',
    knowText: 'तपाईंको चक्र महिनैपिच्छे फरक हुन सक्छ। तनाव, निद्रा, खानपान वा बिमारीले यसको अवधि र लयलाई असर गर्न सक्छन्।',
    reasonsEyebrow: 'किन अनुगमन गर्ने',
    reasonsTitle: 'आफ्नो चक्र राम्ररी बुझ्नुहोस्',
    reasons: [
      'आफ्नो शरीर राम्ररी बुझ्न',
      'आफ्नो ऊर्जा मिलाउन',
      'आफ्नो मनोदशाको पूर्वानुमान गर्न',
      'आफ्नो स्वास्थ्यको ख्याल राख्न',
      'आफ्नो चक्र सजिलै अनुगमन गर्न',
    ],
    wellTitle: 'भलाइको सुझाव',
    wellText: 'आफ्नो शरीरको कुरा सुन्नुहोस्, आफ्ना भावनाहरूमा ध्यान दिनुहोस्, र दिनभरि के बदलिन्छ टिप्नुहोस्।',
  },
  si: {
    shareTitle: 'ඔබේ ඔසප් චක්‍රය තේරුම් ගැනීම',
    shareMessage: 'ඔබේ ඔසප් චක්‍රය තේරුම් ගැනීම · AWA',
    pill: 'චක්‍රය තේරුම් ගැනීම',
    title: 'ඔබේ ඔසප් චක්‍රය තේරුම් ගැනීම',
    duration: 'කියවීමට මිනිත්තු 6',
    type: 'මාර්ගෝපදේශය',
    level: 'ආරම්භක',
    validated: 'සමාලෝචනය කළ අන්තර්ගතය',
    summary: 'ඔබේ චක්‍රයේ ප්‍රධාන අවධි, සරලව පැහැදිලි කර ඇත.',
    stats: [
      {title: 'සාමාන්‍ය කාලය', text: 'දින 28'},
      {title: 'සාමාන්‍ය පරාසය', text: 'දින 21 සිට 35 දක්වා'},
      {title: 'ප්‍රධාන අවධි 4', text: 'ඔබේ චක්‍රයේ'},
      {title: 'සෑම චක්‍රයක්ම', text: 'අද්විතීයයි'},
    ],
    phasesEyebrow: 'චක්‍රයේ අවධි',
    phasesTitle: 'ප්‍රධාන අවධි 4',
    phasesIntro: 'සෑම අවධියකටම ඔබේ ශරීරයේ වැදගත් කාර්යභාරයක් ඇති අතර ඔබේ ශක්තියට, මනෝභාවයට සහ රෝග ලක්ෂණවලට බලපෑ හැක.',
    phases: [
      {title: 'ඔසප්', days: 'දින 1 සිට 5 දක්වා', text: 'ඔබේ ශරීරය ගර්භාෂ අස්තරය ඉවත් කරයි.'},
      {title: 'ෆොලිකුලර් අවධිය', days: 'දින 6 සිට 13 දක්වා', text: 'ඔබේ ශරීරය ඩිම්බ මෝචනයට සූදානම් වේ.'},
      {title: 'ඩිම්බ මෝචනය', days: 'දින 14 පමණ', text: 'ඩිම්බය නිකුත් වේ. මෙය වඩාත්ම සාරවත් කාලයයි.'},
      {title: 'ලූටියල් අවධිය', days: 'දින 15 සිට 28 දක්වා', text: 'ඔබේ ශරීරය ඇතිවිය හැකි ගර්භණී කාලයකට සූදානම් වේ.'},
    ],
    knowTitle: 'දැනගත යුතු දේ',
    knowText: 'ඔබේ චක්‍රය මාසයෙන් මාසයට වෙනස් විය හැක. ආතතිය, නින්ද, ආහාර හෝ රෝගාබාධ එහි කාලයට සහ රිද්මයට බලපෑ හැක.',
    reasonsEyebrow: 'නිරීක්ෂණය කළ යුත්තේ ඇයි',
    reasonsTitle: 'ඔබේ චක්‍රය වඩා හොඳින් තේරුම් ගන්න',
    reasons: [
      'ඔබේ ශරීරය වඩා හොඳින් තේරුම් ගැනීමට',
      'ඔබේ ශක්තිය සකස් කිරීමට',
      'ඔබේ මනෝභාවය අපේක්ෂා කිරීමට',
      'ඔබේ සෞඛ්‍යය ගැන සැලකිලිමත් වීමට',
      'ඔබේ චක්‍රය පහසුවෙන් නිරීක්ෂණය කිරීමට',
    ],
    wellTitle: 'යහපැවැත්ම පිළිබඳ උපදෙස',
    wellText: 'ඔබේ ශරීරයට සවන් දෙන්න, ඔබේ හැඟීම් ගැන අවධානයෙන් සිටින්න, සහ දින පුරා වෙනස් වන දේ සටහන් කරන්න.',
  },
  ka: {
    shareTitle: 'თქვენი მენსტრუაციული ციკლის გაგება',
    shareMessage: 'თქვენი მენსტრუაციული ციკლის გაგება · AWA',
    pill: 'ციკლის გაგება',
    title: 'თქვენი მენსტრუაციული ციკლის გაგება',
    duration: '6 წთ საკითხავი',
    type: 'გზამკვლევი',
    level: 'დამწყები',
    validated: 'გადამოწმებული შინაარსი',
    summary: 'თქვენი ციკლის ძირითადი ეტაპები, მარტივად ახსნილი.',
    stats: [
      {title: 'საშუალო ხანგრძლივობა', text: '28 დღე'},
      {title: 'ნორმალური ხანგრძლივობა', text: '21-დან 35 დღემდე'},
      {title: '4 ძირითადი ფაზა', text: 'თქვენს ციკლში'},
      {title: 'ყოველი ციკლი', text: 'უნიკალურია'},
    ],
    phasesEyebrow: 'ციკლის ფაზები',
    phasesTitle: '4 ძირითადი ფაზა',
    phasesIntro: 'თითოეულ ფაზას თქვენს სხეულში მნიშვნელოვანი როლი აქვს და შეუძლია გავლენა მოახდინოს თქვენს ენერგიაზე, ხასიათზე და სიმპტომებზე.',
    phases: [
      {title: 'მენსტრუაცია', days: '1-დან 5 დღემდე', text: 'თქვენი სხეული საშვილოსნოს გარსს ათავისუფლებს.'},
      {title: 'ფოლიკულური ფაზა', days: '6-დან 13 დღემდე', text: 'თქვენი სხეული ოვულაციისთვის ემზადება.'},
      {title: 'ოვულაცია', days: 'დაახლოებით მე-14 დღე', text: 'კვერცხუჯრედი გამოთავისუფლდება. ეს ყველაზე ფერტილური პერიოდია.'},
      {title: 'ლუტეალური ფაზა', days: '15-დან 28 დღემდე', text: 'თქვენი სხეული შესაძლო ორსულობისთვის ემზადება.'},
    ],
    knowTitle: 'კარგია ვიცოდეთ',
    knowText: 'თქვენი ციკლი თვიდან თვემდე შეიძლება განსხვავდებოდეს. სტრესმა, ძილმა, კვებამ ან ავადმყოფობამ შეიძლება მისი ხანგრძლივობა და რიტმი შეცვალოს.',
    reasonsEyebrow: 'რატომ უნდა აკონტროლოთ',
    reasonsTitle: 'თქვენი ციკლის უკეთ გაგება',
    reasons: [
      'თქვენი სხეულის უკეთ გაგება',
      'თქვენი ენერგიის მორგება',
      'თქვენი ხასიათის წინასწარ განჭვრეტა',
      'თქვენს ჯანმრთელობაზე ზრუნვა',
      'თქვენი ციკლის მარტივად კონტროლი',
    ],
    wellTitle: 'კეთილდღეობის რჩევა',
    wellText: 'მოუსმინეთ თქვენს სხეულს, იყავით ყურადღებიანი თქვენი შეგრძნებების მიმართ და აღნიშნეთ, რა იცვლება დღითი დღე.',
  },
  hy: {
    shareTitle: 'Հասկանալ ձեր դաշտանային ցիկլը',
    shareMessage: 'Հասկանալ ձեր դաշտանային ցիկլը · AWA',
    pill: 'Հասկանալ ձեր ցիկլը',
    title: 'Հասկանալ ձեր դաշտանային ցիկլը',
    duration: '6 ր կարդալու համար',
    type: 'Ուղեցույց',
    level: 'Սկսնակ',
    validated: 'Վերանայված բովանդակություն',
    summary: 'Ձեր ցիկլի հիմնական փուլերը՝ պարզ բացատրությամբ:',
    stats: [
      {title: 'Միջին տևողություն', text: '28 օր'},
      {title: 'Նորմալ տևողություն', text: '21-ից 35 օր'},
      {title: '4 հիմնական փուլ', text: 'ձեր ցիկլում'},
      {title: 'Յուրաքանչյուր ցիկլ', text: 'եզակի է'},
    ],
    phasesEyebrow: 'ՑԻԿԼԻ ՓՈՒԼԵՐԸ',
    phasesTitle: '4 հիմնական փուլերը',
    phasesIntro: 'Յուրաքանչյուր փուլ կարևոր դեր ունի ձեր մարմնում և կարող է ազդել ձեր էներգիայի, տրամադրության և ախտանիշների վրա:',
    phases: [
      {title: 'Դաշտան', days: '1-ից 5-րդ օրեր', text: 'Ձեր մարմինը ազատվում է արգանդի լորձաթաղանթից:'},
      {title: 'Ֆոլիկուլային փուլ', days: '6-ից 13-րդ օրեր', text: 'Ձեր մարմինը պատրաստվում է ձվազատմանը:'},
      {title: 'Ձվազատում', days: 'Մոտ 14-րդ օրը', text: 'Ձվաբջիջն ազատվում է: Սա ամենապտղաբեր շրջանն է:'},
      {title: 'Լյուտեալ փուլ', days: '15-ից 28-րդ օրեր', text: 'Ձեր մարմինը պատրաստվում է հնարավոր հղիությանը:'},
    ],
    knowTitle: 'Լավ է իմանալ',
    knowText: 'Ձեր ցիկլը կարող է տարբերվել մի ամսից մյուսը: Սթրեսը, քունը, սննդակարգը կամ հիվանդությունը կարող են ազդել դրա տևողության և ռիթմի վրա:',
    reasonsEyebrow: 'ԻՆՉՈՒ ՀԵՏԵՎԵԼ',
    reasonsTitle: 'Ավելի լավ հասկանալ ձեր ցիկլը',
    reasons: [
      'Ավելի լավ հասկանալ ձեր մարմինը',
      'Հարմարեցնել ձեր էներգիան',
      'Կանխատեսել ձեր տրամադրությունը',
      'Հոգ տանել ձեր առողջության մասին',
      'Հեշտությամբ հետևել ձեր ցիկլին',
    ],
    wellTitle: 'Բարեկեցության խորհուրդ',
    wellText: 'Լսեք ձեր մարմինը, ուշադիր եղեք ձեր զգացողություններին և գրանցեք, թե ինչ է փոխվում օրեցօր:',
  },
  tg: {
    shareTitle: 'Фаҳмидани давраи ҳайзи шумо',
    shareMessage: 'Фаҳмидани давраи ҳайзи шумо · AWA',
    pill: 'Фаҳмидани давраи худ',
    title: 'Фаҳмидани давраи ҳайзи шумо',
    duration: '6 дақ барои хондан',
    type: 'Роҳнамо',
    level: 'Ибтидоӣ',
    validated: 'Мазмуни баррасишуда',
    summary: 'Марҳилаҳои асосии давраи шумо, ба таври оддӣ шарҳ дода шудаанд.',
    stats: [
      {title: 'Давомнокии миёна', text: '28 рӯз'},
      {title: 'Давомнокии муқаррарӣ', text: '21 то 35 рӯз'},
      {title: '4 марҳилаи асосӣ', text: 'дар давраи шумо'},
      {title: 'Ҳар давра', text: 'беназир аст'},
    ],
    phasesEyebrow: 'МАРҲИЛАҲОИ ДАВРА',
    phasesTitle: '4 марҳилаи асосӣ',
    phasesIntro: 'Ҳар марҳила дар бадани шумо нақши муҳим дорад ва метавонад ба қувват, кайфият ва нишонаҳои шумо таъсир расонад.',
    phases: [
      {title: 'Ҳайз', days: 'Рӯзҳои 1 то 5', text: 'Бадани шумо аз қабати бачадон озод мешавад.'},
      {title: 'Марҳилаи фолликулярӣ', days: 'Рӯзҳои 6 то 13', text: 'Бадани шумо ба овуляция омода мешавад.'},
      {title: 'Овуляция', days: 'Тақрибан рӯзи 14', text: 'Тухмсел озод мешавад. Ин давраи ҳосилхезтарин аст.'},
      {title: 'Марҳилаи лютеалӣ', days: 'Рӯзҳои 15 то 28', text: 'Бадани шумо ба ҳомиладории эҳтимолӣ омода мешавад.'},
    ],
    knowTitle: 'Донистан хуб аст',
    knowText: 'Давраи шумо аз як моҳ то моҳи дигар метавонад фарқ кунад. Стресс, хоб, ғизо ё беморӣ метавонад ба давомнокӣ ва суръати он таъсир расонад.',
    reasonsEyebrow: 'ЧАРО ПАЙГИРӢ КАРДАН',
    reasonsTitle: 'Беҳтар фаҳмидани давраи худ',
    reasons: [
      'Беҳтар фаҳмидани бадани худ',
      'Мутобиқ кардани қуввати худ',
      'Пешбинии кайфияти худ',
      'Ғамхорӣ аз саломатии худ',
      'Ба осонӣ пайгирии давраи худ',
    ],
    wellTitle: 'Маслиҳати некӯаҳволӣ',
    wellText: 'Ба бадани худ гӯш диҳед, ба эҳсосоти худ бодиққат бошед ва он чиро, ки рӯз ба рӯз тағйир меёбад, қайд кунед.',
  },
  ky: {
    shareTitle: 'Етек кирим циклиңизди түшүнүү',
    shareMessage: 'Етек кирим циклиңизди түшүнүү · AWA',
    pill: 'Циклиңизди түшүнүү',
    title: 'Етек кирим циклиңизди түшүнүү',
    duration: '6 мүн окуу',
    type: 'Колдонмо',
    level: 'Баштоочу',
    validated: 'Текшерилген мазмун',
    summary: 'Циклиңиздин негизги этаптары жөнөкөй түрдө түшүндүрүлөт.',
    stats: [
      {title: 'Орточо узактык', text: '28 күн'},
      {title: 'Кадимки узактык', text: '21ден 35 күнгө чейин'},
      {title: '4 негизги фаза', text: 'циклиңизде'},
      {title: 'Ар бир цикл', text: 'уникалдуу'},
    ],
    phasesEyebrow: 'ЦИКЛДИН ФАЗАЛАРЫ',
    phasesTitle: '4 негизги фаза',
    phasesIntro: 'Ар бир фаза денеңизде маанилүү роль ойнойт жана энергияңызга, маанайыңызга жана белгилериңизге таасир этиши мүмкүн.',
    phases: [
      {title: 'Етек кирим', days: '1-күндөн 5-күнгө чейин', text: 'Денеңиз жатындын ички катмарынан арылат.'},
      {title: 'Фолликулярдык фаза', days: '6-күндөн 13-күнгө чейин', text: 'Денеңиз овуляцияга даярданат.'},
      {title: 'Овуляция', days: 'Болжол менен 14-күн', text: 'Жумурткалуу клетка чыгат. Бул бойго бүтүүгө эң ыңгайлуу мезгил.'},
      {title: 'Лютеиндик фаза', days: '15-күндөн 28-күнгө чейин', text: 'Денеңиз мүмкүн болгон курсактуулукка даярданат.'},
    ],
    knowTitle: 'Билүү пайдалуу',
    knowText: 'Циклиңиз айдан айга айырмаланышы мүмкүн. Стресс, уйку, тамактануу же ооруу анын узактыгына жана ылдамдыгына таасир этиши мүмкүн.',
    reasonsEyebrow: 'КӨЗӨМӨЛДӨӨ ЭМНЕ ҮЧҮН',
    reasonsTitle: 'Циклиңизди жакшыраак түшүнүү',
    reasons: [
      'Денеңизди жакшыраак түшүнүү',
      'Энергияңызды ыңгайлаштыруу',
      'Маанайыңызды алдын ала билүү',
      'Ден соолугуңузга кам көрүү',
      'Циклиңизди оңой көзөмөлдөө',
    ],
    wellTitle: 'Жыргалчылык боюнча кеңеш',
    wellText: 'Денеңизди угуңуз, сезимдериңизге көңүл буруңуз жана күн сайын өзгөргөн нерсени жазып коюңуз.',
  },
  tk: {
    shareTitle: 'Aýbaşy sikliňizi düşünmek',
    shareMessage: 'Aýbaşy sikliňizi düşünmek · AWA',
    pill: 'Sikliňizi düşünmek',
    title: 'Aýbaşy sikliňizi düşünmek',
    duration: '6 min okamak',
    type: 'Gollanma',
    level: 'Başlaýjy',
    validated: 'Barlanan mazmun',
    summary: 'Sikliňiziň esasy tapgyrlary ýönekeý görnüşde düşündirilýär.',
    stats: [
      {title: 'Ortaça dowamlylyk', text: '28 gün'},
      {title: 'Adaty dowamlylyk', text: '21-den 35 güne çenli'},
      {title: '4 esasy tapgyr', text: 'sikliňizde'},
      {title: 'Her sikl', text: 'ýeke-täk'},
    ],
    phasesEyebrow: 'SIKLIŇ TAPGYRLARY',
    phasesTitle: '4 esasy tapgyr',
    phasesIntro: 'Her tapgyr bedeniňizde möhüm rol oýnaýar we energiýaňyza, keýbiňize hem-de alamatlaryňyza täsir edip biler.',
    phases: [
      {title: 'Aýbaşy', days: '1-nji günden 5-nji güne çenli', text: 'Bedeniňiz ýatgynyň içki gatlagyndan arassalanýar.'},
      {title: 'Follikulýar tapgyr', days: '6-njy günden 13-nji güne çenli', text: 'Bedeniňiz ovulýasiýa taýýarlanýar.'},
      {title: 'Ovulýasiýa', days: 'Takmynan 14-nji gün', text: 'Ýumurtga öýjügi çykýar. Bu göwreli bolmaga iň amatly döwür.'},
      {title: 'Lýuteal tapgyr', days: '15-nji günden 28-nji güne çenli', text: 'Bedeniňiz mümkin bolan göwrelilige taýýarlanýar.'},
    ],
    knowTitle: 'Bilmek peýdaly',
    knowText: 'Sikliňiz aýdan aýa tapawutlanyp biler. Stres, uky, iýmitlenmek ýa-da kesel onuň dowamlylygyna we çaltlygyna täsir edip biler.',
    reasonsEyebrow: 'YZARLAMAK NÄME ÜÇIN',
    reasonsTitle: 'Sikliňizi has gowy düşünmek',
    reasons: [
      'Bedeniňizi has gowy düşünmek',
      'Energiýaňyzy sazlamak',
      'Keýbiňizi öňünden görmek',
      'Saglygyňyza ideg etmek',
      'Sikliňizi aňsat yzarlamak',
    ],
    wellTitle: 'Abadançylyk maslahaty',
    wellText: 'Bedeniňize gulak asyň, duýgularyňyza üns beriň we her gün üýtgän zatlary ýazyp goýuň.',
  },
  az: {
    shareTitle: 'Menstrual dövrünüzü anlamaq',
    shareMessage: 'Menstrual dövrünüzü anlamaq · AWA',
    pill: 'Dövrünüzü anlamaq',
    title: 'Menstrual dövrünüzü anlamaq',
    duration: '6 dəq oxu',
    type: 'Bələdçi',
    level: 'Başlanğıc',
    validated: 'Yoxlanılmış məzmun',
    summary: 'Dövrünüzün əsas mərhələləri, sadə izahatla.',
    stats: [
      {title: 'Orta müddət', text: '28 gün'},
      {title: 'Normal müddət', text: '21 gündən 35 günə qədər'},
      {title: '4 əsas faza', text: 'dövrünüzdə'},
      {title: 'Hər dövr', text: 'özünəməxsusdur'},
    ],
    phasesEyebrow: 'DÖVRÜN FAZALARI',
    phasesTitle: '4 əsas faza',
    phasesIntro: 'Hər faza bədəninizdə mühüm rol oynayır və enerjinizə, əhvalınıza və simptomlarınıza təsir edə bilər.',
    phases: [
      {title: 'Aybaşı', days: '1-ci gündən 5-ci günə qədər', text: 'Bədəniniz uşaqlıq selikli qişasını atır.'},
      {title: 'Follikulyar faza', days: '6-cı gündən 13-cü günə qədər', text: 'Bədəniniz ovulyasiyaya hazırlaşır.'},
      {title: 'Ovulyasiya', days: 'Təxminən 14-cü gün', text: 'Yumurtahüceyrə ayrılır. Bu, ən münbit dövrdür.'},
      {title: 'Lutein fazası', days: '15-ci gündən 28-ci günə qədər', text: 'Bədəniniz mümkün hamiləliyə hazırlaşır.'},
    ],
    knowTitle: 'Bilmək faydalıdır',
    knowText: 'Dövrünüz aydan aya dəyişə bilər. Stress, yuxu, qidalanma və ya xəstəlik onun müddətinə və ritminə təsir edə bilər.',
    reasonsEyebrow: 'NƏ ÜÇÜN İZLƏMƏK LAZIMDIR',
    reasonsTitle: 'Dövrünüzü daha yaxşı anlamaq',
    reasons: [
      'Bədəninizi daha yaxşı anlamaq',
      'Enerjinizi tənzimləmək',
      'Əhvalınızı qabaqcadan görmək',
      'Sağlamlığınıza qulluq etmək',
      'Dövrünüzü asanlıqla izləmək',
    ],
    wellTitle: 'Rifah məsləhəti',
    wellText: 'Bədəninizi dinləyin, hisslərinizə diqqət yetirin və gündən-günə nəyin dəyişdiyini qeyd edin.',
  },
  uz: {
    shareTitle: 'Hayz siklingizni tushunish',
    shareMessage: 'Hayz siklingizni tushunish · AWA',
    pill: 'Siklingizni tushunish',
    title: 'Hayz siklingizni tushunish',
    duration: '6 daq oʻqish',
    type: 'Qoʻllanma',
    level: 'Boshlangʻich',
    validated: 'Tasdiqlangan kontent',
    summary: 'Siklingizning asosiy bosqichlari, oddiy tushuntirilgan.',
    stats: [
      {title: 'Oʻrtacha davomiylik', text: '28 kun'},
      {title: 'Normal davomiylik', text: '21 kundan 35 kungacha'},
      {title: '4 asosiy bosqich', text: 'siklingizda'},
      {title: 'Har bir sikl', text: 'noyob'},
    ],
    phasesEyebrow: 'SIKL BOSQICHLARI',
    phasesTitle: '4 asosiy bosqich',
    phasesIntro: 'Har bir bosqich tanangizda muhim rol oʻynaydi va energiyangizga, kayfiyatingizga hamda alomatlaringizga taʼsir qilishi mumkin.',
    phases: [
      {title: 'Hayz', days: '1-kundan 5-kungacha', text: 'Tanangiz bachadon qavatini toʻkadi.'},
      {title: 'Follikulyar bosqich', days: '6-kundan 13-kungacha', text: 'Tanangiz ovulyatsiyaga tayyorlanadi.'},
      {title: 'Ovulyatsiya', days: 'Taxminan 14-kun', text: 'Tuxum hujayra chiqadi. Bu eng unumdor davr.'},
      {title: 'Lyuteal bosqich', days: '15-kundan 28-kungacha', text: 'Tanangiz mumkin boʻlgan homiladorlikka tayyorlanadi.'},
    ],
    knowTitle: 'Bilish foydali',
    knowText: 'Siklingiz oydan oyga oʻzgarishi mumkin. Stress, uyqu, ovqatlanish yoki kasallik uning davomiyligi va ritmiga taʼsir qilishi mumkin.',
    reasonsEyebrow: 'NIMA UCHUN KUZATISH KERAK',
    reasonsTitle: 'Siklingizni yaxshiroq tushunish',
    reasons: [
      'Tanangizni yaxshiroq tushunish',
      'Energiyangizni moslashtirish',
      'Kayfiyatingizni oldindan sezish',
      'Salomatligingizga gʻamxoʻrlik qilish',
      'Siklingizni oson kuzatish',
    ],
    wellTitle: 'Farovonlik maslahati',
    wellText: 'Tanangizni tinglang, his-tuygʻularingizga eʼtiborli boʻling va kun sayin nima oʻzgarayotganini yozib boring.',
  },
  vi: {
    shareTitle: 'Hiểu chu kỳ kinh nguyệt của bạn',
    shareMessage: 'Hiểu chu kỳ kinh nguyệt của bạn · AWA',
    pill: 'Hiểu chu kỳ của bạn',
    title: 'Hiểu chu kỳ kinh nguyệt của bạn',
    duration: '6 phút đọc',
    type: 'Hướng dẫn',
    level: 'Cơ bản',
    validated: 'Nội dung đã được thẩm định',
    summary: 'Các giai đoạn chính của chu kỳ, được giải thích đơn giản.',
    stats: [
      {title: 'Độ dài trung bình', text: '28 ngày'},
      {title: 'Độ dài bình thường', text: '21 đến 35 ngày'},
      {title: '4 giai đoạn chính', text: 'trong chu kỳ của bạn'},
      {title: 'Mỗi chu kỳ', text: 'đều độc nhất'},
    ],
    phasesEyebrow: 'CÁC GIAI ĐOẠN CỦA CHU KỲ',
    phasesTitle: '4 giai đoạn chính',
    phasesIntro: 'Mỗi giai đoạn có một vai trò quan trọng trong cơ thể bạn và có thể ảnh hưởng đến năng lượng, tâm trạng và các triệu chứng của bạn.',
    phases: [
      {title: 'Kỳ kinh', days: 'Ngày 1 đến 5', text: 'Cơ thể bạn bong lớp niêm mạc tử cung.'},
      {title: 'Giai đoạn nang trứng', days: 'Ngày 6 đến 13', text: 'Cơ thể bạn chuẩn bị cho việc rụng trứng.'},
      {title: 'Rụng trứng', days: 'Khoảng ngày 14', text: 'Trứng được phóng thích. Đây là thời gian dễ thụ thai nhất.'},
      {title: 'Giai đoạn hoàng thể', days: 'Ngày 15 đến 28', text: 'Cơ thể bạn chuẩn bị cho một thai kỳ có thể có.'},
    ],
    knowTitle: 'Nên biết',
    knowText: 'Chu kỳ của bạn có thể thay đổi từ tháng này sang tháng khác. Căng thẳng, giấc ngủ, chế độ ăn hoặc bệnh tật có thể ảnh hưởng đến độ dài và nhịp điệu của nó.',
    reasonsEyebrow: 'TẠI SAO NÊN THEO DÕI',
    reasonsTitle: 'Hiểu rõ hơn chu kỳ của bạn',
    reasons: [
      'Hiểu rõ hơn cơ thể bạn',
      'Điều chỉnh năng lượng của bạn',
      'Dự đoán tâm trạng của bạn',
      'Chăm sóc sức khỏe của bạn',
      'Theo dõi chu kỳ dễ dàng',
    ],
    wellTitle: 'Lời khuyên cho sức khỏe',
    wellText: 'Hãy lắng nghe cơ thể, chú ý đến cảm nhận của bạn và ghi lại những gì thay đổi theo từng ngày.',
  },
  th: {
    shareTitle: 'ทำความเข้าใจรอบเดือนของคุณ',
    shareMessage: 'ทำความเข้าใจรอบเดือนของคุณ · AWA',
    pill: 'ทำความเข้าใจรอบเดือน',
    title: 'ทำความเข้าใจรอบเดือนของคุณ',
    duration: 'อ่าน 6 นาที',
    type: 'คู่มือ',
    level: 'เริ่มต้น',
    validated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    summary: 'ระยะสำคัญของรอบเดือนของคุณ อธิบายอย่างเข้าใจง่าย',
    stats: [
      {title: 'ระยะเวลาเฉลี่ย', text: '28 วัน'},
      {title: 'ระยะเวลาปกติ', text: '21 ถึง 35 วัน'},
      {title: '4 ระยะหลัก', text: 'ในรอบเดือนของคุณ'},
      {title: 'ทุกรอบเดือน', text: 'มีเอกลักษณ์'},
    ],
    phasesEyebrow: 'ระยะของรอบเดือน',
    phasesTitle: '4 ระยะหลัก',
    phasesIntro: 'แต่ละระยะมีบทบาทสำคัญในร่างกายของคุณ และอาจมีอิทธิพลต่อพลังงาน อารมณ์ และอาการของคุณ',
    phases: [
      {title: 'ประจำเดือน', days: 'วันที่ 1 ถึง 5', text: 'ร่างกายของคุณผลัดเยื่อบุโพรงมดลูก'},
      {title: 'ระยะฟอลลิคูลาร์', days: 'วันที่ 6 ถึง 13', text: 'ร่างกายของคุณเตรียมพร้อมสำหรับการตกไข่'},
      {title: 'การตกไข่', days: 'ราววันที่ 14', text: 'ไข่ถูกปล่อยออกมา เป็นช่วงที่เจริญพันธุ์ที่สุด'},
      {title: 'ระยะลูเทียล', days: 'วันที่ 15 ถึง 28', text: 'ร่างกายของคุณเตรียมพร้อมสำหรับการตั้งครรภ์ที่อาจเกิดขึ้น'},
    ],
    knowTitle: 'ควรรู้',
    knowText: 'รอบเดือนของคุณอาจต่างกันในแต่ละเดือน ความเครียด การนอน อาหาร หรือการเจ็บป่วย อาจมีอิทธิพลต่อระยะเวลาและจังหวะของมัน',
    reasonsEyebrow: 'ทำไมจึงควรติดตาม',
    reasonsTitle: 'เข้าใจรอบเดือนของคุณให้ดียิ่งขึ้น',
    reasons: [
      'เข้าใจร่างกายของคุณดียิ่งขึ้น',
      'ปรับพลังงานของคุณ',
      'คาดการณ์อารมณ์ของคุณ',
      'ดูแลสุขภาพของคุณ',
      'ติดตามรอบเดือนของคุณได้ง่าย',
    ],
    wellTitle: 'เคล็ดลับเพื่อความเป็นอยู่ที่ดี',
    wellText: 'ฟังเสียงร่างกายของคุณ ใส่ใจความรู้สึกของตัวเอง และจดสิ่งที่เปลี่ยนไปในแต่ละวัน',
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
  da: {
    shareTitle: 'Forstå din menstruationscyklus',
    shareMessage: 'Forstå din menstruationscyklus · AWA',
    pill: 'Forstå din cyklus',
    title: 'Forstå din menstruationscyklus',
    duration: '6 min læsning',
    type: 'Guide',
    level: 'Begynder',
    validated: 'Valideret indhold',
    summary: 'Cyklussens vigtigste faser forklaret på en enkel måde.',
    stats: [
      {title: 'Gennemsnitlig varighed', text: '28 dage'},
      {title: 'Normal varighed', text: '21 til 35 dage'},
      {title: '4 vigtige faser', text: 'i din cyklus'},
      {title: 'Hver cyklus', text: 'er unik'},
    ],
    phasesEyebrow: 'CYKLUSSENS FASER',
    phasesTitle: 'De 4 vigtige faser',
    phasesIntro: 'Hver fase spiller en vigtig rolle i din krop og kan påvirke din energi, dit humør og dine symptomer.',
    phases: [
      {title: 'Menstruation', days: 'Dag 1 til 5', text: 'Din krop frigiver livmoderslimhinden.'},
      {title: 'Follikelfasen', days: 'Dag 6 til 13', text: 'Din krop forbereder sig til ægløsning.'},
      {title: 'Ægløsning', days: 'Cirka dag 14', text: 'Ægget frigives. Det er den mest fertile periode.'},
      {title: 'Lutealfasen', days: 'Dag 15 til 28', text: 'Din krop forbereder sig på en eventuel graviditet.'},
    ],
    knowTitle: 'Godt at vide',
    knowText: 'Din cyklus kan variere fra måned til måned. Stress, søvn, kost eller sygdom kan påvirke dens varighed og rytme.',
    reasonsEyebrow: 'HVORFOR FØLGE DEN',
    reasonsTitle: 'Lær din cyklus bedre at kende',
    reasons: [
      'Forstå din krop bedre',
      'Tilpas din energi',
      'Forudse dit humør',
      'Tage vare på dit helbred',
      'Følg din cyklus nemt',
    ],
    wellTitle: 'Trivselstip',
    wellText: 'Lyt til din krop, vær opmærksom på, hvad du mærker, og noter, hvad der ændrer sig fra dag til dag.',
  },
  sv: {
    shareTitle: 'Forstå din menstruationscyklus',
    shareMessage: 'Forstå din menstruationscyklus · AWA',
    pill: 'Forstå din cyklus',
    title: 'Forstå din menstruationscyklus',
    duration: '6 min läsning',
    type: 'Guide',
    level: 'Begynder',
    validated: 'Valideret indhold',
    summary: 'Cyklussens vigtigste faser forklaret på en enkel måde.',
    stats: [
      {title: 'Gennemsnitlig varighed', text: '28 dage'},
      {title: 'Normal varighed', text: '21 till 35 dage'},
      {title: '4 vigtige faser', text: 'i din cyklus'},
      {title: 'Hver cyklus', text: 'er unik'},
    ],
    phasesEyebrow: 'CYKLUSSENS FASER',
    phasesTitle: 'De 4 vigtige faser',
    phasesIntro: 'Hver fase spiller en vigtig rolle i din krop och kan påvirke din energi, ditt humör och dina symtom.',
    phases: [
      {title: 'Menstruation', days: 'Dag 1 till 5', text: 'Din krop frigiver livmoderslimhinden.'},
      {title: 'Follikelfasen', days: 'Dag 6 till 13', text: 'Din krop forbereder sig till äglösning.'},
      {title: 'Äglösning', days: 'Cirka dag 14', text: 'Ägget frigives. Det ar den mest fertile periode.'},
      {title: 'Lutealfasen', days: 'Dag 15 till 28', text: 'Din krop forbereder sig på en eventuel graviditet.'},
    ],
    knowTitle: 'Godt at vide',
    knowText: 'Din cyklus kan variere fran måned till måned. Stress, sövn, kost eller sygdom kan påvirke dens varighed och rytme.',
    reasonsEyebrow: 'HVORFOR FÖLGE DEN',
    reasonsTitle: 'Lär din cyklus bedre at kende',
    reasons: [
      'Forstå din krop bedre',
      'Tilpas din energi',
      'Forudse ditt humör',
      'Tage vare på ditt helbred',
      'Fölg din cyklus nemt',
    ],
    wellTitle: 'Trivselstip',
    wellText: 'Lyt till din krop, vär opmärksom på, hvad du märker, och noter, hvad der ändrer sig fran dag till dag.',
  },
  nb: {
    shareTitle: 'Forstå menstruasjonssyklusen din',
    shareMessage: 'Forstå menstruasjonssyklusen din · AWA',
    pill: 'Forstå syklusen din',
    title: 'Forstå menstruasjonssyklusen din',
    duration: '6 min lesing',
    type: 'Veiledning',
    level: 'Nybegynner',
    validated: 'Validert innhold',
    summary: 'De viktigste fasene i syklusen din, forklart enkelt.',
    stats: [
      {title: 'Gjennomsnittlig lengde', text: '28 dager'},
      {title: 'Normal lengde', text: '21 til 35 dager'},
      {title: '4 hovedfaser', text: 'i syklusen din'},
      {title: 'Hver syklus', text: 'er unik'},
    ],
    phasesEyebrow: 'SYKLUSENS FASER',
    phasesTitle: 'De 4 hovedfasene',
    phasesIntro: 'Hver fase har en viktig rolle i kroppen din og kan påvirke energien, humøret og symptomene dine.',
    phases: [
      {title: 'Mensen', days: 'Dag 1 til 5', text: 'Kroppen din støter ut livmorslimhinnen.'},
      {title: 'Follikelfase', days: 'Dag 6 til 13', text: 'Kroppen din forbereder seg på eggløsning.'},
      {title: 'Eggløsning', days: 'Rundt dag 14', text: 'Egget frigjøres. Dette er den mest fruktbare perioden.'},
      {title: 'Lutealfase', days: 'Dag 15 til 28', text: 'Kroppen din forbereder seg på en mulig graviditet.'},
    ],
    knowTitle: 'Godt å vite',
    knowText: 'Syklusen din kan variere fra måned til måned. Stress, søvn, kosthold eller sykdom kan påvirke lengden og rytmen.',
    reasonsEyebrow: 'HVORFOR FØLGE DEN',
    reasonsTitle: 'Forstå syklusen din bedre',
    reasons: [
      'Forstå kroppen din bedre',
      'Tilpasse energien din',
      'Forutse humøret ditt',
      'Ta vare på helsen din',
      'Følge syklusen din enkelt',
    ],
    wellTitle: 'Velværetips',
    wellText: 'Lytt til kroppen din, vær oppmerksom på det du kjenner, og noter hva som endrer seg fra dag til dag.',
  },
  pl: {
    shareTitle: 'Zrozum swój cykl menstruacyjny',
    shareMessage: 'Zrozum swój cykl menstruacyjny · AWA',
    pill: 'Zrozum swój cykl',
    title: 'Zrozum swój cykl menstruacyjny',
    duration: '6 min czytania',
    type: 'Poradnik',
    level: 'Początkujący',
    validated: 'Treść zweryfikowana',
    summary: 'Najważniejsze fazy Twojego cyklu, wyjaśnione prosto.',
    stats: [
      {title: 'Średnia długość', text: '28 dni'},
      {title: 'Normalna długość', text: '21 do 35 dni'},
      {title: '4 główne fazy', text: 'Twojego cyklu'},
      {title: 'Każdy cykl', text: 'jest wyjątkowy'},
    ],
    phasesEyebrow: 'FAZY CYKLU',
    phasesTitle: '4 główne fazy',
    phasesIntro: 'Każda faza odgrywa ważną rolę w Twoim ciele i może wpływać na energię, nastrój i objawy.',
    phases: [
      {title: 'Miesiączka', days: 'Dzień 1 do 5', text: 'Twoje ciało usuwa błonę śluzową macicy.'},
      {title: 'Faza folikularna', days: 'Dzień 6 do 13', text: 'Twoje ciało przygotowuje się do owulacji.'},
      {title: 'Owulacja', days: 'Około 14. dnia', text: 'Komórka jajowa zostaje uwolniona. To najbardziej płodny okres.'},
      {title: 'Faza lutealna', days: 'Dzień 15 do 28', text: 'Twoje ciało przygotowuje się na możliwą ciążę.'},
    ],
    knowTitle: 'Warto wiedzieć',
    knowText: 'Twój cykl może się różnić z miesiąca na miesiąc. Stres, sen, dieta lub choroba mogą wpływać na jego długość i rytm.',
    reasonsEyebrow: 'DLACZEGO WARTO GO ŚLEDZIĆ',
    reasonsTitle: 'Lepiej poznaj swój cykl',
    reasons: [
      'Lepiej rozumieć swoje ciało',
      'Dostosować energię',
      'Przewidywać nastrój',
      'Dbać o swoje zdrowie',
      'Łatwo śledzić swój cykl',
    ],
    wellTitle: 'Wskazówka na dobre samopoczucie',
    wellText: 'Słuchaj swojego ciała, zwracaj uwagę na to, co zauważasz, i zapisuj, co zmienia się z dnia na dzień.',
  },
  uk: {
    shareTitle: 'Зрозумійте свій менструальний цикл',
    shareMessage: 'Зрозумійте свій менструальний цикл · AWA',
    pill: 'Зрозумійте свій цикл',
    title: 'Зрозумійте свій менструальний цикл',
    duration: '6 хв читання',
    type: 'Посібник',
    level: 'Початковий',
    validated: 'Перевірений вміст',
    summary: 'Основні фази вашого циклу, пояснені просто.',
    stats: [
      {title: 'Середня тривалість', text: '28 днів'},
      {title: 'Нормальна тривалість', text: 'від 21 до 35 днів'},
      {title: '4 основні фази', text: 'вашого циклу'},
      {title: 'Кожен цикл', text: 'унікальний'},
    ],
    phasesEyebrow: 'ФАЗИ ЦИКЛУ',
    phasesTitle: '4 основні фази',
    phasesIntro: 'Кожна фаза відіграє важливу роль у вашому тілі й може впливати на енергію, настрій і симптоми.',
    phases: [
      {title: 'Менструація', days: 'День 1–5', text: 'Ваше тіло виводить слизову оболонку матки.'},
      {title: 'Фолікулярна фаза', days: 'День 6–13', text: 'Ваше тіло готується до овуляції.'},
      {title: 'Овуляція', days: 'Близько 14-го дня', text: 'Яйцеклітина виходить. Це найфертильніший період.'},
      {title: 'Лютеїнова фаза', days: 'День 15–28', text: 'Ваше тіло готується до можливої вагітності.'},
    ],
    knowTitle: 'Варто знати',
    knowText: 'Ваш цикл може відрізнятися від місяця до місяця. Стрес, сон, харчування чи хвороба можуть впливати на його тривалість і ритм.',
    reasonsEyebrow: 'ЧОМУ ВАРТО ЙОГО ВІДСТЕЖУВАТИ',
    reasonsTitle: 'Краще пізнайте свій цикл',
    reasons: [
      'Краще розуміти своє тіло',
      'Підлаштовувати енергію',
      'Передбачати настрій',
      'Дбати про своє здоров’я',
      'Легко відстежувати свій цикл',
    ],
    wellTitle: 'Порада для самопочуття',
    wellText: 'Прислухайтеся до свого тіла, звертайте увагу на те, що помічаєте, і записуйте, що змінюється з дня на день.',
  },
  cs: {
    shareTitle: 'Pochopte svůj menstruační cyklus',
    shareMessage: 'Pochopte svůj menstruační cyklus · AWA',
    pill: 'Pochopte svůj cyklus',
    title: 'Pochopte svůj menstruační cyklus',
    duration: '6 min čtení',
    type: 'Průvodce',
    level: 'Začátečník',
    validated: 'Ověřený obsah',
    summary: 'Hlavní fáze vašeho cyklu, jednoduše vysvětlené.',
    stats: [
      {title: 'Průměrná délka', text: '28 dní'},
      {title: 'Normální délka', text: '21 až 35 dní'},
      {title: '4 hlavní fáze', text: 'vašeho cyklu'},
      {title: 'Každý cyklus', text: 'je jedinečný'},
    ],
    phasesEyebrow: 'FÁZE CYKLU',
    phasesTitle: '4 hlavní fáze',
    phasesIntro: 'Každá fáze hraje ve vašem těle důležitou roli a může ovlivňovat vaši energii, náladu i příznaky.',
    phases: [
      {title: 'Menstruace', days: '1. až 5. den', text: 'Vaše tělo odlučuje děložní sliznici.'},
      {title: 'Folikulární fáze', days: '6. až 13. den', text: 'Vaše tělo se připravuje na ovulaci.'},
      {title: 'Ovulace', days: 'Kolem 14. dne', text: 'Vajíčko se uvolňuje. Je to nejplodnější období.'},
      {title: 'Luteální fáze', days: '15. až 28. den', text: 'Vaše tělo se připravuje na možné těhotenství.'},
    ],
    knowTitle: 'Stojí za to vědět',
    knowText: 'Váš cyklus se může z měsíce na měsíc lišit. Stres, spánek, strava nebo nemoc mohou ovlivnit jeho délku a rytmus.',
    reasonsEyebrow: 'PROČ HO SLEDOVAT',
    reasonsTitle: 'Lépe poznejte svůj cyklus',
    reasons: [
      'Lépe rozumět svému tělu',
      'Přizpůsobit svou energii',
      'Předvídat svou náladu',
      'Pečovat o své zdraví',
      'Snadno sledovat svůj cyklus',
    ],
    wellTitle: 'Tip pro pohodu',
    wellText: 'Naslouchejte svému tělu, všímejte si svých pocitů a zapisujte si, co se den po dni mění.',
  },
  sk: {
    shareTitle: 'Pochopte svoj menštruačný cyklus',
    shareMessage: 'Pochopte svoj menštruačný cyklus · AWA',
    pill: 'Pochopte svoj cyklus',
    title: 'Pochopte svoj menštruačný cyklus',
    duration: '6 min čítania',
    type: 'Sprievodca',
    level: 'Začiatočník',
    validated: 'Overený obsah',
    summary: 'Hlavné fázy vášho cyklu, jednoducho vysvetlené.',
    stats: [
      {title: 'Priemerná dĺžka', text: '28 dní'},
      {title: 'Normálna dĺžka', text: '21 až 35 dní'},
      {title: '4 hlavné fázy', text: 'vášho cyklu'},
      {title: 'Každý cyklus', text: 'je jedinečný'},
    ],
    phasesEyebrow: 'FÁZY CYKLU',
    phasesTitle: '4 hlavné fázy',
    phasesIntro: 'Každá fáza zohráva vo vašom tele dôležitú úlohu a môže ovplyvňovať vašu energiu, náladu aj príznaky.',
    phases: [
      {title: 'Menštruácia', days: '1. až 5. deň', text: 'Vaše telo odlučuje sliznicu maternice.'},
      {title: 'Folikulárna fáza', days: '6. až 13. deň', text: 'Vaše telo sa pripravuje na ovuláciu.'},
      {title: 'Ovulácia', days: 'Okolo 14. dňa', text: 'Vajíčko sa uvoľňuje. Je to najplodnejšie obdobie.'},
      {title: 'Luteálna fáza', days: '15. až 28. deň', text: 'Vaše telo sa pripravuje na možné tehotenstvo.'},
    ],
    knowTitle: 'Stojí za to vedieť',
    knowText: 'Váš cyklus sa môže z mesiaca na mesiac líšiť. Stres, spánok, strava alebo choroba môžu ovplyvniť jeho dĺžku a rytmus.',
    reasonsEyebrow: 'PREČO HO SLEDOVAŤ',
    reasonsTitle: 'Lepšie spoznajte svoj cyklus',
    reasons: [
      'Lepšie rozumieť svojmu telu',
      'Prispôsobiť svoju energiu',
      'Predvídať svoju náladu',
      'Starať sa o svoje zdravie',
      'Jednoducho sledovať svoj cyklus',
    ],
    wellTitle: 'Tip pre pohodu',
    wellText: 'Počúvajte svoje telo, všímajte si svoje pocity a zapisujte si, čo sa deň za dňom mení.',
  },
  hu: {
    shareTitle: 'Értsd meg a menstruációs ciklusodat',
    shareMessage: 'Értsd meg a menstruációs ciklusodat · AWA',
    pill: 'Értsd meg a ciklusodat',
    title: 'Értsd meg a menstruációs ciklusodat',
    duration: '6 perc olvasás',
    type: 'Útmutató',
    level: 'Kezdő',
    validated: 'Ellenőrzött tartalom',
    summary: 'A ciklusod főbb szakaszai, egyszerűen elmagyarázva.',
    stats: [
      {title: 'Átlagos hossz', text: '28 nap'},
      {title: 'Normális hossz', text: '21–35 nap'},
      {title: '4 fő szakasz', text: 'a ciklusodban'},
      {title: 'Minden ciklus', text: 'egyedi'},
    ],
    phasesEyebrow: 'A CIKLUS SZAKASZAI',
    phasesTitle: 'A 4 fő szakasz',
    phasesIntro: 'Minden szakasz fontos szerepet játszik a testedben, és befolyásolhatja az energiádat, a hangulatodat és a tüneteidet.',
    phases: [
      {title: 'Menstruáció', days: '1–5. nap', text: 'A tested leválasztja a méhnyálkahártyát.'},
      {title: 'Follikuláris szakasz', days: '6–13. nap', text: 'A tested a peteérésre készül.'},
      {title: 'Peteérés', days: 'Körülbelül a 14. nap', text: 'A petesejt kiszabadul. Ez a legtermékenyebb időszak.'},
      {title: 'Luteális szakasz', days: '15–28. nap', text: 'A tested egy lehetséges terhességre készül.'},
    ],
    knowTitle: 'Érdemes tudni',
    knowText: 'A ciklusod hónapról hónapra eltérhet. A stressz, az alvás, a táplálkozás vagy a betegség befolyásolhatja az időtartamát és a ritmusát.',
    reasonsEyebrow: 'MIÉRT ÉRDEMES KÖVETNI',
    reasonsTitle: 'Ismerd meg jobban a ciklusodat',
    reasons: [
      'Jobban megérteni a testedet',
      'Az energiádat igazítani',
      'Előre látni a hangulatodat',
      'Gondoskodni az egészségedről',
      'Könnyen követni a ciklusodat',
    ],
    wellTitle: 'Jóléti tipp',
    wellText: 'Figyelj a testedre, légy figyelmes az érzéseidre, és jegyezd fel, mi változik napról napra.',
  },
  ro: {
    shareTitle: 'Înțelege-ți ciclul menstrual',
    shareMessage: 'Înțelege-ți ciclul menstrual · AWA',
    pill: 'Înțelege-ți ciclul',
    title: 'Înțelege-ți ciclul menstrual',
    duration: '6 min de citit',
    type: 'Ghid',
    level: 'Începător',
    validated: 'Conținut revizuit',
    summary: 'Etapele principale ale ciclului tău, explicate simplu.',
    stats: [
      {title: 'Durată medie', text: '28 de zile'},
      {title: 'Durată normală', text: '21–35 de zile'},
      {title: '4 faze principale', text: 'în ciclul tău'},
      {title: 'Fiecare ciclu', text: 'este unic'},
    ],
    phasesEyebrow: 'FAZELE CICLULUI',
    phasesTitle: 'Cele 4 faze principale',
    phasesIntro: 'Fiecare fază are un rol important în corpul tău și îți poate influența energia, starea de spirit și simptomele.',
    phases: [
      {title: 'Menstruația', days: 'Zilele 1–5', text: 'Corpul tău elimină mucoasa uterină.'},
      {title: 'Faza foliculară', days: 'Zilele 6–13', text: 'Corpul tău se pregătește pentru ovulație.'},
      {title: 'Ovulația', days: 'Aproximativ ziua 14', text: 'Ovulul este eliberat. Este perioada cea mai fertilă.'},
      {title: 'Faza luteală', days: 'Zilele 15–28', text: 'Corpul tău se pregătește pentru o eventuală sarcină.'},
    ],
    knowTitle: 'Bine de știut',
    knowText: 'Ciclul tău poate varia de la o lună la alta. Stresul, somnul, alimentația sau boala îi pot influența durata și ritmul.',
    reasonsEyebrow: 'DE CE SĂ-L URMĂREȘTI',
    reasonsTitle: 'Înțelege-ți mai bine ciclul',
    reasons: [
      'Să-ți înțelegi mai bine corpul',
      'Să-ți adaptezi energia',
      'Să-ți anticipezi starea de spirit',
      'Să ai grijă de sănătatea ta',
      'Să-ți urmărești ciclul cu ușurință',
    ],
    wellTitle: 'Sfat de bunăstare',
    wellText: 'Ascultă-ți corpul, rămâi atentă la ce simți și notează ce se schimbă de la o zi la alta.',
  },
} as const);

function UnderstandCycleArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const content = CONTENT[i18n.language === 'tk' ? 'tk' : i18n.language === 'ky' ? 'ky' : i18n.language === 'tg' ? 'tg' : i18n.language === 'hy' ? 'hy' : i18n.language === 'ka' ? 'ka' : i18n.language === 'az' ? 'az' : i18n.language === 'uz' ? 'uz' : i18n.language === 'vi' ? 'vi' : i18n.language === 'th' ? 'th' : i18n.language === 'si' ? 'si' : i18n.language === 'ne' ? 'ne' : i18n.language === 'sl' ? 'sl' : i18n.language === 'bs' ? 'bs' : i18n.language === 'hr' ? 'hr' : i18n.language === 'sr' ? 'sr' : i18n.language === 'bg' ? 'bg' : i18n.language === 'ro' ? 'ro' : i18n.language === 'hu' ? 'hu' : i18n.language === 'sk' ? 'sk' : i18n.language === 'cs' ? 'cs' : i18n.language === 'sv' ? 'sv' : i18n.language === 'uk' ? 'uk' : i18n.language === 'pl' ? 'pl' :i18n.language === 'nb' ? 'nb' :i18n.language === 'ru' ? 'ru' : i18n.language === 'de' ? 'de' : i18n.language === 'zh' ? 'zh' : i18n.language === 'id' ? 'id' : i18n.language === 'hi' ? 'hi' : i18n.language === 'sq' ? 'sq' : i18n.language === 'ja' ? 'ja' : i18n.language === 'ko' ? 'ko' : i18n.language === 'pt-PT' ? 'pt-PT' : i18n.language === 'pt-BR' ? 'pt-BR' : i18n.language === 'bn' ? 'bn' : i18n.language === 'da' ? 'da' : 'fr'];
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
