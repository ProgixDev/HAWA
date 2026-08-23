import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
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

import {
  homeColors,
  homeShadow,
} from '../../components/home/homeTheme';

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
} from '../../state/contraceptionEventStore';

import {
  CONTRACEPTION_EVENT_LABELS,
  CONTRACEPTION_METHOD_EVENT_TYPES,
  CONTRACEPTION_METHOD_ICONS,
  CONTRACEPTION_METHOD_LABELS,
} from '../../config/contraceptionLabels';

import {
  computeContraceptionBestStreak,
  computeContraceptionEventCounts,
  computeContraceptionMonthlyBreakdown,
  computeContraceptionRangeSummary,
  computeContraceptionWeeklyBreakdown,
  type ContraceptionPeriodBucket,
} from '../../utils/contraceptionMath';

import {
  formatFullDate,
  startOfDay,
} from '../../utils/cycleMath';

const PURPLE =
  homeColors.primary;

const PURPLE_DARK =
  homeColors.textPrimary;

const PURPLE_SOFT =
  homeColors.lightLavender;

const MUTED =
  homeColors.textSecondary;

const SUCCESS =
  homeColors.green;

const SUCCESS_SOFT =
  homeColors.greenLight;

const DANGER =
  '#D96176';

// Same hex as ContraceptionJournalEntryScreen.tsx's/ContraceptionDashboard.tsx's/
// ContraceptionCalendarContent.tsx's local warning color — the 'late'
// status's color everywhere it's shown.
const WARNING = '#C77B2E';

const BORDER =
  homeColors.cardBorder;

type PeriodMonths =
  | 1
  | 3
  | 6;

const PERIOD_OPTIONS: {
  value: PeriodMonths;
  label: string;
}[] = [
  {
    value: 1,
    label: '1 mois',
  },
  {
    value: 3,
    label: '3 mois',
  },
  {
    value: 6,
    label: '6 mois',
  },
];

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

  const today =
    useMemo(
      () =>
        startOfDay(
          new Date(),
        ),
      [],
    );

  const todayKey =
    useMemo(
      () =>
        localDateKey(
          today,
        ),
      [today],
    );

  const [
    periodMonths,
    setPeriodMonths,
  ] =
    useState<PeriodMonths>(
      1,
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
      ? CONTRACEPTION_METHOD_LABELS[
          method
        ]
      : 'Non renseignée';

  const methodIcon =
    method
      ? CONTRACEPTION_METHOD_ICONS[
          method
        ]
      : 'pill';

  const hasAnyIntakeRecord =
    Object.keys(
      recordsByDate,
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
          recordsByDate,
          rangeStartKey,
          todayKey,
          methodStartDate,
        ),
      [
        recordsByDate,
        rangeStartKey,
        todayKey,
        methodStartDate,
      ],
    );

  const buckets: ContraceptionPeriodBucket[] =
    useMemo(() => {
      return periodMonths ===
        1
        ? computeContraceptionWeeklyBreakdown(
            recordsByDate,
            rangeStartKey,
            todayKey,
          )
        : computeContraceptionMonthlyBreakdown(
            recordsByDate,
            rangeStartKey,
            todayKey,
          );
    }, [
      recordsByDate,
      rangeStartKey,
      todayKey,
      periodMonths,
    ]);

  const bestStreak =
    useMemo(
      () =>
        computeContraceptionBestStreak(
          recordsByDate,
          rangeStartKey,
          todayKey,
        ),
      [
        recordsByDate,
        rangeStartKey,
        todayKey,
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

      const elapsed =
        Math.floor(
          (today.getTime() -
            start.getTime()) /
            86_400_000,
        );

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

  const eventCounts =
    useMemo(
      () =>
        isEventMethod
          ? computeContraceptionEventCounts(
              eventsByDate,
              rangeStartKey,
              todayKey,
            )
          : {},
      [
        isEventMethod,
        eventsByDate,
        rangeStartKey,
        todayKey,
      ],
    );

  const hasAnyEventInPeriod = methodEventTypes.some(
    type => (eventCounts[type] ?? 0) > 0,
  );

  return (
    <LinearGradient
      colors={[
        '#FAF8FD',
        '#F4EFFA',
        '#EEE7F7',
        '#E9E1F3',
      ]}
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
          barStyle="dark-content"
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

              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ) + 24,
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
              Statistiques
            </Text>

            <Text
              style={
                styles.subtitle
              }>
              Observe tes habitudes de suivi dans le temps.
            </Text>
          </View>

          {isIntakeMethod ? (
            <>
              {/* PERIOD SELECTOR */}

              <View
                style={
                  styles.periodRow
                }>
                {PERIOD_OPTIONS.map(
                  option => {
                    const active =
                      option.value ===
                      periodMonths;

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
                          setPeriodMonths(
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
                    Tes statistiques vont apparaître ici
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }>
                    Enregistre tes prises et oublis pendant quelques jours pour découvrir tes tendances.
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
                      Ton suivi
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
                          Régularité
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={
                          styles.heroNeutral
                        }>
                        Pas encore assez de données
                      </Text>
                    )}

                    {summary.regularityPercent !== null ? (
                      <Text style={styles.regularityDisclaimer}>
                        Basé sur tes propres enregistrements.
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
                          {
                            summary.taken
                          }{' '}
                          prise
                          {summary.taken >
                          1
                            ? 's'
                            : ''}{' '}
                          effectuée
                          {summary.taken >
                          1
                            ? 's'
                            : ''}
                        </Text>
                      </View>

                      <View style={styles.heroCountItem}>
                        <View style={[styles.heroCountDot, {backgroundColor: WARNING}]} />

                        <Text style={styles.heroCountText}>
                          {summary.late} retard{summary.late > 1 ? 's' : ''}
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
                          {
                            summary.missed
                          }{' '}
                          oubli
                          {summary.missed >
                          1
                            ? 's'
                            : ''}
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
                        Aucune donnée enregistrée pour cette période. Essaie une période plus longue.
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
                          Répartition
                        </Text>

                        <DistributionBar
                          color={
                            SUCCESS
                          }
                          label="Prises effectuées"
                          maxValue={
                            maxDistribution
                          }
                          value={
                            summary.taken
                          }
                        />

                        <DistributionBar
                          color={WARNING}
                          label="Retards"
                          maxValue={maxDistribution}
                          value={summary.late}
                        />

                        <DistributionBar
                          color={
                            DANGER
                          }
                          label="Oublis"
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
                            Évolution
                          </Text>

                          <Text
                            style={
                              styles.sectionSubtitle
                            }>
                            {periodMonths ===
                            1
                              ? 'Par semaine'
                              : 'Par mois'}
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
                              label="Effectuées"
                            />

                            <LegendDot color={WARNING} label="Retards" />

                            <LegendDot
                              color={
                                DANGER
                              }
                              label="Oublis"
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
                                Meilleure série
                              </Text>

                              <Text
                                style={
                                  styles.streakValue
                                }>
                                {
                                  bestStreak
                                }{' '}
                                jour
                                {bestStreak >
                                1
                                  ? 's'
                                  : ''}{' '}
                                consécutifs
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
                  Suivi
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
                      Durée du suivi
                    </Text>

                    <Text
                      style={
                        styles.selectedRowValue
                      }>
                      {trackingDurationDays !==
                      null
                        ? `${trackingDurationDays} jour${trackingDurationDays > 1 ? 's' : ''}`
                        : 'Non renseignée'}
                    </Text>
                  </View>
                </View>
              </View>

              {isEventMethod ? (
                <>
                  {/* PERIOD SELECTOR */}

                  <View style={styles.periodRow}>
                    {PERIOD_OPTIONS.map(option => {
                      const active = option.value === periodMonths;
                      return (
                        <Pressable
                          accessibilityLabel={option.label}
                          accessibilityRole="button"
                          accessibilityState={{selected: active}}
                          key={option.value}
                          onPress={() => setPeriodMonths(option.value)}
                          style={({pressed}) => [
                            styles.periodButton,
                            active && styles.periodButtonActive,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={[styles.periodButtonText, active && styles.periodButtonTextActive]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {hasAnyEventInPeriod ? (
                    <View style={styles.card}>
                      <Text style={styles.sectionTitle}>Événements enregistrés</Text>

                      {methodEventTypes.map(type => {
                        const count = eventCounts[type] ?? 0;
                        return count > 0 ? (
                          <DistributionBar
                            color={PURPLE}
                            key={type}
                            label={CONTRACEPTION_EVENT_LABELS[type]}
                            maxValue={Math.max(1, ...methodEventTypes.map(t => eventCounts[t] ?? 0))}
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

                      <Text style={styles.emptyTitle}>Aucun événement enregistré</Text>

                      <Text style={styles.emptyText}>
                        Enregistre tes événements ({methodEventTypes.map(type => CONTRACEPTION_EVENT_LABELS[type].toLowerCase()).join(', ')}) pour découvrir tes statistiques ici.
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
                    Suivi détaillé à venir
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }>
                    Le suivi détaillé sera disponible une fois ta méthode de contraception choisie.
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
              Ma méthode
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
                    ? `Depuis le ${formatFullDate(
                        new Date(
                          `${methodStartDate}T12:00:00`,
                        ),
                      )}`
                    : 'Date de début non renseignée'}
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

                  remindersEnabled
                    ? styles.selectedRowIconGreen
                    : styles.selectedRowIconMuted,
                ]}>
                <MaterialDesignIcons
                  color={
                    remindersEnabled
                      ? SUCCESS
                      : MUTED
                  }
                  name={
                    remindersEnabled
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
                  Rappels
                </Text>

                <Text
                  style={
                    styles.selectedRowValue
                  }>
                  {remindersEnabled
                    ? 'Activés'
                    : 'Désactivés'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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

const styles =
  StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor:
        '#F2ECF8',
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
        'rgba(111,82,170,0.07)',
    },

    pageGlowMiddle: {
      position: 'absolute',
      top: '38%',
      left: -130,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor:
        'rgba(139,112,188,0.045)',
    },

    pageGlowBottom: {
      position: 'absolute',
      bottom: -150,
      right: -100,
      width: 310,
      height: 310,
      borderRadius: 155,
      backgroundColor:
        'rgba(92,67,139,0.05)',
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
        BORDER,

      borderRadius: 24,

      backgroundColor:
        'rgba(255,255,255,0.98)',

      ...homeShadow,
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

    periodButtonText: {
      color:
        MUTED,

      fontSize: 12,

      fontWeight:
        '700',
    },

    periodButtonTextActive: {
      color:
        '#FFFFFF',
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
        '#EFEAF6',
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
        '#F0EDF4',
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

export default ContraceptionStatisticsScreen;