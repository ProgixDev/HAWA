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
  timezone?: string;
  latitude: number;
  longitude: number;
};

let objective: ObjectiveId = 'cycle';
let firstName = 'Amina';
let spiritualMarkersEnabled = true;
let selectedSchool: SchoolId | null = null;
let selectedLocation: OnboardingLocation | null = null;
const LOCATION_STORAGE_KEY = '@hawa/selected-location';
const locationListeners = new Set<() => void>();
let locationHydration: Promise<OnboardingLocation | null> | null = null;
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

const isStoredLocation = (value: unknown): value is OnboardingLocation => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<OnboardingLocation>;
  return typeof candidate.city === 'string' &&
    typeof candidate.country === 'string' &&
    Number.isFinite(candidate.latitude) &&
    Number.isFinite(candidate.longitude);
};

const notifyLocationListeners = () => {
  locationListeners.forEach(listener => listener());
};

export const setSelectedLocation = async (value: OnboardingLocation) => {
  selectedLocation = {...value};
  notifyLocationListeners();
  await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(selectedLocation));
};

export const getSelectedLocation = (): OnboardingLocation | null =>
  selectedLocation ? {...selectedLocation} : null;

export const hydrateSelectedLocation = (): Promise<OnboardingLocation | null> => {
  if (!locationHydration) {
    locationHydration = AsyncStorage.getItem(LOCATION_STORAGE_KEY)
      .then(raw => {
        if (!raw) {return getSelectedLocation();}
        const parsed: unknown = JSON.parse(raw);
        if (isStoredLocation(parsed)) {
          selectedLocation = {...parsed};
          notifyLocationListeners();
        }
        return getSelectedLocation();
      })
      .catch(() => getSelectedLocation());
  }
  return locationHydration;
};

export const subscribeSelectedLocation = (listener: () => void) => {
  locationListeners.add(listener);
  return () => {locationListeners.delete(listener);};
};

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
import AsyncStorage from '@react-native-async-storage/async-storage';
