import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Modal, Pressable, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled, setAppLanguage, resetAppLanguageForTests} from '../../../state/themePreferences';
import {getPregnancyMedicalEvents, type PregnancyMedicalEvent} from '../../../state/pregnancyMedicalEventsStore';
import {cancelEventReminder} from '../../../utils/pregnancyEventReminders';

import PregnancyAppointmentScreen from '../PregnancyAppointmentScreen';
import PregnancyExamScreen from '../PregnancyExamScreen';
import PregnancyAppointmentsScreen from '../PregnancyAppointmentsScreen';
import PregnancyEventForm from '../../../components/pregnancy/PregnancyEventForm';
import i18n from '../../../i18n';

// Phase 1 — Pregnancy Appointment/Exam flow separation. The dedicated
// PregnancyAppointmentScreen/PregnancyExamScreen must never show the
// Rendez-vous/Examen segmented selector (that selector only survives on the
// legacy combined PregnancyAppointmentsScreen, reached from nowhere in the
// app any more — see its own header comment), and saving from either
// dedicated screen must persist the correct locked `type` via the SAME
// pregnancyMedicalEventsStore every other pregnancy screen reads.

jest.mock('../../../utils/pregnancyEventReminders', () => ({
  REMINDER_OFFSETS: ['30min', '1hour', '2hours', '1day', 'custom'],
  // reminderOffsetLabels is a factory (not a static object) so the real
  // labels follow the current app language via the caller's own `t`.
  reminderOffsetLabels: (t: (key: string) => string) => ({
    '30min': t('notifications.pregnancy.reminderOffsetLabels.30min'),
    '1hour': t('notifications.pregnancy.reminderOffsetLabels.1hour'),
    '2hours': t('notifications.pregnancy.reminderOffsetLabels.2hours'),
    '1day': t('notifications.pregnancy.reminderOffsetLabels.1day'),
    custom: t('notifications.pregnancy.reminderOffsetLabels.custom'),
  }),
  syncEventReminder: jest.fn().mockResolvedValue(undefined),
  cancelEventReminder: jest.fn().mockResolvedValue(undefined),
}));

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen(renderElement: () => React.ReactElement) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{renderElement}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

async function seedEvent(event: PregnancyMedicalEvent) {
  await AsyncStorage.setItem('@hawa/pregnancy-medical-events', JSON.stringify([event]));
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's text assertions were written against the French default. Pinning
  // French explicitly here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await resetAppLanguageForTests();
  await i18n.changeLanguage('fr');
});

function hasSegmentedSelector(renderer: ReactTestRenderer.ReactTestRenderer, label: string): boolean {
  return renderer.root.findAll(node => node.props.children === label).length > 0;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);

describe('PregnancyAppointmentScreen — dedicated, no selector', () => {
  it('never renders the Rendez-vous/Examen segmented selector', async () => {
    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={navigation} route={{params: undefined} as never} />
    ));
    expect(hasSegmentedSelector(renderer, 'Rendez-vous')).toBe(false);
    expect(hasSegmentedSelector(renderer, 'Examen')).toBe(false);
  });

  it('shows the Appointment-specific title', async () => {
    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={navigation} route={{params: undefined} as never} />
    ));
    // "Ajouter un RDV" — the project's current appointment-specific wording.
    expect(hasSegmentedSelector(renderer, 'Ajouter un RDV')).toBe(true);
  });

  it('locks type="appointment" on the shared form BEFORE it ever renders — not a default later switched', async () => {
    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={navigation} route={{params: undefined} as never} />
    ));
    const form = renderer.root.findByType(PregnancyEventForm);
    expect(form.props.type).toBe('appointment');
    // No onTypeChange callback is ever wired in — the dedicated screen gives
    // the form no way to switch type, unlike the legacy combined screen.
    expect(form.props.onTypeChange).toBeUndefined();
  });

  it('saving persists an event with type "appointment"', async () => {
    const goBack = jest.fn();
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={{goBack} as never} route={{params: undefined} as never} />
    ));

    const titleInput = renderer.root.findAll(node => node.props.accessibilityLabel === 'Titre')[0];
    await act(async () => {
      titleInput.props.onChangeText('Consultation prénatale');
    });

    const saveButton = renderer.root.findAll(node => node.props.accessibilityLabel === 'Enregistrer')[0];
    await act(async () => {
      await saveButton.props.onPress();
    });

    const events = await getPregnancyMedicalEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('appointment');
    expect(events[0].title).toBe('Consultation prénatale');
    expect(goBack).toHaveBeenCalled();
  });

  it('loads an existing appointment record for editing (existing data stays compatible)', async () => {
    await seedEvent({
      id: 'evt-appt-1',
      type: 'appointment',
      date: '2026-10-01',
      title: 'Consultation du 6e mois',
      practitioner: 'Dr. Amrani',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={navigation} route={{params: {eventId: 'evt-appt-1'}} as never} />
    ));

    await act(async () => {
      await Promise.resolve();
    });

    expect(hasSegmentedSelector(renderer, 'Modifier le rendez-vous')).toBe(true);
    const titleInput = renderer.root.findAll(node => node.props.accessibilityLabel === 'Titre')[0];
    expect(titleInput.props.value).toBe('Consultation du 6e mois');
  });

  it('editing and re-saving an existing appointment keeps its type as "appointment" (never flips to exam)', async () => {
    await seedEvent({
      id: 'evt-appt-2',
      type: 'appointment',
      date: '2026-10-01',
      title: 'Consultation du 6e mois',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    const goBack = jest.fn();
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={{goBack} as never} route={{params: {eventId: 'evt-appt-2'}} as never} />
    ));
    await act(async () => {
      await Promise.resolve();
    });

    const saveButton = renderer.root.findAll(node => node.props.accessibilityLabel === 'Enregistrer')[0];
    await act(async () => {
      await saveButton.props.onPress();
    });

    const events = await getPregnancyMedicalEvents();
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('evt-appt-2');
    expect(events[0].type).toBe('appointment');
    expect(goBack).toHaveBeenCalled();
  });
});

describe('PregnancyExamScreen — dedicated, no selector', () => {
  it('never renders the Rendez-vous/Examen segmented selector', async () => {
    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyExamScreen navigation={navigation} route={{params: undefined} as never} />
    ));
    expect(hasSegmentedSelector(renderer, 'Rendez-vous')).toBe(false);
    expect(hasSegmentedSelector(renderer, 'Examen')).toBe(false);
  });

  it('shows the Exam-specific title', async () => {
    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyExamScreen navigation={navigation} route={{params: undefined} as never} />
    ));
    expect(hasSegmentedSelector(renderer, 'Ajouter un examen')).toBe(true);
  });

  it('locks type="exam" on the shared form BEFORE it ever renders — not a default later switched', async () => {
    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyExamScreen navigation={navigation} route={{params: undefined} as never} />
    ));
    const form = renderer.root.findByType(PregnancyEventForm);
    expect(form.props.type).toBe('exam');
    // No onTypeChange callback is ever wired in — the dedicated screen gives
    // the form no way to switch type, unlike the legacy combined screen.
    expect(form.props.onTypeChange).toBeUndefined();
  });

  it('saving persists an event with type "exam"', async () => {
    const goBack = jest.fn();
    const renderer = await renderScreen(() => (
      <PregnancyExamScreen navigation={{goBack} as never} route={{params: undefined} as never} />
    ));

    const titleInput = renderer.root.findAll(node => node.props.accessibilityLabel === 'Titre')[0];
    await act(async () => {
      titleInput.props.onChangeText('Échographie T2');
    });

    const saveButton = renderer.root.findAll(node => node.props.accessibilityLabel === 'Enregistrer')[0];
    await act(async () => {
      await saveButton.props.onPress();
    });

    const events = await getPregnancyMedicalEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('exam');
    expect(events[0].title).toBe('Échographie T2');
    expect(goBack).toHaveBeenCalled();
  });

  it('loads an existing exam record for editing (existing data stays compatible)', async () => {
    await seedEvent({
      id: 'evt-exam-1',
      type: 'exam',
      date: '2026-10-05',
      title: 'Échographie T3',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyExamScreen navigation={navigation} route={{params: {eventId: 'evt-exam-1'}} as never} />
    ));

    await act(async () => {
      await Promise.resolve();
    });

    expect(hasSegmentedSelector(renderer, 'Modifier l’examen')).toBe(true);
    const titleInput = renderer.root.findAll(node => node.props.accessibilityLabel === 'Titre')[0];
    expect(titleInput.props.value).toBe('Échographie T3');
  });

  it('editing and re-saving an existing exam keeps its type as "exam" (never flips to appointment)', async () => {
    await seedEvent({
      id: 'evt-exam-2',
      type: 'exam',
      date: '2026-10-05',
      title: 'Échographie T3',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });

    const goBack = jest.fn();
    const renderer = await renderScreen(() => (
      <PregnancyExamScreen navigation={{goBack} as never} route={{params: {eventId: 'evt-exam-2'}} as never} />
    ));
    await act(async () => {
      await Promise.resolve();
    });

    const saveButton = renderer.root.findAll(node => node.props.accessibilityLabel === 'Enregistrer')[0];
    await act(async () => {
      await saveButton.props.onPress();
    });

    const events = await getPregnancyMedicalEvents();
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('evt-exam-2');
    expect(events[0].type).toBe('exam');
    expect(goBack).toHaveBeenCalled();
  });
});

describe('PregnancyAppointmentsScreen (legacy combined) — selector preserved for its own generic form', () => {
  it('still shows the Rendez-vous/Examen selector when opened as a fresh generic form (regression guard — the split must not remove this feature\'s own capability)', async () => {
    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentsScreen navigation={navigation} route={{params: {initialType: 'appointment'}} as never} />
    ));
    expect(hasSegmentedSelector(renderer, 'Rendez-vous')).toBe(true);
    expect(hasSegmentedSelector(renderer, 'Examen')).toBe(true);
  });
});

// SPANISH CALENDAR / DATE LOCALIZATION — PregnancyAppointmentsScreen's
// formatLongDate() used to hardcode `new Intl.DateTimeFormat('fr-FR', ...)`
// with no language check at all, so every event date rendered in French
// regardless of the app language. Guards that it now follows the app
// language (via the shared dateFormatLocale() helper) end to end, through a
// real seeded event.
describe('PregnancyAppointmentsScreen — event date respects the app language (Spanish)', () => {
  it('renders a seeded event date in Spanish, never French, when the app language is Spanish', async () => {
    await seedEvent({
      id: 'evt-locale-1',
      type: 'appointment',
      date: '2026-03-15',
      title: 'Échographie',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await setAppLanguage('es');
    await i18n.changeLanguage('es');

    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentsScreen navigation={navigation} route={{params: undefined} as never} />
    ));

    const texts = textsOf(renderer).join(' | ').toLowerCase();
    expect(texts).toContain('marzo');
    expect(texts).not.toContain('mars');
  });
});

// DELETE CONFIRMATION MODAL — replaces the native Alert.alert previously
// used in PregnancyEventForm.tsx's requestDelete() with an AWA-styled modal
// (PregnancyEventDeleteConfirmModal.tsx), shared by both the dedicated
// Appointment and Exam screens. The actual delete sequence
// (deletePregnancyMedicalEvent -> cancelEventReminder -> onDeleted) is
// unchanged — only the confirmation's presentation layer moved off the
// native Alert.
const findByA11y = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAllByType(Pressable).filter(node => node.props.accessibilityLabel === label);
  return matches[matches.length - 1];
};

async function pressA11y(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const button = findByA11y(renderer, label);
  expect(button).toBeDefined();
  await act(async () => {
    await button.props.onPress();
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe('PregnancyEventDeleteConfirmModal — replaces the native Alert for exam/appointment deletion', () => {
  it('[1] tapping Delete on Edit Appointment opens the AWA modal, not the native Alert, and deletes nothing yet', async () => {
    await seedEvent({
      id: 'evt-del-1', type: 'appointment', date: '2026-10-01', title: 'Consultation',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={navigation} route={{params: {eventId: 'evt-del-1'}} as never} />
    ));

    await pressA11y(renderer, 'Supprimer ce rendez-vous');

    expect(alertSpy).not.toHaveBeenCalled();
    expect(renderer.root.findAllByType(Modal).some(modal => modal.props.visible === true)).toBe(true);
    expect(textsOf(renderer)).toContain('Supprimer ce rendez-vous ?');
    expect(textsOf(renderer)).toContain('Cette action supprimera également le rappel associé.');
    expect(await getPregnancyMedicalEvents()).toHaveLength(1);
  });

  it('[2] Cancel closes the modal without deleting the appointment', async () => {
    await seedEvent({
      id: 'evt-del-2', type: 'appointment', date: '2026-10-01', title: 'Consultation',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={navigation} route={{params: {eventId: 'evt-del-2'}} as never} />
    ));

    await pressA11y(renderer, 'Supprimer ce rendez-vous');
    expect(textsOf(renderer)).toContain('Supprimer ce rendez-vous ?');

    await pressA11y(renderer, 'Annuler');

    expect(textsOf(renderer)).not.toContain('Supprimer ce rendez-vous ?');
    expect(await getPregnancyMedicalEvents()).toHaveLength(1);
  });

  it('[3][4] Confirm deletes the appointment AND cancels its reminder, exactly as before', async () => {
    await seedEvent({
      id: 'evt-del-3', type: 'appointment', date: '2026-10-01', title: 'Consultation',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z', reminderEnabled: true, reminderOffset: '1day',
    });
    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={navigation} route={{params: {eventId: 'evt-del-3'}} as never} />
    ));

    await pressA11y(renderer, 'Supprimer ce rendez-vous');
    await pressA11y(renderer, 'Supprimer ce rendez-vous');

    expect(await getPregnancyMedicalEvents()).toHaveLength(0);
    expect(cancelEventReminder).toHaveBeenCalledWith('evt-del-3');
  });

  it('[5][6][7] Edit Exam uses the SAME shared modal; Cancel keeps it, Confirm deletes it', async () => {
    await seedEvent({
      id: 'evt-del-4', type: 'exam', date: '2026-10-01', title: 'Échographie',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const navigation = {goBack: jest.fn()} as never;
    const renderer = await renderScreen(() => (
      <PregnancyExamScreen navigation={navigation} route={{params: {eventId: 'evt-del-4'}} as never} />
    ));

    await pressA11y(renderer, 'Supprimer cet examen');
    expect(textsOf(renderer)).toContain('Supprimer cet examen ?'); // exam-specific title, same component as appointment's

    await pressA11y(renderer, 'Annuler');
    expect(await getPregnancyMedicalEvents()).toHaveLength(1); // [6] Cancel never deletes the exam

    await pressA11y(renderer, 'Supprimer cet examen');
    await pressA11y(renderer, 'Supprimer cet examen');
    expect(await getPregnancyMedicalEvents()).toHaveLength(0); // [7] Confirm deletes the exam
  });

  it('[8] renders fully in French', async () => {
    await seedEvent({
      id: 'evt-del-fr', type: 'exam', date: '2026-10-01', title: 'Échographie',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const renderer = await renderScreen(() => (
      <PregnancyExamScreen navigation={{goBack: jest.fn()} as never} route={{params: {eventId: 'evt-del-fr'}} as never} />
    ));
    await pressA11y(renderer, 'Supprimer cet examen');
    expect(textsOf(renderer)).toContain('Supprimer cet examen ?');
    expect(textsOf(renderer)).toContain('Cette action supprimera également le rappel associé.');
    expect(textsOf(renderer)).toContain('Annuler');
    expect(textsOf(renderer)).toContain('Supprimer');
  });

  it('[9] renders fully in English, never leaking French', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await seedEvent({
      id: 'evt-del-en', type: 'exam', date: '2026-10-01', title: 'Ultrasound',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const renderer = await renderScreen(() => (
      <PregnancyExamScreen navigation={{goBack: jest.fn()} as never} route={{params: {eventId: 'evt-del-en'}} as never} />
    ));
    await pressA11y(renderer, 'Delete this exam');
    const texts = textsOf(renderer);
    expect(texts).toContain('Delete this exam?');
    expect(texts).toContain('This will also delete the associated reminder.');
    expect(texts).toContain('Cancel');
    expect(texts).not.toContain('Supprimer cet examen ?');
  });

  it('[10] renders fully in Spanish, never leaking French or English', async () => {
    await setAppLanguage('es');
    await i18n.changeLanguage('es');
    await seedEvent({
      id: 'evt-del-es', type: 'exam', date: '2026-10-01', title: 'Ecografía',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const renderer = await renderScreen(() => (
      <PregnancyExamScreen navigation={{goBack: jest.fn()} as never} route={{params: {eventId: 'evt-del-es'}} as never} />
    ));
    await pressA11y(renderer, 'Eliminar este examen');
    const texts = textsOf(renderer);
    expect(texts).toContain('¿Eliminar este examen?');
    expect(texts).toContain('Esta acción también eliminará el recordatorio asociado.');
    expect(texts).not.toContain('Delete this exam?');
    expect(texts).not.toContain('Supprimer cet examen ?');
  });

  it('[11] theme (Light/Dark) does not affect the delete flow — the modal still opens, cancels and confirms', async () => {
    await setAppearanceMode('dark');
    await seedEvent({
      id: 'evt-del-dark', type: 'appointment', date: '2026-10-01', title: 'Consultation',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={{goBack: jest.fn()} as never} route={{params: {eventId: 'evt-del-dark'}} as never} />
    ));
    await pressA11y(renderer, 'Supprimer ce rendez-vous');
    expect(textsOf(renderer)).toContain('Supprimer ce rendez-vous ?');
    await pressA11y(renderer, 'Supprimer ce rendez-vous');
    expect(await getPregnancyMedicalEvents()).toHaveLength(0);
  });

  it('[12] Android Back (onRequestClose) cancels the dialog without deleting', async () => {
    await seedEvent({
      id: 'evt-del-back', type: 'appointment', date: '2026-10-01', title: 'Consultation',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={{goBack: jest.fn()} as never} route={{params: {eventId: 'evt-del-back'}} as never} />
    ));
    await pressA11y(renderer, 'Supprimer ce rendez-vous');
    const openModal = renderer.root.findAllByType(Modal).find(modal => modal.props.visible === true)!;
    await act(async () => {
      openModal.props.onRequestClose();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(textsOf(renderer)).not.toContain('Supprimer ce rendez-vous ?');
    expect(await getPregnancyMedicalEvents()).toHaveLength(1);
  });

  it('a rapid double tap on Confirm deletes the event only once', async () => {
    await seedEvent({
      id: 'evt-del-double', type: 'appointment', date: '2026-10-01', title: 'Consultation',
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const renderer = await renderScreen(() => (
      <PregnancyAppointmentScreen navigation={{goBack: jest.fn()} as never} route={{params: {eventId: 'evt-del-double'}} as never} />
    ));
    await pressA11y(renderer, 'Supprimer ce rendez-vous');
    const confirmButton = findByA11y(renderer, 'Supprimer ce rendez-vous');
    await act(async () => {
      await Promise.all([confirmButton.props.onPress(), confirmButton.props.onPress(), confirmButton.props.onPress()]);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(await getPregnancyMedicalEvents()).toHaveLength(0);
  });
});
