import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StatusBar, StyleSheet, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {getPrivacySecuritySettings, isBiometricEnabled, isPinEnabled, loadSecurityPreferences, updatePrivacySecuritySettings, type PrivacySecuritySettings} from '../state/securityPreferences';
import {getAvailableBiometry} from '../services/appSecurityService';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaInfoRow} from '../components/ui/AwaInfoRow';
import {AwaSwitch} from '../components/ui/AwaSwitch';
import {AwaText} from '../components/ui/AwaText';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacySecurity'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

function SettingRow({
  icon, title, subtitle, status, onPress, last, danger, toggle, onToggle,
}: {
  icon: IconName; title: string; subtitle: string; status?: string; onPress?: () => void;
  last?: boolean; danger?: boolean; toggle?: boolean; onToggle?: (value: boolean) => void;
}) {
  return (
    <AwaInfoRow
      accessibilityLabel={title}
      icon={icon}
      iconTone={danger ? 'danger' : 'primary'}
      last={last}
      onPress={onToggle ? undefined : onPress}
      status={onToggle ? undefined : status}
      subtitle={subtitle}
      title={title}
      trailing={
        onToggle ? (
          <AwaSwitch accessibilityLabel={title} onValueChange={onToggle} value={Boolean(toggle)} />
        ) : onPress ? 'chevron' : 'none'
      }
    />
  );
}

export default function PrivacySecurityScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const [settings, setSettings] = useState(getPrivacySecuritySettings());
  const [pin, setPin] = useState(isPinEnabled());
  const [bio, setBio] = useState(isBiometricEnabled());
  const [biometryLabel, setBiometryLabel] = useState(t('biometrics.genericLabel'));

  useEffect(() => {
    loadSecurityPreferences().then(() => {
      setSettings(getPrivacySecuritySettings());
      setPin(isPinEnabled());
      setBio(isBiometricEnabled());
    });
    getAvailableBiometry().then(value => {
      if (value) {setBiometryLabel(value.label);}
    }).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => {
    setPin(isPinEnabled());
    setBio(isBiometricEnabled());
    setSettings(getPrivacySecuritySettings());
  }, []));

  const change = <K extends keyof PrivacySecuritySettings>(key: K, value: PrivacySecuritySettings[K]) =>
    setSettings(updatePrivacySecuritySettings({[key]: value}));

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          compact && styles.contentCompact,
          {paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 18) + 25},
        ]}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <AwaIconButton accessibilityLabel={t('privacySecurity.backA11y')} icon="chevron-left" onPress={navigation.goBack} variant="tonal" />
          <View style={styles.headerCopy}>
            <AwaText accessibilityRole="header" variant="headlineSmall">{t('privacySecurity.title')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">{t('privacySecurity.subtitle')}</AwaText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(70).duration(420)}>
          <AwaCard style={styles.intro} variant="filled">
            <MaterialDesignIcons color={theme.colors.primary} name="shield-account-outline" size={28} />
            <View style={styles.introCopy}>
              <AwaText variant="titleMedium">{t('privacySecurity.introTitle')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.introText} variant="bodySmall">{t('privacySecurity.introText')}</AwaText>
            </View>
          </AwaCard>
        </Animated.View>

        <AwaText accessibilityRole="header" style={styles.sectionTitle} variant="titleMedium">{t('privacySecurity.sectionAccess')}</AwaText>
        <Animated.View entering={FadeInUp.delay(130).duration(420)}>
        <AwaCard padding="none" style={styles.card} variant="filled">
          <SettingRow
            icon="lock-outline" onPress={() => navigation.navigate('PinManagement')}
            status={pin ? t('privacySecurity.statusOn') : t('privacySecurity.statusOff')} title={t('privacySecurity.pinTitle')}
            subtitle={pin ? t('privacySecurity.pinSubtitleOn') : t('privacySecurity.pinSubtitleOff')}
          />
          <SettingRow
            icon="fingerprint" onPress={() => navigation.navigate('FaceIdSetup', {action: bio ? 'manage' : 'enable'})}
            status={bio ? t('privacySecurity.statusOnFeminine') : t('privacySecurity.statusOffFeminine')} title={biometryLabel}
            subtitle={bio ? t('privacySecurity.biometrySubtitleOn') : t('privacySecurity.biometrySubtitleOff')}
          />
          <SettingRow
            icon="eye-off-outline" onToggle={value => change('discreetMode', value)}
            subtitle={t('privacySecurity.discreetModeSubtitle')} title={t('privacySecurity.discreetModeTitle')} toggle={settings.discreetMode}
          />
          <SettingRow
            icon="bell-outline" onToggle={value => change('discreetNotifications', value)}
            subtitle={t('privacySecurity.discreetNotificationsSubtitle')} title={t('privacySecurity.discreetNotificationsTitle')} toggle={settings.discreetNotifications}
          />
          <SettingRow
            icon="cellphone-lock" onToggle={value => change('hideNotificationPreview', value)}
            subtitle={t('privacySecurity.hideNotificationPreviewSubtitle')} title={t('privacySecurity.hideNotificationPreviewTitle')} toggle={settings.hideNotificationPreview}
          />
          <SettingRow
            last icon="shape-outline" onPress={() => navigation.navigate('DiscreetLauncher')}
            subtitle={t('privacySecurity.discreetAppearanceSubtitle')} title={t('privacySecurity.discreetAppearanceTitle')}
          />
        </AwaCard>
        </Animated.View>
        <AwaText accessibilityRole="header" style={styles.sectionTitle} variant="titleMedium">{t('privacySecurity.sectionSensitive')}</AwaText>
        <Animated.View entering={FadeInUp.delay(190).duration(420)}>
        <AwaCard padding="none" style={styles.card} variant="filled">
          <SettingRow
            icon="heart-outline" onPress={() => change('intimacyProtection', !settings.intimacyProtection)}
            status={settings.intimacyProtection ? t('privacySecurity.statusOnFeminine') : t('privacySecurity.statusOffFeminine')}
            subtitle={t('privacySecurity.intimacySubtitle')} title={t('privacySecurity.intimacyTitle')}
          />
          <SettingRow
            last icon="image-lock-outline" onPress={() => change('privateContentProtection', !settings.privateContentProtection)}
            status={settings.privateContentProtection ? t('privacySecurity.statusOnFeminine') : t('privacySecurity.statusOffFeminine')}
            subtitle={t('privacySecurity.privateContentSubtitle')} title={t('privacySecurity.privateContentTitle')}
          />
        </AwaCard>
        </Animated.View>
        <AwaText accessibilityRole="header" style={styles.sectionTitle} variant="titleMedium">{t('privacySecurity.sectionAccount')}</AwaText>
        <Animated.View entering={FadeInUp.delay(250).duration(420)}>
        <AwaCard padding="none" style={styles.card} variant="filled">
          <SettingRow
            icon="account-outline" onPress={() => navigation.navigate('AnonymousMode')}
            status={settings.anonymousMode ? t('privacySecurity.statusOn') : t('privacySecurity.statusOff')}
            subtitle={t('privacySecurity.anonymousSubtitle')} title={t('privacySecurity.anonymousTitle')}
          />
          <SettingRow
            icon="cloud-outline" onPress={() => navigation.navigate('DataManagement')}
            subtitle={t('privacySecurity.dataManagementSubtitle')} title={t('privacySecurity.dataManagementTitle')}
          />
          <SettingRow
            danger last icon="delete-outline" onPress={() => navigation.navigate('DeleteAccount')}
            subtitle={t('privacySecurity.deleteAccountSubtitle')} title={t('privacySecurity.deleteAccountTitle')}
          />
        </AwaCard>
        </Animated.View>
        <AwaCard padding="compact" style={styles.info} variant="filled">
          <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={21} />
          <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">{t('privacySecurity.footerInfo')}</AwaText>
        </AwaCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    content: {flexGrow: 1, gap: 12, paddingHorizontal: 16},
    contentCompact: {paddingHorizontal: 11},
    header: {flexDirection: 'row', alignItems: 'center'},
    headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 9},
    title: {},
    subtitle: {marginTop: 4},
    intro: {flexDirection: 'row', alignItems: 'center'},
    introCopy: {flex: 1, marginLeft: 12},
    introTitle: {},
    introText: {marginTop: 4},
    sectionTitle: {marginTop: 4},
    card: {overflow: 'hidden'},
    info: {flexDirection: 'row', alignItems: 'center', gap: 12},
    infoText: {flex: 1},
  });
}
