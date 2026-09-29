import {getContraceptionReminderIndicator} from '../../utils/contraceptionReminderScheduling';
import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {getFloatingTabBarClearance} from '../../theme/spacing';

import {usePremium} from '../../hooks/usePremium';
import {useToday} from '../../hooks/useToday';
import {HawaPremiumBottomSheet} from '../../components/premium/HawaPremiumBottomSheet';

import {
  getContraceptionPreferences,
  hydrateContraceptionPreferences,
  subscribeContraceptionPreferences,
} from '../../state/contraceptionPreferences';

import {
  getAllContraceptionIntakeRecords,
  hydrateContraceptionIntakeHistory,
  subscribeContraceptionIntakeHistory,
  type ContraceptionIntakeRecord,
} from '../../state/contraceptionIntakeHistoryStore';

import {
  getAllContraceptionEvents,
  hydrateContraceptionEvents,
  subscribeContraceptionEvents,
  type ContraceptionEvent,
} from '../../state/contraceptionEventStore';

import {
  contraceptionEventLabels,
  CONTRACEPTION_METHOD_EVENT_TYPES,
  CONTRACEPTION_METHOD_ICONS,
  contraceptionMethodLabels,
  isContraceptionEventForMethod,
  isContraceptionIntakeRecordForMethod,
} from '../../config/contraceptionLabels';
import '../../i18n';

import {
  computeContraceptionBestStreak,
  getCyclicPillSchedule,
  computeContraceptionEventCounts,
  computeContraceptionMonthlyBreakdown,
  computeContraceptionRangeSummary,
  computeContraceptionWeeklyBreakdown,
  type ContraceptionPeriodBucket,
} from '../../utils/contraceptionMath';

import {
  diffDays,
  formatFullDate,
} from '../../utils/cycleMath';

// PHASE E5 — PURPLE/PURPLE_DARK/PURPLE_SOFT/MUTED/BORDER used to be fixed
// homeColors-derived literals here; they are now derived from useAwaTheme()
// at the top of ContraceptionStatisticsScreen() (and re-derived identically
// inside createStyles(theme), and inside DistributionBar/TrendColumn/
// LegendDot below) so every decorative-purple usage in this file follows
// the resolved global theme — same pattern already used by
// ContraceptionDashboard.tsx / ContraceptionCalendarContent.tsx.
// SUCCESS/SUCCESS_SOFT/DANGER/WARNING (health-status semantics) stay fixed
// module literals — exactly the pre-existing values this file already used
// (via homeColors.green/greenLight before this migration) — never
// theme-driven, so the meaning of "taken"/"late"/"missed" never changes
// with the palette.
const SUCCESS = '#3E8E56';
const SUCCESS_SOFT = '#E4F3E7';

const DANGER = '#D96176';

// Same hex as ContraceptionJournalEntryScreen.tsx's/ContraceptionDashboard.tsx's/
// ContraceptionCalendarContent.tsx's local warning color — the 'late'
// status's color everywhere it's shown.
const WARNING = '#C77B2E';

type PeriodMonths =
  | 1
  | 3
  | 6
  | 12;

// Ring/Patch's event section keeps its own original 1/3/6 selector
// untouched (no Premium gating, no 12-month option) — only the
// intake-method (Pill/Other) selector below gets the 12-month option and
// Premium gating, via buildIntakePeriodOptions(t) (built inside the
// component, below, since these labels need `t`).
function buildPeriodOptions(t: (key: string) => string): {value: PeriodMonths; label: string}[] {
  return [
    {value: 1, label: t('contraceptionStatistics.periods.oneMonth')},
    {value: 3, label: t('contraceptionStatistics.periods.threeMonths')},
    {value: 6, label: t('contraceptionStatistics.periods.sixMonths')},
  ];
}

function buildIntakePeriodOptions(t: (key: string) => string): {value: PeriodMonths; label: string}[] {
  return [
    ...buildPeriodOptions(t),
    {value: 12, label: t('contraceptionStatistics.periods.twelveMonths')},
  ];
}

// FREE tier = 1 month only; 3/6/12 months are Premium-gated, same
// FREE/PREMIUM split pattern as StatisticsScreen.tsx's isPeriodFree().
const isIntakePeriodFree = (
  value: PeriodMonths,
): boolean => value === 1;

const localDateKey = (
  date: Date,
): string =>
  `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(
    2,
    '0',
  )}-${String(
    date.getDate(),
  ).padStart(
    2,
    '0',
  )}`;

function ContraceptionStatisticsScreen(): React.JSX.Element {
  const insets =
    useSafeAreaInsets();

  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const intakePeriodOptions = useMemo(() => buildIntakePeriodOptions(t), [t]);

  // PHASE E5 — decorative-brand-purple identifiers, now theme-derived (see
  // the module-level comment above where these used to be homeColors-derived
  // literals). SUCCESS/WARNING/DANGER (health-status semantics) stay fixed
  // module consts, untouched. Only PURPLE/MUTED are referenced directly in
  // this component's JSX below — PURPLE_DARK/PURPLE_SOFT are only ever used
  // inside createStyles(theme) (re-derived there identically), so they are
  // not redeclared here too.
  const PURPLE = theme.colors.primary;
  const MUTED = theme.colors.textMuted;

  // Recomputed when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts.
  const {today, todayKey} = useToday();

  const {isPremium} =
    usePremium();

  const [
    premiumVisible,
    setPremiumVisible,
  ] =
    useState(false);

  const [
    periodMonths,
    setPeriodMonths,
  ] =
    useState<PeriodMonths>(
      1,
    );

  // Same FREE/PREMIUM gating pattern as StatisticsScreen.tsx's
  // handleSelectPeriod — applies ONLY to the intake-method (Pill/Other)
  // selector; the Ring/Patch event selector below calls setPeriodMonths
  // directly and stays ungated.
  const handleSelectIntakePeriod = useCallback(
    (target: PeriodMonths): void => {
      if (!isIntakePeriodFree(target) && !isPremium) {
        setPremiumVisible(true);
        return;
      }

      setPeriodMonths(target);
    },
    [isPremium],
  );

  const [
    contraception,
    setContraception,
  ] =
    useState(
      getContraceptionPreferences,
    );

  const [
    recordsByDate,
    setRecordsByDate,
  ] =
    useState<
      Record<
        string,
        ContraceptionIntakeRecord
      >
    >(
      getAllContraceptionIntakeRecords,
    );

  const [
    eventsByDate,
    setEventsByDate,
  ] =
    useState(
      getAllContraceptionEvents,
    );

  useFocusEffect(
    useCallback(() => {
      let active =
        true;

      hydrateContraceptionPreferences().then(
        value => {
          if (active) {
            setContraception(
              value,
            );
          }
        },
      );

      const unsubscribePreferences =
        subscribeContraceptionPreferences(
          () => {
            if (
              active
            ) {
              setContraception(
                getContraceptionPreferences(),
              );
            }
          },
        );

      hydrateContraceptionIntakeHistory().then(
        () => {
          if (
            active
          ) {
            setRecordsByDate(
              getAllContraceptionIntakeRecords(),
            );
          }
        },
      );

      const unsubscribeIntake =
        subscribeContraceptionIntakeHistory(
          () => {
            if (
              active
            ) {
              setRecordsByDate(
                getAllContraceptionIntakeRecords(),
              );
            }
          },
        );

      hydrateContraceptionEvents().then(
        () => {
          if (
            active
          ) {
            setEventsByDate(
              getAllContraceptionEvents(),
            );
          }
        },
      );

      const unsubscribeEvents =
        subscribeContraceptionEvents(
          () => {
            if (
              active
            ) {
              setEventsByDate(
                getAllContraceptionEvents(),
              );
            }
          },
        );

      return () => {
        active =
          false;

        unsubscribePreferences();
        unsubscribeIntake();
        unsubscribeEvents();
      };
    }, []),
  );

  const {
    method,
    methodStartDate,
    remindersEnabled,
  } =
    contraception;

  // Never "Activés" for ring / patch — see getContraceptionReminderIndicator.
  const reminderIndicator = getContraceptionReminderIndicator(method, remindersEnabled);

  // Break days of a CYCLIC pill schedule are not expected intakes: adherence,
  // "non enregistrée" and the streak all skip them (null for any other schedule
  // or method, which keep their previous behavior).
  const pillSchedule = useMemo(() => getCyclicPillSchedule(contraception), [contraception]);

  // pill and other are both tracked via the single daily
  // taken/late/missed status (contraceptionIntakeHistoryStore.ts) and get
  // the full statistics below; ring/patch are tracked via discrete events
  // (contraceptionEventStore.ts) and get their own real-event-count section
  // instead — there is no daily cadence to compute regularity/streaks from.
  const isIntakeMethod =
    method === 'pill' || method === 'other';

  const isEventMethod =
    method === 'ring' || method === 'patch';

  const methodEventTypes = method
    ? CONTRACEPTION_METHOD_EVENT_TYPES[method] ?? []
    : [];

  const methodLabel =
    method
      ? contraceptionMethodLabels(t)[
          method
        ]
      : t('profile.notProvidedFeminine');

  const methodIcon =
    method
      ? CONTRACEPTION_METHOD_ICONS[
          method
        ]
      : 'pill';

  // Method-isolation: pill and other share the exact same
  // contraceptionIntakeHistoryStore.ts shape/store (a single daily
  // taken/late/missed status each), so a record recorded while on Pill and
  // never deleted would otherwise silently count toward Other's statistics
  // after a method switch, and vice versa. Same canonical-helper pattern as
  // currentMethodEventsByDate below, via isContraceptionIntakeRecordForMethod.
  const currentMethodRecordsByDate = useMemo(() => {
    if (!isIntakeMethod) {return {};}
    const filtered: Record<string, ContraceptionIntakeRecord> = {};
    for (const [date, record] of Object.entries(recordsByDate)) {
      if (isContraceptionIntakeRecordForMethod(record.method, method)) {
        filtered[date] = record;
      }
    }
    return filtered;
  }, [isIntakeMethod, recordsByDate, method]);

  const hasAnyIntakeRecord =
    Object.keys(
      currentMethodRecordsByDate,
    ).length > 0;

  const rangeStartKey =
    useMemo(() => {
      const start =
        new Date(
          today.getFullYear(),
          today.getMonth() -
            (periodMonths -
              1),
          1,
        );

      return localDateKey(
        start,
      );
    }, [
      today,
      periodMonths,
    ]);

  const summary =
    useMemo(
      () =>
        computeContraceptionRangeSummary(
          currentMethodRecordsByDate,
          rangeStartKey,
          todayKey,
          methodStartDate,
          pillSchedule,
        ),
      [
        currentMethodRecordsByDate,
        rangeStartKey,
        todayKey,
        methodStartDate,
        pillSchedule,
      ],
    );

  const buckets: ContraceptionPeriodBucket[] =
    useMemo(() => {
      return periodMonths ===
        1
        ? computeContraceptionWeeklyBreakdown(
            currentMethodRecordsByDate,
            rangeStartKey,
            todayKey,
          )
        : computeContraceptionMonthlyBreakdown(
            currentMethodRecordsByDate,
            rangeStartKey,
            todayKey,
          );
    }, [
      currentMethodRecordsByDate,
      rangeStartKey,
      todayKey,
      periodMonths,
    ]);

  const bestStreak =
    useMemo(
      () =>
        computeContraceptionBestStreak(
          currentMethodRecordsByDate,
          rangeStartKey,
          todayKey,
          methodStartDate,
          pillSchedule,
        ),
      [
        currentMethodRecordsByDate,
        rangeStartKey,
        todayKey,
        methodStartDate,
        pillSchedule,
      ],
    );

  const trackingDurationDays =
    useMemo(() => {
      if (
        !methodStartDate
      ) {
        return null;
      }

      const start =
        new Date(
          `${methodStartDate}T12:00:00`,
        );

      if (
        Number.isNaN(
          start.getTime(),
        )
      ) {
        return null;
      }

      // calendar-day difference (DST-safe), not raw-millisecond flooring
      const elapsed = diffDays(today, start);

      return elapsed >=
        0
        ? elapsed + 1
        : null;
    }, [
      methodStartDate,
      today,
    ]);

  const hasDataInPeriod =
    summary.taken +
      summary.late +
      summary.missed >
    0;

  const maxBucketValue =
    Math.max(
      1,
      ...buckets.map(
        bucket =>
          Math.max(
            bucket.taken,
            bucket.late,
            bucket.missed,
          ),
      ),
    );

  const maxDistribution =
    Math.max(
      1,
      summary.taken,
      summary.late,
      summary.missed,
    );

  // Method-isolation: eventsByDate is shared across every event-based method
  // ever used (switching ring -> patch never deletes old ring/patch
  // events), and computeContraceptionEventCounts itself has no concept of
  // "method" — so the map it receives must already be scoped to the
  // CURRENT one, or a previous method's real events would silently inflate
  // this period's counts too. Uses the same canonical
  // isContraceptionEventForMethod() check as Dashboard/Calendar.
  const currentMethodEventsByDate =
    useMemo(() => {
      if (!isEventMethod) {return {};}
      const filtered: Record<string, ContraceptionEvent[]> = {};
      for (const [date, events] of Object.entries(eventsByDate)) {
        const matching = events.filter(event => isContraceptionEventForMethod(event.type, method));
        if (matching.length > 0) {filtered[date] = matching;}
      }
      return filtered;
    }, [isEventMethod, eventsByDate, method]);

  const eventCounts =
    useMemo(
      () =>
        isEventMethod
          ? computeContraceptionEventCounts(
              currentMethodEventsByDate,
              rangeStartKey,
              todayKey,
            )
          : {},
      [
        isEventMethod,
        currentMethodEventsByDate,
        rangeStartKey,
        todayKey,
      ],
    );

  const hasAnyEventInPeriod = methodEventTypes.some(
    type => (eventCounts[type] ?? 0) > 0,
  );

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[
        0,
        0.32,
        0.7,
        1,
      ]}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 1,
        y: 1,
      }}
      style={
        styles.background
      }>
      <View
        pointerEvents="none"
        style={
          styles.pageBackgroundDecor
        }>
        <View
          style={
            styles.pageGlowTop
          }
        />

        <View
          style={
            styles.pageGlowMiddle
          }
        />

        <View
          style={
            styles.pageGlowBottom
          }
        />
      </View>

      <SafeAreaView
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
            {
              paddingTop:
                Math.max(
                  insets.top,
                  14,
                ) + 10,

              paddingBottom: getFloatingTabBarClearance(insets.bottom, 24),
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }>
          {/* HEADER */}

          <View
            style={
              styles.header
            }>
            <Text
              style={
                styles.title
              }>
              {t('contraceptionStatistics.header.title')}
            </Text>

            <Text
              style={
                styles.subtitle
              }>
              {t('contraceptionStatistics.header.subtitle')}
            </Text>
          </View>

          {isIntakeMethod ? (
            <>
              {/* PERIOD SELECTOR */}

              <View
                style={
                  styles.periodRow
                }>
                {intakePeriodOptions.map(
                  option => {
                    const active =
                      option.value ===
                      periodMonths;

                    const locked =
                      !isIntakePeriodFree(
                        option.value,
                      ) &&
                      !isPremium;

                    return (
                      <Pressable
                        accessibilityLabel={
                          option.label
                        }
                        accessibilityRole="button"
                        accessibilityState={{
                          selected:
                            active,
                        }}
                        key={
                          option.value
                        }
                        onPress={() =>
                          handleSelectIntakePeriod(
                            option.value,
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.periodButton,

                          active &&
                            styles.periodButtonActive,

                          pressed &&
                            styles.pressed,
                        ]}>
                        <View
                          style={
                            styles.periodButtonContent
                          }>
                          <Text
                            style={[
                              styles.periodButtonText,

                              active &&
                                styles.periodButtonTextActive,
                            ]}>
                            {
                              option.label
                            }
                          </Text>

                          {locked ? (
                            <MaterialDesignIcons
                              color={
                                MUTED
                              }
                              name="lock-outline"
                              size={
                                10
                              }
                            />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  },
                )}
              </View>

              {!hasAnyIntakeRecord ? (
                <View
                  style={
                    styles.card
                  }>
                  <View
                    style={
                      styles.emptyIcon
                    }>
                    <MaterialDesignIcons
                      color={
                        PURPLE
                      }
                      name="chart-donut"
                      size={
                        26
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.emptyTitle
                    }>
                    {t('contraceptionStatistics.empty.title')}
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }>
                    {t('contraceptionStatistics.empty.text')}
                  </Text>
                </View>
              ) : (
                <>
                  {/* HERO */}

                  <View
                    style={
                      styles.card
                    }>
                    <Text
                      style={
                        styles.heroEyebrow
                      }>
                      {t('contraceptionStatistics.hero.eyebrow')}
                    </Text>

                    {summary.regularityPercent !==
                    null ? (
                      <>
                        <Text
                          style={
                            styles.heroPercent
                          }>
                          {
                            summary.regularityPercent
                          }
                          %
                        </Text>

                        <Text
                          style={
                            styles.heroPercentLabel
                          }>
                          {t('contraceptionStatistics.hero.regularityLabel')}
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={
                          styles.heroNeutral
                        }>
                        {t('contraceptionStatistics.hero.neutral')}
                      </Text>
                    )}

                    {summary.regularityPercent !== null ? (
                      <Text style={styles.regularityDisclaimer}>
                        {t('contraceptionStatistics.hero.disclaimer')}
                      </Text>
                    ) : null}

                    <View
                      style={
                        styles.heroCountsRow
                      }>
                      <View
                        style={
                          styles.heroCountItem
                        }>
                        <View
                          style={[
                            styles.heroCountDot,
                            {
                              backgroundColor:
                                SUCCESS,
                            },
                          ]}
                        />

                        <Text
                          style={
                            styles.heroCountText
                          }>
                          {t('contraceptionStatistics.hero.takenCount', {count: summary.taken})}
                        </Text>
                      </View>

                      <View style={styles.heroCountItem}>
                        <View style={[styles.heroCountDot, {backgroundColor: WARNING}]} />

                        <Text style={styles.heroCountText}>
                          {t('contraceptionStatistics.hero.lateCount', {count: summary.late})}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.heroCountItem
                        }>
                        <View
                          style={[
                            styles.heroCountDot,
                            {
                              backgroundColor:
                                DANGER,
                            },
                          ]}
                        />

                        <Text
                          style={
                            styles.heroCountText
                          }>
                          {t('contraceptionStatistics.hero.missedCount', {count: summary.missed})}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {!hasDataInPeriod ? (
                    <View
                      style={
                        styles.card
                      }>
                      <Text
                        style={
                          styles.emptyText
                        }>
                        {t('contraceptionStatistics.noDataInPeriod')}
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* RÉPARTITION */}

                      <View
                        style={
                          styles.card
                        }>
                        <Text
                          style={
                            styles.sectionTitle
                          }>
                          {t('contraceptionStatistics.distribution.title')}
                        </Text>

                        <DistributionBar
                          color={
                            SUCCESS
                          }
                          label={t('contraceptionStatistics.distribution.takenLabel')}
                          maxValue={
                            maxDistribution
                          }
                          value={
                            summary.taken
                          }
                        />

                        <DistributionBar
                          color={WARNING}
                          label={t('contraceptionStatistics.distribution.lateLabel')}
                          maxValue={maxDistribution}
                          value={summary.late}
                        />

                        <DistributionBar
                          color={
                            DANGER
                          }
                          label={t('contraceptionStatistics.distribution.missedLabel')}
                          maxValue={
                            maxDistribution
                          }
                          value={
                            summary.missed
                          }
                        />
                      </View>

                      {/* ÉVOLUTION */}

                      {buckets.length >
                      0 ? (
                        <View
                          style={
                            styles.card
                          }>
                          <Text
                            style={
                              styles.sectionTitle
                            }>
                            {t('contraceptionStatistics.evolution.title')}
                          </Text>

                          <Text
                            style={
                              styles.sectionSubtitle
                            }>
                            {periodMonths ===
                            1
                              ? t('contraceptionStatistics.evolution.byWeek')
                              : t('contraceptionStatistics.evolution.byMonth')}
                          </Text>

                          <View
                            style={
                              styles.trendRow
                            }>
                            {buckets.map(
                              bucket => (
                                <TrendColumn
                                  bucket={
                                    bucket
                                  }
                                  key={
                                    bucket.label
                                  }
                                  maxValue={
                                    maxBucketValue
                                  }
                                />
                              ),
                            )}
                          </View>

                          <View
                            style={
                              styles.trendLegend
                            }>
                            <LegendDot
                              color={
                                SUCCESS
                              }
                              label={t('contraceptionStatistics.evolution.takenLegend')}
                            />

                            <LegendDot color={WARNING} label={t('contraceptionStatistics.evolution.lateLegend')} />

                            <LegendDot
                              color={
                                DANGER
                              }
                              label={t('contraceptionStatistics.evolution.missedLegend')}
                            />
                          </View>
                        </View>
                      ) : null}

                      {/* STREAK */}

                      {bestStreak >
                      0 ? (
                        <View
                          style={
                            styles.card
                          }>
                          <View
                            style={
                              styles.streakRow
                            }>
                            <View
                              style={
                                styles.streakIcon
                              }>
                              <MaterialDesignIcons
                                color={
                                  PURPLE
                                }
                                name="fire"
                                size={
                                  20
                                }
                              />
                            </View>

                            <View
                              style={
                                styles.streakTextGroup
                              }>
                              <Text
                                style={
                                  styles.streakLabel
                                }>
                                {t('contraceptionStatistics.streak.label')}
                              </Text>

                              <Text
                                style={
                                  styles.streakValue
                                }>
                                {t('contraceptionStatistics.streak.value', {count: bestStreak})}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ) : null}
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {/* RING / PATCH / NO METHOD CHOSEN */}

              <View
                style={
                  styles.card
                }>
                <Text
                  style={
                    styles.sectionTitle
                  }>
                  {t('contraceptionStatistics.tracking.title')}
                </Text>

                <View
                  style={
                    styles.selectedRow
                  }>
                  <View
                    style={[
                      styles.selectedRowIcon,
                      styles.selectedRowIconMuted,
                    ]}>
                    <MaterialDesignIcons
                      color={
                        MUTED
                      }
                      name="calendar-range-outline"
                      size={
                        17
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.selectedRowTextGroup
                    }>
                    <Text
                      style={
                        styles.selectedRowLabel
                      }>
                      {t('contraceptionStatistics.tracking.durationLabel')}
                    </Text>

                    <Text
                      style={
                        styles.selectedRowValue
                      }>
                      {trackingDurationDays !==
                      null
                        ? t('contraceptionStatistics.tracking.durationValue', {count: trackingDurationDays})
                        : t('contraceptionStatistics.tracking.durationNotProvided')}
                    </Text>
                  </View>
                </View>
              </View>

              {isEventMethod ? (
                <>
                  {/* PERIOD SELECTOR */}

                  <View style={styles.periodRow}>
                    {intakePeriodOptions.map(option => {
                      const active = option.value === periodMonths;
                      const locked = !isIntakePeriodFree(option.value) && !isPremium;
                      return (
                        <Pressable
                          accessibilityLabel={option.label}
                          accessibilityRole="button"
                          accessibilityState={{selected: active}}
                          key={option.value}
                          onPress={() => handleSelectIntakePeriod(option.value)}
                          style={({pressed}) => [
                            styles.periodButton,
                            active && styles.periodButtonActive,
                            pressed && styles.pressed,
                          ]}>
                          <View style={styles.periodButtonContent}>
                            <Text style={[styles.periodButtonText, active && styles.periodButtonTextActive]}>
                              {option.label}
                            </Text>
                            {locked ? (
                              <MaterialDesignIcons color={MUTED} name="lock-outline" size={10} />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {hasAnyEventInPeriod ? (
                    <View style={styles.card}>
                      <Text style={styles.sectionTitle}>{t('contraceptionStatistics.events.title')}</Text>

                      {methodEventTypes.map(type => {
                        const count = eventCounts[type] ?? 0;
                        return count > 0 ? (
                          <DistributionBar
                            color={PURPLE}
                            key={type}
                            label={contraceptionEventLabels(t)[type]}
                            maxValue={Math.max(1, ...methodEventTypes.map(eventType => eventCounts[eventType] ?? 0))}
                            value={count}
                          />
                        ) : null;
                      })}
                    </View>
                  ) : (
                    <View style={styles.card}>
                      <View style={styles.emptyIcon}>
                        <MaterialDesignIcons color={PURPLE} name="chart-donut" size={26} />
                      </View>

                      <Text style={styles.emptyTitle}>{t('contraceptionStatistics.events.emptyTitle')}</Text>

                      <Text style={styles.emptyText}>
                        {t('contraceptionStatistics.events.emptyText', {
                          types: methodEventTypes.map(type => contraceptionEventLabels(t)[type].toLowerCase()).join(', '),
                        })}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View
                  style={
                    styles.card
                  }>
                  <View
                    style={
                      styles.emptyIcon
                    }>
                    <MaterialDesignIcons
                      color={
                        PURPLE
                      }
                      name="chart-donut"
                      size={
                        26
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.emptyTitle
                    }>
                    {t('contraceptionStatistics.noMethod.title')}
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }>
                    {t('contraceptionStatistics.noMethod.text')}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* MA MÉTHODE */}

          <View
            style={
              styles.card
            }>
            <Text
              style={
                styles.sectionTitle
              }>
              {t('contraceptionStatistics.method.title')}
            </Text>

            <View
              style={
                styles.selectedRow
              }>
              <View
                style={[
                  styles.selectedRowIcon,
                  styles.selectedRowIconPurple,
                ]}>
                <MaterialDesignIcons
                  color={
                    PURPLE
                  }
                  name={
                    methodIcon
                  }
                  size={
                    17
                  }
                />
              </View>

              <View
                style={
                  styles.selectedRowTextGroup
                }>
                <Text
                  style={
                    styles.selectedRowValue
                  }>
                  {
                    methodLabel
                  }
                </Text>

                <Text
                  style={
                    styles.selectedRowLabel
                  }>
                  {methodStartDate
                    ? t('contraceptionStatistics.method.sinceLabel', {
                        date: formatFullDate(
                          new Date(
                            `${methodStartDate}T12:00:00`,
                          ),
                        ),
                      })
                    : t('contraceptionStatistics.method.startNotProvided')}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.selectedRow
              }>
              <View
                style={[
                  styles.selectedRowIcon,

                  reminderIndicator === 'enabled'
                    ? styles.selectedRowIconGreen
                    : styles.selectedRowIconMuted,
                ]}>
                <MaterialDesignIcons
                  color={
                    reminderIndicator === 'enabled'
                      ? SUCCESS
                      : MUTED
                  }
                  name={
                    reminderIndicator === 'enabled'
                      ? 'bell-check-outline'
                      : 'bell-off-outline'
                  }
                  size={
                    17
                  }
                />
              </View>

              <View
                style={
                  styles.selectedRowTextGroup
                }>
                <Text
                  style={
                    styles.selectedRowLabel
                  }>
                  {t('contraceptionStatistics.method.remindersLabel')}
                </Text>

                <Text
                  style={
                    styles.selectedRowValue
                  }>
                  {reminderIndicator === 'enabled'
                    ? t('contraceptionStatistics.method.remindersEnabled')
                    : reminderIndicator === 'unavailable'
                      ? t('contraceptionStatistics.method.remindersUnavailable')
                      : t('contraceptionStatistics.method.remindersDisabled')}
                </Text>
              </View>
            </View>
          </View>
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

function DistributionBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const widthPercent =
    Math.max(
      4,
      Math.round(
        (value /
          maxValue) *
          100,
      ),
    );

  return (
    <View
      style={
        styles.distributionRow
      }>
      <View
        style={
          styles.distributionHeader
        }>
        <Text
          style={
            styles.distributionLabel
          }>
          {label}
        </Text>

        <Text
          style={[
            styles.distributionValue,
            {
              color,
            },
          ]}>
          {value}
        </Text>
      </View>

      <View
        style={
          styles.distributionTrack
        }>
        <View
          style={[
            styles.distributionFill,
            {
              width: `${widthPercent}%`,
              backgroundColor:
                color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function TrendColumn({
  bucket,
  maxValue,
}: {
  bucket: ContraceptionPeriodBucket;
  maxValue: number;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const takenHeight =
    Math.max(
      3,
      Math.round(
        (bucket.taken /
          maxValue) *
          64,
      ),
    );

  const lateHeight =
    Math.max(
      3,
      Math.round(
        (bucket.late /
          maxValue) *
          64,
      ),
    );

  const missedHeight =
    Math.max(
      3,
      Math.round(
        (bucket.missed /
          maxValue) *
          64,
      ),
    );

  return (
    <View
      style={
        styles.trendColumn
      }>
      <View
        style={
          styles.trendBarsRow
        }>
        <View
          style={[
            styles.trendBar,
            {
              height:
                takenHeight,
              backgroundColor:
                SUCCESS,
            },
          ]}
        />

        <View
          style={[
            styles.trendBar,
            {
              height: lateHeight,
              backgroundColor: WARNING,
            },
          ]}
        />

        <View
          style={[
            styles.trendBar,
            {
              height:
                missedHeight,
              backgroundColor:
                DANGER,
            },
          ]}
        />
      </View>

      <Text
        numberOfLines={
          1
        }
        style={
          styles.trendColumnLabel
        }>
        {
          bucket.label
        }
      </Text>
    </View>
  );
}

function LegendDot({
  color,
  label,
}: {
  color: string;
  label: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={
        styles.legendItem
      }>
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor:
              color,
          },
        ]}
      />

      <Text
        style={
          styles.legendText
        }>
        {label}
      </Text>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  const PURPLE = theme.colors.primary;
  const PURPLE_DARK = theme.colors.accent;
  const PURPLE_SOFT = theme.colors.primarySoft;
  const MUTED = theme.colors.textMuted;

  return StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor:
        theme.colors.background,
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
      backgroundColor:
        withAlpha(theme.colors.primary, 0.07),
    },

    pageGlowMiddle: {
      position: 'absolute',
      top: '38%',
      left: -130,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor:
        withAlpha(theme.colors.primary, 0.045),
    },

    pageGlowBottom: {
      position: 'absolute',
      bottom: -150,
      right: -100,
      width: 310,
      height: 310,
      borderRadius: 155,
      backgroundColor:
        withAlpha(theme.colors.primary, 0.05),
    },

    safeArea: {
      flex: 1,
    },

    /*
     * IMPORTANT:
     * paddingTop is now supplied dynamically
     * from SafeAreaInsets.
     */
    content: {
      flexGrow: 1,
      paddingHorizontal: 16,
    },

    header: {
      marginBottom: 6,
    },

    title: {
      color:
        PURPLE_DARK,

      fontFamily:
        'serif',

      fontSize: 23,

      fontWeight:
        '800',
    },

    subtitle: {
      marginTop: 5,

      color:
        MUTED,

      fontSize:
        12.5,

      lineHeight: 18,
    },

    card: {
      marginTop: 16,

      padding: 16,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 24,

      backgroundColor:
        withAlpha(theme.colors.surface, 0.98),

      ...theme.shadow,
    },

    periodRow: {
      flexDirection:
        'row',

      marginTop: 18,

      gap: 8,

      padding: 4,

      borderRadius: 18,

      backgroundColor:
        PURPLE_SOFT,
    },

    periodButton: {
      flex: 1,

      minHeight: 38,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 14,
    },

    periodButtonActive: {
      backgroundColor:
        PURPLE,
    },

    periodButtonContent: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 3,
    },

    periodButtonText: {
      color:
        MUTED,

      fontSize: 12,

      fontWeight:
        '700',
    },

    periodButtonTextActive: {
      color:
        onPrimaryTextColor(theme),
    },

    emptyIcon: {
      width: 54,
      height: 54,

      alignSelf:
        'center',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 10,

      borderRadius: 18,

      backgroundColor:
        PURPLE_SOFT,
    },

    emptyTitle: {
      color:
        PURPLE_DARK,

      fontFamily:
        'serif',

      fontSize: 15,

      fontWeight:
        '800',

      textAlign:
        'center',
    },

    emptyText: {
      marginTop: 6,

      color:
        MUTED,

      fontSize: 12,

      lineHeight: 17,

      textAlign:
        'center',
    },

    heroEyebrow: {
      color:
        MUTED,

      fontSize: 11,

      fontWeight:
        '700',

      textAlign:
        'center',

      textTransform:
        'uppercase',
    },

    heroPercent: {
      marginTop: 6,

      color:
        PURPLE_DARK,

      fontFamily:
        'serif',

      fontSize: 40,

      fontWeight:
        '900',

      textAlign:
        'center',
    },

    heroPercentLabel: {
      marginTop: 2,

      color:
        PURPLE,

      fontSize:
        12.5,

      fontWeight:
        '700',

      textAlign:
        'center',
    },

    heroNeutral: {
      marginTop: 12,
      marginBottom: 2,

      color:
        PURPLE_DARK,

      fontSize: 14,

      fontWeight:
        '700',

      textAlign:
        'center',
    },

    regularityDisclaimer: {
      marginTop: 6,
      color: MUTED,
      fontSize: 9.5,
      lineHeight: 13,
      fontStyle: 'italic',
      textAlign: 'center',
    },

    heroCountsRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      justifyContent:
        'center',

      gap: 16,

      marginTop: 16,
    },

    heroCountItem: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 6,
    },

    heroCountDot: {
      width: 8,
      height: 8,

      borderRadius: 4,
    },

    heroCountText: {
      color:
        PURPLE_DARK,

      fontSize: 12,

      fontWeight:
        '700',
    },

    sectionTitle: {
      color:
        PURPLE_DARK,

      fontFamily:
        'serif',

      fontSize:
        15.5,

      fontWeight:
        '800',
    },

    sectionSubtitle: {
      marginTop: 2,

      color:
        MUTED,

      fontSize:
        10.5,
    },

    distributionRow: {
      marginTop: 14,
    },

    distributionHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    distributionLabel: {
      flex: 1,

      minWidth: 0,

      color:
        PURPLE_DARK,

      fontSize: 12,

      fontWeight:
        '700',
    },

    distributionValue: {
      marginLeft: 8,

      fontSize: 13,

      fontWeight:
        '900',
    },

    distributionTrack: {
      height: 8,

      marginTop: 6,

      overflow:
        'hidden',

      borderRadius: 4,

      backgroundColor:
        theme.colors.primarySoft,
    },

    distributionFill: {
      height:
        '100%',

      borderRadius: 4,
    },

    trendRow: {
      minHeight: 84,

      flexDirection:
        'row',

      alignItems:
        'flex-end',

      justifyContent:
        'space-between',

      gap: 6,

      marginTop: 16,
    },

    trendColumn: {
      flex: 1,

      minWidth: 0,

      alignItems:
        'center',
    },

    trendBarsRow: {
      height: 64,

      flexDirection:
        'row',

      alignItems:
        'flex-end',

      gap: 3,
    },

    trendBar: {
      width: 8,

      borderRadius: 4,
    },

    trendColumnLabel: {
      marginTop: 6,

      color:
        MUTED,

      fontSize:
        8.5,

      fontWeight:
        '600',

      textAlign:
        'center',
    },

    trendLegend: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 14,

      marginTop: 12,
    },

    legendItem: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,
    },

    legendDot: {
      width: 8,
      height: 8,

      borderRadius: 4,
    },

    legendText: {
      color:
        MUTED,

      fontSize:
        10.5,
    },

    streakRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 12,
    },

    streakIcon: {
      width: 42,
      height: 42,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 15,

      backgroundColor:
        PURPLE_SOFT,
    },

    streakTextGroup: {
      flex: 1,

      minWidth: 0,
    },

    streakLabel: {
      color:
        MUTED,

      fontSize:
        10.5,

      fontWeight:
        '700',
    },

    streakValue: {
      marginTop: 2,

      color:
        PURPLE_DARK,

      fontSize:
        13.5,

      fontWeight:
        '800',
    },

    selectedRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 10,

      marginTop: 6,

      paddingVertical: 8,
    },

    selectedRowIcon: {
      width: 34,
      height: 34,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 12,
    },

    selectedRowIconPurple: {
      backgroundColor:
        PURPLE_SOFT,
    },

    selectedRowIconGreen: {
      backgroundColor:
        SUCCESS_SOFT,
    },

    selectedRowIconMuted: {
      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    selectedRowTextGroup: {
      flex: 1,

      minWidth: 0,
    },

    selectedRowLabel: {
      color:
        MUTED,

      fontSize:
        10.5,

      fontWeight:
        '700',
    },

    selectedRowValue: {
      marginTop: 2,

      color:
        PURPLE_DARK,

      fontSize:
        12.5,

      lineHeight: 17,

      fontWeight:
        '800',
    },

    pressed: {
      opacity:
        0.82,
    },
  });
}

export default ContraceptionStatisticsScreen;