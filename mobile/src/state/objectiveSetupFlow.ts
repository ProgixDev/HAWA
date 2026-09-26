import AsyncStorage from '@react-native-async-storage/async-storage';

import {setActiveObjective, type ObjectiveId} from './onboardingPreferences';

// State of ONE in-progress "configure this objective" flow started from inside
// the app (Profile → change objective, or the Miscarriage → Conception
// hand-off) — as opposed to the first-launch onboarding, which keeps its own
// SecuritySetup → Privacy → Summary → Auth tail untouched.
//
// Why it exists: every objective's onboarding chain ends by navigating to
// 'SecuritySetup'. Reused as-is from inside the app that would drop an
// already-onboarded user into the security/privacy/auth tail. While a setup
// flow is pending, the chain's last step returns to the app instead
// (continueAfterObjectiveSetup), and if the user backs out before finishing,
// the objective she came from is restored (cancelPendingObjectiveSetup) —
// never leaving her parked on a half-configured objective.
//
// Restart resilience: the pending state (previous objective + objective being
// configured — nothing else) is ALSO mirrored to AsyncStorage so that a process
// kill in the middle of the chain does not lose the information needed to
// restore the previous objective. The in-memory `pending` stays the only thing
// the running session reads; the persisted copy is consumed exactly once at
// startup by restorePendingObjectiveSetupOnStartup() (services/objectiveSwitch.ts).
//
// No data is ever deleted here: only the ACTIVE objective key changes.

export type PendingObjectiveSetup = {previous: ObjectiveId; objective: ObjectiveId};

const PENDING_STORAGE_KEY = '@hawa/pending-objective-setup/v1';
const OBJECTIVE_IDS: readonly ObjectiveId[] = [
  'cycle',
  'conceive',
  'contraception',
  'irregular',
  'menopause',
  'pregnancy',
  'postpartum',
  'loss',
];

const isObjectiveId = (value: unknown): value is ObjectiveId =>
  typeof value === 'string' && (OBJECTIVE_IDS as readonly string[]).includes(value);

let pending: PendingObjectiveSetup | null = null;

const persistPending = async (value: PendingObjectiveSetup): Promise<void> => {
  try {
    await AsyncStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Best effort: the in-memory state still drives this session.
  }
};

const removePersistedPending = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PENDING_STORAGE_KEY);
  } catch {
    // Best effort — a leftover value is validated (and cleared) at next startup.
  }
};

/** Marks a setup flow as pending. The in-memory state is set synchronously (so
 * existing synchronous callers keep working); the returned promise resolves
 * once the persisted copy is written. Callers that change the active objective
 * right after should await it so the pending record is on disk BEFORE the
 * active objective moves to the half-configured target. Never rejects. */
export const beginObjectiveSetup = (previous: ObjectiveId, objective: ObjectiveId): Promise<void> => {
  pending = {previous, objective};
  return persistPending(pending);
};

export const getPendingObjectiveSetup = (): PendingObjectiveSetup | null => (pending ? {...pending} : null);

/** The user finished the objective's configuration chain. */
export const completeObjectiveSetup = (): void => {
  pending = null;
  removePersistedPending().catch(() => {});
};

/** Clears the pending state (memory + persisted) without touching the active
 * objective. Used at startup once the pending flow has been resolved. */
export const clearPendingObjectiveSetup = async (): Promise<void> => {
  pending = null;
  await removePersistedPending();
};

/** The user left the configuration chain before finishing (Back). Restores the
 * objective she came from and resolves to it — or null when nothing was
 * pending. The persisted copy is removed only AFTER the previous objective is
 * active again: a kill in between leaves a stale record that the startup check
 * discards (active objective ≠ recorded target), never a half-configured
 * objective without a record. */
export const cancelPendingObjectiveSetup = async (): Promise<ObjectiveId | null> => {
  if (!pending) {return null;}
  const {previous} = pending;
  pending = null;
  await setActiveObjective(previous);
  await removePersistedPending();
  return previous;
};

/** Reads the persisted pending record (startup only). Returns null when there
 * is none. A corrupt, malformed or unknown-objective record is removed and
 * treated as "nothing pending" — it must never crash startup nor restore an
 * objective that does not exist. Does NOT touch the in-memory state. */
export const readPersistedObjectiveSetup = async (): Promise<PendingObjectiveSetup | null> => {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(PENDING_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null || raw === undefined) {return null;}

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await removePersistedPending();
    return null;
  }

  if (
    parsed &&
    typeof parsed === 'object' &&
    isObjectiveId((parsed as Record<string, unknown>).previous) &&
    isObjectiveId((parsed as Record<string, unknown>).objective) &&
    (parsed as Record<string, unknown>).previous !== (parsed as Record<string, unknown>).objective
  ) {
    const {previous, objective} = parsed as PendingObjectiveSetup;
    return {previous, objective};
  }

  await removePersistedPending();
  return null;
};

export const resetObjectiveSetupFlowForTests = (): void => {
  pending = null;
};

// Structural on purpose: every chain screen passes its own typed
// NativeStackNavigationProp, and this file must not import navigation types
// (keeps the state layer free of the navigator).
export type ObjectiveSetupNavigation = {
  navigate: (screen: 'SecuritySetup') => void;
  reset: (state: {index: number; routes: {name: 'MainTabs'; params: {screen: 'CycleHome'}}[]}) => void;
};

/** The one call every objective onboarding chain makes when its LAST step is
 * done (formerly `navigation.navigate('SecuritySetup')`). First-launch
 * onboarding is unchanged; an in-app setup flow returns to the dashboard. */
export const continueAfterObjectiveSetup = (navigation: ObjectiveSetupNavigation): void => {
  if (pending) {
    completeObjectiveSetup();
    navigation.reset({index: 0, routes: [{name: 'MainTabs', params: {screen: 'CycleHome'}}]});
    return;
  }
  navigation.navigate('SecuritySetup');
};
