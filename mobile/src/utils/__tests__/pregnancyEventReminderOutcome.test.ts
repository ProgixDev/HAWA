import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';

import {
  cancelEventReminder,
  computeEventReminderFireDate,
  evaluateEventReminder,
  isEventReminderUndelivered,
  reminderRequestChanged,
  syncEventReminder,
} from '../pregnancyEventReminders';
import {
  resyncAllPregnancyNotifications,
  syncPregnancyNotificationsForActiveObjective,
} from '../pregnancyReminderScheduling';
import * as availability from '../reminderSourceAvailability';
import {__resetNotificationServiceForTests} from '../../services/pregnancyNotifications';
import {
  getPregnancyNotificationSettings,
  setPregnancyNotificationSettings,
  hydratePregnancyNotificationSettings,
} from '../../state/pregnancyNotificationSettingsStore';
import {savePregnancyMedicalEvent, type PregnancyMedicalEvent} from '../../state/pregnancyMedicalEventsStore';
import {setActiveObjective} from '../../state/onboardingPreferences';
import {setPregnancyDating} from '../../state/pregnancyPreferences';
import {
  deliverTrigger,
  displayedIds,
  fakeNotifeeState,
  resetFakeNotifee,
  scheduledIds,
} from '../../testUtils/fakeNotifee';

// Appointment / exam reminder regression tests (Phase 1 repair: F1, F2, F3, F6).
//
// Real stores, the real scheduling code, and a stateful fake notifee. This proves what AWA's JavaScript does and
// tells the UI; it cannot prove that Android delivers a notification on a physical phone.
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
const STAMP = NOW.toISOString();
const dayISO = (offsetDays: number) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + offsetDays).toLocaleDateString('en-CA');
const local = (offsetDays: number, hours: number, minutes = 0) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + offsetDays, hours, minutes, 0, 0);

function event(overrides: Partial<PregnancyMedicalEvent> = {}): PregnancyMedicalEvent {
  return {
    id: 'e1',
    type: 'appointment',
    date: dayISO(2),
    time: '10:00',
    title: 'Echographie',
    reminderEnabled: true,
    reminderOffset: '1day',
    createdAt: STAMP,
    updatedAt: STAMP,
    ...overrides,
  };
}

const ALL_ON = {appointmentsEnabled: true, examsEnabled: true};

const DEFAULT_SETTINGS = {
  weeklyUpdateEnabled: true,
  dailyJournalEnabled: false,
  dailyJournalTime: '20:00',
  appointmentsEnabled: true,
  examsEnabled: true,
  defaultAppointmentReminderOffset: '1day' as const,
  defaultExamReminderOffset: '1day' as const,
};

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  jest.restoreAllMocks();
  await AsyncStorage.clear();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  // The settings store keeps a module-level cache that AsyncStorage.clear() does not touch.
  await setPregnancyNotificationSettings(DEFAULT_SETTINGS);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('evaluateEventReminder — what a reminder request amounts to', () => {
  it('ready: the lead time is subtracted from the appointment time', () => {
    expect(evaluateEventReminder(event({reminderOffset: '1hour'}), ALL_ON, NOW)).toEqual({
      state: 'ready',
      fireDate: local(2, 9, 0),
    });
    expect(evaluateEventReminder(event({reminderOffset: '30min'}), ALL_ON, NOW)).toMatchObject({fireDate: local(2, 9, 30)});
    expect(evaluateEventReminder(event({reminderOffset: '2hours'}), ALL_ON, NOW)).toMatchObject({fireDate: local(2, 8, 0)});
    expect(evaluateEventReminder(event({reminderOffset: '1day'}), ALL_ON, NOW)).toMatchObject({fireDate: local(1, 10, 0)});
  });

  it('custom: the chosen time on the appointment\'s own date', () => {
    expect(
      evaluateEventReminder(event({reminderOffset: 'custom', reminderTime: '07:45'}), ALL_ON, NOW),
    ).toEqual({state: 'ready', fireDate: local(2, 7, 45)});
  });

  it('an appointment without a time is anchored to 09:00 (and the form says so)', () => {
    expect(computeEventReminderFireDate(event({time: undefined, reminderOffset: '1hour'}))).toEqual(local(2, 8, 0));
  });

  it('past: the default "1 day before" for an appointment tomorrow morning has already gone by', () => {
    // Appointment tomorrow 10:00, reminder = today 10:00; it is 20:00 now.
    expect(evaluateEventReminder(event({date: dayISO(1)}), ALL_ON, NOW)).toEqual({
      state: 'past',
      fireDate: local(0, 10, 0),
    });
  });

  it('past: an untimed appointment tomorrow with the default lead time (09:00 − 1 day = today 09:00)', () => {
    expect(evaluateEventReminder(event({date: dayISO(1), time: undefined}), ALL_ON, NOW)).toMatchObject({state: 'past'});
  });

  it('past: the smallest lead time for an appointment less than 30 minutes away', () => {
    expect(
      evaluateEventReminder(event({date: dayISO(0), time: '20:20', reminderOffset: '30min'}), ALL_ON, NOW),
    ).toMatchObject({state: 'past', fireDate: local(0, 19, 50)});
  });

  it('category-disabled: the global switch for that kind of event is off', () => {
    expect(
      evaluateEventReminder(event(), {appointmentsEnabled: false, examsEnabled: true}, NOW),
    ).toMatchObject({state: 'category-disabled'});
    expect(
      evaluateEventReminder(event({type: 'exam'}), {appointmentsEnabled: true, examsEnabled: false}, NOW),
    ).toMatchObject({state: 'category-disabled'});
    // The other kind is unaffected by that switch.
    expect(
      evaluateEventReminder(event({type: 'exam'}), {appointmentsEnabled: false, examsEnabled: true}, NOW),
    ).toMatchObject({state: 'ready'});
  });

  it('off and invalid', () => {
    expect(evaluateEventReminder(event({reminderEnabled: false}), ALL_ON, NOW)).toEqual({state: 'off'});
    expect(evaluateEventReminder(event({reminderOffset: undefined}), ALL_ON, NOW)).toEqual({state: 'off'});
    expect(evaluateEventReminder(event({date: 'not-a-date'}), ALL_ON, NOW)).toEqual({state: 'invalid'});
  });
});

describe('reminderRequestChanged — an old event\'s elapsed reminder is not a new request', () => {
  it('is true for a new event and for any change to the date, time or reminder fields', () => {
    expect(reminderRequestChanged(undefined, event())).toBe(true);
    const saved = event();
    expect(reminderRequestChanged(saved, {...saved, date: dayISO(3)})).toBe(true);
    expect(reminderRequestChanged(saved, {...saved, time: '11:00'})).toBe(true);
    expect(reminderRequestChanged(saved, {...saved, reminderOffset: '1hour'})).toBe(true);
    expect(reminderRequestChanged(saved, {...saved, reminderEnabled: false})).toBe(true);
    expect(reminderRequestChanged(saved, {...saved, reminderOffset: 'custom', reminderTime: '08:00'})).toBe(true);
  });

  it('is false when only notes / title / practitioner changed', () => {
    const saved = event();
    expect(reminderRequestChanged(saved, {...saved, notes: 'bring the file', title: 'Echo 2'})).toBe(false);
  });
});

describe('syncEventReminder — scheduling result is reported, never swallowed (F2, F3)', () => {
  it('scheduled: the trigger is at the computed instant, under the event\'s own id', async () => {
    const outcome = await syncEventReminder(event());

    expect(outcome).toEqual({status: 'scheduled', fireDate: local(1, 10, 0)});
    expect(scheduledIds()).toEqual(['pregnancy-event-e1']);
    expect(fakeNotifeeState.triggers.get('pregnancy-event-e1')?.trigger.timestamp).toBe(local(1, 10, 0).getTime());
    expect(isEventReminderUndelivered(outcome)).toBe(false);
  });

  it('past: reported as "past" with the real time, nothing scheduled', async () => {
    const outcome = await syncEventReminder(event({date: dayISO(1)}));

    expect(outcome).toEqual({status: 'past', fireDate: local(0, 10, 0)});
    expect(scheduledIds()).toEqual([]);
    expect(isEventReminderUndelivered(outcome)).toBe(true);
  });

  it('permission denied: reported, nothing scheduled — and it schedules once notifications are on, same process', async () => {
    fakeNotifeeState.authorizationStatus = 0;
    const denied = await syncEventReminder(event());
    expect(denied).toMatchObject({status: 'permission-denied', fireDate: local(1, 10, 0)});
    expect(scheduledIds()).toEqual([]);

    fakeNotifeeState.authorizationStatus = 1;
    const allowed = await syncEventReminder(event());
    expect(allowed).toMatchObject({status: 'scheduled'});
    expect(scheduledIds()).toEqual(['pregnancy-event-e1']);
  });

  it('category disabled (F6): reported as such, nothing scheduled, a pending one is cancelled — never silently "on"', async () => {
    await syncEventReminder(event());
    expect(scheduledIds()).toEqual(['pregnancy-event-e1']);

    await setPregnancyNotificationSettings({...getPregnancyNotificationSettings(), appointmentsEnabled: false});
    const outcome = await syncEventReminder(event());

    expect(outcome).toMatchObject({status: 'category-disabled', fireDate: local(1, 10, 0)});
    expect(scheduledIds()).toEqual([]);
    expect(isEventReminderUndelivered(outcome)).toBe(true);
  });

  it('category re-enabled: the saved per-event reminder is scheduled again by the next resync (intent preserved)', async () => {
    await setActiveObjective('pregnancy');
    await setPregnancyDating({method: 'lastPeriod', date: local(-70, 12).toISOString()});
    await savePregnancyMedicalEvent(event());
    await setPregnancyNotificationSettings({...getPregnancyNotificationSettings(), appointmentsEnabled: false});
    await resyncAllPregnancyNotifications();
    expect(scheduledIds()).not.toContain('pregnancy-event-e1');

    await setPregnancyNotificationSettings({...getPregnancyNotificationSettings(), appointmentsEnabled: true});
    await resyncAllPregnancyNotifications();

    expect(scheduledIds()).toContain('pregnancy-event-e1');
  });

  it('reminder off: reported as "not requested" and any pending trigger is removed', async () => {
    await syncEventReminder(event());

    const outcome = await syncEventReminder(event({reminderEnabled: false, reminderOffset: undefined}));

    expect(outcome).toEqual({status: 'not-requested'});
    expect(scheduledIds()).toEqual([]);
  });

  it('settings unreadable: reported, and what is already scheduled is left exactly as it is', async () => {
    await syncEventReminder(event());
    jest.spyOn(availability, 'areReminderSourcesUnavailable').mockReturnValue(true);

    const outcome = await syncEventReminder(event({reminderEnabled: false, reminderOffset: undefined}));

    expect(outcome).toEqual({status: 'unavailable'});
    expect(scheduledIds()).toEqual(['pregnancy-event-e1']);
  });

  it('a native failure is returned as "failed" — it never throws out of the sync', async () => {
    fakeNotifeeState.createTriggerError = new Error('native boom');

    const outcome = await syncEventReminder(event());

    expect(outcome).toMatchObject({status: 'failed'});
    expect(isEventReminderUndelivered(outcome)).toBe(true);
  });

  it('reads the REAL category switches when none are handed in (not the never-loaded defaults)', async () => {
    await AsyncStorage.setItem(
      '@hawa/pregnancy-notification-settings',
      JSON.stringify({appointmentsEnabled: false}),
    );
    // A fresh module state would hold defaults (appointmentsEnabled: true); the sync has to hydrate first.
    await hydratePregnancyNotificationSettings();

    await expect(syncEventReminder(event())).resolves.toMatchObject({status: 'category-disabled'});
  });
});

describe('appointment editing and deletion', () => {
  it('editing the time replaces the SAME trigger with the new instant — one trigger, never two', async () => {
    await syncEventReminder(event({time: '10:00', reminderOffset: '1hour'}));
    const before = fakeNotifeeState.triggers.get('pregnancy-event-e1')!.trigger.timestamp;

    await syncEventReminder(event({time: '15:00', reminderOffset: '1hour'}));

    expect(scheduledIds()).toEqual(['pregnancy-event-e1']);
    const after = fakeNotifeeState.triggers.get('pregnancy-event-e1')!.trigger.timestamp;
    expect(before).toBe(local(2, 9, 0).getTime());
    expect(after).toBe(local(2, 14, 0).getTime());
  });

  it('editing a reminder into the past cancels the pending one and says so', async () => {
    await syncEventReminder(event());

    const outcome = await syncEventReminder(event({date: dayISO(0), time: '20:30', reminderOffset: '1hour'}));

    expect(outcome).toMatchObject({status: 'past'});
    expect(scheduledIds()).toEqual([]);
  });

  it('turning the reminder off on an existing event cancels it', async () => {
    await syncEventReminder(event());

    await syncEventReminder(event({reminderEnabled: false, reminderOffset: undefined}));

    expect(scheduledIds()).toEqual([]);
  });

  it('deleting cancels only that event\'s reminder, and (user action) removes its copy from the shade', async () => {
    await syncEventReminder(event({id: 'e1'}));
    await syncEventReminder(event({id: 'e2', title: 'Prise de sang'}));
    jest.setSystemTime(new Date(local(1, 10, 0).getTime() + 1_000));
    deliverTrigger('pregnancy-event-e1');
    expect(displayedIds()).toEqual(['pregnancy-event-e1']);

    await cancelEventReminder('e1', {dismissDisplayed: true});

    expect(displayedIds()).toEqual([]);
    expect(scheduledIds()).toEqual(['pregnancy-event-e2']);
  });

  it('a plain cancel (synchronisation) leaves a delivered reminder on screen', async () => {
    await syncEventReminder(event());
    jest.setSystemTime(new Date(local(1, 10, 0).getTime() + 1_000));
    deliverTrigger('pregnancy-event-e1');

    await cancelEventReminder('e1');

    expect(displayedIds()).toEqual(['pregnancy-event-e1']);
  });
});

describe('app backgrounded / headless synchronization (F1)', () => {
  async function seedPregnancyWithReminder() {
    await setActiveObjective('pregnancy');
    await setPregnancyDating({method: 'lastPeriod', date: local(-70, 12).toISOString()});
    await savePregnancyMedicalEvent(event({date: dayISO(1), time: '23:00', reminderOffset: '1hour'}));
    await resyncAllPregnancyNotifications();
  }

  it('the reminder is delivered, then the startup sync runs (notifee\'s headless start): it stays on screen', async () => {
    await seedPregnancyWithReminder();
    expect(scheduledIds()).toContain('pregnancy-event-e1');
    const fireAt = fakeNotifeeState.triggers.get('pregnancy-event-e1')!.trigger.timestamp as number;

    // Android fires the alarm and shows the reminder...
    jest.setSystemTime(fireAt + 1_000);
    deliverTrigger('pregnancy-event-e1');
    expect(displayedIds()).toContain('pregnancy-event-e1');

    // ...and seconds later the app's JS cold-starts and runs exactly what App.tsx runs at module scope.
    await syncPregnancyNotificationsForActiveObjective();

    expect(displayedIds()).toContain('pregnancy-event-e1');
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
  });

  it('the same holds when the resync runs again and again (every foreground / setting change)', async () => {
    await seedPregnancyWithReminder();
    const fireAt = fakeNotifeeState.triggers.get('pregnancy-event-e1')!.trigger.timestamp as number;
    jest.setSystemTime(fireAt + 1_000);
    deliverTrigger('pregnancy-event-e1');

    await resyncAllPregnancyNotifications();
    await resyncAllPregnancyNotifications();
    await syncPregnancyNotificationsForActiveObjective();

    expect(displayedIds()).toContain('pregnancy-event-e1');
  });

  it('leaving the Pregnancy objective cancels what is PENDING without wiping what was already delivered', async () => {
    await seedPregnancyWithReminder();
    const fireAt = fakeNotifeeState.triggers.get('pregnancy-event-e1')!.trigger.timestamp as number;
    jest.setSystemTime(fireAt + 1_000);
    deliverTrigger('pregnancy-event-e1');

    await setActiveObjective('cycle');
    await syncPregnancyNotificationsForActiveObjective();

    expect(scheduledIds().filter(id => id.startsWith('pregnancy-'))).toEqual([]);
    expect(displayedIds()).toContain('pregnancy-event-e1');
  });
});
