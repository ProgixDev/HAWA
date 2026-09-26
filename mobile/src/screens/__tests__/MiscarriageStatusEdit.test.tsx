import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import MiscarriageDashboard from '../../components/miscarriage/MiscarriageDashboard';
import MiscarriageBleedingScreen from '../MiscarriageBleedingScreen';
import MiscarriageCycleReturnScreen from '../MiscarriageCycleReturnScreen';
import MiscarriageTryingAgainScreen from '../MiscarriageTryingAgainScreen';
import InlineCalendarPickerModal from '../../components/onboarding/InlineCalendarPickerModal';
import ProfileScreen from '../ProfileScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {getActiveObjective, setActiveObjective, setSelectedObjective} from '../../state/onboardingPreferences';
import {updatePrivacySecuritySettings} from '../../state/securityPreferences';
import {getMiscarriagePreferences, setMiscarriagePreferences} from '../../state/miscarriagePreferences';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const visited: string[] = [];
const CHAIN = [
  'MiscarriageReminders',
  'MiscarriageBleeding',
  'MiscarriageCycleReturn',
  'MiscarriageTryingAgain',
  'SecuritySetup',
  'Privacy',
  'Summary',
  'Auth',
];

type EditRoute = 'MiscarriageBleeding' | 'MiscarriageCycleReturn' | 'MiscarriageTryingAgain';
const SCREENS: Record<EditRoute, React.ComponentType> = {
  MiscarriageBleeding: MiscarriageBleedingScreen as unknown as React.ComponentType,
  MiscarriageCycleReturn: MiscarriageCycleReturnScreen as unknown as React.ComponentType,
  MiscarriageTryingAgain: MiscarriageTryingAgainScreen as unknown as React.ComponentType,
};

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
const currentRoute = () => (navRef.getCurrentRoute() as {name: string; params?: unknown} | undefined);

/** Home = the REAL loss dashboard on the REAL navigation; the target screen is pushed on top. */
async function renderFlow(target?: EditRoute) {
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
                {(Object.keys(SCREENS) as EditRoute[]).map(route => (
                  <Stack.Screen component={SCREENS[route]} key={route} name={route} />
                ))}
                {CHAIN.filter(route => !(route in SCREENS)).map(route => (
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
  if (target) {
    await act(async () => {
      (navRef as unknown as {navigate: (route: string, params?: unknown) => void}).navigate(target, {mode: 'edit'});
    });
    await settle();
  }
  return renderer;
}

/** A day cell of InlineCalendarPickerModal (accessibilityLabel "10 septembre"). */
const dayCell = (renderer: ReactTestRenderer.ReactTestRenderer, day: number) => {
  const matches = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel === `${day} septembre`,
  );
  if (matches.length === 0) {throw new Error(`No day ${day}`);}
  return matches[0];
};

const seed = (overrides: Partial<ReturnType<typeof getMiscarriagePreferences>> = {}) =>
  setMiscarriagePreferences({
    miscarriageDate: '2026-09-01',
    bleedingStatus: 'yes',
    cycleReturnStatus: 'no',
    firstReturnedPeriodDate: null,
    tryingAgainStatus: 'not_now',
    dailyTrackingReminderEnabled: false,
    dailyTrackingReminderTime: null,
    ...overrides,
  });

let alertSpy: jest.SpyInstance;

beforeAll(() => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 12, 0, 0)});
});
afterAll(() => {
  jest.useRealTimers();
});

beforeEach(async () => {
  resetPremiumStateForTests();
  visited.length = 0;
  await setActiveObjective('loss');
  await seed();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  alertSpy.mockRestore();
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

const noChainVisited = () => visited.filter(route => CHAIN.includes(route));

describe('H12 — bleeding status edit', () => {
  it('prefills, shows "Enregistrer" (not "Suivant"), saves and goes back to Home without the onboarding chain', async () => {
    const renderer = await renderFlow('MiscarriageBleeding');
    expect(currentRoute()?.name).toBe('MiscarriageBleeding');
    expect(textsOf(renderer)).toContain('Enregistrer');
    expect(textsOf(renderer)).not.toContain('Suivant');
    // the stored answer ("Oui") is pre-selected
    const radioChecked = (title: string) =>
      renderer.root
        .findAll(node => node.props.accessibilityRole === 'radio' && node.findAllByType(Text).some(text => textOf(text) === title))
        .map(node => node.props.accessibilityState?.checked);
    expect(radioChecked('Oui')).toContain(true);
    expect(radioChecked('Non')).not.toContain(true);
    expect(getMiscarriagePreferences().bleedingStatus).toBe('yes');

    await press(renderer, 'Non');
    await press(renderer, 'Enregistrer');

    expect(getMiscarriagePreferences().bleedingStatus).toBe('no');
    expect(currentRoute()?.name).toBe('Home');
    expect(noChainVisited()).toEqual([]);
  });
});

describe('H12 — cycle return edit', () => {
  it('shows "Enregistrer" and never "Suivant"', async () => {
    const renderer = await renderFlow('MiscarriageCycleReturn');
    expect(textsOf(renderer)).toContain('Enregistrer');
    expect(textsOf(renderer)).not.toContain('Suivant');
  });

  it('no -> yes with a past date: saved, back to Home, chain never visited', async () => {
    const renderer = await renderFlow('MiscarriageCycleReturn');
    await press(renderer, 'Oui');
    await press(renderer, 'Date du premier jour de tes règles revenues');
    await act(async () => {
      dayCell(renderer, 12).props.onPress();
    });
    await press(renderer, 'Enregistrer');

    expect(getMiscarriagePreferences().cycleReturnStatus).toBe('yes');
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-09-12');
    expect(currentRoute()?.name).toBe('Home');
    expect(noChainVisited()).toEqual([]);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('yes -> no clears the stored date (existing store behavior kept)', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-10'});
    const renderer = await renderFlow('MiscarriageCycleReturn');
    await press(renderer, 'Non');
    await press(renderer, 'Enregistrer');

    expect(getMiscarriagePreferences().cycleReturnStatus).toBe('no');
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBeNull();
    expect(currentRoute()?.name).toBe('Home');
  });

  it('a FUTURE date is disabled in the picker (today is Sept 26: Sept 27 blocked, Sept 26 allowed, before the loss blocked)', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-10', miscarriageDate: '2026-09-05'});
    const renderer = await renderFlow('MiscarriageCycleReturn');
    await press(renderer, 'Date du premier jour de tes règles revenues');

    expect(dayCell(renderer, 27).props.disabled).toBe(true);
    expect(dayCell(renderer, 26).props.disabled).toBe(false);
    expect(dayCell(renderer, 4).props.disabled).toBe(true); // before the loss date
    expect(dayCell(renderer, 5).props.disabled).toBe(false);
  });

  it('a future date pushed through the picker callback is rejected with a French message and not applied', async () => {
    const renderer = await renderFlow('MiscarriageCycleReturn');
    await press(renderer, 'Oui');
    await act(async () => {
      renderer.root.findByType(InlineCalendarPickerModal).props.onSelect(new Date(2026, 8, 27));
    });
    expect(alertSpy).toHaveBeenCalledWith('Date invalide', expect.stringContaining('dans le futur'));
    await press(renderer, 'Enregistrer');
    // the rejected date was never applied: saved as "yes" without a date
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBeNull();
  });

  it('a stale stored future date cannot be re-saved: blocked at save time, nothing written, screen stays', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-30'});
    const renderer = await renderFlow('MiscarriageCycleReturn');
    await press(renderer, 'Enregistrer');

    expect(alertSpy).toHaveBeenCalledWith('Date invalide', expect.stringContaining('dans le futur'));
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-09-30');
    expect(currentRoute()?.name).toBe('MiscarriageCycleReturn');
  });

  it('a date before the loss date is still rejected at save time', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-08-20', miscarriageDate: '2026-09-01'});
    const renderer = await renderFlow('MiscarriageCycleReturn');
    await press(renderer, 'Enregistrer');
    expect(alertSpy).toHaveBeenCalledWith('Date invalide', expect.stringContaining('précéder'));
    expect(currentRoute()?.name).toBe('MiscarriageCycleReturn');
  });
});

describe('H12 — trying again edit', () => {
  it('shows "Enregistrer", saves, goes back, and NEVER changes the active objective', async () => {
    expect(getActiveObjective()).toBe('loss');
    const renderer = await renderFlow('MiscarriageTryingAgain');
    expect(textsOf(renderer)).toContain('Enregistrer');
    expect(textsOf(renderer)).not.toContain('Terminer');

    await press(renderer, 'Oui, je me sens prête');
    await press(renderer, 'Enregistrer');

    expect(getMiscarriagePreferences().tryingAgainStatus).toBe('ready');
    expect(getActiveObjective()).toBe('loss');
    expect(currentRoute()?.name).toBe('Home');
    expect(noChainVisited()).toEqual([]);
  });
});

describe('H12 — entry points', () => {
  it('the Dashboard "Retour du cycle" card opens the cycle-return screen in edit mode', async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Retour du cycle');
    expect(currentRoute()?.name).toBe('MiscarriageCycleReturn');
    expect(currentRoute()?.params).toEqual({mode: 'edit'});
  });

  it('Profile (objective loss) exposes the three rows with the current value and navigates in edit mode', async () => {
    await setSelectedObjective('loss');
    updatePrivacySecuritySettings({anonymousMode: false});
    await seed({bleedingStatus: 'variable', cycleReturnStatus: 'unknown', tryingAgainStatus: 'soon'});
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

    const texts = textsOf(renderer);
    expect(texts).toContain('Actuellement : Variable');
    expect(texts).toContain('Actuellement : Je ne sais pas');
    expect(texts).toContain('Actuellement : Bientôt');

    const cases: Array<[string, string]> = [
      ['Saignements actuels', 'MiscarriageBleeding'],
      ['Retour du cycle', 'MiscarriageCycleReturn'],
      ['Reprise des essais', 'MiscarriageTryingAgain'],
    ];
    for (const [title, route] of cases) {
      navigate.mockClear();
      await act(async () => {
        button(renderer, title).props.onPress();
      });
      expect(navigate).toHaveBeenCalledWith(route, {mode: 'edit'});
    }
    await act(async () => {
      await setSelectedObjective('cycle');
    });
  });

  it('Profile does not show the loss rows for another objective', async () => {
    await setSelectedObjective('postpartum');
    updatePrivacySecuritySettings({anonymousMode: false});
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Profile">
                  {() => <ProfileScreen navigation={{navigate: jest.fn()} as never} route={{key: 'p', name: 'Profile'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    await settle();
    expect(textsOf(renderer).some(text => text.startsWith('Actuellement :'))).toBe(false);
    await act(async () => {
      await setSelectedObjective('cycle');
    });
  });
});
