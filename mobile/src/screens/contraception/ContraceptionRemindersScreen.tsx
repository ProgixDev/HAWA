import React, {useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
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
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {
  getContraceptionPreferences,
  setContraceptionPreferences,
} from '../../state/contraceptionPreferences';
import {
  CONTRACEPTION_DEFAULT_REMINDER_CONTENT,
  CONTRACEPTION_METHOD_ICONS,
  CONTRACEPTION_REMINDER_CONTENT,
} from '../../config/contraceptionLabels';
import {contraceptionMethodSupportsDailyReminder} from '../../utils/contraceptionReminderScheduling';

// Same 'HH:mm' formatting/parsing convention as
// PregnancyNotificationsScreen.tsx's dailyJournalTime field — kept local
// (not exported) since it's pure UI display formatting, exactly like that
// screen's own un-exported helpers.
function formatTimeValue(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit', hour12: false}).format(date);
}
function parseTimeToDate(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

type Props = NativeStackScreenProps<RootStackParamList, 'ContraceptionReminders'>;

function ContraceptionRemindersScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
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
  const [reminderTime, setReminderTime] = useState<string | null>(
    () => getContraceptionPreferences().reminderTime,
  );
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const content = method
    ? CONTRACEPTION_REMINDER_CONTENT[method]
    : CONTRACEPTION_DEFAULT_REMINDER_CONTENT;
  const illustrationIcon = method ? CONTRACEPTION_METHOD_ICONS[method] : 'pill';

  // 'ring'/'patch' have no daily action to remind about — see
  // contraceptionReminderScheduling.ts's own comment on why no schedule is
  // invented for them. Only 'pill'/'other' (and the no-method-yet default)
  // get the enable/time controls, so this screen never promises a reminder
  // the scheduler wouldn't actually set.
  const supportsDailyReminder = contraceptionMethodSupportsDailyReminder(method) || method === null;

  const handleFinish = async () => {
    if (saving) {return;}
    if (!supportsDailyReminder) {
      // Nothing editable for this method — just leave.
      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.navigate('SecuritySetup');
      }
      return;
    }
    // Never persist "enabled" without a real, user-chosen time — no
    // fallback hour is invented here; she must explicitly pick one.
    if (enabled && !reminderTime) {
      setError('Choisis une heure pour activer les rappels.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      // reminderTime is kept even when disabling — re-enabling later should
      // not silently lose a previously chosen time.
      await setContraceptionPreferences({remindersEnabled: enabled, reminderTime});
      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.navigate('SecuritySetup');
      }
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
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} hidden={false} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.md},
          ]}
          showsVerticalScrollIndicator={false}>
          {isEdit ? (
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={12}
              onPress={navigation.goBack}
              style={({pressed}) => [styles.backButton, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="arrow-left" size={24} />
            </Pressable>
          ) : null}

          <View style={styles.header}>
            <View style={styles.heroIcon}>
              <View pointerEvents="none" style={styles.heroGlowOuter} />
              <View pointerEvents="none" style={styles.heroGlowInner} />
              <LinearGradient
                colors={[theme.colors.surface, theme.colors.primarySoft]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.heroInner}>
                <MaterialDesignIcons color={theme.colors.primary} name="bell-outline" size={30} />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Tes rappels</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="bell-ring-outline" size={22} />
            </View>

            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{content.cardTitle}</Text>
              <Text style={styles.cardDescription}>{content.cardDescription}</Text>
            </View>
          </View>

          {supportsDailyReminder ? (
            <>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Activer les rappels</Text>
                <Switch
                  ios_backgroundColor={theme.colors.surfaceSecondary}
                  onValueChange={value => {
                    setEnabled(value);
                    setError('');
                  }}
                  thumbColor="#FFFFFF"
                  trackColor={{false: theme.colors.surfaceSecondary, true: theme.colors.primary}}
                  value={enabled}
                />
              </View>

              {enabled ? (
                <Pressable
                  accessibilityLabel={reminderTime ? `Heure du rappel, ${reminderTime}` : 'Choisir une heure de rappel'}
                  accessibilityRole="button"
                  onPress={() => setTimePickerVisible(true)}
                  style={({pressed}) => [styles.timeRow, pressed && styles.pressed]}>
                  <View style={styles.timeIconBox}>
                    <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={18} />
                  </View>
                  <View style={styles.timeCopy}>
                    <Text style={styles.timeLabel}>Heure du rappel</Text>
                    <Text style={reminderTime ? styles.timeValue : styles.timeValuePlaceholder}>
                      {reminderTime ?? 'Choisir une heure'}
                    </Text>
                  </View>
                  <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
                </Pressable>
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
                  <Text style={styles.errorText}>{error}</Text>
                </View>
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
              <Text style={styles.infoText}>
                Les rappels programmés ne sont pas encore disponibles pour cette méthode. Tu peux
                enregistrer tes utilisations directement depuis le tableau de bord.
              </Text>
            </View>
          )}

          {supportsDailyReminder ? (
            <View style={styles.info}>
              <View style={styles.infoIconBox}>
                <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={18} />
              </View>
              <Text style={styles.infoText}>
                Tu pourras modifier ce réglage à tout moment dans les paramètres.
              </Text>
            </View>
          ) : null}

          <View pointerEvents="none" style={styles.illustrationRow}>
            <View style={[styles.illustrationBadge, styles.illustrationBadgeBack]}>
              <MaterialDesignIcons color={theme.colors.primary} name={illustrationIcon} size={30} />
            </View>
            <View style={[styles.illustrationBadge, styles.illustrationBadgeFront]}>
              <MaterialDesignIcons color={theme.colors.primary} name="alarm" size={34} />
            </View>
          </View>

          <View style={styles.spacer} />

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={handleFinish}
            style={({pressed}) => [styles.nextButton, (pressed || saving) && styles.pressed]}>
            <Text style={styles.nextText}>
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Terminer'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {flex: 1, backgroundColor: theme.colors.background},

    pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},

    pageGlowTop: {
      position: 'absolute', top: -150, right: -110, width: 330, height: 330,
      borderRadius: 165, backgroundColor: withAlpha(theme.colors.primary, 0.07),
    },
    pageGlowMiddle: {
      position: 'absolute', top: '38%', left: -130, width: 260, height: 260,
      borderRadius: 130, backgroundColor: withAlpha(theme.colors.primary, 0.045),
    },
    pageGlowBottom: {
      position: 'absolute', bottom: -150, right: -100, width: 310, height: 310,
      borderRadius: 155, backgroundColor: withAlpha(theme.colors.primary, 0.05),
    },

    safeArea: {flex: 1},
    content: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
    pressed: {opacity: 0.82},

    backButton: {
      width: 42, height: 42, alignItems: 'center', justifyContent: 'center',
      marginBottom: 5, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.08),
      borderRadius: 16, backgroundColor: withAlpha(theme.colors.surface, 0.88),
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },

    header: {alignItems: 'center', marginBottom: 18},
    heroIcon: {
      position: 'relative', width: 76, height: 76,
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    heroGlowOuter: {position: 'absolute', width: 82, height: 82, borderRadius: 41, backgroundColor: withAlpha(theme.colors.primary, 0.055)},
    heroGlowInner: {position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: withAlpha(theme.colors.primary, 0.07)},
    heroInner: {
      width: 58, height: 58, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20,
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
    },

    title: {
      color: theme.colors.text, fontFamily: 'serif', fontSize: 26, lineHeight: 32,
      fontWeight: '800', textAlign: 'center',
    },
    subtitle: {
      maxWidth: 320, marginTop: 8, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center',
    },

    card: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 15,
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20,
      backgroundColor: withAlpha(theme.colors.surface, 0.92),
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
    },
    cardIcon: {
      width: 42, height: 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 14, backgroundColor: theme.colors.primarySoft,
    },
    cardCopy: {flex: 1, minWidth: 0},
    cardTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 16, lineHeight: 21, fontWeight: '700'},
    cardDescription: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},

    toggleRow: {
      minHeight: 58, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18,
      backgroundColor: withAlpha(theme.colors.surface, 0.92),
    },
    toggleLabel: {color: theme.colors.text, fontSize: 14, fontWeight: '700'},

    timeRow: {
      minHeight: 58, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18,
      backgroundColor: withAlpha(theme.colors.surface, 0.92),
    },
    timeIconBox: {
      width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    timeCopy: {flex: 1, minWidth: 0},
    timeLabel: {color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: '700'},
    timeValue: {marginTop: 2, color: theme.colors.text, fontSize: 14, fontWeight: '800'},
    timeValuePlaceholder: {marginTop: 2, color: theme.colors.textMuted, fontSize: 14, fontWeight: '600'},

    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10,
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14,
      backgroundColor: withAlpha(theme.colors.danger, 0.1), borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.3),
    },
    errorText: {flex: 1, color: theme.colors.danger, fontSize: 11.5, lineHeight: 16},

    info: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12,
      borderRadius: 16, backgroundColor: withAlpha(theme.colors.primarySoft, 0.9), paddingHorizontal: 12, paddingVertical: 11,
    },
    infoIconBox: {
      width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
      borderRadius: 11, backgroundColor: theme.colors.surface,
    },
    infoText: {flex: 1, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},

    illustrationRow: {
      marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    },
    illustrationBadge: {
      width: 78, height: 78, alignItems: 'center', justifyContent: 'center',
      borderRadius: 39, backgroundColor: theme.colors.primarySoft,
      borderWidth: 1, borderColor: theme.colors.border,
    },
    illustrationBadgeBack: {opacity: 0.7, marginRight: -18},
    illustrationBadgeFront: {
      backgroundColor: theme.colors.surface,
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
    },

    spacer: {flex: 1, minHeight: 18},

    nextButton: {
      minHeight: 54, alignItems: 'center', justifyContent: 'center',
      marginTop: 12, borderRadius: 20, backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 7}, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
    },
    nextText: {color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '800', letterSpacing: 0.2},
  });
}

export default ContraceptionRemindersScreen;
