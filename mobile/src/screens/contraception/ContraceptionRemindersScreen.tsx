import {continueAfterObjectiveSetup} from '../../state/objectiveSetupFlow';
import React, {useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaSwitch} from '../../components/ui/AwaSwitch';
import {AwaText} from '../../components/ui/AwaText';
import {dateAtTimeOfDay, formatTimeOfDay} from '../../utils/timeOfDay';
import {
  getContraceptionPreferences,
  setContraceptionPreferences,
} from '../../state/contraceptionPreferences';
import {
  contraceptionDefaultReminderContent,
  contraceptionReminderContent,
} from '../../config/contraceptionLabels';
import {contraceptionMethodSupportsDailyReminder} from '../../utils/contraceptionReminderScheduling';
import NotificationPermissionNotice from '../../components/notifications/NotificationPermissionNotice';
import {useReminderPermissionGuard} from '../../hooks/useReminderPermissionGuard';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';

// Same 'HH:mm' formatting/parsing convention as
// PregnancyNotificationsScreen.tsx's dailyJournalTime field — kept local
// (not exported) since it's pure UI display formatting, exactly like that
// screen's own un-exported helpers.
// Stored as 'HH:mm' (24-hour, zero-padded, locale-independent — see utils/timeOfDay.ts). It used to come from
// Intl.DateTimeFormat, which writes 00:30 as "24:30" under en-US; a stored "24:30" still reads as 00:30.
function formatTimeValue(date: Date): string {
  return formatTimeOfDay(date);
}
function parseTimeToDate(hhmm: string): Date {
  return dateAtTimeOfDay(new Date(), hhmm);
}

type Props = NativeStackScreenProps<RootStackParamList, 'ContraceptionReminders'>;

function ContraceptionRemindersScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const mode = route.params?.mode ?? 'onboarding';
  const isEdit = mode === 'edit';

  // No re-hydration effect here: hydrateContraceptionPreferences() is
  // memoized app-wide (App.tsx already calls it once at boot), so calling it
  // again would only redeliver a frozen snapshot from whenever that first
  // call settled — not a fresh read — which previously caused a real bug on
  // ContraceptionInformationScreen (see its own comment). This screen is
  // always the last stop before saving `remindersEnabled`, and nothing
  // earlier in the flow writes it, so the synchronous initializer below
  // (reading the live in-memory store) is already correct.
  const [method] = useState(() => getContraceptionPreferences().method);
  const [enabled, setEnabled] = useState(
    () => getContraceptionPreferences().remindersEnabled,
  );
  // A time an earlier build stored as "24:30" (00:30, written under en-US) is shown — and saved back — as 00:30.
  const [reminderTime, setReminderTime] = useState<string | null>(() => {
    const stored = getContraceptionPreferences().reminderTime;
    return stored ? formatTimeValue(parseTimeToDate(stored)) : null;
  });
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const content = method
    ? contraceptionReminderContent(t)[method]
    : contraceptionDefaultReminderContent(t);

  // 'ring'/'patch' have no daily action to remind about — see
  // contraceptionReminderScheduling.ts's own comment on why no schedule is
  // invented for them. Only 'pill'/'other' (and the no-method-yet default)
  // get the enable/time controls, so this screen never promises a reminder
  // the scheduler wouldn't actually set.
  const supportsDailyReminder = contraceptionMethodSupportsDailyReminder(method) || method === null;

  // Whether Android would actually show the reminder she has switched on (notifications off / reminders channel
  // blocked). Only read while the switch is on (and shown).
  const reminderOn = supportsDailyReminder && enabled;
  const permissionGuard = useReminderPermissionGuard(reminderOn);

  const goToNext = () => {
    if (isEdit) {
      navigation.goBack();
    } else {
      continueAfterObjectiveSetup(navigation);
    }
  };

  const handleFinish = async () => {
    if (saving) {return;}
    if (!supportsDailyReminder) {
      // Nothing editable for this method — just leave.
      goToNext();
      return;
    }
    // Never persist "enabled" without a real, user-chosen time — no
    // fallback hour is invented here; she must explicitly pick one.
    if (enabled && !reminderTime) {
      setError(t('contraceptionReminders.errorChooseTime'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      // reminderTime is kept even when disabling — re-enabling later should
      // not silently lose a previously chosen time.
      await setContraceptionPreferences({remindersEnabled: enabled, reminderTime});

      // Only asked when the reminder is actually being saved as enabled —
      // never merely for opening this screen. Refused: she stays on this
      // screen with the notice (her choice above is already saved either way)
      // instead of the screen closing at once.
      const allowed = await permissionGuard.allowSave(enabled);
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

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} hidden={false} translucent />

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
            <AwaText
              style={styles.title}
              variant="headlineMedium">
              {t('contraceptionReminders.title')}
            </AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
              {content.subtitle}
            </AwaText>
          </View>

          <AwaCard style={styles.card} variant="filled">
            <View style={styles.cardIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="bell-ring-outline" size={22} />
            </View>

            <View style={styles.cardCopy}>
              <AwaText variant="titleMedium">{content.cardTitle}</AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.cardDescription} variant="bodySmall">
                {content.cardDescription}
              </AwaText>
            </View>
          </AwaCard>

          {supportsDailyReminder ? (
            <>
              <AwaCard style={styles.toggleRow} variant="filled">
                <AwaText style={styles.toggleLabel} variant="titleSmall">
                  {t('contraceptionReminders.toggleLabel')}
                </AwaText>
                <AwaSwitch
                  accessibilityLabel={t('contraceptionReminders.toggleLabel')}
                  onValueChange={value => {
                    setEnabled(value);
                    setError('');
                  }}
                  value={enabled}
                />
              </AwaCard>

              {enabled ? (
                <AwaCard
                  accessibilityLabel={
                    reminderTime
                      ? t('contraceptionReminders.timeAccessibility.withValue', {time: reminderTime})
                      : t('contraceptionReminders.timeAccessibility.empty')
                  }
                  onPress={() => setTimePickerVisible(true)}
                  style={styles.timeRow}
                  variant="filled">
                  <View style={styles.timeIconBox}>
                    <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={18} />
                  </View>
                  <View style={styles.timeCopy}>
                    <AwaText colorRole="onSurfaceVariant" variant="labelMedium">
                      {t('contraceptionReminders.timeLabel')}
                    </AwaText>
                    <AwaText
                      colorRole={reminderTime ? 'onSurface' : 'onSurfaceVariant'}
                      emphasized={Boolean(reminderTime)}
                      style={styles.timeValue}
                      variant="bodyLarge">
                      {reminderTime ?? t('contraceptionReminders.chooseTime')}
                    </AwaText>
                  </View>
                  <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
                </AwaCard>
              ) : null}

              {timePickerVisible ? (
                <DateTimePicker
                  display="default"
                  mode="time"
                  onValueChange={(_event: DateTimePickerChangeEvent, selected?: Date) => {
                    setTimePickerVisible(false);
                    if (selected) {
                      setReminderTime(formatTimeValue(selected));
                      setError('');
                    }
                  }}
                  value={reminderTime ? parseTimeToDate(reminderTime) : new Date()}
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

              {/* The one shared notice (same wording, "open settings" and re-check on every objective's
                  reminders step). Once a save was blocked it also offers "Continue without notifications",
                  which performs the navigation Save would have. */}
              {reminderOn ? (
                <NotificationPermissionNotice
                  onContinue={permissionGuard.saveBlocked ? goToNext : undefined}
                  onRecheck={permissionGuard.refresh}
                  state={permissionGuard.state}
                  testID="contraception-reminders-permission-notice"
                />
              ) : null}
            </>
          ) : (
            // Ring/patch: no daily action to schedule a reminder for, and no
            // predicted next-change date exists anywhere in the app (see
            // contraceptionReminderScheduling.ts) — an honest message
            // instead of a switch that would silently do nothing.
            <View style={styles.info}>
              <View style={styles.infoIconBox}>
                <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={18} />
              </View>
              <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">
                {t('contraceptionReminders.unavailableInfo')}
              </AwaText>
            </View>
          )}

          {supportsDailyReminder ? (
            <View style={styles.info}>
              <View style={styles.infoIconBox}>
                <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={18} />
              </View>
              <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">
                {t('contraceptionReminders.settingsInfo')}
              </AwaText>
            </View>
          ) : null}

          <View style={styles.spacer} />

          <AwaButton
            disabled={saving}
            fullWidth
            label={saving ? t('periodStartSheet.saving') : isEdit ? t('common.save') : t('contraceptionReminders.finish')}
            onPress={handleFinish}
            size="large"
            style={styles.nextButton}
          />
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

    backButton: {alignSelf: 'flex-start', marginBottom: 8},

    header: {alignItems: 'center', marginBottom: 16},

    title: {textAlign: 'center'},
    subtitle: {maxWidth: 320, marginTop: 8, textAlign: 'center'},

    card: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
    cardIcon: {
      width: 40, height: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    cardCopy: {flex: 1, minWidth: 0},
    cardDescription: {marginTop: 4},

    toggleRow: {
      minHeight: 56, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    toggleLabel: {flex: 1, marginRight: 12},

    timeRow: {minHeight: 56, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12},
    timeIconBox: {
      width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    timeCopy: {flex: 1, minWidth: 0},
    timeValue: {marginTop: 2},

    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10,
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.danger, 0.1), borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.3),
    },
    errorText: {flex: 1},

    info: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12,
      borderRadius: 16, backgroundColor: withAlpha(theme.colors.primarySoft, 0.9), paddingHorizontal: 12, paddingVertical: 11,
    },
    infoIconBox: {
      width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.surface,
    },
    infoText: {flex: 1},

    spacer: {flex: 1, minHeight: 16},

    nextButton: {marginTop: 12},
  });
}

export default ContraceptionRemindersScreen;
