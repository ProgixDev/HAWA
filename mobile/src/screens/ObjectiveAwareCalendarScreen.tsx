import React, {useEffect, useState} from 'react';

import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import PregnancyCalendarContent from '../components/pregnancy/PregnancyCalendarContent';
import PostpartumCalendarContent from '../components/postpartum/PostpartumCalendarContent';
import MiscarriageCalendarContent from '../components/miscarriage/MiscarriageCalendarContent';
import ConceiveCalendarContent from '../components/conceive/ConceiveCalendarContent';
import ContraceptionCalendarContent from '../components/contraception/ContraceptionCalendarContent';
import MenopauseCalendarContent from '../components/menopause/MenopauseCalendarContent';
import IrregularCalendarContent from '../components/irregular/IrregularCalendarContent';
import CalendarScreen from './CalendarScreen';
import {
  getActiveObjective,
  hydrateActiveObjective,
  subscribeActiveObjective,
  type ObjectiveId,
} from '../state/onboardingPreferences';
import {isOwnerActive, subscribeActiveProfileId} from '../state/activeProfileStore';

type Props = MainTabScreenProps<'Calendar'>;

function ObjectiveAwareCalendarScreen(props: Props): React.JSX.Element {
  const [objective, setObjective] = useState<ObjectiveId>(getActiveObjective);
  const [ownerActive, setOwnerActive] = useState<boolean>(isOwnerActive);

  useEffect(() => {
    let active = true;
    hydrateActiveObjective().then(value => {
      if (active) {setObjective(value);}
    });
    const unsubscribe = subscribeActiveObjective(() => {
      if (active) {setObjective(getActiveObjective());}
    });
    // See HomeScreen.tsx's identical comment — a managed profile only ever
    // gets the "Suivre mon cycle" calendar today.
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
    return <PregnancyCalendarContent />;
  }

  if (effectiveObjective === 'postpartum') {
    return <PostpartumCalendarContent />;
  }

  if (effectiveObjective === 'loss') {
    return <MiscarriageCalendarContent />;
  }

  if (effectiveObjective === 'conceive') {
    return <ConceiveCalendarContent />;
  }

  if (effectiveObjective === 'contraception') {
    return <ContraceptionCalendarContent />;
  }

  if (effectiveObjective === 'menopause') {
    return <MenopauseCalendarContent />;
  }

  if (effectiveObjective === 'irregular') {
    return <IrregularCalendarContent />;
  }

  return <CalendarScreen {...props} />;
}

export default ObjectiveAwareCalendarScreen;
