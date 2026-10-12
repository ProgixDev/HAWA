import fs from 'fs';
import path from 'path';

import {REMINDER_RESCHEDULE_TASK_NAME} from '../reminderRescheduleTask';

// F14 — static contract of the native side that re-arms reminders after a time-zone change, a clock change and an
// app update. Jest cannot deliver a system broadcast: this pins what Android reads (manifest + Kotlin class names,
// actions, exported flags, task name). A physical-device check is still required.

const ANDROID_APP = path.resolve(__dirname, '../../../android/app');
const manifest = fs.readFileSync(path.join(ANDROID_APP, 'src/main/AndroidManifest.xml'), 'utf8');
const gradle = fs.readFileSync(path.join(ANDROID_APP, 'build.gradle'), 'utf8');
const javaDir = path.join(ANDROID_APP, 'src/main/java/com/hawa');
const receiverKt = fs.readFileSync(path.join(javaDir, 'AwaReminderRescheduleReceiver.kt'), 'utf8');
const serviceKt = fs.readFileSync(path.join(javaDir, 'AwaReminderRescheduleService.kt'), 'utf8');

const namespace = /namespace\s+["']([^"']+)["']/.exec(gradle)![1];

function element(tag: 'receiver' | 'service', name: string): string | undefined {
  // A receiver has child <intent-filter>/<action/> elements, so it only ends at its own closing tag; the service is
  // self-closing.
  const end = tag === 'receiver' ? '</receiver>' : '/>';
  const pattern = new RegExp(`<${tag}\\b[^>]*android:name="${name.replace(/\./g, '\\.')}"[\\s\\S]*?${end}`);
  return pattern.exec(manifest)?.[0];
}

describe('receiver', () => {
  const receiver = element('receiver', '.AwaReminderRescheduleReceiver');

  it('is declared, not exported, and matches a real Kotlin BroadcastReceiver in the app package', () => {
    expect(receiver).toBeDefined();
    expect(receiver).toContain('android:exported="false"');
    expect(receiverKt).toMatch(new RegExp(`^package ${namespace.replace(/\./g, '\\.')}\\s*$`, 'm'));
    expect(receiverKt).toMatch(/^class AwaReminderRescheduleReceiver\s*:\s*BroadcastReceiver\(\)/m);
  });

  it('listens to exactly the three system actions notifee does not cover', () => {
    const actions = Array.from(receiver!.matchAll(/<action android:name="([^"]+)"/g)).map(match => match[1]).sort();
    expect(actions).toEqual(
      [
        'android.intent.action.MY_PACKAGE_REPLACED',
        'android.intent.action.TIMEZONE_CHANGED',
        'android.intent.action.TIME_SET',
      ].sort(),
    );
    expect(receiver).not.toContain('BOOT_COMPLETED'); // notifee core re-arms after reboot already
    expect(receiver).not.toMatch(/<data\b/);
  });

  it('the Kotlin allow-list equals the manifest actions, and anything else is ignored', () => {
    expect(receiverKt).toContain('ACTION_TIMEZONE_CHANGED = "android.intent.action.TIMEZONE_CHANGED"');
    expect(receiverKt).toContain('ACTION_TIME_CHANGED = "android.intent.action.TIME_SET"');
    expect(receiverKt).toContain('ACTION_MY_PACKAGE_REPLACED = "android.intent.action.MY_PACKAGE_REPLACED"');
    expect(receiverKt).toMatch(/if \(action !in HANDLED_ACTIONS\)\s*\{\s*return/);
  });

  it('swallows a refused background start instead of crashing, and only takes the wake lock after a start', () => {
    expect(receiverKt).toMatch(/catch \(_: Exception\)/);
    expect(receiverKt.indexOf('startService(')).toBeLessThan(receiverKt.indexOf('acquireWakeLockNow('));
    expect(receiverKt).not.toContain('startForegroundService');
  });
});

describe('service', () => {
  const service = element('service', '.AwaReminderRescheduleService');

  it('is declared, not exported, and is a HeadlessJsTaskService (not a foreground service)', () => {
    expect(service).toBeDefined();
    expect(service).toContain('android:exported="false"');
    expect(service).not.toContain('foregroundServiceType');
    expect(serviceKt).toMatch(new RegExp(`^package ${namespace.replace(/\./g, '\\.')}\\s*$`, 'm'));
    expect(serviceKt).toMatch(/^class AwaReminderRescheduleService\s*:\s*HeadlessJsTaskService\(\)/m);
    expect(serviceKt).not.toMatch(/startForeground|setForeground/);
  });

  it('runs the task the JS side registers, with a short bounded timeout and no retries', () => {
    expect(serviceKt).toContain(`TASK_NAME = "${REMINDER_RESCHEDULE_TASK_NAME}"`);
    const timeout = Number(/TASK_TIMEOUT_MS = ([\d_]+)L/.exec(serviceKt)![1].replace(/_/g, ''));
    expect(timeout).toBeGreaterThan(0); // 0 would mean "no timeout"
    expect(timeout).toBeLessThanOrEqual(60_000);
    // No retry policy argument: NoRetryPolicy is internal to React Native 0.80 (a Gradle compile caught that), and the
    // 4-argument HeadlessJsTaskConfig has no retries.
    expect(serviceKt).not.toContain('NoRetryPolicy.INSTANCE');
    expect(serviceKt).not.toMatch(/import com.facebook.react.jstasks.NoRetryPolicy/);
  });
});

describe('what this feature must not touch or add', () => {
  it('keeps MainActivity and both launcher aliases as they were', () => {
    expect(manifest).toMatch(/<activity\b[^>]*android:name="\.MainActivity"[^>]*android:exported="true"/);
    expect(manifest).toMatch(/<activity-alias\b[^>]*android:name="\.LauncherAwa"[^>]*android:enabled="true"/);
    expect(manifest).toMatch(/<activity-alias\b[^>]*android:name="\.LauncherDiscreet"[^>]*android:enabled="false"/);
  });

  it('adds only WAKE_LOCK (already merged via notifee) and no foreground-service / exact-alarm permission', () => {
    const permissions = Array.from(manifest.matchAll(/<uses-permission android:name="([^"]+)"/g)).map(match => match[1]);
    expect(permissions).toContain('android.permission.WAKE_LOCK');
    expect(permissions.filter(name => /FOREGROUND_SERVICE|SCHEDULE_EXACT_ALARM|USE_EXACT_ALARM/.test(name))).toEqual([]);
    expect(permissions.slice().sort()).toEqual(
      [
        'android.permission.INTERNET',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.USE_BIOMETRIC',
        'android.permission.WAKE_LOCK',
      ].sort(),
    );
  });

  it('has no periodic / polling machinery in the native files', () => {
    for (const source of [receiverKt, serviceKt]) {
      expect(source).not.toMatch(/AlarmManager|WorkManager|JobScheduler|Handler\(|Timer\(|postDelayed/);
    }
  });
});
