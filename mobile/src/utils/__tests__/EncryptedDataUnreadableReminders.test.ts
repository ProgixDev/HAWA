import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {STRUCTURED_KEY_SERVICE} from '../../services/structuredEncryption';
import {isRamadan} from '../hijriCalendar';

// DERIVED OUTPUT UNDER FAILURE — reminders are never scheduled, re-scheduled or cancelled from a record that could not
// be READ. Each objective's real scheduler runs against the real (encrypted) stores:
//   1. valid data  -> the scheduler does schedule (so the scenario can fail only because of the unreadable record);
//   2. one source record made unreadable (corrupted ciphertext, or the key gone) + a cold start, exactly as App.tsx
//      boots (hydrate every store, then sync) -> NOT ONE schedule call and NOT ONE cancel call: whatever is already
//      scheduled stays exactly as it is, nothing is derived from the default state the stores fall back to.
// The native notification layer is a spy (the same chokepoint every objective goes through). Fixtures only.

jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(async () => true),
  cancelLocalNotification: jest.fn(async () => true),
  cancelLocalNotifications: jest.fn(async () => true),
  ensureNotificationPermission: jest.fn(async () => true),
}));

// Mid-Ramadan 2025, 10:00 — the Qadaa reminder is only evaluated during Ramadan, and one fixed "now" keeps every
// scenario's relative dates deterministic.
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

type Secure = typeof import('../../services/secureAsyncStorage');
type Notifications = typeof import('../../services/pregnancyNotifications');

const M = {
  secure: () => require('../../services/secureAsyncStorage') as Secure,
  notifications: () => require('../../services/pregnancyNotifications') as Notifications,
  onboarding: () => require('../../state/onboardingPreferences') as typeof import('../../state/onboardingPreferences'),
  confirmed: () => require('../../state/confirmedPeriodHistoryStore') as typeof import('../../state/confirmedPeriodHistoryStore'),
  cycleReminders: () => require('../../state/cycleReminderPreferences') as typeof import('../../state/cycleReminderPreferences'),
  journal: () => require('../../state/dailyJournalStore') as typeof import('../../state/dailyJournalStore'),
  ledger: () => require('../../state/qadaaLedgerStore') as typeof import('../../state/qadaaLedgerStore'),
  conception: () => require('../../state/conceptionPreferences') as typeof import('../../state/conceptionPreferences'),
  contraception: () => require('../../state/contraceptionPreferences') as typeof import('../../state/contraceptionPreferences'),
  irregularPrefs: () => require('../../state/irregularPreferences') as typeof import('../../state/irregularPreferences'),
  irregularJournal: () => require('../../state/irregularJournalStore') as typeof import('../../state/irregularJournalStore'),
  menopause: () => require('../../state/menopausePreferences') as typeof import('../../state/menopausePreferences'),
  miscarriage: () => require('../../state/miscarriagePreferences') as typeof import('../../state/miscarriagePreferences'),
  postpartum: () => require('../../state/postpartumPreferences') as typeof import('../../state/postpartumPreferences'),
  lochia: () => require('../../state/postpartumLochiaStore') as typeof import('../../state/postpartumLochiaStore'),
  nifasState: () => require('../../state/postpartumNifasReminderStore') as typeof import('../../state/postpartumNifasReminderStore'),
  pregnancyPrefs: () => require('../../state/pregnancyPreferences') as typeof import('../../state/pregnancyPreferences'),
  pregnancySettings: () => require('../../state/pregnancyNotificationSettingsStore') as typeof import('../../state/pregnancyNotificationSettingsStore'),
  pregnancyEvents: () => require('../../state/pregnancyMedicalEventsStore') as typeof import('../../state/pregnancyMedicalEventsStore'),
  pregnancyHealth: () => require('../../state/pregnancyHealthRemindersStore') as typeof import('../../state/pregnancyHealthRemindersStore'),
  pregnancyCustom: () => require('../../state/pregnancyCustomRemindersStore') as typeof import('../../state/pregnancyCustomRemindersStore'),
  cycleScheduling: () => require('../cycleReminderScheduling') as typeof import('../cycleReminderScheduling'),
  conceptionScheduling: () => require('../conceptionReminderScheduling') as typeof import('../conceptionReminderScheduling'),
  contraceptionScheduling: () => require('../contraceptionReminderScheduling') as typeof import('../contraceptionReminderScheduling'),
  irregularScheduling: () => require('../irregularReminderScheduling') as typeof import('../irregularReminderScheduling'),
  menopauseScheduling: () => require('../menopauseReminderScheduling') as typeof import('../menopauseReminderScheduling'),
  miscarriageScheduling: () => require('../miscarriageReminderScheduling') as typeof import('../miscarriageReminderScheduling'),
  postpartumScheduling: () => require('../postpartumReminderScheduling') as typeof import('../postpartumReminderScheduling'),
  nifasScheduling: () => require('../postpartumNifasReminderScheduling') as typeof import('../postpartumNifasReminderScheduling'),
  pregnancyScheduling: () => require('../pregnancyReminderScheduling') as typeof import('../pregnancyReminderScheduling'),
  pregnancyEventScheduling: () => require('../pregnancyEventReminders') as typeof import('../pregnancyEventReminders'),
  qadaaScheduling: () => require('../qadaaReminderScheduling') as typeof import('../qadaaReminderScheduling'),
};

const settle = async () => {
  for (let index = 0; index < 25; index += 1) {
    await new Promise<void>(resolve => setImmediate(resolve));
  }
};

const coldStart = (): Secure => {
  jest.resetModules();
  const secure = M.secure();
  secure.setStructuredEncryptionEnabled(true);
  secure.resetStructuredStorageForTests();
  return secure;
};

const OBJECTIVE_KEY = '@hawa/active-objective';

const corruptCiphertext = async (key: string): Promise<string> => {
  const stored = await AsyncStorage.getItem(key);
  if (stored === null) {throw new Error(`fixture: ${key} was never written`);}
  const envelope = JSON.parse(stored) as {c: string};
  envelope.c = `${envelope.c.slice(0, -1)}${envelope.c.endsWith('0') ? '1' : '0'}`;
  const corrupted = JSON.stringify(envelope);
  await AsyncStorage.setItem(key, corrupted);
  return corrupted;
};

const nativeCalls = () => {
  const n = M.notifications();
  return {
    scheduled: (n.scheduleLocalNotification as jest.Mock).mock.calls.length,
    cancelled:
      (n.cancelLocalNotification as jest.Mock).mock.calls.length +
      (n.cancelLocalNotifications as jest.Mock).mock.calls.length,
  };
};

type Scenario = {
  name: string;
  /** Writes valid data through the real writers (cold start already done). */
  seed: () => Promise<void>;
  /** What App.tsx / the scheduler's own preamble does before a sync. */
  hydrate: () => Promise<void>;
  /** The scheduler entry point under test. */
  run: () => Promise<void>;
  /** Source records of the scheduler; each one, made unreadable on its own, must stop the sync. */
  sources: string[];
  /** The fixture's seed phase must itself end with at least one schedule call (proves the scenario is live). */
  expectScheduled?: boolean;
};

const hydrateObjective = async () => {
  await M.onboarding().hydrateActiveObjective();
};

const SCENARIOS: Scenario[] = [
  {
    name: 'cycle (Suivre mon cycle)',
    sources: ['@hawa/cycle-preferences', '@hawa/cycle-reminder-preferences/v1', '@hawa/confirmed-period-history', OBJECTIVE_KEY],
    seed: async () => {
      await M.onboarding().setActiveObjective('cycle');
      M.onboarding().setCyclePreferences({lastPeriodStart: daysFromNow(-20), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
      await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-20), daysFromNow(-16));
      await M.cycleReminders().setCycleReminderPreferences({
        upcomingPeriodEnabled: true, upcomingPeriodDaysBefore: 2, periodStartCheckEnabled: true,
        dailyJournalEnabled: true, dailyJournalTime: '21:30', fertileWindowEnabled: true, ovulationEnabled: true,
      });
      await settle();
    },
    hydrate: async () => {
      await hydrateObjective();
      await M.onboarding().hydrateCyclePreferences();
      await M.cycleReminders().hydrateCycleReminderPreferences();
      await M.confirmed().hydrateConfirmedPeriodHistory();
    },
    run: async () => {
      await M.cycleScheduling().syncCycleReminders();
    },
  },
  {
    name: 'conceive (Essayer de concevoir)',
    sources: ['@hawa/conception-preferences', '@hawa/cycle-preferences', OBJECTIVE_KEY],
    seed: async () => {
      await M.onboarding().setActiveObjective('conceive');
      M.onboarding().setCyclePreferences({lastPeriodStart: daysFromNow(-6), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
      await M.conception().setConceptionPreferences({
        tryingDuration: 'under_3_months', ovulationAwareness: 'often', indicators: ['temperature'],
        reminders: {fertile_window: true, estimated_ovulation: true, temperature: true, lh_test: true, daily_journal: true},
      });
      await settle();
    },
    hydrate: async () => {
      await hydrateObjective();
      await M.onboarding().hydrateCyclePreferences();
      await M.conception().hydrateConceptionPreferences();
    },
    run: async () => {
      await M.conceptionScheduling().syncConceptionReminders();
    },
  },
  {
    name: 'contraception (pill reminder)',
    sources: ['@hawa/contraception-preferences', OBJECTIVE_KEY],
    seed: async () => {
      await M.onboarding().setActiveObjective('contraception');
      await M.contraception().setContraceptionPreferences({
        method: 'pill', methodStartDate: '2025-01-05', pillScheduleType: 'continuous', remindersEnabled: true, reminderTime: '08:15',
      });
    },
    hydrate: async () => {
      await hydrateObjective();
      await M.contraception().hydrateContraceptionPreferences();
    },
    run: async () => {
      await M.contraceptionScheduling().syncContraceptionReminder();
    },
  },
  {
    name: 'irregular (SOPK)',
    sources: ['@hawa/irregular-preferences/v1', '@hawa/irregular-journal/v1', '@hawa/daily-journal/v1', '@hawa/confirmed-period-history', OBJECTIVE_KEY],
    seed: async () => {
      await M.onboarding().setActiveObjective('irregular');
      await M.irregularPrefs().setIrregularPreferences({
        cyclePattern: 'irregular', lastPeriodDate: isoDay(daysFromNow(-30)), trackedItems: ['acne'],
        reminders: {dailyJournalEnabled: true, dailyJournalTime: '20:10', unrecordedPeriodEnabled: true},
      });
      await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-90), daysFromNow(-86));
      await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-60), daysFromNow(-56));
      await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-30), daysFromNow(-26));
      await M.irregularJournal().saveIrregularJournalField(isoDay(daysFromNow(-3)), 'acne', 'Léger');
      await M.journal().saveJournalSection(isoDay(daysFromNow(-2)), 'mood', {level: 'good', energy: 3, stress: 1, irritability: 1, motivation: 3});
      await settle();
    },
    hydrate: async () => {
      await hydrateObjective();
      await M.irregularPrefs().hydrateIrregularPreferences();
      await M.irregularJournal().hydrateIrregularJournal();
      await M.confirmed().hydrateConfirmedPeriodHistory();
    },
    run: async () => {
      await M.irregularScheduling().syncIrregularReminders(NOW);
    },
  },
  {
    name: 'menopause (daily + treatment reminders)',
    sources: ['@hawa/menopause-preferences/v1', OBJECTIVE_KEY],
    seed: async () => {
      await M.onboarding().setActiveObjective('menopause');
      await M.menopause().setMenopausePreferences({
        stage: 'perimenopause', trackedSymptoms: ['hot_flashes'], hormonalTreatmentStatus: 'track', labTracking: 'none',
        dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '19:00',
        treatmentReminderEnabled: true, treatmentReminderTime: '08:00',
      });
    },
    hydrate: async () => {
      await hydrateObjective();
      await M.menopause().hydrateMenopausePreferences();
    },
    run: async () => {
      await M.menopauseScheduling().syncMenopauseReminders();
    },
  },
  {
    name: 'loss (miscarriage daily tracking reminder)',
    sources: ['@hawa/miscarriage-preferences/v1', OBJECTIVE_KEY],
    seed: async () => {
      await M.onboarding().setActiveObjective('loss');
      await M.miscarriage().setMiscarriagePreferences({
        miscarriageDate: isoDay(daysFromNow(-20)), bleedingStatus: null, cycleReturnStatus: null, firstReturnedPeriodDate: null,
        tryingAgainStatus: null, dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '18:20',
      });
    },
    hydrate: async () => {
      await hydrateObjective();
      await M.miscarriage().hydrateMiscarriagePreferences();
    },
    run: async () => {
      await M.miscarriageScheduling().syncMiscarriageDailyTrackingReminder();
    },
  },
  {
    name: 'postpartum (daily tracking reminder)',
    sources: ['@hawa/postpartum-preferences/v1', OBJECTIVE_KEY],
    seed: async () => {
      await M.onboarding().setActiveObjective('postpartum');
      await M.postpartum().setPostpartumPreferences({
        deliveryDate: isoDay(daysFromNow(-5)), startedAt: daysFromNow(-5).toISOString(), deliveryType: null, feedingType: null,
        firstPostpartumPeriodDate: null, dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '10:30',
      });
    },
    hydrate: async () => {
      await hydrateObjective();
      await M.postpartum().hydratePostpartumPreferences();
    },
    run: async () => {
      await M.postpartumScheduling().syncPostpartumDailyTrackingReminder();
    },
  },
  {
    name: 'postpartum (Nifas J35 / J40 reminders)',
    sources: ['@hawa/postpartum-preferences/v1', '@hawa/postpartum-lochia/v1', '@hawa/postpartum-nifas-reminders/v1', OBJECTIVE_KEY],
    seed: async () => {
      await M.onboarding().setActiveObjective('postpartum');
      M.onboarding().setSpiritualMarkersEnabled(true);
      await M.postpartum().confirmDelivery(daysFromNow(-3));
      await M.lochia().savePostpartumLochiaEntry(isoDay(daysFromNow(-2)), {flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: []});
      await settle();
      // the first valid sync is what creates the Nifas schedule record
      await M.nifasScheduling().syncPostpartumNifasReminders();
      await settle();
    },
    hydrate: async () => {
      await hydrateObjective();
      await M.postpartum().hydratePostpartumPreferences();
      await M.lochia().hydratePostpartumLochia();
      await M.nifasState().hydratePostpartumNifasReminderState();
    },
    run: async () => {
      await M.nifasScheduling().syncPostpartumNifasReminders();
    },
  },
  {
    name: 'pregnancy (weekly update, journal, appointments, vitamins, custom)',
    sources: [
      '@hawa/pregnancy-dating', '@hawa/pregnancy-notification-settings', '@hawa/pregnancy-medical-events',
      '@hawa/pregnancy-health-reminders', '@hawa/pregnancy-custom-reminders', OBJECTIVE_KEY,
    ],
    seed: async () => {
      await M.onboarding().setActiveObjective('pregnancy');
      await M.pregnancyPrefs().setPregnancyDating({method: 'dueDate', date: isoDay(daysFromNow(120))});
      await M.pregnancySettings().setPregnancyNotificationSettings({
        weeklyUpdateEnabled: true, dailyJournalEnabled: true, dailyJournalTime: '20:00', appointmentsEnabled: true,
        examsEnabled: true, defaultAppointmentReminderOffset: '1day', defaultExamReminderOffset: '1day',
      });
      await M.pregnancyEvents().savePregnancyMedicalEvent({
        id: 'evt-1', type: 'appointment', date: isoDay(daysFromNow(10)), time: '10:30', title: 'Consultation',
        reminderEnabled: true, reminderOffset: '1day', createdAt: NOW.toISOString(), updatedAt: NOW.toISOString(),
      });
      await M.pregnancyHealth().saveHealthReminder({
        id: 'h-1', kind: 'vitamin', name: 'Acide folique', time: '08:00', repeat: 'daily', enabled: true,
        createdAt: NOW.toISOString(), updatedAt: NOW.toISOString(),
      });
      await M.pregnancyCustom().saveCustomReminder({
        id: 'c-1', title: 'Marcher', date: isoDay(daysFromNow(1)), time: '11:00', repeat: 'daily', enabled: true,
        createdAt: NOW.toISOString(), updatedAt: NOW.toISOString(),
      });
    },
    hydrate: async () => {
      await hydrateObjective();
      await M.pregnancyPrefs().hydratePregnancyDating();
      await M.pregnancySettings().hydratePregnancyNotificationSettings();
    },
    run: async () => {
      await M.pregnancyScheduling().syncPregnancyNotificationsForActiveObjective();
    },
  },
  {
    name: 'qadaa (post-Ramadan reminder)',
    sources: ['awa:qadaa:ledger:v1', '@hawa/confirmed-period-history', '@hawa/qadaa-post-ramadan-reminder/v1'],
    seed: async () => {
      M.onboarding().setSpiritualMarkersEnabled(true);
      await M.confirmed().recordConfirmedPeriodEnd(daysFromNow(-200), daysFromNow(-196));
      await M.ledger().addManualQadaaEntry({quantity: 3, year: 2016, yearSystem: 'gregorian'});
      await settle();
      // the first valid sync is what creates the reminder-state record
      await M.qadaaScheduling().syncQadaaReminderNotification();
      await settle();
    },
    hydrate: async () => {
      await M.onboarding().hydrateSpiritualMarkersEnabled();
      await M.confirmed().hydrateConfirmedPeriodHistory();
      await M.ledger().hydrateQadaaLedger();
      await (require('../../state/qadaaReminderNotificationStore') as typeof import('../../state/qadaaReminderNotificationStore')).hydrateQadaaReminderNotificationState();
    },
    run: async () => {
      await M.qadaaScheduling().syncQadaaReminderNotification();
    },
  },
];

beforeAll(() => {
  jest.useFakeTimers({now: NOW, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask']});
});

afterAll(() => {
  jest.useRealTimers();
  jest.resetModules();
  M.secure().setStructuredEncryptionEnabled(false);
});

beforeEach(async () => {
  await AsyncStorage.clear();
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
});

const takeKeyAway = async () => {
  const stored = await Keychain.getGenericPassword({service: STRUCTURED_KEY_SERVICE});
  if (!stored) {throw new Error('fixture: no structured key was ever created');}
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  return async () => {
    await Keychain.setGenericPassword(stored.username, stored.password, {service: STRUCTURED_KEY_SERVICE});
  };
};

describe.each(SCENARIOS)('$name', scenario => {
  /** Schedule calls made while seeding (some scenarios run their first valid sync there). */
  const seedValid = async (): Promise<number> => {
    coldStart();
    await scenario.seed();
    await settle();
    return nativeCalls().scheduled;
  };

  it('fixture sanity: with valid data a restart + sync does schedule reminders', async () => {
    const seeded = await seedValid();
    for (const source of scenario.sources) {
      expect(await AsyncStorage.getItem(source)).not.toBeNull();
    }
    coldStart();
    await scenario.hydrate();
    await settle();
    await scenario.run();
    await settle();
    // a sync that finds its persisted schedule still correct reuses it (Nifas, Qadaa), so count the seeding phase too
    expect(seeded + nativeCalls().scheduled).toBeGreaterThan(0);
  });

  it.each(scenario.sources)('corrupted ciphertext of %s: nothing is scheduled and nothing is cancelled', async source => {
    await seedValid();
    const corrupted = await corruptCiphertext(source);

    const secure = coldStart();
    await scenario.hydrate();
    await settle();
    await scenario.run();
    await settle();

    expect(nativeCalls()).toEqual({scheduled: 0, cancelled: 0});
    expect(secure.isStructuredKeyUnavailable(source)).toBe(true);
    // and the unreadable record itself is exactly as it was
    expect(await AsyncStorage.getItem(source)).toBe(corrupted);
  });

  it('lost key (every record unreadable): nothing is scheduled and nothing is cancelled; the next launch after the outage syncs normally', async () => {
    await seedValid();
    const restoreKey = await takeKeyAway();

    const secure = coldStart();
    await scenario.hydrate();
    await settle();
    await scenario.run();
    await settle();
    expect(nativeCalls()).toEqual({scheduled: 0, cancelled: 0});
    expect(secure.isAnyStructuredDataUnavailable()).toBe(true);

    // the outage ends; the next launch hydrates and syncs against readable data again
    await restoreKey();
    const recovered = coldStart();
    await scenario.hydrate();
    await settle();
    await scenario.run();
    await settle();
    expect(recovered.isAnyStructuredDataUnavailable()).toBe(false);
  });
});
