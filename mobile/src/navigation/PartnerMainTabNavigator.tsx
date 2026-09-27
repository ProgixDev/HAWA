import React from 'react';
import {createBottomTabNavigator, type BottomTabBarProps} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from './AppNavigator';
import PartnerBottomTabBar from '../components/navigation/PartnerBottomTabBar';
import PartnerHomeScreen from '../screens/awaADeux/partner/PartnerHomeScreen';
import PartnerCalendarScreen from '../screens/awaADeux/partner/PartnerCalendarScreen';
import PartnerAdviceScreen from '../screens/awaADeux/partner/PartnerAdviceScreen';
import PartnerProfileScreen from '../screens/awaADeux/partner/PartnerProfileScreen';

// The PARTNER's own 4-tab space (AWA à deux, frontend demo). Deliberately a SEPARATE
// navigator from MainTabNavigator.tsx (untouched by this feature): the partner has no
// "+" journal action and no health-data editing anywhere, so it cannot simply reuse the
// main user's tabs/JournalSheetHost — it needs its own, smaller tab set.
export type PartnerMainTabParamList = {
  PartnerHome: undefined;
  PartnerCalendar: undefined;
  PartnerAdvice: undefined;
  PartnerProfile: undefined;
};

export type PartnerMainTabScreenProps<T extends keyof PartnerMainTabParamList> = CompositeScreenProps<
  import('@react-navigation/bottom-tabs').BottomTabScreenProps<PartnerMainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

const Tab = createBottomTabNavigator<PartnerMainTabParamList>();

// Same reasoning as MainTabNavigator.tsx's renderTabBar: react-navigation calls `tabBar`
// as a plain function, so a hook-using component needs this stable JSX wrapper to get its
// own Fiber (otherwise "Invalid hook call").
function renderTabBar(props: BottomTabBarProps): React.JSX.Element {
  return <PartnerBottomTabBar {...props} />;
}

export default function PartnerMainTabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator initialRouteName="PartnerHome" screenOptions={{headerShown: false}} tabBar={renderTabBar}>
      <Tab.Screen component={PartnerHomeScreen} name="PartnerHome" />
      <Tab.Screen component={PartnerCalendarScreen} name="PartnerCalendar" />
      <Tab.Screen component={PartnerAdviceScreen} name="PartnerAdvice" />
      <Tab.Screen component={PartnerProfileScreen} name="PartnerProfile" />
    </Tab.Navigator>
  );
}
