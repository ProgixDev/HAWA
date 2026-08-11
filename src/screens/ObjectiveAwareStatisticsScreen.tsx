import React, {useEffect, useState} from 'react';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import PregnancyStatisticsScreen from './pregnancy/PregnancyStatisticsScreen';
import StatisticsScreen from './StatisticsScreen';
import {
  getActiveObjective,
  hydrateActiveObjective,
  subscribeActiveObjective,
  type ObjectiveId,
} from '../state/onboardingPreferences';

type Props = MainTabScreenProps<'Statistics'>;

function ObjectiveAwareStatisticsScreen(props: Props): React.JSX.Element {
  const [objective, setObjective] = useState<ObjectiveId>(getActiveObjective);

  useEffect(() => {
    let active = true;
    hydrateActiveObjective().then(value => {if (active) {setObjective(value);}});
    const unsubscribe = subscribeActiveObjective(() => {
      if (active) {setObjective(getActiveObjective());}
    });
    return () => {active = false; unsubscribe();};
  }, []);

  if (objective === 'pregnancy') {
    return <PregnancyStatisticsScreen />;
  }

  return <StatisticsScreen {...props} />;
}

export default ObjectiveAwareStatisticsScreen;
