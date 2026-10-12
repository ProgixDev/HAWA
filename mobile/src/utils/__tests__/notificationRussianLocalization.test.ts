// Russian notification localization: every notification text exists in Russian (Cyrillic, not English), the
// reminder schedulers rebuild the SAME id at the SAME instant with Russian text after a language change, and
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
import {ru} from '../../i18n/locales/ru';
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
const CYRILLIC = /[А-Яа-яЁё]/;
const russianValue = (keyPath: string): string => (i18n.t(keyPath, {lng: 'ru'}) as string);

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

describe('every notification string exists in Russian', () => {
  const groups = ['notifications', 'notificationPermission', 'pregnancyNotifications', 'cycleReminders', 'contraceptionReminders',
    'menopauseReminders', 'postpartumReminders', 'miscarriageReminders', 'pregnancyReminders'];
  const ruLeaves = leaves(ru as AnyRecord).filter(([keyPath]) => groups.some(group => keyPath.startsWith(`${group}.`)));
  const enMap = new Map(leaves(en as AnyRecord));

  it('covers the notification titles/bodies, the permission guidance and each objective’s reminder settings', () => {
    expect(ruLeaves.length).toBeGreaterThan(150);
    groups.forEach(group => {
      expect(ruLeaves.some(([keyPath]) => keyPath.startsWith(`${group}.`))).toBe(true);
    });
  });

  it('each value is Russian text (Cyrillic) and none is a leftover English sentence', () => {
    const leftovers = ruLeaves
      .filter(([keyPath, value]) => {
        if (value.trim() === '') {return false;}
        if (!CYRILLIC.test(value)) {return true;}
        const source = enMap.get(keyPath) ?? enMap.get(keyPath.replace(/_(one|few|many|other)$/, '_other'));
        return source !== undefined && source === value && /[A-Za-z]{4,}/.test(value);
      })
      .map(([keyPath, value]) => `${keyPath}: ${value}`);
    expect(leftovers).toEqual([]);
  });

  it('keeps the {{variables}} the schedulers pass (name, count, date, time, type…)', () => {
    const enMap2 = new Map(leaves(en as AnyRecord));
    const placeholders = (value: string) => (value.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? []).sort().join('|');
    const wrong = ruLeaves.filter(([keyPath, value]) => {
      const source = enMap2.get(keyPath) ?? enMap2.get(keyPath.replace(/_(one|few|many|other)$/, '_other'));
      return source !== undefined && placeholders(source) !== placeholders(value);
    });
    expect(wrong.map(([k]) => k)).toEqual([]);
  });

  it('the notification channel name and the privacy-safe generic texts are Russian', () => {
    for (const key of ['notifications.channelName', 'notifications.fallbackTitle', 'notifications.fallbackBody', 'notifications.privacyGenericBody']) {
      expect(russianValue(key)).toMatch(CYRILLIC);
    }
  });
});

describe('syncContraceptionReminder — Russian', () => {
  it('rebuilds the same id/time with Russian text after a language change', async () => {
    mockActiveObjective.mockReturnValue('contraception');
    mockContraceptionPrefs.mockReturnValue({method: 'pill', remindersEnabled: true, reminderTime: '08:30'});
    await syncContraceptionReminder();
    const enCall = mockSchedule.mock.calls[0][0];

    await i18n.changeLanguage('ru');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    mockActiveObjective.mockReturnValue('contraception');
    mockContraceptionPrefs.mockReturnValue({method: 'pill', remindersEnabled: true, reminderTime: '08:30'});
    await syncContraceptionReminder();
    const ruCall = mockSchedule.mock.calls[0][0];

    expect(ruCall.id).toBe(enCall.id);
    expect(ruCall.fireDate).toEqual(enCall.fireDate);
    expect(ruCall.title).toMatch(CYRILLIC);
    expect(ruCall.title).not.toBe(enCall.title);
    expect(ruCall.body).toMatch(CYRILLIC);
  });
});

describe('syncMenopauseReminders — Russian', () => {
  it('rebuilds both reminders with Russian text, same ids and times', async () => {
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

    await i18n.changeLanguage('ru');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    mockActiveObjective.mockReturnValue('menopause');
    mockMenopausePrefs.mockReturnValue(prefs);
    await syncMenopauseReminders();
    const ruDaily = mockSchedule.mock.calls.find(([c]) => c.id === 'menopause-daily-tracking-reminder')![0];
    const ruTreatment = mockSchedule.mock.calls.find(([c]) => c.id === 'menopause-treatment-reminder')![0];

    expect(ruDaily.fireDate).toEqual(enDaily.fireDate);
    expect(ruDaily.title).toBe(russianValue('notifications.menopause.dailyTracking.title'));
    expect(ruDaily.title).toMatch(CYRILLIC);
    expect(ruTreatment.fireDate).toEqual(enTreatment.fireDate);
    expect(ruTreatment.title).toBe(russianValue('notifications.menopause.treatment.title'));
    expect(ruTreatment.title).toMatch(CYRILLIC);
  });
});

describe('Pregnancy reminders — Russian, user content untouched', () => {
  const vitamin: HealthReminder = {
    id: 'v1',
    kind: 'vitamin',
    name: 'Витамин D — 2 капли',
    enabled: true,
    time: '09:00',
    repeat: 'daily',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('translates the fixed vitamin title but never the real vitamin name', async () => {
    await i18n.changeLanguage('ru');
    await syncHealthReminder(vitamin);
    const call = mockSchedule.mock.calls[0][0];
    expect(call.title).toBe(russianValue('notifications.pregnancy.vitaminTitle'));
    expect(call.title).toMatch(CYRILLIC);
    expect(call.body).toBe('Витамин D — 2 капли');
  });

  it('never translates a custom reminder’s title/description, only the fallback body', async () => {
    const custom: CustomReminder = {
      id: 'c1',
      title: 'Позвонить акушерке',
      description: 'Номер кабинета: 555-1234',
      enabled: true,
      date: '2026-01-01',
      time: '10:00',
      repeat: 'once',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await i18n.changeLanguage('ru');
    await syncCustomReminder(custom);
    expect(mockSchedule.mock.calls[0][0].title).toBe('Позвонить акушерке');
    expect(mockSchedule.mock.calls[0][0].body).toBe('Номер кабинета: 555-1234');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    await syncCustomReminder({...custom, id: 'c2', description: ''});
    expect(mockSchedule.mock.calls[0][0].body).toBe(russianValue('notifications.pregnancy.customReminderFallbackBody'));
    expect(mockSchedule.mock.calls[0][0].body).toMatch(CYRILLIC);
  });

  it('an appointment reminder gets the Russian fixed title and keeps the real event title', async () => {
    const appointment: PregnancyMedicalEvent = {
      id: 'e1',
      type: 'appointment',
      title: 'Доктор Амрани — УЗИ',
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
    await i18n.changeLanguage('ru');
    jest.clearAllMocks();
    mockSchedule.mockResolvedValue(true);
    await syncEventReminder(appointment);
    const ruCall = mockSchedule.mock.calls[0][0];
    expect(ruCall.id).toBe(enCall.id);
    expect(ruCall.fireDate).toEqual(enCall.fireDate);
    expect(ruCall.title).toMatch(CYRILLIC);
    expect(ruCall.title).not.toBe(enCall.title);
    expect(ruCall.body).toContain('Доктор Амрани — УЗИ');
  });
});
