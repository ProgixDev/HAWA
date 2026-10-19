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
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import NotificationPermissionNotice from '../components/notifications/NotificationPermissionNotice';
import {useReminderPermissionGuard} from '../hooks/useReminderPermissionGuard';
import {
  getPostpartumPreferences,
  setPostpartumDailyTrackingReminder,
} from '../state/postpartumPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {dateAtTimeOfDay, formatTimeOfDay} from '../utils/timeOfDay';
import '../i18n';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaSwitch} from '../components/ui/AwaSwitch';
import {AwaText} from '../components/ui/AwaText';

// Same 'HH:mm' formatting/parsing convention as MenopauseRemindersScreen.tsx's/
// ContraceptionRemindersScreen.tsx's own un-exported helpers — kept local
// since it's pure UI display formatting.
// Stored as 'HH:mm' (24-hour, zero-padded, locale-independent — see utils/timeOfDay.ts). It used to come from
// Intl.DateTimeFormat, which writes 00:30 as "24:30" under en-US; a stored "24:30" still reads as 00:30.
function formatTimeValue(date: Date): string {
  return formatTimeOfDay(date);
}
function parseTimeToDate(hhmm: string): Date {
  return dateAtTimeOfDay(new Date(), hhmm);
}

type Props = NativeStackScreenProps<RootStackParamList, 'PostpartumReminders'>;

function PostpartumRemindersScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const editStyles = useMemo(() => createEditStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const mode = route.params?.mode ?? 'onboarding';
  const isEdit = mode === 'edit';

  // Synchronous read of the live in-memory store — App.tsx already hydrates
  // postpartumPreferences.ts once at boot (same reasoning as
  // MenopauseRemindersScreen.tsx's own initializer comment).
  const [dailyEnabled, setDailyEnabled] = useState(
    () => getPostpartumPreferences().dailyTrackingReminderEnabled,
  );
  // A time an earlier build stored as "24:30" (00:30, written under en-US) is shown — and saved back — as 00:30.
  const [dailyTime, setDailyTime] = useState<string | null>(() => {
    const stored = getPostpartumPreferences().dailyTrackingReminderTime;
    return stored ? formatTimeValue(parseTimeToDate(stored)) : null;
  });

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Whether Android would actually show the reminder she has switched on (notifications off / reminders channel
  // blocked). Only read while the switch is on.
  const permissionGuard = useReminderPermissionGuard(dailyEnabled);

  const goToNext = () => {
    if (isEdit) {
      navigation.goBack();
    } else {
      continueAfterObjectiveSetup(navigation);
    }
  };

  // The one shared notice (same wording, "open settings" and re-check on every objective's reminders step). Once a
  // save was blocked it also offers "Continue without notifications", which performs the navigation Save would have.
  const permissionNotice = dailyEnabled ? (
    <NotificationPermissionNotice
      onContinue={permissionGuard.saveBlocked ? goToNext : undefined}
      onRecheck={permissionGuard.refresh}
      state={permissionGuard.state}
      testID="postpartum-reminders-permission-notice"
    />
  ) : null;

  const persistAndContinue = async (
    values: {
      dailyTrackingReminderEnabled: boolean;
      dailyTrackingReminderTime: string | null;
    },
  ) => {
    setSaving(true);
    try {
      await setPostpartumDailyTrackingReminder(values);

      // Only ever requested here — when the reminder is actually being
      // confirmed enabled — never merely for opening this screen. Refused:
      // she stays on this screen with the notice (her choice above is
      // already saved either way) instead of the screen closing at once.
      const allowed = await permissionGuard.allowSave(values.dailyTrackingReminderEnabled);
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
      setError(t('postpartumReminders.timeRequiredError'));
      return;
    }
    setError('');
    persistAndContinue({
      dailyTrackingReminderEnabled: dailyEnabled,
      dailyTrackingReminderTime: dailyTime,
    });
  };

  const handleSkip = () => {
    if (saving) {return;}
    // Optional and reversible: onboarding simply continues without touching
    // any previously-persisted reminder preference.
    goToNext();
  };

  // Profile → Santé générale → Notifications & rappels gets a distinct,
  // sober settings-style presentation (same visual language as
  // PrivacySecurityScreen.tsx / MenopauseRemindersScreen.tsx's own edit
  // branch: flat background, compact header, one card with a switch row) —
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
              accessibilityRole="button"
              hitSlop={10}
              onPress={navigation.goBack}
              icon="chevron-left"
              iconSize={26}
            />
            <View style={editStyles.headerCopy}>
              <AwaText variant="headlineSmall">{t('postpartumReminders.edit.title')}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={editStyles.subtitle}>
                {t('postpartumReminders.edit.subtitle')}
              </AwaText>
            </View>
          </View>

          <AwaCard padding="none" variant="filled" style={editStyles.card}>
            <View style={editStyles.row}>
              <View style={editStyles.rowIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="notebook-edit-outline" size={18} />
              </View>
              <View style={editStyles.rowCopy}>
                <AwaText variant="labelMedium">{t('postpartumReminders.dailyTracking.title')}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={editStyles.rowSubtitle}>
                  {t('postpartumReminders.dailyTracking.description')}
                </AwaText>
              </View>
              <AwaSwitch
                accessibilityLabel={t('postpartumReminders.dailyTracking.title')}
                onValueChange={value => {
                  setDailyEnabled(value);
                  setError('');
                }}
                value={dailyEnabled}
              />
            </View>

            {dailyEnabled ? (
              <Pressable
                accessibilityLabel={dailyTime ? t('postpartumReminders.timePicker.accessibilityLabelWithTime', {time: dailyTime}) : t('postpartumReminders.timePicker.accessibilityLabelChoose')}
                accessibilityRole="button"
                onPress={() => setTimePickerVisible(true)}
                style={({pressed}) => [editStyles.timeRow, pressed && editStyles.pressed]}>
                <AwaText variant="labelMedium" colorRole="onSurfaceVariant">{t('postpartumReminders.timePicker.label')}</AwaText>
                <View style={editStyles.timeRowValueGroup}>
                  <Text style={dailyTime ? editStyles.timeValue : editStyles.timeValuePlaceholder}>
                    {dailyTime ?? t('postpartumReminders.timePicker.choosePlaceholderShort')}
                  </Text>
                  <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={18} />
                </View>
              </Pressable>
            ) : null}
          </AwaCard>

          {timePickerVisible ? (
            <DateTimePicker
              display="default"
              mode="time"
              onValueChange={(_event: DateTimePickerChangeEvent, selected?: Date) => {
                setTimePickerVisible(false);
                if (!selected) {return;}
                setDailyTime(formatTimeValue(selected));
                setError('');
              }}
              value={dailyTime ? parseTimeToDate(dailyTime) : new Date()}
            />
          ) : null}

          {error ? (
            <View accessibilityRole="alert" style={editStyles.errorCard}>
              <MaterialDesignIcons color={theme.colors.danger} name="alert-outline" size={16} />
              <AwaText variant="bodySmall" colorRole="error" style={editStyles.errorText}>{error}</AwaText>
            </View>
          ) : null}

          {permissionNotice}

          <AwaButton
            accessibilityRole="button"
            disabled={saving}
            onPress={handleContinue}
            label={saving ? t('postpartumReminders.saving') : t('common.save')}
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
          <View style={styles.header}>
            <AwaText variant="headlineSmall" style={styles.title}>{t('postpartumReminders.onboarding.title')}</AwaText>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.subtitle}>
              {t('postpartumReminders.onboarding.subtitle')}
            </AwaText>
          </View>

          <AwaCard padding="none" variant="filled" style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="notebook-edit-outline" size={22} />
              </View>
              <View style={styles.cardCopy}>
                <AwaText variant="titleSmall">{t('postpartumReminders.dailyTracking.title')}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardDescription}>
                  {t('postpartumReminders.dailyTracking.description')}
                </AwaText>
              </View>
              <AwaSwitch
accessibilityLabel={t('postpartumReminders.dailyTracking.title')}
                onValueChange={value => {
                  setDailyEnabled(value);
                  setError('');
                }}
                value={dailyEnabled}
              />
            </View>

            {dailyEnabled ? (
              <Pressable
                accessibilityLabel={dailyTime ? t('postpartumReminders.timePicker.accessibilityLabelWithTime', {time: dailyTime}) : t('postpartumReminders.timePicker.accessibilityLabelChoose')}
                accessibilityRole="button"
                onPress={() => setTimePickerVisible(true)}
                style={({pressed}) => [styles.timeRow, pressed && styles.pressed]}>
                <View style={styles.timeIconBox}>
                  <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={18} />
                </View>
                <View style={styles.timeCopy}>
                  <AwaText variant="labelSmall" colorRole="onSurfaceVariant">{t('postpartumReminders.timePicker.label')}</AwaText>
                  <Text style={dailyTime ? styles.timeValue : styles.timeValuePlaceholder}>
                    {dailyTime ?? t('postpartumReminders.timePicker.choosePlaceholderLong')}
                  </Text>
                </View>
                <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
              </Pressable>
            ) : null}
          </AwaCard>

          {timePickerVisible ? (
            <DateTimePicker
              display="default"
              mode="time"
              onValueChange={(_event: DateTimePickerChangeEvent, selected?: Date) => {
                setTimePickerVisible(false);
                if (!selected) {return;}
                setDailyTime(formatTimeValue(selected));
                setError('');
              }}
              value={dailyTime ? parseTimeToDate(dailyTime) : new Date()}
            />
          ) : null}

          {error ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <MaterialDesignIcons color={theme.colors.danger} name="alert-outline" size={16} />
              <AwaText variant="bodySmall" colorRole="error" style={styles.errorText}>{error}</AwaText>
            </View>
          ) : null}

          {permissionNotice}

          <View style={styles.info}>
            <View style={styles.infoIconBox}>
              <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={18} />
            </View>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
              {t('postpartumReminders.onboarding.infoText')}
            </AwaText>
          </View>

          <View style={styles.spacer} />

          <AwaButton
            accessibilityRole="button"
            disabled={saving}
            onPress={handleContinue}
            label={saving ? t('postpartumReminders.saving') : t('common.continue')}
            size="large"
            style={styles.nextButton}
          />

          <AwaButton
            accessibilityRole="button"
            disabled={saving}
            onPress={handleSkip}
            label={t('postpartumReminders.onboarding.skip')}
            variant="text"
            style={styles.skipButton}
          />
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

// Deliberately separate from `styles` below: Profile/edit mode uses a sober
// settings-page presentation (same visual language as
// PrivacySecurityScreen.tsx / MenopauseRemindersScreen.tsx's own edit
// branch) while onboarding keeps its unrelated premium gradient Shell.
function createEditStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    content: {flexGrow: 1, paddingHorizontal: 16},
    pressed: {opacity: 0.82},

    header: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18},
    headerCopy: {flex: 1, minWidth: 0, marginLeft: 12, paddingTop: 6},
    subtitle: {marginTop: 5},

    card: {overflow: 'hidden', paddingHorizontal: 12},
    row: {minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 11},
    rowIcon: {
      width: 38, height: 38, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    rowCopy: {flex: 1, minWidth: 0},
    rowSubtitle: {marginTop: 3},

    timeRow: {
      minHeight: 48, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    timeRowValueGroup: {flexDirection: 'row', alignItems: 'center', gap: 4},
    timeValue: {color: theme.colors.text, fontSize: 14, fontWeight: '800'},
    timeValuePlaceholder: {color: theme.colors.textMuted, fontSize: 14, fontWeight: '600'},

    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 12,
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.danger, 0.08), borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.15),
    },
    errorText: {flex: 1},

    saveButton: {marginTop: 6},
  });
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {flex: 1, backgroundColor: theme.colors.background},



    safeArea: {flex: 1},
    content: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
    pressed: {opacity: 0.82},

    header: {alignItems: 'center', marginBottom: 18},

    title: {textAlign: 'center', paddingHorizontal: 8},
    subtitle: {maxWidth: 320, marginTop: 8, textAlign: 'center'},

    card: {marginTop: 14, padding: 15},
    cardTopRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
    cardIcon: {
      width: 42, height: 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    cardCopy: {flex: 1, minWidth: 0},
    cardDescription: {marginTop: 4},

    timeRow: {
      minHeight: 58, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    timeIconBox: {
      width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    timeCopy: {flex: 1, minWidth: 0},
    timeValue: {marginTop: 3, color: theme.colors.text, fontSize: 14, fontWeight: '800'},
    timeValuePlaceholder: {marginTop: 3, color: theme.colors.textMuted, fontSize: 14, fontWeight: '600'},

    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.danger, 0.08), borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.15),
    },
    errorText: {flex: 1},

    info: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14,
      borderRadius: 16, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 12, paddingVertical: 11,
    },
    infoIconBox: {
      width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.surface,
    },
    infoText: {flex: 1},

    spacer: {flex: 1, minHeight: 14},

    nextButton: {marginTop: 12},

    skipButton: {marginTop: 4},
  });
}

export default PostpartumRemindersScreen;
