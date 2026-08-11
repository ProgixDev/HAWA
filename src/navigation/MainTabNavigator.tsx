import React, {useEffect, useState} from 'react';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
  type BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from './AppNavigator';
import {JournalSheetProvider, useJournalSheet} from './JournalSheetContext';
import CustomBottomTabBar from '../components/navigation/CustomBottomTabBar';
import DailyJournalSheet, {type JournalRoute} from '../components/journal/DailyJournalSheet';
import PregnancyJournalSheet, {type PregnancyJournalRoute} from '../components/pregnancy/PregnancyJournalSheet';
import HomeScreen from '../screens/HomeScreen';
import ObjectiveAwareCalendarScreen from '../screens/ObjectiveAwareCalendarScreen';
import ObjectiveAwareStatisticsScreen from '../screens/ObjectiveAwareStatisticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {getActiveObjective, hydrateActiveObjective, subscribeActiveObjective, type ObjectiveId} from '../state/onboardingPreferences';

export type MainTabParamList = {
  CycleHome: undefined;
  Calendar: undefined;
  Statistics: undefined;
  Profile: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

const Tab = createBottomTabNavigator<MainTabParamList>();

// react-navigation's bottom-tabs invokes the `tabBar` prop as a plain function
// call (`tabBar(props)`), not via JSX/createElement — so passing a
// hook-using component directly (`tabBar={CustomBottomTabBar}`) runs its
// hooks outside of React's render/Fiber machinery and throws "Invalid hook
// call". This stable, module-level wrapper instantiates it via JSX instead,
// so CustomBottomTabBar gets its own Fiber and a valid hook dispatcher.
function renderTabBar(props: BottomTabBarProps): React.JSX.Element {
  return <CustomBottomTabBar {...props} />;
}

function JournalSheetHost({navigation}: Pick<Props, 'navigation'>): React.JSX.Element {
  const {visible, close} = useJournalSheet();
  const [objective, setObjective] = useState<ObjectiveId>(getActiveObjective);

  useEffect(() => {
    let active = true;
    hydrateActiveObjective().then(value => {if (active) {setObjective(value);}});
    const unsubscribe = subscribeActiveObjective(() => {if (active) {setObjective(getActiveObjective());}});
    return () => {active = false; unsubscribe();};
  }, []);

  const navigateFromJournal = (route: JournalRoute) => {
    close();
    navigation.navigate(route);
  };

  const navigateFromPregnancyJournal = (route: PregnancyJournalRoute) => {
    close();
    navigation.navigate(route);
  };

  if (objective === 'pregnancy') {
    return <PregnancyJournalSheet onClose={close} onNavigate={navigateFromPregnancyJournal} visible={visible} />;
  }

  return <DailyJournalSheet onClose={close} onNavigate={navigateFromJournal} visible={visible} />;
}

function MainTabNavigator({navigation}: Props): React.JSX.Element {
  return (
    <JournalSheetProvider>
      <Tab.Navigator
        backBehavior="history"
        screenOptions={{headerShown: false}}
        tabBar={renderTabBar}>
        <Tab.Screen component={HomeScreen} name="CycleHome" />
        <Tab.Screen component={ObjectiveAwareCalendarScreen} name="Calendar" />
        <Tab.Screen component={ObjectiveAwareStatisticsScreen} name="Statistics" />
        <Tab.Screen component={ProfileScreen} name="Profile" />
      </Tab.Navigator>
      <JournalSheetHost navigation={navigation} />
    </JournalSheetProvider>
  );
}

export default MainTabNavigator;
