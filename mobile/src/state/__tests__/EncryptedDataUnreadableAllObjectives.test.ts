import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {STRUCTURED_KEY_SERVICE, isStructuredEnvelope} from '../../services/structuredEncryption';

// REGRESSION COVERAGE — an UNREADABLE encrypted record is never turned into a fabricated default state.
//
// For every objective's real store(s): seed a VALID encrypted record through the store's own writer, then make it
// unreadable (corrupted ciphertext / key lost) and restart the app (jest.resetModules() — storage and Keychain persist,
// every module-level memo is gone, exactly like a cold start). Then assert, through the real store functions:
//   a. the read surfaces unavailability (throws StructuredDataUnavailableError, or yields exactly the neutral
//      "never had data" state AND the key is recorded as unavailable) — never a partly invented state;
//   b. a user edit through the real writer leaves the stored ciphertext BYTE-IDENTICAL;
//   c. after the cause goes away (key restored) and the user taps "Try again", a store that still holds a default
//      in-memory state can NOT overwrite the real record (no data loss), and the data is intact after a restart.
// Fixtures only — every value below is invented.

type Secure = typeof import('../../services/secureAsyncStorage');

const M = {
  secure: () => require('../../services/secureAsyncStorage') as Secure,
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

const corruptCiphertext = async (key: string): Promise<string> => {
  const stored = (await AsyncStorage.getItem(key)) as string;
  const envelope = JSON.parse(stored) as {c: string};
  envelope.c = `${envelope.c.slice(0, -1)}${envelope.c.endsWith('0') ? '1' : '0'}`;
  const corrupted = JSON.stringify(envelope);
  await AsyncStorage.setItem(key, corrupted);
  return corrupted;
};

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

describe('an unreadable encrypted record is never turned into a fabricated default state (all eight objectives)', () => {
  describe.each(CASES)('$objective — $store', c => {
    const neverHadData = async (): Promise<unknown> => {
      await AsyncStorage.clear();
      await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
      coldStart();
      return safeView(c);
    };

    const seedAndRestart = async () => {
      coldStart();
      await c.seed();
      await settle();
      const stored = await rawOf(c.key);
      expect(stored).not.toBeNull();
      expect(isStructuredEnvelope(stored as string)).toBe(true);
      return stored as string;
    };

    it('fixture sanity: the seeded record is readable after a restart and differs from "never had data"', async () => {
      const empty = await neverHadData();
      expect(c.hasSeed(empty)).toBe(false);
      await seedAndRestart();
      coldStart();
      const seeded = await safeView(c);
      expect(seeded).not.toBe(UNAVAILABLE);
      expect(c.hasSeed(seeded)).toBe(true);
    });

    it('corrupted ciphertext: reads surface unavailability, never a partial default; ciphertext is never overwritten', async () => {
      const empty = await neverHadData();
      await seedAndRestart();
      const corrupted = await corruptCiphertext(c.key);

      const secure = coldStart();
      const view = await safeView(c);
      expect(c.hasSeed(view)).toBe(false);
      if (view !== UNAVAILABLE) {expect(view).toEqual(empty);}
      expect(secure.isStructuredKeyUnavailable(c.key)).toBe(true);
      expect(secure.getUnavailableStructuredKeys().find(item => item.key === c.key)?.reason).toBe('authentication-failed');

      await attemptWrite(c);
      expect(await rawOf(c.key)).toBe(corrupted);

      // "Try again" does not make a corrupted record readable, and must not open the door to an overwrite either.
      await M.recovery().retryStructuredAccess();
      await attemptWrite(c);
      expect(await rawOf(c.key)).toBe(corrupted);
    });

    it('lost key: same guarantees, and a temporary outage followed by "Try again" never destroys the record', async () => {
      const empty = await neverHadData();
      const original = await seedAndRestart();
      const restoreKey = await takeKeyAway();

      const secure = coldStart();
      const view = await safeView(c);
      expect(c.hasSeed(view)).toBe(false);
      if (view !== UNAVAILABLE) {expect(view).toEqual(empty);}
      expect(secure.isStructuredKeyUnavailable(c.key)).toBe(true);
      expect(['key-lost', 'key-missing']).toContain(secure.getUnavailableStructuredKeys().find(item => item.key === c.key)?.reason);

      await attemptWrite(c);
      expect(await rawOf(c.key)).toBe(original);

      // the outage ends and the user taps "Try again" while the store may still hold its default in-memory state
      await restoreKey();
      await M.recovery().retryStructuredAccess();
      await attemptWrite(c);

      // a restart: nothing seeded was lost, whether the edit was applied (after a fresh read) or refused
      coldStart();
      const after = await safeView(c);
      expect(after).not.toBe(UNAVAILABLE);
      expect(c.hasSeed(after)).toBe(true);
    });
  });
});
