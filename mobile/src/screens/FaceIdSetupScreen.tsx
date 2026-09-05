import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
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
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  disableBiometricCredential,
  enableBiometricCredential,
  getAvailableBiometry,
  type BiometryCapability,
} from '../services/appSecurityService';
import {
  isBiometricEnabled,
  setBiometricEnabled,
} from '../state/securityPreferences';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'FaceIdSetup'
>;

type Mode = 'enable' | 'manage' | 'disable';

const COLORS = {
  primary: '#6949BE',
  primaryDark: '#321D79',
  primarySoft: '#EEE5FB',
  pink: '#D95397',
  pinkSoft: '#FCEAF3',
  text: '#26184F',
  textSecondary: '#675B7F',
  white: '#FFFFFF',
  border: 'rgba(105,73,190,0.13)',
  success: '#5EA77F',
  successSoft: '#EAF6EF',
  danger: '#C74669',
  dangerSoft: '#FFF0F4',
};

export default function FaceIdSetupScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const [action, setAction] = useState<Mode>(
    route.params?.action ??
      (isBiometricEnabled() ? 'manage' : 'enable'),
  );

  const [capability, setCapability] =
    useState<BiometryCapability | null>(null);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  useEffect(() => {
    getAvailableBiometry()
      .then(value => {
        setCapability(value);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setMessage({
          type: 'error',
          text: 'La biométrie n’est pas disponible sur cet appareil.',
        });
      });
  }, []);

  const label = capability?.label ?? 'Biométrie';

  const biometricIcon = useMemo(
    () =>
      label === 'Face ID'
        ? 'face-recognition'
        : 'fingerprint',
    [label],
  );

  const run = async (
    mode: 'enable' | 'disable',
  ) => {
    if (loading || !capability) {
      setMessage({
        type: 'error',
        text: 'Aucune méthode biométrique n’est configurée sur cet appareil.',
      });

      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const ok =
        mode === 'enable'
          ? await enableBiometricCredential()
          : await disableBiometricCredential();

      if (!ok) {
        setMessage({
          type: 'error',
          text: 'Authentification impossible ou annulée.',
        });

        return;
      }

      if (mode === 'enable') {
        await setBiometricEnabled(true);

        setMessage({
          type: 'success',
          text: `${label} est maintenant activé.`,
        });

        setTimeout(() => {
          navigation.goBack();
        }, 500);

        return;
      }

      if (mode === 'disable') {
        await setBiometricEnabled(false);

        setMessage({
          type: 'success',
          text: `${label} a été désactivé.`,
        });

        setTimeout(() => {
          navigation.goBack();
        }, 500);

        return;
      }

    } catch {
      setMessage({
        type: 'error',
        text: 'Authentification annulée ou indisponible.',
      });
    } finally {
      setLoading(false);
    }
  };

  const title =
    action === 'enable'
      ? `Activer ${label}`
      : `Gérer ${label}`;

  const subtitle = capability
    ? 'Protège l’accès à AWA avec la biométrie sécurisée de ton appareil.'
    : 'Aucune méthode biométrique utilisable n’a été détectée.';

  return (
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.page}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <SafeAreaView style={styles.safe}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />

        {/* TOP BAR — fixed above the scroll area so it's always reachable */}

        <View
          style={[
            styles.topBar,
            {paddingTop: Math.max(insets.top, 16) + 4},
          ]}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            onPress={navigation.goBack}
            style={({pressed}) => [
              styles.back,
              pressed && styles.pressed,
            ]}>
            <MaterialDesignIcons
              name="arrow-left"
              size={24}
              color={COLORS.primary}
            />
          </Pressable>

          <View style={styles.securityBadge}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={15}
              color={COLORS.primary}
            />

            <Text style={styles.securityBadgeText}>
              Sécurité
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: Math.max(
                insets.bottom,
                18,
              ),
            },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* HERO */}

          <View style={styles.hero}>
            <View style={styles.glowOuter}>
              <View style={styles.glowMiddle}>
                <View style={styles.biometricCircle}>
                  <MaterialDesignIcons
                    name={biometricIcon}
                    size={52}
                    color={COLORS.primary}
                  />
                </View>
              </View>
            </View>

            <View style={styles.miniShield}>
              <MaterialDesignIcons
                name="lock-outline"
                size={15}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* TITLE */}

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.subtitle}>
            {subtitle}
          </Text>

          {/* SECURITY CARD */}

          <View style={styles.securityCard}>
            <View style={styles.securityCardIcon}>
              <MaterialDesignIcons
                name="cellphone-lock"
                size={24}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.securityCardCopy}>
              <Text style={styles.securityCardTitle}>
                Vérification sécurisée
              </Text>

              <Text style={styles.securityCardText}>
                AWA utilise uniquement le dialogue
                biométrique natif de ton appareil.
                Aucune donnée biométrique n’est stockée
                dans l’application.
              </Text>
            </View>
          </View>

          {/* MESSAGE */}

          {message ? (
            <View
              accessibilityRole="alert"
              style={[
                styles.message,
                message.type === 'success'
                  ? styles.successMessage
                  : styles.errorMessage,
              ]}>
              <View
                style={[
                  styles.messageIcon,
                  message.type === 'success'
                    ? styles.successIcon
                    : styles.errorIcon,
                ]}>
                <MaterialDesignIcons
                  name={
                    message.type === 'success'
                      ? 'check'
                      : 'alert-outline'
                  }
                  size={18}
                  color={
                    message.type === 'success'
                      ? COLORS.success
                      : COLORS.danger
                  }
                />
              </View>

              <Text
                style={[
                  styles.messageText,
                  message.type === 'success'
                    ? styles.successText
                    : styles.errorText,
                ]}>
                {message.text}
              </Text>
            </View>
          ) : null}

          <View style={styles.spacer} />

          {/* LOADING */}

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator
                color={COLORS.primary}
                size="large"
              />

              <Text style={styles.loadingText}>
                Vérification de la biométrie…
              </Text>
            </View>
          ) : action === 'enable' ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => run('enable')}
                style={({pressed}) => [
                  styles.primary,
                  pressed && styles.primaryPressed,
                ]}>
                <View style={styles.primaryGlowLeft} />
                <View style={styles.primaryGlowRight} />

                <MaterialDesignIcons
                  name={biometricIcon}
                  size={23}
                  color="#FFFFFF"
                />

                <Text style={styles.primaryText}>
                  Activer {label}
                </Text>

                <View style={styles.primaryArrow}>
                  <MaterialDesignIcons
                    name="arrow-right"
                    size={17}
                    color="#FFFFFF"
                  />
                </View>
              </Pressable>

              <Text style={styles.footerHint}>
                Tu pourras désactiver cette option à
                tout moment dans les réglages.
              </Text>
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setAction('disable');
                  run('disable');
                }}
                style={({pressed}) => [
                  styles.danger,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="lock-off-outline"
                  size={18}
                  color={COLORS.danger}
                />

                <Text style={styles.dangerText}>
                  Désactiver {label}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F8EFFF',
  },

  pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},

  pageGlowTop: {
    position: 'absolute', top: -150, right: -110, width: 330, height: 330,
    borderRadius: 165, backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },
  pageGlowMiddle: {
    position: 'absolute', top: '38%', left: -130, width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },
  pageGlowBottom: {
    position: 'absolute', bottom: -150, right: -100, width: 310, height: 310,
    borderRadius: 155, backgroundColor: 'rgba(92, 67, 139, 0.05)',
  },

  safe: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  back: {
    width: 44,
    height: 44,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.10)',

    borderRadius: 17,

    backgroundColor: 'rgba(255,255,255,0.94)',

    shadowColor: '#4A2A7D',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 9,

    elevation: 2,
  },

  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.10)',

    borderRadius: 15,

    backgroundColor: 'rgba(246,239,252,0.94)',

    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  securityBadgeText: {
    color: COLORS.primary,

    fontSize: 10,
    fontWeight: '800',
  },

  hero: {
    position: 'relative',

    alignSelf: 'center',

    width: 150,
    height: 150,

    marginTop: 42,

    alignItems: 'center',
    justifyContent: 'center',
  },

  glowOuter: {
    width: 146,
    height: 146,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 73,

    backgroundColor: 'rgba(188,153,236,0.12)',
  },

  glowMiddle: {
    width: 122,
    height: 122,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 61,

    backgroundColor: 'rgba(171,134,229,0.18)',
  },

  biometricCircle: {
    width: 94,
    height: 94,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.16)',

    borderRadius: 47,

    backgroundColor: '#FFFFFF',

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.14,
    shadowRadius: 15,

    elevation: 5,
  },

  miniShield: {
    position: 'absolute',

    right: 16,
    bottom: 17,

    width: 32,
    height: 32,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 3,
    borderColor: '#F8EFFF',

    borderRadius: 16,

    backgroundColor: COLORS.primary,
  },

  title: {
    marginTop: 23,

    color: COLORS.text,

    fontFamily: 'serif',

    fontSize: 28,
    lineHeight: 34,

    fontWeight: '700',

    textAlign: 'center',
  },

  subtitle: {
    alignSelf: 'center',

    maxWidth: 335,

    marginTop: 9,

    color: COLORS.textSecondary,

    fontSize: 13,
    lineHeight: 20,

    textAlign: 'center',
  },

  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 24,

    padding: 14,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 20,

    backgroundColor:
      'rgba(255,255,255,0.92)',

    shadowColor: '#6C4A9C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,

    elevation: 1,
  },

  securityCardIcon: {
    width: 46,
    height: 46,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 15,

    backgroundColor: COLORS.primarySoft,
  },

  securityCardCopy: {
    flex: 1,

    minWidth: 0,

    marginLeft: 11,
  },

  securityCardTitle: {
    color: COLORS.text,

    fontSize: 12.5,
    fontWeight: '800',
  },

  securityCardText: {
    marginTop: 4,

    color: COLORS.textSecondary,

    fontSize: 9.8,
    lineHeight: 14,
  },

  message: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 9,

    marginTop: 14,

    borderRadius: 16,

    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  successMessage: {
    borderWidth: 1,
    borderColor: 'rgba(94,167,127,0.17)',

    backgroundColor: COLORS.successSoft,
  },

  errorMessage: {
    borderWidth: 1,
    borderColor: 'rgba(199,70,105,0.14)',

    backgroundColor: COLORS.dangerSoft,
  },

  messageIcon: {
    width: 32,
    height: 32,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 11,
  },

  successIcon: {
    backgroundColor: '#FFFFFF',
  },

  errorIcon: {
    backgroundColor: '#FFFFFF',
  },

  messageText: {
    flex: 1,

    fontSize: 10.5,
    lineHeight: 15,
  },

  successText: {
    color: '#437A5E',
  },

  errorText: {
    color: '#9B3854',
  },

  spacer: {
    flex: 1,
    minHeight: 24,
  },

  loadingCard: {
    alignItems: 'center',

    paddingVertical: 18,

    borderRadius: 20,

    backgroundColor:
      'rgba(255,255,255,0.78)',
  },

  loadingText: {
    marginTop: 10,

    color: COLORS.textSecondary,

    fontSize: 11,
  },

  primary: {
    position: 'relative',

    width: '100%',
    height: 58,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 9,

    overflow: 'hidden',

    borderRadius: 20,

    backgroundColor: COLORS.primary,

    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.23,
    shadowRadius: 12,

    elevation: 6,
  },

  primaryGlowLeft: {
    position: 'absolute',

    top: -35,
    left: -24,

    width: 120,
    height: 120,

    borderRadius: 60,

    backgroundColor:
      'rgba(139,99,216,0.65)',
  },

  primaryGlowRight: {
    position: 'absolute',

    top: -40,
    right: -25,

    width: 130,
    height: 130,

    borderRadius: 65,

    backgroundColor:
      'rgba(217,83,151,0.40)',
  },

  primaryPressed: {
    opacity: 0.9,

    transform: [{scale: 0.985}],
  },

  primaryText: {
    color: '#FFFFFF',

    fontSize: 16,
    fontWeight: '800',
  },

  primaryArrow: {
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

  footerHint: {
    alignSelf: 'center',

    maxWidth: 300,

    marginTop: 12,

    color: '#7B6C91',

    fontSize: 9.8,
    lineHeight: 14,

    textAlign: 'center',
  },





  danger: {
    alignSelf: 'center',

    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    marginTop: 11,

    paddingHorizontal: 14,
    paddingVertical: 12,

    borderRadius: 15,

    backgroundColor: COLORS.dangerSoft,
  },

  dangerText: {
    color: COLORS.danger,

    fontSize: 12.5,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.7,
  },
});