import {continueAfterObjectiveSetup} from '../state/objectiveSetupFlow';
import React, {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import notifee from '@notifee/react-native';
import {ensureNotificationPermission} from '../services/pregnancyNotifications';
import {
  getCycleReminderPreferences,
  setCycleReminderPreferences,
  type UpcomingPeriodDaysBefore,
} from '../state/cycleReminderPreferences';
import {getHasConfirmedCycleData} from '../state/onboardingPreferences';
import {getActiveProfileIdentity} from '../state/activeProfileStore';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {dateAtTimeOfDay, formatTimeOfDay} from '../utils/timeOfDay';
import '../i18n';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaSwitch} from '../components/ui/AwaSwitch';
import {AwaText} from '../components/ui/AwaText';

// Same 'HH:mm' formatting/parsing convention as
// MenopauseRemindersScreen.tsx's/ContraceptionRemindersScreen.tsx's own
// un-exported helpers — kept local since it's pure UI display formatting.
// Stored as 'HH:mm' (24-hour, zero-padded, locale-independent — see utils/timeOfDay.ts). It used to come from
// Intl.DateTimeFormat, which writes 00:30 as "24:30" under en-US; a stored "24:30" still reads as 00:30.
function formatTimeValue(date: Date): string {
  return formatTimeOfDay(date);
}
function parseTimeToDate(hhmm: string): Date {
  return dateAtTimeOfDay(new Date(), hhmm);
}

const DAYS_BEFORE_OPTIONS: UpcomingPeriodDaysBefore[] = [1, 2, 3];

type Props = NativeStackScreenProps<RootStackParamList, 'CycleReminders'>;

function CycleRemindersScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const mode = route.params?.mode ?? 'onboarding';
  const isEdit = mode === 'edit';

  // Reads the SAME canonical cycleReminderPreferences.ts store regardless of
  // mode — this is what makes onboarding and Profile → Notifications &
  // rappels literally the same setting rather than two disconnected copies.
  // If she already configured reminders from Profile before ever seeing
  // this onboarding step (e.g. re-running onboarding), those real values
  // are what's shown here — never onboarding-specific defaults.
  const initial = getCycleReminderPreferences();

  // A managed daughter who has never had (or never recorded) her first
  // period has no valid cycle data to derive a next-period/period-start/
  // fertile-window/ovulation reminder from — these 4 must never be
  // schedulable from a fabricated default (CLAUDE.md §5 real data only;
  // see cycleReminderScheduling.ts's own dateBasedActive guard, which this
  // UI must agree with). "Journal quotidien" is unaffected — it never
  // depends on cycle predictions. The owner is never gated (always true).
  const activeIdentity = useMemo(() => getActiveProfileIdentity(), []);
  const cycleDataUnavailable = activeIdentity.isManagedProfile && !getHasConfirmedCycleData();

  const [upcomingPeriodEnabled, setUpcomingPeriodEnabled] = useState(initial.upcomingPeriodEnabled);
  const [upcomingPeriodDaysBefore, setUpcomingPeriodDaysBefore] = useState(initial.upcomingPeriodDaysBefore);
  const [periodStartCheckEnabled, setPeriodStartCheckEnabled] = useState(initial.periodStartCheckEnabled);
  const [dailyJournalEnabled, setDailyJournalEnabled] = useState(initial.dailyJournalEnabled);
  // A time an earlier build stored as "24:30" (00:30, written under en-US) is shown — and saved back — as 00:30.
  const [dailyJournalTime, setDailyJournalTime] = useState<string | null>(() =>
    initial.dailyJournalTime ? formatTimeValue(parseTimeToDate(initial.dailyJournalTime)) : null,
  );
  const [fertileWindowEnabled, setFertileWindowEnabled] = useState(initial.fertileWindowEnabled);
  const [ovulationEnabled, setOvulationEnabled] = useState(initial.ovulationEnabled);

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [permissionNotice, setPermissionNotice] = useState(false);

  const fertilityEnabled = fertileWindowEnabled || ovulationEnabled;

  const toggleFertility = (value: boolean) => {
    // A single master switch driving both sub-options together, matching the
    // mock's "[Switch] then two checkboxes" layout — the checkboxes remain
    // the real source of truth read by cycleReminderScheduling.ts; this only
    // sets sensible defaults for both when the category is turned on/off.
    setFertileWindowEnabled(value);
    setOvulationEnabled(value);
    setError('');
  };

  const goToNext = () => {
    if (isEdit) {
      navigation.goBack();
    } else {
      continueAfterObjectiveSetup(navigation);
    }
  };

  const handleSave = async () => {
    if (saving) {return;}
    if (dailyJournalEnabled && !dailyJournalTime) {
      setError(t('cycleReminders.dailyJournalTimeError'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      await setCycleReminderPreferences({
        upcomingPeriodEnabled: cycleDataUnavailable ? false : upcomingPeriodEnabled,
        upcomingPeriodDaysBefore,
        periodStartCheckEnabled: cycleDataUnavailable ? false : periodStartCheckEnabled,
        dailyJournalEnabled,
        dailyJournalTime,
        fertileWindowEnabled: cycleDataUnavailable ? false : fertileWindowEnabled,
        ovulationEnabled: cycleDataUnavailable ? false : ovulationEnabled,
      });

      // Only ever requested here — when a reminder is actually being
      // confirmed enabled — never merely for opening this screen.
      if (upcomingPeriodEnabled || periodStartCheckEnabled || dailyJournalEnabled || fertilityEnabled) {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          setPermissionNotice(true);
          return;
        }
      }

      goToNext();
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (saving) {return;}
    // Optional and reversible: onboarding simply continues without touching
    // any previously-persisted reminder preference (same convention as
    // MenopauseRemindersScreen.tsx's own "Pas maintenant").
    goToNext();
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.md},
          ]}
          showsVerticalScrollIndicator={false}>
          {isEdit ? (
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              hitSlop={12}
              icon="arrow-left"
              onPress={navigation.goBack}
              style={styles.backButton}
            />
          ) : null}

          <View style={styles.header}>
            

            <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{t('cycleReminders.title')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
              {isEdit
                ? t('cycleReminders.subtitleEdit')
                : t('cycleReminders.subtitleOnboarding')}
            </AwaText>
          </View>

          {/* RÈGLES À VENIR */}
          <AwaCard style={styles.card} variant="filled">
            <View style={styles.cardTopRow}>
              <MaterialDesignIcons color={theme.colors.primary} name="water-outline" size={24} />
              <View style={styles.cardCopy}>
                <AwaText style={styles.cardTitle} variant="titleMedium">{t('cycleReminders.upcomingPeriodTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.cardDescription} variant="bodySmall">
                  {t('cycleReminders.upcomingPeriodDescription')}
                </AwaText>
              </View>
              <AwaSwitch
                accessibilityLabel={t('cycleReminders.upcomingPeriodTitle')}
                disabled={cycleDataUnavailable}
                onValueChange={value => {
                  setUpcomingPeriodEnabled(value);
                  setError('');
                }}
                value={upcomingPeriodEnabled}
              />
            </View>

            {cycleDataUnavailable ? (
              <AwaText colorRole="onSurfaceVariant" style={styles.unavailableNote} variant="bodySmall">{t('cycleReminders.unavailableNote')}</AwaText>
            ) : null}

            {upcomingPeriodEnabled ? (
              <View style={styles.daysBeforeRow}>
                {DAYS_BEFORE_OPTIONS.map(days => {
                  const selected = upcomingPeriodDaysBefore === days;
                  return (
                    <Pressable
                      accessibilityLabel={t('cycleReminders.daysBefore', {count: days})}
                      accessibilityRole="radio"
                      accessibilityState={{checked: selected}}
                      key={days}
                      onPress={() => setUpcomingPeriodDaysBefore(days)}
                      style={({pressed}) => [
                        styles.daysBeforeChip,
                        selected && styles.daysBeforeChipSelected,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={[styles.daysBeforeChipText, selected && styles.daysBeforeChipTextSelected]}>
                        {t('cycleReminders.daysBefore', {count: days})}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </AwaCard>
          {/* SAISIE DU DÉBUT DES RÈGLES */}
          <AwaCard style={styles.card} variant="filled">
            <View style={styles.cardTopRow}>
              <MaterialDesignIcons color={theme.colors.primary} name="calendar-check-outline" size={24} />
              <View style={styles.cardCopy}>
                <AwaText style={styles.cardTitle} variant="titleMedium">{t('cycleReminders.periodStartCheckTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.cardDescription} variant="bodySmall">
                  {t('cycleReminders.periodStartCheckDescription')}
                </AwaText>
              </View>
              <AwaSwitch
                accessibilityLabel={t('cycleReminders.periodStartCheckTitle')}
                disabled={cycleDataUnavailable}
                onValueChange={value => {
                  setPeriodStartCheckEnabled(value);
                  setError('');
                }}
                value={periodStartCheckEnabled}
              />
            </View>

            {cycleDataUnavailable ? (
              <AwaText colorRole="onSurfaceVariant" style={styles.unavailableNote} variant="bodySmall">{t('cycleReminders.unavailableNote')}</AwaText>
            ) : null}
          </AwaCard>
          {/* JOURNAL QUOTIDIEN */}
          <AwaCard style={styles.card} variant="filled">
            <View style={styles.cardTopRow}>
              <MaterialDesignIcons color={theme.colors.primary} name="notebook-edit-outline" size={24} />
              <View style={styles.cardCopy}>
                <AwaText style={styles.cardTitle} variant="titleMedium">{t('dailyJournalSheet.defaultTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.cardDescription} variant="bodySmall">{t('cycleReminders.dailyJournalDescription')}</AwaText>
              </View>
              <AwaSwitch
                accessibilityLabel={t('dailyJournalSheet.defaultTitle')}
                onValueChange={value => {
                  setDailyJournalEnabled(value);
                  setError('');
                }}
                value={dailyJournalEnabled}
              />
            </View>

            {dailyJournalEnabled ? (
              <Pressable
                accessibilityLabel={dailyJournalTime ? t('cycleReminders.reminderTimeAccessibility', {time: dailyJournalTime}) : t('cycleReminders.chooseReminderTime')}
                accessibilityRole="button"
                onPress={() => setTimePickerVisible(true)}
                style={({pressed}) => [styles.timeRow, pressed && styles.pressed]}>
                <View style={styles.timeIconBox}>
                  <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={18} />
                </View>
                <View style={styles.timeCopy}>
                  <AwaText colorRole="onSurfaceVariant" style={styles.timeLabel} variant="labelMedium">{t('journalIntimacy.timeLabel')}</AwaText>
                  <Text style={dailyJournalTime ? styles.timeValue : styles.timeValuePlaceholder}>
                    {dailyJournalTime ?? t('journalTemperature.chooseATime')}
                  </Text>
                </View>
                <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
              </Pressable>
            ) : null}
          </AwaCard>
          {/* OVULATION & FENÊTRE FERTILE */}
          <AwaCard style={styles.card} variant="filled">
            <View style={styles.cardTopRow}>
              <MaterialDesignIcons color={theme.colors.primary} name="egg-outline" size={24} />
              <View style={styles.cardCopy}>
                <AwaText style={styles.cardTitle} variant="titleMedium">{t('cycleReminders.fertilityTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.cardDescription} variant="bodySmall">{t('cycleReminders.fertilityDescription')}</AwaText>
              </View>
              <AwaSwitch
                accessibilityLabel={t('cycleReminders.fertilityTitle')}
                disabled={cycleDataUnavailable}
                onValueChange={toggleFertility}
                value={fertilityEnabled}
              />
            </View>

            {cycleDataUnavailable ? (
              <AwaText colorRole="onSurfaceVariant" style={styles.unavailableNote} variant="bodySmall">{t('cycleReminders.unavailableNote')}</AwaText>
            ) : null}

            {fertilityEnabled ? (
              <View style={styles.checkboxList}>
                <Pressable
                  accessibilityLabel={t('journalCycleEvolution.estimatedFertileWindow')}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: fertileWindowEnabled}}
                  onPress={() => setFertileWindowEnabled(current => !current)}
                  style={({pressed}) => [styles.checkboxRow, pressed && styles.pressed]}>
                  <View style={[styles.checkbox, fertileWindowEnabled && styles.checkboxChecked]}>
                    {fertileWindowEnabled ? (
                      <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={14} />
                    ) : null}
                  </View>
                  <AwaText style={styles.checkboxLabel} variant="bodyMedium">{t('journalCycleEvolution.estimatedFertileWindow')}</AwaText>
                </Pressable>

                <Pressable
                  accessibilityLabel={t('journalCycleEvolution.phase.ovulation')}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: ovulationEnabled}}
                  onPress={() => setOvulationEnabled(current => !current)}
                  style={({pressed}) => [styles.checkboxRow, pressed && styles.pressed]}>
                  <View style={[styles.checkbox, ovulationEnabled && styles.checkboxChecked]}>
                    {ovulationEnabled ? (
                      <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={14} />
                    ) : null}
                  </View>
                  <AwaText style={styles.checkboxLabel} variant="bodyMedium">{t('journalCycleEvolution.phase.ovulation')}</AwaText>
                </Pressable>
              </View>
            ) : null}
          </AwaCard>
          {timePickerVisible ? (
            <DateTimePicker
              display="default"
              mode="time"
              onValueChange={(_event: DateTimePickerChangeEvent, selected?: Date) => {
                setTimePickerVisible(false);
                if (selected) {
                  setDailyJournalTime(formatTimeValue(selected));
                  setError('');
                }
              }}
              value={dailyJournalTime ? parseTimeToDate(dailyJournalTime) : new Date()}
            />
          ) : null}

          {error ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <MaterialDesignIcons color={theme.colors.danger} name="alert-outline" size={16} />
              <AwaText colorRole="error" style={styles.errorText} variant="bodySmall">{error}</AwaText>
            </View>
          ) : null}

          {permissionNotice ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <MaterialDesignIcons color={theme.colors.danger} name="bell-off-outline" size={16} />
              <View style={styles.permissionNoticeCopy}>
                <AwaText colorRole="error" style={styles.errorText} variant="bodySmall">
                  {t('cycleReminders.permissionNoticeText')}
                </AwaText>
                <AwaButton
                  accessibilityLabel={t('cycleReminders.openNotificationSettings')}
                  label={t('cycleReminders.openSettings')}
                  onPress={() => notifee.openNotificationSettings().catch(() => {})}
                  size="compact"
                  style={styles.permissionSettingsButton}
                  variant="destructive"
                />
              </View>
            </View>
          ) : null}

          <AwaCard padding="compact" style={styles.info} variant="filled">
            <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={20} />
            <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">
              {t('cycleReminders.infoText')}
            </AwaText>
          </AwaCard>
          <AwaButton
            disabled={saving}
            fullWidth
            label={saving ? t('periodStartSheet.saving') : isEdit ? t('common.save') : t('common.continue')}
            onPress={handleSave}
            size="large"
            style={styles.nextButton}
          />
          {!isEdit ? (
            <AwaButton
              disabled={saving}
              fullWidth
              label={t('cycleReminders.skip')}
              onPress={handleSkip}
              style={styles.skipButton}
              variant="text"
            />
          ) : null}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {flex: 1, backgroundColor: theme.colors.background},



    safeArea: {flex: 1},
    content: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},

    pressed: {opacity: 0.82},
    backButton: {alignSelf: 'flex-start', marginBottom: 5},

    header: {alignItems: 'center', marginBottom: 18},

    title: {textAlign: 'center', paddingHorizontal: 8},
    subtitle: {maxWidth: 320, marginTop: 8, textAlign: 'center'},

    card: {marginTop: 14},
    cardTopRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
    cardCopy: {flex: 1, minWidth: 0},
    cardTitle: {},
    cardDescription: {marginTop: 4},
    unavailableNote: {marginTop: 10, fontStyle: 'italic'},

    daysBeforeRow: {flexDirection: 'row', gap: 8, marginTop: 12},
    daysBeforeChip: {
      flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.16), backgroundColor: theme.colors.primarySoft,
    },
    daysBeforeChipSelected: {backgroundColor: theme.colors.primary, borderColor: theme.colors.primary},
    daysBeforeChipText: {color: theme.colors.textSecondary, fontSize: 11.5, fontWeight: '700'},
    daysBeforeChipTextSelected: {color: onPrimaryTextColor(theme)},

    timeRow: {
      minHeight: 58, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },
    timeIconBox: {
      width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    timeCopy: {flex: 1, minWidth: 0},
    timeLabel: {},
    timeValue: {marginTop: 2, color: theme.colors.text, fontSize: 14, fontWeight: '800'},
    timeValuePlaceholder: {marginTop: 2, color: theme.colors.textMuted, fontSize: 14, fontWeight: '600'},

    checkboxList: {marginTop: 12, gap: 8},
    checkboxRow: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48},
    checkbox: {
      width: 22, height: 22, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 7, borderWidth: 1.4, borderColor: withAlpha(theme.colors.primary, 0.35), backgroundColor: theme.colors.surface,
    },
    checkboxChecked: {backgroundColor: theme.colors.primary, borderColor: theme.colors.primary},
    checkboxLabel: {flex: 1, minWidth: 0},

    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.danger, 0.1), borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.15),
    },
    errorText: {flex: 1},
    permissionNoticeCopy: {flex: 1, minWidth: 0},
    permissionSettingsButton: {alignSelf: 'flex-start', marginTop: 8},

    info: {flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16},
    infoText: {flex: 1},

    // DESIGN.md: the CTA is a plain AwaButton (filled) — no custom fill or heavy shadow.
    nextButton: {marginTop: 16},

    skipButton: {marginTop: 4},
  });
}

export default CycleRemindersScreen;
