import React, {useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

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

const BACKGROUND = require('../assets/images/school-selection-background.png');

const COLORS = {
  primary: '#6949BE',
  primaryDark: '#321B78',
  primarySoft: '#EEE5FC',

  text: '#28184F',
  textSecondary: '#6A5D80',

  white: '#FFFFFF',

  pink: '#D85395',
  pinkSoft: '#FCE9F3',

  green: '#5DA77F',
  greenSoft: '#EAF6EF',

  danger: '#C74669',
  dangerSoft: '#FFF0F4',

  border: 'rgba(105,73,190,0.13)',
};

export default function AppLockScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const [showPin, setShowPin] = useState(
    !isBiometricEnabled(),
  );

  const [capability, setCapability] =
    useState<BiometryCapability | null>(null);

  const [biometricBusy, setBiometricBusy] =
    useState(false);

  const requested = useRef(false);
  const verifying = useRef(false);

  const biometricEnabled =
    isBiometricEnabled();

  const pinEnabled = isPinEnabled();

  const biometricIcon =
    capability?.label === 'Face ID'
      ? 'face-recognition'
      : 'fingerprint';

  /* ========================================================
   * BIOMETRIC AUTH
   * ======================================================== */

  const runBiometric = async () => {
    if (verifying.current) {
      return;
    }

    verifying.current = true;
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
      verifying.current = false;
      setBiometricBusy(false);
    }
  };

  /* ========================================================
   * BLOCK BACK + AUTO BIOMETRIC
   * ======================================================== */

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
          requested.current = true;
          runBiometric();
        }
      })
      .catch(() => {
        setShowPin(isPinEnabled());
      });

    return () => {
      subscription.remove();
    };
  }, []);

  /* ========================================================
   * PIN
   * ======================================================== */

  useEffect(() => {
    if (
      pin.length !== PIN_LENGTH ||
      verifying.current
    ) {
      return;
    }

    verifying.current = true;

    import('../services/appSecurityService')
      .then(({verifyPin}) =>
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
        verifying.current = false;
      });
  }, [pin]);

  return (
    <ImageBackground
      resizeMode="cover"
      source={BACKGROUND}
      style={styles.page}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <View
          style={[
            styles.content,
            {
              paddingTop:
                Math.max(insets.top, 18) +
                14,

              paddingBottom:
                Math.max(
                  insets.bottom,
                  18,
                ),
            },
          ]}>
          {/* HERO */}

          <View style={styles.hero}>
            <View
              style={styles.heroGlowLarge}>
              <View
                style={
                  styles.heroGlowMedium
                }>
                <View
                  style={
                    styles.heroIcon
                  }>
                  <MaterialDesignIcons
                    color={COLORS.primary}
                    name="shield-lock-outline"
                    size={46}
                  />
                </View>
              </View>
            </View>

            <View style={styles.heroBadge}>
              <MaterialDesignIcons
                color="#FFFFFF"
                name="lock"
                size={15}
              />
            </View>
          </View>

          {/* BRAND */}

          <View style={styles.brandPill}>
            <MaterialDesignIcons
              color={COLORS.primary}
              name="star-four-points"
              size={11}
            />

            <Text style={styles.brand}>
              AWA
            </Text>
          </View>

          <Text style={styles.title}>
            Ton espace est protégé
          </Text>

          <Text style={styles.subtitle}>
            Authentifie-toi pour accéder
            à ton espace personnel en toute
            sécurité.
          </Text>

          {/* SECURITY CARD */}

          <View style={styles.securityCard}>
            <View
              style={
                styles.securityCardIcon
              }>
              <MaterialDesignIcons
                color={COLORS.primary}
                name="shield-check-outline"
                size={22}
              />
            </View>

            <View style={styles.securityCopy}>
              <Text
                style={
                  styles.securityTitle
                }>
                Accès sécurisé
              </Text>

              <Text
                style={
                  styles.securityText
                }>
                Ton espace reste verrouillé
                jusqu’à ce que ton identité
                soit vérifiée.
              </Text>
            </View>

            <MaterialDesignIcons
              color="#A28BC4"
              name="lock-outline"
              size={20}
            />
          </View>

          {/* ERROR */}

          {error ? (
            <View
              accessibilityRole="alert"
              style={styles.errorCard}>
              <View style={styles.errorIcon}>
                <MaterialDesignIcons
                  color={COLORS.danger}
                  name="alert-outline"
                  size={18}
                />
              </View>

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* AUTH CONTENT */}

          {showPin && pinEnabled ? (
            <View style={styles.pinCard}>
              <View style={styles.pinHeader}>
                <View
                  style={
                    styles.pinHeaderIcon
                  }>
                  <MaterialDesignIcons
                    color={COLORS.primary}
                    name="dialpad"
                    size={20}
                  />
                </View>

                <View style={styles.pinHeaderCopy}>
                  <Text
                    style={
                      styles.pinHeaderTitle
                    }>
                    Entre ton code PIN
                  </Text>

                  <Text
                    style={
                      styles.pinHeaderSubtitle
                    }>
                    {PIN_LENGTH} chiffres
                  </Text>
                </View>

                <View style={styles.pinStatus}>
                  <MaterialDesignIcons
                    color={COLORS.green}
                    name="shield-check-outline"
                    size={18}
                  />
                </View>
              </View>

              <PinKeypad
                error={error}
                onChange={value => {
                  setError('');
                  setPin(value);
                }}
                value={pin}
              />
            </View>
          ) : (
            <View style={styles.biometricCard}>
              <View
                style={
                  styles.biometricIcon
                }>
                <MaterialDesignIcons
                  color={COLORS.primary}
                  name={biometricIcon}
                  size={32}
                />
              </View>

              <View
                style={
                  styles.biometricCopy
                }>
                <Text
                  style={
                    styles.biometricTitle
                  }>
                  Vérification biométrique
                </Text>

                <Text
                  style={
                    styles.biometricDescription
                  }>
                  Utilise la biométrie
                  sécurisée de ton appareil.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.spacer} />

          {/* BIOMETRIC BUTTON */}

          {biometricEnabled &&
          capability ? (
            <Pressable
              accessibilityRole="button"
              disabled={biometricBusy}
              onPress={runBiometric}
              style={({pressed}) => [
                styles.biometricButton,

                biometricBusy &&
                  styles.buttonDisabled,

                pressed &&
                  !biometricBusy &&
                  styles.buttonPressed,
              ]}>
              <View
                style={
                  styles.buttonGlowLeft
                }
              />

              <View
                style={
                  styles.buttonGlowRight
                }
              />

              <MaterialDesignIcons
                color="#FFFFFF"
                name={biometricIcon}
                size={24}
              />

              <Text
                style={
                  styles.biometricButtonText
                }>
                {biometricBusy
                  ? 'Vérification…'
                  : capability.actionLabel}
              </Text>

              <View
                style={
                  styles.buttonArrow
                }>
                <MaterialDesignIcons
                  color="#FFFFFF"
                  name="arrow-right"
                  size={17}
                />
              </View>
            </Pressable>
          ) : null}

          {/* PIN FALLBACK */}

          {pinEnabled &&
          biometricEnabled &&
          !showPin ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setShowPin(true);
                setError('');
              }}
              style={({pressed}) => [
                styles.pinFallback,

                pressed &&
                  styles.fallbackPressed,
              ]}>
              <View
                style={
                  styles.pinFallbackIcon
                }>
                <MaterialDesignIcons
                  color={COLORS.primary}
                  name="dialpad"
                  size={19}
                />
              </View>

              <Text
                style={
                  styles.pinFallbackText
                }>
                Utiliser mon code PIN
              </Text>

              <MaterialDesignIcons
                color="#A08ABF"
                name="chevron-right"
                size={21}
              />
            </Pressable>
          ) : null}

          {/* PRIVACY */}

          <View style={styles.privacyCard}>
            <View style={styles.privacyIcon}>
              <MaterialDesignIcons
                color={COLORS.green}
                name="shield-check-outline"
                size={20}
              />
            </View>

            <View style={styles.privacyCopy}>
              <Text
                style={
                  styles.privacyTitle
                }>
                Tes données restent privées
              </Text>

              <Text
                style={
                  styles.privacyText
                }>
                Le verrouillage protège ton
                espace AWA sur cet appareil.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  page: {
    ...StyleSheet.absoluteFillObject,

    zIndex: 9999,

    backgroundColor: '#F8EFFF',
  },

  safe: {
    flex: 1,
  },

  content: {
    flex: 1,

    alignItems: 'center',

    paddingHorizontal: 20,
  },

  /* HERO */

  hero: {
    position: 'relative',

    width: 145,
    height: 145,

    alignItems: 'center',
    justifyContent: 'center',
  },

  heroGlowLarge: {
    width: 145,
    height: 145,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 73,

    backgroundColor:
      'rgba(188,153,236,0.12)',
  },

  heroGlowMedium: {
    width: 116,
    height: 116,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 58,

    backgroundColor:
      'rgba(171,134,229,0.19)',
  },

  heroIcon: {
    width: 88,
    height: 88,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,

    borderColor:
      'rgba(105,73,190,0.15)',

    borderRadius: 44,

    backgroundColor: '#FFFFFF',

    shadowColor:
      COLORS.primary,

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.15,

    shadowRadius: 15,

    elevation: 5,
  },

  heroBadge: {
    position: 'absolute',

    right: 11,
    bottom: 13,

    width: 32,
    height: 32,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 3,

    borderColor: '#F8EFFF',

    borderRadius: 16,

    backgroundColor:
      COLORS.primary,
  },

  /* BRAND */

  brandPill: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    marginTop: 8,

    paddingHorizontal: 12,

    paddingVertical: 6,

    borderRadius: 14,

    backgroundColor:
      'rgba(246,239,252,0.94)',
  },

  brand: {
    color: COLORS.primary,

    fontFamily: 'serif',

    fontSize: 14,

    fontWeight: '800',

    letterSpacing: 2.3,
  },

  title: {
    marginTop: 15,

    color: COLORS.text,

    fontFamily: 'serif',

    fontSize: 28,

    lineHeight: 34,

    fontWeight: '700',

    textAlign: 'center',
  },

  subtitle: {
    maxWidth: 330,

    marginTop: 8,

    color:
      COLORS.textSecondary,

    fontSize: 12.5,

    lineHeight: 19,

    textAlign: 'center',
  },

  /* SECURITY */

  securityCard: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 20,

    padding: 13,

    borderWidth: 1,

    borderColor:
      COLORS.border,

    borderRadius: 20,

    backgroundColor:
      'rgba(255,255,255,0.92)',

    shadowColor: '#654593',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.05,

    shadowRadius: 10,

    elevation: 2,
  },

  securityCardIcon: {
    width: 44,
    height: 44,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 15,

    backgroundColor:
      COLORS.primarySoft,
  },

  securityCopy: {
    flex: 1,

    marginHorizontal: 10,
  },

  securityTitle: {
    color: COLORS.text,

    fontSize: 12,

    fontWeight: '800',
  },

  securityText: {
    marginTop: 3,

    color:
      COLORS.textSecondary,

    fontSize: 9.6,

    lineHeight: 14,
  },

  /* ERROR */

  errorCard: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 9,

    marginTop: 11,

    paddingHorizontal: 11,

    paddingVertical: 10,

    borderWidth: 1,

    borderColor:
      'rgba(199,70,105,0.15)',

    borderRadius: 16,

    backgroundColor:
      COLORS.dangerSoft,
  },

  errorIcon: {
    width: 30,
    height: 30,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: '#FFFFFF',
  },

  errorText: {
    flex: 1,

    color: '#98394F',

    fontSize: 10.5,

    lineHeight: 15,
  },

  /* PIN */

  pinCard: {
    width: '100%',

    marginTop: 13,

    paddingHorizontal: 14,

    paddingTop: 13,

    paddingBottom: 5,

    borderWidth: 1,

    borderColor:
      'rgba(105,73,190,0.12)',

    borderRadius: 23,

    backgroundColor:
      'rgba(255,255,255,0.94)',

    shadowColor: '#60448E',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.06,

    shadowRadius: 11,

    elevation: 2,
  },

  pinHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 4,
  },

  pinHeaderIcon: {
    width: 39,
    height: 39,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor:
      COLORS.primarySoft,
  },

  pinHeaderCopy: {
    flex: 1,

    marginLeft: 9,
  },

  pinHeaderTitle: {
    color: COLORS.text,

    fontSize: 12,

    fontWeight: '800',
  },

  pinHeaderSubtitle: {
    marginTop: 2,

    color:
      COLORS.textSecondary,

    fontSize: 9.4,
  },

  pinStatus: {
    width: 34,
    height: 34,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor:
      COLORS.greenSoft,
  },

  /* BIOMETRIC CARD */

  biometricCard: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 14,

    padding: 14,

    borderWidth: 1,

    borderColor:
      'rgba(105,73,190,0.12)',

    borderRadius: 21,

    backgroundColor:
      'rgba(255,255,255,0.93)',
  },

  biometricIcon: {
    width: 56,
    height: 56,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 18,

    backgroundColor:
      COLORS.primarySoft,
  },

  biometricCopy: {
    flex: 1,

    marginLeft: 12,
  },

  biometricTitle: {
    color: COLORS.text,

    fontSize: 13,

    fontWeight: '800',
  },

  biometricDescription: {
    marginTop: 4,

    color:
      COLORS.textSecondary,

    fontSize: 10,

    lineHeight: 14,
  },

  spacer: {
    flex: 1,

    minHeight: 16,
  },

  /* BIOMETRIC BUTTON */

  biometricButton: {
    position: 'relative',

    width: '100%',

    minHeight: 58,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 9,

    overflow: 'hidden',

    borderRadius: 21,

    backgroundColor:
      COLORS.primary,

    shadowColor:
      COLORS.primaryDark,

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.23,

    shadowRadius: 12,

    elevation: 6,
  },

  buttonGlowLeft: {
    position: 'absolute',

    top: -38,

    left: -25,

    width: 130,

    height: 130,

    borderRadius: 65,

    backgroundColor:
      'rgba(139,99,216,0.68)',
  },

  buttonGlowRight: {
    position: 'absolute',

    top: -42,

    right: -27,

    width: 140,

    height: 140,

    borderRadius: 70,

    backgroundColor:
      'rgba(216,83,149,0.42)',
  },

  biometricButtonText: {
    color: '#FFFFFF',

    fontSize: 15.5,

    fontWeight: '800',
  },

  buttonArrow: {
    position: 'absolute',

    right: 15,

    width: 31,
    height: 31,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 11,

    backgroundColor:
      'rgba(255,255,255,0.14)',
  },

  buttonPressed: {
    opacity: 0.9,

    transform: [{scale: 0.985}],
  },

  buttonDisabled: {
    opacity: 0.67,
  },

  /* PIN FALLBACK */

  pinFallback: {
    width: '100%',

    minHeight: 54,

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 10,

    paddingHorizontal: 12,

    borderWidth: 1,

    borderColor:
      'rgba(105,73,190,0.17)',

    borderRadius: 19,

    backgroundColor: '#FFFFFF',

    shadowColor: '#60438A',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.04,

    shadowRadius: 7,

    elevation: 1,
  },

  pinFallbackIcon: {
    width: 40,
    height: 40,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor:
      COLORS.primarySoft,
  },

  pinFallbackText: {
    flex: 1,

    marginLeft: 10,

    color: COLORS.primary,

    fontSize: 13,

    fontWeight: '800',
  },

  fallbackPressed: {
    opacity: 0.75,
  },

  /* PRIVACY */

  privacyCard: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 11,

    paddingHorizontal: 12,

    paddingVertical: 10,

    borderWidth: 1,

    borderColor:
      'rgba(93,167,127,0.14)',

    borderRadius: 18,

    backgroundColor:
      'rgba(249,255,252,0.94)',
  },

  privacyIcon: {
    width: 39,
    height: 39,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor:
      COLORS.greenSoft,
  },

  privacyCopy: {
    flex: 1,

    marginLeft: 9,
  },

  privacyTitle: {
    color: COLORS.text,

    fontSize: 10.8,

    fontWeight: '800',
  },

  privacyText: {
    marginTop: 2,

    color:
      COLORS.textSecondary,

    fontSize: 9.2,

    lineHeight: 13,
  },
});