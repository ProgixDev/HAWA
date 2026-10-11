import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Platform, Pressable, Text} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {resetObjectiveSetupFlowForTests} from '../../state/objectiveSetupFlow';
import {__resetNotificationServiceForTests} from '../../services/pregnancyNotifications';
import {fakeNotifeeState, resetFakeNotifee, scheduledIds} from '../../testUtils/fakeNotifee';
import i18n from '../../i18n';

import CycleRemindersScreen from '../CycleRemindersScreen';
import MenopauseRemindersScreen from '../MenopauseRemindersScreen';
import PostpartumRemindersScreen from '../PostpartumRemindersScreen';
import MiscarriageRemindersScreen from '../MiscarriageRemindersScreen';
import ContraceptionRemindersScreen from '../contraception/ContraceptionRemindersScreen';
import {IrregularRemindersScreen} from '../irregular/IrregularOnboardingScreens';
import PregnancyNotificationsScreen from '../pregnancy/PregnancyNotificationsScreen';
import JournalTemperatureScreen from '../journal/JournalTemperatureScreen';
import PregnancyEventForm from '../../components/pregnancy/PregnancyEventForm';

import {getCycleReminderPreferences, setCycleReminderPreferences} from '../../state/cycleReminderPreferences';
import {
  getMenopausePreferences,
  setMenopauseHormonalTreatmentStatus,
  setMenopauseReminderPreferences,
} from '../../state/menopausePreferences';
import {getPostpartumPreferences, setPostpartumDailyTrackingReminder} from '../../state/postpartumPreferences';
import {getMiscarriagePreferences, setMiscarriageDailyTrackingReminder} from '../../state/miscarriagePreferences';
import {getContraceptionPreferences, setContraceptionPreferences} from '../../state/contraceptionPreferences';
import {getIrregularPreferences, setIrregularPreferences} from '../../state/irregularPreferences';
import {
  getPregnancyNotificationSettings,
  setPregnancyNotificationSettings,
} from '../../state/pregnancyNotificationSettingsStore';
import {getCustomReminders, saveCustomReminder} from '../../state/pregnancyCustomRemindersStore';
import {saveHealthReminder} from '../../state/pregnancyHealthRemindersStore';
import {getPregnancyMedicalEvents, savePregnancyMedicalEvent} from '../../state/pregnancyMedicalEventsStore';
import {getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';

// F17 — midnight written as "24:30".
//
// Intl.DateTimeFormat(<en-US>, {hour: '2-digit', minute: '2-digit', hour12: false}) renders 00:30 as "24:30", and the
// app's default language is English. Every editor below used to build the STORED 'HH:mm' with that call and to read
// it back with split(':') + setHours(): a reminder (or an appointment) picked at 00:30 was saved as "24:30" and read
// back as the NEXT day. These tests run each editor under the ENGLISH language (the one that misrenders midnight)
// with the real screen, the real store and a stateful fake notifee; the only thing replaced is the native picker.
//
// They prove what the screens show / store / schedule; they cannot prove what a physical phone's picker does.
jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);
jest.mock('../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  getPrivacySecuritySettings: jest.fn(() => ({
    discreetMode: false,
    discreetNotifications: false,
    hideNotificationPreview: false,
  })),
}));

// Sat 10 Oct 2026, 15:00 local. Not around midnight on purpose: a Date for "00:30 TODAY" is then in the PAST and a
// Date for "00:30 tomorrow" (what "24:30" used to turn into) is distinguishable by its calendar day.
const NOW = new Date(2026, 9, 10, 15, 0, 0);
const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 3; index += 1) {
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });
  }
};

async function renderScreen(Screen: React.ComponentType<any>, params: Record<string, unknown> = {mode: 'edit'}) {
  const navigation = {navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <Screen navigation={navigation} route={{key: 'test', name: 'Test', params}} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return {renderer, navigation};
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
/** Every visible "HH:mm" text of the screen. */
const clockTexts = (renderer: ReactTestRenderer.ReactTestRenderer) => allTexts(renderer).filter(text => /^\d{1,2}:\d{2}$/.test(text));
const pickers = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(DateTimePicker);

/** The pressable whose accessibility label contains `fragment` (the time rows announce their time). */
function pressableLabelled(renderer: ReactTestRenderer.ReactTestRenderer, fragment: string) {
  return renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.includes(fragment),
  )[0];
}

/** The pressable that contains a Text with exactly this content. */
function pressableWithText(renderer: ReactTestRenderer.ReactTestRenderer, text: string) {
  const matches = renderer.root
    .findAllByType(Pressable)
    .filter(node => node.findAllByType(Text).some(child => textOf(child) === text));
  return matches[matches.length - 1];
}

async function press(node: ReactTestRenderer.ReactTestInstance | undefined, what: string) {
  if (!node) {throw new Error(`nothing to press: ${what}`);}
  await act(async () => {
    await node.props.onPress();
  });
  await settle();
}

async function pick(renderer: ReactTestRenderer.ReactTestRenderer, picked: Date) {
  const [picker] = pickers(renderer);
  if (!picker) {throw new Error('the time picker is not open');}
  await act(async () => {
    picker.props.onValueChange({type: 'set', nativeEvent: {}}, picked);
  });
  await settle();
}

/** The picker is showing 00:`minutes` on TODAY (not tomorrow). */
function expectPickerAtMidnightToday(renderer: ReactTestRenderer.ReactTestRenderer, minutes: number) {
  const [picker] = pickers(renderer);
  expect(picker).toBeDefined();
  const shown = picker.props.value as Date;
  expect([shown.getFullYear(), shown.getMonth(), shown.getDate(), shown.getHours(), shown.getMinutes()]).toEqual([
    NOW.getFullYear(),
    NOW.getMonth(),
    NOW.getDate(),
    0,
    minutes,
  ]);
}

let alertSpy: jest.SpyInstance;

beforeEach(async () => {
  jest.useFakeTimers({now: NOW, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask', 'setTimeout', 'clearTimeout']});
  jest.restoreAllMocks();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await AsyncStorage.clear();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  resetObjectiveSetupFlowForTests();
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
  await resetAppLanguageForTests();
});

// --- the six reminder editors --------------------------------------------------------------------------------------

type Editor = {
  name: string;
  Screen: React.ComponentType<any>;
  params?: Record<string, unknown>;
  /** Stores `time` as the (switched-on) reminder time this screen edits. */
  seed: (time: string) => Promise<void>;
  /** The reminder time as stored after the screen saved. */
  read: () => string | null;
};

const EDITORS: Editor[] = [
  {
    name: 'Cycle - daily journal reminder',
    Screen: CycleRemindersScreen,
    seed: time =>
      setCycleReminderPreferences({
        upcomingPeriodEnabled: false,
        upcomingPeriodDaysBefore: 2,
        periodStartCheckEnabled: false,
        dailyJournalEnabled: true,
        dailyJournalTime: time,
        fertileWindowEnabled: false,
        ovulationEnabled: false,
      }),
    read: () => getCycleReminderPreferences().dailyJournalTime,
  },
  {
    name: 'Menopause - daily tracking reminder',
    Screen: MenopauseRemindersScreen,
    seed: async time => {
      await setMenopauseHormonalTreatmentStatus('no');
      await setMenopauseReminderPreferences({
        dailyTrackingReminderEnabled: true,
        dailyTrackingReminderTime: time,
        treatmentReminderEnabled: false,
        treatmentReminderTime: null,
      });
    },
    read: () => getMenopausePreferences().dailyTrackingReminderTime,
  },
  {
    name: 'Menopause - treatment reminder',
    Screen: MenopauseRemindersScreen,
    seed: async time => {
      await setMenopauseHormonalTreatmentStatus('track');
      await setMenopauseReminderPreferences({
        dailyTrackingReminderEnabled: false,
        dailyTrackingReminderTime: null,
        treatmentReminderEnabled: true,
        treatmentReminderTime: time,
      });
    },
    read: () => getMenopausePreferences().treatmentReminderTime,
  },
  {
    name: 'Postpartum - daily tracking reminder',
    Screen: PostpartumRemindersScreen,
    seed: time => setPostpartumDailyTrackingReminder({dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: time}),
    read: () => getPostpartumPreferences().dailyTrackingReminderTime,
  },
  {
    name: 'Miscarriage - daily tracking reminder',
    Screen: MiscarriageRemindersScreen,
    seed: time => setMiscarriageDailyTrackingReminder({dailyTrackingReminderEnabled: true, dailyTrackingReminderTime: time}),
    read: () => getMiscarriagePreferences().dailyTrackingReminderTime,
  },
  {
    name: 'Contraception - daily pill reminder',
    Screen: ContraceptionRemindersScreen,
    seed: time => setContraceptionPreferences({method: 'pill', remindersEnabled: true, reminderTime: time}),
    read: () => getContraceptionPreferences().reminderTime,
  },
  {
    name: 'Irregular (SOPK) - daily journal reminder',
    Screen: IrregularRemindersScreen,
    seed: time =>
      setIrregularPreferences({reminders: {dailyJournalEnabled: true, dailyJournalTime: time, unrecordedPeriodEnabled: false}}),
    read: () => getIrregularPreferences().reminders.dailyJournalTime,
  },
];

describe.each(EDITORS)('$name', ({Screen, params, seed, read}) => {
  it('shows a stored "24:30" as 00:30 and opens the picker on 00:30 of TODAY, not tomorrow', async () => {
    await seed('24:30');
    const {renderer} = await renderScreen(Screen, params);

    expect(clockTexts(renderer)).toContain('00:30');
    expect(clockTexts(renderer)).not.toContain('24:30');

    await press(pressableLabelled(renderer, '00:30'), 'the time row');
    expectPickerAtMidnightToday(renderer, 30);
  });

  it('a time picked at midnight is written 00:xx — never "24:xx" — shown as such, and saved as such', async () => {
    await seed('08:15');
    const {renderer} = await renderScreen(Screen, params);
    expect(clockTexts(renderer)).toContain('08:15');

    await press(pressableLabelled(renderer, '08:15'), 'the time row');
    await pick(renderer, new Date(2026, 9, 10, 0, 45));

    expect(clockTexts(renderer)).toContain('00:45');
    expect(clockTexts(renderer)).not.toContain('24:45');

    await press(pressableWithText(renderer, 'Save'), 'Save');
    expect(read()).toBe('00:45');
  });

  it('a time picked just after midnight and one just before it keep their own hour', async () => {
    await seed('08:15');
    const {renderer} = await renderScreen(Screen, params);

    await press(pressableLabelled(renderer, '08:15'), 'the time row');
    await pick(renderer, new Date(2026, 9, 10, 23, 59));
    expect(clockTexts(renderer)).toContain('23:59');

    await press(pressableLabelled(renderer, '23:59'), 'the time row');
    await pick(renderer, new Date(2026, 9, 10, 0, 0));
    expect(clockTexts(renderer)).toContain('00:00');
    expect(clockTexts(renderer)).not.toContain('24:00');
  });

  it('saving without touching a stored "24:30" stores 00:30 (what it always meant), never the next day', async () => {
    await seed('24:30');
    const {renderer} = await renderScreen(Screen, params);

    await press(pressableWithText(renderer, 'Save'), 'Save');

    expect(read()).toBe('00:30');
  });
});

// --- the Pregnancy notification settings ---------------------------------------------------------------------------

const PREGNANCY_SETTINGS = {
  weeklyUpdateEnabled: false,
  dailyJournalEnabled: true,
  dailyJournalTime: '20:00',
  appointmentsEnabled: true,
  examsEnabled: true,
  defaultAppointmentReminderOffset: '1day' as const,
  defaultExamReminderOffset: '1day' as const,
};

describe('Pregnancy - Notifications & reminders', () => {
  it('daily journal time: a stored "24:30" is shown and edited as 00:30 of today; a midnight pick is saved as 00:xx', async () => {
    await setPregnancyNotificationSettings({...PREGNANCY_SETTINGS, dailyJournalTime: '24:30'});
    const {renderer} = await renderScreen(PregnancyNotificationsScreen);

    expect(allTexts(renderer)).toContain('00:30');
    expect(allTexts(renderer)).not.toContain('24:30');

    await press(pressableWithText(renderer, i18n.t('pregnancyNotifications.sections.pregnancy.dailyJournal.reminderTimeLabel')), 'the time row');
    expectPickerAtMidnightToday(renderer, 30);

    await pick(renderer, new Date(2026, 9, 10, 0, 5));
    expect(getPregnancyNotificationSettings().dailyJournalTime).toBe('00:05');
  });

  it('a vitamin reminder stored at "24:30" is listed at 00:30', async () => {
    await setPregnancyNotificationSettings({...PREGNANCY_SETTINGS});
    await saveHealthReminder({
      id: 'vit-1',
      kind: 'vitamin',
      name: 'Folic acid',
      time: '24:30',
      repeat: 'daily',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const {renderer} = await renderScreen(PregnancyNotificationsScreen);

    const meta = allTexts(renderer).filter(text => text.includes('00:30'));
    expect(meta.length).toBeGreaterThan(0);
    expect(allTexts(renderer).some(text => text.includes('24:30'))).toBe(false);
  });

  it('an old one-time custom reminder stored at "24:30" can still have its note edited: its time is untouched', async () => {
    await setPregnancyNotificationSettings({...PREGNANCY_SETTINGS});
    await saveCustomReminder({
      id: 'old-1',
      title: 'Old reminder',
      date: '2026-10-01',
      time: '24:30',
      repeat: 'once',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const {renderer} = await renderScreen(PregnancyNotificationsScreen);

    await press(pressableWithText(renderer, 'Old reminder'), 'the reminder row');
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Description (optional)')[0].props.onChangeText('Bring the file');
    });
    await press(pressableWithText(renderer, 'Save'), 'Save');

    // Its moment passed on 1 Oct, so a CHANGED time would be refused; an untouched one must not be. Neither the legacy
    // text nor the day is changed behind her back.
    expect(alertSpy).not.toHaveBeenCalled();
    const stored = await getCustomReminders();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({description: 'Bring the file', time: '24:30', date: '2026-10-01'});
  });
});

// --- the appointment / exam form -----------------------------------------------------------------------------------

describe('Pregnancy - appointment form', () => {
  const eventAt = (overrides: Record<string, unknown> = {}) => ({
    id: 'evt-1',
    type: 'appointment' as const,
    date: '2026-10-12',
    time: '24:30',
    title: 'Night scan',
    reminderEnabled: true,
    reminderOffset: '30min' as const,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  });

  async function renderForm(initialEvent: ReturnType<typeof eventAt>) {
    const onSaved = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <PregnancyEventForm initialEvent={initialEvent} onDeleted={jest.fn()} onSaved={onSaved} type="appointment" />
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    await settle();
    return {renderer, onSaved};
  }

  const byLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
    renderer.root.findAll(node => node.props.accessibilityLabel === label)[0];

  it('a stored "24:30" appointment time shows as 00:30 and the picker opens on 00:30 (not on the next day)', async () => {
    const {renderer} = await renderForm(eventAt());

    expect(allTexts(renderer)).toContain('00:30');
    expect(allTexts(renderer)).not.toContain('24:30');

    await press(pressableWithText(renderer, i18n.t('pregnancyEvent.form.timeLabel')), 'the time row');
    expectPickerAtMidnightToday(renderer, 30);
  });

  it('picking midnight stores "00:xx" for the appointment time and for a custom reminder time', async () => {
    const {renderer} = await renderForm(eventAt({time: '10:00', reminderOffset: 'custom', reminderTime: '09:00'}));

    await press(pressableWithText(renderer, i18n.t('pregnancyEvent.form.timeLabel')), 'the time row');
    await pick(renderer, new Date(2026, 9, 12, 0, 20));
    expect(allTexts(renderer)).toContain('00:20');

    await press(pressableWithText(renderer, i18n.t('pregnancyEvent.form.reminderTimeLabel')), 'the reminder time row');
    await pick(renderer, new Date(2026, 9, 11, 0, 10));
    expect(allTexts(renderer)).toContain('00:10');

    await press(byLabel(renderer, 'Save'), 'Save');
    const [stored] = await getPregnancyMedicalEvents();
    expect(stored).toMatchObject({time: '00:20', reminderTime: '00:10'});
  });

  it('saving an untouched legacy "24:30" event keeps its text and schedules the reminder on the SAME day', async () => {
    await savePregnancyMedicalEvent(eventAt());
    const {renderer} = await renderForm(eventAt());

    await press(byLabel(renderer, 'Save'), 'Save');

    const [stored] = await getPregnancyMedicalEvents();
    expect(stored.time).toBe('24:30'); // not rewritten behind her back
    // 12 Oct 00:30 minus 30 minutes = 12 Oct 00:00 (the legacy reading would have been 13 Oct 00:00).
    expect(scheduledIds()).toEqual(['pregnancy-event-evt-1']);
    expect(fakeNotifeeState.triggers.get('pregnancy-event-evt-1')!.trigger.timestamp).toBe(
      new Date(2026, 9, 12, 0, 0, 0, 0).getTime(),
    );
  });
});

// --- the basal temperature entry -----------------------------------------------------------------------------------

describe('Basal temperature - measurement time', () => {
  const todayKey = NOW.toLocaleDateString('en-CA');
  let platformOverride: {restore: () => void};

  beforeEach(() => {
    platformOverride = jest.replaceProperty(Platform, 'OS', 'android');
  });
  afterEach(() => {
    platformOverride.restore();
  });

  const openTimePicker = (renderer: ReactTestRenderer.ReactTestRenderer) =>
    press(
      renderer.root.findAll(
        node =>
          typeof node.props.onPress === 'function' &&
          node.props.accessibilityLabel === i18n.t('journalTemperature.chooseMeasurementTime'),
      )[0],
      'the time field',
    );

  it('a stored "24:30" is shown and edited as 00:30 of today (the picker used to ignore it and show "now")', async () => {
    await saveJournalSection(todayKey, 'temperature', {value: 36.6, unit: 'C', time: '24:30', method: 'Orale', note: ''});
    const {renderer} = await renderScreen(JournalTemperatureScreen, {});

    expect(allTexts(renderer)).toContain('00:30');
    expect(allTexts(renderer)).not.toContain('24:30');

    await openTimePicker(renderer);
    expectPickerAtMidnightToday(renderer, 30);
  });

  it('a midnight pick is written and saved as 00:xx', async () => {
    await saveJournalSection(todayKey, 'temperature', {value: 36.6, unit: 'C', time: '07:10', method: 'Orale', note: ''});
    const {renderer} = await renderScreen(JournalTemperatureScreen, {});

    await openTimePicker(renderer);
    await pick(renderer, new Date(2026, 9, 10, 0, 25));
    expect(allTexts(renderer)).toContain('00:25');
    expect(allTexts(renderer)).not.toContain('24:25');

    await press(
      renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === 'Save')[0],
      'Save',
    );
    expect((await getJournalEntry(todayKey))?.temperature?.time).toBe('00:25');
  });
});
