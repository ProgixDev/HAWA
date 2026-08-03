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
import SecuritySetupScreen from '../screens/SecuritySetupScreen';
import PinSetupScreen from '../screens/PinSetupScreen';
import FaceIdSetupScreen from '../screens/FaceIdSetupScreen';
import CycleHomeScreen from '../screens/CycleHomeScreen';
import JournalEntryPlaceholderScreen from '../screens/journal/JournalEntryPlaceholderScreen';

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
  SecuritySetup: undefined;
  PinSetup: undefined;
  FaceIdSetup: undefined;
  CycleHome: undefined;
  SymptomEntry: undefined;
  MoodEntry: undefined;
  FlowEntry: undefined;
  TemperatureEntry: undefined;
  NoteEntry: undefined;
  IntimacyEntry: undefined;
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
        <Stack.Screen name="SecuritySetup" component={SecuritySetupScreen} />
        <Stack.Screen name="PinSetup" component={PinSetupScreen} />
        <Stack.Screen name="FaceIdSetup" component={FaceIdSetupScreen} />
        <Stack.Screen name="CycleHome" component={CycleHomeScreen} />
        <Stack.Screen name="SymptomEntry" component={JournalEntryPlaceholderScreen} />
        <Stack.Screen name="MoodEntry" component={JournalEntryPlaceholderScreen} />
        <Stack.Screen name="FlowEntry" component={JournalEntryPlaceholderScreen} />
        <Stack.Screen name="TemperatureEntry" component={JournalEntryPlaceholderScreen} />
        <Stack.Screen name="NoteEntry" component={JournalEntryPlaceholderScreen} />
        <Stack.Screen name="IntimacyEntry" component={JournalEntryPlaceholderScreen} />
        <Stack.Screen name="PrivatePhotoEntry" component={JournalEntryPlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
