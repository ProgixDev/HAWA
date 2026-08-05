import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import {colors} from './src/theme/colors';
import {loadSecurityPreferences} from './src/state/securityPreferences';

// Kick off loading the persisted pin/biometric preferences as early as possible.
// Screens that decide which unlock options to show await this same promise
// before reading isPinEnabled()/isBiometricEnabled().
loadSecurityPreferences();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor={colors.backgroundDark}
        barStyle="light-content"
        hidden
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
