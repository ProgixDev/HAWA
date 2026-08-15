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

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { homeColors, homeShadow } from '../../components/home/homeTheme';
import { getTopPadding, getBottomPadding, spacing } from '../../theme/spacing';
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

const PURPLE = homeColors.primary;
const PURPLE_DARK = homeColors.textPrimary;
const PURPLE_SOFT = '#F1EBFA';
const TEXT_SECONDARY = homeColors.textSecondary;

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
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialDesignIcons color="#9E89C8" name={icon} size={22} />
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
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <MaterialDesignIcons color={PURPLE} name={icon} size={19} />
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
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiIcon}>
        <MaterialDesignIcons color={PURPLE} name={icon} size={19} />
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
  const [tab, setTab] = useState<TabKey>('summary');

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
     JOURNAL — Jours de suivi / Journées complètes, and each of the
     5 canonical categories, all derived from the same array.
  ========================================================== */

  const journalDays = useMemo(
    () =>
      Object.values(journalEntries).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    [journalEntries],
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
        .slice(-8)
        .map(entry => ({
          date: entry.date,
          value:
            POSTPARTUM_FATIGUE_OPTIONS.indexOf(entry.fatigue as string) + 1,
        })),
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
  const visibleSleepChart = sleepDurationEntries.slice(-8);
  const maxSleepDuration = Math.max(
    ...visibleSleepChart.map(entry => entry.sleepDuration),
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
        .slice(-8)
        .map(entry => ({
          date: entry.date,
          value: POSTPARTUM_PAIN_OPTIONS.indexOf(entry.pain as string) + 1,
        })),
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
        .slice(-8)
        .map(entry => ({
          date: entry.date,
          value:
            POSTPARTUM_RECOVERY_OPTIONS.indexOf(
              entry.physicalRecovery as string,
            ) + 1,
        })),
    [recoveryEntries],
  );

  /* ==========================================================
     LOCHIA — count / chart / distribution, all from
     postpartumLochiaStore only.
  ========================================================== */

  const lochiaDays = useMemo(
    () =>
      Object.values(lochiaEntries).sort((a, b) => a.date.localeCompare(b.date)),
    [lochiaEntries],
  );

  const lochiaChart = useMemo(
    () =>
      lochiaDays.slice(-10).map(entry => {
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
    <View style={styles.safe}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="dark-content"
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
            color={PURPLE_DARK}
            name="chevron-left"
            size={24}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <View style={styles.objectivePill}>
          <MaterialDesignIcons color={PURPLE} name="chart-donut" size={15} />
          <Text style={styles.objectivePillText}>Post-partum</Text>
          <MaterialDesignIcons color={PURPLE} name="chevron-down" size={15} />
        </View>
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
          { paddingBottom: getBottomPadding(insets.bottom, spacing.lg) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'summary' ? (
          <SummaryTab
            averageSleepHours={averageSleepHours}
            completeDays={completeDays}
            lochiaChart={lochiaChart}
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
            chart={lochiaChart}
            entriesCount={lochiaDays.length}
            flowCounts={lochiaFlowCounts}
            maxFlowCount={maxLochiaFlowCount}
            summary={lochiaSummary}
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
            kpiIcon="lightning-bolt-outline"
            kpiLabel="Fatigue la plus fréquente"
            maxCount={maxFatigueCount}
            mostFrequent={mostFrequentFatigue}
            title="Fatigue"
            trend={fatigueTrend}
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
            kpiIcon="emoticon-happy-outline"
            kpiLabel="Humeur la plus fréquente"
            maxCount={maxMoodCount}
            mostFrequent={mostFrequentMood}
            title="Humeur"
            trend={[]}
            trendMax={5}
          />
        ) : null}

        {tab === 'sleep' ? (
          <SleepTab
            averageHours={averageSleepHours}
            chart={visibleSleepChart}
            maxDuration={maxSleepDuration}
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
            kpiIcon="heat-wave"
            kpiLabel="Douleur la plus fréquente"
            maxCount={maxPainCount}
            mostFrequent={mostFrequentPain}
            title="Douleurs"
            trend={painTrend}
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
            kpiIcon="heart-pulse"
            kpiLabel="Récupération la plus fréquente"
            maxCount={maxRecoveryCount}
            mostFrequent={mostFrequentRecovery}
            title="Récupération physique"
            trend={recoveryTrend}
            trendMax={5}
          />
        ) : null}
      </ScrollView>
    </View>
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
}: {
  status: ReturnType<typeof computePostpartumStatus>;
  trackedDays: number;
  completeDays: number;
  lochiaCount: number;
  lochiaChart: Array<{
    date: string;
    flow: LochiaFlow;
    value: number;
    label: string;
  }>;
  averageSleepHours: number | undefined;
  sleepEntriesCount: number;
  mostFrequentMood: string | undefined;
  moodEntriesCount: number;
}): React.JSX.Element {
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
            color={PURPLE}
            name="information-outline"
            size={16}
          />
          <Text style={styles.infoStripText}>
            Une journée complète comprend : Fatigue, Sommeil, Humeur, Douleurs
            et Récupération physique.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <SectionHeader
          icon="chart-bar"
          subtitle="Flux dominant"
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
          <MaterialDesignIcons color={PURPLE} name="heart-outline" size={16} />
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
                color={PURPLE}
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
                color={PURPLE}
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
          <MaterialDesignIcons color={PURPLE} name="sprout" size={20} />
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
}: {
  entriesCount: number;
  chart: Array<{
    date: string;
    flow: LochiaFlow;
    value: number;
    label: string;
  }>;
  flowCounts: Array<{ label: LochiaFlow; count: number }>;
  maxFlowCount: number;
  timeline: PostpartumLochiaEntry[];
  summary: PostpartumLochiaSummary;
}): React.JSX.Element {
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
              subtitle="Séquence enregistrée"
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
                      color={PURPLE}
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
              color={PURPLE}
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
}: {
  icon: IconName;
  title: string;
  emptyIcon: IconName;
  emptyText: string;
  mostFrequent: string | undefined;
  entriesCount: number;
  kpiIcon: IconName;
  kpiLabel: string;
  trend: Array<{ date: string; value: number }>;
  trendMax: number;
  counts: Array<{ label: string; count: number }>;
  maxCount: number;
}): React.JSX.Element {
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
            subtitle="Évolution récente"
            title={`Évolution — ${title}`}
          />
          <View style={styles.chart}>
            {trend.map(point => (
              <TrendBar
                key={point.date}
                label={dateLabel(point.date)}
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
}: {
  averageHours: number | undefined;
  nightsCount: number;
  chart: Array<PostpartumJournalEntry & { sleepDuration: number }>;
  maxDuration: number;
  qualityCounts: Array<{ label: string; count: number }>;
  maxQualityCount: number;
}): React.JSX.Element {
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
            subtitle="Durée par jour enregistré"
            title="Évolution du sommeil"
          />
          <View style={styles.chart}>
            {chart.map(entry => (
              <TrendBar
                key={entry.date}
                label={dateLabel(entry.date)}
                maxValue={maxDuration}
                value={entry.sleepDuration}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F3FC' },

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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
  },
  pressed: { opacity: 0.78 },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    color: PURPLE_DARK,
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
    borderColor: homeColors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.9)',
    ...homeShadow,
  },
  objectivePillText: { color: PURPLE, fontSize: 11, fontWeight: '800' },

  tabsScroll: { flexGrow: 0, marginBottom: 4 },
  tabsScrollContent: { paddingHorizontal: 14, gap: 8, paddingBottom: 10 },
  tabPill: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  tabPillActive: { backgroundColor: PURPLE_SOFT },
  tabPillText: { color: TEXT_SECONDARY, fontSize: 12.5, fontWeight: '700' },
  tabPillTextActive: { color: PURPLE, fontWeight: '800' },

  content: { paddingHorizontal: 14, paddingTop: 4 },

  card: {
    ...homeShadow,
    marginTop: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F8F4FC',
  },
  lochiaSummaryLabel: { color: TEXT_SECONDARY, fontSize: 9.5, lineHeight: 13 },
  lochiaSummaryText: {
    marginTop: 4,
    color: PURPLE_DARK,
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
    backgroundColor: PURPLE_SOFT,
  },
  sectionHeaderCopy: { flex: 1, minWidth: 0 },
  cardTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 15.5,
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 2,
    color: TEXT_SECONDARY,
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
    borderColor: homeColors.cardBorder,
    borderRadius: 17,
    backgroundColor: '#FBF8FE',
  },
  kpiIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  kpiValue: {
    marginTop: 8,
    color: PURPLE_DARK,
    fontSize: 16,
    fontWeight: '800',
  },
  kpiLabel: {
    marginTop: 2,
    color: TEXT_SECONDARY,
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
    backgroundColor: PURPLE_SOFT,
  },
  infoStripText: {
    flex: 1,
    color: TEXT_SECONDARY,
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
    backgroundColor: '#F0EAF7',
  },
  barFill: { width: '100%', borderRadius: 7, backgroundColor: '#8D6ED5' },
  barLabel: { color: TEXT_SECONDARY, fontSize: 8 },

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
    borderColor: homeColors.cardBorder,
    borderRadius: 17,
    backgroundColor: '#FBF8FE',
  },
  averageIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  averageLabel: {
    marginTop: 8,
    color: TEXT_SECONDARY,
    fontSize: 10,
    fontWeight: '700',
  },
  averageValue: {
    marginTop: 3,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: '800',
  },
  averageSupporting: { marginTop: 3, color: TEXT_SECONDARY, fontSize: 8.5 },

  adviceCard: {
    ...homeShadow,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  adviceIcon: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: PURPLE_SOFT,
  },
  adviceCopy: { flex: 1, minWidth: 0 },
  adviceTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '800',
  },
  adviceText: {
    marginTop: 3,
    color: TEXT_SECONDARY,
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
    backgroundColor: '#F2ECFA',
  },
  emptyText: {
    maxWidth: 280,
    marginTop: 9,
    color: TEXT_SECONDARY,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },

  distributionRow: {
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECE6F1',
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
    color: PURPLE_DARK,
    fontSize: 12,
    fontWeight: '700',
  },
  distributionCount: {
    color: TEXT_SECONDARY,
    fontSize: 9.5,
    fontWeight: '700',
  },
  distributionTrack: {
    height: 5,
    overflow: 'hidden',
    marginTop: 7,
    borderRadius: 3,
    backgroundColor: '#EFE9F5',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#9A7ADD',
  },

  timelineList: { marginTop: 10 },
  timelineRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECE6F1',
  },
  timelineIcon: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 9,
    backgroundColor: '#F4EFFA',
  },
  timelineDate: { flex: 1, minWidth: 0, color: TEXT_SECONDARY, fontSize: 10.5 },
  timelineValue: { color: PURPLE_DARK, fontSize: 11, fontWeight: '800' },
});

export default PostpartumStatisticsScreen;
