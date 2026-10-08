import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {getActiveProfileIdentity, reloadActiveProfileData} from '../state/activeProfileStore';
import {reloadCycleStateFromStorage} from '../state/onboardingPreferences';
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
      runStructuredMigration().catch(() => undefined);
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
            <Pressable accessibilityLabel={t('common.back')} accessibilityRole="button" onPress={navigation.goBack} style={styles.back}>
              <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
            </Pressable>
            <Text style={styles.title}>{t('portableBackup.screenTitle')}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <MaterialDesignIcons color={theme.colors.primary} name="shield-lock-outline" size={24} />
              <Text style={styles.cardTitle}>{t('portableBackup.createTitle')}</Text>
            </View>
            <Text style={styles.body}>{t('portableBackup.createIntro')}</Text>
            <Text style={styles.label}>{t('portableBackup.passphraseLabel')}</Text>
            <TextInput
              accessibilityLabel={t('portableBackup.passphraseLabel')}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              onChangeText={setPassphrase}
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              style={styles.input}
              textContentType="none"
              value={passphrase}
            />
            <Text style={[styles.hint, weakness ? styles.hintError : null]}>{weakness ?? t('portableBackup.passphraseHint')}</Text>
            <Text style={styles.label}>{t('portableBackup.confirmLabel')}</Text>
            <TextInput
              accessibilityLabel={t('portableBackup.confirmLabel')}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              onChangeText={setConfirmation}
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              style={styles.input}
              textContentType="none"
              value={confirmation}
            />
            {mismatch ? <Text style={[styles.hint, styles.hintError]}>{mismatch}</Text> : null}
            <View style={styles.warning}>
              <MaterialDesignIcons color={theme.colors.warning} name="alert-outline" size={20} />
              <Text style={styles.warningText}>{t('portableBackup.lossWarning')}</Text>
            </View>
            <Text style={styles.note}>{t('portableBackup.photosNote')}</Text>
            <Pressable accessibilityRole="button" disabled={!canCreate} onPress={create} style={[styles.button, !canCreate && styles.disabled]}>
              {creating ? (
                <View style={styles.row}>
                  <ActivityIndicator color={onPrimaryTextColor(theme)} size="small" />
                  <Text style={styles.buttonText}>{t('portableBackup.creating')}</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>{t('portableBackup.create')}</Text>
              )}
            </Pressable>
            {createNotice ? <Text style={[styles.notice, createNotice.kind === 'error' ? styles.noticeError : styles.noticeOk]}>{createNotice.text}</Text> : null}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <MaterialDesignIcons color={theme.colors.primary} name="backup-restore" size={24} />
              <Text style={styles.cardTitle}>{t('portableBackup.restoreTitle')}</Text>
            </View>
            <Text style={styles.body}>{t('portableBackup.restoreIntro')}</Text>
            <Pressable accessibilityRole="button" onPress={choose} style={styles.secondaryButton}>
              <MaterialDesignIcons color={theme.colors.primary} name="file-lock-outline" size={20} />
              <Text style={styles.secondaryText}>{t('portableBackup.pick')}</Text>
            </Pressable>
            {pickedLabel ? <Text style={styles.picked}>{pickedLabel}</Text> : null}
            {picked ? (
              <>
                <Text style={styles.label}>{t('portableBackup.restorePassphrase')}</Text>
                <TextInput
                  accessibilityLabel={t('portableBackup.restorePassphrase')}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                  importantForAutofill="no"
                  onChangeText={setRestorePass}
                  secureTextEntry
                  style={styles.input}
                  textContentType="none"
                  value={restorePass}
                />
                <Pressable accessibilityRole="button" disabled={restoring || restorePass.length === 0} onPress={askRestore} style={[styles.button, (restoring || restorePass.length === 0) && styles.disabled]}>
                  {restoring ? (
                    <View style={styles.row}>
                      <ActivityIndicator color={onPrimaryTextColor(theme)} size="small" />
                      <Text style={styles.buttonText}>{t('portableBackup.restoring')}</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>{t('portableBackup.restore')}</Text>
                  )}
                </Pressable>
              </>
            ) : null}
            {restoreNotice ? <Text style={[styles.notice, restoreNotice.kind === 'error' ? styles.noticeError : styles.noticeOk]}>{restoreNotice.text}</Text> : null}
          </View>
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
    back: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4},
    title: {flex: 1, color: theme.colors.accent, fontFamily: 'serif', fontSize: 26, fontWeight: '800'},
    card: {...theme.shadow, backgroundColor: theme.colors.surface, borderColor: withAlpha(theme.colors.primary, 0.12), borderWidth: 1, borderRadius: 22, padding: 16, marginBottom: 16},
    cardHead: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6},
    cardTitle: {flex: 1, color: theme.colors.accent, fontFamily: 'serif', fontSize: 19, fontWeight: '800'},
    body: {color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 20, marginBottom: 10},
    label: {color: theme.colors.text, fontSize: 13, fontWeight: '700', marginTop: 8, marginBottom: 6},
    input: {minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.2), backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text, paddingHorizontal: 14, fontSize: 16},
    hint: {color: theme.colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 5},
    hintError: {color: theme.colors.danger},
    warning: {flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: withAlpha(theme.colors.warning, 0.12), borderRadius: 14, padding: 12, marginTop: 14},
    warningText: {flex: 1, color: theme.colors.text, fontSize: 12.5, lineHeight: 18},
    note: {color: theme.colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 10, marginBottom: 12},
    button: {minHeight: 50, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 8},
    buttonText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '800'},
    row: {flexDirection: 'row', alignItems: 'center', gap: 10},
    disabled: {opacity: 0.45},
    secondaryButton: {minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.3), backgroundColor: theme.colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14},
    secondaryText: {color: theme.colors.primary, fontSize: 14.5, fontWeight: '800'},
    picked: {color: theme.colors.text, fontSize: 13.5, fontWeight: '700', marginTop: 12},
    notice: {fontSize: 13, lineHeight: 19, marginTop: 12, fontWeight: '600'},
    noticeError: {color: theme.colors.danger},
    noticeOk: {color: theme.colors.success},
  });
}
