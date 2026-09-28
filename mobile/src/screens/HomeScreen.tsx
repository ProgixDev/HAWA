import React, { useEffect, useState } from 'react';

import type { MainTabScreenProps } from '../navigation/MainTabNavigator';
import PregnancyDashboard from '../components/pregnancy/PregnancyDashboard';
import PostpartumDashboard from '../components/postpartum/PostpartumDashboard';
import MiscarriageDashboard from '../components/miscarriage/MiscarriageDashboard';
import ConceiveDashboard from '../components/conceive/ConceiveDashboard';
import ContraceptionDashboard from '../components/contraception/ContraceptionDashboard';
import MenopauseDashboard from '../components/menopause/MenopauseDashboard';
import IrregularDashboard from '../components/irregular/IrregularDashboard';
import CycleHomeScreen from './CycleHomeScreen';
import { PostpartumSuccessToast } from '../components/postpartum/PostpartumSuccessToast';
import {
  getActiveObjective,
  hydrateActiveObjective,
  subscribeActiveObjective,
  type ObjectiveId,
} from '../state/onboardingPreferences';
import {isOwnerActive, subscribeActiveProfileId} from '../state/activeProfileStore';

type Props = MainTabScreenProps<'CycleHome'>;

function HomeScreen(props: Props): React.JSX.Element {
  const [objective, setObjective] = useState<ObjectiveId>(getActiveObjective);
  const [ownerActive, setOwnerActive] = useState<boolean>(isOwnerActive);

  useEffect(() => {
    let active = true;
    hydrateActiveObjective().then(value => {
      if (active) {
        setObjective(value);
      }
    });
    const unsubscribe = subscribeActiveObjective(() => {
      if (active) {
        setObjective(getActiveObjective());
      }
    });
    // A managed (daughter) profile only ever has the "Suivre mon cycle"
    // experience today (her creation flow never asks about pregnancy/
    // menopause/etc.) — so whichever objective the MOTHER happens to have
    // globally selected must never leak into her dashboard.
    const unsubscribeProfile = subscribeActiveProfileId(() => {
      if (active) {setOwnerActive(isOwnerActive());}
    });
    return () => {
      active = false;
      unsubscribe();
      unsubscribeProfile();
    };
  }, []);

  const effectiveObjective: ObjectiveId = ownerActive ? objective : 'cycle';

  if (effectiveObjective === 'pregnancy') {
    return <PregnancyDashboard {...props} />;
  }

  if (effectiveObjective === 'postpartum') {
    return (
      <>
        <PostpartumDashboard {...props} />
        <PostpartumSuccessToast />
      </>
    );
  }

  if (effectiveObjective === 'loss') {
    return <MiscarriageDashboard {...props} />;
  }

  if (effectiveObjective === 'conceive') {
    return <ConceiveDashboard {...props} />;
  }

  if (effectiveObjective === 'contraception') {
    return <ContraceptionDashboard {...props} />;
  }

  if (effectiveObjective === 'menopause') {
    return <MenopauseDashboard {...props} />;
  }

  if (effectiveObjective === 'irregular') {
    return <IrregularDashboard {...props} />;
  }

  return <CycleHomeScreen {...props} />;
}

export default HomeScreen;
