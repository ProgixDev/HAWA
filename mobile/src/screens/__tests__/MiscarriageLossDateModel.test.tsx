import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import MiscarriageDashboard from '../../components/miscarriage/MiscarriageDashboard';
import MiscarriageDateScreen from '../MiscarriageDateScreen';
import MiscarriageCycleReturnScreen from '../MiscarriageCycleReturnScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setActiveObjective} from '../../state/onboardingPreferences';
import {getMiscarriagePreferences, setMiscarriagePreferences} from '../../state/miscarriagePreferences';
import {getAllMiscarriageJournalEntries, saveMiscarriageJournalField} from '../../state/miscarriageJournalStore';

// M36 + M37 — the Loss chronology model wired through the REAL screens:
// cycle-return edit (legacy invalid values, clear action) and loss-date edit
// (blocked when it would contradict dated data). Clock pinned to 2026-09-26.
// Module-singleton stores persist inside this file: the journal is only ever
// appended to (dates <= Sept 8) and the loss date is re-seeded per test.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

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
  // Prefer the exact accessibilityLabel match over an enclosing card that only contains the text.
  return matches.find(node => node.props.accessibilityLabel === label) ?? matches[0];
};
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    await button(renderer, label).props.onPress();
  });
  await settle();
};
const currentRoute = () => (navRef.getCurrentRoute() as {name: string} | undefined)?.name;
const navigateTo = async (route: string, params?: unknown) => {
  await act(async () => {
    (navRef as unknown as {navigate: (route: string, params?: unknown) => void}).navigate(route, params);
  });
  await settle();
};

async function renderFlow() {
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
                <Stack.Screen component={MiscarriageCycleReturnScreen as unknown as React.ComponentType} name="MiscarriageCycleReturn" />
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

/** A day cell of the date screen's own calendar. */
const dateScreenDay = (renderer: ReactTestRenderer.ReactTestRenderer, day: number) => {
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
/** A day cell of InlineCalendarPickerModal (accessibilityLabel "10 septembre"). */
const pickerDay = (renderer: ReactTestRenderer.ReactTestRenderer, day: number) => {
  const matches = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' && node.props.accessibilityLabel === `${day} septembre`,
  );
  if (matches.length === 0) {throw new Error(`No picker day ${day}`);}
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

describe('M37 — editing the loss date checks the dated data already recorded', () => {
  it('safe edit: nothing dated before the new date -> saved, back on Home', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-20'});
    const renderer = await renderFlow();
    await navigateTo('MiscarriageDate', {mode: 'edit'});
    await act(async () => {
      dateScreenDay(renderer, 5).props.onPress();
    });
    await press(renderer, 'Enregistrer');

    expect(getMiscarriagePreferences()).toMatchObject({miscarriageDate: '2026-09-05', firstReturnedPeriodDate: '2026-09-20'});
    expect(currentRoute()).toBe('Home');
  });

  it('a new loss date AFTER the recorded cycle-return date is blocked with a clear message; nothing is written or moved', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-15'});
    const renderer = await renderFlow();
    await navigateTo('MiscarriageDate', {mode: 'edit'});
    await act(async () => {
      dateScreenDay(renderer, 18).props.onPress();
    });
    await press(renderer, 'Enregistrer');

    expect(currentRoute()).toBe('MiscarriageDate');
    expect(textsOf(renderer).some(text => text.includes('retour de tes règles') && text.includes('15 septembre 2026'))).toBe(true);
    expect(getMiscarriagePreferences()).toMatchObject({
      miscarriageDate: '2026-09-01',
      cycleReturnStatus: 'yes',
      firstReturnedPeriodDate: '2026-09-15',
    });
  });

  it('a new loss date AFTER existing dated journal history is blocked; the history is untouched', async () => {
    await saveMiscarriageJournalField('2026-09-08', 'physicalSymptoms', ['Fatigue']);
    const history = JSON.stringify(getAllMiscarriageJournalEntries());
    const renderer = await renderFlow();
    await navigateTo('MiscarriageDate', {mode: 'edit'});
    await act(async () => {
      dateScreenDay(renderer, 10).props.onPress();
    });
    await press(renderer, 'Enregistrer');

    expect(currentRoute()).toBe('MiscarriageDate');
    expect(textsOf(renderer).some(text => text.includes('journal') && text.includes('8 septembre 2026'))).toBe(true);
    expect(getMiscarriagePreferences().miscarriageDate).toBe('2026-09-01');
    expect(JSON.stringify(getAllMiscarriageJournalEntries())).toBe(history);
  });

  it('a date up to (and including) the first journal day is accepted', async () => {
    const renderer = await renderFlow();
    await navigateTo('MiscarriageDate', {mode: 'edit'});
    await act(async () => {
      dateScreenDay(renderer, 8).props.onPress();
    });
    await press(renderer, 'Enregistrer');
    expect(getMiscarriagePreferences().miscarriageDate).toBe('2026-09-08');
    expect(currentRoute()).toBe('Home');
  });

  it('cancel (Back) without saving leaves every value and the history untouched', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-15'});
    const before = JSON.stringify(getMiscarriagePreferences());
    const history = JSON.stringify(getAllMiscarriageJournalEntries());
    const renderer = await renderFlow();
    await navigateTo('MiscarriageDate', {mode: 'edit'});
    await act(async () => {
      dateScreenDay(renderer, 4).props.onPress();
    });
    await act(async () => {
      navRef.goBack();
    });
    await settle();

    expect(currentRoute()).toBe('Home');
    expect(JSON.stringify(getMiscarriagePreferences())).toBe(before);
    expect(JSON.stringify(getAllMiscarriageJournalEntries())).toBe(history);
  });
});

describe('M36 — legacy invalid cycle-return date is kept, flagged and must be corrected explicitly', () => {
  it('Dashboard: a future stored date is NOT shown as "Depuis le …" (flagged "Date à vérifier") and is left untouched', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-10-20'});
    const renderer = await renderFlow();
    const texts = textsOf(renderer);
    expect(texts).toContain('Date à vérifier');
    expect(texts.some(text => text.startsWith('Depuis le'))).toBe(false);
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-10-20');
  });

  it('Dashboard: a valid stored date still shows "Depuis le …"', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-15'});
    const renderer = await renderFlow();
    expect(textsOf(renderer).some(text => text.startsWith('Depuis le 15 septembre 2026'))).toBe(true);
    expect(textsOf(renderer)).not.toContain('Date à vérifier');
  });

  it('edit screen: shows the "à vérifier" warning, refuses to re-save it, keeps it stored', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-10-20'});
    const renderer = await renderFlow();
    await navigateTo('MiscarriageCycleReturn', {mode: 'edit'});
    expect(textsOf(renderer).some(text => text.startsWith('Date à vérifier :'))).toBe(true);

    await press(renderer, 'Enregistrer');
    expect(alertSpy).toHaveBeenCalledWith('Date invalide', expect.stringContaining('dans le futur'));
    expect(currentRoute()).toBe('MiscarriageCycleReturn');
    expect(getMiscarriagePreferences().firstReturnedPeriodDate).toBe('2026-10-20');
  });

  it('edit screen: explicit correction with a valid date replaces it', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-10-20'});
    const renderer = await renderFlow();
    await navigateTo('MiscarriageCycleReturn', {mode: 'edit'});
    await press(renderer, 'Date du premier jour de tes règles revenues');
    await act(async () => {
      pickerDay(renderer, 12).props.onPress();
    });
    await press(renderer, 'Enregistrer');
    expect(getMiscarriagePreferences()).toMatchObject({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-12'});
    expect(currentRoute()).toBe('Home');
  });

  it('edit screen: "Retirer la date" removes only the date (answer stays "yes") and saving persists it', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-08-15', tryingAgainStatus: 'soon'});
    const renderer = await renderFlow();
    await navigateTo('MiscarriageCycleReturn', {mode: 'edit'});
    await press(renderer, 'Retirer la date');
    await press(renderer, 'Enregistrer');
    expect(getMiscarriagePreferences()).toMatchObject({
      cycleReturnStatus: 'yes',
      firstReturnedPeriodDate: null,
      tryingAgainStatus: 'soon',
      miscarriageDate: '2026-09-01',
    });
  });

  it('edit screen: a valid stored date shows no warning', async () => {
    await seed({cycleReturnStatus: 'yes', firstReturnedPeriodDate: '2026-09-15'});
    const renderer = await renderFlow();
    await navigateTo('MiscarriageCycleReturn', {mode: 'edit'});
    expect(textsOf(renderer).some(text => text.startsWith('Date à vérifier'))).toBe(false);
  });
});
