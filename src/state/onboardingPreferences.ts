export type ObjectiveId =
  | 'cycle'
  | 'conceive'
  | 'contraception'
  | 'irregular'
  | 'menopause'
  | 'pregnancy'
  | 'postpartum'
  | 'loss';

export type CycleRegularity = 'yes' | 'no' | 'unknown';

export type CyclePreferences = {
  lastPeriodStart: Date;
  periodDuration: number;
  cycleDuration: number;
  regularity: CycleRegularity;
};

export type SchoolId = 'hanafi' | 'maliki' | 'chafii' | 'hanbali' | 'unknown';
export type OnboardingLocation = {
  city: string;
  country: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
};

let objective: ObjectiveId = 'cycle';
let firstName = 'Amina';
let spiritualMarkersEnabled = true;
let selectedSchool: SchoolId | null = null;
let selectedLocation: OnboardingLocation | null = null;
let cyclePreferences: CyclePreferences = {
  lastPeriodStart: new Date(new Date().getFullYear(), new Date().getMonth(), Math.max(1, new Date().getDate() - 5)),
  periodDuration: 5,
  cycleDuration: 28,
  regularity: 'yes',
};

export const setSelectedObjective = (value: ObjectiveId) => {
  objective = value;
};

export const getSelectedObjective = () => objective;

export const setSpiritualMarkersEnabled = (value: boolean) => {
  spiritualMarkersEnabled = value;
};

export const getSpiritualMarkersEnabled = () => spiritualMarkersEnabled;

export const setSelectedSchool = (value: SchoolId) => {
  selectedSchool = value;
};

export const getSelectedSchool = () => selectedSchool;

export const setSelectedLocation = (value: OnboardingLocation) => {
  selectedLocation = {...value};
};

export const getSelectedLocation = (): OnboardingLocation | null =>
  selectedLocation ? {...selectedLocation} : null;

export const setFirstName = (value: string) => {
  if (value.trim()) {
    firstName = value.trim();
  }
};

export const getFirstName = () => firstName;

export const setCyclePreferences = (value: CyclePreferences) => {
  cyclePreferences = {...value, lastPeriodStart: new Date(value.lastPeriodStart)};
};

export const getCyclePreferences = (): CyclePreferences => ({
  ...cyclePreferences,
  lastPeriodStart: new Date(cyclePreferences.lastPeriodStart),
});
