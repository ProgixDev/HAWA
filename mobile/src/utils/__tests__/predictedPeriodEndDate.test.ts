import {predictedPeriodEndDate} from '../cycleMath';

// "Fin prévue vers le …" (Horaires de prière): an estimate is returned only when it is an honest forecast — never from the proposed 5 days, never for an
// irregular / unknown cycle, and never for an end that the person herself entered, edited or confirmed.
const day = (year: number, month: number, date: number) => new Date(year, month - 1, date, 9, 0, 0);
const key = (date: Date | null) => (date ? date.toLocaleDateString('en-CA') : null);
const basicsOf = (start: Date, periodDuration: number) => ({lastPeriodStart: start, periodDuration, cycleDuration: 29});
const explicit = {durationExplicit: true, periodEndDateTime: null};

describe('the date itself', () => {
  it('14 Nov + 5 days → 18 Nov (a 29-day CYCLE is not a 29-day period)', () => {
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 11, 14), 5), 'yes', [], day(2026, 11, 15), explicit))).toBe('2026-11-18');
  });

  it('14 Nov + 6 days → 19 Nov', () => {
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 11, 14), 6), 'yes', [], day(2026, 11, 15), explicit))).toBe('2026-11-19');
  });

  it('6 Nov + 5 days → 10 Nov: still valid on 10 Nov, and no longer shown on 18 Nov', () => {
    const basics = basicsOf(day(2026, 11, 6), 5);
    expect(key(predictedPeriodEndDate(basics, 'yes', [], day(2026, 11, 8), explicit))).toBe('2026-11-10');
    expect(key(predictedPeriodEndDate(basics, 'yes', [], day(2026, 11, 10), explicit))).toBe('2026-11-10');
    expect(predictedPeriodEndDate(basics, 'yes', [], day(2026, 11, 11), explicit)).toBeNull();
    expect(predictedPeriodEndDate(basics, 'yes', [], day(2026, 11, 18), explicit)).toBeNull();
  });

  it('30 Dec + 5 days → 3 Jan of the next year', () => {
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 12, 30), 5), 'yes', [], day(2026, 12, 31), explicit))).toBe('2027-01-03');
  });

  it('month transitions: 29 Oct + 5 days → 2 Nov', () => {
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 10, 29), 5), 'yes', [], day(2026, 10, 30), explicit))).toBe('2026-11-02');
  });

  it('leap year: 27 Feb 2028 + 5 days → 2 Mar (29 Feb exists), while 27 Feb 2026 + 5 days → 3 Mar', () => {
    expect(key(predictedPeriodEndDate(basicsOf(day(2028, 2, 27), 5), 'yes', [], day(2028, 2, 28), explicit))).toBe('2028-03-02');
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 2, 27), 5), 'yes', [], day(2026, 2, 28), explicit))).toBe('2026-03-03');
  });

  it('is not shifted by a daylight-saving change inside the period (26 Oct 2026 in Europe, 8 Mar 2026 in the US)', () => {
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 10, 24), 5), 'yes', [], day(2026, 10, 25), explicit))).toBe('2026-10-28');
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 3, 6), 5), 'yes', [], day(2026, 3, 7), explicit))).toBe('2026-03-10');
  });

  it('a start with a time of day (noon, late evening) lands on the same calendar day', () => {
    expect(key(predictedPeriodEndDate(basicsOf(new Date(2026, 10, 14, 23, 59), 5), 'yes', [], day(2026, 11, 15), explicit))).toBe('2026-11-18');
    expect(key(predictedPeriodEndDate(basicsOf(new Date(2026, 10, 14, 0, 1), 5), 'yes', [], day(2026, 11, 15), explicit))).toBe('2026-11-18');
  });
});

describe('it follows the start and the length', () => {
  it('a later start moves the date by the same number of days; a longer length extends it', () => {
    const today = day(2026, 11, 16);
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 11, 14), 5), 'yes', [], today, explicit))).toBe('2026-11-18');
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 11, 15), 5), 'yes', [], today, explicit))).toBe('2026-11-19');
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 11, 14), 7), 'yes', [], today, explicit))).toBe('2026-11-20');
  });

  it('a record that is still the projection of the usual length gives the same date', () => {
    const projected = [{startDate: '2026-11-14', endDate: '2026-11-18'}];
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 11, 14), 5), 'yes', projected, day(2026, 11, 15), explicit))).toBe('2026-11-18');
  });
});

describe('explicit duration', () => {
  it('the proposed (default) length that was never entered or confirmed gives no prediction', () => {
    expect(predictedPeriodEndDate(basicsOf(day(2026, 11, 14), 5), 'yes', [], day(2026, 11, 15), {durationExplicit: false, periodEndDateTime: null})).toBeNull();
  });

  it('once the length is explicit the prediction appears', () => {
    expect(key(predictedPeriodEndDate(basicsOf(day(2026, 11, 14), 5), 'yes', [], day(2026, 11, 15), explicit))).toBe('2026-11-18');
  });
});

describe('regularity', () => {
  it.each(['no', 'unknown'] as const)('%s cycle: never a prediction', regularity => {
    expect(predictedPeriodEndDate(basicsOf(day(2026, 11, 14), 5), regularity, [], day(2026, 11, 15), explicit)).toBeNull();
  });
});

describe('an end that the person gave versus a prediction', () => {
  const basics = basicsOf(day(2026, 11, 14), 5);
  const today = day(2026, 11, 15);

  it('a declared end (periodEndDateTime) of this period always wins: no prediction', () => {
    expect(predictedPeriodEndDate(basics, 'yes', [], today, {...explicit, periodEndDateTime: day(2026, 11, 15)})).toBeNull();
  });

  it('an end declared for an EARLIER period does not hide this period\'s prediction', () => {
    expect(key(predictedPeriodEndDate(basics, 'yes', [], today, {...explicit, periodEndDateTime: day(2026, 10, 5)}))).toBe('2026-11-18');
  });

  it('a record flagged endConfirmed (range edited / end confirmed) is not presented as a prediction, even when it equals the projection', () => {
    const record = [{startDate: '2026-11-14', endDate: '2026-11-18', endConfirmed: true}];
    expect(predictedPeriodEndDate(basics, 'yes', record, today, explicit)).toBeNull();
  });

  it('a confirmed occurrence listed for this start (older data, no flag) is not presented as a prediction', () => {
    const record = [{startDate: '2026-11-14', endDate: '2026-11-18'}];
    expect(predictedPeriodEndDate(basics, 'yes', record, today, {...explicit, confirmedStartKeys: ['2026-11-14']})).toBeNull();
  });

  it('a confirmed occurrence of ANOTHER period does not matter', () => {
    const record = [{startDate: '2026-11-14', endDate: '2026-11-18'}];
    expect(key(predictedPeriodEndDate(basics, 'yes', record, today, {...explicit, confirmedStartKeys: ['2026-10-14']}))).toBe('2026-11-18');
  });

  it('an end that differs from the projection of the usual length was not produced by the projection: not presented as a prediction', () => {
    const record = [{startDate: '2026-11-14', endDate: '2026-11-16'}];
    expect(predictedPeriodEndDate(basics, 'yes', record, today, explicit)).toBeNull();
  });

  it('merely having an endDate is NOT evidence of a confirmed end: a projected endDate still gives a prediction', () => {
    const record = [{startDate: '2026-11-14', endDate: '2026-11-18'}];
    expect(key(predictedPeriodEndDate(basics, 'yes', record, today, explicit))).toBe('2026-11-18');
  });
});
