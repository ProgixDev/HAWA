import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {EventType} from '@notifee/react-native';

import {resyncAllPregnancyNotifications} from '../src/utils/pregnancyReminderScheduling';
import {__resetNotificationServiceForTests} from '../src/services/pregnancyNotifications';
import {setActiveObjective} from '../src/state/onboardingPreferences';
import {setPregnancyDating} from '../src/state/pregnancyPreferences';
import {setPregnancyNotificationSettings} from '../src/state/pregnancyNotificationSettingsStore';
import {savePregnancyMedicalEvent} from '../src/state/pregnancyMedicalEventsStore';
import {
  deliverTrigger,
  displayedIds,
  emitBackgroundEvent,
  fakeNotifeeState,
  resetFakeNotifee,
  scheduledIds,
} from '../src/testUtils/fakeNotifee';

// What happens when a reminder fires while AWA's process is DEAD (Phase 1 repair: F1).
//
// Android shows the notification natively, then notifee starts a headless JS task, which loads the app's bundle:
// index.js -> App.tsx, and App.tsx's module scope immediately re-synchronises every reminder. Those syncs used to
// begin by cancelling the notification id with notifee.cancelNotification(), which also removes DISPLAYED
// notifications — so the reminder disappeared seconds after it appeared. This file requires the REAL App module
// (exactly what the headless start does) against a stateful fake notifee and checks the reminder is still there.
//
// Limits: this proves AWA's JavaScript no longer removes it. It does not prove that Android delivers the alarm, that
// an OEM task killer lets the process start, or how long a real cold start takes.
jest.mock('@notifee/react-native', () => require('../src/testUtils/fakeNotifee').notifeeModule);

jest.setTimeout(60_000);

const EVENT_ID = 'pregnancy-event-headless-1';

const NOW = new Date();
const tomorrow = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 1);

const settle = async (ms = 1500) => {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    await new Promise<void>(resolve => setTimeout(resolve, 25));
  }
};

async function seedScheduledAndDeliveredReminder() {
  await setActiveObjective('pregnancy');
  await setPregnancyDating({method: 'lastPeriod', date: new Date(NOW.getTime() - 70 * 86_400_000).toISOString()});
  await setPregnancyNotificationSettings({
    weeklyUpdateEnabled: true,
    dailyJournalEnabled: false,
    dailyJournalTime: '20:00',
    appointmentsEnabled: true,
    examsEnabled: true,
    defaultAppointmentReminderOffset: '1day',
    defaultExamReminderOffset: '1day',
  });
  await savePregnancyMedicalEvent({
    id: 'headless-1',
    type: 'appointment',
    date: tomorrow.toLocaleDateString('en-CA'),
    time: '23:00',
    title: 'Echographie',
    reminderEnabled: true,
    reminderOffset: '1hour',
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  });

  // 1. The reminder was scheduled when she saved the appointment.
  await resyncAllPregnancyNotifications();
  expect(scheduledIds()).toContain(EVENT_ID);

  // 2. Android fired the alarm and notifee put it in the notification shade.
  const delivered = deliverTrigger(EVENT_ID);
  expect(displayedIds()).toContain(EVENT_ID);
  return delivered;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
});

describe('headless start after a delivery', () => {
  it('loading the real App module (the headless start) leaves the delivered reminder on screen', async () => {
    await seedScheduledAndDeliveredReminder();
    (notifee.cancelNotification as jest.Mock).mockClear();

    // 3. The JS bundle starts: exactly what the headless task triggers.
    require('../App');
    await settle();

    expect(displayedIds()).toContain(EVENT_ID);
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
    expect(notifee.cancelDisplayedNotification).not.toHaveBeenCalledWith(EVENT_ID);
  });

  it('the background handler index.js registers records the delivery in the in-app list and removes nothing', async () => {
    const delivered = await seedScheduledAndDeliveredReminder();
    (notifee.cancelNotification as jest.Mock).mockClear();
    (notifee.cancelDisplayedNotification as jest.Mock).mockClear();

    require('../index');
    expect(fakeNotifeeState.backgroundHandler).not.toBeNull();
    await emitBackgroundEvent(EventType.DELIVERED, delivered);
    await settle(300);

    expect(displayedIds()).toContain(EVENT_ID);
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
    expect(notifee.cancelDisplayedNotification).not.toHaveBeenCalled();
    // The delivery was written to the in-app notification history (one item per occurrence id).
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.some(key => key.startsWith(`@hawa/in-app-notifications/v2/item/${EVENT_ID}:`))).toBe(true);
  });

  it('a backgrounded-but-alive app: the delivery event alone never touches the notification shade', async () => {
    const delivered = await seedScheduledAndDeliveredReminder();
    require('../index');
    (notifee.cancelNotification as jest.Mock).mockClear();

    await emitBackgroundEvent(EventType.DELIVERED, delivered);
    await emitBackgroundEvent(EventType.DELIVERED, delivered); // a second event must not change anything either

    expect(displayedIds()).toContain(EVENT_ID);
    expect(notifee.cancelNotification).not.toHaveBeenCalled();
  });
});
