import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';
import {
  getPregnancyJournalState,
  type PregnancyJournalState,
  type PregnancyWeightEntry,
} from '../../state/pregnancyJournalStore';
import {
  getPregnancyDating,
  hydratePregnancyDating,
  subscribePregnancyDating,
} from '../../state/pregnancyPreferences';
import {getAllJournalEntries} from '../../state/dailyJournalStore';
import {
  getPregnancyMedicalEvents,
  type PregnancyMedicalEvent,
} from '../../state/pregnancyMedicalEventsStore';
import type {
  DailyJournalEntry,
  MoodLevel,
} from '../../types/journal';
import {computePregnancyStatus} from '../../utils/pregnancyTrackingUtils';
import {addDays} from '../../utils/cycleMath';
import {
  coverageMonthsForAnchor,
  cutoffDateForPeriod,
  describeMonthsCoverage,
  formatMonthLabel,
} from '../../utils/cycleStatisticsMath';
import type {StatisticsPeriod} from '../../utils/cycleStatisticsMath';
import {getFloatingTabBarClearance, spacing} from '../../theme/spacing';
import {usePremium} from '../../hooks/usePremium';
import {HawaPremiumBottomSheet} from '../../components/premium/HawaPremiumBottomSheet';
import StatisticsPeriodSelector from '../../components/statistics/StatisticsPeriodSelector';

/* ============================================================
   ASSETS / CONSTANTS
============================================================ */

// The module-level color constants this screen used to hardcode (a purple,
// a darker purple, a soft-purple tint, a purple surface tint, a secondary
// text tone) now live on the resolved theme's `colors.*` (see useAwaTheme())
// and are read fresh inside every component/createStyles() below instead of
// being frozen at module scope.

const PREGNANCY_TOTAL_WEEKS = 40;
// Standard obstetric convention (40 weeks = 280 days) — same total this
// screen already displays via "Semaine X sur 40" in the hero card. Reused
// below to derive the real LMP-equivalent tracking-start anchor from
// computePregnancyStatus's own estimatedDueDate, instead of duplicating the
// PREGNANCY_TOTAL_DAYS/CONCEPTION_TO_LMP_OFFSET_DAYS constants that already
// live (privately) inside pregnancyTrackingUtils.ts.
const PREGNANCY_TOTAL_DAYS = PREGNANCY_TOTAL_WEEKS * 7;

/** One real calendar month's aggregate for the Premium longitudinal
 * ("Évolution mensuelle") view — counts/dates only, never medical-event
 * title/practitioner/location/notes text. A month with zero real recorded
 * data across every category is simply omitted upstream. */
type MonthlyPregnancyBucket = {
  monthKey: string;
  monthLabel: string;
  trackedDays: number;
  topSymptoms: Array<{
    name: string;
    count: number;
  }>;
  weightCount: number;
  latestWeightKg?: number;
  mostFrequentMood?: MoodLevel;
  sleepCount: number;
  averageSleepMinutes?: number;
  appointmentCount: number;
  examCount: number;
};

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

const EMPTY: PregnancyJournalState = {
  symptoms: [],
  weights: [],
  medicalInformationHistory: [],
};

const MOOD_LABELS: Record<
  MoodLevel,
  string
> = {
  veryGood: 'Très bien',
  good: 'Bien',
  neutral: 'Neutre',
  stressed: 'Stressée',
  irritable: 'Irritable',
  anxious: 'Anxieuse',
  sad: 'Triste',
  tired: 'Fatiguée',
  motivated: 'Motivée',
};

const MOOD_ICONS: Record<
  MoodLevel,
  IconName
> = {
  veryGood: 'emoticon-excited-outline',
  good: 'emoticon-happy-outline',
  neutral: 'emoticon-neutral-outline',
  stressed: 'emoticon-confused-outline',
  irritable: 'emoticon-angry-outline',
  anxious: 'emoticon-sad-outline',
  sad: 'emoticon-cry-outline',
  tired: 'sleep',
  motivated: 'arm-flex-outline',
};

/* ============================================================
   HELPERS
============================================================ */

const dateLabel = (
  date: string,
): string =>
  new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: 'numeric',
      month: 'short',
    },
  ).format(
    new Date(
      `${date}T12:00:00`,
    ),
  );

/** Real period-window membership test (Free = 1 mois, Premium = 3/6/12
 * mois) — replaces the old day-based `withinRange`. Mirrors
 * `filterEntriesForPeriod` from cycleStatisticsMath.ts but works on any
 * Pregnancy-specific `{date}` record (symptoms/weights/medical events), not
 * just `DailyJournalEntry[]`. */
const withinPeriod = (
  date: string,
  period: StatisticsPeriod,
  now: Date,
): boolean => {
  const cutoff = cutoffDateForPeriod(
    period,
    now,
  );

  const target = new Date(
    `${date}T12:00:00`,
  );

  return (
    target.getTime() >=
      cutoff.getTime() &&
    target.getTime() <=
      now.getTime()
  );
};

/** Groups any Pregnancy-specific `{date}` record set by real calendar month
 * ('YYYY-MM') — the same grouping `groupEntriesByMonth` does in
 * cycleStatisticsMath.ts, generalized here since symptoms/weights/medical
 * events aren't `DailyJournalEntry[]`. */
function groupByMonth<
  T extends {date: string},
>(items: readonly T[]): Map<string, T[]> {
  const byMonth = new Map<
    string,
    T[]
  >();

  items.forEach(item => {
    const monthKey =
      item.date.slice(0, 7);

    const bucket =
      byMonth.get(monthKey);

    if (bucket) {
      bucket.push(item);
    } else {
      byMonth.set(monthKey, [
        item,
      ]);
    }
  });

  return byMonth;
}

function parseSleepDurationMinutes(
  label: string,
): number | null {
  const match =
    /^(\d+)\s*h\s*(\d{1,2})/.exec(
      label,
    );

  if (!match) {
    return null;
  }

  return (
    Number(match[1]) *
      60 +
    Number(match[2])
  );
}

function formatDurationMinutes(
  minutes: number,
): string {
  return `${Math.floor(
    minutes / 60,
  )} h ${String(
    Math.round(
      minutes % 60,
    ),
  ).padStart(
    2,
    '0',
  )}`;
}

/** Counts/dates-only summary for a trimester's medical follow-up — never
 * surfaces title/practitioner/location/notes text (see privacy rule in
 * CLAUDE.md §6). */
function formatMedicalSummary(
  appointmentCount: number,
  examCount: number,
): string {
  const parts: string[] =
    [];

  if (
    appointmentCount > 0
  ) {
    parts.push(
      `${appointmentCount} rendez-vous ${
        appointmentCount >
        1
          ? 'suivis'
          : 'suivi'
      }`,
    );
  }

  if (examCount > 0) {
    parts.push(
      `${examCount} examen${
        examCount > 1
          ? 's'
          : ''
      }`,
    );
  }

  return parts.join(
    ' · ',
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.empty}>
      <View
        style={
          styles.emptyIcon
        }>
        <MaterialDesignIcons
          color={theme.colors.textMuted}
          name={icon}
          size={23}
        />
      </View>

      <Text
        style={
          styles.emptyText
        }>
        {text}
      </Text>
    </View>
  );
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
    <View
      style={
        styles.sectionHeader
      }>
      <View
        style={
          styles.sectionIcon
        }>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={icon}
          size={20}
        />
      </View>

      <View
        style={
          styles.sectionHeaderCopy
        }>
        <Text
          style={
            styles.cardTitle
          }>
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={
              styles.cardSubtitle
            }>
            {subtitle}
          </Text>
        ) : null}
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
  wide,
}: {
  icon: IconName;
  value: string;
  label: string;
  wide?: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View
      style={[
        styles.kpiCard,
        wide &&
          styles.kpiCardWide,
      ]}>
      <View
        style={
          styles.kpiIcon
        }>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={icon}
          size={20}
        />
      </View>

      <View
        style={
          styles.kpiCopy
        }>
        <Text
          numberOfLines={2}
          style={
            styles.kpiValue
          }>
          {value}
        </Text>

        <Text
          style={
            styles.kpiLabel
          }>
          {label}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   WELLNESS CARD
============================================================ */

function WellnessCard({
  icon,
  value,
  label,
  supporting,
  wide,
}: {
  icon: IconName;
  value: string;
  label: string;
  supporting?: string;
  wide?: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View
      style={[
        styles.wellnessCard,
        wide &&
          styles.wellnessCardWide,
      ]}>
      <View
        style={
          styles.wellnessTop
        }>
        <View
          style={
            styles.wellnessIcon
          }>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name={icon}
            size={21}
          />
        </View>

        <MaterialDesignIcons
          color={theme.colors.textMuted}
          name="chart-line"
          size={16}
        />
      </View>

      <Text
        numberOfLines={2}
        style={
          styles.wellnessValue
        }>
        {value}
      </Text>

      <Text
        style={
          styles.wellnessLabel
        }>
        {label}
      </Text>

      {supporting ? (
        <Text
          numberOfLines={1}
          style={
            styles.wellnessSupporting
          }>
          {supporting}
        </Text>
      ) : null}
    </View>
  );
}

/* ============================================================
   WEIGHT CHART BAR
============================================================ */

function WeightBar({
  entry,
  min,
  max,
}: {
  entry: PregnancyWeightEntry;
  min: number;
  max: number;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const span = Math.max(
    max - min,
    0.4,
  );

  const relative =
    (entry.valueKg -
      min) /
    span;

  const height =
    28 +
    relative * 72;

  return (
    <View
      style={
        styles.barColumn
      }>
      <Text
        numberOfLines={1}
        style={
          styles.barValue
        }>
        {entry.valueKg.toLocaleString(
          'fr-FR',
        )}
      </Text>

      <View
        style={
          styles.barTrack
        }>
        <View
          style={[
            styles.barFill,
            {
              height: `${Math.min(
                100,
                Math.max(
                  28,
                  height,
                ),
              )}%`,
            },
          ]}
        />
      </View>

      <Text
        numberOfLines={1}
        style={
          styles.barDate
        }>
        {dateLabel(
          entry.date,
        )}
      </Text>
    </View>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

function PregnancyStatisticsScreen(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const insets =
    useSafeAreaInsets();

  const {width} =
    useWindowDimensions();

  const compact =
    width < 370;

  const [
    state,
    setState,
  ] =
    useState<PregnancyJournalState>(
      EMPTY,
    );

  const [
    journalEntries,
    setJournalEntries,
  ] = useState<
    DailyJournalEntry[]
  >([]);

  const [
    medicalEvents,
    setMedicalEvents,
  ] = useState<
    PregnancyMedicalEvent[]
  >([]);

  const [
    period,
    setPeriod,
  ] =
    useState<StatisticsPeriod>(
      '1',
    );

  const {isPremium} =
    usePremium();

  const [
    premiumVisible,
    setPremiumVisible,
  ] = useState(false);

  // Frozen once per mount (not recomputed per render) so every period-filter
  // memo below shares the exact same "now" boundary — same convention as
  // Conceive/Cycle Statistics screens.
  const now = useMemo(
    () => new Date(),
    [],
  );

  /* ==========================================================
     LOAD JOURNAL
  ========================================================== */

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      Promise.all([
        getPregnancyJournalState(),
        getAllJournalEntries(),
        getPregnancyMedicalEvents(),
      ]).then(
        ([
          journal,
          entries,
          events,
        ]) => {
          if (mounted) {
            setState(
              journal,
            );

            setJournalEntries(
              entries,
            );

            setMedicalEvents(
              events,
            );
          }
        },
      );

      return () => {
        mounted = false;
      };
    }, []),
  );

  /* ==========================================================
     PREGNANCY STATUS
  ========================================================== */

  const [
    dating,
    setDating,
  ] = useState(
    getPregnancyDating,
  );

  useEffect(() => {
    let active = true;

    hydratePregnancyDating().then(
      value => {
        if (active) {
          setDating(
            value,
          );
        }
      },
    );

    const unsubscribe =
      subscribePregnancyDating(
        () => {
          if (active) {
            setDating(
              getPregnancyDating(),
            );
          }
        },
      );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const pregnancyStatus =
    useMemo(
      () =>
        computePregnancyStatus(
          dating.method,

          dating.date
            ? new Date(
                dating.date,
              )
            : null,

          new Date(),
        ),

      [dating],
    );

  /* ==========================================================
     PREGNANCY JOURNAL FILTERS
  ========================================================== */

  const weights =
    useMemo(
      () =>
        state.weights.filter(
          item =>
            withinPeriod(
              item.date,
              period,
              now,
            ),
        ),

      [
        period,
        now,
        state.weights,
      ],
    );

  const symptoms =
    useMemo(
      () =>
        state.symptoms.filter(
          item =>
            withinPeriod(
              item.date,
              period,
              now,
            ),
        ),

      [
        period,
        now,
        state.symptoms,
      ],
    );

  const periodEntries =
    useMemo(
      () =>
        journalEntries.filter(
          entry =>
            withinPeriod(
              entry.date,
              period,
              now,
            ),
        ),

      [
        journalEntries,
        period,
        now,
      ],
    );

  const medicalInfoDatesInPeriod =
    useMemo(
      () =>
        state.medicalInformationHistory
          .filter(
            entry =>
              entry.date &&
              withinPeriod(
                entry.date,
                period,
                now,
              ),
          )
          .map(entry => entry.date as string)
          .sort(),

      [
        state.medicalInformationHistory,
        period,
        now,
      ],
    );

  const medicalEventsInPeriod =
    useMemo(
      () =>
        medicalEvents.filter(
          event =>
            withinPeriod(
              event.date,
              period,
              now,
            ),
        ),

      [
        medicalEvents,
        period,
        now,
      ],
    );

  const appointmentCount =
    useMemo(
      () =>
        medicalEventsInPeriod.filter(
          event =>
            event.type ===
            'appointment',
        ).length,

      [medicalEventsInPeriod],
    );

  const examCount =
    useMemo(
      () =>
        medicalEventsInPeriod.filter(
          event =>
            event.type ===
            'exam',
        ).length,

      [medicalEventsInPeriod],
    );

  const trackingDates =
    useMemo(() => {
      const dates =
        new Set<string>();

      weights.forEach(
        item =>
          dates.add(
            item.date,
          ),
      );

      symptoms.forEach(
        item =>
          dates.add(
            item.date,
          ),
      );

      periodEntries.forEach(
        entry => {
          if (
            entry.mood
          ) {
            dates.add(
              entry.date,
            );
          }

          if (
            entry.sleep
          ) {
            dates.add(
              entry.date,
            );
          }
        },
      );

      medicalInfoDatesInPeriod.forEach(
        date =>
          dates.add(
            date,
          ),
      );

      medicalEventsInPeriod.forEach(
        event =>
          dates.add(
            event.date,
          ),
      );

      return dates;
    }, [
      symptoms,
      weights,
      periodEntries,
      medicalInfoDatesInPeriod,
      medicalEventsInPeriod,
    ]);

  const trackedDays =
    trackingDates.size;

  /* ==========================================================
     COMPLETE DAYS — a Pregnancy day is only "complete" once all
     5 canonical Daily Journal categories have a real saved entry
     (symptoms/weight/mood/sleep/medicalInfo) — see
     isPregnancyTrackingCategoryCompleted, the same source of truth
     used by the Dashboard's "Suivi du jour" completion count.
  ========================================================== */

  const completeDays =
    useMemo(() => {
      let count = 0;

      trackingDates.forEach(
        date => {
          const hasSymptoms =
            symptoms.some(
              item =>
                item.date ===
                date,
            );

          const hasWeight =
            weights.some(
              item =>
                item.date ===
                date,
            );

          const dailyEntry =
            periodEntries.find(
              entry =>
                entry.date ===
                date,
            );

          const hasMood =
            Boolean(
              dailyEntry?.mood,
            );

          const hasSleep =
            Boolean(
              dailyEntry?.sleep,
            );

          const hasMedicalInfo =
            medicalInfoDatesInPeriod.includes(
              date,
            );

          if (
            hasSymptoms &&
            hasWeight &&
            hasMood &&
            hasSleep &&
            hasMedicalInfo
          ) {
            count += 1;
          }
        },
      );

      return count;
    }, [
      trackingDates,
      symptoms,
      weights,
      periodEntries,
      medicalInfoDatesInPeriod,
    ]);

  /* ==========================================================
     SYMPTOMS
  ========================================================== */

  const symptomCounts =
    useMemo(() => {
      const counts =
        new Map<
          string,
          number
        >();

      symptoms.forEach(
        entry => {
          entry.symptoms.forEach(
            name => {
              counts.set(
                name,
                (counts.get(
                  name,
                ) ??
                  0) +
                  1,
              );
            },
          );
        },
      );

      return [
        ...counts.entries(),
      ]
        .map(
          ([
            name,
            count,
          ]) => ({
            name,
            count,
          }),
        )
        .sort(
          (a, b) =>
            b.count -
              a.count ||
            a.name.localeCompare(
              b.name,
            ),
        );
    }, [symptoms]);

  const mostFrequentSymptom =
    symptomCounts[0];

  const maxSymptomCount =
    Math.max(
      ...symptomCounts.map(
        item =>
          item.count,
      ),
      1,
    );

  /* ==========================================================
     WEIGHT
  ========================================================== */

  const latestWeight =
    weights[
      weights.length - 1
    ];

  const previousWeight =
    weights[
      weights.length - 2
    ];

  const weightDelta =
    latestWeight &&
    previousWeight
      ? latestWeight.valueKg -
        previousWeight.valueKg
      : undefined;

  const visibleWeightChart =
    weights.slice(-8);

  const minWeight =
    visibleWeightChart.length
      ? Math.min(
          ...visibleWeightChart.map(
            item =>
              item.valueKg,
          ),
        )
      : 0;

  const maxWeight =
    visibleWeightChart.length
      ? Math.max(
          ...visibleWeightChart.map(
            item =>
              item.valueKg,
          ),
        )
      : 1;

  const weightHistory =
    useMemo(
      () =>
        weights
          .map(
            (
              entry,
              index,
            ) => ({
              entry,

              delta:
                index >
                0
                  ? entry.valueKg -
                    weights[
                      index -
                        1
                    ]
                      .valueKg
                  : undefined,
            }),
          )
          .reverse(),

      [weights],
    );

  /* ==========================================================
     MOOD
  ========================================================== */

  const moodEntries =
    useMemo(
      () =>
        periodEntries.filter(
          entry =>
            entry.mood,
        ),

      [periodEntries],
    );

  const moodCounts =
    useMemo(() => {
      const counts =
        new Map<
          MoodLevel,
          number
        >();

      moodEntries.forEach(
        entry => {
          if (
            entry.mood
          ) {
            counts.set(
              entry.mood
                .level,

              (counts.get(
                entry.mood
                  .level,
              ) ??
                0) +
                1,
            );
          }
        },
      );

      return [
        ...counts.entries(),
      ].sort(
        (a, b) =>
          b[1] - a[1],
      );
    }, [moodEntries]);

  const mostFrequentMood =
    moodCounts[0]?.[0];

  /* ==========================================================
     SLEEP
  ========================================================== */

  const sleepEntries =
    useMemo(
      () =>
        periodEntries.filter(
          entry =>
            entry.sleep
              ?.duration,
        ),

      [periodEntries],
    );

  const sleepDurations =
    useMemo(
      () =>
        sleepEntries
          .map(entry =>
            parseSleepDurationMinutes(
              entry.sleep!
                .duration!,
            ),
          )
          .filter(
            (
              value,
            ): value is number =>
              value !==
              null,
          ),

      [sleepEntries],
    );

  const averageSleepMinutes =
    sleepDurations.length >
    0
      ? sleepDurations.reduce(
          (
            sum,
            value,
          ) =>
            sum + value,
          0,
        ) /
        sleepDurations.length
      : undefined;

  /* ==========================================================
     MEDICAL INFORMATION — presence/history only, never an average
     or a score (a free-text note has neither).
  ========================================================== */

  const hasMedicalInfoInPeriod =
    medicalInfoDatesInPeriod.length >
    0;

  const hasAppointmentsInPeriod =
    appointmentCount +
      examCount >
    0;

  // "Détails du suivi" renders sleep, then medical info, then
  // appointments/exams — only the last row actually shown should draw
  // without a bottom border.
  const isSleepRowLast =
    sleepEntries.length >
      0 &&
    !hasMedicalInfoInPeriod &&
    !hasAppointmentsInPeriod;

  const isMedicalInfoRowLast =
    hasMedicalInfoInPeriod &&
    !hasAppointmentsInPeriod;

  /* ==========================================================
     PERIOD COVERAGE — the real Pregnancy tracking-start anchor is
     derived from computePregnancyStatus's own `estimatedDueDate`
     (LMP-equivalent start = DPA − 280 jours), the SAME anchor the
     hero card already uses, regardless of which of the 3 dating
     methods was chosen — so a 12-month Premium selection never
     implies more history exists than a pregnancy naturally has.
  ========================================================== */

  const anchorDate =
    useMemo(() => {
      if (
        !pregnancyStatus.configured ||
        !pregnancyStatus.estimatedDueDate
      ) {
        return null;
      }

      return addDays(
        pregnancyStatus.estimatedDueDate,
        -PREGNANCY_TOTAL_DAYS,
      );
    }, [pregnancyStatus]);

  const coverageMonths =
    useMemo(
      () =>
        coverageMonthsForAnchor(
          period,
          anchorDate,
          now,
        ),

      [
        period,
        anchorDate,
        now,
      ],
    );

  const coverageMessage =
    useMemo(
      () =>
        describeMonthsCoverage(
          period,
          coverageMonths,
        ),

      [
        period,
        coverageMonths,
      ],
    );

  const showLongitudinalView =
    period !== '1';

  /* ==========================================================
     MONTHLY BREAKDOWN (PREMIUM, 3/6/12 mois) — real month-by-month
     evolution of symptoms/weight/mood/sleep/appointments-exams
     across the selected period, built from the SAME period-filtered
     sets every other section above already uses (symptoms, weights,
     periodEntries, medicalEventsInPeriod) — never a separate,
     independently-filtered dataset. A month with zero real data
     across every category is omitted, never shown as a zero row.
     Only counts/dates ever surface here — no medical-event
     title/practitioner/location/notes text.
  ========================================================== */

  const monthlyBreakdown =
    useMemo<
      MonthlyPregnancyBucket[]
    >(() => {
      const symptomsByMonth =
        groupByMonth(
          symptoms,
        );

      const weightsByMonth =
        groupByMonth(
          weights,
        );

      const journalByMonth =
        groupByMonth(
          periodEntries,
        );

      const eventsByMonth =
        groupByMonth(
          medicalEventsInPeriod,
        );

      const monthKeys =
        new Set<string>([
          ...symptomsByMonth.keys(),
          ...weightsByMonth.keys(),
          ...journalByMonth.keys(),
          ...eventsByMonth.keys(),
        ]);

      return Array.from(
        monthKeys,
      )
        .sort()
        .map(monthKey => {
          const monthSymptoms =
            symptomsByMonth.get(
              monthKey,
            ) ?? [];

          const monthWeights =
            weightsByMonth.get(
              monthKey,
            ) ?? [];

          const monthJournal =
            journalByMonth.get(
              monthKey,
            ) ?? [];

          const monthEvents =
            eventsByMonth.get(
              monthKey,
            ) ?? [];

          const trackedDates =
            new Set<string>();

          monthSymptoms.forEach(
            item =>
              trackedDates.add(
                item.date,
              ),
          );

          monthWeights.forEach(
            item =>
              trackedDates.add(
                item.date,
              ),
          );

          monthJournal.forEach(
            entry => {
              if (
                entry.mood ||
                entry.sleep
              ) {
                trackedDates.add(
                  entry.date,
                );
              }
            },
          );

          monthEvents.forEach(
            event =>
              trackedDates.add(
                event.date,
              ),
          );

          if (
            trackedDates.size ===
            0
          ) {
            return null;
          }

          const monthSymptomCounts =
            new Map<
              string,
              number
            >();

          monthSymptoms.forEach(
            entry => {
              entry.symptoms.forEach(
                name => {
                  monthSymptomCounts.set(
                    name,
                    (monthSymptomCounts.get(
                      name,
                    ) ??
                      0) +
                      1,
                  );
                },
              );
            },
          );

          const topSymptoms =
            [
              ...monthSymptomCounts.entries(),
            ]
              .map(
                ([
                  name,
                  count,
                ]) => ({
                  name,
                  count,
                }),
              )
              .sort(
                (
                  a,
                  b,
                ) =>
                  b.count -
                    a.count ||
                  a.name.localeCompare(
                    b.name,
                  ),
              )
              .slice(
                0,
                3,
              );

          const sortedWeights =
            [
              ...monthWeights,
            ].sort(
              (a, b) =>
                a.date.localeCompare(
                  b.date,
                ),
            );

          const latestWeightEntry =
            sortedWeights[
              sortedWeights.length -
                1
            ];

          const monthMoodEntries =
            monthJournal.filter(
              entry =>
                entry.mood,
            );

          const monthMoodCounts =
            new Map<
              MoodLevel,
              number
            >();

          monthMoodEntries.forEach(
            entry => {
              if (
                entry.mood
              ) {
                monthMoodCounts.set(
                  entry.mood
                    .level,
                  (monthMoodCounts.get(
                    entry.mood
                      .level,
                  ) ??
                    0) +
                    1,
                );
              }
            },
          );

          const monthMostFrequentMood =
            [
              ...monthMoodCounts.entries(),
            ].sort(
              (a, b) =>
                b[1] -
                a[1],
            )[0]?.[0];

          const monthSleepEntries =
            monthJournal.filter(
              entry =>
                entry.sleep
                  ?.duration,
            );

          const monthSleepDurations =
            monthSleepEntries
              .map(entry =>
                parseSleepDurationMinutes(
                  entry.sleep!
                    .duration!,
                ),
              )
              .filter(
                (
                  value,
                ): value is number =>
                  value !==
                  null,
              );

          const monthAverageSleepMinutes =
            monthSleepDurations.length >
            0
              ? monthSleepDurations.reduce(
                  (
                    sum,
                    value,
                  ) =>
                    sum +
                    value,
                  0,
                ) /
                monthSleepDurations.length
              : undefined;

          const result: MonthlyPregnancyBucket =
            {
              monthKey,

              monthLabel:
                formatMonthLabel(
                  monthKey,
                ),

              trackedDays:
                trackedDates.size,

              topSymptoms,

              weightCount:
                monthWeights.length,

              latestWeightKg:
                latestWeightEntry?.valueKg,

              mostFrequentMood:
                monthMostFrequentMood,

              sleepCount:
                monthSleepEntries.length,

              averageSleepMinutes:
                monthAverageSleepMinutes,

              appointmentCount:
                monthEvents.filter(
                  event =>
                    event.type ===
                    'appointment',
                ).length,

              examCount:
                monthEvents.filter(
                  event =>
                    event.type ===
                    'exam',
                ).length,
            };

          return result;
        })
        .filter(
          (
            bucket,
          ): bucket is MonthlyPregnancyBucket =>
            bucket !==
            null,
        );
    }, [
      symptoms,
      weights,
      periodEntries,
      medicalEventsInPeriod,
    ]);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={
        styles.background
      }>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>
      <SafeAreaView
        edges={[
          'top',
          'left',
          'right',
        ]}
        style={
          styles.safeArea
        }>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,

            compact &&
              styles.contentCompact,

            {
              paddingBottom: getFloatingTabBarClearance(insets.bottom, 30),
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }>
          {/* ==================================================
              HEADER
          =================================================== */}

          <View
            style={
              styles.headerRow
            }>
            <View
              style={
                styles.headerCopy
              }>
              <Text
                style={
                  styles.title
                }>
                Statistiques
              </Text>

              <Text
                style={
                  styles.subtitle
                }>
                Tes tendances et ton évolution pendant la grossesse
              </Text>
            </View>

            <View
              style={
                styles.headerIcon
              }>
              <MaterialDesignIcons
                color={
                  theme.colors.primary
                }
                name="chart-timeline-variant-shimmer"
                size={25}
              />
            </View>
          </View>

          {/* ==================================================
              PREMIUM PREGNANCY HERO
          =================================================== */}

          {!pregnancyStatus.configured ? (
            <View
              style={
                styles.heroCard
              }>
              <EmptyState
                icon="human-pregnant"
                text="Configure la date de ta grossesse pour voir ta semaine, ton trimestre et ta date prévue d’accouchement."
              />
            </View>
          ) : (
            <View
              style={
                styles.heroCard
              }>
              <View
                style={
                  styles.heroDecorOne
                }
              />

              <View
                style={
                  styles.heroDecorTwo
                }
              />

              <View
                style={
                  styles.heroTop
                }>
                <View
                  style={
                    styles.heroMain
                  }>
                  <Text
                    style={
                      styles.heroEyebrow
                    }>
                    TA GROSSESSE
                  </Text>

                  <View
                    style={
                      styles.heroWeekRow
                    }>
                    <Text
                      style={
                        styles.heroWeekNumber
                      }>
                      {
                        pregnancyStatus.week
                      }
                    </Text>

                    <View
                      style={
                        styles.heroWeekCopy
                      }>
                      <Text
                        style={
                          styles.heroWeekLabel
                        }>
                        semaine
                      </Text>

                      <Text
                        style={
                          styles.heroGestationalAge
                        }>
                        {
                          pregnancyStatus.gestationalWeeks
                        }{' '}
                        SA +{' '}
                        {
                          pregnancyStatus.gestationalDays
                        }{' '}
                        jours
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={
                    styles.heroPercentCircle
                  }>
                  <Text
                    style={
                      styles.heroPercentValue
                    }>
                    {
                      pregnancyStatus.progressPercent
                    }
                    %
                  </Text>

                  <Text
                    style={
                      styles.heroPercentLabel
                    }>
                    effectué
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.heroProgressHeader
                }>
                <Text
                  style={
                    styles.heroProgressLabel
                  }>
                  Semaine{' '}
                  {
                    pregnancyStatus.week
                  }{' '}
                  sur{' '}
                  {
                    PREGNANCY_TOTAL_WEEKS
                  }
                </Text>

                <Text
                  style={
                    styles.heroProgressRight
                  }>
                  {
                    Math.max(
                      0,
                      PREGNANCY_TOTAL_WEEKS -
                        pregnancyStatus.week,
                    )
                  }{' '}
                  sem. restantes
                </Text>
              </View>

              <View
                style={
                  styles.heroProgressTrack
                }>
                <View
                  style={[
                    styles.heroProgressFill,

                    {
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          pregnancyStatus.progressPercent,
                        ),
                      )}%`,
                    },
                  ]}
                />
              </View>

              <View
                style={
                  styles.heroMeta
                }>
                <View
                  style={
                    styles.heroMetaItem
                  }>
                  <View
                    style={
                      styles.heroMetaIcon
                    }>
                    <MaterialDesignIcons
                      color={
                        theme.colors.primary
                      }
                      name="progress-clock"
                      size={18}
                    />
                  </View>

                  <View
                    style={
                      styles.heroMetaCopy
                    }>
                    <Text
                      style={
                        styles.heroMetaLabel
                      }>
                      Trimestre
                    </Text>

                    <Text
                      style={
                        styles.heroMetaValue
                      }>
                      {
                        pregnancyStatus.trimester
                      }
                      {pregnancyStatus.trimester ===
                      1
                        ? 'er'
                        : 'e'}{' '}
                      trimestre
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.heroDivider
                  }
                />

                <View
                  style={
                    styles.heroMetaItem
                  }>
                  <View
                    style={
                      styles.heroMetaIcon
                    }>
                    <MaterialDesignIcons
                      color={
                        theme.colors.primary
                      }
                      name="calendar-heart"
                      size={18}
                    />
                  </View>

                  <View
                    style={
                      styles.heroMetaCopy
                    }>
                    <Text
                      style={
                        styles.heroMetaLabel
                      }>
                      DPA
                    </Text>

                    <Text
                      numberOfLines={
                        1
                      }
                      style={
                        styles.heroMetaValue
                      }>
                      {pregnancyStatus.estimatedDueDate
                        ? new Intl.DateTimeFormat(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month:
                                'short',
                              year: 'numeric',
                            },
                          ).format(
                            pregnancyStatus.estimatedDueDate,
                          )
                        : '—'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ==================================================
              PERIOD SELECTOR — 1 mois (Free), 3/6/12 mois (Premium)
              — same architecture and component as every other
              objective's Statistics screen.
          =================================================== */}

          <View
            style={
              styles.filtersWrapper
            }>
            <StatisticsPeriodSelector
              isPremium={
                isPremium
              }
              onRequestPremium={() =>
                setPremiumVisible(
                  true,
                )
              }
              onSelectPeriod={
                setPeriod
              }
              period={
                period
              }
            />

            {coverageMessage ? (
              <View
                style={
                  styles.hintCard
                }>
                <MaterialDesignIcons
                  color={
                    theme.colors.primary
                  }
                  name="information-outline"
                  size={17}
                />

                <Text
                  style={
                    styles.hint
                  }>
                  {
                    coverageMessage
                  }
                </Text>
              </View>
            ) : null}
          </View>

          {/* ==================================================
              OVERVIEW
          =================================================== */}

          <View
            style={
              styles.sectionHeadingRow
            }>
            <View>
              <Text
                style={
                  styles.sectionTitle
                }>
                Vue d’ensemble
              </Text>

              <Text
                style={
                  styles.sectionDescription
                }>
                Résumé de la période sélectionnée
              </Text>
            </View>
          </View>

          <View
            style={
              styles.kpiGrid
            }>
            <KpiCard
              icon="calendar-check-outline"
              label="Jours suivis"
              value={
                trackedDays >
                0
                  ? String(
                      trackedDays,
                    )
                  : '—'
              }
            />

            <KpiCard
              icon="calendar-star"
              label="Journées complètes"
              value={
                completeDays >
                0
                  ? String(
                      completeDays,
                    )
                  : '—'
              }
            />

            <KpiCard
              icon="scale-bathroom"
              label="Dernier poids"
              value={
                latestWeight
                  ? `${latestWeight.valueKg.toLocaleString(
                      'fr-FR',
                    )} kg`
                  : '—'
              }
            />

            <KpiCard
              icon="heart-pulse"
              label="Symptôme le plus fréquent"
              value={
                mostFrequentSymptom?.name ??
                'Aucune donnée'
              }
              wide
            />
          </View>

          {/* ==================================================
              WEIGHT
          =================================================== */}

          <View
            style={
              styles.card
            }>
            <SectionHeader
              icon="scale-bathroom"
              subtitle="Visualise l’évolution de tes mesures"
              title="Évolution du poids"
            />

            {!latestWeight ? (
              <EmptyState
                icon="scale-bathroom"
                text="Pas encore de mesure enregistrée."
              />
            ) : (
              <>
                <View
                  style={
                    styles.weightSummary
                  }>
                  <View
                    style={
                      styles.weightSummaryCopy
                    }>
                    <Text
                      style={
                        styles.metricLabel
                      }>
                      Dernière mesure
                    </Text>

                    <Text
                      style={
                        styles.metricValue
                      }>
                      {latestWeight.valueKg.toLocaleString(
                        'fr-FR',
                      )}{' '}
                      kg
                    </Text>

                    <Text
                      style={
                        styles.metricDate
                      }>
                      {
                        dateLabel(
                          latestWeight.date,
                        )
                      }
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.deltaBadge,

                      weightDelta !==
                        undefined &&
                        weightDelta <
                          0 &&
                        styles.deltaBadgeNegative,
                    ]}>
                    <MaterialDesignIcons
                      color={
                        weightDelta !==
                          undefined &&
                        weightDelta <
                          0
                          ? theme.colors.danger
                          : theme.colors.primary
                      }
                      name={
                        weightDelta ===
                        undefined
                          ? 'minus'
                          : weightDelta >=
                              0
                            ? 'trending-up'
                            : 'trending-down'
                      }
                      size={17}
                    />

                    <View>
                      <Text
                        style={[
                          styles.deltaValue,

                          weightDelta !==
                            undefined &&
                            weightDelta <
                              0 &&
                            styles.deltaValueNegative,
                        ]}>
                        {weightDelta ===
                        undefined
                          ? '—'
                          : `${
                              weightDelta >=
                              0
                                ? '+'
                                : '−'
                            }${Math.abs(
                              weightDelta,
                            ).toLocaleString(
                              'fr-FR',
                            )} kg`}
                      </Text>

                      <Text
                        style={
                          styles.deltaLabel
                        }>
                        depuis la précédente
                      </Text>
                    </View>
                  </View>
                </View>

                {weights.length <
                2 ? (
                  <View
                    style={
                      styles.hintCard
                    }>
                    <MaterialDesignIcons
                      color={
                        theme.colors.primary
                      }
                      name="information-outline"
                      size={17}
                    />

                    <Text
                      style={
                        styles.hint
                      }>
                      Ajoute une autre mesure pour voir ton évolution.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View
                      style={
                        styles.chartHeader
                      }>
                      <Text
                        style={
                          styles.chartTitle
                        }>
                        Dernières mesures
                      </Text>

                      <Text
                        style={
                          styles.chartHint
                        }>
                        {
                          Math.min(
                            weights.length,
                            8,
                          )
                        }{' '}
                        valeurs
                      </Text>
                    </View>

                    <View
                      style={
                        styles.weightChart
                      }>
                      {visibleWeightChart.map(
                        entry => (
                          <WeightBar
                            entry={
                              entry
                            }
                            key={
                              entry.date
                            }
                            max={
                              maxWeight
                            }
                            min={
                              minWeight
                            }
                          />
                        ),
                      )}
                    </View>

                    <View
                      style={
                        styles.historyHeader
                      }>
                      <Text
                        style={
                          styles.historyTitle
                        }>
                        Historique
                      </Text>

                      <View
                        style={
                          styles.historyCount
                        }>
                        <Text
                          style={
                            styles.historyCountText
                          }>
                          {
                            weights.length
                          }{' '}
                          mesures
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.weightHistoryList
                      }>
                      {weightHistory.map(
                        (
                          {
                            entry,
                            delta,
                          },
                          index,
                        ) => (
                          <View
                            key={
                              entry.date
                            }
                            style={[
                              styles.weightHistoryRow,

                              index ===
                                weightHistory.length -
                                  1 &&
                                styles.lastRow,
                            ]}>
                            <View
                              style={
                                styles.historyDateIcon
                              }>
                              <MaterialDesignIcons
                                color={
                                  theme.colors.primary
                                }
                                name="calendar-blank-outline"
                                size={15}
                              />
                            </View>

                            <Text
                              style={
                                styles.weightHistoryDate
                              }>
                              {dateLabel(
                                entry.date,
                              )}
                            </Text>

                            <Text
                              style={
                                styles.weightHistoryValue
                              }>
                              {entry.valueKg.toLocaleString(
                                'fr-FR',
                              )}{' '}
                              kg
                            </Text>

                            {delta !==
                            undefined ? (
                              <Text
                                style={[
                                  styles.weightHistoryDelta,

                                  delta <
                                    0 &&
                                    styles.weightHistoryDeltaNegative,
                                ]}>
                                {delta >=
                                0
                                  ? '+'
                                  : '−'}
                                {Math.abs(
                                  delta,
                                ).toLocaleString(
                                  'fr-FR',
                                )}
                              </Text>
                            ) : null}
                          </View>
                        ),
                      )}
                    </View>
                  </>
                )}
              </>
            )}

            {showLongitudinalView &&
            monthlyBreakdown.some(
              month =>
                month.weightCount >
                0,
            ) ? (
              <View
                style={
                  styles.monthList
                }>
                <Text
                  style={
                    styles.monthListTitle
                  }>
                  Évolution par mois
                </Text>

                {monthlyBreakdown
                  .filter(
                    month =>
                      month.weightCount >
                      0,
                  )
                  .map(month => (
                    <View
                      key={
                        month.monthKey
                      }
                      style={
                        styles.monthItem
                      }>
                      <View
                        style={
                          styles.monthTop
                        }>
                        <Text
                          style={
                            styles.monthLabel
                          }>
                          {
                            month.monthLabel
                          }
                        </Text>

                        <Text
                          style={
                            styles.monthMeta
                          }>
                          {
                            month.weightCount
                          }{' '}
                          {month.weightCount >
                          1
                            ? 'mesures'
                            : 'mesure'}
                          {month.latestWeightKg !==
                          undefined
                            ? ` · dernière ${month.latestWeightKg.toLocaleString(
                                'fr-FR',
                              )} kg`
                            : ''}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            ) : null}
          </View>

          {/* ==================================================
              SYMPTOMS
          =================================================== */}

          <View
            style={
              styles.card
            }>
            <SectionHeader
              icon="heart-pulse"
              subtitle={
                showLongitudinalView
                  ? 'Fréquence et évolution sur la période sélectionnée'
                  : 'Les symptômes que tu as le plus enregistrés'
              }
              title="Symptômes fréquents"
            />

            {symptomCounts.length ===
            0 ? (
              <EmptyState
                icon="heart-pulse"
                text="Ajoute des symptômes dans ton Journal grossesse pour voir leur fréquence ici."
              />
            ) : (
              <View
                style={
                  styles.symptomList
                }>
                {symptomCounts
                  .slice(
                    0,
                    6,
                  )
                  .map(
                    (
                      item,
                      index,
                    ) => {
                      const percent =
                        (item.count /
                          maxSymptomCount) *
                        100;

                      return (
                        <View
                          key={
                            item.name
                          }
                          style={[
                            styles.symptomItem,

                            index ===
                              symptomCounts.slice(
                                0,
                                6,
                              )
                                .length -
                                1 &&
                              styles.symptomItemLast,
                          ]}>
                          <View
                            style={
                              styles.symptomTop
                            }>
                            <View
                              style={
                                styles.rank
                              }>
                              <Text
                                style={
                                  styles.rankText
                                }>
                                {index +
                                  1}
                              </Text>
                            </View>

                            <Text
                              style={
                                styles.symptomName
                              }>
                              {
                                item.name
                              }
                            </Text>

                            <View
                              style={
                                styles.symptomCountBadge
                              }>
                              <Text
                                style={
                                  styles.symptomCount
                                }>
                                {
                                  item.count
                                }{' '}
                                {item.count >
                                1
                                  ? 'jours'
                                  : 'jour'}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={
                              styles.symptomProgressTrack
                            }>
                            <View
                              style={[
                                styles.symptomProgressFill,

                                {
                                  width: `${Math.max(
                                    12,
                                    percent,
                                  )}%`,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    },
                  )}
              </View>
            )}

            {showLongitudinalView &&
            monthlyBreakdown.some(
              month =>
                month.topSymptoms
                  .length >
                0,
            ) ? (
              <View
                style={
                  styles.monthList
                }>
                <Text
                  style={
                    styles.monthListTitle
                  }>
                  Évolution par mois
                </Text>

                {monthlyBreakdown
                  .filter(
                    month =>
                      month.topSymptoms
                        .length >
                      0,
                  )
                  .map(month => (
                    <View
                      key={
                        month.monthKey
                      }
                      style={
                        styles.monthItem
                      }>
                      <View
                        style={
                          styles.monthTop
                        }>
                        <Text
                          style={
                            styles.monthLabel
                          }>
                          {
                            month.monthLabel
                          }
                        </Text>
                      </View>

                      <View
                        style={
                          styles.chipRow
                        }>
                        {month.topSymptoms.map(
                          symptom => (
                            <View
                              key={
                                symptom.name
                              }
                              style={
                                styles.chip
                              }>
                              <Text
                                style={
                                  styles.chipText
                                }>
                                {
                                  symptom.name
                                }{' '}
                                ·{' '}
                                {
                                  symptom.count
                                }{' '}
                                j
                              </Text>
                            </View>
                          ),
                        )}
                      </View>
                    </View>
                  ))}
              </View>
            ) : null}
          </View>

          {/* ==================================================
              WELLNESS
          =================================================== */}

          <View
            style={
              styles.sectionHeadingRow
            }>
            <View>
              <Text
                style={
                  styles.sectionTitle
                }>
                Bien-être
              </Text>

              <Text
                style={
                  styles.sectionDescription
                }>
                {showLongitudinalView
                  ? 'Ton évolution sur la période sélectionnée'
                  : 'Tes tendances quotidiennes'}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.wellnessGrid
            }>
            <WellnessCard
              icon={
                mostFrequentMood
                  ? MOOD_ICONS[
                      mostFrequentMood
                    ]
                  : 'emoticon-outline'
              }
              label="Humeur"
              supporting={
                moodEntries.length >
                0
                  ? `${moodEntries.length} ${
                      moodEntries.length >
                      1
                        ? 'entrées'
                        : 'entrée'
                    }`
                  : 'Aucune donnée'
              }
              value={
                mostFrequentMood
                  ? MOOD_LABELS[
                      mostFrequentMood
                    ]
                  : '—'
              }
            />

            <WellnessCard
              icon="weather-night"
              label="Sommeil"
              supporting={
                sleepEntries.length >
                0
                  ? `${sleepEntries.length} ${
                      sleepEntries.length >
                      1
                        ? 'nuits suivies'
                        : 'nuit suivie'
                    }`
                  : 'Aucune donnée'
              }
              value={
                averageSleepMinutes !==
                undefined
                  ? formatDurationMinutes(
                      averageSleepMinutes,
                    )
                  : '—'
              }
            />
          </View>

          {showLongitudinalView &&
          monthlyBreakdown.some(
            month =>
              month.mostFrequentMood !==
                undefined ||
              month.sleepCount >
                0,
          ) ? (
            <View
              style={
                styles.card
              }>
              <SectionHeader
                icon="chart-box-outline"
                subtitle="Ton humeur et ton sommeil, mois par mois"
                title="Évolution du bien-être"
              />

              <View
                style={
                  styles.monthList
                }>
                {monthlyBreakdown
                  .filter(
                    month =>
                      month.mostFrequentMood !==
                        undefined ||
                      month.sleepCount >
                        0,
                  )
                  .map(
                    (
                      month,
                      index,
                      array,
                    ) => (
                      <View
                        key={
                          month.monthKey
                        }
                        style={[
                          styles.monthItem,

                          index ===
                            array.length -
                              1 &&
                            styles.lastRow,
                        ]}>
                        <View
                          style={
                            styles.monthTop
                          }>
                          <Text
                            style={
                              styles.monthLabel
                            }>
                            {
                              month.monthLabel
                            }
                          </Text>
                        </View>

                        <View
                          style={
                            styles.chipRow
                          }>
                          {month.mostFrequentMood !==
                          undefined ? (
                            <View
                              style={
                                styles.chip
                              }>
                              <Text
                                style={
                                  styles.chipText
                                }>
                                Humeur ·{' '}
                                {
                                  MOOD_LABELS[
                                    month
                                      .mostFrequentMood
                                  ]
                                }
                              </Text>
                            </View>
                          ) : null}

                          {month.sleepCount >
                          0 ? (
                            <View
                              style={
                                styles.chip
                              }>
                              <Text
                                style={
                                  styles.chipText
                                }>
                                Sommeil ·{' '}
                                {month.averageSleepMinutes !==
                                undefined
                                  ? formatDurationMinutes(
                                      month.averageSleepMinutes,
                                    )
                                  : `${
                                      month.sleepCount
                                    } nuits`}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    ),
                  )}
              </View>
            </View>
          ) : null}

          {/* ==================================================
              DETAILS IF DATA EXISTS
          =================================================== */}

          {(sleepEntries.length >
            0 ||
            hasMedicalInfoInPeriod ||
            hasAppointmentsInPeriod) && (
            <View
              style={
                styles.card
              }>
              <SectionHeader
                icon="chart-box-outline"
                subtitle="Quelques repères sur la période sélectionnée"
                title="Détails du suivi"
              />

              {sleepEntries.length >
              0 ? (
                <DetailRow
                  icon="weather-night"
                  label="Sommeil"
                  last={
                    isSleepRowLast
                  }
                  value={
                    averageSleepMinutes !==
                    undefined
                      ? `Moyenne ${formatDurationMinutes(
                          averageSleepMinutes,
                        )}`
                      : `${sleepEntries.length} nuits suivies`
                  }
                />
              ) : null}

              {hasMedicalInfoInPeriod ? (
                <DetailRow
                  icon="clipboard-pulse-outline"
                  label="Informations médicales"
                  last={
                    isMedicalInfoRowLast
                  }
                  value={
                    medicalInfoDatesInPeriod.length ===
                    1
                      ? `Renseignées · ${dateLabel(
                          medicalInfoDatesInPeriod[0],
                        )}`
                      : `${medicalInfoDatesInPeriod.length} jours renseignés`
                  }
                />
              ) : null}

              {hasAppointmentsInPeriod ? (
                <DetailRow
                  icon="calendar-check-outline"
                  label="Suivi médical"
                  last
                  value={formatMedicalSummary(
                    appointmentCount,
                    examCount,
                  )}
                />
              ) : null}

              {showLongitudinalView &&
              monthlyBreakdown.some(
                month =>
                  month.appointmentCount +
                    month.examCount >
                  0,
              ) ? (
                <View
                  style={
                    styles.monthList
                  }>
                  <Text
                    style={
                      styles.monthListTitle
                    }>
                    Évolution par mois
                  </Text>

                  {monthlyBreakdown
                    .filter(
                      month =>
                        month.appointmentCount +
                          month.examCount >
                        0,
                    )
                    .map(month => (
                      <View
                        key={
                          month.monthKey
                        }
                        style={
                          styles.monthItem
                        }>
                        <View
                          style={
                            styles.monthTop
                          }>
                          <Text
                            style={
                              styles.monthLabel
                            }>
                            {
                              month.monthLabel
                            }
                          </Text>

                          <Text
                            style={
                              styles.monthMeta
                            }>
                            {formatMedicalSummary(
                              month.appointmentCount,
                              month.examCount,
                            )}
                          </Text>
                        </View>
                      </View>
                    ))}
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <HawaPremiumBottomSheet
        onClose={() =>
          setPremiumVisible(
            false,
          )
        }
        visible={
          premiumVisible
        }
      />
    </LinearGradient>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: IconName;
  label: string;
  value: string;
  last?: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View
      style={[
        styles.detailRow,

        last &&
          styles.lastRow,
      ]}>
      <View
        style={
          styles.detailIcon
        }>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={icon}
          size={18}
        />
      </View>

      <View
        style={
          styles.detailCopy
        }>
        <Text
          style={
            styles.detailLabel
          }>
          {label}
        </Text>

        <Text
          numberOfLines={2}
          style={
            styles.detailValue
          }>
          {value}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  /* ==========================================================
     GLOBAL
  ========================================================== */

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
  },

  content: {
    paddingHorizontal: 16,
    paddingTop:
      spacing.sm,
  },

  contentCompact: {
    paddingHorizontal: 11,
  },

  /* ==========================================================
     HEADER
  ========================================================== */

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 14,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    color:
      theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '800',
  },

  subtitle: {
    maxWidth: 290,

    marginTop: 3,

    color:
      theme.colors.textSecondary,

    fontSize: 11.5,
    lineHeight: 17,
  },

  headerIcon: {
    ...theme.shadow,

    width: 48,
    height: 48,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 10,

    borderWidth: 1,
    borderColor:
      withAlpha(theme.colors.primary, 0.08),
    borderRadius: 16,

    backgroundColor:
      theme.colors.primarySoft,
  },

  /* ==========================================================
     HERO
  ========================================================== */

  heroCard: {
    ...theme.shadow,

    position: 'relative',

    overflow: 'hidden',

    padding: 17,

    borderWidth: 1,
    borderColor:
      withAlpha(theme.colors.primary, 0.09),
    borderRadius: 27,

    backgroundColor:
      withAlpha(theme.colors.surface, 0.96),
  },

  heroDecorOne: {
    position: 'absolute',

    top: -45,
    right: -35,

    width: 130,
    height: 130,

    borderRadius: 65,

    backgroundColor:
      withAlpha(theme.colors.primary, 0.055),
  },

  heroDecorTwo: {
    position: 'absolute',

    top: 18,
    right: 25,

    width: 50,
    height: 50,

    borderRadius: 25,

    backgroundColor:
      withAlpha(theme.colors.primary, 0.17),
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  heroMain: {
    flex: 1,
    minWidth: 0,
  },

  heroEyebrow: {
    color: theme.colors.primary,

    fontSize: 9,
    fontWeight: '800',

    letterSpacing: 1.4,
  },

  heroWeekRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 3,
  },

  heroWeekNumber: {
    color: theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 48,
    lineHeight: 53,
    fontWeight: '800',
  },

  heroWeekCopy: {
    marginLeft: 9,
  },

  heroWeekLabel: {
    color:
      theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },

  heroGestationalAge: {
    marginTop: 2,

    color:
      theme.colors.textSecondary,

    fontSize: 10.5,
    fontWeight: '600',
  },

  heroPercentCircle: {
    width: 64,
    height: 64,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 10,

    borderWidth: 1,
    borderColor:
      withAlpha(theme.colors.primary, 0.12),
    borderRadius: 32,

    backgroundColor:
      theme.colors.primarySoft,
  },

  heroPercentValue: {
    color: theme.colors.primary,

    fontSize: 17,
    fontWeight: '800',
  },

  heroPercentLabel: {
    marginTop: 1,

    color:
      theme.colors.textSecondary,

    fontSize: 7.5,
  },

  heroProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    marginTop: 16,
  },

  heroProgressLabel: {
    color:
      theme.colors.accent,

    fontSize: 10.5,
    fontWeight: '800',
  },

  heroProgressRight: {
    color:
      theme.colors.textSecondary,

    fontSize: 9,
  },

  heroProgressTrack: {
    height: 7,

    overflow: 'hidden',

    marginTop: 7,

    borderRadius: 4,

    backgroundColor:
      theme.colors.primarySoft,
  },

  heroProgressFill: {
    height: '100%',

    borderRadius: 4,

    backgroundColor:
      theme.colors.primary,
  },

  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 15,
    paddingTop: 14,

    borderTopWidth:
      StyleSheet.hairlineWidth,

    borderTopColor:
      withAlpha(theme.colors.primary, 0.10),
  },

  heroMetaItem: {
    flex: 1,
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'center',
  },

  heroMetaIcon: {
    width: 34,
    height: 34,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 11,

    backgroundColor:
      theme.colors.primarySoft,
  },

  heroMetaCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 8,
  },

  heroMetaLabel: {
    color:
      theme.colors.textSecondary,

    fontSize: 8.5,
  },

  heroMetaValue: {
    marginTop: 2,

    color:
      theme.colors.accent,

    fontSize: 11,
    fontWeight: '800',
  },

  heroDivider: {
    width: 1,
    height: 37,

    marginHorizontal: 10,

    backgroundColor:
      withAlpha(theme.colors.primary, 0.14),
  },

  /* ==========================================================
     FILTERS
  ========================================================== */

  filtersWrapper: {
    marginTop: 14,
  },

  /* ==========================================================
     SECTION TITLES
  ========================================================== */

  sectionHeadingRow: {
    marginTop: 20,
    marginBottom: 10,
  },

  sectionTitle: {
    color:
      theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '800',
  },

  sectionDescription: {
    marginTop: 2,

    color:
      theme.colors.textSecondary,

    fontSize: 10.5,
  },

  /* ==========================================================
     KPI
  ========================================================== */

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 9,
  },

  kpiCard: {
    ...theme.shadow,

    width: '48.5%',
    minWidth: 0,

    minHeight: 92,

    padding: 12,

    borderWidth: 1,
    borderColor:
      withAlpha(theme.colors.primary, 0.08),
    borderRadius: 19,

    backgroundColor:
      theme.colors.surface,
  },

  kpiCardWide: {
    width: '100%',

    minHeight: 74,

    flexDirection: 'row',
    alignItems: 'center',
  },

  kpiIcon: {
    width: 36,
    height: 36,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor:
      theme.colors.primarySoft,
  },

  kpiCopy: {
    flex: 1,
    minWidth: 0,

    marginTop: 9,
  },

  kpiValue: {
    color:
      theme.colors.accent,

    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
  },

  kpiLabel: {
    marginTop: 3,

    color:
      theme.colors.textSecondary,

    fontSize: 9.5,
  },

  /* ==========================================================
     GENERIC CARD
  ========================================================== */

  card: {
    ...theme.shadow,

    marginTop: 14,

    padding: 15,

    borderWidth: 1,
    borderColor:
      withAlpha(theme.colors.primary, 0.08),
    borderRadius: 23,

    backgroundColor:
      theme.colors.surface,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionIcon: {
    width: 39,
    height: 39,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,

    borderRadius: 13,

    backgroundColor:
      theme.colors.primarySoft,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {
    color:
      theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '800',
  },

  cardSubtitle: {
    marginTop: 2,

    color:
      theme.colors.textSecondary,

    fontSize: 9.5,
    lineHeight: 13,
  },

  /* ==========================================================
     EMPTY
  ========================================================== */

  empty: {
    alignItems: 'center',

    paddingVertical: 23,
    paddingHorizontal: 12,
  },

  emptyIcon: {
    width: 45,
    height: 45,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 15,

    backgroundColor:
      theme.colors.primarySoft,
  },

  emptyText: {
    maxWidth: 280,

    marginTop: 9,

    color:
      theme.colors.textSecondary,

    fontSize: 11,
    lineHeight: 16,

    textAlign: 'center',
  },

  /* ==========================================================
     WEIGHT SUMMARY
  ========================================================== */

  weightSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    marginTop: 15,

    padding: 13,

    borderRadius: 18,

    backgroundColor:
      theme.colors.primarySoft,
  },

  weightSummaryCopy: {
    flex: 1,
    minWidth: 0,
  },

  metricLabel: {
    color:
      theme.colors.textSecondary,

    fontSize: 9.5,
  },

  metricValue: {
    marginTop: 2,

    color: theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 23,
    fontWeight: '800',
  },

  metricDate: {
    marginTop: 2,

    color:
      theme.colors.textSecondary,

    fontSize: 9,
  },

  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    flexShrink: 0,

    marginLeft: 10,

    paddingHorizontal: 9,
    paddingVertical: 7,

    borderRadius: 14,

    backgroundColor:
      theme.colors.primarySoft,
  },

  deltaBadgeNegative: {
    backgroundColor:
      withAlpha(theme.colors.danger, 0.12),
  },

  deltaValue: {
    color: theme.colors.primary,

    fontSize: 10.5,
    fontWeight: '800',
  },

  deltaValueNegative: {
    color: theme.colors.danger,
  },

  deltaLabel: {
    marginTop: 1,

    color:
      theme.colors.textSecondary,

    fontSize: 6.8,
  },

  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 7,

    marginTop: 12,

    padding: 10,

    borderRadius: 13,

    backgroundColor:
      theme.colors.primarySoft,
  },

  hint: {
    flex: 1,

    color:
      theme.colors.textSecondary,

    fontSize: 10,
    lineHeight: 14,
  },

  /* ==========================================================
     WEIGHT CHART
  ========================================================== */

  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    marginTop: 17,
  },

  chartTitle: {
    color:
      theme.colors.accent,

    fontSize: 11.5,
    fontWeight: '800',
  },

  chartHint: {
    color:
      theme.colors.textSecondary,

    fontSize: 8.5,
  },

  weightChart: {
    height: 150,

    flexDirection: 'row',
    alignItems: 'flex-end',

    gap: 5,

    marginTop: 11,

    paddingTop: 4,
  },

  barColumn: {
    flex: 1,
    minWidth: 0,

    height: '100%',

    alignItems: 'center',
  },

  barValue: {
    color:
      theme.colors.accent,

    fontSize: 8,
    fontWeight: '700',
  },

  barTrack: {
    flex: 1,

    width: '58%',
    minWidth: 9,

    justifyContent:
      'flex-end',

    overflow: 'hidden',

    marginVertical: 5,

    borderRadius: 7,

    backgroundColor:
      theme.colors.primarySoft,
  },

  barFill: {
    width: '100%',

    borderRadius: 7,

    backgroundColor:
      theme.colors.primary,
  },

  barDate: {
    color:
      theme.colors.textSecondary,

    fontSize: 7,
  },

  /* ==========================================================
     HISTORY
  ========================================================== */

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    marginTop: 16,
  },

  historyTitle: {
    color:
      theme.colors.accent,

    fontSize: 11.5,
    fontWeight: '800',
  },

  historyCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 9,

    backgroundColor:
      theme.colors.primarySoft,
  },

  historyCountText: {
    color:
      theme.colors.textSecondary,

    fontSize: 8,
    fontWeight: '700',
  },

  weightHistoryList: {
    marginTop: 6,
  },

  weightHistoryRow: {
    minHeight: 44,

    flexDirection: 'row',
    alignItems: 'center',

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    borderBottomColor:
      withAlpha(theme.colors.primary, 0.10),
  },

  historyDateIcon: {
    width: 27,
    height: 27,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 7,

    borderRadius: 9,

    backgroundColor:
      theme.colors.primarySoft,
  },

  weightHistoryDate: {
    flex: 1,
    minWidth: 0,

    color:
      theme.colors.textSecondary,

    fontSize: 10.5,
  },

  weightHistoryValue: {
    color:
      theme.colors.accent,

    fontSize: 11.5,
    fontWeight: '800',
  },

  weightHistoryDelta: {
    minWidth: 44,

    marginLeft: 8,

    color: theme.colors.primary,

    fontSize: 9.5,
    fontWeight: '800',

    textAlign: 'right',
  },

  weightHistoryDeltaNegative: {
    color: theme.colors.danger,
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  /* ==========================================================
     SYMPTOMS
  ========================================================== */

  symptomList: {
    marginTop: 11,
  },

  symptomItem: {
    paddingVertical: 10,

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    borderBottomColor:
      withAlpha(theme.colors.primary, 0.10),
  },

  symptomItemLast: {
    borderBottomWidth: 0,
  },

  symptomTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rank: {
    width: 27,
    height: 27,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 9,

    backgroundColor:
      theme.colors.primarySoft,
  },

  rankText: {
    color: theme.colors.primary,

    fontSize: 10.5,
    fontWeight: '800',
  },

  symptomName: {
    flex: 1,
    minWidth: 0,

    marginHorizontal: 9,

    color:
      theme.colors.accent,

    fontSize: 12,
    fontWeight: '700',
  },

  symptomCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 9,

    backgroundColor:
      theme.colors.primarySoft,
  },

  symptomCount: {
    color:
      theme.colors.textSecondary,

    fontSize: 8.5,
    fontWeight: '700',
  },

  symptomProgressTrack: {
    height: 5,

    overflow: 'hidden',

    marginTop: 7,
    marginLeft: 36,

    borderRadius: 3,

    backgroundColor:
      theme.colors.primarySoft,
  },

  symptomProgressFill: {
    height: '100%',

    borderRadius: 3,

    backgroundColor:
      theme.colors.primary,
  },

  /* ==========================================================
     WELLNESS
  ========================================================== */

  wellnessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 9,
  },

  wellnessCard: {
    ...theme.shadow,

    width: '48.5%',
    minWidth: 0,

    minHeight: 132,

    padding: 13,

    borderWidth: 1,
    borderColor:
      withAlpha(theme.colors.primary, 0.07),
    borderRadius: 20,

    backgroundColor:
      theme.colors.surface,
  },

  wellnessCardWide: {
    width: '100%',
  },

  wellnessTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  wellnessIcon: {
    width: 38,
    height: 38,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor:
      theme.colors.primarySoft,
  },

  wellnessValue: {
    marginTop: 11,

    color:
      theme.colors.accent,

    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
  },

  wellnessLabel: {
    marginTop: 2,

    color:
      theme.colors.accent,

    fontSize: 10.5,
    fontWeight: '700',
  },

  wellnessSupporting: {
    marginTop: 4,

    color:
      theme.colors.textSecondary,

    fontSize: 8.5,
  },

  /* ==========================================================
     DETAILS
  ========================================================== */

  detailRow: {
    minHeight: 56,

    flexDirection: 'row',
    alignItems: 'center',

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    borderBottomColor:
      withAlpha(theme.colors.primary, 0.10),
  },

  detailIcon: {
    width: 34,
    height: 34,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,

    borderRadius: 11,

    backgroundColor:
      theme.colors.primarySoft,
  },

  detailCopy: {
    flex: 1,
    minWidth: 0,
  },

  detailLabel: {
    color:
      theme.colors.accent,

    fontSize: 10.5,
    fontWeight: '800',
  },

  detailValue: {
    marginTop: 2,

    color:
      theme.colors.textSecondary,

    fontSize: 9.5,
    lineHeight: 13,
  },

  /* ==========================================================
     MONTHLY BREAKDOWN (PREMIUM longitudinal views) — same visual
     language as StatisticsScreen.tsx's own "Évolution par mois"
     lists, reused here for consistency across every objective's
     Statistics screen.
  ========================================================== */

  monthList: {
    marginTop: 14,
  },

  monthListTitle: {
    marginBottom: 6,

    color:
      theme.colors.accent,

    fontSize: 11.5,
    fontWeight: '800',
  },

  monthItem: {
    paddingVertical: 10,

    borderBottomWidth:
      StyleSheet.hairlineWidth,

    borderBottomColor:
      withAlpha(theme.colors.primary, 0.10),
  },

  monthTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  monthLabel: {
    color:
      theme.colors.accent,

    fontSize: 11.5,
    fontWeight: '800',
  },

  monthMeta: {
    color:
      theme.colors.textSecondary,

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

    backgroundColor:
      theme.colors.primarySoft,
  },

  chipText: {
    color:
      theme.colors.textSecondary,

    fontSize: 9.5,
    fontWeight: '700',
  },
  });
}

export default PregnancyStatisticsScreen;