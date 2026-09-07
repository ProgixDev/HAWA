import React, { useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { AwaThemeProvider } from './src/theme/AwaThemeProvider';
import { AwaRootStatusBar } from './src/theme/AwaRootStatusBar';
import { PrivacyCover } from './src/theme/PrivacyCover';
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
import { syncPostpartumDailyTrackingReminder } from './src/utils/postpartumReminderScheduling';
import { syncMiscarriageDailyTrackingReminder } from './src/utils/miscarriageReminderScheduling';
import { syncConceptionReminders } from './src/utils/conceptionReminderScheduling';
import { syncIrregularReminders } from './src/utils/irregularReminderScheduling';
import { hydrateIrregularPreferences, subscribeIrregularPreferences } from './src/state/irregularPreferences';
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
  hydrateMiscarriagePreferences,
  subscribeMiscarriagePreferences,
} from './src/state/miscarriagePreferences';
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
import {hydrateMenopausePreferences, subscribeMenopausePreferences} from './src/state/menopausePreferences';
import {syncMenopauseReminders} from './src/utils/menopauseReminderScheduling';
import {openPendingMenopauseReminderNotification} from './src/services/menopauseReminderNotificationNavigation';
import {hydrateCycleReminderPreferences, subscribeCycleReminderPreferences} from './src/state/cycleReminderPreferences';
import {syncCycleReminders} from './src/utils/cycleReminderScheduling';
import AppLockScreen from './src/screens/AppLockScreen';
import {AUTO_LOCK_TIMEOUT_MS,getAppLockState,lockApp,setAppLockState,subscribeAppLock} from './src/state/appLockStore';
import {isBiometricPromptActive} from './src/services/appSecurityService';
import {requiresAppLock} from './src/state/securityPreferences';
import {migrateLegacyPlainNotes} from './src/services/privateNotesEncryption';
import {initializePremium} from './src/services/purchaseService';
import {migrateLegacyPlainMiscarriageNotes} from './src/state/miscarriageJournalStore';
import {migrateLegacyPlainPostpartumMoodNotes} from './src/state/postpartumJournalStore';
import {migrateLegacyPlainPregnancyNotes} from './src/state/pregnancyJournalStore';
import {migrateLegacyPlainPregnancyMedicalEventNotes} from './src/state/pregnancyMedicalEventsStore';
import {migrateLegacyPlainGeneralHealthNotes} from './src/state/generalHealthStore';
import {migrateLegacyPlainPersonalInformation} from './src/state/personalInformationStore';
import {migrateLegacyPlainIrregularNotes} from './src/state/irregularJournalStore';
import {migrateLegacyPlainMenopauseNotes} from './src/state/menopauseJournalStore';
import {migrateLegacyPlainDailyJournalNotes} from './src/state/dailyJournalStore';
import {migrateLegacyPlainContraceptionNotes} from './src/state/contraceptionJournalStore';
import {migrateLegacyPlainPostpartumLochiaNotes} from './src/state/postpartumLochiaStore';
import {migrateLegacyPlainPregnancyCustomReminders} from './src/state/pregnancyCustomRemindersStore';
import {migrateLegacyPlainPregnancyHealthReminders} from './src/state/pregnancyHealthRemindersStore';

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
// Premium/subscription status must be known (or explicitly "unknown, still
// resolving") before any screen renders a Premium gate — never left to the
// default `initialized: false` indefinitely, so usePremium() consumers can
// tell "loading" apart from "confirmed free" and avoid a flash of unlocked
// content that then locks itself. Never throws (see purchaseService.ts).
initializePremium();
// One-shot, idempotent, crash-safe migration of legacy plaintext "Notes
// personnelles" to AES-256-GCM-at-rest — see privateNotesEncryption.ts.
// Never blocks app startup; a failed/partial sweep is retried next launch.
migrateLegacyPlainNotes().catch(() => {});
// Same one-shot/idempotent/crash-safe encryption-at-rest migration, extended
// to the other objective stores' sensitive free-text fields (see each
// store's own migrateLegacyPlain*() doc comment). Each checks the raw
// persisted JSON first and is a no-op once already migrated, so these are
// cheap on every boot after the first. Never blocks app startup.
migrateLegacyPlainMiscarriageNotes().catch(() => {});
migrateLegacyPlainPostpartumMoodNotes().catch(() => {});
migrateLegacyPlainPregnancyNotes().catch(() => {});
migrateLegacyPlainPregnancyMedicalEventNotes().catch(() => {});
migrateLegacyPlainGeneralHealthNotes().catch(() => {});
migrateLegacyPlainPersonalInformation().catch(() => {});
migrateLegacyPlainIrregularNotes().catch(() => {});
migrateLegacyPlainMenopauseNotes().catch(() => {});
migrateLegacyPlainDailyJournalNotes().catch(() => {});
migrateLegacyPlainContraceptionNotes().catch(() => {});
migrateLegacyPlainPostpartumLochiaNotes().catch(() => {});
migrateLegacyPlainPregnancyCustomReminders().catch(() => {});
migrateLegacyPlainPregnancyHealthReminders().catch(() => {});

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

// Post-partum's optional "Suivi quotidien" reminder — objective-specific like
// Menopause's own reminders above; syncPostpartumDailyTrackingReminder()
// itself cancels the notification whenever the active objective isn't
// 'postpartum' or dailyTrackingReminderEnabled/Time isn't set, so switching
// away or disabling cleanly clears it and switching back or re-enabling
// reschedules it. Completely independent from the Nifas reminders above —
// no shared state, no shared notification ID.
Promise.all([
  hydrateActiveObjective(),
  hydratePostpartumPreferences(),
]).then(syncPostpartumDailyTrackingReminder);
subscribeActiveObjective(syncPostpartumDailyTrackingReminder);
subscribePostpartumPreferences(syncPostpartumDailyTrackingReminder);

// Miscarriage ("Après une fausse couche")'s ONLY reminder — the same
// optional "Suivi quotidien" pattern as Postpartum's above, objective-gated
// on 'loss'. syncMiscarriageDailyTrackingReminder() itself cancels the
// notification whenever the active objective isn't 'loss' or
// dailyTrackingReminderEnabled/Time isn't set, so switching away or
// disabling cleanly clears it and switching back or re-enabling reschedules
// it. Deliberately the ONLY Miscarriage reminder — no period/fertility
// prediction is ever computed or scheduled for this objective.
Promise.all([
  hydrateActiveObjective(),
  hydrateMiscarriagePreferences(),
]).then(syncMiscarriageDailyTrackingReminder);
subscribeActiveObjective(syncMiscarriageDailyTrackingReminder);
subscribeMiscarriagePreferences(syncMiscarriageDailyTrackingReminder);

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

// Menopause's two optional reminders (daily tracking + treatment) —
// objective-specific like Contraception's above; syncMenopauseReminders()
// itself cancels both notifications whenever the active objective isn't
// 'menopause' or the relevant enabled/time preference isn't set, so
// switching away or disabling cleanly clears them and switching back or
// re-enabling reschedules them.
Promise.all([
  hydrateActiveObjective(),
  hydrateMenopausePreferences(),
]).then(syncMenopauseReminders);
subscribeActiveObjective(syncMenopauseReminders);
subscribeMenopausePreferences(syncMenopauseReminders);

// Cycle's 5 optional reminders — objective-specific like the others above;
// syncCycleReminders() itself cancels every one of them whenever the active
// objective isn't 'cycle', so switching away cleanly clears them and
// switching back reschedules them. Reuses the SAME subscribeCyclePreferences
// TTC already subscribes to above — a newly recorded/edited/deleted period,
// or a changed regularity setting, all funnel through setCyclePreferences()
// (onboardingPreferences.ts), so this one subscription already covers every
// case where the cycle prediction could have changed.
Promise.all([
  hydrateActiveObjective(),
  hydrateCyclePreferences(),
  hydrateCycleReminderPreferences(),
]).then(syncCycleReminders);
subscribeActiveObjective(syncCycleReminders);
subscribeCyclePreferences(syncCycleReminders);
subscribeCycleReminderPreferences(syncCycleReminders);

// SOPK ("Cycles irréguliers") daily-journal + unrecorded-period reminders —
// objective-specific like the others above; syncIrregularReminders() itself
// cancels both whenever the active objective isn't 'irregular', so switching
// away cleanly clears them and switching back reschedules them. Also
// resubscribes to confirmedPeriodHistoryStore (already hydrated for Cycle
// above) since the unrecorded-period reminder is computed from that same
// real confirmed-period history, never a fabricated/predicted date.
Promise.all([
  hydrateActiveObjective(),
  hydrateIrregularPreferences(),
  hydrateConfirmedPeriodHistory(),
]).then(() => syncIrregularReminders());
subscribeActiveObjective(() => syncIrregularReminders());
subscribeIrregularPreferences(() => syncIrregularReminders());
subscribeConfirmedPeriodHistory(() => syncIrregularReminders());

// Privacy/discreet-notification settings ("Notifications discrètes",
// "Masquer l'aperçu des notifications", "Mode discret") are read fresh by
// scheduleLocalNotification() on every call, but a Notifee trigger
// notification bakes its title/body in at creation time — so a reminder
// scheduled before a privacy setting is turned on (or off) would otherwise
// keep firing with its stale, pre-change payload until something unrelated
// happened to resync it. Re-running every objective's own sync function here
// (each already cancels-then-reschedules by the same notification id, and
// each already internally no-ops when its objective isn't active or its
// reminder isn't enabled) guarantees every already-scheduled reminder is
// rebuilt with the current privacy setting immediately, from ONE shared
// place, instead of duplicating privacy-change awareness into every
// scheduler.
function resyncAllRemindersForPrivacyChange(): void {
  syncNifasReminders();
  resyncPregnancyNotificationsIfActive();
  syncPostpartumDailyTrackingReminder();
  syncMiscarriageDailyTrackingReminder();
  syncQadaaReminderNotification();
  syncConceptionReminders();
  syncContraceptionReminder();
  syncMenopauseReminders();
  syncCycleReminders();
  syncIrregularReminders();
}
subscribePrivacySecuritySettings(resyncAllRemindersForPrivacyChange);

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
      <AwaThemeProvider>
        <AwaRootStatusBar />
        <AppNavigator
          onReady={() => {
            openPendingPostpartumNifasNotification();
            openPendingConceptionReminderNotification();
            openPendingMenopauseReminderNotification();
          }}
        />
        {lockState === 'locked' ? <AppLockScreen /> : null}
        {privacyCover ? <PrivacyCover /> : null}
      </AwaThemeProvider>
    </SafeAreaProvider>
  );
}

// `booting` is rendered BEFORE <AwaThemeProvider> mounts (security
// preferences haven't hydrated yet, so lockState can't be resolved) — it
// cannot consume useAwaTheme() and stays a fixed, brief pre-theme placeholder
// by necessity, same as any splash screen. Genuinely out of reach of the
// global theme, not an oversight.
const styles = StyleSheet.create({booting: {flex: 1, backgroundColor: '#F8EFFF'}});

export default App;
