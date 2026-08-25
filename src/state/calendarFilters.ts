import AsyncStorage from '@react-native-async-storage/async-storage';

// Temperature/Poids were removed from the Cycle Calendar's markers/filters/
// legend/selected-day presentation (they remain fully available in Journal
// quotidien/Suivi du jour and the dedicated entry screens — this is a
// presentation-scope removal only, no data was touched). Do not re-add
// 'temperature'/'weight' here without also wiring a real day-cell marker
// for them — the app currently has none (see DayJournalFlags in
// MonthCalendarCard.tsx), so the filter would control nothing.
export type CalendarFilterKey =
  | 'rules'
  | 'symptoms'
  | 'mood'
  | 'notes'
  | 'activity'
  | 'sleep'
  | 'hydration'
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
