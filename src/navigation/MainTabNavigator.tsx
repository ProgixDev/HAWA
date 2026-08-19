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
import DailyJournalSheet, {CYCLE_JOURNAL_ITEMS, type JournalSheetAction} from '../components/journal/DailyJournalSheet';
import HomeScreen from '../screens/HomeScreen';
import ObjectiveAwareCalendarScreen from '../screens/ObjectiveAwareCalendarScreen';
import ObjectiveAwareStatisticsScreen from '../screens/ObjectiveAwareStatisticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {getActiveObjective, hydrateActiveObjective, subscribeActiveObjective, type ObjectiveId} from '../state/onboardingPreferences';
import {POSTPARTUM_JOURNAL_ITEMS} from '../config/postpartumJournalConfig';
import {MISCARRIAGE_JOURNAL_ITEMS} from '../config/miscarriageJournalConfig';
import {CONCEPTION_JOURNAL_ITEMS} from '../config/conceptionJournalConfig';
import {requirePrivateAccess} from './privateAccess';

// Pregnancy's own "Journal quotidien" content — same shared sheet chrome as
// Cycle (see DailyJournalSheet.tsx), only the 5 required categories differ
// (Symptômes ressentis / Poids / Humeur / Sommeil / Informations médicales
// personnelles). Humeur/Sommeil intentionally reuse the exact same shared
// MoodEntry/SleepEntry screens Cycle uses — this is pre-existing Pregnancy
// behavior (unchanged by this task); see the final report for the
// cross-objective-storage caveat that comes with reusing them.
const PREGNANCY_JOURNAL_ITEMS: Array<{
  route: Extract<keyof RootStackParamList, 'PregnancySymptoms' | 'PregnancyWeight' | 'MoodEntry' | 'SleepEntry' | 'PregnancyMedicalInformation'>;
  icon: string;
  title: string;
  subtitle: string;
  tint: string;
}> = [
  {route: 'PregnancySymptoms', icon: 'heart-pulse', title: 'Symptômes ressentis', subtitle: 'Note tes ressentis physiques', tint: '#E9DFFF'},
  {route: 'PregnancyWeight', icon: 'scale-bathroom', title: 'Poids', subtitle: 'Enregistre une mesure en kg', tint: '#DDEEFF'},
  {route: 'MoodEntry', icon: 'emoticon-happy-outline', title: 'Humeur', subtitle: 'Comment te sens-tu aujourd’hui ?', tint: '#F9DDE8'},
  {route: 'SleepEntry', icon: 'weather-night', title: 'Sommeil', subtitle: 'Durée et qualité de ton sommeil', tint: '#E8DDF8'},
  {route: 'PregnancyMedicalInformation', icon: 'shield-lock-outline', title: 'Informations médicales personnelles', subtitle: 'Un espace sobre et privé', tint: '#F3ECFB'},
];

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

  // Same shared sheet chrome (drag-to-dismiss, header image, staggered card
  // entrance) for all three objectives — only title/subtitle/actions differ.
  // See DailyJournalSheet.tsx's JournalSheetAction type: each action carries
  // its own ready-made onPress (close + navigate), so this is the only place
  // that needs to know about route params per objective.
  if (objective === 'pregnancy') {
    const pregnancyActions: JournalSheetAction[] = PREGNANCY_JOURNAL_ITEMS.map(item => ({
      key: item.route,
      icon: item.icon,
      title: item.title,
      subtitle: item.subtitle,
      tint: item.tint,
      onPress: () => {
        close();
        if (item.route === 'PregnancyMedicalInformation') {
          requirePrivateAccess(navigation, 'pregnancyMedicalInformation');
          return;
        }
        navigation.navigate(item.route);
      },
    }));
    return (
      <DailyJournalSheet
        actions={pregnancyActions}
        onClose={close}
        subtitle="Prends quelques secondes pour noter ton bien-être aujourd’hui."
        title="Journal quotidien"
        visible={visible}
      />
    );
  }

  if (objective === 'postpartum') {
    const postpartumActions: JournalSheetAction[] = POSTPARTUM_JOURNAL_ITEMS.map(item => ({
      key: item.key,
      icon: item.icon,
      title: item.label,
      subtitle: item.journalSubtitle,
      tint: item.tint,
      onPress: () => {close(); navigation.navigate('PostpartumJournalEntry', {category: item.key});},
    }));
    return (
      <DailyJournalSheet
        actions={postpartumActions}
        onClose={close}
        subtitle="Prends un instant pour toi aujourd’hui."
        title="Journal quotidien"
        visible={visible}
      />
    );
  }

  if (objective === 'loss') {
    const miscarriageActions: JournalSheetAction[] = MISCARRIAGE_JOURNAL_ITEMS.map(item => ({
      key: item.key,
      icon: item.icon,
      title: item.label,
      subtitle: item.journalSubtitle,
      tint: item.tint,
      onPress: () => {
        close();
        if (item.key === 'personalNotes') {
          requirePrivateAccess(navigation, 'miscarriagePersonalNotes');
          return;
        }
        navigation.navigate('MiscarriageJournalEntry', {category: item.key});
      },
    }));
    return (
      <DailyJournalSheet
        actions={miscarriageActions}
        onClose={close}
        subtitle="Prends un instant pour toi aujourd’hui."
        title="Journal quotidien"
        visible={visible}
      />
    );
  }

  if (objective === 'conceive') {
    const conceiveActions: JournalSheetAction[] = CONCEPTION_JOURNAL_ITEMS.map(item => ({
      key: item.route,
      icon: item.icon,
      title: item.title,
      subtitle: item.subtitle,
      tint: item.tint,
      onPress: () => {close(); navigation.navigate(item.route);},
    }));
    return (
      <DailyJournalSheet
        actions={conceiveActions}
        onClose={close}
        subtitle="Ton suivi de fertilité, un jour à la fois."
        title="Journal quotidien"
        visible={visible}
      />
    );
  }

  const cycleActions: JournalSheetAction[] = CYCLE_JOURNAL_ITEMS.map(item => ({
    key: item.route,
    icon: item.icon,
    title: item.title,
    subtitle: item.subtitle,
    tint: item.tint,
    onPress: () => {close(); navigation.navigate(item.route);},
  }));
  return <DailyJournalSheet actions={cycleActions} onClose={close} visible={visible} />;
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
