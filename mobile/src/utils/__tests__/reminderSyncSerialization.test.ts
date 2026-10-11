import {syncContraceptionReminder} from '../contraceptionReminderScheduling';
import {syncMenopauseReminders} from '../menopauseReminderScheduling';
import {syncPostpartumDailyTrackingReminder} from '../postpartumReminderScheduling';
import {syncMiscarriageDailyTrackingReminder} from '../miscarriageReminderScheduling';
import {
  cancelLocalNotification,
  scheduleLocalNotification,
  scheduleReminderSeries,
} from '../../services/pregnancyNotifications';
import {getActiveObjective} from '../../state/onboardingPreferences';
import {getContraceptionPreferences} from '../../state/contraceptionPreferences';
import {getMenopausePreferences} from '../../state/menopausePreferences';
import {getPostpartumPreferences} from '../../state/postpartumPreferences';
import {getMiscarriagePreferences} from '../../state/miscarriagePreferences';

// F7 (ordering) — the four objective schedulers are driven from many places at once (app start, a preference or the
// objective changing, returning to the foreground, a language change). Their runs used to overlap: an older run,
// working from older state, could finish AFTER a newer one and put back a reminder that had just been switched off.
// Each exported sync is now coalesced: runs never overlap, and any burst of calls shares ONE follow-up run that starts
// afterwards and therefore reads the newest preferences.
//
// The notification service is replaced by a stand-in whose SCHEDULING calls are held open by the test, so a run can be
// observed "inside Android" while further syncs are requested. (Cancellations return at once: they are the other
// half of every ordering question and need no holding.)
jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  scheduleReminderSeries: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));
jest.mock('../../state/onboardingPreferences', () => ({
  getActiveObjective: jest.fn(),
  // The sync waits for the active objective to have been READ before it gates on it.
  hydrateActiveObjective: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../state/contraceptionPreferences', () => ({getContraceptionPreferences: jest.fn()}));
jest.mock('../../state/menopausePreferences', () => ({getMenopausePreferences: jest.fn()}));
jest.mock('../../state/postpartumPreferences', () => ({getPostpartumPreferences: jest.fn()}));
jest.mock('../../state/miscarriagePreferences', () => ({getMiscarriagePreferences: jest.fn()}));

const mockSchedule = scheduleLocalNotification as jest.Mock;
const mockSeries = scheduleReminderSeries as jest.Mock;
const mockCancel = cancelLocalNotification as jest.Mock;
const mockObjective = getActiveObjective as jest.Mock;

type Case = {
  name: string;
  objective: string;
  /** The mocked service call a run makes to put the reminder ON. */
  scheduleMock: jest.Mock;
  /** Cancellations a run makes while its reminder is ON (Menopause cancels the treatment reminder it does not use). */
  cancelsWhenOn: number;
  /** Cancellations a run makes while its reminder is OFF. */
  cancelsWhenOff: number;
  sync: () => Promise<void>;
  setPreferences: (state: {enabled: boolean; time: string}) => void;
};

const CASES: Case[] = [
  {
    name: 'contraception (repeating daily trigger)',
    objective: 'contraception',
    scheduleMock: mockSchedule,
    cancelsWhenOn: 0,
    cancelsWhenOff: 1,
    sync: syncContraceptionReminder,
    setPreferences: ({enabled, time}) =>
      (getContraceptionPreferences as jest.Mock).mockReturnValue({
        method: 'pill',
        methodStartDate: null,
        hasTreatmentBreak: false,
        pillScheduleType: 'continuous',
        activeDays: null,
        breakDays: null,
        remindersEnabled: enabled,
        reminderTime: time,
      }),
  },
  {
    name: 'contraception (day-by-day plan of a cyclic pack)',
    objective: 'contraception',
    scheduleMock: mockSeries,
    cancelsWhenOn: 0,
    cancelsWhenOff: 1,
    sync: syncContraceptionReminder,
    setPreferences: ({enabled, time}) =>
      (getContraceptionPreferences as jest.Mock).mockReturnValue({
        method: 'pill',
        methodStartDate: '2026-09-26',
        hasTreatmentBreak: true,
        pillScheduleType: 'cyclic',
        activeDays: 21,
        breakDays: 7,
        remindersEnabled: enabled,
        reminderTime: time,
      }),
  },
  {
    name: 'menopause (daily tracking)',
    objective: 'menopause',
    scheduleMock: mockSchedule,
    cancelsWhenOn: 1,
    cancelsWhenOff: 2,
    sync: syncMenopauseReminders,
    setPreferences: ({enabled, time}) =>
      (getMenopausePreferences as jest.Mock).mockReturnValue({
        hormonalTreatmentStatus: 'no',
        dailyTrackingReminderEnabled: enabled,
        dailyTrackingReminderTime: time,
        treatmentReminderEnabled: false,
        treatmentReminderTime: null,
      }),
  },
  {
    name: 'postpartum (daily tracking)',
    objective: 'postpartum',
    scheduleMock: mockSchedule,
    cancelsWhenOn: 0,
    cancelsWhenOff: 1,
    sync: syncPostpartumDailyTrackingReminder,
    setPreferences: ({enabled, time}) =>
      (getPostpartumPreferences as jest.Mock).mockReturnValue({
        dailyTrackingReminderEnabled: enabled,
        dailyTrackingReminderTime: time,
      }),
  },
  {
    name: 'miscarriage (daily tracking)',
    objective: 'loss',
    scheduleMock: mockSchedule,
    cancelsWhenOn: 0,
    cancelsWhenOff: 1,
    sync: syncMiscarriageDailyTrackingReminder,
    setPreferences: ({enabled, time}) =>
      (getMiscarriagePreferences as jest.Mock).mockReturnValue({
        dailyTrackingReminderEnabled: enabled,
        dailyTrackingReminderTime: time,
      }),
  },
];

// --- the held-open notification service ----------------------------------------------------------------------------
let gates: Array<() => void>;
let inFlight: number;
let maxInFlight: number;
let log: string[];

/** Lets every promise chain that can make progress without a gate do so. */
const flush = async () => {
  for (let index = 0; index < 25; index += 1) {
    await Promise.resolve();
  }
};

const release = async (count = 1) => {
  for (let index = 0; index < count; index += 1) {
    const open = gates.shift();
    if (!open) {throw new Error('no scheduling call is waiting inside the notification service');}
    open();
    await flush();
  }
};

/** The hour of the reminder a scheduling call asks for ('-' for a cancellation). */
const hourOf = (input: unknown): number | string => {
  const request = input as {fireDate?: Date; occurrences?: Date[]} | string | undefined;
  if (request && typeof request === 'object') {
    const first = request.fireDate ?? request.occurrences?.[0];
    if (first) {return first.getHours();}
  }
  return '-';
};

function heldOpen(result: unknown) {
  return async (input?: unknown) => {
    const hour = hourOf(input);
    log.push(`schedule:start:${hour}`);
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise<void>(resolve => gates.push(resolve));
    inFlight -= 1;
    log.push(`schedule:end:${hour}`);
    return result;
  };
}

const cancelsLogged = () => log.filter(entry => entry === 'cancel').length;

beforeEach(() => {
  gates = [];
  inFlight = 0;
  maxInFlight = 0;
  log = [];
  jest.clearAllMocks();
  mockSchedule.mockReset().mockImplementation(heldOpen(true));
  mockSeries.mockReset().mockImplementation(heldOpen({scheduled: true, fireDate: new Date()}));
  mockCancel.mockReset().mockImplementation(async () => {
    log.push('cancel');
    return true;
  });
});

describe.each(CASES)('$name', ({objective, scheduleMock, cancelsWhenOn, cancelsWhenOff, sync, setPreferences}) => {
  beforeEach(() => {
    mockObjective.mockReturnValue(objective);
  });

  it('a burst of calls never overlaps and shares ONE follow-up run', async () => {
    setPreferences({enabled: true, time: '08:00'});

    const calls = [sync(), sync(), sync(), sync()];
    await flush();
    expect(scheduleMock).toHaveBeenCalledTimes(1); // only the first run is inside the service
    expect(cancelsLogged()).toBe(cancelsWhenOn);
    expect(inFlight).toBe(1);

    await release(); // run 1 finishes -> the single follow-up starts
    expect(scheduleMock).toHaveBeenCalledTimes(2);
    expect(inFlight).toBe(1);

    await release(); // the follow-up finishes
    await expect(Promise.all(calls)).resolves.toEqual([undefined, undefined, undefined, undefined]);

    expect(scheduleMock).toHaveBeenCalledTimes(2); // four calls, two runs
    expect(cancelsLogged()).toBe(cancelsWhenOn * 2);
    expect(maxInFlight).toBe(1); // never two scheduling operations in Android at once
  });

  it('the follow-up run reads the preferences as they are AFTER the run it waited for', async () => {
    setPreferences({enabled: true, time: '08:00'});
    const first = sync();
    await flush();
    expect(scheduleMock).toHaveBeenCalledTimes(1);
    expect(hourOf(scheduleMock.mock.calls[0][0])).toBe(8);

    // She changes the time while the first run is still working, and a sync is requested for it.
    setPreferences({enabled: true, time: '21:30'});
    const second = sync();
    await flush();
    expect(scheduleMock).toHaveBeenCalledTimes(1); // not started yet: it waits

    await release();
    await release();
    await Promise.all([first, second]);

    expect(scheduleMock).toHaveBeenCalledTimes(2);
    expect(hourOf(scheduleMock.mock.calls[1][0])).toBe(21);
  });

  it('an older run can never finish after a newer one: a reminder switched off stays off', async () => {
    setPreferences({enabled: true, time: '08:00'});
    const enabling = sync();
    await flush();
    expect(log.filter(entry => entry !== 'cancel')).toEqual(['schedule:start:8']); // run 1 holds the reminder ON
    const cancelsBefore = cancelsLogged();
    expect(cancelsBefore).toBe(cancelsWhenOn);

    setPreferences({enabled: false, time: '08:00'});
    const disabling = sync();
    await flush();
    // The "off" run has not started: it must come AFTER (it would cancel at once if it were allowed to run now).
    expect(cancelsLogged()).toBe(cancelsBefore);

    await release(); // run 1 completes...
    await disabling; // ...then the "off" run runs and completes
    await enabling;

    // Exactly one scheduling call in the whole history, finished BEFORE the cancellations of the "off" run, and the
    // last thing that happened is a cancellation: the reminder is off.
    expect(log.filter(entry => entry.startsWith('schedule'))).toEqual(['schedule:start:8', 'schedule:end:8']);
    expect(cancelsLogged()).toBe(cancelsWhenOn + cancelsWhenOff);
    expect(log[log.length - 1]).toBe('cancel');
    expect(log.lastIndexOf('schedule:end:8')).toBeLessThan(log.length - cancelsWhenOff);
  });

  it('a failed run does not block the next one, and its caller sees the failure', async () => {
    setPreferences({enabled: true, time: '08:00'});
    scheduleMock.mockImplementationOnce(async () => {
      throw new Error('native boom');
    });

    await expect(sync()).rejects.toThrow('native boom');

    const next = sync();
    await flush();
    await release();
    await expect(next).resolves.toBeUndefined();
  });
});

describe('menopause: both of its reminders belong to ONE run', () => {
  beforeEach(() => {
    mockObjective.mockReturnValue('menopause');
    (getMenopausePreferences as jest.Mock).mockReturnValue({
      hormonalTreatmentStatus: 'track',
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '19:00',
      treatmentReminderEnabled: true,
      treatmentReminderTime: '07:00',
    });
  });

  it('the follow-up run starts only after BOTH reminders of the first run have settled', async () => {
    const first = syncMenopauseReminders();
    const second = syncMenopauseReminders();
    await flush();
    // Run 1 hands both reminders to the service at once...
    expect(log).toEqual(['schedule:start:19', 'schedule:start:7']);

    await release();
    // ...and one of them finishing is not enough for the next run to start.
    expect(log).toEqual(['schedule:start:19', 'schedule:start:7', 'schedule:end:19']);

    await release();
    await flush();
    expect(log.slice(0, 4)).toEqual(['schedule:start:19', 'schedule:start:7', 'schedule:end:19', 'schedule:end:7']);
    expect(log.slice(4)).toEqual(['schedule:start:19', 'schedule:start:7']); // run 2

    await release(2);
    await Promise.all([first, second]);
    expect(mockSchedule).toHaveBeenCalledTimes(4);
  });

  it('a failure of one reminder still waits for the other before the run is over, then rejects', async () => {
    mockSchedule.mockReset();
    // The daily reminder fails at once; the treatment reminder is held inside the service.
    mockSchedule
      .mockImplementationOnce(async () => {
        log.push('schedule:start:19');
        throw new Error('daily failed');
      })
      .mockImplementation(heldOpen(true));

    const run = syncMenopauseReminders();
    let settled = false;
    run.then(
      () => {settled = true;},
      () => {settled = true;},
    );
    await flush();
    // The treatment reminder is still inside the service: the run is not over, even though one half already failed.
    expect(log).toEqual(['schedule:start:19', 'schedule:start:7']);
    expect(settled).toBe(false);

    await release();
    await expect(run).rejects.toThrow('daily failed');
    expect(maxInFlight).toBe(1);
  });
});
