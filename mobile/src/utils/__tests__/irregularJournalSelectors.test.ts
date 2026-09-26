import {
  classifyIrregularPeriodDay,
  collectActualPeriodDayKeys,
  deriveIrregularPeriodEpisodes,
  getIrregularFatigueSymptoms,
  isActualPeriodDay,
  resolveIrregularPeriodStarts,
  resolveLatestIrregularPeriodDuration,
  resolveLatestIrregularPeriodStart,
  type IrregularPeriodSources,
} from '../irregularJournalSelectors';
import {computeIrregularCycleDay} from '../irregularDailyTrackingMath';
import {calculateAverageCycleDuration, filterStartKeysForPeriod} from '../cycleStatisticsMath';
import {calculateAssociatedSymptomFrequency} from '../irregularStatisticsMath';
import {computeIrregularMonthlySummary, countPeriodDaysInMonth} from '../irregularCalendarMath';
import type {IrregularJournalEntry} from '../../state/irregularJournalStore';
import type {DailyJournalEntry} from '../../types/journal';
import type {ConfirmedPeriodOccurrence} from '../../state/confirmedPeriodHistoryStore';

const journal = (date: string, intensity?: NonNullable<DailyJournalEntry['flow']>['intensity']): DailyJournalEntry => ({
  id: date,
  date,
  ...(intensity ? {flow: {intensity}} : {}),
});

const sopk = (
  date: string,
  status?: 'yes' | 'no' | 'spotting',
  fields: Partial<IrregularJournalEntry> = {},
): IrregularJournalEntry => ({
  date,
  ...(status ? {details: {period: {status}}} : {}),
  ...fields,
});

const noSources = (over: Partial<IrregularPeriodSources> = {}): IrregularPeriodSources => ({
  periodDayKeys: [],
  confirmedHistory: [],
  declaredLastPeriodDate: null,
  ...over,
});

const at = (key: string) => new Date(`${key}T12:00:00`);

describe('B/C/D — classifyIrregularPeriodDay: No / Spotting / actual flow', () => {
  it('"Non" (flow none + status no) is NOT a period day', () => {
    const kind = classifyIrregularPeriodDay({intensity: 'none'}, sopk('2026-09-10', 'no'));
    expect(kind).toBe('no-bleeding');
    expect(isActualPeriodDay({intensity: 'none'}, sopk('2026-09-10', 'no'))).toBe(false);
  });

  it('"Spotting" (flow none + status spotting) stays spotting and is NOT a period day', () => {
    expect(classifyIrregularPeriodDay({intensity: 'none'}, sopk('2026-09-10', 'spotting'))).toBe('spotting');
    expect(isActualPeriodDay({intensity: 'none'}, sopk('2026-09-10', 'spotting'))).toBe(false);
  });

  it.each(['light', 'moderate', 'heavy', 'veryHeavy'] as const)('actual flow "%s" IS a period day', intensity => {
    expect(classifyIrregularPeriodDay({intensity}, sopk('2026-09-10', 'yes'))).toBe('period');
    // ...whichever screen recorded it (the shared flow screen has no SOPK entry at all):
    expect(classifyIrregularPeriodDay({intensity}, undefined)).toBe('period');
  });

  it('a bare flow "none" with no SOPK entry is "no bleeding", never a period', () => {
    expect(classifyIrregularPeriodDay({intensity: 'none'}, undefined)).toBe('no-bleeding');
  });

  it('nothing recorded → null', () => {
    expect(classifyIrregularPeriodDay(undefined, undefined)).toBeNull();
    expect(classifyIrregularPeriodDay(undefined, sopk('2026-09-10'))).toBeNull();
  });

  it('falls back on the SOPK status when the shared flow record is missing', () => {
    expect(classifyIrregularPeriodDay(undefined, sopk('2026-09-10', 'yes'))).toBe('period');
    expect(classifyIrregularPeriodDay(undefined, sopk('2026-09-10', 'spotting'))).toBe('spotting');
    expect(classifyIrregularPeriodDay(undefined, sopk('2026-09-10', 'no'))).toBe('no-bleeding');
  });

  it('collectActualPeriodDayKeys keeps only actual period days', () => {
    const keys = collectActualPeriodDayKeys(
      [journal('2026-09-25', 'moderate'), journal('2026-09-26', 'none'), journal('2026-09-27', 'none'), journal('2026-09-28', 'heavy')],
      {'2026-09-26': sopk('2026-09-26', 'no'), '2026-09-27': sopk('2026-09-27', 'spotting')},
    );
    expect(keys).toEqual(['2026-09-25', '2026-09-28']);
  });
});

describe('B/C — calendar month counts', () => {
  const entries = [
    journal('2026-09-01', 'moderate'),
    journal('2026-09-02', 'light'),
    journal('2026-09-03', 'none'), // Non
    journal('2026-09-04', 'none'), // Spotting
  ];
  const byDate = {'2026-09-03': sopk('2026-09-03', 'no'), '2026-09-04': sopk('2026-09-04', 'spotting')};

  it('counts only actual period days — not "Non", not "Spotting"', () => {
    expect(countPeriodDaysInMonth(entries, 2026, 8, byDate)).toBe(2);
    expect(computeIrregularMonthlySummary(byDate, entries, 2026, 8).periodDays).toBe(2);
  });

  it('even without the SOPK entries a flow of "none" is never counted', () => {
    expect(countPeriodDaysInMonth(entries, 2026, 8)).toBe(2);
  });
});

describe('A — cycle day follows the most recent real period start', () => {
  const declared = '2026-09-01';

  it('before any new period: counts from the onboarding answer', () => {
    const start = resolveLatestIrregularPeriodStart(noSources({declaredLastPeriodDate: declared}));
    expect(start).toBe('2026-09-01');
    expect(computeIrregularCycleDay(at(start!), at('2026-09-24'))).toBe(24);
  });

  it('a NEW actual period on Sept 25 becomes the reference: Sept 25 → day 1, Sept 26 → day 2', () => {
    const sources = noSources({declaredLastPeriodDate: declared, periodDayKeys: ['2026-09-25']});
    const start = resolveLatestIrregularPeriodStart(sources, '2026-09-25');
    expect(start).toBe('2026-09-25');
    expect(computeIrregularCycleDay(at(start!), at('2026-09-25'))).toBe(1);

    const later = resolveLatestIrregularPeriodStart(sources, '2026-09-26');
    expect(computeIrregularCycleDay(at(later!), at('2026-09-26'))).toBe(2);
    expect(computeIrregularCycleDay(at(later!), at('2026-10-05'))).toBe(11);
  });

  it('later days of the same period do not restart the count', () => {
    const sources = noSources({
      declaredLastPeriodDate: declared,
      periodDayKeys: ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-29'],
    });
    expect(resolveLatestIrregularPeriodStart(sources, '2026-09-30')).toBe('2026-09-25');
  });

  it('"Non" / "Spotting" never restart the count (they are not period days)', () => {
    const periodDayKeys = collectActualPeriodDayKeys(
      [journal('2026-09-25', 'none'), journal('2026-09-26', 'none')],
      {'2026-09-25': sopk('2026-09-25', 'spotting'), '2026-09-26': sopk('2026-09-26', 'no')},
    );
    const start = resolveLatestIrregularPeriodStart(noSources({declaredLastPeriodDate: declared, periodDayKeys}), '2026-09-26');
    expect(start).toBe('2026-09-01');
    expect(computeIrregularCycleDay(at(start!), at('2026-09-26'))).toBe(26);
  });

  it('spotting right before real flow: the start is the first ACTUAL flow day', () => {
    const periodDayKeys = collectActualPeriodDayKeys(
      [journal('2026-09-24', 'none'), journal('2026-09-25', 'light')],
      {'2026-09-24': sopk('2026-09-24', 'spotting')},
    );
    expect(resolveLatestIrregularPeriodStart(noSources({declaredLastPeriodDate: declared, periodDayKeys}))).toBe('2026-09-25');
  });

  it('a period start in the future is ignored (as-of guard)', () => {
    const sources = noSources({declaredLastPeriodDate: declared, periodDayKeys: ['2026-10-20']});
    expect(resolveLatestIrregularPeriodStart(sources, '2026-09-30')).toBe('2026-09-01');
  });

  it('no period known at all → null (never a fabricated day 1)', () => {
    expect(resolveLatestIrregularPeriodStart(noSources())).toBeNull();
    expect(computeIrregularCycleDay(null, at('2026-09-26'))).toBeNull();
  });

  it('the same period declared AND recorded is one start, not two', () => {
    const sources = noSources({declaredLastPeriodDate: '2026-09-01', periodDayKeys: ['2026-09-02', '2026-09-03']});
    expect(resolveIrregularPeriodStarts(sources)).toEqual(['2026-09-01']);
  });

  it('a cycle-confirmed occurrence (ISO datetime start) is understood', () => {
    const confirmed: ConfirmedPeriodOccurrence = {
      id: '2026-09-25',
      periodStart: new Date(2026, 8, 25).toISOString(),
      periodEndDateTime: new Date(2026, 8, 29, 20).toISOString(),
      capturedAt: new Date(2026, 8, 29, 20).toISOString(),
    };
    const sources = noSources({declaredLastPeriodDate: declared, confirmedHistory: [confirmed]});
    expect(resolveLatestIrregularPeriodStart(sources)).toBe('2026-09-25');
    expect(resolveLatestIrregularPeriodDuration(sources, '2026-10-02')).toBe(5);
  });
});

describe('deriveIrregularPeriodEpisodes', () => {
  it('groups recorded days into periods; a gap in logging does not create a new period', () => {
    const episodes = deriveIrregularPeriodEpisodes(['2026-09-25', '2026-09-27', '2026-09-28', '2026-11-02']);
    expect(episodes).toEqual([
      {start: '2026-09-25', end: '2026-09-28', spanDays: 4},
      {start: '2026-11-02', end: '2026-11-02', spanDays: 1},
    ]);
  });
});

describe('period duration — only when it can be stated from real data', () => {
  it('a finished recorded period has a duration; an ongoing one does not', () => {
    const sources = noSources({periodDayKeys: ['2026-09-25', '2026-09-26', '2026-09-27']});
    expect(resolveLatestIrregularPeriodDuration(sources, '2026-09-30')).toBe(3);
    expect(resolveLatestIrregularPeriodDuration(sources, '2026-09-27')).toBeNull();
  });

  it('nothing recorded → null', () => {
    expect(resolveLatestIrregularPeriodDuration(noSources({declaredLastPeriodDate: '2026-09-01'}), '2026-09-30')).toBeNull();
  });
});

describe('F/G — average cycle duration data', () => {
  const now = new Date('2026-10-15T12:00:00');

  it('F. a single period start → no invented average', () => {
    const starts = resolveIrregularPeriodStarts(noSources({periodDayKeys: ['2026-09-25']}));
    expect(calculateAverageCycleDuration(filterStartKeysForPeriod(starts, '3', now))).toBeNull();
  });

  it('F. onboarding answer alone (no recorded period) → no invented average', () => {
    const starts = resolveIrregularPeriodStarts(noSources({declaredLastPeriodDate: '2026-09-01'}));
    expect(calculateAverageCycleDuration(filterStartKeysForPeriod(starts, '3', now))).toBeNull();
  });

  it('G. two real starts (Sept 1 declared + Sept 25 recorded) → a real 24-day cycle', () => {
    const starts = resolveIrregularPeriodStarts(
      noSources({declaredLastPeriodDate: '2026-09-01', periodDayKeys: ['2026-09-25', '2026-09-26']}),
    );
    expect(calculateAverageCycleDuration(filterStartKeysForPeriod(starts, '3', now))).toEqual({
      averageDays: 24,
      cyclesAnalyzed: 1,
    });
  });

  it('G. three recorded starts average the real gaps', () => {
    const starts = resolveIrregularPeriodStarts(noSources({periodDayKeys: ['2026-07-01', '2026-07-31', '2026-09-04']}));
    // gaps: 30 and 35 → average 32.5 → 33 (existing rounding)
    expect(calculateAverageCycleDuration(filterStartKeysForPeriod(starts, '6', now))).toEqual({
      averageDays: 33,
      cyclesAnalyzed: 2,
    });
  });
});

describe('E — fatigue associated symptoms: one canonical shape, legacy still readable', () => {
  it('reads the canonical top-level symptoms', () => {
    expect(getIrregularFatigueSymptoms({date: '2026-09-10', fatigue: 'Forte', symptoms: ['Nausées']})).toEqual(['Nausées']);
  });

  it('falls back on the legacy details.fatigue.symptoms', () => {
    expect(
      getIrregularFatigueSymptoms({date: '2026-09-10', fatigue: 'Forte', details: {fatigue: {symptoms: ['Crampes']}}}),
    ).toEqual(['Crampes']);
  });

  it('an explicitly saved empty selection wins over a legacy copy', () => {
    expect(
      getIrregularFatigueSymptoms({
        date: '2026-09-10',
        symptoms: [],
        details: {fatigue: {symptoms: ['Crampes']}},
      }),
    ).toEqual([]);
  });

  it('never reads the pain category\'s own symptoms', () => {
    expect(getIrregularFatigueSymptoms({date: '2026-09-10', details: {pain: {symptoms: ['Dos']}}})).toEqual([]);
  });

  it('Statistics frequency counts symptoms saved in either shape', () => {
    const frequency = calculateAssociatedSymptomFrequency([
      {date: '2026-09-01', fatigue: 'Forte', symptoms: ['Nausées', 'Crampes']},
      {date: '2026-09-02', fatigue: 'Légère', details: {fatigue: {symptoms: ['Nausées']}}},
    ]);
    expect(frequency).toEqual([
      {name: 'Nausées', days: 2},
      {name: 'Crampes', days: 1},
    ]);
  });
});
