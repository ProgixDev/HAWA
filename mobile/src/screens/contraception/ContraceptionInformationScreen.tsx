import React, {useEffect, useMemo, useState} from 'react';
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

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import InlineCalendarPickerModal from '../../components/onboarding/InlineCalendarPickerModal';
import {
  getContraceptionPreferences,
  hydrateContraceptionPreferences,
  setContraceptionPreferences,
  type ContraceptionMethod,
} from '../../state/contraceptionPreferences';

type MaterialDesignIconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
const TREATMENT_BREAK_ICON: MaterialDesignIconName = 'clock-outline';

type Props = NativeStackScreenProps<RootStackParamList, 'ContraceptionInformation'>;

const START_DATE_QUESTIONS: Record<ContraceptionMethod, string> = {
  pill: 'Depuis quand prends-tu la pilule ?',
  ring: 'Depuis quand utilises-tu l’anneau vaginal ?',
  patch: 'Depuis quand utilises-tu le patch contraceptif ?',
  other: 'Depuis quand suis-tu ce traitement ?',
};

const formatFullDate = (date: Date): string =>
  new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);

// Local yyyy-mm-dd — never toISOString(), which is UTC-based and can shift
// the calendar day near midnight (see CLAUDE.md's date-key convention).
const localDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function ContraceptionInformationScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const mode = route.params?.mode ?? 'onboarding';
  const isEdit = mode === 'edit';

  const initial = getContraceptionPreferences();

  const [method, setMethod] = useState<ContraceptionMethod | null>(() => initial.method);
  const [startDate, setStartDate] = useState<Date | null>(
    () => (initial.methodStartDate ? new Date(`${initial.methodStartDate}T12:00:00`) : null),
  );
  const [hasTreatmentBreak, setHasTreatmentBreak] = useState<boolean | null>(
    () => initial.hasTreatmentBreak,
  );
  // The pause answer as it was BEFORE this screen — so an edit-mode save can
  // tell "genuinely changed the answer" apart from "just re-confirmed it."
  // Corrected by the same hydration effect below via the same `current ??
  // value.x` guard used for hasTreatmentBreak itself, so a value already
  // captured here is never overwritten (same reasoning as
  // ContraceptionMethodScreen.tsx's initialMethod).
  const [initialHasTreatmentBreak, setInitialHasTreatmentBreak] = useState<boolean | null>(
    () => initial.hasTreatmentBreak,
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // hydrateContraceptionPreferences() is memoized app-wide (App.tsx already
    // calls it once at boot) — its resolved value is a frozen snapshot from
    // whenever that FIRST call settled, not a fresh read. This was the exact
    // cause of a real bug: an unconditional overwrite here reset `method`
    // (carried over from ContraceptionMethodScreen, never re-selected on this
    // screen) back to null after mount, silently bypassing the pill branch
    // in handleNext below. Only fill in a value that's still unset — never
    // clobber one already correctly captured by the useState initializers
    // above or chosen by the user on this screen. `??` is deliberate (not
    // `||`): `hasTreatmentBreak === false` is a real answer, not "unset".
    hydrateContraceptionPreferences().then(value => {
      setMethod(current => current ?? value.method);
      setStartDate(current => current ?? (value.methodStartDate ? new Date(`${value.methodStartDate}T12:00:00`) : null));
      setHasTreatmentBreak(current => current ?? value.hasTreatmentBreak);
      setInitialHasTreatmentBreak(current => current ?? value.hasTreatmentBreak);
    });
  }, []);

  const question = method ? START_DATE_QUESTIONS[method] : 'Depuis quand utilises-tu cette méthode ?';

  // "Non" (false) is a real, valid answer and must never be treated the
  // same as "not yet answered" (null) — check !== null, never `!value`.
  const canContinue = startDate !== null && hasTreatmentBreak !== null;

  const handleNext = async () => {
    if (!canContinue || saving) {return;}
    setSaving(true);
    try {
      await setContraceptionPreferences({
        methodStartDate: localDateKey(startDate as Date),
        hasTreatmentBreak,
      });

      if (method === 'pill') {
        if (isEdit && hasTreatmentBreak !== initialHasTreatmentBreak) {
          // The pause answer changed for an existing pill user — a
          // previously saved schedule (cyclic/continuous) no longer matches
          // the new answer, so it's cleared here and re-collected via
          // PillScheduleScreen. `.replace`, not `.navigate`, so that
          // screen's own "Enregistrer" -> goBack() still lands back on
          // whatever opened THIS screen, not on this one.
          await setContraceptionPreferences({pillScheduleType: null, activeDays: null, breakDays: null});
          navigation.replace('PillSchedule', {mode: 'edit'});
          return;
        }
        if (isEdit) {
          navigation.goBack();
        } else {
          navigation.navigate('PillSchedule');
        }
        return;
      }

      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.navigate('ContraceptionReminders');
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
          keyboardShouldPersistTaps="handled"
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
                <MaterialDesignIcons color={theme.colors.primary} name="clipboard-text-outline" size={30} />
              </LinearGradient>
            </View>

            <Text style={styles.title}>{'Quelques informations\nsur ta contraception'}</Text>
            <Text style={styles.subtitle}>
              Tes réponses restent privées et nous aident à personnaliser ton suivi.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fieldLabelRow}>
              <View style={styles.fieldIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="calendar-month-outline" size={16} />
              </View>
              <Text style={styles.fieldLabel}>{question}</Text>
            </View>

            <Pressable
              accessibilityLabel={`${question}, ${startDate ? formatFullDate(startDate) : 'non renseignée'}`}
              accessibilityRole="button"
              onPress={() => setPickerVisible(true)}
              style={({pressed}) => [styles.dateField, pressed && styles.pressed]}>
              <Text style={startDate ? styles.dateFieldValue : styles.dateFieldPlaceholder}>
                {startDate ? formatFullDate(startDate) : 'Sélectionner une date'}
              </Text>
              <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
            </Pressable>
          </View>

          <View style={[styles.card, styles.cardSpaced]}>
            <View style={styles.fieldLabelRow}>
              <View style={styles.fieldIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name={TREATMENT_BREAK_ICON} size={16} />
              </View>
              <Text style={styles.fieldLabel}>
                {'As-tu une pause ou une période\nd’arrêt dans ton traitement ?'}
              </Text>
            </View>

            <View accessibilityRole="radiogroup" style={styles.choiceRow}>
              {([true, false] as const).map(choiceValue => {
                const selected = hasTreatmentBreak === choiceValue;
                return (
                  <Pressable
                    key={String(choiceValue)}
                    accessibilityLabel={choiceValue ? 'Oui' : 'Non'}
                    accessibilityRole="radio"
                    accessibilityState={{checked: selected}}
                    onPress={() => setHasTreatmentBreak(choiceValue)}
                    style={({pressed}) => [
                      styles.choiceOption,
                      selected && styles.choiceOptionSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                      {choiceValue ? 'Oui' : 'Non'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.spacer} />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{disabled: !canContinue}}
            disabled={!canContinue || saving}
            onPress={handleNext}
            style={({pressed}) => [
              styles.nextButton,
              (!canContinue || saving) && styles.nextButtonDisabled,
              pressed && canContinue && styles.pressed,
            ]}>
            <Text style={styles.nextText}>
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Continuer'}
            </Text>
          </Pressable>
        </ScrollView>

        <InlineCalendarPickerModal
          maximumDate={new Date()}
          onClose={() => setPickerVisible(false)}
          onSelect={setStartDate}
          value={startDate ?? new Date()}
          visible={pickerVisible}
        />
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
      fontWeight: '800', textAlign: 'center',
    },
    subtitle: {
      maxWidth: 320, marginTop: 8, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center',
    },

    card: {
      padding: 15, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20,
      backgroundColor: withAlpha(theme.colors.surface, 0.9),
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
    },
    cardSpaced: {marginTop: 14},
    fieldLabelRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    fieldIcon: {
      width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
      borderRadius: 10, backgroundColor: theme.colors.primarySoft,
    },
    fieldLabel: {flex: 1, color: theme.colors.text, fontSize: 13.5, fontWeight: '700', lineHeight: 18},
    dateField: {
      minHeight: 50, marginTop: 12, flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, backgroundColor: theme.colors.surface,
    },
    dateFieldValue: {flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '700'},
    dateFieldPlaceholder: {flex: 1, color: theme.colors.textMuted, fontSize: 14},

    choiceRow: {marginTop: 12, flexDirection: 'row', gap: 10},
    choiceOption: {
      flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.25, borderColor: withAlpha(theme.colors.primary, 0.20), borderRadius: 15,
      backgroundColor: theme.colors.primarySoft,
    },
    choiceOptionSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primary},
    choiceText: {color: theme.colors.text, fontSize: 14, fontWeight: '700'},
    choiceTextSelected: {color: onPrimaryTextColor(theme)},

    spacer: {flex: 1, minHeight: 18},

    nextButton: {
      minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, marginTop: 12, borderRadius: 20, backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 7}, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
    },
    nextButtonDisabled: {opacity: 0.5, elevation: 0, shadowOpacity: 0},
    nextText: {color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '800', letterSpacing: 0.2},
  });
}

export default ContraceptionInformationScreen;
