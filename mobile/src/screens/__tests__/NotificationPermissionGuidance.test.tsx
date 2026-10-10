import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Switch, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import notifee, {AuthorizationStatus} from '@notifee/react-native';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppLanguage} from '../../state/themePreferences';
import {resetObjectiveSetupFlowForTests} from '../../state/objectiveSetupFlow';
import i18n from '../../i18n';

import MenopauseRemindersScreen from '../MenopauseRemindersScreen';
import PostpartumRemindersScreen from '../PostpartumRemindersScreen';
import MiscarriageRemindersScreen from '../MiscarriageRemindersScreen';
import {IrregularRemindersScreen} from '../irregular/IrregularOnboardingScreens';
import {ConceptionRemindersScreen} from '../ConceptionOnboardingScreens';
import ContraceptionRemindersScreen from '../contraception/ContraceptionRemindersScreen';
import PregnancyRemindersScreen from '../pregnancy/PregnancyRemindersScreen';
import PregnancyNotificationsScreen from '../pregnancy/PregnancyNotificationsScreen';

import {
  getMenopausePreferences,
  setMenopauseHormonalTreatmentStatus,
  setMenopauseReminderPreferences,
} from '../../state/menopausePreferences';
import {getPostpartumPreferences, setPostpartumDailyTrackingReminder} from '../../state/postpartumPreferences';
import {getMiscarriagePreferences, setMiscarriageDailyTrackingReminder} from '../../state/miscarriagePreferences';
import {getIrregularPreferences, setIrregularPreferences} from '../../state/irregularPreferences';
import {getConceptionPreferences, setConceptionPreferences} from '../../state/conceptionPreferences';
import {getContraceptionPreferences, setContraceptionPreferences} from '../../state/contraceptionPreferences';
import {
  getPregnancyNotificationSettings,
  setPregnancyNotificationSettings,
  type PregnancyNotificationSettings,
} from '../../state/pregnancyNotificationSettingsStore';
import {deleteCustomReminder, saveCustomReminder} from '../../state/pregnancyCustomRemindersStore';
import {deleteHealthReminder, saveHealthReminder} from '../../state/pregnancyHealthRemindersStore';
import {syncCustomReminder, syncHealthReminder} from '../../utils/pregnancyReminderScheduling';

// Audit finding F9 — permission guidance on the objective reminder screens.
//
// Before: Menopause / Postpartum / Miscarriage set a notice flag and then closed at once (the notice was never
// seen), Irregular's notice had no way to open Android's settings, TTC / Contraception / Pregnancy never checked
// the permission at all. Now every one of them behaves like CycleRemindersScreen:
//   - a save that enables a reminder asks Android; refused -> the screen STAYS, the choice is saved, and the
//     shared NotificationPermissionNotice explains it with "open settings" / "I've turned them on" and, once a
//     save was blocked, "Continue without notifications" (which performs the navigation Save would have);
//   - while a reminder switch is on, a person who already refused sees that guidance before pressing save, and
//     merely looking at the screen never prompts;
//   - nothing changes when she allows notifications or when no reminder is on.
// Only @notifee/react-native is simulated (authorizationStatus DENIED / AUTHORIZED); the screens, the guard hook,
// the shared notice, the permission service and every preferences store are the real ones. The Pregnancy
// scheduler is stubbed because it asks Android for the permission itself — these tests are about what the SCREEN
// does, so every permission request counted below comes from the screen.

jest.mock('../../utils/pregnancyReminderScheduling', () => ({
  ...jest.requireActual('../../utils/pregnancyReminderScheduling'),
  resyncAllPregnancyNotifications: jest.fn(async () => undefined),
  syncHealthReminder: jest.fn(async () => undefined),
  syncCustomReminder: jest.fn(async () => undefined),
  cancelHealthReminderNotification: jest.fn(async () => undefined),
  cancelCustomReminderNotification: jest.fn(async () => undefined),
}));

type Mode = 'onboarding' | 'edit';
type AndroidNotifications = 'allowed' | 'refused' | 'not-asked';

const Stack = createNativeStackNavigator();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const mockedNotifee = notifee as unknown as {
  requestPermission: jest.Mock;
  getNotificationSettings: jest.Mock;
  openNotificationSettings: jest.Mock;
  isChannelBlocked: jest.Mock;
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function setAndroidNotifications(state: AndroidNotifications) {
  const authorizationStatus =
    state === 'allowed'
      ? AuthorizationStatus.AUTHORIZED
      : state === 'refused'
        ? AuthorizationStatus.DENIED
        : AuthorizationStatus.NOT_DETERMINED;
  mockedNotifee.requestPermission.mockResolvedValue({authorizationStatus});
  mockedNotifee.getNotificationSettings.mockResolvedValue({authorizationStatus});
  mockedNotifee.isChannelBlocked.mockResolvedValue(false);
}

// A macrotask boundary per iteration: every pending promise chain (store write -> permission request -> re-read)
// has run to completion by the time it returns.
const settle = async () => {
  for (let index = 0; index < 3; index += 1) {
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });
  }
};

type Navigation = {navigate: jest.Mock; goBack: jest.Mock; reset: jest.Mock};

const makeNavigation = (): Navigation => ({navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn()});

async function renderScreen(Screen: React.ComponentType<any>, mode: Mode, navigation: Navigation) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <Screen navigation={navigation} route={{key: 'test', name: 'Test', params: {mode}}} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

const hostsWithTestID = (renderer: ReactTestRenderer.ReactTestRenderer, testID: string) =>
  renderer.root.findAll(node => typeof node.type === 'string' && node.props.testID === testID);

const buttonsWithLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      (node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => textOf(text) === label)),
  );

const hasButton = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  buttonsWithLabel(renderer, label).length > 0;

const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = buttonsWithLabel(renderer, label);
  if (matches.length === 0) {throw new Error(`No button "${label}"`);}
  await act(async () => {
    await matches[0].props.onPress();
  });
  await settle();
};

const setSwitch = async (renderer: ReactTestRenderer.ReactTestRenderer, index: number, value: boolean) => {
  const target = renderer.root.findAllByType(Switch)[index];
  if (!target) {throw new Error(`No switch #${index}`);}
  await act(async () => {
    target.props.onValueChange(value);
  });
  await settle();
};

const label = (key: string) => i18n.t(key);

const expectNotNavigated = (navigation: Navigation) => {
  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(navigation.goBack).not.toHaveBeenCalled();
  expect(navigation.reset).not.toHaveBeenCalled();
};

const expectNavigated = (navigation: Navigation, mode: Mode) => {
  if (mode === 'edit') {
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).not.toHaveBeenCalled();
  } else {
    expect(navigation.navigate).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).toHaveBeenCalledWith('SecuritySetup');
    expect(navigation.goBack).not.toHaveBeenCalled();
  }
};

beforeEach(async () => {
  jest.clearAllMocks();
  resetObjectiveSetupFlowForTests();
  setAndroidNotifications('allowed');
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

/* ============================================================
   THE SEVEN ONBOARDING / EDIT REMINDER SCREENS
============================================================ */

type ScreenCase = {
  name: string;
  Screen: React.ComponentType<any>;
  testID: string;
  modes: Mode[];
  /** Stores a state with the screen's reminder switched on/off (a valid time is already chosen where one is needed). */
  arrange: (reminderOn: boolean) => Promise<void>;
  /** Position (in tree order) of the Switch that turns a reminder on. */
  switchIndex: number;
  /** Label of the save / continue button. */
  buttonLabel: (mode: Mode) => string;
  /** True once her "reminder on" choice reached the store. */
  persisted: () => boolean;
};

const NO_CONCEPTION_REMINDERS = {
  fertile_window: false,
  estimated_ovulation: false,
  temperature: false,
  lh_test: false,
  daily_journal: false,
};

const PREGNANCY_ALL_OFF: PregnancyNotificationSettings = {
  weeklyUpdateEnabled: false,
  dailyJournalEnabled: false,
  dailyJournalTime: '20:00',
  appointmentsEnabled: false,
  examsEnabled: false,
  defaultAppointmentReminderOffset: '1day',
  defaultExamReminderOffset: '1day',
};

const saveOrContinue = (mode: Mode) => label(mode === 'edit' ? 'common.save' : 'common.continue');

const CASES: ScreenCase[] = [
  {
    name: 'Menopause',
    Screen: MenopauseRemindersScreen,
    testID: 'menopause-reminders-permission-notice',
    modes: ['onboarding', 'edit'],
    switchIndex: 0,
    buttonLabel: saveOrContinue,
    arrange: async reminderOn => {
      await setMenopauseHormonalTreatmentStatus('no');
      await setMenopauseReminderPreferences({
        dailyTrackingReminderEnabled: reminderOn,
        dailyTrackingReminderTime: '08:30',
        treatmentReminderEnabled: false,
        treatmentReminderTime: null,
      });
    },
    persisted: () => getMenopausePreferences().dailyTrackingReminderEnabled === true,
  },
  {
    name: 'Postpartum',
    Screen: PostpartumRemindersScreen,
    testID: 'postpartum-reminders-permission-notice',
    modes: ['onboarding', 'edit'],
    switchIndex: 0,
    buttonLabel: saveOrContinue,
    arrange: reminderOn =>
      setPostpartumDailyTrackingReminder({dailyTrackingReminderEnabled: reminderOn, dailyTrackingReminderTime: '09:00'}),
    persisted: () => getPostpartumPreferences().dailyTrackingReminderEnabled === true,
  },
  {
    name: 'Miscarriage',
    Screen: MiscarriageRemindersScreen,
    testID: 'miscarriage-reminders-permission-notice',
    modes: ['onboarding', 'edit'],
    switchIndex: 0,
    buttonLabel: mode => label(mode === 'edit' ? 'common.save' : 'miscarriageReminders.continue'),
    arrange: reminderOn =>
      setMiscarriageDailyTrackingReminder({dailyTrackingReminderEnabled: reminderOn, dailyTrackingReminderTime: '10:15'}),
    persisted: () => getMiscarriagePreferences().dailyTrackingReminderEnabled === true,
  },
  {
    name: 'Irregular (SOPK)',
    Screen: IrregularRemindersScreen,
    testID: 'irregular-reminders-permission-notice',
    modes: ['onboarding', 'edit'],
    switchIndex: 0,
    buttonLabel: saveOrContinue,
    arrange: reminderOn =>
      setIrregularPreferences({
        reminders: {dailyJournalEnabled: reminderOn, dailyJournalTime: '21:00', unrecordedPeriodEnabled: false},
      }),
    persisted: () => getIrregularPreferences().reminders.dailyJournalEnabled === true,
  },
  {
    name: 'Conception (TTC)',
    Screen: ConceptionRemindersScreen,
    testID: 'conception-reminders-permission-notice',
    modes: ['onboarding', 'edit'],
    switchIndex: 0,
    buttonLabel: saveOrContinue,
    arrange: reminderOn =>
      setConceptionPreferences({reminders: {...NO_CONCEPTION_REMINDERS, fertile_window: reminderOn}}),
    persisted: () => getConceptionPreferences().reminders.fertile_window === true,
  },
  {
    name: 'Contraception',
    Screen: ContraceptionRemindersScreen,
    testID: 'contraception-reminders-permission-notice',
    modes: ['onboarding', 'edit'],
    switchIndex: 0,
    buttonLabel: mode => label(mode === 'edit' ? 'common.save' : 'contraceptionReminders.finish'),
    arrange: reminderOn =>
      setContraceptionPreferences({method: 'pill', remindersEnabled: reminderOn, reminderTime: '07:30'}),
    persisted: () => getContraceptionPreferences().remindersEnabled === true,
  },
  {
    name: 'Pregnancy (onboarding step)',
    Screen: PregnancyRemindersScreen,
    testID: 'pregnancy-reminders-permission-notice',
    modes: ['onboarding', 'edit'],
    switchIndex: 0,
    buttonLabel: () => label('pregnancyReminders.finishButton'),
    arrange: reminderOn => setPregnancyNotificationSettings({...PREGNANCY_ALL_OFF, appointmentsEnabled: reminderOn}),
    persisted: () => getPregnancyNotificationSettings().appointmentsEnabled === true,
  },
];

const noticeShown = (renderer: ReactTestRenderer.ReactTestRenderer, item: ScreenCase) =>
  hostsWithTestID(renderer, item.testID).length > 0;

describe.each(CASES.map(item => [item.name, item] as const))('%s reminders screen', (_name, item) => {
  describe.each(item.modes)('%s mode', mode => {
    it('refused: stays on the screen with her choice saved, explains why, and offers open settings / continue without notifications', async () => {
      setAndroidNotifications('refused');
      await item.arrange(false);
      const navigation = makeNavigation();
      const renderer = await renderScreen(item.Screen, mode, navigation);

      // Nothing on yet: no guidance, and opening the screen never asks Android for anything.
      expect(noticeShown(renderer, item)).toBe(false);
      expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();

      await setSwitch(renderer, item.switchIndex, true);

      // She already refused notifications: the guidance is there BEFORE she presses save, without prompting, and
      // there is nothing to "continue without" yet because no save was blocked.
      expect(noticeShown(renderer, item)).toBe(true);
      expect(hasButton(renderer, label('notificationPermission.openSettings'))).toBe(true);
      expect(hasButton(renderer, label('notificationPermission.recheck'))).toBe(true);
      expect(hasButton(renderer, label('notificationPermission.continueWithout'))).toBe(false);
      expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();

      await press(renderer, item.buttonLabel(mode));

      // Save asked Android once, refused: the choice is saved but she is still here, with the notice.
      expect(mockedNotifee.requestPermission).toHaveBeenCalledTimes(1);
      expect(item.persisted()).toBe(true);
      expectNotNavigated(navigation);
      expect(noticeShown(renderer, item)).toBe(true);
      expect(textsOf(renderer)).toContain(label('notificationPermission.blockedTitle'));
      expect(hasButton(renderer, label('notificationPermission.continueWithout'))).toBe(true);

      await press(renderer, label('notificationPermission.openSettings'));
      expect(mockedNotifee.openNotificationSettings).toHaveBeenCalledTimes(1);
      expectNotNavigated(navigation);

      await press(renderer, label('notificationPermission.continueWithout'));
      expectNavigated(navigation, mode);
    });

    it('allowed: saves and carries on exactly as before, with no notice', async () => {
      setAndroidNotifications('allowed');
      await item.arrange(false);
      const navigation = makeNavigation();
      const renderer = await renderScreen(item.Screen, mode, navigation);

      await setSwitch(renderer, item.switchIndex, true);
      expect(noticeShown(renderer, item)).toBe(false);

      await press(renderer, item.buttonLabel(mode));

      expect(mockedNotifee.requestPermission).toHaveBeenCalledTimes(1);
      expect(item.persisted()).toBe(true);
      expectNavigated(navigation, mode);
      expect(noticeShown(renderer, item)).toBe(false);
      expect(hasButton(renderer, label('notificationPermission.continueWithout'))).toBe(false);
    });

    it('no reminder switched on: never asks or reads Android, shows no notice and carries on', async () => {
      setAndroidNotifications('refused');
      await item.arrange(false);
      const navigation = makeNavigation();
      const renderer = await renderScreen(item.Screen, mode, navigation);

      await press(renderer, item.buttonLabel(mode));

      expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
      expect(mockedNotifee.getNotificationSettings).not.toHaveBeenCalled();
      expect(noticeShown(renderer, item)).toBe(false);
      expect(item.persisted()).toBe(false);
      expectNavigated(navigation, mode);
    });
  });

  it('already refused and a reminder already on: the guidance is visible from the start, without prompting', async () => {
    setAndroidNotifications('refused');
    await item.arrange(true);
    const navigation = makeNavigation();
    const renderer = await renderScreen(item.Screen, 'onboarding', navigation);

    expect(noticeShown(renderer, item)).toBe(true);
    expect(textsOf(renderer)).toContain(label('notificationPermission.blockedTitle'));
    expect(hasButton(renderer, label('notificationPermission.openSettings'))).toBe(true);
    expect(hasButton(renderer, label('notificationPermission.recheck'))).toBe(true);
    expect(hasButton(renderer, label('notificationPermission.continueWithout'))).toBe(false);
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
    expectNotNavigated(navigation);
  });

  it('turning the last reminder off again takes the guidance away (nothing left to deliver)', async () => {
    setAndroidNotifications('refused');
    await item.arrange(true);
    const renderer = await renderScreen(item.Screen, 'onboarding', makeNavigation());
    expect(noticeShown(renderer, item)).toBe(true);

    await setSwitch(renderer, item.switchIndex, false);

    expect(noticeShown(renderer, item)).toBe(false);
    expect(textsOf(renderer)).not.toContain(label('notificationPermission.blockedTitle'));
  });

  it('after she turns notifications on in Android settings: "I\'ve turned them on" re-checks, confirms, and save then goes through', async () => {
    setAndroidNotifications('refused');
    await item.arrange(true);
    const navigation = makeNavigation();
    const renderer = await renderScreen(item.Screen, 'onboarding', navigation);

    // Still off: the re-check says so.
    await press(renderer, label('notificationPermission.recheck'));
    expect(textsOf(renderer)).toContain(label('notificationPermission.stillOff'));

    // Back from Android's settings with notifications on.
    setAndroidNotifications('allowed');
    await press(renderer, label('notificationPermission.recheck'));

    expect(textsOf(renderer)).not.toContain(label('notificationPermission.blockedTitle'));
    expect(hostsWithTestID(renderer, `${item.testID}-enabled`)).toHaveLength(1);
    expect(textsOf(renderer)).toContain(label('notificationPermission.nowOn'));

    await press(renderer, item.buttonLabel('onboarding'));
    expectNavigated(navigation, 'onboarding');
  });
});

/* ============================================================
   SCREEN-SPECIFIC EDGES
============================================================ */

describe('Menopause — which switches count as "a reminder is on"', () => {
  const treatmentOnly = async () => {
    await setMenopauseHormonalTreatmentStatus('track');
    await setMenopauseReminderPreferences({
      dailyTrackingReminderEnabled: false,
      dailyTrackingReminderTime: null,
      treatmentReminderEnabled: true,
      treatmentReminderTime: '20:00',
    });
  };

  it('the treatment reminder alone is enough: guidance shown and a refused save stays on the screen', async () => {
    setAndroidNotifications('refused');
    await treatmentOnly();
    const navigation = makeNavigation();
    const renderer = await renderScreen(MenopauseRemindersScreen, 'onboarding', navigation);

    expect(hostsWithTestID(renderer, 'menopause-reminders-permission-notice')).toHaveLength(1);

    await press(renderer, label('common.continue'));

    expect(mockedNotifee.requestPermission).toHaveBeenCalledTimes(1);
    expect(getMenopausePreferences().treatmentReminderEnabled).toBe(true);
    expectNotNavigated(navigation);

    await press(renderer, label('notificationPermission.continueWithout'));
    expectNavigated(navigation, 'onboarding');
  });

  it('a stored treatment reminder whose card is not shown does not count (it is saved as off, nothing is asked)', async () => {
    setAndroidNotifications('refused');
    await treatmentOnly();
    await setMenopauseHormonalTreatmentStatus('no');
    const navigation = makeNavigation();
    const renderer = await renderScreen(MenopauseRemindersScreen, 'onboarding', navigation);

    expect(hostsWithTestID(renderer, 'menopause-reminders-permission-notice')).toHaveLength(0);

    await press(renderer, label('common.continue'));

    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
    expect(getMenopausePreferences().treatmentReminderEnabled).toBe(false);
    expectNavigated(navigation, 'onboarding');
  });
});

describe('Menopause — "Not now" is untouched', () => {
  it('skipping still carries on without asking Android or saving anything', async () => {
    setAndroidNotifications('refused');
    await setMenopauseHormonalTreatmentStatus('no');
    await setMenopauseReminderPreferences({
      dailyTrackingReminderEnabled: true,
      dailyTrackingReminderTime: '08:30',
      treatmentReminderEnabled: false,
      treatmentReminderTime: null,
    });
    const navigation = makeNavigation();
    const renderer = await renderScreen(MenopauseRemindersScreen, 'onboarding', navigation);

    await press(renderer, label('menopauseReminders.skip'));

    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
    expectNavigated(navigation, 'onboarding');
  });
});

describe('Contraception — methods with no daily action', () => {
  it('ring: nothing to remind about, so no switch, no notice and no permission request even if a reminder was stored', async () => {
    setAndroidNotifications('refused');
    await setContraceptionPreferences({method: 'ring', remindersEnabled: true, reminderTime: '07:30'});
    const navigation = makeNavigation();
    const renderer = await renderScreen(ContraceptionRemindersScreen, 'onboarding', navigation);

    expect(hostsWithTestID(renderer, 'contraception-reminders-permission-notice')).toHaveLength(0);
    expect(renderer.root.findAllByType(Switch)).toHaveLength(0);

    await press(renderer, label('contraceptionReminders.finish'));

    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
    expectNavigated(navigation, 'onboarding');
  });
});

describe('Pregnancy onboarding step — only the reminders this step shows count', () => {
  it('the weekly update (not shown here) alone neither asks Android nor blocks Continue', async () => {
    setAndroidNotifications('refused');
    await setPregnancyNotificationSettings({...PREGNANCY_ALL_OFF, weeklyUpdateEnabled: true});
    const navigation = makeNavigation();
    const renderer = await renderScreen(PregnancyRemindersScreen, 'onboarding', navigation);

    expect(hostsWithTestID(renderer, 'pregnancy-reminders-permission-notice')).toHaveLength(0);

    await press(renderer, label('pregnancyReminders.finishButton'));

    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
    expectNavigated(navigation, 'onboarding');
  });
});

describe('Android 13+ "not asked yet" is not an error, but a refused first request is explained', () => {
  it('not asked yet: no notice up front; a refusal at save time still shows the notice', async () => {
    setAndroidNotifications('not-asked');
    await setPostpartumDailyTrackingReminder({dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '09:00'});
    const navigation = makeNavigation();
    const renderer = await renderScreen(PostpartumRemindersScreen, 'onboarding', navigation);

    // 'unknown' is never shown as a problem.
    expect(hostsWithTestID(renderer, 'postpartum-reminders-permission-notice')).toHaveLength(0);

    // The system dialog is answered with "Don't allow" (notifee reports DENIED from then on).
    mockedNotifee.requestPermission.mockResolvedValue({authorizationStatus: AuthorizationStatus.DENIED});
    mockedNotifee.getNotificationSettings.mockResolvedValue({authorizationStatus: AuthorizationStatus.DENIED});
    await press(renderer, label('common.continue'));

    expect(mockedNotifee.requestPermission).toHaveBeenCalledTimes(1);
    expectNotNavigated(navigation);
    expect(textsOf(renderer)).toContain(label('notificationPermission.blockedTitle'));
    expect(hasButton(renderer, label('notificationPermission.continueWithout'))).toBe(true);
  });

  it('a refusal Android cannot read back (still "not determined") still leaves the notice and the way on', async () => {
    setAndroidNotifications('not-asked');
    await setMiscarriageDailyTrackingReminder({dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: '10:15'});
    const navigation = makeNavigation();
    const renderer = await renderScreen(MiscarriageRemindersScreen, 'onboarding', navigation);

    await press(renderer, label('miscarriageReminders.continue'));

    // requestPermission() reported "not allowed" and the re-read is still not-determined: the notice must not vanish.
    expectNotNavigated(navigation);
    expect(textsOf(renderer)).toContain(label('notificationPermission.blockedTitle'));

    await press(renderer, label('notificationPermission.continueWithout'));
    expectNavigated(navigation, 'onboarding');
  });
});

/* ============================================================
   "NOTIFICATIONS & RAPPELS" (Pregnancy) — no save button, so the
   notice sits above the sections and a switch turned ON asks Android
============================================================ */

describe('PregnancyNotificationsScreen', () => {
  const CUSTOM_REMINDER_ID = 'permission-guidance-custom';

  const arrangeCustomReminder = async (enabled: boolean) => {
    await saveCustomReminder({
      id: CUSTOM_REMINDER_ID,
      title: 'Prise de sang',
      date: '2030-01-15',
      time: '09:00',
      repeat: 'once',
      enabled,
      createdAt: '2030-01-01T00:00:00.000Z',
      updatedAt: '2030-01-01T00:00:00.000Z',
    });
  };

  const HEALTH_REMINDER_ID = 'permission-guidance-vitamin';

  const arrangeVitaminReminder = async (enabled: boolean) => {
    await saveHealthReminder({
      id: HEALTH_REMINDER_ID,
      kind: 'vitamin',
      name: 'Acide folique',
      time: '09:00',
      repeat: 'daily',
      enabled,
      createdAt: '2030-01-01T00:00:00.000Z',
      updatedAt: '2030-01-01T00:00:00.000Z',
    });
  };

  afterEach(async () => {
    await deleteCustomReminder(CUSTOM_REMINDER_ID);
    await deleteHealthReminder(HEALTH_REMINDER_ID);
  });

  const NOTICE = 'pregnancy-notifications-permission-notice';

  it('refused with reminders on: the notice is shown above the sections with open settings / re-check, and nothing prompts', async () => {
    setAndroidNotifications('refused');
    await setPregnancyNotificationSettings({...PREGNANCY_ALL_OFF, weeklyUpdateEnabled: true});
    const renderer = await renderScreen(PregnancyNotificationsScreen, 'onboarding', makeNavigation());

    expect(hostsWithTestID(renderer, NOTICE)).toHaveLength(1);
    expect(textsOf(renderer)).toContain(label('notificationPermission.blockedTitle'));
    expect(hasButton(renderer, label('notificationPermission.openSettings'))).toBe(true);
    expect(hasButton(renderer, label('notificationPermission.recheck'))).toBe(true);
    // No save step here, so there is nothing to "continue without".
    expect(hasButton(renderer, label('notificationPermission.continueWithout'))).toBe(false);
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();

    // Above the first section ("Grossesse"), not buried below it.
    const everyNode = renderer.root.findAll(() => true);
    const noticeIndex = everyNode.findIndex(node => typeof node.type === 'string' && node.props.testID === NOTICE);
    const firstSectionIndex = everyNode.findIndex(
      node => node.type === Text && textOf(node) === label('pregnancyNotifications.sections.pregnancy.title'),
    );
    expect(noticeIndex).toBeGreaterThanOrEqual(0);
    expect(firstSectionIndex).toBeGreaterThan(noticeIndex);

    await press(renderer, label('notificationPermission.openSettings'));
    expect(mockedNotifee.openNotificationSettings).toHaveBeenCalledTimes(1);
  });

  it('notifications allowed: no notice', async () => {
    setAndroidNotifications('allowed');
    await setPregnancyNotificationSettings({...PREGNANCY_ALL_OFF, weeklyUpdateEnabled: true, appointmentsEnabled: true});
    const renderer = await renderScreen(PregnancyNotificationsScreen, 'onboarding', makeNavigation());

    expect(hostsWithTestID(renderer, NOTICE)).toHaveLength(0);
    expect(textsOf(renderer)).not.toContain(label('notificationPermission.blockedTitle'));
  });

  it('every reminder off: no notice and Android is not even read, whatever it says', async () => {
    setAndroidNotifications('refused');
    await setPregnancyNotificationSettings(PREGNANCY_ALL_OFF);
    const renderer = await renderScreen(PregnancyNotificationsScreen, 'onboarding', makeNavigation());

    expect(hostsWithTestID(renderer, NOTICE)).toHaveLength(0);
    expect(mockedNotifee.getNotificationSettings).not.toHaveBeenCalled();
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
  });

  it('a custom reminder that is on counts too', async () => {
    setAndroidNotifications('refused');
    await setPregnancyNotificationSettings(PREGNANCY_ALL_OFF);
    await arrangeCustomReminder(true);
    const renderer = await renderScreen(PregnancyNotificationsScreen, 'onboarding', makeNavigation());

    expect(hostsWithTestID(renderer, NOTICE)).toHaveLength(1);
  });

  it('a vitamin / medication reminder that is on counts too, and a switched-off one does not', async () => {
    setAndroidNotifications('refused');
    await setPregnancyNotificationSettings(PREGNANCY_ALL_OFF);

    await arrangeVitaminReminder(false);
    const off = await renderScreen(PregnancyNotificationsScreen, 'onboarding', makeNavigation());
    expect(hostsWithTestID(off, NOTICE)).toHaveLength(0);

    await arrangeVitaminReminder(true);
    const on = await renderScreen(PregnancyNotificationsScreen, 'onboarding', makeNavigation());
    expect(hostsWithTestID(on, NOTICE)).toHaveLength(1);
  });

  it('turning a vitamin / medication reminder ON asks Android and schedules it as before', async () => {
    setAndroidNotifications('refused');
    await setPregnancyNotificationSettings(PREGNANCY_ALL_OFF);
    await arrangeVitaminReminder(false);
    const renderer = await renderScreen(PregnancyNotificationsScreen, 'onboarding', makeNavigation());

    // After the four general switches: the (only) list row's switch.
    await setSwitch(renderer, 4, true);

    expect(mockedNotifee.requestPermission).toHaveBeenCalledTimes(1);
    expect(syncHealthReminder).toHaveBeenCalledWith(expect.objectContaining({id: HEALTH_REMINDER_ID, enabled: true}));
    expect(hostsWithTestID(renderer, NOTICE)).toHaveLength(1);
  });

  it('turning a general switch ON asks Android at that moment (non-blocking) and the notice then explains a refusal', async () => {
    setAndroidNotifications('refused');
    await setPregnancyNotificationSettings(PREGNANCY_ALL_OFF);
    const renderer = await renderScreen(PregnancyNotificationsScreen, 'onboarding', makeNavigation());
    expect(hostsWithTestID(renderer, NOTICE)).toHaveLength(0);

    // Switch order: weekly update, daily journal, appointments, exams.
    await setSwitch(renderer, 1, true);

    expect(mockedNotifee.requestPermission).toHaveBeenCalledTimes(1);
    expect(getPregnancyNotificationSettings().dailyJournalEnabled).toBe(true);
    expect(hostsWithTestID(renderer, NOTICE)).toHaveLength(1);
    expect(textsOf(renderer)).toContain(label('notificationPermission.blockedTitle'));
  });

  it('turning a switch OFF never asks Android', async () => {
    setAndroidNotifications('refused');
    await setPregnancyNotificationSettings({...PREGNANCY_ALL_OFF, weeklyUpdateEnabled: true});
    const renderer = await renderScreen(PregnancyNotificationsScreen, 'onboarding', makeNavigation());

    await setSwitch(renderer, 0, false);

    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
    expect(getPregnancyNotificationSettings().weeklyUpdateEnabled).toBe(false);
    // Nothing is on any more: the guidance goes away with it.
    expect(hostsWithTestID(renderer, NOTICE)).toHaveLength(0);
  });

  it('changing a time or an offset (not switching anything on) never asks Android', async () => {
    setAndroidNotifications('allowed');
    await setPregnancyNotificationSettings({...PREGNANCY_ALL_OFF, appointmentsEnabled: true});
    const renderer = await renderScreen(PregnancyNotificationsScreen, 'onboarding', makeNavigation());

    // The appointments switch is already on; pressing one of its offset chips only changes the default offset.
    await press(renderer, label('notifications.pregnancy.reminderOffsetLabels.2hours'));

    expect(getPregnancyNotificationSettings().defaultAppointmentReminderOffset).toBe('2hours');
    expect(mockedNotifee.requestPermission).not.toHaveBeenCalled();
  });

  it('turning a custom reminder ON asks Android and schedules it as before', async () => {
    setAndroidNotifications('refused');
    await setPregnancyNotificationSettings(PREGNANCY_ALL_OFF);
    await arrangeCustomReminder(false);
    const renderer = await renderScreen(PregnancyNotificationsScreen, 'onboarding', makeNavigation());
    expect(hostsWithTestID(renderer, NOTICE)).toHaveLength(0);

    // After the four general switches: the (only) list row's switch.
    await setSwitch(renderer, 4, true);

    expect(mockedNotifee.requestPermission).toHaveBeenCalledTimes(1);
    expect(syncCustomReminder).toHaveBeenCalledWith(expect.objectContaining({id: CUSTOM_REMINDER_ID, enabled: true}));
    expect(hostsWithTestID(renderer, NOTICE)).toHaveLength(1);
  });
});
