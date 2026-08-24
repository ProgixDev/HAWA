import React, {useEffect, useState} from 'react';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import PregnancyCalendarContent from '../components/pregnancy/PregnancyCalendarContent';
import PostpartumCalendarContent from '../components/postpartum/PostpartumCalendarContent';
import MiscarriageCalendarContent from '../components/miscarriage/MiscarriageCalendarContent';
import ConceiveCalendarContent from '../components/conceive/ConceiveCalendarContent';
import ContraceptionCalendarContent from '../components/contraception/ContraceptionCalendarContent';
import MenopauseCalendarContent from '../components/menopause/MenopauseCalendarContent';
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

  if (objective === 'postpartum') {
    return <PostpartumCalendarContent />;
  }

  if (objective === 'loss') {
    return <MiscarriageCalendarContent />;
  }

  if (objective === 'conceive') {
    return <ConceiveCalendarContent />;
  }

  if (objective === 'contraception') {
    return <ContraceptionCalendarContent />;
  }

  if (objective === 'menopause') {
    return <MenopauseCalendarContent />;
  }

  return <CalendarScreen {...props} />;
}

export default ObjectiveAwareCalendarScreen;
