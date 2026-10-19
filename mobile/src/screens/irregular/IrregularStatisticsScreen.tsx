import React, {useCallback, useMemo, useState, useEffect} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {getFloatingTabBarClearance} from '../../theme/spacing';
import {usePremium} from '../../hooks/usePremium';
import {useToday} from '../../hooks/useToday';
import {HawaPremiumBottomSheet} from '../../components/premium/HawaPremiumBottomSheet';
import {
  getAllIrregularJournalEntries,
  hydrateIrregularJournal,
  subscribeIrregularJournal,
  type IrregularJournalCategory,
  type IrregularJournalEntry,
} from '../../state/irregularJournalStore';
import {useIrregularPeriodSources} from '../../hooks/useIrregularPeriodSources';
import {resolveIrregularPeriodStarts} from '../../utils/irregularJournalSelectors';
import {
  STATISTICS_PERIODS,
  isPeriodFree,
  filterEntriesForPeriod,
  filterStartKeysForPeriod,
  calculateAverageCycleDuration,
  coverageMonthsForAnchor,
  describeMonthsCoverage,
} from '../../utils/cycleStatisticsMath';
import type {StatisticsPeriod} from '../../utils/cycleStatisticsMath';
import {
  calculateAssociatedSymptomFrequency,
  calculateCategoryDistribution,
  calculateMonthlyCategoryTrend,
  calculateIrregularWeightEntries,
  calculateMonthlyIrregularWeightTrend,
  countDaysWithAnySymptom,
  type CategoryDistributionEntry,
  type MonthlyCategoryTrendEntry,
} from '../../utils/irregularStatisticsMath';
import {journalOptionLabel, type JournalOptionNamespace} from '../../utils/journalOptionLabels';
import '../../i18n';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaText} from '../../components/ui/AwaText';

// Phase 7H.1 — maps each single-value scale field read by
// calculateCategoryDistribution (entry.acne/hairGrowth/pain/mood/fatigue) to
// the SAME namespace already used for the identical options on
// IrregularJournalEntryScreen — the persisted/grouped `item.value` stays the
// original French string; only the rendered label translates.
const CATEGORY_NAMESPACE: Record<
  Exclude<IrregularJournalCategory, 'weight'>,
  JournalOptionNamespace
> = {
  acne: 'irregularAcne',
  hairGrowth: 'irregularHair',
  pain: 'irregularIntensity',
  mood: 'irregularMood',
  fatigue: 'irregularFatigueLevel',
};

/* ============================================================
   TYPES
============================================================ */

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

function periodLabels(t: (key: string) => string): Record<StatisticsPeriod, string> {
  return {
    '1': t('irregularStatistics.periods.oneMonth'),
    '3': t('irregularStatistics.periods.threeMonths'),
    '6': t('irregularStatistics.periods.sixMonths'),
    '12': t('irregularStatistics.periods.twelveMonths'),
  };
}

// Same convention as IrregularCalendarContent.tsx's CATEGORY_LABEL/ICON —
// deliberately excludes 'weight' (rendered as its own dedicated POIDS
// section below, since a measurement list reads better than a value
// distribution) and 'period'/"Règles" (that belongs to the shared Cycle
// Statistics data model, not SOPK's own store).
function symptomCategoryMeta(
  t: (key: string) => string,
): Array<{key: Exclude<IrregularJournalCategory, 'weight'>; label: string; icon: IconName}> {
  return [
    {key: 'acne', label: t('irregularStatistics.categories.acne'), icon: 'face-woman-outline'},
    {key: 'hairGrowth', label: t('irregularStatistics.categories.hairGrowth'), icon: 'human'},
    {key: 'pain', label: t('irregularStatistics.categories.pain'), icon: 'lightning-bolt-outline'},
    {key: 'mood', label: t('irregularStatistics.categories.mood'), icon: 'emoticon-outline'},
    {key: 'fatigue', label: t('irregularStatistics.categories.fatigue'), icon: 'battery-medium'},
  ];
}

/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={21} />
      </View>

      <View style={styles.sectionHeaderCopy}>
        <AwaText variant="titleMedium" style={styles.cardTitle}>{title}</AwaText>
        {subtitle ? <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardSubtitle}>{subtitle}</AwaText> : null}
      </View>
    </View>
  );
}

/* ============================================================
   EMPTY / INSUFFICIENT DATA NOTICE
============================================================ */

function DataNotice({
  icon,
  title,
  detail,
}: {
  icon: IconName;
  title: string;
  detail: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <AwaCard padding="none" variant="filled" style={styles.notice}>
      <View style={styles.noticeIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={20} />
      </View>

      <View style={styles.noticeCopy}>
        <AwaText variant="labelMedium" style={styles.noticeTitle}>{title}</AwaText>
        <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.noticeDetail}>{detail}</AwaText>
      </View>
    </AwaCard>
  );
}

/* ============================================================
   PER-CATEGORY CARD (ACNÉ / PILOSITÉ / DOULEURS / HUMEUR / FATIGUE)
============================================================ */

function CategoryCard({
  icon,
  title,
  distribution,
  monthlyTrend,
  showLongitudinalView,
  monthsLabel,
  namespace,
}: {
  icon: IconName;
  title: string;
  distribution: CategoryDistributionEntry[];
  monthlyTrend: MonthlyCategoryTrendEntry[];
  showLongitudinalView: boolean;
  monthsLabel: string;
  namespace: JournalOptionNamespace;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const totalRecordedDays = distribution.reduce((sum, item) => sum + item.days, 0);
  const maxDays = Math.max(1, ...distribution.map(item => item.days));

  return (
    <AwaCard padding="none" variant="filled" style={styles.card}>
      <SectionHeader
        icon={icon}
        subtitle={
          showLongitudinalView
            ? t('irregularStatistics.category.subtitleLongitudinal', {months: monthsLabel})
            : t('irregularStatistics.category.subtitleMonth')
        }
        title={title}
      />

      {distribution.length > 0 ? (
        <>
          {!showLongitudinalView ? (
            <View style={styles.monthVisualization}>
              <View style={styles.monthVisualizationTop}>
                <View>
                  <AwaText variant="labelSmall" colorRole="primary">{t('irregularStatistics.common.thisMonth')}</AwaText>
                  <Text style={styles.monthVisualizationNumber}>{totalRecordedDays}</Text>
                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.monthVisualizationUnit}>
                    {t('irregularStatistics.common.trackedDaysLabel', {count: totalRecordedDays})}
                  </AwaText>
                </View>

                <View style={styles.monthVisualizationIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name={icon} size={22} />
                </View>
              </View>

              <View style={styles.distributionList}>
                {distribution.map(item => {
                  const percent = Math.max(8, Math.round((item.days / maxDays) * 100));

                  return (
                    <View key={item.value} style={styles.distributionItem}>
                      <View style={styles.distributionItemTop}>
                        <AwaText variant="labelSmall" style={styles.distributionLabel}>
                          {journalOptionLabel(namespace, item.value, t)}
                        </AwaText>
                        <AwaText variant="labelSmall" colorRole="onSurfaceVariant">
                          {t('irregularStatistics.common.daysCount', {count: item.days})}
                        </AwaText>
                      </View>

                      <View style={styles.distributionTrack}>
                        <View style={[styles.distributionFill, {width: `${percent}%`}]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.chipRow}>
              {distribution.map(item => (
                <View key={item.value} style={styles.chip}>
                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant">
                    {`${journalOptionLabel(namespace, item.value, t)} · ${t('irregularStatistics.common.daysCount', {count: item.days})}`}
                  </AwaText>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <DataNotice
          detail={t('irregularStatistics.category.emptyDetail')}
          icon="calendar-blank-outline"
          title={t('irregularStatistics.category.emptyTitle')}
        />
      )}

      {showLongitudinalView && monthlyTrend.length > 0 ? (
        <View style={styles.monthList}>
          <AwaText variant="labelSmall" style={styles.monthListTitle}>{t('irregularStatistics.category.evolutionTitle')}</AwaText>

          {monthlyTrend.map(month => (
            <View key={month.monthKey} style={styles.monthItem}>
              <View style={styles.monthTop}>
                <AwaText variant="labelSmall" style={styles.monthLabel}>{month.monthLabel}</AwaText>
              </View>

              <View style={styles.chipRow}>
                {month.distribution.map(item => (
                  <View key={item.value} style={styles.chip}>
                    <AwaText variant="labelSmall" colorRole="onSurfaceVariant">
                      {`${journalOptionLabel(namespace, item.value, t)} · ${t('irregularStatistics.common.daysAbbrev', {count: item.days})}`}
                    </AwaText>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </AwaCard>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

function IrregularStatisticsScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const compact = width < 370;

  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const PERIOD_LABELS = useMemo(() => periodLabels(t), [t]);
  const SYMPTOM_CATEGORY_META = useMemo(() => symptomCategoryMeta(t), [t]);

  const {isPremium} = usePremium();
  const [premiumVisible, setPremiumVisible] = useState(false);

  const [period, setPeriod] = useState<StatisticsPeriod>('1');
  const [entriesByDate, setEntriesByDate] = useState<Record<string, IrregularJournalEntry>>(
    getAllIrregularJournalEntries,
  );
  const [now, setNow] = useState<Date>(() => new Date());
  // Recomputed when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. Same Date (no re-render) when the
  // day is unchanged.
  const {todayKey} = useToday();
  useEffect(() => {
    setNow(current => (current.toLocaleDateString('en-CA') === todayKey ? current : new Date()));
  }, [todayKey]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setNow(new Date());

      hydrateIrregularJournal().then(() => {
        if (active) {setEntriesByDate(getAllIrregularJournalEntries());}
      });
      const unsubscribeIrregular = subscribeIrregularJournal(() => {
        if (active) {setEntriesByDate(getAllIrregularJournalEntries());}
      });

      return () => {
        active = false;
        unsubscribeIrregular();
      };
    }, []),
  );

  const handleSelectPeriod = (target: StatisticsPeriod): void => {
    if (!isPeriodFree(target) && !isPremium) {
      setPremiumVisible(true);
      return;
    }
    setPeriod(target);
  };

  const allEntries = useMemo(() => Object.values(entriesByDate), [entriesByDate]);

  const filteredEntries = useMemo(
    () => filterEntriesForPeriod(allEntries, period, now),
    [allEntries, period, now],
  );

  // Real period starts from every source that knows one (recorded period days,
  // cycle-confirmed occurrences, the onboarding answer) — see
  // resolveIrregularPeriodStarts. Reading confirmedPeriodHistory alone left
  // this screen empty for a SOPK user who records periods in the journal (a
  // "confirmed" occurrence needs an explicit end confirmation this objective
  // never asks for). A cycle length is the gap between two consecutive starts,
  // so it needs no end date. Nothing is written to confirmedPeriodHistory.
  const periodSources = useIrregularPeriodSources();
  const periodStartKeys = useMemo(
    () => resolveIrregularPeriodStarts(periodSources),
    [periodSources],
  );

  const filteredPeriodStarts = useMemo(
    () => filterStartKeysForPeriod(periodStartKeys, period, now),
    [periodStartKeys, period, now],
  );

  const observedCycleDuration = useMemo(
    () => calculateAverageCycleDuration(filteredPeriodStarts),
    [filteredPeriodStarts],
  );

  // Real earliest-tracked-date anchor — the earliest SOPK journal entry or
  // confirmed period start — so a 12-month Premium view never implies more
  // history exists than what was actually recorded (same convention as
  // Pregnancy/Postpartum/Loss's own dating/delivery/loss anchors).
  const anchorDate = useMemo(() => {
    const dates = [...Object.keys(entriesByDate), ...periodStartKeys];
    if (!dates.length) {return null;}
    return new Date(`${dates.sort()[0]}T12:00:00`);
  }, [entriesByDate, periodStartKeys]);

  const coverageMonths = useMemo(
    () => coverageMonthsForAnchor(period, anchorDate, now),
    [period, anchorDate, now],
  );
  const coverageMessage = useMemo(
    () => describeMonthsCoverage(period, coverageMonths),
    [period, coverageMonths],
  );

  const trackedDays = filteredEntries.length;
  const daysWithAnySymptom = useMemo(() => countDaysWithAnySymptom(filteredEntries), [filteredEntries]);

  const categoryStats = useMemo(
    () =>
      SYMPTOM_CATEGORY_META.map(meta => ({
        ...meta,
        distribution: calculateCategoryDistribution(filteredEntries, meta.key),
        monthlyTrend: calculateMonthlyCategoryTrend(filteredEntries, meta.key),
      })),
    [filteredEntries, SYMPTOM_CATEGORY_META],
  );

  const associatedSymptomFrequency = useMemo(
    () => calculateAssociatedSymptomFrequency(filteredEntries),
    [filteredEntries],
  );

  const weightEntries = useMemo(() => calculateIrregularWeightEntries(filteredEntries), [filteredEntries]);
  const monthlyWeightTrend = useMemo(() => calculateMonthlyIrregularWeightTrend(filteredEntries), [filteredEntries]);
  const hasAnyWeightData = weightEntries.length > 0;

  const showLongitudinalView = period !== '1';
  const monthsLabel = PERIOD_LABELS[period];

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            compact && styles.scrollContentCompact,
            {paddingBottom: getFloatingTabBarClearance(insets.bottom, 120)},
          ]}
          showsVerticalScrollIndicator={false}>
          {/* ==================================================
              HEADER
          =================================================== */}

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AwaText variant="headlineMedium" style={styles.title}>{t('irregularStatistics.header.title')}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.subtitle}>{t('irregularStatistics.header.subtitle')}</AwaText>
            </View>

            <View style={styles.headerIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="chart-timeline-variant-shimmer"
                size={25}
              />
            </View>
          </View>

          {/* ==================================================
              PERIOD SELECTOR — 1 mois (Free), 3/6/12 mois (Premium)
          =================================================== */}

          <View style={styles.filters}>
            {STATISTICS_PERIODS.map(item => {
              const active = period === item;
              const locked = !isPeriodFree(item) && !isPremium;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={item}
                  onPress={() => handleSelectPeriod(item)}
                  style={[styles.filterButton, active && styles.filterButtonActive]}>
                  <View style={styles.filterButtonContent}>
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {PERIOD_LABELS[item]}
                    </Text>

                    {locked ? (
                      <MaterialDesignIcons color={theme.colors.textMuted} name="lock-outline" size={10} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ==================================================
              APERÇU DU CYCLE — durée observée, jamais "retard"
          =================================================== */}

          <View style={styles.sectionHeading}>
            <AwaText variant="titleLarge" style={styles.sectionTitle}>{t('irregularStatistics.cycleOverview.sectionTitle')}</AwaText>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.sectionDescription}>
              {t('irregularStatistics.cycleOverview.summaryOver', {months: monthsLabel})}
            </AwaText>
          </View>

          {observedCycleDuration ? (
            <AwaCard style={styles.cycleHero}>

              <View style={styles.heroTop}>
                <View style={styles.heroMain}>
                  <AwaText variant="labelSmall" colorRole="primary">{t('irregularStatistics.cycleOverview.hero.eyebrow')}</AwaText>

                  <View style={styles.heroCycleRow}>
                    <Text style={styles.heroNumber}>{observedCycleDuration.averageDays}</Text>
                    <View style={styles.heroNumberCopy}>
                      <AwaText variant="titleMedium" style={styles.heroUnit}>{t('irregularStatistics.cycleOverview.hero.unit')}</AwaText>
                    </View>
                  </View>
                </View>

                <View style={styles.periodBadge}>
                  <MaterialDesignIcons color={theme.colors.primary} name="calendar-range" size={18} />
                  <Text style={styles.periodBadgeText}>{monthsLabel}</Text>
                </View>
              </View>

              <View style={styles.heroDivider} />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                {t('irregularStatistics.cycleOverview.hero.footnote', {
                  cycles: t('irregularStatistics.common.cyclesCount', {
                    count: observedCycleDuration.cyclesAnalyzed,
                  }),
                  days: t('irregularStatistics.common.trackedDaysCount', {count: trackedDays}),
                  months: monthsLabel,
                })}
              </AwaText>

              {coverageMessage ? <AwaText variant="labelSmall" colorRole="primary" style={styles.coverageText}>{coverageMessage}</AwaText> : null}
            </AwaCard>
          ) : (
            <AwaCard padding="none" style={styles.emptyCycleCard}>

              <View style={styles.emptyCycleIconRing}>
                <View style={styles.emptyCycleIcon}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="calendar-refresh-outline"
                    size={29}
                  />
                </View>
              </View>

              <AwaText variant="labelSmall" colorRole="primary" style={styles.emptyCycleEyebrow}>{t('irregularStatistics.cycleOverview.empty.eyebrow')}</AwaText>

              <AwaText variant="titleMedium" style={styles.emptyCycleTitle}>
                {t('irregularStatistics.cycleOverview.empty.title')}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.emptyCycleText}>
                {t('irregularStatistics.cycleOverview.empty.text')}
              </AwaText>

              <View style={styles.emptyCyclePill}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="chart-timeline-variant"
                  size={15}
                />
                <AwaText variant="labelSmall" colorRole="primary" style={styles.emptyCyclePillText}>
                  {t('irregularStatistics.cycleOverview.empty.pill')}
                </AwaText>
              </View>

              <View style={styles.emptyCycleHint}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="information-outline"
                  size={14}
                />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.emptyCycleHintText}>
                  {t('irregularStatistics.cycleOverview.empty.hint')}
                </AwaText>
              </View>
            </AwaCard>
          )}

          {/* ==================================================
              SYMPTÔMES — aperçu global, jamais un score
          =================================================== */}

          <AwaCard padding="none" variant="filled" style={styles.card}>
            <SectionHeader
              icon="heart-pulse"
              subtitle={
                showLongitudinalView
                  ? t('irregularStatistics.symptoms.subtitleLongitudinal', {months: monthsLabel})
                  : t('irregularStatistics.symptoms.subtitleMonth')
              }
              title={t('irregularStatistics.symptoms.title')}
            />

            {trackedDays > 0 ? (
              showLongitudinalView ? (
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.overviewText}>
                  {t('irregularStatistics.symptoms.overview', {
                    withSymptom: t('irregularStatistics.common.daysCount', {count: daysWithAnySymptom}),
                    tracked: t('irregularStatistics.common.trackedDaysCount', {count: trackedDays}),
                  })}
                </AwaText>
              ) : (
                <View style={styles.monthSnapshot}>
                  <View style={styles.snapshotMetric}>
                    <View style={styles.snapshotMetricIcon}>
                      <MaterialDesignIcons color={theme.colors.primary} name="calendar-check-outline" size={19} />
                    </View>
                    <AwaText variant="titleLarge" style={styles.snapshotMetricValue}>{trackedDays}</AwaText>
                    <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.snapshotMetricLabel}>
                      {t('irregularStatistics.symptoms.snapshot.trackedLabel')}
                    </AwaText>
                  </View>

                  <View style={styles.snapshotDivider} />

                  <View style={styles.snapshotMetric}>
                    <View style={styles.snapshotMetricIcon}>
                      <MaterialDesignIcons color={theme.colors.primary} name="heart-pulse" size={19} />
                    </View>
                    <AwaText variant="titleLarge" style={styles.snapshotMetricValue}>{daysWithAnySymptom}</AwaText>
                    <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.snapshotMetricLabel}>
                      {t('irregularStatistics.symptoms.snapshot.withObservationLabel')}
                    </AwaText>
                  </View>

                  <View style={styles.snapshotDivider} />

                  <View style={styles.snapshotMetric}>
                    <View style={styles.snapshotMetricIcon}>
                      <MaterialDesignIcons color={theme.colors.primary} name="chart-donut" size={19} />
                    </View>
                    <AwaText variant="titleLarge" style={styles.snapshotMetricValue}>
                      {trackedDays > 0 ? Math.round((daysWithAnySymptom / trackedDays) * 100) : 0}%
                    </AwaText>
                    <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.snapshotMetricLabel}>
                      {t('irregularStatistics.symptoms.snapshot.coverageLabel')}
                    </AwaText>
                  </View>
                </View>
              )
            ) : (
              <DataNotice
                detail={t('irregularStatistics.symptoms.emptyDetail')}
                icon="heart-outline"
                title={t('irregularStatistics.symptoms.emptyTitle')}
              />
            )}
          </AwaCard>

          {/* ==================================================
              ACNÉ / PILOSITÉ / DOULEURS / HUMEUR / FATIGUE
          =================================================== */}

          {categoryStats.map(stat => (
            <CategoryCard
              distribution={stat.distribution}
              icon={stat.icon}
              key={stat.key}
              monthlyTrend={stat.monthlyTrend}
              monthsLabel={monthsLabel}
              namespace={CATEGORY_NAMESPACE[stat.key]}
              showLongitudinalView={showLongitudinalView}
              title={stat.label}
            />
          ))}

          {/* ==================================================
              SYMPTÔMES ASSOCIÉS — fréquence réelle des sélections
              multiples du journal "Fatigue & symptômes"
          =================================================== */}

          {associatedSymptomFrequency.length > 0 ? (
            <AwaCard padding="none" variant="filled" style={styles.card}>
              <SectionHeader
                icon="format-list-checks"
                subtitle={t('irregularStatistics.associated.subtitle')}
                title={t('irregularStatistics.associated.title')}
              />

              <View style={styles.chipRow}>
                {associatedSymptomFrequency.map(item => (
                  <View key={item.name} style={styles.chip}>
                    <AwaText variant="labelSmall" colorRole="onSurfaceVariant">
                      {`${journalOptionLabel('irregularSymptom', item.name, t)} · ${t('irregularStatistics.common.daysCount', {count: item.days})}`}
                    </AwaText>
                  </View>
                ))}
              </View>
            </AwaCard>
          ) : null}

          {/* ==================================================
              POIDS — uniquement si réellement renseigné, jamais d'IMC
          =================================================== */}

          {hasAnyWeightData ? (
            <AwaCard padding="none" variant="filled" style={styles.card}>
              <SectionHeader
                icon="scale-bathroom"
                subtitle={
                  showLongitudinalView
                    ? t('irregularStatistics.weight.subtitleLongitudinal', {months: monthsLabel})
                    : t('irregularStatistics.weight.subtitleMonth')
                }
                title={t('irregularStatistics.weight.title')}
              />

              {showLongitudinalView ? (
                <View style={styles.monthList}>
                  {monthlyWeightTrend.map(month => (
                    <View key={month.monthKey} style={styles.monthItem}>
                      <View style={styles.monthTop}>
                        <AwaText variant="labelSmall" style={styles.monthLabel}>{month.monthLabel}</AwaText>
                        <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                          {t('irregularStatistics.weight.measurementsCount', {count: month.entries.length})}
                        </AwaText>
                      </View>

                      <View style={styles.chipRow}>
                        {month.entries.slice(-4).map(entry => (
                          <View key={entry.date} style={styles.chip}>
                            <AwaText variant="labelSmall" colorRole="onSurfaceVariant">{entry.value}</AwaText>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.weightMonthPanel}>
                  <View style={styles.weightMonthTop}>
                    <View>
                      <AwaText variant="labelSmall" colorRole="primary">{t('irregularStatistics.common.thisMonth')}</AwaText>
                      <Text style={styles.weightMonthCount}>{weightEntries.length}</Text>
                      <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.weightMonthLabel}>
                        {t('irregularStatistics.weight.recordedLabel', {count: weightEntries.length})}
                      </AwaText>
                    </View>

                    <View style={styles.weightMonthIcon}>
                      <MaterialDesignIcons color={theme.colors.primary} name="scale-bathroom" size={24} />
                    </View>
                  </View>

                  <View style={styles.weightTimeline}>
                    {weightEntries.slice(-6).map((entry, index) => (
                      <View key={entry.date} style={styles.weightTimelineItem}>
                        <View style={styles.weightTimelineDot} />
                        {index < weightEntries.slice(-6).length - 1 ? (
                          <View style={styles.weightTimelineLine} />
                        ) : null}
                        <View style={styles.weightTimelineCopy}>
                          <AwaText variant="labelSmall" style={styles.weightTimelineValue}>{entry.value}</AwaText>
                          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.weightTimelineDate}>{entry.date}</AwaText>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </AwaCard>
          ) : null}

          {/* ==================================================
              REPÈRE POUR UN RENDEZ-VOUS MÉDICAL
          =================================================== */}

          <View style={styles.medicalHint}>
            <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={17} />
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.medicalHintText}>
              {t('irregularStatistics.medicalHint')}
            </AwaText>
          </View>
        </ScrollView>
      </SafeAreaView>

      <HawaPremiumBottomSheet onClose={() => setPremiumVisible(false)} visible={premiumVisible} />
    </LinearGradient>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },





  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  scrollContentCompact: {
    paddingHorizontal: 11,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
  },

  title: {color: theme.colors.accent},

  subtitle: {maxWidth: 300, marginTop: 3},

  headerIcon: {
    ...theme.shadow,
    width: 49,
    height: 49,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.08),
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },

  filters: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.05),
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  filterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: 12,
  },

  filterButtonActive: {
    ...theme.shadow,
    backgroundColor: theme.colors.surface,
  },

  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  filterText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  filterTextActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },

  sectionHeading: {
    marginTop: 6,
    marginBottom: 10,
  },

  sectionTitle: {color: theme.colors.accent},

  sectionDescription: {marginTop: 2},

  cycleHero: {
    overflow: 'hidden',
  },



  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroMain: {
    flex: 1,
    minWidth: 0,
  },


  heroCycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  heroNumber: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 48,
    lineHeight: 53,
    fontWeight: '800',
  },

  heroNumberCopy: {
    marginLeft: 9,
  },

  heroUnit: {color: theme.colors.accent},

  periodBadge: {
    maxWidth: 105,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.08),
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },

  periodBadgeText: {
    marginTop: 4,
    color: theme.colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  heroDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.14),
  },


  coverageText: {marginTop: 8},

  overviewText: {marginTop: 10},

  notice: {flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16},

  noticeIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  noticeCopy: {
    flex: 1,
    minWidth: 0,
  },

  noticeTitle: {color: theme.colors.accent},

  noticeDetail: {marginTop: 3},

  card: {marginTop: 14, padding: 16},

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {color: theme.colors.accent},

  cardSubtitle: {marginTop: 2},

  monthList: {
    marginTop: 14,
  },

  monthListTitle: {marginBottom: 6, color: theme.colors.accent},

  monthItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },

  monthTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  monthLabel: {color: theme.colors.accent},


  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },


  emptyCycleCard: {
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
  },



  emptyCycleIconRing: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.11),
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.surface, 0.68),
  },

  emptyCycleIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  emptyCycleEyebrow: {textAlign: 'center'},

  emptyCycleTitle: {maxWidth: 300, marginTop: 6, color: theme.colors.accent, textAlign: 'center'},

  emptyCycleText: {maxWidth: 305, marginTop: 8, textAlign: 'center'},

  emptyCyclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  emptyCyclePillText: {textAlign: 'center'},

  emptyCycleHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    width: '100%',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.78),
  },

  emptyCycleHintText: {flex: 1},

  monthSnapshot: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  snapshotMetric: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 4,
  },

  snapshotMetricIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  snapshotMetricValue: {color: theme.colors.accent},

  snapshotMetricLabel: {marginTop: 3, textAlign: 'center'},

  snapshotDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 6,
    backgroundColor: withAlpha(theme.colors.primary, 0.14),
  },

  monthVisualization: {
    marginTop: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  monthVisualizationTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },


  monthVisualizationNumber: {
    marginTop: 2,
    color: theme.colors.accent,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },

  monthVisualizationUnit: {marginTop: 1},

  monthVisualizationIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },

  distributionList: {
    gap: 11,
  },

  distributionItem: {
    gap: 6,
  },

  distributionItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  distributionLabel: {flex: 1, color: theme.colors.accent},


  distributionTrack: {
    overflow: 'hidden',
    height: 7,
    borderRadius: 99,
    backgroundColor: theme.colors.primarySoft,
  },

  distributionFill: {
    height: '100%',
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },

  weightMonthPanel: {
    marginTop: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  weightMonthTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  weightMonthCount: {
    marginTop: 2,
    color: theme.colors.accent,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },

  weightMonthLabel: {marginTop: 1},

  weightMonthIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },

  weightTimeline: {
    marginTop: 2,
  },

  weightTimelineItem: {
    position: 'relative',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  weightTimelineDot: {
    zIndex: 2,
    width: 11,
    height: 11,
    marginTop: 4,
    marginRight: 11,
    borderWidth: 3,
    borderColor: theme.colors.primarySoft,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },

  weightTimelineLine: {
    position: 'absolute',
    left: 5,
    top: 15,
    bottom: -3,
    width: 1,
    backgroundColor: theme.colors.primarySoft,
  },

  weightTimelineCopy: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 10,
  },

  weightTimelineValue: {color: theme.colors.accent},

  weightTimelineDate: {marginTop: 2},

  medicalHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: withAlpha(theme.colors.surface, 0.6),
  },

  medicalHintText: {flex: 1},
  });
}

export default IrregularStatisticsScreen;