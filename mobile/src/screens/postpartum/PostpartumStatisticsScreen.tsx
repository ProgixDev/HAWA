import React, { useCallback, useMemo, useState } from 'react';
import {
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
import { useAwaTheme } from '../../theme/AwaThemeProvider';
import { withAlpha, type ResolvedAwaTheme } from '../../theme/awaThemeTokens';
import { getTopPadding, getFloatingTabBarClearance, spacing } from '../../theme/spacing';
import { usePremium } from '../../hooks/usePremium';
import { HawaPremiumBottomSheet } from '../../components/premium/HawaPremiumBottomSheet';
import StatisticsPeriodSelector, {
  STATISTICS_PERIOD_LABELS,
} from '../../components/statistics/StatisticsPeriodSelector';
import {
  coverageMonthsForAnchor,
  cutoffDateForPeriod,
  describeMonthsCoverage,
  type StatisticsPeriod,
} from '../../utils/cycleStatisticsMath';
import {
  getAllPostpartumJournalEntries,
  hydratePostpartumJournal,
  subscribePostpartumJournal,
  type PostpartumJournalEntry,
} from '../../state/postpartumJournalStore';
import {
  getAllPostpartumLochiaEntries,
  getPostpartumLochiaTracking,
  hydratePostpartumLochia,
  subscribePostpartumLochia,
  type LochiaFlow,
  type PostpartumLochiaEntry,
  type PostpartumLochiaTracking,
} from '../../state/postpartumLochiaStore';
import {
  getPostpartumPreferences,
  hydratePostpartumPreferences,
  subscribePostpartumPreferences,
} from '../../state/postpartumPreferences';
import {
  computePostpartumLochiaSummary,
  computePostpartumStatus,
  type PostpartumLochiaSummary,
} from '../../utils/postpartumTrackingUtils';
import {
  POSTPARTUM_FATIGUE_OPTIONS,
  POSTPARTUM_JOURNAL_ITEMS,
  POSTPARTUM_MOOD_OPTIONS,
  POSTPARTUM_PAIN_OPTIONS,
  POSTPARTUM_RECOVERY_OPTIONS,
  POSTPARTUM_SLEEP_OPTIONS,
} from '../../config/postpartumJournalConfig';
import {
  averageByMonth,
  resolvePostpartumCycleReturnEventInPeriod,
  withinPeriod,
} from '../../utils/postpartumStatisticsMath';

/* ============================================================
   Postpartum Statistics — every number on this screen is derived
   live from the SAME canonical stores the Dashboard/Journal/Calendar
   already read (postpartumJournalStore, postpartumLochiaStore,
   postpartumPreferences). Nothing here is persisted separately, and
   nothing is hardcoded — nested useMemo blocks recompute on every
   store change so the screen can never show stale or fabricated data.
   Categories are Postpartum-specific (Fatigue/Sommeil/Humeur/Douleurs/
   Récupération physique) — deliberately different from Pregnancy's
   own Statistics (Symptômes/Poids/Humeur/Sommeil/Informations
   médicales), which lives entirely in PregnancyStatisticsScreen.tsx.
============================================================ */

// PHASE E5 — PURPLE/PURPLE_DARK/PURPLE_SOFT/TEXT_SECONDARY (generic
// decorative chrome) are now derived per-component from useAwaTheme(); see
// createStyles(theme) below.
//
// CHART-ACCENT INVESTIGATION: every TrendBar/DistributionRow on this screen
// renders with the EXACT SAME fill color regardless of which series is
// plotted — lochia flow, fatigue, mood, sleep, pain and recovery all share
// CHART_FILL/DISTRIBUTION_FILL below; only the bar's height/length reflects
// the real value. There is no per-category or per-severity color coding
// here today, unlike PostpartumCalendarContent.tsx's CATEGORY_META (lochia
// = DELIVERY_COLOR, fatigue/sleep/mood/pain/recovery each their own hue) or
// PostpartumJournalEntryScreen.tsx's per-option `tint` on
// FATIGUE_RATINGS/PAIN_RATINGS/RECOVERY_RATINGS. So neither DELIVERY_COLOR
// ('#DC7B82') nor those option tints are reused here — doing so would
// fabricate a per-series color scheme this screen has never actually
// rendered, which would change its appearance rather than just re-theme
// it. CHART_FILL/DISTRIBUTION_FILL stay fixed literals (not theme-derived)
// because no ResolvedAwaTheme token reproduces them for "AWA Original"
// without a visible saturation/hue shift on every chart on this screen.
const CHART_FILL = '#8D6ED5';
const DISTRIBUTION_FILL = '#9A7ADD';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type TabKey =
  | 'summary'
  | 'lochia'
  | 'fatigue'
  | 'mood'
  | 'sleep'
  | 'pain'
  | 'recovery';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'summary', label: 'Résumé' },
  { key: 'lochia', label: 'Lochies' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'mood', label: 'Humeur' },
  { key: 'sleep', label: 'Sommeil' },
  { key: 'pain', label: 'Douleurs' },
  { key: 'recovery', label: 'Récupération' },
];

/** Display cap on the FREE (1 mois) daily trend charts — the underlying
 * entry set is already restricted to the selected period's real date
 * window (`withinPeriod`), so this only bounds how many daily bars a dense
 * month renders, never a substitute for real date filtering. */
const TREND_DISPLAY_CAP = 20;

const LOCHIA_FLOW_VALUE: Record<LochiaFlow, number> = {
  'Très léger': 1,
  Léger: 2,
  Modéré: 3,
  Abondant: 4,
};
const LOCHIA_FLOWS: LochiaFlow[] = [
  'Très léger',
  'Léger',
  'Modéré',
  'Abondant',
];

const dateLabel = (date: string): string =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(
    new Date(`${date}T12:00:00`),
  );

const formatHoursMinutes = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h} h ${String(m).padStart(2, '0')} min`;
};

/** Counts entries per option (in the option list's own canonical order,
 * then sorted most-to-least frequent) for a single-select scale field —
 * shared by Humeur/Sommeil/Fatigue/Douleurs/Récupération. */
function countByOption<T extends PostpartumJournalEntry>(
  entries: T[],
  field: keyof T,
  options: string[],
): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  entries.forEach(entry => {
    const value = entry[field] as unknown as string;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return options
    .map(label => ({ label, count: counts.get(label) ?? 0 }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

/** Counts frequency of items inside a multi-select `string[]` field
 * (e.g. lochia `symptoms`) across all entries. */
function countByTag(entries: PostpartumLochiaEntry[]): Array<{
  label: string;
  count: number;
}> {
  const counts = new Map<string, number>();
  entries.forEach(entry => {
    entry.symptoms.forEach(symptom => {
      counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/* ============================================================
   SMALL SHARED PIECES
============================================================ */

function EmptyState({
  text,
  icon = 'chart-line-variant',
}: {
  text: string;
  icon?: IconName;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialDesignIcons color={theme.colors.textMuted} name={icon} size={22} />
      </View>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

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
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={19} />
      </View>
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function KpiCard({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string;
  label: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={19} />
      </View>
      <Text numberOfLines={1} style={styles.kpiValue}>
        {value}
      </Text>
      <Text numberOfLines={2} style={styles.kpiLabel}>
        {label}
      </Text>
    </View>
  );
}

function DistributionRow({
  label,
  count,
  maxCount,
  last,
}: {
  label: string;
  count: number;
  maxCount: number;
  last?: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <View style={[styles.distributionRow, last && styles.lastRow]}>
      <View style={styles.distributionTop}>
        <Text style={styles.distributionLabel}>{label}</Text>
        <Text style={styles.distributionCount}>
          {count} {count > 1 ? 'jours' : 'jour'}
        </Text>
      </View>
      <View style={styles.distributionTrack}>
        <View
          style={[
            styles.distributionFill,
            { width: `${Math.max(count > 0 ? 6 : 0, percent)}%` },
          ]}
        />
      </View>
    </View>
  );
}

function TrendBar({
  label,
  value,
  maxValue,
}: {
  label: string;
  value: number;
  maxValue: number;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const span = Math.max(maxValue, 1);
  const heightPercent = Math.min(100, Math.max(14, (value / span) * 100));
  return (
    <View style={styles.barColumn}>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { height: `${heightPercent}%` }]} />
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

function PostpartumStatisticsScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [tab, setTab] = useState<TabKey>('summary');

  const { isPremium } = usePremium();
  const [premiumSheetVisible, setPremiumSheetVisible] = useState(false);
  // Single global time-period selector shared by all 7 tabs — replaces the
  // former per-tab "Vue complète" toggle so Postpartum matches the same
  // FREE=1 mois / PREMIUM=3-6-12 mois architecture every other objective's
  // Statistics screen uses.
  const [period, setPeriod] = useState<StatisticsPeriod>('1');

  const [prefs, setPrefs] = useState(getPostpartumPreferences);
  const [journalEntries, setJournalEntries] = useState<
    Record<string, PostpartumJournalEntry>
  >({});
  const [lochiaEntries, setLochiaEntries] = useState<
    Record<string, PostpartumLochiaEntry>
  >({});
  const [lochiaTracking, setLochiaTracking] =
    useState<PostpartumLochiaTracking>(getPostpartumLochiaTracking);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydratePostpartumPreferences().then(value => {
        if (active) {
          setPrefs(value);
        }
      });
      const unsubPrefs = subscribePostpartumPreferences(() => {
        if (active) {
          setPrefs(getPostpartumPreferences());
        }
      });

      hydratePostpartumJournal().then(() => {
        if (active) {
          setJournalEntries(getAllPostpartumJournalEntries());
        }
      });
      const unsubJournal = subscribePostpartumJournal(() => {
        if (active) {
          setJournalEntries(getAllPostpartumJournalEntries());
        }
      });

      hydratePostpartumLochia().then(() => {
        if (active) {
          setLochiaEntries(getAllPostpartumLochiaEntries());
          setLochiaTracking(getPostpartumLochiaTracking());
        }
      });
      const unsubLochia = subscribePostpartumLochia(() => {
        if (active) {
          setLochiaEntries(getAllPostpartumLochiaEntries());
          setLochiaTracking(getPostpartumLochiaTracking());
        }
      });

      return () => {
        active = false;
        unsubPrefs();
        unsubJournal();
        unsubLochia();
      };
    }, []),
  );

  /* ==========================================================
     DELIVERY DATE / POSTPARTUM DAY — the ONLY source of truth,
     never Cycle lastPeriodStart or Pregnancy DPA.
  ========================================================== */

  const deliveryDate = useMemo(
    () =>
      prefs.deliveryDate ? new Date(`${prefs.deliveryDate}T12:00:00`) : null,
    [prefs.deliveryDate],
  );
  const status = useMemo(
    () => computePostpartumStatus(deliveryDate, new Date()),
    [deliveryDate],
  );

  /* ==========================================================
     PERIOD WINDOW — real 1/3/6/12-month lookback shared by every
     tab (StatisticsPeriodSelector above). Coverage messaging tells
     the user when the delivery-date anchor is more recent than the
     selected window, instead of ever implying more history exists.
  ========================================================== */

  const now = useMemo(() => new Date(), []);
  const periodCutoff = useMemo(
    () => cutoffDateForPeriod(period, now),
    [period, now],
  );
  const coverageMonths = useMemo(
    () => coverageMonthsForAnchor(period, deliveryDate, now),
    [period, deliveryDate, now],
  );
  const coverageMessage = useMemo(
    () => describeMonthsCoverage(period, coverageMonths),
    [period, coverageMonths],
  );
  const isMonthlyView = period !== '1';

  // Premium "Retour du cycle" evolution — the ONE real confirmed date
  // postpartumPreferences.ts actually stores (firstPostpartumPeriodDate,
  // written only by recordFirstPostpartumPeriod() — lochia bleeding is
  // explicitly never passed there), shown only when it falls inside the
  // currently selected 1/3/6/12-month window. See
  // postpartumStatisticsMath.ts for the no-inference guarantee.
  const cycleReturnEventInPeriod = useMemo(
    () =>
      resolvePostpartumCycleReturnEventInPeriod(
        prefs.firstPostpartumPeriodDate,
        periodCutoff,
        now,
      ),
    [prefs.firstPostpartumPeriodDate, periodCutoff, now],
  );

  /* ==========================================================
     JOURNAL — Jours de suivi / Journées complètes, and each of the
     5 canonical categories, all derived from the same array,
     restricted to the selected period's real date window.
  ========================================================== */

  const journalDays = useMemo(
    () =>
      Object.values(journalEntries)
        .filter(entry => withinPeriod(entry.date, periodCutoff, now))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [journalEntries, periodCutoff, now],
  );

  const trackedDays = useMemo(
    () =>
      journalDays.filter(entry =>
        POSTPARTUM_JOURNAL_ITEMS.some(item => Boolean(entry[item.key])),
      ).length,
    [journalDays],
  );

  const completeDays = useMemo(
    () =>
      journalDays.filter(entry =>
        POSTPARTUM_JOURNAL_ITEMS.every(item => Boolean(entry[item.key])),
      ).length,
    [journalDays],
  );

  const fatigueEntries = useMemo(
    () => journalDays.filter(entry => entry.fatigue),
    [journalDays],
  );
  const fatigueCounts = useMemo(
    () => countByOption(fatigueEntries, 'fatigue', POSTPARTUM_FATIGUE_OPTIONS),
    [fatigueEntries],
  );
  const mostFrequentFatigue = fatigueCounts[0]?.label;
  const maxFatigueCount = Math.max(...fatigueCounts.map(item => item.count), 1);
  const fatigueTrend = useMemo(
    () =>
      fatigueEntries
        .slice(-TREND_DISPLAY_CAP)
        .map(entry => ({
          date: entry.date,
          value:
            POSTPARTUM_FATIGUE_OPTIONS.indexOf(entry.fatigue as string) + 1,
        })),
    [fatigueEntries],
  );
  const fatigueTrendFull = useMemo(
    () =>
      averageByMonth(
        fatigueEntries,
        entry => POSTPARTUM_FATIGUE_OPTIONS.indexOf(entry.fatigue as string) + 1,
      ),
    [fatigueEntries],
  );

  const moodEntries = useMemo(
    () => journalDays.filter(entry => entry.mood),
    [journalDays],
  );
  const moodCounts = useMemo(
    () => countByOption(moodEntries, 'mood', POSTPARTUM_MOOD_OPTIONS),
    [moodEntries],
  );
  const mostFrequentMood = moodCounts[0]?.label;
  const maxMoodCount = Math.max(...moodCounts.map(item => item.count), 1);
  // Mirrors fatigue/pain/recovery's own trend pattern exactly:
  // POSTPARTUM_MOOD_OPTIONS (postpartumJournalConfig.ts) is a documented,
  // deliberately ordered 5-point scale ('Très difficile' → 'Très bien') —
  // this ordinal mapping is used ONLY to pick a bar's height, never shown
  // to the user as a number, and never a new/invented mood state.
  const moodTrend = useMemo(
    () =>
      moodEntries
        .slice(-TREND_DISPLAY_CAP)
        .map(entry => ({
          date: entry.date,
          value: POSTPARTUM_MOOD_OPTIONS.indexOf(entry.mood as string) + 1,
        })),
    [moodEntries],
  );
  const moodTrendFull = useMemo(
    () =>
      averageByMonth(
        moodEntries,
        entry => POSTPARTUM_MOOD_OPTIONS.indexOf(entry.mood as string) + 1,
      ),
    [moodEntries],
  );

  const sleepQualityEntries = useMemo(
    () => journalDays.filter(entry => entry.sleep),
    [journalDays],
  );
  const sleepQualityCounts = useMemo(
    () => countByOption(sleepQualityEntries, 'sleep', POSTPARTUM_SLEEP_OPTIONS),
    [sleepQualityEntries],
  );
  const maxSleepQualityCount = Math.max(
    ...sleepQualityCounts.map(item => item.count),
    1,
  );

  const sleepDurationEntries = useMemo(
    () =>
      journalDays.filter(
        (entry): entry is PostpartumJournalEntry & { sleepDuration: number } =>
          typeof entry.sleepDuration === 'number',
      ),
    [journalDays],
  );
  const averageSleepHours = sleepDurationEntries.length
    ? sleepDurationEntries.reduce(
        (sum, entry) => sum + entry.sleepDuration,
        0,
      ) / sleepDurationEntries.length
    : undefined;
  const visibleSleepChart = sleepDurationEntries.slice(-TREND_DISPLAY_CAP);
  const maxSleepDuration = Math.max(
    ...visibleSleepChart.map(entry => entry.sleepDuration),
    1,
  );
  const sleepChartFull = useMemo(
    () => averageByMonth(sleepDurationEntries, entry => entry.sleepDuration),
    [sleepDurationEntries],
  );
  const maxSleepDurationFull = Math.max(
    ...sleepChartFull.map(item => item.value),
    1,
  );

  const painEntries = useMemo(
    () => journalDays.filter(entry => entry.pain),
    [journalDays],
  );
  const painCounts = useMemo(
    () => countByOption(painEntries, 'pain', POSTPARTUM_PAIN_OPTIONS),
    [painEntries],
  );
  const mostFrequentPain = painCounts[0]?.label;
  const maxPainCount = Math.max(...painCounts.map(item => item.count), 1);
  const painTrend = useMemo(
    () =>
      painEntries
        .slice(-TREND_DISPLAY_CAP)
        .map(entry => ({
          date: entry.date,
          value: POSTPARTUM_PAIN_OPTIONS.indexOf(entry.pain as string) + 1,
        })),
    [painEntries],
  );
  const painTrendFull = useMemo(
    () =>
      averageByMonth(
        painEntries,
        entry => POSTPARTUM_PAIN_OPTIONS.indexOf(entry.pain as string) + 1,
      ),
    [painEntries],
  );

  const recoveryEntries = useMemo(
    () => journalDays.filter(entry => entry.physicalRecovery),
    [journalDays],
  );
  const recoveryCounts = useMemo(
    () =>
      countByOption(
        recoveryEntries,
        'physicalRecovery',
        POSTPARTUM_RECOVERY_OPTIONS,
      ),
    [recoveryEntries],
  );
  const mostFrequentRecovery = recoveryCounts[0]?.label;
  const maxRecoveryCount = Math.max(
    ...recoveryCounts.map(item => item.count),
    1,
  );
  const recoveryTrend = useMemo(
    () =>
      recoveryEntries
        .slice(-TREND_DISPLAY_CAP)
        .map(entry => ({
          date: entry.date,
          value:
            POSTPARTUM_RECOVERY_OPTIONS.indexOf(
              entry.physicalRecovery as string,
            ) + 1,
        })),
    [recoveryEntries],
  );
  const recoveryTrendFull = useMemo(
    () =>
      averageByMonth(
        recoveryEntries,
        entry =>
          POSTPARTUM_RECOVERY_OPTIONS.indexOf(
            entry.physicalRecovery as string,
          ) + 1,
      ),
    [recoveryEntries],
  );

  /* ==========================================================
     LOCHIA — count / chart / distribution, all from
     postpartumLochiaStore only, restricted to the selected period's
     real date window (same withinPeriod filter as journalDays above).
  ========================================================== */

  const lochiaDays = useMemo(
    () =>
      Object.values(lochiaEntries)
        .filter(entry => withinPeriod(entry.date, periodCutoff, now))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [lochiaEntries, periodCutoff, now],
  );

  const lochiaChart = useMemo(
    () =>
      lochiaDays.slice(-TREND_DISPLAY_CAP).map(entry => {
        const entryStatus = computePostpartumStatus(
          deliveryDate,
          new Date(`${entry.date}T12:00:00`),
        );
        return {
          date: entry.date,
          flow: entry.flow,
          value: LOCHIA_FLOW_VALUE[entry.flow],
          label: entryStatus.configured
            ? `J${entryStatus.postpartumDay}`
            : dateLabel(entry.date),
        };
      }),
    [lochiaDays, deliveryDate],
  );
  const lochiaChartFull = useMemo(
    () => averageByMonth(lochiaDays, entry => LOCHIA_FLOW_VALUE[entry.flow]),
    [lochiaDays],
  );

  const lochiaSymptomCounts = useMemo(() => countByTag(lochiaDays), [lochiaDays]);
  const maxLochiaSymptomCount = Math.max(
    ...lochiaSymptomCounts.map(item => item.count),
    1,
  );

  const lochiaFlowCounts = useMemo(() => {
    const counts = new Map<LochiaFlow, number>();
    lochiaDays.forEach(entry =>
      counts.set(entry.flow, (counts.get(entry.flow) ?? 0) + 1),
    );
    return LOCHIA_FLOWS.map(label => ({
      label,
      count: counts.get(label) ?? 0,
    })).filter(item => item.count > 0);
  }, [lochiaDays]);
  const maxLochiaFlowCount = Math.max(
    ...lochiaFlowCounts.map(item => item.count),
    1,
  );
  const lochiaSummary = useMemo(
    () =>
      computePostpartumLochiaSummary(
        prefs.deliveryDate,
        lochiaEntries,
        lochiaTracking,
      ),
    [lochiaEntries, lochiaTracking, prefs.deliveryDate],
  );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      end={{x: 1, y: 1}}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      style={styles.safe}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />
      <View
        style={[styles.header, { paddingTop: getTopPadding(insets.top, true) }]}
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
            color={theme.colors.text}
            name="chevron-left"
            size={24}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <View style={styles.objectivePill}>
          <MaterialDesignIcons color={theme.colors.primary} name="chart-donut" size={15} />
          <Text style={styles.objectivePillText}>Post-partum</Text>
          <MaterialDesignIcons color={theme.colors.primary} name="chevron-down" size={15} />
        </View>
      </View>

      <View style={styles.periodSelectorWrap}>
        <StatisticsPeriodSelector
          isPremium={isPremium}
          onRequestPremium={() => setPremiumSheetVisible(true)}
          onSelectPeriod={setPeriod}
          period={period}
        />
        {coverageMessage ? (
          <View style={styles.coverageNote}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="information-outline"
              size={13}
            />
            <Text style={styles.coverageNoteText}>{coverageMessage}</Text>
          </View>
        ) : null}
      </View>

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
              onPress={() => setTab(item.key)}
              style={[styles.tabPill, active && styles.tabPillActive]}
            >
              <Text
                style={[styles.tabPillText, active && styles.tabPillTextActive]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getFloatingTabBarClearance(insets.bottom, spacing.lg) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'summary' ? (
          <SummaryTab
            averageSleepHours={averageSleepHours}
            completeDays={completeDays}
            cycleReturnEventInPeriod={cycleReturnEventInPeriod}
            firstPostpartumPeriodDate={prefs.firstPostpartumPeriodDate}
            isMonthlyView={isMonthlyView}
            periodLabel={STATISTICS_PERIOD_LABELS[period]}
            lochiaChart={isMonthlyView ? lochiaChartFull : lochiaChart}
            lochiaCount={lochiaDays.length}
            moodEntriesCount={moodEntries.length}
            mostFrequentMood={mostFrequentMood}
            sleepEntriesCount={sleepDurationEntries.length}
            status={status}
            trackedDays={trackedDays}
          />
        ) : null}

        {tab === 'lochia' ? (
          <LochiaTab
            chart={isMonthlyView ? lochiaChartFull : lochiaChart}
            entriesCount={lochiaDays.length}
            flowCounts={lochiaFlowCounts}
            isMonthlyView={isMonthlyView}
            maxFlowCount={maxLochiaFlowCount}
            maxSymptomCount={maxLochiaSymptomCount}
            summary={lochiaSummary}
            symptomCounts={lochiaSymptomCounts}
            timeline={lochiaDays.slice(-12).reverse()}
          />
        ) : null}

        {tab === 'fatigue' ? (
          <LevelTab
            counts={fatigueCounts}
            emptyIcon="lightning-bolt-outline"
            emptyText="Enregistre ta fatigue dans ton journal quotidien pour voir son évolution ici."
            entriesCount={fatigueEntries.length}
            icon="lightning-bolt-outline"
            isMonthlyView={isMonthlyView}
            kpiIcon="lightning-bolt-outline"
            kpiLabel="Fatigue la plus fréquente"
            maxCount={maxFatigueCount}
            mostFrequent={mostFrequentFatigue}
            title="Fatigue"
            trend={isMonthlyView ? fatigueTrendFull : fatigueTrend}
            trendMax={5}
          />
        ) : null}

        {tab === 'mood' ? (
          <LevelTab
            counts={moodCounts}
            emptyIcon="emoticon-outline"
            emptyText="Enregistre ton humeur dans ton journal quotidien pour voir son évolution ici."
            entriesCount={moodEntries.length}
            icon="heart-outline"
            isMonthlyView={isMonthlyView}
            kpiIcon="emoticon-happy-outline"
            kpiLabel="Humeur la plus fréquente"
            maxCount={maxMoodCount}
            mostFrequent={mostFrequentMood}
            title="Humeur"
            trend={isMonthlyView ? moodTrendFull : moodTrend}
            trendMax={5}
          />
        ) : null}

        {tab === 'sleep' ? (
          <SleepTab
            averageHours={averageSleepHours}
            chart={
              isMonthlyView
                ? sleepChartFull
                : visibleSleepChart.map(entry => ({
                    date: entry.date,
                    value: entry.sleepDuration,
                  }))
            }
            isMonthlyView={isMonthlyView}
            maxDuration={isMonthlyView ? maxSleepDurationFull : maxSleepDuration}
            maxQualityCount={maxSleepQualityCount}
            nightsCount={sleepDurationEntries.length}
            qualityCounts={sleepQualityCounts}
          />
        ) : null}

        {tab === 'pain' ? (
          <LevelTab
            counts={painCounts}
            emptyIcon="heat-wave"
            emptyText="Enregistre tes douleurs dans ton journal quotidien pour voir leur fréquence ici."
            entriesCount={painEntries.length}
            icon="heat-wave"
            isMonthlyView={isMonthlyView}
            kpiIcon="heat-wave"
            kpiLabel="Douleur la plus fréquente"
            maxCount={maxPainCount}
            mostFrequent={mostFrequentPain}
            title="Douleurs"
            trend={isMonthlyView ? painTrendFull : painTrend}
            trendMax={5}
          />
        ) : null}

        {tab === 'recovery' ? (
          <LevelTab
            counts={recoveryCounts}
            emptyIcon="heart-pulse"
            emptyText="Enregistre ta récupération dans ton journal quotidien pour voir sa progression ici."
            entriesCount={recoveryEntries.length}
            icon="heart-pulse"
            isMonthlyView={isMonthlyView}
            kpiIcon="heart-pulse"
            kpiLabel="Récupération la plus fréquente"
            maxCount={maxRecoveryCount}
            mostFrequent={mostFrequentRecovery}
            title="Récupération physique"
            trend={isMonthlyView ? recoveryTrendFull : recoveryTrend}
            trendMax={5}
          />
        ) : null}
      </ScrollView>

      <HawaPremiumBottomSheet
        onClose={() => setPremiumSheetVisible(false)}
        visible={premiumSheetVisible}
      />
    </LinearGradient>
  );
}

/* ============================================================
   TAB: RÉSUMÉ
============================================================ */

function SummaryTab({
  status,
  trackedDays,
  completeDays,
  lochiaCount,
  lochiaChart,
  averageSleepHours,
  sleepEntriesCount,
  mostFrequentMood,
  moodEntriesCount,
  firstPostpartumPeriodDate,
  isMonthlyView,
  cycleReturnEventInPeriod,
  periodLabel,
}: {
  status: ReturnType<typeof computePostpartumStatus>;
  trackedDays: number;
  completeDays: number;
  lochiaCount: number;
  lochiaChart: Array<{
    date: string;
    value: number;
    label: string;
  }>;
  averageSleepHours: number | undefined;
  sleepEntriesCount: number;
  mostFrequentMood: string | undefined;
  moodEntriesCount: number;
  firstPostpartumPeriodDate: string | null;
  isMonthlyView: boolean;
  /** The confirmed "retour des règles" date ONLY when it falls inside the
   * currently selected 1/3/6/12 month window — null otherwise (no event,
   * or a real event outside the selected window). */
  cycleReturnEventInPeriod: Date | null;
  periodLabel: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <View style={styles.card}>
        <SectionHeader
          icon="chart-box-outline"
          subtitle="Depuis l’accouchement"
          title="Aperçu"
        />
        <View style={styles.kpiGrid}>
          <KpiCard
            icon="calendar-heart"
            label="Jours post-partum"
            value={status.configured ? String(status.postpartumDay) : '—'}
          />
          <KpiCard
            icon="water-outline"
            label="Entrées lochies"
            value={String(lochiaCount)}
          />
          <KpiCard
            icon="notebook-outline"
            label="Jours de suivi"
            value={String(trackedDays)}
          />
          <KpiCard
            icon="check-decagram-outline"
            label="Journées complètes"
            value={String(completeDays)}
          />
        </View>
        <View style={styles.infoStrip}>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="information-outline"
            size={16}
          />
          <Text style={styles.infoStripText}>
            Une journée complète comprend : Fatigue, Sommeil, Humeur, Douleurs
            et Récupération physique.
          </Text>
        </View>
        <View style={styles.infoStrip}>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="calendar-refresh-outline"
            size={16}
          />
          <Text style={styles.infoStripText}>
            {firstPostpartumPeriodDate
              ? `Retour des règles : le ${dateLabel(firstPostpartumPeriodDate)}`
              : 'Retour des règles : pas encore enregistré'}
          </Text>
        </View>
      </View>

      {isMonthlyView ? (
        <View
          accessibilityLabel={`Retour du cycle — repères enregistrés sur ${periodLabel}`}
          style={styles.card}
        >
          <SectionHeader
            icon="calendar-heart"
            subtitle="Repères enregistrés au fil du temps"
            title="Retour du cycle"
          />
          {cycleReturnEventInPeriod && firstPostpartumPeriodDate ? (
            <View style={styles.infoStrip}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="calendar-check-outline"
                size={16}
              />
              <Text style={styles.infoStripText}>
                Retour du cycle confirmé — tu as indiqué le retour de tes
                règles le {dateLabel(firstPostpartumPeriodDate)}.
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="calendar-heart"
              text={`Aucun retour de cycle confirmé sur ${periodLabel}.`}
            />
          )}
        </View>
      ) : null}

      <View style={styles.card}>
        <SectionHeader
          icon="chart-bar"
          subtitle={
            isMonthlyView ? 'Historique complet, par mois' : 'Flux dominant'
          }
          title="Évolution des lochies"
        />
        {lochiaChart.length === 0 ? (
          <EmptyState
            icon="water-outline"
            text="Pas encore de données sur les lochies."
          />
        ) : (
          <View style={styles.chart}>
            {lochiaChart.map(item => (
              <TrendBar
                key={item.date}
                label={item.label}
                maxValue={4}
                value={item.value}
              />
            ))}
          </View>
        )}
        <View style={styles.infoStrip}>
          <MaterialDesignIcons color={theme.colors.primary} name="heart-outline" size={16} />
          <Text style={styles.infoStripText}>
            L’évolution des lochies est propre à chaque femme. Continue ton
            suivi quotidien.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <SectionHeader icon="chart-timeline-variant-shimmer" title="Moyennes" />
        <View style={styles.averagesRow}>
          <View style={styles.averageCard}>
            <View style={styles.averageIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="weather-night"
                size={18}
              />
            </View>
            <Text style={styles.averageLabel}>Sommeil moyen</Text>
            <Text numberOfLines={1} style={styles.averageValue}>
              {averageSleepHours !== undefined
                ? formatHoursMinutes(averageSleepHours)
                : 'Pas encore de données'}
            </Text>
            {sleepEntriesCount > 0 ? (
              <Text style={styles.averageSupporting}>
                Basé sur {sleepEntriesCount} jour
                {sleepEntriesCount > 1 ? 's' : ''}
              </Text>
            ) : null}
          </View>
          <View style={styles.averageCard}>
            <View style={styles.averageIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="emoticon-happy-outline"
                size={18}
              />
            </View>
            <Text style={styles.averageLabel}>Humeur moyenne</Text>
            <Text numberOfLines={1} style={styles.averageValue}>
              {mostFrequentMood ?? 'Pas encore de données'}
            </Text>
            {moodEntriesCount > 0 ? (
              <Text style={styles.averageSupporting}>
                Basé sur {moodEntriesCount} jour
                {moodEntriesCount > 1 ? 's' : ''}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.adviceCard}>
        <View style={styles.adviceIcon}>
          <MaterialDesignIcons color={theme.colors.primary} name="sprout" size={20} />
        </View>
        <View style={styles.adviceCopy}>
          <Text style={styles.adviceTitle}>Conseil</Text>
          <Text style={styles.adviceText}>
            Chaque petit pas compte. Prends soin de toi, ton corps récupère jour
            après jour.
          </Text>
        </View>
      </View>
    </>
  );
}

/* ============================================================
   TAB: LOCHIES
============================================================ */

function LochiaTab({
  entriesCount,
  chart,
  flowCounts,
  maxFlowCount,
  timeline,
  summary,
  symptomCounts,
  maxSymptomCount,
  isMonthlyView,
}: {
  entriesCount: number;
  chart: Array<{
    date: string;
    value: number;
    label: string;
  }>;
  flowCounts: Array<{ label: LochiaFlow; count: number }>;
  maxFlowCount: number;
  timeline: PostpartumLochiaEntry[];
  summary: PostpartumLochiaSummary;
  symptomCounts: Array<{ label: string; count: number }>;
  maxSymptomCount: number;
  isMonthlyView: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <>
      <View style={styles.card}>
        <SectionHeader
          icon="timeline-clock-outline"
          subtitle="Données réellement enregistrées"
          title="Durée des lochies"
        />
        <View style={styles.lochiaSummaryGrid}>
          <SummaryValue label="Début" value={dateValue(summary.deliveryDate)} />
          <SummaryValue
            label="Dernier jour enregistré"
            value={dateValue(summary.lastRecordedDate)}
          />
          <SummaryValue
            label="Durée enregistrée"
            value={summary.durationDays ? `${summary.durationDays} jours` : '—'}
          />
          <SummaryValue
            label="Statut"
            value={
              summary.status === 'ended'
                ? `Terminées le ${dateValue(summary.endedDate)}`
                : summary.status === 'ongoing'
                ? 'En cours'
                : 'Non renseigné'
            }
          />
        </View>
      </View>

      {entriesCount === 0 ? (
        <View style={styles.card}>
          <SectionHeader icon="water-outline" title="Observations" />
          <EmptyState
            icon="water-outline"
            text="Pas encore de données sur les lochies."
          />
        </View>
      ) : (
        <>
          <View style={styles.kpiGrid}>
            <KpiCard
              icon="water-outline"
              label="Entrées"
              value={String(entriesCount)}
            />
            <KpiCard
              icon="calendar-check-outline"
              label="Jours suivis"
              value={String(entriesCount)}
            />
          </View>

          <View style={styles.card}>
            <SectionHeader
              icon="chart-bar"
              subtitle={
                isMonthlyView
                  ? 'Historique complet, par mois'
                  : 'Séquence enregistrée'
              }
              title="Évolution du flux"
            />
            <View style={styles.chart}>
              {chart.map(item => (
                <TrendBar
                  key={item.date}
                  label={item.label}
                  maxValue={4}
                  value={item.value}
                />
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <SectionHeader icon="chart-donut" title="Répartition du flux" />
            {flowCounts.map((item, index) => (
              <DistributionRow
                count={item.count}
                key={item.label}
                label={item.label}
                last={index === flowCounts.length - 1}
                maxCount={maxFlowCount}
              />
            ))}
          </View>

          {symptomCounts.length > 0 ? (
            <View style={styles.card}>
              <SectionHeader
                icon="alert-circle-outline"
                subtitle="Symptômes déjà notés dans le journal des lochies"
                title="Symptômes associés"
              />
              {symptomCounts.map((item, index) => (
                <DistributionRow
                  count={item.count}
                  key={item.label}
                  label={item.label}
                  last={index === symptomCounts.length - 1}
                  maxCount={maxSymptomCount}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.card}>
            <SectionHeader icon="history" title="Historique" />
            <View style={styles.timelineList}>
              {timeline.map((entry, index) => (
                <View
                  key={entry.date}
                  style={[
                    styles.timelineRow,
                    index === timeline.length - 1 && styles.lastRow,
                  ]}
                >
                  <View style={styles.timelineIcon}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="calendar-blank-outline"
                      size={14}
                    />
                  </View>
                  <Text style={styles.timelineDate}>
                    {dateLabel(entry.date)}
                  </Text>
                  <Text numberOfLines={1} style={styles.timelineValue}>
                    {entry.flow}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.infoStrip}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="heart-outline"
              size={16}
            />
            <Text style={styles.infoStripText}>
              L’évolution des lochies est propre à chaque femme. Continue ton
              suivi quotidien.
            </Text>
          </View>
        </>
      )}
    </>
  );
}

const dateValue = (value: string | null): string =>
  value ? dateLabel(value) : '—';

function SummaryValue({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.lochiaSummaryValue}>
      <Text style={styles.lochiaSummaryLabel}>{label}</Text>
      <Text style={styles.lochiaSummaryText}>{value}</Text>
    </View>
  );
}

/* ============================================================
   TAB: FATIGUE / HUMEUR / DOULEURS / RÉCUPÉRATION — one shared
   shape (most-frequent KPI, optional trend, distribution list).
============================================================ */

function LevelTab({
  icon,
  title,
  emptyIcon,
  emptyText,
  mostFrequent,
  entriesCount,
  kpiIcon,
  kpiLabel,
  trend,
  trendMax,
  counts,
  maxCount,
  isMonthlyView,
}: {
  icon: IconName;
  title: string;
  emptyIcon: IconName;
  emptyText: string;
  mostFrequent: string | undefined;
  entriesCount: number;
  kpiIcon: IconName;
  kpiLabel: string;
  trend: Array<{ date: string; value: number; label?: string }>;
  trendMax: number;
  counts: Array<{ label: string; count: number }>;
  maxCount: number;
  isMonthlyView: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  if (entriesCount === 0) {
    return (
      <View style={styles.card}>
        <SectionHeader icon={icon} title={title} />
        <EmptyState icon={emptyIcon} text={emptyText} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.kpiGrid}>
        <KpiCard icon={kpiIcon} label={kpiLabel} value={mostFrequent ?? '—'} />
        <KpiCard
          icon="notebook-outline"
          label="Journées renseignées"
          value={String(entriesCount)}
        />
      </View>

      {trend.length > 0 ? (
        <View style={styles.card}>
          <SectionHeader
            icon="chart-bar"
            subtitle={
              isMonthlyView ? 'Historique complet, par mois' : 'Évolution récente'
            }
            title={`Évolution — ${title}`}
          />
          <View style={styles.chart}>
            {trend.map(point => (
              <TrendBar
                key={point.date}
                label={point.label ?? dateLabel(point.date)}
                maxValue={trendMax}
                value={point.value}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <SectionHeader icon="chart-donut" title={`Répartition — ${title}`} />
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
    </>
  );
}

/* ============================================================
   TAB: SOMMEIL
============================================================ */

function SleepTab({
  averageHours,
  nightsCount,
  chart,
  maxDuration,
  qualityCounts,
  maxQualityCount,
  isMonthlyView,
}: {
  averageHours: number | undefined;
  nightsCount: number;
  chart: Array<{ date: string; value: number; label?: string }>;
  maxDuration: number;
  qualityCounts: Array<{ label: string; count: number }>;
  maxQualityCount: number;
  isMonthlyView: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  if (nightsCount === 0 && qualityCounts.length === 0) {
    return (
      <View style={styles.card}>
        <SectionHeader icon="weather-night" title="Sommeil" />
        <EmptyState
          icon="weather-night"
          text="Pas encore assez de données pour calculer une moyenne."
        />
      </View>
    );
  }

  return (
    <>
      <View style={styles.kpiGrid}>
        <KpiCard
          icon="weather-night"
          label="Sommeil moyen"
          value={
            averageHours !== undefined
              ? formatHoursMinutes(averageHours)
              : 'Pas encore de données'
          }
        />
        <KpiCard
          icon="calendar-check-outline"
          label="Nuits enregistrées"
          value={String(nightsCount)}
        />
      </View>

      {chart.length > 0 ? (
        <View style={styles.card}>
          <SectionHeader
            icon="chart-bar"
            subtitle={
              isMonthlyView
                ? 'Historique complet, par mois'
                : 'Durée par jour enregistré'
            }
            title="Évolution du sommeil"
          />
          <View style={styles.chart}>
            {chart.map(entry => (
              <TrendBar
                key={entry.date}
                label={entry.label ?? dateLabel(entry.date)}
                maxValue={maxDuration}
                value={entry.value}
              />
            ))}
          </View>
        </View>
      ) : null}

      {qualityCounts.length > 0 ? (
        <View style={styles.card}>
          <SectionHeader icon="star-outline" title="Qualité du sommeil" />
          {qualityCounts.map((item, index) => (
            <DistributionRow
              count={item.count}
              key={item.label}
              label={item.label}
              last={index === qualityCounts.length - 1}
              maxCount={maxQualityCount}
            />
          ))}
        </View>
      ) : null}
    </>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },

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

  header: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
  },
  pressed: { opacity: 0.78 },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  objectivePill: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    backgroundColor: withAlpha(theme.colors.surface, 0.9),
    ...theme.shadow,
  },
  objectivePillText: { color: theme.colors.primary, fontSize: 11, fontWeight: '800' },

  periodSelectorWrap: { paddingHorizontal: 14, marginTop: 2 },
  coverageNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  coverageNoteText: { flex: 1, color: theme.colors.textSecondary, fontSize: 10.5 },

  tabsScroll: { flexGrow: 0, marginBottom: 4 },
  tabsScrollContent: { paddingHorizontal: 14, gap: 8, paddingBottom: 10 },
  tabPill: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  tabPillActive: { backgroundColor: theme.colors.primarySoft },
  tabPillText: { color: theme.colors.textSecondary, fontSize: 12.5, fontWeight: '700' },
  tabPillTextActive: { color: theme.colors.primary, fontWeight: '800' },

  content: { paddingHorizontal: 14, paddingTop: 4 },

  card: {
    ...theme.shadow,
    marginTop: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
  },
  lochiaSummaryGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lochiaSummaryValue: {
    width: '48%',
    minHeight: 70,
    justifyContent: 'center',
    padding: 11,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  lochiaSummaryLabel: { color: theme.colors.textSecondary, fontSize: 9.5, lineHeight: 13 },
  lochiaSummaryText: {
    marginTop: 4,
    color: theme.colors.text,
    fontSize: 11.5,
    fontWeight: '800',
    lineHeight: 15,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 13,
    backgroundColor: theme.colors.primarySoft,
  },
  sectionHeaderCopy: { flex: 1, minWidth: 0 },
  cardTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 15.5,
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 10,
    lineHeight: 13,
  },

  kpiGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiCard: {
    width: '47.5%',
    minWidth: 0,
    minHeight: 82,
    padding: 11,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  kpiIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
  },
  kpiValue: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  kpiLabel: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 9,
    lineHeight: 12,
  },

  infoStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 13,
    padding: 11,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
  },
  infoStripText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  chart: {
    height: 140,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  barColumn: { flex: 1, minWidth: 0, height: '100%', alignItems: 'center' },
  barTrack: {
    flex: 1,
    width: '60%',
    minWidth: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginVertical: 5,
    borderRadius: 7,
    backgroundColor: theme.colors.primarySoft,
  },
  barFill: { width: '100%', borderRadius: 7, backgroundColor: CHART_FILL },
  barLabel: { color: theme.colors.textSecondary, fontSize: 8 },

  averagesRow: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  averageCard: {
    flex: 1,
    minWidth: 140,
    padding: 12,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  averageIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  averageLabel: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  averageValue: {
    marginTop: 3,
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '800',
  },
  averageSupporting: { marginTop: 3, color: theme.colors.textSecondary, fontSize: 8.5 },

  adviceCard: {
    ...theme.shadow,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
  },
  adviceIcon: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
  },
  adviceCopy: { flex: 1, minWidth: 0 },
  adviceTitle: {
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '800',
  },
  adviceText: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  empty: { alignItems: 'center', paddingVertical: 22, paddingHorizontal: 10 },
  emptyIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: theme.colors.primarySoft,
  },
  emptyText: {
    maxWidth: 280,
    marginTop: 9,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },

  distributionRow: {
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  lastRow: { borderBottomWidth: 0 },
  distributionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distributionLabel: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  distributionCount: {
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
  },
  distributionTrack: {
    height: 5,
    overflow: 'hidden',
    marginTop: 7,
    borderRadius: 3,
    backgroundColor: theme.colors.primarySoft,
  },
  distributionFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: DISTRIBUTION_FILL,
  },

  timelineList: { marginTop: 10 },
  timelineRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: withAlpha(theme.colors.primary, 0.10),
  },
  timelineIcon: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 9,
    backgroundColor: theme.colors.primarySoft,
  },
  timelineDate: { flex: 1, minWidth: 0, color: theme.colors.textSecondary, fontSize: 10.5 },
  timelineValue: { color: theme.colors.text, fontSize: 11, fontWeight: '800' },
  });
}

export default PostpartumStatisticsScreen;
