import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Switch, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {
  ConceptionIndicatorsScreen,
  ConceptionOvulationAwarenessScreen,
  ConceptionRemindersScreen,
  ConceptionTryingDurationScreen,
} from '../ConceptionOnboardingScreens';
import {
  getConceptionPreferences,
  hydrateConceptionPreferences,
  setConceptionPreferences,
  subscribeConceptionPreferences,
  type ConceptionPreferences,
} from '../../state/conceptionPreferences';

// M3 — the Conception edit screens must always start from the CURRENT
// preferences (never the boot-time hydration snapshot) and must save only the
// group they own, so editing B after A in the same session can never revert A.
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

type RouteName = 'ConceptionTryingDuration' | 'ConceptionOvulationAwareness' | 'ConceptionIndicators' | 'ConceptionReminders';

const SCREENS = {
  ConceptionTryingDuration: ConceptionTryingDurationScreen,
  ConceptionOvulationAwareness: ConceptionOvulationAwarenessScreen,
  ConceptionIndicators: ConceptionIndicatorsScreen,
  ConceptionReminders: ConceptionRemindersScreen,
} as const;

const FORBIDDEN = ['SecuritySetup', 'Privacy', 'Summary', 'Auth', 'Location', 'CycleHome'];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderScreen(name: RouteName, mode: 'edit' | 'onboarding') {
  const Target = SCREENS[name] as unknown as React.ComponentType;
  const others = (Object.keys(SCREENS) as RouteName[]).filter(route => route !== name);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen component={Target} initialParams={{mode}} name={name} />
              {[...others, ...FORBIDDEN].map(route => (
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

const toggleSwitch = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string, value: boolean) => {
  const target = renderer.root.findAllByType(Switch).find(node => node.props.accessibilityLabel === label);
  if (!target) {throw new Error(`No switch "${label}"`);}
  await act(async () => {
    target.props.onValueChange(value);
  });
  await settle();
};

const switchValue = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAllByType(Switch).find(node => node.props.accessibilityLabel === label)?.props.value;

const currentRoute = () => (navRef.getCurrentRoute() as {name: string} | undefined)?.name;

const NO_REMINDERS = {fertile_window: false, estimated_ovulation: false, temperature: false, lh_test: false, daily_journal: false};
const BASE: Partial<ConceptionPreferences> = {
  tryingDuration: 'starting_now',
  ovulationAwareness: 'often',
  indicators: ['temperature'],
  reminders: NO_REMINDERS,
};

type EditorKey = 'tryingDuration' | 'ovulationAwareness' | 'indicators' | 'reminders';
type Editor = {
  route: RouteName;
  edit: (renderer: ReactTestRenderer.ReactTestRenderer) => Promise<void>;
  applied: () => void;
  untouched: () => void;
  externalChange: () => Promise<void>;
  externalApplied: () => void;
  externalPrefilled: (renderer: ReactTestRenderer.ReactTestRenderer) => void;
};

const EDITORS: Record<EditorKey, Editor> = {
  tryingDuration: {
    route: 'ConceptionTryingDuration',
    edit: renderer => press(renderer, 'Plus d’un an'),
    applied: () => expect(getConceptionPreferences().tryingDuration).toBe('over_1_year'),
    untouched: () => expect(getConceptionPreferences().tryingDuration).toBe('starting_now'),
    externalChange: () => act(async () => {await setConceptionPreferences({tryingDuration: '3_to_6_months'});}),
    externalApplied: () => expect(getConceptionPreferences().tryingDuration).toBe('3_to_6_months'),
    externalPrefilled: renderer => {
      expect(
        renderer.root.findAll(node => node.props.accessibilityState?.checked === true || node.props.selected === true).length,
      ).toBeGreaterThan(0);
    },
  },
  ovulationAwareness: {
    route: 'ConceptionOvulationAwareness',
    edit: renderer => press(renderer, 'Non, pas vraiment'),
    applied: () => expect(getConceptionPreferences().ovulationAwareness).toBe('not_really'),
    untouched: () => expect(getConceptionPreferences().ovulationAwareness).toBe('often'),
    externalChange: () => act(async () => {await setConceptionPreferences({ovulationAwareness: 'sometimes'});}),
    externalApplied: () => expect(getConceptionPreferences().ovulationAwareness).toBe('sometimes'),
    externalPrefilled: () => undefined,
  },
  indicators: {
    route: 'ConceptionIndicators',
    edit: renderer => press(renderer, 'Glaire cervicale'),
    applied: () => expect([...getConceptionPreferences().indicators].sort()).toEqual(['cervical_mucus', 'temperature']),
    untouched: () => expect(getConceptionPreferences().indicators).toEqual(['temperature']),
    externalChange: () => act(async () => {await setConceptionPreferences({indicators: ['lh_tests']});}),
    externalApplied: () => expect(getConceptionPreferences().indicators).toEqual(['lh_tests']),
    externalPrefilled: () => undefined,
  },
  reminders: {
    route: 'ConceptionReminders',
    edit: renderer => toggleSwitch(renderer, 'Test LH', true),
    applied: () => expect(getConceptionPreferences().reminders.lh_test).toBe(true),
    untouched: () => expect(getConceptionPreferences().reminders).toEqual(NO_REMINDERS),
    externalChange: () => act(async () => {await setConceptionPreferences({reminders: {...NO_REMINDERS, temperature: true}});}),
    externalApplied: () => expect(getConceptionPreferences().reminders).toEqual({...NO_REMINDERS, temperature: true}),
    externalPrefilled: renderer => expect(switchValue(renderer, 'Température basale')).toBe(true),
  },
};

const KEYS = Object.keys(EDITORS) as EditorKey[];

beforeAll(async () => {
  // Boot-time hydration (App.tsx) — resolves once with the (empty) stored
  // state. Every later editor used to receive THIS snapshot back.
  await hydrateConceptionPreferences();
});

beforeEach(async () => {
  visited.length = 0;
  await setConceptionPreferences(BASE);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('M3 — every Conception editor opens on the CURRENT preferences', () => {
  it.each(KEYS)('%s: a value changed after boot is shown and survives an unchanged save', async key => {
    const editor = EDITORS[key];
    await editor.externalChange();

    const renderer = await renderScreen(editor.route, 'edit');
    editor.externalPrefilled(renderer);
    expect(textsOf(renderer)).toContain('Enregistrer');

    await press(renderer, 'Enregistrer');

    editor.externalApplied();
    expect(currentRoute()).toBe('Home');
    expect(visited).toEqual([]);
  });

  it('the Trying-duration editor highlights the value saved earlier in the session (not the boot snapshot)', async () => {
    await act(async () => {
      await setConceptionPreferences({tryingDuration: '6_to_12_months'});
    });
    const renderer = await renderScreen('ConceptionTryingDuration', 'edit');
    const selectedRows = renderer.root.findAll(
      node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => textOf(text) === '6 à 12 mois'),
    );
    expect(selectedRows.length).toBeGreaterThan(0);
    // Saving with no interaction keeps the value (Enregistrer is enabled).
    await press(renderer, 'Enregistrer');
    expect(getConceptionPreferences().tryingDuration).toBe('6_to_12_months');
  });
});

describe('M3 — editing B after A (real screens, same session) never reverts A', () => {
  const PAIRS = KEYS.flatMap(a => KEYS.filter(b => b !== a).map(b => [a, b] as [EditorKey, EditorKey]));

  it.each(PAIRS)('edit %s, then open and save %s', async (a, b) => {
    const editorA = EDITORS[a];
    const editorB = EDITORS[b];

    const rendererA = await renderScreen(editorA.route, 'edit');
    await editorA.edit(rendererA);
    await press(rendererA, 'Enregistrer');
    editorA.applied();
    act(() => rendererA.unmount());

    const rendererB = await renderScreen(editorB.route, 'edit');
    await editorB.edit(rendererB);
    await press(rendererB, 'Enregistrer');

    editorA.applied();
    editorB.applied();
    for (const other of KEYS.filter(key => key !== a && key !== b)) {
      EDITORS[other].untouched();
    }
    expect(currentRoute()).toBe('Home');
    expect(visited).toEqual([]);
  });

  it.each(PAIRS)('%s changes while editor %s is already open', async (a, b) => {
    const editorA = EDITORS[a];
    const editorB = EDITORS[b];

    const rendererB = await renderScreen(editorB.route, 'edit');
    await editorA.externalChange();
    await settle();
    await editorB.edit(rendererB);
    await press(rendererB, 'Enregistrer');

    editorA.externalApplied();
    editorB.applied();
  });
});

describe('M3 — reminders are rebuilt from the CURRENT record, only her toggles applied', () => {
  it('a reminder changed elsewhere while the screen is open is kept when another toggle is saved', async () => {
    const renderer = await renderScreen('ConceptionReminders', 'edit');
    await act(async () => {
      await setConceptionPreferences({reminders: {...NO_REMINDERS, temperature: true, daily_journal: true}});
    });
    await settle();
    // The screen follows the store live for the rows she has not touched.
    expect(switchValue(renderer, 'Température basale')).toBe(true);

    await toggleSwitch(renderer, 'Test LH', true);
    await toggleSwitch(renderer, 'Journal quotidien', false);
    await press(renderer, 'Enregistrer');

    expect(getConceptionPreferences().reminders).toEqual({
      ...NO_REMINDERS,
      temperature: true,
      lh_test: true,
      daily_journal: false,
    });
  });

  it('saving the reminders screen leaves the other groups untouched', async () => {
    await setConceptionPreferences({tryingDuration: 'over_1_year', ovulationAwareness: 'sometimes', indicators: ['lh_tests', 'intercourse']});
    const renderer = await renderScreen('ConceptionReminders', 'edit');
    await toggleSwitch(renderer, 'Fenêtre fertile', true);
    await press(renderer, 'Enregistrer');
    const saved = getConceptionPreferences();
    expect(saved.tryingDuration).toBe('over_1_year');
    expect(saved.ovulationAwareness).toBe('sometimes');
    expect(saved.indicators).toEqual(['lh_tests', 'intercourse']);
    expect(saved.reminders.fertile_window).toBe(true);
  });

  it('a save still notifies subscribers (the reminder scheduler re-syncs)', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeConceptionPreferences(listener);
    const renderer = await renderScreen('ConceptionReminders', 'edit');
    listener.mockClear();
    await toggleSwitch(renderer, 'Test LH', true);
    await press(renderer, 'Enregistrer');
    unsubscribe();
    expect(listener).toHaveBeenCalled();
  });
});

describe('M3 — onboarding mode is unchanged', () => {
  it('Trying duration still says "Suivant" and continues to the next onboarding step', async () => {
    const renderer = await renderScreen('ConceptionTryingDuration', 'onboarding');
    expect(textsOf(renderer)).toContain('Suivant');
    expect(textsOf(renderer)).not.toContain('Enregistrer');
    await press(renderer, 'Plus d’un an');
    await press(renderer, 'Suivant');
    expect(getConceptionPreferences().tryingDuration).toBe('over_1_year');
    expect(currentRoute()).toBe('ConceptionOvulationAwareness');
  });

  it('Indicators (onboarding) continues to the reminders step', async () => {
    const renderer = await renderScreen('ConceptionIndicators', 'onboarding');
    await press(renderer, 'Suivant');
    expect(currentRoute()).toBe('ConceptionReminders');
  });
});
