import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  Pressable,
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

const COLORS = {
  primary: '#6949BE',
  primaryDark: '#321B78',
  primarySoft: '#EEE5FC',

  text: '#28184F',
  textSecondary: '#6A5D80',

  white: '#FFFFFF',

  green: '#5DA77F',

  danger: '#C74669',
  dangerSoft: '#FFF0F4',

  border: 'rgba(105,73,190,0.12)',
};

export default function AppLockScreen(): React.JSX.Element {
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
    async () => {
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
            'Authentification impossible. Réessaie.',
          );
        }
      } catch {
        setError(
          'Authentification annulée ou indisponible.',
        );
      } finally {
        verifying.current =
          false;

        setBiometricBusy(false);
      }
    };

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
            'Code incorrect. Réessaie.',
          );

          setPin('');
        }
      })
      .catch(() => {
        setError(
          'Vérification impossible. Réessaie.',
        );

        setPin('');
      })
      .finally(() => {
        verifying.current =
          false;
      });
  }, [pin]);

  return (
    <LinearGradient
      colors={[
        '#FAF8FD',
        '#F4EFFA',
        '#EEE7F7',
        '#E9E1F3',
      ]}
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

      <View
        pointerEvents="none"
        style={
          styles.pageBackgroundDecor
        }>
        <View
          style={
            styles.pageGlowTop
          }
        />

        <View
          style={
            styles.pageGlowMiddle
          }
        />

        <View
          style={
            styles.pageGlowBottom
          }
        />
      </View>

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
          barStyle="dark-content"
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
                  COLORS.primary
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

              <View
                style={[
                  styles.heroBadge,

                  veryCompact &&
                    styles.heroBadgeVeryCompact,
                ]}>
                <MaterialDesignIcons
                  color="#FFFFFF"
                  name="lock"
                  size={
                    veryCompact
                      ? 9
                      : 11
                  }
                />
              </View>
            </View>

            <Text
              style={[
                styles.title,

                compact &&
                  styles.titleCompact,

                veryCompact &&
                  styles.titleVeryCompact,
              ]}>
              Ton espace est protégé
            </Text>

            {!veryCompact ? (
              <Text
                style={[
                  styles.subtitle,

                  compact &&
                    styles.subtitleCompact,
                ]}>
                Authentifie-toi pour accéder à ton espace personnel.
              </Text>
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
                  COLORS.danger
                }
                name="alert-circle-outline"
                size={17}
              />

              <Text
                style={
                  styles.errorText
                }>
                {error}
              </Text>
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
                      styles.pinIcon
                    }>
                    <MaterialDesignIcons
                      color={
                        COLORS.primary
                      }
                      name="dialpad"
                      size={18}
                    />
                  </View>

                  <View
                    style={
                      styles.pinHeaderCopy
                    }>
                    <Text
                      style={
                        styles.pinTitle
                      }>
                      Entre ton code PIN
                    </Text>

                    <Text
                      style={
                        styles.pinSubtitle
                      }>
                      {PIN_LENGTH} chiffres
                    </Text>
                  </View>

                  <MaterialDesignIcons
                    color={
                      COLORS.green
                    }
                    name="shield-check-outline"
                    size={19}
                  />
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
                      COLORS.primary
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

                <Text
                  style={
                    styles.biometricTitle
                  }>
                  Vérification biométrique
                </Text>

                <Text
                  style={
                    styles.biometricText
                  }>
                  Utilise la biométrie sécurisée de ton appareil pour déverrouiller AWA.
                </Text>
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
              <Pressable
                accessibilityRole="button"
                disabled={
                  biometricBusy
                }
                onPress={
                  runBiometric
                }
                style={({
                  pressed,
                }) => [
                  styles.biometricButton,

                  compact &&
                    styles.biometricButtonCompact,

                  biometricBusy &&
                    styles.buttonDisabled,

                  pressed &&
                    !biometricBusy &&
                    styles.buttonPressed,
                ]}>
                <MaterialDesignIcons
                  color="#FFFFFF"
                  name={
                    biometricIcon
                  }
                  size={21}
                />

                <Text
                  style={
                    styles.biometricButtonText
                  }>
                  {biometricBusy
                    ? 'Vérification…'
                    : capability.actionLabel}
                </Text>

                <MaterialDesignIcons
                  color="rgba(255,255,255,0.85)"
                  name="arrow-right"
                  size={18}
                />
              </Pressable>
            ) : null}

            {pinEnabled &&
            biometricEnabled &&
            !showPin ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setShowPin(
                    true,
                  );

                  setError('');
                }}
                style={({
                  pressed,
                }) => [
                  styles.secondaryButton,

                  pressed &&
                    styles.secondaryPressed,
                ]}>
                <MaterialDesignIcons
                  color={
                    COLORS.primary
                  }
                  name="dialpad"
                  size={18}
                />

                <Text
                  style={
                    styles.secondaryButtonText
                  }>
                  Utiliser mon code PIN
                </Text>
              </Pressable>
            ) : null}

            {showPin &&
            biometricEnabled &&
            capability ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setShowPin(
                    false,
                  );

                  setPin('');
                  setError('');
                }}
                style={({
                  pressed,
                }) => [
                  styles.secondaryButton,

                  pressed &&
                    styles.secondaryPressed,
                ]}>
                <MaterialDesignIcons
                  color={
                    COLORS.primary
                  }
                  name={
                    biometricIcon
                  }
                  size={18}
                />

                <Text
                  style={
                    styles.secondaryButtonText
                  }>
                  Utiliser la biométrie
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles =
  StyleSheet.create({
    /* ========================================================
       BACKGROUND
    ======================================================== */

    page: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 9999,

      backgroundColor:
        '#F8EFFF',
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

      backgroundColor:
        'rgba(111, 82, 170, 0.07)',
    },

    pageGlowMiddle: {
      position: 'absolute',

      top: '38%',
      left: -130,

      width: 260,
      height: 260,

      borderRadius: 130,

      backgroundColor:
        'rgba(139, 112, 188, 0.045)',
    },

    pageGlowBottom: {
      position: 'absolute',

      bottom: -150,
      right: -100,

      width: 310,
      height: 310,

      borderRadius: 155,

      backgroundColor:
        'rgba(92, 67, 139, 0.05)',
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
        'rgba(105,73,190,0.13)',

      borderRadius: 41,

      backgroundColor:
        'rgba(255,255,255,0.90)',

      shadowColor:
        COLORS.primary,

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

    heroBadge: {
      position: 'absolute',

      right: -2,
      bottom: 2,

      width: 25,
      height: 25,

      alignItems: 'center',
      justifyContent: 'center',

      borderWidth: 3,

      borderColor:
        '#F5EFFB',

      borderRadius: 13,

      backgroundColor:
        COLORS.primary,
    },

    heroBadgeVeryCompact: {
      width: 21,
      height: 21,

      borderRadius: 11,
    },

    title: {
      marginTop: 11,

      color:
        COLORS.text,

      fontFamily: 'serif',

      fontSize: 25,
      lineHeight: 31,

      fontWeight: '700',

      textAlign: 'center',
    },

    titleCompact: {
      marginTop: 8,

      fontSize: 22,
      lineHeight: 27,
    },

    titleVeryCompact: {
      fontSize: 20,
      lineHeight: 24,
    },

    subtitle: {
      maxWidth: 320,

      marginTop: 5,

      color:
        COLORS.textSecondary,

      fontSize: 11.5,
      lineHeight: 16,

      textAlign: 'center',
    },

    subtitleCompact: {
      maxWidth: 285,

      fontSize: 10.5,
      lineHeight: 14,
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

      paddingHorizontal: 11,
      paddingVertical: 8,

      borderWidth: 1,

      borderColor:
        'rgba(199,70,105,0.13)',

      borderRadius: 14,

      backgroundColor:
        COLORS.dangerSoft,
    },

    errorText: {
      flex: 1,

      color:
        '#98394F',

      fontSize: 10,
      lineHeight: 14,
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

    pinIcon: {
      width: 34,
      height: 34,

      alignItems: 'center',
      justifyContent: 'center',

      borderRadius: 11,

      backgroundColor:
        COLORS.primarySoft,
    },

    pinHeaderCopy: {
      flex: 1,

      marginHorizontal: 9,
    },

    pinTitle: {
      color:
        COLORS.text,

      fontSize: 12,

      fontWeight: '800',
    },

    pinSubtitle: {
      marginTop: 1,

      color:
        COLORS.textSecondary,

      fontSize: 9,
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
        COLORS.primarySoft,
    },

    biometricIconCircleCompact: {
      width: 72,
      height: 72,

      borderRadius: 36,
    },

    biometricTitle: {
      marginTop: 14,

      color:
        COLORS.text,

      fontFamily: 'serif',

      fontSize: 18,

      fontWeight: '700',

      textAlign: 'center',
    },

    biometricText: {
      maxWidth: 290,

      marginTop: 6,

      color:
        COLORS.textSecondary,

      fontSize: 10.5,
      lineHeight: 15,

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

    biometricButton: {
      width: '100%',

      minHeight: 54,

      flexDirection: 'row',
      alignItems: 'center',

      justifyContent:
        'space-between',

      paddingHorizontal: 18,

      borderRadius: 18,

      backgroundColor:
        COLORS.primary,

      shadowColor:
        COLORS.primaryDark,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.18,
      shadowRadius: 9,

      elevation: 4,
    },

    biometricButtonCompact: {
      minHeight: 49,

      borderRadius: 16,
    },

    biometricButtonText: {
      flex: 1,

      marginHorizontal: 10,

      color:
        COLORS.white,

      fontSize: 14,

      fontWeight: '800',

      textAlign: 'center',
    },

    buttonPressed: {
      opacity: 0.88,

      transform: [
        {
          scale: 0.988,
        },
      ],
    },

    buttonDisabled: {
      opacity: 0.62,
    },

    secondaryButton: {
      minHeight: 43,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent: 'center',

      gap: 7,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 15,

      backgroundColor:
        'rgba(255,255,255,0.72)',
    },

    secondaryButtonText: {
      color:
        COLORS.primary,

      fontSize: 11.5,

      fontWeight: '700',
    },

    secondaryPressed: {
      opacity: 0.7,
    },
  });