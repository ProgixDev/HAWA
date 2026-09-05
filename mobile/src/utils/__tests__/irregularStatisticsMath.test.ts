import {
  calculateAssociatedSymptomFrequency,
  calculateCategoryDistribution,
  calculateMonthlyCategoryTrend,
  calculateIrregularWeightEntries,
  calculateMonthlyIrregularWeightTrend,
  countCategoryDays,
  countDaysWithAnySymptom,
} from '../irregularStatisticsMath';
import type {IrregularJournalEntry} from '../../state/irregularJournalStore';

const entry = (date: string, fields: Partial<IrregularJournalEntry> = {}): IrregularJournalEntry => ({
  date,
  ...fields,
});

describe('calculateCategoryDistribution', () => {
  it('counts only real recorded values for the given category, most-frequent first', () => {
    const entries = [
      entry('2026-08-01', {acne: 'Légère'}),
      entry('2026-08-02', {acne: 'Légère'}),
      entry('2026-08-03', {acne: 'Modérée'}),
      entry('2026-08-04', {}), // no acne recorded — must be excluded, never counted as "Aucune"
    ];
    expect(calculateCategoryDistribution(entries, 'acne')).toEqual([
      {value: 'Légère', days: 2},
      {value: 'Modérée', days: 1},
    ]);
  });

  it('returns an empty array when the category is never recorded', () => {
    expect(calculateCategoryDistribution([entry('2026-08-01', {})], 'pain')).toEqual([]);
  });

  it('never invents a severity bucket — only real stored string values appear', () => {
    const entries = [entry('2026-08-01', {mood: 'Bien'})];
    expect(calculateCategoryDistribution(entries, 'mood')).toEqual([{value: 'Bien', days: 1}]);
  });
});

describe('countCategoryDays', () => {
  it('counts distinct days a category was recorded', () => {
    const entries = [
      entry('2026-08-01', {fatigue: 'Modérée'}),
      entry('2026-08-02', {}),
      entry('2026-08-03', {fatigue: 'Légère'}),
    ];
    expect(countCategoryDays(entries, 'fatigue')).toBe(2);
  });
});

describe('countDaysWithAnySymptom', () => {
  it('counts a day once even if several symptom categories are recorded that day', () => {
    const entries = [entry('2026-08-01', {acne: 'Légère', pain: 'Forte', fatigue: 'Légère'})];
    expect(countDaysWithAnySymptom(entries)).toBe(1);
  });

  it('excludes mood and weight — only acne/hairGrowth/pain/fatigue count as symptoms', () => {
    const entries = [entry('2026-08-01', {mood: 'Bien', weight: '68 kg'})];
    expect(countDaysWithAnySymptom(entries)).toBe(0);
  });

  it('never counts a day with no entry as symptom-free', () => {
    expect(countDaysWithAnySymptom([])).toBe(0);
  });
});

describe('calculateMonthlyCategoryTrend', () => {
  it('groups real category values by real calendar month and omits months with none', () => {
    const entries = [
      entry('2026-06-01', {pain: 'Légère'}),
      entry('2026-07-01', {}), // nothing recorded this month — must not appear as an empty month
      entry('2026-08-10', {pain: 'Forte'}),
    ];
    const trend = calculateMonthlyCategoryTrend(entries, 'pain');
    expect(trend.map(month => month.monthKey)).toEqual(['2026-06', '2026-08']);
    expect(trend[0].distribution).toEqual([{value: 'Légère', days: 1}]);
    expect(trend[1].distribution).toEqual([{value: 'Forte', days: 1}]);
  });
});

describe('calculateAssociatedSymptomFrequency', () => {
  it('counts real multi-selected symptoms across days, most-frequent first', () => {
    const entries = [
      entry('2026-08-01', {symptoms: ['Ballonnements', 'Nausées']}),
      entry('2026-08-02', {symptoms: ['Ballonnements']}),
      entry('2026-08-03', {}), // nothing selected — never counted against any symptom
    ];
    expect(calculateAssociatedSymptomFrequency(entries)).toEqual([
      {name: 'Ballonnements', days: 2},
      {name: 'Nausées', days: 1},
    ]);
  });

  it('returns an empty array when no symptoms were ever multi-selected', () => {
    expect(calculateAssociatedSymptomFrequency([entry('2026-08-01', {fatigue: 'Légère'})])).toEqual([]);
  });

  it('an explicitly saved empty symptoms array contributes nothing — never a fabricated entry', () => {
    expect(calculateAssociatedSymptomFrequency([entry('2026-08-01', {fatigue: 'Légère', symptoms: []})])).toEqual([]);
  });
});

describe('calculateIrregularWeightEntries', () => {
  it('extracts only real recorded weight strings, sorted chronologically, never parsed/converted', () => {
    const entries = [
      entry('2026-08-05', {weight: '68,2 kg'}),
      entry('2026-08-01', {weight: '67,9 kg'}),
      entry('2026-08-03', {}), // no weight recorded — must be excluded, never treated as 0
    ];
    expect(calculateIrregularWeightEntries(entries)).toEqual([
      {date: '2026-08-01', value: '67,9 kg'},
      {date: '2026-08-05', value: '68,2 kg'},
    ]);
  });

  it('returns an empty array when weight is never recorded', () => {
    expect(calculateIrregularWeightEntries([entry('2026-08-01', {})])).toEqual([]);
  });
});

describe('calculateMonthlyIrregularWeightTrend', () => {
  it('groups real weight entries by real calendar month and omits months with none', () => {
    const entries = [
      entry('2026-06-01', {weight: '68 kg'}),
      entry('2026-07-01', {}), // no weight this month — must not appear as an empty/zero month
      entry('2026-08-10', {weight: '69 kg'}),
    ];
    const trend = calculateMonthlyIrregularWeightTrend(entries);
    expect(trend.map(month => month.monthKey)).toEqual(['2026-06', '2026-08']);
    expect(trend[0].entries).toEqual([{date: '2026-06-01', value: '68 kg'}]);
    expect(trend[1].entries).toEqual([{date: '2026-08-10', value: '69 kg'}]);
  });
});
