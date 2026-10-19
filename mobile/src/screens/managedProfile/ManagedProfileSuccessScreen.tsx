import React, {useEffect, useMemo, useRef} from 'react';
import {
  Animated,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
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
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaText} from '../../components/ui/AwaText';

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

// Material 3 migration: the decorative background blobs, the five sparkles and the looping halo pulse were removed
// (they carried no information); only the illustration, the success check, the title and the two actions remain.
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

    heroAnimation.start();

    badgeAnimation.start();

    return () => {
      heroAnimation.stop();
      badgeAnimation.stop();
    };
  }, [
    badgeOpacity,
    badgeScale,
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

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      end={{x: 1, y: 1}}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      style={styles.page}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

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
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={SUCCESS_ILLUSTRATION}
                style={styles.successIllustration}
              />

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

              <AwaText
                color={theme.colors.success}
                variant="labelMedium"
                style={styles.successPillText}>
                {t('managedProfile.success.pill')}
              </AwaText>
            </View>
          </AnimatedEntrance>

          {/* Title */}
          <AnimatedEntrance
            delay={560}
            distance={14}>
            <AwaText
              variant="headlineSmall"
              style={styles.title}>
              {t('managedProfile.success.title', {firstName})}
            </AwaText>
          </AnimatedEntrance>

          {/* Subtitle */}
          <AnimatedEntrance
            delay={680}
            distance={12}>
            <AwaText
              colorRole="onSurfaceVariant"
              variant="bodyLarge"
              style={styles.subtitle}>
              {t('managedProfile.success.subtitle')}
            </AwaText>
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
            <AwaButton
              accessibilityLabel={t('managedProfile.success.goToProfile', {firstName})}
              fullWidth
              label={t('managedProfile.success.goToProfile', {firstName})}
              onPress={goToProfile}
              size="large"
            />
          </AnimatedEntrance>

          <AnimatedEntrance
            delay={940}
            distance={12}>
            <AwaButton
              accessibilityLabel={t('managedProfile.success.stayOnMyProfile')}
              fullWidth
              icon="account-outline"
              label={t('managedProfile.success.stayOnMyProfile')}
              onPress={stayOnMyProfile}
              variant="text"
            />
          </AnimatedEntrance>

        </View>

      </SafeAreaView>
    </LinearGradient>
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
      width: 188,
      height: 188,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
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

      right: 20,
      bottom: 20,

      width: 40,
      height: 40,

      borderRadius: 20,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: theme.colors.success,

      borderWidth: 3,
      borderColor: theme.colors.background,
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
    },

    // DESIGN.md: letter spacing capped at 0.5 (the pill text is translated, DE/RU/TR labels are longer).
    successPillText: {
      letterSpacing: 0.5,
    },

    /*
     * Text
     */
    title: {
      maxWidth: 350,

      marginTop: 16,

      color: theme.colors.accent,

      textAlign: 'center',
    },

    subtitle: {
      maxWidth: 340,

      alignSelf: 'center',

      marginTop: 11,

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
  });
}
