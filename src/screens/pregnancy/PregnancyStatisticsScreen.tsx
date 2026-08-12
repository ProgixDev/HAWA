import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ImageBackground,
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

import {
  homeColors,
  homeShadow,
} from '../../components/home/homeTheme';
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
import type {
  DailyJournalEntry,
  MoodLevel,
} from '../../types/journal';
import {computePregnancyStatus} from '../../utils/pregnancyTrackingUtils';
import {spacing} from '../../theme/spacing';

/* ============================================================
   ASSETS / CONSTANTS
============================================================ */

const BACKGROUND = require('../../assets/images/auth-mosque-background.png');

const PURPLE = homeColors.primary;
const PURPLE_DARK = '#28166F';
const PURPLE_SOFT = '#F1EBFA';
const PURPLE_SURFACE = '#F8F4FC';
const TEXT_SECONDARY = homeColors.textSecondary;

const PREGNANCY_TOTAL_WEEKS = 40;

type Range = '7' | '30' | 'all';

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

const EMPTY: PregnancyJournalState = {
  symptoms: [],
  weights: [],
};

const RANGE_OPTIONS: Array<{
  key: Range;
  label: string;
}> = [
  {
    key: '7',
    label: '7 jours',
  },
  {
    key: '30',
    label: '30 jours',
  },
  {
    key: 'all',
    label: 'Tout',
  },
];

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

const withinRange = (
  date: string,
  range: Range,
): boolean => {
  if (range === 'all') {
    return true;
  }

  const cutoff = new Date();

  cutoff.setHours(
    0,
    0,
    0,
    0,
  );

  cutoff.setDate(
    cutoff.getDate() -
      Number(range) +
      1,
  );

  return (
    new Date(
      `${date}T12:00:00`,
    ) >= cutoff
  );
};

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

function formatMilliliters(
  ml: number,
): string {
  if (ml >= 1000) {
    return `${(
      ml / 1000
    ).toLocaleString(
      'fr-FR',
      {
        maximumFractionDigits: 1,
      },
    )} L`;
  }

  return `${Math.round(
    ml,
  )} mL`;
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
  return (
    <View style={styles.empty}>
      <View
        style={
          styles.emptyIcon
        }>
        <MaterialDesignIcons
          color="#9E89C8"
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
          color={PURPLE}
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
          color={PURPLE}
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
            color={PURPLE}
            name={icon}
            size={21}
          />
        </View>

        <MaterialDesignIcons
          color="#C1B3D8"
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
    range,
    setRange,
  ] =
    useState<Range>(
      '30',
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
      ]).then(
        ([
          journal,
          entries,
        ]) => {
          if (mounted) {
            setState(
              journal,
            );

            setJournalEntries(
              entries,
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
            withinRange(
              item.date,
              range,
            ),
        ),

      [
        range,
        state.weights,
      ],
    );

  const symptoms =
    useMemo(
      () =>
        state.symptoms.filter(
          item =>
            withinRange(
              item.date,
              range,
            ),
        ),

      [
        range,
        state.symptoms,
      ],
    );

  const trackedDays =
    useMemo(() => {
      const dates =
        new Set([
          ...weights.map(
            item =>
              item.date,
          ),

          ...symptoms.map(
            item =>
              item.date,
          ),
        ]);

      return dates.size;
    }, [
      symptoms,
      weights,
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
     DAILY JOURNAL RANGE
  ========================================================== */

  const rangeEntries =
    useMemo(
      () =>
        journalEntries.filter(
          entry =>
            withinRange(
              entry.date,
              range,
            ),
        ),

      [
        journalEntries,
        range,
      ],
    );

  /* ==========================================================
     MOOD
  ========================================================== */

  const moodEntries =
    useMemo(
      () =>
        rangeEntries.filter(
          entry =>
            entry.mood,
        ),

      [rangeEntries],
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
        rangeEntries.filter(
          entry =>
            entry.sleep
              ?.duration,
        ),

      [rangeEntries],
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
     HYDRATION
  ========================================================== */

  const hydrationEntries =
    useMemo(
      () =>
        rangeEntries.filter(
          entry =>
            typeof entry
              .hydration
              ?.milliliters ===
            'number',
        ),

      [rangeEntries],
    );

  const averageHydrationMl =
    hydrationEntries.length >
    0
      ? hydrationEntries.reduce(
          (
            sum,
            entry,
          ) =>
            sum +
            (entry
              .hydration
              ?.milliliters ??
              0),
          0,
        ) /
        hydrationEntries.length
      : undefined;

  /* ==========================================================
     ACTIVITY
  ========================================================== */

  const activityEntries =
    useMemo(
      () =>
        rangeEntries.filter(
          entry =>
            entry.activity &&
            !entry.activity
              .none,
        ),

      [rangeEntries],
    );

  const activityDurations =
    useMemo(
      () =>
        activityEntries
          .map(
            entry =>
              entry.activity
                ?.durationMinutes,
          )
          .filter(
            (
              value,
            ): value is number =>
              typeof value ===
              'number',
          ),

      [activityEntries],
    );

  const totalActivityMinutes =
    activityDurations.reduce(
      (
        sum,
        value,
      ) =>
        sum + value,
      0,
    );

  const activityTypeCounts =
    useMemo(() => {
      const counts =
        new Map<
          string,
          number
        >();

      activityEntries.forEach(
        entry => {
          if (
            entry.activity
              ?.type
          ) {
            counts.set(
              entry.activity
                .type,

              (counts.get(
                entry
                  .activity
                  .type,
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
    }, [activityEntries]);

  const mostFrequentActivityType =
    activityTypeCounts[0]?.[0];

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <ImageBackground
      resizeMode="cover"
      source={BACKGROUND}
      style={
        styles.background
      }>
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
          barStyle="dark-content"
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,

            compact &&
              styles.contentCompact,

            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ) + 30,
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
                  PURPLE
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
                        PURPLE
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
                        PURPLE
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
              FILTERS
          =================================================== */}

          <View
            style={
              styles.filtersWrapper
            }>
            <View
              style={
                styles.filters
              }>
              {RANGE_OPTIONS.map(
                item => {
                  const active =
                    range ===
                    item.key;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={
                        item.key
                      }
                      onPress={() =>
                        setRange(
                          item.key,
                        )
                      }
                      style={[
                        styles.filter,

                        active &&
                          styles.filterActive,
                      ]}>
                      <Text
                        style={[
                          styles.filterText,

                          active &&
                            styles.filterTextActive,
                        ]}>
                        {
                          item.label
                        }
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>
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
                          ? '#A8505A'
                          : PURPLE
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
                        PURPLE
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
                                  PURPLE
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
              subtitle="Les symptômes que tu as le plus enregistrés"
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
                Tes tendances quotidiennes
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

            <WellnessCard
              icon="cup-water"
              label="Hydratation"
              supporting={
                hydrationEntries.length >
                0
                  ? `${hydrationEntries.length} ${
                      hydrationEntries.length >
                      1
                        ? 'jours suivis'
                        : 'jour suivi'
                    }`
                  : 'Aucune donnée'
              }
              value={
                averageHydrationMl !==
                undefined
                  ? `${formatMilliliters(
                      averageHydrationMl,
                    )}/j`
                  : '—'
              }
            />

            <WellnessCard
              icon="run"
              label="Activité"
              supporting={
                mostFrequentActivityType ??
                (activityEntries.length >
                0
                  ? `${activityEntries.length} jours`
                  : 'Aucune donnée')
              }
              value={
                totalActivityMinutes >
                0
                  ? formatDurationMinutes(
                      totalActivityMinutes,
                    )
                  : '—'
              }
            />
          </View>

          {/* ==================================================
              DETAILS IF DATA EXISTS
          =================================================== */}

          {(sleepEntries.length >
            0 ||
            hydrationEntries.length >
              0 ||
            activityEntries.length >
              0) && (
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

              {hydrationEntries.length >
              0 ? (
                <DetailRow
                  icon="cup-water"
                  label="Hydratation"
                  value={
                    averageHydrationMl !==
                    undefined
                      ? `Moyenne ${formatMilliliters(
                          averageHydrationMl,
                        )}/jour`
                      : `${hydrationEntries.length} jours suivis`
                  }
                />
              ) : null}

              {activityEntries.length >
              0 ? (
                <DetailRow
                  icon="run"
                  label="Activité physique"
                  last
                  value={
                    totalActivityMinutes >
                    0
                      ? `${formatDurationMinutes(
                          totalActivityMinutes,
                        )} au total${
                          mostFrequentActivityType
                            ? ` · ${mostFrequentActivityType}`
                            : ''
                        }`
                      : mostFrequentActivityType ??
                        `${activityEntries.length} jours suivis`
                  }
                />
              ) : null}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
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
          color={PURPLE}
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

const styles = StyleSheet.create({
  /* ==========================================================
     GLOBAL
  ========================================================== */

  background: {
    flex: 1,
    backgroundColor:
      '#F8F3FC',
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
      homeColors.textPrimary,

    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '800',
  },

  subtitle: {
    maxWidth: 290,

    marginTop: 3,

    color:
      TEXT_SECONDARY,

    fontSize: 11.5,
    lineHeight: 17,
  },

  headerIcon: {
    ...homeShadow,

    width: 48,
    height: 48,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 10,

    borderWidth: 1,
    borderColor:
      'rgba(105,73,190,0.08)',
    borderRadius: 16,

    backgroundColor:
      '#F1EAFB',
  },

  /* ==========================================================
     HERO
  ========================================================== */

  heroCard: {
    ...homeShadow,

    position: 'relative',

    overflow: 'hidden',

    padding: 17,

    borderWidth: 1,
    borderColor:
      'rgba(105,73,190,0.09)',
    borderRadius: 27,

    backgroundColor:
      'rgba(255,255,255,0.96)',
  },

  heroDecorOne: {
    position: 'absolute',

    top: -45,
    right: -35,

    width: 130,
    height: 130,

    borderRadius: 65,

    backgroundColor:
      'rgba(105,73,190,0.055)',
  },

  heroDecorTwo: {
    position: 'absolute',

    top: 18,
    right: 25,

    width: 50,
    height: 50,

    borderRadius: 25,

    backgroundColor:
      'rgba(218,193,240,0.17)',
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
    color: '#9078C3',

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
    color: PURPLE_DARK,

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
      homeColors.textPrimary,

    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },

  heroGestationalAge: {
    marginTop: 2,

    color:
      TEXT_SECONDARY,

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
      'rgba(105,73,190,0.12)',
    borderRadius: 32,

    backgroundColor:
      '#F2EBFB',
  },

  heroPercentValue: {
    color: PURPLE,

    fontSize: 17,
    fontWeight: '800',
  },

  heroPercentLabel: {
    marginTop: 1,

    color:
      TEXT_SECONDARY,

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
      homeColors.textPrimary,

    fontSize: 10.5,
    fontWeight: '800',
  },

  heroProgressRight: {
    color:
      TEXT_SECONDARY,

    fontSize: 9,
  },

  heroProgressTrack: {
    height: 7,

    overflow: 'hidden',

    marginTop: 7,

    borderRadius: 4,

    backgroundColor:
      '#ECE5F6',
  },

  heroProgressFill: {
    height: '100%',

    borderRadius: 4,

    backgroundColor:
      PURPLE,
  },

  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 15,
    paddingTop: 14,

    borderTopWidth:
      StyleSheet.hairlineWidth,

    borderTopColor:
      '#EAE3F1',
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
      '#F0E9FA',
  },

  heroMetaCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 8,
  },

  heroMetaLabel: {
    color:
      TEXT_SECONDARY,

    fontSize: 8.5,
  },

  heroMetaValue: {
    marginTop: 2,

    color:
      homeColors.textPrimary,

    fontSize: 11,
    fontWeight: '800',
  },

  heroDivider: {
    width: 1,
    height: 37,

    marginHorizontal: 10,

    backgroundColor:
      '#E5DDEC',
  },

  /* ==========================================================
     FILTERS
  ========================================================== */

  filtersWrapper: {
    marginTop: 14,
  },

  filters: {
    flexDirection: 'row',

    padding: 4,

    borderWidth: 1,
    borderColor:
      'rgba(105,73,190,0.05)',
    borderRadius: 16,

    backgroundColor:
      '#EEE8F5',
  },

  filter: {
    flex: 1,

    alignItems: 'center',

    paddingVertical: 9,

    borderRadius: 12,
  },

  filterActive: {
    ...homeShadow,

    backgroundColor:
      '#FFFFFF',
  },

  filterText: {
    color:
      TEXT_SECONDARY,

    fontSize: 11,
    fontWeight: '700',
  },

  filterTextActive: {
    color: PURPLE,

    fontWeight: '800',
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
      homeColors.textPrimary,

    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '800',
  },

  sectionDescription: {
    marginTop: 2,

    color:
      TEXT_SECONDARY,

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
    ...homeShadow,

    width: '48.5%',
    minWidth: 0,

    minHeight: 92,

    padding: 12,

    borderWidth: 1,
    borderColor:
      'rgba(105,73,190,0.08)',
    borderRadius: 19,

    backgroundColor:
      '#FFFFFF',
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
      PURPLE_SOFT,
  },

  kpiCopy: {
    flex: 1,
    minWidth: 0,

    marginTop: 9,
  },

  kpiValue: {
    color:
      homeColors.textPrimary,

    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
  },

  kpiLabel: {
    marginTop: 3,

    color:
      TEXT_SECONDARY,

    fontSize: 9.5,
  },

  /* ==========================================================
     GENERIC CARD
  ========================================================== */

  card: {
    ...homeShadow,

    marginTop: 14,

    padding: 15,

    borderWidth: 1,
    borderColor:
      'rgba(105,73,190,0.08)',
    borderRadius: 23,

    backgroundColor:
      '#FFFFFF',
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
      PURPLE_SOFT,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {
    color:
      homeColors.textPrimary,

    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '800',
  },

  cardSubtitle: {
    marginTop: 2,

    color:
      TEXT_SECONDARY,

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
      '#F2ECFA',
  },

  emptyText: {
    maxWidth: 280,

    marginTop: 9,

    color:
      TEXT_SECONDARY,

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
      PURPLE_SURFACE,
  },

  weightSummaryCopy: {
    flex: 1,
    minWidth: 0,
  },

  metricLabel: {
    color:
      TEXT_SECONDARY,

    fontSize: 9.5,
  },

  metricValue: {
    marginTop: 2,

    color: PURPLE_DARK,

    fontFamily: 'serif',
    fontSize: 23,
    fontWeight: '800',
  },

  metricDate: {
    marginTop: 2,

    color:
      TEXT_SECONDARY,

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
      '#ECE4FA',
  },

  deltaBadgeNegative: {
    backgroundColor:
      '#FBECEF',
  },

  deltaValue: {
    color: PURPLE,

    fontSize: 10.5,
    fontWeight: '800',
  },

  deltaValueNegative: {
    color: '#A8505A',
  },

  deltaLabel: {
    marginTop: 1,

    color:
      TEXT_SECONDARY,

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
      '#F6F2FA',
  },

  hint: {
    flex: 1,

    color:
      TEXT_SECONDARY,

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
      homeColors.textPrimary,

    fontSize: 11.5,
    fontWeight: '800',
  },

  chartHint: {
    color:
      TEXT_SECONDARY,

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
      homeColors.textPrimary,

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
      '#F0EAF7',
  },

  barFill: {
    width: '100%',

    borderRadius: 7,

    backgroundColor:
      '#8D6ED5',
  },

  barDate: {
    color:
      TEXT_SECONDARY,

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
      homeColors.textPrimary,

    fontSize: 11.5,
    fontWeight: '800',
  },

  historyCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 9,

    backgroundColor:
      '#F2ECF8',
  },

  historyCountText: {
    color:
      TEXT_SECONDARY,

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
      '#ECE6F1',
  },

  historyDateIcon: {
    width: 27,
    height: 27,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 7,

    borderRadius: 9,

    backgroundColor:
      '#F4EFFA',
  },

  weightHistoryDate: {
    flex: 1,
    minWidth: 0,

    color:
      TEXT_SECONDARY,

    fontSize: 10.5,
  },

  weightHistoryValue: {
    color:
      homeColors.textPrimary,

    fontSize: 11.5,
    fontWeight: '800',
  },

  weightHistoryDelta: {
    minWidth: 44,

    marginLeft: 8,

    color: PURPLE,

    fontSize: 9.5,
    fontWeight: '800',

    textAlign: 'right',
  },

  weightHistoryDeltaNegative: {
    color: '#A8505A',
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
      '#ECE6F1',
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
      PURPLE_SOFT,
  },

  rankText: {
    color: PURPLE,

    fontSize: 10.5,
    fontWeight: '800',
  },

  symptomName: {
    flex: 1,
    minWidth: 0,

    marginHorizontal: 9,

    color:
      homeColors.textPrimary,

    fontSize: 12,
    fontWeight: '700',
  },

  symptomCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 9,

    backgroundColor:
      '#F5F1F9',
  },

  symptomCount: {
    color:
      TEXT_SECONDARY,

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
      '#EFE9F5',
  },

  symptomProgressFill: {
    height: '100%',

    borderRadius: 3,

    backgroundColor:
      '#9A7ADD',
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
    ...homeShadow,

    width: '48.5%',
    minWidth: 0,

    minHeight: 132,

    padding: 13,

    borderWidth: 1,
    borderColor:
      'rgba(105,73,190,0.07)',
    borderRadius: 20,

    backgroundColor:
      '#FFFFFF',
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
      PURPLE_SOFT,
  },

  wellnessValue: {
    marginTop: 11,

    color:
      homeColors.textPrimary,

    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
  },

  wellnessLabel: {
    marginTop: 2,

    color:
      homeColors.textPrimary,

    fontSize: 10.5,
    fontWeight: '700',
  },

  wellnessSupporting: {
    marginTop: 4,

    color:
      TEXT_SECONDARY,

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
      '#ECE6F1',
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
      '#F2ECFA',
  },

  detailCopy: {
    flex: 1,
    minWidth: 0,
  },

  detailLabel: {
    color:
      homeColors.textPrimary,

    fontSize: 10.5,
    fontWeight: '800',
  },

  detailValue: {
    marginTop: 2,

    color:
      TEXT_SECONDARY,

    fontSize: 9.5,
    lineHeight: 13,
  },
});

export default PregnancyStatisticsScreen;