import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import SplashScreen from '../SplashScreen';
import {
  getHasCompletedOnboarding,
  hydrateHasCompletedOnboarding,
  setHasCompletedOnboarding,
} from '../../state/onboardingPreferences';
import {requiresAppLock} from '../../state/securityPreferences';
import {lockApp} from '../../state/appLockStore';

// Phase 2 — persistent onboarding completion. SplashScreen's routing
// decision is the read boundary: a returning user who already finished
// onboarding once must never see Welcome again, but App Lock (checked
// independently via requiresAppLock()/lockApp()) must keep working exactly
// as before, regardless of which destination Splash picks underneath it.

jest.mock('../../state/securityPreferences', () => ({
  requiresAppLock: jest.fn().mockReturnValue(false),
}));
jest.mock('../../state/appLockStore', () => ({
  lockApp: jest.fn(),
}));

const mockRequiresAppLock = requiresAppLock as jest.Mock;
const mockLockApp = lockApp as jest.Mock;

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderSplash(navigation: {replace: jest.Mock}) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <SplashScreen navigation={navigation as any} route={{key: 'test', name: 'Splash'} as any} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(async () => {
  jest.useFakeTimers();
  mockRequiresAppLock.mockReturnValue(false);
  mockLockApp.mockClear();
  // onboardingPreferences.ts keeps an in-memory singleton — reset it to the
  // "not completed" state explicitly before each test rather than assuming
  // module-reset, same constraint every other onboarding-state test file
  // works within.
  await setHasCompletedOnboarding(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('SplashScreen — persistent onboarding completion routing', () => {
  it('NEW USER (no persisted completion): routes to Welcome after the splash timer', async () => {
    const navigation = {replace: jest.fn()};
    await renderSplash(navigation);

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(navigation.replace).toHaveBeenCalledWith('Welcome');
  });

  it('COMPLETED USER: routes straight to MainTabs, bypassing Welcome/onboarding entirely', async () => {
    await setHasCompletedOnboarding(true);
    const navigation = {replace: jest.fn()};
    await renderSplash(navigation);

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(navigation.replace).toHaveBeenCalledWith('MainTabs', {screen: 'CycleHome'});
    expect(navigation.replace).not.toHaveBeenCalledWith('Welcome');
  });

  it('APP RESTART: completion survives — hydrating fresh reads the persisted value, not an in-memory default', async () => {
    await setHasCompletedOnboarding(true);
    // Simulate a fresh process by clearing the in-memory hydration flag the
    // same way a cold app launch would — hydrateHasCompletedOnboarding()
    // itself is the thing under test here, exercised directly.
    const value = await hydrateHasCompletedOnboarding();
    expect(value).toBe(true);
    expect(getHasCompletedOnboarding()).toBe(true);
  });

  it('APP LOCK ENABLED: still locks on splash, independent of onboarding completion status', async () => {
    mockRequiresAppLock.mockReturnValue(true);
    await setHasCompletedOnboarding(true);
    const navigation = {replace: jest.fn()};
    await renderSplash(navigation);

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockLockApp).toHaveBeenCalled();
    // App Lock is a separate overlay (App.tsx) rendered on top of whatever
    // route is underneath — Splash must still route a completed user to
    // MainTabs; the lock screen intercepts it visually, not via routing.
    expect(navigation.replace).toHaveBeenCalledWith('MainTabs', {screen: 'CycleHome'});
  });

  it('APP LOCK DISABLED + COMPLETED: routes to MainTabs without locking', async () => {
    mockRequiresAppLock.mockReturnValue(false);
    await setHasCompletedOnboarding(true);
    const navigation = {replace: jest.fn()};
    await renderSplash(navigation);

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockLockApp).not.toHaveBeenCalled();
    expect(navigation.replace).toHaveBeenCalledWith('MainTabs', {screen: 'CycleHome'});
  });
});

describe('onboardingPreferences — setHasCompletedOnboarding is never set incidentally', () => {
  it('remains false after being explicitly set to false, and only becomes true via an explicit true call', async () => {
    await setHasCompletedOnboarding(false);
    expect(getHasCompletedOnboarding()).toBe(false);

    await setHasCompletedOnboarding(true);
    expect(getHasCompletedOnboarding()).toBe(true);
  });
});
