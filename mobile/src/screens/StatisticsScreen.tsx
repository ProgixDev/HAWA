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

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import {
  homeColors,
  homeShadow,
} from '../components/home/homeTheme';
import {usePremium} from '../hooks/usePremium';
import {HawaPremiumBottomSheet} from '../components/premium/HawaPremiumBottomSheet';
import {getAllJournalEntries} from '../state/dailyJournalStore';
import type {DailyJournalEntry, FlowIntensity} from '../types/journal';
import {
  getConfirmedPeriodHistory,
  hydrateConfirmedPeriodHistory,
  subscribeConfirmedPeriodHistory,
} from '../state/confirmedPeriodHistoryStore';
import type {ConfirmedPeriodOccurrence} from '../state/confirmedPeriodHistoryStore';
import {
  STATISTICS_PERIODS,
  isPeriodFree,
  filterEntriesForPeriod,
  filterPeriodStartsForPeriod,
  calculateAverageCycleDuration,
  calculateFlowDistribution,
  calculateSymptomFrequency,
  calculateMonthlyFlowTrend,
  calculateMonthlySymptomTrend,
  countTrackedDays,
} from '../utils/cycleStatisticsMath';
import type {StatisticsPeriod} from '../utils/cycleStatisticsMath';

/* ============================================================
   TYPES
============================================================ */

type Props = MainTabScreenProps<'Statistics'>;

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

const PERIOD_LABELS: Record<StatisticsPeriod, string> = {
  '1': '1 mois',
  '3': '3 mois',
  '6': '6 mois',
  '12': '12 mois',
};

const FLOW_LABELS: Record<FlowIntensity, string> = {
  light: 'Léger',
  moderate: 'Moyen',
  heavy: 'Abondant',
  veryHeavy: 'Très abondant',
  none: 'Aucun',
};

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
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <MaterialDesignIcons color={homeColors.primary} name={icon} size={21} />
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
  return (
    <View style={styles.notice}>
      <View style={styles.noticeIcon}>
        <MaterialDesignIcons color={homeColors.primary} name={icon} size={20} />
      </View>

      <View style={styles.noticeCopy}>
        <Text style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.noticeDetail}>{detail}</Text>
      </View>
    </View>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

function StatisticsScreen(_props: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const compact = width < 370;

  const {isPremium} = usePremium();
  const [premiumVisible, setPremiumVisible] = useState(false);

  const [period, setPeriod] = useState<StatisticsPeriod>('1');
  const [journalEntries, setJournalEntries] = useState<DailyJournalEntry[]>([]);
  const [periodHistory, setPeriodHistory] = useState<ConfirmedPeriodOccurrence[]>(
    () => getConfirmedPeriodHistory(),
  );
  const [now, setNow] = useState<Date>(() => new Date());

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setNow(new Date());

      getAllJournalEntries().then(entries => {
        if (active) {setJournalEntries(entries);}
      });

      hydrateConfirmedPeriodHistory().then(history => {
        if (active) {setPeriodHistory(history);}
      });

      const unsubscribe = subscribeConfirmedPeriodHistory(() => {
        setPeriodHistory(getConfirmedPeriodHistory());
      });

      return () => {
        active = false;
        unsubscribe();
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

  const flowDistribution = useMemo(() => calculateFlowDistribution(filteredEntries), [filteredEntries]);
  const symptomFrequency = useMemo(() => calculateSymptomFrequency(filteredEntries), [filteredEntries]);
  const monthlyFlowTrend = useMemo(() => calculateMonthlyFlowTrend(filteredEntries), [filteredEntries]);
  const monthlySymptomTrend = useMemo(() => calculateMonthlySymptomTrend(filteredEntries), [filteredEntries]);
  const trackedDays = useMemo(() => countTrackedDays(filteredEntries), [filteredEntries]);

  const showLongitudinalView = period !== '1';
  const maxFlowDays = Math.max(...flowDistribution.map(item => item.days), 1);
  const maxSymptomDays = Math.max(...symptomFrequency.map(item => item.days), 1);
  const monthsLabel = PERIOD_LABELS[period];

  return (
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
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
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            compact && styles.scrollContentCompact,
            {paddingBottom: Math.max(insets.bottom, 16) + 120},
          ]}
          showsVerticalScrollIndicator={false}>
          {/* ==================================================
              HEADER
          =================================================== */}

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Statistiques</Text>
              <Text style={styles.subtitle}>Comprends ton corps grâce à tes tendances</Text>
            </View>

            <View style={styles.headerIcon}>
              <MaterialDesignIcons
                color={homeColors.primary}
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
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                        locked && styles.filterTextLocked,
                      ]}>
                      {PERIOD_LABELS[item]}
                    </Text>

                    {locked ? (
                      <MaterialDesignIcons color={homeColors.textSecondary} name="lock-outline" size={10} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ==================================================
              APERÇU DU CYCLE — durée moyenne + cycles analysés
          =================================================== */}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Aperçu du cycle</Text>
            <Text style={styles.sectionDescription}>Résumé sur {monthsLabel}</Text>
          </View>

          {averageCycleDuration ? (
            <View style={styles.cycleHero}>
              <View style={styles.heroDecorationOne} />
              <View style={styles.heroDecorationTwo} />

              <View style={styles.heroTop}>
                <View style={styles.heroMain}>
                  <Text style={styles.heroEyebrow}>DURÉE MOYENNE DES CYCLES</Text>

                  <View style={styles.heroCycleRow}>
                    <Text style={styles.heroNumber}>{averageCycleDuration.averageDays}</Text>

                    <View style={styles.heroNumberCopy}>
                      <Text style={styles.heroUnit}>jours</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.periodBadge}>
                  <MaterialDesignIcons color={homeColors.primary} name="calendar-range" size={18} />
                  <Text style={styles.periodBadgeText}>{monthsLabel}</Text>
                </View>
              </View>

              <View style={styles.heroDivider} />

              <Text style={styles.heroFootnote}>
                Basé sur {averageCycleDuration.cyclesAnalyzed}{' '}
                {averageCycleDuration.cyclesAnalyzed > 1 ? 'cycles analysés' : 'cycle analysé'} et {trackedDays}{' '}
                {trackedDays > 1 ? 'jours renseignés' : 'jour renseigné'} sur {monthsLabel}.
              </Text>
            </View>
          ) : (
            <DataNotice
              detail="Continue à renseigner tes règles pour voir apparaître ta durée moyenne."
              icon="calendar-clock-outline"
              title="Pas encore assez de cycles enregistrés"
            />
          )}

          {/* ==================================================
              ÉVOLUTION DU FLUX
          =================================================== */}

          <View style={styles.card}>
            <SectionHeader
              icon="water-outline"
              subtitle={
                showLongitudinalView
                  ? `Répartition mois par mois sur ${monthsLabel}`
                  : 'Répartition des intensités enregistrées'
              }
              title="Évolution du flux"
            />

            {showLongitudinalView ? (
              monthlyFlowTrend.length > 0 ? (
                <View style={styles.monthList}>
                  {monthlyFlowTrend.map(month => (
                    <View key={month.monthKey} style={styles.monthItem}>
                      <View style={styles.monthTop}>
                        <Text style={styles.monthLabel}>{month.monthLabel}</Text>
                        <Text style={styles.monthMeta}>
                          {month.daysWithFlow} {month.daysWithFlow > 1 ? 'jours de flux' : 'jour de flux'}
                        </Text>
                      </View>

                      <View style={styles.chipRow}>
                        {month.distribution.map(entry => (
                          <View key={entry.intensity} style={styles.chip}>
                            <Text style={styles.chipText}>
                              {FLOW_LABELS[entry.intensity]} · {entry.days}{' '}
                              {entry.days > 1 ? 'j' : 'j'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <DataNotice
                  detail="Aucun flux enregistré n'a encore été trouvé sur cette période."
                  icon="water-off-outline"
                  title="Pas encore de données de flux"
                />
              )
            ) : flowDistribution.length > 0 ? (
              <View style={styles.flowList}>
                {flowDistribution.map(item => {
                  const percentage = (item.days / maxFlowDays) * 100;

                  return (
                    <View key={item.intensity} style={styles.flowItem}>
                      <View style={styles.flowTop}>
                        <View style={styles.flowIcon}>
                          <MaterialDesignIcons
                            color={homeColors.primary}
                            name={FLOW_ICONS[item.intensity]}
                            size={18}
                          />
                        </View>

                        <Text style={styles.flowLabel}>{FLOW_LABELS[item.intensity]}</Text>

                        <Text style={styles.flowValue}>
                          {item.days} {item.days > 1 ? 'jours' : 'jour'}
                        </Text>
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
                detail="Renseigne ton flux dans le Journal quotidien pour voir apparaître cette statistique."
                icon="water-off-outline"
                title="Aucun flux enregistré ce mois-ci"
              />
            )}
          </View>

          {/* ==================================================
              SYMPTÔMES LES PLUS FRÉQUENTS
          =================================================== */}

          <View style={styles.card}>
            <SectionHeader
              icon="heart-pulse"
              subtitle={
                showLongitudinalView
                  ? `Fréquence et évolution sur ${monthsLabel}`
                  : 'Les symptômes les plus enregistrés'
              }
              title="Symptômes les plus fréquents"
            />

            {symptomFrequency.length > 0 ? (
              <View style={styles.symptomList}>
                {symptomFrequency.slice(0, 6).map((item, index, array) => {
                  const percentage = (item.days / maxSymptomDays) * 100;

                  return (
                    <View
                      key={item.name}
                      style={[styles.symptomItem, index === array.length - 1 && styles.lastItem]}>
                      <View style={styles.symptomTop}>
                        <View style={styles.rank}>
                          <Text style={styles.rankText}>{index + 1}</Text>
                        </View>

                        <Text style={styles.symptomName}>{item.name}</Text>

                        <View style={styles.symptomBadge}>
                          <Text style={styles.symptomDays}>
                            {item.days} {item.days > 1 ? 'jours' : 'jour'}
                          </Text>
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
                detail="Renseigne tes symptômes dans le Journal quotidien pour voir apparaître cette statistique."
                icon="heart-outline"
                title="Aucun symptôme enregistré ce mois-ci"
              />
            )}

            {showLongitudinalView && monthlySymptomTrend.length > 0 ? (
              <View style={styles.monthList}>
                <Text style={styles.monthListTitle}>Évolution par mois</Text>

                {monthlySymptomTrend.map(month => (
                  <View key={month.monthKey} style={styles.monthItem}>
                    <View style={styles.monthTop}>
                      <Text style={styles.monthLabel}>{month.monthLabel}</Text>
                    </View>

                    <View style={styles.chipRow}>
                      {month.topSymptoms.map(symptom => (
                        <View key={symptom.name} style={styles.chip}>
                          <Text style={styles.chipText}>
                            {symptom.name} · {symptom.days} {symptom.days > 1 ? 'j' : 'j'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* ==================================================
              REPÈRE POUR UN RENDEZ-VOUS MÉDICAL
          =================================================== */}

          <View style={styles.medicalHint}>
            <MaterialDesignIcons color={homeColors.primary} name="information-outline" size={17} />

            <Text style={styles.medicalHintText}>
              Ces tendances, basées sur tes données réelles, peuvent t’aider à mieux décrire ton historique lors
              d’un rendez-vous médical. Elles ne remplacent pas un avis médical.
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

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F2ECF8',
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
    backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },

  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: 'rgba(92, 67, 139, 0.05)',
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
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },

  subtitle: {
    maxWidth: 300,
    marginTop: 3,
    color: homeColors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },

  headerIcon: {
    ...homeShadow,
    width: 49,
    height: 49,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 16,
    backgroundColor: '#F0E9FB',
  },

  filters: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.05)',
    borderRadius: 17,
    backgroundColor: '#EEE8F5',
  },

  filterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: 13,
  },

  filterButtonActive: {
    ...homeShadow,
    backgroundColor: '#FFFFFF',
  },

  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  filterText: {
    color: homeColors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
  },

  filterTextActive: {
    color: homeColors.primary,
    fontWeight: '800',
  },

  filterTextLocked: {
    color: homeColors.textSecondary,
  },

  sectionHeading: {
    marginTop: 6,
    marginBottom: 10,
  },

  sectionTitle: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 19,
    fontWeight: '800',
  },

  sectionDescription: {
    marginTop: 2,
    color: homeColors.textSecondary,
    fontSize: 10.5,
  },

  cycleHero: {
    ...homeShadow,
    position: 'relative',
    overflow: 'hidden',
    padding: 17,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },

  heroDecorationOne: {
    position: 'absolute',
    top: -60,
    right: -45,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(105,73,190,0.06)',
  },

  heroDecorationTwo: {
    position: 'absolute',
    top: 25,
    right: 25,
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: 'rgba(198,174,235,0.18)',
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
    color: '#9179C8',
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
    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 48,
    lineHeight: 53,
    fontWeight: '800',
  },

  heroNumberCopy: {
    marginLeft: 9,
  },

  heroUnit: {
    color: homeColors.textPrimary,
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
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 16,
    backgroundColor: '#F1EAFB',
  },

  periodBadgeText: {
    marginTop: 4,
    color: homeColors.primary,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  heroDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
    backgroundColor: '#E9E2F0',
  },

  heroFootnote: {
    color: homeColors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },

  noticeIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F0E9FB',
  },

  noticeCopy: {
    flex: 1,
    minWidth: 0,
  },

  noticeTitle: {
    color: homeColors.textPrimary,
    fontSize: 12.5,
    fontWeight: '800',
  },

  noticeDetail: {
    marginTop: 3,
    color: homeColors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  card: {
    ...homeShadow,
    marginTop: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F0E9FB',
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },

  cardSubtitle: {
    marginTop: 2,
    color: homeColors.textSecondary,
    fontSize: 9.5,
    lineHeight: 13,
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
    borderRadius: 11,
    backgroundColor: '#F1EAFB',
  },

  flowLabel: {
    flex: 1,
    marginLeft: 9,
    color: homeColors.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
  },

  flowValue: {
    color: homeColors.textSecondary,
    fontSize: 9.5,
  },

  flowTrack: {
    height: 6,
    overflow: 'hidden',
    marginTop: 7,
    marginLeft: 41,
    borderRadius: 3,
    backgroundColor: '#EFE9F5',
  },

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
    borderBottomColor: '#ECE6F1',
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
    borderRadius: 10,
    backgroundColor: '#F0E9FB',
  },

  rankText: {
    color: homeColors.primary,
    fontSize: 10.5,
    fontWeight: '800',
  },

  symptomName: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 9,
    color: homeColors.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
  },

  symptomBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: '#F5F1F9',
  },

  symptomDays: {
    color: homeColors.textSecondary,
    fontSize: 8.5,
    fontWeight: '700',
  },

  symptomTrack: {
    height: 5,
    overflow: 'hidden',
    marginTop: 7,
    marginLeft: 38,
    borderRadius: 3,
    backgroundColor: '#EFE9F5',
  },

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
    color: homeColors.textPrimary,
    fontSize: 11.5,
    fontWeight: '800',
  },

  monthItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECE6F1',
  },

  monthTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  monthLabel: {
    color: homeColors.textPrimary,
    fontSize: 11.5,
    fontWeight: '800',
  },

  monthMeta: {
    color: homeColors.textSecondary,
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
    backgroundColor: '#F5F1F9',
  },

  chipText: {
    color: homeColors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
  },

  medicalHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  medicalHintText: {
    flex: 1,
    color: homeColors.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
  },
});

export default StatisticsScreen;
