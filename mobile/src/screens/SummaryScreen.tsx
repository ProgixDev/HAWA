import {getContraceptionReminderIndicator} from '../utils/contraceptionReminderScheduling';
import {CYCLE_RETURN_DATE_TO_CHECK, classifyStoredCycleReturnDate} from '../utils/lossDateValidation';
import React, {useCallback, useMemo, useReducer} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import type {TFunction} from 'i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  spacing,
  TOP_SPACING_EXTRA,
  TOP_SPACING_EXTRA_COMPACT,
} from '../theme/spacing';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {
  getCyclePreferences,
  getSelectedLocation,
  getSelectedObjective,
  getSpiritualMarkersEnabled,
  type ObjectiveId,
} from '../state/onboardingPreferences';
import {
  ALL_PREGNANCY_TRACKING_PREFERENCES,
  getPregnancyDating,
  getPregnancyTrackingPreferences,
  type PregnancyDatingMethod,
  type PregnancyTrackingPreference,
} from '../state/pregnancyPreferences';
import {getPregnancyNotificationSettings} from '../state/pregnancyNotificationSettingsStore';
import {
  getPostpartumPreferences,
  type PostpartumDeliveryType,
  type PostpartumFeedingType,
} from '../state/postpartumPreferences';
import {
  getMiscarriagePreferences,
  type MiscarriageBleedingStatus,
  type MiscarriageCycleReturnStatus,
  type MiscarriageTryingAgainStatus,
} from '../state/miscarriagePreferences';
import {getConceptionPreferences, type ConceptionReminderKey, type ConceptionTryingDuration, type FertilityIndicator, type OvulationAwareness} from '../state/conceptionPreferences';
import {getIrregularPreferences, type IrregularCyclePattern, type IrregularTrackedItem} from '../state/irregularPreferences';
import {getContraceptionPreferences} from '../state/contraceptionPreferences';
import {contraceptionMethodLabels} from '../config/contraceptionLabels';
import {
  getMenopausePreferences,
  type MenopauseHormonalTreatmentStatus,
  type MenopauseLabTracking,
  type MenopauseStage,
  type MenopauseSymptom,
} from '../state/menopausePreferences';
import {getPrivacySecuritySettings, isBiometricEnabled, isPinEnabled} from '../state/securityPreferences';
import {formatFullDate} from '../utils/cycleMath';
import {normalizeTimeOfDay} from '../utils/timeOfDay';

const WOMAN = require('../assets/images/summary-woman.png');

// All label lookups below are built fresh from `t` on every render (the
// component re-renders on focus via forceRefresh() and on language change
// via useTranslation()'s own subscription) rather than kept as module-level
// Record constants — none of these are consumed outside this screen, so the
// mutate-in-place pattern used for cross-module label configs elsewhere
// (e.g. objectiveExportConfig.ts) isn't needed here.
const objectiveLabelsOf = (t: TFunction): Record<ObjectiveId, string> => ({
  cycle: t('objectives.cycle'),
  conceive: t('objectives.conceive'),
  contraception: t('objectives.contraception'),
  irregular: t('objectives.irregular'),
  menopause: t('objectives.menopause'),
  pregnancy: t('objectives.pregnancy'),
  postpartum: t('objectives.postpartum'),
  loss: t('objectives.loss'),
});

const datingMethodLabelsOf = (t: TFunction): Record<PregnancyDatingMethod, string> => ({
  lastPeriod: t('onboarding.summary.rows.datingMethodLastPeriod'),
  dueDate: t('onboarding.summary.rows.datingMethodDueDate'),
  conceptionDate: t('onboarding.summary.rows.datingMethodConceptionDate'),
  later: t('onboarding.summary.rows.datingMethodLater'),
});

// Dynamic label for the "date de référence" card — only shown for the
// three methods that actually carry a real selected date.
const datingReferenceLabelsOf = (t: TFunction): Record<Exclude<PregnancyDatingMethod, 'later'>, string> => ({
  lastPeriod: t('onboarding.summary.rows.lastPeriod'),
  dueDate: t('onboarding.summary.rows.datingMethodDueDate'),
  conceptionDate: t('onboarding.summary.rows.datingMethodConceptionDate'),
});

// Same category order/wording as PregnancyTrackingPreferencesScreen.tsx.
const trackingPreferenceLabelsOf = (t: TFunction): Record<PregnancyTrackingPreference, string> => ({
  symptoms: t('onboarding.summary.rows.trackingSymptoms'),
  mood: t('onboarding.summary.rows.trackingMood'),
  weight: t('onboarding.summary.rows.trackingWeight'),
  sleep: t('onboarding.summary.rows.trackingSleep'),
  hydration: t('onboarding.summary.rows.trackingHydration'),
  activity: t('onboarding.summary.rows.trackingActivity'),
  notes: t('onboarding.summary.rows.trackingNotes'),
  medicalInfo: t('onboarding.summary.rows.trackingMedicalInfo'),
  appointments: t('onboarding.summary.rows.trackingAppointments'),
});

// Same 3 canonical toggles PregnancyRemindersScreen.tsx now reads/writes —
// the REAL pregnancyNotificationSettingsStore.ts fields, not the old
// disconnected pregnancyPreferences.ts reminder preferences. "Rappels
// personnalisés" has no equivalent boolean in the real architecture (it's
// individually-created reminder entries, not a single switch — see
// PregnancyRemindersScreen.tsx's own comment), so it's intentionally not
// listed here.
const REMINDER_PREFERENCE_ORDER: Array<'appointmentsEnabled' | 'examsEnabled' | 'dailyJournalEnabled'> = [
  'appointmentsEnabled', 'examsEnabled', 'dailyJournalEnabled',
];
const reminderPreferenceLabelsOf = (t: TFunction): Record<'appointmentsEnabled' | 'examsEnabled' | 'dailyJournalEnabled', string> => ({
  appointmentsEnabled: t('onboarding.summary.rows.reminderAppointments'),
  examsEnabled: t('onboarding.summary.rows.reminderExams'),
  dailyJournalEnabled: t('onboarding.summary.rows.reminderDailyJournal'),
});

// Same wording as PostpartumDeliveryTypeScreen/PostpartumFeedingScreen.
const deliveryTypeLabelsOf = (t: TFunction): Record<PostpartumDeliveryType, string> => ({
  vaginal: t('onboarding.summary.rows.deliveryTypeVaginal'),
  planned_csection: t('onboarding.summary.rows.deliveryTypePlannedCsection'),
  emergency_csection: t('onboarding.summary.rows.deliveryTypeEmergencyCsection'),
  prefer_not_to_say: t('onboarding.summary.rows.deliveryTypePreferNotToSay'),
});

const feedingTypeLabelsOf = (t: TFunction): Record<PostpartumFeedingType, string> => ({
  exclusive_breastfeeding: t('onboarding.summary.rows.feedingExclusiveBreastfeeding'),
  mixed: t('onboarding.summary.rows.feedingMixed'),
  exclusive_bottle: t('onboarding.summary.rows.feedingExclusiveBottle'),
  unknown: t('onboarding.summary.rows.feedingUnknown'),
});

// Same wording as MiscarriageBleedingScreen/MiscarriageCycleReturnScreen/
// MiscarriageTryingAgainScreen.
const bleedingStatusLabelsOf = (t: TFunction): Record<MiscarriageBleedingStatus, string> => ({
  yes: t('common.yes'),
  no: t('common.no'),
  variable: t('onboarding.summary.rows.bleedingVariable'),
});

const cycleReturnStatusLabelsOf = (t: TFunction): Record<MiscarriageCycleReturnStatus, string> => ({
  yes: t('onboarding.summary.rows.cycleReturnYes'),
  no: t('onboarding.summary.rows.cycleReturnNo'),
  unknown: t('onboarding.summary.rows.cycleReturnUnknown'),
});

const tryingAgainStatusLabelsOf = (t: TFunction): Record<MiscarriageTryingAgainStatus, string> => ({
  not_now: t('onboarding.summary.rows.tryingAgainNotNow'),
  soon: t('onboarding.summary.rows.tryingAgainSoon'),
  ready: t('onboarding.summary.rows.tryingAgainReady'),
});
const conceptionDurationLabelsOf = (t: TFunction): Record<ConceptionTryingDuration, string> => ({starting_now: t('onboarding.summary.rows.tryingDurationStartingNow'), under_3_months: t('onboarding.summary.rows.tryingDurationUnder3Months'), '3_to_6_months': t('onboarding.summary.rows.tryingDuration3To6Months'), '6_to_12_months': t('onboarding.summary.rows.tryingDuration6To12Months'), over_1_year: t('onboarding.summary.rows.tryingDurationOver1Year')});
const ovulationAwarenessLabelsOf = (t: TFunction): Record<OvulationAwareness, string> => ({often: t('onboarding.summary.rows.ovulationAwarenessOften'), sometimes: t('onboarding.summary.rows.ovulationAwarenessSometimes'), not_really: t('onboarding.summary.rows.ovulationAwarenessNotReally')});
const indicatorLabelsOf = (t: TFunction): Record<FertilityIndicator, string> => ({temperature: t('onboarding.summary.rows.indicatorTemperature'), cervical_mucus: t('onboarding.summary.rows.indicatorCervicalMucus'), lh_tests: t('onboarding.summary.rows.indicatorLhTests'), intercourse: t('onboarding.summary.rows.indicatorIntercourse')});
const conceptionReminderLabelsOf = (t: TFunction): Record<ConceptionReminderKey, string> => ({fertile_window: t('onboarding.summary.rows.conceptionReminderFertileWindow'), estimated_ovulation: t('onboarding.summary.rows.conceptionReminderEstimatedOvulation'), temperature: t('onboarding.summary.rows.indicatorTemperature'), lh_test: t('onboarding.summary.rows.conceptionReminderLhTest'), daily_journal: t('onboarding.summary.rows.reminderDailyJournal')});
const irregularCyclePatternLabelsOf = (t: TFunction): Record<IrregularCyclePattern, string> => ({regular: t('onboarding.summary.rows.cyclePatternRegular'), irregular: t('onboarding.summary.rows.cyclePatternIrregular'), very_variable: t('onboarding.summary.rows.cyclePatternVeryVariable'), unknown: t('onboarding.summary.rows.cyclePatternUnknown')});
const irregularTrackedItemLabelsOf = (t: TFunction): Record<IrregularTrackedItem, string> => ({acne: t('onboarding.summary.rows.itemAcne'), hairGrowth: t('onboarding.summary.rows.itemHairGrowth'), weight: t('onboarding.summary.rows.itemWeight'), pain: t('onboarding.summary.rows.itemPain'), mood: t('onboarding.summary.rows.itemMood'), fatigue: t('onboarding.summary.rows.itemFatigue'), otherSymptoms: t('onboarding.summary.rows.itemOtherSymptoms')});

// Same wording as MenopauseStageScreen/MenopauseSymptomsScreen/
// MenopauseHormonalTreatmentScreen/MenopauseLabTrackingScreen.
const menopauseStageLabelsOf = (t: TFunction): Record<MenopauseStage, string> => ({
  perimenopause: t('onboarding.summary.rows.menopauseStagePerimenopause'),
  menopause: t('onboarding.summary.rows.menopauseStageMenopause'),
  unsure: t('onboarding.summary.rows.menopauseStageUnsure'),
});
const menopauseSymptomLabelsOf = (t: TFunction): Record<MenopauseSymptom, string> => ({
  hot_flashes: t('onboarding.summary.rows.symptomHotFlashes'),
  night_sweats: t('onboarding.summary.rows.symptomNightSweats'),
  sleep_disturbances: t('onboarding.summary.rows.symptomSleepDisturbances'),
  fatigue: t('onboarding.summary.rows.symptomFatigue'),
  mood_changes: t('onboarding.summary.rows.symptomMoodChanges'),
  brain_fog: t('onboarding.summary.rows.symptomBrainFog'),
});
const MENOPAUSE_ALL_SYMPTOMS: MenopauseSymptom[] = ['hot_flashes', 'night_sweats', 'sleep_disturbances', 'fatigue', 'mood_changes', 'brain_fog'];
const menopauseHormonalTreatmentLabelsOf = (t: TFunction): Record<MenopauseHormonalTreatmentStatus, string> => ({
  track: t('onboarding.summary.rows.hormonalTreatmentTrack'),
  no: t('common.no'),
  not_now: t('onboarding.summary.rows.hormonalTreatmentNotNow'),
});
const menopauseLabTrackingLabelsOf = (t: TFunction): Record<MenopauseLabTracking, string> => ({
  fsh: t('onboarding.summary.rows.labTrackingFsh'),
  estradiol: t('onboarding.summary.rows.labTrackingEstradiol'),
  both: t('onboarding.summary.rows.labTrackingBoth'),
  none: t('onboarding.summary.rows.labTrackingNone'),
});

const formatSummaryDate = (date: Date): string => formatFullDate(date);

// Compact "3 premiers · +N" preview, or the neutral "tout sélectionné"
// phrasing when every option is active — matches the Pregnancy Summary
// reference exactly ("9 éléments sélectionnés" / "5 rappels activés").
const summarizeSelection = (t: TFunction, selectedLabels: string[], totalCount: number, allSelectedLabel: string): string => {
  if (selectedLabels.length === 0) {return t('onboarding.summary.rows.noneSelected');}
  if (selectedLabels.length === totalCount) {return allSelectedLabel;}
  const PREVIEW_COUNT = 3;
  const preview = selectedLabels.slice(0, PREVIEW_COUNT).join(' · ');
  const remaining = selectedLabels.length - PREVIEW_COUNT;
  return remaining > 0 ? `${preview} · +${remaining}` : preview;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

type EditableRoute =
  | 'Objective'
  | 'SpiritualPreferences'
  | 'Location'
  | 'CycleInformation'
  | 'PregnancyDatingSetup'
  | 'PregnancyTrackingPreferences'
  | 'PregnancyReminders'
  | 'PostpartumDeliveryDate'
  | 'PostpartumDeliveryType'
  | 'PostpartumFeeding'
  | 'PostpartumReminders'
  | 'MiscarriageDate'
  | 'MiscarriageBleeding'
  | 'MiscarriageCycleReturn'
  | 'MiscarriageTryingAgain'
  | 'ConceptionTryingDuration'
  | 'ConceptionOvulationAwareness'
  | 'ConceptionIndicators'
  | 'ConceptionReminders'
  | 'IrregularCyclePattern'
  | 'IrregularLastPeriod'
  | 'IrregularTrackedItems'
  | 'IrregularReminders'
  | 'ContraceptionMethod'
  | 'ContraceptionInformation'
  | 'PillSchedule'
  | 'ContraceptionReminders'
  | 'MenopauseStage'
  | 'MenopauseSymptoms'
  | 'MenopauseHormonalTreatment'
  | 'MenopauseLabTracking'
  | 'MenopauseReminders'
  | 'SecuritySetup'
  | 'Privacy';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type SummaryRow = {
  icon: IconName;
  label: string;
  value: string;
  route: EditableRoute;
  tone: 'purple' | 'rose' | 'blue' | 'green';
};

// Per-row category-identity accent palette — each tone is a fixed decorative
// color deliberately independent of the active theme (mirrors how a
// list-item's own category color is treated elsewhere in the app), so it is
// NOT sourced from theme tokens even though 'purple' happens to be close to
// the app's own brand primary.
const TONE_ICON_COLOR: Record<SummaryRow['tone'], string> = {
  purple: '#6B4BC4',
  rose: '#C2568B',
  blue: '#3E7BC4',
  green: '#3FA372',
};

function SummaryScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();

  const objectiveLabels = objectiveLabelsOf(t);
  const DATING_METHOD_LABELS = datingMethodLabelsOf(t);
  const DATING_REFERENCE_LABELS = datingReferenceLabelsOf(t);
  const TRACKING_PREFERENCE_LABELS = trackingPreferenceLabelsOf(t);
  const REMINDER_PREFERENCE_LABELS = reminderPreferenceLabelsOf(t);
  const DELIVERY_TYPE_LABELS = deliveryTypeLabelsOf(t);
  const FEEDING_TYPE_LABELS = feedingTypeLabelsOf(t);
  const BLEEDING_STATUS_LABELS = bleedingStatusLabelsOf(t);
  const CYCLE_RETURN_STATUS_LABELS = cycleReturnStatusLabelsOf(t);
  const TRYING_AGAIN_STATUS_LABELS = tryingAgainStatusLabelsOf(t);
  const CONCEPTION_DURATION_LABELS = conceptionDurationLabelsOf(t);
  const OVULATION_AWARENESS_LABELS = ovulationAwarenessLabelsOf(t);
  const INDICATOR_LABELS = indicatorLabelsOf(t);
  const CONCEPTION_REMINDER_LABELS = conceptionReminderLabelsOf(t);
  const IRREGULAR_CYCLE_PATTERN_LABELS = irregularCyclePatternLabelsOf(t);
  const IRREGULAR_TRACKED_ITEM_LABELS = irregularTrackedItemLabelsOf(t);
  const MENOPAUSE_STAGE_LABELS = menopauseStageLabelsOf(t);
  const MENOPAUSE_SYMPTOM_LABELS = menopauseSymptomLabelsOf(t);
  const MENOPAUSE_HORMONAL_TREATMENT_LABELS = menopauseHormonalTreatmentLabelsOf(t);
  const MENOPAUSE_LAB_TRACKING_LABELS = menopauseLabTrackingLabelsOf(t);
  const CONTRACEPTION_METHOD_LABELS = contraceptionMethodLabels(t);
  const notProvidedFem = t('onboarding.summary.rows.notProvidedFem');
  const notProvidedMasc = t('onboarding.summary.rows.notProvidedMasc');

  // Every row below reads its value via a plain synchronous store getter at
  // render time (no subscriptions) — returning here via goBack() after an
  // edit doesn't automatically re-render this already-mounted screen, so
  // without this the row would keep showing whatever was true at the last
  // render. Bumping this on every focus forces a fresh render (and thus
  // fresh getter reads) with no new store/subscription needed.
  const [, forceRefresh] = useReducer((tick: number) => tick + 1, 0);
  useFocusEffect(useCallback(() => {forceRefresh();}, []));

  const isSmallScreen = width < 375 || height < 720;
  const isVerySmallScreen = width < 345 || height < 650;

  const objective = getSelectedObjective();
  const spiritualEnabled = getSpiritualMarkersEnabled();
  const location = getSelectedLocation();

  const objectiveRow: SummaryRow = {
    icon: 'calendar-heart',
    label: t('onboarding.summary.rows.objective'),
    value: objectiveLabels[objective],
    route: 'Objective',
    tone: 'purple',
  };
  const spiritualRow: SummaryRow = {
    icon: 'star-crescent',
    label: t('onboarding.summary.rows.spiritual'),
    value: spiritualEnabled ? t('onboarding.summary.rows.spiritualEnabled') : t('onboarding.summary.rows.spiritualDisabled'),
    route: 'SpiritualPreferences',
    tone: 'rose',
  };
  const locationRow: SummaryRow = {
    icon: 'map-marker-outline',
    label: t('onboarding.summary.rows.location'),
    value: location ? `${location.city}, ${location.country}` : notProvidedFem,
    route: 'Location',
    tone: 'green',
  };

  const buildCycleRows = (): SummaryRow[] => {
    const cycle = getCyclePreferences();
    const regularityLabels = {
      yes: t('common.yes'),
      no: t('common.no'),
      unknown: t('onboarding.summary.rows.regularityUnknown'),
    } as const;

    return [
      objectiveRow,
      spiritualRow,
      locationRow,
      {
        icon: 'calendar-month-outline',
        label: t('onboarding.summary.rows.lastPeriod'),
        value: formatSummaryDate(cycle.lastPeriodStart),
        route: 'CycleInformation',
        tone: 'rose',
      },
      {
        icon: 'water-outline',
        label: t('onboarding.summary.rows.periodDuration'),
        value: t('averageCycle.days', {count: cycle.periodDuration}),
        route: 'CycleInformation',
        tone: 'purple',
      },
      {
        icon: 'sync',
        label: t('onboarding.summary.rows.cycleDuration'),
        value: t('averageCycle.days', {count: cycle.cycleDuration}),
        route: 'CycleInformation',
        tone: 'blue',
      },
      {
        icon: 'shield-check-outline',
        label: t('onboarding.summary.rows.cycleRegular'),
        value: regularityLabels[cycle.regularity],
        route: 'CycleInformation',
        tone: 'green',
      },
    ];
  };

  const buildPregnancyRows = (): SummaryRow[] => {
    const dating = getPregnancyDating();
    const datingDate = dating.date ? new Date(dating.date) : null;
    const trackingSelection = getPregnancyTrackingPreferences();
    const reminderPreferences = getPregnancyNotificationSettings();

    const trackingLabels = ALL_PREGNANCY_TRACKING_PREFERENCES
      .filter(id => trackingSelection.has(id))
      .map(id => TRACKING_PREFERENCE_LABELS[id]);
    const reminderLabels = REMINDER_PREFERENCE_ORDER
      .filter(id => reminderPreferences[id])
      .map(id => REMINDER_PREFERENCE_LABELS[id]);

    const rows: SummaryRow[] = [
      objectiveRow,
      spiritualRow,
      locationRow,
      {
        icon: 'human-pregnant',
        label: t('onboarding.summary.rows.datingMethod'),
        value: DATING_METHOD_LABELS[dating.method],
        route: 'PregnancyDatingSetup',
        tone: 'purple',
      },
    ];

    // Only shown once a real date exists — never a fake reference date for
    // the "later" method (see PregnancyDatingSetupScreen/pregnancyPreferences.ts).
    if (dating.method !== 'later' && datingDate) {
      rows.push({
        icon: 'calendar-month-outline',
        label: DATING_REFERENCE_LABELS[dating.method],
        value: formatSummaryDate(datingDate),
        route: 'PregnancyDatingSetup',
        tone: 'rose',
      });
    }

    rows.push(
      {
        icon: 'clipboard-check-outline',
        label: t('onboarding.summary.rows.dailyTracking'),
        value: summarizeSelection(
          t,
          trackingLabels,
          ALL_PREGNANCY_TRACKING_PREFERENCES.length,
          t('onboarding.summary.rows.allSelected', {count: ALL_PREGNANCY_TRACKING_PREFERENCES.length}),
        ),
        route: 'PregnancyTrackingPreferences',
        tone: 'blue',
      },
      {
        icon: 'bell-ring-outline',
        label: t('onboarding.summary.rows.reminders'),
        value: summarizeSelection(
          t,
          reminderLabels,
          REMINDER_PREFERENCE_ORDER.length,
          t('onboarding.summary.rows.remindersAllActive', {count: REMINDER_PREFERENCE_ORDER.length}),
        ),
        route: 'PregnancyReminders',
        tone: 'green',
      },
    );

    return rows;
  };

  // Postpartum-only rows — the NEW onboarding configuration for this
  // objective (deliveryDate/deliveryType/feedingType from
  // postpartumPreferences.ts). Deliberately excludes Cycle rows (last
  // period/cycle duration/regularity) and Pregnancy rows (dating
  // method/week/DPA) — those belong to other objectives.
  const buildPostpartumRows = (): SummaryRow[] => {
    const postpartum = getPostpartumPreferences();
    const deliveryDate = postpartum.deliveryDate ? new Date(`${postpartum.deliveryDate}T12:00:00`) : null;

    return [
      objectiveRow,
      spiritualRow,
      locationRow,
      {
        icon: 'calendar-month-outline',
        label: t('onboarding.summary.rows.deliveryDate'),
        value: deliveryDate ? formatSummaryDate(deliveryDate) : notProvidedFem,
        route: 'PostpartumDeliveryDate',
        tone: 'rose',
      },
      {
        icon: 'baby-face-outline',
        label: t('onboarding.summary.rows.deliveryType'),
        value: postpartum.deliveryType ? DELIVERY_TYPE_LABELS[postpartum.deliveryType] : notProvidedMasc,
        route: 'PostpartumDeliveryType',
        tone: 'purple',
      },
      {
        icon: 'baby-bottle-outline',
        label: t('onboarding.summary.rows.feeding'),
        value: postpartum.feedingType ? FEEDING_TYPE_LABELS[postpartum.feedingType] : notProvidedMasc,
        route: 'PostpartumFeeding',
        tone: 'blue',
      },
      {
        icon: 'bell-outline',
        label: t('onboarding.summary.rows.reminders'),
        value:
          postpartum.dailyTrackingReminderEnabled && postpartum.dailyTrackingReminderTime
            ? t('onboarding.summary.rows.dailyTrackingReminderAt', {time: normalizeTimeOfDay(postpartum.dailyTrackingReminderTime)})
            : t('onboarding.summary.rows.remindersNoneActive'),
        route: 'PostpartumReminders',
        tone: 'green',
      },
    ];
  };

  // Contraception-only rows — sourced entirely from contraceptionPreferences.ts
  // (no duplicated Summary state). Deliberately excludes Cycle rows (last
  // period/cycle duration/regularity): Contraception no longer routes
  // through CycleInformationScreen at all (see LocationScreen.tsx). The
  // reminders row is generic (`remindersEnabled`) and shown for every method
  // once a method is selected — reminders are no longer a pill-only concept.
  const buildContraceptionRows = (): SummaryRow[] => {
    const contraception = getContraceptionPreferences();
    const startDate = contraception.methodStartDate
      ? new Date(`${contraception.methodStartDate}T12:00:00`)
      : null;

    const rows: SummaryRow[] = [
      objectiveRow,
      spiritualRow,
      locationRow,
      {
        icon: 'pill',
        label: t('onboarding.summary.rows.contraceptionMethod'),
        value: contraception.method ? CONTRACEPTION_METHOD_LABELS[contraception.method] : notProvidedFem,
        route: 'ContraceptionMethod',
        tone: 'rose',
      },
      {
        icon: 'calendar-month-outline',
        label: t('onboarding.summary.rows.contraceptionSince'),
        value: startDate ? formatSummaryDate(startDate) : notProvidedFem,
        route: 'ContraceptionInformation',
        tone: 'purple',
      },
    ];

    if (contraception.method === 'pill') {
      const scheduleValue =
        contraception.pillScheduleType === 'cyclic' && contraception.activeDays !== null && contraception.breakDays !== null
          ? t('onboarding.summary.rows.pillScheduleCyclic', {activeDays: contraception.activeDays, breakDays: contraception.breakDays})
          : contraception.pillScheduleType === 'continuous'
            ? t('onboarding.summary.rows.pillScheduleContinuous')
            : notProvidedMasc;

      rows.push({
        icon: 'calendar-month-outline',
        label: t('onboarding.summary.rows.pillSchedule'),
        value: scheduleValue,
        route: 'PillSchedule',
        tone: 'purple',
      });
    }

    if (contraception.method) {
      rows.push({
        icon: 'bell-ring-outline',
        label: t('onboarding.summary.rows.reminders'),
        value: (() => {
          const indicator = getContraceptionReminderIndicator(contraception.method, contraception.remindersEnabled);
          return indicator === 'enabled' ? t('onboarding.summary.rows.contraceptionRemindersEnabled') : indicator === 'unavailable' ? t('onboarding.summary.rows.contraceptionRemindersUnavailable') : t('onboarding.summary.rows.contraceptionRemindersDisabled');
        })(),
        route: 'ContraceptionReminders',
        tone: 'blue',
      });
    }

    return rows;
  };

  const buildConceptionRows = (): SummaryRow[] => {
    const conception = getConceptionPreferences();
    const rows: SummaryRow[] = [objectiveRow, spiritualRow];
    if (spiritualEnabled && location) {rows.push(locationRow);}
    rows.push(
      {icon:'calendar-clock',label:t('onboarding.summary.rows.tryingDuration'),value:conception.tryingDuration ? CONCEPTION_DURATION_LABELS[conception.tryingDuration] : notProvidedMasc,route:'ConceptionTryingDuration',tone:'rose'},
      {icon:'target',label:t('onboarding.summary.rows.ovulationAwareness'),value:conception.ovulationAwareness ? OVULATION_AWARENESS_LABELS[conception.ovulationAwareness] : notProvidedMasc,route:'ConceptionOvulationAwareness',tone:'purple'},
      {icon:'chart-timeline-variant',label:t('onboarding.summary.rows.indicators'),value:summarizeSelection(t, conception.indicators.map(id => INDICATOR_LABELS[id]),4,t('onboarding.summary.rows.allIndicators')),route:'ConceptionIndicators',tone:'blue'},
      {icon:'bell-ring-outline',label:t('onboarding.summary.rows.reminders'),value:summarizeSelection(t, (Object.keys(conception.reminders) as ConceptionReminderKey[]).filter(id => conception.reminders[id]).map(id => CONCEPTION_REMINDER_LABELS[id]),5,t('onboarding.summary.rows.allReminders')),route:'ConceptionReminders',tone:'green'},
    );
    return rows;
  };

  // "Après une fausse couche"-only rows — sourced entirely from
  // miscarriagePreferences.ts (spec section 25: no duplicated Summary
  // state). Deliberately excludes Cycle rows (last period/cycle duration/
  // regularity) and Pregnancy rows (dating/week/DPA) — this objective is
  // separate from both (spec sections 23-24). The location row is only
  // included when spiritual landmarks were enabled AND a real location was
  // collected — when disabled, LocationScreen was skipped entirely and no
  // fake location must ever be shown (spec section 22.3).
  const buildMiscarriageRows = (): SummaryRow[] => {
    const miscarriage = getMiscarriagePreferences();
    const miscarriageDate = miscarriage.miscarriageDate ? new Date(`${miscarriage.miscarriageDate}T12:00:00`) : null;
    const firstReturnedPeriodDate = miscarriage.firstReturnedPeriodDate
      ? new Date(`${miscarriage.firstReturnedPeriodDate}T12:00:00`)
      : null;

    const rows: SummaryRow[] = [objectiveRow, spiritualRow];

    if (spiritualEnabled && location) {
      rows.push(locationRow);
    }

    rows.push(
      {
        icon: 'calendar-heart',
        label: t('onboarding.summary.rows.miscarriageDate'),
        value: miscarriageDate ? formatSummaryDate(miscarriageDate) : notProvidedFem,
        route: 'MiscarriageDate',
        tone: 'rose',
      },
      {
        icon: 'water-outline',
        label: t('onboarding.summary.rows.currentBleeding'),
        value: miscarriage.bleedingStatus ? BLEEDING_STATUS_LABELS[miscarriage.bleedingStatus] : notProvidedMasc,
        route: 'MiscarriageBleeding',
        tone: 'purple',
      },
      {
        icon: 'calendar-sync-outline',
        label: t('onboarding.summary.rows.cycleReturn'),
        value: miscarriage.cycleReturnStatus ? CYCLE_RETURN_STATUS_LABELS[miscarriage.cycleReturnStatus] : notProvidedMasc,
        route: 'MiscarriageCycleReturn',
        tone: 'blue',
      },
    );

    // Only shown once a real date exists — never a fake reference date when
    // the "yes" answer was given without a date (spec section 22.7).
    // A legacy stored date that is in the future / before the loss (or
    // unparsable) is flagged instead of shown as a date (canonical check shared
    // with the Dashboard); the stored value itself is never rewritten.
    const cycleReturnDateState = classifyStoredCycleReturnDate({
      cycleReturnStatus: miscarriage.cycleReturnStatus,
      cycleReturnDate: miscarriage.firstReturnedPeriodDate,
      now: new Date(),
      lossDate: miscarriage.miscarriageDate,
    });
    if (cycleReturnDateState !== 'none') {
      rows.push({
        icon: 'calendar-check-outline',
        label: t('onboarding.summary.rows.firstReturnedPeriod'),
        value: cycleReturnDateState === 'ok' && firstReturnedPeriodDate ? formatSummaryDate(firstReturnedPeriodDate) : CYCLE_RETURN_DATE_TO_CHECK,
        route: 'MiscarriageCycleReturn',
        tone: 'green',
      });
    }

    rows.push({
      icon: 'heart-outline',
      label: t('onboarding.summary.rows.tryingAgain'),
      value: miscarriage.tryingAgainStatus ? TRYING_AGAIN_STATUS_LABELS[miscarriage.tryingAgainStatus] : notProvidedMasc,
      route: 'MiscarriageTryingAgain',
      tone: 'green',
    });

    return rows;
  };

  // "Post-ménopause / Ménopause"-only rows — sourced entirely from
  // menopausePreferences.ts (no duplicated Summary state). Deliberately
  // excludes Cycle rows (last period/cycle duration/regularity): this
  // objective no longer routes through CycleInformationScreen at all (see
  // LocationScreen.tsx). No stage/symptom/treatment/lab value is ever
  // interpreted here — only the user's own stored choices are displayed.
  const buildMenopauseRows = (): SummaryRow[] => {
    const menopause = getMenopausePreferences();
    const symptomLabels = MENOPAUSE_ALL_SYMPTOMS
      .filter(id => menopause.trackedSymptoms.includes(id))
      .map(id => MENOPAUSE_SYMPTOM_LABELS[id]);

    return [
      objectiveRow,
      spiritualRow,
      locationRow,
      {
        icon: 'flower-outline',
        label: t('onboarding.summary.rows.menopauseStage'),
        value: menopause.stage ? MENOPAUSE_STAGE_LABELS[menopause.stage] : notProvidedFem,
        route: 'MenopauseStage',
        tone: 'rose',
      },
      {
        icon: 'clipboard-pulse-outline',
        label: t('onboarding.summary.rows.menopauseSymptoms'),
        value: summarizeSelection(t, symptomLabels, MENOPAUSE_ALL_SYMPTOMS.length, t('onboarding.summary.rows.allSymptoms')),
        route: 'MenopauseSymptoms',
        tone: 'purple',
      },
      {
        icon: 'pill',
        label: t('onboarding.summary.rows.hormonalTreatment'),
        value: menopause.hormonalTreatmentStatus ? MENOPAUSE_HORMONAL_TREATMENT_LABELS[menopause.hormonalTreatmentStatus] : notProvidedMasc,
        route: 'MenopauseHormonalTreatment',
        tone: 'blue',
      },
      {
        icon: 'flask-outline',
        label: t('onboarding.summary.rows.labTracking'),
        value: menopause.labTracking ? MENOPAUSE_LAB_TRACKING_LABELS[menopause.labTracking] : notProvidedMasc,
        route: 'MenopauseLabTracking',
        tone: 'green',
      },
      {
        icon: 'bell-outline',
        label: t('onboarding.summary.rows.reminders'),
        value: (() => {
          const active: string[] = [];
          if (menopause.dailyTrackingReminderEnabled && menopause.dailyTrackingReminderTime) {
            active.push(t('onboarding.summary.rows.dailyTrackingReminderAt', {time: normalizeTimeOfDay(menopause.dailyTrackingReminderTime)}));
          }
          if (
            menopause.hormonalTreatmentStatus === 'track' &&
            menopause.treatmentReminderEnabled &&
            menopause.treatmentReminderTime
          ) {
            active.push(t('onboarding.summary.rows.treatmentReminderAt', {time: normalizeTimeOfDay(menopause.treatmentReminderTime)}));
          }
          return active.length > 0 ? active.join(' · ') : t('onboarding.summary.rows.remindersNoneActive');
        })(),
        route: 'MenopauseReminders',
        tone: 'blue',
      },
    ];
  };

  // SOPK-only rows — sourced entirely from irregularPreferences.ts (no
  // duplicated Summary state). Deliberately excludes Cycle's generic
  // regularity/period-duration rows: SOPK never displays a cycle as "late",
  // so no row here ever references delay/lateness.
  const buildIrregularRows = (): SummaryRow[] => {
    const irregular = getIrregularPreferences();
    const trackedLabels = irregular.trackedItems.map(id => IRREGULAR_TRACKED_ITEM_LABELS[id]);
    const remindersActive: string[] = [];
    if (irregular.reminders.dailyJournalEnabled) {
      remindersActive.push(
        irregular.reminders.dailyJournalTime
          ? t('onboarding.summary.rows.dailyJournalAt', {time: normalizeTimeOfDay(irregular.reminders.dailyJournalTime)})
          : t('onboarding.summary.rows.reminderDailyJournal'),
      );
    }
    if (irregular.reminders.unrecordedPeriodEnabled) {
      remindersActive.push(t('onboarding.summary.rows.unrecordedPeriods'));
    }

    return [
      objectiveRow,
      spiritualRow,
      locationRow,
      {
        icon: 'chart-timeline-variant',
        label: t('onboarding.summary.rows.cyclePattern'),
        value: irregular.cyclePattern ? IRREGULAR_CYCLE_PATTERN_LABELS[irregular.cyclePattern] : notProvidedMasc,
        route: 'IrregularCyclePattern',
        tone: 'rose',
      },
      {
        icon: 'calendar-month-outline',
        label: t('onboarding.summary.rows.lastPeriod'),
        value: irregular.lastPeriodDate ? formatSummaryDate(new Date(`${irregular.lastPeriodDate}T12:00:00`)) : notProvidedFem,
        route: 'IrregularLastPeriod',
        tone: 'purple',
      },
      {
        icon: 'clipboard-pulse-outline',
        label: t('onboarding.summary.rows.trackedItems'),
        value: summarizeSelection(t, trackedLabels, Object.keys(IRREGULAR_TRACKED_ITEM_LABELS).length, t('onboarding.summary.rows.allItems')),
        route: 'IrregularTrackedItems',
        tone: 'blue',
      },
      {
        icon: 'bell-outline',
        label: t('onboarding.summary.rows.reminders'),
        value: remindersActive.length > 0 ? remindersActive.join(' · ') : t('onboarding.summary.rows.remindersDisabled'),
        route: 'IrregularReminders',
        tone: 'green',
      },
    ];
  };

  const objectiveRows: SummaryRow[] =
    objective === 'pregnancy' ? buildPregnancyRows()
      : objective === 'postpartum' ? buildPostpartumRows()
        : objective === 'loss' ? buildMiscarriageRows()
          : objective === 'conceive' ? buildConceptionRows()
            : objective === 'contraception' ? buildContraceptionRows()
              : objective === 'menopause' ? buildMenopauseRows()
                : objective === 'irregular' ? buildIrregularRows()
          : buildCycleRows();
  const privacy = getPrivacySecuritySettings();
  const securityLabels = [isPinEnabled() ? t('onboarding.summary.rows.securityPinEnabled') : null, isBiometricEnabled() ? t('onboarding.summary.rows.securityBiometricEnabled') : null].filter((value): value is string => Boolean(value));
  const privacyLabels = [privacy.discreetMode ? t('onboarding.summary.rows.privacyDiscreetMode') : null, privacy.hideNotificationPreview ? t('onboarding.summary.rows.privacyHiddenPreviews') : null, privacy.privateContentProtection ? t('onboarding.summary.rows.privacyProtectedContent') : null].filter((value): value is string => Boolean(value));
  const rows: SummaryRow[] = [...objectiveRows,
    {icon:'shield-lock-outline',label:t('onboarding.summary.rows.security'),value:securityLabels.length ? securityLabels.join(' · ') : t('onboarding.summary.rows.securityNone'),route:'SecuritySetup',tone:'purple'},
    {icon:'incognito',label:t('onboarding.summary.rows.privacy'),value:privacyLabels.length ? privacyLabels.join(' · ') : t('onboarding.summary.rows.privacyStandard'),route:'Privacy',tone:'green'},
  ];

  // Summary sits at the end of the single onboarding stack, so every one of
  // these routes already exists earlier in navigation history.
  // navigation.navigate() to an in-stack route pops back to it — discarding
  // Summary itself — which is why "Modify" used to feel like it restarted
  // onboarding. navigation.push() always stacks a fresh instance on top of
  // Summary instead, so the target screen's own goBack() (explicit, or the
  // default header/hardware back button) reliably lands back on Summary.
  // 'Objective' is deliberately excluded: changing the primary objective
  // invalidates the rest of this screen's rows and keeps its original
  // full-flow behavior.
  const navigateToEdit = (route: EditableRoute) => {
    switch (route) {
      case 'Objective':
        // Excluded from the edit-mode fix: changing the primary objective
        // invalidates the rest of this screen's rows, so it keeps its
        // original full-onboarding-flow behavior.
        navigation.navigate('Objective');
        return;
      case 'SpiritualPreferences':
        navigation.push('SpiritualPreferences', {mode: 'edit'});
        return;
      case 'Location':
        navigation.push('Location', {mode: 'edit'});
        return;
      case 'CycleInformation':
        navigation.push('CycleInformation', {mode: 'edit'});
        return;
      case 'PregnancyDatingSetup':
        navigation.push('PregnancyDatingSetup', {mode: 'edit'});
        return;
      case 'PregnancyTrackingPreferences':
        navigation.push('PregnancyTrackingPreferences', {mode: 'edit'});
        return;
      case 'PregnancyReminders':
        navigation.push('PregnancyReminders', {mode: 'edit'});
        return;
      case 'PostpartumDeliveryDate':
        navigation.push('PostpartumDeliveryDate', {mode: 'edit'});
        return;
      case 'PostpartumDeliveryType':
        navigation.push('PostpartumDeliveryType', {mode: 'edit'});
        return;
      case 'PostpartumFeeding':
        navigation.push('PostpartumFeeding', {mode: 'edit'});
        return;
      case 'PostpartumReminders':
        navigation.push('PostpartumReminders', {mode: 'edit'});
        return;
      case 'MiscarriageDate':
        navigation.push('MiscarriageDate', {mode: 'edit'});
        return;
      case 'MiscarriageBleeding':
        navigation.push('MiscarriageBleeding', {mode: 'edit'});
        return;
      case 'MiscarriageCycleReturn':
        navigation.push('MiscarriageCycleReturn', {mode: 'edit'});
        return;
      case 'MiscarriageTryingAgain':
        navigation.push('MiscarriageTryingAgain', {mode: 'edit'});
        return;
      case 'ConceptionTryingDuration':
        navigation.push('ConceptionTryingDuration', {mode: 'edit'});
        return;
      case 'ConceptionOvulationAwareness':
        navigation.push('ConceptionOvulationAwareness', {mode: 'edit'});
        return;
      case 'ConceptionIndicators':
        navigation.push('ConceptionIndicators', {mode: 'edit'});
        return;
      case 'ConceptionReminders':
        navigation.push('ConceptionReminders', {mode: 'edit'});
        return;
      case 'IrregularCyclePattern':
        navigation.push('IrregularCyclePattern', {mode: 'edit'});
        return;
      case 'IrregularLastPeriod':
        navigation.push('IrregularLastPeriod', {mode: 'edit'});
        return;
      case 'IrregularTrackedItems':
        navigation.push('IrregularTrackedItems', {mode: 'edit'});
        return;
      case 'IrregularReminders':
        navigation.push('IrregularReminders', {mode: 'edit'});
        return;
      case 'ContraceptionMethod':
        navigation.push('ContraceptionMethod', {mode: 'edit'});
        return;
      case 'ContraceptionInformation':
        navigation.push('ContraceptionInformation', {mode: 'edit'});
        return;
      case 'PillSchedule':
        navigation.push('PillSchedule', {mode: 'edit'});
        return;
      case 'ContraceptionReminders':
        navigation.push('ContraceptionReminders', {mode: 'edit'});
        return;
      case 'MenopauseStage':
        navigation.push('MenopauseStage', {mode: 'edit'});
        return;
      case 'MenopauseSymptoms':
        navigation.push('MenopauseSymptoms', {mode: 'edit'});
        return;
      case 'MenopauseHormonalTreatment':
        navigation.push('MenopauseHormonalTreatment', {mode: 'edit'});
        return;
      case 'MenopauseLabTracking':
        navigation.push('MenopauseLabTracking', {mode: 'edit'});
        return;
      case 'MenopauseReminders':
        navigation.push('MenopauseReminders', {mode: 'edit'});
        return;
      case 'SecuritySetup':
        navigation.push('SecuritySetup', {mode: 'edit'});
        return;
      case 'Privacy':
        navigation.push('Privacy', {mode: 'edit'});
        return;
      default:
        route satisfies never;
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

      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            isSmallScreen && styles.contentSmall,
            isVerySmallScreen && styles.contentVerySmall,
            {
              paddingTop: isSmallScreen
                ? TOP_SPACING_EXTRA_COMPACT
                : TOP_SPACING_EXTRA,
              paddingBottom: Math.max(insets.bottom, 16) + spacing.md,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowOne} />
            <View style={styles.heroGlowTwo} />

            <View style={styles.heroCopy}>
              <View style={styles.stepBadge}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="check-decagram"
                  size={16}
                />
                <Text style={styles.stepBadgeText}>{t('onboarding.summary.stepBadge')}</Text>
              </View>

              <Text
                style={[
                  styles.title,
                  isSmallScreen && styles.titleSmall,
                ]}>
                {t('onboarding.summary.heroTitle')}
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  isSmallScreen && styles.subtitleSmall,
                ]}>
                {t('onboarding.summary.heroSubtitle')}
              </Text>

              <View style={styles.editTip}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="gesture-tap"
                  size={17}
                />
                <Text style={styles.editTipText}>
                  {t('onboarding.summary.editTip')}
                </Text>
              </View>
            </View>

            <View style={styles.heroArt}>
              <Image
                accessibilityIgnoresInvertColors
                source={WOMAN}
                style={[
                  styles.woman,
                  isSmallScreen && styles.womanSmall,
                ]}
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t('onboarding.summary.sectionTitle')}</Text>
              <Text style={styles.sectionSubtitle}>
                {t('onboarding.summary.sectionSubtitle')}
              </Text>
            </View>

            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{rows.length}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {rows.map(row => {
              const missing = row.value === notProvidedFem || row.value === notProvidedMasc;

              return (
                <Pressable
                  accessibilityHint={t('onboarding.summary.cardA11yHint')}
                  accessibilityLabel={`${row.label}, ${row.value}`}
                  accessibilityRole="button"
                  key={row.label}
                  onPress={() => navigateToEdit(row.route)}
                  style={({pressed}) => [
                    styles.infoCard,
                    isSmallScreen && styles.infoCardSmall,
                    pressed && styles.infoCardPressed,
                  ]}>
                  <View
                    style={[
                      styles.iconWrap,
                      styles[`iconWrap_${row.tone}`],
                    ]}>
                    <MaterialDesignIcons
                      color={TONE_ICON_COLOR[row.tone]}
                      name={row.icon}
                      size={26}
                    />
                  </View>

                  <View style={styles.infoCopy}>
                    <Text
                      numberOfLines={1}
                      style={styles.label}>
                      {row.label}
                    </Text>

                    <Text
                      numberOfLines={2}
                      style={[
                        styles.value,
                        missing && styles.valueMissing,
                      ]}>
                      {row.value}
                    </Text>
                  </View>

                  <View style={styles.editIcon}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="pencil-outline"
                      size={16}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.reassuranceCard}>
            <View style={styles.reassuranceIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="shield-check-outline"
                size={23}
              />
            </View>

            <View style={styles.reassuranceCopy}>
              <Text style={styles.reassuranceTitle}>
                {t('onboarding.summary.reassuranceTitle')}
              </Text>

              <Text style={styles.reassuranceText}>
                {t('onboarding.summary.reassuranceText')}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Auth')}
            style={({pressed}) => [
              styles.startButton,
              isSmallScreen && styles.startButtonSmall,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.startText}>{t('onboarding.summary.start')}</Text>

            <View style={styles.startIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="arrow-right"
                size={20}
              />
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  pageBackgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  pageGlowTop: {
    position: 'absolute',
    top: -150,
    right: -110,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: withAlpha(theme.colors.primary, 0.07),
  },

  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: withAlpha(theme.colors.secondary, 0.045),
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: withAlpha(theme.shadow.shadowColor, 0.05),
  },

  safeArea: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  },

  contentSmall: {
    paddingHorizontal: 12,
  },

  contentVerySmall: {
    paddingHorizontal: 10,
  },

  heroCard: {
    minHeight: 190,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 28,
    backgroundColor: withAlpha(theme.colors.surface, 0.88),
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },

  heroGlowOne: {
    position: 'absolute',
    top: -62,
    right: -38,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: withAlpha(theme.colors.primary, 0.12),
  },

  heroGlowTwo: {
    position: 'absolute',
    right: 90,
    bottom: -72,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: withAlpha(theme.colors.surface, 0.55),
  },

  heroCopy: {
    width: '58%',
    justifyContent: 'center',
    paddingLeft: 20,
    paddingVertical: 18,
    zIndex: 2,
  },

  stepBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  stepBadgeText: {
    color: theme.colors.primary,
    fontSize: 9.5,
    fontWeight: '800',
  },

  title: {
    marginTop: 12,
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '800',
  },

  titleSmall: {
    fontSize: 25,
    lineHeight: 30,
  },

  subtitle: {
    marginTop: 7,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  subtitleSmall: {
    fontSize: 10.8,
    lineHeight: 15,
  },

  editTip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 13,
  },

  editTipText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '700',
  },

  heroArt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  woman: {
    width: '145%',
    height: 185,
    resizeMode: 'contain',
    marginRight: -18,
    marginBottom: -6,
  },

  womanSmall: {
    width: '138%',
    height: 165,
    marginRight: -14,
    marginBottom: -4,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 3,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },

  sectionSubtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 9.5,
  },

  sectionCount: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },

  sectionCountText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },

  infoCard: {
    width: '48.7%',
    minHeight: 126,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
    padding: 12,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },

  infoCardSmall: {
    minHeight: 120,
    padding: 10,
  },

  infoCardPressed: {
    opacity: 0.84,
    transform: [{scale: 0.985}],
    backgroundColor: theme.colors.primarySoft,
  },

  // Per-row category-identity accent backgrounds — fixed decorative tints
  // paired with TONE_ICON_COLOR above (same "leave verbatim" exception),
  // kept independent of the active theme.
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrap_purple: {
    backgroundColor: '#EEE8FB',
  },

  iconWrap_rose: {
    backgroundColor: '#FBEAF1',
  },

  iconWrap_blue: {
    backgroundColor: '#E8F0FC',
  },

  iconWrap_green: {
    backgroundColor: '#E8F7EF',
  },

  infoCopy: {
    flex: 1,
    marginTop: 12,
  },

  label: {
    color: theme.colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '600',
  },

  value: {
    marginTop: 4,
    color: theme.colors.text,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
  },

  valueMissing: {
    color: theme.colors.warning,
    fontStyle: 'italic',
  },

  editIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: theme.colors.primarySoft,
  },

  reassuranceCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.92),
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  reassuranceIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
  },

  reassuranceCopy: {
    flex: 1,
  },

  reassuranceTitle: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  reassuranceText: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 9,
    lineHeight: 13,
  },

  startButton: {
    position: 'relative',
    width: '86%',
    maxWidth: 360,
    minHeight: 54,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 54,
    borderRadius: 19,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 5,
  },

  startButtonSmall: {
    width: '90%',
    minHeight: 50,
    paddingHorizontal: 50,
  },

  startText: {
    color: onPrimaryTextColor(theme),
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  startIcon: {
    position: 'absolute',
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
  },

  pressed: {
    opacity: 0.84,
    transform: [{scale: 0.99}],
  },
  });
}

export default SummaryScreen;
