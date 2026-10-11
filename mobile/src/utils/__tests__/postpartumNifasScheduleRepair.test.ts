import AsyncStorage from '@react-native-async-storage/async-storage';

// Phase 2 repair — F12, Nifas J35 / J40 reminders (postpartumNifasReminderScheduling.ts).
//
// The real stores, the real notification chokepoint and a STATEFUL fake notifee (see testUtils/fakeNotifee.ts), so a
// test can tell "the snapshot says scheduled" from "Android holds a trigger". What this proves is AWA's JavaScript:
// that it hands Android the reminders it should, notices the ones Android no longer has, and never invents a
// delivery. It does not prove that a phone delivers anything (Doze, OEM task killers and AlarmManager timing are not
// modelled).
//
// Every test boots a fresh module graph (jest.resetModules) over an emptied storage, exactly like a cold start; a
// restart that keeps Android's own triggers copies them across explicitly.
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);

const NOW = new Date(2026, 9, 10, 12, 0, 0); // Sat 10 Oct 2026, 12:00 local
// Delivery on 5 Oct = day 1. J35 = 8 Nov 09:00, J40 = 13 Nov 09:00 (both still ahead of NOW).
const DELIVERY = '2026-10-05';
const WARNING_ID = 'postpartum-nifas-warning';
const REFERENCE_ID = 'postpartum-nifas-reference';

const at = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};
/** The 09:00 local instant of day `day` for a delivery on `iso` (day 1 = the delivery day). */
const dayAt9 = (iso: string, day: number) => {
  const [year, month, date] = iso.split('-').map(Number);
  return new Date(year, month - 1, date + day - 1, 9, 0, 0, 0);
};
const J35 = dayAt9(DELIVERY, 35);
const J40 = dayAt9(DELIVERY, 40);

type Modules = {
  nifas: typeof import('../postpartumNifasReminderScheduling');
  nifasState: typeof import('../../state/postpartumNifasReminderStore');
  onboarding: typeof import('../../state/onboardingPreferences');
  preferences: typeof import('../../state/postpartumPreferences');
  lochia: typeof import('../../state/postpartumLochiaStore');
  security: typeof import('../../state/securityPreferences');
  secure: typeof import('../../services/secureAsyncStorage');
  fake: typeof import('../../testUtils/fakeNotifee');
  notifee: any;
};

let m: Modules;

const boot = (): Modules => {
  jest.resetModules();
  return {
    nifas: require('../postpartumNifasReminderScheduling'),
    nifasState: require('../../state/postpartumNifasReminderStore'),
    onboarding: require('../../state/onboardingPreferences'),
    preferences: require('../../state/postpartumPreferences'),
    lochia: require('../../state/postpartumLochiaStore'),
    security: require('../../state/securityPreferences'),
    secure: require('../../services/secureAsyncStorage'),
    fake: require('../../testUtils/fakeNotifee'),
    notifee: require('@notifee/react-native').default,
  };
};

/** Postpartum active, spiritual markers on, delivery confirmed — nothing scheduled yet. */
const startPostpartum = async (delivery = DELIVERY) => {
  await m.onboarding.setActiveObjective('postpartum');
  m.onboarding.setSpiritualMarkersEnabled(true);
  await m.preferences.confirmDelivery(at(delivery));
};

const persisted = async () => {
  await m.nifasState.hydratePostpartumNifasReminderState();
  return m.nifasState.getPostpartumNifasReminderState();
};
const triggerAt = (id: string) => m.fake.fakeNotifeeState.triggers.get(id)?.trigger.timestamp;
const triggerTitle = (id: string) => m.fake.fakeNotifeeState.triggers.get(id)?.notification.title as string | undefined;
const triggerBody = (id: string) => m.fake.fakeNotifeeState.triggers.get(id)?.notification.body as string | undefined;
const created = () => (m.notifee.createTriggerNotification as jest.Mock).mock.calls.length;
const cardIds = async () =>
  (await AsyncStorage.getAllKeys())
    .filter(key => key.startsWith('@hawa/in-app-notifications/v2/item/postpartum-nifas-'))
    .map(key => key.split('/item/')[1])
    .sort();

let logSpy: jest.SpyInstance;

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined); // the scheduler logs in development builds
  await AsyncStorage.clear();
  m = boot();
});

afterEach(() => {
  jest.useRealTimers();
  logSpy.mockRestore();
});

describe('baseline — scheduling and reuse', () => {
  it('hands Android both reminders at 09:00 on day 35 and day 40 and records that they reached it', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();

    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    expect(triggerAt(WARNING_ID)).toBe(J35.getTime());
    expect(triggerAt(REFERENCE_ID)).toBe(J40.getTime());
    const state = await persisted();
    expect(state).toMatchObject({deliveryDate: DELIVERY, warningScheduled: true, referenceScheduled: true});
  });

  it('a matching snapshot with both triggers present creates nothing again (no duplicate, no churn)', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    expect(created()).toBe(2);

    await m.nifas.syncPostpartumNifasReminders();
    await m.nifas.syncPostpartumNifasReminders();

    expect(created()).toBe(2);
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
  });
});

describe('(a) a first attempt that failed is retried', () => {
  it('notifications off at first, on later (same process): the next ordinary sync schedules them', async () => {
    m.fake.fakeNotifeeState.authorizationStatus = 0; // denied
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();

    expect(m.fake.scheduledIds()).toEqual([]);
    expect(await persisted()).toMatchObject({deliveryDate: DELIVERY, warningScheduled: false, referenceScheduled: false});
    // The record of WHEN they would fire is kept, so the user can be told — but it never counts as "scheduled".
    expect((await persisted()).warningFireAt).toBe(J35.toISOString());

    m.fake.fakeNotifeeState.authorizationStatus = 1; // she turned them on in Android settings and came back
    await m.nifas.syncPostpartumNifasReminders();

    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    expect(await persisted()).toMatchObject({warningScheduled: true, referenceScheduled: true});
  });

  it('a native failure rejects, still records which reminder did not reach Android, and the next sync repairs it', async () => {
    await startPostpartum();
    m.fake.fakeNotifeeState.createTriggerError = new Error('native boom'); // the first create fails, one-shot

    await expect(m.nifas.syncPostpartumNifasReminders()).rejects.toThrow('native boom');

    const afterFailure = await persisted();
    expect([afterFailure.warningScheduled, afterFailure.referenceScheduled].filter(Boolean)).toHaveLength(1);
    expect(m.fake.scheduledIds()).toHaveLength(1);

    await m.nifas.syncPostpartumNifasReminders();
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    expect(await persisted()).toMatchObject({warningScheduled: true, referenceScheduled: true});
  });
});

describe('a forced rebuild that fails natively', () => {
  it('leaves the old trigger pending, says so in the snapshot, and the next ordinary sync still rebuilds it', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    const plainTitle = triggerTitle(WARNING_ID);
    expect(plainTitle).not.toBe('AWA');
    m.security.updatePrivacySecuritySettings({discreetNotifications: true});
    m.fake.fakeNotifeeState.createTriggerError = new Error('native boom'); // the first re-create fails, one-shot

    await expect(m.nifas.forceSyncPostpartumNifasReminders()).rejects.toThrow('native boom');

    // Android still holds BOTH ids — the one that could not be rebuilt carries its old, readable text — and the
    // snapshot no longer claims they are both in order.
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    const titles = [triggerTitle(WARNING_ID), triggerTitle(REFERENCE_ID)];
    expect(titles.filter(title => title === 'AWA')).toHaveLength(1);
    const state = await persisted();
    expect([state.warningScheduled, state.referenceScheduled].filter(Boolean)).toHaveLength(1);

    await m.nifas.syncPostpartumNifasReminders(); // an ordinary sync: no force needed to finish the job

    expect(triggerTitle(WARNING_ID)).toBe('AWA');
    expect(triggerTitle(REFERENCE_ID)).toBe('AWA');
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    expect(await persisted()).toMatchObject({warningScheduled: true, referenceScheduled: true});
  });
});

describe('(b) triggers Android no longer has are restored', () => {
  it('both triggers dropped (phone update, task killer, reboot gap) while the snapshot still matches', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    m.fake.fakeNotifeeState.triggers.clear();
    expect(m.fake.scheduledIds()).toEqual([]);

    await m.nifas.syncPostpartumNifasReminders();

    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    expect(triggerAt(WARNING_ID)).toBe(J35.getTime());
    expect(triggerAt(REFERENCE_ID)).toBe(J40.getTime());
  });

  it('only the reference reminder was dropped: it comes back, and nothing is doubled', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    m.fake.fakeNotifeeState.triggers.delete(REFERENCE_ID);

    await m.nifas.syncPostpartumNifasReminders();

    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    expect(m.fake.fakeNotifeeState.triggers.size).toBe(2);
  });

  it('the pending list cannot be read: that is "cannot confirm", so it re-schedules instead of assuming', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    expect(created()).toBe(2);
    (m.notifee.getTriggerNotificationIds as jest.Mock).mockRejectedValueOnce(new Error('native read failed'));

    await m.nifas.syncPostpartumNifasReminders();

    expect(created()).toBe(4); // re-created (an upsert by id), never skipped on a guess
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
  });

  it('a restart that keeps Android\'s triggers reuses them; a restart that lost them restores them', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    const survivors = [...m.fake.fakeNotifeeState.triggers.entries()];

    // Process killed and relaunched: memory gone, storage kept, Android's triggers survived.
    m = boot();
    survivors.forEach(([id, record]) => m.fake.fakeNotifeeState.triggers.set(id, record));
    await m.nifas.syncPostpartumNifasReminders();
    expect(created()).toBe(0);
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());

    // Relaunched again, but this time the phone lost its triggers meanwhile.
    m = boot();
    await m.nifas.syncPostpartumNifasReminders();
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    expect(created()).toBe(2);
  });
});

describe('a fire time that has already passed is not "missing"', () => {
  it('J35 had gone by when the delivery date was entered: it is never retried, J40 is scheduled once', async () => {
    const lateDelivery = '2026-09-05'; // J35 = 9 Oct 09:00 (gone), J40 = 14 Oct 09:00 (ahead)
    await startPostpartum(lateDelivery);
    await m.nifas.syncPostpartumNifasReminders();

    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID]);
    expect(await persisted()).toMatchObject({warningScheduled: false, referenceScheduled: true});
    expect(created()).toBe(1);

    await m.nifas.syncPostpartumNifasReminders();
    await m.nifas.syncPostpartumNifasReminders();

    expect(created()).toBe(1); // nothing re-attempted for the one that is past, nothing doubled for the other
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID]);
  });

  it('J35 fired while the app was closed: a later sync leaves it alone, and J40 is still protected', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();

    jest.setSystemTime(new Date(J35.getTime() + 3_600_000)); // 10:00 on day 35
    m.fake.deliverTrigger(WARNING_ID); // Android shows it; the trigger is consumed
    expect(m.fake.displayedIds()).toEqual([WARNING_ID]);
    const before = created();

    await m.nifas.syncPostpartumNifasReminders();

    expect(created()).toBe(before); // J35 is past: not re-created. J40 is present: not touched.
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID]);
    expect(m.fake.displayedIds()).toEqual([WARNING_ID]); // the delivered one stays on screen
  });

  it('J35 fired and J40 vanished: only J40 is restored, and J35 is not re-created (its time is gone)', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    jest.setSystemTime(new Date(J35.getTime() + 3_600_000));
    m.fake.deliverTrigger(WARNING_ID);
    m.fake.fakeNotifeeState.triggers.delete(REFERENCE_ID); // lost to a reboot gap

    await m.nifas.syncPostpartumNifasReminders();

    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID]);
    expect(triggerAt(REFERENCE_ID)).toBe(J40.getTime());
    // J35 stays recorded as having been scheduled (it was), so its in-app card is still owed.
    expect(await persisted()).toMatchObject({warningScheduled: true, referenceScheduled: true});
  });
});

describe('the in-app card is only for a reminder that was really scheduled', () => {
  it('notifications were off the whole time: when J35 and J40 pass, no card announces something that never arrived', async () => {
    m.fake.fakeNotifeeState.authorizationStatus = 0;
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();

    jest.setSystemTime(new Date(J40.getTime() + 86_400_000)); // both are in the past now
    await m.nifas.reconcilePostpartumNifasInAppNotifications();
    await m.nifas.syncPostpartumNifasReminders();

    expect(await cardIds()).toEqual([]);
  });

  it('J35 had already gone when the date was entered: no card for it, while J40 gets its card when it passes', async () => {
    await startPostpartum('2026-09-05'); // J35 gone, J40 = 14 Oct 09:00
    await m.nifas.syncPostpartumNifasReminders();
    await m.nifas.reconcilePostpartumNifasInAppNotifications();
    expect(await cardIds()).toEqual([]); // J35 never scheduled; J40 not yet due

    jest.setSystemTime(new Date(2026, 9, 14, 10, 0, 0));
    m.fake.deliverTrigger(REFERENCE_ID);
    await m.nifas.reconcilePostpartumNifasInAppNotifications();

    const cards = await cardIds();
    expect(cards).toHaveLength(1);
    expect(cards[0].startsWith('postpartum-nifas-reference:')).toBe(true);
  });

  it('a reminder that was scheduled and then passed does get its card (the app was closed when it fired)', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    jest.setSystemTime(new Date(J35.getTime() + 3_600_000));
    m.fake.deliverTrigger(WARNING_ID);

    await m.nifas.reconcilePostpartumNifasInAppNotifications();

    const cards = await cardIds();
    expect(cards).toHaveLength(1);
    expect(cards[0].startsWith('postpartum-nifas-warning:')).toBe(true);
  });
});

describe('(c) a forced re-derivation re-builds what is already scheduled', () => {
  it('re-redacts the text when a privacy setting turned on after the reminders were scheduled', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    const plainTitle = triggerTitle(WARNING_ID);
    const plainBody = triggerBody(WARNING_ID);
    expect(plainTitle).toBeTruthy();
    expect(plainTitle).not.toBe('AWA');

    m.security.updatePrivacySecuritySettings({discreetNotifications: true});

    // The ordinary sync trusts a snapshot that still matches: this is exactly why the forced path exists.
    await m.nifas.syncPostpartumNifasReminders();
    expect(triggerTitle(WARNING_ID)).toBe(plainTitle);

    await m.nifas.forceSyncPostpartumNifasReminders();

    expect(triggerTitle(WARNING_ID)).toBe('AWA');
    expect(triggerTitle(REFERENCE_ID)).toBe('AWA');
    expect(triggerBody(WARNING_ID)).not.toBe(plainBody);
    expect(triggerBody(REFERENCE_ID)).toBe(triggerBody(WARNING_ID)); // the one generic body
    // Same instants, same two ids: rebuilt in place, not added.
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    expect(triggerAt(WARNING_ID)).toBe(J35.getTime());
    expect(triggerAt(REFERENCE_ID)).toBe(J40.getTime());
    expect(await persisted()).toMatchObject({warningScheduled: true, referenceScheduled: true});
  });

  it('works the other way too: privacy turned off again brings the real text back', async () => {
    m.security.updatePrivacySecuritySettings({hideNotificationPreview: true});
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    expect(triggerTitle(WARNING_ID)).toBe('AWA');

    m.security.updatePrivacySecuritySettings({hideNotificationPreview: false});
    await m.nifas.forceSyncPostpartumNifasReminders();

    expect(triggerTitle(WARNING_ID)).not.toBe('AWA');
  });

  it('ignores the snapshot even when everything matches (both reminders are created again), without duplicates', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    expect(created()).toBe(2);

    await m.nifas.forceSyncPostpartumNifasReminders();

    expect(created()).toBe(4);
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
  });

  it('replaces a trigger that sits at the wrong instant (what a timezone change leaves behind), in place', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    // Android holds a trigger for the wrong instant.
    const record = m.fake.fakeNotifeeState.triggers.get(WARNING_ID)!;
    m.fake.fakeNotifeeState.triggers.set(WARNING_ID, {
      notification: record.notification,
      trigger: {...record.trigger, timestamp: J35.getTime() + 5 * 3_600_000},
    });

    await m.nifas.forceSyncPostpartumNifasReminders();

    expect(triggerAt(WARNING_ID)).toBe(J35.getTime());
  });

  it('keeps the same eligibility rules: leaving the objective clears the reminders even when forced', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    expect(m.fake.scheduledIds()).toHaveLength(2);

    await m.onboarding.setActiveObjective('cycle');
    await m.nifas.forceSyncPostpartumNifasReminders();

    expect(m.fake.scheduledIds()).toEqual([]);
    const state = await persisted();
    expect(state).toMatchObject({warningFireAt: null, referenceFireAt: null, warningScheduled: false, referenceScheduled: false});
    expect(state.deliveryDate).toBe(DELIVERY); // the acknowledgement's key is kept, as before
  });

  it('a force after both times have passed does not turn "was scheduled" into "never scheduled"', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    jest.setSystemTime(new Date(J40.getTime() + 3_600_000));
    m.fake.deliverTrigger(WARNING_ID);
    m.fake.deliverTrigger(REFERENCE_ID);

    await m.nifas.forceSyncPostpartumNifasReminders();

    expect(await persisted()).toMatchObject({warningScheduled: true, referenceScheduled: true});
    await m.nifas.reconcilePostpartumNifasInAppNotifications();
    expect(await cardIds()).toHaveLength(2);
  });
});

describe('the shared resync entry point reaches the forced Nifas rebuild', () => {
  it('{force: true} (privacy / language / time zone / permission / restore) rebuilds; the ordinary resync trusts the snapshot', async () => {
    // Required after boot(), from the same module registry, so it drives the very modules the other tests use.
    const {resyncAllReminderNotifications} = require('../../services/reminderResync') as typeof import('../../services/reminderResync');
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    m.security.updatePrivacySecuritySettings({discreetNotifications: true});

    await resyncAllReminderNotifications();
    expect(triggerTitle(WARNING_ID)).not.toBe('AWA');

    await resyncAllReminderNotifications({force: true});

    expect(triggerTitle(WARNING_ID)).toBe('AWA');
    expect(triggerTitle(REFERENCE_ID)).toBe('AWA');
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    expect(triggerAt(WARNING_ID)).toBe(J35.getTime());
  });
});

describe('unreadable records and interruption', () => {
  it('a forced run never rebuilds from records that could not be read: nothing is cancelled, nothing is created', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();
    const before = m.fake.scheduledIds();
    const createdBefore = created();
    const cancelsBefore = (m.notifee.cancelTriggerNotification as jest.Mock).mock.calls.length;

    m.secure.__markUnavailableForTests('@hawa/postpartum-preferences/v1');
    await m.nifas.forceSyncPostpartumNifasReminders();
    await m.nifas.syncPostpartumNifasReminders();

    expect(created()).toBe(createdBefore);
    expect((m.notifee.cancelTriggerNotification as jest.Mock).mock.calls.length).toBe(cancelsBefore);
    expect(m.fake.scheduledIds()).toEqual(before);
  });

  it('a sync that is interrupted between the two creates leaves a state the next run completes', async () => {
    await startPostpartum();
    m.fake.fakeNotifeeState.createTriggerError = new Error('process killed');
    await expect(m.nifas.syncPostpartumNifasReminders()).rejects.toThrow();

    // A cold start afterwards: whatever Android kept is kept, the snapshot is whatever was saved.
    const survivors = [...m.fake.fakeNotifeeState.triggers.entries()];
    m = boot();
    survivors.forEach(([id, record]) => m.fake.fakeNotifeeState.triggers.set(id, record));
    await m.nifas.syncPostpartumNifasReminders();

    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    expect(await persisted()).toMatchObject({warningScheduled: true, referenceScheduled: true});
  });
});

describe('runs never overlap', () => {
  it('a cancel requested after a sync wins: nothing is left scheduled and the snapshot is cleared', async () => {
    await startPostpartum();

    const runs = [
      m.nifas.syncPostpartumNifasReminders(),
      m.nifas.forceSyncPostpartumNifasReminders(),
      m.nifas.cancelPostpartumNifasReminders(),
    ];
    await Promise.all(runs);

    expect(m.fake.scheduledIds()).toEqual([]);
    expect(await persisted()).toMatchObject({warningFireAt: null, referenceFireAt: null});
  });

  it('a sync requested after a cancel wins: the reminders exist and the snapshot is complete', async () => {
    await startPostpartum();
    await m.nifas.syncPostpartumNifasReminders();

    const runs = [m.nifas.cancelPostpartumNifasReminders(), m.nifas.forceSyncPostpartumNifasReminders()];
    await Promise.all(runs);

    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
    expect(await persisted()).toMatchObject({warningScheduled: true, referenceScheduled: true});
  });

  it('a failed run does not wedge the queue', async () => {
    await startPostpartum();
    m.fake.fakeNotifeeState.createTriggerError = new Error('native boom');
    await expect(m.nifas.syncPostpartumNifasReminders()).rejects.toThrow('native boom');

    await expect(m.nifas.syncPostpartumNifasReminders()).resolves.toBeUndefined();
    expect(m.fake.scheduledIds()).toEqual([REFERENCE_ID, WARNING_ID].sort());
  });
});

describe('the entry points keep their public shape', () => {
  it('syncPostpartumNifasReminders takes no argument, so it can be handed straight to subscribers and promise chains', () => {
    expect(m.nifas.syncPostpartumNifasReminders.length).toBe(0);
    expect(m.nifas.forceSyncPostpartumNifasReminders.length).toBe(0);
    expect(m.nifas.cancelPostpartumNifasReminders.length).toBe(0);
  });
});
