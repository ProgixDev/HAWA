import React, { useEffect } from 'react';
import { AppState, StatusBar, StyleSheet, Text, View } from 'react-native';
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
import {hydrateConceptionPreferences} from './src/state/conceptionPreferences';
import AppLockScreen from './src/screens/AppLockScreen';
import {AUTO_LOCK_TIMEOUT_MS,getAppLockState,lockApp,setAppLockState,subscribeAppLock} from './src/state/appLockStore';
import {isBiometricPromptActive} from './src/services/appSecurityService';
import {requiresAppLock} from './src/state/securityPreferences';

// Kick off loading the persisted pin/biometric preferences as early as possible.
// Screens that decide which unlock options to show await this same promise
// before isPinEnabled()/isBiometricEnabled().
loadSecurityPreferences();
hydrateInAppNotifications();
hydrateConceptionPreferences();
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
  const [lockState, setLockState] = React.useState(getAppLockState);
  const [privacyCover, setPrivacyCover] = React.useState(false);
  const backgroundedAt = React.useRef<number | null>(null);
  useEffect(() => {
    let mounted = true;
    loadSecurityPreferences().finally(() => {if (mounted) {setAppLockState('unlocked');}});
    const unsubscribeLock = subscribeAppLock(() => {if (mounted) {setLockState(getAppLockState());}});
    reconcileInAppNotifications().catch(() => {});
    const subscription = AppState.addEventListener('change', state => {
      if (isBiometricPromptActive()) {return;}
      if (state === 'active') {
        setPrivacyCover(false);
        if (backgroundedAt.current && Date.now() - backgroundedAt.current >= AUTO_LOCK_TIMEOUT_MS && requiresAppLock()) {lockApp();}
        backgroundedAt.current = null;
        reconcileInAppNotifications().catch(() => {});
      } else if (state === 'background') {
        setPrivacyCover(true);
        backgroundedAt.current = Date.now();
      }
    });
    return () => {mounted = false; subscription.remove(); unsubscribeLock();};
  }, []);

  if (lockState === 'booting') {return <View style={styles.booting} />;}

  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor={colors.backgroundDark}
        barStyle="light-content"
        hidden
      />
      <AppNavigator onReady={openPendingPostpartumNifasNotification} />
      {lockState === 'locked' ? <AppLockScreen /> : null}
      {privacyCover ? <View accessibilityLabel="AWA protégée" style={styles.privacyCover}><Text style={styles.privacyCoverText}>AWA</Text><Text style={styles.privacyCoverSubtext}>Ton espace reste privé</Text></View> : null}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({booting: {flex: 1, backgroundColor: '#F8EFFF'},privacyCover:{...StyleSheet.absoluteFillObject,zIndex:10000,alignItems:'center',justifyContent:'center',backgroundColor:'#F5EEFC'},privacyCoverText:{color:'#28166F',fontFamily:'serif',fontSize:38,fontWeight:'700',letterSpacing:5},privacyCoverSubtext:{marginTop:8,color:'#6E618C',fontSize:14}});

export default App;
