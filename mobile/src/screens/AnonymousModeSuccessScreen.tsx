import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, Image, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../navigation/AppNavigator';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaText} from '../components/ui/AwaText';
import {setHasCompletedOnboarding} from '../state/onboardingPreferences';

const HERO = require('../assets/images/privacy/anonymous-mode-woman.png');

type Props = NativeStackScreenProps<RootStackParamList, 'AnonymousModeSuccess'>;

function FadeInUp({
  children,
  delay = 0,
  distance = 15,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
}): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 450,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [distance, 0]})}],
      }}>
      {children}
    </Animated.View>
  );
}

export default function AnonymousModeSuccessScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const fromAuth = route.params?.source === 'auth';
  const heroEntrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroEntrance, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroEntrance]);

  const finish = () => {
    if (fromAuth) {
      // Fresh setup from AuthScreen — enter the app. Anonymous mode has no avatar
      // choice any more (the anonymous avatar is fixed), so this is where the single
      // real "onboarding completed" boundary is crossed (see the section comment on
      // setHasCompletedOnboarding() in onboardingPreferences.ts); it used to be
      // crossed by the avatar step. Fire-and-forget, never blocks entering the app.
      // replace() so Success can't be reached again via back.
      setHasCompletedOnboarding(true).catch(() => {});
      navigation.replace('MainTabs', {screen: 'CycleHome'});
      return;
    }
    // Stack is [origin, AnonymousMode, AnonymousModeLimitations,
    // AnonymousModeSuccess] — AnonymousModeCreating was replaced by this
    // screen, so popping 3 returns straight to the screen that opened the
    // flow (PrivacySecurityScreen), the only entry point into AnonymousMode
    // for an already-onboarded user managing settings.
    navigation.pop(3);
  };

  return (
    <View style={styles.page}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

      

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerTitleBlock}>
            <AwaText accessibilityRole="header" variant="titleMedium">{t('anonymous.success.headerTitle')}</AwaText>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 96}]}
          showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.hero,
              {
                opacity: heroEntrance,
                transform: [{scale: heroEntrance.interpolate({inputRange: [0, 1], outputRange: [0.96, 1]})}],
              },
            ]}>
            <Image accessibilityLabel={t('anonymous.mode.illustrationA11y')} resizeMode="contain" source={HERO} style={styles.heroImage} />
          </Animated.View>

          <FadeInUp delay={90} distance={10}>
            <AwaText style={styles.title} variant="headlineSmall">{t('anonymous.success.title')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
              {t('anonymous.success.subtitle')}
            </AwaText>
          </FadeInUp>

          <FadeInUp delay={160}>
            <AwaCard style={styles.card} variant="filled">
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="shield-check-outline" size={20} />
                </View>
                <View style={styles.cardHeaderCopy}>
                  <AwaText variant="titleMedium">{t('anonymous.success.cardTitle')}</AwaText>
                  <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                    {t('anonymous.success.cardSubtitle')}
                  </AwaText>
                </View>
              </View>
            </AwaCard>
          </FadeInUp>
        </ScrollView>

        <FadeInUp delay={220} distance={12}>
          <View style={[styles.ctaArea, {paddingBottom: Math.max(insets.bottom, 14)}]}>
            <AwaButton
              accessibilityLabel={fromAuth ? t('anonymous.success.continue') : t('anonymous.success.finish')}
              fullWidth
              label={fromAuth ? t('anonymous.success.continue') : t('anonymous.success.finish')}
              onPress={finish}
              size="large"
            />
          </View>
        </FadeInUp>
      </SafeAreaView>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  page: {flex: 1, backgroundColor: theme.colors.background},
  safe: {flex: 1},


  header: {minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18},
  headerTitleBlock: {alignItems: 'center'},

  content: {flexGrow: 1, paddingHorizontal: 18, paddingTop: 14},

  hero: {alignItems: 'center'},
  heroImage: {width: 118, height: 118},

  title: {marginTop: 20, textAlign: 'center'},
  subtitle: {maxWidth: 330, alignSelf: 'center', marginTop: 8, textAlign: 'center'},

  card: {marginTop: 24},
  cardHeaderRow: {flexDirection: 'row', alignItems: 'flex-start'},
  cardHeaderIcon: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  cardHeaderCopy: {flex: 1, minWidth: 0, marginLeft: 12},

  ctaArea: {
    paddingHorizontal: 18, paddingTop: 10, backgroundColor: theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border,
  },

  });
}
