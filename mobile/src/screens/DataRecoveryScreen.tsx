import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import '../i18n';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import {useStructuredDataAvailability} from '../hooks/useStructuredDataAvailability';
import {
  createReplacementProtectionKey,
  discardUnreadableRecords,
  retryStructuredAccess,
  summarizeUnavailable,
} from '../services/structuredKeyRecovery';

// What to do when protected records can't be read. Every action is a button the user presses and, for the two that
// change something, confirms — nothing here happens by itself. Only counts and reasons are shown, never record contents.

type Props = NativeStackScreenProps<RootStackParamList, 'DataRecovery'>;

export default function DataRecoveryScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const availability = useStructuredDataAvailability();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const summary = useMemo(() => summarizeUnavailable(), [availability.unavailable]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (action: () => Promise<string>) => {
    setBusy(true);
    try {
      setMessage(await action());
    } finally {
      setBusy(false);
    }
  };

  const retry = () =>
    run(async () => {
      await retryStructuredAccess();
      return summarizeUnavailable().total === 0 ? t('dataSafety.recovery.nothing') : t('dataSafety.recovery.stillUnavailable');
    });

  const confirm = (title: string, body: string, destructive: boolean, action: () => Promise<string>) =>
    Alert.alert(title, body, [
      {text: t('dataSafety.recovery.cancel'), style: 'cancel'},
      {text: t('dataSafety.recovery.confirm'), style: destructive ? 'destructive' : 'default', onPress: () => { run(action).catch(() => undefined); }},
    ]);

  const newKey = () =>
    confirm(t('dataSafety.recovery.newKeyTitle'), t('dataSafety.recovery.newKeyBody'), false, async () => {
      await createReplacementProtectionKey();
      return t('dataSafety.recovery.keyCreated');
    });
  const discard = () =>
    confirm(t('dataSafety.recovery.discardTitle'), t('dataSafety.recovery.discardBody'), true, async () => {
      await discardUnreadableRecords();
      return t('dataSafety.recovery.discarded');
    });

  const buttons = (
    <>
      <ActionButton icon="refresh" label={t('dataSafety.recovery.retry')} onPress={retry} styles={styles} disabled={busy} />
      <ActionButton icon="backup-restore" label={t('dataSafety.recovery.restore')} onPress={() => navigation.navigate('PortableBackup')} styles={styles} disabled={busy} />
      {summary.keyLost > 0 ? <ActionButton icon="key-plus" label={t('dataSafety.recovery.newKey')} onPress={newKey} styles={styles} disabled={busy} /> : null}
      {summary.total > 0 ? <ActionButton danger icon="delete-outline" label={t('dataSafety.recovery.discard')} onPress={discard} styles={styles} disabled={busy} /> : null}
    </>
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <ScrollView contentContainerStyle={[styles.content, {paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 18) + 28}]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AwaIconButton accessibilityLabel={t('common.back')} icon="chevron-left" onPress={navigation.goBack} variant="tonal" />
          <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{t('dataSafety.recovery.title')}</AwaText>
        </View>
        <AwaCard padding="default" style={styles.card} variant="filled">
          <MaterialDesignIcons color={theme.colors.warning} name="lock-alert-outline" size={30} />
          <AwaText emphasized variant="bodyLarge">{t('dataSafety.recovery.intro')}</AwaText>
          {summary.keyLost > 0 ? <AwaText colorRole="onSurfaceVariant" variant="bodyMedium">{t('dataSafety.recovery.keyLost')}</AwaText> : null}
          {summary.authentication > 0 ? <AwaText colorRole="onSurfaceVariant" variant="bodyMedium">{t('dataSafety.recovery.authFailed')}</AwaText> : null}
          {summary.other > 0 ? <AwaText colorRole="onSurfaceVariant" variant="bodyMedium">{t('dataSafety.recovery.other')}</AwaText> : null}
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{t('dataSafety.recovery.safeNote')}</AwaText>
        </AwaCard>
        {buttons}
        {message ? <AwaText emphasized style={styles.message} variant="bodyMedium">{message}</AwaText> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({icon, label, onPress, styles, danger, disabled}: {icon: React.ComponentProps<typeof MaterialDesignIcons>['name']; label: string; onPress: () => void; styles: ReturnType<typeof createStyles>; danger?: boolean; disabled?: boolean}) {
  return (
    <AwaButton
      disabled={disabled}
      fullWidth
      icon={icon}
      label={label}
      onPress={onPress}
      style={styles.action}
      variant={danger ? 'destructive' : 'tonal'}
    />
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    content: {paddingHorizontal: 16},
    header: {flexDirection: 'row', alignItems: 'center', marginBottom: 14},
    title: {flex: 1, marginLeft: 8},
    card: {marginBottom: 16, gap: 8, borderWidth: 1, borderColor: withAlpha(theme.colors.warning, 0.35)},
    action: {marginBottom: 12},
    message: {marginTop: 8, textAlign: 'center'},
  });
}
