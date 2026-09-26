import notifee from '@notifee/react-native';

import {
  customReminderFireDate,
  nextWeeklyFireDate,
  resyncAllPregnancyNotifications,
  syncCustomReminder,
  syncPregnancyNotificationsForActiveObjective,
} from '../pregnancyReminderScheduling';
import {setActiveObjective} from '../../state/onboardingPreferences';
import {setPregnancyDating} from '../../state/pregnancyPreferences';
import {
  getPregnancyNotificationSettings,
  setPregnancyNotificationSettings,
} from '../../state/pregnancyNotificationSettingsStore';
import {
  getCustomReminders,
  saveCustomReminder,
  type CustomReminder,
} from '../../state/pregnancyCustomRemindersStore';

// M29 (repeating custom reminders whose start has passed) and M30 (dating
// edit -> weekly reminder resync), against the REAL scheduling module and the
// REAL notification chokepoint (only notifee itself is mocked), with the clock
// pinned: Saturday 2026-09-26 12:00 local.
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('pregnancy-reminders'),
    requestPermission: jest.fn().mockResolvedValue({authorizationStatus: 1}),
    createTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
  },
  AndroidImportance: {HIGH: 4},
  AndroidVisibility: {PRIVATE: 1},
  AuthorizationStatus: {NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1},
  RepeatFrequency: {NONE: -1, HOURLY: 0, DAILY: 1, WEEKLY: 2},
  TriggerType: {TIMESTAMP: 0, INTERVAL: 1},
}));

jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  getPrivacySecuritySettings: jest.fn(() => ({
    discreetMode: false,
    discreetNotifications: false,
    hideNotificationPreview: false,
  })),
}));

const mockCreate = notifee.createTriggerNotification as jest.Mock;
const mockCancelTrigger = notifee.cancelTriggerNotification as jest.Mock;

const NOW = new Date(2026, 8, 26, 12, 0, 0); // Saturday
const at = (month: number, day: number, hours: number, minutes = 0) =>
  new Date(2026, month - 1, day, hours, minutes, 0, 0).getTime();
const stamp = '2026-09-01T00:00:00.000Z';

const reminder = (overrides: Partial<CustomReminder>): CustomReminder => ({
  id: 'c1',
  title: 'Rappel',
  date: '2026-08-01', // a Saturday, long past
  time: '08:00',
  repeat: 'daily',
  enabled: true,
  createdAt: stamp,
  updatedAt: stamp,
  ...overrides,
});

const created = () =>
  mockCreate.mock.calls.map(call => ({
    id: call[0].id as string,
    timestamp: call[1].timestamp as number,
    repeat: call[1].repeatFrequency as number | undefined,
  }));
const createdFor = (id: string) => created().filter(entry => entry.id === id);

beforeEach(() => {
  jest.useFakeTimers({advanceTimers: true, now: NOW});
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('M29 - repeating custom reminders whose start has passed', () => {
  it('daily, start long past, time already passed today -> next future occurrence = tomorrow at that time, repeat daily', async () => {
    await syncCustomReminder(reminder({repeat: 'daily', time: '08:00'}));
    expect(createdFor('pregnancy-custom-c1')).toEqual([{id: 'pregnancy-custom-c1', timestamp: at(9, 27, 8), repeat: 1}]);
  });

  it('daily, start long past, time still ahead today -> today at that time', async () => {
    await syncCustomReminder(reminder({repeat: 'daily', time: '18:30'}));
    expect(createdFor('pregnancy-custom-c1')).toEqual([{id: 'pregnancy-custom-c1', timestamp: at(9, 26, 18, 30), repeat: 1}]);
  });

  it('weekly, start on a Saturday long past, time passed today -> NEXT Saturday, repeat weekly', async () => {
    await syncCustomReminder(reminder({repeat: 'weekly', date: '2026-08-01', time: '08:00'}));
    expect(createdFor('pregnancy-custom-c1')).toEqual([{id: 'pregnancy-custom-c1', timestamp: at(10, 3, 8), repeat: 2}]);
  });

  it('weekly, same weekday as today but time still ahead -> today', async () => {
    await syncCustomReminder(reminder({repeat: 'weekly', date: '2026-08-01', time: '18:00'}));
    expect(createdFor('pregnancy-custom-c1')).toEqual([{id: 'pregnancy-custom-c1', timestamp: at(9, 26, 18), repeat: 2}]);
  });

  it('weekly keeps the weekday of the saved date (Wednesday 2026-08-05 -> Wednesday 2026-09-30)', async () => {
    await syncCustomReminder(reminder({repeat: 'weekly', date: '2026-08-05', time: '10:00'}));
    expect(createdFor('pregnancy-custom-c1')).toEqual([{id: 'pregnancy-custom-c1', timestamp: at(9, 30, 10), repeat: 2}]);
  });

  it('a repeating reminder whose start is still in the future keeps its own first occurrence', async () => {
    await syncCustomReminder(reminder({repeat: 'daily', date: '2026-10-05', time: '09:00'}));
    await syncCustomReminder(reminder({id: 'c2', repeat: 'weekly', date: '2026-10-07', time: '09:00'}));
    expect(createdFor('pregnancy-custom-c1')[0].timestamp).toBe(at(10, 5, 9));
    expect(createdFor('pregnancy-custom-c2')[0].timestamp).toBe(at(10, 7, 9));
  });

  it('once in the past is NOT scheduled, and its stale notification id is cancelled', async () => {
    await syncCustomReminder(reminder({repeat: 'once', date: '2026-09-01', time: '08:00'}));
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockCancelTrigger).toHaveBeenCalledWith('pregnancy-custom-c1');
  });

  it('once in the future is scheduled at its own date/time with no repeat', async () => {
    await syncCustomReminder(reminder({repeat: 'once', date: '2026-09-30', time: '08:00'}));
    expect(createdFor('pregnancy-custom-c1')).toEqual([{id: 'pregnancy-custom-c1', timestamp: at(9, 30, 8), repeat: undefined}]);
  });

  it('disabled -> cancelled, nothing scheduled (repeating or not)', async () => {
    await syncCustomReminder(reminder({repeat: 'daily', enabled: false}));
    await syncCustomReminder(reminder({repeat: 'weekly', enabled: false}));
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockCancelTrigger).toHaveBeenCalledWith('pregnancy-custom-c1');
  });

  it('pure helpers: nextWeeklyFireDate / customReminderFireDate never return a past date for a repeating reminder', () => {
    expect(nextWeeklyFireDate(new Date(2026, 7, 1, 8, 0), NOW).getTime()).toBe(at(10, 3, 8));
    expect(customReminderFireDate(reminder({repeat: 'weekly'}), NOW).getTime()).toBeGreaterThan(NOW.getTime());
    expect(customReminderFireDate(reminder({repeat: 'daily'}), NOW).getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('full resync: saved definition never modified, ids unique (no duplicate notification ids), same id on re-sync', async () => {
    await setActiveObjective('pregnancy');
    await saveCustomReminder(reminder({id: 'keep', repeat: 'daily', date: '2026-08-01', time: '07:15'}));
    await resyncAllPregnancyNotifications();
    const firstIds = created().map(entry => entry.id);
    expect(new Set(firstIds).size).toBe(firstIds.length);
    expect(createdFor('pregnancy-custom-keep')).toHaveLength(1);

    await resyncAllPregnancyNotifications();
    expect(createdFor('pregnancy-custom-keep')).toHaveLength(2); // upsert by the same id, never a new id
    expect(new Set(createdFor('pregnancy-custom-keep').map(entry => entry.timestamp)).size).toBe(1);

    const saved = (await getCustomReminders()).find(item => item.id === 'keep');
    expect(saved).toMatchObject({date: '2026-08-01', time: '07:15', repeat: 'daily', enabled: true});
  });
});

describe('M29 - H4 lifecycle stays intact', () => {
  it('leaving Pregnancy cancels the custom reminder id, coming back reschedules it from the saved definition', async () => {
    await saveCustomReminder(reminder({id: 'h4', repeat: 'weekly', date: '2026-08-01', time: '08:00'}));
    await setActiveObjective('postpartum');
    await syncPregnancyNotificationsForActiveObjective();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockCancelTrigger).toHaveBeenCalledWith('pregnancy-custom-h4');

    jest.clearAllMocks();
    await setActiveObjective('pregnancy');
    await syncPregnancyNotificationsForActiveObjective();
    expect(createdFor('pregnancy-custom-h4')).toEqual([{id: 'pregnancy-custom-h4', timestamp: at(10, 3, 8), repeat: 2}]);
  });
});

describe('M30 - a dating change resynchronises the weekly reminder from the NEW dating', () => {
  const datingElapsed = (days: number) => ({
    method: 'lastPeriod' as const,
    date: new Date(2026, 8, 26 - days, 12).toISOString(),
  });
  const weekly = () => createdFor('pregnancy-weekly-update');

  beforeEach(async () => {
    await setActiveObjective('pregnancy');
    await setPregnancyNotificationSettings({
      ...getPregnancyNotificationSettings(),
      weeklyUpdateEnabled: true,
      dailyJournalEnabled: true,
    });
  });

  it('old dating -> weekly on the old boundary; new dating -> weekly on the NEW boundary (same id, old schedule replaced)', async () => {
    await setPregnancyDating(datingElapsed(70)); // 10 SA + 0: boundary = today 09:00 (passed) -> Saturday 2026-10-03
    await syncPregnancyNotificationsForActiveObjective();
    expect(weekly()).toEqual([{id: 'pregnancy-weekly-update', timestamp: at(10, 3, 9), repeat: 2}]);

    jest.clearAllMocks();
    await setPregnancyDating(datingElapsed(73)); // 10 SA + 3: next boundary in 4 days = Wednesday 2026-09-30
    await syncPregnancyNotificationsForActiveObjective();
    expect(weekly()).toEqual([{id: 'pregnancy-weekly-update', timestamp: at(9, 30, 9), repeat: 2}]);
    // the obsolete schedule is cancelled before the new one is created (upsert by id)
    expect(mockCancelTrigger).toHaveBeenCalledWith('pregnancy-weekly-update');
    expect(weekly().some(entry => entry.timestamp === at(10, 3, 9))).toBe(false);
  });

  it('other reminder preferences are unchanged by the dating change (daily journal schedule identical)', async () => {
    await setPregnancyDating(datingElapsed(70));
    await syncPregnancyNotificationsForActiveObjective();
    const dailyBefore = createdFor('pregnancy-daily-journal');
    const settingsBefore = getPregnancyNotificationSettings();

    jest.clearAllMocks();
    await setPregnancyDating(datingElapsed(100));
    await syncPregnancyNotificationsForActiveObjective();
    expect(createdFor('pregnancy-daily-journal')).toEqual(dailyBefore);
    expect(getPregnancyNotificationSettings()).toEqual(settingsBefore);
  });

  it('weekly reminder disabled -> stays cancelled after a dating change', async () => {
    await setPregnancyNotificationSettings({...getPregnancyNotificationSettings(), weeklyUpdateEnabled: false});
    await setPregnancyDating(datingElapsed(80));
    await syncPregnancyNotificationsForActiveObjective();
    expect(weekly()).toEqual([]);
    expect(mockCancelTrigger).toHaveBeenCalledWith('pregnancy-weekly-update');
  });

  it('active objective is not Pregnancy -> nothing is scheduled after a dating change (H4)', async () => {
    await setActiveObjective('cycle');
    await setPregnancyDating(datingElapsed(90));
    await syncPregnancyNotificationsForActiveObjective();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockCancelTrigger).toHaveBeenCalledWith('pregnancy-weekly-update');
  });
});
