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
  type StyleProp,
  type ViewStyle,
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

import {
  getAllMiscarriageJournalEntries,
  hydrateMiscarriageJournal,
  subscribeMiscarriageJournal,
  type MiscarriageJournalEntry,
} from '../../state/miscarriageJournalStore';

import {
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  subscribeMiscarriagePreferences,
  type MiscarriageCycleReturnStatus,
  type MiscarriageTryingAgainStatus,
} from '../../state/miscarriagePreferences';

import {
  MISCARRIAGE_BLEEDING_OPTIONS,
  MISCARRIAGE_PHYSICAL_SYMPTOMS,
  MISCARRIAGE_TRYING_AGAIN_OPTIONS,
} from '../../config/miscarriageJournalConfig';

import { diffDays, startOfDay } from '../../utils/cycleMath';
import { getMiscarriageTryingAgainDisplay } from '../../utils/miscarriageTryingAgainDisplay';

import { usePremium } from '../../hooks/usePremium';
import { HawaPremiumBottomSheet } from '../../components/premium/HawaPremiumBottomSheet';
import StatisticsPeriodSelector from '../../components/statistics/StatisticsPeriodSelector';
import {
  cutoffDateForPeriod,
  formatMonthLabel,
  coverageMonthsForAnchor,
  describeMonthsCoverage,
  type StatisticsPeriod,
} from '../../utils/cycleStatisticsMath';

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

type TabKey = 'summary' | 'bleeding' | 'symptoms' | 'tracking';

/* ============================================================
   TABS
============================================================ */

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: IconName;
}> = [
  {
    key: 'summary',
    label: 'Résumé',
    icon: 'chart-box-outline',
  },
  {
    key: 'bleeding',
    label: 'Saignements',
    icon: 'water-outline',
  },
  {
    key: 'symptoms',
    label: 'Symptômes',
    icon: 'heart-pulse',
  },
  {
    key: 'tracking',
    label: 'Suivi',
    icon: 'notebook-heart-outline',
  },
];

/* ============================================================
   LABELS
============================================================ */

const CYCLE_RETURN_LABELS: Record<MiscarriageCycleReturnStatus, string> = {
  no: 'Pas encore revenu',
  yes: 'Revenu',
  unknown: 'Je ne sais pas encore',
};

const TRYING_AGAIN_LABELS: Record<MiscarriageTryingAgainStatus, string> = {
  not_now: 'Pas maintenant',
  soon: 'Bientôt',
  ready: 'Prête à reprendre',
};

/* ============================================================
   FORMATTERS
============================================================ */

const dateLabel = (date: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));

const formatFullDate = (date: Date): string =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

/* ============================================================
   HELPERS
============================================================ */

function countByOption<T extends MiscarriageJournalEntry>(
  entries: T[],
  field: keyof T,
  options: string[],
): Array<{
  label: string;
  count: number;
}> {
  const counts = new Map<string, number>();

  entries.forEach(entry => {
    const value = entry[field] as unknown as string;

    if (!value) {
      return;
    }

    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return options
    .map(label => ({
      label,
      count: counts.get(label) ?? 0,
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

function countBySymptom(entries: MiscarriageJournalEntry[]): Array<{
  label: string;
  count: number;
}> {
  const counts = new Map<string, number>();

  entries.forEach(entry => {
    entry.physicalSymptoms?.forEach(symptom => {
      counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
    });
  });

  return MISCARRIAGE_PHYSICAL_SYMPTOMS.map(label => ({
    label,
    count: counts.get(label) ?? 0,
  }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

/* ============================================================
   MONTHLY HISTORY HELPERS (Premium — descriptive only, never
   predictive: groups real recorded entries by calendar month,
   omitting any month with no real entries)
============================================================ */

function groupBleedingByMonth(entries: MiscarriageJournalEntry[]): Array<{
  month: string;
  label: string;
  value: number;
}> {
  const buckets = new Map<string, number[]>();

  entries.forEach(entry => {
    if (!entry.bleeding) {
      return;
    }

    const intensity =
      MISCARRIAGE_BLEEDING_OPTIONS.indexOf(entry.bleeding as string) + 1;

    if (intensity <= 0) {
      return;
    }

    const key = entry.date.slice(0, 7);
    const values = buckets.get(key) ?? [];

    values.push(intensity);
    buckets.set(key, values);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => ({
      month: key,
      label: formatMonthLabel(key),
      value: values.reduce((sum, item) => sum + item, 0) / values.length,
    }));
}

function groupSymptomsByMonth(entries: MiscarriageJournalEntry[]): Array<{
  month: string;
  label: string;
  daysCount: number;
  mostFrequent: string | undefined;
}> {
  const buckets = new Map<string, MiscarriageJournalEntry[]>();

  entries.forEach(entry => {
    const key = entry.date.slice(0, 7);
    const list = buckets.get(key) ?? [];

    list.push(entry);
    buckets.set(key, list);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, monthEntries]) => ({
      month: key,
      label: formatMonthLabel(key),
      daysCount: monthEntries.length,
      mostFrequent: countBySymptom(monthEntries)[0]?.label,
    }));
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
    purple: {
      bg: PURPLE_SOFT,
      color: PURPLE,
    },
    pink: {
      bg: PINK_SOFT,
      color: PINK,
    },
    green: {
      bg: GREEN_SOFT,
      color: GREEN,
    },
    blue: {
      bg: BLUE_SOFT,
      color: BLUE,
    },
  }[accent];

  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          {
            backgroundColor: palette.bg,
          },
        ]}
      >
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
    purple: {
      bg: PURPLE_SOFT,
      color: PURPLE,
    },
    pink: {
      bg: PINK_SOFT,
      color: PINK,
    },
    green: {
      bg: GREEN_SOFT,
      color: GREEN,
    },
    blue: {
      bg: BLUE_SOFT,
      color: BLUE,
    },
  }[accent];

  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiTop}>
        <View
          style={[
            styles.kpiIcon,
            {
              backgroundColor: palette.bg,
            },
          ]}
        >
          <MaterialDesignIcons color={palette.color} name={icon} size={19} />
        </View>

        <View
          style={[
            styles.kpiDot,
            {
              backgroundColor: palette.color,
            },
          ]}
        />
      </View>

      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.kpiValue}>
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

  const palette = {
    purple: PURPLE,
    pink: PINK,
    green: GREEN,
    blue: BLUE,
  }[accent];

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
          style={[
            styles.distributionFill,
            {
              width,
              backgroundColor: palette,
            },
          ]}
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
  columnStyle,
}: {
  label: string;
  value: number;
  maxValue: number;
  delay: number;
  columnStyle?: StyleProp<ViewStyle>;
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
    <View style={[styles.barColumn, columnStyle]}>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              height,
            },
          ]}
        />

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

function MiscarriageStatisticsScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<TabKey>('summary');

  const [prefs, setPrefs] = useState(getMiscarriagePreferences);

  const [journalEntries, setJournalEntries] = useState<
    Record<string, MiscarriageJournalEntry>
  >({});

  const { isPremium } = usePremium();

  const [premiumVisible, setPremiumVisible] = useState(false);

  const [period, setPeriod] = useState<StatisticsPeriod>('1');

  const [now, setNow] = useState<Date>(() => new Date());

  const tabAnimation = useRef(new Animated.Value(1)).current;

  /* ==========================================================
     HYDRATION
  ========================================================== */

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setNow(new Date());

      hydrateMiscarriagePreferences().then(value => {
        if (active) {
          setPrefs(value);
        }
      });

      const unsubPrefs = subscribeMiscarriagePreferences(() => {
        if (active) {
          setPrefs(getMiscarriagePreferences());
        }
      });

      hydrateMiscarriageJournal().then(() => {
        if (active) {
          setJournalEntries(getAllMiscarriageJournalEntries());
        }
      });

      const unsubJournal = subscribeMiscarriageJournal(() => {
        if (active) {
          setJournalEntries(getAllMiscarriageJournalEntries());
        }
      });

      return () => {
        active = false;
        unsubPrefs();
        unsubJournal();
      };
    }, []),
  );

  /* ==========================================================
     DATE
  ========================================================== */

  const miscarriageDate = useMemo(
    () =>
      prefs.miscarriageDate
        ? startOfDay(new Date(`${prefs.miscarriageDate}T12:00:00`))
        : null,
    [prefs.miscarriageDate],
  );

  const daysSinceEvent = useMemo(
    () =>
      miscarriageDate
        ? Math.max(0, diffDays(startOfDay(new Date()), miscarriageDate))
        : null,
    [miscarriageDate],
  );

  const firstReturnedPeriodDate = useMemo(
    () =>
      prefs.firstReturnedPeriodDate
        ? new Date(`${prefs.firstReturnedPeriodDate}T12:00:00`)
        : null,
    [prefs.firstReturnedPeriodDate],
  );

  /* ==========================================================
     JOURNAL DATA
  ========================================================== */

  const journalDays = useMemo(
    () =>
      Object.values(journalEntries).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    [journalEntries],
  );

  /* Real 1/3/6/12-month date-window filter — mirrors
     cycleStatisticsMath's filterEntriesForPeriod, applied here to
     MiscarriageJournalEntry (a different shape from DailyJournalEntry, so
     the shared helper's generic type can't be reused directly). Applies
     uniformly to every tab below, replacing the previous "last 10
     entries" free-tier cap with a real 1-month window and the previous
     unconditional "full history" premium view with a real 3/6/12-month
     window. */
  const periodJournalDays = useMemo(() => {
    const cutoff = cutoffDateForPeriod(period, now);

    return journalDays.filter(entry => {
      const entryDate = new Date(`${entry.date}T12:00:00`);

      return (
        entryDate.getTime() >= cutoff.getTime() &&
        entryDate.getTime() <= now.getTime()
      );
    });
  }, [journalDays, period, now]);

  const showMonthlyView = period !== '1';

  const trackedDays = useMemo(
    () =>
      periodJournalDays.filter(
        entry =>
          Boolean(entry.bleeding) ||
          Boolean(entry.physicalSymptoms?.length) ||
          Boolean(entry.personalNotes?.trim()) ||
          Boolean(entry.tryingAgain),
      ).length,
    [periodJournalDays],
  );

  const completeDays = useMemo(
    () =>
      periodJournalDays.filter(
        entry =>
          Boolean(entry.bleeding) &&
          Boolean(entry.physicalSymptoms?.length) &&
          Boolean(entry.personalNotes?.trim()) &&
          Boolean(entry.tryingAgain),
      ).length,
    [periodJournalDays],
  );

  const bleedingEntries = useMemo(
    () => periodJournalDays.filter(entry => entry.bleeding),
    [periodJournalDays],
  );

  const bleedingCounts = useMemo(
    () =>
      countByOption(bleedingEntries, 'bleeding', MISCARRIAGE_BLEEDING_OPTIONS),
    [bleedingEntries],
  );

  const mostFrequentBleeding = bleedingCounts[0]?.label;

  const maxBleedingCount = Math.max(
    ...bleedingCounts.map(item => item.count),
    1,
  );

  const bleedingTrend = useMemo(
    () =>
      bleedingEntries.map(entry => ({
        date: entry.date,

        value:
          MISCARRIAGE_BLEEDING_OPTIONS.indexOf(entry.bleeding as string) + 1,
      })),
    [bleedingEntries],
  );

  const symptomEntries = useMemo(
    () => periodJournalDays.filter(entry => entry.physicalSymptoms?.length),
    [periodJournalDays],
  );

  const symptomCounts = useMemo(
    () => countBySymptom(symptomEntries),
    [symptomEntries],
  );

  const mostFrequentSymptom = symptomCounts[0]?.label;

  const maxSymptomCount = Math.max(...symptomCounts.map(item => item.count), 1);

  const notesEntries = useMemo(
    () => periodJournalDays.filter(entry => entry.personalNotes?.trim()),
    [periodJournalDays],
  );

  const tryingAgainEntries = useMemo(
    () => periodJournalDays.filter(entry => entry.tryingAgain),
    [periodJournalDays],
  );

  const tryingAgainCounts = useMemo(
    () =>
      countByOption(
        tryingAgainEntries,
        'tryingAgain',
        MISCARRIAGE_TRYING_AGAIN_OPTIONS.map(option => option.id),
      ).map(item => ({
        label:
          TRYING_AGAIN_LABELS[item.label as MiscarriageTryingAgainStatus] ??
          item.label,

        count: item.count,
      })),
    [tryingAgainEntries],
  );

  const maxTryingAgainCount = Math.max(
    ...tryingAgainCounts.map(item => item.count),
    1,
  );

  /* ==========================================================
     PREMIUM — HISTORY BY MONTH, WITHIN THE SELECTED WINDOW
     (descriptive only, never predictive)
  ========================================================== */

  const bleedingMonthlyTrend = useMemo(
    () => groupBleedingByMonth(bleedingEntries),
    [bleedingEntries],
  );

  const symptomsMonthlyHistory = useMemo(
    () => groupSymptomsByMonth(symptomEntries),
    [symptomEntries],
  );

  /* ==========================================================
     COVERAGE MESSAGING
     A loss's tracking naturally has less than 12 months of real
     history when the miscarriage was recent — this is displayed as
     information, never as an error, and never backfilled with fake
     zeros.
  ========================================================== */

  const coverageMonths = useMemo(
    () => coverageMonthsForAnchor(period, miscarriageDate, now),
    [period, miscarriageDate, now],
  );

  const coverageMessage = useMemo(
    () => describeMonthsCoverage(period, coverageMonths),
    [period, coverageMonths],
  );

  /* ==========================================================
     TAB CHANGE
  ========================================================== */

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
        style={[
          styles.header,
          {
            paddingTop: getTopPadding(insets.top, true),
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          hitSlop={10}
          onPress={navigation.goBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialDesignIcons
            color={PURPLE_DARK}
            name="chevron-left"
            size={25}
          />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Statistiques</Text>

          <Text style={styles.headerSubtitle}>Ton évolution, à ton rythme</Text>
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
            <MaterialDesignIcons
              color={PURPLE}
              name="flower-outline"
              size={20}
            />
          </View>

          <View style={styles.objectiveCopy}>
            <Text style={styles.objectiveLabel}>OBJECTIF ACTUEL</Text>

            <Text style={styles.objectiveValue}>Après une fausse couche</Text>
          </View>

          <View style={styles.objectiveDot} />
        </View>
      </AnimatedSection>

      {/* PERIOD SELECTOR — 1 mois (Free), 3/6/12 mois (Premium) */}

      <AnimatedSection delay={60}>
        <View style={styles.periodSelectorWrap}>
          <StatisticsPeriodSelector
            isPremium={isPremium}
            onRequestPremium={() => setPremiumVisible(true)}
            onSelectPeriod={setPeriod}
            period={period}
          />

          {coverageMessage ? (
            <Text style={styles.coverageText}>{coverageMessage}</Text>
          ) : null}
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
                accessibilityState={{
                  selected: active,
                }}
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
                  style={[
                    styles.tabPillText,
                    active && styles.tabPillTextActive,
                  ]}
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
            {
              paddingBottom: getBottomPadding(insets.bottom, spacing.xl) + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'summary' ? (
            <SummaryTab
              bleedingCount={bleedingEntries.length}
              bleedingMonthlyTrend={bleedingMonthlyTrend}
              bleedingTrend={bleedingTrend}
              completeDays={completeDays}
              cycleReturnLabel={
                prefs.cycleReturnStatus
                  ? CYCLE_RETURN_LABELS[prefs.cycleReturnStatus]
                  : 'Non renseigné'
              }
              daysSinceEvent={daysSinceEvent}
              firstReturnedPeriodDate={firstReturnedPeriodDate}
              showMonthlyView={showMonthlyView}
              symptomsCount={symptomEntries.length}
              trackedDays={trackedDays}
              tryingAgainLabel={
                getMiscarriageTryingAgainDisplay(prefs.tryingAgainStatus).label
              }
            />
          ) : null}

          {tab === 'bleeding' ? (
            <BleedingTab
              counts={bleedingCounts}
              entriesCount={bleedingEntries.length}
              maxCount={maxBleedingCount}
              monthlyTrend={bleedingMonthlyTrend}
              mostFrequent={mostFrequentBleeding}
              showMonthlyView={showMonthlyView}
              trend={bleedingTrend}
            />
          ) : null}

          {tab === 'symptoms' ? (
            <SymptomsTab
              counts={symptomCounts}
              entriesCount={symptomEntries.length}
              maxCount={maxSymptomCount}
              monthlyHistory={symptomsMonthlyHistory}
              mostFrequent={mostFrequentSymptom}
              showMonthlyView={showMonthlyView}
            />
          ) : null}

          {tab === 'tracking' ? (
            <TrackingTab
              cycleReturnLabel={
                prefs.cycleReturnStatus
                  ? CYCLE_RETURN_LABELS[prefs.cycleReturnStatus]
                  : 'Non renseigné'
              }
              firstReturnedPeriodDate={firstReturnedPeriodDate}
              maxTryingAgainCount={maxTryingAgainCount}
              notesCount={notesEntries.length}
              tryingAgainCounts={tryingAgainCounts}
              tryingAgainLabel={
                getMiscarriageTryingAgainDisplay(prefs.tryingAgainStatus).label
              }
            />
          ) : null}
        </ScrollView>
      </Animated.View>

      <HawaPremiumBottomSheet
        onClose={() => setPremiumVisible(false)}
        visible={premiumVisible}
      />
    </LinearGradient>
  );
}

/* ============================================================
   SUMMARY TAB
============================================================ */

function SummaryTab({
  daysSinceEvent,
  trackedDays,
  completeDays,
  bleedingCount,
  symptomsCount,
  bleedingTrend,
  bleedingMonthlyTrend,
  showMonthlyView,
  cycleReturnLabel,
  firstReturnedPeriodDate,
  tryingAgainLabel,
}: {
  daysSinceEvent: number | null;
  trackedDays: number;
  completeDays: number;
  bleedingCount: number;
  symptomsCount: number;

  bleedingTrend: Array<{
    date: string;
    value: number;
  }>;

  bleedingMonthlyTrend: Array<{
    month: string;
    label: string;
    value: number;
  }>;

  showMonthlyView: boolean;

  cycleReturnLabel: string;

  firstReturnedPeriodDate: Date | null;

  tryingAgainLabel: string;
}): React.JSX.Element {
  return (
    <>
      <AnimatedSection>
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />

          <View style={styles.heroGlowTwo} />

          <SectionHeader
            icon="chart-box-outline"
            subtitle="Depuis l’événement"
            title="Aperçu"
          />

          <View style={styles.kpiGrid}>
            <KpiCard
              accent="purple"
              icon="calendar-heart"
              label="Jours depuis l’événement"
              value={daysSinceEvent === null ? '—' : String(daysSinceEvent)}
            />

            <KpiCard
              accent="blue"
              icon="notebook-outline"
              label="Jours de suivi"
              value={String(trackedDays)}
            />

            <KpiCard
              accent="green"
              icon="check-decagram-outline"
              label="Journées complètes"
              value={String(completeDays)}
            />

            <KpiCard
              accent="pink"
              icon="water-outline"
              label="Jours avec saignements"
              value={String(bleedingCount)}
            />

            <KpiCard
              accent="purple"
              icon="heart-pulse"
              label="Jours avec symptômes"
              value={String(symptomsCount)}
            />
          </View>
        </View>
      </AnimatedSection>

      <AnimatedSection delay={80}>
        <View style={styles.card}>
          <SectionHeader
            accent="pink"
            icon="chart-bar"
            subtitle={
              showMonthlyView
                ? 'Intensité moyenne, par mois'
                : 'Intensité enregistrée au fil des jours'
            }
            title="Évolution des saignements"
          />

          {showMonthlyView ? (
            bleedingMonthlyTrend.length === 0 ? (
              <EmptyState
                icon="water-outline"
                text="Pas encore assez de données pour un historique mensuel."
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.monthlyChartScroll}
              >
                <View style={styles.monthlyChartContent}>
                  {bleedingMonthlyTrend.map((item, index) => (
                    <TrendBar
                      columnStyle={styles.monthlyBarColumn}
                      delay={index * 35}
                      key={item.month}
                      label={item.label}
                      maxValue={4}
                      value={item.value}
                    />
                  ))}
                </View>
              </ScrollView>
            )
          ) : bleedingTrend.length === 0 ? (
            <EmptyState
              icon="water-outline"
              text="Enregistre tes saignements dans ton journal pour voir leur évolution."
            />
          ) : (
            <View style={styles.chart}>
              {bleedingTrend.map((item, index) => (
                <TrendBar
                  delay={index * 45}
                  key={item.date}
                  label={dateLabel(item.date)}
                  maxValue={4}
                  value={item.value}
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
              <MaterialDesignIcons
                color={PURPLE}
                name="sync-circle"
                size={23}
              />
            </View>

            <Text style={styles.statusLabel}>Retour du cycle</Text>

            <Text numberOfLines={2} style={styles.statusValue}>
              {cycleReturnLabel}
            </Text>

            {firstReturnedPeriodDate ? (
              <Text style={styles.statusMeta}>
                {formatFullDate(firstReturnedPeriodDate)}
              </Text>
            ) : null}
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusIconPink}>
              <MaterialDesignIcons
                color={PINK}
                name="heart-outline"
                size={23}
              />
            </View>

            <Text style={styles.statusLabel}>Reprise des essais</Text>

            <Text numberOfLines={2} style={styles.statusValue}>
              {tryingAgainLabel}
            </Text>
          </View>
        </View>
      </AnimatedSection>

      <AnimatedSection delay={160}>
        <View style={styles.adviceCard}>
          <View style={styles.adviceGlow} />

          <View style={styles.adviceIcon}>
            <MaterialDesignIcons color={PURPLE} name="sprout" size={22} />
          </View>

          <View style={styles.adviceCopy}>
            <Text style={styles.adviceTitle}>À ton rythme</Text>

            <Text style={styles.adviceText}>
              Prends soin de toi, à ton rythme. Chaque étape compte.
            </Text>
          </View>
        </View>
      </AnimatedSection>
    </>
  );
}

/* ============================================================
   BLEEDING TAB
============================================================ */

function BleedingTab({
  entriesCount,
  trend,
  counts,
  maxCount,
  mostFrequent,
  monthlyTrend,
  showMonthlyView,
}: {
  entriesCount: number;

  trend: Array<{
    date: string;
    value: number;
  }>;

  counts: Array<{
    label: string;
    count: number;
  }>;

  maxCount: number;

  mostFrequent: string | undefined;

  monthlyTrend: Array<{
    month: string;
    label: string;
    value: number;
  }>;

  showMonthlyView: boolean;
}): React.JSX.Element {
  if (entriesCount === 0) {
    return (
      <AnimatedSection>
        <View style={styles.card}>
          <SectionHeader
            accent="pink"
            icon="water-outline"
            title="Saignements"
          />

          <EmptyState
            icon="water-outline"
            text="Enregistre tes saignements dans ton journal quotidien pour voir leur évolution ici."
          />
        </View>
      </AnimatedSection>
    );
  }

  return (
    <>
      <AnimatedSection>
        <View style={styles.kpiGrid}>
          <KpiCard
            accent="pink"
            icon="water-outline"
            label="Intensité la plus fréquente"
            value={mostFrequent ?? '—'}
          />

          <KpiCard
            accent="purple"
            icon="calendar-check-outline"
            label="Jours renseignés"
            value={String(entriesCount)}
          />
        </View>
      </AnimatedSection>

      <AnimatedSection delay={60}>
        <View style={styles.card}>
          <SectionHeader
            accent="pink"
            icon="chart-bar"
            subtitle={
              showMonthlyView
                ? 'Évolution mensuelle, sur la période sélectionnée'
                : 'Séquence enregistrée'
            }
            title="Évolution du flux"
          />

          {showMonthlyView ? (
            monthlyTrend.length === 0 ? (
              <EmptyState
                icon="water-outline"
                text="Pas encore assez de données pour un historique mensuel."
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.monthlyChartScroll}
              >
                <View style={styles.monthlyChartContent}>
                  {monthlyTrend.map((item, index) => (
                    <TrendBar
                      columnStyle={styles.monthlyBarColumn}
                      delay={index * 35}
                      key={item.month}
                      label={item.label}
                      maxValue={4}
                      value={item.value}
                    />
                  ))}
                </View>
              </ScrollView>
            )
          ) : (
            <View style={styles.chart}>
              {trend.map((item, index) => (
                <TrendBar
                  delay={index * 50}
                  key={item.date}
                  label={dateLabel(item.date)}
                  maxValue={4}
                  value={item.value}
                />
              ))}
            </View>
          )}
        </View>
      </AnimatedSection>

      <AnimatedSection delay={110}>
        <View style={styles.card}>
          <SectionHeader
            accent="pink"
            icon="chart-donut"
            subtitle="Selon tes entrées"
            title="Répartition de l’intensité"
          />

          <View style={styles.distributionList}>
            {counts.map((item, index) => (
              <DistributionRow
                accent="pink"
                count={item.count}
                key={item.label}
                label={item.label}
                last={index === counts.length - 1}
                maxCount={maxCount}
              />
            ))}
          </View>
        </View>
      </AnimatedSection>

      <AnimatedSection delay={150}>
        <View style={styles.softInfoCard}>
          <View style={styles.softInfoIcon}>
            <MaterialDesignIcons color={PINK} name="heart-outline" size={18} />
          </View>

          <Text style={styles.softInfoText}>
            Ce suivi est un repère personnel. L’évolution peut être différente
            d’une femme à l’autre.
          </Text>
        </View>
      </AnimatedSection>
    </>
  );
}

/* ============================================================
   SYMPTOMS TAB
============================================================ */

function SymptomsTab({
  entriesCount,
  counts,
  maxCount,
  mostFrequent,
  monthlyHistory,
  showMonthlyView,
}: {
  entriesCount: number;

  counts: Array<{
    label: string;
    count: number;
  }>;

  maxCount: number;

  mostFrequent: string | undefined;

  monthlyHistory: Array<{
    month: string;
    label: string;
    daysCount: number;
    mostFrequent: string | undefined;
  }>;

  showMonthlyView: boolean;
}): React.JSX.Element {
  if (entriesCount === 0) {
    return (
      <AnimatedSection>
        <View style={styles.card}>
          <SectionHeader icon="heart-pulse" title="Symptômes physiques" />

          <EmptyState
            icon="heart-pulse"
            text="Enregistre tes symptômes dans ton journal quotidien pour suivre leur fréquence."
          />
        </View>
      </AnimatedSection>
    );
  }

  return (
    <>
      <AnimatedSection>
        <View style={styles.kpiGrid}>
          <KpiCard
            accent="purple"
            icon="heart-pulse"
            label="Symptôme le plus fréquent"
            value={mostFrequent ?? '—'}
          />

          <KpiCard
            accent="blue"
            icon="calendar-check-outline"
            label="Jours avec symptômes"
            value={String(entriesCount)}
          />
        </View>
      </AnimatedSection>

      <AnimatedSection delay={70}>
        <View style={styles.card}>
          <SectionHeader
            icon="chart-donut"
            subtitle={
              showMonthlyView
                ? 'Évolution mensuelle, sur la période sélectionnée'
                : 'Selon tes journées enregistrées'
            }
            title="Fréquence des symptômes"
          />

          <View style={styles.distributionList}>
            {counts.map((item, index) => (
              <DistributionRow
                count={item.count}
                key={item.label}
                label={item.label}
                last={index === counts.length - 1}
                maxCount={maxCount}
              />
            ))}
          </View>

          {showMonthlyView ? (
            monthlyHistory.length === 0 ? (
              <EmptyState
                icon="heart-pulse"
                text="Pas encore assez de données pour un historique mensuel."
              />
            ) : (
              <View style={styles.monthlyList}>
                {monthlyHistory.map((item, index) => (
                  <View
                    key={item.month}
                    style={[
                      styles.monthlyRow,
                      index === monthlyHistory.length - 1 && styles.lastRow,
                    ]}
                  >
                    <Text style={styles.monthlyRowLabel}>{item.label}</Text>

                    <Text style={styles.monthlyRowMeta}>
                      {item.daysCount}{' '}
                      {item.daysCount > 1 ? 'jours' : 'jour'}
                      {item.mostFrequent ? ` · ${item.mostFrequent}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )
          ) : null}
        </View>
      </AnimatedSection>
    </>
  );
}

/* ============================================================
   TRACKING TAB
============================================================ */

function TrackingTab({
  notesCount,
  tryingAgainLabel,
  tryingAgainCounts,
  maxTryingAgainCount,
  cycleReturnLabel,
  firstReturnedPeriodDate,
}: {
  notesCount: number;

  tryingAgainLabel: string;

  tryingAgainCounts: Array<{
    label: string;
    count: number;
  }>;

  maxTryingAgainCount: number;

  cycleReturnLabel: string;

  firstReturnedPeriodDate: Date | null;
}): React.JSX.Element {
  return (
    <>
      <AnimatedSection>
        <View style={styles.trackingStatusCard}>
          <View style={styles.trackingTop}>
            <View style={styles.trackingIconPurple}>
              <MaterialDesignIcons
                color={PURPLE}
                name="notebook-edit-outline"
                size={23}
              />
            </View>

            <View style={styles.trackingCopy}>
              <Text style={styles.trackingTitle}>Notes personnelles</Text>

              <Text style={styles.trackingSubtitle}>
                Espace personnel et privé
              </Text>
            </View>

            <MaterialDesignIcons
              color="#B5A7C8"
              name="shield-lock-outline"
              size={18}
            />
          </View>

          <View style={styles.trackingValueRow}>
            <Text style={styles.trackingBigValue}>{notesCount}</Text>

            <Text style={styles.trackingValueLabel}>
              note
              {notesCount !== 1 ? 's' : ''} enregistrée
              {notesCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </AnimatedSection>

      <AnimatedSection delay={70}>
        <View style={styles.card}>
          <SectionHeader
            accent="pink"
            icon="heart-outline"
            subtitle="Selon ton propre rythme"
            title="Reprise des essais"
          />

          <View style={styles.currentStatusBox}>
            <Text style={styles.currentStatusLabel}>État actuel</Text>

            <Text style={styles.currentStatusValue}>{tryingAgainLabel}</Text>
          </View>

          {tryingAgainCounts.length > 0 ? (
            <View style={styles.distributionList}>
              {tryingAgainCounts.map((item, index) => (
                <DistributionRow
                  accent="pink"
                  count={item.count}
                  key={item.label}
                  label={item.label}
                  last={index === tryingAgainCounts.length - 1}
                  maxCount={maxTryingAgainCount}
                />
              ))}
            </View>
          ) : null}
        </View>
      </AnimatedSection>

      <AnimatedSection delay={120}>
        <View style={styles.trackingStatusCard}>
          <View style={styles.trackingTop}>
            <View style={styles.trackingIconPurple}>
              <MaterialDesignIcons
                color={PURPLE}
                name="sync-circle"
                size={23}
              />
            </View>

            <View style={styles.trackingCopy}>
              <Text style={styles.trackingTitle}>Retour du cycle</Text>

              <Text style={styles.trackingSubtitle}>Repère dans ton suivi</Text>
            </View>
          </View>

          <Text style={styles.trackingStatusValue}>{cycleReturnLabel}</Text>

          {firstReturnedPeriodDate ? (
            <View style={styles.datePill}>
              <MaterialDesignIcons
                color={PURPLE}
                name="calendar-check-outline"
                size={16}
              />

              <Text style={styles.datePillText}>
                Retour des règles : {formatFullDate(firstReturnedPeriodDate)}
              </Text>
            </View>
          ) : null}
        </View>
      </AnimatedSection>

      <AnimatedSection delay={160}>
        <View style={styles.softInfoCard}>
          <View style={styles.softInfoIconPurple}>
            <MaterialDesignIcons
              color={PURPLE}
              name="information-outline"
              size={18}
            />
          </View>

          <Text style={styles.softInfoText}>
            Le retour de tes règles ne change pas automatiquement ton
            accompagnement actuel.
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
  safe: {
    flex: 1,
    backgroundColor: BACKGROUND,
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
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 3,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
  },

  headerSubtitle: {
    marginTop: 2,
    color: TEXT_SECONDARY,
    fontSize: 10.5,
  },

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

  objectiveCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 10,
  },

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

  objectiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#80B98F',
  },

  tabsScroll: {
    flexGrow: 0,
    marginTop: 11,
  },

  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },

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
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 2,
  },

  tabPillText: {
    color: '#8D809E',
    fontSize: 11.5,
    fontWeight: '700',
  },

  tabPillTextActive: {
    color: PURPLE,
    fontWeight: '800',
  },

  tabPressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  tabContent: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 1,
  },

  card: {
    ...homeShadow,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 25,
    backgroundColor: CARD,
    shadowColor: '#4A318A',
    shadowOffset: {
      width: 0,
      height: 7,
    },
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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  sectionIcon: {
    width: 39,
    height: 39,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 14,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 16.5,
    fontWeight: '800',
  },

  cardSubtitle: {
    marginTop: 2,
    color: TEXT_SECONDARY,
    fontSize: 10,
    lineHeight: 14,
  },

  kpiGrid: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
  },

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

  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  kpiIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },

  kpiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },

  kpiValue: {
    marginTop: 11,
    color: PURPLE_DARK,
    fontSize: 20,
    fontWeight: '800',
  },

  kpiLabel: {
    marginTop: 3,
    color: TEXT_SECONDARY,
    fontSize: 9.7,
    lineHeight: 13,
  },

  chart: {
    height: 155,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },

  barColumn: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    alignItems: 'center',
  },

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

  barFill: {
    width: '100%',
    minHeight: 6,
    borderRadius: 9,
    backgroundColor: '#8D6BD4',
  },

  barShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  barLabel: {
    color: TEXT_SECONDARY,
    fontSize: 7.5,
    textAlign: 'center',
  },

  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },

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

  statusLabel: {
    marginTop: 11,
    color: TEXT_SECONDARY,
    fontSize: 9.5,
    fontWeight: '600',
  },

  statusValue: {
    marginTop: 4,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },

  statusMeta: {
    marginTop: 5,
    color: '#8B7C9D',
    fontSize: 9,
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

  adviceCopy: {
    flex: 1,
    minWidth: 0,
  },

  adviceTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 14.5,
    fontWeight: '800',
  },

  adviceText: {
    marginTop: 3,
    color: TEXT_SECONDARY,
    fontSize: 10.5,
    lineHeight: 15,
  },

  distributionList: {
    marginTop: 11,
  },

  distributionRow: {
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECE5F1',
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  distributionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

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

  distributionCount: {
    color: TEXT_SECONDARY,
    fontSize: 8.7,
    fontWeight: '700',
  },

  distributionTrack: {
    height: 7,
    overflow: 'hidden',
    marginTop: 8,
    borderRadius: 4,
    backgroundColor: '#EFE9F5',
  },

  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 14,
  },

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

  softInfoText: {
    flex: 1,
    minWidth: 0,
    color: TEXT_SECONDARY,
    fontSize: 10.3,
    lineHeight: 15,
  },

  trackingStatusCard: {
    ...homeShadow,
    marginTop: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
  },

  trackingTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  trackingIconPurple: {
    width: 43,
    height: 43,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: PURPLE_SOFT,
  },

  trackingCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 10,
  },

  trackingTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 15.5,
    fontWeight: '800',
  },

  trackingSubtitle: {
    marginTop: 2,
    color: TEXT_SECONDARY,
    fontSize: 9.5,
  },

  trackingValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 16,
    gap: 7,
  },

  trackingBigValue: {
    color: PURPLE,
    fontSize: 29,
    lineHeight: 31,
    fontWeight: '800',
  },

  trackingValueLabel: {
    flex: 1,
    paddingBottom: 3,
    color: TEXT_SECONDARY,
    fontSize: 10.5,
  },

  trackingStatusValue: {
    marginTop: 15,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 19,
    fontWeight: '800',
  },

  currentStatusBox: {
    marginTop: 14,
    padding: 13,
    borderRadius: 17,
    backgroundColor: '#FAF6FD',
  },

  currentStatusLabel: {
    color: TEXT_SECONDARY,
    fontSize: 9,
  },

  currentStatusValue: {
    marginTop: 4,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },

  datePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: PURPLE_SOFT,
  },

  datePillText: {
    color: PURPLE,
    fontSize: 9.5,
    fontWeight: '700',
  },

  periodSelectorWrap: {
    marginTop: 12,
    marginHorizontal: 16,
  },

  coverageText: {
    marginTop: -8,
    marginBottom: 10,
    color: TEXT_SECONDARY,
    fontSize: 9.5,
    textAlign: 'center',
  },

  monthlyChartScroll: {
    marginTop: 16,
  },

  monthlyChartContent: {
    height: 155,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingRight: 4,
  },

  monthlyBarColumn: {
    flex: 0,
    width: 42,
    height: '100%',
  },

  monthlyList: {
    marginTop: 13,
  },

  monthlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECE5F1',
  },

  monthlyRowLabel: {
    color: PURPLE_DARK,
    fontSize: 11.5,
    fontWeight: '700',
  },

  monthlyRowMeta: {
    flexShrink: 1,
    color: TEXT_SECONDARY,
    fontSize: 9.7,
    textAlign: 'right',
  },

  pressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },
});

export default MiscarriageStatisticsScreen;
