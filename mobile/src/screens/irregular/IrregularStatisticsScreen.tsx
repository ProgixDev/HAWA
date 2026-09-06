import React, {useCallback, useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {getFloatingTabBarClearance} from '../../theme/spacing';
import {usePremium} from '../../hooks/usePremium';
import {HawaPremiumBottomSheet} from '../../components/premium/HawaPremiumBottomSheet';
import {
  getAllIrregularJournalEntries,
  hydrateIrregularJournal,
  subscribeIrregularJournal,
  type IrregularJournalCategory,
  type IrregularJournalEntry,
} from '../../state/irregularJournalStore';
import {
  getConfirmedPeriodHistory,
  hydrateConfirmedPeriodHistory,
  subscribeConfirmedPeriodHistory,
} from '../../state/confirmedPeriodHistoryStore';
import type {ConfirmedPeriodOccurrence} from '../../state/confirmedPeriodHistoryStore';
import {
  STATISTICS_PERIODS,
  isPeriodFree,
  filterEntriesForPeriod,
  filterPeriodStartsForPeriod,
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

/* ============================================================
   TYPES
============================================================ */

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const PERIOD_LABELS: Record<StatisticsPeriod, string> = {
  '1': '1 mois',
  '3': '3 mois',
  '6': '6 mois',
  '12': '12 mois',
};

// Same convention as IrregularCalendarContent.tsx's CATEGORY_LABEL/ICON —
// deliberately excludes 'weight' (rendered as its own dedicated POIDS
// section below, since a measurement list reads better than a value
// distribution) and 'period'/"Règles" (that belongs to the shared Cycle
// Statistics data model, not SOPK's own store).
const SYMPTOM_CATEGORY_META: Array<{key: IrregularJournalCategory; label: string; icon: IconName}> = [
  {key: 'acne', label: 'Acné', icon: 'face-woman-outline'},
  {key: 'hairGrowth', label: 'Pilosité', icon: 'human'},
  {key: 'pain', label: 'Douleurs', icon: 'lightning-bolt-outline'},
  {key: 'mood', label: 'Humeur', icon: 'emoticon-outline'},
  {key: 'fatigue', label: 'Fatigue & symptômes', icon: 'battery-medium'},
];

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
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
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
    <View style={styles.notice}>
      <View style={styles.noticeIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={20} />
      </View>

      <View style={styles.noticeCopy}>
        <Text style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.noticeDetail}>{detail}</Text>
      </View>
    </View>
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
}: {
  icon: IconName;
  title: string;
  distribution: CategoryDistributionEntry[];
  monthlyTrend: MonthlyCategoryTrendEntry[];
  showLongitudinalView: boolean;
  monthsLabel: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const totalRecordedDays = distribution.reduce((sum, item) => sum + item.days, 0);
  const maxDays = Math.max(1, ...distribution.map(item => item.days));

  return (
    <View style={styles.card}>
      <SectionHeader
        icon={icon}
        subtitle={
          showLongitudinalView
            ? `Répartition par mois sur ${monthsLabel}`
            : 'Visualisation de ce mois'
        }
        title={title}
      />

      {distribution.length > 0 ? (
        <>
          {!showLongitudinalView ? (
            <View style={styles.monthVisualization}>
              <View style={styles.monthVisualizationTop}>
                <View>
                  <Text style={styles.monthVisualizationEyebrow}>CE MOIS</Text>
                  <Text style={styles.monthVisualizationNumber}>{totalRecordedDays}</Text>
                  <Text style={styles.monthVisualizationUnit}>
                    {totalRecordedDays > 1 ? 'jours renseignés' : 'jour renseigné'}
                  </Text>
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
                        <Text numberOfLines={1} style={styles.distributionLabel}>
                          {item.value}
                        </Text>
                        <Text style={styles.distributionValue}>
                          {item.days} {item.days > 1 ? 'jours' : 'jour'}
                        </Text>
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
                  <Text style={styles.chipText}>
                    {item.value} · {item.days} {item.days > 1 ? 'jours' : 'jour'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <DataNotice
          detail="Renseigne cette observation dans le Journal quotidien pour voir apparaître cette statistique."
          icon="calendar-blank-outline"
          title="Aucune donnée enregistrée ce mois-ci"
        />
      )}

      {showLongitudinalView && monthlyTrend.length > 0 ? (
        <View style={styles.monthList}>
          <Text style={styles.monthListTitle}>Évolution par mois</Text>

          {monthlyTrend.map(month => (
            <View key={month.monthKey} style={styles.monthItem}>
              <View style={styles.monthTop}>
                <Text style={styles.monthLabel}>{month.monthLabel}</Text>
              </View>

              <View style={styles.chipRow}>
                {month.distribution.map(item => (
                  <View key={item.value} style={styles.chip}>
                    <Text style={styles.chipText}>
                      {item.value} · {item.days} j
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

function IrregularStatisticsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const compact = width < 370;

  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {isPremium} = usePremium();
  const [premiumVisible, setPremiumVisible] = useState(false);

  const [period, setPeriod] = useState<StatisticsPeriod>('1');
  const [entriesByDate, setEntriesByDate] = useState<Record<string, IrregularJournalEntry>>(
    getAllIrregularJournalEntries,
  );
  const [periodHistory, setPeriodHistory] = useState<ConfirmedPeriodOccurrence[]>(
    () => getConfirmedPeriodHistory(),
  );
  const [now, setNow] = useState<Date>(() => new Date());

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

      hydrateConfirmedPeriodHistory().then(history => {
        if (active) {setPeriodHistory(history);}
      });
      const unsubscribeHistory = subscribeConfirmedPeriodHistory(() => {
        setPeriodHistory(getConfirmedPeriodHistory());
      });

      return () => {
        active = false;
        unsubscribeIrregular();
        unsubscribeHistory();
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

  const filteredPeriodStarts = useMemo(
    () => filterPeriodStartsForPeriod(periodHistory, period, now),
    [periodHistory, period, now],
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
    const dates = [
      ...Object.keys(entriesByDate),
      ...periodHistory.map(occurrence => occurrence.periodStart),
    ];
    if (!dates.length) {return null;}
    return new Date(`${dates.sort()[0]}T12:00:00`);
  }, [entriesByDate, periodHistory]);

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
    [filteredEntries],
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
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

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
              <Text style={styles.title}>Statistiques</Text>
              <Text style={styles.subtitle}>Suis l’évolution de ton cycle et de tes observations</Text>
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
            <Text style={styles.sectionTitle}>Aperçu du cycle</Text>
            <Text style={styles.sectionDescription}>Résumé sur {monthsLabel}</Text>
          </View>

          {observedCycleDuration ? (
            <View style={styles.cycleHero}>
              <View style={styles.heroDecorationOne} />
              <View style={styles.heroDecorationTwo} />

              <View style={styles.heroTop}>
                <View style={styles.heroMain}>
                  <Text style={styles.heroEyebrow}>DURÉE OBSERVÉE DE TES CYCLES</Text>

                  <View style={styles.heroCycleRow}>
                    <Text style={styles.heroNumber}>{observedCycleDuration.averageDays}</Text>
                    <View style={styles.heroNumberCopy}>
                      <Text style={styles.heroUnit}>jours</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.periodBadge}>
                  <MaterialDesignIcons color={theme.colors.primary} name="calendar-range" size={18} />
                  <Text style={styles.periodBadgeText}>{monthsLabel}</Text>
                </View>
              </View>

              <View style={styles.heroDivider} />

              <Text style={styles.heroFootnote}>
                Basé sur {observedCycleDuration.cyclesAnalyzed}{' '}
                {observedCycleDuration.cyclesAnalyzed > 1 ? 'cycles enregistrés' : 'cycle enregistré'} et {trackedDays}{' '}
                {trackedDays > 1 ? 'jours renseignés' : 'jour renseigné'} sur {monthsLabel}. Tes cycles peuvent
                varier — ce repère décrit ce qui a été observé, sans jugement.
              </Text>

              {coverageMessage ? <Text style={styles.coverageText}>{coverageMessage}</Text> : null}
            </View>
          ) : (
            <View style={styles.emptyCycleCard}>
              <View pointerEvents="none" style={styles.emptyCycleGlowOne} />
              <View pointerEvents="none" style={styles.emptyCycleGlowTwo} />

              <View style={styles.emptyCycleIconRing}>
                <View style={styles.emptyCycleIcon}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="calendar-refresh-outline"
                    size={29}
                  />
                </View>
              </View>

              <Text style={styles.emptyCycleEyebrow}>APERÇU DU CYCLE</Text>

              <Text style={styles.emptyCycleTitle}>
                Pas encore assez de cycles enregistrés
              </Text>

              <Text style={styles.emptyCycleText}>
                Continue à renseigner tes règles. AWA affichera ici une durée
                moyenne observée dès que suffisamment de cycles auront été
                enregistrés.
              </Text>

              <View style={styles.emptyCyclePill}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="chart-timeline-variant"
                  size={15}
                />
                <Text style={styles.emptyCyclePillText}>
                  Ton historique se construit progressivement
                </Text>
              </View>

              <View style={styles.emptyCycleHint}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="information-outline"
                  size={14}
                />
                <Text style={styles.emptyCycleHintText}>
                  Un cycle long n’est jamais automatiquement considéré comme un retard.
                </Text>
              </View>
            </View>
          )}

          {/* ==================================================
              SYMPTÔMES — aperçu global, jamais un score
          =================================================== */}

          <View style={styles.card}>
            <SectionHeader
              icon="heart-pulse"
              subtitle={
                showLongitudinalView
                  ? `Vue d’ensemble sur ${monthsLabel}`
                  : 'Ton aperçu visuel de ce mois'
              }
              title="Symptômes"
            />

            {trackedDays > 0 ? (
              showLongitudinalView ? (
                <Text style={styles.overviewText}>
                  {daysWithAnySymptom} {daysWithAnySymptom > 1 ? 'jours' : 'jour'} avec au moins une observation
                  (acné, pilosité, douleurs ou fatigue) sur {trackedDays}{' '}
                  {trackedDays > 1 ? 'jours renseignés' : 'jour renseigné'}.
                </Text>
              ) : (
                <View style={styles.monthSnapshot}>
                  <View style={styles.snapshotMetric}>
                    <View style={styles.snapshotMetricIcon}>
                      <MaterialDesignIcons color={theme.colors.primary} name="calendar-check-outline" size={19} />
                    </View>
                    <Text style={styles.snapshotMetricValue}>{trackedDays}</Text>
                    <Text style={styles.snapshotMetricLabel}>Jours renseignés</Text>
                  </View>

                  <View style={styles.snapshotDivider} />

                  <View style={styles.snapshotMetric}>
                    <View style={styles.snapshotMetricIcon}>
                      <MaterialDesignIcons color={theme.colors.primary} name="heart-pulse" size={19} />
                    </View>
                    <Text style={styles.snapshotMetricValue}>{daysWithAnySymptom}</Text>
                    <Text style={styles.snapshotMetricLabel}>Jours avec observation</Text>
                  </View>

                  <View style={styles.snapshotDivider} />

                  <View style={styles.snapshotMetric}>
                    <View style={styles.snapshotMetricIcon}>
                      <MaterialDesignIcons color={theme.colors.primary} name="chart-donut" size={19} />
                    </View>
                    <Text style={styles.snapshotMetricValue}>
                      {trackedDays > 0 ? Math.round((daysWithAnySymptom / trackedDays) * 100) : 0}%
                    </Text>
                    <Text style={styles.snapshotMetricLabel}>Couverture du suivi</Text>
                  </View>
                </View>
              )
            ) : (
              <DataNotice
                detail="Renseigne ton suivi quotidien pour voir apparaître cette statistique."
                icon="heart-outline"
                title="Aucune observation enregistrée ce mois-ci"
              />
            )}
          </View>

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
              showLongitudinalView={showLongitudinalView}
              title={stat.label}
            />
          ))}

          {/* ==================================================
              SYMPTÔMES ASSOCIÉS — fréquence réelle des sélections
              multiples du journal "Fatigue & symptômes"
          =================================================== */}

          {associatedSymptomFrequency.length > 0 ? (
            <View style={styles.card}>
              <SectionHeader
                icon="format-list-checks"
                subtitle="Sélections les plus fréquentes du journal Fatigue & symptômes"
                title="Symptômes associés"
              />

              <View style={styles.chipRow}>
                {associatedSymptomFrequency.map(item => (
                  <View key={item.name} style={styles.chip}>
                    <Text style={styles.chipText}>
                      {item.name} · {item.days} {item.days > 1 ? 'jours' : 'jour'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* ==================================================
              POIDS — uniquement si réellement renseigné, jamais d'IMC
          =================================================== */}

          {hasAnyWeightData ? (
            <View style={styles.card}>
              <SectionHeader
                icon="scale-bathroom"
                subtitle={
                  showLongitudinalView
                    ? `Mesures enregistrées par mois sur ${monthsLabel}`
                    : 'Mesures enregistrées ce mois-ci'
                }
                title="Poids"
              />

              {showLongitudinalView ? (
                <View style={styles.monthList}>
                  {monthlyWeightTrend.map(month => (
                    <View key={month.monthKey} style={styles.monthItem}>
                      <View style={styles.monthTop}>
                        <Text style={styles.monthLabel}>{month.monthLabel}</Text>
                        <Text style={styles.monthMeta}>
                          {month.entries.length} {month.entries.length > 1 ? 'mesures' : 'mesure'}
                        </Text>
                      </View>

                      <View style={styles.chipRow}>
                        {month.entries.slice(-4).map(entry => (
                          <View key={entry.date} style={styles.chip}>
                            <Text style={styles.chipText}>{entry.value}</Text>
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
                      <Text style={styles.monthVisualizationEyebrow}>CE MOIS</Text>
                      <Text style={styles.weightMonthCount}>{weightEntries.length}</Text>
                      <Text style={styles.weightMonthLabel}>
                        {weightEntries.length > 1 ? 'mesures enregistrées' : 'mesure enregistrée'}
                      </Text>
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
                          <Text style={styles.weightTimelineValue}>{entry.value}</Text>
                          <Text style={styles.weightTimelineDate}>{entry.date}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : null}

          {/* ==================================================
              REPÈRE POUR UN RENDEZ-VOUS MÉDICAL
          =================================================== */}

          <View style={styles.medicalHint}>
            <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={17} />
            <Text style={styles.medicalHintText}>
              Ces repères, basés sur tes données réelles, peuvent t’aider à décrire ton historique lors d’un
              rendez-vous médical. Ils ne posent aucun diagnostic et ne remplacent pas un avis médical.
            </Text>
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

  pageBackgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  pageGlowTop: {
    position: 'absolute',
    top: -150,
    right: -110,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: withAlpha(theme.colors.primary, 0.07),
  },

  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: withAlpha(theme.colors.primary, 0.045),
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: withAlpha(theme.colors.primary, 0.05),
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

  title: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },

  subtitle: {
    maxWidth: 300,
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },

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
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  filterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: 13,
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
    fontSize: 10.5,
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

  sectionTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 19,
    fontWeight: '800',
  },

  sectionDescription: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
  },

  cycleHero: {
    ...theme.shadow,
    position: 'relative',
    overflow: 'hidden',
    padding: 17,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.08),
    borderRadius: 27,
    backgroundColor: withAlpha(theme.colors.surface, 0.96),
  },

  heroDecorationOne: {
    position: 'absolute',
    top: -60,
    right: -45,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: withAlpha(theme.colors.primary, 0.06),
  },

  heroDecorationTwo: {
    position: 'absolute',
    top: 25,
    right: 25,
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: withAlpha(theme.colors.primary, 0.18),
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

  heroEyebrow: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
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

  heroUnit: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },

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
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  heroDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.14),
  },

  heroFootnote: {
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  coverageText: {
    marginTop: 8,
    color: theme.colors.primary,
    fontSize: 9.5,
    fontWeight: '700',
  },

  overviewText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.08),
    borderRadius: 20,
    backgroundColor: withAlpha(theme.colors.surface, 0.85),
  },

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

  noticeTitle: {
    color: theme.colors.accent,
    fontSize: 12.5,
    fontWeight: '800',
  },

  noticeDetail: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  card: {
    ...theme.shadow,
    marginTop: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.08),
    borderRadius: 23,
    backgroundColor: theme.colors.surface,
  },

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
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },

  cardSubtitle: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 13,
  },

  monthList: {
    marginTop: 14,
  },

  monthListTitle: {
    marginBottom: 6,
    color: theme.colors.accent,
    fontSize: 11.5,
    fontWeight: '800',
  },

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

  monthLabel: {
    color: theme.colors.accent,
    fontSize: 11.5,
    fontWeight: '800',
  },

  monthMeta: {
    color: theme.colors.textSecondary,
    fontSize: 9.5,
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
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  chipText: {
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
  },

  emptyCycleCard: {
    ...theme.shadow,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.08),
    borderRadius: 27,
    backgroundColor: withAlpha(theme.colors.surface, 0.97),
  },

  emptyCycleGlowOne: {
    position: 'absolute',
    top: -74,
    right: -58,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: withAlpha(theme.colors.primary, 0.055),
  },

  emptyCycleGlowTwo: {
    position: 'absolute',
    bottom: -82,
    left: -54,
    width: 165,
    height: 165,
    borderRadius: 83,
    backgroundColor: withAlpha(theme.colors.primary, 0.10),
  },

  emptyCycleIconRing: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.11),
    borderRadius: 24,
    backgroundColor: withAlpha(theme.colors.surface, 0.68),
  },

  emptyCycleIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: theme.colors.primarySoft,
  },

  emptyCycleEyebrow: {
    color: theme.colors.primary,
    fontSize: 8.8,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 1.15,
    textAlign: 'center',
  },

  emptyCycleTitle: {
    maxWidth: 300,
    marginTop: 6,
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 18.5,
    lineHeight: 23,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyCycleText: {
    maxWidth: 305,
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 10.8,
    lineHeight: 16.5,
    textAlign: 'center',
  },

  emptyCyclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 15,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
  },

  emptyCyclePillText: {
    color: theme.colors.primary,
    fontSize: 9.3,
    lineHeight: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyCycleHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    width: '100%',
    marginTop: 14,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.78),
  },

  emptyCycleHintText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 9.2,
    lineHeight: 13.5,
  },

  monthSnapshot: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 20,
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

  snapshotMetricValue: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
  },

  snapshotMetricLabel: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 8.8,
    lineHeight: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

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
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  monthVisualizationTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  monthVisualizationEyebrow: {
    color: theme.colors.primary,
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  monthVisualizationNumber: {
    marginTop: 2,
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
  },

  monthVisualizationUnit: {
    marginTop: 1,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
  },

  monthVisualizationIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
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

  distributionLabel: {
    flex: 1,
    color: theme.colors.accent,
    fontSize: 10.5,
    fontWeight: '800',
  },

  distributionValue: {
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
  },

  distributionTrack: {
    overflow: 'hidden',
    height: 7,
    borderRadius: 99,
    backgroundColor: theme.colors.primarySoft,
  },

  distributionFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: theme.colors.primary,
  },

  weightMonthPanel: {
    marginTop: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.07),
    borderRadius: 20,
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
    fontFamily: 'serif',
    fontSize: 31,
    lineHeight: 35,
    fontWeight: '900',
  },

  weightMonthLabel: {
    marginTop: 1,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
  },

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

  weightTimelineValue: {
    color: theme.colors.accent,
    fontSize: 11.5,
    fontWeight: '900',
  },

  weightTimelineDate: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 8.8,
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
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
  },
  });
}

export default IrregularStatisticsScreen;