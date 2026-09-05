import {PREMIUM_PRICING} from '../premiumPricing';

describe('PREMIUM_PRICING — requested display prices', () => {
  it('shows £99.99/year for the annual plan, in French display formatting', () => {
    expect(PREMIUM_PRICING.annual.price).toBe('99,99 £ / an');
  });

  it('shows £99.99/month for the monthly plan — intentionally identical to the annual price, never "corrected"', () => {
    expect(PREMIUM_PRICING.monthly.price).toBe('99,99 £ / mois');
  });

  it('never silently diverges the two prices from each other', () => {
    // Both plans are genuinely £99.99 per the task's explicit requirement —
    // this guards against a future "that looks like a bug" fix that changes
    // one of them.
    const annualAmount = PREMIUM_PRICING.annual.price.match(/[\d,]+/)?.[0];
    const monthlyAmount = PREMIUM_PRICING.monthly.price.match(/[\d,]+/)?.[0];
    expect(annualAmount).toBe('99,99');
    expect(monthlyAmount).toBe('99,99');
  });

  it('no longer exposes a "regions"/local-pricing field', () => {
    expect('regions' in PREMIUM_PRICING).toBe(false);
  });
});
