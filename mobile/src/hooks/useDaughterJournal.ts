import {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {getActiveProfileIdentity, subscribeActiveProfileId} from '../state/activeProfileStore';
import {subscribeManagedProfiles, type ManagedProfile} from '../state/managedProfilesStore';

// The mother and a managed daughter profile share the SAME journal screens (see activeProfileStore.ts); only whose
// data they read changes. This hook is the one switch for the daughter-only presentation (no illustrated heroes,
// compact layout, third-person wording with her first name). It returns null for the owner, so every screen that
// branches on it renders EXACTLY as before for the mother. It never changes what is read or saved.

const currentDaughter = (): ManagedProfile | null => {
  const identity = getActiveProfileIdentity();
  return identity.isManagedProfile ? identity.managedProfile : null;
};

export type DaughterJournal = {
  /** The active managed profile, or null when the owner (mother) is active. */
  daughter: ManagedProfile | null;
  /**
   * Text for a journal screen: the owner's own translation key for the mother, `daughterJournal.<daughterKey>` (with
   * `{{name}}` = her first name) for the daughter. Options are passed to both.
   */
  tx: (ownerKey: string, daughterKey: string, options?: Record<string, unknown>) => string;
};

export function useDaughterJournal(): DaughterJournal {
  const {t} = useTranslation();
  const [daughter, setDaughter] = useState<ManagedProfile | null>(currentDaughter);

  useEffect(() => {
    const refresh = () => setDaughter(currentDaughter());
    refresh();
    const unsubscribeActive = subscribeActiveProfileId(refresh);
    const unsubscribeProfiles = subscribeManagedProfiles(refresh);
    return () => {
      unsubscribeActive();
      unsubscribeProfiles();
    };
  }, []);

  const tx = useCallback(
    (ownerKey: string, daughterKey: string, options?: Record<string, unknown>) =>
      daughter
        ? t(`daughterJournal.${daughterKey}`, {...options, name: daughter.firstName})
        : t(ownerKey, options),
    [daughter, t],
  );

  return {daughter, tx};
}
