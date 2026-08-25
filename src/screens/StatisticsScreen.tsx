import React, {useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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
import {PremiumLockedCard} from '../components/premium/PremiumLockedCard';
import {HawaPremiumBottomSheet} from '../components/premium/HawaPremiumBottomSheet';

/* ============================================================
   TYPES
============================================================ */

type Props = MainTabScreenProps<'Statistics'>;

type Range = '3' | '6' | '12';

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

type CyclePoint = {
  id: string;
  label: string;
  days: number;
};

type SymptomStat = {
  id: string;
  name: string;
  days: number;
};

type FlowStat = {
  id: string;
  label: string;
  value: number;
  icon: IconName;
};

type StatisticsData = {
  averageCycleLength: number;
  averagePeriodLength: number;
  regularityLabel: string;
  lastCycleLength: number;

  cycles: CyclePoint[];

  flow: FlowStat[];

  symptoms: SymptomStat[];

  moodLabel: string;
  moodEntries: number;

  averageSleepMinutes: number;
  sleepDays: number;

  activityMinutes: number;
  activityDays: number;

  trackedDays: number;
};

/* ============================================================
   FRONTEND PREVIEW DATA

   Replace this later with data calculated from your real
   cycle/journal stores. The UI does not need to be redesigned.
============================================================ */

const PREVIEW_DATA: Record<Range, StatisticsData> = {
  '3': {
    averageCycleLength: 29,
    averagePeriodLength: 5,
    regularityLabel: 'Plutôt régulier',
    lastCycleLength: 30,

    cycles: [
      {
        id: 'cycle-1',
        label: 'Juin',
        days: 28,
      },
      {
        id: 'cycle-2',
        label: 'Juil.',
        days: 29,
      },
      {
        id: 'cycle-3',
        label: 'Août',
        days: 30,
      },
    ],

    flow: [
      {
        id: 'light',
        label: 'Léger',
        value: 4,
        icon: 'water-outline',
      },
      {
        id: 'medium',
        label: 'Moyen',
        value: 9,
        icon: 'water',
      },
      {
        id: 'heavy',
        label: 'Abondant',
        value: 3,
        icon: 'water-plus-outline',
      },
    ],

    symptoms: [
      {
        id: 'fatigue',
        name: 'Fatigue',
        days: 8,
      },
      {
        id: 'bloating',
        name: 'Ballonnements',
        days: 6,
      },
      {
        id: 'pain',
        name: 'Douleurs',
        days: 5,
      },
      {
        id: 'headache',
        name: 'Migraines',
        days: 3,
      },
    ],

    moodLabel: 'Bien',
    moodEntries: 15,

    averageSleepMinutes: 445,
    sleepDays: 14,

    activityMinutes: 210,
    activityDays: 8,

    trackedDays: 21,
  },

  '6': {
    averageCycleLength: 29,
    averagePeriodLength: 5,
    regularityLabel: 'Régulier',
    lastCycleLength: 30,

    cycles: [
      {
        id: 'cycle-1',
        label: 'Mars',
        days: 28,
      },
      {
        id: 'cycle-2',
        label: 'Avr.',
        days: 30,
      },
      {
        id: 'cycle-3',
        label: 'Mai',
        days: 29,
      },
      {
        id: 'cycle-4',
        label: 'Juin',
        days: 28,
      },
      {
        id: 'cycle-5',
        label: 'Juil.',
        days: 29,
      },
      {
        id: 'cycle-6',
        label: 'Août',
        days: 30,
      },
    ],

    flow: [
      {
        id: 'light',
        label: 'Léger',
        value: 8,
        icon: 'water-outline',
      },
      {
        id: 'medium',
        label: 'Moyen',
        value: 19,
        icon: 'water',
      },
      {
        id: 'heavy',
        label: 'Abondant',
        value: 7,
        icon: 'water-plus-outline',
      },
    ],

    symptoms: [
      {
        id: 'fatigue',
        name: 'Fatigue',
        days: 16,
      },
      {
        id: 'bloating',
        name: 'Ballonnements',
        days: 12,
      },
      {
        id: 'pain',
        name: 'Douleurs menstruelles',
        days: 10,
      },
      {
        id: 'sensitive',
        name: 'Seins sensibles',
        days: 7,
      },
      {
        id: 'headache',
        name: 'Migraines',
        days: 5,
      },
    ],

    moodLabel: 'Bien',
    moodEntries: 29,

    averageSleepMinutes: 438,
    sleepDays: 27,

    activityMinutes: 480,
    activityDays: 19,

    trackedDays: 43,
  },

  '12': {
    averageCycleLength: 30,
    averagePeriodLength: 5,
    regularityLabel: 'Plutôt régulier',
    lastCycleLength: 30,

    cycles: [
      {
        id: 'cycle-1',
        label: 'Sep.',
        days: 29,
      },
      {
        id: 'cycle-2',
        label: 'Oct.',
        days: 30,
      },
      {
        id: 'cycle-3',
        label: 'Nov.',
        days: 31,
      },
      {
        id: 'cycle-4',
        label: 'Déc.',
        days: 29,
      },
      {
        id: 'cycle-5',
        label: 'Jan.',
        days: 30,
      },
      {
        id: 'cycle-6',
        label: 'Fév.',
        days: 30,
      },
      {
        id: 'cycle-7',
        label: 'Mars',
        days: 28,
      },
      {
        id: 'cycle-8',
        label: 'Avr.',
        days: 30,
      },
      {
        id: 'cycle-9',
        label: 'Mai',
        days: 29,
      },
      {
        id: 'cycle-10',
        label: 'Juin',
        days: 28,
      },
      {
        id: 'cycle-11',
        label: 'Juil.',
        days: 29,
      },
      {
        id: 'cycle-12',
        label: 'Août',
        days: 30,
      },
    ],

    flow: [
      {
        id: 'light',
        label: 'Léger',
        value: 17,
        icon: 'water-outline',
      },
      {
        id: 'medium',
        label: 'Moyen',
        value: 38,
        icon: 'water',
      },
      {
        id: 'heavy',
        label: 'Abondant',
        value: 14,
        icon: 'water-plus-outline',
      },
    ],

    symptoms: [
      {
        id: 'fatigue',
        name: 'Fatigue',
        days: 31,
      },
      {
        id: 'bloating',
        name: 'Ballonnements',
        days: 23,
      },
      {
        id: 'pain',
        name: 'Douleurs menstruelles',
        days: 20,
      },
      {
        id: 'acne',
        name: 'Acné',
        days: 16,
      },
      {
        id: 'sensitive',
        name: 'Seins sensibles',
        days: 14,
      },
      {
        id: 'headache',
        name: 'Migraines',
        days: 9,
      },
    ],

    moodLabel: 'Bien',
    moodEntries: 61,

    averageSleepMinutes: 442,
    sleepDays: 58,

    activityMinutes: 990,
    activityDays: 39,

    trackedDays: 89,
  },
};

/* ============================================================
   HELPERS
============================================================ */

function formatMinutes(
  minutes: number,
): string {
  const hours = Math.floor(
    minutes / 60,
  );

  const remaining =
    Math.round(
      minutes % 60,
    );

  return `${hours} h ${String(
    remaining,
  ).padStart(2, '0')}`;
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
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <MaterialDesignIcons
          color={homeColors.primary}
          name={icon}
          size={21}
        />
      </View>

      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.cardTitle}>
          {title}
        </Text>

        {subtitle ? (
          <Text style={styles.cardSubtitle}>
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
        wide && styles.kpiCardWide,
      ]}>
      <View style={styles.kpiIcon}>
        <MaterialDesignIcons
          color={homeColors.primary}
          name={icon}
          size={21}
        />
      </View>

      <View style={styles.kpiCopy}>
        <Text
          numberOfLines={2}
          style={styles.kpiValue}>
          {value}
        </Text>

        <Text style={styles.kpiLabel}>
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
  detail,
}: {
  icon: IconName;
  value: string;
  label: string;
  detail: string;
}): React.JSX.Element {
  return (
    <View style={styles.wellnessCard}>
      <View style={styles.wellnessIcon}>
        <MaterialDesignIcons
          color={homeColors.primary}
          name={icon}
          size={23}
        />
      </View>

      <Text
        numberOfLines={2}
        style={styles.wellnessValue}>
        {value}
      </Text>

      <Text style={styles.wellnessLabel}>
        {label}
      </Text>

      <Text
        numberOfLines={1}
        style={styles.wellnessDetail}>
        {detail}
      </Text>
    </View>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

function StatisticsScreen(
  _props: Props,
): React.JSX.Element {
  const insets =
    useSafeAreaInsets();

  const {width} =
    useWindowDimensions();

  const compact =
    width < 370;

  const [
    range,
    setRange,
  ] =
    useState<Range>('6');

  // "Statistiques avancées" (3/6/12-month trend analysis) is a marketed
  // Premium benefit — see HawaPremiumBottomSheet.tsx's own BENEFITS list
  // ("Analyse ton évolution sur 3, 6 et 12 mois") and ProfileScreen.tsx's
  // Premium card. Gated here, above the existing (currently mock/preview)
  // content — no data/logic below this point was changed.
  const {isPremium} = usePremium();
  const [premiumVisible, setPremiumVisible] = useState(false);

  const data =
    PREVIEW_DATA[range];

  const maxCycleDays =
    useMemo(
      () =>
        Math.max(
          ...data.cycles.map(
            item =>
              item.days,
          ),
          1,
        ),
      [data.cycles],
    );

  const minCycleDays =
    useMemo(
      () =>
        Math.min(
          ...data.cycles.map(
            item =>
              item.days,
          ),
        ),
      [data.cycles],
    );

  const cycleVariation =
    maxCycleDays -
    minCycleDays;

  const maxSymptomDays =
    Math.max(
      ...data.symptoms.map(
        item =>
          item.days,
      ),
      1,
    );

  const maxFlow =
    Math.max(
      ...data.flow.map(
        item =>
          item.value,
      ),
      1,
    );

  const dominantFlow =
    [...data.flow].sort(
      (a, b) =>
        b.value -
        a.value,
    )[0];

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

      <SafeAreaView
        edges={[
          'top',
          'left',
          'right',
        ]}
        style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,

            compact &&
              styles.scrollContentCompact,

            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ) + 120,
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }>
          {/* ==================================================
              HEADER
          =================================================== */}

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>
                Statistiques
              </Text>

              <Text style={styles.subtitle}>
                Comprends ton corps grâce à tes tendances
              </Text>
            </View>

            <View style={styles.headerIcon}>
              <MaterialDesignIcons
                color={homeColors.primary}
                name="chart-timeline-variant-shimmer"
                size={25}
              />
            </View>
          </View>

          {isPremium ? (
          <>
          {/* ==================================================
              RANGE FILTER
          =================================================== */}

          <View style={styles.filters}>
            {(
              [
                {
                  key: '3',
                  label: '3 mois',
                },
                {
                  key: '6',
                  label: '6 mois',
                },
                {
                  key: '12',
                  label: '12 mois',
                },
              ] as const
            ).map(item => {
              const active =
                range ===
                item.key;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={item.key}
                  onPress={() =>
                    setRange(
                      item.key,
                    )
                  }
                  style={[
                    styles.filterButton,

                    active &&
                      styles.filterButtonActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterText,

                      active &&
                        styles.filterTextActive,
                    ]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ==================================================
              PREMIUM OVERVIEW HERO
          =================================================== */}

          <View style={styles.cycleHero}>
            <View style={styles.heroDecorationOne} />
            <View style={styles.heroDecorationTwo} />

            <View style={styles.heroTop}>
              <View style={styles.heroMain}>
                <Text style={styles.heroEyebrow}>
                  MON CYCLE
                </Text>

                <View style={styles.heroCycleRow}>
                  <Text style={styles.heroNumber}>
                    {data.averageCycleLength}
                  </Text>

                  <View style={styles.heroNumberCopy}>
                    <Text style={styles.heroUnit}>
                      jours
                    </Text>

                    <Text style={styles.heroLabel}>
                      durée moyenne
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.regularityBadge}>
                <MaterialDesignIcons
                  color={homeColors.primary}
                  name="chart-bell-curve-cumulative"
                  size={20}
                />

                <Text style={styles.regularityText}>
                  {data.regularityLabel}
                </Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroBottom}>
              <View style={styles.heroMeta}>
                <View style={styles.heroMetaIcon}>
                  <MaterialDesignIcons
                    color={homeColors.primary}
                    name="calendar-range"
                    size={18}
                  />
                </View>

                <View>
                  <Text style={styles.heroMetaLabel}>
                    Règles
                  </Text>

                  <Text style={styles.heroMetaValue}>
                    {data.averagePeriodLength} jours
                  </Text>
                </View>
              </View>

              <View style={styles.heroVerticalDivider} />

              <View style={styles.heroMeta}>
                <View style={styles.heroMetaIcon}>
                  <MaterialDesignIcons
                    color={homeColors.primary}
                    name="history"
                    size={18}
                  />
                </View>

                <View>
                  <Text style={styles.heroMetaLabel}>
                    Dernier cycle
                  </Text>

                  <Text style={styles.heroMetaValue}>
                    {data.lastCycleLength} jours
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ==================================================
              OVERVIEW
          =================================================== */}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Vue d’ensemble
            </Text>

            <Text style={styles.sectionDescription}>
              Résumé des {range} derniers mois
            </Text>
          </View>

          <View style={styles.kpiGrid}>
            <KpiCard
              icon="calendar-check-outline"
              label="Jours renseignés"
              value={String(
                data.trackedDays,
              )}
            />

            <KpiCard
              icon="calendar-refresh-outline"
              label="Variation des cycles"
              value={`${cycleVariation} ${
                cycleVariation >
                1
                  ? 'jours'
                  : 'jour'
              }`}
            />

            <KpiCard
              icon="water"
              label="Flux dominant"
              value={
                dominantFlow?.label ??
                '—'
              }
              wide
            />
          </View>

          {/* ==================================================
              CYCLE EVOLUTION
          =================================================== */}

          <View style={styles.card}>
            <SectionHeader
              icon="chart-line"
              title="Évolution du cycle"
              subtitle="Durée de tes derniers cycles"
            />

            <View style={styles.cycleSummary}>
              <View>
                <Text style={styles.metricLabel}>
                  Moyenne
                </Text>

                <Text style={styles.metricValue}>
                  {data.averageCycleLength} jours
                </Text>
              </View>

              <View style={styles.rangeBadge}>
                <MaterialDesignIcons
                  color={homeColors.primary}
                  name="arrow-expand-horizontal"
                  size={16}
                />

                <Text style={styles.rangeBadgeText}>
                  {minCycleDays} – {maxCycleDays} j
                </Text>
              </View>
            </View>

            <View style={styles.cycleChart}>
              {data.cycles.map(
                item => {
                  const min =
                    minCycleDays -
                    2;

                  const span =
                    Math.max(
                      maxCycleDays -
                        min +
                        2,
                      4,
                    );

                  const height =
                    32 +
                    ((item.days -
                      min) /
                      span) *
                      68;

                  return (
                    <View
                      key={item.id}
                      style={styles.cycleBarColumn}>
                      <Text style={styles.cycleBarValue}>
                        {item.days}
                      </Text>

                      <View style={styles.cycleBarTrack}>
                        <View
                          style={[
                            styles.cycleBarFill,
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
                        style={styles.cycleBarLabel}>
                        {item.label}
                      </Text>
                    </View>
                  );
                },
              )}
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <MaterialDesignIcons
                  color={homeColors.primary}
                  name="lightbulb-outline"
                  size={18}
                />
              </View>

              <Text style={styles.insightText}>
                Tes cycles varient de {cycleVariation}{' '}
                {cycleVariation > 1 ? 'jours' : 'jour'} sur la période sélectionnée.
              </Text>
            </View>
          </View>

          {/* ==================================================
              FLOW
          =================================================== */}

          <View style={styles.card}>
            <SectionHeader
              icon="water-outline"
              title="Flux menstruel"
              subtitle="Répartition des intensités enregistrées"
            />

            <View style={styles.flowList}>
              {data.flow.map(
                item => {
                  const percentage =
                    (item.value /
                      maxFlow) *
                    100;

                  return (
                    <View
                      key={item.id}
                      style={styles.flowItem}>
                      <View style={styles.flowTop}>
                        <View style={styles.flowIcon}>
                          <MaterialDesignIcons
                            color={homeColors.primary}
                            name={item.icon}
                            size={18}
                          />
                        </View>

                        <Text style={styles.flowLabel}>
                          {item.label}
                        </Text>

                        <Text style={styles.flowValue}>
                          {item.value} jours
                        </Text>
                      </View>

                      <View style={styles.flowTrack}>
                        <View
                          style={[
                            styles.flowFill,
                            {
                              width: `${Math.max(
                                8,
                                percentage,
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
          </View>

          {/* ==================================================
              SYMPTOMS
          =================================================== */}

          <View style={styles.card}>
            <SectionHeader
              icon="heart-pulse"
              title="Symptômes fréquents"
              subtitle="Les symptômes les plus enregistrés"
            />

            <View style={styles.symptomList}>
              {data.symptoms.map(
                (
                  item,
                  index,
                ) => {
                  const percentage =
                    (item.days /
                      maxSymptomDays) *
                    100;

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.symptomItem,

                        index ===
                          data.symptoms.length -
                            1 &&
                          styles.lastItem,
                      ]}>
                      <View style={styles.symptomTop}>
                        <View style={styles.rank}>
                          <Text style={styles.rankText}>
                            {index + 1}
                          </Text>
                        </View>

                        <Text style={styles.symptomName}>
                          {item.name}
                        </Text>

                        <View style={styles.symptomBadge}>
                          <Text style={styles.symptomDays}>
                            {item.days}{' '}
                            {item.days >
                            1
                              ? 'jours'
                              : 'jour'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.symptomTrack}>
                        <View
                          style={[
                            styles.symptomFill,
                            {
                              width: `${Math.max(
                                10,
                                percentage,
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
          </View>

          {/* ==================================================
              WELLNESS
          =================================================== */}

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Bien-être
            </Text>

            <Text style={styles.sectionDescription}>
              Humeur, sommeil et activité
            </Text>
          </View>

          <View style={styles.wellnessGrid}>
            <WellnessCard
              icon="emoticon-happy-outline"
              label="Humeur"
              value={data.moodLabel}
              detail={`${data.moodEntries} entrées`}
            />

            <WellnessCard
              icon="weather-night"
              label="Sommeil"
              value={formatMinutes(
                data.averageSleepMinutes,
              )}
              detail={`${data.sleepDays} nuits suivies`}
            />

            <WellnessCard
              icon="run"
              label="Activité"
              value={formatMinutes(
                data.activityMinutes,
              )}
              detail={`${data.activityDays} jours actifs`}
            />

            <WellnessCard
              icon="calendar-check-outline"
              label="Suivi"
              value={`${data.trackedDays} j`}
              detail={`sur ${range} mois`}
            />
          </View>

          {/* ==================================================
              MEDICAL SUMMARY
          =================================================== */}

          <View style={styles.healthSummary}>
            <View style={styles.healthSummaryHeader}>
              <View style={styles.healthIcon}>
                <MaterialDesignIcons
                  color={homeColors.primary}
                  name="clipboard-text-outline"
                  size={21}
                />
              </View>

              <View style={styles.healthHeaderCopy}>
                <Text style={styles.healthTitle}>
                  Résumé de ton cycle
                </Text>

                <Text style={styles.healthSubtitle}>
                  Quelques repères utiles à retenir
                </Text>
              </View>
            </View>

            <View style={styles.healthRows}>
              <HealthRow
                icon="calendar-range"
                label="Cycle moyen"
                value={`${data.averageCycleLength} jours`}
              />

              <HealthRow
                icon="water"
                label="Flux dominant"
                value={
                  dominantFlow?.label ??
                  '—'
                }
              />

              <HealthRow
                icon="heart-pulse"
                label="Symptôme fréquent"
                value={
                  data.symptoms[0]
                    ?.name ??
                  '—'
                }
              />

              <HealthRow
                icon="chart-bell-curve-cumulative"
                label="Régularité"
                value={
                  data.regularityLabel
                }
                last
              />
            </View>

            <View style={styles.medicalHint}>
              <MaterialDesignIcons
                color={homeColors.primary}
                name="information-outline"
                size={17}
              />

              <Text style={styles.medicalHintText}>
                Ces tendances peuvent t’aider à mieux décrire ton historique lors d’un rendez-vous médical.
              </Text>
            </View>
          </View>
          </>
          ) : (
            <PremiumLockedCard
              ctaLabel="Découvrir Premium"
              description="Analyse ton évolution sur 3, 6 et 12 mois : durée de cycle, symptômes, humeur et bien plus."
              onUpgrade={() => setPremiumVisible(true)}
              title="Statistiques avancées"
            />
          )}

          <HawaPremiumBottomSheet onClose={() => setPremiumVisible(false)} visible={premiumVisible} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ============================================================
   HEALTH ROW
============================================================ */

function HealthRow({
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
        styles.healthRow,
        last && styles.lastItem,
      ]}>
      <View style={styles.healthRowIcon}>
        <MaterialDesignIcons
          color={homeColors.primary}
          name={icon}
          size={17}
        />
      </View>

      <Text style={styles.healthRowLabel}>
        {label}
      </Text>

      <Text
        numberOfLines={1}
        style={styles.healthRowValue}>
        {value}
      </Text>
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

  /* ==========================================================
     HEADER
  ========================================================== */

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

  /* ==========================================================
     FILTERS
  ========================================================== */

  filters: {
    flexDirection: 'row',

    padding: 4,
    marginBottom: 14,

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

  filterText: {
    color: homeColors.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
  },

  filterTextActive: {
    color: homeColors.primary,
    fontWeight: '800',
  },

  /* ==========================================================
     CYCLE HERO
  ========================================================== */

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
    letterSpacing: 1.5,
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

  heroLabel: {
    marginTop: 2,

    color: homeColors.textSecondary,
    fontSize: 9.5,
  },

  regularityBadge: {
    maxWidth: 105,

    alignItems: 'center',

    paddingHorizontal: 10,
    paddingVertical: 9,

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 16,

    backgroundColor: '#F1EAFB',
  },

  regularityText: {
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

  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroMeta: {
    flex: 1,
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'center',
  },

  heroMetaIcon: {
    width: 36,
    height: 36,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 8,

    borderRadius: 12,

    backgroundColor: '#F0E9FB',
  },

  heroMetaLabel: {
    color: homeColors.textSecondary,
    fontSize: 8.5,
  },

  heroMetaValue: {
    marginTop: 2,

    color: homeColors.textPrimary,
    fontSize: 11.5,
    fontWeight: '800',
  },

  heroVerticalDivider: {
    width: 1,
    height: 38,

    marginHorizontal: 10,

    backgroundColor: '#E5DDEC',
  },

  /* ==========================================================
     SECTION
  ========================================================== */

  sectionHeading: {
    marginTop: 20,
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
    minHeight: 100,

    padding: 13,

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 20,

    backgroundColor: '#FFFFFF',
  },

  kpiCardWide: {
    width: '100%',
    minHeight: 75,

    flexDirection: 'row',
    alignItems: 'center',
  },

  kpiIcon: {
    width: 39,
    height: 39,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: '#F0E9FB',
  },

  kpiCopy: {
    flex: 1,
    minWidth: 0,

    marginTop: 9,
  },

  kpiValue: {
    color: homeColors.textPrimary,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },

  kpiLabel: {
    marginTop: 3,

    color: homeColors.textSecondary,
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

  /* ==========================================================
     CYCLE CHART
  ========================================================== */

  cycleSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginTop: 15,
    padding: 13,

    borderRadius: 18,

    backgroundColor: '#F8F4FC',
  },

  metricLabel: {
    color: homeColors.textSecondary,
    fontSize: 9.5,
  },

  metricValue: {
    marginTop: 2,

    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 21,
    fontWeight: '800',
  },

  rangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,

    paddingHorizontal: 10,
    paddingVertical: 7,

    borderRadius: 13,

    backgroundColor: '#EEE7FA',
  },

  rangeBadgeText: {
    color: homeColors.primary,
    fontSize: 10,
    fontWeight: '800',
  },

  cycleChart: {
    height: 160,

    flexDirection: 'row',
    alignItems: 'flex-end',

    gap: 4,

    marginTop: 16,
  },

  cycleBarColumn: {
    flex: 1,
    minWidth: 0,

    height: '100%',

    alignItems: 'center',
  },

  cycleBarValue: {
    color: homeColors.textPrimary,
    fontSize: 8,
    fontWeight: '800',
  },

  cycleBarTrack: {
    flex: 1,

    width: '58%',
    minWidth: 8,

    justifyContent: 'flex-end',

    overflow: 'hidden',

    marginVertical: 5,

    borderRadius: 7,

    backgroundColor: '#F0EAF7',
  },

  cycleBarFill: {
    width: '100%',

    borderRadius: 7,

    backgroundColor: '#8D6ED5',
  },

  cycleBarLabel: {
    color: homeColors.textSecondary,
    fontSize: 7,
  },

  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 14,
    padding: 10,

    borderRadius: 14,

    backgroundColor: '#F6F2FA',
  },

  insightIcon: {
    width: 30,
    height: 30,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 8,

    borderRadius: 10,

    backgroundColor: '#ECE4FA',
  },

  insightText: {
    flex: 1,

    color: homeColors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },

  /* ==========================================================
     FLOW
  ========================================================== */

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

  /* ==========================================================
     SYMPTOMS
  ========================================================== */

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
    minHeight: 140,

    padding: 13,

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.07)',
    borderRadius: 20,

    backgroundColor: '#FFFFFF',
  },

  wellnessIcon: {
    width: 40,
    height: 40,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,

    backgroundColor: '#F0E9FB',
  },

  wellnessValue: {
    marginTop: 11,

    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
  },

  wellnessLabel: {
    marginTop: 2,

    color: homeColors.textPrimary,
    fontSize: 10.5,
    fontWeight: '700',
  },

  wellnessDetail: {
    marginTop: 5,

    color: homeColors.textSecondary,
    fontSize: 8.5,
  },

  /* ==========================================================
     HEALTH SUMMARY
  ========================================================== */

  healthSummary: {
    ...homeShadow,

    marginTop: 14,
    padding: 15,

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 23,

    backgroundColor: '#FFFFFF',
  },

  healthSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  healthIcon: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,

    borderRadius: 14,

    backgroundColor: '#F0E9FB',
  },

  healthHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  healthTitle: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '800',
  },

  healthSubtitle: {
    marginTop: 2,

    color: homeColors.textSecondary,
    fontSize: 9.5,
  },

  healthRows: {
    marginTop: 12,
  },

  healthRow: {
    minHeight: 50,

    flexDirection: 'row',
    alignItems: 'center',

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECE6F1',
  },

  healthRowIcon: {
    width: 31,
    height: 31,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,

    borderRadius: 10,

    backgroundColor: '#F4EFFA',
  },

  healthRowLabel: {
    flex: 1,
    minWidth: 0,

    color: homeColors.textSecondary,
    fontSize: 10.5,
  },

  healthRowValue: {
    maxWidth: '48%',

    color: homeColors.textPrimary,
    fontSize: 11,
    fontWeight: '800',

    textAlign: 'right',
  },

  medicalHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 7,

    marginTop: 12,
    padding: 10,

    borderRadius: 14,

    backgroundColor: '#F6F2FA',
  },

  medicalHintText: {
    flex: 1,

    color: homeColors.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
  },
});

export default StatisticsScreen;