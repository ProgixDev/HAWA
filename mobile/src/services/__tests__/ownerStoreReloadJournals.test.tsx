import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {DeleteAccountScreen} from '../../screens/DataPrivacyScreens';
import {DeleteTrackedDataScreen, RestoreBackupScreen} from '../../screens/BackupUtilityScreens';
import {backupNow} from '../backupService';
import secureStorage, {resetStructuredStorageForTests} from '../secureAsyncStorage';
import {__resetNotificationServiceForTests} from '../pregnancyNotifications';
import {resumeBulkReminderResync} from '../reminderResyncGate';
import {hydrateCyclePreferences, setActiveObjective} from '../../state/onboardingPreferences';
import {
  getAllPostpartumJournalEntries,
  hydratePostpartumJournal,
  savePostpartumJournalField,
} from '../../state/postpartumJournalStore';
import {
  getAllMiscarriageJournalEntries,
  hydrateMiscarriageJournal,
  saveMiscarriageJournalField,
} from '../../state/miscarriageJournalStore';
import {
  getContraceptionJournalEntry,
  hydrateContraceptionJournal,
  saveContraceptionJournalField,
} from '../../state/contraceptionJournalStore';
import {
  getAllIrregularJournalEntries,
  hydrateIrregularJournal,
  saveIrregularJournalField,
} from '../../state/irregularJournalStore';
import {
  getAllMenopauseJournalEntries,
  getMenopauseLabResults,
  addMenopauseLabResult,
  hydrateMenopauseJournal,
  saveMenopauseJournalField,
} from '../../state/menopauseJournalStore';
import {
  getAllPostpartumLochiaEntries,
  getPostpartumLochiaTracking,
  hydratePostpartumLochia,
  markPostpartumLochiaEnded,
  savePostpartumLochiaEntry,
} from '../../state/postpartumLochiaStore';
import {
  addContraceptionEvent,
  getAllContraceptionEvents,
  hydrateContraceptionEvents,
} from '../../state/contraceptionEventStore';
import {
  getAllContraceptionIntakeRecords,
  hydrateContraceptionIntakeHistory,
  setContraceptionIntakeStatus,
} from '../../state/contraceptionIntakeHistoryStore';
import {hydrateQadaaProgress} from '../../state/qadaaProgressStore';
import {
  __registeredOwnerStoresForTests,
  reloadAllOwnerStores,
  resetAllOwnerStoresToDefaults,
} from '../../state/ownerStoreRegistry';
import {resetManagedProfilesForTests, addManagedProfile} from '../../state/managedProfilesStore';
import {resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {resetCycleReminderPreferencesForTests} from '../../state/cycleReminderPreferences';
import i18n from '../../i18n';
import {resetFakeNotifee} from '../../testUtils/fakeNotifee';

// Phase 3 follow-up to ownerStoreReload.test.tsx (F11): the journal / history stores below memoise their first read of
// a record that is NOT profile-scoped. A restore or a wipe used to leave them serving (and a later edit writing back)
// the records that no longer existed.
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const DAY_A = '2026-09-01';
const DAY_B = '2026-09-02';
const PROGRESS_KEY = 'awa:qadaa:progress:v1';

const KEYS = {
  postpartum: '@hawa/postpartum-journal/v3',
  miscarriage: '@hawa/miscarriage-journal/v1',
  contraception: '@hawa/contraception-journal/v1',
  irregular: '@hawa/irregular-journal/v1',
  menopause: '@hawa/menopause-journal/v1',
  menopauseLab: '@hawa/menopause-lab-results/v1',
  lochia: '@hawa/postpartum-lochia/v1',
  events: '@hawa/contraception-event-history/v1',
  intake: '@hawa/contraception-intake-history/v1',
};

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

const LOCHIA = {
  flow: 'Léger' as const,
  color: 'Rose' as const,
  consistency: 'Liquide' as const,
  symptoms: [] as string[],
};

/** One record in every store under audit, for `day`; `marker` tells two generations of records apart. */
const seedAll = async (day: string, marker: string) => {
  await savePostpartumJournalField(day, 'fatigue', marker);
  await saveMiscarriageJournalField(day, 'bleeding', marker);
  await saveContraceptionJournalField(day, 'notes', marker);
  await saveIrregularJournalField(day, 'pain', marker);
  await saveMenopauseJournalField(day, 'notes', marker);
  await addMenopauseLabResult({type: 'fsh', value: marker === 'A' ? 10 : 20, date: day} as never);
  await savePostpartumLochiaEntry(day, {...LOCHIA, note: marker});
  await markPostpartumLochiaEnded(day);
  await setContraceptionIntakeStatus(day, marker === 'A' ? 'taken' : 'missed', 'pill');
  await addContraceptionEvent(day, marker === 'A' ? 'ring_insertion' : 'ring_removal');
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify({completedDays: marker === 'A' ? 3 : 9, updatedAt: 1}));
};

const hydrateAll = async () => {
  await hydratePostpartumJournal();
  await hydrateMiscarriageJournal();
  await hydrateContraceptionJournal();
  await hydrateIrregularJournal();
  await hydrateMenopauseJournal();
  await hydratePostpartumLochia();
  await hydrateContraceptionIntakeHistory();
  await hydrateContraceptionEvents();
};

const memoryEmpty = () => {
  expect(getAllPostpartumJournalEntries()).toEqual({});
  expect(getAllMiscarriageJournalEntries()).toEqual({});
  expect(getContraceptionJournalEntry(DAY_A)).toBeUndefined();
  expect(getAllIrregularJournalEntries()).toEqual({});
  expect(getAllMenopauseJournalEntries()).toEqual({});
  expect(getMenopauseLabResults()).toEqual([]);
  expect(getAllPostpartumLochiaEntries()).toEqual({});
  expect(getPostpartumLochiaTracking()).toEqual({endedDate: null});
  expect(getAllContraceptionIntakeRecords()).toEqual({});
  expect(getAllContraceptionEvents()).toEqual({});
};

const memoryHolds = (day: string, marker: string) => {
  expect(getAllPostpartumJournalEntries()[day]?.fatigue).toBe(marker);
  expect(getAllMiscarriageJournalEntries()[day]?.bleeding).toBe(marker);
  expect(getContraceptionJournalEntry(day)?.notes).toBe(marker);
  expect(getAllIrregularJournalEntries()[day]?.pain).toBe(marker);
  expect(getAllMenopauseJournalEntries()[day]?.notes).toBe(marker);
  expect(getMenopauseLabResults().map(result => result.value)).toEqual(marker === 'A' ? [10] : [10, 20]); // lab results are appended
  expect(getAllPostpartumLochiaEntries()[day]?.note).toBe(marker);
  expect(getPostpartumLochiaTracking().endedDate).toBe(day);
  expect(getAllContraceptionIntakeRecords()[day]?.status).toBe(marker === 'A' ? 'taken' : 'missed');
  expect((getAllContraceptionEvents()[day] ?? []).map(event => event.type)).toEqual([
    ...(marker === 'A' ? ['ring_insertion'] : ['ring_insertion', 'ring_removal']), // events are appended
  ]);
};

const storedDates = async (key: string): Promise<string[] | null> => {
  const raw = await secureStorage.getItem(key);
  if (raw === null) {return null;}
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const body = parsed && typeof parsed === 'object' && 'entries' in parsed && 'tracking' in parsed ? parsed.entries : parsed;
  return Object.keys(body as Record<string, unknown>).sort();
};

beforeEach(async () => {
  resumeBulkReminderResync();
  jest.useFakeTimers({now: new Date(2026, 9, 1, 12, 0, 0)});
  await AsyncStorage.clear();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  resetStructuredStorageForTests();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  resetCycleReminderPreferencesForTests();
  await setActiveObjective('cycle');
  await hydrateCyclePreferences();
  // Start every test from empty memory (modules are shared across tests of this file).
  resetAllOwnerStoresToDefaults();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('registration', () => {
  it('registers the audited stores', () => {
    expect(__registeredOwnerStoresForTests()).toEqual(
      expect.arrayContaining([
        'postpartum-journal',
        'miscarriage-journal',
        'contraception-journal',
        'irregular-journal',
        'menopause-journal',
        'postpartum-lochia',
        'contraception-events',
        'contraception-intake-history',
        'qadaa-progress',
      ]),
    );
  });
});

describe('restoring a backup re-reads the journal and history stores', () => {
  it('memory holds the restored records, and a later edit builds on them', async () => {
    await seedAll(DAY_A, 'A');
    await backupNow();
    // After the backup: other values for the same day, plus another day (memory AND storage).
    await seedAll(DAY_A, 'B');
    await savePostpartumJournalField(DAY_B, 'fatigue', 'later');
    memoryHolds(DAY_A, 'B');

    await restoreVia();

    memoryHolds(DAY_A, 'A');
    expect(getAllPostpartumJournalEntries()[DAY_B]).toBeUndefined();
    // legacy counter: re-read from the restored record
    expect((await hydrateQadaaProgress()).completedDays).toBe(3);

    await savePostpartumJournalField(DAY_A, 'sleep', 'bonne');
    expect(await storedDates(KEYS.postpartum)).toEqual([DAY_A]);
    expect(getAllPostpartumJournalEntries()[DAY_A]).toMatchObject({fatigue: 'A', sleep: 'bonne'});
  });
});

describe('"Supprimer mes données" re-reads the emptied storage', () => {
  it('memory is empty, no key is recreated, and an edit does not write the deleted records back', async () => {
    await seedAll(DAY_A, 'A');
    await hydrateAll();
    await hydrateQadaaProgress();

    await deleteTrackedVia();

    memoryEmpty();
    expect((await hydrateQadaaProgress()).completedDays).toBe(0);
    for (const key of Object.values(KEYS)) {
      expect(await AsyncStorage.getItem(key)).toBeNull();
    }
    await savePostpartumJournalField(DAY_B, 'fatigue', 'new');
    expect(await storedDates(KEYS.postpartum)).toEqual([DAY_B]);
    await savePostpartumLochiaEntry(DAY_B, {...LOCHIA});
    expect(await storedDates(KEYS.lochia)).toEqual([DAY_B]);
    expect(getPostpartumLochiaTracking().endedDate).toBeNull();
  });
});

describe('"Delete account" resets the stores without touching the storage', () => {
  it('memory is back to defaults, storage is empty, and a later edit writes only the new record', async () => {
    await seedAll(DAY_A, 'A');
    await hydrateQadaaProgress();
    const listener = jest.fn();
    // a screen listening to the journal is told to refresh
    const {subscribePostpartumJournal} = require('../../state/postpartumJournalStore');
    const unsubscribe = subscribePostpartumJournal(listener);

    const navigation = await deleteAccountVia();
    unsubscribe();

    expect(navigation.reset).toHaveBeenCalled();
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
    memoryEmpty();
    expect(listener).toHaveBeenCalled();

    // Reading the empty storage back neither fails nor recreates a key; the old legacy counter is gone from memory,
    // so a fresh Qadaa ledger can not fold it back in.
    await hydrateAll();
    expect((await hydrateQadaaProgress()).completedDays).toBe(0);
    expect(await AsyncStorage.getAllKeys()).toEqual([]);

    await saveMiscarriageJournalField(DAY_B, 'bleeding', 'new');
    expect(await storedDates(KEYS.miscarriage)).toEqual([DAY_B]);
    await addContraceptionEvent(DAY_B, 'patch_application');
    expect(await storedDates(KEYS.events)).toEqual([DAY_B]);
  });

  it('a read still in flight when the wipe happens does not bring the old records back', async () => {
    await seedAll(DAY_A, 'A');
    resetAllOwnerStoresToDefaults(); // memory un-hydrated, storage holds the records
    const reading = Promise.all([hydratePostpartumJournal(), hydrateContraceptionEvents(), hydrateQadaaProgress()]);
    resetAllOwnerStoresToDefaults(); // the wipe lands while the reads are pending
    await reading;
    await settle();

    expect(getAllPostpartumJournalEntries()).toEqual({});
    expect(getAllContraceptionEvents()).toEqual({});
  });
});

describe('the registry with these stores', () => {
  it('a reload never writes', async () => {
    await seedAll(DAY_A, 'A');
    const keys = [...(await AsyncStorage.getAllKeys())].sort();
    const before = await Promise.all(keys.map(key => AsyncStorage.getItem(key)));
    const setItem = AsyncStorage.setItem as jest.Mock;
    const removeItem = AsyncStorage.removeItem as jest.Mock;
    setItem.mockClear();
    removeItem.mockClear();

    await reloadAllOwnerStores();
    await settle();

    memoryHolds(DAY_A, 'A');
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(await Promise.all(keys.map(key => AsyncStorage.getItem(key)))).toEqual(before);
  });

  it('a profile switch does not touch the owner-only stores', async () => {
    await seedAll(DAY_A, 'A');
    const profile = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2014-05-01', hasHadFirstPeriod: false});
    const setItem = AsyncStorage.setItem as jest.Mock;
    setItem.mockClear();

    await setActiveProfileId(profile.id);
    await settle();

    memoryHolds(DAY_A, 'A');
    expect(setItem.mock.calls.filter(([key]) => Object.values(KEYS).includes(String(key)))).toEqual([]);
  });
});
