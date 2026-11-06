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
import {GlassIcon} from '../components/ui/GlassIcon';
import {AwaTextField} from '../components/ui/AwaTextField';
import {cancelAllLocalNotifications} from '../services/pregnancyNotifications';
import {suspendBulkReminderResync} from '../services/reminderResyncGate';
import {resetAllOwnerStoresToDefaults} from '../state/ownerStoreRegistry';
import {foldForConfirmation} from '../utils/textCase';
import {getAccountState, isAccountUiActive, signOutAccount, subscribeAccountState} from '../state/accountState';
import {ONLINE_BACKUP_ENABLED} from '../config/features';
import {buildPortableDataJson, buildPortableDataJsonForProfile} from '../services/backupService';
import {getActiveProfileIdentity} from '../state/activeProfileStore';
import {SettingsRow, SettingsScreenLayout} from './PrivacySecuritySubScreens';

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

// "Mes données": two states driven by ONE condition (isAccountUiActive = ONLINE_BACKUP_ENABLED && signed in).
//   no account (today, always): the "Compte" card with "Créer un compte", view / export, and "Supprimer mes données" (local wipe)
//   signed in (only with the flag on): the account card (e-mail, "Connecté", last backup), view / export / sign out, "Supprimer mon compte"
// Viewing and exporting reuse the existing DataExport screen and the JSON share; deleting reuses DeleteAccount (its typed confirmation).
export function DataManagementScreen({navigation}: NativeStackScreenProps<RootStackParamList, 'DataManagement'>) {
  const {t, i18n} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [account, setAccount] = useState(getAccountState);
  useEffect(() => subscribeAccountState(() => setAccount(getAccountState())), []);
  const signedIn = isAccountUiActive(account);

  // A daughter's profile exports and erases ONLY her own data (the profile-aware builders and DeleteTrackedData, exactly what the Sauvegarde
  // page offered); the owner exports everything and erases everything (DeleteAccount: wipes this phone).
  const activeIdentity = getActiveProfileIdentity();
  const exportData = async () => {
    const message = activeIdentity.isManagedProfile
      ? await buildPortableDataJsonForProfile(activeIdentity.id)
      : await buildPortableDataJson();
    await Share.share({title: t('dataPrivacy.management.exportShareTitle'), message});
  };

  const lastBackup = account.lastBackupAt
    ? account.lastBackupAt.toLocaleString(i18n.language, {dateStyle: 'medium', timeStyle: 'short'})
    : null;

  return (
    <SettingsScreenLayout
      onBack={navigation.goBack}
      subtitle={signedIn
        ? t('dataManagement.subtitleSignedIn', {defaultValue: 'Sauvegardées sur ton compte'})
        : t('dataManagement.subtitleLocal', {defaultValue: 'Tout reste sur ton téléphone'})}
      title={t('dataManagement.title', {defaultValue: 'Mes données'})}>
      <View accessibilityLabel={t('dataManagement.accountTitle', {defaultValue: 'Compte'})} style={styles.accountCard}>
        <View style={styles.accountTop}>
          <GlassIcon icon={signedIn ? 'account-check-outline' : 'account-outline'} />
          <View style={styles.accountCopy}>
            <AwaText emphasized variant="titleSmall">{t('dataManagement.accountTitle', {defaultValue: 'Compte'})}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.accountSubtitle} variant="bodySmall">
              {signedIn ? account.email : t('dataManagement.noAccount', {defaultValue: 'Aucun compte'})}
            </AwaText>
          </View>
          {signedIn ? (
            <View style={styles.connectedBadge}>
              <AwaText colorRole="primary" emphasized variant="labelMedium">{t('dataManagement.connected', {defaultValue: 'Connecté'})}</AwaText>
            </View>
          ) : null}
        </View>

        {signedIn ? (
          lastBackup ? (
            <AwaText colorRole="onSurfaceVariant" style={styles.accountNote} variant="bodySmall">
              {t('dataManagement.lastBackup', {defaultValue: 'Dernière sauvegarde :'})} {lastBackup}
            </AwaText>
          ) : null
        ) : (
          <>
            <AwaButton
              accessibilityLabel={t('dataManagement.createAccount', {defaultValue: 'Créer un compte'})}
              fullWidth
              label={t('dataManagement.createAccount', {defaultValue: 'Créer un compte'})}
              onPress={() => navigation.navigate('Registration')}
              size="large"
              style={styles.createButton}
            />
            {/* An online backup does not exist yet: this promise only appears once the feature flag is on. */}
            {ONLINE_BACKUP_ENABLED ? (
              <AwaText colorRole="onSurfaceVariant" style={styles.accountNote} variant="bodySmall">
                {t('dataManagement.createAccountHint', {defaultValue: 'Pour sauvegarder tes données en ligne.'})}
              </AwaText>
            ) : null}
          </>
        )}
      </View>

      <View style={styles.group}>
        <SettingsRow
          icon="database-eye-outline"
          onPress={() => navigation.navigate('DataExport')}
          subtitle={t('dataManagement.viewSubtitle', {defaultValue: 'Ce qui est enregistré'})}
          title={t('dataManagement.viewTitle', {defaultValue: 'Voir mes données'})}
        />
        <SettingsRow
          icon="export-variant"
          onPress={exportData}
          subtitle={t('dataManagement.exportSubtitle', {defaultValue: 'Une copie dans un fichier'})}
          title={t('dataManagement.exportTitle', {defaultValue: 'Exporter mes données'})}
        />
        {signedIn ? (
          <SettingsRow
            icon="logout"
            onPress={signOutAccount}
            subtitle={t('dataManagement.signOutSubtitle', {defaultValue: 'Les données restent sur ce téléphone'})}
            title={t('dataManagement.signOut', {defaultValue: 'Se déconnecter'})}
          />
        ) : null}
      </View>

      {/* The irreversible action: the same card as the others (red icon), a little apart; its confirmation is the existing DeleteAccount screen. */}
      <View style={styles.dangerBlock}>
        <SettingsRow
          danger
          icon="delete-outline"
          onPress={() => navigation.navigate(activeIdentity.isManagedProfile ? 'DeleteTrackedData' : 'DeleteAccount')}
          subtitle={signedIn
            ? t('dataManagement.deleteAccountSubtitle', {defaultValue: 'Compte et données, définitivement'})
            : t('dataManagement.deleteDataSubtitle', {defaultValue: 'Effacer tout de ce téléphone'})}
          title={signedIn
            ? t('dataManagement.deleteAccountTitle', {defaultValue: 'Supprimer mon compte'})
            : t('dataManagement.deleteDataTitle', {defaultValue: 'Supprimer mes données'})}
        />
      </View>
    </SettingsScreenLayout>
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
    <Shell
      navigation={navigation}
      title={isAccountUiActive() ? t('privacySecurity.deleteAccountTitle') : t('dataManagement.deleteDataTitle', {defaultValue: 'Supprimer mes données'})}>
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
    group: {gap: 8},
    accountCard: {
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.12),
      backgroundColor: theme.colors.surface,
    },
    accountTop: {flexDirection: 'row', alignItems: 'center'},
    accountCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
    accountSubtitle: {marginTop: 3},
    connectedBadge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: withAlpha(theme.colors.primary, 0.14)},
    createButton: {marginTop: 14},
    accountNote: {marginTop: 10, textAlign: 'center'},
    dangerBlock: {marginTop: 12},
    // Destructive-action warning card — theme.colors.danger throughout,
    // preserving semantic identity (Step 15). Never becomes theme.primary.
    warning: {alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.28), backgroundColor: withAlpha(theme.colors.danger, 0.05)},
    warningTitle: {marginTop: 8},
  });
}
