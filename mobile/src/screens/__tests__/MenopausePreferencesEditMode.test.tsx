import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import MenopauseStageScreen from '../MenopauseStageScreen';
import MenopauseSymptomsScreen from '../MenopauseSymptomsScreen';
import MenopauseHormonalTreatmentScreen from '../MenopauseHormonalTreatmentScreen';
import MenopauseLabTrackingScreen from '../MenopauseLabTrackingScreen';
import ProfileScreen from '../ProfileScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setSelectedObjective} from '../../state/onboardingPreferences';
import {updatePrivacySecuritySettings} from '../../state/securityPreferences';
import {
  getMenopausePreferences,
  setMenopauseHormonalTreatmentStatus,
  setMenopauseLabTracking,
  setMenopauseStage,
  setMenopauseTrackedSymptoms,
} from '../../state/menopausePreferences';
import {
  addMenopauseLabResult,
  getAllMenopauseJournalEntries,
  getMenopauseLabResults,
  saveMenopauseJournalField,
} from '../../state/menopauseJournalStore';

// E — the Menopause preference screens double as EDIT screens (route param
// mode: 'edit'): they must prefill the saved value, save it, and return to
// where the user came from — never continue into the onboarding chain
// (next Menopause step, SecuritySetup, Privacy, Summary, Auth).
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const visited: string[] = [];

const Recorder = ({name}: {name: string}) => {
  visited.push(name);
  return <Text>{`stub-${name}`}</Text>;
};

const FORBIDDEN_AFTER_SAVE = [
  'MenopauseSymptoms',
  'MenopauseHormonalTreatment',
  'MenopauseLabTracking',
  'MenopauseReminders',
  'SecuritySetup',
  'Privacy',
  'Summary',
  'Auth',
];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderEditScreen(
  name: 'MenopauseStage' | 'MenopauseSymptoms' | 'MenopauseHormonalTreatment' | 'MenopauseLabTracking',
  mode: 'edit' | 'onboarding',
) {
  const screens = {
    MenopauseStage: MenopauseStageScreen,
    MenopauseSymptoms: MenopauseSymptomsScreen,
    MenopauseHormonalTreatment: MenopauseHormonalTreatmentScreen,
    MenopauseLabTracking: MenopauseLabTrackingScreen,
  } as const;
  const Target = screens[name] as unknown as React.ComponentType;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen initialParams={{mode}} name={name} component={Target} />
              {[...FORBIDDEN_AFTER_SAVE.filter(route => route !== name)].map(route => (
                <Stack.Screen key={route} name={route}>
                  {() => <Recorder name={route} />}
                </Stack.Screen>
              ))}
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await act(async () => {
    (navRef as unknown as {navigate: (route: string, params?: unknown) => void}).navigate(name, {mode});
  });
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

const buttonWithText = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
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
    await buttonWithText(renderer, label).props.onPress();
  });
  await settle();
};

const currentRoute = () => (navRef.getCurrentRoute() as {name: string} | undefined)?.name;

beforeAll(async () => {
  await setMenopauseStage('perimenopause');
  await setMenopauseTrackedSymptoms(['hot_flashes', 'night_sweats']);
  await setMenopauseHormonalTreatmentStatus('track');
  await setMenopauseLabTracking('both');
  await saveMenopauseJournalField('2026-09-01', 'symptoms', ['hot_flashes', 'brain_fog']);
  await saveMenopauseJournalField('2026-09-01', 'treatmentStatus', 'taken');
  await saveMenopauseJournalField('2026-09-01', 'mood', 'good');
  await addMenopauseLabResult({type: 'fsh', value: 38, date: '2026-09-02'});
});

beforeEach(() => {
  resetPremiumStateForTests();
  visited.length = 0;
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

const historySnapshot = () => JSON.stringify({entries: getAllMenopauseJournalEntries(), labs: getMenopauseLabResults()});

describe('E — edit mode returns to the previous screen and keeps history', () => {
  it('Symptoms: prefilled, changed [A, B] → [A, C], saved, back to previous screen', async () => {
    const before = historySnapshot();
    const renderer = await renderEditScreen('MenopauseSymptoms', 'edit');
    expect(currentRoute()).toBe('MenopauseSymptoms');
    expect(textsOf(renderer)).toContain('2 sélectionnés');

    await press(renderer, 'Sueurs nocturnes'); // deselect B
    await press(renderer, 'Brouillard mental'); // select C
    await press(renderer, 'Enregistrer');

    expect(getMenopausePreferences().trackedSymptoms.sort()).toEqual(['brain_fog', 'hot_flashes']);
    expect(currentRoute()).toBe('Home');
    expect(visited).toEqual([]);
    expect(historySnapshot()).toBe(before);
  });

  it('Symptoms: unselecting everything is still allowed and saved (zero tracked)', async () => {
    const renderer = await renderEditScreen('MenopauseSymptoms', 'edit');
    await press(renderer, 'Bouffées de chaleur');
    await press(renderer, 'Brouillard mental');
    await press(renderer, 'Enregistrer');
    expect(getMenopausePreferences().trackedSymptoms).toEqual([]);
    expect(currentRoute()).toBe('Home');
    await setMenopauseTrackedSymptoms(['hot_flashes', 'night_sweats']);
  });

  it('Stage: prefilled, saved, back — no onboarding continuation', async () => {
    const renderer = await renderEditScreen('MenopauseStage', 'edit');
    await press(renderer, 'Enregistrer');
    expect(getMenopausePreferences().stage).toBe('perimenopause');
    expect(currentRoute()).toBe('Home');
    expect(visited).toEqual([]);
  });

  it('C. Treatment: switching tracking off through the edit screen keeps the treatment history', async () => {
    const before = historySnapshot();
    const renderer = await renderEditScreen('MenopauseHormonalTreatment', 'edit');
    const noOption = renderer.root.findAll(
      node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => /^Non/.test(textOf(text))),
    )[0];
    await act(async () => {
      noOption.props.onPress();
    });
    await press(renderer, 'Enregistrer');

    expect(getMenopausePreferences().hormonalTreatmentStatus).toBe('no');
    expect(currentRoute()).toBe('Home');
    expect(visited).toEqual([]);
    expect(historySnapshot()).toBe(before);
    await setMenopauseHormonalTreatmentStatus('track');
  });

  it('D. Labs: changing lab tracking through the edit screen keeps the lab results', async () => {
    const before = historySnapshot();
    const renderer = await renderEditScreen('MenopauseLabTracking', 'edit');
    await press(renderer, 'FSH');
    await press(renderer, 'Enregistrer');

    expect(getMenopausePreferences().labTracking).toBe('fsh');
    expect(currentRoute()).toBe('Home');
    expect(visited).toEqual([]);
    expect(historySnapshot()).toBe(before);
    await setMenopauseLabTracking('both');
  });

  it('CONTRAST: the same screen in onboarding mode DOES continue to the next onboarding step', async () => {
    const renderer = await renderEditScreen('MenopauseSymptoms', 'onboarding');
    expect(textsOf(renderer)).not.toContain('Enregistrer');
    await press(renderer, 'Continuer');
    expect(currentRoute()).toBe('MenopauseHormonalTreatment');
  });
});

describe('Profile — every Menopause preference has an edit entry point (edit mode)', () => {
  beforeAll(async () => {
    await setSelectedObjective('menopause');
    updatePrivacySecuritySettings({anonymousMode: false});
  });
  afterAll(async () => {
    await setSelectedObjective('cycle');
  });

  it.each([
    ['Étape actuelle', 'MenopauseStage'],
    ['Symptômes suivis', 'MenopauseSymptoms'],
    ['Traitement hormonal', 'MenopauseHormonalTreatment'],
    ['Analyses suivies', 'MenopauseLabTracking'],
    ['Notifications & rappels', 'MenopauseReminders'],
  ])('"%s" opens %s in edit mode', async (title, route) => {
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
      buttonWithText(renderer, title).props.onPress();
    });
    expect(navigate).toHaveBeenCalledWith(route, {mode: 'edit'});
  });
});
