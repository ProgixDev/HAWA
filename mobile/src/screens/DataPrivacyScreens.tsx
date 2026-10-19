import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, Share, StatusBar, StyleSheet, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import {AwaTextField} from '../components/ui/AwaTextField';
import {isIncludedInBackup} from '../services/storageKeyClassifier';
import {cancelAllLocalNotifications} from '../services/pregnancyNotifications';
import {suspendBulkReminderResync} from '../services/reminderResyncGate';
import {resetAllOwnerStoresToDefaults} from '../state/ownerStoreRegistry';
import {foldForConfirmation} from '../utils/textCase';

function Shell({title, navigation, children}: {title: string; navigation: {goBack: () => void}; children: React.ReactNode}) {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <View style={[styles.header, {paddingTop: Math.max(insets.top, 18) + 8}]}>
        <AwaIconButton accessibilityLabel={t('common.back')} icon="chevron-left" onPress={navigation.goBack} variant="tonal" />
        <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{title}</AwaText>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 24}]}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

async function readAwaData() {
  const keys = (await AsyncStorage.getAllKeys()).filter(isIncludedInBackup);
  const pairs = await Promise.all(keys.map(async key => [key, await AsyncStorage.getItem(key)] as const));
  return Object.fromEntries(pairs);
}

export function DataManagementScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'DataManagement'>) {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  useEffect(() => {
    readAwaData().then(data => setCount(Object.keys(data).length));
  }, []);
  const exportData = async () => {
    const data = await readAwaData();
    await Share.share({title: t('dataPrivacy.management.exportShareTitle'), message: JSON.stringify(data, null, 2)});
  };
  return (
    <Shell navigation={navigation} title={t('privacySecurity.dataManagementTitle')}>
      <AwaCard padding="default" style={styles.hero} variant="filled">
        <MaterialDesignIcons color={theme.colors.primary} name="database-lock-outline" size={35} />
        <AwaText style={styles.heroTitle} variant="titleLarge">{t('dataPrivacy.management.heroTitle')}</AwaText>
        <AwaText colorRole="onSurfaceVariant" style={styles.text} variant="bodySmall">{t('dataPrivacy.management.storageCount', {count})}</AwaText>
      </AwaCard>
      <AwaCard onPress={exportData} padding="default" style={styles.action} variant="filled">
        <MaterialDesignIcons color={theme.colors.primary} name="export-variant" size={22} />
        <View style={styles.actionCopy}>
          <AwaText variant="titleSmall">{t('dataPrivacy.management.exportTitle')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" style={styles.text} variant="bodySmall">{t('dataPrivacy.management.exportDescription')}</AwaText>
        </View>
      </AwaCard>
      <AwaButton fullWidth label={t('dataPrivacy.management.deletionInfoButton')} onPress={() => setMessage(t('dataPrivacy.management.deletionInfoMessage'))} variant="tonal" />
      {message ? <AwaText colorRole="onSurfaceVariant" style={styles.notice} variant="bodySmall">{message}</AwaText> : null}
    </Shell>
  );
}

export function DeleteAccountScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>) {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  // The displayed confirmation label AND this check both read the SAME
  // dataPrivacy.deleteAccount.confirmWord translation — never a hardcoded
  // 'SUPPRIMER' — so the required word can never drift out of sync with
  // what's actually validated, in any language.
  const confirmWord = t('dataPrivacy.deleteAccount.confirmWord');
  const remove = async () => {
    if (foldForConfirmation(value) !== foldForConfirmation(confirmWord)) {
      setError(t('dataPrivacy.deleteAccount.confirmError'));
      return;
    }
    // Every reminder AWA scheduled lives in Android's own notification database, not in AsyncStorage: clearing the
    // records alone would leave them firing (a medication's name included) with nothing left to derive or to cancel
    // them from. Cancelled FIRST — pending triggers and anything already in the notification shade — while the
    // records still exist. Never throws; should the wipe below then fail, the next launch's sync restores them.
    await cancelAllLocalNotifications();
    await AsyncStorage.clear();
    // Storage is empty but the stores still hold the deleted account in memory until the process ends: a bulk resync
    // (language, privacy, permission, foreground refresh) would rebuild reminders from it. Suspended until the person
    // chooses an objective again (App.tsx), at which point the stores hold the new account's data.
    // The owner-only stores (objective, pregnancy / postpartum / loss / ... preferences, reminder snapshots) go back to
    // their defaults IN MEMORY — no read, no write, the storage stays empty (a re-read can persist derived keys). Their
    // subscribers are notified, which includes the objective listener that lifts the suspension: so the suspension is
    // set AFTER the reset, never before it.
    resetAllOwnerStoresToDefaults();
    suspendBulkReminderResync();
    navigation.reset({index: 0, routes: [{name: 'Welcome'}]});
  };
  return (
    <Shell navigation={navigation} title={t('privacySecurity.deleteAccountTitle')}>
      <AwaCard padding="default" style={styles.warning} variant="filled">
        <MaterialDesignIcons color={theme.colors.danger} name="alert-outline" size={35} />
        <AwaText colorRole="error" style={styles.warningTitle} variant="titleLarge">{t('dataPrivacy.deleteAccount.warningTitle')}</AwaText>
        <AwaText colorRole="onSurfaceVariant" style={styles.text} variant="bodySmall">{t('dataPrivacy.deleteAccount.warningText')}</AwaText>
      </AwaCard>
      <AwaTextField
        accessibilityLabel={t('dataPrivacy.deleteAccount.confirmLabel')}
        autoCapitalize="characters"
        errorText={error || undefined}
        label={t('dataPrivacy.deleteAccount.confirmLabel')}
        onChangeText={text => {setValue(text); setError('');}}
        value={value}
      />
      <AwaButton
        accessibilityLabel={t('dataPrivacy.deleteAccount.deleteButtonAccessibility')}
        fullWidth
        label={t('dataPrivacy.deleteAccount.deleteButton')}
        onPress={remove}
        size="large"
        variant="destructive"
      />
    </Shell>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12},
    title: {flex: 1, textAlign: 'center'},
    spacer: {width: 40},
    content: {paddingHorizontal: 16, gap: 13},
    hero: {alignItems: 'center'},
    heroTitle: {marginTop: 8},
    text: {marginTop: 6, textAlign: 'center'},
    action: {flexDirection: 'row', alignItems: 'center'},
    actionCopy: {flex: 1, marginLeft: 12},
    notice: {textAlign: 'center'},
    // Destructive-action warning card — theme.colors.danger throughout,
    // preserving semantic identity (Step 15). Never becomes theme.primary.
    warning: {alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.28), backgroundColor: withAlpha(theme.colors.danger, 0.05)},
    warningTitle: {marginTop: 8},
  });
}
