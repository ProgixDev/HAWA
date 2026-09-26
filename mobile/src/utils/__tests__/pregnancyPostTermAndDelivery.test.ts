import {
  PREGNANCY_TOTAL_DAYS,
  computePregnancyStatus,
  formatPregnancyProgressLabel,
  isDeliveryOfCurrentPregnancy,
} from '../pregnancyTrackingUtils';
import {validateDeliveryDate} from '../postpartumLossDateValidation';
import {addDays, startOfDay} from '../cycleMath';

const NOW = new Date(2026, 8, 26, 12, 0, 0);
const lmp = (elapsedDays: number) => startOfDay(addDays(NOW, -elapsedDays));
const statusAt = (elapsedDays: number) => computePregnancyStatus('lastPeriod', lmp(elapsedDays), NOW);

describe('M31 - the 40-week boundary is displayed consistently', () => {
  it('day 279 (39 SA + 6): week 40, "Semaine 40 sur 40"', () => {
    const status = statusAt(279);
    expect([status.gestationalWeeks, status.gestationalDays, status.week]).toEqual([39, 6, 40]);
    expect(formatPregnancyProgressLabel(status)).toBe('Semaine 40 sur 40');
  });

  it('day 280 (exact boundary, 40 SA + 0): dating semantics unchanged (week 41, 100 %), but never "Semaine 41 sur 40"', () => {
    const status = statusAt(PREGNANCY_TOTAL_DAYS);
    expect([status.gestationalWeeks, status.gestationalDays, status.week]).toEqual([40, 0, 41]);
    expect(status.progressPercent).toBe(100);
    expect(status.remainingWeeks).toBe(0);
    expect(formatPregnancyProgressLabel(status)).toBe('Terme atteint');
  });

  it('day 281 and later (clamped at 280 by computePregnancyStatus): same consistent label', () => {
    for (const elapsed of [281, 290, 400]) {
      const status = statusAt(elapsed);
      expect([status.gestationalWeeks, status.gestationalDays, status.week]).toEqual([40, 0, 41]);
      expect(formatPregnancyProgressLabel(status)).toBe('Terme atteint');
    }
  });

  it('an earlier week keeps "Semaine N sur 40"', () => {
    expect(formatPregnancyProgressLabel(statusAt(70))).toBe('Semaine 11 sur 40');
  });
});

describe('M32 - a delivery date from an earlier journey is not "this pregnancy delivered"', () => {
  const dating = (elapsedDays: number) => ({method: 'lastPeriod' as const, date: lmp(elapsedDays).toISOString()});
  const key = (date: Date) => date.toLocaleDateString('en-CA');

  it('no postpartum history -> not delivered', () => {
    expect(isDeliveryOfCurrentPregnancy(null, dating(260))).toBe(false);
  });

  it('previous postpartum history (delivery BEFORE the current pregnancy started) + new pregnancy -> not delivered', () => {
    expect(isDeliveryOfCurrentPregnancy(key(addDays(NOW, -600)), dating(120))).toBe(false);
    // the day before the new pregnancy's start is still the old journey
    expect(isDeliveryOfCurrentPregnancy(key(addDays(NOW, -121)), dating(120))).toBe(false);
  });

  it('delivery recorded during the current pregnancy -> delivered (start day included)', () => {
    expect(isDeliveryOfCurrentPregnancy(key(addDays(NOW, -1)), dating(275))).toBe(true);
    expect(isDeliveryOfCurrentPregnancy(key(addDays(NOW, -120)), dating(120))).toBe(true);
  });

  it('works for the other dating methods (due date / conception date)', () => {
    const due = {method: 'dueDate' as const, date: addDays(NOW, 20).toISOString()}; // LMP = due - 280 = today - 260
    expect(isDeliveryOfCurrentPregnancy(key(addDays(NOW, -300)), due)).toBe(false);
    expect(isDeliveryOfCurrentPregnancy(key(addDays(NOW, -10)), due)).toBe(true);
    const conception = {method: 'conceptionDate' as const, date: addDays(NOW, -100).toISOString()}; // LMP = today - 114
    expect(isDeliveryOfCurrentPregnancy(key(addDays(NOW, -115)), conception)).toBe(false);
    expect(isDeliveryOfCurrentPregnancy(key(addDays(NOW, -114)), conception)).toBe(true);
  });

  it('DATA-MODEL DECISION REQUIRED (behaviour kept): undated pregnancy cannot attribute a stored delivery to a journey', () => {
    expect(isDeliveryOfCurrentPregnancy(key(addDays(NOW, -600)), {method: 'later', date: null})).toBe(true);
  });
});

describe('M34 - delivery date validation in the Pregnancy -> Postpartum transition', () => {
  const start = lmp(200);
  const base = {now: NOW, firstPostpartumPeriodDate: null, lochiaEndedDate: null, pregnancyStartDate: start};

  it('valid: between the pregnancy start and today (both included)', () => {
    expect(validateDeliveryDate({...base, date: addDays(NOW, -3)}).valid).toBe(true);
    expect(validateDeliveryDate({...base, date: NOW}).valid).toBe(true);
    expect(validateDeliveryDate({...base, date: start}).valid).toBe(true);
  });

  it('before the pregnancy start -> rejected with a chronological message', () => {
    const result = validateDeliveryDate({...base, date: addDays(start, -1)});
    expect(result).toEqual({valid: false, message: 'La date d’accouchement ne peut pas précéder le début de ta grossesse.'});
  });

  it('in the future -> rejected', () => {
    const result = validateDeliveryDate({...base, date: addDays(NOW, 1)});
    expect(result.valid).toBe(false);
  });

  it('without a pregnancy start (standalone onboarding / edit) the previous behaviour is unchanged', () => {
    expect(validateDeliveryDate({now: NOW, firstPostpartumPeriodDate: null, lochiaEndedDate: null, date: addDays(NOW, -900)}).valid).toBe(true);
  });
});
