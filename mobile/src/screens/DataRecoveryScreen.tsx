import React, {useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import '../i18n';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
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
          <Pressable accessibilityLabel={t('common.back')} accessibilityRole="button" onPress={navigation.goBack} style={styles.back}>
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
          </Pressable>
          <Text style={styles.title}>{t('dataSafety.recovery.title')}</Text>
        </View>
        <View style={styles.card}>
          <MaterialDesignIcons color={theme.colors.warning} name="lock-alert-outline" size={30} />
          <Text style={styles.body}>{t('dataSafety.recovery.intro')}</Text>
          {summary.keyLost > 0 ? <Text style={styles.reason}>{t('dataSafety.recovery.keyLost')}</Text> : null}
          {summary.authentication > 0 ? <Text style={styles.reason}>{t('dataSafety.recovery.authFailed')}</Text> : null}
          {summary.other > 0 ? <Text style={styles.reason}>{t('dataSafety.recovery.other')}</Text> : null}
          <Text style={styles.safe2}>{t('dataSafety.recovery.safeNote')}</Text>
        </View>
        {buttons}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({icon, label, onPress, styles, danger, disabled}: {icon: React.ComponentProps<typeof MaterialDesignIcons>['name']; label: string; onPress: () => void; styles: ReturnType<typeof createStyles>; danger?: boolean; disabled?: boolean}) {
  const {theme} = useAwaTheme();
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.action, danger && styles.actionDanger, disabled && styles.disabled]}>
      <MaterialDesignIcons color={danger ? theme.colors.danger : theme.colors.primary} name={icon} size={22} />
      <Text style={[styles.actionText, danger && {color: theme.colors.danger}]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    content: {paddingHorizontal: 16},
    header: {flexDirection: 'row', alignItems: 'center', marginBottom: 14},
    back: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4},
    title: {flex: 1, color: theme.colors.accent, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
    card: {...theme.shadow, backgroundColor: theme.colors.surface, borderColor: withAlpha(theme.colors.warning, 0.35), borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 16, gap: 8},
    body: {color: theme.colors.text, fontSize: 14.5, lineHeight: 21, fontWeight: '600'},
    reason: {color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 20},
    safe2: {color: theme.colors.textMuted, fontSize: 12.5, lineHeight: 18},
    action: {minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.25), backgroundColor: theme.colors.surface, paddingHorizontal: 16, marginBottom: 10},
    actionDanger: {borderColor: withAlpha(theme.colors.danger, 0.4)},
    actionText: {flex: 1, color: theme.colors.primary, fontSize: 15, fontWeight: '800'},
    disabled: {opacity: 0.5},
    message: {color: theme.colors.text, fontSize: 13.5, fontWeight: '700', marginTop: 8, textAlign: 'center'},
  });
}
