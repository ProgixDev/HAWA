import {
  getPremiumState,
  resetPremiumStateForTests,
  subscribePremiumState,
  updatePremiumState,
} from '../premiumStore';

beforeEach(() => {
  resetPremiumStateForTests();
});

describe('premiumStore — canonical Premium state', () => {
  it('TEST A — defaults to the safe, fully-locked state', () => {
    const state = getPremiumState();
    expect(state.isPremium).toBe(false);
    expect(state.initialized).toBe(false);
    expect(state.error).toBeNull();
  });

  it('never mutates the shared state object — getPremiumState() returns a fresh copy', () => {
    const first = getPremiumState();
    (first as {isPremium: boolean}).isPremium = true;
    expect(getPremiumState().isPremium).toBe(false);
  });

  it('TEST D — notifies subscribers immediately when state changes, with no restart', () => {
    const listener = jest.fn();
    const unsubscribe = subscribePremiumState(listener);

    updatePremiumState({isPremium: true, initialized: true});

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getPremiumState().isPremium).toBe(true);

    unsubscribe();
    updatePremiumState({isPremium: false});
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('merges a partial update without clobbering unrelated fields', () => {
    updatePremiumState({loading: true});
    updatePremiumState({loading: false, initialized: true});
    const state = getPremiumState();
    expect(state.loading).toBe(false);
    expect(state.initialized).toBe(true);
    expect(state.isPremium).toBe(false);
  });
});
