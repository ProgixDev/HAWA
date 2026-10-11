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
  hydrateActiveObjective,
  hydrateCyclePreferences,
  hydrateHijriAdjustmentDays,
  hydrateSpiritualMarkersEnabled,
  subscribeActiveObjective,
  subscribeCyclePreferences,
  subscribeHijriAdjustmentDays,
  subscribeSpiritualMarkersEnabled,
} from './src/state/onboardingPreferences';
import { syncPregnancyNotificationsForActiveObjective } from './src/utils/pregnancyReminderScheduling';
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
import { hydrateQadaaLedger, subscribeQadaaLedger } from './src/state/qadaaLedgerStore';
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
import { refreshNotificationPermission } from './src/services/pregnancyNotifications';
import { resyncAllReminderNotifications } from './src/services/reminderResync';
import { createForegroundResyncPolicy } from './src/services/reminderForegroundPolicy';
import { resumeBulkReminderResync } from './src/services/reminderResyncGate';
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
import {hydrateActiveProfileId} from './src/state/activeProfileStore';
import {syncCycleReminders} from './src/utils/cycleReminderScheduling';
import {recoverInterruptedManagedProfileDeletions} from './src/services/managedProfileDeletion';
import {recoverInterruptedRestore} from './src/services/restoreJournal';
import {runStructuredMigration} from './src/services/structuredDataMigration';
import {getAppLanguage, hydrateAppearancePreferences, subscribeThemePreferences} from './src/state/themePreferences';
import AppLockScreen from './src/screens/AppLockScreen';
import {AUTO_LOCK_TIMEOUT_MS,getAppLockState,lockApp,setAppLockState,subscribeAppLock} from './src/state/appLockStore';
import {isBiometricPromptActive} from './src/services/appSecurityService';
import {requiresAppLock} from './src/state/securityPreferences';
import {migrateLegacyPlainNotes} from './src/services/privateNotesEncryption';
import {initializePremium} from './src/services/purchaseService';
import {restorePendingObjectiveSetupOnStartup} from './src/services/objectiveSwitch';
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

// Pregnancy Tracking reminders are objective-specific, like every other
// objective's: they are scheduled from the saved state while the active
// objective is 'pregnancy' (survives an app restart, and a switch back into
// Suivi de grossesse resyncs them), and their SCHEDULED notifications are
// cancelled whenever another objective is active (delivery → Post-partum, a
// switch to Loss / Cycle / …). Saved settings and reminder definitions are
// never deleted, so nothing is lost when the user switches back.
function resyncPregnancyNotificationsIfActive(): void {
  syncPregnancyNotificationsForActiveObjective().catch(() => {});
}

hydrateActiveObjective().then(resyncPregnancyNotificationsIfActive);
subscribeActiveObjective(resyncPregnancyNotificationsIfActive);

// An in-app "configure another objective" flow (services/objectiveSwitch.ts)
// interrupted by a process kill leaves a persisted pending record: if the
// target objective is still not fully configured, the previous objective is
// made active again so she is never parked on a half-configured one (a fully
// configured target just clears the flag). Runs long before the 5s splash
// hands over to the app; the subscribeActiveObjective() listeners below resync
// every objective-gated reminder if the active objective changes. Failure-safe.
restorePendingObjectiveSetupOnStartup().catch(() => {});

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
// depends on confirmed period history and the Qadaa ledger (manual entries and completions) — both
// of which can change independently of Ramadan/spiritual-markers state, so
// both are resynced here too, matching Nifas's "resync on every relevant
// store change" pattern above.
Promise.all([
  hydrateSpiritualMarkersEnabled(),
  hydrateConfirmedPeriodHistory(),
  hydrateQadaaLedger(),
  hydrateHijriAdjustmentDays(),
]).then(syncQadaaReminderNotification);
subscribeSpiritualMarkersEnabled(syncQadaaReminderNotification);
subscribeConfirmedPeriodHistory(syncQadaaReminderNotification);
subscribeQadaaLedger(syncQadaaReminderNotification);
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
// The profile that was active when the app was last closed (the mother or a
// daughter) is restored FIRST, at launch — not only once the Profile tab happens
// to be opened. Without it every screen starts on the mother's data while the
// profile switcher still names the daughter, and the cycle read below would
// describe the wrong profile. Every profile-scoped store re-reads on the change.
// A backup restore the app was killed in the middle of is rolled back FIRST — before the active profile or any store
// reads a key — so nothing ever starts from a half-restored mixture of two points in time.
recoverInterruptedRestore()
  .catch(() => false)
  .then(() => hydrateActiveProfileId())
  .catch(() => undefined)
  // A profile deletion the app was killed in the middle of (or that failed a step) is finished before
  // anything is read for it, so a half-deleted profile never lingers.
  .then(() => recoverInterruptedManagedProfileDeletions().catch(() => undefined))
  .then(() =>
    Promise.all([
      hydrateActiveObjective(),
      hydrateCyclePreferences(),
      hydrateCycleReminderPreferences(),
    ]),
  )
  // A reminder-sync failure (a native notification error) must not skip the migration: the plaintext records would
  // stay readable on disk until a later launch happens to succeed.
  .then(() => syncCycleReminders().catch(() => undefined))
  // Legacy plaintext health records are rewritten as encrypted ones in the background, one record at a time, after the
  // app is up (see structuredDataMigration.ts). A problem is reported through the data-availability banner, never thrown.
  .then(() => runStructuredMigration())
  .catch(() => undefined);
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

// One decision per foreground transition: nothing, a refresh, or a forced re-derivation (a changed time zone / UTC
// offset or a clock set backwards). See services/reminderForegroundPolicy.ts for what Android does NOT re-arm.
const foregroundResync = createForegroundResyncPolicy();

// EVERY objective's reminders re-derived from the stored state and handed to Android again, from the one list that
// lives in services/reminderResync.ts (each objective's sync is an idempotent upsert that gates itself on the active
// objective, the active profile and whether its records are readable). `force` makes the two snapshot-based kinds
// (Nifas, Qadaa) re-derive and re-schedule even though their saved snapshot says nothing changed — needed whenever
// the text or the instant they carry may be stale: a privacy setting, the app language, a changed time zone.
// Replace-in-place: nothing is cancelled first, so an interruption can never leave a reminder cancelled but not
// re-created.
function resyncAllReminders(force: boolean): void {
  foregroundResync.noteResync();
  resyncAllReminderNotifications({force}).catch(() => undefined);
}

// Privacy/discreet-notification settings ("Notifications discrètes",
// "Masquer l'aperçu des notifications", "Mode discret") are read fresh by
// scheduleLocalNotification() on every call, but a Notifee trigger
// notification bakes its title/body in at creation time — so a reminder
// scheduled before a privacy setting is turned on (or off) would otherwise
// keep firing with its stale, pre-change payload until something unrelated
// happened to resync it.
function resyncAllRemindersForPrivacyChange(): void {
  resyncAllReminders(true);
}
subscribePrivacySecuritySettings(resyncAllRemindersForPrivacyChange);

// After "Delete account" the bulk resync is suspended (services/reminderResyncGate.ts): the stores still hold the deleted
// data in memory. Choosing an objective again is the first thing a new account does, and from then on they hold its
// data, so the bulk resync (language, privacy, permission, time zone, foreground refresh) is allowed again.
subscribeActiveObjective(resumeBulkReminderResync);

// "Langue de l'application" (AppearanceScreen) changes every reminder's
// title/body text (src/i18n) but must NEVER change timing, notification ids,
// channel ids, or duplicate/cancel a schedule for any reason other than the
// language itself: the same forced, replace-in-place re-derivation rebuilds
// each already-scheduled notification with the now-current language's text at
// the exact same fire date/id.
function resyncAllReminderNotificationsForLanguageChange(): void {
  resyncAllReminders(true);
}

// Baselined on first observation (mirrors privateSectionAuthStore.ts's
// lastKnownObjective/lastKnownProfileId pattern): subscribeThemePreferences()
// fires for EVERY appearance-preference change (palette, mode, true black,
// language), not language alone, and also fires once, unconditionally, right
// after hydrateAppearancePreferences() resolves — neither of those should
// trigger a resync, only a REAL language change should. Whichever of the two
// calls below runs first correctly establishes the baseline, since
// getAppLanguage() already reflects the just-hydrated in-memory value by the
// time hydrateAppearancePreferences()'s own notify() can fire this listener.
let lastKnownAppLanguage: ReturnType<typeof getAppLanguage> | undefined;
function handleAppLanguageChange(): void {
  const language = getAppLanguage();
  if (lastKnownAppLanguage === language) {
    return;
  }
  const isFirstObservation = lastKnownAppLanguage === undefined;
  lastKnownAppLanguage = language;
  if (!isFirstObservation) {
    resyncAllReminderNotificationsForLanguageChange();
  }
}
hydrateAppearancePreferences().then(handleAppLanguageChange);
subscribeThemePreferences(handleAppLanguageChange);

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
        // Two reasons to re-derive the reminders when she comes back. (1) Notifications switched on in Android
        // settings while she was away: the reminders that could not be scheduled until now are scheduled now (the
        // OS state is read fresh each time, never remembered; only a not-allowed -> allowed change counts).
        // (2) The phone's time zone / UTC offset changed or its clock was set backwards, or a long time has passed
        // (window-based schedules are topped up): Android re-arms nothing on those, so the alarms handed over
        // earlier may be an hour or more away from the local time she chose. Every objective's sync is an
        // idempotent upsert, so an unnecessary resync only repeats work.
        const resync = foregroundResync.onForeground();
        refreshNotificationPermission()
          .then(({becameGranted}) => becameGranted)
          .catch(() => false)
          .then(becameGranted => {
            if (becameGranted) {
              resyncAllReminders(true);
            } else if (resync !== 'none') {
              resyncAllReminders(resync === 'force');
            }
          });
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
