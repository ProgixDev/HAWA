import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Image, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {ensureAnonymousAccount, updatePrivacySecuritySettings} from '../state/securityPreferences';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

const HERO = require('../assets/images/privacy/anonymous-mode-woman.png');

type Props = NativeStackScreenProps<RootStackParamList, 'AnonymousModeCreating'>;

type CreationStatus = 'loading' | 'error';

// Purely visual, generic checkpoints — no backend/API/database wording, no
// step is claimed unless it's harmless UI-only framing of the same single
// local activation call below.
const STEP_KEYS = ['anonymous.creating.step1', 'anonymous.creating.step2', 'anonymous.creating.step3'] as const;

// Keeps the loader on screen long enough to read as a deliberate, premium
// transition instead of a flash — the real activation call below is a
// near-instant local write, so without this the screen would barely appear.
const MIN_DISPLAY_TIME = 1800;

function minimumDelay(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, MIN_DISPLAY_TIME);
  });
}

// Wraps the real, already-existing activation call (state/securityPreferences.ts)
// in a Promise so it can race against minimumDelay() via Promise.all — same
// call AnonymousModeLimitationsScreen used to make directly. Also generates
// (once, idempotently) the stable local anonymous identifier ProfileScreen's
// "Informations du compte" sheet reads — see ensureAnonymousAccount().
async function activateAnonymousMode(): Promise<void> {
  try {
    updatePrivacySecuritySettings({anonymousMode: true});
    await ensureAnonymousAccount();
  } catch (error) {
    throw error instanceof Error ? error : new Error('anonymous_mode_activation_failed');
  }
}

function FadeIn({children, delay = 0}: {children: React.ReactNode; delay?: number}): React.JSX.Element {
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

  return <Animated.View style={{opacity: progress}}>{children}</Animated.View>;
}

function RotatingLoader({styles, label}: {styles: ReturnType<typeof createStyles>; label: string}): React.JSX.Element {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true}),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const spin = rotation.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});

  return (
    <View accessibilityLabel={label} style={styles.loaderHalo}>
      <Animated.View style={[styles.loaderRing, {transform: [{rotate: spin}]}]} />
    </View>
  );
}

export default function AnonymousModeCreatingScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const STEPS = STEP_KEYS.map(key => t(key));
  const insets = useSafeAreaInsets();
  const source = route.params?.source;
  const [status, setStatus] = useState<CreationStatus>('loading');
  const [stepIndex, setStepIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);

  // Guards against the activation call firing twice for the same attempt
  // (e.g. a re-render before the effect's async work settles). Reset only
  // by an explicit "Réessayer" tap, never by React re-rendering the screen.
  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => () => {mountedRef.current = false;}, []);

  const heroEntrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroEntrance, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroEntrance]);

  useEffect(() => {
    if (startedRef.current) {return;}
    startedRef.current = true;

    setStatus('loading');
    setStepIndex(0);

    const stepTimer1 = setTimeout(() => {if (mountedRef.current) {setStepIndex(1);}}, 650);
    const stepTimer2 = setTimeout(() => {if (mountedRef.current) {setStepIndex(2);}}, 1250);

    // Real activation starts immediately, in parallel with the minimum
    // display timer — neither one artificially delays the other. If
    // activation rejects, Promise.all rejects right away without waiting
    // for the remaining part of the 1800ms window.
    Promise.all([activateAnonymousMode(), minimumDelay()])
      .then(() => {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        if (!mountedRef.current) {return;}
        setStepIndex(3);
        // replace (not navigate) so the user can't land back on the loader
        // via the hardware/back-button.
        navigation.replace('AnonymousModeSuccess', {source});
      })
      .catch(() => {
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        if (!mountedRef.current) {return;}
        setStatus('error');
      });

    return () => {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
    };
  }, [attempt, navigation, source]);

  const retry = () => {
    startedRef.current = false;
    setAttempt(current => current + 1);
  };

  const isError = status === 'error';

  return (
    <View style={styles.page}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

      

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        {/* The screen title below already says "Création de ton espace anonyme": no second, repeated header line.
            Navigating away mid-activation is intentionally not offered — the underlying call is a single fast
            local write, so there is nothing meaningful to "interrupt", but a stray back-tap here would leave the
            user on a screen with no forward path. Only the error state offers a back button. */}
        <View style={styles.header}>
          {isError ? (
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              hitSlop={10}
              icon="arrow-left"
              onPress={navigation.goBack}
            />
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 24}]}
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

          <FadeIn delay={80}>
            {isError ? (
              <>
                <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{t('anonymous.creating.errorTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">{t('anonymous.creating.errorSubtitle')}</AwaText>
              </>
            ) : (
              <>
                <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{t('anonymous.creating.creatingTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
                  {t('anonymous.creating.creatingSubtitle')}
                </AwaText>
              </>
            )}
          </FadeIn>

          {isError ? (
            <FadeIn delay={140}>
              <AwaButton
                accessibilityLabel={t('anonymous.creating.retry')}
                fullWidth
                icon="reload"
                label={t('anonymous.creating.retry')}
                onPress={retry}
                size="large"
                style={styles.primary}
              />
              <AwaButton
                accessibilityLabel={t('common.back')}
                fullWidth
                label={t('common.back')}
                onPress={navigation.goBack}
                style={styles.cancel}
                variant="text"
              />
            </FadeIn>
          ) : (
            <>
              <FadeIn delay={140}>
                <View style={styles.loaderBlock}>
                  <RotatingLoader label={t('anonymous.creating.loaderA11y')} styles={styles} />
                  <AwaText variant="titleSmall">{t('anonymous.creating.loaderLabel')}</AwaText>
                  <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{t('anonymous.creating.loaderCaption')}</AwaText>
                </View>
              </FadeIn>

              <FadeIn delay={200}>
                <AwaCard style={styles.card} variant="filled">
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderIcon}>
                      <MaterialDesignIcons color={theme.colors.primary} name="shield-lock-outline" size={20} />
                    </View>
                    <View style={styles.cardHeaderCopy}>
                      <AwaText variant="titleMedium">{t('anonymous.creating.protectionTitle')}</AwaText>
                      <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                        {t('anonymous.creating.protectionSubtitle')}
                      </AwaText>
                    </View>
                  </View>

                  <View style={styles.stepsGroup}>
                    {STEPS.map((label, index) => {
                      const done = stepIndex > index;
                      const current = stepIndex === index;
                      return (
                        <View key={label} style={styles.stepRow}>
                          {done ? (
                            <MaterialDesignIcons color={theme.colors.success} name="check-circle" size={18} />
                          ) : current ? (
                            <MaterialDesignIcons color={theme.colors.primary} name="circle-slice-6" size={18} />
                          ) : (
                            <MaterialDesignIcons color={theme.colors.textSecondary} name="circle-outline" size={18} />
                          )}
                          <AwaText colorRole={done || current ? "onSurface" : "onSurfaceVariant"} emphasized={done || current} variant="bodyMedium">{label}</AwaText>
                        </View>
                      );
                    })}
                  </View>
                </AwaCard>
              </FadeIn>
              <FadeIn delay={260}>
                <AwaCard padding="compact" style={styles.infoCard} variant="filled">
                  <View style={styles.infoIcon}>
                    <MaterialDesignIcons color={theme.colors.warning} name="information-outline" size={20} />
                  </View>
                  <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodyMedium">{t('anonymous.creating.warning')}</AwaText>
                </AwaCard>
              </FadeIn>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  page: {flex: 1, backgroundColor: theme.colors.background},
  safe: {flex: 1},


  header: {
    minHeight: 24, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
  },

  content: {flexGrow: 1, paddingHorizontal: 18, paddingTop: 10},

  hero: {alignItems: 'center'},
  heroImage: {width: 104, height: 104},

  title: {marginTop: 20, textAlign: 'center'},
  subtitle: {maxWidth: 320, alignSelf: 'center', marginTop: 8, textAlign: 'center'},

  loaderBlock: {alignItems: 'center', marginTop: 26},
  loaderHalo: {
    width: 84, height: 84, alignItems: 'center', justifyContent: 'center', borderRadius: 42, backgroundColor: theme.colors.primarySoft,
  },
  loaderRing: {
    width: 54, height: 54, borderRadius: 27, borderWidth: 4,
    borderColor: withAlpha(theme.colors.primary, 0.18), borderTopColor: theme.colors.primary,
  },

  card: {marginTop: 24},
  cardHeaderRow: {flexDirection: 'row', alignItems: 'flex-start'},
  cardHeaderIcon: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  cardHeaderCopy: {flex: 1, minWidth: 0, marginLeft: 12},

  stepsGroup: {marginTop: 14, gap: 12},
  stepRow: {flexDirection: 'row', alignItems: 'center', gap: 10},

  // Height follows the text; the icon slot is one line high (bodyMedium lineHeight 20) so it stays on the first line.
  infoCard: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 12},
  infoIcon: {width: 24, height: 20, flexShrink: 0, alignItems: 'center', justifyContent: 'center'},
  infoText: {flex: 1, minWidth: 0},

  primary: {marginTop: 24},
  cancel: {marginTop: 4},

  });
}
