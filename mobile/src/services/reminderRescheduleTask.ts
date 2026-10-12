import {resyncAllReminderNotifications} from './reminderResync';

/**
 * Headless JS task run by AwaReminderRescheduleService (android/app/src/main/java/com/hawa/) after Android reports
 * that the clock, the time zone or AWA's own code changed. notifee's manifest only re-arms alarms after a reboot and
 * an exact-alarm permission change; it says nothing when:
 *
 *   - the TIME ZONE changes (ACTION_TIMEZONE_CHANGED): "08:00" reminders are absolute instants computed for the old
 *     zone, so they now fire at the wrong wall-clock time until something re-derives them;
 *   - the CLOCK is set (ACTION_TIME_CHANGED / TIME_SET): same, and a trigger whose instant is now in the past is lost;
 *   - the app is UPDATED (MY_PACKAGE_REPLACED): the installer cancels the app's alarms along with its process.
 *
 * What this does: wait for the JS context (the service has already started it), then ask the one shared resync to
 * re-derive every objective's reminders from the STORED state and hand them to Android again, with `force` so the
 * kinds that keep a "nothing changed" snapshot (Nifas J35/J40, post-Ramadan Qadaa) also re-schedule.
 *
 * What it deliberately does NOT do: no migration (those are user-initiated screens; the legacy-notes sweeps are
 * App.tsx module-scope code that runs with ANY bundle load, exactly as for notifee's own headless start), no store
 * writes of its own, no key or format change, no permission request, no network. The resync only schedules/cancels
 * notifications from records it reads; it is a no-op while the bulk resync is suspended (after an account wipe) and
 * every per-objective sync gates itself on the active objective/profile and on whether its records are readable, so
 * running it can never resurrect deleted data or cancel anything it cannot re-derive.
 *
 * Android constraints (documented tradeoffs, none can be removed from JS):
 *   - Android 8+ background execution limits: a manifest-registered receiver for these protected system broadcasts
 *     may call startService() from onReceive; that is the only start this feature performs. It is not a foreground
 *     service and nothing is polled or scheduled periodically.
 *   - Doze / OEM task killers can still delay or suppress the broadcast. If the process is not started, the
 *     existing paths still apply: every bundle load (App.tsx), every return to the foreground, and notifee's own
 *     boot re-arm. This task is an additional recovery path, not a guarantee.
 *   - The service stops itself when the task ends, and the native timeout bounds how long the wake lock can be held.
 */
export const REMINDER_RESCHEDULE_TASK_NAME = 'AwaReminderRescheduleTask';

let inFlight: Promise<void> | null = null;

/**
 * Re-syncs every reminder. Never rejects (a rejection would make the headless task retry or crash the context) and
 * is idempotent: concurrent invocations (several broadcasts in a row, e.g. TIME_SET + TIMEZONE_CHANGED) share ONE
 * run, and running it again later only re-upserts the same notifications.
 */
export function rescheduleAllReminders(): Promise<void> {
  if (inFlight) {
    return inFlight;
  }
  const run = (async () => {
    try {
      await resyncAllReminderNotifications({force: true});
    } catch {
      // Contained: the next bundle load / foreground resync repeats the work.
    }
  })();
  inFlight = run;
  run.then(
    () => {
      if (inFlight === run) {
        inFlight = null;
      }
    },
    () => {
      if (inFlight === run) {
        inFlight = null;
      }
    },
  );
  return run;
}

/** The function registered with AppRegistry.registerHeadlessTask (index.js). `data.reason` is the broadcast action. */
async function reminderRescheduleTask(_data?: {reason?: string}): Promise<void> {
  await rescheduleAllReminders();
}

export default reminderRescheduleTask;
