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
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {ensureNotificationPermission} from '../services/pregnancyNotifications';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {
  getMenopausePreferences,
  setMenopauseReminderPreferences,
} from '../state/menopausePreferences';

// Same 'HH:mm' formatting/parsing convention as
// ContraceptionRemindersScreen.tsx's/PregnancyNotificationsScreen.tsx's own
// un-exported helpers — kept local since it's pure UI display formatting.
function formatTimeValue(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit', hour12: false}).format(date);
}
function parseTimeToDate(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

type Props = NativeStackScreenProps<RootStackParamList, 'MenopauseReminders'>;

type TimePickerTarget = 'daily' | 'treatment' | null;

function MenopauseRemindersScreen({navigation, route}: Props): React.JSX.Element {
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
  const [dailyTime, setDailyTime] = useState<string | null>(
    () => getMenopausePreferences().dailyTrackingReminderTime,
  );
  const [treatmentEnabled, setTreatmentEnabled] = useState(
    () => getMenopausePreferences().treatmentReminderEnabled,
  );
  const [treatmentTime, setTreatmentTime] = useState<string | null>(
    () => getMenopausePreferences().treatmentReminderTime,
  );

  const [timePickerTarget, setTimePickerTarget] = useState<TimePickerTarget>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [permissionNotice, setPermissionNotice] = useState(false);

  const goToNext = () => {
    if (isEdit) {
      navigation.goBack();
    } else {
      navigation.navigate('SecuritySetup');
    }
  };

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
      // confirmed enabled — never merely for opening this screen.
      if (values.dailyTrackingReminderEnabled || values.treatmentReminderEnabled) {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          setPermissionNotice(true);
        }
      }

      goToNext();
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (saving) {return;}
    // Never persist "enabled" without a real, user-chosen time — no
    // fallback hour is invented here; she must explicitly pick one.
    if (dailyEnabled && !dailyTime) {
      setError('Choisis une heure pour ton rappel de suivi quotidien.');
      return;
    }
    if (showTreatmentCard && treatmentEnabled && !treatmentTime) {
      setError('Choisis une heure pour ton rappel de traitement.');
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
      accessibilityLabel={time ? `Heure du rappel, ${time}` : 'Choisir une heure de rappel'}
      accessibilityRole="button"
      onPress={() => setTimePickerTarget(target)}
      style={({pressed}) => [editStyles.timeRow, pressed && editStyles.pressed]}>
      <Text style={editStyles.timeRowLabel}>Heure</Text>
      <View style={editStyles.timeRowValueGroup}>
        <Text style={time ? editStyles.timeValue : editStyles.timeValuePlaceholder}>
          {time ?? 'Choisir'}
        </Text>
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
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={10}
              onPress={navigation.goBack}
              style={({pressed}) => [editStyles.back, pressed && editStyles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={26} />
            </Pressable>
            <View style={editStyles.headerCopy}>
              <Text style={editStyles.title}>Notifications &amp; rappels</Text>
              <Text style={editStyles.subtitle}>
                {showTreatmentCard
                  ? 'Gère ton rappel de suivi quotidien et ton rappel de traitement.'
                  : 'Gère ton rappel de suivi quotidien.'}
              </Text>
            </View>
          </View>

          <View style={editStyles.card}>
            <View style={[editStyles.group, showTreatmentCard && editStyles.groupBorder]}>
              <View style={editStyles.row}>
                <View style={editStyles.rowIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="notebook-edit-outline" size={18} />
                </View>
                <View style={editStyles.rowCopy}>
                  <Text style={editStyles.rowTitle}>Suivi quotidien</Text>
                  <Text style={editStyles.rowSubtitle}>Un rappel pour compléter ton suivi du jour.</Text>
                </View>
                <Switch
                  accessibilityLabel="Suivi quotidien"
                  ios_backgroundColor={theme.colors.primarySoft}
                  onValueChange={value => {
                    setDailyEnabled(value);
                    setError('');
                  }}
                  thumbColor={theme.colors.surface}
                  trackColor={{false: theme.colors.primarySoft, true: theme.colors.primary}}
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
                    <Text style={editStyles.rowTitle}>Traitement hormonal</Text>
                    <Text style={editStyles.rowSubtitle}>Un rappel pour ne pas oublier ton traitement.</Text>
                  </View>
                  <Switch
                    accessibilityLabel="Traitement hormonal"
                    ios_backgroundColor={theme.colors.primarySoft}
                    onValueChange={value => {
                      setTreatmentEnabled(value);
                      setError('');
                    }}
                    thumbColor={theme.colors.surface}
                    trackColor={{false: theme.colors.primarySoft, true: theme.colors.primary}}
                    value={treatmentEnabled}
                  />
                </View>
                {treatmentEnabled ? renderTimeRow('treatment', treatmentTime) : null}
              </View>
            ) : null}
          </View>

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
              <Text style={editStyles.errorText}>{error}</Text>
            </View>
          ) : null}

          {permissionNotice ? (
            <View accessibilityRole="alert" style={editStyles.errorCard}>
              <MaterialDesignIcons color={theme.colors.danger} name="bell-off-outline" size={16} />
              <Text style={editStyles.errorText}>
                Active les notifications dans les réglages de ton téléphone pour recevoir tes rappels.
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={handleContinue}
            style={({pressed}) => [editStyles.saveButton, (pressed || saving) && editStyles.pressed]}>
            <Text style={editStyles.saveButtonText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
          </Pressable>
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
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

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

            <Text style={styles.title}>Rester régulière dans mon suivi</Text>
            <Text style={styles.subtitle}>
              Active seulement les rappels qui te sont utiles. Tu pourras les modifier plus tard.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="notebook-edit-outline" size={22} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>Rappel du suivi quotidien</Text>
                <Text style={styles.cardDescription}>Un petit rappel pour compléter ton suivi du jour.</Text>
              </View>
              <Switch
                ios_backgroundColor={theme.colors.primarySoft}
                onValueChange={value => {
                  setDailyEnabled(value);
                  setError('');
                }}
                thumbColor={theme.colors.surface}
                trackColor={{false: theme.colors.primarySoft, true: theme.colors.primary}}
                value={dailyEnabled}
              />
            </View>

            {dailyEnabled ? (
              <Pressable
                accessibilityLabel={dailyTime ? `Heure du rappel, ${dailyTime}` : 'Choisir une heure de rappel'}
                accessibilityRole="button"
                onPress={() => setTimePickerTarget('daily')}
                style={({pressed}) => [styles.timeRow, pressed && styles.pressed]}>
                <View style={styles.timeIconBox}>
                  <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={18} />
                </View>
                <View style={styles.timeCopy}>
                  <Text style={styles.timeLabel}>À quelle heure souhaites-tu être rappelée ?</Text>
                  <Text style={dailyTime ? styles.timeValue : styles.timeValuePlaceholder}>
                    {dailyTime ?? 'Choisir une heure'}
                  </Text>
                </View>
                <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
              </Pressable>
            ) : null}
          </View>

          {showTreatmentCard ? (
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="pill" size={22} />
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Rappel de traitement</Text>
                  <Text style={styles.cardDescription}>Si tu le souhaites, AWA peut te rappeler ton traitement.</Text>
                </View>
                <Switch
                  ios_backgroundColor={theme.colors.primarySoft}
                  onValueChange={value => {
                    setTreatmentEnabled(value);
                    setError('');
                  }}
                  thumbColor={theme.colors.surface}
                  trackColor={{false: theme.colors.primarySoft, true: theme.colors.primary}}
                  value={treatmentEnabled}
                />
              </View>

              {treatmentEnabled ? (
                <Pressable
                  accessibilityLabel={treatmentTime ? `Heure du rappel, ${treatmentTime}` : 'Choisir une heure de rappel'}
                  accessibilityRole="button"
                  onPress={() => setTimePickerTarget('treatment')}
                  style={({pressed}) => [styles.timeRow, pressed && styles.pressed]}>
                  <View style={styles.timeIconBox}>
                    <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={18} />
                  </View>
                  <View style={styles.timeCopy}>
                    <Text style={styles.timeLabel}>À quelle heure souhaites-tu être rappelée ?</Text>
                    <Text style={treatmentTime ? styles.timeValue : styles.timeValuePlaceholder}>
                      {treatmentTime ?? 'Choisir une heure'}
                    </Text>
                  </View>
                  <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
                </Pressable>
              ) : null}
            </View>
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
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {permissionNotice ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <MaterialDesignIcons color={theme.colors.danger} name="bell-off-outline" size={16} />
              <Text style={styles.errorText}>
                Active les notifications dans les réglages de ton téléphone pour recevoir tes rappels.
              </Text>
            </View>
          ) : null}

          <View style={styles.info}>
            <View style={styles.infoIconBox}>
              <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={18} />
            </View>
            <Text style={styles.infoText}>
              Tu pourras modifier ces réglages à tout moment dans tes préférences.
            </Text>
          </View>

          <View style={styles.spacer} />

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={handleContinue}
            style={({pressed}) => [styles.nextButton, (pressed || saving) && styles.pressed]}>
            <Text style={styles.nextText}>
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Continuer'}
            </Text>
          </Pressable>

          {!isEdit ? (
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={handleSkip}
              style={({pressed}) => [styles.skipButton, pressed && styles.pressed]}>
              <Text style={styles.skipText}>Pas maintenant</Text>
            </Pressable>
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
    back: {
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface,
      elevation: 2, shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.08, shadowRadius: 6,
    },
    headerCopy: {flex: 1, minWidth: 0, marginLeft: 12, paddingTop: 6},
    title: {color: theme.colors.text, fontFamily: 'serif', fontSize: 21, fontWeight: '700'},
    subtitle: {marginTop: 5, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 17},

    card: {
      overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20,
      backgroundColor: theme.colors.surface, paddingHorizontal: 12,
    },
    group: {paddingVertical: 4},
    groupBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border},
    row: {minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 11},
    rowIcon: {
      width: 38, height: 38, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 13, backgroundColor: theme.colors.primarySoft,
    },
    rowCopy: {flex: 1, minWidth: 0},
    rowTitle: {color: theme.colors.text, fontSize: 13.5, fontWeight: '700'},
    rowSubtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 15.5},

    timeRow: {
      minHeight: 44, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    timeRowLabel: {color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700'},
    timeRowValueGroup: {flexDirection: 'row', alignItems: 'center', gap: 4},
    timeValue: {color: theme.colors.text, fontSize: 14, fontWeight: '800'},
    timeValuePlaceholder: {color: theme.colors.textMuted, fontSize: 14, fontWeight: '600'},

    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 12,
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14,
      backgroundColor: withAlpha(theme.colors.danger, 0.1), borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.3),
    },
    errorText: {flex: 1, color: theme.colors.danger, fontSize: 11.5, lineHeight: 16},

    saveButton: {
      minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 6,
      borderRadius: 18, backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
    },
    saveButtonText: {color: onPrimaryTextColor(theme), fontSize: 15.5, fontWeight: '800'},
  });
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
      color: theme.colors.text, fontFamily: 'serif', fontSize: 24, lineHeight: 30,
      fontWeight: '800', textAlign: 'center', paddingHorizontal: 8,
    },
    subtitle: {
      maxWidth: 320, marginTop: 8, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center',
    },

    card: {
      marginTop: 14, padding: 15,
      borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20,
      backgroundColor: withAlpha(theme.colors.surface, 0.92),
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
    },
    cardTopRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
    cardIcon: {
      width: 42, height: 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 14, backgroundColor: theme.colors.primarySoft,
    },
    cardCopy: {flex: 1, minWidth: 0},
    cardTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 15.5, lineHeight: 20, fontWeight: '700'},
    cardDescription: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},

    timeRow: {
      minHeight: 58, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    timeIconBox: {
      width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    timeCopy: {flex: 1, minWidth: 0},
    timeLabel: {color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: '700', lineHeight: 14},
    timeValue: {marginTop: 3, color: theme.colors.text, fontSize: 14, fontWeight: '800'},
    timeValuePlaceholder: {marginTop: 3, color: theme.colors.textMuted, fontSize: 14, fontWeight: '600'},

    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14,
      backgroundColor: withAlpha(theme.colors.danger, 0.1), borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.3),
    },
    errorText: {flex: 1, color: theme.colors.danger, fontSize: 11.5, lineHeight: 16},

    info: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14,
      borderRadius: 16, backgroundColor: withAlpha(theme.colors.primarySoft, 0.9), paddingHorizontal: 12, paddingVertical: 11,
    },
    infoIconBox: {
      width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
      borderRadius: 11, backgroundColor: theme.colors.surface,
    },
    infoText: {flex: 1, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},

    spacer: {flex: 1, minHeight: 14},

    nextButton: {
      minHeight: 54, alignItems: 'center', justifyContent: 'center',
      marginTop: 12, borderRadius: 20, backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 7}, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
    },
    nextText: {color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '800', letterSpacing: 0.2},

    skipButton: {minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4},
    skipText: {color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700'},
  });
}

export default MenopauseRemindersScreen;
