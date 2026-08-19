import React, { useEffect, useState } from 'react';

import type { MainTabScreenProps } from '../navigation/MainTabNavigator';
import PregnancyDashboard from '../components/pregnancy/PregnancyDashboard';
import PostpartumDashboard from '../components/postpartum/PostpartumDashboard';
import MiscarriageDashboard from '../components/miscarriage/MiscarriageDashboard';
import ConceiveDashboard from '../components/conceive/ConceiveDashboard';
import CycleHomeScreen from './CycleHomeScreen';
import { PostpartumSuccessToast } from '../components/postpartum/PostpartumSuccessToast';
import {
  getActiveObjective,
  hydrateActiveObjective,
  subscribeActiveObjective,
  type ObjectiveId,
} from '../state/onboardingPreferences';

type Props = MainTabScreenProps<'CycleHome'>;

function HomeScreen(props: Props): React.JSX.Element {
  const [objective, setObjective] = useState<ObjectiveId>(getActiveObjective);

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
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (objective === 'pregnancy') {
    return <PregnancyDashboard {...props} />;
  }

  if (objective === 'postpartum') {
    return (
      <>
        <PostpartumDashboard {...props} />
        <PostpartumSuccessToast />
      </>
    );
  }

  if (objective === 'loss') {
    return <MiscarriageDashboard {...props} />;
  }

  if (objective === 'conceive') {
    return <ConceiveDashboard {...props} />;
  }

  return <CycleHomeScreen {...props} />;
}

export default HomeScreen;
