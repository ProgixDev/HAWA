import React, {useEffect, useState} from 'react';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import PregnancyStatisticsScreen from './pregnancy/PregnancyStatisticsScreen';
import PostpartumStatisticsScreen from './postpartum/PostpartumStatisticsScreen';
import MiscarriageStatisticsScreen from './miscarriage/MiscarriageStatisticsScreen';
import ConceiveStatisticsScreen from './conceive/ConceiveStatisticsScreen';
import ContraceptionStatisticsScreen from './contraception/ContraceptionStatisticsScreen';
import MenopauseStatisticsScreen from './menopause/MenopauseStatisticsScreen';
import IrregularStatisticsScreen from './irregular/IrregularStatisticsScreen';
import StatisticsScreen from './StatisticsScreen';
import {
  getActiveObjective,
  hydrateActiveObjective,
  subscribeActiveObjective,
  type ObjectiveId,
} from '../state/onboardingPreferences';
import {isOwnerActive, subscribeActiveProfileId} from '../state/activeProfileStore';

type Props = MainTabScreenProps<'Statistics'>;

function ObjectiveAwareStatisticsScreen(props: Props): React.JSX.Element {
  const [objective, setObjective] = useState<ObjectiveId>(getActiveObjective);
  const [ownerActive, setOwnerActive] = useState<boolean>(isOwnerActive);

  useEffect(() => {
    let active = true;
    hydrateActiveObjective().then(value => {if (active) {setObjective(value);}});
    const unsubscribe = subscribeActiveObjective(() => {
      if (active) {setObjective(getActiveObjective());}
    });
    // See HomeScreen.tsx's identical comment — a managed profile only ever
    // gets the "Suivre mon cycle" statistics today.
    const unsubscribeProfile = subscribeActiveProfileId(() => {
      if (active) {setOwnerActive(isOwnerActive());}
    });
    return () => {active = false; unsubscribe(); unsubscribeProfile();};
  }, []);

  const effectiveObjective: ObjectiveId = ownerActive ? objective : 'cycle';

  if (effectiveObjective === 'pregnancy') {
    return <PregnancyStatisticsScreen />;
  }

  if (effectiveObjective === 'postpartum') {
    return <PostpartumStatisticsScreen />;
  }

  if (effectiveObjective === 'loss') {
    return <MiscarriageStatisticsScreen />;
  }

  if (effectiveObjective === 'conceive') {
    return <ConceiveStatisticsScreen />;
  }

  if (effectiveObjective === 'contraception') {
    return <ContraceptionStatisticsScreen />;
  }

  if (effectiveObjective === 'menopause') {
    return <MenopauseStatisticsScreen />;
  }

  if (effectiveObjective === 'irregular') {
    return <IrregularStatisticsScreen />;
  }

  return <StatisticsScreen {...props} />;
}

export default ObjectiveAwareStatisticsScreen;
