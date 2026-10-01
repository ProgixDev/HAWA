import {AppState, type AppStateStatus} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {getActiveObjective, hydrateActiveObjective, subscribeActiveObjective, type ObjectiveId} from './onboardingPreferences';
import {getActiveProfileId, hydrateActiveProfileId, subscribeActiveProfileId} from './activeProfileStore';

const BACKGROUND_LOCK_DELAY_MS = 60_000;
let intimacyUnlocked = false;
let backgroundedAt: number | undefined;

export const isIntimacyUnlocked = (): boolean => intimacyUnlocked;
export const unlockIntimacy = (): void => {intimacyUnlocked = true;};
export const lockIntimacy = (): void => {intimacyUnlocked = false;};

// SECURITY: the temporary unlock above is a single, GLOBAL session — never
// scoped per objective or per profile (no "unlockedByObjective" map — see
// the audit this fixes). Instead, a change of EITHER the active objective OR
// the active profile invalidates the whole session outright, so returning to
// a previously-unlocked objective/profile never silently restores it.
//
// `lastKnownObjective`/`lastKnownProfileId` are this module's own baseline —
// deliberately NOT read from onboardingPreferences.ts/activeProfileStore.ts's
// hydration flags (not exported), so instead this compares each observed
// value against the last one *this module* saw. The first observation ever
// (baseline still `undefined`) only records the baseline and never locks:
// at that point in the app lifecycle nothing has been unlocked yet (hydration
// runs once, very early, long before a user could have reached a PIN
// screen), and treating "undefined → initial value" as a real switch is
// exactly the spurious-lock hydration has warned against.
let lastKnownObjective: ObjectiveId | undefined;
let lastKnownProfileId: string | undefined;

const handleActiveContextChange = (): void => {
  const objective = getActiveObjective();
  const profileId = getActiveProfileId();

  if (lastKnownObjective === undefined && lastKnownProfileId === undefined) {
    lastKnownObjective = objective;
    lastKnownProfileId = profileId;
    return;
  }

  const changed = objective !== lastKnownObjective || profileId !== lastKnownProfileId;
  lastKnownObjective = objective;
  lastKnownProfileId = profileId;

  if (changed) {
    lockIntimacy();
  }
};

// Kicks off hydration if nothing else has yet (both are idempotent/cached —
// see their own modules), so the baseline above reflects the REAL persisted
// objective/profile as soon as it's known, not just their in-memory
// defaults. Subscribed unconditionally, module-load time — same standing
// pattern as the AppState listener below.
subscribeActiveObjective(handleActiveContextChange);
subscribeActiveProfileId(handleActiveContextChange);
Promise.all([hydrateActiveObjective(), hydrateActiveProfileId()]).then(handleActiveContextChange);

export type IntimacyTarget =
  | 'cycle'
  | 'conception'
  | 'photos'
  | 'contraceptionNotes'
  | 'cycleNotes'
  | 'miscarriageNotes'
  | 'menopauseNotes'
  // Medical Export of sensitive (decrypted) categories — DataExportScreen. The
  // unlock flow returns to the EXISTING DataExport screen (popTo) instead of
  // opening a new one, so the user's period/format/category choices survive.
  | 'export'
  | undefined;

/** Single source for "where does the private-section flow go once unlocked" —
 * PrivateIntimacyUnlockScreen, PrivateIntimacyPinScreen and
 * PrivateIntimacyFaceIdScreen each used to hand-duplicate this same ternary
 * (once each, twice in the Pin screen). Adding a new `target` (e.g.
 * Contraception's "Notes du jour", which needs params — not just a bare
 * route name — to reach `ContraceptionJournalEntry`) now happens in one
 * place instead of three/four. `cycleNotes`/`miscarriageNotes`/
 * `menopauseNotes` follow the exact same pattern for each objective's own
 * private personal-notes field — never a second PIN/biometric system. */
export const replaceWithIntimacyDestination = (
  navigation: NativeStackNavigationProp<RootStackParamList>,
  target: IntimacyTarget,
): void => {
  if (target === 'export') {
    navigation.popTo('DataExport', {sensitiveUnlockToken: Date.now()}, {merge: true});
    return;
  }
  if (target === 'conception') {navigation.replace('JournalConceptionReports'); return;}
  if (target === 'photos') {navigation.replace('PrivatePhotoEntry'); return;}
  if (target === 'contraceptionNotes') {navigation.replace('ContraceptionJournalEntry', {category: 'notes'}); return;}
  if (target === 'cycleNotes') {navigation.replace('NoteEntry'); return;}
  if (target === 'miscarriageNotes') {navigation.replace('MiscarriageJournalEntry', {category: 'personalNotes'}); return;}
  if (target === 'menopauseNotes') {navigation.replace('MenopauseJournalEntry', {category: 'notes'}); return;}
  navigation.replace('IntimacyEntry');
};

const handleAppState = (nextState: AppStateStatus): void => {
  if (nextState === 'background' || nextState === 'inactive') {
    backgroundedAt = Date.now();
    return;
  }
  if (nextState === 'active' && backgroundedAt !== undefined) {
    if (Date.now() - backgroundedAt >= BACKGROUND_LOCK_DELAY_MS) {lockIntimacy();}
    backgroundedAt = undefined;
  }
};

AppState.addEventListener('change', handleAppState);

/** Test-only reset — mirrors the reset helpers other stores in this codebase
 * expose for test isolation (e.g. activeProfileStore.ts's
 * resetActiveProfileForTests). Re-baselines against whatever objective/
 * profile the real stores currently report, exactly like the module's own
 * first-observation logic above, so a reset test never sees a spurious
 * "context changed" lock from state left over by an earlier test. */
export const resetPrivateSectionAuthForTests = (): void => {
  intimacyUnlocked = false;
  backgroundedAt = undefined;
  lastKnownObjective = getActiveObjective();
  lastKnownProfileId = getActiveProfileId();
};
