import {useCallback, useEffect, useState} from 'react';

import {
  OWNER_PROFILE_ID,
  getActiveProfileId,
  hydrateActiveProfileId,
  setActiveProfileId,
  subscribeActiveProfileId,
} from '../state/activeProfileStore';
import {
  getManagedProfiles,
  hydrateManagedProfiles,
  subscribeManagedProfiles,
  type ManagedProfile,
} from '../state/managedProfilesStore';
import {seedManagedProfileCycleIfNeeded} from '../state/managedProfileCycleSeed';

// Which profiles exist (the mother's daughters) and which one is active, kept live, plus the same switch ProfileScreen's
// "Gérer les profils" sheet performs. Used by the Home banner, the "Découvrir" cards and the Profile's "AWA pour ma fille" section.
export function useProfileSwitch() {
  const [profiles, setProfiles] = useState<ManagedProfile[]>(getManagedProfiles);
  const [activeId, setActiveId] = useState<string>(getActiveProfileId);

  useEffect(() => {
    let active = true;
    hydrateManagedProfiles().then(value => {
      if (active) {setProfiles(value);}
    });
    hydrateActiveProfileId().then(value => {
      if (active) {setActiveId(value);}
    });
    const unsubscribeProfiles = subscribeManagedProfiles(() => {
      if (active) {setProfiles(getManagedProfiles());}
    });
    const unsubscribeActive = subscribeActiveProfileId(() => {
      if (active) {setActiveId(getActiveProfileId());}
    });
    return () => {
      active = false;
      unsubscribeProfiles();
      unsubscribeActive();
    };
  }, []);

  const switchTo = useCallback((id: string) => {
    // First-time-only seed of a daughter's own cycle context (a no-op once she has data, and for the owner).
    setActiveProfileId(id)
      .then(() => (id === OWNER_PROFILE_ID ? undefined : seedManagedProfileCycleIfNeeded(id)))
      .catch(() => undefined);
  }, []);

  const activeDaughter = activeId === OWNER_PROFILE_ID ? null : profiles.find(profile => profile.id === activeId) ?? null;

  return {daughters: profiles, activeDaughter, ownerActive: activeDaughter === null, switchTo};
}
