import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {STRUCTURED_KEY_SERVICE} from '../../services/structuredEncryption';
import {isRamadan} from '../hijriCalendar';

// THE CONTRACT BETWEEN THE OWNER GATE AND ITS THREE SCHEDULERS (audit finding F10).
//
// loadOwnerProfileData() decides "the owner is still active" in ONE microtask; the scheduler that awaited it resumes
// in a LATER one, and a profile switch can run in between. The gate therefore hands back isCurrent(), which the
// scheduler must call right after its await — in the tick in which it then reads the stores. A real switch cannot be
// placed in that gap deterministically (it depends on microtask depth, and differs with encryption on), so the gate is
// replaced here by one that answers "no longer current" at exactly that point, and the schedulers must change
// NOTHING: no read of the records, no schedule, no cancel, no snapshot write.
// (isCurrent() itself is proven in ownerReminderGate.test.ts; the real wiring in reminderProfileIsolation.test.ts.)
//
// Real stores + a spied notification chokepoint. Synthetic data only.

jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(async () => true),
  cancelLocalNotification: jest.fn(async () => true),
  getPendingReminderIds: jest.fn(async () => new Set<string>()),
}));

const mockGate = {current: true};
jest.mock('../ownerReminderGate', () => ({
  loadOwnerProfileData: jest.fn(async (load: () => Promise<unknown>) => {
    const value = await load();
    return {value, isCurrent: () => mockGate.current};
  }),
}));

const NOW = (() => {
  for (let offset = 0; offset < 40; offset += 1) {
    const candidate = new Date(2025, 1, 15 + offset);
    if (isRamadan(candidate) && !isRamadan(new Date(2025, 1, 14 + offset))) {
      return new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + 5, 10, 0, 0);
    }
  }
  throw new Error('Ramadan start not found');
})();
const daysFromNow = (days: number, hour = 12) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + days, hour, 0, 0, 0);
const isoDay = (date: Date) => date.toLocaleDateString('en-CA');

const M = {
  notifications: () => require('../../services/pregnancyNotifications') as typeof import('../../services/pregnancyNotifications'),
  secure: () => require('../../services/secureAsyncStorage') as typeof import('../../services/secureAsyncStorage'),
  onboarding: () => require('../../state/onboardingPreferences') as typeof import('../../state/onboardingPreferences'),
  confirmed: () => require('../../state/confirmedPeriodHistoryStore') as typeof import('../../state/confirmedPeriodHistoryStore'),
  ledger: () => require('../../state/qadaaLedgerStore') as typeof import('../../state/qadaaLedgerStore'),
  qadaaState: () => require('../../state/qadaaReminderNotificationStore') as typeof import('../../state/qadaaReminderNotificationStore'),
  conception: () => require('../../state/conceptionPreferences') as typeof import('../../state/conceptionPreferences'),
  irregularPrefs: () => require('../../state/irregularPreferences') as typeof import('../../state/irregularPreferences'),
  ttc: () => require('../conceptionReminderScheduling') as typeof import('../conceptionReminderScheduling'),
  sopk: () => require('../irregularReminderScheduling') as typeof import('../irregularReminderScheduling'),
  qadaa: () => require('../qadaaReminderScheduling') as typeof import('../qadaaReminderScheduling'),
};

jest.setTimeout(60_000);

const settle = async () => {
  for (let index = 0; index < 40; index += 1) {
    await new Promise<void>(resolve => setImmediate(resolve));
  }
};

const nativeCalls = () => {
  const notifications = M.notifications();
  return {
    scheduled: (notifications.scheduleLocalNotification as jest.Mock).mock.calls.length,
    cancelled: (notifications.cancelLocalNotification as jest.Mock).mock.calls.length,
  };
};

beforeAll(() => {
  jest.useFakeTimers({now: NOW, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask']});
});

afterAll(() => {
  jest.useRealTimers();
  jest.resetModules();
});

beforeEach(async () => {
  mockGate.current = true;
  await AsyncStorage.clear();
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  jest.resetModules();
  M.secure().resetStructuredStorageForTests();
});

describe('TTC', () => {
  async function seed() {
    await M.onboarding().setActiveObjective('conceive');
    await M.onboarding().hydrateCyclePreferences();
    await M.onboarding().setCyclePreferences({lastPeriodStart: daysFromNow(-6), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    await M.conception().setConceptionPreferences({
      reminders: {fertile_window: true, estimated_ovulation: true, temperature: true, lh_test: true, daily_journal: true},
    });
    await settle();
  }

  it('current: derives and schedules (the premise of the next test)', async () => {
    await seed();
    await M.ttc().syncConceptionReminders();
    expect(nativeCalls().scheduled).toBe(5);
  });

  it('no longer current when the scheduler resumes: nothing is read, scheduled or cancelled', async () => {
    await seed();
    mockGate.current = false;

    await M.ttc().syncConceptionReminders();

    expect(nativeCalls()).toEqual({scheduled: 0, cancelled: 0});
  });
});

describe('SOPK', () => {
  async function seed() {
    await M.onboarding().setActiveObjective('irregular');
    await M.confirmed().hydrateConfirmedPeriodHistory();
    await M.irregularPrefs().setIrregularPreferences({
      cyclePattern: 'irregular',
      lastPeriodDate: isoDay(daysFromNow(-30)),
      trackedItems: [],
      reminders: {dailyJournalEnabled: true, dailyJournalTime: '20:10', unrecordedPeriodEnabled: true},
    });
    await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-90), daysFromNow(-86));
    await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-60), daysFromNow(-56));
    await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-30), daysFromNow(-26));
    await settle();
  }

  it('current: derives and schedules (the premise of the next test)', async () => {
    await seed();
    await M.sopk().syncIrregularReminders();
    expect(nativeCalls().scheduled).toBe(2);
  });

  it('no longer current when the scheduler resumes: nothing is read, scheduled or cancelled', async () => {
    await seed();
    mockGate.current = false;

    await M.sopk().syncIrregularReminders();

    expect(nativeCalls()).toEqual({scheduled: 0, cancelled: 0});
  });

});

describe('Qadaa', () => {
  async function seed() {
    M.onboarding().setSpiritualMarkersEnabled(true);
    await M.ledger().hydrateQadaaLedger();
    await M.ledger().addManualQadaaEntry({quantity: 3, year: 2016, yearSystem: 'gregorian'});
    await settle();
  }

  it('current: derives, schedules and records the snapshot (the premise of the next tests)', async () => {
    await seed();
    await M.qadaa().syncQadaaReminderNotification();
    expect(nativeCalls().scheduled).toBe(1);
    expect(M.qadaaState().getQadaaReminderNotificationState().scheduled).toBe(true);
  });

  it('no longer current when the scheduler resumes: no schedule, no cancel, no snapshot write', async () => {
    await seed();
    mockGate.current = false;

    await M.qadaa().syncQadaaReminderNotification();
    await M.qadaa().forceSyncQadaaReminderNotification();

    expect(nativeCalls()).toEqual({scheduled: 0, cancelled: 0});
    expect(M.qadaaState().getQadaaReminderNotificationState().scheduled).toBe(false);
  });

  it('no longer current — even when she owes nothing any more (the "clear" branch must not run either)', async () => {
    await seed();
    await M.qadaa().syncQadaaReminderNotification();
    await M.ledger().recordQadaaCompletion({quantity: 3, maxQuantity: 3}); // nothing owed: a current run would cancel
    (M.notifications().cancelLocalNotification as jest.Mock).mockClear();
    mockGate.current = false;

    await M.qadaa().syncQadaaReminderNotification();

    expect(nativeCalls().cancelled).toBe(0);
    expect(M.qadaaState().getQadaaReminderNotificationState().scheduled).toBe(true); // snapshot untouched
  });
});
