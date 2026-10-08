import React, {useEffect, useState} from 'react';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
  type BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from './AppNavigator';
import {JournalSheetProvider, useJournalSheet} from './JournalSheetContext';
import CustomBottomTabBar from '../components/navigation/CustomBottomTabBar';
import DailyJournalSheet, {getCycleJournalItems, type JournalSheetAction} from '../components/journal/DailyJournalSheet';
import HomeScreen from '../screens/HomeScreen';
import ObjectiveAwareCalendarScreen from '../screens/ObjectiveAwareCalendarScreen';
import ObjectiveAwareStatisticsScreen from '../screens/ObjectiveAwareStatisticsScreen';
import DataAvailabilityBanner from '../components/security/DataAvailabilityBanner';
import ProfileScreen from '../screens/ProfileScreen';
import {getActiveObjective, hydrateActiveObjective, subscribeActiveObjective, type ObjectiveId} from '../state/onboardingPreferences';
import {isOwnerActive, subscribeActiveProfileId} from '../state/activeProfileStore';
import {POSTPARTUM_JOURNAL_ITEMS} from '../config/postpartumJournalConfig';
import {MISCARRIAGE_JOURNAL_ITEMS} from '../config/miscarriageJournalConfig';
import {IRREGULAR_JOURNAL_ITEMS} from '../config/irregularJournalConfig';
import {getConceptionJournalItems} from '../config/conceptionJournalConfig';
import {CONTRACEPTION_JOURNAL_ITEMS} from '../config/contraceptionJournalConfig';
import {contraceptionDefaultIntakeActionLabel, contraceptionIntakeActionLabels} from '../config/contraceptionLabels';
import {getContraceptionPreferences} from '../state/contraceptionPreferences';
import {getConceptionPreferences} from '../state/conceptionPreferences';
import {MENOPAUSE_JOURNAL_ITEMS} from '../config/menopauseJournalConfig';
import {getMenopausePreferences} from '../state/menopausePreferences';
import {requirePrivateAccess} from './privateAccess';
import {usePregnancyTrackingPreferences} from '../hooks/usePregnancyTrackingPreferences';
import '../i18n';
import type {PregnancyTrackingPreference} from '../state/pregnancyPreferences';

// Pregnancy's own "Journal quotidien" content — same shared sheet chrome as
// Cycle (see DailyJournalSheet.tsx), only the 5 required categories differ
// (Symptômes ressentis / Poids / Humeur / Sommeil / Informations médicales
// personnelles). Humeur/Sommeil intentionally reuse the exact same shared
// MoodEntry/SleepEntry screens Cycle uses — this is pre-existing Pregnancy
// behavior (unchanged by this task); see the final report for the
// cross-objective-storage caveat that comes with reusing them.
//
// PHASE 7H: a function (not a static array), same convention as
// getCycleJournalItems() — called fresh on every render so title/subtitle
// stay in sync with the active app language instead of a French-only
// module-level snapshot (this was a genuine, standalone gap: every sibling
// objective's own *_JOURNAL_ITEMS config already followed this pattern).
function pregnancyJournalItems(t: (key: string) => string): Array<{
  route: Extract<keyof RootStackParamList, 'PregnancySymptoms' | 'PregnancyWeight' | 'MoodEntry' | 'SleepEntry' | 'PregnancyMedicalInformation'>;
  icon: string;
  title: string;
  subtitle: string;
  tint: string;
  /** The tracking-preference id (pregnancyPreferences.ts) that controls
   * whether this category is offered in the CURRENT journal. */
  preferenceKey: PregnancyTrackingPreference;
}> {
  return [
    {route: 'PregnancySymptoms', icon: 'heart-pulse', title: t('dailyJournalSheet.pregnancyItems.symptoms.title'), subtitle: t('dailyJournalSheet.pregnancyItems.symptoms.subtitle'), tint: '#E9DFFF', preferenceKey: 'symptoms'},
    {route: 'PregnancyWeight', icon: 'scale-bathroom', title: t('dailyJournalSheet.pregnancyItems.weight.title'), subtitle: t('dailyJournalSheet.pregnancyItems.weight.subtitle'), tint: '#DDEEFF', preferenceKey: 'weight'},
    {route: 'MoodEntry', icon: 'emoticon-happy-outline', title: t('dailyJournalSheet.pregnancyItems.mood.title'), subtitle: t('dailyJournalSheet.pregnancyItems.mood.subtitle'), tint: '#F9DDE8', preferenceKey: 'mood'},
    {route: 'SleepEntry', icon: 'weather-night', title: t('dailyJournalSheet.pregnancyItems.sleep.title'), subtitle: t('dailyJournalSheet.pregnancyItems.sleep.subtitle'), tint: '#E8DDF8', preferenceKey: 'sleep'},
    {route: 'PregnancyMedicalInformation', icon: 'shield-lock-outline', title: t('dailyJournalSheet.pregnancyItems.medicalInfo.title'), subtitle: t('dailyJournalSheet.pregnancyItems.medicalInfo.subtitle'), tint: '#F3ECFB', preferenceKey: 'medicalInfo'},
  ];
}

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
  const {t} = useTranslation();
  const {visible, close} = useJournalSheet();
  const [objective, setObjective] = useState<ObjectiveId>(getActiveObjective);
  const [ownerActive, setOwnerActive] = useState<boolean>(isOwnerActive);
  const pregnancyTracking = usePregnancyTrackingPreferences();

  useEffect(() => {
    let active = true;
    hydrateActiveObjective().then(value => {if (active) {setObjective(value);}});
    const unsubscribe = subscribeActiveObjective(() => {if (active) {setObjective(getActiveObjective());}});
    // See HomeScreen.tsx's identical comment — a managed profile only ever
    // gets the "Suivre mon cycle" journal categories today, and every entry
    // saved from here is written under HER active profile id (dailyJournalStore.ts).
    const unsubscribeProfile = subscribeActiveProfileId(() => {if (active) {setOwnerActive(isOwnerActive());}});
    return () => {active = false; unsubscribe(); unsubscribeProfile();};
  }, []);

  const effectiveObjective: ObjectiveId = ownerActive ? objective : 'cycle';

  // Same shared sheet chrome (drag-to-dismiss, header image, staggered card
  // entrance) for all three objectives — only title/subtitle/actions differ.
  // See DailyJournalSheet.tsx's JournalSheetAction type: each action carries
  // its own ready-made onPress (close + navigate), so this is the only place
  // that needs to know about route params per objective.
  if (effectiveObjective === 'pregnancy') {
    // Only the categories the user chose to track (tracking preferences) are
    // offered NOW; recorded history is never affected. Nothing selected → one
    // action that opens the preference screen in edit mode.
    const trackedPregnancyItems = pregnancyJournalItems(t).filter(item => pregnancyTracking.has(item.preferenceKey));
    const pregnancyActions: JournalSheetAction[] = trackedPregnancyItems.map(item => ({
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
    if (pregnancyActions.length === 0) {
      pregnancyActions.push({
        key: 'PregnancyTrackingPreferences',
        icon: 'tune-variant',
        title: t('dailyJournalSheet.chooseTrackingTitle'),
        subtitle: t('dailyJournalSheet.chooseTrackingSubtitle'),
        tint: '#E9DFFF',
        onPress: () => {
          close();
          navigation.navigate('PregnancyTrackingPreferences', {mode: 'edit'});
        },
      });
    }
    return (
      <DailyJournalSheet
        actions={pregnancyActions}
        onClose={close}
        subtitle={t('dailyJournalSheet.pregnancySubtitle')}
        visible={visible}
      />
    );
  }

  if (effectiveObjective === 'postpartum') {
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
        subtitle={t('dailyJournalSheet.postpartumSubtitle')}
        visible={visible}
      />
    );
  }

  if (effectiveObjective === 'loss') {
    const miscarriageActions: JournalSheetAction[] = MISCARRIAGE_JOURNAL_ITEMS.map(item => ({
      key: item.key,
      icon: item.icon,
      title: item.label,
      subtitle: item.journalSubtitle,
      tint: item.tint,
      onPress: () => {
        close();
        // Single authentication boundary: MiscarriageJournalEntryScreen
        // already gates its own 'personalNotes' category via
        // isIntimacyUnlocked()/PrivateIntimacyUnlock (target:
        // 'miscarriageNotes') — the same pattern every other objective's
        // daily-notes/personal-notes action uses in this same sheet.
        // Routing through requirePrivateAccess() here first caused a
        // second, redundant PIN/biometric prompt.
        navigation.navigate('MiscarriageJournalEntry', {category: item.key});
      },
    }));
    return (
      <DailyJournalSheet
        actions={miscarriageActions}
        onClose={close}
        subtitle={t('dailyJournalSheet.miscarriageSubtitle')}
        visible={visible}
      />
    );
  }

  if (effectiveObjective === 'irregular') {
    // The SOPK period form mirrors its confirmed flow to dailyJournalStore so
    // Calendar/Statistics retain their canonical period record. It remains a
    // separate action because it has SOPK-specific questions and design.
    const irregularActions: JournalSheetAction[] = [
      {
        key: 'periodStart',
        icon: 'water-outline',
        title: t('dailyJournalSheet.periodActionTitle'),
        subtitle: t('dailyJournalSheet.periodActionSubtitle'),
        tint: '#FBEAF0',
        onPress: () => {close(); navigation.navigate('IrregularJournalEntry', {category: 'period'});},
      },
      ...IRREGULAR_JOURNAL_ITEMS.map(item => ({
        key: item.key,
        icon: item.icon,
        title: item.label,
        subtitle: item.dashboardSubtitle,
        tint: item.tint,
        onPress: () => {close(); navigation.navigate('IrregularJournalEntry', {category: item.key});},
      })),
    ];
    return (
      <DailyJournalSheet
        actions={irregularActions}
        onClose={close}
        subtitle={t('dailyJournalSheet.irregularSubtitle')}
        visible={visible}
      />
    );
  }

  if (effectiveObjective === 'conceive') {
    // Filtered by the followed fertility indicators (M17) — same shared
    // helper ConceiveDashboard's "Suivi du jour" card uses.
    const conceiveActions: JournalSheetAction[] = getConceptionJournalItems(getConceptionPreferences().indicators).map(item => ({
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
        subtitle={t('dailyJournalSheet.conceiveSubtitle')}
        visible={visible}
      />
    );
  }

  if (effectiveObjective === 'contraception') {
    const contraceptionMethod = getContraceptionPreferences().method;
    const contraceptionActions: JournalSheetAction[] = CONTRACEPTION_JOURNAL_ITEMS.map(item => ({
      key: item.key,
      icon: item.icon,
      // "Prise / utilisation du jour" adapts to the real persisted method so
      // the wording never assumes every user takes a pill.
      title: item.key === 'intake'
        ? (contraceptionMethod ? contraceptionIntakeActionLabels(t)[contraceptionMethod] : contraceptionDefaultIntakeActionLabel(t))
        : item.label,
      subtitle: item.journalSubtitle,
      tint: item.tint,
      onPress: () => {close(); navigation.navigate('ContraceptionJournalEntry', {category: item.key});},
    }));
    return (
      <DailyJournalSheet
        actions={contraceptionActions}
        onClose={close}
        subtitle={t('dailyJournalSheet.contraceptionSubtitle')}
        visible={visible}
      />
    );
  }

  if (effectiveObjective === 'menopause') {
    const menopausePreferences = getMenopausePreferences();
    const menopauseActions: JournalSheetAction[] = MENOPAUSE_JOURNAL_ITEMS
      // "Traitement hormonal"/"Résultats d'analyses" only appear once the
      // matching onboarding preference makes them relevant — never forced
      // on a user who opted out (see menopausePreferences.ts).
      .filter(item => {
        if (item.key === 'treatment') {return menopausePreferences.hormonalTreatmentStatus === 'track';}
        if (item.key === 'labResults') {return menopausePreferences.labTracking !== null && menopausePreferences.labTracking !== 'none';}
        return true;
      })
      .map(item => ({
        key: item.key,
        icon: item.icon,
        title: item.label,
        subtitle: item.journalSubtitle,
        tint: item.tint,
        onPress: () => {close(); navigation.navigate('MenopauseJournalEntry', {category: item.key});},
      }));
    return (
      <DailyJournalSheet
        actions={menopauseActions}
        onClose={close}
        subtitle={t('dailyJournalSheet.menopauseSubtitle')}
        visible={visible}
      />
    );
  }

  // "Vie intime" is not part of a managed daughter profile's cycle-tracking
  // experience (CLAUDE.md §4 objective isolation) — the feature itself is
  // untouched for the mother; only hidden from HER daughter's own "+" sheet.
  const allCycleJournalItems = getCycleJournalItems();
  const cycleJournalItems = ownerActive
    ? allCycleJournalItems
    : allCycleJournalItems.filter(item => item.route !== 'PrivateIntimacyUnlock');
  const cycleActions: JournalSheetAction[] = cycleJournalItems.map(item => ({
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
      <DataAvailabilityBanner />
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
