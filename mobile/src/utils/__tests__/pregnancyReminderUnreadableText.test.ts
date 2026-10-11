import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {resyncAllPregnancyNotifications} from '../pregnancyReminderScheduling';
import {__resetNotificationServiceForTests} from '../../services/pregnancyNotifications';
import {clearAesKeyCache} from '../../services/secureAesKeyStore';
import {setActiveObjective} from '../../state/onboardingPreferences';
import {setPregnancyDating} from '../../state/pregnancyPreferences';
import {setPregnancyNotificationSettings} from '../../state/pregnancyNotificationSettingsStore';
import {saveCustomReminder} from '../../state/pregnancyCustomRemindersStore';
import {saveHealthReminder} from '../../state/pregnancyHealthRemindersStore';
import {fakeNotifeeState, resetFakeNotifee, scheduledIds} from '../../testUtils/fakeNotifee';

// Phase 2 — F16: a reminder whose text cannot be decrypted must never become a BLANK notification.
//
// The reminder's title/description (custom) and name (medicine, vitamin) are field-level encrypted; when the key
// cannot be read (the phone is locked while a headless task re-syncs, a Keychain error) the store answers with a
// blank. Scheduling from that blank used to REPLACE the good trigger with one whose title/body is empty — a reminder
// that fires and says nothing. Now an unreadable reminder is left exactly as it is, and re-armed from the real text
// the next time the key is readable.
//
// Real stores, real scheduler and chokepoint, stateful fake notifee. It proves AWA's JavaScript; it does not prove
// how Android's Keystore behaves on a locked phone.
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);

const CUSTOM_SERVICE = 'com.hawa.private.pregnancy-custom-reminders.encryption-key';
const HEALTH_SERVICE = 'com.hawa.private.pregnancy-health-reminders.encryption-key';

const getGenericPassword = Keychain.getGenericPassword as unknown as jest.Mock;
const originalGet = getGenericPassword.getMockImplementation() as (options?: {service?: string}) => Promise<unknown>;

const keychainFailsFor = (...services: string[]) => {
  clearAesKeyCache();
  getGenericPassword.mockImplementation(async (options?: {service?: string}) => {
    if (options?.service && services.includes(options.service)) {throw new Error('keystore locked');}
    return originalGet(options);
  });
};
const keychainWorks = () => {
  clearAesKeyCache();
  getGenericPassword.mockImplementation(originalGet);
};

const NOW = new Date();
const tomorrow = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 1);
const tomorrowKey = tomorrow.toLocaleDateString('en-CA');
const stamp = NOW.toISOString();

const triggerOf = (id: string) => fakeNotifeeState.triggers.get(id);
const everyCreatedText = () =>
  (require('@notifee/react-native').default.createTriggerNotification as jest.Mock).mock.calls.map(
    ([notification]: [{title?: string; body?: string}]) => ({title: notification.title, body: notification.body}),
  );

beforeEach(async () => {
  keychainWorks();
  await AsyncStorage.clear();
  await Keychain.resetGenericPassword({service: CUSTOM_SERVICE});
  await Keychain.resetGenericPassword({service: HEALTH_SERVICE});
  clearAesKeyCache();
  resetFakeNotifee();
  __resetNotificationServiceForTests();

  await setActiveObjective('pregnancy');
  await setPregnancyDating({method: 'lastPeriod', date: new Date(NOW.getTime() - 70 * 86_400_000).toISOString()});
  await setPregnancyNotificationSettings({
    weeklyUpdateEnabled: false,
    dailyJournalEnabled: false,
    dailyJournalTime: '20:00',
    appointmentsEnabled: true,
    examsEnabled: true,
    defaultAppointmentReminderOffset: '1day',
    defaultExamReminderOffset: '1day',
  });
});

afterAll(() => {
  keychainWorks();
});

describe('custom reminder', () => {
  const seed = () =>
    saveCustomReminder({
      id: 'c1',
      title: 'Prise de sang',
      description: 'Etre a jeun',
      date: tomorrowKey,
      time: '08:00',
      repeat: 'once',
      enabled: true,
      createdAt: stamp,
      updatedAt: stamp,
    });

  it('scheduled normally: the notification carries her title and description', async () => {
    await seed();
    await resyncAllPregnancyNotifications();

    expect(triggerOf('pregnancy-custom-c1')?.notification).toMatchObject({title: 'Prise de sang', body: 'Etre a jeun'});
  });

  it('title unreadable at resync: the good trigger stays EXACTLY as it was — not blanked, not cancelled', async () => {
    await seed();
    await resyncAllPregnancyNotifications();
    const before = JSON.stringify(triggerOf('pregnancy-custom-c1'));
    (require('@notifee/react-native').default.createTriggerNotification as jest.Mock).mockClear();

    keychainFailsFor(CUSTOM_SERVICE);
    await resyncAllPregnancyNotifications();

    expect(scheduledIds()).toContain('pregnancy-custom-c1');
    expect(JSON.stringify(triggerOf('pregnancy-custom-c1'))).toBe(before);
    expect(everyCreatedText().filter(text => !text.title || !text.title.trim())).toEqual([]);
  });

  it('never unreadable-then-scheduled: with no trigger yet, nothing is created from a blank title', async () => {
    await seed();
    keychainFailsFor(CUSTOM_SERVICE);

    await resyncAllPregnancyNotifications();

    expect(scheduledIds()).not.toContain('pregnancy-custom-c1');
    expect(everyCreatedText().filter(text => !text.title || !text.title.trim())).toEqual([]);
  });

  it('recovery: when the key is readable again the very next resync schedules it with the real text', async () => {
    await seed();
    keychainFailsFor(CUSTOM_SERVICE);
    await resyncAllPregnancyNotifications();
    expect(scheduledIds()).not.toContain('pregnancy-custom-c1');

    keychainWorks();
    await resyncAllPregnancyNotifications();

    expect(triggerOf('pregnancy-custom-c1')?.notification).toMatchObject({title: 'Prise de sang', body: 'Etre a jeun'});
  });

  it('a DISABLED reminder is still cancelled even when its title is unreadable (her explicit choice stands)', async () => {
    await seed();
    await resyncAllPregnancyNotifications();
    expect(scheduledIds()).toContain('pregnancy-custom-c1');

    // She switches it off while the key happens to be unreadable.
    keychainFailsFor(CUSTOM_SERVICE);
    const {getCustomReminders} = require('../../state/pregnancyCustomRemindersStore');
    const [unreadable] = await getCustomReminders();
    await saveCustomReminder({...unreadable, enabled: false});
    await resyncAllPregnancyNotifications();

    expect(scheduledIds()).not.toContain('pregnancy-custom-c1');
  });
});

describe('medicine / vitamin reminder', () => {
  const seed = () =>
    saveHealthReminder({
      id: 'h1',
      kind: 'medication',
      name: 'Acide folique',
      time: '09:00',
      repeat: 'daily',
      enabled: true,
      createdAt: stamp,
      updatedAt: stamp,
    });

  it('name unreadable at resync: the trigger keeps its body (not replaced by an empty one)', async () => {
    await seed();
    await resyncAllPregnancyNotifications();
    expect(triggerOf('pregnancy-health-h1')?.notification).toMatchObject({body: 'Acide folique'});
    const before = JSON.stringify(triggerOf('pregnancy-health-h1'));

    keychainFailsFor(HEALTH_SERVICE);
    await resyncAllPregnancyNotifications();

    expect(JSON.stringify(triggerOf('pregnancy-health-h1'))).toBe(before);
  });

  it('with no trigger yet, a blank name schedules nothing, and the next readable resync schedules it', async () => {
    await seed();
    keychainFailsFor(HEALTH_SERVICE);
    await resyncAllPregnancyNotifications();
    expect(scheduledIds()).not.toContain('pregnancy-health-h1');

    keychainWorks();
    await resyncAllPregnancyNotifications();

    expect(triggerOf('pregnancy-health-h1')?.notification).toMatchObject({body: 'Acide folique'});
  });
});
