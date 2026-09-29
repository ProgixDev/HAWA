import React, {useCallback, useMemo, useState} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

import {
  getAllMenopauseJournalEntries,
  getMenopauseLabResults,
  hydrateMenopauseJournal,
  subscribeMenopauseJournal,
  type MenopauseJournalEntry,
} from '../../state/menopauseJournalStore';
import {
  MENOPAUSE_ENERGY_ICONS,
  MENOPAUSE_ENERGY_LABELS,
  MENOPAUSE_LAB_TYPE_ICONS,
  MENOPAUSE_LAB_TYPE_LABELS,
  MENOPAUSE_MOOD_COLORS,
  MENOPAUSE_MOOD_LABELS,
  MENOPAUSE_SYMPTOM_OPTIONS,
} from '../../config/menopauseJournalConfig';
import {
  getMenopausePreferences,
  hydrateMenopausePreferences,
  subscribeMenopausePreferences,
} from '../../state/menopausePreferences';
import {getAppLanguage} from '../../state/themePreferences';
import {getFloatingTabBarClearance, getTopPadding, spacing} from '../../theme/spacing';
import type {MoodLevel} from '../../types/journal';
import {usePremium} from '../../hooks/usePremium';
import {useToday} from '../../hooks/useToday';
import {endOfStatisticsDay} from '../../utils/cycleStatisticsMath';
import {startOfDay} from '../../utils/cycleMath';
import {HawaPremiumBottomSheet} from '../../components/premium/HawaPremiumBottomSheet';
import {
  buildLabChartPoints,
  calculateEnergyMonthlyTrend,
  calculateMoodMonthlyTrend,
  calculateSleepMonthlyTrend,
  calculateSymptomMonthlyTrend,
  filterLabResultsForPeriod,
} from '../../utils/menopauseStatisticsMath';
import '../../i18n';

type PeriodOption = {key: '1m' | '3m' | '6m' | '12m'; label: string; months: number};

// Built inside the component (via useMemo) so the period labels follow the
// app language — same buildPeriodOptions(t) pattern as
// ContraceptionStatisticsScreen.tsx.
function buildPeriods(t: (key: string) => string): PeriodOption[] {
  return [
    {key: '1m', label: t('menopauseStatistics.periods.oneMonth'), months: 1},
    {key: '3m', label: t('menopauseStatistics.periods.threeMonths'), months: 3},
    {key: '6m', label: t('menopauseStatistics.periods.sixMonths'), months: 6},
    {key: '12m', label: t('menopauseStatistics.periods.twelveMonths'), months: 12},
  ];
}

/** Free tier = 1 mois only; 3/6/12 mois require AWA Premium. */
function isPeriodFree(option: PeriodOption): boolean {
  return option.key === '1m';
}

function formatResultDate(dateKey: string): string {
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {return dateKey;}
  return new Intl.DateTimeFormat(getAppLanguage() === 'en' ? 'en-US' : 'fr-FR', {day: 'numeric', month: 'short'}).format(parsed);
}

function ProgressBar({ratio, color}: {ratio: number; color: string}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, {backgroundColor: color, width: `${Math.max(0, Math.min(1, ratio)) * 100}%`}]} />
    </View>
  );
}

function OverviewTile({icon, label, value}: {icon: React.ComponentProps<typeof MaterialDesignIcons>['name']; label: string; value: string}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.overviewTile}>
      <View style={styles.overviewIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={17} />
      </View>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

function EmptyCardState({title, text}: {title: string; text: string}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

/** THE single reusable Premium longitudinal (month-by-month, or per-real-
 * result for lab values) bar chart for this screen — reused by every new
 * "Évolution ..." section below instead of each one hand-rolling its own
 * bar/scale logic. `value`/`maxValue` only ever come from real store data —
 * never a mock — and `label` is always a real month or date, never an
 * index. */
function MonthlyBarChart({
  points,
  color,
}: {
  points: Array<{key: string; label: string; value: number; maxValue: number}>;
  color: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView contentContainerStyle={styles.trendChart} horizontal showsHorizontalScrollIndicator={false}>
      {points.map(point => {
        const ratio = point.maxValue > 0 ? Math.max(0.06, Math.min(1, point.value / point.maxValue)) : 0.06;
        return (
          <View key={point.key} style={styles.trendColumn}>
            <View style={styles.trendTrack}>
              <View style={[styles.trendFill, {backgroundColor: color, height: `${ratio * 100}%`}]} />
            </View>
            <Text numberOfLines={1} style={styles.trendLabel}>{point.label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function MenopauseStatisticsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();
  const {isPremium} = usePremium();
  const [premiumVisible, setPremiumVisible] = useState(false);
  // The period labels follow the app language, so only the stable key is kept
  // in state; the labeled option is derived below (same reasoning as
  // ContraceptionStatisticsScreen.tsx's buildPeriodOptions(t) usage).
  const periods = useMemo(() => buildPeriods(t), [t]);
  const [periodKey, setPeriodKey] = useState<PeriodOption['key']>('1m');
  const period = useMemo(
    () => periods.find(option => option.key === periodKey) ?? periods[0],
    [periods, periodKey],
  );
  const [preferences, setPreferences] = useState(getMenopausePreferences);
  // Snapshots of the journal stores. This screen stays mounted in the tab
  // navigator, so a mount-time read went stale as soon as the user recorded
  // something elsewhere. They are refreshed on focus AND on every store change
  // (same useFocusEffect + hydrate + subscribe combo as the Menopause
  // Dashboard/Calendar) — a pure re-read, nothing is written, and the selected
  // period / Premium sheet / scroll position are untouched. This is separate
  // from the local-day trigger (useToday) below.
  const [entriesByDate, setEntriesByDate] = useState(getAllMenopauseJournalEntries);
  const [labResults, setLabResults] = useState(() => getMenopauseLabResults());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const reload = () => {
        if (!active) {return;}
        setEntriesByDate(getAllMenopauseJournalEntries());
        setLabResults(getMenopauseLabResults());
      };

      hydrateMenopauseJournal().then(reload);
      hydrateMenopausePreferences().then(value => {
        if (active) {setPreferences(value);}
      });
      const unsubscribeJournal = subscribeMenopauseJournal(reload);
      const unsubscribePreferences = subscribeMenopausePreferences(() => {
        if (active) {setPreferences(getMenopausePreferences());}
      });
      // Refresh once on focus too: hydrate resolves immediately when the store
      // is already hydrated, but the snapshot above may predate later saves.
      reload();

      return () => {
        active = false;
        unsubscribeJournal();
        unsubscribePreferences();
      };
    }, []),
  );

  const handleSelectPeriod = (target: PeriodOption): void => {
    if (!isPeriodFree(target) && !isPremium) {
      setPremiumVisible(true);
      return;
    }
    setPeriodKey(target.key);
  };

  // Extracted so the NEW lab-result filtering below shares the exact same
  // cutoff as every existing journal-entry stat — the period now genuinely
  // governs the whole screen, not just the journal-derived cards.
  // Recomputed when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts.
  const {todayKey} = useToday();
  // Calendar-day window (same rule as every other objective's statistics, see
  // cycleStatisticsMath.endOfStatisticsDay): the first day counts from 00:00
  // and today is included at any hour.
  const periodCutoff = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - period.months);
    return startOfDay(cutoff);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- todayKey is the day-change trigger
  }, [period, todayKey]);
  const periodEnd = useMemo(
    () => endOfStatisticsDay(new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- todayKey is the day-change trigger
    [todayKey],
  );

  const entriesInPeriod = useMemo(() => {
    const allEntries = Object.values(entriesByDate);
    return allEntries.filter((entry: MenopauseJournalEntry) => {
      const time = new Date(`${entry.date}T12:00:00`).getTime();
      return time >= periodCutoff.getTime() && time <= periodEnd.getTime();
    });
  }, [entriesByDate, periodCutoff, periodEnd]);

  const showLongitudinalView = period.key !== '1m';

  const daysTracked = entriesInPeriod.length;

  const symptomCounts = useMemo(() => {
    const withCounts = MENOPAUSE_SYMPTOM_OPTIONS.map(option => ({
      ...option,
      count: entriesInPeriod.filter(entry => entry.symptoms?.includes(option.id)).length,
    })).sort((a, b) => b.count - a.count);
    const maxCount = Math.max(1, ...withCounts.map(item => item.count));
    return {items: withCounts, maxCount};
  }, [entriesInPeriod]);

  const totalSymptomEntries = entriesInPeriod.filter(entry => entry.symptoms?.length).length;

  const sleepEntries = entriesInPeriod.filter(entry => entry.sleepDurationHours !== undefined);
  const averageSleep = sleepEntries.length > 0
    ? sleepEntries.reduce((sum, entry) => sum + (entry.sleepDurationHours ?? 0), 0) / sleepEntries.length
    : null;

  const energyEntries = entriesInPeriod.filter(entry => entry.energyLevel);
  const energyCounts = {
    low: energyEntries.filter(entry => entry.energyLevel === 'low').length,
    medium: energyEntries.filter(entry => entry.energyLevel === 'medium').length,
    high: energyEntries.filter(entry => entry.energyLevel === 'high').length,
  };
  const maxEnergyCount = Math.max(1, energyCounts.low, energyCounts.medium, energyCounts.high);

  const moodEntries = entriesInPeriod.filter(entry => entry.mood);
  const moodCounts = useMemo(() => {
    const counts = new Map<MoodLevel, number>();
    moodEntries.forEach(entry => {
      if (entry.mood) {counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);}
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [moodEntries]);
  const maxMoodCount = Math.max(1, ...moodCounts.map(([, count]) => count));

  const treatmentEntries = entriesInPeriod.filter(entry => entry.treatmentStatus);
  const treatmentTaken = treatmentEntries.filter(entry => entry.treatmentStatus === 'taken').length;
  const treatmentNotTaken = treatmentEntries.filter(entry => entry.treatmentStatus === 'not_taken').length;

  /* ==========================================================
     PREMIUM LONGITUDINAL TRENDS — real month-by-month buckets of the
     SAME entriesInPeriod already used above (never a separate/wider
     fetch) — see utils/menopauseStatisticsMath.ts for the real-data, no-
     mock guarantee. Only rendered when showLongitudinalView (period !== 1
     mois, i.e. Premium-unlocked).
  ========================================================== */

  // One real per-month day-count per tracked symptom (hot flashes, night
  // sweats, sleep disturbances, fatigue, mood changes, brain fog — the 6
  // real MenopauseSymptom ids, config/menopauseJournalConfig.ts). A symptom
  // with zero recorded days across the whole period is simply omitted.
  const symptomMonthlyTrend = useMemo(
    () =>
      MENOPAUSE_SYMPTOM_OPTIONS.map(option => {
        const points = calculateSymptomMonthlyTrend(entriesInPeriod, option.id);
        const totalCount = points.reduce((sum, point) => sum + point.count, 0);
        return {...option, points, totalCount};
      }).filter(item => item.totalCount > 0),
    [entriesInPeriod],
  );

  const sleepMonthlyTrend = useMemo(() => calculateSleepMonthlyTrend(entriesInPeriod), [entriesInPeriod]);
  const energyMonthlyTrend = useMemo(() => calculateEnergyMonthlyTrend(entriesInPeriod), [entriesInPeriod]);
  const moodMonthlyTrend = useMemo(() => calculateMoodMonthlyTrend(entriesInPeriod), [entriesInPeriod]);

  /* ==========================================================
     LAB RESULTS — now genuinely respect the selected period (previously
     ignored it entirely: getMenopauseLabResults() returned full history
     regardless of the 1/3/6/12-month selector). "Latest" below always
     means latest WITHIN the selected period, since the period is meant to
     govern the whole screen — never silently mixed with older results.
  ========================================================== */

  const allFshResults = useMemo(() => labResults.filter(result => result.type === 'fsh'), [labResults]);
  const allEstradiolResults = useMemo(() => labResults.filter(result => result.type === 'estradiol'), [labResults]);

  const fshResults = useMemo(() => filterLabResultsForPeriod(allFshResults, periodCutoff, periodEnd), [allFshResults, periodCutoff, periodEnd]);
  const estradiolResults = useMemo(() => filterLabResultsForPeriod(allEstradiolResults, periodCutoff, periodEnd), [allEstradiolResults, periodCutoff, periodEnd]);

  const fshChartPoints = useMemo(
    () => buildLabChartPoints(fshResults).map(point => ({...point, label: formatResultDate(point.label)})),
    [fshResults],
  );
  const estradiolChartPoints = useMemo(
    () => buildLabChartPoints(estradiolResults).map(point => ({...point, label: formatResultDate(point.label)})),
    [estradiolResults],
  );

  // Preferences describe what is offered for NEW tracking. They never hide what
  // was genuinely recorded in the selected period: treatment / lab history keeps
  // being represented after the user stops tracking them (symptoms, mood, sleep
  // and energy are never preference-filtered here).
  const trackingLabFsh = preferences.labTracking === 'fsh' || preferences.labTracking === 'both';
  const trackingLabEstradiol = preferences.labTracking === 'estradiol' || preferences.labTracking === 'both';
  const showTreatment = preferences.hormonalTreatmentStatus === 'track' || treatmentEntries.length > 0;
  const showFshBlock = trackingLabFsh || fshResults.length > 0;
  const showEstradiolBlock = trackingLabEstradiol || estradiolResults.length > 0;
  const showLab = showFshBlock || showEstradiolBlock;
  // A period with only lab results (no daily journal entry) is NOT empty.
  const hasJournalData = daysTracked > 0;
  const hasLabData = fshResults.length + estradiolResults.length > 0;
  const hasAnyData = hasJournalData || hasLabData;

  return (
    <View style={styles.background}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, {paddingTop: getTopPadding(insets.top), paddingBottom: getFloatingTabBarClearance(insets.bottom, spacing.lg)}]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{t('menopauseStatistics.header.title')}</Text>
        <Text style={styles.pageSubtitle}>{t('menopauseStatistics.header.subtitle')}</Text>

        <View style={styles.periodRow}>
          {periods.map(option => {
            const active = option.key === period.key;
            const locked = !isPeriodFree(option) && !isPremium;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{selected: active}}
                key={option.key}
                onPress={() => handleSelectPeriod(option)}
                style={({pressed}) => [styles.periodButton, active && styles.periodButtonActive, pressed && styles.pressed]}>
                <View style={styles.periodButtonContent}>
                  <Text style={[styles.periodText, active && styles.periodTextActive]}>{option.label}</Text>
                  {locked ? <MaterialDesignIcons color={theme.colors.textMuted} name="lock-outline" size={10} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {!hasAnyData ? (
          <View style={styles.card}>
            <EmptyCardState text={t('menopauseStatistics.empty.text')} title={t('menopauseStatistics.empty.title')} />
          </View>
        ) : (
          <>
            {!hasJournalData ? (
              <View style={styles.card}>
                <EmptyCardState
                  text={t('menopauseStatistics.labOnly.text')}
                  title={t('menopauseStatistics.labOnly.title')}
                />
              </View>
            ) : null}

            {hasJournalData ? (
            <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('menopauseStatistics.overview.cardTitle')}</Text>
              <View style={styles.overviewGrid}>
                <OverviewTile icon="calendar-check-outline" label={t('menopauseStatistics.overview.daysTracked')} value={String(daysTracked)} />
                <OverviewTile icon="clipboard-pulse-outline" label={t('menopauseStatistics.overview.daysWithSymptoms')} value={String(totalSymptomEntries)} />
                <OverviewTile icon="weather-night" label={t('menopauseStatistics.overview.averageSleep')} value={averageSleep !== null ? `${averageSleep.toFixed(1)} h` : '—'} />
                {showTreatment ? <OverviewTile icon="pill" label={t('menopauseStatistics.overview.treatmentTracked')} value={String(treatmentEntries.length)} /> : null}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('menopauseStatistics.symptoms.cardTitle')}</Text>
              {symptomCounts.items.every(item => item.count === 0) ? (
                <EmptyCardState text={t('menopauseStatistics.symptoms.emptyText')} title={t('menopauseStatistics.symptoms.emptyTitle')} />
              ) : (
                symptomCounts.items.map(item => (
                  <View key={item.id} style={styles.statRow}>
                    <View style={[styles.statIcon, {backgroundColor: item.tint}]}>
                      <MaterialDesignIcons color={item.iconColor} name={item.icon} size={15} />
                    </View>
                    <View style={styles.statBody}>
                      <View style={styles.statHeaderRow}>
                        <Text numberOfLines={1} style={styles.statLabel}>{item.label}</Text>
                        <Text style={styles.statValue}>{t('menopauseStatistics.symptoms.dayCount', {count: item.count})}</Text>
                      </View>
                      <ProgressBar color={item.iconColor} ratio={item.count / symptomCounts.maxCount} />
                    </View>
                  </View>
                ))
              )}
              <Text style={styles.progressHint}>{t('menopauseStatistics.symptoms.progressHint')}</Text>
            </View>

            {showLongitudinalView ? (
              <View accessibilityLabel={t('menopauseStatistics.symptoms.evolutionAccessibility', {period: period.label})} style={styles.card}>
                <Text style={styles.cardTitle}>{t('menopauseStatistics.symptoms.evolutionTitle')}</Text>
                {symptomMonthlyTrend.length === 0 ? (
                  <EmptyCardState text={t('menopauseStatistics.symptoms.evolutionEmpty')} title={t('menopauseStatistics.symptoms.emptyTitle')} />
                ) : (
                  symptomMonthlyTrend.map(item => (
                    <View key={item.id} style={styles.symptomTrendBlock}>
                      <View style={styles.symptomTrendHeader}>
                        <View style={[styles.statIcon, styles.symptomTrendIcon, {backgroundColor: item.tint}]}>
                          <MaterialDesignIcons color={item.iconColor} name={item.icon} size={15} />
                        </View>
                        <Text numberOfLines={1} style={styles.statLabel}>{item.label}</Text>
                      </View>
                      <MonthlyBarChart
                        color={item.iconColor}
                        points={item.points.map(point => ({key: point.monthKey, label: point.monthLabel.slice(0, 3), value: point.count, maxValue: Math.max(...item.points.map(p => p.count), 1)}))}
                      />
                    </View>
                  ))
                )}
                <Text style={styles.trendHint}>{t('menopauseStatistics.symptoms.evolutionHint')}</Text>
              </View>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('menopauseStatistics.mood.cardTitle')}</Text>
              {moodCounts.length === 0 ? (
                <EmptyCardState text={t('menopauseStatistics.mood.emptyText')} title={t('menopauseStatistics.symptoms.emptyTitle')} />
              ) : (
                moodCounts.map(([level, count]) => (
                  <View key={level} style={styles.statRow}>
                    <View style={styles.statBody}>
                      <View style={styles.statHeaderRow}>
                        <Text numberOfLines={1} style={styles.statLabel}>{MENOPAUSE_MOOD_LABELS[level]}</Text>
                        <Text style={styles.statValue}>{t('menopauseStatistics.mood.dayCount', {count})}</Text>
                      </View>
                      <ProgressBar color={MENOPAUSE_MOOD_COLORS[level]} ratio={count / maxMoodCount} />
                    </View>
                  </View>
                ))
              )}
              {showLongitudinalView ? (
                <View accessibilityLabel={t('menopauseStatistics.mood.evolutionAccessibility', {period: period.label})}>
                  <Text style={[styles.statLabel, styles.moodTrendLabel]}>{t('menopauseStatistics.mood.monthlyLabel')}</Text>
                  {moodMonthlyTrend.length === 0 ? (
                    <EmptyCardState text={t('menopauseStatistics.mood.monthlyEmpty')} title={t('menopauseStatistics.symptoms.emptyTitle')} />
                  ) : (
                    moodMonthlyTrend.map(item => (
                      <View key={item.monthKey} style={styles.monthlyMoodRow}>
                        <Text style={styles.statLabel}>{item.monthLabel}</Text>
                        <Text style={styles.statValue}>
                          {t('menopauseStatistics.mood.monthlySummary', {
                            label: MENOPAUSE_MOOD_LABELS[item.dominantMood],
                            dominant: item.dominantCount,
                            total: item.totalCount,
                          })}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('menopauseStatistics.sleep.cardTitle')}</Text>
              <View style={styles.statRowPlain}>
                <Text style={styles.statLabel}>{t('menopauseStatistics.sleep.averageLabel')}</Text>
                <Text style={styles.statValue}>{averageSleep !== null ? `${averageSleep.toFixed(1)} h` : t('menopauseStatistics.sleep.notProvided')}</Text>
              </View>
              {showLongitudinalView ? (
                sleepMonthlyTrend.length < 2 ? (
                  <EmptyCardState text={t('menopauseStatistics.sleep.evolutionEmpty')} title={t('menopauseStatistics.symptoms.emptyTitle')} />
                ) : (
                  <View accessibilityLabel={t('menopauseStatistics.sleep.evolutionAccessibility', {period: period.label})}>
                    <MonthlyBarChart
                      color="#4D8791"
                      points={sleepMonthlyTrend.map(item => ({key: item.monthKey, label: item.monthLabel.slice(0, 3), value: item.averageHours, maxValue: Math.max(...sleepMonthlyTrend.map(p => p.averageHours), 1)}))}
                    />
                    <Text style={styles.trendHint}>{t('menopauseStatistics.sleep.evolutionHint')}</Text>
                  </View>
                )
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('menopauseStatistics.energy.cardTitle')}</Text>
              {energyEntries.length === 0 ? (
                <EmptyCardState text={t('menopauseStatistics.energy.emptyText')} title={t('menopauseStatistics.symptoms.emptyTitle')} />
              ) : (
                (Object.keys(MENOPAUSE_ENERGY_LABELS) as Array<keyof typeof MENOPAUSE_ENERGY_LABELS>).map(level => (
                  <View key={level} style={styles.statRow}>
                    <View style={styles.statIcon}>
                      <MaterialDesignIcons color="#B9823D" name={MENOPAUSE_ENERGY_ICONS[level]} size={15} />
                    </View>
                    <View style={styles.statBody}>
                      <View style={styles.statHeaderRow}>
                        <Text style={styles.statLabel}>{MENOPAUSE_ENERGY_LABELS[level]}</Text>
                        <Text style={styles.statValue}>{t('menopauseStatistics.energy.dayCount', {count: energyCounts[level]})}</Text>
                      </View>
                      <ProgressBar color="#B9823D" ratio={energyCounts[level] / maxEnergyCount} />
                    </View>
                  </View>
                ))
              )}
              {showLongitudinalView ? (
                energyMonthlyTrend.length < 2 ? (
                  <EmptyCardState text={t('menopauseStatistics.energy.evolutionEmpty')} title={t('menopauseStatistics.symptoms.emptyTitle')} />
                ) : (
                  <View accessibilityLabel={t('menopauseStatistics.energy.evolutionAccessibility', {period: period.label})}>
                    <MonthlyBarChart
                      color="#B9823D"
                      points={energyMonthlyTrend.map(item => ({key: item.monthKey, label: item.monthLabel.slice(0, 3), value: item.averageScore, maxValue: 3}))}
                    />
                    <Text style={styles.trendHint}>
                      {t('menopauseStatistics.energy.evolutionHint', {
                        summary: energyMonthlyTrend
                          .map(item => t('menopauseStatistics.energy.trendItem', {month: item.monthLabel.slice(0, 3), level: MENOPAUSE_ENERGY_LABELS[item.dominantLevel]}))
                          .join(' · '),
                      })}
                    </Text>
                  </View>
                )
              ) : null}
            </View>

            {showTreatment ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('menopauseStatistics.treatment.cardTitle')}</Text>
                {treatmentEntries.length === 0 ? (
                  <EmptyCardState text={t('menopauseStatistics.treatment.emptyText')} title={t('menopauseStatistics.symptoms.emptyTitle')} />
                ) : (
                  <>
                    <View style={styles.statRowPlain}><Text style={styles.statLabel}>{t('menopauseStatistics.treatment.takenLabel')}</Text><Text style={styles.statValue}>{treatmentTaken}</Text></View>
                    <View style={styles.statRowPlain}><Text style={styles.statLabel}>{t('menopauseStatistics.treatment.notTakenLabel')}</Text><Text style={styles.statValue}>{treatmentNotTaken}</Text></View>
                  </>
                )}
              </View>
            ) : null}

            </>
            ) : null}

            {showLab ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('menopauseStatistics.lab.cardTitle')}</Text>
                <Text style={styles.trendHint}>{t('menopauseStatistics.lab.periodHint', {period: period.label})}</Text>
                {showFshBlock ? (
                  <View style={styles.labBlock}>
                    <View style={styles.labBlockHeader}>
                      <MaterialDesignIcons color="#4D8791" name={MENOPAUSE_LAB_TYPE_ICONS.fsh} size={15} />
                      <Text style={styles.statLabel}>{MENOPAUSE_LAB_TYPE_LABELS.fsh} — {t('menopauseStatistics.lab.resultCount', {count: fshResults.length})}</Text>
                    </View>
                    {fshResults.length === 0 ? (
                      <EmptyCardState text={t('menopauseStatistics.lab.emptyFsh', {period: period.label})} title={t('menopauseStatistics.symptoms.emptyTitle')} />
                    ) : (
                      <>
                        {fshResults.length === 1 ? (
                          <Text style={styles.labResultLatest}>
                            {t('menopauseStatistics.lab.singleResult', {
                              value: fshResults[0].value,
                              unit: fshResults[0].unit ? ` ${fshResults[0].unit}` : '',
                              date: formatResultDate(fshResults[0].date),
                            })}
                          </Text>
                        ) : null}
                        {showLongitudinalView && fshResults.length >= 2 ? (
                          <View accessibilityLabel={t('menopauseStatistics.lab.fshEvolutionAccessibility', {period: period.label})}>
                            <MonthlyBarChart color="#4D8791" points={fshChartPoints} />
                          </View>
                        ) : null}
                        {fshResults.slice(-6).map(result => (
                          <Text key={result.id} style={styles.labResultLine}>{formatResultDate(result.date)} · {result.value}{result.unit ? ` ${result.unit}` : ''}</Text>
                        ))}
                      </>
                    )}
                  </View>
                ) : null}
                {showEstradiolBlock ? (
                  <View style={styles.labBlock}>
                    <View style={styles.labBlockHeader}>
                      <MaterialDesignIcons color="#4D8791" name={MENOPAUSE_LAB_TYPE_ICONS.estradiol} size={15} />
                      <Text style={styles.statLabel}>{MENOPAUSE_LAB_TYPE_LABELS.estradiol} — {t('menopauseStatistics.lab.resultCount', {count: estradiolResults.length})}</Text>
                    </View>
                    {estradiolResults.length === 0 ? (
                      <EmptyCardState text={t('menopauseStatistics.lab.emptyEstradiol', {period: period.label})} title={t('menopauseStatistics.symptoms.emptyTitle')} />
                    ) : (
                      <>
                        {estradiolResults.length === 1 ? (
                          <Text style={styles.labResultLatest}>
                            {t('menopauseStatistics.lab.singleResult', {
                              value: estradiolResults[0].value,
                              unit: estradiolResults[0].unit ? ` ${estradiolResults[0].unit}` : '',
                              date: formatResultDate(estradiolResults[0].date),
                            })}
                          </Text>
                        ) : null}
                        {showLongitudinalView && estradiolResults.length >= 2 ? (
                          <View accessibilityLabel={t('menopauseStatistics.lab.estradiolEvolutionAccessibility', {period: period.label})}>
                            <MonthlyBarChart color="#B9823D" points={estradiolChartPoints} />
                          </View>
                        ) : null}
                        {estradiolResults.slice(-6).map(result => (
                          <Text key={result.id} style={styles.labResultLine}>{formatResultDate(result.date)} · {result.value}{result.unit ? ` ${result.unit}` : ''}</Text>
                        ))}
                      </>
                    )}
                  </View>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <HawaPremiumBottomSheet onClose={() => setPremiumVisible(false)} visible={premiumVisible} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  // PURPLE/PURPLE_DARK/MUTED used to be fixed hex literals here; re-derived
  // from the resolved theme so every style below keeps working unchanged by
  // name (same pattern as ContraceptionStatisticsScreen.tsx's createStyles).
  const PURPLE = theme.colors.primary;
  const PURPLE_DARK = theme.colors.accent;
  const MUTED = theme.colors.textMuted;

  return StyleSheet.create({
  background: {flex: 1, backgroundColor: theme.colors.background},
  scrollContent: {paddingHorizontal: 16},

  pageTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
  pageSubtitle: {marginTop: 4, color: MUTED, fontSize: 12.5},

  periodRow: {flexDirection: 'row', marginTop: 16, gap: 8, backgroundColor: theme.colors.primarySoft, borderRadius: 16, padding: 4},
  periodButton: {flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 13},
  periodButtonActive: {backgroundColor: PURPLE},
  periodButtonContent: {flexDirection: 'row', alignItems: 'center', gap: 3},
  periodText: {color: MUTED, fontSize: 12.5, fontWeight: '700'},
  periodTextActive: {color: onPrimaryTextColor(theme)},

  // Custom, deliberately softer shadow shape than the app's canonical
  // theme.shadow (smaller offset/opacity/radius) — kept exactly as before,
  // only shadowColor is re-themed (matches resolveAwaTheme's own light-mode
  // shadowColor derivation: theme's accent tone).
  card: {
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.12),
    shadowColor: theme.colors.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 16, fontWeight: '700', marginBottom: 12},

  overviewGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  overviewTile: {flexGrow: 1, minWidth: '44%', borderRadius: 16, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.1), backgroundColor: theme.colors.surfaceSecondary, padding: 12},
  overviewIcon: {width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: theme.colors.primarySoft, marginBottom: 8},
  overviewValue: {color: PURPLE_DARK, fontSize: 18, fontWeight: '800'},
  overviewLabel: {marginTop: 2, color: MUTED, fontSize: 10.5},

  statRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: withAlpha(theme.colors.primary, 0.1)},
  statRowPlain: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: withAlpha(theme.colors.primary, 0.1)},
  statIcon: {width: 28, height: 28, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: theme.colors.primarySoft, marginRight: 10},
  statBody: {flex: 1, minWidth: 0},
  statHeaderRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  statLabel: {flex: 1, color: PURPLE_DARK, fontSize: 13, fontWeight: '600'},
  statValue: {marginLeft: 8, color: MUTED, fontSize: 12, fontWeight: '600'},

  // Category A generic unfilled track — the fill color itself (passed in via
  // the `color` prop at each call site: symptom/mood colors from
  // menopauseJournalConfig.ts, or the fixed energy/sleep/lab semantic hexes)
  // stays completely untouched; only this empty background is theme-reactive.
  progressTrack: {marginTop: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceSecondary, overflow: 'hidden'},
  progressFill: {height: 6, borderRadius: 3},
  progressHint: {marginTop: 10, color: MUTED, fontSize: 10, lineHeight: 14},

  labBlock: {marginTop: 6},
  labBlockHeader: {flexDirection: 'row', alignItems: 'center', gap: 8},
  labResultLine: {marginTop: 4, marginLeft: 23, color: MUTED, fontSize: 12},

  emptyState: {alignItems: 'center', paddingVertical: 10},
  emptyTitle: {color: PURPLE_DARK, fontSize: 13, fontWeight: '700', textAlign: 'center'},
  emptyText: {marginTop: 4, color: MUTED, fontSize: 11.5, textAlign: 'center'},

  trendChart: {flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingVertical: 4},
  trendColumn: {alignItems: 'center', width: 34},
  // Same "unfilled track only" rule as progressTrack above — the bar's own
  // fill color is always supplied by the caller (config-driven or a fixed
  // semantic hex) and is never touched here.
  trendTrack: {width: 16, height: 74, borderRadius: 8, backgroundColor: theme.colors.surfaceSecondary, justifyContent: 'flex-end', overflow: 'hidden'},
  trendFill: {width: '100%', borderRadius: 8},
  trendLabel: {marginTop: 6, color: MUTED, fontSize: 9, fontWeight: '600', textAlign: 'center'},
  trendHint: {marginTop: 10, color: MUTED, fontSize: 10, lineHeight: 14},
  symptomTrendBlock: {marginTop: 12},
  symptomTrendHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6},
  symptomTrendIcon: {marginRight: 0},
  moodTrendLabel: {marginTop: 12, marginBottom: 4},
  monthlyMoodRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: withAlpha(theme.colors.primary, 0.1)},
  labResultLatest: {marginTop: 4, color: PURPLE_DARK, fontSize: 12, fontWeight: '700'},

  pressed: {opacity: 0.82},
  });
}

export default MenopauseStatisticsScreen;
