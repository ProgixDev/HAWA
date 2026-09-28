import AsyncStorage from '@react-native-async-storage/async-storage';

import {getManagedProfiles, hydrateManagedProfiles, type ManagedProfile} from './managedProfilesStore';

// The ONE source of truth for which profile — the main AWA user, or one of her
// managed (daughter) profiles — is currently active across the whole "Suivre mon
// cycle" experience (CycleHome/Calendar/Statistics/Journal). The mother and a
// managed profile share the EXACT SAME screens/components; only WHICH profile's
// data those screens read/write changes (see profileScopedStorage.ts and each
// profile-scoped store's own header comment for how their data stays isolated).
//
// Deliberately NOT dependent on onboardingPreferences.ts, personalInformationStore.ts
// or any of the 7 profile-scoped health stores — this module only needs to know
// WHETHER a candidate id is a real managed profile (managedProfilesStore.ts), so it
// can stay a small, dependency-light layer that any of those other modules can safely
// import without a circular dependency.

export const OWNER_PROFILE_ID = 'owner';

const ACTIVE_PROFILE_STORAGE_KEY = '@hawa/active-profile-id';

let activeProfileId: string = OWNER_PROFILE_ID;
const listeners = new Set<() => void>();
let hydration: Promise<string> | null = null;
let hydrated = false;
let writeChain: Promise<void> = Promise.resolve();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const getActiveProfileId = (): string => activeProfileId;

export const isOwnerActive = (): boolean => activeProfileId === OWNER_PROFILE_ID;

export const subscribeActiveProfileId = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

const persist = (id: string): Promise<void> => {
  writeChain = writeChain.catch(() => undefined).then(() => AsyncStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, id));
  return writeChain;
};

/**
 * Loads the persisted active profile (once). If it references a managed profile
 * that no longer exists (deleted, or never existed — a corrupted/stale value),
 * safely falls back to OWNER_PROFILE_ID: the app must never crash, and must never
 * silently keep showing an empty dashboard for a ghost profile id.
 *
 * A failed AsyncStorage read does not mark this as hydrated (a later call retries).
 */
export const hydrateActiveProfileId = (): Promise<string> => {
  if (hydrated) {return Promise.resolve(activeProfileId);}
  if (!hydration) {
    hydration = (async () => {
      let raw: string | null;
      try {
        raw = await AsyncStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
      } catch {
        hydration = null;
        return activeProfileId;
      }
      let profiles: ManagedProfile[];
      try {
        profiles = await hydrateManagedProfiles();
      } catch {
        profiles = getManagedProfiles();
      }
      const candidate = raw ?? OWNER_PROFILE_ID;
      const stillExists = candidate === OWNER_PROFILE_ID || profiles.some(profile => profile.id === candidate);
      activeProfileId = stillExists ? candidate : OWNER_PROFILE_ID;
      hydrated = true;
      notifyListeners();
      return activeProfileId;
    })();
  }
  return hydration;
};

/**
 * Switches the active profile. A managed-profile id that doesn't currently exist
 * is silently rejected (no-op) — this is what keeps a deleted profile from ever
 * becoming (or staying) active; see managedProfilesStore.ts / ProfileScreen.tsx's
 * delete-confirmation flow, which switches back to OWNER_PROFILE_ID itself
 * BEFORE deleting the profile that was active.
 */
export const setActiveProfileId = async (id: string): Promise<void> => {
  if (id !== OWNER_PROFILE_ID && !getManagedProfiles().some(profile => profile.id === id)) {
    return;
  }
  if (id === activeProfileId) {return;}
  activeProfileId = id;
  notifyListeners();
  await persist(id);
};

export type ActiveProfileIdentity = {
  id: string;
  type: 'owner' | 'daughter';
  isOwnerProfile: boolean;
  isManagedProfile: boolean;
  /** null when isOwnerProfile is true — the owner's own name/photo already have a
   * canonical source (getFirstName() / personalInformationStore.ts); this is not
   * duplicated here to avoid a circular dependency and a second source of truth. */
  managedProfile: ManagedProfile | null;
};

/** Resolves WHICH profile is active and, for a managed one, its full record — the
 * one small abstraction screens use instead of each re-implementing
 * "if owner... else daughter..." themselves (CLAUDE.md §1, reuse over duplication). */
export const getActiveProfileIdentity = (): ActiveProfileIdentity => {
  if (isOwnerActive()) {
    return {id: OWNER_PROFILE_ID, type: 'owner', isOwnerProfile: true, isManagedProfile: false, managedProfile: null};
  }
  const managedProfile = getManagedProfiles().find(profile => profile.id === activeProfileId) ?? null;
  return {id: activeProfileId, type: 'daughter', isOwnerProfile: false, isManagedProfile: true, managedProfile};
};

/** Test-only reset. */
export const resetActiveProfileForTests = async (): Promise<void> => {
  activeProfileId = OWNER_PROFILE_ID;
  hydrated = true;
  hydration = Promise.resolve(activeProfileId);
  notifyListeners();
  try {
    await AsyncStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
  } catch {
    // best-effort cleanup only
  }
};
