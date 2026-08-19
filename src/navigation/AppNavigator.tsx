import React from 'react';
import {
  NavigationContainer,
  type NavigatorScreenParams,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ObjectiveScreen from '../screens/ObjectiveScreen';
import CycleObjectiveConfirmationScreen from '../screens/CycleObjectiveConfirmationScreen';
import SpiritualPreferencesScreen from '../screens/SpiritualPreferencesScreen';
import LocationScreen from '../screens/LocationScreen';
import {ConceptionTryingDurationScreen, ConceptionOvulationAwarenessScreen, ConceptionIndicatorsScreen, ConceptionRemindersScreen} from '../screens/ConceptionOnboardingScreens';
import CycleInformationScreen from '../screens/CycleInformationScreen';
import PostpartumDeliveryDateScreen from '../screens/PostpartumDeliveryDateScreen';
import PostpartumDeliveryTypeScreen from '../screens/PostpartumDeliveryTypeScreen';
import PostpartumFeedingScreen from '../screens/PostpartumFeedingScreen';
import PostpartumLochiaScreen from '../screens/PostpartumLochiaScreen';
import PostpartumJournalEntryScreen from '../screens/PostpartumJournalEntryScreen';
import PostpartumCycleReturnScreen from '../screens/PostpartumCycleReturnScreen';
import MiscarriageDateScreen from '../screens/MiscarriageDateScreen';
import MiscarriageBleedingScreen from '../screens/MiscarriageBleedingScreen';
import MiscarriageCycleReturnScreen from '../screens/MiscarriageCycleReturnScreen';
import MiscarriageTryingAgainScreen from '../screens/MiscarriageTryingAgainScreen';
import MiscarriageJournalEntryScreen from '../screens/MiscarriageJournalEntryScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import SummaryScreen from '../screens/SummaryScreen';
import AuthScreen from '../screens/AuthScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SecuritySetupScreen from '../screens/SecuritySetupScreen';
import PinSetupScreen from '../screens/PinSetupScreen';
import PinConfirmScreen from '../screens/PinConfirmScreen';
import PinManagementScreen from '../screens/PinManagementScreen';
import AnonymousModeScreen from '../screens/AnonymousModeScreen';
import AnonymousModeLimitationsScreen from '../screens/AnonymousModeLimitationsScreen';
import AnonymousModeCreatingScreen from '../screens/AnonymousModeCreatingScreen';
import AnonymousModeSuccessScreen from '../screens/AnonymousModeSuccessScreen';
import AnonymousAvatarCustomizerScreen from '../screens/AnonymousAvatarCustomizerScreen';
import FaceIdSetupScreen from '../screens/FaceIdSetupScreen';
import MainTabNavigator, { type MainTabParamList } from './MainTabNavigator';
import JournalSymptomsScreen from '../screens/journal/JournalSymptomsScreen';
import JournalMoodScreen from '../screens/journal/JournalMoodScreen';
import JournalFlowScreen from '../screens/journal/JournalFlowScreen';
import JournalTemperatureScreen from '../screens/journal/JournalTemperatureScreen';
import JournalSleepScreen from '../screens/journal/JournalSleepScreen';
import JournalActivityScreen from '../screens/journal/JournalActivityScreen';
import JournalHydrationWeightScreen from '../screens/journal/JournalHydrationWeightScreen';
import HydrationScreen from '../screens/journal/HydrationScreen';
import MenstrualFlowScreen from '../screens/journal/MenstrualFlowScreen';
import JournalNoteScreen from '../screens/journal/JournalNoteScreen';
import JournalIntimacyScreen from '../screens/journal/JournalIntimacyScreen';
import PrivateIntimacyUnlockScreen from '../screens/journal/PrivateIntimacyUnlockScreen';
import PrivateIntimacyPinScreen from '../screens/journal/PrivateIntimacyPinScreen';
import PrivateIntimacyFaceIdScreen from '../screens/journal/PrivateIntimacyFaceIdScreen';
import JournalPrivatePhotosScreen from '../screens/journal/JournalPrivatePhotosScreen';
import PersonalInformationScreen from '../screens/PersonalInformationScreen';
import GeneralHealthScreen from '../screens/GeneralHealthScreen';
import AboutScreen from '../screens/AboutScreen';
import {
  PrivacyPolicyScreen,
  TermsOfUseScreen,
} from '../screens/LegalDocumentScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import {
  FAQDetailScreen,
  FAQScreen,
  GuidesScreen,
  WhatsNewScreen,
} from '../screens/SupportResourcesScreens';
import type { FaqId } from '../utils/supportContent';
import type { PregnancyMedicalEventType } from '../state/pregnancyMedicalEventsStore';
import type { PostpartumJournalCategory } from '../state/postpartumJournalStore';
import type { MiscarriageJournalCategory } from '../state/miscarriageJournalStore';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import {
  DataManagementScreen,
  DeleteAccountScreen,
} from '../screens/DataPrivacyScreens';
import BackupDataScreen from '../screens/BackupDataScreen';
import {
  DataExportScreen,
  DeleteTrackedDataScreen,
  RestoreBackupScreen,
} from '../screens/BackupUtilityScreens';
import LibraryScreen from '../screens/LibraryScreen';
import FeaturedArticlesScreen from '../screens/FeaturedArticlesScreen';
import ArticleReaderScreen from '../screens/library/ArticleReaderScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import HijriCalendarScreen from '../screens/HijriCalendarScreen';
import FastingQadaaScreen from '../screens/FastingQadaaScreen';
import PregnancySymptomsScreen from '../screens/pregnancy/PregnancySymptomsScreen';
import PregnancyWeightScreen from '../screens/pregnancy/PregnancyWeightScreen';
import PregnancyMedicalInformationScreen from '../screens/pregnancy/PregnancyMedicalInformationScreen';
import PregnancyAppointmentsScreen from '../screens/pregnancy/PregnancyAppointmentsScreen';
import PregnancyWeekScreen from '../screens/pregnancy/PregnancyWeekScreen';
import PregnancyDatingSetupScreen from '../screens/pregnancy/PregnancyDatingSetupScreen';
import PregnancyTrackingPreferencesScreen from '../screens/pregnancy/PregnancyTrackingPreferencesScreen';
import PregnancyRemindersScreen from '../screens/pregnancy/PregnancyRemindersScreen';
import PregnancyNotificationsScreen from '../screens/pregnancy/PregnancyNotificationsScreen';
import PrivateAccessScreen from '../screens/PrivateAccessScreen';
import type { PrivateAccessPurpose } from './privateAccess';
import { navigationRef } from './navigationRef';

// Where the Anonymous Mode flow was entered from — lets the shared screens
// (AnonymousMode → …Limitations → …Creating → …Success → AnonymousAvatarCustomizer)
// behave correctly for both entry points without duplicating any of them:
// 'auth' = fresh setup straight from AuthScreen, ends by entering MainTabs;
// 'settings' (the default when the param is omitted, e.g. from
// PrivacySecurityScreen's existing "Mode anonyme" row) = managing an
// already-completed onboarding, ends by returning to that settings screen.
export type AnonymousFlowSource = 'auth' | 'settings';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Objective: undefined;
  CycleObjectiveConfirmation: undefined;
  SpiritualPreferences: undefined;
  Location: undefined;
  ConceptionTryingDuration: undefined;
  ConceptionOvulationAwareness: undefined;
  ConceptionIndicators: undefined;
  ConceptionReminders: undefined;
  CycleInformation: undefined;
  PostpartumDeliveryDate: undefined;
  PostpartumDeliveryType: undefined;
  PostpartumFeeding: undefined;
  PostpartumLochia: undefined;
  PostpartumJournalEntry: { category: PostpartumJournalCategory };
  PostpartumCycleReturn: undefined;
  MiscarriageDate: undefined;
  MiscarriageBleeding: undefined;
  MiscarriageCycleReturn: undefined;
  MiscarriageTryingAgain: undefined;
  MiscarriageJournalEntry: { category: MiscarriageJournalCategory };
  PregnancyDatingSetup: undefined;
  PregnancyTrackingPreferences: undefined;
  PregnancyReminders: undefined;
  Privacy: undefined;
  Summary: undefined;
  Auth: undefined;
  Registration: undefined;
  ForgotPassword: undefined;
  SecuritySetup: undefined;
  PinSetup: {mode?: 'create' | 'change' | 'disable'; returnTo?: 'previous' | 'onboarding'} | undefined;
  PinConfirm: {returnTo: 'previous' | 'onboarding'};
  PinManagement: undefined;
  AnonymousMode: {source?: AnonymousFlowSource} | undefined;
  AnonymousModeLimitations: {source?: AnonymousFlowSource} | undefined;
  AnonymousModeCreating: {source?: AnonymousFlowSource} | undefined;
  AnonymousModeSuccess: {source?: AnonymousFlowSource} | undefined;
  AnonymousAvatarCustomizer: {source?: AnonymousFlowSource} | undefined;
  FaceIdSetup: {action?: 'enable' | 'manage'} | undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  SymptomEntry: undefined;
  MoodEntry: undefined;
  FlowEntry: undefined;
  TemperatureEntry: undefined;
  SleepEntry: undefined;
  ActivityEntry: undefined;
  HydrationWeightEntry: undefined;
  HydrationScreen: undefined;
  MenstrualFlowScreen: undefined;
  NoteEntry: undefined;
  IntimacyEntry: undefined;
  PrivateIntimacyUnlock: undefined;
  PrivateIntimacyPin: undefined;
  PrivateIntimacyFaceId: undefined;
  PrivatePhotoEntry: undefined;
  PersonalInformation: undefined;
  GeneralHealth: undefined;
  About: undefined;
  TermsOfUse: undefined;
  PrivacyPolicy: undefined;
  HelpSupport: undefined;
  FAQ: undefined;
  FAQDetail: { id: FaqId };
  Guides: undefined;
  WhatsNew: undefined;
  PrivacySecurity: undefined;
  DataManagement: undefined;
  DeleteAccount: undefined;
  BackupData: undefined;
  RestoreBackup: undefined;
  DataExport: undefined;
  DeleteTrackedData: undefined;
  Library: undefined;
  FeaturedArticles: undefined;
  ArticleReader: { articleId: string };
  PrayerTimes: undefined;
  HijriCalendar: undefined;
  FastingQadaa: undefined;
  PregnancySymptoms: undefined;
  PregnancyWeight: undefined;
  PregnancyMedicalInformation: undefined;
  PregnancyAppointments:
    | { initialType?: PregnancyMedicalEventType; eventId?: string }
    | undefined;
  PregnancyWeek: undefined;
  PregnancyNotifications: undefined;
  PrivateAccess: { purpose: PrivateAccessPurpose };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator({
  onReady,
}: {
  onReady?: () => void;
}): React.JSX.Element {
  return (
    <NavigationContainer onReady={onReady} ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Objective" component={ObjectiveScreen} />
        <Stack.Screen
          name="CycleObjectiveConfirmation"
          component={CycleObjectiveConfirmationScreen}
        />
        <Stack.Screen
          name="SpiritualPreferences"
          component={SpiritualPreferencesScreen}
        />
        <Stack.Screen name="Location" component={LocationScreen} />
        <Stack.Screen name="ConceptionTryingDuration" component={ConceptionTryingDurationScreen} />
        <Stack.Screen name="ConceptionOvulationAwareness" component={ConceptionOvulationAwarenessScreen} />
        <Stack.Screen name="ConceptionIndicators" component={ConceptionIndicatorsScreen} />
        <Stack.Screen name="ConceptionReminders" component={ConceptionRemindersScreen} />
        <Stack.Screen
          name="CycleInformation"
          component={CycleInformationScreen}
        />
        <Stack.Screen
          name="PostpartumDeliveryDate"
          component={PostpartumDeliveryDateScreen}
        />
        <Stack.Screen
          name="PostpartumDeliveryType"
          component={PostpartumDeliveryTypeScreen}
        />
        <Stack.Screen
          name="PostpartumFeeding"
          component={PostpartumFeedingScreen}
        />
        <Stack.Screen
          name="PostpartumLochia"
          component={PostpartumLochiaScreen}
        />
        <Stack.Screen
          name="PostpartumJournalEntry"
          component={PostpartumJournalEntryScreen}
        />
        <Stack.Screen
          name="PostpartumCycleReturn"
          component={PostpartumCycleReturnScreen}
        />
        <Stack.Screen
          name="MiscarriageDate"
          component={MiscarriageDateScreen}
        />
        <Stack.Screen
          name="MiscarriageBleeding"
          component={MiscarriageBleedingScreen}
        />
        <Stack.Screen
          name="MiscarriageCycleReturn"
          component={MiscarriageCycleReturnScreen}
        />
        <Stack.Screen
          name="MiscarriageTryingAgain"
          component={MiscarriageTryingAgainScreen}
        />
        <Stack.Screen
          name="MiscarriageJournalEntry"
          component={MiscarriageJournalEntryScreen}
        />
        <Stack.Screen
          name="PregnancyDatingSetup"
          component={PregnancyDatingSetupScreen}
        />
        <Stack.Screen
          name="PregnancyTrackingPreferences"
          component={PregnancyTrackingPreferencesScreen}
        />
        <Stack.Screen
          name="PregnancyReminders"
          component={PregnancyRemindersScreen}
        />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Registration" component={RegistrationScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="SecuritySetup" component={SecuritySetupScreen} />
        <Stack.Screen name="PinSetup" component={PinSetupScreen} />
        <Stack.Screen name="PinConfirm" component={PinConfirmScreen} />
        <Stack.Screen name="PinManagement" component={PinManagementScreen} />
        <Stack.Screen name="AnonymousMode" component={AnonymousModeScreen} />
        <Stack.Screen name="AnonymousModeLimitations" component={AnonymousModeLimitationsScreen} />
        <Stack.Screen name="AnonymousModeCreating" component={AnonymousModeCreatingScreen} />
        <Stack.Screen name="AnonymousModeSuccess" component={AnonymousModeSuccessScreen} />
        <Stack.Screen name="AnonymousAvatarCustomizer" component={AnonymousAvatarCustomizerScreen} />
        <Stack.Screen name="FaceIdSetup" component={FaceIdSetupScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="SymptomEntry" component={JournalSymptomsScreen} />
        <Stack.Screen name="MoodEntry" component={JournalMoodScreen} />
        <Stack.Screen name="FlowEntry" component={JournalFlowScreen} />
        <Stack.Screen
          name="TemperatureEntry"
          component={JournalTemperatureScreen}
        />
        <Stack.Screen name="SleepEntry" component={JournalSleepScreen} />
        <Stack.Screen name="ActivityEntry" component={JournalActivityScreen} />
        <Stack.Screen
          name="HydrationWeightEntry"
          component={JournalHydrationWeightScreen}
        />
        <Stack.Screen name="HydrationScreen" component={HydrationScreen} />
        <Stack.Screen
          name="MenstrualFlowScreen"
          component={MenstrualFlowScreen}
        />
        <Stack.Screen name="NoteEntry" component={JournalNoteScreen} />
        <Stack.Screen name="IntimacyEntry" component={JournalIntimacyScreen} />
        <Stack.Screen
          name="PrivateIntimacyUnlock"
          component={PrivateIntimacyUnlockScreen}
        />
        <Stack.Screen
          name="PrivateIntimacyPin"
          component={PrivateIntimacyPinScreen}
        />
        <Stack.Screen
          name="PrivateIntimacyFaceId"
          component={PrivateIntimacyFaceIdScreen}
        />
        <Stack.Screen
          name="PrivatePhotoEntry"
          component={JournalPrivatePhotosScreen}
        />
        <Stack.Screen
          name="PersonalInformation"
          component={PersonalInformationScreen}
        />
        <Stack.Screen name="GeneralHealth" component={GeneralHealthScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="FAQ" component={FAQScreen} />
        <Stack.Screen name="FAQDetail" component={FAQDetailScreen} />
        <Stack.Screen name="Guides" component={GuidesScreen} />
        <Stack.Screen name="WhatsNew" component={WhatsNewScreen} />
        <Stack.Screen
          name="PrivacySecurity"
          component={PrivacySecurityScreen}
        />
        <Stack.Screen name="DataManagement" component={DataManagementScreen} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
        <Stack.Screen name="BackupData" component={BackupDataScreen} />
        <Stack.Screen name="RestoreBackup" component={RestoreBackupScreen} />
        <Stack.Screen name="DataExport" component={DataExportScreen} />
        <Stack.Screen
          name="DeleteTrackedData"
          component={DeleteTrackedDataScreen}
        />
        <Stack.Screen name="Library" component={LibraryScreen} />
        <Stack.Screen
          name="FeaturedArticles"
          component={FeaturedArticlesScreen}
        />
        <Stack.Screen name="ArticleReader" component={ArticleReaderScreen} />
        <Stack.Screen name="PrayerTimes" component={PrayerTimesScreen} />
        <Stack.Screen name="HijriCalendar" component={HijriCalendarScreen} />
        <Stack.Screen name="FastingQadaa" component={FastingQadaaScreen} />
        <Stack.Screen
          name="PregnancySymptoms"
          component={PregnancySymptomsScreen}
        />
        <Stack.Screen
          name="PregnancyWeight"
          component={PregnancyWeightScreen}
        />
        <Stack.Screen
          name="PregnancyMedicalInformation"
          component={PregnancyMedicalInformationScreen}
        />
        <Stack.Screen
          name="PregnancyAppointments"
          component={PregnancyAppointmentsScreen}
        />
        <Stack.Screen name="PregnancyWeek" component={PregnancyWeekScreen} />
        <Stack.Screen
          name="PregnancyNotifications"
          component={PregnancyNotificationsScreen}
        />
        <Stack.Screen name="PrivateAccess" component={PrivateAccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
