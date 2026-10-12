import notifee from '@notifee/react-native';

import {syncContraceptionReminder, getContraceptionReminderScheduleStatus} from '../contraceptionReminderScheduling';
import {
  __resetNotificationServiceForTests,
  dismissDeliveredSeriesMembersBefore,
} from '../../services/pregnancyNotifications';
import {getActiveObjective} from '../../state/onboardingPreferences';
import {getContraceptionPreferences} from '../../state/contraceptionPreferences';
import {
  deliverTrigger,
  displayedIds,
  fakeNotifeeState,
  resetFakeNotifee,
  scheduledIds,
} from '../../testUtils/fakeNotifee';

// Pill reminders are one-shot triggers with one id per day (`<id>`, `<id>::n`). A delivered copy of an EARLIER day used
// to stay in the shade when no re-sync ran between deliveries. The sync now removes just those: displayed copies of the
// reminder's own ids delivered before the start of the current LOCAL day. Pending triggers are never touched.
// JS behaviour only: that Android shows/keeps a notification is not proven here.
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
  hydrateActiveObjective: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../state/contraceptionPreferences', () => ({
  getContraceptionPreferences: jest.fn(),
}));

const ID = 'contraception-daily-reminder';
const at = (dayOffset: number, hours = 20, minutes = 0) => new Date(2026, 9, 10 + dayOffset, hours, minutes, 0, 0);
const keyOf = (dayOffset: number) => new Date(2026, 9, 10 + dayOffset, 12).toLocaleDateString('en-CA');

const preferences = () => ({
  method: 'pill',
  methodStartDate: keyOf(-14), // today = pack day 15 of a 21 + 7 pack
  hasTreatmentBreak: true,
  pillScheduleType: 'cyclic',
  activeDays: 21,
  breakDays: 7,
  remindersEnabled: true,
  reminderTime: '20:00',
});

async function syncAt(now: Date) {
  jest.setSystemTime(now);
  await syncContraceptionReminder();
}

/** Lays the series out on the morning of day 0 and returns its trigger ids in firing order. */
async function layOutSeries(): Promise<string[]> {
  await syncAt(at(0, 8, 0));
  return Array.from(fakeNotifeeState.triggers.entries())
    .sort((a, b) => a[1].trigger.timestamp - b[1].trigger.timestamp)
    .map(([id]) => id);
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(at(0, 8, 0));
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  (getActiveObjective as jest.Mock).mockReturnValue('contraception');
  (getContraceptionPreferences as jest.Mock).mockReturnValue(preferences());
});

afterEach(() => {
  jest.useRealTimers();
});

describe('sync clears the pill reminders delivered on earlier days', () => {
  it('dismisses members delivered on earlier local days, keeps today\'s, and leaves every pending trigger intact', async () => {
    const ids = await layOutSeries();
    // Delivered on day 0, 1 and 2 at 20:00 with no re-sync in between, and day 3's at 20:00.
    deliverTrigger(ids[0], at(0).getTime());
    deliverTrigger(ids[1], at(1).getTime());
    deliverTrigger(ids[2], at(2).getTime());
    deliverTrigger(ids[3], at(3).getTime());
    expect(displayedIds()).toEqual([ids[0], ids[1], ids[2], ids[3]].sort());

    await syncAt(at(3, 21, 0));

    expect(displayedIds()).toEqual([ids[3]]);
  });

  it('keeps the copy delivered today, whatever the hour of the sync (same-day later hour)', async () => {
    const ids = await layOutSeries();
    deliverTrigger(ids[0], at(0, 20, 0).getTime());
    deliverTrigger(ids[1], at(1, 20, 0).getTime());

    await syncAt(at(1, 20, 5));
    expect(displayedIds()).toEqual([ids[1]]);

    await syncAt(at(1, 23, 59));
    expect(displayedIds()).toEqual([ids[1]]);
  });

  it('dismisses yesterday evening\'s copy as soon as the local day has changed', async () => {
    const ids = await layOutSeries();
    deliverTrigger(ids[0], at(0, 23, 59).getTime());

    await syncAt(at(0, 23, 59));
    expect(displayedIds()).toEqual([ids[0]]);

    await syncAt(at(1, 0, 1));
    expect(displayedIds()).toEqual([]);
  });

  it('never touches pending triggers: the whole window is still scheduled after the cleanup', async () => {
    const ids = await layOutSeries();
    deliverTrigger(ids[0], at(0).getTime());
    await syncAt(at(1, 8, 0));

    expect(displayedIds()).toEqual([]);
    // From day 1 morning on, the pending series is the full re-laid window (day 1 + the rest), none cancelled.
    expect(scheduledIds().length).toBeGreaterThanOrEqual(ids.length - 1);
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
    expect(notifee.cancelTriggerNotifications).not.toHaveBeenCalledWith(undefined);
    expect(getContraceptionReminderScheduleStatus()).toBe('scheduled');
  });

  it('leaves unrelated ids, prefix lookalikes, and records with no usable date alone', async () => {
    const ids = await layOutSeries();
    const old = at(-3).getTime();
    const shown = (id: string, date: number | null) => {
      fakeNotifeeState.displayed.set(id, {id});
      fakeNotifeeState.displayedDates.set(id, date);
    };
    shown(`${ID}-extra`, old);
    shown(`${ID}::x`, old);
    shown(`${ID}::`, old);
    shown(`${ID}::1::2`, old);
    shown(`x${ID}`, old);
    shown('pregnancy-custom-1', old);
    shown(`${ID}::9`, null); // no date at all
    deliverTrigger(ids[0], old); // a genuine old member: the only one that goes

    await syncAt(at(1, 8, 0));

    expect(displayedIds()).toEqual(
      [`${ID}-extra`, `${ID}::x`, `${ID}::`, `${ID}::1::2`, `x${ID}`, 'pregnancy-custom-1', `${ID}::9`].sort(),
    );
  });

  it('an unparseable date string is "unknown": kept', async () => {
    await layOutSeries();
    (notifee.getDisplayedNotifications as jest.Mock).mockResolvedValueOnce([
      {id: ID, date: 'not-a-date', notification: {id: ID}},
      {id: `${ID}::2`, date: '', notification: {id: `${ID}::2`}},
    ]);
    await expect(dismissDeliveredSeriesMembersBefore(ID, at(5, 0, 0))).resolves.toBe(0);
    expect(notifee.cancelDisplayedNotifications).not.toHaveBeenCalled();
  });

  it('a notifee failure is contained: the sync still schedules and reports scheduled', async () => {
    const ids = await layOutSeries();
    deliverTrigger(ids[0], at(0).getTime());
    (notifee.getDisplayedNotifications as jest.Mock).mockRejectedValueOnce(new Error('native read failed'));

    await expect(syncAt(at(1, 8, 0))).resolves.toBeUndefined();
    expect(getContraceptionReminderScheduleStatus()).toBe('scheduled');
    expect(displayedIds()).toEqual([ids[0]]);
    expect(scheduledIds().length).toBeGreaterThan(0);

    (notifee.cancelDisplayedNotifications as jest.Mock).mockRejectedValueOnce(new Error('native dismiss failed'));
    await expect(syncAt(at(1, 9, 0))).resolves.toBeUndefined();
    expect(getContraceptionReminderScheduleStatus()).toBe('scheduled');
  });

  it('is not run when scheduling failed (permission denied: nothing is dismissed)', async () => {
    const ids = await layOutSeries();
    deliverTrigger(ids[0], at(0).getTime());
    fakeNotifeeState.authorizationStatus = 0;

    await syncAt(at(1, 8, 0));

    expect(getContraceptionReminderScheduleStatus()).toBe('failed');
    expect(displayedIds()).toEqual([ids[0]]);
  });

  it('is not run when the reminder is switched off (cancel path leaves delivered copies as before)', async () => {
    const ids = await layOutSeries();
    deliverTrigger(ids[0], at(0).getTime());
    (getContraceptionPreferences as jest.Mock).mockReturnValue({...preferences(), remindersEnabled: false});

    await syncAt(at(1, 8, 0));

    expect(displayedIds()).toEqual([ids[0]]);
  });
});

describe('dismissDeliveredSeriesMembersBefore (the cutoff is the start of the local day)', () => {
  const shownAt = (id: string, ms: number) => {
    fakeNotifeeState.displayed.set(id, {id});
    fakeNotifeeState.displayedDates.set(id, ms);
  };

  it('one millisecond before the cutoff goes, the cutoff instant itself stays', async () => {
    const cutoff = at(1, 0, 0);
    shownAt(ID, cutoff.getTime() - 1);
    shownAt(`${ID}::1`, cutoff.getTime());
    shownAt(`${ID}::2`, cutoff.getTime() + 1);

    await expect(dismissDeliveredSeriesMembersBefore(ID, cutoff)).resolves.toBe(1);
    expect(displayedIds()).toEqual([`${ID}::1`, `${ID}::2`]);
  });

  it('works across clock-change days: the cutoff is built from local calendar components, not "- 24 h"', async () => {
    // Every day of the surrounding weeks, including a 23 h and a 25 h day in a DST zone (run with TZ=Europe/Paris or
    // America/New_York to exercise them; valid, if less discriminating, in any zone).
    for (const [month, day] of [[2, 29], [9, 25], [10, 1], [10, 25], [10, 26], [3, 8], [2, 7], [10, 3]]) {
      resetFakeNotifee();
      const startOfDay = new Date(2026, month, day);
      const previousStart = new Date(2026, month, day - 1);
      const lateYesterday = new Date(2026, month, day - 1, 23, 30);
      const todayMorning = new Date(2026, month, day, 6, 30);
      shownAt(`${ID}::1`, previousStart.getTime());
      shownAt(`${ID}::2`, lateYesterday.getTime());
      shownAt(`${ID}::3`, todayMorning.getTime());

      await dismissDeliveredSeriesMembersBefore(ID, startOfDay);
      expect(displayedIds()).toEqual([`${ID}::3`]);
    }
  });

  it('never calls the cancel APIs that would remove pending triggers', async () => {
    fakeNotifeeState.triggers.set(`${ID}::5`, {notification: {id: `${ID}::5`}, trigger: {timestamp: Date.now() + 1000}});
    shownAt(`${ID}::5`, at(-2).getTime());

    await dismissDeliveredSeriesMembersBefore(ID, at(0, 0, 0));

    expect(notifee.cancelDisplayedNotifications).toHaveBeenCalledWith([`${ID}::5`]);
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
    expect(notifee.cancelAllNotifications).not.toHaveBeenCalled();
    expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled();
    expect(notifee.cancelTriggerNotifications).not.toHaveBeenCalled();
    expect(Array.from(fakeNotifeeState.triggers.keys())).toEqual([`${ID}::5`]);
  });

  it('an invalid cutoff dismisses nothing and never throws', async () => {
    shownAt(ID, at(-9).getTime());
    await expect(dismissDeliveredSeriesMembersBefore(ID, new Date(NaN))).resolves.toBe(0);
    expect(displayedIds()).toEqual([ID]);
  });
});
