import notifee from '@notifee/react-native';

import {
  __resetNotificationServiceForTests,
  NOTIFICATION_LAUNCH_ACTIVITY,
  cancelLocalNotification,
  ensureNotificationPermission,
  getNotificationPermissionStatus,
  getReminderDeliveryState,
  refreshNotificationPermission,
  scheduleLocalNotification,
  scheduleLocalNotificationWithResult,
} from '../pregnancyNotifications';
import {
  deliverTrigger,
  displayedIds,
  fakeNotifeeState,
  resetFakeNotifee,
  scheduledIds,
} from '../../testUtils/fakeNotifee';

// Regression tests for the notification chokepoint (Phase 1 repair: F1, F2, F4, F5).
//
// IMPORTANT — what this file does and does not prove. The fake notifee used here is a stateful in-memory model
// (see testUtils/fakeNotifee.ts): it can show that AWA's JavaScript never removes a delivered notification, never
// caches a permission denial and hands Android the right trigger. It CANNOT show that Android delivers a
// notification on a real phone (Doze, OEM task killers, channel settings and AlarmManager timing are not modelled).
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);
jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  getPrivacySecuritySettings: jest.fn(() => ({
    discreetMode: false,
    discreetNotifications: false,
    hideNotificationPreview: false,
  })),
}));

const NOW = new Date(2026, 9, 10, 20, 0, 0); // Sat 10 Oct 2026, 20:00 local
const inMinutes = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000);

function input(overrides: Partial<Parameters<typeof scheduleLocalNotification>[0]> = {}) {
  return {
    id: 'reminder-1',
    title: 'Rendez-vous',
    body: 'Echographie · 10:00',
    fireDate: inMinutes(36),
    data: {hawaNotificationKind: 'test', inAppTitle: 'Rendez-vous', inAppMessage: 'Echographie'},
    ...overrides,
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  resetFakeNotifee();
  __resetNotificationServiceForTests();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('reminder scheduled successfully', () => {
  it('hands Android exactly one AlarmManager trigger at the requested instant, on the reminders channel', async () => {
    const result = await scheduleLocalNotificationWithResult(input());

    expect(result).toEqual({scheduled: true, fireDate: inMinutes(36)});
    expect(scheduledIds()).toEqual(['reminder-1']);

    const [notification, trigger] = (notifee.createTriggerNotification as jest.Mock).mock.calls[0];
    expect(trigger.timestamp).toBe(inMinutes(36).getTime());
    // 1 = SET_AND_ALLOW_WHILE_IDLE: routed through AlarmManager, not the best-effort WorkManager default.
    expect(trigger.alarmManager).toEqual({type: 1});
    expect(notification.android.channelId).toBe('pregnancy-reminders');
    expect(fakeNotifeeState.channels.get('pregnancy-reminders')).toMatchObject({importance: 4});
  });

  it('the boolean wrapper agrees', async () => {
    await expect(scheduleLocalNotification(input())).resolves.toBe(true);
  });

  it('rescheduling the same id replaces the pending trigger instead of adding a second one', async () => {
    await scheduleLocalNotification(input({fireDate: inMinutes(36)}));
    await scheduleLocalNotification(input({fireDate: inMinutes(90)}));

    expect(scheduledIds()).toEqual(['reminder-1']);
    expect(fakeNotifeeState.triggers.get('reminder-1')?.trigger.timestamp).toBe(inMinutes(90).getTime());
  });
});

describe('reminder time already in the past (F2)', () => {
  it('is reported as "past" — never silently treated as scheduled — and nothing is left pending', async () => {
    const result = await scheduleLocalNotificationWithResult(input({fireDate: inMinutes(-5)}));

    expect(result).toMatchObject({scheduled: false, reason: 'past'});
    expect(scheduledIds()).toEqual([]);
    await expect(scheduleLocalNotification(input({fireDate: inMinutes(-5)}))).resolves.toBe(false);
  });

  it('a reminder moved into the past cancels the stale trigger that was pending for its old time', async () => {
    await scheduleLocalNotification(input({fireDate: inMinutes(36)}));
    expect(scheduledIds()).toEqual(['reminder-1']);

    const result = await scheduleLocalNotificationWithResult(input({fireDate: inMinutes(-1)}));

    expect(result).toMatchObject({scheduled: false, reason: 'past'});
    expect(scheduledIds()).toEqual([]);
  });

  it('an invalid date is reported, leaves the pending trigger alone and never reaches Android', async () => {
    await scheduleLocalNotification(input({fireDate: inMinutes(36)}));
    (notifee.createTriggerNotification as jest.Mock).mockClear();

    const result = await scheduleLocalNotificationWithResult(input({fireDate: new Date(NaN)}));

    expect(result).toMatchObject({scheduled: false, reason: 'invalid-date'});
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
    expect(scheduledIds()).toEqual(['reminder-1']);
  });

  it('a time that passes while the permission dialog is open is "past", not a thrown validator error', async () => {
    // Requested for 30 s from now; the system dialog stays open for a minute.
    fakeNotifeeState.onRequestPermission = () => {
      jest.setSystemTime(new Date(NOW.getTime() + 60_000));
    };

    const result = await scheduleLocalNotificationWithResult(input({fireDate: new Date(NOW.getTime() + 30_000)}));

    expect(result).toMatchObject({scheduled: false, reason: 'past'});
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('a native failure is reported as "error" by the detailed API and still REJECTS in the boolean one (Cycle retries on it)', async () => {
    fakeNotifeeState.createTriggerError = new Error('native boom');
    await expect(scheduleLocalNotificationWithResult(input())).resolves.toMatchObject({scheduled: false, reason: 'error'});

    fakeNotifeeState.createTriggerError = new Error('native boom');
    await expect(scheduleLocalNotification(input())).rejects.toThrow('native boom');
  });
});

describe('permission denied (F4)', () => {
  it('reports "permission-denied" and schedules nothing', async () => {
    fakeNotifeeState.authorizationStatus = 0;

    const result = await scheduleLocalNotificationWithResult(input());

    expect(result).toMatchObject({scheduled: false, reason: 'permission-denied'});
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
    expect(scheduledIds()).toEqual([]);
  });

  it('a denial is NEVER remembered: enabling notifications later schedules in the same process, without a restart', async () => {
    fakeNotifeeState.authorizationStatus = 0;
    await expect(scheduleLocalNotificationWithResult(input())).resolves.toMatchObject({reason: 'permission-denied'});

    // She opens Android settings, turns notifications on, comes back — the JS process is the same one.
    fakeNotifeeState.authorizationStatus = 1;

    await expect(scheduleLocalNotificationWithResult(input())).resolves.toEqual({scheduled: true, fireDate: inMinutes(36)});
    expect(scheduledIds()).toEqual(['reminder-1']);
    // ...and the answer came from asking Android again, not from a cache.
    expect((notifee.requestPermission as jest.Mock).mock.calls.length).toBe(2);
  });

  it('a rejected permission request is a denial for that call only', async () => {
    (notifee.requestPermission as jest.Mock).mockRejectedValueOnce(new Error('no activity'));
    await expect(ensureNotificationPermission()).resolves.toBe(false);

    await expect(ensureNotificationPermission()).resolves.toBe(true);
  });

  it('concurrent callers share ONE request, so only one system dialog can ever be open', async () => {
    const results = await Promise.all([ensureNotificationPermission(), ensureNotificationPermission(), ensureNotificationPermission()]);

    expect(results).toEqual([true, true, true]);
    expect(notifee.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('refreshNotificationPermission reports the not-allowed -> allowed change exactly once (the foreground resync trigger)', async () => {
    fakeNotifeeState.authorizationStatus = 0;
    await scheduleLocalNotificationWithResult(input()); // the scheduler saw "denied"

    fakeNotifeeState.authorizationStatus = 1;
    await expect(refreshNotificationPermission()).resolves.toEqual({status: 'granted', becameGranted: true});
    await expect(refreshNotificationPermission()).resolves.toEqual({status: 'granted', becameGranted: false});
  });

  it('reading the state never opens the system dialog', async () => {
    fakeNotifeeState.authorizationStatus = 0;

    await expect(getNotificationPermissionStatus()).resolves.toBe('denied');
    await expect(getReminderDeliveryState()).resolves.toBe('notifications-off');
    expect(notifee.requestPermission).not.toHaveBeenCalled();
  });

  it('"not asked yet" (Android 13+) is not reported as a problem', async () => {
    fakeNotifeeState.authorizationStatus = -1;

    await expect(getReminderDeliveryState()).resolves.toBe('unknown');
  });
});

describe('reminders channel', () => {
  it('a blocked channel is reported, not scheduled into the void', async () => {
    fakeNotifeeState.blockedChannels.add('pregnancy-reminders');

    await expect(scheduleLocalNotificationWithResult(input())).resolves.toMatchObject({
      scheduled: false,
      reason: 'channel-blocked',
    });
    await expect(getReminderDeliveryState()).resolves.toBe('channel-blocked');
  });

  it('one failed channel creation does not poison every later reminder in the process', async () => {
    fakeNotifeeState.createChannelError = new Error('transient');
    await expect(scheduleLocalNotificationWithResult(input())).resolves.toMatchObject({scheduled: false, reason: 'error'});

    await expect(scheduleLocalNotificationWithResult(input())).resolves.toMatchObject({scheduled: true});
  });
});

describe('a delivered notification stays visible (F1)', () => {
  it('syncing the same reminder after it fired does NOT remove it from the notification shade', async () => {
    await scheduleLocalNotification(input({fireDate: inMinutes(36)}));

    // 20:36 — Android fires the alarm and notifee shows the reminder.
    jest.setSystemTime(inMinutes(36 + 0.1));
    deliverTrigger('reminder-1');
    expect(displayedIds()).toEqual(['reminder-1']);

    // The app's JS starts (notifee's headless task) and every scheduler re-syncs the same id. Its time is now past.
    const resync = await scheduleLocalNotificationWithResult(input({fireDate: inMinutes(36)}));

    expect(resync).toMatchObject({scheduled: false, reason: 'past'});
    expect(displayedIds()).toEqual(['reminder-1']); // still on screen
    expect(notifee.cancelNotification).not.toHaveBeenCalled(); // the call that also removes displayed ones
  });

  it('a repeating reminder: the headless re-sync leaves today\'s on screen and re-arms tomorrow\'s', async () => {
    await scheduleLocalNotification(input({fireDate: inMinutes(36), repeatFrequency: 'daily'}));
    jest.setSystemTime(inMinutes(36 + 0.1));
    deliverTrigger('reminder-1');

    // Re-sync computes the NEXT occurrence (tomorrow at the same time), exactly as nextDailyFireDate() does.
    const tomorrow = new Date(inMinutes(36).getTime() + 86_400_000);
    const resync = await scheduleLocalNotificationWithResult(input({fireDate: tomorrow, repeatFrequency: 'daily'}));

    expect(resync).toMatchObject({scheduled: true});
    expect(displayedIds()).toEqual(['reminder-1']);
    expect(fakeNotifeeState.triggers.get('reminder-1')?.trigger.timestamp).toBe(tomorrow.getTime());
  });

  it('cancelling the pending trigger leaves a displayed copy alone by default', async () => {
    await scheduleLocalNotification(input());
    jest.setSystemTime(inMinutes(37));
    deliverTrigger('reminder-1');
    await scheduleLocalNotification(input({fireDate: inMinutes(120)})); // pending again for later

    await expect(cancelLocalNotification('reminder-1')).resolves.toBe(true);

    expect(scheduledIds()).toEqual([]);
    expect(displayedIds()).toEqual(['reminder-1']);
  });

  it('removes the displayed copy only when the user\'s own action asks for it', async () => {
    await scheduleLocalNotification(input());
    jest.setSystemTime(inMinutes(37));
    deliverTrigger('reminder-1');

    await cancelLocalNotification('reminder-1', {dismissDisplayed: true});

    expect(displayedIds()).toEqual([]);
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
  });

  it('only ever touches the id it was given', async () => {
    await scheduleLocalNotification(input({id: 'a'}));
    await scheduleLocalNotification(input({id: 'b'}));
    jest.setSystemTime(inMinutes(37));
    deliverTrigger('a');
    deliverTrigger('b');

    await cancelLocalNotification('a', {dismissDisplayed: true});

    expect(displayedIds()).toEqual(['b']);
  });
});

describe('tapping a notification opens AWA (F5)', () => {
  it('names the real Activity — never notifee\'s "default", which resolves to a launcher alias that is not a class', async () => {
    await scheduleLocalNotification(input());

    const notification = (notifee.createTriggerNotification as jest.Mock).mock.calls[0][0];
    expect(notification.android.pressAction).toEqual({id: 'default', launchActivity: NOTIFICATION_LAUNCH_ACTIVITY});
    expect(NOTIFICATION_LAUNCH_ACTIVITY).toBe('com.hawa.MainActivity');
  });
});
