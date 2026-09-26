import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import PostpartumDashboard from '../../components/postpartum/PostpartumDashboard';
import PostpartumDeliveryDateScreen from '../PostpartumDeliveryDateScreen';
import PostpartumDeliveryTypeScreen from '../PostpartumDeliveryTypeScreen';
import PostpartumLochiaScreen from '../PostpartumLochiaScreen';
import PostpartumCycleReturnScreen from '../PostpartumCycleReturnScreen';
import ProfileScreen from '../ProfileScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setSelectedObjective} from '../../state/onboardingPreferences';
import {updatePrivacySecuritySettings} from '../../state/securityPreferences';
import {
  clearFirstPostpartumPeriod,
  confirmDelivery,
  getPostpartumPreferences,
  recordFirstPostpartumPeriod,
  setDeliveryType,
  setFeedingType,
  setPostpartumPreferences,
} from '../../state/postpartumPreferences';
import {
  getAllPostpartumLochiaEntries,
  markPostpartumLochiaEnded,
  reopenPostpartumLochiaTracking,
  savePostpartumLochiaEntry,
} from '../../state/postpartumLochiaStore';
import {getAllPostpartumJournalEntries, savePostpartumJournalField} from '../../state/postpartumJournalStore';
import {getArticleById} from '../../data/libraryContent';

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const visited: string[] = [];
const FORBIDDEN = [
  'PostpartumDeliveryType',
  'PostpartumFeeding',
  'PostpartumReminders',
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

/** Home = the real Postpartum Dashboard; the edit screen is pushed on top of it. */
async function renderFlow(target: 'PostpartumDeliveryDate' | 'PostpartumDeliveryType') {
  const Target = (target === 'PostpartumDeliveryDate'
    ? PostpartumDeliveryDateScreen
    : PostpartumDeliveryTypeScreen) as unknown as React.ComponentType;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Home">
                  {() => <PostpartumDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />}
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

/** A calendar day cell of the delivery-date screen. */
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

const snapshotHistory = () =>
  JSON.stringify({journal: getAllPostpartumJournalEntries(), lochia: getAllPostpartumLochiaEntries()});

beforeAll(async () => {
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 26, 12, 0, 0)});
  await setDeliveryType('vaginal');
  await setFeedingType('mixed');
  // history that must survive every edit
  await savePostpartumJournalField('2026-09-02', 'fatigue', 'Modérée');
  await savePostpartumLochiaEntry('2026-09-02', {flow: 'Modéré', color: 'Rouge', consistency: 'Liquide', symptoms: []});
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(async () => {
  resetPremiumStateForTests();
  visited.length = 0;
  await confirmDelivery(new Date(2026, 8, 1)); // September 1
  await clearFirstPostpartumPeriod();
  await reopenPostpartumLochiaTracking();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('B — delivery-date correction', () => {
  it('Sept 1 → Sept 3: saved, Day N recomputes, back to the Dashboard, history unchanged', async () => {
    const renderer = await renderFlow('PostpartumDeliveryDate');
    expect(textsOf(renderer)).toContain('Jour 26'); // Sept 26 − Sept 1
    const history = snapshotHistory();
    const startedAt = getPostpartumPreferences().startedAt;

    await pickDay(renderer, 3);
    await press(renderer, 'Enregistrer');

    expect(getPostpartumPreferences().deliveryDate).toBe('2026-09-03');
    expect(getPostpartumPreferences().startedAt).toBe(startedAt); // tracking start not rewritten
    expect(currentRoute()).toBe('Home');
    expect(textsOf(renderer)).toContain('Jour 24'); // the Dashboard underneath recomputed
    expect(snapshotHistory()).toBe(history);
    expect(getPostpartumPreferences().deliveryType).toBe('vaginal');
    expect(getPostpartumPreferences().feedingType).toBe('mixed');
  });
});

describe('C — future delivery date', () => {
  it('today is Sept 26: Sept 27 cannot be picked (disabled) and nothing changes on save', async () => {
    const renderer = await renderFlow('PostpartumDeliveryDate');
    expect(dayCell(renderer, 27).props.disabled).toBe(true);
    await pickDay(renderer, 27);
    await press(renderer, 'Enregistrer');
    expect(getPostpartumPreferences().deliveryDate).toBe('2026-09-01');
  });
});

describe('B/D — coherence with already recorded dates', () => {
  it('a delivery date AFTER the recorded first period is refused with a message; nothing saved, no navigation', async () => {
    await recordFirstPostpartumPeriod(new Date(2026, 8, 5));
    const renderer = await renderFlow('PostpartumDeliveryDate');
    await pickDay(renderer, 8);
    await press(renderer, 'Enregistrer');

    expect(textsOf(renderer).some(text => text.includes('postérieure à la date de reprise des règles'))).toBe(true);
    expect(getPostpartumPreferences().deliveryDate).toBe('2026-09-01');
    expect(currentRoute()).toBe('PostpartumDeliveryDate');
  });

  it('a delivery date AFTER the recorded lochia end is refused too', async () => {
    await markPostpartumLochiaEnded('2026-09-04');
    const renderer = await renderFlow('PostpartumDeliveryDate');
    await pickDay(renderer, 9);
    await press(renderer, 'Enregistrer');
    expect(textsOf(renderer).some(text => text.includes('postérieure à la fin des lochies'))).toBe(true);
    expect(getPostpartumPreferences().deliveryDate).toBe('2026-09-01');
  });
});

describe('D — edit mode returns to the normal app flow', () => {
  it('delivery type: prefilled, saved, back — never into the onboarding chain', async () => {
    const renderer = await renderFlow('PostpartumDeliveryType');
    await press(renderer, 'Enregistrer');
    expect(currentRoute()).toBe('Home');
    expect(visited.filter(route => FORBIDDEN.includes(route))).toEqual([]);
    expect(getPostpartumPreferences().deliveryType).toBe('vaginal');
  });

  it('delivery date: after saving nothing of the onboarding tail is visited', async () => {
    const renderer = await renderFlow('PostpartumDeliveryDate');
    await pickDay(renderer, 2);
    await press(renderer, 'Enregistrer');
    expect(currentRoute()).toBe('Home');
    expect(visited.filter(route => FORBIDDEN.includes(route))).toEqual([]);
  });

  it.each([
    ['Date d’accouchement', 'PostpartumDeliveryDate', {mode: 'edit'}],
    ['Mon accouchement', 'PostpartumDeliveryType', {mode: 'edit'}],
    ['Alimentation de bébé', 'PostpartumFeeding', {mode: 'edit'}],
    ['Retour du cycle', 'PostpartumCycleReturn', undefined],
  ])('Profile "%s" opens %s', async (title, route, params) => {
    await setSelectedObjective('postpartum');
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
    if (params) {
      expect(navigate).toHaveBeenCalledWith(route, params);
    } else {
      expect(navigate).toHaveBeenCalledWith(route);
    }
    await act(async () => {
      await setSelectedObjective('cycle');
    });
  });

  it('the Dashboard "Renseigner la date" (unconfigured) opens the delivery-date screen in EDIT mode', async () => {
    await setPostpartumPreferences({...getPostpartumPreferences(), deliveryDate: null});
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
                    {() => <PostpartumDashboard navigation={{navigate} as never} route={{key: 'd', name: 'CycleHome'}} />}
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
      button(renderer, 'Indique ta date d’accouchement').props.onPress();
    });
    expect(navigate).toHaveBeenCalledWith('PostpartumDeliveryDate', {mode: 'edit'});
  });
});

describe('first period / cycle return — correction and clearing', () => {
  const renderCycleReturn = async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => (
                    <PostpartumCycleReturnScreen
                      navigation={{navigate: jest.fn(), goBack: jest.fn()} as never}
                      route={{key: 'c', name: 'PostpartumCycleReturn'} as never}
                    />
                  )}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    await settle();
    return renderer;
  };

  it('a recorded first period can be cleared; the rest of the profile is untouched', async () => {
    await recordFirstPostpartumPeriod(new Date(2026, 8, 20));
    const renderer = await renderCycleReturn();
    expect(textsOf(renderer)).toContain('Modifier');
    await press(renderer, 'Effacer la date des premières règles');

    expect(getPostpartumPreferences().firstPostpartumPeriodDate).toBeNull();
    expect(getPostpartumPreferences().deliveryDate).toBe('2026-09-01');
    expect(getPostpartumPreferences().feedingType).toBe('mixed');
    expect(textsOf(renderer)).toContain('Pas encore enregistrée');
  });

  it('no "clear" action is offered when nothing is recorded', async () => {
    const renderer = await renderCycleReturn();
    expect(
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Effacer la date des premières règles').length,
    ).toBe(0);
  });
});

describe('A — Lochia info button', () => {
  const renderLochia = async () => {
    const navigate = jest.fn();
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => (
                    <PostpartumLochiaScreen
                      navigation={{navigate, goBack: jest.fn()} as never}
                      route={{key: 'l', name: 'PostpartumLochia'} as never}
                    />
                  )}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    await settle();
    return {renderer, navigate};
  };

  it('the existing Bibliothèque article on the lochia exists', () => {
    expect(getArticleById('lochia-comprendre-lochies')?.title).toMatch(/lochies/i);
  });

  it('the header information icon is a real button that opens that article', async () => {
    const {renderer, navigate} = await renderLochia();
    await act(async () => {
      button(renderer, 'En savoir plus sur les lochies').props.onPress();
    });
    expect(navigate).toHaveBeenCalledWith('ArticleReader', {articleId: 'lochia-comprendre-lochies'});
  });

  it('no information icon of the header looks tappable without being tappable', async () => {
    const {renderer} = await renderLochia();
    const headerInfoIcons = renderer.root
      .findAllByType(MaterialDesignIcons)
      .filter(icon => icon.props.name === 'information-outline' && icon.props.size === 20);
    expect(headerInfoIcons.length).toBeGreaterThan(0);
    for (const icon of headerInfoIcons) {
      let node: ReactTestRenderer.ReactTestInstance | null = icon.parent;
      let tappable = false;
      while (node) {
        if (typeof node.props.onPress === 'function') {tappable = true;}
        node = node.parent;
      }
      expect(tappable).toBe(true);
    }
  });
});
