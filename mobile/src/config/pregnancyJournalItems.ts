import type {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {RootStackParamList} from '../navigation/AppNavigator';
import type {PregnancyTrackingPreference} from '../state/pregnancyPreferences';

// The five daily-journal categories of the pregnancy objective, in ONE table shared by the "Journal du jour" sheet (the "+" button) and the
// "Suivi du jour" grid of the pregnancy home screen — so the two can never show different icons or open different screens. Each entry carries
// its screen and the icon; the wording (grid label, sheet title / subtitle) comes from the dictionaries.
//
// Icons (Material Design Icons, the app's icon set): heart-pulse = "heartbeat", scale-bathroom = "scale", emoticon-happy-outline = "mood-smile",
// weather-night = "moon-stars" (a crescent with stars), shield-lock-outline = "shield-lock". MDI has no icon literally named heartbeat /
// scale / mood-smile / moon-stars, so these are the closest ones.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type PregnancyJournalItemKey = Extract<PregnancyTrackingPreference, 'symptoms' | 'weight' | 'mood' | 'sleep' | 'medicalInfo'>;

export type PregnancyJournalItem = {
  preferenceKey: PregnancyJournalItemKey;
  route: Extract<keyof RootStackParamList, 'PregnancySymptoms' | 'PregnancyWeight' | 'MoodEntry' | 'SleepEntry' | 'PregnancyMedicalInformation'>;
  icon: IconName;
};

export const PREGNANCY_JOURNAL_ITEMS: readonly PregnancyJournalItem[] = [
  {preferenceKey: 'symptoms', route: 'PregnancySymptoms', icon: 'heart-pulse'},
  {preferenceKey: 'weight', route: 'PregnancyWeight', icon: 'scale-bathroom'},
  {preferenceKey: 'mood', route: 'MoodEntry', icon: 'emoticon-happy-outline'},
  {preferenceKey: 'sleep', route: 'SleepEntry', icon: 'weather-night'},
  {preferenceKey: 'medicalInfo', route: 'PregnancyMedicalInformation', icon: 'shield-lock-outline'},
];
