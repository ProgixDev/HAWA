import {
  cancelAllPregnancyNotifications,
  syncPregnancyNotificationsForActiveObjective,
} from '../pregnancyReminderScheduling';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {setActiveObjective, type ObjectiveId} from '../../state/onboardingPreferences';
import {setPregnancyDating, getPregnancyDating} from '../../state/pregnancyPreferences';
import {
  getPregnancyNotificationSettings,
  setPregnancyNotificationSettings,
} from '../../state/pregnancyNotificationSettingsStore';
import {getHealthReminders, saveHealthReminder} from '../../state/pregnancyHealthRemindersStore';
import {getCustomReminders, saveCustomReminder} from '../../state/pregnancyCustomRemindersStore';
import {getPregnancyMedicalEvents, savePregnancyMedicalEvent} from '../../state/pregnancyMedicalEventsStore';

// H4 - Pregnancy notifications exist only while the active objective is
// 'pregnancy': cancelled when she leaves it (Postpartum, Loss, Cycle, ...),
// rescheduled from the SAVED state when she comes back. Saved data is never
// deleted.
jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));

const mockSchedule = scheduleLocalNotification as jest.Mock;
const mockCancel = cancelLocalNotification as jest.Mock;

const NOW = new Date();
const isoDay = (offset: number) => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + offset, 12);
  return d.toLocaleDateString('en-CA');
};
const stamp = NOW.toISOString();

const ALL_IDS = [
  'pregnancy-weekly-update',
  'pregnancy-daily-journal',
  'pregnancy-health-h1',
  'pregnancy-custom-c1',
  'pregnancy-event-e1',
];

const scheduledIds = () => mockSchedule.mock.calls.map(call => call[0].id as string);
const cancelledIds = () => mockCancel.mock.calls.map(call => call[0] as string);

beforeAll(async () => {
  await setPregnancyDating({method: 'lastPeriod', date: new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 70).toISOString()});
  await setPregnancyNotificationSettings({
    ...getPregnancyNotificationSettings(),
    weeklyUpdateEnabled: true,
    dailyJournalEnabled: true,
  });
  await saveHealthReminder({
    id: 'h1', kind: 'vitamin', name: 'Acide folique', time: '08:00', repeat: 'daily', enabled: true, createdAt: stamp, updatedAt: stamp,
  });
  await saveCustomReminder({
    id: 'c1', title: 'Rappel', date: isoDay(3), time: '10:00', repeat: 'once', enabled: true, createdAt: stamp, updatedAt: stamp,
  });
  await savePregnancyMedicalEvent({
    id: 'e1', type: 'appointment', date: isoDay(10), time: '10:00', title: 'Echographie', reminderEnabled: true, reminderOffset: '1day', createdAt: stamp, updatedAt: stamp,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSchedule.mockResolvedValue(true);
  mockCancel.mockResolvedValue(undefined);
});

const switchTo = async (objective: ObjectiveId) => {
  await setActiveObjective(objective);
  await syncPregnancyNotificationsForActiveObjective();
};

describe('active objective = pregnancy', () => {
  it('schedules every Pregnancy notification (weekly, daily, health, custom, event) and cancels nothing', async () => {
    await switchTo('pregnancy');
    expect(new Set(scheduledIds())).toEqual(new Set(ALL_IDS));
    expect(mockCancel).not.toHaveBeenCalled();
  });
});

describe.each<[ObjectiveId]>([['postpartum'], ['loss'], ['cycle'], ['conceive'], ['contraception'], ['irregular'], ['menopause']])(
  'leaving Pregnancy for %s',
  target => {
    it('cancels EVERY scheduled Pregnancy notification and schedules none', async () => {
      await switchTo('pregnancy');
      jest.clearAllMocks();
      mockSchedule.mockResolvedValue(true);
      mockCancel.mockResolvedValue(undefined);

      await switchTo(target);

      expect(mockSchedule).not.toHaveBeenCalled();
      expect(new Set(cancelledIds())).toEqual(new Set(ALL_IDS));
    });
  },
);

describe('coming back to Pregnancy', () => {
  it('reschedules everything from the SAVED state after a Postpartum / Loss detour', async () => {
    await switchTo('postpartum');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    await switchTo('pregnancy');
    expect(new Set(scheduledIds())).toEqual(new Set(ALL_IDS));

    await switchTo('loss');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    await switchTo('pregnancy');
    expect(new Set(scheduledIds())).toEqual(new Set(ALL_IDS));
  });
});

describe('saved data is never deleted by the cancellation', () => {
  it('dating, notification settings, health/custom reminders and medical events survive leaving Pregnancy', async () => {
    await switchTo('pregnancy');
    const before = {
      dating: getPregnancyDating(),
      settings: getPregnancyNotificationSettings(),
      health: (await getHealthReminders()).map(r => r.id),
      custom: (await getCustomReminders()).map(r => r.id),
      events: (await getPregnancyMedicalEvents()).map(e => e.id),
    };

    await switchTo('postpartum');
    await cancelAllPregnancyNotifications();

    expect(getPregnancyDating()).toEqual(before.dating);
    expect(getPregnancyNotificationSettings()).toEqual(before.settings);
    expect((await getHealthReminders()).map(r => r.id)).toEqual(before.health);
    expect((await getCustomReminders()).map(r => r.id)).toEqual(before.custom);
    expect((await getPregnancyMedicalEvents()).map(e => e.id)).toEqual(before.events);
    expect(before.health).toContain('h1');
    expect(before.events).toContain('e1');
  });
});
