import {validateDeliveryDate, validateLossDate} from '../postpartumLossDateValidation';

const NOW = new Date(2026, 8, 26, 12, 0, 0); // September 26, 2026
const base = {now: NOW, firstPostpartumPeriodDate: null, lochiaEndedDate: null};

describe('C — postpartum delivery date', () => {
  it('rejects a future date (Sept 27 when today is Sept 26); accepts today and the past', () => {
    expect(validateDeliveryDate({...base, date: new Date(2026, 8, 27)})).toMatchObject({valid: false});
    expect(validateDeliveryDate({...base, date: new Date(2026, 8, 26)}).valid).toBe(true);
    expect(validateDeliveryDate({...base, date: new Date(2026, 8, 1)}).valid).toBe(true);
  });
  it('a delivery date cannot be after the recorded first period or lochia end (ordering only)', () => {
    expect(validateDeliveryDate({...base, date: new Date(2026, 8, 8), firstPostpartumPeriodDate: '2026-09-05'}).valid).toBe(false);
    expect(validateDeliveryDate({...base, date: new Date(2026, 8, 5), firstPostpartumPeriodDate: '2026-09-05'}).valid).toBe(true);
    expect(validateDeliveryDate({...base, date: new Date(2026, 8, 9), lochiaEndedDate: '2026-09-04'}).valid).toBe(false);
    expect(validateDeliveryDate({...base, date: new Date(2026, 8, 3), lochiaEndedDate: '2026-09-04'}).valid).toBe(true);
  });
  it('ignores malformed stored dates instead of blocking', () => {
    expect(validateDeliveryDate({...base, date: new Date(2026, 8, 3), firstPostpartumPeriodDate: 'garbage'}).valid).toBe(true);
  });
});

describe('H — pregnancy-loss date', () => {
  it('rejects the day after today, accepts today and the past — no other rule', () => {
    expect(validateLossDate(new Date(2026, 8, 27), NOW)).toMatchObject({valid: false});
    expect(validateLossDate(new Date(2026, 8, 26), NOW).valid).toBe(true);
    expect(validateLossDate(new Date(2025, 0, 1), NOW).valid).toBe(true);
  });
});
