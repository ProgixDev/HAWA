import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {getPregnancyMedicalEvents, type PregnancyMedicalEvent} from '../../../state/pregnancyMedicalEventsStore';

import PregnancyAppointmentScreen from '../PregnancyAppointmentScreen';
import PregnancyExamScreen from '../PregnancyExamScreen';
import PregnancyAppointmentsScreen from '../PregnancyAppointmentsScreen';

// Phase 1 — Pregnancy Appointment/Exam flow separation. The dedicated
// PregnancyAppointmentScreen/PregnancyExamScreen must never show the
// Rendez-vous/Examen segmented selector (that selector only survives on the
// legacy combined PregnancyAppointmentsScreen, reached from nowhere in the
// app any more — see its own header comment), and saving from either
// dedicated screen must persist the correct locked `type` via the SAME
// pregnancyMedicalEventsStore every other pregnancy screen reads.

jest.mock('../../../utils/pregnancyEventReminders', () => ({
  REMINDER_OFFSETS: ['30min', '1hour', '2hours', '1day', 'custom'],
  REMINDER_OFFSET_LABELS: {
    '30min': '30 min avant',
    '1hour': '1 heure avant',
    '2hours': '2 heures avant',
    '1day': '1 jour avant',
    custom: 'Personnalisé',
  },
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
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

function hasSegmentedSelector(renderer: ReactTestRenderer.ReactTestRenderer, label: string): boolean {
  return renderer.root.findAll(node => node.props.children === label).length > 0;
}

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
    expect(hasSegmentedSelector(renderer, 'Ajouter un rendez-vous')).toBe(true);
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
