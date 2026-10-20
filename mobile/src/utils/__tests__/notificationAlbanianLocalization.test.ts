// Albanian notification localization: every notification text exists in Albanian (not English), the
// reminder schedulers rebuild the SAME id at the SAME instant with Albanian text after a language change, and
// real user-generated content (a vitamin name, a custom reminder's title/description, an appointment title) is never
// translated. The scheduler is the same chokepoint the other languages use; only the text changes.
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
import {en} from '../../i18n/locales/en';
import {sq} from '../../i18n/locales/sq';
import {setAppLanguage} from '../../state/themePreferences';

jest.mock('../../services/pregnancyNotifications', () => {
  const mockBooleanSchedule = jest.fn();
  return {
    scheduleLocalNotification: mockBooleanSchedule,
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
  hydrateActiveObjective: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../state/contraceptionPreferences', () => ({getContraceptionPreferences: jest.fn()}));
jest.mock('../../state/menopausePreferences', () => ({getMenopausePreferences: jest.fn()}));

const mockSchedule = scheduleLocalNotification as jest.Mock;
const mockCancel = cancelLocalNotification as jest.Mock;
const mockActiveObjective = getActiveObjective as jest.Mock;
const mockContraceptionPrefs = getContraceptionPreferences as jest.Mock;
const mockMenopausePrefs = getMenopausePreferences as jest.Mock;

type AnyRecord = Record<string, unknown>;
const leaves = (obj: AnyRecord, prefix = ''): Array<[string, string]> =>
  Object.entries(obj).flatMap(([key, value]) => {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object' ? leaves(value as AnyRecord, keyPath) : [[keyPath, String(value)] as [string, string]];
  });
const albanianValue = (keyPath: string): string => (i18n.t(keyPath, {lng: 'sq'}) as string);
const englishValue = (keyPath: string): string => (i18n.t(keyPath, {lng: 'en'}) as string);

beforeEach(async () => {
  jest.clearAllMocks();
  mockSchedule.mockResolvedValue(true);
  mockCancel.mockResolvedValue(undefined);
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
});

describe('every notification string exists in Albanian', () => {
  const groups = ['notifications', 'notificationPermission', 'pregnancyNotifications', 'cycleReminders', 'contraceptionReminders',
    'menopauseReminders', 'postpartumReminders', 'miscarriageReminders', 'pregnancyReminders'];
  const sqLeaves = leaves(sq as AnyRecord).filter(([keyPath]) => groups.some(group => keyPath.startsWith(`${group}.`)));
  const enMap = new Map(leaves(en as AnyRecord));

  it('covers the notification titles/bodies, the permission guidance and each objective’s reminder settings', () => {
    expect(sqLeaves.length).toBeGreaterThan(150);
    groups.forEach(group => {
      expect(sqLeaves.some(([keyPath]) => keyPath.startsWith(`${group}.`))).toBe(true);
    });
  });

  it('each value is translated and none is a leftover English sentence', () => {
    const leftovers = sqLeaves
      .filter(([keyPath, value]) => {
        if (value.trim() === '') {return false;}
        const source = enMap.get(keyPath) ?? enMap.get(keyPath.replace(/_(one|few|many|other)$/, '_other'));
        return source !== undefined && source === value && /[A-Za-z]{4,}/.test(value) && value.trim().split(/\s+/).length > 1;
      })
      .map(([keyPath, value]) => `${keyPath}: ${value}`);
    expect(leftovers).toEqual([]);
  });

  it('keeps the {{variables}} the schedulers pass (name, count, date, time, type…)', () => {
    const enMap2 = new Map(leaves(en as AnyRecord));
    const placeholders = (value: string) => (value.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? []).sort().join('|');
    const wrong = sqLeaves.filter(([keyPath, value]) => {
      const source = enMap2.get(keyPath) ?? enMap2.get(keyPath.replace(/_(one|few|many|other)$/, '_other'));
      return source !== undefined && placeholders(source) !== placeholders(value);
    });
    expect(wrong.map(([k]) => k)).toEqual([]);
  });

  it('the fixed scheduler titles differ from English', () => {
    for (const key of ['notifications.pregnancy.vitaminTitle', 'notifications.pregnancy.customReminderFallbackBody', 'notifications.menopause.dailyTracking.title', 'notifications.menopause.treatment.title']) {
      expect(albanianValue(key)).not.toBe(englishValue(key));
    }
  });

  it('the notification channel name and the privacy-safe generic texts are Albanian', () => {
    for (const key of ['notifications.channelName', 'notifications.fallbackTitle', 'notifications.fallbackBody', 'notifications.privacyGenericBody']) {
      expect(albanianValue(key)).not.toBe(englishValue(key));
    }
  });
});

describe('syncContraceptionReminder — Albanian', () => {
  it('rebuilds the same id/time with Albanian text after a language change', async () => {
    mockActiveObjective.mockReturnValue('contraception');
    mockContraceptionPrefs.mockReturnValue({method: 'pill', remindersEnabled: true, reminderTime: '08:30'});
    await syncContraceptionReminder();
    const enCall = mockSchedule.mock.calls[0][0];

    await i18n.changeLanguage('sq');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    mockActiveObjective.mockReturnValue('contraception');
    mockContraceptionPrefs.mockReturnValue({method: 'pill', remindersEnabled: true, reminderTime: '08:30'});
    await syncContraceptionReminder();
    const sqCall = mockSchedule.mock.calls[0][0];

    expect(sqCall.id).toBe(enCall.id);
    expect(sqCall.fireDate).toEqual(enCall.fireDate);
    expect(sqCall.title).not.toBe('');
    expect(sqCall.title).not.toBe(enCall.title);
    expect(sqCall.body).not.toBe('');
  });
});

describe('syncMenopauseReminders — Albanian', () => {
  it('rebuilds both reminders with Albanian text, same ids and times', async () => {
    const prefs = {
      hormonalTreatmentStatus: 'track',
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '21:00',
      treatmentReminderEnabled: true,
      treatmentReminderTime: '07:00',
    };
    mockActiveObjective.mockReturnValue('menopause');
    mockMenopausePrefs.mockReturnValue(prefs);
    await syncMenopauseReminders();
    const enDaily = mockSchedule.mock.calls.find(([c]) => c.id === 'menopause-daily-tracking-reminder')![0];
    const enTreatment = mockSchedule.mock.calls.find(([c]) => c.id === 'menopause-treatment-reminder')![0];

    await i18n.changeLanguage('sq');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    mockActiveObjective.mockReturnValue('menopause');
    mockMenopausePrefs.mockReturnValue(prefs);
    await syncMenopauseReminders();
    const sqDaily = mockSchedule.mock.calls.find(([c]) => c.id === 'menopause-daily-tracking-reminder')![0];
    const sqTreatment = mockSchedule.mock.calls.find(([c]) => c.id === 'menopause-treatment-reminder')![0];

    expect(sqDaily.fireDate).toEqual(enDaily.fireDate);
    expect(sqDaily.title).toBe(albanianValue('notifications.menopause.dailyTracking.title'));
    expect(sqDaily.title).not.toBe('');
    expect(sqTreatment.fireDate).toEqual(enTreatment.fireDate);
    expect(sqTreatment.title).toBe(albanianValue('notifications.menopause.treatment.title'));
    expect(sqTreatment.title).not.toBe('');
  });
});

describe('Pregnancy reminders — Albanian, user content untouched', () => {
  const vitamin: HealthReminder = {
    id: 'v1',
    kind: 'vitamin',
    name: 'Vitamin D – 2 Tropfen',
    enabled: true,
    time: '09:00',
    repeat: 'daily',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('translates the fixed vitamin title but never the real vitamin name', async () => {
    await i18n.changeLanguage('sq');
    await syncHealthReminder(vitamin);
    const call = mockSchedule.mock.calls[0][0];
    expect(call.title).toBe(albanianValue('notifications.pregnancy.vitaminTitle'));
    expect(call.title).not.toBe('');
    expect(call.body).toBe('Vitamin D – 2 Tropfen');
  });

  it('never translates a custom reminder’s title/description, only the fallback body', async () => {
    const custom: CustomReminder = {
      id: 'c1',
      title: 'Hebamme anrufen',
      description: 'Praxisnummer: 555-1234',
      enabled: true,
      date: '2026-01-01',
      time: '10:00',
      repeat: 'once',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await i18n.changeLanguage('sq');
    await syncCustomReminder(custom);
    expect(mockSchedule.mock.calls[0][0].title).toBe('Hebamme anrufen');
    expect(mockSchedule.mock.calls[0][0].body).toBe('Praxisnummer: 555-1234');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    await syncCustomReminder({...custom, id: 'c2', description: ''});
    expect(mockSchedule.mock.calls[0][0].body).toBe(albanianValue('notifications.pregnancy.customReminderFallbackBody'));
    expect(mockSchedule.mock.calls[0][0].body).not.toBe(englishValue('notifications.pregnancy.customReminderFallbackBody'));
  });

  it('an appointment reminder gets the Albanian fixed title and keeps the real event title', async () => {
    const appointment: PregnancyMedicalEvent = {
      id: 'e1',
      type: 'appointment',
      title: 'Dr. Amrani – Ultraschall',
      date: '2026-01-10',
      time: '14:00',
      reminderEnabled: true,
      reminderOffset: '1day',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await setPregnancyNotificationSettings({
      weeklyUpdateEnabled: true,
      dailyJournalEnabled: false,
      dailyJournalTime: '20:00',
      appointmentsEnabled: true,
      examsEnabled: true,
      defaultAppointmentReminderOffset: '1day',
      defaultExamReminderOffset: '1day',
    });
    await syncEventReminder(appointment);
    const enCall = mockSchedule.mock.calls[0][0];
    await i18n.changeLanguage('sq');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    await syncEventReminder(appointment);
    const sqCall = mockSchedule.mock.calls[0][0];
    expect(sqCall.id).toBe(enCall.id);
    expect(sqCall.fireDate).toEqual(enCall.fireDate);
    expect(sqCall.title).not.toBe('');
    expect(sqCall.title).not.toBe(enCall.title);
    expect(sqCall.body).toContain('Dr. Amrani – Ultraschall');
  });
});
