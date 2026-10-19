import {continueAfterObjectiveSetup} from '../state/objectiveSetupFlow';
import React, {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import NotificationPermissionNotice from '../components/notifications/NotificationPermissionNotice';
import {useReminderPermissionGuard} from '../hooks/useReminderPermissionGuard';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaSwitch} from '../components/ui/AwaSwitch';
import {AwaText} from '../components/ui/AwaText';
import {
  getMenopausePreferences,
  setMenopauseReminderPreferences,
} from '../state/menopausePreferences';
import {dateAtTimeOfDay, formatTimeOfDay} from '../utils/timeOfDay';
import '../i18n';
import {presentSaveFailure} from '../services/saveFailure';

// Same 'HH:mm' formatting/parsing convention as
// ContraceptionRemindersScreen.tsx's/PregnancyNotificationsScreen.tsx's own
// un-exported helpers — kept local since it's pure UI display formatting.
// Stored as 'HH:mm' (24-hour, zero-padded, locale-independent — see utils/timeOfDay.ts). It used to come from
// Intl.DateTimeFormat, which writes 00:30 as "24:30" under en-US; a stored "24:30" still reads as 00:30.
function formatTimeValue(date: Date): string {
  return formatTimeOfDay(date);
}
function parseTimeToDate(hhmm: string): Date {
  return dateAtTimeOfDay(new Date(), hhmm);
}

type Props = NativeStackScreenProps<RootStackParamList, 'MenopauseReminders'>;

type TimePickerTarget = 'daily' | 'treatment' | null;

function MenopauseRemindersScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const editStyles = useMemo(() => createEditStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const mode = route.params?.mode ?? 'onboarding';
  const isEdit = mode === 'edit';

  // Synchronous read of the live in-memory store — App.tsx already hydrates
  // menopausePreferences.ts once at boot (same reasoning as
  // ContraceptionRemindersScreen.tsx's own initializer comment).
  const [showTreatmentCard] = useState(
    () => getMenopausePreferences().hormonalTreatmentStatus === 'track',
  );
  const [dailyEnabled, setDailyEnabled] = useState(
    () => getMenopausePreferences().dailyTrackingReminderEnabled,
  );
  // A time an earlier build stored as "24:30" (00:30, written under en-US) is shown — and saved back — as 00:30.
  const [dailyTime, setDailyTime] = useState<string | null>(() => {
    const stored = getMenopausePreferences().dailyTrackingReminderTime;
    return stored ? formatTimeValue(parseTimeToDate(stored)) : null;
  });
  const [treatmentEnabled, setTreatmentEnabled] = useState(
    () => getMenopausePreferences().treatmentReminderEnabled,
  );
  const [treatmentTime, setTreatmentTime] = useState<string | null>(() => {
    const stored = getMenopausePreferences().treatmentReminderTime;
    return stored ? formatTimeValue(parseTimeToDate(stored)) : null;
  });

  const [timePickerTarget, setTimePickerTarget] = useState<TimePickerTarget>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Whether Android would actually show a reminder she has switched on (notifications off / reminders channel
  // blocked). Only read while a reminder switch is on; the treatment switch only counts while its card is shown.
  const anyReminderOn = dailyEnabled || (showTreatmentCard && treatmentEnabled);
  const permissionGuard = useReminderPermissionGuard(anyReminderOn);

  const goToNext = () => {
    if (isEdit) {
      navigation.goBack();
    } else {
      continueAfterObjectiveSetup(navigation);
    }
  };

  // The one shared notice (same wording, "open settings" and re-check on every objective's reminders step). Once a
  // save was blocked it also offers "Continue without notifications", which performs the navigation Save would have.
  const permissionNotice = anyReminderOn ? (
    <NotificationPermissionNotice
      onContinue={permissionGuard.saveBlocked ? goToNext : undefined}
      onRecheck={permissionGuard.refresh}
      state={permissionGuard.state}
      testID="menopause-reminders-permission-notice"
    />
  ) : null;

  const persistAndContinue = async (
    values: {
      dailyTrackingReminderEnabled: boolean;
      dailyTrackingReminderTime: string | null;
      treatmentReminderEnabled: boolean;
      treatmentReminderTime: string | null;
    },
  ) => {
    setSaving(true);
    try {
      await setMenopauseReminderPreferences(values);

      // Only ever requested here — when a reminder is actually being
      // confirmed enabled — never merely for opening this screen. Refused:
      // she stays on this screen with the notice (her choices above are
      // already saved either way) instead of the screen closing at once.
      const allowed = await permissionGuard.allowSave(
        values.dailyTrackingReminderEnabled || values.treatmentReminderEnabled,
      );
      if (!allowed) {
        return;
      }

      goToNext();
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (saving) {return;}
    // Never persist "enabled" without a real, user-chosen time — no
    // fallback hour is invented here; she must explicitly pick one.
    if (dailyEnabled && !dailyTime) {
      setError(t('menopauseReminders.dailyTracking.missingTimeError'));
      return;
    }
    if (showTreatmentCard && treatmentEnabled && !treatmentTime) {
      setError(t('menopauseReminders.treatment.missingTimeError'));
      return;
    }
    setError('');
    persistAndContinue({
      dailyTrackingReminderEnabled: dailyEnabled,
      dailyTrackingReminderTime: dailyTime,
      treatmentReminderEnabled: showTreatmentCard && treatmentEnabled,
      treatmentReminderTime: showTreatmentCard ? treatmentTime : null,
    });
  };

  const handleSkip = () => {
    if (saving) {return;}
    // Optional and reversible: onboarding simply continues without touching
    // any previously-persisted reminder preference.
    goToNext();
  };

  const renderTimeRow = (target: Exclude<TimePickerTarget, null>, time: string | null) => (
    <Pressable
      accessibilityLabel={time ? t('menopauseReminders.timeAccessibility', {time}) : t('menopauseReminders.chooseTimeAccessibility')}
      accessibilityRole="button"
      onPress={() => setTimePickerTarget(target)}
      style={({pressed}) => [editStyles.timeRow, pressed && editStyles.pressed]}>
      <AwaText colorRole="onSurfaceVariant" variant="labelLarge">
        {t('menopauseReminders.timeRowLabel')}
      </AwaText>
      <View style={editStyles.timeRowValueGroup}>
        <AwaText colorRole={time ? 'onSurface' : 'onSurfaceVariant'} emphasized={Boolean(time)} variant="bodyLarge">
          {time ?? t('menopauseReminders.choosePlaceholderShort')}
        </AwaText>
        <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={18} />
      </View>
    </Pressable>
  );

  // Profile → Santé générale → Notifications & rappels gets a distinct,
  // sober settings-style presentation (same visual language as
  // PrivacySecurityScreen.tsx / ConceptionOnboardingScreens.tsx's own edit
  // branch: flat background, compact header, one card with switch rows) —
  // NOT the premium onboarding gradient below, which stays completely
  // untouched for the real onboarding flow. Reuses the exact same
  // `handleContinue` validation/save/permission/resync chain as onboarding —
  // there is no second save path.
  if (isEdit) {
    return (
      <SafeAreaView edges={['left', 'right']} style={editStyles.safe}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
        <ScrollView
          contentContainerStyle={[
            editStyles.content,
            {paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 18) + 25},
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={editStyles.header}>
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              icon="chevron-left"
              onPress={navigation.goBack}
              style={editStyles.back}
            />
            <View style={editStyles.headerCopy}>
              <AwaText variant="headlineSmall">{t('profile.notificationsAndReminders')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" style={editStyles.subtitle} variant="bodySmall">
                {showTreatmentCard
                  ? t('menopauseReminders.editSubtitleWithTreatment')
                  : t('menopauseReminders.editSubtitleDailyOnly')}
              </AwaText>
            </View>
          </View>

          <AwaCard padding="compact" style={editStyles.card} variant="filled">
            <View style={[editStyles.group, showTreatmentCard && editStyles.groupBorder]}>
              <View style={editStyles.row}>
                <View style={editStyles.rowIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="notebook-edit-outline" size={18} />
                </View>
                <View style={editStyles.rowCopy}>
                  <AwaText variant="titleSmall">{t('menopauseReminders.dailyTracking.editRowTitle')}</AwaText>
                  <AwaText colorRole="onSurfaceVariant" style={editStyles.rowSubtitle} variant="bodySmall">
                    {t('menopauseReminders.dailyTracking.editRowSubtitle')}
                  </AwaText>
                </View>
                <AwaSwitch
                  accessibilityLabel={t('menopauseReminders.dailyTracking.editRowTitle')}
                  onValueChange={value => {
                    setDailyEnabled(value);
                    setError('');
                  }}
                  value={dailyEnabled}
                />
              </View>
              {dailyEnabled ? renderTimeRow('daily', dailyTime) : null}
            </View>

            {showTreatmentCard ? (
              <View style={editStyles.group}>
                <View style={editStyles.row}>
                  <View style={editStyles.rowIcon}>
                    <MaterialDesignIcons color={theme.colors.primary} name="pill" size={18} />
                  </View>
                  <View style={editStyles.rowCopy}>
                    <AwaText variant="titleSmall">{t('profile.menopause.hormonalTreatmentLabel')}</AwaText>
                    <AwaText colorRole="onSurfaceVariant" style={editStyles.rowSubtitle} variant="bodySmall">
                      {t('menopauseReminders.treatment.editRowSubtitle')}
                    </AwaText>
                  </View>
                  <AwaSwitch
                    accessibilityLabel={t('profile.menopause.hormonalTreatmentLabel')}
                    onValueChange={value => {
                      setTreatmentEnabled(value);
                      setError('');
                    }}
                    value={treatmentEnabled}
                  />
                </View>
                {treatmentEnabled ? renderTimeRow('treatment', treatmentTime) : null}
              </View>
            ) : null}
          </AwaCard>

          {timePickerTarget ? (
            <DateTimePicker
              display="default"
              mode="time"
              onValueChange={(_event: DateTimePickerChangeEvent, selected?: Date) => {
                const target = timePickerTarget;
                setTimePickerTarget(null);
                if (!selected) {return;}
                const value = formatTimeValue(selected);
                if (target === 'daily') {
                  setDailyTime(value);
                } else if (target === 'treatment') {
                  setTreatmentTime(value);
                }
                setError('');
              }}
              value={
                (timePickerTarget === 'daily' ? dailyTime : treatmentTime)
                  ? parseTimeToDate((timePickerTarget === 'daily' ? dailyTime : treatmentTime) as string)
                  : new Date()
              }
            />
          ) : null}

          {error ? (
            <View accessibilityRole="alert" style={editStyles.errorCard}>
              <MaterialDesignIcons color={theme.colors.danger} name="alert-outline" size={16} />
              <AwaText colorRole="error" style={editStyles.errorText} variant="bodySmall">
                {error}
              </AwaText>
            </View>
          ) : null}

          {permissionNotice}

          <AwaButton
            disabled={saving}
            fullWidth
            label={saving ? t('periodStartSheet.saving') : t('common.save')}
            onPress={handleContinue}
            size="large"
            style={editStyles.saveButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

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
              icon="arrow-left"
              onPress={navigation.goBack}
              style={styles.backButton}
            />
          ) : null}

          <View style={styles.header}>
            <AwaText style={styles.title} variant="headlineMedium">
              {t('menopauseReminders.title')}
            </AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
              {t('menopauseReminders.subtitle')}
            </AwaText>
          </View>

          <AwaCard style={styles.card} variant="filled">
            <View style={styles.cardTopRow}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="notebook-edit-outline" size={22} />
              </View>
              <View style={styles.cardCopy}>
                <AwaText variant="titleMedium">{t('menopauseReminders.dailyTracking.cardTitle')}</AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.cardDescription} variant="bodySmall">
                  {t('menopauseReminders.dailyTracking.cardDescription')}
                </AwaText>
              </View>
              <AwaSwitch
                accessibilityLabel={t('menopauseReminders.dailyTracking.cardTitle')}
                onValueChange={value => {
                  setDailyEnabled(value);
                  setError('');
                }}
                value={dailyEnabled}
              />
            </View>

            {dailyEnabled ? (
              <Pressable
                accessibilityLabel={dailyTime ? t('menopauseReminders.timeAccessibility', {time: dailyTime}) : t('menopauseReminders.chooseTimeAccessibility')}
                accessibilityRole="button"
                onPress={() => setTimePickerTarget('daily')}
                style={({pressed}) => [styles.timeRow, pressed && styles.pressed]}>
                <View style={styles.timeIconBox}>
                  <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={18} />
                </View>
                <View style={styles.timeCopy}>
                  <AwaText colorRole="onSurfaceVariant" variant="labelMedium">
                    {t('menopauseReminders.timeQuestionLabel')}
                  </AwaText>
                  <AwaText
                    colorRole={dailyTime ? 'onSurface' : 'onSurfaceVariant'}
                    emphasized={Boolean(dailyTime)}
                    style={styles.timeValue}
                    variant="bodyLarge">
                    {dailyTime ?? t('menopauseReminders.chooseTimePlaceholder')}
                  </AwaText>
                </View>
                <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
              </Pressable>
            ) : null}
          </AwaCard>

          {showTreatmentCard ? (
            <AwaCard style={styles.card} variant="filled">
              <View style={styles.cardTopRow}>
                <View style={styles.cardIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="pill" size={22} />
                </View>
                <View style={styles.cardCopy}>
                  <AwaText variant="titleMedium">{t('menopauseReminders.treatment.cardTitle')}</AwaText>
                  <AwaText colorRole="onSurfaceVariant" style={styles.cardDescription} variant="bodySmall">
                    {t('menopauseReminders.treatment.cardDescription')}
                  </AwaText>
                </View>
                <AwaSwitch
                  accessibilityLabel={t('menopauseReminders.treatment.cardTitle')}
                  onValueChange={value => {
                    setTreatmentEnabled(value);
                    setError('');
                  }}
                  value={treatmentEnabled}
                />
              </View>

              {treatmentEnabled ? (
                <Pressable
                  accessibilityLabel={treatmentTime ? t('menopauseReminders.timeAccessibility', {time: treatmentTime}) : t('menopauseReminders.chooseTimeAccessibility')}
                  accessibilityRole="button"
                  onPress={() => setTimePickerTarget('treatment')}
                  style={({pressed}) => [styles.timeRow, pressed && styles.pressed]}>
                  <View style={styles.timeIconBox}>
                    <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={18} />
                  </View>
                  <View style={styles.timeCopy}>
                    <AwaText colorRole="onSurfaceVariant" variant="labelMedium">
                      {t('menopauseReminders.timeQuestionLabel')}
                    </AwaText>
                    <AwaText
                      colorRole={treatmentTime ? 'onSurface' : 'onSurfaceVariant'}
                      emphasized={Boolean(treatmentTime)}
                      style={styles.timeValue}
                      variant="bodyLarge">
                      {treatmentTime ?? t('menopauseReminders.chooseTimePlaceholder')}
                    </AwaText>
                  </View>
                  <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
                </Pressable>
              ) : null}
            </AwaCard>
          ) : null}

          {timePickerTarget ? (
            <DateTimePicker
              display="default"
              mode="time"
              onValueChange={(_event: DateTimePickerChangeEvent, selected?: Date) => {
                const target = timePickerTarget;
                setTimePickerTarget(null);
                if (!selected) {return;}
                const value = formatTimeValue(selected);
                if (target === 'daily') {
                  setDailyTime(value);
                } else if (target === 'treatment') {
                  setTreatmentTime(value);
                }
                setError('');
              }}
              value={
                (timePickerTarget === 'daily' ? dailyTime : treatmentTime)
                  ? parseTimeToDate((timePickerTarget === 'daily' ? dailyTime : treatmentTime) as string)
                  : new Date()
              }
            />
          ) : null}

          {error ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <MaterialDesignIcons color={theme.colors.danger} name="alert-outline" size={16} />
              <AwaText colorRole="error" style={styles.errorText} variant="bodySmall">
                {error}
              </AwaText>
            </View>
          ) : null}

          {permissionNotice}

          <View style={styles.info}>
            <View style={styles.infoIconBox}>
              <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={18} />
            </View>
            <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">
              {t('menopauseReminders.infoText')}
            </AwaText>
          </View>

          <View style={styles.spacer} />

          <AwaButton
            disabled={saving}
            fullWidth
            label={saving ? t('periodStartSheet.saving') : isEdit ? t('common.save') : t('common.continue')}
            onPress={handleContinue}
            size="large"
            style={styles.nextButton}
          />

          {!isEdit ? (
            <AwaButton
              disabled={saving}
              fullWidth
              label={t('menopauseReminders.skip')}
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

// Deliberately separate from `styles` below: Profile/edit mode uses a sober
// settings-page presentation (same visual language as
// PrivacySecurityScreen.tsx / ConceptionOnboardingScreens.tsx's own edit
// branch) while onboarding keeps its unrelated premium gradient Shell.
function createEditStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    content: {flexGrow: 1, paddingHorizontal: 16},
    pressed: {opacity: 0.82},

    header: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18},
    back: {flexShrink: 0},
    headerCopy: {flex: 1, minWidth: 0, marginLeft: 12, paddingTop: 6},
    subtitle: {marginTop: 4},

    card: {overflow: 'hidden'},
    group: {paddingVertical: 4},
    groupBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border},
    row: {minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 11},
    rowIcon: {
      width: 38, height: 38, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    rowCopy: {flex: 1, minWidth: 0},
    rowSubtitle: {marginTop: 2},

    timeRow: {
      minHeight: 48, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    timeRowValueGroup: {flexDirection: 'row', alignItems: 'center', gap: 4},

    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 12,
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.danger, 0.1), borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.3),
    },
    errorText: {flex: 1},

    saveButton: {marginTop: 8},
  });
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {flex: 1, backgroundColor: theme.colors.background},



    safeArea: {flex: 1},
    content: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
    pressed: {opacity: 0.82},

    backButton: {alignSelf: 'flex-start', marginBottom: 8},

    header: {alignItems: 'center', marginBottom: 16},

    title: {textAlign: 'center', paddingHorizontal: 8},
    subtitle: {maxWidth: 320, marginTop: 8, textAlign: 'center'},

    card: {marginTop: 12},
    cardTopRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
    cardIcon: {
      width: 40, height: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    cardCopy: {flex: 1, minWidth: 0},
    cardDescription: {marginTop: 4},

    timeRow: {
      minHeight: 56, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    timeIconBox: {
      width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    timeCopy: {flex: 1, minWidth: 0},
    timeValue: {marginTop: 2},

    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.danger, 0.1), borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.3),
    },
    errorText: {flex: 1},

    info: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14,
      borderRadius: 16, backgroundColor: withAlpha(theme.colors.primarySoft, 0.9), paddingHorizontal: 12, paddingVertical: 11,
    },
    infoIconBox: {
      width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.surface,
    },
    infoText: {flex: 1},

    spacer: {flex: 1, minHeight: 16},

    nextButton: {marginTop: 12},

    skipButton: {marginTop: 4},
  });
}

export default MenopauseRemindersScreen;
