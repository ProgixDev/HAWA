import {useRoute} from '@react-navigation/native';

// M21 - the day a shared journal entry screen reads from / writes to.
// Today by default (unchanged behaviour); an explicit `date` route param
// ('YYYY-MM-DD', same optional param IrregularJournalEntry already accepts)
// opens THAT day - used by a Calendar's selected day so a past observation
// can be recorded or corrected. A future day is flagged, never written.
// Screens using it must load AND save with `entryDateKey`.

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const isRealDateKey = (key: string): boolean => {
  if (!DATE_KEY.test(key)) {
    return false;
  }
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

export type JournalEntryDate = {
  /** Local 'YYYY-MM-DD' key the entry is stored under. */
  entryDateKey: string;
  isPastEntryDate: boolean;
  isFutureEntryDate: boolean;
  /** Header line for a non-today day (e.g. "Mardi 10 mars"); undefined for today. */
  dateLabel: string | undefined;
};

export const FUTURE_ENTRY_MESSAGE = 'Tu ne peux pas enregistrer un suivi pour une date à venir.';

/** `todayKey` comes from the screen's own useToday() (shared current day). */
export function useJournalEntryDate(todayKey: string): JournalEntryDate {
  const route = useRoute();
  const requested = (route.params as {date?: unknown} | undefined)?.date;
  const entryDateKey = typeof requested === 'string' && isRealDateKey(requested) ? requested : todayKey;
  const isPastEntryDate = entryDateKey < todayKey;
  const isFutureEntryDate = entryDateKey > todayKey;
  const dateLabel = entryDateKey === todayKey
    ? undefined
    : new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'}).format(new Date(`${entryDateKey}T12:00:00`));
  return {entryDateKey, isPastEntryDate, isFutureEntryDate, dateLabel};
}
