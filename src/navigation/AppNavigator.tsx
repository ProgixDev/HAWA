import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ObjectiveScreen from '../screens/ObjectiveScreen';
import CycleObjectiveConfirmationScreen from '../screens/CycleObjectiveConfirmationScreen';
import SpiritualPreferencesScreen from '../screens/SpiritualPreferencesScreen';
import SchoolSelectionScreen from '../screens/SchoolSelectionScreen';
import LocationScreen from '../screens/LocationScreen';
import CycleInformationScreen from '../screens/CycleInformationScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import SummaryScreen from '../screens/SummaryScreen';
import AuthScreen from '../screens/AuthScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SecuritySetupScreen from '../screens/SecuritySetupScreen';
import PinSetupScreen from '../screens/PinSetupScreen';
import FaceIdSetupScreen from '../screens/FaceIdSetupScreen';
import CycleHomeScreen from '../screens/CycleHomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import JournalSymptomsScreen from '../screens/journal/JournalSymptomsScreen';
import JournalMoodScreen from '../screens/journal/JournalMoodScreen';
import JournalFlowScreen from '../screens/journal/JournalFlowScreen';
import JournalTemperatureScreen from '../screens/journal/JournalTemperatureScreen';
import JournalSleepScreen from '../screens/journal/JournalSleepScreen';
import JournalActivityScreen from '../screens/journal/JournalActivityScreen';
import JournalHydrationWeightScreen from '../screens/journal/JournalHydrationWeightScreen';
import JournalNoteScreen from '../screens/journal/JournalNoteScreen';
import JournalIntimacyScreen from '../screens/journal/JournalIntimacyScreen';
import PrivateIntimacyUnlockScreen from '../screens/journal/PrivateIntimacyUnlockScreen';
import PrivateIntimacyPinScreen from '../screens/journal/PrivateIntimacyPinScreen';
import PrivateIntimacyFaceIdScreen from '../screens/journal/PrivateIntimacyFaceIdScreen';
import JournalPrivatePhotosScreen from '../screens/journal/JournalPrivatePhotosScreen';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Objective: undefined;
  CycleObjectiveConfirmation: undefined;
  SpiritualPreferences: undefined;
  SchoolSelection: undefined;
  Location: undefined;
  CycleInformation: undefined;
  Privacy: undefined;
  Summary: undefined;
  Auth: undefined;
  Registration: undefined;
  ForgotPassword: undefined;
  SecuritySetup: undefined;
  PinSetup: undefined;
  FaceIdSetup: undefined;
  CycleHome: undefined;
  Profile: undefined;
  SymptomEntry: undefined;
  MoodEntry: undefined;
  FlowEntry: undefined;
  TemperatureEntry: undefined;
  SleepEntry: undefined;
  ActivityEntry: undefined;
  HydrationWeightEntry: undefined;
  NoteEntry: undefined;
  IntimacyEntry: undefined;
  PrivateIntimacyUnlock: undefined;
  PrivateIntimacyPin: undefined;
  PrivateIntimacyFaceId: undefined;
  PrivatePhotoEntry: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{headerShown: false, animation: 'fade'}}>
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
        <Stack.Screen name="SchoolSelection" component={SchoolSelectionScreen} />
        <Stack.Screen name="Location" component={LocationScreen} />
        <Stack.Screen name="CycleInformation" component={CycleInformationScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Registration" component={RegistrationScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="SecuritySetup" component={SecuritySetupScreen} />
        <Stack.Screen name="PinSetup" component={PinSetupScreen} />
        <Stack.Screen name="FaceIdSetup" component={FaceIdSetupScreen} />
        <Stack.Screen name="CycleHome" component={CycleHomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="SymptomEntry" component={JournalSymptomsScreen} />
        <Stack.Screen name="MoodEntry" component={JournalMoodScreen} />
        <Stack.Screen name="FlowEntry" component={JournalFlowScreen} />
        <Stack.Screen name="TemperatureEntry" component={JournalTemperatureScreen} />
        <Stack.Screen name="SleepEntry" component={JournalSleepScreen} />
        <Stack.Screen name="ActivityEntry" component={JournalActivityScreen} />
        <Stack.Screen name="HydrationWeightEntry" component={JournalHydrationWeightScreen} />
        <Stack.Screen name="NoteEntry" component={JournalNoteScreen} />
        <Stack.Screen name="IntimacyEntry" component={JournalIntimacyScreen} />
        <Stack.Screen name="PrivateIntimacyUnlock" component={PrivateIntimacyUnlockScreen} />
        <Stack.Screen name="PrivateIntimacyPin" component={PrivateIntimacyPinScreen} />
        <Stack.Screen name="PrivateIntimacyFaceId" component={PrivateIntimacyFaceIdScreen} />
        <Stack.Screen name="PrivatePhotoEntry" component={JournalPrivatePhotosScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
