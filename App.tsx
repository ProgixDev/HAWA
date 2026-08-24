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
  hydrateCyclePreferences,
  hydrateHijriAdjustmentDays,
  hydrateSpiritualMarkersEnabled,
  subscribeActiveObjective,
  subscribeCyclePreferences,
  subscribeHijriAdjustmentDays,
  subscribeSpiritualMarkersEnabled,
} from './src/state/onboardingPreferences';
import { resyncAllPregnancyNotifications } from './src/utils/pregnancyReminderScheduling';
import { syncPostpartumNifasReminders } from './src/utils/postpartumNifasReminderScheduling';
import { syncConceptionReminders } from './src/utils/conceptionReminderScheduling';
import { syncQadaaReminderNotification } from './src/utils/qadaaReminderScheduling';
import {
  hydrateConfirmedPeriodHistory,
  subscribeConfirmedPeriodHistory,
} from './src/state/confirmedPeriodHistoryStore';
import { hydrateQadaaProgress, subscribeQadaaProgress } from './src/state/qadaaProgressStore';
import {
  hydratePostpartumPreferences,
  subscribePostpartumPreferences,
} from './src/state/postpartumPreferences';
import {
  hydratePostpartumLochia,
  subscribePostpartumLochia,
} from './src/state/postpartumLochiaStore';
import { openPendingPostpartumNifasNotification } from './src/services/postpartumNifasNotificationNavigation';
import { openPendingConceptionReminderNotification } from './src/services/conceptionReminderNotificationNavigation';
import { registerNotificationForegroundHandlers } from './src/services/notificationForegroundHandlers';
import { reconcileInAppNotifications } from './src/services/inAppNotificationReconciliation';
import { hydrateInAppNotifications } from './src/state/inAppNotificationStore';
import {hydrateConceptionPreferences, subscribeConceptionPreferences} from './src/state/conceptionPreferences';
import {hydrateContraceptionPreferences, subscribeContraceptionPreferences} from './src/state/contraceptionPreferences';
import {syncContraceptionReminder} from './src/utils/contraceptionReminderScheduling';
import {hydrateContraceptionIntakeHistory} from './src/state/contraceptionIntakeHistoryStore';
import {hydrateContraceptionJournal} from './src/state/contraceptionJournalStore';
import {hydrateContraceptionEvents} from './src/state/contraceptionEventStore';
import AppLockScreen from './src/screens/AppLockScreen';
import {AUTO_LOCK_TIMEOUT_MS,getAppLockState,lockApp,setAppLockState,subscribeAppLock} from './src/state/appLockStore';
import {isBiometricPromptActive} from './src/services/appSecurityService';
import {requiresAppLock} from './src/state/securityPreferences';
import {migrateLegacyPlainNotes} from './src/services/privateNotesEncryption';

// Kick off loading the persisted pin/biometric preferences as early as possible.
// Screens that decide which unlock options to show await this same promise
// before isPinEnabled()/isBiometricEnabled().
loadSecurityPreferences();
hydrateInAppNotifications();
hydrateConceptionPreferences();
hydrateContraceptionPreferences();
hydrateContraceptionIntakeHistory();
hydrateContraceptionJournal();
hydrateContraceptionEvents();
registerNotificationForegroundHandlers();
// One-shot, idempotent, crash-safe migration of legacy plaintext "Notes
// personnelles" to AES-256-GCM-at-rest — see privateNotesEncryption.ts.
// Never blocks app startup; a failed/partial sweep is retried next launch.
migrateLegacyPlainNotes().catch(() => {});

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

// Post-Ramadan Qadaa local reminder — completes the existing in-screen
// reactive card (FastingQadaaScreen.tsx's shouldShowQadaaReminder()) with a
// real scheduled notification so it can appear while AWA is closed. Not
// objective-gated (mirrors the in-app card, which has none either) but
// depends on confirmed period history and completed-days progress — both
// of which can change independently of Ramadan/spiritual-markers state, so
// both are resynced here too, matching Nifas's "resync on every relevant
// store change" pattern above.
Promise.all([
  hydrateSpiritualMarkersEnabled(),
  hydrateConfirmedPeriodHistory(),
  hydrateQadaaProgress(),
  hydrateHijriAdjustmentDays(),
]).then(syncQadaaReminderNotification);
subscribeSpiritualMarkersEnabled(syncQadaaReminderNotification);
subscribeConfirmedPeriodHistory(syncQadaaReminderNotification);
subscribeQadaaProgress(syncQadaaReminderNotification);
// A changed Hijri adjustment can flip whether today is still classified as
// Ramadan (e.g. a boundary day moves across the Ramadan/Shawwal line) —
// re-evaluate the reminder immediately rather than waiting for one of the
// other subscribed stores to happen to change too.
subscribeHijriAdjustmentDays(syncQadaaReminderNotification);

// TTC ("Essayer de concevoir") local reminders — objective-specific like
// Nifas above; syncConceptionReminders() itself cancels every TTC
// notification when the active objective isn't 'conceive', so switching
// away cleanly clears them and switching back reschedules them. Re-runs on
// cycle-preference changes (a new confirmed period start shifts the fertile
// window/ovulation dates) and on conceptionPreferences changes (toggling a
// "Rappels personnalisés" switch) so the schedule never lags behind either.
Promise.all([
  hydrateActiveObjective(),
  hydrateCyclePreferences(),
  hydrateConceptionPreferences(),
]).then(syncConceptionReminders);
subscribeActiveObjective(syncConceptionReminders);
subscribeCyclePreferences(syncConceptionReminders);
subscribeConceptionPreferences(syncConceptionReminders);

// Contraception's daily reminder — objective-specific like TTC above;
// syncContraceptionReminder() itself cancels the notification whenever the
// active objective isn't 'contraception' or reminders/time aren't both set,
// so switching away or disabling cleanly clears it and switching back or
// re-enabling reschedules it.
Promise.all([
  hydrateActiveObjective(),
  hydrateContraceptionPreferences(),
]).then(syncContraceptionReminder);
subscribeActiveObjective(syncContraceptionReminder);
subscribeContraceptionPreferences(syncContraceptionReminder);

function App(): React.JSX.Element {
  const [lockState, setLockState] = React.useState(getAppLockState);
  const [privacyCover, setPrivacyCover] = React.useState(false);
  const backgroundedAt = React.useRef<number | null>(null);
  useEffect(() => {
    let mounted = true;
    // Cold-start fix: the app must never default to 'unlocked' — once
    // security preferences have hydrated, the lock state must reflect
    // requiresAppLock() immediately, not rely on some later screen (e.g. the
    // Splash screen's own delayed lockApp() call) to catch up. A previous
    // version of this line unconditionally set 'unlocked' here, which left a
    // real (if brief) window on every cold launch where the app was
    // unlocked despite an app-wide PIN/biometric lock being configured.
    loadSecurityPreferences().finally(() => {if (mounted) {setAppLockState(requiresAppLock() ? 'locked' : 'unlocked');}});
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
      <AppNavigator
        onReady={() => {
          openPendingPostpartumNifasNotification();
          openPendingConceptionReminderNotification();
        }}
      />
      {lockState === 'locked' ? <AppLockScreen /> : null}
      {privacyCover ? <View accessibilityLabel="AWA protégée" style={styles.privacyCover}><Text style={styles.privacyCoverText}>AWA</Text><Text style={styles.privacyCoverSubtext}>Ton espace reste privé</Text></View> : null}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({booting: {flex: 1, backgroundColor: '#F8EFFF'},privacyCover:{...StyleSheet.absoluteFillObject,zIndex:10000,alignItems:'center',justifyContent:'center',backgroundColor:'#F5EEFC'},privacyCoverText:{color:'#28166F',fontFamily:'serif',fontSize:38,fontWeight:'700',letterSpacing:5},privacyCoverSubtext:{marginTop:8,color:'#6E618C',fontSize:14}});

export default App;
