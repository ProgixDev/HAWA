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

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {ensureNotificationPermission} from '../services/pregnancyNotifications';
import {
  getCycleReminderPreferences,
  setCycleReminderPreferences,
  type UpcomingPeriodDaysBefore,
} from '../state/cycleReminderPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

// Same 'HH:mm' formatting/parsing convention as
// MenopauseRemindersScreen.tsx's/ContraceptionRemindersScreen.tsx's own
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

const DAYS_BEFORE_OPTIONS: UpcomingPeriodDaysBefore[] = [1, 2, 3];

type Props = NativeStackScreenProps<RootStackParamList, 'CycleReminders'>;

function CycleRemindersScreen({navigation, route}: Props): React.JSX.Element {
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

  const [upcomingPeriodEnabled, setUpcomingPeriodEnabled] = useState(initial.upcomingPeriodEnabled);
  const [upcomingPeriodDaysBefore, setUpcomingPeriodDaysBefore] = useState(initial.upcomingPeriodDaysBefore);
  const [periodStartCheckEnabled, setPeriodStartCheckEnabled] = useState(initial.periodStartCheckEnabled);
  const [dailyJournalEnabled, setDailyJournalEnabled] = useState(initial.dailyJournalEnabled);
  const [dailyJournalTime, setDailyJournalTime] = useState<string | null>(initial.dailyJournalTime);
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
      navigation.navigate('SecuritySetup');
    }
  };

  const handleSave = async () => {
    if (saving) {return;}
    if (dailyJournalEnabled && !dailyJournalTime) {
      setError('Choisis une heure pour ton rappel de journal quotidien.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await setCycleReminderPreferences({
        upcomingPeriodEnabled,
        upcomingPeriodDaysBefore,
        periodStartCheckEnabled,
        dailyJournalEnabled,
        dailyJournalTime,
        fertileWindowEnabled,
        ovulationEnabled,
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
                colors={[theme.colors.surface, theme.colors.surfaceSecondary]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.heroInner}>
                <MaterialDesignIcons color={theme.colors.primary} name="bell-outline" size={30} />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Tes rappels</Text>
            <Text style={styles.subtitle}>
              {isEdit
                ? 'Choisis les rappels qui t’accompagnent dans ton suivi.'
                : 'Choisis les rappels qui peuvent t’accompagner dans ton suivi. Tu pourras les modifier à tout moment depuis ton profil.'}
            </Text>
          </View>

          {/* RÈGLES À VENIR */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="water-outline" size={22} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>Règles à venir</Text>
                <Text style={styles.cardDescription}>
                  Reçois un rappel avant la date estimée de tes prochaines règles.
                </Text>
              </View>
              <Switch
                ios_backgroundColor={theme.colors.primarySoft}
                onValueChange={value => {
                  setUpcomingPeriodEnabled(value);
                  setError('');
                }}
                thumbColor={theme.colors.surface}
                trackColor={{false: theme.colors.primarySoft, true: theme.colors.primary}}
                value={upcomingPeriodEnabled}
              />
            </View>

            {upcomingPeriodEnabled ? (
              <View style={styles.daysBeforeRow}>
                {DAYS_BEFORE_OPTIONS.map(days => {
                  const selected = upcomingPeriodDaysBefore === days;
                  return (
                    <Pressable
                      accessibilityLabel={`${days} jour${days > 1 ? 's' : ''} avant`}
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
                        {days} jour{days > 1 ? 's' : ''} avant
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          {/* SAISIE DU DÉBUT DES RÈGLES */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="calendar-check-outline" size={22} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>Saisie du début des règles</Text>
                <Text style={styles.cardDescription}>
                  Un rappel doux si la date prévue arrive sans qu’un début de règles ait été enregistré.
                </Text>
              </View>
              <Switch
                ios_backgroundColor={theme.colors.primarySoft}
                onValueChange={value => {
                  setPeriodStartCheckEnabled(value);
                  setError('');
                }}
                thumbColor={theme.colors.surface}
                trackColor={{false: theme.colors.primarySoft, true: theme.colors.primary}}
                value={periodStartCheckEnabled}
              />
            </View>
          </View>

          {/* JOURNAL QUOTIDIEN */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="notebook-edit-outline" size={22} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>Journal quotidien</Text>
                <Text style={styles.cardDescription}>Un petit rappel pour compléter ton suivi du jour.</Text>
              </View>
              <Switch
                ios_backgroundColor={theme.colors.primarySoft}
                onValueChange={value => {
                  setDailyJournalEnabled(value);
                  setError('');
                }}
                thumbColor={theme.colors.surface}
                trackColor={{false: theme.colors.primarySoft, true: theme.colors.primary}}
                value={dailyJournalEnabled}
              />
            </View>

            {dailyJournalEnabled ? (
              <Pressable
                accessibilityLabel={dailyJournalTime ? `Heure du rappel, ${dailyJournalTime}` : 'Choisir une heure de rappel'}
                accessibilityRole="button"
                onPress={() => setTimePickerVisible(true)}
                style={({pressed}) => [styles.timeRow, pressed && styles.pressed]}>
                <View style={styles.timeIconBox}>
                  <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={18} />
                </View>
                <View style={styles.timeCopy}>
                  <Text style={styles.timeLabel}>Heure</Text>
                  <Text style={dailyJournalTime ? styles.timeValue : styles.timeValuePlaceholder}>
                    {dailyJournalTime ?? 'Choisir une heure'}
                  </Text>
                </View>
                <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
              </Pressable>
            ) : null}
          </View>

          {/* OVULATION & FENÊTRE FERTILE */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="egg-outline" size={22} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>Ovulation &amp; fenêtre fertile</Text>
                <Text style={styles.cardDescription}>Reçois des rappels basés sur les estimations de ton cycle.</Text>
              </View>
              <Switch
                ios_backgroundColor={theme.colors.primarySoft}
                onValueChange={toggleFertility}
                thumbColor={theme.colors.surface}
                trackColor={{false: theme.colors.primarySoft, true: theme.colors.primary}}
                value={fertilityEnabled}
              />
            </View>

            {fertilityEnabled ? (
              <View style={styles.checkboxList}>
                <Pressable
                  accessibilityLabel="Début estimé de la fenêtre fertile"
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: fertileWindowEnabled}}
                  onPress={() => setFertileWindowEnabled(current => !current)}
                  style={({pressed}) => [styles.checkboxRow, pressed && styles.pressed]}>
                  <View style={[styles.checkbox, fertileWindowEnabled && styles.checkboxChecked]}>
                    {fertileWindowEnabled ? (
                      <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={14} />
                    ) : null}
                  </View>
                  <Text style={styles.checkboxLabel}>Début estimé de la fenêtre fertile</Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Ovulation estimée"
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: ovulationEnabled}}
                  onPress={() => setOvulationEnabled(current => !current)}
                  style={({pressed}) => [styles.checkboxRow, pressed && styles.pressed]}>
                  <View style={[styles.checkbox, ovulationEnabled && styles.checkboxChecked]}>
                    {ovulationEnabled ? (
                      <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={14} />
                    ) : null}
                  </View>
                  <Text style={styles.checkboxLabel}>Ovulation estimée</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

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
              Les dates de règles, de fenêtre fertile et d’ovulation sont des estimations basées sur les
              informations enregistrées dans AWA.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={handleSave}
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
              <Text style={styles.skipText}>Passer</Text>
            </Pressable>
          ) : null}
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

    daysBeforeRow: {flexDirection: 'row', gap: 8, marginTop: 12},
    daysBeforeChip: {
      flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center',
      borderRadius: 13, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.16), backgroundColor: theme.colors.primarySoft,
    },
    daysBeforeChipSelected: {backgroundColor: theme.colors.primary, borderColor: theme.colors.primary},
    daysBeforeChipText: {color: theme.colors.textSecondary, fontSize: 11.5, fontWeight: '700'},
    daysBeforeChipTextSelected: {color: onPrimaryTextColor(theme)},

    timeRow: {
      minHeight: 58, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
    },
    timeIconBox: {
      width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    timeCopy: {flex: 1, minWidth: 0},
    timeLabel: {color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: '700'},
    timeValue: {marginTop: 2, color: theme.colors.text, fontSize: 14, fontWeight: '800'},
    timeValuePlaceholder: {marginTop: 2, color: theme.colors.textMuted, fontSize: 14, fontWeight: '600'},

    checkboxList: {marginTop: 12, gap: 8},
    checkboxRow: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 38},
    checkbox: {
      width: 22, height: 22, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 7, borderWidth: 1.4, borderColor: withAlpha(theme.colors.primary, 0.35), backgroundColor: theme.colors.surface,
    },
    checkboxChecked: {backgroundColor: theme.colors.primary, borderColor: theme.colors.primary},
    checkboxLabel: {flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 12.5, fontWeight: '600'},

    errorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14,
      backgroundColor: withAlpha(theme.colors.danger, 0.1), borderWidth: 1, borderColor: withAlpha(theme.colors.danger, 0.15),
    },
    errorText: {flex: 1, color: theme.colors.danger, fontSize: 11.5, lineHeight: 16},

    info: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16,
      borderRadius: 16, backgroundColor: withAlpha(theme.colors.primarySoft, 0.9), paddingHorizontal: 12, paddingVertical: 11,
    },
    infoIconBox: {
      width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
      borderRadius: 11, backgroundColor: theme.colors.surface,
    },
    infoText: {flex: 1, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},

    nextButton: {
      minHeight: 54, alignItems: 'center', justifyContent: 'center',
      marginTop: 16, borderRadius: 20, backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 7}, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
    },
    nextText: {color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '800', letterSpacing: 0.2},

    skipButton: {minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4},
    skipText: {color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700'},
  });
}

export default CycleRemindersScreen;
