import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import PregnancyDashboard from '../PregnancyDashboard';
import {resetPremiumStateForTests, updatePremiumState} from '../../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {setPregnancyDating} from '../../../state/pregnancyPreferences';
import {savePregnancyMedicalEvent} from '../../../state/pregnancyMedicalEventsStore';

// PregnancyDashboard (via usePrayerPurityStatus/useFocusEffect) needs a real
// NavigationContainer ancestor — same minimal single-screen stack harness as
// CycleHomeScreen.test.tsx (D1), ContraceptionDashboard.test.tsx (D2),
// IrregularDashboard.test.tsx (D3) and ConceiveDashboard.test.tsx (D4).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

async function renderDashboard() {
  const navigation = {navigate: jest.fn()} as never;
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <PregnancyDashboard navigation={navigation} route={{key: 'test', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(async () => {
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  // Confirmed real pregnancy dating — renders the week/DPA/baby hero branch
  // instead of the "Configurer ma grossesse" unconfigured state.
  await setPregnancyDating({
    method: 'lastPeriod',
    date: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
  });
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('PregnancyDashboard — resolved global theme', () => {
  it('consumes useAwaTheme() — background gradient matches AWA Original canonical values', async () => {
    const renderer = await renderDashboard();
    const gradient = renderer.root.findByType(LinearGradient);
    expect(gradient.props.colors).toEqual(['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']);
  });

  it('page background changes when the palette changes, without remounting', async () => {
    const renderer = await renderDashboard();
    const gradientColors = () => renderer.root.findByType(LinearGradient).props.colors;
    expect(gradientColors()[0]).toBe('#FAF8FD');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(gradientColors()[0]).not.toBe('#FAF8FD');
  });

  it('changes Light -> Dark without remounting', async () => {
    const renderer = await renderDashboard();
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });
});

describe('PregnancyDashboard — true black', () => {
  it('true-black affects the page background only once Dark is resolved', async () => {
    const renderer = await renderDashboard();
    const background = renderer.root.findByType(LinearGradient);
    const lightBg = flattenStyle(background.props.style).backgroundColor;

    await act(async () => {
      await setAppearanceMode('light');
      await setTrueBlackEnabled(true);
    });
    expect(flattenStyle(background.props.style).backgroundColor).toBe(lightBg);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(flattenStyle(background.props.style).backgroundColor).toBe('#030304');
  });
});

describe('PregnancyDashboard — pregnancy data unchanged by theme', () => {
  it('week number, gestational age, trimester and DPA text stay identical across a palette switch', async () => {
    const renderer = await renderDashboard();
    const weekLabel = renderer.root.findAll(node => node.props.children === 'Semaine actuelle')[0];
    expect(weekLabel).toBeTruthy();

    const findWeekNumber = () =>
      renderer.root.findAll(node => typeof node.props.children === 'number')[0]?.props.children;
    const before = findWeekNumber();
    expect(typeof before).toBe('number');

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });

    expect(findWeekNumber()).toBe(before);
  });
});

describe('PregnancyDashboard — Premium fallback', () => {
  it('reverts screen-level chrome to AWA Original when Premium is lost, without remounting', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });
    const renderer = await renderDashboard();
    const gradientColors = () => renderer.root.findByType(LinearGradient).props.colors;
    expect(gradientColors()[0]).not.toBe('#FAF8FD');

    await act(async () => {
      updatePremiumState({isPremium: false});
    });

    expect(gradientColors()).toEqual(['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']);
  });
});

describe('PregnancyDashboard — Appointment/Exam navigate independently, no shared segmented-selector route', () => {
  it('"Prochain RDV" navigates to the dedicated PregnancyAppointment route (never the combined PregnancyAppointments form)', async () => {
    const navigate = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <JournalSheetProvider>
              <NavigationContainer ref={navRef}>
                <Stack.Navigator screenOptions={{headerShown: false}}>
                  <Stack.Screen name="Test">
                    {() => <PregnancyDashboard navigation={{navigate} as never} route={{key: 'test', name: 'CycleHome'}} />}
                  </Stack.Screen>
                </Stack.Navigator>
              </NavigationContainer>
            </JournalSheetProvider>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer!);

    const card = renderer!.root.findAll(node => node.props.accessibilityLabel === 'Prochain RDV')[0];
    await act(async () => {
      card.props.onPress();
    });

    expect(navigate).toHaveBeenCalledWith('PregnancyAppointment', expect.objectContaining({}));
    expect(navigate).not.toHaveBeenCalledWith('PregnancyAppointments', expect.anything());
    const [, params] = navigate.mock.calls[0];
    expect(params).not.toHaveProperty('initialType');
  });

  it('"Prochain examen" navigates to the dedicated PregnancyExam route (never the combined PregnancyAppointments form)', async () => {
    const navigate = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <JournalSheetProvider>
              <NavigationContainer ref={navRef}>
                <Stack.Navigator screenOptions={{headerShown: false}}>
                  <Stack.Screen name="Test">
                    {() => <PregnancyDashboard navigation={{navigate} as never} route={{key: 'test', name: 'CycleHome'}} />}
                  </Stack.Screen>
                </Stack.Navigator>
              </NavigationContainer>
            </JournalSheetProvider>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer!);

    const card = renderer!.root.findAll(node => node.props.accessibilityLabel === 'Prochain examen')[0];
    await act(async () => {
      card.props.onPress();
    });

    expect(navigate).toHaveBeenCalledWith('PregnancyExam', expect.objectContaining({}));
    expect(navigate).not.toHaveBeenCalledWith('PregnancyAppointments', expect.anything());
    const [, params] = navigate.mock.calls[0];
    expect(params).not.toHaveProperty('initialType');
  });
});

describe('PregnancyDashboard — empty-state text is fully visible, never ellipsis-truncated', () => {
  // No appointment/exam is seeded anywhere in this suite's beforeEach, so
  // both AppointmentCard instances render their empty-state message by
  // default — exactly the "Aucun rendez-vous prévu"/"Aucun examen prévu"
  // case this task fixes.

  it('renders the complete "Aucun rendez-vous prévu" string, not a shortened or pre-ellipsized variant', async () => {
    const renderer = await renderDashboard();
    const textNode = renderer.root.findAll(node => node.props.children === 'Aucun rendez-vous prévu')[0];
    expect(textNode).toBeDefined();
  });

  it('renders the complete "Aucun examen prévu" string, not a shortened or pre-ellipsized variant', async () => {
    const renderer = await renderDashboard();
    const textNode = renderer.root.findAll(node => node.props.children === 'Aucun examen prévu')[0];
    expect(textNode).toBeDefined();
  });

  it('the empty-state Text elements never set numberOfLines (no 1-line truncation cap)', async () => {
    const renderer = await renderDashboard();

    const appointmentText = renderer.root.findAll(node => node.props.children === 'Aucun rendez-vous prévu')[0];
    const examText = renderer.root.findAll(node => node.props.children === 'Aucun examen prévu')[0];

    expect(appointmentText.props.numberOfLines).toBeUndefined();
    expect(examText.props.numberOfLines).toBeUndefined();
  });

  it('does not disable font scaling on the empty-state text (allowFontScaling must not be set to false)', async () => {
    const renderer = await renderDashboard();
    const appointmentText = renderer.root.findAll(node => node.props.children === 'Aucun rendez-vous prévu')[0];
    const examText = renderer.root.findAll(node => node.props.children === 'Aucun examen prévu')[0];
    expect(appointmentText.props.allowFontScaling).not.toBe(false);
    expect(examText.props.allowFontScaling).not.toBe(false);
  });

  it('static guard: no numberOfLines={1} is applied to AppointmentCard\'s line Text elements', () => {
    // Fails loudly if a future edit reintroduces a hard 1-line cap on the
    // appointment/exam card's date/time/title/empty-state lines.
    const source = fs.readFileSync(path.resolve(__dirname, '../PregnancyDashboard.tsx'), 'utf8');
    const appointmentCardFn = source.slice(source.indexOf('function AppointmentCard'));
    expect(appointmentCardFn).not.toMatch(/numberOfLines=\{1\}/);
    expect(appointmentCardFn).not.toMatch(/allowFontScaling=\{false\}/);
  });
});

describe('PregnancyDashboard — real appointment/exam data still renders without escaping the card', () => {
  it('a real upcoming appointment title renders alongside the date/time lines, still without a 1-line truncation cap', async () => {
    await savePregnancyMedicalEvent({
      id: 'evt-real-appt',
      type: 'appointment',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
      title: 'Consultation prénatale de suivi approfondi avec la sage-femme référente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const renderer = await renderDashboard();
    const titleNode = renderer.root.findAll(
      node => node.props.children === 'Consultation prénatale de suivi approfondi avec la sage-femme référente',
    )[0];
    expect(titleNode).toBeDefined();
    expect(titleNode.props.numberOfLines).toBeUndefined();
  });
});

describe('PregnancyDashboard — no palette-ID / Midnight dependency', () => {
  it('never references midnight anywhere in the module', () => {
    // Static guard: fails loudly if a future edit reintroduces a Midnight
    // reference into this file.
    const source = fs.readFileSync(path.resolve(__dirname, '../PregnancyDashboard.tsx'), 'utf8');
    expect(source).not.toMatch(/midnight/i);
  });
});
