import {computeQadaaBalance, describeQadaaBalanceStatus} from '../qadaaBalance';
import {computeQadaaFromHistory} from '../qadaaLogic';
import {isRamadan} from '../hijriCalendar';

const manual = (...quantities: number[]) => quantities.map(quantity => ({quantity}));
const done = (...quantities: number[]) => quantities.map(quantity => ({quantity}));

describe('computeQadaaBalance — the one authoritative formula', () => {
  it('A. automatic only: 4 automatic → total 4, remaining 4', () => {
    const b = computeQadaaBalance(4, [], []);
    expect(b).toMatchObject({automaticDays: 4, manualDays: 0, totalDays: 4, completedDays: 0, remainingDays: 4});
  });

  it('B. manual only: add 2 → total 2', () => {
    const b = computeQadaaBalance(0, manual(2), []);
    expect(b).toMatchObject({automaticDays: 0, manualDays: 2, totalDays: 2, remainingDays: 2});
  });

  it('C. mixed: automatic 4 + manual 2 → total 6', () => {
    const b = computeQadaaBalance(4, manual(2), []);
    expect(b).toMatchObject({automaticDays: 4, manualDays: 2, totalDays: 6, remainingDays: 6});
  });

  it('D. completion: total 6, complete 1 → remaining 5', () => {
    const b = computeQadaaBalance(4, manual(2), done(1));
    expect(b).toMatchObject({totalDays: 6, completedDays: 1, remainingDays: 5});
  });

  it('E. undo completion: remaining returns to 6', () => {
    expect(computeQadaaBalance(4, manual(2), done(1)).remainingDays).toBe(5);
    expect(computeQadaaBalance(4, manual(2), []).remainingDays).toBe(6);
  });

  it('F. edit manual 2 → 3 (completed 1): total 7, remaining 6', () => {
    const b = computeQadaaBalance(4, manual(3), done(1));
    expect(b).toMatchObject({totalDays: 7, completedDays: 1, remainingDays: 6});
  });

  it('G. delete manual: automatic 4 + completed 1 → remaining 3, automatic untouched', () => {
    const b = computeQadaaBalance(4, [], done(1));
    expect(b).toMatchObject({automaticDays: 4, manualDays: 0, totalDays: 4, remainingDays: 3});
  });

  it('several manual entries and several completions are summed', () => {
    const b = computeQadaaBalance(1, manual(5, 7, 3), done(2, 1, 4));
    expect(b).toMatchObject({manualDays: 15, totalDays: 16, completedReportedDays: 7, completedDays: 7, remainingDays: 9});
  });

  describe('M. reconciliation when the total shrinks (BUG-01)', () => {
    it('never negative: completions above the total floor the remaining at 0', () => {
      const b = computeQadaaBalance(3, [], done(5));
      expect(b.remainingDays).toBe(0);
      expect(b.completedDays).toBe(3);
    });

    it('the surplus is REPORTED, not silently dropped', () => {
      const b = computeQadaaBalance(3, [], done(5));
      expect(b.completedReportedDays).toBe(5);
      expect(b.surplusCompletedDays).toBe(2);
    });

    it('the completion records themselves are never trimmed by the formula', () => {
      const completions = done(5);
      computeQadaaBalance(3, [], completions);
      expect(completions).toEqual([{quantity: 5}]);
    });

    it('deterministic: the same inputs always give the same balance (shrink then grow)', () => {
      const completions = done(5);
      expect(computeQadaaBalance(5, [], completions).remainingDays).toBe(0);
      expect(computeQadaaBalance(3, [], completions).remainingDays).toBe(0);
      // The total grows again: the reported completions apply again, visibly.
      expect(computeQadaaBalance(6, [], completions)).toMatchObject({remainingDays: 1, surplusCompletedDays: 0});
    });

    it('manual entries are independent of the automatic part shrinking', () => {
      const before = computeQadaaBalance(6, manual(2), done(1));
      const after = computeQadaaBalance(0, manual(2), done(1));
      expect(before.manualDays).toBe(2);
      expect(after.manualDays).toBe(2);
      expect(after.remainingDays).toBe(1);
    });
  });

  it('sanitises impossible quantities instead of producing NaN / negative balances', () => {
    const b = computeQadaaBalance(NaN, manual(-4, 2.9, Number.NaN), done(-1));
    expect(b.totalDays).toBe(2);
    expect(b.remainingDays).toBe(2);
    expect(Object.values(b).every(value => Number.isFinite(value) && value >= 0)).toBe(true);
  });
});

describe('P. describeQadaaBalanceStatus — never "Up to date" while days remain', () => {
  it('days remaining → says how many, never "Up to date"', () => {
    const status = describeQadaaBalanceStatus(computeQadaaBalance(4, manual(2), done(1)));
    expect(status).toEqual({kind: 'remaining', label: '5 days remaining'});
    expect(status.label).not.toMatch(/up to date/i);
  });

  it('exactly one remaining → singular', () => {
    expect(describeQadaaBalanceStatus(computeQadaaBalance(2, [], done(1))).label).toBe('1 day remaining');
  });

  it('every owed day made up → "All made up"', () => {
    expect(describeQadaaBalanceStatus(computeQadaaBalance(2, [], done(2)))).toEqual({kind: 'all-made-up', label: 'All made up'});
  });

  it('nothing owed at all → "Up to date"', () => {
    expect(describeQadaaBalanceStatus(computeQadaaBalance(0, [], []))).toEqual({kind: 'none', label: 'Up to date'});
  });

  it('for every combination with remaining > 0 the label is never "Up to date"', () => {
    for (let automatic = 0; automatic <= 6; automatic += 1) {
      for (let manualDays = 0; manualDays <= 4; manualDays += 1) {
        for (let completed = 0; completed <= 12; completed += 1) {
          const balance = computeQadaaBalance(automatic, manualDays ? manual(manualDays) : [], completed ? done(completed) : []);
          const label = describeQadaaBalanceStatus(balance).label;
          if (balance.remainingDays > 0) {expect(label).not.toMatch(/up to date|made up$/i);}
        }
      }
    }
  });
});

describe('Q. automatic detection is unchanged (Ramadan boundary + de-duplication)', () => {
  const day = (month: number, date: number, year: number) => new Date(year, month - 1, date);

  // Ramadan 1446 in the runtime's own calendar: found, not hard-coded.
  const ramadan1446 = (() => {
    let start: Date | undefined;
    for (let offset = 0; offset < 40 && !start; offset += 1) {
      const candidate = day(2, 15 + offset, 2025);
      if (isRamadan(candidate) && !isRamadan(day(2, 14 + offset, 2025))) {start = candidate;}
    }
    return start as Date;
  })();
  const plus = (base: Date, days: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);

  it('counts only the days INSIDE Ramadan for a period straddling the start', () => {
    const result = computeQadaaFromHistory([{periodStart: plus(ramadan1446, -2), periodEndDateTime: plus(ramadan1446, 2)}]);
    expect(result.remainingDays).toBe(3); // day 1, 2 and 3 of Ramadan
  });

  it('counts a day once even when two occurrences overlap', () => {
    const result = computeQadaaFromHistory([
      {periodStart: plus(ramadan1446, 1), periodEndDateTime: plus(ramadan1446, 4)},
      {periodStart: plus(ramadan1446, 3), periodEndDateTime: plus(ramadan1446, 6)},
    ]);
    expect(result.remainingDays).toBe(6); // days 2..7
  });

  it('a period outside Ramadan counts nothing, and an inverted range is skipped', () => {
    expect(computeQadaaFromHistory([{periodStart: plus(ramadan1446, -40), periodEndDateTime: plus(ramadan1446, -35)}]).remainingDays).toBe(0);
    expect(computeQadaaFromHistory([{periodStart: plus(ramadan1446, 5), periodEndDateTime: plus(ramadan1446, 2)}]).remainingDays).toBe(0);
  });
});
