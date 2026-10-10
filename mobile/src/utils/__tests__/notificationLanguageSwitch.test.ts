// Phase 4 localization — language-switch coverage for the reminder-
// scheduling files that had no dedicated notification-content test file
// before Phase 4: Contraception, Menopause, and Pregnancy's health/custom/
// event reminders (Pregnancy's weekly-update/daily-journal reminders are
// covered directly in App.tsx's own regression battery via
// pregnancyRemindersLifecycle.test.ts / pregnancyNotificationsObjectiveSwitch.test.ts).
// Each block proves the same two things required by the Phase 4 spec: (1)
// re-syncing after a language change rebuilds the SAME notification id at
// the SAME fire time, only the text changes; (2) real user-generated content
// (a vitamin/medication name, a custom reminder's own title/description) is
// never translated.
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {getActiveObjective} from '../../state/onboardingPreferences';
import {getContraceptionPreferences} from '../../state/contraceptionPreferences';
import {getMenopausePreferences} from '../../state/menopausePreferences';
import {syncContraceptionReminder} from '../contraceptionReminderScheduling';
import {syncMenopauseReminders} from '../menopauseReminderScheduling';
import {syncHealthReminder, syncCustomReminder} from '../pregnancyReminderScheduling';
import {syncEventReminder} from '../pregnancyEventReminders';
import {setPregnancyNotificationSettings} from '../../state/pregnancyNotificationSettingsStore';
import type {HealthReminder} from '../../state/pregnancyHealthRemindersStore';
import type {CustomReminder} from '../../state/pregnancyCustomRemindersStore';
import type {PregnancyMedicalEvent} from '../../state/pregnancyMedicalEventsStore';
import i18n from '../../i18n';
import {setAppLanguage} from '../../state/themePreferences';

jest.mock('../../services/pregnancyNotifications', () => {
  const mockBooleanSchedule = jest.fn();
  return {
    scheduleLocalNotification: mockBooleanSchedule,
    // The appointment/exam reminder schedules through the detailed variant; it delegates to the same jest.fn so
    // every assertion below (made on scheduleLocalNotification) keeps covering that path.
    scheduleLocalNotificationWithResult: async (input: {fireDate: Date}) => {
      const scheduled = await mockBooleanSchedule(input);
      return scheduled === false
        ? {scheduled: false, reason: 'past', fireDate: input.fireDate}
        : {scheduled: true, fireDate: input.fireDate};
    },
    cancelLocalNotification: jest.fn(),
  };
});
jest.mock('../../state/onboardingPreferences', () => ({
  getActiveObjective: jest.fn(),
}));
jest.mock('../../state/contraceptionPreferences', () => ({
  getContraceptionPreferences: jest.fn(),
}));
jest.mock('../../state/menopausePreferences', () => ({
  getMenopausePreferences: jest.fn(),
}));

const mockSchedule = scheduleLocalNotification as jest.Mock;
const mockCancel = cancelLocalNotification as jest.Mock;
const mockActiveObjective = getActiveObjective as jest.Mock;
const mockContraceptionPrefs = getContraceptionPreferences as jest.Mock;
const mockMenopausePrefs = getMenopausePreferences as jest.Mock;

beforeEach(async () => {
  jest.clearAllMocks();
  mockSchedule.mockResolvedValue(true);
  mockCancel.mockResolvedValue(undefined);
  // PHASE 7M: the app's default language is now English (not French) — the
  // afterEach below already restores French after every test, but the very
  // first test in the file runs before any afterEach has fired. Pinning
  // French here too covers that first-test case, matching every other
  // test's starting assumption.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

describe('syncContraceptionReminder — language change', () => {
  it('re-syncing after switching to English reschedules the same id/time with English text', async () => {
    mockActiveObjective.mockReturnValue('contraception');
    mockContraceptionPrefs.mockReturnValue({
      method: 'pill',
      remindersEnabled: true,
      reminderTime: '08:30',
    });

    await syncContraceptionReminder();
    const frCall = mockSchedule.mock.calls[0][0];
    expect(frCall.title).toBe('Rappel de prise');
    expect(frCall.body).toBe('Prends un instant pour ton suivi de contraception.');

    await i18n.changeLanguage('en');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    mockActiveObjective.mockReturnValue('contraception');
    mockContraceptionPrefs.mockReturnValue({
      method: 'pill',
      remindersEnabled: true,
      reminderTime: '08:30',
    });

    await syncContraceptionReminder();
    const enCall = mockSchedule.mock.calls[0][0];

    expect(enCall.id).toBe(frCall.id);
    expect(enCall.fireDate).toEqual(frCall.fireDate);
    expect(enCall.title).toBe('Time for your pill');
    expect(enCall.title).not.toBe(frCall.title);
  });
});

describe('syncMenopauseReminders — language change', () => {
  it('re-syncing after switching to English rebuilds both reminders with English text, same ids/times', async () => {
    mockActiveObjective.mockReturnValue('menopause');
    mockMenopausePrefs.mockReturnValue({
      hormonalTreatmentStatus: 'track',
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '21:00',
      treatmentReminderEnabled: true,
      treatmentReminderTime: '07:00',
    });

    await syncMenopauseReminders();
    const frDaily = mockSchedule.mock.calls.find(([c]) => c.id === 'menopause-daily-tracking-reminder')![0];
    const frTreatment = mockSchedule.mock.calls.find(([c]) => c.id === 'menopause-treatment-reminder')![0];

    await i18n.changeLanguage('en');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    mockActiveObjective.mockReturnValue('menopause');
    mockMenopausePrefs.mockReturnValue({
      hormonalTreatmentStatus: 'track',
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '21:00',
      treatmentReminderEnabled: true,
      treatmentReminderTime: '07:00',
    });

    await syncMenopauseReminders();
    const enDaily = mockSchedule.mock.calls.find(([c]) => c.id === 'menopause-daily-tracking-reminder')![0];
    const enTreatment = mockSchedule.mock.calls.find(([c]) => c.id === 'menopause-treatment-reminder')![0];

    expect(enDaily.fireDate).toEqual(frDaily.fireDate);
    expect(enDaily.title).toBe('Your tracking for today');
    expect(enDaily.title).not.toBe(frDaily.title);

    expect(enTreatment.fireDate).toEqual(frTreatment.fireDate);
    expect(enTreatment.title).toBe('A little reminder');
    expect(enTreatment.title).not.toBe(frTreatment.title);
  });
});

describe('syncHealthReminder (Pregnancy vitamins/medications) — language change, user content untouched', () => {
  const vitamin: HealthReminder = {
    id: 'v1',
    kind: 'vitamin',
    name: 'Vitamine D — 2 gouttes',
    enabled: true,
    time: '09:00',
    repeat: 'daily',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('translates the fixed "Vitamins & supplements" title but never the real vitamin name', async () => {
    await syncHealthReminder(vitamin);
    const frCall = mockSchedule.mock.calls[0][0];
    expect(frCall.title).toBe('Vitamines & compléments');
    expect(frCall.body).toBe('Vitamine D — 2 gouttes');

    await i18n.changeLanguage('en');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);

    await syncHealthReminder(vitamin);
    const enCall = mockSchedule.mock.calls[0][0];

    expect(enCall.id).toBe(frCall.id);
    expect(enCall.title).toBe('Vitamins & supplements');
    expect(enCall.body).toBe('Vitamine D — 2 gouttes'); // user content, unchanged
  });
});

describe('syncCustomReminder (Pregnancy) — language change, user title/description untouched', () => {
  const withDescription: CustomReminder = {
    id: 'c1',
    title: 'Appeler la sage-femme',
    description: 'Numéro du cabinet : 555-1234',
    enabled: true,
    date: '2026-01-01',
    time: '10:00',
    repeat: 'once',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const withoutDescription: CustomReminder = {...withDescription, id: 'c2', description: ''};

  it('never translates the user’s own title/description', async () => {
    await syncCustomReminder(withDescription);
    const frCall = mockSchedule.mock.calls[0][0];
    expect(frCall.title).toBe('Appeler la sage-femme');
    expect(frCall.body).toBe('Numéro du cabinet : 555-1234');

    await i18n.changeLanguage('en');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);

    await syncCustomReminder(withDescription);
    const enCall = mockSchedule.mock.calls[0][0];
    expect(enCall.title).toBe('Appeler la sage-femme');
    expect(enCall.body).toBe('Numéro du cabinet : 555-1234');
  });

  it('translates only the FALLBACK body used when no description was entered', async () => {
    await syncCustomReminder(withoutDescription);
    const frCall = mockSchedule.mock.calls[0][0];
    expect(frCall.body).toBe('Rappel personnalisé');

    await i18n.changeLanguage('en');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);

    await syncCustomReminder(withoutDescription);
    const enCall = mockSchedule.mock.calls[0][0];
    expect(enCall.body).toBe('Custom reminder');
  });
});

describe('syncEventReminder (Pregnancy appointments/exams) — language change, event title untouched', () => {
  const appointment: PregnancyMedicalEvent = {
    id: 'e1',
    type: 'appointment',
    title: 'Dr. Amrani — échographie',
    date: '2026-01-10',
    time: '14:00',
    reminderEnabled: true,
    reminderOffset: '1day',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    await setPregnancyNotificationSettings({
      weeklyUpdateEnabled: true,
      dailyJournalEnabled: false,
      dailyJournalTime: '20:00',
      appointmentsEnabled: true,
      examsEnabled: true,
      defaultAppointmentReminderOffset: '1day',
      defaultExamReminderOffset: '1day',
    });
  });

  it('translates the fixed "Upcoming {{type}}" title but never the real event title', async () => {
    await syncEventReminder(appointment);
    const frCall = mockSchedule.mock.calls[0][0];
    expect(frCall.title).toBe('Rendez-vous à venir');
    expect(frCall.body).toContain('Dr. Amrani — échographie');

    await i18n.changeLanguage('en');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);

    await syncEventReminder(appointment);
    const enCall = mockSchedule.mock.calls[0][0];

    expect(enCall.id).toBe(frCall.id);
    expect(enCall.fireDate).toEqual(frCall.fireDate);
    expect(enCall.title).toBe('Upcoming Appointment');
    expect(enCall.body).toContain('Dr. Amrani — échographie'); // user content, unchanged
  });
});
