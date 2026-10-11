import AsyncStorage from '@react-native-async-storage/async-storage';

import {OWNER_PROFILE_ID, getActiveProfileId, setActiveProfileId} from '../state/activeProfileStore';
import {deleteManagedProfile, getManagedProfiles, hydrateManagedProfiles, resetManagedProfileFirstPeriod} from '../state/managedProfilesStore';
import {getDeletedManagedProfileIds, markManagedProfileDeleted} from '../state/deletedManagedProfiles';
import {clearInAppNotificationsForProfile} from '../state/inAppNotificationStore';
import {belongsToManagedProfile} from './storageKeyClassifier';
import secureStorage from './secureAsyncStorage';
import {cancelCycleRemindersForProfile} from '../utils/cycleReminderScheduling';

// Explicitly deleting a managed (daughter) profile removes EVERYTHING that belonged to her and nothing that
// did not. What belongs to her is exactly what the profile-scoped stores wrote under a `<base>:profile:<id>`
// key (profileScopedStorage.ts) — cycle settings and recorded periods, period end, confirmed period history,
// reminder preferences, daily journal (symptoms, mood, flow, temperature, weight…), Qadaa ledger and
// counters, and her own backup slot — plus her scheduled Cycle reminders (namespaced `:<id>`) and her
// in-app notifications (tagged with her profileId). The owner's keys are bare (no suffix), other daughters'
// carry another id, shared settings (language, theme, security, personal information…) carry no suffix:
// none of them can match.
//
// ORDER matters because the work can be interrupted anywhere (app killed, storage error):
//   0. FIRST persist the deletion INTENT (the deleted-ids list). If that cannot be written, nothing
//      destructive happens at all. From this moment the profile is "pending deletion": a backup restore
//      cannot resurrect it, and recoverInterruptedManagedProfileDeletions() (run at every app launch)
//      finishes the job if the app is killed or a step fails;
//   1. leave her profile if it is the active one;
//   2. forget the first period her profile record carries — the seed her cycle would be rebuilt from;
//   3. cancel her scheduled reminders (queued behind any synchronization in flight, so none can recreate
//      them; a native cancel failure is a failed step, not silently ignored) and take her delivered copies out
//      of the notification shade — they carry her first name;
//   4. remove her stored keys;
//   5. remove her in-app notifications;
//   5b. leave her profile again if she became the active one while steps 3-5 ran (the record still exists, so
//      the user can switch to her), and cancel her reminders ONCE MORE: a synchronization run for her that
//      started after step 3 and before step 4 saw her records still in place and derived them again, and no
//      later run would ever know her ids once the records and the profile are gone;
//   6. ONLY if every step above succeeded, remove the profile record itself.
// An interrupted run therefore leaves a still-existing, partly emptied profile recorded as pending
// deletion, which is completed on the next launch (or by deleting it again) — never a record-less profile
// with data nobody can reach, and never another profile's data touched. Every step is idempotent.

export type ManagedProfileDeletionResult = {
  /** The profile record is gone (or already was). */
  deleted: boolean;
  /** Steps that failed — when not empty the profile still exists and the deletion can be retried. */
  failedSteps: string[];
  /** How many stored keys were removed. */
  removedKeyCount: number;
};

/** Every stored key owned by exactly this profile. */
export async function listManagedProfileKeys(profileId: string): Promise<string[]> {
  return (await AsyncStorage.getAllKeys()).filter(key => belongsToManagedProfile(key, profileId));
}

export async function deleteManagedProfileCompletely(profileId: string): Promise<ManagedProfileDeletionResult> {
  if (!profileId || profileId === OWNER_PROFILE_ID) {
    // The owner's data is never removable through this path.
    return {deleted: false, failedSteps: ['not-a-managed-profile'], removedKeyCount: 0};
  }
  const failedSteps: string[] = [];
  let removedKeyCount = 0;
  const attempt = async (name: string, step: () => Promise<void>) => {
    try {
      await step();
    } catch {
      failedSteps.push(name);
    }
  };

  // Intent first — see step 0 above.
  try {
    await markManagedProfileDeleted(profileId);
  } catch {
    return {deleted: false, failedSteps: ['record-deletion-intent'], removedKeyCount: 0};
  }

  const leaveProfile = async () => {
    if (getActiveProfileId() === profileId) {
      await setActiveProfileId(OWNER_PROFILE_ID);
    }
  };
  const cancelHerReminders = () => cancelCycleRemindersForProfile(profileId);

  await attempt('leave-profile', leaveProfile);
  await attempt('forget-first-period', async () => {
    await resetManagedProfileFirstPeriod(profileId);
  });
  await attempt('cancel-reminders', cancelHerReminders);
  await attempt('remove-stored-data', async () => {
    const keys = await listManagedProfileKeys(profileId);
    // Each removal goes through the storage layer: it takes the record's key lock (so it cannot interleave with a
    // migration commit or a restore write) and forgets any "unreadable" flag of a record that no longer exists.
    const results = await Promise.allSettled(keys.map(key => secureStorage.removeItem(key)));
    removedKeyCount = results.filter(result => result.status === 'fulfilled').length;
    if (results.some(result => result.status === 'rejected')) {
      throw new Error('some keys could not be removed');
    }
  });
  await attempt('remove-notifications', () => clearInAppNotificationsForProfile(profileId));
  // Step 5b — see the header. Both are idempotent, and both run before the record goes: after that nothing could
  // find her ids any more.
  await attempt('leave-profile-final', leaveProfile);
  await attempt('cancel-reminders-final', cancelHerReminders);

  if (failedSteps.length > 0) {
    return {deleted: false, failedSteps, removedKeyCount};
  }
  try {
    await deleteManagedProfile(profileId);
  } catch {
    failedSteps.push('remove-profile-record');
    return {deleted: false, failedSteps, removedKeyCount};
  }
  return {deleted: true, failedSteps, removedKeyCount};
}

/** Finishes deletions that were started but not completed (app killed mid-way, a failed step): every profile
 * that is STILL in the profile list although its deletion was recorded is deleted again. Touches nothing
 * else — a profile is only ever picked here because the user explicitly asked for its deletion. Safe to
 * call at every launch; resolves with the ids it completed. */
export async function recoverInterruptedManagedProfileDeletions(): Promise<string[]> {
  const [pendingIds, profiles] = await Promise.all([
    getDeletedManagedProfileIds().catch(() => [] as string[]),
    hydrateManagedProfiles().catch(() => getManagedProfiles()),
  ]);
  const stillListed = new Set(profiles.map(profile => profile.id));
  const completed: string[] = [];
  for (const profileId of pendingIds) {
    if (!stillListed.has(profileId)) {continue;}
    const result = await deleteManagedProfileCompletely(profileId).catch(() => null);
    if (result?.deleted) {completed.push(profileId);}
  }
  return completed;
}
