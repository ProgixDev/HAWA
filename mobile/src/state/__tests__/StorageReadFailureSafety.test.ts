import AsyncStorage from '@react-native-async-storage/async-storage';

// Phase 2 — F15: a storage READ failure (an I/O error, not a decryption failure) must never be mistaken for
// "nothing recorded".
//
// Before: the active-objective store latched its default ('cycle') and the Pregnancy sync then cancelled every
// pregnancy reminder until the next launch; stores that swallowed the error answered "no events" and the next save
// wrote a record built on that emptiness over the real one. Now an unreadable record is "unavailable": writes to it
// are refused, reminders derived from it leave what is scheduled alone, and a later read recovers it.
//
// Real stores, encryption ON, a cold start per scenario, a stateful fake notifee for what is scheduled.
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);
jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  getPrivacySecuritySettings: jest.fn(() => ({
    discreetMode: false,
    discreetNotifications: false,
    hideNotificationPreview: false,
  })),
}));

type Secure = typeof import('../../services/secureAsyncStorage');

const M = {
  secure: () => require('../../services/secureAsyncStorage') as Secure,
  onboarding: () => require('../onboardingPreferences') as typeof import('../onboardingPreferences'),
  events: () => require('../pregnancyMedicalEventsStore') as typeof import('../pregnancyMedicalEventsStore'),
  settings: () => require('../pregnancyNotificationSettingsStore') as typeof import('../pregnancyNotificationSettingsStore'),
  dating: () => require('../pregnancyPreferences') as typeof import('../pregnancyPreferences'),
  schedule: () => require('../../utils/pregnancyReminderScheduling') as typeof import('../../utils/pregnancyReminderScheduling'),
  fake: () => require('../../testUtils/fakeNotifee') as typeof import('../../testUtils/fakeNotifee'),
  notifications: () => require('../../services/pregnancyNotifications') as typeof import('../../services/pregnancyNotifications'),
  recovery: () => require('../../services/structuredKeyRecovery') as typeof import('../../services/structuredKeyRecovery'),
};

const OBJECTIVE_KEY = '@hawa/active-objective';
const EVENTS_KEY = '@hawa/pregnancy-medical-events';

const NOW = new Date();
const tomorrow = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 1);
const STAMP = NOW.toISOString();

const event = (id: string) => ({
  id,
  type: 'appointment' as const,
  date: tomorrow.toLocaleDateString('en-CA'),
  time: '23:00',
  title: `Echographie ${id}`,
  reminderEnabled: true,
  reminderOffset: '1hour' as const,
  createdAt: STAMP,
  updatedAt: STAMP,
});

const coldStart = (): Secure => {
  jest.resetModules();
  const secure = M.secure();
  secure.setStructuredEncryptionEnabled(true);
  secure.resetStructuredStorageForTests();
  M.fake().resetFakeNotifee();
  return secure;
};

/** Makes the raw storage read of `key` reject, as a disk/I-O error would. Returns a function that heals it. */
function failReadsOf(key: string): () => void {
  // The instance the app's modules hold AFTER jest.resetModules() — not the one imported at the top of this file.
  // The AsyncStorage mock's getItem is ALREADY a jest.fn: jest.spyOn + mockRestore would wipe its implementation
  // (it would then answer `undefined` for everything), so its implementation is swapped and put back by hand.
  const appStorage = (require('@react-native-async-storage/async-storage') as {default: typeof AsyncStorage}).default;
  const mocked = appStorage.getItem as unknown as jest.Mock;
  const original = mocked.getMockImplementation() as (requested: string) => Promise<string | null>;
  mocked.mockImplementation(async (requested: string) => {
    if (requested === key) {
      throw new Error('disk I/O error');
    }
    return original(requested);
  });
  return () => {
    mocked.mockImplementation(original);
  };
}

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('active objective', () => {
  it('a failed read is not latched as "Suivre mon cycle": it recovers with the real objective, no restart', async () => {
    coldStart();
    await M.onboarding().setActiveObjective('pregnancy');

    coldStart();
    const heal = failReadsOf(OBJECTIVE_KEY);
    const duringFailure = await M.onboarding().hydrateActiveObjective();
    expect(duringFailure).toBe('cycle'); // the fallback value the UI shows while the record is unavailable
    expect(M.secure().getUnavailableStructuredKeys()).toEqual([{key: OBJECTIVE_KEY, reason: 'read-failed'}]);

    heal();
    await M.recovery().retryStructuredAccess(); // "Try again"
    expect(await M.onboarding().hydrateActiveObjective()).toBe('pregnancy');
    expect(M.secure().getUnavailableStructuredKeys()).toEqual([]);
  });

  it('while it cannot be read, the pregnancy reminders are left exactly as they are (not cancelled as "left the objective")', async () => {
    coldStart();
    await M.onboarding().setActiveObjective('pregnancy');
    await M.dating().setPregnancyDating({method: 'lastPeriod', date: new Date(NOW.getTime() - 70 * 86_400_000).toISOString()});
    await M.events().savePregnancyMedicalEvent(event('a'));
    await M.schedule().resyncAllPregnancyNotifications();
    expect(M.fake().scheduledIds()).toContain('pregnancy-event-a');

    // Process restarts; the objective record cannot be read at that moment.
    coldStart();
    const fake = M.fake();
    // (cold start cleared the fake: re-create what Android would still have pending from before the restart)
    await M.events().savePregnancyMedicalEvent(event('a')).catch(() => undefined);
    fake.fakeNotifeeState.triggers.set('pregnancy-event-a', {
      notification: {id: 'pregnancy-event-a', title: 'x', body: 'y'},
      trigger: {type: 0, timestamp: Date.now() + 3_600_000, alarmManager: {type: 1}},
    });
    const heal = failReadsOf(OBJECTIVE_KEY);

    await M.schedule().syncPregnancyNotificationsForActiveObjective();

    expect(fake.scheduledIds()).toContain('pregnancy-event-a'); // untouched
    heal();
  });

  it('a REAL switch to another objective still cancels them (the guard is only for unreadable data)', async () => {
    coldStart();
    await M.onboarding().setActiveObjective('pregnancy');
    await M.dating().setPregnancyDating({method: 'lastPeriod', date: new Date(NOW.getTime() - 70 * 86_400_000).toISOString()});
    await M.events().savePregnancyMedicalEvent(event('a'));
    await M.schedule().resyncAllPregnancyNotifications();
    expect(M.fake().scheduledIds()).toContain('pregnancy-event-a');

    await M.onboarding().setActiveObjective('cycle');
    await M.schedule().syncPregnancyNotificationsForActiveObjective();

    expect(M.fake().scheduledIds()).not.toContain('pregnancy-event-a');
  });
});

describe('records read with an empty fallback', () => {
  it('a save made while the events record cannot be read is REFUSED and the stored events are untouched', async () => {
    coldStart();
    await M.events().savePregnancyMedicalEvent(event('a'));
    await M.events().savePregnancyMedicalEvent(event('b'));

    coldStart();
    const heal = failReadsOf(EVENTS_KEY);
    // The reader answers "no events" (it swallows the error); the write built on that emptiness must not land.
    expect(await M.events().getPregnancyMedicalEvents()).toEqual([]);
    await expect(M.events().savePregnancyMedicalEvent(event('c'))).rejects.toMatchObject({
      name: 'StructuredDataUnavailableError',
      reason: 'read-failed',
    });

    heal();
    await M.recovery().retryStructuredAccess();
    const stored = await M.events().getPregnancyMedicalEvents();
    expect(stored.map(item => item.id).sort()).toEqual(['a', 'b']); // nothing lost, nothing replaced by [c]
  });

  it('after the read recovers, saving works again', async () => {
    coldStart();
    await M.events().savePregnancyMedicalEvent(event('a'));
    coldStart();
    const heal = failReadsOf(EVENTS_KEY);
    await M.events().getPregnancyMedicalEvents();
    heal();
    await M.recovery().retryStructuredAccess();

    await M.events().savePregnancyMedicalEvent(event('b'));

    expect((await M.events().getPregnancyMedicalEvents()).map(item => item.id).sort()).toEqual(['a', 'b']);
  });
});

describe('what is not protected data', () => {
  it('a read failure of a plain (non-encrypted) key is still the original error, and marks nothing unavailable', async () => {
    coldStart();
    const heal = failReadsOf('@hawa/some-plain-ui-preference');

    await expect(M.secure().default.getItem('@hawa/some-plain-ui-preference')).rejects.toThrow('disk I/O error');

    expect(M.secure().getUnavailableStructuredKeys()).toEqual([]);
    heal();
  });
});
