import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import {PinKeypad} from '../components/security/PinKeypad';

import {
  authenticateBiometric,
  getAvailableBiometry,
  PIN_LENGTH,
  type BiometryCapability,
} from '../services/appSecurityService';

import {
  isBiometricEnabled,
  isPinEnabled,
} from '../state/securityPreferences';

import {unlockApp} from '../state/appLockStore';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaText} from '../components/ui/AwaText';

export default function AppLockScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const insets = useSafeAreaInsets();

  const {
    width,
    height,
  } = useWindowDimensions();

  const compact =
    height < 760 ||
    width < 370;

  const veryCompact =
    height < 680;

  const [
    pin,
    setPin,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const [
    showPin,
    setShowPin,
  ] = useState(
    !isBiometricEnabled(),
  );

  const [
    capability,
    setCapability,
  ] =
    useState<BiometryCapability | null>(
      null,
    );

  const [
    biometricBusy,
    setBiometricBusy,
  ] = useState(false);

  const requested =
    useRef(false);

  const verifying =
    useRef(false);

  const biometricEnabled =
    isBiometricEnabled();

  const pinEnabled =
    isPinEnabled();

  const biometricIcon =
    capability?.label === 'Face ID'
      ? 'face-recognition'
      : 'fingerprint';

  /* ==========================================================
   * BIOMETRIC
   * ========================================================== */

  const runBiometric =
    useCallback(async () => {
      if (
        verifying.current
      ) {
        return;
      }

      verifying.current =
        true;

      setBiometricBusy(true);
      setError('');

      try {
        const ok =
          await authenticateBiometric();

        if (ok) {
          unlockApp();
        } else {
          setError(
            t('appLock.biometricFailed'),
          );
        }
      } catch {
        setError(
          t('security.authCancelledOrUnavailable'),
        );
      } finally {
        verifying.current =
          false;

        setBiometricBusy(false);
      }
    }, [t]);

  /* ==========================================================
   * BLOCK BACK + AUTO BIOMETRIC
   * ========================================================== */

  useEffect(() => {
    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );

    getAvailableBiometry()
      .then(value => {
        setCapability(value);

        if (
          value &&
          isBiometricEnabled() &&
          !requested.current
        ) {
          requested.current =
            true;

          runBiometric();
        }
      })
      .catch(() => {
        setShowPin(
          isPinEnabled(),
        );
      });

    return () => {
      subscription.remove();
    };
    // Runs once on mount only (unchanged pre-localization behavior) — the
    // BackHandler subscription and the one-shot auto-biometric trigger
    // (guarded by requested.current) must never re-run on a language switch.
    // runBiometric is itself a stable useCallback (deps: [t]), so this omits
    // no genuinely-reactive dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ==========================================================
   * PIN
   * ========================================================== */

  useEffect(() => {
    if (
      pin.length !==
        PIN_LENGTH ||
      verifying.current
    ) {
      return;
    }

    verifying.current =
      true;

    import(
      '../services/appSecurityService'
    )
      .then(
        ({
          verifyPin,
        }) =>
          verifyPin(pin),
      )
      .then(ok => {
        if (ok) {
          unlockApp();
        } else {
          setError(
            t('security.incorrectCode'),
          );

          setPin('');
        }
      })
      .catch(() => {
        setError(
          t('appLock.pinVerifyError'),
        );

        setPin('');
      })
      .finally(() => {
        verifying.current =
          false;
      });
  }, [pin, t]);

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
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
      style={styles.page}>
      {/* SAME AWA BACKGROUND */}


      <SafeAreaView
        edges={[
          'top',
          'bottom',
          'left',
          'right',
        ]}
        style={
          styles.safe
        }>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />

        <View
          style={[
            styles.content,

            compact &&
              styles.contentCompact,

            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  10,
                ),
            },
          ]}>
          {/* ==================================================
              HERO
          ================================================== */}

          <View
            style={[
              styles.heroSection,

              compact &&
                styles.heroSectionCompact,
            ]}>
            <View
              style={[
                styles.heroCircle,

                compact &&
                  styles.heroCircleCompact,

                veryCompact &&
                  styles.heroCircleVeryCompact,
              ]}>
              <MaterialDesignIcons
                color={
                  theme.colors.primary
                }
                name="shield-lock-outline"
                size={
                  veryCompact
                    ? 27
                    : compact
                      ? 31
                      : 36
                }
              />

              
            </View>

            <AwaText
              accessibilityRole="header"
              style={styles.title}
              variant={veryCompact ? 'titleLarge' : compact ? 'headlineSmall' : 'headlineMedium'}>
              {t('appLock.title')}
            </AwaText>

            {!veryCompact ? (
              <AwaText
                colorRole="onSurfaceVariant"
                style={[
                  styles.subtitle,
                  compact &&
                    styles.subtitleCompact,
                ]}
                variant="bodySmall">
                {t('appLock.subtitle')}
              </AwaText>
            ) : null}
          </View>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error ? (
            <View
              accessibilityRole="alert"
              style={
                styles.errorCard
              }>
              <MaterialDesignIcons
                color={
                  theme.colors.danger
                }
                name="alert-circle-outline"
                size={17}
              />

              <AwaText
                colorRole="error"
                style={
                  styles.errorText
                }
                variant="bodySmall">
                {error}
              </AwaText>
            </View>
          ) : null}

          {/* ==================================================
              AUTH AREA
          ================================================== */}

          <View
            style={
              styles.authArea
            }>
            {showPin &&
            pinEnabled ? (
              <>
                <View
                  style={[
                    styles.pinHeader,

                    compact &&
                      styles.pinHeaderCompact,
                  ]}>
                  

                  <View
                    style={
                      styles.pinHeaderCopy
                    }>
                    <AwaText variant="titleSmall">
                      {t('appLock.enterPinTitle')}
                    </AwaText>

                    <AwaText
                      colorRole="onSurfaceVariant"
                      style={styles.pinSubtitle}
                      variant="bodySmall">
                      {t('appLock.enterPinSubtitle', {length: PIN_LENGTH})}
                    </AwaText>
                  </View>

                  
                </View>

                <View
                  style={[
                    styles.keypadArea,

                    compact &&
                      styles.keypadAreaCompact,
                  ]}>
                  <PinKeypad
                    error={error}
                    onChange={value => {
                      setError('');
                      setPin(value);
                    }}
                    value={pin}
                  />
                </View>
              </>
            ) : (
              <View
                style={
                  styles.biometricArea
                }>
                <View
                  style={[
                    styles.biometricIconCircle,

                    compact &&
                      styles.biometricIconCircleCompact,
                  ]}>
                  <MaterialDesignIcons
                    color={
                      theme.colors.primary
                    }
                    name={
                      biometricIcon
                    }
                    size={
                      compact
                        ? 37
                        : 43
                    }
                  />
                </View>

                <AwaText
                  style={
                    styles.biometricTitle
                  }
                  variant="titleLarge">
                  {t('appLock.biometricAreaTitle')}
                </AwaText>

                <AwaText
                  colorRole="onSurfaceVariant"
                  style={
                    styles.biometricText
                  }
                  variant="bodySmall">
                  {t('appLock.biometricAreaText')}
                </AwaText>
              </View>
            )}
          </View>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <View
            style={
              styles.actions
            }>
            {biometricEnabled &&
            capability ? (
              <AwaButton
                disabled={
                  biometricBusy
                }
                fullWidth
                icon={biometricIcon}
                label={
                  biometricBusy
                    ? t('appLock.verifying')
                    : capability.actionLabel
                }
                onPress={
                  runBiometric
                }
              />
            ) : null}

            {pinEnabled &&
            biometricEnabled &&
            !showPin ? (
              <AwaButton
                fullWidth
                icon="dialpad"
                label={t('appLock.usePin')}
                onPress={() => {
                  setShowPin(
                    true,
                  );
                  setError('');
                }}
                size={compact ? 'compact' : 'default'}
                variant="tonal"
              />
            ) : null}

            {showPin &&
            biometricEnabled &&
            capability ? (
              <AwaButton
                fullWidth
                icon={biometricIcon}
                label={t('appLock.useBiometrics')}
                onPress={() => {
                  setShowPin(
                    false,
                  );
                  setPin('');
                  setError('');
                }}
                size={compact ? 'compact' : 'default'}
                variant="tonal"
              />
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    /* ========================================================
       BACKGROUND
    ======================================================== */

    page: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 9999,

      backgroundColor:
        theme.colors.background,
    },





    safe: {
      flex: 1,
    },

    /* ========================================================
       PAGE — NO SCROLL
    ======================================================== */

    content: {
      flex: 1,

      paddingHorizontal: 22,

      /*
       * Extra breathing room requested at the top.
       */
      paddingTop: 18,
    },

    contentCompact: {
      paddingHorizontal: 17,

      /*
       * Smaller top spacing on narrow/short devices
       * so the keypad still fits.
       */
      paddingTop: 12,
    },

    /* ========================================================
       HERO
    ======================================================== */

    heroSection: {
      alignItems: 'center',

      paddingTop: 12,
      paddingBottom: 13,
    },

    heroSectionCompact: {
      paddingTop: 8,
      paddingBottom: 8,
    },

    heroCircle: {
      position: 'relative',

      width: 82,
      height: 82,

      alignItems: 'center',
      justifyContent: 'center',

      borderWidth: 1,

      borderColor:
        theme.colors.border,

      borderRadius: 41,

      backgroundColor:
        withAlpha(theme.colors.surface, 0.90),

      shadowColor:
        theme.shadow.shadowColor,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.09,
      shadowRadius: 10,

      elevation: 3,
    },

    heroCircleCompact: {
      width: 68,
      height: 68,

      borderRadius: 34,
    },

    heroCircleVeryCompact: {
      width: 58,
      height: 58,

      borderRadius: 29,
    },



    title: {
      marginTop: 11,
      textAlign: 'center',
    },



    subtitle: {
      maxWidth: 320,
      marginTop: 5,
      textAlign: 'center',
    },

    subtitleCompact: {
      maxWidth: 285,
    },

    /* ========================================================
       ERROR
    ======================================================== */

    errorCard: {
      width: '100%',

      flexDirection: 'row',
      alignItems: 'center',

      gap: 8,

      marginBottom: 6,

      paddingHorizontal: 12,
      paddingVertical: 10,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.danger, 0.13),

      borderRadius: 12,

      backgroundColor:
        withAlpha(theme.colors.danger, 0.08),
    },

    errorText: {
      flex: 1,
    },

    /* ========================================================
       AUTH
    ======================================================== */

    authArea: {
      flex: 1,

      minHeight: 0,

      justifyContent: 'center',
    },

    /* ========================================================
       PIN
    ======================================================== */

    pinHeader: {
      flexDirection: 'row',
      alignItems: 'center',

      marginBottom: 2,

      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    pinHeaderCompact: {
      paddingVertical: 4,
    },


    pinHeaderCopy: {
      flex: 1,

      marginHorizontal: 9,
    },


    pinSubtitle: {
      marginTop: 1,
    },

    keypadArea: {
      width: '100%',

      alignItems: 'center',
      justifyContent: 'center',
    },

    keypadAreaCompact: {
      marginTop: -3,
    },

    /* ========================================================
       BIOMETRIC
    ======================================================== */

    biometricArea: {
      alignItems: 'center',

      paddingHorizontal: 16,
    },

    biometricIconCircle: {
      width: 84,
      height: 84,

      alignItems: 'center',
      justifyContent: 'center',

      borderRadius: 42,

      backgroundColor:
        theme.colors.primarySoft,
    },

    biometricIconCircleCompact: {
      width: 72,
      height: 72,

      borderRadius: 36,
    },

    biometricTitle: {
      marginTop: 14,
      textAlign: 'center',
    },

    biometricText: {
      maxWidth: 290,
      marginTop: 6,
      textAlign: 'center',
    },

    /* ========================================================
       ACTIONS
    ======================================================== */

    actions: {
      width: '100%',

      gap: 8,

      paddingTop: 6,
    },








  });
}