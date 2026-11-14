import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Switch, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import CycleRemindersScreen from '../CycleRemindersScreen';
import {cancelLocalNotification, scheduleLocalNotification} from '../../services/pregnancyNotifications';
import {syncCycleReminders} from '../../utils/cycleReminderScheduling';
import {
  getCycleReminderPreferences,
  hydrateCycleReminderPreferences,
  resetCycleReminderPreferencesForTests,
  setCycleReminderPreferences,
  subscribeCycleReminderPreferences,
} from '../../state/cycleReminderPreferences';
import {reloadCycleStateFromStorage, setCyclePreferences, setSelectedObjective} from '../../state/onboardingPreferences';
import {addManagedProfile} from '../../state/managedProfilesStore';
import {resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {resetObjectiveSetupFlowForTests} from '../../state/objectiveSetupFlow';
import {setAppLanguage} from '../../state/themePreferences';
import {resetSaveFailureForTests} from '../../services/saveFailure';
import i18n from '../../i18n';

// PHASE 4 — cycle reminders (CycleRemindersScreen). The real screen, the real preference stores and the real scheduler; only the single
// notification chokepoint (scheduleLocalNotification / cancelLocalNotification) and Android's permission answer are simulated.
// Already covered elsewhere and not repeated: the scheduler's own rules (cycleReminderScheduling*.test.ts), the stored "24:30" time
// (StoredMidnightTimeEditors) and the English time labels (MidnightTimeLabelsEnglish).
// "Today" is Thu 20 Aug 2026 12:00 (only Date is faked); last period 5 Aug, 28-day regular cycle: next period Wed 2 Sep.

jest.mock('../../services/pregnancyNotifications', () => ({
  ...jest.requireActual('../../services/pregnancyNotifications'),
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));

const TODAY = new Date(2026, 7, 20, 12, 0, 0);
const START = new Date(2026, 7, 5, 12, 0, 0);
const PREFS_KEY = '@hawa/cycle-reminder-preferences/v1';
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];
const mockedNotifee = notifee as unknown as {requestPermission: jest.Mock; getNotificationSettings: jest.Mock; openNotificationSettings: jest.Mock; isChannelBlocked: jest.Mock};
const schedule = scheduleLocalNotification as jest.Mock;
const cancel = cancelLocalNotification as jest.Mock;
const realSetItem = (AsyncStorage.setItem as jest.Mock).getMockImplementation();

const OFF = {
  upcomingPeriodEnabled: false,
  upcomingPeriodDaysBefore: 2 as const,
  periodStartCheckEnabled: false,
  dailyJournalEnabled: false,
  dailyJournalTime: null,
  fertileWindowEnabled: false,
  ovulationEnabled: false,
};

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await new Promise<void>(resolve => setImmediate(resolve));
    });
  }
};

const androidNotifications = (state: 'allowed' | 'refused') => {
  const authorizationStatus = state === 'allowed' ? AuthorizationStatus.AUTHORIZED : AuthorizationStatus.DENIED;
  mockedNotifee.requestPermission.mockResolvedValue({authorizationStatus});
  mockedNotifee.getNotificationSettings.mockResolvedValue({authorizationStatus});
  mockedNotifee.isChannelBlocked.mockResolvedValue(false);
  mockedNotifee.openNotificationSettings.mockResolvedValue(undefined);
};

async function mount(mode: 'onboarding' | 'edit') {
  const navigation = {navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn(), reset: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <CycleRemindersScreen navigation={navigation as never} route={{key: 'k', name: 'CycleReminders', params: {mode}} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await settle();
  return {renderer, navigation};
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);
const findButton = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      (node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => textOf(text) === label)),
  );
  return matches.find(match => !matches.some(other => other !== match && match.findAll(node => node === other).length > 0));
};
async function press(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const target = findButton(renderer, label);
  if (!target) {throw new Error(`No button "${label}"`);}
  await act(async () => {
    await target.props.onPress();
  });
  await settle();
}
const switchFor = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const found = renderer.root.findAllByType(Switch).find(item => item.props.accessibilityLabel === label);
  if (!found) {throw new Error(`No switch "${label}"`);}
  return found;
};
async function turn(renderer: ReactTestRenderer.ReactTestRenderer, label: string, value: boolean) {
  await act(async () => {
    switchFor(renderer, label).props.onValueChange(value);
  });
  await settle();
}

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);
const UPCOMING = () => t('cycleReminders.upcomingPeriodTitle');
const PERIOD_START = () => t('cycleReminders.periodStartCheckTitle');
const JOURNAL = () => t('dailyJournalSheet.defaultTitle');
const FERTILITY = () => t('cycleReminders.fertilityTitle');
const FERTILE_WINDOW = () => t('journalCycleEvolution.estimatedFertileWindow');
const OVULATION = () => t('journalCycleEvolution.phase.ovulation');
const SAVE = () => t('common.save');
const CONTINUE = () => t('common.continue');
const scheduledIds = () => schedule.mock.calls.map(([arg]) => arg.id as string);

let alertSpy: jest.SpyInstance;
let unsubscribe: (() => void) | undefined;

beforeEach(async () => {
  jest.useFakeTimers({
    now: TODAY,
    doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'hrtime'],
  });
  jest.clearAllMocks();
  schedule.mockResolvedValue(true);
  cancel.mockResolvedValue(undefined);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(realSetItem);
  resetSaveFailureForTests();
  resetObjectiveSetupFlowForTests();
  androidNotifications('allowed');
  await AsyncStorage.clear();
  await resetActiveProfileForTests();
  resetCycleReminderPreferencesForTests();
  await hydrateCycleReminderPreferences();
  await setSelectedObjective('cycle');
  await reloadCycleStateFromStorage();
  await setCyclePreferences({lastPeriodStart: START, periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  // the same wiring as App.tsx: a saved reminder choice re-derives the notifications
  unsubscribe = subscribeCycleReminderPreferences(() => {
    syncCycleReminders().catch(() => undefined);
  });
  schedule.mockClear();
  cancel.mockClear();
});

afterEach(() => {
  unsubscribe?.();
  (AsyncStorage.setItem as jest.Mock).mockImplementation(realSetItem);
  alertSpy.mockRestore();
  jest.useRealTimers();
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('switches, options and what is saved', () => {
  it('opens on the stored choices, and merely opening it asks nothing and writes nothing', async () => {
    await setCycleReminderPreferences({...OFF, upcomingPeriodEnabled: true, upcomingPeriodDaysBefore: 3, dailyJournalEnabled: true, dailyJournalTime: '21:15'});
    const {renderer} = await mount('edit');
    expect(switchFor(renderer, UPCOMING()).props.value).toBe(true);
    expect(switchFor(renderer, PERIOD_START()).props.value).toBe(false);
    expect(switchFor(renderer, JOURNAL()).props.value).toBe(true);
    expect(switchFor(renderer, FERTILITY()).props.value).toBe(false);
    expect(textsOf(renderer)).toContain('21:15');
    expect(findButton(renderer, t('cycleReminders.daysBefore', {count: 3}))?.props.accessibilityState).toEqual({checked: true});
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
  });

  it('turning "upcoming period" on offers the 1 / 2 / 3 days choice, and the chosen one is saved', async () => {
    const {renderer, navigation} = await mount('edit');
    expect(findButton(renderer, t('cycleReminders.daysBefore', {count: 1}))).toBeUndefined();
    await turn(renderer, UPCOMING(), true);
    for (const count of [1, 2, 3]) {
      expect(findButton(renderer, t('cycleReminders.daysBefore', {count}))).toBeDefined();
    }
    await press(renderer, t('cycleReminders.daysBefore', {count: 3}));
    await press(renderer, SAVE());
    expect(getCycleReminderPreferences()).toMatchObject({upcomingPeriodEnabled: true, upcomingPeriodDaysBefore: 3});
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('the fertility switch drives both options; each option can be ticked on its own, and none left means the switch is off', async () => {
    const {renderer} = await mount('edit');
    await turn(renderer, FERTILITY(), true);
    expect(findButton(renderer, FERTILE_WINDOW())?.props.accessibilityState).toEqual({checked: true});
    expect(findButton(renderer, OVULATION())?.props.accessibilityState).toEqual({checked: true});
    await press(renderer, OVULATION());
    expect(findButton(renderer, OVULATION())?.props.accessibilityState).toEqual({checked: false});
    expect(switchFor(renderer, FERTILITY()).props.value).toBe(true);
    await press(renderer, FERTILE_WINDOW());
    expect(switchFor(renderer, FERTILITY()).props.value).toBe(false);
    await turn(renderer, FERTILITY(), true);
    await press(renderer, OVULATION());
    await press(renderer, SAVE());
    expect(getCycleReminderPreferences()).toMatchObject({fertileWindowEnabled: true, ovulationEnabled: false});
  });

  it('a daily journal reminder without a time is refused with a message; nothing is saved, asked or navigated', async () => {
    const {renderer, navigation} = await mount('edit');
    await turn(renderer, JOURNAL(), true);
    await press(renderer, SAVE());
    expect(textsOf(renderer)).toContain(t('cycleReminders.dailyJournalTimeError'));
    expect(getCycleReminderPreferences().dailyJournalEnabled).toBe(false);
    expect(await AsyncStorage.getItem(PREFS_KEY)).toBeNull();
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('the message goes away as soon as a switch is changed', async () => {
    const {renderer} = await mount('edit');
    await turn(renderer, JOURNAL(), true);
    await press(renderer, SAVE());
    expect(textsOf(renderer)).toContain(t('cycleReminders.dailyJournalTimeError'));
    await turn(renderer, JOURNAL(), false);
    expect(textsOf(renderer)).not.toContain(t('cycleReminders.dailyJournalTimeError'));
  });

  it('turning everything off is saved, never asks Android for the permission, and carries on', async () => {
    await setCycleReminderPreferences({...OFF, upcomingPeriodEnabled: true});
    const {renderer, navigation} = await mount('edit');
    await turn(renderer, UPCOMING(), false);
    await press(renderer, SAVE());
    expect(getCycleReminderPreferences()).toEqual(OFF);
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('the saved choices are read back after a restart', async () => {
    const {renderer} = await mount('edit');
    await turn(renderer, PERIOD_START(), true);
    await press(renderer, SAVE());
    resetCycleReminderPreferencesForTests();
    expect((await hydrateCycleReminderPreferences()).periodStartCheckEnabled).toBe(true);
  });

  it('onboarding: "Continue" saves and moves on, "Not now" moves on without saving anything', async () => {
    const first = await mount('onboarding');
    await turn(first.renderer, PERIOD_START(), true);
    await press(first.renderer, CONTINUE());
    expect(getCycleReminderPreferences().periodStartCheckEnabled).toBe(true);
    expect(first.navigation.navigate).toHaveBeenCalledWith('SecuritySetup');

    await setCycleReminderPreferences(OFF);
    mockedNotifee.requestPermission.mockClear();
    const second = await mount('onboarding');
    await turn(second.renderer, UPCOMING(), true);
    await press(second.renderer, t('cycleReminders.skip'));
    expect(getCycleReminderPreferences().upcomingPeriodEnabled).toBe(false);
    expect(second.navigation.navigate).toHaveBeenCalledWith('SecuritySetup');
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
  });
});

describe('notification permission', () => {
  it('allowed: it is asked once, at save time, and the screen carries on', async () => {
    const {renderer, navigation} = await mount('edit');
    await turn(renderer, PERIOD_START(), true);
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
    await press(renderer, SAVE());
    expect(mockedNotifee.requestPermission).toHaveBeenCalledTimes(1);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(textsOf(renderer)).not.toContain(t('cycleReminders.permissionNoticeText'));
  });

  it('refused: the choice is kept, the screen stays with an explanation, and "open settings" opens Android settings', async () => {
    androidNotifications('refused');
    const {renderer, navigation} = await mount('edit');
    await turn(renderer, PERIOD_START(), true);
    await press(renderer, SAVE());
    expect(getCycleReminderPreferences().periodStartCheckEnabled).toBe(true);
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(textsOf(renderer)).toContain(t('cycleReminders.permissionNoticeText'));
    await press(renderer, t('cycleReminders.openNotificationSettings'));
    expect(mockedNotifee.openNotificationSettings).toHaveBeenCalledTimes(1);
  });

  it('refused, then allowed in Android settings: the next save goes through', async () => {
    androidNotifications('refused');
    const {renderer, navigation} = await mount('onboarding');
    await turn(renderer, JOURNAL(), false);
    await turn(renderer, UPCOMING(), true);
    await press(renderer, CONTINUE());
    expect(navigation.navigate).not.toHaveBeenCalled();
    androidNotifications('allowed');
    await press(renderer, CONTINUE());
    expect(navigation.navigate).toHaveBeenCalledWith('SecuritySetup');
  });

  it('refused, onboarding: "Not now" still lets her carry on', async () => {
    androidNotifications('refused');
    const {renderer, navigation} = await mount('onboarding');
    await turn(renderer, UPCOMING(), true);
    await press(renderer, CONTINUE());
    expect(navigation.navigate).not.toHaveBeenCalled();
    await press(renderer, t('cycleReminders.skip'));
    expect(navigation.navigate).toHaveBeenCalledWith('SecuritySetup');
  });

  it('a failure to open Android settings is swallowed (no crash, no alert)', async () => {
    androidNotifications('refused');
    mockedNotifee.openNotificationSettings.mockRejectedValueOnce(new Error('no settings activity'));
    const {renderer} = await mount('edit');
    await turn(renderer, UPCOMING(), true);
    await press(renderer, SAVE());
    await press(renderer, t('cycleReminders.openNotificationSettings'));
    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('what is really scheduled, through the real scheduler', () => {
  it('saving "upcoming period, 3 days before" schedules it for 09:00 three days before the predicted date (2 Sep), under this profile\'s id', async () => {
    const {renderer} = await mount('edit');
    await turn(renderer, UPCOMING(), true);
    await press(renderer, t('cycleReminders.daysBefore', {count: 3}));
    await press(renderer, SAVE());
    await syncCycleReminders();
    const call = schedule.mock.calls.map(([arg]) => arg).find(arg => arg.id === 'cycle-upcoming-period-reminder:owner');
    expect(call).toBeDefined();
    const fire: Date = call.fireDate;
    expect([fire.getFullYear(), fire.getMonth(), fire.getDate(), fire.getHours()]).toEqual([2026, 7, 30, 9]);
  });

  it('a daily journal reminder is scheduled at the chosen time; turning it off cancels it', async () => {
    await setCycleReminderPreferences({...OFF, dailyJournalEnabled: true, dailyJournalTime: '21:15'});
    await syncCycleReminders();
    const daily = schedule.mock.calls.map(([arg]) => arg).find(arg => arg.id === 'cycle-daily-journal-reminder:owner');
    expect(daily).toBeDefined();
    expect([daily.fireDate.getHours(), daily.fireDate.getMinutes()]).toEqual([21, 15]);

    const {renderer} = await mount('edit');
    cancel.mockClear();
    await turn(renderer, JOURNAL(), false);
    await press(renderer, SAVE());
    await syncCycleReminders();
    expect(cancel.mock.calls.map(([id]) => id)).toContain('cycle-daily-journal-reminder:owner');
  });

  it('fertility reminders: both ticked schedule both; only ovulation ticked schedules only ovulation', async () => {
    const {renderer} = await mount('edit');
    await turn(renderer, FERTILITY(), true);
    await press(renderer, SAVE());
    await syncCycleReminders();
    expect(scheduledIds()).toEqual(expect.arrayContaining(['cycle-fertile-window-reminder:owner', 'cycle-ovulation-reminder:owner']));

    schedule.mockClear();
    cancel.mockClear();
    const again = await mount('edit');
    await press(again.renderer, FERTILE_WINDOW());
    await press(again.renderer, SAVE());
    await syncCycleReminders();
    expect(scheduledIds()).not.toContain('cycle-fertile-window-reminder:owner');
    expect(scheduledIds()).toContain('cycle-ovulation-reminder:owner');
    expect(cancel.mock.calls.map(([id]) => id)).toContain('cycle-fertile-window-reminder:owner');
  });

  it('nothing is scheduled while another objective is active', async () => {
    await setCycleReminderPreferences({...OFF, upcomingPeriodEnabled: true});
    await setSelectedObjective('conceive');
    schedule.mockClear();
    await syncCycleReminders();
    expect(scheduledIds()).toEqual([]);
  });
});

describe('a managed daughter profile with no confirmed cycle', () => {
  it('cannot switch on the date-based reminders; what is saved for her has them off, the daily journal still works, and the owner is untouched', async () => {
    await setCycleReminderPreferences({...OFF, upcomingPeriodEnabled: true, upcomingPeriodDaysBefore: 3});
    const profile = await addManagedProfile({type: 'daughter', firstName: 'Test', birthDate: '2014-03-01', hasHadFirstPeriod: false});
    await setActiveProfileId(profile.id);
    await hydrateCycleReminderPreferences();
    const {renderer} = await mount('edit');
    expect(switchFor(renderer, UPCOMING()).props.disabled).toBe(true);
    expect(switchFor(renderer, PERIOD_START()).props.disabled).toBe(true);
    expect(switchFor(renderer, FERTILITY()).props.disabled).toBe(true);
    expect(switchFor(renderer, JOURNAL()).props.disabled).toBeFalsy();
    expect(textsOf(renderer)).toContain(t('cycleReminders.unavailableNote'));

    await setCycleReminderPreferences({...OFF, upcomingPeriodEnabled: true, periodStartCheckEnabled: true, dailyJournalEnabled: true, dailyJournalTime: '20:00', ovulationEnabled: true});
    const saved = await mount('edit');
    await press(saved.renderer, SAVE());
    expect(getCycleReminderPreferences()).toMatchObject({
      upcomingPeriodEnabled: false,
      periodStartCheckEnabled: false,
      fertileWindowEnabled: false,
      ovulationEnabled: false,
      dailyJournalEnabled: true,
    });

    await setActiveProfileId('owner');
    await hydrateCycleReminderPreferences();
    expect(getCycleReminderPreferences()).toMatchObject({upcomingPeriodEnabled: true, upcomingPeriodDaysBefore: 3});
  });
});

describe('a refused or failed write', () => {
  const failWrites = () =>
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      if (key.includes('cycle-reminder-preferences')) {throw new Error('disk full');}
      return realSetItem?.(key, value);
    });

  it('shows the failure alert once, keeps the screen and the draft, asks nothing, schedules nothing, and a retry works', async () => {
    const {renderer, navigation} = await mount('edit');
    await turn(renderer, PERIOD_START(), true);
    failWrites();
    await press(renderer, SAVE());
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe(t('saveFailure.title'));
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
    expect(getCycleReminderPreferences().periodStartCheckEnabled).toBe(false); // rolled back
    expect(switchFor(renderer, PERIOD_START()).props.value).toBe(true); // the draft is still on screen
    expect(textsOf(renderer)).not.toContain(t('cycleReminders.permissionNoticeText'));

    (AsyncStorage.setItem as jest.Mock).mockImplementation(realSetItem);
    await press(renderer, SAVE());
    expect(getCycleReminderPreferences().periodStartCheckEnabled).toBe(true);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('onboarding: the next step is not reached after a failed save', async () => {
    const {renderer, navigation} = await mount('onboarding');
    await turn(renderer, UPCOMING(), true);
    failWrites();
    await press(renderer, CONTINUE());
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(textsOf(renderer)).toContain(CONTINUE());
  });
});
