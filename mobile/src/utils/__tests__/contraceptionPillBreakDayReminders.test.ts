import {
  PILL_REMINDER_WINDOW_DAYS,
  getContraceptionReminderScheduleStatus,
  planPillReminderOccurrences,
  syncContraceptionReminder,
} from '../contraceptionReminderScheduling';
import {getCyclicPillSchedule, isPillBreakDateKey} from '../contraceptionMath';
import {__resetNotificationServiceForTests} from '../../services/pregnancyNotifications';
import {getActiveObjective} from '../../state/onboardingPreferences';
import {getContraceptionPreferences} from '../../state/contraceptionPreferences';
import {
  deliverTrigger,
  displayedIds,
  fakeNotifeeState,
  resetFakeNotifee,
  scheduledIds,
} from '../../testUtils/fakeNotifee';

// F18 — the daily "take your pill" reminder must not fire on the BREAK days of a cyclic pack.
//
// A native repeating trigger cannot skip days, so a REAL cyclic schedule (pill + cyclic + activeDays/breakDays) is laid
// out day by day as one-shot triggers (`<id>`, `<id>::1`, ...) over the next 14 calendar days, re-filled on every sync.
// Every other schedule keeps its single repeating daily trigger. Real scheduler + real notification service + the
// stateful fake notifee; only the preference/objective getters are stubbed (the same way the other scheduler tests
// do). This proves the JavaScript's decisions and timestamps; it cannot prove that a phone delivers a notification.
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);
jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  getPrivacySecuritySettings: jest.fn(() => ({
    discreetMode: false,
    discreetNotifications: false,
    hideNotificationPreview: false,
  })),
}));
jest.mock('../../state/onboardingPreferences', () => ({
  getActiveObjective: jest.fn(),
  // The sync waits for the active objective to have been READ before it gates on it.
  hydrateActiveObjective: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../state/contraceptionPreferences', () => ({
  getContraceptionPreferences: jest.fn(),
}));

const REMINDER_ID = 'contraception-daily-reminder';
const DAILY = 1; // notifee RepeatFrequency.DAILY

// "Today" is Sat 10 Oct 2026, built with the LOCAL constructor so "20:00" means 20:00 on the phone in any zone.
const at = (dayOffset: number, hours = 20, minutes = 0, seconds = 0) =>
  new Date(2026, 9, 10 + dayOffset, hours, minutes, seconds, 0);
const keyOf = (dayOffset: number) => new Date(2026, 9, 10 + dayOffset, 12).toLocaleDateString('en-CA');
/** The start date that makes TODAY pack day `packDay` of the pack (pack day 1 = the start date). */
const startForPackDayToday = (packDay: number) => keyOf(-(packDay - 1));

const mockObjective = getActiveObjective as jest.Mock;
const mockPreferences = getContraceptionPreferences as jest.Mock;

function preferences(overrides: Record<string, unknown> = {}) {
  return {
    method: 'pill',
    methodStartDate: startForPackDayToday(15),
    hasTreatmentBreak: true,
    pillScheduleType: 'cyclic',
    activeDays: 21,
    breakDays: 7,
    remindersEnabled: true,
    reminderTime: '20:00',
    ...overrides,
  };
}

/** Every pending trigger this reminder owns, earliest first. */
function pending() {
  return Array.from(fakeNotifeeState.triggers.entries())
    .filter(([id]) => id === REMINDER_ID || id.startsWith(`${REMINDER_ID}::`))
    .map(([id, record]) => ({id, timestamp: record.trigger.timestamp as number, trigger: record.trigger, notification: record.notification}))
    .sort((a, b) => a.timestamp - b.timestamp);
}
const pendingTimes = () => pending().map(entry => entry.timestamp);
const times = (...dates: Date[]) => dates.map(date => date.getTime());

async function syncWith(overrides: Record<string, unknown> = {}, now: Date = at(0, 8, 0)) {
  jest.setSystemTime(now);
  mockPreferences.mockReturnValue(preferences(overrides));
  await syncContraceptionReminder();
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(at(0, 8, 0));
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  mockObjective.mockReturnValue('contraception');
  mockPreferences.mockReturnValue(preferences());
});

afterEach(() => {
  jest.useRealTimers();
});

describe('cyclic 21 + 7 pack: the reminder is laid out day by day', () => {
  it('today is pack day 15: one trigger for each of the 7 pill days left, NONE on the 7 break days that follow', async () => {
    await syncWith({methodStartDate: startForPackDayToday(15)});

    // Pill days 15..21 = Oct 10..16. Break days 22..28 = Oct 17..23 (the rest of the 14-day window).
    expect(pendingTimes()).toEqual(times(at(0), at(1), at(2), at(3), at(4), at(5), at(6)));
    expect(pending().map(entry => entry.id).sort()).toEqual(
      [REMINDER_ID, ...[1, 2, 3, 4, 5, 6].map(index => `${REMINDER_ID}::${index}`)].sort(),
    );
    // Nothing at all on a break day (the canonical predicate every screen uses).
    const schedule = getCyclicPillSchedule({method: 'pill', pillScheduleType: 'cyclic', activeDays: 21, breakDays: 7});
    for (let offset = 0; offset < PILL_REMINDER_WINDOW_DAYS; offset += 1) {
      const onThatDay = pendingTimes().some(timestamp => new Date(timestamp).toLocaleDateString('en-CA') === keyOf(offset));
      expect(onThatDay).toBe(!isPillBreakDateKey(keyOf(offset), startForPackDayToday(15), schedule));
    }
  });

  it('every member is a one-shot AlarmManager trigger carrying the in-app history payload', async () => {
    await syncWith();

    for (const entry of pending()) {
      expect(entry.trigger.repeatFrequency).toBeUndefined();
      expect(entry.trigger.alarmManager).toEqual({type: 1});
      expect(entry.notification.data).toMatchObject({hawaNotificationKind: 'contraception-reminder'});
      expect(entry.notification.data.inAppTitle).toEqual(expect.any(String));
    }
  });

  it('a break in the MIDDLE of the window is skipped and the next pack\'s pill days are included (today = day 18)', async () => {
    await syncWith({methodStartDate: startForPackDayToday(18)});

    // Pill days 18..21 = Oct 10..13, break 22..28 = Oct 14..20, next pack day 1..3 = Oct 21..23.
    expect(pendingTimes()).toEqual(times(at(0), at(1), at(2), at(3), at(11), at(12), at(13)));
  });

  it('a full pill window (today = day 1) has 14 triggers, one per day', async () => {
    await syncWith({methodStartDate: startForPackDayToday(1)});

    expect(pendingTimes()).toEqual(times(...Array.from({length: 14}, (_, offset) => at(offset))));
  });

  it('the first occurrence on a BREAK day moves to the next active day (today = day 22 -> Oct 17)', async () => {
    await syncWith({methodStartDate: startForPackDayToday(22)});

    expect(pendingTimes()[0]).toBe(at(7).getTime());
    expect(pendingTimes()).toEqual(times(at(7), at(8), at(9), at(10), at(11), at(12), at(13)));
    // Nothing is pending for any of the break days Oct 10..16.
    expect(pendingTimes().some(timestamp => timestamp < at(7).getTime())).toBe(false);
  });

  it('today\'s time already passed on a pill day: today is skipped, tomorrow is the first', async () => {
    await syncWith({methodStartDate: startForPackDayToday(15)}, at(0, 21, 0));

    expect(pendingTimes()).toEqual(times(at(1), at(2), at(3), at(4), at(5), at(6)));
  });

  it('the last pill day with its time passed: the next reminder is the first pill day of the NEXT pack', async () => {
    await syncWith({methodStartDate: startForPackDayToday(21)}, at(0, 21, 0));

    // Break = Oct 11..17 (days 22..28); day 1 of the next pack = Oct 18.
    expect(pendingTimes()[0]).toBe(at(8).getTime());
    expect(pendingTimes()).toEqual(times(at(8), at(9), at(10), at(11), at(12), at(13)));
  });

  it('a pack whose start date is still in the future reminds every day (no break day exists yet)', async () => {
    await syncWith({methodStartDate: keyOf(3)});

    // Before the start date there is no pack day, hence no break day (exactly what the Dashboard and Calendar show).
    expect(pendingTimes()).toEqual(times(...Array.from({length: 14}, (_, offset) => at(offset))));
  });

  it('a break LONGER than the window still leaves one trigger for the pack that follows', async () => {
    // 5 pill days + 30 break days; today is pack day 8, so every day of the next 14 is a break day.
    await syncWith({activeDays: 5, breakDays: 30, methodStartDate: startForPackDayToday(8)});

    // Pack day 35 = Nov 6 (offset 27); pack day 1 = Nov 7 (offset 28): the only trigger, 28 days away.
    expect(pendingTimes()).toEqual(times(at(28)));
    expect(pending()[0].id).toBe(REMINDER_ID);
  });

  it('a pack with NO pill days schedules nothing and removes what was pending', async () => {
    await syncWith({methodStartDate: startForPackDayToday(15)});
    expect(pending().length).toBe(7);

    await syncWith({activeDays: 0, breakDays: 7, methodStartDate: startForPackDayToday(15)});

    expect(pending()).toEqual([]);
    expect(getContraceptionReminderScheduleStatus()).toBe('idle');
  });
});

describe('every other schedule keeps ONE repeating daily trigger, exactly as before', () => {
  const expectSingleRepeatingTrigger = () => {
    expect(pending().map(entry => entry.id)).toEqual([REMINDER_ID]);
    const [only] = pending();
    expect(only.trigger.repeatFrequency).toBe(DAILY);
    expect(only.timestamp).toBe(at(0).getTime()); // 20:00 is still ahead at 08:00
  };

  it('continuous pill', async () => {
    await syncWith({pillScheduleType: 'continuous', activeDays: null, breakDays: null});
    expectSingleRepeatingTrigger();
  });

  it('"I do not know my schedule yet"', async () => {
    await syncWith({pillScheduleType: 'unknown', activeDays: null, breakDays: null});
    expectSingleRepeatingTrigger();
  });

  it('a pill whose schedule was never entered', async () => {
    await syncWith({pillScheduleType: null, activeDays: null, breakDays: null, hasTreatmentBreak: null});
    expectSingleRepeatingTrigger();
  });

  it('the "other" method', async () => {
    await syncWith({method: 'other', pillScheduleType: null, activeDays: null, breakDays: null});
    expectSingleRepeatingTrigger();
  });

  it('a "cyclic" pack entered with 0 break days has no break day to skip', async () => {
    await syncWith({activeDays: 28, breakDays: 0});
    expectSingleRepeatingTrigger();
  });

  it('a cyclic pack with no readable start date (no break day can be counted anywhere in the app)', async () => {
    await syncWith({methodStartDate: null});
    expectSingleRepeatingTrigger();

    await syncWith({methodStartDate: 'not-a-date'});
    expectSingleRepeatingTrigger();
  });

  it('ring / patch have no daily action: nothing is scheduled', async () => {
    await syncWith({method: 'ring', pillScheduleType: null, activeDays: null, breakDays: null});
    expect(pending()).toEqual([]);
  });
});

describe('changing the schedule never leaves a stale trigger behind', () => {
  it('cyclic -> continuous removes every `::n` member and keeps the single repeating trigger', async () => {
    await syncWith({methodStartDate: startForPackDayToday(1)});
    expect(pending().length).toBe(14);

    await syncWith({pillScheduleType: 'continuous', activeDays: null, breakDays: null, methodStartDate: startForPackDayToday(1)});

    expect(pending().map(entry => entry.id)).toEqual([REMINDER_ID]);
    expect(pending()[0].trigger.repeatFrequency).toBe(DAILY);
    expect(scheduledIds().filter(id => id.includes('::'))).toEqual([]);
  });

  it('continuous -> cyclic replaces the repeating trigger with the day-by-day plan', async () => {
    await syncWith({pillScheduleType: 'continuous', activeDays: null, breakDays: null});
    expect(pending()[0].trigger.repeatFrequency).toBe(DAILY);

    await syncWith({methodStartDate: startForPackDayToday(15)});

    expect(pendingTimes()).toEqual(times(at(0), at(1), at(2), at(3), at(4), at(5), at(6)));
    // `<id>` is now the first one-shot: it no longer repeats (it would otherwise fire on the break days).
    expect(pending().every(entry => entry.trigger.repeatFrequency === undefined)).toBe(true);
  });

  it('a plan that shrinks (the pack changed) cancels the members it no longer needs', async () => {
    await syncWith({methodStartDate: startForPackDayToday(1)});
    expect(pending().length).toBe(14);

    await syncWith({methodStartDate: startForPackDayToday(18)});

    expect(pendingTimes()).toEqual(times(at(0), at(1), at(2), at(3), at(11), at(12), at(13)));
    expect(pending().length).toBe(7);
  });

  it('switching the reminder off, or leaving Contraception, cancels the whole plan', async () => {
    await syncWith();
    expect(pending().length).toBeGreaterThan(1);

    await syncWith({remindersEnabled: false});
    expect(pending()).toEqual([]);
    expect(getContraceptionReminderScheduleStatus()).toBe('idle');

    await syncWith();
    expect(pending().length).toBeGreaterThan(1);

    mockObjective.mockReturnValue('pregnancy');
    await syncWith();
    expect(pending()).toEqual([]);
  });

  it('a method that cannot be reminded about (pill -> ring) cancels the plan', async () => {
    await syncWith();
    expect(pending().length).toBeGreaterThan(1);

    await syncWith({method: 'ring'});

    expect(pending()).toEqual([]);
  });
});

describe('a delivery and the re-sync that follows it', () => {
  it('keeps today\'s delivered notification on screen and keeps the window full', async () => {
    await syncWith({methodStartDate: startForPackDayToday(15)});
    expect(pending().length).toBe(7);

    // 20:00 — Android fires today's trigger; seconds later notifee starts the JS and every scheduler re-syncs.
    jest.setSystemTime(at(0, 20, 0, 5));
    deliverTrigger(REMINDER_ID);
    expect(displayedIds()).toEqual([REMINDER_ID]);

    await syncWith({methodStartDate: startForPackDayToday(15)}, at(0, 20, 0, 10));

    // Today's copy is still in the shade (the sync never dismisses a delivered notification)...
    expect(displayedIds()).toEqual([REMINDER_ID]);
    expect(fakeNotifeeState.displayed.size).toBe(1);
    // ...and every remaining pill day of the window is still scheduled (Oct 11..16): the window did not drain.
    expect(pendingTimes()).toEqual(times(at(1), at(2), at(3), at(4), at(5), at(6)));
  });

  it('every day the window moves forward: tomorrow\'s sync adds the day that entered the horizon', async () => {
    await syncWith({methodStartDate: startForPackDayToday(20)});
    // Pill days 20, 21 = Oct 10, 11; break Oct 12..18; next pack Oct 19..23.
    expect(pendingTimes()).toEqual(times(at(0), at(1), at(9), at(10), at(11), at(12), at(13)));

    // Oct 11 at 08:00 (the app is opened): the horizon is now Oct 11..24, so Oct 24 joins and Oct 10 is gone.
    await syncWith({methodStartDate: startForPackDayToday(20)}, at(1, 8, 0));

    expect(pendingTimes()).toEqual(times(at(1), at(9), at(10), at(11), at(12), at(13), at(14)));
  });

  it('ids are re-used in place: no duplicate, no leftover member from the previous plan', async () => {
    await syncWith({methodStartDate: startForPackDayToday(15)});
    await syncWith({methodStartDate: startForPackDayToday(15)});
    await syncWith({methodStartDate: startForPackDayToday(15)});

    expect(pending().length).toBe(7);
    expect(new Set(pending().map(entry => entry.id)).size).toBe(7);
  });
});

describe('daylight-saving time: every member keeps the wall-clock time she chose', () => {
  const offsetAt = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTimezoneOffset();
  const zoneHasDst = offsetAt(2026, 1, 15) !== offsetAt(2026, 7, 15);

  it('zone under test (informational): reports whether a DST change is actually exercised', () => {
    // On a machine whose zone has no DST (or where TZ is ignored, e.g. Node on Windows) the cases below are valid
    // but cannot fail on a "+ 24 h" implementation: run with TZ=Europe/Paris on Linux/macOS/CI to discriminate.
    console.info(`[F18] time zone has DST changes in this run: ${zoneHasDst}`);
    expect(typeof zoneHasDst).toBe('boolean');
  });

  const expectWallClock = (hours: number, minutes: number) => {
    for (const {timestamp} of pending()) {
      const when = new Date(timestamp);
      expect([when.getHours(), when.getMinutes(), when.getSeconds()]).toEqual([hours, minutes, 0]);
    }
  };

  it('a window crossing the AUTUMN change (EU: 25 Oct 2026) fires at 20:00 local on every pill day', async () => {
    // Today = Tue 20 Oct 2026. Pack day 1 = Oct 1: pill days Oct 20, 21, then break Oct 22..28, pill Oct 29..Nov 2.
    const now = new Date(2026, 9, 20, 8, 0, 0);
    await syncWith({methodStartDate: '2026-10-01'}, now);

    const expected = [0, 1, 9, 10, 11, 12, 13].map(offset => new Date(2026, 9, 20 + offset, 20, 0, 0, 0).getTime());
    expect(pendingTimes()).toEqual(expected);
    expectWallClock(20, 0);
  });

  it('a window crossing the SPRING change (EU: 29 Mar 2026) fires at 20:00 local on every pill day', async () => {
    // Today = Thu 26 Mar 2026. Pack day 1 = Mar 26: pill days Mar 26..Apr 8 (all 14 of the window).
    const now = new Date(2026, 2, 26, 8, 0, 0);
    await syncWith({methodStartDate: '2026-03-26'}, now);

    const expected = Array.from({length: 14}, (_, offset) => new Date(2026, 2, 26 + offset, 20, 0, 0, 0).getTime());
    expect(pendingTimes()).toEqual(expected);
    expectWallClock(20, 0);
  });

  it('a reminder time INSIDE the clock-change hour still gives exactly one reminder on that calendar day', async () => {
    // 02:30 does not exist on the spring-forward night and 01:30 happens twice on the autumn one: a day must never be
    // lost or doubled (every pill day of the 14-day window has one trigger, on consecutive calendar days).
    for (const [timeText, start] of [
      ['02:30', new Date(2026, 2, 26, 0, 10, 0)], // 00:10: today's 02:30 is still ahead, so all 14 days count
      ['01:30', new Date(2026, 9, 22, 0, 10, 0)],
    ] as const) {
      resetFakeNotifee();
      __resetNotificationServiceForTests();
      const startKey = start.toLocaleDateString('en-CA');
      await syncWith({reminderTime: timeText, methodStartDate: startKey}, start);
      const days = pending().map(entry => new Date(entry.timestamp));
      expect(days).toHaveLength(14);
      days.forEach((when, offset) => {
        const expectedDay = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
        expect([when.getFullYear(), when.getMonth(), when.getDate()]).toEqual([
          expectedDay.getFullYear(),
          expectedDay.getMonth(),
          expectedDay.getDate(),
        ]);
      });
    }
  });

  it('the day-by-day plan itself is built from local calendar days, not from 24 h steps', () => {
    const plan = planPillReminderOccurrences({
      reminderTime: '07:45',
      methodStartDate: '2026-03-26',
      schedule: {activeDays: 28, totalDays: 28},
      now: new Date(2026, 2, 26, 6, 0, 0),
    });

    expect(plan).toHaveLength(14);
    plan.forEach((fireDate, offset) => {
      expect(fireDate.getTime()).toBe(new Date(2026, 2, 26 + offset, 7, 45, 0, 0).getTime());
    });
  });
});

describe('planPillReminderOccurrences', () => {
  const schedule = {activeDays: 21, totalDays: 28};

  it('is the reminder time on each non-break day of the next 14 calendar days, only instants still ahead', () => {
    const plan = planPillReminderOccurrences({
      reminderTime: '20:00',
      methodStartDate: startForPackDayToday(19),
      schedule,
      now: at(0, 12, 0),
    });

    // Days 19, 20, 21 = Oct 10, 11, 12; break 22..28 = Oct 13..19; next pack 1..4 = Oct 20..23.
    expect(plan.map(date => date.getTime())).toEqual(times(at(0), at(1), at(2), at(10), at(11), at(12), at(13)));
  });

  it('is earliest first and strictly in the future', () => {
    const now = at(0, 20, 0, 0); // exactly the reminder time: not "still ahead"
    const plan = planPillReminderOccurrences({reminderTime: '20:00', methodStartDate: startForPackDayToday(1), schedule, now});

    expect(plan[0].getTime()).toBe(at(1).getTime());
    expect(plan.every(date => date.getTime() > now.getTime())).toBe(true);
    expect([...plan].sort((a, b) => a.getTime() - b.getTime())).toEqual(plan);
  });

  it('reads a stored "24:30" (midnight written under en-US) as 00:30 of the SAME calendar day', () => {
    const plan = planPillReminderOccurrences({
      reminderTime: '24:30',
      methodStartDate: startForPackDayToday(1),
      schedule,
      now: at(0, 0, 10),
    });

    expect(plan[0].getTime()).toBe(at(0, 0, 30).getTime()); // today at 00:30, not tomorrow
  });
});

describe('schedule status plumbing', () => {
  it('is "scheduled" after a day-by-day plan, "idle" once switched off', async () => {
    await syncWith();
    expect(getContraceptionReminderScheduleStatus()).toBe('scheduled');

    await syncWith({remindersEnabled: false});
    expect(getContraceptionReminderScheduleStatus()).toBe('idle');
  });

  it('is "failed" when Android notifications are off — and nothing is left pending', async () => {
    fakeNotifeeState.authorizationStatus = 0;
    await syncWith();

    expect(getContraceptionReminderScheduleStatus()).toBe('failed');
    expect(pending()).toEqual([]);

    // Turning notifications on later is picked up by the next sync, in the same process.
    fakeNotifeeState.authorizationStatus = 1;
    await syncWith();
    expect(getContraceptionReminderScheduleStatus()).toBe('scheduled');
    expect(pending().length).toBe(7);
  });

  it('a native failure still REJECTS, like the repeating path (the next sync retries)', async () => {
    fakeNotifeeState.createTriggerError = new Error('native boom');

    await expect(syncWith()).rejects.toThrow('native boom');

    await syncWith();
    expect(pending().length).toBe(7);
  });
});
