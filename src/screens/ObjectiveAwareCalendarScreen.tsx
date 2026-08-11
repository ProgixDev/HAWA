import React, {useEffect, useState} from 'react';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import PregnancyCalendarContent from '../components/pregnancy/PregnancyCalendarContent';
import CalendarScreen from './CalendarScreen';
import {
  getActiveObjective,
  hydrateActiveObjective,
  subscribeActiveObjective,
  type ObjectiveId,
} from '../state/onboardingPreferences';

type Props = MainTabScreenProps<'Calendar'>;

function ObjectiveAwareCalendarScreen(props: Props): React.JSX.Element {
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
    return <PregnancyCalendarContent />;
  }

  return <CalendarScreen {...props} />;
}

export default ObjectiveAwareCalendarScreen;
