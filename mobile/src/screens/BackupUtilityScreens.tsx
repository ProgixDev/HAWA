import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';

import {
  deleteTrackedData,
  formatBytes,
  getBackupSnapshot,
  restoreBackup,
  type BackupSnapshot,
} from '../services/backupService';

import {getExportConfigurationForObjective} from '../config/objectiveExportConfig';
import {buildMedicalExport} from '../services/medicalExportOrchestrator';
import {generateMedicalExportPdfBase64} from '../services/medicalExportPdf';
import {buildExportFilename, shareExportFile} from '../services/medicalExportShare';
import {usePremium} from '../hooks/usePremium';
import {HawaPremiumBottomSheet} from '../components/premium/HawaPremiumBottomSheet';
import {
  getActiveObjective,
  hydrateActiveObjective,
  subscribeActiveObjective,
  type ObjectiveId,
} from '../state/onboardingPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

type Period =
  | 'all'
  | '3m'
  | '6m'
  | '12m';

type Format =
  | 'csv'
  | 'pdf';

type IconName =
  React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];


/* ============================================================
   SHELL
============================================================ */

function Shell({
  title,
  subtitle,
  navigation,
  children,
  theme,
  styles,
}: {
  title: string;
  subtitle: string;
  navigation: {
    goBack: () => void;
  };
  children: React.ReactNode;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  const insets =
    useSafeAreaInsets();

  const {width} =
    useWindowDimensions();

  const compact =
    width < 360;

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={styles.safe}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
      />

      <View pointerEvents="none" style={styles.backgroundDecor}>
        <View style={styles.glowTop} />
        <View style={styles.glowLeft} />
        <View style={styles.glowBottom} />
      </View>

      <View
        style={[
          styles.header,
          {
            paddingTop:
              Math.max(
                insets.top,
                18,
              ) + 8,
          },
        ]}>
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          hitSlop={8}
          onPress={
            navigation.goBack
          }
          style={({pressed}) => [
            styles.backButton,
            pressed &&
              styles.pressed,
          ]}>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="chevron-left"
            size={27}
          />
        </Pressable>

        <View
          style={
            styles.headerCopy
          }>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            numberOfLines={1}
            style={[
              styles.headerTitle,
              compact &&
                styles.headerTitleCompact,
            ]}>
            {title}
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }>
            {subtitle}
          </Text>
        </View>

        <View
          style={
            styles.headerSpacer
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          compact
            ? styles.contentCompact
            : styles.contentRegular,
          {
            paddingBottom:
              Math.max(
                insets.bottom,
                18,
              ) + 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   REUSABLE HERO ICON
============================================================ */

function HeroIcon({
  icon,
  color,
  backgroundColor,
  theme,
  styles: heroStyles,
}: {
  icon: IconName;
  color?: string;
  backgroundColor?: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View
      style={[
        heroStyles.heroIcon,
        {
          backgroundColor:
            backgroundColor ?? theme.colors.primarySoft,
        },
      ]}>
      <MaterialDesignIcons
        color={color ?? theme.colors.primary}
        name={icon}
        size={31}
      />
    </View>
  );
}

/* ============================================================
   RESTORE BACKUP
============================================================ */

export function RestoreBackupScreen({
  navigation,
}: NativeStackScreenProps<
  RootStackParamList,
  'RestoreBackup'
>) {
  const {theme} = useAwaTheme();
  const backupStyles = useMemo(() => createStyles(theme), [theme]);

  const [snapshot, setSnapshot] =
    useState<BackupSnapshot>();

  const [
    confirm,
    setConfirm,
  ] = useState(false);

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState('');

  useEffect(() => {
    getBackupSnapshot().then(
      setSnapshot,
    );
  }, []);

  const restore = async () => {
    if (
      !snapshot ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      await restoreBackup(
        snapshot,
      );

      setMessage(
        'Restauration terminée avec succès ✨',
      );

      setConfirm(false);
    } catch {
      setMessage(
        'Impossible de restaurer cette sauvegarde.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      navigation={navigation}
      styles={backupStyles}
      subtitle="Récupère tes données à partir d’une sauvegarde existante."
      theme={theme}
      title="Restaurer">
      <View
        style={
          backupStyles.heroCard
        }>
        <HeroIcon
          icon={
            snapshot
              ? 'backup-restore'
              : 'cloud-off-outline'
          }
          styles={backupStyles}
          theme={theme}
        />

        <Text
          style={
            backupStyles.heroTitle
          }>
          {snapshot
            ? 'Sauvegarde disponible'
            : 'Aucune sauvegarde'}
        </Text>

        <Text
          style={
            backupStyles.heroDescription
          }>
          {snapshot
            ? 'Une copie de tes données est prête à être restaurée.'
            : 'Crée d’abord une copie depuis la section Sauvegarde.'}
        </Text>

        {snapshot ? (
          <View
            style={
              backupStyles.backupInfo
            }>
            <InfoRow
              icon="calendar-outline"
              label="Date"
              theme={theme}
              styles={backupStyles}
              value={new Intl.DateTimeFormat(
                'fr-FR',
                {
                  dateStyle:
                    'medium',
                  timeStyle:
                    'short',
                },
              ).format(
                new Date(
                  snapshot.createdAt,
                ),
              )}
            />

            <View
              style={
                backupStyles.divider
              }
            />

            <InfoRow
              icon="database-outline"
              label="Taille"
              theme={theme}
              styles={backupStyles}
              value={formatBytes(
                snapshot.sizeBytes,
              )}
            />
          </View>
        ) : null}
      </View>

      {snapshot &&
      !confirm ? (
        <PrimaryButton
          icon="backup-restore"
          label="Restaurer cette sauvegarde"
          onPress={() =>
            setConfirm(true)
          }
          styles={backupStyles}
          theme={theme}
        />
      ) : null}

      {confirm ? (
        <View
          style={
            backupStyles.confirmCard
          }>
          <View
            style={
              backupStyles.confirmHeader
            }>
            <View
              style={
                backupStyles.warningIcon
              }>
              <MaterialDesignIcons
                color={theme.colors.warning}
                name="alert-outline"
                size={22}
              />
            </View>

            <View
              style={
                backupStyles.confirmCopy
              }>
              <Text
                style={
                  backupStyles.confirmTitle
                }>
                Confirmer la restauration
              </Text>

              <Text
                style={
                  backupStyles.confirmDescription
                }>
                Les données actuelles seront remplacées par celles de cette sauvegarde.
              </Text>
            </View>
          </View>

          <Pressable
            disabled={busy}
            onPress={restore}
            style={({pressed}) => [
              backupStyles.primaryButton,
              backupStyles.confirmPrimary,

              busy &&
                backupStyles.disabled,

              pressed &&
                !busy &&
                backupStyles.pressed,
            ]}>
            {busy ? (
              <ActivityIndicator
                color={onPrimaryTextColor(theme)}
              />
            ) : (
              <>
                <MaterialDesignIcons
                  color={onPrimaryTextColor(theme)}
                  name="check"
                  size={19}
                />

                <Text
                  style={
                    backupStyles.primaryText
                  }>
                  Confirmer
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            disabled={busy}
            onPress={() =>
              setConfirm(false)
            }
            style={({pressed}) => [
              backupStyles.cancelButton,
              pressed &&
                backupStyles.pressed,
            ]}>
            <Text
              style={
                backupStyles.cancelText
              }>
              Annuler
            </Text>
          </Pressable>
        </View>
      ) : null}

      {message ? (
        <View
          style={[
            backupStyles.message,

            message.includes(
              'succès',
            )
              ? backupStyles.messageSuccess
              : backupStyles.messageError,
          ]}>
          <MaterialDesignIcons
            color={
              message.includes(
                'succès',
              )
                ? theme.colors.success
                : theme.colors.danger
            }
            name={
              message.includes(
                'succès',
              )
                ? 'check-circle-outline'
                : 'alert-circle-outline'
            }
            size={20}
          />

          <Text
            style={[
              backupStyles.messageText,

              {
                color:
                  message.includes(
                    'succès',
                  )
                    ? theme.colors.success
                    : theme.colors.danger,
              },
            ]}>
            {message}
          </Text>
        </View>
      ) : null}
    </Shell>
  );
}

/* ============================================================
   EXPORT
============================================================ */

export function DataExportScreen({
  navigation,
}: NativeStackScreenProps<
  RootStackParamList,
  'DataExport'
>) {
  const {theme} = useAwaTheme();
  const backupStyles = useMemo(() => createStyles(theme), [theme]);

  const [
    period,
    setPeriod,
  ] = useState<Period>(
    'all',
  );

  const [
    format,
    setFormat,
  ] = useState<Format>(
    'csv',
  );

  // Objective-aware: every category shown/exported below comes from the
  // ACTIVE objective's own configuration (objectiveExportConfig.ts), never a
  // fixed global list — so Grossesse never shows Ménopause categories, and
  // vice versa. App.tsx already hydrates onboardingPreferences.ts at boot.
  const [objective, setObjective] = useState<ObjectiveId>(getActiveObjective);

  useEffect(() => {
    hydrateActiveObjective().then(setObjective);
    return subscribeActiveObjective(() => setObjective(getActiveObjective()));
  }, []);

  const exportConfig = getExportConfigurationForObjective(objective);

  // Export (CSV & PDF) is a marketed Premium benefit — see the "Exports
  // santé" line in HawaPremiumBottomSheet.tsx's own BENEFITS list and the
  // "Export PDF & CSV" line on ProfileScreen.tsx's Premium card. Gated here,
  // above the existing export logic — medicalExportOrchestrator.ts/
  // medicalExportPdf.ts/medicalExportShare.ts are completely untouched.
  const {isPremium} = usePremium();
  const [premiumVisible, setPremiumVisible] = useState(false);

  const [
    selected,
    setSelected,
  ] = useState<string[]>(() =>
    getExportConfigurationForObjective(getActiveObjective())
      .categories.filter(category => !category.sensitive)
      .map(category => category.value),
  );

  // Switching objective mid-session (e.g. via Profil) resets the selection
  // to that objective's own defaults — never keeps a category value that
  // belongs to the previous objective's configuration.
  useEffect(() => {
    setSelected(exportConfig.categories.filter(category => !category.sensitive).map(category => category.value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objective]);

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    exporting,
    setExporting,
  ] = useState(false);

  const toggle = (
    value: string,
  ) => {
    setSelected(current =>
      current.includes(value)
        ? current.filter(
            item =>
              item !== value,
          )
        : [
            ...current,
            value,
          ],
    );
  };

  const exportData = async () => {
    if (exporting) {return;}
    setMessage('');

    if (!selected.length) {
      setMessage('Sélectionne au moins une catégorie à exporter.');
      return;
    }

    setExporting(true);
    try {
      const result = await buildMedicalExport(
        objective,
        period,
        format,
        selected,
      );

      if (result.kind === 'empty') {
        setMessage('Aucune donnée disponible pour cette période et ces catégories.');
        return;
      }

      const filename = buildExportFilename(format, result.fromKey, result.toKey);
      const content =
        result.kind === 'csv'
          ? result.content
          : await generateMedicalExportPdfBase64(result.model);

      const outcome = await shareExportFile(format, content, filename);
      if (outcome === 'cancelled') {return;}
    } catch {
      setMessage('L’export a échoué. Réessaie dans un instant.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Shell
      navigation={navigation}
      styles={backupStyles}
      subtitle="Choisis les informations que tu souhaites récupérer."
      theme={theme}
      title="Exporter mes données">
      <View
        style={
          backupStyles.exportHero
        }>
        <View
          style={
            backupStyles.exportIcon
          }>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="tray-arrow-down"
            size={27}
          />
        </View>

        <View
          style={
            backupStyles.exportCopy
          }>
          <Text
            style={
              backupStyles.exportTitle
            }>
            Ton export personnalisé
          </Text>

          <Text
            style={
              backupStyles.exportDescription
            }>
            Sélectionne la période, le format et les informations à inclure.
          </Text>

          <Text
            style={
              backupStyles.exportObjectiveLabel
            }>
            Objectif actif : {exportConfig.label}
          </Text>
        </View>
      </View>

      {isPremium ? (
      <>
      <SectionTitle
        styles={backupStyles}
        subtitle="Choisis la durée de l’historique à exporter."
        title="Période"
      />

      <View
        style={
          backupStyles.choiceGrid
        }>
        <Choice
          icon="history"
          label="Tout l’historique"
          onPress={() =>
            setPeriod('all')
          }
          selected={
            period === 'all'
          }
          styles={backupStyles}
          theme={theme}
        />

        <Choice
          icon="calendar-range"
          label="3 mois"
          onPress={() =>
            setPeriod('3m')
          }
          selected={
            period === '3m'
          }
          styles={backupStyles}
          theme={theme}
        />

        <Choice
          icon="calendar-range"
          label="6 mois"
          onPress={() =>
            setPeriod('6m')
          }
          selected={
            period === '6m'
          }
          styles={backupStyles}
          theme={theme}
        />

        <Choice
          icon="calendar-range"
          label="12 mois"
          onPress={() =>
            setPeriod('12m')
          }
          selected={
            period === '12m'
          }
          styles={backupStyles}
          theme={theme}
        />
      </View>

      <SectionTitle
        styles={backupStyles}
        subtitle="CSV et PDF sont générés directement sur ton téléphone."
        title="Format"
      />

      <View
        style={
          backupStyles.formatRow
        }>
        <Choice
          icon="file-delimited-outline"
          label="CSV"
          onPress={() =>
            setFormat('csv')
          }
          selected={
            format === 'csv'
          }
          styles={backupStyles}
          theme={theme}
        />

        <Choice
          icon="file-pdf-box"
          label="PDF"
          onPress={() =>
            setFormat('pdf')
          }
          selected={
            format === 'pdf'
          }
          styles={backupStyles}
          theme={theme}
        />
      </View>

      <SectionTitle
        styles={backupStyles}
        subtitle="Les données sensibles ne sont jamais sélectionnées automatiquement."
        title="Catégories"
      />

      <View
        style={
          backupStyles.categoryCard
        }>
        {exportConfig.categories.map(
          (
            category,
            index,
          ) => {
            const active =
              selected.includes(
                category.value,
              );

            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked:
                    active,
                }}
                key={
                  category.value
                }
                onPress={() =>
                  toggle(
                    category.value,
                  )
                }
                style={({
                  pressed,
                }) => [
                  backupStyles.category,

                  index !==
                    exportConfig.categories.length -
                      1 &&
                    backupStyles.categoryBorder,

                  pressed &&
                    backupStyles.categoryPressed,
                ]}>
                <View
                  style={[
                    backupStyles.categoryIcon,

                    active &&
                      backupStyles.categoryIconActive,
                  ]}>
                  <MaterialDesignIcons
                    color={
                      active
                        ? theme.colors.primary
                        : theme.colors.textMuted
                    }
                    name={
                      category.icon as IconName
                    }
                    size={20}
                  />
                </View>

                <View
                  style={
                    backupStyles.categoryCopy
                  }>
                  <Text
                    style={
                      backupStyles.categoryName
                    }>
                    {
                      category.label
                    }
                  </Text>

                  {'sensitive' in
                    category &&
                  category.sensitive ? (
                    <View
                      style={
                        backupStyles.sensitiveBadge
                      }>
                      <MaterialDesignIcons
                        color={theme.colors.danger}
                        name="lock-outline"
                        size={10}
                      />

                      <Text
                        style={
                          backupStyles.sensitiveText
                        }>
                        Donnée sensible
                      </Text>
                    </View>
                  ) : null}
                </View>

                <MaterialDesignIcons
                  color={
                    active
                      ? theme.colors.primary
                      : theme.colors.textMuted
                  }
                  name={
                    active
                      ? 'checkbox-marked-circle'
                      : 'checkbox-blank-circle-outline'
                  }
                  size={23}
                />
              </Pressable>
            );
          },
        )}
      </View>

      <View
        style={
          backupStyles.selectionInfo
        }>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name="check-all"
          size={18}
        />

        <Text
          style={
            backupStyles.selectionText
          }>
          {selected.length}{' '}
          catégorie
          {selected.length >
          1
            ? 's'
            : ''}{' '}
          sélectionnée
          {selected.length >
          1
            ? 's'
            : ''}
        </Text>
      </View>

      <PrimaryButton
        disabled={exporting}
        icon="export-variant"
        label={exporting ? 'Génération en cours…' : 'Exporter mes données'}
        loading={exporting}
        onPress={exportData}
        styles={backupStyles}
        theme={theme}
      />

      {message ? (
        <View
          style={
            backupStyles.infoMessage
          }>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="information-outline"
            size={20}
          />

          <Text
            style={
              backupStyles.infoMessageText
            }>
            {message}
          </Text>
        </View>
      ) : null}
      </>
      ) : (
        <PremiumExportLockedCard onUpgrade={() => setPremiumVisible(true)} styles={backupStyles} theme={theme} />
      )}

      {!isPremium ? (
        <View style={backupStyles.privacyPriorityCard}>
          <View style={backupStyles.privacyPriorityIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="shield-check-outline" size={23} />
          </View>
          <View style={backupStyles.privacyPriorityCopy}>
            <Text style={backupStyles.privacyPriorityTitle}>Ta confidentialité est notre priorité</Text>
            <Text style={backupStyles.privacyPriorityDescription}>AWA ne partage jamais tes informations.</Text>
          </View>
          <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={25} />
        </View>
      ) : null}

      <HawaPremiumBottomSheet onClose={() => setPremiumVisible(false)} visible={premiumVisible} />
    </Shell>
  );
}

function PremiumExportBenefit({icon, title, description, theme, styles: benefitStyles}: {icon: IconName; title: string; description: string; theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>}) {
  return (
    <View style={benefitStyles.premiumBenefitRow}>
      <View style={benefitStyles.premiumBenefitIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={22} />
      </View>
      <View style={benefitStyles.premiumBenefitCopy}>
        <Text style={benefitStyles.premiumBenefitTitle}>{title}</Text>
        <Text style={benefitStyles.premiumBenefitDescription}>{description}</Text>
      </View>
    </View>
  );
}

function PremiumExportLockedCard({onUpgrade, theme, styles: lockedStyles}: {onUpgrade: () => void; theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>}) {
  return (
    <View style={lockedStyles.premiumExportCard}>
      <View style={lockedStyles.premiumLockHalo}>
        <View style={lockedStyles.premiumLockHexagon}>
          <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="lock-outline" size={27} />
        </View>
      </View>

      <View style={lockedStyles.premiumPill}>
        <Text style={lockedStyles.premiumPillText}>PREMIUM</Text>
      </View>

      <Text style={lockedStyles.premiumExportTitle}>Export CSV &amp; PDF</Text>
      <Text style={lockedStyles.premiumExportDescription}>
        Génère et partage un rapport complet de ton suivi à tout moment.
      </Text>

      <View style={lockedStyles.premiumDividerRow}>
        <View style={lockedStyles.premiumDivider} />
        <MaterialDesignIcons color={theme.colors.primary} name="crown" size={21} />
        <View style={lockedStyles.premiumDivider} />
      </View>

      <View style={lockedStyles.premiumBenefits}>
        <PremiumExportBenefit
          description="CSV ou PDF prêts à être utilisés ou partagés."
          icon="file-document-outline"
          styles={lockedStyles}
          theme={theme}
          title="Rapports complets et structurés"
        />
        <PremiumExportBenefit
          description="Accède à tout ton historique sans aucune limite."
          icon="history"
          styles={lockedStyles}
          theme={theme}
          title="Historique illimité"
        />
        <PremiumExportBenefit
          description="Tes données restent 100% privées et sécurisées."
          icon="shield-check-outline"
          styles={lockedStyles}
          theme={theme}
          title="Confidentialité assurée"
        />
        <PremiumExportBenefit
          description="Exploite tes données avec plus de profondeur et de clarté."
          icon="chart-box-outline"
          styles={lockedStyles}
          theme={theme}
          title="Analyse avancée"
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onUpgrade}
        style={({pressed}) => [lockedStyles.premiumUpgradeButton, pressed && lockedStyles.pressed]}>
        <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="crown" size={23} />
        <Text style={lockedStyles.premiumUpgradeText}>Découvrir Premium</Text>
        <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="chevron-right" size={27} />
      </Pressable>
    </View>
  );
}

/* ============================================================
   DELETE DATA
============================================================ */

export function DeleteTrackedDataScreen({
  navigation,
}: NativeStackScreenProps<
  RootStackParamList,
  'DeleteTrackedData'
>) {
  const {theme} = useAwaTheme();
  const backupStyles = useMemo(() => createStyles(theme), [theme]);

  const [
    value,
    setValue,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const [
    done,
    setDone,
  ] = useState(false);

  const isValid =
    value
      .trim()
      .toUpperCase() ===
    'SUPPRIMER';

  const remove = async () => {
    if (!isValid) {
      setError(
        'Écris SUPPRIMER pour confirmer.',
      );

      return;
    }

    await deleteTrackedData();

    setDone(true);
  };

  return (
    <Shell
      navigation={navigation}
      styles={backupStyles}
      subtitle="Gère définitivement tes données de suivi locales."
      theme={theme}
      title="Supprimer mes données">
      {!done ? (
        <>
          <View
            style={
              backupStyles.dangerHero
            }>
            <HeroIcon
              backgroundColor={withAlpha(theme.colors.danger, 0.12)}
              color={theme.colors.danger}
              icon="delete-alert-outline"
              styles={backupStyles}
              theme={theme}
            />

            <Text
              style={
                backupStyles.dangerTitle
              }>
              Action irréversible
            </Text>

            <Text
              style={
                backupStyles.dangerDescription
              }>
              Cette action supprimera définitivement tes données de suivi locales.
            </Text>

            <View
              style={
                backupStyles.dangerItems
              }>
              <DangerItem
                label="Journal quotidien"
                styles={backupStyles}
                theme={theme}
              />

              <DangerItem
                label="Historique du cycle"
                styles={backupStyles}
                theme={theme}
              />

              <DangerItem
                label="Données de suivi locales"
                styles={backupStyles}
                theme={theme}
              />
            </View>

            <View
              style={
                backupStyles.accountNotice
              }>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="account-check-outline"
                size={18}
              />

              <Text
                style={
                  backupStyles.accountNoticeText
                }>
                Ton compte AWA ne sera pas supprimé.
              </Text>
            </View>
          </View>

          <View
            style={
              backupStyles.deleteConfirmCard
            }>
            <View
              style={
                backupStyles.deleteConfirmHeader
              }>
              <View
                style={
                  backupStyles.stepBadge
                }>
                <Text
                  style={
                    backupStyles.stepText
                  }>
                  1
                </Text>
              </View>

              <View
                style={
                  backupStyles.deleteConfirmCopy
                }>
                <Text
                  style={
                    backupStyles.deleteConfirmTitle
                  }>
                  Confirme ton choix
                </Text>

                <Text
                  style={
                    backupStyles.deleteConfirmSubtitle
                  }>
                  Écris SUPPRIMER pour continuer.
                </Text>
              </View>
            </View>

            <TextInput
              autoCapitalize="characters"
              autoCorrect={false}
              onChangeText={text => {
                setValue(text);
                setError('');
              }}
              placeholder="SUPPRIMER"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                backupStyles.input,

                isValid &&
                  backupStyles.inputValid,

                error &&
                  backupStyles.inputError,
              ]}
              value={value}
            />

            {isValid ? (
              <View
                style={
                  backupStyles.validRow
                }>
                <MaterialDesignIcons
                  color={theme.colors.success}
                  name="check-circle"
                  size={16}
                />

                <Text
                  style={
                    backupStyles.validText
                  }>
                  Confirmation correcte
                </Text>
              </View>
            ) : null}

            {error ? (
              <View
                style={
                  backupStyles.errorRow
                }>
                <MaterialDesignIcons
                  color={theme.colors.danger}
                  name="alert-circle-outline"
                  size={16}
                />

                <Text
                  style={
                    backupStyles.errorText
                  }>
                  {error}
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!isValid}
            onPress={remove}
            style={({pressed}) => [
              backupStyles.deleteButton,

              !isValid &&
                backupStyles.deleteDisabled,

              pressed &&
                isValid &&
                backupStyles.pressed,
            ]}>
            <MaterialDesignIcons
              color={onPrimaryTextColor(theme)}
              name="delete-forever-outline"
              size={20}
            />

            <Text
              style={
                backupStyles.primaryText
              }>
              Supprimer définitivement
            </Text>
          </Pressable>

          <Text
            style={
              backupStyles.deleteFootnote
            }>
            Cette action ne peut pas être annulée.
          </Text>
        </>
      ) : (
        <View
          style={
            backupStyles.successCard
          }>
          <HeroIcon
            backgroundColor={withAlpha(theme.colors.success, 0.14)}
            color={theme.colors.success}
            icon="check-circle-outline"
            styles={backupStyles}
            theme={theme}
          />

          <Text
            style={
              backupStyles.successTitle
            }>
            Données supprimées
          </Text>

          <Text
            style={
              backupStyles.successDescription
            }>
            Tes données de suivi locales ont été supprimées avec succès.
          </Text>

          <View
            style={
              backupStyles.successSeparator
            }
          />

          <PrimaryButton
            label="Terminer"
            onPress={
              navigation.goBack
            }
            styles={backupStyles}
            theme={theme}
          />
        </View>
      )}
    </Shell>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function SectionTitle({
  title,
  subtitle,
  styles: sectionStyles,
}: {
  title: string;
  subtitle: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View>
      <Text
        style={
          sectionStyles.sectionTitle
        }>
        {title}
      </Text>

      <Text
        style={
          sectionStyles.sectionSubtitle
        }>
        {subtitle}
      </Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  theme,
  styles: infoStyles,
}: {
  icon: IconName;
  label: string;
  value: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View
      style={
        infoStyles.infoRow
      }>
      <View
        style={
          infoStyles.infoIcon
        }>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={icon}
          size={18}
        />
      </View>

      <View
        style={
          infoStyles.infoCopy
        }>
        <Text
          style={
            infoStyles.infoLabel
          }>
          {label}
        </Text>

        <Text
          style={
            infoStyles.infoValue
          }>
          {value}
        </Text>
      </View>
    </View>
  );
}

function PrimaryButton({
  label,
  icon,
  onPress,
  disabled,
  loading,
  theme,
  styles: buttonStyles,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled: Boolean(disabled)}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        buttonStyles.primaryButton,
        pressed &&
          buttonStyles.pressed,
        disabled &&
          buttonStyles.primaryButtonDisabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={onPrimaryTextColor(theme)} size="small" />
      ) : icon ? (
        <MaterialDesignIcons
          color={onPrimaryTextColor(theme)}
          name={icon}
          size={20}
        />
      ) : null}

      <Text
        style={
          buttonStyles.primaryText
        }>
        {label}
      </Text>
    </Pressable>
  );
}

function Choice({
  label,
  selected,
  onPress,
  icon,
  theme,
  styles: choiceStyles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon: IconName;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{
        checked: selected,
      }}
      onPress={onPress}
      style={({pressed}) => [
        choiceStyles.choice,

        selected &&
          choiceStyles.choiceSelected,

        pressed &&
          choiceStyles.choicePressed,
      ]}>
      <View
        style={[
          choiceStyles.choiceIcon,

          selected &&
            choiceStyles.choiceIconSelected,
        ]}>
        <MaterialDesignIcons
          color={
            selected
              ? theme.colors.primary
              : theme.colors.textSecondary
          }
          name={icon}
          size={19}
        />
      </View>

      <Text
        numberOfLines={2}
        style={[
          choiceStyles.choiceLabel,

          selected &&
            choiceStyles.choiceLabelSelected,
        ]}>
        {label}
      </Text>

      <View
        style={[
          choiceStyles.radio,

          selected &&
            choiceStyles.radioSelected,
        ]}>
        {selected ? (
          <View
            style={
              choiceStyles.radioDot
            }
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function DangerItem({
  label,
  theme,
  styles: dangerStyles,
}: {
  label: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View
      style={
        dangerStyles.dangerItem
      }>
      <View
        style={
          dangerStyles.dangerBullet
        }>
        <MaterialDesignIcons
          color={theme.colors.danger}
          name="minus"
          size={13}
        />
      </View>

      <Text
        style={
          dangerStyles.dangerItemText
        }>
        {label}
      </Text>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        theme.colors.background,
    },

    backgroundDecor: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },

    glowTop: {
      position: 'absolute',
      top: -190,
      right: -130,
      width: 380,
      height: 380,
      borderRadius: 190,
      backgroundColor: withAlpha(theme.colors.primary, 0.06),
    },

    glowLeft: {
      position: 'absolute',
      top: '34%',
      left: -170,
      width: 320,
      height: 320,
      borderRadius: 160,
      backgroundColor: withAlpha(theme.colors.primary, 0.045),
    },

    glowBottom: {
      position: 'absolute',
      bottom: -180,
      right: -120,
      width: 350,
      height: 350,
      borderRadius: 175,
      backgroundColor: withAlpha(theme.colors.accent, 0.045),
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingBottom: 8,
    },

    backButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.10),
      borderRadius: 13,
      backgroundColor: withAlpha(theme.colors.surface, 0.94),
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.055,
      shadowRadius: 8,
      elevation: 2,
    },

    headerCopy: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      paddingHorizontal: 8,
    },

    headerTitle: {
      width: '100%',
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: -0.15,
    },

    headerTitleCompact: {
      fontSize: 16.5,
      lineHeight: 20,
    },

    headerSubtitle: {
      maxWidth: 320,
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 9.5,
      lineHeight: 13,
      textAlign: 'center',
    },

    headerSpacer: {
      width: 38,
      height: 38,
    },

    content: {
      gap: 10,
    },

    contentCompact: {
      gap: 8,
      paddingHorizontal: 13,
    },

    contentRegular: {
      paddingHorizontal: 16,
    },

    heroCard: {
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.10),
      borderRadius: 22,
      backgroundColor: withAlpha(theme.colors.surface, 0.96),
      paddingHorizontal: 16,
      paddingVertical: 17,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 5},
      shadowOpacity: 0.05,
      shadowRadius: 14,
      elevation: 2,
    },

    heroIcon: {
      width: 54,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.surface, 0.92),
      borderRadius: 18,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.07,
      shadowRadius: 9,
      elevation: 2,
    },

    heroTitle: {
      marginTop: 10,
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 17,
      lineHeight: 21,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: -0.15,
    },

    heroDescription: {
      maxWidth: 315,
      marginTop: 6,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center',
    },

    backupInfo: {
      width: '100%',
      marginTop: 13,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.09),
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceSecondary,
      paddingHorizontal: 12,
    },

    infoRow: {
      minHeight: 44,

      flexDirection: 'row',
      alignItems: 'center',
    },

    infoIcon: {
      width: 28,
      height: 28,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 13,

      backgroundColor:
        theme.colors.primarySoft,
    },

    infoCopy: {
      flex: 1,
      marginLeft: 11,
    },

    infoLabel: {
      color: theme.colors.textSecondary,
      fontSize: 10.5,
    },

    infoValue: {
      marginTop: 2,

      color: theme.colors.accent,

      fontSize: 12,
      fontWeight: '700',
    },

    divider: {
      height:
        StyleSheet.hairlineWidth,

      marginLeft: 49,

      backgroundColor:
        theme.colors.border,
    },

    primaryButton: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 17,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 18,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.18,
      shadowRadius: 11,
      elevation: 4,
    },

    primaryText: {
      color: onPrimaryTextColor(theme),
      fontSize: 13.5,
      lineHeight: 17,
      fontWeight: '800',
    },

    primaryButtonDisabled: {
      opacity: 0.6,
    },

    confirmCard: {
      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.warning, 0.35),

      borderRadius: 19,

      backgroundColor:
        withAlpha(theme.colors.warning, 0.08),

      padding: 12,
    },

    confirmHeader: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
    },

    warningIcon: {
      width: 36,
      height: 36,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 14,

      backgroundColor:
        withAlpha(theme.colors.warning, 0.18),
    },

    confirmCopy: {
      flex: 1,
      marginLeft: 11,
    },

    confirmTitle: {
      color: theme.colors.warning,

      fontFamily: 'serif',

      fontSize: 16,
      fontWeight: '700',
    },

    confirmDescription: {
      marginTop: 4,

      color: theme.colors.textSecondary,

      fontSize: 11.5,
      lineHeight: 17,
    },

    confirmPrimary: {
      marginTop: 15,
    },

    cancelButton: {
      minHeight: 38,

      alignItems: 'center',
      justifyContent:
        'center',

      marginTop: 5,
    },

    cancelText: {
      color: theme.colors.textSecondary,

      fontSize: 12.5,
      fontWeight: '700',
    },

    disabled: {
      opacity: 0.55,
    },

    message: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 8,

      borderWidth: 1,

      borderRadius: 17,

      paddingHorizontal: 10,
      paddingVertical: 11,
    },

    messageSuccess: {
      borderColor:
        withAlpha(theme.colors.success, 0.3),

      backgroundColor:
        withAlpha(theme.colors.success, 0.14),
    },

    messageError: {
      borderColor:
        withAlpha(theme.colors.danger, 0.3),

      backgroundColor:
        withAlpha(theme.colors.danger, 0.10),
    },

    messageText: {
      flex: 1,

      fontSize: 11.5,
      lineHeight: 16,
      fontWeight: '600',
    },

    exportHero: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.10),
      borderRadius: 20,
      backgroundColor: withAlpha(theme.colors.surface, 0.96),
      padding: 13,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.035,
      shadowRadius: 8,
      elevation: 1,
    },

    exportIcon: {
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
    },

    exportCopy: {
      flex: 1,

      marginLeft: 13,
    },

    exportTitle: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 15,
      lineHeight: 19,
      fontWeight: '800',
    },

    exportDescription: {
      marginTop: 3,
      color: theme.colors.textSecondary,
      fontSize: 10.5,
      lineHeight: 15,
    },

    exportObjectiveLabel: {
      marginTop: 6,

      color: theme.colors.primary,

      fontSize: 11,
      fontWeight: '700',
    },

    sectionTitle: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 14.5,
      lineHeight: 18,
      fontWeight: '800',
    },

    sectionSubtitle: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 10,
      lineHeight: 14,
    },

    choiceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    formatRow: {
      flexDirection: 'row',
      gap: 8,
    },

    choice: {
      minWidth: '47%',
      flex: 1,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.10),
      borderRadius: 15,
      backgroundColor: withAlpha(theme.colors.surface, 0.96),
      paddingHorizontal: 9,
      paddingVertical: 8,
    },

    choiceSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },

    choicePressed: {
      opacity: 0.82,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    choiceIcon: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    choiceIconSelected: {
      backgroundColor: theme.colors.primarySoft,
    },

    choiceLabel: {
      flex: 1,
      marginHorizontal: 8,
      color: theme.colors.textSecondary,
      fontSize: 10.5,
      lineHeight: 13.5,
      fontWeight: '600',
    },

    choiceLabelSelected: {
      color: theme.colors.accent,

      fontWeight: '700',
    },

    radio: {
      width: 16,
      height: 16,

      alignItems: 'center',
      justifyContent:
        'center',

      borderWidth: 1.5,

      borderColor:
        theme.colors.border,

      borderRadius: 9,
    },

    radioSelected: {
      borderColor:
        theme.colors.primary,
    },

    radioDot: {
      width: 8,
      height: 8,

      borderRadius: 5,

      backgroundColor:
        theme.colors.primary,
    },

    categoryCard: {
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.10),
      borderRadius: 19,
      backgroundColor: withAlpha(theme.colors.surface, 0.96),
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },

    category: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 11,
    },

    categoryBorder: {
      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        theme.colors.border,
    },

    categoryPressed: {
      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    categoryIcon: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    categoryIconActive: {
      backgroundColor:
        theme.colors.primarySoft,
    },

    categoryCopy: {
      flex: 1,

      marginLeft: 11,
    },

    categoryName: {
      color: theme.colors.accent,
      fontSize: 11.5,
      lineHeight: 15,
      fontWeight: '700',
    },

    sensitiveBadge: {
      alignSelf:
        'flex-start',

      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,

      marginTop: 3,

      borderRadius: 999,

      backgroundColor:
        withAlpha(theme.colors.danger, 0.10),

      paddingHorizontal: 7,
      paddingVertical: 3,
    },

    sensitiveText: {
      color: theme.colors.danger,

      fontSize: 8.5,
      fontWeight: '700',
    },

    selectionInfo: {
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.07),
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 11,
    },

    selectionText: {
      color: theme.colors.accent,

      fontSize: 11,
      fontWeight: '700',
    },

    infoMessage: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 8,

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.20),

      borderRadius: 17,

      backgroundColor:
        theme.colors.surfaceSecondary,

      padding: 12,
    },

    infoMessageText: {
      flex: 1,

      color: theme.colors.textSecondary,

      fontSize: 11,
      lineHeight: 16,
    },

    dangerHero: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.danger, 0.25),
      borderRadius: 22,
      backgroundColor: withAlpha(theme.colors.danger, 0.06),
      padding: 14,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.035,
      shadowRadius: 8,
      elevation: 1,
    },

    dangerTitle: {
      marginTop: 11,
      color: theme.colors.danger,
      fontFamily: 'serif',
      fontSize: 17,
      lineHeight: 21,
      fontWeight: '800',
    },

    dangerDescription: {
      maxWidth: 305,
      marginTop: 6,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center',
    },

    dangerItems: {
      width: '100%',
      marginTop: 11,
      gap: 7,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.danger, 0.07),
      borderRadius: 15,
      backgroundColor: withAlpha(theme.colors.surface, 0.82),
      padding: 11,
    },

    dangerItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    dangerBullet: {
      width: 22,
      height: 22,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 8,

      backgroundColor:
        withAlpha(theme.colors.danger, 0.12),
    },

    dangerItemText: {
      marginLeft: 8,

      color: theme.colors.textSecondary,

      fontSize: 11.5,
      fontWeight: '600',
    },

    accountNotice: {
      width: '100%',

      flexDirection: 'row',
      alignItems: 'center',

      gap: 8,

      marginTop: 12,

      borderRadius: 14,

      backgroundColor:
        theme.colors.surfaceSecondary,

      padding: 10,
    },

    accountNoticeText: {
      flex: 1,

      color: theme.colors.accent,

      fontSize: 10.5,
      lineHeight: 15,
    },

    deleteConfirmCard: {
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.10),
      borderRadius: 19,
      backgroundColor: withAlpha(theme.colors.surface, 0.96),
      padding: 13,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },

    deleteConfirmHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    stepBadge: {
      width: 30,
      height: 30,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 12,

      backgroundColor:
        theme.colors.primarySoft,
    },

    stepText: {
      color: theme.colors.primary,

      fontSize: 14,
      fontWeight: '800',
    },

    deleteConfirmCopy: {
      flex: 1,

      marginLeft: 10,
    },

    deleteConfirmTitle: {
      color: theme.colors.accent,

      fontSize: 13,
      fontWeight: '700',
    },

    deleteConfirmSubtitle: {
      marginTop: 2,

      color: theme.colors.textSecondary,

      fontSize: 10.5,
      lineHeight: 15,
    },

    input: {
      minHeight: 46,
      marginTop: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 15,
      backgroundColor: theme.colors.surfaceSecondary,
      paddingHorizontal: 13,
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    inputValid: {
      borderColor:
        theme.colors.success,

      backgroundColor:
        withAlpha(theme.colors.success, 0.05),
    },

    inputError: {
      borderColor:
        theme.colors.danger,

      backgroundColor:
        withAlpha(theme.colors.danger, 0.04),
    },

    validRow: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 6,

      marginTop: 8,
    },

    validText: {
      color: theme.colors.success,

      fontSize: 10.5,
      fontWeight: '700',
    },

    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 6,

      marginTop: 8,
    },

    errorText: {
      color: theme.colors.danger,

      fontSize: 10.5,
      fontWeight: '600',
    },

    deleteButton: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 17,
      backgroundColor: theme.colors.danger,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 5},
      shadowOpacity: 0.16,
      shadowRadius: 10,
      elevation: 3,
    },

    deleteDisabled: {
      backgroundColor:
        withAlpha(theme.colors.danger, 0.3),

      shadowOpacity: 0,

      elevation: 0,
    },

    deleteFootnote: {
      marginTop: -5,

      color: theme.colors.textMuted,

      fontSize: 10,

      textAlign: 'center',
    },

    successCard: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.success, 0.25),
      borderRadius: 22,
      backgroundColor: withAlpha(theme.colors.success, 0.05),
      padding: 18,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },

    successTitle: {
      marginTop: 9,

      color: theme.colors.success,

      fontFamily: 'serif',

      fontSize: 18,
      fontWeight: '700',
    },

    successDescription: {
      maxWidth: 290,

      marginTop: 7,

      color: theme.colors.textSecondary,

      fontSize: 12,
      lineHeight: 18,

      textAlign: 'center',
    },

    successSeparator: {
      width: '100%',
      height: 1,

      marginVertical: 18,

      backgroundColor:
        withAlpha(theme.colors.success, 0.2),
    },

    premiumExportCard: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.28),
      borderRadius: 24,
      backgroundColor: withAlpha(theme.colors.surface, 0.92),
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 18,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 7},
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 3,
    },

    premiumLockHalo: {
      width: 72,
      height: 72,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: withAlpha(theme.colors.primary, 0.45),
      borderRadius: 36,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    premiumLockHexagon: {
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: {width: 0, height: 5},
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 4,
    },

    premiumPill: {
      marginTop: 7,
      borderRadius: 999,
      backgroundColor: withAlpha(theme.colors.primary, 0.55),
      paddingHorizontal: 12,
      paddingVertical: 3,
    },

    premiumPillText: {
      color: onPrimaryTextColor(theme),
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.6,
    },

    premiumExportTitle: {
      marginTop: 8,
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 22,
      lineHeight: 27,
      fontWeight: '800',
      textAlign: 'center',
    },

    premiumExportDescription: {
      maxWidth: 315,
      marginTop: 6,
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },

    premiumDividerRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginVertical: 14,
    },

    premiumDivider: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: withAlpha(theme.colors.primary, 0.25),
    },

    premiumBenefits: {
      width: '100%',
      gap: 12,
    },

    premiumBenefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    premiumBenefitIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
    },

    premiumBenefitCopy: {
      flex: 1,
      marginLeft: 11,
    },

    premiumBenefitTitle: {
      color: theme.colors.accent,
      fontSize: 12.5,
      lineHeight: 16,
      fontWeight: '800',
    },

    premiumBenefitDescription: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 10.5,
      lineHeight: 15,
    },

    premiumUpgradeButton: {
      width: '100%',
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 18,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 17,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.22,
      shadowRadius: 11,
      elevation: 5,
    },

    premiumUpgradeText: {
      flex: 1,
      marginHorizontal: 10,
      color: onPrimaryTextColor(theme),
      fontSize: 15,
      lineHeight: 19,
      fontWeight: '800',
      textAlign: 'center',
    },

    privacyPriorityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.09),
      borderRadius: 18,
      backgroundColor: withAlpha(theme.colors.surface, 0.82),
      paddingHorizontal: 13,
      paddingVertical: 11,
    },

    privacyPriorityIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.colors.primarySoft,
    },

    privacyPriorityCopy: {
      flex: 1,
      marginLeft: 11,
    },

    privacyPriorityTitle: {
      color: theme.colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '800',
    },

    privacyPriorityDescription: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 10.5,
      lineHeight: 15,
    },

    pressed: {
      opacity: 0.83,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },
  });
}
