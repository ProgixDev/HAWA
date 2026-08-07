import React from 'react';
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
import CycleHomeScreen from '../screens/CycleHomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import ProfileScreen from '../screens/ProfileScreen';

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

  const navigateFromJournal = (route: JournalRoute) => {
    close();
    navigation.navigate(route);
  };

  return <DailyJournalSheet onClose={close} onNavigate={navigateFromJournal} visible={visible} />;
}

function MainTabNavigator({navigation}: Props): React.JSX.Element {
  return (
    <JournalSheetProvider>
      <Tab.Navigator
        backBehavior="history"
        screenOptions={{headerShown: false}}
        tabBar={renderTabBar}>
        <Tab.Screen component={CycleHomeScreen} name="CycleHome" />
        <Tab.Screen component={CalendarScreen} name="Calendar" />
        <Tab.Screen component={StatisticsScreen} name="Statistics" />
        <Tab.Screen component={ProfileScreen} name="Profile" />
      </Tab.Navigator>
      <JournalSheetHost navigation={navigation} />
    </JournalSheetProvider>
  );
}

export default MainTabNavigator;
