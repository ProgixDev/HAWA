import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getTopPadding,
  spacing,
} from '../theme/spacing';
import {
  getPrivacySecuritySettings,
  isBiometricEnabled,
  isPinEnabled,
  loadSecurityPreferences,
  updatePrivacySecuritySettings,
} from '../state/securityPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {
  withAlpha,
  type ResolvedAwaTheme,
} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaSwitch} from '../components/ui/AwaSwitch';
import {AwaText} from '../components/ui/AwaText';

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    'SecuritySetup'
  >;

type IconName =
  React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];

type OptionProps = {
  compact: boolean;
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (
    value: boolean,
  ) => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<
    typeof createStyles
  >;
  t: (key: string) => string;
};

function SecurityOption({
  compact,
  icon,
  title,
  description,
  value,
  onValueChange,
  theme,
  styles,
  t,
}: OptionProps): React.JSX.Element {
  return (
    <AwaCard
      padding="compact"
      style={[
        styles.option,
        compact &&
          styles.optionCompact,
      ]}
      variant="filled">
      <View
        style={[
          styles.iconBox,
          value &&
            styles.iconBoxActive,
          compact &&
            styles.iconBoxCompact,
        ]}>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={icon}
          size={compact ? 23 : 26}
        />
      </View>

      <View
        style={
          styles.optionCopy
        }>
        <View
          style={
            styles.optionTitleRow
          }>
          <AwaText variant="titleMedium">
            {title}
          </AwaText>

          {value ? (
            <View
              style={
                styles.activeBadge
              }>
              <MaterialDesignIcons
                color={theme.colors.success}
                name="check"
                size={12}
              />

              <AwaText colorRole="success" emphasized variant="labelSmall">
                {t('security.enabled')}
              </AwaText>
            </View>
          ) : null}
        </View>

        <AwaText
          colorRole="onSurfaceVariant"
          style={styles.optionDescription}
          variant="bodySmall">
          {description}
        </AwaText>
      </View>

      <AwaSwitch
        accessibilityLabel={title}
        onValueChange={
          onValueChange
        }
        value={value}
      />
    </AwaCard>
  );
}

function SecuritySetupScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();

  const styles = useMemo(
    () => createStyles(theme),
    [theme],
  );

  const insets =
    useSafeAreaInsets();

  const {
    height,
    width,
  } =
    useWindowDimensions();

  const compact =
    height < 740 ||
    width < 370;

  const [
    pin,
    setPin,
  ] =
    useState(
      isPinEnabled(),
    );

  const [
    biometric,
    setBiometric,
  ] =
    useState(
      isBiometricEnabled(),
    );

  const [
    notifications,
    setNotifications,
  ] =
    useState(
      getPrivacySecuritySettings()
        .discreetNotifications,
    );

  const refresh =
    useCallback(() => {
      setPin(
        isPinEnabled(),
      );

      setBiometric(
        isBiometricEnabled(),
      );

      setNotifications(
        getPrivacySecuritySettings()
          .discreetNotifications,
      );
    }, []);

  useEffect(() => {
    loadSecurityPreferences().then(
      refresh,
    );
  }, [refresh]);

  useFocusEffect(refresh);

  const enabledCount = [
    pin,
    biometric,
    notifications,
  ].filter(Boolean).length;

  return (
    <LinearGradient
      colors={[
        ...theme.gradients.pageBackground,
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
      style={
        styles.page
      }>
      {/* SAME EXISTING BACKGROUND */}


      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
      />

      {/* BACK BUTTON */}

      <View
        style={[
          styles.header,
          {
            paddingTop:
              getTopPadding(
                insets.top,
              ),
          },
        ]}>
        <AwaIconButton
          accessibilityLabel={t('common.back')}
          hitSlop={12}
          icon="arrow-left"
          onPress={
            navigation.goBack
          }
          style={styles.back}
        />
      </View>

      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          compact &&
            styles.contentCompact,
          {
            paddingBottom:
              Math.max(
                insets.bottom,
                14,
              ) + 18,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }>
        {/* ==========================================
            PREMIUM HERO
        ========================================== */}

        <View
          style={[
            styles.hero,
            compact &&
              styles.heroCompact,
          ]}>
          <AwaText
            accessibilityRole="header"
            style={styles.title}
            variant={compact ? 'headlineSmall' : 'headlineMedium'}>
            {t('securitySetup.heroTitle')}
          </AwaText>

          <AwaText
            colorRole="onSurfaceVariant"
            style={[
              styles.subtitle,
              compact &&
                styles.subtitleCompact,
            ]}
            variant="bodyMedium">
            {t('securitySetup.heroSubtitle')}
          </AwaText>
        </View>

        {/* ==========================================
            SECURITY STATUS
        ========================================== */}

        <AwaCard
          padding="compact"
          style={[
            styles.statusCard,
            compact &&
              styles.statusCardCompact,
          ]}
          variant="filled">
          <MaterialDesignIcons
            color={theme.colors.success}
            name="shield-check-outline"
            size={22}
          />

          <View
            style={
              styles.statusCopy
            }>
            <AwaText variant="titleSmall">
              {t('securitySetup.statusCardTitle')}
            </AwaText>

            <AwaText
              colorRole="onSurfaceVariant"
              style={styles.statusText}
              variant="bodySmall">
              {enabledCount === 0
                ? t('securitySetup.statusNoneActive')
                : t('securitySetup.statusActiveCount', {count: enabledCount})}
            </AwaText>
          </View>

          <View
            style={
              styles.statusCounter
            }>
            <AwaText colorRole="onPrimaryContainer" emphasized variant="labelMedium">
              {enabledCount}/3
            </AwaText>
          </View>
        </AwaCard>

        {/* ==========================================
            OPTIONS
        ========================================== */}

        <View
          style={
            styles.sectionHeading
          }>
          <AwaText accessibilityRole="header" variant="titleMedium">
            {t('securitySetup.sectionTitle')}
          </AwaText>

          <AwaText
            colorRole="onSurfaceVariant"
            style={styles.sectionSubtitle}
            variant="bodySmall">
            {t('securitySetup.sectionSubtitle')}
          </AwaText>
        </View>

        <View
          style={[
            styles.options,
            compact &&
              styles.optionsCompact,
          ]}>
          <SecurityOption
            compact={compact}
            description={t('securitySetup.pinDescription')}
            icon="dialpad"
            onValueChange={value =>
              navigation.navigate(
                'PinSetup',
                {
                  mode: value
                    ? 'create'
                    : 'disable',

                  returnTo:
                    'onboarding',
                },
              )
            }
            styles={styles}
            t={t}
            theme={theme}
            title={t('securitySetup.pinTitle')}
            value={pin}
          />

          <SecurityOption
            compact={compact}
            description={t('securitySetup.biometricsDescription')}
            icon="fingerprint"
            onValueChange={value =>
              navigation.navigate(
                'FaceIdSetup',
                {
                  action: value
                    ? 'enable'
                    : 'manage',
                },
              )
            }
            styles={styles}
            t={t}
            theme={theme}
            title={t('securitySetup.biometricsTitle')}
            value={biometric}
          />

          <SecurityOption
            compact={compact}
            description={t('securitySetup.discreetNotificationsDescription')}
            icon="eye-off-outline"
            onValueChange={value => {
              setNotifications(
                value,
              );

              updatePrivacySecuritySettings(
                {
                  discreetNotifications:
                    value,

                  hideNotificationPreview:
                    value,
                },
              );
            }}
            styles={styles}
            t={t}
            theme={theme}
            title={t('securitySetup.discreetNotificationsTitle')}
            value={notifications}
          />
        </View>

        {/* ==========================================
            PRIVATE INFO
        ========================================== */}

        <AwaCard
          padding="compact"
          style={[
            styles.info,
            compact &&
              styles.infoCompact,
          ]}
          variant="filled">
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="shield-check-outline"
            size={
              compact
                ? 21
                : 24
            }
          />

          <View
            style={
              styles.infoCopy
            }>
            <AwaText variant="titleSmall">
              {t('securitySetup.infoTitle')}
            </AwaText>

            <AwaText
              colorRole="onSurfaceVariant"
              style={styles.infoText}
              variant="bodySmall">
              {t('securitySetup.infoText')}
            </AwaText>
          </View>
        </AwaCard>

        <View
          style={
            styles.buttonGap
          }
        />

        {/* ==========================================
            CTA
        ========================================== */}

        <AwaButton
          fullWidth
          label={t('common.continue')}
          onPress={() =>
            route.params?.mode === 'edit'
              ? navigation.goBack()
              : navigation.navigate(
                  'Privacy',
                )
          }
          size="large"
          style={styles.continueButton}
        />
      </ScrollView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    /* ==============================================
       SAME BACKGROUND
    ============================================== */

    page: {
      flex: 1,
      backgroundColor:
        theme.colors.background,
    },





    /* ==============================================
       HEADER
    ============================================== */

    header: {
      paddingHorizontal: 18,
      paddingBottom: 2,
    },

    back: {
      alignSelf: 'flex-start',
    },

    /* ==============================================
       CONTENT
    ============================================== */

    content: {
      flexGrow: 1,
      paddingHorizontal:
        spacing.md,
    },

    contentCompact: {
      paddingHorizontal: 14,
    },

    /* ==============================================
       HERO
    ============================================== */

    hero: {
      alignItems: 'center',
      paddingTop: 2,
      paddingBottom: 20,
    },

    heroCompact: {
      paddingBottom: 14,
    },
    title: {
      marginTop: 4,
      textAlign: 'center',
    },
    subtitle: {
      maxWidth: 340,
      marginTop: 8,
      textAlign: 'center',
    },
    subtitleCompact: {
      maxWidth: 300,
      marginTop: 6,
    },
    /* ==============================================
       STATUS
    ============================================== */

    statusCard: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    statusCardCompact: {
      minHeight: 56,
      marginBottom: 12,
    },
    statusCopy: {
      flex: 1,
      minWidth: 0,
    },
    statusText: {
      marginTop: 2,
    },
    statusCounter: {
      minWidth: 40,
      minHeight: 32,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor:
        theme.colors.primarySoft,
    },
    /* ==============================================
       SECTION
    ============================================== */
    sectionHeading: {
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionSubtitle: {
      marginTop: 4,
    },
    /* ==============================================
       OPTIONS
    ============================================== */

    options: {
      gap: 11,
    },

    optionsCompact: {
      gap: 8,
    },

    option: {
      minHeight: 88,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionCompact: {
      minHeight: 76,
    },
    iconBox: {
      width: 55,
      height: 55,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 16,
      backgroundColor:
        theme.colors.primarySoft,
    },

    iconBoxActive: {
      borderWidth: 1,
      borderColor:
        withAlpha(theme.colors.primary, 0.12),
      backgroundColor:
        withAlpha(theme.colors.primary, 0.16),
    },

    iconBoxCompact: {
      width: 48,
      height: 48,
      borderRadius: 16,
    },

    optionCopy: {
      flex: 1,
      minWidth: 0,
      marginHorizontal: 11,
    },

    optionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },

    optionDescription: {
      marginTop: 4,
    },
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor:
        withAlpha(theme.colors.success, 0.14),
    },

    /* ==============================================
       INFO
    ============================================== */

    info: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 16,
    },
    infoCompact: {
      minHeight: 64,
      marginTop: 12,
    },
    infoCopy: {
      flex: 1,
      minWidth: 0,
    },
    infoText: {
      marginTop: 4,
    },
    /* ==============================================
       BUTTON
    ============================================== */

    buttonGap: {
      flex: 1,
      minHeight: 20,
    },

    continueButton: {
      marginTop: 20,
    },
  });
}

export default SecuritySetupScreen;