import {syncContraceptionReminder} from '../contraceptionReminderScheduling';
import {syncMenopauseReminders} from '../menopauseReminderScheduling';
import {syncPostpartumDailyTrackingReminder} from '../postpartumReminderScheduling';
import {syncMiscarriageDailyTrackingReminder} from '../miscarriageReminderScheduling';
import {__resetNotificationServiceForTests} from '../../services/pregnancyNotifications';
import {getActiveObjective} from '../../state/onboardingPreferences';
import {getContraceptionPreferences} from '../../state/contraceptionPreferences';
import {getMenopausePreferences} from '../../state/menopausePreferences';
import {getPostpartumPreferences} from '../../state/postpartumPreferences';
import {getMiscarriagePreferences} from '../../state/miscarriagePreferences';
import {fakeNotifeeState, resetFakeNotifee} from '../../testUtils/fakeNotifee';

// F17 (scheduling side) — a reminder time stored as "24:30" (what builds that formatted time with Intl under en-US
// wrote for midnight) means 00:30 of the SAME day. Read with split(':') + new Date(y, m, d, 24, 30) it was the NEXT
// day: a reminder saved just after midnight went off a whole day late, and an appointment moved to the next date.
//
// Real schedulers + real notification service + stateful fake notifee; only the preference getters are stubbed.
// Proves the JavaScript's timestamps; it cannot prove a phone delivers them.
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
  // The sync waits for the active objective to have been READ before it gates on it.
  hydrateActiveObjective: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../state/contraceptionPreferences', () => ({getContraceptionPreferences: jest.fn()}));
jest.mock('../../state/menopausePreferences', () => ({getMenopausePreferences: jest.fn()}));
jest.mock('../../state/postpartumPreferences', () => ({getPostpartumPreferences: jest.fn()}));
jest.mock('../../state/miscarriagePreferences', () => ({getMiscarriagePreferences: jest.fn()}));

const DAILY = 1; // notifee RepeatFrequency.DAILY
// Local constructor: "00:30" is the same wall-clock moment for the code under test in any machine timezone.
const at = (dayOffset: number, hours: number, minutes: number, seconds = 0) =>
  new Date(2026, 9, 10 + dayOffset, hours, minutes, seconds, 0);

const triggerOf = (id: string) => fakeNotifeeState.triggers.get(id)?.trigger;

type Scenario = {
  name: string;
  objective: string;
  run: () => Promise<void>;
  setPreferences: (time: string) => void;
  /** The pending trigger that must carry the time. */
  id: string;
};

const SCENARIOS: Scenario[] = [
  {
    name: 'contraception - repeating daily reminder',
    objective: 'contraception',
    run: syncContraceptionReminder,
    id: 'contraception-daily-reminder',
    setPreferences: time =>
      (getContraceptionPreferences as jest.Mock).mockReturnValue({
        method: 'pill',
        methodStartDate: null,
        hasTreatmentBreak: false,
        pillScheduleType: 'continuous',
        activeDays: null,
        breakDays: null,
        remindersEnabled: true,
        reminderTime: time,
      }),
  },
  {
    name: 'contraception - day-by-day plan of a cyclic pack',
    objective: 'contraception',
    run: syncContraceptionReminder,
    id: 'contraception-daily-reminder',
    setPreferences: time =>
      (getContraceptionPreferences as jest.Mock).mockReturnValue({
        method: 'pill',
        methodStartDate: '2026-10-10', // today is pack day 1
        hasTreatmentBreak: true,
        pillScheduleType: 'cyclic',
        activeDays: 21,
        breakDays: 7,
        remindersEnabled: true,
        reminderTime: time,
      }),
  },
  {
    name: 'menopause - daily tracking reminder',
    objective: 'menopause',
    run: syncMenopauseReminders,
    id: 'menopause-daily-tracking-reminder',
    setPreferences: time =>
      (getMenopausePreferences as jest.Mock).mockReturnValue({
        hormonalTreatmentStatus: 'no',
        dailyTrackingReminderEnabled: true,
        dailyTrackingReminderTime: time,
        treatmentReminderEnabled: false,
        treatmentReminderTime: null,
      }),
  },
  {
    name: 'menopause - treatment reminder',
    objective: 'menopause',
    run: syncMenopauseReminders,
    id: 'menopause-treatment-reminder',
    setPreferences: time =>
      (getMenopausePreferences as jest.Mock).mockReturnValue({
        hormonalTreatmentStatus: 'track',
        dailyTrackingReminderEnabled: false,
        dailyTrackingReminderTime: null,
        treatmentReminderEnabled: true,
        treatmentReminderTime: time,
      }),
  },
  {
    name: 'postpartum - daily tracking reminder',
    objective: 'postpartum',
    run: syncPostpartumDailyTrackingReminder,
    id: 'postpartum-daily-tracking-reminder',
    setPreferences: time =>
      (getPostpartumPreferences as jest.Mock).mockReturnValue({
        dailyTrackingReminderEnabled: true,
        dailyTrackingReminderTime: time,
      }),
  },
  {
    name: 'miscarriage - daily tracking reminder',
    objective: 'loss',
    run: syncMiscarriageDailyTrackingReminder,
    id: 'miscarriage-daily-tracking-reminder',
    setPreferences: time =>
      (getMiscarriagePreferences as jest.Mock).mockReturnValue({
        dailyTrackingReminderEnabled: true,
        dailyTrackingReminderTime: time,
      }),
  },
];

beforeEach(() => {
  jest.useFakeTimers();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
});

afterEach(() => {
  jest.useRealTimers();
});

describe.each(SCENARIOS)('$name', ({objective, run, setPreferences, id}) => {
  beforeEach(() => {
    (getActiveObjective as jest.Mock).mockReturnValue(objective);
  });

  it('stored "24:30", it is 00:10 now: fires at 00:30 TODAY (20 minutes away), not at 00:30 tomorrow', async () => {
    jest.setSystemTime(at(0, 0, 10));
    setPreferences('24:30');

    await run();

    expect(triggerOf(id)!.timestamp).toBe(at(0, 0, 30).getTime());
  });

  it('stored "00:30" gives exactly the same trigger', async () => {
    jest.setSystemTime(at(0, 0, 10));
    setPreferences('00:30');

    await run();

    expect(triggerOf(id)!.timestamp).toBe(at(0, 0, 30).getTime());
  });

  it('stored "24:30", it is already 00:40: the first fire is 00:30 TOMORROW (never two days away)', async () => {
    jest.setSystemTime(at(0, 0, 40));
    setPreferences('24:30');

    await run();

    expect(triggerOf(id)!.timestamp).toBe(at(1, 0, 30).getTime());
  });
});

describe('a legacy "24:30" keeps the repeating shape of the single-trigger reminders', () => {
  it.each(SCENARIOS.filter(scenario => !scenario.name.includes('day-by-day')))('$name', async ({objective, run, setPreferences, id}) => {
    (getActiveObjective as jest.Mock).mockReturnValue(objective);
    jest.setSystemTime(at(0, 0, 10));
    setPreferences('24:30');

    await run();

    expect(triggerOf(id)!.repeatFrequency).toBe(DAILY);
    // One trigger for the reminder (the DST split only ever adds a `::1`, never on this day).
    expect(Array.from(fakeNotifeeState.triggers.keys()).filter(key => key.startsWith(id))).toEqual([id]);
  });
});
