package com.hawa

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.facebook.react.HeadlessJsTaskService

/**
 * Re-arms AWA's reminders after the three system events notifee's own manifest does not cover:
 *
 *  - ACTION_TIMEZONE_CHANGED  : the stored "08:00" reminders were turned into instants for the old zone;
 *  - ACTION_TIME_CHANGED      : the clock was set (automatic network time, manual change);
 *  - MY_PACKAGE_REPLACED      : the app was updated (the installer drops its alarms).
 *
 * (Reboot and exact-alarm permission changes are handled by notifee core and are intentionally not repeated here.)
 *
 * The receiver does nothing but start [AwaReminderRescheduleService], which runs the JS task that re-derives every
 * reminder from AWA's stored state. It is registered in the manifest with exported=false: these are protected system
 * broadcasts, only the system can send them, and no other app can trigger a resync by sending its own intent.
 *
 * Background-start limits (Android 8+): a manifest-registered receiver for these broadcasts may call startService()
 * from onReceive (the app is briefly allowed to start a service while it handles a broadcast). If the system refuses
 * anyway, the failure is swallowed: the same resync still runs the next time the app's JS loads or returns to the
 * foreground, so a refused start only delays the repair, it never breaks anything.
 */
class AwaReminderRescheduleReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val action = intent?.action ?: return
    if (action !in HANDLED_ACTIONS) {
      return
    }
    try {
      val service =
          Intent(context.applicationContext, AwaReminderRescheduleService::class.java)
              .putExtra(AwaReminderRescheduleService.EXTRA_REASON, action)
      context.applicationContext.startService(service)
      // Keeps the CPU awake between this return and the service's own wake lock (HeadlessJsTaskService acquires it
      // in startTask). Only taken once the start was accepted, so a refused start cannot leave a lock held; the
      // service releases it in onDestroy, and the task timeout guarantees the service ends.
      HeadlessJsTaskService.acquireWakeLockNow(context.applicationContext)
    } catch (_: Exception) {
      // BackgroundServiceStartNotAllowedException / IllegalStateException / SecurityException: see class comment.
    }
  }

  companion object {
    const val ACTION_TIMEZONE_CHANGED = "android.intent.action.TIMEZONE_CHANGED"
    const val ACTION_TIME_CHANGED = "android.intent.action.TIME_SET"
    const val ACTION_MY_PACKAGE_REPLACED = "android.intent.action.MY_PACKAGE_REPLACED"

    val HANDLED_ACTIONS: Set<String> =
        setOf(ACTION_TIMEZONE_CHANGED, ACTION_TIME_CHANGED, ACTION_MY_PACKAGE_REPLACED)
  }
}
