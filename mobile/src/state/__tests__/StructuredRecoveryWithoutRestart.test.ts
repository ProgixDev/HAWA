import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {STRUCTURED_KEY_SERVICE, isStructuredEnvelope} from '../../services/structuredEncryption';

// REGRESSION COVERAGE — "Try again" recovers WITHOUT an app restart, and the legacy-note migration is interruption-safe.
//
// 1. For every owner-only memoised store: the record becomes unreadable (Keychain outage), the app keeps running, the
//    cause clears and the user taps "Try again" (retryStructuredAccess). The store must re-read the encrypted record,
//    notify its subscribers, and a later edit must keep the fields it did not touch. The ciphertext is never changed
//    while the record is unreadable, and defaults are never written over it.
// 2. Profile isolation after a retry (owner vs daughter).
// 3. Migration interruption: a failure in the middle of a migrateLegacyPlain*Notes leaves exactly the original data; a
//    retry migrates it; running it again changes nothing.
// Fixtures only — every value below is invented.

type Secure = typeof import('../../services/secureAsyncStorage');

const M = {
  secure: () => require('../../services/secureAsyncStorage') as Secure,
  active: () => require('../activeProfileStore') as typeof import('../activeProfileStore'),
  profiles: () => require('../managedProfilesStore') as typeof import('../managedProfilesStore'),
  recovery: () => require('../../services/structuredKeyRecovery') as typeof import('../../services/structuredKeyRecovery'),
  onboarding: () => require('../onboardingPreferences') as typeof import('../onboardingPreferences'),
  confirmed: () => require('../confirmedPeriodHistoryStore') as typeof import('../confirmedPeriodHistoryStore'),
  cycleReminders: () => require('../cycleReminderPreferences') as typeof import('../cycleReminderPreferences'),
  journal: () => require('../dailyJournalStore') as typeof import('../dailyJournalStore'),
  qadaa: () => require('../qadaaStore') as typeof import('../qadaaStore'),
  ledger: () => require('../qadaaLedgerStore') as typeof import('../qadaaLedgerStore'),
  conception: () => require('../conceptionPreferences') as typeof import('../conceptionPreferences'),
  contraception: () => require('../contraceptionPreferences') as typeof import('../contraceptionPreferences'),
  intake: () => require('../contraceptionIntakeHistoryStore') as typeof import('../contraceptionIntakeHistoryStore'),
  contraJournal: () => require('../contraceptionJournalStore') as typeof import('../contraceptionJournalStore'),
  contraEvents: () => require('../contraceptionEventStore') as typeof import('../contraceptionEventStore'),
  irregularPrefs: () => require('../irregularPreferences') as typeof import('../irregularPreferences'),
  irregularJournal: () => require('../irregularJournalStore') as typeof import('../irregularJournalStore'),
  menopausePrefs: () => require('../menopausePreferences') as typeof import('../menopausePreferences'),
  menopauseJournal: () => require('../menopauseJournalStore') as typeof import('../menopauseJournalStore'),
  pregnancyPrefs: () => require('../pregnancyPreferences') as typeof import('../pregnancyPreferences'),
  pregnancyJournal: () => require('../pregnancyJournalStore') as typeof import('../pregnancyJournalStore'),
  pregnancyEvents: () => require('../pregnancyMedicalEventsStore') as typeof import('../pregnancyMedicalEventsStore'),
  pregnancyHealth: () => require('../pregnancyHealthRemindersStore') as typeof import('../pregnancyHealthRemindersStore'),
  pregnancyCustom: () => require('../pregnancyCustomRemindersStore') as typeof import('../pregnancyCustomRemindersStore'),
  pregnancySettings: () => require('../pregnancyNotificationSettingsStore') as typeof import('../pregnancyNotificationSettingsStore'),
  postpartumPrefs: () => require('../postpartumPreferences') as typeof import('../postpartumPreferences'),
  postpartumJournal: () => require('../postpartumJournalStore') as typeof import('../postpartumJournalStore'),
  lochia: () => require('../postpartumLochiaStore') as typeof import('../postpartumLochiaStore'),
  nifas: () => require('../postpartumNifasReminderStore') as typeof import('../postpartumNifasReminderStore'),
  miscarriagePrefs: () => require('../miscarriagePreferences') as typeof import('../miscarriagePreferences'),
  miscarriageJournal: () => require('../miscarriageJournalStore') as typeof import('../miscarriageJournalStore'),
  generalHealth: () => require('../generalHealthStore') as typeof import('../generalHealthStore'),
  personalInfo: () => require('../personalInformationStore') as typeof import('../personalInformationStore'),
};

const UNAVAILABLE = '__STRUCTURED_DATA_UNAVAILABLE__';

const settle = async () => {
  for (let index = 0; index < 25; index += 1) {
    await new Promise<void>(resolve => setImmediate(resolve));
  }
};

/** A cold start: every module-level memo is gone, storage and Keychain are untouched. */
const coldStart = (): Secure => {
  jest.resetModules();
  const secure = M.secure();
  secure.setStructuredEncryptionEnabled(true);
  secure.resetStructuredStorageForTests();
  return secure;
};

const rawOf = (key: string) => AsyncStorage.getItem(key);

/** Takes the structured key out of the Keychain; the returned function puts the SAME key back (a temporary outage). */
const takeKeyAway = async (): Promise<() => Promise<void>> => {
  const stored = await Keychain.getGenericPassword({service: STRUCTURED_KEY_SERVICE});
  if (!stored) {throw new Error('fixture: no structured key was ever created');}
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  return async () => {
    await Keychain.setGenericPassword(stored.username, stored.password, {service: STRUCTURED_KEY_SERVICE});
  };
};

type StoreCase = {
  objective: string;
  store: string;
  /** The storage key of the OWNER profile's record. */
  key: string;
  seed: () => Promise<void>;
  /** The read the app performs, followed by the synchronous getters screens use. JSON-serialisable. */
  view: () => Promise<unknown>;
  /** True when the seeded data is (still) visible in a view. */
  hasSeed: (view: any) => boolean;
  /** A user edit through the store's real writer. */
  write: () => Promise<unknown>;
};

const day = (year: number, month: number, date: number, hour = 12) => new Date(year, month, date, hour);

const CASES: StoreCase[] = [
  // ---------------------------------------------------------------- cycle ("Suivre mon cycle")
  {
    objective: 'cycle', store: 'onboardingPreferences (cycle settings + period history)', key: '@hawa/cycle-preferences',
    seed: async () => {
      M.onboarding().setCyclePreferences({lastPeriodStart: day(2026, 8, 10), periodDuration: 6, cycleDuration: 31, regularity: 'yes'});
    },
    view: async () => {
      const o = M.onboarding();
      await o.hydrateCyclePreferences();
      return {
        confirmed: o.getHasConfirmedCycleData(),
        durationConfirmed: o.getHasConfirmedCycleDuration(),
        recorded: o.getRecordedPeriodHistory(),
        cycleDuration: o.getCyclePreferences().cycleDuration,
        periodDuration: o.getCyclePreferences().periodDuration,
      };
    },
    hasSeed: v => v.confirmed === true && v.cycleDuration === 31 && v.recorded.length >= 1,
    write: async () => {
      M.onboarding().addPeriodOccurrence(day(2026, 9, 11));
      await settle();
    },
  },
  {
    objective: 'cycle', store: 'onboardingPreferences (confirmed period end time)', key: '@hawa/period-end-datetime',
    seed: async () => {
      await M.onboarding().setPeriodEndDateTime(day(2026, 8, 15, 18));
    },
    view: async () => ({end: (await M.onboarding().hydratePeriodEndDateTime())?.toISOString() ?? null}),
    hasSeed: v => v.end !== null,
    write: async () => {
      await M.onboarding().setPeriodEndDateTime(day(2026, 9, 20, 9));
    },
  },
  {
    objective: 'cycle', store: 'confirmedPeriodHistoryStore', key: '@hawa/confirmed-period-history',
    seed: async () => {
      await M.confirmed().recordConfirmedPeriodEnd(day(2026, 8, 10), day(2026, 8, 14));
    },
    view: async () => ({history: await M.confirmed().hydrateConfirmedPeriodHistory()}),
    hasSeed: v => v.history.length >= 1,
    write: async () => {
      await M.confirmed().recordConfirmedPeriodEnd(day(2026, 9, 8), day(2026, 9, 12));
    },
  },
  {
    objective: 'cycle', store: 'cycleReminderPreferences', key: '@hawa/cycle-reminder-preferences/v1',
    seed: async () => {
      await M.cycleReminders().setCycleReminderPreferences({
        upcomingPeriodEnabled: true, upcomingPeriodDaysBefore: 3, periodStartCheckEnabled: true,
        dailyJournalEnabled: true, dailyJournalTime: '21:30', fertileWindowEnabled: true, ovulationEnabled: true,
      });
    },
    view: async () => M.cycleReminders().hydrateCycleReminderPreferences(),
    hasSeed: v => v.dailyJournalTime === '21:30' && v.upcomingPeriodDaysBefore === 3,
    write: async () => {
      const store = M.cycleReminders();
      await store.setCycleReminderPreferences({...store.getCycleReminderPreferences(), ovulationEnabled: false});
    },
  },
  {
    objective: 'cycle/conceive/irregular/menopause (shared daily journal)', store: 'dailyJournalStore', key: '@hawa/daily-journal/v1',
    seed: async () => {
      await M.journal().saveJournalSection('2026-09-20', 'mood', {level: 'sad', energy: 1, stress: 4, irritability: 2, motivation: 1});
    },
    view: async () => ({entry: (await M.journal().getJournalEntry('2026-09-20')) ?? null}),
    hasSeed: v => v.entry?.mood?.level === 'sad',
    write: async () => {
      await M.journal().saveJournalSection('2026-09-22', 'flow', {intensity: 'light'});
    },
  },
  // ---------------------------------------------------------------- conceive
  {
    objective: 'conceive', store: 'conceptionPreferences', key: '@hawa/conception-preferences',
    seed: async () => {
      await M.conception().setConceptionPreferences({
        tryingDuration: '3_to_6_months', ovulationAwareness: 'often', indicators: ['temperature', 'lh_tests'],
        reminders: {fertile_window: true, estimated_ovulation: true, temperature: true, lh_test: true, daily_journal: true},
      });
    },
    view: async () => M.conception().hydrateConceptionPreferences(),
    hasSeed: v => v.tryingDuration === '3_to_6_months' && v.reminders.lh_test === true,
    write: async () => {
      await M.conception().setConceptionPreferences({ovulationAwareness: 'not_really'});
    },
  },
  // ---------------------------------------------------------------- contraception
  {
    objective: 'contraception', store: 'contraceptionPreferences (method / pill schedule / reminder)', key: '@hawa/contraception-preferences',
    seed: async () => {
      await M.contraception().setContraceptionPreferences({
        method: 'pill', methodStartDate: '2026-06-01', pillScheduleType: 'cyclic', activeDays: 21, breakDays: 7,
        remindersEnabled: true, reminderTime: '08:15',
      });
    },
    view: async () => M.contraception().hydrateContraceptionPreferences(),
    hasSeed: v => v.method === 'pill' && v.methodStartDate === '2026-06-01',
    write: async () => {
      await M.contraception().setContraceptionPreferences({reminderTime: '23:45'});
    },
  },
  {
    objective: 'contraception', store: 'contraceptionIntakeHistoryStore (pill taken/late/missed)', key: '@hawa/contraception-intake-history/v1',
    seed: async () => {
      await M.intake().setContraceptionIntakeStatus('2026-09-18', 'missed', 'pill');
      await M.intake().setContraceptionIntakeStatus('2026-09-19', 'taken', 'pill');
    },
    view: async () => ({records: await M.intake().hydrateContraceptionIntakeHistory()}),
    hasSeed: v => Object.keys(v.records).length >= 2,
    write: async () => {
      await M.intake().setContraceptionIntakeStatus('2026-09-20', 'taken', 'pill');
      await settle();
    },
  },
  {
    objective: 'contraception', store: 'contraceptionJournalStore', key: '@hawa/contraception-journal/v1',
    seed: async () => {
      await M.contraJournal().saveContraceptionJournalField('2026-09-11', 'feelings', ['Fatigue']);
    },
    view: async () => ({entries: await M.contraJournal().hydrateContraceptionJournal()}),
    hasSeed: v => Object.keys(v.entries).length >= 1,
    write: async () => {
      await M.contraJournal().saveContraceptionJournalField('2026-09-12', 'feelings', ['Nausées']);
    },
  },
  {
    objective: 'contraception', store: 'contraceptionEventStore (ring / patch events)', key: '@hawa/contraception-event-history/v1',
    seed: async () => {
      await M.contraEvents().addContraceptionEvent('2026-09-01', 'ring_insertion');
    },
    view: async () => ({events: await M.contraEvents().hydrateContraceptionEvents()}),
    hasSeed: v => Object.keys(v.events).length >= 1,
    write: async () => {
      await M.contraEvents().addContraceptionEvent('2026-09-22', 'ring_removal');
      await settle();
    },
  },
  // ---------------------------------------------------------------- irregular / SOPK
  {
    objective: 'irregular (SOPK)', store: 'irregularPreferences', key: '@hawa/irregular-preferences/v1',
    seed: async () => {
      await M.irregularPrefs().setIrregularPreferences({
        cyclePattern: 'very_variable', lastPeriodDate: '2026-08-30', trackedItems: ['acne', 'weight'],
        reminders: {dailyJournalEnabled: true, dailyJournalTime: '20:10', unrecordedPeriodEnabled: true},
      });
    },
    view: async () => M.irregularPrefs().hydrateIrregularPreferences(),
    hasSeed: v => v.cyclePattern === 'very_variable' && v.lastPeriodDate === '2026-08-30',
    write: async () => {
      await M.irregularPrefs().setIrregularPreferences({trackedItems: ['pain']});
    },
  },
  {
    objective: 'irregular (SOPK)', store: 'irregularJournalStore', key: '@hawa/irregular-journal/v1',
    seed: async () => {
      await M.irregularJournal().saveIrregularJournalField('2026-08-20', 'acne', 'Léger');
    },
    view: async () => ({entries: await M.irregularJournal().hydrateIrregularJournal()}),
    hasSeed: v => Object.keys(v.entries).length >= 1,
    write: async () => {
      await M.irregularJournal().saveIrregularJournalField('2026-08-21', 'pain', 'Modérée');
    },
  },
  // ---------------------------------------------------------------- menopause
  {
    objective: 'menopause', store: 'menopausePreferences', key: '@hawa/menopause-preferences/v1',
    seed: async () => {
      await M.menopausePrefs().setMenopausePreferences({
        stage: 'perimenopause', trackedSymptoms: ['hot_flashes'], hormonalTreatmentStatus: 'track', labTracking: 'both',
        dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '19:00',
        treatmentReminderEnabled: true, treatmentReminderTime: '08:00',
      });
    },
    view: async () => M.menopausePrefs().hydrateMenopausePreferences(),
    hasSeed: v => v.hormonalTreatmentStatus === 'track' && v.treatmentReminderTime === '08:00',
    write: async () => {
      await M.menopausePrefs().setMenopauseStage('menopause');
    },
  },
  {
    objective: 'menopause', store: 'menopauseJournalStore (entries)', key: '@hawa/menopause-journal/v1',
    seed: async () => {
      await M.menopauseJournal().saveMenopauseJournalField('2026-07-04', 'symptoms', ['hot_flashes']);
    },
    view: async () => {
      await M.menopauseJournal().hydrateMenopauseJournal();
      return {entries: M.menopauseJournal().getAllMenopauseJournalEntries()};
    },
    hasSeed: v => Object.keys(v.entries).length >= 1,
    write: async () => {
      await M.menopauseJournal().saveMenopauseJournalField('2026-07-05', 'mood', 'good');
      await settle();
    },
  },
  {
    objective: 'menopause', store: 'menopauseJournalStore (lab results)', key: '@hawa/menopause-lab-results/v1',
    seed: async () => {
      await M.menopauseJournal().addMenopauseLabResult({type: 'estradiol', value: 40, unit: 'pg/mL', date: '2026-07-01'});
      await settle();
    },
    view: async () => {
      await M.menopauseJournal().hydrateMenopauseJournal();
      return {labs: M.menopauseJournal().getMenopauseLabResults()};
    },
    hasSeed: v => v.labs.length >= 1,
    write: async () => {
      await M.menopauseJournal().addMenopauseLabResult({type: 'fsh', value: 55, unit: 'IU/L', date: '2026-07-10'});
      await settle();
    },
  },
  // ---------------------------------------------------------------- pregnancy
  {
    objective: 'pregnancy', store: 'pregnancyPreferences (dating)', key: '@hawa/pregnancy-dating',
    seed: async () => {
      await M.pregnancyPrefs().setPregnancyDating({method: 'dueDate', date: '2027-03-01'});
    },
    view: async () => M.pregnancyPrefs().hydratePregnancyDating(),
    hasSeed: v => v.date !== null,
    write: async () => {
      await M.pregnancyPrefs().setPregnancyDating({method: 'lastPeriod', date: '2026-10-01'});
    },
  },
  {
    objective: 'pregnancy', store: 'pregnancyPreferences (tracking preferences)', key: '@hawa/pregnancy-tracking-preferences',
    seed: async () => {
      await M.pregnancyPrefs().setPregnancyTrackingPreferences(new Set(['weight', 'sleep'] as const));
    },
    view: async () => ({tracked: [...(await M.pregnancyPrefs().hydratePregnancyTrackingPreferences())].sort()}),
    hasSeed: v => v.tracked.length < 9, // the default selects all nine
    write: async () => {
      await M.pregnancyPrefs().setPregnancyTrackingPreferences(new Set(['notes'] as const));
    },
  },
  {
    objective: 'pregnancy', store: 'pregnancyPreferences (reminder preferences)', key: '@hawa/pregnancy-reminder-preferences',
    seed: async () => {
      await M.pregnancyPrefs().setPregnancyReminderPreferences({appointments: false, exams: false, dailyJournal: false, customReminders: false});
    },
    view: async () => M.pregnancyPrefs().hydratePregnancyReminderPreferences(),
    hasSeed: v => v.appointments === false && v.exams === false, // the default enables everything
    write: async () => {
      await M.pregnancyPrefs().setPregnancyReminderPreferences({appointments: false, exams: false, dailyJournal: true, customReminders: false});
    },
  },
  {
    objective: 'pregnancy', store: 'pregnancyJournalStore', key: '@hawa/pregnancy-journal/v1',
    seed: async () => {
      await M.pregnancyJournal().savePregnancyWeight({date: '2026-10-01', valueKg: 64.5, updatedAt: '2026-10-01T10:00:00.000Z'});
    },
    view: async () => ({state: await M.pregnancyJournal().getPregnancyJournalState()}),
    hasSeed: v => v.state.weights.length >= 1,
    write: async () => {
      await M.pregnancyJournal().savePregnancyWeight({date: '2026-10-08', valueKg: 65, updatedAt: '2026-10-08T10:00:00.000Z'});
    },
  },
  {
    objective: 'pregnancy', store: 'pregnancyMedicalEventsStore (appointments / exams)', key: '@hawa/pregnancy-medical-events',
    seed: async () => {
      await M.pregnancyEvents().savePregnancyMedicalEvent({
        id: 'evt-1', type: 'appointment', date: '2026-11-03', time: '10:30', title: 'Consultation',
        reminderEnabled: true, reminderOffset: '1day', createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
      });
    },
    view: async () => ({events: await M.pregnancyEvents().getPregnancyMedicalEvents()}),
    hasSeed: v => v.events.length >= 1,
    write: async () => {
      await M.pregnancyEvents().savePregnancyMedicalEvent({
        id: 'evt-2', type: 'exam', date: '2026-11-20', title: 'Echographie', createdAt: '2026-10-02T10:00:00.000Z', updatedAt: '2026-10-02T10:00:00.000Z',
      });
    },
  },
  {
    objective: 'pregnancy', store: 'pregnancyHealthRemindersStore (vitamins / medication)', key: '@hawa/pregnancy-health-reminders',
    seed: async () => {
      await M.pregnancyHealth().saveHealthReminder({
        id: 'h-1', kind: 'vitamin', name: 'Acide folique', time: '08:00', repeat: 'daily', enabled: true,
        createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
      });
    },
    view: async () => ({reminders: await M.pregnancyHealth().getHealthReminders()}),
    hasSeed: v => v.reminders.length >= 1,
    write: async () => {
      await M.pregnancyHealth().saveHealthReminder({
        id: 'h-2', kind: 'medication', name: 'Fer', time: '09:00', repeat: 'daily', enabled: true,
        createdAt: '2026-10-02T10:00:00.000Z', updatedAt: '2026-10-02T10:00:00.000Z',
      });
    },
  },
  {
    objective: 'pregnancy', store: 'pregnancyCustomRemindersStore', key: '@hawa/pregnancy-custom-reminders',
    seed: async () => {
      await M.pregnancyCustom().saveCustomReminder({
        id: 'c-1', title: 'Boire de l’eau', date: '2026-10-12', time: '10:00', repeat: 'daily', enabled: true,
        createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
      });
    },
    view: async () => ({reminders: await M.pregnancyCustom().getCustomReminders()}),
    hasSeed: v => v.reminders.length >= 1,
    write: async () => {
      await M.pregnancyCustom().saveCustomReminder({
        id: 'c-2', title: 'Marcher', date: '2026-10-13', time: '11:00', repeat: 'once', enabled: true,
        createdAt: '2026-10-02T10:00:00.000Z', updatedAt: '2026-10-02T10:00:00.000Z',
      });
    },
  },
  {
    objective: 'pregnancy', store: 'pregnancyNotificationSettingsStore', key: '@hawa/pregnancy-notification-settings',
    seed: async () => {
      await M.pregnancySettings().setPregnancyNotificationSettings({
        weeklyUpdateEnabled: false, dailyJournalEnabled: true, dailyJournalTime: '07:45', appointmentsEnabled: false,
        examsEnabled: false, defaultAppointmentReminderOffset: '2hours', defaultExamReminderOffset: '30min',
      });
    },
    view: async () => M.pregnancySettings().hydratePregnancyNotificationSettings(),
    hasSeed: v => v.weeklyUpdateEnabled === false && v.appointmentsEnabled === false, // the defaults enable both
    write: async () => {
      const store = M.pregnancySettings();
      await store.setPregnancyNotificationSettings({...store.getPregnancyNotificationSettings(), dailyJournalTime: '21:00'});
    },
  },
  // ---------------------------------------------------------------- postpartum
  {
    objective: 'postpartum', store: 'postpartumPreferences (delivery date / Nifas basis)', key: '@hawa/postpartum-preferences/v1',
    seed: async () => {
      await M.postpartumPrefs().confirmDelivery(day(2026, 8, 1));
    },
    view: async () => M.postpartumPrefs().hydratePostpartumPreferences(),
    hasSeed: v => v.deliveryDate === '2026-09-01',
    write: async () => {
      await M.postpartumPrefs().setFeedingType('mixed');
    },
  },
  {
    objective: 'postpartum', store: 'postpartumJournalStore', key: '@hawa/postpartum-journal/v3',
    seed: async () => {
      await M.postpartumJournal().savePostpartumJournalField('2026-09-10', 'fatigue', 'Modérée');
    },
    view: async () => ({entries: await M.postpartumJournal().hydratePostpartumJournal()}),
    hasSeed: v => Object.keys(v.entries).length >= 1,
    write: async () => {
      await M.postpartumJournal().savePostpartumJournalField('2026-09-11', 'pain', 'Légère');
    },
  },
  {
    objective: 'postpartum', store: 'postpartumLochiaStore (lochia + "ended" date)', key: '@hawa/postpartum-lochia/v1',
    seed: async () => {
      await M.lochia().savePostpartumLochiaEntry('2026-09-04', {flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: ['Aucun']});
      await M.lochia().markPostpartumLochiaEnded('2026-09-20');
    },
    view: async () => {
      const entries = await M.lochia().hydratePostpartumLochia();
      return {entries, tracking: M.lochia().getPostpartumLochiaTracking()};
    },
    hasSeed: v => Object.keys(v.entries).length >= 1 && v.tracking.endedDate === '2026-09-20',
    write: async () => {
      await M.lochia().savePostpartumLochiaEntry('2026-09-21', {flow: 'Très léger', color: 'Brun', consistency: 'Liquide', symptoms: []});
    },
  },
  {
    objective: 'postpartum', store: 'postpartumNifasReminderStore (Nifas J35/J40 schedule + acknowledgement)', key: '@hawa/postpartum-nifas-reminders/v1',
    seed: async () => {
      await M.nifas().setPostpartumNifasReminderState({
        deliveryDate: '2026-09-01', configVersion: 3, warningScheduled: true, referenceScheduled: true,
        warningFireAt: '2026-10-06T09:00:00.000Z', referenceFireAt: '2026-10-11T09:00:00.000Z',
        warningOccurrenceId: 'w-1', referenceOccurrenceId: 'r-1', completionAcknowledged: true,
      });
    },
    view: async () => M.nifas().hydratePostpartumNifasReminderState(),
    hasSeed: v => v.deliveryDate === '2026-09-01' && v.completionAcknowledged === true,
    write: async () => {
      await M.nifas().setPostpartumNifasCompletionAcknowledged('2026-09-01');
    },
  },
  // ---------------------------------------------------------------- loss / miscarriage
  {
    objective: 'loss (miscarriage)', store: 'miscarriagePreferences', key: '@hawa/miscarriage-preferences/v1',
    seed: async () => {
      await M.miscarriagePrefs().setMiscarriagePreferences({
        miscarriageDate: '2026-08-01', bleedingStatus: null, cycleReturnStatus: null, firstReturnedPeriodDate: null,
        tryingAgainStatus: 'soon', dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '18:20',
      });
    },
    view: async () => M.miscarriagePrefs().hydrateMiscarriagePreferences(),
    hasSeed: v => v.miscarriageDate === '2026-08-01' && v.dailyTrackingReminderTime === '18:20',
    write: async () => {
      await M.miscarriagePrefs().setMiscarriageTryingAgainStatus('ready');
    },
  },
  {
    objective: 'loss (miscarriage)', store: 'miscarriageJournalStore', key: '@hawa/miscarriage-journal/v1',
    seed: async () => {
      await M.miscarriageJournal().saveMiscarriageJournalField('2026-09-13', 'physicalSymptoms', ['Fatigue']);
    },
    view: async () => ({entries: await M.miscarriageJournal().hydrateMiscarriageJournal()}),
    hasSeed: v => Object.keys(v.entries).length >= 1,
    write: async () => {
      await M.miscarriageJournal().saveMiscarriageJournalField('2026-09-14', 'bleeding', 'Léger');
    },
  },
  // ---------------------------------------------------------------- shared, not objective specific
  {
    objective: 'all (active objective)', store: 'onboardingPreferences (active objective)', key: '@hawa/active-objective',
    seed: async () => {
      await M.onboarding().setActiveObjective('pregnancy');
    },
    view: async () => ({objective: await M.onboarding().hydrateActiveObjective()}),
    hasSeed: v => v.objective !== 'cycle', // 'cycle' is the default
    write: async () => {
      await M.onboarding().setActiveObjective('conceive');
    },
  },
  {
    objective: 'all (general health)', store: 'generalHealthStore', key: '@awa/general-health/v1',
    seed: async () => {
      await M.generalHealth().updateGeneralHealth({heightCm: 171, weightKg: 58, bloodType: 'B-', allergies: ['Pénicilline']});
    },
    view: async () => ({profile: await M.generalHealth().loadGeneralHealth()}),
    hasSeed: v => v.profile.bloodType === 'B-' && v.profile.allergies.length === 1,
    write: async () => {
      await M.generalHealth().updateGeneralHealth({weightKg: 59});
    },
  },
  {
    objective: 'all (personal information)', store: 'personalInformationStore', key: '@hawa/personal-information/v1',
    seed: async () => {
      await M.personalInfo().updatePersonalInformation({firstName: 'Yasmine', lastName: 'Fixture', birthDate: '1990-01-02'});
    },
    view: async () => ({info: await M.personalInfo().loadPersonalInformation()}),
    hasSeed: v => v.info.firstName === 'Yasmine',
    write: async () => {
      await M.personalInfo().updatePersonalInformation({phone: '+000 0 00 00 00 00'});
    },
  },
];

const isUnavailableError = (error: unknown) => (error as {name?: string})?.name === 'StructuredDataUnavailableError';

const safeView = async (c: StoreCase): Promise<unknown> => {
  try {
    const view = await c.view();
    await settle();
    return JSON.parse(JSON.stringify(view));
  } catch (error) {
    if (isUnavailableError(error)) {return UNAVAILABLE;}
    throw error;
  }
};

/** True when the view shows the seeded data (an unavailable read is never "seeded"). */
const seeded = (c: StoreCase, view: unknown): boolean => view !== UNAVAILABLE && c.hasSeed(view);

const attemptWrite = async (c: StoreCase) => {
  try {
    await c.write();
  } catch {
    // a refused write is the expected outcome; what matters is what is STORED
  }
  await settle();
};

beforeEach(async () => {
  await AsyncStorage.clear();
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
});

afterAll(() => {
  jest.resetModules();
  M.secure().setStructuredEncryptionEnabled(false);
});

// The owner-only stores that memoise their first read (the profile-scoped stores re-read on a profile reload and are
// covered by EncryptedDataUnreadableAllObjectives; the on-demand stores never memoise).
const MEMOISED_OWNER_KEYS = new Set([
  '@hawa/conception-preferences',
  '@hawa/contraception-preferences',
  '@hawa/contraception-intake-history/v1',
  '@hawa/contraception-journal/v1',
  '@hawa/contraception-event-history/v1',
  '@hawa/irregular-preferences/v1',
  '@hawa/irregular-journal/v1',
  '@hawa/menopause-preferences/v1',
  '@hawa/menopause-journal/v1',
  '@hawa/menopause-lab-results/v1',
  '@hawa/pregnancy-dating',
  '@hawa/pregnancy-tracking-preferences',
  '@hawa/pregnancy-reminder-preferences',
  '@hawa/pregnancy-notification-settings',
  '@hawa/postpartum-preferences/v1',
  '@hawa/postpartum-journal/v3',
  '@hawa/postpartum-lochia/v1',
  '@hawa/postpartum-nifas-reminders/v1',
  '@hawa/miscarriage-preferences/v1',
  '@hawa/miscarriage-journal/v1',
  '@hawa/active-objective',
]);
const RECOVERABLE = CASES.filter(c => MEMOISED_OWNER_KEYS.has(c.key));

describe('recovery without an app restart (owner-only memoised stores)', () => {
  it('covers every memoised owner store listed', () => {
    expect(RECOVERABLE.map(c => c.key).sort()).toEqual([...MEMOISED_OWNER_KEYS].sort());
  });

  describe.each(RECOVERABLE)('$objective — $store', c => {
    const outage = async () => {
      coldStart();
      await c.seed();
      await settle();
      const original = (await rawOf(c.key)) as string;
      expect(isStructuredEnvelope(original)).toBe(true);
      const restoreKey = await takeKeyAway();
      const secure = coldStart();
      const during = await safeView(c);
      expect(seeded(c, during)).toBe(false);
      expect(secure.isStructuredKeyUnavailable(c.key)).toBe(true);
      await attemptWrite(c);
      expect(await rawOf(c.key)).toBe(original);
      return {original, restoreKey, secure};
    };

    it('"Try again" re-reads the record in the running app; ciphertext untouched until the user edits; the edit keeps the other fields', async () => {
      const {original, restoreKey, secure} = await outage();

      await restoreKey();
      await M.recovery().retryStructuredAccess(); // NO restart: same module instances, same memoised stores
      expect(await rawOf(c.key)).toBe(original); // the retry itself never writes
      expect(secure.isStructuredKeyUnavailable(c.key)).toBe(false);

      // The retry re-hydrated the store (it did not just forget the failure): the state the store merges edits onto is
      // the REAL record, not defaults, and the key accepts the store's write again.
      const view = await safeView(c);
      expect(seeded(c, view)).toBe(true);
      await attemptWrite(c);
      expect(await rawOf(c.key)).not.toBe(original);

      coldStart();
      const after = await safeView(c);
      expect(after).not.toBe(UNAVAILABLE);
      expect(seeded(c, after)).toBe(true);
    });

    it('without a tap: a later read after the cause cleared also recovers (the failed read is not latched as "hydrated with defaults")', async () => {
      const {original, restoreKey} = await outage();
      await restoreKey();
      const view = await safeView(c);
      expect(view).not.toBe(UNAVAILABLE);
      expect(seeded(c, view)).toBe(true);
      expect(await rawOf(c.key)).toBe(original);
    });

    it('still unavailable after "Try again": nothing is fabricated, nothing is written, a later retry succeeds', async () => {
      const {original, restoreKey, secure} = await outage();

      await M.recovery().retryStructuredAccess(); // the cause is still there
      await safeView(c); // (an edit the store refused may still be echoed in memory; what matters is storage + availability)
      expect(secure.isStructuredKeyUnavailable(c.key)).toBe(true);
      await attemptWrite(c);
      expect(await rawOf(c.key)).toBe(original);

      await restoreKey();
      await M.recovery().retryStructuredAccess();
      expect(seeded(c, await safeView(c))).toBe(true);
      expect(await rawOf(c.key)).toBe(original);
    });
  });

  describe('subscribers (the UI-facing state) are refreshed by Try again', () => {
    type Probe = {
      name: string;
      seed: () => Promise<unknown>;
      hydrate: () => Promise<unknown>;
      subscribe: (listener: () => void) => () => void;
      current: () => unknown;
      expected: unknown;
      isDefault: (value: unknown) => boolean;
    };
    const PROBES: Probe[] = [
      {
        name: 'pregnancy dating',
        seed: () => M.pregnancyPrefs().setPregnancyDating({method: 'dueDate', date: '2027-03-01'}),
        hydrate: () => M.pregnancyPrefs().hydratePregnancyDating(),
        subscribe: listener => M.pregnancyPrefs().subscribePregnancyDating(listener),
        current: () => M.pregnancyPrefs().getPregnancyDating(),
        expected: {method: 'dueDate', date: '2027-03-01'},
        isDefault: value => (value as {date: string | null}).date === null,
      },
      {
        name: 'active objective',
        seed: () => M.onboarding().setActiveObjective('pregnancy'),
        hydrate: () => M.onboarding().hydrateActiveObjective(),
        subscribe: listener => M.onboarding().subscribeActiveObjective(listener),
        current: () => M.onboarding().getActiveObjective(),
        expected: 'pregnancy',
        isDefault: value => value === 'cycle',
      },
      {
        name: 'miscarriage preferences',
        seed: () =>
          M.miscarriagePrefs().setMiscarriagePreferences({
            miscarriageDate: '2026-08-01', bleedingStatus: null, cycleReturnStatus: null, firstReturnedPeriodDate: null,
            tryingAgainStatus: 'soon', dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '18:20',
          }),
        hydrate: () => M.miscarriagePrefs().hydrateMiscarriagePreferences(),
        subscribe: listener => M.miscarriagePrefs().subscribeMiscarriagePreferences(listener),
        current: () => M.miscarriagePrefs().getMiscarriagePreferences().miscarriageDate,
        expected: '2026-08-01',
        isDefault: value => value === null,
      },
    ];

    it.each(PROBES)('$name', async probe => {
      coldStart();
      await probe.seed();
      await settle();
      const restoreKey = await takeKeyAway();

      const secure = coldStart();
      await probe.hydrate();
      await settle();
      expect(probe.isDefault(probe.current())).toBe(true);
      expect(secure.getUnavailableStructuredKeys().length).toBeGreaterThan(0);

      let notified = 0;
      const unsubscribe = probe.subscribe(() => {
        notified += 1;
      });
      await restoreKey();
      await M.recovery().retryStructuredAccess();
      await settle();
      unsubscribe();

      expect(notified).toBeGreaterThanOrEqual(1);
      expect(probe.current()).toEqual(probe.expected);
      expect(secure.getUnavailableStructuredKeys()).toEqual([]);
    });
  });
});

describe('profile isolation after a retry (owner vs daughter)', () => {
  const OWNER = 'owner';
  const mood = (level: string, note: string) => ({level, energy: 2, stress: 2, irritability: 1, motivation: 2, note});

  it('each profile gets its own data back; neither record is touched; an edit on one never reaches the other', async () => {
    coldStart();
    await M.active().hydrateActiveProfileId();
    await M.pregnancyPrefs().setPregnancyDating({method: 'dueDate', date: '2027-03-01'}); // owner-only store
    await M.journal().saveJournalSection('2026-09-20', 'mood', mood('sad', 'owner note') as never);
    const daughter = await M.profiles().addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2012-05-01', hasHadFirstPeriod: false});
    await M.active().setActiveProfileId(daughter.id);
    await settle();
    await M.journal().saveJournalSection('2026-08-21', 'mood', mood('good', 'daughter note') as never);
    await M.active().setActiveProfileId(OWNER);
    await settle();

    const ownerKey = '@hawa/daily-journal/v1';
    const daughterKey = `@hawa/daily-journal/v1:profile:${daughter.id}`;
    const ownerCipher = (await rawOf(ownerKey)) as string;
    const daughterCipher = (await rawOf(daughterKey)) as string;
    expect(isStructuredEnvelope(ownerCipher)).toBe(true);
    expect(isStructuredEnvelope(daughterCipher)).toBe(true);

    const restoreKey = await takeKeyAway();
    const secure = coldStart();
    await M.active().hydrateActiveProfileId();
    await M.profiles().hydrateManagedProfiles();
    await M.pregnancyPrefs().hydratePregnancyDating();
    await expect(M.journal().getJournalEntry('2026-09-20')).rejects.toMatchObject({name: 'StructuredDataUnavailableError'});
    await M.active().setActiveProfileId(daughter.id);
    await settle();
    await expect(M.journal().getJournalEntry('2026-08-21')).rejects.toMatchObject({name: 'StructuredDataUnavailableError'});
    expect(M.pregnancyPrefs().getPregnancyDating().date).toBeNull(); // defaults, flagged unavailable
    expect(secure.isStructuredKeyUnavailable('@hawa/pregnancy-dating')).toBe(true);

    await restoreKey();
    await M.recovery().retryStructuredAccess();
    await settle();

    // active = daughter: ONLY her record is visible
    expect((await M.journal().getJournalEntry('2026-08-21'))?.mood?.note).toBe('daughter note');
    expect(await M.journal().getJournalEntry('2026-09-20')).toBeUndefined();
    // the owner-only store was re-read by the retry whichever profile is active
    expect(M.pregnancyPrefs().getPregnancyDating().date).toBe('2027-03-01');

    await M.active().setActiveProfileId(OWNER);
    await settle();
    expect((await M.journal().getJournalEntry('2026-09-20'))?.mood?.note).toBe('owner note');
    expect(await M.journal().getJournalEntry('2026-08-21')).toBeUndefined();

    // nothing was rewritten by the outage or by the retry
    expect(await rawOf(ownerKey)).toBe(ownerCipher);
    expect(await rawOf(daughterKey)).toBe(daughterCipher);

    // an edit on the daughter's profile after the retry leaves the owner's ciphertext untouched
    await M.active().setActiveProfileId(daughter.id);
    await settle();
    await M.journal().saveJournalSection('2026-08-22', 'mood', mood('calm', 'second daughter note') as never);
    expect(await rawOf(ownerKey)).toBe(ownerCipher);
    expect(await rawOf(daughterKey)).not.toBe(daughterCipher);
    expect((await M.journal().getJournalEntry('2026-08-21'))?.mood?.note).toBe('daughter note');
  });
});

describe('legacy-note migration is interruption-safe', () => {
  type MigrationCase = {
    name: string;
    key: string;
    legacy: unknown;
    secrets: string[];
    migrate: () => Promise<void>;
    view: () => Promise<unknown>;
  };

  const MIGRATIONS: MigrationCase[] = [
    {
      name: 'miscarriageJournalStore',
      key: '@hawa/miscarriage-journal/v1',
      legacy: {
        '2026-09-13': {date: '2026-09-13', physicalSymptoms: ['Fatigue'], personalNotes: 'journée difficile', bleedingNote: 'léger ce matin'},
        '2026-09-14': {date: '2026-09-14', bleeding: 'Léger'},
      },
      secrets: ['journée difficile', 'léger ce matin'],
      migrate: () => M.miscarriageJournal().migrateLegacyPlainMiscarriageNotes(),
      view: async () => M.miscarriageJournal().hydrateMiscarriageJournal(),
    },
    {
      name: 'postpartumJournalStore',
      key: '@hawa/postpartum-journal/v3',
      legacy: {'2026-09-10': {date: '2026-09-10', fatigue: 'Modérée', mood: 'Fatiguée', moodNote: 'nuit courte'}},
      secrets: ['nuit courte'],
      migrate: () => M.postpartumJournal().migrateLegacyPlainPostpartumMoodNotes(),
      view: async () => M.postpartumJournal().hydratePostpartumJournal(),
    },
    {
      name: 'postpartumLochiaStore',
      key: '@hawa/postpartum-lochia/v1',
      legacy: {
        entries: {'2026-09-04': {date: '2026-09-04', flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: ['Aucun'], note: 'rien de particulier'}},
        tracking: {endedDate: '2026-09-20'},
      },
      secrets: ['rien de particulier'],
      migrate: () => M.lochia().migrateLegacyPlainPostpartumLochiaNotes(),
      view: async () => {
        const entries = await M.lochia().hydratePostpartumLochia();
        return {entries, tracking: M.lochia().getPostpartumLochiaTracking()};
      },
    },
    {
      name: 'contraceptionJournalStore',
      key: '@hawa/contraception-journal/v1',
      legacy: {'2026-09-11': {date: '2026-09-11', feelings: ['Fatigue'], notes: 'petit mal de tête'}},
      secrets: ['petit mal de tête'],
      migrate: () => M.contraJournal().migrateLegacyPlainContraceptionNotes(),
      view: async () => M.contraJournal().hydrateContraceptionJournal(),
    },
    {
      name: 'dailyJournalStore',
      key: '@hawa/daily-journal/v1',
      legacy: [
        {date: '2026-09-20', mood: {level: 'sad', energy: 1, stress: 4, irritability: 2, motivation: 1, note: 'soirée calme'}},
        {date: '2026-09-21', mood: {level: 'good', energy: 3, stress: 1, irritability: 1, motivation: 3}},
      ],
      secrets: ['soirée calme'],
      migrate: () => M.journal().migrateLegacyPlainDailyJournalNotes(),
      view: async () => M.journal().getAllJournalEntries(),
    },
    {
      name: 'pregnancyJournalStore',
      key: '@hawa/pregnancy-journal/v1',
      legacy: {
        symptoms: [{date: '2026-10-01', symptoms: ['Nausées'], note: 'surtout le matin', updatedAt: '2026-10-01T10:00:00.000Z'}],
        weights: [{date: '2026-10-01', valueKg: 64.5, updatedAt: '2026-10-01T10:00:00.000Z'}],
        medicalInformationHistory: [{note: 'tension normale', updatedAt: '2026-10-02T10:00:00.000Z'}],
      },
      secrets: ['surtout le matin', 'tension normale'],
      migrate: () => M.pregnancyJournal().migrateLegacyPlainPregnancyNotes(),
      view: async () => M.pregnancyJournal().getPregnancyJournalState(),
    },
    {
      name: 'pregnancyMedicalEventsStore',
      key: '@hawa/pregnancy-medical-events',
      legacy: [{id: 'evt-1', type: 'appointment', date: '2026-11-03', time: '10:30', title: 'Consultation', notes: 'apporter le carnet', createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z'}],
      secrets: ['apporter le carnet'],
      migrate: () => M.pregnancyEvents().migrateLegacyPlainPregnancyMedicalEventNotes(),
      view: async () => M.pregnancyEvents().getPregnancyMedicalEvents(),
    },
    {
      name: 'pregnancyCustomRemindersStore',
      key: '@hawa/pregnancy-custom-reminders',
      legacy: [{id: 'c-1', title: 'boire beaucoup', description: 'un grand verre', date: '2026-10-12', time: '10:00', repeat: 'daily', enabled: true, createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z'}],
      secrets: ['boire beaucoup', 'un grand verre'],
      migrate: () => M.pregnancyCustom().migrateLegacyPlainPregnancyCustomReminders(),
      view: async () => M.pregnancyCustom().getCustomReminders(),
    },
    {
      name: 'pregnancyHealthRemindersStore',
      key: '@hawa/pregnancy-health-reminders',
      legacy: [{id: 'h-1', kind: 'vitamin', name: 'acide folique', time: '08:00', repeat: 'daily', enabled: true, createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z'}],
      secrets: ['acide folique'],
      migrate: () => M.pregnancyHealth().migrateLegacyPlainPregnancyHealthReminders(),
      view: async () => M.pregnancyHealth().getHealthReminders(),
    },
  ];

  describe.each(MIGRATIONS)('$name', m => {
    const legacyText = JSON.stringify(m.legacy);

    const expectNoSecretAtRest = async () => {
      const readable = (await M.secure().default.getItem(m.key)) as string;
      for (const secret of m.secrets) {expect(readable).not.toContain(secret);}
      const raw = (await rawOf(m.key)) as string;
      for (const secret of m.secrets) {expect(raw).not.toContain(secret);}
    };

    it('a write interrupted in the middle leaves exactly the original record; the retry migrates; a re-run changes nothing', async () => {
      await AsyncStorage.setItem(m.key, legacyText);
      coldStart();
      const storage = (require('@react-native-async-storage/async-storage') as {default: {setItem: jest.Mock}}).default;
      storage.setItem.mockImplementationOnce(async () => {
        throw new Error('interrupted');
      });
      await expect(m.migrate()).resolves.toBeUndefined();
      expect(await rawOf(m.key)).toBe(legacyText); // byte-identical: nothing lost, nothing half-written

      // next launch
      coldStart();
      await m.migrate();
      const migrated = (await rawOf(m.key)) as string;
      expect(migrated).not.toBe(legacyText);
      await expectNoSecretAtRest();

      coldStart();
      const view = JSON.parse(JSON.stringify(await m.view()));
      expect(view).toEqual(JSON.parse(legacyText));

      // idempotent: a third run neither rewrites nor changes anything
      coldStart();
      await m.migrate();
      expect(await rawOf(m.key)).toBe(migrated);
    });

    it('an unreadable (Keychain outage) record is never replaced by defaults; after the outage the migration completes', async () => {
      coldStart();
      await M.secure().default.setItem(m.key, legacyText); // an envelope that still contains the legacy plaintext fields
      const original = (await rawOf(m.key)) as string;
      expect(isStructuredEnvelope(original)).toBe(true);
      const restoreKey = await takeKeyAway();

      const secure = coldStart();
      await expect(m.migrate()).resolves.toBeUndefined();
      expect(await rawOf(m.key)).toBe(original);
      expect(secure.isStructuredKeyUnavailable(m.key)).toBe(true);

      await restoreKey();
      coldStart();
      await m.migrate();
      expect(await rawOf(m.key)).not.toBe(original);
      await expectNoSecretAtRest();
      coldStart();
      expect(JSON.parse(JSON.stringify(await m.view()))).toEqual(JSON.parse(legacyText));
    });
  });

  it('a record that changed between the read and the write (a user save) is not overwritten by the migration', async () => {
    const key = '@hawa/miscarriage-journal/v1';
    const legacy = {'2026-09-13': {date: '2026-09-13', personalNotes: 'ancien texte'}};
    await AsyncStorage.setItem(key, JSON.stringify(legacy));
    coldStart();
    const store = M.secure().default;
    const original = store.getItem;
    let reads = 0;
    // the second read of the record (the migration's "has it changed?" check) sees a record saved by the user meanwhile
    const changed = JSON.stringify({...legacy, '2026-09-15': {date: '2026-09-15', bleeding: 'Léger'}});
    (store as {getItem: typeof original}).getItem = async k => {
      const value = await original(k);
      if (k === key) {
        reads += 1;
        if (reads === 2) {return changed;}
      }
      return value;
    };
    await M.miscarriageJournal().migrateLegacyPlainMiscarriageNotes();
    (store as {getItem: typeof original}).getItem = original;
    expect(await rawOf(key)).toBe(JSON.stringify(legacy));
  });
});
