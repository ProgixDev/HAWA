import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

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
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {
  withAlpha,
  type ResolvedAwaTheme,
} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'FaceIdSetup'
>;

type Mode = 'enable' | 'manage' | 'disable';

export default function FaceIdSetupScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
          text: t('faceIdSetup.unavailable'),
        });
      });
    // Runs once on mount only, matching the pre-localization behavior
    // exactly; `t` is intentionally excluded so a language switch never
    // re-triggers the biometry detection call itself (only re-renders
    // translated copy).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = capability?.label ?? t('biometrics.genericLabel');

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
        text: t('faceIdSetup.noCapability'),
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
          text: t('faceIdSetup.authFailedOrCancelled'),
        });

        return;
      }

      if (mode === 'enable') {
        await setBiometricEnabled(true);

        setMessage({
          type: 'success',
          text: t('faceIdSetup.enabledSuccess', {label}),
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
          text: t('faceIdSetup.disabledSuccess', {label}),
        });

        setTimeout(() => {
          navigation.goBack();
        }, 500);

        return;
      }

    } catch {
      setMessage({
        type: 'error',
        text: t('security.authCancelledOrUnavailable'),
      });
    } finally {
      setLoading(false);
    }
  };

  const title =
    action === 'enable'
      ? t('faceIdSetup.enableTitle', {label})
      : t('faceIdSetup.manageTitle', {label});

  const subtitle = capability
    ? t('faceIdSetup.subtitleAvailable')
    : t('faceIdSetup.subtitleUnavailable');

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.page}>

      <SafeAreaView style={styles.safe}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
        />

        {/* TOP BAR — fixed above the scroll area so it's always reachable */}

        <View
          style={[
            styles.topBar,
            {paddingTop: Math.max(insets.top, 16) + 4},
          ]}>
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            icon="arrow-left"
            onPress={navigation.goBack}
          />

          <View style={styles.securityBadge}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={15}
              color={theme.colors.primary}
            />

            <AwaText colorRole="onPrimaryContainer" emphasized variant="labelSmall">
              {t('faceIdSetup.securityBadge')}
            </AwaText>
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
            <MaterialDesignIcons
              name={biometricIcon}
              size={56}
              color={theme.colors.primary}
            />
          </View>

          {/* TITLE */}

          <AwaText accessibilityRole="header" style={styles.title} variant="headlineMedium">{title}</AwaText>

          <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
            {subtitle}
          </AwaText>

          {/* SECURITY CARD */}

          <AwaCard padding="default" style={styles.securityCard} variant="filled">
            <MaterialDesignIcons
              name="cellphone-lock"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.securityCardCopy}>
              <AwaText variant="titleSmall">
                {t('faceIdSetup.secureVerificationTitle')}
              </AwaText>

              <AwaText colorRole="onSurfaceVariant" style={styles.securityCardText} variant="bodySmall">
                {t('faceIdSetup.secureVerificationText')}
              </AwaText>
            </View>
          </AwaCard>

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
                      ? theme.colors.success
                      : theme.colors.danger
                  }
                />
              </View>

              <AwaText
                colorRole={message.type === 'success' ? 'success' : 'error'}
                style={styles.messageText}
                variant="bodySmall">
                {message.text}
              </AwaText>
            </View>
          ) : null}

          <View style={styles.spacer} />

          {/* LOADING */}

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator
                color={theme.colors.primary}
                size="large"
              />

              <AwaText colorRole="onSurfaceVariant" style={styles.loadingText} variant="bodySmall">
                {t('faceIdSetup.verifyingBiometrics')}
              </AwaText>
            </View>
          ) : action === 'enable' ? (
            <>
              <AwaButton
                fullWidth
                icon={biometricIcon}
                label={t('faceIdSetup.enableTitle', {label})}
                onPress={() => run('enable')}
                size="large"
              />

              <AwaText colorRole="onSurfaceVariant" style={styles.footerHint} variant="bodySmall">
                {t('faceIdSetup.footerHint')}
              </AwaText>
            </>
          ) : (
            <>
              <AwaButton
                icon="lock-off-outline"
                label={t('faceIdSetup.disableAction', {label})}
                onPress={() => {
                  setAction('disable');
                  run('disable');
                }}
                style={styles.danger}
                variant="destructive"
              />
            </>
          )}
        </ScrollView>
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

  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,

    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.10),

    borderRadius: 16,

    backgroundColor: theme.colors.primarySoft,

    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  hero: {
    alignSelf: 'center',
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    alignSelf: 'center',
    maxWidth: 335,
    marginTop: 8,
    textAlign: 'center',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  securityCardCopy: {
    flex: 1,

    minWidth: 0,

    marginLeft: 11,
  },

  securityCardText: {
    marginTop: 4,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 9,

    marginTop: 14,

    borderRadius: 16,

    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  successMessage: {
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.success, 0.17),

    backgroundColor: withAlpha(theme.colors.success, 0.12),
  },

  errorMessage: {
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.danger, 0.14),

    backgroundColor: withAlpha(theme.colors.danger, 0.10),
  },

  messageIcon: {
    width: 32,
    height: 32,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 12,
  },

  successIcon: {
    backgroundColor: theme.colors.surface,
  },

  errorIcon: {
    backgroundColor: theme.colors.surface,
  },

  messageText: {
    flex: 1,
  },



  spacer: {
    flex: 1,
    minHeight: 24,
  },

  loadingCard: {
    alignItems: 'center',

    paddingVertical: 18, paddingHorizontal: 12,

    borderRadius: 12,

    backgroundColor:
      withAlpha(theme.colors.surface, 0.78),
  },

  loadingText: {
    marginTop: 10,
  },







  footerHint: {
    alignSelf: 'center',
    maxWidth: 300,
    marginTop: 12,
    textAlign: 'center',
  },





  danger: {
    alignSelf: 'center',
    marginTop: 12,
  },


  pressed: {
    opacity: 0.7,
  },
  });
}