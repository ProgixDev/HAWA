import {useToday} from '../../hooks/useToday';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  MaterialDesignIcons,
} from '@react-native-vector-icons/material-design-icons';

import {
  JournalScreenLayout,
  SectionCard,
} from '../../components/journal/JournalScreenLayout';

import {
  type CyclePreferences,
  getCycleObservationStartedAt,
  getCyclePreferences,
  getHasConfirmedCycleData,
  getRecordedPeriodHistory,
  hydrateCyclePreferences,
  subscribeCyclePreferences,
} from '../../state/onboardingPreferences';

import {
  computeCyclePredictionStatus,
  formatDateRange,
  formatShortDate,
  startOfDay,
  upcomingFertileWindow,
} from '../../utils/cycleMath';

import {
  resolveConceptionCurrentPhase,
  resolveConceptionCycleBasics,
} from '../../utils/conceptionStatisticsMath';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

/* ============================================================
   CONSTANTS
============================================================ */

const PHASE_LABEL = {
  menstruation: 'Règles',
  follicular: 'Phase folliculaire',
  fertile: 'Fenêtre fertile',
  ovulation: 'Ovulation estimée',
  luteal: 'Phase lutéale',
} as const;

// SEMANTIC — per-marker category accent (fertile window / ovulation / next
// period), matching the same "differentiated per-item accent" convention
// used for journal-category tints elsewhere in the app. Never theme-driven;
// only the generic structural chrome around them (below) is.
const MARKER_COLORS = {
  fertileBackground: '#EEF5EF',
  fertileIcon: '#5B8C70',
  ovulationBackground: '#EEE6F8',
  ovulationIcon: '#6942BD',
  periodBackground: '#F6F0E6',
  periodIcon: '#B28D5F',
};

/* ============================================================
   SCREEN
============================================================ */

// M19 - "Évolution du cycle" is a CURRENT-CYCLE snapshot (today's cycle day,
// phase and the estimated fertile window / next period), not a trend over a
// selectable period, so it has no 1/3/6/12-month selector (that lives on the
// Statistics screens); its window is always "the cycle in progress today".
// It only ever shows values derived from the user's own recorded periods and
// confirmed cycle settings: with no confirmed cycle data it shows an honest
// empty state instead of the onboarding fallback defaults (28-day cycle,
// "today minus 5 days" period start) dressed up as her data. The day/phase and
// the fertile window come from the SAME helpers as ConceiveDashboard /
// ConceiveStatisticsScreen / the reminders (M18), and the next-period row
// follows the prediction mode (exact date / estimated window / observing) like
// the Dashboard's tile instead of always claiming a single certain date.
// (Reachable from the Conceive dashboard's "Évolution du cycle" card.)
export default function JournalCycleEvolutionScreen(): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Live cycle data: re-read on every cycle-store notification so an edit
  // made elsewhere can never leave this screen stale.
  const [basics, setBasics] = useState(getCyclePreferences);
  const [hasConfirmedCycleData, setHasConfirmedCycleData] = useState(getHasConfirmedCycleData);
  useEffect(() => {
    let active = true;
    hydrateCyclePreferences().then(value => {
      if (active) {
        setBasics(value);
        setHasConfirmedCycleData(getHasConfirmedCycleData());
      }
    });
    const unsubscribe = subscribeCyclePreferences(() => {
      if (active) {
        setBasics(getCyclePreferences());
        setHasConfirmedCycleData(getHasConfirmedCycleData());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (!hasConfirmedCycleData) {
    return (
      <JournalScreenLayout
        heroLabel="Ton cycle aujourd’hui"
        heroSource={require('../../assets/images/conception-journal/cycle-evolution.png')}
        hideJournalHeader
        icon="chart-donut"
        title="Évolution du cycle">
        <SectionCard title="Phase actuelle">
          <View style={styles.info}>
            <View style={styles.infoIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="calendar-question" size={20} />
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Pas encore assez de données</Text>
              <Text style={styles.infoText}>
                Renseigne le début de tes dernières règles pour voir l’évolution de ton cycle.
              </Text>
            </View>
          </View>
        </SectionCard>
      </JournalScreenLayout>
    );
  }

  return <CycleEvolutionContent basics={basics} />;
}

function CycleEvolutionContent({basics}: {basics: CyclePreferences}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. "Today's journal" therefore
  // shows the CURRENT day, never the day the screen opened.
  const {today} = useToday();

  const recordedPeriods = getRecordedPeriodHistory();
  const predictionStatus = computeCyclePredictionStatus(
    basics,
    basics.regularity,
    recordedPeriods.map(record => new Date(`${record.startDate}T12:00:00`)),
    getCycleObservationStartedAt(),
    startOfDay(today),
  );
  // ONE effective cycle length (observed average in 'exact' mode) - see
  // resolveConceptionCycleBasics().
  const effectiveBasics = resolveConceptionCycleBasics(basics, predictionStatus);
  const cycleLength = effectiveBasics.cycleDuration;

  const {cycleDay: day, phase} = resolveConceptionCurrentPhase(
    basics,
    predictionStatus,
    recordedPeriods,
    startOfDay(today),
  );

  // ONE coherent fertile window (start <= ovulation <= end), same helper as
  // ConceiveStatisticsScreen. PRODUCT DECISION REQUIRED (see M18 note in
  // conceptionStatisticsMath.ts): for an irregular cycle this still shows a
  // single conception-oriented estimate, like Dashboard/Calendar/Statistics.
  const {start: fertileStart, end: fertileEnd, ovulation} = upcomingFertileWindow(effectiveBasics, startOfDay(today));

  const nextPeriodValue = (() => {
    if (predictionStatus.mode === 'exact') {
      return formatShortDate(predictionStatus.date);
    }
    if (predictionStatus.mode === 'window') {
      return predictionStatus.isLate
        ? 'Règles en retard'
        : formatDateRange(predictionStatus.windowStart, predictionStatus.windowEnd);
    }
    return 'Observation en cours';
  })();

  /* ==========================================================
     ANIMATIONS
  ========================================================== */

  const progress =
    useRef(
      new Animated.Value(0),
    ).current;

  const circleEntrance =
    useRef(
      new Animated.Value(0),
    ).current;

  const pulse =
    useRef(
      new Animated.Value(0),
    ).current;

  const glow =
    useRef(
      new Animated.Value(0),
    ).current;

  const contentEntrance =
    useRef(
      new Animated.Value(0),
    ).current;

  useEffect(() => {
    const cycleProgress =
      Math.min(
        day /
          cycleLength,
        1,
      );

    Animated.parallel([
      Animated.timing(
        progress,
        {
          toValue:
            cycleProgress,

          duration: 850,

          easing:
            Easing.out(
              Easing.cubic,
            ),

          useNativeDriver:
            false,
        },
      ),

      Animated.spring(
        circleEntrance,
        {
          toValue: 1,

          damping: 13,
          stiffness: 115,
          mass: 0.8,

          useNativeDriver:
            true,
        },
      ),

      Animated.timing(
        contentEntrance,
        {
          toValue: 1,

          duration: 620,

          delay: 130,

          easing:
            Easing.out(
              Easing.cubic,
            ),

          useNativeDriver:
            true,
        },
      ),
    ]).start();

    const pulseLoop =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            pulse,
            {
              toValue: 1,

              duration: 1700,

              easing:
                Easing.inOut(
                  Easing.ease,
                ),

              useNativeDriver:
                true,
            },
          ),

          Animated.timing(
            pulse,
            {
              toValue: 0,

              duration: 1700,

              easing:
                Easing.inOut(
                  Easing.ease,
                ),

              useNativeDriver:
                true,
            },
          ),
        ]),
      );

    const glowLoop =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            glow,
            {
              toValue: 1,

              duration: 1900,

              easing:
                Easing.inOut(
                  Easing.ease,
                ),

              useNativeDriver:
                true,
            },
          ),

          Animated.timing(
            glow,
            {
              toValue: 0,

              duration: 1900,

              easing:
                Easing.inOut(
                  Easing.ease,
                ),

              useNativeDriver:
                true,
            },
          ),
        ]),
      );

    pulseLoop.start();
    glowLoop.start();

    return () => {
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, [
    cycleLength,
    circleEntrance,
    contentEntrance,
    day,
    glow,
    progress,
    pulse,
  ]);

  /* ==========================================================
     DERIVED ANIMATIONS
  ========================================================== */

  const circleScale =
    circleEntrance.interpolate(
      {
        inputRange:
          [0, 1],

        outputRange:
          [0.72, 1],
      },
    );

  const circleRotate =
    circleEntrance.interpolate(
      {
        inputRange:
          [0, 1],

        outputRange:
          ['-18deg', '0deg'],
      },
    );

  const pulseScale =
    pulse.interpolate(
      {
        inputRange:
          [0, 1],

        outputRange:
          [1, 1.04],
      },
    );

  const glowScale =
    glow.interpolate(
      {
        inputRange:
          [0, 1],

        outputRange:
          [0.92, 1.12],
      },
    );

  const glowOpacity =
    glow.interpolate(
      {
        inputRange:
          [0, 1],

        outputRange:
          [0.18, 0.35],
      },
    );

  const contentTranslateY =
    contentEntrance.interpolate(
      {
        inputRange:
          [0, 1],

        outputRange:
          [12, 0],
      },
    );

  const phaseDescription =
    useMemo(() => {
      switch (phase) {
        case 'menstruation':
          return 'Ton cycle est actuellement dans la phase des règles.';

        case 'follicular':
          return 'Ton corps se prépare progressivement à l’ovulation.';

        case 'fertile':
          return 'Tu es dans ta fenêtre fertile estimée.';

        case 'ovulation':
          return 'L’ovulation est estimée autour de cette période.';

        case 'luteal':
          return 'Ton cycle est dans sa phase après ovulation.';

        default:
          return '';
      }
    }, [phase]);

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <JournalScreenLayout
      heroLabel="Ton cycle aujourd’hui"
      heroSource={require('../../assets/images/conception-journal/cycle-evolution.png')}
      hideJournalHeader
      icon="chart-donut"
      title="Évolution du cycle">

      {/* =====================================================
          CURRENT PHASE
      ===================================================== */}

      <SectionCard title="Phase actuelle">

        <View
          style={
            styles.status
          }>

          {/* ================================================
              ANIMATED CIRCLE
          ================================================ */}

          <View
            style={
              styles.circleWrapper
            }>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.circleGlow,

                {
                  opacity:
                    glowOpacity,

                  transform: [
                    {
                      scale:
                        glowScale,
                    },
                  ],
                },
              ]}
            />

            <Animated.View
              style={[
                styles.ringOuter,

                {
                  transform: [
                    {
                      scale:
                        circleScale,
                    },

                    {
                      rotate:
                        circleRotate,
                    },
                  ],
                },
              ]}>

              <Animated.View
                style={[
                  styles.ring,

                  {
                    transform: [
                      {
                        scale:
                          pulseScale,
                      },
                    ],
                  },
                ]}>

                <View
                  style={
                    styles.ringInner
                  }>

                  <Text
                    style={
                      styles.day
                    }>
                    {day}
                  </Text>

                  <Text
                    style={
                      styles.dayLabel
                    }>
                    jour
                  </Text>
                </View>
              </Animated.View>
            </Animated.View>
          </View>

          {/* ================================================
              PHASE INFO
          ================================================ */}

          <Animated.View
            style={[
              styles.copy,

              {
                opacity:
                  contentEntrance,

                transform: [
                  {
                    translateY:
                      contentTranslateY,
                  },
                ],
              },
            ]}>

            <View
              style={
                styles.phaseHeader
              }>

              <View
                style={
                  styles.phaseIcon
                }>
                <MaterialDesignIcons
                  color={
                    theme.colors.primary
                  }
                  name="calendar-heart"
                  size={18}
                />
              </View>

              <Text
                style={
                  styles.phase
                }>
                {
                  PHASE_LABEL[
                    phase
                  ]
                }
              </Text>
            </View>

            <Text
              style={
                styles.meta
              }>
              {day <= cycleLength
                ? `Jour ${day} sur ${cycleLength}`
                : `Jour ${day} · au-delà de ${cycleLength} jours`}
            </Text>

            <Text
              style={
                styles.phaseDescription
              }>
              {
                phaseDescription
              }
            </Text>

            {/* PROGRESS */}

            <View
              style={
                styles.progressHeader
              }>

              <Text
                style={
                  styles.progressLabel
                }>
                Progression du cycle
              </Text>

              <Text
                style={
                  styles.progressValue
                }>
                {Math.round(
                  Math.min(
                    day /
                      cycleLength,
                    1,
                  ) * 100,
                )}
                %
              </Text>
            </View>

            <View
              style={
                styles.track
              }>

              <Animated.View
                style={[
                  styles.fill,

                  {
                    width:
                      progress.interpolate(
                        {
                          inputRange:
                            [0, 1],

                          outputRange:
                            [
                              '0%',
                              '100%',
                            ],
                        },
                      ),
                  },
                ]}
              />
            </View>
          </Animated.View>
        </View>
      </SectionCard>

      {/* =====================================================
          CYCLE MARKERS
      ===================================================== */}

      <SectionCard title="Repères du cycle">

        <Marker
          icon="flower-pollen-outline"
          label="Fenêtre fertile estimée"
          value={`${formatShortDate(
            fertileStart,
          )} – ${formatShortDate(
            fertileEnd,
          )}`}
          variant="fertile"
        />

        <Marker
          icon="circle-double"
          label="Ovulation estimée"
          value={formatShortDate(
            ovulation,
          )}
          variant="ovulation"
        />

        <Marker
          icon="calendar-heart"
          label="Prochaines règles estimées"
          value={nextPeriodValue}
          variant="period"
          last
        />
      </SectionCard>

      {/* =====================================================
          INFORMATION
      ===================================================== */}

      <View
        style={
          styles.info
        }>

        <View
          style={
            styles.infoIcon
          }>

          <MaterialDesignIcons
            color={
              theme.colors.primary
            }
            name="information-outline"
            size={20}
          />
        </View>

        <View
          style={
            styles.infoCopy
          }>

          <Text
            style={
              styles.infoTitle
            }>
            À propos des estimations
          </Text>

          <Text
            style={
              styles.infoText
            }>
            Ces repères sont calculés à partir de tes règles enregistrées et restent des estimations.
          </Text>
        </View>
      </View>
    </JournalScreenLayout>
  );
}

/* ============================================================
   MARKER
============================================================ */

function Marker({
  icon,
  label,
  value,
  variant,
  last = false,
}: {
  icon: string;
  label: string;
  value: string;
  variant:
    | 'fertile'
    | 'ovulation'
    | 'period';
  last?: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const config =
    variant === 'fertile'
      ? {
          background:
            MARKER_COLORS.fertileBackground,

          iconColor:
            MARKER_COLORS.fertileIcon,
        }
      : variant ===
          'ovulation'
        ? {
            background:
              MARKER_COLORS.ovulationBackground,

            iconColor:
              MARKER_COLORS.ovulationIcon,
          }
        : {
            background:
              MARKER_COLORS.periodBackground,

            iconColor:
              MARKER_COLORS.periodIcon,
          };

  return (
    <View
      style={[
        styles.marker,

        last &&
          styles.markerLast,
      ]}>

      <View
        style={[
          styles.markerIcon,

          {
            backgroundColor:
              config.background,
          },
        ]}>

        <MaterialDesignIcons
          color={
            config.iconColor
          }
          name={
            icon as never
          }
          size={20}
        />
      </View>

      <View
        style={
          styles.markerCopy
        }>

        <Text
          style={
            styles.markerLabel
          }>
          {label}
        </Text>

        <Text
          style={
            styles.markerValue
          }>
          {value}
        </Text>
      </View>

      <View
        style={
          styles.markerArrow
        }>

        <MaterialDesignIcons
          color={theme.colors.textMuted}
          name="chevron-right"
          size={19}
        />
      </View>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    /* ========================================================
       PHASE CARD
    ======================================================== */

    status: {
      flexDirection:
        'row',

      alignItems:
        'center',

      minHeight: 155,

      paddingVertical: 5,
    },

    circleWrapper: {
      position:
        'relative',

      width: 112,
      height: 112,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    circleGlow: {
      position:
        'absolute',

      width: 104,
      height: 104,

      borderRadius: 52,

      backgroundColor:
        theme.colors.primary,
    },

    ringOuter: {
      width: 96,
      height: 96,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 48,

      backgroundColor:
        withAlpha(theme.colors.surface, 0.55),
    },

    ring: {
      width: 92,
      height: 92,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 9,

      borderColor:
        withAlpha(theme.colors.primary, 0.35),

      borderRadius: 46,

      backgroundColor:
        theme.colors.surfaceSecondary,

      shadowColor:
        theme.colors.primary,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.13,

      shadowRadius: 8,

      elevation: 3,
    },

    ringInner: {
      width: 65,
      height: 65,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.08),

      borderRadius: 33,

      // Was a fixed pure white, always fine in Light (AWA's own
      // theme.colors.surface is that exact white there, so this is
      // byte-identical) but wrong in spirit: day/dayLabel below use
      // theme.colors.accent/textSecondary, which are LIGHT-toned in every
      // Dark variant (designed to sit on theme.colors.surface, a dark
      // surface there) — pinning this circle to white broke that pairing.
      // Using the same surface token they're already paired with
      // everywhere else fixes Dark/True Black with zero Light-mode change.
      backgroundColor:
        theme.colors.surface,
    },

    day: {
      color:
        theme.colors.accent,

      fontSize: 29,

      lineHeight: 32,

      fontWeight:
        '900',
    },

    dayLabel: {
      marginTop: 1,

      color:
        theme.colors.textSecondary,

      fontSize: 9,

      fontWeight:
        '600',

      textTransform:
        'uppercase',

      letterSpacing: 0.7,
    },

    /* ========================================================
       PHASE TEXT
    ======================================================== */

    copy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 15,
    },

    phaseHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    phaseIcon: {
      width: 32,
      height: 32,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 11,

      backgroundColor:
        theme.colors.primarySoft,
    },

    phase: {
      flex: 1,

      marginLeft: 8,

      color:
        theme.colors.accent,

      fontSize: 17,

      lineHeight: 21,

      fontWeight:
        '900',
    },

    meta: {
      marginTop: 7,

      color:
        theme.colors.textSecondary,

      fontSize: 11.5,

      fontWeight:
        '600',
    },

    phaseDescription: {
      marginTop: 5,

      color:
        theme.colors.textSecondary,

      fontSize: 9.5,

      lineHeight: 14,
    },

    /* ========================================================
       PROGRESS
    ======================================================== */

    progressHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginTop: 12,
    },

    progressLabel: {
      color:
        theme.colors.textMuted,

      fontSize: 8.5,

      fontWeight:
        '700',
    },

    progressValue: {
      color:
        theme.colors.primary,

      fontSize: 9,

      fontWeight:
        '900',
    },

    track: {
      height: 8,

      marginTop: 6,

      overflow:
        'hidden',

      borderRadius: 4,

      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    fill: {
      height: 8,

      borderRadius: 4,

      backgroundColor:
        theme.colors.primary,
    },

    /* ========================================================
       MARKERS
    ======================================================== */

    marker: {
      minHeight: 70,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderBottomWidth: 1,

      borderBottomColor:
        theme.colors.border,

      paddingVertical: 9,
    },

    markerLast: {
      borderBottomWidth: 0,
    },

    markerIcon: {
      width: 42,
      height: 42,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 14,
    },

    markerCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 11,
    },

    markerLabel: {
      color:
        theme.colors.textSecondary,

      fontSize: 10,

      fontWeight:
        '600',
    },

    markerValue: {
      marginTop: 4,

      color:
        theme.colors.accent,

      fontSize: 13,

      fontWeight:
        '900',
    },

    markerArrow: {
      width: 28,
      height: 28,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    /* ========================================================
       INFO
    ======================================================== */

    info: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.10),

      borderRadius: 20,

      backgroundColor:
        theme.colors.primarySoft,

      padding: 13,
    },

    infoIcon: {
      width: 40,
      height: 40,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 13,

      backgroundColor:
        theme.colors.surface,
    },

    infoCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    infoTitle: {
      color:
        theme.colors.accent,

      fontSize: 12,

      fontWeight:
        '800',
    },

    infoText: {
      marginTop: 4,

      color:
        theme.colors.textSecondary,

      fontSize: 10,

      lineHeight: 15,

      fontWeight:
        '500',
    },
  });
}