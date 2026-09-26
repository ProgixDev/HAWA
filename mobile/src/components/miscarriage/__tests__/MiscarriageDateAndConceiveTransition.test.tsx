import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import MiscarriageDashboard from '../MiscarriageDashboard';
import MiscarriageDateScreen from '../../../screens/MiscarriageDateScreen';
import ProfileScreen from '../../../screens/ProfileScreen';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {
  getActiveObjective,
  setActiveObjective,
  setCyclePreferences,
  setSelectedObjective,
} from '../../../state/onboardingPreferences';
import {updatePrivacySecuritySettings} from '../../../state/securityPreferences';
import {
  getMiscarriagePreferences,
  setMiscarriagePreferences,
  setMiscarriageTryingAgainStatus,
} from '../../../state/miscarriagePreferences';
import {setConceptionPreferences} from '../../../state/conceptionPreferences';
import {
  getAllMiscarriageJournalEntries,
  saveMiscarriageJournalField,
} from '../../../state/miscarriageJournalStore';
import {
  cancelPendingObjectiveSetup,
  continueAfterObjectiveSetup,
  getPendingObjectiveSetup,
  resetObjectiveSetupFlowForTests,
} from '../../../state/objectiveSetupFlow';
import {validateLossDate} from '../../../utils/postpartumLossDateValidation';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const visited: string[] = [];
const ONBOARDING_CHAIN = [
  'MiscarriageBleeding',
  'MiscarriageCycleReturn',
  'MiscarriageTryingAgain',
  'MiscarriageReminders',
  'SecuritySetup',
  'Privacy',
  'Summary',
  'Auth',
];
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

/** Home = the REAL loss dashboard wired to the REAL navigation; date screen on top. */
async function renderLossFlow() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Home">
                  {({navigation}) => <MiscarriageDashboard navigation={navigation as never} route={{key: 'd', name: 'CycleHome'}} />}
                </Stack.Screen>
                <Stack.Screen component={MiscarriageDateScreen as unknown as React.ComponentType} name="MiscarriageDate" />
                {ONBOARDING_CHAIN.filter(route => route !== 'MiscarriageDate').map(route => (
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
  return renderer;
}

const dayCell = (renderer: ReactTestRenderer.ReactTestRenderer, day: number) => {
  const matches = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityState !== undefined &&
      'selected' in node.props.accessibilityState &&
      node.findAllByType(Text).some(text => textOf(text) === String(day)),
  );
  if (matches.length === 0) {throw new Error(`No day ${day}`);}
  return matches[0];
};
const pickDay = async (renderer: ReactTestRenderer.ReactTestRenderer, day: number) => {
  await act(async () => {
    dayCell(renderer, day).props.onPress();
  });
};

const clearLossDate = () =>
  setMiscarriagePreferences({...getMiscarriagePreferences(), miscarriageDate: null});

beforeAll(() => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 12, 0, 0)});
});
afterAll(() => {
  jest.useRealTimers();
});

beforeEach(async () => {
  resetPremiumStateForTests();
  resetObjectiveSetupFlowForTests();
  visited.length = 0;
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('H — a loss date in the future is rejected', () => {
  it('Sept 27 when today is Sept 26', () => {
    const now = new Date(2026, 8, 26, 12, 0, 0);
    expect(validateLossDate(new Date(2026, 8, 27), now)).toMatchObject({valid: false});
    expect(validateLossDate(new Date(2026, 8, 26), now).valid).toBe(true);
    expect(validateLossDate(new Date(2026, 8, 1), now).valid).toBe(true);
  });
});

describe('F — missing loss date: "Renseigner la date" does not restart the onboarding chain', () => {
  it('already-onboarded user, no date: Dashboard → date screen → save → back on the Pregnancy-loss Dashboard', async () => {
    await clearLossDate();
    const renderer = await renderLossFlow();
    expect(textsOf(renderer)).toContain('Renseigner la date');

    await press(renderer, 'Indiquer la date');
    expect(currentRoute()).toBe('MiscarriageDate');
    // edit mode: the primary action is a save, not a "Suivant"
    expect(textsOf(renderer)).toContain('Enregistrer');
    expect(textsOf(renderer)).not.toContain('Suivant');

    await pickDay(renderer, 20);
    await press(renderer, 'Enregistrer');

    expect(getMiscarriagePreferences().miscarriageDate).toBe('2026-09-20');
    expect(currentRoute()).toBe('Home');
    expect(visited.filter(route => ONBOARDING_CHAIN.includes(route))).toEqual([]);
    // the Dashboard is now configured: 6 days since the loss
    expect(textsOf(renderer)).toContain('6 jours');
    expect(textsOf(renderer)).not.toContain('Renseigner la date');
  });
});

describe('G — correcting an existing loss date', () => {
  it('Sept 10 → Sept 12: stored date, Dashboard days-since and history', async () => {
    await setMiscarriagePreferences({...getMiscarriagePreferences(), miscarriageDate: '2026-09-10'});
    // Dated AFTER the corrected loss date (M37: an entry dated before it would block the save).
    await saveMiscarriageJournalField('2026-09-13', 'physicalSymptoms', ['Fatigue']);
    const history = JSON.stringify(getAllMiscarriageJournalEntries());

    const renderer = await renderLossFlow();
    expect(textsOf(renderer)).toContain('16 jours');

    await act(async () => {
      (navRef as unknown as {navigate: (route: string, params?: unknown) => void}).navigate('MiscarriageDate', {mode: 'edit'});
    });
    await settle();
    await pickDay(renderer, 12);
    await press(renderer, 'Enregistrer');

    expect(getMiscarriagePreferences().miscarriageDate).toBe('2026-09-12');
    expect(currentRoute()).toBe('Home');
    expect(textsOf(renderer)).toContain('14 jours');
    expect(JSON.stringify(getAllMiscarriageJournalEntries())).toBe(history);
    expect(visited.filter(route => ONBOARDING_CHAIN.includes(route))).toEqual([]);
  });

  it('a future day cannot be picked (disabled) and nothing changes on save', async () => {
    await setMiscarriagePreferences({...getMiscarriagePreferences(), miscarriageDate: '2026-09-10'});
    const renderer = await renderLossFlow();
    await act(async () => {
      (navRef as unknown as {navigate: (route: string, params?: unknown) => void}).navigate('MiscarriageDate', {mode: 'edit'});
    });
    await settle();
    expect(dayCell(renderer, 27).props.disabled).toBe(true);
    await pickDay(renderer, 27);
    await press(renderer, 'Enregistrer');
    expect(getMiscarriagePreferences().miscarriageDate).toBe('2026-09-10');
  });

  it('Profile "Date de la fausse couche" opens the date screen in edit mode', async () => {
    await setSelectedObjective('loss');
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
      button(renderer, 'Date de la fausse couche').props.onPress();
    });
    expect(navigate).toHaveBeenCalledWith('MiscarriageDate', {mode: 'edit'});
    await act(async () => {
      await setSelectedObjective('cycle');
    });
  });
});

describe('Loss → Conceive goes through the SHARED objective switch (already in place)', () => {
  // Module-level stores persist, so the scenarios build on each other:
  // cycle data unknown → cycle data known but conception unanswered → configured.
  const renderDashboardOnly = async () => {
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
                    {() => <MiscarriageDashboard navigation={{navigate} as never} route={{key: 'd', name: 'CycleHome'}} />}
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
    return {renderer, navigate};
  };

  const startTransition = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
    await press(renderer, 'Passer au suivi conception');
    await press(renderer, 'Continuer et passer au suivi conception');
    await settle();
  };

  beforeEach(async () => {
    await setMiscarriagePreferences({...getMiscarriagePreferences(), miscarriageDate: '2026-09-10'});
    await setMiscarriageTryingAgainStatus('ready');
    await setActiveObjective('loss');
  });

  it('J. Conceive NEVER configured and no cycle data: opens Conceive configuration (cycle information first), not the dashboard', async () => {
    const {renderer, navigate} = await renderDashboardOnly();
    await startTransition(renderer);

    expect(navigate).toHaveBeenCalledWith('CycleInformation');
    expect(navigate).not.toHaveBeenCalledWith('CycleHome');
    expect(getActiveObjective()).toBe('conceive'); // the chain's screens branch on it
    expect(getPendingObjectiveSetup()).toEqual({previous: 'loss', objective: 'conceive'});
  });

  it('K. backing out of that configuration restores Pregnancy loss (shared restoration), no data touched', async () => {
    const {renderer} = await renderDashboardOnly();
    await startTransition(renderer);
    expect(getActiveObjective()).toBe('conceive');

    await cancelPendingObjectiveSetup();
    expect(getActiveObjective()).toBe('loss');
    expect(getPendingObjectiveSetup()).toBeNull();
    expect(getMiscarriagePreferences().miscarriageDate).toBe('2026-09-10');
  });

  it('J. finishing the Conceive chain returns to the app (Dashboard), not to the global onboarding tail', async () => {
    const {renderer} = await renderDashboardOnly();
    await startTransition(renderer);
    const reset = jest.fn();
    const navigate = jest.fn();
    continueAfterObjectiveSetup({navigate, reset});
    expect(reset).toHaveBeenCalledWith({index: 0, routes: [{name: 'MainTabs', params: {screen: 'CycleHome'}}]});
    expect(navigate).not.toHaveBeenCalledWith('SecuritySetup');
    expect(getPendingObjectiveSetup()).toBeNull();
  });

  it('J. cycle data already confirmed but Conceive unanswered: only Conceive’s own first step (no redundant cycle information)', async () => {
    await setCyclePreferences({
      lastPeriodStart: new Date(2026, 8, 1),
      periodDuration: 5,
      cycleDuration: 28,
      regularity: 'yes',
    });
    const {renderer, navigate} = await renderDashboardOnly();
    await startTransition(renderer);
    expect(navigate).toHaveBeenCalledWith('ConceptionTryingDuration');
    expect(navigate).not.toHaveBeenCalledWith('CycleInformation');
    await cancelPendingObjectiveSetup();
  });

  it('I. Conceive already configured: straight to the Conceive dashboard, no onboarding rerun', async () => {
    // A configured Conceive = its whole required chain (not just the first step).
    await setConceptionPreferences({
      tryingDuration: 'under_3_months',
      ovulationAwareness: 'sometimes',
      indicators: ['temperature'],
    });
    const {renderer, navigate} = await renderDashboardOnly();
    await startTransition(renderer);

    expect(navigate).toHaveBeenCalledWith('CycleHome');
    expect(navigate).not.toHaveBeenCalledWith('CycleInformation');
    expect(navigate).not.toHaveBeenCalledWith('ConceptionTryingDuration');
    expect(getActiveObjective()).toBe('conceive');
    expect(getPendingObjectiveSetup()).toBeNull();
    // Pregnancy-loss data is untouched
    expect(getMiscarriagePreferences().miscarriageDate).toBe('2026-09-10');
    expect(getMiscarriagePreferences().tryingAgainStatus).toBe('ready');
  });
});
