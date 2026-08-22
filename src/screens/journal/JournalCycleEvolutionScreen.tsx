import React, {
  useEffect,
  useMemo,
  useRef,
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
  getCyclePreferences,
} from '../../state/onboardingPreferences';

import {
  addDays,
  computeNextPeriod,
  cycleDayFor,
  formatShortDate,
  ovulationDayFor,
  phaseFor,
  periodStartForCycleContaining,
} from '../../utils/cycleMath';

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

const COLORS = {
  deepPurple: '#35205E',
  purple: '#6942BD',
  purpleStrong: '#5D35AE',

  lavender: '#EEE6F8',
  lavenderSoft: '#F8F4FC',
  lavenderBorder: '#E6DDEE',

  white: '#FFFFFF',

  text: '#30263F',
  secondary: '#71677D',
  muted: '#968CA0',

  green: '#5B8C70',
  greenSoft: '#EAF4EE',

  gold: '#B28D5F',
  goldSoft: '#F6F0E6',
};

/* ============================================================
   SCREEN
============================================================ */

export default function JournalCycleEvolutionScreen(): React.JSX.Element {
  const basics =
    getCyclePreferences();

  const today =
    new Date();

  const day =
    cycleDayFor(
      today,
      basics,
    );

  const phase =
    phaseFor(
      today,
      basics,
    );

  const ovulationDay =
    ovulationDayFor(
      basics.cycleDuration,
    );

  const cycleStart =
    periodStartForCycleContaining(
      today,
      basics,
    );

  const ovulation =
    addDays(
      cycleStart,
      ovulationDay - 1,
    );

  const fertileStart =
    addDays(
      ovulation,
      -5,
    );

  const fertileEnd =
    addDays(
      ovulation,
      1,
    );

  const nextPeriod =
    computeNextPeriod(
      basics,
      today,
    );

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
          basics.cycleDuration,
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
    basics.cycleDuration,
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
                    COLORS.purple
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
              Jour {day} sur{' '}
              {basics.cycleDuration}
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
                      basics.cycleDuration,
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
          value={formatShortDate(
            nextPeriod,
          )}
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
              COLORS.purple
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
            Ces repères sont calculés à partir de tes informations de cycle et restent des estimations.
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
  const config =
    variant === 'fertile'
      ? {
          background:
            '#EEF5EF',

          iconColor:
            COLORS.green,
        }
      : variant ===
          'ovulation'
        ? {
            background:
              COLORS.lavender,

            iconColor:
              COLORS.purple,
          }
        : {
            background:
              COLORS.goldSoft,

            iconColor:
              COLORS.gold,
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
          color="#AAA0B5"
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

const styles =
  StyleSheet.create({
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
        COLORS.purple,
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
        'rgba(255,255,255,0.55)',
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
        '#BBA4DF',

      borderRadius: 46,

      backgroundColor:
        COLORS.lavenderSoft,

      shadowColor:
        COLORS.purple,

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
        'rgba(105,66,189,0.08)',

      borderRadius: 33,

      backgroundColor:
        '#FFFFFF',
    },

    day: {
      color:
        COLORS.deepPurple,

      fontSize: 29,

      lineHeight: 32,

      fontWeight:
        '900',
    },

    dayLabel: {
      marginTop: 1,

      color:
        COLORS.secondary,

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
        COLORS.lavender,
    },

    phase: {
      flex: 1,

      marginLeft: 8,

      color:
        COLORS.deepPurple,

      fontSize: 17,

      lineHeight: 21,

      fontWeight:
        '900',
    },

    meta: {
      marginTop: 7,

      color:
        COLORS.secondary,

      fontSize: 11.5,

      fontWeight:
        '600',
    },

    phaseDescription: {
      marginTop: 5,

      color:
        COLORS.secondary,

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
        COLORS.muted,

      fontSize: 8.5,

      fontWeight:
        '700',
    },

    progressValue: {
      color:
        COLORS.purple,

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
        '#ECE5F3',
    },

    fill: {
      height: 8,

      borderRadius: 4,

      backgroundColor:
        COLORS.purple,
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
        '#EEE8F2',

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
        COLORS.secondary,

      fontSize: 10,

      fontWeight:
        '600',
    },

    markerValue: {
      marginTop: 4,

      color:
        COLORS.deepPurple,

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
        'rgba(105,66,189,0.10)',

      borderRadius: 20,

      backgroundColor:
        COLORS.lavender,

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
        COLORS.white,
    },

    infoCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    infoTitle: {
      color:
        COLORS.deepPurple,

      fontSize: 12,

      fontWeight:
        '800',
    },

    infoText: {
      marginTop: 4,

      color:
        '#5B506A',

      fontSize: 10,

      lineHeight: 15,

      fontWeight:
        '500',
    },
  });