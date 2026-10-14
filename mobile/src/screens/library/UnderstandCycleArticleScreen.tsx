import React, {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ReadingControls from '../../components/articles/ReadingControls';
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

const ARTICLE_ID = 'cycle-comprendre-ton-cycle';

const INK = '#282238';
const INK_SOFT = '#4A4357';
const PURPLE = '#5B43A5';
const BORDER = '#E8E4EC';
const SURFACE = '#FFFFFF';
const BACKGROUND = '#FAF9FB';
const MUTED = '#756F7E';
const PINK = '#C96F83';

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

const CONTENT = {
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
} as const;

function UnderstandCycleArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const content = CONTENT[i18n.language === 'ru' ? 'ru' : i18n.language === 'de' ? 'de' : i18n.language === 'zh' ? 'zh' : 'fr'];
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
        barStyle="dark-content"
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
          <Pressable
            onPress={navigation.goBack}
            accessibilityRole="button"
            accessibilityLabel={t('library.reader.back')}
            style={({pressed}) => [
              styles.circle,
              pressed && styles.pressed,
            ]}>
            <MaterialDesignIcons
              name="chevron-left"
              size={25}
              color={INK}
            />
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              onPress={() =>
                setBookmarked(
                  toggleBookmark(ARTICLE_ID),
                )
              }
              accessibilityRole="button"
              accessibilityLabel={t('libraryArticle.bookmarkA11y')}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name={
                  bookmarked
                    ? 'bookmark'
                    : 'bookmark-outline'
                }
                size={19}
                color={PURPLE}
              />
            </Pressable>

            <Pressable
              onPress={() =>
                Share.share({
                  title: content.shareTitle,
                  message: content.shareMessage,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={t('libraryArticle.shareA11y')}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="share-variant-outline"
                size={19}
                color={PURPLE}
              />
            </Pressable>
          </View>
        </View>

        <LinearGradient
          colors={['#F7F3FB', '#F5EFFA', '#F2EBF9']}
          start={{x: 0, y: 0.55}}
          end={{x: 1, y: 0.45}}
          style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.pill}>
              <MaterialDesignIcons
                name="feather"
                size={12}
                color={PURPLE}
              />
              <Text style={styles.pillText}>
                {content.pill}
              </Text>
            </View>

            <Text style={styles.title}>
              {content.title}
            </Text>

            <View style={styles.metaContainer}>
              <View style={styles.metaTopRow}>
                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name="clock-outline"
                    size={14}
                    color={MUTED}
                  />
                  <Text style={styles.metaText}>
                    {content.duration}
                  </Text>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name="book-open-page-variant-outline"
                    size={14}
                    color={MUTED}
                  />
                  <Text style={styles.metaText}>
                    {content.type}
                  </Text>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name="chart-bar"
                    size={14}
                    color={MUTED}
                  />
                  <Text style={styles.metaText}>
                    {content.level}
                  </Text>
                </View>
              </View>

              <View style={styles.metaValidatedRow}>
                <MaterialDesignIcons
                  name="shield-check-outline"
                  size={14}
                  color={MUTED}
                />
                <Text style={styles.metaText}>
                  {content.validated}
                </Text>
              </View>
            </View>

            <Text style={styles.summary}>
              {content.summary}
            </Text>
          </View>

          <View style={styles.heroImageWrap}>
            <Image
              source={require('../../assets/images/understand-cycle-hero.png')}
              resizeMode="cover"
              style={styles.heroImage}
            />
          </View>
        </LinearGradient>

        <View style={styles.statsCard}>
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
                color={PURPLE}
              />
              <Text style={styles.statTitle}>
                {item.title}
              </Text>
              <Text style={styles.statText}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>
              {content.phasesEyebrow}
            </Text>
            <Text style={styles.sectionTitle}>
              {content.phasesTitle}
            </Text>
          </View>

          <Text style={styles.sectionIntro}>
            {content.phasesIntro}
          </Text>

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
                  <Text style={styles.phaseNumber}>
                    {phase.number}
                  </Text>
                </View>

                <View style={styles.phaseCopy}>
                  <View style={styles.phaseTitleRow}>
                    <MaterialDesignIcons
                      name={phase.icon}
                      size={17}
                      color={phase.color}
                    />
                    <Text
                      style={[
                        styles.phaseTitle,
                        {color: phase.color},
                      ]}>
                      {phase.title}
                    </Text>
                  </View>

                  <Text style={styles.phaseDays}>
                    {phase.days}
                  </Text>

                  <Text style={styles.phaseText}>
                    {phase.text}
                  </Text>
                </View>
              </View>
              );
            })}
          </View>
        </View>

        <LinearGradient
          colors={['#F3F0F8', '#FAF8FC']}
          style={styles.knowCard}>
          <View style={styles.knowIcon}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={19}
              color={PURPLE}
            />
          </View>

          <View style={styles.knowCopy}>
            <Text style={styles.knowTitle}>
              {content.knowTitle}
            </Text>
            <Text style={styles.knowText}>
              {content.knowText}
            </Text>
          </View>

          <Image
            source={require('../../assets/images/understand-cycle-journal.png')}
            resizeMode="cover"
            style={styles.journalImage}
          />
        </LinearGradient>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>
              {content.reasonsEyebrow}
            </Text>
            <Text style={styles.sectionTitle}>
              {content.reasonsTitle}
            </Text>
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
                  color={PURPLE}
                />
                <Text style={styles.reasonText}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <LinearGradient
          colors={['#F8F4F5', '#FCFAFA']}
          style={styles.wellbeing}>
          <View style={styles.wellIcon}>
            <MaterialDesignIcons
              name="heart-outline"
              size={19}
              color={PINK}
            />
          </View>

          <View style={styles.wellCopy}>
            <Text style={styles.wellTitle}>
              {content.wellTitle}
            </Text>
            <Text style={styles.wellText}>
              {content.wellText}
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>

      <ReadingControls
        articleId={ARTICLE_ID}
        durationMinutes={6}
        scrollRef={scrollRef}
      />
    </View>
  );
}

const shadow = {
  shadowColor: '#211B2A',
  shadowOffset: {width: 0, height: 3},
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  content: {
    paddingHorizontal: 18,
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

  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  pressed: {
    opacity: 0.72,
    transform: [{scale: 0.98}],
  },

  hero: {
    minHeight: 232,
    marginTop: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE2F4',
    paddingLeft: 16,
    paddingVertical: 16,
    ...shadow,
  },

  heroCopy: {
    width: '65%',
    zIndex: 2,
    paddingTop: 0,
    paddingRight: 7,
  },

  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(91,67,165,0.20)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.58)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  pillText: {
    color: PURPLE,
    fontSize: 10.5,
    fontWeight: '700',
  },

  title: {
    marginTop: 10,
    maxWidth: '100%',
    color: INK,
    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 21.5,
    fontWeight: '700',
  },

  metaContainer: {
    marginTop: 11,
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
    marginHorizontal: 6,
    backgroundColor: '#D8D2DC',
  },

  metaValidatedRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaText: {
    color: MUTED,
    fontSize: 9.2,
    lineHeight: 12,
  },

  summary: {
    marginTop: 11,
    color: INK_SOFT,
    fontSize: 10.8,
    lineHeight: 15.5,
  },

  heroImageWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '38%',
    overflow: 'hidden',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: 'transparent',
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  statsCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: SURFACE,
    paddingVertical: 12,
    ...shadow,
  },

  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 6,
  },

  statBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: BORDER,
  },

  statTitle: {
    marginTop: 7,
    color: INK,
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  statText: {
    marginTop: 3,
    color: MUTED,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },

  sectionCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: SURFACE,
    padding: 14,
    ...shadow,
  },

  sectionHeader: {
    marginBottom: 8,
  },

  sectionEyebrow: {
    color: MUTED,
    fontSize: 9.5,
    letterSpacing: 1.1,
    fontWeight: '700',
  },

  sectionTitle: {
    marginTop: 4,
    color: INK,
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '800',
  },

  sectionIntro: {
    color: INK_SOFT,
    fontSize: 11,
    lineHeight: 16,
  },

  phaseList: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },

  phaseRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },

  phaseDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },

  phaseNumberBox: {
    width: 38,
    paddingTop: 1,
  },

  phaseNumber: {
    color: '#A39CA9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  phaseCopy: {
    flex: 1,
    minWidth: 0,
  },

  phaseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  phaseTitle: {
    flex: 1,
    fontSize: 12,
    lineHeight: 15.5,
    fontWeight: '800',
  },

  phaseDays: {
    marginTop: 4,
    color: MUTED,
    fontSize: 10,
    fontWeight: '600',
  },

  phaseText: {
    marginTop: 5,
    color: INK_SOFT,
    fontSize: 10.5,
    lineHeight: 15,
  },

  knowCard: {
    marginTop: 16,
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E0EC',
    borderRadius: 16,
    padding: 15,
  },

  knowIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCD5E8',
    borderRadius: 12,
    backgroundColor: '#F8F6FA',
  },

  knowCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 72,
  },

  knowTitle: {
    color: INK,
    fontSize: 12.5,
    fontWeight: '800',
  },

  knowText: {
    marginTop: 5,
    color: INK_SOFT,
    fontSize: 10.5,
    lineHeight: 15,
  },

  journalImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 78,
    height: 82,
    opacity: 0.9,
    borderRadius: 14,
  },

  reasonsList: {
    marginTop: 8,
  },

  reasonRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
  },

  reasonDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },

  reasonText: {
    flex: 1,
    color: INK_SOFT,
    fontSize: 11,
    lineHeight: 15.5,
    fontWeight: '600',
  },

  wellbeing: {
    marginTop: 16,
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderWidth: 1,
    borderColor: '#ECE1E4',
    borderRadius: 16,
    padding: 15,
  },

  wellIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8D5DA',
    borderRadius: 12,
    backgroundColor: '#FBF7F8',
  },

  wellCopy: {
    flex: 1,
    minWidth: 0,
  },

  wellTitle: {
    color: INK,
    fontSize: 12.5,
    fontWeight: '800',
  },

  wellText: {
    marginTop: 5,
    color: INK_SOFT,
    fontSize: 10.5,
    lineHeight: 15,
  },

});

export default UnderstandCycleArticleScreen;