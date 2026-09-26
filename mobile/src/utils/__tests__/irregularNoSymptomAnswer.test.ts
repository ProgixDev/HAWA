import type {IrregularJournalEntry} from '../../state/irregularJournalStore';
import {computeIrregularMonthlySummary} from '../irregularCalendarMath';
import {
  calculateAssociatedSymptomFrequency,
  calculateCategoryDistribution,
  countCategoryDays,
  countCategorySymptomDays,
  countDaysWithAnySymptom,
} from '../irregularStatisticsMath';
import {hasIrregularCategoryOccurrence, isIrregularSymptomAnswer} from '../irregularJournalSelectors';
import {computeIrregularDailyProgress} from '../irregularDailyTrackingMath';

// M23 — "Aucune" (the explicit no-symptom answer of the SOPK acné / pilosité /
// douleurs / fatigue journals) is an answered day, never a positive symptom.
const day = (date: string, fields: Partial<IrregularJournalEntry> = {}): IrregularJournalEntry => ({date, ...fields});

describe('isIrregularSymptomAnswer / hasIrregularCategoryOccurrence', () => {
  it('unanswered, empty and "Aucune" are not symptoms; a real answer is', () => {
    expect(isIrregularSymptomAnswer(undefined)).toBe(false);
    expect(isIrregularSymptomAnswer('')).toBe(false);
    expect(isIrregularSymptomAnswer('Aucune')).toBe(false);
    expect(isIrregularSymptomAnswer(' aucune ')).toBe(false);
    expect(isIrregularSymptomAnswer('Légère')).toBe(true);
    expect(isIrregularSymptomAnswer('Très forte')).toBe(true);
  });

  it('fatigue "Aucune" with a real associated symptom still holds a symptom occurrence', () => {
    expect(hasIrregularCategoryOccurrence(day('2026-09-01', {fatigue: 'Aucune', symptoms: []}), 'fatigue')).toBe(false);
    expect(hasIrregularCategoryOccurrence(day('2026-09-01', {fatigue: 'Aucune', symptoms: ['Nausées']}), 'fatigue')).toBe(true);
    expect(hasIrregularCategoryOccurrence(day('2026-09-01', {fatigue: 'Légère'}), 'fatigue')).toBe(true);
    expect(hasIrregularCategoryOccurrence(undefined, 'acne')).toBe(false);
  });

  it('mood and weight (no "Aucune" option) are simply recorded', () => {
    expect(hasIrregularCategoryOccurrence(day('2026-09-01', {mood: 'Bien'}), 'mood')).toBe(true);
    expect(hasIrregularCategoryOccurrence(day('2026-09-01', {weight: '68 kg'}), 'weight')).toBe(true);
    expect(hasIrregularCategoryOccurrence(day('2026-09-01'), 'mood')).toBe(false);
  });
});

describe('Statistics — days with a symptom', () => {
  it('unanswered days are not counted anywhere', () => {
    const entries = [day('2026-09-01'), day('2026-09-02', {mood: 'Bien'})];
    expect(countDaysWithAnySymptom(entries)).toBe(0);
    expect(countCategorySymptomDays(entries, 'acne')).toBe(0);
    expect(countCategoryDays(entries, 'acne')).toBe(0);
  });

  it('"Aucune" is answered (tracked) but is not a symptom day', () => {
    const entries = [
      day('2026-09-01', {acne: 'Aucune'}),
      day('2026-09-02', {hairGrowth: 'Aucune', pain: 'Aucune', fatigue: 'Aucune', symptoms: []}),
    ];
    expect(countDaysWithAnySymptom(entries)).toBe(0);
    expect(countCategorySymptomDays(entries, 'acne')).toBe(0);
    expect(countCategoryDays(entries, 'acne')).toBe(1); // answered day, unchanged semantics
    // the answer distribution keeps the honest "Aucune" bucket
    expect(calculateCategoryDistribution(entries, 'acne')).toEqual([{value: 'Aucune', days: 1}]);
  });

  it('one symptom: that day counts, the "Aucune" day does not', () => {
    const entries = [day('2026-09-01', {acne: 'Aucune'}), day('2026-09-02', {acne: 'Légère'})];
    expect(countDaysWithAnySymptom(entries)).toBe(1);
    expect(countCategorySymptomDays(entries, 'acne')).toBe(1);
  });

  it('multiple symptoms on one day count as ONE symptom day; mixed with "Aucune" answers', () => {
    const entries = [
      day('2026-09-01', {acne: 'Modérée', pain: 'Forte', hairGrowth: 'Aucune'}),
      day('2026-09-02', {fatigue: 'Aucune', symptoms: ['Crampes']}),
      day('2026-09-03', {pain: 'Aucune'}),
    ];
    expect(countDaysWithAnySymptom(entries)).toBe(2);
    expect(countCategorySymptomDays(entries, 'pain')).toBe(1);
  });

  it('associated-symptom frequency never counts an "Aucune" selection', () => {
    const entries = [
      day('2026-09-01', {fatigue: 'Légère', symptoms: ['Nausées', 'Aucune']}),
      day('2026-09-02', {fatigue: 'Aucune', symptoms: ['Nausées']}),
    ];
    expect(calculateAssociatedSymptomFrequency(entries)).toEqual([{name: 'Nausées', days: 2}]);
  });
});

describe('Calendar monthly summary — "jours avec ..." tiles', () => {
  it('excludes "Aucune", counts real answers, keeps mood/weight as recorded', () => {
    const byDate = {
      '2026-09-01': day('2026-09-01', {acne: 'Aucune', pain: 'Aucune', hairGrowth: 'Aucune', fatigue: 'Aucune'}),
      '2026-09-02': day('2026-09-02', {acne: 'Légère', pain: 'Forte', mood: 'Bien', weight: '68 kg'}),
      '2026-09-03': day('2026-09-03', {fatigue: 'Modérée', hairGrowth: 'Légère'}),
    };
    const summary = computeIrregularMonthlySummary(byDate, [], 2026, 8);
    expect(summary.acneDays).toBe(1);
    expect(summary.painDays).toBe(1);
    expect(summary.hairGrowthDays).toBe(1);
    expect(summary.fatigueDays).toBe(1);
    expect(summary.moodDays).toBe(1);
    expect(summary.weightDays).toBe(1);
    // an answered "Aucune" day is still data for the month
    expect(summary.hasAnyDataThisMonth).toBe(true);
  });

  it('only "Aucune" answers: every symptom tile is 0 but the month has data', () => {
    const summary = computeIrregularMonthlySummary({'2026-09-01': day('2026-09-01', {acne: 'Aucune'})}, [], 2026, 8);
    expect(summary.acneDays).toBe(0);
    expect(summary.hasAnyDataThisMonth).toBe(true);
  });
});

describe('Dashboard "Suivi du jour" completion is presence based (unchanged)', () => {
  it('an "Aucune" answer still counts as a completed category', () => {
    const progress = computeIrregularDailyProgress(false, day('2026-09-01', {acne: 'Aucune', pain: 'Légère'}), [
      'acne',
      'pain',
      'mood',
    ]);
    expect(progress).toEqual({completed: 2, total: 4});
  });
});
