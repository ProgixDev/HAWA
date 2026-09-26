import {validateLochiaEndDate} from '../postpartumLossDateValidation';
import {
  computePostpartumLochiaSummary,
  getNifasReminderStatus,
  getPostpartumNifasStatus,
} from '../postpartumTrackingUtils';
import {NIFAS_REFERENCE_DAYS} from '../../config/nifasReminderConfig';

const NOW = new Date(2026, 8, 26, 12, 0, 0); // September 26, 2026
const base = {now: NOW, deliveryDate: '2026-09-01', firstPostpartumPeriodDate: null};

describe('H13 — validateLochiaEndDate (ordering only)', () => {
  it('accepts a date between the delivery date and today, inclusive', () => {
    expect(validateLochiaEndDate({...base, date: new Date(2026, 8, 1)}).valid).toBe(true);
    expect(validateLochiaEndDate({...base, date: new Date(2026, 8, 10)}).valid).toBe(true);
    expect(validateLochiaEndDate({...base, date: new Date(2026, 8, 26)}).valid).toBe(true);
  });

  it('rejects a date before the delivery date, with a French message', () => {
    const result = validateLochiaEndDate({...base, date: new Date(2026, 7, 31)});
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.message).toContain('précéder');
  });

  it('rejects a future date (tomorrow), with a French message', () => {
    const result = validateLochiaEndDate({...base, date: new Date(2026, 8, 27)});
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.message).toContain('futur');
  });

  it('rejects a date AFTER an already recorded first postpartum period; the same day is accepted', () => {
    const withPeriod = {...base, firstPostpartumPeriodDate: '2026-09-12'};
    const after = validateLochiaEndDate({...withPeriod, date: new Date(2026, 8, 13)});
    expect(after.valid).toBe(false);
    expect(after.valid === false && after.message).toContain('reprise des règles');
    expect(validateLochiaEndDate({...withPeriod, date: new Date(2026, 8, 12)}).valid).toBe(true);
    expect(validateLochiaEndDate({...withPeriod, date: new Date(2026, 8, 5)}).valid).toBe(true);
  });

  it('does not block on a missing delivery date or malformed stored dates', () => {
    expect(validateLochiaEndDate({...base, deliveryDate: null, date: new Date(2026, 8, 3)}).valid).toBe(true);
    expect(validateLochiaEndDate({...base, firstPostpartumPeriodDate: 'garbage', date: new Date(2026, 8, 3)}).valid).toBe(true);
  });
});

describe('H13 — a corrected end date flows through the existing lochia summary / Nifas reminder status', () => {
  // Delivery exactly NIFAS_REFERENCE_DAYS days before the reference day, so the
  // reminder banner state is driven only by whether the lochia is ended.
  const reference = new Date(2026, 8, 26, 12, 0, 0);
  const delivery = new Date(2026, 8, 26 - (NIFAS_REFERENCE_DAYS - 1));
  const deliveryKey = delivery.toLocaleDateString('en-CA');

  const reminderFor = (endedDate: string | null) => {
    const summary = computePostpartumLochiaSummary(deliveryKey, {}, {endedDate});
    const nifas = getPostpartumNifasStatus(deliveryKey, reference, summary);
    return {
      summary,
      nifas,
      reminder: getNifasReminderStatus({postpartumDay: nifas.postpartumDay, lochiaEnded: nifas.lochiaEnded}),
    };
  };

  it('ended (today or an earlier corrected day) -> reminder "none"; reopened -> reminder returns', () => {
    const opened = reminderFor(null);
    expect(opened.reminder).toBe('reference_reached');

    const endedToday = reminderFor('2026-09-26');
    expect(endedToday.summary.status).toBe('ended');
    expect(endedToday.reminder).toBe('none');

    const endedEarlier = reminderFor('2026-09-10');
    expect(endedEarlier.summary.status).toBe('ended');
    expect(endedEarlier.summary.endedDate).toBe('2026-09-10');
    expect(endedEarlier.nifas.lochiaEndDate).toBe('2026-09-10');
    expect(endedEarlier.reminder).toBe('none');

    expect(reminderFor(null).reminder).toBe('reference_reached'); // reopen
  });

  it('the lochia duration follows the corrected end date', () => {
    const summary = computePostpartumLochiaSummary('2026-09-01', {}, {endedDate: '2026-09-10'});
    expect(summary.durationDays).toBe(10);
  });

  it('an end date earlier than the delivery date is still ignored (unchanged behavior)', () => {
    const summary = computePostpartumLochiaSummary('2026-09-01', {}, {endedDate: '2026-08-20'});
    expect(summary.status).not.toBe('ended');
    expect(summary.endedDate).toBeNull();
  });
});
