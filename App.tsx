import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import {colors} from './src/theme/colors';
import {loadSecurityPreferences} from './src/state/securityPreferences';
import {getActiveObjective, hydrateActiveObjective, subscribeActiveObjective} from './src/state/onboardingPreferences';
import {resyncAllPregnancyNotifications} from './src/utils/pregnancyReminderScheduling';

// Kick off loading the persisted pin/biometric preferences as early as possible.
// Screens that decide which unlock options to show await this same promise
// before isPinEnabled()/isBiometricEnabled().
loadSecurityPreferences();

// Pregnancy Tracking reminders are objective-specific: they must only be
// (re)scheduled while the user's active objective is 'pregnancy', never for
// 'cycle' or any other objective. Re-derives and reschedules every Pregnancy
// Tracking reminder from persisted state so they survive an app restart, not
// just a screen revisit — and re-runs whenever the active objective changes
// so switching back into Suivi de grossesse mid-session resyncs them again.
// Switching away never cancels or clears anything — just stops scheduling
// new ones, so nothing is lost if the user switches back later.
function resyncPregnancyNotificationsIfActive(): void {
  if (getActiveObjective() === 'pregnancy') {
    resyncAllPregnancyNotifications();
  }
}

hydrateActiveObjective().then(resyncPregnancyNotificationsIfActive);
subscribeActiveObjective(resyncPregnancyNotificationsIfActive);

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
