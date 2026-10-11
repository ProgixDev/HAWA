import {syncConceptionReminders, CONCEPTION_REMINDER_NOTIFICATION_IDS} from '../conceptionReminderScheduling';
import {syncIrregularReminders} from '../irregularReminderScheduling';
import {__resetNotificationServiceForTests} from '../../services/pregnancyNotifications';
import {
  getActiveObjective,
  getCyclePreferences,
  getCycleObservationStartedAt,
  getHasConfirmedCycleData,
  getRecordedPeriodHistory,
} from '../../state/onboardingPreferences';
import {getConceptionPreferences} from '../../state/conceptionPreferences';
import {getIrregularPreferences} from '../../state/irregularPreferences';
import {getConfirmedPeriodHistory} from '../../state/confirmedPeriodHistoryStore';
import {fakeNotifeeState, notifee as fakeNotifee, resetFakeNotifee} from '../../testUtils/fakeNotifee';

// The TTC and SOPK syncs are requested from many places at once (app start, a preference/objective/period change, a
// profile switch, the TTC Dashboard on focus, a privacy / language change). They used to overlap: an older run, still
// working from older state, could finish AFTER a newer one and put back a reminder the person had just switched off.
// Now they never overlap, a burst shares one follow-up run, and that run reads the NEWEST state.
// Real schedulers + real notification service + a stateful fake notifee whose native create can be held.
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
  getCyclePreferences: jest.fn(),
  getCycleObservationStartedAt: jest.fn(),
  getHasConfirmedCycleData: jest.fn(),
  getRecordedPeriodHistory: jest.fn(),
  hydrateCyclePreferences: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../state/conceptionPreferences', () => ({
  getConceptionPreferences: jest.fn(),
}));
jest.mock('../../state/irregularPreferences', () => ({
  getIrregularPreferences: jest.fn(),
}));
jest.mock('../../state/confirmedPeriodHistoryStore', () => ({
  getConfirmedPeriodHistory: jest.fn(),
  hydrateConfirmedPeriodHistory: jest.fn(() => Promise.resolve([])),
}));

const IDS = CONCEPTION_REMINDER_NOTIFICATION_IDS;
const SOPK_DAILY_ID = 'irregular-daily-journal-reminder';
const NOW = new Date(2026, 8, 20, 10, 0, 0); // Sun 20 Sep 2026, 10:00 local

const ttcPrefs = (flags: Partial<Record<'temperature' | 'daily_journal' | 'fertile_window' | 'estimated_ovulation' | 'lh_test', boolean>>) => ({
  reminders: {temperature: false, daily_journal: false, fertile_window: false, estimated_ovulation: false, lh_test: false, ...flags},
});
const sopkPrefs = (dailyJournalEnabled: boolean, time: string | null = '20:10') => ({
  cyclePattern: null,
  lastPeriodDate: null,
  trackedItems: [],
  reminders: {dailyJournalEnabled, dailyJournalTime: time, unrecordedPeriodEnabled: false},
});

/** Holds every native create until the test releases it, so a run can be caught in the middle of its work. */
function holdNativeCreates() {
  const create = fakeNotifee.createTriggerNotification as jest.Mock;
  const real = create.getMockImplementation() as (...args: unknown[]) => Promise<string>;
  const gates: (() => void)[] = [];
  create.mockImplementation((...args: unknown[]) => new Promise<string>(resolve => gates.push(() => resolve(real(...args)))));
  return {
    gates,
    async releaseAll() {
      for (let pass = 0; pass < 60; pass += 1) {
        gates.splice(0).forEach(release => release());
        await new Promise<void>(resolve => setImmediate(resolve));
      }
    },
    async untilHeld(count: number) {
      for (let index = 0; index < 60 && gates.length < count; index += 1) {
        await new Promise<void>(resolve => setImmediate(resolve));
      }
    },
    /** Puts the real create back and lets go of anything still held (also when a test failed half-way). */
    restore: () => {
      create.mockImplementation(real);
      gates.splice(0).forEach(release => release());
    },
  };
}

beforeEach(() => {
  jest.useFakeTimers({now: NOW, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask']});
  jest.clearAllMocks();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
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
  // Let any run still finishing (the schedulers' coalescing state outlives a test) settle before the next one.
  for (let index = 0; index < 20; index += 1) {
    await new Promise<void>(resolve => setImmediate(resolve));
  }
  jest.useRealTimers();
});

describe('syncConceptionReminders', () => {
  beforeEach(() => {
    (getActiveObjective as jest.Mock).mockReturnValue('conceive');
  });

  it('a burst of requests while a run is in flight shares ONE follow-up run, not one run each', async () => {
    (getConceptionPreferences as jest.Mock).mockReturnValue(ttcPrefs({temperature: true}));
    const held = holdNativeCreates();
    try {
      const first = syncConceptionReminders();
      await held.untilHeld(1);
      const burst = Array.from({length: 8}, () => syncConceptionReminders());
      await held.releaseAll();
      await Promise.all([first, ...burst]);
    } finally {
      held.restore();
    }

    // one run that was in flight + one follow-up for all eight requests
    expect((getConceptionPreferences as jest.Mock).mock.calls.length).toBe(2);
    expect(Array.from(fakeNotifeeState.triggers.keys())).toEqual([IDS.temperature]);
  });

  it('the follow-up run reads the state as it is NOW: a reminder switched off meanwhile ends up off, not resurrected', async () => {
    (getConceptionPreferences as jest.Mock).mockReturnValue(ttcPrefs({temperature: true, daily_journal: true}));
    const held = holdNativeCreates();
    try {
      const older = syncConceptionReminders(); // read both ON; its native creates are held
      await held.untilHeld(2);

      (getConceptionPreferences as jest.Mock).mockReturnValue(ttcPrefs({temperature: true})); // she switched one off
      const newer = syncConceptionReminders();
      await held.releaseAll();
      await Promise.all([older, newer]);
    } finally {
      held.restore();
    }

    expect(Array.from(fakeNotifeeState.triggers.keys())).toEqual([IDS.temperature]);
  });

  it('every caller\'s promise settles only after a run that started after its request', async () => {
    (getConceptionPreferences as jest.Mock).mockReturnValue(ttcPrefs({temperature: true}));
    const held = holdNativeCreates();
    try {
      const inFlight = syncConceptionReminders();
      await held.untilHeld(1);
      (getConceptionPreferences as jest.Mock).mockReturnValue(ttcPrefs({daily_journal: true}));
      let settled = false;
      const requested = syncConceptionReminders().then(() => {
        settled = true;
      });
      await held.releaseAll();
      await Promise.all([inFlight, requested]);
      expect(settled).toBe(true);
    } finally {
      held.restore();
    }

    // what she asked for last is what Android holds when her request resolved
    expect(Array.from(fakeNotifeeState.triggers.keys())).toEqual([IDS.daily_journal]);
  });

  it('is handed straight to subscribers and .then(): any argument is ignored', async () => {
    (getConceptionPreferences as jest.Mock).mockReturnValue(ttcPrefs({temperature: true}));

    await Promise.resolve([{}, {}]).then(syncConceptionReminders as unknown as (value: unknown) => Promise<void>);

    expect(Array.from(fakeNotifeeState.triggers.keys())).toEqual([IDS.temperature]);
  });
});

describe('syncIrregularReminders', () => {
  beforeEach(() => {
    (getActiveObjective as jest.Mock).mockReturnValue('irregular');
  });

  it('a burst of no-argument requests shares ONE follow-up run, and that run reads the newest state', async () => {
    (getIrregularPreferences as jest.Mock).mockReturnValue(sopkPrefs(true, '20:10'));
    const held = holdNativeCreates();
    try {
      const first = syncIrregularReminders();
      await held.untilHeld(1);

      (getIrregularPreferences as jest.Mock).mockReturnValue(sopkPrefs(true, '21:30')); // the person edits the time
      const burst = Array.from({length: 6}, () => syncIrregularReminders());
      await held.releaseAll();
      await Promise.all([first, ...burst]);
    } finally {
      held.restore();
    }

    // (each run reads the objective exactly once, first thing: that counts the runs)
    expect((getActiveObjective as jest.Mock).mock.calls.length).toBe(2); // in-flight run + ONE follow-up
    const trigger = fakeNotifeeState.triggers.get(SOPK_DAILY_ID);
    expect(trigger).toBeDefined();
    expect(new Date(trigger?.trigger.timestamp ?? 0).getHours()).toBe(21);
    expect(new Date(trigger?.trigger.timestamp ?? 0).getMinutes()).toBe(30);
  });

  it('an older run cannot finish after a newer one and put back what was just switched off', async () => {
    (getIrregularPreferences as jest.Mock).mockReturnValue(sopkPrefs(true));
    const held = holdNativeCreates();
    try {
      const older = syncIrregularReminders();
      await held.untilHeld(1);

      (getIrregularPreferences as jest.Mock).mockReturnValue(sopkPrefs(false)); // switched off meanwhile
      const newer = syncIrregularReminders();
      await held.releaseAll();
      await Promise.all([older, newer]);
    } finally {
      held.restore();
    }

    expect(fakeNotifeeState.triggers.has(SOPK_DAILY_ID)).toBe(false);
  });

  it('an explicit `now` (tests/previews) is honoured exactly', async () => {
    // Periods on 4 Jul, 1 Aug and 29 Aug: average 28 days, so "unrecorded period" is due 29 Aug + 28 + 7 = Sat 3 Oct.
    (getConfirmedPeriodHistory as jest.Mock).mockReturnValue(
      ['2026-07-04', '2026-08-01', '2026-08-29'].map(day => ({
        id: day,
        periodStart: `${day}T08:00:00`,
        periodEndDateTime: `${day}T08:00:00`,
        capturedAt: `${day}T08:00:00`,
      })),
    );
    (getIrregularPreferences as jest.Mock).mockReturnValue({
      ...sopkPrefs(false, null),
      reminders: {dailyJournalEnabled: false, dailyJournalTime: null, unrecordedPeriodEnabled: true},
    });
    const UNRECORDED_ID = 'irregular-unrecorded-period-reminder';

    await syncIrregularReminders(new Date(2026, 9, 4, 8, 0, 0)); // "now" is already past Oct 3 09:00
    expect(fakeNotifeeState.triggers.has(UNRECORDED_ID)).toBe(false);

    await syncIrregularReminders(); // the real clock (20 Sep) is before it
    expect(fakeNotifeeState.triggers.get(UNRECORDED_ID)?.trigger.timestamp).toBe(new Date(2026, 9, 3, 9, 0, 0).getTime());
  });

  it('an explicit `now` queues behind a run in flight instead of overlapping it', async () => {
    (getIrregularPreferences as jest.Mock).mockReturnValue(sopkPrefs(true));
    const held = holdNativeCreates();
    let explicitDone = false;
    try {
      const inFlight = syncIrregularReminders();
      await held.untilHeld(1);
      expect((getActiveObjective as jest.Mock).mock.calls.length).toBe(1);

      const explicit = syncIrregularReminders(new Date(2026, 8, 20, 21, 0, 0)).then(() => {
        explicitDone = true;
      });
      for (let index = 0; index < 20; index += 1) {
        await new Promise<void>(resolve => setImmediate(resolve));
      }
      expect(explicitDone).toBe(false);
      expect((getActiveObjective as jest.Mock).mock.calls.length).toBe(1); // it has not even started: waiting its turn

      await held.releaseAll();
      await Promise.all([inFlight, explicit]);
    } finally {
      held.restore();
    }

    expect(explicitDone).toBe(true);
    expect((getActiveObjective as jest.Mock).mock.calls.length).toBe(2);
    expect(fakeNotifeeState.triggers.has(SOPK_DAILY_ID)).toBe(true);
  });

  it('is handed straight to subscribers and .then(): anything that is not a Date is ignored', async () => {
    (getIrregularPreferences as jest.Mock).mockReturnValue(sopkPrefs(true));

    await Promise.resolve([{}, {}]).then(syncIrregularReminders as unknown as (value: unknown) => Promise<void>);

    expect(fakeNotifeeState.triggers.has(SOPK_DAILY_ID)).toBe(true);
    expect(new Date(fakeNotifeeState.triggers.get(SOPK_DAILY_ID)?.trigger.timestamp ?? 0).getHours()).toBe(20);
  });
});
