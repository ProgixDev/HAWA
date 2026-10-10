import AsyncStorage from '@react-native-async-storage/async-storage';

import {cancelCycleRemindersForProfile, syncCycleReminders} from '../cycleReminderScheduling';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {hydrateCyclePreferences, setCyclePreferences} from '../../state/onboardingPreferences';
import {hydrateCycleReminderPreferences, resetCycleReminderPreferencesForTests, setCycleReminderPreferences} from '../../state/cycleReminderPreferences';
import {addManagedProfile, deleteManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {seedManagedProfileCycleIfNeeded} from '../../state/managedProfileCycleSeed';
import {setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {__markUnavailableForTests, resetStructuredStorageForTests} from '../../services/secureAsyncStorage';

// Cycle reminders are reconciled by an async function with many native awaits, requested from many
// places (cycle edits, preference changes, profile switches, app launch). These tests replace the
// native layer with a FAKE whose calls complete only when the test says so — in any order — and then
// assert on the final NATIVE state, not on what a function returned.
//
// Time pinned to Thu 1 Oct 2026: the owner's cycle (period start Sep 10, 28 days) predicts Oct 8, so the
// four date-based reminders of each profile are in the future.

jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
  // the other objectives' launch-time syncs (imported with App) also cancel in bulk
  cancelLocalNotifications: jest.fn(() => Promise.resolve()),
}));

const mockSchedule = scheduleLocalNotification as jest.Mock;
const mockCancel = cancelLocalNotification as jest.Mock;

type NativeEntry = {id: string; title: string; profileId: string};
const native = new Map<string, NativeEntry>();
const waiting: {label: string; release: () => void}[] = [];
let gated = false;
const failures = new Set<string>(); // "schedule:<id>" / "cancel:<id>" → reject once

const flush = async () => {
  for (let index = 0; index < 60; index += 1) {
    await Promise.resolve();
  }
};

const viaNative = (label: string, effect: () => void): Promise<boolean> => {
  const execute = () => {
    if (failures.has(label)) {
      failures.delete(label);
      throw new Error(`native failure: ${label}`);
    }
    effect();
    return true;
  };
  if (!gated) {
    try {
      return Promise.resolve(execute());
    } catch (error) {
      return Promise.reject(error);
    }
  }
  return new Promise<boolean>((resolve, reject) => {
    waiting.push({
      label,
      release: () => {
        try {
          resolve(execute());
        } catch (error) {
          reject(error);
        }
      },
    });
  });
};

/** Completes every held native call, in the given order, until nothing is left in flight. */
const releaseAll = async (order: 'fifo' | 'lifo' = 'fifo') => {
  for (let guard = 0; guard < 200; guard += 1) {
    await flush();
    if (waiting.length === 0) {
      return;
    }
    const next = order === 'lifo' ? waiting.pop() : waiting.shift();
    next?.release();
  }
  throw new Error('native calls never drained');
};

const ALL_ON = {
  upcomingPeriodEnabled: true,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: true,
  dailyJournalEnabled: false,
  dailyJournalTime: null,
  fertileWindowEnabled: true,
  ovulationEnabled: true,
};
const ALL_OFF = {...ALL_ON, upcomingPeriodEnabled: false, periodStartCheckEnabled: false, fertileWindowEnabled: false, ovulationEnabled: false};
const BASES = ['cycle-upcoming-period-reminder', 'cycle-period-start-check-reminder', 'cycle-fertile-window-reminder', 'cycle-ovulation-reminder'];
const idsOf = (profileId: string) => BASES.map(base => `${base}:${profileId}`).sort();
const nativeIds = () => [...native.keys()].sort();

let daughterId = '';

const settleStores = async () => {
  await hydrateCyclePreferences();
  await hydrateCycleReminderPreferences();
};

beforeEach(async () => {
  jest.useFakeTimers({now: new Date(2026, 9, 1, 12, 0, 0)});
  gated = false;
  native.clear();
  waiting.length = 0;
  failures.clear();
  mockSchedule.mockReset();
  mockCancel.mockReset();
  mockSchedule.mockImplementation(input =>
    viaNative(`schedule:${input.id}`, () => native.set(input.id, {id: input.id, title: input.title, profileId: input.data.profileId})),
  );
  mockCancel.mockImplementation(id => viaNative(`cancel:${id}`, () => native.delete(id)));

  await AsyncStorage.clear();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  resetCycleReminderPreferencesForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');

  // The owner: a confirmed 28-day cycle and every reminder on.
  await settleStores();
  setCyclePreferences({lastPeriodStart: new Date(2026, 8, 10, 12), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
  await setCycleReminderPreferences({...ALL_ON});

  // A daughter with lengths her mother provided, and every reminder on.
  const noor = await addManagedProfile({
    type: 'daughter',
    firstName: 'Noor',
    birthDate: '2014-05-01',
    hasHadFirstPeriod: true,
    lastPeriodDate: '2026-09-12',
    periodLength: 5,
    cycleLength: 28,
    regularity: 'yes',
  });
  daughterId = noor.id;
  await setActiveProfileId(noor.id);
  await settleStores();
  await seedManagedProfileCycleIfNeeded(noor.id);
  await setCycleReminderPreferences({...ALL_ON});

  await setActiveProfileId(OWNER_PROFILE_ID);
  await settleStores();
  native.clear();
  mockSchedule.mockClear();
  mockCancel.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('baseline — each profile owns exactly its own reminders', () => {
  it('the owner and the daughter each end with their four reminders, under their own ids, wording and profileId', async () => {
    await syncCycleReminders();
    await setActiveProfileId(daughterId);
    await syncCycleReminders();

    expect(nativeIds()).toEqual([...idsOf(OWNER_PROFILE_ID), ...idsOf(daughterId)].sort());
    native.forEach(entry => {
      expect(entry.id.endsWith(`:${entry.profileId}`)).toBe(true); // the id and the payload always agree
      expect(entry.title.includes('Noor')).toBe(entry.profileId === daughterId); // her name only on her reminders
    });
  });
});

describe('profile switch DURING a synchronization', () => {
  it('A → B: the run that began for the owner writes only owner reminders, the next one only hers', async () => {
    gated = true;
    const first = syncCycleReminders(); // the owner's run; its native calls are held
    await flush();
    await setActiveProfileId(daughterId); // the user switches while they are in flight
    const second = syncCycleReminders();
    await releaseAll();
    await Promise.all([first, second]);

    expect(nativeIds()).toEqual([...idsOf(OWNER_PROFILE_ID), ...idsOf(daughterId)].sort());
    native.forEach(entry => {
      expect(entry.id.endsWith(`:${entry.profileId}`)).toBe(true);
      expect(entry.title.includes('Noor')).toBe(entry.profileId === daughterId);
    });
  });

  it('A → B → A in quick succession: the final state is authoritative for the profile left active', async () => {
    gated = true;
    const runs: Promise<void>[] = [syncCycleReminders()];
    await flush();
    await setActiveProfileId(daughterId);
    runs.push(syncCycleReminders());
    await setActiveProfileId(OWNER_PROFILE_ID);
    runs.push(syncCycleReminders());
    await releaseAll('lifo');
    await Promise.all(runs);

    // The owner is active and her reminders are complete and correct; nothing carries another profile's data.
    idsOf(OWNER_PROFILE_ID).forEach(id => expect(native.get(id)?.profileId).toBe(OWNER_PROFILE_ID));
    native.forEach(entry => expect(entry.id.endsWith(`:${entry.profileId}`)).toBe(true));
  });

  it('a profile that is still being read is never reconciled against its neutral placeholder', async () => {
    await syncCycleReminders();
    // Her stored cycle and reminder preferences are slow to read…
    const storage = AsyncStorage.getItem as jest.Mock;
    const realGetItem = storage.getMockImplementation() as (key: string) => Promise<string | null>;
    const held: (() => void)[] = [];
    storage.mockImplementation((key: string) => {
      if (!key.includes(`:profile:${daughterId}`) || !/cycle-(preferences|reminder)/.test(key)) {
        return realGetItem(key);
      }
      const snapshot = realGetItem(key);
      return new Promise(resolve => held.push(() => resolve(snapshot)));
    });
    try {
      await setActiveProfileId(daughterId); // …while memory holds the neutral placeholder
      const run = syncCycleReminders();
      await flush();
      expect(held.length).toBeGreaterThan(0);
      // Release every held read as it appears. Reads of an encrypted record are queued per record, so the second read
      // is only issued once the first one has been released — a single release pass would leave it held forever.
      let settled = false;
      const done = run.finally(() => {
        settled = true;
      });
      for (let pass = 0; pass < 50 && !settled; pass += 1) {
        held.splice(0).forEach(release => release());
        await flush();
      }
      await done;
    } finally {
      storage.mockImplementation(realGetItem);
    }
    // Her reminders were created from her real data — not cancelled for lack of any.
    expect(idsOf(daughterId).every(id => native.has(id))).toBe(true);
  });
});

describe('older run finishing after a newer one (same profile)', () => {
  it('cannot resurrect a reminder the newer run cancelled', async () => {
    await syncCycleReminders();
    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID));

    gated = true;
    const older = syncCycleReminders(); // read ALL_ON, native calls held
    await flush();
    await setCycleReminderPreferences({...ALL_OFF}); // the user switches every reminder off meanwhile
    const newer = syncCycleReminders();
    await releaseAll('lifo');
    await Promise.all([older, newer]);

    expect(nativeIds()).toEqual([]);
  });

  it('coalesces a burst of requests instead of piling up runs, and leaves no duplicates', async () => {
    const burst = Array.from({length: 6}, () => syncCycleReminders());
    await Promise.all(burst);

    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID));
    const upcoming = mockSchedule.mock.calls.filter(([input]) => input.id === 'cycle-upcoming-period-reminder:owner');
    expect(upcoming.length).toBeLessThanOrEqual(2); // one run + at most one trailing run, never six
  });

  it('repeated reconciliation is idempotent (one entry per id)', async () => {
    await syncCycleReminders();
    await syncCycleReminders();
    await syncCycleReminders();
    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID));
  });
});

describe('native calls resolving late / failing', () => {
  it('scheduling that resolves late and out of order still ends in the right state', async () => {
    gated = true;
    const run = syncCycleReminders();
    await releaseAll('lifo');
    await run;
    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID));
  });

  it('cancellation that resolves late: the reminder is gone once it completes, and is not re-added', async () => {
    await syncCycleReminders();
    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID));

    await setCycleReminderPreferences({...ALL_OFF});
    gated = true;
    const run = syncCycleReminders();
    await flush();
    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID)); // the native cancel has not completed yet
    await releaseAll();
    await run;
    expect(nativeIds()).toEqual([]);
    gated = false;
    await syncCycleReminders();
    expect(nativeIds()).toEqual([]);
  });

  it('a rejected native schedule does not stop the other reminders, and the next reconciliation repairs it', async () => {
    failures.add('schedule:cycle-ovulation-reminder:owner');
    await syncCycleReminders(); // must resolve
    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID).filter(id => !id.startsWith('cycle-ovulation')));

    await syncCycleReminders();
    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID));
  });

  it('a rejected native cancel does not wedge the queue', async () => {
    await syncCycleReminders();
    await setCycleReminderPreferences({...ALL_OFF});
    failures.add('cancel:cycle-upcoming-period-reminder:owner');
    await syncCycleReminders(); // must resolve even though one cancel failed
    expect(native.has('cycle-upcoming-period-reminder:owner')).toBe(true); // that one is still there…

    await syncCycleReminders(); // …and the next run removes it
    expect(nativeIds()).toEqual([]);
  });
});

describe('a failed native call is detected and recovered without anyone triggering a new sync', () => {
  it('a failed cancel is retried automatically and the stale reminder ends up removed', async () => {
    await syncCycleReminders();
    await setCycleReminderPreferences({...ALL_OFF});
    failures.add('cancel:cycle-upcoming-period-reminder:owner');
    await syncCycleReminders();
    expect(native.has('cycle-upcoming-period-reminder:owner')).toBe(true); // failed: still scheduled

    jest.advanceTimersByTime(30_000); // the first bounded retry
    await flush();
    expect(nativeIds()).toEqual([]);
  });

  it('a failed schedule is retried automatically too', async () => {
    failures.add('schedule:cycle-ovulation-reminder:owner');
    await syncCycleReminders();
    expect(native.has('cycle-ovulation-reminder:owner')).toBe(false);

    jest.advanceTimersByTime(30_000);
    await flush();
    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID));
  });

  it('retries are bounded: persistent failure stops after three attempts instead of looping forever', async () => {
    mockCancel.mockImplementation(() => Promise.reject(new Error('native down')));
    await syncCycleReminders();
    const callsAfterFirstRun = mockCancel.mock.calls.length;
    for (const delay of [30_000, 120_000, 600_000, 600_000, 600_000]) {
      jest.advanceTimersByTime(delay);
      await flush();
    }
    const runs = mockCancel.mock.calls.length / callsAfterFirstRun;
    expect(runs).toBe(4); // the original run + exactly three retries
  });

  it('a new request supersedes a pending retry (no stray duplicate run)', async () => {
    failures.add('schedule:cycle-ovulation-reminder:owner');
    await syncCycleReminders();
    await syncCycleReminders(); // repairs it itself
    mockSchedule.mockClear();
    jest.advanceTimersByTime(30_000);
    await flush();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('cancelling a profile’s reminders reports a failure instead of hiding it, and touches only her ids', async () => {
    await setActiveProfileId(daughterId);
    await syncCycleReminders();
    await setActiveProfileId(OWNER_PROFILE_ID);
    await syncCycleReminders();
    failures.add(`cancel:cycle-ovulation-reminder:${daughterId}`);

    await expect(cancelCycleRemindersForProfile(daughterId)).rejects.toThrow();
    expect(native.has(`cycle-ovulation-reminder:${daughterId}`)).toBe(true); // known to be left over
    expect(idsOf(OWNER_PROFILE_ID).every(id => native.has(id))).toBe(true); // the owner's are intact

    await cancelCycleRemindersForProfile(daughterId); // the retry succeeds
    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID));
  });
});

describe('unreadable cycle records are not "no data"', () => {
  it('scheduled reminders are left exactly as they are — not cancelled, not rebuilt from the placeholder state', async () => {
    await syncCycleReminders();
    const before = nativeIds();
    expect(before.length).toBeGreaterThan(0);
    mockCancel.mockClear();
    mockSchedule.mockClear();

    __markUnavailableForTests('@hawa/cycle-preferences');
    await syncCycleReminders();
    expect(mockCancel).not.toHaveBeenCalled();
    expect(mockSchedule).not.toHaveBeenCalled();
    expect(nativeIds()).toEqual(before);

    // an unreadable record of another profile does not stop this profile's reconciliation
    resetStructuredStorageForTests();
    __markUnavailableForTests('@hawa/cycle-preferences:profile:somebody-else');
    await setCycleReminderPreferences({...ALL_OFF});
    await syncCycleReminders();
    expect(nativeIds()).toEqual([]);

    // and once everything is readable again the normal reconciliation resumes
    resetStructuredStorageForTests();
    await setCycleReminderPreferences({...ALL_ON});
    await syncCycleReminders();
    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID));
  });
});

describe('deleting a profile while a synchronization is in flight', () => {
  it('its reminders end cancelled, the owner and everything else untouched', async () => {
    await syncCycleReminders();
    await setActiveProfileId(daughterId);
    await syncCycleReminders();
    expect(nativeIds()).toEqual([...idsOf(OWNER_PROFILE_ID), ...idsOf(daughterId)].sort());

    gated = true;
    const inFlight = syncCycleReminders(); // a run for the daughter, held in the native layer
    await flush();
    await setActiveProfileId(OWNER_PROFILE_ID); // the deletion flow first leaves her profile…
    const cancelled = cancelCycleRemindersForProfile(daughterId);
    await deleteManagedProfile(daughterId);
    const afterwards = syncCycleReminders();
    await releaseAll();
    await Promise.all([inFlight, cancelled, afterwards]);

    expect(nativeIds()).toEqual(idsOf(OWNER_PROFILE_ID)); // none of hers, all of the owner's
  });
});

describe('app launch', () => {
  it('reconciles the reminders of the profile that was active when the app was closed — and only hers', async () => {
    await setActiveProfileId(daughterId); // persisted as the active profile
    await settleStores();
    mockSchedule.mockClear();

    let scheduledIds: string[] = [];
    await jest.isolateModulesAsync(async () => {
      require('../../../App'); // importing the app runs its launch-time hydration + reminder sync
      const notifications = require('../../services/pregnancyNotifications');
      for (let index = 0; index < 200; index += 1) {
        await Promise.resolve();
      }
      scheduledIds = notifications.scheduleLocalNotification.mock.calls.map(([input]: [{id: string}]) => input.id);
    });

    expect([...new Set(scheduledIds)].sort()).toEqual(idsOf(daughterId));
  });
});
