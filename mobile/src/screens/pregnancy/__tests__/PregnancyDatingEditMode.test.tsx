import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import PregnancyDashboard from '../../../components/pregnancy/PregnancyDashboard';
import InlineCalendarPickerModal from '../../../components/onboarding/InlineCalendarPickerModal';
import PregnancyDatingSetupScreen from '../PregnancyDatingSetupScreen';
import PregnancyTrackingPreferencesScreen from '../PregnancyTrackingPreferencesScreen';
import ProfileScreen from '../../ProfileScreen';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setSelectedObjective} from '../../../state/onboardingPreferences';
import {updatePrivacySecuritySettings} from '../../../state/securityPreferences';
import {
  getPregnancyDating,
  getPregnancyTrackingPreferences,
  setPregnancyDating,
  setPregnancyTrackingPreferences,
} from '../../../state/pregnancyPreferences';
import {
  getPregnancyJournalState,
  savePregnancySymptoms,
  savePregnancyWeight,
} from '../../../state/pregnancyJournalStore';
import {getJournalEntry, saveJournalSection} from '../../../state/dailyJournalStore';
import {addDays, startOfDay} from '../../../utils/cycleMath';
import {PREGNANCY_TOTAL_DAYS} from '../../../utils/pregnancyTrackingUtils';

// J/K — the Pregnancy dating and tracking-preference screens double as EDIT
// screens (route param mode: 'edit'): prefilled, validated, saved, back to the
// previous screen — never on into the onboarding tail — and with the recorded
// history left exactly as it was.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const visited: string[] = [];
const FORBIDDEN = ['PregnancyTrackingPreferences', 'PregnancyReminders', 'SecuritySetup', 'Privacy', 'Summary', 'Auth'];

const Recorder = ({name}: {name: string}) => {
  visited.push(name);
  return <Text>{`stub-${name}`}</Text>;
};

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

/** Home = the real Pregnancy Dashboard; the edit screen is pushed on top of it. */
async function renderFlow(target: 'PregnancyDatingSetup' | 'PregnancyTrackingPreferences') {
  const Target = (target === 'PregnancyDatingSetup'
    ? PregnancyDatingSetupScreen
    : PregnancyTrackingPreferencesScreen) as unknown as React.ComponentType;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Home">
                  {() => <PregnancyDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />}
                </Stack.Screen>
                <Stack.Screen component={Target} initialParams={{mode: 'edit'}} name={target} />
                {FORBIDDEN.filter(route => route !== target).map(route => (
                  <Stack.Screen key={route} name={route}>
                    {() => <Recorder name={route} />}
                  </Stack.Screen>
                ))}
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  await act(async () => {
    (navRef as unknown as {navigate: (route: string, params?: unknown) => void}).navigate(target, {mode: 'edit'});
  });
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

const button = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      (node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => textOf(text) === label)),
  );
  if (matches.length === 0) {throw new Error(`No button "${label}"`);}
  return matches[0];
};

const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    await button(renderer, label).props.onPress();
  });
  await settle();
};

const currentRoute = () => (navRef.getCurrentRoute() as {name: string} | undefined)?.name;
const pickDate = async (renderer: ReactTestRenderer.ReactTestRenderer, date: Date) => {
  await act(async () => {
    renderer.root.findByType(InlineCalendarPickerModal).props.onSelect(date);
  });
};
const dayKey = (date: Date) => date.toLocaleDateString('en-CA');

const lmpDate = (elapsedDays: number) => startOfDay(addDays(new Date(), -elapsedDays));

beforeAll(async () => {
  // history that must survive every edit below
  await savePregnancyWeight({date: '2026-08-01', valueKg: 60.5, updatedAt: '2026-08-01T08:00:00.000Z'});
  await savePregnancySymptoms({date: '2026-08-02', symptoms: ['Nausées'], updatedAt: '2026-08-02T08:00:00.000Z'});
  await saveJournalSection('2026-08-03', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3});
});

beforeEach(async () => {
  resetPremiumStateForTests();
  visited.length = 0;
  await setPregnancyDating({method: 'lastPeriod', date: lmpDate(70).toISOString()});
  await setPregnancyTrackingPreferences(new Set(['symptoms', 'weight', 'mood', 'sleep', 'medicalInfo']));
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

const historySnapshot = async () =>
  JSON.stringify({journal: await getPregnancyJournalState(), mood: (await getJournalEntry('2026-08-03'))?.mood});

describe('A/B/D through the screen — an incoherent date is refused, with feedback, and nothing is saved', () => {
  it('the picker is bounded by the validation range (LMP: [today − 280 d, today])', async () => {
    const renderer = await renderFlow('PregnancyDatingSetup');
    const picker = renderer.root.findByType(InlineCalendarPickerModal);
    expect(dayKey(picker.props.maximumDate)).toBe(dayKey(startOfDay(new Date())));
    expect(dayKey(picker.props.minimumDate)).toBe(dayKey(lmpDate(PREGNANCY_TOTAL_DAYS)));
  });

  it('A. a future last menstrual period cannot be saved (tomorrow)', async () => {
    const renderer = await renderFlow('PregnancyDatingSetup');
    const before = getPregnancyDating();
    await pickDate(renderer, addDays(startOfDay(new Date()), 1));
    await press(renderer, 'Enregistrer');

    expect(textsOf(renderer).some(text => text.includes('ne peut pas être dans le futur'))).toBe(true);
    expect(getPregnancyDating()).toEqual(before);
    expect(currentRoute()).toBe('PregnancyDatingSetup');
  });

  it('D. a date older than the 280-day timeline cannot be saved', async () => {
    const renderer = await renderFlow('PregnancyDatingSetup');
    const before = getPregnancyDating();
    await pickDate(renderer, lmpDate(PREGNANCY_TOTAL_DAYS + 30));
    await press(renderer, 'Enregistrer');

    expect(textsOf(renderer).some(text => text.includes('trop ancienne'))).toBe(true);
    expect(getPregnancyDating()).toEqual(before);
    expect(currentRoute()).toBe('PregnancyDatingSetup');
  });

  it('the message disappears as soon as another date is chosen, and the valid date is then accepted', async () => {
    const renderer = await renderFlow('PregnancyDatingSetup');
    await pickDate(renderer, addDays(startOfDay(new Date()), 3));
    await press(renderer, 'Enregistrer');
    expect(textsOf(renderer).some(text => text.includes('futur'))).toBe(true);

    await pickDate(renderer, lmpDate(30));
    expect(textsOf(renderer).some(text => text.includes('futur'))).toBe(false);
    await press(renderer, 'Enregistrer');
    expect(currentRoute()).toBe('Home');
  });
});

describe('J/K — editing the dating from the normal app flow', () => {
  it('valid change: saved, back to the Dashboard (no onboarding tail), Dashboard recomputes, history untouched', async () => {
    const before = await historySnapshot();
    const renderer = await renderFlow('PregnancyDatingSetup');

    // prefilled with the current configuration
    expect(button(renderer, 'Enregistrer')).toBeDefined();
    await pickDate(renderer, lmpDate(140)); // 20 weeks + 0 days
    await press(renderer, 'Enregistrer');

    expect(currentRoute()).toBe('Home');
    expect(visited.filter(route => FORBIDDEN.includes(route))).toEqual([]);
    expect(dayKey(new Date(getPregnancyDating().date!))).toBe(dayKey(lmpDate(140)));
    // the Dashboard underneath moved to the new dating: 20 SA + 0 jours, 20 weeks left
    expect(textsOf(renderer).some(text => text.includes('20 SA + 0'))).toBe(true);
    expect(textsOf(renderer).some(text => /^20 semaines/.test(text))).toBe(true);
    expect(await historySnapshot()).toBe(before);
  });

  it('switching the method to the due date keeps working in edit mode', async () => {
    const renderer = await renderFlow('PregnancyDatingSetup');
    await press(renderer, 'Date prévue d’accouchement');
    // due date in 100 days is valid (a due date may be in the future)
    await pickDate(renderer, addDays(startOfDay(new Date()), 100));
    await press(renderer, 'Enregistrer');

    expect(currentRoute()).toBe('Home');
    expect(getPregnancyDating().method).toBe('dueDate');
    expect(visited.filter(route => FORBIDDEN.includes(route))).toEqual([]);
  });

  it('tracking preferences: edit → save → back, nothing after it, history intact', async () => {
    const before = await historySnapshot();
    const renderer = await renderFlow('PregnancyTrackingPreferences');
    await press(renderer, 'Enregistrer');

    expect(currentRoute()).toBe('Home');
    expect(visited.filter(route => FORBIDDEN.includes(route))).toEqual([]);
    expect(getPregnancyTrackingPreferences().has('symptoms')).toBe(true);
    expect(await historySnapshot()).toBe(before);
  });
});

describe('Profile / Dashboard entry points are edit mode', () => {
  it.each([
    ['Datation de ma grossesse', 'PregnancyDatingSetup'],
    ['Préférences de suivi', 'PregnancyTrackingPreferences'],
  ])('Profile "%s" opens %s in edit mode', async (title, route) => {
    await setSelectedObjective('pregnancy');
    updatePrivacySecuritySettings({anonymousMode: false});
    const navigate = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Profile">
                  {() => <ProfileScreen navigation={{navigate} as never} route={{key: 'p', name: 'Profile'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    await settle();
    await act(async () => {
      button(renderer, title).props.onPress();
    });
    expect(navigate).toHaveBeenCalledWith(route, {mode: 'edit'});
    await act(async () => {
      await setSelectedObjective('cycle');
    });
  });

  it('Dashboard "Configurer ma grossesse" (dating = later) opens the dating screen in EDIT mode, not the onboarding chain', async () => {
    await setPregnancyDating({method: 'later', date: null});
    const navigate = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <JournalSheetProvider>
              <NavigationContainer ref={navRef}>
                <Stack.Navigator screenOptions={{headerShown: false}}>
                  <Stack.Screen name="Home">
                    {() => <PregnancyDashboard navigation={{navigate} as never} route={{key: 'd', name: 'CycleHome'}} />}
                  </Stack.Screen>
                </Stack.Navigator>
              </NavigationContainer>
            </JournalSheetProvider>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    await settle();
    await act(async () => {
      button(renderer, 'Configurer ma grossesse').props.onPress();
    });
    expect(navigate).toHaveBeenCalledWith('PregnancyDatingSetup', {mode: 'edit'});
  });
});
