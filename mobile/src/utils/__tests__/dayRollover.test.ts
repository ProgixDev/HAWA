import {rollSelectedDate, rollVisibleMonth} from '../dayRollover';

const day = (month: number, date: number) => new Date(2026, month - 1, date);

describe('rollSelectedDate', () => {
  it('a selection that was following today moves to the new today', () => {
    const previousToday = day(9, 25);
    const today = day(9, 26);
    expect(rollSelectedDate(day(9, 25), previousToday, today)).toBe(today);
  });

  it('a date the user picked is never moved', () => {
    const picked = day(9, 10);
    expect(rollSelectedDate(picked, day(9, 25), day(9, 26))).toBe(picked);
  });

  it('a future date the user picked is never moved either', () => {
    const picked = day(10, 3);
    expect(rollSelectedDate(picked, day(9, 25), day(9, 26))).toBe(picked);
  });

  it('is time-of-day agnostic', () => {
    const previousToday = day(9, 25);
    const selected = new Date(2026, 8, 25, 17, 30);
    const today = day(9, 26);
    expect(rollSelectedDate(selected, previousToday, today)).toBe(today);
  });
});

describe('rollVisibleMonth', () => {
  it('follows the new day into a new month when the user was viewing the current month', () => {
    const visible = new Date(2026, 8, 1);
    expect(rollVisibleMonth(visible, day(9, 30), day(10, 1))).toEqual(new Date(2026, 9, 1));
  });

  it('keeps the same month object when the month did not change (no needless re-render)', () => {
    const visible = new Date(2026, 8, 1);
    expect(rollVisibleMonth(visible, day(9, 25), day(9, 26))).toEqual(new Date(2026, 8, 1));
  });

  it('never moves a month the user navigated to', () => {
    const visible = new Date(2026, 5, 1); // browsing June
    expect(rollVisibleMonth(visible, day(9, 30), day(10, 1))).toBe(visible);
  });
});
