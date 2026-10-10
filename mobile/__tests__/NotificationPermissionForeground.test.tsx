import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {AppState} from 'react-native';

import {__resetNotificationServiceForTests} from '../src/services/pregnancyNotifications';
import {setActiveObjective} from '../src/state/onboardingPreferences';
import {setPregnancyDating} from '../src/state/pregnancyPreferences';
import {setPregnancyNotificationSettings} from '../src/state/pregnancyNotificationSettingsStore';
import {savePregnancyMedicalEvent} from '../src/state/pregnancyMedicalEventsStore';
import {fakeNotifeeState, resetFakeNotifee, scheduledIds} from '../src/testUtils/fakeNotifee';

// Notification permission switched on in Android settings while AWA is in the background (Phase 1 repair: F4).
//
// A denial used to be remembered for the whole process, so coming back from Android's settings changed nothing:
// the reminders stayed unscheduled until the app was killed. Now the foreground transition re-reads Android and,
// when notifications have just become allowed, re-schedules every reminder (every objective's sync is an upsert).
// Real App component and a stateful fake notifee. It proves AWA's JavaScript reacts; it does not prove anything
// about what a physical phone's settings screen or battery manager does.
jest.mock('@notifee/react-native', () => require('../src/testUtils/fakeNotifee').notifeeModule);

jest.setTimeout(60_000);

const NOW = new Date();
const tomorrow = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 1);

const settle = async (ms = 1500) => {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    await new Promise<void>(resolve => setTimeout(resolve, 25));
  }
};

beforeEach(async () => {
  await AsyncStorage.clear();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
});

it('turning notifications on in Android settings and coming back schedules the blocked reminders — no restart', async () => {
  // Notifications are OFF when the app starts and the reminders are (re)synced.
  fakeNotifeeState.authorizationStatus = 0;
  await setActiveObjective('pregnancy');
  await setPregnancyDating({method: 'lastPeriod', date: new Date(NOW.getTime() - 70 * 86_400_000).toISOString()});
  await setPregnancyNotificationSettings({
    weeklyUpdateEnabled: false,
    dailyJournalEnabled: false,
    dailyJournalTime: '20:00',
    appointmentsEnabled: true,
    examsEnabled: true,
    defaultAppointmentReminderOffset: '1day',
    defaultExamReminderOffset: '1day',
  });
  await savePregnancyMedicalEvent({
    id: 'fg-1',
    type: 'appointment',
    date: tomorrow.toLocaleDateString('en-CA'),
    time: '23:00',
    title: 'Echographie',
    reminderEnabled: true,
    reminderOffset: '1hour',
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  });

  const listeners: Array<(state: string) => void> = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((type: string, listener: (state: string) => void) => {
    if (type === 'change') {listeners.push(listener);}
    return {remove: jest.fn()};
  }) as never);

  // Starting AWA runs the startup sync (module scope) and mounts App, which registers the foreground listener.
  const App = require('../App').default;
  await act(async () => {
    ReactTestRenderer.create(<App />);
  });
  await settle();
  expect(scheduledIds()).not.toContain('pregnancy-event-fg-1'); // blocked, as expected
  expect(listeners.length).toBeGreaterThan(0);

  // She opens Android settings, allows notifications, returns to AWA: the app becomes active again.
  fakeNotifeeState.authorizationStatus = 1;
  await act(async () => {
    listeners.forEach(listener => listener('active'));
  });
  await settle();

  expect(scheduledIds()).toContain('pregnancy-event-fg-1');
});

it('coming back to the foreground with nothing changed does not reschedule anything', async () => {
  fakeNotifeeState.authorizationStatus = 1;
  await setActiveObjective('cycle');

  const listeners: Array<(state: string) => void> = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((type: string, listener: (state: string) => void) => {
    if (type === 'change') {listeners.push(listener);}
    return {remove: jest.fn()};
  }) as never);

  const App = require('../App').default;
  await act(async () => {
    ReactTestRenderer.create(<App />);
  });
  await settle();
  const callsBefore = (require('@notifee/react-native').default.createTriggerNotification as jest.Mock).mock.calls.length;

  await act(async () => {
    listeners.forEach(listener => listener('active'));
  });
  await settle(500);

  const callsAfter = (require('@notifee/react-native').default.createTriggerNotification as jest.Mock).mock.calls.length;
  expect(callsAfter).toBe(callsBefore);
});
