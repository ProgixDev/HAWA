import {getPremiumState, resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {initializePremium, purchasePremium, restorePurchases} from '../purchaseService';

beforeEach(() => {
  resetPremiumStateForTests();
});

describe('purchaseService — no purchase provider installed (safe-fail architecture)', () => {
  it('TEST B — initializePremium() resolves once at startup and marks the state initialized', async () => {
    expect(getPremiumState().initialized).toBe(false);
    await initializePremium();
    const state = getPremiumState();
    expect(state.initialized).toBe(true);
    expect(state.loading).toBe(false);
  });

  it('TEST A — initializePremium() never fakes an entitlement when no provider exists', async () => {
    await initializePremium();
    expect(getPremiumState().isPremium).toBe(false);
  });

  it('never re-enters initializePremium() while already loading', async () => {
    const first = initializePremium();
    const second = initializePremium();
    await Promise.all([first, second]);
    expect(getPremiumState().initialized).toBe(true);
  });

  it('TEST G — purchasePremium() never sets isPremium to true without a real provider', async () => {
    const outcome = await purchasePremium('annual');
    expect(outcome).toBe('unavailable');
    expect(getPremiumState().isPremium).toBe(false);
  });

  it('purchasePremium() reports a user-safe error message, never a raw provider code', async () => {
    await purchasePremium('annual');
    const {error} = getPremiumState();
    expect(error).not.toBeNull();
    expect(error).not.toMatch(/stack|exception|E_[A-Z_]+|native/i);
  });

  it('TEST L — refuses to start a second purchase while one is already flagged in-flight', async () => {
    // Simulates the real-provider case where the first call is genuinely
    // still awaiting the native purchase sheet (an await gap the current
    // no-provider stub resolves too fast to race against directly) — the
    // guard itself is what's under test here, checked at entry regardless
    // of how long the in-flight operation actually takes.
    updatePremiumState({purchaseInProgress: true});
    const outcome = await purchasePremium('monthly');
    expect(outcome).toBe('error');
  });

  it('TEST E/F — restorePurchases() refreshes canonical state and never crashes with no active purchase', async () => {
    const outcome = await restorePurchases();
    expect(outcome).toBe('unavailable');
    expect(getPremiumState().isPremium).toBe(false);
    expect(getPremiumState().restoreInProgress).toBe(false);
  });

  it('TEST L — refuses to start a second restore while one is already flagged in-flight', async () => {
    updatePremiumState({restoreInProgress: true});
    const outcome = await restorePurchases();
    expect(outcome).toBe('error');
  });
});
