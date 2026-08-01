import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import {colors} from './src/theme/colors';

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
