import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {DeleteAccountScreen} from '../../screens/DataPrivacyScreens';
import {DeleteTrackedDataScreen, RestoreBackupScreen} from '../../screens/BackupUtilityScreens';
import {backupNow} from '../backupService';
import secureStorage, {
  isStructuredEncryptionEnabled,
  resetStructuredStorageForTests,
  setStructuredEncryptionEnabled,
} from '../secureAsyncStorage';
import {__resetNotificationServiceForTests} from '../pregnancyNotifications';
import {resyncAllReminderNotifications} from '../reminderResync';
import {isBulkReminderResyncSuspended, resumeBulkReminderResync} from '../reminderResyncGate';
import {resyncAllPregnancyNotifications} from '../../utils/pregnancyReminderScheduling';
import {
  getActiveObjective,
  hydrateCyclePreferences,
  setActiveObjective,
  subscribeActiveObjective,
} from '../../state/onboardingPreferences';
import {
  getPregnancyDating,
  hydratePregnancyDating,
  setPregnancyDating,
  subscribePregnancyDating,
} from '../../state/pregnancyPreferences';
import {
  getPregnancyNotificationSettings,
  setPregnancyNotificationSettings,
} from '../../state/pregnancyNotificationSettingsStore';
import {
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  setMiscarriageDailyTrackingReminder,
  setMiscarriagePreferences,
} from '../../state/miscarriagePreferences';
import {reloadAllOwnerStores, resetAllOwnerStoresToDefaults} from '../../state/ownerStoreRegistry';
import {resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {resetActiveProfileForTests} from '../../state/activeProfileStore';
import {resetCycleReminderPreferencesForTests} from '../../state/cycleReminderPreferences';
import i18n from '../../i18n';
import {fakeNotifeeState, resetFakeNotifee, scheduledIds} from '../../testUtils/fakeNotifee';

// Owner-only stores (objective, pregnancy / loss / ... preferences, notification settings) memoise their first read and
// have no profile signal. Restoring a backup or wiping the data used to leave them serving the OLD records: a later
// resync derived reminders from them and a later edit wrote the deleted data back (Phase 2 repair, F11).
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

// Different weekdays: the weekly pregnancy update fires on the weekday of the dating, so the trigger instant tells the
// two datings apart.
const DATING_A = new Date(2026, 6, 20, 12).toISOString();
const DATING_B = new Date(2026, 6, 23, 12).toISOString();
const SETTINGS = {
  weeklyUpdateEnabled: true,
  dailyJournalEnabled: false,
  dailyJournalTime: '20:00',
  appointmentsEnabled: true,
  examsEnabled: true,
  defaultAppointmentReminderOffset: '1day' as const,
  defaultExamReminderOffset: '1day' as const,
};
const WEEKLY = 'pregnancy-weekly-update';
const LOSS_KEY = '@hawa/miscarriage-preferences/v1';
const SCHEDULER_SNAPSHOT_KEYS = ['@hawa/postpartum-nifas-reminders/v1', '@hawa/qadaa-post-ramadan-reminder/v1'];

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  await act(async () => {
    for (let index = 0; index < 40; index += 1) {
      await Promise.resolve();
    }
  });
};

async function render(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>{element}</AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const route = (name: string) => ({key: 'test', name}) as never;
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const pressLabelled = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    const target = renderer.root.findAll(
      node =>
        typeof node.props.onPress === 'function' &&
        (node.props.accessibilityLabel === label ||
          node.findAllByType(Text).some(text => [text.props.children].flat(Infinity).join('') === label)),
    )[0];
    expect(target).toBeTruthy();
    await target.props.onPress();
  });
  await settle();
};

const restoreVia = async () => {
  const renderer = await render(
    <RestoreBackupScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={route('RestoreBackup')} />,
  );
  await pressLabelled(renderer, i18n.t('backupUtility.restore.restoreButton'));
  await pressLabelled(renderer, i18n.t('backupUtility.restore.confirmButton'));
  return renderer;
};

const deleteAccountVia = async () => {
  const navigation = {goBack: jest.fn(), reset: jest.fn()};
  const renderer = await render(<DeleteAccountScreen navigation={navigation as never} route={route('DeleteAccount')} />);
  await act(async () => {
    renderer.root.findByType(TextInput).props.onChangeText(i18n.t('dataPrivacy.deleteAccount.confirmWord'));
  });
  await pressLabelled(renderer, i18n.t('dataPrivacy.deleteAccount.deleteButtonAccessibility'));
  return navigation;
};

const deleteTrackedVia = async () => {
  const confirmWord = i18n.t('backupUtility.delete.confirmWord');
  const renderer = await render(
    <DeleteTrackedDataScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={route('DeleteTrackedData')} />,
  );
  await act(async () => {
    renderer.root
      .findAll(node => node.props.placeholder === confirmWord && typeof node.props.onChangeText === 'function')[0]
      .props.onChangeText(confirmWord);
  });
  await pressLabelled(renderer, i18n.t('backupUtility.delete.deleteButton'));
  return renderer;
};

const storage = AsyncStorage as unknown as {getItem: jest.Mock};
const realGetItem = storage.getItem.getMockImplementation() as (key: string) => Promise<string | null>;

/** The pregnancy state the owner has: objective + dating + notification settings, reminders derived from them. */
const seedPregnancy = async (dating: string) => {
  await setActiveObjective('pregnancy');
  await setPregnancyDating({method: 'lastPeriod', date: dating});
  await setPregnancyNotificationSettings({...SETTINGS});
  await resyncAllPregnancyNotifications();
};

const weeklyInstant = () => fakeNotifeeState.triggers.get(WEEKLY)?.trigger.timestamp;

beforeEach(async () => {
  resumeBulkReminderResync();
  jest.useFakeTimers({now: new Date(2026, 9, 1, 12, 0, 0)});
  storage.getItem.mockImplementation(realGetItem);
  await AsyncStorage.clear();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  resetStructuredStorageForTests();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  resetCycleReminderPreferencesForTests();
  await setActiveObjective('cycle');
  await hydrateCyclePreferences();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  storage.getItem.mockImplementation(realGetItem);
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------------------------------------------
describe('restoring a backup re-reads the owner-only stores', () => {
  it('objective, dating and settings come back from the backup, and the reminders are derived from THEM', async () => {
    await seedPregnancy(DATING_A);
    const restoredInstant = weeklyInstant();
    expect(restoredInstant).toBeDefined();
    await backupNow();

    // After the backup: another objective, another dating, settings changed — Android holds triggers built from them.
    await setPregnancyDating({method: 'lastPeriod', date: DATING_B});
    await setPregnancyNotificationSettings({...SETTINGS, dailyJournalEnabled: true});
    await resyncAllPregnancyNotifications();
    expect(weeklyInstant()).not.toBe(restoredInstant);
    await setActiveObjective('cycle');

    const renderer = await restoreVia();

    expect(textsOf(renderer)).toContain(i18n.t('backupUtility.restore.successMessage'));
    expect(getActiveObjective()).toBe('pregnancy');
    expect(getPregnancyDating().date).toBe(DATING_A);
    expect(getPregnancyNotificationSettings().dailyJournalEnabled).toBe(false);
    expect(scheduledIds()).toContain(WEEKLY);
    expect(weeklyInstant()).toBe(restoredInstant); // derived from the restored dating, not from the memory before it
  });

  it('a later edit builds on the restored record, not on the memory from before the restore', async () => {
    await setActiveObjective('loss');
    await setMiscarriagePreferences({...getMiscarriagePreferences(), miscarriageDate: '2026-09-01', bleedingStatus: 'yes'});
    await backupNow();
    await setMiscarriagePreferences({...getMiscarriagePreferences(), miscarriageDate: '2026-09-20', bleedingStatus: 'no'});

    await restoreVia();
    await setMiscarriageDailyTrackingReminder({dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '20:00'});

    expect(getMiscarriagePreferences()).toMatchObject({miscarriageDate: '2026-09-01', bleedingStatus: 'yes', dailyTrackingReminderEnabled: true});
    const stored = JSON.parse((await secureStorage.getItem(LOSS_KEY)) as string);
    expect(stored).toMatchObject({miscarriageDate: '2026-09-01', bleedingStatus: 'yes', dailyTrackingReminderEnabled: true});
  });
});

// ---------------------------------------------------------------------------------------------------------------
describe('"Supprimer mes données" re-reads the owner-only stores from the emptied storage', () => {
  it('the deleted preferences are gone from memory and no edit writes them back', async () => {
    await setActiveObjective('loss');
    await setMiscarriagePreferences({...getMiscarriagePreferences(), miscarriageDate: '2026-09-01', bleedingStatus: 'yes'});
    expect(await AsyncStorage.getItem(LOSS_KEY)).not.toBeNull();

    await deleteTrackedVia();

    expect(await AsyncStorage.getItem(LOSS_KEY)).toBeNull();
    expect(getMiscarriagePreferences().miscarriageDate).toBeNull();
    await setMiscarriageDailyTrackingReminder({dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '20:00'});
    const stored = JSON.parse((await secureStorage.getItem(LOSS_KEY)) as string);
    expect(stored.miscarriageDate).toBeNull();
    expect(stored.bleedingStatus).toBeNull();
  });
});

// ---------------------------------------------------------------------------------------------------------------
describe('"Delete account" resets the owner-only stores without touching the storage', () => {
  it('memory is back to defaults, the storage stays empty, and nothing regenerates from a later resync', async () => {
    await seedPregnancy(DATING_A);
    await setMiscarriagePreferences({...getMiscarriagePreferences(), miscarriageDate: '2026-09-01'});
    expect(scheduledIds()).toContain(WEEKLY);
    const seen = jest.fn();
    const unsubscribe = subscribePregnancyDating(seen);
    // What App.tsx does: choosing an objective lifts the suspension. The reset notifies this very listener.
    const unsubscribeGate = subscribeActiveObjective(resumeBulkReminderResync);

    const navigation = await deleteAccountVia();
    unsubscribe();
    unsubscribeGate();

    expect(navigation.reset).toHaveBeenCalled();
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
    expect(getActiveObjective()).toBe('cycle');
    expect(getPregnancyDating()).toEqual({method: 'lastPeriod', date: null});
    expect(getMiscarriagePreferences().miscarriageDate).toBeNull();
    expect(seen).toHaveBeenCalled(); // screens refresh
    expect(isBulkReminderResyncSuspended()).toBe(true); // the gate is still set: it is set AFTER the reset

    // Even with the suspension lifted (a new account chose an objective), the stores hold nothing of the old account.
    resumeBulkReminderResync();
    await resyncAllReminderNotifications({force: true});
    expect(scheduledIds()).toEqual([]);
    // The only thing the schedulers themselves persist is their own (empty) bookkeeping snapshot — never user data.
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.filter(key => !SCHEDULER_SNAPSHOT_KEYS.includes(key))).toEqual([]);
  });

  it('an edit after the wipe does not write the deleted data back', async () => {
    await setActiveObjective('loss');
    await setMiscarriagePreferences({...getMiscarriagePreferences(), miscarriageDate: '2026-09-01', bleedingStatus: 'yes'});

    await deleteAccountVia();
    await setMiscarriageDailyTrackingReminder({dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '20:00'});

    const stored = JSON.parse((await secureStorage.getItem(LOSS_KEY)) as string);
    expect(stored.miscarriageDate).toBeNull();
    expect(stored.bleedingStatus).toBeNull();
  });
});

// ---------------------------------------------------------------------------------------------------------------
describe('the registry', () => {
  it('a read that fails is not latched as an empty record: the real data is read once it is readable again', async () => {
    // A failed read of a protected record is "unavailable" (never "empty") — whichever way the suite runs.
    const wasEnabled = isStructuredEncryptionEnabled();
    setStructuredEncryptionEnabled(true);
    try {
      await setPregnancyDating({method: 'dueDate', date: DATING_A});
      storage.getItem.mockImplementation((key: string) =>
        key === '@hawa/pregnancy-dating' ? Promise.reject(new Error('unreadable')) : realGetItem(key),
      );

      await reloadAllOwnerStores();
      expect(getPregnancyDating().date).toBeNull(); // nothing is invented from the failure, but it is not final …

      storage.getItem.mockImplementation(realGetItem);
      await hydratePregnancyDating();
      expect(getPregnancyDating()).toEqual({method: 'dueDate', date: DATING_A}); // … the next read finds the record
    } finally {
      setStructuredEncryptionEnabled(wasEnabled);
    }
  });

  it('a reload never writes: the stored records are byte-identical afterwards', async () => {
    await seedPregnancy(DATING_A);
    await setMiscarriagePreferences({...getMiscarriagePreferences(), miscarriageDate: '2026-09-01'});
    const keys = [...(await AsyncStorage.getAllKeys())].sort();
    const before = await Promise.all(keys.map(key => AsyncStorage.getItem(key)));
    const setItem = AsyncStorage.setItem as jest.Mock;
    setItem.mockClear();

    await reloadAllOwnerStores();
    await hydrateMiscarriagePreferences();

    expect(setItem).not.toHaveBeenCalled();
    expect([...(await AsyncStorage.getAllKeys())].sort()).toEqual(keys);
    expect(await Promise.all(keys.map(key => AsyncStorage.getItem(key)))).toEqual(before);
  });

  it('resetAllOwnerStoresToDefaults performs no storage access', async () => {
    await seedPregnancy(DATING_A);
    storage.getItem.mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (AsyncStorage.removeItem as jest.Mock).mockClear();

    resetAllOwnerStoresToDefaults();

    expect(storage.getItem).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    expect(getPregnancyDating().date).toBeNull();
  });
});
