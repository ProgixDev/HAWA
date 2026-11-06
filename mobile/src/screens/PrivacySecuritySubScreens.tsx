import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getPrivacySecuritySettings,
  isBiometricEnabled,
  isPinEnabled,
  loadSecurityPreferences,
  updatePrivacySecuritySettings,
  type PrivacySecuritySettings,
} from '../state/securityPreferences';
import {getAvailableBiometry} from '../services/appSecurityService';
import {getLauncherIdentity} from '../services/discreetLauncher';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaSwitch} from '../components/ui/AwaSwitch';
import {AwaText} from '../components/ui/AwaText';
import {GlassIcon} from '../components/ui/GlassIcon';
import {SettingsCard} from '../components/profile/SettingsCard';

// The Confidentialité & Sécurité sub-screens (the main screen lists five entries; every one of the eleven settings is reachable here):
//   AppLockSettings        PIN code, biometrics
//   DiscretionSettings     modesty mode, discreet notifications, hidden preview, discreet app appearance
//   ProtectedContentSettings   intimate-life protection, private notes / photos protection
// Every setting keeps its own store and logic (securityPreferences, discreetLauncher, the existing PIN / Face ID / data screens);
// this file only organises and displays them. The wording is passed with a French `defaultValue` so it shows even where a language
// has no translation yet.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type SubScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

/** Settings read live (focus + the stores' own load) so a change made in another screen shows when coming back. */
export function usePrivacySettings() {
  const [settings, setSettings] = useState<PrivacySecuritySettings>(getPrivacySecuritySettings());
  const [pin, setPin] = useState(isPinEnabled());
  const [bio, setBio] = useState(isBiometricEnabled());
  const [discreetIcon, setDiscreetIcon] = useState(false);

  const refresh = useCallback(() => {
    setSettings(getPrivacySecuritySettings());
    setPin(isPinEnabled());
    setBio(isBiometricEnabled());
    getLauncherIdentity().then(identity => setDiscreetIcon(identity === 'discreet')).catch(() => {});
  }, []);

  useEffect(() => {
    loadSecurityPreferences().then(refresh);
  }, [refresh]);
  useFocusEffect(refresh);

  const change = <K extends keyof PrivacySecuritySettings>(key: K, value: PrivacySecuritySettings[K]) =>
    setSettings(updatePrivacySecuritySettings({[key]: value}));

  return {settings, pin, bio, discreetIcon, change};
}

/* ----------------------------------------------------------------------------------------------- shared building blocks */

/** A stack of cards, one per setting (8 px apart), like the Backup page. */
export function SettingsGroupCard({children}: {children: React.ReactNode}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.group}>{children}</View>;
}

/** One setting. A link opens another screen (the shared SettingsCard: glass icon, title, description, status, chevron — as on the Backup
 * page); a toggle is the same card with a switch. */
export function SettingsRow({
  icon, title, subtitle, status, onPress, danger, toggle, onToggle,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  /** Current value, shown under the description. */
  status?: string;
  onPress?: () => void;
  danger?: boolean;
  toggle?: boolean;
  onToggle?: (value: boolean) => void;
  /** Kept for the call sites that mark the last row or the active state; the cards are separate now. */
  last?: boolean;
  active?: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (onToggle) {
    return (
      <View style={styles.toggleCard}>
        <GlassIcon icon={icon} />
        <View style={styles.toggleCopy}>
          <AwaText emphasized variant="titleSmall">{title}</AwaText>
          {subtitle ? <AwaText colorRole="onSurfaceVariant" style={styles.toggleDescription} variant="bodySmall">{subtitle}</AwaText> : null}
        </View>
        <AwaSwitch accessibilityLabel={title} onValueChange={onToggle} value={Boolean(toggle)} />
      </View>
    );
  }
  return (
    <SettingsCard
      description={subtitle ?? ''}
      icon={icon}
      iconColor={danger ? theme.colors.danger : undefined}
      onPress={onPress}
      status={status}
      title={title}
    />
  );
}

export function SettingsScreenLayout({
  title, subtitle, onBack, footer, children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  footer?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <ScrollView
        contentContainerStyle={[styles.content, {paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 18) + 25}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AwaIconButton accessibilityLabel={t('privacySecurity.backA11y')} icon="chevron-left" onPress={onBack} />
          <View style={styles.headerCopy}>
            <AwaText accessibilityRole="header" variant="headlineSmall">{title}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">{subtitle}</AwaText>
          </View>
        </View>

        {children}

        {footer ? <AwaText colorRole="onSurfaceVariant" style={styles.footer} variant="bodySmall">{footer}</AwaText> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------------------------------------------- the screens */

export function AppLockSettingsScreen({navigation}: SubScreenProps<'AppLockSettings'>): React.JSX.Element {
  const {t} = useTranslation();
  const {pin, bio} = usePrivacySettings();
  const [biometryLabel, setBiometryLabel] = useState(t('biometrics.genericLabel'));

  useEffect(() => {
    getAvailableBiometry().then(value => {
      if (value) {setBiometryLabel(value.label);}
    }).catch(() => {});
  }, []);

  return (
    <SettingsScreenLayout
      onBack={navigation.goBack}
      subtitle={t('privacySecurity.v2.appLockScreenSubtitle', {defaultValue: 'Choisis comment protéger l’accès à AWA'})}
      title={t('privacySecurity.v2.appLockTitle', {defaultValue: 'Verrouillage de l’appli'})}>
      <SettingsGroupCard>
        <SettingsRow
          active={pin}
          icon="lock-outline"
          onPress={() => navigation.navigate('PinManagement')}
          status={pin ? t('privacySecurity.statusOn') : t('privacySecurity.statusOff')}
          subtitle={pin ? t('privacySecurity.pinSubtitleOn') : t('privacySecurity.pinSubtitleOff')}
          title={t('privacySecurity.pinTitle')}
        />
        <SettingsRow
          active={bio}
          icon="fingerprint"
          last
          onPress={() => navigation.navigate('FaceIdSetup', {action: bio ? 'manage' : 'enable'})}
          status={bio ? t('privacySecurity.statusOnFeminine') : t('privacySecurity.statusOffFeminine')}
          subtitle={bio ? t('privacySecurity.biometrySubtitleOn') : t('privacySecurity.biometrySubtitleOff')}
          title={biometryLabel}
        />
      </SettingsGroupCard>
    </SettingsScreenLayout>
  );
}

export function DiscretionSettingsScreen({navigation}: SubScreenProps<'DiscretionSettings'>): React.JSX.Element {
  const {t} = useTranslation();
  const {settings, change} = usePrivacySettings();

  return (
    <SettingsScreenLayout
      footer={t('privacySecurity.v2.discretionFooter', {defaultValue: 'Ces réglages ne changent rien à tes données.'})}
      onBack={navigation.goBack}
      subtitle={t('privacySecurity.v2.discretionSubtitle', {defaultValue: 'Garde ton suivi pour toi'})}
      title={t('privacySecurity.v2.discretionTitle', {defaultValue: 'Discrétion'})}>
      <SettingsGroupCard>
        <SettingsRow
          icon="eye-off-outline"
          onToggle={value => change('discreetMode', value)}
          subtitle={t('privacySecurity.v2.modestySubtitle', {defaultValue: 'Masquer le contenu sensible'})}
          title={t('privacySecurity.v2.modestyTitle', {defaultValue: 'Mode pudeur'})}
          toggle={settings.discreetMode}
        />
        <SettingsRow
          icon="bell-outline"
          onToggle={value => change('discreetNotifications', value)}
          subtitle={t('privacySecurity.v2.discreetNotificationsSubtitle', {defaultValue: 'Textes neutres'})}
          title={t('privacySecurity.discreetNotificationsTitle')}
          toggle={settings.discreetNotifications}
        />
        <SettingsRow
          icon="cellphone-lock"
          onToggle={value => change('hideNotificationPreview', value)}
          subtitle={t('privacySecurity.v2.hidePreviewSubtitle', {defaultValue: 'Rien sur l’écran verrouillé'})}
          title={t('privacySecurity.v2.hidePreviewTitle', {defaultValue: 'Masquer l’aperçu'})}
          toggle={settings.hideNotificationPreview}
        />
        <SettingsRow
          icon="shape-outline"
          last
          onPress={() => navigation.navigate('DiscreetLauncher')}
          subtitle={t('privacySecurity.v2.appearanceSubtitle', {defaultValue: 'Nom et icône de l’appli'})}
          title={t('privacySecurity.discreetAppearanceTitle')}
        />
      </SettingsGroupCard>
    </SettingsScreenLayout>
  );
}

export function ProtectedContentSettingsScreen({navigation}: SubScreenProps<'ProtectedContentSettings'>): React.JSX.Element {
  const {t} = useTranslation();
  const {settings, change} = usePrivacySettings();

  return (
    <SettingsScreenLayout
      footer={t('privacySecurity.v2.protectedFooter', {defaultValue: 'Le verrouillage utilise ton code PIN ou ta biométrie.'})}
      onBack={navigation.goBack}
      subtitle={t('privacySecurity.v2.protectedScreenSubtitle', {defaultValue: 'Choisis ce qui reste verrouillé'})}
      title={t('privacySecurity.v2.protectedTitle', {defaultValue: 'Contenu protégé'})}>
      <SettingsGroupCard>
        <SettingsRow
          icon="heart-outline"
          onToggle={value => change('intimacyProtection', value)}
          subtitle={t('privacySecurity.intimacySubtitle')}
          title={t('privacySecurity.intimacyTitle')}
          toggle={settings.intimacyProtection}
        />
        <SettingsRow
          icon="image-lock-outline"
          last
          onToggle={value => change('privateContentProtection', value)}
          subtitle={t('privacySecurity.privateContentSubtitle')}
          title={t('privacySecurity.privateContentTitle')}
          toggle={settings.privateContentProtection}
        />
      </SettingsGroupCard>
    </SettingsScreenLayout>
  );
}

/* --------------------------------------------------------------------------------------------------------------- styles */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    content: {flexGrow: 1, gap: 12, paddingHorizontal: 16},
    header: {flexDirection: 'row', alignItems: 'center'},
    headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 10},
    subtitle: {marginTop: 4},
    footer: {marginTop: 4, textAlign: 'center'},
    group: {gap: 8},
    dangerZone: {marginTop: 28},
    toggleCard: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.12),
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    toggleCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
    toggleDescription: {marginTop: 3},
  });
}
