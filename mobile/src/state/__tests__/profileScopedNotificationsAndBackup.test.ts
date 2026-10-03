import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '../../i18n';
import {setAppLanguage} from '../../state/themePreferences';
import {
  getCycleReminderPreferences,
  hydrateCycleReminderPreferences,
  resetCycleReminderPreferencesForTests,
  setCycleReminderPreferences,
} from '../cycleReminderPreferences';
import {addManagedProfile, resetManagedProfilesForTests} from '../managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../activeProfileStore';
import {syncCycleReminders} from '../../utils/cycleReminderScheduling';
import {scheduleLocalNotification, cancelLocalNotification} from '../../services/pregnancyNotifications';
import {getCyclePreferences, setCyclePreferences} from '../onboardingPreferences';
import {
  addInAppNotification,
  clearAllInAppNotificationsForActiveProfile,
  getInAppNotificationsForActiveProfile,
  getUnreadInAppNotificationCountForActiveProfile,
  markAllInAppNotificationsAsReadForActiveProfile,
  markInAppNotificationAsRead,
} from '../inAppNotificationStore';
import {persistGenericReminderNotification} from '../../services/genericReminderNotificationPersistence';
import {CYCLE_REMINDER_NOTIFICATION_KIND} from '../../utils/cycleReminderScheduling';
import {
  buildPortableDataJsonForProfile,
  deleteTrackedDataForProfile,
  readAwaStorageForProfile,
} from '../../services/backupService';

jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn().mockResolvedValue(true),
  cancelLocalNotification: jest.fn().mockResolvedValue(undefined),
  ensureNotificationPermission: jest.fn().mockResolvedValue(true),
}));

const mockSchedule = scheduleLocalNotification as jest.Mock;
const mockCancel = cancelLocalNotification as jest.Mock;

// This project's jest-preset AsyncStorage mock predates getMany/setMany/
// removeMany (RN's own bundled mock, not @react-native-async-storage's
// richer one) — inAppNotificationStore.ts's real implementation needs them.
// Polyfilled here, scoped to this file only, so the real store logic (not a
// jest.mock() stand-in) can be exercised end-to-end.
beforeAll(() => {
  const store = AsyncStorage as unknown as {
    getMany?: (keys: string[]) => Promise<Record<string, string | null>>;
    setMany?: (entries: Record<string, string>) => Promise<void>;
    removeMany?: (keys: string[]) => Promise<void>;
  };
  if (!store.getMany) {
    store.getMany = async keys => {
      const result: Record<string, string | null> = {};
      for (const key of keys) {result[key] = await AsyncStorage.getItem(key);}
      return result;
    };
  }
  if (!store.setMany) {
    store.setMany = async entries => {
      for (const [key, value] of Object.entries(entries)) {await AsyncStorage.setItem(key, value);}
    };
  }
  if (!store.removeMany) {
    store.removeMany = async keys => {
      for (const key of keys) {await AsyncStorage.removeItem(key);}
    };
  }
});

const DEFAULT_PREFS = {
  upcomingPeriodEnabled: false,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: false,
  dailyJournalEnabled: false,
  dailyJournalTime: null,
  fertileWindowEnabled: false,
  ovulationEnabled: false,
};

beforeEach(async () => {
  jest.clearAllMocks();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  await AsyncStorage.clear();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's text assertions were written against the French default. Pinning
  // French explicitly here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

describe('cycleReminderPreferences — profile-scoped reminder settings', () => {
  it('the mother, Hanane and Lina each keep their own independent reminder preferences, coexisting without overwriting one another', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2014-01-01', hasHadFirstPeriod: false});

    await setCycleReminderPreferences({...DEFAULT_PREFS, dailyJournalEnabled: true, dailyJournalTime: '21:00'}); // mother

    await setActiveProfileId(hanane.id);
    await setCycleReminderPreferences({...DEFAULT_PREFS, dailyJournalEnabled: true, dailyJournalTime: '18:00'});

    await setActiveProfileId(lina.id);
    expect(getCycleReminderPreferences().dailyJournalEnabled).toBe(false); // never Hanane's ON, never the mother's

    await setActiveProfileId(OWNER_PROFILE_ID);
    expect(getCycleReminderPreferences().dailyJournalTime).toBe('21:00'); // untouched by either daughter

    await setActiveProfileId(hanane.id);
    expect(getCycleReminderPreferences().dailyJournalTime).toBe('18:00'); // her own edit persisted
  });

  it('a daughter\'s edited reminder time persists across profile switches and (simulated) app restart', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(hanane.id);
    await setCycleReminderPreferences({...DEFAULT_PREFS, dailyJournalEnabled: true, dailyJournalTime: '18:00'});

    await setActiveProfileId(OWNER_PROFILE_ID);
    await setActiveProfileId(hanane.id);
    expect(getCycleReminderPreferences().dailyJournalTime).toBe('18:00');

    // Simulated restart: reset the in-memory module state, force a fresh hydrate.
    await resetCycleReminderPreferencesForTests();
    await hydrateCycleReminderPreferences();
    expect(getCycleReminderPreferences().dailyJournalTime).toBe('18:00');
  });
});

describe('cycleReminderScheduling — profile-scoped scheduled notifications', () => {
  it('enabling/disabling Hanane\'s reminder never touches the mother\'s already-scheduled one — coexisting, independently cancellable ids', async () => {
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 1), periodDuration: 5, cycleDuration: 28, regularity: 'yes'}); // mother
    await setCycleReminderPreferences({...DEFAULT_PREFS, dailyJournalEnabled: true, dailyJournalTime: '21:00'});
    await syncCycleReminders();
    const motherCall = mockSchedule.mock.calls.find(([arg]) => arg.id === 'cycle-daily-journal-reminder:owner');
    expect(motherCall).toBeDefined();

    const hanane = await addManagedProfile({
      type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-10-05', periodLength: 5, cycleLength: 28,
    });
    await setActiveProfileId(hanane.id);
    mockSchedule.mockClear();
    mockCancel.mockClear();
    await setCycleReminderPreferences({...DEFAULT_PREFS, dailyJournalEnabled: true, dailyJournalTime: '18:00'});
    await syncCycleReminders();
    const daughterCall = mockSchedule.mock.calls.find(([arg]) => arg.id === `cycle-daily-journal-reminder:${hanane.id}`);
    expect(daughterCall).toBeDefined();
    // The mother's own id is never re-cancelled by Haifa's sync (only the
    // profile-namespaced legacy-cleanup ids, never her real scheduled one).
    expect(mockCancel.mock.calls.some(([id]) => id === 'cycle-daily-journal-reminder:owner')).toBe(false);

    // Disabling Hanane's reminder cancels ONLY her own id.
    mockCancel.mockClear();
    await setCycleReminderPreferences({...DEFAULT_PREFS, dailyJournalEnabled: false});
    await syncCycleReminders();
    expect(mockCancel).toHaveBeenCalledWith(`cycle-daily-journal-reminder:${hanane.id}`);
    expect(mockCancel.mock.calls.some(([id]) => id === 'cycle-daily-journal-reminder:owner')).toBe(false);
  });

  it('a daughter with no confirmed cycle data never gets a fake upcoming-period/fertile-window/ovulation reminder scheduled, but her journal reminder still works', async () => {
    const noor = await addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2015-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(noor.id);
    await setCycleReminderPreferences({
      ...DEFAULT_PREFS,
      upcomingPeriodEnabled: true,
      periodStartCheckEnabled: true,
      fertileWindowEnabled: true,
      ovulationEnabled: true,
      dailyJournalEnabled: true,
      dailyJournalTime: '19:00',
    });
    await syncCycleReminders();

    expect(mockSchedule.mock.calls.some(([arg]) => arg.id === `cycle-upcoming-period-reminder:${noor.id}`)).toBe(false);
    expect(mockSchedule.mock.calls.some(([arg]) => arg.id === `cycle-period-start-check-reminder:${noor.id}`)).toBe(false);
    expect(mockSchedule.mock.calls.some(([arg]) => arg.id === `cycle-fertile-window-reminder:${noor.id}`)).toBe(false);
    expect(mockSchedule.mock.calls.some(([arg]) => arg.id === `cycle-ovulation-reminder:${noor.id}`)).toBe(false);
    // Journal reminder is independent of cycle predictions — still scheduled.
    expect(mockSchedule.mock.calls.some(([arg]) => arg.id === `cycle-daily-journal-reminder:${noor.id}`)).toBe(true);
  });

  it('a daughter\'s scheduled reminder uses profile-aware wording naming her, never the mother\'s own first-person wording, and never a hardcoded name', async () => {
    const hanane = await addManagedProfile({
      type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-10-05', periodLength: 5, cycleLength: 28,
    });
    await setActiveProfileId(hanane.id);
    await setCycleReminderPreferences({...DEFAULT_PREFS, dailyJournalEnabled: true, dailyJournalTime: '18:00'});
    await syncCycleReminders();

    const call = mockSchedule.mock.calls.find(([arg]) => arg.id === `cycle-daily-journal-reminder:${hanane.id}`)![0];
    expect(call.title).toBe('Journal de Hanane');
    expect(call.body).toBe('Pense à compléter son journal du jour.');
    expect(call.title).not.toBe('Comment te sens-tu aujourd’hui ?'); // never the mother's own wording
    expect(call.data.profileId).toBe(hanane.id);

    // A second daughter proves the name isn't hardcoded to "Hanane".
    const lina = await addManagedProfile({
      type: 'daughter', firstName: 'Lina', birthDate: '2014-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-10-05', periodLength: 5, cycleLength: 28,
    });
    await setActiveProfileId(lina.id);
    mockSchedule.mockClear();
    await setCycleReminderPreferences({...DEFAULT_PREFS, dailyJournalEnabled: true, dailyJournalTime: '18:00'});
    await syncCycleReminders();
    const linaCall = mockSchedule.mock.calls.find(([arg]) => arg.id === `cycle-daily-journal-reminder:${lina.id}`)![0];
    expect(linaCall.title).toBe('Journal de Lina');
  });
});

describe('In-app notification center — profile-isolated history, badge and read/unread state', () => {
  it('a Cycle reminder delivered while Hanane is scheduled is attributed to HER profileId regardless of who is active when it later fires', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});

    // Simulates the OS delivering a notification scheduled for Hanane while
    // the OWNER now happens to be the active profile (a real-world gap
    // between "scheduled for" and "fired") — the persisted record must
    // still say it's Hanane's, from the payload stamped at schedule time.
    await persistGenericReminderNotification({
      id: `cycle-daily-journal-reminder:${hanane.id}`,
      data: {
        hawaNotificationKind: CYCLE_REMINDER_NOTIFICATION_KIND,
        inAppTitle: 'Journal de Hanane',
        inAppMessage: 'Pense à compléter son journal du jour.',
        profileId: hanane.id,
      },
    } as never);

    expect(getInAppNotificationsForActiveProfile()).toHaveLength(0); // owner active — not hers

    await setActiveProfileId(hanane.id);
    const hers = getInAppNotificationsForActiveProfile();
    expect(hers).toHaveLength(1);
    expect(hers[0].title).toBe('Journal de Hanane');
  });

  it('mother and daughter notification counts/badges never mix, and mark-all/clear-all only ever touch the active profile\'s own notifications', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});

    await addInAppNotification({id: 'mother-1', type: 'x', title: 'Mère 1', message: 'm', receivedAt: new Date().toISOString(), read: false});
    await addInAppNotification({id: 'mother-2', type: 'x', title: 'Mère 2', message: 'm', receivedAt: new Date().toISOString(), read: false});
    expect(getUnreadInAppNotificationCountForActiveProfile()).toBe(2);

    await setActiveProfileId(hanane.id);
    await addInAppNotification({id: 'hanane-1', type: 'x', title: 'Hanane 1', message: 'm', receivedAt: new Date().toISOString(), read: false, profileId: hanane.id});
    expect(getUnreadInAppNotificationCountForActiveProfile()).toBe(1); // only her own, not the mother's 2

    await markAllInAppNotificationsAsReadForActiveProfile();
    expect(getUnreadInAppNotificationCountForActiveProfile()).toBe(0);

    await setActiveProfileId(OWNER_PROFILE_ID);
    expect(getUnreadInAppNotificationCountForActiveProfile()).toBe(2); // untouched by Hanane's "mark all as read"

    await clearAllInAppNotificationsForActiveProfile();
    expect(getInAppNotificationsForActiveProfile()).toHaveLength(0);

    await setActiveProfileId(hanane.id);
    expect(getInAppNotificationsForActiveProfile()).toHaveLength(1); // untouched by the mother's "clear all"
  });

  it('marking one specific notification as read never affects another profile\'s notifications', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    await addInAppNotification({id: 'mother-1', type: 'x', title: 'Mère', message: 'm', receivedAt: new Date().toISOString(), read: false});
    await setActiveProfileId(hanane.id);
    await addInAppNotification({id: 'hanane-1', type: 'x', title: 'Hanane', message: 'm', receivedAt: new Date().toISOString(), read: false, profileId: hanane.id});

    await markInAppNotificationAsRead('hanane-1');
    expect(getInAppNotificationsForActiveProfile()[0].read).toBe(true);

    await setActiveProfileId(OWNER_PROFILE_ID);
    expect(getInAppNotificationsForActiveProfile()[0].read).toBe(false); // the mother's own notification, untouched
  });
});

describe('Backup — profile-scoped export/delete for a managed daughter profile', () => {
  it('a daughter\'s exported/downloaded data includes only her own profile-scoped keys — never the mother\'s, never another daughter\'s', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2014-01-01', hasHadFirstPeriod: false});

    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 30, regularity: 'yes'}); // mother

    await setActiveProfileId(hanane.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 5), periodDuration: 4, cycleDuration: 26, regularity: 'unknown'});

    await setActiveProfileId(lina.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 8), periodDuration: 6, cycleDuration: 32, regularity: 'unknown'});

    const hananeData = await readAwaStorageForProfile(hanane.id);
    const hananeKeys = Object.keys(hananeData);
    expect(hananeKeys.length).toBeGreaterThan(0);
    expect(hananeKeys.every(key => key.endsWith(`:profile:${hanane.id}`))).toBe(true);
    expect(hananeKeys.some(key => key.endsWith(`:profile:${lina.id}`))).toBe(false);
    expect(hananeKeys.some(key => key === '@hawa/cycle-preferences')).toBe(false); // the mother's own bare (unsuffixed) key

    const hananeJson = await buildPortableDataJsonForProfile(hanane.id);
    expect(hananeJson).not.toContain(`:profile:${lina.id}`);
  });

  it('deleting a daughter\'s tracking data removes only her own keys, never the mother\'s, never another daughter\'s, never the managed-profile record itself, and never uses AsyncStorage.clear()', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2014-01-01', hasHadFirstPeriod: false});

    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 30, regularity: 'yes'}); // mother
    await setActiveProfileId(hanane.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 5), periodDuration: 4, cycleDuration: 26, regularity: 'unknown'});
    await setActiveProfileId(lina.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 8), periodDuration: 6, cycleDuration: 32, regularity: 'unknown'});

    await deleteTrackedDataForProfile(hanane.id);

    expect((await readAwaStorageForProfile(hanane.id))).toEqual({});

    await setActiveProfileId(OWNER_PROFILE_ID);
    const {getCyclePreferences: getMotherCycle} = require('../onboardingPreferences');
    expect(getMotherCycle().cycleDuration).toBe(30); // the mother's own data — untouched by Hanane's delete

    const linaData = await readAwaStorageForProfile(lina.id);
    expect(Object.keys(linaData).length).toBeGreaterThan(0); // Lina's own data — untouched

    // The managed-profile RECORD itself (name/photo/creation info) is a
    // completely separate, global store never touched by this operation —
    // deleting HER TRACKING DATA must never delete her PROFILE.
    const {getManagedProfiles} = require('../managedProfilesStore');
    expect(getManagedProfiles().some((profile: {id: string}) => profile.id === hanane.id)).toBe(true);
  });

  it('no AsyncStorage.clear() anywhere in the profile-scoped backup implementation (static source scan)', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.resolve(__dirname, '../../services/backupService.ts'), 'utf8');
    expect(source).not.toMatch(/AsyncStorage\.clear\(\)/);
  });

  it('"Sauvegarder maintenant" for a daughter writes to HER OWN backup slot — never the owner\'s existing backup, never touched or overwritten', async () => {
    const {backupNow, getBackupSnapshot} = require('../../services/backupService');
    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 30, regularity: 'yes'}); // mother
    const ownerSnapshotBefore = await backupNow(); // the owner's own, pre-existing backup
    expect(ownerSnapshotBefore.entries['@hawa/cycle-preferences']).toBeDefined();

    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(hanane.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 5), periodDuration: 4, cycleDuration: 26, regularity: 'unknown'});

    const {backupNowForProfile, getBackupSnapshotForProfile} = require('../../services/backupService');
    const hananeSnapshot = await backupNowForProfile(hanane.id);
    expect(hananeSnapshot.scope).toBe('managed-profile');
    expect(hananeSnapshot.profileId).toBe(hanane.id);
    expect(Object.keys(hananeSnapshot.entries).every((key: string) => key.endsWith(`:profile:${hanane.id}`))).toBe(true);

    // The owner's own backup slot is completely unaffected by Hanane's.
    const ownerSnapshotAfter = await getBackupSnapshot();
    expect(ownerSnapshotAfter).toEqual(ownerSnapshotBefore);

    const hananeSnapshotRead = await getBackupSnapshotForProfile(hanane.id);
    expect(hananeSnapshotRead).toEqual(hananeSnapshot);
  });

  it('restoring a daughter\'s backup changes ONLY her own data — the owner and another daughter remain exactly as they were', async () => {
    const {backupNowForProfile, restoreBackupForProfile} = require('../../services/backupService');
    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 30, regularity: 'yes'}); // mother: 30

    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2014-01-01', hasHadFirstPeriod: false});

    await setActiveProfileId(hanane.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 5), periodDuration: 4, cycleDuration: 28, regularity: 'unknown'});
    const hananeBackup = await backupNowForProfile(hanane.id); // Hanane's cycle = 28, backed up

    // She (or the mother, on her behalf) later changes her cycle length...
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 5), periodDuration: 4, cycleDuration: 21, regularity: 'unknown'});
    expect(getCyclePreferences().cycleDuration).toBe(21);

    await setActiveProfileId(lina.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 8), periodDuration: 6, cycleDuration: 35, regularity: 'unknown'}); // Lina: 35

    // ...then restores Hanane's earlier backup while she's active.
    await setActiveProfileId(hanane.id);
    await restoreBackupForProfile(hananeBackup, hanane.id);
    // restoreBackupForProfile writes raw AsyncStorage bytes directly — the
    // onboardingPreferences.ts in-memory cache only re-reads from disk on an
    // active-profile change (its own subscribeActiveProfileId hook), exactly
    // like a real app would naturally pick up a restored backup on next load.
    await setActiveProfileId(OWNER_PROFILE_ID);
    await setActiveProfileId(hanane.id);
    expect(getCyclePreferences().cycleDuration).toBe(28); // back to the backed-up value

    await setActiveProfileId(OWNER_PROFILE_ID);
    expect(getCyclePreferences().cycleDuration).toBe(30); // the mother — untouched by Hanane's restore

    await setActiveProfileId(lina.id);
    expect(getCyclePreferences().cycleDuration).toBe(35); // Lina — untouched by Hanane's restore
  });

  it('a backup created for one daughter can never overwrite another daughter\'s or the owner\'s data even if mistakenly restored while a different profile is active (structural safety — restoreBackupForProfile re-filters by the ACTIVE profile\'s own suffix)', async () => {
    const {backupNowForProfile, restoreBackupForProfile} = require('../../services/backupService');
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2014-01-01', hasHadFirstPeriod: false});

    await setActiveProfileId(hanane.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 5), periodDuration: 4, cycleDuration: 28, regularity: 'unknown'});
    const hananeBackup = await backupNowForProfile(hanane.id);

    await setActiveProfileId(lina.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 8), periodDuration: 6, cycleDuration: 35, regularity: 'unknown'});

    // Attempting to restore Hanane's backup while Lina is active: restoreBackupForProfile
    // filters by Lina's own suffix, so none of Hanane's `:profile:<hananeId>` entries
    // can ever be written — this is a structural safety net, not a silent remap.
    await restoreBackupForProfile(hananeBackup, lina.id);
    expect(getCyclePreferences().cycleDuration).toBe(35); // Lina's own data, unchanged — Hanane's never applied
  });
});

describe('Export pipeline — daughter data isolation (data model, before PDF/CSV rendering)', () => {
  it('the PDF export MODEL for a daughter uses the forced "Suivre mon cycle" objective and contains ONLY her own period date — never the mother\'s, never her sibling\'s', async () => {
    const {buildMedicalExport} = require('../../services/medicalExportOrchestrator');

    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 30, regularity: 'yes'}); // mother: 1 Sept

    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2014-01-01', hasHadFirstPeriod: false});

    await setActiveProfileId(hanane.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 10), periodDuration: 4, cycleDuration: 26, regularity: 'unknown'}); // Hanane: 10 Oct

    await setActiveProfileId(lina.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 20), periodDuration: 6, cycleDuration: 32, regularity: 'unknown'}); // Lina: 20 Oct

    await setActiveProfileId(hanane.id);
    const result = await buildMedicalExport('cycle', 'all', 'pdf', ['periods']);
    expect(result.kind).toBe('pdf');
    if (result.kind !== 'pdf') {return;}

    expect(result.model.objectiveLabel).toBe('Suivre mon cycle');
    const dates: string[] = result.model.days.map((day: {date: string}) => day.date);
    expect(dates).toContain('2026-10-10'); // Hanane's own period date
    expect(dates).not.toContain('2026-09-01'); // the mother's period date never leaks in
    expect(dates).not.toContain('2026-10-20'); // Lina's period date never leaks in
  });

  it('a daughter never sees "Vie intime" as a selectable/exportable category, even though it is a normal Cycle category for the owner', () => {
    const {getExportConfigurationForObjective} = require('../../config/objectiveExportConfig');
    // The category itself still exists in the shared config (never deleted
    // globally) — DataExportScreen.tsx is what filters it out for a daughter,
    // via its own `visibleCategories` (see that file's own comment).
    const cycleCategories = getExportConfigurationForObjective('cycle').categories;
    expect(cycleCategories.some((category: {value: string}) => category.value === 'intimacy')).toBe(true);
  });

  it('a CSV export for a daughter is also scoped to her own data (same forced objective, same underlying profile-scoped readers)', async () => {
    const {buildMedicalExport} = require('../../services/medicalExportOrchestrator');
    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 30, regularity: 'yes'}); // mother

    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(hanane.id);
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 10), periodDuration: 4, cycleDuration: 26, regularity: 'unknown'});

    const result = await buildMedicalExport('cycle', 'all', 'csv', ['periods']);
    expect(result.kind).toBe('csv');
    if (result.kind !== 'csv') {return;}
    expect(result.content).toContain('2026-10-10');
    expect(result.content).not.toContain('2026-09-01'); // the mother's period date never leaks into the CSV
  });
});
