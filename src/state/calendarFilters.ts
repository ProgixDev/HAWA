import AsyncStorage from '@react-native-async-storage/async-storage';

export type CalendarFilterKey =
  | 'rules'
  | 'symptoms'
  | 'mood'
  | 'notes'
  | 'activity'
  | 'sleep'
  | 'hydration'
  | 'temperature'
  | 'weight'
  | 'intimacy';

export type CalendarFilters = Record<CalendarFilterKey, boolean>;

const FILTERS_KEY = '@hawa/calendar/filters';

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  rules: true,
  symptoms: true,
  mood: true,
  notes: true,
  activity: true,
  sleep: true,
  hydration: true,
  temperature: true,
  weight: true,
  intimacy: true,
};

export async function loadCalendarFilters(): Promise<CalendarFilters> {
  try {
    const raw = await AsyncStorage.getItem(FILTERS_KEY);
    if (!raw) {return DEFAULT_CALENDAR_FILTERS;}
    const parsed = JSON.parse(raw) as Partial<CalendarFilters>;
    return {...DEFAULT_CALENDAR_FILTERS, ...parsed};
  } catch {
    return DEFAULT_CALENDAR_FILTERS;
  }
}

export const saveCalendarFilters = (filters: CalendarFilters): void => {
  AsyncStorage.setItem(FILTERS_KEY, JSON.stringify(filters)).catch(() => {});
};
