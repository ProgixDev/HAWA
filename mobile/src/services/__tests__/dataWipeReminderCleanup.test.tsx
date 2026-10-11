import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {DeleteAccountScreen} from '../../screens/DataPrivacyScreens';
import {DeleteTrackedDataScreen, RestoreBackupScreen} from '../../screens/BackupUtilityScreens';
import {backupNow, backupNowForProfile, deleteTrackedData, deleteTrackedDataForProfile} from '../backupService';
import {discardUnreadableRecords} from '../structuredKeyRecovery';
import {__markUnavailableForTests, isStructuredKeyUnavailable, resetStructuredStorageForTests} from '../secureAsyncStorage';
import {__resetNotificationServiceForTests, scheduleLocalNotification, scheduleReminderSeries} from '../pregnancyNotifications';
import {syncCycleReminders} from '../../utils/cycleReminderScheduling';
import {resyncAllReminderNotifications} from '../reminderResync';
import {isBulkReminderResyncSuspended, resumeBulkReminderResync} from '../reminderResyncGate';
import {resyncAllPregnancyNotifications, syncPregnancyNotificationsForActiveObjective} from '../../utils/pregnancyReminderScheduling';
import {hydrateCyclePreferences, setActiveObjective, setCyclePreferences} from '../../state/onboardingPreferences';
import {
  hydrateCycleReminderPreferences,
  resetCycleReminderPreferencesForTests,
  setCycleReminderPreferences,
} from '../../state/cycleReminderPreferences';
import {setPregnancyDating} from '../../state/pregnancyPreferences';
import {setPregnancyNotificationSettings} from '../../state/pregnancyNotificationSettingsStore';
import {saveHealthReminder} from '../../state/pregnancyHealthRemindersStore';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {seedManagedProfileCycleIfNeeded} from '../../state/managedProfileCycleSeed';
import i18n from '../../i18n';
import {
  deliverTrigger,
  displayedIds,
  fakeNotifeeState,
  resetFakeNotifee,
  scheduledIds,
} from '../../testUtils/fakeNotifee';

// Wiping data must cancel the reminders derived from it (Phase 2 repair, F11).
//
// A reminder is a trigger in Android's own notification database. Removing the records it was derived from leaves it
// firing — a medication's name included — with nothing left to cancel it from. These tests run the real screens and
// services over the real notification chokepoint and a STATEFUL fake notifee (testUtils/fakeNotifee.ts), so every
// assertion is about what Android would hold, pending AND on screen, not about which function was called.
//
// What this proves is AWA's JavaScript. It cannot prove how a real phone behaves (Doze, OEM task killers).
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const ALL_ON = {
  upcomingPeriodEnabled: true,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: true,
  dailyJournalEnabled: true,
  dailyJournalTime: '21:30',
  fertileWindowEnabled: true,
  ovulationEnabled: true,
};
const ALL_OFF = {
  ...ALL_ON,
  upcomingPeriodEnabled: false,
  periodStartCheckEnabled: false,
  dailyJournalEnabled: false,
  fertileWindowEnabled: false,
  ovulationEnabled: false,
};
const CYCLE_BASES = [
  'cycle-upcoming-period-reminder',
  'cycle-period-start-check-reminder',
  'cycle-daily-journal-reminder',
  'cycle-fertile-window-reminder',
  'cycle-ovulation-reminder',
] as const;
const cycleIdsOf = (profileId: string) => CYCLE_BASES.map(base => `${base}:${profileId}`).sort();

const MEDICATION_ID = 'pregnancy-health-med-1';
const NOOR = 'noor';
const LEILA = 'leila';

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

/** Presses the first pressable whose accessibility label, or own text, is `label`, and waits for what it started. */
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

const typeInto = async (
  renderer: ReactTestRenderer.ReactTestRenderer,
  predicate: (node: ReactTestRenderer.ReactTestInstance) => boolean,
  value: string,
) => {
  await act(async () => {
    renderer.root.findAll(node => predicate(node) && typeof node.props.onChangeText === 'function')[0].props.onChangeText(value);
  });
};

const storage = AsyncStorage as unknown as {clear: jest.Mock; setItem: jest.Mock; removeItem: jest.Mock; getItem: jest.Mock};
const realClear = storage.clear.getMockImplementation() as () => Promise<void>;
const realRemove = storage.removeItem.getMockImplementation() as (key: string) => Promise<void>;
const realSetItem = storage.setItem.getMockImplementation() as (key: string, value: string) => Promise<void>;
const realGetItem = storage.getItem.getMockImplementation() as (key: string) => Promise<string | null>;

/** What Android held at the instant the first storage wipe / removal ran. */
let nativeAtWipe: {pending: string[]; shown: string[]} | null = null;
const watchNativeAtWipe = () => {
  nativeAtWipe = null;
  const capture = () => {
    nativeAtWipe = nativeAtWipe ?? {pending: scheduledIds(), shown: displayedIds()};
  };
  storage.clear.mockImplementation(async () => {
    capture();
    await realClear();
  });
  storage.removeItem.mockImplementation(async (key: string) => {
    capture();
    await realRemove(key);
  });
};

const awaKeys = async () =>
  (await AsyncStorage.getAllKeys()).filter(key => key.startsWith('@hawa') || key.startsWith('@awa') || key.startsWith('awa:')).sort();

/** The owner: confirmed 28-day cycle, every Cycle reminder on, scheduled by the real scheduler. */
const seedOwnerCycleReminders = async () => {
  await setCyclePreferences({lastPeriodStart: new Date(2026, 8, 10, 12), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
  await setCycleReminderPreferences({...ALL_ON});
  await syncCycleReminders();
};

/** Reminders of other kinds, handed to the native layer directly (as their own schedulers do). Synthetic names. */
const seedOtherReminders = async () => {
  await scheduleLocalNotification({
    id: MEDICATION_ID,
    title: 'Synthetic medication A',
    body: 'Time to take it',
    fireDate: new Date(2026, 9, 2, 8, 0),
    repeatFrequency: 'daily',
    data: {hawaNotificationKind: 'pregnancy-reminder'},
  });
  await scheduleReminderSeries({
    id: 'pregnancy-custom-series-1',
    title: 'Synthetic custom reminder',
    body: 'Walk',
    occurrences: [new Date(2026, 9, 2, 11, 0), new Date(2026, 9, 3, 11, 0), new Date(2026, 9, 4, 11, 0)],
  });
  await scheduleLocalNotification({
    id: 'postpartum-nifas-warning',
    title: 'Synthetic nifas reference',
    body: 'Soon',
    fireDate: new Date(2026, 10, 8, 9, 0),
  });
};

/** A few of them already fired: the repeating one is shown AND re-armed, the others are shown only. */
const deliverSome = () => {
  deliverTrigger(MEDICATION_ID);
  deliverTrigger('pregnancy-custom-series-1::1');
  deliverTrigger(`cycle-ovulation-reminder:${OWNER_PROFILE_ID}`);
};

const seedRecords = async () => {
  await AsyncStorage.setItem('@hawa/pregnancy-health-reminders', JSON.stringify([{id: 'med-1', name: 'Synthetic medication A'}]));
  await AsyncStorage.setItem('@awa/backup/settings-v1', '{"enabled":true}');
  await AsyncStorage.setItem('awa:something-else:v1', 'unclassified-keep-me');
  await AsyncStorage.setItem('someone-elses-key', 'not ours');
};

beforeEach(async () => {
  resumeBulkReminderResync();
  jest.useFakeTimers({now: new Date(2026, 9, 1, 12, 0, 0)});
  storage.clear.mockImplementation(realClear);
  storage.removeItem.mockImplementation(realRemove);
  storage.setItem.mockImplementation(realSetItem);
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
  await hydrateCycleReminderPreferences();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  storage.clear.mockImplementation(realClear);
  storage.removeItem.mockImplementation(realRemove);
  storage.setItem.mockImplementation(realSetItem);
  storage.getItem.mockImplementation(realGetItem);
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------------------------------------------
describe('"Delete account" (DeleteAccountScreen)', () => {
  const open = async (navigation: {goBack: jest.Mock; reset: jest.Mock}) =>
    render(<DeleteAccountScreen navigation={navigation as never} route={route('DeleteAccount')} />);

  const confirmAndDelete = async (navigation: {goBack: jest.Mock; reset: jest.Mock}) => {
    const renderer = await open(navigation);
    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText(i18n.t('dataPrivacy.deleteAccount.confirmWord'));
    });
    await pressLabelled(renderer, i18n.t('dataPrivacy.deleteAccount.deleteButtonAccessibility'));
  };

  it('cancels every pending reminder and empties the notification shade — BEFORE the records are cleared', async () => {
    await seedOwnerCycleReminders();
    await seedOtherReminders();
    await seedRecords();
    deliverSome();
    // 4 cycle reminders (the ovulation one was consumed by its delivery) + the repeating medication reminder (re-armed)
    // + 2 series members (::1 was consumed) + the Nifas one; 3 copies of fired ones are on screen.
    expect(scheduledIds()).toHaveLength(8);
    expect(displayedIds()).toHaveLength(3);
    watchNativeAtWipe();
    const navigation = {goBack: jest.fn(), reset: jest.fn()};

    await confirmAndDelete(navigation);

    expect(nativeAtWipe).toEqual({pending: [], shown: []}); // already gone when the storage was cleared
    expect(scheduledIds()).toEqual([]);
    expect(displayedIds()).toEqual([]);
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
    expect(navigation.reset).toHaveBeenCalledWith({index: 0, routes: [{name: 'Welcome'}]});
  });

  it('a bulk resync later in the same process (language, privacy, permission, foreground) cannot bring the reminders back from the memory of the stores', async () => {
    await seedOwnerCycleReminders();
    expect(scheduledIds()).toEqual(cycleIdsOf(OWNER_PROFILE_ID));
    const navigation = {goBack: jest.fn(), reset: jest.fn()};

    await confirmAndDelete(navigation);
    expect(scheduledIds()).toEqual([]);
    expect(await AsyncStorage.getAllKeys()).toEqual([]); // storage really is empty: nothing was re-created either

    // The stores still hold the deleted cycle in memory; this is what every one of those triggers does.
    await resyncAllReminderNotifications({force: true});
    await resyncAllReminderNotifications();

    expect(scheduledIds()).toEqual([]);
    expect(isBulkReminderResyncSuspended()).toBe(true);
  });

  it('choosing an objective again lifts the suspension: bulk resyncs work normally for the new account', async () => {
    await seedOwnerCycleReminders();
    const navigation = {goBack: jest.fn(), reset: jest.fn()};
    await confirmAndDelete(navigation);
    expect(isBulkReminderResyncSuspended()).toBe(true);

    resumeBulkReminderResync(); // what App.tsx does when the active objective is set again
    await resyncAllReminderNotifications({force: true});

    expect(isBulkReminderResyncSuspended()).toBe(false);
  });

  it('a wrong confirmation word cancels nothing and clears nothing', async () => {
    await seedOwnerCycleReminders();
    await seedRecords();
    const before = scheduledIds();
    const navigation = {goBack: jest.fn(), reset: jest.fn()};
    const renderer = await open(navigation);
    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText('NOT-THE-WORD');
    });

    await pressLabelled(renderer, i18n.t('dataPrivacy.deleteAccount.deleteButtonAccessibility'));

    expect(scheduledIds()).toEqual(before);
    expect(notifee.cancelAllNotifications).not.toHaveBeenCalled();
    expect((await AsyncStorage.getAllKeys()).length).toBeGreaterThan(0);
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  it('a native failure of the cancel never blocks the wipe the person asked for', async () => {
    await seedOwnerCycleReminders();
    await seedRecords();
    (notifee.cancelAllNotifications as jest.Mock).mockRejectedValueOnce(new Error('native boom'));
    const navigation = {goBack: jest.fn(), reset: jest.fn()};

    await confirmAndDelete(navigation);

    expect(await AsyncStorage.getAllKeys()).toEqual([]);
    expect(navigation.reset).toHaveBeenCalled();
  });

  it('if the wipe itself then fails, the records are intact and the next synchronisation puts the reminders back', async () => {
    await seedOwnerCycleReminders();
    const expected = scheduledIds();
    expect(expected).toEqual(cycleIdsOf(OWNER_PROFILE_ID));
    storage.clear.mockImplementation(() => Promise.reject(new Error('disk')));
    const navigation = {goBack: jest.fn(), reset: jest.fn()};
    const renderer = await open(navigation);
    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText(i18n.t('dataPrivacy.deleteAccount.confirmWord'));
    });
    const target = renderer.root.findAll(
      node =>
        typeof node.props.onPress === 'function' &&
        node.props.accessibilityLabel === i18n.t('dataPrivacy.deleteAccount.deleteButtonAccessibility'),
    )[0];

    await act(async () => {
      await expect(target.props.onPress()).rejects.toThrow('disk');
    });

    expect(scheduledIds()).toEqual([]); // cancelled first, as designed
    expect(navigation.reset).not.toHaveBeenCalled();
    expect(await awaKeys()).not.toEqual([]); // the records are all still there

    storage.clear.mockImplementation(realClear);
    await syncCycleReminders(); // what the next launch does
    expect(scheduledIds()).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------------------------------------------
describe('"Supprimer mes données" — the owner\'s whole tracked data (deleteTrackedData / DeleteTrackedDataScreen)', () => {
  it('service: cancels pending reminders and the shade first, then removes the records; foreign and unclassified keys stay', async () => {
    await seedOwnerCycleReminders();
    await seedOtherReminders();
    await seedRecords();
    deliverSome();
    watchNativeAtWipe();

    await deleteTrackedData();

    expect(nativeAtWipe).toEqual({pending: [], shown: []});
    expect(scheduledIds()).toEqual([]);
    expect(displayedIds()).toEqual([]);
    expect(await AsyncStorage.getItem('@hawa/pregnancy-health-reminders')).toBeNull();
    expect(await AsyncStorage.getItem('@hawa/cycle-preferences')).toBeNull();
    expect(await AsyncStorage.getItem('someone-elses-key')).toBe('not ours');
    expect(await AsyncStorage.getItem('awa:something-else:v1')).toBe('unclassified-keep-me');
    expect(await AsyncStorage.getItem('@awa/backup/settings-v1')).toBe('{"enabled":true}');
  });

  it('screen: the same, through the confirmation the person actually goes through', async () => {
    await seedOwnerCycleReminders();
    await seedOtherReminders();
    await seedRecords();
    deliverSome();
    watchNativeAtWipe();
    const confirmWord = i18n.t('backupUtility.delete.confirmWord');
    const renderer = await render(
      <DeleteTrackedDataScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={route('DeleteTrackedData')} />,
    );

    await typeInto(renderer, node => node.props.placeholder === confirmWord, confirmWord);
    await pressLabelled(renderer, i18n.t('backupUtility.delete.deleteButton'));

    expect(nativeAtWipe).toEqual({pending: [], shown: []});
    expect(scheduledIds()).toEqual([]);
    expect(displayedIds()).toEqual([]);
    expect(await AsyncStorage.getItem('@hawa/pregnancy-health-reminders')).toBeNull();
    expect(textsOf(renderer)).toContain(i18n.t('backupUtility.delete.doneTitle'));
  });

  it('screen: a later resync in the same process cannot bring the reminders back — the stores were re-read from the emptied storage', async () => {
    await seedOwnerCycleReminders();
    expect(scheduledIds()).toEqual(cycleIdsOf(OWNER_PROFILE_ID));
    const confirmWord = i18n.t('backupUtility.delete.confirmWord');
    const renderer = await render(
      <DeleteTrackedDataScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={route('DeleteTrackedData')} />,
    );
    await typeInto(renderer, node => node.props.placeholder === confirmWord, confirmWord);
    await pressLabelled(renderer, i18n.t('backupUtility.delete.deleteButton'));
    expect(scheduledIds()).toEqual([]);

    // What a language / privacy change or a foreground refresh does: re-derive every reminder from the stores.
    await resyncAllReminderNotifications({force: true});
    await syncCycleReminders();

    expect(scheduledIds()).toEqual([]);
  });

  it('a series\' extra triggers and the copies of them in the shade go too', async () => {
    await seedOtherReminders();
    deliverTrigger(MEDICATION_ID);
    deliverTrigger('pregnancy-custom-series-1::1');
    expect(scheduledIds()).toEqual(expect.arrayContaining(['pregnancy-custom-series-1', 'pregnancy-custom-series-1::2']));
    expect(displayedIds()).toEqual([MEDICATION_ID, 'pregnancy-custom-series-1::1'].sort());

    await deleteTrackedData();

    expect(scheduledIds()).toEqual([]);
    expect(displayedIds()).toEqual([]);
  });

  it('a native failure of the cancel never blocks the removal', async () => {
    await seedRecords();
    (notifee.cancelAllNotifications as jest.Mock).mockRejectedValueOnce(new Error('native boom'));

    await expect(deleteTrackedData()).resolves.toBeUndefined();

    expect(await AsyncStorage.getItem('@hawa/pregnancy-health-reminders')).toBeNull();
  });

  it('removal interrupted by a storage error: the records are still there, the reminders come back with the next sync', async () => {
    await seedOwnerCycleReminders();
    const expected = scheduledIds();
    storage.removeItem.mockImplementation((key: string) =>
      key === '@hawa/cycle-reminder-preferences/v1' ? Promise.reject(new Error('disk')) : realRemove(key),
    );

    await expect(deleteTrackedData()).rejects.toThrow('disk');
    storage.removeItem.mockImplementation(realRemove);

    expect(scheduledIds()).toEqual([]);
    expect(await AsyncStorage.getItem('@hawa/cycle-reminder-preferences/v1')).not.toBeNull();
    await syncCycleReminders();
    expect(scheduledIds().length).toBeGreaterThan(0); // her preferences survived, so her reminders are derived again
    expect(scheduledIds().every(id => expected.includes(id))).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------
describe('"Supprimer les données de suivi" of ONE daughter (deleteTrackedDataForProfile)', () => {
  const makeDaughter = async (id: string, firstName: string, lastPeriodDate: string) => {
    const profile = await addManagedProfile({
      id,
      type: 'daughter',
      firstName,
      birthDate: '2014-05-01',
      hasHadFirstPeriod: true,
      lastPeriodDate,
      periodLength: 5,
      cycleLength: 28,
      regularity: 'yes',
    });
    await setActiveProfileId(profile.id);
    await hydrateCyclePreferences();
    await hydrateCycleReminderPreferences();
    await seedManagedProfileCycleIfNeeded(profile.id);
    await setCycleReminderPreferences({...ALL_ON});
    await syncCycleReminders();
  };

  const seedFamily = async () => {
    await seedOwnerCycleReminders();
    await makeDaughter(NOOR, 'Noor', '2026-09-12');
    await makeDaughter(LEILA, 'Leila', '2026-09-15');
    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateCyclePreferences();
    await hydrateCycleReminderPreferences();
    [OWNER_PROFILE_ID, NOOR, LEILA].forEach(id => {
      deliverTrigger(`cycle-daily-journal-reminder:${id}`);
      deliverTrigger(`cycle-ovulation-reminder:${id}`);
    });
  };

  const hers = (id: string) => id.endsWith(`:${NOOR}`);
  const herKeys = async () => (await AsyncStorage.getAllKeys()).filter(key => key.endsWith(`:profile:${NOOR}`));

  it('cancels hers — pending and shown — and leaves the owner\'s and the other daughter\'s exactly as they were', async () => {
    await seedFamily();
    const othersPending = scheduledIds().filter(id => !hers(id));
    const othersShown = displayedIds().filter(id => !hers(id));
    // Hers: the journal reminder is pending (re-armed) and shown, the ovulation one is shown only (consumed).
    expect(scheduledIds().filter(hers)).toHaveLength(4);
    expect(displayedIds().filter(hers)).toHaveLength(2);
    expect(othersShown).toHaveLength(4);
    expect((await herKeys()).length).toBeGreaterThan(0);

    await deleteTrackedDataForProfile(NOOR);

    expect(scheduledIds().filter(hers)).toEqual([]);
    expect(displayedIds().filter(hers)).toEqual([]);
    expect(scheduledIds().filter(id => !hers(id))).toEqual(othersPending);
    expect(displayedIds().filter(id => !hers(id))).toEqual(othersShown);
    expect(notifee.cancelAllNotifications).not.toHaveBeenCalled();
    expect(await herKeys()).toEqual([]);
    expect((await AsyncStorage.getAllKeys()).filter(key => key.endsWith(`:profile:${LEILA}`)).length).toBeGreaterThan(0);
  });

  it('screen: the same, with her active, through the confirmation she goes through', async () => {
    await seedFamily();
    await setActiveProfileId(NOOR);
    await hydrateCyclePreferences();
    await hydrateCycleReminderPreferences();
    const othersPending = scheduledIds().filter(id => !hers(id));
    const confirmWord = i18n.t('backupUtility.delete.confirmWord');
    const renderer = await render(
      <DeleteTrackedDataScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={route('DeleteTrackedData')} />,
    );

    await typeInto(renderer, node => node.props.placeholder === confirmWord, confirmWord);
    await pressLabelled(renderer, i18n.t('backupUtility.delete.deleteButton'));

    expect(scheduledIds().filter(hers)).toEqual([]);
    expect(displayedIds().filter(hers)).toEqual([]);
    expect(scheduledIds().filter(id => !hers(id))).toEqual(othersPending);
  });

  it('a native failure while cancelling hers never blocks the deletion she asked for', async () => {
    await seedFamily();
    const cancelTrigger = notifee.cancelTriggerNotification as jest.Mock;
    const realCancel = cancelTrigger.getMockImplementation() as (id: string) => Promise<void>;
    cancelTrigger.mockImplementation(() => Promise.reject(new Error('native boom')));

    await expect(deleteTrackedDataForProfile(NOOR)).resolves.toBeUndefined();
    cancelTrigger.mockImplementation(realCancel);

    expect(await herKeys()).toEqual([]);
  });

  it('is a no-op for the owner id: it deletes nothing and cancels nothing', async () => {
    await seedFamily();
    const before = scheduledIds();
    const keysBefore = await AsyncStorage.getAllKeys();
    jest.clearAllMocks();

    await deleteTrackedDataForProfile(OWNER_PROFILE_ID);

    expect(scheduledIds()).toEqual(before);
    expect(await AsyncStorage.getAllKeys()).toEqual(keysBefore);
    expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------------------------------------------
describe('restoring a backup (RestoreBackupScreen)', () => {
  const restoreVia = async () => {
    const renderer = await render(
      <RestoreBackupScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={route('RestoreBackup')} />,
    );
    await pressLabelled(renderer, i18n.t('backupUtility.restore.restoreButton'));
    await pressLabelled(renderer, i18n.t('backupUtility.restore.confirmButton'));
    return renderer;
  };

  it('owner: the restored records are turned into scheduled reminders again, without waiting for anything else', async () => {
    await seedOwnerCycleReminders();
    const expected = scheduledIds();
    expect(expected).toEqual(cycleIdsOf(OWNER_PROFILE_ID));
    await backupNow();
    // After the backup she switched every reminder off: Android holds none.
    await setCycleReminderPreferences({...ALL_OFF});
    await syncCycleReminders();
    expect(scheduledIds()).toEqual([]);

    const renderer = await restoreVia();

    expect(textsOf(renderer)).toContain(i18n.t('backupUtility.restore.successMessage'));
    expect(scheduledIds()).toEqual(expected);
  });

  it('owner: triggers built from the records the restore replaced are rebuilt from the restored ones', async () => {
    await seedOwnerCycleReminders();
    await backupNow();
    const restoredInstant = fakeNotifeeState.triggers.get(`cycle-upcoming-period-reminder:${OWNER_PROFILE_ID}`)?.trigger.timestamp;
    // She moved her period afterwards: Android holds triggers built from the NEW cycle.
    await setCyclePreferences({lastPeriodStart: new Date(2026, 8, 14, 12), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    await syncCycleReminders();
    const staleInstant = fakeNotifeeState.triggers.get(`cycle-upcoming-period-reminder:${OWNER_PROFILE_ID}`)?.trigger.timestamp;
    expect(staleInstant).toBeDefined();
    expect(staleInstant).not.toBe(restoredInstant);

    await restoreVia();

    expect(fakeNotifeeState.triggers.get(`cycle-upcoming-period-reminder:${OWNER_PROFILE_ID}`)?.trigger.timestamp).toBe(restoredInstant);
    expect(scheduledIds()).toEqual(cycleIdsOf(OWNER_PROFILE_ID));
  });

  it('daughter: HER restore re-derives HER reminders and leaves everyone else\'s untouched', async () => {
    await seedOwnerCycleReminders();
    const profile = await addManagedProfile({
      id: NOOR,
      type: 'daughter',
      firstName: 'Noor',
      birthDate: '2014-05-01',
      hasHadFirstPeriod: true,
      lastPeriodDate: '2026-09-12',
      periodLength: 5,
      cycleLength: 28,
      regularity: 'yes',
    });
    await setActiveProfileId(profile.id);
    await hydrateCyclePreferences();
    await hydrateCycleReminderPreferences();
    await seedManagedProfileCycleIfNeeded(profile.id);
    await setCycleReminderPreferences({...ALL_ON});
    await syncCycleReminders();
    const hers = scheduledIds().filter(id => id.endsWith(`:${NOOR}`));
    expect(hers).toEqual(cycleIdsOf(NOOR));
    await backupNowForProfile(NOOR);
    await setCycleReminderPreferences({...ALL_OFF});
    await syncCycleReminders();
    expect(scheduledIds().filter(id => id.endsWith(`:${NOOR}`))).toEqual([]);
    const ownerBefore = scheduledIds().filter(id => id.endsWith(`:${OWNER_PROFILE_ID}`));
    expect(ownerBefore).toEqual(cycleIdsOf(OWNER_PROFILE_ID));

    await restoreVia();

    expect(scheduledIds().filter(id => id.endsWith(`:${NOOR}`))).toEqual(hers);
    expect(scheduledIds().filter(id => id.endsWith(`:${OWNER_PROFILE_ID}`))).toEqual(ownerBefore);
  });

  it('a restore that fails changes no reminder', async () => {
    await seedOwnerCycleReminders();
    await backupNow();
    await setCycleReminderPreferences({...ALL_OFF});
    await syncCycleReminders();
    const created = (notifee.createTriggerNotification as jest.Mock).mock.calls.length;
    storage.setItem.mockImplementation((key: string, value: string) =>
      key === '@awa/restore-journal/v1' ? Promise.reject(new Error('disk')) : realSetItem(key, value),
    );

    const renderer = await restoreVia();
    storage.setItem.mockImplementation(realSetItem);

    expect(textsOf(renderer)).toContain(i18n.t('backupUtility.restore.errorMessage'));
    expect(scheduledIds()).toEqual([]);
    expect((notifee.createTriggerNotification as jest.Mock).mock.calls.length).toBe(created);
  });
});

// ---------------------------------------------------------------------------------------------------------------
describe('erasing unreadable records (discardUnreadableRecords)', () => {
  const MED_KEY = '@hawa/pregnancy-health-reminders';
  const CUSTOM_KEY = '@hawa/pregnancy-custom-reminders';

  /**
   * The realistic orphan: a medication reminder scheduled while Pregnancy was active, whose record then became
   * unreadable. The Pregnancy synchronisation cannot enumerate it any more (the store answers a failed read with "no
   * reminders"), so nothing can cancel it by id — while the person's objective is already something else.
   */
  const seedOrphanedMedicationAndCycle = async () => {
    await setActiveObjective('pregnancy');
    await setPregnancyDating({method: 'lastPeriod', date: new Date(2026, 6, 20, 12).toISOString()});
    await setPregnancyNotificationSettings({
      weeklyUpdateEnabled: true,
      dailyJournalEnabled: false,
      dailyJournalTime: '20:00',
      appointmentsEnabled: true,
      examsEnabled: true,
      defaultAppointmentReminderOffset: '1day',
      defaultExamReminderOffset: '1day',
    });
    await saveHealthReminder({
      id: 'med-1',
      kind: 'medication',
      name: 'Synthetic medication A',
      time: '08:00',
      repeat: 'daily',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await resyncAllPregnancyNotifications();
    expect(scheduledIds()).toEqual(expect.arrayContaining([MEDICATION_ID, 'pregnancy-weekly-update']));

    // The record can no longer be read (what a lost key or damaged ciphertext does) …
    __markUnavailableForTests(MED_KEY);
    storage.getItem.mockImplementation((key: string) => (key === MED_KEY ? Promise.reject(new Error('unreadable')) : realGetItem(key)));
    // … and meanwhile she moved to another objective, so the Pregnancy reminders are swept — except the one it cannot name.
    await setActiveObjective('cycle');
    await seedOwnerCycleReminders();
    await syncPregnancyNotificationsForActiveObjective();
    storage.getItem.mockImplementation(realGetItem);
    expect(scheduledIds()).toEqual(expect.arrayContaining([MEDICATION_ID, ...cycleIdsOf(OWNER_PROFILE_ID)]));
    expect(scheduledIds()).not.toContain('pregnancy-weekly-update');
    deliverTrigger(MEDICATION_ID);
    expect(displayedIds()).toEqual([MEDICATION_ID]);
  };

  it('cancels EVERYTHING first (the orphan included, and the shade), then rebuilds from what is still readable', async () => {
    await seedOrphanedMedicationAndCycle();
    watchNativeAtWipe();

    await expect(discardUnreadableRecords()).resolves.toBe(1);

    expect(nativeAtWipe).toEqual({pending: [], shown: []}); // gone before the record was erased
    expect(scheduledIds()).toEqual(cycleIdsOf(OWNER_PROFILE_ID)); // the readable domain is back, nothing else
    expect(displayedIds()).toEqual([]);
    expect(await AsyncStorage.getItem(MED_KEY)).toBeNull();
    expect(isStructuredKeyUnavailable(MED_KEY)).toBe(false);
  });

  it('stopping half-way still brings back what was cancelled for every readable domain', async () => {
    await seedOrphanedMedicationAndCycle();
    await AsyncStorage.setItem(CUSTOM_KEY, '[]');
    __markUnavailableForTests(CUSTOM_KEY);
    storage.removeItem.mockImplementation((key: string) => (key === CUSTOM_KEY ? Promise.reject(new Error('disk')) : realRemove(key)));

    await expect(discardUnreadableRecords()).rejects.toThrow('disk');
    storage.removeItem.mockImplementation(realRemove);

    expect(scheduledIds()).toEqual(cycleIdsOf(OWNER_PROFILE_ID)); // cancelled first, rebuilt although the erasure failed
    expect(await AsyncStorage.getItem(MED_KEY)).toBeNull(); // the first record was erased …
    expect(await AsyncStorage.getItem(CUSTOM_KEY)).toBe('[]'); // … the one whose removal failed is untouched
  });

  it('a native failure of the cancel never blocks the erasure the person chose', async () => {
    await seedOrphanedMedicationAndCycle();
    (notifee.cancelAllNotifications as jest.Mock).mockRejectedValueOnce(new Error('native boom'));

    await expect(discardUnreadableRecords()).resolves.toBe(1);

    expect(await AsyncStorage.getItem(MED_KEY)).toBeNull(); // the record was erased all the same
    expect(isStructuredKeyUnavailable(MED_KEY)).toBe(false);
    expect(scheduledIds()).toEqual(expect.arrayContaining(cycleIdsOf(OWNER_PROFILE_ID))); // and the rest was rebuilt
  });

  it('with nothing unreadable it is a no-op: nothing is cancelled, nothing is rebuilt', async () => {
    await seedOwnerCycleReminders();
    const before = scheduledIds();
    jest.clearAllMocks();

    await expect(discardUnreadableRecords()).resolves.toBe(0);

    expect(scheduledIds()).toEqual(before);
    expect(notifee.cancelAllNotifications).not.toHaveBeenCalled();
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('an unreadable record whose domain has no reminder changes none, and the others are rebuilt', async () => {
    await seedOwnerCycleReminders();
    const before = scheduledIds();
    __markUnavailableForTests('@hawa/menopause-preferences/v1');

    await expect(discardUnreadableRecords()).resolves.toBe(1);

    expect(scheduledIds()).toEqual(before);
  });
});
