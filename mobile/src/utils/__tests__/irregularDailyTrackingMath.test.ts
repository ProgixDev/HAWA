import {
  computeConfirmedPeriodDurationDays,
  computeIrregularCycleDay,
  computeIrregularDailyProgress,
  computeWeightVariation,
  findLatestConfirmedPeriod,
  prioritizeIrregularCategories,
} from '../irregularDailyTrackingMath';
import type {IrregularJournalEntry} from '../../state/irregularJournalStore';
import type {ConfirmedPeriodOccurrence} from '../../state/confirmedPeriodHistoryStore';

const occurrence = (
  id: string,
  periodStart: string,
  periodEndDateTime: string,
): ConfirmedPeriodOccurrence => ({id, periodStart, periodEndDateTime, capturedAt: periodEndDateTime});

describe('computeIrregularCycleDay', () => {
  it('returns null — never a fabricated day 1 — when no real period has been confirmed', () => {
    expect(computeIrregularCycleDay(null, new Date(2026, 7, 26))).toBeNull();
  });

  it('computes a plain elapsed-day count from a real confirmed period start', () => {
    // 1 August -> 26 August is 25 days later, so day 26 of the cycle.
    expect(computeIrregularCycleDay(new Date(2026, 7, 1), new Date(2026, 7, 26))).toBe(26);
  });

  it('a very long real gap keeps counting — it is NEVER classified as late', () => {
    // 45 days since the last confirmed period start — still just a day count.
    const lastPeriodStart = new Date(2026, 5, 1);
    const today = new Date(2026, 6, 15); // 44 days later -> day 45
    const result = computeIrregularCycleDay(lastPeriodStart, today);
    expect(result).toBe(45);
    // Structural guarantee: the return type is a plain number (or null),
    // never an object that could carry an `isLate`/"retard" field.
    expect(typeof result).toBe('number');
  });
});

describe('computeIrregularDailyProgress', () => {
  const categories = ['acne', 'hairGrowth', 'weight', 'pain', 'mood', 'fatigue'] as const;

  it('0/7 when nothing is recorded today', () => {
    expect(computeIrregularDailyProgress(false, undefined, categories)).toEqual({completed: 0, total: 7});
  });

  it('counts the period entry plus every genuinely recorded category, never more', () => {
    const entry: IrregularJournalEntry = {date: '2026-08-26', acne: 'Légère', weight: '68 kg'};
    // Règles done (1) + acne (1) + weight (1) = 3, out of 7 real categories.
    expect(computeIrregularDailyProgress(true, entry, categories)).toEqual({completed: 3, total: 7});
  });

  it('a missing field is never counted as complete, even when the entry object exists', () => {
    const entry: IrregularJournalEntry = {date: '2026-08-26', mood: 'Bien'};
    expect(computeIrregularDailyProgress(false, entry, categories)).toEqual({completed: 1, total: 7});
  });

  it('total is always exactly the real configured category count + Règles, never hardcoded', () => {
    const fewerCategories = ['acne', 'weight'] as const;
    expect(computeIrregularDailyProgress(false, undefined, fewerCategories).total).toBe(3);
  });

  it('editing a category (overwriting its value) still counts as exactly 1, never double-counted', () => {
    // saveIrregularJournalField upserts in place, so the snapshot this
    // function reads only ever has ONE value per category regardless of how
    // many times it was edited beforehand.
    const entry: IrregularJournalEntry = {date: '2026-08-26', acne: 'Modérée'};
    expect(computeIrregularDailyProgress(false, entry, categories)).toEqual({completed: 1, total: 7});
  });

  it('an explicit "Aucune" value counts as completed — a real intentional save, not missing data', () => {
    const entry: IrregularJournalEntry = {date: '2026-08-26', pain: 'Aucune'};
    expect(computeIrregularDailyProgress(false, entry, categories)).toEqual({completed: 1, total: 7});
  });

  it('a category screen opened but never saved leaves no field on the entry — never counted', () => {
    // Opening IrregularJournalEntryScreen without pressing "Enregistrer"
    // never calls saveIrregularJournalField, so the field stays absent —
    // identical, at this pure-math layer, to `undefined` above.
    const entry: IrregularJournalEntry = {date: '2026-08-26'};
    expect(computeIrregularDailyProgress(false, entry, categories)).toEqual({completed: 0, total: 7});
  });
});

describe('computeWeightVariation', () => {
  it('returns null when there is no previous measurement — never a fabricated variation', () => {
    expect(computeWeightVariation(undefined, '68 kg')).toBeNull();
  });

  it('computes a neutral signed difference with the same unit the user typed', () => {
    expect(computeWeightVariation('68,5 kg', '68,2 kg')).toBe('−0,3 kg');
    expect(computeWeightVariation('67,9 kg', '69 kg')).toBe('+1,1 kg');
  });

  it('returns "0" (with unit) when the measurement is unchanged', () => {
    expect(computeWeightVariation('68 kg', '68 kg')).toBe('0 kg');
  });

  it('never compares mismatched units — returns null instead of a meaningless delta', () => {
    expect(computeWeightVariation('150 lb', '68 kg')).toBeNull();
  });

  it('never invents a variation when a value cannot be parsed as a number', () => {
    expect(computeWeightVariation('environ 68 kg', '68 kg')).toBeNull();
  });

  it('never judges the direction as good/bad — the result is a plain signed string', () => {
    const result = computeWeightVariation('68 kg', '70 kg');
    expect(result).toBe('+2 kg');
    expect(result).not.toMatch(/bien|mal|sain|améliorat|aggrav/i);
  });
});

describe('findLatestConfirmedPeriod', () => {
  it('returns null — never a fabricated period — when nothing has ever been confirmed', () => {
    expect(findLatestConfirmedPeriod([])).toBeNull();
  });

  it('returns the single confirmed occurrence when only one exists', () => {
    const only = occurrence('a', '2026-08-01', '2026-08-06T10:00:00.000Z');
    expect(findLatestConfirmedPeriod([only])).toBe(only);
  });

  it('picks the most recent occurrence by periodStart, never the first one recorded', () => {
    const older = occurrence('a', '2026-06-01', '2026-06-06T10:00:00.000Z');
    const newer = occurrence('b', '2026-08-19', '2026-08-24T10:00:00.000Z');
    expect(findLatestConfirmedPeriod([older, newer])).toBe(newer);
    expect(findLatestConfirmedPeriod([newer, older])).toBe(newer);
  });
});

describe('computeConfirmedPeriodDurationDays', () => {
  it('computes a real inclusive day count from a confirmed occurrence', () => {
    // 19 Aug -> 25 Aug inclusive = 7 days, never a hardcoded default.
    const period = occurrence('a', '2026-08-19', '2026-08-25T18:00:00.000Z');
    expect(computeConfirmedPeriodDurationDays(period)).toBe(7);
  });

  it('a single-day confirmed period counts as 1 day, never "0 jour"', () => {
    const period = occurrence('a', '2026-08-19', '2026-08-19T18:00:00.000Z');
    expect(computeConfirmedPeriodDurationDays(period)).toBe(1);
  });

  it('returns null — never a fabricated duration — for an inconsistent stored record', () => {
    const corrupted = occurrence('a', '2026-08-19', '2026-08-10T18:00:00.000Z');
    expect(computeConfirmedPeriodDurationDays(corrupted)).toBeNull();
  });
});

describe('prioritizeIrregularCategories', () => {
  it('moves selected categories first without hiding or duplicating any category', () => {
    const all = ['acne', 'hairGrowth', 'weight', 'pain', 'mood', 'fatigue'];
    const result = prioritizeIrregularCategories(all, ['weight', 'mood']);
    expect(result).toEqual(['weight', 'mood', 'acne', 'hairGrowth', 'pain', 'fatigue']);
    expect(result).toHaveLength(all.length);
    expect(new Set(result)).toEqual(new Set(all));
  });

  it('preserves the original order when nothing was selected during onboarding', () => {
    const all = ['acne', 'hairGrowth', 'weight'];
    expect(prioritizeIrregularCategories(all, [])).toEqual(all);
  });

  it('ignores tracked preference ids that are not real categories (e.g. otherSymptoms)', () => {
    const all = ['acne', 'hairGrowth', 'weight'];
    expect(prioritizeIrregularCategories(all, ['otherSymptoms'])).toEqual(all);
  });
});
