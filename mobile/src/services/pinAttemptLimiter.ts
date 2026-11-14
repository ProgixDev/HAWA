import AsyncStorage from '@react-native-async-storage/async-storage';

// Slows down repeated wrong PIN entries. Two independent counters: the whole-app lock PIN ('appLock') and the private-sections PIN
// ('privateSection') — a failure on one never touches the other, and a success resets only its own.
//
// Never destructive: nothing is ever erased and the wait is always finite (the longest is one hour). It only refuses attempts for a while.
// The counter is persisted (the PIN is the only thing it protects, the counter holds no secret), so closing or killing the app does not give a
// fresh set of tries. If the storage cannot be read or written, the counter still works in memory for the life of the process and the person
// is never locked out because of a storage error.

export type PinScope = 'appLock' | 'privateSection';

const KEY_PREFIX = '@awa/security/pin-attempts/v1/';

/** Wrong entries tolerated in a row before the first wait. */
export const PIN_FREE_FAILURES = 4;
/** Wait after the 5th, 6th, 7th, 8th and any later consecutive failure. */
export const PIN_LOCKOUT_DELAYS_MS: readonly number[] = [30_000, 60_000, 300_000, 900_000, 3_600_000];
const MAX_DELAY_MS = PIN_LOCKOUT_DELAYS_MS[PIN_LOCKOUT_DELAYS_MS.length - 1];
const MAX_STORED_FAILURES = 1000;

type Attempts = {failures: number; lockedUntil: number; lastFailureAt: number};

const ZERO: Attempts = {failures: 0, lockedUntil: 0, lastFailureAt: 0};
const memory = new Map<PinScope, Attempts>();
const queues = new Map<PinScope, Promise<unknown>>();

export class PinLockedError extends Error {
  readonly scope: PinScope;
  readonly remainingMs: number;
  constructor(scope: PinScope, remainingMs: number) {
    super('PIN_LOCKED');
    this.name = 'PinLockedError';
    this.scope = scope;
    this.remainingMs = remainingMs;
  }
}

export const delayAfterFailures = (failures: number): number =>
  failures <= PIN_FREE_FAILURES ? 0 : PIN_LOCKOUT_DELAYS_MS[Math.min(failures - PIN_FREE_FAILURES, PIN_LOCKOUT_DELAYS_MS.length) - 1];

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

function sanitize(raw: unknown): Attempts {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    failures: isCount(source.failures) ? Math.min(Math.floor(source.failures), MAX_STORED_FAILURES) : 0,
    lockedUntil: isCount(source.lockedUntil) ? source.lockedUntil : 0,
    lastFailureAt: isCount(source.lastFailureAt) ? source.lastFailureAt : 0,
  };
}

/** The process's own copy wins once it exists (every change goes through here); the disk is only read on a cold start. */
async function load(scope: PinScope): Promise<Attempts> {
  const known = memory.get(scope);
  if (known) {return known;}
  let state = ZERO;
  try {
    const stored = await AsyncStorage.getItem(`${KEY_PREFIX}${scope}`);
    if (stored) {state = sanitize(JSON.parse(stored));}
  } catch {
    // unreadable (storage error or damaged value): start from zero — never a reason to lock her out
  }
  memory.set(scope, state);
  return state;
}

async function save(scope: PinScope, state: Attempts): Promise<void> {
  memory.set(scope, state);
  try {
    if (state.failures === 0) {
      await AsyncStorage.removeItem(`${KEY_PREFIX}${scope}`);
    } else {
      await AsyncStorage.setItem(`${KEY_PREFIX}${scope}`, JSON.stringify(state));
    }
  } catch {
    // kept in memory; see the header
  }
}

/** Runs the steps of one scope one after another, so two quick entries cannot both read the same count. */
function serialized<T>(scope: PinScope, step: () => Promise<T>): Promise<T> {
  const run = (queues.get(scope) ?? Promise.resolve()).then(step, step);
  queues.set(scope, run.catch(() => undefined));
  return run;
}

function remainingFor(state: Attempts, now: number): number {
  if (state.failures <= PIN_FREE_FAILURES) {return 0;}
  const delay = delayAfterFailures(state.failures);
  // The clock moved back before the last failure: the recorded end of the wait cannot be trusted, so wait the whole delay.
  if (now < state.lastFailureAt) {return delay;}
  // (a damaged, far-future value can never lock for longer than the longest delay)
  return Math.min(Math.max(state.lockedUntil - now, 0), MAX_DELAY_MS);
}

/** Milliseconds left before this PIN may be tried again (0 = it may be tried now). */
export function getPinLockoutRemainingMs(scope: PinScope, now: number = Date.now()): Promise<number> {
  return serialized(scope, async () => remainingFor(await load(scope), now));
}

/** Throws {@link PinLockedError} while a wait is running. Call it BEFORE comparing the entered code. */
export async function assertPinNotLocked(scope: PinScope): Promise<void> {
  const remaining = await getPinLockoutRemainingMs(scope);
  if (remaining > 0) {throw new PinLockedError(scope, remaining);}
}

/** Counts one wrong entry; from the 5th in a row on, starts (or lengthens) the wait. */
export function recordPinFailure(scope: PinScope, now: number = Date.now()): Promise<Attempts> {
  return serialized(scope, async () => {
    const current = await load(scope);
    const failures = Math.min(current.failures + 1, MAX_STORED_FAILURES);
    const delay = delayAfterFailures(failures);
    const next: Attempts = {failures, lockedUntil: delay > 0 ? now + delay : 0, lastFailureAt: now};
    await save(scope, next);
    return next;
  });
}

/** A right entry: forgets the failures of THIS PIN only. */
export function recordPinSuccess(scope: PinScope): Promise<void> {
  return serialized(scope, async () => {
    await load(scope);
    await save(scope, ZERO);
  });
}

/** Tests only: forgets the in-memory copy (a "cold start"), or everything. */
export function resetPinAttemptsMemoryForTests(): void {
  memory.clear();
  queues.clear();
}
