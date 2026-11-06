import React, {useMemo} from 'react';
import {ScrollView, StatusBar, StyleSheet, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import {SettingsGroupCard, SettingsRow, usePrivacySettings} from './PrivacySecuritySubScreens';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacySecurity'>;

// Five entries, each opening a screen that groups the original eleven settings:
//   Verrouillage de l'appli  -> AppLockSettings        (PIN code, biometrics)
//   Discrétion               -> DiscretionSettings     (modesty mode, discreet notifications, hidden preview, discreet appearance)
//   Contenu protégé          -> ProtectedContentSettings (intimate-life protection, private notes / photos)
//   Mes données              -> DataManagement         (the "Mes données" screen: view, export, delete)
export default function PrivacySecurityScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const {settings, pin, bio, discreetIcon} = usePrivacySettings();

  const appLockOn = pin || bio;
  const discretionCount = [settings.discreetMode, settings.discreetNotifications, settings.hideNotificationPreview, discreetIcon].filter(Boolean).length;
  const protectedCount = [settings.intimacyProtection, settings.privateContentProtection].filter(Boolean).length;
  const on = t('privacySecurity.v2.statusActive', {defaultValue: 'Actif'});
  const off = t('privacySecurity.statusOff');

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
        <View style={styles.header}>
          <AwaIconButton accessibilityLabel={t('privacySecurity.backA11y')} icon="chevron-left" onPress={navigation.goBack} />
          <View style={styles.headerCopy}>
            <AwaText accessibilityRole="header" variant="headlineSmall">{t('privacySecurity.title')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">{t('privacySecurity.subtitle')}</AwaText>
          </View>
        </View>

        <View style={styles.banner}>
          <MaterialDesignIcons color={theme.colors.primary} name="shield-lock-outline" size={22} />
          <AwaText style={styles.bannerText} variant="bodySmall">{t('privacySecurity.v2.banner', {defaultValue: 'Choisis les protections qui te conviennent.'})}</AwaText>
        </View>

        <SettingsGroupCard>
          <SettingsRow
            active={appLockOn}
            icon="lock-outline"
            onPress={() => navigation.navigate('AppLockSettings')}
            status={appLockOn ? on : off}
            subtitle={t('privacySecurity.v2.appLockSubtitle', {defaultValue: 'Code PIN, empreinte'})}
            title={t('privacySecurity.v2.appLockTitle', {defaultValue: 'Verrouillage de l’appli'})}
          />
          <SettingsRow
            active={discretionCount > 0}
            icon="eye-off-outline"
            onPress={() => navigation.navigate('DiscretionSettings')}
            status={t('privacySecurity.v2.discretionStatus', {count: discretionCount, defaultValue: '{{count}} sur 4'})}
            subtitle={t('privacySecurity.v2.discretionRowSubtitle', {defaultValue: 'Mode pudeur, notifications, icône'})}
            title={t('privacySecurity.v2.discretionTitle', {defaultValue: 'Discrétion'})}
          />
          <SettingsRow
            active={protectedCount > 0}
            icon="heart-outline"
            onPress={() => navigation.navigate('ProtectedContentSettings')}
            status={t('privacySecurity.v2.protectedStatus', {
              count: protectedCount,
              defaultValue_one: '{{count}} actif',
              defaultValue_other: '{{count}} actifs',
            })}
            subtitle={t('privacySecurity.v2.protectedSubtitle', {defaultValue: 'Vie intime, notes et photos'})}
            title={t('privacySecurity.v2.protectedTitle', {defaultValue: 'Contenu protégé'})}
          />
          <SettingsRow
            icon="cloud-outline"
            last
            onPress={() => navigation.navigate('DataManagement')}
            subtitle={t('privacySecurity.v2.myDataSubtitle', {defaultValue: 'Exporter, supprimer, compte'})}
            title={t('privacySecurity.v2.myDataTitle', {defaultValue: 'Mes données'})}
          />
        </SettingsGroupCard>

        <AwaText colorRole="onSurfaceVariant" style={styles.footer} variant="bodySmall">{t('privacySecurity.v2.footer', {defaultValue: 'Tu peux modifier ces choix à tout moment.'})}</AwaText>
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
    headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 10},
    subtitle: {marginTop: 4},
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: withAlpha(theme.colors.primary, 0.1),
    },
    bannerText: {flex: 1},
    footer: {marginTop: 4, textAlign: 'center'},
  });
}
