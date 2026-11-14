import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  PIN_FREE_FAILURES,
  PIN_LOCKOUT_DELAYS_MS,
  PinLockedError,
  assertPinNotLocked,
  delayAfterFailures,
  getPinLockoutRemainingMs,
  recordPinFailure,
  recordPinSuccess,
  resetPinAttemptsMemoryForTests,
} from '../pinAttemptLimiter';

// PHASE 3 follow-up — the wait that follows repeated wrong PIN entries: schedule, persistence across restarts, independent counters, reset on
// success, storage errors, clock changes and damaged data. It never erases anything and never locks for longer than the longest delay.

const KEY = (scope: string) => `@awa/security/pin-attempts/v1/${scope}`;
const T0 = 1_700_000_000_000;

const failTimes = async (scope: 'appLock' | 'privateSection', times: number, at = T0) => {
  for (let index = 0; index < times; index += 1) {
    await recordPinFailure(scope, at);
  }
};
const coldStart = () => resetPinAttemptsMemoryForTests(); // the JS process restarts: only the disk remains

// The storage mock is a shared jest.fn: put its real behaviour back after a test made it fail.
const realStorage = {
  getItem: (AsyncStorage.getItem as jest.Mock).getMockImplementation(),
  setItem: (AsyncStorage.setItem as jest.Mock).getMockImplementation(),
  removeItem: (AsyncStorage.removeItem as jest.Mock).getMockImplementation(),
};
afterEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockImplementation(realStorage.getItem);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(realStorage.setItem);
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(realStorage.removeItem);
});

beforeEach(async () => {
  await AsyncStorage.clear();
  resetPinAttemptsMemoryForTests();
});

describe('the schedule', () => {
  it('four wrong entries are free; the fifth waits 30 s, then 1 min, 5 min, 15 min, and 1 h from the ninth on', () => {
    expect(PIN_FREE_FAILURES).toBe(4);
    expect([1, 2, 3, 4].map(delayAfterFailures)).toEqual([0, 0, 0, 0]);
    expect([5, 6, 7, 8, 9, 10, 50, 1000].map(delayAfterFailures)).toEqual([30_000, 60_000, 300_000, 900_000, 3_600_000, 3_600_000, 3_600_000, 3_600_000]);
    expect(PIN_LOCKOUT_DELAYS_MS).toEqual([30_000, 60_000, 300_000, 900_000, 3_600_000]);
  });

  it('is finite: no delay is ever longer than one hour', () => {
    for (let failures = 0; failures < 2000; failures += 1) {
      expect(delayAfterFailures(failures)).toBeLessThanOrEqual(3_600_000);
    }
  });
});

describe('counting', () => {
  it('nothing is locked before the fifth wrong entry', async () => {
    await failTimes('appLock', 4);
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(0);
    await expect(assertPinNotLocked('appLock')).resolves.toBeUndefined();
  });

  it('the fifth wrong entry starts a 30 s wait, counted from that entry', async () => {
    await failTimes('appLock', 5);
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(30_000);
    expect(await getPinLockoutRemainingMs('appLock', T0 + 10_000)).toBe(20_000);
    expect(await getPinLockoutRemainingMs('appLock', T0 + 30_000)).toBe(0);
    expect(await getPinLockoutRemainingMs('appLock', T0 + 90_000)).toBe(0);
  });

  it('assertPinNotLocked refuses with the time left while the wait runs', async () => {
    await failTimes('appLock', 5, Date.now());
    const error = await assertPinNotLocked('appLock').then(
      () => null,
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(PinLockedError);
    expect((error as PinLockedError).scope).toBe('appLock');
    expect((error as PinLockedError).remainingMs).toBeGreaterThan(25_000);
    expect((error as PinLockedError).remainingMs).toBeLessThanOrEqual(30_000);
  });

  it('a failure during a wait lengthens it', async () => {
    await failTimes('appLock', 6);
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(60_000);
    await recordPinFailure('appLock', T0 + 60_000);
    expect(await getPinLockoutRemainingMs('appLock', T0 + 60_000)).toBe(300_000);
  });

  it('a success forgets the failures: the four free entries are available again', async () => {
    await failTimes('appLock', 4);
    await recordPinSuccess('appLock');
    await failTimes('appLock', 4);
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(0);
  });

  it('a success after the wait also clears the counter', async () => {
    await failTimes('appLock', 6);
    await recordPinSuccess('appLock');
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(0);
    expect(await AsyncStorage.getItem(KEY('appLock'))).toBeNull();
  });
});

describe('independent counters', () => {
  it('the app-lock PIN and the private PIN never share failures', async () => {
    await failTimes('privateSection', 5);
    expect(await getPinLockoutRemainingMs('privateSection', T0)).toBe(30_000);
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(0);
    await failTimes('appLock', 4);
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(0);
  });

  it('a success on one resets only that one', async () => {
    await failTimes('privateSection', 5);
    await failTimes('appLock', 5);
    await recordPinSuccess('appLock');
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(0);
    expect(await getPinLockoutRemainingMs('privateSection', T0)).toBe(30_000);
  });
});

describe('persistence: closing or killing the app does not skip the wait', () => {
  it('a wait started before a restart is still running after it', async () => {
    await failTimes('appLock', 5);
    coldStart();
    expect(await getPinLockoutRemainingMs('appLock', T0 + 5_000)).toBe(25_000);
  });

  it('the count itself survives: four wrong entries before a restart, one after, and the wait starts', async () => {
    await failTimes('appLock', 4);
    coldStart();
    await recordPinFailure('appLock', T0);
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(30_000);
  });

  it('a success is persisted too: after a restart the failures are still forgotten', async () => {
    await failTimes('appLock', 5);
    await recordPinSuccess('appLock');
    coldStart();
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(0);
  });

  it('the stored value holds only counters, no PIN and no verifier', async () => {
    await failTimes('privateSection', 5);
    const stored = JSON.parse((await AsyncStorage.getItem(KEY('privateSection'))) as string) as Record<string, unknown>;
    expect(Object.keys(stored).sort()).toEqual(['failures', 'lastFailureAt', 'lockedUntil']);
  });
});

describe('storage errors never lock her out, and never disable the protection within a session', () => {
  it('an unreadable counter on a cold start counts as zero', async () => {
    await failTimes('appLock', 5);
    coldStart();
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('storage unavailable'));
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(0);
    await expect(assertPinNotLocked('appLock')).resolves.toBeUndefined();
  });

  it('a failed write still counts in memory: the wait applies for the rest of the session', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValue(new Error('disk full'));
    await failTimes('appLock', 5);
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(30_000);
  });

  it('a failed removal after a success does not bring the old failures back in the same session', async () => {
    await failTimes('appLock', 5);
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValue(new Error('disk failure'));
    await recordPinSuccess('appLock');
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(0);
  });

  it.each([
    ['not JSON', 'definitely-not-json'],
    ['null', 'null'],
    ['the wrong shape', '{"failures":"many","lockedUntil":"soon"}'],
    ['negative numbers', '{"failures":-5,"lockedUntil":-1,"lastFailureAt":-1}'],
  ])('damaged stored data (%s) counts as zero failures', async (_label, value) => {
    await AsyncStorage.setItem(KEY('appLock'), value);
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(0);
  });
});

describe('clock changes and damaged data can never lock for ever', () => {
  it('a far-future end of wait is capped at the longest delay', async () => {
    await AsyncStorage.setItem(KEY('appLock'), JSON.stringify({failures: 9, lockedUntil: T0 + 10 * 365 * 24 * 3_600_000, lastFailureAt: T0}));
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(3_600_000);
  });

  it('an absurd failure count stays within the longest delay', async () => {
    await AsyncStorage.setItem(KEY('appLock'), JSON.stringify({failures: 10 ** 12, lockedUntil: T0 + 3_600_000, lastFailureAt: T0}));
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBeLessThanOrEqual(3_600_000);
  });

  it('putting the clock back before the last failure does not shorten the wait: the whole delay applies', async () => {
    await failTimes('appLock', 7, T0); // 5 min
    expect(await getPinLockoutRemainingMs('appLock', T0 - 3_600_000)).toBe(300_000);
  });

  it('putting the clock forward ends the wait (a plain consequence of the clock; the wait is never permanent)', async () => {
    await failTimes('appLock', 9, T0);
    expect(await getPinLockoutRemainingMs('appLock', T0 + 3_600_000)).toBe(0);
  });
});

describe('quick entries', () => {
  it('two failures recorded at the same moment are both counted', async () => {
    await Promise.all(Array.from({length: 5}, () => recordPinFailure('appLock', T0)));
    expect(await getPinLockoutRemainingMs('appLock', T0)).toBe(30_000);
  });
});
