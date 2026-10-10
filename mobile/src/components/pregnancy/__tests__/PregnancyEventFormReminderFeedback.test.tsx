import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Pressable, Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import notifee from '@notifee/react-native';

import PregnancyEventForm, {type PregnancyEventFormProps} from '../PregnancyEventForm';
import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {
  getPregnancyMedicalEvents,
  savePregnancyMedicalEvent,
  type PregnancyMedicalEvent,
} from '../../../state/pregnancyMedicalEventsStore';
import {
  getPregnancyNotificationSettings,
  setPregnancyNotificationSettings,
} from '../../../state/pregnancyNotificationSettingsStore';
import {setAppLanguage, resetAppLanguageForTests} from '../../../state/themePreferences';
import * as reminders from '../../../utils/pregnancyEventReminders';
import {__resetNotificationServiceForTests} from '../../../services/pregnancyNotifications';
import {
  deliverTrigger,
  displayedIds,
  fakeNotifeeState,
  resetFakeNotifee,
  scheduledIds,
} from '../../../testUtils/fakeNotifee';
import i18n from '../../../i18n';

// The appointment/exam form tells the truth about its reminder (Phase 1 repair: F2, F3, F6 and the form's part of
// F9). Real form, real stores, real scheduling code, stateful fake notifee. It proves what the screen shows and does;
// it cannot prove that a physical Android phone delivers the notification.
jest.mock('@notifee/react-native', () => require('../../../testUtils/fakeNotifee').notifeeModule);
jest.mock('../../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  getPrivacySecuritySettings: jest.fn(() => ({
    discreetMode: false,
    discreetNotifications: false,
    hideNotificationPreview: false,
  })),
}));

const NOW = new Date(2026, 9, 10, 20, 0, 0); // Sat 10 Oct 2026, 20:00 local
const STAMP = NOW.toISOString();
const dayISO = (offsetDays: number) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + offsetDays).toLocaleDateString('en-CA');
const local = (offsetDays: number, hours: number, minutes = 0) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + offsetDays, hours, minutes, 0, 0);

function savedEvent(overrides: Partial<PregnancyMedicalEvent> = {}): PregnancyMedicalEvent {
  return {
    id: 'evt-1',
    type: 'appointment',
    date: dayISO(2),
    time: '10:00',
    title: 'Echographie',
    reminderEnabled: false,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...overrides,
  };
}

const DEFAULT_SETTINGS = {
  weeklyUpdateEnabled: true,
  dailyJournalEnabled: false,
  dailyJournalTime: '20:00',
  appointmentsEnabled: true,
  examsEnabled: true,
  defaultAppointmentReminderOffset: '1day' as const,
  defaultExamReminderOffset: '1day' as const,
};

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderForm(props: Partial<PregnancyEventFormProps> = {}) {
  const onSaved = jest.fn();
  const onDeleted = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <PregnancyEventForm onDeleted={onDeleted} onSaved={onSaved} type="appointment" {...props} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return {renderer, onSaved, onDeleted};
}

const byLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label)[0];
const byTestId = (renderer: ReactTestRenderer.ReactTestRenderer, testID: string) =>
  renderer.root.findAll(node => node.props.testID === testID && typeof node.type === 'string');
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);

async function toggleReminder(renderer: ReactTestRenderer.ReactTestRenderer, on: boolean) {
  await act(async () => {
    byLabel(renderer, 'Reminder').props.onValueChange(on);
  });
}

async function typeTitle(renderer: ReactTestRenderer.ReactTestRenderer, title: string) {
  await act(async () => {
    byLabel(renderer, 'Title').props.onChangeText(title);
  });
}

async function pressSave(renderer: ReactTestRenderer.ReactTestRenderer) {
  await act(async () => {
    await byLabel(renderer, 'Save').props.onPress();
  });
}

/** Same Intl call the form uses, so the expectation is the form's own wording of the moment. */
const moment = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);

let alertSpy: jest.SpyInstance;

beforeEach(async () => {
  jest.useFakeTimers({now: NOW, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask']});
  jest.restoreAllMocks();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await AsyncStorage.clear();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
  await setPregnancyNotificationSettings(DEFAULT_SETTINGS);
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
  await resetAppLanguageForTests();
});

describe('the real reminder time is shown before saving (F2)', () => {
  it('shows the exact moment the reminder will be sent', async () => {
    const {renderer} = await renderForm({initialEvent: savedEvent()});

    await toggleReminder(renderer, true);

    const preview = byTestId(renderer, 'pregnancy-event-reminder-preview');
    expect(preview).toHaveLength(1);
    // Appointment in 2 days at 10:00, default "1 day before" => tomorrow 10:00.
    expect(allTexts(renderer)).toContain(moment(local(1, 10, 0)));
  });

  it('says that 09:00 is assumed when the appointment has no time', async () => {
    const {renderer} = await renderForm({initialEvent: savedEvent({time: undefined})});

    await toggleReminder(renderer, true);

    expect(allTexts(renderer)).toContain('No time is set, so 09:00 is used to work out the reminder time.');
    expect(allTexts(renderer)).toContain(moment(local(1, 9, 0)));
  });
});

describe('a reminder time that has already passed (F2)', () => {
  it('is flagged live, and Save is refused with the real time — nothing is stored, nothing pretends to be saved', async () => {
    const initial = savedEvent({date: dayISO(1)}); // tomorrow 10:00 with "1 day before" = today 10:00 = 10 hours ago
    await savePregnancyMedicalEvent(initial);
    const {renderer, onSaved} = await renderForm({initialEvent: initial});

    await toggleReminder(renderer, true);
    expect(byTestId(renderer, 'pregnancy-event-reminder-past')).toHaveLength(1);

    await pressSave(renderer);

    const expected = `This reminder would be sent on ${moment(local(0, 10, 0))}, which has already passed. Choose a shorter lead time, set a custom time, or turn the reminder off.`;
    expect(allTexts(renderer).filter(text => text === expected).length).toBeGreaterThanOrEqual(1);
    expect(onSaved).not.toHaveBeenCalled();
    const stored = await getPregnancyMedicalEvents();
    expect(stored).toHaveLength(1);
    expect(stored[0].reminderEnabled).toBe(false); // unchanged: the refused request was not stored
    expect(scheduledIds()).toEqual([]);
  });

  it('a NEW appointment dated today with the default lead time is refused the same way', async () => {
    const {renderer, onSaved} = await renderForm();
    await typeTitle(renderer, 'Consultation');

    await toggleReminder(renderer, true);
    await pressSave(renderer);

    expect(onSaved).not.toHaveBeenCalled();
    expect(await getPregnancyMedicalEvents()).toEqual([]);
    expect(allTexts(renderer).some(text => text.includes('has already passed'))).toBe(true);
  });

  it('turning the reminder off lets the appointment be saved (no reminder is the honest state)', async () => {
    const {renderer, onSaved} = await renderForm();
    await typeTitle(renderer, 'Consultation');
    await toggleReminder(renderer, true);
    await toggleReminder(renderer, false);

    await pressSave(renderer);

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(await getPregnancyMedicalEvents()).toHaveLength(1);
  });

  it('an old appointment whose reminder already went off can still have its notes edited', async () => {
    // Today 20:30 with "1 hour before" = 19:30, which is past — but the reminder part is untouched.
    const initial = savedEvent({date: dayISO(0), time: '20:30', reminderEnabled: true, reminderOffset: '1hour'});
    await savePregnancyMedicalEvent(initial);
    const {renderer, onSaved} = await renderForm({initialEvent: initial});

    await act(async () => {
      byLabel(renderer, 'Notes (optional)').props.onChangeText('Bring the previous results');
    });
    await pressSave(renderer);

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect((await getPregnancyMedicalEvents())[0].notes).toBe('Bring the previous results');
  });
});

describe('scheduling result is reported to the person (F3)', () => {
  it('scheduled: saved, the trigger exists at the shown time, and nothing alarming is displayed', async () => {
    const {renderer, onSaved} = await renderForm({initialEvent: savedEvent()});
    await toggleReminder(renderer, true);

    await pressSave(renderer);

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(scheduledIds()).toEqual(['pregnancy-event-evt-1']);
    expect(fakeNotifeeState.triggers.get('pregnancy-event-evt-1')!.trigger.timestamp).toBe(local(1, 10, 0).getTime());
  });

  it('permission denied: the appointment is saved, the person is told its reminder was NOT set, and can open settings', async () => {
    fakeNotifeeState.authorizationStatus = 0;
    const {renderer, onSaved} = await renderForm({initialEvent: savedEvent()});
    await toggleReminder(renderer, true);
    // The shared guidance is on the form before she even presses Save.
    expect(byTestId(renderer, 'pregnancy-event-permission-notice')).toHaveLength(1);

    await pressSave(renderer);

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(await getPregnancyMedicalEvents()).toHaveLength(1);
    expect(scheduledIds()).toEqual([]);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [title, message, buttons] = alertSpy.mock.calls[0];
    expect(title).toBe('Saved without a reminder');
    expect(message).toContain('“Echographie” is saved, but its reminder was not scheduled');
    expect(message).toContain('notifications are turned off for AWA');
    const openSettings = (buttons as Array<{text: string; onPress?: () => void}>).find(
      button => button.text === 'Open notification settings',
    );
    expect(openSettings).toBeDefined();
    await act(async () => {
      openSettings!.onPress!();
    });
    expect(notifee.openNotificationSettings).toHaveBeenCalledTimes(1);
  });

  it('a native scheduling failure no longer leaves the form open with a half-saved event', async () => {
    fakeNotifeeState.createTriggerError = new Error('native boom');
    const {renderer, onSaved} = await renderForm({initialEvent: savedEvent()});
    await toggleReminder(renderer, true);

    await pressSave(renderer);

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(await getPregnancyMedicalEvents()).toHaveLength(1);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][1]).toContain('its reminder could not be scheduled');
  });

  it('even if the sync itself throws, the form completes and tells her', async () => {
    jest.spyOn(reminders, 'syncEventReminder').mockRejectedValueOnce(new Error('unexpected'));
    const {renderer, onSaved} = await renderForm({initialEvent: savedEvent()});
    await toggleReminder(renderer, true);

    await pressSave(renderer);

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('a double tap on Save stores ONE appointment and schedules once', async () => {
    const syncSpy = jest.spyOn(reminders, 'syncEventReminder');
    const {renderer, onSaved} = await renderForm();
    await typeTitle(renderer, 'Consultation');

    await act(async () => {
      const save = byLabel(renderer, 'Save').props.onPress;
      await Promise.all([save(), save(), save()]);
    });

    expect(await getPregnancyMedicalEvents()).toHaveLength(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(syncSpy).toHaveBeenCalledTimes(1);
  });

  it('saving again after the first save keeps the SAME event id (an edit, never a duplicate)', async () => {
    const {renderer} = await renderForm();
    await typeTitle(renderer, 'Consultation');
    await pressSave(renderer);
    const firstId = (await getPregnancyMedicalEvents())[0].id;

    await pressSave(renderer);

    const events = await getPregnancyMedicalEvents();
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(firstId);
  });
});

describe('individual reminder vs the global category switch (F6)', () => {
  it('the form says so while the global switch is off, instead of showing a reminder that cannot be sent', async () => {
    await setPregnancyNotificationSettings({...getPregnancyNotificationSettings(), appointmentsEnabled: false});
    const {renderer} = await renderForm({initialEvent: savedEvent()});

    await toggleReminder(renderer, true);

    expect(byTestId(renderer, 'pregnancy-event-category-off')).toHaveLength(1);
    expect(allTexts(renderer)).toContain(
      'Appointment reminders are turned off in Notifications & reminders, so this reminder will not be sent.',
    );
  });

  it('one tap on "Turn on appointment reminders" switches the global setting on and the notice goes away', async () => {
    await setPregnancyNotificationSettings({...getPregnancyNotificationSettings(), appointmentsEnabled: false});
    const {renderer} = await renderForm({initialEvent: savedEvent()});
    await toggleReminder(renderer, true);

    await act(async () => {
      byLabel(renderer, 'Turn on appointment reminders').props.onPress();
    });

    expect(getPregnancyNotificationSettings().appointmentsEnabled).toBe(true);
    expect(byTestId(renderer, 'pregnancy-event-category-off')).toHaveLength(0);
  });

  it('saving while the global switch is off keeps her per-event choice but tells her nothing was scheduled', async () => {
    await setPregnancyNotificationSettings({...getPregnancyNotificationSettings(), appointmentsEnabled: false});
    const {renderer, onSaved} = await renderForm({initialEvent: savedEvent()});
    await toggleReminder(renderer, true);

    await pressSave(renderer);

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(scheduledIds()).toEqual([]);
    expect((await getPregnancyMedicalEvents())[0].reminderEnabled).toBe(true); // intent kept for when it is turned on
    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [, message, buttons] = alertSpy.mock.calls[0];
    expect(message).toContain('appointment reminders are turned off in Notifications & reminders');
    expect((buttons as Array<{text: string}>).map(button => button.text)).toContain('Turn on appointment reminders');
  });

  it('exams have their own switch: it is the exam switch that matters for an exam', async () => {
    await setPregnancyNotificationSettings({...getPregnancyNotificationSettings(), examsEnabled: false});
    const {renderer} = await renderForm({type: 'exam', initialEvent: savedEvent({type: 'exam'})});

    await toggleReminder(renderer, true);

    expect(allTexts(renderer)).toContain(
      'Exam reminders are turned off in Notifications & reminders, so this reminder will not be sent.',
    );
  });
});

describe('deleting an appointment', () => {
  it('removes its pending reminder and the copy already in the notification shade, and no other reminder', async () => {
    const initial = savedEvent({reminderEnabled: true, reminderOffset: '1hour'});
    await savePregnancyMedicalEvent(initial);
    await reminders.syncEventReminder(initial);
    await reminders.syncEventReminder(savedEvent({id: 'evt-2', reminderEnabled: true, reminderOffset: '1hour'}));
    jest.setSystemTime(new Date(local(2, 9, 0).getTime() + 1_000));
    deliverTrigger('pregnancy-event-evt-1');
    expect(displayedIds()).toEqual(['pregnancy-event-evt-1']);

    const {renderer, onDeleted} = await renderForm({initialEvent: initial});
    // First tap opens the confirmation modal; the modal's confirm button carries the same label (last match).
    const pressDelete = async () => {
      const matches = renderer.root
        .findAllByType(Pressable)
        .filter(node => node.props.accessibilityLabel === 'Delete this appointment');
      await act(async () => {
        await matches[matches.length - 1].props.onPress();
      });
    };
    await pressDelete();
    await pressDelete();

    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(displayedIds()).toEqual([]);
    expect(scheduledIds()).toEqual(['pregnancy-event-evt-2']);
  });
});
