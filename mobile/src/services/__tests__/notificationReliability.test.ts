import notifee from '@notifee/react-native';

import {
  REMINDER_SERIES_SEPARATOR,
  __resetNotificationServiceForTests,
  cancelAllLocalNotifications,
  cancelLocalNotification,
  getPendingReminderIds,
  getReminderDeliveryState,
  planRepeatingOccurrences,
  scheduleLocalNotification,
  scheduleLocalNotificationWithResult,
  scheduleReminderSeries,
} from '../pregnancyNotifications';
import {loadSecurityPreferences} from '../../state/securityPreferences';
import {
  deliverTrigger,
  displayedIds,
  fakeNotifeeState,
  resetFakeNotifee,
  scheduledIds,
} from '../../testUtils/fakeNotifee';

// Phase 2 — reliability of the notification chokepoint (F7 robustness, F8 channel, F14 recurrence, series).
//
// Stateful fake notifee: proves what AWA's JavaScript hands Android and in which order. It cannot prove Android's
// alarm delivery, OEM task killers or real channel UI (see testUtils/fakeNotifee.ts).
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);
jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn(),
  getPrivacySecuritySettings: jest.fn(() => ({
    discreetMode: false,
    discreetNotifications: false,
    hideNotificationPreview: false,
  })),
}));

const mockLoadSecurity = loadSecurityPreferences as jest.Mock;

const NOW = new Date(2026, 9, 10, 20, 0, 0);
const inMinutes = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000);
const inDays = (days: number, minutes = 0) => new Date(NOW.getTime() + days * 86_400_000 + minutes * 60_000);

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
  mockLoadSecurity.mockReset();
  mockLoadSecurity.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('F7 — a reminder is replaced in place, never "cancelled then created"', () => {
  it('rescheduling a pending reminder issues NO cancel, and the old trigger exists until the new one replaces it', async () => {
    await scheduleLocalNotification(input({fireDate: inMinutes(36)}));
    (notifee.cancelTriggerNotification as jest.Mock).mockClear();

    let existedWhenReplaced: boolean | null = null;
    (notifee.createTriggerNotification as jest.Mock).mockImplementationOnce(async (notification: {id: string}, trigger: unknown) => {
      existedWhenReplaced = fakeNotifeeState.triggers.has(notification.id);
      fakeNotifeeState.triggers.set(notification.id, {notification, trigger});
      return notification.id;
    });
    await scheduleLocalNotification(input({fireDate: inMinutes(90)}));

    expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled();
    expect(existedWhenReplaced).toBe(true); // there was never a moment without a trigger
    expect(fakeNotifeeState.triggers.get('reminder-1')?.trigger.timestamp).toBe(inMinutes(90).getTime());
  });

  it('a native failure while replacing leaves the previously pending trigger exactly as it was', async () => {
    await scheduleLocalNotification(input({fireDate: inMinutes(36)}));
    const before = fakeNotifeeState.triggers.get('reminder-1')!.trigger.timestamp;
    fakeNotifeeState.createTriggerError = new Error('process was about to die');

    const result = await scheduleLocalNotificationWithResult(input({fireDate: inMinutes(90)}));

    expect(result).toMatchObject({scheduled: false, reason: 'error'});
    expect(fakeNotifeeState.triggers.get('reminder-1')?.trigger.timestamp).toBe(before);
  });

  it('notifications switched off: the stale pending trigger of an OLD time is removed so it cannot fire later on its own', async () => {
    await scheduleLocalNotification(input({fireDate: inMinutes(36)}));
    fakeNotifeeState.authorizationStatus = 0;

    await scheduleLocalNotification(input({fireDate: inMinutes(90)}));

    expect(scheduledIds()).toEqual([]);
  });

  it('operations on the SAME id run in the order requested: a slow schedule followed by a cancel ends cancelled', async () => {
    // The schedule is stuck on the permission dialog while the person turns the reminder off.
    (notifee.requestPermission as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({authorizationStatus: 1}), 5_000)),
    );

    const schedule = scheduleLocalNotificationWithResult(input({fireDate: inMinutes(36)}));
    const cancel = cancelLocalNotification('reminder-1');
    await jest.advanceTimersByTimeAsync(5_000);
    await Promise.all([schedule, cancel]);

    expect(scheduledIds()).toEqual([]);
  });

  it('operations on DIFFERENT ids do not wait for each other', async () => {
    (notifee.requestPermission as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({authorizationStatus: 1}), 5_000)),
    );
    const slow = scheduleLocalNotificationWithResult(input({id: 'slow'}));
    await Promise.resolve();

    await cancelLocalNotification('other');

    expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('other');
    await jest.advanceTimersByTimeAsync(5_000);
    await slow;
  });
});

describe('F7 — settings that cannot be read in time never block a reminder', () => {
  it('a stuck privacy-settings load is abandoned after 3 s and the reminder is built with GENERIC text', async () => {
    mockLoadSecurity.mockImplementation(() => new Promise(() => undefined)); // never settles
    const scheduling = scheduleLocalNotificationWithResult(input());

    await jest.advanceTimersByTimeAsync(3_000);
    const result = await scheduling;

    expect(result).toMatchObject({scheduled: true});
    const notification = (notifee.createTriggerNotification as jest.Mock).mock.calls[0][0];
    expect(notification.title).toBe('AWA');
    expect(notification.body).not.toContain('Echographie');
    // The real wording still travels in `data` for the in-app history.
    expect(notification.data.inAppMessage).toBe('Echographie');
  });

  it('a rejected privacy-settings load also falls back to generic text', async () => {
    mockLoadSecurity.mockRejectedValue(new Error('keychain'));

    await scheduleLocalNotificationWithResult(input());

    expect((notifee.createTriggerNotification as jest.Mock).mock.calls[0][0].title).toBe('AWA');
  });

  it('readable settings leave the real text alone', async () => {
    await scheduleLocalNotificationWithResult(input());

    expect((notifee.createTriggerNotification as jest.Mock).mock.calls[0][0].title).toBe('Rendez-vous');
  });
});

describe('F8 — reminders channel: audible by default, never overriding the user', () => {
  it('a NEW channel is created HIGH with sound and vibration (notifee\'s default is a silent channel)', async () => {
    await scheduleLocalNotification(input());

    expect(fakeNotifeeState.channels.get('pregnancy-reminders')).toMatchObject({
      importance: 4,
      sound: 'default',
      vibration: true,
    });
  });

  it('an EXISTING channel the user lowered/muted keeps their choice: it is never recreated or deleted', async () => {
    fakeNotifeeState.channels.set('pregnancy-reminders', {id: 'pregnancy-reminders', name: 'Mon canal', importance: 2, sound: undefined});

    await scheduleLocalNotification(input());

    const channel = fakeNotifeeState.channels.get('pregnancy-reminders');
    expect(channel).toMatchObject({importance: 2});
    expect(channel.sound).toBeUndefined();
    expect(notifee.deleteChannel).not.toHaveBeenCalled();
  });

  it('a blocked channel is reported, not scheduled into the void, and clears the stale pending trigger', async () => {
    await scheduleLocalNotification(input({fireDate: inMinutes(36)}));
    fakeNotifeeState.blockedChannels.add('pregnancy-reminders');

    const result = await scheduleLocalNotificationWithResult(input({fireDate: inMinutes(90)}));

    expect(result).toMatchObject({scheduled: false, reason: 'channel-blocked'});
    expect(scheduledIds()).toEqual([]);
    await expect(getReminderDeliveryState()).resolves.toBe('channel-blocked');
  });
});

describe('F14 — repeating reminders stay at the wall-clock time across a clock change', () => {
  const HOUR = 3_600_000;

  it('a normal day: ONE native repeating trigger (24 h steps are exactly one calendar day)', () => {
    const first = new Date(2026, 9, 10, 20, 0);
    expect(planRepeatingOccurrences(first, 'daily')).toEqual([{fireDate: first, repeatFrequency: 'daily'}]);
  });

  it('daylight-saving change between the first and the next occurrence: the next one is scheduled at its REAL local time', () => {
    // Paris, night of 24-25 Oct 2026: 20:00 CEST (18:00Z) the 24th; 20:00 CET (19:00Z) the 25th = 25 h later.
    const first = new Date('2026-10-24T18:00:00Z');
    const calendarNext = new Date('2026-10-25T19:00:00Z');

    const plan = planRepeatingOccurrences(first, 'daily', calendarNext);

    expect(plan).toEqual([
      {fireDate: first}, // fires once, on its own
      {fireDate: calendarNext, repeatFrequency: 'daily'}, // repeats from the real next occurrence
    ]);
    // Without the split the fixed 24 h step would have fired at 19:00 local on the 25th.
    expect(first.getTime() + 24 * HOUR).not.toBe(calendarNext.getTime());
  });

  it('spring forward (23 h day) and the weekly case are handled the same way', () => {
    const first = new Date('2027-03-27T19:00:00Z'); // 20:00 CET
    const nextDay = new Date('2027-03-28T18:00:00Z'); // 20:00 CEST, 23 h later
    expect(planRepeatingOccurrences(first, 'daily', nextDay)).toHaveLength(2);

    const weeklyNext = new Date(first.getTime() + 7 * 24 * HOUR - HOUR);
    expect(planRepeatingOccurrences(first, 'weekly', weeklyNext)).toEqual([
      {fireDate: first},
      {fireDate: weeklyNext, repeatFrequency: 'weekly'},
    ]);
  });

  it('in the zone this test runs under: every firing in the days after the next clock change is at the chosen wall-clock time', () => {
    // No injection: the engine's own local-time arithmetic. Finds the next day on which this zone's UTC offset
    // changes (none in a zone without daylight saving: then the plan must simply be one repeating trigger).
    const noon = (offsetDays: number) => new Date(2026, 9, 10 + offsetDays, 12, 0, 0);
    let changeEve: number | null = null;
    for (let offset = 0; offset < 400; offset += 1) {
      if (noon(offset).getTimezoneOffset() !== noon(offset + 1).getTimezoneOffset()) {
        changeEve = offset;
        break;
      }
    }

    // The reminder is at 08:00 local, first occurring on the eve of the change (or an arbitrary day with no change).
    const eve = changeEve ?? 30;
    const first = new Date(2026, 9, 10 + eve, 8, 0, 0);
    const plan = planRepeatingOccurrences(first, 'daily');

    // Simulate what Android does: each trigger fires at its instant and, when repeating, every fixed 24 h after it.
    const firings: Date[] = [];
    plan.forEach(occurrence => {
      const steps = occurrence.repeatFrequency ? 4 : 1;
      for (let step = 0; step < steps; step += 1) {
        firings.push(new Date(occurrence.fireDate.getTime() + step * 24 * HOUR));
      }
    });
    // Only the firings of the three days that follow `first` (the next clock change is months away).
    const horizon = first.getTime() + 3 * 24 * HOUR;
    const relevant = firings.filter(date => date.getTime() <= horizon + 2 * HOUR).sort((a, b) => a.getTime() - b.getTime());

    expect(relevant.length).toBeGreaterThanOrEqual(3);
    relevant.forEach(date => {
      expect([date.getHours(), date.getMinutes()]).toEqual([8, 0]);
    });
    // Without a clock change in the way the plan is one repeating trigger; across one it is split in two.
    expect(plan).toHaveLength(changeEve === null ? 1 : 2);
  });

  it('the split reaches Android as two triggers (id and id::1) and a later normal sync collapses it back to one', async () => {
    // Real scheduling on this machine's timezone: force the split by planning explicitly through the series API.
    const first = inMinutes(60);
    const second = new Date(first.getTime() + 25 * HOUR);
    await scheduleReminderSeries({
      id: 'daily-journal',
      title: 'Journal',
      body: 'Ton journal',
      occurrences: [first, second],
    });
    expect(scheduledIds()).toEqual(['daily-journal', `daily-journal${REMINDER_SERIES_SEPARATOR}1`].sort());

    await scheduleLocalNotification(input({id: 'daily-journal', fireDate: first, repeatFrequency: 'daily'}));

    expect(scheduledIds()).toEqual(['daily-journal']); // the extra member was removed as stale
  });
});

describe('series: several one-shot triggers owned by one reminder id', () => {
  const occurrences = (count: number) => Array.from({length: count}, (_, index) => inDays(index + 1));

  it('creates <id>, <id>::1, <id>::2 ... and replaces the whole set on the next run', async () => {
    await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: occurrences(3)});
    expect(scheduledIds()).toEqual(['pill', 'pill::1', 'pill::2']);

    await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: occurrences(2)});
    expect(scheduledIds()).toEqual(['pill', 'pill::1']); // the third member is gone
  });

  it('skips instants that are already past and cancels everything when none is ahead', async () => {
    await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: [inDays(-1), inDays(1)]});
    expect(scheduledIds()).toEqual(['pill::1']);

    const result = await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: [inDays(-2)]});
    expect(result).toMatchObject({scheduled: false, reason: 'past'});
    expect(scheduledIds()).toEqual([]);
  });

  it('an EMPTY plan means "nothing ahead": the triggers an older plan left pending are cancelled, not kept', async () => {
    await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: occurrences(3)});
    expect(scheduledIds()).toEqual(['pill', 'pill::1', 'pill::2']);

    const result = await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: []});

    expect(result).toMatchObject({scheduled: false, reason: 'past'});
    expect(scheduledIds()).toEqual([]);
  });

  it('one invalid instant inside a plan is skipped: the others are still created and nothing half-fails', async () => {
    const result = await scheduleReminderSeries({
      id: 'pill',
      title: 'Pilule',
      body: 'Prise',
      occurrences: [inDays(1), new Date(NaN), inDays(3)],
    });

    expect(result).toMatchObject({scheduled: true});
    expect(scheduledIds()).toEqual(['pill', 'pill::2']);
  });

  it('a plan made only of invalid instants leaves whatever is pending untouched (a computation bug must not erase a reminder)', async () => {
    await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: occurrences(2)});

    const result = await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: [new Date(NaN)]});

    expect(result).toMatchObject({scheduled: false, reason: 'invalid-date'});
    expect(scheduledIds()).toEqual(['pill', 'pill::1']);
  });

  it('cancelling the base id cancels every member, and only its own', async () => {
    await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: occurrences(3)});
    await scheduleLocalNotification(input({id: 'pill-extra'})); // shares the prefix text, not the separator
    await scheduleLocalNotification(input({id: 'other'}));

    await cancelLocalNotification('pill');

    expect(scheduledIds()).toEqual(['other', 'pill-extra']);
  });

  it('the user\'s own delete also removes the members already in the shade', async () => {
    await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: occurrences(2)});
    jest.setSystemTime(inDays(2, 1));
    fakeNotifeeState.triggers.forEach((_, id) => deliverTrigger(id));
    expect(displayedIds()).toEqual(['pill', 'pill::1']);

    await cancelLocalNotification('pill', {dismissDisplayed: true});

    expect(displayedIds()).toEqual([]);
  });

  it('a sync (no dismissDisplayed) leaves the delivered members on screen', async () => {
    await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: occurrences(2)});
    jest.setSystemTime(inDays(1, 1));
    deliverTrigger('pill');

    await scheduleReminderSeries({id: 'pill', title: 'Pilule', body: 'Prise', occurrences: [inDays(3)]});

    expect(displayedIds()).toEqual(['pill']);
  });
});

describe('triggers created before the AlarmManager fix (WorkManager jobs)', () => {
  const legacyNotification = (id: string) => ({id, title: 'Ancien', body: 'Rappel', android: {channelId: 'pregnancy-reminders'}});

  it('are converted once to AlarmManager triggers for the same instant, so the replace can never leave a stray job', async () => {
    const timestamp = inMinutes(120).getTime();
    fakeNotifeeState.triggers.set('legacy-1', {notification: legacyNotification('legacy-1'), trigger: {type: 0, timestamp}});
    fakeNotifeeState.triggers.set('legacy-gone', {
      notification: legacyNotification('legacy-gone'),
      trigger: {type: 0, timestamp: inMinutes(-5).getTime()},
    });
    fakeNotifeeState.triggers.set('modern', {
      notification: legacyNotification('modern'),
      trigger: {type: 0, timestamp, alarmManager: {type: 1}},
    });
    (notifee.cancelTriggerNotification as jest.Mock).mockClear();

    await scheduleLocalNotification(input({id: 'something-else'}));

    expect(fakeNotifeeState.triggers.get('legacy-1')?.trigger).toMatchObject({timestamp, alarmManager: {type: 1}});
    expect(fakeNotifeeState.triggers.has('legacy-gone')).toBe(false); // its time had passed: dropped
    expect(notifee.cancelTriggerNotification).not.toHaveBeenCalledWith('modern'); // AlarmManager triggers untouched

    // Once per process.
    (notifee.getTriggerNotifications as jest.Mock).mockClear();
    await scheduleLocalNotification(input({id: 'another'}));
    expect(notifee.getTriggerNotifications).not.toHaveBeenCalled();
  });
});

describe('observing and wiping native state', () => {
  it('getPendingReminderIds lists what Android will fire, and is null when it cannot be read', async () => {
    await scheduleLocalNotification(input({id: 'a'}));
    await scheduleLocalNotification(input({id: 'b'}));
    await expect(getPendingReminderIds()).resolves.toEqual(new Set(['a', 'b']));

    (notifee.getTriggerNotificationIds as jest.Mock).mockRejectedValueOnce(new Error('native'));
    await expect(getPendingReminderIds()).resolves.toBeNull();
  });

  it('cancelAllLocalNotifications clears every pending trigger AND the shade (whole-app wipes)', async () => {
    await scheduleLocalNotification(input({id: 'a'}));
    await scheduleLocalNotification(input({id: 'b'}));
    jest.setSystemTime(inMinutes(40));
    deliverTrigger('a');

    await expect(cancelAllLocalNotifications()).resolves.toBe(true);

    expect(scheduledIds()).toEqual([]);
    expect(displayedIds()).toEqual([]);
  });

  it('reports false (never throws) when the native call fails', async () => {
    (notifee.cancelAllNotifications as jest.Mock).mockRejectedValueOnce(new Error('native'));

    await expect(cancelAllLocalNotifications()).resolves.toBe(false);
  });
});
