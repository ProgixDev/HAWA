import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
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
import {AwaTextField} from '../components/ui/AwaTextField';
import {getActiveProfileIdentity, reloadActiveProfileData} from '../state/activeProfileStore';
import {reloadCycleStateFromStorage} from '../state/onboardingPreferences';
import {reloadAllOwnerStores} from '../state/ownerStoreRegistry';
import {checkPassphrase} from '../services/passphraseKdf';
import {
  PortableBackupError,
  createPortableBackup,
  inspectPortableBackup,
  restorePortableBackup,
  type PortableBackupInfo,
} from '../services/portableBackup';
import {pickBackupFile, purgeBackupShareCache, shareBackupFile} from '../services/portableBackupFiles';
import {runStructuredMigration} from '../services/structuredDataMigration';
import {resyncAllReminderNotifications} from '../services/reminderResync';
import {dateFormatLocale} from '../utils/cycleMath';

// Create and restore the passphrase-protected portable backup (services/portableBackup.ts). The passphrases live only in
// component state, are never logged, and are wiped as soon as the operation ends.

type Props = NativeStackScreenProps<RootStackParamList, 'PortableBackup'>;
type Notice = {kind: 'success' | 'error'; text: string} | null;

export default function PortableBackupScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const compact = width < 380;

  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [creating, setCreating] = useState(false);
  const [createNotice, setCreateNotice] = useState<Notice>(null);

  const [picked, setPicked] = useState<{contents: string; info: PortableBackupInfo} | null>(null);
  const [restorePass, setRestorePass] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState<Notice>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    purgeBackupShareCache().catch(() => undefined); // a sealed file left from an earlier share never lingers
    return () => {
      mounted.current = false;
    };
  }, []);

  const weakness = (() => {
    if (!passphrase) {return null;}
    const check = checkPassphrase(passphrase);
    if (check.ok) {return null;}
    return check.reason === 'too-short' ? t('portableBackup.weakTooShort') : t('portableBackup.weakRepetitive');
  })();
  const mismatch = confirmation.length > 0 && confirmation !== passphrase ? t('portableBackup.mismatch') : null;
  const canCreate = !creating && passphrase.length > 0 && !weakness && confirmation === passphrase;

  const create = async () => {
    if (!canCreate) {return;}
    setCreating(true);
    setCreateNotice(null);
    try {
      const identity = getActiveProfileIdentity();
      const backup = await createPortableBackup({
        passphrase,
        scope: identity.isManagedProfile ? {kind: 'managed-profile', profileId: identity.id} : {kind: 'owner'},
      });
      const outcome = await shareBackupFile(backup.fileName, backup.contents, t('portableBackup.shareTitle'));
      if (mounted.current) {
        setCreateNotice(outcome === 'shared' ? {kind: 'success', text: t('portableBackup.created')} : null);
        setPassphrase('');
        setConfirmation('');
      }
    } catch (error) {
      if (mounted.current) {
        const unreadable = error instanceof PortableBackupError && error.code === 'unreadable-data';
        setCreateNotice({kind: 'error', text: unreadable ? t('portableBackup.errorUnreadable') : t('portableBackup.errorGeneric')});
      }
    } finally {
      if (mounted.current) {setCreating(false);}
    }
  };

  const choose = async () => {
    setRestoreNotice(null);
    try {
      const file = await pickBackupFile();
      if (!file) {return;}
      setPicked({contents: file.contents, info: inspectPortableBackup(file.contents)});
      setRestorePass('');
    } catch (error) {
      setPicked(null);
      const code = error instanceof PortableBackupError ? error.code : 'invalid-contents';
      setRestoreNotice({kind: 'error', text: code === 'not-a-backup' ? t('portableBackup.errorNotBackup') : code === 'unsupported-version' ? t('portableBackup.errorVersion') : t('portableBackup.errorInvalid')});
    }
  };

  const runRestore = async () => {
    if (!picked) {return;}
    setRestoring(true);
    setRestoreNotice(null);
    try {
      const result = await restorePortableBackup({contents: picked.contents, passphrase: restorePass});
      reloadActiveProfileData();
      await reloadCycleStateFromStorage().catch(() => undefined);
      // The owner-only stores (objective, pregnancy / postpartum / loss / ... preferences, reminder snapshots) memoise
      // their first read and have no profile signal: they re-read what was just restored BEFORE the resync below
      // derives anything from them. Never throws.
      await reloadAllOwnerStores();
      runStructuredMigration().catch(() => undefined);
      // The restored records replaced everything the scheduled reminders were derived from, and Android still holds
      // the triggers built from the OLD ones: re-derive and re-schedule every objective's reminders from what is now
      // in place (same as the regular restore, BackupUtilityScreens.tsx). Never throws.
      await resyncAllReminderNotifications({force: true});
      if (mounted.current) {
        setRestoreNotice({kind: 'success', text: t('portableBackup.success', {count: result.restoredRecords})});
        setPicked(null);
        setRestorePass('');
      }
    } catch (error) {
      if (mounted.current) {
        const code = error instanceof PortableBackupError ? error.code : 'storage-failed';
        const text =
          code === 'wrong-passphrase-or-corrupted' ? t('portableBackup.errorWrong')
          : code === 'profile-missing' ? t('portableBackup.errorProfileMissing')
          : code === 'storage-failed' ? t('portableBackup.errorStorage')
          : t('portableBackup.errorInvalid');
        setRestoreNotice({kind: 'error', text});
      }
    } finally {
      if (mounted.current) {setRestoring(false);}
    }
  };

  const askRestore = () =>
    Alert.alert(t('portableBackup.confirmTitle'), t('portableBackup.confirmBody'), [
      {text: t('portableBackup.cancel'), style: 'cancel'},
      {text: t('portableBackup.confirm'), style: 'destructive', onPress: () => { runRestore().catch(() => undefined); }},
    ]);

  const pickedLabel = picked
    ? t(picked.info.scope.kind === 'owner' ? 'portableBackup.pickedOwner' : 'portableBackup.pickedProfile', {
        date: new Intl.DateTimeFormat(dateFormatLocale(), {day: 'numeric', month: 'long', year: 'numeric'}).format(new Date(picked.info.createdAt)),
      })
    : null;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.content, compact && styles.contentCompact, {paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 18) + 28}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              accessibilityRole="button"
              icon="chevron-left"
              onPress={navigation.goBack}
              style={styles.back}
            />
            <AwaText style={styles.title} variant="headlineSmall">{t('portableBackup.screenTitle')}</AwaText>
          </View>

          <AwaCard style={styles.card} variant="filled">
            <View style={styles.cardHead}>
              <MaterialDesignIcons color={theme.colors.primary} name="shield-lock-outline" size={24} />
              <AwaText style={styles.cardTitle} variant="titleLarge">{t('portableBackup.createTitle')}</AwaText>
            </View>
            <AwaText colorRole="onSurfaceVariant" style={styles.body} variant="bodyMedium">{t('portableBackup.createIntro')}</AwaText>
            <AwaTextField
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              errorText={weakness ?? undefined}
              helperText={weakness ? undefined : t('portableBackup.passphraseHint')}
              importantForAutofill="no"
              label={t('portableBackup.passphraseLabel')}
              onChangeText={setPassphrase}
              secureTextEntry
              textContentType="none"
              value={passphrase}
              wrapperStyle={styles.field}
            />
            <AwaTextField
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              errorText={mismatch ?? undefined}
              importantForAutofill="no"
              label={t('portableBackup.confirmLabel')}
              onChangeText={setConfirmation}
              secureTextEntry
              textContentType="none"
              value={confirmation}
              wrapperStyle={styles.field}
            />
            <View style={styles.warning}>
              <MaterialDesignIcons color={theme.colors.warning} name="alert-outline" size={20} />
              <AwaText style={styles.warningText} variant="bodySmall">{t('portableBackup.lossWarning')}</AwaText>
            </View>
            <AwaText colorRole="onSurfaceVariant" style={styles.note} variant="bodySmall">{t('portableBackup.photosNote')}</AwaText>
            <AwaButton
              disabled={!canCreate}
              fullWidth
              label={creating ? t('portableBackup.creating') : t('portableBackup.create')}
              loading={creating}
              onPress={create}
              style={styles.button}
            />
            {createNotice ? <AwaText colorRole={createNotice.kind === 'error' ? 'error' : 'success'} emphasized style={styles.notice} variant="bodyMedium">{createNotice.text}</AwaText> : null}
          </AwaCard>

          <AwaCard style={styles.card} variant="filled">
            <View style={styles.cardHead}>
              <MaterialDesignIcons color={theme.colors.primary} name="backup-restore" size={24} />
              <AwaText style={styles.cardTitle} variant="titleLarge">{t('portableBackup.restoreTitle')}</AwaText>
            </View>
            <AwaText colorRole="onSurfaceVariant" style={styles.body} variant="bodyMedium">{t('portableBackup.restoreIntro')}</AwaText>
            <AwaButton
              fullWidth
              icon="file-lock-outline"
              label={t('portableBackup.pick')}
              onPress={choose}
              variant="tonal"
            />
            {pickedLabel ? <AwaText emphasized style={styles.picked} variant="bodyMedium">{pickedLabel}</AwaText> : null}
            {picked ? (
              <>
                <AwaTextField
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                  importantForAutofill="no"
                  label={t('portableBackup.restorePassphrase')}
                  onChangeText={setRestorePass}
                  secureTextEntry
                  textContentType="none"
                  value={restorePass}
                  wrapperStyle={styles.field}
                />
                <AwaButton
                  disabled={restoring || restorePass.length === 0}
                  fullWidth
                  label={restoring ? t('portableBackup.restoring') : t('portableBackup.restore')}
                  loading={restoring}
                  onPress={askRestore}
                  style={styles.button}
                />
              </>
            ) : null}
            {restoreNotice ? <AwaText colorRole={restoreNotice.kind === 'error' ? 'error' : 'success'} emphasized style={styles.notice} variant="bodyMedium">{restoreNotice.text}</AwaText> : null}
          </AwaCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    flex: {flex: 1},
    content: {paddingHorizontal: 18},
    contentCompact: {paddingHorizontal: 12},
    header: {flexDirection: 'row', alignItems: 'center', marginBottom: 14},
    back: {marginRight: 4},
    title: {flex: 1},
    card: {marginBottom: 16},
    cardHead: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8},
    cardTitle: {flex: 1},
    body: {marginBottom: 12},
    field: {marginTop: 8},
    warning: {flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: withAlpha(theme.colors.warning, 0.12), borderRadius: 12, padding: 12, marginTop: 16},
    warningText: {flex: 1},
    note: {marginTop: 12, marginBottom: 12},
    button: {marginTop: 8},
    picked: {marginTop: 12},
    notice: {marginTop: 12},
  });
}
