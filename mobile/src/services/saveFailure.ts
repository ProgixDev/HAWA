import {Alert} from 'react-native';

import {isStructuredUnavailableError} from './secureAsyncStorage';

// THE failure contract for writes of user data (extends the StructuredDataUnavailableError / recovery system; it is not
// a second one):
//
//   1. A store write that is refused (the record is unreadable and protected, see secureAsyncStorage.setItem) or that
//      fails (storage / encryption error) REJECTS with the original error. It is never swallowed and never resolved
//      "as if saved". Synchronous cycle setters that cannot throw return a Promise that rejects the same way (and is
//      pre-handled, so a caller that ignores it does not produce an unhandled rejection).
//   2. The store puts back what it held before the edit (rollback) and notifies its subscribers, so no screen keeps
//      presenting a refused edit as persisted.
//   3. The person is TOLD. A screen that awaits the write keeps its draft and calls presentSaveFailure() from its
//      catch block (or markSaveFailureHandled() when it shows its own wording), so exactly one localized message
//      appears. A store whose setter is called fire-and-forget by interactive screens (the synchronous cycle setters,
//      the Hijri / spiritual-markers toggles) passes `alertIfUnhandled`: when nobody handled the rejection, this module
//      shows the same localized alert one macrotask later. Background writers (reminder schedulers, caches) never alert.
//   4. When the cause is an unavailable record the alert offers the existing recovery screen (DataRecovery).

export type SaveFailureKind = 'unavailable' | 'failed';

export const classifySaveFailure = (error: unknown): SaveFailureKind =>
  isStructuredUnavailableError(error) ? 'unavailable' : 'failed';

const handled = new WeakSet<object>();
const reported = new WeakSet<object>();
const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null;

const listeners = new Set<(kind: SaveFailureKind, error: unknown) => void>();
/** Test/diagnostic hook: called once per failure that nobody handled (right before the fallback alert). */
export const subscribeUnhandledSaveFailures = (listener: (kind: SaveFailureKind, error: unknown) => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

let alertOpen = false;

const translate = (key: string): string => {
  // Lazy: the stores import this module, and they must not pull the whole i18n bundle at import time.
  const i18n = (require('../i18n') as {default: {t: (key: string) => string}}).default;
  return i18n.t(key);
};

const openRecovery = (): void => {
  try {
    const {navigationRef} = require('../navigation/navigationRef') as typeof import('../navigation/navigationRef');
    if (navigationRef.isReady()) {navigationRef.navigate('DataRecovery');}
  } catch {
    // no navigation available (tests, early startup): the alert text still explains what to do
  }
};

/**
 * Shows the localized "could not save" alert. Draft-keeping screens call this from their catch block.
 * `generic` lets a screen keep its own (already localized) wording for an ordinary failure; an UNAVAILABLE record
 * always gets the shared message that points to the recovery screen.
 */
export function presentSaveFailure(error: unknown, generic?: {title: string; message: string}): void {
  if (isObject(error)) {handled.add(error);}
  if (alertOpen) {return;}
  const kind = classifySaveFailure(error);
  alertOpen = true;
  const done = () => {
    alertOpen = false;
  };
  const title = translate('saveFailure.title');
  if (kind === 'unavailable') {
    Alert.alert(title, translate('saveFailure.unavailableBody'), [
      {text: translate('saveFailure.ok'), style: 'cancel', onPress: done},
      {text: translate('saveFailure.recoveryAction'), onPress: () => { done(); openRecovery(); }},
    ], {onDismiss: done});
  } else {
    Alert.alert(
      generic?.title ?? title,
      generic?.message ?? translate('saveFailure.failedBody'),
      [{text: translate('saveFailure.ok'), onPress: done}],
      {onDismiss: done},
    );
  }
}

/** The caller shows its own (already localized) error: the fallback alert must not add a second one. */
export function markSaveFailureHandled(error: unknown): void {
  if (isObject(error)) {handled.add(error);}
}

/**
 * Called by a store when a write failed. Deferred by one macrotask: a caller that awaits the write handles (or marks)
 * the rejection within the same promise chain, which is always earlier. Only a failure nobody handled is alerted.
 */
export function reportSaveFailure(error: unknown): void {
  if (!isObject(error)) {
    setTimeout(() => notifyUnhandled(error), 0);
    return;
  }
  if (reported.has(error)) {return;}
  reported.add(error);
  setTimeout(() => {
    if (!handled.has(error)) {notifyUnhandled(error);}
  }, 0);
}

function notifyUnhandled(error: unknown): void {
  const kind = classifySaveFailure(error);
  listeners.forEach(listener => listener(kind, error));
  presentSaveFailure(error);
}

/**
 * Runs `write`. When it fails: `rollback()` restores the pre-edit in-memory state (and notifies), the failure is
 * reported, and the ORIGINAL error is rethrown. The returned promise is pre-handled, so ignoring it is safe.
 * `write` is started synchronously, exactly like the direct call it replaces.
 */
export function persistWithRollback(write: () => Promise<void>, rollback: () => void, options: {alertIfUnhandled?: boolean} = {}): Promise<void> {
  const run = (async () => {
    try {
      await write();
    } catch (error) {
      try {
        rollback();
      } catch {
        // a failing rollback must never mask the real failure
      }
      if (options.alertIfUnhandled) {reportSaveFailure(error);}
      throw error;
    }
  })();
  run.catch(() => undefined);
  return run;
}

/**
 * The optimistic-update shape every memoised store uses: the caller has ALREADY replaced its in-memory state (so the
 * screens react at once) and passes the state it replaced as `previous`. When `write` fails and nothing newer has
 * replaced the optimistic state in the meantime, `restore(previous)` puts the persisted truth back (it must also
 * notify the store's subscribers).
 */
export function commitOptimistic<T>(
  previous: T,
  current: () => T,
  restore: (value: T) => void,
  write: () => Promise<void>,
  options: {alertIfUnhandled?: boolean} = {},
): Promise<void> {
  const optimistic = current();
  return persistWithRollback(write, () => {
    if (current() === optimistic) {restore(previous);}
  }, options);
}

/** Test-only: forget the "alert already open" latch. */
export const resetSaveFailureForTests = (): void => {
  alertOpen = false;
  listeners.clear();
};
