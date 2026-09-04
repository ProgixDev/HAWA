import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type { RootStackParamList } from '../../navigation/AppNavigator';

import { homeColors, homeShadow } from '../../components/home/homeTheme';

import { getTopPadding, getBottomPadding, spacing } from '../../theme/spacing';

import { getAllJournalEntries } from '../../state/dailyJournalStore';
import { withResolvedIntimacyForDisplayMany } from '../../services/privateJournalEncryption';
import type { CervicalMucusType, DailyJournalEntry } from '../../types/journal';

import {
  getCyclePreferences,
  getHasConfirmedCycleData,
  getPeriodHistory,
  hydrateCyclePreferences,
  subscribeCyclePreferences,
} from '../../state/onboardingPreferences';

import {
  cycleDayFor,
  diffDays,
  formatShortDate,
  ovulationDayFor,
  startOfDay,
  upcomingDateForCycleDay,
} from '../../utils/cycleMath';

import {
  cutoffDateForPeriod,
  filterEntriesForPeriod,
  isPeriodFree,
  STATISTICS_PERIODS,
  type StatisticsPeriod,
} from '../../utils/cycleStatisticsMath';
import {calculateLhMonthlyTrend, buildMucusTimeline} from '../../utils/conceptionStatisticsMath';

import { usePremium } from '../../hooks/usePremium';
import { HawaPremiumBottomSheet } from '../../components/premium/HawaPremiumBottomSheet';

// Trying-to-Conceive Statistics — structurally modeled after
// MiscarriageStatisticsScreen.tsx (same premium HAWA card language, tabs,
// KpiCard/TrendBar/DistributionRow/SectionHeader/EmptyState/AnimatedSection
// helpers) but with TTC-specific content: cycle length, fertile
// window/ovulation, basal temperature, cervical mucus, LH tests,
// intercourse. Reads onboardingPreferences' cycle store + cycleMath.ts
// (same as ConceiveDashboard.tsx/ConceiveCalendarContent.tsx) and the
// generic dailyJournalStore.ts — never a separate TTC store, never
// pregnancy/postpartum/miscarriage data. Freemium period selector (1/3/6/12
// mois) reuses the generic, Cycle-agnostic helpers from
// cycleStatisticsMath.ts (already built for reuse across objectives per
// that file's own doc comment) — same Free/Premium split and
// usePremium()/HawaPremiumBottomSheet pattern as StatisticsScreen.tsx.
// Trends within the selected period keep a reasonable display cap for
// chart readability, but the underlying stats (counts, averages,
// distributions) are computed from the real period-filtered data, never a
// hardcoded "last 10". Never a diagnosis or a guaranteed pregnancy
// probability — every disclaimer card says so explicitly.

/* ============================================================
   THEME
============================================================ */

const PURPLE = homeColors.primary;
const PURPLE_DARK = homeColors.textPrimary;
const TEXT_SECONDARY = homeColors.textSecondary;

const BACKGROUND = '#F2ECF8';

const CARD = '#FFFFFF';
const CARD_SOFT = '#FCFAFE';

const PURPLE_SOFT = '#F1EAFB';

const PINK_SOFT = '#FBEAF1';
const PINK = '#CB5C82';

const GREEN_SOFT = '#EAF6EF';
const GREEN = '#5B9B72';

const BLUE_SOFT = '#EAF3F7';
const BLUE = '#4B8996';

const BORDER = 'rgba(105,73,190,0.09)';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type TabKey = 'summary' | 'temperature' | 'fertility' | 'cycle';

/* ============================================================
   TABS
============================================================ */

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: IconName;
}> = [
  { key: 'summary', label: 'Résumé', icon: 'chart-box-outline' },
  { key: 'temperature', label: 'Température', icon: 'thermometer' },
  { key: 'fertility', label: 'Fertilité', icon: 'egg-outline' },
  { key: 'cycle', label: 'Cycle', icon: 'calendar-month-outline' },
];

/* ============================================================
   LABELS
============================================================ */

const MUCUS_LABEL: Record<string, string> = {
  dry: 'Sèche',
  sticky: 'Collante',
  creamy: 'Crémeuse',
  watery: 'Aqueuse',
  eggWhite: 'Claire et élastique',
};

const LH_LABEL: Record<string, string> = {
  negative: 'Négatif',
  positive: 'Positif',
  invalid: 'Non valide',
};


const PERIOD_LABELS: Record<StatisticsPeriod, string> = {
  '1': '1 mois',
  '3': '3 mois',
  '6': '6 mois',
  '12': '12 mois',
};

/** Chart readability cap only — the underlying stats/counts below are
 * always computed from the full real period-filtered set, never from this
 * slice (mirrors the same "cap the chart, not the data" convention already
 * used by StatisticsScreen.tsx's longitudinal views). */
const TREND_DISPLAY_CAP = 20;

/* ============================================================
   FORMATTERS
============================================================ */

const dateLabel = (date: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));

/* ============================================================
   HELPERS
============================================================ */

function countByLabel(
  values: string[],
  labelMap: Record<string, string>,
): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  values.forEach(value => {
    const label = labelMap[value] ?? value;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/* ============================================================
   ANIMATION HOOK
============================================================ */

function useEntranceAnimation(delay = 0): Animated.Value {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (!active) {
        return;
      }
      Animated.timing(anim, {
        toValue: 1,
        duration: reduceMotion ? 0 : 420,
        delay: reduceMotion ? 0 : delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      active = false;
    };
  }, [anim, delay]);

  return anim;
}

/* ============================================================
   ANIMATED SECTION
============================================================ */

function AnimatedSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}): React.JSX.Element {
  const anim = useEntranceAnimation(delay);
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  text,
  icon = 'chart-line-variant',
}: {
  text: string;
  icon?: IconName;
}): React.JSX.Element {
  const anim = useEntranceAnimation(80);
  return (
    <Animated.View
      style={[
        styles.empty,
        {
          opacity: anim,
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.emptyIcon}>
        <MaterialDesignIcons color="#9A82C9" name={icon} size={27} />
      </View>
      <Text style={styles.emptyTitle}>Pas encore de données</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </Animated.View>
  );
}

/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
  icon,
  title,
  subtitle,
  accent = 'purple',
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  accent?: 'purple' | 'pink' | 'green' | 'blue';
}): React.JSX.Element {
  const palette = {
    purple: { bg: PURPLE_SOFT, color: PURPLE },
    pink: { bg: PINK_SOFT, color: PINK },
    green: { bg: GREEN_SOFT, color: GREEN },
    blue: { bg: BLUE_SOFT, color: BLUE },
  }[accent];

  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: palette.bg }]}>
        <MaterialDesignIcons color={palette.color} name={icon} size={20} />
      </View>
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

/* ============================================================
   KPI CARD
============================================================ */

function KpiCard({
  icon,
  value,
  label,
  accent = 'purple',
}: {
  icon: IconName;
  value: string;
  label: string;
  accent?: 'purple' | 'pink' | 'green' | 'blue';
}): React.JSX.Element {
  const palette = {
    purple: { bg: PURPLE_SOFT, color: PURPLE },
    pink: { bg: PINK_SOFT, color: PINK },
    green: { bg: GREEN_SOFT, color: GREEN },
    blue: { bg: BLUE_SOFT, color: BLUE },
  }[accent];

  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiTop}>
        <View style={[styles.kpiIcon, { backgroundColor: palette.bg }]}>
          <MaterialDesignIcons color={palette.color} name={icon} size={19} />
        </View>
        <View style={[styles.kpiDot, { backgroundColor: palette.color }]} />
      </View>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.kpiValue}>
        {value}
      </Text>
      <Text numberOfLines={2} style={styles.kpiLabel}>
        {label}
      </Text>
    </View>
  );
}

/* ============================================================
   DISTRIBUTION ROW
============================================================ */

function DistributionRow({
  label,
  count,
  maxCount,
  last,
  accent = 'purple',
}: {
  label: string;
  count: number;
  maxCount: number;
  last?: boolean;
  accent?: 'purple' | 'pink' | 'green' | 'blue';
}): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;
  const percent =
    maxCount > 0 ? Math.min(100, Math.max(8, (count / maxCount) * 100)) : 0;
  const palette = { purple: PURPLE, pink: PINK, green: GREEN, blue: BLUE }[
    accent
  ];

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) {
        return;
      }
      Animated.timing(progress, {
        toValue: percent,
        duration: reduce ? 0 : 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
    return () => {
      active = false;
    };
  }, [percent, progress]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.distributionRow, last && styles.lastRow]}>
      <View style={styles.distributionTop}>
        <Text numberOfLines={2} style={styles.distributionLabel}>
          {label}
        </Text>
        <View style={styles.distributionBadge}>
          <Text style={styles.distributionCount}>
            {count} {count > 1 ? 'jours' : 'jour'}
          </Text>
        </View>
      </View>
      <View style={styles.distributionTrack}>
        <Animated.View
          style={[styles.distributionFill, { width, backgroundColor: palette }]}
        />
      </View>
    </View>
  );
}

/* ============================================================
   TREND BAR
============================================================ */

function TrendBar({
  label,
  value,
  maxValue,
  delay,
}: {
  label: string;
  value: number;
  maxValue: number;
  delay: number;
}): React.JSX.Element {
  const anim = useRef(new Animated.Value(0)).current;
  const span = Math.max(maxValue, 1);
  const target = Math.min(100, Math.max(12, (value / span) * 100));

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) {
        return;
      }
      Animated.timing(anim, {
        toValue: target,
        duration: reduce ? 0 : 430,
        delay: reduce ? 0 : delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
    return () => {
      active = false;
    };
  }, [anim, delay, target]);

  const height = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barColumn}>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { height }]} />
        <View style={styles.barShine} />
      </View>
      <Text numberOfLines={1} style={styles.barLabel}>
        {label}
      </Text>
    </View>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

function ConceiveStatisticsScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<TabKey>('summary');
  const [cyclePrefs, setCyclePrefs] = useState(getCyclePreferences);
  const [hasConfirmedCycleData, setHasConfirmedCycleData] = useState(getHasConfirmedCycleData);
  const [allEntries, setAllEntries] = useState<DailyJournalEntry[]>([]);
  const tabAnimation = useRef(new Animated.Value(1)).current;

  const { isPremium } = usePremium();
  const [period, setPeriod] = useState<StatisticsPeriod>('1');
  const [premiumVisible, setPremiumVisible] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);
  const showLongitudinalView = period !== '1';

  /* ==========================================================
     HYDRATION
  ========================================================== */

  useEffect(() => {
    let active = true;
    hydrateCyclePreferences().then(value => {
      if (active) {
        setCyclePrefs(value);
        setHasConfirmedCycleData(getHasConfirmedCycleData());
      }
    });
    const unsubscribe = subscribeCyclePreferences(() => {
      if (active) {
        setCyclePrefs(getCyclePreferences());
        setHasConfirmedCycleData(getHasConfirmedCycleData());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllJournalEntries()
        .then(withResolvedIntimacyForDisplayMany)
        .then(entries => {
          if (active) {
            setAllEntries(entries);
          }
        });
      return () => {
        active = false;
      };
    }, []),
  );

  /* ==========================================================
     CYCLE / FERTILITY (current cycle snapshot — same cycleMath.ts
     logic ConceiveDashboard.tsx already uses)
  ========================================================== */

  const ovulationDay = ovulationDayFor(cyclePrefs.cycleDuration);
  const currentCycleDay = cycleDayFor(today, cyclePrefs);
  const fertileStartDate = upcomingDateForCycleDay(cyclePrefs, ovulationDay - 5, today);
  const fertileEndDate = upcomingDateForCycleDay(cyclePrefs, ovulationDay + 1, today);
  const ovulationDate = upcomingDateForCycleDay(cyclePrefs, ovulationDay, today);

  /* ==========================================================
     JOURNAL DATA
  ========================================================== */

  const journalDays = useMemo(
    () => [...allEntries].sort((a, b) => a.date.localeCompare(b.date)),
    [allEntries],
  );

  // Real period-filtered window (Free = 1 mois, Premium = 3/6/12 mois) —
  // every trend/count below derives from this set, never an arbitrary
  // "last 10" slice regardless of the selected period.
  const periodEntries = useMemo(
    () => filterEntriesForPeriod(journalDays, period, today),
    [journalDays, period, today],
  );

  const temperatureEntries = useMemo(
    () => periodEntries.filter((entry): entry is DailyJournalEntry & { temperature: NonNullable<DailyJournalEntry['temperature']> } => Boolean(entry.temperature)),
    [periodEntries],
  );

  const temperatureTrend = useMemo(
    () => temperatureEntries.slice(-TREND_DISPLAY_CAP).map(entry => ({ date: entry.date, value: entry.temperature.value })),
    [temperatureEntries],
  );

  const temperatureTrendScaled = useMemo(() => {
    if (temperatureTrend.length === 0) {
      return [];
    }
    const values = temperatureTrend.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 0.1);
    return temperatureTrend.map(item => ({
      date: item.date,
      display: `${item.value.toFixed(1)}°`,
      scaled: 1 + Math.round(((item.value - min) / span) * 9),
    }));
  }, [temperatureTrend]);

  const latestTemperature = temperatureEntries[temperatureEntries.length - 1];
  const averageTemperature = useMemo(() => {
    if (temperatureEntries.length === 0) {
      return null;
    }
    const sum = temperatureEntries.reduce((total, entry) => total + entry.temperature.value, 0);
    return sum / temperatureEntries.length;
  }, [temperatureEntries]);
  const minTemperature = temperatureEntries.length > 0
    ? Math.min(...temperatureEntries.map(entry => entry.temperature.value))
    : null;
  const maxTemperature = temperatureEntries.length > 0
    ? Math.max(...temperatureEntries.map(entry => entry.temperature.value))
    : null;

  const mucusEntries = useMemo(
    () => periodEntries.filter((entry): entry is DailyJournalEntry & { cervicalMucus: NonNullable<DailyJournalEntry['cervicalMucus']> } => Boolean(entry.cervicalMucus)),
    [periodEntries],
  );
  const mucusCounts = useMemo(
    () => countByLabel(mucusEntries.map(entry => entry.cervicalMucus.type), MUCUS_LABEL),
    [mucusEntries],
  );
  const maxMucusCount = Math.max(...mucusCounts.map(item => item.count), 1);
  const latestMucus = mucusEntries[mucusEntries.length - 1];

  // Premium "Évolution de la glaire cervicale" — see conceptionStatisticsMath.ts
  // for the real-data, no-mock guarantee.
  const mucusTimeline = useMemo(() => buildMucusTimeline(mucusEntries, TREND_DISPLAY_CAP), [mucusEntries]);

  const lhEntries = useMemo(
    () => periodEntries.filter((entry): entry is DailyJournalEntry & { lhTest: NonNullable<DailyJournalEntry['lhTest']> } => Boolean(entry.lhTest)),
    [periodEntries],
  );
  const lhCounts = useMemo(
    () => countByLabel(lhEntries.map(entry => entry.lhTest.result), LH_LABEL),
    [lhEntries],
  );
  const maxLhCount = Math.max(...lhCounts.map(item => item.count), 1);
  const positiveLhCount = lhEntries.filter(entry => entry.lhTest.result === 'positive').length;
  const latestLh = lhEntries[lhEntries.length - 1];

  // Premium "Évolution des tests LH" — see conceptionStatisticsMath.ts for
  // the real-data, no-fabricated-scale guarantee.
  const lhMonthlyTrend = useMemo(() => calculateLhMonthlyTrend(lhEntries), [lhEntries]);

  const intercourseEntries = useMemo(
    () => journalDays.filter(entry => entry.intimacy?.answer === 'yes'),
    [journalDays],
  );
  const intercourseThisCycle = useMemo(
    () =>
      intercourseEntries.filter(entry => {
        const entryDate = new Date(`${entry.date}T12:00:00`);
        return entryDate >= cyclePrefs.lastPeriodStart && entryDate <= today;
      }).length,
    [intercourseEntries, cyclePrefs.lastPeriodStart, today],
  );

  /* ==========================================================
     CYCLE LENGTH TREND (real period history — same source
     CycleHomeScreen/ConceiveDashboard already read)
  ========================================================== */

  // Full real cycle-length history (every consecutive gap between confirmed
  // period starts) — computed once, unbounded. The selected period then
  // filters this real set by date, so a wider Premium window (3/6/12 mois)
  // surfaces more of this same real history instead of an arbitrary
  // "last 10" cap.
  const allCycleLengths = useMemo(() => {
    const starts = getPeriodHistory()
      .map(record => startOfDay(new Date(`${record.startDate}T12:00:00`)))
      .sort((a, b) => a.getTime() - b.getTime());
    const lengths: Array<{ date: string; value: number }> = [];
    for (let index = 1; index < starts.length; index += 1) {
      const length = diffDays(starts[index], starts[index - 1]);
      if (length > 0) {
        lengths.push({ date: starts[index].toLocaleDateString('en-CA'), value: length });
      }
    }
    return lengths;
  }, []);

  const cycleLengthTrend = useMemo(() => {
    const cutoff = cutoffDateForPeriod(period, today);
    return allCycleLengths
      .filter(item => {
        const date = new Date(`${item.date}T12:00:00`);
        return date.getTime() >= cutoff.getTime() && date.getTime() <= today.getTime();
      })
      .slice(-TREND_DISPLAY_CAP);
  }, [allCycleLengths, period, today]);

  const averageCycleLength = useMemo(() => {
    if (cycleLengthTrend.length === 0) {
      return cyclePrefs.cycleDuration;
    }
    const sum = cycleLengthTrend.reduce((total, item) => total + item.value, 0);
    return Math.round(sum / cycleLengthTrend.length);
  }, [cycleLengthTrend, cyclePrefs.cycleDuration]);

  const shortestCycle = cycleLengthTrend.length > 0
    ? Math.min(...cycleLengthTrend.map(item => item.value))
    : null;
  const longestCycle = cycleLengthTrend.length > 0
    ? Math.max(...cycleLengthTrend.map(item => item.value))
    : null;

  /* ==========================================================
     TAB CHANGE
  ========================================================== */

  const handleSelectPeriod = useCallback(
    (target: StatisticsPeriod) => {
      if (!isPeriodFree(target) && !isPremium) {
        setPremiumVisible(true);
        return;
      }
      setPeriod(target);
    },
    [isPremium],
  );

  const handleTabChange = useCallback(
    (nextTab: TabKey) => {
      if (nextTab === tab) {
        return;
      }
      Animated.timing(tabAnimation, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setTab(nextTab);
        tabAnimation.setValue(0);
        Animated.timing(tabAnimation, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    },
    [tab, tabAnimation],
  );

  return (
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.safe}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>
      <StatusBar
        backgroundColor="transparent"
        barStyle="dark-content"
        translucent
      />

      {/* HEADER */}
      <View
        style={[styles.header, { paddingTop: getTopPadding(insets.top, true) }]}
      >
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          hitSlop={10}
          onPress={navigation.goBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <MaterialDesignIcons color={PURPLE_DARK} name="chevron-left" size={25} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Statistiques</Text>
          <Text style={styles.headerSubtitle}>Ton cycle et ta fertilité</Text>
        </View>

        <View style={styles.headerBadgeIcon}>
          <MaterialDesignIcons
            color={PURPLE}
            name="chart-timeline-variant-shimmer"
            size={21}
          />
        </View>
      </View>

      {/* OBJECTIVE */}
      <AnimatedSection delay={40}>
        <View style={styles.objectiveCard}>
          <View style={styles.objectiveIcon}>
            <MaterialDesignIcons color={PURPLE} name="heart-outline" size={20} />
          </View>
          <View style={styles.objectiveCopy}>
            <Text style={styles.objectiveLabel}>OBJECTIF ACTUEL</Text>
            <Text style={styles.objectiveValue}>Essayer de concevoir</Text>
          </View>
          <View style={styles.objectiveDot} />
        </View>
      </AnimatedSection>

      {/* PERIOD SELECTOR — 1 mois (Free), 3/6/12 mois (Premium) */}
      <AnimatedSection delay={60}>
        <View style={styles.periodFilters}>
          {STATISTICS_PERIODS.map(item => {
            const active = period === item;
            const locked = !isPeriodFree(item) && !isPremium;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={item}
                onPress={() => handleSelectPeriod(item)}
                style={({ pressed }) => [
                  styles.periodFilterButton,
                  active && styles.periodFilterButtonActive,
                  pressed && styles.tabPressed,
                ]}
              >
                <View style={styles.periodFilterButtonContent}>
                  <Text
                    style={[
                      styles.periodFilterText,
                      active && styles.periodFilterTextActive,
                    ]}
                  >
                    {PERIOD_LABELS[item]}
                  </Text>
                  {locked ? (
                    <MaterialDesignIcons color={TEXT_SECONDARY} name="lock-outline" size={10} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </AnimatedSection>

      {/* TABS */}
      <AnimatedSection delay={80}>
        <ScrollView
          contentContainerStyle={styles.tabsScrollContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
        >
          {TABS.map(item => {
            const active = tab === item.key;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={item.key}
                onPress={() => handleTabChange(item.key)}
                style={({ pressed }) => [
                  styles.tabPill,
                  active && styles.tabPillActive,
                  pressed && styles.tabPressed,
                ]}
              >
                <MaterialDesignIcons
                  color={active ? PURPLE : '#9587A7'}
                  name={item.icon}
                  size={16}
                />
                <Text
                  style={[styles.tabPillText, active && styles.tabPillTextActive]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </AnimatedSection>

      {/* CONTENT */}
      <Animated.View
        style={[
          styles.tabContent,
          {
            opacity: tabAnimation,
            transform: [
              {
                translateY: tabAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [7, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: getBottomPadding(insets.bottom, spacing.xl) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'summary' ? (
            <SummaryTab
              averageCycleLength={averageCycleLength}
              currentCycleDay={currentCycleDay}
              fertileRange={`${formatShortDate(fertileStartDate)} – ${formatShortDate(fertileEndDate)}`}
              hasConfirmedCycleData={hasConfirmedCycleData}
              intercourseThisCycle={intercourseThisCycle}
              onConfigureCycle={() => navigation.navigate('CycleInformation', { fromDashboardCTA: true })}
              ovulationDate={formatShortDate(ovulationDate)}
              positiveLhCount={positiveLhCount}
              temperatureCount={temperatureEntries.length}
              temperatureTrend={temperatureTrendScaled}
            />
          ) : null}

          {tab === 'temperature' ? (
            <TemperatureTab
              average={averageTemperature}
              count={temperatureEntries.length}
              latest={latestTemperature?.temperature.value ?? null}
              latestDate={latestTemperature?.date}
              max={maxTemperature}
              min={minTemperature}
              trend={temperatureTrendScaled}
            />
          ) : null}

          {tab === 'fertility' ? (
            <FertilityTab
              latestLhDate={latestLh?.date}
              latestLhLabel={latestLh ? (LH_LABEL[latestLh.lhTest.result] ?? latestLh.lhTest.result) : undefined}
              latestMucusDate={latestMucus?.date}
              latestMucusLabel={latestMucus ? (MUCUS_LABEL[latestMucus.cervicalMucus.type] ?? latestMucus.cervicalMucus.type) : undefined}
              lhCounts={lhCounts}
              lhMonthlyTrend={lhMonthlyTrend}
              maxLhCount={maxLhCount}
              maxMucusCount={maxMucusCount}
              mucusCounts={mucusCounts}
              mucusTimeline={mucusTimeline}
              periodLabel={PERIOD_LABELS[period]}
              positiveLhCount={positiveLhCount}
              showLongitudinalView={showLongitudinalView}
            />
          ) : null}

          {tab === 'cycle' ? (
            <CycleTab
              averageLength={averageCycleLength}
              hasConfirmedCycleData={hasConfirmedCycleData}
              intercourseThisCycle={intercourseThisCycle}
              longest={longestCycle}
              shortest={shortestCycle}
              trend={cycleLengthTrend}
            />
          ) : null}
        </ScrollView>
      </Animated.View>

      <HawaPremiumBottomSheet onClose={() => setPremiumVisible(false)} visible={premiumVisible} />
    </LinearGradient>
  );
}

/* ============================================================
   SUMMARY TAB
============================================================ */

function SummaryTab({
  currentCycleDay,
  fertileRange,
  ovulationDate,
  averageCycleLength,
  temperatureCount,
  positiveLhCount,
  intercourseThisCycle,
  temperatureTrend,
  hasConfirmedCycleData,
  onConfigureCycle,
}: {
  currentCycleDay: number;
  fertileRange: string;
  ovulationDate: string;
  averageCycleLength: number;
  temperatureCount: number;
  positiveLhCount: number;
  intercourseThisCycle: number;
  temperatureTrend: Array<{ date: string; display: string; scaled: number }>;
  hasConfirmedCycleData: boolean;
  onConfigureCycle: () => void;
}): React.JSX.Element {
  return (
    <>
      <AnimatedSection>
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <SectionHeader
            icon="chart-box-outline"
            subtitle="Ce cycle, en un coup d’œil"
            title="Aperçu"
          />

          {hasConfirmedCycleData ? (
            <View style={styles.kpiGrid}>
              <KpiCard accent="purple" icon="calendar-blank-outline" label="Jour du cycle" value={`Jour ${currentCycleDay}`} />
              <KpiCard accent="green" icon="leaf" label="Fenêtre fertile" value={fertileRange} />
              <KpiCard accent="blue" icon="egg-outline" label="Ovulation estimée" value={ovulationDate} />
              <KpiCard accent="purple" icon="calendar-month-outline" label="Durée moyenne du cycle" value={`${averageCycleLength} j`} />
              <KpiCard accent="pink" icon="thermometer" label="Températures enregistrées" value={String(temperatureCount)} />
              <KpiCard accent="pink" icon="test-tube" label="Tests LH positifs" value={String(positiveLhCount)} />
            </View>
          ) : (
            // Cycle day/fertile window/ovulation/average length all derive
            // from the shared cyclePreferences baseline — until it's really
            // confirmed, that's the app's internal fallback (28-day cycle),
            // not a personalized prediction, so none of the 4 render here.
            <View style={styles.insufficientDataWrap}>
              <View style={styles.insufficientDataIcon}>
                <MaterialDesignIcons color={PURPLE} name="calendar-alert-outline" size={22} />
              </View>
              <Text style={styles.insufficientDataTitle}>Configure ton cycle</Text>
              <Text style={styles.insufficientDataText}>
                Quelques informations sont nécessaires pour estimer ta fenêtre fertile.
              </Text>
              <Pressable
                accessibilityLabel="Configurer mon cycle"
                accessibilityRole="button"
                onPress={onConfigureCycle}
                style={({ pressed }) => [styles.insufficientDataCta, pressed && { opacity: 0.85 }]}
              >
                <MaterialDesignIcons color="#FFFFFF" name="calendar-edit" size={16} />
                <Text style={styles.insufficientDataCtaText}>Configurer mon cycle</Text>
              </Pressable>
              <View style={styles.kpiGrid}>
                <KpiCard accent="pink" icon="thermometer" label="Températures enregistrées" value={String(temperatureCount)} />
                <KpiCard accent="pink" icon="test-tube" label="Tests LH positifs" value={String(positiveLhCount)} />
              </View>
            </View>
          )}
        </View>
      </AnimatedSection>

      <AnimatedSection delay={80}>
        <View style={styles.card}>
          <SectionHeader
            accent="pink"
            icon="chart-bar"
            subtitle="Tes derniers relevés"
            title="Évolution de la température"
          />

          {temperatureTrend.length === 0 ? (
            <EmptyState
              icon="thermometer"
              text="Enregistre ta température basale dans ton journal pour voir son évolution."
            />
          ) : (
            <View style={styles.chart}>
              {temperatureTrend.map((item, index) => (
                <TrendBar
                  delay={index * 45}
                  key={item.date}
                  label={dateLabel(item.date)}
                  maxValue={10}
                  value={item.scaled}
                />
              ))}
            </View>
          )}
        </View>
      </AnimatedSection>

      <AnimatedSection delay={120}>
        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <View style={styles.statusIconPurple}>
              <MaterialDesignIcons color={PURPLE} name="heart-outline" size={23} />
            </View>
            <Text style={styles.statusLabel}>Rapports ce cycle</Text>
            <Text numberOfLines={2} style={styles.statusValue}>
              {intercourseThisCycle}
            </Text>
          </View>

          {hasConfirmedCycleData ? (
            <View style={styles.statusCard}>
              <View style={styles.statusIconPink}>
                <MaterialDesignIcons color={PINK} name="egg-outline" size={23} />
              </View>
              <Text style={styles.statusLabel}>Ovulation estimée</Text>
              <Text numberOfLines={2} style={styles.statusValue}>
                {ovulationDate}
              </Text>
            </View>
          ) : null}
        </View>
      </AnimatedSection>

      <AnimatedSection delay={160}>
        <View style={styles.adviceCard}>
          <View style={styles.adviceGlow} />
          <View style={styles.adviceIcon}>
            <MaterialDesignIcons color={PURPLE} name="information-outline" size={22} />
          </View>
          <View style={styles.adviceCopy}>
            <Text style={styles.adviceTitle}>Un repère, pas un diagnostic</Text>
            <Text style={styles.adviceText}>
              Ces estimations sont un repère personnel basé sur ton suivi. Elles
              ne garantissent pas une grossesse et ne remplacent pas un avis
              médical.
            </Text>
          </View>
        </View>
      </AnimatedSection>
    </>
  );
}

/* ============================================================
   TEMPERATURE TAB
============================================================ */

function TemperatureTab({
  latest,
  latestDate,
  average,
  min,
  max,
  trend,
  count,
}: {
  latest: number | null;
  latestDate: string | undefined;
  average: number | null;
  min: number | null;
  max: number | null;
  trend: Array<{ date: string; display: string; scaled: number }>;
  // True total of recorded measurements within the selected period — NOT
  // `trend.length`, which the chart above caps at TREND_DISPLAY_CAP purely
  // for readability (same convention as the Summary tab's own
  // "Températures enregistrées" KPI).
  count: number;
}): React.JSX.Element {
  if (trend.length === 0) {
    return (
      <AnimatedSection>
        <View style={styles.card}>
          <SectionHeader icon="thermometer" title="Température basale" />
          <EmptyState
            icon="thermometer"
            text="Enregistre ta température basale chaque matin pour suivre son évolution."
          />
        </View>
      </AnimatedSection>
    );
  }

  return (
    <>
      <AnimatedSection>
        <View style={styles.kpiGrid}>
          <KpiCard accent="pink" icon="thermometer" label="Dernière température" value={latest !== null ? `${latest.toFixed(1)}°` : '—'} />
          <KpiCard accent="purple" icon="calendar-check-outline" label="Relevés enregistrés" value={String(count)} />
          <KpiCard accent="blue" icon="chart-line" label="Moyenne" value={average !== null ? `${average.toFixed(1)}°` : '—'} />
          <KpiCard accent="green" icon="arrow-collapse-vertical" label="Min / Max" value={min !== null && max !== null ? `${min.toFixed(1)}° / ${max.toFixed(1)}°` : '—'} />
        </View>
      </AnimatedSection>

      <AnimatedSection delay={70}>
        <View style={styles.card}>
          <SectionHeader
            accent="pink"
            icon="chart-bar"
            subtitle={latestDate ? `Dernier relevé : ${dateLabel(latestDate)}` : undefined}
            title="Évolution de la température"
          />
          <View style={styles.chart}>
            {trend.map((item, index) => (
              <TrendBar
                delay={index * 50}
                key={item.date}
                label={dateLabel(item.date)}
                maxValue={10}
                value={item.scaled}
              />
            ))}
          </View>
        </View>
      </AnimatedSection>

      <AnimatedSection delay={110}>
        <View style={styles.softInfoCard}>
          <View style={styles.softInfoIcon}>
            <MaterialDesignIcons color={PINK} name="information-outline" size={18} />
          </View>
          <Text style={styles.softInfoText}>
            L’échelle du graphique est ajustée à tes propres relevés pour
            mieux voir les variations — les valeurs exactes restent
            affichées au-dessus.
          </Text>
        </View>
      </AnimatedSection>
    </>
  );
}

/* ============================================================
   FERTILITY TAB (Glaire cervicale + Tests LH)
============================================================ */

function FertilityTab({
  positiveLhCount,
  latestLhLabel,
  latestLhDate,
  lhCounts,
  maxLhCount,
  lhMonthlyTrend,
  latestMucusLabel,
  latestMucusDate,
  mucusCounts,
  maxMucusCount,
  mucusTimeline,
  showLongitudinalView,
  periodLabel,
}: {
  positiveLhCount: number;
  latestLhLabel: string | undefined;
  latestLhDate: string | undefined;
  lhCounts: Array<{ label: string; count: number }>;
  maxLhCount: number;
  lhMonthlyTrend: Array<{ monthKey: string; monthLabel: string; positiveCount: number; totalCount: number }>;
  latestMucusLabel: string | undefined;
  latestMucusDate: string | undefined;
  mucusCounts: Array<{ label: string; count: number }>;
  maxMucusCount: number;
  mucusTimeline: Array<{ date: string; type: CervicalMucusType; order: number }>;
  showLongitudinalView: boolean;
  periodLabel: string;
}): React.JSX.Element {
  const hasAnyData = lhCounts.length > 0 || mucusCounts.length > 0;

  if (!hasAnyData) {
    return (
      <AnimatedSection>
        <View style={styles.card}>
          <SectionHeader icon="egg-outline" title="Fertilité" />
          <EmptyState
            icon="egg-outline"
            text="Enregistre tes tests d’ovulation et tes observations de glaire cervicale pour voir tes tendances ici."
          />
        </View>
      </AnimatedSection>
    );
  }

  return (
    <>
      <AnimatedSection>
        <View style={styles.kpiGrid}>
          <KpiCard accent="pink" icon="test-tube" label="Tests LH positifs" value={String(positiveLhCount)} />
          <KpiCard accent="purple" icon="calendar-check-outline" label="Dernier test LH" value={latestLhLabel ?? '—'} />
        </View>
      </AnimatedSection>

      <AnimatedSection delay={60}>
        <View style={styles.card}>
          <SectionHeader
            accent="pink"
            icon="chart-donut"
            subtitle={latestLhDate ? `Dernier test : ${dateLabel(latestLhDate)}` : 'Selon tes entrées'}
            title="Résultats des tests LH"
          />
          {lhCounts.length === 0 ? (
            <EmptyState icon="test-tube" text="Enregistre tes tests d’ovulation pour voir leur répartition." />
          ) : (
            <View style={styles.distributionList}>
              {lhCounts.map((item, index) => (
                <DistributionRow
                  accent="pink"
                  count={item.count}
                  key={item.label}
                  label={item.label}
                  last={index === lhCounts.length - 1}
                  maxCount={maxLhCount}
                />
              ))}
            </View>
          )}
        </View>
      </AnimatedSection>

      {showLongitudinalView ? (
        <AnimatedSection delay={80}>
          <View
            accessibilityLabel={`Évolution des tests LH sur ${periodLabel}`}
            style={styles.card}
          >
            <SectionHeader
              accent="pink"
              icon="chart-timeline-variant"
              subtitle="Tes résultats enregistrés au fil du temps."
              title="Évolution des tests LH"
            />
            {(() => {
              const totalLhTests = lhMonthlyTrend.reduce((total, month) => total + month.totalCount, 0);
              if (totalLhTests < 2) {
                return (
                  <EmptyState
                    icon="test-tube"
                    text="Pas encore assez de données pour afficher une évolution des tests LH."
                  />
                );
              }
              return (
                <>
                  <View style={styles.chart}>
                    {lhMonthlyTrend.map((month, index) => (
                      <TrendBar
                        delay={index * 45}
                        key={month.monthKey}
                        label={month.monthLabel.slice(0, 3)}
                        maxValue={Math.max(...lhMonthlyTrend.map(item => item.positiveCount), 1)}
                        value={month.positiveCount}
                      />
                    ))}
                  </View>
                  <Text style={styles.softInfoText}>
                    Hauteur des barres = nombre de tests LH positifs enregistrés
                    ce mois-ci, sur {totalLhTests} test{totalLhTests > 1 ? 's' : ''} au total sur {periodLabel}.
                  </Text>
                </>
              );
            })()}
          </View>
        </AnimatedSection>
      ) : null}

      <AnimatedSection delay={100}>
        <View style={styles.card}>
          <SectionHeader
            accent="green"
            icon="water-outline"
            subtitle={latestMucusDate ? `Dernière observation : ${dateLabel(latestMucusDate)} · ${latestMucusLabel ?? ''}` : 'Selon tes entrées'}
            title="Glaire cervicale"
          />
          {mucusCounts.length === 0 ? (
            <EmptyState icon="water-outline" text="Enregistre tes observations de glaire cervicale pour voir leur répartition." />
          ) : (
            <View style={styles.distributionList}>
              {mucusCounts.map((item, index) => (
                <DistributionRow
                  accent="green"
                  count={item.count}
                  key={item.label}
                  label={item.label}
                  last={index === mucusCounts.length - 1}
                  maxCount={maxMucusCount}
                />
              ))}
            </View>
          )}
        </View>
      </AnimatedSection>

      {showLongitudinalView ? (
        <AnimatedSection delay={120}>
          <View
            accessibilityLabel={`Évolution de la glaire cervicale sur ${periodLabel}`}
            style={styles.card}
          >
            <SectionHeader
              accent="green"
              icon="chart-timeline-variant"
              subtitle="Tes observations enregistrées au fil du temps."
              title="Évolution de la glaire cervicale"
            />
            {mucusTimeline.length < 2 ? (
              <EmptyState
                icon="water-outline"
                text="Pas encore assez de données pour afficher une évolution de la glaire cervicale."
              />
            ) : (
              <>
                <View style={styles.chart}>
                  {mucusTimeline.map((item, index) => (
                    <TrendBar
                      delay={index * 40}
                      key={item.date}
                      label={dateLabel(item.date)}
                      maxValue={4}
                      value={item.order}
                    />
                  ))}
                </View>
                <Text style={styles.softInfoText}>
                  Repère visuel : plus la barre est haute, plus l’observation
                  se rapproche du type "{MUCUS_LABEL.eggWhite}" — de gauche à
                  droite : {MUCUS_LABEL.dry}, {MUCUS_LABEL.sticky}, {MUCUS_LABEL.creamy}, {MUCUS_LABEL.watery}, {MUCUS_LABEL.eggWhite}.
                </Text>
              </>
            )}
          </View>
        </AnimatedSection>
      ) : null}

      <AnimatedSection delay={140}>
        <View style={styles.softInfoCard}>
          <View style={styles.softInfoIcon}>
            <MaterialDesignIcons color={PINK} name="heart-outline" size={18} />
          </View>
          <Text style={styles.softInfoText}>
            Ce suivi est un repère personnel. Un test positif n’est pas une
            garantie de conception.
          </Text>
        </View>
      </AnimatedSection>
    </>
  );
}

/* ============================================================
   CYCLE TAB
============================================================ */

function CycleTab({
  trend,
  averageLength,
  shortest,
  longest,
  intercourseThisCycle,
  hasConfirmedCycleData,
}: {
  trend: Array<{ date: string; value: number }>;
  averageLength: number;
  shortest: number | null;
  longest: number | null;
  intercourseThisCycle: number;
  hasConfirmedCycleData: boolean;
}): React.JSX.Element {
  const maxLength = Math.max(...trend.map(item => item.value), 1);

  return (
    <>
      <AnimatedSection>
        <View style={styles.kpiGrid}>
          {/* Without real history (trend.length === 0, always true until
              cycle data is confirmed), averageLength silently falls back to
              the internal cyclePreferences default — show "—" instead of
              presenting that constant as a personalized average. */}
          <KpiCard accent="purple" icon="calendar-month-outline" label="Durée moyenne" value={hasConfirmedCycleData ? `${averageLength} j` : '—'} />
          <KpiCard accent="blue" icon="arrow-collapse-vertical" label="Plus court / plus long" value={shortest !== null && longest !== null ? `${shortest} / ${longest} j` : '—'} />
          <KpiCard accent="pink" icon="heart-outline" label="Rapports ce cycle" value={String(intercourseThisCycle)} />
        </View>
      </AnimatedSection>

      <AnimatedSection delay={70}>
        <View style={styles.card}>
          <SectionHeader
            accent="blue"
            icon="chart-bar"
            subtitle="Durée de tes derniers cycles"
            title="Évolution du cycle"
          />
          {trend.length === 0 ? (
            <EmptyState
              icon="calendar-month-outline"
              text="Enregistre le début de tes règles pour voir l’évolution de la durée de ton cycle."
            />
          ) : (
            <View style={styles.chart}>
              {trend.map((item, index) => (
                <TrendBar
                  delay={index * 50}
                  key={item.date}
                  label={dateLabel(item.date)}
                  maxValue={maxLength}
                  value={item.value}
                />
              ))}
            </View>
          )}
        </View>
      </AnimatedSection>

      <AnimatedSection delay={110}>
        <View style={styles.softInfoCard}>
          <View style={styles.softInfoIconPurple}>
            <MaterialDesignIcons color={PURPLE} name="information-outline" size={18} />
          </View>
          <Text style={styles.softInfoText}>
            La durée de ton cycle peut varier naturellement d’un mois à
            l’autre — ce suivi t’aide à observer tes propres tendances.
          </Text>
        </View>
      </AnimatedSection>
    </>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BACKGROUND },

  pageBackgroundDecor: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
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

  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 11,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#4A318A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 3,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: { marginTop: 2, color: TEXT_SECONDARY, fontSize: 10.5 },
  headerBadgeIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: PURPLE_SOFT,
  },

  objectiveCard: {
    ...homeShadow,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 3,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  objectiveIcon: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: PURPLE_SOFT,
  },
  objectiveCopy: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  objectiveLabel: {
    color: '#9A86B8',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.05,
  },
  objectiveValue: {
    marginTop: 2,
    color: PURPLE_DARK,
    fontSize: 12.5,
    fontWeight: '700',
  },
  objectiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#80B98F' },

  periodFilters: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 11,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.05)',
    borderRadius: 17,
    backgroundColor: '#EEE8F5',
  },
  periodFilterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    borderRadius: 13,
  },
  periodFilterButtonActive: {
    ...homeShadow,
    backgroundColor: '#FFFFFF',
  },
  periodFilterButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  periodFilterText: { color: TEXT_SECONDARY, fontSize: 10.5, fontWeight: '700' },
  periodFilterTextActive: { color: PURPLE, fontWeight: '800' },

  tabsScroll: { flexGrow: 0, marginTop: 11 },
  tabsScrollContent: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  tabPill: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 15,
    backgroundColor: 'transparent',
  },
  tabPillActive: {
    borderColor: 'rgba(105,73,190,0.10)',
    backgroundColor: PURPLE_SOFT,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 2,
  },
  tabPillText: { color: '#8D809E', fontSize: 11.5, fontWeight: '700' },
  tabPillTextActive: { color: PURPLE, fontWeight: '800' },
  tabPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },

  tabContent: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 1 },

  card: {
    ...homeShadow,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 25,
    backgroundColor: CARD,
    shadowColor: '#4A318A',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.06,
    shadowRadius: 17,
    elevation: 4,
  },

  heroCard: {
    ...homeShadow,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 28,
    backgroundColor: CARD,
  },
  heroGlowOne: {
    position: 'absolute',
    top: -65,
    right: -35,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(183,156,231,0.11)',
  },
  heroGlowTwo: {
    position: 'absolute',
    bottom: -70,
    left: -50,
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: 'rgba(237,190,211,0.08)',
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  sectionIcon: {
    width: 39,
    height: 39,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 14,
  },
  sectionHeaderCopy: { flex: 1, minWidth: 0 },
  cardTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 16.5,
    fontWeight: '800',
  },
  cardSubtitle: { marginTop: 2, color: TEXT_SECONDARY, fontSize: 10, lineHeight: 14 },

  kpiGrid: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
  },

  insufficientDataWrap: { alignItems: 'center', marginTop: 13, paddingVertical: 6 },
  insufficientDataIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: PURPLE_SOFT,
  },
  insufficientDataTitle: {
    marginTop: 11,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
  },
  insufficientDataText: {
    marginTop: 6,
    color: TEXT_SECONDARY,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  insufficientDataCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 15,
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: PURPLE,
    paddingHorizontal: 18,
  },
  insufficientDataCtaText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  kpiCard: {
    width: '48.4%',
    minWidth: 0,
    minHeight: 112,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.07)',
    borderRadius: 19,
    backgroundColor: CARD_SOFT,
  },
  kpiTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kpiIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  kpiDot: { width: 6, height: 6, borderRadius: 3, opacity: 0.5 },
  kpiValue: { marginTop: 11, color: PURPLE_DARK, fontSize: 20, fontWeight: '800' },
  kpiLabel: { marginTop: 3, color: TEXT_SECONDARY, fontSize: 9.7, lineHeight: 13 },

  chart: { height: 155, marginTop: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  barColumn: { flex: 1, minWidth: 0, height: '100%', alignItems: 'center' },
  barTrack: {
    position: 'relative',
    flex: 1,
    width: '62%',
    minWidth: 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginVertical: 6,
    borderRadius: 9,
    backgroundColor: '#F0E9F7',
  },
  barFill: { width: '100%', minHeight: 6, borderRadius: 9, backgroundColor: '#8D6BD4' },
  barShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  barLabel: { color: TEXT_SECONDARY, fontSize: 7.5, textAlign: 'center' },

  statusGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  statusCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 135,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    ...homeShadow,
  },
  statusIconPurple: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: PURPLE_SOFT,
  },
  statusIconPink: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: PINK_SOFT,
  },
  statusLabel: { marginTop: 11, color: TEXT_SECONDARY, fontSize: 9.5, fontWeight: '600' },
  statusValue: {
    marginTop: 4,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },

  adviceCard: {
    ...homeShadow,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 22,
    backgroundColor: '#F4EDFC',
  },
  adviceGlow: {
    position: 'absolute',
    right: -35,
    top: -45,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  adviceIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.80)',
  },
  adviceCopy: { flex: 1, minWidth: 0 },
  adviceTitle: { color: PURPLE_DARK, fontFamily: 'serif', fontSize: 14.5, fontWeight: '800' },
  adviceText: { marginTop: 3, color: TEXT_SECONDARY, fontSize: 10.5, lineHeight: 15 },

  distributionList: { marginTop: 11 },
  distributionRow: {
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECE5F1',
  },
  lastRow: { borderBottomWidth: 0 },
  distributionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  distributionLabel: {
    flex: 1,
    minWidth: 0,
    color: PURPLE_DARK,
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 15,
  },
  distributionBadge: {
    flexShrink: 0,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#F4EFF9',
  },
  distributionCount: { color: TEXT_SECONDARY, fontSize: 8.7, fontWeight: '700' },
  distributionTrack: {
    height: 7,
    overflow: 'hidden',
    marginTop: 8,
    borderRadius: 4,
    backgroundColor: '#EFE9F5',
  },
  distributionFill: { height: '100%', borderRadius: 4 },

  empty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 14 },
  emptyIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F2EBFA',
  },
  emptyTitle: {
    marginTop: 12,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    maxWidth: 285,
    marginTop: 5,
    color: TEXT_SECONDARY,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
  },

  softInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.07)',
    borderRadius: 18,
    backgroundColor: '#F5F0FB',
  },
  softInfoIcon: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: PINK_SOFT,
  },
  softInfoIconPurple: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: PURPLE_SOFT,
  },
  softInfoText: { flex: 1, minWidth: 0, color: TEXT_SECONDARY, fontSize: 10.3, lineHeight: 15 },

  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
});

export default ConceiveStatisticsScreen;
