import React, {useCallback, useMemo, useState, useEffect} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {getFloatingTabBarClearance, TOP_SPACING_EXTRA} from '../theme/spacing';
import {usePremium} from '../hooks/usePremium';
import StatisticsPeriodSelector from '../components/statistics/StatisticsPeriodSelector';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaText} from '../components/ui/AwaText';
import {useToday} from '../hooks/useToday';
import {HawaPremiumBottomSheet} from '../components/premium/HawaPremiumBottomSheet';
import {getAllJournalEntries} from '../state/dailyJournalStore';
import {getRecordedPeriodHistory, hydrateCyclePreferences} from '../state/onboardingPreferences';
import {getActiveProfileId, subscribeActiveProfileId} from '../state/activeProfileStore';
import {isActiveProfileDataUnavailable, useStructuredDataAvailability} from '../hooks/useStructuredDataAvailability';
import type {DailyJournalEntry, FlowIntensity} from '../types/journal';
import {
  getConfirmedPeriodHistory,
  hydrateConfirmedPeriodHistory,
  subscribeConfirmedPeriodHistory,
} from '../state/confirmedPeriodHistoryStore';
import type {ConfirmedPeriodOccurrence} from '../state/confirmedPeriodHistoryStore';
import {
  isPeriodFree,
  filterEntriesForPeriod,
  filterPeriodStartsForPeriod,
  calculateAverageCycleDuration,
  calculateAveragePeriodDuration,
  calculateCycleLengthRange,
  calculateMoodDistribution,
  countRecordedStartsForPeriod,
  describeMissingAverageCycleData,
  calculateFlowDistribution,
  calculateSymptomFrequency,
  calculateMonthlyFlowTrend,
  calculateMonthlySymptomTrend,
  countTrackedDays,
} from '../utils/cycleStatisticsMath';
import type {StatisticsPeriod} from '../utils/cycleStatisticsMath';
import {journalOptionLabel} from '../utils/journalOptionLabels';
import '../i18n';

/* ============================================================
   TYPES
============================================================ */

type Props = MainTabScreenProps<'Statistics'>;

type StatisticsData = {
  /** null = not loaded for the active profile yet. */
  profileId: string | null;
  entries: DailyJournalEntry[];
  history: ConfirmedPeriodOccurrence[];
  recordedStarts: {startDate: string}[];
  /** The records could not be READ (not "there are none"): the screen says so instead of showing an empty history. */
  failed: boolean;
};

const EMPTY_DATA: StatisticsData = {profileId: null, entries: [], history: [], recordedStarts: [], failed: false};

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

// FLOW_LABELS here are pure DISPLAY text (unlike the same-shaped map in
// JournalSymptomsScreen.tsx's sibling screens) — Statistics is read-only, it
// never persists anything, so these are safe to translate.
function periodLabels(t: (key: string, options?: Record<string, unknown>) => string): Record<StatisticsPeriod, string> {
  return {
    '1': t('statistics.periods.months', {count: 1}),
    '3': t('statistics.periods.months', {count: 3}),
    '6': t('statistics.periods.months', {count: 6}),
    '12': t('statistics.periods.months', {count: 12}),
  };
}

function flowLabels(t: (key: string) => string): Record<FlowIntensity, string> {
  return {
    light: t('statistics.flowLabels.light'),
    moderate: t('statistics.flowLabels.moderate'),
    heavy: t('statistics.flowLabels.heavy'),
    veryHeavy: t('statistics.flowLabels.veryHeavy'),
    none: t('statistics.flowLabels.none'),
  };
}

const FLOW_ICONS: Record<FlowIntensity, IconName> = {
  light: 'water-outline',
  moderate: 'water',
  heavy: 'water-plus-outline',
  veryHeavy: 'water-plus',
  none: 'water-off-outline',
};

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
      <MaterialDesignIcons color={theme.colors.primary} name={icon} size={22} style={styles.sectionIcon} />

      <View style={styles.sectionHeaderCopy}>
        <AwaText variant="titleMedium">{title}</AwaText>

        {subtitle ? <AwaText colorRole="onSurfaceVariant" style={styles.cardSubtitle} variant="bodySmall">{subtitle}</AwaText> : null}
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
    <AwaCard style={styles.notice} variant="filled">
      <MaterialDesignIcons color={theme.colors.primary} name={icon} size={22} />

      <View style={styles.noticeCopy}>
        <AwaText variant="titleSmall">{title}</AwaText>
        <AwaText colorRole="onSurfaceVariant" style={styles.noticeDetail} variant="bodySmall">{detail}</AwaText>
      </View>
    </AwaCard>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

function StatisticsScreen(_props: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const {width} = useWindowDimensions();
  const compact = width < 370;

  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {isPremium} = usePremium();
  const [premiumVisible, setPremiumVisible] = useState(false);

  const [period, setPeriod] = useState<StatisticsPeriod>('1');
  // Everything shown below belongs to ONE profile (`profileId`). Switching profile drops it at once
  // (profileId -> null = loading) so the previous profile's numbers can never flash, and a load that
  // finishes after a newer switch is discarded.
  const [data, setData] = useState<StatisticsData>(EMPTY_DATA);
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
      let latestLoad = 0;

      setNow(new Date());

      const load = () => {
        const profileId = getActiveProfileId();
        latestLoad += 1;
        const thisLoad = latestLoad;
        setData(current => (current.profileId === profileId ? current : EMPTY_DATA));
        Promise.all([getAllJournalEntries(), hydrateConfirmedPeriodHistory(), hydrateCyclePreferences()])
          .then(([entries, history]) => {
            if (!active || thisLoad !== latestLoad || getActiveProfileId() !== profileId) {return;}
            setData({profileId, entries, history, recordedStarts: getRecordedPeriodHistory(), failed: false});
          })
          .catch(() => {
            if (!active || thisLoad !== latestLoad || getActiveProfileId() !== profileId) {return;}
            setData({...EMPTY_DATA, profileId, failed: true});
          });
      };
      load();

      const unsubscribeHistory = subscribeConfirmedPeriodHistory(() => {
        setData(current =>
          current.profileId !== null && current.profileId === getActiveProfileId()
            ? {...current, history: getConfirmedPeriodHistory()}
            : current,
        );
      });
      const unsubscribeProfile = subscribeActiveProfileId(load);

      return () => {
        active = false;
        unsubscribeHistory();
        unsubscribeProfile();
      };
    }, []),
  );

  const journalEntries = data.entries;
  const periodHistory = data.history;
  const loading = data.profileId === null;
  // Records that could not be READ are not an empty history: say so instead of showing "no statistics yet".
  const availability = useStructuredDataAvailability();
  const statsUnavailable = data.failed || availability.anyUnavailable && isActiveProfileDataUnavailable(['@hawa/daily-journal/v1', '@hawa/confirmed-period-history', '@hawa/cycle-preferences']);
  const hasAnyData = data.entries.length > 0 || data.history.length > 0 || data.recordedStarts.length > 0;

  const handleSelectPeriod = (target: StatisticsPeriod): void => {
    if (!isPeriodFree(target) && !isPremium) {
      setPremiumVisible(true);
      return;
    }
    setPeriod(target);
  };

  const filteredEntries = useMemo(
    () => filterEntriesForPeriod(journalEntries, period, now),
    [journalEntries, period, now],
  );

  const filteredPeriodStarts = useMemo(
    () => filterPeriodStartsForPeriod(periodHistory, period, now),
    [periodHistory, period, now],
  );

  const averageCycleDuration = useMemo(
    () => calculateAverageCycleDuration(filteredPeriodStarts),
    [filteredPeriodStarts],
  );

  // Only used to word the empty state (see describeMissingAverageCycleData) —
  // the average above stays strictly on confirmed history.
  const missingAverageDetail = describeMissingAverageCycleData(
    filteredPeriodStarts.length,
    countRecordedStartsForPeriod(data.recordedStarts, period, now),
  );

  const flowDistribution = useMemo(() => calculateFlowDistribution(filteredEntries), [filteredEntries]);
  const symptomFrequency = useMemo(() => calculateSymptomFrequency(filteredEntries), [filteredEntries]);
  const monthlyFlowTrend = useMemo(() => calculateMonthlyFlowTrend(filteredEntries), [filteredEntries]);
  const monthlySymptomTrend = useMemo(() => calculateMonthlySymptomTrend(filteredEntries), [filteredEntries]);
  const trackedDays = useMemo(() => countTrackedDays(filteredEntries), [filteredEntries]);
  const cycleLengthRange = useMemo(() => calculateCycleLengthRange(filteredPeriodStarts), [filteredPeriodStarts]);
  const averagePeriodDuration = useMemo(
    () => calculateAveragePeriodDuration(periodHistory, period, now),
    [periodHistory, period, now],
  );
  const moodDistribution = useMemo(() => calculateMoodDistribution(filteredEntries), [filteredEntries]);
  const maxMoodDays = Math.max(...moodDistribution.map(item => item.days), 1);

  const showLongitudinalView = period !== '1';
  const maxFlowDays = Math.max(...flowDistribution.map(item => item.days), 1);
  const maxSymptomDays = Math.max(...symptomFrequency.map(item => item.days), 1);
  const periodLabelsMap = periodLabels(t);
  const flowLabelsMap = flowLabels(t);
  const monthsLabel = periodLabelsMap[period];

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
              <AwaText variant="headlineMedium">{t('navigation.statistics')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">{t('statistics.headerSubtitle')}</AwaText>
            </View>
          </View>

          {loading ? (
            <View accessibilityLabel={t('statistics.loading')} accessibilityRole="progressbar" style={styles.loadingBlock} />
          ) : (
          <>
          {/* ==================================================
              PERIOD SELECTOR — 1 mois (Free), 3/6/12 mois (Premium)
          =================================================== */}

          <StatisticsPeriodSelector
            isPremium={isPremium}
            onRequestPremium={() => setPremiumVisible(true)}
            onSelectPeriod={handleSelectPeriod}
            period={period}
          />

          {statsUnavailable ? (
            <DataNotice
              detail={t('statistics.unavailableDetail')}
              icon="lock-alert-outline"
              title={t('statistics.unavailableTitle')}
            />
          ) : !hasAnyData ? (
            <DataNotice
              detail={t('statistics.emptyAllDetail')}
              icon="chart-line"
              title={t('statistics.emptyAllTitle')}
            />
          ) : (
          <>
          {/* ==================================================
              APERÇU DU CYCLE — durée moyenne + cycles analysés
          =================================================== */}

          <View style={styles.sectionHeading}>
            <AwaText variant="titleLarge">{t('statistics.cycleOverviewTitle')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.sectionDescription} variant="bodySmall">{t('statistics.summaryOver', {period: monthsLabel})}</AwaText>
          </View>

          {averageCycleDuration ? (
            <AwaCard
              accessible
              accessibilityLabel={t('statistics.averageCycleDurationAccessibility', {
                days: averageCycleDuration.averageDays,
                cyclesAnalyzed: t('statistics.cyclesAnalyzed', {count: averageCycleDuration.cyclesAnalyzed}),
                trackedDays: t('statistics.daysLogged', {count: trackedDays}),
                period: monthsLabel,
              })}
              accessibilityRole="summary"
              style={styles.cycleHero}>

              <View style={styles.heroTop}>
                <View style={styles.heroMain}>
                  <AwaText colorRole="onSurfaceVariant" variant="labelMedium">{t('statistics.averageCycleDurationEyebrow')}</AwaText>

                  <View style={styles.heroCycleRow}>
                    <AwaText color={theme.colors.accent} variant="displaySmall">{averageCycleDuration.averageDays}</AwaText>

                    <View style={styles.heroNumberCopy}>
                      <AwaText color={theme.colors.accent} variant="titleMedium">{t('statistics.days')}</AwaText>
                    </View>
                  </View>
                </View>

                <View style={styles.periodBadge}>
                  <MaterialDesignIcons color={theme.colors.primary} name="calendar-range" size={18} />
                  <AwaText colorRole="primary" emphasized style={styles.periodBadgeText} variant="labelMedium">{monthsLabel}</AwaText>
                </View>
              </View>

              <View style={styles.heroDivider} />

              <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                {t('statistics.basedOnCyclesAndDays', {
                  cyclesAnalyzed: t('statistics.cyclesAnalyzed', {count: averageCycleDuration.cyclesAnalyzed}),
                  trackedDays: t('statistics.daysLogged', {count: trackedDays}),
                  period: monthsLabel,
                })}
              </AwaText>
            </AwaCard>
          ) : (
            <DataNotice
              detail={missingAverageDetail}
              icon="calendar-clock-outline"
              title={t('statistics.notEnoughCyclesTitle')}
            />
          )}

          <AwaCard style={styles.card}>
            <SectionHeader
              icon="calendar-multiselect"
              subtitle={t('statistics.cycleDetailsSubtitle')}
              title={t('statistics.cycleDetailsTitle')}
            />
            {cycleLengthRange ? (
              <View style={styles.chipRow}>
                <View style={styles.chip}>
                  <AwaText colorRole="onSurfaceVariant" emphasized variant="labelMedium">{t('statistics.shortestCycle', {count: cycleLengthRange.shortestDays})}</AwaText>
                </View>
                <View style={styles.chip}>
                  <AwaText colorRole="onSurfaceVariant" emphasized variant="labelMedium">{t('statistics.longestCycle', {count: cycleLengthRange.longestDays})}</AwaText>
                </View>
              </View>
            ) : (
              <DataNotice
                detail={missingAverageDetail}
                icon="calendar-clock-outline"
                title={t('statistics.notEnoughCyclesTitle')}
              />
            )}
            {averagePeriodDuration ? (
              <View style={styles.chipRow}>
                <View style={styles.chip}>
                  <AwaText colorRole="onSurfaceVariant" emphasized variant="labelMedium">
                    {t('statistics.averagePeriodDuration', {count: averagePeriodDuration.averageDays})}
                  </AwaText>
                </View>
              </View>
            ) : (
              <DataNotice
                detail={t('statistics.periodDurationNeedsEnd')}
                icon="calendar-end"
                title={t('statistics.periodDurationUnavailableTitle')}
              />
            )}
          </AwaCard>

          {/* ==================================================
              ÉVOLUTION DU FLUX
          =================================================== */}

          <AwaCard style={styles.card}>
            <SectionHeader
              icon="water-outline"
              subtitle={
                showLongitudinalView
                  ? t('statistics.monthByMonthOver', {period: monthsLabel})
                  : t('statistics.recordedIntensityBreakdown')
              }
              title={t('statistics.flowEvolutionTitle')}
            />

            {showLongitudinalView ? (
              monthlyFlowTrend.length > 0 ? (
                <View style={styles.monthList}>
                  {monthlyFlowTrend.map(month => (
                    <View
                      accessible
                      accessibilityLabel={t('statistics.monthFlowAccessibility', {
                        month: month.monthLabel,
                        daysWithFlow: t('statistics.daysWithFlow', {count: month.daysWithFlow}),
                        distribution: month.distribution.map(entry => t('statistics.flowLabelDays', {label: flowLabelsMap[entry.intensity], count: entry.days})).join(', '),
                      })}
                      key={month.monthKey}
                      style={styles.monthItem}>
                      <View style={styles.monthTop}>
                        <AwaText color={theme.colors.accent} emphasized variant="labelLarge">{month.monthLabel}</AwaText>
                        <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                          {t('statistics.daysWithFlow', {count: month.daysWithFlow})}
                        </AwaText>
                      </View>

                      <View style={styles.chipRow}>
                        {month.distribution.map(entry => (
                          <View key={entry.intensity} style={styles.chip}>
                            <AwaText colorRole="onSurfaceVariant" emphasized variant="labelMedium">
                              {flowLabelsMap[entry.intensity]} · {t('statistics.daysAbbreviated', {count: entry.days})}
                            </AwaText>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <DataNotice
                  detail={t('statistics.noFlowThisPeriod')}
                  icon="water-off-outline"
                  title={t('statistics.noFlowDataYetTitle')}
                />
              )
            ) : flowDistribution.length > 0 ? (
              <View style={styles.flowList}>
                {flowDistribution.map(item => {
                  const percentage = (item.days / maxFlowDays) * 100;

                  return (
                    <View
                      accessible
                      accessibilityLabel={t('statistics.flowLabelDaysColon', {label: flowLabelsMap[item.intensity], count: item.days})}
                      key={item.intensity}
                      style={styles.flowItem}>
                      <View style={styles.flowTop}>
                        <View style={styles.flowIcon}>
                          <MaterialDesignIcons
                            color={theme.colors.primary}
                            name={FLOW_ICONS[item.intensity]}
                            size={18}
                          />
                        </View>

                        <AwaText color={theme.colors.accent} style={styles.flowLabel} variant="labelLarge">{flowLabelsMap[item.intensity]}</AwaText>

                        <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                          {t('statistics.daysPlural', {count: item.days})}
                        </AwaText>
                      </View>

                      <View style={styles.flowTrack}>
                        <View style={[styles.flowFill, {width: `${Math.max(8, percentage)}%`}]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <DataNotice
                detail={t('statistics.logFlowToSeeStatistic')}
                icon="water-off-outline"
                title={t('statistics.noFlowThisMonthTitle')}
              />
            )}
          </AwaCard>

          {/* ==================================================
              SYMPTÔMES LES PLUS FRÉQUENTS
          =================================================== */}

          <AwaCard style={styles.card}>
            <SectionHeader
              icon="heart-pulse"
              subtitle={
                showLongitudinalView
                  ? t('statistics.frequencyAndEvolutionOver', {period: monthsLabel})
                  : t('statistics.mostRecordedSymptoms')
              }
              title={t('statistics.mostFrequentSymptomsTitle')}
            />

            {symptomFrequency.length > 0 ? (
              <View style={styles.symptomList}>
                {symptomFrequency.slice(0, 6).map((item, index, array) => {
                  const percentage = (item.days / maxSymptomDays) * 100;

                  return (
                    <View
                      accessible
                      accessibilityLabel={t('statistics.rankedSymptomAccessibility', {rank: index + 1, name: journalOptionLabel('cycleSymptom', item.name, t), days: t('statistics.daysPlural', {count: item.days})})}
                      key={item.name}
                      style={[styles.symptomItem, index === array.length - 1 && styles.lastItem]}>
                      <View style={styles.symptomTop}>
                        <View style={styles.rank}>
                          <AwaText colorRole="primary" emphasized variant="labelMedium">{index + 1}</AwaText>
                        </View>

                        <AwaText color={theme.colors.accent} style={styles.symptomName} variant="labelLarge">{journalOptionLabel('cycleSymptom', item.name, t)}</AwaText>

                        <View style={styles.symptomBadge}>
                          <AwaText colorRole="onSurfaceVariant" emphasized variant="labelSmall">
                            {t('statistics.daysPlural', {count: item.days})}
                          </AwaText>
                        </View>
                      </View>

                      <View style={styles.symptomTrack}>
                        <View style={[styles.symptomFill, {width: `${Math.max(10, percentage)}%`}]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <DataNotice
                detail={t('statistics.logSymptomsToSeeStatistic')}
                icon="heart-outline"
                title={showLongitudinalView ? t('statistics.noSymptomsThisPeriodTitle') : t('statistics.noSymptomsThisMonthTitle')}
              />
            )}

            {showLongitudinalView && monthlySymptomTrend.length > 0 ? (
              <View style={styles.monthList}>
                <AwaText color={theme.colors.accent} emphasized style={styles.monthListTitle} variant="labelLarge">{t('statistics.monthByMonthEvolution')}</AwaText>

                {monthlySymptomTrend.map(month => (
                  <View
                    accessible
                    accessibilityLabel={t('statistics.monthSymptomAccessibility', {
                      month: month.monthLabel,
                      symptoms: month.topSymptoms.map(symptom => t('statistics.symptomDays', {name: journalOptionLabel('cycleSymptom', symptom.name, t), days: t('statistics.daysPlural', {count: symptom.days})})).join(', '),
                    })}
                    key={month.monthKey}
                    style={styles.monthItem}>
                    <View style={styles.monthTop}>
                      <AwaText color={theme.colors.accent} emphasized variant="labelLarge">{month.monthLabel}</AwaText>
                    </View>

                    <View style={styles.chipRow}>
                      {month.topSymptoms.map(symptom => (
                        <View key={symptom.name} style={styles.chip}>
                          <AwaText colorRole="onSurfaceVariant" emphasized variant="labelMedium">
                            {journalOptionLabel('cycleSymptom', symptom.name, t)} · {t('statistics.daysAbbreviated', {count: symptom.days})}
                          </AwaText>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </AwaCard>

          <AwaCard style={styles.card}>
            <SectionHeader
              icon="emoticon-outline"
              subtitle={t('statistics.moodSubtitle')}
              title={t('statistics.moodTitle')}
            />
            {moodDistribution.length > 0 ? (
              <View style={styles.symptomList}>
                {moodDistribution.map((item, index, array) => (
                  <View
                    accessible
                    accessibilityLabel={t('statistics.flowLabelDaysColon', {label: t(`statistics.moodLabels.${item.level}`), count: item.days})}
                    key={item.level}
                    style={[styles.symptomItem, index === array.length - 1 && styles.lastItem]}>
                    <View style={styles.symptomTop}>
                      <AwaText color={theme.colors.accent} style={styles.symptomName} variant="labelLarge">{t(`statistics.moodLabels.${item.level}`)}</AwaText>
                      <View style={styles.symptomBadge}>
                        <AwaText colorRole="onSurfaceVariant" emphasized variant="labelSmall">{t('statistics.daysPlural', {count: item.days})}</AwaText>
                      </View>
                    </View>
                    <View style={styles.symptomTrack}>
                      <View style={[styles.symptomFill, {width: `${Math.max(10, (item.days / maxMoodDays) * 100)}%`}]} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <DataNotice detail={t('statistics.moodEmptyDetail')} icon="emoticon-neutral-outline" title={t('statistics.moodEmptyTitle')} />
            )}
          </AwaCard>

          {/* ==================================================
              REPÈRE POUR UN RENDEZ-VOUS MÉDICAL
          =================================================== */}

          <View style={styles.medicalHint}>
            <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={17} />

            <AwaText colorRole="onSurfaceVariant" style={styles.medicalHintText} variant="bodySmall">
              {t('statistics.medicalHint')}
            </AwaText>
          </View>
          </>
          )}
          </>
          )}
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
    // Same shared breathing-room constant CalendarScreen.tsx uses above its
    // own SafeAreaView(top)-reserved inset — was a flat 8, sitting visibly
    // closer to the top than Calendar's 32.
    paddingTop: TOP_SPACING_EXTRA,
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

  subtitle: {
    maxWidth: 300,
    marginTop: 4,
  },

  loadingBlock: {
    minHeight: 160,
  },

  sectionHeading: {
    marginTop: 6,
    marginBottom: 10,
  },

  sectionDescription: {
    marginTop: 2,
  },

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

  heroNumberCopy: {
    marginLeft: 8,
  },

  periodBadge: {
    maxWidth: 105,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },

  periodBadgeText: {
    marginTop: 4,
    textAlign: 'center',
  },

  heroDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
    backgroundColor: theme.colors.border,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  noticeCopy: {
    flex: 1,
    minWidth: 0,
  },

  noticeDetail: {
    marginTop: 4,
  },

  card: {
    marginTop: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionIcon: {
    flexShrink: 0,
    marginRight: 12,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  cardSubtitle: {
    marginTop: 2,
  },

  flowList: {
    marginTop: 13,
  },

  flowItem: {
    marginBottom: 14,
  },

  flowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  flowIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  flowLabel: {
    flex: 1,
    marginLeft: 9,
  },

  flowTrack: {
    height: 6,
    overflow: 'hidden',
    marginTop: 7,
    marginLeft: 41,
    borderRadius: 3,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  // Category A generic decorative fill — every flow intensity uses this
  // exact same color (see FLOW_ICONS above: intensities are told apart by
  // icon shape/label, never by color), so it carries no category/series
  // meaning of its own. Left as a fixed literal rather than theme.colors.*
  // so it keeps reading as a distinct, softer tone from the solid brand
  // purple used for icons/active states elsewhere on this same card.
  flowFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#9A7ADD',
  },

  symptomList: {
    marginTop: 10,
  },

  symptomItem: {
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },

  symptomTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rank: {
    width: 29,
    height: 29,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  symptomName: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 9,
  },

  symptomBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  symptomTrack: {
    height: 5,
    overflow: 'hidden',
    marginTop: 7,
    marginLeft: 38,
    borderRadius: 3,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  // Same intentionally-fixed generic fill as flowFill above (see its
  // comment) — every symptom row shares this one color regardless of which
  // symptom it is.
  symptomFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#9A7ADD',
  },

  lastItem: {
    borderBottomWidth: 0,
  },

  monthList: {
    marginTop: 14,
  },

  monthListTitle: {
    marginBottom: 6,
  },

  monthItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },

  monthTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },

  chip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  medicalHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: withAlpha(theme.colors.surface, 0.6),
  },

  medicalHintText: {
    flex: 1,
  },
  });
}

export default StatisticsScreen;
