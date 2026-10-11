import {forceSyncPostpartumNifasReminders, syncPostpartumNifasReminders} from '../utils/postpartumNifasReminderScheduling';
import {syncPregnancyNotificationsForActiveObjective} from '../utils/pregnancyReminderScheduling';
import {syncPostpartumDailyTrackingReminder} from '../utils/postpartumReminderScheduling';
import {syncMiscarriageDailyTrackingReminder} from '../utils/miscarriageReminderScheduling';
import {forceSyncQadaaReminderNotification, syncQadaaReminderNotification} from '../utils/qadaaReminderScheduling';
import {syncConceptionReminders} from '../utils/conceptionReminderScheduling';
import {syncContraceptionReminder} from '../utils/contraceptionReminderScheduling';
import {syncMenopauseReminders} from '../utils/menopauseReminderScheduling';
import {syncCycleReminders} from '../utils/cycleReminderScheduling';
import {syncIrregularReminders} from '../utils/irregularReminderScheduling';
import {isBulkReminderResyncSuspended} from './reminderResyncGate';

/**
 * Re-derives EVERY objective's reminders from the stored state and hands them to Android again.
 *
 * Each objective's own sync is already an idempotent upsert that gates itself on the active objective, on the
 * active profile and on whether its source records are readable, so calling all of them is always safe. This is the
 * one place that list lives: the app start-up wiring, the privacy / timezone / permission changes, and the flows
 * that replace the stored records wholesale (restore from a backup) all use it instead of keeping their own copy.
 *
 * `force` is for the two kinds that keep a saved snapshot and skip work when it still matches (Nifas J35/J40 and
 * the post-Ramadan Qadaa reminder): it makes them re-derive and re-schedule even though the snapshot says nothing
 * changed. Use it when the OS-side state may no longer match (timezone changed, privacy text, restored records).
 *
 * Does nothing while suspended (see reminderResyncGate.ts): after a full account wipe the stores still hold the deleted
 * data in memory, and re-deriving from it would bring the reminders back.
 *
 * Never throws: every sync failure is contained so one objective cannot stop the others.
 */
export async function resyncAllReminderNotifications(options: {force?: boolean} = {}): Promise<void> {
  if (isBulkReminderResyncSuspended()) {return;}
  const force = options.force === true;
  await Promise.allSettled([
    force ? forceSyncPostpartumNifasReminders() : syncPostpartumNifasReminders(),
    syncPregnancyNotificationsForActiveObjective(),
    syncPostpartumDailyTrackingReminder(),
    syncMiscarriageDailyTrackingReminder(),
    force ? forceSyncQadaaReminderNotification() : syncQadaaReminderNotification(),
    syncConceptionReminders(),
    syncContraceptionReminder(),
    syncMenopauseReminders(),
    syncCycleReminders(),
    syncIrregularReminders(),
  ]);
}
