import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  TOP_SPACING_EXTRA,
  TOP_SPACING_EXTRA_COMPACT,
} from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const COLORS = {
  backgroundTop: '#D8CCE5',
  backgroundMiddle: '#C8B7D9',
  backgroundBottom: '#B8A2CC',

  purple: '#543177',
  purpleDeep: '#342047',
  purpleDark: '#291B39',

  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.82)',

  text: '#2D2037',
  textSecondary: '#5E5068',

  border: 'rgba(255,255,255,0.34)',
};

function WelcomeScreen({navigation}: Props): React.JSX.Element {
  const {height, width} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const compact = height < 760 || width < 360;

  const buttonWidth = Math.min(
    width * (compact ? 0.84 : 0.8),
    350,
  );

  const bottomSpacing = Math.max(
    insets.bottom + 18,
    Math.min(height * 0.045, 38),
  );

  /* ============================================================
     ANIMATIONS
  ============================================================ */

  const titleAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const featureOneAnim = useRef(new Animated.Value(0)).current;
  const featureTwoAnim = useRef(new Animated.Value(0)).current;
  const featureThreeAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.stagger(90, [
        Animated.timing(featureOneAnim, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(featureTwoAnim, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(featureThreeAnim, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(actionsAnim, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const iconLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(iconAnim, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    glowLoop.start();
    iconLoop.start();

    return () => {
      glowLoop.stop();
      iconLoop.stop();
    };
  }, [
    actionsAnim,
    contentAnim,
    featureOneAnim,
    featureThreeAnim,
    featureTwoAnim,
    glowAnim,
    iconAnim,
    titleAnim,
  ]);

  const titleStyle = {
    opacity: titleAnim,

    transform: [
      {
        translateY: titleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const contentStyle = {
    opacity: contentAnim,

    transform: [
      {
        translateY: contentAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  const actionsStyle = {
    opacity: actionsAnim,

    transform: [
      {
        translateY: actionsAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const glowStyle = {
    opacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.45, 0.85],
    }),

    transform: [
      {
        scale: glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08],
        }),
      },
    ],
  };

  const featureOneStyle = {
    opacity: featureOneAnim,
    transform: [
      {
        translateY: featureOneAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  const featureTwoStyle = {
    opacity: featureTwoAnim,
    transform: [
      {
        translateY: featureTwoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  const featureThreeStyle = {
    opacity: featureThreeAnim,
    transform: [
      {
        translateY: featureThreeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  const iconStyle = {
    transform: [
      {
        translateY: iconAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -2],
        }),
      },
      {
        scale: iconAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.035],
        }),
      },
    ],
  };

  return (
    <LinearGradient
      colors={[
        COLORS.backgroundTop,
        COLORS.backgroundMiddle,
        COLORS.backgroundBottom,
      ]}
      locations={[0, 0.5, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="dark-content"
        translucent
      />

      {/* ========================================================
          PREMIUM BACKGROUND DEPTH
      ======================================================== */}

      <View
        pointerEvents="none"
        style={styles.backgroundDecoration}>
        <Animated.View
          style={[
            styles.glowTop,
            glowStyle,
          ]}
        />

        <View style={styles.glowLeft} />

        <View style={styles.glowBottom} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.page,
            {
              paddingTop:
                Math.max(insets.top, 8) +
                (compact
                  ? TOP_SPACING_EXTRA_COMPACT
                  : TOP_SPACING_EXTRA),
            },
          ]}>
          {/* ====================================================
              HERO
          ===================================================== */}

          <Animated.View
            style={[
              styles.hero,
              compact && styles.heroCompact,
              titleStyle,
            ]}>
            <Text
              style={[
                styles.welcomeTitle,
                compact &&
                  styles.welcomeTitleCompact,
              ]}>
              Bienvenue
            </Text>

            <View style={styles.brandLine}>
              <Text
                style={[
                  styles.chez,
                  compact && styles.chezCompact,
                ]}>
                chez
              </Text>

              <Text
                style={[
                  styles.awa,
                  compact && styles.awaCompact,
                ]}>
                {' '}
                AWA
              </Text>
            </View>

            <View style={styles.brandDivider}>
              <View style={styles.brandDividerLine} />
              <View style={styles.brandDividerDot} />
              <View style={styles.brandDividerLine} />
            </View>

            <Text
              style={[
                styles.subtitle,
                compact && styles.subtitleCompact,
              ]}>
              Un espace personnel pour suivre ton cycle,
              comprendre ton corps et avancer avec sérénité.
            </Text>
          </Animated.View>

          {/* ====================================================
              PREMIUM CONTENT CARD
          ===================================================== */}

          <Animated.View
            style={[
              styles.premiumCard,
              compact && styles.premiumCardCompact,
              contentStyle,
            ]}>
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.88)',
                'rgba(247,243,250,0.72)',
              ]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.premiumCardInner}>
              <View pointerEvents="none" style={styles.cardGlow} />
              <View pointerEvents="none" style={styles.cardAccentLine} />

              <View style={styles.cardHeader}>
                <Animated.View style={iconStyle}>
                  <LinearGradient
                    colors={['#F2EBF8', '#E4D8EE']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.cardIcon}>
                    <MaterialDesignIcons
                      color={COLORS.purple}
                      name="shield-lock-outline"
                      size={22}
                    />
                  </LinearGradient>
                </Animated.View>

                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.cardTitle}>Ton espace AWA</Text>
                  <Text style={styles.cardDescription}>
                    Un espace personnel, simple et confidentiel.
                  </Text>
                </View>

                <View style={styles.cardStatusBadge}>
                  <View style={styles.cardStatusDot} />
                  <Text style={styles.cardStatusText}>Privé</Text>
                </View>
              </View>

              <View style={styles.featureGrid}>
                <Animated.View style={[styles.featureTile, featureOneStyle]}>
                  <View style={styles.featureIcon}>
                    <MaterialDesignIcons
                      color={COLORS.purple}
                      name="calendar-month-outline"
                      size={18}
                    />
                  </View>
                  <Text style={styles.featureTitle}>Suivi</Text>
                  <Text style={styles.featureText}>Personnalisé</Text>
                </Animated.View>

                <Animated.View style={[styles.featureTile, featureTwoStyle]}>
                  <View style={styles.featureIcon}>
                    <MaterialDesignIcons
                      color={COLORS.purple}
                      name="lock-outline"
                      size={18}
                    />
                  </View>
                  <Text style={styles.featureTitle}>Données</Text>
                  <Text style={styles.featureText}>Protégées</Text>
                </Animated.View>

                <Animated.View style={[styles.featureTile, featureThreeStyle]}>
                  <View style={styles.featureIcon}>
                    <MaterialDesignIcons
                      color={COLORS.purple}
                      name="weather-night"
                      size={18}
                    />
                  </View>
                  <Text style={styles.featureTitle}>Expérience</Text>
                  <Text style={styles.featureText}>À ton rythme</Text>
                </Animated.View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ====================================================
              ACTIONS
          ===================================================== */}

          <Animated.View
            style={[
              styles.actions,
              {
                paddingBottom: bottomSpacing,
              },
              actionsStyle,
            ]}>
            <Pressable
              accessibilityLabel="Commencer"
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('Objective')
              }
              style={({pressed}) => [
                styles.primaryButtonShadow,

                {
                  width: buttonWidth,
                },

                pressed &&
                  styles.primaryButtonPressed,
              ]}>
              <LinearGradient
                colors={[
                  '#5F3A82',
                  '#4D2C70',
                  '#40245E',
                ]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[
                  styles.primaryButton,
                  compact &&
                    styles.primaryButtonCompact,
                ]}>
                <Text
                  style={[
                    styles.primaryButtonText,
                    compact &&
                      styles.primaryButtonTextCompact,
                  ]}>
                  Commencer
                </Text>

                <View
                  style={[
                    styles.arrowCircle,
                    compact &&
                      styles.arrowCircleCompact,
                  ]}>
                  <MaterialDesignIcons
                    color={COLORS.purpleDeep}
                    name="arrow-right"
                    size={18}
                  />
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              accessibilityLabel="J’ai déjà un compte"
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('Auth')
              }
              style={({pressed}) => [
                styles.loginButton,

                {
                  width: buttonWidth,
                },

                compact &&
                  styles.loginButtonCompact,

                pressed &&
                  styles.loginButtonPressed,
              ]}>
              <Text
                style={[
                  styles.loginText,
                  compact &&
                    styles.loginTextCompact,
                ]}>
                J’ai déjà un compte
              </Text>

              <MaterialDesignIcons
                color="#59456A"
                name="chevron-right"
                size={18}
              />
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  /* ==========================================================
     GLOBAL
  ========================================================== */

  background: {
    flex: 1,
    backgroundColor: COLORS.backgroundMiddle,
  },

  safeArea: {
    flex: 1,
  },

  page: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },

  /* ==========================================================
     BACKGROUND DECOR
  ========================================================== */

  backgroundDecoration: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  glowTop: {
    position: 'absolute',

    top: -160,
    right: -120,

    width: 350,
    height: 350,

    borderRadius: 175,

    backgroundColor:
      'rgba(255,255,255,0.16)',
  },

  glowLeft: {
    position: 'absolute',

    top: '36%',
    left: -150,

    width: 300,
    height: 300,

    borderRadius: 150,

    backgroundColor:
      'rgba(82,52,105,0.06)',
  },

  glowBottom: {
    position: 'absolute',

    bottom: -175,
    right: -125,

    width: 350,
    height: 350,

    borderRadius: 175,

    backgroundColor:
      'rgba(72,47,95,0.08)',
  },

  /* ==========================================================
     HERO
  ========================================================== */

  hero: {
    alignItems: 'center',

    paddingHorizontal: 10,
  },

  heroCompact: {
    marginTop: -6,
  },

  welcomeTitle: {
    color: COLORS.purpleDark,

    fontFamily: 'serif',

    fontSize: 42,
    lineHeight: 45,

    fontWeight: '600',

    textAlign: 'center',
  },

  welcomeTitleCompact: {
    fontSize: 35,
    lineHeight: 38,
  },

  brandLine: {
    flexDirection: 'row',
    alignItems: 'baseline',

    marginTop: -6,
  },

  chez: {
    color: COLORS.purpleDark,

    fontFamily: 'serif',

    fontSize: 29,

    fontStyle: 'italic',
  },

  chezCompact: {
    fontSize: 25,
  },

  awa: {
    color: COLORS.purple,

    fontFamily: 'serif',

    fontSize: 41,
    lineHeight: 46,

    fontWeight: '800',

    letterSpacing: 0.5,
  },

  awaCompact: {
    fontSize: 35,
  },

  brandDivider: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 9,
  },

  brandDividerLine: {
    width: 42,
    height: 1,

    backgroundColor:
      'rgba(70,44,91,0.25)',
  },

  brandDividerDot: {
    width: 5,
    height: 5,

    marginHorizontal: 9,

    borderRadius: 3,

    backgroundColor:
      COLORS.purple,
  },

  subtitle: {
    maxWidth: 330,

    marginTop: 12,

    color: COLORS.textSecondary,

    fontSize: 13,
    lineHeight: 19,

    textAlign: 'center',
  },

  subtitleCompact: {
    maxWidth: 290,

    marginTop: 9,

    fontSize: 12,
    lineHeight: 17,
  },

  /* ==========================================================
     PREMIUM CARD
  ========================================================== */

  premiumCard: {
    width: '100%',
    maxWidth: 370,
    alignSelf: 'center',
    marginVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.46)',
    borderRadius: 26,
    shadowColor: '#342047',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 5,
  },

  premiumCardCompact: {
    marginVertical: 12,
  },

  premiumCardInner: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 14,
  },

  cardGlow: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(88,55,120,0.07)',
  },

  cardAccentLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(84,49,119,0.18)',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  cardIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(84,49,119,0.12)',
    borderRadius: 14,
  },

  cardHeaderCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  cardTitle: {
    color: COLORS.text,
    fontFamily: 'serif',
    fontSize: 15.5,
    lineHeight: 19,
    fontWeight: '700',
  },

  cardDescription: {
    marginTop: 2,
    color: '#716477',
    fontSize: 10.5,
    lineHeight: 14,
  },

  cardStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(84,49,119,0.10)',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.48)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  cardStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.purple,
  },

  cardStatusText: {
    color: '#5D476D',
    fontSize: 9.5,
    fontWeight: '700',
  },

  featureGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  featureTile: {
    flex: 1,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(84,49,119,0.08)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.30)',
    paddingHorizontal: 6,
    paddingVertical: 10,
  },

  featureIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(225,214,237,0.86)',
  },

  featureTitle: {
    color: '#43344E',
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  featureText: {
    marginTop: 2,
    color: '#7B6F81',
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },

  /* ==========================================================
     ACTIONS
  ========================================================== */

  actions: {
    alignItems: 'center',
  },

  primaryButtonShadow: {
    borderRadius: 19,

    shadowColor: '#2A1939',

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.24,
    shadowRadius: 14,

    elevation: 7,
  },

  primaryButton: {
    minHeight: 56,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 19,

    paddingHorizontal: 12,
  },

  primaryButtonCompact: {
    minHeight: 50,

    borderRadius: 18,
  },

  primaryButtonPressed: {
    opacity: 0.9,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  primaryButtonText: {
    color: '#FFFFFF',

    fontFamily: 'serif',

    fontSize: 18,

    fontWeight: '700',
  },

  primaryButtonTextCompact: {
    fontSize: 16.5,
  },

  arrowCircle: {
    position: 'absolute',

    right: 10,

    width: 36,
    height: 36,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor:
      'rgba(255,255,255,0.92)',
  },

  arrowCircleCompact: {
    width: 32,
    height: 32,

    borderRadius: 11,
  },

  /* ==========================================================
     LOGIN
  ========================================================== */

  loginButton: {
    minHeight: 49,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,

    marginTop: 10,

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.40)',

    borderRadius: 17,

    backgroundColor:
      'rgba(255,255,255,0.20)',
  },

  loginButtonCompact: {
    minHeight: 45,

    borderRadius: 16,
  },

  loginButtonPressed: {
    opacity: 0.72,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  loginText: {
    color: '#43324E',

    fontFamily: 'serif',

    fontSize: 14.5,

    fontWeight: '700',
  },

  loginTextCompact: {
    fontSize: 13.5,
  },
});

export default WelcomeScreen;