package com.hawa

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * Runs the JS task registered in index.js (AppRegistry.registerHeadlessTask) that re-schedules AWA's reminders.
 *
 * Deliberately small and bounded:
 *  - a plain started service, NOT a foreground service (no persistent notification, no extra permission);
 *  - one task, no retry (the 4-argument config has none; NoRetryPolicy itself is internal to RN), [TASK_TIMEOUT_MS] hard timeout: when the task ends or the timeout fires
 *    HeadlessJsTaskService stops the service and releases the wake lock;
 *  - no polling, no periodic work, nothing scheduled for later.
 *
 * Starting it boots React Native's JS context when the app process is not running; that executes index.js/App.tsx
 * module scope exactly like notifee's own headless start does for a background notification event.
 */
class AwaReminderRescheduleService : HeadlessJsTaskService() {
  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig {
    val data =
        Arguments.createMap().apply {
          putString("reason", intent?.getStringExtra(EXTRA_REASON) ?: "unknown")
        }
    return HeadlessJsTaskConfig(
        TASK_NAME,
        data,
        TASK_TIMEOUT_MS,
        // Allowed while the app is in the foreground too: the resync is idempotent, and refusing the task would
        // leave the service running with nothing to stop it.
        true,
    )
  }

  companion object {
    /** Must equal REMINDER_RESCHEDULE_TASK_NAME in src/services/reminderRescheduleTask.ts. */
    const val TASK_NAME = "AwaReminderRescheduleTask"
    const val EXTRA_REASON = "reason"

    /** Enough for ten idempotent resyncs on a slow phone; short enough that a hung JS cannot hold the CPU. */
    const val TASK_TIMEOUT_MS = 30_000L
  }
}
