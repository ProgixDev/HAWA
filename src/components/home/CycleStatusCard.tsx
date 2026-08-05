import React, {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';

export type CyclePhase =
  | 'menstruation'
  | 'follicular'
  | 'fertile'
  | 'ovulation'
  | 'luteal'
  | 'pregnancy'
  | 'postpartum';

export type CycleStatusCardProps = {
  currentDay?: number | null;
  cycleLength?: number | null;
  phase?: CyclePhase | null;
  onPress?: () => void;
};

type PhaseConfig = {
  label: string;
  activeColor: string;
  centerColor: string;
  symbol: string;
};

const PHASES: Record<CyclePhase, PhaseConfig> = {
  menstruation: {
    label: 'Phase menstruelle',
    activeColor: '#D97A83',
    centerColor: '#F8DCDD',
    symbol: '✿',
  },

  follicular: {
    label: 'Phase folliculaire',
    activeColor: colors.muted,
    centerColor: '#EFE6FA',
    symbol: '❀',
  },

  fertile: {
    label: 'Fenêtre fertile',
    activeColor: '#8B6FD1',
    centerColor: '#EFE6FA',
    symbol: '✤',
  },

  ovulation: {
    label: 'Ovulation',
    activeColor: colors.primary,
    centerColor: '#EFE6FA',
    symbol: '✿',
  },

  luteal: {
    label: 'Phase lutéale',
    activeColor: '#D8B05A',
    centerColor: '#F7EEDC',
    symbol: '✦',
  },

  pregnancy: {
    label: 'Grossesse',
    activeColor: '#B97B88',
    centerColor: '#F8E4E6',
    symbol: '♡',
  },

  postpartum: {
    label: 'Post-partum',
    activeColor: '#9C8AC2',
    centerColor: '#EFE6FA',
    symbol: '❦',
  },
};

const SEGMENT_COUNT = 36;

const LUTEAL_BACKGROUND = require('../../assets/images/luteal-card-background.png');

function getPhaseDescription(phase: CyclePhase): string {
  switch (phase) {
    case 'menstruation':
      return 'Ton corps élimine la muqueuse utérine.';
    case 'follicular':
      return 'Ton corps se prépare progressivement à l’ovulation.';
    case 'fertile':
      return 'La probabilité de conception est actuellement élevée.';
    case 'ovulation':
      return 'L’ovulation est prévue aujourd’hui.';
    case 'luteal':
      return 'Ton corps se prépare à un nouveau cycle.';
    case 'pregnancy':
      return 'Ton corps accompagne progressivement la grossesse.';
    case 'postpartum':
      return 'Ton corps poursuit doucement sa récupération.';
  }
}

function CycleStatusCardComponent({
  currentDay,
  cycleLength,
  phase,
  onPress,
}: CycleStatusCardProps): React.JSX.Element {
  const cardEntrance = useRef(new Animated.Value(0)).current;
  const textEntrance = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const flowerEntrance = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const descriptionOpacity = useRef(new Animated.Value(0)).current;

  const [reduceMotion, setReduceMotion] = useState(false);

  const hasData =
    typeof currentDay === 'number' &&
    Number.isFinite(currentDay) &&
    typeof cycleLength === 'number' &&
    Number.isFinite(cycleLength) &&
    cycleLength > 0 &&
    !!phase;

  const safeCycleLength = Math.max(cycleLength ?? 0, 1);
  const safeCurrentDay = Math.max(currentDay ?? 0, 0);

  const progress = hasData
    ? Math.min(
        Math.max(safeCurrentDay / safeCycleLength, 0),
        1,
      )
    : 0;

  const config = PHASES[phase ?? 'follicular'];
  const phaseDescription = useMemo(
    () => phase ? getPhaseDescription(phase) : '',
    [phase],
  );

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    cardEntrance.stopAnimation();
    textEntrance.stopAnimation();
    flowerEntrance.stopAnimation();
    progressAnimation.stopAnimation();

    if (reduceMotion) {
      cardEntrance.setValue(1);
      flowerEntrance.setValue(1);
      progressAnimation.setValue(progress);

      Animated.timing(textEntrance, {
        duration: 140,
        toValue: 1,
        useNativeDriver: true,
      }).start();

      return () => {
        textEntrance.stopAnimation();
      };
    }

    cardEntrance.setValue(0);
    textEntrance.setValue(0);
    flowerEntrance.setValue(0);
    progressAnimation.setValue(0);

    const animation = Animated.parallel([
      Animated.timing(cardEntrance, {
        duration: 620,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),

      Animated.timing(textEntrance, {
        delay: 130,
        duration: 470,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),

      Animated.timing(progressAnimation, {
        delay: 180,
        duration: 720,
        easing: Easing.out(Easing.cubic),
        toValue: progress,
        useNativeDriver: true,
      }),

      Animated.spring(flowerEntrance, {
        delay: 360,
        bounciness: 2,
        speed: 15,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [
    cardEntrance,
    flowerEntrance,
    progress,
    progressAnimation,
    reduceMotion,
    textEntrance,
  ]);

  useEffect(() => {
    descriptionOpacity.stopAnimation();
    descriptionOpacity.setValue(reduceMotion ? 1 : 0);
    Animated.timing(descriptionOpacity, {
      toValue: 1,
      duration: reduceMotion ? 0 : 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    return () => descriptionOpacity.stopAnimation();
  }, [descriptionOpacity, phase, reduceMotion]);

  const segments = useMemo(
    () =>
      Array.from(
        {length: SEGMENT_COUNT},
        (_, index) => index,
      ),
    [],
  );

  const pressIn = () => {
    Animated.timing(pressScale, {
      duration: reduceMotion ? 70 : 110,
      toValue: reduceMotion ? 1 : 0.98,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(pressScale, {
      bounciness: reduceMotion ? 0 : 2,
      speed: 22,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const accessibilityLabel = hasData
    ? `Statut actuel, ${config.label}, jour ${safeCurrentDay} sur ${safeCycleLength}. ${phaseDescription}`
    : 'Statut actuel, ajoute tes dernières règles pour commencer ton suivi';

  const backgroundSource =
    phase === 'luteal'
      ? LUTEAL_BACKGROUND
      : undefined;

  return (
    <Animated.View
      style={{
        opacity: cardEntrance,
        transform: [
          {
            translateY: cardEntrance.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
          {
            scale: pressScale,
          },
        ],
      }}>
      <Pressable
        accessibilityHint={
          onPress
            ? 'Ouvre le détail du cycle'
            : undefined
        }
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={onPress ? 'button' : undefined}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.card}>
        <ImageBackground
          source={backgroundSource}
          resizeMode="cover"
          imageStyle={styles.backgroundImage}
          style={styles.backgroundWrapper}>
          {phase !== 'luteal' && (
            <View
              pointerEvents="none"
              style={styles.botanicalDecoration}>
              <View style={[styles.stem, styles.stemOne]} />

              <View style={[styles.leaf, styles.leafOne]} />

              <View style={[styles.leaf, styles.leafTwo]} />

              <View style={[styles.leaf, styles.leafThree]} />
            </View>
          )}

          <Animated.View
            style={[
              styles.copy,
              {
                opacity: textEntrance,
              },
            ]}>
            <Text
              allowFontScaling
              style={styles.eyebrow}>
              Statut actuel
            </Text>

            {hasData ? (
              <>
                <Text
                  allowFontScaling
                  numberOfLines={2}
                  style={styles.phase}>
                  {config.label}
                </Text>

                <Text
                  allowFontScaling
                  style={styles.cycleDay}>
                  Jour {safeCurrentDay} sur{' '}
                  {safeCycleLength}
                </Text>

                <Animated.Text
                  allowFontScaling
                  numberOfLines={3}
                  style={[
                    styles.phaseDescription,
                    {opacity: descriptionOpacity},
                  ]}>
                  {phaseDescription}
                </Animated.Text>
              </>
            ) : (
              <Text
                allowFontScaling
                style={styles.emptyText}>
                Ajoute tes dernières règles pour commencer
                ton suivi.
              </Text>
            )}
          </Animated.View>

          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.ring}>
            {segments.map(index => {
              const start = index / SEGMENT_COUNT;

              const end = Math.min(
                (index + 0.85) / SEGMENT_COUNT,
                1,
              );

              const opacity =
                progressAnimation.interpolate({
                  inputRange:
                    index === 0
                      ? [0, end]
                      : [start - 0.001, start, end],

                  outputRange:
                    index === 0
                      ? [0, 1]
                      : [0, 0.12, 1],

                  extrapolate: 'clamp',
                });

              return (
                <View
                  key={index}
                  style={[
                    styles.segmentOrbit,
                    {
                      transform: [
                        {
                          rotate: `${
                            index *
                            (360 / SEGMENT_COUNT)
                          }deg`,
                        },
                      ],
                    },
                  ]}>
                  <View style={styles.trackSegment} />

                  <Animated.View
                    style={[
                      styles.activeSegment,
                      {
                        backgroundColor:
                          config.activeColor,
                        opacity,
                      },
                    ]}
                  />
                </View>
              );
            })}

            <View
              style={[
                styles.ringCenter,
                {
                  backgroundColor:
                    config.centerColor,
                },
              ]}>
              <Animated.Text
                style={[
                  styles.flower,
                  {
                    color: config.activeColor,
                    opacity: flowerEntrance,
                    transform: [
                      {
                        scale:
                          flowerEntrance.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                          }),
                      },
                    ],
                  },
                ]}>
                {config.symbol}
              </Animated.Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 166,
    overflow: 'hidden',

    borderWidth: 1,
    borderColor: 'rgba(105, 73, 190, 0.12)',
    borderRadius: 27,

    backgroundColor: '#FFFDF9',

    shadowColor: '#28166F',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.09,
    shadowRadius: 12,

    elevation: 3,
  },

  backgroundWrapper: {
    minHeight: 166,
    flexDirection: 'row',
    alignItems: 'center',

    paddingLeft: spacing.xl,
    paddingRight: spacing.lg,
  },

  backgroundImage: {
    borderRadius: 27,
  },

  botanicalDecoration: {
    position: 'absolute',
    left: -5,
    bottom: 1,

    width: 53,
    height: 105,

    opacity: 0.36,
  },

  stem: {
    position: 'absolute',

    width: 1.5,
    height: 86,

    borderRadius: 1,
    backgroundColor: colors.muted,
  },

  stemOne: {
    left: 18,
    bottom: -8,

    transform: [
      {
        rotate: '-12deg',
      },
    ],
  },

  leaf: {
    position: 'absolute',

    width: 19,
    height: 8,

    borderRadius: 10,
    backgroundColor: '#CBBEE3',
  },

  leafOne: {
    left: 16,
    bottom: 29,

    transform: [
      {
        rotate: '-34deg',
      },
    ],
  },

  leafTwo: {
    left: 5,
    bottom: 50,

    transform: [
      {
        rotate: '28deg',
      },
    ],
  },

  leafThree: {
    left: 20,
    bottom: 69,

    transform: [
      {
        rotate: '-36deg',
      },
    ],
  },

  copy: {
    flex: 1,
    zIndex: 1,

    paddingRight: spacing.sm,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },

  phase: {
    marginTop: 12,

    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 23,
    fontWeight: '600',
    lineHeight: 28,
  },

  cycleDay: {
    marginTop: 9,

    color: '#655A8D',
    fontSize: 15,
    fontWeight: '600',
  },

  phaseDescription: {
    maxWidth: 215,
    marginTop: 6,

    color: '#7A6F98',
    fontSize: 13,
    lineHeight: 18,
  },

  emptyText: {
    maxWidth: 190,
    marginTop: 11,

    color: '#655A8D',
    fontSize: 14,
    lineHeight: 20,
  },

  ring: {
    width: 102,
    height: 102,

    alignItems: 'center',
    justifyContent: 'center',
  },

  segmentOrbit: {
    position: 'absolute',

    width: 102,
    height: 102,

    alignItems: 'center',
  },

  trackSegment: {
    position: 'absolute',
    top: 0,

    width: 5,
    height: 12,

    borderRadius: 3,
    backgroundColor: '#F5DDDC',
  },

  activeSegment: {
    position: 'absolute',
    top: 0,

    width: 5,
    height: 12,

    borderRadius: 3,
  },

  ringCenter: {
    width: 66,
    height: 66,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 33,
  },

  flower: {
    fontSize: 29,
    lineHeight: 34,
  },
});

export const CycleStatusCard = memo(
  CycleStatusCardComponent,
);
