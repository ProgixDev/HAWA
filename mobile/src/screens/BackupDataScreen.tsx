import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, Share, StatusBar, StyleSheet, Switch, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {backupNow, formatBytes, getBackupSnapshot, loadBackupSettings, readAwaStorage, saveBackupSettings, type BackupSettings, type BackupSnapshot} from '../services/backupService';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

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
          <Text style={[styles.rowTitle, danger && styles.dangerText]}>{title}</Text>
          {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
        </View>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={22} />
    </Pressable>
  );
}

export default function BackupDataScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const [snapshot, setSnapshot] = useState<BackupSnapshot>();
  const [settings, setSettings] = useState<BackupSettings>({enabled: true, wifiOnly: true, frequency: 'daily'});
  const [backingUp, setBackingUp] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getBackupSnapshot().then(setSnapshot);
    loadBackupSettings().then(setSettings);
  }, []);

  const notify = (value: string) => {
    setToast(value);
    setTimeout(() => setToast(''), 2300);
  };
  const runBackup = async () => {
    if (backingUp) {return;}
    setBackingUp(true);
    try {
      setSnapshot(await backupNow());
      notify('Sauvegarde locale terminée ✓');
    } catch {
      notify('Impossible d’effectuer la sauvegarde.');
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
    const data = await readAwaStorage();
    await Share.share({title: 'Mes données AWA', message: JSON.stringify(data, null, 2)});
  };

  const backupDate = snapshot
    ? new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}).format(new Date(snapshot.createdAt))
    : 'Aucune copie';

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
          <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={({pressed}) => [styles.back, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Sauvegarde</Text>
            <Text style={styles.subtitle}>Tes données, toujours en sécurité 💜</Text>
          </View>
          <View style={styles.decor}>
            <MaterialDesignIcons color={theme.colors.primary} name="cloud-upload-outline" size={41} />
            <MaterialDesignIcons color={theme.colors.secondary} name="leaf" size={32} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(70).duration(420)} style={styles.intro}>
          <View style={styles.introIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="cloud-lock-outline" size={30} />
          </View>
          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>Tes données sont protégées</Text>
            <Text style={styles.introText}>AWA peut créer une copie locale de tes informations sur cet appareil.</Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Sauvegarde sécurisée</Text>
        <Animated.View entering={FadeInUp.delay(130).duration(420)} style={styles.backupCard}>
          <Pressable onPress={() => setSettingsOpen(true)} style={({pressed}) => [styles.backupTop, pressed && styles.pressed]}>
            <View style={styles.cloudIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="cloud-upload-outline" size={35} />
            </View>
            <View style={styles.backupCopy}>
              <View style={styles.statusLine}>
                <Text style={styles.backupTitle}>{settings.enabled ? 'Sauvegarde activée' : 'Sauvegarde désactivée'}</Text>
                <View style={styles.localBadge}><Text style={styles.localText}>Copie locale</Text></View>
              </View>
              <Text style={styles.metaLabel}>Dernière sauvegarde</Text>
              <Text style={styles.metaValue}>{backupDate}</Text>
              <Text style={styles.metaLabel}>Taille des données</Text>
              <Text style={styles.metaValue}>{snapshot ? formatBytes(snapshot.sizeBytes) : '—'}</Text>
            </View>
            <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={22} />
          </Pressable>
          <View style={styles.separator} />
          <View style={styles.backupAction}>
            <MaterialDesignIcons color={theme.colors.primary} name="sync" size={23} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Sauvegarder maintenant</Text>
              <Text style={styles.actionText}>Créer une nouvelle copie de tes données</Text>
            </View>
            <Pressable disabled={backingUp} onPress={runBackup} style={[styles.saveButton, backingUp && styles.disabled]}>
              {backingUp ? <ActivityIndicator color={onPrimaryTextColor(theme)} size="small" /> : <Text style={styles.saveText}>Sauvegarder</Text>}
            </Pressable>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Restaurer</Text>
        <DataRow
          icon="backup-restore" onPress={() => navigation.navigate('RestoreBackup')} styles={styles} theme={theme}
          subtitle="Remettre tes données comme lors de la copie précédente" title="Restaurer une sauvegarde"
        />

        <Text style={styles.sectionTitle}>Gérer mes données</Text>
        <Animated.View entering={FadeInUp.delay(220).duration(420)} style={styles.card}>
          <DataRow icon="download-outline" onPress={download} styles={styles} theme={theme} subtitle="Recevoir une copie de toutes tes données" title="Télécharger mes données" />
          <DataRow
            badge="PDF / CSV" icon="file-export-outline" onPress={() => navigation.navigate('DataExport')} styles={styles} theme={theme}
            subtitle="Exporter ton historique et tes données" title="Exporter mes données"
          />
          <DataRow
            danger last icon="delete-outline" onPress={() => navigation.navigate('DeleteTrackedData')} styles={styles} theme={theme}
            subtitle="Supprimer définitivement tes données de suivi" title="Supprimer mes données"
          />
        </Animated.View>

        <View style={styles.info}>
          <MaterialDesignIcons color={theme.colors.primary} name="lock-outline" size={21} />
          <Text style={styles.infoText}>Tes données sont stockées localement par AWA.{'\n'}La copie locale reste sur cet appareil.</Text>
        </View>
      </ScrollView>

      <Modal animationType="slide" onRequestClose={() => setSettingsOpen(false)} statusBarTranslucent transparent visible={settingsOpen}>
        <View style={styles.modalRoot}>
          <Pressable onPress={() => setSettingsOpen(false)} style={styles.backdrop} />
          <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 18)}]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Sauvegarde automatique</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>Activée</Text>
                <Text style={styles.settingText}>Autoriser la création de copies locales.</Text>
              </View>
              <Switch onValueChange={value => updateSettings({enabled: value})} trackColor={{false: theme.colors.surfaceSecondary, true: theme.colors.primary}} value={settings.enabled} />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>Wi-Fi uniquement</Text>
                <Text style={styles.settingText}>Prêt pour une future sauvegarde cloud.</Text>
              </View>
              <Switch onValueChange={value => updateSettings({wifiOnly: value})} trackColor={{false: theme.colors.surfaceSecondary, true: theme.colors.primary}} value={settings.wifiOnly} />
            </View>
            <Text style={styles.settingTitle}>Fréquence préférée</Text>
            <View style={styles.frequency}>
              {(['daily', 'weekly', 'manual'] as const).map(value => (
                <Pressable key={value} onPress={() => updateSettings({frequency: value})} style={[styles.frequencyOption, settings.frequency === value && styles.frequencySelected]}>
                  <Text style={[styles.frequencyText, settings.frequency === value && styles.frequencyTextSelected]}>
                    {value === 'daily' ? 'Quotidienne' : value === 'weekly' ? 'Hebdomadaire' : 'Manuelle'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setSettingsOpen(false)} style={styles.done}>
              <Text style={styles.doneText}>Terminer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {toast ? (
        <Animated.View entering={FadeInUp.springify()} style={[styles.toast, {bottom: Math.max(insets.bottom, 18) + 12}]}>
          <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={16} />
          <Text style={styles.toastText}>{toast}</Text>
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
    back: {alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: theme.colors.surface, padding: 9, elevation: 2},
    headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 10},
    title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 23, fontWeight: '700'},
    subtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11.5},
    decor: {flexDirection: 'row', alignItems: 'center'},
    intro: {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.08), borderRadius: 24, backgroundColor: theme.colors.surface, padding: 14},
    introIcon: {alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: theme.colors.primarySoft, padding: 13},
    introCopy: {flex: 1, marginLeft: 12},
    introTitle: {color: theme.colors.text, fontSize: 13.5, fontWeight: '700'},
    introText: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16},
    sectionTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 15.5, fontWeight: '700'},
    backupCard: {borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.08), borderRadius: 24, backgroundColor: theme.colors.surface, padding: 13},
    backupTop: {flexDirection: 'row', alignItems: 'center'},
    cloudIcon: {alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: theme.colors.primarySoft, padding: 13},
    backupCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
    statusLine: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6},
    backupTitle: {color: theme.colors.text, fontSize: 13, fontWeight: '700'},
    // Generic "on/enabled" status — theme.colors.success.
    localBadge: {borderRadius: 10, backgroundColor: withAlpha(theme.colors.success, 0.16), paddingHorizontal: 7, paddingVertical: 3},
    localText: {color: theme.colors.success, fontSize: 8.5, fontWeight: '700'},
    metaLabel: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 9},
    metaValue: {marginTop: 1, color: theme.colors.text, fontSize: 10.5, fontWeight: '700'},
    separator: {height: StyleSheet.hairlineWidth, backgroundColor: withAlpha(theme.colors.primary, 0.10), marginVertical: 12},
    backupAction: {flexDirection: 'row', alignItems: 'center'},
    actionCopy: {flex: 1, minWidth: 0, marginHorizontal: 9},
    actionTitle: {color: theme.colors.text, fontSize: 11.5, fontWeight: '700'},
    actionText: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 9.5},
    saveButton: {borderRadius: 15, backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 9},
    saveText: {color: onPrimaryTextColor(theme), fontSize: 9.5, fontWeight: '700'},
    disabled: {opacity: 0.55},
    card: {overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.08), borderRadius: 24, backgroundColor: theme.colors.surface, paddingHorizontal: 11},
    row: {
      minHeight: 65, flexDirection: 'row', alignItems: 'center', borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.08), borderRadius: 22,
      backgroundColor: theme.colors.surface, paddingHorizontal: 11, paddingVertical: 9,
    },
    rowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.08)},
    rowIcon: {alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.colors.primarySoft, padding: 9},
    dangerIcon: {backgroundColor: withAlpha(theme.colors.danger, 0.15)},
    rowCopy: {flex: 1, minWidth: 0, marginHorizontal: 10},
    rowTitleLine: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6},
    rowTitle: {color: theme.colors.text, fontSize: 11.5, fontWeight: '700'},
    dangerText: {color: theme.colors.danger},
    badge: {borderRadius: 9, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 6, paddingVertical: 2},
    badgeText: {color: theme.colors.primary, fontSize: 8, fontWeight: '700'},
    rowSubtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 9.5, lineHeight: 14},
    info: {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, backgroundColor: theme.colors.primarySoft, padding: 13},
    infoText: {flex: 1, color: theme.colors.textSecondary, fontSize: 10.5, lineHeight: 15},
    pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
    modalRoot: {flex: 1, justifyContent: 'flex-end'},
    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(35,21,72,.38)'},
    sheet: {borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: theme.colors.surface, paddingHorizontal: 18, paddingTop: 10},
    handle: {alignSelf: 'center', width: '14%', aspectRatio: 8, borderRadius: 999, backgroundColor: withAlpha(theme.colors.primary, 0.25)},
    sheetTitle: {marginTop: 16, marginBottom: 12, color: theme.colors.accent, fontFamily: 'serif', fontSize: 21, fontWeight: '700', textAlign: 'center'},
    settingRow: {flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.10), paddingVertical: 12},
    settingCopy: {flex: 1},
    settingTitle: {color: theme.colors.text, fontSize: 12.5, fontWeight: '700'},
    settingText: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 10.5},
    frequency: {flexDirection: 'row', gap: 7, marginTop: 9},
    frequencyOption: {flex: 1, alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 14, padding: 10},
    frequencySelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    frequencyText: {color: theme.colors.textSecondary, fontSize: 10},
    frequencyTextSelected: {color: theme.colors.primary, fontWeight: '700'},
    done: {alignItems: 'center', marginTop: 16, borderRadius: 17, backgroundColor: theme.colors.primary, padding: 14},
    doneText: {color: onPrimaryTextColor(theme), fontSize: 14, fontWeight: '700'},
    toast: {
      position: 'absolute', left: '10%', right: '10%', flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 8, borderRadius: 18, backgroundColor: theme.colors.primary, padding: 13, elevation: 8,
    },
    toastText: {color: onPrimaryTextColor(theme), fontSize: 11.5, fontWeight: '700'},
  });
}
