import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Image, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getPrivacySecuritySettings,
  isBiometricEnabled,
  isPinEnabled,
  loadSecurityPreferences,
  subscribePrivacySecuritySettings,
  subscribeSecurityPreferences,
} from '../state/securityPreferences';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

const HERO = require('../assets/images/privacy/anonymous-mode-woman.png');

type Props = NativeStackScreenProps<RootStackParamList, 'AnonymousMode'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const PRIVACY_ROW_ICONS: ReadonlyArray<{key: string; icon: IconName; titleKey: string}> = [
  {key: 'name', icon: 'account-off-outline', titleKey: 'anonymous.mode.privacyRowName'},
  {key: 'email', icon: 'email-off-outline', titleKey: 'anonymous.mode.privacyRowEmail'},
  {key: 'account', icon: 'link-off', titleKey: 'anonymous.mode.privacyRowAccount'},
  {key: 'profile', icon: 'shield-account-outline', titleKey: 'anonymous.mode.privacyRowProfile'},
];

// What is/isn't retained while Anonymous Mode is active — shown on the
// management view (spec: "E-mail / Nom / Identifiants techniques — Non
// conservés"). Kept separate from PRIVACY_ROW_ICONS above (that one explains
// the onboarding promise before activation; this one confirms it afterwards).
const RETENTION_ROW_ICONS: ReadonlyArray<{key: string; icon: IconName; labelKey: string}> = [
  {key: 'email', icon: 'email-off-outline', labelKey: 'anonymous.mode.retentionEmail'},
  {key: 'name', icon: 'account-off-outline', labelKey: 'anonymous.mode.retentionName'},
  {key: 'technical', icon: 'key-outline', labelKey: 'anonymous.mode.retentionTechnical'},
];

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

export default function AnonymousModeScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const PRIVACY_ROWS = PRIVACY_ROW_ICONS.map(row => ({...row, title: t(row.titleKey)}));
  const RETENTION_ROWS = RETENTION_ROW_ICONS.map(row => ({...row, label: t(row.labelKey)}));
  const insets = useSafeAreaInsets();
  const source = route.params?.source;
  const [enabled, setEnabled] = useState(() => getPrivacySecuritySettings().anonymousMode);
  const [locked, setLocked] = useState(() => isPinEnabled() || isBiometricEnabled());

  const refresh = useCallback(() => {
    setEnabled(getPrivacySecuritySettings().anonymousMode);
    setLocked(isPinEnabled() || isBiometricEnabled());
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSecurityPreferences().then(() => {if (active) {refresh();}});
      const unsubscribeSettings = subscribePrivacySecuritySettings(refresh);
      const unsubscribeSecurity = subscribeSecurityPreferences(refresh);
      return () => {
        active = false;
        unsubscribeSettings();
        unsubscribeSecurity();
      };
    }, [refresh]),
  );

  const proceed = () => {
    navigation.navigate('AnonymousModeLimitations', {source});
  };

  // Already active — management view instead of the onboarding pitch. Does
  // NOT restart activation and does NOT disable Anonymous Mode from here;
  // that only happens after a real account is created (RegistrationScreen).
  if (enabled) {
    return (
      <View style={styles.page}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

        

        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
          <View style={styles.header}>
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              hitSlop={10}
              icon="arrow-left"
              onPress={navigation.goBack}
              variant="standard"
            />

            <View style={styles.headerTitleBlock}>
              <AwaText accessibilityRole="header" variant="titleMedium">{t('anonymous.mode.headerTitle')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{t('anonymous.mode.headerSubtitle')}</AwaText>
            </View>

            <View style={styles.headerSpace} />
          </View>

          <ScrollView
            contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 24}]}
            showsVerticalScrollIndicator={false}>
            <FadeInUp distance={10}>
              <View style={styles.hero}>
                <Image accessibilityLabel={t('anonymous.mode.illustrationA11y')} resizeMode="contain" source={HERO} style={styles.heroImage} />

                <AwaText style={styles.title} variant="headlineSmall">{t('anonymous.mode.activeTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
                  {t('anonymous.mode.activeSubtitle')}
                </AwaText>
              </View>
            </FadeInUp>

            <FadeInUp delay={90}>
              <AwaCard style={styles.card} variant="filled">
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderIcon}>
                    <MaterialDesignIcons color={theme.colors.primary} name="shield-check-outline" size={22} />
                  </View>
                  <View style={styles.cardHeaderCopy}>
                    <AwaText variant="titleMedium">{t('anonymous.mode.nothingKeptTitle')}</AwaText>
                    <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                      {t('anonymous.mode.nothingKeptSubtitle')}
                    </AwaText>
                  </View>
                </View>

                <View style={styles.rowsGroup}>
                  {RETENTION_ROWS.map((row, index) => (
                    <View key={row.key} style={[styles.row, index < RETENTION_ROWS.length - 1 && styles.rowBorder]}>
                      <View style={styles.rowIcon}>
                        <MaterialDesignIcons color={theme.colors.accent} name={row.icon} size={19} />
                      </View>
                      <AwaText style={styles.rowTitle} variant="bodyMedium">{row.label}</AwaText>
                      <View style={styles.rowStatus}>
                        <AwaText colorRole="success" emphasized variant="labelMedium">{t('anonymous.mode.notRetained')}</AwaText>
                        <MaterialDesignIcons color={theme.colors.success} name="check-circle" size={16} />
                      </View>
                    </View>
                  ))}
                </View>
              </AwaCard>
            </FadeInUp>
            <FadeInUp delay={150}>
              <AwaCard
                accessibilityLabel={t('anonymous.mode.appLockA11y')}
                onPress={() => navigation.navigate('PrivacySecurity')}
                padding="compact"
                style={styles.securityCard}
                variant="filled">
                <View style={styles.securityIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="shield-key-outline" size={22} />
                </View>
                <View style={styles.securityCopy}>
                  <AwaText variant="titleSmall">{t('anonymous.mode.appLockTitle')}</AwaText>
                  <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{t('anonymous.mode.appLockText')}</AwaText>
                </View>
                <AwaText colorRole="primary" emphasized variant="labelMedium">{locked ? t('anonymous.mode.appLockEnabled') : t('anonymous.mode.appLockDisabled')}</AwaText>
                <MaterialDesignIcons color={theme.colors.textSecondary} name="chevron-right" size={20} />
              </AwaCard>
            </FadeInUp>
            <FadeInUp delay={210}>
              <AwaCard style={styles.conversionCard} variant="filled">
                <AwaText variant="titleMedium">{t('anonymous.mode.disableTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                  {t('anonymous.mode.disableText')}
                </AwaText>

                <AwaButton
                  accessibilityLabel={t('auth.shared.tabRegister')}
                  fullWidth
                  icon="account-plus-outline"
                  label={t('auth.shared.tabRegister')}
                  onPress={() => navigation.navigate('Registration')}
                  style={styles.secondaryButton}
                  variant="outlined"
                />
              </AwaCard>
            </FadeInUp>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

      

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.header}>
          <AwaIconButton
              accessibilityLabel={t('common.back')}
              hitSlop={10}
              icon="arrow-left"
              onPress={navigation.goBack}
              variant="standard"
            />

          <View style={styles.headerTitleBlock}>
            <AwaText accessibilityRole="header" variant="titleMedium">{t('anonymous.mode.headerTitle')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{t('anonymous.mode.headerSubtitle')}</AwaText>
          </View>

          <View style={styles.headerSpace} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 96}]}
          showsVerticalScrollIndicator={false}>
          <FadeInUp distance={10}>
            <View style={styles.hero}>
              <Image accessibilityLabel={t('anonymous.mode.illustrationA11y')} resizeMode="contain" source={HERO} style={styles.heroImage} />

              <AwaText style={styles.title} variant="headlineSmall">{t('anonymous.mode.pitchTitle')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
                {t('anonymous.mode.pitchSubtitle')}
              </AwaText>
            </View>
          </FadeInUp>

          <FadeInUp delay={90}>
            <AwaCard style={styles.card} variant="filled">
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="shield-lock-outline" size={22} />
                </View>
                <View style={styles.cardHeaderCopy}>
                  <AwaText variant="titleMedium">{t('anonymous.mode.identityPrivateTitle')}</AwaText>
                  <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                    {t('anonymous.mode.identityPrivateSubtitle')}
                  </AwaText>
                </View>
              </View>

              <View style={styles.rowsGroup}>
                {PRIVACY_ROWS.map((row, index) => (
                  <View key={row.key} style={[styles.row, index < PRIVACY_ROWS.length - 1 && styles.rowBorder]}>
                    <View style={styles.rowIcon}>
                      <MaterialDesignIcons color={theme.colors.accent} name={row.icon} size={19} />
                    </View>
                    <AwaText style={styles.rowTitle} variant="bodyMedium">{row.title}</AwaText>
                    <MaterialDesignIcons color={theme.colors.success} name="check-circle" size={18} />
                  </View>
                ))}
              </View>
            </AwaCard>
          </FadeInUp>
          <FadeInUp delay={160}>
            <AwaCard padding="compact" style={styles.infoCard} variant="filled">
              <MaterialDesignIcons color={theme.colors.accent} name="information-outline" size={19} />
              <View style={styles.infoCopy}>
                <AwaText variant="titleSmall">{t('anonymous.mode.infoTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                  {t('anonymous.mode.infoText')}
                </AwaText>
              </View>
            </AwaCard>
          </FadeInUp>
          <FadeInUp delay={220}>
            <AwaCard padding="compact" style={styles.securityCard} variant="filled">
              <View style={styles.securityIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="shield-key-outline" size={20} />
              </View>
              <View style={styles.securityCopy}>
                <AwaText variant="titleSmall">{t('anonymous.mode.recommendedProtectionTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                  {t('anonymous.mode.recommendedProtectionText')}
                </AwaText>
              </View>
            </AwaCard>
          </FadeInUp>
        </ScrollView>

        <FadeInUp delay={260} distance={12}>
          <View style={[styles.ctaArea, {paddingBottom: Math.max(insets.bottom, 14)}]}>
            <AwaButton
              accessibilityLabel={t('anonymous.mode.continueInAnonymousMode')}
              fullWidth
              icon="incognito"
              label={t('anonymous.mode.continueInAnonymousMode')}
              onPress={proceed}
              size="large"
            />
            <AwaButton
              accessibilityLabel={t('common.cancel')}
              fullWidth
              label={t('common.cancel')}
              onPress={navigation.goBack}
              style={styles.cancel}
              variant="text"
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


  header: {
    minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18,
  },
  headerTitleBlock: {alignItems: 'center'},
  headerSpace: {width: 42},

  content: {flexGrow: 1, paddingHorizontal: 18, paddingTop: 6},

  hero: {alignItems: 'center', paddingTop: 10},
  heroImage: {width: 118, height: 118},

  title: {marginTop: 16, textAlign: 'center'},
  subtitle: {maxWidth: 330, alignSelf: 'center', marginTop: 8, textAlign: 'center'},

  card: {marginTop: 24},
  cardHeaderRow: {flexDirection: 'row', alignItems: 'flex-start'},
  cardHeaderIcon: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  cardHeaderCopy: {flex: 1, minWidth: 0, marginLeft: 12},

  rowsGroup: {marginTop: 14},
  row: {minHeight: 54, flexDirection: 'row', alignItems: 'center'},
  rowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border},
  rowIcon: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center'},
  rowTitle: {flex: 1, minWidth: 0, marginHorizontal: 12},
  rowStatus: {flexDirection: 'row', alignItems: 'center', gap: 6},

  infoCard: {flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12},
  infoCopy: {flex: 1, minWidth: 0},

  securityCard: {flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12},
  securityIcon: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center'},
  securityCopy: {flex: 1, minWidth: 0},

  conversionCard: {marginTop: 16},
  secondaryButton: {marginTop: 14},

  ctaArea: {
    paddingHorizontal: 18, paddingTop: 10, backgroundColor: theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border,
  },
  cancel: {marginTop: 4},

  });
}
