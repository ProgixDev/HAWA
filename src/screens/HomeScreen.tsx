import React, {useEffect, useState} from 'react';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import PregnancyDashboard from '../components/pregnancy/PregnancyDashboard';
import CycleHomeScreen from './CycleHomeScreen';
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
      if (active) {setObjective(value);}
    });
    const unsubscribe = subscribeActiveObjective(() => {
      if (active) {setObjective(getActiveObjective());}
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (objective === 'pregnancy') {
    return <PregnancyDashboard {...props} />;
  }

  return <CycleHomeScreen {...props} />;
}

export default HomeScreen;
