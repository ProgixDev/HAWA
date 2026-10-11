import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';

import {deleteManagedProfileCompletely, recoverInterruptedManagedProfileDeletions} from '../managedProfileDeletion';
import {__resetNotificationServiceForTests, scheduleLocalNotification, scheduleReminderSeries} from '../pregnancyNotifications';
import {cancelCycleRemindersForProfile, syncCycleReminders} from '../../utils/cycleReminderScheduling';
import {hydrateCyclePreferences, setCyclePreferences} from '../../state/onboardingPreferences';
import {
  hydrateCycleReminderPreferences,
  resetCycleReminderPreferencesForTests,
  setCycleReminderPreferences,
} from '../../state/cycleReminderPreferences';
import {addManagedProfile, getManagedProfiles, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, getActiveProfileId, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {seedManagedProfileCycleIfNeeded} from '../../state/managedProfileCycleSeed';
import {
  deliverTrigger,
  displayedIds,
  fakeNotifeeState,
  resetFakeNotifee,
  scheduledIds,
} from '../../testUtils/fakeNotifee';

// Deleting a daughter must take away every reminder that was HERS — the pending triggers AND the copies already in the
// notification shade, which carry her first name — and nothing of anyone else's. The real notification chokepoint runs
// over a stateful fake notifee (see testUtils/fakeNotifee.ts), so the assertions are about what Android would hold,
// not about which function was called. Two daughters and the owner, synthetic data only.
//
// What this proves is AWA's JavaScript. It cannot prove how a real phone behaves (Doze, OEM task killers).
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);

const ALL_ON = {
  upcomingPeriodEnabled: true,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: true,
  dailyJournalEnabled: true,
  dailyJournalTime: '21:30',
  fertileWindowEnabled: true,
  ovulationEnabled: true,
};
const BASES = [
  'cycle-upcoming-period-reminder',
  'cycle-period-start-check-reminder',
  'cycle-daily-journal-reminder',
  'cycle-fertile-window-reminder',
  'cycle-ovulation-reminder',
] as const;
const idsOf = (profileId: string) => BASES.map(base => `${base}:${profileId}`).sort();
const JOURNAL = (profileId: string) => `cycle-daily-journal-reminder:${profileId}`;
const OVULATION = (profileId: string) => `cycle-ovulation-reminder:${profileId}`;

const NOOR = 'noor';
const NOOR_2 = 'noor2'; // her id is the BEGINNING of this one: a naive prefix match would reach it
const LEILA = 'leila';

const keysOf = async (profileId: string) => (await AsyncStorage.getAllKeys()).filter(key => key.endsWith(`:profile:${profileId}`));
const snapshotOf = (...ids: string[]) =>
  ids.map(id => {
    const record = fakeNotifeeState.triggers.get(id);
    return [id, record ? `${record.trigger.timestamp}|${record.notification.title}|${record.notification.body}` : null] as const;
  });
/** An id (or a series member `<id>::n`) that belongs to exactly this profile — never a prefix match. */
const mine = (id: string, profileId: string) => id.endsWith(`:${profileId}`) || id.includes(`:${profileId}::`);

const storage = AsyncStorage as unknown as {setItem: jest.Mock; removeItem: jest.Mock; getAllKeys: jest.Mock};

/** A daughter with her own cycle and every reminder on, scheduled by the real Cycle scheduler. */
const makeDaughter = async (id: string, firstName: string, lastPeriodDate: string) => {
  const profile = await addManagedProfile({
    id,
    type: 'daughter',
    firstName,
    birthDate: '2014-05-01',
    hasHadFirstPeriod: true,
    lastPeriodDate,
    periodLength: 5,
    cycleLength: 28,
    regularity: 'yes',
  });
  await setActiveProfileId(profile.id);
  await hydrateCyclePreferences();
  await hydrateCycleReminderPreferences();
  await seedManagedProfileCycleIfNeeded(profile.id);
  await setCycleReminderPreferences({...ALL_ON});
  await syncCycleReminders();
  return profile;
};

/** Android fires two of her reminders: one repeating (still re-armed afterwards) and one one-shot (consumed). */
const deliverTwo = (profileId: string) => {
  deliverTrigger(JOURNAL(profileId));
  deliverTrigger(OVULATION(profileId));
};

beforeEach(async () => {
  jest.useFakeTimers({now: new Date(2026, 9, 1, 12, 0, 0)});
  await AsyncStorage.clear();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  resetCycleReminderPreferencesForTests();
  await hydrateCyclePreferences();
  await hydrateCycleReminderPreferences();

  // The owner: a confirmed 28-day cycle (Sep 10 → next period Oct 8) and every reminder on.
  setCyclePreferences({lastPeriodStart: new Date(2026, 8, 10, 12), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
  await setCycleReminderPreferences({...ALL_ON});
  await syncCycleReminders();

  await makeDaughter(NOOR, 'Noor', '2026-09-12');
  await makeDaughter(NOOR_2, 'Noora', '2026-09-13');
  await makeDaughter(LEILA, 'Leila', '2026-09-15');

  await setActiveProfileId(OWNER_PROFILE_ID);
  await hydrateCyclePreferences();
  await hydrateCycleReminderPreferences();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('fixture sanity', () => {
  it('every profile owns its five scheduled reminders, under its own ids', () => {
    expect(scheduledIds()).toEqual([...idsOf(OWNER_PROFILE_ID), ...idsOf(NOOR), ...idsOf(NOOR_2), ...idsOf(LEILA)].sort());
    expect(getManagedProfiles().map(profile => profile.id).sort()).toEqual([LEILA, NOOR, NOOR_2].sort());
  });
});

describe('deleting one daughter', () => {
  it('cancels her five pending reminders AND removes her delivered copies; everyone else keeps theirs, pending and shown', async () => {
    [OWNER_PROFILE_ID, NOOR, NOOR_2, LEILA].forEach(deliverTwo);
    const others = [OWNER_PROFILE_ID, NOOR_2, LEILA];
    const othersPendingBefore = snapshotOf(...others.flatMap(idsOf));
    const othersShownBefore = displayedIds().filter(id => !mine(id, NOOR));
    // Hers: the repeating journal reminder is both pending (re-armed) and shown; the ovulation one is shown only.
    expect(scheduledIds().filter(id => mine(id, NOOR))).toContain(JOURNAL(NOOR));
    expect(displayedIds().filter(id => mine(id, NOOR))).toEqual([JOURNAL(NOOR), OVULATION(NOOR)].sort());

    const result = await deleteManagedProfileCompletely(NOOR);

    expect(result).toMatchObject({deleted: true, failedSteps: []});
    expect(scheduledIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(displayedIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(snapshotOf(...others.flatMap(idsOf))).toEqual(othersPendingBefore);
    expect(displayedIds().filter(id => !mine(id, NOOR))).toEqual(othersShownBefore);
    expect(othersShownBefore.length).toBe(6);
  });

  it('only her ids were ever handed to a native cancel — never the whole-app cancel', async () => {
    [OWNER_PROFILE_ID, NOOR, LEILA].forEach(deliverTwo);

    await deleteManagedProfileCompletely(NOOR);

    const handed = [
      ...(notifee.cancelTriggerNotification as jest.Mock).mock.calls.map(([id]) => id as string),
      ...(notifee.cancelDisplayedNotification as jest.Mock).mock.calls.map(([id]) => id as string),
      ...(notifee.cancelTriggerNotifications as jest.Mock).mock.calls.flatMap(([ids]) => ids as string[]),
      ...(notifee.cancelDisplayedNotifications as jest.Mock).mock.calls.flatMap(([ids]) => ids as string[]),
    ];
    expect(handed.length).toBeGreaterThan(0);
    handed.forEach(id => expect(mine(id, NOOR)).toBe(true));
    expect(notifee.cancelAllNotifications).not.toHaveBeenCalled();
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
  });

  it('her reminder ids share a beginning with another profile\'s: that profile\'s series members and shown copies are untouched', async () => {
    const day = (offset: number) => new Date(2026, 9, 1 + offset, 21, 30);
    // Each of the two has its journal reminder expressed as a series (base + ::1 + ::2), as the chokepoint supports.
    await scheduleReminderSeries({id: JOURNAL(NOOR), title: 'Noor', body: 'journal', occurrences: [day(1), day(2), day(3)]});
    await scheduleReminderSeries({id: JOURNAL(NOOR_2), title: 'Noora', body: 'journal', occurrences: [day(1), day(2), day(3)]});
    deliverTrigger(`${JOURNAL(NOOR)}::1`);
    deliverTrigger(`${JOURNAL(NOOR_2)}::1`);
    expect(scheduledIds()).toEqual(expect.arrayContaining([`${JOURNAL(NOOR)}::2`, `${JOURNAL(NOOR_2)}::2`]));

    await deleteManagedProfileCompletely(NOOR);

    expect(scheduledIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(displayedIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(scheduledIds()).toEqual(expect.arrayContaining([JOURNAL(NOOR_2), `${JOURNAL(NOOR_2)}::2`]));
    expect(displayedIds()).toEqual([`${JOURNAL(NOOR_2)}::1`]);
    expect(idsOf(NOOR_2).every(id => scheduledIds().includes(id))).toBe(true);
  });

  it('the owner\'s and the other daughters\' stored data are untouched as well (only the profile list and the deletion note change)', async () => {
    const everything = async () =>
      Object.fromEntries(
        await Promise.all((await AsyncStorage.getAllKeys()).sort().map(async key => [key, await AsyncStorage.getItem(key)] as const)),
      );
    const before = await everything();

    await deleteManagedProfileCompletely(NOOR);
    const after = await everything();

    const changed = Object.keys({...before, ...after}).filter(key => before[key] !== after[key]);
    const herKeys = Object.keys(before).filter(key => key.endsWith(`:profile:${NOOR}`));
    expect(herKeys.length).toBeGreaterThan(0);
    expect(changed.filter(key => !herKeys.includes(key)).sort()).toEqual(
      [
        '@hawa/deleted-managed-profile-ids/v1', // the deletion note, written first
        '@hawa/managed-profiles/v1', // her record leaves the list
      ].sort(),
    );
    expect(await keysOf(NOOR)).toEqual([]);
    expect(getManagedProfiles().map(profile => profile.id).sort()).toEqual([LEILA, NOOR_2].sort());
  });

  it('the owner\'s other objectives\' reminders (Nifas, Pregnancy, Qadaa…) are not hers and are never touched', async () => {
    const owned = [
      {id: 'postpartum-nifas-warning', repeat: undefined},
      {id: 'postpartum-nifas-reference', repeat: undefined},
      {id: 'pregnancy-weekly-update', repeat: 'weekly' as const},
      {id: 'qadaa-post-ramadan-reminder', repeat: undefined},
    ];
    for (const reminder of owned) {
      await scheduleLocalNotification({
        id: reminder.id,
        title: 'Synthetic owner reminder',
        body: 'Synthetic',
        fireDate: new Date(2026, 9, 20, 9, 0),
        repeatFrequency: reminder.repeat,
      });
    }
    deliverTrigger('pregnancy-weekly-update');
    const before = snapshotOf(...owned.map(item => item.id));
    const shownBefore = displayedIds().filter(id => !mine(id, NOOR));

    await deleteManagedProfileCompletely(NOOR);

    expect(snapshotOf(...owned.map(item => item.id))).toEqual(before);
    expect(displayedIds().filter(id => !mine(id, NOOR))).toEqual(shownBefore);
    expect(displayedIds()).toContain('pregnancy-weekly-update');
  });

  it('a daughter with no reminder at all is deleted without touching anyone\'s', async () => {
    await setActiveProfileId(NOOR);
    await hydrateCycleReminderPreferences();
    await setCycleReminderPreferences({...ALL_ON, upcomingPeriodEnabled: false, periodStartCheckEnabled: false, dailyJournalEnabled: false, fertileWindowEnabled: false, ovulationEnabled: false});
    await syncCycleReminders(); // her five are cancelled by her own sync
    await setActiveProfileId(OWNER_PROFILE_ID);
    expect(scheduledIds().filter(id => mine(id, NOOR))).toEqual([]);
    const others = snapshotOf(...[OWNER_PROFILE_ID, NOOR_2, LEILA].flatMap(idsOf));

    const result = await deleteManagedProfileCompletely(NOOR);

    expect(result).toMatchObject({deleted: true, failedSteps: []});
    expect(snapshotOf(...[OWNER_PROFILE_ID, NOOR_2, LEILA].flatMap(idsOf))).toEqual(others);
  });
});

describe('a native failure while cancelling', () => {
  it('is reported (the profile is kept), nothing of anyone else is touched, and a retry completes the job', async () => {
    deliverTwo(NOOR);
    deliverTwo(LEILA);
    const leilaBefore = snapshotOf(...idsOf(LEILA));
    const leilaShown = displayedIds().filter(id => mine(id, LEILA));
    const cancelTrigger = notifee.cancelTriggerNotification as jest.Mock;
    const realCancel = cancelTrigger.getMockImplementation() as (id: string) => Promise<void>;
    cancelTrigger.mockImplementation(() => Promise.reject(new Error('native boom'))); // the native layer is failing

    const failed = await deleteManagedProfileCompletely(NOOR);
    cancelTrigger.mockImplementation(realCancel);

    expect(failed.deleted).toBe(false);
    expect(failed.failedSteps).toEqual(expect.arrayContaining(['cancel-reminders', 'cancel-reminders-final']));
    expect(getManagedProfiles().map(profile => profile.id)).toContain(NOOR); // kept, so it can be retried
    expect(scheduledIds().filter(id => mine(id, NOOR)).length).toBeGreaterThan(0); // known to be left over
    expect(snapshotOf(...idsOf(LEILA))).toEqual(leilaBefore);
    expect(displayedIds().filter(id => mine(id, LEILA))).toEqual(leilaShown);

    const retried = await deleteManagedProfileCompletely(NOOR);

    expect(retried).toMatchObject({deleted: true, failedSteps: []});
    expect(scheduledIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(displayedIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(snapshotOf(...idsOf(LEILA))).toEqual(leilaBefore);
  });

  it('a one-off failure is still reported, yet the final pass leaves none of her reminders behind', async () => {
    (notifee.cancelTriggerNotification as jest.Mock).mockRejectedValueOnce(new Error('native boom'));

    const result = await deleteManagedProfileCompletely(NOOR);

    expect(result.deleted).toBe(false);
    expect(result.failedSteps).toContain('cancel-reminders');
    expect(scheduledIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(idsOf(LEILA).every(id => scheduledIds().includes(id))).toBe(true);
  });

  it('cancelCycleRemindersForProfile itself throws rather than hiding it, and touches only her ids', async () => {
    (notifee.cancelDisplayedNotification as jest.Mock).mockRejectedValueOnce(new Error('native boom'));
    deliverTwo(NOOR);

    await expect(cancelCycleRemindersForProfile(NOOR)).rejects.toThrow();
    expect(idsOf(OWNER_PROFILE_ID).every(id => scheduledIds().includes(id))).toBe(true);
    expect(idsOf(LEILA).every(id => scheduledIds().includes(id))).toBe(true);

    await expect(cancelCycleRemindersForProfile(NOOR)).resolves.toBeUndefined();
    expect(scheduledIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(displayedIds().filter(id => mine(id, NOOR))).toEqual([]);
  });
});

describe('interrupted deletion and restart recovery', () => {
  const REMINDER_PREFERENCES = `@hawa/cycle-reminder-preferences/v1:profile:${NOOR}`;

  it('a deletion that stopped half-way is finished at the next launch, and what was re-created for her meanwhile goes too', async () => {
    deliverTwo(NOOR);
    deliverTwo(LEILA);
    const leilaBefore = snapshotOf(...idsOf(LEILA));
    const realRemove = storage.removeItem.getMockImplementation() as (key: string) => Promise<void>;
    // The removal of one of her records fails (storage error / the app is killed right there).
    storage.removeItem.mockImplementation((key: string) => (key === REMINDER_PREFERENCES ? Promise.reject(new Error('killed')) : realRemove(key)));

    const interrupted = await deleteManagedProfileCompletely(NOOR);
    storage.removeItem.mockImplementation(realRemove);

    expect(interrupted.deleted).toBe(false);
    expect(getManagedProfiles().map(profile => profile.id)).toContain(NOOR); // half-deleted, still listed
    expect(scheduledIds().filter(id => mine(id, NOOR))).toEqual([]); // the reminders were cancelled before the data

    // Next launch: the app's own synchronization runs for the profile that is active — hers, while she still exists
    // and her reminder preferences are still on disk — and puts one of her reminders back.
    await setActiveProfileId(NOOR);
    await hydrateCyclePreferences();
    await hydrateCycleReminderPreferences();
    await syncCycleReminders();
    expect(scheduledIds().filter(id => mine(id, NOOR)).length).toBeGreaterThan(0);

    const completed = await recoverInterruptedManagedProfileDeletions();

    expect(completed).toEqual([NOOR]);
    expect(scheduledIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(displayedIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(await keysOf(NOOR)).toEqual([]);
    expect(getActiveProfileId()).toBe(OWNER_PROFILE_ID);
    expect(snapshotOf(...idsOf(LEILA))).toEqual(leilaBefore);
    expect(idsOf(OWNER_PROFILE_ID).every(id => scheduledIds().includes(id))).toBe(true);
  });

  it('deleting twice is harmless to everyone else', async () => {
    await deleteManagedProfileCompletely(NOOR);
    const after = snapshotOf(...[OWNER_PROFILE_ID, NOOR_2, LEILA].flatMap(idsOf));

    const again = await deleteManagedProfileCompletely(NOOR);

    expect(again).toMatchObject({deleted: true, failedSteps: []});
    expect(snapshotOf(...[OWNER_PROFILE_ID, NOOR_2, LEILA].flatMap(idsOf))).toEqual(after);
  });

  it('the owner can never be deleted through this path, and nothing is cancelled for the attempt', async () => {
    const before = scheduledIds();

    const result = await deleteManagedProfileCompletely(OWNER_PROFILE_ID);

    expect(result).toMatchObject({deleted: false, failedSteps: ['not-a-managed-profile']});
    expect(scheduledIds()).toEqual(before);
    expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled();
  });
});

describe('she becomes the active profile again while her deletion runs', () => {
  it('nothing of hers is left pending even if a synchronization for her ran after the cancel and before the removal', async () => {
    // The user taps her profile in "Gérer les profils" while the deletion is running. That is the one moment her data
    // is still on disk AFTER the reminders were cancelled: a synchronization run for her then derives them again.
    const realGetAllKeys = storage.getAllKeys.getMockImplementation() as () => Promise<string[]>;
    let reactivated = false;
    storage.getAllKeys.mockImplementation(async () => {
      if (!reactivated) {
        reactivated = true;
        await setActiveProfileId(NOOR);
        await hydrateCyclePreferences();
        await hydrateCycleReminderPreferences();
        await syncCycleReminders();
      }
      return realGetAllKeys();
    });

    const result = await deleteManagedProfileCompletely(NOOR);
    storage.getAllKeys.mockImplementation(realGetAllKeys);

    expect(reactivated).toBe(true);
    expect(result).toMatchObject({deleted: true, failedSteps: []});
    expect(getActiveProfileId()).toBe(OWNER_PROFILE_ID); // she is not left behind as a ghost "active" profile
    expect(scheduledIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(displayedIds().filter(id => mine(id, NOOR))).toEqual([]);
    expect(idsOf(OWNER_PROFILE_ID).every(id => scheduledIds().includes(id))).toBe(true);
    expect(idsOf(LEILA).every(id => scheduledIds().includes(id))).toBe(true);
  });
});
