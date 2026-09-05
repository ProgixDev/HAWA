import {computeMenopauseMonthlySummary} from '../menopauseCalendarMath';
import type {MenopauseJournalEntry} from '../../state/menopauseJournalStore';

const entry = (date: string, symptoms: MenopauseJournalEntry['symptoms']): MenopauseJournalEntry => ({
  date,
  symptoms,
});

// August is month index 7 (0-indexed, like Date#getMonth()).
const AUGUST = 7;
const SEPTEMBER = 8;
const YEAR = 2026;

describe('computeMenopauseMonthlySummary', () => {
  it('returns all zeros for an empty month (no NaN/undefined/crash)', () => {
    expect(computeMenopauseMonthlySummary({}, YEAR, AUGUST)).toEqual({
      daysWithSymptoms: 0,
      hotFlashDays: 0,
      nightSweatNights: 0,
      fatigueDays: 0,
    });
  });

  it('matches the controlled 24/25 August test matrix — step 1', () => {
    const entriesByDate = {
      '2026-08-24': entry('2026-08-24', ['sleep_disturbances']),
      '2026-08-25': entry('2026-08-25', ['hot_flashes', 'fatigue']),
    };

    expect(computeMenopauseMonthlySummary(entriesByDate, YEAR, AUGUST)).toEqual({
      daysWithSymptoms: 2,
      hotFlashDays: 1,
      nightSweatNights: 0,
      fatigueDays: 1,
    });
  });

  it('matches the controlled test matrix — step 2 (Day 24 symptoms cleared)', () => {
    const entriesByDate = {
      '2026-08-24': entry('2026-08-24', []),
      '2026-08-25': entry('2026-08-25', ['hot_flashes', 'fatigue']),
    };

    expect(computeMenopauseMonthlySummary(entriesByDate, YEAR, AUGUST)).toEqual({
      daysWithSymptoms: 1,
      hotFlashDays: 1,
      nightSweatNights: 0,
      fatigueDays: 1,
    });
  });

  it('matches the controlled test matrix — step 3 (Day 24 gets night_sweats)', () => {
    const entriesByDate = {
      '2026-08-24': entry('2026-08-24', ['night_sweats']),
      '2026-08-25': entry('2026-08-25', ['hot_flashes', 'fatigue']),
    };

    expect(computeMenopauseMonthlySummary(entriesByDate, YEAR, AUGUST)).toEqual({
      daysWithSymptoms: 2,
      hotFlashDays: 1,
      nightSweatNights: 1,
      fatigueDays: 1,
    });
  });

  it('counts a day with multiple symptoms only once per metric (no duplicate counting)', () => {
    const entriesByDate = {
      '2026-08-25': entry('2026-08-25', ['hot_flashes', 'night_sweats', 'fatigue', 'sleep_disturbances']),
    };

    expect(computeMenopauseMonthlySummary(entriesByDate, YEAR, AUGUST)).toEqual({
      daysWithSymptoms: 1,
      hotFlashDays: 1,
      nightSweatNights: 1,
      fatigueDays: 1,
    });
  });

  it('excludes entries outside the requested month (month-boundary isolation)', () => {
    const entriesByDate = {
      '2026-08-31': entry('2026-08-31', ['hot_flashes']),
      '2026-09-01': entry('2026-09-01', ['night_sweats']),
    };

    expect(computeMenopauseMonthlySummary(entriesByDate, YEAR, AUGUST)).toEqual({
      daysWithSymptoms: 1,
      hotFlashDays: 1,
      nightSweatNights: 0,
      fatigueDays: 0,
    });

    expect(computeMenopauseMonthlySummary(entriesByDate, YEAR, SEPTEMBER)).toEqual({
      daysWithSymptoms: 1,
      hotFlashDays: 0,
      nightSweatNights: 1,
      fatigueDays: 0,
    });
  });

  it('excludes entries from the same month/day but a different year', () => {
    const entriesByDate = {
      '2025-08-24': entry('2025-08-24', ['hot_flashes']),
      '2026-08-24': entry('2026-08-24', ['fatigue']),
    };

    expect(computeMenopauseMonthlySummary(entriesByDate, YEAR, AUGUST)).toEqual({
      daysWithSymptoms: 1,
      hotFlashDays: 0,
      nightSweatNights: 0,
      fatigueDays: 1,
    });
  });

  it('does not infer fatigue from energyLevel or other non-symptom fields', () => {
    const entriesByDate: Record<string, MenopauseJournalEntry> = {
      '2026-08-24': {date: '2026-08-24', energyLevel: 'low', mood: 'tired', symptoms: []},
    };

    expect(computeMenopauseMonthlySummary(entriesByDate, YEAR, AUGUST).fatigueDays).toBe(0);
  });
});
