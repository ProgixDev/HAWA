import type {MenopauseJournalEntry} from '../state/menopauseJournalStore';

export type MenopauseMonthlySummary = {
  daysWithSymptoms: number;
  hotFlashDays: number;
  nightSweatNights: number;
  fatigueDays: number;
};

/** Distinct-day counts for the Menopause Calendar's "Résumé de ce mois" card,
 * scoped to exactly one calendar month (`month` is 0-indexed, like Date) —
 * never a rolling window. `entriesByDate` holds at most one entry per date
 * key (see menopauseJournalStore.ts's `saveMenopauseJournalField`), so
 * counting matching ENTRIES already counts distinct DAYS: a day with several
 * symptoms recorded the same day still contributes exactly one to
 * `daysWithSymptoms`. Uses the same canonical symptom IDs and the same
 * 'T12:00:00' local-noon date parsing already used by
 * MenopauseStatisticsScreen.tsx, so a date string is never misclassified
 * into the wrong month/year by a UTC-vs-local rollover. */
export function computeMenopauseMonthlySummary(
  entriesByDate: Record<string, MenopauseJournalEntry>,
  year: number,
  month: number,
): MenopauseMonthlySummary {
  const entriesThisMonth = Object.values(entriesByDate).filter(entry => {
    const parsed = new Date(`${entry.date}T12:00:00`);
    return parsed.getFullYear() === year && parsed.getMonth() === month;
  });

  return {
    daysWithSymptoms: entriesThisMonth.filter(entry => entry.symptoms && entry.symptoms.length > 0).length,
    hotFlashDays: entriesThisMonth.filter(entry => entry.symptoms?.includes('hot_flashes')).length,
    nightSweatNights: entriesThisMonth.filter(entry => entry.symptoms?.includes('night_sweats')).length,
    fatigueDays: entriesThisMonth.filter(entry => entry.symptoms?.includes('fatigue')).length,
  };
}
