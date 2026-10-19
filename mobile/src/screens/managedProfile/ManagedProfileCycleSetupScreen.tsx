import React, {useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import AwaADeuxStepLayout, {Reveal} from '../awaADeux/AwaADeuxStepLayout';
import InlineCalendarPickerModal from '../../components/onboarding/InlineCalendarPickerModal';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {getManagedProfileDraft, updateManagedProfileDraft, clearManagedProfileDraft} from '../../state/managedProfileDraftStore';
import {addManagedProfile} from '../../state/managedProfilesStore';
import type {CycleRegularity} from '../../state/onboardingPreferences';
import {dateFormatLocale} from '../../utils/cycleMath';
import '../../i18n';

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
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const draft = getManagedProfileDraft();
  const dateLocale = dateFormatLocale();

  const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(draft.lastPeriodDate);
  const [periodLength, setPeriodLength] = useState(draft.periodLength ?? DEFAULT_PERIOD_LENGTH);
  const [cycleLength, setCycleLength] = useState(draft.cycleLength ?? DEFAULT_CYCLE_LENGTH);
  // The stepper must show a sensible starting value, but an untouched default
  // must never be saved as if the mother had actually confirmed it (never
  // fabricate a 28-day cycle / 5-day period — see CLAUDE.md §5). Each stepper
  // only becomes "confirmed" once she actually presses + or -; an already-
  // confirmed value from the draft (e.g. Back then forward with the SAME
  // mounted flow) stays confirmed. periodLength/cycleLength are only ever
  // written to the draft at submission time (see onCreate below), so a fresh
  // mount of this screen always starts untouched, exactly as intended.
  const [periodLengthTouched, setPeriodLengthTouched] = useState(draft.periodLength !== null);
  const [cycleLengthTouched, setCycleLengthTouched] = useState(draft.cycleLength !== null);
  const [regularity, setRegularity] = useState<CycleRegularity>(draft.regularity ?? 'unknown');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  const canContinue = lastPeriodDate !== null && !!draft.firstName && !!draft.birthDate;

  const onCreate = async () => {
    if (!canContinue || creating || !lastPeriodDate || !draft.firstName || !draft.birthDate) {return;}
    setCreating(true);
    try {
      const confirmedPeriodLength = periodLengthTouched ? periodLength : null;
      const confirmedCycleLength = cycleLengthTouched ? cycleLength : null;
      updateManagedProfileDraft({lastPeriodDate, periodLength: confirmedPeriodLength, cycleLength: confirmedCycleLength, regularity});
      const profile = await addManagedProfile({
        type: 'daughter',
        firstName: draft.firstName,
        birthDate: draft.birthDate.toLocaleDateString('en-CA'),
        hasHadFirstPeriod: true,
        lastPeriodDate: lastPeriodDate.toLocaleDateString('en-CA'),
        periodLength: confirmedPeriodLength,
        cycleLength: confirmedCycleLength,
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
      ctaLabel={creating ? t('managedProfile.cycleSetup.creating') : t('managedProfile.cycleSetup.createProfile')}
      description={t('managedProfile.cycleSetup.description')}
      onBack={navigation.goBack}
      onContinue={canContinue && !creating ? onCreate : undefined}
      title={t('managedProfile.cycleSetup.title')}>
      <Reveal index={0}>
        <AwaCard
          accessibilityLabel={t('managedProfile.cycleSetup.lastPeriodLabel')}
          onPress={() => setDatePickerVisible(true)}
          variant="outlined">
          <AwaText colorRole="onSurfaceVariant" emphasized variant="labelLarge" style={styles.label}>{t('managedProfile.cycleSetup.lastPeriodLabel')}</AwaText>
          <View style={styles.dateRow}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-blank-outline" size={18} />
            <AwaText colorRole={lastPeriodDate ? 'onSurface' : 'onSurfaceVariant'} variant="bodyLarge">
              {lastPeriodDate
                ? new Intl.DateTimeFormat(dateLocale, {day: '2-digit', month: 'long', year: 'numeric'}).format(lastPeriodDate)
                : t('managedProfile.cycleSetup.lastPeriodPlaceholder')}
            </AwaText>
          </View>
        </AwaCard>
      </Reveal>

      <Reveal index={1}>
        <AwaCard variant="outlined">
          <AwaText colorRole="onSurfaceVariant" emphasized variant="labelLarge" style={styles.label}>{t('managedProfile.cycleSetup.periodLengthLabel')}</AwaText>
          <DurationStepper
            max={PERIOD_LENGTH_MAX}
            min={PERIOD_LENGTH_MIN}
            onChange={value => {
              setPeriodLength(value);
              setPeriodLengthTouched(true);
            }}
            styles={styles}
            value={periodLength}
          />
        </AwaCard>
      </Reveal>

      <Reveal index={2}>
        <AwaCard variant="outlined">
          <AwaText colorRole="onSurfaceVariant" emphasized variant="labelLarge" style={styles.label}>{t('managedProfile.cycleSetup.cycleLengthLabel')}</AwaText>
          <DurationStepper
            max={CYCLE_LENGTH_MAX}
            min={CYCLE_LENGTH_MIN}
            onChange={value => {
              setCycleLength(value);
              setCycleLengthTouched(true);
            }}
            styles={styles}
            value={cycleLength}
          />
        </AwaCard>
      </Reveal>

      <Reveal index={3}>
        <AwaCard variant="outlined">
          <AwaText colorRole="onSurfaceVariant" emphasized variant="labelLarge" style={styles.label}>{t('managedProfile.cycleSetup.regularityLabel')}</AwaText>
          <View accessibilityRole="radiogroup" style={styles.regularityRow}>
            {(
              [
                {id: 'yes' as const, label: t('managedProfile.cycleSetup.regular')},
                {id: 'no' as const, label: t('managedProfile.cycleSetup.irregular')},
                {id: 'unknown' as const, label: t('managedProfile.cycleSetup.unknown')},
              ]
            ).map(option => {
              const selected = regularity === option.id;
              return (
                <AwaCard
                  accessibilityLabel={option.label}
                  accessibilityRole="radio"
                  accessibilityState={{checked: selected}}
                  key={option.id}
                  onPress={() => setRegularity(option.id)}
                  padding="none"
                  style={[styles.regularityOption, selected && styles.regularitySelected]}
                  variant="outlined">
                  <AwaText
                    colorRole={selected ? 'onPrimaryContainer' : 'onSurfaceVariant'}
                    emphasized={selected}
                    variant="labelLarge"
                    style={styles.regularityText}>
                    {option.label}
                  </AwaText>
                </AwaCard>
              );
            })}
          </View>
        </AwaCard>
      </Reveal>

      <Reveal index={4}>
        <View style={styles.helperCard}>
          <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={18} />
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.helperText}>{t('managedProfile.cycleSetup.helperText')}</AwaText>
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
        subtitle={t('managedProfile.cycleSetup.futureDateWarning')}
        title={t('managedProfile.cycleSetup.lastPeriodLabel')}
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
  onChange,
  styles,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const {t} = useTranslation();
  const canDecrease = value > min;
  const canIncrease = value < max;
  return (
    <View style={styles.stepper}>
      <AwaIconButton
        accessibilityLabel={t('managedProfile.cycleSetup.decrease')}
        disabled={!canDecrease}
        icon="minus"
        onPress={() => onChange(Math.max(min, value - 1))}
        variant="tonal"
      />
      <View style={styles.stepperValueBox}>
        <AwaText variant="titleMedium">{t('managedProfile.cycleSetup.days', {count: value})}</AwaText>
      </View>
      <AwaIconButton
        accessibilityLabel={t('managedProfile.cycleSetup.increase')}
        disabled={!canIncrease}
        icon="plus"
        onPress={() => onChange(Math.min(max, value + 1))}
        variant="tonal"
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    label: {marginBottom: 10},
    dateRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
    stepper: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 6,
    },
    stepperValueBox: {flex: 1, alignItems: 'center'},
    // Same shape/values as CycleInformationScreen.tsx's own regularity chips
    // (the mother's own onboarding) — never a new visual pattern for this choice.
    regularityRow: {flexDirection: 'row', gap: 8},
    regularityOption: {
      minHeight: 48,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    regularitySelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    regularityText: {textAlign: 'center'},
    helperCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    helperText: {flex: 1},
    loadingRow: {marginTop: 6, alignItems: 'center'},
  });
}
