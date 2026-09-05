import AsyncStorage from '@react-native-async-storage/async-storage';
import {setFirstName} from './onboardingPreferences';

export type CalendarPreference = 'gregorian' | 'hijri' | 'double';
export type TimeFormatPreference = '12h' | '24h';

export type PersonalInformation = {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  country: string;
  language: string;
  preferredName: string;
  calendar: CalendarPreference;
  timeFormat: TimeFormatPreference;
  avatarUri?: string;
};

const STORAGE_KEY = '@hawa/personal-information/v1';

const DEFAULT_INFORMATION: PersonalInformation = {
  // firstName/preferredName intentionally start empty — a new user's real
  // choice (or explicit skip) from NameOnboardingScreen.tsx is the only
  // thing that should ever populate them. Never presented as a real value
  // until she actually provides one (see HomeHeader.tsx/ProfileScreen.tsx/
  // PersonalInformationScreen.tsx's empty-name fallback handling).
  firstName: '',
  lastName: 'Benali',
  birthDate: '1998-05-14',
  email: 'amina.benali@email.com',
  phone: '+213 6 12 34 56 78',
  country: 'Algérie',
  language: 'Français',
  preferredName: '',
  calendar: 'double',
  timeFormat: '24h',
};

let cachedInformation = {...DEFAULT_INFORMATION};

export function getCachedPersonalInformation(): PersonalInformation {
  return {...cachedInformation};
}

export async function loadPersonalInformation(): Promise<PersonalInformation> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {cachedInformation = {...DEFAULT_INFORMATION, ...JSON.parse(raw)};}
  } catch {}
  setFirstName(cachedInformation.preferredName || cachedInformation.firstName);
  return {...cachedInformation};
}

export async function updatePersonalInformation(
  patch: Partial<PersonalInformation>,
): Promise<PersonalInformation> {
  cachedInformation = {...cachedInformation, ...patch};
  setFirstName(cachedInformation.preferredName || cachedInformation.firstName);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedInformation));
  return {...cachedInformation};
}
