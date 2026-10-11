import {syncConceptionReminders} from '../conceptionReminderScheduling';
import {syncIrregularReminders} from '../irregularReminderScheduling';
import {syncContraceptionReminder} from '../contraceptionReminderScheduling';
import {syncMenopauseReminders} from '../menopauseReminderScheduling';
import {syncPostpartumDailyTrackingReminder} from '../postpartumReminderScheduling';
import {syncMiscarriageDailyTrackingReminder} from '../miscarriageReminderScheduling';
import {syncCycleReminders} from '../cycleReminderScheduling';
import {__resetNotificationServiceForTests} from '../../services/pregnancyNotifications';
import {
  getActiveObjective,
  getCyclePreferences,
  getCycleObservationStartedAt,
  getHasConfirmedCycleData,
  getRecordedPeriodHistory,
  hydrateActiveObjective,
} from '../../state/onboardingPreferences';
import {getConceptionPreferences} from '../../state/conceptionPreferences';
import {getIrregularPreferences} from '../../state/irregularPreferences';
import {getConfirmedPeriodHistory} from '../../state/confirmedPeriodHistoryStore';
import {getContraceptionPreferences} from '../../state/contraceptionPreferences';
import {getMenopausePreferences} from '../../state/menopausePreferences';
import {getPostpartumPreferences} from '../../state/postpartumPreferences';
import {getMiscarriagePreferences} from '../../state/miscarriagePreferences';
import {getCycleReminderPreferences} from '../../state/cycleReminderPreferences';
import {fakeNotifeeState, notifee as fakeNotifee, resetFakeNotifee, scheduledIds} from '../../testUtils/fakeNotifee';

// Phase 2 — F7/F15: a reminder sync must not act on the DEFAULT objective.
//
// Until the stored objective has been read, memory holds the default ('cycle'). Every objective's scheduler is gated on
// the objective, and each store notifies its listeners when ITS OWN read completes — so a sync triggered by, say, the
// menopause preferences loading could run before the objective had been read, conclude "this is not the Menopause
// objective" and cancel the reminder, to re-create it a moment later. At launch (including the headless start after a
// delivery) a process that ends in that window is left without the reminder. Each scheduler now waits for the objective
// to have been read before it gates on it, exactly as Pregnancy and Nifas always did.
//
// Real schedulers + real notification service + a stateful fake notifee; the objective store is modelled by a mock
// whose read can be held open and which answers 'cycle' until it completes. JavaScript only: nothing here proves
// what a physical phone's alarm manager does.
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
  hydrateActiveObjective: jest.fn(),
  getCyclePreferences: jest.fn(),
  getCycleObservationStartedAt: jest.fn(),
  getHasConfirmedCycleData: jest.fn(),
  getHasConfirmedCycleDuration: jest.fn(() => true),
  getRecordedPeriodHistory: jest.fn(),
  hydrateCyclePreferences: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../state/conceptionPreferences', () => ({getConceptionPreferences: jest.fn()}));
jest.mock('../../state/irregularPreferences', () => ({getIrregularPreferences: jest.fn()}));
jest.mock('../../state/confirmedPeriodHistoryStore', () => ({
  getConfirmedPeriodHistory: jest.fn(),
  hydrateConfirmedPeriodHistory: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../../state/contraceptionPreferences', () => ({getContraceptionPreferences: jest.fn()}));
jest.mock('../../state/menopausePreferences', () => ({getMenopausePreferences: jest.fn()}));
jest.mock('../../state/postpartumPreferences', () => ({getPostpartumPreferences: jest.fn()}));
jest.mock('../../state/miscarriagePreferences', () => ({getMiscarriagePreferences: jest.fn()}));
jest.mock('../../state/cycleReminderPreferences', () => ({
  getCycleReminderPreferences: jest.fn(),
  hydrateCycleReminderPreferences: jest.fn(() => Promise.resolve()),
}));

const NOW = new Date(2026, 8, 20, 10, 0, 0); // Sun 20 Sep 2026, 10:00 local

// --- the objective store, modelled -------------------------------------------------------------------------------
let objectiveRead = true;
let releaseObjectiveRead: (() => void) | null = null;
let storedObjective = 'cycle';

function objectiveStoreReadIsPending(objective: string) {
  storedObjective = objective;
  objectiveRead = false;
}

const mockActive = getActiveObjective as jest.Mock;
const mockHydrate = hydrateActiveObjective as jest.Mock;

type Case = {
  name: string;
  objective: string;
  sync: () => Promise<void>;
  setPreferences: () => void;
};

const CASES: Case[] = [
  {
    name: 'contraception',
    objective: 'contraception',
    sync: syncContraceptionReminder,
    setPreferences: () =>
      (getContraceptionPreferences as jest.Mock).mockReturnValue({
        method: 'pill',
        methodStartDate: null,
        hasTreatmentBreak: false,
        pillScheduleType: 'continuous',
        activeDays: null,
        breakDays: null,
        remindersEnabled: true,
        reminderTime: '20:10',
      }),
  },
  {
    name: 'menopause',
    objective: 'menopause',
    sync: syncMenopauseReminders,
    setPreferences: () =>
      (getMenopausePreferences as jest.Mock).mockReturnValue({
        hormonalTreatmentStatus: 'no',
        dailyTrackingReminderEnabled: true,
        dailyTrackingReminderTime: '20:10',
        treatmentReminderEnabled: false,
        treatmentReminderTime: null,
      }),
  },
  {
    name: 'postpartum daily tracking',
    objective: 'postpartum',
    sync: syncPostpartumDailyTrackingReminder,
    setPreferences: () =>
      (getPostpartumPreferences as jest.Mock).mockReturnValue({
        dailyTrackingReminderEnabled: true,
        dailyTrackingReminderTime: '20:10',
      }),
  },
  {
    name: 'miscarriage daily tracking',
    objective: 'loss',
    sync: syncMiscarriageDailyTrackingReminder,
    setPreferences: () =>
      (getMiscarriagePreferences as jest.Mock).mockReturnValue({
        dailyTrackingReminderEnabled: true,
        dailyTrackingReminderTime: '20:10',
      }),
  },
  {
    name: 'TTC (essayer de concevoir)',
    objective: 'conceive',
    sync: syncConceptionReminders,
    setPreferences: () =>
      (getConceptionPreferences as jest.Mock).mockReturnValue({
        reminders: {temperature: true, daily_journal: false, fertile_window: false, estimated_ovulation: false, lh_test: false},
      }),
  },
  {
    name: 'SOPK (cycles irréguliers)',
    objective: 'irregular',
    sync: () => syncIrregularReminders(),
    setPreferences: () =>
      (getIrregularPreferences as jest.Mock).mockReturnValue({
        cyclePattern: null,
        lastPeriodDate: null,
        trackedItems: [],
        reminders: {dailyJournalEnabled: true, dailyJournalTime: '20:10', unrecordedPeriodEnabled: false},
      }),
  },
];

const nativeCancelCalls = () =>
  [
    fakeNotifee.cancelTriggerNotification,
    fakeNotifee.cancelTriggerNotifications,
    fakeNotifee.cancelNotification,
    fakeNotifee.cancelAllNotifications,
  ].reduce((total, fn) => total + (fn as jest.Mock).mock.calls.length, 0);

const settle = async () => {
  for (let index = 0; index < 40; index += 1) {
    await new Promise<void>(resolve => setImmediate(resolve));
  }
};

beforeEach(() => {
  jest.useFakeTimers({now: NOW, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask']});
  jest.clearAllMocks();
  resetFakeNotifee();
  __resetNotificationServiceForTests();

  objectiveRead = true;
  releaseObjectiveRead = null;
  storedObjective = 'cycle';
  // The store: 'cycle' (the default) until its read has completed, then what is stored.
  mockActive.mockImplementation(() => (objectiveRead ? storedObjective : 'cycle'));
  mockHydrate.mockImplementation(() => {
    if (objectiveRead) {return Promise.resolve(storedObjective);}
    return new Promise<string>(resolve => {
      releaseObjectiveRead = () => {
        objectiveRead = true;
        resolve(storedObjective);
      };
    });
  });

  (getHasConfirmedCycleData as jest.Mock).mockReturnValue(true);
  (getCycleObservationStartedAt as jest.Mock).mockReturnValue(null);
  (getRecordedPeriodHistory as jest.Mock).mockReturnValue([]);
  (getCyclePreferences as jest.Mock).mockReturnValue({
    lastPeriodStart: new Date(2026, 8, 15, 12),
    cycleDuration: 28,
    periodDuration: 5,
    regularity: 'yes',
  });
  (getConfirmedPeriodHistory as jest.Mock).mockReturnValue([]);
});

afterEach(async () => {
  releaseObjectiveRead?.();
  await settle();
  jest.useRealTimers();
});

describe.each(CASES)('$name', ({objective, sync, setPreferences}) => {
  it('a run requested BEFORE the objective has been read cancels nothing and leaves the armed reminder in place', async () => {
    // The reminder is armed (objective known).
    storedObjective = objective;
    setPreferences();
    await sync();
    const armed = scheduledIds();
    expect(armed.length).toBeGreaterThan(0);
    fakeNotifeeState.triggers.forEach(record => expect(record.trigger.timestamp).toBeGreaterThan(Date.now()));

    // Launch: the objective's read is still pending when another store's hydration triggers this sync.
    jest.clearAllMocks();
    objectiveStoreReadIsPending(objective);
    const run = sync();
    await settle();

    expect(nativeCancelCalls()).toBe(0);
    expect(scheduledIds()).toEqual(armed);

    // The objective is read: the run completes on the REAL objective and the armed reminder is still there (it may
    // legitimately cancel ids this objective does not use, e.g. a disabled treatment reminder).
    releaseObjectiveRead?.();
    await run;
    expect(scheduledIds()).toEqual(armed);
  });

  it('after the read completes, a run for a DIFFERENT objective still cancels (the gate itself is unchanged)', async () => {
    storedObjective = objective;
    setPreferences();
    await sync();
    expect(scheduledIds().length).toBeGreaterThan(0);

    storedObjective = 'pregnancy';
    objectiveRead = true;
    await sync();

    expect(scheduledIds()).toEqual([]);
  });
});

// The Cycle scheduler's gate runs the other way round: the default objective IS 'cycle', so a run before the read would
// ARM Cycle reminders for someone whose stored objective is something else (until the read completes and a later run
// cancels them again — or the process ends first and they stay).
describe('Cycle (suivre mon cycle)', () => {
  const CYCLE_ON = {
    upcomingPeriodEnabled: true,
    upcomingPeriodDaysBefore: 2 as const,
    periodStartCheckEnabled: false,
    dailyJournalEnabled: false,
    dailyJournalTime: null,
    fertileWindowEnabled: false,
    ovulationEnabled: false,
  };

  beforeEach(() => {
    (getCycleReminderPreferences as jest.Mock).mockReturnValue(CYCLE_ON);
  });

  it('a run requested before the objective has been read does not ARM Cycle reminders for a user on another objective', async () => {
    objectiveStoreReadIsPending('pregnancy');
    const run = syncCycleReminders();
    await settle();

    expect(scheduledIds()).toEqual([]);

    releaseObjectiveRead?.();
    await run;

    // Her objective is Pregnancy: no Cycle reminder at any point.
    expect(scheduledIds()).toEqual([]);
  });

  it('a run for a user whose stored objective IS Cycle waits for the read and then arms the reminder', async () => {
    objectiveStoreReadIsPending('cycle');
    const run = syncCycleReminders();
    await settle();
    expect(scheduledIds()).toEqual([]); // still waiting for the read

    releaseObjectiveRead?.();
    await run;

    expect(scheduledIds().length).toBeGreaterThan(0);
  });
});
