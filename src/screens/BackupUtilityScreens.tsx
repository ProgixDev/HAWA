import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

import type {DailyJournalEntry} from '../types/journal';

const PURPLE = '#6D4AE8';
const PURPLE_DARK = '#2F2258';

const TEXT_SECONDARY = '#746D92';

const BACKGROUND = '#F8F4FC';
const WHITE = '#FFFFFF';

const BORDER = 'rgba(109,74,232,0.12)';
const SOFT_PURPLE = '#F2ECFF';
const VERY_SOFT_PURPLE = '#FAF7FF';

const SUCCESS = '#3E9B63';
const SUCCESS_BG = '#EAF6ED';

const DANGER = '#D94458';
const DANGER_BG = '#FFF2F4';

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

const CATEGORIES = [
  {
    value: 'cycle',
    label: 'Cycle',
    icon: 'calendar-heart',
  },
  {
    value: 'flow',
    label: 'Flux menstruel',
    icon: 'water-outline',
  },
  {
    value: 'symptoms',
    label: 'Symptômes',
    icon: 'heart-pulse',
  },
  {
    value: 'mood',
    label: 'Humeur',
    icon: 'emoticon-happy-outline',
  },
  {
    value: 'sleep',
    label: 'Sommeil',
    icon: 'weather-night',
  },
  {
    value: 'activity',
    label: 'Activité',
    icon: 'walk',
  },
  {
    value: 'hydration',
    label: 'Hydratation',
    icon: 'cup-water',
  },
  {
    value: 'temperature',
    label: 'Température',
    icon: 'thermometer',
  },
  {
    value: 'notes',
    label: 'Notes privées',
    icon: 'notebook-edit-outline',
    sensitive: true,
  },
  {
    value: 'weight',
    label: 'Poids',
    icon: 'scale-bathroom',
  },
  {
    value: 'intimacy',
    label: 'Vie intime',
    icon: 'heart-outline',
    sensitive: true,
  },
] as const;

/* ============================================================
   SHELL
============================================================ */

function Shell({
  title,
  subtitle,
  navigation,
  children,
}: {
  title: string;
  subtitle: string;
  navigation: {
    goBack: () => void;
  };
  children: React.ReactNode;
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
        barStyle="dark-content"
      />

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
            color={PURPLE}
            name="chevron-left"
            size={27}
          />
        </Pressable>

        <View
          style={
            styles.headerCopy
          }>
          <Text
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
  color = PURPLE,
  backgroundColor = SOFT_PURPLE,
}: {
  icon: IconName;
  color?: string;
  backgroundColor?: string;
}) {
  return (
    <View
      style={[
        styles.heroIcon,
        {
          backgroundColor,
        },
      ]}>
      <MaterialDesignIcons
        color={color}
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
      title="Restaurer"
      subtitle="Récupère tes données à partir d’une sauvegarde existante.">
      <View
        style={
          styles.heroCard
        }>
        <HeroIcon
          icon={
            snapshot
              ? 'backup-restore'
              : 'cloud-off-outline'
          }
        />

        <Text
          style={
            styles.heroTitle
          }>
          {snapshot
            ? 'Sauvegarde disponible'
            : 'Aucune sauvegarde'}
        </Text>

        <Text
          style={
            styles.heroDescription
          }>
          {snapshot
            ? 'Une copie de tes données est prête à être restaurée.'
            : 'Crée d’abord une copie depuis la section Sauvegarde.'}
        </Text>

        {snapshot ? (
          <View
            style={
              styles.backupInfo
            }>
            <InfoRow
              icon="calendar-outline"
              label="Date"
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
                styles.divider
              }
            />

            <InfoRow
              icon="database-outline"
              label="Taille"
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
        />
      ) : null}

      {confirm ? (
        <View
          style={
            styles.confirmCard
          }>
          <View
            style={
              styles.confirmHeader
            }>
            <View
              style={
                styles.warningIcon
              }>
              <MaterialDesignIcons
                color="#B6782F"
                name="alert-outline"
                size={22}
              />
            </View>

            <View
              style={
                styles.confirmCopy
              }>
              <Text
                style={
                  styles.confirmTitle
                }>
                Confirmer la restauration
              </Text>

              <Text
                style={
                  styles.confirmDescription
                }>
                Les données actuelles seront remplacées par celles de cette sauvegarde.
              </Text>
            </View>
          </View>

          <Pressable
            disabled={busy}
            onPress={restore}
            style={({pressed}) => [
              styles.primaryButton,
              styles.confirmPrimary,

              busy &&
                styles.disabled,

              pressed &&
                !busy &&
                styles.pressed,
            ]}>
            {busy ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>
                <MaterialDesignIcons
                  color="#FFFFFF"
                  name="check"
                  size={19}
                />

                <Text
                  style={
                    styles.primaryText
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
              styles.cancelButton,
              pressed &&
                styles.pressed,
            ]}>
            <Text
              style={
                styles.cancelText
              }>
              Annuler
            </Text>
          </Pressable>
        </View>
      ) : null}

      {message ? (
        <View
          style={[
            styles.message,

            message.includes(
              'succès',
            )
              ? styles.messageSuccess
              : styles.messageError,
          ]}>
          <MaterialDesignIcons
            color={
              message.includes(
                'succès',
              )
                ? SUCCESS
                : DANGER
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
              styles.messageText,

              {
                color:
                  message.includes(
                    'succès',
                  )
                    ? SUCCESS
                    : DANGER,
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

  const [
    selected,
    setSelected,
  ] = useState<string[]>([
    'cycle',
    'flow',
    'symptoms',
    'mood',
    'sleep',
    'activity',
    'hydration',
    'temperature',
    'weight',
  ]);

  const [
    message,
    setMessage,
  ] = useState('');

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

  const exportData =
    async () => {
      setMessage('');

      if (
        format === 'pdf'
      ) {
        setMessage(
          'Le générateur PDF n’est pas encore configuré. Utilise CSV pour un export réel.',
        );

        return;
      }

      const raw =
        await AsyncStorage.getItem(
          '@hawa/daily-journal/v1',
        );

      const entries: DailyJournalEntry[] =
        raw
          ? JSON.parse(raw)
          : [];

      const months =
        period === 'all'
          ? Infinity
          : Number(
              period.replace(
                'm',
                '',
              ),
            );

      const cutoff =
        new Date();

      if (
        Number.isFinite(
          months,
        )
      ) {
        cutoff.setMonth(
          cutoff.getMonth() -
            months,
        );
      }

      const filtered =
        entries.filter(
          entry =>
            period ===
              'all' ||
            new Date(
              `${entry.date}T12:00:00`,
            ) >= cutoff,
        );

      const rows = [
        'date,categorie,valeur',
      ];

      filtered.forEach(
        entry =>
          selected.forEach(
            category => {
              const key =
                category ===
                'notes'
                  ? 'note'
                  : category;

              if (
                key ===
                'cycle'
              ) {
                rows.push(
                  `${entry.date},cycleDay,${entry.cycleDay ?? ''}`,
                );

                return;
              }

              const value =
                entry[
                  key as keyof DailyJournalEntry
                ];

              if (value) {
                rows.push(
                  `${entry.date},${category},"${JSON.stringify(
                    value,
                  ).replace(
                    /"/g,
                    '""',
                  )}"`,
                );
              }
            },
          ),
      );

      await Share.share({
        title:
          'Export CSV HAWA',
        message:
          rows.join('\n'),
      });
    };

  return (
    <Shell
      navigation={navigation}
      title="Exporter mes données"
      subtitle="Choisis les informations que tu souhaites récupérer.">
      <View
        style={
          styles.exportHero
        }>
        <View
          style={
            styles.exportIcon
          }>
          <MaterialDesignIcons
            color={PURPLE}
            name="tray-arrow-down"
            size={27}
          />
        </View>

        <View
          style={
            styles.exportCopy
          }>
          <Text
            style={
              styles.exportTitle
            }>
            Ton export personnalisé
          </Text>

          <Text
            style={
              styles.exportDescription
            }>
            Sélectionne la période, le format et les informations à inclure.
          </Text>
        </View>
      </View>

      <SectionTitle
        title="Période"
        subtitle="Choisis la durée de l’historique à exporter."
      />

      <View
        style={
          styles.choiceGrid
        }>
        <Choice
          icon="history"
          label="Tout l’historique"
          selected={
            period === 'all'
          }
          onPress={() =>
            setPeriod('all')
          }
        />

        <Choice
          icon="calendar-range"
          label="3 mois"
          selected={
            period === '3m'
          }
          onPress={() =>
            setPeriod('3m')
          }
        />

        <Choice
          icon="calendar-range"
          label="6 mois"
          selected={
            period === '6m'
          }
          onPress={() =>
            setPeriod('6m')
          }
        />

        <Choice
          icon="calendar-range"
          label="12 mois"
          selected={
            period === '12m'
          }
          onPress={() =>
            setPeriod('12m')
          }
        />
      </View>

      <SectionTitle
        title="Format"
        subtitle="CSV est disponible immédiatement."
      />

      <View
        style={
          styles.formatRow
        }>
        <Choice
          icon="file-delimited-outline"
          label="CSV"
          selected={
            format === 'csv'
          }
          onPress={() =>
            setFormat('csv')
          }
        />

        <Choice
          icon="file-pdf-box"
          label="PDF"
          selected={
            format === 'pdf'
          }
          onPress={() =>
            setFormat('pdf')
          }
        />
      </View>

      <SectionTitle
        title="Catégories"
        subtitle="Les données sensibles ne sont jamais sélectionnées automatiquement."
      />

      <View
        style={
          styles.categoryCard
        }>
        {CATEGORIES.map(
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
                  styles.category,

                  index !==
                    CATEGORIES.length -
                      1 &&
                    styles.categoryBorder,

                  pressed &&
                    styles.categoryPressed,
                ]}>
                <View
                  style={[
                    styles.categoryIcon,

                    active &&
                      styles.categoryIconActive,
                  ]}>
                  <MaterialDesignIcons
                    color={
                      active
                        ? PURPLE
                        : '#A99EB7'
                    }
                    name={
                      category.icon as IconName
                    }
                    size={20}
                  />
                </View>

                <View
                  style={
                    styles.categoryCopy
                  }>
                  <Text
                    style={
                      styles.categoryName
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
                        styles.sensitiveBadge
                      }>
                      <MaterialDesignIcons
                        color="#B45A74"
                        name="lock-outline"
                        size={10}
                      />

                      <Text
                        style={
                          styles.sensitiveText
                        }>
                        Donnée sensible
                      </Text>
                    </View>
                  ) : null}
                </View>

                <MaterialDesignIcons
                  color={
                    active
                      ? PURPLE
                      : '#B9AFC6'
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
          styles.selectionInfo
        }>
        <MaterialDesignIcons
          color={PURPLE}
          name="check-all"
          size={18}
        />

        <Text
          style={
            styles.selectionText
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
        icon="export-variant"
        label="Exporter mes données"
        onPress={exportData}
      />

      {message ? (
        <View
          style={
            styles.infoMessage
          }>
          <MaterialDesignIcons
            color={PURPLE}
            name="information-outline"
            size={20}
          />

          <Text
            style={
              styles.infoMessageText
            }>
            {message}
          </Text>
        </View>
      ) : null}
    </Shell>
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
      title="Supprimer mes données"
      subtitle="Gère définitivement tes données de suivi locales.">
      {!done ? (
        <>
          <View
            style={
              styles.dangerHero
            }>
            <HeroIcon
              backgroundColor="#FFE7EB"
              color={DANGER}
              icon="delete-alert-outline"
            />

            <Text
              style={
                styles.dangerTitle
              }>
              Action irréversible
            </Text>

            <Text
              style={
                styles.dangerDescription
              }>
              Cette action supprimera définitivement tes données de suivi locales.
            </Text>

            <View
              style={
                styles.dangerItems
              }>
              <DangerItem
                label="Journal quotidien"
              />

              <DangerItem
                label="Historique du cycle"
              />

              <DangerItem
                label="Données de suivi locales"
              />
            </View>

            <View
              style={
                styles.accountNotice
              }>
              <MaterialDesignIcons
                color={PURPLE}
                name="account-check-outline"
                size={18}
              />

              <Text
                style={
                  styles.accountNoticeText
                }>
                Ton compte AWA ne sera pas supprimé.
              </Text>
            </View>
          </View>

          <View
            style={
              styles.deleteConfirmCard
            }>
            <View
              style={
                styles.deleteConfirmHeader
              }>
              <View
                style={
                  styles.stepBadge
                }>
                <Text
                  style={
                    styles.stepText
                  }>
                  1
                </Text>
              </View>

              <View
                style={
                  styles.deleteConfirmCopy
                }>
                <Text
                  style={
                    styles.deleteConfirmTitle
                  }>
                  Confirme ton choix
                </Text>

                <Text
                  style={
                    styles.deleteConfirmSubtitle
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
              placeholderTextColor="#B0A5BC"
              style={[
                styles.input,

                isValid &&
                  styles.inputValid,

                error &&
                  styles.inputError,
              ]}
              value={value}
            />

            {isValid ? (
              <View
                style={
                  styles.validRow
                }>
                <MaterialDesignIcons
                  color={SUCCESS}
                  name="check-circle"
                  size={16}
                />

                <Text
                  style={
                    styles.validText
                  }>
                  Confirmation correcte
                </Text>
              </View>
            ) : null}

            {error ? (
              <View
                style={
                  styles.errorRow
                }>
                <MaterialDesignIcons
                  color={DANGER}
                  name="alert-circle-outline"
                  size={16}
                />

                <Text
                  style={
                    styles.errorText
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
              styles.deleteButton,

              !isValid &&
                styles.deleteDisabled,

              pressed &&
                isValid &&
                styles.pressed,
            ]}>
            <MaterialDesignIcons
              color="#FFFFFF"
              name="delete-forever-outline"
              size={20}
            />

            <Text
              style={
                styles.primaryText
              }>
              Supprimer définitivement
            </Text>
          </Pressable>

          <Text
            style={
              styles.deleteFootnote
            }>
            Cette action ne peut pas être annulée.
          </Text>
        </>
      ) : (
        <View
          style={
            styles.successCard
          }>
          <HeroIcon
            backgroundColor={
              SUCCESS_BG
            }
            color={SUCCESS}
            icon="check-circle-outline"
          />

          <Text
            style={
              styles.successTitle
            }>
            Données supprimées
          </Text>

          <Text
            style={
              styles.successDescription
            }>
            Tes données de suivi locales ont été supprimées avec succès.
          </Text>

          <View
            style={
              styles.successSeparator
            }
          />

          <PrimaryButton
            label="Terminer"
            onPress={
              navigation.goBack
            }
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
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View>
      <Text
        style={
          styles.sectionTitle
        }>
        {title}
      </Text>

      <Text
        style={
          styles.sectionSubtitle
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
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.infoRow
      }>
      <View
        style={
          styles.infoIcon
        }>
        <MaterialDesignIcons
          color={PURPLE}
          name={icon}
          size={18}
        />
      </View>

      <View
        style={
          styles.infoCopy
        }>
        <Text
          style={
            styles.infoLabel
          }>
          {label}
        </Text>

        <Text
          style={
            styles.infoValue
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
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.primaryButton,
        pressed &&
          styles.pressed,
      ]}>
      {icon ? (
        <MaterialDesignIcons
          color="#FFFFFF"
          name={icon}
          size={20}
        />
      ) : null}

      <Text
        style={
          styles.primaryText
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
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{
        checked: selected,
      }}
      onPress={onPress}
      style={({pressed}) => [
        styles.choice,

        selected &&
          styles.choiceSelected,

        pressed &&
          styles.choicePressed,
      ]}>
      <View
        style={[
          styles.choiceIcon,

          selected &&
            styles.choiceIconSelected,
        ]}>
        <MaterialDesignIcons
          color={
            selected
              ? PURPLE
              : TEXT_SECONDARY
          }
          name={icon}
          size={19}
        />
      </View>

      <Text
        numberOfLines={2}
        style={[
          styles.choiceLabel,

          selected &&
            styles.choiceLabelSelected,
        ]}>
        {label}
      </Text>

      <View
        style={[
          styles.radio,

          selected &&
            styles.radioSelected,
        ]}>
        {selected ? (
          <View
            style={
              styles.radioDot
            }
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function DangerItem({
  label,
}: {
  label: string;
}) {
  return (
    <View
      style={
        styles.dangerItem
      }>
      <View
        style={
          styles.dangerBullet
        }>
        <MaterialDesignIcons
          color={DANGER}
          name="minus"
          size={13}
        />
      </View>

      <Text
        style={
          styles.dangerItemText
        }>
        {label}
      </Text>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        BACKGROUND,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 10,
    },

    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 22,
      backgroundColor:
        'rgba(255,255,255,0.94)',

      shadowColor:
        PURPLE_DARK,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },

    headerCopy: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 8,
    },

    headerTitle: {
      color: PURPLE_DARK,
      fontFamily: 'serif',
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },

    headerTitleCompact: {
      fontSize: 18,
    },

    headerSubtitle: {
      marginTop: 3,
      color: TEXT_SECONDARY,
      fontSize: 10,
      lineHeight: 13,
      textAlign: 'center',
    },

    headerSpacer: {
      width: 40,
      height: 40,
    },

    content: {
      gap: 9,
    },

    contentCompact: {
      gap: 7,
      paddingHorizontal: 16,
    },

    contentRegular: {
      paddingHorizontal: 20,
    },

    heroCard: {
      alignItems: 'center',

      borderWidth: 1,
      borderColor: BORDER,

      borderRadius: 22,

      backgroundColor:
        WHITE,

      paddingHorizontal: 15,
      paddingVertical: 16,

      shadowColor:
        PURPLE_DARK,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 2,
    },

    heroIcon: {
      width: 52,
      height: 52,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 22,
    },

    heroTitle: {
      marginTop: 9,

      color: PURPLE_DARK,

      fontFamily: 'serif',

      fontSize: 18,
      fontWeight: '700',

      textAlign: 'center',
    },

    heroDescription: {
      maxWidth: 300,

      marginTop: 7,

      color: TEXT_SECONDARY,

      fontSize: 11.5,
      lineHeight: 16,

      textAlign: 'center',
    },

    backupInfo: {
      width: '100%',

      marginTop: 12,

      borderWidth: 1,
      borderColor: BORDER,

      borderRadius: 16,

      backgroundColor:
        VERY_SOFT_PURPLE,

      paddingHorizontal: 14,
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
        SOFT_PURPLE,
    },

    infoCopy: {
      flex: 1,
      marginLeft: 11,
    },

    infoLabel: {
      color: TEXT_SECONDARY,
      fontSize: 10.5,
    },

    infoValue: {
      marginTop: 2,

      color: PURPLE_DARK,

      fontSize: 12,
      fontWeight: '700',
    },

    divider: {
      height:
        StyleSheet.hairlineWidth,

      marginLeft: 49,

      backgroundColor:
        BORDER,
    },

    primaryButton: {
      minHeight: 46,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'center',

      gap: 8,

      borderRadius: 16,

      backgroundColor:
        PURPLE,

      paddingHorizontal: 18,

      shadowColor: PURPLE,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 4,
    },

    primaryText: {
      color: '#FFFFFF',

      fontSize: 13.5,
      fontWeight: '700',
    },

    confirmCard: {
      borderWidth: 1,

      borderColor:
        '#F0DFC6',

      borderRadius: 19,

      backgroundColor:
        '#FFF9F0',

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
        '#FFF0D7',
    },

    confirmCopy: {
      flex: 1,
      marginLeft: 11,
    },

    confirmTitle: {
      color: '#A66626',

      fontFamily: 'serif',

      fontSize: 16,
      fontWeight: '700',
    },

    confirmDescription: {
      marginTop: 4,

      color: '#7C674E',

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
      color: TEXT_SECONDARY,

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
        '#CEE5D5',

      backgroundColor:
        SUCCESS_BG,
    },

    messageError: {
      borderColor:
        '#F2C8CE',

      backgroundColor:
        DANGER_BG,
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
      borderColor: BORDER,

      borderRadius: 19,

      backgroundColor:
        WHITE,

      padding: 12,
    },

    exportIcon: {
      width: 54,
      height: 54,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 15,

      backgroundColor:
        SOFT_PURPLE,
    },

    exportCopy: {
      flex: 1,

      marginLeft: 13,
    },

    exportTitle: {
      color: PURPLE_DARK,

      fontFamily: 'serif',

      fontSize: 15.5,
      fontWeight: '700',
    },

    exportDescription: {
      marginTop: 3,

      color: TEXT_SECONDARY,

      fontSize: 11.5,
      lineHeight: 16,
    },

    sectionTitle: {
      color: PURPLE_DARK,

      fontFamily: 'serif',

      fontSize: 15.5,
      fontWeight: '700',
    },

    sectionSubtitle: {
      marginTop: 3,

      color: TEXT_SECONDARY,

      fontSize: 10.5,
      lineHeight: 15,
    },

    choiceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    formatRow: {
      flexDirection: 'row',
      gap: 10,
    },

    choice: {
      minWidth: '47%',

      flex: 1,

      minHeight: 48,

      flexDirection: 'row',
      alignItems: 'center',

      borderWidth: 1,
      borderColor: BORDER,

      borderRadius: 15,

      backgroundColor:
        WHITE,

      paddingHorizontal: 8,
      paddingVertical: 7,
    },

    choiceSelected: {
      borderColor:
        PURPLE,

      backgroundColor:
        '#F7F3FF',
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
      width: 28,
      height: 28,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 11,

      backgroundColor:
        '#F4EFF9',
    },

    choiceIconSelected: {
      backgroundColor:
        '#E9DEFF',
    },

    choiceLabel: {
      flex: 1,

      marginHorizontal: 8,

      color: TEXT_SECONDARY,

      fontSize: 10,
      lineHeight: 13,

      fontWeight: '600',
    },

    choiceLabelSelected: {
      color: PURPLE_DARK,

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
        '#C7BBD6',

      borderRadius: 9,
    },

    radioSelected: {
      borderColor:
        PURPLE,
    },

    radioDot: {
      width: 8,
      height: 8,

      borderRadius: 5,

      backgroundColor:
        PURPLE,
    },

    categoryCard: {
      overflow: 'hidden',

      borderWidth: 1,

      borderColor: BORDER,

      borderRadius: 19,

      backgroundColor:
        WHITE,
    },

    category: {
      minHeight: 48,

      flexDirection: 'row',
      alignItems: 'center',

      paddingHorizontal: 10,
    },

    categoryBorder: {
      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        BORDER,
    },

    categoryPressed: {
      backgroundColor:
        VERY_SOFT_PURPLE,
    },

    categoryIcon: {
      width: 28,
      height: 28,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 13,

      backgroundColor:
        '#F5F1F8',
    },

    categoryIconActive: {
      backgroundColor:
        SOFT_PURPLE,
    },

    categoryCopy: {
      flex: 1,

      marginLeft: 11,
    },

    categoryName: {
      color: PURPLE_DARK,

      fontSize: 12,
      fontWeight: '600',
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
        '#FCECF1',

      paddingHorizontal: 7,
      paddingVertical: 3,
    },

    sensitiveText: {
      color: '#B45A74',

      fontSize: 8.5,
      fontWeight: '700',
    },

    selectionInfo: {
      minHeight: 38,

      flexDirection: 'row',
      alignItems: 'center',

      gap: 8,

      borderRadius: 15,

      backgroundColor:
        SOFT_PURPLE,

      paddingHorizontal: 12,
    },

    selectionText: {
      color: PURPLE_DARK,

      fontSize: 11,
      fontWeight: '700',
    },

    infoMessage: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 8,

      borderWidth: 1,

      borderColor:
        '#DFD2F1',

      borderRadius: 17,

      backgroundColor:
        VERY_SOFT_PURPLE,

      padding: 12,
    },

    infoMessageText: {
      flex: 1,

      color: TEXT_SECONDARY,

      fontSize: 11,
      lineHeight: 16,
    },

    dangerHero: {
      alignItems: 'center',

      borderWidth: 1,

      borderColor:
        '#F2CDD2',

      borderRadius: 22,

      backgroundColor:
        DANGER_BG,

      padding: 12,
    },

    dangerTitle: {
      marginTop: 13,

      color: DANGER,

      fontFamily: 'serif',

      fontSize: 18,
      fontWeight: '700',
    },

    dangerDescription: {
      maxWidth: 300,

      marginTop: 7,

      color: '#826168',

      fontSize: 12,
      lineHeight: 18,

      textAlign: 'center',
    },

    dangerItems: {
      width: '100%',

      marginTop: 10,

      gap: 8,

      borderRadius: 15,

      backgroundColor:
        'rgba(255,255,255,0.78)',

      padding: 12,
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
        '#FDE5E9',
    },

    dangerItemText: {
      marginLeft: 8,

      color: '#74575E',

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
        VERY_SOFT_PURPLE,

      padding: 10,
    },

    accountNoticeText: {
      flex: 1,

      color: PURPLE_DARK,

      fontSize: 10.5,
      lineHeight: 15,
    },

    deleteConfirmCard: {
      borderWidth: 1,

      borderColor: BORDER,

      borderRadius: 19,

      backgroundColor:
        WHITE,

      padding: 12,
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
        SOFT_PURPLE,
    },

    stepText: {
      color: PURPLE,

      fontSize: 14,
      fontWeight: '800',
    },

    deleteConfirmCopy: {
      flex: 1,

      marginLeft: 10,
    },

    deleteConfirmTitle: {
      color: PURPLE_DARK,

      fontSize: 13,
      fontWeight: '700',
    },

    deleteConfirmSubtitle: {
      marginTop: 2,

      color: TEXT_SECONDARY,

      fontSize: 10.5,
      lineHeight: 15,
    },

    input: {
      minHeight: 44,

      marginTop: 9,

      borderWidth: 1,

      borderColor:
        '#D9CEEA',

      borderRadius: 17,

      backgroundColor:
        VERY_SOFT_PURPLE,

      paddingHorizontal: 14,

      color: PURPLE_DARK,

      fontSize: 14,
      fontWeight: '700',

      letterSpacing: 0.5,
    },

    inputValid: {
      borderColor:
        SUCCESS,

      backgroundColor:
        '#F7FCF8',
    },

    inputError: {
      borderColor:
        DANGER,

      backgroundColor:
        '#FFF8F9',
    },

    validRow: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 6,

      marginTop: 8,
    },

    validText: {
      color: SUCCESS,

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
      color: DANGER,

      fontSize: 10.5,
      fontWeight: '600',
    },

    deleteButton: {
      minHeight: 46,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent:
        'center',

      gap: 8,

      borderRadius: 16,

      backgroundColor:
        DANGER,

      shadowColor:
        DANGER,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.18,
      shadowRadius: 10,

      elevation: 3,
    },

    deleteDisabled: {
      backgroundColor:
        '#D7C9CE',

      shadowOpacity: 0,

      elevation: 0,
    },

    deleteFootnote: {
      marginTop: -5,

      color: '#9A8290',

      fontSize: 10,

      textAlign: 'center',
    },

    successCard: {
      alignItems: 'center',

      borderWidth: 1,

      borderColor:
        '#D2E9D9',

      borderRadius: 22,

      backgroundColor:
        '#F7FCF8',

      padding: 18,
    },

    successTitle: {
      marginTop: 9,

      color: SUCCESS,

      fontFamily: 'serif',

      fontSize: 18,
      fontWeight: '700',
    },

    successDescription: {
      maxWidth: 290,

      marginTop: 7,

      color: '#5F7969',

      fontSize: 12,
      lineHeight: 18,

      textAlign: 'center',
    },

    successSeparator: {
      width: '100%',
      height: 1,

      marginVertical: 18,

      backgroundColor:
        '#DDEDE2',
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
