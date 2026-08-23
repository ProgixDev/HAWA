import React, {useState} from 'react';
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
import {
  getContraceptionPreferences,
  setContraceptionPreferences,
} from '../../state/contraceptionPreferences';
import {
  CONTRACEPTION_DEFAULT_REMINDER_CONTENT,
  CONTRACEPTION_METHOD_ICONS,
  CONTRACEPTION_REMINDER_CONTENT,
} from '../../config/contraceptionLabels';

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

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const PURPLE_SOFT = '#F1EAFB';
const TEXT_SECONDARY = '#655A8D';

type Props = NativeStackScreenProps<RootStackParamList, 'ContraceptionReminders'>;

function ContraceptionRemindersScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

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

  const handleFinish = async () => {
    if (saving) {return;}
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
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
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
        <StatusBar backgroundColor="transparent" barStyle="dark-content" hidden={false} translucent />

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
              <MaterialDesignIcons color={PURPLE} name="arrow-left" size={24} />
            </Pressable>
          ) : null}

          <View style={styles.header}>
            <View style={styles.heroIcon}>
              <View pointerEvents="none" style={styles.heroGlowOuter} />
              <View pointerEvents="none" style={styles.heroGlowInner} />
              <LinearGradient
                colors={['#FFFFFF', '#F6F1FB']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.heroInner}>
                <MaterialDesignIcons color={PURPLE} name="bell-outline" size={30} />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Tes rappels</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <MaterialDesignIcons color={PURPLE} name="bell-ring-outline" size={22} />
            </View>

            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{content.cardTitle}</Text>
              <Text style={styles.cardDescription}>{content.cardDescription}</Text>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Activer les rappels</Text>
            <Switch
              ios_backgroundColor="#D9CDEC"
              onValueChange={value => {
                setEnabled(value);
                setError('');
              }}
              thumbColor="#FFFFFF"
              trackColor={{false: '#D9CDEC', true: PURPLE}}
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
                <MaterialDesignIcons color={PURPLE} name="clock-outline" size={18} />
              </View>
              <View style={styles.timeCopy}>
                <Text style={styles.timeLabel}>Heure du rappel</Text>
                <Text style={reminderTime ? styles.timeValue : styles.timeValuePlaceholder}>
                  {reminderTime ?? 'Choisir une heure'}
                </Text>
              </View>
              <MaterialDesignIcons color="#8A7EA8" name="chevron-right" size={20} />
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
              <MaterialDesignIcons color="#C74669" name="alert-outline" size={16} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.info}>
            <View style={styles.infoIconBox}>
              <MaterialDesignIcons color={PURPLE} name="information-outline" size={18} />
            </View>
            <Text style={styles.infoText}>
              Tu pourras modifier ce réglage à tout moment dans les paramètres.
            </Text>
          </View>

          <View pointerEvents="none" style={styles.illustrationRow}>
            <View style={[styles.illustrationBadge, styles.illustrationBadgeBack]}>
              <MaterialDesignIcons color={PURPLE} name={illustrationIcon} size={30} />
            </View>
            <View style={[styles.illustrationBadge, styles.illustrationBadgeFront]}>
              <MaterialDesignIcons color={PURPLE} name="alarm" size={34} />
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

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F2ECF8'},

  pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},

  pageGlowTop: {
    position: 'absolute', top: -150, right: -110, width: 330, height: 330,
    borderRadius: 165, backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },
  pageGlowMiddle: {
    position: 'absolute', top: '38%', left: -130, width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },
  pageGlowBottom: {
    position: 'absolute', bottom: -150, right: -100, width: 310, height: 310,
    borderRadius: 155, backgroundColor: 'rgba(92, 67, 139, 0.05)',
  },

  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
  pressed: {opacity: 0.82},

  backButton: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center',
    marginBottom: 5, borderWidth: 1, borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#493276', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },

  header: {alignItems: 'center', marginBottom: 18},
  heroIcon: {
    position: 'relative', width: 76, height: 76,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroGlowOuter: {position: 'absolute', width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(105,73,190,0.055)'},
  heroGlowInner: {position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(105,73,190,0.07)'},
  heroInner: {
    width: 58, height: 58, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(105,73,190,0.14)', borderRadius: 20,
    shadowColor: '#4E337C', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },

  title: {
    color: PURPLE_DARK, fontFamily: 'serif', fontSize: 26, lineHeight: 32,
    fontWeight: '800', textAlign: 'center',
  },
  subtitle: {
    maxWidth: 320, marginTop: 8, color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19, textAlign: 'center',
  },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 15,
    borderWidth: 1, borderColor: 'rgba(111,83,190,0.14)', borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#4E337C', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
  },
  cardIcon: {
    width: 42, height: 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, backgroundColor: PURPLE_SOFT,
  },
  cardCopy: {flex: 1, minWidth: 0},
  cardTitle: {color: '#291D4E', fontFamily: 'serif', fontSize: 16, lineHeight: 21, fontWeight: '700'},
  cardDescription: {marginTop: 6, color: TEXT_SECONDARY, fontSize: 12, lineHeight: 17},

  toggleRow: {
    minHeight: 58, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(111,83,190,0.14)', borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  toggleLabel: {color: '#291D4E', fontSize: 14, fontWeight: '700'},

  timeRow: {
    minHeight: 58, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(111,83,190,0.14)', borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  timeIconBox: {
    width: 34, height: 34, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: PURPLE_SOFT,
  },
  timeCopy: {flex: 1, minWidth: 0},
  timeLabel: {color: TEXT_SECONDARY, fontSize: 10.5, fontWeight: '700'},
  timeValue: {marginTop: 2, color: '#291D4E', fontSize: 14, fontWeight: '800'},
  timeValuePlaceholder: {marginTop: 2, color: '#948BB0', fontSize: 14, fontWeight: '600'},

  errorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14,
    backgroundColor: '#FFF0F4', borderWidth: 1, borderColor: 'rgba(199,70,105,0.15)',
  },
  errorText: {flex: 1, color: '#98394F', fontSize: 11.5, lineHeight: 16},

  info: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12,
    borderRadius: 16, backgroundColor: 'rgba(246,239,255,0.9)', paddingHorizontal: 12, paddingVertical: 11,
  },
  infoIconBox: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: 11, backgroundColor: '#FFFFFF',
  },
  infoText: {flex: 1, color: TEXT_SECONDARY, fontSize: 11.5, lineHeight: 16},

  illustrationRow: {
    marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  illustrationBadge: {
    width: 78, height: 78, alignItems: 'center', justifyContent: 'center',
    borderRadius: 39, backgroundColor: PURPLE_SOFT,
    borderWidth: 1, borderColor: 'rgba(105,73,190,0.14)',
  },
  illustrationBadgeBack: {opacity: 0.7, marginRight: -18},
  illustrationBadgeFront: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#4E337C', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },

  spacer: {flex: 1, minHeight: 18},

  nextButton: {
    minHeight: 54, alignItems: 'center', justifyContent: 'center',
    marginTop: 12, borderRadius: 20, backgroundColor: PURPLE,
    shadowColor: '#4E319A', shadowOffset: {width: 0, height: 7}, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  nextText: {color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2},
});

export default ContraceptionRemindersScreen;
