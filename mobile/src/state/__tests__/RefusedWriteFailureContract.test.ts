import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import {STRUCTURED_KEY_SERVICE, isStructuredEnvelope} from '../../services/structuredEncryption';

// THE WRITE-FAILURE CONTRACT (services/saveFailure.ts), asserted through each family's real store:
//
//   a record that cannot be read is protected, so a user edit is REFUSED. Then:
//     1. the writer REJECTS (it never resolves "as if saved" and never swallows the failure);
//     2. the store's in-memory state goes back to what it held before the edit (no refused edit is presented as
//        persisted);
//     3. the stored ciphertext is byte-identical;
//     4. once the cause is gone and the user taps "Try again", the very same edit succeeds.
//
// Fixtures only — every value below is invented.

type Secure = typeof import('../../services/secureAsyncStorage');

const M = {
  secure: () => require('../../services/secureAsyncStorage') as Secure,
  recovery: () => require('../../services/structuredKeyRecovery') as typeof import('../../services/structuredKeyRecovery'),
  onboarding: () => require('../onboardingPreferences') as typeof import('../onboardingPreferences'),
  confirmed: () => require('../confirmedPeriodHistoryStore') as typeof import('../confirmedPeriodHistoryStore'),
  journal: () => require('../dailyJournalStore') as typeof import('../dailyJournalStore'),
  ledger: () => require('../qadaaLedgerStore') as typeof import('../qadaaLedgerStore'),
  intake: () => require('../contraceptionIntakeHistoryStore') as typeof import('../contraceptionIntakeHistoryStore'),
  irregularPrefs: () => require('../irregularPreferences') as typeof import('../irregularPreferences'),
  menopauseJournal: () => require('../menopauseJournalStore') as typeof import('../menopauseJournalStore'),
  pregnancyPrefs: () => require('../pregnancyPreferences') as typeof import('../pregnancyPreferences'),
  pregnancySettings: () => require('../pregnancyNotificationSettingsStore') as typeof import('../pregnancyNotificationSettingsStore'),
  postpartumPrefs: () => require('../postpartumPreferences') as typeof import('../postpartumPreferences'),
  postpartumJournal: () => require('../postpartumJournalStore') as typeof import('../postpartumJournalStore'),
  lochia: () => require('../postpartumLochiaStore') as typeof import('../postpartumLochiaStore'),
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
/** The AsyncStorage instance the (freshly required) stores use — a spy on the top-level import would miss it. */
const liveStorage = () => (require('@react-native-async-storage/async-storage') as {default: typeof AsyncStorage}).default;

/** Takes the structured key out of the Keychain; the returned function puts the SAME key back (a temporary outage). */
const takeKeyAway = async (): Promise<() => Promise<void>> => {
  const stored = await Keychain.getGenericPassword({service: STRUCTURED_KEY_SERVICE});
  if (!stored) {throw new Error('fixture: no structured key was ever created');}
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  return async () => {
    await Keychain.setGenericPassword(stored.username, stored.password, {service: STRUCTURED_KEY_SERVICE});
  };
};

const day = (year: number, month: number, date: number, hour = 12) => new Date(year, month, date, hour);

type Case = {
  family: string;
  key: string;
  seed: () => Promise<void>;
  /** What a screen does on focus: read the store (an unreadable record is swallowed by the reader, never thrown). */
  read: () => Promise<unknown>;
  /** The store's in-memory view, JSON-serialisable. */
  view: () => Promise<unknown>;
  /** The user's edit through the store's real writer. */
  edit: () => Promise<unknown>;
  /** True when the view shows the edit. */
  edited: (view: any) => boolean;
};

const CASES: Case[] = [
  {
    family: 'cycle: period start (synchronous setter)', key: '@hawa/cycle-preferences',
    seed: async () => {
      await M.onboarding().setCyclePreferences({lastPeriodStart: day(2026, 8, 10), periodDuration: 6, cycleDuration: 31, regularity: 'yes'});
      await settle();
    },
    read: async () => M.onboarding().hydrateCyclePreferences(),
    view: async () => {
      const o = M.onboarding();
      return {confirmed: o.getHasConfirmedCycleData(), recorded: o.getRecordedPeriodHistory(), start: o.getCyclePreferences().lastPeriodStart};
    },
    edit: async () => M.onboarding().addPeriodOccurrence(day(2026, 9, 11)),
    edited: v => v.recorded.some((record: {startDate: string}) => record.startDate === '2026-10-11'),
  },
  {
    family: 'cycle: confirmed period end', key: '@hawa/confirmed-period-history',
    seed: async () => {
      await M.confirmed().recordConfirmedPeriodEnd(day(2026, 8, 10), day(2026, 8, 14));
    },
    read: async () => M.confirmed().hydrateConfirmedPeriodHistory(),
    view: async () => ({history: M.confirmed().getConfirmedPeriodHistory()}),
    edit: async () => M.confirmed().recordConfirmedPeriodEnd(day(2026, 9, 8), day(2026, 9, 12)),
    edited: v => v.history.length >= 2,
  },
  {
    family: 'cycle / conceive / irregular / menopause: shared daily journal', key: '@hawa/daily-journal/v1',
    seed: async () => {
      await M.journal().saveJournalSection('2026-09-20', 'mood', {level: 'sad', energy: 1, stress: 4, irritability: 2, motivation: 1});
    },
    read: async () => undefined,
    view: async () => ({entries: await M.journal().getAllJournalEntries()}),
    edit: async () => M.journal().saveJournalSection('2026-09-22', 'flow', {intensity: 'light'}),
    edited: v => v.entries.some((entry: {date: string}) => entry.date === '2026-09-22'),
  },
  {
    family: 'contraception: intake history', key: '@hawa/contraception-intake-history/v1',
    seed: async () => {
      await M.intake().setContraceptionIntakeStatus('2026-09-18', 'missed', 'pill');
    },
    read: async () => M.intake().hydrateContraceptionIntakeHistory(),
    view: async () => ({records: M.intake().getAllContraceptionIntakeRecords()}),
    edit: async () => M.intake().setContraceptionIntakeStatus('2026-09-20', 'taken', 'pill'),
    edited: v => Boolean(v.records['2026-09-20']),
  },
  {
    family: 'irregular (SOPK): preferences', key: '@hawa/irregular-preferences/v1',
    seed: async () => {
      await M.irregularPrefs().setIrregularPreferences({cyclePattern: 'very_variable', lastPeriodDate: '2026-08-30', trackedItems: ['acne']});
    },
    read: async () => M.irregularPrefs().hydrateIrregularPreferences(),
    view: async () => ({prefs: M.irregularPrefs().getIrregularPreferences()}),
    edit: async () => M.irregularPrefs().setIrregularPreferences({trackedItems: ['pain']}),
    edited: v => v.prefs.trackedItems.length === 1 && v.prefs.trackedItems[0] === 'pain',
  },
  {
    family: 'menopause: journal entries', key: '@hawa/menopause-journal/v1',
    seed: async () => {
      await M.menopauseJournal().saveMenopauseJournalField('2026-07-04', 'symptoms', ['hot_flashes']);
    },
    read: async () => M.menopauseJournal().hydrateMenopauseJournal(),
    view: async () => ({entries: M.menopauseJournal().getAllMenopauseJournalEntries()}),
    edit: async () => M.menopauseJournal().saveMenopauseJournalField('2026-07-05', 'mood', 'good'),
    edited: v => Boolean(v.entries['2026-07-05']),
  },
  {
    family: 'pregnancy: dating preferences', key: '@hawa/pregnancy-dating',
    seed: async () => {
      await M.pregnancyPrefs().setPregnancyDating({method: 'dueDate', date: '2027-03-01'});
    },
    read: async () => M.pregnancyPrefs().hydratePregnancyDating(),
    view: async () => ({dating: M.pregnancyPrefs().getPregnancyDating()}),
    edit: async () => M.pregnancyPrefs().setPregnancyDating({method: 'conceptionDate', date: '2026-10-01'}),
    edited: v => v.dating.method === 'conceptionDate',
  },
  {
    family: 'pregnancy: notification settings (toggles)', key: '@hawa/pregnancy-notification-settings',
    seed: async () => {
      const store = M.pregnancySettings();
      await store.setPregnancyNotificationSettings({...store.getPregnancyNotificationSettings(), weeklyUpdateEnabled: false, dailyJournalTime: '07:45'});
    },
    read: async () => M.pregnancySettings().hydratePregnancyNotificationSettings(),
    view: async () => ({settings: M.pregnancySettings().getPregnancyNotificationSettings()}),
    edit: async () => {
      const store = M.pregnancySettings();
      return store.setPregnancyNotificationSettings({...store.getPregnancyNotificationSettings(), dailyJournalTime: '21:00'});
    },
    edited: v => v.settings.dailyJournalTime === '21:00',
  },
  {
    family: 'postpartum: preferences (delivery date)', key: '@hawa/postpartum-preferences/v1',
    seed: async () => {
      await M.postpartumPrefs().confirmDelivery(day(2026, 8, 1));
    },
    read: async () => M.postpartumPrefs().hydratePostpartumPreferences(),
    view: async () => ({prefs: M.postpartumPrefs().getPostpartumPreferences()}),
    edit: async () => M.postpartumPrefs().setFeedingType('mixed'),
    edited: v => v.prefs.feedingType === 'mixed',
  },
  {
    family: 'postpartum: journal', key: '@hawa/postpartum-journal/v3',
    seed: async () => {
      await M.postpartumJournal().savePostpartumJournalField('2026-09-10', 'fatigue', 'Modérée');
    },
    read: async () => M.postpartumJournal().hydratePostpartumJournal(),
    view: async () => ({entries: M.postpartumJournal().getAllPostpartumJournalEntries()}),
    edit: async () => M.postpartumJournal().savePostpartumJournalField('2026-09-11', 'pain', 'Légère'),
    edited: v => v.entries['2026-09-11']?.pain === 'Légère',
  },
  {
    family: 'postpartum: lochia', key: '@hawa/postpartum-lochia/v1',
    seed: async () => {
      await M.lochia().savePostpartumLochiaEntry('2026-09-04', {flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: ['Aucun']});
    },
    read: async () => M.lochia().hydratePostpartumLochia(),
    view: async () => ({entries: M.lochia().getAllPostpartumLochiaEntries(), tracking: M.lochia().getPostpartumLochiaTracking()}),
    edit: async () => M.lochia().markPostpartumLochiaEnded('2026-09-20'),
    edited: v => v.tracking.endedDate === '2026-09-20',
  },
  {
    family: 'loss (miscarriage): journal', key: '@hawa/miscarriage-journal/v1',
    seed: async () => {
      await M.miscarriageJournal().saveMiscarriageJournalField('2026-09-13', 'physicalSymptoms', ['Fatigue']);
    },
    read: async () => M.miscarriageJournal().hydrateMiscarriageJournal(),
    view: async () => ({entries: M.miscarriageJournal().getAllMiscarriageJournalEntries()}),
    edit: async () => M.miscarriageJournal().saveMiscarriageJournalField('2026-09-14', 'bleeding', 'Léger'),
    edited: v => v.entries['2026-09-14']?.bleeding === 'Léger',
  },
  {
    family: 'qadaa: ledger (manual entry)', key: 'awa:qadaa:ledger:v1',
    seed: async () => {
      await M.ledger().addManualQadaaEntry({id: 'manual-1', quantity: 3});
    },
    read: async () => M.ledger().hydrateQadaaLedger(),
    view: async () => ({manual: M.ledger().getQadaaLedger().manualEntries.map(entry => entry.id)}),
    edit: async () => M.ledger().addManualQadaaEntry({id: 'manual-2', quantity: 2}),
    edited: v => v.manual.includes('manual-2'),
  },
  {
    family: 'general health: measurements', key: '@awa/general-health/v1',
    seed: async () => {
      await M.generalHealth().updateGeneralHealth({heightCm: 171, weightKg: 58, bloodType: 'B-'});
    },
    read: async () => M.generalHealth().loadGeneralHealth(),
    view: async () => ({profile: M.generalHealth().getCachedGeneralHealth()}),
    edit: async () => M.generalHealth().updateGeneralHealth({weightKg: 59}),
    edited: v => v.profile.weightKg === 59,
  },
  {
    family: 'personal information', key: '@hawa/personal-information/v1',
    seed: async () => {
      await M.personalInfo().updatePersonalInformation({firstName: 'Yasmine', lastName: 'Fixture'});
    },
    read: async () => M.personalInfo().loadPersonalInformation(),
    view: async () => ({info: M.personalInfo().getCachedPersonalInformation()}),
    edit: async () => M.personalInfo().updatePersonalInformation({phone: '+000 0 00 00 00 00'}),
    edited: v => v.info.phone === '+000 0 00 00 00 00',
  },
];

const isUnavailableError = (error: unknown) => (error as {name?: string})?.name === 'StructuredDataUnavailableError';

const safeView = async (c: Case): Promise<unknown> => {
  try {
    const view = await c.view();
    await settle();
    return JSON.parse(JSON.stringify(view));
  } catch (error) {
    if (isUnavailableError(error)) {return UNAVAILABLE;}
    throw error;
  }
};

const safeRead = async (c: Case) => {
  try {
    await c.read();
  } catch {
    // an unreadable record is the scenario; the store keeps its default state and the key is recorded as unavailable
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

describe('a refused write rejects, rolls memory back, leaves the ciphertext alone, and succeeds once recovered', () => {
  describe.each(CASES)('$family', c => {
    it('rejects with StructuredDataUnavailableError, restores the in-memory state, keeps the record byte-identical, then a retry succeeds', async () => {
      coldStart();
      await c.seed();
      await settle();
      const original = (await rawOf(c.key)) as string;
      expect(original).not.toBeNull();
      expect(isStructuredEnvelope(original)).toBe(true);

      // The protection key is unavailable (a locked / lost Keystore): the stores cannot read their record.
      const restoreKey = await takeKeyAway();
      coldStart();
      await safeRead(c);
      const before = await safeView(c);
      expect(before !== UNAVAILABLE && c.edited(before)).toBe(false);

      // The user edits: the write is refused AND reported to the caller.
      let rejection: unknown;
      try {
        await c.edit();
      } catch (error) {
        rejection = error;
      }
      await settle();
      expect(rejection).toBeDefined();
      expect(isUnavailableError(rejection) || (rejection as Error)?.message?.includes('refusing')).toBe(true);

      // Memory does not present the refused edit as persisted; storage is untouched.
      const afterRefused = await safeView(c);
      expect(afterRefused).toEqual(before);
      expect(await rawOf(c.key)).toBe(original);

      // The cause goes away and the user taps "Try again" (what the recovery screen does).
      await restoreKey();
      await M.recovery().retryStructuredAccess();
      await safeRead(c);

      // The very same edit now succeeds, is visible, and is really stored.
      await c.edit();
      await settle();
      const afterRetry = await safeView(c);
      expect(afterRetry).not.toBe(UNAVAILABLE);
      expect(c.edited(afterRetry)).toBe(true);
      const stored = (await rawOf(c.key)) as string;
      expect(stored).not.toBe(original);
      expect(isStructuredEnvelope(stored)).toBe(true);

      // ...and it survives a restart.
      coldStart();
      await safeRead(c);
      expect(c.edited(await safeView(c))).toBe(true);
    });
  });
});

describe('an ordinary storage failure (not a refusal) follows the same contract', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('a plaintext toggle (spiritual markers) rejects and goes back to the previous choice', async () => {
    coldStart();
    const onboarding = M.onboarding();
    await onboarding.setSpiritualMarkersEnabled(true);
    await settle();
    jest.spyOn(liveStorage(), 'setItem').mockRejectedValueOnce(new Error('disk full'));

    const result = onboarding.setSpiritualMarkersEnabled(false);
    // The in-memory value moves at once (screens react immediately) ...
    expect(onboarding.getSpiritualMarkersEnabled()).toBe(false);
    // ... but the write failed: the promise rejects and the value goes back.
    await expect(result).rejects.toThrow('disk full');
    expect(onboarding.getSpiritualMarkersEnabled()).toBe(true);
  });

  it('a Hijri adjustment that could not be stored goes back and rejects', async () => {
    coldStart();
    const onboarding = M.onboarding();
    jest.spyOn(liveStorage(), 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await expect(onboarding.setHijriAdjustmentDays(1)).rejects.toThrow('disk full');
    expect(onboarding.getHijriAdjustmentDays()).toBe(0);
  });

  it('a journal write that fails for an unrelated reason rejects and leaves no partial state', async () => {
    coldStart();
    const store = M.postpartumJournal();
    await store.hydratePostpartumJournal();
    await store.savePostpartumJournalField('2026-09-10', 'fatigue', 'Modérée');
    await settle();
    const stored = await rawOf('@hawa/postpartum-journal/v3');
    jest.spyOn(liveStorage(), 'setItem').mockRejectedValueOnce(new Error('disk full'));

    await expect(store.savePostpartumJournalField('2026-09-11', 'pain', 'Légère')).rejects.toThrow('disk full');
    expect(store.getPostpartumJournalEntry('2026-09-11')).toBeUndefined();
    expect(store.getPostpartumJournalEntry('2026-09-10')?.fatigue).toBe('Modérée');
    expect(await rawOf('@hawa/postpartum-journal/v3')).toBe(stored);

    // Re-tapping Save just works.
    await store.savePostpartumJournalField('2026-09-11', 'pain', 'Légère');
    expect(store.getPostpartumJournalEntry('2026-09-11')?.pain).toBe('Légère');
  });

  it('listeners are told about the rollback so a mounted screen refreshes', async () => {
    coldStart();
    const store = M.postpartumJournal();
    await store.hydratePostpartumJournal();
    const seen: number[] = [];
    store.subscribePostpartumJournal(() => seen.push(Object.keys(store.getAllPostpartumJournalEntries()).length));
    jest.spyOn(liveStorage(), 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await expect(store.savePostpartumJournalField('2026-09-11', 'pain', 'Légère')).rejects.toThrow();
    expect(seen).toEqual([1, 0]); // optimistic, then rolled back
  });
});
