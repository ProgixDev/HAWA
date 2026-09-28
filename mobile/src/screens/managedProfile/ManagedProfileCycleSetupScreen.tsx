import React, {useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import AwaADeuxStepLayout, {Reveal} from '../awaADeux/AwaADeuxStepLayout';
import InlineCalendarPickerModal from '../../components/onboarding/InlineCalendarPickerModal';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {getManagedProfileDraft, updateManagedProfileDraft, clearManagedProfileDraft} from '../../state/managedProfileDraftStore';
import {addManagedProfile} from '../../state/managedProfilesStore';
import type {CycleRegularity} from '../../state/onboardingPreferences';

// Step 3/4 — "Informations sur son cycle" (ONLY reached when "Oui" was answered on
// the previous step). Duration RANGES are the same ones the mother's own cycle
// onboarding uses (CycleInformationScreen.tsx: PERIOD_DURATIONS 2–10 days,
// CYCLE_DURATIONS 20–40 days) — never a different/invented range for a daughter.
// The stepper WIDGET itself follows QadaaManualEntryModal.tsx's [-] N [+] pattern.
//
// Regularity: the SAME canonical 'yes'/'no'/'unknown' CycleRegularity
// (onboardingPreferences.ts) every other regularity UI in AWA already uses
// (CycleInformationScreen.tsx's own onboarding step, ProfileScreen.tsx's
// daughter "Régularité du cycle" editor) — never a second representation.
// Defaults to 'unknown' unless the draft already has a real value (e.g. Back
// navigation) — NEVER inferred from cycleLength/periodLength/age/lastPeriodDate
// (a 28-day cycle does not itself establish regularity; see CLAUDE.md §5).

type Props = NativeStackScreenProps<RootStackParamList, 'ManagedProfileCycleSetup'>;

const PERIOD_LENGTH_MIN = 2;
const PERIOD_LENGTH_MAX = 10;
const CYCLE_LENGTH_MIN = 20;
const CYCLE_LENGTH_MAX = 40;
const DEFAULT_PERIOD_LENGTH = 5;
const DEFAULT_CYCLE_LENGTH = 28;

export default function ManagedProfileCycleSetupScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const draft = getManagedProfileDraft();

  const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(draft.lastPeriodDate);
  const [periodLength, setPeriodLength] = useState(draft.periodLength ?? DEFAULT_PERIOD_LENGTH);
  const [cycleLength, setCycleLength] = useState(draft.cycleLength ?? DEFAULT_CYCLE_LENGTH);
  const [regularity, setRegularity] = useState<CycleRegularity>(draft.regularity ?? 'unknown');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  const canContinue = lastPeriodDate !== null && !!draft.firstName && !!draft.birthDate;

  const onCreate = async () => {
    if (!canContinue || creating || !lastPeriodDate || !draft.firstName || !draft.birthDate) {return;}
    setCreating(true);
    try {
      updateManagedProfileDraft({lastPeriodDate, periodLength, cycleLength, regularity});
      const profile = await addManagedProfile({
        type: 'daughter',
        firstName: draft.firstName,
        birthDate: draft.birthDate.toLocaleDateString('en-CA'),
        hasHadFirstPeriod: true,
        lastPeriodDate: lastPeriodDate.toLocaleDateString('en-CA'),
        periodLength,
        cycleLength,
        regularity,
        profileImageUri: draft.profileImageUri,
      });
      clearManagedProfileDraft();
      navigation.replace('ManagedProfileSuccess', {firstName: profile.firstName, profileId: profile.id});
    } finally {
      setCreating(false);
    }
  };

  return (
    <AwaADeuxStepLayout
      ctaLabel={creating ? 'Création…' : 'Créer le profil'}
      description="Vous pourrez les modifier plus tard à tout moment."
      onBack={navigation.goBack}
      onContinue={canContinue && !creating ? onCreate : undefined}
      title="Informations sur son cycle">
      <Reveal index={0}>
        <Pressable
          accessibilityLabel="Date des dernières règles"
          accessibilityRole="button"
          onPress={() => setDatePickerVisible(true)}
          style={({pressed}) => [styles.fieldCard, pressed && styles.pressed]}>
          <Text style={styles.label}>Date des dernières règles</Text>
          <View style={styles.dateRow}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-blank-outline" size={18} />
            <Text style={[styles.dateText, !lastPeriodDate && styles.datePlaceholder]}>
              {lastPeriodDate
                ? new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: 'long', year: 'numeric'}).format(lastPeriodDate)
                : 'Sélectionner une date'}
            </Text>
          </View>
        </Pressable>
      </Reveal>

      <Reveal index={1}>
        <View style={styles.fieldCard}>
          <Text style={styles.label}>Durée habituelle des règles</Text>
          <DurationStepper
            max={PERIOD_LENGTH_MAX}
            min={PERIOD_LENGTH_MIN}
            onChange={setPeriodLength}
            styles={styles}
            theme={theme}
            unit="jours"
            value={periodLength}
          />
        </View>
      </Reveal>

      <Reveal index={2}>
        <View style={styles.fieldCard}>
          <Text style={styles.label}>Durée habituelle du cycle</Text>
          <DurationStepper
            max={CYCLE_LENGTH_MAX}
            min={CYCLE_LENGTH_MIN}
            onChange={setCycleLength}
            styles={styles}
            theme={theme}
            unit="jours"
            value={cycleLength}
          />
        </View>
      </Reveal>

      <Reveal index={3}>
        <View style={styles.fieldCard}>
          <Text style={styles.label}>Régularité du cycle</Text>
          <View accessibilityRole="radiogroup" style={styles.regularityRow}>
            {(
              [
                {id: 'yes' as const, label: 'Régulier'},
                {id: 'no' as const, label: 'Irrégulier'},
                {id: 'unknown' as const, label: 'Je ne sais pas'},
              ]
            ).map(option => {
              const selected = regularity === option.id;
              return (
                <Pressable
                  accessibilityLabel={option.label}
                  accessibilityRole="radio"
                  accessibilityState={{checked: selected}}
                  key={option.id}
                  onPress={() => setRegularity(option.id)}
                  style={({pressed}) => [styles.regularityOption, selected && styles.regularitySelected, pressed && styles.pressed]}>
                  <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={[styles.regularityText, selected && styles.regularityTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Reveal>

      <Reveal index={4}>
        <View style={styles.helperCard}>
          <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={18} />
          <Text style={styles.helperText}>Ces informations pourront être modifiées plus tard.</Text>
        </View>
      </Reveal>

      {creating ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : null}

      <InlineCalendarPickerModal
        maximumDate={new Date()}
        minimumDate={draft.birthDate ?? undefined}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setLastPeriodDate}
        subtitle="Cette date ne peut pas être dans le futur."
        title="Date des dernières règles"
        value={lastPeriodDate ?? new Date()}
        visible={datePickerVisible}
      />
    </AwaADeuxStepLayout>
  );
}

function DurationStepper({
  value,
  min,
  max,
  unit,
  onChange,
  styles,
  theme,
}: {
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
  styles: ReturnType<typeof createStyles>;
  theme: ResolvedAwaTheme;
}): React.JSX.Element {
  const canDecrease = value > min;
  const canIncrease = value < max;
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityLabel="Diminuer"
        accessibilityRole="button"
        accessibilityState={{disabled: !canDecrease}}
        disabled={!canDecrease}
        hitSlop={4}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={({pressed}) => [styles.stepperButton, !canDecrease && styles.stepperButtonDisabled, pressed && styles.pressed]}>
        <MaterialDesignIcons color={theme.colors.primary} name="minus" size={20} />
      </Pressable>
      <View style={styles.stepperValueBox}>
        <Text style={styles.stepperValue}>{value} {unit}</Text>
      </View>
      <Pressable
        accessibilityLabel="Augmenter"
        accessibilityRole="button"
        accessibilityState={{disabled: !canIncrease}}
        disabled={!canIncrease}
        hitSlop={4}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={({pressed}) => [styles.stepperButton, !canIncrease && styles.stepperButtonDisabled, pressed && styles.pressed]}>
        <MaterialDesignIcons color={theme.colors.primary} name="plus" size={20} />
      </Pressable>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    fieldCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      padding: 16,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    label: {marginBottom: 10, color: theme.colors.text, fontSize: 14.5, fontWeight: '700'},
    dateRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
    dateText: {color: theme.colors.text, fontSize: 15, fontWeight: '600'},
    datePlaceholder: {color: theme.colors.textMuted, fontWeight: '400'},
    stepper: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 16,
      borderWidth: 1.4,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 6,
    },
    stepperButton: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
    stepperButtonDisabled: {opacity: 0.35},
    stepperValueBox: {flex: 1, alignItems: 'center'},
    stepperValue: {color: theme.colors.text, fontSize: 16, fontWeight: '700'},
    // Same shape/values as CycleInformationScreen.tsx's own regularity chips
    // (the mother's own onboarding) — never a new visual pattern for this choice.
    regularityRow: {flexDirection: 'row', gap: 8},
    regularityOption: {
      minHeight: 48,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.25,
      borderColor: withAlpha(theme.colors.primary, 0.22),
      borderRadius: 15,
      backgroundColor: withAlpha(theme.colors.surface, 0.92),
      paddingHorizontal: 5,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.035,
      shadowRadius: 5,
      elevation: 1,
    },
    regularitySelected: {
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.10,
      shadowRadius: 7,
      elevation: 2,
    },
    regularityText: {color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600', textAlign: 'center'},
    regularityTextSelected: {color: theme.colors.primary, fontWeight: '700'},
    helperCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    helperText: {flex: 1, color: theme.colors.primary, fontSize: 12.5, lineHeight: 18, fontWeight: '600'},
    pressed: {opacity: 0.86},
    loadingRow: {marginTop: 6, alignItems: 'center'},
  });
}
