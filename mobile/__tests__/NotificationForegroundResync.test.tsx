import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {AppState} from 'react-native';

import {__resetNotificationServiceForTests} from '../src/services/pregnancyNotifications';
import {setActiveObjective} from '../src/state/onboardingPreferences';
import {updatePrivacySecuritySettings} from '../src/state/securityPreferences';
import {fakeNotifeeState, resetFakeNotifee} from '../src/testUtils/fakeNotifee';
import {resyncAllReminderNotifications} from '../src/services/reminderResync';
import {FOREGROUND_REFRESH_INTERVAL_MS} from '../src/services/reminderForegroundPolicy';
import {
  isBulkReminderResyncSuspended,
  resumeBulkReminderResync,
  suspendBulkReminderResync,
} from '../src/services/reminderResyncGate';

// Phase 2 — F14: what AWA does when she comes back after the phone's time zone / clock changed or after a long time.
//
// Notifee re-arms alarms after a reboot only; it has no receiver for a time-zone change, a clock change or an app
// update. So the only chance to correct them is the next time AWA's own code runs. The real App component is mounted
// and its foreground listener is driven; the resync entry point is a recording wrapper around the real one.
//
// What this proves: that AWA's JavaScript asks for the right kind of resync at the right moment. What it cannot prove:
// that a physical phone delivers the corrected alarms (see the report's UNVERIFIED list).
jest.mock('@notifee/react-native', () => require('../src/testUtils/fakeNotifee').notifeeModule);
jest.mock('../src/services/reminderResync', () => {
  const actual = jest.requireActual('../src/services/reminderResync');
  return {...actual, resyncAllReminderNotifications: jest.fn(actual.resyncAllReminderNotifications)};
});

jest.setTimeout(60_000);

const resync = resyncAllReminderNotifications as jest.Mock;

const settle = async (ms = 600) => {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    await new Promise<void>(resolve => setTimeout(resolve, 25));
  }
};

let clockOffsetMs = 0;
let zoneOffsetMinutes: number | null = null;
const realNow = Date.now.bind(Date);
const realZoneOffset = Date.prototype.getTimezoneOffset;
const listeners: Array<(state: string) => void> = [];

const comeBack = async () => {
  await act(async () => {
    listeners.forEach(listener => listener('active'));
  });
  await settle();
};

beforeAll(async () => {
  jest.spyOn(Date, 'now').mockImplementation(() => realNow() + clockOffsetMs);
  jest.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(function (this: Date) {
    return zoneOffsetMinutes === null ? realZoneOffset.call(this) : zoneOffsetMinutes;
  });
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((type: string, listener: (state: string) => void) => {
    if (type === 'change') {listeners.push(listener);}
    return {remove: jest.fn()};
  }) as never);

  await AsyncStorage.clear();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  fakeNotifeeState.authorizationStatus = 1;
  await setActiveObjective('cycle');

  // Starting AWA: module-scope syncs run, App mounts and registers the foreground listener.
  const App = require('../App').default;
  await act(async () => {
    ReactTestRenderer.create(<App />);
  });
  await settle(1500);
  expect(listeners.length).toBeGreaterThan(0);
});

beforeEach(async () => {
  // A quiet baseline for each scenario: whatever the previous one changed is adopted first.
  clockOffsetMs = 0;
  zoneOffsetMinutes = null;
  await comeBack();
  resync.mockClear();
});

afterAll(() => {
  jest.restoreAllMocks();
});

it('coming back with nothing changed does not resync at all', async () => {
  await comeBack();
  await comeBack();

  expect(resync).not.toHaveBeenCalled();
});

it('a changed time zone while she was away forces ONE full re-derivation, then goes quiet again', async () => {
  zoneOffsetMinutes = (realZoneOffset.call(new Date()) as number) + 360; // she flew somewhere else

  await comeBack();
  expect(resync).toHaveBeenCalledTimes(1);
  expect(resync).toHaveBeenCalledWith({force: true});

  await comeBack();
  expect(resync).toHaveBeenCalledTimes(1);
});

it('a daylight-saving switch (offset changes by an hour, zone unchanged) is treated the same way', async () => {
  zoneOffsetMinutes = (realZoneOffset.call(new Date()) as number) + 60;

  await comeBack();

  expect(resync).toHaveBeenCalledWith({force: true});
});

it('a clock set BACKWARDS forces a re-derivation', async () => {
  clockOffsetMs = -3 * 60 * 60 * 1000;

  await comeBack();

  expect(resync).toHaveBeenCalledWith({force: true});
});

it('a long absence refreshes (top-up of window-based schedules) without forcing the snapshot-based kinds', async () => {
  clockOffsetMs = FOREGROUND_REFRESH_INTERVAL_MS + 60_000;

  await comeBack();

  expect(resync).toHaveBeenCalledTimes(1);
  expect(resync).toHaveBeenCalledWith({force: false});
});

it('a privacy setting change forces a re-derivation (the payload text is baked in at scheduling time)', async () => {
  await act(async () => {
    updatePrivacySecuritySettings({discreetNotifications: true});
  });
  await settle();

  expect(resync).toHaveBeenCalledWith({force: true});
});

it('a failed permission read does not swallow a needed resync', async () => {
  const notifee = require('@notifee/react-native').default;
  zoneOffsetMinutes = (realZoneOffset.call(new Date()) as number) + 120;
  const original = notifee.getNotificationSettings.getMockImplementation?.();
  notifee.getNotificationSettings.mockImplementationOnce(async () => {
    throw new Error('settings unavailable');
  });

  await comeBack();

  expect(resync).toHaveBeenCalledWith({force: true});
  if (original) {notifee.getNotificationSettings.mockImplementation(original);}
});

it('a suspension left by "Delete account" is lifted as soon as an objective is chosen again (App wiring)', async () => {
  suspendBulkReminderResync();
  expect(isBulkReminderResyncSuspended()).toBe(true);

  await act(async () => {
    await setActiveObjective('pregnancy');
  });
  await settle(200);

  expect(isBulkReminderResyncSuspended()).toBe(false);
  await act(async () => {
    await setActiveObjective('cycle');
  });
  resumeBulkReminderResync();
});
