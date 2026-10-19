import React, {useEffect, useMemo, useState} from 'react';
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

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {dateFormatLocale} from '../../utils/cycleMath';
import InlineCalendarPickerModal from '../../components/onboarding/InlineCalendarPickerModal';
import {
  getContraceptionPreferences,
  hydrateContraceptionPreferences,
  setContraceptionPreferences,
  type ContraceptionMethod,
} from '../../state/contraceptionPreferences';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';

type MaterialDesignIconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
const TREATMENT_BREAK_ICON: MaterialDesignIconName = 'clock-outline';

type Props = NativeStackScreenProps<RootStackParamList, 'ContraceptionInformation'>;

const formatFullDate = (date: Date): string =>
  new Intl.DateTimeFormat(dateFormatLocale(), {day: 'numeric', month: 'long', year: 'numeric'}).format(date);

// Local yyyy-mm-dd — never toISOString(), which is UTC-based and can shift
// the calendar day near midnight (see CLAUDE.md's date-key convention).
const localDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function ContraceptionInformationScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const START_DATE_QUESTIONS: Record<ContraceptionMethod, string> = {
    pill: t('contraceptionInformation.startDateQuestions.pill'),
    ring: t('contraceptionInformation.startDateQuestions.ring'),
    patch: t('contraceptionInformation.startDateQuestions.patch'),
    other: t('contraceptionInformation.startDateQuestions.other'),
  };

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

  const question = method ? START_DATE_QUESTIONS[method] : t('contraceptionInformation.startDateQuestions.default');

  // "Non" (false) is a real, valid answer and must never be treated the
  // same as "not yet answered" (null) — check !== null, never `!value`.
  // The pause question only drives the pill schedule. When editing from
  // Profile for a ring/patch/other method it doesn't apply, so it is neither
  // asked nor rewritten (onboarding still asks it for every method, as before).
  const askTreatmentBreak = !(isEdit && method !== null && method !== 'pill');
  const canContinue = startDate !== null && (!askTreatmentBreak || hasTreatmentBreak !== null);

  const handleNext = async () => {
    if (!canContinue || saving) {return;}
    setSaving(true);
    try {
      await setContraceptionPreferences(
        askTreatmentBreak
          ? {methodStartDate: localDateKey(startDate as Date), hasTreatmentBreak}
          : {methodStartDate: localDateKey(startDate as Date)},
      );

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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {isEdit ? (
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              accessibilityRole="button"
              hitSlop={12}
              onPress={navigation.goBack}
              icon="arrow-left"
              style={styles.backButton}
            />
          ) : null}

          <View style={styles.header}>
            <AwaText variant="headlineSmall" style={styles.title}>{t('contraceptionInformation.title')}</AwaText>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.subtitle}>
              {t('contraceptionInformation.subtitle')}
            </AwaText>
          </View>

          <AwaCard style={styles.card} variant="outlined">
            <View style={styles.fieldLabelRow}>
              <View style={styles.fieldIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="calendar-month-outline" size={16} />
              </View>
              <AwaText variant="labelMedium" style={styles.fieldLabel}>{question}</AwaText>
            </View>

            <Pressable
              accessibilityLabel={`${question}, ${startDate ? formatFullDate(startDate) : t('contraceptionInformation.dateNotProvidedAccessibility')}`}
              accessibilityRole="button"
              onPress={() => setPickerVisible(true)}
              style={({pressed}) => [styles.dateField, pressed && styles.pressed]}>
              <Text style={startDate ? styles.dateFieldValue : styles.dateFieldPlaceholder}>
                {startDate ? formatFullDate(startDate) : t('contraceptionInformation.datePlaceholder')}
              </Text>
              <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={20} />
            </Pressable>
          </AwaCard>

          {askTreatmentBreak ? (
          <AwaCard style={[styles.card, styles.cardSpaced]} variant="outlined">
            <View style={styles.fieldLabelRow}>
              <View style={styles.fieldIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name={TREATMENT_BREAK_ICON} size={16} />
              </View>
              <AwaText variant="labelMedium" style={styles.fieldLabel}>
                {t('contraceptionInformation.treatmentBreakQuestion')}
              </AwaText>
            </View>

            <View accessibilityRole="radiogroup" style={styles.choiceRow}>
              {([true, false] as const).map(choiceValue => {
                const selected = hasTreatmentBreak === choiceValue;
                return (
                  <Pressable
                    key={String(choiceValue)}
                    accessibilityLabel={choiceValue ? t('journalIntimacy.yes') : t('journalIntimacy.no')}
                    accessibilityRole="radio"
                    accessibilityState={{checked: selected}}
                    onPress={() => setHasTreatmentBreak(choiceValue)}
                    style={({pressed}) => [
                      styles.choiceOption,
                      selected && styles.choiceOptionSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                      {choiceValue ? t('journalIntimacy.yes') : t('journalIntimacy.no')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </AwaCard>
          ) : null}

          <View style={styles.spacer} />

          <AwaButton
            accessibilityRole="button"
            accessibilityState={{disabled: !canContinue}}
            disabled={!canContinue || saving}
            onPress={handleNext}
            label={saving ? t('periodStartSheet.saving') : isEdit ? t('common.save') : t('common.continue')}
            size="large"
            style={styles.nextButton}
          />
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



    safeArea: {flex: 1},
    content: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
    pressed: {opacity: 0.82},

    backButton: {marginBottom: 5},

    header: {alignItems: 'center', marginBottom: 18},

    title: {textAlign: 'center'},
    subtitle: {maxWidth: 320, marginTop: 8, textAlign: 'center'},

    // AwaCard (outlined) supplies the surface, border, radius and 16 dp padding.
    card: {},
    cardSpaced: {marginTop: 14},
    fieldLabelRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    fieldIcon: {
      width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    fieldLabel: {flex: 1},
    dateField: {
      minHeight: 50, marginTop: 12, flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: theme.colors.surface,
    },
    dateFieldValue: {flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: '700'},
    dateFieldPlaceholder: {flex: 1, color: theme.colors.textMuted, fontSize: 14},

    choiceRow: {marginTop: 12, flexDirection: 'row', gap: 10},
    choiceOption: {
      flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.25, borderColor: theme.colors.border, borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    // DESIGN.md selected state: primaryContainer fill + onSurface text on a primary border; the bolder weight keeps the
    // selection readable without colour alone.
    choiceOptionSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    choiceText: {color: theme.colors.text, fontSize: 14, fontWeight: '500'},
    choiceTextSelected: {fontWeight: '700'},

    spacer: {flex: 1, minHeight: 18},

    nextButton: {marginTop: 12},
  });
}

export default ContraceptionInformationScreen;
