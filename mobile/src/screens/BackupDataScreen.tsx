import React, {useEffect, useMemo, useState} from 'react';
import {Modal, Pressable, ScrollView, Share, StatusBar, StyleSheet, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import '../i18n';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {backupNow, backupNowForProfile, buildPortableDataJson, buildPortableDataJsonForProfile, formatBytes, getBackupSnapshot, getBackupSnapshotForProfile, loadBackupSettings, saveBackupSettings, type BackupSettings, type BackupSnapshot} from '../services/backupService';
import {getActiveProfileIdentity} from '../state/activeProfileStore';
import {dateFormatLocale} from '../utils/cycleMath';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaSwitch} from '../components/ui/AwaSwitch';
import {AwaText} from '../components/ui/AwaText';

type Props = NativeStackScreenProps<RootStackParamList, 'BackupData'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

function DataRow({
  icon, title, subtitle, onPress, last, danger, badge, theme, styles,
}: {
  icon: IconName; title: string; subtitle: string; onPress: () => void; last?: boolean;
  danger?: boolean; badge?: string; theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, danger && styles.dangerIcon]}>
        <MaterialDesignIcons color={danger ? theme.colors.danger : theme.colors.primary} name={icon} size={19} />
      </View>
      <View style={styles.rowCopy}>
        <View style={styles.rowTitleLine}>
          <AwaText colorRole={danger ? 'error' : 'onSurface'} emphasized style={styles.rowTitle} variant="titleSmall">{title}</AwaText>
          {badge ? <View style={styles.badge}><AwaText colorRole="primary" emphasized variant="labelSmall">{badge}</AwaText></View> : null}
        </View>
        <AwaText colorRole="onSurfaceVariant" style={styles.rowSubtitle} variant="bodySmall">{subtitle}</AwaText>
      </View>
      <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={22} />
    </Pressable>
  );
}

export default function BackupDataScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  // A managed daughter profile is NOT an independent account (CLAUDE.md
  // §4) — every action on this screen stays visible for her, but each now
  // operates ONLY on her own profile-scoped data (see backupService.ts's
  // profile-scoped variants — each writes to/reads from HER OWN dedicated
  // storage key, never the owner's), and copy is adapted with her real
  // firstName. The owner's own path (backupNow/getBackupSnapshot) is
  // completely untouched — same functions, same BACKUP_KEY, same behavior
  // as before this feature existed.
  const activeIdentity = useMemo(() => getActiveProfileIdentity(), []);
  const daughterFirstName = activeIdentity.managedProfile?.firstName ?? '';
  const [snapshot, setSnapshot] = useState<BackupSnapshot>();
  const [settings, setSettings] = useState<BackupSettings>({enabled: true, wifiOnly: true, frequency: 'daily'});
  const [backingUp, setBackingUp] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    (activeIdentity.isManagedProfile ? getBackupSnapshotForProfile(activeIdentity.id) : getBackupSnapshot()).then(setSnapshot);
    loadBackupSettings().then(setSettings);
  }, [activeIdentity.id, activeIdentity.isManagedProfile]);

  const notify = (value: string) => {
    setToast(value);
    setTimeout(() => setToast(''), 2300);
  };
  const runBackup = async () => {
    if (backingUp) {return;}
    setBackingUp(true);
    try {
      setSnapshot(activeIdentity.isManagedProfile ? await backupNowForProfile(activeIdentity.id) : await backupNow());
      notify(activeIdentity.isManagedProfile
        ? t('backupData.toastBackupDoneDaughter', {firstName: daughterFirstName})
        : t('backupData.toastBackupDoneOwner'));
    } catch {
      notify(t('backupData.toastBackupFailed'));
    } finally {
      setBackingUp(false);
    }
  };
  const updateSettings = async (patch: Partial<BackupSettings>) => {
    const next = {...settings, ...patch};
    setSettings(next);
    await saveBackupSettings(next);
  };
  const download = async () => {
    const message = activeIdentity.isManagedProfile
      ? await buildPortableDataJsonForProfile(activeIdentity.id)
      : await buildPortableDataJson();
    await Share.share({
      title: activeIdentity.isManagedProfile
        ? t('backupData.shareTitleDaughter', {firstName: daughterFirstName})
        : t('backupData.shareTitleOwner'),
      message,
    });
  };

  // snapshot is parsed straight from AsyncStorage JSON (getBackupSnapshot) —
  // an older/differently-shaped backup blob could carry a missing or
  // malformed createdAt, which used to crash this screen via
  // Intl.DateTimeFormat().format() on an Invalid Date.
  const snapshotCreatedAt = snapshot ? new Date(snapshot.createdAt) : null;
  const backupDate =
    snapshotCreatedAt && !Number.isNaN(snapshotCreatedAt.getTime())
      ? new Intl.DateTimeFormat(dateFormatLocale(), {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}).format(snapshotCreatedAt)
      : t('backupData.noBackupYet');

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
          <AwaIconButton accessibilityLabel={t('common.back')} icon="chevron-left" onPress={navigation.goBack} />
          <View style={styles.headerCopy}>
            <AwaText variant="headlineSmall">{t('backupData.title')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">
              {activeIdentity.isManagedProfile
                ? t('backupData.subtitleDaughter', {firstName: daughterFirstName})
                : t('backupData.subtitleOwner')}
            </AwaText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(70).duration(420)}>
          <AwaCard style={styles.intro} variant="filled">
            <MaterialDesignIcons color={theme.colors.primary} name="cloud-lock-outline" size={28} />
            <View style={styles.introCopy}>
              <AwaText variant="titleSmall">{t('backupData.introTitle')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.introText} variant="bodySmall">{t('backupData.introText')}</AwaText>
            </View>
          </AwaCard>
        </Animated.View>

        <AwaText style={styles.sectionTitle} variant="titleMedium">{t('backupData.sectionSecureBackup')}</AwaText>
        <Animated.View entering={FadeInUp.delay(130).duration(420)}>
          <AwaCard style={styles.backupCard}>
          <Pressable onPress={() => setSettingsOpen(true)} style={({pressed}) => [styles.backupTop, pressed && styles.pressed]}>
            <View style={styles.backupCopy}>
              <View style={styles.statusLine}>
                <AwaText emphasized variant="titleSmall">{settings.enabled ? t('backupData.statusEnabled') : t('backupData.statusDisabled')}</AwaText>
                <View style={styles.localBadge}><AwaText colorRole="success" emphasized variant="labelSmall">{t('backupData.localCopyBadge')}</AwaText></View>
              </View>
              <AwaText colorRole="onSurfaceVariant" style={styles.metaLabel} variant="bodySmall">{t('backupData.lastBackupLabel')}</AwaText>
              <AwaText emphasized style={styles.metaValue} variant="bodyMedium">{backupDate}</AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.metaLabel} variant="bodySmall">{t('backupData.dataSizeLabel')}</AwaText>
              <AwaText emphasized style={styles.metaValue} variant="bodyMedium">{snapshot ? formatBytes(snapshot.sizeBytes) : '—'}</AwaText>
            </View>
            <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={22} />
          </Pressable>
          <View style={styles.separator} />
          <View style={styles.backupAction}>
            <View style={styles.actionCopy}>
              <AwaText emphasized variant="titleSmall">
                {activeIdentity.isManagedProfile
                  ? t('backupData.backupNowTitleDaughter', {firstName: daughterFirstName})
                  : t('backupData.backupNowTitleOwner')}
              </AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.actionText} variant="bodySmall">
                {activeIdentity.isManagedProfile
                  ? t('backupData.backupNowTextDaughter', {firstName: daughterFirstName})
                  : t('backupData.backupNowTextOwner')}
              </AwaText>
            </View>
            <AwaButton
              disabled={backingUp}
              label={t('backupData.backupButton')}
              loading={backingUp}
              onPress={runBackup}
              size="compact"
            />
          </View>
          </AwaCard>
        </Animated.View>

        <AwaText style={styles.sectionTitle} variant="titleMedium">{t('backupData.sectionRestore')}</AwaText>
        <DataRow
          icon="backup-restore" onPress={() => navigation.navigate('RestoreBackup')} styles={styles} theme={theme}
          subtitle={
            activeIdentity.isManagedProfile
              ? t('backupData.restoreSubtitleDaughter', {firstName: daughterFirstName})
              : t('backupData.restoreSubtitleOwner')
          }
          title={activeIdentity.isManagedProfile
            ? t('backupData.restoreTitleDaughter', {firstName: daughterFirstName})
            : t('backupData.restoreTitleOwner')}
        />

        <DataRow
          icon="shield-lock-outline" onPress={() => navigation.navigate('PortableBackup')} styles={styles} theme={theme}
          subtitle={t('portableBackup.entrySubtitle')}
          title={t('portableBackup.entryTitle')}
        />

        <AwaText style={styles.sectionTitle} variant="titleMedium">
          {activeIdentity.isManagedProfile
            ? t('backupData.sectionManageDaughter', {firstName: daughterFirstName})
            : t('backupData.sectionManageOwner')}
        </AwaText>
        <Animated.View entering={FadeInUp.delay(220).duration(420)} style={styles.card}>
          <DataRow
            icon="download-outline" onPress={download} styles={styles} theme={theme}
            subtitle={activeIdentity.isManagedProfile
              ? t('backupData.downloadSubtitleDaughter', {firstName: daughterFirstName})
              : t('backupData.downloadSubtitleOwner')}
            title={activeIdentity.isManagedProfile
              ? t('backupData.downloadTitleDaughter', {firstName: daughterFirstName})
              : t('backupData.downloadTitleOwner')}
          />
          <DataRow
            badge="PDF / CSV" icon="file-export-outline" onPress={() => navigation.navigate('DataExport')} styles={styles} theme={theme}
            subtitle={activeIdentity.isManagedProfile
              ? t('backupData.exportSubtitleDaughter', {firstName: daughterFirstName})
              : t('backupData.exportSubtitleOwner')}
            title={activeIdentity.isManagedProfile
              ? t('backupData.exportTitleDaughter', {firstName: daughterFirstName})
              : t('backupData.exportTitleOwner')}
          />
          <DataRow
            danger last icon="delete-outline" onPress={() => navigation.navigate('DeleteTrackedData')} styles={styles} theme={theme}
            subtitle={activeIdentity.isManagedProfile
              ? t('backupData.deleteSubtitleDaughter', {firstName: daughterFirstName})
              : t('backupData.deleteSubtitleOwner')}
            title={activeIdentity.isManagedProfile
              ? t('backupData.deleteTitleDaughter', {firstName: daughterFirstName})
              : t('backupData.deleteTitleOwner')}
          />
        </Animated.View>

        <View style={styles.info}>
          <MaterialDesignIcons color={theme.colors.primary} name="lock-outline" size={21} />
          <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">{t('backupData.infoText')}</AwaText>
        </View>

        {/* Private photo FILES are not part of any backup (only their paths are) — said here as well as in the portable backup. */}
        <View style={styles.info}>
          <MaterialDesignIcons color={theme.colors.primary} name="image-off-outline" size={21} />
          <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">{t('portableBackup.photosNote')}</AwaText>
        </View>
      </ScrollView>

      <Modal animationType="slide" onRequestClose={() => setSettingsOpen(false)} statusBarTranslucent transparent visible={settingsOpen}>
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setSettingsOpen(false)} style={styles.backdrop} />
          <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 18)}]}>
            <View style={styles.handle} />
            <AwaText style={styles.sheetTitle} variant="titleLarge">{t('backupData.modal.title')}</AwaText>
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <AwaText emphasized variant="titleSmall">{t('backupData.modal.enabledTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.settingText} variant="bodySmall">{t('backupData.modal.enabledText')}</AwaText>
              </View>
              <AwaSwitch accessibilityLabel={t('backupData.modal.enabledTitle')} onValueChange={value => updateSettings({enabled: value})} value={settings.enabled} />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <AwaText emphasized variant="titleSmall">{t('backupData.modal.wifiTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.settingText} variant="bodySmall">{t('backupData.modal.wifiText')}</AwaText>
              </View>
              <AwaSwitch accessibilityLabel={t('backupData.modal.wifiTitle')} onValueChange={value => updateSettings({wifiOnly: value})} value={settings.wifiOnly} />
            </View>
            <AwaText emphasized style={styles.frequencyTitle} variant="titleSmall">{t('backupData.modal.frequencyTitle')}</AwaText>
            <View style={styles.frequency}>
              {(['daily', 'weekly', 'manual'] as const).map(value => (
                <Pressable accessibilityRole="button" accessibilityState={{selected: settings.frequency === value}} key={value} onPress={() => updateSettings({frequency: value})} style={[styles.frequencyOption, settings.frequency === value && styles.frequencySelected]}>
                  <AwaText colorRole={settings.frequency === value ? 'primary' : 'onSurfaceVariant'} emphasized={settings.frequency === value} variant="labelLarge">
                    {t(`backupData.modal.frequency.${value}`)}
                  </AwaText>
                </Pressable>
              ))}
            </View>
            <AwaButton fullWidth label={t('backupData.modal.done')} onPress={() => setSettingsOpen(false)} size="large" style={styles.done} />
          </View>
        </View>
      </Modal>

      {toast ? (
        <Animated.View entering={FadeInUp.springify()} style={[styles.toast, {bottom: Math.max(insets.bottom, 18) + 12}]}>
          <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={16} />
          <AwaText color={onPrimaryTextColor(theme)} emphasized variant="labelLarge">{toast}</AwaText>
        </Animated.View>
      ) : null}
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
    intro: {flexDirection: 'row', alignItems: 'center'},
    introCopy: {flex: 1, marginLeft: 12},
    introText: {marginTop: 4},
    sectionTitle: {marginTop: 4},
    backupCard: {},
    backupTop: {flexDirection: 'row', alignItems: 'center'},
    backupCopy: {flex: 1, minWidth: 0, marginRight: 12},
    statusLine: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8},
    // Generic "on/enabled" status — theme.colors.success.
    localBadge: {borderRadius: 12, backgroundColor: withAlpha(theme.colors.success, 0.16), paddingHorizontal: 8, paddingVertical: 4},
    metaLabel: {marginTop: 8},
    metaValue: {marginTop: 2},
    separator: {height: StyleSheet.hairlineWidth, backgroundColor: withAlpha(theme.colors.primary, 0.10), marginVertical: 12},
    backupAction: {flexDirection: 'row', alignItems: 'center'},
    actionCopy: {flex: 1, minWidth: 0, marginRight: 12},
    actionText: {marginTop: 4},
    card: {overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.08), borderRadius: 12, backgroundColor: theme.colors.surface, paddingHorizontal: 12},
    row: {
      minHeight: 65, flexDirection: 'row', alignItems: 'center', borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.08), borderRadius: 12,
      backgroundColor: theme.colors.surface, paddingHorizontal: 16, paddingVertical: 12,
    },
    rowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.08)},
    rowIcon: {alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.colors.primarySoft, padding: 9},
    dangerIcon: {backgroundColor: withAlpha(theme.colors.danger, 0.15)},
    rowCopy: {flex: 1, minWidth: 0, marginHorizontal: 10},
    rowTitleLine: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6},
    rowTitle: {flexShrink: 1},
    badge: {borderRadius: 12, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 8, paddingVertical: 2},
    rowSubtitle: {marginTop: 3},
    info: {flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, backgroundColor: theme.colors.primarySoft, padding: 16},
    infoText: {flex: 1},
    pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
    modalRoot: {flex: 1, justifyContent: 'flex-end'},
    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,21,72,.38)'},
    sheet: {borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: theme.colors.surface, paddingHorizontal: 18, paddingTop: 10},
    handle: {alignSelf: 'center', width: '14%', aspectRatio: 8, borderRadius: 999, backgroundColor: withAlpha(theme.colors.primary, 0.25)},
    sheetTitle: {marginTop: 16, marginBottom: 12, textAlign: 'center'},
    settingRow: {flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.10), paddingVertical: 12},
    settingCopy: {flex: 1},
    settingText: {marginTop: 4},
    frequencyTitle: {marginTop: 12},
    frequency: {flexDirection: 'row', gap: 8, marginTop: 8},
    frequencyOption: {flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 12, padding: 12},
    frequencySelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    done: {marginTop: 16},
    toast: {
      position: 'absolute', left: '10%', right: '10%', flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: theme.colors.primary, padding: 16, elevation: 6,
    },
  });
}
