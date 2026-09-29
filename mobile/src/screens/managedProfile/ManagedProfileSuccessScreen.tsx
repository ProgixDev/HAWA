import React, {useEffect, useMemo, useRef} from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import '../../i18n';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {
  onPrimaryTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';

import {
  OWNER_PROFILE_ID,
  setActiveProfileId,
} from '../../state/activeProfileStore';

import {seedManagedProfileCycleIfNeeded} from '../../state/managedProfileCycleSeed';

const SUCCESS_ILLUSTRATION = require('../../assets/images/fille.png');

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ManagedProfileSuccess'
>;

type AnimatedEntranceProps = {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
};

function AnimatedEntrance({
  children,
  delay = 0,
  distance = 16,
}: AnimatedEntranceProps): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 500,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [delay, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [distance, 0],
            }),
          },
        ],
      }}>
      {children}
    </Animated.View>
  );
}

type SparkleProps = {
  style: object;
  delay: number;
  size?: number;
  icon?: 'star-four-points' | 'circle-small';
  color: string;
};

function Sparkle({
  style,
  delay,
  size = 18,
  icon = 'star-four-points',
  color,
}: SparkleProps): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(progress, {
        toValue: 1,
        friction: 6,
        tension: 55,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [delay, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.25, 1],
              }),
            },
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [7, 0],
              }),
            },
          ],
        },
      ]}>
      <MaterialDesignIcons
        name={icon}
        size={size}
        color={color}
      />
    </Animated.View>
  );
}

export default function ManagedProfileSuccessScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();

  const styles = useMemo(
    () => createStyles(theme),
    [theme],
  );

  const insets = useSafeAreaInsets();

  const {firstName, profileId} = route.params;

  /*
   * Hero animation
   */
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.78)).current;
  const heroTranslateY = useRef(new Animated.Value(14)).current;

  /*
   * Success badge
   */
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  /*
   * Halo breathing animation
   */
  const haloPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const heroAnimation = Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.spring(heroScale, {
        toValue: 1,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }),

      Animated.spring(heroTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 55,
        useNativeDriver: true,
      }),
    ]);

    const badgeAnimation = Animated.sequence([
      Animated.delay(320),

      Animated.parallel([
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),

        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 4,
          tension: 85,
          useNativeDriver: true,
        }),
      ]),
    ]);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(haloPulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    heroAnimation.start();

    badgeAnimation.start();

    const pulseTimer = setTimeout(() => {
      pulseLoop.start();
    }, 700);

    return () => {
      clearTimeout(pulseTimer);

      heroAnimation.stop();
      badgeAnimation.stop();
      pulseLoop.stop();
    };
  }, [
    badgeOpacity,
    badgeScale,
    haloPulse,
    heroOpacity,
    heroScale,
    heroTranslateY,
  ]);

  /*
   * Keep the existing daughter-profile activation logic.
   */
  const goToProfile = async () => {
    await setActiveProfileId(profileId);

    await seedManagedProfileCycleIfNeeded(profileId);

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: {
            screen: 'CycleHome',
          },
        },
      ],
    });
  };

  /*
   * Keep the existing owner-profile restoration logic.
   */
  const stayOnMyProfile = async () => {
    await setActiveProfileId(OWNER_PROFILE_ID);

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: {
            screen: 'Profile',
          },
        },
      ],
    });
  };

  const haloScale = haloPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.035],
  });

  const haloOpacity = haloPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.76, 1],
  });

  return (
    <View style={styles.page}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

      {/* Background */}
      <View
        pointerEvents="none"
        accessible={false}
        style={styles.backgroundDecoration}>
        <View style={styles.blobTopRight} />
        <View style={styles.blobLeft} />
        <View style={styles.blobBottom} />
      </View>

      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.safe}>

        {/* Main content */}
        <View style={styles.content}>

          {/* HERO */}
          <Animated.View
            style={[
              styles.hero,
              {
                opacity: heroOpacity,
                transform: [
                  {scale: heroScale},
                  {translateY: heroTranslateY},
                ],
              },
            ]}>

            <View style={styles.heroStage}>

              {/* Sparkles */}
              <Sparkle
                delay={390}
                color={withAlpha(theme.colors.primary, 0.9)}
                size={19}
                style={styles.sparkleTopLeft}
              />

              <Sparkle
                delay={470}
                color={withAlpha(theme.colors.accent, 0.8)}
                size={13}
                style={styles.sparkleTopRight}
              />

              <Sparkle
                delay={530}
                color={withAlpha(theme.colors.primary, 0.7)}
                size={11}
                icon="circle-small"
                style={styles.sparkleMiddleLeft}
              />

              <Sparkle
                delay={580}
                color={withAlpha(theme.colors.primary, 0.9)}
                size={16}
                style={styles.sparkleRight}
              />

              <Sparkle
                delay={630}
                color={withAlpha(theme.colors.accent, 0.7)}
                size={12}
                style={styles.sparkleBottomLeft}
              />

              {/* Pulsing outer halo */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.haloGlow,
                  {
                    opacity: haloOpacity,
                    transform: [{scale: haloScale}],
                  },
                ]}
              />

              {/* Main halo */}
              <View style={styles.heroHaloOuter}>

                <View style={styles.heroHaloInner}>

                  <Image
                    accessibilityIgnoresInvertColors
                    resizeMode="contain"
                    source={SUCCESS_ILLUSTRATION}
                    style={styles.successIllustration}
                  />

                </View>

              </View>

              {/* Success check */}
              <Animated.View
                style={[
                  styles.successBadge,
                  {
                    opacity: badgeOpacity,
                    transform: [{scale: badgeScale}],
                  },
                ]}>
                <MaterialDesignIcons
                  name="check-bold"
                  size={20}
                  color={onPrimaryTextColor(theme)}
                />
              </Animated.View>

            </View>

          </Animated.View>

          {/* Success pill */}
          <AnimatedEntrance
            delay={480}
            distance={8}>
            <View style={styles.successPill}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={15}
                color={theme.colors.success}
              />

              <Text style={styles.successPillText}>
                {t('managedProfile.success.pill')}
              </Text>
            </View>
          </AnimatedEntrance>

          {/* Title */}
          <AnimatedEntrance
            delay={560}
            distance={14}>
            <Text style={styles.title}>
              {t('managedProfile.success.title', {firstName})}
            </Text>
          </AnimatedEntrance>

          {/* Subtitle */}
          <AnimatedEntrance
            delay={680}
            distance={12}>
            <Text style={styles.subtitle}>
              {t('managedProfile.success.subtitle')}
            </Text>
          </AnimatedEntrance>

        </View>

        {/* Bottom CTAs */}
        <View
          style={[
            styles.ctaContainer,
            {
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}>

          <AnimatedEntrance
            delay={820}
            distance={18}>

            <Pressable
              accessibilityLabel={t('managedProfile.success.goToProfile', {firstName})}
              accessibilityRole="button"
              onPress={goToProfile}
              style={({pressed}) => [
                styles.primary,
                pressed && styles.pressed,
              ]}>

              <View style={styles.primaryContent}>

                <Text
                  numberOfLines={1}
                  style={styles.primaryText}>
                  {t('managedProfile.success.goToProfile', {firstName})}
                </Text>

                <View style={styles.primaryIcon}>
                  <MaterialDesignIcons
                    name="arrow-right"
                    size={20}
                    color={onPrimaryTextColor(theme)}
                  />
                </View>

              </View>

            </Pressable>

          </AnimatedEntrance>

          <AnimatedEntrance
            delay={940}
            distance={12}>

            <Pressable
              accessibilityLabel={t('managedProfile.success.stayOnMyProfile')}
              accessibilityRole="button"
              onPress={stayOnMyProfile}
              style={({pressed}) => [
                styles.secondary,
                pressed && styles.secondaryPressed,
              ]}>

              <MaterialDesignIcons
                name="account-outline"
                size={19}
                color={theme.colors.textSecondary}
              />

              <Text style={styles.secondaryText}>
                {t('managedProfile.success.stayOnMyProfile')}
              </Text>

            </Pressable>

          </AnimatedEntrance>

        </View>

      </SafeAreaView>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    safe: {
      flex: 1,
    },

    /*
     * Background
     */
    backgroundDecoration: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },

    blobTopRight: {
      position: 'absolute',
      top: -75,
      right: -60,
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: withAlpha(
        theme.colors.primary,
        0.07,
      ),
    },

    blobLeft: {
      position: 'absolute',
      top: 285,
      left: -95,
      width: 205,
      height: 205,
      borderRadius: 103,
      backgroundColor: withAlpha(
        theme.colors.primary,
        0.045,
      ),
    },

    blobBottom: {
      position: 'absolute',
      bottom: -75,
      right: -45,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: withAlpha(
        theme.colors.primary,
        0.04,
      ),
    },

    /*
     * Main content
     */
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 26,
      paddingTop: 16,
    },

    hero: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    heroStage: {
      width: 235,
      height: 235,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },

    /*
     * Animated halo
     */
    haloGlow: {
      position: 'absolute',
      width: 205,
      height: 205,
      borderRadius: 103,
      backgroundColor: withAlpha(
        theme.colors.primary,
        0.075,
      ),
    },

    heroHaloOuter: {
      width: 188,
      height: 188,
      borderRadius: 94,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: theme.colors.primarySoft,

      borderWidth: 1,
      borderColor: withAlpha(
        theme.colors.primary,
        0.15,
      ),
    },

    heroHaloInner: {
      width: 154,
      height: 154,
      borderRadius: 77,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: theme.colors.surface,

      borderWidth: 1,
      borderColor: withAlpha(
        theme.colors.primary,
        0.13,
      ),

      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
    },

    successIllustration: {
      width: 136,
      height: 136,
    },

    /*
     * Check badge
     */
    successBadge: {
      position: 'absolute',

      right: 29,
      bottom: 31,

      width: 40,
      height: 40,

      borderRadius: 20,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: theme.colors.success,

      borderWidth: 3,
      borderColor: theme.colors.background,

      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 5,
    },

    /*
     * Sparkles
     */
    sparkleTopLeft: {
      position: 'absolute',
      top: 22,
      left: 31,
    },

    sparkleTopRight: {
      position: 'absolute',
      top: 39,
      right: 28,
    },

    sparkleMiddleLeft: {
      position: 'absolute',
      top: 103,
      left: 10,
    },

    sparkleRight: {
      position: 'absolute',
      top: 111,
      right: 5,
    },

    sparkleBottomLeft: {
      position: 'absolute',
      bottom: 27,
      left: 35,
    },

    /*
     * Success pill
     */
    successPill: {
      marginTop: 8,

      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',

      gap: 6,

      paddingHorizontal: 12,
      paddingVertical: 6,

      borderRadius: 999,

      backgroundColor: withAlpha(
        theme.colors.success,
        0.1,
      ),

      borderWidth: 1,
      borderColor: withAlpha(
        theme.colors.success,
        0.17,
      ),
    },

    successPillText: {
      color: theme.colors.success,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '800',
      letterSpacing: 1,
    },

    /*
     * Text
     */
    title: {
      maxWidth: 350,

      marginTop: 16,

      color: theme.colors.accent,

      fontFamily: 'serif',
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '700',

      textAlign: 'center',
    },

    subtitle: {
      maxWidth: 340,

      alignSelf: 'center',

      marginTop: 11,

      color: theme.colors.textSecondary,

      fontSize: 15,
      lineHeight: 22,

      textAlign: 'center',
    },

    /*
     * CTAs
     */
    ctaContainer: {
      paddingHorizontal: 24,
      paddingTop: 12,
      gap: 6,
    },

    primary: {
      minHeight: 58,

      justifyContent: 'center',

      borderRadius: 20,

      backgroundColor: theme.colors.primary,

      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 6,
    },

    primaryContent: {
      minHeight: 58,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',

      paddingLeft: 28,
      paddingRight: 18,
    },

    primaryText: {
      flexShrink: 1,

      color: onPrimaryTextColor(theme),

      fontSize: 16,
      lineHeight: 21,
      fontWeight: '800',

      textAlign: 'center',
    },

    primaryIcon: {
      position: 'absolute',
      right: 18,

      width: 30,
      height: 30,

      alignItems: 'center',
      justifyContent: 'center',

      borderRadius: 15,

      backgroundColor: withAlpha(
        onPrimaryTextColor(theme),
        0.11,
      ),
    },

    secondary: {
      minHeight: 48,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',

      gap: 7,

      borderRadius: 18,
    },

    secondaryText: {
      color: theme.colors.textSecondary,

      fontSize: 14.5,
      lineHeight: 19,
      fontWeight: '700',
    },

    pressed: {
      opacity: 0.9,
      transform: [
        {
          scale: 0.985,
        },
      ],
    },

    secondaryPressed: {
      opacity: 0.68,
    },
  });
}
