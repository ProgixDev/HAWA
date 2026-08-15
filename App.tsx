import React, { useEffect } from 'react';
import { AppState, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import {
  loadSecurityPreferences,
  subscribePrivacySecuritySettings,
} from './src/state/securityPreferences';
import {
  getActiveObjective,
  hydrateActiveObjective,
  hydrateSpiritualMarkersEnabled,
  subscribeActiveObjective,
  subscribeSpiritualMarkersEnabled,
} from './src/state/onboardingPreferences';
import { resyncAllPregnancyNotifications } from './src/utils/pregnancyReminderScheduling';
import { syncPostpartumNifasReminders } from './src/utils/postpartumNifasReminderScheduling';
import {
  hydratePostpartumPreferences,
  subscribePostpartumPreferences,
} from './src/state/postpartumPreferences';
import {
  hydratePostpartumLochia,
  subscribePostpartumLochia,
} from './src/state/postpartumLochiaStore';
import { openPendingPostpartumNifasNotification } from './src/services/postpartumNifasNotificationNavigation';
import { registerNotificationForegroundHandlers } from './src/services/notificationForegroundHandlers';
import { reconcileInAppNotifications } from './src/services/inAppNotificationReconciliation';
import { hydrateInAppNotifications } from './src/state/inAppNotificationStore';

// Kick off loading the persisted pin/biometric preferences as early as possible.
// Screens that decide which unlock options to show await this same promise
// before isPinEnabled()/isBiometricEnabled().
loadSecurityPreferences();
hydrateInAppNotifications();
registerNotificationForegroundHandlers();

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

function syncNifasReminders(): void {
  syncPostpartumNifasReminders();
}

Promise.all([
  hydrateActiveObjective(),
  hydrateSpiritualMarkersEnabled(),
  hydratePostpartumPreferences(),
  hydratePostpartumLochia(),
  loadSecurityPreferences(),
]).then(syncNifasReminders);
subscribeActiveObjective(syncNifasReminders);
subscribeSpiritualMarkersEnabled(syncNifasReminders);
subscribePostpartumPreferences(syncNifasReminders);
subscribePostpartumLochia(syncNifasReminders);
subscribePrivacySecuritySettings(syncNifasReminders);

function App(): React.JSX.Element {
  useEffect(() => {
    reconcileInAppNotifications().catch(() => {});
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        reconcileInAppNotifications().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor={colors.backgroundDark}
        barStyle="light-content"
        hidden
      />
      <AppNavigator onReady={openPendingPostpartumNifasNotification} />
    </SafeAreaProvider>
  );
}

export default App;
